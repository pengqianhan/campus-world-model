// Architecture - East (421E; parts/common.js, MEASURED), drawn in its two frames (u along the walls, w across them).
// Round 0: each part a block at the LiDAR's plan and height, walls down to FOOT: the lower wing inside its parapet,
// the west tower on it, the main block under its gabled roof, and the tall tower out of that roof. Parts that meet
// run into each other, so that no two faces of different materials lie in one plane.
import { FOOT, MEASURED, rect } from "./common.js";
import { block, prism, slopedPrism, tris } from "./shapes.js";

const M = MEASURED, WALL = "claddingPale", ROOF = "roofGrey", TOWER = "screenGrey";

/** The u of the view frame's point [x, z] in frame `F`. */
function uOf(F, x, z) {
  const t = (M.frames[F].deg * Math.PI) / 180;
  return x * Math.cos(t) + z * Math.sin(t);
}

/** A plane rising along u in frame `F` from `low` at u0 to `high` at u1. */
function rising(F, [u0, u1], low, high) {
  return (x, z) => low + ((uOf(F, x, z) - u0) / (u1 - u0)) * (high - low);
}

/** A parapet round the rectangle u x w of frame `F`: from 0.3 m under `roof` to `top`, `width` wide, 1 cm inside the
 * walls. */
function rim(b, F, [u0, u1], [w0, w1], roof, top, width) {
  const d = 0.01, i = width;
  prism(b, rect(F, [u0 + d, u1 - d], [w0 + d, w1 - d]), roof - 0.3, top, WALL, [rect(F, [u0 + i, u1 - i], [w0 + i, w1 - i])]);
}

/** A gabled roof over the rectangle u x w of frame `F`: from the eaves round it to a ridge along u at `ridge.w`, its
 * slopes in ROOF, its two gable ends in WALL. */
function gable(b, F, [u0, u1], [w0, w1], eaves, ridge) {
  const P = (u, w, y) => {
    const t = (M.frames[F].deg * Math.PI) / 180;
    return [u * Math.cos(t) - w * Math.sin(t), y, u * Math.sin(t) + w * Math.cos(t)];
  };
  const A = P(u0, w0, eaves), B = P(u1, w0, eaves), C = P(u1, w1, eaves), D = P(u0, w1, eaves);
  const R0 = P(u0, ridge.w, ridge.top), R1 = P(u1, ridge.w, ridge.top);
  tris(b, [[A, B, R1], [A, R1, R0], [D, C, R1], [D, R1, R0]], ROOF, "up");
  const c = P((u0 + u1) / 2, (w0 + w1) / 2, 0);
  tris(b, [[A, D, R0], [B, C, R1]], WALL, (m) => [2 * m[0] - c[0], 2 * m[1] - c[2]]);
}

export function building(b) {
  const L = M.low, T = M.wtower, B = M.main, H = M.ttower;
  // the lower wing inside its parapet
  block(b, rect("W", L.u, L.w), FOOT, L.roof, WALL, ROOF);
  rim(b, "W", L.u, L.w, L.roof, L.parapet.top, L.parapet.width);
  // the west tower, from inside the wing's roof
  slopedPrism(b, rect("W", T.u, T.w), L.roof - 0.3, rising("W", T.u, T.low, T.high), TOWER, TOWER);
  // the main block, its walls to the eaves and its gabled roof
  prism(b, rect("E", B.u, B.w), FOOT - 0.05, B.eaves, WALL);
  gable(b, "E", B.u, B.w, B.eaves, B.ridge);
  // the tall tower, from inside the main block's roof
  slopedPrism(b, rect("E", H.u, H.w), B.eaves - 0.3, rising("E", H.u, H.low, H.high), TOWER, TOWER);
}
