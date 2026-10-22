// The front's small kit for a painted timber house: boxes and triangles gathered by material and added
// once each (one merge entry a material), wall faces in local (u along, y up, d out) coordinates, sash
// windows with white glazing bars in ochre surrounds, eave brackets, balustrades, quoins and corner
// boards, and hipped, gabled and lean-to roofs. Materials: boards, trim, paint, roofPale, glassPale, void, iron.
import * as THREE from "three";
import { boxesGeometry } from "../../kit/gothic.js";

/** Boxes and triangles by material, added to the Builder once each by flush(). */
export class Acc {
  constructor() { this.boxes = {}; this.tris = {}; }
  box(m, x0, x1, y0, y1, z0, z1) {
    (this.boxes[m] ??= []).push([Math.min(x0, x1), Math.max(x0, x1), Math.min(y0, y1), Math.max(y0, y1), Math.min(z0, z1), Math.max(z0, z1)]);
  }
  /** A triangle turned so that its normal points away from `inside` (a point behind it). */
  tri(m, a, c, d, inside) {
    const u = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const g = [(a[0] + c[0] + d[0]) / 3 - inside[0], (a[1] + c[1] + d[1]) / 3 - inside[1], (a[2] + c[2] + d[2]) / 3 - inside[2]];
    const flip = n[0] * g[0] + n[1] * g[1] + n[2] * g[2] < 0;
    (this.tris[m] ??= []).push(...a, ...(flip ? d : c), ...(flip ? c : d));
  }
  quad(m, a, c, d, e, inside) { this.tri(m, a, c, d, inside); this.tri(m, a, d, e, inside); }
  flush(b) {
    for (const [m, list] of Object.entries(this.boxes)) if (list.length) b.add(boxesGeometry(list), m);
    for (const [m, list] of Object.entries(this.tris)) {
      if (!list.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(list, 3));
      b.add(g, m);
    }
    this.boxes = {}; this.tris = {};
  }
}

/** A wall face: the plane x = at or z = at (axis), facing out along +out or -out. u runs along it. */
export const face = (axis, at, out) => ({ axis, at, out });
/** A point on a face: u along, y up, d out from the face. */
export const fpt = (f, u, y, d) => { const w = f.at + f.out * d; return f.axis === "z" ? [u, y, w] : [w, y, u]; };
/** A box on a face: u0..u1 along, y0..y1 up, d0..d1 out. */
export function fbox(acc, m, f, u0, u1, y0, y1, d0, d1) {
  const a = f.at + f.out * d0, c = f.at + f.out * d1;
  if (f.axis === "z") acc.box(m, u0, u1, y0, y1, a, c); else acc.box(m, a, c, y0, y1, u0, u1);
}

/**
 * A sash window centred at u on face f, its sill at y, w wide and h tall: dark glass a hair proud of the
 * wall, white sash frames, meeting rail and glazing bars (cols x rows panes a sash), an ochre architrave
 * and sill, and a head: "none", "cornice" or "pediment" (a cornice with a low triangular pediment).
 * door: a dark leaf instead of glass and no sill.
 */
