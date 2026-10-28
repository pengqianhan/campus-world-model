// The body (parts/common.js MEASURED): the brick building as the LiDAR gives it. A main range under a flat
// roof at 6.6 m with a parapet on its east part's street face, east side and back; along the street west of
// the porch, a range at 10.0 m, turning back along the west side as a wing to the back; the porch between
// the two parts of the street face at 8.4 m; two blocks at 10.0 m on the main roof; a box and a lantern.
// Every wall goes down to FOOT, the lowest ground round it. What the street faces carry (pilasters,
// pinnacles, the cornice, the arches, the door) is parts/front.js's.
import { MEASURED as M, FOOT } from "./common.js";
import { prism, roof, inset } from "./shapes.js";

const W = M.walls;
const PARAPET_T = 0.3; // the parapet's thickness: estimated
const [EF0, EF1] = W.eastFront; // the east part's street face, from the porch's east side to the east wall

/** The building's plan at the main roof: the LiDAR's walls, corner by corner. */
export const PLAN = [
  [W.west, W.back], [W.east[1][0], W.back], EF1, EF0,
  [W.porchEast, W.porchFront], [W.entranceWest, W.porchFront], [W.entranceWest, W.front], [W.west, W.front],
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
  // the range along the street west of the porch, and the wing down the west side
  mass(b, rect([W.west, W.entranceWest], [M.front.back, W.front]), M.roof, M.front.top);
  // its roof runs on east over the porch's western part to x 2.0, behind the porch's pilaster block: its
  // front there at 14.0 (the LiDAR's 10 m roof returns over x 0-2 reach z 13.6-14.4; estimated)
  mass(b, rect([W.entranceWest, W.porchWest], [M.front.back, 14.0]), M.roof, M.front.top);
  mass(b, rect([W.west, M.westWing.east], [W.back, M.front.back]), M.roof, M.westWing.top);
  // the porch, back to the east part's street face
  mass(b, [[W.entranceWest, eastFrontZ(W.entranceWest)], EF0, [W.porchEast, W.porchFront], [W.entranceWest, W.porchFront]], M.roof, M.porch.top);
  // the two blocks, the box and the lantern on the main roof
  for (const k of [M.blockA, M.blockB, M.box, M.lantern]) mass(b, rect(k.x, k.z), M.roof, k.top);
  // the parapet round the main roof's east part: along its street face (its coping is front.js's), the east
  // side and the back
  const [e0, e1] = W.east, t = PARAPET_T;
  const along = (p, q, d) => { const L = Math.hypot(q[0] - p[0], q[1] - p[1]); return [p[0] + ((q[0] - p[0]) / L) * d, p[1] + ((q[1] - p[1]) / L) * d]; };
  const n = [EF1[1] - EF0[1], -(EF1[0] - EF0[0])].map((v) => v / Math.hypot(EF1[0] - EF0[0], EF1[1] - EF0[1])); // inward
  const off = (p) => [p[0] + n[0] * t, p[1] + n[1] * t];
  prism(b, [EF0, EF1, along(EF1, e1, t), off(EF0)], M.roof, M.parapet, "brickBrown");
  prism(b, [[e1[0] - t, W.back], [e1[0], W.back], e0, [e0[0] - t, e0[1]]], M.roof, M.parapet, "brickBrown");
  prism(b, rect([M.westWing.east, e1[0]], [W.back, W.back + t]), M.roof, M.parapet, "brickBrown");
}
