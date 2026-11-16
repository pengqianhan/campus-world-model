// A walker's figure: a small made-up person, 1.75 m tall. No real person is drawn. Every walker
// looks the same: a student in a long-sleeved top, trousers, trainers and a backpack, with nothing
// meant to mark a sex or a gender. The body is Quaternius's "Animated Human" (CC0), with its idle,
// walk and run; figureBuild.ts, loaded with it on the first walk, makes it over and builds the
// hair, the backpack and the umbrella that ride on its bones. This poses it. It faces north with no
// turn and stands with its feet at its origin.
import {
  AdditiveAnimationBlendMode,
  AnimationClip,
  AnimationMixer,
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  GreaterDepth,
  Group,
  KeepStencilOp,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NotEqualStencilFunc,
  Quaternion,
  QuaternionKeyframeTrack,
  ReplaceStencilOp,
  RingGeometry,
  SkinnedMesh,
  Vector3,
  VectorKeyframeTrack,
  type AnimationAction,
  type Bone,
  type Material,
  type Object3D,
} from "three";
import type { Gear } from "./figureBuild.ts";
import { DECK, GRIP, Scooter, type Ride } from "./rides.ts";
import { JUMP_POSES, MOVES, comingIn, mixPose, moveLength, newPose, sampleFlinch, sampleMove, type Move, type MovePose } from "./figureMoves.ts";
import { JUMP_SPEED, airCycle, airTimeLeft, dutyFactor, footAt, oneFoot, strafeWeights, strideLength, takeoffFoot, type JumpKind } from "../shared/locomotion.ts";

/** Where the eyes are, for the view from the walker. */
export const EYE_HEIGHT = 1.6;
/** The arms' joints are drawn this much nearer the spine than the body has them. */
const SHOULDERS = 0.88;
/** The hands are drawn this much of the size the body has them. */
const HANDS = 0.85;
/**
 * The figure standing at ease (`standing`): bones turned so that the way from each to the next
 * points along a direction in the figure's own frame (x to its right, y up, z behind it).
 */
const STAND: [bone: string, child: string, dir: [number, number, number]][] = [
  ["Spine", "Spine1", [0, 1, 0]],
  ["Spine1", "Spine2", [0, 1, 0]],
  ["Spine2", "Neck", [0, 1, 0]],
  ["Neck", "Head", [0, 1, -0.12]],
  ["Head", "HeadTop_End", [0, 1, 0]],
  ["LeftUpLeg", "LeftLeg", [-0.03, -1, 0]],
  ["LeftLeg", "LeftFoot", [0, -1, 0.02]],
  ["RightUpLeg", "RightLeg", [0.03, -1, 0]],
  ["RightLeg", "RightFoot", [0, -1, 0.02]],
  ["LeftArm", "LeftForeArm", [-0.2, -1, 0.04]],
  ["LeftForeArm", "LeftHand", [-0.08, -1, -0.22]],
  ["RightArm", "RightForeArm", [0.2, -1, 0.04]],
  ["RightForeArm", "RightHand", [0.08, -1, -0.22]],
];
/** Radians the feet point out from straight ahead, standing. */
const TOES_OUT = 0.12;
/** Radians each joint of the fingers is curled from the line of the hand, standing; and how far the thumb comes in. */
const CURL = [0.35, 0.8, 1.15];
const THUMB_IN = 0.35;
/**
 * The see-through shape leaves out the body below this, in its own units (about 0.22 m): the
 * shoes. Where the ground is painted over the soles, they would show through it.
 */
const XRAY_ABOVE = 0.45;
/** Metres a walk cycle (two steps) covers at the animation's own pace, and a run cycle. */
const WALK_CYCLE = 1.4;
const RUN_CYCLE = 2.4;
/** Metres a second over which the walk turns into a run. */
const RUN_FROM = 3.0;
const RUN_AT = 3.5;
/** The fastest the legs go, metres a second of stride: a walker sped up past it glides a little. */
const WALK_CADENCE_MAX = 3.2;
const RUN_CADENCE_MAX = 7;
/** The rider on a scooter: where each leg points, in the seat's frame, one foot before the other on the deck. */
const RIDE_LEGS: [bone: string, child: string, dir: [number, number, number]][] = [
  ["LeftUpLeg", "LeftLeg", [0.07, -1, -0.12]],
  ["LeftLeg", "LeftFoot", [0.04, -1, -0.04]],
  ["RightUpLeg", "RightLeg", [-0.07, -1, 0.14]],
  ["RightLeg", "RightFoot", [-0.04, -1, 0.06]],
];
/**
 * The bones the figure turns itself after the mixer, each after its parent: a move of the game
 * (figureMoves.ts) and the legs' own steps (gaitLegs). Kept as the mixer left them and put back
 * before the next pose, since the mixer sets again only a bone whose value it changes.
 */
const ACT_BONES = ["Hips", "Spine", "Spine1", "Spine2", "Neck", "RightArm", "RightForeArm", "LeftArm", "LeftForeArm", "LeftUpLeg", "LeftLeg", "LeftFoot", "RightUpLeg", "RightLeg", "RightFoot"] as const;
/**
 * The legs' own steps, for a way of going off the way the figure faces (a side-step, a backpedal),
 * where the walk and the run clips, made for going ahead, would slide the feet: from `GAIT_FROM` to
 * `GAIT_TO` degrees off ahead they take over from the clips.
 */
const GAIT_FROM = 20;
const GAIT_TO = 50;
/** Radians the hips turn at most towards a diagonal, the chest turned back to face ahead. */
const HIP_TWIST = 0.45;
/** Metres a foot lifts as it swings, walking and running; and the hips' dip as a foot comes down. */
const LIFT_WALK = 0.1;
const LIFT_RUN = 0.2;
const BOB = 0.025;
/**
 * The lean into a turn and into speeding up or slowing (steered by the stick): radians at most, the
 * share of the lean that would hold it up that it takes, and the spring that sways it there and
 * settles it (radians a second, and its damping: under 1 it overshoots a little and settles).
 */
const WALK_LEAN = 0.16;
const WALK_LEAN_SHARE = 0.55;
const LEAN_SPRING = 13;
const LEAN_DAMP = 0.45;
/**
 * The guard, locked on: the highlighter held up before the right shoulder, the left hand forward,
 * the right shoulder a little back; laid over the walk's arms by GUARD_SHARE.
 */
const GUARD: MovePose = { rUp: [0.4, -0.75, -0.35], rFo: [-0.05, 0.6, -0.8], lUp: [-0.3, -0.75, -0.5], lFo: [0.05, 0.05, -1], twist: -0.12, lean: 0.06, crouch: 0, step: 0, roll: 0, bank: 0, hop: 0, splay: 0, tuck: 0 };
const GUARD_SHARE = 0.8;
/**
 * A one-foot jump (leaping): radians the lead thigh drives up at most and the trail thigh reaches
 * back, and the body's lean (at a standstill, and more at a run). Half as much for a step-up.
 */
const LEAD_LIFT = 0.6;
const TRAIL_BACK = 0.4;
const LEAP_LEAN = 0.08;
const LEAP_LEAN_SPEED = 0.1;
/** Down from one: metres the hips dip (and more at a run, and after a long fall), and seconds it takes. */
const DIP = 0.025;
const DIP_SPEED = 0.025;
const DIP_HARD = 0.06;
const DIP_TIME = 0.16;
/** Seconds a landing is taken in the knees, and more after the longest fall. */
const LAND_TIME = 0.22;
const LAND_TIME_HARD = 0.2;
/** Metres the hips dip in a pivot, all the way into it. */
const PIVOT_DIP = 0.06;
/** The two bones of the back that a move twists and bows. */
const SPINE = ["Spine1", "Spine2"] as const;
/** Seconds over which a move cut short by none lets go. */
const LET_GO = 0.2;
/**
 * The highlighter held in the game, a toy one big enough to read from behind the walker: metres
 * long and across, and the share of it from the back at which the fist grips it.
 */
const PEN_LENGTH = 0.36;
const PEN_RADIUS = 0.034;
const PEN_GRIP = 0.3;
/** Its ink: a bright pink that reads against the sky, the grass and the paving alike. */
const PEN_INK = [1, 0.27, 0.62] as const;
/**
 * The trail a blow leaves: samples kept, metres from the grip along the pen at which it starts and
 * ends (past its tip), its colour at the newest sample and the oldest, its opacity at the newest
 * sample's outer and inner edge, and seconds it fades over.
 */
const TRAIL_SAMPLES = 12;
const TRAIL_FROM = 0.06;
const TRAIL_TO = 0.42;
const TRAIL_HEAD = [1, 0.3, 0.66] as const;
const TRAIL_TAIL = [1, 0.62, 0.25] as const;
const TRAIL_ALPHA = [0.92, 0.25] as const;
const TRAIL_FADE = 0.15;

