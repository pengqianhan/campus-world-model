// Shared sizes, measured in the LINZ 2024 LiDAR (data/science-centre-303s_pts.npy: the building returns, class 6, in
// the crop box) in the view frame of config/science-centre-303s.json: x is -axis (south-east), y up from the frame's
// ground (39.3 m NZVD2016, the median ground in the first crop box; to be the LiDAR's ground at the config's door at
// step 7), z is toStreet (south-west); the frame's centre at x = z = 0. Owned by the lead: read, do not edit.
// Measured 2026-11-07 (round 0).
//
// How: the returns inside the campus map's ring of 303S, per 2 m along the face: their back edge, their front and
// their heights' p90. The face to the street is turned 8.75 degrees from the frame, and the walls run square with it
// or along one diagonal back line, so the building has its own frame: u along that face from its north-west end
// toward the south-east, w out of it (the street side positive). In it: the face's north-west part, to u 12, at
// 30.4 m with a parapet along the face; a top storey from u 12 to 50, set back 1.45 m from the face, to 33.4 m (its
// top edge 33.75 m); the face's parapet at 30.4 m on to u 37.7; the south-east part, to u 59.6, at 29.0 m; at the
// back a lower part at 16 m in a notch, and at the north-west tip a part at 16.4 m.

// The lowest the walls go: the ground rises 4.4 m along the face to the south-east (the LiDAR's ground within 3 m
// outside the plan from -1.85 m at the north-west tip to +2.6 m at the south-east end).
export const FOOT = -4.5;

export const MEASURED = {
  // The face to the street (step 3): z = 8.445 + 0.1539 x in the view frame (the returns on it at 26-31 m, the
  // glass below has almost none), within 0.41 m (p90; it bows a little); u from its north-west end (s -31.7).
  frame: { corner: [-32.601, 3.428], e: [0.98836, 0.15211], n: [-0.15211, 0.98836] },
  // The face's line (its returns at 26-31 m, w p99 0.1-0.4).
  face: 0.2,
  // The back's diagonal line from the north-west end: w = -4.96 - 0.318 u (its returns' back edge above 25 m, u 2-30).
  back: { w0: -4.96, slope: -0.318 },
  // The north-west part, u 0 to 12.1: 30.4 m (the parapet's p50 30.37 along the face; the returns' p90 30.4).
  nw: { u: [0, 12.1], top: 30.4 },
  // The face's parapet on along the top storey's front, to u 37.7 (where the 30.4 m returns end), 30.4 m.
  front: { u: [12.0, 37.7], w: -1.45, top: 30.4 },
  // The top storey: u 12.1 to 50.0 (its returns s -18.66 to 18.25), its front at w -1.45 (p99), back to the
  // back line, then from u 31 to 41 back to w -22 / -23, from u 41 to 50 to w -16.8; its roof 33.4 m (p90).
  top: { u: [12.05, 50.0], w: -1.45, notch: { u: [31.0, 41.0], w: [-22.0, -23.0] }, se: -16.8, roof: 33.4 },
  // The south-east part: u 37.6 to 59.6 (its end face, s 27.9), back to w -18.3; its roof 28.8 m, parapet 29.5 m:
  // drawn at 29.0 in round 0.
  se: { u: [37.6, 59.6], w: -18.3, top: 29.0 },
  // Behind the diagonal, a lower part from u 29 to 31, back to w -22: its returns' p90 15.7-16.3 m.
  low: { u: [29.0, 31.05], w: -22.05, top: 16.0 },
  // The north-west tip of the ring, u -5.6 to 0: its returns' p90 16.4 m.
  tip: { plan: [[-4.4, 0.5], [0.0, 0.3], [0.0, -4.96], [-5.6, -3.0]], top: 16.4 },
};

/** The point [x, z] of the view frame at u along the face to the street and w out of it. */
export function at(u, w) {
  const F = MEASURED.frame;
  return [F.corner[0] + u * F.e[0] + w * F.n[0], F.corner[1] + u * F.e[1] + w * F.n[1]];
}

/** u and w of the point [x, z] of the view frame. */
export function uw(x, z) {
  const F = MEASURED.frame, dx = x - F.corner[0], dz = z - F.corner[1];
  return [dx * F.e[0] + dz * F.e[1], dx * F.n[0] + dz * F.n[1]];
}

/** The rectangle from u0 to u1 and w0 to w1 in the building's frame, as a plan [[x, z] x 4]. */
export function rect([u0, u1], [w0, w1]) {
  return [at(u0, w0), at(u1, w0), at(u1, w1), at(u0, w1)];
}

/** A plan from [u, w] corners. */
export function plan(corners) {
  return corners.map(([u, w]) => at(u, w));
}

/** The back's diagonal line at u. */
export function backAt(u) {
  return MEASURED.back.w0 + MEASURED.back.slope * u;
}
