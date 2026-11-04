// Shared sizes, measured in the LINZ 2024 LiDAR (data/kate-edger-information-commons_pts.npy: building 315's
// returns more than 3 m above the frame's ground and within 1.5 m of building.outline) in the view frame of
// config/kate-edger-information-commons.json: x is -axis (south-west, along the two long ranges), y up from
// the frame's ground (41.5 m NZVD2016, the median ground in the crop box: provisional until `door` is set),
// z is toStreet (north-west, toward the Student Commons); the frame's centre at x = z = 0. Owned by the lead:
// read, do not edit. Measured 2026-11-04 (baseline, round 0).
//
// How: the 90th percentile of the returns in each 0.5 m cell; each roof level's plan from the edges of its cells,
// column by column (2 m of x), simplified to a few corners; its top the median of its cells. Round 0 draws each
// level as a flat-topped block: the roofs' falls, parapets and plant are left for the rounds.

// The ground (the LiDAR's ground returns, relative to 41.5) round the building: p1 -3.60, p99 +4.12. The
// sunken court at the north-east end, between the two ranges' ends, at -3.5 (p5-p95 -3.53 to -3.05); Alfred
// Street's footpath beyond it near -0.4; the north-west side +0.2 to +4.1, the south-west end +0.5 to +4.1.
// The walls go down to FOOT.
export const FOOT = -4.5;

export const MEASURED = {
  // The south-east range: one flat roof at 15.93 m (the median of its cells; every 2 m column's median 15.53-16.0).
  // Its north-east face at x -31.0 from z -21.8 to -10.5, then set back to x -28.0 up to the atrium (z -4.0;
  // a lower roof near 10 m in the corner, x -30 to -27, z -7.5 to -5, not drawn yet); its face to the south-east
  // not square to the frame: a straight line from (-31.0, -21.8) to (28.0, -27.0) (its cells' edge to 0.5 m in
  // every column); its south-west end at x 32.0 (z below -12.5) and 33.5; its edge on the atrium from the edges of
  // its cells, column by column.
  southeast: {
    plan: [[-31.0, -21.8], [-31.0, -10.5], [-28.0, -10.5], [-28.0, -4.0], [-10.0, -1.0], [2.0, 0.5], [10.0, 2.5], [30.0, 2.0],
      [33.5, 0.5], [33.5, -11.5], [32.0, -12.5], [32.0, -26.3], [28.0, -27.0]],
    top: 15.93,
  },
  // Over it, the long upper strip: flat at 20.10 m (each column's median 20.06-20.15), its north-east end at
  // x -25.45 (z -12.6 to -6.3), widening a little to z -14.5 to -7.5 at x 4.
  strip: { plan: [[-25.45, -12.6], [-25.45, -6.3], [4.0, -7.5], [4.0, -14.5]], top: 20.10 },
  // and the upper block south-west of it, flat at 19.25 m (each column's median 19.17-19.43), x 4 to 22.5,
  // z -20.5 to -2.0 at x 4 and -22.0 to -3.0 at x 22.5.
  block: { plan: [[3.9, -20.5], [3.9, -2.0], [22.5, -3.0], [22.5, -22.0]], top: 19.25 },
  // Beyond the block's south-west face, plant or a roof of several heights, 18.6-20.3 m (x 22.5 to 29.5, z -16.5
  // to -9): one block at 19.6 m in round 0.
  plant: { plan: [[22.4, -16.5], [22.4, -9.0], [29.5, -9.5], [29.5, -16.0]], top: 19.6 },
  // The north-west range: one flat roof at 15.80 m (every column's median 15.65-15.89 from x -30 to 30; the
  // strip at z 17 to 25 between x -12 and 2 stands at 16.1-16.6, the same roof in round 0). Its edge on the
  // atrium from the edges of its cells, column by column; its face to the north-west at z 18.0-18.5 north-east
  // of x -12 and at 23-25 south-west of it; its south-west end at x 30 (z 9.0 to 14.5) and x 22 beyond z 15.
  northwest: {
    plan: [[-30.0, 4.0], [-18.0, 1.0], [-12.0, 1.5], [4.0, 4.0], [16.0, 6.75], [30.0, 9.0], [30.0, 14.5], [22.0, 15.0],
      [22.0, 23.0], [8.0, 24.0], [-12.0, 25.0], [-12.0, 18.0], [-30.0, 18.5]],
    top: 15.80,
  },
  // Its north-east end, higher: 16.6 m (x -34.2 to -30, z 4.5 to 17; the medians of its two columns 16.57, 16.58);
  // its north-east face at x -34.2.
  northeast: { plan: [[-34.2, 4.8], [-34.2, 17.0], [-29.9, 18.5], [-29.9, 4.0]], top: 16.6 },
  // Beyond that face, the end that stands out over the court (x -40 to -34.2, z 7 to 17.5): its top 14.2 m (the
  // medians of its columns 14.13-14.21). How far down it reaches, the LiDAR from above cannot say: round 0 draws
  // it down to FOOT.
  overhang: { plan: [[-40.0, 7.0], [-40.0, 17.0], [-34.1, 17.0], [-34.1, 5.5]], top: 14.2 },
  // On the north-west range, the raised part: flat at 19.0 m (each column's median 18.99-19.35), x -18 to 4,
  // z 10.5 to 17.0 at x -18 and 9.25 to 16.5 at x 4.
  raised: { plan: [[-18.0, 10.5], [-18.0, 17.0], [4.0, 16.5], [4.0, 9.25]], top: 19.0 },
  // The lower wing at the north-west range's south-west corner: flat at 11.7 m (its columns' medians 11.68-11.81),
  // x 22 to 28, z 14.5 to 23. Where a part meets another, its plan runs 0.1-0.3 m into the other's, so that no two
  // walls stand face to face with a slit between them, or in one plane.
  corner: { plan: [[21.9, 14.8], [21.9, 23.0], [28.0, 23.0], [28.0, 14.3]], top: 11.7 },
  // The lower wing on the north-west range's face to the north-west: about 9.8 m (its columns' medians 9.16-10.32),
  // x -17 to -10, out to z 31.5.
  wing: { plan: [[-17.0, 17.8], [-17.0, 27.0], [-14.5, 31.5], [-10.0, 31.5], [-10.0, 24.7], [-11.9, 24.7], [-11.9, 17.8]], top: 9.8 },
  // The atrium between the ranges, from the court at the north-east end to x 18: few returns (glass), the most of
  // them in a line along it at 13.3-13.7 m. Round 0 draws a flat glazed roof at 13.5 m from range to range (its
  // edges 0.1 m into both), and a glazed end at x -27.8 (estimated).
  atrium: {
    plan: [[-27.8, -4.1], [-10.0, -1.1], [2.0, 0.4], [10.0, 2.4], [18.0, 2.1], [18.0, 7.17], [16.0, 6.85], [4.0, 4.1],
      [-12.0, 1.6], [-18.0, 1.1], [-27.8, 3.55]],
    top: 13.5,
  },
  // Between the ranges south-west of the atrium, a low roof at 4.2 m (its columns' medians 4.15-4.21), x 18 to 28.
  low: { plan: [[18.0, 1.9], [18.0, 7.2], [28.0, 8.8], [28.0, 1.9]], top: 4.2 },
};
