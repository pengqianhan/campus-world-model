// Shared sizes, measured in the LINZ 2024 LiDAR (data/mhs-building-505_pts.npy: the returns in the crop box) in the
// view frame of config/mhs-building-505.json: x is -axis (west-north-west, along the long block), y up from the
// LiDAR's ground at the config's door, z is toStreet (north-north-east, toward the plaza and the main road); the
// frame's centre at x = z = 0. Owned by the lead: read, do not edit.
// Measured 2026-11-10 (round 0), before the door was set: every height below is measured above 72.13 m, the median
// ground in the first crop box, and H moves it on to the door's ground, 72.16 m (on the plaza before the entrance in
// the north face's ground floor).
//
// The sizes are given in the building's own frame, u along the long block toward the main road (east-south-east, the
// frame's axis, so x = -u) and w toward the plaza (z = w); `at`, `plan` and `rect` turn them into the view frame.
//
// The model draws what the LiDAR has of 505, by the outline traced from it (the config's building.outline): the long
// block (u -32.7 to its east end at about 54 to 61, w -18.3 to 7.9), whose roof is a flat middle of 20.85 m with lower
// strips of 17.3 to 18 m round it, its ground floor set back under its upper storeys on every side; the glazed atrium
// at its west end, between it and 503 (u -45.5 to -14.5, w -4.5 to 10.3), whose glass roof rises to the north; a low
// link north of the block's west part; and a low strip west of the atrium. Beyond the block's west end stands 504,
// and north of the atrium 503, each drawn by its own block. The campus map's outlines of 505 lie about 7 m
// north-north-east of the LiDAR's building (its storeys fit the LiDAR's when moved so): its ring takes in 10 to 12 m
// of the plaza north of the block, where the LiDAR has only the ground, and the south edges of 503's roofs north of
// the atrium and the link, which block 503 as the site draws it does not reach. The model draws those edges too
// (EDGE), plainly, so that the map keeps the roof that block 505 drew there.
export const at = (u, w) => [-u, w];
/** A height measured above 72.13 m (the provisional ground), as one above the door's ground, 0.03 m higher. */
export const H = (h) => h - 0.03;
export const plan = (corners) => corners.map(([u, w]) => at(u, w));
export const rect = ([u0, u1], [w0, w1]) => plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]);

// The ground round it: 0 on the plaza north of the block, rising to about +2.5 by the main road at its south-east
// corner, and falling to -3.4 along the street south of its west end. The walls go down to FOOT.
export const FOOT = H(-4.5);

// The long block's outline. Its north face at w 7.9 (the roof's last returns, w 7.8 to 8.0); its south face at
// w -18.3 (-18.2 to -18.4); its west end at u -32.7, against 504. Its east face is not square to the axis: from the
// north-east corner (54.3, 7.9) through (56.4, 1.0) and (58.2, -5.0) to (60.5, -9.0), 17 degrees off and more toward
// its south end; then the south-east corner is cut back on a straight line from (61.3, -11.0) to (37.5, -18.3).
export const NORTH_W = 7.9, SOUTH_W = -18.3, WEST_U = -32.7;
// u of the east face at w (between the north-east corner and w -4.3, where its glass ends).
export const eastU = (w) => (w >= 1.0 ? 54.3 + (NORTH_W - w) * (2.1 / 6.9) : 56.4 + (1.0 - w) * (1.6 / 5.3));
// The dark band: the east face south of its glass, the cut corner and the south face east of u 30, clad dark from the
// first floor's soffit to 18.7 m (18.6 to 18.8), a metre over the roofs inside it; 1.4 m deep (the LiDAR's cells at
// 18.7 m, 1 to 2 m wide).
export const BAND = { line: [[58.0, -4.3], [58.2, -5.0], [60.5, -9.0], [61.3, -11.0], [37.5, -18.3], [30.0, -18.3]],
  depth: 1.4, top: H(18.7) };

// The roof: the flat middle at 20.85 m (20.7 to 21.0), w -10.2 to 1.0, from u -14.5 (west of which its north part is
// the atrium's) and u -32.7 to 37.5; round it the north strip, w 1.0 to 7.9, 17.9 m falling to 17.3 at the north
// face, drawn at its parapet, 17.45 (17.45 and 17.5 through the photograph's camera); the east part, u 37.5 to the
// east face, 18.2 m falling to 17.4; the south band, w -18.3 to -10.2, 17.9 m falling to 17.4. Each drawn flat.
export const MIDDLE = {
  plan: [[WEST_U, -10.2], [37.5, -10.2], [37.5, 1.0], [-14.5, 1.0], [-14.5, -4.5], [WEST_U, -4.5]],
  top: H(20.85),
};
export const TOP_N = H(17.45), TOP_E = H(17.8), TOP_S = H(17.7);

// The ground floor, under the upper storeys, which stand on it from the first floor's slab at 3.9 m (estimated) on every
// side. The LiDAR sees the ground under the roof up to 3.4 m in from the south face (w -15.0 to -16.0), on the whole
// width of the east end from u 51 (w -8 to 7.9), and along the cut to w -12.3 to -10.8: its walls stand behind those
// returns, at w -14.5 on the south, u 50.5 at the east end and on a line between them behind the cut (estimated); on
// the north, the set-back glass at w 5.4 (the photograph). Before the south face, a canopy at 4.75 m (4.2 to 5.1),
// 1.8 m out (to w -20.1), u -31 to 39.5 (285 returns).
export const GROUND = {
  plan: [[WEST_U, -14.5], [38.0, -14.5], [44.0, -12.0], [50.5, -10.5], [50.5, 5.4], [4.0, 5.4], [4.0, NORTH_W],
    [-14.5, NORTH_W], [-14.5, -4.5], [WEST_U, -4.5]],
  slab: H(3.9),
};
export const CANOPY = { u: [-31.0, 39.5], w: [-20.1, SOUTH_W + 0.1], y: [H(4.55), H(4.75)] };

