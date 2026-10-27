// The foot on the street side (parts/common.js MEASURED.canopy, .deck and .ramp), where the LiDAR sees it through
// the trees: the entrance's red tile canopy off the west corner, and the ramp's white concrete deck with its
// parapet west of the tower, at the LiDAR's heights; and the ramp's white parapet along the street, through the
// fitted camera at the LiDAR's parapet height. Round 2 (the lead). What runs on under the trees (the
// deck to its end on the street, the car park's red columns, the lavender) is not drawn.
import * as THREE from "three";
import { MEASURED as M } from "./common.js";
import { prism } from "./shapes.js";

export function canopy(b) {
  const { plan, top, depth } = M.canopy;
  prism(b, plan, top - depth, top, "roofTile");
}

export function deck(b) {
  const { x: [x0, x1], z: [z0, z1], top, parapet } = M.deck;
  const box = (ax, bx, ay, by, az, bz, material) => {
    const g = new THREE.BoxGeometry(bx - ax, by - ay, bz - az);
    g.translate((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
    b.add(g, material);
  };
  box(x0, x1, top - 0.5, top, z0, z1, "paint");           // the deck's slab
  box(x1 - 0.25, x1, top, parapet, z0, z1, "paint");      // its parapet on the west edge
}

/** The ramp's white parapet along the street (MEASURED.ramp), 0.3 m thick (estimated), one box a stretch. */
export function ramp(b) {
  const { line, top, bottom } = M.ramp;
  for (let i = 0; i + 1 < line.length; i++) {
    const [x0, z0] = line[i], [x1, z1] = line[i + 1], L = Math.hypot(x1 - x0, z1 - z0);
    const g = new THREE.BoxGeometry(L + 0.3, top - bottom, 0.3);
    g.rotateY(-Math.atan2(z1 - z0, x1 - x0));
    g.translate((x0 + x1) / 2, (top + bottom) / 2, (z0 + z1) / 2);
    b.add(g, "paint");
  }
}
