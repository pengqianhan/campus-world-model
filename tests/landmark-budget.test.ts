import { describe, expect, it } from "vitest";
import { withinBudget } from "../src/scene/landmarkBudget.ts";

const at = (...distances: number[]) => distances.map((distance) => ({ distance, held: false }));

describe("withinBudget: the landmarks the map draws at once", () => {
  it("takes the nearest first", () => {
    expect(withinBudget(at(300, 50, 120, 10), 4, 0)).toEqual([3, 1, 2, 0]);
  });

  it("takes no more than the budget", () => {
    expect(withinBudget(at(300, 50, 120, 10, 80), 2, 0)).toEqual([3, 1]);
    expect(withinBudget(at(300, 50), 0, 0)).toEqual([]);
    expect(withinBudget(at(300, 50), -1, 0)).toEqual([]);
  });

  it("takes all of them when they are fewer than the budget", () => {
    expect(withinBudget(at(40), 3, 0)).toEqual([0]);
  });

  it("keeps the order given for equal distances, whatever the budget", () => {
    expect(withinBudget(at(70, 70, 70), 3, 0)).toEqual([0, 1, 2]);
    expect(withinBudget(at(90, 70, 70, 70), 2, 0)).toEqual([1, 2]);
    // The same on every call: the order does not change from one frame to the next.
    for (let k = 0; k < 5; k++) expect(withinBudget(at(70, 70, 70), 1, 0)).toEqual([0]);
  });

  it("gives nothing when nothing is wanted", () => {
    expect(withinBudget([], 3, 10)).toEqual([]);
  });

  it("keeps a landmark that was within the budget until another is nearer by more than the hold", () => {
    // 0 was drawn; 1 is now 5 m nearer, less than the 10 m hold: 0 stays.
    expect(withinBudget([{ distance: 100, held: true }, { distance: 95, held: false }], 1, 10)).toEqual([0]);
    // 1 is now 15 m nearer, more than the hold: 1 takes the place.
    expect(withinBudget([{ distance: 100, held: true }, { distance: 85, held: false }], 1, 10)).toEqual([1]);
    // Back and forth about the same distance, the one drawn stays drawn.
    let held = [true, false];
    for (const d of [99, 101, 98, 102, 100]) {
      const [k] = withinBudget([{ distance: 100, held: held[0]! }, { distance: d, held: held[1]! }], 1, 10);
      held = [k === 0, k === 1];
      expect(k).toBe(0);
    }
  });
});
