import { describe, expect, it } from "vitest";
import type { Ring } from "../src/shared/geo.ts";
import { RoofMap } from "../src/shared/roofmap.ts";

const square = (x0: number, y0: number, size: number): Ring => [
  [x0, y0],
  [x0 + size, y0],
  [x0 + size, y0 + size],
  [x0, y0 + size],
];

describe("how high the buildings reach, for a drone", () => {
  // A low block with a courtyard, a tower standing in the courtyard, and a block across two of the
  // squares the shapes are filed under.
  const roofs = new RoofMap([
    { rings: [square(0, 0, 30), square(10, 10, 10)], top: 20 },
    { rings: [square(12, 12, 4)], top: 55 },
    { rings: [square(70, -10, 30)], top: 32 },
  ]);

  it("answers with the highest top over a point, and nothing where nothing stands", () => {
    expect(roofs.at([5, 5])).toBe(20);
    expect(roofs.at([14, 14])).toBe(55);
    // In the courtyard, away from the tower: open sky.
    expect(roofs.at([11, 19])).toBeUndefined();
    expect(roofs.at([50, 50])).toBeUndefined();
    // A shape across the edge of a square is found from either side of it.
    expect(roofs.at([79, -5])).toBe(32);
    expect(roofs.at([81, 5])).toBe(32);
  });

  it("finds a roof within the reach of the rotors", () => {
    expect(roofs.at([31, 5])).toBeUndefined();
    expect(roofs.near([31, 5], 1.5)).toBe(20);
    expect(roofs.near([40, 5], 1.5)).toBeUndefined();
  });

  it("finds the highest roof along a straight line", () => {
    expect(roofs.along([-20, 14], [60, 14])).toBe(55);
    expect(roofs.along([-20, 25], [60, 25])).toBe(20);
    expect(roofs.along([40, 40], [60, 60])).toBeUndefined();
  });

  it("leaves out a shape with no outline or no height", () => {
    const empty = new RoofMap([
      { rings: [], top: 10 },
      { rings: [square(0, 0, 5)], top: NaN },
    ]);
    expect(empty.at([2, 2])).toBeUndefined();
  });
});
