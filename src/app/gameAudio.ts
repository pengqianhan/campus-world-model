// Study Quest's sound, made in the browser with WebAudio: no sound files, no library. Two buses, the
// music and the effects, each with its own volume, meet in a compressor and a soft clipper that keeps
// every peak under -1 dBFS. The music is a small sequencer on the AudioContext's clock: a timer wakes
// it every 25 ms and it books the notes of the next 120 ms ahead (look-ahead scheduling), so that a
// slow frame never puts a note late. Its parts fade in and out on the beat as the game's state
// changes (src/shared/music.ts says which, and when). The context is made on the first sound, which
// follows the visitor's click on the game's button, as browsers ask; it sleeps while the page is
// hidden, and the end of a game closes it, which lets every node go.
import {
  LAYERS,
  MUSIC,
  MusicDirector,
  PHRASE,
  STEPS,
  STINGERS,
  VoiceClock,
  dbToGain,
  hitAt,
  midiHz,
  resumeAt,
  sliderGain,
  stepSeconds,
  stepsToSwitch,
  stingerSeconds,
  vary,
  type Cue,
  type CueSpec,
  type Layer,
  type MusicInput,
  type StingerKind,
} from "../shared/music.ts";
import type { FoeKind } from "../shared/game.ts";

export type Sfx =
  | "step"
  | "stepRun"
  | "swing0"
  | "swing1"
  | "swing2"
  | "hit"
  | "hitHeavy"
  | "crit"
  | "kill"
  | "hurt"
  | "evade"
  | "dodge"
  | "sprint"
  | "card"
  | "cardHit"
  | "eurekaReady"
  | "eureka"
  | "book"
  | "coffee"
  | "note"
  | "quest"
  | "warn"
  | "ddlTell"
  | "ddlLash"
  | "yawn"
  | "yawnLash"
  | "buzz"
  | "ding"
  | "whisper"
  | "ghostLash"
  | "heartTell"
  | "whine"
  | "roar"
  | "phase"
  | "charge"
  | "slam"
  | "beam"
  | "pages"
  | "gears"
  | "ink"
  | "bossBreak"
  | "uiMove"
  | "uiConfirm"
  | "start";

/** Seconds of look-ahead, and how often the scheduler wakes. */
const AHEAD = 0.12;
const WAKE_MS = 25;
/** Voices at once: the music's, the effects', and the share of the effects' that small sounds may use. */
const MUSIC_CAP = 56;
const SFX_CAP = 40;
const SMALL_CAP = 24;
/** Levels into the mix at full volume. */
const MUSIC_TRIM = 1.05;
const SFX_TRIM = 1.6;
/** The soft clipper's ceiling: -1.3 dBFS. */
const CEILING = 0.86;

interface Graph {
  ctx: AudioContext;
  /** Every node that lives as long as the context, to be let go at the end. */
  nodes: AudioNode[];
  master: GainNode;
  clip: WaveShaperNode;
  musicVol: GainNode;
  sfxVol: GainNode;
  sfx: GainNode;
  /** The music's dip under big moments, and its muffle under the pause menu. */
  duck: GainNode;
  muffle: BiquadFilterNode;
  muffleGain: GainNode;
  /** Stingers go round the dip, into the music's volume. */
  sting: GainNode;
  layers: Record<Layer, GainNode>;
  /** Where each layer's notes go in: a filter of the layer's own for some, its gain for the rest. */
  inputs: Record<Layer, AudioNode>;
  bassLp: BiquadFilterNode;
  leadLp: BiquadFilterNode;
  padLp: BiquadFilterNode;
  heart: GainNode;
  white: AudioBuffer;
}

let g: Graph | undefined;
let enabled = true;
let musicLevel = 0.7;
let sfxLevel = 0.9;
const voices = { music: new VoiceClock(160), sfx: new VoiceClock(96) };
/** Seconds when each sound last played, so that a crowd of blows does not stack into a roar. */
const last = new Map<Sfx, number>();
let contextsMade = 0;
let contextsClosed = 0;

// The sequencer.
const director = new MusicDirector();
const seq = {
  cue: "none" as Cue,
  want: "none" as Cue,
  step: 0,
  next: 0,
  timer: 0,
  paused: false,
  low: false,
  over: false,
};

// ---------------------------------------------------------------------------------------------
// The context and its graph
// ---------------------------------------------------------------------------------------------

function makeGraph(): Graph | undefined {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return undefined;
  let ctx: AudioContext;
  try {
    ctx = new AC({ latencyHint: "interactive" });
  } catch {
    return undefined;
  }
  contextsMade++;
  const nodes: AudioNode[] = [];
  const keep = <T extends AudioNode>(n: T): T => (nodes.push(n), n);
  const gain = (v: number) => {
    const n = keep(ctx.createGain());
    n.gain.value = v;
    return n;
  };
  const filter = (type: BiquadFilterType, f: number, q = 0.7) => {
    const n = keep(ctx.createBiquadFilter());
    n.type = type;
    n.frequency.value = f;
    n.Q.value = q;
    return n;
  };

  // The end of the chain: a gentle compressor, the master (the sound toggle), the soft clipper.
  const comp = keep(ctx.createDynamicsCompressor());
  comp.threshold.value = -16;
  comp.knee.value = 10;
  comp.ratio.value = 3;
  comp.attack.value = 0.004;
  comp.release.value = 0.2;
  const master = gain(enabled ? 0.5 : 0);
  const clip = keep(ctx.createWaveShaper());
  clip.curve = clipCurve();
  clip.oversample = "none";
  comp.connect(master).connect(clip).connect(ctx.destination);

  const musicVol = gain(sliderGain(musicLevel) * MUSIC_TRIM);
  const sfxVol = gain(sliderGain(sfxLevel) * SFX_TRIM);
  musicVol.connect(comp);
  sfxVol.connect(comp);
  const sfx = gain(1);
  sfx.connect(sfxVol);
  const muffle = filter("lowpass", 18000, 0.5);
  const muffleGain = gain(1);
  const duck = gain(1);
  duck.connect(muffle).connect(muffleGain).connect(musicVol);
  const sting = gain(1);
  sting.connect(muffle);

  const layers = {} as Record<Layer, GainNode>;
  for (const l of LAYERS) {
    layers[l] = gain(0);
    layers[l].connect(duck);
  }
  const bassLp = filter("lowpass", 900, 1.2);
  bassLp.connect(layers.bass);
  const leadLp = filter("lowpass", 3200, 0.6);
  leadLp.connect(layers.lead);
  const padLp = filter("lowpass", 1800, 0.5);
  padLp.connect(layers.pad);
  const snareHp = filter("highpass", 1400, 0.6);
  snareHp.connect(layers.snare);
  const hatHp = filter("highpass", 7000, 0.7);
  hatHp.connect(layers.hat);
  const inputs: Record<Layer, AudioNode> = { ...layers, bass: bassLp, lead: leadLp, pad: padLp, snare: snareHp, hat: hatHp };
  const heart = gain(0.9);
  heart.connect(duck);

  // One second of white noise, made once, read from a random place by every noisy sound.
  const white = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = white.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

  return { ctx, nodes, master, clip, musicVol, sfxVol, sfx, duck, muffle, muffleGain, sting, layers, inputs, bassLp, leadLp, padLp, heart, white };
}

