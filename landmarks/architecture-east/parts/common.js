// Shared sizes, measured in the LINZ 2024 LiDAR (data/architecture-east_pts.npy: the building returns, class 6, in
// the crop box) in the view frame of config/architecture-east.json: x is -axis, y up from the frame's ground (31.6 m
// NZVD2016, the median ground in the crop box; to be the LiDAR's ground at the config's door at step 7), z is
// toStreet; the frame's centre at x = z = 0. Owned by the lead: read, do not edit.
// Measured 2026-11-07 (round 0).
//
// How: the returns' p90 in 1.5 m cells, in two frames of the building's own. Its walls run in two directions 45
// degrees apart (the campus map's ring: its edges at -4.4 and 40.0 degrees from x toward z, length-weighted): the
// lower wing, with the west tower on it, square with the first; the main block, its gabled roof and the tall tower,
// square with the second. In each, u runs along the walls' first direction and w across it.

// The lowest the walls go: the ground within 3 m of the plans falls to -1.16 m at the main block's south-east side
// (and rises to +8.5 m on the raised terrace to its north-west).
export const FOOT = -1.5;

export const MEASURED = {
  frames: {
    // the lower wing and the west tower
    W: { deg: -4.4 },
    // the main block and the tall tower
    E: { deg: 40.0 },
  },
  // The lower wing (frame W): from u -37 to the main block, w -21 to -4.5, its south-east corner cut on a line at 45
  // degrees, square with the main block, from u -6 at w -21 to u 1 at w -14 (the 1 m cells); its roof at 22.65 m (its
  // returns' p50 22.63-22.67), a parapet at 23.5 m round it (the returns along its edges, p90 23.3-23.65), 0.3 m wide
  // (estimated).
  low: { plan: [[-37, -21], [-6, -21], [1, -14], [1, -4.5], [-37, -4.5]], roof: 22.65, parapet: { top: 23.5, width: 0.3 } },
  // The west tower on it (frame W): u -31 to -18, w -14.5 to -10.5; its top a plane rising along u from 25 m at
  // u -31 to 33.6 m at its end (its ridge's returns p50 33.5, max 33.7 m); on its south-east side, from u -28.5 to
  // -19, a lower slope falling across w from 28 m at the tower to 25 m at w -19.5 (the cells 28 to 25).
  wtower: { u: [-31, -18], w: [-14.5, -10.5], low: 25.0, high: 33.6, flank: { u: [-28.5, -19], w: -19.5, top: 28.0, foot: 25.0 } },
  // The main block (frame E): u -7 to 37.5 (the ring's end; the building runs on past it, beyond 421E's ring), w
  // -10.5 to 4.5. Its walls to a flat roof at 25.74 m (its returns' p50 from w -10 to -7) and on it a hipped roof over
  // w -6.2 to 3: its ridge at 30.1 m along w 0 from u 0 to 31 (the returns' p50 30.09 at w 0 to 1, 30.3 at w 0 to
  // 0.5 from u 10 to 30), its slopes falling to the flat roof at w -6.2 (the returns' p50 29.61, 27.95 and 26.3 at w
  // -1.5, -3.5 and -5.5) and to its north-west eave at 28 m at w 3 (28.7 and 28.2 at w 2 to 2.5 and 2.5 to 3), a face
  // under that eave down to the flat roof, which runs on as a ledge to w 4.5 (returns at 25-26 m); its hips to u -7
  // and 37.5 (the cells 25 to 29 and 30 to 26). Between w 3 and 5.5 the storeys' edges step out below (returns at
  // 12-28 m), not drawn yet. From u -7 to 9 a part at 25.1 m runs on to w 7 (its returns' p50 25.08 at w 6 to 7.5);
  // from u 9 the terrace's ground (8 m) comes up to the face (the LiDAR's ground returns from w 4.5). On the flat roof
  // a box at 27 m, u 25 to 30, w -10 to -4.5 (the cells 27).
  main: { u: [-7, 37.5], w: [-10.5, 4.5], roof: 25.74, hip: { w: [-6.2, 3.0], eave: 28.0, ridge: { w: 0, u: [0, 31], top: 30.1 } },
          nw: { u: [-7, 9], w: [4.5, 7], top: 25.1 },
          box: { u: [25, 30], w: [-10, -4.5], top: 27.0 } },
  // The tall tower (frame E): u 1 to 7.0, w -3.6 to 0.4; its top a plane rising along u from 32.8 m at u 1 (the cells
  // 33) to 36.7 m at its end (the high edge's returns above 36.3 m at u 6.9; p50 36.6, max 36.8).
  ttower: { u: [1, 7.0], w: [-3.6, 0.4], low: 32.8, high: 36.7 },
};

/** The point [x, z] of the view frame at u and w in the building's frame `F` ("W" or "E"). */
export function at(F, u, w) {
  const t = (MEASURED.frames[F].deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  return [u * c - w * s, u * s + w * c];
}

/** The rectangle from u0 to u1 and w0 to w1 in frame `F`, as a plan [[x, z] x 4]. */
export function rect(F, [u0, u1], [w0, w1]) {
  return [at(F, u0, w0), at(F, u1, w0), at(F, u1, w1), at(F, u0, w1)];
}

/** A plan from [u, w] corners in frame `F`. */
export function plan(F, corners) {
  return corners.map(([u, w]) => at(F, u, w));
}

/** The [u, w] corners of a polygon moved `d` inward along every side (each corner where its two sides' moved lines
 * meet), for a polygon whose sides are all longer than twice `d`. */
export function inset(corners, d) {
  const n = corners.length;
  let area = 0;
  for (let i = 0; i < n; i++) { const [a, b] = corners[i], [c, e] = corners[(i + 1) % n]; area += a * e - c * b; }
  const s = area > 0 ? 1 : -1;
  const line = (i) => {
    const [a, b] = corners[i], [c, e] = corners[(i + 1) % n], L = Math.hypot(c - a, e - b);
    const nu = (-s * (e - b)) / L, nw = (s * (c - a)) / L;
    return [[a + d * nu, b + d * nw], [(c - a) / L, (e - b) / L]];
  };
  const out = [];
  for (let i = 0; i < n; i++) {
    const [p, t] = line((i + n - 1) % n), [q, r] = line(i);
    const den = t[0] * r[1] - t[1] * r[0];
    const k = ((q[0] - p[0]) * r[1] - (q[1] - p[1]) * r[0]) / den;
    out.push([p[0] + k * t[0], p[1] + k * t[1]]);
  }
  return out;
}
