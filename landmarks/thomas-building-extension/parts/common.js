// Shared sizes, measured in the LINZ 2024 LiDAR (data/thomas-building-extension_pts.npy, the building's
// returns within 1 m of config building.outline, which ends the link where it meets the Thomas Building)
// in the view frame of config/thomas-building-extension.json: x is -axis (south-east, toward the road and
// the panoramas), y up from the frame's ground (34.6 m NZVD2016), z is toStreet (south-west, toward the
// link and the Thomas Building, 110); the frame's centre at x = z = 0. Owned by the lead: read, do not
// edit. Measured 2026-10-28 (round 0, and round 1 where it says so).

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
  // from the corner to z 7.5, where the curtain wall starts (round 1: the photographs' first vertical edge
  // of glass, fitted with both cameras; the wall's returns reach x 19.6-19.8 at z 6-9; round 0 had z 6.6,
  // where campus.json's outline steps).
  plan: [[19.46, 14.88], [19.39, 7.5], [19.21, 5.31], [19.14, 3.31], [18.79, 1.36], [18.4, -0.52], [18.02, -2.34],
    [17.61, -4.13], [17.17, -5.91], [16.63, -7.67], [16.01, -9.42], [15.32, -11.18], [14.55, -12.96], [13.56, -14.64],
    [12.23, -16.07], [10.68, -17.25], [8.99, -18.21], [7.25, -19.03], [5.46, -19.7], [3.64, -20.23], [1.81, -20.71],
    [-0.07, -20.87], [-1.93, -21.12], [-3.81, -21.16], [-5.72, -21.23], [-6.68, -19.5], [-18.38, -6.27],
    [-18.73, 14.91], [-13.4, 15.09], [-13.4, 14.8], [7.4, 14.85]],
  // Which edges of `plan` are which face: the south-east face (edge 0), the curve (edges 1 to 23), the
  // north end and the diagonal (24, 25), the north-west wall (26), the south-west walls either side of the
  // link (27 to 29). Not drawn (round 1): the small block that campus.json's outline adds at the
  // north-west corner (x -20.19 to -18.67, z 11.24 to 14.86): the LiDAR has a tree there (132 returns of
  // vegetation up to 17.0 m), 8 building returns, all on the north-west wall's line (x -19.25 to -18.51),
  // and its ground at +1.09; round 0 drew it to the eave.
  faces: { se: [0, 0], curve: [1, 23] },
  // The roof's plan: the walls' plan, but on the curve the roof's edge itself, and out past the diagonal
  // face by 0.63 m (median of 53 edge cells) and the north-west wall by 0.69 m (34, z -4 to 4.5); north of
  // z 4.5 the roof's edge over 14 m stands inside that wall (-0.52 m, 24 cells: a lower roof there, not
  // drawn) and the roof stops at the wall.
  roofPlan: [[19.46, 14.88], [19.39, 7.5], [19.28, 5.32], [19.21, 3.32], [18.86, 1.36], [18.47, -0.52], [18.09, -2.35],
    [17.67, -4.14], [17.24, -5.93], [16.69, -7.69], [16.07, -9.45], [15.38, -11.21], [14.6, -13.0], [13.61, -14.69],
    [12.28, -16.12], [10.72, -17.3], [9.03, -18.26], [7.28, -19.09], [5.49, -19.76], [3.66, -20.29], [1.83, -20.78],
    [-0.06, -20.94], [-1.93, -21.19], [-3.81, -21.23], [-5.73, -21.3], [-7.15, -19.92], [-19.06, -6.45], [-19.25, 4.5],
    [-18.56, 4.5], [-18.73, 14.91], [-13.4, 15.09], [-13.4, 14.8], [7.4, 14.85]],
  // The walls stop at the eave, 15.8, and a dark fascia stands from there to the roof's edge at 16.3. The
  // roof's returns in the first 0.2 m in from its edge (on a 0.1 m grid) are of two heights, p25 15.64,
  // p50 15.76, p75 16.49, p90 16.88 (462 returns: the fascia's face and a gutter behind its lip); from
  // 0.2-0.6 m in their median is 16.30-16.33 (467), 0.6-1.0 m in 16.40-16.42 (438). Round 1 tried a
  // gutter at 15.81 over the outer 0.75 m: the silhouette's IoU in the box fell by 0.004-0.012 in the
  // wide views, and the top view gained nothing (92% within 0.5 m either way); not kept.
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
  // On the raised middle (round 1; round 0 drew one box over all of it at the median of its 99 returns
  // over 20.6 m, 21.63): a screen along z 7.07-7.54 from x -7.04 to 3.90, its top 22.70 (38 returns over
  // 22.3 m, p10 22.45, p90 22.84: the building's highest point), and a unit at x 1.1-3.5, z 9.0-11.0,
  // its top 21.21 (41 returns, p10 21.04, p90 21.33); a few more returns over 20.6 m beyond them (z 13-13.8,
  // 8 returns) are not drawn.
  screen: { x: [-7.04, 3.9], z: [7.07, 7.54], top: 22.7 },
  plant: { x: [1.1, 3.5], z: [9.0, 11.0], top: 21.21 },
  // The link to the Thomas Building (110): its roof at 17.04 (300 returns at x -12.5 to 7, z 15.5 to 19.8;
  // p10 16.75, p90 18.20), sparse as on glass (the aerial: glazed); its sides where the roof's returns stop
  // and the side walls' returns stand (x -13.5: 10 returns at 9.3-10 m; x 7.0-7.5: returns down to 3.7 m);
  // its end at z 20.4, where its roof (17.0-17.2 by 0.25 m bands to z 20.25) meets 110's flat roof (15.8-16.0
  // from z 20.5).
  link: { x: [-13.4, 7.4], z: [14.8, 20.4], top: 17.04 },
  // The curtain wall (round 1), measured through both fixed cameras onto the curve (config
  // streetview.camera_fixes): the glass's foot, the top of a dark steel beam, at 4.33 (oWaF's wide view,
  // two places) and 4.13-4.23 (MOQA's, five), the beam's underside at 3.78-3.84 (MOQA's upper view);
  // three storeys of glass, the lower to 8.01-8.02 (oWaF), then a light head strip to 8.27 and a dark
  // transom to 8.45-8.60 (oWaF; MOQA's wide view 8.33-8.54), the middle to 12.18-12.32, its head strip to
  // 12.41-12.54 and its transom to 12.64-12.91, the top band to the eave; panes between slim fins every
  // 2.11 m along the curve (MOQA's upper view: fins at 4.57, 6.64, 8.83 and 10.91 m from its start).
  // How far the beam stands out from the base is not measured (estimated 0.3 m).
  glassFoot: 4.25,
  curtain: {
    beam: [3.8, 4.25],
    glass: [[4.25, 8.0], [8.5, 12.25], [12.75, 15.8]],
    heads: [[8.0, 8.27], [12.25, 12.5]],
    transoms: [[8.27, 8.5], [12.5, 12.75]],
    fins: { from: 0.35, step: 2.11 },
  },
  // The base's openings (round 1), through MOQA's wide view: the service doors, their sills at 0.13-0.17
  // (above the forecourt, whose LiDAR ground is -0.13 to -0.26 there) and their heads at 2.63-2.66, run
  // from 1.15 m along the south-east face from its end at z 7.5 round onto the curve to 3.59 m along it:
  // a dark side light, louvred double doors, a dark side light, a white pier, a louvred door with a
  // glazed panel, a dark side light (each edge where its photograph's colour changes). Three of the small
  // windows further round, 1.06-1.11 to 2.43-2.50 m high, 0.5-0.66 m wide.
  doors: {
    y: [0.15, 2.65],
    face: [[1.15, 0.85, "dark"], [0.85, 0, "louvre"]],             // m along the south-east face back from z 7.5
    curve: [[0, 0.97, "louvre"], [0.97, 1.31, "dark"], [1.31, 1.84, "pier"], [1.84, 3.07, "louvre"], [3.07, 3.59, "dark"]],
  },
  windows: { y: [1.1, 2.48], at: [[12.83, 13.5], [15.06, 15.63], [17.45, 17.94]] },
};