/** y = c·tanh(2x/c) over the shaper's -1..1, after the master's 0.5: unity for quiet sound, never past c. */
function clipCurve() {
  const n = 2048;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = CEILING * Math.tanh((2 * x) / CEILING);
  }
  return curve;
}

/** The context, made on the first call (which follows a click); undefined while the sound is off. */
function audio(): Graph | undefined {
  if (!enabled) return undefined;
  if (!g) {
    g = makeGraph();
    if (!g) return undefined;
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", onGesture, true);
    window.addEventListener("keydown", onGesture, true);
  }
  if (g.ctx.state === "suspended" && !document.hidden) void g.ctx.resume().catch(() => undefined);
  if (!seq.timer && !document.hidden) seq.timer = window.setInterval(schedule, WAKE_MS);
  return g;
}

/** A context that a browser held back until a gesture starts at the visitor's next key or tap. */
function onGesture(): void {
  if (g && enabled && !document.hidden && g.ctx.state === "suspended") void g.ctx.resume().catch(() => undefined);
}

/** A hidden page is silent and costs nothing: the context sleeps and the scheduler stops. */
function onVisibility(): void {
  if (!g) return;
  if (document.hidden) {
    window.clearInterval(seq.timer);
    seq.timer = 0;
    void g.ctx.suspend().catch(() => undefined);
  } else if (enabled) {
    void g.ctx.resume().catch(() => undefined);
    if (!seq.timer) seq.timer = window.setInterval(schedule, WAKE_MS);
  }
}

/** The sound toggle: off mutes everything at once and lets the context sleep. */
export function setSound(on: boolean): void {
  enabled = on;
  if (!g) return;
  const now = g.ctx.currentTime;
  g.master.gain.cancelScheduledValues(now);
  g.master.gain.setTargetAtTime(on ? 0.5 : 0, now, 0.02);
  if (on) {
    void g.ctx.resume().catch(() => undefined);
    if (!seq.timer && !document.hidden) seq.timer = window.setInterval(schedule, WAKE_MS);
  } else {
    window.clearInterval(seq.timer);
    seq.timer = 0;
    const ctx = g.ctx;
    window.setTimeout(() => {
      if (!enabled && ctx.state === "running") void ctx.suspend().catch(() => undefined);
    }, 120);
  }
}

/** The pause menu's two sliders, 0 to 1. */
export function setVolumes(music: number, effects: number): void {
  musicLevel = music;
  sfxLevel = effects;
  if (!g) return;
  const now = g.ctx.currentTime;
  g.musicVol.gain.setTargetAtTime(sliderGain(music) * MUSIC_TRIM, now, 0.03);
  g.sfxVol.gain.setTargetAtTime(sliderGain(effects) * SFX_TRIM, now, 0.03);
}

/** A new game: the music starts again from its title. */
export function resetMusic(): void {
  director.reset();
  seq.over = false;
  seq.want = "none";
}

/** The end of a game: the scheduler stops, every node is let go and the context is closed. */
export function release(): void {
  window.clearInterval(seq.timer);
  seq.timer = 0;
  document.removeEventListener("visibilitychange", onVisibility);
  window.removeEventListener("pointerdown", onGesture, true);
  window.removeEventListener("keydown", onGesture, true);
  director.reset();
  seq.cue = seq.want = "none";
  // The next context's clock starts at nought: so does the sequencer's.
  seq.step = 0;
  seq.next = 0;
  seq.paused = seq.low = seq.over = false;
  voices.music.clear();
  voices.sfx.clear();
  last.clear();
  const was = g;
  g = undefined;
  if (!was) return;
  for (const n of was.nodes) n.disconnect();
  void was.ctx
    .close()
    .then(() => contextsClosed++)
    .catch(() => undefined);
}

/** What the sound is doing, for tests and for the notes on its cost. */
export function audioStats(): { open: number; closed: number; state: string; cue: Cue; timer: boolean; nodes: number; voices: number } {
  const now = g?.ctx.currentTime ?? 0;
  return {
    open: contextsMade - contextsClosed,
    closed: contextsClosed,
    state: g?.ctx.state ?? "none",
    cue: seq.cue,
    timer: !!seq.timer,
    nodes: g?.nodes.length ?? 0,
    voices: g ? voices.music.live(now) + voices.sfx.live(now) : 0,
  };
}

/** For a recording of the mix in a test browser: the context and its last node. */
export function audioTap(): { ctx: AudioContext; node: AudioNode } | undefined {
  return g ? { ctx: g.ctx, node: g.clip } : undefined;
}

// ---------------------------------------------------------------------------------------------
// Voices
// ---------------------------------------------------------------------------------------------

/** A voice that has ended lets go of what it was joined to; one function for all, not one each. */
function ended(this: AudioScheduledSourceNode): void {
  this.disconnect();
}

