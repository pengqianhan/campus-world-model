// The rough massing from the LiDAR (parts/common.js): plain blocks with flat roofs, and the tall hall
// with its gable. The baseline for the first round; nothing here comes from a photograph.
import * as THREE from "three";
import { MEASURED as M } from "./common.js";

const FLAT = ["main", "frontLeft", "entrance", "frontRight", "backRight", "backLeft"];

export function blocks(b) {
  for (const k of FLAT) {
    const { x, z, top } = M[k];
    b.box(x[0], x[1], -0.4, top - 0.3, z[0], z[1], "smooth");
    b.box(x[0] - 0.1, x[1] + 0.1, top - 0.3, top, z[0] - 0.1, z[1] + 0.1, "dressed");
  }
}

export function hall(b) {
  const { from, to, width, eave, ridge } = M.hall;
  const dx = to[0] - from[0], dz = to[1] - from[1], len = Math.hypot(dx, dz);
  // built along +z about the origin, then turned and moved onto the line from `from` to `to`
  b.matrix = new THREE.Matrix4().makeRotationY(Math.atan2(dx, dz)).setPosition((from[0] + to[0]) / 2, 0, (from[1] + to[1]) / 2);
  b.box(-width / 2, width / 2, -0.4, eave, -len / 2, len / 2, "smooth");
  const s = new THREE.Shape([new THREE.Vector2(-width / 2 - 0.3, eave), new THREE.Vector2(width / 2 + 0.3, eave), new THREE.Vector2(0, ridge)]);
  const g = new THREE.ExtrudeGeometry(s, { depth: len + 0.6, bevelEnabled: false });
  g.translate(0, 0, -len / 2 - 0.3);
  b.add(g, "roof");
  b.matrix = null;
}
