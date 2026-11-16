// What a walker's arms and upper body do for each action of the walk's game (Study Quest): a few
// key poses a move goes through, timed to the game's rules, that figure.ts lays over the walk, the
// run and the stance. Pure numbers, so that they can be tested without a browser.
//
// Directions are in the figure's own frame: x to its right, y up, z behind it (ahead is -z). For
// each arm, the way from the shoulder to the elbow (`up`) and from the elbow to the hand (`fo`).
// `twist` turns the chest, radians, its right shoulder forward when positive; `lean` bows it
// forward, radians; `crouch` lowers the hips, metres, the knees bending to keep the feet down;
// `step` brings the body forward over its feet, metres. The whole body turns about its middle:
// `roll` heels over head forward, radians (a forward roll is a whole turn); `bank` over to its right;
// `hop` lifts it off the ground, metres; `splay` sets its feet apart, radians each leg; `tuck` draws
// the feet up under it, metres, the knees bent and the hips where they are (in a jump).
import { PLAYER } from "../shared/gamePlayer.ts";
import { strafeWeights } from "../shared/locomotion.ts";

export type Move =
  | "strike0"
  | "strike1"
  | "strike2"
  | "card"
  | "dodge"
  | "dodgeF"
  | "dodgeB"
  | "dodgeL"
  | "dodgeR"
  | "sprint"
  | "eureka"
  | "flinch"
  | "flinchF"
  | "flinchB"
  | "flinchL"
  | "flinchR"
  | "plungeUp"
  | "plunge"
  | "down";

type V = readonly [number, number, number];

export interface MovePose {
  rUp: [number, number, number];
  rFo: [number, number, number];
  lUp: [number, number, number];
  lFo: [number, number, number];
  twist: number;
  lean: number;
  crouch: number;
  step: number;
  roll: number;
  bank: number;
  hop: number;
  splay: number;
  tuck: number;
}

interface KeyPose {
  rUp: V;
  rFo: V;
  lUp: V;
  lFo: V;
  twist?: number;
  lean?: number;
  crouch?: number;
  step?: number;
  roll?: number;
  bank?: number;
  hop?: number;
  splay?: number;
  tuck?: number;
}

/** How a move comes into a key: speeding up into it (a blow), slowing into it, or both. */
type Ease = "in" | "out" | "io";

interface Key {
  t: number;
  ease: Ease;
  p: KeyPose;
}

export interface MoveSpec {
  /** The key poses, the first reached as the move comes in over the layer below. */
  keys: Key[];
  /** Seconds over which it lets go of the walk and the run again; none for a move held until another. */
  out?: [from: number, to: number];
  /** Seconds in which the highlighter leaves a trail. */
  trail?: [from: number, to: number];
}

/** The left arm as the right one's mirror. */
const L = (v: V): V => [-v[0], v[1], v[2]];

const [C0, C1, C2] = PLAYER.strikeContact;
const RELEASE = PLAYER.cardRelease;
const PLUNGE_C = PLAYER.plungeContact;