function env(p: AudioParam, at: number, peak: number, attack: number, decay: number): void {
  p.setValueAtTime(0.0001, at);
  p.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + attack);
  p.exponentialRampToValueAtTime(0.0001, at + attack + decay);
}

/** One oscillator through an envelope into `dest`, gliding from `from` to `to` Hz. */
function tone(dest: AudioNode, at: number, type: OscillatorType, from: number, to: number, dur: number, peak: number, attack = 0.004, clock = voices.sfx): void {
  const c = g!.ctx;
  const o = c.createOscillator();
  const e = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from, at);
  if (to !== from) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + dur);
  env(e.gain, at, peak, attack, dur);
  o.connect(e).connect(dest);
  o.onended = ended;
  o.start(at);
  o.stop(at + attack + dur + 0.03);
  clock.add(at + attack + dur + 0.03);
}

/** A held note: up in `attack`, kept at `peak` for `hold`, then let go over `rel`. */
function held(dest: AudioNode, at: number, type: OscillatorType, hz: number, attack: number, hold: number, rel: number, peak: number, detune = 0): void {
  const c = g!.ctx;
  const o = c.createOscillator();
  const e = c.createGain();
  o.type = type;
  o.frequency.value = hz;
  o.detune.value = detune;
  e.gain.setValueAtTime(0, at);
  e.gain.linearRampToValueAtTime(peak, at + attack);
  e.gain.setValueAtTime(peak, at + attack + hold);
  e.gain.exponentialRampToValueAtTime(0.0001, at + attack + hold + rel);
  o.connect(e).connect(dest);
  o.onended = ended;
  o.start(at);
  o.stop(at + attack + hold + rel + 0.02);
  voices.music.add(at + attack + hold + rel + 0.02);
}

/** A burst of the noise through a filter of its own (effects) or straight into `dest` (the drums' own filters). */
function noise(
  dest: AudioNode,
  at: number,
  dur: number,
  peak: number,
  shape?: { type: BiquadFilterType; f: number; q?: number; to?: number },
  attack = 0.003,
  clock = voices.sfx,
): void {
  const c = g!.ctx;
  const s = c.createBufferSource();
  s.buffer = g!.white;
  const e = c.createGain();
  env(e.gain, at, peak, attack, dur);
  if (shape) {
    const f = c.createBiquadFilter();
    f.type = shape.type;
    f.frequency.setValueAtTime(shape.f, at);
    if (shape.to) f.frequency.exponentialRampToValueAtTime(shape.to, at + dur);
    f.Q.value = shape.q ?? 0.8;
    s.connect(f).connect(e).connect(dest);
  } else s.connect(e).connect(dest);
  s.onended = ended;
  s.start(at, Math.random() * 0.7);
  s.stop(at + attack + dur + 0.03);
  clock.add(at + attack + dur + 0.03);
}

/** A struck bell or a bit of metal: a few sine partials, each dying away. */
function ping(dest: AudioNode, at: number, hz: number, dur: number, peak: number, partials: readonly number[] = [1, 2.76]): void {
  partials.forEach((k, i) => tone(dest, at, "sine", hz * k, hz * k, dur / (1 + i * 0.6), peak / (1 + i * 1.5), 0.002));
}

/**
 * A trill: two tones turned on and off `rate` times a second, as an alarm clock's bell or a phone on
 * a table. One oscillator and its gate, not a voice for each stroke.
 */
function trill(dest: AudioNode, at: number, hz: number, hz2: number, rate: number, dur: number, peak: number, type: OscillatorType = "sine"): void {
  const c = g!.ctx;
  const a = c.createOscillator();
  const b = c.createOscillator();
  const lfo = c.createOscillator();
  const depth = c.createGain();
  const gate = c.createGain();
  const e = c.createGain();
  a.type = b.type = type;
  a.frequency.value = hz;
  b.frequency.value = hz2;
  lfo.type = "square";
  lfo.frequency.value = rate;
  depth.gain.value = 0.5;
  gate.gain.value = 0.5;
  lfo.connect(depth).connect(gate.gain);
  a.connect(gate);
  b.connect(gate);
  gate.connect(e).connect(dest);
  e.gain.setValueAtTime(0.0001, at);
  e.gain.exponentialRampToValueAtTime(peak, at + 0.01);
  e.gain.setValueAtTime(peak, at + dur * 0.7);
  e.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  for (const o of [a, b, lfo]) {
    o.onended = ended;
    o.start(at);
    o.stop(at + dur + 0.03);
  }
  voices.sfx.add(at + dur + 0.03);
  voices.sfx.add(at + dur + 0.03);
}

/** Dips the music for `hold` seconds under a big moment, `db` down, and brings it back. */
function duck(db: number, hold: number): void {
  if (!g) return;
  const p = g.duck.gain;
  const now = g.ctx.currentTime;
  p.cancelScheduledValues(now);
  p.setTargetAtTime(dbToGain(db), now, 0.012);
  p.setTargetAtTime(1, now + hold, 0.22);
}

// ---------------------------------------------------------------------------------------------
// The music
// ---------------------------------------------------------------------------------------------

/**
 * What the game is doing, ten times a second: the cue follows (on the next beat or bar), the music is
 * muffled under the pause menu, and a heartbeat comes in when the walker's Focus is low.
 */
export function setMusic(i: MusicInput & { paused: boolean; low: boolean }): void {
  seq.want = director.update({ ...i, over: i.over || seq.over });
  seq.low = i.low && !i.over && !i.title;
  if (!g) return;
  if (i.paused !== seq.paused) {
    seq.paused = i.paused;
    const now = g.ctx.currentTime;
    g.muffle.frequency.cancelScheduledValues(now);
    g.muffle.frequency.setTargetAtTime(i.paused ? 650 : 18000, now, i.paused ? 0.06 : 0.12);
    g.muffleGain.gain.setTargetAtTime(i.paused ? 0.55 : 1, now, 0.08);
  }
}