/** Radians the rider leans at most into a turn, and the share of the lean that would hold it up that it takes. */
const MAX_LEAN = 0.2;
const LEAN = 0.6;

interface Body {
  root: Object3D;
  mesh: SkinnedMesh;
  mixer: AnimationMixer;
  idle: AnimationAction;
  walk: AnimationAction;
  run: AnimationAction;
  bone: (name: string) => Bone;
  /** The figure standing at ease, added to the idle: see `standing`. */
  stand: AnimationAction;
}

export class Figure {
  /** At the feet; turn with `setHeading`. */
  readonly root = new Group();
  /** What the body stands in: leans into a turn, with the scooter, while the ring stays flat on the ground. */
  private seat = new Group();
  private ride: Ride = "walk";
  private scooter?: Scooter;
  /** Bones the ride turned after the mixer, as the mixer left them, put back before the next pose. */
  private riding?: [Bone, Quaternion][];
  private body?: Body;
  private build?: typeof import("./figureBuild.ts");
  /** What it wears, from figureBuild.ts. */
  private gear?: Gear;
  private umbrella = new Group();
  private ring: Mesh;
  /** The body again, drawn flat only where something stands in front of it: see `xrayMaterial`. */
  private xray?: SkinnedMesh;
  private xrayMaterial: MeshBasicMaterial;
  private umbrellaOpen = false;
  private headVisible = true;
  private disposed = false;
  /**
   * Set when the figure changed without moving (its body arrived, the umbrella opened), so the
   * scene draws a frame; read with `takeChanged`.
   */
  private changed = false;
  private last?: number;
  private walkCycles = 0;
  private runCycles = 0;
  /** Feet put down so far, two a cycle of the walk or the run, whichever leads: for the game's footsteps. */
  footfalls = 0;
  private runBlend = 0;
  private stance = { moving: 0, speed: 0, t: 0 };
  /**
   * A move of the game laid over the walk (figureMoves.ts): which, seconds since it began, how much
   * of it is laid over now, and how much of the one before it was when this began (`fromPose`).
   */
  private act: { move?: Move; t: number; w: number; fromW: number; rate: number; dir?: number } = { t: 0, w: 0, fromW: 0, rate: 1 };
  private actPose = newPose();
  private keyPose = newPose();
  private fromPose = newPose();
  /** The bones a move or the gait turned, and the hips' place, as the mixer left them; put back before the next pose. */
  private actSaved?: Quaternion[];
  private hipsSaved = new Vector3();
  private acted = false;
  /** Metres the thigh is long (and the shin about the same), for a crouch. */
  private legLength = 0.42;
  private dressing = false;
  private pen?: Mesh;
  private penOn = false;
  /** Where the highlighter sits in the right hand, as fitted at the last dressing: made only once the game asks for it. */
  private penFit?: Matrix4;
  private trail?: { mesh: Mesh; pos: Float32Array; col: Float32Array; life: number };
  /**
   * How it goes over the ground, in its own frame (to its right, ahead), metres a second, and how
   * that changes; degrees a second it turns; the share left of a pivot; and whether it is steered by
   * the stick (it leans then). See setGait.
   */
  private gait = { x: 0, z: 0, ax: 0, az: 0, turn: 0, pivot: 0, lean: false, guard: false };
  /** How much of the guard (GUARD) is laid over the arms: locked on to a foe in the game. */
  private guardW = 0;
  /**
   * The jump (setAir): metres the feet are off the ground, how fast they rise, whether it is in the
   * air, seconds left of the crouch before it leaves the ground, seconds since it landed and how hard.
   */
  private air = { z: 0, vz: 0, on: false, windup: 0, land: 9, hard: 0, kind: "hop" as JumpKind };
  private jumpPose = newPose();
  /**
   * The gait's cycle counted on and never wrapped (`phase` is its share of a cycle), so that it can
   * be seen to run on without a break through a jump.
   */
  private cycles = 0;
  /**
   * A one-foot jump under way (a step-up or a running leap): the foot it pushed off, the cycle at
   * which the other (the lead) comes down to land, the cycle and the seconds since it left the ground.
   */
  private leap = { on: false, kind: "leap" as JumpKind, push: "L" as "L" | "R", land: 0, from: 0, t: 0 };
  /** The last landing: its kind and the pace then, for the dip that takes it; whether it was in the air at the last pose. */
  private landed = { kind: "hop" as JumpKind, speed: 0 };
  private wasOn = false;
  /** What the gait is doing, for a test or a recording to read (gaitInfo). */
  private info = { phase: 0, cycles: 0, planted: "", kind: "", push: "", leap: false };
  /** How much the legs' own steps have taken over from the clips, and where they are in their cycle (0-1, the left foot down at 0). */
  private gaitW = 0;
  private phase = 0;
  /** Where in the walk's and the run's cycles the left foot comes down, measured from the clips at the dressing. */
  private walkDown = 0;
  private runDown = 0;
  /** The legs' measures, standing: thigh and shin, the hips' and the ankles' heights, and the foot (ankle to toe) along and down. */
  private legs = { thigh: 0.42, shin: 0.42, hipY: 0.9, ankleY: 0.08, toeAlong: 0.12, toeDown: -0.05 };
  private sw = { f: 0, b: 0, l: 0, r: 0 };
  /** The lean (radians ahead, and over to its right), and how fast each changes. */
  private sway = { x: 0, vx: 0, z: 0, vz: 0 };

  constructor(ringColour: number) {
    // A ring on the ground round the feet, so the walker can be found from above.
    const ringGeometry = new RingGeometry(0.75, 1.05, 32);
    ringGeometry.rotateX(-Math.PI / 2);
    this.ring = new Mesh(ringGeometry, new MeshBasicMaterial({ color: ringColour, transparent: true, opacity: 0.85, depthWrite: false }));
    this.ring.position.y = 0.1;
    this.ring.renderOrder = 2;
    this.root.add(this.ring, this.umbrella, this.seat);
    // Where a building or a tree hides the walker, its shape shows through in the ring's colour.
    // The figure marks the pixels it is seen at in the stencil; the shape is drawn behind other
    // things (GreaterDepth) and only off those pixels, so it never covers the figure itself.
    this.xrayMaterial = new MeshBasicMaterial({ color: ringColour, transparent: true, opacity: 0.55, depthWrite: false, depthFunc: GreaterDepth });
    this.xrayMaterial.stencilWrite = true;
    this.xrayMaterial.stencilRef = 1;
    this.xrayMaterial.stencilFunc = NotEqualStencilFunc;
    this.xrayMaterial.stencilZPass = KeepStencilOp;
    this.xrayMaterial.onBeforeCompile = (s) => {
      s.vertexShader = s.vertexShader
        .replace("void main() {", "varying float vRise;\nvoid main() {")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\n  vRise = position.y;");
      s.fragmentShader = s.fragmentShader.replace("void main() {", `varying float vRise;\nvoid main() {\n  if (vRise < ${XRAY_ABOVE.toFixed(2)}) discard;`);
    };
    this.xrayMaterial.customProgramCacheKey = () => "walker-xray";
    this.root.userData.noPick = true;
    this.ring.userData.noPick = true;
    void this.load();
  }

  /** Whether the body has arrived and is drawn. */
  get ready(): boolean {
    return !!this.body;
  }

  /** True once after the figure changed without moving: draw a frame. */
  takeChanged(): boolean {
    const c = this.changed;
    this.changed = false;
    return c;
  }

  /** Turns the figure to face a compass bearing, degrees clockwise from north. */
  setHeading(deg: number): void {
    this.root.rotation.y = (-deg * Math.PI) / 180;
  }

  /** The jump, for the figure's pose and its ring, which stays on the ground below it. See `air`. */
  setAir(z: number, vz: number, on: boolean, windup: number, land: number, hard: number, kind: JumpKind = "hop"): void {
    const a = this.air;
    a.kind = kind;
    a.z = z;
    a.vz = vz;
    a.on = on;
    a.windup = windup;
    a.land = land;
    a.hard = hard;
    this.ring.position.y = 0.1 - z;
  }

  /**
   * The gait now, for a test or a recording: the share of the cycle it is at (the left foot comes
   * down at 0, the right at 0.5), the cycles counted on, the foot or feet on the ground (L, R, LR, or
   * none in the air), and the jump's kind and the foot it pushed off. The same object each time.
   */
  gaitInfo(): { phase: number; cycles: number; planted: string; kind: string; push: string; leap: boolean } {
    return this.info;
  }

  /** Draw a frame: something changed that the figure does not see itself (a landing). */
  changedNow(): void {
    this.changed = true;
  }

