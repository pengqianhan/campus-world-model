// The lower ranges behind the main block (south-west, round a courtyard), drawn from the LiDAR alone
// (no photograph shows them): plain painted weatherboard walls, sash windows in ochre surrounds, light
// grey roofs of the shapes and heights the LiDAR shows, white fascias, gutters and downpipes (the
// downpipe on the south-east end in hRE5 is painted like the trim of the eaves). Heights from the ground
// at the porch (37.5 m); the ground behind stands at about 0.2-1.2 m, so the walls start below it.
// Measured in data/old-government-house_pts.npy, in the view frame (x, z), class 6 at 0.5 m (round 2's
// changes from round 1 marked *):
//   south range   gable along its length, turned 2.6 deg off the frame (ridge z = -19.1 at x = -5.25 to
//                 -18.37 at x = 11.25); ridge 9.4-9.55, eaves 5.72-5.86 both sides (slopes 30 deg); three
//                 chimneys on the ridge (tops 10.48, 10.59, 10.72); *its west end square to the frame at
//                 x = -7.4, its east end at x = 16.0 (north) to 16.15 (south);
//   east range    x 16-22, gable along x, ridge z = -18.1 at 6.55, eaves 4.65 at z = -14.6 and -21.6; *its east
//                 end at x = 22.0 (north) to 22.3 (south), the walls' points likewise; *a flat gutter at 4.7
//                 from its north eave to the north-east block (z -14.6 to -13.9); a lean-to behind it to
//                 *z = -25.0 (4.35 to 3.8);
//   north-east    x 14.6-22.8, *z -13.95 to -9.6 (to the main block's north-west wing): flat at 7.6-7.8, a
//                 parapet at 8.3-8.4 on its south (*z -13.95 to -13.55) and north-west (*x 22.2-22.8) sides;
//   west range    *x -10.6 to -7.5, z -25.65 to -8: a narrow gable along z, *ridge x = -8.7 at 4.5, *eaves
//                 3.55 (west) and 3.9;
//   south-east    x -16 to *-10.6, z -15.3 to -8: gable along x, ridge z = -11.75 at 5.2, eaves 3.95, *its
//                 east end hipped (4.4 at x -11.25, 4.0 at -10.75); a block of two low storeys at *x -16.7 to
//                 -14.1, z -15.6 to -11.4 (lean-to *7.75 to 6.95, chimney 8.84; a tree hides its west side);
//                 a lean-to against the main block (z -8 to -4.25, 3.9 to 5.0);
//   courtyard     flat roofs at 3.65 (*x -2.45 to 9.25) and *a lean-to from 3.75 to 4.2 (x -7.5 to -4.55),
//                 *a thin wall to 5.6 at x -5.5 to -5.1, a lean-to rising to 5.45 *to z -5.0 and a narrow block
//                 to 7.1 against the main block's north-west wing; open ground (class 2) at x 4.6-9.25,
//                 z -7.4 to -5.2 and in a light well at *x -4.5 to -2.6, z -12.2 to -10.
import * as THREE from "three";
import { boxesGeometry } from "../../kit/gothic.js";
import { MEASURED } from "./common.js";

// The shared sizes (parts/common.js), with round 2's re-measurements over them (for the lead to move
// into common.js; the rest of each entry is common.js's own).
const W = { ...MEASURED.west, x: [-10.6, -7.5], z: [-25.65, -8], eave: 3.55, ridgeX: -8.7, eaveEast: 3.9 };
const E = { ...MEASURED.east, end: [22.3, 22.0] };                       // east end at z -21.6 and -14.6
const NE = { ...MEASURED.northEast, z: [-13.95, -9.6] };
const SE = { ...MEASURED.southEast, x: [-16, -10.6], ridgeZ: -11.75, hipTo: -13.0 };

