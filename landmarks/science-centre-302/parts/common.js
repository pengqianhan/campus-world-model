// Shared sizes, measured in the LINZ 2024 LiDAR (data/science-centre-302_pts.npy: the building returns, class 6, in
// the crop box) in the view frame of config/science-centre-302.json: x is -axis (south-west, toward Symonds Street),
// y up from the frame's ground (45.0 m NZVD2016, the median ground in the crop box; to be the LiDAR's ground at the
// config's door at step 7), z is toStreet (north-west); the frame's centre at x = z = 0. Owned by the lead: read, do
// not edit. Measured 2026-11-06 (baseline, round 0; round 1's shape; the tower's roofs again in its own frame, step 6).
//
// How: the 90th percentile of the returns in each 0.5 m cell (the roofs' heights and where they step), lines fitted to
// the cells of each slope, the returns by height along each face (where the walls stand), and the convex hulls of the
// returns above 45 m (the tower) and at 69.5-72 m elevation (the lower block's top). The building is a tower, a
// rectangle turned 3.93 degrees from the frame, whose roofs all run square with its own faces: its main roof falling
// from 50.8 m at its ends to 50.1 m at a band across its middle, where three sawtooth ramps rise toward the south-west
// face; a parapet along its south-west face and a raised strip along its north-east one; lower roofs at 46.7 m along
// its south-east and north-west ends, each rising in a ramp to the south-west face, and over a small annex north of it;
// and, before its south-west face, a lower block with a flat top at 25.5 m whose outer face leans away from the
// tower's: 15 m out at its south end, at the tower at its west end, from where a screen 2 m deep runs on along the
// north-west face.

// The ground (the LiDAR's ground returns, relative to 45.0) round the building: +0.2 to +1.4 along the south-east
// face, about 0 along the north-east, -2.8 to -4.1 along the north-west, and before the south-west face, where
// Symonds Street falls, -5.1 to +1.1 (p5 of the crop box -5.3). The walls go down to FOOT.
export const FOOT = -6.5;

