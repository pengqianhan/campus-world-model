// Shapes the parts share: a plan [[x, z], ...] raised between two heights, a block with its flat roof, triangles
// facing a given way, the surface between two lines of points (a roof's slopes from its eaves to its ridge), a roof
// of planes over a convex plan, and a line of points moved inward.
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

const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];

/** Triangles [[x, y, z] x 3, ...] as one geometry in `material`, each turned to face `way`: "up", "down", or a
 * function of the triangle's centre giving the [x, z] it should face toward (a wall: outward). A triangle that is
 * neither (an upright one where "up" is asked) is drawn on both sides. Triangles of no area are dropped. */
export function tris(b, list, material, way = "up") {
  const out = [];
  for (const [p, q, r] of list) {
    const n = cross(sub(q, p), sub(r, p)), len = Math.hypot(...n);
    if (len < 1e-6) continue;
    let face;
    if (way === "up" || way === "down") {
      const ny = n[1] / len;
      if (Math.abs(ny) < 0.05) { out.push([p, q, r], [p, r, q]); continue; }
      face = way === "up" ? ny > 0 : ny < 0;
    } else {
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

/** The surface between two lines of points [[x, y, z], ...] of the same length, point i of one joined to point i
 * of the other (a point repeated in one line makes a triangle: a hip); `closed` joins the last points to the
 * first. Faces up. */
export function loft(b, outer, inner, material, closed = false) {
  const list = [], n = outer.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const j = (i + 1) % n;
    list.push([outer[i], outer[j], inner[j]], [outer[i], inner[j], inner[i]]);
  }
  tris(b, list, material, "up");
}

/** A roof over [x0, x1] x [z0, z1] with its eaves at `eave` and its ridge at `ridge`: along x on z = `at`
 * (`along` "x") or along z on x = `at` ("z"). Each end hipped back by its hip, in metres; an end with a hip of 0
 * has a gable, drawn on both sides (review, round 1: the street wing's middle's end in the corner was left open,
 * and a sliver of it stood outside the corner's roof). */
export function hipRoof(b, [x0, x1], [z0, z1], eave, ridge, along, at, [hip0, hip1], material) {
  const e = (x, z) => [x, eave, z];
  if (along === "x") {
    const r0 = [x0 + hip0, ridge, at], r1 = [x1 - hip1, ridge, at];
    loft(b, [e(x0, z0), e(x1, z0), e(x1, z1), e(x0, z1)], [r0, r1, r1, r0], material, true);
  } else {
    const r0 = [at, ridge, z0 + hip0], r1 = [at, ridge, z1 - hip1];
    loft(b, [e(x1, z0), e(x1, z1), e(x0, z1), e(x0, z0)], [r0, r1, r1, r0], material, true);
  }
}

/** The part of a convex plan [[x, z], ...] where c + cx x + cz z <= 0, for `line` [c, cx, cz]. */
function clip(plan, [c, cx, cz]) {
  const f = ([x, z]) => c + cx * x + cz * z, out = [];
  plan.forEach((p, i) => {
    const q = plan[(i + 1) % plan.length], fp = f(p), fq = f(q);
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
  });
  return out;
}

/** A roof over a convex plan [[x, z], ...]: at each point the lowest of the planes [a, u, v] (the height a + u x +
 * v z), each plane drawn where it is the lowest. Returns the roof's edge: for each side of the plan, its points
 * [x, y, z] from its first corner to the next, with a point wherever the plane over it changes. */
export function envelope(b, plan, planes, material) {
  const list = [], at = ([a, u, v], [x, z]) => a + u * x + v * z;
  planes.forEach((P, i) => {
    let part = plan;
    planes.forEach((Q, j) => { if (j !== i && part.length) part = clip(part, [P[0] - Q[0], P[1] - Q[1], P[2] - Q[2]]); });
    const pt = (p) => [p[0], at(P, p), p[1]];
    for (let k = 1; k + 1 < part.length; k++) list.push([pt(part[0]), pt(part[k]), pt(part[k + 1])]);
  });
  tris(b, list, material, "up");
  const low = (p) => Math.min(...planes.map((P) => at(P, p)));
  return plan.map((p, i) => {
    const q = plan[(i + 1) % plan.length], ts = [0, 1], on = (t) => [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])];
    planes.forEach((P, j) => planes.forEach((Q, k) => {
      if (k <= j) return;
      const f0 = at(P, p) - at(Q, p), f1 = at(P, q) - at(Q, q);
      if ((f0 < 0 && f1 > 0) || (f0 > 0 && f1 < 0)) ts.push(f0 / (f0 - f1));
    }));
    return ts.sort((s, t) => s - t).map((t) => { const r = on(t); return [r[0], low(r), r[1]]; });
  });
}

/** An open line of plan points [[x, z], ...] moved `d` to its left (inward, for a line that runs round a building
 * with the building on its left): each corner where the moved lines of its two sides meet. */
export function inset(line, d) {
  const n = line.length, left = (a, c) => { const l = Math.hypot(c[0] - a[0], c[1] - a[1]); return [-(c[1] - a[1]) / l, (c[0] - a[0]) / l]; };
  return line.map((p, i) => {
    const a = i > 0 ? left(line[i - 1], p) : null, c = i < n - 1 ? left(p, line[i + 1]) : null;
    if (!a || !c) { const m = a ?? c; return [p[0] + m[0] * d, p[1] + m[1] * d]; }
    const s = 1 + a[0] * c[0] + a[1] * c[1];
    return [p[0] + ((a[0] + c[0]) / s) * d, p[1] + ((a[1] + c[1]) / s) * d];
  });
}
