// Shared sizes, measured in the LINZ 2024 LiDAR (data/58-symonds-street_pts.npy: the returns in the crop box) in the
// view frame of config/58-symonds-street.json: x is -axis (south-east), y up from the config's ground, z is toStreet
// (south-west); the frame's centre at x = z = 0, the middle of the tower's points.
// Owned by the lead: read, do not edit.
// Measured 2026-11-11 (round 0): every height below is the LiDAR's elevation, and Y turns it into one above the
// config's ground, 53.03 m, the LiDAR's at the door (step 7; 50.65 m, the median ground in the outline's band, before).
//
// The sizes are given in the building's own frame, u along the tower's long faces toward the north-west (the frame's
// axis, so x = -u) and w toward the south-west, the street (z = w); `at` and `plan` turn them into the view frame. A
// side at the least u faces south-east, at the greatest u north-west, at the least w north-east and at the greatest w
// south-west.
//
// 58 Symonds Street, building 435: a tower of offices over a slope that falls from the north-west to the south-east,
// its eight floor slabs' bands about 3.05 m apart from 55.7 m up to the roof's edge at 80.15 m, an upper roof set in
// from the edge at 83.1 m, and on its street side a core to 89.2 m.
export const GROUND = 53.03;
export const at = (u, w) => [-u, w];
/** An elevation measured in the LiDAR, as a height above the config's ground. */
export const Y = (z) => z - GROUND;
export const plan = (corners) => corners.map(([u, w]) => at(u, w));

// The ground within 5 m of the tower's walls (the LiDAR's class 2) lies from about 45.8 m (p1; p50 47.2) along the
// south-east face to 53.4 m on the platform before the north-east face, and rises to 54.4 to 55.5 m 6 to 10 m off the
// north-west face; it falls to about 42.4 m 10 to 12 m south-east of the tower. The walls go down to FOOT.
export const FOOT = Y(42.0);

/** The tower: the outer edge of its floor slabs' bands (the LiDAR's returns on the faces to p0.5/p99.5: north-east w
 * -8.62, north-west u 13.34, south-east u -10.70; south-west w 8.7 where the core does not stand out), the slabs' tops
 * from the returns on the faces, about 3.05 m apart (55.7, 58.8, 61.83, 64.87, 67.93, 70.97, 74.01, 77.04: the lowest,
 * at the foot of the storeys of windows over the dark ground storey, from the 228 returns at 55.0 to 56.2 m in the
 * bands' outer metre on the north-east, north-west and south-east faces (265 in their outer 1.2 m), p50 55.70), and
 * the roof's edge at 80.15 (p90 of the returns round the edge). */
export const TOWER = {
  u: [-10.7, 13.4],
  w: [-8.6, 8.7],
  edge: Y(80.15),
  slabs: [55.7, 58.8, 61.83, 64.87, 67.93, 70.97, 74.01, 77.04].map(Y),
};

/** The upper roof, 2.2 to 2.4 m in from the edge (its returns' p0.5/p99.5: north-east w -6.25, north-west u 11.07,
 * south-east u -8.32, south-west w 7.8), at 83.1 m (p50 83.11 of 2,662 returns); a ledge at 80.16 m between it and the
 * edge. */
export const UPPER = { u: [-8.32, 11.07], w: [-6.25, 7.8], top: Y(83.1) };

/** On the street side, standing out from the south-west face: a low block by the south corner (u -10.97 to -8.54,
 * w 8.04 to 12.22, its roof at 61.83 m), a strip (u -8.54 to -3.53, w 7.73 to 12.53) to 83.22 m (p50 of its 139
 * returns over 80 m; a few to 84.1), and beside the core on its north-west a strip (u 5.86 to 6.91, w 8.73 to 11.94;
 * p50 83.22 of 29 returns) to 83.22 m. Both strips run in to the upper roof's edge at w 7.8: the LiDAR's roof runs on
 * from the upper roof to them at 83.2 to 83.7 m with no step down (u -8.3 to -3.6, w 7.8 to 8.7: 42 returns, p50
 * 83.58). */
export const STREET = [
  { u: [-10.97, -8.54], w: [8.7, 12.22], top: Y(61.83) },
  { u: [-8.54, -3.53], w: [7.8, 12.53], top: Y(83.22) },
  { u: [5.86, 6.91], w: [7.8, 11.94], top: Y(83.22) },
];

/** The core (u -3.53 to 5.86, w 6.68 to 12.11; 482 returns over 87.5 m), its roof one slope falling to the street:
 * the returns' p50 in 0.5 m strips across it run from 89.23 m at w 7.0 to 87.75 m at w 12.0, 0.3 m a metre. */
export const CORE = { u: [-3.53, 5.86], w: [6.68, 12.11], high: Y(89.25), at: 7.0, fall: 0.3 };

/** Plant on the upper roof, from the LiDAR's returns over 84.3 m in 1 m cells: u -4 to 0, w 5.0 to 6.6 at 84.95 m
 * (p50 of its 29 returns, 85.3 to 86.0 at its north-west end); u 7 to 9, w 0 to 2.5 at 85.2 m; u 9 to 10, w -4 to
 * -2.5 at 84.5 m. */
export const PLANT = [
  { u: [-4.0, 0.0], w: [5.0, 6.6], top: Y(84.95) },
  { u: [7.0, 9.0], w: [0.0, 2.5], top: Y(85.2) },
  { u: [9.0, 10.0], w: [-4.0, -2.5], top: Y(84.5) },
];

/** The faces (step 5), all but the bands' tops and the outer edge estimated through the photograph's camera: each slab's
 * band 0.5 m deep from its top (at the near corner 19 to 20 px of the photograph, where 0.5 m is 19 to 20 px and
 * 0.7 m 27 to 28); the window wall FACE.set behind the bands' outer edge (the LiDAR's returns on the
 * slabs' tops run 1.2 m in from it before the band above shades them); a sill panel 0.9 m high on each slab; mullions
 * FACE.bay apart; under each band FACE.slats slats of louvres, FACE.slatGap apart, FACE.louvre in from the outer edge;
 * a column FACE.column[1] square at each corner, FACE.column[0] in; between them piers as wide, from FACE.column[0] in
 * to the window wall, on a grid of 6.6 m from the north corner's column (the photograph's piers on the north-east
 * face near u 6.0, -0.8 and -7.0, on the north-west face near w -1.5 and, behind the tree, near 5; the faces it does
 * not see on the same grid); the ground storey FACE.ground in, under the lowest band. */
export const FACE = {
  band: 0.5,
  set: 1.2,
  sill: 0.9,
  bay: 1.6,
  slats: 5,
  slatGap: 0.14,
  louvre: [0.15, 0.4],
  column: [0.25, 0.9],
  piers: { u: [6.1, -0.5, -7.1], w: [-1.3, 5.3] },
  ground: 1.6,
};
