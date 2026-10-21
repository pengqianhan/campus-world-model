// The two-storey main block and its chimneys, at the LINZ 2024 LiDAR's sizes (measured in the view
// frame; the eave and ridge heights are those of the LiDAR's roof edges and ridges). Painted timber:
// boards, ochre trim, white glazing bars and balusters, light grey roofs.
//   - the front range along the garden front: walls to 10.0, an ochre cornice to 10.8 with a balustrade
//     on the wall line (seen at its south-east end in hRE5, and in the LiDAR's posts at 11.6-11.9),
//     a hipped roof behind it to 12.65, quoins at its corners (hRE5), and in its middle a bay that stands
//     0.65 m forward under a pediment (the LiDAR's cross gable, ridge 12.85);
//   - the two end wings, lower: bracketed deep eaves at 9.9, hipped roofs to 11.6 (hRE5's left wing);
//   - the wing behind the middle (eaves 10.5, ridge 12.1) and the flat-roofed two-storey blocks between
//     it and the end wings (9.2-9.4). The single-storey rooms round the courtyard are back's.
import { Acc, face, fbox, sash, brackets, balustrade, quoins, cornerBoard, hip, gableZ } from "./front_kit.js";

const BASE = -0.4;                         // walls start a little below the ground (0.2-0.8 m round the house)
// the front range: wall faces, the cornice's top, the roof behind the balustrade
export const FRONT = { x: [-17.2, 15.9], z: [-1.7, 7.3], top: 10.0, cornice: 10.8, ridge: 12.65, roof: { x: [-16.4, 15.1], z: [-1.7, 6.5] }, rail: -0.5 };
// the middle bay of the garden front, forward under a pediment, on the axis of the porch
export const MIDDLE = { x: [-4.35, 3.15], z: 7.95, axis: -0.6, half: 4.25, ridge: 12.85 };
// the end wings: wall faces and eave edges, eaves 9.9, ridge 11.6
export const WINGS = {
  se: { x: [-23.5, -15.0], z: [-9.6, 4.25], eaves: [-24.1, -14.4, -10.2, 4.85] },
  nw: { x: [14.6, 22.65], z: [-9.6, 5.15], eaves: [14.0, 23.25, -10.2, 5.75] },
  top: 9.55, eave: 9.9, ridge: 11.6,
};
// the wing behind the middle
export const REAR = { x: [-3.0, 3.2], z: [-7.2, -1.7], eaves: [-3.6, 3.75, -7.6], top: 10.2, eave: 10.5, ridge: 12.1 };
// flat-roofed two-storey blocks behind the front range: [x0, x1, z0, z1, top]
const FLATS = [[-15.0, -8.25, -4.1, -1.7, 9.3], [-5.35, -3.0, -7.4, -1.7, 9.4], [3.2, 4.6, -6.5, -1.7, 8.7], [8.0, 14.6, -5.2, -1.7, 9.2]];

const FLOOR = [5.0, 5.35];                 // the band between the floors
const GROUND = { y: 1.5, h: 2.8 }, UPPER = { y: 6.15, h: 2.3 }, WUPPER = { y: 6.05, h: 2.05 };

/** Window centres: n evenly spaced from u0 to u1, each `edge` from the ends. */
const spread = (u0, u1, n, edge) => Array.from({ length: n }, (_, i) => (n === 1 ? (u0 + u1) / 2 : u0 + edge + ((u1 - u0 - 2 * edge) * i) / (n - 1)));