const OWN: Record<Exclude<Move, "dodgeL" | "flinchR" | "flinch">, MoveSpec> = {
  // A forehand: the highlighter drawn back high on the right, then across the front to the left.
  strike0: {
    keys: [
      { t: C0 * 0.62, ease: "out", p: { rUp: [0.75, 0.0, 0.6], rFo: [0.25, 0.3, 0.92], lUp: [-0.3, -0.7, -0.5], lFo: [-0.1, -0.2, -1], twist: -0.6, lean: 0.04, crouch: 0.006 } },
      { t: C0, ease: "in", p: { rUp: [0.45, 0.05, -0.9], rFo: [-0.05, 0.1, -1], lUp: [-0.3, -0.8, -0.2], lFo: [-0.1, -0.7, 0.4], twist: 0.15, lean: 0.12, crouch: 0.008, step: 0.1 } },
      { t: C0 + 0.08, ease: "out", p: { rUp: [-0.5, -0.2, -0.75], rFo: [-0.9, -0.25, -0.2], lUp: [-0.25, -0.85, 0.35], lFo: [-0.1, -0.8, 0.5], twist: 0.7, lean: 0.15, crouch: 0.008, step: 0.12 } },
      { t: PLAYER.strikeTime[0], ease: "io", p: { rUp: [-0.45, -0.3, -0.75], rFo: [-0.85, -0.35, -0.25], lUp: [-0.25, -0.85, 0.3], lFo: [-0.1, -0.8, 0.45], twist: 0.6, lean: 0.12, crouch: 0.008, step: 0.1 } },
    ],
    out: [PLAYER.strikeTime[0], PLAYER.strikeTime[0] + 0.26],
    trail: [C0 - 0.035, C0 + 0.07],
  },
  // A backhand: from over the left shoulder, back across to the right.
  strike1: {
    keys: [
      { t: C1 * 0.62, ease: "out", p: { rUp: [-0.55, 0.05, -0.55], rFo: [-0.75, 0.45, 0.3], lUp: [-0.25, -0.85, 0.3], lFo: [-0.05, -0.8, 0.5], twist: 0.65, lean: 0.1, crouch: 0.006 } },
      { t: C1, ease: "in", p: { rUp: [0.35, 0.05, -0.95], rFo: [0.35, 0.05, -0.95], lUp: [-0.3, -0.8, -0.2], lFo: [-0.05, -0.6, 0.6], twist: 0, lean: 0.12, crouch: 0.008, step: 0.1 } },
      { t: C1 + 0.08, ease: "out", p: { rUp: [0.85, -0.05, -0.2], rFo: [0.85, -0.1, 0.45], lUp: [-0.35, -0.7, -0.5], lFo: [0.1, -0.3, -0.95], twist: -0.65, lean: 0.12, crouch: 0.008, step: 0.12 } },
      { t: PLAYER.strikeTime[1], ease: "io", p: { rUp: [0.8, -0.2, -0.2], rFo: [0.8, -0.25, 0.4], lUp: [-0.35, -0.75, -0.45], lFo: [0.05, -0.4, -0.9], twist: -0.55, lean: 0.1, crouch: 0.008, step: 0.1 } },
    ],
    out: [PLAYER.strikeTime[1], PLAYER.strikeTime[1] + 0.26],
    trail: [C1 - 0.035, C1 + 0.07],
  },
  // The overhead slam: both hands up behind and above the head, wide of it, the back arched; over
  // the top; then down in front. The hands never pass through the head: in the wind-up each is a
  // shoulder's width out and behind it, and over the top they are above it.
  strike2: {
    keys: [
      { t: C2 * 0.6, ease: "out", p: { rUp: [0.42, 0.88, 0.22], rFo: [0.12, 0.62, 0.78], lUp: L([0.42, 0.88, 0.22]), lFo: L([0.12, 0.62, 0.78]), lean: -0.22, step: -0.05 } },
      { t: C2 * 0.86, ease: "in", p: { rUp: [0.3, 0.95, -0.08], rFo: [0.08, 0.85, -0.52], lUp: L([0.3, 0.95, -0.08]), lFo: L([0.08, 0.85, -0.52]), lean: -0.04, step: 0.06 } },
      { t: C2, ease: "in", p: { rUp: [0.18, -0.25, -0.95], rFo: [-0.08, -0.55, -0.85], lUp: L([0.18, -0.25, -0.95]), lFo: L([-0.08, -0.55, -0.85]), lean: 0.4, crouch: 0.05, step: 0.22 } },
      { t: C2 + 0.1, ease: "out", p: { rUp: [0.18, -0.6, -0.75], rFo: [-0.05, -0.85, -0.5], lUp: L([0.18, -0.6, -0.75]), lFo: L([-0.05, -0.85, -0.5]), lean: 0.45, crouch: 0.07, step: 0.25 } },
      { t: PLAYER.strikeTime[2], ease: "io", p: { rUp: [0.18, -0.65, -0.7], rFo: [-0.05, -0.85, -0.45], lUp: L([0.18, -0.65, -0.7]), lFo: L([-0.05, -0.85, -0.45]), lean: 0.38, crouch: 0.06, step: 0.22 } },
    ],
    out: [PLAYER.strikeTime[2], PLAYER.strikeTime[2] + 0.3],
    trail: [C2 - 0.04, C2 + 0.08],
  },
  // The flashcard: the right arm drawn back by the ear, the left pointing, then a snap forward.
  card: {
    keys: [
      { t: RELEASE * 0.7, ease: "out", p: { rUp: [0.6, 0.1, 0.8], rFo: [0.05, 0.9, -0.4], lUp: [-0.2, -0.15, -1], lFo: [-0.05, 0.05, -1], twist: -0.55, lean: -0.05 } },
      { t: RELEASE, ease: "in", p: { rUp: [0.3, 0.15, -0.95], rFo: [0.15, 0.1, -1], lUp: [-0.3, -0.75, -0.3], lFo: [-0.1, -0.5, 0.4], twist: 0.25, lean: 0.1, step: 0.08 } },
      { t: RELEASE + 0.1, ease: "out", p: { rUp: [-0.1, -0.45, -0.85], rFo: [-0.35, -0.7, -0.6], lUp: [-0.3, -0.8, 0.2], lFo: [-0.1, -0.7, 0.5], twist: 0.35, lean: 0.18, step: 0.08 } },
    ],
    out: [RELEASE + 0.12, RELEASE + 0.38],
  },
  // The sidestep: arms tucked in front of the chest, a little crouch.
  dodge: {
    keys: [{ t: 0.05, ease: "out", p: { rUp: [0.35, -0.8, -0.3], rFo: [-0.45, 0.55, -0.7], lUp: L([0.35, -0.8, -0.3]), lFo: L([-0.45, 0.55, -0.7]), lean: 0.3, crouch: 0.07 } }],
    out: [PLAYER.dodgeTime - 0.02, PLAYER.dodgeTime + 0.16],
  },
  // The dodge as it reads from the way it goes, against the way the walker faces (locomotion.ts
  // dodgeWay), each over the dodge's time and let go after it, as the sidestep.
  // Forward: a roll, tucked, heels over head and up again on the feet, the whole turn in the dodge.
  dodgeF: {
    keys: [
      { t: 0.04, ease: "out", p: { rUp: [0.3, -0.75, -0.6], rFo: [-0.4, 0.3, -0.85], lUp: L([0.3, -0.75, -0.6]), lFo: L([-0.4, 0.3, -0.85]), lean: 0.55, crouch: 0.2 } },
      { t: 0.15, ease: "in", p: { rUp: [0.25, -0.3, -0.92], rFo: [-0.5, 0.6, -0.6], lUp: L([0.25, -0.3, -0.92]), lFo: L([-0.5, 0.6, -0.6]), lean: 0.7, crouch: 0.32, roll: Math.PI } },
      { t: 0.25, ease: "out", p: { rUp: [0.3, -0.8, -0.5], rFo: [-0.3, 0.4, -0.85], lUp: L([0.3, -0.8, -0.5]), lFo: L([-0.3, 0.4, -0.85]), lean: 0.45, crouch: 0.22, roll: Math.PI * 2 } },
      { t: PLAYER.dodgeTime, ease: "io", p: { rUp: [0.3, -0.85, -0.35], rFo: [-0.2, 0.2, -0.95], lUp: L([0.3, -0.85, -0.35]), lFo: L([-0.2, 0.2, -0.95]), lean: 0.25, crouch: 0.1, roll: Math.PI * 2 } },
    ],
    out: [PLAYER.dodgeTime, PLAYER.dodgeTime + 0.18],
  },
  // Back: a hop back off both feet, leaning back, the arms forward for balance; it lands bent.
  dodgeB: {
    keys: [
      { t: 0.05, ease: "out", p: { rUp: [0.3, -0.6, -0.75], rFo: [0.1, 0.1, -1], lUp: L([0.3, -0.6, -0.75]), lFo: L([0.1, 0.1, -1]), lean: 0.2, crouch: 0.12 } },
      { t: 0.14, ease: "out", p: { rUp: [0.35, -0.3, -0.9], rFo: [0.15, 0.25, -0.95], lUp: L([0.35, -0.3, -0.9]), lFo: L([0.15, 0.25, -0.95]), lean: -0.28, crouch: 0.1, hop: 0.24, step: -0.08 } },
      { t: 0.25, ease: "in", p: { rUp: [0.35, -0.55, -0.75], rFo: [0.1, 0.05, -1], lUp: L([0.35, -0.55, -0.75]), lFo: L([0.1, 0.05, -1]), lean: 0.12, crouch: 0.16, hop: 0 } },
      { t: PLAYER.dodgeTime, ease: "io", p: { rUp: [0.3, -0.7, -0.6], rFo: [0, -0.1, -1], lUp: L([0.3, -0.7, -0.6]), lFo: L([0, -0.1, -1]), lean: 0.1, crouch: 0.1 } },
    ],
    out: [PLAYER.dodgeTime, PLAYER.dodgeTime + 0.16],
  },
  // To the right: a low side-step, the feet wide, the body over to the right and the arms out for balance.
  dodgeR: {
    keys: [
      { t: 0.05, ease: "out", p: { rUp: [0.75, -0.6, -0.2], rFo: [0.8, -0.3, -0.5], lUp: [-0.5, -0.7, -0.4], lFo: [-0.2, 0.3, -0.9], twist: -0.25, lean: 0.2, crouch: 0.14, bank: 0.32, splay: 0.32 } },
      { t: 0.15, ease: "out", p: { rUp: [0.8, -0.5, -0.2], rFo: [0.9, -0.2, -0.35], lUp: [-0.55, -0.65, -0.4], lFo: [-0.25, 0.35, -0.9], twist: -0.3, lean: 0.25, crouch: 0.16, bank: 0.4, splay: 0.38, hop: 0.07 } },
      { t: PLAYER.dodgeTime, ease: "io", p: { rUp: [0.5, -0.8, -0.3], rFo: [0.3, -0.4, -0.85], lUp: [-0.35, -0.8, -0.4], lFo: [-0.1, 0.1, -1], twist: -0.12, lean: 0.12, crouch: 0.1, bank: 0.12, splay: 0.2 } },
    ],
    out: [PLAYER.dodgeTime, PLAYER.dodgeTime + 0.18],
  },
  // The Cram Sprint: leaning into it, the arms swept back.
  sprint: {
    keys: [{ t: 0.08, ease: "out", p: { rUp: [0.25, -0.7, 0.65], rFo: [0.15, -0.35, 0.92], lUp: L([0.25, -0.7, 0.65]), lFo: L([0.15, -0.35, 0.92]), lean: 0.5, crouch: 0.03 } }],
    out: [PLAYER.dodgeTime * 1.3 - 0.02, PLAYER.dodgeTime * 1.3 + 0.18],
  },
  // Eureka!: gathered low for a moment, then both arms thrust up.
  eureka: {
    keys: [
      { t: 0.07, ease: "out", p: { rUp: [0.3, -0.85, -0.3], rFo: [-0.3, -0.2, -0.9], lUp: L([0.3, -0.85, -0.3]), lFo: L([-0.3, -0.2, -0.9]), lean: 0.15, crouch: 0.07 } },
      { t: 0.15, ease: "in", p: { rUp: [0.3, 0.95, -0.05], rFo: [0.2, 1, -0.05], lUp: L([0.3, 0.95, -0.05]), lFo: L([0.2, 1, -0.05]), lean: -0.18 } },
      { t: 0.55, ease: "io", p: { rUp: [0.35, 0.93, 0], rFo: [0.25, 0.97, 0], lUp: L([0.35, 0.93, 0]), lFo: L([0.25, 0.97, 0]), lean: -0.12 } },
    ],
    out: [0.55, 0.85],
  },
  // A blow taken: from in front, thrown back, the arms up in front of it; knocked back a step
  // (the stagger, PLAYER.staggerTime) and coming up again. The four have the same times, so that
  // a blow from between two is their blend (sampleFlinch).
  flinchF: {
    keys: [
      { t: 0.06, ease: "out", p: { rUp: [0.45, -0.55, -0.5], rFo: [-0.2, 0.5, -0.85], lUp: L([0.45, -0.55, -0.5]), lFo: L([-0.2, 0.5, -0.85]), lean: -0.38, twist: 0.15, crouch: 0.04, step: -0.08 } },
      { t: PLAYER.staggerTime, ease: "io", p: { rUp: [0.4, -0.7, -0.35], rFo: [-0.1, 0.2, -0.95], lUp: L([0.4, -0.7, -0.35]), lFo: L([-0.1, 0.2, -0.95]), lean: 0.12, twist: 0.06, crouch: 0.1, step: 0.02 } },
      { t: 0.42, ease: "io", p: { rUp: [0.35, -0.8, -0.3], rFo: [0, -0.1, -1], lUp: L([0.35, -0.8, -0.3]), lFo: L([0, -0.1, -1]), lean: 0.05, crouch: 0.04 } },
    ],
    out: [0.42, 0.6],
  },
  // From behind: pitched forward, the arms flung back.
  flinchB: {
    keys: [
      { t: 0.06, ease: "out", p: { rUp: [0.4, -0.6, 0.65], rFo: [0.2, -0.4, 0.9], lUp: L([0.4, -0.6, 0.65]), lFo: L([0.2, -0.4, 0.9]), lean: 0.5, crouch: 0.06, step: 0.1 } },
      { t: PLAYER.staggerTime, ease: "io", p: { rUp: [0.4, -0.75, -0.3], rFo: [0.1, -0.2, -0.95], lUp: L([0.4, -0.75, -0.3]), lFo: L([0.1, -0.2, -0.95]), lean: 0.3, crouch: 0.12, step: 0.06 } },
      { t: 0.42, ease: "io", p: { rUp: [0.35, -0.8, -0.3], rFo: [0, -0.1, -1], lUp: L([0.35, -0.8, -0.3]), lFo: L([0, -0.1, -1]), lean: 0.08, crouch: 0.04 } },
    ],
    out: [0.42, 0.6],
  },
  // From its left: bent over to the right, turned away, the left arm up to shield.
  flinchL: {
    keys: [
      { t: 0.06, ease: "out", p: { rUp: [0.75, -0.6, 0.1], rFo: [0.6, -0.6, 0.3], lUp: [-0.5, 0.1, -0.85], lFo: [0.5, 0.75, -0.4], twist: -0.4, lean: 0.05, crouch: 0.05, bank: 0.32 } },
      { t: PLAYER.staggerTime, ease: "io", p: { rUp: [0.5, -0.8, -0.2], rFo: [0.3, -0.5, -0.8], lUp: [-0.4, -0.5, -0.75], lFo: [0.2, 0.4, -0.9], twist: -0.15, lean: 0.12, crouch: 0.1, bank: 0.12, splay: 0.15 } },
      { t: 0.42, ease: "io", p: { rUp: [0.35, -0.8, -0.3], rFo: [0, -0.1, -1], lUp: L([0.35, -0.8, -0.3]), lFo: L([0, -0.1, -1]), lean: 0.05, crouch: 0.04 } },
    ],
    out: [0.42, 0.6],
  },
  // A strike pressed in the air: both hands raise the highlighter over the head, held until the
  // walker lands (let go after a while, should it not).
  plungeUp: {
    keys: [{ t: 0.08, ease: "out", p: { rUp: [0.3, 0.95, -0.08], rFo: [0.08, 0.85, -0.52], lUp: L([0.3, 0.95, -0.08]), lFo: L([0.08, 0.85, -0.52]), lean: -0.12 } }],
    out: [1.2, 1.4],
  },
  // And as it lands, brought down hard in front: the landing slash (PLAYER.plunge*), landing as the
  // blow lands, low in the crouch the landing takes anyway.
  plunge: {
    keys: [
      { t: PLUNGE_C * 0.5, ease: "in", p: { rUp: [0.3, 0.95, -0.08], rFo: [0.08, 0.85, -0.52], lUp: L([0.3, 0.95, -0.08]), lFo: L([0.08, 0.85, -0.52]), lean: -0.05, crouch: 0.04 } },
      { t: PLUNGE_C, ease: "in", p: { rUp: [0.18, -0.25, -0.95], rFo: [-0.08, -0.55, -0.85], lUp: L([0.18, -0.25, -0.95]), lFo: L([-0.08, -0.55, -0.85]), lean: 0.45, crouch: 0.12, step: 0.12 } },
      { t: PLUNGE_C + 0.1, ease: "out", p: { rUp: [0.18, -0.65, -0.72], rFo: [-0.05, -0.88, -0.45], lUp: L([0.18, -0.65, -0.72]), lFo: L([-0.05, -0.88, -0.45]), lean: 0.5, crouch: 0.16, step: 0.14 } },
      { t: PLAYER.plungeTime, ease: "io", p: { rUp: [0.18, -0.7, -0.68], rFo: [-0.05, -0.88, -0.45], lUp: L([0.18, -0.7, -0.68]), lFo: L([-0.05, -0.88, -0.45]), lean: 0.38, crouch: 0.1, step: 0.1 } },
    ],
    out: [PLAYER.plungeTime, PLAYER.plungeTime + 0.28],
    trail: [PLUNGE_C - 0.04, PLUNGE_C + 0.08],
  },
  // Burnt out: the arms hang and the back bows. Held until the game ends.
  down: {
    keys: [{ t: 0.35, ease: "out", p: { rUp: [0.15, -0.98, -0.15], rFo: [0.05, -0.95, -0.3], lUp: L([0.15, -0.98, -0.15]), lFo: L([0.05, -0.95, -0.3]), lean: 0.45, crouch: 0.1 } }],
  },
};

