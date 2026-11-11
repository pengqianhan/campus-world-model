// Shared sizes, measured in the LINZ 2024 LiDAR (data/58-symonds-street_pts.npy: the returns in the crop box) in the
// view frame of config/58-symonds-street.json: x is -axis (south-east), y up from the config's ground, z is toStreet
// (south-west); the frame's centre at x = z = 0, the middle of the tower's points.
// Owned by the lead: read, do not edit.
// Measured 2026-11-11 (round 0): every height below is the LiDAR's elevation, and Y turns it into one above the
// config's ground, 50.65 m (the median ground in the outline's band; the door's ground replaces it at step 7).
//
// The sizes are given in the building's own frame, u along the tower's long faces toward the north-west (the frame's
// axis, so x = -u) and w toward the south-west, the street (z = w); `at` and `plan` turn them into the view frame. A
// side at the least u faces south-east, at the greatest u north-west, at the least w north-east and at the greatest w
// south-west.
//
// 58 Symonds Street, building 435: a tower of offices over a slope that falls from the north-west to the south-east,
// its floor slabs' bands 3.04 m apart up to the roof's edge at 80.15 m, an upper roof set in from the edge at 83.1 m,
// and on its street side a core to 89.2 m.
export const GROUND = 50.65;
export const at = (u, w) => [-u, w];
/** An elevation measured in the LiDAR, as a height above the config's ground. */
export const Y = (z) => z - GROUND;
export const plan = (corners) => corners.map(([u, w]) => at(u, w));

// The ground round the tower lies from about 42.4 m (the south-east side, p1 of its returns) to 54.5 m (the north-west
// side); the walls go down to FOOT.
export const FOOT = Y(42.0);

/** The tower: the outer edge of its floor slabs' bands (the LiDAR's returns on the faces to p0.5/p99.5: north-east
 * w -8.62, north-west u 13.34, south-east u -10.70; south-west w 8.7 where the core does not stand out), the slabs'
 * tops from the returns on the faces, 3.04 m apart (58.8, 61.83, 64.87, 67.93, 70.97, 74.01, 77.04), and the roof's
 * edge at 80.15 (p90 of the returns round the edge). */
export const TOWER = {
  u: [-10.7, 13.4],
  w: [-8.6, 8.7],
  edge: Y(80.15),
  slabs: [58.8, 61.83, 64.87, 67.93, 70.97, 74.01, 77.04].map(Y),
};

/** The upper roof, 2.2 to 2.4 m in from the edge (its returns' p0.5/p99.5: north-east w -6.25, north-west u 11.07,
 * south-east u -8.32, south-west w 7.8), at 83.1 m (p50 83.11 of 2,662 returns); a ledge at 80.16 m between it and the
 * edge. */
export const UPPER = { u: [-8.32, 11.07], w: [-6.25, 7.8], top: Y(83.1) };

/** On the street side, standing out from the south-west face: a low block by the south corner (u -10.97 to -8.54,
 * w 8.04 to 12.22, its roof at 61.83 m), a strip (u -8.54 to -3.53, w 7.73 to 12.53) to 84.14 m, and the core (u
 * -3.53 to 5.86, w 6.68 to 12.11; 482 returns over 87.5 m) to 89.16 m (p90). */
export const STREET = [
  { u: [-10.97, -8.54], w: [8.7, 12.22], top: Y(61.83) },
  { u: [-8.54, -3.53], w: [8.7, 12.53], top: Y(84.14) },
  { u: [-3.53, 5.86], w: [6.68, 12.11], top: Y(89.16) },
];