export function sash(acc, f, u, y, w, h, { cols = 3, rows = 2, head = "none", s = 0.13, door = false } = {}) {
  const l = u - w / 2, r = u + w / 2, top = y + h;
  fbox(acc, door ? "void" : "glassPale", f, l, r, y, top, -0.05, 0.015);
  if (!door) {
    const t = 0.055, bt = 0.03, d0 = 0.015, d1 = 0.045, ym = y + h / 2;
    fbox(acc, "paint", f, l, r, y, y + t, d0, d1);
    fbox(acc, "paint", f, l, r, top - t, top, d0, d1);
    fbox(acc, "paint", f, l, l + t, y, top, d0, d1);
    fbox(acc, "paint", f, r - t, r, y, top, d0, d1);
    fbox(acc, "paint", f, l, r, ym - t / 2, ym + t / 2, d0, d1 + 0.01);
    for (const [s0, s1] of [[y + t, ym - t / 2], [ym + t / 2, top - t]]) {
      for (let k = 1; k < cols; k++) { const uu = l + t + ((w - 2 * t) * k) / cols; fbox(acc, "paint", f, uu - bt / 2, uu + bt / 2, s0, s1, d0, d1); }
      for (let k = 1; k < rows; k++) { const yy = s0 + ((s1 - s0) * k) / rows; fbox(acc, "paint", f, l + t, r - t, yy - bt / 2, yy + bt / 2, d0, d1); }
    }
    fbox(acc, "trim", f, l - s - 0.06, r + s + 0.06, y - 0.11, y, 0, 0.13);
  } else {
    // a pair of leaves with a fanlight above, plainly
    fbox(acc, "trim", f, u - 0.03, u + 0.03, y, top - 0.6, 0.015, 0.05);
    fbox(acc, "trim", f, l, r, top - 0.62, top - 0.55, 0.015, 0.06);
    fbox(acc, "glassPale", f, l + 0.05, r - 0.05, top - 0.55, top - 0.05, 0.016, 0.02);
  }
  fbox(acc, "trim", f, l - s, l, y, top + s, 0, 0.07);
  fbox(acc, "trim", f, r, r + s, y, top + s, 0, 0.07);
  fbox(acc, "trim", f, l - s, r + s, top, top + s, 0, 0.07);
  if (head === "cornice" || head === "pediment") {
    const a = l - s - 0.09, c = r + s + 0.09, y0 = top + s, y1 = y0 + 0.13;
    fbox(acc, "trim", f, l - s + 0.02, l - s + 0.12, y0 - 0.32, y0, 0.07, 0.16); // consoles
    fbox(acc, "trim", f, r + s - 0.12, r + s - 0.02, y0 - 0.32, y0, 0.07, 0.16);
    fbox(acc, "trim", f, a, c, y0, y1, 0, 0.19);
    if (head === "pediment") {
      const ph = 0.3, pa = fpt(f, a, y1, 0), pc = fpt(f, c, y1, 0), pt = fpt(f, u, y1 + ph, 0);
      const qa = fpt(f, a, y1, 0.17), qc = fpt(f, c, y1, 0.17), qt = fpt(f, u, y1 + ph, 0.17);
      const inside = fpt(f, u, y1 + ph / 3, 0.08);
      acc.tri("trim", qa, qc, qt, inside);
      acc.quad("trim", pa, qa, qt, pt, inside);
      acc.quad("trim", pc, pt, qt, qc, inside);
    }
  }
}

/**
 * An eave bracket (a scrolled console drawn in three steps) on face f at u, its top under the soffit, with a
 * small drop at its foot.
 */
export function bracket(acc, f, u, top, reach = 0.55, tall = 0.8) {
  const t = 0.065;
  fbox(acc, "trim", f, u - t, u + t, top - tall, top, 0, 0.12);
  fbox(acc, "trim", f, u - t, u + t, top - tall * 0.45, top, 0, 0.3);
  fbox(acc, "trim", f, u - t, u + t, top - 0.17, top, 0, reach);
  fbox(acc, "trim", f, u - t - 0.02, u + t + 0.02, top - tall - 0.08, top - tall, 0, 0.14);
}

/** Brackets along face f from u0 to u1, about `step` apart, inset from the ends. */
export function brackets(acc, f, u0, u1, top, step = 1.6, reach, tall) {
  const n = Math.max(1, Math.round((u1 - u0 - 0.6) / step));
  for (let i = 0; i <= n; i++) bracket(acc, f, u0 + 0.3 + ((u1 - u0 - 0.6) * i) / n, top, reach, tall);
}

/**
 * Brackets in pairs, one either side of each window below (at its centre -+ `gap`), and one 0.3 m in from
 * each end of the face where no pair stands close by: as on the south-east wing in hRE5.
 */
export function pairedBrackets(acc, f, u0, u1, centres, top, { gap = 0.75, reach = 0.55, tall = 1.1 } = {}) {
  const at = centres.flatMap((c) => [c - gap, c + gap]).filter((u) => u > u0 + 0.2 && u < u1 - 0.2);
  for (const e of [u0 + 0.3, u1 - 0.3]) if (at.every((u) => Math.abs(u - e) > 0.5)) at.push(e);
  for (const u of at) bracket(acc, f, u, top, reach, tall);
}