/** A move's mirror image, its left and right swapped: the side-step and the flinch the other way. */
function mirror(spec: MoveSpec): MoveSpec {
  const m = (v: V): V => [-v[0], v[1], v[2]];
  return {
    ...spec,
    keys: spec.keys.map((k) => ({
      ...k,
      p: { ...k.p, rUp: m(k.p.lUp), rFo: m(k.p.lFo), lUp: m(k.p.rUp), lFo: m(k.p.rFo), twist: -(k.p.twist ?? 0), bank: -(k.p.bank ?? 0) },
    })),
  };
}
export const MOVES: Record<Move, MoveSpec> = { ...OWN, dodgeL: mirror(OWN.dodgeR), flinchR: mirror(OWN.flinchL), flinch: OWN.flinchF };

function eased(k: number, ease: Ease): number {
  if (ease === "in") return k * k;
  if (ease === "out") return 1 - (1 - k) * (1 - k);
  return k * k * (3 - 2 * k);
}

function mix(out: [number, number, number], a: V, b: V, k: number): void {
  const x = a[0] + (b[0] - a[0]) * k;
  const y = a[1] + (b[1] - a[1]) * k;
  const z = a[2] + (b[2] - a[2]) * k;
  const n = Math.hypot(x, y, z) || 1;
  out[0] = x / n;
  out[1] = y / n;
  out[2] = z / n;
}

