// The south-west range's small kit: boxes, flat quads and triangles gathered by material and added to the
// Builder once each (one merge entry a material), drawn in a wall's own face frame: u along the wall to the
// right as seen from outside, y up, d out of the wall toward the viewer (d = 0 on the brick face). faceMatrix()
// takes that frame into the range's frame (x', z'; parts/common.js) or the view frame. Materials: brick,
// render (cream), paint (frames, bars), glassPale (panes), roofGrey, void.
import * as THREE from "three";
import { boxesGeometry, quadsGeometry } from "../../kit/gothic.js";

/** Boxes, flat quads (facing +d) and triangles by material, added to the Builder once each by flush(). */
export class Acc {
  constructor() { this.boxes = {}; this.quads = {}; this.tris = {}; }
  box(m, u0, u1, y0, y1, d0, d1) {
    if (u1 - u0 <= 1e-4 || y1 - y0 <= 1e-4 || d1 - d0 <= 1e-4) return;
    (this.boxes[m] ??= []).push([u0, u1, y0, y1, d0, d1]);
  }
  quad(m, u0, u1, y0, y1, d) { (this.quads[m] ??= []).push([u0, u1, y0, y1, d]); }
  /** Raw triangles (flat array of 9 numbers each), wound as given. */
  tri(m, ...v) { (this.tris[m] ??= []).push(...v); }
  /**
   * A box turned in the face plane: centred at (cu, cy), w along its own axis turned `ang` from u, h across
   * it, d0..d1 out. 12 triangles.
   */
  rbox(m, cu, cy, ang, w, h, d0, d1) {
    const c = Math.cos(ang), s = Math.sin(ang), hw = w / 2, hh = h / 2;
    const p = (a, b2, d) => [cu + a * c - b2 * s, cy + a * s + b2 * c, d];
    const v = [p(-hw, -hh, d0), p(hw, -hh, d0), p(hw, hh, d0), p(-hw, hh, d0), p(-hw, -hh, d1), p(hw, -hh, d1), p(hw, hh, d1), p(-hw, hh, d1)];
    const F = [[4, 5, 6, 7], [1, 0, 3, 2], [5, 1, 2, 6], [0, 4, 7, 3], [7, 6, 2, 3], [0, 1, 5, 4]];
    const out = (this.tris[m] ??= []);
    for (const [a, b2, e, f] of F) out.push(...v[a], ...v[b2], ...v[e], ...v[a], ...v[e], ...v[f]);
  }
  flush(b) {
    for (const [m, list] of Object.entries(this.boxes)) if (list.length) b.add(boxesGeometry(list), m);
    for (const [m, list] of Object.entries(this.quads)) if (list.length) b.add(quadsGeometry(list), m);
    for (const [m, list] of Object.entries(this.tris)) {
      if (!list.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(list, 3));
      b.add(g, m);
    }
    this.boxes = {}; this.quads = {}; this.tris = {};
  }
}

/**
 * The matrix from a face frame (u right, y up, d out) to its parent frame, for a wall whose outward normal
 * is `out` ([x, z], unit) and whose face passes through (x, z) = `at`, with u at that point = 0.
 */
export function faceMatrix(out, at) {
  const [ox, oz] = out;
  // right = out x up ... seen from outside looking in (-out), right = (-out) x up = (oz, 0, -ox)
  const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(-oz, 0, ox).negate(), new THREE.Vector3(0, 1, 0), new THREE.Vector3(ox, 0, oz));
  m.setPosition(at[0], 0, at[1]);
  return m;
}

/**
 * A sash window in an opening u0..u1, y0..y1 in a wall, the frame set back `set` from the face: the
 * panes (glassPale) behind, a white-grey box frame, two sashes with a meeting rail at `meet` (fraction from
 * the bottom), and glazing bars: `cols` by `rows` panes in each sash ([lower, upper] arrays or numbers).
 * The reveal (the sides of the opening) in `reveal` material.
 */
