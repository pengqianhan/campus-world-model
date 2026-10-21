// Everything but the south-west range, plainly, at the sizes of the LINZ 2024 LiDAR: the two gabled ranges
// behind the Grafton Road front (ridges along z), the north-east wing (two cross gables and two low links), the
// gabled block behind it, the two gabled blocks behind the middle range with their link, and the low blocks
// behind on the north-west. Plain walls in `render` and roofs in `roofPale`: no photograph shows these faces
// as they are since the works. The one exception is the block behind the range's north-west end, whose
// brick face the panorama e8T_ of 2022-09 shows (`brick`).
//
// Every roof plane, eave, ridge and wall line here was fitted to the class-6 points of
// data/old-choral-hall_pts.npy in the view frame (rms 0.02 to 0.05 m on the gabled roofs; see the numbers
// beside each block). The LiDAR was flown on 18 May 2024 during the works (README.md, "The sources: works in
// progress"): over the two ranges and the north-east wing its roofs are partly the scaffolds' temporary
// roofs and wraps. They are drawn as measured. Not drawn, because they are scaffolds: the 11.2 m deck in
// the Grafton Road front's recess (lifts at 5.2, 7.2, 9.2 and 11.2 m; the 2024-08 panorama m1hD shows a scaffold
// with a banner there), the lifts along the back (z -29.5 to -27.5) and the rail on the middle blocks'
// roof at x 2 to 3.
import * as THREE from "three";

const WALL = "render", ROOF = "roofPale", BASE = -2.0;   // walls go 2 m below the datum: the site's DEM is lower than the LiDAR ground under the north-east wing

/** Planes y = a + b x + c z of a gable with its ridge along z at x = r, R high, falling s1 to the -x side and s2 to the +x side. */
const ridgeZ = (r, R, s1, s2) => [{ a: R - s1 * r, b: s1, c: 0 }, { a: R + s2 * r, b: -s2, c: 0 }];
/** The same with the ridge along x at z = r. */
const ridgeX = (r, R, s1, s2) => [{ a: R - s1 * r, b: 0, c: s1 }, { a: R + s2 * r, b: 0, c: -s2 }];
const flat = (y) => [{ a: y, b: 0, c: 0 }];
const rect = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const plane = (p, x, z) => p.a + p.b * x + p.c * z;

// The middle range's west slope meets the south-west range's roof in a valley that is not parallel to that
// range: x = -13.3 + 0.17 z (from z -1 to 12.9). The footprint follows it 0.3 m further out, under the
// south-west range's roof, so that the two roofs meet without a gap.
const valley = (z) => -13.3 + 0.17 * z - 0.3;

