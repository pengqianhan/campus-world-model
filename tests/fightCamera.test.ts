import { describe, expect, it } from "vitest";
import { frameFight, type FightFrame, type FightShot } from "../src/shared/fightCamera.ts";

const HALF = (55 * Math.PI) / 360;
const UP = Math.tan((16 * Math.PI) / 180);
const WIDE = Math.tan(HALF) * (1280 / 800);

/** A walker on the ground and a foe `ahead` metres beyond it, `top` metres tall and `half` either side. */
function shot(ahead: number, top: number, half = 1, tanHalfWide = WIDE, maxReach = 26): FightShot {
  return { walkerFoot: 0, walkerTop: 1.9, base: 1.6, tanUp: UP, ahead, foeFoot: 0, foeTop: top, foeHalf: half, halfFov: HALF, tanHalfWide, minReach: 7.2, maxReach };
}

/** Whether a point `along` metres from the camera over the ground, at a height, is in the picture. */
function seen(f: FightFrame, along: number, height: number): boolean {
  const camera = 1.6 + f.reach * UP;
  return Math.abs(Math.atan2(height - camera, along) - f.pitch) <= HALF;
}

const frame = (s: FightShot) => frameFight(s, { reach: 0, pitch: 0 });

describe("frameFight", () => {
  it("keeps the near distance when a small foe already fits", () => {
    const f = frame(shot(6, 2.8));
    expect(f.reach).toBeCloseTo(7.2);
    expect(seen(f, f.reach, 0)).toBe(true);
    expect(seen(f, f.reach + 6, 2.8)).toBe(true);
  });

  it("stands back for the whole of a tall boss, the walker's feet in the picture too", () => {
    for (const ahead of [2, 4, 8, 13, 20]) {
      const f = frame(shot(ahead, 11.7, 4.2));
      if (ahead <= 8) expect(f.reach).toBeGreaterThan(7.2);
      expect(f.reach).toBeLessThan(26);
      expect(seen(f, f.reach, 0)).toBe(true);
      expect(seen(f, f.reach + ahead, 0)).toBe(true);
      expect(seen(f, f.reach + ahead, 11.7)).toBe(true);
    }
  });

  it("stands back further in a narrow picture, so that a wide foe fits across it", () => {
    const narrow = Math.tan(HALF) * (390 / 664);
    const f = frame(shot(3, 11.7, 4.2, narrow));
    expect((f.reach + 3) * narrow).toBeGreaterThanOrEqual(4.2);
    expect(f.reach).toBeGreaterThan(frame(shot(3, 11.7, 4.2)).reach);
  });

  it("frames the two a little above the middle of the picture", () => {
    const f = frame(shot(13, 10.5));
    const camera = 1.6 + f.reach * UP;
    const feet = Math.atan2(0 - camera, f.reach) - f.pitch;
    const top = Math.atan2(10.5 - camera, f.reach + 13) - f.pitch;
    expect(feet).toBeGreaterThan(-HALF * 0.9);
    expect(top).toBeLessThan(HALF * 0.95);
    expect(feet + top).toBeGreaterThan(0);
  });

  it("goes no further than it may", () => {
    expect(frame(shot(0.5, 40, 1, WIDE, 12)).reach).toBe(12);
  });
});
