// The top storey down the middle and the north-west end (parts/common.js MEASURED.spine and .end): white
// walls, a band of red-framed windows along both long faces under a thin projecting roof, as MH15's
// photograph shows its street side. Round 0 (the lead).
import { MEASURED as M } from "./common.js";

export function top(b) {
  const s = M.spine, e = M.end, y0 = M.body.top;
  b.box(s.x[0], s.x[1], y0, s.top, s.z[0], s.z[1], "paint");
  // the projecting roof: 0.6 m out over both long faces, 0.15 m thick
  b.box(s.x[0] - 0.3, s.x[1], s.top - 0.15, s.top, s.z[0] - 0.6, s.z[1] + 0.6, "paint");
  b.box(s.x[0], s.x[1], s.top, s.top + 0.02, s.z[0], s.z[1], "roofGrey");
  // a band of windows on each long face, from 0.5 m above the roof below to 0.4 m under the eave
  for (const [z, dz] of [[s.z[1], 1], [s.z[0], -1]]) {
    b.box(s.x[0] + 0.5, s.x[1] - 0.5, y0 + 0.5, s.top - 0.4, Math.min(z, z + dz * 0.02), Math.max(z, z + dz * 0.02), "glass");
    for (let x = s.x[0] + 0.5; x <= s.x[1] - 0.5 + 1e-6; x += 1.85) {
      b.box(x - 0.05, x + 0.05, y0 + 0.5, s.top - 0.4, Math.min(z, z + dz * 0.06), Math.max(z, z + dz * 0.06), "roofTile");
    }
  }
  b.box(e.x[0], e.x[1], y0, e.top, e.z[0], e.z[1], "paint");
  b.box(e.x[0], e.x[1], e.top, e.top + 0.02, e.z[0], e.z[1], "roofGrey");
}
