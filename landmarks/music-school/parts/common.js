// Shared sizes, measured in the LINZ 2024 LiDAR (data/music-school_pts.npy: building 250's returns more than
// 3 m above the frame's ground and within 1.5 m of building.outline, none of its neighbours': the config's
// outline_note) in the view frame of config/music-school.json: x is -axis (north-west, along the face to the
// car park), y up from the frame's ground (32.7 m NZVD2016, the LiDAR's at `door`, the foot of the face to the
// car park), z is toStreet (north-east, toward the car park and the panorama); the centre of the roofs at
// x = z = 0. Owned by the lead: read, do not edit. Measured 2026-11-02 (baseline, round 0).
//
// How the roofs were fitted: the selected returns' medians in 0.5 m cells, each region of the plan below
// fitted by least squares (soft L1), the share of its cells within 0.5 m of the fit given with it.

// The ground (the LiDAR's ground returns, relative to 32.7): before the face to the car park -0.96 to +1.03
// (falling to the south-east along it), along the north-west side by the road +1.4 to +2.1, along the
// south-east side, where the Overbridge (202) runs, -3.9 to -3.0. Within 2 m of the outline: p1 -3.75, p99
// +2.15. The walls go down to FOOT.
export const FOOT = -4.5;

export const MEASURED = {
  // The auditorium to the east: a fan-shaped plan under a roof of grey metal in facets round one high point
  // near its south side (the 2023 aerial shows the facets' seams running out from it). A cone fits it: the
  // apex at (-9.79, 1.31), 12.50 m, falling 0.268 a metre with the distance from it (1,227 cells, residuals
  // p10/p50/p90 -0.09/+0.01/+0.11, 92% within 0.5 m). Its plan from the edges of its returns above 7.3 m
  // (0.5 m mask, closed, simplified), its south side where the cone's heights end against the ranges' lower
  // roofs (at z -0.5 to -2).
  fan: {
    plan: [[-2.6, -0.5], [-2.6, 11.8], [-8.2, 16.4], [-18.2, 16.4], [-22.0, 8.0], [-22.0, -0.5], [-20.0, -2.0], [-12.5, -2.0], [-11.0, -0.5]],
    apex: [-9.79, 1.31], top: 12.5, fall: 0.268,
  },
  // The north wing: a flat roof at 5.16 m (the median of its 917 cells; residuals p10/p50/p90 -0.09/0/+0.41,
  // 89% within 0.5 m), from the face to the car park (z 16.4, where the canopy's returns begin) round the
  // courtyard, whose curved edge is the edge of its returns.
  north: {
    plan: [[1.5, 16.4], [21.8, 16.4], [23.0, 14.0], [23.0, 1.6], [18.4, 1.6], [18.4, -2.6], [15.0, -2.6], [14.5, 3.75],
      [10.25, 8.5], [8.75, 9.5], [5.25, 10.0], [4.0, 11.0], [2.5, 13.25], [1.5, 15.0]],
    top: 5.16,
  },
  // The parapet on the face to the car park: a thin wall over the north wing's edge, its returns at z 15.8-16.5
  // (taken as 16.05-16.4), stepping up toward the north corner. Its top, the highest return in each 0.5 m of x
  // (1-10 returns each): 5.45-5.69 from x 1.5 to 9.0, then 5.83, 6.16, 6.35 to 6.73 at x 11.0; 6.68-6.80 to
  // x 15.0; then 7.07, 7.38, 7.54, 7.69, 7.99 to 8.29 at x 17.5; 8.26-8.45 to x 22.2. Drawn as those steps,
  // [x where a step begins, its top].
  parapet: {
    z: [16.05, 16.4], x: [1.5, 22.2],
    steps: [[1.5, 5.52], [9.0, 5.85], [10.0, 6.16], [10.5, 6.35], [11.0, 6.74], [15.0, 7.07], [15.5, 7.38], [16.0, 7.54],
      [16.5, 7.69], [17.0, 7.99], [17.5, 8.3]],
  },
  // The canopy along the face to the car park, its curved corrugated sheet seen in the photographs: its section
  // from the medians of its returns over x 3-20 in 0.25 m strips of z: 4.55 at z 16.5, 4.47, 4.39, 4.26, 4.07,
  // 3.75 and 3.42 at z 18.0. It ends where its returns end, x 1.5 to 21.8 and z 18.4 (the outline's edge,
  // 18.21-18.45); the last point of the section, (18.4, 2.9), carries the curve on to that edge (estimated).
  canopy: {
    x: [1.5, 21.8],
    section: [[16.4, 4.6], [16.75, 4.47], [17.0, 4.39], [17.25, 4.26], [17.5, 4.07], [17.75, 3.75], [18.0, 3.42], [18.4, 2.9]],
    thick: 0.08, // the sheet and its frame (estimated)
  },
  // The south range: a low-pitched gable along x, its ridge at z -14.04, 9.65 m, falling 0.120 a metre to the
  // courtyard side (+z) and 0.339 to the south-west (1,460 cells; residuals p10/p50/p90 -0.29/-0.04/+0.47, 86%
  // within 0.5 m). The 2023 aerial shows it pale.
  south: {
    plan: [[-10.5, -7.0], [14.8, -7.0], [14.8, -3.0], [18.4, -3.0], [18.4, -15.0], [15.5, -15.5], [15.5, -20.5], [-0.75, -20.5], [-10.5, -20.5]],
    ridge: -14.04, top: 9.65, fallIn: 0.12, fallOut: 0.339,
  },
  // The south-east part, between the auditorium and the south range: a gable along z, its ridge at x -10.25,
  // 10.06 m, falling 0.266 a metre to +x and 0.181 to -x (773 cells; residuals p10/p90 -1.05/+1.00, 70% within
  // 0.5 m: its hips are not yet drawn).
  southeast: {
    plan: [[-21.5, -2.0], [-12.5, -2.0], [-11.0, -0.5], [-2.6, -0.5], [-2.6, -4.5], [-1.0, -5.25], [1.0, -7.0], [-10.5, -7.0], [-10.5, -20.5],
      [-16.5, -17.75], [-21.0, -5.75]],
    ridge: -10.25, top: 10.06, fallPlus: 0.266, fallMinus: 0.181,
  },
  // The north-west block: one plane, h = 7.778 + 0.0358 x - 0.1797 z (358 cells; residuals p10/p50/p90
  // -0.53/+0.01/+0.23, 81% within 0.5 m).
  northwest: {
    plan: [[18.4, 1.6], [24.5, 1.6], [26.5, -1.75], [27.0, -5.75], [25.5, -10.5], [18.4, -10.5]],
    plane: [7.778, 0.0358, -0.1797],
  },
  // The west corner: one plane, h = 2.021 + 0.2661 x - 0.2988 z (219 cells, 60% within 0.5 m: the 2023 aerial
  // shows a glazed roof there, which round 0 does not draw).
  west: {
    plan: [[15.5, -15.5], [18.4, -15.0], [18.4, -10.5], [25.5, -10.5], [23.5, -12.25], [24.0, -15.25], [23.5, -18.25], [21.25, -20.0], [15.5, -20.5]],
    plane: [2.021, 0.2661, -0.2988],
  },
};
