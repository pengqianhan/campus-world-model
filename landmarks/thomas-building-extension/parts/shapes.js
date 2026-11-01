// Shapes the parts share: a plan [[x, z], ...] raised between two heights, its flat top, and bands
// along its edges (as 15 Eden Crescent's, landmarks/fifteen-eden-crescent/parts/shapes.js); and for this
// building, walls drawn edge by edge (so that each face takes its own material) and a roof that rises
// with the distance in from its edge.
import * as THREE from "three";

/** A geometry of triangles [a, b, c] (points [x, y, z]), each turned to face `up`, a direction [x, y, z],
 * or the triangle's own fourth element when it has one. */
function triangles(tris, up) {
  const pos = [];
  for (const [a, b, c, own] of tris) {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const want = own ?? up;
    const flip = n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0;
    pos.push(...a, ...(flip ? c : b), ...(flip ? b : c));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/** The walls along the plan's edges i0 to i1 (inclusive), from y0 to y1, facing out, in `material`. */
export function walls(b, plan, i0, i1, y0, y1, material) {
  const tris = [];
  for (let i = i0; i <= i1; i++) {
    const [x0, z0] = plan[i], [x1, z1] = plan[(i + 1) % plan.length];
    const [nx, nz] = outward(plan, i);
    const A = [x0, y0, z0], B = [x1, y0, z1], C = [x1, y1, z1], D = [x0, y1, z0];
    tris.push([A, B, C, [nx, 0, nz]], [A, C, D, [nx, 0, nz]]);
  }
  b.add(triangles(tris), material);
}

/** The distance from (x, z) to the nearest edge of the plan. */
export function edgeDistance(plan, x, z) {
  let d = Infinity;
  for (let i = 0; i < plan.length; i++) {
    const [x0, z0] = plan[i], [x1, z1] = plan[(i + 1) % plan.length];
    const dx = x1 - x0, dz = z1 - z0, L2 = dx * dx + dz * dz;
    const t = L2 > 0 ? Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / L2)) : 0;
    d = Math.min(d, Math.hypot(x - x0 - t * dx, z - z0 - t * dz));
  }
  return d;
}

/**
 * A roof over the plan round a rectangle [x0, x1] x [z0, z1] inside it (a raised middle, drawn apart),
 * its height at each point `height(d)`, d its distance in from the plan's edge: a ruled surface from each
 * corner of the plan to the nearest point of the rectangle, with the rectangle's own corners between, so
 * that hips run from the rectangle's corners. Each edge of the plan is cut into pieces `step` m long first.
 */
export function hipRoof(b, plan, rect, height, material, step = 1.5) {
  const [[rx0, rx1], [rz0, rz1]] = rect;
  // the plan's edges cut into short pieces
  const ring = [];
  for (let i = 0; i < plan.length; i++) {
    const [x0, z0] = plan[i], [x1, z1] = plan[(i + 1) % plan.length];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / step));
    for (let k = 0; k < n; k++) ring.push([x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n]);
  }
  // the rectangle's boundary as a parameter s (0 to 4) running the same way round as the plan
  const turn = area(plan) > 0 ? 1 : -1;
  const corners = turn > 0 ? [[rx1, rz0], [rx1, rz1], [rx0, rz1], [rx0, rz0]] : [[rx1, rz1], [rx1, rz0], [rx0, rz0], [rx0, rz1]];
  const at = (s) => {
    const k = Math.floor(((s % 4) + 4) % 4), f = (((s % 4) + 4) % 4) - k, [ax, az] = corners[k], [bx, bz] = corners[(k + 1) % 4];
    return [ax + (bx - ax) * f, az + (bz - az) * f];
  };
  const param = ([x, z]) => {
    // the nearest point of the rectangle's boundary, as s
    let best = Infinity, bs = 0;
    for (let k = 0; k < 4; k++) {
      const [ax, az] = corners[k], [bx, bz] = corners[(k + 1) % 4], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
      const d = Math.hypot(x - ax - t * dx, z - az - t * dz);
      if (d < best) { best = d; bs = k + t; }
    }
    return bs;
  };
  const y = (x, z) => height(edgeDistance(plan, x, z));
  const P = (x, z, h) => [x, h, z];
  const tris = [];
  const s = ring.map(param);
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    let s0 = s[i], s1 = s[j];
    // run forward round the rectangle, the short way
    while (s1 < s0 - 2) s1 += 4;
    while (s1 > s0 + 2) s1 -= 4;
    const [px0, pz0] = ring[i], [px1, pz1] = ring[j];
    const p0 = P(px0, pz0, y(px0, pz0)), p1 = P(px1, pz1, y(px1, pz1));
    // the rectangle's points from s0 to s1, its corners between
    const inner = [s0];
    const lo = Math.min(s0, s1), hi = Math.max(s0, s1);
    const ks = [];
    for (let k = Math.ceil(lo + 1e-9); k < hi - 1e-9; k++) ks.push(k);
    inner.push(...(s1 >= s0 ? ks : ks.reverse()), s1);
    const q = inner.map((t) => { const [x, z] = at(t); return P(x, z, y(x, z)); });
    // the piece: p0, p1 and the rectangle's points from s1 back to s0, fanned from p0 and p1
    tris.push([p0, p1, q[q.length - 1]]);
    for (let k = q.length - 1; k > 0; k--) tris.push([p0, q[k], q[k - 1]]);
  }
  b.add(triangles(tris, [0, 1, 0]), material);
}

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

/**
 * The plan's edges i0 to i1 as a path measured along its length s (metres from corner i0): `length`, and
 * `span(s0, s1)`, the pieces of edge [i, a, b] (edge i from a to b of the way along it) that lie between.
 */
export function path(plan, i0, i1) {
  const lens = [];
  for (let i = i0; i <= i1; i++) { const [x0, z0] = plan[i], [x1, z1] = plan[(i + 1) % plan.length]; lens.push(Math.hypot(x1 - x0, z1 - z0)); }
  const length = lens.reduce((a, b) => a + b, 0);
  function span(s0, s1) {
    const out = [];
    let at = 0;
    for (let k = 0; k < lens.length; k++) {
      const a = Math.max(s0, at), b = Math.min(s1, at + lens[k]);
      if (b > a + 1e-6) out.push([i0 + k, (a - at) / lens[k], (b - at) / lens[k]]);
      at += lens[k];
    }
    return out;
  }
  return { length, span };
}

/** A box along the path from s0 to s1, standing out from the wall between o0 and o1, from y0 to y1. */
export function pathBox(b, plan, p, s0, s1, o0, o1, y0, y1, material) {
  for (const [i, a, c] of p.span(s0, s1)) edgeBox(b, plan, i, a, c, o0, o1, y0, y1, material);
}
