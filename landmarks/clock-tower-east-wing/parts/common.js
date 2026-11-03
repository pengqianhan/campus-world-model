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
  // The main range: two storeys of rock-faced stone, from its west wall at x -17.8 (the floor outline; west
  // of it, from the back wall's corner at x -19.9, is the link) to x 17.0. Its red tile roof covers the
  // front of it: the ridge at 9.42 m (median of the points at z 2.75 to 3.25; 9.37-9.39 in other bands)
  // along z 3.0 from x -17 to 17 (the 90th percentile in each metre: 9.3-9.7), its slopes falling
  // about 0.45 m a metre to 7.2 m at the front wall (z 7.6 to 8.2, median 7.17) and 7.24 m at z -1.2, to
  // eaves at 7.0 m just beyond the walls; hipped only in the
  // last metre or so at each end (8.9 m at x -18). Behind it, over the back of the range (z -4.4 to -1.6), a
  // flat roof at 6.6-7.4 m (7.0). Its front wall stands back between the pavilions (z 8.2).
  range: { x: [-17.8, 17.0], z: [-4.4, 8.2], eave: 7.0, ridge: 9.42, ridgeZ: 3.0, back: -1.6, hip: 0.8, flat: 7.0, floor: 3.6 },
  // The two pavilions on the lawn side, each a gable toward the lawn: walls to 7.0-7.4 m at the sides, the
  // gable's apex 8.45-8.5 m (p90), a low roof along z behind it, its ridge at 7.84-7.9 m (median within
  // 0.3 m of the middle).
  pavilions: [
    { x: [-17.7, -7.4], z: [8.2, 13.05] },
    { x: [6.7, 17.0], z: [8.2, 13.05] },
  ],
  pavilion: { eave: 7.2, apex: 8.5, ridge: 7.9 },
  // The stair tower in the middle of the front: a plain block 0.8 m proud of the wall, flat-topped at
  // 10.3-10.4 m, its body running back into the range to about z 6.
  tower: { x: [-3.1, 2.3], z: [6.0, 9.0], top: 10.35 },
  // Two blocks at the back, from the back wall's outline (z -6.7) into the range to about z -1.5,
  // flat-topped at 10.03 m (median; 10.3-10.5 m at their p95, the parapets); between them a low roof at
  // 4.06 m (median) over the back wall's foot.
  backs: [
    { x: [-10.3, -5.0], z: [-6.7, -1.5] },
    { x: [4.6, 9.4], z: [-6.7, -1.5] },
  ],
  backTop: 10.05,
  leanTo: { x: [-5.0, 4.6], z: [-5.5, -4.4], top: 4.05 },
  // The link toward the Clock Tower (north-west, -x): one storey under trees, a flat roof at 6.5-6.6 m
  // where the LiDAR sees it clear of the trees (x -30 to -24 and -21 to -18; between, crowns classed as
  // building stand over it to 13 m), on ground that rises toward the tower; it runs east to the range's
  // west wall (x -17.8), where the LiDAR reads 6.6 m too. No photograph shows it. The campus map has it
  // on floor "1" (level 10), whose block starts at the map's storey height, 3.6 m (`under`: nothing
  // measures the underside); on floor "G" it has under it only a "Non Usable Area" under its east third
  // (`linkGround`, campus.json's ring taken into this frame), so the walk map, made from ground floors,
  // leaves the rest open, and OpenStreetMap has a footway through a building passage there (way
  // 918249408, x -27.3 to -28.2). The link stands from `under`, with `linkGround` down to the ground, as
  // the map's blocks drew them. `under` was the map's storey height, 3.6 m, until the site stood the wing
  // on the ground it shares with the Clock Tower (src/scene/landmarks.ts, standHeights, 2026-11-03): there
  // the map's ground under the link's open parts is at 2.64-2.96 m in this frame (as the LiDAR's along its
  // back edge, 2.7-2.9), and 3.6 m would leave 0.64-0.96 m under it. It is now as high as a walker needs
  // (src/scene/walkers.ts and CampusScene's camera behind it): the figure is 1.75 m tall on 0.25 m of
  // ground paint, and the camera behind it, 7.5 m back and 16 deg up, is 3.82 m over its ground and 7.21 m
  // behind it, so that across the link's 5.4 m its line to the walker's head passes the near edge 3.36 m
  // over the ground; 3.36 m over the highest ground under it is 6.32, and `under` is 6.35, 0.05 m below the
  // roof's slab. Nothing measures it (estimated).
  link: { x: [-33.0, -17.8], z: [-4.3, 1.1], top: 6.55, under: 6.35 },
  linkGround: { x: [-24.82, -19.8], z: [-4.3, 0.83] },
};
