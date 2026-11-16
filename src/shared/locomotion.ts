// How the walker moves in Study Quest, as an action game moves its hero: the stick (or the keys, or a
// pad) asks for a way to go relative to the camera, and the walker gets there with weight. Not
// locked on, it turns to the way it goes at a limited rate, leans into the turn, speeds up and slows
// down over a moment, and plants and pivots for a sharp reversal instead of spinning on the spot.
// Locked on (a foe locked on to, or the Final Exam), it faces its foe and steps the way it is asked:
// forward, a side-step, a backpedal, or between; held to one side, it goes round the foe on a circle.
// The legs' gait is worked out here too, so that the stride and its cadence match the speed over
// the ground and a planted foot stays put. Pure numbers, so that they can be tested without a browser.
//
// Bearings are degrees clockwise from north; a stick is x to the right of the screen and y up it.

export const LOCO = {
  /** Metres a second each second the walker speeds up, and slows down when let go or asked less. */
  accel: 14,
  decel: 18,
  /** Degrees a second it turns to the way it goes: standing, and at a run. */
  turnStill: 900,
  turnRun: 480,
  /** Degrees off its way beyond which, going faster than `pivotFrom`, it plants and pivots. */
  pivotAngle: 125,
  pivotFrom: 1.6,
  /** Seconds a pivot takes, the rate it turns at meanwhile, and how fast it slows into it. */
  pivotTime: 0.2,
  pivotTurn: 1100,
  pivotDecel: 30,
  /** Locked on: degrees a second it turns to face its foe. */
  faceRate: 720,
  /** Locked on: the share of its pace it keeps side-stepping and backpedalling. */
  strafeScale: 0.85,
  backScale: 0.7,
  /** Degrees the stick must swing before the camera's bearing it is read against is taken afresh. */
  relatch: 30,
  /** Within this of the foe's middle, metres, holding to one side does not keep the walker on its circle. */
  circleFrom: 1.5,
} as const;

/** Degrees from `a` to `b` the short way round, -180 to 180. */
export function turnBetween(a: number, b: number): number {
  return ((((b - a) % 360) + 540) % 360) - 180;
}

export function wrap360(a: number): number {
  return ((a % 360) + 360) % 360;
}

/** `from` turned towards `to` by at most `max` degrees. */
export function turnToward(from: number, to: number, max: number): number {
  const d = turnBetween(from, to);
  return wrap360(from + Math.max(-max, Math.min(max, d)));
}

/**
 * The bearing a stick asks for, read against the bearing the camera looks along (`view`): up the
 * screen is the way the camera looks, right is a quarter turn clockwise of it. And how far it is
 * pushed, 0 to 1. Undefined bearing when it is let go.
 */
export function stickBearing(x: number, y: number, view: number, out: { bearing?: number; amount: number } = { amount: 0 }): { bearing?: number; amount: number } {
  const amount = Math.min(1, Math.hypot(x, y));
  if (amount < 1e-3) {
    out.bearing = undefined;
    out.amount = 0;
    return out;
  }
  out.bearing = wrap360(view + (Math.atan2(x, y) * 180) / Math.PI);
  out.amount = amount;
  return out;
}

/**
 * The camera's bearing the stick is read against, held while the stick is held the same way: so that
 * a camera that swings round behind the walker does not swing the way it goes with it, and "left"
 * held goes on to the left it meant. Taken afresh when the stick is let go and pushed again, or
 * swung more than LOCO.relatch degrees.
 */
export interface Latch {
  on: boolean;
  /** The camera's bearing when it was taken, and the stick's own angle then. */
  view: number;
  stick: number;
}

export function newLatch(): Latch {
  return { on: false, view: 0, stick: 0 };
}

/** The bearing to read the stick (x, y) against, the camera now looking along `view`. */
export function latchView(l: Latch, x: number, y: number, view: number): number {
  if (Math.hypot(x, y) < 1e-3) {
    l.on = false;
    return view;
  }
  const angle = (Math.atan2(x, y) * 180) / Math.PI;
  if (!l.on || Math.abs(turnBetween(l.stick, angle)) > LOCO.relatch) {
    l.on = true;
    l.view = view;
    l.stick = angle;
  }
  return l.view;
}

