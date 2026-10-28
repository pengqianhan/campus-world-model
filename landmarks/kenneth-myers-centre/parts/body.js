// The body (parts/common.js MEASURED): the brick building as the LiDAR gives it. A main range under a flat
// roof at 6.6 m with a parapet on its east part's street face, east side and back; along the street west of
// the porch, a range at 10.0 m, turning back along the west side as a wing to the back; the porch between
// the two parts of the street face at 8.4 m; two blocks at 10.0 m on the main roof; a box and a lantern.
// Every wall goes down to FOOT, the lowest ground round it. What the street faces carry (pilasters,
// pinnacles, the cornice, the arches, the door) is parts/front.js's.
import { MEASURED as M, FOOT } from "./common.js";
import { prism, roof } from "./shapes.js";

const W = M.walls;
const PARAPET_T = 0.3; // the parapet's thickness: estimated

/** The building's plan at the main roof: the LiDAR's walls, corner by corner. */
export const PLAN = [
  [W.west, W.back], [W.east[1][0], W.back], [W.east[0][0], W.eastFront], [W.porchEast, W.eastFront],
  [W.porchEast, W.porchFront], [W.porchWest, W.porchFront], [W.porchWest, W.front], [W.west, W.front],
];

/** A rectangle [x0, x1] x [z0, z1] as a plan. */
const rect = ([x0, x1], [z0, z1]) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

/** The plan raised from y0 to the roof at y1, in brick, with a grey roof on it. */
function mass(b, plan, y0, y1) {
  prism(b, plan, y0, y1 - 0.05, "brick");
  roof(b, plan, y1, 0.05, "roofGrey");
}

export function body(b) {
  // the main range, up to the main roof
  mass(b, PLAN, FOOT, M.roof);
  // the range along the street west of the porch, and the wing down the west side
  mass(b, rect([W.west, W.porchWest], [M.front.back, W.front]), M.roof, M.front.top);
  mass(b, rect([W.west, M.westWing.east], [W.back, M.front.back]), M.roof, M.westWing.top);
  // the porch
  mass(b, rect([W.porchWest, W.porchEast], [W.eastFront, W.porchFront]), M.roof, M.porch.top);
  // the two blocks, the box and the lantern on the main roof
  for (const k of [M.blockA, M.blockB, M.box, M.lantern]) mass(b, rect(k.x, k.z), M.roof, k.top);
  // the parapet round the main roof's east part: along its street face, the east side and the back
  const [e0, e1] = W.east, t = PARAPET_T;
  const ex = (z) => e1[0] + ((z - e1[1]) / (e0[1] - e1[1])) * (e0[0] - e1[0]); // the east wall's x at z
  prism(b, [[W.porchEast, W.eastFront - t], [ex(W.eastFront - t) - 0.02, W.eastFront - t], [e0[0], W.eastFront], [W.porchEast, W.eastFront]], M.roof, M.parapet, "brick");
  prism(b, [[e1[0] - t, W.back], [e1[0], W.back], [e0[0], W.eastFront], [e0[0] - t, W.eastFront]], M.roof, M.parapet, "brick");
  prism(b, rect([M.westWing.east, e1[0]], [W.back, W.back + t]), M.roof, M.parapet, "brick");
}
