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
 * along each edge, a little longer than the edge so that the corners close; none on the edges in `skip`. */
export function bands(b, plan, ys, h, proud, material, skip = []) {
  const turn = area(plan) > 0 ? 1 : -1;
  for (let i = 0; i < plan.length; i++) {
    if (skip.includes(i)) continue;
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

/** The plan with its edges `edges` (consecutive indices) moved `d` metres inward: each moved edge's
 * corners are where its line meets the next edge's line, moved or not. */
export function inset(plan, edges, d) {
  const n = plan.length, moved = new Set(edges);
  const line = (i) => {  // a point on edge i's line, moved inward if it is one of `edges`, and its direction
    const [x0, z0] = plan[i], [x1, z1] = plan[(i + 1) % n], [nx, nz] = outward(plan, i), s = moved.has(i) ? -d : 0;
    return [x0 + nx * s, z0 + nz * s, x1 - x0, z1 - z0];
  };
  const meet = (i, j) => {  // where the lines of edges i and j meet
    const [ax, az, adx, adz] = line(i), [bx, bz, bdx, bdz] = line(j);
    const den = adx * bdz - adz * bdx, t = ((bx - ax) * bdz - (bz - az) * bdx) / den;
    return [ax + adx * t, az + adz * t];
  };
  return plan.map((p, k) => (moved.has(k) || moved.has((k - 1 + n) % n) ? meet((k - 1 + n) % n, k) : p));
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
