// Shared sizes, measured in the LINZ 2024 LiDAR (data/mhs-building-501_pts.npy: the returns in the crop box) in the
// view frame of config/mhs-building-501.json: x is -axis (west-north-west, along the long block), y up from the
// LiDAR's ground at the config's door (72.19 m NZVD2016, on the plaza before the glazed box), z is toStreet
// (north-north-east, toward building 502); the frame's centre at x = z = 0, at the top of the tower. Owned by the
// lead: read, do not edit.
// Measured 2026-11-09 (round 0), before the door was set: every height below is measured above 71.88 m, the median
// ground in the first crop box, and H moves it on to the door's ground. Re-measured after the review's round 1 cell
// by cell (0.5 m and 1 m cells, each cell's highest return and its class), where the first reading of 2 m cells had
// put several edges 1 to 2.5 m off.
//
// The sizes are given in the building's own frame, u along the long block toward the plaza (east-south-east, the
// frame's axis, so x = -u) and w toward 502 (z = w); `at`, `plan` and `rect` turn them into the view frame.
//
// The model draws what the LiDAR has inside the campus map's ring of 501 (and the long block's south-west corner,
// which stands over the ring of 501C, a basement in the campus map), so that it does not stand over the blocks of
// 502 and 503 beside it: a long block of about 29.8 m (u -26 to -2, w -6 to 10) with a tower at its east end toward
// the plaza (u -2 to 9, w -7 to 10), whose dark crown's flat top stands at 32.4 m (32.2 to 32.6); a plant room of
// 34.6 m on its south side; a lower part south of it (30.5 and 28.6 m) to the ring's edge; a concrete link north of
// it to 502; a glazed link of 27 m beside the tower's north side, which returns nothing (a glass roof); a glazed box
// of 4.5 m before the tower's east face (u 9 to 16.8); and the south edge of the building to its north (502's roof,
// rising from 28.8 m at its south wall) to that building's ring.
export const at = (u, w) => [-u, w];
/** A height measured above 71.88 m, as one above the door's ground, 0.31 m higher (the config's `ground`). */
export const H = (h) => h - 0.31;
export const plan = (corners) => corners.map(([u, w]) => at(u, w));
export const rect = ([u0, u1], [w0, w1]) => plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]);

// The ground round it: about +0.3 on the plaza before the tower and round the building's other sides, and 5.2 m
// below the door's beyond its west end (a lower yard). The walls go down to FOOT.
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
// at u 16.8 (the last cell with its returns), w -6.0 to 9.5; it runs 0.5 m into the shaft, so that its glass does not
// lie in the shaft's face. The beam along its top is 0.5 m deep (estimated).
export const BOX = { u: [8.1, 16.8], w: [-6.0, 9.5], top: H(4.5), beam: 0.5 };

// The long block west of the tower: 29.8 m (29.5 to 29.8), its west end at u -26 (beyond it a part of 22 m, outside
// the ring, and the ground), its sides at w -6 and 10.
export const BLOCK = { u: [-26.0, -2.0], w: [-6.0, 10.0], top: H(29.8) };
// A light well in its roof, u -21 to -7, w 4 to 8, its floor at 25.8 m (25.6 to 26.5).
export const WELL = { u: [-21, -7], w: [4.0, 8.0], floor: H(25.8) };
// The plant room on its south side, u -13 to -4, w -7 to -3, 34.6 m (34.3 to 34.9); its ends 0.1 m inside the part
// south of the block, so that its walls do not lie in that part's ends.
export const PLANT = { u: [-12.9, -4.1], w: [-7, -3], top: H(34.6) };
// The part south of the block, to the ring's south edge at w -9.3 (the LiDAR has it on to w -11, inside block 503's
// ring, which draws it): 30.5 m from u -13 to -4.5 (30.3 to 30.7), 28.6 m from -4.5 to -1 (28.5 to 28.6).
export const SOUTH = [
  { u: [-13, -4.5], w: [-9.3, -6.0], top: H(30.5) },
  { u: [-4.5, -1.0], w: [-9.3, -6.0], top: H(28.6) },
];
// The concrete link on its north side, u -5.5 to -2, from the block to 502 (w 10 to 16.5, 0.5 m into 502), 28.5 m.
export const LINK = { u: [-5.5, -2.0], w: [10.0, 16.5], top: H(28.5) };
// The glazed link beside the tower's north side, u -2 to 0.5 and w 10 to 15, where the LiDAR returns nothing (a glass
// roof; the ground beyond it); it runs 0.5 m into the shaft and the concrete link. Its top at 27 m and its floors 3.8 m
// apart from 4.8 m up: the photograph's glazed link right of the tower, through its fitted camera (estimated); each
// floor's slab stands 0.05 m out of the glass. Between the block and 502 west of the concrete link the LiDAR returns
// nothing either, over a strip 6 m wide and 28 m deep: a glass roof or an open court, which the photograph does not
// show; it is not drawn.
export const GLAZED = { u: [-2.5, 0.5], w: [9.3, 15.0], top: H(27.0) };
export const GLAZED_FLOORS = [4.8, 8.6, 12.4, 16.2, 20.0, 23.8].map(H);

// The building to the north (502), its south edge inside 501's ring: its south wall at w 16 (its first roof returns),
// its east end at u 5.75, from the ring's west edge at u -30; drawn to 502's ring, whose south edge runs from w 20.3
// at u -23.2 to 19.65 at u 5.75 (its block draws on from there). Its roof rises 0.2 m a metre to the north from 28.8 m
// at that wall (29.2, 29.5, 29.9 and 30.2 m at w 17 to 23; the outermost cells, 27.0 to 27.3, are its edge's).
export const NORTH = {
  plan: [[-30, 16.0], [5.75, 16.0], [5.75, 19.65], [-23.17, 20.32], [-30, 20.29]],
  eave: H(28.8), rise: 0.2, w0: 16.0,
};
