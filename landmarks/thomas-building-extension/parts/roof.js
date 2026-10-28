// The roofs (parts/common.js): the pale metal roof falling all round from the raised middle to the
// edge, the raised middle's box with its dark flat roof, and the plant on it. Round 0 (the lead): heights
// from the LiDAR, the roof's rise by the distance in from its edge. Round 1: the plant as the LiDAR
// shows it, a screen and a unit, in place of one box.
import { MEASURED as M } from "./common.js";
import { hipRoof, prism, roof as flat } from "./shapes.js";

/** The main roof's height d metres in from its edge (common.js MEASURED.roof). */
export function roofAt(d) {
  const R = M.roof;
  return d < 1 ? R.edge + (R.at1 - R.edge) * d : R.at1 + R.slope * (d - 1);
}

const rect = ([x0, x1], [z0, z1]) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

export function roof(b) {
  hipRoof(b, M.roofPlan, [M.middle.x, M.middle.z], roofAt, "roofPale");
}

export function middle(b) {
  const mid = rect(M.middle.x, M.middle.z);
  // its walls from inside the main roof to its own roof, which is a dark flat slab
  prism(b, mid, M.roof.at1, M.middle.top - 0.12, "grey");
  flat(b, mid, M.middle.top, 0.12, "roofGrey");
  // on it: the screen and the plant unit (common.js)
  prism(b, rect(M.screen.x, M.screen.z), M.middle.top, M.screen.top, "grey");
  prism(b, rect(M.plant.x, M.plant.z), M.middle.top, M.plant.top, "grey");
}
