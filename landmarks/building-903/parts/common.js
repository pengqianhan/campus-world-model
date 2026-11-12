// Shared sizes, measured in the LINZ 2024 LiDAR (data/building-903_pts.npy: the returns in the crop box) in the view
// frame of config/building-903.json: x is -axis (east-south-east), y up from the config's ground, z is toStreet
// (south-south-west); the frame's centre at x = z = 0, the middle of the building's points.
// Owned by the lead: read, do not edit.
// Measured 2026-11-12 (round 0): every height below is the LiDAR's elevation, and Y turns it into one above the
// config's ground, 52.64 m (the LiDAR's ground at the door, on the platform before the corner's entrance).
//
// The sizes are given in the building's own frame: p along its long faces toward the west-north-west and q toward
// the south-south-west, the road. Its faces run 2.33 degrees off the frame's axis (the outermost roof returns of its
// four faces drift 2.27 to 2.43 degrees against the axis, and none against p and q), so `at` turns p, q by that and
// then into the view frame (x = -u, z = w); `plan` does so for a list. A side at the least p faces east-south-east
// (the east end), at the greatest p west-north-west, at the least q north-north-east and at the greatest q
// south-south-west (the south face).
//
// Building 903: a long block of four storeys, its two upper storeys clad in pale corrugated metal over two glazed
// storeys set back under them, under a low roof of two slopes whose ridge runs along it; its east end a low gable
// within a parapet. Its roof runs on to the west-north-west at the same height over the next building, and a lower
// block stands against its north face.
export const GROUND = 52.64;
const T = (2.33 * Math.PI) / 180;
export const at = (p, q) => {
  const u = p * Math.cos(T) - q * Math.sin(T), w = p * Math.sin(T) + q * Math.cos(T);
  return [-u, w];
};
/** An elevation measured in the LiDAR, as a height above the config's ground. */
export const Y = (z) => z - GROUND;
export const plan = (corners) => corners.map(([p, q]) => at(p, q));
/** The view frame's point for p, q at the height y. */
export const pt = (p, q, y) => { const [x, z] = at(p, q); return [x, y, z]; };
/** The directions of p and q in the view frame, [x, y, z]. */
export const DIR = { p: [-Math.cos(T), 0, Math.sin(T)], q: [Math.sin(T), 0, Math.cos(T)] };

// The ground along the walls (p1 of the returns 0.5 to 3 m out) lies from 51.89 m (the road before the forward face)
// to 52.7 m (the yard by the east end's north corner); the walls go down to FOOT.
export const FOOT = Y(51.8);

/** The block's plan at its roof's outer edges, from the LiDAR's outermost roof returns on each face: the east end at
 * p -38.27, the south face at q 15.84 from there to p -7.4, where it steps 2.68 m forward to q 18.52 (the step's side
 * wall: its returns from 60 to 69 m reach p -7.43 and its parapet's -7.30; the campus map's ring -7.31), the north
 * face at q -16.42 along the whole length. Its west-north-west end is the campus map's ring's (p 36.5): the roof runs on
 * there over the next building at the same height, with no seam in the returns. */
export const EAST = -38.27, STEP = -7.4, WEST = 36.5;
export const SOUTH = 15.84, FORWARD = 18.52, NORTH = -16.42;

/** The roof's two slopes, 0.066 a metre (3.8 degrees) down from its ridge along q 1.0 (70.3 m) to the north eave
 * (69.15 m; returns 69.11 to 69.25) and to the south parapet (69.32 m at q 15.84); a cap 2 m wide along the ridge to
 * 70.75 m (returns p50 70.73 to 70.77 at q 0 to 2). */
export const RIDGE = { q: 1.0, y: Y(70.3), fall: 0.066 };
export const roofAt = (q) => RIDGE.y - RIDGE.fall * Math.abs(q - RIDGE.q);
export const CAP = { q0: 0.0, q1: 2.0, top: Y(70.75) };

/** The two upper storeys, the clad box, stand from its underside at 61.25 m (the LiDAR's returns under the faces
 * stop there, and the photograph's camera puts the box's lower edge at 61.2 to 61.5 m on both faces); the two storeys
 * under it are set back 0.45 m on the south face and the east end (their returns, 54 to 61 m, at q 15.25 to 15.5 and
 * p -38.0 to -37.75) and, estimated, on the forward face as on the south face (the LiDAR has no returns on its
 * glazing: the canopy along it hides them), on a plinth to 53.0 m (the foot of the glazing through the camera), with a band at
 * the floor between them, 57.7 to 58.4 m (returns at 58.0 m on both faces; the band through the camera). */
export const SOFFIT = Y(61.25), SET = 0.45, PLINTH = Y(53.0), BAND = { y0: Y(57.7), y1: Y(58.4) };

