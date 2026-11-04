// The south-east range (parts/common.js, MEASURED.southeast) and what stands on its roof: the long upper strip,
// the upper block south-west of it and the plant beyond. Round 0: flat-topped blocks at the LiDAR's heights, plain
// walls.
import { FOOT, MEASURED } from "./common.js";
import { block } from "./shapes.js";

const M = MEASURED;

export function southeast(b) {
  block(b, M.southeast.plan, FOOT, M.southeast.top, "renderGrey", "roofGrey");
}

/** The upper strip, the upper block and the plant: each from 0.3 m below the range's roof, so that its foot is
 * inside the range. */
export function upper(b) {
  const y0 = M.southeast.top - 0.3;
  for (const k of ["strip", "block", "plant"]) block(b, M[k].plan, y0, M[k].top, "renderGrey", "roofGrey");
}
