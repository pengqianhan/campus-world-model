// The building of the Science Centre's 303 (parts/common.js, MEASURED), drawn in its own frame (u along its face to
// the street, w out of it). Round 0: each part a block at the LiDAR's plan and height, walls down to FOOT: the range
// along the street with its parapet, the slab behind it with its raised part and plant, the block behind toward
// the south-west and the wing toward the north-east. Parts that meet run into each other, so that no two faces lie
// in one plane.
import { FOOT, MEASURED, rect } from "./common.js";
import { block, prism } from "./shapes.js";

const M = MEASURED, WALL = "concrete", ROOF = "roofGrey";

export function building(b) {
  const R = M.range, S = M.slab;
  // the range along the street, into the slab behind it; its north-east end back to the slab's back line
  block(b, rect(R.u, [R.w[0] - 0.3, R.w[1]]), FOOT, R.roof, WALL, ROOF);
  block(b, rect(R.ne.u, [R.ne.w[0] + 0.1, R.ne.w[1] + 0.3]), FOOT - 0.05, R.roof, WALL, ROOF);
  // the parapet along the face, from inside the range's walls
  prism(b, rect(R.u.map((u, i) => u + (i ? -0.01 : 0.01)), [-R.parapet.width, -0.01]), R.roof - 0.3, R.parapet.top, WALL);
  // the slab, its raised part and its plant
  block(b, rect(S.u, S.w), FOOT - 0.1, S.roof, WALL, ROOF);
  block(b, rect(S.raised.u, S.raised.w), S.roof - 0.3, S.raised.top, WALL, ROOF);
  block(b, rect(S.plant.u, S.plant.w), S.roof - 0.3, S.plant.top, WALL, ROOF);
  // behind it: the block toward the south-west and the wing toward the north-east, each running into the slab
  block(b, rect(M.rear.u, M.rear.w), FOOT - 0.15, M.rear.roof, WALL, ROOF);
  block(b, rect(M.wing.u, M.wing.w), FOOT - 0.2, M.wing.roof, WALL, ROOF);
}
