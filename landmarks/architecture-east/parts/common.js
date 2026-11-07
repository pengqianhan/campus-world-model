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
  // The lower wing (frame W): u -37 to -2.5, w -21 to -3.75; its roof at 22.3 m (the cells 22-23), a parapet at 23.3 m
  // round it (the cells along its edges), 0.3 m wide (estimated).
  low: { u: [-37, -2.5], w: [-21, -3.75], roof: 22.3, parapet: { top: 23.3, width: 0.3 } },
  // The west tower on it (frame W): u -31 to -17.5, w -15.75 to -9; its top a plane rising along u from 25 m at
  // u -31 to 33.6 m at its end (its ridge's returns p50 33.5, max 33.7 m, at u -18.6 to -17.5).
  wtower: { u: [-31, -17.5], w: [-15.75, -9.0], low: 25.0, high: 33.6 },
  // The main block (frame E): u -7 to 36, w -10.5 to 7.5; its eaves at 25 m (the cells at w 7.5 and -9), its ridge
  // at 30 m along w 0.75 (the cells 30 from u 0.5 to 32), its roof falling to the eaves on both sides.
  main: { u: [-7, 36], w: [-10.5, 7.5], eaves: 25.0, ridge: { w: 0.75, top: 30.0 } },
  // The tall tower (frame E): u 0 to 7.0, w -4.3 to 0; its top a plane rising along u to 36.7 m at its end (the high
  // edge's returns above 36.3 m at u 6.9, w -3.9 to -0.3; p50 36.6, max 36.8), from 30 m at u 0, the ridge.
  ttower: { u: [0, 7.0], w: [-4.3, 0], low: 30.0, high: 36.7 },
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
