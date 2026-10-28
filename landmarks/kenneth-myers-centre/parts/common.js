// Shared sizes, measured in the LINZ 2024 LiDAR (data/kenneth-myers-centre_pts.npy, building 820's points)
// in the view frame of config/kenneth-myers-centre.json (frame.expected): x is -axis (east-north-east, to the
// right as seen from Shortland Street), y up from the frame's ground (25.5 m NZVD2016, the street before the
// door), z is toStreet (south-south-east, toward Shortland Street). Owned by the lead: read, do not edit.
// Measured 2026-10-28 (the rough model, round 0).
//
// Walls are lines fitted to the LiDAR's wall returns, as for the Fisher Building (804): the building returns
// (class 6) within 1.2 m of a roof's edge and below the roof the wall rises to; their median, then the median
// of those within 0.6 m of it, three times; each wall with the rms of those returns about it and their count.
// Heights are medians of the roof returns, with their count. The plan is the LiDAR's, not campus.json's
// (config building.outline_note: that outline lies about 2 m north of the building's front and back).

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
    // its east side: its roof's returns reach 7.39 (p98 of 38) and one wall return stands at 6.40;
    // taken between them, to be set by the photograph
    porchEast: 6.9,
    // the street face of the east part: 11.71 (rms 0.27, 81 returns 1.0-6.0 m high over x 8.5 to 19.5)
    eastFront: 11.71,
    // the east wall is not square to the front: its parapet's returns (7.3-9.0 m) stand at x 20.64 (p98) by
    // z -8 and 21.69 by z +8, so it runs 3.5 deg off the frame's z, from (21.4, 11.71) to (19.9, -12.6)
    east: [[21.4, 11.71], [19.9, -12.6]],
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