/**
 * Shares of a blend of four ways of stepping, for a way of going `rel` degrees clockwise of the way
 * the walker faces: forward, back, left, right. Each diagonal is half of its two; they add up to 1.
 */
export function strafeWeights(rel: number, out = { f: 0, b: 0, l: 0, r: 0 }): { f: number; b: number; l: number; r: number } {
  const a = (rel * Math.PI) / 180;
  const fx = Math.cos(a);
  const sx = Math.sin(a);
  // Shares along each axis, with the axes' shares adding up to 1 (|cos| + |sin| normalised).
  const n = Math.abs(fx) + Math.abs(sx) || 1;
  out.f = Math.max(0, fx) / n;
  out.b = Math.max(0, -fx) / n;
  out.r = Math.max(0, sx) / n;
  out.l = Math.max(0, -sx) / n;
  return out;
}

/** Pace kept stepping `rel` degrees off the way it faces, locked on: all of it forward, less to the side and back. */
export function strafePace(rel: number): number {
  const w = strafeWeights(rel, _w);
  return w.f + (w.l + w.r) * LOCO.strafeScale + w.b * LOCO.backScale;
}
const _w = { f: 0, b: 0, l: 0, r: 0 };

/** What the walker's legs carry from one moment to the next. */
export interface Motion {
  /** Metres a second east and north. */
  vx: number;
  vy: number;
  /** The way it faces. */
  heading: number;
  /** Seconds left of a pivot. */
  pivot: number;
  /** The bearing it pivots to. */
  pivotTo: number;
  // The jump (stepJump):
  /** The feet's height, metres above sea level, and how fast it rises (negative: falls). */
  y: number;
  vy3: number;
  /** Off the ground: jumping, or gone over an edge. */
  air: boolean;
  /** Whether it left the ground by a jump (no second jump in the air); and seconds since it was last on the ground. */
  jumped: boolean;
  since: number;
  /** Seconds left of a press of the jump kept for when it can jump (the buffer), and of the crouch before take-off. */
  buffer: number;
  windup: number;
  /** The highest its feet were in this time off the ground, for how hard it lands. */
  top: number;
  /** Seconds since it last landed, and how hard that was: 0 a hop, 1 a long fall. */
  land: number;
  hard: number;
  /** Times its pace kept from a jump at a run (the burst): JUMP.boost in the air, easing back to 1 after landing. */
  boost: number;
  /** Jumps and landings so far, for whoever shows them. */
  jumps: number;
  landings: number;
  /** The kind of the jump under way or last made (jumpKind): a hop, a step-up, a running leap, a side leap or a back hop. */
  kind: JumpKind;
}

export function newMotion(heading = 0, y = 0): Motion {
  return { vx: 0, vy: 0, heading, pivot: 0, pivotTo: heading, y, vy3: 0, air: false, jumped: false, since: 0, buffer: 0, windup: 0, top: y, land: 9, hard: 0, boost: 1, jumps: 0, landings: 0, kind: "hop" };
}

/**
 * What it is asked: `want`, the bearing to go along (none: stop), at `speed` metres a second; and,
 * locked on, `face`, the bearing to its foe.
 */
export interface Ask {
  want?: number;
  speed: number;
  face?: number;
}

/**
 * Moves `m` on by `dt` seconds of what it is asked. Returns metres a second over the ground. In the
 * air it keeps its way and pace, and steers and speeds up or slows only a little (JUMP.air); the
 * burst of a jump at a run (m.boost) raises the pace it goes to.
 */