function frontRange(a) {
  const { x: [x0, x1], z: [z0, z1], top, cornice } = FRONT;
  a.box("boards", x0, x1, BASE, top, z0, z1);
  // the cornice all round (deeper at the back, where the roof comes down to it) and a moulding under it
  a.box("trim", x0 - 0.4, x1 + 0.4, top, cornice, z0 - 0.3, z1 + 0.45);
  a.box("trim", x0 - 0.18, x1 + 0.18, top - 0.3, top, z0 - 0.18, z1 + 0.2);
  a.box("trim", x0 - 0.06, x1 + 0.06, FLOOR[0], FLOOR[1], z0 - 0.06, z1 + 0.06);
  // the roof behind the balustrade
  const r = FRONT.roof;
  hip(a, r.x[0], r.x[1], r.z[0], r.z[1], cornice, FRONT.ridge);
  // quoins at the four corners of the garden front's ends
  quoins(a, x0, z1, -1, 1, 0, top - 0.3);
  quoins(a, x1, z1, 1, 1, 0, top - 0.3);
  // the balustrade on the wall line: along the garden front either side of the middle bay, and round the ends
  const gf = face("z", z1, 1), se = face("x", x0, -1), nw = face("x", x1, 1);
  const d = FRONT.rail, ends = { post: 2.4 };
  balustrade(a, gf, x0 - d, MIDDLE.x[0] + 0.1, cornice, cornice + 1.0, d, ends);
  balustrade(a, gf, MIDDLE.x[1] - 0.1, x1 + d, cornice, cornice + 1.0, d, ends);
  balustrade(a, se, WINGS.se.z[1] + 0.6, z1 + d + 0.16, cornice, cornice + 1.0, d, ends);
  balustrade(a, nw, WINGS.nw.z[1] + 0.6, z1 + d + 0.16, cornice, cornice + 1.0, d, ends);
  // the garden front's windows: four a floor either side of the middle bay. No photograph shows this
  // front, so their heads are plain (docs/CONTRACT.md: no ornament that no reference shows)
  const left = spread(x0, MIDDLE.x[0], 4, 1.75), right = spread(MIDDLE.x[1], x1, 4, 1.75);
  for (const u of [...left, ...right]) {
    sash(a, gf, u, GROUND.y, 1.2, GROUND.h, { cols: 3, rows: 3 });
    sash(a, gf, u, UPPER.y, 1.08, UPPER.h, { cols: 2, rows: 3 });
  }
}

function middleBay(a) {
  const { x: [x0, x1], z: zf, axis, half, ridge } = MIDDLE, z1 = FRONT.z[1], { top, cornice } = FRONT;
  a.box("boards", x0, x1, BASE, top, z1 - 0.2, zf);
  a.box("trim", x0 - 0.4, x1 + 0.4, top, cornice, z1, zf + 0.45);
  a.box("trim", x0 - 0.18, x1 + 0.18, top - 0.3, top, z1, zf + 0.2);
  a.box("trim", x0 - 0.06, x1 + 0.06, FLOOR[0], FLOOR[1], z1, zf + 0.06);
  quoins(a, x0, zf, -1, 1, 0, top - 0.3, { long: 0.6, short: 0.38 });
  quoins(a, x1, zf, 1, 1, 0, top - 0.3, { long: 0.6, short: 0.38 });
  // the pediment: a gabled roof from the main roof forward to the cornice's edge, its tympanum on the wall line
  // its ridge stops at z 6.5 (the LiDAR: the main roof at 11.1 at z 6), the back hipped steeply into the main roof
  gableZ(a, axis, half, 5.2, zf + 0.45, cornice, ridge, { setback: 0.45, ridgeFrom: 6.5 });
  const f = face("z", zf, 1);
  sash(a, f, axis, 0.75, 1.7, 3.55, { door: true });
  for (const u of [axis - 2.35, axis + 2.35]) sash(a, f, u, GROUND.y, 1.1, GROUND.h, { cols: 3, rows: 3 });
  for (const u of [axis - 2.35, axis, axis + 2.35]) sash(a, f, u, UPPER.y, 1.08, UPPER.h, { cols: 2, rows: 3 });
}

function wing(a, w, end) {
  const { x: [x0, x1], z: [z0, z1], eaves: [ex0, ex1, ez0, ez1] } = w, { top, eave, ridge } = WINGS;
  a.box("boards", x0, x1, BASE, top, z0, z1);
  a.box("trim", x0 - 0.06, x1 + 0.06, FLOOR[0], FLOOR[1], z0 - 0.06, z1 + 0.06);
  // the deep eaves: a white soffit and fascia slab under the hipped roof, on brackets above a plain frieze
  a.box("paint", ex0, ex1, top, eave, ez0, ez1);
  hip(a, ex0, ex1, ez0, ez1, eave, ridge);
  for (const [cx, sx] of [[x0, -1], [x1, 1]]) for (const [cz, sz] of [[z0, -1], [z1, 1]]) cornerBoard(a, cx, cz, sx, sz, 0, top);
  const fEnd = face("x", end < 0 ? x0 : x1, end), fFront = face("z", z1, 1), fBack = face("z", z0, -1);
  const fIn = face("x", end < 0 ? x1 : x0, -end);
  const inner = end < 0 ? [FRONT.x[0], x1] : [x0, FRONT.x[1]];      // the front range covers this much of the wing's front
  const open = end < 0 ? [x0, FRONT.x[0]] : [FRONT.x[1], x1];        // the rest is open, above its balcony bay
  brackets(a, fEnd, z0, z1, top);
  brackets(a, fFront, open[0], open[1], top);
  brackets(a, fBack, x0, x1, top);
  brackets(a, fIn, z0, end < 0 ? FLATS[0][2] : FLATS[3][2], top);
  // the end: six windows a floor, the first 1.25 m from the front corner (hRE5); the south-east end's ground
  // floor is behind the low range there, all but its first
  const zs = spread(z0, z1, 6, 1.25);
  for (const u of zs) {
    sash(a, fEnd, u, WUPPER.y, 1.0, WUPPER.h, { cols: 3, rows: 2 });
    if (end > 0 || u > 2.6) sash(a, fEnd, u, GROUND.y, 1.1, GROUND.h, { cols: 3, rows: 3 });
  }
  // the front, above the balcony bay: tall windows onto the balcony
  for (const u of spread(open[0], open[1], 3, 1.05)) sash(a, fFront, u, 5.45, 1.0, 2.75, { cols: 3, rows: 3 });
  // the back and the side to the courtyard, above the single-storey rooms
  for (const u of spread(x0, x1, 2, 2.0)) sash(a, fBack, u, WUPPER.y, 1.0, WUPPER.h, { cols: 3, rows: 2 });
  if (end < 0) for (const u of spread(z0, -4.25, 2, 1.3)) sash(a, fIn, u, WUPPER.y, 1.0, WUPPER.h, { cols: 3, rows: 2 });
}

