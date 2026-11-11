// Shared sizes, measured in the LINZ 2024 LiDAR (data/fine-arts-studio-block-433_pts.npy: the returns in the crop box)
// in the view frame of config/fine-arts-studio-block-433.json: x is -axis (west-south-west), y up from the door's
// ground, z is toStreet (north-north-west); the frame's centre at x = z = 0, the middle of the building's points near
// the campus map's ring (taken into the LiDAR's frame, it runs within 2 m of the vault's edge, and round the lower
// block at the east-north-east end).
// Owned by the lead: read, do not edit.
// Measured 2026-11-11 (round 0): every height below is an elevation (NZVD2016) and Y moves it on to the door's ground.
//
// The sizes are given in the building's own frame: u runs along the frame's axis toward the east-north-east (x = -u),
// w toward the north-north-west (z = w). `at` and `plan` turn (u, w) into the view frame. A side at the least u faces
// west-south-west (the end the photograph sees), at the greatest u east-north-east, at the greatest w north-north-west
// (the long face over the lane, which the photograph sees) and at the least w south-south-east.
//
// Fine Arts Studio Block 433: a long block of four storeys under a shallow vault, its ends bowed out in plan; at its
// east-north-east end a lower block, rounded in plan, and a plant room on the vault; at its west-south-west end two
// balconies and an outside stair.
export const at = (u, w) => [-u, w];
export const plan = (corners) => corners.map(([u, w]) => at(u, w));
/** The door's ground (the config's `ground`): an elevation, as a height over it. */
export const GROUND = 33.1;
export const Y = (z) => z - GROUND;

// The ground round the building: the lane along the north-west face at 33.1 m (33.01 to 33.12), the south-east side
// 3 m lower at 30.2, the ground at the west-south-west end falling from 33.3 at the west corner to 30.5, at the
// east-north-east end from 33 to 28; the walls go down to FOOT.
export const FOOT = Y(28.5);

/** The walls, where the LiDAR's returns under the eave peak: the long ones at w 8.25 and -8.25 (419 and 491 of their
 * returns in one 0.5 m strip), the east-north-east end at u 20.1 (its returns at 20.0 to 20.5); the west-south-west
 * end at u -24.5, where the photograph's camera puts its west corner (the LiDAR sees the balconies and the stair
 * before it, not the wall). */
export const WALL = { w: 8.25, west: -24.5, east: 20.1 };

/** The vault: its top a parabola across the faces, 51.9 m at the crown (w 0) falling 2.05 m to w 10.15, the LiDAR's
 * returns' p50 in 1 m strips from u -15 to 15 (51.40 against 51.41 at w 5, 50.57 against 50.64 at w 8); its edges
 * 0.15 to 0.2 m out from the returns' extremes (their spacing): the eaves at w 10.3 (the returns' greatest w 10.0 to
 * 10.2 in 2 m strips along the faces), its ends bowed out in plan, from u -25.2 at the eaves to -26.8 at the crown at
 * the west-south-west end (the returns' least u in 0.5 m strips of w: -25.0 at the eaves, -26.6 at the crown); at the
 * east-north-east end the greatest u of the returns within 0.4 m of the vault's top in 1 m strips of w (the lower
 * block's roof at 50.4 m and the plant room left out), the lesser of the two sides at each |w| and 0.15 m out, as
 * `EAST_EDGE` gives it (22.5 at the crown, 22.15 at |w| 4, 21.55 at 7, 20.85 at the eaves); 0.35 m thick, with a
 * gutter 0.2 m wide along each eave (estimated: the photograph's fascia and gutter). */
export const VAULT = {
  crown: 51.9,
  drop: 2.05,
  half: 10.3,
  west: [-25.2, -26.8],
  t: 0.35,
  gutter: 0.2,
};
const s = (w) => (w / 10.15) ** 2;
export const vaultTop = (w) => VAULT.crown - VAULT.drop * s(w);
export const vaultEnd = (w, [edge, mid]) => mid + (edge - mid) * (w / VAULT.half) ** 2;
/** The vault's east-north-east edge: u at |w|, joined straight between. */
export const EAST_EDGE = [[0, 22.5], [2, 22.2], [4, 22.15], [5, 21.9], [6, 21.8], [7, 21.55], [8, 21.25], [9, 21.0], [10.3, 20.85]];
export const vaultEast = (w) => {
  const a = Math.min(Math.abs(w), VAULT.half);
  for (let i = 1; i < EAST_EDGE.length; i++) {
    const [w0, u0] = EAST_EDGE[i - 1], [w1, u1] = EAST_EDGE[i];
    if (a <= w1) return u0 + ((u1 - u0) * (a - w0)) / (w1 - w0);
  }
  return EAST_EDGE[EAST_EDGE.length - 1][1];
};

/** The east-north-east end: a lower block at 50.5 m (p50 of its returns, 50.44). Its roof, 0.3 m thick, to its
 * returns' edge: from the main block's end at u 20.1 its south side at w -4.85 to u 23.45 (the returns' least w -4.92
 * to -4.94 in u 22 to 24), then at w -2.3 (-2.09 to -2.30 in u 24 to 29), rounded to u 30.3 (its returns' greatest u
 * in 1 m strips of w), its north side along its returns from w 5.59 at u 21.9 to 4.13 at 24.6. Its walls where the
 * returns from 34 to 48.7 m lie, under the roof: the south one at w -4.85 to u 23.45 (vertical faces there from 45.1
 * to 53.0 m) and then at -1.58 (107 returns over u 23.6 to 27.9), the east end to u 29.6 (its returns to 29.64), the
 * north one along a line from w 5.29 at u 20.75 to 2.09 at 27.75. And a plant room at 54.5 m (p50 of its 190
 * returns over 53.5 m, 54.41) over u 19.5 to 24.0 and w -5.5 to -0.55 (its returns from 19.59 to 23.96 and -5.48 to
 * -0.57): its walls on the lower block, 3 cm in from its south side and the step, from 5 cm under its roof's
 * underside (50.15 m), out of one plane with them (the landmark tests' faces check); its roof 0.3 m thick over the
 * whole of its returns, overhanging the walls by up to 0.7 m (estimated: the returns give the roof, not the walls). */
