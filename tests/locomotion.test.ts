// The walker's motion in Study Quest, as an action game moves its hero (shared/locomotion.ts), and
// the rules it changes (shared/game.ts): the way of going and the way of facing apart when locked
// on, the gait's stride against the ground, the turn and the pivot, the stick read against the
// camera, the dodge's way, and a blow's lunge and aim.
import { describe, expect, it } from "vitest";
import type { Pt } from "../src/shared/geo.ts";
import { FOES, LESSONS, PLAYER, StudyQuest, lungeMetres, type Foe, type GameEvent, type PlayerInput, type QuestHost } from "../src/shared/game.ts";
import {
  LOCO,
  cadence,
  dodgeWay,
  dutyFactor,
  footAt,
  keepCircle,
  latchView,
  newLatch,
  newMotion,
  stepMotion,
  stickBearing,
  strafePace,
  strafeWeights,
  strideLength,
  turnBetween,
} from "../src/shared/locomotion.ts";
import { MOVES, newPose, sampleFlinch, sampleMove } from "../src/scene/figureMoves.ts";

describe("the strafe's blend of four ways of stepping", () => {
  it("is all forward, back, left or right straight that way, and half of each of two on a diagonal", () => {
    expect(strafeWeights(0)).toEqual({ f: 1, b: 0, l: 0, r: 0 });
    expect(strafeWeights(180)).toMatchObject({ f: 0, b: expect.closeTo(1, 9), l: 0 });
    expect(strafeWeights(90)).toMatchObject({ f: expect.closeTo(0, 9), b: 0, l: 0, r: 1 });
    expect(strafeWeights(-90)).toMatchObject({ f: expect.closeTo(0, 9), b: 0, l: 1, r: 0 });
    const d = strafeWeights(45);
    expect(d.f).toBeCloseTo(0.5, 9);
    expect(d.r).toBeCloseTo(0.5, 9);
    const bl = strafeWeights(-135);
    expect(bl.b).toBeCloseTo(0.5, 9);
    expect(bl.l).toBeCloseTo(0.5, 9);
  });

  it("adds up to one all the way round, and changes smoothly", () => {
    let was = strafeWeights(-180);
    for (let a = -179; a <= 180; a++) {
      const w = strafeWeights(a);
      expect(w.f + w.b + w.l + w.r).toBeCloseTo(1, 9);
      for (const k of ["f", "b", "l", "r"] as const) expect(Math.abs(w[k] - was[k])).toBeLessThan(0.03);
      was = { ...w };
    }
  });

  it("keeps all the pace forward, less to the side and least backpedalling", () => {
    expect(strafePace(0)).toBe(1);
    expect(strafePace(90)).toBeCloseTo(LOCO.strafeScale, 9);
    expect(strafePace(-90)).toBeCloseTo(LOCO.strafeScale, 9);
    expect(strafePace(180)).toBeCloseTo(LOCO.backScale, 9);
  });
});

