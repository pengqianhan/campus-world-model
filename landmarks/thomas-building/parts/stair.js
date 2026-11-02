// The round stair at the south-west end, where the Overbridge (129, not drawn) lands, and the flue
// beside it. Drawn in the building's own axes (u, v); model.js turns it.
import { FOOT, MEASURED } from "./common.js";
import { cylinder } from "./shapes.js";

const M = MEASURED;

export function stair(b) {
  const s = M.stair, f = M.flue;
  cylinder(b, s.u, s.v, s.r, FOOT, s.top, "grey");
  b.box(f.u[0], f.u[1], 14.0, f.top, f.v[0], f.v[1], "paint");
}
