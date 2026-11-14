// Study Quest's rules, with no drawing in them: a made-up action game laid over the walk. The
// walker grows by learning (knowledge is its experience, study ranks are its levels) and fights
// made-up villains that stand for study troubles: the DDL, an alarm clock that charges; the
// Procrastination blob that slows; the Distraction phones that swarm; the Plagiarism ghost that
// copies and blinks; the Exam Anxiety shade that throws from afar; and a boss, the Final Exam.
// None of it is campus data: no villain, book or quest stands for a real class, course, person,
// room's timetable or due date. Quests name buildings only as places to go, as a map would.
import type { Pt } from "./geo.ts";
import { WALK_COST, cellOf, centreOf, nearestFree, type WalkGrid } from "./walkpath.ts";

// ---------------------------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------------------------

export type FoeKind = "ddl" | "procrastination" | "distraction" | "plagiarism" | "anxiety" | "exam";
export const FOE_KINDS: readonly FoeKind[] = ["ddl", "procrastination", "distraction", "plagiarism", "anxiety", "exam"];

export interface FoeSpec {
  hp: number;
  /** Metres a second it goes after the walker. */
  speed: number;
  damage: number;
  /** Metres from the walker at which it starts an attack. */
  reach: number;
  /** Metres: how big it is, for blows and for keeping apart. */
  radius: number;
  /** Knowledge for beating it. */
  xp: number;
  /** Seconds it shows an attack coming before the attack lands. */
  tell: number;
  /** Seconds between attacks. */
  cooldown: number;
  /** Share of a blow's push it takes (heavy foes take less). */
  weight: number;
}

export const FOES: Record<FoeKind, FoeSpec> = {
  ddl: { hp: 280, speed: 3.1, damage: 18, reach: 9, radius: 1.5, xp: 90, tell: 0.95, cooldown: 1.7, weight: 0.35 },
  procrastination: { hp: 70, speed: 1.5, damage: 7, reach: 3.6, radius: 1.1, xp: 18, tell: 1.0, cooldown: 2.6, weight: 0.6 },
  distraction: { hp: 22, speed: 4.3, damage: 4, reach: 1.7, radius: 0.55, xp: 6, tell: 0.35, cooldown: 1.2, weight: 1.3 },
  plagiarism: { hp: 55, speed: 2.7, damage: 10, reach: 2.4, radius: 0.85, xp: 20, tell: 0.55, cooldown: 3.4, weight: 1 },
  anxiety: { hp: 45, speed: 2.3, damage: 9, reach: 13, radius: 0.85, xp: 16, tell: 0.6, cooldown: 2.3, weight: 1 },
  exam: { hp: 1500, speed: 2.4, damage: 24, reach: 30, radius: 3.2, xp: 450, tell: 1.15, cooldown: 1.5, weight: 0.08 },
};

/** Study ranks: the walker's levels, and the knowledge each needs. */
export const RANKS = [
  { id: "fresher", xp: 0 },
  { id: "sophomore", xp: 60 },
  { id: "junior", xp: 170 },
  { id: "senior", xp: 330 },
  { id: "honours", xp: 560 },
  { id: "masters", xp: 850 },
  { id: "doctoral", xp: 1200 },
  { id: "scholar", xp: 1650 },
] as const;
export type RankId = (typeof RANKS)[number]["id"];

export type SkillId = "strike" | "dodge" | "flashcard" | "sprint" | "eureka";
/** Each skill, named for a study habit, and the rank that opens it. */
export const SKILLS: readonly { id: SkillId; rank: number }[] = [
  { id: "strike", rank: 0 },
  { id: "dodge", rank: 0 },
  { id: "flashcard", rank: 1 },
  { id: "sprint", rank: 2 },
  { id: "eureka", rank: 3 },
];

export const PLAYER = {
  /** Metres a highlighter strike reaches, past the foe's edge. */
  strikeReach: 3.2,
  /** Degrees either side of the aim that a strike sweeps. */
  strikeArc: 75,
  /** Seconds each blow of the three-blow combo takes, and how hard it hits. */
  strikeTime: [0.26, 0.26, 0.42],
  strikeMult: [1, 1.15, 1.9],
  strikePush: [1.2, 1.4, 4.5],
  /**
   * Seconds from the start of each blow to when it lands: the wind-up the walker's arms make
   * before it (figure.ts), the overhead slam's the longest.
   */
  strikeContact: [0.09, 0.09, 0.17],
  /** Seconds after a blow in which the next one carries the combo on. */
  comboWindow: 0.7,
  dodgeTime: 0.3,
  dodgeMetres: 5,
  /** The Cram Sprint: a longer dash that strikes what it passes. */
  sprintMetres: 9,
  dodgeCost: 22,
  iframes: 0.38,
  cardCost: 12,
  cardCooldown: 0.45,
  cardSpeed: 26,
  cardLife: 1.1,
  /** Seconds from the start of a throw to when the card leaves the hand. */
  cardRelease: 0.1,
  eurekaRadius: 8.5,
  eurekaMult: 3.2,
  eurekaCharge: 100,
  staminaRegen: 30,
  /** Focus a second it gets back when nothing has hurt it for `calm` seconds. */
  focusRegen: 2.5,
  calm: 5,
  /** Soft aim: a strike turns to a foe this near and this far off the way the walker faces. */
  softReach: 9,
  softArc: 65,
  lockReach: 28,
  /** Seconds a hit chain lasts without another hit. */
  chainTime: 2.6,
} as const;

/** What the walker is, at a rank. */
export function statsFor(rank: number): { maxFocus: number; insight: number; maxStamina: number; crit: number } {
  return { maxFocus: 100 + 14 * rank, insight: 12 + 4 * rank, maxStamina: 100 + 12 * rank, crit: 0.06 + 0.025 * rank };
}

/** The rank that `xp` knowledge earns. */
export function rankFor(xp: number): number {
  let r = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i]!.xp) r = i;
  return r;
}

export const QUEST = {
  booksOut: 40,
  coffeeOut: 5,
  /** Metres from a pick-up at which the walker takes it. */
  takeReach: 3.2,
  bookXp: 10,
  noteXp: 25,
  coffeeFocus: 35,
  /** Metres from the walker beyond which a pick-up is laid again nearer. */
  laidRange: 320,
  /** Foes out at one time, besides the boss, at most. */
  foeCap: 12,
  /** Metres from the walker at which a foe comes, and beyond which a stray one is let go. */
  spawnGap: [26, 36] as const,
  strayRange: 140,
  /** Metres from a quest's place at which it counts as reached. */
  placeReach: 28,
  arenaRadius: 24,
  /** Seconds after the start before the first wanderers come. */
  firstSpawn: 14,
  /** Seconds after the start before anything can hurt the walker. */
  grace: 3,
  /** Times a foe's speed while the walker rides the scooter, so that wheels do not win the game. */
  scooterPace: 2,
} as const;

// ---------------------------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------------------------

export type ItemKind = "book" | "note" | "coffee";

export interface Item {
  id: number;
  kind: ItemKind;
  at: Pt;
  /** The quest this note is for. */
  quest?: string;
}

export type FoeState = "rise" | "chase" | "tell" | "attack" | "recover" | "stagger" | "dead" | "phase";

