// The body (parts/common.js MEASURED): the brick building as the LiDAR gives it, and its west part as the 2023
// aerial does. A main range under a flat roof at 6.6 m with a parapet on its east part's street face, its
// sides and its back; the porch between the two parts of the street face at 8.4 m; two blocks at 10.0 m on
// the main roof; a box and a lantern. (Round 1's range at 10 m along the street west of the porch and its wing
// down the west side were the 2024 LiDAR's temporary works: common.js.) Every wall goes down to FOOT, the
// lowest ground round it. What the street faces carry (pilasters, pinnacles, the cornice, the arches, the
// door) is parts/front.js's.
import { MEASURED as M, FRONT as F, FOOT } from "./common.js";
import { prism, roof, inset } from "./shapes.js";

const W = M.walls;
const PARAPET_T = 0.3; // the parapet's thickness: estimated
const [EF0, EF1] = W.eastFront; // the east part's street face, from the porch's east side to the east wall
const [WF0, WF1] = W.westFront; // the west part's, from the west wall to the porch's west side
const [WW0, WW1] = W.west; // the west wall, from the street face to the back

/** The building's plan at the main roof: the LiDAR's walls and the aerial's, corner by corner. */
export const PLAN = [
  WW1, [W.east[1][0], W.back], EF1, EF0,
  [W.porchEast, W.porchFront], [W.entranceWest, W.porchFront], WF1, WF0,
];

/** The east part's street face's z at x. */
export const eastFrontZ = (x) => EF0[1] + ((x - EF0[0]) / (EF1[0] - EF0[0])) * (EF1[1] - EF0[1]);

/** A rectangle [x0, x1] x [z0, z1] as a plan. */
const rect = ([x0, x1], [z0, z1]) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

/** The plan raised from y0 to the roof at y1, in brick, with a grey roof on it: the roof's slab stands
 * 0.05 m inside the walls and 0.01 m above them, so that no edge of it shows on a face. */
function mass(b, plan, y0, y1) {
  prism(b, plan, y0, y1, "brickBrown");
  roof(b, inset(plan, plan.map((_, i) => i), 0.05), y1 + 0.01, 0.06, "roofGrey");
}

export function body(b) {
  // the main range, up to the main roof
  mass(b, PLAN, FOOT, M.roof);
  // the porch, back to the east part's street face
  mass(b, [[W.entranceWest, eastFrontZ(W.entranceWest)], EF0, [W.porchEast, W.porchFront], [W.entranceWest, W.porchFront]], M.roof, M.porch.top);
  // the two blocks, the box and the lantern on the main roof
  for (const k of [M.blockA, M.blockB, M.box, M.lantern]) mass(b, rect(k.x, k.z), M.roof, k.top);
  // the parapet round the main roof: along the east part's street face (its coping is front.js's), the east
  // side, the back and the west side (the west part's street face rises to its coping in front.js)
  const [e0, e1] = W.east, t = PARAPET_T;
  const along = (p, q, d) => { const L = Math.hypot(q[0] - p[0], q[1] - p[1]); return [p[0] + ((q[0] - p[0]) / L) * d, p[1] + ((q[1] - p[1]) / L) * d]; };
  const n = [EF1[1] - EF0[1], -(EF1[0] - EF0[0])].map((v) => v / Math.hypot(EF1[0] - EF0[0], EF1[1] - EF0[1])); // inward
  const off = (p) => [p[0] + n[0] * t, p[1] + n[1] * t];
  prism(b, [EF0, EF1, along(EF1, e1, t), off(EF0)], M.roof, M.parapet, "brickBrown");
  prism(b, [[e1[0] - t, W.back], [e1[0], W.back], e0, [e0[0] - t, e0[1]]], M.roof, M.parapet, "brickBrown");
  const westX = (z) => WW0[0] + ((z - WW0[1]) / (WW1[1] - WW0[1])) * (WW1[0] - WW0[0]);
  prism(b, [WW1, [e1[0], W.back], [e1[0] - t, W.back + t], [westX(W.back + t) + t, W.back + t]], M.roof, M.parapet, "brickBrown");
  // the west side's: no photograph shows it and the LiDAR there is the works': as high as the west part's
  // coping band, as the east side's (7.83) stands under its face's (7.95) (estimated); 1 cm under it, as its end
  // runs under the band's back, whose top it lay in
  const wz = WF0[1] - 0.3;
  prism(b, [WW1, [westX(W.back + t) + t, W.back + t], [westX(wz) + t, wz], [westX(wz), wz]], M.roof, F.west.band[1] - 0.01, "brickBrown");
}
