// The low block at the street wing's south-east end (parts/common.js, MEASURED.low). Round 0: its walls up to its
// eaves and its roof from them to the ridge, hipped at its south-east end, at the LiDAR's heights; plain walls.
import { FOOT, MEASURED } from "./common.js";
import { loft, prism } from "./shapes.js";

export function low(b) {
  const L = MEASURED.low, [r0, r1] = L.ridge;
  prism(b, L.plan, FOOT, L.eave, "render");
  // each corner of the plan to the nearer end of the ridge: its north-west end (inside the street wing) left upright
  loft(b, L.plan.map(([x, z]) => [x, L.eave, z]), L.plan.map(([x]) => (x < 30 ? r0 : r1)), "roofGrey", true);
}