export interface Foe {
  id: number;
  kind: FoeKind;
  at: Pt;
  hp: number;
  maxHp: number;
  /** Degrees the way it faces, clockwise from north. */
  facing: number;
  state: FoeState;
  /** Seconds left in its state. */
  t: number;
  /** Seconds to its next attack. */
  cool: number;
  /** Metres a second it is being pushed, east and north. */
  push: Pt;
  /** The attack it is showing or making. */
  move?: FoeMove;
  /** Seconds since it last took a blow, for the flash. */
  hurtAgo: number;
  /** A quest it counts for. */
  quest?: string;
  /** Times stronger than its kind: a second DDL is tougher. */
  tier: number;
  /** The boss's phase, 1 to 3. */
  phase: number;
  /** Seconds it has been out. */
  age: number;
  /** Whether it came by itself, rather than for a quest. */
  wander: boolean;
}

export type FoeMove =
  | { type: "melee" }
  | { type: "charge"; dir: number; left: number; hit: boolean }
  | { type: "yawn"; at: Pt; radius: number }
  | { type: "blink" }
  | { type: "orb"; count: number; spread: number }
  | { type: "slam"; at: Pt; radius: number }
  | { type: "beams"; dirs: number[]; length: number; width: number }
  | { type: "wave" }
  | { type: "summon" };

/** A shape on the ground that shows where an attack will land. */
export interface Tell {
  id: number;
  foe: number;
  shape: "circle" | "line";
  at: Pt;
  /** Degrees, for a line. */
  dir: number;
  length: number;
  width: number;
  radius: number;
  /** Seconds left, and in all. */
  t: number;
  total: number;
}

/** A ring the Final Exam sends out over the ground; it hurts a walker it passes who does not dodge. */
export interface Wave {
  id: number;
  at: Pt;
  r: number;
  speed: number;
  max: number;
  hit: boolean;
}

export interface Shot {
  id: number;
  mine: boolean;
  at: Pt;
  vel: Pt;
  life: number;
  damage: number;
  radius: number;
}

export interface Place {
  /** The building's name as the map gives it, or a word for open ground. */
  name: string;
  at: Pt;
  /** The building's id, when the place is beside one. */
  building?: string;
}

export type QuestKey = "orientation" | "ddl1" | "studyGroup" | "revision" | "ddl2" | "finalExam" | "sideNotes" | "sideClear";

export interface Quest {
  id: string;
  key: QuestKey;
  main: boolean;
  place?: Place;
  goal: "collect" | "defeat" | "boss";
  /** What it asks for: books or notes to take, foes to beat. */
  need: number;
  got: number;
  reward: number;
  /** Whether its foes or notes are out yet (they come when the walker reaches the place). */
  started: boolean;
}

export type GameEvent =
  | { type: "take"; kind: ItemKind; at: Pt; xp: number }
  | { type: "swing"; combo: number; at: Pt; dir: number }
  | { type: "hit"; foe: number; kind: FoeKind; at: Pt; amount: number; crit: boolean; heavy: boolean }
  | { type: "kill"; foe: number; kind: FoeKind; at: Pt; xp: number }
  | { type: "hurt"; amount: number; from: Pt }
  | { type: "evade"; at: Pt }
  | { type: "dodge"; at: Pt; dir: number; sprint: boolean }
  | { type: "card"; at: Pt; dir: number }
  | { type: "eureka"; at: Pt }
  | { type: "rank"; rank: number; skill?: SkillId }
  | { type: "quest"; quest: Quest; done: boolean }
  | { type: "wave"; place: string }
  | { type: "arrive"; foe: number; kind: FoeKind; first: boolean }
  | { type: "tell"; foe: number; kind: FoeKind; move: FoeMove["type"] }
  | { type: "phase"; phase: number }
  | { type: "over"; victory: boolean };

export interface QuestHost {
  /** Somewhere to lay a pick-up near `near`, or beside `place` when given; undefined when it finds none. */
  spot(near: Pt, taken: readonly Pt[], place?: Pt): Pt | undefined;
  /** A place for a quest: beside a building with rooms to teach in, away from `avoid`. */
  place(near: Pt, avoid: readonly Pt[], big?: boolean): Place | undefined;
  /** 0 to 1, as Math.random gives. */
  random(): number;
}

export interface PlayerInput {
  at: Pt;
  /** Degrees the walker faces, clockwise from north. */
  heading: number;
  /** False while the walker cannot play (indoors or flying): the clock stops. */
  active: boolean;
  /** Times the foes' speed: more after a walker on the scooter. */
  pace: number;
}

/** What the game asks of the walker after a step: to be pushed, to turn, to go slower. */
export interface PlayerOrders {
  shove: Pt;
  face?: number;
  /** Share of its pace it keeps: under 1 while the Procrastination's yawn holds it. */
  slow: number;
}

export interface Debrief {
  victory: boolean;
  grade: string;
  seconds: number;
  xp: number;
  rank: number;
  defeated: number;
  maxChain: number;
  focusLost: number;
  quests: number;
}

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------

