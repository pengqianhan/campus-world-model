// The hall behind the chapel (parts/common.js MEASURED.hall): two end rooms and the walk-ways along the
// middle under one flat roof, and the middle room's walls rising to a very low gable. Rough: plain
// walls, until the references show what they are made of.
import { MEASURED as M, FOOT } from "./common.js";
import { gable } from "./shapes.js";

export function hall(b) {
  const H = M.hall;
  for (const k of ["nearEnd", "farEnd"]) {
    const { x, z } = H[k];
    b.box(x[0], x[1], FOOT, H.top - 0.25, z[0], z[1], "smooth");
    b.box(x[0], x[1], H.top - 0.25, H.top, z[0], z[1], "dressed");
  }
  const { x } = H.middle, R = H.raised;
  b.box(x[0], x[1], FOOT, R.eave, H.middle.z[0], H.middle.z[1], "smooth");
  for (const [z0, z1] of H.walks.z) b.box(x[0], x[1], H.top - 0.25, H.top, z0, z1, "dressed");
  gable(b, R.x[0], R.x[1], R.z[0], R.z[1], R.eave, R.ridge, R.ridgeZ, "roof");
}