// ---- small helpers: everything is gathered per material, then added once (per frame matrix) ----
const BOXES = ["boards", "trim", "paint", "glassPale", "roofPale"];
function bag() { const k = { tris: { boards: [], roofPale: [], paint: [] } }; for (const m of BOXES) k[m] = []; return k; }
function flush(b, k) {
  for (const m of BOXES) if (k[m].length) b.add(boxesGeometry(k[m]), m);
  for (const [m, p] of Object.entries(k.tris)) {
    if (!p.length) continue;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.computeVertexNormals();
    b.add(g, m);
  }
}
/** A polygon (fan from its first point), both sides. */
function poly(k, m, pts) {
  const p = k.tris[m];
  for (let i = 1; i < pts.length - 1; i++) {
    p.push(...pts[0], ...pts[i], ...pts[i + 1]);
    p.push(...pts[0], ...pts[i + 1], ...pts[i]);
  }
}
/** P(a, y, c): a along the range, c across it; axis "x" (ridge along x) or "z". */
const at = (axis) => (axis === "x" ? (a, y, c) => [a, y, c] : (a, y, c) => [c, y, a]);
/** A box given along (a) and across (c) a range. */
function boxAC(k, m, axis, a0, a1, y0, y1, c0, c1) {
  const [A0, A1, C0, C1] = [Math.min(a0, a1), Math.max(a0, a1), Math.min(c0, c1), Math.max(c0, c1)];
  k[m].push(axis === "x" ? [A0, A1, y0, y1, C0, C1] : [C0, C1, y0, y1, A0, A1]);
}
/** An end of a roof: a number, or [at C0, at C1] for an end that is not square to the range. */
const endAt = (v, C0, C1) => (typeof v === "number" ? () => v : (c) => v[0] + ((v[1] - v[0]) * (c - C0)) / (C1 - C0));

/**
 * A gabled range: walls (a0..a1 by c0..c1 from y = base) under a roof over A0..A1 by C0..C1 with its
 * ridge at c = cr, height R, and eaves at the roof's edges e0 (at C0) and e1 (at C1). A0 and A1 may be
 * [at C0, at C1] (an end askew to the range): its end wall then follows the roof's end, as far in as a0
 * (a1) is at the ridge. hips: [h0, h1], how far the ridge stops short of each end (a hipped end);
 * otherwise a gable end (boards) where `ends` asks. Returns the walls' top and their ends, (c) => a.
 */
function gable(k, axis, { A0, A1, C0, C1, cr, R, e0, e1, a0, a1, c0, c1, base = -0.4, ends = [true, true], hips = [0, 0] }) {
  const P = at(axis), f0 = endAt(A0, C0, C1), f1 = endAt(A1, C0, C1);
  const h = (c) => (c <= cr ? R - ((R - e0) * (cr - c)) / (cr - C0) : R - ((R - e1) * (c - cr)) / (C1 - cr));
  const r0 = f0(cr) + hips[0], r1 = f1(cr) - hips[1];
  poly(k, "roofPale", [P(f0(C0), e0, C0), P(f1(C0), e0, C0), P(r1, R, cr), P(r0, R, cr)]);
  poly(k, "roofPale", [P(r0, R, cr), P(r1, R, cr), P(f1(C1), e1, C1), P(f0(C1), e1, C1)]);
  if (hips[0]) poly(k, "roofPale", [P(f0(C0), e0, C0), P(r0, R, cr), P(f0(C1), e1, C1)]);
  if (hips[1]) poly(k, "roofPale", [P(f1(C0), e0, C0), P(r1, R, cr), P(f1(C1), e1, C1)]);
  const top = Math.min(h(c0), h(c1));
  const wall = [A0, A1].map((v, i) => { const f = i ? f1 : f0, w = i ? a1 : a0; if (typeof v === "number") return () => w; const d = w - f(cr); return (c) => f(c) + d; });
  // the walls as a box to the innermost point of an askew end, and the rest of that end as a wedge
  const b0 = Math.max(wall[0](c0), wall[0](c1)), b1 = Math.min(wall[1](c0), wall[1](c1));
  boxAC(k, "boards", axis, b0, b1, base, top, c0, c1);
  [[A0, b0, wall[0]], [A1, b1, wall[1]]].forEach(([v, bb, a]) => {
    if (typeof v === "number") return;
    poly(k, "boards", [P(a(c0), base, c0), P(a(c1), base, c1), P(a(c1), top, c1), P(a(c0), top, c0)]);
    for (const c of [c0, c1]) if (Math.abs(a(c) - bb) > 1e-6) poly(k, "boards", [P(bb, base, c), P(a(c), base, c), P(a(c), top, c), P(bb, top, c)]);
  });
  ends.forEach((e, i) => {
    if (!e || hips[i]) return;
    const a = wall[i], f = i ? f1 : f0, s = i ? -1 : 1, ab = (c) => f(c) + s * 0.03;
    poly(k, "boards", [P(a(c0), top, c0), P(a(c0), h(c0), c0), P(a(cr), R, cr), P(a(c1), h(c1), c1), P(a(c1), top, c1)]);
    // a white barge board under the roof's edge up each rake, and a soffit from it back to the wall
    for (const [p, q] of [[C0, cr], [cr, C1]]) {
      poly(k, "paint", [P(ab(p), h(p) - 0.02, p), P(ab(q), h(q) - 0.02, q), P(ab(q), h(q) - 0.24, q), P(ab(p), h(p) - 0.24, p)]);
      poly(k, "paint", [P(ab(p), h(p) - 0.06, p), P(ab(q), h(q) - 0.06, q), P(a(q), h(q) - 0.06, q), P(a(p), h(p) - 0.06, p)]);
    }
  });
  return { top, wall };
}