export const MEASURED = {
  // The tower, in its own frame: a from its south corner toward the north-east (along its south-east face), b toward
  // the north-west (along its south-west face). `corner` is the south corner [x, z]; `a` and `b` the two directions in
  // the view frame (the hull of the returns above 45 m: its south and west corners, the south-west face 44.35 m long).
  tower: {
    corner: [19.05, -24.37],
    a: [-0.99765, 0.06854],
    b: [0.06854, 0.99765],
    // The faces: south-west at a 0, south-east at b 0, north-west at b 44.35. The north-east face stands at a 39.0
    // along the two lower roofs (the walls' returns there at a 38.5-39.0) and at 39.8 between them, where the main
    // roof runs from b 4.55 to 39.7 (its walls' returns at 39.0-40.0 from 10 to 46 m, its roof's to 40.0).
    ne: { ends: 39.0, main: 39.8 },
    main: { b: [4.55, 39.7] },
    // The main roof: 50.8 at its ends, falling to 50.1 at the band (the cells' medians in 4 m strips from b 4.6:
    // 50.73, 50.43, 50.17; from b 28.1: 50.16, 50.42, 50.73), drawn as two planes.
    roof: { end: 50.8, band: 50.1 },
    // Along the south-west face a parapet 0.9 m wide at 51.5 (the cells at a 0-0.5 51.5-51.6, 0.5-1 mixed); along the
    // north-east face a raised strip from a 35.0 at 51.3 (the cells 51.1-51.4), its edge a parapet from a 38.6 at 51.8
    // (from 38.5 across the band, from 38.9 beside it).
    parapet: { sw: { width: 0.9, top: 51.5 }, ne: { a: 38.6, top: 51.8 } },
    strip: { a: 35.0, top: 51.3 },
    // The band from b 16.5 to 28.0: a gutter at the lower roofs' height along each side (b 16.5-17.0 and 27.0-28.0),
    // and between them, from the south-west, the main roof to a 7.9 (50.85 at the parapet falling to 49.8), a court to
    // a 14.3 at 46.7, and three ramps, each fitted to its cells (a plane of slope 0.76-0.78 meets 50.6 at a 14.59,
    // 20.89 and 27.36 and the cells within 0.11 of it, but the cells from 0.3 m before are at 50.6 too: the ramps
    // drawn from there): 50.6 at its south-west edge, falling to 46.72 at its north-east one, a gutter after each;
    // then a block at 51.1 (a 33.0-37.4, b 17.0-27.0) and a slot at 46.7 (from 37.4, with openings to below: returns
    // at 16-33 m) before the north-east parapet.
    band: {
      b: [16.5, 28.0], rampB: [17.0, 27.0], ramps: [[14.29, 19.58], [20.59, 26.02], [27.06, 32.40]],
      high: 50.6, low: 46.72,
      sw: { a: 7.9, top: [50.85, 49.8] }, island: { a: [33.0, 37.4], top: 51.1 },
    },
    // Plant on the main roof: the cells above 51.9 m, four boxes (their cells' medians 53.0-53.25, p90 53.6-53.8).
    plant: [
      { a: [7.5, 16.5], b: [7.5, 10.0], top: 53.25 }, { a: [20.0, 28.0], b: [7.5, 10.0], top: 53.0 },
      { a: [7.5, 16.5], b: [34.5, 37.0], top: 53.25 }, { a: [20.0, 28.0], b: [34.5, 36.5], top: 53.0 },
    ],
  },
  // The lower roofs at 46.7 m (p10-p90 46.64-46.74), along the south-east end (b 0 to 4.55) and the north-west end
  // (b 39.7 to 44.35), and over the annex north of the tower (in the view frame: x -17.2 to -9.3, to z 32). Each end
  // rises from the south-west parapet in a ramp, a plane fitted to its cells: 51.52 - 0.523 a at the south-east end to
  // a 8.5, 51.60 - 0.519 a at the north-west end to a 8.0, then a step down to the roof. Along the south-east face from
  // a 6.75 to 34.0 an upstand 0.55 m wide at 48.0, and beyond it to the north-east face a slab at 47.1; along the
  // north-west face from a 6.75 to 30.3 an upstand 0.75 m wide at 48.0 (the cells next to the faces: 47.5-48.1).
  low: {
    roof: 46.7,
    se: { ramp: { a: 8.5, h: [51.52, -0.523] }, upstand: { a: [6.75, 34.0], width: 0.55 }, slab: { a: 34.0, top: 47.1 } },
    nw: { ramp: { a: 8.0, h: [51.60, -0.519] }, upstand: { a: [6.75, 30.3], width: 0.75 } },
    upstand: 48.0,
    annex: [[-17.2, 21.0], [-9.3, 20.5], [-9.6, 31.5], [-16.6, 32.0]],
  },
  // The lower block before the tower's south-west face: the hull of its returns at its top (69.5-72 m elevation:
  // its roof p50 25.48 above the frame's ground, its edge p90 26.04), its inner side inside the tower. Its screens run
  // on from its two ends along the tower's two end faces, in the tower's frame: along the north-west face 2 m deep
  // (b 44.35-46.3, from a -0.5 to 26.0; the returns of its outer face at every height from the ground), along the
  // south-east face 1.7 m deep (b -1.7 to 0, from a -2.0 to 26.0, in line with the block's south end at b -1.64 and
  // 6 cm out from it; trees before it), both to 26.0 (the cells 25.8-26.1). The photograph shows the dark screen
  // running on behind the trees there.
  block: {
    plan: [[34.15, -26.8], [22.69, 21.56], [18.6, 21.78], [18.0, 20.7], [18.05, -25.7], [18.6, -26.0], [33.2, -26.97]],
    top: 25.5,
    screens: [{ a: [-0.5, 26.0], b: [44.35, 46.3] }, { a: [-2.0, 26.0], b: [-1.7, 0] }],
    screenTop: 26.0,
  },
};

/** The point [x, z] of the view frame at a, b in the tower's frame. */
export function towerAt(a, b) {
  const T = MEASURED.tower;
  return [T.corner[0] + a * T.a[0] + b * T.b[0], T.corner[1] + a * T.a[1] + b * T.b[1]];
}

/** The rectangle from a0 to a1 and b0 to b1 in the tower's frame, as a plan [[x, z] x 4]. */
export function towerRect([a0, a1], [b0, b1]) {
  return [towerAt(a0, b0), towerAt(a1, b0), towerAt(a1, b1), towerAt(a0, b1)];
}
