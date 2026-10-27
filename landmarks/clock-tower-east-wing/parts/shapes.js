// Shapes the parts share: roofs made of triangles, and a wall facing any of the four ways.
import * as THREE from "three";

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
