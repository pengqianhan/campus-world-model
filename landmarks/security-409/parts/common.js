// Shared sizes, measured in the LINZ 2024 LiDAR (data/security-409_pts.npy: the returns in the crop box) in the view
// frame of config/security-409.json: x is -axis (south-west), y up from the config's ground, z is toStreet
// (north-west); the frame's centre at x = z = 0, the middle of the building's points.
// Owned by the lead: read, do not edit.
// Measured 2026-11-12 (round 0): every height below is the LiDAR's elevation, and Y turns it into one above the
// config's ground, 43.45 m (the median ground in the outline's band; the door's ground replaces it at step 7).
//
// The sizes are given in the building's own frame: p along its long faces toward the north-east and q toward the
// north-west, the road. Its faces run 1.8 degrees off the frame's axis (the LiDAR's long faces and ends alike: their
// outermost returns drift 1 m over 30 m against the axis, and none against p and q), so `at` turns p, q by that and
// then into the view frame (x = -u, z = w); `plan` does so for a list. A side at the least p faces south-west, at the
// greatest p north-east, at the least q south-east and at the greatest q north-west.
//
// Security, building 409: a block of two storeys whose upper storey is a band of concrete over a glazed ground storey,
// on ground that falls from the road on its north-west side (46.3 m) to a paved court on its south-east (43.4 m); a
// flat roof within a parapet, and on it a box at its west corner and a lower block toward its east end.
export const GROUND = 43.45;
const T = (1.8 * Math.PI) / 180;
export const at = (p, q) => {
  const u = p * Math.cos(T) - q * Math.sin(T), w = p * Math.sin(T) + q * Math.cos(T);
  return [-u, w];
};
/** An elevation measured in the LiDAR, as a height above the config's ground. */
export const Y = (z) => z - GROUND;
export const plan = (corners) => corners.map(([p, q]) => at(p, q));

// The ground along the walls lies from 43.3 m (the court on the south-east side and the north-east end, p5 of the
// returns 0.5 to 3 m out) to 46.5 m (the road on the north-west side); the walls go down to FOOT.
export const FOOT = Y(43.0);

/** The block's plan at its parapet's outer edge, from the LiDAR's returns on the roof (p1/p99 in strips along each
 * face): the south-east face at q -12.85, the north-west face at 13.15, the south-west end at p -18.85 south of q 5.5
 * and -16.35 north of it (a step of 2.5 m at the west corner), the north-east end at p 17.7, drawing in to 16.85 north
 * of q 4 (its returns fall from 17.6 at q 1 to 16.8 at q 5). The south corner is cut by a chamfer 3.4 m wide, where the
 * photograph's fitted camera puts its top corners (p -18.89, q -10.59 and p -16.34, q -12.89; the LiDAR's returns at
 * the parapet's height lie on it); the east corner by one of about 1.7 m (the returns there). The north corner is
 * drawn square: the returns over it are a tree's crown (54 to 58 m, uneven). In order round the plan. */
export const OUTLINE = [
  [-16.35, -12.85], [16.6, -12.85], [17.7, -11.6], [17.6, 1.0], [16.85, 4.0], [16.85, 13.15],
  [-16.35, 13.15], [-16.35, 5.5], [-18.85, 5.5], [-18.85, -10.6],
];

/** The roof (p50 51.13 m of the returns 4 m and more inside the faces) and the parapet's top (51.5 m: the highest
 * returns within 0.8 m of the faces, p50 51.42 to 51.49, p90 51.56 to 51.58), 0.3 m thick. */
export const ROOF = Y(51.13), PARAPET = { top: Y(51.5), thick: 0.3 };

/** The faces, estimated through the photograph's fitted camera (config's refs_note): the upper storey is a band of
 * concrete from its underside at 49.1 m (where the camera puts the band's lower edge on the chamfer and the south-east
 * face: 49.06 to 49.11 m) to the parapet's top; under it a flat soffit, and the ground storey set back behind it, its
 * glazing 1.85 m behind the south-east face (where the camera puts its head at the soffit: q -11.0) and, under the
 * south corner, 3.65 m behind the south-west end (p -15.2), a porch; elsewhere 1.85 m in, as no photograph shows.
 * Its floor and the deck before it at 45.3 m, at the camera's eye (the deck's edge on its horizon), as the LiDAR's
 * ground by the south-west end reaches 45.3 m at q -2 to 2. Columns 0.45 m
 * square under the band's edge, 0.55 m in: the two the photograph shows (p -15.15 on the south-east face, q -7.7 on
 * the south-west end), the rest on a grid of 6.5 m from them. A deck under the south corner and along the south-east
 * face, out to q -16.0, where the camera puts its railing's top 1 m over it (q -15.6 to -16.9 from p -18.2 to 2.0),
 * and a flight of 11 steps from the court (43.4 m) up to its west corner, its foot 1.7 m wide where the camera puts
 * it (p -21.35, q -17.93 to p -19.84, q -18.66), rising along the chamfer's normal. */
export const SOFFIT = Y(49.1), FLOOR = Y(45.3), COURT = Y(43.4);
export const STOREY = [[-15.2, -11.0], [15.85, -11.0], [15.85, 11.3], [-14.5, 11.3], [-14.5, 5.5], [-15.2, 5.5]];
export const COLUMNS = [
  [-15.15, -12.3], [-8.65, -12.3], [-2.15, -12.3], [4.35, -12.3], [10.85, -12.3],
  [17.15, -6.0], [17.15, 0.5], [16.3, 7.0],
  [15.5, 12.6], [9.0, 12.6], [2.5, 12.6], [-4.0, 12.6], [-10.5, 12.6], [-15.8, 9.0],
  [-18.3, 2.8], [-18.3, -2.5], [-18.3, -7.7],
];
export const DECK = {
  plan: [[-15.2, -11.0], [-15.2, -3.0], [-18.85, -3.0], [-18.85, -16.0], [3.0, -16.0], [3.0, -11.0]],
  rail: [[-18.0, -16.0], [3.0, -16.0], [3.0, -12.85]],
  stair: { foot: [-20.6, -18.3], dir: [0.67, 0.74], width: 1.7, run: 3.0, steps: 11 },
};

/** On the roof: a box at the west corner (p -13.9 to -9.8, q 9.6 to 13.0; 132 returns, p90 53.88 m) and a block
 * toward the east end (1,431 returns, p50 53.57, p90 53.77 m) along the south-east side from p 3 (q -11 to -7.5) and
 * from p -2 (q -7.5 to -4.5) to 16.6, and up to q 3 from p 8 (its returns on a 1 m grid). */
export const HIGH = [
  { plan: [[-13.9, 9.6], [-9.8, 9.6], [-9.8, 13.0], [-13.9, 13.0]], top: Y(53.88) },
  { plan: [[3.0, -11.0], [16.6, -11.0], [16.6, 3.0], [8.0, 3.0], [8.0, -4.5], [-2.0, -4.5], [-2.0, -7.5], [3.0, -7.5]],
    top: Y(53.77) },
];
