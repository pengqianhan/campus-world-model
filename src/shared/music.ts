// Study Quest's music, as data and pure rules: which cue plays for the game's state, the cues' tempos,
// chords and patterns, when a change of cue may land, the scheduler's sums, and a count of the voices
// that sound. The sound itself is made in src/app/gameAudio.ts with WebAudio; nothing here touches it,
// so all of it can be tested. Every melody and progression here was written for this game.

export type Cue = "none" | "title" | "explore" | "combat" | "ddl" | "boss1" | "boss2" | "boss3";
export const CUES: readonly Cue[] = ["none", "title", "explore", "combat", "ddl", "boss1", "boss2", "boss3"];

/** The music's parts, each with a gain of its own that fades in and out on the beat. */
export type Layer = "pad" | "bass" | "lead" | "arp" | "kick" | "snare" | "hat" | "tick";
export const LAYERS: readonly Layer[] = ["pad", "bass", "lead", "arp", "kick", "snare", "hat", "tick"];

/** Sixteen steps a bar, four bars a phrase. */
export const STEPS = 16;
export const BARS = 4;
export const PHRASE = STEPS * BARS;

export interface CueSpec {
  bpm: number;
  /** For the table in the notes: the key it is in. */
  key: string;
  /** The pad's notes, one chord a bar (MIDI). */
  chords: readonly (readonly number[])[];
  /** The bass's root, one a bar (MIDI). */
  roots: readonly number[];
  /** The pad's and the lead's and the bass's waves. */
  padWave: OscillatorType;
  leadWave: "pluck" | "bell" | "brass";
  bassWave: OscillatorType;
  /** Each layer's level, 0 to 1; a layer at 0 is not played at all. */
  mix: Partial<Record<Layer, number>>;
  /** 64 steps: a MIDI note or -1. */
  lead: Int16Array;
  /** 16 steps, the same each bar: x the root, o its octave, 5 its fifth, . rest. */
  bass: string;
  kick: string;
  /** x a hit, o a soft one. */
  snare: string;
  hat: string;
  /** The ticking clock: t the tick, k the tock. */
  tick: string;
  /** Index into the bar's chord, or ., and how many octaves up. */
  arp: string;
  arpUp: number;
  /** A cymbal at the start of each bar. */
  crash?: boolean;
  /** Bass and lead filter's cut-off, Hz. */
  bright: number;
  /**
   * The level, 0 to 1, of a saturated copy of the bass and the kick, high-passed: the overtones
   * that a phone's small speaker plays when it cannot play their fundamentals, so a heavy low end
   * still reads. Absent: none.
   */
  grit?: number;
}

/** "69 . . 66" into notes and rests. */
export function parseNotes(s: string): Int16Array {
  const tokens = s.trim().split(/\s+/);
  const out = new Int16Array(tokens.length);
  tokens.forEach((t, i) => (out[i] = t === "." ? -1 : Number(t)));
  return out;
}

const EMPTY = "................";

// D major: the campus in the morning. The lead is a soft pluck, like a marimba.
const D_CHORDS = [
  [57, 61, 64, 66], // Dmaj9 (no root: the bass has it)
  [59, 62, 66, 69], // Bm7
  [55, 59, 62, 66], // Gmaj7
  [57, 62, 64, 67], // A7sus4
];
const D_ROOTS = [38, 35, 43, 45];
const D_LEAD = parseNotes(`
  69 . . 66 . . 71 . 69 . 66 . 64 . . .
  66 . . 69 . . 74 . 73 . 71 . 69 . . .
  67 . . 71 . . 74 . 78 . 76 . 74 . 71 .
  69 . . 71 . . 69 . 67 . 64 . 66 . . .`);

// C minor with a major V: the Final Exam.
const C_CHORDS = [
  [55, 60, 63, 67], // Cm
  [56, 60, 63, 68], // Ab
  [53, 56, 60, 65], // Fm
  [55, 59, 62, 67], // G
];
const C_ROOTS = [36, 32, 41, 43];
const C_LEAD = parseNotes(`
  72 . . 75 . . 74 . 72 . . 67 . 68 . 67
  68 . . 72 . . 70 . 68 . . 65 . 67 . 68
  65 . . 68 . . 72 . 77 . 75 . 74 . 72 .
  71 . . 74 . . 77 . 79 . . . 74 . 71 .`);

