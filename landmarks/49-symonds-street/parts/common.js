// Shared sizes, measured in the LINZ 2024 LiDAR (data/49-symonds-street_pts.npy: the building returns, class 6, in the
// crop box) in the view frame of config/49-symonds-street.json: x is -axis (east-north-east), y up from 56.79 m
// NZVD2016 (the median ground in the crop box; to be the LiDAR's ground at the config's door, step 7), z is toStreet
// (south-south-east, Symonds Street); the frame's centre at x = z = 0. Owned by the lead: read, do not edit. Measured
// 2026-11-09 (round 0).
//
// How: the returns' highest in 0.5 m cells and profiles across the roof, in the building's own frame: u along the axis
// (west-south-west, -x), w along toStreet (z). The tower's faces: each one's place the 2nd or 98th percentile of the
// parapet's returns (46.6 to 47.8 m) over its span, away from its corners. The low parts: their plans the outlines of
// the 0.5 m cells in a band of heights, inside the campus map's ring moved onto the LiDAR (the placement's offset and
// turn) by 1 m, closed and simplified to 0.6 m; their roofs the cells' p50.

// The lowest the walls go: the ground within 3 m of the plans lies from -0.56 m (beside the podium) to +1.97 m (on
// Symonds Street before the tower).
export const FOOT = -1.0;

export const MEASURED = {
  // The tower: a square of about 33 m with its corners stepped. On the street (+w) a bay 2.8 m out of the face, on the
  // back (-w) one 2.2 m out; the east corner (-u, +w) in two steps of about 9.5 m, the north corner (-u, -w) in three
  // smaller ones, the west corner (+u, -w) in one. Its parapet's top at 47.06 m (the returns' p50), its roof inside the
  // parapet at 45.80 m; the parapet's width is estimated.
  tower: {
    plan: [[17.79, 14.49], [15.66, 14.49], [15.66, 17.29], [5.75, 17.29], [5.75, 14.49], [-4.07, 14.49], [-4.07, 9.89],
      [-13.58, 9.89], [-13.58, 5.01], [-15.13, 5.01], [-15.13, -7.34], [-11.68, -7.34], [-11.68, -9.89], [-6.89, -9.89],
      [-6.89, -13.54], [-2.11, -13.54], [-2.11, -16.08], [7.81, -16.08], [7.81, -13.93], [12.81, -13.93],
      [12.81, -10.32], [17.79, -10.32]],
    top: 47.06,
    deck: 45.8,
    parapet: 0.3,
  },
  // On the roof a mansard: walls from the roof to its eaves at 49.3 m round u -5.25 to 15.75, w -12.25 to 12.25 (where
  // the profiles across it step up from the roof), and slopes up to a flat top at 51.94 m (the returns' p50) over u
  // -2.65 to 12.99, w -8.95 to 9.57 (their p1 and p99).
  mansard: { eaves: { u: [-5.25, 15.75], w: [-12.25, 12.25], h: 49.3 }, top: { u: [-2.65, 12.99], w: [-8.95, 9.57], h: 51.94 } },
  // East of it the plant: u -11.6 to -5.7, w -7.44 to 7.59 (the returns from 48.8 to 51 m, p2 and p98), its top at 49.8
  // m (their p90).
  plant: { u: [-11.6, -5.7], w: [-7.44, 7.59], top: 49.8 },
  // In the middle of each face a gable over the parapet, its apex the face's highest return (the west face's has few,
  // 7, and may be higher), its half-width 1.9 m (where the returns pass 47.6 m, 0.5 m over the parapet, 1.55 m out from
  // the apex); its depth is estimated. `face`: the side ("u" or "w") and its place; `at`: the apex along the face.
  gables: [
    { face: ["w", 17.29], at: 10.65, apex: 49.79 },
    { face: ["w", -16.08], at: 2.87, apex: 49.8 },
    { face: ["u", -15.13], at: 0.21, apex: 49.69 },
    { face: ["u", 17.79], at: 1.6, apex: 49.05 },
  ],
  gable: { half: 1.9, depth: 0.35 },
  // The podium to the tower's east, its flat roof at 7.68 m, run 0.53 m into the tower's east face; on its front to
  // the street a gable over the entrance, u -24.1 to -20.7, its ridge from w 4.5 to 5.5 at 10.13 m.
  podium: {
    plan: [[-24.8, 6.0], [-22.8, 4.5], [-17.2, 5.5], [-14.6, 4.2], [-14.6, -5.2], [-16.2, -6.0], [-27.2, -6.0],
      [-28.5, -4.8], [-28.5, 0.8], [-27.5, 2.2], [-28.0, 4.8]],
    roof: 7.68,
    entrance: { u: [-24.1, -20.7], w: [4.5, 5.5], apex: 10.13 },
  },
  // Behind the podium and north of it, lower buildings: one at 4.59 m along the tower's back to w -35, one at 5.42 m
  // and one at 3.04 m east of it.
  low: [
    { plan: [[-29.2, -0.5], [-28.0, -1.2], [-28.5, -4.8], [-27.2, -6.0], [-16.2, -6.0], [-15.5, -6.8], [-15.5, -10.8],
      [-16.2, -11.5], [-18.2, -11.0], [-20.0, -13.2], [-20.0, -25.8], [-22.2, -26.5], [-24.0, -29.2], [-22.5, -34.2],
      [-27.8, -35.5], [-29.0, -34.8], [-28.0, -12.2], [-30.0, -10.2], [-30.0, -1.2]], roof: 4.59 },
    { plan: [[-37.2, -10.5], [-28.8, -11.0], [-28.0, -11.8], [-28.0, -20.2], [-29.2, -21.5], [-30.2, -20.5],
      [-38.8, -20.5], [-39.5, -19.8], [-39.5, -11.8]], roof: 5.42 },
    { plan: [[-43.2, -6.0], [-31.2, -6.0], [-30.0, -7.2], [-30.8, -11.0], [-37.2, -10.5], [-39.5, -12.2],
      [-39.0, -14.8], [-40.2, -20.5], [-43.8, -20.5], [-44.5, -19.8], [-44.5, -11.8]], roof: 3.04 },
  ],
};

