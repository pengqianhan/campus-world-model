// Building 114's parts: the walls of its two storeys, the eave and the flat roof with its raised strip, and the two
// glass stair towers on its south-west face, with the canopy beside the north-west one. Sizes from common.js.
import { CANOPY, FOOT, ROOF, TOWER, TOWER2, WALLS, plan } from "./common.js";
import { block, inset, prism } from "./shapes.js";

// The walls and the fascia white cladding, as the photograph shows the south-west face; the roofs light grey, as the
// photograph and the 2023 aerial show them.
const WALL = "paint", ROOFS = "roofPale", GLASS = "glassPale";

export function body(b) {
  prism(b, plan(WALLS.plan), FOOT, ROOF.edge - ROOF.fascia, WALL);
}

/** The eave: a slab from the fascia's foot to the roof's edge over the whole roof; on it the flat roof, rising to its
 * top 0.4 m in from the edge, and the raised strip. */
export function roof(b) {
  prism(b, plan(ROOF.plan), ROOF.edge - ROOF.fascia, ROOF.edge, WALL);
  const p = ROOF.plan, ring = inset([...p, p[0], p[1]], 0.4).slice(1, 5);
  prism(b, plan(ring), ROOF.edge - 0.05, ROOF.top, ROOFS);
  block(b, plan(ROOF.strip.plan), ROOF.top - 0.1, ROOF.strip.top, ROOFS, ROOFS);
}

/** The stair tower: its glass from the floor to the eave's underside, on a plinth from the walls' foot to the floor (it
 * starts 0.1 m inside the wall, so that no two faces meet in one plane). */
export function tower(b) {
  prism(b, plan(TOWER.plan), WALLS.floor, ROOF.edge - ROOF.fascia - 0.01, GLASS);
  const [[u0, w0], [u1], , [, w1]] = TOWER.plan;
  prism(b, plan([[u0, w0 - 0.1], [u1, w0 - 0.1], [u1, w1], [u0, w1]]), FOOT, WALLS.floor, WALL);
}

/** The north-west stair tower, glass from its ground to the eave's underside on a plinth like the other's, and the
 * canopy beside it, from the wall, open under it. */
export function northwest(b) {
  prism(b, plan(TOWER2.plan), TOWER2.base, ROOF.edge - ROOF.fascia - 0.01, GLASS);
  const [[u0, w0], [u1], , [, w1]] = TOWER2.plan;
  prism(b, plan([[u0, w0 - 0.1], [u1, w0 - 0.1], [u1, w1], [u0, w1]]), FOOT, TOWER2.base, WALL);
  prism(b, plan(CANOPY.plan), CANOPY.y[0], CANOPY.y[1], WALL);
}
