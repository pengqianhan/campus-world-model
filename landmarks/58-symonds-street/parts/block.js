// 58 Symonds Street's blocks: the upper roof set in from the tower's edge, and the street side's low block, strip and
// core. The tower's faces are facade.js's. Sizes from common.js.
import { FOOT, STREET, TOWER, UPPER, plan } from "./common.js";
import { block } from "./shapes.js";

// The walls the pale grey of the tower's bands, as the photograph shows them; the roofs mid-grey.
const WALL = "claddingPale", ROOFS = "roofGrey";

const box = ([u0, u1], [w0, w1]) => plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]);

export function upper(b) {
  block(b, box(UPPER.u, UPPER.w), TOWER.edge - 0.1, UPPER.top, WALL, ROOFS);
}

export function street(b) {
  for (const s of STREET) block(b, box(s.u, s.w), FOOT, s.top, WALL, ROOFS);
}