/**
 * The pose of a move `t` seconds after it began, written into `out`, and how much of it is laid
 * over the walk: 0 to 1. A move comes in over its first key's time and goes over its `out`.
 */
export function sampleMove(move: Move, t: number, out: MovePose): number {
  const spec = MOVES[move];
  const keys = spec.keys;
  let a = keys[0]!;
  let b = a;
  let k = 0;
  if (t > a.t) {
    let i = 0;
    while (i < keys.length - 1 && keys[i + 1]!.t < t) i++;
    a = keys[i]!;
    b = keys[Math.min(i + 1, keys.length - 1)]!;
    k = b === a ? 0 : eased(Math.min(1, (t - a.t) / (b.t - a.t)), b.ease);
  }
  const p = a.p;
  const q = b.p;
  mix(out.rUp, p.rUp, q.rUp, k);
  mix(out.rFo, p.rFo, q.rFo, k);
  mix(out.lUp, p.lUp, q.lUp, k);
  mix(out.lFo, p.lFo, q.lFo, k);
  out.twist = (p.twist ?? 0) + ((q.twist ?? 0) - (p.twist ?? 0)) * k;
  out.lean = (p.lean ?? 0) + ((q.lean ?? 0) - (p.lean ?? 0)) * k;
  out.crouch = (p.crouch ?? 0) + ((q.crouch ?? 0) - (p.crouch ?? 0)) * k;
  out.step = (p.step ?? 0) + ((q.step ?? 0) - (p.step ?? 0)) * k;
  out.roll = (p.roll ?? 0) + ((q.roll ?? 0) - (p.roll ?? 0)) * k;
  out.bank = (p.bank ?? 0) + ((q.bank ?? 0) - (p.bank ?? 0)) * k;
  out.hop = (p.hop ?? 0) + ((q.hop ?? 0) - (p.hop ?? 0)) * k;
  out.splay = (p.splay ?? 0) + ((q.splay ?? 0) - (p.splay ?? 0)) * k;
  out.tuck = (p.tuck ?? 0) + ((q.tuck ?? 0) - (p.tuck ?? 0)) * k;
  // In over the first key, out over `out`.
  const first = keys[0]!.t;
  let w = t >= first ? 1 : eased(Math.max(0, t / first), "out");
  if (spec.out) {
    const [o0, o1] = spec.out;
    if (t >= o1) w = 0;
    else if (t > o0) w *= 1 - eased((t - o0) / (o1 - o0), "io");
  }
  return w;
}

