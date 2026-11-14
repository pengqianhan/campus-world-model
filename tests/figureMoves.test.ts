import { describe, expect, it } from "vitest";
import { PLAYER } from "../src/shared/game.ts";
import { MOVES, moveLength, newPose, sampleMove, type Move } from "../src/scene/figureMoves.ts";

const ALL = Object.keys(MOVES) as Move[];

describe("the walker's moves in the game", () => {
  it("strike with the highlighter as each blow lands, and let the card go as it leaves the hand", () => {
    for (const k of [0, 1, 2] as const) {
      const keys = MOVES[`strike${k}`].keys;
      expect(keys.some((key) => key.t === PLAYER.strikeContact[k])).toBe(true);
      // A wind-up before it, and a follow-through after.
      expect(keys[0]!.t).toBeLessThan(PLAYER.strikeContact[k]);
      expect(keys.at(-1)!.t).toBeGreaterThan(PLAYER.strikeContact[k]);
      // The trail is drawn round the moment it lands.
      const [a, b] = MOVES[`strike${k}`].trail!;
      expect(a).toBeLessThan(PLAYER.strikeContact[k]);
      expect(b).toBeGreaterThan(PLAYER.strikeContact[k]);
    }
    expect(MOVES.card.keys.some((key) => key.t === PLAYER.cardRelease)).toBe(true);
  });

  it("come in, hold, and let go of the walk again, every arm pointing somewhere", () => {
    const p = newPose();
    for (const m of ALL) {
      let peak = 0;
      for (let t = 0; t < Math.min(moveLength(m), 2); t += 1 / 60) {
        const w = sampleMove(m, t, p);
        expect(w).toBeGreaterThanOrEqual(0);
        expect(w).toBeLessThanOrEqual(1);
        peak = Math.max(peak, w);
        for (const v of [p.rUp, p.rFo, p.lUp, p.lFo]) expect(Math.hypot(...v)).toBeCloseTo(1, 5);
      }
      expect(peak).toBe(1);
      expect(sampleMove(m, 0, p)).toBe(0);
      if (m === "down") expect(sampleMove(m, 5, p)).toBe(1);
      else expect(sampleMove(m, moveLength(m), p)).toBe(0);
    }
  });

  it("swing the forehand from the right to the left and the backhand back", () => {
    const p = newPose();
    sampleMove("strike0", MOVES.strike0.keys[0]!.t, p);
    expect(p.rUp[0]).toBeGreaterThan(0.5);
    sampleMove("strike0", PLAYER.strikeContact[0] + 0.08, p);
    expect(p.rFo[0]).toBeLessThan(-0.5);
    sampleMove("strike1", PLAYER.strikeContact[1] + 0.08, p);
    expect(p.rFo[0]).toBeGreaterThan(0.5);
    // The slam: both hands over the head, then down in front.
    sampleMove("strike2", MOVES.strike2.keys[0]!.t, p);
    expect(p.rUp[1]).toBeGreaterThan(0.8);
    expect(p.lUp[1]).toBeGreaterThan(0.8);
    sampleMove("strike2", PLAYER.strikeContact[2], p);
    expect(p.rFo[2]).toBeLessThan(-0.5);
  });

  it("keep the slam's hands wide of the head and over it as it winds up, never through it", () => {
    // The figure about as built (figureBuild.ts): shoulders 0.17 m either side at 1.42 m, upper arm
    // 0.28 m, forearm 0.26 m; the head a ball about 0.12 m across each way, its middle at 1.62 m.
    const p = newPose();
    const hand = (up: readonly number[], fo: readonly number[], side: number) => [side * 0.17 + up[0]! * 0.28 + fo[0]! * 0.26, 1.42 + up[1]! * 0.28 + fo[1]! * 0.26, up[2]! * 0.28 + fo[2]! * 0.26];
    const end = PLAYER.strikeContact[2] * 0.86;
    for (let t = MOVES.strike2.keys[0]!.t; t <= end + 1e-9; t += 0.005) {
      sampleMove("strike2", t, p);
      for (const [h, side] of [
        [hand(p.rUp, p.rFo, 1), 1],
        [hand(p.lUp, p.lFo, -1), -1],
      ] as const) {
        // Out past the head's side, or above its top: in front of the face is where it went wrong.
        const wide = side * h[0]! > 0.24;
        const over = h[1]! > 1.62 + 0.2;
        expect(wide || over).toBe(true);
        expect(Math.hypot(h[0]!, h[1]! - 1.62, h[2]!)).toBeGreaterThan(0.25);
      }
    }
  });
});
