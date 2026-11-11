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
 * the west-south-west end and from 21.0 to 22.5 at the east-north-east end (the least and greatest u of the returns
 * within 0.4 m of the vault's top in 0.5 m and 1 m strips of w: -25.0 and -26.6 at the west-south-west end, 20.8 and
 * 22.36 at the east-north-east end, where the lower block's roof at 50.4 m and the plant room are left out of them);
 * 0.35 m thick, with a gutter 0.2 m wide along each eave (estimated: the photograph's fascia and gutter). */
export const VAULT = {
  crown: 51.9,
  drop: 2.05,
  half: 10.3,
  west: [-25.2, -26.8],
  east: [21.0, 22.5],
  t: 0.35,
  gutter: 0.2,
};
const s = (w) => (w / 10.15) ** 2;
export const vaultTop = (w) => VAULT.crown - VAULT.drop * s(w);
export const vaultEnd = (w, [edge, mid]) => mid + (edge - mid) * (w / VAULT.half) ** 2;

/** The east-north-east end: a lower block at 50.5 m (p50 of its returns), rounded in plan to u 30.3 (its returns'
 * greatest u in 1 m strips of w), from w -3.6 to 4.6; and on the vault a plant room at 54.5 m (p50 of its 190
 * returns over 53.5 m, 54.41) over u 19.5 to 24.0 and w -5.5 to -0.55 (its returns from 19.59 to 23.96 and -5.48 to
 * -0.57), standing past the vault's end; its foot 5 cm under the lower block's roof's underside, at 50.15 m, out of
 * one plane with it (the landmark tests' faces check): estimated, as what stands under its part past the vault and
 * beside the lower block is not seen. */
export const EAST = {
  low: { plan: [[20.1, -3.6], [27.6, -3.6], [29.5, -2.2], [30.3, 0], [30.0, 1.4], [29.2, 2.3], [26.3, 3.4], [24.3, 4.3], [20.1, 4.6]], top: 50.5 },
  plant: { plan: [[19.5, -5.5], [24.0, -5.5], [24.0, -0.55], [19.5, -0.55]], top: 54.5, foot: 50.15 },
};

/** The faces the photograph sees, every place and height estimated through its fitted camera (rms 0.87 px): the red
 * ground storey to 38.0 m on the north-west face and the west-south-west end; on the north-west face the glazing from
 * u -19.5 to 18.7 between yellow-clad ends, from 38.0 m to under the eave, its floors at 42.0 and 47.0 (the balconies'
 * floors); on the end a grey bay from w -3.5 to 3.15 with a door to each balcony, and in the yellow north of it three
 * rows of windows (39.2 to 40.0, 43.8 to 44.8, 48.6 to 49.6 m) at w 3.9 to 4.8 and small square windows at w 5.6 and
 * 7.1 at their tops. */
export const FACE = {
  base: 38.0,
  glazing: [-19.5, 18.7],
  floors: [42.0, 47.0],
  bay: [-3.5, 3.15],
  windows: { w: [3.9, 4.8], rows: [[39.2, 40.0], [43.8, 44.8], [48.6, 49.6]] },
  squares: { w: [5.6, 7.1], size: 0.4 },
  doors: { w: [-1.2, 0.0], height: 2.2 },
};

/** The balconies on the west-south-west end: the upper one's floor at 46.9 m and its railing's top at 47.7 to 47.8 (the
 * LiDAR's returns over u -27.5 to -26.5 and w -4 to 1), so railings 0.9 m high; the rest through the photograph's
 * camera, estimated: the lower one's floor at 42.0 m, both 0.3 m thick, from w -4.3 to 2.9, their fronts bowed out to
 * u -27.6. */
export const BALCONY = { floors: [42.0, 46.9], w: [-4.3, 2.9], front: [-27.0, -27.6], t: 0.3, rail: 0.9 };

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

/** The outside stair south-south-east of the balconies (the LiDAR's returns at w -6 to -9.5: 46.8 m at u -26, a
 * landing at 40.0 to 40.2 m over u -28 to -26 and one at 44.4 to 44.7): flights 1.2 m wide (estimated) running down
 * from each balcony's south end to a landing and back, the inner ones at u -25.6, the outer at -27.0, with railings 1.0 m high
 * on both sides (solid: the photograph's mesh panels); below 37.6 m, under the lower balcony, the photograph sees no
 * more of it (the trees and the smaller picture); posts at the balconies' fronts and the landings' outer corner
 * (through the photograph's camera). */
export const STAIR = {
  width: 1.2,
  flights: [
    { u: -25.6, from: [-4.3, 46.9], to: [-8.6, 44.5] },
    { u: -27.0, from: [-8.6, 44.5], to: [-4.3, 42.0] },
    { u: -25.6, from: [-4.3, 42.0], to: [-8.6, 40.1] },
    { u: -27.0, from: [-8.6, 40.1], to: [-4.3, 37.6] },
  ],
  landings: [
    { u: [-27.7, -24.9], w: [-9.4, -8.6], z: 44.5 },
    { u: [-27.7, -24.9], w: [-9.4, -8.6], z: 40.1 },
    { u: [-27.7, -26.3], w: [-4.3, -3.1], z: 37.6 },
  ],
  posts: [[-27.5, -0.3], [-27.3, -4.2], [-27.6, -9.2]],
};
