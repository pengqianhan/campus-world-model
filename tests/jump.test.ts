// Study Quest's jump (shared/locomotion.ts stepJump, and the rules in shared/game.ts): its arc, the
// coyote time and the buffer, the burst of a jump at a run and its cap, the landing, Shift's tap
// against its hold, and what a jump clears in a fight: the ground's shockwaves, not other attacks.
import { describe, expect, it } from "vitest";
import type { Pt } from "../src/shared/geo.ts";
import { LESSONS, PLAYER, StudyQuest, type Foe, type GameEvent, type PlayerInput, type QuestHost } from "../src/shared/game.ts";
import { FALL_PULL, JUMP, JUMP_SPEED, LEAP, RISE_PULL, SHIFT_TAP, airCycle, airTimeLeft, dutyFactor, isShiftTap, jumpKind, newMotion, oneFoot, pressJump, stepJump, stepMotion, takeoffFoot, type Motion } from "../src/shared/locomotion.ts";
import { JUMP_POSES, MOVES, newPose, sampleMove } from "../src/scene/figureMoves.ts";

const DT = 1 / 120;

/** Runs a motion for `seconds` over ground at `ground(t)` metres: the feet's height each step, and when it first landed. */
function fly(m: Motion, seconds: number, opts: { ground?: (t: number) => number; can?: boolean; top?: number; want?: number; speed?: number } = {}): { y: number[]; landedAt: number } {
  const y: number[] = [];
  let landedAt = -1;
  for (let t = 0; t < seconds - 1e-9; t += DT) {
    stepMotion(m, { want: opts.want, speed: opts.speed ?? 0 }, DT);
    if (stepJump(m, DT, opts.ground?.(t) ?? 0, opts.can ?? true, opts.top ?? 3.5) && landedAt < 0) landedAt = t;
    y.push(m.y);
  }
  return { y, landedAt };
}

describe("the jump's arc", () => {
  it("rises to its apex quickly, falls faster than it rose, and lands where it took off", () => {
    expect(JUMP.apex).toBeGreaterThanOrEqual(0.55);
    expect(JUMP.apex).toBeLessThanOrEqual(0.7);
    expect(FALL_PULL).toBeGreaterThan(RISE_PULL);
    const m = newMotion(0, 0);
    pressJump(m);
    const { y, landedAt } = fly(m, 1.2);
    const top = Math.max(...y);
    expect(top).toBeGreaterThan(JUMP.apex - 0.02);
    expect(top).toBeLessThan(JUMP.apex + 0.02);
    // The crouch, then up: off the ground after the wind-up, at the top after the rise.
    const off = y.findIndex((v) => v > 1e-6) * DT;
    const peak = y.indexOf(top) * DT;
    expect(Math.abs(off - JUMP.windup)).toBeLessThan(0.02);
    expect(Math.abs(peak - off - JUMP.rise)).toBeLessThan(0.02);
    // Down in less time than up.
    const fall = landedAt - peak;
    expect(fall).toBeLessThan(peak - off);
    expect(Math.abs(fall - Math.sqrt((2 * JUMP.apex) / FALL_PULL))).toBeLessThan(0.02);
    expect(m.air).toBe(false);
    expect(m.y).toBe(0);
    expect(m.jumps).toBe(1);
    expect(m.landings).toBe(1);
    expect(JUMP_SPEED).toBeCloseTo(RISE_PULL * JUMP.rise, 9);
  });

  it("takes no second jump in the air", () => {
    const m = newMotion(0, 0);
    pressJump(m);
    fly(m, 0.2);
    expect(m.air).toBe(true);
    pressJump(m);
    fly(m, 0.1);
    expect(m.jumps).toBe(1);
  });

  it("lands hard only after a long fall", () => {
    const m = newMotion(0, 0);
    pressJump(m);
    fly(m, 1.2);
    expect(m.hard).toBe(0);
    // Off an edge 1.5 m down: a fall, and a hard landing.
    const e = newMotion(0, 1.5);
    const r = fly(e, 1.5, { ground: () => 0 });
    expect(r.landedAt).toBeGreaterThan(0);
    expect(e.hard).toBe(1);
    expect(e.jumps).toBe(0);
  });

  it("walks down a slope rather than falling off it, and goes over an edge", () => {
    const m = newMotion(0, 0);
    // 5 cm a step down: a steep slope, walked.
    fly(m, 0.5, { ground: (t) => -t * 6 });
    expect(m.air).toBe(false);
    const e = newMotion(0, 0);
    fly(e, 0.05, { ground: (t) => (t < 0.02 ? 0 : -JUMP.edge - 0.1) });
    expect(e.air).toBe(true);
  });
});

