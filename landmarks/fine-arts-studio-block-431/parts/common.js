// Shared sizes, measured in the LINZ 2024 LiDAR (data/fine-arts-studio-block-431_pts.npy: the returns in the crop box)
// in the view frame of config/fine-arts-studio-block-431.json: x is -axis (east-north-east), y up from the door's
// ground, z is toStreet (south-south-east); the frame's centre at x = z = 0, the middle of the building's points near
// the campus map's ring.
// Owned by the lead: read, do not edit.
// Measured 2026-11-11 (round 0): every height below is an elevation (NZVD2016) and Y moves it on to the door's ground.
//
// The sizes are given in the building's own frame. u runs along the frame's axis toward the west-south-west (x = -u);
// the long faces lie 2.0 degrees off it, so across them the frame uses w', the distance from the line through w 0 at
// u 23.1 that runs with the faces (w = w' + K (23.1 - u), and z = w). `at` and `plan` turn (u, w') into the view
// frame, `atW` and `planW` (u, w), as the LiDAR's returns give it. A side at the least u faces east-north-east, at the
// greatest u west-south-west, at the least w' north-north-west and at the greatest w' south-south-east, to the lane.
//
// Fine Arts Studio Block 431: a long block of three storeys under a roof of two pitches, the north one rising to a
// step over the middle and the south one falling to the eave over the lane; a lower annex on its north side, a low box
// with roller doors before the south face, and at its east end a glass stair tower and two lower roofs.
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
 * end at u 23.15; the south half's east end at -17.0, the north half's at -21.2); the walls 0.35 m in under it
 * (estimated: the fascia's depth over the wall, as the photograph shows it). */
export const EAVE = { west: 23.15, east: { south: -17.0, north: -21.2 }, north: -7.9, south: 9.0 };
export const IN = 0.35;
/** The roof's two pitches, each a plane over w' (the LiDAR's returns, p50 in 0.5 m strips across the faces from u -15
 * to 21): the north one from 49.9 m at its eave (w' -7.9) to 51.33 at the step over w' 0, the south one from 48.3 at
 * the step to 46.6 at its eave (w' 9.0); the slab 0.3 m thick (estimated). */
export const ROOF = {
  north: (wp) => 51.33 + 0.181 * wp,
  south: (wp) => 48.3 - 0.1889 * wp,
  t: 0.3,
};

/** The east end, from the LiDAR's returns on a 1 m grid: a flat block at 49.2 m (48.8 to 49.9) east of the south half,
 * u -21.2 to -17.0, w' 0 to 5.0; the glass stair tower at 51.65 m (51.4 to 51.7), u -24.4 to -20.0 and w -0.5 to 3.5;
 * north of it a lower roof at 50.35 m (50.0 to 50.8), u -25.0 to -21.2 and w -3.5 to -0.5; and the entrance's glass
 * canopy east of the stair tower at 36.25 m (18 returns, u -26.0 to -24.65, w -1.5 to 0.9), out of the campus map's
 * ring. */
export const EAST = {
  block: { u: [-21.2, -17.0], wp: [0, 5.0], top: 49.2 },
  stair: { plan: [[-24.4, -0.5], [-20.0, -0.5], [-20.0, 3.5], [-24.4, 3.5]], top: 51.65 },
  low: { plan: [[-25.0, -3.5], [-21.2, -3.5], [-21.2, -0.5], [-25.0, -0.5]], top: 50.35 },
  canopy: { plan: [[-26.0, -1.5], [-24.38, -1.5], [-24.38, 0.9], [-26.0, 0.9]], y: [36.1, 36.25] },
};

/** The annex on the north side, inside the campus map's ring (u -13.1 to 3.05; the LiDAR's roof runs on east of the
 * ring at the same height, not drawn): its roof at 42.76 m (p50 of 737 returns, 42.6 to 42.86), its north edge from
 * w -11.8 at u 3.05 to -13.4 at u -6 and east of it (the returns to p0.5). */
export const ANNEX = {
  plan: [[3.05, -6.5], [3.05, -11.8], [0, -12.3], [-4.0, -13.1], [-6.0, -13.4], [-13.1, -13.4], [-13.1, -5.9]],
  top: 42.76,
};

/** The low box with roller doors before the south face: its roof at 36.3 m (36.07 to 36.47) over u 7.7 to 19.3 and
 * out to w 11.4 from the face (the LiDAR's returns, p0.5 and p99.5); its walls to u 17.1 and the roof west of them a
 * canopy, open under it, before the big roller door (estimated: through the photograph's camera the door stands in
 * the main face's plane from u 17.15 westward, its head level at 37.0 m, which the box's walls would hide). */
export const BOX = { u: [7.7, 17.1], roof: 19.3, w: 11.4, top: 36.3 };

/** The south face where the photograph sees it, every place and height estimated through its fitted camera (rms 0.40
 * px): columns 0.55 m wide every 4.38 m (their centres at u 20.2 to -14.84), three lights a bay; the upper windows from
 * 44.55 to 46.3 m (under the eave's slab), the middle ones from 39.77 to 43.43, the ground storey's high windows from
 * 36.74 to 37.95 east of the big roller door; the big roller door from the ground to 37.0, its west edge out of the
 * photograph (estimated), the box's roller doors to 35.27 (u 8.8
 * to 11.85 and 16.08 to 16.92). */
export const FACE = {
  columns: Array.from({ length: 9 }, (_, k) => 20.2 - 4.38 * k),
  column: 0.55,
  ends: [-16.4, 22.5],
  rows: [[44.55, 46.3], [39.77, 43.43], [36.74, 37.95]],
  bigDoor: { u: [17.15, 21.9], top: 37.0 },
  boxDoors: [[8.8, 11.85], [16.08, 16.92]],
  boxDoorTop: 35.27,
};