export const MUSIC: Record<Exclude<Cue, "none">, CueSpec> = {
  // Slow and open, a music box over a soft pad: waiting to begin.
  title: {
    bpm: 80,
    key: "G major (IV-I-ii-V of D)",
    chords: [
      [55, 59, 62, 66], // Gmaj7
      [54, 57, 62, 69], // D/F#
      [52, 55, 59, 62], // Em7
      [57, 62, 64, 69], // Asus4
    ],
    roots: [43, 42, 40, 45],
    padWave: "sine",
    leadWave: "bell",
    bassWave: "sine",
    mix: { pad: 0.55, bass: 0.35, lead: 0.5, arp: 0.32 },
    lead: parseNotes(`
      74 . . . . . 78 . . . 76 . . . . .
      74 . . . . . . . 73 . . . . . . .
      71 . . . . . 74 . . . . . 76 . . .
      76 . . . . . . . 73 . . . . . . .`),
    bass: "x.......5.......",
    kick: EMPTY,
    snare: EMPTY,
    hat: EMPTY,
    tick: EMPTY,
    arp: "0.1.2.3.2.1.3.2.",
    arpUp: 1,
    bright: 1800,
  },
  // Light and curious: a pluck melody, a shaker, a bass that walks under it.
  explore: {
    bpm: 100,
    key: "D major",
    chords: D_CHORDS,
    roots: D_ROOTS,
    padWave: "triangle",
    leadWave: "pluck",
    bassWave: "triangle",
    mix: { pad: 0.42, bass: 0.45, lead: 0.55, hat: 0.22 },
    lead: D_LEAD,
    bass: "x.......x...o...",
    kick: EMPTY,
    snare: EMPTY,
    hat: "..o...o...o...o.",
    tick: EMPTY,
    arp: EMPTY,
    arpUp: 0,
    bright: 900,
  },
  // The same tune with drums and a driving bass come in.
  combat: {
    bpm: 100,
    key: "D major",
    chords: D_CHORDS,
    roots: D_ROOTS,
    padWave: "triangle",
    leadWave: "pluck",
    bassWave: "sawtooth",
    mix: { pad: 0.36, bass: 0.6, lead: 0.5, arp: 0.18, kick: 0.85, snare: 0.6, hat: 0.3 },
    lead: D_LEAD,
    bass: "x.x.o.x.x.x.o.x.",
    kick: "x...x..xx...x...",
    snare: "....x.......x..o",
    hat: "x.x.x.x.x.x.x.x.",
    tick: EMPTY,
    arp: "0.1.2.1.0.1.2.3.",
    arpUp: 1,
    bright: 1100,
  },
  // A deadline: the fight's beat with a clock ticking in it, tick and tock on every eighth.
  ddl: {
    bpm: 100,
    key: "D major",
    chords: D_CHORDS,
    roots: D_ROOTS,
    padWave: "triangle",
    leadWave: "pluck",
    bassWave: "sawtooth",
    mix: { pad: 0.3, bass: 0.62, lead: 0.4, kick: 0.85, snare: 0.6, hat: 0.18, tick: 0.55 },
    lead: D_LEAD,
    bass: "x.x.x.x.x.x.x.x.",
    kick: "x..x..x.x..x..x.",
    snare: "....x.......x.xo",
    hat: ".o.o.o.o.o.o.o.o",
    tick: "t.k.t.k.t.k.t.k.",
    arp: EMPTY,
    arpUp: 0,
    bright: 1200,
  },
  // The Final Exam, phase I: heavy and sure.
  boss1: {
    bpm: 112,
    key: "C minor (harmonic)",
    chords: C_CHORDS,
    roots: C_ROOTS,
    padWave: "sawtooth",
    leadWave: "brass",
    bassWave: "sawtooth",
    mix: { pad: 0.3, bass: 0.62, lead: 0.42, kick: 0.9, snare: 0.6, hat: 0.22 },
    lead: C_LEAD,
    bass: "x..x..x.x..x..x.",
    kick: "x...x...x...x...",
    snare: "....x.......x...",
    hat: "..x...x...x...x.",
    tick: EMPTY,
    arp: EMPTY,
    arpUp: 0,
    bright: 900,
    grit: 0.55,
  },
  // Phase II: faster, an arpeggio and eighths on the hats.
  boss2: {
    bpm: 124,
    key: "C minor (harmonic)",
    chords: C_CHORDS,
    roots: C_ROOTS,
    padWave: "sawtooth",
    leadWave: "brass",
    bassWave: "sawtooth",
    mix: { pad: 0.28, bass: 0.62, lead: 0.48, arp: 0.24, kick: 0.9, snare: 0.65, hat: 0.26 },
    lead: C_LEAD,
    bass: "x.xx.xx.x.xx.xx.",
    kick: "x...x...x...x.x.",
    snare: "....x..o....x...",
    hat: "x.x.x.x.x.x.x.x.",
    tick: EMPTY,
    arp: "0121012101210121",
    arpUp: 1,
    bright: 1300,
    grit: 0.5,
  },
  // Phase III: urgent. Sixteenths in the bass and the hats, the clock back in, a cymbal each bar.
  boss3: {
    bpm: 140,
    key: "C minor (harmonic)",
    chords: C_CHORDS,
    roots: C_ROOTS,
    padWave: "sawtooth",
    leadWave: "brass",
    bassWave: "sawtooth",
    mix: { pad: 0.26, bass: 0.6, lead: 0.5, arp: 0.24, kick: 0.95, snare: 0.7, hat: 0.24, tick: 0.3 },
    lead: C_LEAD,
    bass: "xoxoxoxoxoxoxoxo",
    kick: "x.x.x.x.x.x.x.xx",
    snare: "....x.x.....x.xx",
    hat: "xoxoxoxoxoxoxoxo",
    tick: "t...k...t...k...",
    arp: "0123210301232103",
    arpUp: 2,
    crash: true,
    bright: 1700,
    grit: 0.3,
  },
};

