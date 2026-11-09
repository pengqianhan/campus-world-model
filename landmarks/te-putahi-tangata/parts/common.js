// Shared sizes, measured in the LINZ 2024 LiDAR (data/te-putahi-tangata_pts.npy: the returns in the crop box) in the
// view frame of config/te-putahi-tangata.json: x is -axis (south-west), y up from the door's ground, z is toStreet
// (north-west, toward the street); the frame's centre at x = z = 0, the middle of the building's points over 3 m.
// Owned by the lead: read, do not edit.
// Measured 2026-11-09 (round 0): every height below is measured above 28.33 m, the median ground in the first crop
// box, and H moves it on to the door's ground (35.50 m, on the plaza before the entrance's canopy).
//
// The sizes are given in the building's own frame, u along the street front toward the north-east (the frame's axis,
// so x = -u) and w toward the street (z = w); `at` and `plan` turn them into the view frame. A side at the least u
// faces south-west, at the greatest u north-east, at the least w south-east and at the greatest w north-west.
//
// Building 201, Te Pūtahi Tangata: on the street a hall, its glazed front under a folded roof whose ridges run back
// from the street; at its north-east end a block clad in pale metal, with a raised part on its roof; and behind both,
// down the slope (the ground falls about 11 m from the street to the building's south-east side), a long block whose
// roofs stand about 25 m over the street, with raised strips, a stair's core on its south-east side and a low podium
// beside it.
export const at = (u, w) => [-u, w];
/** A height measured above 28.33 m, as one above the door's ground, 35.50 m (the config's `ground`), 7.17 m higher. */
export const H = (h) => h - 7.17;
export const plan = (corners) => corners.map(([u, w]) => at(u, w));

// The ground round the building lies from 7.2 to 7.8 on the street side and at -4.1 to -3.4 on the south-east side.
// The walls go down to FOOT.
export const FOOT = H(-4.5);

/** The hall: its walls (u -18.2 to the north-east block at 16.2; its glazed front at w 40.2, set back to 33.4 at its
 * south-west end; its back on the long block at w -4.5) and its folded roof, whose ridges (19.1 to 19.4) and valleys
 * (16.9 to 17.2) run back from the street 7.3 m apart, from w -4.5 out to 42.0 over the street (the roof's top, the
 * LiDAR's cells at 34 to 42 m out), falling 0.75 m from the front to the back (the ridges 19.1 to 19.3 at w 32 to 40,
 * 18.4 to 18.9 at w 0 to 8; the valleys 16.9 to 17.2 and 16.4 to 16.9). `fold`: the roof's top at the front along u,
 * [u, height], from its south-west end. */
export const HALL = {
  plan: [[-18.2, -4.5], [16.2, -4.5], [16.2, 40.1], [-15.9, 40.2], [-15.9, 33.4], [-18.2, 33.4]],
  // the edges by index that are glazed: the front, and the two faces of the step at its south-west end
  front: [2, 3, 4],
  fold: [[-18.2, 18.8], [-15.0, 17.05], [-11.4, 19.25], [-7.6, 17.05], [-4.0, 19.25], [-0.3, 17.05], [3.4, 19.25],
    [7.0, 17.05], [10.6, 19.25], [14.3, 17.05], [16.2, 18.2]].map(([u, h]) => [u, H(h)]),
  w: [-4.5, 42.0],
  fall: 0.75,
  // The roof's plates, deep (estimated, from the photograph through its fitted camera: under the ridge at u -11.4 the
  // glass meets the plate's underside at about 17.9, 1.45 m under the LiDAR's top; the plates' tops at the front are
  // hidden by leaves).
  t: 1.4,
};

// The entrance's canopy, in front of the glass left of the hall's middle: its top at 10.85 in the LiDAR (u -0.27 to
// 6.76, out to w 42.2), 0.55 m deep in the photograph (estimated).
export const CANOPY = { plan: [[-0.27, 40.1], [6.76, 40.1], [6.76, 42.2], [-0.27, 42.2]], y: [H(10.3), H(10.85)] };