/** Seconds a move lasts: until it has let go, or for ever when it is held. */
export function moveLength(move: Move): number {
  return MOVES[move].out?.[1] ?? Infinity;
}

/** A pose to write into. */
export function newPose(): MovePose {
  return { rUp: [0, -1, 0], rFo: [0, -1, 0], lUp: [0, -1, 0], lFo: [0, -1, 0], twist: 0, lean: 0, crouch: 0, step: 0, roll: 0, bank: 0, hop: 0, splay: 0, tuck: 0 };
}

/** `out` set to `a` turned `k` of the way to `b`. */
export function mixPose(out: MovePose, a: MovePose, b: MovePose, k: number): void {
  mix(out.rUp, a.rUp, b.rUp, k);
  mix(out.rFo, a.rFo, b.rFo, k);
  mix(out.lUp, a.lUp, b.lUp, k);
  mix(out.lFo, a.lFo, b.lFo, k);
  out.twist = a.twist + (b.twist - a.twist) * k;
  out.lean = a.lean + (b.lean - a.lean) * k;
  out.crouch = a.crouch + (b.crouch - a.crouch) * k;
  out.step = a.step + (b.step - a.step) * k;
  out.roll = a.roll + (b.roll - a.roll) * k;
  out.bank = a.bank + (b.bank - a.bank) * k;
  out.hop = a.hop + (b.hop - a.hop) * k;
  out.splay = a.splay + (b.splay - a.splay) * k;
  out.tuck = a.tuck + (b.tuck - a.tuck) * k;
}

