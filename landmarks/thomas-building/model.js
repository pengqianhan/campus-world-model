// The Thomas Building (University of Auckland, building 110), drawn by rule from code alone. Each part
// lives in parts/ and is built here; a part that throws is logged and left out, so that one broken part
// never stops the others. `only` (the viewer's ?only=body,roofs) builds just those parts. Every
// landmark's model.js exports build(materials, only), which returns a Group.
// The parts are drawn in the building's own axes (u along its long faces, v across them) and turned
// here onto the view frame, whose x runs 1.04 deg off those faces (parts/common.js, SLOPE).
import * as THREE from "three";
import { Builder } from "../kit/gothic.js";
import { SLOPE } from "./parts/common.js";
import { body, parapets } from "./parts/body.js";
import { roofs, plant } from "./parts/roofs.js";
import { stair } from "./parts/stair.js";

const PARTS = {
  body: (b) => body(b),
  parapets: (b) => parapets(b),
  roofs: (b) => roofs(b),
  plant: (b) => plant(b),
  stair: (b) => stair(b),
};

// x = u cos t - v sin t, z = u sin t + v cos t: three.js turns (x, z) by -t about y for that.
const TURN = new THREE.Matrix4().makeRotationY(-Math.atan(SLOPE));

export function build(materials, only) {
  const b = new Builder(materials);
  for (const [name, part] of Object.entries(PARTS)) {
    if (only && !only.includes(name)) continue;
    const t0 = performance.now();
    b.matrix = TURN.clone();
    try { part(b); console.log(`part ${name}: ${(performance.now() - t0).toFixed(0)} ms`); }
    catch (e) { console.error(`part ${name} failed: ${e.stack}`); }
    b.matrix = null;
  }
  return b.build();
}