export function stepMotion(m: Motion, ask: Ask, dt: number): number {
  let speed = Math.hypot(m.vx, m.vy);
  const air = m.air || m.windup > 0;
  const accel = LOCO.accel * (air ? JUMP.airAccel : 1);
  const decel = LOCO.decel * (air ? JUMP.airDecel : 1);
  const asked = ask.speed * m.boost;
  if (ask.face !== undefined) {
    // Locked on: facing the foe, the legs go any way at all; in the air too.
    m.pivot = 0;
    m.heading = turnToward(m.heading, ask.face, LOCO.faceRate * dt);
    let tx = 0;
    let ty = 0;
    if (ask.want !== undefined && ask.speed > 0) {
      const s = asked * strafePace(turnBetween(m.heading, ask.want));
      const r = (ask.want * Math.PI) / 180;
      tx = Math.sin(r) * s;
      ty = Math.cos(r) * s;
    }
    const dx = tx - m.vx;
    const dy = ty - m.vy;
    const dv = Math.hypot(dx, dy);
    // Speeding up when the new way has more pace along the old, slowing down otherwise.
    const rate = tx * m.vx + ty * m.vy >= m.vx * m.vx + m.vy * m.vy ? accel : decel;
    const k = dv > rate * dt ? (rate * dt) / dv : 1;
    m.vx += dx * k;
    m.vy += dy * k;
    return Math.hypot(m.vx, m.vy);
  }
  // Not locked on: it goes the way it faces, turning to the way it is asked.
  if (air) {
    // In the air: no pivot, a slow turn, and its pace mostly kept.
    if (ask.want !== undefined && ask.speed > 0) {
      m.heading = turnToward(m.heading, ask.want, LOCO.turnRun * JUMP.airTurn * dt);
      speed = asked > speed ? Math.min(asked, speed + accel * dt) : Math.max(asked, speed - decel * dt);
    } else speed = Math.max(0, speed - decel * dt);
  } else if (m.pivot > 0) {
    m.pivot = Math.max(0, m.pivot - dt);
    speed = Math.max(0, speed - LOCO.pivotDecel * dt);
    m.heading = turnToward(m.heading, m.pivotTo, LOCO.pivotTurn * dt);
    if (ask.want !== undefined) m.pivotTo = ask.want;
  } else if (ask.want !== undefined && ask.speed > 0) {
    const off = Math.abs(turnBetween(m.heading, ask.want));
    if (off > LOCO.pivotAngle && speed > LOCO.pivotFrom) {
      // A sharp reversal at speed: it plants, turns on the planted foot, and goes.
      m.pivot = LOCO.pivotTime;
      m.pivotTo = ask.want;
      speed = Math.max(0, speed - LOCO.pivotDecel * dt);
      m.heading = turnToward(m.heading, ask.want, LOCO.pivotTurn * dt);
    } else {
      const k = Math.min(1, speed / 3.5);
      m.heading = turnToward(m.heading, ask.want, (LOCO.turnStill + (LOCO.turnRun - LOCO.turnStill) * k) * dt);
      // It does not set off the wrong way: well off the way it is asked, it turns before it goes.
      const left = Math.abs(turnBetween(m.heading, ask.want));
      const keep = Math.max(0, Math.min(1, (Math.cos((left * Math.PI) / 180) + 0.3) / 1.0));
      const want = asked * keep;
      speed = want > speed ? Math.min(want, speed + accel * dt) : Math.max(want, speed - decel * dt);
    }
  } else speed = Math.max(0, speed - decel * dt);
  const r = (m.heading * Math.PI) / 180;
  m.vx = Math.sin(r) * speed;
  m.vy = Math.cos(r) * speed;
  return speed;
}

/**
 * Locked on and going round its foe: where the walker should stand after a step from `from` to `to`
 * (metres east and north) about a foe at `centre`, so that what the step had of going round adds
 * nothing to how far it is from the foe and a side held goes round on a circle, not out of it. Only
 * what it had of going in or out changes that. Writes into `out`.
 */
export function keepCircle(from: readonly [number, number], to: readonly [number, number], centre: readonly [number, number], out: [number, number]): [number, number] {
  const r0 = Math.hypot(from[0] - centre[0], from[1] - centre[1]);
  const r1 = Math.hypot(to[0] - centre[0], to[1] - centre[1]);
  if (r0 < LOCO.circleFrom || r1 < 1e-6) {
    out[0] = to[0];
    out[1] = to[1];
    return out;
  }
  // The step's share along the line from the walker to the foe.
  const ux = (centre[0] - from[0]) / r0;
  const uy = (centre[1] - from[1]) / r0;
  const radial = (to[0] - from[0]) * ux + (to[1] - from[1]) * uy;
  const want = Math.max(0, r0 - radial);
  out[0] = centre[0] + ((to[0] - centre[0]) / r1) * want;
  out[1] = centre[1] + ((to[1] - centre[1]) / r1) * want;
  return out;
}