/**
 * A balustrade on face f's line at depth d, from u0 to u1, y0 to y1: ochre posts, plinth and rail, white
 * balusters. Options: `post` the spacing of the posts, `postW` their width (the two at the ends run `endW` in from the ends, half a post by default), `cap`
 * and `capH` the coping's half-width and height, `plinth` and `plinthH` the plinth's.
 */
export function balustrade(acc, f, u0, u1, y0, y1, d = 0, { post = 2.4, ends = true, postW = 0.28, endW, cap = 0.15, capH = 0.12, plinth = 0.13, plinthH = 0.12, postD = 0.16 } = {}) {
  fbox(acc, "trim", f, u0, u1, y0, y0 + plinthH, d - plinth, d + plinth);
  fbox(acc, "trim", f, u0, u1, y1 - capH, y1, d - cap, d + cap);
  const n = Math.max(1, Math.round((u1 - u0) / post)), e = endW ?? postW / 2, pw = postW / 2;
  const posts = [];
  for (let i = 0; i <= n; i++) posts.push(u0 + ((u1 - u0) * i) / n);
  // each post's extent along the face: the two at the ends run e in from the ends
  const span = (i) => (i === 0 ? [u0, u0 + e] : i === n ? [u1 - e, u1] : [posts[i] - pw, posts[i] + pw]);
  for (let i = 0; i <= n; i++) {
    if (!ends && (i === 0 || i === n)) continue;
    const [a, c] = span(i);
    fbox(acc, "trim", f, Math.max(u0, a), Math.min(u1, c), y0, y1 + 0.05, d - postD, d + postD);
  }
  const b0 = y0 + plinthH, b1 = y1 - capH, belly = b0 + (b1 - b0) * 0.45;
  for (let i = 0; i < n; i++) {
    const a = span(i)[1], c = span(i + 1)[0], k = Math.max(1, Math.round((c - a) / 0.2));
    for (let j = 0; j < k; j++) {
      const uu = a + ((c - a) * (j + 0.5)) / k;
      fbox(acc, "paint", f, uu - 0.055, uu + 0.055, b0, belly, d - 0.055, d + 0.055);
      fbox(acc, "paint", f, uu - 0.033, uu + 0.033, belly, b1, d - 0.033, d + 0.033);
    }
  }
}

/**
 * Quoins at the corner (cx, cz) of a block whose faces go out along sx (x) and sz (z): ochre blocks
 * wrapped round the corner, long and short in turn, from y0 to y1.
 */
export function quoins(acc, cx, cz, sx, sz, y0, y1, { h = 0.46, gap = 0.07, long = 0.75, short = 0.45, proud = 0.05 } = {}) {
  const n = Math.floor((y1 - y0 + gap) / (h + gap));
  const hh = (y1 - y0 + gap) / n - gap;
  for (let i = 0; i < n; i++) {
    const a = i % 2 ? long : short, c = i % 2 ? short : long, y = y0 + i * (hh + gap);
    acc.box("trim", cx - sx * a, cx + sx * proud, y, y + hh, cz - sz * c, cz + sz * proud);
  }
}

/** A plain corner board (pilaster) wrapped round the corner (cx, cz), w wide on each face. */
export function cornerBoard(acc, cx, cz, sx, sz, y0, y1, w = 0.3, proud = 0.05, m = "trim") {
  acc.box(m, cx - sx * w, cx + sx * proud, y0, y1, cz - sz * w, cz + sz * proud);
}

/** A hipped roof over the rectangle, eaves at `eave`, the ridge at `ridge` along the longer side. */
export function hip(acc, x0, x1, z0, z1, eave, ridge, m = "roofPale") {
  const inside = [(x0 + x1) / 2, eave - 1, (z0 + z1) / 2];
  const a = [x0, eave, z1], c = [x1, eave, z1], d = [x1, eave, z0], e = [x0, eave, z0];
  if (x1 - x0 >= z1 - z0) {
    const half = (z1 - z0) / 2, zm = (z0 + z1) / 2, r0 = [x0 + half, ridge, zm], r1 = [x1 - half, ridge, zm];
    acc.quad(m, a, c, r1, r0, inside); acc.quad(m, d, e, r0, r1, inside);
    acc.tri(m, e, a, r0, inside); acc.tri(m, c, d, r1, inside);
  } else {
    const half = (x1 - x0) / 2, xm = (x0 + x1) / 2, r0 = [xm, ridge, z0 + half], r1 = [xm, ridge, z1 - half];
    acc.quad(m, e, a, r1, r0, inside); acc.quad(m, c, d, r0, r1, inside);
    acc.tri(m, d, e, r0, inside); acc.tri(m, a, c, r1, inside);
  }
}

