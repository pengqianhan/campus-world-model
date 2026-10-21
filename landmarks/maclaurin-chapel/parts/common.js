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
  // walls): 3.0 m along each street face from the corner, six columns a face, from 0.5 m to 8.35 m at
  // the corner, each column 0.12 m lower outward; deep white frames 0.12 m wide, transoms 0.8-1.5 m apart.
  window: { width: 3.0, columns: 6, sill: 0.5, top: 8.35, step: 0.12, frame: 0.12, depth: 0.28, pane: [0.8, 1.5] },
  // A slender spire on the apex: 16 points within 0.5 m of the axis from 11.5 to 21.15 m. The
  // photographs show a square needle tapering to a point, and a small cross on its tip: two points at
  // 19.8-19.9 m (the tip), five at 21.0-21.15 m spread over 0.9 m (the cross).
  spire: { tip: 19.85, top: 21.1, base: 0.5, cross: 0.7 },
  // A bay against the chapel's far side (-x), 7.1-7.7 m high where the LiDAR sees it (x > -8.4); beyond,
  // a tree's crown hides it, and its end is the floor outline's (x -9.9). A dark timber door at its foot
  // on the street side, near its far end (the photographs).
  bay: { x: [-9.9, -5.9], z: [-3.5, 3.1], top: 7.5, door: [-9.4, -8.4, 2.2] },
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
  },
};
