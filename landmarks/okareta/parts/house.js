// Okareta's parts: the house (its walls, the cornice under its eaves, its two hipped roofs and the low roof behind)
// and its porches (the verandah before the north-east part's front and the porch behind it). Sizes from common.js.
import { FOOT, HOUSE, ROOFS, VERANDAH, at, plan, rect } from "./common.js";
import { prism, hipRoof, tris } from "./shapes.js";

const WALL = "trim", ROOF = "roofGrey";

/** The walls from FOOT to their tops under the roofs, the cornice filling the eaves' line under the roofs, the wing's
 * and the north-east part's hipped roofs (the latter's square end inside the wing's roof), and the low roof behind. */
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
}

/** The verandah before the north-east part's front: its roof falling from the wall to its edge, and four posts; the
 * porch behind: its flat roof and two posts. */
export function porches(b) {
  const V = VERANDAH, [x0, x1] = [-V.u[1], -V.u[0]];
  const wall = (x) => [x, V.top, V.w[0]], edge = (x) => [x, V.eave, V.w[1]];
  tris(b, [[wall(x0), wall(x1), edge(x1)], [wall(x0), edge(x1), edge(x0)]], ROOF);
  for (const u of [6.5, 4.0, 1.5, -0.55]) prism(b, rect([u - 0.1, u + 0.1], [V.w[1] - 0.2, V.w[1]]), FOOT, V.eave, WALL);
  const P = ROOFS.porch;
  prism(b, rect(P.u, P.w), P.top - 0.15, P.top, ROOF);
  for (const u of [P.u[0] + 0.1, P.u[1] - 0.1]) prism(b, rect([u - 0.1, u + 0.1], [P.w[0], P.w[0] + 0.2]), FOOT, P.top - 0.15, WALL);
}
