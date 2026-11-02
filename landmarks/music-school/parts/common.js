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
  // apex at (-9.62, 1.18), 12.53 m, falling 0.267 a metre with the distance from it (1,247 cells, residuals
  // p10/p50/p90 -0.10/+0.01/+0.11, 94% within 0.5 m). Its plan from the edges of its returns above 7.3 m
  // (0.5 m mask, closed, simplified); its south side where the cone's heights end against the lower roofs
  // south of it (round 1: at z -3.5 west of x -11, where round 0 put it at -2, and round to the low link at
  // the courtyard's east corner).
  fan: {
    plan: [[-2.6, 3.5], [-2.6, 11.8], [-8.2, 16.4], [-18.2, 16.4], [-22.0, 8.0], [-22.0, -1.5], [-19.5, -3.5], [-11.0, -3.5],
      [-10.0, -1.5], [-8.0, 0.0], [-5.5, 1.0], [-4.0, 3.0]],
    apex: [-9.62, 1.18], top: 12.53, fall: 0.267,
    // Its walls stand inside those eaves (round 1): the LiDAR's wall returns 0.5-7 m up lie inside the plan's
    // outer edges by 0.88 m (p50 of 71 returns; p10-p90 0.73-1.09) on the edge from (-2.6, 11.8) to (-8.2, 16.4),
    // 0.76 m (169; 0.69-0.84) on the face to the car park (the ochre wall, at z 15.64; its returns' z p50 15.63),
    // 0.87 m (215) and 0.74 m (349) on the two west edges; the edges toward the courtyard and the lower roofs
    // show too few returns to say, and stay. The plan with those four edges moved in by those amounts:
    walls: [[-2.6, 3.5], [-2.6, 10.66], [-8.66, 15.64], [-17.59, 15.64], [-21.26, 7.52], [-21.26, -2.09], [-19.5, -3.5],
      [-11.0, -3.5], [-10.0, -1.5], [-8.0, 0.0], [-5.5, 1.0], [-4.0, 3.0]],
    // The window in the ochre wall (round 2), through qru8's fixed camera on the wall's plane (z 15.64): its left
    // edge at x -16.70 (top) and -16.44 (sill), its right at -12.81 and -12.59, so x -16.57 to -12.70; its head's
    // top at 6.91-6.93 m, its sill's foot at 3.30-3.33, its transom at 5.02. Four lights in two rows, as both
    // photographs show (2LAG's, squarer to the wall, shows the four lights and the head; the house before it hides
    // the lower row). The wall's z holds to 0.1 m (its returns' p10-p90 15.49-15.71), which moves the window 0.2-0.45
    // m along it at qru8's slant; through the same camera the wall's west end lands at x -17.45 (-17.63 at the top,
    // -17.27 at the foot), where its returns put it at -17.59. The frames' and the head's sizes, and how far they stand out, are estimated; the
    // panes are drawn on the wall's face.
    window: { x: [-16.57, -12.7], y: [3.3, 6.92], transom: 5.02, lights: 4, frame: 0.08, head: 0.15, out: 0.06 },
    // White downpipes at the ochre wall's two corners, which both photographs show (their radius estimated).
    pipes: [[-8.66, 15.64], [-17.59, 15.64]], pipeR: 0.05,
  },
  // The north wing: a flat roof at 5.16 m (the median of its 946 cells; residuals p10/p50/p90 -0.09/0/+0.67,
  // 88% within 0.5 m), from the face to the car park (z 16.4, where the canopy's returns begin) round the
  // courtyard, whose curved edge is the edge of its returns, to its north-west face (round 1: to x 23.5-24.5,
  // the edge of its returns, where round 0 stopped at 23.0).
  north: {
    plan: [[1.5, 16.4], [21.8, 16.4], [22.5, 15.5], [23.5, 14.0], [23.5, 9.0], [24.0, 4.5], [24.5, 1.6], [18.4, 1.6], [18.4, -2.6],
      [14.8, -2.6], [14.5, 3.75], [10.25, 8.5], [8.75, 9.5], [5.25, 10.0], [4.0, 11.0], [2.5, 13.25], [1.5, 15.0]],
    top: 5.16,
  },
  // The low link at the courtyard's east corner, between the auditorium and the south range: flat at 5.02 m
  // (the median of its 93 cells; only 42% within 0.5 m: lower roofs at about 4 m and the edges of the higher
  // ones fall in it).
  link: {
    plan: [[-5.5, 1.0], [-4.0, 3.0], [-2.6, 3.5], [-1.0, 1.5], [1.5, -1.5], [1.5, -5.5], [0.5, -7.0], [-1.0, -7.0], [-1.0, -6.5],
      [-2.0, -5.0], [-3.0, -3.0], [-4.5, -1.0]],
    top: 5.02,
  },
  // The parapet on the face to the car park: a thin wall over the north wing's edge, its returns at z 15.8-16.5
  // (taken as 16.05-16.4), stepping up toward the north corner in equal rises of about 0.4 m. Its top, the
  // highest return in each 0.5 m of x (1-10 returns each): 5.45-5.69 from x 1.5 to 9.0; 5.83-5.89 to 10.0;
  // 6.16 and 6.35 to 11.0; 6.68-6.80 to 15.0; then 7.07, 7.38, 7.54, 7.69 and 7.99 to 17.5; 8.26-8.45 to
  // x 22.2. Round 1: from x 15 the photograph shows three risers against the sky, four levels in equal rises
  // from 6.74 to 8.3 (7.13, 7.52, 7.91), and through qru8's fitted camera (config, camera_fixes_note) puts the
  // risers at x 16.09, 16.84 and 17.64 (round 2's camera; round 1's put them at 15.88, 16.64 and 17.44); the
  // first, from 6.74 to 7.13, stands in front of Te Pūtahi Tangata in
  // the photograph and is placed at x 15.0 by the LiDAR's bins. Below 6.74 the photograph shows the steps
  // against the ivy and the neighbour behind, not the sky: they are the LiDAR's, in equal rises (5.93 over x
  // 9.0-10.25, 6.33 to 11.0; the risers' x to about 0.25 m). [x where a step begins, its top].
  parapet: {
    z: [16.05, 16.4], x: [1.5, 22.2],
    steps: [[1.5, 5.52], [9.0, 5.93], [10.25, 6.33], [11.0, 6.74], [15.0, 7.13], [16.09, 7.52], [16.84, 7.91], [17.64, 8.3]],
  },
  // The canopy along the face to the car park, its curved corrugated sheet seen in the photographs: its section
  // from the medians of its returns over x 3-20 in 0.25 m strips of z: 4.55 at z 16.5, 4.47, 4.39, 4.26, 4.07,
  // 3.75 and 3.42 at z 18.0. It ends where its returns end, x 1.5 to 21.8 and z 18.4 (the outline's edge,
  // 18.21-18.45). Its lower edge, where the white sheet meets the shaded wall under it, stands at 2.69 m on
  // z 18.4 through qru8's fitted camera (round 1: the same row, 594-603, in each column of the wide view from
  // u 1100 to 1450; round 0 carried the curve on to 2.9, estimated). Its top runs 0.1 m into the wall, so that
  // the two meet with no gap.
  canopy: {
    x: [1.5, 21.8],
    section: [[16.3, 4.6], [16.4, 4.6], [16.75, 4.47], [17.0, 4.39], [17.25, 4.26], [17.5, 4.07], [17.75, 3.75], [18.0, 3.42], [18.4, 2.69]],
    thick: 0.08, // the sheet and its frame (estimated)
  },
  // The ranges south and west of the courtyard (round 1): each roof the lowest of a few planes
  // [a, kx, kz] (h = a + kx x + kz z), fitted together to its region's cells: a gable where two planes meet
  // in a ridge, a hip where a third cuts its end.
  // The south range, from the west corner's block to the south-east part: a gable along x, its ridge near
  // z -14 (9.6-9.7 m), falling 0.153 a metre toward the courtyard and 0.335 to the south-west, hipped at its
  // west end (falling 0.225 a metre to -x) (1,419 cells; residuals p10/p50/p90 -0.28/-0.02/+0.35, 90% within
  // 0.5 m; round 0's gable alone, without the hip: 86%). Its edge toward the north wing is the north wing's, z -2.6
  // (round 0 left a slit 0.4 m wide between them).
  south: {
    plan: [[-17.9, -12.5], [-1.0, -12.5], [-1.0, -7.0], [14.8, -7.0], [14.8, -2.6], [18.4, -2.6], [18.4, -15.0], [16.2, -15.3],
      [16.6, -19.4], [15.5, -20.5], [-8.25, -20.5], [-12.25, -19.5], [-16.2, -17.6]],
    planes: [[7.432, 0.0161, -0.1529], [14.337, 0.0156, 0.3372], [13.644, 0.225, 0.0986]],
  },
  // The south-east part, between the auditorium and the south range: a gable along z, its ridge near x -11
  // (10.1-10.4 m), falling 0.221 a metre to -x and 0.197 to +x (741 cells; residuals p10/p50/p90
  // -0.16/-0.02/+0.41, 88% within 0.5 m; round 0: 70%).
  southeast: {
    plan: [[-17.9, -12.5], [-20.9, -4.6], [-19.5, -3.5], [-11.0, -3.5], [-10.0, -1.5], [-8.0, 0.0], [-5.5, 1.0], [-4.5, -1.0],
      [-3.0, -3.0], [-2.0, -5.0], [-1.0, -6.5], [-1.0, -12.5]],
    planes: [[13.241, 0.2207, 0.0735], [7.526, -0.1973, -0.0783]],
  },
  // A stack on the south-east part's ridge: 33 returns above 14 m in x -9.32 to -7.54, z -12.03 to -10.33, their
  // median 15.14 m (p90 16.17, the highest 16.28: the building's highest point).
  stack: { x: [-9.32, -7.54], z: [-12.03, -10.33], top: 15.14 },
  // The north-west block: one plane (358 cells; residuals p10/p50/p90 -0.53/+0.01/+0.23, 81% within 0.5 m).
  // Along its outer edge, x 24-26.3, 102 building returns 11-14 m high stand among 139 of high vegetation:
  // the trees along the road, not drawn.
  northwest: {
    plan: [[18.4, 1.6], [24.5, 1.6], [26.5, -1.75], [27.0, -5.75], [25.5, -10.5], [18.4, -10.5]],
    planes: [[7.778, 0.0358, -0.1797]],
  },
  // The west corner: one plane, rising to the corner (200 cells; residuals p10/p50/p90 -1.29/0/+0.48, 70% within
  // 0.5 m). Round 2: its edge toward the south range where its returns rise above the range's roof (x 16.2-16.6:
  // the 1 m medians step from 8.6-10.0 to 11.7-12.4 there), where round 0 put it at 15.5 (60% within 0.5 m).
  // Neither two planes nor a hip of four fits it better: the 2023 aerial shows a glazed roof in panes there, and
  // a fifth of its returns fall 1 m or more below the plane (between its glazing bars, by their spread), which the
  // model does not draw.
  west: {
    plan: [[16.2, -15.3], [18.4, -15.0], [18.4, -10.5], [25.5, -10.5], [23.5, -12.25], [24.0, -15.25], [23.5, -18.25], [21.25, -20.0],
      [16.6, -19.4]],
    planes: [[3.236, 0.1801, -0.3384]],
  },
};
