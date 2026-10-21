// The lower ranges behind the main block (south-west, round a courtyard): the rough massing from the LiDAR.
import { MEASURED, hipRoof } from "./common.js";

export function back(b) {
  const { back: k, backLeft: l } = MEASURED;
  b.box(k.x[0], k.x[1], -0.4, k.eave, k.z[0], k.z[1], "boards");
  hipRoof(b, k.x[0] - 0.3, k.x[1] + 0.3, k.z[0] - 0.3, k.z[1] + 0.3, k.eave, k.ridge);
  b.box(l.x[0], l.x[1], -0.4, l.top, l.z[0], l.z[1], "boards");
}