/**
 * A gabled roof with its ridge along z at x = xm, eaves at x = xm -+ half, from z0 to z1; the gable at
 * z1 (if front) is closed by a tympanum of `tymp` material set back `setback` from the roof's edge.
 */
export function gableZ(acc, xm, half, z0, z1, eave, ridge, { front = true, tymp = "boards", setback = 0.4, rake = true, ridgeFrom = z0 } = {}) {
  const inside = [xm, eave - 1, (z0 + z1) / 2];
  acc.quad("roofPale", [xm - half, eave, z0], [xm - half, eave, z1], [xm, ridge, z1], [xm, ridge, ridgeFrom], inside);
  acc.quad("roofPale", [xm + half, eave, z0], [xm + half, eave, z1], [xm, ridge, z1], [xm, ridge, ridgeFrom], inside);
  if (ridgeFrom > z0) acc.tri("roofPale", [xm - half, eave, z0], [xm + half, eave, z0], [xm, ridge, ridgeFrom], inside); // a hipped back
  if (!front) return;
  const zt = z1 - setback, k = (ridge - eave) / half, ins = [xm, eave + 0.3, zt - 1];
  acc.tri(tymp, [xm - half + setback / 1.5, eave, zt], [xm + half - setback / 1.5, eave, zt], [xm, ridge - setback * k * 0.6, zt], ins);
  if (rake) {
    // raking cornices: two sloped boards under the roof's edge
    for (const s of [-1, 1]) {
      const p0 = [xm + s * half, eave, z1], p1 = [xm, ridge, z1], q0 = [xm + s * half, eave - 0.2, z1], q1 = [xm, ridge - 0.2, z1];
      const b0 = [xm + s * half, eave, zt], b1 = [xm, ridge, zt], c0 = [xm + s * half, eave - 0.2, zt], c1 = [xm, ridge - 0.2, zt];
      const ins2 = [xm + s * half * 0.5, (eave + ridge) / 2 - 0.4, (z1 + zt) / 2];
      acc.quad("trim", q0, q1, p1, p0, ins2);        // its face
      acc.quad("trim", q0, c0, c1, q1, ins2);        // its underside
    }
  }
}

/** A lean-to roof over the rectangle, high (yHi) on one side ("x0", "x1", "z0" or "z1") and low (yLo) on the other. */
export function leanTo(acc, x0, x1, z0, z1, side, yHi, yLo, m = "roofPale") {
  const y = (x, z) => {
    const t = side === "x0" ? (x - x0) / (x1 - x0) : side === "x1" ? (x1 - x) / (x1 - x0) : side === "z0" ? (z - z0) / (z1 - z0) : (z1 - z) / (z1 - z0);
    return yHi + (yLo - yHi) * t;
  };
  const p = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => [x, y(x, z), z]);
  acc.quad(m, p[0], p[1], p[2], p[3], [(x0 + x1) / 2, Math.min(yHi, yLo) - 2, (z0 + z1) / 2]);
}

/** A square bar w thick from point p to point q (its four sides; the ends stay open). */
export function bar(acc, m, p, q, w = 0.05) {
  const d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], len = Math.hypot(...d);
  const n = d.map((v) => v / len), up = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = (v, k) => { const l = Math.hypot(...v); return v.map((x) => (x / l) * k); };
  const s = unit(cross(n, up), w / 2), t = unit(cross(s, n), w / 2);
  const c = (o, i, j) => [o[0] + i * s[0] + j * t[0], o[1] + i * s[1] + j * t[1], o[2] + i * s[2] + j * t[2]];
  const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
  for (const [i0, j0, i1, j1] of [[1, 1, 1, -1], [1, -1, -1, -1], [-1, -1, -1, 1], [-1, 1, 1, 1]])
    acc.quad(m, c(p, i0, j0), c(q, i0, j0), c(q, i1, j1), c(p, i1, j1), mid);
}
