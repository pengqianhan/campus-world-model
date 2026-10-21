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
import { Acc, face, fbox, sash, brackets, pairedBrackets, balustrade, quoins, cornerBoard, hip, gableZ, leanTo } from "./front_kit.js";
import { MEASURED as M } from "./common.js";

const BASE = -0.4;                         // walls start a little below the ground (0.2-0.8 m round the house)
// the front range: wall faces (0.4 m in from the cornice's edge at the ends, 0.3 at the back, 0.45 at the
// front), the cornice's top, the roof behind the balustrade
const F = M.front;
export const FRONT = { x: [F.x[0] + 0.4, F.x[1] - 0.4], z: [F.z[0] + 0.3, F.z[1] - 0.45], top: 10.0, cornice: F.cornice, ridge: F.ridge,
  roof: { x: [F.x[0] + 1.2, F.x[1] - 1.2], z: [F.z[0] + 0.3, 6.5] }, rail: -0.5, backFlush: [7.9, 14.0] };
// the middle bay of the garden front, forward under a pediment, on the axis of the porch: its walls 0.5 m in
// from the pediment's edges, its front 0.45 m behind the cornice's
export const MIDDLE = { x: [M.middle.x[0] + 0.5, M.middle.x[1] - 0.5], z: M.middle.front - 0.45, axis: M.middle.ridgeX,
  half: (M.middle.x[1] - M.middle.x[0]) / 2, ridge: M.middle.ridge };
// the end wings: wall faces 0.6 m in from the eave edges, eaves 9.9, ridge 11.6. The south-east wing's eave to
// the courtyard side stands at -14.1, not common.js's -14.4 (the LiDAR's 10.0 m roof edge covers x -14.5 to
// -14.0 from z -9.5 to -4.5; the back's roofs at 4-5 m start at -14.0)
const wingOf = ([ex0, ex1], [ez0, ez1]) => ({ x: [ex0 + 0.6, ex1 - 0.6], z: [ez0 + 0.6, ez1 - 0.6], eaves: [ex0, ex1, ez0, ez1] });
export const WINGS = {
  se: { ...wingOf(M.wings.se.x, M.wings.se.z), eaves: [M.wings.se.x[0], -14.1, ...M.wings.se.z] },
  nw: wingOf(M.wings.nw.x, M.wings.nw.z),
  top: M.wings.eave - 0.35, eave: M.wings.eave, ridge: M.wings.ridge,
};
// the wing behind the middle. Its eave edges stand at x -3.95 and 3.5, not common.js's -3.6 and 3.75 (the
// LiDAR's 10.5-10.7 m eave covers x -4.0 to -3.5 from z -7.5 to -2.5; on the other side it ends at 3.5,
// where the flat roof at 8.7-8.8 begins); the walls stay where they were
const B = M.behind;
export const REAR = { x: [B.x[0] + 0.6, B.x[1] - 0.55], z: [B.back + 0.4, F.z[0] + 0.3], eaves: [-3.95, 3.5, B.back], top: B.eave - 0.3, eave: B.eave, ridge: B.ridge };
// flat-roofed two-storey blocks behind the front range: [x0, x1, z0, z1, top]
// (the first ends at x -8.6 and z -3.9, the second at z -7.1: the LiDAR's flat roofs at 9.0-9.5 stop there, the back's at 4-6 m begin)
const FLATS = [[-15.0, -8.6, -3.9, -1.7, 9.3], [-5.35, -3.0, -7.1, -1.7, 9.4], [3.2, 4.6, -6.5, -1.7, 8.7], [8.0, 14.6, -5.2, -1.7, 9.2]];

const FLOOR = [5.0, 5.35];                 // the band between the floors
const GROUND = { y: 1.5, h: 2.8 }, UPPER = { y: 6.15, h: 2.3 }, WUPPER = { y: 6.05, h: 2.05 };

/** Window centres: n evenly spaced from u0 to u1, each `edge` from the ends. */
const spread = (u0, u1, n, edge) => Array.from({ length: n }, (_, i) => (n === 1 ? (u0 + u1) / 2 : u0 + edge + ((u1 - u0 - 2 * edge) * i) / (n - 1)));