describe("the coyote time and the buffer", () => {
  it("keeps a press made just before it can jump, and lets it go after the buffer's time", () => {
    // Pressed in a blow (it cannot jump), which ends 0.1 s later: it jumps then.
    const m = newMotion(0, 0);
    pressJump(m);
    for (let t = 0; t < 0.1; t += DT) stepJump(m, DT, 0, false, 3.5);
    fly(m, 0.1);
    expect(m.jumps).toBe(1);
    // Ended past the buffer: no jump.
    const late = newMotion(0, 0);
    pressJump(late);
    for (let t = 0; t < JUMP.buffer + 0.03; t += DT) stepJump(late, DT, 0, false, 3.5);
    fly(late, 0.3);
    expect(late.jumps).toBe(0);
  });

  it("jumps again on landing when pressed just before it", () => {
    const first = newMotion(0, 0);
    pressJump(first);
    const land = fly(first, 1.2).landedAt;
    const again = newMotion(0, 0);
    pressJump(again);
    fly(again, land - 0.08);
    expect(again.air).toBe(true);
    pressJump(again);
    fly(again, 0.3);
    expect(again.jumps).toBe(2);
  });

  it("can still jump for the coyote time after going over an edge, and not after", () => {
    for (const [wait, jumps] of [
      [JUMP.coyote - 0.03, 1],
      [JUMP.coyote + 0.05, 0],
    ] as const) {
      const m = newMotion(0, 2);
      // Over the edge (the ground 2 m down), then a press after `wait`.
      fly(m, wait, { ground: () => 0 });
      expect(m.air).toBe(true);
      pressJump(m);
      fly(m, 0.1, { ground: () => 0 });
      expect(m.jumps, `pressed ${wait} s after the edge`).toBe(jumps);
    }
  });
});

describe("the burst of a jump at a run", () => {
  it("goes faster in the air than the run, up to its cap, and eases back after landing", () => {
    const m = newMotion(0, 0);
    fly(m, 1, { want: 0, speed: 3.5 });
    expect(Math.hypot(m.vx, m.vy)).toBeCloseTo(3.5, 6);
    pressJump(m);
    fly(m, 0.2, { want: 0, speed: 3.5 });
    expect(m.air).toBe(true);
    expect(Math.hypot(m.vx, m.vy)).toBeCloseTo(3.5 * JUMP.boost, 6);
    const { landedAt } = fly(m, 0.6, { want: 0, speed: 3.5 });
    expect(landedAt).toBeGreaterThan(0);
    // Eased back to the run over JUMP.boostEase.
    fly(m, JUMP.boostEase + 0.3, { want: 0, speed: 3.5 });
    expect(m.boost).toBe(1);
    expect(Math.hypot(m.vx, m.vy)).toBeCloseTo(3.5, 3);
  });

  it("does not stack over a chain of jumps", () => {
    const m = newMotion(0, 0);
    fly(m, 1, { want: 0, speed: 3.5 });
    let most = 0;
    pressJump(m);
    for (let t = 0; t < 5; t += DT) {
      stepMotion(m, { want: 0, speed: 3.5 }, DT);
      stepJump(m, DT, 0, true, 3.5);
      most = Math.max(most, Math.hypot(m.vx, m.vy));
      // Pressed again just before each landing: a chain.
      if (m.air && m.vy3 < 0 && m.y < 0.15) pressJump(m);
    }
    expect(m.jumps).toBeGreaterThanOrEqual(6);
    expect(most).toBeLessThanOrEqual(3.5 * JUMP.boost + 1e-9);
  });

  it("gives no burst to a jump from a walk", () => {
    const m = newMotion(0, 0);
    fly(m, 1, { want: 0, speed: 1.4 });
    pressJump(m);
    fly(m, 0.2, { want: 0, speed: 1.4 });
    expect(m.boost).toBe(1);
    expect(Math.hypot(m.vx, m.vy)).toBeCloseTo(1.4, 6);
  });

  it("steers less in the air than on the ground", () => {
    const ground = newMotion(0, 0);
    fly(ground, 1, { want: 0, speed: 3.5 });
    const air = newMotion(0, 0);
    fly(air, 1, { want: 0, speed: 3.5 });
    pressJump(air);
    fly(air, 0.15, { want: 0, speed: 3.5 });
    fly(ground, 0.1, { want: 90, speed: 3.5 });
    fly(air, 0.1, { want: 90, speed: 3.5 });
    expect(air.air).toBe(true);
    expect(air.heading).toBeLessThan(ground.heading / 2);
  });
});