/** A lean-to: walls a0..a1 by c0..c1, the roof over A0..A1 by C0..C1 falling from hHigh at C1 to hLow at C0. */
function leanTo(k, axis, { A0, A1, C0, C1, hLow, hHigh, a0, a1, c0, c1, base = -0.4 }) {
  const P = at(axis), h = (c) => hLow + ((hHigh - hLow) * (c - C0)) / (C1 - C0);
  poly(k, "roofPale", [P(A0, hLow, C0), P(A1, hLow, C0), P(A1, hHigh, C1), P(A0, hHigh, C1)]);
  const lo = h(c0), hi = h(c1);
  boxAC(k, "boards", axis, a0, a1, base, lo, c0, c1);
  poly(k, "boards", [P(a0, lo, c1), P(a1, lo, c1), P(a1, hi, c1), P(a0, hi, c1)]);
  for (const a of [a0, a1]) poly(k, "boards", [P(a, lo, c0), P(a, lo, c1), P(a, hi, c1)]);
}

/** A flat-roofed block: walls to h - 0.15, a roof slab overhanging by `over`. */
function flat(k, x0, x1, z0, z1, h, over = 0.12, base = -0.4) {
  k.boards.push([x0, x1, base, h - 0.15, z0, z1]);
  k.roofPale.push([x0 - over, x1 + over, h - 0.15, h, z0 - over, z1 + over]);
}

/** Corner boards (ochre) at the four corners of a wall box. */
function corners(k, x0, x1, z0, z1, y0, y1, t = 0.1) {
  for (const x of [x0, x1]) for (const z of [z0, z1]) k.trim.push([x - t, x + t, y0, y1, z - t, z + t]);
}

/**
 * An eave's plain parts, under the roof's edge (so the roof seen from above is unchanged): a white fascia
 * board and a gutter in front of it, a boxed soffit back to the wall, along a0..a1 at the roof's edge c = C (out: +1 or -1, the side the
 * roof falls to), eave height e; and a downpipe at each `pipes` position down the wall at c = wall, from
 * the gutter to y = to (the ground, or a lower roof), with a short neck back to the wall.
 */
function eave(k, axis, a0, a1, C, out, e, wall, pipes = [], to = -0.4) {
  boxAC(k, "paint", axis, a0, a1, e - 0.26, e - 0.02, C - out * 0.17, C - out * 0.13);   // fascia
  boxAC(k, "paint", axis, a0, a1, e - 0.21, e - 0.03, C - out * 0.13, C + out * 0.005);  // gutter
  boxAC(k, "paint", axis, a0, a1, e - 0.3, e - 0.26, wall, C - out * 0.17);              // boxed soffit
  for (const a of pipes) {
    boxAC(k, "paint", axis, a - 0.045, a + 0.045, e - 0.32, e - 0.2, wall + out * 0.02, C - out * 0.06);
    boxAC(k, "paint", axis, a - 0.045, a + 0.045, to, e - 0.2, wall + out * 0.02, wall + out * 0.11);
  }
}

/**
 * Sash windows on a wall face: n is the face's outward normal ("x+", "x-", "z+", "z-") and f its position;
 * us the centres along the face; sill y and height hh; width w. An ochre surround and sill, pale glass,
 * white sash frames, meeting rail and glazing bars (two panes by two in each sash).
 */
