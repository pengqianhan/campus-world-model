// The foot on the street side (parts/common.js MEASURED.canopy, .deck and .ramp), where the LiDAR sees it through
// the trees: the entrance's red tile canopy off the west corner and the ramp's white concrete deck west of the
// tower, at the LiDAR's heights (round 2, the lead); and the ramp's white side along the street, on the LiDAR's
// line, its top and foot from MGAo's photographs through the fitted camera (round 3), and under it down to FOOT
// where it stands on the pavement (round 4). What runs on under the trees (the ramp's walk between its sides, the car park's red
// columns, the plants in the planter) is not drawn.
import * as THREE from "three";
import { MEASURED as M, FOOT } from "./common.js";
import { prism } from "./shapes.js";

export function canopy(b) {
  const { plan, top, depth } = M.canopy;
  prism(b, plan, top - depth, top, "roofTile");
}

export function deck(b) {
  const { x: [x0, x1], z: [z0, z1], top } = M.deck;
  const g = new THREE.BoxGeometry(x1 - x0, 0.5, z1 - z0);  // the deck's slab
  g.translate((x0 + x1) / 2, top - 0.25, (z0 + z1) / 2);
  b.add(g, "paint");
}

/** The ramp's side along the street (MEASURED.ramp), 0.3 m thick (estimated), in the kit's grey: in MGAo's
 * door and upper views its face is a neutral light grey, luma 150 (RGB 151, 151, 146; the white paint renders
 * near 235). One wall a stretch of its line, its foot and its top running straight between the heights given
 * at the line's corners, each stretch 0.15 m longer at both ends so that the corners close. */
export function ramp(b) {
  const { line, top, foot } = M.ramp;
  for (let i = 0; i + 1 < line.length; i++) wall(b, line, i, [foot[i], foot[i + 1]], [top[i], top[i + 1]]);
}

/** Under the ramp's side where it stands on the pavement (from the corner MEASURED.ramp.stands on): the same
 * wall from its foot, the LiDAR's ground there, down to FOOT, as the walls go down, so that it meets the map's
 * ground, which lies lower there than the LiDAR's (round 4). It stands below the street in the photographs:
 * the compare draws it as the ground (config compare.underground). */
export function rampFoot(b) {
  const { line, foot, stands } = M.ramp;
  for (let i = stands; i + 1 < line.length; i++) wall(b, line, i, [FOOT, FOOT], [foot[i], foot[i + 1]]);
}

/** The ramp's wall along stretch i of its line, from `low` to `high` at its two corners. */
function wall(b, line, i, low, high) {
  const t = 0.3, over = 0.15;
  const [x0, z0] = line[i], [x1, z1] = line[i + 1], L = Math.hypot(x1 - x0, z1 - z0);
  const g = new THREE.BoxGeometry(L + 2 * over, 1, t);
  const p = g.attributes.position;
  for (let k = 0; k < p.count; k++) {
    const u = p.getX(k) / L + 0.5;  // 0 at corner i, 1 at corner i + 1
    p.setY(k, p.getY(k) > 0 ? high[0] + (high[1] - high[0]) * u : low[0] + (low[1] - low[0]) * u);
  }
  g.computeVertexNormals();
  g.rotateY(-Math.atan2(z1 - z0, x1 - x0));
  g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
  b.add(g, "grey");
}
