// 58 Symonds Street's parts: the tower to its roof's edge with its floor slabs' bands, the upper roof set in from the
// edge, and the street side's low block, strip and core. Sizes from common.js.
import { FOOT, STREET, TOWER, UPPER, plan } from "./common.js";
import { block, prism } from "./shapes.js";

// The tower pale grey, as the photograph shows it; the roofs mid-grey.
const WALL = "paint", ROOFS = "roofGrey";

const box = ([u0, u1], [w0, w1]) => plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]);

/** The tower: its walls from the walls' foot to the roof's edge, at the slabs' bands' outer edge (round 0 draws the
 * faces flush with the bands), and a flat roof at the edge (the ledge round the upper roof). */
export function tower(b) {
  block(b, box(TOWER.u, TOWER.w), FOOT, TOWER.edge, WALL, ROOFS);
}

export function upper(b) {
  block(b, box(UPPER.u, UPPER.w), TOWER.edge - 0.1, UPPER.top, WALL, ROOFS);
}

export function street(b) {
  for (const s of STREET) block(b, box(s.u, s.w), FOOT, s.top, WALL, ROOFS);
}

/** The floor slabs' bands: a thin band 0.35 m tall at each slab's top, 1 cm proud of the walls. */
export function bands(b) {
  const [u0, u1] = TOWER.u, [w0, w1] = TOWER.w, d = 0.01;
  for (const y of TOWER.slabs) prism(b, box([u0 - d, u1 + d], [w0 - d, w1 + d]), y - 0.35, y, "claddingPale");
}
