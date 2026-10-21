// The two-storey main block and its chimneys: the rough massing from the LiDAR (parts/common.js).
// Walls are plain blocks for now; boards, windows, eaves and brackets come in the first round.
import { MEASURED, hipRoof } from "./common.js";

export function main(b) {
  const { main: m, front: f } = MEASURED;
  b.box(m.x[0], m.x[1], -0.4, m.eave, m.z[0], m.z[1], "boards");
  b.box(f.x[0], f.x[1], -0.4, m.eave, f.z[0] - 0.5, f.z[1], "boards");
  hipRoof(b, m.x[0] - 0.4, m.x[1] + 0.4, m.z[0] - 0.4, m.z[1] + 0.4, m.eave, m.ridge);
  hipRoof(b, f.x[0] - 0.4, f.x[1] + 0.4, m.z[0] + 7, f.z[1] + 0.4, m.eave, m.ridge);
}

export function chimneys(b) {
  for (const [x, z, top] of MEASURED.chimneys) {
    b.box(x - 0.8, x + 0.8, MEASURED.main.eave, top - 0.3, z - 0.6, z + 0.6, "boards");
    b.box(x - 0.95, x + 0.95, top - 0.3, top, z - 0.75, z + 0.75, "paint");
  }
}
