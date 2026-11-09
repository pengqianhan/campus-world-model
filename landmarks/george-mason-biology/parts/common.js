// Shared sizes, measured in the LINZ 2024 LiDAR (data/george-mason-biology_pts.npy: the returns in the crop box) in the
// view frame of config/george-mason-biology.json: x is -axis (south-east), y up from the door's ground, z is toStreet
// (south-west); the frame's centre at x = z = 0, the middle of the building's points near the campus map's ring.
// Owned by the lead: read, do not edit.
// Measured 2026-11-10 (round 0): every height below is measured above 37.30 m, the median ground in the first crop box,
// and H moves it on to the door's ground (36.61 m, on the pavement before the middle of the south-east end).
//
// The sizes are given in the building's own frame, u along its long walls toward the north-west (the frame's axis, so
// x = -u) and w toward the south-west (z = w); `at` and `plan` turn them into the view frame. A side at the least u
// faces south-east, at the greatest u north-west, at the least w north-east and at the greatest w south-west.
//
// Building 106, the George Mason Biology Building: a long block of three storeys, its walls to a parapet at 12.3 and a
// grey attic set back behind it under a low hipped roof; its middle wider on both sides, with two wings to the
// south-west, raised parts over the attic at each end of the middle, and low parts round its foot.
export const at = (u, w) => [-u, w];
/** A height measured above 37.30 m, as one above the door's ground, 36.61 m (the config's `ground`), 0.69 m lower. */
export const H = (h) => h + 0.69;
export const plan = (corners) => corners.map(([u, w]) => at(u, w));

// The ground round the building lies from -1.4 to 1.5 (p5 to p95 in the crop box); the walls go down to FOOT.
export const FOOT = H(-3.0);

/** The long block: its walls (u -29.1 at the south-east end, the end the photograph sees, to 29.4; w -6.0 to 6.0) to
 * the parapet at 12.3 (the LiDAR's 12.2 to 12.6 along the walls); the attic set back about 0.8 m at the ends and 1.4 m
 * on the long sides (u -28.3 to 28.4, w -4.6 to 4.6) to its eaves at 14.7, and its hipped roof to the ridge at 15.8. */
export const MAIN = {
  plan: [[-29.1, -6.0], [29.4, -6.0], [29.4, 6.0], [-29.1, 6.0]],
  top: H(12.3),
  attic: { u: [-28.3, 28.4], w: [-4.6, 4.6], eave: H(14.7), ridge: H(15.8), hip: 3.5 },
};

/** The middle, wider on both sides (u -17.0 to 17.0, w -8.8 to 8.8): its walls to 12.5, its attic (w -7.8 to 7.8) to
 * 14.4 and its roof to the ridge at 16.4; over the attic at each end of it a raised part at 17.2 (16.7 to 17.9, u -17.5
 * to -13.0 and 13.0 to 17.5), each with a vent on its middle at 17.9 (u -15.7 to -14.5 and 14.6 to 16.0, w -0.4 to
 * 0.3); a flue at 18.3 to 18.8 (three returns at u -17.3, w -3) is not drawn. */
export const MIDDLE = {
  plan: [[-17.0, -8.8], [17.0, -8.8], [17.0, 8.8], [-17.0, 8.8]],
  top: H(12.5),
  attic: { u: [-16.3, 16.3], w: [-7.8, 7.8], eave: H(14.4), ridge: H(16.4), hip: 3.2 },
  raised: [
    { top: H(17.2), plan: [[-17.5, -3.9], [-13.0, -3.9], [-13.0, 3.9], [-17.5, 3.9]] },
    { top: H(17.2), plan: [[13.0, -3.9], [17.5, -3.9], [17.5, 3.9], [13.0, 3.9]] },
  ],
  vents: [
    { top: H(17.9), plan: [[-15.7, -0.4], [-14.5, -0.4], [-14.5, 0.3], [-15.7, 0.3]] },
    { top: H(17.9), plan: [[14.6, -0.4], [16.0, -0.4], [16.0, 0.3], [14.6, 0.3]] },
  ],
};