/** The north-east block: its roof at 23.9 to 24.6 (the parapet's cells 25), its front at w 44.2 from u 20.5 to 36.5
 * and at 40 beside it; the raised part on it (27.0 to 27.5) from u 14, over the hall's end, to 27; the faces toward
 * the street and the hall pale metal, as the photograph shows the hall's side, the others plain. `pale`: the edges by
 * index that are clad. */
export const NE = {
  plan: [[16.2, 0.0], [37.6, 0.0], [37.6, 40.0], [36.5, 40.0], [36.5, 44.2], [20.5, 44.2], [20.5, 40.0], [16.2, 40.0]],
  top: H(24.35),
  pale: [3, 4, 5, 6, 7],
  raised: { plan: [[14.0, 8.0], [27.0, 8.0], [27.0, 28.0], [14.0, 28.0]], top: H(27.35) },
};

/** The long block behind: its roofs at 31.2 to 32.2 (u -44.5 to 34, w -26 to -4.5, and on to w 0 at u -40 to -28 and
 * 20 to 30); strips 2 to 3 m wide at 34.5 to 35 across its middle and raised parts at 37.2 to 38 at each end of it,
 * toward the hall; the stair's core at 33.2 to 33.6 on its south-east side; the podium at 7.6 to 8.0 (its parapets to
 * 9) and 12 beside it; and its south-west end at 9. */
export const SOUTH = {
  main: { top: H(31.95), plan: [[-44.5, -26.0], [34.0, -26.0], [34.0, -4.5], [30.0, -4.5], [30.0, 0.0], [20.0, 0.0],
    [20.0, -4.5], [-28.0, -4.5], [-28.0, 0.3], [-40.0, 0.3], [-40.0, -4.5], [-44.5, -4.5]] },
  raised: [
    // their north sides 0.1 m back from the block's, so that the block's roof edge and their walls do not lie in one plane
    { top: H(37.7), plan: [[-40.0, -15.5], [-22.0, -15.5], [-22.0, -4.6], [-40.0, -4.6]] },
    { top: H(37.7), plan: [[12.0, -15.5], [30.0, -15.5], [30.0, -4.6], [12.0, -4.6]] },
    // the strips over the middle, 34.5 to 35.0 (drawn solid: the LiDAR's returns there lie both at their top and on the
    // roof under them, screens or roof lights that no photograph shows), 1 to 2 m apart
    ...[[-20.0, -17.0], [-16.0, -13.0], [-11.0, -8.0], [-5.0, -2.0], [-1.0, 2.0], [4.0, 7.0], [9.0, 11.0]]
      .map(([u0, u1]) => ({ top: H(34.8), plan: [[u0, -18.0], [u1, -18.0], [u1, -6.5], [u0, -6.5]] })),
  ],
  low: [
    { top: H(33.4), plan: [[-18.5, -34.5], [-1.5, -34.5], [-1.5, -26.0], [-18.5, -26.0]] },
    { top: H(7.9), plan: [[-46.0, -32.5], [-18.5, -32.5], [-18.5, -26.0], [-46.0, -26.0]] },
    { top: H(12.0), plan: [[-1.5, -35.0], [8.0, -35.0], [8.0, -26.0], [-1.5, -26.0]] },
    { top: H(7.9), plan: [[8.0, -33.0], [37.0, -33.0], [37.0, -26.0], [8.0, -26.0]] },
    { top: H(9.0), plan: [[-49.3, -24.5], [-44.5, -24.5], [-44.5, -3.8], [-49.3, -3.8]] },
    // the link between the long block and the hall's south-west end, 11 to 14
    { top: H(13.5), plan: [[-26.8, -4.5], [-18.2, -4.5], [-18.2, 4.7], [-26.8, 4.7]] },
  ],
};
