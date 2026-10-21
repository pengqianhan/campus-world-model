// Parts for the tower, drawn by rule: a collector that builds a piece once and stamps it in several
// places, the stacked "cross" pinnacles of the tower, flared gables, feather (fern) tracery, clocks.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { outline } from "../gothic.js";

/** Strips a geometry to positions only, non-indexed, so that anything can be merged with anything. */
function bare(g) {
  const n = g.index ? g.toNonIndexed() : g;
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", n.attributes.position);
  return out;
}

/**
 * Collects geometry in local coordinates (same calls as the Builder), merges it per material once, and
 * stamps it into the Builder under any number of matrices.
 */
export class Part {
  constructor() { this.lists = {}; this.merged = null; }
  add(g, material) { (this.lists[material] ??= []).push(bare(g)); }
  box(x0, x1, y0, y1, z0, z1, material) {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    this.add(g, material);
  }
  slab(shape, x, y, front, depth, material, curveSegments = 8) {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments });
    g.translate(x, y, front - depth);
    this.add(g, material);
  }
  /** A box of size (sx, sy, sz) turned by angle a about z, centred at (x, y, z). */
  bar(x, y, z, sx, sy, sz, a, material) {
    const g = new THREE.BoxGeometry(sx, sy, sz); g.rotateZ(a); g.translate(x, y, z); this.add(g, material);
  }
  stamp(b, matrix) {
    this.merged ??= Object.fromEntries(Object.entries(this.lists).map(([m, l]) => [m, mergeGeometries(l)]));
    const keep = b.matrix; b.matrix = matrix;
    for (const [m, g] of Object.entries(this.merged)) b.add(g.clone(), m);
    b.matrix = keep;
  }
  /** Adds everything straight into another Part (or Builder) through a matrix. */
  into(p, matrix) {
    for (const [m, l] of Object.entries(this.lists)) for (const g of l) { const c = g.clone(); c.applyMatrix4(matrix); p.add(c, m); }
  }
}

/** The matrix that puts local (x along the face, y up, z out of the face) at (x, z) with outward normal (nx, nz). */
export function faceMatrix(x, z, nx, nz) {
  const n = new THREE.Vector3(nx, 0, nz).normalize(), t = new THREE.Vector3(n.z, 0, -n.x);
  return new THREE.Matrix4().makeBasis(t, new THREE.Vector3(0, 1, 0), n).setPosition(x, 0, z);
}

/**
 * The tower's pinnacle: a square shaft on a plinth, a tapering needle set with tiers of square crockets
 * that stand out on all four sides (a stack of little crosses against the sky), and a knob on top.
 * Built at the origin from y = 0 to h; w is the shaft's width.
 */
export function crossPinnacle(w, h, tiers = 4, arm = 0.42, material = "dressed") {
  const p = new Part();
  const shaft = h * 0.3;
  p.box(-w * 0.62, w * 0.62, 0, w * 0.3, -w * 0.62, w * 0.62, material);
  p.box(-w / 2, w / 2, w * 0.3, shaft, -w / 2, w / 2, material);
  p.box(-w * 0.6, w * 0.6, shaft, shaft + w * 0.22, -w * 0.6, w * 0.6, material);
  const top = h - w * 0.55;
  const needle = new THREE.CylinderGeometry(w * 0.22, w * 0.42, top - shaft, 4, 1);
  needle.rotateY(Math.PI / 4); needle.translate(0, (shaft + top) / 2, 0); p.add(needle, material);
  for (let i = 0; i < tiers; i++) {
    const t = (i + 0.6) / tiers, y = shaft + (top - shaft) * t * 0.92;
    const half = w * (0.42 - 0.2 * t) + w * arm, th = w * 0.26 * (1 - 0.3 * t), d = w * 0.36 * (1 - 0.3 * t);
    p.box(-half, half, y - th / 2, y + th / 2, -d / 2, d / 2, material);
    p.box(-d / 2, d / 2, y - th / 2, y + th / 2, -half, half, material);
  }
  const knob = new THREE.OctahedronGeometry(w * 0.3, 0); knob.translate(0, top + w * 0.25, 0); p.add(knob, material);
  const cap = new THREE.BoxGeometry(w * 0.5, w * 0.12, w * 0.5); cap.translate(0, top, 0); p.add(cap, material);
  return p;
}

