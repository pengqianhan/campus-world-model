// Faces of the General Library drawn by rule: a face is a plane square to x or to z, with an outward
// sign, spanning [a0, a1] along it. Every box on it is given as (along, up, out-of-face) ranges, so the
// same code draws any of the building's faces.
import * as THREE from "three";
import { boxesGeometry } from "../../kit/gothic.js";

/** A face: `axis` is the axis its normal lies on ("x" or "z"), `at` its plane, `s` the outward sign. */
export function face(axis, at, s, a0, a1) { return { axis, at, s, a0, a1 }; }

/** The box [a0, a1] along the face, [y0, y1] up, [d0, d1] out of it (positive = outward). */
export function faceBox(f, a0, a1, y0, y1, d0, d1) {
  const p = f.at + f.s * d0, q = f.at + f.s * d1, lo = Math.min(p, q), hi = Math.max(p, q);
  return f.axis === "z" ? [a0, a1, y0, y1, lo, hi] : [lo, hi, y0, y1, a0, a1];
}

/**
 * A prism on a face: the polygon `pts` ([along, up] pairs) pushed out of the face from d0 to d1.
 */
export function prism(b, f, pts, d0, d1, material) {
  const sa = (f.axis === "z") === (f.s > 0) ? 1 : -1;            // along the face, in the prism's own x
  const shape = new THREE.Shape(pts.map(([a, y]) => new THREE.Vector2(sa * a, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: d1 - d0, bevelEnabled: false });
  g.translate(0, 0, d0);
  const turn = f.axis === "z" ? (f.s > 0 ? 0 : Math.PI) : (f.s > 0 ? Math.PI / 2 : -Math.PI / 2);
  const m = new THREE.Matrix4().makeRotationY(turn).setPosition(f.axis === "x" ? f.at : 0, 0, f.axis === "z" ? f.at : 0);
  g.applyMatrix4(m);
  b.add(g, material);
}

/**
 * Ribbon windows: from y0 to y1, a band of glazing between spandrels at each floor level in `floors`
 * (a spandrel `sp` high at each level, standing 0.12 m proud of the face and reaching `deep` m back
 * into it, to the mass), the glass 0.25 m in, with dark mullions every `bay` metres.
 */
export function ribbons(b, f, y0, y1, floors, { sp = 1.1, bay = 1.6, frame = "iron", glass = "glassPale", wall = "paint", deep = 0.3 } = {}) {
  const lv = [y0, ...floors.filter((y) => y > y0 + 0.5 && y < y1 - 0.5), y1];
  const walls = [], panes = [], bars = [];
  for (let i = 0; i < lv.length - 1; i++) {
    const s0 = lv[i], s1 = Math.min(lv[i] + sp, lv[i + 1]);
    walls.push(faceBox(f, f.a0, f.a1, s0, s1, -deep, 0.12));
    if (lv[i + 1] - s1 < 0.4) continue;
    panes.push(faceBox(f, f.a0, f.a1, s1, lv[i + 1], -0.27, -0.24));
    const n = Math.max(1, Math.round((f.a1 - f.a0) / bay));
    for (let k = 0; k <= n; k++) {
      const a = f.a0 + ((f.a1 - f.a0) * k) / n;
      bars.push(faceBox(f, a - 0.05, a + 0.05, s1, lv[i + 1], -0.25, -0.15));
    }
    bars.push(faceBox(f, f.a0, f.a1, (s1 + lv[i + 1]) / 2 + 0.3, (s1 + lv[i + 1]) / 2 + 0.38, -0.25, -0.17));
  }
  b.add(boxesGeometry(walls), wall);
  if (panes.length) b.add(boxesGeometry(panes), glass);
  if (bars.length) b.add(boxesGeometry(bars), frame);
}

/** A plain glazed band from y0 to y1, set `inset` into the face, with mullions every `bay` metres. */
export function glazing(b, f, y0, y1, { inset = 0.3, bay = 1.8, frame = "iron", glass = "glassPale", a0 = f.a0, a1 = f.a1 } = {}) {
  b.add(boxesGeometry([faceBox(f, a0, a1, y0, y1, -inset - 0.03, -inset)]), glass);
  const n = Math.max(1, Math.round((a1 - a0) / bay)), bars = [];
  for (let k = 0; k <= n; k++) { const a = a0 + ((a1 - a0) * k) / n; bars.push(faceBox(f, a - 0.06, a + 0.06, y0, y1, -inset, -inset + 0.12)); }
  bars.push(faceBox(f, a0, a1, y0, y0 + 0.12, -inset, -inset + 0.12), faceBox(f, a0, a1, y1 - 0.12, y1, -inset, -inset + 0.12));
  b.add(boxesGeometry(bars), frame);
}

/**
 * Piers on a face from y0 to y1, `width` m wide, standing from `d0` to `d1` out of it, where glazing()
 * with the same `bay` puts its mullions: so a glazed band between them reads as bays between piers.
 */
export function piers(b, f, y0, y1, { bay = 1.8, width = 0.9, d0 = -0.6, d1 = 0, a0 = f.a0, a1 = f.a1, material = "grey" } = {}) {
  const n = Math.max(1, Math.round((a1 - a0) / bay)), P = [];
  for (let k = 0; k <= n; k++) {
    const a = a0 + ((a1 - a0) * k) / n, lo = Math.max(a0, a - width / 2), hi = Math.min(a1, a + width / 2);
    P.push(faceBox(f, lo, hi, y0, y1, d0, d1));
  }
  b.add(boxesGeometry(P), material);
}
