// Study Quest's rules, with no drawing in them: a made-up action game laid over the walk. The
// walker grows by learning (knowledge is its experience, study ranks are its levels) and fights
// made-up villains that stand for study troubles: the DDL, an alarm clock that charges; the
// Procrastination blob that slows; the Distraction phones that swarm; the Plagiarism ghost that
// copies and blinks; the Exam Anxiety shade that throws from afar; and a boss, the Final Exam.
// None of it is campus data: no villain, book or quest stands for a real class, course, person,
// room's timetable or due date. Quests name buildings only as places to go, as a map would.
import { pointInRing, type Pt } from "./geo.ts";
import { WALK_COST, cellOf, centreOf, nearestFree, type WalkGrid } from "./walkpath.ts";
import { PLAYER } from "./gamePlayer.ts";
import {
  OPEN_WORLD,
  OpenWorldState,
  type CampusProp,
  type HumanNpc,
  type HumanRole,
  type JobStage,
  type MissionId,
  type OpenWorldBridge,
  type PickupItem,
  type PickupKind,
} from "./openWorld.ts";
import {
  CampusVehiclesState,
  VEHICLE_SPECS,
  type RoadInput,
  type VehicleControlInput,
  type VehicleKind,
} from "./campusVehicles.ts";
export {
  MAX_ATTACKERS,
  OPEN_WORLD,
  OpenWorldState,
  SIDE_HUSTLES,
  STORY_JOBS,
  type ActiveJob,
  type CampusProp,
  type CampusSpot,
  type HumanNpc,
  type HumanProp,
  type HumanRole,
  type HumanState,
  type HustleDef,
  type HustleId,
  type JobDef,
  type JobId,
  type JobStage,
  type MissionId,
  type PickupItem,
  type PickupKind,
  type PropKind,
  type SpotKind,
} from "./openWorld.ts";
export {
  CampusVehiclesState,
  DRIVABLE_ROAD_WIDTH,
  VEHICLE_SPECS,
  extractDrivableRoads,
  leftLanePoint,
  sampleRoad,
  vehicleBodyDist,
  type CampusVehicle,
  type DrivableRoadClass,
  type RoadInput,
  type RoadPolyline,
  type VehicleControlInput,
  type VehicleKind,
  type VehicleSpec,
  type VehicleTelemetry,
} from "./campusVehicles.ts";

// ---------------------------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------------------------

export type FoeKind =
  | "ddl"
  | "procrastination"
  | "distraction"
  | "plagiarism"
  | "anxiety"
  | "freeRider"
  | "debateRival"
  | "allNighter"
  | "exam";
export const FOE_KINDS: readonly FoeKind[] = [
  "ddl",
  "procrastination",
  "distraction",
  "plagiarism",
  "anxiety",
  "freeRider",
  "debateRival",
  "allNighter",
  "exam",
];
export const NPC_FOE_KINDS: readonly FoeKind[] = ["freeRider", "debateRival", "allNighter"];

/** Whether `k` is one of the rival student NPC kinds that drop pizza and add extra heat. */
export function isNpcFoe(k: FoeKind): boolean {
  return k === "freeRider" || k === "debateRival" || k === "allNighter";
}

export interface FoeSpec {
  hp: number;
  /** Metres a second it goes after the walker. */
  speed: number;
  damage: number;
  /** Metres from the walker at which it starts an attack. */
  reach: number;
  /** Metres: how big it is, for blows and for keeping apart. */
  radius: number;
  /**
   * Metres round its middle that the walker cannot come into, from its model's footprint at the
   * ground (the DDL's clock, the Final Exam's skirt): it slides round them. Absent: the walker can
   * brush through it, as through the small ones.
   */
  body?: number;
  /** Knowledge for beating it. */
  xp: number;
  /** Seconds it shows an attack coming before the attack lands. */
  tell: number;
  /** Seconds between attacks. */
  cooldown: number;
  /** Share of a blow's push it takes (heavy foes take less). */
  weight: number;
  /**
   * Share of a blow's harm it takes while it is on guard: all but the moments after its own attack
   * and while it is staggered. Absent: it never guards. The Eureka breaks any guard.
   */
  guard?: number;
}

export const FOES: Record<FoeKind, FoeSpec> = {
  ddl: { hp: 700, speed: 3.1, damage: 18, reach: 9, radius: 1.5, body: 1.3, xp: 60, tell: 0.95, cooldown: 1.7, weight: 0.35, guard: 0.6 },
  procrastination: { hp: 100, speed: 1.5, damage: 9, reach: 3.6, radius: 1.1, xp: 18, tell: 1.0, cooldown: 2.6, weight: 0.6 },
  distraction: { hp: 40, speed: 4.3, damage: 5, reach: 1.7, radius: 0.55, xp: 6, tell: 0.35, cooldown: 1.2, weight: 1.3 },
  plagiarism: { hp: 80, speed: 2.7, damage: 12, reach: 2.4, radius: 0.85, xp: 20, tell: 0.55, cooldown: 3.4, weight: 1 },
  anxiety: { hp: 65, speed: 2.3, damage: 9, reach: 13, radius: 0.85, xp: 16, tell: 0.6, cooldown: 2.3, weight: 1 },
  freeRider: { hp: 95, speed: 3.0, damage: 10, reach: 2.3, radius: 0.75, xp: 24, tell: 0.55, cooldown: 2.0, weight: 1.0 },
  debateRival: { hp: 135, speed: 2.8, damage: 13, reach: 11, radius: 0.8, xp: 32, tell: 0.65, cooldown: 2.4, weight: 0.85 },
  allNighter: { hp: 185, speed: 3.6, damage: 15, reach: 9, radius: 0.8, xp: 45, tell: 0.6, cooldown: 1.9, weight: 0.75, guard: 0.7 },
  exam: { hp: 6000, speed: 2.4, damage: 24, reach: 30, radius: 3.2, body: 2.1, xp: 450, tell: 1.15, cooldown: 1.5, weight: 0.08, guard: 0.25 },
};

