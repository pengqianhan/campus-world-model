// Security's parts: the block to its roof, the parapet round the roof, and the two blocks on the roof. Sizes from
// common.js.
import * as THREE from "three";
import { FOOT, HIGH, OUTLINE, PARAPET, ROOF, plan } from "./common.js";
import { block, inset } from "./shapes.js";

// The walls pale grey, as the photograph shows the concrete; the roofs mid-grey.
const WALL = "paint", ROOFS = "roofGrey";

/** A closed plan's line moved `d` inward. */
function inward(ring, d) {
  let a = 0;
  ring.forEach(([x, z], i) => { const [x1, z1] = ring[(i + 1) % ring.length]; a += x * z1 - x1 * z; });
  return inset([ring[ring.length - 1], ...ring, ring[0]], a > 0 ? d : -d).slice(1, -1);
}

/** The plan between an outer and an inner line raised from y0 to y1 (a parapet): as prism, with the inner line as a
 * hole. */
function ring(b, outer, inner, y0, y1, material) {
  const s = new THREE.Shape(outer.map(([x, z]) => new THREE.Vector2(x, -z)));
  s.holes.push(new THREE.Path(inner.map(([x, z]) => new THREE.Vector2(x, -z))));
  const g = new THREE.ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  b.add(g, material);
}

/** The block: its walls from the walls' foot to the roof, the roof, and the parapet round it. */
export function main(b) {
  const outer = plan(OUTLINE);
  block(b, outer, FOOT, ROOF, WALL, ROOFS);
  ring(b, outer, inward(outer, PARAPET.thick), ROOF, PARAPET.top, WALL);
}

/** The box at the west corner and the block toward the east end, standing on the roof. */
export function high(b) {
  for (const h of HIGH) block(b, plan(h.plan), ROOF - 0.1, h.top, WALL, ROOFS);
}
