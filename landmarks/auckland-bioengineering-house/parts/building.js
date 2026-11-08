// Auckland Bioengineering House (439; parts/common.js, MEASURED), drawn in its own frame (u east, w north).
// Round 0: each part a block at the LiDAR's plan and height: the tower with its roof inside a parapet and the plant
// room on it; the lower building round its north and east sides, with the strip along the tower's east face and the
// part before its north face. Walls down to FOOT. Parts that meet run into each other, so that no two faces of
// different materials lie in one plane.
import { FOOT, MEASURED, inset, plan, rect } from "./common.js";
import { block, prism } from "./shapes.js";

const M = MEASURED, WALL = "claddingPale", ROOF = "roofGrey";

export function building(b) {
  const T = M.tower, L = M.low;
  // the tower, its roof inside a parapet 1 cm inside its walls, and the plant room on the roof
  block(b, plan(T.plan), FOOT, T.roof, WALL, ROOF);
  prism(b, plan(inset(T.plan, 0.01)), T.roof - 0.3, T.parapet.top, WALL, [plan(inset(T.plan, T.parapet.width))]);
  block(b, rect(M.plant.u, M.plant.w), T.roof - 0.3, M.plant.top, WALL, ROOF);
  // the lower building, run into the tower, its foot 5 cm under the tower's; on its roof the strip and the part
  // before the tower's north face, each from 0.3 m under that roof
  block(b, plan(L.plan), FOOT - 0.05, L.roof, WALL, ROOF);
  block(b, rect(M.strip.u, M.strip.w), L.roof - 0.3, M.strip.top, WALL, ROOF);
  block(b, plan(M.porch.plan), L.roof - 0.3, M.porch.top, WALL, ROOF);
}