/** The scheduler: plays every step due before the clock is AHEAD seconds on. */
function schedule(): void {
  if (!g || g.ctx.state !== "running") return;
  const now = g.ctx.currentTime;
  seq.next = resumeAt(seq.next, now);
  let guard = 64;
  while (seq.next < now + AHEAD && guard-- > 0) {
    if (seq.want !== seq.cue) {
      // Out of silence a cue begins at once, from its first bar; else on the next beat or bar.
      if (seq.cue === "none") {
        seq.step = 0;
        applyCue(seq.want, seq.next);
      } else if (seq.want === "none") applyCue("none", seq.next); else if (stepsToSwitch(seq.step, seq.cue, seq.want) === 0) applyCue(seq.want, seq.next);
    }
    const cue = seq.cue;
    const bpm = cue === "none" ? 100 : MUSIC[cue].bpm;
    if (cue !== "none") {
      playStep(MUSIC[cue], seq.step, seq.next);
      if (seq.low && seq.step % 4 === 0) heartbeat(seq.next, 60 / bpm);
    }
    seq.next += stepSeconds(bpm);
    seq.step = (seq.step + 1) % PHRASE;
  }
}

/** Each layer fades to its level in the new cue, from the beat it lands on, over about a beat. */
function applyCue(cue: Cue, at: number): void {
  const gr = g!;
  const was = seq.cue;
  seq.cue = cue;
  if (cue === "none") {
    for (const l of LAYERS) {
      gr.layers[l].gain.cancelScheduledValues(at);
      gr.layers[l].gain.setTargetAtTime(0, at, 0.25);
    }
    return;
  }
  const spec = MUSIC[cue];
  const beat = 60 / spec.bpm;
  // The drums come in hard on the beat; the rest swell in.
  for (const l of LAYERS) {
    const p = gr.layers[l].gain;
    const to = spec.mix[l] ?? 0;
    p.cancelScheduledValues(at);
    const drum = l === "kick" || l === "snare" || l === "hat" || l === "tick";
    p.setTargetAtTime(to, at, drum && to > 0 ? 0.01 : was === "none" ? 0.05 : beat * 0.3);
  }
  gr.bassLp.frequency.setTargetAtTime(spec.bright, at, 0.1);
  gr.leadLp.frequency.setTargetAtTime(spec.leadWave === "brass" ? spec.bright * 2.2 : 3200, at, 0.1);
  gr.padLp.frequency.setTargetAtTime(spec.padWave === "sawtooth" ? 1100 : 1800, at, 0.1);
}

/** Seconds from a lead note to the next note, at most four steps. */
function leadLength(spec: CueSpec, step: number, dt: number): number {
  let k = 1;
  while (k < 4 && (spec.lead[(step + k) % PHRASE] ?? -1) < 0) k++;
  return k * dt;
}

function playStep(spec: CueSpec, step: number, t: number): void {
  const gr = g!;
  const dt = stepSeconds(spec.bpm);
  const s = step % STEPS;
  const bar = Math.floor(step / STEPS) % spec.chords.length;
  const chord = spec.chords[bar]!;
  const root = spec.roots[bar]!;
  const mix = spec.mix;
  const room = (n: number) => voices.music.room(t, n, MUSIC_CAP);
  const inp = gr.inputs;

  // The pad: the bar's chord, two oscillators a note a little apart, held the whole bar.
  if (s === 0 && mix.pad && room(chord.length * 2)) {
    const hold = dt * STEPS - 0.3;
    for (const n of chord) {
      const hz = midiHz(n);
      const peak = spec.padWave === "sawtooth" ? 0.04 : spec.padWave === "sine" ? 0.08 : 0.05;
      held(inp.pad, t, spec.padWave, hz, 0.25, hold, 0.5, peak, -7);
      held(inp.pad, t, spec.padWave, hz, 0.25, hold, 0.5, peak, 7);
    }
  }
  // A cymbal on each bar.
  if (s === 0 && spec.crash && room(1)) noise(inp.hat, t, 1.1, 0.35, undefined, 0.002, voices.music);

  // The bass.
  const b = hitAt(spec.bass, s);
  if (b !== "." && mix.bass && room(2)) {
    const n = b === "o" ? root + 12 : b === "5" ? root + 7 : root;
    const len = spec.bassWave === "sawtooth" ? dt * 1.6 : dt * 6;
    tone(inp.bass, t, spec.bassWave, midiHz(n), midiHz(n), len, spec.bassWave === "sawtooth" ? 0.32 : 0.5, 0.006, voices.music);
    // Under a driving bass, a sine an octave down keeps it round on small speakers' cut-off.
    if (spec.bassWave === "sawtooth" && b === "x") tone(inp.bass, t, "sine", midiHz(n), midiHz(n), len, 0.28, 0.006, voices.music);
  }

  // The lead.
  const ln = spec.lead[step] ?? -1;
  if (ln >= 0 && mix.lead && room(3)) {
    const len = leadLength(spec, step, dt);
    const hz = midiHz(ln);
    if (spec.leadWave === "pluck") {
      // A marimba: a sine with a soft octave over it, gone quickly.
      tone(inp.lead, t, "sine", hz, hz, Math.min(0.5, len + 0.15), 0.42, 0.003, voices.music);
      tone(inp.lead, t, "triangle", hz * 4, hz * 4, 0.06, 0.05, 0.002, voices.music);
    } else if (spec.leadWave === "bell") {
      // A music box: a pure tone with an inharmonic shimmer.
      tone(inp.lead, t, "sine", hz, hz, 1.6, 0.22, 0.004, voices.music);
      tone(inp.lead, t, "sine", hz * 3.01, hz * 3.01, 0.5, 0.04, 0.002, voices.music);
    } else {
      // Brass: two saws a little apart through the layer's filter.
      tone(inp.lead, t, "sawtooth", hz, hz, len * 0.95, 0.13, 0.02, voices.music);
      tone(inp.lead, t, "sawtooth", hz * 1.004, hz * 1.004, len * 0.95, 0.1, 0.02, voices.music);
    }
  }

  // The arpeggio over the chord.
  const a = hitAt(spec.arp, s);
  if (a !== "." && mix.arp && room(1)) {
    const n = chord[Number(a) % chord.length]! + 12 * spec.arpUp;
    const type = spec.leadWave === "bell" ? "sine" : "triangle";
    tone(inp.arp, t, type, midiHz(n), midiHz(n), spec.leadWave === "bell" ? 0.9 : dt * 1.5, spec.leadWave === "bell" ? 0.14 : 0.12, 0.003, voices.music);
  }

  // The drums.
  const k = hitAt(spec.kick, s);
  if (k !== "." && mix.kick && room(1)) tone(inp.kick, t, "sine", 150, 42, 0.16, k === "o" ? 0.5 : 0.95, 0.002, voices.music);
  const sn = hitAt(spec.snare, s);
  if (sn !== "." && mix.snare && room(2)) {
    const v = sn === "o" ? 0.35 : 1;
    noise(inp.snare, t, 0.12, 0.55 * v, undefined, 0.002, voices.music);
    tone(gr.layers.snare, t, "triangle", 200, 150, 0.07, 0.3 * v, 0.002, voices.music);
  }
  const h = hitAt(spec.hat, s);
  if (h !== "." && mix.hat && room(1)) noise(inp.hat, t, h === "o" ? 0.03 : 0.05, h === "o" ? 0.22 : 0.4, undefined, 0.001, voices.music);
  // The clock: a woodblock tick and a lower tock.
  const tk = hitAt(spec.tick, s);
  if (tk !== "." && mix.tick && room(2)) {
    const hz = tk === "t" ? 1850 : 1320;
    tone(inp.tick, t, "sine", hz, hz * 0.97, 0.035, 0.5, 0.001, voices.music);
    tone(inp.tick, t, "square", hz * 2.3, hz * 2.3, 0.012, 0.06, 0.001, voices.music);
  }
}