describe("Shift: a tap dodges, a hold runs", () => {
  it("is a tap under the tap's time with no other key, and a hold past it", () => {
    expect(SHIFT_TAP).toBeCloseTo(0.2, 9);
    expect(isShiftTap(0.08, true)).toBe(true);
    expect(isShiftTap(0.19, true)).toBe(true);
    expect(isShiftTap(0.21, true)).toBe(false);
    expect(isShiftTap(1.5, true)).toBe(false);
    // Shift with another key (a capital, a shortcut) is no dodge.
    expect(isShiftTap(0.08, false)).toBe(false);
  });
});

describe("the jump's poses", () => {
  it("crouch before it, tuck at the top, and take the landing in the knees, deeper after a long fall", () => {
    expect(JUMP_POSES.windup.crouch).toBeGreaterThan(0);
    expect(JUMP_POSES.apex.tuck).toBeGreaterThan(JUMP_POSES.rise.tuck);
    expect(JUMP_POSES.apex.tuck).toBeGreaterThan(JUMP_POSES.fall.tuck);
    expect(JUMP_POSES.landHard.crouch).toBeGreaterThan(JUMP_POSES.land.crouch);
    for (const p of Object.values(JUMP_POSES)) for (const v of [p.rUp, p.rFo, p.lUp, p.lFo]) expect(Math.hypot(...v)).toBeGreaterThan(0.5);
  });

  it("bring the landing slash down as its blow lands", () => {
    expect(MOVES.plunge.keys.some((k) => k.t === PLAYER.plungeContact)).toBe(true);
    const [a, b] = MOVES.plunge.trail!;
    expect(a).toBeLessThan(PLAYER.plungeContact);
    expect(b).toBeGreaterThan(PLAYER.plungeContact);
    expect(sampleMove("plungeUp", 0.5, newPose())).toBe(1);
  });
});

// The rules.
function host(): QuestHost {
  return { spot: (near) => [near[0] + 500, near[1]], place: (near) => ({ name: "Hall", at: [near[0], near[1] + 100] }), random: () => 0.5 };
}
function quiet(seen: readonly string[] = LESSONS): StudyQuest {
  const g = new StudyQuest(host(), [0, 0], 0, seen);
  g.grace = 0;
  g.foes = [];
  return g;
}
const input = (air: number, at: Pt = [0, 0]): PlayerInput => ({ at, heading: 0, move: undefined, air, active: true, pace: 1 });
function foe(g: StudyQuest, kind: Foe["kind"], at: Pt): Foe {
  const f = g.spawn(kind, at);
  f.state = "chase";
  f.t = 0;
  f.cool = 99;
  return f;
}
/** The feet's height `t` seconds into a jump that left the ground at 0. */
function arc(t: number): number {
  const m = newMotion(0, 0);
  m.air = true;
  m.jumped = true;
  m.vy3 = JUMP_SPEED;
  for (let s = 0; s < t - 1e-9; s += DT) stepJump(m, DT, 0, true, 3.5);
  return m.y;
}

