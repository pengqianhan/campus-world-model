// The M&HS Building's long block west of the tower, with the plant room on it, the parts south and north of it and
// the glass-roofed atria either side; and the south edge of the building to its north (502's), inside the campus
// map's ring of 501. Sizes from common.js.
import { ATRIA, ATRIUM_FLOORS, ATRIUM_TOP, BLOCK, FOOT, LINK, NORTH, PLANT, SOUTH, WELL, at, rect } from "./common.js";
import { block, prism, tris } from "./shapes.js";

const WALL = "renderGrey", ROOF = "roofGrey", GLASS = "glass", PALE = "claddingPale";

/** The long block round its light well (the well's floor a block of its own), the plant room on its south side, the
 * part south of it, the concrete link north of it, and the atria: glass from FOOT to their roofs, each floor's slab
 * standing out of the glass. */
export function body(b) {
  const [u0, u1] = BLOCK.u, [w0, w1] = BLOCK.w, [a0, a1] = WELL.u, [c0, c1] = WELL.w;
  for (const [u, w] of [[[u0, u1], [w0, c0]], [[u0, u1], [c1, w1]], [[u0, a0], [c0, c1]], [[a1, u1], [c0, c1]]])
    block(b, rect(u, w), FOOT, BLOCK.top, WALL, ROOF);
  block(b, rect(WELL.u, WELL.w), FOOT, WELL.floor, WALL, ROOF);
  block(b, rect(PLANT.u, PLANT.w), BLOCK.top - 2, PLANT.top, WALL, ROOF);
  for (const s of SOUTH) block(b, rect(s.u, s.w), FOOT, s.top, WALL, ROOF);
  block(b, rect(LINK.u, LINK.w), FOOT, LINK.top, WALL, ROOF);
  for (const a of ATRIA) {
    // from 0.1 m over FOOT, so that its foot does not lie in the foot of the walls it runs into
    prism(b, rect(a.u, a.w), FOOT + 0.1, ATRIUM_TOP, GLASS);
    const out = rect([a.u[0] - 0.05, a.u[1] + 0.05], [a.w[0] - 0.05, a.w[1] + 0.05]);
    for (const y of ATRIUM_FLOORS) prism(b, out, y - 0.3, y, WALL);
  }
}

/** 502's south edge: its walls from FOOT to its eave, its roof rising to the north, and the ends under it. */
export function north(b) {
  const N = NORTH, [u0, u1] = N.u, [w0, w1] = N.w;
  prism(b, rect(N.u, N.w), FOOT, N.eave, PALE);
  const p = (u, w, y) => { const [x, z] = at(u, w); return [x, y, z]; };
  tris(b, [[p(u0, w0, N.eave), p(u1, w0, N.eave), p(u1, w1, N.high)],
    [p(u0, w0, N.eave), p(u1, w1, N.high), p(u0, w1, N.high)]], ROOF);
  const out = (u) => (m) => [m[0] - (u === u1 ? 1 : -1), m[1]];
  for (const u of [u0, u1])
    tris(b, [[p(u, w0, N.eave), p(u, w1, N.eave), p(u, w1, N.high)]], PALE, out(u));
  tris(b, [[p(u0, w1, N.eave), p(u1, w1, N.eave), p(u1, w1, N.high)],
    [p(u0, w1, N.eave), p(u1, w1, N.high), p(u0, w1, N.high)]], PALE,
    (m) => [m[0], m[1] + 1]);
}
