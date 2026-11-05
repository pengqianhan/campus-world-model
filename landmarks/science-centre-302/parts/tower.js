// The tower (parts/common.js, MEASURED.tower and .low). Round 0: its walls up to its main roof at 50.2 m, the
// parapets along its south-west and north-east faces, the lower roofs at 46.7 m along its south-east and north-west
// ends and over the annex north of it, at the LiDAR's heights; plain pale walls (no reference has been drawn from
// yet), grey roofs.
import { FOOT, MEASURED } from "./common.js";
import { block, inside, prism } from "./shapes.js";

const M = MEASURED, WALL = "claddingPale", ROOF = "roofGrey";

/** The point of the tower's side from corner `a` to corner `b` (its plan's) where z = `z`. */
function onSide(a, b, z) {
  const [p, q] = [M.tower.plan[a], M.tower.plan[b]], t = (z - p[1]) / (q[1] - p[1]);
  return [p[0] + t * (q[0] - p[0]), z];
}

export function tower(b) {
  const T = M.tower, L = M.low, [s, w] = T.plan, [z0, z1] = T.parapet.z;
  // the main roof over the tower but the two strips of the lower roof
  const main = [s, w, [L.nw[1][0], L.nw[1][1]], L.nw[0], L.nw[3], L.se[2], L.se[1], L.se[0]];
  block(b, main, FOOT, T.roof, WALL, ROOF);
  for (const plan of [L.se, L.nw, L.annex]) block(b, plan, FOOT, L.roof, WALL, ROOF);
  // the parapets, from just above the roof's top (so that their faces do not lie in the roof slab's)
  prism(b, inside(onSide(0, 1, z0), onSide(0, 1, z1), T.parapet.width), T.roof + 0.015, T.parapet.sw, WALL);
  prism(b, inside(onSide(3, 2, z1), onSide(3, 2, z0), T.parapet.width), T.roof + 0.015, T.parapet.ne, WALL);
}