/** The clad storeys' windows, estimated in the photograph through its fitted camera, [from, to] along the face and
 * their sills and heads. On the south face (q 15.84): the upper storey's at 66.35 to 67.95 m and the lower's at 63.25
 * to 64.72 m, a pair of wide ones by the corner (p -37.75 to -33.62) and a band of five from p -27.2 to -11.5 (its
 * ends through the camera, its units counted on the photograph). On the east end (p -38.27), from the corner: the
 * upper storey's two at 66.3 to 67.7 m (q 12.4 to 9.7 and 4.95 to 3.15), the lower's two side by side (q 12.4 to 7.2)
 * and a band of twelve to the north corner (q 5.05 to -15.4), 63.85 to 65.15 m. */
export const SILLS = { upper: [Y(66.35), Y(67.95)], lower: [Y(63.25), Y(64.72)] };
export const EAST_SILLS = { upper: [Y(66.3), Y(67.7)], lower: [Y(63.85), Y(65.15)] };
export const WINDOWS = {
  south: [[-37.75, -33.62, 1], [-27.2, -11.5, 5]],
  east: { upper: [[12.4, 9.7, 1], [4.95, 3.15, 1]], lower: [[12.4, 7.2, 2], [5.05, -15.4, 12]] },
};

/** The glazed storeys' piers, estimated in the photograph through the camera: one 0.7 m square at the corner; on
 * the south face one 1.5 m wide at p -33.62 to -32.13, and the rest along the south and forward faces every 7.6 m
 * from it, as it stands from the corner; on the east end one at q 5.04 to 2.7 and one by the north corner (q -13.9
 * to -16.0). */
export const PIERS = { corner: 0.7, south: [-33.62, -32.13], step: 7.6, east: [[2.7, 5.04], [-16.0, -13.9]] };

/** The canopies, from the LiDAR's returns before the faces with the ground's under them, their depth estimated: over
 * the corner's entrance (p -37.67 to -33.08, out to q 17.04, p50 55.47 m of 30 returns), along the forward face
 * (p 4.06 to 25.12, out to q 19.70, p50 58.15 m of 231) and at its west end (p 33.40 to 36.42, out to q 20.72, p50
 * 55.63 m of 20). The face each stands on is "S" (the south face) or "F" (the forward face). */
export const CANOPIES = [
  { face: "S", p0: -37.9, p1: -33.1, q: 17.05, top: Y(55.5), deep: 0.35 },
  { face: "F", p0: 4.05, p1: 25.1, q: 19.7, top: Y(58.15), deep: 0.25 },
  { face: "F", p0: 33.4, p1: 36.4, q: 20.7, top: Y(55.65), deep: 0.35 },
];

/** A roof under the step, before the south face (p -10.0 to -6.25, the extent of its returns, out to q 26.2, the
 * edge of block 903's ring in the campus map), one plane falling 0.215 a metre from 57.61 m at q 16.5 to 55.5 m at
 * its outer edge (the returns' p50 in 1 m strips of q: 57.61, 57.41, 57.18, 56.97, 56.75, 56.53, 56.33, 56.10, 55.89,
 * 55.67, 55.47). The ground's returns lie under it all along, so it is drawn as a roof alone, 0.3 m deep: what holds
 * it up is not known. */
export const LEAN = { p: [-10.0, -6.25], q: 26.2, at: 16.5, y: Y(57.61), fall: 0.215, deep: 0.3 };

/** The parapet along the south face, its top at 70.05 m (p90 of the returns within 0.6 m of the face, 70.01 to
 * 70.07), 0.7 m thick (the returns over 69.85 m fill q 15.0 to 15.9 along the south face, and p -38.4 to -37.7 along
 * the east end); at the east end a gable within its parapet, its top 70.08 m at the south corner, 70.97 m over
 * the ridge and 69.85 m at the north corner (p90 of the returns on it, in 1 m strips of q). */
export const PARAPET = { top: Y(70.05), thick: 0.7 };
export const GABLE = { south: Y(70.08), ridge: Y(70.97), north: Y(69.85) };

/** On the roof, from the LiDAR's returns standing more than 0.35 m over it (in 1 m cells): plant on a platform
 * across the ridge (p -17 to -6, q -5 to 5.5; returns p50 71.17, p90 71.42 m) and a duct from it to the north
 * (p -8 to -6, q -11.5 to -5; 71.15 m); a unit toward the west end (p 23 to 28.3, q -5 to -1; 70 returns, p90
 * 71.97 m); a fan (p -27.4 to -26.5, q 5.1 to 6.3; p90 71.91 m); and a low block south of it (p -26.3 to -23.0, q 9.4
 * to 10.15; 20 returns, p50 70.65 m). */
export const HIGH = [
  { p: [-17.0, -6.0], q: [-5.0, 5.5], top: Y(71.35) },
  { p: [-8.0, -6.0], q: [-11.5, -5.0], top: Y(71.15) },
  { p: [23.0, 28.3], q: [-5.0, -1.0], top: Y(71.97) },
  { p: [-27.4, -26.5], q: [5.1, 6.3], top: Y(71.91) },
  { p: [-26.3, -23.0], q: [9.4, 10.15], top: Y(70.65) },
];