export const EAST = {
  low: {
    roof: [[20.1, -4.85], [23.45, -4.85], [23.45, -2.3], [28.6, -2.3], [29.6, -1.4], [30.3, 0], [30.0, 1.4], [29.2, 2.3], [26.3, 3.4], [24.6, 4.13], [21.9, 5.59], [20.1, 5.59]],
    walls: [[20.1, -4.85], [23.45, -4.85], [23.45, -1.58], [28.6, -1.58], [29.3, -0.9], [29.6, 0.2], [29.3, 1.2], [28.5, 1.75], [27.75, 2.09], [20.1, 5.59]],
    top: 50.5,
  },
  plant: { walls: [[19.5, -4.82], [23.42, -4.82], [23.42, -0.55], [19.5, -0.55]], roof: [[19.5, -5.5], [24.0, -5.5], [24.0, -0.55], [19.5, -0.55]], top: 54.5, foot: 50.15 },
};

/** The faces the photograph sees, every place and height estimated through its fitted camera (rms 0.87 px): the red
 * ground storey to 38.0 m on the north-west face and the west-south-west end; on the north-west face the glazing from
 * u -19.5 to 18.7 between yellow-clad ends, from 38.0 m to under the eave, its floor bands at 42.42 and 46.9 (the
 * balconies' floors, the LiDAR's); on the end a grey bay from w -3.5 to 3.15 with a door to each balcony, and in the yellow north of it three
 * rows of windows (39.2 to 40.0, 43.8 to 44.8, 48.6 to 49.6 m) at w 3.9 to 4.8 and small square windows at w 5.6 and
 * 7.1 at their tops. */
export const FACE = {
  base: 38.0,
  glazing: [-19.5, 18.7],
  floors: [42.42, 46.9],
  bay: [-3.5, 3.15],
  windows: { w: [3.9, 4.8], rows: [[39.2, 40.0], [43.8, 44.8], [48.6, 49.6]] },
  squares: { w: [5.6, 7.1], size: 0.4 },
  doors: { w: [-1.2, 0.0], height: 2.2 },
};

/** The balconies on the west-south-west end: the upper one's floor at 46.9 m and its railing's top at 47.7 to 47.8 (the
 * LiDAR's returns over u -27.5 to -26.5 and w -4 to 1), so railings 0.9 m high; the lower one's floor at 42.42 m (p50
 * of its 4 returns, 42.41 to 42.44); the rest through the photograph's camera, estimated: both 0.3 m thick, from w
 * -4.3 to 2.9, their fronts bowed out to u -27.6. */
export const BALCONY = { floors: [42.42, 46.9], w: [-4.3, 2.9], front: [-27.0, -27.6], t: 0.3, rail: 0.9 };

/** The coloured panels in the north-west face's glazing, 1.4 m wide (estimated: their middles through the photograph's
 * camera). */
export const PANELS = [
  { colour: "red", u: -15.3, z: [43.3, 44.7] },
  { colour: "red", u: -4.5, z: [43.2, 44.5] },
  { colour: "red", u: 0.2, z: [40.2, 41.5] },
  { colour: "yellow", u: -15.0, z: [47.3, 48.6] },
  { colour: "yellow", u: 6.6, z: [47.7, 49.0] },
  { colour: "blue", u: -17.1, z: [38.1, 39.3] },
  { colour: "blue", u: -2.65, z: [38.7, 40.0] },
];

/** The outside stair south-south-east of the balconies (the LiDAR's flat returns, classes 5 and 6, west of the end
 * wall: the upper landing at 44.66 m over u -27.44 to -24.60 and w -9.24 to -7.30, 27 returns; the lower at 40.16 m
 * over u -27.33 to -24.54 and w -9.50 to -7.39, 25; east of the wall the returns at those heights lie on the
 * south-east wall's plane, not on a landing): flights 1.2 m wide (estimated) running down
 * from each balcony's south end to a landing and back, the inner ones at u -25.6, the outer at -27.0, with railings 1.0 m high
 * on both sides (solid: the photograph's mesh panels); below 37.6 m, under the lower balcony, the photograph sees no
 * more of it (the trees and the smaller picture); posts at the balconies' fronts and the landings' outer corner
 * (through the photograph's camera). */
export const STAIR = {
  width: 1.2,
  flights: [
    { u: -25.6, from: [-4.3, 46.9], to: [-7.3, 44.66] },
    { u: -27.0, from: [-7.3, 44.66], to: [-4.3, 42.42] },
    { u: -25.6, from: [-4.3, 42.42], to: [-7.0, 40.16] },
    { u: -27.0, from: [-7.0, 40.16], to: [-4.3, 37.6] },
  ],
  landings: [
    { u: [-27.7, -24.5], w: [-9.35, -7.3], z: 44.66 },
    { u: [-27.7, -24.5], w: [-9.55, -7.0], z: 40.16 },
    { u: [-27.7, -26.3], w: [-4.3, -3.1], z: 37.6 },
  ],
  posts: [[-27.5, -0.3], [-27.3, -4.2], [-27.6, -9.2]],
};