function sashes(k, n, f, us, y, hh, w = 1.0) {
  const s = n[1] === "+" ? 1 : -1;
  const box = (m, u0, u1, y0, y1, d0, d1) => {
    const p = f + s * d0, q = f + s * d1;
    k[m].push(n[0] === "z" ? [u0, u1, y0, y1, Math.min(p, q), Math.max(p, q)] : [Math.min(p, q), Math.max(p, q), y0, y1, u0, u1]);
  };
  for (const u of us) {
    const l = u - w / 2, r = u + w / 2, top = y + hh, mid = y + hh / 2, t = 0.05, bar = 0.03;
    box("trim", l - 0.13, r + 0.13, y - 0.08, top + 0.14, -0.02, 0.05);   // surround
    box("trim", l - 0.2, r + 0.2, y - 0.16, y - 0.04, -0.02, 0.13);       // sill
    box("glassPale", l, r, y, top, 0.05, 0.065);
    const d0 = 0.06, d1 = 0.085;
    box("paint", l, l + t, y, top, d0, d1); box("paint", r - t, r, y, top, d0, d1);   // sash stiles
    box("paint", l, r, y, y + t, d0, d1); box("paint", l, r, top - t, top, d0, d1);   // bottom and top rails
    box("paint", l, r, mid - 0.035, mid + 0.035, d0, d1 + 0.01);                     // meeting rail
    box("paint", u - bar / 2, u + bar / 2, y, top, d0, d1);                          // glazing bars
    box("paint", l, r, y + hh / 4 - bar / 2, y + hh / 4 + bar / 2, d0, d1);
    box("paint", l, r, y + (3 * hh) / 4 - bar / 2, y + (3 * hh) / 4 + bar / 2, d0, d1);
  }
}

/** A chimney stack (boards) with a white cap, from y0 to top, centred at (x, z), sx by sz. */
function chimney(k, x, z, sx, sz, y0, top) {
  k.boards.push([x - sx / 2, x + sx / 2, y0, top - 0.25, z - sz / 2, z + sz / 2]);
  k.paint.push([x - sx / 2 - 0.1, x + sx / 2 + 0.1, top - 0.25, top, z - sz / 2 - 0.1, z + sz / 2 + 0.1]);
}

// ---- the south range, in its own frame: u along the ridge, v across it (+v toward the courtyard) ----
const SOUTH = { pivot: [-2, -18.93], turn: Math.atan2(1.08, 24) };  // ridge through (-2, -18.93), 2.58 deg
/** u in the south range's frame of the frame's x = X on the line v (its west end is square to the frame). */
const southU = (X, v) => (X - SOUTH.pivot[0] + v * Math.sin(SOUTH.turn)) / Math.cos(SOUTH.turn);

function southRange(b) {
  const k = bag();
  const R = 9.45, eave0 = 5.72, V = 6.62, wv = 6.25, A1 = 18.05, a1 = 17.7;
  const A0 = [southU(-7.4, -V), southU(-7.4, V)];
  const { top, wall } = gable(k, "x", { A0, A1, C0: -V, C1: V, cr: 0, R, e0: eave0, e1: eave0, a0: -5.1, a1, c0: -wv, c1: wv });
  for (const [u, v] of [[wall[0](-wv), -wv], [wall[0](wv), wv], [a1, -wv], [a1, wv]]) k.trim.push([u - 0.1, u + 0.1, -0.4, top, v - 0.1, v + 0.1]);
  for (const [u, t] of [[0, 10.5], [6.18, 10.6], [12.2, 10.7]]) chimney(k, u, 0, 0.9, 1.0, 8.6, t);
  sashes(k, "z-", -wv, [-3.6, -0.8, 2.0, 4.8, 7.6, 10.4, 13.2, 16.0], 1.4, 2.3, 1.0);   // the south face
  // the courtyard face: one tall window onto the light well, and above the flat roofs at 3.65 a row on
  // the south face's spacing (the wall stands 2 m clear of those roofs)
  sashes(k, "z+", wv, [-1.55], 1.0, 2.0, 0.95);
  sashes(k, "z+", wv, [2.0, 4.8, 7.6, 10.4], 4.05, 1.25, 0.9);
  // eaves: gutters along both sides, downpipes at the south face's ends and onto the flat roofs
  eave(k, "x", A0[0], A1, -V, -1, eave0, -wv, [-4.6, 17.3]);
  eave(k, "x", A0[1], A1, V, 1, eave0, wv, [0.6, 9.0], 3.65);
  b.matrix = new THREE.Matrix4().makeTranslation(SOUTH.pivot[0], 0, SOUTH.pivot[1]).multiply(new THREE.Matrix4().makeRotationY(-SOUTH.turn));
  flush(b, k);
  b.matrix = null;
}

