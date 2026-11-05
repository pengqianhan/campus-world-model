// The lower block before the tower's south-west face and the screens that run on from it along the tower's end faces
// (parts/common.js, MEASURED.block). Round 0: the block's walls up to its flat top at 25.5 m, at the LiDAR's plan and
// height; step 6: the screens, 1.7 and 2 m deep, to 26.0 m. Plain dark walls (the folded screens' faces are the
// facade's).
import { FOOT, MEASURED, towerRect } from "./common.js";
import { block as slab } from "./shapes.js";

export function block(b) {
  const B = MEASURED.block;
  // its foot 0.1 m below the tower's, so that where it runs inside the tower their undersides are not in one plane
  slab(b, B.plan, FOOT - 0.1, B.top, "screenGrey", "roofGrey");
  // the screens, each with its inner side 0.1 m inside the tower's face
  for (const S of B.screens) {
    const [b0, b1] = S.b[0] > 0 ? [S.b[0] - 0.1, S.b[1]] : [S.b[0], S.b[1] + 0.1];
    slab(b, towerRect(S.a, [b0, b1]), FOOT - 0.1, B.screenTop, "screenGrey", "roofGrey");
  }
}
