// Study Quest's sounds, made in the browser with WebAudio: no sound files. Each sound is a few
// oscillators or a burst of noise, shaped by an envelope. The context is made on the first sound,
// which follows the visitor's click on the game's button, as browsers ask.

export type Sfx =
  | "swing"
  | "swing3"
  | "hit"
  | "crit"
  | "kill"
  | "bigKill"
  | "hurt"
  | "evade"
  | "dodge"
  | "card"
  | "eureka"
  | "pickup"
  | "note"
  | "sip"
  | "rank"
  | "quest"
  | "warn"
  | "alarm"
  | "ring"
  | "roar"
  | "charge"
  | "phase"
  | "victory"
  | "defeat"
  | "start"
  | "click";

let ctx: AudioContext | undefined;
let master: GainNode | undefined;
let noiseBuf: AudioBuffer | undefined;
let enabled = true;
/** Seconds when each sound last played, so that a crowd of blows does not stack into a roar. */
const last = new Map<Sfx, number>();

export function setSound(on: boolean): void {
  enabled = on;
  if (master && ctx) master.gain.setTargetAtTime(on ? 0.32 : 0, ctx.currentTime, 0.02);
}

function audio(): AudioContext | undefined {
  if (!enabled) return undefined;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return undefined;
    try {
      ctx = new AC();
    } catch {
      return undefined;
    }
    master = ctx.createGain();
    master.gain.value = 0.32;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  return ctx;
}

function env(g: GainNode, at: number, peak: number, attack: number, decay: number): void {
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
}

function tone(c: AudioContext, at: number, type: OscillatorType, from: number, to: number, dur: number, peak: number, attack = 0.005): void {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from, at);
  if (to !== from) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + dur);
  env(g, at, peak, attack, dur);
  o.connect(g).connect(master!);
  o.start(at);
  o.stop(at + attack + dur + 0.05);
}

function noise(c: AudioContext, at: number, dur: number, freq: number, q: number, peak: number, type: BiquadFilterType = "bandpass", sweepTo?: number): void {
  const s = c.createBufferSource();
  s.buffer = noiseBuf!;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, at);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, at + dur);
  f.Q.value = q;
  const g = c.createGain();
  env(g, at, peak, 0.004, dur);
  s.connect(f).connect(g).connect(master!);
  s.start(at, Math.random() * 0.5);
  s.stop(at + dur + 0.05);
}