describe("the gait: stride and cadence against the ground", () => {
  it("takes longer strides the faster it goes, as the walk and the run clips do, and shorter ones to the side and back", () => {
    expect(strideLength(1.4)).toBeCloseTo(1.43, 2);
    expect(strideLength(3.5)).toBeCloseTo(2.375, 3);
    for (let v = 0.5; v < 5; v += 0.5) expect(strideLength(v + 0.5)).toBeGreaterThanOrEqual(strideLength(v));
    expect(strideLength(3, 1, 0)).toBeLessThan(strideLength(3));
    expect(strideLength(3, 0, 1)).toBeLessThan(strideLength(3));
    // Quicker steps the faster it goes; and quicker still to the side at the same speed.
    expect(cadence(3.5)).toBeGreaterThan(cadence(1.4));
    expect(cadence(3, 1, 0)).toBeGreaterThan(cadence(3));
    // On the ground most of a walk's cycle, under half of a run's.
    expect(dutyFactor(1.4)).toBeGreaterThan(0.5);
    expect(dutyFactor(3.5)).toBeLessThan(0.5);
  });

  it("leaves a planted foot where it was put down while the body goes over it, at any speed and any way", () => {
    for (const v of [0.6, 1.4, 2.6, 3.5]) {
      for (const [side, back] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [0.5, 0.5],
      ] as const) {
        const S = strideLength(v, side, back);
        const D = dutyFactor(v);
        const dt = 1 / 120;
        let phase = 0;
        let body = 0;
        const down: number[] = [];
        // A whole cycle: the foot's place over the ground is the body's plus its own along the way.
        for (let t = 0; t < S / v; t += dt) {
          const f = footAt(phase, S, D, 0.1);
          if (f.down) down.push(body + f.along);
          phase += (v * dt) / S;
          body += v * dt;
        }
        expect(down.length).toBeGreaterThan(5);
        const slide = Math.max(...down) - Math.min(...down);
        expect(slide, `${v} m/s, side ${side}, back ${back}`).toBeLessThan(1e-9);
      }
    }
  });

  it("swings the foot up and forward to where it comes down next, never below the ground", () => {
    const S = strideLength(3.5);
    const D = dutyFactor(3.5);
    const lift = 0.2;
    expect(footAt(0, S, D, lift).along).toBeCloseTo((S * D) / 2, 9);
    expect(footAt(D - 1e-9, S, D, lift).along).toBeCloseTo((-S * D) / 2, 6);
    expect(footAt(1 - 1e-9, S, D, lift).along).toBeCloseTo((S * D) / 2, 6);
    let top = 0;
    for (let p = D; p < 1; p += 0.01) {
      const f = footAt(p, S, D, lift);
      expect(f.up).toBeGreaterThanOrEqual(0);
      top = Math.max(top, f.up);
    }
    expect(top).toBeCloseTo(lift, 2);
  });
});

/** Runs a motion for `seconds` in steps of a sixtieth, returning the headings it went through. */
function drive(m = newMotion(0), ask: Parameters<typeof stepMotion>[1], seconds: number): number[] {
  const out: number[] = [];
  for (let t = 0; t < seconds - 1e-9; t += 1 / 60) {
    stepMotion(m, ask, 1 / 60);
    out.push(m.heading);
  }
  return out;
}

describe("turning, starting and stopping, not locked on", () => {
  it("turns at a limited rate, faster standing than at a run, and goes the way it faces (no sliding sideways)", () => {
    const m = newMotion(0);
    stepMotion(m, { want: 90, speed: 3.5 }, 1 / 60);
    expect(m.heading).toBeCloseTo(LOCO.turnStill / 60, 6);
    // Up to speed going north, then asked east: no faster than the run's rate.
    const run = newMotion(0);
    drive(run, { want: 0, speed: 3.5 }, 1);
    expect(Math.hypot(run.vx, run.vy)).toBeCloseTo(3.5, 6);
    stepMotion(run, { want: 90, speed: 3.5 }, 1 / 60);
    expect(run.heading).toBeLessThanOrEqual(LOCO.turnRun / 60 + 1e-9);
    // Its way over the ground is the way it faces.
    const r = (run.heading * Math.PI) / 180;
    expect(Math.atan2(run.vx, run.vy)).toBeCloseTo(r, 6);
  });

  it("speeds up and slows down over a moment, and does not set off the wrong way", () => {
    const m = newMotion(0);
    const speeds: number[] = [];
    for (let k = 0; k < 30; k++) speeds.push(stepMotion(m, { want: 0, speed: 3.5 }, 1 / 60));
    expect(speeds[0]).toBeCloseTo(LOCO.accel / 60, 6);
    expect(speeds.at(-1)).toBeCloseTo(3.5, 6);
    // Let go: down to a stop at the slowing rate.
    expect(stepMotion(m, { speed: 0 }, 1 / 60)).toBeCloseTo(3.5 - LOCO.decel / 60, 6);
    drive(m, { speed: 0 }, 1);
    expect(Math.hypot(m.vx, m.vy)).toBe(0);
    // Standing, asked to go back the way it faces: it turns before it goes.
    const back = newMotion(0);
    stepMotion(back, { want: 180, speed: 3.5 }, 1 / 60);
    expect(Math.hypot(back.vx, back.vy)).toBe(0);
  });

  it("plants and pivots for a sharp reversal at speed, instead of a slow spin running round", () => {
    const m = newMotion(0);
    drive(m, { want: 0, speed: 3.5 }, 1);
    const headings = drive(m, { want: 180, speed: 3.5 }, 0.6);
    // The pivot: slowing hard, and round in about its time.
    const round = headings.findIndex((h) => Math.abs(turnBetween(h, 180)) < 1);
    expect(round).toBeGreaterThan(0);
    expect(round / 60).toBeLessThanOrEqual(LOCO.pivotTime + 0.02);
    // It went no further than a stride or so the old way, and ends up going the new way.
    expect(m.vy).toBeLessThan(-1);
    expect(Math.abs(m.vx)).toBeLessThan(1e-6);
  });
});

