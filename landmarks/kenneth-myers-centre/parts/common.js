// Shared sizes, measured in the LINZ 2024 LiDAR (data/kenneth-myers-centre_pts.npy, building 820's points)
// in the view frame of config/kenneth-myers-centre.json (frame.expected): x is -axis (east-north-east, to the
// right as seen from Shortland Street), y up from the frame's ground (25.5 m NZVD2016, the street before the
// door), z is toStreet (south-south-east, toward Shortland Street). Owned by the lead: read, do not edit.
// Measured 2026-10-28 (the rough model, round 0; the east part's street face and what the street faces carry,
// round 1).
//
// Walls are lines fitted to the LiDAR's wall returns, as for the Fisher Building (804): the building returns
// (class 6) within 1.2 m of a roof's edge and below the roof the wall rises to; their median, then the median
// of those within 0.6 m of it, three times; each wall with the rms of those returns about it and their count.
// Heights are medians of the roof returns, with their count. The plan is the LiDAR's, not campus.json's
// (config building.outline_note: that outline lies about 2 m north of the building's front and back).
//
// What the street faces carry (FRONT) is placed by the LiDAR where it shows it (the pinnacles' returns, the
// copings' heights) and otherwise by 0Rjk's wide view through its camera (config streetview.camera_fixes, its
// cut turned level): a point of the photograph taken along its ray onto the face's plane. On the east part that
// camera puts the merlons' tops at 7.96 m (the LiDAR's 8.05) and the five pinnacles within 0.2 m of the LiDAR's
// x; on the west part it does not agree with the LiDAR (config camera_fixes_note), so there the sizes are the
// LiDAR's and the rest is estimated. What no view shows is estimated and says so.

// The ground falls from -0.2 m on Shortland Street before the door (p50 of 1,033 ground returns, z 17 to 21)
// and +0.65 m before the east part (253), to -2.8 m on the east (33), -12.1 m along the back (261) and
// -13.0 m in the lane on the west (20): it falls steeply north and west. Every wall goes down to FOOT.
export const FOOT = -13.1;

