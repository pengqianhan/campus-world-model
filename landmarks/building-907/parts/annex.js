// Building 907's annex on the hall's south-south-west side: its orange rendered walls up to its roof, which falls
// away from the hall. Sizes from common.js.
import { ANNEX, FOOT, OPENINGS, at, rect } from "./common.js";
import { prism, tris } from "./shapes.js";

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

/** The windows and the glazed door on the west-north-west face and the door on the south-south-west face: each a
 * dark frame standing 0.03 m out of the wall and, but for the door, glass 0.01 to 0.06 m out over it, 0.08 m in. */
export function openings(b) {
  const u = ANNEX.u[1], w = ANNEX.w[1];
  for (const o of OPENINGS.annexFace) {
    const y0 = Math.max(o.y[0], FOOT + 0.1);
    prism(b, rect([u, u + 0.03], [o.w[0] - 0.08, o.w[1] + 0.08]), y0, o.y[1] + 0.08, "screenBlack");
    prism(b, rect([u + 0.01, u + 0.06], o.w), y0 + 0.08, o.y[1], "glass");
  }
  const d = OPENINGS.annexDoor;
  prism(b, rect(d.u, [w, w + 0.04]), FOOT + 0.1, d.y[1], "screenBlack");
}