const BLOCKS = [
  // the middle range: west slope y = 17.096 + 0.2547 x, east slope y = 15.295 - 0.2453 x (ridge x -3.60 at
  // 16.18 m), from the back band (z -8.45) to its gable end in the Grafton Road front's recess (z 12.95); its
  // west eave at x -14.15 (13.5 m) behind z -1.6, then the valley against the south-west range
  { poly: [[-14.15, -8.45], [1.98, -8.45], [1.98, 12.95], [valley(12.95), 12.95], [valley(-1.0), -1.0], [-14.15, -1.6]],
    planes: [{ a: 17.096, b: 0.2547, c: 0 }, { a: 15.295, b: -0.2453, c: 0 }] },
  // a flat band 14.7 m high across the middle range's back end
  { poly: rect(-14.5, 1.98, -10.5, -8.45), planes: flat(14.7) },
  // the right range, from the back (z -10.4, and -9.8 east of x 10.9) to the Grafton Road front (z 22.35): west slope y = 14.222 + 0.2958 x
  // (valley with the middle range at x 1.98, 14.81 m), east y = 17.322 - 0.0834 x (ridge x 8.18 at 16.64 m;
  // the nearly flat east side, 16.0 m at x 14.85, is the scaffold's deck); in front of the middle range's
  // gable end its west wall (the wrap's face in m1hD) stands at x 2.95 and its roof overhangs it to x 1.55
  { poly: [[1.98, -10.4], [10.9, -10.4], [10.9, -9.8], [14.85, -9.8], [14.85, 22.35], [2.95, 22.35], [2.95, 12.95], [1.98, 12.95]],
    planes: [{ a: 14.222, b: 0.2958, c: 0 }, { a: 17.322, b: -0.0834, c: 0 }] },
  { poly: rect(1.55, 2.95, 12.95, 22.35), planes: [{ a: 14.222, b: 0.2958, c: 0 }], eave: 0.25 },
  // the north-east wing: the cross gable on Grafton Road (ridge z 16.10 at 16.55 m; eaves 14.19 at z 5.75 and
  // 14.04 at z 22.35) and the middle one (ridge z -3.85 at 16.16 m; eaves 13.99 and 14.27), joined by a flat
  // link 11.3 m high
  { poly: rect(14.85, 24.3, 5.75, 22.35), planes: ridgeX(16.1, 16.55, 0.228, 0.401) },
  { poly: rect(14.85, 22.35, -10.25, 2.35), planes: ridgeX(-3.85, 16.16, 0.339, 0.305) },
  { poly: rect(14.85, 21.9, 2.35, 5.75), planes: flat(11.3) },
  // a lean-to on its east side, 14.3 m falling to 13.3 m
  { poly: rect(24.3, 25.9, 5.75, 10.5), planes: [{ a: 14.3 + 0.625 * 24.3, b: -0.625, c: 0 }] },
  // a flat link 11.6 m high between the middle cross gable and the block behind
  { poly: rect(15.5, 22.8, -13.6, -10.25), planes: flat(11.6) },
  // the block behind the north-east wing: ridge z -19.8 at 16.83 m, eaves 14.09 (z -30.45) and 14.44 (z -13.45);
  // its west end falls steeply from the roof at x 6.6 to 13.0 m at x 5.5 (the wrap: y = -4.05 + 3.1 x)
  { poly: rect(5.6, 24.35, -30.45, -13.45), planes: [...ridgeX(-19.8, 16.83, 0.257, 0.377), { a: -4.05, b: 3.1, c: 0 }] },
  // behind the middle range: two gabled blocks with the same ridge line (x -3.80, 13.24 and 13.27 m, both
  // slopes 28 deg), joined by a link whose roof falls from 11.2 m against the first to 9.3 m against the second
  { poly: rect(-10.9, 4.6, -17.5, -10.5), planes: ridgeZ(-3.8, 13.24, 0.541, 0.540) },
  { poly: rect(-10.9, 3.0, -20.9, -17.5), planes: [{ a: 20.986, b: 0, c: 0.556 }] },
  { poly: rect(-11.0, 3.2, -28.3, -20.9), planes: ridgeZ(-3.8, 13.27, 0.537, 0.540) },
  // single-storey roofs 6.6 m high between those blocks and the block behind the north-east wing
  { poly: rect(3.0, 5.6, -30.45, -10.4), planes: flat(6.6) },
  // behind the south-west range's north-west end: a narrow roof 9.25 m high against the middle range, the
  // cream link of e8T_ (a roof falling from 12 m against the range to 10.4 m: y = 7.721 - 0.2515 x + 0.0662 z),
  // single-storey roofs at 6.5 and 7.5 m beside it, and the brick block (its roof falling east from 12.0 m at
  // x -17 to 9.3 m at x -11: y = 4.221 - 0.4583 x + 0.0076 z, with a lower strip 9.4 m high on its west side)
  { poly: rect(-18.0, -14.15, -10.5, 0.0), planes: flat(9.25) },
  { poly: rect(-20.5, -14.5, -17.3, -10.5), planes: [{ a: 7.721, b: -0.2515, c: 0.0662 }] },
  { poly: rect(-14.5, -10.9, -17.3, -13.5), planes: flat(6.5) },
  { poly: rect(-14.5, -10.9, -13.5, -10.5), planes: flat(7.5) },
  { poly: rect(-17.4, -10.6, -27.6, -17.3), planes: [{ a: 4.221, b: -0.4583, c: 0.0076 }], wall: "brick" },
  { poly: rect(-18.7, -17.4, -27.6, -19.0), planes: flat(9.4), wall: "brick" },
];

