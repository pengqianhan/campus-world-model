// The top storey down the middle (parts/common.js MEASURED.top): white walls under a curved grey roof
// that overhangs them, its crown cut flat over the last metres before the party wall with 801. Round 0
// (the lead): a flat-roofed box with a band of red-framed windows on each long face, and an end block at
// 10.72 m across the north-west end. Round 3: the roof's curve, its ends and the north-west end from the
// LiDAR (common.js says how); the walls drawn plain, as no photograph shows them (the band of windows seen
// from the street is under the canopy, at the street face's top: parts/body.js).
import { MEASURED as M, topRoof } from "./common.js";
import { along } from "./shapes.js";

/** The roof's slab: its thickness, and how many straight pieces draw its curve. */
const SLAB = 0.15, PIECES = 14;

/** The section of the curve from z0 to z1 at `cut`, its top at the roof and its bottom `t` below it. */
function slab(z0, z1, cut, t) {
  const top = [], bottom = [];
  for (let i = 0; i <= PIECES; i++) {
    const z = z0 + (z1 - z0) * (i / PIECES);
    top.push([z, topRoof(z, cut)]);
    bottom.push([z, topRoof(z, cut) - t]);
  }
  // round the outline: along the top, then back along the bottom
  return [...top, ...bottom.reverse()];
}

/** The walls' section: from y0 up to the roof's underside between the walls. */
function walls(y0, cut) {
  const [z0, z1] = M.top.z, pts = [[z0, y0]];
  for (let i = 0; i <= PIECES; i++) {
    const z = z0 + (z1 - z0) * (i / PIECES);
    pts.push([z, topRoof(z, cut) - SLAB + 0.01]);
  }
  pts.push([z1, y0]);
  return pts;
}

export function top(b) {
  const T = M.top, cut = T.cut, y0 = M.roofs.flat - 0.1;
  // the walls, from inside the roofs below to the curved roof, and to its cut crown past x 16.0
  along(b, walls(y0, Infinity), T.x[0], cut.from, "paint");
  along(b, walls(y0, cut.y), cut.from, T.x[1], "paint");
  // the roof: its curve from eave to eave, overhanging the walls, and its cut crown at the north-west end
  along(b, slab(T.eaves[0], T.eaves[1], Infinity, SLAB), T.roofX[0], cut.from, "roofGrey");
  along(b, slab(T.eaves[0], T.eaves[1], cut.y, SLAB), cut.from, T.roofX[1], "roofGrey");
}
