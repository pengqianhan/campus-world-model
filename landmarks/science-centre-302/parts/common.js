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
    // the main roof (the returns over x -13 to 13, z -12 to 9: p50 49.87, p90 50.30)
    roof: 50.2,
    // the parapets along the south-west face (x 17.5-21: p90 51.3, p99 51.6) and the north-east face (x -20 to -16.5:
    // p90 51.73, p99 51.84), from z -19.5 to 16.8, where the lower roofs begin
    parapet: { sw: 51.5, ne: 51.7, width: 0.6, z: [-19.5, 16.8] },
  },
  // The lower roofs at 46.7 m (p10-p90 46.64-47.98 over the south-east strip, 46.64-46.74 over the north-west strip,
  // 46.05-46.99 over the annex): along the south-east end from the face to z -19.5, south-west of x 6.5 the strip
  // rising to the main roof (its returns 46.7-49.9); along the north-west end from z 16.8 to the face, north-east of
  // x 9; and the annex north of the tower (x -17.2 to -9.3, to z 32).
  low: {
    roof: 46.7,
    se: [[6.5, -23.456], [6.5, -19.5], [-19.539, -19.5], [-19.68, -21.55]],
    nw: [[9.0, 16.8], [9.0, 20.83], [-16.64, 22.70], [-17.045, 16.8]],
    annex: [[-17.2, 21.0], [-9.3, 20.5], [-9.6, 31.5], [-16.6, 32.0]],
  },
  // The lower block before the tower's south-west face: the hull of its returns at its top (69.5-72 m elevation:
  // its roof p50 25.48 above the frame's ground, its edge p90 26.04), its inner side inside the tower.
  block: {
    plan: [[34.15, -26.8], [22.69, 21.56], [18.6, 21.78], [18.0, 20.7], [18.05, -25.7], [18.6, -26.0], [33.2, -26.97]],
    top: 25.5,
  },
};
