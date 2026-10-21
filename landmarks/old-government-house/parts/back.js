// The lower ranges behind the main block (south-west, round a courtyard), drawn from the LiDAR alone
// (no photograph shows them): plain painted weatherboard walls, sash windows in ochre surrounds, light
// grey roofs of the shapes and heights the LiDAR shows. Heights from the ground at the porch (37.5 m);
// the ground behind stands at about 0.2-1.2 m, so the walls start below it. Measured in
// data/old-government-house_pts.npy, in the view frame (x, z), class 6 at 0.5 m:
//   south range   gable along its length, turned 2.6 deg off the frame (ridge z = -19.2 at x = -8 to -18.1 at
//                 x = 16); roof 23.2 x 13.2 m, ridge 9.37-9.5, eaves 5.72-5.86 both sides (slopes 30 deg);
//                 three chimneys on the ridge (tops 10.48, 10.59, 10.72);
//   east range    x 16-22, gable along x, ridge z = -18.1 at 6.55, eaves 4.65 at z = -14.6 and -21.6; a lean-to
//                 behind it to z = -25.3 (4.3 to 3.8);
//   north-east    x 14.6-22.8, z -14.6 to -10.3: flat at 7.6-7.8 with a parapet at 8.3-8.4 on its south and
//                 north-west sides;
//   west range    x -11 to -7.5, z -26 to -8: a narrow gable along z, ridge x = -8.9 at 4.5, eaves 3.7-3.9;
//   south-east    x -16 to -11, z -15.3 to -8: gable along x, ridge z = -11.75 at 5.2, eaves 3.95; a block of
//                 two low storeys at x -16.9 to -14.4 (lean-to 7.7 to 6.9, chimney 8.84); a lean-to against the
//                 main block (z -8 to -4.25, 3.9 to 5.0);
//   courtyard     flat roofs at 3.65 (x -2.75 to 9.25) and 4.05, a wall to 5.6 at x = -5.6, a lean-to rising to
//                 5.35 and a narrow block to 7.1 against the main block's north-west wing; open ground (class 2)
//                 at x 3-9, z -7.75 to -5.5 and in a light well at x -5 to -3.
import * as THREE from "three";
import { boxesGeometry } from "../../kit/gothic.js";