describe("locked on: facing the foe, stepping any way", () => {
  it("faces the foe whichever way it goes, and goes the way the stick asks", () => {
    for (const want of [0, 45, 90, 135, 180, 225, 270, 315]) {
      const m = newMotion(0);
      drive(m, { want, speed: 3.5, face: 0 }, 1);
      expect(m.heading).toBe(0);
      expect(((Math.atan2(m.vx, m.vy) * 180) / Math.PI + 360) % 360).toBeCloseTo(want % 360, 6);
      expect(Math.hypot(m.vx, m.vy)).toBeCloseTo(3.5 * strafePace(want), 6);
    }
  });

  it("turns to its foe at a limited rate", () => {
    const m = newMotion(0);
    stepMotion(m, { speed: 0, face: 90 }, 1 / 60);
    expect(m.heading).toBeCloseTo(LOCO.faceRate / 60, 6);
  });

  it("goes round on a circle with a side held, not out of it", () => {
    const centre: Pt = [10, 20];
    let p: Pt = [10, 13];
    const m = newMotion(0);
    const out: Pt = [0, 0];
    for (let k = 0; k < 600; k++) {
      // The stick held left, read against the line to the foe (up the screen goes at it).
      const face = ((Math.atan2(centre[0] - p[0], centre[1] - p[1]) * 180) / Math.PI + 360) % 360;
      const want = stickBearing(-1, 0, face).bearing!;
      stepMotion(m, { want, speed: 3.5, face }, 1 / 60);
      const next: Pt = [p[0] + m.vx / 60, p[1] + m.vy / 60];
      keepCircle(p, next, centre, out);
      p = [out[0], out[1]];
    }
    // Ten seconds round it, about two and a half times, and still 7 m from it.
    expect(Math.abs(Math.hypot(p[0] - centre[0], p[1] - centre[1]) - 7)).toBeLessThan(0.005);
  });

  it("goes in and out of the circle as far as the step goes at the foe or away", () => {
    const out: Pt = [0, 0];
    keepCircle([0, -5], [0, -4], [0, 0], out);
    expect(Math.hypot(out[0], out[1])).toBeCloseTo(4, 9);
    keepCircle([0, -5], [0.3, -5.3], [0, 0], out);
    expect(Math.hypot(out[0], out[1])).toBeCloseTo(5.3, 9);
  });
});