/** Plays a sound now. */
export function sfx(name: Sfx, pitch = 1): void {
  const c = audio();
  if (!c || !master) return;
  const now = c.currentTime;
  const gap = name === "hit" || name === "crit" || name === "pickup" ? 0.04 : 0.06;
  if (now - (last.get(name) ?? -1) < gap) return;
  last.set(name, now);
  const p = pitch;
  switch (name) {
    case "swing":
      noise(c, now, 0.12, 1800 * p, 1.2, 0.35, "bandpass", 4200 * p);
      break;
    case "swing3":
      noise(c, now, 0.22, 900, 1, 0.5, "bandpass", 3600);
      tone(c, now, "triangle", 220, 110, 0.18, 0.2);
      break;
    case "hit":
      tone(c, now, "square", 180 * p, 60, 0.08, 0.28);
      noise(c, now, 0.06, 2500, 0.8, 0.3, "highpass");
      break;
    case "crit":
      tone(c, now, "square", 260, 70, 0.12, 0.32);
      tone(c, now, "sine", 1320, 1760, 0.12, 0.16);
      noise(c, now, 0.08, 3200, 0.7, 0.35, "highpass");
      break;
    case "kill":
      tone(c, now, "triangle", 660, 990, 0.12, 0.2);
      tone(c, now + 0.07, "triangle", 990, 1320, 0.14, 0.18);
      noise(c, now, 0.25, 600, 0.6, 0.25, "lowpass", 120);
      break;
    case "bigKill":
      noise(c, now, 0.9, 900, 0.5, 0.5, "lowpass", 60);
      tone(c, now, "sawtooth", 110, 40, 0.8, 0.3);
      [523, 659, 784, 1047].forEach((f, i) => tone(c, now + 0.12 + i * 0.09, "triangle", f, f, 0.3, 0.16));
      break;
    case "hurt":
      tone(c, now, "sawtooth", 220, 80, 0.2, 0.3);
      noise(c, now, 0.18, 400, 1, 0.35, "lowpass");
      break;
    case "evade":
      tone(c, now, "sine", 1200, 2400, 0.12, 0.14);
      break;
    case "dodge":
      noise(c, now, 0.2, 500, 0.8, 0.3, "bandpass", 2000);
      break;
    case "card":
      noise(c, now, 0.1, 3000, 2, 0.25, "bandpass", 6000);
      tone(c, now, "sine", 880, 1320, 0.06, 0.08);
      break;
    case "eureka":
      [392, 523, 659, 784, 1047].forEach((f, i) => tone(c, now + i * 0.03, "triangle", f, f * 1.01, 0.6, 0.12, 0.01));
      noise(c, now, 0.6, 300, 0.5, 0.4, "lowpass", 3000);
      break;
    case "pickup":
      tone(c, now, "sine", 880 * p, 1320 * p, 0.09, 0.16);
      tone(c, now + 0.05, "sine", 1320 * p, 1760 * p, 0.12, 0.12);
      break;
    case "note":
      [784, 988, 1175].forEach((f, i) => tone(c, now + i * 0.06, "triangle", f, f, 0.18, 0.14));
      break;
    case "sip":
      tone(c, now, "sine", 300, 600, 0.15, 0.15);
      tone(c, now + 0.1, "sine", 500, 900, 0.18, 0.12);
      break;
    case "rank":
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(c, now + i * 0.08, "square", f, f, 0.22, 0.08));
      [1047, 1319, 1568].forEach((f) => tone(c, now + 0.45, "triangle", f, f, 0.9, 0.1, 0.02));
      break;
    case "quest":
      [659, 784, 988].forEach((f, i) => tone(c, now + i * 0.1, "triangle", f, f, 0.3, 0.14));
      break;
    case "warn":
      for (let i = 0; i < 3; i++) tone(c, now + i * 0.32, "sawtooth", 440, 330, 0.24, 0.16);
      break;
    case "alarm":
      // An alarm clock's bell: a fast trill of two notes.
      for (let i = 0; i < 14; i++) tone(c, now + i * 0.045, "square", i % 2 ? 1900 : 2300, i % 2 ? 1900 : 2300, 0.04, 0.07);
      break;
    case "ring":
      for (let i = 0; i < 6; i++) tone(c, now + i * 0.05, "square", i % 2 ? 1700 : 2100, i % 2 ? 1700 : 2100, 0.04, 0.05);
      break;
    case "roar":
      tone(c, now, "sawtooth", 70, 45, 1.4, 0.35, 0.1);
      tone(c, now, "sawtooth", 104, 66, 1.4, 0.25, 0.1);
      noise(c, now, 1.4, 200, 0.7, 0.4, "lowpass", 80);
      break;
    case "charge":
      tone(c, now, "sawtooth", 90, 260, 0.6, 0.18, 0.05);
      break;
    case "phase":
      tone(c, now, "sawtooth", 55, 55, 1.6, 0.3, 0.2);
      tone(c, now, "square", 82, 82, 1.6, 0.12, 0.2);
      noise(c, now, 1.2, 1200, 0.5, 0.3, "lowpass", 100);
      break;
    case "victory":
      [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(c, now + i * 0.12, "triangle", f, f, i === 6 ? 1.2 : 0.2, 0.16));
      break;
    case "defeat":
      [392, 349, 311, 262].forEach((f, i) => tone(c, now + i * 0.22, "triangle", f, f * 0.98, 0.5, 0.16));
      break;
    case "start":
      tone(c, now, "sine", 196, 196, 1.2, 0.2, 0.15);
      [392, 587, 784].forEach((f, i) => tone(c, now + 0.25 + i * 0.12, "triangle", f, f, 0.6, 0.1));
      break;
    case "click":
      tone(c, now, "sine", 1400, 1400, 0.03, 0.08);
      break;
  }
}
