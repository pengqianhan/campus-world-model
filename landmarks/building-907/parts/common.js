// Shared sizes, measured in the LINZ 2024 LiDAR (data/building-907_pts.npy: the returns in the crop box) in the view
// frame of config/building-907.json: x is -axis (east-south-east, along the hall's vault), y up from the LiDAR's
// ground, z is toStreet (south-south-west, toward the annex); the frame's centre at x = z = 0, the middle of the
// vault's top. Owned by the lead: read, do not edit.
// Measured 2026-11-09 (round 0): every height below is measured above 53.19 m, the median ground in the first crop
// box, and H moves it on to the door's ground once the door is set.
//
// The sizes are given in the building's own frame, u along the vault toward the hall's west-north-west end (the
// frame's axis, so x = -u) and w toward the annex (z = w); `at`, `plan` and `rect` turn them into the view frame.
//
// A hall under a barrel vault, about 46 m long and 30 m across, its crown about 10 m over the ground and its eaves
// about 6.2 m, with a two-storey annex on its south-south-west side near its west-north-west end, whose roof falls
// away from the hall.
export const at = (u, w) => [-u, w];
/** A height measured above 53.19 m, as one above the door's ground (the config's `ground`). */
export const H = (h) => h;
export const plan = (corners) => corners.map(([u, w]) => at(u, w));
export const rect = ([u0, u1], [w0, w1]) => plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]);

// The ground round it lies between -1.0 and +0.7 (the 2.5 m round the hall and the annex). The walls go down to FOOT.
export const FOOT = H(-1.3);

export const HALL = {
  // Its ends at u -22.9 and 23.0 (the outermost 0.3% of the roof's returns between 4 and 12 m, along the whole
  // width), its sides at w -15.15 and 15.15 (the same, along the whole length): the eaves run parallel to the axis
  // to 0.1 m.
  u: [-22.9, 23.0], w: 15.15,
  // The vault, the same all along: the median of the roof's returns in 1 m strips across it (u -20 to 20), the two
  // sides averaged (they differ by 0.05 m at most): [w, height]. The crown 10.03; the eave, 6.2, is carried on from
  // the last two strips (6.85 at 13.5, 6.43 at 14.5).
  vault: [[0, 10.03], [1.5, 9.99], [3.5, 9.82], [5.5, 9.51], [7.5, 9.07], [9.5, 8.49], [11.5, 7.75], [13.5, 6.85],
          [15.15, 6.2]].map(([w, h]) => [w, H(h)]),
};

export const ANNEX = {
  // Its roof's returns from u 9.2 to 21.8 and w 13.0 to 24.6 (the outermost 0.3%): its walls round them. It rises
  // over the hall's eave by about 2 m where it meets it.
  u: [9.2, 21.8], w: [13.0, 24.6],
  // Its roof falls from the hall, a plane through the medians of its returns in 1 m strips (8.05 at w 16.5, 7.09 at
  // 24.5): 8.5 at w 13.0, 7.05 at its far side.
  top: [H(8.5), H(7.05)],
};