/** A pose from its parts, the rest at rest. */
function pose(p: KeyPose): MovePose {
  return { rUp: [...p.rUp], rFo: [...p.rFo], lUp: [...p.lUp], lFo: [...p.lFo], twist: p.twist ?? 0, lean: p.lean ?? 0, crouch: p.crouch ?? 0, step: p.step ?? 0, roll: p.roll ?? 0, bank: p.bank ?? 0, hop: p.hop ?? 0, splay: p.splay ?? 0, tuck: p.tuck ?? 0 };
}

/**
 * The jump's poses, laid over the walk and the run (figure.ts): the crouch before it leaves the
 * ground, the push off with the arms swung up, tucked at the top with the arms out for balance, the
 * legs reaching down as it falls, and the landing taken in the knees; harder after a long fall.
 */
export const JUMP_POSES = {
  windup: pose({ rUp: [0.25, -0.75, 0.6], rFo: [0.1, -0.6, 0.8], lUp: L([0.25, -0.75, 0.6]), lFo: L([0.1, -0.6, 0.8]), lean: 0.25, crouch: 0.12 }),
  rise: pose({ rUp: [0.3, 0.25, -0.92], rFo: [0.15, 0.65, -0.75], lUp: L([0.3, 0.25, -0.92]), lFo: L([0.15, 0.65, -0.75]), lean: 0.06, tuck: 0.04 }),
  apex: pose({ rUp: [0.9, -0.1, -0.35], rFo: [0.85, 0.25, -0.45], lUp: L([0.9, -0.1, -0.35]), lFo: L([0.85, 0.25, -0.45]), lean: 0.12, tuck: 0.3 }),
  fall: pose({ rUp: [0.85, 0.25, -0.3], rFo: [0.7, 0.6, -0.35], lUp: L([0.85, 0.25, -0.3]), lFo: L([0.7, 0.6, -0.35]), lean: 0.04, tuck: 0.07 }),
  land: pose({ rUp: [0.35, -0.7, -0.6], rFo: [0.1, -0.4, -0.9], lUp: L([0.35, -0.7, -0.6]), lFo: L([0.1, -0.4, -0.9]), lean: 0.3, crouch: 0.15 }),
  // Locked on: a side leap, the legs crossed over and the body leaning the way it goes (to its right
  // here; the figure mirrors it for the left), and a small hop back, leaning back a little.
  side: pose({ rUp: [0.85, -0.2, -0.35], rFo: [0.8, 0.2, -0.45], lUp: [-0.6, -0.5, -0.5], lFo: [-0.2, 0.3, -0.9], lean: 0.08, twist: -0.15, bank: 0.18, splay: 0.12, tuck: 0.14 }),
  back: pose({ rUp: [0.3, -0.5, -0.8], rFo: [0.1, 0.2, -1], lUp: L([0.3, -0.5, -0.8]), lFo: L([0.1, 0.2, -1]), lean: -0.08, tuck: 0.12 }),
  landHard: pose({ rUp: [0.35, -0.6, -0.7], rFo: [0.05, -0.8, -0.6], lUp: L([0.4, -0.75, -0.5]), lFo: L([0.1, -0.95, -0.3]), lean: 0.5, crouch: 0.3 }),
};