// The south edges of 503's roofs inside 505's ring, which no block draws once block 505 gives way to the model (the
// LiDAR's roof cells there under neither the model nor another block, 335 m²): north of the atrium, to block 503's
// edge (w 15.5 to 17.5), its roof rising from 28.7 m at the atrium to 29.8 m (29.0 to 29.3 at their middle); north of
// the link, to the ring's edge (w 18 to 22), 503's east wing at 21.0 m (20.9 to 21.0). Drawn plainly.
export const EDGE = {
  // north of the atrium, in four strips by how far block 503 leaves it; each roof rising 0.16 m a metre from w 10.3
  high: { strips: [[[-46.0, -35.0], 17.0], [[-35.0, -22.0], 17.5], [[-22.0, -17.0], 15.5], [[-17.0, -14.5], 17.0]],
    w0: 10.3, eave: H(28.7), rise: 0.16 },
  // north of the link
  low: { plan: [[-14.5, 10.3], [-12.5, 11.0], [-8.5, 12.0], [-4.5, 13.5], [2.0, 13.5], [2.0, 21.5], [1.0, 22.0], [-14.5, 17.9]],
    top: H(21.0) },
};

// The north face. The photograph, through its fitted camera, gives what the LiDAR does not see (estimated): a ground
// floor set back under the upper storeys to 4.6 m (the soffit; 3.9 to 4.9 along the face); a white panel wall at the
// north-east corner (u 50.62 to the corner); twelve bays of 2.755 m west of it, their glazing set back 1 m (w 6.9)
// behind silver fins (from 4.6 to 16.95 m) with horizontal louvres every 0.975 m, a frame along their top, and the
// white parapet over it to 17.45 m; the storeys 3.9 m apart, their windows at 6.3 to 8.2, 10.1 to 12.1 and 13.7 to
// 15.9 m; round columns every three bays under the upper storeys, in the middle of a bay; the ground floor's glass
// 2.5 m back (w 5.4). West of the bays the LiDAR has the face standing out to w 8.5 (its parapet 17.6 to 17.7 m, w 7.9
// to 8.5) from the last fin to u 4.0: the photograph shows it as the end bay, a white wall with a window in each
// storey in a dark frame (u 11.8 to 17.3 there, the frames 0.6 m deep: estimated), to u 8.7, and west of it a glazed
// front under a grey band from 16.15 m. The LiDAR has a shade 1 m deep at 15.6 m over the top window's head (u 9.0 to
// 16.3, w 8.5 to 9.5).
export const SOFFIT = H(4.6), BACK = 5.4, GLAZING = 6.9;
export const BAYS = { u0: 17.56, u1: 50.62, n: 12, top: H(16.95), frame: 0.2 };
export const END_BAY = {
  u: [8.7, 17.56], face: 8.5, top: H(17.65),
  windows: { u: [11.8, 17.3], depth: 0.6, rows: [[6.3, 8.2], [10.1, 12.1], [13.7, 15.45]].map(([a, b]) => [H(a), H(b)]) },
  shade: { u: [9.0, 16.3], w: [8.5, 9.5], y: [H(15.45), H(15.6)] },
};
export const FRONT = { u: [4.0, 8.7], face: 8.5, band: H(16.15), top: H(17.65) };
export const STOREY_GLASS = [[5.6, 8.3], [9.5, 12.2], [13.4, 16.1]].map(([a, b]) => [H(a), H(b)]);
export const LOUVRES = { first: H(5.4), step: 0.975, n: 12, t: 0.06, w: [7.35, 7.85] };
// the fins and their frame from just out of the glazing (whose glass stands 0.02 m out of it), so that their backs do
// not lie in the glass's back
export const FIN = { half: 0.06, w: [GLAZING + 0.05, 7.85] };
export const COLUMNS = { u: [53.6, 46.49, 38.23, 29.96, 21.70, 13.44], w: 7.3, r: 0.4 };
// The east face's glass, from the north-east corner to w -4.3, from 4.4 m to the parapet (the photograph, through its
// camera: estimated).
export const EAST_GLASS = { w: [-4.3, NORTH_W], y: [H(4.4), TOP_N] };

// The atrium: u -45.5 to -14.5, w -4.5 to 10.3 (where 503's roof begins, 28.7 m); its glass roof, in vaults across
// it, rises from 21.6 m at its south side to 24.6 m at its north side (21.3 to 21.8 at w -4.5, 24.2 to 24.9 at w 9),
// drawn as one slope.
export const ATRIUM = { u: [-45.5, -14.5], w: [-4.5, 10.3], low: H(21.6), high: H(24.6) };
// The low link north of the block's west part, between the end bay and 503's east wing: u -14.5 (the atrium) to 4.0,
// from the north face to w 10.3 to 13.5 (where 503's roof, 20.8 m, begins), 17.3 m (17.1 to 17.5); glass under a grey
// band (the photograph's right edge: estimated).
export const LINK = {
  plan: [[-14.5, NORTH_W], [4.0, NORTH_W], [4.0, 13.5], [-4.5, 13.5], [-8.5, 12.0], [-12.5, 11.0], [-14.5, 10.3]], top: H(17.3),
};
// The low strip west of the atrium, inside the ring: u -48.5 to -45.5, w -4.5 to 9.0, 16.8 m (16.7 to 16.9).
export const WEST = { u: [-48.5, -45.5], w: [-4.5, 9.0], top: H(16.8) };
