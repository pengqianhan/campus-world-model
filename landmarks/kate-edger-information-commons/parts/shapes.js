// Shapes the parts share: a plan [[x, z], ...] raised between two heights, and a block with its flat roof.
import * as THREE from "three";

/** The plan raised from y0 to y1: its walls and both ends, in `material`. */
export function prism(b, plan, y0, y1, material) {
  // A shape in (x, -z) extruded along +z, then turned so that the extrusion runs up y.
  const s = new THREE.Shape(plan.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  b.add(g, material);
}

/** A block: walls round the plan from y0 to the underside of its roof, and the roof, `t` thick, with its top at
 * `top`. */
export function block(b, plan, y0, top, wall, roof, t = 0.15) {
  prism(b, plan, y0, top - t, wall);
  prism(b, plan, top - t, top + 0.01, roof);
}