/** Study ranks: the walker's levels, and the knowledge each needs. */
export const RANKS = [
  { id: "fresher", xp: 0 },
  { id: "sophomore", xp: 200 },
  { id: "junior", xp: 460 },
  { id: "senior", xp: 760 },
  { id: "honours", xp: 1100 },
  { id: "masters", xp: 1480 },
  { id: "doctoral", xp: 1900 },
  { id: "scholar", xp: 2360 },
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

export { PLAYER };

/** Seconds of a foe's reactions and of the boss's change of phase. */
export const FOE_TIME = {
  /** A small foe knocked off balance by a light blow (the heavier kinds by any). */
  stagger: 0.3,
  /** Any foe hit by a finisher: small ones at any time, the DDL and the boss only while they recover from an attack. */
  heavyStagger: 0.55,
  /** The boss's change of phase: it roars, and nothing can hurt it or the walker. */
  phase: 2.0,
  /** A foe beaten, as it breaks up; the boss takes longer. */
  death: 0.7,
  bossDeath: 1.6,
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
  booksOut: 0,
  coffeeOut: 4,
  pizzaOut: 6,
  cashOut: 4,
  /** Metres from a pick-up at which the walker takes it. */
  takeReach: 3.2,
  bookXp: 10,
  noteXp: 25,
  coffeeFocus: 25,
  pizzaFocus: 45,
  pizzaEnergy: 50,
  pizzaXp: 15,
  pizzaBuffSec: 25,
  pizzaCred: 0,
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
  /** Metres from the walker at which a quest's building is looked for, nearest and furthest. */
  placeRange: [80, 210] as const,
  /** Share of its kind's knowledge a foe that came by itself gives. */
  strayXp: 0.5,
  /** Metres from its place within which a quest's notes lie. */
  noteReach: 45,
  /** Share of its Focus the walker gets back at each of the boss's changes of phase: a second wind. */
  secondWind: 0.3,
  /**
   * Metres from the walker within which a foe keeps to the ground the walker can reach: one over a roof
   * comes on to the walker's ground, one on the ground goes round a building rather than over it, and
   * each attacks only from the ground.
   */
  fightGround: 30,
} as const;

/** The main story's quests: what each asks for and the knowledge it gives. */
export const MAIN = {
  orientation: { need: 6, reward: 20 },
  /**
   * The first DDL comes before the first rank: it is weaker than the one that returns, and gentler
   * than its tier alone makes it (a weak player who seldom dodges is not stopped here): its attacks
   * show for `tell` times as long and do `harm` of their harm.
   */
  ddl1: { need: 1, reward: 30, tier: 0.75, tell: 1.15, harm: 0.9 },
  studyGroup: { need: 13, reward: 60 },
  revision: { need: 5, reward: 100 },
  ddl2: { need: 3, reward: 80 },
  finalExam: { need: 1, reward: 200 },
} as const;

/**
 * The troubles a quest to clear a place brings out, wave by wave: the next comes when the last is
 * beaten. As many in all as the quest asks for.
 */
export const WAVES: Partial<Record<QuestKey, readonly (readonly FoeKind[])[]>> = {
  studyGroup: [
    ["distraction", "distraction", "distraction", "procrastination", "plagiarism"],
    ["distraction", "distraction", "plagiarism", "anxiety"],
    ["procrastination", "distraction", "distraction", "plagiarism"],
  ],
  ddl2: [["ddl", "anxiety", "anxiety"]],
  sideClear: [["distraction", "procrastination", "distraction"]],
};
/** How much stronger than its kind a wave's foe is, by quest: the DDL that returns is tougher. */
const WAVE_TIER: Partial<Record<QuestKey, Partial<Record<FoeKind, number>>>> = { ddl2: { ddl: 1.6, anxiety: 1.2 } };

/** The first minute, taught by play: where things are put, and when each prompt comes and goes. */
export const TEACH = {
  /** Metres ahead of the walker at which the first book glows. */
  firstBook: 8,
  /** Seconds after the start before the first fight's lone foe comes (soon after the first book is taken), and metres ahead it comes. */
  practiceAfter: 12,
  practiceSoon: 1.2,
  practiceAhead: 9,
  /** How strong it is against its kind, and how much longer its yawn shows before it lands. */
  practiceTier: 0.85,
  practiceTell: 1.6,
  /** Share of its Focus the walker keeps whatever hurts it, until the first quest is done. */
  floor: 0.35,
  /** Metres the walker goes before it counts as moving. */
  moved: 3,
  /** Metres within which a foe is near enough for the strike's prompt, the band for the flashcard's, and the sprint's. */
  strikeNear: 7,
  cardBand: [10, 28] as const,
  sprintNear: 12,
  /** Seconds a prompt is up at most, and attacks the dodge's is shown for, before it is let go for good. */
  maxShown: 14,
  dodgeTells: 3,
  /** Ground shockwaves (a slam, a ring) the jump's prompt is shown for, once the dodge is taught, before it is let go. */
  jumpTells: 3,
} as const;

// ---------------------------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------------------------

export type ItemKind = PickupKind;

export interface Item {
  id: number;
  kind: ItemKind;
  at: Pt;
  value?: number;
  /** The quest this note is for. */
  quest?: string;
  /** Whether this pick-up was dropped by a defeated rival or mission. */
  dropped?: boolean;
  /** Whether a pizza box is open. */
  open?: boolean;
  jobId?: MissionId;
  label?: string;
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
  /** The first fight's lone foe: weak, slow to strike, and unable to burn the walker out. */
  tutor?: boolean;
  /** The first DDL: its attacks show longer and hurt less (MAIN.ddl1). */
  gentle?: boolean;
  /** The side (1 right, -1 left) it last went round a building by, on the ground near the walker. */
  round?: 1 | -1;
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
  /** For a place to clear: the waves of foes out so far. */
  wave?: number;
}

export type GameEvent =
  | { type: "take"; kind: ItemKind; at: Pt; xp: number; value?: number }
  | { type: "swing"; combo: number; at: Pt; dir: number; plunge?: boolean }
  /** A strike pressed in the air: the highlighter raised, to come down as the walker lands. */
  | { type: "plungeReady"; at: Pt }
  /** `by`: what landed it, a blow of the highlighter, a flashcard, the Eureka or the sprint. */
  | { type: "hit"; foe: number; kind: FoeKind; at: Pt; amount: number; crit: boolean; heavy: boolean; dir: number; stagger: boolean; by: "blow" | "card" | "eureka" | "sprint" }
  | { type: "hitHuman"; id: number; role: HumanRole; at: Pt; amount: number; heavy: boolean }
  | { type: "hitEnv"; target: "vehicle" | "prop"; kind?: string; at: Pt; heavy: boolean }
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
  /** `time`: seconds until it strikes. */
  | { type: "tell"; foe: number; kind: FoeKind; move: FoeMove["type"]; time: number }
  /** A foe's attack that was shown lands, at `at`. */
  | { type: "lash"; foe: number; kind: FoeKind; move: FoeMove["type"]; at: Pt; radius: number }
  | { type: "phase"; phase: number }
  | { type: "over"; victory: boolean }
  /** Burnt out, the walker tries again from `at`, where the quest it was on began (or the boss's arena). */
  | { type: "retry"; at: Pt; heading: number; boss: boolean }
  /** A lesson taught: its prompt is not shown again. */
  | { type: "learn"; lesson: Lesson }
  | { type: "dropPizza"; foe: number; kind: FoeKind; at: Pt; count: number }
  | { type: "drop"; kind: PickupKind; at: Pt; value: number }
  | { type: "job"; id: MissionId; state: "start" | "stage" | "pass" | "fail"; stage?: JobStage; xp?: number; cash?: number }
  | { type: "checkpoint"; index: number; total: number; at: Pt }
  | { type: "subtitle"; speaker: string; key: string; ttl: number }
  | { type: "wanted"; level: number; evaded?: boolean }
  | { type: "vehicle"; action: "enter" | "exit" | "crash" | "callScooter" | "callMecha"; kind?: VehicleKind; carjacked?: boolean; at: Pt; speed?: number }
  | { type: "radio"; station: number };

export interface PhoneCommand {
  type: "gps" | "start" | "orderPizza" | "shuttle" | "callMecha" | "abort";
  targetId?: string;
}

export interface ActionPrompt {
  key: "F" | "G";
  action: "drive" | "ride" | "suitUp" | "exit" | "eat" | "buyPizza" | "talk";
  label?: string;
}

export interface QuestHost {
  /** Somewhere to lay a pick-up near `near`, or beside `place` when given; undefined when it finds none. */
  spot(near: Pt, taken: readonly Pt[], place?: Pt): Pt | undefined;
  /** The ground the walker can reach nearest `p`, away from homes, for a book or a foe that must be just there; `p` itself when absent. */
  near?(p: Pt): Pt | undefined;
  /** Whether the walker could stand at `p`: on ground it can reach, not in a building or on a roof. Everywhere when absent. */
  ground?(p: Pt): boolean;
  /** Whether a foe may rise at `p`: ground as `ground` gives it, and not on or beside a home (isHome). As `ground` when absent. */
  free?(p: Pt): boolean;
  /** Building roof height above local ground at `p` (metres), or undefined over open ground. */
  roofTopAboveGround?(p: Pt): number | undefined;
  /** Open ground the walker can reach within about 20 m of `centre`, well away from `away`, for a big foe to come from. */
  open?(centre: Pt, away: Pt): Pt | undefined;
  /** A place for a quest: beside a building with rooms to teach in, away from `avoid`. */
  place(near: Pt, avoid: readonly Pt[], big?: boolean): Place | undefined;
  /** Optional campus-only courtyard/building anchor for open-world missions and checkpoints. */
  campusAnchor?(near: Pt, avoid: readonly Pt[], minDist: number, maxDist: number, minGap?: number): { name: string; at: Pt } | undefined;
  /** 0 to 1, as Math.random gives. */
  random(): number;
  /** Drivable road polylines from ContextData.roads. */
  roads?: readonly RoadInput[];
}

export interface PlayerInput {
  at: Pt;
  /** Degrees the walker faces, clockwise from north. */
  heading: number;
  /**
   * The bearing the stick (the keys, the pad) asks the walker to go along, read against the camera;
   * undefined when it is let go. A blow's soft aim looks this way, and a dodge goes this way (back,
   * with none). Left out: the way it faces.
   */
  move?: number;
  /** Metres the walker's feet are off the ground (a jump); none or 0 on the ground. */
  air?: number;
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
  /** Times the walker was burnt out and tried again. */
  deaths: number;
}

/**
 * What the walker is taught by play, each once: a short prompt when the action is first needed,
 * gone when it is done (and never again in this browser).
 */
export type Lesson = "move" | "strike" | "dodge" | "jump" | "flashcard" | "sprint" | "eureka";
export const LESSONS: readonly Lesson[] = ["move", "strike", "dodge", "jump", "flashcard", "sprint", "eureka"];

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
/**
 * A move of `d` from `p` kept out of the circle of radius `r` round `c`: what of it would go into the
 * circle stops at its edge and goes on along it, so that a walker slides round. From inside the circle
 * (it was walked or pushed into), the move ends on its edge, straight out from the middle.
 */
export function slideRound(p: Pt, d: Pt, c: Pt, r: number): Pt {
  const qx = p[0] + d[0] - c[0];
  const qy = p[1] + d[1] - c[1];
  const px = p[0] - c[0];
  const py = p[1] - c[1];
  if (px * px + py * py < r * r) {
    const q = Math.hypot(qx, qy);
    if (q >= r) return d;
    // Out the way it moved, or else the way it stood; due south when it stands on the middle.
    const [ux, uy] = q > 1e-6 ? [qx / q, qy / q] : Math.hypot(px, py) > 1e-6 ? [px / Math.hypot(px, py), py / Math.hypot(px, py)] : [0, -1];
    return [c[0] + ux * r - p[0], c[1] + uy * r - p[1]];
  }
  // Where along the move it first meets the edge: |p + t d - c| = r.
  const a = d[0] * d[0] + d[1] * d[1];
  if (a < 1e-12) return d;
  const b = 2 * (px * d[0] + py * d[1]);
  const k = px * px + py * py - r * r;
  const disc = b * b - 4 * a * k;
  if (disc <= 0 || b >= 0) return d;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  if (t > 1) return d;
  const hx = px + d[0] * t;
  const hy = py + d[1] * t;
  const nx = hx / r;
  const ny = hy / r;
  // The rest of the move, less what goes in towards the middle; then put back on the edge.
  const rx = d[0] * (1 - t);
  const ry = d[1] * (1 - t);
  const into = rx * nx + ry * ny;
  let ex = hx + rx - into * nx;
  let ey = hy + ry - into * ny;
  const e = Math.hypot(ex, ey);
  if (e < r) ((ex *= r / e), (ey *= r / e));
  return [c[0] + ex - p[0], c[1] + ey - p[1]];
}

/**
 * A move of `d` from `p` kept out of the circle of radius `r` round `c` that charges along `dir`
 * (degrees): ending in it, the walker is put out to its side, the side it is on, square to the
 * charge, so that the charge goes on past it.
 */
export function knockAside(p: Pt, d: Pt, c: Pt, dir: number, r: number): Pt {
  const ux = Math.sin(dir * D2R);
  const uy = Math.cos(dir * D2R);
  const qx = p[0] + d[0] - c[0];
  const qy = p[1] + d[1] - c[1];
  const along = qx * ux + qy * uy;
  // Square to the charge, to the walker's right of it (looking along the charge) when positive.
  const lat = qx * uy - qy * ux;
  if (along * along + lat * lat >= r * r) return d;
  const side = lat > 0 || (lat === 0 && (p[0] - c[0]) * uy - (p[1] - c[1]) * ux >= 0) ? 1 : -1;
  const need = Math.sqrt(r * r - along * along) - Math.abs(lat);
  return [d[0] + uy * side * need, d[1] - ux * side * need];
}

/** Metres a second a foe charges at (the DDL, the Final Exam): faster after a walker on the scooter. */
/**
 * Metres a blow lunges: PLAYER.lunge for each blow of the combo, and up to PLAYER.lungeReach more
 * at a foe whose edge (`gap`, metres; undefined without a foe) is further than PLAYER.lungeFrom:
 * the blow closes in on a foe a little out of reach.
 */
export function lungeMetres(combo: number, gap?: number): number {
  const base = PLAYER.lunge[combo] ?? PLAYER.lunge[0];
  if (gap === undefined) return base;
  return base + Math.max(0, Math.min(PLAYER.lungeReach, gap - PLAYER.lungeFrom));
}

export function chargeSpeed(kind: FoeKind, pace = 1): number {
  return (kind === "exam" ? 20 : 17) * Math.max(1, pace * 0.75);
}

/** How much bigger than its kind's model a foe is drawn: a DDL by its tier (the scene draws it so). */
export function bodyScale(f: { kind: FoeKind; tier: number }): number {
  return f.kind === "ddl" ? 1 + (f.tier - 1) * 0.25 : 1;
}

/** Metres from a point to a segment that starts at `a` and goes `length` metres along `dir`. */
function toSegment(p: Pt, a: Pt, dir: number, length: number): number {
  const [ux, uy] = dirOf(dir);
  const t = Math.max(0, Math.min(length, (p[0] - a[0]) * ux + (p[1] - a[1]) * uy));
  return Math.hypot(p[0] - (a[0] + ux * t), p[1] - (a[1] + uy * t));
}

/** What the grade is made of: the course passed, then four factors, each with its most. */
export const GRADE = {
  victory: 40,
  /** Minutes of play for the time's full marks, and at which it gives none. */
  time: { max: 25, par: 8, zero: 14 },
  /** Marks for no defeat, one, two, three; none for more. */
  deaths: [20, 8, 4, 1] as readonly number[],
  /** The best hit combo for full marks. */
  combo: { max: 10, full: 30 },
  /** Knowledge for full marks. */
  knowledge: { max: 5, full: 1800 },
} as const;

export type GradeFactor = "time" | "deaths" | "combo" | "knowledge";
export const GRADE_FACTORS: readonly GradeFactor[] = ["time", "deaths", "combo", "knowledge"];

/**
 * Each factor's marks and its most: time only counts for a course passed; a defeat costs most of the
 * clean run's marks, so that an A+ needs a run with none.
 */
export function gradeFactors(d: Omit<Debrief, "grade">): Record<GradeFactor, { points: number; max: number }> {
  const min = d.seconds / 60;
  const t = GRADE.time;
  const time = d.victory ? t.max * Math.max(0, Math.min(1, (t.zero - min) / (t.zero - t.par))) : 0;
  return {
    time: { points: Math.round(time), max: t.max },
    deaths: { points: GRADE.deaths[d.deaths] ?? 0, max: GRADE.deaths[0]! },
    combo: { points: Math.round(GRADE.combo.max * Math.min(1, d.maxChain / GRADE.combo.full)), max: GRADE.combo.max },
    knowledge: { points: Math.round(GRADE.knowledge.max * Math.min(1, d.xp / GRADE.knowledge.full)), max: GRADE.knowledge.max },
  };
}

/** The letter grade a run earns, A+ to F. */
export function gradeFor(d: Omit<Debrief, "grade">): string {
  const f = gradeFactors(d);
  const points = (d.victory ? GRADE.victory : 0) + f.time.points + f.deaths.points + f.combo.points + f.knowledge.points;
  const scale: [number, string][] = [
    [95, "A+"],
    [89, "A"],
    [83, "A-"],
    [77, "B+"],
    [71, "B"],
    [65, "B-"],
    [59, "C+"],
    [53, "C"],
    [47, "C-"],
    [38, "D"],
  ];
  for (const [min, g] of scale) if (points >= min) return g;
  return "F";
}

// ---------------------------------------------------------------------------------------------
// The game
// ---------------------------------------------------------------------------------------------

type Action = "strike" | "heavy" | "dodge" | "card" | "eureka";

export class StudyQuest {
  phase: "play" | "over" = "play";
  victory = false;
  seconds = 0;
  xp = 0;
  rank = 0;
  focus: number;
  /** Blue energy/armour from eating pizza (0..100): grants +25% melee damage & 50% damage soak. */
  energy = 0;
  /** Stored pizza slices usable anytime with [G]. */
  slices = 1;
  /** Equipped melee weapon. */
  weapon: "fists" | "textbook" = "fists";
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
  /**
   * Hits in a row, each landed within `chainTime` of the last: a blow a guard turns counts a third
   * (`guardedChain`) and does not keep it going. Whole hits are shown (`hits`).
   */
  chain = 0;
  maxChain = 0;
  /** The chain in whole hits, as shown. */
  get hits(): number {
    return Math.floor(this.chain + 1e-6);
  }
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
  /** Seconds left of the boss's change of phase, in which nothing hurts the walker. */
  cineT = 0;
  grace: number = QUEST.grace;
  orders: PlayerOrders = { shove: [0, 0], slow: 1 };
  /** Times the walker was burnt out. */
  deaths = 0;
  /** Seconds left of pizza buff, total pizzas eaten, NZ$ cash/cred, 5-star Wanted & evade timer. */
  pizzaBuff = 0;
  pizzasEaten = 0;
  cash = 50;
  get cred(): number {
    return this.cash;
  }
  set cred(v: number) {
    this.cash = v;
  }
  cashDelta = 0;
  cashDeltaT = 0;
  wanted = 0;
  heat = 0;
  evadeT = 0;
  busted = false;
  radioStation = 0;
  gpsTarget?: Pt;
  gpsRoute: Pt[] = [];
  kmDriven = 0;
  rivalsBeat = 0;
  maxWanted = 0;
  openWorld: OpenWorldState;
  vehicles: CampusVehiclesState;
  /** Lessons taught, and the one whose prompt is up now. */
  taught: Set<Lesson>;
  lesson?: Lesson;
  /** Seconds each lesson's prompt has been up, and the attacks it was up for (the dodge's). */
  private shown = new Map<Lesson, number>();
  private dodgeTells = new Set<number>();
  /** Where the walker began, for the lesson to move. */
  private startAt: Pt;
  /** The first fight's foe, once it has come; and seconds to wait for it. */
  practice?: number;
  private practiceT: number = TEACH.practiceAfter;
  /** Where a retry starts: the start of the main quest under way, or the boss's arena. */
  private check: { step: number; at: Pt; heading: number; place?: Place; boss: boolean };
  private queued?: Action;
  private nextId = 1;
  private sideSeq = 0;
  private player: Pt;
  private heading = 0;
  private events: GameEvent[] = [];
  private move?: number;
  private dodgeDir = 0;
  private dodgeLeft = 0;
  /** A blow's lunge still to go (it is spread over the wind-up), and a knock back still to go (a stagger). */
  private lunge?: { dir: number; left: number; rate: number };
  private knock?: { dir: number; left: number };
  /** Foes the Cram Sprint under way has struck already. */
  private sprintHits = new Set<number>();
  /** A blow under way that has not landed yet, and a card drawn back that has not left the hand. */
  private blow?: { combo: number; dir: number; t: number; plunge?: boolean };
  /** Metres the walker's feet are off the ground now and at the last step; and a strike pressed in the air, to come down on landing. */
  private air = 0;
  private wasAir = 0;
  private plunge = false;
  /** The ground shockwaves the jump's prompt has been shown for. */
  private jumpTells = new Set<number>();
  private throwing?: { dir: number; t: number };

  /**
   * A game for a walker at `player` facing `heading`; `seen` are the lessons this visitor was taught
   * before (their prompts stay away, and a visitor taught to strike and dodge meets no first fight).
   */
  constructor(
    private host: QuestHost,
    player: Pt,
    heading = 0,
    seen: readonly string[] = [],
  ) {
    this.player = [player[0], player[1]];
    this.startAt = [player[0], player[1]];
    this.heading = heading;
    this.taught = new Set(LESSONS.filter((l) => seen.includes(l)));
    this.practiceT = Infinity;
    const s = statsFor(0);
    this.focus = s.maxFocus;
    this.stamina = s.maxStamina;
    this.check = { step: 0, at: [player[0], player[1]], heading, boss: false };
    this.fill(player);
    this.openWorld = new OpenWorldState(this.host, player, heading);
    this.vehicles = new CampusVehiclesState(this.host, player, heading);
    const firstObj = this.openWorld.currentObjectivePoint();
    if (firstObj) this.setGpsTarget(firstObj);
  }

  get stats(): ReturnType<typeof statsFor> {
    return statsFor(this.rank);
  }

  private get insight(): number {
    return this.stats.insight * (this.energy > 0 || this.pizzaBuff > 0 ? 1.25 : 1);
  }

  private safeGround(at: Pt): Pt {
    if (this.host.free ? this.host.free(at) : this.onGround(at)) return at;
    return this.host.near?.(at) ?? this.host.spot(at, [], at) ?? at;
  }

  private addCash(delta: number): void {
    this.cash = Math.max(0, this.cash + delta);
    this.cashDelta = delta;
    this.cashDeltaT = 3.0;
  }

  setGpsTarget(at: Pt | undefined): void {
    this.gpsTarget = at ? [at[0], at[1]] : undefined;
    this.gpsRoute = at ? this.vehicles.computeGpsRoute(this.player, at) : [];
  }

  addWanted(stars: number): void {
    if (stars <= 0) return;
    const prev = this.wanted;
    this.wanted = Math.min(5, this.wanted + stars);
    this.heat = Math.max(this.heat, this.wanted);
    this.maxWanted = Math.max(this.maxWanted, this.wanted);
    this.evadeT = 16;
    if (this.wanted !== prev) this.events.push({ type: "wanted", level: this.wanted });
  }

  setWanted(stars: number): void {
    const next = Math.max(0, Math.min(5, Math.round(stars)));
    if (next === this.wanted) return;
    this.wanted = next;
    this.heat = next;
    this.evadeT = next > 0 ? 16 : 0;
    this.events.push({ type: "wanted", level: next, evaded: next === 0 });
  }

  private owBridge(): OpenWorldBridge {
    return {
      host: this.host,
      startAt: this.startAt,
      wanted: this.wanted,
      inVehicle: this.vehicles.current !== undefined,
      playerIframes: this.iframes,
      obstacles: [
        ...this.openWorld.spots.map((s) => ({ at: s.at, radius: s.kind === "pizzaVan" ? 2.8 : 1.25 })),
        ...this.vehicles.vehicles.map((v) => ({ at: v.at, radius: v.kind === "scooter" ? 0.9 : 2.5 })),
      ],
      hurtPlayer: (amount, from) => this.hurt(amount, from),
      addWanted: (stars) => this.addWanted(stars),
      setWanted: (stars) => this.setWanted(stars),
      spawnPickup: (kind, at, value, opts = {}) => {
        const it: Item = {
          id: this.nextId++,
          kind,
          at: this.safeGround(at),
          value,
          dropped: opts.dropped,
          open: opts.open,
          jobId: opts.jobId,
        };
        this.items.push(it);
        return it as PickupItem;
      },
      pickups: this.items as PickupItem[],
      grantReward: (xp, cash) => {
        if (cash) this.addCash(cash);
        if (xp > 0) this.gain(xp);
      },
      setGpsTarget: (at) => this.setGpsTarget(at),
      emit: (ev) => {
        this.events.push(ev);
      },
      safeGround: (at) => this.safeGround(at),
    };
  }

  /** Applies pizza eat bonuses: +45 health, +50 blue energy/armour, full stamina, -1 wanted if outside active melee. */
  private eatPizzaEffect(): void {
    const s = this.stats;
    this.focus = Math.min(s.maxFocus, this.focus + QUEST.pizzaFocus);
    this.energy = Math.min(100, this.energy + QUEST.pizzaEnergy);
    this.stamina = s.maxStamina;
    this.pizzaBuff = QUEST.pizzaBuffSec;
    this.pizzasEaten++;
    const inActiveMelee = this.openWorld.humans.some(
      (h) => h.state !== "dead" && h.role !== "pedestrian" && h.role !== "giver" && (h.state === "windup" || h.state === "attack" || dist(h.at, this.player) <= 5),
    );
    if (!inActiveMelee && this.wanted > 0) {
      this.setWanted(this.wanted - 1);
    }
  }

  /** Uses [G] to buy/eat at Slice Co. Pizza Van, eat a stored slice, or interact with a nearby giver. */
  eatSlice(): boolean {
    if (this.phase !== "play") return false;
    const spot = this.openWorld.nearSpot(this.player, OPEN_WORLD.interactRadius);
    if (spot?.kind === "pizzaVan") {
      if (this.cash >= OPEN_WORLD.pizzaPrice) {
        this.addCash(-OPEN_WORLD.pizzaPrice);
        this.eatPizzaEffect();
        this.gain(QUEST.pizzaXp);
        this.events.push({ type: "take", kind: "pizza", at: this.player, xp: QUEST.pizzaXp });
        this.openWorld.onSliceEaten(this.owBridge());
        return true;
      }
      if (spot.cooldown <= 0) {
        spot.cooldown = OPEN_WORLD.spotCooldown;
        this.eatPizzaEffect();
        this.gain(QUEST.pizzaXp);
        this.events.push({ type: "take", kind: "pizza", at: this.player, xp: QUEST.pizzaXp });
        this.openWorld.onSliceEaten(this.owBridge());
        return true;
      }
    }
    if (this.slices > 0) {
      this.slices--;
      this.eatPizzaEffect();
      this.gain(QUEST.pizzaXp);
      this.events.push({ type: "take", kind: "pizza", at: this.player, xp: QUEST.pizzaXp });
      this.openWorld.onSliceEaten(this.owBridge());
      return true;
    }
    return this.interact();
  }

  /** Manually triggers or interacts with a nearby CampusSpot within 5 m. */
  interact(): boolean {
    if (this.phase !== "play") return false;
    return this.openWorld.interact(this.player, this.owBridge());
  }

  /** Enters nearest vehicle or exits current vehicle ([F]). */
  toggleVehicle(): boolean {
    if (this.phase !== "play") return false;
    if (this.vehicles.current) {
      const res = this.vehicles.exitCurrent(this.host);
      if (!res) return false;
      this.player = [res.at[0], res.at[1]];
      this.heading = res.heading;
      this.orders.face = res.heading;
      if (res.bailed) this.hurt(Math.max(4, Math.round((res.speed - 12) * 1.8)), res.at);
      this.events.push({ type: "vehicle", action: "exit", kind: res.vehicle.kind, at: res.at, speed: res.speed });
      return true;
    }
    const res = this.vehicles.enterNearest(this.player);
    if (!res) return false;
    if (res.carjacked) {
      this.addWanted(1);
      // Spawn fleeing driver pedestrian beside the car
      this.openWorld.spawnHuman("pedestrian", [res.vehicle.at[0] + 1.5, res.vehicle.at[1]], this.host).state = "flee";
    }
    this.player = [res.vehicle.at[0], res.vehicle.at[1]];
    this.heading = res.vehicle.heading;
    this.events.push({ type: "vehicle", action: "enter", kind: res.vehicle.kind, carjacked: res.carjacked, at: res.vehicle.at });
    return true;
  }

  /** Cycles Campus Radio station (0..3). */
  cycleRadio(): number {
    this.radioStation = (this.radioStation + 1) % 4;
    this.events.push({ type: "radio", station: this.radioStation });
    return this.radioStation;
  }

  /** Switches melee weapon between bare fists and heavy textbook. */
  switchWeapon(): "fists" | "textbook" {
    this.weapon = this.weapon === "fists" ? "textbook" : "fists";
    return this.weapon;
  }

  /** Dispatches an in-game Smartphone action. */
  phoneAction(cmd: PhoneCommand): boolean {
    if (this.phase !== "play") return false;
    this.openWorld.unreadPhone = false;
    if (cmd.type === "orderPizza") {
      if (this.cash < OPEN_WORLD.pizzaPrice) return false;
      this.addCash(-OPEN_WORLD.pizzaPrice);
      this.slices++;
      this.events.push({ type: "subtitle", speaker: "Slice Co.", key: "game.sub.pizzaOrdered", ttl: 3 });
      return true;
    }
    if (cmd.type === "shuttle") {
      const sc = this.vehicles.callScooter(this.host, this.player, this.heading);
      if (!sc) return false;
      this.events.push({ type: "vehicle", action: "callScooter", kind: "scooter", at: sc.at });
      return true;
    }
    if (cmd.type === "callMecha") {
      const m = this.vehicles.callMecha(this.host, this.player, this.heading);
      if (!m) return false;
      this.events.push({ type: "vehicle", action: "callMecha", kind: "mecha", at: m.at });
      return true;
    }
    if (cmd.type === "abort") {
      return this.openWorld.abortActive(this.owBridge());
    }
    if (cmd.type === "start" && cmd.targetId) {
      return this.openWorld.startMission(cmd.targetId as MissionId, this.player, this.owBridge());
    }
    if (cmd.type === "gps") {
      if (cmd.targetId === "pizzaVan") {
        const van = this.openWorld.spots.find((s) => s.kind === "pizzaVan");
        if (!van) return false;
        this.setGpsTarget(van.at);
        return true;
      }
      if (cmd.targetId) {
        const spot = this.openWorld.spots.find((s) => s.missionId === cmd.targetId || s.id === cmd.targetId);
        if (!spot) return false;
        this.setGpsTarget(spot.at);
        return true;
      }
      const next = this.openWorld.currentObjectivePoint();
      if (!next) return false;
      this.setGpsTarget(next);
      return true;
    }
    return false;
  }

  /** Context-sensitive bottom-center interaction prompt. */
  currentPrompt(): ActionPrompt | undefined {
    if (this.phase !== "play") return undefined;
    if (this.vehicles.current) return undefined;
    const nearVeh = this.vehicles.nearestEnterable(this.player);
    if (nearVeh) {
      return {
        key: "F",
        action: nearVeh.kind === "scooter" ? "ride" : nearVeh.kind === "mecha" ? "suitUp" : "drive",
        label: nearVeh.kind,
      };
    }
    const spot = this.openWorld.nearSpot(this.player, OPEN_WORLD.interactRadius);
    if (spot?.kind === "pizzaVan") return { key: "G", action: "buyPizza" };
    if (spot?.giver) return { key: "G", action: "talk", label: spot.giver };
    if (this.slices > 0 && this.focus < this.stats.maxFocus) return { key: "G", action: "eat" };
    return undefined;
  }

  has(skill: SkillId): boolean {
    return this.rank >= (SKILLS.find((s) => s.id === skill)?.rank ?? 99);
  }

  /**
   * Whether the walker may leave the ground now: not in a blow (its wind-up or its recovery), a
   * dodge or a stagger. A jump pressed meanwhile is kept a moment (locomotion.ts JUMP.buffer).
   */
  get canJump(): boolean {
    return this.phase === "play" && this.strikeT <= 0 && this.dodgeT <= 0 && !this.knock && !this.blow;
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
    const d = { victory: this.victory, seconds: this.seconds, xp: this.xp, rank: this.rank, defeated: this.defeated, maxChain: this.maxChain, focusLost: Math.round(this.focusLost), quests: this.questsDone, deaths: this.deaths };
    return { ...d, grade: gradeFor(d) };
  }

  // -------------------------------------------------------------------------------------------
  // The step
  // -------------------------------------------------------------------------------------------

  step(dt: number, input: PlayerInput, vehicleCtrl?: VehicleControlInput): GameEvent[] {
    this.events = [];
    this.orders = { shove: [0, 0], slow: this.slowT > 0 ? 0.55 : 1 };
    // A game that is over lets its foes go: they fade where they stand.
    if (this.phase === "over" && dt > 0 && this.foes.length) {
      for (const f of this.foes) {
        if (f.state !== "dead") ((f.state = "dead"), (f.t = FOE_TIME.death));
        f.t -= Math.min(dt, 0.1);
      }
      this.foes = this.foes.filter((f) => f.t > 0);
    }
    if (this.phase !== "play" || !input.active || dt <= 0) return this.events;
    dt = Math.min(dt, 0.1);
    const prevAt: Pt = [this.player[0], this.player[1]];
    this.player = [input.at[0], input.at[1]];
    this.heading = input.heading;
    this.move = "move" in input ? input.move : input.heading;
    this.wasAir = this.air;
    this.air = Math.max(0, input.air ?? 0);
    if (this.air > PLAYER.airborne) this.learn("jump");
    this.seconds += dt;
    // Hit-stop: the foes and what they throw freeze for a few hundredths; the walker goes on.
    const world = this.hitStop > 0 ? dt * 0.08 : dt;
    this.hitStop = Math.max(0, this.hitStop - dt);
    this.grace = Math.max(0, this.grace - dt);
    this.timers(dt);

    // Step campus vehicles (player driving + left-hand traffic + security patrols)
    this.vehicles.syncSecurityPatrols(this.host, this.player, this.wanted);
    const ctrl = vehicleCtrl ?? { throttle: 0, brake: 0, steer: 0, handbrake: false };
    const npcList = this.openWorld.humans.filter((h) => h.state !== "dead" && h.state !== "down").map((h) => ({ id: h.id, at: h.at }));
    const propObstacles = this.openWorld.spots.map((s) => ({
      at: s.at,
      heading: s.heading,
      halfW: s.kind === "pizzaVan" ? 1.02 : 0.92,
      halfL: s.kind === "pizzaVan" ? 2.85 : 0.46,
    }));
    const vEv = this.vehicles.step(dt, this.player, ctrl, this.host, npcList, propObstacles);
    const curId = this.vehicles.playerVehicleId;
    for (const c of vEv.crashes) {
      const involvesPlayer = curId !== undefined && (c.vehicleId === curId || c.otherVehicleId === curId);
      const nearPlayer = dist(c.at, this.player) <= 65;
      if (involvesPlayer || nearPlayer) {
        const hitVeh = this.vehicles.vehicles.find((v) => v.id === (c.vehicleId === curId ? c.otherVehicleId : c.vehicleId));
        this.events.push({ type: "vehicle", action: "crash", at: c.at, speed: c.speed, kind: hitVeh?.kind ?? this.vehicles.current?.kind });
      }
      if (involvesPlayer && c.speed > 12) this.hurt(Math.round((c.speed - 12) * 1.1), c.at);
      if (involvesPlayer && c.kind === "vehicle" && c.speed >= 8.5) this.addWanted(1);
    }
    for (const nh of vEv.npcHits) {
      const h = this.openWorld.humans.find((o) => o.id === nh.npcId);
      const veh = this.vehicles.vehicles.find((v) => v.id === nh.vehicleId);
      if (h && h.state !== "dead") {
        const hitHeading = veh?.heading ?? this.heading;
        if (veh) {
          const awayX = h.at[0] - veh.at[0];
          const awayY = h.at[1] - veh.at[1];
          const al = Math.hypot(awayX, awayY) || 1;
          const pushPt: Pt = [h.at[0] + (awayX / al) * 1.4, h.at[1] + (awayY / al) * 1.4];
          if (!this.host.ground || this.host.ground(pushPt)) h.at = pushPt;
        }
        const ko = this.openWorld.damageHuman(h, Math.round(nh.speed * 4.5), hitHeading, 2.4, true, this.owBridge());
        if (ko) {
          this.rivalsBeat++;
          this.defeated++;
        }
        // damageHuman already adds 1 wanted star when a pedestrian is struck; add 1 when hitting Security too.
        if (h.role === "security") this.addWanted(1);
      }
    }
    const driving = this.vehicles.current;
    if (driving) {
      this.player = [driving.at[0], driving.at[1]];
      this.heading = driving.heading;
      this.kmDriven += (Math.abs(driving.speed) * dt) / 1000;
    }

    this.take();
    if (!driving) {
      this.landed();
      this.actions();
      this.landing(dt);
      this.lunging(dt);
      this.dodging(dt);
    } else if (driving.kind === "mecha") {
      this.actions();
    } else {
      this.queued = undefined;
    }
    this.questsStep();
    this.openWorld.step(dt, this.player, this.owBridge());
    const playerSpeed = dist(this.player, prevAt) / Math.max(1e-4, dt);
    const bumpedProps = this.openWorld.stepProps(
      dt,
      this.player,
      playerSpeed,
      this.heading,
      !!driving && (driving.altitude ?? 0) < 1.8,
      this.vehicles.vehicles
        .filter((v) => v.altitude < 1.8)
        .map((v) => ({
          at: v.at,
          heading: v.heading,
          speed: v.speed,
          halfW: VEHICLE_SPECS[v.kind].halfW,
          halfL: VEHICLE_SPECS[v.kind].halfL,
        })),
      this.host,
    );
    for (const bp of bumpedProps) {
      this.events.push({ type: "hitEnv", target: "prop", kind: bp.kind, at: bp.at, heavy: false });
    }
    this.wantedStep(dt);
    this.practiceStep(dt);
    this.spawning(dt);
    this.foesStep(world, input.pace);
    this.shotsStep(world);
    this.wavesStep(world);
    this.tellsStep(world);
    this.foes = this.foes.filter((f) => !(f.state === "dead" && f.t <= 0));
    if (this.lock !== undefined && !this.foes.some((f) => f.id === this.lock && f.state !== "dead")) this.lock = undefined;
    // The walker's own steering is held back while it strikes, dodges or staggers: its feet are set.
    if (this.dodgeT > 0) this.orders.slow = 0;
    else if (this.knock) this.orders.slow = Math.min(this.orders.slow, PLAYER.staggerSlow);
    else if (this.strikeT > 0) this.orders.slow = Math.min(this.orders.slow, PLAYER.strikeSlow);
    this.keepOut();
    if (this.phase === "play" && this.foes.length > 0) this.lessons(dt);
    return this.events;
  }

  /**
   * The walker does not go into the DDL or the Final Exam: where it walked into one, or where what
   * the game pushes it by this step (a dodge, the sprint, a blow's lunge, a hit) would take it in, it
   * stops at the foe's body (FoeSpec.body) and slides round it. One that charges into the walker
   * knocks it aside, out of the charge's way, and runs on past it, rather than carrying it along.
   */
  private keepOut(): void {
    const s = this.orders.shove;
    for (const f of this.foes) {
      const body = FOES[f.kind].body;
      if (!body || f.state === "dead" || f.state === "rise") continue;
      const r = body * bodyScale(f) + PLAYER.body;
      const out = f.state === "attack" && f.move?.type === "charge" ? knockAside(this.player, s, f.at, f.move.dir, r) : slideRound(this.player, s, f.at, r);
      s[0] = out[0];
      s[1] = out[1];
    }
    if (!this.vehicles.current) {
      for (const h of this.openWorld.humans) {
        if (h.state === "dead" || h.state === "down") continue;
        const out = slideRound(this.player, s, h.at, 0.56);
        s[0] = out[0];
        s[1] = out[1];
      }
    }
  }

  // -------------------------------------------------------------------------------------------
  // The first minute: taught by play
  // -------------------------------------------------------------------------------------------

  private learn(l: Lesson): void {
    if (this.taught.has(l)) return;
    this.taught.add(l);
    if (this.lesson === l) this.lesson = undefined;
    this.events.push({ type: "learn", lesson: l });
  }

  /** The first fight: a lone, weak Procrastination a few steps ahead, soon after the first book. */
  private practiceStep(dt: number): void {
    if (this.practice !== undefined || this.mainStep > 0) return;
    this.practiceT -= dt;
    if (this.practiceT > 0) return;
    const [ux, uy] = dirOf(this.heading);
    const want: Pt = [this.player[0] + ux * TEACH.practiceAhead, this.player[1] + uy * TEACH.practiceAhead];
    const f = this.spawn("procrastination", (this.host.near ? this.host.near(want) : want) ?? want, undefined, TEACH.practiceTier);
    f.tutor = true;
    this.practice = f.id;
  }

  /**
   * The prompt for now, if any: the first time an action is needed, its key or button. Each goes
   * once the walker has done it, or after it has been up long enough; the dodge's first, while an
   * attack is about to land where the walker stands.
   */
  private lessons(dt: number): void {
    const t = this.taught;
    const p = this.player;
    let want: Lesson | undefined;
    if (!t.has("move") && dist(p, this.startAt) >= TEACH.moved) this.learn("move");
    const live = this.foes.filter((f) => f.state !== "dead" && f.state !== "rise");
    const near = (m: number) => live.some((f) => dist(f.at, p) - FOES[f.kind].radius <= m);
    if (!t.has("dodge")) {
      for (const tl of this.tells) {
        const hits = tl.shape === "circle" ? dist(tl.at, p) <= tl.radius + 0.5 : toSegment(p, tl.at, tl.dir, tl.length) <= tl.width / 2 + 0.5;
        if (!hits) continue;
        want = "dodge";
        this.dodgeTells.add(tl.id);
      }
      for (const f of live) {
        if (f.state !== "tell" || f.move?.type !== "melee" || dist(f.at, p) > FOES[f.kind].reach + FOES[f.kind].radius + 0.5) continue;
        want = "dodge";
        this.dodgeTells.add(-f.id);
      }
      // Shown for a few attacks and not taken up: it is let go.
      if (!want && this.dodgeTells.size >= TEACH.dodgeTells) this.learn("dodge");
    }
    if (!want && t.has("dodge") && !t.has("jump")) {
      // Once the dodge is taught: a shockwave over the ground (a slam, a ring) about to reach the
      // walker, which a jump clears.
      for (const tl of this.tells) {
        const f = this.foes.find((o) => o.id === tl.foe);
        const ground = f?.move?.type === "slam" || f?.move?.type === "wave";
        if (!ground || tl.shape !== "circle") continue;
        const hits = f!.move!.type === "wave" || dist(tl.at, p) <= tl.radius + 0.5;
        if (!hits) continue;
        want = "jump";
        this.jumpTells.add(tl.id);
      }
      if (!want && this.waves.some((w) => !w.hit && dist(w.at, p) > w.r)) want = "jump";
      if (!want && this.jumpTells.size >= TEACH.jumpTells) this.learn("jump");
    }
    if (!want && !t.has("strike") && near(TEACH.strikeNear)) want = "strike";
    if (!want && this.has("flashcard") && !t.has("flashcard") && live.some((f) => {
      const d = dist(f.at, p);
      return d >= TEACH.cardBand[0] && d <= TEACH.cardBand[1];
    })) want = "flashcard";
    if (!want && this.has("sprint") && !t.has("sprint") && near(TEACH.sprintNear)) want = "sprint";
    if (!want && this.has("eureka") && !t.has("eureka") && this.eurekaMeter >= PLAYER.eurekaCharge && near(PLAYER.eurekaRadius + 2)) want = "eureka";
    if (!want && !t.has("move")) want = "move";
    if (want && want !== "dodge" && want !== "jump") {
      const s = (this.shown.get(want) ?? 0) + dt;
      this.shown.set(want, s);
      if (s > TEACH.maxShown) {
        this.learn(want);
        want = undefined;
      }
    }
    this.lesson = want;
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
    this.cineT = Math.max(0, this.cineT - dt);
    this.pizzaBuff = Math.max(0, this.pizzaBuff - dt);
    if (this.cashDeltaT > 0) {
      this.cashDeltaT = Math.max(0, this.cashDeltaT - dt);
      if (this.cashDeltaT <= 0) this.cashDelta = 0;
    }
    this.hurtAgo += dt;
    const regen = PLAYER.staminaRegen * (this.pizzaBuff > 0 || this.energy > 0 ? 1.4 : 1);
    if (this.dodgeT <= 0) this.stamina = Math.min(s.maxStamina, this.stamina + regen * dt);
    if (this.hurtAgo > PLAYER.calm) this.focus = Math.min(s.maxFocus, this.focus + PLAYER.focusRegen * dt);
  }

  private wantedStep(dt: number): void {
    if (this.wanted <= 0) return;
    const secNear =
      this.openWorld.humans.some((h) => h.role === "security" && h.state !== "dead" && dist(h.at, this.player) <= 30) ||
      this.vehicles.vehicles.some((v) => v.isPolice && v.driver === "security" && dist(v.at, this.player) <= 34);
    if (secNear) {
      this.evadeT = 14;
      this.heat = this.wanted;
    } else {
      this.evadeT = Math.max(0, this.evadeT - dt);
      this.heat = Math.max(0, this.wanted - 1 + this.evadeT / 16);
      if (this.evadeT <= 0) this.setWanted(0);
    }
  }

  private actions(): void {
    const a = this.queued;
    if (!a) return;
    if (this.vehicles.current?.kind === "mecha") {
      this.queued = undefined;
      if (a === "strike" || a === "heavy") {
        if (this.strikeT <= 0) this.mechaStrike(a === "heavy");
      }
      return;
    }
    if (a === "strike" || a === "heavy") {
      if (this.strikeT > 0 || this.dodgeT > 0) return; // kept for when the blow ends
      this.queued = undefined;
      this.learn("strike");
      if (this.air > PLAYER.airborne) {
        // In the air: the highlighter raised, to come down as the walker lands (landed).
        if (!this.plunge) {
          this.plunge = true;
          this.events.push({ type: "plungeReady", at: this.player });
        }
        return;
      }
      this.strike(a === "heavy");
    } else if (a === "dodge") {
      if (this.air > PLAYER.airborne) return; // kept for when the walker lands
      this.queued = undefined;
      if (this.dodgeT > 0 || this.stamina < PLAYER.dodgeCost) return;
      this.stamina -= PLAYER.dodgeCost;
      const sprint = this.has("sprint");
      this.learn("dodge");
      if (sprint) this.learn("sprint");
      this.dodgeT = PLAYER.dodgeTime * (sprint ? 1.3 : 1);
      this.dodgeLeft = sprint ? PLAYER.sprintMetres : PLAYER.dodgeMetres;
      // The way the stick asks; with none, a step back.
      this.dodgeDir = this.move ?? (this.heading + 180) % 360;
      this.sprintHits.clear();
      this.iframes = PLAYER.iframes * (sprint ? 1.3 : 1);
      // It cuts short a blow under way (the recovery, or the wind-up), its lunge, and a stagger.
      this.strikeT = 0;
      this.blow = undefined;
      this.lunge = undefined;
      this.knock = undefined;
      this.events.push({ type: "dodge", at: this.player, dir: this.dodgeDir, sprint });
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
      this.learn("flashcard");
    } else if (a === "eureka") {
      this.queued = undefined;
      if (this.eurekaMeter < PLAYER.eurekaCharge) return;
      this.eurekaMeter = 0;
      this.learn("eureka");
      this.iframes = Math.max(this.iframes, 0.6);
      this.events.push({ type: "eureka", at: this.player });
      for (const f of this.foes) {
        if (f.state === "dead" || f.state === "rise") continue;
        const d = dist(f.at, this.player);
        if (d > PLAYER.eurekaRadius + FOES[f.kind].radius) continue;
        this.damage(f, this.insight * PLAYER.eurekaMult, bearingTo(this.player, f.at), 7, true, false, "eureka");
      }
      for (const h of this.openWorld.humans) {
        if (h.state === "dead" || h.role === "pedestrian" || h.role === "giver") continue;
        if (dist(h.at, this.player) > PLAYER.eurekaRadius + 0.6) continue;
        const amount = Math.round(this.insight * PLAYER.eurekaMult);
        const ko = this.openWorld.damageHuman(h, amount, bearingTo(this.player, h.at), 3.2, true, this.owBridge());
        this.events.push({ type: "hitHuman", id: h.id, role: h.role, at: h.at, amount, heavy: true });
        if (ko) {
          this.rivalsBeat++;
          this.defeated++;
        }
      }
      this.hitStop = Math.max(this.hitStop, 0.12);
    }
  }

  /**
   * The way a blow or a card goes: at the foe locked on to, or turned to the nearest foe in front
   * within `reach` and `arc` degrees (soft aim), or straight ahead.
   */
  private aim(reach: number = PLAYER.softReach, arc: number = PLAYER.softArc): number {
    return this.aimed(reach, arc).dir;
  }

  /**
   * The way a blow goes and the foe it goes at: the one locked on to, or the nearest within `reach`
   * and `arc` degrees of the way the stick asks (of the way the walker faces, with the stick let go).
   */
  private aimed(reach: number = PLAYER.softReach, arc: number = PLAYER.softArc): { dir: number; foe?: Foe; human?: HumanNpc } {
    const locked = this.foes.find((f) => f.id === this.lock && f.state !== "dead");
    if (locked) return { dir: bearingTo(this.player, locked.at), foe: locked };
    const ref = this.move ?? this.heading;
    const best = this.nearestTo(ref, reach, arc) ?? (Math.abs(turnBetween(ref, this.heading)) > 1 ? this.nearestTo(this.heading, reach, arc) : undefined);
    if (best) return { dir: bearingTo(this.player, best.at), foe: best };
    const hBest = this.nearestHumanTo(ref, reach, arc) ?? (Math.abs(turnBetween(ref, this.heading)) > 1 ? this.nearestHumanTo(this.heading, reach, arc) : undefined);
    if (hBest) return { dir: bearingTo(this.player, hBest.at), human: hBest };
    const pBest = this.nearestPropTo(ref, Math.min(reach, 2.2), Math.min(arc, 45));
    return pBest ? { dir: bearingTo(this.player, pBest.at) } : { dir: ref };
  }

  private nearestPropTo(ref: number, reach: number, arc: number): CampusProp | undefined {
    let best: CampusProp | undefined;
    let score = Infinity;
    for (const p of this.openWorld.props) {
      const d = dist(p.at, this.player) - p.radius;
      if (d > reach) continue;
      const off = Math.abs(turnBetween(ref, bearingTo(this.player, p.at)));
      if (off > arc) continue;
      const s = d + off * 0.05;
      if (s < score) {
        score = s;
        best = p;
      }
    }
    return best;
  }

  private nearestHumanTo(ref: number, reach: number, arc: number): HumanNpc | undefined {
    let bestHostile: HumanNpc | undefined;
    let hostileScore = Infinity;
    let bestPed: HumanNpc | undefined;
    let pedScore = Infinity;
    for (const h of this.openWorld.humans) {
      if (h.state === "dead" || h.role === "giver") continue;
      const d = dist(h.at, this.player) - 0.5;
      const isPed = h.role === "pedestrian";
      if (d > (isPed ? Math.min(reach, 2.8) : reach)) continue;
      const off = Math.abs(turnBetween(ref, bearingTo(this.player, h.at)));
      if (off > (isPed ? Math.min(arc, 55) : arc)) continue;
      const s = d + off * 0.05;
      if (!isPed && s < hostileScore) {
        hostileScore = s;
        bestHostile = h;
      } else if (isPed && s < pedScore) {
        pedScore = s;
        bestPed = h;
      }
    }
    return bestHostile ?? bestPed;
  }

  /** The nearest foe within `reach` (from its edge) and `arc` degrees of `ref`, the turn off it counting a little. */
  private nearestTo(ref: number, reach: number, arc: number): Foe | undefined {
    let best: Foe | undefined;
    let score = Infinity;
    for (const f of this.foes) {
      if (f.state === "dead" || f.state === "rise") continue;
      const d = dist(f.at, this.player) - FOES[f.kind].radius;
      if (d > reach) continue;
      const off = Math.abs(turnBetween(ref, bearingTo(this.player, f.at)));
      if (off > arc) continue;
      const s = d + off * 0.05;
      if (s < score) {
        score = s;
        best = f;
      }
    }
    return best;
  }

  /** The walker lands: a strike pressed in the air comes down as a slash (PLAYER.plunge*). */
  private landed(): void {
    if (!(this.wasAir > PLAYER.airborne && this.air <= PLAYER.airborne)) return;
    if (!this.plunge) return;
    this.plunge = false;
    const { dir } = this.aimed();
    if (Math.abs(turnBetween(this.heading, dir)) > 1) this.orders.face = dir;
    this.combo = 0;
    this.comboT = 0;
    this.strikeT = PLAYER.plungeTime;
    this.lunge = undefined;
    this.knock = undefined;
    this.events.push({ type: "swing", combo: 2, at: this.player, dir, plunge: true });
    this.blow = { combo: 2, dir, t: PLAYER.plungeContact, plunge: true };
  }

  private strike(forceHeavy = false): void {
    const combo = forceHeavy ? 2 : this.comboT > 0 ? (this.combo + 1) % 3 : 0;
    this.combo = combo;
    this.strikeT = PLAYER.strikeTime[combo]!;
    this.comboT = this.strikeT + PLAYER.comboWindow;
    const { dir, foe, human } = this.aimed();
    if (Math.abs(turnBetween(this.heading, dir)) > 1) this.orders.face = dir;
    const gap = foe ? dist(foe.at, this.player) - FOES[foe.kind].radius : human ? dist(human.at, this.player) - 0.55 : undefined;
    const metres = lungeMetres(combo, gap);
    this.lunge = { dir, left: metres, rate: metres / PLAYER.strikeContact[combo]! };
    this.knock = undefined;
    this.events.push({ type: "swing", combo, at: this.player, dir });
    // It lands after the wind-up (landing).
    this.blow = { combo, dir, t: PLAYER.strikeContact[combo]! };
  }

  /** Hydraulic Exo-Suit repulsor strike: hits foes, NPCs, props & parked cars within 4.2 m. */
  private mechaStrike(heavy: boolean): void {
    const suit = this.vehicles.current;
    if (!suit || suit.kind !== "mecha") return;
    this.strikeT = heavy ? 0.44 : 0.28;
    suit.attackT = heavy ? 0.36 : 0.26;
    const from = suit.at;
    const dir = suit.heading;
    const reach = 4.2;
    const arc = 85;
    const dmg = Math.max(1, Math.round(this.insight * (heavy ? 3.2 : 2.2)));
    this.events.push({ type: "swing", combo: heavy ? 2 : 0, at: from, dir });
    if (suit.altitude > 2.4) return;
    for (const f of this.foes) {
      if (f.state === "dead" || f.state === "rise") continue;
      if (dist(f.at, from) <= reach + FOES[f.kind].radius) {
        this.damage(f, dmg, dir, heavy ? 8 : 5, heavy);
      }
    }
    for (const h of this.openWorld.humans) {
      if (h.state === "dead" || h.role === "giver") continue;
      const d = dist(h.at, from);
      if (d > reach + 0.6) continue;
      const off = Math.abs(turnBetween(dir, bearingTo(from, h.at)));
      if (off > arc && d > 1.4) continue;
      const ko = this.openWorld.damageHuman(h, dmg, dir, heavy ? 4.2 : 2.8, true, this.owBridge());
      this.events.push({ type: "hitHuman", id: h.id, role: h.role, at: h.at, amount: dmg, heavy: true });
      if (ko) {
        this.rivalsBeat++;
        this.defeated++;
        if (h.role === "security") this.addWanted(1);
      }
    }
    for (const p of this.openWorld.hitPropsMelee(from, dir, reach, arc, true, this.owBridge())) {
      this.events.push({ type: "hitEnv", target: "prop", kind: p.kind, at: p.at, heavy: true });
    }
    const hitVeh = this.vehicles.hitVehicleMelee(from, dir, reach + 0.4, arc, dmg, true);
    if (hitVeh) {
      if (hitVeh.vehicle.isPolice) this.addWanted(1);
      this.events.push({ type: "hitEnv", target: "vehicle", kind: hitVeh.vehicle.kind, at: hitVeh.at, heavy: true });
    }
    this.hitStop = Math.max(this.hitStop, 0.04);
  }

  /**
   * A blow lands, and a card leaves the hand, when its time comes: counted from the start of the
   * step it began in, so that one whose wind-up is shorter than the step lands in that step.
   */
  private landing(dt: number): void {
    const b = this.blow;
    if (b && (b.t -= dt) <= 0) {
      this.blow = undefined;
      // From where the lunge ends: the part of it still to go is on its way.
      const left = this.lunge?.left ?? 0;
      const [lx, ly] = dirOf(this.lunge?.dir ?? b.dir);
      const from: Pt = [this.player[0] + lx * left, this.player[1] + ly * left];
      const weaponMult = this.weapon === "textbook" ? 1.35 : 1;
      const reachBoost = this.weapon === "textbook" ? 0.35 : 0;
      for (const f of this.foes) {
        if (f.state === "dead" || f.state === "rise") continue;
        const spec = FOES[f.kind];
        const d = dist(f.at, from);
        if (d > PLAYER.strikeReach + spec.radius) continue;
        const off = Math.abs(turnBetween(b.dir, bearingTo(from, f.at)));
        // Right against it, a foe counts whichever way the blow goes.
        if (off > (b.plunge ? PLAYER.plungeArc : PLAYER.strikeArc) && d > spec.radius + 0.6) continue;
        this.damage(f, this.insight * (b.plunge ? PLAYER.plungeMult : PLAYER.strikeMult[b.combo]!), b.dir, b.plunge ? PLAYER.plungePush : PLAYER.strikePush[b.combo]!, b.combo === 2);
      }
      for (const h of this.openWorld.humans) {
        if (h.state === "dead" || h.role === "giver") continue;
        const d = dist(h.at, from);
        if (d > PLAYER.strikeReach + reachBoost + 0.6) continue;
        const off = Math.abs(turnBetween(b.dir, bearingTo(from, h.at)));
        if (off > (b.plunge ? PLAYER.plungeArc : PLAYER.strikeArc) && d > 1.25) continue;
        const amount = Math.max(1, Math.round(this.insight * weaponMult * (b.plunge ? PLAYER.plungeMult : PLAYER.strikeMult[b.combo]!)));
        const heavy = b.combo === 2 || !!b.plunge;
        const ko = this.openWorld.damageHuman(h, amount, b.dir, b.plunge ? PLAYER.plungePush : PLAYER.strikePush[b.combo]!, heavy, this.owBridge());
        this.chain++;
        this.chainT = PLAYER.chainTime;
        this.maxChain = Math.max(this.maxChain, this.hits);
        this.hitStop = Math.max(this.hitStop, heavy ? PLAYER.hitStop.heavy : PLAYER.hitStop.light);
        this.events.push({ type: "hitHuman", id: h.id, role: h.role, at: h.at, amount, heavy });
        if (ko) {
          this.rivalsBeat++;
          this.defeated++;
          this.gain(h.role === "allNighter" ? 40 : h.role === "security" ? 35 : 25);
          if (h.role === "security") this.addWanted(1);
        }
      }
      const heavy = b.combo === 2 || !!b.plunge;
      const arc = b.plunge ? PLAYER.plungeArc : PLAYER.strikeArc;
      const hitProps = this.openWorld.hitPropsMelee(from, b.dir, PLAYER.strikeReach + reachBoost, arc, heavy, this.owBridge());
      for (const p of hitProps) {
        this.events.push({ type: "hitEnv", target: "prop", kind: p.kind, at: p.at, heavy });
        this.hitStop = Math.max(this.hitStop, 0.03);
      }
      const hitVeh = this.vehicles.hitVehicleMelee(
        from,
        b.dir,
        PLAYER.strikeReach + reachBoost + 0.25,
        arc,
        Math.max(1, Math.round(this.insight * weaponMult)),
        heavy,
      );
      if (hitVeh) {
        if (hitVeh.vehicle.isPolice) this.addWanted(1);
        this.events.push({ type: "hitEnv", target: "vehicle", kind: hitVeh.vehicle.kind, at: hitVeh.at, heavy });
        this.hitStop = Math.max(this.hitStop, 0.04);
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
        damage: this.insight * 0.85,
        radius: 0.6,
      });
    }
  }

  /** Hurts a foe: with a chance of a critical blow, a push, a flash, and a hit-stop. */
  private damage(f: Foe, base: number, dir: number, push: number, heavy: boolean, charges = true, by: "blow" | "card" | "eureka" | "sprint" = "blow"): void {
    if (f.state === "dead" || f.state === "phase" || f.state === "rise") return;
    const crit = this.host.random() < this.stats.crit;
    const spec0 = FOES[f.kind];
    const guard = spec0.guard !== undefined && by !== "eureka" && f.state !== "recover" && f.state !== "stagger" ? spec0.guard : 1;
    const amount = Math.max(1, Math.round(base * (0.9 + this.host.random() * 0.2) * (crit ? 1.8 : 1) * guard));
    f.hp = Math.max(0, f.hp - amount);
    f.hurtAgo = 0;
    const spec = FOES[f.kind];
    const [ux, uy] = dirOf(dir);
    const k = push * spec.weight * 4;
    f.push = [f.push[0] + ux * k, f.push[1] + uy * k];
    // A blow the guard turns barely counts, and only in a chain that landed blows keep going: the
    // count against the boss on guard does not climb into the hundreds.
    if (guard <= 0.5) this.chain += PLAYER.guardedChain;
    else {
      this.chain++;
      this.chainT = PLAYER.chainTime;
    }
    this.maxChain = Math.max(this.maxChain, this.hits);
    if (charges && this.has("eureka")) this.eurekaMeter = Math.min(PLAYER.eurekaCharge, this.eurekaMeter + amount * 0.3);
    const hs = PLAYER.hitStop;
    this.hitStop = Math.max(this.hitStop, crit ? (heavy ? hs.critHeavy : hs.crit) : heavy ? hs.heavy : hs.light);
    // A heavy blow stops a small foe's attack, and a finisher knocks it off balance for longer. The
    // DDL and the boss shrug off all blows but a finisher landed while they recover from an attack:
    // that is the moment to punish them.
    const small = f.kind !== "exam" && f.kind !== "ddl";
    let stagger = 0;
    // A light blow does not stop an attack that is showing: only a finisher does, so that blows
    // alone do not keep a crowd from ever striking back.
    if (small && f.hp > 0 && (heavy || (spec.weight >= 1 && f.state !== "tell")) && f.state !== "attack") stagger = heavy ? FOE_TIME.heavyStagger : FOE_TIME.stagger;
    else if (!small && heavy && f.state === "recover" && f.hp > 0) stagger = FOE_TIME.heavyStagger;
    if (stagger) {
      f.state = "stagger";
      f.t = stagger;
      f.move = undefined;
      this.dropTells(f.id);
    }
    this.events.push({ type: "hit", foe: f.id, kind: f.kind, at: f.at, amount, crit, heavy, dir, stagger: stagger > 0, by });
    if (f.kind === "exam") {
      const share = f.hp / f.maxHp;
      const want = share > 0.66 ? 1 : share > 0.33 ? 2 : 3;
      if (want > f.phase && f.hp > 0) {
        f.phase = want;
        f.state = "phase";
        f.t = FOE_TIME.phase;
        f.move = undefined;
        this.dropTells(f.id);
        // Its change of phase is a pause for both: what it had thrown is gone, nothing hurts the
        // walker, and the walker gets its second wind.
        this.cineT = FOE_TIME.phase;
        this.focus = Math.min(this.stats.maxFocus, this.focus + this.stats.maxFocus * QUEST.secondWind);
        this.shots = this.shots.filter((s) => s.mine);
        this.waves = [];
        this.events.push({ type: "phase", phase: want });
        return;
      }
    }
    if (f.hp <= 0) this.kill(f);
  }

  private kill(f: Foe): void {
    f.state = "dead";
    f.t = f.kind === "exam" ? FOE_TIME.bossDeath : FOE_TIME.death;
    f.move = undefined;
    this.dropTells(f.id);
    // A stray is worth less than a quest's foe: the story, not the wandering, sets the pace of the ranks.
    const xp = Math.round(FOES[f.kind].xp * f.tier * (f.wander ? QUEST.strayXp : 1));
    this.defeated++;
    this.cred += isNpcFoe(f.kind) ? 35 : f.kind === "exam" ? 120 : 15;
    this.heat = Math.min(3, this.heat + (isNpcFoe(f.kind) ? 0.25 : 0.18));
    if (this.hits >= 6) this.heat = Math.min(3, this.heat + 0.08);
    this.events.push({ type: "kill", foe: f.id, kind: f.kind, at: f.at, xp });
    this.gain(xp);
    if (isNpcFoe(f.kind)) {
      const count = f.kind === "allNighter" ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const raw: Pt = count === 1 ? f.at : [f.at[0] + (i === 0 ? -1.2 : 1.2), f.at[1] + (i === 0 ? 0.8 : -0.8)];
        this.items.push({ id: this.nextId++, kind: "pizza", at: this.safeGround(raw), dropped: true });
      }
      this.events.push({ type: "dropPizza", foe: f.id, kind: f.kind, at: f.at, count });
    }
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

  /** A blow's lunge and a blow's knock back, a step at a time. */
  private lunging(dt: number): void {
    const l = this.lunge;
    if (l) {
      const go = Math.min(l.left, l.rate * dt);
      l.left -= go;
      const [ux, uy] = dirOf(l.dir);
      this.orders.shove = [this.orders.shove[0] + ux * go, this.orders.shove[1] + uy * go];
      if (l.left <= 1e-6) this.lunge = undefined;
    }
    const k = this.knock;
    if (k) {
      const go = Math.min(k.left, (PLAYER.knockMetres / PLAYER.staggerTime) * dt);
      k.left -= go;
      const [ux, uy] = dirOf(k.dir);
      this.orders.shove = [this.orders.shove[0] + ux * go, this.orders.shove[1] + uy * go];
      if (k.left <= 1e-6) this.knock = undefined;
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
        this.damage(f, this.insight * 0.8, this.dodgeDir, 1, false, true, "sprint");
      }
      for (const h of this.openWorld.humans) {
        if (h.state === "dead" || h.role === "giver" || this.sprintHits.has(-h.id)) continue;
        if (dist(h.at, this.player) > 1.7) continue;
        this.sprintHits.add(-h.id);
        const amount = Math.round(this.insight * (this.weapon === "textbook" ? 1.35 : 1) * 0.9);
        const ko = this.openWorld.damageHuman(h, amount, this.dodgeDir, 2.2, true, this.owBridge());
        this.events.push({ type: "hitHuman", id: h.id, role: h.role, at: h.at, amount, heavy: true });
        if (ko) {
          this.rivalsBeat++;
          this.defeated++;
        }
      }
      const sprintProps = this.openWorld.hitPropsMelee(this.player, this.dodgeDir, 0.9, 90, true, this.owBridge());
      for (const p of sprintProps) {
        const key = -(100000 + p.id);
        if (this.sprintHits.has(key)) continue;
        this.sprintHits.add(key);
        this.events.push({ type: "hitEnv", target: "prop", kind: p.kind, at: p.at, heavy: true });
      }
      const sprintVeh = this.vehicles.hitVehicleMelee(this.player, this.dodgeDir, 0.6, 75, Math.round(this.insight * 0.8), true);
      if (sprintVeh) {
        const key = -(200000 + sprintVeh.vehicle.id);
        if (!this.sprintHits.has(key)) {
          this.sprintHits.add(key);
          if (sprintVeh.vehicle.isPolice) this.addWanted(1);
          this.events.push({ type: "hitEnv", target: "vehicle", kind: sprintVeh.vehicle.kind, at: sprintVeh.at, heavy: true });
        }
      }
    }
  }

  /** The walker is hurt, unless it is dodging. Blue energy/armour absorbs 50% of incoming damage. */
  private hurt(amount: number, from: Pt): void {
    if (this.phase !== "play" || this.grace > 0 || this.cineT > 0) return;
    if (this.iframes > 0) {
      this.events.push({ type: "evade", at: this.player });
      if (this.has("eureka")) this.eurekaMeter = Math.min(PLAYER.eurekaCharge, this.eurekaMeter + 12);
      return;
    }
    let dmg = amount;
    if (this.energy > 0) {
      const absorbed = Math.min(this.energy, dmg * 0.5);
      this.energy = Math.max(0, this.energy - absorbed);
      dmg -= absorbed;
    }
    const floor = this.quests.some((q) => q.key === "orientation") ? this.stats.maxFocus * TEACH.floor : 0;
    this.focus = Math.max(Math.min(this.focus, floor), this.focus - dmg);
    this.focusLost += dmg;
    this.hurtAgo = 0;
    this.iframes = 0.35;
    // Knocked back over a stagger, not all at once; it ends a blow's lunge.
    this.knock = { dir: bearingTo(from, this.player), left: PLAYER.knockMetres };
    this.lunge = undefined;
    this.events.push({ type: "hurt", amount: dmg, from });
    if (this.focus <= 0) {
      this.busted = this.wanted > 0 && this.openWorld.humans.some((h) => h.role === "security" && h.state !== "dead" && dist(h.at, this.player) <= 6);
      this.end(false);
    }
  }

  private end(victory: boolean): void {
    this.phase = "over";
    this.victory = victory;
    this.lesson = undefined;
    if (!victory) this.deaths++;
    this.tells = [];
    this.waves = [];
    this.shots = [];
    this.events.push({ type: "over", victory });
  }

  // -------------------------------------------------------------------------------------------
  // Pick-ups
  // -------------------------------------------------------------------------------------------

  /** Lays grounded pizza, coffee, and cash pickups on reachable awayFromHomes ground. */
  private fill(player: Pt): void {
    const taken = () => this.items.map((i) => i.at);
    const count = (k: ItemKind) => this.items.filter((i) => i.kind === k && !i.quest && !i.dropped).length;
    for (const kind of ["pizza", "coffee", "cash"] as const) {
      const want = kind === "pizza" ? QUEST.pizzaOut : kind === "coffee" ? QUEST.coffeeOut : QUEST.cashOut;
      while (count(kind) < want) {
        const at = this.host.spot(player, taken());
        if (!at) return;
        this.items.push({ id: this.nextId++, kind, at, value: kind === "cash" ? 25 : 1 });
      }
    }
  }

  private take(): void {
    const p = this.player;
    let took = false;
    const collected: PickupItem[] = [];
    const s = this.stats;
    this.items = this.items.filter((it) => {
      const reach = it.kind === "package" ? QUEST.takeReach + 0.5 : QUEST.takeReach;
      if (dist(it.at, p) > reach) return true;
      // Coffee waits on the ground for a walker that needs it; pizza, cash, and packages are always pickable.
      if (it.kind === "coffee" && this.focus >= s.maxFocus && this.stamina >= s.maxStamina) return true;
      took = true;
      const xp = it.kind === "pizza" ? QUEST.pizzaXp : it.kind === "package" ? 20 : 0;
      if (it.kind === "coffee") {
        this.focus = Math.min(s.maxFocus, this.focus + QUEST.coffeeFocus);
        this.stamina = s.maxStamina;
      } else if (it.kind === "cash") {
        this.addCash(it.value ?? 25);
      } else if (it.kind === "pizza") {
        this.eatPizzaEffect();
      }
      this.events.push({ type: "take", kind: it.kind, at: it.at, xp, value: it.value });
      if (xp) this.gain(xp);
      collected.push(it as PickupItem);
      return false;
    });
    for (const c of collected) this.openWorld.onPickupCollected(c, this.owBridge());
    if (took) {
      // The walker has moved on: what was left far behind is laid again near it.
      this.items = this.items.filter((it) => it.quest || it.jobId || dist(it.at, p) <= QUEST.laidRange);
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
  private beginMain(near: Pt, keep?: Place): void {
    const step = this.mainStep;
    const placed = (big = false) => keep ?? this.host.place(near, this.placesTaken(), big) ?? { name: "", at: this.ring(near, big ? 60 : 50) };
    let q: Quest | undefined;
    if (step === 0) q = this.quest("orientation", true, "collect", MAIN.orientation.need, MAIN.orientation.reward);
    else if (step === 1) {
      q = this.quest("ddl1", true, "defeat", MAIN.ddl1.need, MAIN.ddl1.reward);
      // From open ground, where the camera can frame the fight.
      const from = this.ring(near, 40);
      this.spawn("ddl", this.host.open?.(from, near) ?? from, q.id, MAIN.ddl1.tier).gentle = true;
      q.started = true;
    } else if (step === 2) q = this.quest("studyGroup", true, "defeat", MAIN.studyGroup.need, MAIN.studyGroup.reward, placed());
    else if (step === 3) q = this.quest("revision", true, "collect", MAIN.revision.need, MAIN.revision.reward, placed());
    // The DDL returns, with company, at a place of its own: a walk, then the fight.
    else if (step === 4) q = this.quest("ddl2", true, "defeat", MAIN.ddl2.need, MAIN.ddl2.reward, placed());
    else if (step === 5) {
      const place = placed(true);
      q = this.quest("finalExam", true, "boss", MAIN.finalExam.need, MAIN.finalExam.reward, place);
      this.arena = { at: place.at, radius: QUEST.arenaRadius, active: false };
    }
    // Each main quest is a checkpoint: a walker burnt out tries it again from here.
    this.check = { step, at: [near[0], near[1]], heading: this.heading, place: q?.place, boss: false };
  }

  /**
   * Burnt out, the walker tries again from the last checkpoint: the start of the quest it was on, or
   * the edge of the boss's arena with the Final Exam whole and in its first phase. What it learned
   * it keeps (knowledge and rank); the time and the defeat count on. The events of it, for the
   * scene; none when the game is not lost.
   */
  retry(): GameEvent[] {
    if (this.phase !== "over" || this.victory) return [];
    this.events = [];
    const c = this.check;
    this.phase = "play";
    const s = this.stats;
    this.focus = s.maxFocus;
    this.stamina = s.maxStamina;
    this.eurekaMeter = this.has("eureka") ? PLAYER.eurekaCharge : 0;
    this.mainStep = c.step;
    this.foes = [];
    this.tells = [];
    this.waves = [];
    this.shots = [];
    this.lock = undefined;
    this.chain = this.chainT = this.combo = this.comboT = this.strikeT = this.dodgeT = this.dodgeLeft = 0;
    this.iframes = this.hitStop = this.cardT = this.slowT = this.cineT = 0;
    this.pizzaBuff = this.heat = this.wanted = this.evadeT = this.energy = 0;
    this.busted = false;
    this.hurtAgo = 99;
    this.blow = this.throwing = this.queued = this.lunge = this.knock = undefined;
    this.plunge = false;
    this.air = this.wasAir = 0;
    this.sprintHits.clear();
    this.grace = QUEST.grace;
    const gone = new Set(this.quests.map((q) => q.id));
    this.quests = [];
    this.items = this.items.filter((i) => (!i.quest || !gone.has(i.quest)) && !i.dropped);
    if (this.vehicles.current) this.vehicles.exitCurrent(this.host);
    this.openWorld.resetActive();
    this.arena = undefined;
    this.player = [c.at[0], c.at[1]];
    this.heading = c.heading;
    this.events.push({ type: "retry", at: [c.at[0], c.at[1]], heading: c.heading, boss: c.boss });
    this.check = c;
    return this.events;
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
          q.wave = 0;
          this.nextWave(q);
        } else if (q.goal === "collect") {
          for (let i = 0; i < q.need; i++) {
            const at = this.host.spot(this.player, this.items.map((it) => it.at), q.place.at) ?? this.ring(q.place.at, 6 + i * 3);
            this.items.push({ id: this.nextId++, kind: "package", at, quest: q.id });
          }
        }
      }
      // A wave beaten, the next comes.
      if (q.goal === "defeat" && q.wave !== undefined && q.wave < (WAVES[q.key]?.length ?? 0) && !this.foes.some((f) => f.quest === q.id && f.state !== "dead")) this.nextWave(q);
      if (q.goal === "boss" && this.arena && !this.arena.active && dist(this.arena.at, this.player) <= this.arena.radius) {
        this.arena.active = true;
        q.started = true;
        // The arena's edge is the last checkpoint: a retry starts the fight again from here.
        this.check = { ...this.check, at: [this.player[0], this.player[1]], heading: bearingTo(this.player, this.arena.at), place: q.place, boss: true };
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
    this.refillSides();
  }

  /** The next wave of a place to clear, round its place. */
  private nextWave(q: Quest): void {
    const kinds = WAVES[q.key]?.[q.wave ?? 0];
    if (!kinds || !q.place) return;
    q.wave = (q.wave ?? 0) + 1;
    this.events.push({ type: "wave", place: q.place.name });
    for (const k of kinds) this.spawn(k, this.ring(q.place.at, 10 + this.host.random() * 8), q.id, WAVE_TIER[q.key]?.[k] ?? 1, false);
  }

  /** Side quests come after the first fight, two at a time. */
  private refillSides(): void {
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
    // It rises from the ground the walker can reach, not from a roof, inside a building or beside a home.
    if (!(this.host.free ? this.host.free(at) : this.onGround(at))) at = this.host.near?.(at) ?? at;
    const spec = FOES[kind];
    const hp = Math.round(spec.hp * tier);
    const f: Foe = { id: this.nextId++, kind, at, hp, maxHp: hp, facing: bearingTo(at, this.player), state: "rise", t: kind === "exam" ? 3.2 : 0.8, cool: spec.cooldown * 0.6, push: [0, 0], hurtAgo: 99, quest, tier, phase: 1, age: 0, wander };
    this.foes.push(f);
    const first = !this.met.has(kind);
    this.met.add(kind);
    this.events.push({ type: "arrive", foe: f.id, kind, first });
    return f;
  }

  /** Grounded open-world play spawns HumanNpcs via OpenWorldState rather than cartoon wanderers. */
  private spawning(_dt: number): void {
    return;
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
      // Near the walker, a foe still over a roof (or a building) comes on over it to the walker's own
      // ground, and attacks only once it is there; on the ground, it keeps to it (below).
      // The big ones (the DDL, the Final Exam: those with a body) keep to the ground wherever they are.
      const fight = d < QUEST.fightGround || !!spec.body;
      const grounded = !fight || this.onGround(f.at);
      if (!grounded) want = 1;
      const way = toward;
      const [ux, uy] = dirOf(way);
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
      // On the ground, it stays on it: round a building by the side it went last, rather than into it.
      if (fight && grounded && !this.onGround([nx, ny])) {
        const step = Math.hypot(nx - f.at[0], ny - f.at[1]);
        let found = false;
        const first: 1 | -1 = f.round ?? 1;
        for (const side of [first, first === 1 ? -1 : 1] as const) {
          for (const turn of [45, 90, 135]) {
            const [vx, vy] = dirOf(way + side * turn);
            const q: Pt = [f.at[0] + vx * step, f.at[1] + vy * step];
            if (!this.onGround(q)) continue;
            ((nx = q[0]), (ny = q[1]), (f.round = side), (found = true));
            break;
          }
          if (found) break;
        }
        if (!found) ((nx = f.at[0]), (ny = f.at[1]));
      } else if (fight && grounded) f.round = undefined;
      f.at = [nx, ny];
      if (this.arena?.active && f.kind === "exam") f.at = this.clampToArena(f.at);
      if (f.cool <= 0 && d <= spec.reach + spec.radius && this.grace <= 0 && grounded) this.windUp(f, d);
    }
  }

  /** Whether the walker could stand at `p` (QuestHost.ground). */
  private onGround(p: Pt): boolean {
    return this.host.ground ? this.host.ground(p) : true;
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
    let tell = spec.tell * (f.gentle ? MAIN.ddl1.tell : 1);
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
        // The first fight's foe yawns slowly: time to see the warning, and the prompt, and to dodge.
        if (f.tutor) tell *= TEACH.practiceTell;
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
      case "freeRider":
        f.move = { type: "melee" };
        break;
      case "debateRival":
        if (d < 4.5) {
          f.move = { type: "yawn", at: f.at, radius: 4.0 };
          this.addTell(f, { shape: "circle", at: f.at, dir: 0, length: 0, width: 0, radius: 4.0 }, tell);
        } else {
          f.move = { type: "orb", count: 1, spread: 0 };
        }
        break;
      case "allNighter":
        if (d >= 4.5) {
          const length = Math.min(12, d + 4);
          f.move = { type: "charge", dir: toward, left: length, hit: false };
          this.addTell(f, { shape: "line", at: f.at, dir: toward, length, width: 2.0, radius: 0 }, tell);
        } else {
          f.move = { type: "orb", count: 3, spread: 36 };
        }
        break;
      case "exam":
        tell = this.bossMove(f, d);
        break;
    }
    f.state = "tell";
    f.t = tell;
    f.cool = spec.cooldown * (f.kind === "exam" ? 1.25 - f.phase * 0.15 : 1);
    if (f.move) this.events.push({ type: "tell", foe: f.id, kind: f.kind, move: f.move.type, time: tell });
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
    const dmg = spec.damage * (f.kind === "ddl" || isNpcFoe(f.kind) ? 1 + (f.tier - 1) * 0.5 : 1) * (f.kind === "exam" ? 1 + (f.phase - 1) * 0.15 : 1) * (f.gentle ? MAIN.ddl1.harm : 1);
    this.dropTells(f.id);
    f.state = "recover";
    f.t = f.kind === "exam" ? 0.7 : 0.5;
    if (!m) return;
    const lands = m.type === "slam" || m.type === "yawn" ? m.at : f.at;
    const radius = m.type === "slam" || m.type === "yawn" ? m.radius : 0;
    this.events.push({ type: "lash", foe: f.id, kind: f.kind, move: m.type, at: [lands[0], lands[1]], radius });
    switch (m.type) {
      case "melee":
        if (dist(f.at, p) <= spec.reach + spec.radius + 0.4) this.hurt(dmg, f.at);
        break;
      case "blink":
        if (dist(f.at, p) <= spec.reach + 0.8) this.hurt(dmg, f.at);
        break;
      case "slam":
        // A shockwave over the ground: a walker in the air at that moment is clear of it.
        if (dist(m.at, p) <= m.radius) {
          if (this.air >= PLAYER.jumpClear) this.events.push({ type: "evade", at: this.player });
          else this.hurt(dmg, m.at);
        }
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
    const speed = chargeSpeed(f.kind, pace);
    const go = Math.min(m.left, speed * dt);
    const [ux, uy] = dirOf(m.dir);
    const next: Pt = [f.at[0] + ux * go, f.at[1] + uy * go];
    // A charge on the ground ends at a wall, rather than running on through the building.
    if (this.onGround(f.at) && !this.onGround(next)) m.left = 0;
    else f.at = next;
    m.left -= Math.min(m.left, go);
    // The Final Exam's charge stops at its arena's edge: put back there afterwards, it would jump.
    if (this.arena?.active && f.kind === "exam") {
      const kept = this.clampToArena(f.at);
      if (kept[0] !== f.at[0] || kept[1] !== f.at[1]) ((f.at = kept), (m.left = 0));
    }
    f.facing = m.dir;
    if (!m.hit && dist(f.at, this.player) <= FOES[f.kind].radius + 0.9) {
      m.hit = true;
      this.hurt(FOES[f.kind].damage * (f.kind === "ddl" || isNpcFoe(f.kind) ? 1 + (f.tier - 1) * 0.5 : 1.25) * (f.gentle ? MAIN.ddl1.harm : 1), f.at);
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
          this.damage(f, s.damage, bearingTo(p, f.at), 1, false, true, "card");
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
        // A ring over the ground passes under a walker in the air.
        if (this.air >= PLAYER.jumpClear) this.events.push({ type: "evade", at: this.player });
        else this.hurt(20, w.at);
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

/**
 * The middle of the reachable cell nearest `p` (open ground off a path counts, as for pick-ups),
 * within `rings` cells; undefined when there is none.
 */
export function nearestReached(g: WalkGrid, reached: Uint8Array, p: Pt, rings = 12): Pt | undefined {
  const [c0, r0] = cellOf(g, p);
  let best: Pt | undefined;
  let bestD = Infinity;
  for (let ring = 0; ring <= rings; ring++) {
    for (let dr = -ring; dr <= ring; dr++) {
      for (let dc = -ring; dc <= ring; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== ring) continue;
        const c = c0 + dc;
        const r = r0 + dr;
        if (c < 0 || r < 0 || c >= g.cols || r >= g.rows || !reached[r * g.cols + c]) continue;
        const at = centreOf(g, c, r);
        const d = Math.hypot(at[0] - p[0], at[1] - p[1]);
        if (d < bestD) (bestD = d), (best = at);
      }
    }
    if (best) return best;
  }
  return undefined;
}

// Homes: buildings where people live or children are cared for. The map leaves their floors blank
// (AGENTS.md, "Places, not people"), and the game lays nothing on them or beside them: no book, no
// quest's place, no arena and no foe.

/** Metres round a home within which the game lays nothing. */
export const HOME_MARGIN = 25;

/**
 * Whether people live in a building or children are cared for in it: a floor of it that the map
 * leaves blank for that reason (Floor.noPlan "residential" or "childcare").
 */
export function isHome(b: { floors: readonly { noPlan?: string }[] }): boolean {
  return b.floors.some((f) => f.noPlan === "residential" || f.noPlan === "childcare");
}

/** Metres from `p` to the nearest edge of `ring`. */
function toEdge(p: Pt, ring: readonly Pt[]): number {
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j]!;
    const b = ring[i]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = dx * dx + dy * dy;
    const t = len > 0 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len)) : 0;
    best = Math.min(best, Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy));
  }
  return best;
}