  /** Opens or closes the umbrella. */
  setUmbrella(open: boolean): void {
    if (open === this.umbrellaOpen) return;
    this.umbrellaOpen = open;
    this.umbrella.visible = open && this.headVisible;
    this.changed = true;
  }

  /** Hides the head and the hair, for the view through the walker's own eyes. */
  setHeadVisible(visible: boolean): void {
    this.headVisible = visible;
    this.umbrella.visible = this.umbrellaOpen && visible;
    this.showHead();
  }

  setRingVisible(visible: boolean): void {
    this.ring.visible = visible;
  }

  /**
   * Starts a move of the game (figureMoves.ts), from wherever the last one had got to; none lets go
   * of what is laid over the walk.
   */
  play(move: Move | undefined, opts?: { dir?: number; rate?: number }): void {
    const a = this.act;
    mixPose(this.fromPose, this.actPose, this.actPose, 0);
    a.fromW = a.w;
    a.move = move;
    a.t = 0;
    // A flinch is the blend of the four for the way the blow came from (degrees off ahead, clockwise);
    // a move can be played slower or faster (the Cram Sprint's longer dodge).
    a.dir = opts?.dir;
    a.rate = opts?.rate ?? 1;
    this.changed = true;
  }

  /**
   * How the walker goes over the ground, for its legs and its lean: metres a second to its right and
   * ahead (in the figure's own frame), how fast each changes, degrees a second it turns, the share
   * left of a pivot, and whether it is steered by the stick (it leans into turns and speeding up only then).
   */
  setGait(right: number, ahead: number, accRight: number, accAhead: number, turnRate: number, pivot: number, lean: boolean, guard = false): void {
    const g = this.gait;
    g.x = right;
    g.z = ahead;
    g.ax = accRight;
    g.az = accAhead;
    g.turn = turnRate;
    g.pivot = pivot;
    g.lean = lean;
    g.guard = guard;
  }

  /** Shows the highlighter in the right hand, for the game. */
  setPen(on: boolean): void {
    this.penOn = on;
    if (on) this.makePen();
    if (this.pen) this.pen.visible = on;
    this.changed = true;
  }

  /**
   * On foot, on the scooter, its feet on the deck and its hands on the grips, or away while a
   * drone flies in its place (walkers.ts), when the figure is not drawn at all.
   */
  setRide(ride: Ride): void {
    if (ride === this.ride) return;
    this.ride = ride;
    if (ride === "scooter" && !this.scooter) {
      this.scooter = new Scooter();
      this.seat.add(this.scooter.root);
    }
    if (this.scooter) this.scooter.root.visible = ride === "scooter";
    if (this.body) this.body.root.position.y = ride === "scooter" ? DECK : 0;
    this.root.visible = ride !== "fly";
    if (ride !== "scooter") this.seat.rotation.z = 0;
    this.seat.rotation.x = 0;
    this.sway = { x: 0, vx: 0, z: 0, vz: 0 };
    this.changed = true;
  }

  /** On the scooter: rolls its wheels by `metres`, and leans into a turn of `turnRate` degrees a second at `speed` metres a second. */
  rideOn(metres: number, speed: number, turnRate: number, dt: number): void {
    if (this.ride !== "scooter" || !this.scooter) return;
    if (metres) this.scooter.roll(metres);
    // Leaning so that the turn holds it up: tan(lean) = speed * rate of turn / g.
    const want = -Math.max(-MAX_LEAN, Math.min(MAX_LEAN, LEAN * Math.atan((speed * ((turnRate * Math.PI) / 180)) / 9.81)));
    const was = this.seat.rotation.z;
    this.seat.rotation.z += (want - was) * Math.min(1, dt * 5);
    if (metres || Math.abs(this.seat.rotation.z - was) > 1e-4) this.changed = true;
  }

  /**
   * Poses the figure: `moving` is 0 standing to 1 on the move, `speed` metres a second, `t`
   * seconds, the clock the walk and the breathing of a figure standing still keep to.
   */
  pose(moving: number, speed: number, t: number): void {
    this.stance = { moving, speed, t };
    const b = this.body;
    if (!b) return;
    // The bones the scooter turned go back to where the mixer left them, which it may not set again.
    for (const [bone, q] of this.riding ?? []) bone.quaternion.copy(q);
    this.riding = undefined;
    // And those a move of the game or the gait turned.
    if (this.acted) {
      for (let i = 0; i < ACT_BONES.length; i++) b.bone(ACT_BONES[i]!).quaternion.copy(this.actSaved![i]!);
      b.bone("Hips").position.copy(this.hipsSaved);
      b.root.position.set(0, this.ride === "scooter" ? DECK : 0, 0);
      b.root.rotation.set(0, 0, 0);
      this.acted = false;
    }
    // On the scooter it stands at ease, however fast it goes.
    if (this.ride === "scooter") moving = 0;
    const dt = this.last === undefined ? 0 : Math.max(0, Math.min(1, t - this.last));
    this.last = t;
    const run = Math.max(0, Math.min(1, (speed - RUN_FROM) / (RUN_AT - RUN_FROM)));
    this.runBlend += (run - this.runBlend) * Math.min(1, dt * 5);
    // Going off the way it faces (a side-step, a backpedal), the legs step for themselves.
    const g = this.gait;
    const over = Math.hypot(g.x, g.z);
    const rel = over > 1e-3 ? (Math.atan2(g.x, g.z) * 180) / Math.PI : 0;
    const off = Math.abs(rel);
    // Off the ground, the feet do not step.
    const gaitWant = this.ride === "walk" && !this.dressing && over > 0.12 && !this.air.on ? smooth((off - GAIT_FROM) / (GAIT_TO - GAIT_FROM)) : 0;
    this.gaitW += (gaitWant - this.gaitW) * Math.min(1, dt * 10);
    if (this.gaitW < 0.002) this.gaitW = 0;
    const sw = strafeWeights(rel, this.sw);
    const stride = strideLength(over, sw.l + sw.r, sw.b);
    const air = this.air;
    let was = this.phase;
    const L = this.leap;
    const legs = this.ride === "walk" && !this.dressing;
    const leaping = legs && air.on && oneFoot(air.kind);
    if (L.on && !leaping) {
      // Down: on the lead foot, at its step in the cycle (the air's pace got it there; on ground that
      // rose or fell under it, the little left over is taken now). The gait goes on from there.
      L.on = false;
      this.cycles = Math.max(this.cycles, L.land);
      this.phase = this.cycles - Math.floor(this.cycles);
      this.walkCycles = (this.phase + this.walkDown) % 1;
      this.runCycles = (this.phase + this.runDown) % 1;
      was = this.phase;
    }
    if (leaping) {
      // A step-up or a running leap: the stride goes on through the air, off the foot down (or about
      // to come down) as it left the ground, and lands on the other foot as that foot's step comes
      // round. The clips are kept to the same cycle.
      if (!L.on) {
        const tk = takeoffFoot(this.phase, dutyFactor(over), _takeoff);
        L.on = true;
        L.kind = air.kind;
        L.push = tk.push;
        L.from = this.cycles;
        L.land = this.cycles + tk.ahead;
        L.t = 0;
      }
      L.t += dt;
      this.cycles = airCycle(this.cycles, L.land, airTimeLeft(air.z, air.vz), dt);
      this.phase = this.cycles - Math.floor(this.cycles);
      this.walkCycles = (this.phase + this.walkDown) % 1;
      this.runCycles = (this.phase + this.runDown) % 1;
    } else if (this.gaitW > 0) {
      // The legs' own cycle leads, at the stride's cadence, and the clips keep in step with it, so
      // that the two agree on which foot is down while one hands over to the other.
      const went = (dt * over) / stride;
      this.phase = (this.phase + went) % 1;
      this.walkCycles = (this.phase + this.walkDown) % 1;
      this.runCycles = (this.phase + this.runDown) % 1;
      if (moving > 0.5) this.footfalls += 2 * went;
    } else {
      // One cycle for the walk and the run, at a stride between theirs as the one hands over to the
      // other, so that the two clips agree on which foot is down and slowing from a run to a walk
      // never jumps the cycle.
      const k = this.runBlend;
      const went = (dt * Math.min(speed, WALK_CADENCE_MAX + (RUN_CADENCE_MAX - WALK_CADENCE_MAX) * k)) / (WALK_CYCLE + (RUN_CYCLE - WALK_CYCLE) * k);
      this.phase = (this.phase + went) % 1;
      this.walkCycles = (this.phase + this.walkDown) % 1;
      this.runCycles = (this.phase + this.runDown) % 1;
      if (moving > 0.5) this.footfalls += 2 * went;
    }
    // The cycle counted on (in the leap above it counts itself).
    if (!leaping) {
      let d = this.phase - was;
      if (d < -0.5) d += 1;
      else if (d > 0.5) d -= 1;
      this.cycles += d;
    }
    // A landing: its kind and pace, for the dip that takes it; a long fall at a run, a quick roll on.
    if (this.wasOn && !air.on) {
      this.landed.kind = air.kind;
      this.landed.speed = over;
      if (legs && air.hard >= 0.99 && over >= 2 && oneFoot(air.kind)) this.play("dodgeF", { rate: 1.4 });
    }
    this.wasOn = air.on;
    const inf = this.info;
    inf.phase = this.phase;
    inf.cycles = this.cycles;
    inf.kind = air.on || air.windup > 0 ? air.kind : "";
    inf.push = L.on ? L.push : "";
    inf.leap = L.on;
    if (air.on) inf.planted = "";
    else {
      const duty = dutyFactor(over);
      const dl = this.phase < duty;
      const dr = (this.phase + 0.5) % 1 < duty;
      inf.planted = moving < 0.5 ? "LR" : dl && dr ? "LR" : dl ? "L" : dr ? "R" : "";
    }
    b.idle.time = t % b.idle.getClip().duration;
    b.walk.time = this.walkCycles * b.walk.getClip().duration;
    b.run.time = this.runCycles * b.run.getClip().duration;
    b.idle.setEffectiveWeight(1 - moving);
    b.walk.setEffectiveWeight(moving * (1 - this.runBlend));
    b.run.setEffectiveWeight(moving * this.runBlend);
    // Standing still, it stands at ease; coming to a stop, it comes into it.
    b.stand.setEffectiveWeight(1 - moving);
    b.mixer.update(0);
    if (this.ride === "scooter") this.holdBars(b);
    else if (this.umbrellaOpen && this.headVisible) this.holdUmbrella(b);
    const own = this.ride === "walk" && !this.dressing;
    if (own) this.leaning(b, dt);
    const a = this.act;
    if (own && (this.gaitW > 0 || a.move || a.fromW > 0 || g.pivot > 0)) this.keep(b);
    if (own && this.gaitW > 0) this.gaitLegs(b, over, rel, stride);
    if (own && g.pivot > 0) b.root.position.y -= PIVOT_DIP * Math.min(1, g.pivot / 0.1);
    // Locked on, the arms hold a guard rather than swinging as in a walk; a move comes out of it.
    const guardWant = own && g.guard ? GUARD_SHARE : 0;
    this.guardW += (guardWant - this.guardW) * Math.min(1, dt * 6);
    if (this.guardW < 0.002) this.guardW = 0;
    if (own && this.guardW > 0) {
      this.keep(b);
      this.lay(b, GUARD, this.guardW);
      this.changed = true;
    }
    // The jump: its crouch, push off, tuck, reach for the ground and landing, over the walk; a blow
    // comes out of it.
    const jw = own ? this.jumping() : 0;
    if (jw > 0) {
      this.keep(b);
      this.lay(b, this.jumpPose, jw);
      this.changed = true;
    }
    // A one-foot jump in the air: the lead knee driven up and forward, the trail leg reaching back,
    // the body leaning on with the pace and the head held level; the lead foot reaching down to land.
    if (own && L.on) {
      this.keep(b);
      this.leaping(b, over);
      this.changed = true;
    }
    // Down from a one-foot jump: the hips dip a little and come up, in stride; no squat.
    if (own && !air.on && oneFoot(this.landed.kind) && air.land < DIP_TIME) {
      this.keep(b);
      const k = 1 - air.land / DIP_TIME;
      b.root.position.y -= (DIP + DIP_SPEED * Math.min(1, this.landed.speed / 3.5) + DIP_HARD * air.hard) * k * k;
      this.changed = true;
    }
    if (own) this.acting(b, dt);
    else this.act.w = 0;
    this.trailStep(dt);
  }