export function sash(acc, u0, u1, y0, y1, { set = 0.14, cols = [2, 2], rows = [2, 2], meet = 0.5, frame = 0.07, rail = 0.05, bar = 0.026, reveal = "brick", sill = true } = {}) {
  const C = Array.isArray(cols) ? cols : [cols, cols], R = Array.isArray(rows) ? rows : [rows, rows];
  const d = -set;
  acc.quad("glassPale", u0, u1, y0, y1, d - 0.03);
  // reveal: the opening's sides and head
  acc.box(reveal, u0 - 0.02, u0, y0, y1, d - 0.03, 0.001);
  acc.box(reveal, u1, u1 + 0.02, y0, y1, d - 0.03, 0.001);
  acc.box(reveal, u0, u1, y1, y1 + 0.02, d - 0.03, 0.001);
  // box frame
  acc.box("paint", u0, u0 + frame, y0, y1, d - 0.02, d + 0.02);
  acc.box("paint", u1 - frame, u1, y0, y1, d - 0.02, d + 0.02);
  acc.box("paint", u0, u1, y1 - frame, y1, d - 0.02, d + 0.02);
  acc.box("paint", u0, u1, y0, y0 + frame * 1.2, d - 0.02, d + 0.03);
  const ym = y0 + (y1 - y0) * meet;
  acc.box("paint", u0 + frame, u1 - frame, ym - rail / 2, ym + rail / 2, d - 0.01, d + 0.035);
  // glazing bars as flat strips just in front of the glass
  const a = u0 + frame, b2 = u1 - frame;
  for (const [s0, s1, nc, nr] of [[y0 + frame * 1.2, ym - rail / 2, C[0], R[0]], [ym + rail / 2, y1 - frame, C[1], R[1]]]) {
    for (let k = 1; k < nc; k++) { const uu = a + ((b2 - a) * k) / nc; acc.quad("paint", uu - bar / 2, uu + bar / 2, s0, s1, d + 0.012); }
    for (let k = 1; k < nr; k++) { const yy = s0 + ((s1 - s0) * k) / nr; acc.quad("paint", a, b2, yy - bar / 2, yy + bar / 2, d + 0.012); }
  }
  if (sill) acc.box("render", u0 - 0.04, u1 + 0.04, y0 - 0.06, y0, d, 0.02);
}

/**
 * An eared (lugged) architrave round an opening u0..u1, y0..y1: a band `w` wide and `proud` out, with ears
 * at the head that run out `ear` sideways and drop `drop` below the head.
 */
export function eared(acc, u0, u1, y0, y1, { w = 0.16, proud = 0.06, ear = 0.08, drop = 0.28, m = "render", foot = 0 } = {}) {
  acc.box(m, u0 - w, u0, y0 - foot, y1, 0, proud);
  acc.box(m, u1, u1 + w, y0 - foot, y1, 0, proud);
  acc.box(m, u0 - w - ear, u1 + w + ear, y1, y1 + w, 0, proud);
  acc.box(m, u0 - w - ear, u0 - w, y1 - drop, y1, 0, proud);
  acc.box(m, u1 + w, u1 + w + ear, y1 - drop, y1, 0, proud);
  // a fine inner bead
  acc.box(m, u0 - 0.03, u0, y0, y1 + 0.03, 0, proud + 0.02);
  acc.box(m, u1, u1 + 0.03, y0, y1 + 0.03, 0, proud + 0.02);
  acc.box(m, u0 - 0.03, u1 + 0.03, y1, y1 + 0.03, 0, proud + 0.02);
}

/**
 * A wall u0..u1, y0..y1, d0..d1 with rectangular holes [hu0, hu1, hy0, hy1]: cut into horizontal bands at the
 * holes' top and bottom edges, each band filled between the holes that cross it. Few boxes.
 */
export function wallWithHoles(acc, m, u0, u1, y0, y1, d0, d1, holes) {
  const ys = [...new Set([y0, y1, ...holes.flatMap((h) => [h[2], h[3]]).filter((y) => y > y0 && y < y1)])].sort((a, c) => a - c);
  for (let i = 0; i < ys.length - 1; i++) {
    const a = ys[i], c = ys[i + 1], mid = (a + c) / 2;
    const cut = holes.filter((h) => h[2] < mid && h[3] > mid).map((h) => [Math.max(u0, h[0]), Math.min(u1, h[1])]).sort((p, q) => p[0] - q[0]);
    let u = u0;
    for (const [h0, h1] of cut) { if (h0 > u) acc.box(m, u, h0, a, c, d0, d1); u = Math.max(u, h1); }
    if (u < u1) acc.box(m, u, u1, a, c, d0, d1);
  }
}

/** A row of small blocks (dentils, modillions) along u0..u1 at y0..y1, d0..d1 out, `w` wide, `step` apart. */
export function blocks(acc, m, u0, u1, y0, y1, d0, d1, w, step) {
  const n = Math.max(1, Math.floor((u1 - u0 - w) / step));
  const s = (u1 - u0 - w) / n;
  for (let i = 0; i <= n; i++) { const u = u0 + i * s; acc.box(m, u, u + w, y0, y1, d0, d1); }
}

/**
 * A column standing on the face frame's ground at (u, d): a round shaft from y0 to y1 of radius r (slightly
 * tapered to `top` times r), a square plinth and a torus-like base, a capital (necking, echinus, abacus).
 * The shaft is a cylinder of `seg` sides added straight to the Builder (matrix already set).
 */