describe("the stick read against the camera", () => {
  it("is a way on the screen: up the way the camera looks, right a quarter turn clockwise of it", () => {
    expect(stickBearing(0, 1, 90).bearing).toBeCloseTo(90, 9);
    expect(stickBearing(1, 0, 90).bearing).toBeCloseTo(180, 9);
    expect(stickBearing(-1, 0, 90).bearing).toBeCloseTo(0, 9);
    expect(stickBearing(0, -1, 90).bearing).toBeCloseTo(270, 9);
    expect(stickBearing(0, 0, 90)).toEqual({ amount: 0 });
    // A little tilt is a little speed; pushed past the edge it is all of it.
    expect(stickBearing(0.3, 0, 0).amount).toBeCloseTo(0.3, 9);
    expect(stickBearing(1, 1, 0).amount).toBe(1);
  });

  it("holds the camera's bearing while the stick is held one way, so that a camera swinging round does not swing the walker", () => {
    const l = newLatch();
    expect(latchView(l, -1, 0, 30)).toBe(30);
    // The camera comes round behind the walker; "left" still means the left it meant.
    for (const view of [40, 70, 110]) expect(latchView(l, -1, 0, view)).toBe(30);
    // A small wobble of the thumb keeps it; a swing past the limit takes the camera afresh.
    expect(latchView(l, -1, 0.2, 120)).toBe(30);
    expect(latchView(l, 0, 1, 120)).toBe(120);
    // Let go and pushed again: afresh.
    expect(latchView(l, 0, 0, 200)).toBe(200);
    expect(latchView(l, 0, 1, 210)).toBe(210);
  });
});

describe("the dodge's way, and how it reads", () => {
  it("reads as a roll forward, a hop back or a side-step, against the way the walker faces", () => {
    expect(dodgeWay(10, 0)).toBe("F");
    expect(dodgeWay(180, 0)).toBe("B");
    expect(dodgeWay(90, 0)).toBe("R");
    expect(dodgeWay(270, 0)).toBe("L");
    expect(dodgeWay(0, 90)).toBe("L");
    expect(dodgeWay(225, 90)).toBe("B");
  });

  it("each of them plays within the dodge's time and lets go of the walk after it", () => {
    const p = newPose();
    for (const m of ["dodgeF", "dodgeB", "dodgeL", "dodgeR"] as const) {
      expect(MOVES[m].keys.at(-1)!.t).toBeLessThanOrEqual(PLAYER.dodgeTime + 1e-9);
      expect(sampleMove(m, PLAYER.dodgeTime / 2, p)).toBe(1);
      expect(sampleMove(m, MOVES[m].out![1], p)).toBe(0);
    }
    // The roll is a whole turn, heels over head: done as the dodge ends.
    sampleMove("dodgeF", PLAYER.dodgeTime, p);
    expect(p.roll).toBeCloseTo(Math.PI * 2, 9);
    sampleMove("dodgeF", 0.15, p);
    expect(p.roll).toBeCloseTo(Math.PI, 9);
    // The two side-steps are each other's mirror.
    const l = newPose();
    const r = newPose();
    sampleMove("dodgeL", 0.15, l);
    sampleMove("dodgeR", 0.15, r);
    expect(l.bank).toBeCloseTo(-r.bank, 9);
    expect(l.rUp[0]).toBeCloseTo(-r.lUp[0], 9);
  });

  it("flinches from the way a blow came: all of one straight on, a blend between", () => {
    const a = newPose();
    const b = newPose();
    for (const [rel, m] of [
      [0, "flinchF"],
      [180, "flinchB"],
      [-90, "flinchL"],
      [90, "flinchR"],
    ] as const) {
      sampleFlinch(rel, 0.06, a);
      sampleMove(m, 0.06, b);
      expect(a.lean, m).toBeCloseTo(b.lean, 6);
      expect(a.bank, m).toBeCloseTo(b.bank, 6);
    }
    // From in front and to the right: half and half.
    const f = newPose();
    const r = newPose();
    sampleMove("flinchF", 0.06, f);
    sampleMove("flinchR", 0.06, r);
    sampleFlinch(45, 0.06, a);
    expect(a.lean).toBeCloseTo((f.lean + r.lean) / 2, 6);
    expect(a.bank).toBeCloseTo((f.bank + r.bank) / 2, 6);
  });
});

// The rules: the stick's way in a step of the game.
function host(): QuestHost {
  return { spot: (near) => [near[0] + 500, near[1]], place: (near) => ({ name: "Hall", at: [near[0], near[1] + 100] }), random: () => 0.5 };
}
function quiet(): StudyQuest {
  const g = new StudyQuest(host(), [0, 0], 0, LESSONS);
  g.grace = 0;
  g.foes = [];
  return g;
}
const input = (heading: number, move?: number): PlayerInput => ({ at: [0, 0], heading, move, active: true, pace: 1 });
function foe(g: StudyQuest, kind: Foe["kind"], at: Pt): Foe {
  const f = g.spawn(kind, at);
  f.state = "chase";
  f.t = 0;
  f.cool = 99;
  return f;
}

