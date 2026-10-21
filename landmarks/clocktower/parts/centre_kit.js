// Small Gothic pieces for the recessed centre (owned by the centre agent; candidates for gothic.js):
// four-centred (Tudor) arch outlines, arch bands, lofted corbelling, prow-shaped oriel faces,
// pyramid-capped pedestals, pendant bosses, shields and a lantern.
import * as THREE from "three";

const V2 = (x, y) => new THREE.Vector2(x, y);
export const shapeOf = (pts, dx = 0, dy = 0) => new THREE.Shape(pts.map((p) => V2(p.x + dx, p.y + dy)));
export const pathOf = (pts, dx = 0, dy = 0) => new THREE.Path(pts.map((p) => V2(p.x + dx, p.y + dy)));

/**
 * A four-centred (Tudor) arch opening w wide: straight jambs to hs, then a tight haunch arc of
 * radius r turning into straight flanks that meet in a blunt point d above the springing.
 */
export function tudor(w, hs, d, r = Math.min(0.55 * d, 0.3 * w)) {
  const a = w / 2;
  r = Math.min(r, 0.95 * d, 0.95 * a);
  let lo = 0, hi = Math.PI / 2; // solve (a - r) cos t + r = d sin t
  for (let i = 0; i < 40; i++) { const t = (lo + hi) / 2; if (d * Math.sin(t) - (a - r) * Math.cos(t) - r < 0) lo = t; else hi = t; }
  const th = (lo + hi) / 2, n = 7, right = [];
  for (let i = 0; i <= n; i++) { const t = (th * i) / n; right.push(V2(a - r + r * Math.cos(t), hs + r * Math.sin(t))); }
  const pts = [V2(-a, 0), V2(a, 0), ...right, V2(0, hs + d)];
  for (let i = right.length - 1; i >= 0; i--) pts.push(V2(-right[i].x, right[i].y));
  return pts;
}

/** The arch part of an outline (from outline() or tudor()): everything from the right springing round to the left. */
export const archOf = (pts) => pts.slice(2);

/** A moulded band between two arch outlines (outer over inner), with short label drops at its ends. */
export function archBand(outer, inner, drop = 0) {
  const o = archOf(outer), i = archOf(inner);
  const L = o[o.length - 1], Li = i[i.length - 1], R = o[0], Ri = i[0];
  const left = drop > 0 ? [V2(L.x, L.y - drop), V2(Li.x, Li.y - drop)] : [];
  const right = drop > 0 ? [V2(Ri.x, Ri.y - drop), V2(R.x, R.y - drop)] : [];
  return new THREE.Shape([...o, ...left, ...i.slice().reverse(), ...right]);
}

/** A ring: the outer outline with the inner one cut out. */
export function ring(outer, inner, dyInner = 0) {
  const s = shapeOf(outer); s.holes.push(pathOf(inner, 0, dyInner)); return s;
}

/**
 * A lofted solid through closed plan rings [{ y, pts: [[x, z], ...] }] (same point count each), with
 * a bottom and a top cap. Used for corbelling, cornices and caps that follow a polygonal plan.
 */