/** A stinger: notes in beats from its start, at its own tempo, with a chord held under the last. */
export interface Stinger {
  bpm: number;
  key: string;
  notes: readonly (readonly [beat: number, midi: number, beats: number])[];
  chord: readonly number[];
  chordAt: number;
  chordBeats: number;
  wave: "brass" | "bell";
  /** A timpani roll under the start. */
  roll?: boolean;
}

export type StingerKind = "victory" | "defeat" | "rank";

export const STINGERS: Record<StingerKind, Stinger> = {
  victory: {
    bpm: 120,
    key: "D major",
    notes: [
      [0, 62, 0.5],
      [0.5, 69, 0.5],
      [1, 74, 0.5],
      [1.5, 78, 0.25],
      [1.75, 76, 0.25],
      [2, 81, 3],
    ],
    chord: [62, 66, 69, 74],
    chordAt: 2,
    chordBeats: 3,
    wave: "brass",
    roll: true,
  },
  defeat: {
    bpm: 70,
    key: "D minor, ending on Bb",
    notes: [
      [0, 69, 1],
      [1, 65, 1],
      [2, 62, 1],
      [3, 61, 2.5],
    ],
    chord: [46, 53, 58, 62],
    chordAt: 3,
    chordBeats: 2.5,
    wave: "bell",
  },
  rank: {
    bpm: 132,
    key: "C major",
    notes: [
      [0, 67, 0.25],
      [0.25, 72, 0.25],
      [0.5, 76, 0.25],
      [0.75, 79, 1.5],
    ],
    chord: [72, 76, 79, 84],
    chordAt: 0.75,
    chordBeats: 1.5,
    wave: "brass",
  },
};

/** Seconds a stinger lasts, its last note's tail included. */
export function stingerSeconds(s: Stinger): number {
  const beat = 60 / s.bpm;
  let end = s.chordAt + s.chordBeats;
  for (const [b, , d] of s.notes) end = Math.max(end, b + d);
  return end * beat + 0.4;
}

// ---------------------------------------------------------------------------------------------
// Which cue
// ---------------------------------------------------------------------------------------------

export interface MusicInput {
  /** Seconds, on any steady clock. */
  t: number;
  title: boolean;
  over: boolean;
  /** The boss's phase while it is out, 1 to 3. */
  boss?: number;
  /** Foes close enough to fight. */
  near: number;
  /** Whether a DDL is among them. */
  ddl: boolean;
}

/** Seconds the fight's music holds on after the last foe near has gone, so that it does not flap. */
export const FIGHT_HOLD = 5;

/** The state machine: the cue for the game's state now, with the fight's music held a moment after. */
export class MusicDirector {
  cue: Cue = "none";
  private fightAt = -Infinity;
  private ddlAt = -Infinity;

  update(i: MusicInput): Cue {
    if (i.near > 0) this.fightAt = i.t;
    if (i.ddl) this.ddlAt = i.t;
    let c: Cue;
    if (i.over) c = "none";
    else if (i.title) c = "title";
    else if (i.boss) c = i.boss >= 3 ? "boss3" : i.boss === 2 ? "boss2" : "boss1";
    else if (i.t - this.ddlAt < FIGHT_HOLD) c = "ddl";
    else if (i.t - this.fightAt < FIGHT_HOLD) c = "combat";
    else c = "explore";
    this.cue = c;
    return c;
  }

