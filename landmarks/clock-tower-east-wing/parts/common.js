// Shared sizes, measured in the LINZ 2024 LiDAR (data/clock-tower-east-wing_pts.npy, building 119's points)
// in the view frame of config/clock-tower-east-wing.json: x to the right as seen from the lawn and the car
// park on the south-west (south-east, toward Symonds Street), y up from the ground at the foot of the stair
// tower (40.0 m NZVD2016), z toward the lawn; the middle of the main range at x = z = 0. The walls follow
// building 119's floor outline in campus.json, taken into this frame. Owned by the lead: read, do not edit.
// Measured 2026-10-27 (baseline, round 0).
// How far the walls go below y = 0: the LiDAR ground under the back of the range falls to -0.86 m (z -3
// to -9), and rises to about +3 m under the link toward the Clock Tower; the car park in front is 0 to +0.1.
export const FOOT = -1.0;

export const MEASURED = {
  // The main range: two storeys of rock-faced stone under a red tile roof, hipped at both ends. Ridge
  // 9.2-9.6 m (p5-p95) along z 1.5 to 3.5; eaves about 7.3 m (8.0 m over the front wall between the
  // pavilions, 7.0 m at the back). Its front wall stands back between the pavilions (z 8.2).
  range: { x: [-19.9, 17.0], z: [-4.4, 8.2], eave: 7.3, ridge: 9.5, ridgeZ: 1.9, floor: 3.6 },
  // The two pavilions on the lawn side, each a gable toward the lawn: walls to 7.4 m at the corners, the
  // gable's apex 8.3-8.6 m, a low roof along z behind it (8.0-8.15 m on its ridge).
  pavilions: [
    { x: [-17.7, -7.4], z: [8.2, 13.05] },
    { x: [6.7, 17.0], z: [8.2, 13.05] },
  ],
  pavilion: { eave: 7.4, apex: 8.5, ridge: 8.1 },
  // The stair tower in the middle of the front: a plain block 0.8 m proud of the wall, flat-topped at
  // 10.3-10.4 m, its body running back into the range to about z 6.
  tower: { x: [-3.1, 2.3], z: [6.0, 9.0], top: 10.35 },
  // Two blocks at the back, flat-topped at 10.0-10.35 m, from the back wall's outline (z -6.7) into the
  // range to about z -1.5; between them a low roof at 3.1 m over the back wall's foot.
  backs: [
    { x: [-10.3, -5.0], z: [-6.7, -1.5] },
    { x: [4.6, 9.4], z: [-6.7, -1.5] },
  ],
  backTop: 10.2,
  leanTo: { x: [-5.0, 4.6], z: [-5.5, -4.4], top: 3.1 },
  // The link toward the Clock Tower (north-west, -x): one storey under trees, a flat roof at 6.5-6.6 m
  // where the LiDAR sees it (x -30 to -18), on ground that rises toward the tower. No photograph shows it.
  link: { x: [-33.0, -19.9], z: [-4.3, 1.1], top: 6.55 },
};