/** Low Focus: a heartbeat on each beat, lub and dub. */
function heartbeat(t: number, beat: number): void {
  if (!g || !voices.music.room(t, 2, MUSIC_CAP)) return;
  const gap = Math.min(0.2, beat * 0.32);
  tone(g.heart, t, "sine", 62, 40, 0.14, 0.6, 0.004, voices.music);
  tone(g.heart, t + gap, "sine", 56, 38, 0.12, 0.38, 0.004, voices.music);
}

/**
 * A stinger: the victory, the defeat or a rank risen, on the next eighth of the music's grid, with
 * the music dipped under it.
 */
export function stinger(kind: StingerKind): void {
  const gr = audio();
  if (!gr) return;
  if (kind !== "rank") seq.over = true;
  const s = STINGERS[kind];
  const now = gr.ctx.currentTime;
  // On the music's grid when it plays: the next even step after now.
  let at = now + 0.03;
  if (seq.cue !== "none" && seq.timer) {
    const dt = stepSeconds(MUSIC[seq.cue].bpm);
    at = seq.next;
    let st = seq.step;
    while (at < now + 0.02 || st % 2 !== 0) {
      at += dt;
      st++;
    }
  }
  const beat = 60 / s.bpm;
  const len = stingerSeconds(s);
  duck(kind === "rank" ? -9 : -18, (at - now) + len * (kind === "rank" ? 0.8 : 1));
  const dest = gr.sting;
  // Its own filter, opening as it plays: one node for the whole stinger.
  const f = gr.ctx.createBiquadFilter();
  f.type = "lowpass";
  f.Q.value = 0.8;
  f.frequency.setValueAtTime(s.wave === "brass" ? 900 : 2400, at);
  f.frequency.linearRampToValueAtTime(s.wave === "brass" ? 3600 : 2400, at + len * 0.5);
  const e = gr.ctx.createGain();
  e.gain.value = 1;
  f.connect(e).connect(dest);
  window.setTimeout(() => (f.disconnect(), e.disconnect()), (at - now + len + 0.5) * 1000);
  for (const [b, n, d] of s.notes) {
    const t = at + b * beat;
    const hz = midiHz(n);
    if (s.wave === "brass") {
      held(f, t, "sawtooth", hz, 0.02, Math.max(0.05, d * beat - 0.08), 0.25, 0.1, -5);
      held(f, t, "sawtooth", hz, 0.02, Math.max(0.05, d * beat - 0.08), 0.25, 0.08, 6);
    } else {
      tone(f, t, "sine", hz, hz, d * beat + 0.6, 0.3, 0.005, voices.music);
      tone(f, t, "triangle", hz * 2, hz * 2, d * beat * 0.5, 0.05, 0.004, voices.music);
    }
  }
  const ct = at + s.chordAt * beat;
  for (const n of s.chord) held(f, ct, s.wave === "brass" ? "sawtooth" : "triangle", midiHz(n), 0.05, s.chordBeats * beat, 0.6, s.wave === "brass" ? 0.045 : 0.07, 3);
  if (kind === "rank") ping(dest, ct, 2093, 0.9, 0.05, [1, 1.5, 2.01]);
  if (s.roll) {
    // Timpani: a rolled low drum under the start, swelling into the held chord.
    noise(dest, at, s.chordAt * beat, 0.25, { type: "lowpass", f: 180, q: 1.5 }, s.chordAt * beat * 0.8, voices.music);
    tone(dest, ct, "sine", 98, 70, 0.9, 0.5, 0.005, voices.music);
  }
}

// ---------------------------------------------------------------------------------------------
// The effects
// ---------------------------------------------------------------------------------------------

/** How much each sound matters when the voices run short: 0 goes first. */
const PRIORITY: Partial<Record<Sfx, number>> = { step: 0, stepRun: 0, buzz: 0, whine: 1, pages: 1, gears: 1, ink: 1, book: 1, swing0: 1, swing1: 1, uiMove: 1 };
/** Rough voices each sound takes. */
const COST: Partial<Record<Sfx, number>> = { pages: 6, gears: 6, bossBreak: 14, roar: 5, phase: 8, eureka: 7, crit: 5, book: 5, note: 4, quest: 5, ink: 4, ddlTell: 2 };
/** Seconds before the same sound may play again. */
const GAP: Partial<Record<Sfx, number>> = { hit: 0.035, crit: 0.035, step: 0.12, stepRun: 0.1, book: 0.05, buzz: 0.08, uiMove: 0.04, pages: 0.05, gears: 0.05, ink: 0.05 };