  /**
   * The pose of a jump off both feet now (into jumpPose), and how much of it is laid over the walk: 0
   * to 1. A one-foot jump (a step-up, a leap) has none: its legs keep their stride (leaping).
   */
  private jumping(): number {
    const a = this.air;
    const P = JUMP_POSES;
    const out = this.jumpPose;
    if (a.windup > 0) {
      mixPose(out, P.windup, P.windup, 0);
      return 1;
    }
    if (a.on) {
      if (oneFoot(a.kind)) return 0;
      if (a.kind === "side" || a.kind === "back") {
        // A side leap, the legs crossing over and the body leaning the way it goes; a small back hop.
        const pose = a.kind === "side" ? P.side : P.back;
        mixPose(out, pose, pose, 0);
        if (a.kind === "side" && this.gait.x < 0) {
          out.bank = -out.bank;
          out.twist = -out.twist;
        }
        return Math.min(1, 0.4 + 0.6 * Math.min(1, a.z / 0.2));
      }
      if (a.vz > 0) mixPose(out, P.rise, P.apex, smooth(1 - a.vz / JUMP_SPEED));
      else mixPose(out, P.apex, P.fall, smooth(-a.vz / (JUMP_SPEED * 1.1)));
      return 1;
    }
    if (oneFoot(this.landed.kind)) return 0;
    // Landed: taken in the knees, deeper and longer after a long fall, and up again; lightly after a
    // side leap or a back hop.
    const light = this.landed.kind === "side" || this.landed.kind === "back" ? 0.5 : 1;
    const length = (LAND_TIME + LAND_TIME_HARD * a.hard) * light;
    if (a.land >= length) return 0;
    mixPose(out, P.land, P.landHard, a.hard);
    const k = a.land / length;
    return (1 - k) * (1 - k) * light;
  }

  /** The legs and the body of a one-foot jump in the air, over the run's (or the walk's) own pose. */
  private leaping(b: Body, speed: number): void {
    const L = this.leap;
    const a = this.air;
    const left = airTimeLeft(a.z, a.vz);
    const u = Math.min(1, L.t / Math.max(1e-3, L.t + left));
    const w = smooth(L.t / 0.06);
    const big = L.kind === "leap" ? 1 : 0.55;
    this.root.updateMatrixWorld(true);
    const right = _right.set(1, 0, 0).transformDirection(this.root.matrixWorld);
    const lead = L.push === "L" ? LEG_R : LEG_L;
    const trail = L.push === "L" ? LEG_L : LEG_R;
    // The lead knee up and forward early, and down again to reach for the ground at the end.
    const lift = LEAD_LIFT * big * Math.sin(Math.PI * Math.min(1, u * 1.15)) * w;
    turn(b.bone(lead.up), _q.setFromAxisAngle(right, lift));
    turn(b.bone(lead.knee), _q.setFromAxisAngle(right, -lift * 0.85));
    // The trail leg left reaching back from the push.
    const back = TRAIL_BACK * big * Math.sin(Math.PI * u) * w;
    turn(b.bone(trail.up), _q.setFromAxisAngle(right, -back));
    turn(b.bone(trail.knee), _q.setFromAxisAngle(right, -back * 0.6));
    // Leaning on with the pace, the head kept level.
    const lean = (LEAP_LEAN + LEAP_LEAN_SPEED * Math.min(1, speed / 3.5)) * big * w;
    for (const n of SPINE) turn(b.bone(n), _q.setFromAxisAngle(right, -lean / 2));
    turn(b.bone("Neck"), _q.setFromAxisAngle(right, lean * 0.8));
  }

  /** Keeps the bones the figure turns itself as the mixer left them, to put back before the next pose. */
  private keep(b: Body): void {
    if (this.acted) return;
    const saved = (this.actSaved ??= ACT_BONES.map(() => new Quaternion()));
    for (let i = 0; i < ACT_BONES.length; i++) saved[i]!.copy(b.bone(ACT_BONES[i]!).quaternion);
    this.hipsSaved.copy(b.bone("Hips").position);
    this.acted = true;
  }

