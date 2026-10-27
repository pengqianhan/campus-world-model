// The stair tower in the middle of the lawn side (parts/common.js MEASURED.tower): a plain block of the
// same rock-faced stone, rising above the roofs. EX9b's upper view: its face toward the lawn steps out in
// the middle, a central pier about half its width standing 0.25 m proud of two shoulders and rising
// about 0.4 m above them to the flat top (10.35 m, the LiDAR's highest points), each top with a thin
// coping. No window toward the lawn. Round 1 (the lead).
import { MEASURED as M, FOOT } from "./common.js";

export function tower(b) {
  const t = M.tower, w = t.x[1] - t.x[0], cx = (t.x[0] + t.x[1]) / 2, shoulder = t.top - 0.4;
  b.box(t.x[0], t.x[1], FOOT, shoulder - 0.12, t.z[0], t.z[1] - 0.25, "ashlar");
  b.box(t.x[0] - 0.05, t.x[1] + 0.05, shoulder - 0.12, shoulder, t.z[0] - 0.05, t.z[1] - 0.2, "dressed");
  b.box(cx - w / 4, cx + w / 4, FOOT, t.top - 0.12, t.z[0], t.z[1], "ashlar");
  b.box(cx - w / 4 - 0.05, cx + w / 4 + 0.05, t.top - 0.12, t.top, t.z[0] - 0.05, t.z[1] + 0.05, "dressed");
}
