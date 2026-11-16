// How Study Quest's villains move: an idle with a mood of its own for each kind, a walk cycle that
// bobs, leans into the way it goes and squashes as it lands, an attack in three beats (it gathers
// itself, strikes fast, and is left open a moment), a recoil away from each blow, a stagger, a
// death, and the boss's change of phase. Pure numbers over the rules' state (shared/game.ts), kept
// per foe in a pool, so that drawing a crowd makes no garbage. game.ts turns the look into matrices.
import { FOES, FOE_TIME, type Foe, type FoeKind, type FoeMove, type FoeState } from "../shared/game.ts";

/** Seconds a blow's flash lasts: a glint at the edges, not a white-out. */
export const FLASH_TIME = 0.075;
/** Seconds of a foe's strike, from the moment its attack lands. */
export const LASH_TIME = 0.16;

/** What a foe looks like this frame, on top of where the rules put it. */
export interface FoeLook {
  /** Metres east, up and north from its place. */
  ox: number;
  oy: number;
  on: number;
  sx: number;
  sy: number;
  sz: number;
  /** Radians: forward (+) or back, its left side up (+) or down, and turned from the way it faces. */
  pitch: number;
  roll: number;
  yaw: number;
  /** 0 to 1: the blow's flash at its edges. */
  flash: number;
  /** 0 to 1: how much of it has broken up. */
  dissolve: number;
  /** Colour that glows at its edges: a warning, the boss's rage, the edges of what breaks up. */
  tr: number;
  tg: number;
  tb: number;
  /** Whether it is open to a blow and dazed: it recovers from an attack or staggers. */
  dazed: boolean;
  /** Whether a foot came down this frame, for a puff of dust. */
  step: boolean;
}

export function newLook(): FoeLook {
  return { ox: 0, oy: 0, on: 0, sx: 1, sy: 1, sz: 1, pitch: 0, roll: 0, yaw: 0, flash: 0, dissolve: 0, tr: 0, tg: 0, tb: 0, dazed: false, step: false };
}

/** The motion kept for one foe between frames. */
interface Anim {
  id: number;
  /** The frame it was last drawn in, so that the pool can take back those no longer drawn. */
  seen: number;
  px: number;
  pn: number;
  /** Metres a second it goes, east and north, smoothed. */
  vx: number;
  vn: number;
  /** Its walk cycle, radians, and the half step it last landed on. */
  walk: number;
  lastStep: number;
  /**
   * Springs, each its value and its speed: squash (+ flatter), recoil (metres east and north), and
   * tilt (pitch and roll). See SQ to TR.
   */
  sp: Float32Array;
  /** Seconds since the last blow, and how bright its flash is. */
  flash: number;
  flashK: number;
  /** The state it was in last frame, seconds in it, and seconds it was given. */
  state: FoeState;
  since: number;
  total: number;
  /** Seconds since its attack landed, and which. */
  lash: number;
  lashMove: FoeMove["type"] | "";
  /** The attack it showed, kept for the beats after the rules let go of it. */
  move: FoeMove["type"] | "";
}

function fresh(a: Anim, f: Foe): void {
  a.id = f.id;
  a.px = f.at[0];
  a.pn = f.at[1];
  a.vx = a.vn = 0;
  a.walk = f.id * 1.3;
  a.lastStep = 0;
  if (!a.sp) a.sp = new Float32Array(10);
  a.sp.fill(0);
  a.flash = 99;
  a.flashK = 0;
  a.state = f.state;
  a.since = 0;
  a.total = Math.max(1e-3, f.t);
  a.lash = 99;
  a.lashMove = "";
  a.move = "";
}

/** Where each spring's value is kept in Anim.sp; its speed is in the next. */
const SQ = 0;
const RX = 2;
const RN = 4;
const TP = 6;
const TR = 8;

