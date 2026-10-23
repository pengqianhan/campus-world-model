// The rest of building 104, as the campus map draws it: not measured, not seen. Every source shows this
// part during building works (README.md, "The sources: works in progress"), so until the works end it keeps
// the map's estimated block: block 104's own outline less the part the south-west range stands on, raised to
// the block's height on the map, flat-topped, with plain walls. Nothing here comes from the LiDAR or the
// photographs. A later round replaces this file.
//
// - The outline: the one the map extrudes for block 104 (src/shared/massing.ts: floor G's own outline in
//   public/data/campus.json, which floor 1 stacks on; not the building's `outline`, which differs by a notch
//   of about 2 m2 at the back), taken into the view frame as the site's Landmark.toModel does with
//   placement.json (centre 105.904, 88.723; rotationY 0.798867; scale 1.000086), to 0.01 m.
//   tests/landmarks.test.ts checks OUTLINE and TOP against campus.json and the terrain.
// - Less the range: the part of it on the range's side of the range's inner wall (x' <= SW.inner in the
//   range's frame, parts/common.js). The range and its corner pavilion stand wholly on that side, and the map's
//   outline runs 3.0 to 3.7 m beyond the range's face toward Symonds Street, so the whole side goes.
// - The height: the map draws block 104 as 2 storeys of 3.6 m (`height` 7.2, `heightSource` "floor-count";
//   src/shared/massing.ts) standing on its footing (src/scene/terrain.ts `footing`: the 8 m DEM at the
//   outline's middle, 38.60 m), so its top is 45.80 m. The model stands with y = 0 on the DEM at the door
//   (36.83 m), so the top is y 8.97 here, where the map's block top is.
// - The walls go down to FOOT, below the DEM everywhere under the outline (its lowest, 35.42 m, is y -1.41).
// - The finish: walls in `plain` (no texture, no shader, the map's wall colour for a teaching building by
//   day), the flat roof in `roofGrey` (the roofs' grey in the 2023 aerial). On the map the light form draws
//   them in the map's own colours.
import * as THREE from "three";
import { SW } from "./common.js";

const WALL = "plain", ROOF = "roofGrey", FOOT = -2.0;
/** The map's block 104 (see above): its footing above the door's DEM, and its height on the map. */
export const MAP_BLOCK = { base: 1.77, height: 7.2 };
export const TOP = MAP_BLOCK.base + MAP_BLOCK.height;

/** The outline the map extrudes for block 104, in the view frame ([x, z], metres). */
export const OUTLINE = [
  [5.87, -27.48], [7.21, -27.54], [7.22, -28.39], [23.27, -28.38], [23.38, -15.09], [7.25, -15.02], [7.6, -14.8],
  [7.57, -12.12], [8.42, -12.11], [8.42, -12.53], [11.53, -12.49], [11.56, -9.45], [8.45, -9.49], [8.46, -9.91],
  [7.68, -9.85], [7.64, -7.17], [7.29, -7.24], [7.36, -6.75], [21.71, -6.77], [21.66, 2.07], [13.32, 2.1],
  [13.36, 9.74], [23.54, 9.74], [23.57, 22.96], [4.69, 22.92], [4.59, 14.64], [1.98, 14.68], [2, 12.7],
  [-10.73, 12.67], [-10.68, 14.58], [-13.86, 14.61], [-13.83, 22.95], [-20.27, 22.93], [-34.8, -10.92], [-18.8, -17.56],
  [-19.08, -28.6], [-11.45, -28.35], [-11.43, -29.2], [-3.09, -29.23], [-3.1, -28.38], [2.06, -28.38], [2.05, -27.25],
  [5.86, -27.2],
];

/**
 * The outline less the range's side: the part where x' (the range's frame: x' = x cos a - z sin a) is at least
 * SW.inner (Sutherland-Hodgman against that one line). Each corner says whether it lies on the line.
 */
export function restOutline() {
  const a = (SW.angle * Math.PI) / 180, f = ([x, z]) => x * Math.cos(a) - z * Math.sin(a) - SW.inner;
  const out = [];
  for (let i = 0; i < OUTLINE.length; i++) {
    const p = OUTLINE[i], q = OUTLINE[(i + 1) % OUTLINE.length], fp = f(p), fq = f(q);
    if (fp >= 0) out.push({ at: p, cut: fp === 0 });
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
      const t = fp / (fp - fq);
      out.push({ at: [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])], cut: true });
    }
  }
  return out;
}

export function rest(b) {
  const ring = restOutline(), pts = ring.map((r) => r.at);
  let area = 0;
  for (let i = 0; i < pts.length; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % pts.length]; area += x0 * z1 - x1 * z0; }
  const walls = [], roof = [];
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length];
    if (p.cut && q.cut) continue;   // along the range's inner wall: no wall of its own
    const [px, pz] = p.at, [qx, qz] = q.at;
    const A = [px, FOOT, pz], B = [qx, FOOT, qz], C = [qx, TOP, qz], D = [px, TOP, pz];
    // the quad A B C D faces (dz, -dx) turned by the ring's winding: outward either way
    if (area > 0) walls.push(...A, ...C, ...B, ...A, ...D, ...C); else walls.push(...A, ...B, ...C, ...A, ...C, ...D);
  }
  for (const t of THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), [])) {
    const v = t.map((i) => [pts[i][0], TOP, pts[i][1]]);
    const ny = (v[1][2] - v[0][2]) * (v[2][0] - v[0][0]) - (v[1][0] - v[0][0]) * (v[2][2] - v[0][2]);
    if (ny > 0) roof.push(...v[0], ...v[1], ...v[2]); else roof.push(...v[0], ...v[2], ...v[1]);
  }
  const geo = (pos) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); return g; };
  b.add(geo(walls), WALL);
  b.add(geo(roof), ROOF);
}
