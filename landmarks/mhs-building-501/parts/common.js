// Shared sizes, measured in the LINZ 2024 LiDAR (data/mhs-building-501_pts.npy: the building returns, class 6, in
// the crop box) in the view frame of config/mhs-building-501.json: x is -axis (west-north-west, along the long block),
// y up from the LiDAR's ground at the config's door (72.19 m NZVD2016, on the plaza before the glazed box), z is
// toStreet (north-north-east, toward building 502); the frame's centre at x = z = 0, at the top of the tower. Owned
// by the lead: read, do not edit.
// Measured 2026-11-09 (round 0), before the door was set: every height below is measured above 71.88 m, the median
// ground in the first crop box, and H moves it on to the door's ground.
//
// The sizes are given in the building's own frame, u along the long block toward the plaza (east-south-east, the
// frame's axis, so x = -u) and w toward 502 (z = w); `at`, `plan` and `rect` turn them into the view frame.
//
// How: the highest return in each 0.5 m, 1 m or 2 m cell for the roofs and the edges where they stop. The building is
// a long block of about 29.8 m (u -28.5 to -2, w -6.5 to 9.5) with a tower at its east end toward the plaza (u -2 to
// 9, w -7 to 10), whose dark crown's flat top stands at 32.4 m (32.2 to 32.6); a plant room of 34.8 m on its south
// side; a lower part south of it (30.6 and 28.6 m); a glazed box of 4.5 m before the tower's east face (u 9 to 16.8);
// glass-roofed atria to its north and south, which return nothing; and, inside the campus map's ring of 501, the
// south edge of the building to its north (502's roof, rising from 27.5 m at its south wall to 30.6 m).
export const at = (u, w) => [-u, w];
/** A height measured above 71.88 m, as one above the door's ground, 0.31 m higher (the config's `ground`). */
export const H = (h) => h - 0.31;
export const plan = (corners) => corners.map(([u, w]) => at(u, w));
export const rect = ([u0, u1], [w0, w1]) => plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]);

// The ground round it: about +0.2 to +0.4 on the plaza before the tower and along its north side, -4.8 at the long
// block's west end and along its south side west of the tower (a lower yard). The walls go down to FOOT.
export const FOOT = H(-5.3);

export const TOWER = {
  // The shaft's walls under the crown: 0.4 m in from the crown's eave all round (the photograph shows the crown's
  // flared foot standing out from the shaft by about that, through its fitted camera: estimated).
  shaft: { u: [-2.0, 8.6], w: [-6.4, 9.8] },
  // The crown: its eave at 27.8 m (the photograph, through its fitted camera, where the LiDAR's edge cells mix the
  // crown and the wall, 28 to 30 m: estimated), round u -2.4 to 9.0 and w -6.8 to 10.2 (the outermost cells with
  // the crown's returns); a steep band to 29.2 m (the photograph's upright corners under the hips: estimated), then
  // the slopes up to the flat top, 32.4 m, over u -1.4 to 8.0 and w -5.8 to 9.2 (its returns 32.2 to 32.6).
  eave: H(27.8), band: H(29.2), top: H(32.4),
  crownOut: { u: [-2.4, 9.0], w: [-6.8, 10.2] },
  crownTop: { u: [-1.4, 8.0], w: [-5.8, 9.2] },
  // The strip of windows up the middle of the east face, in dark frames with dark panels between them: w -0.6 to
  // 1.4, from 5.0 m (over the glazed box) to 26.7 m (the photograph, through its fitted camera: estimated).
  strip: { w: [-0.6, 1.4], y: [H(5.0), H(26.7)] },
};

// The glazed box before the tower's east face: its roof 4.5 m (4.4 to 4.6, its beams 5.4 to 7.0 above it), its face
// at u 16.8 (the last cell with its returns), w -6.0 to 9.5.
// It runs 0.5 m into the shaft, so that its glass does not lie in the shaft's face.
export const BOX = { u: [8.1, 16.8], w: [-6.0, 9.5], top: H(4.5), beam: 0.5 };

// The long block west of the tower: 29.8 m (29.5 to 30.2), its west end at u -28.5 (the ground at -4.8 beyond it),
// its sides at w -6.5 and 9.5; the plant room on its south side, u -14 to -6, w -9 to -3.5, 34.8 m (34.4 to 34.9);
// the part south of it to w -12.5: 30.6 m from u -14 to -6 (30.4 to 30.7) and 28.6 m from -6 to -2.
export const BLOCK = { u: [-28.5, -2.0], w: [-6.5, 9.5], top: H(29.8) };
// A light well in its roof, u -21 to -7, w 3.5 to 7.8, its floor at 26.3 m (25.7 to 27.0).
export const WELL = { u: [-21, -7], w: [3.5, 7.8], floor: H(26.3) };
// The plant room's ends 0.1 m inside the part south of the block, so that its walls do not lie in that part's ends.
export const PLANT = { u: [-13.9, -6.1], w: [-9, -3.5], top: H(34.8) };
export const SOUTH = [
  { u: [-14, -6], w: [-12.5, -6.5], top: H(30.6) },
  { u: [-6, -2], w: [-12.5, -6.5], top: H(28.6) },
];
// The concrete link on its north side, u -6 to -2, w 9.5 to 14, 28.6 m; drawn to 502's south wall, w 13.8.
export const LINK = { u: [-6, -2], w: [9.5, 13.8], top: H(28.6) };
// The glass-roofed atria, which the LiDAR does not see: to the north, w 9.5 to 14, from the block's west end to u 5
// (the ground's returns beyond); to the south, w -12.5 to -6.5, west of the part south of the block and from it to
// u 5. Their tops at 27 m and their floors 3.8 m apart from 4.8 m up: the photograph's glazed links either side of the
// tower, through its fitted camera (estimated); each floor's slab stands 0.05 m out of the glass.
// Each runs 0.5 m into the walls it meets (the block's, the shaft's, the link's and the part's south of the block)
// and 0.2 m into 502's south wall, so that no glass lies in a wall's plane; their west ends 0.5 m short of the
// block's, their east ends 0.1 m short of 502's, and their south faces 0.1 m inside the part south of the block, for
// the same reason.
export const ATRIA = [
  { u: [-28.0, -5.5], w: [9.0, 14] }, { u: [-2.5, 4.9], w: [9.3, 14] },
  { u: [-28.0, -13.5], w: [-12.4, -6.0] }, { u: [-2.5, 4.9], w: [-12.4, -5.9] },
];
export const ATRIUM_TOP = H(27.0);
export const ATRIUM_FLOORS = [4.8, 8.6, 12.4, 16.2, 20.0, 23.8].map(H);

// The building to the north (502), its south edge inside 501's ring: its south wall at w 13.8, its east end at u 5,
// from u -38 (beyond the ring) on; its roof rising from 27.5 m at that wall to 30.6 m at w 24 (29.2, 29.5, 29.9 and
// 30.2 between).
export const NORTH = { u: [-38, 5], w: [13.8, 24], eave: H(27.5), high: H(30.6) };