// ---- small helpers: everything is gathered per material, then added once (per frame matrix) ----
function bag() { return { boards: [], trim: [], paint: [], glass: [], roofPale: [], tris: { boards: [], roofPale: [] } }; }
function flush(b, k) {
  for (const m of ["boards", "trim", "paint", "glass", "roofPale"]) if (k[m].length) b.add(boxesGeometry(k[m]), m);
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

/**
 * A gabled range: walls (a0..a1 by c0..c1 from y = base) under a roof over A0..A1 by C0..C1 with its
 * ridge at c = cr, height R, and eaves at the roof's edges e0 (at C0) and e1 (at C1); gable ends where asked.
 */
function gable(k, axis, { A0, A1, C0, C1, cr, R, e0, e1, a0, a1, c0, c1, base = -0.4, ends = [true, true] }) {
  const P = at(axis);
  const h = (c) => (c <= cr ? R - ((R - e0) * (cr - c)) / (cr - C0) : R - ((R - e1) * (c - cr)) / (C1 - cr));
  poly(k, "roofPale", [P(A0, e0, C0), P(A1, e0, C0), P(A1, R, cr), P(A0, R, cr)]);
  poly(k, "roofPale", [P(A0, R, cr), P(A1, R, cr), P(A1, e1, C1), P(A0, e1, C1)]);
  const top = Math.min(h(c0), h(c1));
  const [x0, , z0] = P(a0, 0, c0), [x1, , z1] = P(a1, 0, c1);
  k.boards.push([Math.min(x0, x1), Math.max(x0, x1), base, top, Math.min(z0, z1), Math.max(z0, z1)]);
  ends.forEach((e, i) => { if (e) { const a = i ? a1 : a0; poly(k, "boards", [P(a, top, c0), P(a, h(c0), c0), P(a, R, cr), P(a, h(c1), c1), P(a, top, c1)]); } });
  return top;
}

/** A lean-to: walls a0..a1 by c0..c1, the roof over A0..A1 by C0..C1 falling from hHigh at C1 to hLow at C0. */
function leanTo(k, axis, { A0, A1, C0, C1, hLow, hHigh, a0, a1, c0, c1, base = -0.4 }) {
  const P = at(axis), h = (c) => hLow + ((hHigh - hLow) * (c - C0)) / (C1 - C0);
  poly(k, "roofPale", [P(A0, hLow, C0), P(A1, hLow, C0), P(A1, hHigh, C1), P(A0, hHigh, C1)]);
  const lo = h(c0), hi = h(c1);
  const [x0, , z0] = P(a0, 0, c0), [x1, , z1] = P(a1, 0, c1);
  k.boards.push([Math.min(x0, x1), Math.max(x0, x1), base, lo, Math.min(z0, z1), Math.max(z0, z1)]);
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
 * Sash windows on a wall face: n is the face's outward normal ("x+", "x-", "z+", "z-") and f its position;
 * us the centres along the face; sill y and height hh; width w. An ochre surround and sill, dark glass,
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
    box("glass", l, r, y, top, 0.05, 0.065);
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

function southRange(b) {
  const k = bag();
  const R = 9.45, eave = 5.72, V = 6.62, wv = 6.25;
  const top = gable(k, "x", { A0: -5.35, A1: 17.85, C0: -V, C1: V, cr: 0, R, e0: eave, e1: eave, a0: -5.0, a1: 17.5, c0: -wv, c1: wv });
  corners(k, -5.0, 17.5, -wv, wv, -0.4, top);
  for (const [u, t] of [[0, 10.5], [6.18, 10.6], [12.2, 10.7]]) chimney(k, u, 0, 0.9, 1.0, 8.6, t);
  sashes(k, "z-", -wv, [-3.6, -0.8, 2.0, 4.8, 7.6, 10.4, 13.2, 16.0], 1.4, 2.3, 1.0);  // the south face
  b.matrix = new THREE.Matrix4().makeTranslation(SOUTH.pivot[0], 0, SOUTH.pivot[1]).multiply(new THREE.Matrix4().makeRotationY(-SOUTH.turn));
  flush(b, k);
  b.matrix = null;
}

function otherRanges(b) {
  const k = bag();
  // west range: a narrow gable along z on the courtyard's south-east side
  gable(k, "z", { A0: -26.1, A1: -8.0, C0: -11.05, C1: -7.5, cr: -8.9, R: 4.5, e0: 3.7, e1: 3.9, a0: -25.8, a1: -8.0, c0: -10.8, c1: -7.0, ends: [true, false] });
  corners(k, -10.8, -7.0, -25.8, -8.0, -0.4, 3.75);
  sashes(k, "x-", -10.8, [-24.5, -21.7, -18.9, -16.1], 1.0, 1.75, 0.9);
  sashes(k, "z-", -25.8, [-9.3], 1.0, 1.75, 0.9);
  // south-east low range: a gable along x, between the west range and the two-storey block
  gable(k, "x", { A0: -16.0, A1: -11.05, C0: -15.3, C1: -8.0, cr: -11.75, R: 5.2, e0: 3.95, e1: 3.95, a0: -15.9, a1: -10.9, c0: -15.05, c1: -8.2, ends: [false, false] });
  sashes(k, "z-", -15.05, [-13.6, -12.0], 1.0, 1.8, 0.9);
  // the two-storey block at the south-east corner: a lean-to falling north-west, a chimney
  leanTo(k, "z", { A0: -16.5, A1: -11.4, C0: -14.2, C1: -17.1, hLow: 6.84, hHigh: 7.76, a0: -16.3, a1: -11.6, c0: -14.4, c1: -16.9 });
  corners(k, -16.9, -14.4, -16.3, -11.6, -0.4, 6.9);
  chimney(k, -16.0, -12.88, 0.7, 1.95, 6.5, 8.84);
  sashes(k, "z-", -16.3, [-15.65], 1.1, 2.0, 0.95);
  sashes(k, "z-", -16.3, [-15.65], 4.2, 1.8, 0.95);
  sashes(k, "x-", -16.9, [-14.0], 1.1, 2.0, 0.95);
  sashes(k, "x-", -16.9, [-14.0], 4.2, 1.8, 0.95);
  // a lean-to against the main block's back, from the south-east block to the light well
  leanTo(k, "x", { A0: -14.5, A1: -5.35, C0: -8.0, C1: -4.25, hLow: 3.9, hHigh: 5.0, a0: -14.5, a1: -5.35, c0: -8.0, c1: -4.25 });
  // round the courtyard: flat roofs, a wall, the light well's lobby, a lean-to and a narrow block
  flat(k, -7.5, -5.85, -12.9, -8.0, 4.05);
  k.boards.push([-5.85, -5.35, -0.4, 5.6, -12.9, -7.25]);
  k.paint.push([-5.9, -5.3, 5.5, 5.62, -12.9, -7.2]);
  flat(k, -4.75, -3.25, -10.25, -7.75, 3.0);
  flat(k, -2.75, 9.25, -12.9, -7.75, 3.65);
  sashes(k, "z+", -7.75, [4.4, 7.2], 1.0, 1.8, 0.9);
  leanTo(k, "z", { A0: -12.9, A1: -5.5, C0: 9.25, C1: 12.4, hLow: 3.7, hHigh: 5.35, a0: -12.9, a1: -5.5, c0: 9.25, c1: 12.4 });
  flat(k, 12.4, 13.95, -10.6, -5.6, 7.1, 0.05);
  flat(k, 12.4, 14.6, -12.9, -10.6, 5.35, 0.05);
  leanTo(k, "x", { A0: 4.8, A1: 7.9, C0: -5.6, C1: -2.25, hLow: 4.3, hHigh: 5.6, a0: 4.8, a1: 7.9, c0: -5.6, c1: -2.25 });
  // east range: a gable along x, its north-west end a gable; a lean-to behind it; a small lean-to at its end
  gable(k, "x", { A0: 15.9, A1: 22.15, C0: -21.6, C1: -14.6, cr: -18.1, R: 6.55, e0: 4.65, e1: 4.65, a0: 15.4, a1: 21.9, c0: -21.35, c1: -14.85, ends: [false, true] });
  corners(k, 15.4, 21.9, -21.35, -14.85, -0.4, 4.75);
  sashes(k, "x+", 21.9, [-16.6, -19.6], 1.5, 1.9, 0.95);
  leanTo(k, "x", { A0: 15.9, A1: 22.1, C0: -25.35, C1: -21.6, hLow: 3.8, hHigh: 4.35, a0: 15.6, a1: 21.9, c0: -25.1, c1: -21.6 });
  corners(k, 15.6, 21.9, -25.1, -21.6, -0.4, 3.8);
  sashes(k, "z-", -25.1, [17.4, 20.0], 1.5, 1.6, 0.95);
  flat(k, 21.9, 22.8, -19.6, -17.4, 3.9, 0.05);
  // north-east block: two low storeys, flat roof behind a parapet on its south and north-west sides
  k.boards.push([14.6, 22.8, -0.4, 7.6, -14.6, -10.3]);
  k.roofPale.push([14.6, 22.4, 7.6, 7.75, -14.2, -10.3]);
  k.boards.push([14.6, 22.8, 7.6, 8.25, -14.6, -14.2], [22.4, 22.8, 7.6, 8.25, -14.6, -10.3]);
  k.paint.push([14.55, 22.85, 8.25, 8.35, -14.65, -14.15], [22.35, 22.85, 8.25, 8.35, -14.65, -10.3]);
  corners(k, 14.6, 22.8, -14.6, -10.3, -0.4, 8.25);
  sashes(k, "z-", -14.6, [16.0, 18.4, 20.8], 5.0, 1.7, 0.95);
  sashes(k, "x+", 22.8, [-11.6, -13.4], 1.3, 2.0, 0.95);
  sashes(k, "x+", 22.8, [-11.6, -13.4], 4.9, 1.8, 0.95);
  flush(b, k);
}

export function back(b) {
  southRange(b);
  otherRanges(b);
}
