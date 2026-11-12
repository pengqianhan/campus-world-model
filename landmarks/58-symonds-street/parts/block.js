// 58 Symonds Street's blocks: the upper roof set in from the tower's edge with its plant, the street side's low block
// and strips, and the core with its roof falling to the street. The tower's faces are facade.js's. Sizes from
// common.js.
import { CORE, FOOT, PLANT, STREET, TOWER, UPPER, at, plan } from "./common.js";
import { block, prism, tris } from "./shapes.js";

// The walls the pale grey of the tower's bands, as the photograph shows them; the roofs grey (`roofGrey`, darker than
// the 2023 aerial's light grey upper roof, about RGB 167, 166, 169), and the core's a dull plum, as the aerial shows
// it (about 121, 103, 127).
const WALL = "claddingPale", ROOFS = "roofGrey", CORE_ROOF = "roofPlum";

const box = ([u0, u1], [w0, w1]) => plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]);

export function upper(b) {
  block(b, box(UPPER.u, UPPER.w), TOWER.edge - 0.1, UPPER.top, WALL, ROOFS);
}

export function street(b) {
  // 0.1 m under the walls' foot, so that their floors do not lie in one plane with the dark ground storey's
  for (const s of STREET) block(b, box(s.u, s.w), FOOT - 0.1, s.top, WALL, ROOFS);
}

export function plant(b) {
  for (const p of PLANT) block(b, box(p.u, p.w), TOWER.edge - 0.1, p.top, WALL, ROOFS);
}

/** The core: its walls from the walls' foot to its roof's low edge, over the street; above that its north-east wall
 * and two end walls up to the roof, which falls CORE.fall a metre from CORE.high at w CORE.at toward the street. */
export function core(b) {
  const [u0, u1] = CORE.u, [w0, w1] = CORE.w;
  const h = (w) => CORE.high - CORE.fall * (w - CORE.at), lo = h(w1), hi = h(w0);
  prism(b, box(CORE.u, CORE.w), FOOT - 0.1, lo, WALL);
  const P = (u, w, y) => { const [x, z] = at(u, w); return [x, y, z]; };
  tris(b, [[P(u0, w0, hi), P(u1, w0, hi), P(u1, w1, lo)], [P(u0, w0, hi), P(u1, w1, lo), P(u0, w1, lo)]], CORE_ROOF, "up");
  const out = (du, dw) => ([x, z]) => [x - du, z + dw];  // outward in the view frame (x = -u)
  tris(b, [[P(u0, w0, lo), P(u1, w0, lo), P(u1, w0, hi)], [P(u0, w0, lo), P(u1, w0, hi), P(u0, w0, hi)]], WALL, out(0, -1));
  tris(b, [[P(u0, w0, lo), P(u0, w0, hi), P(u0, w1, lo)]], WALL, out(-1, 0));
  tris(b, [[P(u1, w0, lo), P(u1, w0, hi), P(u1, w1, lo)]], WALL, out(1, 0));
}
