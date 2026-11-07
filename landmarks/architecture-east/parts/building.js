// Architecture - East (421E; parts/common.js, MEASURED), drawn in its two frames (u along the walls, w across them).
// Round 1's shape: the lower wing, its corner cut square with the main block, inside its parapet; the west tower on
// it with the lower slope on its south-east side; the main block, its flat roof and the hipped roof on it, and a box
// on the flat; the tall tower out of the hipped roof. Walls down to FOOT. Parts that meet run into each other, so
// that no two faces of different materials lie in one plane.
import { FOOT, MEASURED, inset, plan, rect } from "./common.js";
import { block, prism, slopedPrism, tris } from "./shapes.js";

const M = MEASURED, WALL = "claddingPale", ROOF = "roofGrey", TOWER = "screenGrey";

const rad = (F) => (M.frames[F].deg * Math.PI) / 180;

/** The [u, w] of the view frame's point [x, z] in frame `F`. */
function uwOf(F, x, z) {
  const t = rad(F);
  return [x * Math.cos(t) + z * Math.sin(t), -x * Math.sin(t) + z * Math.cos(t)];
}

/** The point [x, y, z] of the view frame at u, w and height y in frame `F`. */
function P(F, u, w, y) {
  const t = rad(F);
  return [u * Math.cos(t) - w * Math.sin(t), y, u * Math.sin(t) + w * Math.cos(t)];
}

/** A plane rising along u (`axis` 0) or w (`axis` 1) of frame `F`, from `low` at a0 to `high` at a1. */
function rising(F, axis, [a0, a1], low, high) {
  return (x, z) => low + ((uwOf(F, x, z)[axis] - a0) / (a1 - a0)) * (high - low);
}

/** A hipped roof over the rectangle u x w of frame `F`, from its eaves at `base` to a ridge along u at `ridge.w`,
 * `ridge.top` high, from ridge.u[0] to ridge.u[1]: its two long slopes and two hips in ROOF. */
function hipped(b, F, [u0, u1], [w0, w1], base, ridge) {
  const A = P(F, u0, w0, base), B = P(F, u1, w0, base), C = P(F, u1, w1, base), D = P(F, u0, w1, base);
  const R0 = P(F, ridge.u[0], ridge.w, ridge.top), R1 = P(F, ridge.u[1], ridge.w, ridge.top);
  tris(b, [[A, B, R1], [A, R1, R0], [D, C, R1], [D, R1, R0], [A, D, R0], [B, C, R1]], ROOF, "up");
}

export function building(b) {
  const L = M.low, T = M.wtower, B = M.main, H = M.ttower;
  // the lower wing inside its parapet, 1 cm inside its walls
  block(b, plan("W", L.plan), FOOT, L.roof, WALL, ROOF);
  prism(b, plan("W", inset(L.plan, 0.01)), L.roof - 0.3, L.parapet.top, WALL, [plan("W", inset(L.plan, L.parapet.width))]);
  // the west tower, from inside the wing's roof, and the lower slope on its south-east side, 5 cm into it
  slopedPrism(b, rect("W", T.u, T.w), L.roof - 0.3, rising("W", 0, T.u, T.low, T.high), TOWER, TOWER);
  const f = T.flank;
  slopedPrism(b, rect("W", f.u, [f.w, T.w[0] + 0.05]), L.roof - 0.3, rising("W", 1, [f.w, T.w[0]], f.foot, f.top), TOWER, TOWER);
  // the main block: its walls and flat roof, the hipped roof on it, and the box on the flat
  block(b, rect("E", B.u, B.w), FOOT - 0.05, B.roof, WALL, ROOF);
  hipped(b, "E", B.u, B.hip.w, B.roof, B.hip.ridge);
  // its north-west part at the south-west end, 5 cm into it (its end 3 cm off the block's)
  block(b, rect("E", [B.nw.u[0] + 0.03, B.nw.u[1]], [B.nw.w[0] - 0.05, B.nw.w[1]]), FOOT - 0.08, B.nw.top, WALL, ROOF);
  block(b, rect("E", B.box.u, B.box.w), B.roof - 0.3, B.box.top, WALL, ROOF);
  // the tall tower, from inside the hipped roof
  slopedPrism(b, rect("E", H.u, H.w), B.roof - 0.3, rising("E", 0, H.u, H.low, H.high), TOWER, TOWER);
}
