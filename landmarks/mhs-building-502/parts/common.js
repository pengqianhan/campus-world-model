// Shared sizes, measured in the LINZ 2024 LiDAR (data/mhs-building-502_pts.npy: the returns in the crop box) in the
// view frame of config/mhs-building-502.json: x is -axis (west-north-west, along the main block), y up from the
// LiDAR's ground, z is toStreet (north-north-east, toward the street); the frame's centre at x = z = 0, the middle of
// the main block's roof. Owned by the lead: read, do not edit.
// Measured 2026-11-09 (round 0): every height below is measured above 68.80 m, the median ground in the first crop
// box, and H moves it on to the door's ground (step 7: 71.49 m, before the middle of the east end).
//
// The sizes are given in the building's own frame, u along the main block toward the east-south-east (the frame's
// axis, so x = -u) and w toward the street (z = w); `at`, `plan` and `rect` turn them into the view frame.
//
// Building 502 of the M&HS Building: a main block of seven storeys under a hipped roof with a dark metal skirt, a plant
// room near each end of its roof, and a lower west part with a raised part beside the main block. Its south strip
// stands in block 501's ring, where 501's model draws it (u -13.87 to 21.89, w -17.58 to the edge of 502's ring): this
// model stops at that strip's north edge.
export const at = (u, w) => [-u, w];
/** A height measured above 68.80 m, as one above the door's ground, 71.49 m (the config's `ground`), 2.69 m higher. */
export const H = (h) => h - 2.69;
export const plan = (corners) => corners.map(([u, w]) => at(u, w));
export const rect = ([u0, u1], [w0, w1]) => plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]);

// The ground round the building lies from -1.8 to +3.5 (the 2.5 m round its two parts). The walls go down to FOOT.
export const FOOT = H(-2.2);

// A plane over the plan, [a, cu, cw]: the height a + cu u + cw w (heights over 68.80 m before H).
const plane = (a, cu, cw) => [a, cu, cw];
/** A plane in the view frame, [a, along x, along z], for shapes.js's envelope, moved by H. */
export const viewPlane = ([a, cu, cw]) => [H(a), -cu, cw];

export const MAIN = {
  // Its outermost roof returns: west end u -22.9 (p0.3 -23.06), east end u 21.3 (p99.7 21.22), north side w 14.25
  // (p99.7); its south side at w -17.9 west of 501's strip. The roof's outer edge, the top of its skirt, stands at
  // about 31.85 (the outermost cells 31.7 to 32.2).
  u: [-22.9, 21.3], w: [-17.9, 14.25],
  // The north edge of 501's model's strip of this roof (in this frame), along which this model's south side runs:
  // from (-13.87, -13.29) by (-7.04, -13.24) to (21.31, -11.74), a straight line within 0.004 m of its other corners
  // but two, which stand 0.25 and 0.17 m north of it (u 9.68 and 12.59): there 501's strip reaches up to 0.25 m over
  // this model's south side (about 3.4 m2), its roof 0.13 m above this one's.
  strip: [[-13.87, -13.29], [-7.04, -13.24], [21.3, -11.74]],
  // The roof's planes, fitted to its returns: the north slope (rms 0.08 m) and the south (0.15) meet at w -1.83, at
  // 34.78; between u -12 and 12 there are only those two. Beyond them each end is lower, a gentler hip falling to the
  // ends (the west end from 33.45 at u -12; the east end fitted, rms 0.02), with a step of up to 1.3 m up to the middle.
  north: plane(34.446, 0, -0.1839), south: plane(35.128, 0, 0.1897),
  west: plane(35.25, 0.15, 0), east: plane(35.2801, -0.1542, 0),
  ends: [-12, 12],
};

export const WEST = {
  // The lower west part, u -46.7 to -22.9 (to the main block's wall), w -17.83 to 13.07 (its returns' outermost), under
  // a low hipped roof: its north and south slopes (rms 0.15 and 0.14) meet at w -1.85, at 26.26 (the LiDAR's ridge band
  // has a median of 25.96 to 26.01, 0.3 m lower); its west end falls to 25.0 at u -46.7 (rms 0.05).
  u: [-46.71, -22.9], w: [-17.83, 13.07],
  north: plane(26.109, 0, -0.0792), south: plane(26.386, 0, 0.0705), west: plane(29.966, 0.106, 0),
};

// A raised part on the west part beside the main block, flat at 28.8 (28.72 to 28.83), u -29.72 to -22.9, w -9.32
// to 3.7; and the two plant rooms on the main block's roof, about 37.7 (37.48 to 37.81): the east one, u 16.84 to
// 18.74, w -3.83 to 1.21 (a white lattice in the photograph), the west one, u -22.62 to -20.2, w -5.31 to 1.07.
export const CORE = { u: [-29.72, -22.9], w: [-9.32, 3.7], top: H(28.8) };
export const PLANT_E = { u: [16.84, 18.74], w: [-3.83, 1.21], top: H(37.65) };
export const PLANT_W = { u: [-22.62, -20.2], w: [-5.31, 1.07], top: H(37.7) };

// The faces (estimated, from the photograph through its fitted camera, except the skirts' feet): the roof's dark metal
// skirt from 30.5 m up to the roof's edge (the LiDAR's outermost roof cells reach down to about 30.5, where the skirt
// stands out over the wall), and over the west part from 23.7 m; the east end's dark glazed strip south of w 3.4, its
// pale panels north of it.
export const FACES = { skirt: H(30.5), westSkirt: H(23.7), eastStrip: 3.4 };
