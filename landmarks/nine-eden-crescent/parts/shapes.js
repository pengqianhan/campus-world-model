// Shapes the parts share: a wall with ribbon windows cut through it, and a wall facing any of the four
// ways. After the Clock Tower East Wing's (`../clock-tower-east-wing/parts/shapes.js`), with windows of
// this building's kind: dark aluminium frames and mullions, no sills.
import * as THREE from "three";
import { boxesGeometry } from "../../kit/gothic.js";

/** A wall facing +z: polygon `poly` (metres from its lower left corner at x0, y0), `t` thick back from
 * z = front, with each window's rectangular opening cut through it and the window drawn in it. */
export function wall(b, poly, x0, y0, front, t, wins, material = "paint") {
  const s = new THREE.Shape(poly.map(([px, py]) => new THREE.Vector2(px, py)));
  for (const w of wins) {
    const a = w.x - w.w / 2 - x0, c = w.y - y0;
    s.holes.push(new THREE.Path([new THREE.Vector2(a, c), new THREE.Vector2(a + w.w, c), new THREE.Vector2(a + w.w, c + w.h), new THREE.Vector2(a, c + w.h)]));
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false });
  g.translate(x0, y0, front - t);
  b.add(g, material);
  for (const w of wins) {
    if (w.open) b.box(w.x - w.w / 2, w.x + w.w / 2, w.y, w.y + w.h, front - t - 1.2, front - t, "void");
    else ribbon(b, w, front);
  }
}

/** Triangles [[x, y, z] x 3, ...] as one geometry in `material`. */
export function tris(b, list, material) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(list.flat(2), 3));
  g.computeVertexNormals();
  b.add(g, material);
}

/** A ribbon of glazing set back `reveal` in its opening: the kit's pale glass, a dark aluminium frame round it and a
 * mullion every `bay` metres; a transom `transom` m above its foot; and, with `posts` ([x0, x1] pairs), a
 * door's frame at each: its two jambs, a little heavier than a mullion, and its head at the transom. */
function ribbon(b, w, front) {
  const { x, y, w: W, h, reveal = 0.15, frame = 0.06, bay = 1.3 } = w;
  const zf = front - reveal, zg = zf - 0.02, list = [];
  b.box(x - W / 2, x + W / 2, y, y + h, zg - 0.01, zg, "glassPale");
  list.push([x - W / 2, x - W / 2 + frame, y, y + h, zf - 0.05, zf], [x + W / 2 - frame, x + W / 2, y, y + h, zf - 0.05, zf]);
  list.push([x - W / 2, x + W / 2, y, y + frame, zf - 0.05, zf], [x - W / 2, x + W / 2, y + h - frame, y + h, zf - 0.05, zf]);
  const n = Math.max(1, Math.round(W / bay));
  for (let k = 1; k < n; k++) { const xx = x - W / 2 + (W * k) / n; list.push([xx - 0.03, xx + 0.03, y, y + h, zf - 0.05, zf]); }
  if (w.transom) list.push([x - W / 2, x + W / 2, y + w.transom - 0.03, y + w.transom + 0.03, zf - 0.05, zf]);
  for (const [p0, p1] of w.posts ?? []) {
    for (const xx of [p0, p1]) list.push([xx - 0.05, xx + 0.05, y, y + h, zf - 0.07, zf]);
    if (w.transom) list.push([p0, p1, y + w.transom - 0.05, y + w.transom + 0.05, zf - 0.07, zf]);
  }
  b.add(boxesGeometry(list), "iron");
}

/** Turns the builder so that its +z faces `way` ("+z", "-z", "+x", "-x") about the point (px, pz), for
 * the helpers that draw a wall facing +z; `fn` draws in that turned frame, and the turn is undone. */
export function facing(b, way, px, pz, fn) {
  const turn = { "+z": 0, "+x": Math.PI / 2, "-z": Math.PI, "-x": -Math.PI / 2 }[way];
  const m = new THREE.Matrix4().makeTranslation(px, 0, pz).multiply(new THREE.Matrix4().makeRotationY(turn));
  const before = b.matrix;
  b.matrix = before ? before.clone().multiply(m) : m;
  try { fn(); } finally { b.matrix = before; }
}