describe("the rules: what a jump clears", () => {
  /** A slam where the walker stands, landing at once; the walker's feet `air` metres up then. */
  function slam(air: number): GameEvent[] {
    const g = quiet();
    const f = foe(g, "ddl", [0, 3]);
    f.state = "tell";
    f.t = 0.02;
    f.move = { type: "slam", at: f.at, radius: 4.8 };
    const out: GameEvent[] = [];
    for (let k = 0; k < 10; k++) out.push(...g.step(0.01, input(air)));
    return out;
  }

  it("lifts the walker clear of a slam's shockwave over the ground when its feet are high enough", () => {
    expect(slam(0).some((e) => e.type === "hurt")).toBe(true);
    expect(slam(PLAYER.jumpClear - 0.05).some((e) => e.type === "hurt")).toBe(true);
    const clear = slam(PLAYER.jumpClear + 0.05);
    expect(clear.some((e) => e.type === "hurt")).toBe(false);
    expect(clear.some((e) => e.type === "evade")).toBe(true);
    // Most of a jump's time in the air is clear of it.
    let up = 0;
    for (let t = 0; t < 0.6; t += 0.01) if (arc(t) >= PLAYER.jumpClear) up += 0.01;
    expect(up).toBeGreaterThan(0.3);
  });

  it("lets a ring over the ground pass under a walker in the air, and only then", () => {
    for (const [air, hurt] of [
      [0, true],
      [0.4, false],
    ] as const) {
      const g = quiet();
      g.waves.push({ id: 999, at: [0, -6], r: 3.2, speed: 13, max: 32, hit: false });
      const out: GameEvent[] = [];
      for (let k = 0; k < 60; k++) out.push(...g.step(0.01, input(air)));
      expect(out.some((e) => e.type === "hurt"), `air ${air}`).toBe(hurt);
    }
  });

  it("gives no general protection: a blow still hurts in the air", () => {
    const g = quiet();
    const f = foe(g, "distraction", [0, 1]);
    f.state = "tell";
    f.t = 0.01;
    f.move = { type: "melee" };
    const out: GameEvent[] = [];
    for (let k = 0; k < 5; k++) out.push(...g.step(0.01, input(0.5)));
    expect(out.some((e) => e.type === "hurt")).toBe(true);
  });

  it("brings a strike pressed in the air down as a slash when the walker lands, timed from the landing", () => {
    const g = quiet();
    const f = foe(g, "distraction", [0, 2]);
    f.hp = 1e6;
    g.act("strike");
    const ready = g.step(0.01, input(0.4));
    expect(ready.some((e) => e.type === "plungeReady")).toBe(true);
    expect(ready.some((e) => e.type === "swing")).toBe(false);
    // Still in the air: nothing more.
    for (let k = 0; k < 20; k++) expect(g.step(0.01, input(0.3)).some((e) => e.type === "swing" || e.type === "hit")).toBe(false);
    // It lands: the slash, and the blow PLAYER.plungeContact after.
    const land = g.step(0.005, input(0));
    expect(land).toContainEqual(expect.objectContaining({ type: "swing", plunge: true }));
    let when = -1;
    for (let t = 0.005; t < 0.3 && when < 0; t += 0.005) if (g.step(0.005, input(0)).some((e) => e.type === "hit")) when = t;
    expect(Math.abs(when - PLAYER.plungeContact)).toBeLessThan(0.006);
    // The ground's own blows keep their times.
    expect(PLAYER.strikeContact).toEqual([0.09, 0.09, 0.17]);
  });

  it("keeps a dodge pressed in the air for the landing", () => {
    const g = quiet();
    g.act("dodge");
    expect(g.step(0.01, input(0.4)).some((e) => e.type === "dodge")).toBe(false);
    expect(g.step(0.01, input(0)).some((e) => e.type === "dodge")).toBe(true);
  });

  it("lets the walker leave the ground only between blows and dodges", () => {
    const g = quiet();
    expect(g.canJump).toBe(true);
    g.act("strike");
    g.step(0.01, input(0));
    expect(g.canJump).toBe(false);
    for (let k = 0; k < 60; k++) g.step(0.01, input(0));
    expect(g.canJump).toBe(true);
  });

  it("teaches the jump once the dodge is taught, by a slam about to land where the walker stands", () => {
    const g = quiet(["move", "strike", "dodge", "flashcard", "sprint", "eureka"]);
    const f = foe(g, "ddl", [0, 3]);
    f.state = "tell";
    f.t = 1;
    f.move = { type: "slam", at: f.at, radius: 4.8 };
    (g as unknown as { addTell: (f: Foe, t: object, total: number) => void }).addTell(f, { shape: "circle", at: f.at, dir: 0, length: 0, width: 0, radius: 4.8 }, 1);
    g.step(0.01, input(0));
    expect(g.lesson).toBe("jump");
    const evs = g.step(0.01, input(0.2));
    expect(evs).toContainEqual({ type: "learn", lesson: "jump" });
    expect(g.lesson).toBeUndefined();
  });
});

