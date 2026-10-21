// The south-west range on Symonds Street: the heritage face of the 2022-09 panoramas (red brick, cream
// dressings, ten bays between two cream pavilions with giant columns in antis), and the corner pavilion's
// face on Grafton Road. The faces are drawn in parts/southwest_range.js; here, the mass behind them and the
// low roof behind the parapet, in the range's own frame (x' across, negative outward; z' along it toward
// Grafton Road), turned into place with swMatrix().
import * as THREE from "three";
import { SW, swMatrix } from "./common.js";
import { southwestRange, FACE, BACK, CORNER, NWP, CEP } from "./southwest_range.js";

export function southwest(b) {
  southwestRange(b);
  b.matrix = swMatrix();
  // the mass behind the faces, up to the cornice's top (its top is under the roof); behind the pavilions it
  // starts behind their recessed bays (0.6 m in, 0.3 m thick), so that their doors and windows show
  b.box(FACE + 0.35, SW.inner, -0.6, 13.95, NWP.u1, CEP.u0, "brick");
  for (const [z0, z1] of [[BACK + 0.35, NWP.u1], [CEP.u0, CORNER]]) b.box(FACE + 0.95, SW.inner, -0.6, 13.95, z0, z1, "brick");
  // the low roof behind the parapet: its ridge along z' at x' -19.5, its eaves at the parapet's back
  const wall = FACE + 0.1;
  const s = new THREE.Shape([
    new THREE.Vector2(wall, 13.9), new THREE.Vector2(SW.inner, 13.9),
    new THREE.Vector2(SW.inner, SW.valley), new THREE.Vector2(SW.ridge.x, SW.ridge.y), new THREE.Vector2(wall, 14.15),
  ]);
  const g = new THREE.ExtrudeGeometry(s, { depth: CORNER - BACK - 0.3, bevelEnabled: false });
  g.translate(0, 0, BACK + 0.15);
  b.add(g, "roofPale");
  b.matrix = null;
  // the corner pavilion's mass behind its Grafton Road face (view frame), from the range back to x -10.3
  b.box(-17.6, -10.3, -1.2, 13.95, 15.6, 22.05, "render");
}
