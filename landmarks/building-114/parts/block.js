// Building 114's parts: the walls of its two storeys, the eave and the flat roof with its raised strip, and the glass
// stair tower on its south-west face. Sizes from common.js.
import { FOOT, ROOF, TOWER, WALLS, plan } from "./common.js";
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

export function tower(b) {
  prism(b, plan(TOWER.plan), WALLS.floor, ROOF.edge - ROOF.fascia - 0.01, GLASS);
}
