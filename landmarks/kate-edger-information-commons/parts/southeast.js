// The south-east range (parts/common.js, MEASURED.southeast) and what stands on its roof: the long upper strip,
// the upper block south-west of it and the plant beyond. Round 0: flat-topped blocks at the LiDAR's heights, plain
// walls. Round 1: the faces seen from Alfred Street (MEASURED.faces): the screens and the glazing of its
// north-east end, its corner's glazing, the mesh panels on its face to the atrium's open end, and the shopfront
// across that end at the court's level.
import { FOOT, MEASURED } from "./common.js";
import { block, panel } from "./shapes.js";

const M = MEASURED;

export function southeast(b) {
  block(b, M.southeast.plan, FOOT, M.southeast.top, "claddingPale", "roofGrey");
}

/** The upper strip, the upper block and the plant: each from 0.3 m below the range's roof, so that its foot is
 * inside the range. */
export function upper(b) {
  const y0 = M.southeast.top - 0.3;
  for (const k of ["strip", "block", "plant"]) block(b, M[k].plan, y0, M[k].top, "claddingPale", "roofGrey");
}

/** The north-east end's faces. Each pane and screen stands 3 cm or more before its wall and its top 5 cm under
 * the roof, and where two meet one ends inside the other, so that none lies in the plane of another face. */
export function facade(b) {
  const F = M.faces, top = M.southeast.top - 0.05;
  const [ne0, ne1, step, back, next] = M.southeast.plan.slice(0, 5);
  // the north-east face (x -31.0): green-tinted glazing under the screens, the screens before it
  panel(b, [ne0[0], F.screens.z0], [ne1[0], ne1[1] - 0.1], [-1, 0], 0.03, 0.05, FOOT + 0.05, F.screens.y0 + 0.05, "glassGreen");
  panel(b, [ne0[0], F.screens.z0], [ne1[0], F.screens.z1], [-1, 0], F.screens.out, 0.05, F.screens.y0, top, "screenSilver");
  // the corner: the face at z -10.5 (facing north-west), its pane ending inside the set-back face's, and the set-back
  // face at x -28.0, glazed from 2.9 m
  panel(b, ne1, [step[0] - 0.05, step[1]], [0, 1], 0.03, 0.05, F.corner.y0, top, "glassGreen");
  panel(b, step, back, [-1, 0], 0.03, 0.05, F.corner.y0, top, "glassGreen");
  // the face to the atrium's open end, from (-28.0, -4.0) along the plan's next edge: glazing, the mesh before it
  const d = [next[0] - back[0], next[1] - back[1]], l = Math.hypot(d[0], d[1]);
  const n = [-d[1] / l, d[0] / l];                                  // its outward normal, toward the atrium
  const end = [F.mesh.x1, back[1] + (d[1] / d[0]) * (F.mesh.x1 - back[0])];
  panel(b, back, end, n, 0.03, 0.05, F.mesh.y0, top, "glassGreen");
  panel(b, back, end, n, F.mesh.out, 0.05, F.mesh.y0, top, "screenGrey");
  // across the atrium's end at the court's level, the dark shopfront, its top and its back into the atrium's floor
  const S = F.shop;
  b.box(S.x - 0.08, S.x + 0.12, FOOT + 0.05, S.y1 + 0.05, S.z0 - 0.2, S.z1 + 0.15, "glass");
}