/** Keeps the part of the polygon where a + b x + c z <= 0 (Sutherland-Hodgman). */
function clip(poly, a, b, c) {
  const out = [], f = ([x, z]) => a + b * x + c * z;
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
 * A block on the footprint `poly` ([x, z] corners in order), its roof the lowest of `planes` at each point
 * (two planes make a gable, one a flat or single-pitch roof), its walls from BASE up to the roof, so that
 * the walls under a ridge are gable ends. With `eave` (m) it is only an overhanging roof: a fascia that
 * deep on its edges and a soffit under it.
 */
function block(b, poly, planes, wallMat = WALL, eave = 0) {
  const h = (x, z) => Math.min(...planes.map((p) => plane(p, x, z)));
  let area = 0;
  for (let i = 0; i < poly.length; i++) { const [x0, z0] = poly[i], [x1, z1] = poly[(i + 1) % poly.length]; area += x0 * z1 - x1 * z0; }
  const walls = [], roof = [];
  // walls: each edge cut where the lowest plane changes along it
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const ts = [0, 1];
    for (let j = 0; j < planes.length; j++) for (let k = j + 1; k < planes.length; k++) {
      const d = (s) => plane(planes[j], s[0], s[1]) - plane(planes[k], s[0], s[1]);
      const dp = d(p), dq = d(q);
      if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) ts.push(dp / (dp - dq));
    }
    ts.sort((u, v) => u - v);
    const dx = q[0] - p[0], dz = q[1] - p[1];
    const out = area > 0 ? [dz, -dx] : [-dz, dx];   // the outward normal of this edge
    const flip = -dz * out[0] + dx * out[1] < 0;   // the quad's own winding faces (-dz, dx)
    for (let k = 0; k + 1 < ts.length; k++) {
      const s = [p[0] + ts[k] * dx, p[1] + ts[k] * dz], e = [p[0] + ts[k + 1] * dx, p[1] + ts[k + 1] * dz];
      const A = [s[0], eave ? h(...s) - eave : BASE, s[1]], B = [e[0], eave ? h(...e) - eave : BASE, e[1]], C = [e[0], h(...e), e[1]], D = [s[0], h(...s), s[1]];
      if (flip) walls.push(...A, ...C, ...B, ...A, ...D, ...C); else walls.push(...A, ...B, ...C, ...A, ...C, ...D);
    }
  }
  // roof: the part of the footprint where each plane is the lowest, triangulated, facing up
  for (let j = 0; j < planes.length; j++) {
    let part = poly;
    for (let k = 0; k < planes.length; k++) if (k !== j) {
      const P = planes[j], Q = planes[k];
      part = clip(part, P.a - Q.a, P.b - Q.b, P.c - Q.c);
    }
    if (part.length < 3) continue;
    const tris = THREE.ShapeUtils.triangulateShape(part.map(([x, z]) => new THREE.Vector2(x, z)), []);
    for (const t of tris) {
      const v = t.map((i) => [part[i][0], plane(planes[j], ...part[i]), part[i][1]]);
      // facing up: the cross product of the edges has y > 0
      const ny = (v[1][2] - v[0][2]) * (v[2][0] - v[0][0]) - (v[1][0] - v[0][0]) * (v[2][2] - v[0][2]);
      if (ny > 0) roof.push(...v[0], ...v[1], ...v[2]); else roof.push(...v[0], ...v[2], ...v[1]);
      // the soffit of an overhang: the same triangle lowered, facing down
      if (eave) { const w = v.map((q) => [q[0], q[1] - eave, q[2]]); if (ny > 0) walls.push(...w[0], ...w[2], ...w[1]); else walls.push(...w[0], ...w[1], ...w[2]); }
    }
  }
  const geo = (pos) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); return g; };
  b.add(geo(walls), wallMat);
  b.add(geo(roof), ROOF);
}

export function massing(b) {
  for (const k of BLOCKS) block(b, k.poly, k.planes, k.wall, k.eave);
}
