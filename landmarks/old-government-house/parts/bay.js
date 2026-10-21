// The single-storey bay at the south-east end, with a balcony on its flat roof, and the porch in the
// middle of the garden front: the rough massing from the LiDAR.
import { MEASURED } from "./common.js";

export function bay(b) {
  const { x, z, top, balustrade } = MEASURED.bay;
  b.box(x[0], x[1], -0.4, top, z[0], z[1], "smooth");
  const t = 0.15;  // the balcony's balustrade round the three open sides
  b.box(x[0], x[0] + t, top, balustrade, z[0], z[1], "dressed");
  b.box(x[0], x[1], top, balustrade, z[0], z[0] + t, "dressed");
  b.box(x[0], x[1], top, balustrade, z[1] - t, z[1], "dressed");
}

export function porch(b) {
  const { x, z, top } = MEASURED.porch;
  b.box(x[0], x[1], top - 0.4, top, z[0], z[1], "dressed");
  for (const px of [x[0] + 0.2, x[1] - 0.2]) b.box(px - 0.15, px + 0.15, -0.2, top - 0.4, z[1] - 0.35, z[1] - 0.05, "dressed");
  b.box(x[0], x[1], -0.4, 0.3, z[0], z[1], "dressed");
}
