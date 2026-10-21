// Shapes the parts share: a hipped roof of planes of different pitch, and a bowed band.
import * as THREE from "three";

/** Clips the convex polygon `poly` ([[x, z], ...]) to where f(x, z) <= 0, f linear (Sutherland-Hodgman). */
function clip(poly, f) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], fp = f(p), fq = f(q);
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
      const t = fp / (fp - fq);
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  }
  return out;
}

/**
 * A hipped roof over the rectangle [x0, x1] x [z0, z1], its edges all at `eave`, each of its four planes
 * rising `slope` m a metre in from its own edge ({ left: from x0, right: from x1, east: from z0, west:
 * from z1 }): the roof is everywhere the lowest of the four planes, so its hips and ridge are where two
 * meet. Each plane is a convex polygon, drawn as a fan, facing up.
 */
export function hipRoof(b, [x0, x1], [z0, z1], eave, slope, material) {
  const planes = [
    ([x]) => eave + slope.left * (x - x0),
    ([x]) => eave + slope.right * (x1 - x),
    ([, z]) => eave + slope.east * (z - z0),
    ([, z]) => eave + slope.west * (z1 - z),
  ];
  const rect = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const pos = [];
  planes.forEach((h, i) => {
    let poly = rect;
    planes.forEach((g, j) => { if (j !== i && poly.length) poly = clip(poly, (p) => h(p) - g(p)); });
    for (let k = 1; k + 1 < poly.length; k++) {
      const tri = [poly[0], poly[k], poly[k + 1]].map((p) => [p[0], h(p), p[1]]);
      // facing up: (b - a) x (c - a) has a positive y
      const [a, c1, c2] = tri, ux = c1[0] - a[0], uz = c1[2] - a[2], vx = c2[0] - a[0], vz = c2[2] - a[2];
      if (uz * vx - ux * vz < 0) tri.reverse();
      pos.push(...tri.flat());
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  b.add(g, material);
}

/** The points of a bowed front: from (x0, zEnd) through (mid, zMid) to (x1, zEnd), on a circular arc, n segments. */
export function bowPoints(x0, x1, zEnd, zMid, n = 16) {
  const half = (x1 - x0) / 2, cx = (x0 + x1) / 2, s = zMid - zEnd;
  const R = (half * half + s * s) / (2 * s), cz = zMid - R, a = Math.asin(half / R);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = -a + (2 * a * i) / n;
    pts.push([cx + R * Math.sin(t), cz + R * Math.cos(t)]);
  }
  return pts;
}

/** A vertical band along a polyline of [x, z] points, from y0 to y1, `t` thick (inward toward -z). */
export function band(b, pts, y0, y1, t, material) {
  const pos = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), nx = -dz / L, nz = dx / L; // outward: left of a->b
    const g = new THREE.BoxGeometry(L, y1 - y0, t);
    g.rotateY(-Math.atan2(dz, dx));
    g.translate((ax + bx) / 2 - (nx * t) / 2, (y0 + y1) / 2, (az + bz) / 2 - (nz * t) / 2);
    pos.push(g);
  }
  for (const g of pos) b.add(g, material);
}