describe("the jump's kind: a hop standing, a step-up at a walk, a running leap at a run", () => {
  it("chooses by the pace over the ground, and locked on by the way it goes against the way it faces", () => {
    expect(jumpKind(0, 0)).toBe("hop");
    expect(jumpKind(LEAP.stepFrom - 0.01, 0)).toBe("hop");
    expect(jumpKind(1.4, 0)).toBe("step");
    expect(jumpKind(LEAP.leapFrom - 0.01, 10)).toBe("step");
    expect(jumpKind(3.5, 0)).toBe("leap");
    expect(jumpKind(3.5, -30)).toBe("leap");
    expect(jumpKind(3, 90)).toBe("side");
    expect(jumpKind(3, -60)).toBe("side");
    expect(jumpKind(2.4, 180)).toBe("back");
    expect(jumpKind(2.4, -140)).toBe("back");
    expect(oneFoot("leap") && oneFoot("step")).toBe(true);
    expect(oneFoot("hop") || oneFoot("side") || oneFoot("back")).toBe(false);
  });

  it("leaves the ground on the press when moving, and only a hop from standing crouches first", () => {
    const run = newMotion(0, 0);
    fly(run, 1, { want: 0, speed: 3.5 });
    pressJump(run);
    stepMotion(run, { want: 0, speed: 3.5 }, DT);
    stepJump(run, DT, 0, true, 3.5);
    expect(run.air).toBe(true);
    expect(run.kind).toBe("leap");
    expect(run.y).toBeGreaterThan(0);
    const walk = newMotion(0, 0);
    fly(walk, 1, { want: 0, speed: 1.4 });
    pressJump(walk);
    stepJump(walk, DT, 0, true, 3.5);
    expect(walk.air).toBe(true);
    expect(walk.kind).toBe("step");
    const stand = newMotion(0, 0);
    pressJump(stand);
    stepJump(stand, DT, 0, true, 3.5);
    expect(stand.air).toBe(false);
    expect(stand.kind).toBe("hop");
    expect(stand.windup).toBeGreaterThan(0);
  });
});

