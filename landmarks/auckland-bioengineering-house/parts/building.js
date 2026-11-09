// Auckland Bioengineering House (439; parts/common.js, MEASURED), drawn in its own frame (u east, w north).
// Round 0: each part a block at the LiDAR's plan and height: the tower with its roof inside a parapet and the plant
// room on it; the lower building round its north and east sides, with the strip along the tower's east face and the
// part before its north face. Round 1's faces: the tower's walls and parapet in glass, and the two stone fins on its
// north face. Walls down to FOOT. Parts that meet run into each other, so that no two faces of different materials lie
// in one plane.
import { FOOT, MEASURED, inset, plan, rect } from "./common.js";
import { block, prism } from "./shapes.js";

const M = MEASURED, WALL = "claddingPale", ROOF = "roofGrey", GLASS = "glass", STONE = "concrete";

export function building(b) {
  const T = M.tower, L = M.low;
  // the tower in glass, its roof inside a parapet 1 cm inside its walls, and the plant room on the roof
  block(b, plan(T.plan), FOOT, T.roof, GLASS, ROOF);
  prism(b, plan(inset(T.plan, 0.01)), T.roof - 0.3, T.parapet.top, GLASS, [plan(inset(T.plan, T.parapet.width))]);
  // the stone fins on its north face, between its corners 5 and 6, from 0.35 m inside it (past the parapet's inner
  // face, 0.3 m in) to M.fins.out before it, their feet 5 cm over the tower's
  const [a, c] = [T.plan[5], T.plan[6]], len = Math.hypot(c[0] - a[0], c[1] - a[1]);
  const d = [(c[0] - a[0]) / len, (c[1] - a[1]) / len], n = [d[1], -d[0]];  // along the face, westward; north, out
  for (const [u0, u1] of M.fins.along) {
    const s0 = (u1 - a[0]) / d[0], s1 = (u0 - a[0]) / d[0];
    const pt = (s, t) => [a[0] + s * d[0] + t * n[0], a[1] + s * d[1] + t * n[1]];
    const foot = [pt(s0, -0.35), pt(s1, -0.35), pt(s1, M.fins.out), pt(s0, M.fins.out)];
    prism(b, plan(foot), FOOT + 0.05, M.fins.top, STONE);
  }
  block(b, rect(M.plant.u, M.plant.w), T.roof - 0.3, M.plant.top, WALL, ROOF);
  // the lower building, run into the tower, its foot 5 cm under the tower's; on its roof the strip and the part
  // before the tower's north face, each from 0.3 m under that roof
  block(b, plan(L.plan), FOOT - 0.05, L.roof, WALL, ROOF);
  block(b, rect(M.strip.u, M.strip.w), L.roof - 0.3, M.strip.top, WALL, ROOF);
  block(b, plan(M.porch.plan), L.roof - 0.3, M.porch.top, WALL, ROOF);
}
