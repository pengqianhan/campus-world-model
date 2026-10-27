// Shapes the parts share: roofs made of triangles, walls with windows, and a wall facing any of the four
// ways.
import * as THREE from "three";
import { boxesGeometry } from "../../kit/gothic.js";

/** Triangles [[x, y, z] x 3, ...] as one geometry in `material`. */
export function tris(b, list, material) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(list.flat(2), 3));
  g.computeVertexNormals();
  b.add(g, material);
}

/** A roof over [x0, x1] x [z0, z1], ridge along x at `ridge` on z = rz, eaves at `eave`; each end hipped
 * by `hip` metres (0: a gable end, its triangle closed in `end` material, or left open with null). */
export function roofX(b, x0, x1, z0, z1, eave, ridge, rz, hip, material, end = null) {
  const r0 = [x0 + hip, ridge, rz], r1 = [x1 - hip, ridge, rz];
  const a0 = [x0, eave, z0], a1 = [x1, eave, z0], c0 = [x0, eave, z1], c1 = [x1, eave, z1];
  const list = [[a0, r0, r1], [a0, r1, a1], [c0, c1, r1], [c0, r1, r0]];
  const ends = [[a0, c0, r0], [a1, r1, c1]];
  tris(b, hip > 0 ? [...list, ...ends] : list, material);
  if (hip === 0 && end) tris(b, ends, end);
}

/** The same with the ridge along z (a roof over a block that runs toward the lawn). */
export function roofZ(b, x0, x1, z0, z1, eave, ridge, rx, hip, material, end = null) {
  const r0 = [rx, ridge, z0 + hip], r1 = [rx, ridge, z1 - hip];
  const a0 = [x0, eave, z0], a1 = [x0, eave, z1], c0 = [x1, eave, z0], c1 = [x1, eave, z1];
  const list = [[a0, a1, r1], [a0, r1, r0], [c0, r0, r1], [c0, r1, c1]];
  const ends = [[a0, r0, c0], [a1, c1, r1]];
  tris(b, hip > 0 ? [...list, ...ends] : list, material);
  if (hip === 0 && end) tris(b, ends, end);
}

/** The outline of an opening w wide and h tall from its sill, centred on x = 0: square-headed (rise 0) or
 * with a segmental head that rises `rise` m from its springing to its crown. */
export function segOutline(w, h, rise = 0, n = 10) {
  const V = (x, y) => new THREE.Vector2(x, y);
  if (rise <= 0) return [V(-w / 2, 0), V(w / 2, 0), V(w / 2, h), V(-w / 2, h)];
  const s = h - rise, R = (w * w / 4 + rise * rise) / (2 * rise), cy = h - R, a = Math.asin(w / 2 / R);
  const pts = [V(-w / 2, 0), V(w / 2, 0), V(w / 2, s)];
  for (let i = 1; i < n; i++) { const t = a - (2 * a * i) / n; pts.push(V(R * Math.sin(t), cy + R * Math.cos(t))); }
  pts.push(V(-w / 2, s));
  return pts;
}

/** A wall facing +z: polygon `poly` (metres from its lower left corner at x0, y0), `t` thick back from
 * z = front, with each window's opening (`segOutline`) cut through it and the window drawn in it. */
export function wall(b, poly, x0, y0, front, t, wins, material = "ashlar") {
  const s = new THREE.Shape(poly.map(([px, py]) => new THREE.Vector2(px, py)));
  for (const w of wins) s.holes.push(new THREE.Path(segOutline(w.w, w.h, w.rise ?? 0).map((p) => new THREE.Vector2(p.x + w.x - x0, p.y + w.y - y0))));
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 10 });
  g.translate(x0, y0, front - t);
  b.add(g, material);
  for (const w of wins) window_(b, w, front);
}

/** A window set back `reveal` in its opening: dark glass, a white painted frame round it, a mullion when it
 * has two lights, a transom at the head's springing (or `transom` m under a square head), and white
 * glazing bars across each light every `bars` m; a stone sill. */
function window_(b, w, front) {
  const { x, y, w: W, h, rise = 0, lights = 1, reveal = 0.18, frame = 0.07, transom = 0.45, bars = 0.5 } = w;
  const zf = front - reveal, zg = zf - 0.03, list = [];
  const g = new THREE.ShapeGeometry(new THREE.Shape(segOutline(W - 0.02, h - 0.01, rise)), 8);
  g.translate(x, y, zg);
  b.add(g, "glass");
  // (the opening's sides are the wall's own extrusion, so the reveal needs no lining)
  // the frame: two jambs, the sill rail, the transom (and, square-headed, the head rail)
  const spring = rise > 0 ? h - rise : h - transom, top = rise > 0 ? h - rise : h;
  list.push([x - W / 2, x - W / 2 + frame, y, y + top, zf - 0.06, zf], [x + W / 2 - frame, x + W / 2, y, y + top, zf - 0.06, zf]);
  list.push([x - W / 2, x + W / 2, y, y + frame, zf - 0.06, zf], [x - W / 2, x + W / 2, y + spring - frame / 2, y + spring + frame / 2, zf - 0.06, zf]);
  if (rise <= 0) list.push([x - W / 2, x + W / 2, y + h - frame, y + h, zf - 0.06, zf]);
  if (lights > 1) list.push([x - frame / 2, x + frame / 2, y, y + (rise > 0 ? h - 0.02 : h), zf - 0.06, zf]);
  // glazing bars in the lights below the transom: thin, white
  const n = Math.max(0, Math.round((spring - frame) / bars) - 1);
  for (let k = 1; k <= n; k++) { const yy = y + frame + ((spring - frame * 1.5) * k) / (n + 1); list.push([x - W / 2, x + W / 2, yy - 0.015, yy + 0.015, zg, zg + 0.02]); }
  b.add(boxesGeometry(list), "paint");
  // the sill, of the wall's stone
  b.box(x - W / 2 - 0.1, x + W / 2 + 0.1, y - 0.12, y, front - 0.05, front + 0.08, "dressed");
}

/** A beam of section w x h from point p to point q (each [x, y, z]), its width horizontal. */
export function beam(b, p, q, w, h, material) {
  const P = new THREE.Vector3(...p), Q = new THREE.Vector3(...q);
  const g = new THREE.BoxGeometry(w, h, P.distanceTo(Q));
  const m = new THREE.Matrix4().lookAt(Q, P, new THREE.Vector3(0, 1, 0));
  m.setPosition(P.clone().add(Q).multiplyScalar(0.5));
  g.applyMatrix4(m);
  b.add(g, material);
}

/** Turns the builder so that its +z faces `way` ("+z", "-z", "+x", "-x") about the point (px, pz), for
 * the kit's helpers that draw a wall facing +z; `fn` draws in that turned frame, and the turn is undone. */
export function facing(b, way, px, pz, fn) {
  const turn = { "+z": 0, "+x": Math.PI / 2, "-z": Math.PI, "-x": -Math.PI / 2 }[way];
  const m = new THREE.Matrix4().makeTranslation(px, 0, pz).multiply(new THREE.Matrix4().makeRotationY(turn));
  const before = b.matrix;
  b.matrix = before ? before.clone().multiply(m) : m;
  try { fn(); } finally { b.matrix = before; }
}
