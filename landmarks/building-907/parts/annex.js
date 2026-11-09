// Building 907's annex on the hall's south-south-west side: its orange rendered walls up to its roof, which falls
// away from the hall. Sizes from common.js.
import { ANNEX, FOOT, at } from "./common.js";
import { tris } from "./shapes.js";

const WALL = "renderOrange", ROOF = "roofPale";

/** The roof's height at w. */
const top = (w) => ANNEX.top[0] + (ANNEX.top[1] - ANNEX.top[0]) * (w - ANNEX.w[0]) / (ANNEX.w[1] - ANNEX.w[0]);

/** The four walls from FOOT to the roof's plane, and the roof. */
export function annex(b) {
  const [u0, u1] = ANNEX.u, [w0, w1] = ANNEX.w;
  const P = (u, w, y) => { const [x, z] = at(u, w); return [x, y, z]; };
  const corners = [[u0, w0], [u1, w0], [u1, w1], [u0, w1]];
  const walls = [];
  for (let i = 0; i < 4; i++) {
    const [ua, wa] = corners[i], [ub, wb] = corners[(i + 1) % 4];
    const a0 = P(ua, wa, FOOT), b0 = P(ub, wb, FOOT), a1 = P(ua, wa, top(wa)), b1 = P(ub, wb, top(wb));
    walls.push([a0, b0, b1], [a0, b1, a1]);
  }
  const [cx, cz] = at((u0 + u1) / 2, (w0 + w1) / 2);
  tris(b, walls, WALL, ([x, z]) => [x + (x - cx) * 10, z + (z - cz) * 10]);
  const r = corners.map(([u, w]) => P(u, w, top(w)));
  tris(b, [[r[0], r[1], r[2]], [r[0], r[2], r[3]]], ROOF, "up");
}
