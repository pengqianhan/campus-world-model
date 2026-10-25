// Shared sizes, measured in the LINZ 2024 LiDAR (data/maclaurin-chapel_pts.npy, building 107's points) in
// the view frame of config/maclaurin-chapel.json: x to the right as seen from Princes Street on the
// west-north-west, y up from the ground at the foot of the entrance steps (43.5 m NZVD2016), z toward
// the street; the apex of the chapel's roof at x = z = 0. Where the LiDAR does not reach (under trees),
// the walls follow building 107's floor outline in campus.json, taken into this frame. Owned by the
// lead: read, do not edit. Measured 2026-10-22.
// How far the walls go below y = 0: the LiDAR ground under the footprint falls to -0.62 m at the back
// (z -7 to -8), and the site's drawn ground (the 8 m DEM) lies -0.18 to +0.06 m from the door's under it.
export const FOOT = -0.7;

export const MEASURED = {
  // The chapel: a regular hexagon in plan, its corners at 30 + 60k deg from +x toward +z (fitted to the
  // roof's edge: corner at 29.1 deg, rms 0.21 m; at 30 deg, rms 0.22 m; a circle or an octagon fits
  // worse), so a flat side faces the hall (+x) and one the far end (-x), and a corner points at the
  // street (+z). The floor outline is the same hexagon. Distances are apothems (centre to mid-side).
  chapel: {
    wall: 6.0,        // the walls: the building points under the eaves stand 6.0-6.25 m out
    roof: 6.1,        // the roof's edge (fitted circumradius 7.04 m)
    eave: 8.95,       // the roof's edge height, level all round (8.9-9.0 at corners and mid-sides)
    apex: 10.55,      // a low hexagonal pyramid, about 15 deg: 0.26 m up a metre in toward the apex
  },
  // The great window wrapping the street corner (the photographs; sizes from them against the LiDAR's
  // walls): from the corner 3.9 m along the left street face (k = 2, facing -x+z) in eight columns and
  // 2.75 m along the right one (k = 1) in six (dsLb's and 34Yw's upper views: the window reaches further
  // along the left face), from 0.5 m to 8.8 m at the corner (just under the eaves), each column 0.12 m
  // lower outward; deep white frames 0.12 m wide, transoms 0.8-1.5 m apart.
  window: { width: [2.75, 3.9], columns: [6, 8], sill: 0.5, top: 8.8, step: 0.12, frame: 0.12, depth: 0.28, pane: [0.8, 1.5] },
  // The needle is about 0.5 m square at the roof and 0.2 m under its short pointed cap (34Yw's upper view).
  spire: { tip: 19.85, top: 21.1, base: 0.5, neck: 0.2, cap: 0.35, cross: 0.7 },
  // A bay against the chapel's far side (-x), its end the floor outline's (x -9.9). Its roof is a low
  // gable along x (round 1): across z the lowest points in each half metre run 7.04-7.2 m at both eaves
  // and 7.7-7.8 m at z -0.5 to 0, both where the LiDAR classes them building (x > -8.4) and, the same,
  // where a tree's crown over it has them classed vegetation (x < -8.4). A dark timber door at its foot
  // on the street side, near its far end (the photographs), is on the room's face toward the street (below).
  bay: { x: [-9.9, -5.9], z: [-3.5, 3.1], eave: 7.1, ridge: 7.8, ridgeZ: -0.2 },
  // The small room beyond the bay, and its link to the bay's street corner: no photograph shows it and
  // the LiDAR classes it vegetation (a tree stands over it), but under the crown it finds a level surface
  // at 3.29-3.53 m (p5-p95, median 3.40; 67 points) over the room's floor outline and nowhere else. The
  // walls stand on building 107's floor outline (campus.json) taken into this frame, straight between
  // its points: rounded in plan, as the outline is.
  room: { outline: [[-7.89, 3.05], [-8.36, 4.8], [-9.84, 5.72], [-11.61, 5.16], [-12.38, 3.52], [-11.82, 1.75], [-9.99, 0.91]], top: 3.4,
    door: { face: [[-8.36, 4.8], [-9.84, 5.72]], width: 1.0, height: 2.2 } },
  // The hall behind the chapel (+x), its long axis along x. Its two end rooms and the walk-ways along its
  // middle have one flat roof at 3.37 m (3.25 m over the far end); the middle room's walls rise to a very
  // low gable (eaves 4.55 m on both sides, ridge 5.0 m along z = 0.4). The flat roof reaches z -7.3 and
  // 8.3 along the middle, 2.2-2.4 m beyond its walls (the floor outline's), over open walk-ways: ground
  // points under it. A tree's crown over the far end (x 23-29, 9-19 m up) is classed as building.
  hall: {
    top: 3.37,
    farTop: 3.25,
    nearEnd: { x: [5.9, 9.0], z: [-7.4, 8.2] },
    farEnd: { x: [22.3, 28.3], z: [-7.2, 8.7] },
    middle: { x: [9.0, 22.3], z: [-5.1, 5.9] },
    walks: { z: [[-7.3, -5.1], [5.9, 8.3]] },
    raised: { x: [8.8, 22.6], z: [-5.3, 6.1], eave: 4.55, ridge: 5.0, ridgeZ: 0.4 },
    // the entrance (the photographs, and the LiDAR's ground under the roof's front metre, 0.16-0.30 m,
    // rising from 0.02 m at the door): its glazed screen at z 7.2, a porch floor 0.3 m up, three steps
    porch: { z: 7.2, floor: 0.3, steps: 3, tread: 0.4 },
  },
};