describe("the take-off foot and the landing foot, from the stride", () => {
  const run = dutyFactor(3.5);
  const walk = dutyFactor(1.4);
  /** The foot whose step in the cycle a share of a cycle `p` is: the left's at 0, the right's at 0.5. */
  const contact = (p: number) => {
    const q = ((p % 1) + 1) % 1;
    return Math.min(q, 1 - q) < 1e-9 ? "L" : Math.abs(q - 0.5) < 1e-9 ? "R" : "none";
  };

  it("pushes off the foot that is down", () => {
    expect(takeoffFoot(0.1, run).push).toBe("L");
    expect(takeoffFoot(0.35, run).push).toBe("L");
    expect(takeoffFoot(0.6, run).push).toBe("R");
    expect(takeoffFoot(0.85, run).push).toBe("R");
  });

  it("between steps, pushes off the foot about to come down, at once", () => {
    // At a run both feet are off the ground between 0.4 and 0.5 and between 0.9 and 1.
    expect(run).toBeLessThan(0.5);
    expect(takeoffFoot(0.45, run).push).toBe("R");
    expect(takeoffFoot(0.95, run).push).toBe("L");
  });

  it("with both feet down (a walk), pushes off the front one, just put down, and the back one swings through to land", () => {
    expect(walk).toBeGreaterThan(0.5);
    // At 0.55 the right was put down 0.05 of a cycle ago and the left 0.55: the right pushes, and
    // the left lands at its next step, in half a cycle.
    expect(takeoffFoot(0.55, walk)).toEqual({ push: "R", ahead: expect.closeTo(0.45, 9) });
    expect(takeoffFoot(0.05, walk)).toEqual({ push: "L", ahead: expect.closeTo(0.45, 9) });
  });

  it("lands on the other foot, at that foot's own step in the cycle, on the next stride", () => {
    for (const duty of [run, walk]) {
      for (let p = 0; p < 1; p += 0.01) {
        const t = takeoffFoot(p, duty);
        const lead = t.push === "L" ? "R" : "L";
        expect(contact(p + t.ahead), `phase ${p.toFixed(2)}`).toBe(lead);
        expect(t.ahead).toBeGreaterThanOrEqual(0.15);
        expect(t.ahead).toBeLessThanOrEqual(1.15);
      }
    }
  });
});

describe("the stride carried through the air", () => {
  it("knows how long the feet have left in the air, as the jump plays it", () => {
    const m = newMotion(0, 0);
    m.air = true;
    m.jumped = true;
    m.vy3 = JUMP_SPEED;
    const predicted = airTimeLeft(0, JUMP_SPEED);
    let t = 0;
    while (!stepJump(m, DT, 0, true, 3.5)) t += DT;
    expect(Math.abs(t - predicted)).toBeLessThan(2 * DT);
    expect(airTimeLeft(0, 0)).toBe(0);
  });

  it("goes on through take-off, the air and the landing without going back or jumping, and lands on the lead foot's step", () => {
    for (const start of [0.1, 0.33, 0.45, 0.62, 0.8, 0.97]) {
      const m = newMotion(0, 0);
      fly(m, 1, { want: 0, speed: 3.5 });
      // The stride before: 1.46 cycles a second at a run, as the clip has it.
      let cycles = 3 + start;
      const pace = 3.5 / 2.4;
      for (let t = 0; t < 0.5; t += DT) cycles += pace * DT;
      const tk = takeoffFoot(cycles % 1, dutyFactor(3.5));
      const land = cycles + tk.ahead;
      pressJump(m);
      const seen: number[] = [cycles];
      let landed = false;
      while (!landed) {
        stepMotion(m, { want: 0, speed: 3.5 }, DT);
        landed = stepJump(m, DT, 0, true, 3.5);
        const left = landed ? 0 : airTimeLeft(m.y, m.vy3);
        cycles = airCycle(cycles, land, left, DT);
        seen.push(cycles);
      }
      // On through the air: never back, no step bigger than the run's own.
      for (let k = 1; k < seen.length; k++) {
        expect(seen[k]!).toBeGreaterThanOrEqual(seen[k - 1]!);
        expect(seen[k]! - seen[k - 1]!).toBeLessThan(pace * DT * 1.5);
      }
      // Down exactly at the lead foot's step.
      expect(cycles).toBeCloseTo(land, 9);
      const lead = tk.push === "L" ? 0.5 : 0;
      expect(Math.abs((((cycles - lead) % 1) + 1) % 1)).toBeLessThan(1e-9);
    }
  });

  it("keeps the run's pace over the ground through take-off and landing: the burst, never a dip", () => {
    const m = newMotion(0, 0);
    fly(m, 1, { want: 0, speed: 3.5 });
    let least = Infinity;
    pressJump(m);
    for (let t = 0; t < 1.5; t += DT) {
      stepMotion(m, { want: 0, speed: 3.5 }, DT);
      stepJump(m, DT, 0, true, 3.5);
      least = Math.min(least, Math.hypot(m.vx, m.vy));
    }
    expect(least).toBeGreaterThan(3.5 - 1e-6);
  });
});
