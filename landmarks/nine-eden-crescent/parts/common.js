// Shared sizes, measured in the LINZ 2024 LiDAR (data/nine-eden-crescent_pts.npy, building 801's points)
// in the view frame of config/nine-eden-crescent.json: y up from 17.6 m NZVD2016 (the LiDAR ground's
// median round the building); x along the building, its south-west end toward -x, where it meets Eden
// Crescent; z across it; the middle of its roof at x = z = 0. The walls follow building 801's floor
// outline in campus.json, taken into this frame. Owned by the lead: read, do not edit. Measured 2026-10-27.
// How far the walls go below y = 0: the street at the south-west end lies at -0.8 m (-1.16 at p10); the
// ground rises to +4.3 m at the north-east end and to +3 m along part of the south-east side.
export const FOOT = -1.3;

export const MEASURED = {
  // The block: x -18.3 to 21.3, z -9.1 to 9.1 (the outline; a sliver beyond z 9.1 toward its north-east
  // end is left to the block's edge). A flat roof at 14.0 m (the median in every 2 m along it, 13.9-14.1),
  // its parapet to 14.2 m. Along the south-east side (z -9.1 to about -6.8) the top storey slopes back:
  // 10.5 m at z -9 to 12.9 m at z -7 (medians of each 2 m), the sloping edge the photographs show.
  block: { x: [-18.3, 21.3], z: [-9.1, 9.1], roof: 14.0, parapet: 14.2, slope: { z: [-9.1, -6.8], low: 10.5 } },
  // The street end (x -18.3) as the three panoramas show it: three bays between two white piers; the
  // storeys' window bands at 4.4-6.2 m and 7.8-9.6 m, the top storey's band at 11.2-13.2 m, the ground
  // storey glazed from the street (-0.8 m) to 3.0 m, sizes from the photographs against the LiDAR's
  // heights (the roof at 14.0 m, the street at -0.8 m) and the outline's width (18.1 m).
  street: {
    x: -18.3,
    bays: [[-9.1, -5.5], [-4.2, 3.1], [4.0, 9.0]], // z: left (the vehicle way), centre (the entrance), right
    ground: [-0.8, 3.0], bands: [[4.4, 6.2], [7.8, 9.6]], top: [11.2, 13.2], corner: [4.0, 6.6],
  },
};