/** Moves a spring on by `dt`, pulled back to 0: stiffness `k`, damping `c`. */
function spring(sp: Float32Array, i: number, k: number, c: number, dt: number): void {
  let x = sp[i]!;
  let v = sp[i + 1]!;
  // Small steps, so that a stiff spring keeps steady at a low frame rate.
  const n = Math.min(12, Math.max(1, Math.ceil(dt * 120)));
  const h = dt / n;
  for (let j = 0; j < n; j++) {
    v += (-k * x - c * v) * h;
    x += v * h;
  }
  sp[i] = x;
  sp[i + 1] = v;
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOut = (x: number) => 1 - (1 - x) * (1 - x) * (1 - x);
const smooth = (x: number) => x * x * (3 - 2 * x);
/** A quick rise and a slower fall over 0 to 1: a strike's punch. */
const punch = (x: number) => (x < 0.3 ? easeOut(x / 0.3) : 1 - smooth((x - 0.3) / 0.7));

/** How each kind walks: steps a second at its full speed, how high it bobs, and how far it leans in. */
const GAIT: Record<FoeKind, { rate: number; bob: number; lean: number; squash: number }> = {
  ddl: { rate: 2.6, bob: 0.22, lean: 0.16, squash: 0.1 },
  procrastination: { rate: 1.4, bob: 0.2, lean: 0.12, squash: 0.16 },
  distraction: { rate: 3.2, bob: 0.08, lean: 0.5, squash: 0.03 },
  plagiarism: { rate: 1.6, bob: 0.12, lean: 0.3, squash: 0.04 },
  anxiety: { rate: 2.8, bob: 0.1, lean: 0.32, squash: 0.06 },
  exam: { rate: 0.9, bob: 0.18, lean: 0.07, squash: 0.03 },
};

/** The villains' motion, kept per foe. */
export class FoeMotion {
  private pool: Anim[] = [];
  private byId = new Map<number, Anim>();
  private frame = 0;

  /** Begins a frame of drawing. */
  begin(): void {
    this.frame++;
  }

  /** Ends a frame: the motion of foes no longer drawn goes back to the pool. */
  end(): void {
    for (const a of this.byId.values()) {
      if (a.seen === this.frame) continue;
      this.byId.delete(a.id);
      this.pool.push(a);
    }
  }

  clear(): void {
    for (const a of this.byId.values()) this.pool.push(a);
    this.byId.clear();
  }

  private anim(f: Foe): Anim {
    let a = this.byId.get(f.id);
    if (!a) {
      a = this.pool.pop() ?? ({} as Anim);
      fresh(a, f);
      this.byId.set(f.id, a);
    }
    a.seen = this.frame;
    return a;
  }

  /**
   * A blow landed on a foe along a compass bearing: it recoils away from it, squashes, tilts, and
   * flashes at its edges. Harder for a finisher or a critical blow; less for the heavy kinds.
   */
  hit(f: Foe, bearing: number, heavy: boolean, crit: boolean): void {
    const a = this.anim(f);
    const k = (heavy ? 1 : 0.5) * (crit ? 1.35 : 1) * (f.kind === "exam" ? 0.3 : f.kind === "ddl" ? 0.6 : 1);
    const rel = ((bearing - f.facing) * Math.PI) / 180;
    // The top goes the way the blow goes: back for a blow from the front, over for one from the side.
    const sp = a.sp;
    sp[TP + 1]! += Math.cos(rel) * 4.5 * k;
    sp[TR + 1]! += Math.sin(rel) * 4.5 * k;
    sp[SQ + 1]! += 7 * k;
    const b = (bearing * Math.PI) / 180;
    sp[RX + 1]! += Math.sin(b) * 6 * k;
    sp[RN + 1]! += Math.cos(b) * 6 * k;
    a.flash = 0;
    a.flashK = f.kind === "exam" ? 0.6 : 1;
  }

  /** A foe's attack lands: it strikes. */
  lash(f: Foe, move: FoeMove["type"]): void {
    const a = this.anim(f);
    a.lash = 0;
    a.lashMove = move;
  }

  /** The look of a foe now, `dt` seconds after the last frame, at clock time `t`. */
  look(f: Foe, dt: number, t: number, out: FoeLook): void {
    const a = this.anim(f);
    // Its state, how long it has been in it, and for how long it was set.
    if (f.state !== a.state) {
      a.state = f.state;
      a.since = 0;
      a.total = Math.max(1e-3, f.t);
      if (f.state === "tell") a.move = f.move?.type ?? "";
    } else a.since += dt;
    a.lash += dt;
    a.flash += dt;
    // How fast it goes; a jump (a blink, a push set by hand) counts for nothing.
    if (dt > 0) {
      let vx = (f.at[0] - a.px) / dt;
      let vn = (f.at[1] - a.pn) / dt;
      if (Math.hypot(vx, vn) > 30) vx = vn = 0;
      const k = 1 - Math.exp(-dt * 10);
      a.vx += (vx - a.vx) * k;
      a.vn += (vn - a.vn) * k;
    }
    a.px = f.at[0];
    a.pn = f.at[1];
    const sp = a.sp;
    spring(sp, SQ, 260, 13, dt);
    spring(sp, RX, 160, 22, dt);
    spring(sp, RN, 160, 22, dt);
    spring(sp, TP, 170, 15, dt);
    spring(sp, TR, 170, 15, dt);

    const kind = f.kind;
    const spec = FOES[kind];
    const gait = GAIT[kind];
    const ph = f.id * 1.37;
    const o = out;
    o.ox = sp[RX]!;
    o.oy = 0;
    o.on = sp[RN]!;
    o.sx = o.sy = o.sz = 1;
    o.pitch = sp[TP]!;
    o.roll = sp[TR]!;
    o.yaw = 0;
    o.tr = o.tg = o.tb = 0;
    o.dissolve = 0;
    o.dazed = false;
    o.step = false;
    // The blow's flash: a glint at the edges that is gone in a few hundredths.
    o.flash = a.flash < FLASH_TIME ? Math.pow(1 - a.flash / FLASH_TIME, 1.5) * a.flashK : 0;
    // The squash spring: flatter and wider, the volume kept.
    const sq = Math.max(-0.35, Math.min(0.35, sp[SQ]! * 0.7));
    o.sy *= 1 - sq;
    o.sx *= 1 + sq * 0.6;
    o.sz *= 1 + sq * 0.6;

    // Idle and walk, mixed by how fast it goes.
    const speed = Math.hypot(a.vx, a.vn);
    const norm = speed / Math.max(1, spec.speed);
    const mv = clamp01((norm - 0.12) / 0.45);
    a.walk += dt * gait.rate * Math.PI * (0.3 + Math.min(1.6, norm));
    const half = Math.floor(a.walk / Math.PI);
    if (half !== a.lastStep) {
      a.lastStep = half;
      o.step = mv > 0.4 && (kind === "ddl" || kind === "procrastination" || kind === "exam");
    }
    const sw = Math.sin(a.walk);
    const land = Math.abs(sw);
    if (f.state === "chase" || f.state === "rise") {
      this.idle(kind, t + ph, 1 - mv, o);
      // The walk: up on each step, squashed as each lands, leaning into the way it goes, swaying.
      o.oy += land * gait.bob * mv;
      const squash = (1 - land) * gait.squash * mv;
      o.sy *= 1 - squash;
      o.sx *= 1 + squash * 0.6;
      o.sz *= 1 + squash * 0.6;
      o.pitch += gait.lean * mv * Math.min(1.4, norm);
      o.roll += Math.cos(a.walk) * (kind === "ddl" ? 0.09 : kind === "distraction" ? 0.22 : 0.05) * mv;
      if (kind === "distraction") o.yaw += Math.sin(a.walk * 0.5) * 0.25 * mv;
    }

    switch (f.state) {
      case "tell":
        this.gather(kind, a.move, clamp01(a.since / a.total), t, o);
        break;
      case "attack": {
        // A charge under way: leaning hard into it, stretched along the way it runs, stamping.
        o.pitch += 0.5;
        o.sz *= 1.18;
        o.sy *= 0.9;
        o.oy += Math.abs(Math.sin(t * 16)) * 0.18;
        o.roll += Math.sin(t * 16) * 0.08;
        o.step = Math.sin(t * 16) * Math.sin((t - dt) * 16) < 0;
        o.tr = 0.6;
        o.tg = 0.08;
        break;
      }
      case "recover": {
        // Open: slumped forward, panting, swaying a little; the moment to punish it.
        const k = clamp01(a.since / 0.12);
        o.pitch += 0.2 * k;
        o.oy -= 0.08 * k * (kind === "distraction" || kind === "anxiety" || kind === "plagiarism" ? 3 : 1);
        o.sy *= 1 - 0.06 * k + Math.sin(t * 11) * 0.025 * k;
        o.roll += Math.sin(t * 3.4) * 0.07 * k;
        o.dazed = a.since > 0.08;
        break;
      }
      case "stagger": {
        // Knocked off balance: thrown back, wobbling as it comes upright again.
        const k = 1 - clamp01(a.since / a.total);
        o.pitch -= 0.32 * k;
        o.roll += Math.sin(a.since * 22) * 0.26 * k;
        o.sy *= 1 - 0.1 * k;
        o.oy -= 0.1 * k;
        o.dazed = true;
        break;
      }
      case "phase":
        this.phaseChange(clamp01(a.since / a.total), t, o);
        break;
      case "dead":
        this.death(kind, clamp01(a.since / a.total), o);
        break;
      default:
        break;
    }

    // The strike, as the attack lands: a fast punch forward, then back.
    if (a.lash < LASH_TIME && f.state !== "dead") {
      const p = punch(a.lash / LASH_TIME);
      const move = a.lashMove;
      if (move === "slam" && kind === "ddl") {
        // Down on its fists: squashed flat, then up again.
        o.sy *= 1 - 0.3 * p;
        o.sx *= 1 + 0.18 * p;
        o.sz *= 1 + 0.18 * p;
        o.pitch += 0.35 * p;
      } else if (move === "yawn") {
        // The yawn let out: wide, then back.
        o.sx *= 1 + 0.25 * p;
        o.sz *= 1 + 0.25 * p;
        o.sy *= 1 - 0.15 * p;
        o.pitch -= 0.3 * p;
      } else if (move === "orb" || move === "beams" || move === "wave" || move === "summon") {
        // Thrown: a jolt forward and up.
        o.pitch += 0.3 * p;
        o.sy *= 1 + 0.1 * p;
        o.oy += 0.2 * p;
      } else {
        o.pitch += 0.6 * p;
        o.sy *= 1 + 0.14 * p;
        o.sx *= 1 - 0.08 * p;
        const r = (f.facing * Math.PI) / 180;
        const lunge = (kind === "exam" ? 0.6 : 0.9) * p;
        o.ox += Math.sin(r) * lunge;
        o.on += Math.cos(r) * lunge;
      }
    }
  }

  /** The kinds' moods at rest, `k` of the way in. */
  private idle(kind: FoeKind, t: number, k: number, o: FoeLook): void {
    if (k <= 0) return;
    switch (kind) {
      case "ddl": {
        // Impatient: it ticks, bouncing on each second, tapping from side to side.
        const tick = t % 1;
        const hop = tick < 0.12 ? Math.sin((tick / 0.12) * Math.PI) : 0;
        o.oy += hop * 0.1 * k;
        o.sy *= 1 + hop * 0.05 * k;
        o.roll += (Math.floor(t) % 2 ? 1 : -1) * 0.05 * k;
        break;
      }
      case "procrastination":
        // Slow, heavy breaths, leaning to one side and back.
        o.sy *= 1 + Math.sin(t * 1.6) * 0.06 * k;
        o.sx *= 1 - Math.sin(t * 1.6) * 0.03 * k;
        o.roll += Math.sin(t * 0.5) * 0.08 * k;
        o.pitch += 0.06 * k;
        break;
      case "distraction":
        // It buzzes, and now and then shakes for a look, as a phone does.
        o.oy += Math.sin(t * 6) * 0.2 * k;
        if (t % 2.2 < 0.35) o.roll += Math.sin(t * 60) * 0.25 * k;
        o.yaw += Math.sin(t * 1.3) * 0.3 * k;
        break;
      case "plagiarism":
        // It floats, swaying, and glances over its shoulder.
        o.oy += Math.sin(t * 1.8) * 0.15 * k;
        o.roll += Math.sin(t * 1.2) * 0.1 * k;
        o.yaw += Math.sin(t * 0.7) * 0.45 * k;
        break;
      case "anxiety":
        // It shivers and breathes fast, hunched.
        o.ox += (Math.random() - 0.5) * 0.06 * k;
        o.on += (Math.random() - 0.5) * 0.06 * k;
        o.sy *= 1 + Math.sin(t * 9) * 0.04 * k;
        o.pitch += 0.12 * k;
        break;
      case "exam":
        // It hovers, slow and sure.
        o.oy += Math.sin(t * 1.1) * 0.25 * k;
        o.roll += Math.sin(t * 0.6) * 0.03 * k;
        break;
    }
  }

  /**
   * The first beat of an attack: it gathers itself, `k` of the way to striking, glowing red at its
   * edges and shaking at the last.
   */
  private gather(kind: FoeKind, move: string, k: number, t: number, o: FoeLook): void {
    const e = easeOut(clamp01(k / 0.75));
    const late = clamp01((k - 0.7) / 0.3);
    const pulse = 0.5 + 0.5 * Math.sin(t * (18 + 20 * late));
    o.tr = (0.35 + 0.65 * pulse) * (0.4 + 0.6 * e);
    o.tg = 0.06 * o.tr;
    const shake = late * (kind === "exam" ? 0.12 : 0.07);
    o.ox += (Math.random() - 0.5) * shake;
    o.on += (Math.random() - 0.5) * shake;
    if (kind === "ddl" && move === "charge") {
      // Head down like a bull, scraping the ground.
      o.pitch += 0.28 * e;
      o.sy *= 1 - 0.14 * e;
      o.sx *= 1 + 0.1 * e;
      o.roll += Math.sin(t * 30) * 0.06 * e;
    } else if (kind === "ddl") {
      // Up for the slam, stretched tall, the fists over its head.
      o.oy += 0.7 * e;
      o.sy *= 1 + 0.16 * e;
      o.sx *= 1 - 0.08 * e;
      o.pitch -= 0.25 * e;
    } else if (kind === "procrastination") {
      // A great breath in for the yawn.
      o.sx *= 1 + 0.26 * e;
      o.sz *= 1 + 0.26 * e;
      o.sy *= 1 + 0.1 * e;
      o.pitch -= 0.22 * e;
    } else if (kind === "distraction") {
      // Drawn back and up, ready to dive.
      o.oy += 0.35 * e;
      o.pitch -= 0.6 * e;
      o.sy *= 1 - 0.1 * e;
    } else if (kind === "plagiarism") {
      // Drawn up tall behind the walker, twisting.
      o.sy *= 1 + 0.25 * e;
      o.sx *= 1 - 0.14 * e;
      o.sz *= 1 - 0.14 * e;
      o.pitch -= 0.3 * e;
      o.yaw += Math.sin(t * 14) * 0.15 * e;
    } else if (kind === "anxiety") {
      // Curled tight round its racing heart.
      o.sy *= 1 - 0.18 * e;
      o.sx *= 1 + 0.08 * e;
      o.pitch -= 0.18 * e;
      o.ox += (Math.random() - 0.5) * 0.08 * e;
    } else {
      // The boss draws itself up.
      o.oy += 0.5 * e;
      o.pitch -= 0.12 * e;
    }
    // The common part of a wind-up: back and down, gathering.
    if (kind !== "ddl" || move !== "charge") o.pitch -= 0.1 * e;
  }

  /** The boss's change of phase, `k` of the way through: knocked back, a roar that lifts and glows, settling. */
  private phaseChange(k: number, t: number, o: FoeLook): void {
    if (k < 0.18) {
      const s = k / 0.18;
      o.pitch -= 0.35 * easeOut(s);
      o.roll += Math.sin(k * 90) * 0.08 * (1 - s);
      o.flash = Math.max(o.flash, 1 - s);
    } else if (k < 0.75) {
      const s = (k - 0.18) / 0.57;
      const rise = easeOut(clamp01(s * 2.5));
      o.pitch -= 0.35 * (1 - rise) + 0.18 * rise;
      o.oy += 1.3 * rise;
      const swell = 1 + 0.08 * rise + 0.03 * Math.sin(t * 30) * rise;
      o.sx *= swell;
      o.sy *= swell;
      o.sz *= swell;
      o.ox += (Math.random() - 0.5) * 0.18 * rise;
      o.on += (Math.random() - 0.5) * 0.18 * rise;
      // A glow at its edges as it roars, held to the boss.
      const glow = 0.6 + 0.4 * Math.sin(t * 24);
      o.tr = 0.75 * glow * rise;
      o.tg = 0.36 * glow * rise;
      o.tb = 0.05 * rise;
    } else {
      const s = smooth((k - 0.75) / 0.25);
      o.oy += 1.3 * (1 - s);
      o.pitch -= 0.18 * (1 - s);
      o.tr = 0.6 * (1 - s);
      o.tg = 0.27 * (1 - s);
    }
  }

  /** A death, `k` of the way through: a pop, then each kind breaks up its own way. */
  private death(kind: FoeKind, k: number, o: FoeLook): void {
    // The pop: a swell and a white glint at the edges.
    const pop = k < 0.12 ? Math.sin((k / 0.12) * Math.PI) : 0;
    const s = 1 + pop * 0.22;
    o.sx *= s;
    o.sy *= s;
    o.sz *= s;
    o.flash = Math.max(o.flash, k < 0.14 ? 1 - k / 0.14 : 0);
    const after = clamp01((k - 0.1) / 0.9);
    switch (kind) {
      case "ddl":
        // It shatters: shaking apart, falling in on itself as its gears fly.
        o.dissolve = smooth(after);
        o.roll += Math.sin(k * 60) * 0.1 * (1 - after);
        o.sy *= 1 - 0.3 * after;
        break;
      case "procrastination":
        // A balloon popped: gone in a moment, its stuffing everywhere.
        o.dissolve = clamp01(after * 2.2);
        o.sx *= 1 + 0.35 * clamp01(after * 4);
        o.sz *= 1 + 0.35 * clamp01(after * 4);
        o.sy *= 1 - 0.4 * clamp01(after * 4);
        break;
      case "distraction":
        // A screen that cracks and goes dark: it spins down.
        o.dissolve = clamp01(after * 1.8);
        o.yaw += after * 9;
        o.oy -= after * 1.2;
        break;
      case "plagiarism":
        // Copies of copies: it rises and comes apart into pages.
        o.dissolve = smooth(after);
        o.oy += after * 1.6;
        o.yaw += after * 3;
        break;
      case "anxiety":
        // It melts into a pool of ink.
        o.dissolve = smooth(after);
        o.sy *= 1 - 0.6 * after;
        o.sx *= 1 + 0.35 * after;
        o.sz *= 1 + 0.35 * after;
        o.oy -= after * 0.6;
        break;
      case "exam":
        // The last hour runs out: it shudders, rises and breaks up slowly, in a glow.
        o.dissolve = smooth(clamp01((k - 0.2) / 0.8));
        o.oy += after * 1.2;
        o.ox += (Math.random() - 0.5) * 0.2 * (1 - after);
        o.on += (Math.random() - 0.5) * 0.2 * (1 - after);
        o.tr = 1;
        o.tg = 0.62;
        o.tb = 0.2;
        break;
    }
  }

  /** Seconds a foe has been in its state, for what game.ts adds (the boss's roar). */
  since(id: number): number {
    return this.byId.get(id)?.since ?? 0;
  }
}

/** Seconds a foe of a kind takes to break up. */
export function deathTime(kind: FoeKind): number {
  return kind === "exam" ? FOE_TIME.bossDeath : FOE_TIME.death;
}