export function loft(levels) {
  const pos = [];
  const tri = (a, b, c) => pos.push(...a, ...b, ...c);
  for (let l = 0; l < levels.length - 1; l++) {
    const A = levels[l], B = levels[l + 1], n = A.pts.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const a0 = [A.pts[i][0], A.y, A.pts[i][1]], a1 = [A.pts[j][0], A.y, A.pts[j][1]];
      const b0 = [B.pts[i][0], B.y, B.pts[i][1]], b1 = [B.pts[j][0], B.y, B.pts[j][1]];
      tri(a0, a1, b1); tri(a0, b1, b0);
    }
  }
  for (const [L, up] of [[levels[0], false], [levels[levels.length - 1], true]]) {
    const p = L.pts, c = p.reduce((s, q) => [s[0] + q[0] / p.length, s[1] + q[1] / p.length], [0, 0]);
    for (let i = 0; i < p.length; i++) {
      const j = (i + 1) % p.length, a = [p[i][0], L.y, p[i][1]], b = [p[j][0], L.y, p[j][1]], m = [c[0], L.y, c[1]];
      if (up) tri(m, b, a); else tri(m, a, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/** A square pedestal with a moulded cornice and a low pyramid cap, standing on y0 to top (cap above). */
export function pedestal(b, x, z, w, y0, top, mat = "smooth") {
  b.box(x - w / 2, x + w / 2, y0, top - 0.22, z - w / 2, z + w / 2, mat);
  b.box(x - w / 2 - 0.05, x + w / 2 + 0.05, top - 0.3, top - 0.22, z - w / 2 - 0.05, z + w / 2 + 0.05, "dressed");
  b.box(x - w / 2 - 0.09, x + w / 2 + 0.09, top - 0.22, top - 0.1, z - w / 2 - 0.09, z + w / 2 + 0.09, "dressed");
  const cap = new THREE.ConeGeometry((w / 2 + 0.09) * Math.SQRT2, 0.32, 4, 1);
  cap.rotateY(Math.PI / 4); cap.translate(x, top - 0.1 + 0.16, z);
  b.add(cap, "dressed");
}

/** A carved boss or corbel head: a small block with a rounded knot, hanging below y. */
export function boss(b, x, y, z, s = 0.22, mat = "dressed") {
  b.box(x - s * 0.6, x + s * 0.6, y - s * 0.35, y, z - s * 0.6, z + s * 0.6, mat);
  const k = new THREE.IcosahedronGeometry(s * 0.55, 1); k.scale(1, 0.8, 0.8); k.translate(x, y - s * 0.55, z);
  b.add(k, mat);
}

/** A heater shield w wide and h tall, its top at y = h, point at y = 0, centred on x = 0. */
export function shield(w, h) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, h); s.lineTo(w / 2, h); s.lineTo(w / 2, h * 0.5);
  s.quadraticCurveTo(w / 2, h * 0.12, 0, 0); s.quadraticCurveTo(-w / 2, h * 0.12, -w / 2, h * 0.5); s.closePath();
  return s;
}

/** A wall lantern: bracket, iron cage and glass, hung on a wall facing +z at front. */
export function lantern(b, x, y, front) {
  b.box(x - 0.03, x + 0.03, y + 0.55, y + 0.62, front, front + 0.2, "iron");
  b.box(x - 0.11, x + 0.11, y, y + 0.55, front + 0.08, front + 0.28, "glass");
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.box(x + dx * 0.11 - 0.015, x + dx * 0.11 + 0.015, y - 0.04, y + 0.6, front + 0.18 + dz * 0.1 - 0.015, front + 0.18 + dz * 0.1 + 0.015, "iron");
  b.box(x - 0.14, x + 0.14, y + 0.55, y + 0.62, front + 0.05, front + 0.31, "iron");
  b.box(x - 0.08, x + 0.08, y - 0.08, y, front + 0.1, front + 0.26, "iron");
}

/**
 * Sets b.matrix so that local (u, y, w) — u along a vertical face from (ax, az) to (bx, bz), w out of
 * it (to the right of the direction of travel, seen from above with +z toward the viewer) — lands in the
 * world. Returns the face's length. Call b.matrix = null afterwards.
 */
export function faceFrame(b, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
  const phi = Math.atan2(-dz, dx);
  b.matrix = new THREE.Matrix4().makeRotationY(phi).premultiply(new THREE.Matrix4().makeTranslation(ax, 0, az));
  return L;
}

/** A carved corbel pendant hanging from y: an abacus, a bell narrowing down and a foliage knot (about 0.7 m). */
export function pendant(b, x, y, z, s = 0.36, mat = "dressed") {
  b.box(x - s * 0.6, x + s * 0.6, y - s * 0.22, y, z - s * 0.6, z + s * 0.6, mat);
  const bell = new THREE.CylinderGeometry(s * 0.5, s * 0.3, s * 0.6, 8, 1);
  bell.translate(x, y - s * 0.22 - s * 0.3, z); b.add(bell, mat);
  b.box(x - s * 0.42, x + s * 0.42, y - s * 0.95, y - s * 0.82, z - s * 0.42, z + s * 0.42, mat);
  const k = new THREE.IcosahedronGeometry(s * 0.42, 1); k.scale(1, 0.85, 1); k.translate(x, y - s * 1.25, z); b.add(k, mat);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1]]) {
    const l = new THREE.IcosahedronGeometry(s * 0.2, 0); l.translate(x + dx * s * 0.38, y - s * 1.05, z + dz * s * 0.38); b.add(l, mat);
  }
}