  /**
   * Steered by the stick: leans into a turn and into speeding up, back as it slows, on a spring that
   * overshoots a little and settles. Otherwise it comes upright.
   */
  private leaning(b: Body, dt: number): void {
    const g = this.gait;
    const sp = Math.hypot(g.x, g.z);
    let ahead = 0;
    let right = 0;
    if (g.lean) {
      ahead = Math.max(-WALK_LEAN, Math.min(WALK_LEAN, WALK_LEAN_SHARE * Math.atan(g.az / 9.81)));
      right = Math.max(-WALK_LEAN, Math.min(WALK_LEAN, WALK_LEAN_SHARE * Math.atan((g.ax + sp * ((g.turn * Math.PI) / 180)) / 9.81)));
    }
    const s = this.sway;
    for (let left = Math.min(dt, 0.2); left > 1e-6; left -= 0.02) {
      const h = Math.min(0.02, left);
      s.vx += (LEAN_SPRING * LEAN_SPRING * (ahead - s.x) - 2 * LEAN_DAMP * LEAN_SPRING * s.vx) * h;
      s.x += s.vx * h;
      s.vz += (LEAN_SPRING * LEAN_SPRING * (right - s.z) - 2 * LEAN_DAMP * LEAN_SPRING * s.vz) * h;
      s.z += s.vz * h;
    }
    // Come upright, it is upright: a sway dwindling for ever would draw a frame each time.
    if (Math.abs(ahead) + Math.abs(right) < 1e-4 && Math.abs(s.x) + Math.abs(s.z) + Math.abs(s.vx) + Math.abs(s.vz) < 1e-3) s.x = s.z = s.vx = s.vz = 0;
    // Over its feet: ahead is a turn about its x, to its right one about its z.
    this.seat.rotation.x = -s.x;
    this.seat.rotation.z = -s.z;
    if (s.x || s.z) this.changed = true;
    void b;
  }

  /**
   * The legs' own steps (locomotion.ts): each foot put down ahead along the way it goes and left
   * where it was put while the body goes over it, then swung on to the next; the hips turned a
   * little towards a diagonal, the chest turned back to the front, the knees bent to reach (two
   * bones, the knee forward). Laid over the clips by how far it goes off ahead (gaitW).
   */
  private gaitLegs(b: Body, speed: number, rel: number, stride: number): void {
    const w = this.gaitW;
    const L = this.legs;
    const sw = this.sw;
    const r = (rel * Math.PI) / 180;
    // The way it goes, in the figure's frame (ahead is -z).
    const dx = Math.sin(r);
    const dz = -Math.cos(r);
    const duty = dutyFactor(speed);
    const run = Math.max(0, Math.min(1, (speed - 2.2) / 1.0));
    const lift = (LIFT_WALK + (LIFT_RUN - LIFT_WALK) * run) * (1 - 0.35 * (sw.l + sw.r));
    const reach = (L.thigh + L.shin) * 0.97;
    const half = (stride * duty) / 2;
    // The hips come down as far as the legs need to reach the feet at the ends of a step, and dip as
    // each foot comes down.
    const drop = Math.max(0, L.hipY - L.ankleY - Math.sqrt(Math.max(0, reach * reach - half * half))) + BOB * Math.min(1, speed / 2) * (0.5 + 0.5 * Math.cos(4 * Math.PI * this.phase));
    b.root.position.y -= drop * w;
    this.root.updateMatrixWorld(true);
    const up = _up.set(0, 1, 0).transformDirection(this.root.matrixWorld);
    const twist = HIP_TWIST * Math.sin(2 * r) * Math.min(1, speed / 1.2) * w;
    if (twist) {
      turn(b.bone("Hips"), _q.setFromAxisAngle(up, -twist));
      turn(b.bone("Spine"), _q.setFromAxisAngle(up, twist));
    }
    // The knees point the way the hips face.
    const kx = Math.sin(twist);
    const kz = -Math.cos(twist);
    for (const leg of LEGS) {
      const s = leg.s;
      const p = (this.phase + (s < 0 ? 0 : 0.5)) % 1;
      const f = footAt(p, stride, duty, lift, _foot);
      const thigh = b.bone(leg.up);
      const knee = b.bone(leg.knee);
      const ankle = b.bone(leg.ankle);
      const hip = this.local(thigh, _h);
      // Under the hip, a little wider going to the side, along the way it goes.
      const ft = _ft.set(hip.x + s * 0.07 * (sw.l + sw.r) + dx * f.along, L.ankleY + f.up, hip.z + dz * f.along);
      // Two bones: the knee where the thigh and the shin meet, bent forward.
      _d.subVectors(ft, hip);
      let dist = _d.length();
      if (dist > reach) {
        _d.multiplyScalar(reach / dist);
        dist = reach;
      }
      _d.normalize();
      const a = L.thigh;
      const c = L.shin;
      const cosA = Math.max(-1, Math.min(1, (a * a + dist * dist - c * c) / (2 * a * dist)));
      const sinA = Math.sqrt(1 - cosA * cosA);
      _pole.set(kx, 0, kz).addScaledVector(_d, -(kx * _d.x + kz * _d.z));
      if (_pole.lengthSq() < 1e-6) _pole.set(0, 0, -1);
      _pole.normalize();
      _k.copy(hip).addScaledVector(_d, a * cosA).addScaledVector(_pole, a * sinA);
      const end = _e.copy(hip).addScaledVector(_d, dist);
      limb(thigh, knee, this.root, _kd.subVectors(_k, hip), w);
      limb(knee, ankle, this.root, _kd.subVectors(end, _k), w);
      // The foot flat, toes along the way the knee points and a little out; tipped up off the ground as it swings.
      const tip = f.down ? 0 : 0.25 * Math.sin(Math.PI * Math.min(1, (p - duty) / (1 - duty)));
      limb(ankle, b.bone(leg.toe), this.root, _kd.set((kx + s * TOES_OUT) * L.toeAlong, L.toeDown - tip * L.toeAlong, kz * L.toeAlong), w);
    }
  }

  /** A bone's place in the figure's own frame, into `out`. */
  private local(bone: Bone, out: Vector3): Vector3 {
    return this.root.worldToLocal(bone.getWorldPosition(out));
  }

  /** Lays the move of the game under way over the pose the mixer left: see figureMoves.ts. */
  private acting(b: Body, dt: number): void {
    const a = this.act;
    if (!a.move && a.fromW <= 0) return;
    a.t += dt * a.rate;
    let w: number;
    if (a.move) {
      const own = a.move === "flinch" && a.dir !== undefined ? sampleFlinch(a.dir, a.t, this.keyPose) : sampleMove(a.move, a.t, this.keyPose);
      const k = comingIn(a.move, a.t);
      if (k < 1 && a.fromW > 0) {
        // Coming in from where the move before it had got to, not from the walk.
        mixPose(this.actPose, this.fromPose, this.keyPose, k);
        w = a.fromW * (1 - k) + own;
      } else {
        mixPose(this.actPose, this.keyPose, this.keyPose, 0);
        w = own;
      }
      if (a.t >= moveLength(a.move)) ((a.move = undefined), (a.fromW = 0));
    } else {
      // Cut short by none: it lets go.
      mixPose(this.actPose, this.fromPose, this.fromPose, 0);
      w = a.fromW * Math.max(0, 1 - a.t / LET_GO);
      if (w <= 0) a.fromW = 0;
    }
    a.w = Math.min(1, w);
    if (a.w <= 1e-3) {
      a.w = 0;
      return;
    }
    this.keep(b);
    this.lay(b, this.actPose, a.w);
    this.changed = true;
  }

  /** Turns the bones to `p`, `w` of the way from where the mixer left them. */
  private lay(b: Body, p: MovePose, w: number): void {
    // The hips down for a crouch and forward for a step; the knees bend to keep the feet down. Up
    // for a hop; and the whole body turned about its middle for a roll, and about its feet for a lean over.
    const crouch = Math.max(0, p.crouch) * w;
    const roll = wrapPi(p.roll) * w;
    const bank = p.bank * w;
    const pos = b.root.position;
    // A roll turns the body about its hips, held at the crouch's height (so that rolling over, the
    // tucked head comes no lower than the ground); a lean over turns it about its feet. The point
    // turned about rises from the feet to the hips as the roll starts.
    const mid = this.legs.hipY * Math.min(1, Math.abs(roll) * 3);
    b.root.rotation.set(-roll, 0, -bank);
    // Where the turn takes that point (0, mid, 0), with the bank first and then the roll (Euler XYZ).
    const cb = Math.cos(bank);
    pos.x -= mid * Math.sin(bank);
    pos.y += -crouch + p.hop * w + mid - mid * cb * Math.cos(roll);
    pos.z += -p.step * w + mid * cb * Math.sin(roll);
    this.root.updateMatrixWorld(true);
    const up = _up.set(0, 1, 0).transformDirection(this.root.matrixWorld);
    const right = _right.set(1, 0, 0).transformDirection(this.root.matrixWorld);
    // The chest: half the twist and the lean in each of the two bones of the back.
    for (const n of SPINE) {
      turn(b.bone(n), _q.setFromAxisAngle(up, (p.twist * w) / 2));
      turn(b.bone(n), _q.setFromAxisAngle(right, (-p.lean * w) / 2));
    }
    limb(b.bone("RightArm"), b.bone("RightForeArm"), this.root, p.rUp, w);
    limb(b.bone("RightForeArm"), b.bone("RightHand"), this.root, p.rFo, w);
    limb(b.bone("LeftArm"), b.bone("LeftForeArm"), this.root, p.lUp, w);
    limb(b.bone("LeftForeArm"), b.bone("LeftHand"), this.root, p.lFo, w);
    const splay = Math.sin(p.splay);
    // A tuck bends the knees as a crouch does, but draws the feet up rather than the hips down.
    const tuck = Math.max(0, p.tuck) * w;
    if (crouch > 0.005 || splay > 0.01 || tuck > 0.005) {
      // Thigh and shin about as long as each other: down by 2 L (1 - cos a) for a bend of a each way.
      const bend = Math.acos(Math.max(0.2, 1 - (crouch + tuck) / w / (2 * this.legLength)));
      const c = Math.cos(bend);
      const sn = Math.sin(bend);
      // Set apart for a side-step: each leg out to its side.
      limb(b.bone("LeftUpLeg"), b.bone("LeftLeg"), this.root, _leg.set(-0.04 - splay, -c, -sn), w);
      limb(b.bone("LeftLeg"), b.bone("LeftFoot"), this.root, _leg.set(-splay * 0.5, -c, sn), w);
      limb(b.bone("RightUpLeg"), b.bone("RightLeg"), this.root, _leg.set(0.04 + splay, -c, -sn), w);
      limb(b.bone("RightLeg"), b.bone("RightFoot"), this.root, _leg.set(splay * 0.5, -c, sn), w);
    }
  }

