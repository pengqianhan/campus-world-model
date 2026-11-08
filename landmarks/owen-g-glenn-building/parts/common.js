// Shared sizes, measured in the LINZ 2024 LiDAR (data/owen-g-glenn-building_pts.npy: the building returns, class 6,
// and the ground's, classes 1 and 2, in the crop box) in the view frame of config/owen-g-glenn-building.json: x is
// -axis (south-west), y up from the frame's ground, z is toStreet (north-west); the frame's centre at x = z = 0.
// Owned by the lead: read, do not edit. Measured 2026-11-09 (round 0), before the door was set: every height below
// is measured above 24.46 m NZVD2016, the median ground in the crop box, and H moves it on to the door's ground.
//
// How: the highest return in 0.5 m cells; each part's cells (by height, near the campus map's ring moved onto the
// LiDAR: the placement's offset and turn) closed, filled, and their outline simplified to 0.6 m (the deck's to
// 0.9 m), in the building's own frame: u along the axis (north-east, -x), w along toStreet (north-west, z). The
// heights are the returns' p50 inside each plan.

/** A height measured above 24.46 m, as one above the door's ground, 5.16 m higher (the config's `ground`, 29.62 m,
 * on the plaza before the canopy). */
const H = (h) => h - 5.16;

// The lowest the walls go: the ground within 3 m outside the deck falls to 10.98 m (-13.48) east of the building's
// east arm, where the site drops into Grafton Gully (and rises to 31.21 m, 6.75 m above 24.46 m, on the west).
export const FOOT = H(-14.0);