export const MEASURED = {
  walls: {
    // the west wall: the 10 m roof's returns stop at x -16.77 (p2 of 67), and the wall returns 4 to 9.4 m
    // high stand at -16.0 to -15.5 (11); the lane's own returns below 4 m spread from -19.5 to -15
    west: -16.7,
    // the street face of the west part: 16.21 (rms 0.26, 67 returns 1.0-9.6 m high over x -16 to 1)
    front: 16.21,
    // where the west part's 10 m roof ends over the street: its returns stop at x 1.8 to 2.2; four wall
    // returns 8.9-9.8 m high there at 2.17 (rms 0.20)
    porchWest: 2.0,
    // the porch's street face: 14.78 (rms 0.23, 16 returns 1.0-7.8 m high over x 2.5 to 6.3)
    porchFront: 14.78,
    // its east side: its roof's returns reach 7.39 (p98 of 38) and one wall return stands at 6.40; the
    // pinnacle at its back corner on the east part's face stands over x 6.75-7.44 (10 returns), and the
    // photograph's at column 837, where the camera puts x 7.1 on that face: 7.2 (round 0 took 6.9)
    porchEast: 7.2,
    // where the porch's street face begins on the west, and the west part's ends: the LiDAR's tops over x 0
    // to 2.3 stand at z 13.6-15.4 (9.2-10.8 m high, 53 returns), not on the west part's face at 16.2, and the
    // photograph shows the porch's two spired pilaster blocks and its door whole, the west part's last
    // pinnacle at column 553 (x -0.9 on its face through the camera); so the porch's face runs from x 0.0,
    // with the 10 m range's roof behind its western part (round 0 ran the west part's face to x 2.0)
    entranceWest: 0.0,
    // the street face of the east part is not square to the frame: a line fitted to its wall returns 0.8-6.2 m
    // high over x 7.8 to 20.7 runs z = 12.663 - 0.0688 x (3.9 deg off the frame's x; rms 0.12 m, 104 of 108
    // returns), as its east wall runs off the frame's z; so from the porch's east side (7.2, 12.17) to the
    // east wall (21.37, 11.19). (Round 0 took one z for it, 11.71, rms 0.27.)
    eastFront: [[7.2, 12.17], [21.37, 11.19]],
    // the east wall is not square to the front: its parapet's returns (7.3-9.0 m) stand at x 20.64 (p98) by
    // z -8 and 21.69 by z +8, so it runs 3.5 deg off the frame's z, from the street face's line to (19.9, -12.6)
    east: [[21.37, 11.19], [19.9, -12.6]],
    // the back: -12.6 (29 returns -6 to 6 m high; rms 0.31 about their median -12.78, the roof's edge at -12.41)
    back: -12.6,
  },
  // the main roof: 6.59, 6.68 and 6.58 m over its east, middle and west parts (p50 of 1,192, 1,161 and 660
  // returns): 6.62
  roof: 6.62,
  // the parapet round it on the east part's street face, the east side and the back: 8.04 (72 returns),
  // 7.83 (47) and 7.83 (22)
  parapet: 7.9,
  // the west part's range along the street, its roof at 10.04 m (322 returns, p10 9.68, p90 10.36); its
  // back wall over the main roof at z 11.81 (rms 0.24, 72 returns 7.2-9.6 m high)
  front: { back: 11.81, top: 10.04 },
  // the west wing, from the street range to the back: 10.15 m (155 returns), 2.7 m wide; a gutter at the
  // main roof's height parts it from block A (x -14.0 to -13.1)
  westWing: { east: -14.0, top: 10.15 },
  // the porch between the west part and the east part: its roof at 8.37 m (70 returns, p10 8.33, p90 8.44)
  porch: { top: 8.37 },
  // the two higher blocks on the main roof: A, 10.06 m (785 returns), its walls at x -13.10 (rms 0.19, 46),
  // -1.29 (0.42, 9) and z 1.18 (0.38, 43), its back at -9.9 (its roof's edge; the wall returns there mix
  // with the back's parapet); B, 10.03 m (552), its walls at x 7.52 (0.29, 25), 14.53 (0.33, 16) and
  // z -9.29 (0.22, 22), 3.78 (0.27, 25)
  blockA: { x: [-13.1, -1.29], z: [-9.9, 1.18], top: 10.06 },
  blockB: { x: [7.52, 14.53], z: [-9.29, 3.78], top: 10.03 },
  // smaller things on the main roof: a box at 7.70 m (58 returns) and a lantern at 9.42 m (23), their
  // extents from the heightmap
  box: { x: [5.3, 7.7], z: [5.8, 8.7], top: 7.7 },
  lantern: { x: [-6.0, -3.0], z: [3.0, 6.0], top: 9.42 },
  // the radio mast in the middle of the roof (the red and white lattice in the photograph): 610 returns
  // above 11 m round x 2.96, z -1.04 (their median); its highest return 39.29 m (p99 38.32); 3.9 m across
  // between 11 and 15 m (x 1.14 to 5.04, z -3.00 to 0.87, p2-p98), 1.6 m across between 35 and 39 m
  // (x 2.24 to 3.90, z -1.90 to -0.36). It stands inside the building's walls, on its roof.
  mast: { x: 2.96, z: -1.04, top: 39.3, low: { y: 13, w: 3.9 }, high: { y: 37, w: 1.6 } },
};

