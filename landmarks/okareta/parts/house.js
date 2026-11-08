// Okareta's parts: the house (its walls, the cornice under its eaves, its two hipped roofs and the low roof behind)
// and its porches (the verandah before the north-east part's front and the porch behind it). Sizes from common.js.
import { FOOT, HOUSE, ROOFS, VERANDAH, at, plan, rect } from "./common.js";
import { prism, hipRoof, tris } from "./shapes.js";

const WALL = "trim", ROOF = "roofGrey";

/** The walls from FOOT to their tops inside the cornice, the cornice filling the eaves' line under the roofs, the
 * wing's and the north-east part's hipped roofs (the latter's square end inside the wing's roof), and the low roof
 * behind. */
export function house(b) {
  prism(b, plan(HOUSE.walls), FOOT, HOUSE.top, WALL);
  prism(b, plan(HOUSE.eaves), HOUSE.cornice, HOUSE.eave - 0.02, WALL);
  const W = ROOFS.wing, M = ROOFS.main, R = ROOFS.rear;
  // The view frame's x is -u: the wing's u from -0.25 to -6.75 is x from 0.25 to 6.75, its ridge on x = 3.5.
  hipRoof(b, [-W.u[1], -W.u[0]], W.w, HOUSE.eave, W.ridge, "z", -W.at, W.hips, ROOF);
  // The north-east part's ridge along x on z = -1.75, its hip at its north-east end (x = -7.25, the first).
  hipRoof(b, [-M.u[1], -M.u[0]], M.w, HOUSE.eave, M.ridge, "x", M.at, M.hips, ROOF);
  const [x0, x1] = [-R.u[1], -R.u[0]], hi = (x) => [x, R.high, R.w[1]], lo = (x) => [x, R.low, R.w[0]];
  tris(b, [[hi(x0), hi(x1), lo(x1)], [hi(x0), lo(x1), lo(x0)]], ROOF);
  // its north-east end closed down to the cornice's top (its south-west end lies on the wing's roof)
  const foot = (z) => [x0, HOUSE.eave - 0.02, z];
  tris(b, [[foot(R.w[0]), foot(R.w[1]), hi(x0)], [foot(R.w[0]), hi(x0), lo(x0)]], WALL, (m) => [m[0] - 1, m[1]]);
}

/** The verandah before the north-east part's front: its floor on a plinth, its roof falling from the wall to its edge
 * (its ceiling under it), the frieze along its edge, its posts and the balustrade between them (open before the door);
 * the porch behind: its flat roof and two posts. */
export function porches(b) {
  const V = VERANDAH, [x0, x1] = [-V.u[1], -V.u[0]];
  prism(b, rect(V.u, [V.w[0] + 0.05, V.w[1]]), FOOT, V.floor, WALL);
  const wall = (x, y = V.top) => [x, y, V.w[0]], edge = (x, y = V.eave) => [x, y, V.w[1]];
  const slope = [[wall(x0), wall(x1), edge(x1)], [wall(x0), edge(x1), edge(x0)]];
  tris(b, slope, ROOF);
  tris(b, slope, "render", "down");
  const lo = V.eave - V.frieze;
  tris(b, [[edge(x0, lo), edge(x1, lo), edge(x1)], [edge(x0, lo), edge(x1), edge(x0)]], "render", (m) => [m[0], m[1] + 1]);
  for (const u of V.posts) prism(b, rect([u - 0.08, u + 0.08], [V.w[1] - 0.16, V.w[1]]), V.floor, lo, WALL);
  // the balustrade from the first post to the fifth, the steps to the door between the fifth and the last; its foot
  // 0.02 m over the floor, so that it does not share the posts' feet's plane
  prism(b, rect([V.posts[4], V.posts[0]], [V.w[1] - 0.12, V.w[1] - 0.06]), V.floor + 0.02, V.floor + 0.85, "render");
  const P = ROOFS.porch;
  prism(b, rect(P.u, P.w), P.top - 0.15, P.top, ROOF);
  for (const u of [P.u[0] + 0.1, P.u[1] - 0.1]) prism(b, rect([u - 0.1, u + 0.1], [P.w[0], P.w[0] + 0.2]), FOOT, P.top - 0.15, WALL);
}
