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

/** The plan raised from lo(x, z) to hi(x, z): a prism whose foot and top need not be level. Each should be linear in
 * x and z over the plan, so that both ends stay flat. */
export function prismBetween(b, plan, lo, hi, material) {
  const s = new THREE.Shape(plan.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const [x, z] = [p.getX(i), p.getZ(i)];
    p.setY(i, p.getY(i) < 0.5 ? lo(x, z) : hi(x, z));
  }
  g.computeVertexNormals();
  b.add(g, material);
}

/** A panel `t` thick hung `off` before the face from plan point a to plan point c: n is the face's outward unit
 * normal [x, z]; from y0 to y1. */
export function panel(b, a, c, n, off, t, y0, y1, material) {
  const at = (p, d) => [p[0] + n[0] * d, p[1] + n[1] * d];
  prism(b, [at(a, off), at(c, off), at(c, off + t), at(a, off + t)], y0, y1, material);
}

/** A block: walls round the plan from y0 to the underside of its roof, and the roof, `t` thick, with its top at
 * `top`. */
export function block(b, plan, y0, top, wall, roof, t = 0.15) {
  prism(b, plan, y0, top - t, wall);
  prism(b, plan, top - t, top + 0.01, roof);
}