  /** The highlighter's trail: a ribbon from where its tip has been, fading, while a blow is under way. */
  private trailStep(dt: number): void {
    const tr = this.trail;
    const pen = this.pen;
    if (!tr || !pen) return;
    const a = this.act;
    const window = a.move ? MOVES[a.move].trail : undefined;
    const drawing = !!window && this.penOn && a.w > 0.5 && a.t >= window[0] && a.t <= window[1];
    const was = tr.life;
    tr.life = drawing ? TRAIL_FADE : Math.max(0, tr.life - dt);
    tr.mesh.visible = tr.life > 0 && this.penOn;
    if (!tr.mesh.visible) return;
    const pos = tr.pos;
    if (drawing) {
      pen.updateMatrixWorld(true);
      // Older samples move down the ribbon; a ribbon starting afresh starts where the pen is.
      if (was > 0) pos.copyWithin(6, 0, pos.length - 6);
      for (let k = 0; k < 6; k += 3) {
        _v.set(0, k ? TRAIL_TO : TRAIL_FROM, 0).applyMatrix4(pen.matrixWorld);
        this.root.worldToLocal(_v);
        pos[k] = _v.x;
        pos[k + 1] = _v.y;
        pos[k + 2] = _v.z;
      }
      if (was <= 0) for (let i = 6; i < pos.length; i += 6) pos.copyWithin(i, 0, 6);
    } else pos.copyWithin(6, 0, pos.length - 6);
    // Coloured, not white: pink at the newest sample turning orange down the ribbon, and fading out
    // to nothing at its oldest, its outer edge (the tip's way) the strongest.
    const fade = tr.life / TRAIL_FADE;
    for (let i = 0; i < TRAIL_SAMPLES; i++) {
      const age = i / (TRAIL_SAMPLES - 1);
      const k = (1 - age) * (1 - age) * fade;
      for (let e = 0; e < 2; e++) {
        const o = (i * 2 + e) * 4;
        tr.col[o] = TRAIL_HEAD[0] + (TRAIL_TAIL[0] - TRAIL_HEAD[0]) * age;
        tr.col[o + 1] = TRAIL_HEAD[1] + (TRAIL_TAIL[1] - TRAIL_HEAD[1]) * age;
        tr.col[o + 2] = TRAIL_HEAD[2] + (TRAIL_TAIL[2] - TRAIL_HEAD[2]) * age;
        tr.col[o + 3] = TRAIL_ALPHA[e === 0 ? 1 : 0] * k;
      }
    }
    // The arrays are the trail material's uniforms (makePen): nothing more to send.
    this.changed = true;
  }