function westRanges(k) {
  // west range: a narrow gable along z on the courtyard's south-east side
  const { top: wTop } = gable(k, "z", { A0: W.z[0], A1: W.z[1], C0: W.x[0], C1: W.x[1], cr: W.ridgeX, R: W.ridge, e0: W.eave, e1: W.eaveEast, a0: -25.4, a1: W.z[1], c0: -10.35, c1: -7.0, ends: [true, false] });
  corners(k, -10.35, -7.0, -25.4, W.z[1], -0.4, wTop);
  sashes(k, "x-", -10.35, [-24.0, -21.5, -19.0, -16.5], 1.0, 1.75, 0.9);
  sashes(k, "z-", -25.4, [-8.8], 1.0, 1.75, 0.9);
  eave(k, "z", W.z[0], SE.z[0], W.x[0], -1, W.eave, -10.35, [-25.15, -15.55]);
  // south-east low range: a gable along x, hipped at its east end down onto the west range's eave
  gable(k, "x", { A0: SE.x[0], A1: SE.x[1], C0: SE.z[0], C1: SE.z[1], cr: SE.ridgeZ, R: SE.ridge, e0: SE.eave, e1: SE.eave, a0: -15.9, a1: -10.8, c0: -15.05, c1: -8.2, ends: [false, false], hips: [0, SE.x[1] - SE.hipTo] });
  k.boards.push([-10.8, -10.35, -0.4, 3.45, -15.05, -8.2]);                // under the west range's eave
  sashes(k, "z-", -15.05, [-13.4, -12.0], 1.0, 1.8, 0.9);
  eave(k, "x", -14.1, SE.x[1] - 0.1, SE.z[0], -1, SE.eave, -15.05, [-11.0]);
  // the two-storey block at the south-east corner: a lean-to falling east, a chimney
  leanTo(k, "z", { A0: -15.6, A1: -11.4, C0: -14.1, C1: -16.7, hLow: 6.95, hHigh: 7.75, a0: -15.45, a1: -11.55, c0: -14.25, c1: -16.55 });
  corners(k, -16.55, -14.25, -15.45, -11.55, -0.4, 6.95);
  chimney(k, -16.0, -12.88, 0.7, 1.95, 6.5, 8.84);
  for (const [y, hh] of [[1.1, 2.0], [4.2, 1.8]]) {
    sashes(k, "z-", -15.45, [-15.4], y, hh, 0.95);
    sashes(k, "x-", -16.55, [-14.0], y, hh, 0.95);
  }
  eave(k, "z", -15.6, -11.4, -14.1, 1, 6.95, -14.25, [-14.6], 4.2);
  // a lean-to against the main block's back, from the south-east block to the light well
  leanTo(k, "x", { A0: -14.5, A1: -5.35, C0: -8.0, C1: -4.25, hLow: 3.9, hHigh: 5.0, a0: -14.5, a1: -5.35, c0: -8.0, c1: -4.25 });
}

function courtyard(k) {
  // west of the light well: a lean-to rising east, a thin wall to 5.6 through it, the light well's lobby
  leanTo(k, "z", { A0: -12.9, A1: -8.0, C0: -7.5, C1: -4.55, hLow: 3.75, hHigh: 4.2, a0: -12.9, a1: -8.0, c0: -7.5, c1: -4.55 });
  k.boards.push([-5.5, -5.1, -0.4, 5.5, -12.1, -7.25]);
  k.paint.push([-5.55, -5.05, 5.5, 5.62, -12.15, -7.2]);
  flat(k, -4.4, -3.0, -10.0, -7.4, 3.1, 0.06);
  sashes(k, "z-", -10.0, [-3.7], 0.9, 1.5, 0.8);                           // onto the light well
  sashes(k, "x+", -4.55, [-11.1], 1.0, 1.8, 0.85);
  // the flat-roofed rooms against the south range, and the open court north of them
  flat(k, -2.45, 9.25, -12.9, -7.5, 3.65);
  sashes(k, "z+", -7.5, [4.4, 7.2], 1.0, 1.8, 0.9);
  sashes(k, "x-", -2.45, [-11.1], 1.0, 1.8, 0.85);                          // onto the light well
  // east of the court: a lean-to rising to the narrow block, which stands against the main block's wing
  leanTo(k, "z", { A0: -12.9, A1: -5.0, C0: 9.1, C1: 12.6, hLow: 3.62, hHigh: 5.45, a0: -12.9, a1: -5.0, c0: 9.25, c1: 12.6 });
  sashes(k, "x-", 9.25, [-6.3], 0.9, 1.7, 0.9);
  eave(k, "z", -7.5, -5.0, 9.1, -1, 3.62, 9.25, [-5.3]);
  flat(k, 12.6, 13.95, -10.5, -5.75, 7.1, 0.05);
  flat(k, 12.4, 14.0, -5.75, -5.0, 5.4, 0.05);
  flat(k, 12.4, 14.6, -12.9, -10.5, 5.35, 0.05);
  // north of the court, against the main block's back: a lean-to falling south
  leanTo(k, "x", { A0: 4.8, A1: 7.9, C0: -5.72, C1: -2.25, hLow: 4.25, hHigh: 5.6, a0: 4.8, a1: 7.9, c0: -5.6, c1: -2.25 });
  sashes(k, "z-", -5.6, [6.35], 1.0, 1.8, 0.9);
  eave(k, "x", 4.8, 7.9, -5.72, -1, 4.25, -5.6, [7.6]);
}

