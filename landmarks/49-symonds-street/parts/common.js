// Shared sizes, measured in the LINZ 2024 LiDAR (data/49-symonds-street_pts.npy: the building returns, class 6, in the
// crop box) in the view frame of config/49-symonds-street.json: x is -axis (east-north-east), y up from the LiDAR's
// ground at the config's door (56.87 m NZVD2016, on the footpath before the podium's entrance), z is toStreet
// (south-south-east, Symonds Street); the frame's centre at x = z = 0. Owned by the lead: read, do not edit. Measured
// 2026-11-09 (round 0), before the door was set: every height below is measured above 56.79 m, the median ground in
// the crop box, and H moves it on to the door's ground.
//
// How: the returns' highest in 0.5 m cells and profiles across the roof, in the building's own frame: u along the axis
// (west-south-west, -x), w along toStreet (z). The tower's faces: each one's place the 2nd or 98th percentile of the
// parapet's returns (46.6 to 47.8 m) over its span, away from its corners. The low parts: their plans the outlines of
// the 0.5 m cells in a band of heights, inside the campus map's ring moved onto the LiDAR (the placement's offset and
// turn) by 1 m, closed and simplified to 0.6 m; their roofs the cells' p50.

/** A height measured above 56.79 m, as one above the door's ground, 0.08 m higher (the config's `ground`). */
const H = (h) => h - 0.08;