  reset(): void {
    this.cue = "none";
    this.fightAt = this.ddlAt = -Infinity;
  }
}

// ---------------------------------------------------------------------------------------------
// The scheduler's sums
// ---------------------------------------------------------------------------------------------

/** Seconds of one sixteenth at `bpm`. */
export function stepSeconds(bpm: number): number {
  return 60 / bpm / 4;
}

/**
 * Steps from `step` (counted from the phrase's start) to where a change of cue may land: the next
 * beat when the two cues keep the same tempo and chords, so that a fight's drums come in on the
 * beat, else the next bar, where the tempo and the chords can change together. The title's slow bar
 * is not waited out: the game begins on its next beat. 0 when `step` is on it.
 */
export function stepsToSwitch(step: number, from: Cue, to: Cue): number {
  const unit = sameGrid(from, to) || from === "title" ? 4 : STEPS;
  const r = ((step % unit) + unit) % unit;
  return r === 0 ? 0 : unit - r;
}

/** Whether two cues share a tempo and chords, so that one can follow the other on any beat. */
export function sameGrid(a: Cue, b: Cue): boolean {
  if (a === "none" || b === "none") return false;
  const x = MUSIC[a];
  const y = MUSIC[b];
  return x.bpm === y.bpm && x.chords === y.chords;
}

/**
 * The first time at or after `t` on a grid of `period` seconds that began at `origin`: where a
 * stinger or a fade lands on the beat.
 */
export function nextBoundary(t: number, origin: number, period: number): number {
  if (t <= origin) return origin;
  const k = Math.ceil((t - origin) / period - 1e-9);
  return origin + k * period;
}

/**
 * Where the scheduler goes on from, when it wakes: its next step's time, unless that has slipped
 * behind the clock (a tab that slept, a long frame), when it starts again just ahead of now and
 * drops the notes it missed rather than play them all at once.
 */
export function resumeAt(next: number, now: number, lead = 0.03): number {
  return next < now ? now + lead : next;
}

/**
 * The steps due in the window up to `now + ahead`, from `next`, `dt` apart: how many, so that the
 * scheduler can play each before the clock reaches it.
 */
export function stepsDue(next: number, now: number, ahead: number, dt: number): number {
  if (next >= now + ahead) return 0;
  return Math.floor((now + ahead - next) / dt) + 1;
}

// ---------------------------------------------------------------------------------------------
// Voices, levels and variation
// ---------------------------------------------------------------------------------------------

/**
 * The voices sounding: the end time of each started voice in a ring, so that a crowd of sounds can
 * be held to a cap without a callback per voice.
 */
export class VoiceClock {
  private ends: Float64Array;
  private at = 0;

  constructor(size = 128) {
    this.ends = new Float64Array(size).fill(-Infinity);
  }

  /** Voices still sounding at `now`. */
  live(now: number): number {
    let n = 0;
    for (let i = 0; i < this.ends.length; i++) if (this.ends[i]! > now) n++;
    return n;
  }

  /** Whether `count` more voices may start under `cap`. */
  room(now: number, count: number, cap: number): boolean {
    return this.live(now) + count <= cap;
  }

  add(end: number): void {
    this.ends[this.at] = end;
    this.at = (this.at + 1) % this.ends.length;
  }

  clear(): void {
    this.ends.fill(-Infinity);
  }
}

/** A slider's 0 to 1 into a gain: a square law, which sounds even across the slider's travel. */
export function sliderGain(v: number): number {
  const x = Math.max(0, Math.min(1, v));
  return x * x;
}

export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

export function gainToDb(g: number): number {
  return g <= 0 ? -Infinity : 20 * Math.log10(g);
}

export function midiHz(n: number): number {
  return 440 * Math.pow(2, (n - 69) / 12);
}

/**
 * A little variety for a sound played again: its pitch within `cents` either way and its level within
 * `db` either way, from two numbers 0 to 1.
 */
export function vary(r1: number, r2: number, cents = 60, db = 1.5): { pitch: number; gain: number } {
  return { pitch: Math.pow(2, ((r1 * 2 - 1) * cents) / 1200), gain: dbToGain((r2 * 2 - 1) * db) };
}

/** A note in a 16-step pattern string: the character, or "." past its end. */
export function hitAt(pattern: string, step: number): string {
  return pattern[step % STEPS] ?? ".";
}
