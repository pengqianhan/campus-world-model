// Shared sizes, measured in the LINZ 2024 LiDAR (data/kate-edger-information-commons_pts.npy: building 315's
// returns more than 3 m above the frame's ground and within 1.5 m of building.outline) in the view frame of
// config/kate-edger-information-commons.json: x is -axis (south-west, along the two long ranges), y up from
// the frame's ground (41.5 m NZVD2016, the median ground in the crop box, and the ground at `door`),
// z is toStreet (north-west, toward the Student Commons); the frame's centre at x = z = 0. Owned by the lead:
// read, do not edit. Measured 2026-11-04 (baseline, round 0; round 1 the same day; the check 2026-11-05).
//
// How: the 90th percentile of the returns in each 0.5 m cell; each roof level's plan from the edges of its cells,
// column by column (2 m of x), simplified to a few corners; its top the median of its cells. Round 0 draws each
// level as a flat-topped block: the roofs' falls, parapets and plant are left for the rounds. Round 1 reads the
// north-east end again from the highest and lowest return in each 1 m cell (the prow, the north-east end's face,
// the canopy) and the atrium from its returns by 2 m of x, and measures the faces seen from Alfred Street in the
// photograph (`faces`). The check after round 1 (out/topview, then the p90 of each 0.5 m cell part by part) put the
// north-west range's parapets, the plant's screens and the prow's roof at the LiDAR's heights and the prow's plan on
// its cells' edges.

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
  // At the block's south-west end, plant in a screened enclosure (the check: one block at 19.6 m in round 0, its
  // cells' median 18.6): screens 1 m thick at 20.35 m (their cells 20.0-20.4) round x 20.6 to 28.6, z -16.0 to -9.0,
  // the north-east one standing on the block; within them the roof at 16.0 and one unit at 18.6 m (18.5-18.6).
  plant: {
    screens: { x0: 20.6, x1: 28.6, z0: -16.0, z1: -9.0, t: 1.0, top: 20.35 },
    unit: { plan: [[23.5, -14.9], [23.5, -10.1], [26.5, -10.1], [26.5, -14.9]], top: 18.6 },
  },
  // The north-west range: one flat roof at 15.80 m (every column's median 15.65-15.89 from x -30 to 30; the
  // strip at z 17 to 25 between x -12 and 2 stands at 16.1-16.6, the same roof in round 0). Its edge on the
  // atrium from the edges of its cells, column by column; its face to the north-west at z 18.0-18.5 north-east
  // of x -12 and at 23-25 south-west of it; its south-west end at x 30 (z 9.0 to 14.5) and x 22 beyond z 15.
  // Round its edge, except where it meets the north-east end, a parapet: a band of cells at 16.4-16.6 (the roof
  // within it 15.6-15.9), 0.5-1 m wide, on every face (the check); drawn 0.5 m wide at 16.55. Not drawn: the strip
  // along its face to the north-west from x -11 to 21 (16.1-16.2, z 18 to 22) and the slot at 14.5 before it.
  northwest: {
    plan: [[-30.0, 4.0], [-18.0, 1.0], [-12.0, 1.5], [4.0, 4.0], [16.0, 6.75], [30.0, 9.0], [30.0, 14.5], [22.0, 15.0],
      [22.0, 23.0], [8.0, 24.0], [-12.0, 25.0], [-12.0, 18.0], [-30.0, 18.5]],
    top: 15.80,
    parapet: { top: 16.55, width: 0.5, edges: 12 },  // the first 12 edges of the plan: the 13th is in the north-east end
  },
  // Its north-east end, higher: 16.6 m (the medians of its two columns 16.57, 16.58); its north-east face, from
  // the edges of its 1 m cells (round 1), at x -35.2 up to z 8.5 and then on a slant to (-31.2, 17.5).
  northeast: { plan: [[-35.2, 4.6], [-35.2, 8.5], [-31.2, 17.5], [-29.9, 18.5], [-29.9, 4.0]], top: 16.6 },
  // Beyond that face, the end that stands out over the court (the prow), from the edges of its 0.5 m cells (the
  // check; round 1 took a straight face at x -41.8 from the highest return of each 1 m cell): its south-east side
  // slanting from z 5.5 at x -35 to 7.0 at its tip; its north-east face curving back from x -42.0 at z 8.2 to -37.6
  // at its north-west side, z 19.5 (at z 7.0 estimated, -42.4, on the curve); its back inside the north-east end's
  // face. Beyond its tip (x -43.5 to -42.5, z 7.0 to 8.0) six building returns at its rim's height (12.68-12.85)
  // among four of a tree's (to 14.9): not drawn. The 2023 aerial, allowing for its lean (its south-east side 0.5-0.8 m
  // north-west of the LiDAR's), puts the corner at the plan's tip, and the photograph shows nothing there; drawn out
  // to x -43.5, the box IoU fell from 0.637 to 0.598. Its roof at 11.8 m (every cell of it outside the roof light 11.7-11.9), a rim at
  // 12.8 m (12.5-12.9) 1.2 m wide along its south-east side and 1.5 m wide along its north-west side, none along its
  // tip (`rim`). Within it, returns both at 11.6-12.0 and at 14.1-14.5 m in every cell of a band along it, which
  // with the 2023 aerial's dark gridded glass there reads as a glazed roof light (14.2 m: `light`, its plan from
  // the cells at 14.0-14.5) over a floor the LiDAR sees through it. Its underside the LiDAR cannot see: in the
  // photograph (through the fitted camera, cast onto its north-east face) the prow's lower edge falls in a curve from
  // its rim at z 7.2 to 5.1 m at z 9.1, where it leaves the picture, and the court, the entrance and the building
  // behind show under it, so nothing is drawn there. Round 1 moved that curve 1 m south-east, onto a rim it then
  // took at z 6.0; the rim at the tip is at z 7.0-8.0, where the photograph puts it, so the curve is drawn where the
  // photograph has it: the underside level 0.45 m under the roof south-east of z 7.2, sloping to 5.1 m at z 9.1
  // (`slope`), and level at 5.1 m beyond (estimated).
  overhang: {
    plan: [[-35.0, 5.5], [-37.5, 5.5], [-40.5, 6.5], [-42.4, 7.0], [-42.0, 8.2], [-41.5, 9.5], [-41.0, 11.0],
      [-40.5, 13.0], [-40.0, 14.0], [-39.5, 16.0], [-38.5, 17.0], [-38.0, 18.5], [-37.6, 19.5], [-30.6, 19.5],
      [-30.6, 17.8], [-35.0, 8.3]],
    top: 11.8,
    // the rim's runs along the plan's edges: the south-east side and round the tip (1.0 m wide drawn), the north-west
    // side from the roof light's edge
    rim: { top: 12.8, runs: [{ run: [[-35.0, 5.5], [-37.5, 5.5], [-40.5, 6.5], [-42.4, 7.0], [-42.0, 8.2]], width: 1.0 },
      { run: [[-34.9, 19.5], [-30.6, 19.5]], width: 1.5 }] },
    under: 5.1,
    slope: { z0: 7.2, y0: 11.35, z1: 9.1 },
    light: {
      plan: [[-40.0, 7.5], [-40.5, 8.5], [-40.0, 11.0], [-39.0, 11.0], [-39.0, 14.0], [-37.0, 14.0], [-38.0, 15.0],
        [-38.0, 17.0], [-36.5, 17.0], [-37.0, 19.3], [-35.0, 19.3], [-35.0, 17.0], [-34.0, 17.0], [-34.0, 14.5],
        [-33.0, 14.5], [-33.0, 11.0], [-37.0, 11.0], [-37.0, 7.5]],
      top: 14.2,
    },
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
  // Not drawn: the roofs before the range's face to the north-west from x -17 to -10, out to z 31.5 (round 0's lower
  // wing, flat at 9.8 m). They are AUSA House's (building 322, a measured massing on the site): its hipped roof runs
  // on beyond the campus map's ring of it toward this range (the rings lie 2-4 m north-west of the LiDAR's walls), its
  // slopes unbroken from 11.5 m at the ridge to 9.0 at the eaves, and the wing stood 2.5 m into 322's ring (9.2% of
  // its block, where its massing stands). Nor the flat roof at 7.8 m against the face (x -14.5 to -12, z 17.8 to
  // 20.5), whose building neither the LiDAR nor the photograph shows (step 7, placing it on the map).
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