const FLINCH: readonly ["flinchF", "flinchB", "flinchL", "flinchR"] = ["flinchF", "flinchB", "flinchL", "flinchR"];
const _fw = { f: 0, b: 0, l: 0, r: 0 };
const _fp = newPose();
const _fws = [0, 0, 0, 0];

/**
 * A blow taken from `rel` degrees clockwise of the way the walker faces, `t` seconds ago: the four
 * flinches (from in front, behind, its left and its right) blended by how much the blow came from
 * each, written into `out`; and how much of it is laid over the walk.
 */
export function sampleFlinch(rel: number, t: number, out: MovePose): number {
  const w = strafeWeights(rel, _fw);
  const ws = _fws;
  ws[0] = w.f;
  ws[1] = w.b;
  ws[2] = w.l;
  ws[3] = w.r;
  let total = 0;
  let own = 0;
  for (let i = 0; i < 4; i++) {
    const k = ws[i]!;
    if (k <= 0) continue;
    own = sampleMove(FLINCH[i]!, t, total === 0 ? out : _fp);
    if (total > 0) mixPose(out, out, _fp, k / (total + k));
    total += k;
  }
  return own;
}

/** The share of the way into a move's first key at `t` seconds: how a move comes in. */
export function comingIn(move: Move, t: number): number {
  const first = MOVES[move].keys[0]!.t;
  return t >= first ? 1 : eased(Math.max(0, t / first), "out");
}
