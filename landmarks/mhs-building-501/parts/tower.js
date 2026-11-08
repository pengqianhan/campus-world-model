// The M&HS Building's tower at the long block's east end, toward the plaza: its concrete shaft, its dark crown (a
// steep band over a flared foot, slopes up to a flat top) and the glazed box before its east face. Sizes from
// common.js.
import { BOX, FOOT, TOWER, at, rect } from "./common.js";
import { loft, prism, tris } from "./shapes.js";

// The crown's band and slopes in the dark grey of its standing seams (the photograph), its flat top as a roof.
const WALL = "renderGrey", ROOF = "roofGrey", GLASS = "glass", CROWN = "screenGrey";

/** The four corners of a rectangle [u0, u1] x [w0, w1] at height y, as [x, y, z], round in one direction. */
const ring = ({ u, w }, y) => [[u[0], w[0]], [u[1], w[0]], [u[1], w[1]], [u[0], w[1]]].map(([a, c]) => {
  const [x, z] = at(a, c);
  return [x, y, z];
});

/** The shaft from FOOT to the crown's eave; the crown: its band from the eave (its underside closing the overhang)
 * to the band's top, its slopes up to the flat top, and the top. */
export function tower(b) {
  const T = TOWER;
  prism(b, rect(T.shaft.u, T.shaft.w), FOOT, T.eave, WALL);
  prism(b, rect(T.crownOut.u, T.crownOut.w), T.eave, T.band, CROWN);
  loft(b, ring(T.crownOut, T.band), ring(T.crownTop, T.top), CROWN, true);
  const t = ring(T.crownTop, T.top);
  tris(b, [[t[0], t[1], t[2]], [t[0], t[2], t[3]]], ROOF);
  // the strip of windows, standing 0.05 m out of the east face
  prism(b, rect([T.shaft.u[1], T.shaft.u[1] + 0.05], T.strip.w), T.strip.y[0], T.strip.y[1], GLASS);
}

/** The glazed box before the east face: glass from FOOT to its beam, the beam and its roof over it. */
export function box(b) {
  const p = rect(BOX.u, BOX.w);
  prism(b, p, FOOT, BOX.top - BOX.beam, GLASS);
  prism(b, p, BOX.top - BOX.beam, BOX.top, WALL);
}
