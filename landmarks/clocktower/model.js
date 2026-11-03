// The Clock Tower building (University of Auckland, building 105), drawn by rule from code alone.
// Each part lives in parts/ and is built here; a part that throws is logged and left out, so that
// one broken part never stops the others. `only` (the viewer's ?only=tower,centre) builds just those
// parts. Every landmark's model.js exports build(materials, only), which returns a Group.
import { Builder } from "../kit/gothic.js";
import { PAV_LEFT, PAV_RIGHT, FOOT } from "./parts/common.js";
import { pavilion } from "./parts/pavilion.js";
import { centre } from "./parts/centre.js";
import { tower } from "./parts/tower.js";
import { ranges } from "./parts/ranges.js";

const PARTS = {
  pavilions: (b) => { pavilion(b, ...PAV_LEFT); pavilion(b, ...PAV_RIGHT); },
  centre: (b) => centre(b, -6.5, 6.0),
  tower: (b) => tower(b),
  ranges: (b) => ranges(b),
};

export function build(materials, only) {
  const b = new Builder(materials);
  for (const [name, part] of Object.entries(PARTS)) {
    if (only && !only.includes(name)) continue;
    const t0 = performance.now();
    try { part(b); console.log(`part ${name}: ${(performance.now() - t0).toFixed(0)} ms`); }
    catch (e) { console.error(`part ${name} failed: ${e.stack}`); b.matrix = null; }
  }
  return carryDown(b.build(), FOOT);
}

/**
 * Carries the model's feet `by` metres lower: every point the parts draw below the door's level (y = 0;
 * the walls' feet stand at 0 and -0.4) goes down by it, so that the walls and the steps that come down
 * to the ground reach the site's ground under them (parts/common.js, FOOT), and the faces that cross the
 * door's level stretch with them. Every such face is upright, so its normals hold.
 */
function carryDown(group, by) {
  for (const mesh of group.children) {
    const p = mesh.geometry.getAttribute("position");
    for (let i = 0; i < p.count; i++) if (p.getY(i) < 0.005) p.setY(i, p.getY(i) + by);
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
  }
  return group;
}
