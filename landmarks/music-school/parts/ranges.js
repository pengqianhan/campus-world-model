// The ranges to the south and west of the courtyard: walls round each plan, under roofs in planes fitted to
// the LiDAR (parts/common.js): the south range's gable along x, the south-east part's along z, and single
// planes over the north-west block and the west corner. No photograph shows them: plain walls.
import { FOOT, MEASURED } from "./common.js";
import { walls, slab, clip } from "./shapes.js";

const M = MEASURED, T = 0.15; // the roof's own thickness over its walls (estimated)

function block(b, plan, top) {
  if (!plan) return;
  walls(b, plan, FOOT, top, "render");
  slab(b, plan, (x, z) => top(x, z) - T, top, "roofPale");
}

export function ranges(b) {
  const s = M.south;
  block(b, clip(s.plan, 1, s.ridge, "above"), (x, z) => s.top - s.fallIn * (z - s.ridge));
  block(b, clip(s.plan, 1, s.ridge, "below"), (x, z) => s.top - s.fallOut * (s.ridge - z));
  const e = M.southeast;
  block(b, clip(e.plan, 0, e.ridge, "above"), (x) => e.top - e.fallPlus * (x - e.ridge));
  block(b, clip(e.plan, 0, e.ridge, "below"), (x) => e.top - e.fallMinus * (e.ridge - x));
  for (const k of ["northwest", "west"]) {
    const [a, kx, kz] = M[k].plane;
    block(b, M[k].plan, (x, z) => a + kx * x + kz * z);
  }
}