// ---------------------------------------------------------------------------------------------
// The jump
// ---------------------------------------------------------------------------------------------

/**
 * The jump. Its feet rise `apex` metres in `rise` seconds and fall `fall` times as hard as they
 * rose: a quick rise and a faster fall, with weight. A press is kept for `buffer` seconds until it can
 * jump (just before landing, or at the end of a blow); a walker gone over an edge can still jump for
 * `coyote` seconds. It crouches for `windup` seconds before it leaves the ground. In the air it steers
 * `airTurn` and speeds up `airAccel`, and slows `airDecel`, of what it does on the ground. A jump at a
 * run (from `boostFrom` of its pace with the stick all the way) goes `boost` times as fast, never more,
 * however many jumps follow each other, easing back over `boostEase` seconds after landing. A fall of
 * more than `hardFrom` metres lands hard. An edge more than `edge` metres down is gone over, not walked
 * down.
 */
export const JUMP = {
  apex: 0.62,
  rise: 0.3,
  fall: 1.7,
  buffer: 0.12,
  coyote: 0.1,
  windup: 0.05,
  airTurn: 0.4,
  airAccel: 0.35,
  airDecel: 0.2,
  boost: 1.35,
  boostFrom: 0.8,
  boostEase: 0.4,
  hardFrom: 1.2,
  edge: 0.3,
} as const;

/** Metres a second the feet leave the ground at, and the pull down on the way up and on the way down. */
export const JUMP_SPEED = (2 * JUMP.apex) / JUMP.rise;
export const RISE_PULL = JUMP_SPEED / JUMP.rise;
export const FALL_PULL = RISE_PULL * JUMP.fall;

/**
 * How a jump leaves the ground, by how fast the walker goes and which way against the way it faces
 * (`rel`, degrees clockwise): standing (under `stepFrom` m/s), a hop off both feet after a short
 * crouch; at a walk, a step-up off one foot; at a run (from `leapFrom` m/s), a running leap off one
 * foot; locked on and going to the side, a side leap (a crossover hop); backpedalling, a back hop.
 * Only the hop crouches first: moving, it leaves the ground on the press.
 */
export type JumpKind = "hop" | "step" | "leap" | "side" | "back";
export const LEAP = { stepFrom: 0.5, leapFrom: 2.2, sideFrom: 45, backFrom: 135 } as const;

export function jumpKind(speed: number, rel: number): JumpKind {
  if (speed < LEAP.stepFrom) return "hop";
  const off = Math.abs(rel);
  if (off >= LEAP.backFrom) return "back";
  if (off >= LEAP.sideFrom) return "side";
  return speed >= LEAP.leapFrom ? "leap" : "step";
}

/** Whether a kind of jump leaves the ground off one foot, carrying the stride (the step-up and the leap). */
export function oneFoot(kind: JumpKind): boolean {
  return kind === "step" || kind === "leap";
}

/**
 * The foot a one-foot jump pushes off, for a jump at `phase` (0-1) of the gait's cycle, whose left
 * foot comes down at 0 and right at 0.5 and each stays down `duty` of it: the foot on the ground;
 * with both down (at a walk), the front one, just put down, which takes the weight and springs; and
 * between steps, the one about to come down, at once and with no wait. And how far round the cycle
 * (at least LAND_AHEAD of it) to the other foot's coming down, which is where the jump lands: the
 * stride goes on through the air.
 */
export function takeoffFoot(phase: number, duty: number, out = { push: "L" as "L" | "R", ahead: 0 }): { push: "L" | "R"; ahead: number } {
  const p = ((phase % 1) + 1) % 1;
  const sinceL = p;
  const sinceR = (p + 0.5) % 1;
  const downL = sinceL < duty;
  const downR = sinceR < duty;
  if (downL && downR) out.push = sinceL < sinceR ? "L" : "R";
  else if (downL) out.push = "L";
  else if (downR) out.push = "R";
  else out.push = 1 - sinceL < 1 - sinceR ? "L" : "R";
  // The lead foot (the other) comes down at 0 (left) or 0.5 (right).
  const lead = out.push === "L" ? 0.5 : 0;
  let ahead = (((lead - p) % 1) + 1) % 1;
  if (ahead < LAND_AHEAD) ahead += 1;
  out.ahead = ahead;
  return out;
}
/** The least share of a cycle a jump's air carries the stride on, so that it lands on the next stride, not this one. */
const LAND_AHEAD = 0.15;