const D2R = Math.PI / 180;
function dirOf(deg: number): Pt {
  return [Math.sin(deg * D2R), Math.cos(deg * D2R)];
}
/** The compass bearing from one point to another, degrees clockwise from north. */
export function bearingTo(from: Pt, to: Pt): number {
  return ((Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI + 360) % 360;
}
/** Degrees from one bearing round to another, -180 to 180. */
export function turnBetween(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}
function dist(a: Pt, b: Pt): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
/** Metres from a point to a segment that starts at `a` and goes `length` metres along `dir`. */
function toSegment(p: Pt, a: Pt, dir: number, length: number): number {
  const [ux, uy] = dirOf(dir);
  const t = Math.max(0, Math.min(length, (p[0] - a[0]) * ux + (p[1] - a[1]) * uy));
  return Math.hypot(p[0] - (a[0] + ux * t), p[1] - (a[1] + uy * t));
}

/** The letter grade a run earns, A+ to F. */
export function gradeFor(d: Omit<Debrief, "grade">): string {
  const points =
    (d.victory ? 45 : 0) +
    Math.min(20, d.rank * 3) +
    Math.min(12, d.maxChain * 0.6) +
    Math.min(13, d.defeated * 0.5) +
    Math.max(0, Math.min(10, 10 - d.focusLost / 40)) +
    Math.min(5, d.quests);
  const scale: [number, string][] = [
    [92, "A+"],
    [86, "A"],
    [80, "A-"],
    [75, "B+"],
    [70, "B"],
    [65, "B-"],
    [60, "C+"],
    [55, "C"],
    [50, "C-"],
    [40, "D"],
  ];
  for (const [min, g] of scale) if (points >= min) return g;
  return "F";
}

// ---------------------------------------------------------------------------------------------
// The game
// ---------------------------------------------------------------------------------------------

type Action = "strike" | "dodge" | "card" | "eureka";

export class StudyQuest {
  phase: "play" | "over" = "play";
  victory = false;
  seconds = 0;
  xp = 0;
  rank = 0;
  focus: number;
  stamina: number;
  eurekaMeter = 0;
  items: Item[] = [];
  foes: Foe[] = [];
  tells: Tell[] = [];
  waves: Wave[] = [];
  shots: Shot[] = [];
  quests: Quest[] = [];
  /** How far the main story has gone: 0 to 6 (6: done). */
  mainStep = 0;
  /** The boss's arena, while the last quest is on. */
  arena?: { at: Pt; radius: number; active: boolean };
  /** The foe the walker has locked on to. */
  lock?: number;
  /** Hits in a row, each within `chainTime` of the last. */
  chain = 0;
  maxChain = 0;
  defeated = 0;
  focusLost = 0;
  questsDone = 0;
  /** Kinds met so far: the first of each gets its name card. */
  met = new Set<FoeKind>();
  /** Seconds left of: a strike, the combo window, a dodge, i-frames, hit-stop, the card's cooldown, the slow, calm. */
  strikeT = 0;
  combo = 0;
  comboT = 0;
  dodgeT = 0;
  iframes = 0;
  hitStop = 0;
  cardT = 0;
  slowT = 0;
  hurtAgo = 99;
  chainT = 0;
  grace: number = QUEST.grace;
  orders: PlayerOrders = { shove: [0, 0], slow: 1 };
  private queued?: Action;
  private nextId = 1;
  private spawnT: number = QUEST.firstSpawn;
  private sideSeq = 0;
  private player: Pt;
  private heading = 0;
  private events: GameEvent[] = [];
  private dodgeDir = 0;
  private dodgeLeft = 0;
  /** Foes the Cram Sprint under way has struck already. */
  private sprintHits = new Set<number>();
  /** A blow under way that has not landed yet, and a card drawn back that has not left the hand. */
  private blow?: { combo: number; dir: number; t: number };
  private throwing?: { dir: number; t: number };

  constructor(
    private host: QuestHost,
    player: Pt,
  ) {
    this.player = [player[0], player[1]];
    const s = statsFor(0);
    this.focus = s.maxFocus;
    this.stamina = s.maxStamina;
    this.fill(player);
    this.beginMain(player);
  }

  get stats(): ReturnType<typeof statsFor> {
    return statsFor(this.rank);
  }

  has(skill: SkillId): boolean {
    return this.rank >= (SKILLS.find((s) => s.id === skill)?.rank ?? 99);
  }

  /** The boss, while it is out. */
  get boss(): Foe | undefined {
    return this.foes.find((f) => f.kind === "exam" && f.state !== "dead");
  }

  /** Asks for an action; it happens on the next step, or after the blow that is under way. */
  act(a: Action): boolean {
    if (this.phase !== "play") return false;
    if (a === "card" && !this.has("flashcard")) return false;
    if (a === "eureka" && !this.has("eureka")) return false;
    this.queued = a;
    return true;
  }

  /** Locks on to the nearest foe in front, or the next one; or lets go. */
  toggleLock(): void {
    const live = this.foes.filter((f) => f.state !== "dead" && f.state !== "rise" && dist(f.at, this.player) <= PLAYER.lockReach);
    if (!live.length) {
      this.lock = undefined;
      return;
    }
    live.sort((a, b) => this.aimScore(a) - this.aimScore(b));
    const i = live.findIndex((f) => f.id === this.lock);
    if (i === live.length - 1) this.lock = undefined;
    else this.lock = live[i + 1]!.id;
  }

  private aimScore(f: Foe): number {
    const off = Math.abs(turnBetween(this.heading, bearingTo(this.player, f.at)));
    return dist(f.at, this.player) + off * 0.15;
  }

  /** The debrief of a game that is over. */
  debrief(): Debrief {
    const d = { victory: this.victory, seconds: this.seconds, xp: this.xp, rank: this.rank, defeated: this.defeated, maxChain: this.maxChain, focusLost: Math.round(this.focusLost), quests: this.questsDone };
    return { ...d, grade: gradeFor(d) };
  }

  // -------------------------------------------------------------------------------------------
  // The step
  // -------------------------------------------------------------------------------------------

  step(dt: number, input: PlayerInput): GameEvent[] {
    this.events = [];
    this.orders = { shove: [0, 0], slow: this.slowT > 0 ? 0.55 : 1 };
    // A game that is over lets its foes go: they fade where they stand.
    if (this.phase === "over" && dt > 0 && this.foes.length) {
      for (const f of this.foes) {
        if (f.state !== "dead") ((f.state = "dead"), (f.t = 0.7));
        f.t -= Math.min(dt, 0.1);
      }
      this.foes = this.foes.filter((f) => f.t > 0);
    }
    if (this.phase !== "play" || !input.active || dt <= 0) return this.events;
    dt = Math.min(dt, 0.1);
    this.player = [input.at[0], input.at[1]];
    this.heading = input.heading;
    this.seconds += dt;
    // Hit-stop: the foes and what they throw freeze for a few hundredths; the walker goes on.
    const world = this.hitStop > 0 ? dt * 0.08 : dt;
    this.hitStop = Math.max(0, this.hitStop - dt);
    this.grace = Math.max(0, this.grace - dt);
    this.timers(dt);
    this.actions();
    this.landing(dt);
    this.dodging(dt);
    this.take();
    this.questsStep();
    this.spawning(dt);
    this.foesStep(world, input.pace);
    this.shotsStep(world);
    this.wavesStep(world);
    this.tellsStep(world);
    this.foes = this.foes.filter((f) => !(f.state === "dead" && f.t <= 0));
    if (this.lock !== undefined && !this.foes.some((f) => f.id === this.lock && f.state !== "dead")) this.lock = undefined;
    return this.events;
  }

  private timers(dt: number): void {
    const s = this.stats;
    this.strikeT = Math.max(0, this.strikeT - dt);
    this.comboT = Math.max(0, this.comboT - dt);
    if (this.comboT <= 0 && this.strikeT <= 0) this.combo = 0;
    this.iframes = Math.max(0, this.iframes - dt);
    this.cardT = Math.max(0, this.cardT - dt);
    this.slowT = Math.max(0, this.slowT - dt);
    this.chainT = Math.max(0, this.chainT - dt);
    if (this.chainT <= 0) this.chain = 0;
    this.hurtAgo += dt;
    if (this.dodgeT <= 0) this.stamina = Math.min(s.maxStamina, this.stamina + PLAYER.staminaRegen * dt);
    if (this.hurtAgo > PLAYER.calm) this.focus = Math.min(s.maxFocus, this.focus + PLAYER.focusRegen * dt);
  }

  private actions(): void {
    const a = this.queued;
    if (!a) return;
    if (a === "strike") {
      if (this.strikeT > 0 || this.dodgeT > 0) return; // kept for when the blow ends
      this.queued = undefined;
      this.strike();
    } else if (a === "dodge") {
      this.queued = undefined;
      if (this.dodgeT > 0 || this.stamina < PLAYER.dodgeCost) return;
      this.stamina -= PLAYER.dodgeCost;
      const sprint = this.has("sprint");
      this.dodgeT = PLAYER.dodgeTime * (sprint ? 1.3 : 1);
      this.dodgeLeft = sprint ? PLAYER.sprintMetres : PLAYER.dodgeMetres;
      this.dodgeDir = this.heading;
      this.sprintHits.clear();
      this.iframes = PLAYER.iframes * (sprint ? 1.3 : 1);
      this.strikeT = 0;
      this.blow = undefined;
      this.events.push({ type: "dodge", at: this.player, dir: this.heading, sprint });
    } else if (a === "card") {
      this.queued = undefined;
      if (this.cardT > 0 || this.stamina < PLAYER.cardCost) return;
      this.stamina -= PLAYER.cardCost;
      this.cardT = PLAYER.cardCooldown;
      const dir = this.aim(PLAYER.lockReach, 25);
      if (Math.abs(turnBetween(this.heading, dir)) > 1) this.orders.face = dir;
      // The arm draws back first; the card leaves the hand a moment later (landing).
      this.throwing = { dir, t: PLAYER.cardRelease };
      this.events.push({ type: "card", at: this.player, dir });
    } else if (a === "eureka") {
      this.queued = undefined;
      if (this.eurekaMeter < PLAYER.eurekaCharge) return;
      this.eurekaMeter = 0;
      this.iframes = Math.max(this.iframes, 0.6);
      this.events.push({ type: "eureka", at: this.player });
      for (const f of this.foes) {
        if (f.state === "dead" || f.state === "rise") continue;
        const d = dist(f.at, this.player);
        if (d > PLAYER.eurekaRadius + FOES[f.kind].radius) continue;
        this.damage(f, this.stats.insight * PLAYER.eurekaMult, bearingTo(this.player, f.at), 7, true, false);
      }
      this.hitStop = 0.12;
    }
  }

  /**
   * The way a blow or a card goes: at the foe locked on to, or turned to the nearest foe in front
   * within `reach` and `arc` degrees (soft aim), or straight ahead.
   */
  private aim(reach: number = PLAYER.softReach, arc: number = PLAYER.softArc): number {
    const locked = this.foes.find((f) => f.id === this.lock && f.state !== "dead");
    if (locked) return bearingTo(this.player, locked.at);
    let best: Foe | undefined;
    let score = Infinity;
    for (const f of this.foes) {
      if (f.state === "dead" || f.state === "rise") continue;
      const d = dist(f.at, this.player) - FOES[f.kind].radius;
      if (d > reach) continue;
      const off = Math.abs(turnBetween(this.heading, bearingTo(this.player, f.at)));
      if (off > arc) continue;
      const s = d + off * 0.05;
      if (s < score) {
        score = s;
        best = f;
      }
    }
    return best ? bearingTo(this.player, best.at) : this.heading;
  }

  private strike(): void {
    const combo = this.comboT > 0 ? (this.combo + 1) % 3 : 0;
    this.combo = combo;
    this.strikeT = PLAYER.strikeTime[combo]!;
    this.comboT = this.strikeT + PLAYER.comboWindow;
    const dir = this.aim();
    if (Math.abs(turnBetween(this.heading, dir)) > 1) this.orders.face = dir;
    // A small lunge into the blow.
    const [ux, uy] = dirOf(dir);
    const lunge = combo === 2 ? 0.9 : 0.45;
    this.orders.shove = [this.orders.shove[0] + ux * lunge, this.orders.shove[1] + uy * lunge];
    this.events.push({ type: "swing", combo, at: this.player, dir });
    // It lands after the wind-up (landing).
    this.blow = { combo, dir, t: PLAYER.strikeContact[combo]! };
  }

  /**
   * A blow lands, and a card leaves the hand, when its time comes: counted from the start of the
   * step it began in, so that one whose wind-up is shorter than the step lands in that step.
   */
  private landing(dt: number): void {
    const b = this.blow;
    if (b && (b.t -= dt) <= 0) {
      this.blow = undefined;
      const s = this.stats;
      for (const f of this.foes) {
        if (f.state === "dead" || f.state === "rise") continue;
        const spec = FOES[f.kind];
        const d = dist(f.at, this.player);
        if (d > PLAYER.strikeReach + spec.radius) continue;
        const off = Math.abs(turnBetween(b.dir, bearingTo(this.player, f.at)));
        // Right against it, a foe counts whichever way the blow goes.
        if (off > PLAYER.strikeArc && d > spec.radius + 0.6) continue;
        this.damage(f, s.insight * PLAYER.strikeMult[b.combo]!, b.dir, PLAYER.strikePush[b.combo]!, b.combo === 2);
      }
    }
    const c = this.throwing;
    if (c && (c.t -= dt) <= 0) {
      this.throwing = undefined;
      const [ux, uy] = dirOf(c.dir);
      this.shots.push({
        id: this.nextId++,
        mine: true,
        at: [this.player[0] + ux * 0.8, this.player[1] + uy * 0.8],
        vel: [ux * PLAYER.cardSpeed, uy * PLAYER.cardSpeed],
        life: PLAYER.cardLife,
        damage: this.stats.insight * 0.85,
        radius: 0.6,
      });
    }
  }

  /** Hurts a foe: with a chance of a critical blow, a push, a flash, and a hit-stop. */
  private damage(f: Foe, base: number, dir: number, push: number, heavy: boolean, charges = true): void {
    if (f.state === "dead" || f.state === "phase" || f.state === "rise") return;
    const crit = this.host.random() < this.stats.crit;
    const amount = Math.max(1, Math.round(base * (0.9 + this.host.random() * 0.2) * (crit ? 1.8 : 1)));
    f.hp = Math.max(0, f.hp - amount);
    f.hurtAgo = 0;
    const spec = FOES[f.kind];
    const [ux, uy] = dirOf(dir);
    const k = push * spec.weight * 4;
    f.push = [f.push[0] + ux * k, f.push[1] + uy * k];
    this.chain++;
    this.chainT = PLAYER.chainTime;
    this.maxChain = Math.max(this.maxChain, this.chain);
    if (charges && this.has("eureka")) this.eurekaMeter = Math.min(PLAYER.eurekaCharge, this.eurekaMeter + amount * 0.3);
    this.hitStop = Math.max(this.hitStop, heavy || crit ? 0.09 : 0.05);
    this.events.push({ type: "hit", foe: f.id, kind: f.kind, at: f.at, amount, crit, heavy });
    // A heavy blow stops a small foe's attack; the DDL and the boss shrug off all but their phases.
    if ((heavy || spec.weight >= 1) && f.kind !== "exam" && f.kind !== "ddl" && f.state !== "attack") {
      f.state = "stagger";
      f.t = 0.3;
      this.dropTells(f.id);
    }
    if (f.kind === "exam") {
      const share = f.hp / f.maxHp;
      const want = share > 0.66 ? 1 : share > 0.33 ? 2 : 3;
      if (want > f.phase && f.hp > 0) {
        f.phase = want;
        f.state = "phase";
        f.t = 2.6;
        f.move = undefined;
        this.dropTells(f.id);
        this.events.push({ type: "phase", phase: want });
        return;
      }
    }
    if (f.hp <= 0) this.kill(f);
  }

  private kill(f: Foe): void {
    f.state = "dead";
    f.t = 0.7;
    f.move = undefined;
    this.dropTells(f.id);
    const xp = Math.round(FOES[f.kind].xp * f.tier);
    this.defeated++;
    this.events.push({ type: "kill", foe: f.id, kind: f.kind, at: f.at, xp });
    this.gain(xp);
    for (const q of this.quests) {
      if (q.goal === "defeat" && f.quest === q.id) q.got = Math.min(q.need, q.got + 1);
      if (q.goal === "boss" && f.kind === "exam") q.got = 1;
    }
  }

  private gain(xp: number): void {
    this.xp += xp;
    const r = rankFor(this.xp);
    while (this.rank < r) {
      this.rank++;
      const s = statsFor(this.rank);
      // Rising a rank fills the walker up again.
      this.focus = s.maxFocus;
      this.stamina = s.maxStamina;
      const skill = SKILLS.find((k) => k.rank === this.rank)?.id;
      if (skill === "eureka") this.eurekaMeter = PLAYER.eurekaCharge;
      this.events.push({ type: "rank", rank: this.rank, skill });
    }
  }

  private dodging(dt: number): void {
    if (this.dodgeT <= 0) return;
    const sprint = this.has("sprint");
    const total = PLAYER.dodgeTime * (sprint ? 1.3 : 1);
    const go = Math.min(this.dodgeLeft, ((sprint ? PLAYER.sprintMetres : PLAYER.dodgeMetres) / total) * dt);
    this.dodgeLeft -= go;
    const [ux, uy] = dirOf(this.dodgeDir);
    this.orders.shove = [this.orders.shove[0] + ux * go, this.orders.shove[1] + uy * go];
    this.dodgeT = Math.max(0, this.dodgeT - dt);
    // The Cram Sprint strikes what it passes, once each.
    if (sprint) {
      for (const f of this.foes) {
        if (f.state === "dead" || f.state === "rise" || this.sprintHits.has(f.id)) continue;
        if (dist(f.at, this.player) > FOES[f.kind].radius + 1.2) continue;
        this.sprintHits.add(f.id);
        this.damage(f, this.stats.insight * 0.8, this.dodgeDir, 1, false);
      }
    }
  }

  /** The walker is hurt, unless it is dodging. */
  private hurt(amount: number, from: Pt): void {
    if (this.phase !== "play" || this.grace > 0) return;
    if (this.iframes > 0) {
      this.events.push({ type: "evade", at: this.player });
      if (this.has("eureka")) this.eurekaMeter = Math.min(PLAYER.eurekaCharge, this.eurekaMeter + 12);
      return;
    }
    this.focus = Math.max(0, this.focus - amount);
    this.focusLost += amount;
    this.hurtAgo = 0;
    this.iframes = 0.35;
    const away = bearingTo(from, this.player);
    const [ux, uy] = dirOf(away);
    this.orders.shove = [this.orders.shove[0] + ux * 1.2, this.orders.shove[1] + uy * 1.2];
    this.events.push({ type: "hurt", amount, from });
    if (this.focus <= 0) this.end(false);
  }

  private end(victory: boolean): void {
    this.phase = "over";
    this.victory = victory;
    this.tells = [];
    this.waves = [];
    this.shots = [];
    this.events.push({ type: "over", victory });
  }

  // -------------------------------------------------------------------------------------------
  // Pick-ups
  // -------------------------------------------------------------------------------------------

  /** Lays books and coffee until enough lie out, or the host finds no more places. */
  private fill(player: Pt): void {
    const taken = () => this.items.map((i) => i.at);
    const count = (k: ItemKind) => this.items.filter((i) => i.kind === k && !i.quest).length;
    for (const kind of ["book", "coffee"] as const) {
      const want = kind === "book" ? QUEST.booksOut : QUEST.coffeeOut;
      while (count(kind) < want) {
        const at = this.host.spot(player, taken());
        if (!at) return;
        this.items.push({ id: this.nextId++, kind, at });
      }
    }
  }

  private take(): void {
    const p = this.player;
    let took = false;
    const s = this.stats;
    this.items = this.items.filter((it) => {
      if (dist(it.at, p) > QUEST.takeReach) return true;
      // Coffee waits on the ground for a walker that needs it.
      if (it.kind === "coffee" && this.focus >= s.maxFocus && this.stamina >= s.maxStamina) return true;
      took = true;
      const xp = it.kind === "book" ? QUEST.bookXp : it.kind === "note" ? QUEST.noteXp : 0;
      if (it.kind === "coffee") {
        this.focus = Math.min(s.maxFocus, this.focus + QUEST.coffeeFocus);
        this.stamina = s.maxStamina;
      }
      this.events.push({ type: "take", kind: it.kind, at: it.at, xp });
      for (const q of this.quests) {
        if (q.goal !== "collect") continue;
        if ((q.key === "orientation" && it.kind === "book") || (it.quest === q.id && it.kind === "note")) q.got = Math.min(q.need, q.got + 1);
      }
      if (xp) this.gain(xp);
      return false;
    });
    if (took) {
      // The walker has moved on: what was left far behind is laid again near it.
      this.items = this.items.filter((it) => it.quest || dist(it.at, p) <= QUEST.laidRange);
      this.fill(p);
    }
  }

  // -------------------------------------------------------------------------------------------
  // Quests
  // -------------------------------------------------------------------------------------------

  private quest(key: QuestKey, main: boolean, goal: Quest["goal"], need: number, reward: number, place?: Place): Quest {
    const q: Quest = { id: `${key}-${this.nextId++}`, key, main, place, goal, need, got: 0, reward, started: false };
    this.quests.push(q);
    this.events.push({ type: "quest", quest: q, done: false });
    return q;
  }

  private placesTaken(): Pt[] {
    return this.quests.flatMap((q) => (q.place ? [q.place.at] : []));
  }

  /**
   * The next step of the main story. A quest that leads somewhere always has a place: where the map
   * has no building to name, open ground near the walker.
   */
  private beginMain(near: Pt): void {
    const step = this.mainStep;
    if (step === 0) this.quest("orientation", true, "collect", 5, 20);
    else if (step === 1) {
      const q = this.quest("ddl1", true, "defeat", 1, 40);
      this.spawn("ddl", this.ring(near, 40), q.id, 1);
      q.started = true;
    } else if (step === 2) this.quest("studyGroup", true, "defeat", 6, 60, this.host.place(near, this.placesTaken()) ?? { name: "", at: this.ring(near, 50) });
    else if (step === 3) this.quest("revision", true, "collect", 3, 60, this.host.place(near, this.placesTaken()) ?? { name: "", at: this.ring(near, 50) });
    else if (step === 4) {
      const q = this.quest("ddl2", true, "defeat", 3, 80);
      this.spawn("ddl", this.ring(near, 42), q.id, 1.6);
      this.spawn("anxiety", this.ring(near, 38), q.id, 1.2);
      this.spawn("anxiety", this.ring(near, 38), q.id, 1.2);
      q.started = true;
    } else if (step === 5) {
      const place = this.host.place(near, this.placesTaken(), true) ?? { name: "", at: this.ring(near, 60) };
      this.quest("finalExam", true, "boss", 1, 200, place);
      this.arena = { at: place.at, radius: QUEST.arenaRadius, active: false };
    }
  }

  /** A side quest, beside a building not used by another quest. */
  private beginSide(near: Pt): void {
    const place = this.host.place(near, this.placesTaken());
    if (!place) return;
    if (this.sideSeq++ % 2 === 0) this.quest("sideNotes", false, "collect", 2, 40, place);
    else this.quest("sideClear", false, "defeat", 3, 50, place);
  }

  private questsStep(): void {
    for (const q of this.quests) {
      // Reaching a quest's place brings out its foes or lays its notes.
      if (!q.started && q.place && dist(q.place.at, this.player) <= QUEST.placeReach) {
        q.started = true;
        if (q.goal === "defeat") {
          this.events.push({ type: "wave", place: q.place.name });
          const kinds: FoeKind[] = q.key === "studyGroup" ? ["distraction", "distraction", "distraction", "procrastination", "plagiarism", "distraction"] : ["distraction", "procrastination", "distraction"];
          for (const k of kinds.slice(0, q.need)) this.spawn(k, this.ring(q.place.at, 10 + this.host.random() * 8), q.id, 1, false);
        } else if (q.goal === "collect") {
          for (let i = 0; i < q.need; i++) {
            const at = this.host.spot(this.player, this.items.map((it) => it.at), q.place.at) ?? this.ring(q.place.at, 6 + i * 3);
            this.items.push({ id: this.nextId++, kind: "note", at, quest: q.id });
          }
        }
      }
      if (q.goal === "boss" && this.arena && !this.arena.active && dist(this.arena.at, this.player) <= this.arena.radius) {
        this.arena.active = true;
        q.started = true;
        // The wanderers leave the hall to the exam.
        for (const f of this.foes) if (f.wander && f.state !== "dead") ((f.state = "dead"), (f.t = 0.5));
        this.spawn("exam", this.ring(this.arena.at, 6), q.id, 1);
      }
    }
    const done = this.quests.filter((q) => q.got >= q.need);
    if (!done.length) return;
    this.quests = this.quests.filter((q) => q.got < q.need);
    for (const q of done) {
      this.questsDone++;
      this.events.push({ type: "quest", quest: q, done: true });
      this.gain(q.reward);
      if (q.main) {
        this.mainStep++;
        if (q.key === "finalExam") {
          this.arena = undefined;
          this.end(true);
          return;
        }
        this.beginMain(this.player);
      }
    }
    // Side quests come after the first fight, two at a time.
    while (this.mainStep >= 2 && this.mainStep < 5 && this.quests.filter((q) => !q.main).length < 2) {
      const before = this.quests.length;
      this.beginSide(this.player);
      if (this.quests.length === before) break;
    }
  }

  // -------------------------------------------------------------------------------------------
  // Foes
  // -------------------------------------------------------------------------------------------

  /** A point `r` metres from `c`, any way round. */
  private ring(c: Pt, r: number): Pt {
    const a = this.host.random() * Math.PI * 2;
    return [c[0] + Math.sin(a) * r, c[1] + Math.cos(a) * r];
  }

  spawn(kind: FoeKind, at: Pt, quest?: string, tier = 1, wander = false): Foe {
    const spec = FOES[kind];
    const hp = Math.round(spec.hp * tier);
    const f: Foe = { id: this.nextId++, kind, at, hp, maxHp: hp, facing: bearingTo(at, this.player), state: "rise", t: kind === "exam" ? 3.2 : 0.8, cool: spec.cooldown * 0.6, push: [0, 0], hurtAgo: 99, quest, tier, phase: 1, age: 0, wander };
    this.foes.push(f);
    const first = !this.met.has(kind);
    this.met.add(kind);
    this.events.push({ type: "arrive", foe: f.id, kind, first });
    return f;
  }

  /** Wanderers: after the first quest, small foes come now and then, more as the walker rises. */
  private spawning(dt: number): void {
    if (this.mainStep < 1 || this.arena?.active) return;
    // Strays far behind go.
    for (const f of this.foes) if (f.wander && f.state !== "dead" && dist(f.at, this.player) > QUEST.strayRange) ((f.state = "dead"), (f.t = 0));
    this.spawnT -= dt;
    if (this.spawnT > 0) return;
    this.spawnT = 7 + this.host.random() * 5 - Math.min(3, this.rank * 0.5);
    const wanderers = this.foes.filter((f) => f.wander && f.state !== "dead").length;
    const cap = Math.min(QUEST.foeCap, 3 + this.rank);
    if (wanderers >= cap || this.foes.length >= QUEST.foeCap) return;
    const kinds: FoeKind[] = ["distraction", "procrastination"];
    if (this.rank >= 1) kinds.push("plagiarism");
    if (this.rank >= 2) kinds.push("anxiety");
    const kind = kinds[Math.floor(this.host.random() * kinds.length)]!;
    const gap = QUEST.spawnGap[0] + this.host.random() * (QUEST.spawnGap[1] - QUEST.spawnGap[0]);
    const at = this.ring(this.player, gap);
    const n = kind === "distraction" ? Math.min(3, cap - wanderers) : 1;
    for (let i = 0; i < n; i++) this.spawn(kind, [at[0] + i * 1.6, at[1] + (i % 2) * 1.6], undefined, 1 + this.rank * 0.12, true);
  }

  private foesStep(dt: number, pace: number): void {
    const p = this.player;
    for (const f of this.foes) {
      f.age += dt;
      f.hurtAgo += dt;
      // The push dies away.
      f.at = [f.at[0] + f.push[0] * dt, f.at[1] + f.push[1] * dt];
      const fade = Math.exp(-dt * 7);
      f.push = [f.push[0] * fade, f.push[1] * fade];
      f.t -= dt;
      if (f.state === "dead") continue;
      const spec = FOES[f.kind];
      const d = dist(f.at, p);
      const toward = bearingTo(f.at, p);
      if (f.state === "rise" || f.state === "phase") {
        f.facing = toward;
        if (f.t <= 0) f.state = "chase";
        continue;
      }
      if (f.state === "stagger") {
        if (f.t <= 0) f.state = "chase";
        continue;
      }
      if (f.state === "tell") {
        // Charges and beams keep the way they showed; the rest keep turning to the walker.
        if (f.move?.type !== "charge" && f.move?.type !== "beams") f.facing = toward;
        if (f.t <= 0) this.unleash(f);
        continue;
      }
      if (f.state === "attack") {
        this.attacking(f, dt, pace);
        continue;
      }
      if (f.state === "recover") {
        if (f.t <= 0) f.state = "chase";
        continue;
      }
      // Chase.
      f.cool -= dt;
      f.facing = toward;
      const speed = spec.speed * pace * (f.kind === "exam" ? 1 + (f.phase - 1) * 0.3 : 1) * (f.kind === "ddl" ? 1 + (f.tier - 1) * 0.3 : 1);
      let want = 0;
      if (f.kind === "anxiety") want = d > spec.reach * 0.8 ? 1 : d < spec.reach * 0.45 ? -0.7 : 0;
      else if (f.kind === "exam") want = d > 9 ? 1 : 0;
      else want = d > spec.radius + 1.2 ? 1 : 0;
      if (this.grace > 0) want = Math.min(want, 0);
      const [ux, uy] = dirOf(toward);
      let nx = f.at[0] + ux * speed * want * dt;
      let ny = f.at[1] + uy * speed * want * dt;
      // Keeping apart from the others.
      for (const o of this.foes) {
        if (o === f || o.state === "dead") continue;
        const gap = Math.hypot(nx - o.at[0], ny - o.at[1]);
        const room = spec.radius + FOES[o.kind].radius;
        if (gap > 1e-3 && gap < room) {
          const k = ((room - gap) / gap) * 0.5;
          nx += (nx - o.at[0]) * k;
          ny += (ny - o.at[1]) * k;
        }
      }
      f.at = [nx, ny];
      if (this.arena?.active && f.kind === "exam") f.at = this.clampToArena(f.at);
      if (f.cool <= 0 && d <= spec.reach + spec.radius && this.grace <= 0) this.windUp(f, d);
    }
  }

  private clampToArena(at: Pt): Pt {
    const a = this.arena!;
    const d = dist(at, a.at);
    const max = a.radius - 4;
    if (d <= max) return at;
    return [a.at[0] + ((at[0] - a.at[0]) / d) * max, a.at[1] + ((at[1] - a.at[1]) / d) * max];
  }

  private addTell(f: Foe, t: Omit<Tell, "id" | "foe" | "t" | "total">, total: number): void {
    this.tells.push({ ...t, id: this.nextId++, foe: f.id, t: total, total });
  }

  private dropTells(foe: number): void {
    this.tells = this.tells.filter((t) => t.foe !== foe);
  }

  /** A foe shows the attack it is about to make. */
  private windUp(f: Foe, d: number): void {
    const spec = FOES[f.kind];
    const p = this.player;
    const toward = bearingTo(f.at, p);
    let tell = spec.tell;
    switch (f.kind) {
      case "ddl": {
        if (d < 4.5) {
          f.move = { type: "slam", at: f.at, radius: 4.8 };
          this.addTell(f, { shape: "circle", at: f.at, dir: 0, length: 0, width: 0, radius: 4.8 }, tell);
        } else {
          const length = Math.min(22, d + 6);
          f.move = { type: "charge", dir: toward, left: length, hit: false };
          this.addTell(f, { shape: "line", at: f.at, dir: toward, length, width: 2.6, radius: 0 }, tell);
        }
        break;
      }
      case "procrastination":
        f.move = { type: "yawn", at: f.at, radius: 4.2 };
        this.addTell(f, { shape: "circle", at: f.at, dir: 0, length: 0, width: 0, radius: 4.2 }, tell);
        break;
      case "plagiarism":
        // It copies itself behind the walker, then strikes.
        f.move = { type: "blink" };
        {
          const behind = (this.heading + 180) % 360;
          const [bx, by] = dirOf(behind);
          f.at = [p[0] + bx * 2.6, p[1] + by * 2.6];
          f.facing = bearingTo(f.at, p);
        }
        this.addTell(f, { shape: "circle", at: f.at, dir: 0, length: 0, width: 0, radius: 2.6 }, tell);
        break;
      case "anxiety":
        f.move = { type: "orb", count: 1, spread: 0 };
        break;
      case "distraction":
        f.move = { type: "melee" };
        break;
      case "exam":
        tell = this.bossMove(f, d);
        break;
    }
    f.state = "tell";
    f.t = tell;
    f.cool = spec.cooldown * (f.kind === "exam" ? 1.25 - f.phase * 0.15 : 1);
    if (f.move) this.events.push({ type: "tell", foe: f.id, kind: f.kind, move: f.move.type });
  }

  /** The Final Exam picks an attack for its phase, shows it, and says how long it shows it. */
  private bossMove(f: Foe, d: number): number {
    const p = this.player;
    const toward = bearingTo(f.at, p);
    const r = this.host.random();
    if (f.phase === 1) {
      // Multiple choice: four answers thrown in a fan, or a slam where the walker stands.
      if (r < 0.55 || d > 14) {
        f.move = { type: "orb", count: 4, spread: 42 };
        return 0.85;
      }
      f.move = { type: "slam", at: p, radius: 5.5 };
      this.addTell(f, { shape: "circle", at: p, dir: 0, length: 0, width: 0, radius: 5.5 }, 1.2);
      return 1.2;
    }
    if (f.phase === 2) {
      // The essay question: long lines of ink across the hall; and the phones come.
      if (r < 0.5) {
        const dirs = [toward - 28, toward, toward + 28];
        f.move = { type: "beams", dirs, length: 34, width: 2.8 };
        for (const dir of dirs) this.addTell(f, { shape: "line", at: f.at, dir, length: 34, width: 2.8, radius: 0 }, 1.3);
        return 1.3;
      }
      if (r < 0.72 && this.foes.filter((o) => o.kind === "distraction" && o.state !== "dead").length < 4) {
        f.move = { type: "summon" };
        return 0.9;
      }
      f.move = { type: "orb", count: 6, spread: 70 };
      return 0.8;
    }
    // Overtime: rings over the ground to dodge through, and charges across the hall.
    if (r < 0.45) {
      f.move = { type: "wave" };
      this.addTell(f, { shape: "circle", at: f.at, dir: 0, length: 0, width: 0, radius: 3.6 }, 0.85);
      return 0.85;
    }
    if (r < 0.8) {
      const length = Math.min(30, d + 8);
      f.move = { type: "charge", dir: toward, left: length, hit: false };
      this.addTell(f, { shape: "line", at: f.at, dir: toward, length, width: 4.2, radius: 0 }, 1.0);
      return 1.0;
    }
    f.move = { type: "slam", at: p, radius: 6.5 };
    this.addTell(f, { shape: "circle", at: p, dir: 0, length: 0, width: 0, radius: 6.5 }, 0.95);
    return 0.95;
  }

  /** The attack that was shown lands. */
  private unleash(f: Foe): void {
    const spec = FOES[f.kind];
    const m = f.move;
    const p = this.player;
    const dmg = spec.damage * (f.kind === "ddl" ? 1 + (f.tier - 1) * 0.5 : 1) * (f.kind === "exam" ? 1 + (f.phase - 1) * 0.15 : 1);
    this.dropTells(f.id);
    f.state = "recover";
    f.t = f.kind === "exam" ? 0.7 : 0.5;
    if (!m) return;
    switch (m.type) {
      case "melee":
        if (dist(f.at, p) <= spec.reach + spec.radius + 0.4) this.hurt(dmg, f.at);
        break;
      case "blink":
        if (dist(f.at, p) <= spec.reach + 0.8) this.hurt(dmg, f.at);
        break;
      case "slam":
        if (dist(m.at, p) <= m.radius) this.hurt(dmg, m.at);
        break;
      case "yawn":
        if (dist(m.at, p) <= m.radius) {
          this.hurt(dmg, m.at);
          if (this.iframes <= 0.35) this.slowT = 3;
        }
        break;
      case "orb": {
        const toward = bearingTo(f.at, p);
        for (let i = 0; i < m.count; i++) {
          const dir = toward + (m.count > 1 ? -m.spread / 2 + (m.spread * i) / (m.count - 1) : 0);
          const [ux, uy] = dirOf(dir);
          const speed = f.kind === "exam" ? 12 : 10;
          this.shots.push({ id: this.nextId++, mine: false, at: [f.at[0] + ux * spec.radius, f.at[1] + uy * spec.radius], vel: [ux * speed, uy * speed], life: 3, damage: f.kind === "exam" ? 13 : dmg, radius: 0.7 });
        }
        break;
      }
      case "beams":
        if (m.dirs.some((dir) => toSegment(p, f.at, dir, m.length) <= m.width / 2 + 0.4)) this.hurt(dmg, f.at);
        f.t = 0.9;
        break;
      case "wave":
        this.waves.push({ id: this.nextId++, at: f.at, r: spec.radius, speed: 13, max: 32, hit: false });
        f.t = 0.6;
        break;
      case "summon":
        for (let i = 0; i < 3; i++) this.spawn("distraction", this.ring(f.at, 4), f.quest, 1.2);
        break;
      case "charge":
        f.state = "attack";
        f.t = 1.4;
        return;
    }
    f.move = undefined;
  }

  /** A charge under way: straight along the line it showed, hurting the walker once if it passes it. */
  private attacking(f: Foe, dt: number, pace: number): void {
    const m = f.move;
    if (!m || m.type !== "charge") {
      f.state = "recover";
      f.t = 0.4;
      return;
    }
    const speed = (f.kind === "exam" ? 20 : 17) * Math.max(1, pace * 0.75);
    const go = Math.min(m.left, speed * dt);
    const [ux, uy] = dirOf(m.dir);
    f.at = [f.at[0] + ux * go, f.at[1] + uy * go];
    m.left -= go;
    f.facing = m.dir;
    if (!m.hit && dist(f.at, this.player) <= FOES[f.kind].radius + 0.9) {
      m.hit = true;
      this.hurt(FOES[f.kind].damage * (f.kind === "ddl" ? 1 + (f.tier - 1) * 0.5 : 1.25), f.at);
    }
    if (m.left <= 0 || f.t <= 0) {
      f.state = "recover";
      f.t = f.kind === "exam" ? 1.0 : 1.1;
      f.move = undefined;
    }
  }

  private shotsStep(dt: number): void {
    const p = this.player;
    for (const s of this.shots) {
      s.at = [s.at[0] + s.vel[0] * dt, s.at[1] + s.vel[1] * dt];
      s.life -= dt;
      if (s.life <= 0) continue;
      if (s.mine) {
        for (const f of this.foes) {
          if (f.state === "dead" || f.state === "rise") continue;
          if (dist(f.at, s.at) > FOES[f.kind].radius + s.radius) continue;
          this.damage(f, s.damage, bearingTo(p, f.at), 1, false);
          s.life = 0;
          break;
        }
      } else if (dist(s.at, p) <= s.radius + 0.4) {
        this.hurt(s.damage, s.at);
        s.life = 0;
      }
    }
    this.shots = this.shots.filter((s) => s.life > 0);
  }

  private wavesStep(dt: number): void {
    const p = this.player;
    for (const w of this.waves) {
      const before = w.r;
      w.r += w.speed * dt;
      const d = dist(w.at, p);
      if (!w.hit && d >= before - 0.6 && d <= w.r + 0.6) {
        w.hit = true;
        this.hurt(20, w.at);
      }
    }
    this.waves = this.waves.filter((w) => w.r < w.max);
  }

  private tellsStep(dt: number): void {
    for (const t of this.tells) t.t -= dt;
    this.tells = this.tells.filter((t) => t.t > 0);
  }
}

// ---------------------------------------------------------------------------------------------
// Where things lie
// ---------------------------------------------------------------------------------------------

/**
 * The cells of a walking grid that a walker at `from` can get to on foot, 1 for each. Pick-ups lie
 * only on these, so that none is shut in a courtyard or across a motorway.
 */
export function reachable(g: WalkGrid, from: Pt): Uint8Array {
  const mask = new Uint8Array(g.cols * g.rows);
  const start = nearestFree(g, from, 40);
  if (!start) return mask;
  const open = (i: number) => g.cost[i]! <= WALK_COST.open;
  const queue = new Int32Array(g.cols * g.rows);
  let head = 0;
  let tail = 0;
  const first = start[1] * g.cols + start[0];
  mask[first] = 1;
  queue[tail++] = first;
  while (head < tail) {
    const i = queue[head++]!;
    const c = i % g.cols;
    const r = (i - c) / g.cols;
    const next = [c > 0 ? i - 1 : -1, c < g.cols - 1 ? i + 1 : -1, r > 0 ? i - g.cols : -1, r < g.rows - 1 ? i + g.cols : -1];
    for (const n of next) {
      if (n < 0 || mask[n] || !open(n)) continue;
      mask[n] = 1;
      queue[tail++] = n;
    }
  }
  return mask;
}

/** A place pick-ups gather round: a building's middle, and how many it draws against the others. */
export interface BookDraw {
  center: Pt;
  weight: number;
}

/** Metres from a building's middle within which its pick-ups lie. */
const DRAW_REACH = 70;
/** Metres between two pick-ups, and between a new one and the walker. */
const BOOK_GAP = 8;
/** Metres from the walker within which a pick-up lies when no building draws it. */
const OPEN_REACH = 220;

/**
 * Somewhere to lay a pick-up: a reachable cell beside one of the `draws`, picked by weight, or
 * anywhere reachable within `openReach` metres of the walker when there is none. Undefined when a
 * few tries find no place.
 */
export function bookSpot(
  g: WalkGrid,
  reached: Uint8Array,
  draws: readonly BookDraw[],
  near: Pt,
  taken: readonly Pt[],
  random: () => number,
  openReach: number = OPEN_REACH,
): Pt | undefined {
  const total = draws.reduce((sum, d) => sum + d.weight, 0);
  for (let attempt = 0; attempt < 40; attempt++) {
    let centre = near;
    let reach = openReach;
    if (total > 0) {
      let pick = random() * total;
      for (const d of draws) {
        pick -= d.weight;
        if (pick <= 0) {
          centre = d.center;
          reach = DRAW_REACH;
          break;
        }
      }
    }
    const a = random() * Math.PI * 2;
    const far = Math.sqrt(random()) * reach;
    const p: Pt = [centre[0] + Math.sin(a) * far, centre[1] + Math.cos(a) * far];
    const [c, r] = cellOf(g, p);
    if (c < 0 || r < 0 || c >= g.cols || r >= g.rows || !reached[r * g.cols + c]) continue;
    const at = centreOf(g, c, r);
    if (Math.hypot(at[0] - near[0], at[1] - near[1]) < BOOK_GAP) continue;
    if (taken.some((t) => Math.hypot(at[0] - t[0], at[1] - t[1]) < BOOK_GAP)) continue;
    return at;
  }
  return undefined;
}

/**
 * Open ground for a fight: of `tries` reachable cells within `reach` metres of `centre`, the one
 * with the least in the way within `radius` metres (walls, water, trunks: blocked cells; a cell
 * nearer the middle counts more), so that nothing stands between the camera and a tall foe. A
 * little nearer `centre` wins a tie. At least `gap` metres from `near`. Undefined when no try
 * lands on reachable ground.
 */
export function openSpot(
  g: WalkGrid,
  reached: Uint8Array,
  centre: Pt,
  reach: number,
  radius: number,
  near: Pt,
  random: () => number,
  tries = 80,
  gap = BOOK_GAP,
): Pt | undefined {
  const k = Math.ceil(radius / g.cell);
  let best: Pt | undefined;
  let bestScore = Infinity;
  for (let attempt = 0; attempt < tries; attempt++) {
    const a = random() * Math.PI * 2;
    const far = Math.sqrt(random()) * reach;
    const [c, r] = cellOf(g, [centre[0] + Math.sin(a) * far, centre[1] + Math.cos(a) * far]);
    if (c < 0 || r < 0 || c >= g.cols || r >= g.rows || !reached[r * g.cols + c]) continue;
    const at = centreOf(g, c, r);
    if (Math.hypot(at[0] - near[0], at[1] - near[1]) < gap) continue;
    let score = 0;
    for (let dr = -k; dr <= k; dr++) {
      for (let dc = -k; dc <= k; dc++) {
        const d = Math.hypot(dc, dr) * g.cell;
        if (d > radius) continue;
        const cc = c + dc;
        const rr = r + dr;
        const out = cc < 0 || rr < 0 || cc >= g.cols || rr >= g.rows;
        if (out || g.cost[rr * g.cols + cc] === Infinity) score += 1 + 2 * (1 - d / radius);
      }
    }
    score += Math.hypot(at[0] - centre[0], at[1] - centre[1]) / Math.max(1, reach);
    if (score < bestScore) (bestScore = score), (best = at);
  }
  return best;
}
