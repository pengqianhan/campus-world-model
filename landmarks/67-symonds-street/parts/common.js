// Shared sizes, measured in the LINZ 2024 LiDAR (data/67-symonds-street_pts.npy: the returns in the crop box) in the
// view frame of config/67-symonds-street.json: x is -axis (east), y up from the door's ground, z is toStreet (south);
// the frame's centre at x = z = 0, the middle of the building's points near the campus map's ring.
// Owned by the lead: read, do not edit.
// Measured 2026-11-11 (round 0): every height below is measured above 55.66 m, the median ground in the outline's
// band, and H moves it on to the door's ground (63.49 m, on the walkway before the entrance's porch).
//
// The sizes are given in the building's own frame, u along the tower's south face toward the west (the frame's axis,
// so x = -u) and w toward the south (z = w); `at` and `plan` turn them into the view frame. A side at the least u faces
// east, at the greatest u west, at the least w north and at the greatest w south.
//
// 67 Symonds Street, building 619: a tower of about eight storeys over the street on its south, on a podium that runs
// down the slope to its north and west, its roof at about 73 m; plant and a core over the tower's roof.
export const at = (u, w) => [-u, w];
/** A height measured above 55.66 m, as one above the door's ground, 63.49 m (the config's `ground`), 7.83 m higher. */
export const H = (h) => h - 7.83;
export const plan = (corners) => corners.map(([u, w]) => at(u, w));

// The ground round the building lies from -15.8 (the gully on the west and north, about 39.9 m) to 7.8 (63.5 m on its
// south side; the street before it rises to 66.5 m); the walls go down to FOOT.
export const FOOT = H(-16.7);

/** The podium: the campus map's ring (in the frame), its roof at 16.94 (the LiDAR's 72.5 to 73.8 m over it, 72.6 the
 * most), with the tower standing on it; but for the ring's triangle south of the tower's south-east part (the porch,
 * below), which the LiDAR sees the ground under, the ring's south side drawn 0.1 m inside the tower's south face, which
 * goes down to the ground; and its east side 0.1 m inside the tower's east face, where the ring stands 0.15 to 0.21 m
 * out from it (the LiDAR's returns on that face run on from 56 to 90 m with no step at the podium's roof). */
export const PODIUM = {
  plan: [[23.42, -22.81], [23.43, -18.51], [23.02, -18.6], [22.74, 1.81], [11.14, 1.71], [10.53, 1.12], [5.26, 6.26],
    [5.2, 19.55], [-19.8, 19.55],
    [-19.8, -5.5], [-15.65, -5.51], [-15.23, -8.52], [-13.3, -11.27], [-11.32, -12.42], [-6.64, -13.24],
    [-4.47, -14.1], [-2.11, -15.86], [0.8, -19.33], [2.77, -20.68], [6.14, -21.87], [11.14, -22.0], [11.11, -22.9],
    [14.51, -22.88]],
  top: H(16.94),
};

/** The porch over the entrance, in the ring's triangle south of the tower: the LiDAR's roof at 71.0 to 72.3 m (p50
 * 71.9) over the ground it sees through it, drawn as a glass roof from 71.66 to 72.26 m on the tower's face. Its plan
 * is the ring's triangle (estimated: the LiDAR's roof at that height runs on into the walkway's canopy outside the
 * ring, with no edge between them); the glass pyramid the photograph shows on it, its top about 74.8 m through the
 * photograph's camera, is not drawn. */
export const PORCH = {
  plan: [[-7.7, 19.65], [-11.9, 23.8], [-14.47, 21.06], [-17.97, 21.05], [-19.31, 19.65]].reverse(),
  y: [H(16.0), H(16.6)],
};

/** The tower: its parapet's outer edge (the LiDAR's roof returns to p99.5) at u -19.9 (east) to 5.5 (west) and w -5.65
 * (north) to 19.65 (south), its top at 35.69 (the LiDAR's 91.30 to 91.36 m along every edge); the roof inside it at
 * 34.64 (90.3 m); the parapet 0.4 m thick (estimated). */