let footSide = 0;

/** Plays a sound now, a little different each time; `k` is a sound's own number (a tell's length). */
export function sfx(name: Sfx, k = 1): void {
  const gr = audio();
  if (!gr) return;
  const now = gr.ctx.currentTime;
  if (now - (last.get(name) ?? -1) < (GAP[name] ?? 0.06)) return;
  const pri = PRIORITY[name] ?? 2;
  const cost = COST[name] ?? 3;
  if (!voices.sfx.room(now, cost, pri === 0 ? SMALL_CAP : SFX_CAP) && pri < 3) return;
  last.set(name, now);
  const r = vary(Math.random(), Math.random());
  const p = r.pitch;
  const v = r.gain;
  const out = gr.sfx;
  const t = now + 0.005;
  switch (name) {
    case "step":
    case "stepRun": {
      // A soft scuff and a low tap, each foot a touch different.
      const run = name === "stepRun";
      const side = (footSide = 1 - footSide) ? 1 : 0.93;
      noise(out, t, run ? 0.06 : 0.045, (run ? 0.11 : 0.08) * v, { type: "lowpass", f: 900 * p * side, to: 300 });
      tone(out, t, "sine", 120 * p * side, 70, 0.04, (run ? 0.12 : 0.08) * v);
      break;
    }
    case "swing0":
      noise(out, t, 0.11, 0.32 * v, { type: "bandpass", f: 1300 * p, q: 1.4, to: 3800 * p });
      break;
    case "swing1":
      noise(out, t, 0.1, 0.32 * v, { type: "bandpass", f: 1900 * p, q: 1.6, to: 4800 * p });
      break;
    case "swing2":
      // The overhead slam: a longer, lower whoosh with weight in it.
      noise(out, t, 0.24, 0.45 * v, { type: "bandpass", f: 650 * p, q: 1, to: 3000 * p });
      tone(out, t, "triangle", 190 * p, 85, 0.2, 0.16 * v, 0.02);
      break;
    case "hit":
      // A light blow: a short thump and a snap.
      tone(out, t, "sine", 230 * p, 70, 0.07, 0.42 * v);
      noise(out, t, 0.035, 0.24 * v, { type: "highpass", f: 2600 * p });
      break;
    case "hitHeavy":
      // A finisher: deeper, longer, with a crunch.
      tone(out, t, "sine", 140 * p, 42, 0.2, 0.62 * v);
      tone(out, t, "square", 95 * p, 40, 0.1, 0.1 * v);
      noise(out, t, 0.16, 0.42 * v, { type: "lowpass", f: 1500 * p, to: 200 });
      duck(-4, 0.12);
      break;
    case "crit":
      // A critical: the thump, a crack, and a bright ring that hangs a moment.
      tone(out, t, "sine", 260 * p, 60, 0.1, 0.5 * v);
      noise(out, t, 0.06, 0.32 * v, { type: "highpass", f: 4200 });
      ping(out, t + 0.01, 1568 * p, 0.38, 0.13 * v, [1, 1.51, 2.76]);
      duck(-5, 0.18);
      break;
    case "kill":
      // A small foe gone: a pop that rises.
      tone(out, t, "triangle", 620 * p, 1240 * p, 0.1, 0.16 * v);
      tone(out, t + 0.06, "triangle", 930 * p, 1660 * p, 0.12, 0.12 * v);
      break;
    case "hurt":
      tone(out, t, "sine", 80 * p, 38, 0.22, 0.5 * v);
      tone(out, t, "sawtooth", 230 * p, 90, 0.16, 0.12 * v);
      noise(out, t, 0.18, 0.32 * v, { type: "lowpass", f: 700 });
      duck(-5, 0.2);
      break;
    case "evade":
      tone(out, t, "sine", 1200 * p, 2400 * p, 0.1, 0.12 * v);
      noise(out, t, 0.05, 0.06 * v, { type: "highpass", f: 6000 });
      break;
    case "dodge":
    case "sprint": {
      // A whoosh that passes from one side to the other; the sprint's is brighter, with a rising hum.
      const sprint = name === "sprint";
      const c = gr.ctx;
      const pan = c.createStereoPanner();
      pan.pan.setValueAtTime(-0.6, t);
      pan.pan.linearRampToValueAtTime(0.6, t + 0.24);
      pan.connect(out);
      noise(pan, t, sprint ? 0.3 : 0.22, (sprint ? 0.36 : 0.3) * v, { type: "bandpass", f: (sprint ? 900 : 420) * p, q: 0.9, to: (sprint ? 5200 : 2300) * p }, 0.03);
      if (sprint) tone(pan, t, "triangle", 140 * p, 330 * p, 0.26, 0.08 * v, 0.03);
      window.setTimeout(() => pan.disconnect(), 600);
      break;
    }
    case "card":
      // A flick of card through the air.
      noise(out, t, 0.08, 0.22 * v, { type: "bandpass", f: 3200 * p, q: 3, to: 7000 * p });
      tone(out, t, "sine", 1150 * p, 1750 * p, 0.05, 0.06 * v);
      break;
    case "cardHit":
      // It lands: a papery thwack.
      noise(out, t, 0.045, 0.28 * v, { type: "bandpass", f: 2100 * p, q: 1 });
      tone(out, t, "triangle", 620 * p, 290, 0.05, 0.16 * v);
      break;
    case "eurekaReady":
      // The Eureka is charged: a rising shimmer.
      [1047, 1319, 1568, 2093].forEach((f, i) => tone(out, t + i * 0.045, "sine", f, f * 1.003, 0.45, 0.06 * v, 0.006));
      break;
    case "eureka":
      // The burst: a deep boom under a bright chord and a rushing wash.
      tone(out, t, "sine", 95, 34, 0.5, 0.55 * v);
      [523, 659, 784, 1047].forEach((f, i) => tone(out, t + i * 0.02, "triangle", f, f * 1.01, 0.6, 0.09 * v, 0.01));
      noise(out, t, 0.5, 0.35 * v, { type: "lowpass", f: 300, to: 4500 }, 0.02);
      duck(-8, 0.35);
      break;
    case "book":
      // Pages riffled, and a two-note chime.
      for (let i = 0; i < 3; i++) noise(out, t + i * 0.028, 0.03, 0.11 * v, { type: "highpass", f: 3000 * p });
      tone(out, t + 0.04, "sine", 1175 * p, 1175 * p, 0.12, 0.13 * v);
      tone(out, t + 0.1, "sine", 1568 * p, 1568 * p, 0.16, 0.11 * v);
      break;
    case "coffee":
      // A sip: two bubbling bloops and a soft slurp.
      tone(out, t, "sine", 300 * p, 720 * p, 0.09, 0.2 * v);
      tone(out, t + 0.09, "sine", 440 * p, 960 * p, 0.1, 0.17 * v);
      noise(out, t, 0.14, 0.08 * v, { type: "lowpass", f: 900 });
      break;
    case "note":
      [988, 1319, 1760].forEach((f, i) => tone(out, t + i * 0.055, "triangle", f * p, f * p, 0.18, 0.1 * v));
      tone(out, t + 0.16, "sine", 2637 * p, 2637 * p, 0.3, 0.035 * v);
      break;
    case "quest":
      [659, 784, 988, 1319].forEach((f, i) => tone(out, t + i * 0.09, "triangle", f, f, 0.32, 0.12 * v, 0.004));
      ping(out, t + 0.27, 1319, 0.8, 0.05, [1, 2.01]);
      break;
    case "warn":
      // A wave on its way: a falling horn, three times.
      for (let i = 0; i < 3; i++) tone(out, t + i * 0.3, "sawtooth", 440, 330, 0.22, 0.09 * v, 0.01);
      break;
    case "ddlTell":
      // The DDL's alarm clock rings before it strikes.
      trill(out, t, 2150 * p, 2150 * 2.71 * p, 22, 0.5, 0.14 * v);
      break;
    case "ddlLash":
      // It lands: a heavy clang.
      tone(out, t, "sine", 170 * p, 55, 0.26, 0.5 * v);
      noise(out, t, 0.28, 0.36 * v, { type: "lowpass", f: 1600, to: 150 });
      ping(out, t, 690 * p, 0.45, 0.09 * v, [1, 1.63]);
      duck(-4, 0.2);
      break;
    case "yawn":
      // Procrastination's yawn: a voice-like "aaah" sliding down, closing to "mm".
      {
        const c = gr.ctx;
        const o = c.createOscillator();
        const f = c.createBiquadFilter();
        const e = c.createGain();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(210 * p, t);
        o.frequency.exponentialRampToValueAtTime(125 * p, t + 0.9);
        f.type = "bandpass";
        f.Q.value = 3.5;
        f.frequency.setValueAtTime(820, t);
        f.frequency.exponentialRampToValueAtTime(380, t + 0.9);
        e.gain.setValueAtTime(0.0001, t);
        e.gain.exponentialRampToValueAtTime(0.3 * v, t + 0.18);
        e.gain.exponentialRampToValueAtTime(0.0001, t + 1);
        o.connect(f).connect(e).connect(out);
        o.onended = ended;
        o.start(t);
        o.stop(t + 1.02);
        voices.sfx.add(t + 1.02);
      }
      break;
    case "yawnLash":
      noise(out, t, 0.5, 0.26 * v, { type: "lowpass", f: 650, to: 180 }, 0.05);
      break;
    case "buzz":
      // A phone buzzing on a table: two short pulses of a low square, through a lowpass.
      trill(out, t, 172 * p, 176 * p, 9, 0.26, 0.1 * v, "square");
      break;
    case "ding":
      // A notification.
      tone(out, t, "sine", 1760 * p, 1760 * p, 0.22, 0.08 * v);
      tone(out, t + 0.07, "sine", 2637 * p, 2637 * p, 0.25, 0.06 * v);
      break;
    case "whisper":
      // Plagiarism's whisper: breathy noise through a narrow band that wanders.
      noise(out, t, 0.6, 0.2 * v, { type: "bandpass", f: 1800 * p, q: 6, to: 3400 * p }, 0.12);
      noise(out, t + 0.25, 0.25, 0.07 * v, { type: "highpass", f: 5500 }, 0.05);
      break;
    case "ghostLash":
      tone(out, t, "triangle", 900 * p, 430 * p, 0.35, 0.12 * v, 0.02);
      tone(out, t, "sine", 905 * p, 435 * p, 0.35, 0.08 * v, 0.02);
      break;
    case "heartTell":
      // Anxiety: a pounding heart and a thin rising whine.
      tone(out, t, "sine", 62, 40, 0.12, 0.42 * v);
      tone(out, t + 0.17, "sine", 56, 38, 0.11, 0.28 * v);
      tone(out, t, "sine", 1750 * p, 2350 * p, 0.5, 0.04 * v, 0.2);
      break;
    case "whine":
      // A thrown worry: two near tones that beat as they fall.
      tone(out, t, "sine", 2200 * p, 1400 * p, 0.3, 0.06 * v);
      tone(out, t, "sine", 2213 * p, 1409 * p, 0.3, 0.05 * v);
      break;
    case "roar":
      // The Final Exam arrives.
      tone(out, t, "sawtooth", 72 * p, 46, 1.3, 0.24 * v, 0.1);
      tone(out, t, "sawtooth", 106 * p, 68, 1.3, 0.18 * v, 0.1);
      tone(out, t, "sine", 48, 36, 1.2, 0.42 * v, 0.08);
      noise(out, t, 1.3, 0.38 * v, { type: "lowpass", f: 420, to: 90 }, 0.08);
      duck(-9, 1.2);
      break;
    case "phase":
      // Its change of phase: a roar, a falling rush and a great gong.
      tone(out, t, "sawtooth", 66, 44, 1.4, 0.24 * v, 0.12);
      tone(out, t, "sine", 46, 34, 1.4, 0.4 * v, 0.08);
      noise(out, t, 1.1, 0.3 * v, { type: "bandpass", f: 3200, q: 0.8, to: 220 }, 0.05);
      ping(out, t + 0.05, 98, 2.2, 0.32 * v, [1, 2.76, 5.4]);
      duck(-10, 1.7);
      break;
    case "charge": {
      // A warning on the ground fills: a rising, resonant charge as long as the warning.
      const len = Math.max(0.4, Math.min(1.8, k));
      const c = gr.ctx;
      const o = c.createOscillator();
      const f = c.createBiquadFilter();
      const e = c.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(80 * p, t);
      o.frequency.exponentialRampToValueAtTime(320 * p, t + len);
      f.type = "lowpass";
      f.Q.value = 7;
      f.frequency.setValueAtTime(280, t);
      f.frequency.exponentialRampToValueAtTime(2600, t + len);
      e.gain.setValueAtTime(0.0001, t);
      e.gain.exponentialRampToValueAtTime(0.12 * v, t + len * 0.85);
      e.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.06);
      o.connect(f).connect(e).connect(out);
      o.onended = ended;
      o.start(t);
      o.stop(t + len + 0.08);
      voices.sfx.add(t + len + 0.08);
      noise(out, t, len, 0.05 * v, { type: "highpass", f: 1500, to: 7000 }, len * 0.8);
      break;
    }
    case "slam":
      tone(out, t, "sine", 72 * p, 30, 0.5, 0.62 * v);
      noise(out, t, 0.5, 0.48 * v, { type: "lowpass", f: 900, to: 100 });
      noise(out, t, 0.1, 0.2 * v, { type: "highpass", f: 1500 });
      duck(-6, 0.3);
      break;
    case "beam":
      tone(out, t, "sawtooth", 220 * p, 200 * p, 0.45, 0.07 * v, 0.02);
      tone(out, t, "sawtooth", 224 * p, 203 * p, 0.45, 0.07 * v, 0.02);
      noise(out, t, 0.4, 0.12 * v, { type: "bandpass", f: 1300, q: 2 });
      break;
    case "pages":
      // Paper breaking up: a rustle of short crisp bursts.
      for (let i = 0; i < 6; i++) noise(out, t + Math.random() * 0.25, 0.04 + Math.random() * 0.04, 0.14 * v, { type: "highpass", f: 2400 + Math.random() * 2400 });
      break;
    case "gears":
      // Clockwork breaking up: small metal clinks and a spring.
      for (let i = 0; i < 4; i++) {
        const f = [1400, 1900, 2600, 3100, 3700][Math.floor(Math.random() * 5)]! * p;
        tone(out, t + Math.random() * 0.22, "sine", f, f, 0.14, 0.07 * v, 0.001);
      }
      tone(out, t, "triangle", 320 * p, 140, 0.16, 0.1 * v);
      break;
    case "ink":
      // Ink: a wet splat and a drip or two.
      noise(out, t, 0.18, 0.32 * v, { type: "lowpass", f: 950, to: 200 });
      tone(out, t, "sine", 420 * p, 120, 0.12, 0.2 * v);
      tone(out, t + 0.15, "sine", 900 * p, 1400 * p, 0.05, 0.05 * v);
      tone(out, t + 0.26, "sine", 820 * p, 1300 * p, 0.05, 0.04 * v);
      break;
    case "bossBreak":
      // The Final Exam breaks up: a deep boom, then its paper, gears and ink.
      tone(out, t, "sine", 70, 28, 0.9, 0.6 * v);
      noise(out, t, 0.9, 0.5 * v, { type: "lowpass", f: 900, to: 60 });
      for (let i = 0; i < 5; i++) noise(out, t + 0.1 + Math.random() * 0.6, 0.06, 0.14, { type: "highpass", f: 2600 + Math.random() * 2000 });
      for (let i = 0; i < 4; i++) {
        const f = 1500 + Math.random() * 2200;
        tone(out, t + 0.15 + Math.random() * 0.5, "sine", f, f, 0.16, 0.07, 0.001);
      }
      duck(-12, 0.9);
      break;
    case "uiMove":
      tone(out, t, "sine", 1500 * p, 1500 * p, 0.025, 0.06 * v);
      break;
    case "uiConfirm":
      tone(out, t, "sine", 880, 1320, 0.06, 0.1 * v);
      tone(out, t + 0.05, "sine", 1320, 1320, 0.09, 0.07 * v);
      break;
    case "start":
      tone(out, t, "sine", 196, 196, 1.2, 0.18, 0.15);
      [392, 587, 784].forEach((f, i) => tone(out, t + 0.25 + i * 0.12, "triangle", f, f, 0.6, 0.09));
      break;
  }
}

