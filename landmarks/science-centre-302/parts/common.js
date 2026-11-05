// Shared sizes, measured in the LINZ 2024 LiDAR (data/science-centre-302_pts.npy: the building returns, class 6, in
// the crop box) in the view frame of config/science-centre-302.json: x is -axis (south-west, toward Symonds Street),
// y up from the frame's ground (45.0 m NZVD2016, the median ground in the crop box; to be the LiDAR's ground at the
// config's door at step 7), z is toStreet (north-west); the frame's centre at x = z = 0. Owned by the lead: read, do
// not edit. Measured 2026-11-06 (baseline, round 0).
//
// How: the 90th percentile of the returns in each 1 m cell (the roofs' heights and where they step), the median
// and percentiles of the returns over each roof, and the convex hulls of the returns above 45 m (the tower) and at
// 69.5-72 m elevation (the lower block's top). The building is a tower, a rectangle turned about 4 degrees from the
// frame, its main roof at 50.2 m with parapets along its south-west and north-east faces, lower roofs at 46.7 m in
// strips along its south-east and north-west ends and over a small annex north of it; and, before its south-west
// face, a lower block with a flat top at 25.5 m whose outer face leans away from the tower's: 15 m out at its south
// end, at the tower at its west end.

// The ground (the LiDAR's ground returns, relative to 45.0) round the building: +0.2 to +1.4 along the south-east
// face, about 0 along the north-east, -2.8 to -4.1 along the north-west, and before the south-west face, where
// Symonds Street falls, -5.1 to +1.1 (p5 of the crop box -5.3). The walls go down to FOOT.
export const FOOT = -6.5;

export const MEASURED = {
  // The tower: its four corners, from the hull of the returns above 45 m (south, west and east; the north corner
  // where its north-west and north-east faces would meet, square with the other three, the hull's north point being
  // the annex's). The south-west face 44.35 m long, the south-east face 38.8 m, both 3.9-4.2 degrees off the frame.
  tower: {
    plan: [[19.05, -24.37], [22.09, 19.88], [-16.64, 22.70], [-19.68, -21.55]],
    // The faces in 1 m strips (the outermost returns, p1 or p99) lie within 0.5 m of these lines but the north-east
    // face's middle, 0.6-0.9 m further out from z -18 to -9 (round 1).
    // The main roof, from z -19.75 to 16 (round 1, the p90 of each 1 m cell; its ends step: north-east of x -4.5
    // the lower roof runs on to z -18.6, the cells at z -19 46.7-47.2; north-east of x 7 the main roof runs on to
    // z 16.8, the cells at z 16 50.8 there and 46.7-47.9 south-west of it): 50.1 in its middle (z -2 to 6),
    // rising to 50.8 toward both ends, drawn flat between; its parapets: along the south-west face, 1.6 m wide (the
    // cells from x 19 to the face, 51.5), and along the north-east face a raised strip 3.5 m wide (the cells from the
    // face to x -15.5: 51.2-51.8).
    roof: 50.45,
    parapet: { sw: 51.5, ne: 51.35, width: [1.6, 3.5] },
    ends: { se: [-19.75, -18.6, -4.5], nw: [16.0, 16.8, 7.0] },
    // Across the main roof from z -6.8 to 4.6 a band (round 1): three ramps, each rising south-west from 46.9 to
    // 50.6 m (the cells along x: 46.6-47.3 at x -13, -6 and 0, rising 0.6-0.8 a metre to 50.5-50.7 at x -7, -1 and
    // 6), and south-west of them a court at the lower roofs' height (x 7 to 11: 46.7) to x 12.
    band: { z: [-6.8, 4.6], ramps: [[-13, -6.5], [-6.5, -0.5], [-0.5, 6.5]], low: 46.9, high: 50.6, x: [-13, 12] },
    // Plant on the main roof (round 1: the 1 m cells above 52.5 m, 52.9-54.0 m; to 53.2-53.4).
    plant: [
      { x: [-8, -1], z: [-15, -13], top: 53.3 }, { x: [3, 13], z: [-16, -14], top: 53.4 },
      { x: [-8, 0], z: [11.5, 14], top: 53.2 }, { x: [4, 14], z: [11, 13], top: 53.4 },
    ],
  },
  // The lower roofs at 46.7 m (p10-p90 46.64-47.98 over the south-east strip, 46.64-46.74 over the north-west strip,
  // 46.05-46.99 over the annex): along the south-east end, from the face to z -19.75, north-east of x 9.5; along the
  // north-west end, from z 16.8 to the face, north-east of x 13.5; and the annex north of the tower (x -17.2 to -9.3,
  // to z 32). South-west of x 9.5 and 13.5 each strip rises in a ramp to the south-west face (round 1: the cells 47.3
  // at x 10 to 51.3-51.5 at x 18-19; 47.9 at x 14 to 51.5 at x 20). Along the south-east face from x -14 to 9 and
  // the north-west face from x -9 to 13, an upstand 1.2 m wide at 48.0 (the cells next to the faces: 47.9-48.1).
  low: {
    roof: 46.7,
    se: { x: 9.5, ramp: [47.3, 51.3], upstand: [-14, 9] },
    nw: { x: 13.5, ramp: [47.9, 51.5], upstand: [-9, 13] },
    upstand: { top: 48.0, width: 1.2 },
    annex: [[-17.2, 21.0], [-9.3, 20.5], [-9.6, 31.5], [-16.6, 32.0]],
  },
  // The lower block before the tower's south-west face: the hull of its returns at its top (69.5-72 m elevation:
  // its roof p50 25.48 above the frame's ground, its edge p90 26.04), its inner side inside the tower.
  block: {
    plan: [[34.15, -26.8], [22.69, 21.56], [18.6, 21.78], [18.0, 20.7], [18.05, -25.7], [18.6, -26.0], [33.2, -26.97]],
    top: 25.5,
  },
};
