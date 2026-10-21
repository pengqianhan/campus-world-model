// Shared sizes, measured in the LINZ 2024 LiDAR (data/old-government-house_pts.npy, in the view frame of
// config/old-government-house.json), and the roof helper. Owned by the lead: read, do not edit.
// View frame: x to the right as seen from the lawn on the north-east, y up from the ground at the
// porch (37.5 m NZVD2016), z toward the lawn; the centre of the main roof's high points at x = z = 0.
import * as THREE from "three";

export const MEASURED = {
  main: { x: [-24, 23], z: [-10, 5], eave: 10.5, ridge: 12.5 },       // the two-storey block
  front: { x: [-18, 15], z: [5, 8] },                                    // its middle stands forward to the lawn
  back: { x: [-12, 21], z: [-25.5, -10], eave: 8.4, ridge: 10.0 },    // the lower ranges behind, round a courtyard
  backLeft: { x: [-18, -12], z: [-15.5, -10], top: 7.5 },
  bay: { x: [-30.5, -24], z: [-9.4, 2.7], top: 4.0, balustrade: 4.6 }, // single storey at the south-east end, a balcony on top
  porch: { x: [-6, 0], z: [8, 12], top: 4.4 },                           // at the middle of the garden front
  chimneys: [                                                            // [x, z, top]
    [14.75, 3.2, 14.2], [-15.55, 2.75, 14.1], [-0.85, -0.75, 13.9],
  ],
};

/** A hipped roof over the rectangle x0..x1, z0..z1: eaves at `eave`, the ridge at `ridge`, along the longer side. */
export function hipRoof(b, x0, x1, z0, z1, eave, ridge, material = "roof") {
  const alongX = x1 - x0 >= z1 - z0;
  const half = (alongX ? z1 - z0 : x1 - x0) / 2;
  const p = [];
  const tri = (a, c, d) => p.push(...a, ...c, ...d);
  if (alongX) {
    const zm = (z0 + z1) / 2, r0 = [x0 + half, ridge, zm], r1 = [x1 - half, ridge, zm];
    const a = [x0, eave, z1], c = [x1, eave, z1], d = [x1, eave, z0], e = [x0, eave, z0];
    tri(a, c, r1); tri(a, r1, r0);  // toward +z
    tri(d, e, r0); tri(d, r0, r1);  // toward -z
    tri(e, a, r0);                  // end at x0
    tri(c, d, r1);                  // end at x1
  } else {
    const xm = (x0 + x1) / 2, r0 = [xm, ridge, z0 + half], r1 = [xm, ridge, z1 - half];
    const a = [x0, eave, z0], c = [x0, eave, z1], d = [x1, eave, z1], e = [x1, eave, z0];
    tri(a, c, r1); tri(a, r1, r0);  // toward -x
    tri(d, e, r0); tri(d, r0, r1);  // toward +x
    tri(e, a, r0);                  // end at z0
    tri(c, d, r1);                  // end at z1
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  g.computeVertexNormals();
  b.add(g, material);
}