/**
 * A copy of `mask` without the cells on a home or within `margin` metres of it. `homes` are the
 * homes' outer rings, in metres. The game lays things only on the cells that are left.
 */
export function awayFromHomes(g: WalkGrid, mask: Uint8Array, homes: readonly Pt[][], margin: number = HOME_MARGIN): Uint8Array {
  const out = mask.slice();
  for (const ring of homes) {
    if (ring.length < 3) continue;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const [x, y] of ring) (x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x)), (y1 = Math.max(y1, y));
    const [c0, r0] = cellOf(g, [x0 - margin, y0 - margin]);
    const [c1, r1] = cellOf(g, [x1 + margin, y1 + margin]);
    for (let r = Math.max(0, r0); r <= Math.min(g.rows - 1, r1); r++) {
      for (let c = Math.max(0, c0); c <= Math.min(g.cols - 1, c1); c++) {
        const i = r * g.cols + c;
        if (!out[i]) continue;
        const p = centreOf(g, c, r);
        if (pointInRing(p, ring) || toEdge(p, ring) <= margin) out[i] = 0;
      }
    }
  }
  return out;
}

/** A place pick-ups gather round: a building's middle, and how many it draws against the others. */
export interface BookDraw {
  center: Pt;
  weight: number;
}

/**
 * The buildings that draw the pick-ups and the quests round `near`: those with rooms to teach in,
 * more the more rooms they have, less the farther they are (`half` metres off draws half as much);
 * where none has rooms, every building alike. A home draws nothing.
 */