function frontRange(a) {
  const { x: [x0, x1], z: [z0, z1], top, cornice } = FRONT;
  a.box("boards", x0, x1, BASE, top, z0, z1);
  // the cornice all round (deeper at the back, where the roof comes down to it) and a moulding under it; at
  // the back, from x 7.9 to 14.0, it stops at the wall, over the flat roof behind (the LiDAR: 9.2-9.3 m from
  // z -1.5 back there, the cornice's 10.7 at z -2.0 either side)
  const [bx0, bx1] = FRONT.backFlush;
  a.box("trim", x0 - 0.4, x1 + 0.4, top, cornice, z0 + 0.1, z1 + 0.45);
  a.box("trim", x0 - 0.18, x1 + 0.18, top - 0.3, top, z0 + 0.1, z1 + 0.2);
  for (const [u0, u1] of [[x0 - 0.4, bx0], [bx1, x1 + 0.4]]) {
    a.box("trim", u0, u1, top, cornice, z0 - 0.3, z0 + 0.1);
    a.box("trim", Math.max(u0, x0 - 0.18), Math.min(u1, x1 + 0.18), top - 0.3, top, z0 - 0.18, z0 + 0.1);
  }
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
  // the garden front's windows: four a floor either side of the middle bay. hRE5 sees the upper floor's first
  // two from the south-east end, very obliquely: tall, under pediments on consoles; the rest of the front is
  // seen in no photograph and repeats them. The ground floor's heads stay plain (no reference shows them)
  const left = spread(x0, MIDDLE.x[0], 4, 1.75), right = spread(MIDDLE.x[1], x1, 4, 1.75);
  for (const u of [...left, ...right]) {
    sash(a, gf, u, GROUND.y, 1.2, GROUND.h, { cols: 3, rows: 3 });
    sash(a, gf, u, UPPER.y, 1.08, UPPER.h, { cols: 2, rows: 3, head: "pediment", s: 0.16 });
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

// The south-east wing as hRE5 shows its end and the front above the balcony: no band between the floors,
// two tiers of windows that are not the front range's two floors. Under the eaves, short six-over-six sashes
// (glass about 0.65 by 1.3 m, sills about 7.75 m) in broad ochre surrounds; below them, on the end, one tall
// window between the first two (a staircase's, its head about 7.1 m), and on the front, windows onto the
// balcony with heads about 7.0 m. Heights from the photograph scaled by the LiDAR's eave (9.55) and the
// balcony's rail (6.3), which stand 112 px apart in it.
const SE_LOOK = { upper: { y: 7.75, w: 0.65, h: 1.3, s: 0.2 }, stair: { z: 1.75, y: 4.2, w: 0.95, h: 2.75, s: 0.2 },
  balcony: { y: 5.4, w: 0.9, h: 1.55, s: 0.2 } };

function wing(a, w, end) {
  const { x: [x0, x1], z: [z0, z1], eaves: [ex0, ex1, ez0, ez1] } = w, { top, eave, ridge } = WINGS;
  const se = end < 0;
  a.box("boards", x0, x1, BASE, top, z0, z1);
  if (!se) a.box("trim", x0 - 0.06, x1 + 0.06, FLOOR[0], FLOOR[1], z0 - 0.06, z1 + 0.06);
  // the deep eaves: a soffit and fascia slab under the hipped roof (warm in the shade, as hRE5's), on tall
  // brackets above a plain frieze
  a.box("trim", ex0, ex1, top, eave, ez0, ez1);
  for (const [u0, u1, v0, v1] of [[ex0 - 0.02, ex1 + 0.02, ez0 - 0.02, ez0], [ex0 - 0.02, ex1 + 0.02, ez1, ez1 + 0.02], [ex0 - 0.02, ex0, ez0, ez1], [ex1, ex1 + 0.02, ez0, ez1]])
    a.box("paint", u0, u1, top + 0.05, eave, v0, v1);                 // the fascia, pale above the warm soffit (hRE5)
  a.box("boards", x0 - 0.03, x1 + 0.03, top - 0.32, top, z0 - 0.03, z1 + 0.03);
  hip(a, ex0, ex1, ez0, ez1, eave, ridge);
  // corner boards: ochre, but white on the south-east wing, whose corner hRE5 shows plain
  for (const [cx, sx] of [[x0, -1], [x1, 1]]) for (const [cz, sz] of [[z0, -1], [z1, 1]]) cornerBoard(a, cx, cz, sx, sz, 0, top, 0.3, 0.05, se ? "paint" : "trim");
  const fEnd = face("x", se ? x0 : x1, end), fFront = face("z", z1, 1), fBack = face("z", z0, -1);
  const fIn = face("x", se ? x1 : x0, -end);
  const open = se ? [x0, FRONT.x[0]] : [FRONT.x[1], x1];             // the wing's front not covered by the front range
  const tall = 1.1, zIn = se ? FLATS[0][2] : FLATS[3][2];
  // the end: six windows a floor, the first 1.25 m from the front corner (hRE5)
  const zs = spread(z0, z1, 6, 1.25), xs = spread(open[0], open[1], 3, 1.05);
  const wb = spread(x0, x1, 2, 2.0), wi = spread(z0, -4.25, 2, 1.3);
  if (se) {
    const { upper: U, stair: T, balcony: L } = SE_LOOK, six = { cols: 3, rows: 2, s: U.s };
    pairedBrackets(a, fEnd, z0, z1, zs, top);
    pairedBrackets(a, fFront, open[0], open[1], xs, top);
    brackets(a, fBack, x0, x1, top, 1.6, undefined, tall);
    brackets(a, fIn, z0, zIn, top, 1.6, undefined, tall);
    for (const u of zs) sash(a, fEnd, u, U.y, U.w, U.h, six);
    sash(a, fEnd, T.z, T.y, T.w, T.h, { cols: 3, rows: 3, s: T.s });
    for (const u of xs) {
      sash(a, fFront, u, U.y, U.w, U.h, six);
      sash(a, fFront, u, L.y, L.w, L.h, { cols: 3, rows: 2, s: L.s });
    }
    // the back and the side to the courtyard (seen in no photograph): the same tier under the eaves
    for (const u of wb) sash(a, fBack, u, U.y, U.w, U.h, six);
    for (const u of wi) sash(a, fIn, u, U.y, U.w, U.h, six);
    return;
  }
  // the north-west wing, seen in no photograph: two floors as the front range's
  brackets(a, fEnd, z0, z1, top, 1.6, undefined, tall);
  brackets(a, fFront, open[0], open[1], top, 1.6, undefined, tall);
  brackets(a, fBack, x0, x1, top, 1.6, undefined, tall);
  brackets(a, fIn, z0, zIn, top, 1.6, undefined, tall);
  for (const u of zs) {
    sash(a, fEnd, u, WUPPER.y, 1.0, WUPPER.h, { cols: 3, rows: 2 });
    sash(a, fEnd, u, GROUND.y, 1.1, GROUND.h, { cols: 3, rows: 3 });
  }
  // the front, above the balcony bay: tall windows onto the balcony
  for (const u of xs) sash(a, fFront, u, 5.45, 1.0, 2.75, { cols: 3, rows: 3 });
  for (const u of wb) sash(a, fBack, u, WUPPER.y, 1.0, WUPPER.h, { cols: 3, rows: 2 });
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

// a single-storey room between the first two flat blocks, against the front range's back: the LiDAR's roof
// falls from 5.7 m at z -2.25 to 5.1 at z -4.0, from x -8.6 to -5.6 (seen in no photograph)
const BETWEEN = { x: [-8.6, -5.6], z: [-4.0, -1.7], hi: 5.75, lo: 5.1 };

function flats(a) {
  {
    const { x: [x0, x1], z: [z0, z1], hi, lo } = BETWEEN;
    a.box("boards", x0, x1, BASE, lo - 0.25, z0 + 0.3, z1);
    a.box("paint", x0, x1, lo - 0.25, lo, z0, z0 + 0.3);
    leanTo(a, x0, x1, z0, z1, "z1", hi, lo);
  }
  for (const [x0, x1, z0, z1, t] of FLATS) {
    a.box("boards", x0, x1, BASE, t - 0.35, z0, z1);
    a.box("trim", x0 - 0.1, x1 + 0.1, t - 0.35, t - 0.12, z0, z1);
    a.box("roofPale", x0, x1, t - 0.12, t, z0, z1);
  }
  // windows on the two wide blocks' backs
  for (const k of [0, 3]) {
    const [x0, x1, z0] = FLATS[k];
    for (const u of spread(x0, x1, 2, 1.6)) sash(a, face("z", z0, -1), u, WUPPER.y, 1.0, 1.9, { cols: 3, rows: 2 });
  }
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

// The chimneys, from the LiDAR's spikes: two large stacks over the ends of the front range, one over the
// middle behind, and one on each wing's ridge; white, with moulded caps (hRE5). [x0, x1, z0, z1, top]
// The wings' two stand at x 17.15-18.9 and -20.55 to -19.15, z -4.6 to -3.8, tops 12.9 and 12.85 (the LiDAR's
// 12.6-12.9 m points, 0.25 m grid); common.js has only the north-west one, at x 19.25
export const CHIMNEYS = [[-16.45, -14.65, 1.35, 4.1, 14.1], [13.85, 15.7, 1.85, 4.55, 14.2], [-1.35, -0.3, -1.3, -0.25, 13.95],
  [17.15, 18.9, -4.55, -3.85, 12.9], [-20.55, -19.15, -4.55, -3.85, 12.85]];

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