/**
 * Seconds left in the air for feet `z` metres over level ground, rising at `vz` metres a second
 * (negative: falling), under the jump's pulls. 0 on the ground.
 */
export function airTimeLeft(z: number, vz: number): number {
  if (z <= 0 && vz <= 0) return 0;
  if (vz > 0) {
    // Up to the top, then down from it.
    const top = z + (vz * vz) / (2 * RISE_PULL);
    return vz / RISE_PULL + Math.sqrt((2 * top) / FALL_PULL);
  }
  // Falling: z = top + vz t - g t^2 / 2 reaches 0.
  const g = FALL_PULL;
  return (vz + Math.sqrt(vz * vz + 2 * g * Math.max(0, z))) / g;
}

/**
 * The gait's cycle carried on through the air of a one-foot jump: from `at` (cycles, counted on, not
 * wrapped) towards `land`, the cycle at which the lead foot comes down, at the pace that gets there
 * as the feet do (`left` seconds of air). Returns the cycle after `dt` seconds; never past `land`.
 */
export function airCycle(at: number, land: number, left: number, dt: number): number {
  if (at >= land) return land;
  if (left <= dt) return land;
  return Math.min(land, at + ((land - at) * dt) / left);
}

/** A press of the jump: kept for JUMP.buffer seconds until it can jump. */
export function pressJump(m: Motion): void {
  m.buffer = JUMP.buffer;
}

/**
 * The jump and the fall for `dt` seconds, over ground `ground` metres above sea level where the
 * walker is now; `can` says whether it may jump now (not in a blow or a dodge), `top` is metres a
 * second with the stick all the way, for the burst. Returns true in the step it lands.
 */
export function stepJump(m: Motion, dt: number, ground: number, can: boolean, top: number): boolean {
  let landed = false;
  if (!m.air) {
    if (m.y - ground > JUMP.edge && m.windup <= 0) {
      // Over an edge: it falls, and can still jump for a moment.
      m.air = true;
      m.jumped = false;
      m.vy3 = 0;
      m.top = m.y;
    } else {
      m.y = ground;
      m.since = 0;
    }
  }
  if (m.air) m.since += dt;
  // A press kept until it can jump: on the ground, or just after going over an edge.
  let launch = false;
  if (m.buffer > 0 && m.windup <= 0 && can && (!m.air || (!m.jumped && m.since <= JUMP.coyote))) {
    m.buffer = 0;
    // Its kind, from how fast it goes and which way: only a hop from standing crouches first.
    const sp = Math.hypot(m.vx, m.vy);
    const way = sp > 1e-3 ? (Math.atan2(m.vx, m.vy) * 180) / Math.PI : m.heading;
    m.kind = jumpKind(sp, turnBetween(m.heading, way));
    if (m.kind === "hop") m.windup = JUMP.windup;
    else launch = true;
  }
  m.buffer = Math.max(0, m.buffer - dt);
  if (m.windup > 0) {
    m.windup -= dt;
    if (m.windup <= 0) launch = true;
  }
  if (launch) {
    m.windup = 0;
    // Off the ground: up at the jump's speed, and a jump at a run carries a burst of pace.
    m.air = true;
    m.jumped = true;
    m.vy3 = JUMP_SPEED;
    m.top = m.y;
    m.jumps++;
    const speed = Math.hypot(m.vx, m.vy);
    if (top > 0 && speed >= top * JUMP.boostFrom) {
      m.boost = JUMP.boost;
      const want = Math.min(speed * JUMP.boost, top * JUMP.boost);
      if (speed > 1e-6) {
        m.vx *= want / speed;
        m.vy *= want / speed;
      }
    }
  }
  if (m.air) {
    m.vy3 -= (m.vy3 > 0 ? RISE_PULL : FALL_PULL) * dt;
    m.y += m.vy3 * dt;
    m.top = Math.max(m.top, m.y);
    if (m.y <= ground && m.vy3 <= 0) {
      const fell = m.top - ground;
      m.y = ground;
      m.vy3 = 0;
      m.air = false;
      m.jumped = false;
      m.since = 0;
      m.land = 0;
      m.hard = Math.max(0, Math.min(1, (fell - JUMP.apex) / (JUMP.hardFrom - JUMP.apex)));
      m.landings++;
      landed = true;
    }
  } else m.land += dt;
  // The burst eases off once it is down, and never stacks.
  if (!m.air && m.windup <= 0 && m.boost > 1) m.boost = Math.max(1, m.boost - ((JUMP.boost - 1) / JUMP.boostEase) * dt);
  // Its pace over the ground held to the burst's cap.
  const cap = top * JUMP.boost;
  const sp = Math.hypot(m.vx, m.vy);
  if (top > 0 && sp > cap) {
    m.vx *= cap / sp;
    m.vy *= cap / sp;
  }
  return landed;
}

