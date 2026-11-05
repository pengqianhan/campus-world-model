// Shapes the parts share: a plan [[x, z], ...] raised between two heights (with holes), a block with its flat roof,
// triangles facing a given way, a convex plan raised to a sloping top, a solid of eight corners, and a strip inside
// a side of a plan.
import * as THREE from "three";

/** The plan raised from y0 to y1, less its holes (plans inside it): its walls and both ends, in `material`. */
export function prism(b, plan, y0, y1, material, holes = []) {
  // A shape in (x, -z) extruded along +z, then turned so that the extrusion runs up y.
  const v = (pts) => pts.map(([x, z]) => new THREE.Vector2(x, -z));
  const s = new THREE.Shape(v(plan));
  for (const h of holes) {
    let p = v(h);
    if (THREE.ShapeUtils.isClockWise(p) === THREE.ShapeUtils.isClockWise(v(plan))) p = p.reverse();
    s.holes.push(new THREE.Path(p));
  }
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

const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];

/** Triangles [[x, y, z] x 3, ...] as one geometry in `material`, each turned to face `way`: "up", or a function of the
 * triangle's centre [x, z] giving the [x, z] it should face toward (a wall: outward). Triangles of no area are
 * dropped. */
export function tris(b, list, material, way = "up") {
  const out = [];
  for (const [p, q, r] of list) {
    const n = cross(sub(q, p), sub(r, p));
    if (Math.hypot(...n) < 1e-6) continue;
    let face;
    if (way === "up") face = n[1] > 0;
    else {
      const c = [(p[0] + q[0] + r[0]) / 3, (p[2] + q[2] + r[2]) / 3], [tx, tz] = way(c);
      face = n[0] * (tx - c[0]) + n[2] * (tz - c[1]) > 0;
    }
    out.push(face ? [p, q, r] : [p, r, q]);
  }
  if (!out.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(out.flat(2), 3));
  b.add(g, material);
}

/** A convex plan raised from y0 to a sloping top at the height `h(x, z)` (a plane): the top in `top`, the walls round
 * it in `wall`, facing out. */
export function slopedPrism(b, plan, y0, h, wall, top) {
  const n = plan.length, c = plan.reduce(([x, z], [px, pz]) => [x + px / n, z + pz / n], [0, 0]);
  const up = plan.map(([x, z]) => [x, h(x, z), z]);
  tris(b, plan.slice(1, -1).map((_, i) => [up[0], up[i + 1], up[i + 2]]), top, "up");
  const sides = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, [p, q] = [plan[i], plan[j]];
    sides.push([[p[0], y0, p[1]], [q[0], y0, q[1]], up[j]], [[p[0], y0, p[1]], up[j], up[i]]);
  }
  tris(b, sides, wall, (m) => [2 * m[0] - c[0], 2 * m[1] - c[1]]);
}

/** A solid of eight corners [x, y, z] (a quad, then the four corners opposite its four in the same order): its six
 * faces, each turned away from its centre. */
export function hexahedron(b, P, material) {
  const c = P.reduce((s, p) => [s[0] + p[0] / 8, s[1] + p[1] / 8, s[2] + p[2] / 8], [0, 0, 0]);
  const out = [];
  for (const [i, j, k, l] of [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]])
    for (const t of [[P[i], P[j], P[k]], [P[i], P[k], P[l]]]) {
      const n = cross(sub(t[1], t[0]), sub(t[2], t[0])), m = [0, 1, 2].map((a) => (t[0][a] + t[1][a] + t[2][a]) / 3);
      if (Math.hypot(...n) < 1e-9) continue;
      out.push(n[0] * (m[0] - c[0]) + n[1] * (m[1] - c[1]) + n[2] * (m[2] - c[2]) > 0 ? t : [t[0], t[2], t[1]]);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(out.flat(2), 3));
  b.add(g, material);
}

/** A strip `width` deep inside the side from `p` to `q` of a plan wound with its inside on the left. */
export function inside(p, q, width) {
  const l = Math.hypot(q[0] - p[0], q[1] - p[1]), n = [-(q[1] - p[1]) / l * width, (q[0] - p[0]) / l * width];
  return [p, q, [q[0] + n[0], q[1] + n[1]], [p[0] + n[0], p[1] + n[1]]];
}