/** The point [x, z] of the view frame at u and w in the building's frame. */
export function at(u, w) {
  return [-u, w];
}

/** The rectangle from u0 to u1 and w0 to w1, as a plan [[x, z] x 4]. */
export function rect([u0, u1], [w0, w1]) {
  return [at(u0, w0), at(u1, w0), at(u1, w1), at(u0, w1)];
}

/** A plan from [u, w] corners. */
export function plan(corners) {
  return corners.map(([u, w]) => at(u, w));
}

/** The [u, w] corners of a polygon whose sides are all longer than 2d, moved `d` inward along every side (each corner
 * where its two sides' moved lines meet). */
export function inset(corners, d) {
  const n = corners.length;
  let area = 0;
  for (let i = 0; i < n; i++) { const [a, b] = corners[i], [c, e] = corners[(i + 1) % n]; area += a * e - c * b; }
  const s = area > 0 ? 1 : -1;
  const line = (i) => {
    const [a, b] = corners[i], [c, e] = corners[(i + 1) % n], L = Math.hypot(c - a, e - b);
    return [[a + (d * -s * (e - b)) / L, b + (d * s * (c - a)) / L], [(c - a) / L, (e - b) / L]];
  };
  const out = [];
  for (let i = 0; i < n; i++) {
    const [[p0, p1], [d0, d1]] = line((i + n - 1) % n), [[q0, q1], [e0, e1]] = line(i);
    const t = ((q0 - p0) * e1 - (q1 - p1) * e0) / (d0 * e1 - d1 * e0);
    out.push([p0 + t * d0, p1 + t * d1]);
  }
  return out;
}