// ---------------------------------------------------------------------------------------------
// The gait
// ---------------------------------------------------------------------------------------------

/**
 * Metres a whole cycle of the legs (two steps) covers at `speed` metres a second: longer strides the
 * faster it goes, as people's are (1.4 m at an easy walk, 2.4 m at a run, as the figure's own walk
 * and run have them); shorter going to the side (`side`, 0-1) and back (`back`, 0-1), where people
 * take short, quick steps.
 */
export function strideLength(speed: number, side = 0, back = 0): number {
  const s = Math.max(0.6, Math.min(2.4, 0.8 + 0.45 * speed));
  return s * (1 - 0.4 * side - 0.3 * back);
}

/** Share of a cycle each foot is on the ground: most of it at a walk, under half at a run (when both are off it a moment). */
export function dutyFactor(speed: number): number {
  const k = Math.max(0, Math.min(1, (speed - 2.2) / 1.0));
  return 0.62 + (0.4 - 0.62) * k * k * (3 - 2 * k);
}

/** Cycles a second the legs go at: the speed over the stride, so that the feet keep up with the ground. */
export function cadence(speed: number, side = 0, back = 0): number {
  return speed / strideLength(speed, side, back);
}

/**
 * Where a foot is, `p` (0-1) of the way round its own cycle, which starts as it is put down: metres
 * along the way the walker goes from under its hip (ahead positive), and metres off the ground.
 * On the ground (p under the duty factor `duty`) it goes back at just the pace the body goes on, so
 * that seen from the ground it stays put; off it, it swings forward and up, and down again.
 */
export function footAt(p: number, stride: number, duty: number, lift: number, out = { along: 0, up: 0, down: true }): { along: number; up: number; down: boolean } {
  const half = (stride * duty) / 2;
  if (p < duty) {
    out.along = half - stride * p;
    out.up = 0;
    out.down = true;
  } else {
    const u = (p - duty) / (1 - duty);
    const e = u * u * (3 - 2 * u);
    out.along = -half + 2 * half * e;
    out.up = lift * Math.sin(Math.PI * u);
    out.down = false;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// The dodge and a blow taken
// ---------------------------------------------------------------------------------------------

export type DodgeWay = "F" | "B" | "L" | "R";

/**
 * Seconds under which a press of the dodge's key (Shift, or B on a pad) is a tap, the dodge, rather
 * than a hold, the run, as in Elden Ring: the dodge goes as the key is let go.
 */
export const SHIFT_TAP = 0.2;

/** Whether a press held `seconds`, with no other key meanwhile (`alone`), is a tap: the dodge. */
export function isShiftTap(seconds: number, alone: boolean): boolean {
  return alone && seconds < SHIFT_TAP;
}

/**
 * Which way the dodge reads as, for a dodge along `dir` by a walker facing `facing`: a forward roll,
 * a hop back, or a side-step to the left or the right.
 */
export function dodgeWay(dir: number, facing: number): DodgeWay {
  const rel = turnBetween(facing, dir);
  if (Math.abs(rel) <= 45) return "F";
  if (Math.abs(rel) >= 135) return "B";
  return rel > 0 ? "R" : "L";
}
