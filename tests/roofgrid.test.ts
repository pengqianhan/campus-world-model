import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from "three";
import { describe, expect, it } from "vitest";
import { RoofMap } from "../src/shared/roofmap.ts";
import { roofGrid } from "../src/scene/roofgrid.ts";

/** A box `w` east-west by `d` north-south and `h` high, standing on `base` with its middle at (east, north). */
function box(east: number, north: number, w: number, d: number, h: number, base: number): Mesh {
  const m = new Mesh(new BoxGeometry(w, h, d), new MeshBasicMaterial());
  // The scene's z is to the south.
  m.position.set(east, base + h / 2, -north);
  return m;
}

describe("the roofs of a model drawn in place of a building", () => {
  // A low wing 30 m by 10 m, 8 m high, and a tower 6 m square, 40 m high, at its east end; both on
  // ground at 50 m, in a group moved and turned as a landmark's is.
  const model = new Group();
  model.add(box(0, 0, 30, 10, 8, 0), box(12, 0, 6, 6, 40, 0));
  const landmark = new Group();
  landmark.add(model);
  landmark.position.set(100, 50, -200);
  const grid = roofGrid(landmark)!;
  const roofs = new RoofMap([], [grid]);

  it("is as high as the part over each point, not the model's highest point everywhere", () => {
    expect(roofs.at([90, 200])).toBeCloseTo(58, 3);
    expect(roofs.at([112, 201])).toBeCloseTo(90, 3);
  });

  it("is nothing beside the model, and its walls are its edges", () => {
    expect(roofs.at([100, 210])).toBeUndefined();
    expect(roofs.at([60, 200])).toBeUndefined();
    // Along the wing's south wall.
    expect(roofs.at([95, 195.2])).toBeCloseTo(58, 3);
  });

  it("is found along a line across it", () => {
    expect(roofs.along([80, 200], [120, 200])).toBeCloseTo(90, 3);
  });

  it("counts a mesh drawn twice once, and a model with no faces as nothing", () => {
    const twice = new Group();
    const a = box(0, 0, 4, 4, 4, 0);
    const b = new Mesh(a.geometry, new MeshBasicMaterial());
    b.position.copy(a.position);
    twice.add(a, b);
    expect(roofGrid(twice)!.top.filter((h) => h > -Infinity).length).toBeGreaterThan(0);
    expect(roofGrid(new Group())).toBeUndefined();
  });
});
