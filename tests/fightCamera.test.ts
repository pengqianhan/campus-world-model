import { describe, expect, it } from "vitest";
import { frameFight, type FightFrame, type FightShot } from "../src/shared/fightCamera.ts";

const HALF = (55 * Math.PI) / 360;
const UP = Math.tan((16 * Math.PI) / 180);
const WIDE = Math.tan(HALF) * (1280 / 800);
const UPRIGHT = Math.tan(HALF) * (390 / 664);

/** A walker on the ground and a foe `ahead` metres beyond it, `top` metres tall and `half` either side. */
function shot(ahead: number, top: number, half = 1, more: Partial<FightShot> = {}): FightShot {
  return {
    walkerFoot: 0,
    walkerTop: 1.9,
    base: 1.6,
    tanUp: UP,
    ahead,
    foeFoot: 0,
    foeTop: top,
    foeHalf: half,
    halfFov: HALF,
    tanHalfWide: WIDE,
    minReach: 7.2,
    maxReach: 26,
    top: 0.09,
    bottom: 0.76,
    foeBottom: 0.76,
    wide: 0.7,
    ...more,
  };
}

/** Where a point `along` metres from the camera over the ground, at a height, is in the picture: a share of its height from the top. */
function at(f: FightFrame, along: number, height: number): number {
  const camera = 1.6 + f.reach * UP;
  return (1 - Math.tan(Math.atan2(height - camera, along) - f.pitch) / Math.tan(HALF)) / 2;
}

const frame = (s: FightShot) => frameFight(s, { reach: 0, pitch: 0 });

describe("frameFight", () => {
  it("keeps the near distance when a small foe already fits", () => {
    const f = frame(shot(6, 2.8));
    expect(f.reach).toBeCloseTo(7.2);
    expect(at(f, f.reach, 0)).toBeLessThanOrEqual(0.76);
    expect(at(f, f.reach + 6, 2.8)).toBeGreaterThanOrEqual(0.09);
  });

  it("stands back for the whole of a tall boss, in the clear band, the walker's feet in it too", () => {
    for (const ahead of [2, 4, 8, 13, 20]) {
      const f = frame(shot(ahead, 11.7, 4.2));
      if (ahead <= 8) expect(f.reach).toBeGreaterThan(7.2);
      expect(f.reach).toBeLessThan(26);
      expect(at(f, f.reach, 0)).toBeLessThanOrEqual(0.761);
      expect(at(f, f.reach + ahead, 0)).toBeLessThanOrEqual(0.761);
      expect(at(f, f.reach + ahead, 11.7)).toBeGreaterThanOrEqual(0.089);
    }
  });

  it("upright on a phone, keeps the boss under the panels at the top and over the buttons, the walker between them", () => {
    for (const ahead of [3, 8, 13]) {
      const f = frame(shot(ahead, 11.7, 4.2, { tanHalfWide: UPRIGHT, top: 0.25, bottom: 0.86, foeBottom: 0.64, wide: 0.8 }));
      expect(f.reach).toBeLessThan(26);
      expect(at(f, f.reach + ahead, 11.7)).toBeGreaterThanOrEqual(0.249);
      expect(at(f, f.reach + ahead, 0)).toBeLessThanOrEqual(0.641);
      expect(at(f, f.reach, 0)).toBeLessThanOrEqual(0.861);
      expect((f.reach + ahead) * UPRIGHT * 0.8).toBeGreaterThanOrEqual(4.2);
    }
  });

  it("stands back further in a narrow picture, so that a wide foe fits across it", () => {
    const f = frame(shot(3, 11.7, 4.2, { tanHalfWide: UPRIGHT }));
    expect((f.reach + 3) * UPRIGHT * 0.7).toBeGreaterThanOrEqual(4.2);
    expect(f.reach).toBeGreaterThan(frame(shot(3, 11.7, 4.2)).reach);
  });

  it("goes no further than it may", () => {
    expect(frame(shot(0.5, 40, 1, { maxReach: 12 })).reach).toBe(12);
  });
});
