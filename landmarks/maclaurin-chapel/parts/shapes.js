// Shapes the parts share: a hexagon about the y axis (the chapel's plan) and a low gable.
import * as THREE from "three";

export const COS30 = Math.cos(Math.PI / 6);

/** A hexagonal prism or pyramid about the y axis, corners at 30 + 60k deg from +x toward +z (a corner
 * toward +z), from apothem `bottom` at y0 to apothem `top` at y1 (0: a point). */
export function hex(b, bottom, top, y0, y1, material, cx = 0, cz = 0) {
  const g = new THREE.CylinderGeometry(top / COS30, bottom / COS30, y1 - y0, 6, 1);
  g.translate(cx, (y0 + y1) / 2, cz);
  b.add(g, material);
}

/** The corners of the hexagon of apothem `a`, in order, as [x, z]. */
export function hexCorners(a) {
  const R = a / COS30;
  return [0, 1, 2, 3, 4, 5].map((k) => {
    const t = ((30 + 60 * k) * Math.PI) / 180;
    return [R * Math.cos(t), R * Math.sin(t)];
  });
}

/** A beam of section w x h from point p to point q (each [x, y, z]), its width horizontal. */
export function beam(b, p, q, w, h, material) {
  const P = new THREE.Vector3(...p), Q = new THREE.Vector3(...q);
  const len = P.distanceTo(Q);
  const g = new THREE.BoxGeometry(w, h, len);
  const m = new THREE.Matrix4().lookAt(Q, P, new THREE.Vector3(0, 1, 0));
  m.setPosition(P.clone().add(Q).multiplyScalar(0.5));
  g.applyMatrix4(m);
  b.add(g, material);
}

/** A gable roof along x over [x0, x1] x [z0, z1]: eaves at `eave` on z0 and z1, ridge at `ridge` on z = rz. */
export function gable(b, x0, x1, z0, z1, eave, ridge, rz, material) {
  const P = (x, y, z) => [x, y, z];
  const a0 = P(x0, eave, z0), a1 = P(x1, eave, z0), r0 = P(x0, ridge, rz), r1 = P(x1, ridge, rz), c0 = P(x0, eave, z1), c1 = P(x1, eave, z1);
  const tris = [a0, r0, r1, a0, r1, a1, c0, c1, r1, c0, r1, r0, a0, c0, r0, a1, r1, c1];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(tris.flat(), 3));
  b.add(g, material);
}
