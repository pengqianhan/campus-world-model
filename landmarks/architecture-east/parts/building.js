// Architecture - East (421E; parts/common.js, MEASURED), drawn in its two frames (u along the walls, w across them).
// Round 1's shape: the lower wing, its corner cut square with the main block, inside its parapet; the west tower on
// it with the lower slope on its south-east side; the main block, its flat roof and the hipped roof on it, and a box
// on the flat; the tall tower out of the hipped roof. Round 1's faces: on the main block's north-west faces a louvred
// parapet and a band of windows on each floor, under its north-west eave a face in the towers' dark cladding with
// dormers out of it, and round the wing a band of windows on each floor. Walls down to FOOT. Parts that meet run into
// each other, so that no two faces of different materials lie in one plane.
import { FOOT, MEASURED, inset, plan, rect } from "./common.js";
import { block, prism, slopedPrism, tris } from "./shapes.js";

const M = MEASURED, WALL = "claddingPale", ROOF = "roofGrey", TOWER = "screenGrey", GLASS = "glass", LOUVRE = "plain";

/** The floors' levels from the first at or above `from` to the last below `to`, every M.floors.every, in step with
 * the terrace's floor. */
function levels(from, to) {
  const F = M.floors, out = [];
  for (let y = F.first + Math.ceil((from - F.first) / F.every) * F.every; y < to; y += F.every) out.push(y);
  return out;
}

/** On each floor from the terrace's up, below `top`, of the face at w `wf` from u0 to u1 (frame E): the louvred
 * parapet and over it the band of windows, standing out of the face, the windows' head no higher than `top`. */
function floorsOn(b, [u0, u1], wf, top) {
  const P = M.parapet, W = M.windows;
  for (const y of levels(M.floors.first, top - P.height)) {
    prism(b, rect("E", [u0, u1], [wf - 0.01, wf + P.out]), y, y + P.height, LOUVRE);
    prism(b, rect("E", [u0, u1], [wf - 0.01, wf + W.out]), y + W.sill, Math.min(y + W.head, top - 0.1), GLASS);
  }
}

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

/** A hipped roof over the rectangle u x w of frame `F`, from its eaves on the w0 side at `base0` and on the w1 side
 * at `base1` (above it) to a ridge along u at `ridge.w`, `ridge.top` high, from ridge.u[0] to ridge.u[1]: its two
 * long slopes and two hips in ROOF; under the higher eave a face in `face` down to base0, and at each end the
 * triangle below the hip's foot, 2 cm inside it. */
function hipped(b, F, [u0, u1], [w0, w1], base0, base1, ridge, face = WALL) {
  const A = P(F, u0, w0, base0), B = P(F, u1, w0, base0), C = P(F, u1, w1, base1), D = P(F, u0, w1, base1);
  const R0 = P(F, ridge.u[0], ridge.w, ridge.top), R1 = P(F, ridge.u[1], ridge.w, ridge.top);
  tris(b, [[A, B, R1], [A, R1, R0], [D, C, R1], [D, R1, R0], [A, D, R0], [B, C, R1]], ROOF, "up");
  if (base1 <= base0) return;
  const toward = (du, dw) => (m) => {
    const [x, , z] = P(F, du, dw, 0), [ox, , oz] = P(F, 0, 0, 0);
    return [m[0] + x - ox, m[1] + z - oz];
  };
  const Cl = P(F, u1, w1, base0), Dl = P(F, u0, w1, base0);
  tris(b, [[Dl, Cl, C], [Dl, C, D]], face, toward(0, 1));
  const e = 0.02;
  tris(b, [[P(F, u0 + e, w0, base0), P(F, u0 + e, w1, base1), P(F, u0 + e, w1, base0)]], face, toward(-1, 0));
  tris(b, [[P(F, u1 - e, w0, base0), P(F, u1 - e, w1, base1), P(F, u1 - e, w1, base0)]], face, toward(1, 0));
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
  hipped(b, "E", B.u, B.hip.w, B.roof, B.hip.eave, B.hip.ridge, TOWER);
  // its north-west part at the south-west end, 5 cm into it (its end 3 cm off the block's)
  block(b, rect("E", [B.nw.u[0] + 0.03, B.nw.u[1]], [B.nw.w[0] - 0.05, B.nw.w[1]]), FOOT - 0.08, B.nw.top, WALL, ROOF);
  block(b, rect("E", B.box.u, B.box.w), B.roof - 0.3, B.box.top, WALL, ROOF);
  // the tall tower, from inside the hipped roof
  slopedPrism(b, rect("E", H.u, H.w), B.roof - 0.3, rising("E", 0, H.u, H.low, H.high), TOWER, TOWER);
  // the floors on the north-west faces: the north-west part's, and the block's from where the terrace meets it
  floorsOn(b, [B.nw.u[0] + 0.1, B.nw.u[1] - 0.05], B.nw.w[1], B.nw.top);
  floorsOn(b, [B.nw.u[1] + 0.05, B.u[1] - 0.05], B.w[1], B.roof);
  // on the flat roof's ledge, a louvred parapet along its edge, and the dormers out of the face under the eave
  prism(b, rect("E", [B.nw.u[1] + 0.05, B.u[1] - 0.05], [B.w[1] - 0.3, B.w[1] + M.parapet.out]), B.roof - 0.12, B.roof + M.parapet.height - 0.1, LOUVRE);
  const D = M.dormers, hw = D.width / 2, ew = B.hip.w[1], y0 = B.roof + D.sill, y1 = y0 + D.height;
  for (let c = D.u[0] + hw; c + hw <= D.u[1]; c += D.every) {
    prism(b, rect("E", [c - hw, c + hw], [ew - 0.05, ew + D.out]), y0, y1, TOWER);
    prism(b, rect("E", [c - hw + D.pane, c + hw - D.pane], [ew + D.out - 0.01, ew + D.out + 0.03]), y0 + D.pane, y1 - D.pane, GLASS);
  }
  // round the wing, a band of windows on each floor from the terrace's up to its roof, 3 cm out of its walls (below the
  // terrace, where the photograph sees none, its walls are plain)
  const WW = M.wingWindows;
  for (const y of levels(M.floors.first, L.roof - WW.head))
    prism(b, plan("W", inset(L.plan, -M.windows.out)), y + WW.sill, y + WW.head, GLASS, [plan("W", inset(L.plan, 0.3))]);
}
