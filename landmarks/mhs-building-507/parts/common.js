// Shared sizes, measured in the LINZ 2024 LiDAR (data/mhs-building-507_pts.npy: the returns in the crop box) in the
// view frame of config/mhs-building-507.json: x is -axis (north-north-east), y up from the LiDAR's ground, z is
// toStreet (east-south-east, toward the street); the frame's centre at x = z = 0, the middle of the building's roofs.
// Owned by the lead: read, do not edit.
// Measured 2026-11-09 (round 0): every height below is measured above 68.03 m, the median ground in the first crop
// box, and H moves it on to the door's ground (step 7: 68.50 m, on the pavement before the entrance).
//
// The sizes are given in the building's own frame, u along the south-east block's street face toward the south-south-
// west (the frame's axis, so x = -u) and w toward the street (z = w); `at` and `plan` turn them into the view frame.
//
// Building 507 of the M&HS Building: a south-east block along the street, its finned upper storeys over a glazed base,
// joined by three glazed steps, each set back further, to a north-west block behind it; both under flat roofs at about
// 18 m with raised parts, a lower part on the north-west block's south side, a low strip at the south-east block's
// south end and a canopy over the entrance at the steps' foot. The LiDAR's roofs run up to 4.9 m past the campus map's
// ring in places (the north-west block's west side and corner, the canopy's front and north side; no other block lies
// within 6 m of the ring): the model draws the LiDAR's building. In this frame u runs south-south-west and w
// east-south-east: a side at the least u faces north, at the greatest u south, at the least w west and at the greatest
// w east.
export const at = (u, w) => [-u, w];
/** A height measured above 68.03 m, as one above the door's ground, 68.50 m (the config's `ground`), 0.47 m higher. */
export const H = (h) => h - 0.47;
export const plan = (corners) => corners.map(([u, w]) => at(u, w));

// The ground round the building lies from -0.6 to +1.0, and in the sunken courtyard between its blocks (u 6 to 20, w
// -2 to 2) at -4.1. The walls go down to FOOT.
export const FOOT = H(-4.5);

// The street face: w 31.85 at its north end (u 3.6) to 33.2 at u 40 (2 degrees off the frame's axis), to its south end
// at u 44.3.
export const faceW = (u) => 31.85 + 0.036 * (u - 3.6);

/** The roofs at about 18 m (the cells 17.8 to 18.2; the parapets 18.1 to 18.3): the two blocks and the steps between
 * them, as one plan [u, w], round from the street face's north end. Edges: the street face (0); the south end (u 44.3
 * east of w 16, 46.3 west of it, by the low strip); the south-east block's west side over the sunken courtyard (w 2.27
 * at u 4 to 3.85 at u 46.3, 2 degrees off the axis as the street face); the north-west block's stepped south side over
 * its lower part; its west side (w -43.4), its north side (u -40.0 to -41.2, 1.5 degrees off the axis) and its east
 * side (w 4.6); the three steps (their sides slanting 17 degrees, their fronts at w 10.75, 16.3 and 22.2); the
 * south-east block's north end (u 3.6). */
export const MAIN = {
  top: H(18.05),
  plan: [
    [3.6, faceW(3.6)], [44.3, faceW(44.3)], [44.3, 16.0], [46.3, 16.0], [46.3, 3.85], [4.0, 2.27], [4.0, -2.0],
    [2.0, -2.0], [2.0, -4.0], [0.0, -4.0], [0.0, -6.0], [-2.0, -6.0], [-2.0, -10.0], [-6.0, -10.0], [-6.0, -14.0],
    [-8.0, -14.0], [-8.0, -16.0], [-10.0, -16.0], [-10.0, -43.4], [-40.0, -43.4], [-41.2, 4.6], [-9.9, 4.6],
    [-8.0, 10.75], [-5.3, 10.75], [-3.6, 16.3], [-0.9, 16.3], [0.9, 22.2], [3.6, 22.2],
  ],
  // the edges by index: 0 the street face; 22, 24, 26 the steps' fronts (glazed); 21, 23, 25 their sides (dark)
  face: 0, fronts: [22, 24, 26], sides: [21, 23, 25],
};

// The street face (estimated, from the photograph through its fitted camera): its finned upper storeys from 7.75 m
// (the underside of their front edge) to the parapet, over the glazed base.
export const FACE = { base: H(7.75) };

// The raised parts on the 18 m roofs: the south-east block's middle (20.7 to 20.9), an L; the north-west block's
// strip (20.6 to 20.9), an L; a part at 19.1 to 19.4 south-east of it; and one at 18.9 to 19.2 over the steps' root;
// each to within about 0.5 m of the LiDAR's edges of its returns over 20 (19 for the lower two). The south-east block's
// middle runs 2 degrees off the axis, as the street face: its sides from w 16.4 to 17.1 and from 22.2 to 23.3.
export const RAISED = [
  { top: H(20.8), plan: [[9.0, 16.4], [34.0, 17.1], [34.0, 13.0], [41.0, 13.0], [41.0, 23.3], [9.0, 22.2]] },
  { top: H(20.8), plan: [[-30.5, -40.0], [-21.0, -40.0], [-21.0, -8.0], [-27.0, -8.0], [-27.0, -33.0],
    [-30.5, -33.0]] },
  { top: H(19.25), plan: [[-20.0, -6.5], [-12.0, -6.5], [-12.0, 3.0], [-20.0, 3.0]] },
  { top: H(19.1), plan: [[-4.5, 4.5], [10.0, 4.5], [10.0, 11.0], [-4.5, 11.0]] },
];

// The lower parts: along the north-west block's stepped south side at 9.5 to 9.8 (u to 7.6, w to -42.9); at 5.3 to
// 5.6 beside it, to u 5.25 over the sunken courtyard; and the strip at the south-east block's south end at 9.2 to 9.5,
// from u 44.3 to 50.1 (to 48 at the street) and from w 18.55 (the pavement's ground west of it).
export const LOWER = [
  { top: H(9.65), plan: [[-10.0, -42.9], [7.6, -42.9], [7.6, -12.0], [2.0, -12.0], [2.0, -4.0], [0.0, -4.0],
    [0.0, -6.0], [-2.0, -6.0], [-2.0, -10.0], [-6.0, -10.0], [-6.0, -14.0], [-8.0, -14.0], [-8.0, -16.0],
    [-10.0, -16.0]] },
  { top: H(5.5), plan: [[2.0, -12.0], [5.25, -12.0], [5.25, 2.27], [4.0, 2.27], [4.0, -2.0], [2.0, -2.0]] },
  { top: H(9.35), plan: [[44.3, 18.55], [50.1, 18.55], [50.1, 28.0], [48.0, faceW(48.0)], [44.3, faceW(44.3)]] },
];

// The canopy over the entrance at the steps' foot: its roof 5.0 to 5.3 in the LiDAR, its fascia's foot at 3.1 in the
// photograph (estimated), from the steps out to w 27.75 and on before the third step; its north side one straight line
// from (u -8.2, w 10.75) to (-2.8, 27.75), within 0.15 m of the LiDAR's edge from w 11 to 25.
export const CANOPY = {
  y: [H(3.1), H(5.15)],
  plan: [[-8.2, 10.75], [-5.3, 10.75], [-3.6, 16.3], [-0.9, 16.3], [0.9, 22.2], [3.6, 22.2], [3.6, 27.75],
    [-2.8, 27.75]],
};
