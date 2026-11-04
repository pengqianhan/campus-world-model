// The atrium between the two ranges (parts/common.js, MEASURED.atrium): a glazed roof from range to range and
// its glazed end toward the court (estimated: the LiDAR sees little of the glass); and the low roof between the
// ranges south-west of it (MEASURED.low).
import { FOOT, MEASURED } from "./common.js";
import { prism, block } from "./shapes.js";

const M = MEASURED;

export function atrium(b) {
  const a = M.atrium;
  prism(b, a.plan, a.top - 0.2, a.top, "glassPale");
  // its end toward the court: a pane across from range to range, its ends inside both, its top and its face 5 cm
  // into the roof's and its foot 5 cm over the ranges' (still below the ground), so that no face of the pane lies in
  // the plane of another's
  const [p0, p1] = [a.plan[0], a.plan[a.plan.length - 1]];
  b.box(p0[0] + 0.05, p0[0] + 0.15, FOOT + 0.05, a.top - 0.15, p0[1], p1[1], "glassPale");
}

export function low(b) {
  block(b, M.low.plan, FOOT, M.low.top, "renderGrey", "roofGrey");
}