export function questDraws<B extends { center: Pt; roomCount: number; floors: readonly { noPlan?: string }[] }>(
  buildings: readonly B[],
  near: Pt,
  half: number,
): (BookDraw & { b: B })[] {
  const all = buildings.filter((b) => !isHome(b));
  const teaching = all.filter((b) => b.roomCount > 0);
  return (teaching.length ? teaching : all).map((b) => {
    const far = Math.hypot(b.center[0] - near[0], b.center[1] - near[1]) / half;
    return { b, center: b.center, weight: (1 + Math.sqrt(b.roomCount)) / (1 + far * far) };
  });
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
  drawReach: number = DRAW_REACH,
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
          reach = drawReach;
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
 * nearer the middle counts more), so that nothing stands between the camera and a tall foe; and
 * off the roads, which are open but no place for a fight: a cell of a road (OpenStreetMap's service
 * ways, streets and bigger, as the walking grid paints them) counts against it, most in the middle,
 * so that grass, a plaza or a footpath wins. A little nearer `centre` wins a tie. At least `gap`
 * metres from `near`. Undefined when no try lands on reachable ground.
 */
/**
 * What the walking grid paints a road with (walkmap.ts): service ways, streets, main roads,
 * motorways; as its cells hold them, in single precision.
 */
const ROAD_COSTS: ReadonlySet<number> = new Set([WALK_COST.service, WALK_COST.street, WALK_COST.major, WALK_COST.motorway].map(Math.fround));

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
        const cost = out ? Infinity : g.cost[rr * g.cols + cc]!;
        if (cost === Infinity) score += 1 + 2 * (1 - d / radius);
        else if (ROAD_COSTS.has(cost)) score += 0.35 + 1.2 * (1 - d / radius);
      }
    }
    score += Math.hypot(at[0] - centre[0], at[1] - centre[1]) / Math.max(1, reach);
    if (score < bestScore) (bestScore = score), (best = at);
  }
  return best;
}
