// Shared sizes, measured in the LINZ 2024 LiDAR (data/fine-arts-studio-block-431_pts.npy: the returns in the crop box)
// in the view frame of config/fine-arts-studio-block-431.json: x is -axis (east-north-east), y up from the door's
// ground, z is toStreet (south-south-east); the frame's centre at x = z = 0, the middle of the building's points near
// the campus map's ring.
// Owned by the lead: read, do not edit.
// Measured 2026-11-11 (round 0, and the review's round 1): every height below is an elevation (NZVD2016) and Y moves
// it on to the door's ground.
//
// The sizes are given in the building's own frame. u runs along the frame's axis toward the west-south-west (x = -u);
// the long faces lie 2.0 degrees off it, so across them the frame uses w', the distance from the line through w 0 at
// u 23.1 that runs with the faces (w = w' + K (23.1 - u), and z = w). `at` and `plan` turn (u, w') into the view
// frame, `atW` and `planW` (u, w), as the LiDAR's returns give it. A side at the least u faces east-north-east, at the
// greatest u west-south-west, at the least w' north-north-west and at the greatest w' south-south-east, to the lane.
//
// Fine Arts Studio Block 431: a long block of three storeys under a roof of two pitches, the north one rising to a
// step over the middle and the south one falling to the eave over the lane; a lower annex on its north side, a low box
// with roller doors before the south face, and at its east end a roof falling to the south, a glass stair tower and a
// lower roof.
/** The long faces' slant against the frame's axis: w grows by K a metre toward the east-north-east (the LiDAR's south
 * eave runs from w 9.0 at u 23.1 to 10.4 at -17.0, its north eave from -7.84 at u 22 to -6.22 at -20). */
export const K = 0.0355;
export const across = (u, wp) => wp + K * (23.1 - u);
export const at = (u, wp) => [-u, across(u, wp)];
export const plan = (corners) => corners.map(([u, wp]) => at(u, wp));
export const atW = (u, w) => [-u, w];
export const planW = (corners) => corners.map(([u, w]) => atW(u, w));
/** The door's ground (the config's `ground`): an elevation, as a height over it. */
export const GROUND = 33.09;
export const Y = (z) => z - GROUND;

// The ground round the building: the lane and its car park on the south at 33.1 m (33.06 to 33.21), the annex's
// north side at 33.15, the garden north of the main block at 38.0; the walls go down to FOOT.
export const FOOT = Y(31.5);

/** The roof's edge, the LiDAR's returns to p0.5 and p99.5 across the faces (w' -7.9 to 9.0) and along them (the west
 * end at u 23.15, the east end at -17.0, and -21.2 for the north part north of w' -4). The long walls stand where the
 * LiDAR's returns on them peak, about 1.05 m in under the eave: the south one at w' 7.95 (188 of its 428 returns at
 * 7.9 to 8.0, the ground seen under the eave out from 7.95), the north one at -6.85 (its returns peak at -6.88 in every
 * 3 m along it); the end walls 0.35 m in (their returns at u -16.75 to -16.25). */
export const EAVE = { west: 23.15, east: -17.0, eastNorth: -21.2, north: -7.9, south: 9.0, part: -4 };
export const WALL = { south: 7.95, north: -6.85, in: 0.35 };
/** The roof's two pitches, each a plane over w' (the LiDAR's returns, p50 in 0.5 m strips across the faces from u -15
 * to 21): the north one from 49.9 m at its eave to 51.33 at the step over w' 0, the south one from 48.3 at the step to
 * 46.6 at its eave (w' 9.0); and at the east end over w' -4 to 5 one roof falling to the south, from 50.4 m at w' -4 to
 * 49.6 at 0 and 48.8 at 5 (the LiDAR's p50 over u -21.0 to -17.6): north of w' 0 from u -21.2 to the north pitch at
 * -17.0, south of it from -20.2 (its returns' east edge south of the stair tower; the ground seen east of that) to
 * -16.35, where its returns stop over the south pitch's; each slab 0.3 m thick (estimated). */
export const ROOF = {
  north: (wp) => 51.33 + 0.181 * wp,
  south: (wp) => 48.3 - 0.1889 * wp,
  east: (wp) => 49.69 - 0.178 * wp,
  eastSouth: 5.0,
  eastU: { north: [-21.2, -17.0], south: [-20.2, -16.35] },
  t: 0.3,
};

/** The east end, from the LiDAR's returns: the glass stair tower (its glass as the photograph of the east entrance
 * shows it) at 51.45 m (p50 of its returns over 51 m, at u -23.25 to -19.64 and w 0.36 to 3.12); north of it a lower
 * roof at 50.2 m (50.0 to 50.8; p50 50.18), u -24.3 to -20.85 (to the east end's walls) and w -3.5 to 0.35; and the
 * entrance's glass canopy east
 * of that at 36.25 m (16 returns at u -26.0 to -24.65, w -1.5 to 0.9), out of the campus map's ring. */
export const EAST = {
  stair: { plan: [[-23.25, 0.35], [-19.65, 0.35], [-19.65, 3.1], [-23.25, 3.1]], top: 51.45 },
  low: { plan: [[-24.3, -3.5], [-20.85, -3.5], [-20.85, 0.35], [-24.3, 0.35]], top: 50.2 },
  canopy: { plan: [[-26.0, -1.5], [-24.28, -1.5], [-24.28, 0.9], [-26.0, 0.9]], y: [36.1, 36.25] },
};

/** The annex on the north side: its roof at 42.76 m (p50 of 737 returns, 42.6 to 42.86), its north edge the LiDAR's
 * (to p0.5: one line from w -11.8 at u 3.05 to -14.6 at -12.5, past the campus map's ring by up to 2.5 m), from u 3.05
 * to -13.1, the ring's east side; east of that the roof at 41.4 to 43.3 m is building 432's (inside its ring). */
export const ANNEX = {
  plan: [[3.05, -5.8], [3.05, -11.8], [-13.1, -14.73], [-13.1, -5.2]],
  top: 42.76,
};

/** The low box with roller doors before the south face: its roof at 36.3 m (69 returns, 35.9 to 36.6) over u 11.3 to
 * 19.3 and out to w 11.4 (the returns to p0.5 and p99.5; the ground in every 0.5 m east of 11.3). */
export const BOX = { u: [11.3, 19.3], w: 11.4, top: 36.3 };

/** The south face where the photograph sees it, every place and height estimated through its fitted camera (rms 0.40
 * px): the columns' middles (u 19.17 to -12.19, 4.1 to 4.9 m apart), 0.6 m wide, from 38.0 m to under the eave, three
 * lights a bay; the upper windows from 45.16 to 46.35 m (under the eave's slab), the middle ones from 40.07 to 43.97,
 * the ground storey's high windows from 36.85 to 38.14 east of the big roller door; the big roller door on the face
 * from u 20.2 to its west end (its west edge out of the photograph) up to 37.1 m; on the box, a roller door on its
 * front (u 12.5 to 16.0) and one on its west end (w 9.75 to 10.5), both up to 35.3 m. */
export const FACE = {
  columns: [19.17, 14.31, 9.44, 5.05, 0.53, -3.77, -8.07, -12.19],
  column: 0.6,
  ends: [-16.4, 22.6],
  rows: [[45.16, 46.35], [40.07, 43.97], [36.85, 38.14]],
  bigDoor: { u: [20.2, 22.75], top: 37.1 },
  boxFront: [12.5, 16.0],
  boxEnd: [9.75, 10.5],
  boxDoorTop: 35.3,
};
