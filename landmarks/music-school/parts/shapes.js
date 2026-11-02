// Shapes the parts share: a plan [[x, z], ...] raised between two heights, its flat top, and bands
// along its edges.
import * as THREE from "three";

/** The plan's signed area in (x, z): positive when its corners run from +x toward +z. */
function area(plan) {
  let s = 0;
  for (let i = 0; i < plan.length; i++) { const [x0, z0] = plan[i], [x1, z1] = plan[(i + 1) % plan.length]; s += x0 * z1 - x1 * z0; }
  return s / 2;
}

/** The plan raised from y0 to y1: its walls and both ends, in `material`. */
export function prism(b, plan, y0, y1, material) {
  // A shape in (x, -z) extruded along +z, then turned so that the extrusion runs up y.
  const s = new THREE.Shape(plan.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  b.add(g, material);
}

/** A flat roof over the plan at height y, `t` thick, in `material`. */
export function roof(b, plan, y, t, material) {
  prism(b, plan, y - t, y + 0.01, material);
}

/** Bands h high round the plan at each height in `ys`, standing `proud` out from its walls: one box
 * along each edge, a little longer than the edge so that the corners close. */
export function bands(b, plan, ys, h, proud, material) {
  const turn = area(plan) > 0 ? 1 : -1;
  for (let i = 0; i < plan.length; i++) {
    const [x0, z0] = plan[i], [x1, z1] = plan[(i + 1) % plan.length];
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz);
    if (L < 0.3) continue;
    // the outward normal: to the right of the edge's direction when the plan's area is positive
    const nx = (dz / L) * turn, nz = (-dx / L) * turn;
    const mx = (x0 + x1) / 2 + nx * (proud / 2 - 0.05), mz = (z0 + z1) / 2 + nz * (proud / 2 - 0.05);
    for (const y of ys) {
      const g = new THREE.BoxGeometry(L + proud * 2, h, proud + 0.1);
      g.rotateY(-Math.atan2(dz, dx));
      g.translate(mx, y + h / 2, mz);
      b.add(g, material);
    }
  }
}

/** The outward normal [nx, nz] of the plan's edge from corner i to corner i + 1. */
export function outward(plan, i) {
  const turn = area(plan) > 0 ? 1 : -1;
  const [x0, z0] = plan[i], [x1, z1] = plan[(i + 1) % plan.length];
  const L = Math.hypot(x1 - x0, z1 - z0);
  return [((z1 - z0) / L) * turn, (-(x1 - x0) / L) * turn];
}

/** A box along the plan's edge i, from `a` to `b` of the way along it (0 to 1), standing out from the
 * wall between `o0` and `o1` metres (negative is into the wall), between heights y0 and y1. */
export function edgeBox(b, plan, i, a, bb, o0, o1, y0, y1, material) {
  const [x0, z0] = plan[i], [x1, z1] = plan[(i + 1) % plan.length];
  const [nx, nz] = outward(plan, i);
  const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz) * (bb - a);
  const mx = x0 + dx * (a + bb) / 2 + nx * (o0 + o1) / 2, mz = z0 + dz * (a + bb) / 2 + nz * (o0 + o1) / 2;
  const g = new THREE.BoxGeometry(L, y1 - y0, o1 - o0);
  g.rotateY(-Math.atan2(dz, dx));
  g.translate(mx, (y0 + y1) / 2, mz);
  b.add(g, material);
}

/** The part of the plan where `axis` (0 for x, 1 for z) is at least `value` (keep "above") or at most it
 * ("below"): the plan clipped by that half-plane, or null when nothing is left. */
export function clip(plan, axis, value, keep) {
  const inside = (p) => (keep === "above" ? p[axis] >= value : p[axis] <= value);
  const out = [];
  for (let i = 0; i < plan.length; i++) {
    const a = plan[i], c = plan[(i + 1) % plan.length], ia = inside(a), ic = inside(c);
    if (ia) out.push(a);
    if (ia !== ic) {
      const t = (value - a[axis]) / (c[axis] - a[axis]);
      out.push([a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t]);
    }
  }
  return out.length >= 3 ? out : null;
}

/** The plan raised from y0 to a top whose height at (x, z) is `top(x, z)`: a flat or sloping roof's slab
 * when `top` is a plane over the plan. */
export function slopedPrism(b, plan, y0, top, material) {
  if (!plan) return;
  const s = new THREE.Shape(plan.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, p.getY(i) > 0.5 ? top(x, z) : y0);
  }
  b.add(g, material);
}