export function column(b, acc, u, d, y0, y1, r, { seg = 16, top = 0.88, m = "render" } = {}) {
  const base = r * 0.9, cap = r * 1.1;
  // plinth and base mouldings
  acc.box(m, u - r * 1.3, u + r * 1.3, y0, y0 + base * 0.45, d - r * 1.3, d + r * 1.3);
  const sh = new THREE.CylinderGeometry(r * top, r, y1 - y0 - base - cap, seg, 1, true);
  sh.translate(u, y0 + base + (y1 - y0 - base - cap) / 2, d);
  b.add(sh, m);
  const torus = new THREE.CylinderGeometry(r * 1.12, r * 1.2, base * 0.55, seg, 1, false);
  torus.translate(u, y0 + base * 0.45 + base * 0.275, d);
  b.add(torus, m);
  // capital: necking ring, an echinus (a short flared cylinder) and a square abacus
  const yc = y1 - cap;
  const neck = new THREE.CylinderGeometry(r * top * 1.08, r * top * 1.08, cap * 0.18, seg, 1, false);
  neck.translate(u, yc + cap * 0.09, d);
  b.add(neck, m);
  const ech = new THREE.CylinderGeometry(r * 1.2, r * top, cap * 0.4, seg, 1, false);
  ech.translate(u, yc + cap * 0.18 + cap * 0.2, d);
  b.add(ech, m);
  acc.box(m, u - r * 1.32, u + r * 1.32, yc + cap * 0.58, y1, d - r * 1.32, d + r * 1.32);
}

/**
 * Rusticated (banded) pilaster u0..u1 from y0 to y1, `proud` out of the face: courses `course` high with
 * deep horizontal joints `joint` high, the joints set back `deep`.
 */
export function rusticated(acc, u0, u1, y0, y1, proud, { course = 0.45, joint = 0.06, deep = 0.05, m = "render" } = {}) {
  const n = Math.max(1, Math.round((y1 - y0) / course));
  const h = (y1 - y0) / n;
  acc.box(m, u0 + 0.01, u1 - 0.01, y0, y1, 0, proud - deep);
  for (let i = 0; i < n; i++) acc.box(m, u0, u1, y0 + i * h + joint / 2, y0 + (i + 1) * h - joint / 2, proud - deep, proud);
}

/**
 * A segmental arc band in the face plane: centre (cu, cy), radii r0..r1, from angle a0 to a1 (radians,
 * measured from +u), d0..d1 out; `n` segments. Triangles into acc (material m).
 */
export function arcBand(acc, m, cu, cy, r0, r1, a0, a1, d0, d1, n = 16, ends = true) {
  const P = (r, a, d) => [cu + r * Math.cos(a), cy + r * Math.sin(a), d];
  for (let i = 0; i < n; i++) {
    const t0 = a0 + ((a1 - a0) * i) / n, t1 = a0 + ((a1 - a0) * (i + 1)) / n;
    // front face (d1) and back (d0)
    acc.tri(m, ...P(r0, t0, d1), ...P(r1, t0, d1), ...P(r1, t1, d1));
    acc.tri(m, ...P(r0, t0, d1), ...P(r1, t1, d1), ...P(r0, t1, d1));
    // outer surface (r1) and inner soffit (r0)
    acc.tri(m, ...P(r1, t0, d1), ...P(r1, t0, d0), ...P(r1, t1, d0));
    acc.tri(m, ...P(r1, t0, d1), ...P(r1, t1, d0), ...P(r1, t1, d1));
    acc.tri(m, ...P(r0, t0, d0), ...P(r0, t0, d1), ...P(r0, t1, d1));
    acc.tri(m, ...P(r0, t0, d0), ...P(r0, t1, d1), ...P(r0, t1, d0));
  }
  if (ends) for (const [t, s] of [[a0, 1], [a1, -1]]) {
    const q = [P(r0, t, d0), P(r1, t, d0), P(r1, t, d1), P(r0, t, d1)];
    if (s > 0) acc.tri(m, ...q[0], ...q[1], ...q[2], ...q[0], ...q[2], ...q[3]);
    else acc.tri(m, ...q[0], ...q[2], ...q[1], ...q[0], ...q[3], ...q[2]);
  }
}

/** Small blocks along an arc (modillions, dentils, voussoirs): `count` of them, each w along, h radial. */
export function arcBlocks(acc, m, cu, cy, r, a0, a1, count, w, h, d0, d1) {
  for (let i = 0; i < count; i++) {
    const a = a0 + ((a1 - a0) * (i + 0.5)) / count;
    acc.rbox(m, cu + (r + h / 2) * Math.cos(a), cy + (r + h / 2) * Math.sin(a), a + Math.PI / 2, w, h, d0, d1);
  }
}
