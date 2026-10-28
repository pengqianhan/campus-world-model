// Shared sizes, measured in the LINZ 2024 LiDAR (data/thomas-building-extension_pts.npy, the building's
// returns within 1 m of config building.outline, which ends the link where it meets the Thomas Building)
// in the view frame of config/thomas-building-extension.json: x is -axis (south-east, toward the road and
// the panoramas), y up from the frame's ground (34.6 m NZVD2016), z is toStreet (south-west, toward the
// link and the Thomas Building, 110); the frame's centre at x = z = 0. Owned by the lead: read, do not
// edit. Measured 2026-10-28 (round 0).

// The ground (the LiDAR's ground returns, medians): -0.33 at the south-east face's foot, -0.14 at the
// curve's foot on the east, +0.09 on the north-east, +0.40 on the north, +0.69 at the diagonal north-west
// face's foot, +0.86 at the north-west wall's, -0.12 under the link, -0.23 on the south-west east of the
// link and +1.48 west of it. The lowest ground within 3 m outside the plan is -1.40 (p1, by the road);
// walls go down to FOOT.
export const FOOT = -1.6;

export const MEASURED = {
  // The walls' plan, round the building from its south-east corner: the straight walls fitted to their
  // returns 2-15 m high (south-east face x = 19.33 + 0.0085 z, 85 returns, rms 0.32; south-west wall east
  // of the link z = 14.84 + 0.0025 x, 163, rms 0.19, and west of it z = 15.55 + 0.0338 x, 41, rms 0.08;
  // north-west wall x = -18.49 - 0.0165 z, 20, rms 0.19; the diagonal north-west face 0.285 m off the line
  // from (-19, -6) to (-7.5, -19), 171 returns, rms 0.14), the curve traced from the roof's edge (returns
  // over 14 m on a 0.25 m grid, closed) in 5 deg sectors about (-2.87, 0.41), smoothed over three, 0.07 m
  // inside it where its 126 wall returns stand (p10/p50/p90 -0.46/-0.07/0.15). The south-east face runs
  // from the corner to z 6.6, where the curve starts (campus.json's outline steps there too). The small
  // block at the north-west corner (x -20.19 to -18.67, z 11.24 to 14.86) is campus.json's; its returns
  // (10 over 12 m) top at 16.53.
  plan: [[19.46, 14.88], [19.39, 6.6], [19.21, 5.31], [19.14, 3.31], [18.79, 1.36], [18.4, -0.52], [18.02, -2.34],
    [17.61, -4.13], [17.17, -5.91], [16.63, -7.67], [16.01, -9.42], [15.32, -11.18], [14.55, -12.96], [13.56, -14.64],
    [12.23, -16.07], [10.68, -17.25], [8.99, -18.21], [7.25, -19.03], [5.46, -19.7], [3.64, -20.23], [1.81, -20.71],
    [-0.07, -20.87], [-1.93, -21.12], [-3.81, -21.16], [-5.72, -21.23], [-6.68, -19.5], [-18.38, -6.27],
    [-18.67, 11.24], [-20.19, 11.24], [-20.19, 14.86], [-13.4, 15.09], [-13.4, 14.8], [7.4, 14.85]],
  // Which edges of `plan` are which face: the south-east face (edge 0), the curve (edges 1 to 23), the
  // north end and the diagonal (24, 25), the north-west wall (26), the north-west corner block (27 to 29),
  // the south-west walls either side of the link (30 to 32).
  faces: { se: [0, 0], curve: [1, 23] },
  // The roof's plan: the walls' plan, but on the curve the roof's edge itself, and out past the diagonal
  // face by 0.63 m (median of 53 edge cells) and the north-west wall by 0.69 m (34, z -4 to 4.5); north of
  // z 4.5 the roof's edge over 14 m stands inside that wall (-0.52 m, 24 cells: a lower roof there, not
  // drawn) and the roof stops at the wall.
  roofPlan: [[19.46, 14.88], [19.39, 6.6], [19.28, 5.32], [19.21, 3.32], [18.86, 1.36], [18.47, -0.52], [18.09, -2.35],
    [17.67, -4.14], [17.24, -5.93], [16.69, -7.69], [16.07, -9.45], [15.38, -11.21], [14.6, -13.0], [13.61, -14.69],
    [12.28, -16.12], [10.72, -17.3], [9.03, -18.26], [7.28, -19.09], [5.49, -19.76], [3.66, -20.29], [1.83, -20.78],
    [-0.06, -20.94], [-1.93, -21.19], [-3.81, -21.23], [-5.73, -21.3], [-7.15, -19.92], [-19.06, -6.45], [-19.25, 4.5],
    [-18.56, 4.5], [-18.67, 11.24], [-20.19, 11.24], [-20.19, 14.86], [-13.4, 15.09], [-13.4, 14.8], [7.4, 14.85]],
  // The walls stop at the eave, 15.8: the roof's returns in the first 0.5 m in from its edge, 641 of them,
  // p50 15.81 (p10 15.56, p90 16.84); a fascia stands from there to the roof's edge.
  eave: 15.8,
  // The main roof, a metal roof falling all round from the raised middle to the edge (the 2023 aerial: a
  // pale hipped roof): its returns by distance d in from the roof's edge (0.5 m bands, outside the raised
  // middle, 170-640 returns a band) rise from 16.38 at 0.5-1.0 m to 17.14 at 8.5-9 m, 0.094 m a metre
  // (y = 16.39 + 0.094 (d - 1)), and by the raised middle 16.34 (south-west, 106 returns), 16.98
  // (north-west, 199), 17.15 (south-east, 145) and 17.46 (north-east, 211), as that rule gives them.
  roof: { edge: 16.3, at1: 16.39, slope: 0.094 },
  // The raised middle: a flat-roofed box over the main roof, its edges where its returns 19.3-20.6 m high
  // stop (p1/p99: x -11.54 to 7.77, z -4.23 to 12.79; p98 of the south-west edge's 13.41), its roof 19.86
  // (1,218 returns at x -9 to 4, z -1 to 10; p10 19.75, p90 20.04).
  middle: { x: [-11.6, 7.8], z: [-4.3, 13.3], top: 19.86 },
  // Plant on the raised middle at its south-west end: 99 returns over 20.6 m at x -7.0 to 4.3, z 7.0 to
  // 13.8, p50 21.63 (p10 21.13, p90 22.80, max 22.87: a rail or flue along z 7.0-7.5 at 22.5-22.9).
  plant: { x: [-7.0, 4.3], z: [7.0, 13.3], top: 21.63 },
  // The link to the Thomas Building (110): its roof at 17.04 (300 returns at x -12.5 to 7, z 15.5 to 19.8;
  // p10 16.75, p90 18.20), sparse as on glass (the aerial: glazed); its sides where the roof's returns stop
  // and the side walls' returns stand (x -13.5: 10 returns at 9.3-10 m; x 7.0-7.5: returns down to 3.7 m);
  // its end at z 20.4, where its roof (17.0-17.2 by 0.25 m bands to z 20.25) meets 110's flat roof (15.8-16.0
  // from z 20.5).
  link: { x: [-13.4, 7.4], z: [14.8, 20.4], top: 17.04 },
  // The curtain wall's foot: estimated (round 0), from the photographs' dark beam under the glass, a
  // little more than a storey up; round 1 measures it through the cameras.
  glassFoot: 5.6,
};
