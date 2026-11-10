// Shared sizes, measured in the LINZ 2024 LiDAR (data/building-114_pts.npy: the returns in the crop box) in the view
// frame of config/building-114.json: x is -axis (south-east), y up from the door's ground, z is toStreet (south-west);
// the frame's centre at x = z = 0, the middle of the building's points near the campus map's ring.
// Owned by the lead: read, do not edit.
// Measured 2026-11-11 (round 0): every height below is measured above 38.65 m, the median ground in the outline's
// band, and H moves it on to the door's ground.
//
// The sizes are given in the building's own frame, u along its long walls toward the north-west (the frame's axis, so
// x = -u) and w toward the south-west (z = w); `at` and `plan` turn them into the view frame. A side at the least u
// faces south-east, at the greatest u north-west, at the least w north-east and at the greatest w south-west.
//
// Building 114: a long block of two storeys under a flat roof with a deep eave all round, a raised strip down the
// middle of the roof, and a glass stair tower on its south-west face.
export const at = (u, w) => [-u, w];
/** A height measured above 38.65 m, as one above the door's ground (the config's `ground`). */
export const H = (h) => h;
export const plan = (corners) => corners.map(([u, w]) => at(u, w));

// The ground round the building lies from -1.1 to 1.1 (37.6 at the south-east end of the south-west face to 39.7 at
// its north-west end); the walls go down to FOOT.
export const FOOT = H(-1.6);

/** The walls: the south-west face at w 8.1 (the LiDAR sees the ground under the eave up to w 8.0, and its returns on
 * the face at 8.0 to 8.5), the north-east at -8.2 (the ground seen to -8.0 to -9.0), the south-east end at u -28.6 and
 * the north-west end at 28.2 (the returns on the end walls, p50); the ground storey's floor at 0.40 (the returns on the
 * floor inside the stair tower's doors, 39.0 to 39.25). */
export const WALLS = {
  plan: [[-28.6, -8.2], [28.2, -8.2], [28.2, 8.1], [-28.6, 8.1]],
  floor: H(0.40),
};

/** The eave all round: the roof's edge (u -29.6 to 29.1, w -9.6 to 9.8; the LiDAR's roof cells to p99.5) at 8.35 (the
 * returns along the edge, 46.97 to 47.07 m), its fascia 0.5 m deep (estimated); the flat roof inside it at 8.55 (the
 * LiDAR's 47.17 to 47.28), and a raised strip down its middle (u -26 to 25, w -4 to 4) at 10.05 (the LiDAR's 48.7). */
export const ROOF = {
  plan: [[-29.6, -9.6], [29.1, -9.6], [29.1, 9.8], [-29.6, 9.8]],
  edge: H(8.35),
  fascia: 0.5,
  top: H(8.55),
  strip: { plan: [[-26.0, -4.0], [25.0, -4.0], [25.0, 4.0], [-26.0, 4.0]], top: H(10.05) },
};

/** The glass stair tower on the south-west face: u -18.0 to -14.2, its glass front at w 9.3 (the LiDAR's returns on it,
 * w 8.9 to 9.5, at 1.3 to 5.6 over the ground), from the floor to the eave's underside. */
export const TOWER = {
  plan: [[-18.0, 8.1], [-14.2, 8.1], [-14.2, 9.3], [-18.0, 9.3]],
};