/** A foe's warning, before it strikes. */
export function tellSound(kind: FoeKind, move: string, seconds: number): void {
  if (kind === "ddl") sfx("ddlTell");
  else if (kind === "procrastination") sfx("yawn");
  else if (kind === "distraction") sfx("buzz");
  else if (kind === "plagiarism") sfx("whisper");
  else if (kind === "anxiety") sfx("heartTell");
  else sfx("charge", move === "slam" || move === "beams" || move === "wave" || move === "charge" ? seconds : Math.min(0.6, seconds));
}

/** A foe's attack, as it lands. */
export function lashSound(kind: FoeKind, move: string): void {
  if (kind === "ddl") sfx("ddlLash");
  else if (kind === "procrastination") sfx("yawnLash");
  else if (kind === "distraction") sfx("ding");
  else if (kind === "plagiarism") sfx("ghostLash");
  else if (kind === "anxiety") sfx("whine");
  else if (move === "beams") sfx("beam");
  else if (move === "orb" || move === "summon") sfx("whine");
  else sfx("slam");
}

/** A foe beaten: it breaks up into the stuff of its trouble, each with its sound. */
export function deathSound(kind: FoeKind): void {
  if (kind === "exam") {
    sfx("bossBreak");
    return;
  }
  sfx("kill");
  if (kind === "ddl") {
    sfx("gears");
    sfx("ddlLash");
  } else if (kind === "procrastination" || kind === "plagiarism") sfx("pages");
  else if (kind === "distraction") {
    sfx("ink");
    sfx("gears");
  } else sfx("ink");
}
