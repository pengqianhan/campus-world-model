// The M&HS Building's long block (its four roofs), the atrium at its west end, the link north of it and the low
// strip west of the atrium. Sizes from common.js.
import { ATRIUM, EAST_PART, FOOT, LINK, MIDDLE, NORTH, SOUTH, WEST, plan, rect } from "./common.js";
import { block } from "./shapes.js";

const WALL = "plain", ROOF = "roofGrey", GLASS = "glass";

/** The long block: its four parts, each from FOOT to its own roof. */
export function body(b) {
  for (const P of [MIDDLE, NORTH, EAST_PART, SOUTH]) block(b, plan(P.plan), FOOT, P.top, WALL, ROOF);
}

/** The atrium, the link and the low strip west of the atrium. */
export function west(b) {
  block(b, rect(ATRIUM.u, ATRIUM.w), FOOT, ATRIUM.top, WALL, GLASS);
  block(b, rect(LINK.u, LINK.w), FOOT, LINK.top, WALL, ROOF);
  block(b, rect(WEST.u, WEST.w), FOOT, WEST.top, WALL, ROOF);
}
