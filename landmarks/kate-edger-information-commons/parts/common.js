// Shared sizes, measured in the LINZ 2024 LiDAR (data/kate-edger-information-commons_pts.npy: building 315's
// returns more than 3 m above the frame's ground and within 1.5 m of building.outline) in the view frame of
// config/kate-edger-information-commons.json: x is -axis (south-west, along the two long ranges), y up from
// the frame's ground (41.5 m NZVD2016, the median ground in the crop box: provisional until `door` is set),
// z is toStreet (north-west, toward the Student Commons); the frame's centre at x = z = 0. Owned by the lead:
// read, do not edit. Measured 2026-11-04 (baseline, round 0; round 1 the same day).
//
// How: the 90th percentile of the returns in each 0.5 m cell; each roof level's plan from the edges of its cells,
// column by column (2 m of x), simplified to a few corners; its top the median of its cells. Round 0 draws each
// level as a flat-topped block: the roofs' falls, parapets and plant are left for the rounds. Round 1 reads the
// north-east end again from the highest and lowest return in each 1 m cell (the prow, the north-east end's face,
// the canopy) and the atrium from its returns by 2 m of x, and measures the faces seen from Alfred Street in the
// photograph (`faces`).

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
  // Its north-east end, higher: 16.6 m (the medians of its two columns 16.57, 16.58); its north-east face, from
  // the edges of its 1 m cells (round 1), at x -35.2 up to z 8.5 and then on a slant to (-31.2, 17.5).
  northeast: { plan: [[-35.2, 4.6], [-35.2, 8.5], [-31.2, 17.5], [-29.9, 18.5], [-29.9, 4.0]], top: 16.6 },
  // Beyond that face, the end that stands out over the court, from the edges of its 1 m cells (round 1): to x -41.8
  // at its tip (z 7.6 to 12.5), back to x -40 on its north-west side, which is at z 19.5; its back inside the
  // north-east end's face. Its rim 12.8 m (the cells round its edge 12.6-13.0); within the rim, returns both at
  // 11.6-12.0 and at 14.1-14.5 m in every cell, which with the 2023 aerial's dark gridded glass there reads as a
  // glazed roof light (14.2 m: `light`) over a floor the LiDAR sees through it. Its south-east side at z 5.8-6.2
  // (6.0 drawn). Its underside the LiDAR cannot see: in the photograph (through the fitted camera, cast onto its
  // north-east face) the prow's lower edge falls in a curve from its rim at z 7.2 to 5.1 m at z 9.1, where it leaves
  // the picture, and the court, the entrance and the building behind show under it, so nothing is drawn there. The
  // camera, 5-15 m off at that edge, is out by about 1 m sideways (the prow's tip and rim fall about 25 px left of
  // the photograph's), so the curve is moved 1 m south-east, onto the LiDAR's rim: the underside drawn sloping from
  // 12.4 m at the south-east side (z 6.0) to 5.1 m at z 8.1 (`slope`), and level at 5.1 m beyond (estimated).
  overhang: {
    plan: [[-41.8, 7.6], [-41.8, 12.5], [-40.5, 14.5], [-39.8, 19.5], [-30.6, 19.5], [-30.6, 17.8], [-35.0, 8.3],
      [-35.0, 6.0], [-41.0, 6.0]],
    top: 12.8,
    under: 5.1,
    slope: { z0: 6.0, y0: 12.4, z1: 8.1 },
    light: { plan: [[-39.5, 8.0], [-39.5, 17.0], [-34.5, 17.0], [-34.5, 9.4]], top: 14.2 },
  },
  // Under the tip, a glazed canopy over the entrance from the court: returns at 3.0-3.5 m (x -42.5 to -39.5, z 8.5
  // to 16), its top 3.3 m; the photograph shows it as glass in white frames. Drawn as a flat pane 0.15 m thick.
  canopy: { plan: [[-42.5, 8.5], [-42.5, 16.0], [-39.5, 16.0], [-39.5, 8.5]], top: 3.3 },
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
  // The atrium between the ranges (round 1: its returns at least 0.6 m inside its edges, by 2 m of x). From x -28 to
  // -22 only its floor, near 0.0 m, and nothing over it; the photograph sees the south-east range's mesh panels there
  // with no roof's edge across them: open. From x -22 to 9.6 a few returns at 13.5 m at both ends (glass: no fall
  // the LiDAR can show): a flat glazed roof at 13.5 m from range to range, its edges 0.1 m into both. Its floor at
  // 0.0 m (`floor`; seen at x -28 to -24 only, the same under the glass: estimated), 0.3 m thick.
  atrium: {
    plan: [[-22.0, -3.22], [-10.0, -1.1], [2.0, 0.4], [9.6, 2.3], [9.6, 5.38], [4.0, 4.1], [-12.0, 1.6], [-18.0, 1.1],
      [-22.0, 2.1]],
    top: 13.5,
    floor: { plan: [[-27.9, -4.12], [-10.0, -1.1], [2.0, 0.4], [9.6, 2.3], [9.6, 5.38], [4.0, 4.1], [-12.0, 1.6],
      [-18.0, 1.1], [-27.9, 3.57]], top: 0.0 },
  },
  // Over the atrium at x 2 to 8, a raised part: returns at 18.0-18.6 m (some at 15.5); flat at 18.3 m, from just
  // under the atrium's roof (how far down it reaches is not seen), its plan 0.2 m into both ranges.
  bridge: { plan: [[1.8, 0.1], [1.8, 4.0], [8.2, 5.3], [8.2, 1.65]], top: 18.3 },
  // South-west of the glass, between the ranges from x 9.4 to 18: a roof at 7.7 m (each column's returns 7.5-8.0),
  // its plan 0.2 m into the low roof beyond.
  link: { plan: [[9.4, 2.25], [18.2, 2.1], [18.2, 7.2], [16.0, 6.85], [9.4, 5.35]], top: 7.7 },
  // The faces seen from Alfred Street (the photograph, through its fitted camera: refs/photos/views.json, each
  // height cast onto its face's plane). The south-east range's north-east face (x -31.0): pale silver screens from
  // 3.7 m (3.5-3.8 along it) to its roof, the face's full width (z -21.7 to -11.3), hung 0.5 m before it; under
  // them green-tinted glazing down to the court. Its corner beyond (the face at z -10.5 and the set-back face at
  // x -28.0): green-tinted glazing from 2.9 m (2.8-3.0) to the roof, the wall under it. Its face to the atrium's open
  // end (from (-28.0, -4.0) along its plan): grey mesh panels from 4.2 m to the roof, 0.4 m before green-tinted
  // glazing, as far as x -12 (the prow hides the rest: estimated). At the court's level across the atrium's end
  // (x -28.0, z -4.0 to 3.5), a dark shopfront from the court to -0.3 m under the floor's edge (-3.8 to -0.5 and the
  // white beam over it at 0.1-0.4 through the camera).
  faces: {
    screens: { y0: 3.7, out: 0.5, z0: -21.7, z1: -11.3 },
    corner: { y0: 2.9 },
    mesh: { y0: 4.2, out: 0.4, x1: -12.0 },
    shop: { x: -28.0, z0: -4.0, z1: 3.5, y1: -0.3 },
  },
  // Between the ranges south-west of the atrium, a low roof at 4.2 m (its columns' medians 4.15-4.21), x 18 to 28.
  low: { plan: [[18.0, 1.9], [18.0, 7.2], [28.0, 8.8], [28.0, 1.9]], top: 4.2 },
};