function eastRanges(k) {
  // east range: a gable along x, its east end a gable askew like the walls' points (22.0 to 22.3)
  const { top: eTop, wall: eWall } = gable(k, "x", { A0: 15.9, A1: E.end, C0: E.z[0], C1: E.z[1], cr: -18.1, R: E.ridge, e0: E.eave, e1: E.eave, a0: 15.4, a1: 21.9, c0: -21.35, c1: -14.85, ends: [false, true] });
  for (const z of [-21.35, -14.85]) k.trim.push([eWall[1](z) - 0.1, eWall[1](z) + 0.1, -0.4, eTop, z - 0.1, z + 0.1]);
  for (const z of [-15.9, -20.5]) sashes(k, "x+", eWall[1](z), [z], 1.5, 1.9, 0.95);
  // the flat gutter between it and the north-east block
  k.boards.push([15.4, eWall[1](-14.85), -0.4, 4.55, -14.85, -13.95]);
  k.roofPale.push([15.9, 22.0, 4.55, 4.72, -14.6, -13.95]);
  // the lean-to behind it, and a small flat-roofed room at its east end
  leanTo(k, "x", { A0: 15.9, A1: 22.3, C0: -25.0, C1: -21.6, hLow: 3.8, hHigh: 4.35, a0: 15.6, a1: 21.95, c0: -24.8, c1: -21.6 });
  corners(k, 15.6, 21.95, -24.8, -21.6, -0.4, 3.8);
  sashes(k, "z-", -24.8, [17.4, 20.0], 1.5, 1.6, 0.95);
  sashes(k, "x+", 21.95, [-23.2], 1.0, 1.6, 0.9);
  eave(k, "x", 15.9, 22.3, -25.0, -1, 3.8, -24.8, [16.3, 21.6]);
  flat(k, 21.9, 23.0, -19.6, -17.0, 3.9, 0.05);
  // north-east block: two low storeys, flat roof behind a parapet on its south and north-west sides
  const [x0, x1] = NE.x, [z0, z1] = NE.z, pz = z0 + 0.4, px = x1 - 0.6;
  k.boards.push([x0, x1, -0.4, 7.6, z0, z1]);
  k.roofPale.push([x0, px, 7.6, 7.75, z0, z1]);
  k.boards.push([16.0, x1, 7.6, NE.parapet - 0.1, z0, pz], [px, x1, 7.6, NE.parapet - 0.1, z0, z1]);
  k.paint.push([15.95, x1 + 0.05, NE.parapet - 0.1, NE.parapet, z0 - 0.05, pz + 0.05], [px - 0.05, x1 + 0.05, NE.parapet - 0.1, NE.parapet, z0 - 0.05, z1]);
  corners(k, x0, x1, z0, z1, -0.4, NE.parapet - 0.1);
  sashes(k, "z-", z0, [17.2, 19.4, 21.6], 5.0, 1.7, 0.95);
  sashes(k, "x+", x1, [-11.0, -12.9], 1.3, 2.0, 0.95);
  sashes(k, "x+", x1, [-11.0, -12.9], 4.9, 1.8, 0.95);
  sashes(k, "x-", x0, [-12.2], 5.65, 1.5, 0.9);                             // above the low rooms west of it
  // downpipes from the parapet's outlets at its south-east and north-east corners
  for (const [x, z, s] of [[x1 - 0.2, z0, -1], [x1, z1 - 0.6, 1]]) {
    if (s < 0) k.paint.push([x - 0.045, x + 0.045, -0.4, 7.5, z - 0.11, z - 0.02]);
    else k.paint.push([x + 0.02, x + 0.11, -0.4, 7.5, z - 0.045, z + 0.045]);
  }
}

export function back(b) {
  southRange(b);
  const k = bag();
  westRanges(k);
  courtyard(k);
  eastRanges(k);
  flush(b, k);
}