export const MEASURED = {
  // The deck: the plaza north-east of the curved wing and the floors under it, the returns at 28.4 m and over inside
  // the ring (its cells 9,556 m2), its top the plaza's at 29.58 m (the returns' p10; p50 of the plaza's 29.60). On
  // the north it stops at the driveway falling to 25 m; on the east and south the ground falls away from it to the
  // gully. Its top over the strip between the west wing and the curved wing's south arm, where the LiDAR has no
  // return (a glazed roof, perhaps), is the plaza's height (estimated). Where its edge was traced on the curved wing's
  // (a recess in the wing's south face, u 13.3 to 15.8), it is moved 0.1 m out (w -34.9 to -35.0), so that the two
  // faces do not lie in one plane.
  deck: {
    plan: [[81.8, 30.6], [81.9, 24.6], [67.7, 27.2], [67.6, 3.9], [73.7, 3.6], [73.7, 0.4], [67.7, 0.0],
      [68.9, -15.2], [67.2, -15.6], [67.0, -33.6], [42.6, -34.2], [40.6, -40.6], [26.8, -40.4], [26.4, -41.5],
      [20.1, -41.2], [19.3, -37.7], [15.8, -35.0], [13.3, -35.0], [-3.9, -43.6], [-17.3, -19.4],
      [-41.3, -19.3], [-46.0, -43.4], [-64.8, -40.1], [-63.4, -34.4], [-67.7, -30.5], [-50.4, 0.8],
      [-50.5, 4.0], [-55.4, 4.6], [-55.1, 6.7], [-35.6, 30.3], [-27.9, 37.4], [-18.8, 50.3], [15.1, 51.4],
      [15.1, 52.8], [17.2, 52.8], [18.5, 60.6], [26.9, 69.6], [30.9, 65.7], [31.0, 53.7], [42.3, 53.1],
      [42.4, 50.3], [47.0, 50.0], [47.0, 48.9], [43.4, 48.2], [34.2, 48.1], [34.7, 36.8], [54.9, 36.6],
      [56.0, 31.3], [76.2, 30.9], [77.6, 31.9]],
    top: H(5.12),
  },
  // The curved wing: a Y of three arms (north, south-west and east) round a curve, its roof at 52.83 m (p50; 52.6 to
  // 52.9 over most of it), the crown of louvres along its top to 53.8 m on the sides the LiDAR shows it on (below);
  // its cells 3,282 m2.
  wing: {
    plan: [[27.9, 47.6], [27.7, 31.0], [29.8, 31.0], [30.2, 28.9], [15.0, 29.1], [10.4, 28.0], [-12.0, 12.9],
      [-16.2, 8.6], [-17.2, 5.4], [-17.2, 0.8], [-14.3, -4.1], [-4.0, -10.0], [-1.1, -10.7], [31.6, -27.3],
      [31.2, -28.7], [28.1, -28.4], [25.0, -35.8], [24.3, -35.8], [24.7, -41.1], [21.8, -40.1], [20.4, -37.3],
      [17.9, -37.0], [15.8, -34.9], [13.3, -34.9], [7.3, -38.9], [5.9, -38.9], [3.8, -41.0], [-0.8, -42.9],
      [-1.4, -45.7], [-2.9, -46.1], [-17.3, -19.4], [-22.6, -19.1], [-41.3, -19.3], [-41.7, -23.2],
      [-43.0, -26.0], [-43.0, -31.0], [-45.3, -44.8], [-64.4, -41.8], [-65.5, -40.8], [-49.9, -11.6],
      [-46.4, -6.6], [-45.4, -3.4], [-43.7, -1.6], [-43.7, -0.2], [-37.4, 9.8], [-30.1, 19.4], [-12.7, 37.3],
      [-9.8, 37.7], [-7.0, 34.2], [-5.2, 34.2], [-2.7, 35.3], [-1.7, 37.0], [3.6, 38.9], [8.5, 43.9],
      [9.5, 43.9], [10.6, 40.7], [13.1, 40.8], [13.5, 41.8], [16.6, 41.5], [18.0, 42.9], [20.9, 43.0]],
    roof: H(28.37),
    // The crown of louvres, to 53.8 m (29.34), along the sides of the plan (by index: side i runs from corner i to
    // i + 1) 4 m long or more where the returns within 1.2 m of the side reach 53.5 m or more (p95 53.69 to 53.88),
    // and the shorter sides between two of those (7, 11, 40 to 42); along the other long sides the returns stop at
    // the roof (p95 52.78 to 52.92). Its width, 0.3 m, is estimated.
    crown: {
      top: H(29.34), width: 0.3,
      sides: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 17, 29, 34, 35, 38, 39, 40, 41, 42, 43, 44, 45, 60],
    },
    // The faces (round 1; estimated, with the photograph as a reference: its edges on the east arm's inner face
    // through its fitted camera, on the face's plane, scaled so that its foot and its crown fall at the plaza's
    // 29.6 m and the crown's 53.8 m): an open ground storey to 33.5 m (9.04), two storeys of glass to 41.4 m
    // (16.94), three storeys each of a white spandrel and a band of louvres and windows, 3.4 m apart, and a white
    // fascia from 51.6 m (27.14) to the roof. Each band [bottom, top] above 24.46 m.
    faces: {
      ground: [H(5.12), H(9.04)],
      glazed: [H(9.04), H(16.94)],
      spandrels: [[H(16.94), H(18.39)], [H(20.34), H(21.64)], [H(23.74), H(25.09)]],
      louvres: [[H(18.39), H(20.34)], [H(21.64), H(23.74)], [H(25.09), H(27.14)]],
      fascia: H(27.14),
    },
  },
  // On it, along the west side of its north and south-west arms, a top storey at 56.57 m (p50), its cells 560 m2.
  top: {
    plan: [[9.6, 41.8], [10.7, 40.0], [9.6, 37.9], [-17.0, 19.9], [-20.2, 17.4], [-23.3, 12.8], [-25.4, 6.4],
      [-23.8, -12.0], [-24.5, -12.7], [-39.3, -12.5], [-39.8, -3.3], [-37.7, 3.0], [-36.0, 4.8], [-33.2, 11.2],
      [-31.5, 12.3], [-29.0, 16.2], [-21.7, 23.0], [-10.8, 29.9], [-6.2, 33.8], [-2.7, 35.3], [-1.7, 37.0],
      [1.8, 37.8], [6.7, 41.4]],
    roof: H(32.11),
  },
  // The west wing, along the road on the west, west of the south-west arm: its roof at 46.06 m (p50), its cells
  // 502 m2.
  west: {
    plan: [[-27.8, 30.7], [-23.8, 26.9], [-24.5, 24.4], [-30.1, 19.4], [-37.4, 9.8], [-43.7, -0.2], [-43.7, -1.6],
      [-45.4, -3.4], [-61.3, -33.3], [-62.4, -34.4], [-64.9, -33.7], [-67.7, -31.6], [-67.7, -30.5],
      [-63.6, -24.1], [-61.5, -18.4], [-59.4, -16.3], [-59.4, -14.9], [-54.2, -5.3], [-52.1, -3.1],
      [-48.0, 6.1], [-39.3, 19.3], [-35.1, 22.9], [-29.5, 30.7]],
    roof: H(21.6),
  },
  // West of the west wing's north end, a lower part at 35.13 m (p50), its cells 131 m2.
  westLow: {
    plan: [[-37.2, 23.2], [-36.9, 20.4], [-40.0, 19.3], [-40.0, 17.9], [-44.5, 11.8], [-44.9, 8.6], [-46.3, 8.6],
      [-49.0, 2.9], [-50.4, 2.5], [-50.5, 4.0], [-51.9, 4.6], [-55.4, 4.6], [-55.4, 6.4], [-54.0, 8.5],
      [-44.3, 20.6], [-40.8, 24.2]],
    roof: H(10.67),
  },
  // The north-east building: a rectangle on the deck north-east of the plaza, its roof at 35.85 m (p50), its cells
  // 1,222 m2.
  ne: {
    plan: [[68.4, 31.1], [68.7, 3.2], [68.4, 2.1], [65.5, 2.1], [65.6, -1.1], [69.5, -2.1], [69.6, -16.6],
      [42.1, -16.5], [41.5, -1.7], [46.5, -0.9], [46.4, 2.2], [41.8, 2.5], [42.2, 31.2]],
    roof: H(11.39),
  },
  // The sloping canopy in the curve's inner corner, a triangle in plan: its low edge from its north end (u 2.33,
  // w 22.56; 33.65 m) to its east end at the east arm's face (u 0.63, w -13.81; 34.5 m), rising south-west into the
  // curve (42.1 m where the returns reach the curve's faces). Its top a plane fitted to its 2,445 returns (rms
  // 0.73 m): 34.99 m - 0.4588 u - 0.0148 w, above 24.46 m 10.527 - 0.4588 u - 0.0148 w. Its third corner (u -19.51,
  // w 3.07) lies inside the curved wing.
  canopy: {
    plan: [[2.33, 22.56], [0.63, -13.81], [-19.51, 3.07]],
    top: (u, w) => H(10.527 - 0.4588 * u - 0.0148 * w),
  },
};

/** The point [x, z] of the view frame at u and w in the building's frame. */
export function at(u, w) {
  return [-u, w];
}

/** The rectangle from u0 to u1 and w0 to w1, as a plan [[x, z] x 4]. */
export function rect([u0, u1], [w0, w1]) {
  return [at(u0, w0), at(u1, w0), at(u1, w1), at(u0, w1)];
}

/** A plan from [u, w] corners. */
export function plan(corners) {
  return corners.map(([u, w]) => at(u, w));
}
