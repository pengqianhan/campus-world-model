// The M&HS Building's long block west of the tower, with the plant room on it, the part south of it, the concrete
// link north of it to 502 and the glazed link beside the tower; and the south edge of the building to its north
// (502's), inside the campus map's ring of 501. Sizes from common.js.
import {
  BLOCK, BLOCK_EAST, FOOT, GLAZED, GLAZED_FLOORS, LINK, NORTH, PLANT, SOUTH, WELL, at, plan, rect,
} from "./common.js";
import { block, prism, tris } from "./shapes.js";

const WALL = "renderGrey", ROOF = "roofGrey", GLASS = "glass", PALE = "claddingPale";

/** The long block round its light well (the well's floor a block of its own) and its lower east end, the plant room
 * on its south side, the part south of it, the concrete link north of it, and the glazed link: glass from just over
 * FOOT to its roof, each floor's slab standing out of the glass. */
export function body(b) {
  const [u0, u1] = BLOCK.u, [w0, w1] = BLOCK.w, [a0, a1] = WELL.u, [c0, c1] = WELL.w;
  for (const [u, w] of [[[u0, u1], [w0, c0]], [[u0, u1], [c1, w1]], [[u0, a0], [c0, c1]], [[a1, u1], [c0, c1]]])
    if (u[1] > u[0] && w[1] > w[0]) block(b, rect(u, w), FOOT, BLOCK.top, WALL, ROOF);
  block(b, rect(WELL.u, WELL.w), FOOT, WELL.floor, WALL, ROOF);
  block(b, rect(BLOCK_EAST.u, BLOCK_EAST.w), FOOT, BLOCK_EAST.top, WALL, ROOF);
  block(b, rect(PLANT.u, PLANT.w), BLOCK.top - 2, PLANT.top, WALL, ROOF);
  for (const s of SOUTH) block(b, rect(s.u, s.w), FOOT, s.top, WALL, ROOF);
  block(b, rect(LINK.u, LINK.w), FOOT, LINK.top, WALL, ROOF);
  // from 0.1 m over FOOT, so that its foot does not lie in the foot of the walls it runs into
  const g = GLAZED;
  prism(b, rect(g.u, g.w), FOOT + 0.1, g.top, GLASS);
  const out = rect([g.u[0] - 0.05, g.u[1] + 0.05], [g.w[0] - 0.05, g.w[1] + 0.05]);
  for (const y of GLAZED_FLOORS) prism(b, out, y - 0.3, y, WALL);
}

/** 502's south edge: its walls from just over FOOT (so that its foot does not lie in the link's, which runs into it)
 * to the height of its south wall, its roof rising to the north, and the faces under the roof's edges. */
export function north(b) {
  const N = NORTH, y = ([, w]) => N.eave + N.rise * (w - N.w0);
  prism(b, plan(N.plan), FOOT + 0.1, N.eave, PALE);
  const p = (q, h) => { const [x, z] = at(...q); return [x, h, z]; };
  const P = N.plan, roof = [];
  for (let i = 1; i < P.length - 1; i++) roof.push([p(P[0], y(P[0])), p(P[i], y(P[i])), p(P[i + 1], y(P[i + 1]))]);
  tris(b, roof, ROOF);
  const cu = P.reduce((s, q) => s + q[0], 0) / P.length, cw = P.reduce((s, q) => s + q[1], 0) / P.length;
  const [cx, cz] = at(cu, cw), away = (m) => [2 * m[0] - cx, 2 * m[1] - cz];
  const sides = [];
  for (let i = 0; i < P.length; i++) {
    const q0 = P[i], q1 = P[(i + 1) % P.length];
    sides.push([p(q0, N.eave), p(q1, N.eave), p(q1, y(q1))], [p(q0, N.eave), p(q1, y(q1)), p(q0, y(q0))]);
  }
  tris(b, sides, PALE, away);
}
