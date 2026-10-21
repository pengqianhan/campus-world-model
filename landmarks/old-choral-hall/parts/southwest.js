// The south-west range: the heritage front of the 2022-09 panoramas (red brick, cream dressings, a pavilion
// at each end), turned 22.25 deg from the frame (parts/common.js, SW). Drawn in its own frame (x' across,
// negative outward; z' along it toward Symonds Street) and turned into place with swMatrix(). The baseline
// of round 1: a plain block, its parapet, its low roof, and the corner pavilion out to the street line.
import * as THREE from "three";
import { SW, FRONT, swMatrix } from "./common.js";

export function southwest(b) {
  b.matrix = swMatrix();
  const wall = SW.edge + 0.3;
  b.box(wall, SW.inner, -0.6, SW.parapet - 0.6, SW.back, SW.front, "brick");
  b.box(SW.edge, SW.inner, SW.parapet - 0.6, SW.parapet, SW.back - 0.3, SW.front + 0.3, "render");
  // the low roof behind the parapet: its ridge along z' at x' -19.5
  const s = new THREE.Shape([
    new THREE.Vector2(wall, SW.parapet - 0.6), new THREE.Vector2(SW.inner, SW.parapet - 0.6),
    new THREE.Vector2(SW.inner, SW.valley), new THREE.Vector2(SW.ridge.x, SW.ridge.y), new THREE.Vector2(wall, SW.parapet - 0.3),
  ]);
  const g = new THREE.ExtrudeGeometry(s, { depth: SW.front - SW.back - 0.4, bevelEnabled: false });
  g.translate(0, 0, SW.back + 0.2);
  b.add(g, "roofPale");
  b.matrix = null;
  // the corner pavilion's face on Symonds Street, out to the street line (rough)
  b.box(-17.2, -10, -0.6, 14.5, 17.5, FRONT.z, "render");
}
