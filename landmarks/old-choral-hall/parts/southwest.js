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
  // the mass's inner side, which no photograph shows (the middle range stands against it): plain, as the rest of
  // the building is (parts/rest.js), 2 cm in front of the brick, over its whole length and height. Below the
  // rest's flat top it stands inside the rest; above it, and at its front end by the recess, it is what shows.
  const inner = new THREE.PlaneGeometry(CORNER - BACK - 0.35, 13.95 + 0.6);
  inner.rotateY(Math.PI / 2);   // facing +x', away from the street
  inner.translate(SW.inner + 0.02, (13.95 - 0.6) / 2, (CORNER + BACK + 0.35) / 2);
  b.add(inner, "plain");
  // the low roof behind the parapet: its ridge along z' at x' -19.5, its eaves at the parapet's back
  const wall = FACE + 0.1;
  const s = new THREE.Shape([
    new THREE.Vector2(wall, 13.9), new THREE.Vector2(SW.inner, 13.9),
    new THREE.Vector2(SW.inner, SW.valley), new THREE.Vector2(SW.ridge.x, SW.ridge.y), new THREE.Vector2(wall, 14.15),
  ]);
  const g = new THREE.ExtrudeGeometry(s, { depth: CORNER - BACK - 0.3, bevelEnabled: false });
  g.translate(0, 0, BACK + 0.15);
  b.add(g, "roofGrey");
  b.matrix = null;
  // the corner pavilion's mass behind its Grafton Road face (view frame), from the range back to x -10.3,
  // stopping behind the face's recessed bay (0.6 m in, 0.3 m thick) so that its windows show
  b.box(-17.6, -10.3, -1.2, 13.95, 15.6, 21.1, "render");
}
