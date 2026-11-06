// The building of the Science Centre's 303S (parts/common.js, MEASURED), drawn in its own frame (u along its face to
// the street, w out of it). Round 0: each part a block at the LiDAR's plan and height, walls down to FOOT: the
// north-west part and the parapet along the face at 30.4 m, the top storey set back from the face, the south-east
// part, the lower part behind and the north-west tip. Parts that meet run into each other, or stand 5 cm apart, so
// that no two faces of different materials lie in one plane.
import { FOOT, MEASURED, backAt, plan, rect } from "./common.js";
import { block } from "./shapes.js";

const M = MEASURED, WALL = "concrete", ROOF = "roofGrey";

export function building(b) {
  const F = M.face + 0.05, N = M.nw, R = M.front, T = M.top, E = M.se, L = M.low;
  // the north-west part, its front 5 cm before the face's line and its back 5 cm behind the back's line
  block(b, plan([[N.u[0] - 0.05, F], [N.u[1], F], [N.u[1], backAt(N.u[1]) - 0.05], [N.u[0] - 0.05, backAt(N.u[0] - 0.05) - 0.05]]), FOOT, N.top, WALL, ROOF);
  // the face's parapet along the top storey's front, into the top storey
  block(b, rect(R.u, [R.w + 0.05, F]), FOOT - 0.05, R.top, WALL, ROOF);
  // the top storey, from the north-west part to the south-east part, back to the back's line and the notch
  block(b, plan([[T.u[0], T.w], [T.u[1], T.w], [T.u[1], T.se], [T.notch.u[1], T.se], [T.notch.u[1], T.notch.w[1]],
                 [T.notch.u[0], T.notch.w[0]], [T.notch.u[0], backAt(T.notch.u[0])], [T.u[0], backAt(T.u[0])]]), FOOT - 0.1, T.roof, WALL, ROOF);
  // the south-east part, from inside the top storey to its end face
  block(b, rect(E.u, [E.w, M.face]), FOOT - 0.12, E.top, WALL, ROOF);
  // behind the back's line, the lower part, into the top storey
  block(b, plan([[L.u[0], backAt(L.u[0])], [L.u[1], backAt(L.u[1])], [L.u[1], L.w], [L.u[0], L.w]]), FOOT - 0.15, L.top, WALL, ROOF);
  // the north-west tip, into the north-west part
  block(b, plan(M.tip.plan), FOOT - 0.2, M.tip.top, WALL, ROOF);
}
