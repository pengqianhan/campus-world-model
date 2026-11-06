// The building of the Science Centre's 303S (parts/common.js, MEASURED), drawn in its own frame (u along its face to
// the street, w out of it). Round 1's shape: the body at its roof, the parapet wall along the face, the top storey
// set back from the face inside its parapet, the south-east part inside its parapet, the lower part behind and the
// north-west tip; walls down to FOOT. Parts that meet run into each other, or stand at least 1 cm apart, so that no
// two faces of different materials lie in one plane.
import { FOOT, MEASURED, backAt, inset, plan, rect } from "./common.js";
import { block, prism } from "./shapes.js";

const M = MEASURED, WALL = "claddingPale", ROOF = "roofGrey";

/** A parapet round a [u, w] polygon: from 0.3 m under `roof` to `top`, `width` wide, 1 cm inside its walls. */
function rim(b, corners, roof, top, width) {
  prism(b, plan(inset(corners, 0.01)), roof - 0.3, top, WALL, [plan(inset(corners, width))]);
}

export function building(b) {
  const P = M.parapet, N = M.nw, T = M.top, E = M.se, L = M.low;
  // the parapet wall along the face, from the foot: the face's own north-west end, before the tip
  block(b, rect(P.u, P.w), FOOT - 0.02, P.top, WALL, ROOF);
  // the north-west part, from its end wall to the top storey, its back 5 cm behind the back's line; the parapet along
  // its end wall
  block(b, plan([[N.u[0], M.face], [N.u[1], M.face], [N.u[1], backAt(N.u[1]) - 0.05], [N.u[0], backAt(N.u[0]) - 0.05]]), FOOT, M.roof, WALL, ROOF);
  prism(b, plan([[N.end.u[0] + 0.01, P.w[0]], [N.end.u[1], P.w[0]], [N.end.u[1], backAt(N.end.u[1]) - 0.04], [N.end.u[0] + 0.01, backAt(N.end.u[0] + 0.01) - 0.04]]), M.roof - 0.3, N.end.top, WALL);
  // the ledge before the top storey, into it
  block(b, rect(M.ledge.u, [T.w + 0.05, M.face]), FOOT - 0.05, M.roof, WALL, ROOF);
  // the top storey, its back walls in the body's, inside its parapet
  const top = [[T.u[0], T.w], [T.u[1], T.w], [T.u[1], T.se], [T.notch.u[1], T.se], [T.notch.u[1], T.notch.w[1]],
               [T.notch.u[0], T.notch.w[0]], [T.notch.u[0], backAt(T.notch.u[0])], [T.u[0], backAt(T.u[0])]];
  block(b, plan(top), FOOT - 0.1, T.roof, WALL, ROOF);
  rim(b, top, T.roof, T.parapet.top, T.parapet.width);
  // the south-east part, from inside the top storey to its end face, inside its parapet
  const se = [[E.u[0], M.face], [E.u[1], M.face], [E.u[1], E.w], [E.u[0], E.w]];
  block(b, plan(se), FOOT - 0.12, M.roof, WALL, ROOF);
  rim(b, se, M.roof, E.parapet.top, E.parapet.width);
  // behind the back's diagonal, the lower part, into the top storey
  block(b, plan([[L.u[0], backAt(L.u[0])], [L.u[1], backAt(L.u[1])], [L.u[1], L.w], [L.u[0], L.w]]), FOOT - 0.15, L.top, WALL, ROOF);
  // the north-west tip, to the north-west part's end wall
  block(b, plan(M.tip.plan), FOOT - 0.2, M.tip.top, WALL, ROOF);
}