export const TOWER = {
  u: [-19.9, 5.5],
  w: [-5.65, 19.65],
  parapet: H(35.69),
  roof: H(34.64),
  thick: 0.4,
};

/** Over the tower's roof, from the LiDAR's returns: a square block turned 45 degrees (its sides on u + w = 1.65 and
 * 15.74 and u - w = -18.79 and -6.2, p0.5 and p99.5 of its returns over 95 m) to 96.0 m (40.34; p50 95.53, p90
 * 96.05); east of it a bar (u -17.1 to -7.5, w 5.0 to 7.2, its returns over 94 m) to 95.2 m (39.54; p50 95.14); two
 * plant rooms at 92.8 m (37.14; p50 92.77), u -14.1 to -8.6, w -1.0 to 1.6, and u -14.2 to -8.9, w 3.2 to 5.0; plant
 * between the bar's end and the turned block's north-east side, to 0.02 m short of it (228 returns at 92.6 to 94.2 m,
 * p50 93.34, u -8.2 to -3.4, w 4.5 to 8.3) to 93.34 m (37.68); and a low plant room at 92.47 m (36.81; 45 returns,
 * p50 92.47), u -13.6 to -8.9, w 12.1 to 14.2. */
export const CORE = [
  { plan: [[-2.28, 3.93], [4.77, 10.97], [-1.53, 17.27], [-8.57, 10.22]], top: H(40.34) },
  { plan: [[-17.1, 5.0], [-7.5, 5.0], [-7.5, 7.2], [-17.1, 7.2]], top: H(39.54) },
  { plan: [[-14.1, -1.0], [-8.6, -1.0], [-8.6, 1.6], [-14.1, 1.6]], top: H(37.14) },
  { plan: [[-14.2, 3.2], [-8.9, 3.2], [-8.9, 5.0], [-14.2, 5.0]], top: H(37.14) },
  { plan: [[-7.5, 4.5], [-2.87, 4.5], [-6.67, 8.3], [-8.2, 8.3], [-8.2, 7.2], [-7.5, 7.2]], top: H(37.68) },
  { plan: [[-13.6, 12.1], [-8.9, 12.1], [-8.9, 14.2], [-13.6, 14.2]], top: H(36.81) },
];

/** The faces the photograph sees, every place and height estimated through its fitted camera (rms 2.25 px): storeys
 * 4.04 m apart, the top windows' heads at 34.48 (the camera puts them at 34.78, 0.14 m over the roof's deck at 34.64:
 * drawn 0.3 m lower, under it) and each window 2.46 m tall: on the south face the four rows the photograph sees over
 * the porch (`south.rows`), on the east face five, the fifth behind the tree's branches. On the south face (w 19.65)
 * three columns of windows (u -9.34 to -7.45, -12.14 to -10.29, -15.16 to -13.17), a curved
 * glazed bay (u -6.38 to -2.24) with dark bands from 31.08 to 33.96 a storey, and plain panels either side; on the
 * east face (u -19.9) a louvred panel (w 12.55 to 15.13) and three windows (w 9.30 to 11.81, 5.65 to 8.39, 1.89 to
 * 4.66) a storey, the rest behind a tree. */
export const FACES = {
  heads: [0, 1, 2, 3, 4].map((k) => H(34.48 - 4.04 * k)),
  window: 2.46,
  south: {
    w: 19.65,
    rows: 4,
    windows: [[-9.34, -7.45], [-12.14, -10.29], [-15.16, -13.17]],
    bay: [-6.38, -2.24],
    band: [H(31.08), H(33.96)],
  },
  east: { u: -19.9, louvre: [12.55, 15.13], windows: [[9.30, 11.81], [5.65, 8.39], [1.89, 4.66]] },
};
