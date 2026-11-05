// The lower block before the tower's south-west face (parts/common.js, MEASURED.block). Round 0: its walls up to its
// flat top at 25.5 m, at the LiDAR's plan and height; plain dark walls (the screens round it are round 1's).
import { FOOT, MEASURED } from "./common.js";
import { block as slab } from "./shapes.js";

export function block(b) {
  const B = MEASURED.block;
  // its foot 0.1 m below the tower's, so that where it runs inside the tower their undersides are not in one plane
  slab(b, B.plan, FOOT - 0.1, B.top, "screenGrey", "roofGrey");
}
