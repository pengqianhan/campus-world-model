// Shared sizes, measured in the LINZ 2024 LiDAR (data/general-library_pts.npy, building 109's points) in
// the view frame of config/general-library.json: x to the right as seen from Alfred Street on the
// south-west (toward the south-east end), y up from the ground at the main entrance in the middle of
// the south-east end (41.5 m NZVD2016), z toward Alfred Street; the tower slab's roof centre at
// x = z = 0. Owned by the lead: read, do not edit. Measured 2026-10-22.
//
// The ground falls about 5 m across the site: Alfred Street in front of the podium is 2.9-3.2 m above
// y = 0 and in front of the slab 1.2-2.2 m, the north-west end on Princes Street's side 2.5-4.1 m, the
// back 0.4-1.3 m, and the north-east corner -0.9 m. The walls go down to FOOT everywhere.
export const FOOT = -1.5;

/** The slab and its core are turned 1.9 deg from the podium (the frame's axis is the podium's walls):
 * a point (u, w) of the slab's own frame is at x = u cos a + w sin a, z = -u sin a + w cos a. */
export const SLAB_TURN = (1.9 * Math.PI) / 180;

export const MEASURED = {
  // The tower slab, in its own frame (u along it, w toward Alfred Street): the roof's edges (min-area
  // rectangle of its roof points, 0.3/99.7 percentiles), the roof at 30.1 (27.5-27.8 + 2.5 over the
  // first ground; p50 30.07). The right half (u 9.3 to 28) has a raised middle (w -6.5 to 3.1) at 31.6.
  // Floors are 3.5 m apart: the LiDAR's horizontal lines on the street face (sills and spandrels) are at
  // 12.0, 15.5, 19.0, 22.5, 26.0.
  slab: { u: [-31.3, 30.0], w: [-9.8, 8.3], roof: 30.1, raised: { u: [9.3, 28.0], w: [-6.5, 3.1], top: 31.6 },
    floors: [5.0, 8.5, 12.0, 15.5, 19.0, 22.5, 26.0], spandrel: 1.1 },
  // The core across the slab's middle: its roof at 36.05 (p50 of 2,410 points), u -8.2 to 7.8, from the
  // slab's back face to 1.2 m in front of its street face; the stair tower in front of it (u -5.9 to 5.8,
  // to w 12.75), its top 31.3-32.0; the plant on the core's roof to 38.8-39.8.
  core: { u: [-8.2, 7.8], w: [-8.6, 9.5], roof: 36.05 },
  stair: { u: [-5.9, 5.8], w: [9.5, 12.75], top: 32.0 },
  plant: { u: [-4.7, 2.2], w: [-2.7, 5.9], top: 38.8 },
  // The podium, aligned with the frame: its roof at 12.96 (p50) over the front-left block and the main
  // body, 12.35 over the back wing, 12.1 over the low block at the back right.
  podium: {
    main: { x: [-46.3, -3.8], z: [-21.2, 21.3], top: 12.96 },
    middle: { x: [-3.8, 16.0], z: [-21.2, -9.0], top: 12.96 },
    back: { x: [-12.5, 16.0], z: [-36.0, -21.2], top: 12.35 },
    low: { x: [16.0, 29.4], z: [-24.5, -9.0], top: 12.1 },
  },
  // The ground (LiDAR class 2, p50) along each face, for the plinths and the doors.
  ground: { front: 3.0, frontRight: 1.8, seEnd: 0.0, back: 1.1, nwEnd: 2.6, neCorner: -0.9 },
};
