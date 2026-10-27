// The stair tower in the middle of the lawn side (parts/common.js MEASURED.tower): a plain block of the
// same rock-faced stone, rising above the roofs to a flat top with a plain coping. The photographs show
// no window in its face toward the lawn. Baseline (round 0).
import { MEASURED as M, FOOT } from "./common.js";

export function tower(b) {
  const t = M.tower;
  b.box(t.x[0], t.x[1], FOOT, t.top - 0.25, t.z[0], t.z[1], "ashlar");
  b.box(t.x[0] - 0.08, t.x[1] + 0.08, t.top - 0.25, t.top, t.z[0] - 0.08, t.z[1] + 0.08, "dressed");
}