// What the street faces carry (parts/front.js), round 1: from the wide view (columns and rows of the photograph
// as cut before it was turned level) through its camera, onto each face's plane.
export const FRONT = {
  // the east part, seen whole in the wide view (columns 830-1600)
  east: {
    // its pinnacled pilasters, at the LiDAR's returns above 8.5 m along the face (x 6.75-7.44, 10 returns,
    // highest 9.99; 10.52-10.73, 4, 9.48; 13.93-14.35, 3, 9.15; 17.35-17.71, 5, 9.12; 20.78-21.73, 7, 9.04,
    // the corner): their centres. The photograph's pinnacles stand at columns 837, 967, 1130, 1321 and 1558,
    // where the camera puts these within 15 px
    pilasters: [7.1, 10.6, 14.1, 17.55, 21.2],
    // the tips: the LiDAR rarely hits a spire's top (its highest returns, above, are lower bounds); the
    // photograph's tips (columns 837, 967, 1131, 1321, 1558) stand 9.93, 9.50, 9.27, 9.30 and 9.35 m, at x 6.94,
    // 10.41, 14.07, 17.57 and 21.11. The first, at the porch's corner, is the taller one in both
    tips: [9.93, 9.5, 9.27, 9.3, 9.35],
    // the merlons' tops: p90 of the returns along the face's top, 8.02-8.07 m (25-29 returns a metre of x,
    // at x 11, 12, 15, 16, 18 and 19); the crenels and the parapet behind at the body's 7.9
    copingTop: 8.05,
    // the cream coping band's foot, 7.54 m; a cream dentil course under it 7.31-7.54; the small arches of the
    // corbel table from 6.61 to their crowns at 7.08, six to a bay; the blind arches' cream springers 5.22-5.45,
    // their openings' crowns 5.80 and their rings' tops 5.99, three to a bay (column 1040, rows 340-440)
    band: [7.54, 7.95], dentil: [7.31, 7.54], frieze: [6.61, 7.08], springer: 5.33, crown: 5.8,
  },
  // the porch: its coping (the LiDAR's highest at x 3-4, 8.86 m, 20-22 returns; p90 8.74-8.80; the camera's
  // 8.74); its two pilaster blocks, the LiDAR's returns over x 0.06-2.57 (9.2-10.76 m, standing out to z 15.4)
  // and 5.68-7.58 (9.3-10.01 m, out to 15.0), each with two spires as the photograph shows them (columns 580
  // and 620, 738 and 793: x 0.68 and 2.14, 5.86 and 7.39 on the blocks' fronts); the tips at the LiDAR's
  // highest, 10.8 and 10.05 (lower bounds)
  porch: {
    blocks: [{ x: [0.0, 2.3], front: 15.3, tip: 10.8, spires: [0.68, 2.14] }, { x: [5.7, 7.6], front: 15.0, tip: 10.05, spires: [5.86, 7.39] }],
    copingTop: 8.86, band: [8.35, 8.66], frieze: [7.5, 8.0],
    // the door: its opening's crown 3.99 m over x 3.91 and its threshold 0.65 (column 668, rows 465 and 595),
    // centred between the blocks (x 4.0); the opening about 1.6 m wide and the cream surround about 2.6, its
    // top 4.95 (columns 630-720 and 655-705, row 420); three arched windows over it, their crowns 7.0 and sills
    // 5.1, with cream colonnettes (columns 650-720, rows 345-440)
    door: { threshold: 0.65, open: 1.6, crown: 3.99, outer: 2.6, outerCrown: 4.95 },
    windows: { sill: 5.1, crown: 7.0, n: 3, w: 0.45 },
  },
  // the west part: the camera does not agree with the LiDAR here (config camera_fixes_note), so its sizes are
  // the LiDAR's and the rest estimated. Its coping at the LiDAR's front top (10.29-10.38 m, the returns 14-15.2
  // m back of the face; up to 10.89 over x -12.5 to -10); its pinnacles at the corner, at the LiDAR's cluster
  // over x -12.5 to -10 (centre -11.25), one at its east end by the porch and one between (the photograph shows
  // four). The bands, the corbel table and the blind arches keep the east part's order under the coping, at
  // the photograph's proportions of this face (estimated)
  west: {
    pilasters: [-16.7, -11.25, -5.6, -0.45],
    copingTop: 10.55, band: [9.82, 10.3], frieze: [9.07, 9.63], springer: 7.73, crown: 8.4,
    // the tips: the photograph's spires here stand about 4.7 pilaster widths above the coping, the east part's
    // about 1.8, but no LiDAR return stands above 10.9 m over the west part's front: estimated 1.6 m above
    // the coping, as on the east part, until a later round settles it
    tip: 12.15,
  },
};
