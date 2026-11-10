// Shared sizes, measured in the LINZ 2024 LiDAR (data/building-114_pts.npy: the returns in the crop box) in the view
// frame of config/building-114.json: x is -axis (south-east), y up from the door's ground, z is toStreet (south-west);
// the frame's centre at x = z = 0, the middle of the building's points near the campus map's ring.
// Owned by the lead: read, do not edit.
// Measured 2026-11-11 (round 0): every height below is measured above 38.65 m, the median ground in the outline's
// band, and H moves it on to the door's ground (38.04 m, on the path before the steps up to the stair tower's doors).
//
// The sizes are given in the building's own frame, u along its long walls toward the north-west (the frame's axis, so
// x = -u) and w toward the south-west (z = w); `at` and `plan` turn them into the view frame. A side at the least u
// faces south-east, at the greatest u north-west, at the least w north-east and at the greatest w south-west.
//
// Building 114: a long block of two storeys under a flat roof with a deep eave all round, a raised strip down the
// middle of the roof, and a glass stair tower on its south-west face.
export const at = (u, w) => [-u, w];
/** A height measured above 38.65 m, as one above the door's ground, 38.04 m (the config's `ground`), 0.61 m lower. */
export const H = (h) => h + 0.61;
export const plan = (corners) => corners.map(([u, w]) => at(u, w));

// The ground round the building lies from -2.1 to 1.1 (37.6 at the south-east end of the south-west face to 39.7 at
// its north-west end, and down to 36.5 along the north-east face); the walls go down to FOOT.
export const FOOT = H(-2.6);

/** The walls: the south-west face at w 8.1 (the LiDAR sees the ground under the eave up to w 8.0, and its returns on
 * the face at 8.0 to 8.5), the north-east at -8.2 (the ground seen to -8.0 to -9.0), the south-east end at u -28.6 and
 * the north-west end at 28.2 (the returns on the end walls, p50); the ground storey's floor at 0.40 (the returns on the
 * floor inside the stair tower's doors, 39.0 to 39.25). */
export const WALLS = {
  plan: [[-28.6, -8.2], [28.2, -8.2], [28.2, 8.1], [-28.6, 8.1]],
  floor: H(0.40),
};

/** The eave all round: the roof's edge (u -29.6 to 29.1, w -9.6 to 9.8; the LiDAR's roof cells to p99.5) at 8.35 (the
 * returns along the edge, 46.97 to 47.07 m), its underside at 8.0 (estimated: where the photograph's window heads meet
 * it, through its fitted camera); the flat roof inside it at 8.55 (the LiDAR's 47.17 to 47.28), and a raised strip down
 * its middle (u -26 to 25, w -4 to 4) at 10.05 (the LiDAR's 48.7). */
export const ROOF = {
  plan: [[-29.6, -9.6], [29.1, -9.6], [29.1, 9.8], [-29.6, 9.8]],
  edge: H(8.35),
  fascia: 0.35,
  top: H(8.55),
  strip: { plan: [[-26.0, -4.0], [25.0, -4.0], [25.0, 4.0], [-26.0, 4.0]], top: H(10.05) },
};

/** The glass stair tower on the south-west face: u -18.0 to -14.5 (the LiDAR's returns on its front from -17.8 to
 * -14.4; the photograph's edges through its camera at -18.06 and -14.73), its glass front at w 9.3 (the returns on it,
 * w 8.9 to 9.5, at 1.3 to 5.6 over the ground), from the floor to the eave's underside. */
export const TOWER = {
  plan: [[-18.0, 8.1], [-14.5, 8.1], [-14.5, 9.3], [-18.0, 9.3]],
};

/** The south-west face where the photograph sees it, u -28.6 (the south-east end) to -3.1 (the photograph's left edge),
 * every height and place estimated through its fitted camera: the upper storey's window band from 6.25 to 8.0 (under
 * the eave), its white mullions about 1.17 m apart; the cladding under it down to a floor band from 3.4 to 3.8; the
 * ground storey's windows from 2.0 to 3.4 between dark posts about 3.2 m apart, white panels under them. The rest of
 * the face, and the other faces, which no photograph shows, are drawn plain. */
export const FACE = {
  w: 8.1,
  u: [-28.6, -3.1],
  upper: [H(6.25), H(8.0)],
  mullions: [-4.23, -5.41, -6.65, -7.83, -9.04, -10.16, -11.38, -12.63, -13.73, -19.59, -20.68, -21.85, -23.03, -24.13,
    -25.23, -26.46, -27.5],
  band: [H(3.4), H(3.8)],
  lower: [H(2.0), H(3.4)],
  posts: [-5.1, -8.4, -11.6, -21.2, -24.3, -27.5],
};

/** The stair tower's front (estimated through the photograph's camera, its edges at the LiDAR's): white mullions at
 * u -15.6 and -16.9 between its edges, transoms at 2.35 (the doors' head), 2.8, 3.45, 4.9, 5.45 and 6.85; the red double
 * doors from the floor to 2.35, u -17.45 to -15.85; four brick steps before them down to the ground (38.17 m, the LiDAR's
 * p50 before the tower), from a landing at the floor 1.1 m deep, each 0.6 m deep (estimated), u -17.8 to -14.3. */
export const TOWER_FRONT = {
  mullions: [-15.6, -16.9],
  transoms: [H(2.35), H(2.8), H(3.45), H(4.9), H(5.45), H(6.85)],
  doors: { u: [-17.45, -15.85], top: H(2.35) },
  steps: { u: [-17.8, -14.3], landing: 1.1, tread: 0.6, ground: H(-0.48) },
};