/** Flared gable outline w wide, rising h from y = 0: concave sides to a sharp apex. */
export function gablePts(w, h, n = 10, y0 = 0) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = 1 - i / n; pts.push(new THREE.Vector2(-t * w / 2, y0 + h * Math.pow(1 - t, 1.6))); }
  for (let i = n - 1; i >= 0; i--) { const t = 1 - i / n; pts.push(new THREE.Vector2(t * w / 2, y0 + h * Math.pow(1 - t, 1.6))); }
  return pts;
}

/** A coping band along a flared gable: thickness s measured vertically. */
export function gableCoping(p, w, h, s, y, front, depth, material = "dressed") {
  const outer = gablePts(w + s * 0.8, h + s, 10, -s * 0.15), inner = gablePts(w, h, 10, -s * 0.15).reverse();
  p.slab(new THREE.Shape([...outer, ...inner.slice(1, -1)]), 0, y, front, depth, material);
}

/**
 * Feather tracery: a central stem with pairs of blades running outward (rising if rise > 0, drooping if
 * rise < 0, like the fronds of a fern), filling a band w wide from
 * y0 to y1, set at z = front with relief d. Stands for the stylised fern panels of the tower.
 */
export function fern(p, x, y0, y1, w, front, d, material = "dressed", rise = 0.55, pitch = 0.3, blade = 0.07) {
  const stem = Math.max(0.05, w * 0.07);
  p.box(x - stem / 2, x + stem / 2, y0, y1, front - d, front, material);
  const half = w / 2 - 0.02, len = Math.hypot(half, half * rise), a = Math.atan2(half * rise, half);
  for (let y = y0 + 0.08 + Math.max(0, -half * rise); y + Math.max(0, half * rise) < y1 + 0.05; y += pitch) {
    for (const s of [-1, 1]) p.bar(x + (s * half) / 2, y + (half * rise) / 2, front - d / 2, len, blade, d, s * a, material);
  }
}

/** A pointed band (moulding) between two outlines, its sill at y. */
export function pointedBand(p, x, y, w, h, k, s, front, depth, material = "dressed") {
  const sh = new THREE.Shape(outline(w + 2 * s, h + s, "pointed", k));
  sh.holes.push(new THREE.Path(outline(w, h, "pointed", k)));
  p.slab(sh, x, y, front, depth, material);
}

/** A clock: white dial, iron chapter ring, ticks and hands, a moulded stone ring. Faces +z at z = front. */
export function clock(p, cy, r, front, handA = 2.0, handB = 5.2) {
  const dial = new THREE.CircleGeometry(r, 40); dial.translate(0, cy, front + 0.04); p.add(dial, "dial");
  const ring = new THREE.TorusGeometry(r * 0.97, r * 0.035, 4, 40); ring.translate(0, cy, front + 0.05); p.add(ring, "iron");
  const inner = new THREE.TorusGeometry(r * 0.72, r * 0.012, 3, 40); inner.translate(0, cy, front + 0.05); p.add(inner, "iron");
  const surr = new THREE.TorusGeometry(r + 0.07, 0.09, 5, 40); surr.translate(0, cy, front + 0.04); p.add(surr, "dressed");
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, t = new THREE.BoxGeometry(r * 0.05, r * 0.16, 0.02);
    t.rotateZ(-a); t.translate(Math.sin(a) * r * 0.84, cy + Math.cos(a) * r * 0.84, front + 0.055); p.add(t, "iron");
  }
  for (const [len, wid, a] of [[0.55 * r, 0.07 * r, handA], [0.82 * r, 0.045 * r, handB]]) {
    const h = new THREE.BoxGeometry(wid, len, 0.02); h.translate(0, len / 2 - 0.1 * r, 0); h.rotateZ(-a); h.translate(0, cy, front + 0.07); p.add(h, "iron");
  }
}

/** A rosette ("snowflake") of n arms within a ring of radius r, on a dark ground. */
export function rosette(p, cy, r, front, n = 6, pierced = true) {
  if (pierced) { const disc = new THREE.CircleGeometry(r, 24); disc.translate(0, cy, front - 0.12); p.add(disc, "iron"); }
  else front += 0.12;
  const ring = new THREE.TorusGeometry(r, 0.07, 4, 24); ring.translate(0, cy, front - 0.02); p.add(ring, "dressed");
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI / 2;
    p.bar(Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, front - 0.06, r, 0.07, 0.12, a, "dressed");
    for (const s of [-1, 1]) {
      const b = a + s * 0.7, cx = Math.cos(a) * r * 0.62 + Math.cos(b) * r * 0.12, cz = Math.sin(a) * r * 0.62 + Math.sin(b) * r * 0.12;
      p.bar(cx, cy + cz, front - 0.06, r * 0.28, 0.05, 0.1, b, "dressed");
    }
  }
}