  /** Where the highlighter goes in the right hand, fitted to the figure standing at ease: in the hand's frame. */
  private fitPen(b: Body): Matrix4 {
    // In the fist, pointing ahead of it and a little down the line of the forearm, as a sword is held.
    const local = (name: string) => this.root.worldToLocal(b.bone(name).getWorldPosition(new Vector3()));
    const wrist = local("RightHand");
    const fore = wrist.clone().sub(local("RightForeArm")).normalize();
    const dir = fore.clone().multiplyScalar(0.5).add(new Vector3(0, 0.1, -1)).normalize();
    const inRoot = new Matrix4().compose(wrist.addScaledVector(fore, 0.07), new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir), new Vector3(1, 1, 1));
    const hand = b.bone("RightHand");
    return new Matrix4().copy(hand.matrixWorld).invert().multiply(this.root.matrixWorld).multiply(inRoot);
  }

  /**
   * The highlighter in the right hand, and its trail: made the first time the game shows it, so that
   * a walker that never plays carries neither.
   */
  private makePen(): void {
    const b = this.body;
    const fit = this.penFit;
    if (this.pen || !b || !fit) return;
    // One mesh: a bright barrel and a dark cap at the writing end, coloured by height.
    const g = new CylinderGeometry(PEN_RADIUS, PEN_RADIUS * 0.9, PEN_LENGTH, 10, 12);
    const pos = g.getAttribute("position");
    const colours = new Float32Array(pos.count * 3);
    // A pink barrel, a dark cap at the writing end, and a white band where the fist holds it.
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      colours.set(y > PEN_LENGTH * 0.32 ? [0.13, 0.12, 0.15] : y < -PEN_LENGTH * 0.38 ? [0.95, 0.95, 0.95] : PEN_INK, i * 3);
    }
    g.setAttribute("color", new BufferAttribute(colours, 3));
    // Its origin where the fist grips it.
    g.translate(0, PEN_LENGTH / 2 - PEN_GRIP * PEN_LENGTH, 0);
    const penMaterial = new MeshStandardMaterial({ vertexColors: true, roughness: 0.5 });
    // It marks where the figure is seen, as the figure's other parts do (dress), so that the x-ray stays off it.
    penMaterial.stencilWrite = true;
    penMaterial.stencilRef = 1;
    penMaterial.stencilZPass = ReplaceStencilOp;
    const pen = new Mesh(g, penMaterial);
    // Nothing of the game casts a shadow (PROGRESS.md, Decisions: Study Quest).
    pen.castShadow = false;
    pen.userData.noPick = true;
    pen.raycast = () => {};
    fit.decompose(pen.position, pen.quaternion, pen.scale);
    b.bone("RightHand").add(pen);
    pen.visible = this.penOn;
    this.pen = pen;
    // The trail: quads between each sample and the next, in the figure's frame.
    const n = TRAIL_SAMPLES;
    const tp = new Float32Array(n * 2 * 3);
    const tc = new Float32Array(n * 2 * 4);
    const tg = new BufferGeometry();
    tg.setAttribute("position", new BufferAttribute(tp, 3));
    tg.setAttribute("color", new BufferAttribute(tc, 4));
    const idx: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    tg.setIndex(idx);
    // Where each corner is and its colour come from uniforms the trail writes in each frame, by the
    // corner's number: a vertex buffer written in every frame stalls ANGLE on Direct3D 11 (gameBuffers.ts).
    const corner = new Float32Array(n * 2);
    for (let i = 0; i < n * 2; i++) corner[i] = i;
    tg.setAttribute("aCorner", new BufferAttribute(corner, 1));
    const trailMaterial = new MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: DoubleSide, toneMapped: false });
    trailMaterial.onBeforeCompile = (sh) => {
      sh.uniforms.uTrailPos = { value: tp };
      sh.uniforms.uTrailCol = { value: tc };
      sh.vertexShader =
        `attribute float aCorner;
uniform vec3 uTrailPos[${n * 2}];
uniform vec4 uTrailCol[${n * 2}];
` +
        sh.vertexShader
          .replace("#include <begin_vertex>", "vec3 transformed = uTrailPos[int(aCorner + 0.5)];")
          .replace("#include <color_vertex>", "vColor = uTrailCol[int(aCorner + 0.5)];");
    };
    trailMaterial.customProgramCacheKey = () => `walker-trail-${n}`;
    const mesh = new Mesh(tg, trailMaterial);
    mesh.frustumCulled = false;
    mesh.renderOrder = 4;
    mesh.visible = false;
    mesh.userData.noPick = true;
    // Light, not a solid: left out of the walker view's ambient occlusion (street/effects.ts).
    mesh.userData.noAO = true;
    mesh.raycast = () => {};
    this.root.add(mesh);
    this.trail = { mesh, pos: tp, col: tc, life: 0 };
  }

  dispose(): void {
    this.disposed = true;
    this.undress();
    if (this.body) {
      this.body.mixer.stopAllAction();
      this.root.remove(this.body.root);
    }
    this.scooter?.dispose();
    for (const m of [this.pen, this.trail?.mesh]) {
      m?.geometry.dispose();
      (m?.material as Material | undefined)?.dispose();
    }
    (this.ring.geometry as BufferGeometry).dispose();
    (this.ring.material as Material).dispose();
    this.xrayMaterial.dispose();
  }

  private async load(): Promise<void> {
    const build = await import("./figureBuild.ts");
    const m = await build.loadBody();
    if (this.disposed) return;
    this.build = build;
    // A copy of the body with its own skeleton, sharing the geometry.
    const root = build.clone(m.scene);
    let mesh: SkinnedMesh | undefined;
    root.traverse((o) => {
      o.userData.noPick = true;
      if ((o as SkinnedMesh).isSkinnedMesh) mesh = o as SkinnedMesh;
    });
    if (!mesh) throw new Error("walker.glb has no skinned mesh");
    mesh.castShadow = true;
    // The bind pose's bounds are not the walk's; the figure is small, so it is never culled.
    mesh.frustumCulled = false;
    const mixer = new AnimationMixer(root);
    const action = (name: string) => {
      const clip = m.clips.find((c) => c.name === name);
      if (!clip) throw new Error(`walker.glb has no ${name} animation`);
      const a = mixer.clipAction(clip);
      a.play();
      return a;
    };
    const bones = new Map<string, Bone>();
    root.traverse((o) => {
      if ((o as Bone).isBone) bones.set(o.name, o as Bone);
    });
    const bone = (name: string) => {
      const b = bones.get(name);
      if (!b) throw new Error(`walker.glb has no bone ${name}`);
      return b;
    };
    // Narrower shoulders. The clips only turn bones, so where a joint sits stays as set here.
    for (const side of ["Left", "Right"]) bone(`${side}Arm`).position.multiplyScalar(SHOULDERS);
    // Smaller hands; the clips have no scale either.
    for (const side of ["Left", "Right"]) bone(`${side}Hand`).scale.setScalar(HANDS);
    const body = { root, mesh, mixer, idle: action("idle"), walk: action("walk"), run: action("run"), bone };
    this.seat.add(root);
    const stand = mixer.clipAction(this.standing(body));
    stand.play();
    this.body = { ...body, stand };
    const xray = new SkinnedMesh(mesh.geometry, this.xrayMaterial);
    xray.position.copy(mesh.position);
    xray.quaternion.copy(mesh.quaternion);
    xray.scale.copy(mesh.scale);
    xray.bind(mesh.skeleton, mesh.bindMatrix);
    xray.frustumCulled = false;
    xray.renderOrder = 3;
    xray.userData.noPick = true;
    mesh.parent?.add(xray);
    this.xray = xray;
    this.dress();
    this.changed = true;
  }

  /**
   * The figure standing at ease. The idle clip stands as the model was made: knees bent, one foot
   * back, the hips and the shoulders turned, the back bowed, the arms held out and the hands open.
   * This turns the hips and the shoulders to face ahead, the spine upright, the legs straight under
   * the hips and the arms down by the sides (STAND), points the feet ahead, keeps them flat as they
   * were, curls the fingers, and raises the hips so the feet stay on the ground. It is a clip of its
   * own, the turns of each bone from the idle's first frame, which the mixer adds to the idle's
   * breathing as the figure comes to a stop. (Turning the bones after the mixer instead would add
   * the turns up, frame after frame, on any bone the idle holds still: the mixer only sets a bone
   * whose value has changed.)
   */
  private standing(b: Omit<Body, "stand">): AnimationClip {
    b.idle.time = 0;
    b.idle.setEffectiveWeight(1);
    b.walk.setEffectiveWeight(0);
    b.run.setEffectiveWeight(0);
    b.mixer.update(0);
    this.root.updateMatrixWorld(true);
    const sides = ["Left", "Right"] as const;
    const fingers = sides.flatMap((s) => [...CURL.map((_, k) => `${s}HandIndex${k + 1}`), `${s}HandThumb1`]);
    const bones = [...new Set(["Hips", ...STAND.map(([n]) => n), "LeftFoot", "RightFoot", ...fingers])].map(b.bone);
    const idle = bones.map((x) => x.quaternion.clone());
    const local = (name: string) => this.root.worldToLocal(b.bone(name).getWorldPosition(new Vector3()));
    // The feet as flat as they were, pointing ahead and a little out.
    const toes = sides.map((s) => {
      const toe = local(`${s}ToeBase`).sub(local(`${s}Foot`));
      const flat = Math.hypot(toe.x, toe.z);
      const out = (s === "Left" ? -1 : 1) * TOES_OUT;
      return new Vector3(Math.sin(out) * flat, toe.y, -Math.cos(out) * flat);
    });
    const v = new Vector3();
    const ankles = () => sides.reduce((y, s) => y + b.bone(`${s}Foot`).getWorldPosition(v).y / 2, 0);
    const before = ankles();
    // The idle stands a little turned, the hips one way and the shoulders another: both face ahead.
    square(b.bone("Hips"), b.bone("LeftUpLeg"), b.bone("RightUpLeg"), this.root);
    for (const [name, child, dir] of STAND) {
      aim(b.bone(name), b.bone(child), this.root, v.set(...dir));
      if (name === "Spine2") square(b.bone("Spine2"), b.bone("LeftArm"), b.bone("RightArm"), this.root);
    }
    sides.forEach((s, i) => aim(b.bone(`${s}Foot`), b.bone(`${s}ToeBase`), this.root, toes[i]!));
    // The hands relaxed: the fingers curled towards the palm, which faces the thigh, and the thumb in.
    for (const s of sides) {
      const hand = local(`${s}Hand`);
      const down = local(`${s}HandIndex1`).sub(hand).normalize();
      const thumb = local(`${s}HandThumb1`).sub(hand);
      const palm = new Vector3().crossVectors(down, thumb).normalize();
      if (palm.x * (s === "Left" ? 1 : -1) < 0) palm.negate();
      CURL.forEach((angle, k) => {
        const dir = down.clone().multiplyScalar(Math.cos(angle)).addScaledVector(palm, Math.sin(angle));
        aim(b.bone(`${s}HandIndex${k + 1}`), b.bone(`${s}HandIndex${k + 2}`), this.root, dir);
      });
      const tuck = thumb.normalize().lerp(down, THUMB_IN).addScaledVector(palm, 0.25);
      aim(b.bone(`${s}HandThumb1`), b.bone(`${s}HandThumb2`), this.root, tuck);
    }
    const hips = b.bone("Hips");
    const at = hips.getWorldPosition(new Vector3());
    const lift = hips.parent!.worldToLocal(at.clone().setY(at.y + before - ankles())).sub(hips.parent!.worldToLocal(at.clone()));
    const tracks = [
      ...bones.map((x, i) => new QuaternionKeyframeTrack(`${x.name}.quaternion`, [0], idle[i]!.clone().invert().multiply(x.quaternion).toArray())),
      new VectorKeyframeTrack(`${hips.name}.position`, [0], lift.toArray()),
    ];
    return new AnimationClip("stand", -1, tracks, AdditiveAnimationBlendMode);
  }

  /** Takes the gear off. Its shapes and paint are every figure's, and stay. */
  private undress(): void {
    const g = this.gear;
    if (!g) return;
    for (const part of [g.head, g.backpack, g.umbrella, g.blot]) part.removeFromParent();
    this.gear = undefined;
  }

  /** Paints the body and fixes the hair, the backpack and the umbrella to it. */
  private dress(): void {
    const b = this.body;
    const build = this.build;
    if (!b || !build) return;
    this.undress();
    // Gear is fitted to the figure standing at ease, its head shown and its hands down, then fixed
    // to a bone.
    const stance = this.stance;
    const open = this.umbrellaOpen;
    this.umbrellaOpen = false;
    b.bone("Head").scale.setScalar(1);
    this.last = undefined;
    this.dressing = true;
    this.pose(0, 0, 0);
    this.dressing = false;
    this.umbrellaOpen = open;
    this.root.updateMatrixWorld(true);
    const gear = build.makeGear(this.root, b.mesh, (name) => this.root.worldToLocal(b.bone(name).getWorldPosition(new Vector3())));
    this.gear = gear;
    b.mesh.material = gear.skin;
    for (const [part, to] of [[gear.head, "Head"], [gear.backpack, "Spine2"]] as const) {
      this.root.add(part);
      part.updateMatrixWorld(true);
      b.bone(to).attach(part);
    }
    this.root.add(gear.blot);
    // The thigh's length, for a crouch in the game; and the highlighter it holds there.
    this.legLength = local3(this.root, b.bone("RightUpLeg")).distanceTo(local3(this.root, b.bone("RightLeg")));
    this.penFit = this.fitPen(b);
    if (this.penOn) this.makePen();
    // On the scooter the body stands on its deck.
    b.root.position.y = this.ride === "scooter" ? DECK : 0;
    // The umbrella stays upright over the right hand; holdUmbrella moves it there.
    this.umbrella.add(gear.umbrella);
    this.umbrella.visible = this.umbrellaOpen && this.headVisible;
    this.showHead();
    // Every part of the figure marks where it is seen, so that its x-ray stays off it.
    this.root.traverse((part) => {
      if (!(part instanceof Mesh) || part === this.ring || part === gear.blot || part === this.xray || part === this.trail?.mesh) return;
      for (const m of [part.material].flat() as Material[]) {
        m.stencilWrite = true;
        m.stencilRef = 1;
        m.stencilZPass = ReplaceStencilOp;
      }
    });
    // The legs' measures and the clips' steps, last: it runs the clips through.
    this.measureLegs(b);
    // Back to the pose it had.
    this.last = undefined;
    this.pose(stance.moving, stance.speed, stance.t);
  }

  /**
   * The legs' measures standing at ease, for their own steps (gaitLegs); and where in the walk's and
   * the run's cycles the left foot comes down (furthest ahead), so that the clips keep in step with them.
   */
  private measureLegs(b: Body): void {
    const at = (n: string) => local3(this.root, b.bone(n));
    const hip = at("LeftUpLeg");
    const knee = at("LeftLeg");
    const ankle = at("LeftFoot");
    const toe = at("LeftToeBase");
    this.legs = {
      thigh: hip.distanceTo(knee),
      shin: knee.distanceTo(ankle),
      hipY: hip.y,
      ankleY: ankle.y,
      toeAlong: Math.hypot(toe.x - ankle.x, toe.z - ankle.z),
      toeDown: toe.y - ankle.y,
    };
    const down = (clip: AnimationAction) => {
      for (const a of [b.idle, b.walk, b.run, b.stand]) a.setEffectiveWeight(a === clip ? 1 : 0);
      let best = 0;
      let most = Infinity;
      for (let k = 0; k < 32; k++) {
        clip.time = (k / 32) * clip.getClip().duration;
        b.mixer.update(0);
        this.root.updateMatrixWorld(true);
        const z = at("LeftFoot").z;
        if (z < most) ((most = z), (best = k / 32));
      }
      return best;
    };
    this.walkDown = down(b.walk);
    this.runDown = down(b.run);
  }

  /** The head shows, or shrinks to nothing, for the view from the eyes. */
  private showHead(): void {
    const b = this.body;
    if (!b) return;
    b.bone("Head").scale.setScalar(this.headVisible ? 1 : 1e-3);
    // Seen through its own eyes, the walker has no shape to show through anything.
    if (this.xray) this.xray.visible = this.headVisible;
  }

  /**
   * On the scooter: a foot before the other on the deck, and the arms reaching down and forward to
   * the grips, the elbows bent out a little. Remembers the bones as the mixer left them first.
   */
  private holdBars(b: Body): void {
    const names = ["LeftArm", "LeftForeArm", "RightArm", "RightForeArm", ...RIDE_LEGS.map(([n]) => n)];
    this.riding = names.map((n) => [b.bone(n), b.bone(n).quaternion.clone()]);
    this.root.updateMatrixWorld(true);
    const seat = this.seat;
    const local = (name: string) => seat.worldToLocal(b.bone(name).getWorldPosition(new Vector3()));
    for (const [bone, child, dir] of RIDE_LEGS) aim(b.bone(bone), b.bone(child), seat, new Vector3(...dir));
    for (const [s, side] of [
      ["Left", -1],
      ["Right", 1],
    ] as const) {
      const grip = new Vector3(side * GRIP.x, GRIP.y, GRIP.z);
      const reach = grip.clone().sub(local(`${s}Arm`)).normalize();
      aim(b.bone(`${s}Arm`), b.bone(`${s}ForeArm`), seat, reach.add(new Vector3(side * 0.28, 0.05, 0.12)).normalize());
      aim(b.bone(`${s}ForeArm`), b.bone(`${s}Hand`), seat, grip.clone().sub(local(`${s}ForeArm`)));
    }
  }

  /** Raises the right forearm and puts the umbrella's handle in that hand. */
  private holdUmbrella(b: Body): void {
    this.root.updateMatrixWorld(true);
    aim(b.bone("RightArm"), b.bone("RightForeArm"), this.root, new Vector3(0.3, -0.85, -0.35));
    aim(b.bone("RightForeArm"), b.bone("RightHand"), this.root, new Vector3(0.05, 0.85, -0.45));
    const hand = this.root.worldToLocal(b.bone("RightHand").getWorldPosition(new Vector3()));
    this.umbrella.position.copy(hand);
  }
}