/** A section in (z, y), [[z, y], ...] round its outline, drawn along x from x0 to x1. */
export function along(b, section, x0, x1, material) {
  const s = new THREE.Shape(section.map(([z, y]) => new THREE.Vector2(-z, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: x1 - x0, bevelEnabled: false });
  // the shape's x is -z and its extrusion +z; turning it a quarter about y takes the extrusion to +x
  g.rotateY(Math.PI / 2);
  g.translate(x0, 0, 0);
  b.add(g, material);
}

/** The plan raised from a bottom at height `bottom(x, z)` to a top at `top(x, z)`: a sloping slab when both
 * are planes over the plan. */
export function slab(b, plan, bottom, top, material) {
  if (!plan) return;
  const s = new THREE.Shape(plan.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, p.getY(i) > 0.5 ? top(x, z) : bottom(x, z));
  }
  b.add(g, material);
}

/** A rectangle [u0, u1] x [v0, v1] as a plan. */
export const rect = ([u0, u1], [v0, v1]) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];

/** Walls round the plan from y0 up to `top(x, z)` at each corner (straight between corners), with no
 * top or bottom: for a roof drawn separately whose eaves are not level. */
export function walls(b, plan, y0, top, material) {
  const pos = [];
  const turn = area(plan) > 0 ? 1 : -1;
  const foot = typeof y0 === "function" ? y0 : () => y0; // a level foot, or one that follows (x, z)
  for (let i = 0; i < plan.length; i++) {
    let [x0, z0] = plan[i], [x1, z1] = plan[(i + 1) % plan.length];
    if (turn < 0) [x0, z0, x1, z1] = [x1, z1, x0, z0];
    const t0 = top(x0, z0), t1 = top(x1, z1), f0 = foot(x0, z0), f1 = foot(x1, z1);
    pos.push(x0, f0, z0, x0, t0, z0, x1, f1, z1, x1, f1, z1, x0, t0, z0, x1, t1, z1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  b.add(g, material);
}

/** A roof of planes from each edge of the plan up to one apex [x, y, z] inside it, the eaves at
 * `top(x, z)` at each corner: a pyramid when they are level, a cone of facets round the apex when
 * `top` falls with the distance from it. `under` draws it facing down, as the roof's underside. */
export function fanRoof(b, plan, apex, top, material, under = false) {
  const pos = [];
  const turn = (area(plan) > 0 ? 1 : -1) * (under ? -1 : 1); // the underside faces down
  for (let i = 0; i < plan.length; i++) {
    let [x0, z0] = plan[i], [x1, z1] = plan[(i + 1) % plan.length];
    if (turn < 0) [x0, z0, x1, z1] = [x1, z1, x0, z0];
    pos.push(x0, top(x0, z0), z0, apex[0], apex[1], apex[2], x1, top(x1, z1), z1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  b.add(g, material);
}

/** An upright cylinder (or a prism of `n` sides) of radius r about (x, z), from y0 to y1. */
export function cylinder(b, x, z, r, y0, y1, material, n = 32) {
  const g = new THREE.CylinderGeometry(r, r, y1 - y0, n, 1, false);
  g.translate(x, (y0 + y1) / 2, z);
  b.add(g, material);
}

/** The part of the plan where a + kx x + kz z <= 0: the plan clipped by that half-plane, or null when
 * nothing is left. */
export function clipHalf(plan, a, kx, kz) {
  const f = ([x, z]) => a + kx * x + kz * z;
  const out = [];
  for (let i = 0; i < plan.length; i++) {
    const p = plan[i], q = plan[(i + 1) % plan.length], fp = f(p), fq = f(q);
    if (fp <= 0) out.push(p);
    if ((fp <= 0) !== (fq <= 0)) {
      const t = fp / (fp - fq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out.length >= 3 ? out : null;
}

/** A roof that is the lowest of the planes [a, kx, kz] (h = a + kx x + kz z) over the plan, as one facet a
 * plane (the plan clipped to where that plane is the lowest), each with its walls from y0 and a roof slab
 * `t` thick. */
export function lowestPlanes(b, plan, planes, y0, wall, roof, t) {
  planes.forEach(([a, kx, kz], i) => {
    let facet = plan;
    planes.forEach(([a2, kx2, kz2], j) => { if (j !== i && facet) facet = clipHalf(facet, a - a2, kx - kx2, kz - kz2); });
    if (!facet) return;
    const top = (x, z) => a + kx * x + kz * z;
    walls(b, facet, y0, top, wall);
    slab(b, facet, (x, z) => top(x, z) - t, top, roof);
  });
}

/** The height at (x, z) of the roof fanRoof draws over the plan (its facet there, a plane through two eave
 * corners and the apex), or of `top` where (x, z) lies in no facet. */
export function fanHeight(plan, apex, top, x, z) {
  for (let i = 0; i < plan.length; i++) {
    const [ax, az] = plan[i], [bx, bz] = plan[(i + 1) % plan.length], [cx, cz] = [apex[0], apex[2]];
    const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
    const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d;
    const l3 = 1 - l1 - l2;
    if (l1 >= -1e-6 && l2 >= -1e-6 && l3 >= -1e-6) return l1 * top(ax, az) + l2 * top(bx, bz) + l3 * apex[1];
  }
  return top(x, z);
}
