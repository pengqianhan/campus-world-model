// Shared sizes, measured in the LINZ 2024 LiDAR (data/nine-eden-crescent_pts.npy) in the view frame of
// config/nine-eden-crescent.json: y up from 17.6 m NZVD2016 (the LiDAR ground's median round the building);
// x along the building, its street end toward -x, where it meets Eden Crescent (the frame's axis points
// at bearing 44.5 deg and x is minus it, so the street end faces north-east); z across it, +z to the
// right as seen from the street; the middle of its roof at x = z = 0. Owned by the lead: read, do not
// edit. Measured 2026-10-27; the street end measured again in round 1 (2026-10-27, below).
// How far the walls go below y = 0: the street at the street end lies at -0.72 m (-1.17 at p10); the
// ground rises to +4.3 m at the far end and to +3 m along part of the south-east side.
export const FOOT = -1.3;

// Round 1: how the street end was measured. Each size below is where a feature of the photograph falls
// on the plane of the street end (x -18.3), seen from v8ia's camera (refs/streetview/views.json) moved to
// where the photograph's own edges put it: the end's two side edges, at rows 50 and 150 of v8ia's wide view
// (columns 360 and 1490), on the LiDAR's edges of the end (z -9.6 and +10.9, below), and the feet of the
// two piers (rows 772-780) on the street (-0.75 m), which put the camera 0.32 m nearer, 1.06 m to the left
// and 0.18 m higher than Street View says (residuals 0.08 m or less). The heights this gives were checked on
// mdk1's wide view along the end's left edge, from the street to the LiDAR's 12.8 m at its top corner:
// the lower windows 4.34-5.66 there against 4.27-5.63 here, the vehicle way's head 2.20 against 2.32-2.47.
// The outline's narrower end (z -9.1 to 9.1) puts the camera 2.3 m above the street instead of Street
// View's 2.5-2.6 m, and its heights miss mdk1's by 0.6-1.6 m: the LiDAR's width it is. The same fit to
// the drawn openings (bays, bands, vehicle way) moves mdk1's camera 0.87 m and MH15's 1.39 m to the left
// too (rms 10 and 8 px over 12 and 9 points): the three panoramas sit about 1 m to the right of where
// the LiDAR puts the end. Seen from v8ia's fitted camera every opening drawn lies on the photograph's.
export const MEASURED = {
  // The block: x -18.3 to 21.3; z from the LiDAR's walls, -9.4 to 10.9 (its roof's edges in every 3 m
  // along it: -8.8 to -9.9 on the south-east; +10.8 to +11.5 on the north-west, 11.8-12.7 at x -7 to +2,
  // where something joins it; the campus outline says -9.1 to 9.1). From above (run.sh topview) the
  // footprint IoU against the LiDAR goes from 0.800 to 0.906, block 801 under the model 93.8% to 99.6%.
  // A flat roof at 14.0 m (the median in every 2 m along it, 13.9-14.1), its parapet to 14.2 m. Along
  // the south-east side the top storey stands back behind a terrace (round 2, medians in 0.5 m bands
  // across the side, in four lengths of it; round 1 read medians of 2 m bands as a slope from 10.5 m to the
  // roof): the terrace's roof at 10.45 m (10.44-10.48) from the side wall (z -9.4) to z -6.4, where the top
  // storey's wall rises to the roof (12.5-12.9 in the band z -6.5 to -6.0, 13.9 beyond it; at -6.0 in the
  // last 7 m, x 14 to 21); along its edge (z -9.5 to -9.0) a parapet, 11.05-11.3 m: 11.1.
  block: { x: [-18.3, 21.3], z: [-9.4, 10.9], roof: 14.0, parapet: 14.2, terrace: { z: [-9.4, -6.4], y: 10.45, parapet: 11.1 } },
  // On the roof (round 2), from the LiDAR's building points above 14.9 m inside the block, in 0.5 m cells;
  // no photograph shows them (the street end's top hides them from the street): a plant room at x 2.2 to
  // 8.2, z 5.1 to 10.6, 15.6 m (median), with a taller part at x 8.2 to 11.2, z 5.1 to 10.1, 16.6 m (the
  // building's highest point, 16.69 m); two low units, x -14.3 to -11.3, z 3.6 to 6.1, 15.0 m, and x 3.2
  // to 8.7, z -6.9 to -3.4, 15.05 m. The points at 19.6 m along z 10.1 to 11.1 from x 12.7 to 21.7 are the
  // wall of the taller building next door, not this one's.
  plant: [
    { x: [2.2, 8.2], z: [5.1, 10.6], y: 15.6 },
    { x: [8.2, 11.2], z: [5.1, 10.1], y: 16.6 },
    { x: [-14.3, -11.3], z: [3.6, 6.1], y: 15.0 },
    { x: [3.2, 8.7], z: [-6.9, -3.4], y: 15.05 },
  ],
  // The street end (x -18.3), z -9.6 to 10.9: the LiDAR's building points within a metre of it (x -18.5
  // to -17.5) run from z -9.6 to +10.9, the white end that every photograph shows. Its top: the LiDAR's
  // highest points along it are 14.7-14.9 m from z -5.5 to the north-west edge, and fall to 12.8 m at its
  // south-east corner (13.4 at z -8, 14.0 at -7): the raked corner mdk1's wide view shows.
  street: {
    x: -18.3,
    z: [-9.6, 10.9],
    crest: 14.8,
    rake: { z: -5.5, low: 12.8 },
    // Two white piers 1.0-1.1 m wide (v8ia's wide view, columns 595-676 and 1150-1220 from row 300 to
    // row 650), between three bays: left (the vehicle way), centre (the entrance), right (the glazed
    // corner). The bays stand back from the piers and the top storey (mdk1 shows the piers' sides, about
    // 0.3 m); the top storey's face comes down over them to 9.6 m (v8ia's row 170: 9.3-10.0 m).
    piers: [[-5.25, -4.25], [4.0, 5.1]],
    recess: 0.3,
    bayTop: 9.6,
    // The window bands, each about 1.25 m tall, set in the bays from pier to pier (v8ia): the lower
    // band 4.3-5.55 m (4.27-5.63 in v8ia's left and centre bays, 4.34-5.66 in mdk1's left bay), the upper
    // 8.0-9.3 m (7.9-9.2 in v8ia, 8.25-9.66 in mdk1); the left bay's start 0.8 m in from the end's edge
    // (z -8.8, both storeys).
    lower: [4.3, 5.55],
    upper: [8.0, 9.3],
    leftWin: -8.8,
    rightWin: 10.7,
    // The right bay's lower window is taller, 2.95-5.1 m with a transom at 3.9 m (v8ia's rows 425-555
    // and 495: 2.87-5.12, transom 3.90), its glazing to 10.4 (the upper band's to 10.7).
    cornerUp: { y: [2.95, 5.1], transom: 3.9, z1: 10.4 },
    // The top storey's band, 11.4-12.6 m, from z -3.85 to 10.65 (v8ia's rows 8-45 and 70-103, columns
    // 700-1475); the solid white to its left is under the raked corner.
    band: { y: [11.4, 12.6], z: [-3.85, 10.65] },
    // Downstairs. The vehicle way: z -9.0 to -5.5, its head at 2.35 m (v8ia: 2.32-2.47; mdk1: 2.20), open,
    // dark inside. The entrance: glazed from pier to pier, -0.35 to 2.1 m (v8ia's rows 590-748), with a
    // door at z -3.7 to -2.2 and a pair at 1.25 to 2.85 (columns 700-790 and 1000-1095). The glazed corner:
    // z 5.1 to 9.8, -0.4 to 1.9 m (columns 1222-1485), white wall beyond it to the edge; above it a glazed
    // canopy, 1.9 to 2.95 m (rows 550-610), standing out about 0.9 m (mdk1) and running past the end's
    // north-west edge (v8ia: to column 1525).
    vehicle: { z: [-9.0, -5.5], head: 2.35 },
    entrance: { y: [-0.35, 2.1], doors: [[-3.7, -2.2], [1.25, 2.85]] },
    corner: { z: [5.1, 9.8], y: [-0.4, 1.9] },
    canopy: { y: [1.9, 2.95], out: 0.9, z1: 11.4 },
  },
};