/** Each leg's bones, by name, and its side (-1 left). */
const LEGS = (["Left", "Right"] as const).map((side) => ({ s: side === "Left" ? -1 : 1, up: `${side}UpLeg`, knee: `${side}Leg`, ankle: `${side}Foot`, toe: `${side}ToeBase` }));
const _foot = { along: 0, up: 0, down: true };
const LEG_L = { up: "LeftUpLeg", knee: "LeftLeg" } as const;
const LEG_R = { up: "RightUpLeg", knee: "RightLeg" } as const;
const _takeoff = { push: "L" as "L" | "R", ahead: 0 };
const _h = new Vector3();
const _ft = new Vector3();
const _d = new Vector3();
const _pole = new Vector3();
const _k = new Vector3();
const _e = new Vector3();
const _kd = new Vector3();

/** 0 to 1, eased at both ends, for `k` from 0 to 1. */
function smooth(k: number): number {
  const x = Math.max(0, Math.min(1, k));
  return x * x * (3 - 2 * x);
}

/** An angle, radians, as the same turn between -pi and pi. */
function wrapPi(a: number): number {
  return a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
}

const _up = new Vector3();
const _right = new Vector3();
const _v = new Vector3();
const _leg = new Vector3();
const _q = new Quaternion();
const _qa = new Quaternion();
const _qb = new Quaternion();

/** A bone's place in `frame`'s axes. */
function local3(frame: Object3D, bone: Bone): Vector3 {
  return frame.worldToLocal(bone.getWorldPosition(new Vector3()));
}

/** Turns `bone` towards pointing at `child` along `dir` (in `frame`'s axes), `k` of the way from where it is. */
function limb(bone: Bone, child: Bone, frame: Object3D, dir: Vector3 | readonly number[], k: number): void {
  _qa.copy(bone.quaternion);
  if (dir instanceof Vector3) aim(bone, child, frame, dir);
  else aim(bone, child, frame, _v.set(dir[0]!, dir[1]!, dir[2]!));
  _qb.copy(bone.quaternion);
  bone.quaternion.copy(_qa).slerp(_qb, k);
  bone.updateMatrixWorld(true);
}

const tmp = { from: new Vector3(), to: new Vector3(), dir: new Vector3(), want: new Vector3(), q: new Quaternion(), world: new Quaternion(), parent: new Quaternion() };

/** Turns `bone` so that the way to `child` points along `dir`, given in `frame`'s axes. */
function aim(bone: Bone, child: Bone, frame: Object3D, dir: Vector3): void {
  const { from, to, want, q } = tmp;
  bone.getWorldPosition(from);
  child.getWorldPosition(to);
  tmp.dir.subVectors(to, from).normalize();
  want.copy(dir).transformDirection(frame.matrixWorld);
  turn(bone, q.setFromUnitVectors(tmp.dir, want));
}

/**
 * Turns `bone` about `frame`'s up so that, seen from above, the way from `left` to `right` runs
 * along `frame`'s x axis: a body whose left and right those are faces straight ahead.
 */
function square(bone: Bone, left: Bone, right: Bone, frame: Object3D): void {
  const a = frame.worldToLocal(left.getWorldPosition(new Vector3()));
  const b = frame.worldToLocal(right.getWorldPosition(new Vector3()));
  const up = new Vector3(0, 1, 0).transformDirection(frame.matrixWorld);
  turn(bone, tmp.q.setFromAxisAngle(up, Math.atan2(b.z - a.z, b.x - a.x)));
}

/** Turns `bone` by `q`, a turn in the world. */
function turn(bone: Bone, q: Quaternion): void {
  const { world, parent } = tmp;
  bone.getWorldQuaternion(world);
  world.premultiply(q);
  if (bone.parent) bone.parent.getWorldQuaternion(parent);
  else parent.identity();
  bone.quaternion.copy(parent.invert().multiply(world));
  bone.updateMatrixWorld(true);
}
