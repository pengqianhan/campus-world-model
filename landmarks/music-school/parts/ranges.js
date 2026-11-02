// The ranges south and west of the courtyard and the low link at its east corner: walls round each plan,
// under roofs that are the lowest of a few planes fitted to the LiDAR (parts/common.js): the south range's
// hipped gable along x, the south-east part's gable along z, single planes over the north-west block and the
// west corner; the stack on the south-east part's ridge. No photograph shows them: plain walls.
import { FOOT, MEASURED } from "./common.js";
import { lowestPlanes } from "./shapes.js";

const M = MEASURED, T = 0.15; // the roof's own thickness over its walls (estimated)

export function ranges(b) {
  for (const k of ["south", "southeast", "northwest", "west"]) lowestPlanes(b, M[k].plan, M[k].planes, FOOT, "paint", "roofPale", T);
  lowestPlanes(b, M.link.plan, [[M.link.top, 0, 0]], FOOT, "paint", "roofPale", T);
  const s = M.stack;
  b.box(s.x[0], s.x[1], 8.0, s.top, s.z[0], s.z[1], "paint");
}