/** The two wings to the south-west (out to w 12.0): their walls to 12.5 and their roofs at 14.2 (u -16.3 to -11.0 and
 * 11.2 to 16.3, w 7.8 to 11.0). */
export const WINGS = [
  { plan: [[-17.0, 8.8], [-10.4, 8.8], [-10.4, 12.0], [-17.0, 12.0]], top: H(12.5),
    roof: { top: H(14.2), plan: [[-16.3, 7.8], [-11.0, 7.8], [-11.0, 11.0], [-16.3, 11.0]] } },
  { plan: [[10.6, 8.8], [17.0, 8.8], [17.0, 12.0], [10.6, 12.0]], top: H(12.5),
    roof: { top: H(14.2), plan: [[11.2, 7.8], [16.3, 7.8], [16.3, 11.0], [11.2, 11.0]] } },
];

/** The low parts: a tower on the north-east side by the south-east wing (15.5, its top flat), a part at 4 to 6 beside
 * each wing in the courtyard between them (its ground about 1 m up, open; their roofs framed in the 2023 aerial,
 * perhaps glass, which the LiDAR sees through to the ground on their courtyard sides), and two low annexes on the
 * south-west side (7.0 by the south-east wing, 4.1 by the north-west end). The returns at 9 to 13 on the north-east
 * side near the south-east end are a tree's (no plane fits them, the LiDAR sees the ground under them and the aerial
 * shows branches): not drawn. */
export const LOW = [
  { top: H(15.5), plan: [[-17.3, -9.1], [-14.8, -9.1], [-14.8, -6.5], [-17.3, -6.5]] },
  { top: H(5.0), plan: [[-10.4, 8.8], [-7.0, 8.8], [-7.0, 11.8], [-10.4, 11.8]] },
  { top: H(5.0), plan: [[7.0, 8.8], [10.6, 8.8], [10.6, 11.8], [7.0, 11.8]] },
  { top: H(7.0), plan: [[-20.7, 6.0], [-17.0, 6.0], [-17.0, 10.5], [-20.7, 10.5]] },
  { top: H(4.1), plan: [[19.0, 6.0], [22.2, 6.0], [22.2, 9.9], [19.0, 9.9]] },
];

/** The south-east end, the face the photograph sees (u -29.1, w -5.9 to 6.0): two pilasters 0.25 m proud of it (the
 * LiDAR's face at u -29.35 at w -1.75 and 1.75), 0.7 m wide (estimated), up to the parapet; in each of its three bays
 * two red-framed windows, 2.6 m wide (clear of the pilasters), in three lights, the lower from 4.05 to 6.45 and the
 * upper from 8.3 to 10.55 (estimated, in the photograph through its fitted camera; the upper ones' arched heads drawn
 * square). */
export const END = {
  u: -29.1,
  proud: 0.25,
  pilasters: [-1.75, 1.75],
  pw: 0.7,
  bays: [-3.95, 0, 3.95],
  ww: 2.6,
  rows: [[H(4.05), H(6.45)], [H(8.3), H(10.55)]],
  lights: 3,
};

/** Past the north-west end, a canopy at 6.6 (the LiDAR's 6.56, u 29.4 to 31.7, w -1.8 to 4.0), hung from the end wall,
 * its roof 0.4 m deep (estimated); a face on its outer edge (the LiDAR's returns on one plane at u 31.2 to 31.7, from
 * 3.6 up, one return lower, at 2.6, left out) and one on its south-west side (at w 3.5 to 4.0, its returns from 5.5 up,
 * drawn from 5.0). The LiDAR sees the ground under its outer part and not where the faces end below (estimated). */
export const CANOPY = {
  y: [H(6.2), H(6.6)],
  plan: [[29.4, -1.8], [31.7, -1.8], [31.7, 4.0], [29.4, 4.0]],
  faces: [
    { y: [H(3.6), H(6.2)], plan: [[31.4, -1.8], [31.7, -1.8], [31.7, 4.0], [31.4, 4.0]] },
    { y: [H(5.0), H(6.2)], plan: [[29.4, 3.7], [31.4, 3.7], [31.4, 4.0], [29.4, 4.0]] },
  ],
};