describe("the rules: the stick's way, the lunge and the stagger", () => {
  it("dodges the way the stick asks, read against the camera; with the stick let go, back", () => {
    for (const [move, want] of [
      [90, 90],
      [200, 200],
      [undefined, 180],
    ] as const) {
      const g = quiet();
      g.act("dodge");
      const evs = g.step(0.05, input(0, move));
      const d = evs.find((e): e is Extract<GameEvent, { type: "dodge" }> => e.type === "dodge")!;
      expect(d.dir).toBeCloseTo(want, 9);
      const s = g.orders.shove;
      expect(((Math.atan2(s[0], s[1]) * 180) / Math.PI + 360) % 360).toBeCloseTo(want, 6);
      // Its own steering held meanwhile: the dodge carries it.
      expect(g.orders.slow).toBe(0);
    }
  });

  it("keeps the old dodge for a walker whose input leaves the stick out: along the way it faces", () => {
    const g = quiet();
    g.act("dodge");
    const evs = g.step(0.05, { at: [0, 0], heading: 90, active: true, pace: 1 });
    expect(evs).toContainEqual(expect.objectContaining({ type: "dodge", dir: 90 }));
  });

  it("aims a blow the way the stick asks at the start of the swing, at the nearest foe that way, else at the one it faces", () => {
    const g = quiet();
    // One to the east, one to the north; facing north, the stick pushed east.
    foe(g, "distraction", [4, 0]);
    foe(g, "distraction", [0, 4]);
    g.act("strike");
    let evs = g.step(0.05, input(0, 80));
    expect(evs.find((e) => e.type === "swing")).toMatchObject({ dir: 90 });
    // The stick pushed west, where there is none: the one it faces.
    run(g, 1);
    g.act("strike");
    evs = g.step(0.05, input(0, 270));
    expect(evs.find((e) => e.type === "swing")).toMatchObject({ dir: 0 });
  });

  it("lunges each blow's length, a little more at a foe a little out of reach, spread over the wind-up", () => {
    expect(lungeMetres(0)).toBe(PLAYER.lunge[0]);
    expect(lungeMetres(2)).toBe(PLAYER.lunge[2]);
    expect(lungeMetres(0, 1)).toBe(PLAYER.lunge[0]);
    expect(lungeMetres(0, PLAYER.lungeFrom + 0.2)).toBeCloseTo(PLAYER.lunge[0] + 0.2, 9);
    expect(lungeMetres(1, 10)).toBeCloseTo(PLAYER.lunge[1] + PLAYER.lungeReach, 9);
    for (const combo of [0, 1, 2]) {
      const g = quiet();
      const f = foe(g, "exam", [0, 6]);
      f.cool = 99;
      g.combo = combo - 1;
      g.comboT = combo ? 1 : 0;
      g.act("strike");
      let went = 0;
      let steps = 0;
      const dt = 1 / 120;
      // Before the blow lands, the whole lunge (it reaches from where it ends); no jump in one step.
      for (let t = 0; t < PLAYER.strikeContact[combo]! - 1e-9; t += dt) {
        g.step(dt, input(0));
        const d = Math.hypot(...g.orders.shove);
        expect(d).toBeLessThan(lungeMetres(combo, 6 - 2.5) / 2);
        went += d;
        steps++;
      }
      expect(steps).toBeGreaterThan(5);
      const gap = 6 - FOES.exam.radius;
      expect(went).toBeCloseTo(lungeMetres(combo, gap), 6);
    }
  });

  it("stops a lunge at the boss's edge: blow after blow, holding forward into it, the walker never goes in", () => {
    for (const from of [2.6, 3, 4, 5.5]) {
      const g = quiet();
      const boss = foe(g, "exam", [0, from]);
      boss.cool = 99;
      boss.hp = 1e7;
      const edge = FOES.exam.body! + PLAYER.body;
      let p: Pt = [0, 0];
      let nearest = Infinity;
      const dt = 1 / 60;
      for (let k = 0; k < 6 * 60; k++) {
        // Five blows in a row, then on; walking at a run straight at the boss all the while, as the
        // scene does: its own steering (slowed as the rules say), then the rules' push.
        if (k % 20 === 0 && k < 100) g.act("strike");
        boss.at = [0, from];
        const step = 3.5 * g.orders.slow * dt;
        p = [p[0], p[1] + step];
        g.step(dt, { at: p, heading: 0, move: 0, active: true, pace: 1 });
        boss.at = [0, from];
        p = [p[0] + g.orders.shove[0], p[1] + g.orders.shove[1]];
        nearest = Math.min(nearest, Math.hypot(p[0] - boss.at[0], p[1] - boss.at[1]));
      }
      // At its edge, no further: within one frame's walk of it (the rules see a step the frame after).
      expect(nearest, `from ${from} m`).toBeGreaterThan(edge - 3.5 * dt - 1e-6);
      expect(nearest).toBeLessThan(edge + 0.05);
    }
  });

  it("lands each blow when it did: the wind-up's time after the press", () => {
    for (const combo of [0, 2]) {
      const g = quiet();
      const f = foe(g, "distraction", [0, 2]);
      f.hp = 1e6;
      g.combo = combo - 1;
      g.comboT = combo ? 1 : 0;
      g.act("strike");
      const dt = 0.005;
      let when = -1;
      for (let t = 0; t < 0.4 && when < 0; t += dt) if (g.step(dt, input(0)).some((e) => e.type === "hit")) when = t;
      expect(when).toBeCloseTo(PLAYER.strikeContact[combo]! - dt, 2);
    }
    expect(PLAYER.strikeContact).toEqual([0.09, 0.09, 0.17]);
  });

  it("knocks the walker back over a stagger, slowed meanwhile, not all at once", () => {
    const g = quiet();
    const f = foe(g, "distraction", [0, 1]);
    f.state = "tell";
    f.t = 0.01;
    f.move = { type: "melee" };
    const dt = 1 / 60;
    let went = 0;
    let most = 0;
    let slowed = 0;
    for (let t = 0; t < 0.6; t += dt) {
      g.step(dt, input(0));
      const d = Math.hypot(...g.orders.shove);
      went += d;
      most = Math.max(most, d);
      if (g.orders.slow === PLAYER.staggerSlow) slowed += dt;
    }
    expect(went).toBeCloseTo(PLAYER.knockMetres, 6);
    expect(most).toBeLessThan(PLAYER.knockMetres / 5);
    expect(slowed).toBeGreaterThan(PLAYER.staggerTime - 2 * dt);
    expect(slowed).toBeLessThan(PLAYER.staggerTime + 2 * dt);
  });

  it("holds the walker's own steering back while a blow is under way: its feet are set", () => {
    const g = quiet();
    g.act("strike");
    g.step(0.05, input(0));
    expect(g.orders.slow).toBe(PLAYER.strikeSlow);
    run(g, PLAYER.strikeTime[0]!);
    g.step(0.05, input(0));
    expect(g.orders.slow).toBe(1);
  });

  it("lets a dodge cut short a blow's recovery, and its lunge", () => {
    const g = quiet();
    g.act("strike");
    g.step(PLAYER.strikeContact[0]! + 0.02, input(0, 0));
    expect(g.strikeT).toBeGreaterThan(0);
    g.act("dodge");
    const evs = g.step(0.02, input(0, 90));
    expect(evs).toContainEqual(expect.objectContaining({ type: "dodge", dir: 90 }));
    expect(g.strikeT).toBe(0);
    // Its shove is the dodge's alone, to the east.
    expect(Math.abs(g.orders.shove[1])).toBeLessThan(1e-9);
  });
});

function run(g: StudyQuest, seconds: number): void {
  for (let t = 0; t < seconds - 1e-9; t += 0.05) g.step(0.05, input(0));
}