function rearWing(a) {
  const { x: [x0, x1], z: [z0, z1], eaves: [ex0, ex1, ez0], top, eave, ridge } = REAR;
  a.box("boards", x0, x1, BASE, top, z0, z1);
  a.box("paint", ex0, ex1, top, eave, ez0, z1);
  // hipped at the back; its front hip runs into the front range's roof and is hidden there
  hip(a, ex0, ex1, ez0, 5.1, eave, ridge);
  for (const [cx, sx] of [[x0, -1], [x1, 1]]) cornerBoard(a, cx, z0, sx, -1, 0, top);
  const fb = face("z", z0, -1), fx = face("x", x1, 1);
  brackets(a, fb, x0, x1, top);
  brackets(a, fx, z0, FLATS[2][2], top);
  for (const u of spread(x0, x1, 2, 1.6)) sash(a, fb, u, WUPPER.y, 1.0, WUPPER.h, { cols: 3, rows: 2 });
}

function flats(a) {
  for (const [x0, x1, z0, z1, t] of FLATS) {
    a.box("boards", x0, x1, BASE, t - 0.35, z0, z1);
    a.box("trim", x0 - 0.1, x1 + 0.1, t - 0.35, t - 0.12, z0, z1);
    a.box("roofPale", x0, x1, t - 0.12, t, z0, z1);
  }
  // windows on the two wide blocks' backs
  for (const u of spread(-15.0, -8.25, 2, 1.6)) sash(a, face("z", -4.25, -1), u, WUPPER.y, 1.0, 1.9, { cols: 3, rows: 2 });
  for (const u of spread(8.0, 14.6, 2, 1.6)) sash(a, face("z", -5.5, -1), u, WUPPER.y, 1.0, 1.9, { cols: 3, rows: 2 });
}

export function main(b) {
  const a = new Acc();
  frontRange(a);
  middleBay(a);
  wing(a, WINGS.se, -1);
  wing(a, WINGS.nw, 1);
  rearWing(a);
  flats(a);
  a.flush(b);
}

// The chimneys, from the LiDAR's spikes: two large stacks over the ends of the front range and one
// over the middle behind; white, with moulded caps (hRE5). [x0, x1, z0, z1, top]
export const CHIMNEYS = [[-16.45, -14.65, 1.35, 4.1, 14.1], [13.85, 15.7, 1.85, 4.55, 14.2], [-1.35, -0.3, -1.3, -0.25, 13.95], [18.45, 20.05, -4.55, -3.95, 12.95]];

export function chimneys(b) {
  const a = new Acc();
  for (const [x0, x1, z0, z1, t] of CHIMNEYS) {
    a.box("paint", x0, x1, 9.8, t - 0.55, z0, z1);
    a.box("paint", x0 - 0.06, x1 + 0.06, t - 0.85, t - 0.72, z0 - 0.06, z1 + 0.06);   // a necking band
    a.box("paint", x0 - 0.1, x1 + 0.1, t - 0.55, t - 0.4, z0 - 0.1, z1 + 0.1);        // the cap's mouldings
    a.box("paint", x0 - 0.17, x1 + 0.17, t - 0.4, t - 0.22, z0 - 0.17, z1 + 0.17);
    a.box("paint", x0 - 0.05, x1 + 0.05, t - 0.22, t, z0 - 0.05, z1 + 0.05);
    a.box("void", x0 + 0.15, x1 - 0.15, t - 0.01, t + 0.005, z0 + 0.15, z1 - 0.15);   // the dark flues
  }
  a.flush(b);
}
