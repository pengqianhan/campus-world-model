// Shared sizes, measured in the LINZ 2024 LiDAR (data/mhs-building-505_pts.npy: the returns in the crop box) in the
// view frame of config/mhs-building-505.json: x is -axis (west-north-west, along the long block), y up from the
// LiDAR's ground at the config's door, z is toStreet (north-north-east, toward the plaza and the main road); the
// frame's centre at x = z = 0. Owned by the lead: read, do not edit.
// Measured 2026-11-10 (round 0), before the door was set: every height below is measured above 72.13 m, the median
// ground in the first crop box, and H moves it on to the door's ground.
//
// The sizes are given in the building's own frame, u along the long block toward the main road (east-south-east, the
// frame's axis, so x = -u) and w toward the plaza (z = w); `at`, `plan` and `rect` turn them into the view frame.
//
// The model draws what the LiDAR has inside the campus map's ring of 505: the long block (u -32.7 to its east end at
// about 54 to 61, w -18.3 to 7.9), whose roof is a flat middle of 20.85 m with lower strips of 17.3 to 18 m round it;
// the glazed atrium at its west end, between it and 503 (u -45.5 to -14.5, w -4.5 to 10.3), whose glass roof rises to
// the north; a low link north of the block's west part; and a low strip west of the atrium. Beyond the block's west
// end stands 504, and north of the atrium 503, each drawn by its own block. The ring runs 10 to 12 m north of the
// block's north face, over the plaza, where the LiDAR has only the ground: the storeys under the plaza.
export const at = (u, w) => [-u, w];
/** A height measured above 72.13 m (the provisional ground), as one above the door's ground. */
export const H = (h) => h;
export const plan = (corners) => corners.map(([u, w]) => at(u, w));
export const rect = ([u0, u1], [w0, w1]) => plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]);

// The ground round it: 0 on the plaza north of the block, rising to about +2.5 by the main road at its south-east
// corner, and falling to -3.4 along the street south of its west end. The walls go down to FOOT.
export const FOOT = H(-4.5);

// The long block's outline. Its north face at w 7.9 (the roof's last returns, w 7.8 to 8.0); its south face at
// w -18.3 (-18.2 to -18.4); its west end at u -32.7, against 504. Its east face is not square to the axis: from the
// north-east corner (54.3, 7.9) to (58.2, -5.0) and (60.5, -9.0), 17 degrees off; then the south-east corner is cut
// back on a straight line from (61.3, -11.0) to (37.5, -18.3).
export const NORTH_W = 7.9, SOUTH_W = -18.3, WEST_U = -32.7;
export const NE = [54.3, 7.9];
export const EAST = [[54.3, 7.9], [56.4, 1.0], [58.2, -5.0], [60.5, -9.0], [61.0, -10.2], [61.3, -11.0]];
export const CUT = [[61.3, -11.0], [37.5, -18.3]];

// The roof: the flat middle at 20.85 m (20.7 to 21.0), w -10.2 to 1.0, from u -14.5 (west of which its north part is
// the atrium's) and u -32.7 to 37.5; round it the north strip, w 1.0 to 7.9, 17.9 m falling to 17.3 at the north
// face; the east part, u 37.5 to the east face, 18.2 m falling to 17.4 at the east face; the south band, w -18.3 to
// -10.2, 17.9 m falling to 17.4. Each drawn flat at its middle for now.
export const MIDDLE = {
  plan: [[WEST_U, -10.2], [37.5, -10.2], [37.5, 1.0], [-14.5, 1.0], [-14.5, -4.5], [WEST_U, -4.5]],
  top: H(20.85),
};
export const NORTH = { plan: [[-14.5, 1.0], [56.4, 1.0], [54.3, 7.9], [-14.5, 7.9]], top: H(17.6) };
export const EAST_PART = {
  plan: [[37.5, -10.2], [61.0, -10.2], [60.5, -9.0], [58.2, -5.0], [56.4, 1.0], [37.5, 1.0]], top: H(17.8),
};
export const SOUTH = { plan: [[WEST_U, SOUTH_W], [37.5, SOUTH_W], [61.3, -11.0], [61.0, -10.2], [WEST_U, -10.2]], top: H(17.7) };

// The atrium: u -45.5 to -14.5, w -4.5 to 10.3 (where 503's roof begins, 28.7 m); its glass roof, in vaults across
// it, rises from 21.6 m at its south side to 24.6 m at its north side. Drawn as a box to 23.0 m for now.
export const ATRIUM = { u: [-45.5, -14.5], w: [-4.5, 10.3], top: H(23.0) };
// The low link north of the block's west part, to 503's east wing: u -13 to 8, w 7.9 to 11.5, 17.3 m (17.0 to 17.5).
export const LINK = { u: [-13.0, 8.0], w: [NORTH_W, 11.5], top: H(17.3) };
// The low strip west of the atrium, inside the ring: u -48.5 to -45.5, w -4.5 to 9.0, 16.8 m (16.7 to 16.9).
export const WEST = { u: [-48.5, -45.5], w: [-4.5, 9.0], top: H(16.8) };