// The lowest the walls go: the ground within 3 m of the plans lies from -0.56 m (beside the podium) to +1.97 m (on
// Symonds Street before the tower); the map's ground (its 8 m elevation model) under the plans, about the door's,
// from -1.55 m (the north-east corner of the lowest building) to +5.33 m (under the tower).
export const FOOT = H(-1.8);

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
    top: H(47.06),
    deck: H(45.8),
    parapet: 0.3,
  },
  // On the roof a mansard: walls from the roof to its eaves at 49.3 m, and slopes up to a flat top at 51.94 m (the
  // returns' p50). Its eaves run round u -5.25 to 15.75, w -12.25 to 12.25 (where the profiles across it step up from
  // the roof), and step in at the tower's east and west corners as the tower does (its returns over 48.5 m in 0.5 m
  // cells): to u -2.25 from w 7.75 on toward the street, to u 10.75 from w -8.75 on toward the back. Its top over u
  // -2.65 to 12.99, w -8.95 to 9.57 (the top's returns' p1 and p99), stepped in by as much at the same corners (to u 0.5
  // from w 5.0 on, the top's returns at w 6 and 9.5 starting there; to u 8.0 from w -6.0 on). The two plans' corners in
  // turn, each slope between a side of the one and the same side of the other.
  mansard: {
    eaves: { plan: [[-5.25, -12.25], [10.75, -12.25], [10.75, -8.75], [15.75, -8.75], [15.75, 12.25], [-2.25, 12.25],
      [-2.25, 7.75], [-5.25, 7.75]], h: H(49.3) },
    top: { plan: [[-2.65, -8.95], [8.0, -8.95], [8.0, -6.0], [12.99, -6.0], [12.99, 9.57], [0.5, 9.57], [0.5, 5.0],
      [-2.65, 5.0]], h: H(51.94) },
  },
  // East of it the plant: u -11.6 to -5.7, w -7.44 to 7.59 (the returns from 48.8 to 51 m, p2 and p98), its top at 49.8
  // m (their p90).
  plant: { u: [-11.6, -5.7], w: [-7.44, 7.59], top: H(49.8) },
  // On the mansard's top three units, their plans the returns more than 0.35 m over it, their tops the highest; a mast
  // at u 6.0, w 3.1 (two returns, to 54.03 m) is left out.
  units: [{ u: [2.7, 3.5], w: [-2.3, -1.3], top: H(52.94) }, { u: [-1.2, -0.3], w: [-2.2, -1.1], top: H(52.74) },
    { u: [6.8, 7.3], w: [5.0, 5.8], top: H(52.63) }],
  // In the middle of each face a gable over the parapet, its apex the face's highest return (the west face's has few,
  // 7, and may be higher), its half-width 2.0 m (where the returns pass 47.6 m, 0.5 m over the parapet, 1.55 to 1.75 m out from
  // the apex); its depth is estimated. `face`: the side ("u" or "w") and its place; `at`: the apex along the face.
  gables: [
    { face: ["w", 17.29], at: 10.65, apex: H(49.79) },
    { face: ["w", -16.08], at: 2.87, apex: H(49.8) },
    { face: ["u", -15.13], at: 0.21, apex: H(49.69) },
    { face: ["u", 17.79], at: 1.6, apex: H(49.05) },
  ],
  gable: { half: 2.0, depth: 0.35 },
  // The faces (round 1; the photograph as a reference for the look, its heights estimated through its fitted camera
  // on the faces' planes): the tower's walls in glass between a base of dark stone to 11.0 m and a white band from
  // 45.2 m to the parapet's top (1.9 m on both steps' faces it shows); white where the LiDAR has returns from the
  // walls between 14 and 45 m (glass gives it few): the bays on the street and the back, all round, and the north-
  // east face from w -5.4 to its south-east end (from the photograph: glass at its north-west end). In the middle of
  // each white face, under its gable, a window arched at its top, 3.2 m wide (its edges 1.70 and -1.51 m from the
  // apex at 43 m, 2.31 and -0.48 at 14.3 m), from 12.0 m to its crown at 46.3 m; either side of it, in each of ten
  // storeys 3.35 m apart, a window 1.8 m high from 2.8 to 4.7 m out from the middle (the north-east face's two, 2.85
  // to 4.49 and 2.81 to 5.07 m out from its gable's apex, kept off the face's end), the highest's top at 44.82 m; on the bays' sides one 1.6 m wide in each storey, as on the
  // street bay's north-east side, which the photograph shows. The west face shows no returns either, and no
  // photograph: glass. The base, the podium and the lower buildings in a dark stone (the photograph).
  faces: {
    base: H(11.0), band: H(45.2),
    white: { edges: [1, 2, 3, 15, 16, 17], ene: [-5.4, 5.01] },
    arch: { half: 1.6, foot: H(12.0), crown: H(46.3) },
    windows: { top: H(44.82), storey: 3.35, height: 1.8, count: 10, from: 2.8, to: 4.7, side: 0.8 },
  },
  // The podium to the tower's east, its flat roof at 7.68 m, run 0.53 m into the tower's east face; on its front to
  // the street a gable over the entrance, u -24.1 to -20.7, its ridge from w 4.5 to 5.5 at 10.13 m.
  podium: {
    plan: [[-24.8, 6.0], [-22.8, 4.5], [-17.2, 5.5], [-14.6, 4.2], [-14.6, -5.2], [-16.2, -6.0], [-27.2, -6.0],
      [-28.5, -4.8], [-28.5, 0.8], [-27.5, 2.2], [-28.0, 4.8]],
    roof: H(7.68),
    entrance: { u: [-24.1, -20.7], w: [4.5, 5.5], apex: H(10.13) },
    // a canopy along its front at 3.06 m (its returns from 2.5 to 3.6 m: u -27.48 to -17.33, out to w 6.32), run back
    // into the podium; 0.3 m thick (estimated)
    canopy: { u: [-27.5, -17.3], w: [4.0, 6.32], top: H(3.06) },
  },
  // Behind the podium and north of it, lower buildings: one at 4.59 m along the tower's back to w -35, one at 5.42 m
  // and one at 3.04 m east of it.
  low: [
    { plan: [[-29.2, -0.5], [-28.0, -1.2], [-28.5, -4.8], [-27.2, -6.0], [-16.2, -6.0], [-15.5, -6.8], [-15.5, -10.8],
      [-16.2, -11.5], [-18.2, -11.0], [-20.0, -13.2], [-20.0, -25.8], [-22.2, -26.5], [-24.0, -29.2], [-22.5, -34.2],
      [-27.8, -35.5], [-29.0, -34.8], [-28.0, -12.2], [-30.0, -10.2], [-30.0, -1.2]], roof: H(4.59) },
    { plan: [[-37.2, -10.5], [-28.8, -11.0], [-28.0, -11.8], [-28.0, -20.2], [-29.2, -21.5], [-30.2, -20.5],
      [-38.8, -20.5], [-39.5, -19.8], [-39.5, -11.8]], roof: H(5.42) },
    { plan: [[-43.2, -6.0], [-31.2, -6.0], [-30.0, -7.2], [-30.8, -11.0], [-37.2, -10.5], [-39.5, -12.2],
      [-39.0, -14.8], [-40.2, -20.5], [-43.8, -20.5], [-44.5, -19.8], [-44.5, -11.8]], roof: H(3.04) },
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
