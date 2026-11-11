// Security's parts: the ground storey set back under the band of the upper storey, the band to the roof with the
// parapet round it, the columns, the deck before the south corner with its railing and steps, and the two blocks on
// the roof. Sizes from common.js. No two faces of different materials lie in one plane (the landmark tests' faces
// check): what meets another part ends inside it.
import * as THREE from "three";
import { COLUMNS, COURT, DECK, FLOOR, FOOT, HIGH, OUTLINE, PARAPET, ROOF, SOFFIT, STOREY, at, plan } from "./common.js";
import { block, inset, prism } from "./shapes.js";

// The concrete pale grey, as the photograph shows it; the glazing dark, its frames and the railing near black; the
// deck and the screen under it dark grey; the roofs mid-grey.
const CONCRETE = "claddingPale", ROOFS = "roofGrey", GLASS = "glass", FRAME = "screenBlack", DARK = "screenGrey";

/** A closed plan's line moved `d` inward. */
function inward(ring, d) {
  let a = 0;
  ring.forEach(([x, z], i) => { const [x1, z1] = ring[(i + 1) % ring.length]; a += x * z1 - x1 * z; });
  return inset([ring[ring.length - 1], ...ring, ring[0]], a > 0 ? d : -d).slice(1, -1);
}

/** The plan between an outer and an inner line raised from y0 to y1 (a parapet): as prism, with the inner line as a
 * hole. */
function ring(b, outer, inner, y0, y1, material) {
  const s = new THREE.Shape(outer.map(([x, z]) => new THREE.Vector2(x, -z)));
  s.holes.push(new THREE.Path(inner.map(([x, z]) => new THREE.Vector2(x, -z))));
  const g = new THREE.ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  b.add(g, material);
}

/** A bar in the building's frame, `w` wide across the line from (p0, q0) to (p1, q1) and raised from y0 to y1. */
function bar(b, [p0, q0], [p1, q1], w, y0, y1, material) {
  const l = Math.hypot(p1 - p0, q1 - q0), n = [(-(q1 - q0) / l) * (w / 2), ((p1 - p0) / l) * (w / 2)];
  prism(b, plan([[p0 + n[0], q0 + n[1]], [p1 + n[0], q1 + n[1]], [p1 - n[0], q1 - n[1]], [p0 - n[0], q0 - n[1]]]), y0, y1, material);
}

/** The ground storey: its glazing from the floor to the soffit (its top within the band), with frames 1.6 m apart
 * just outside it, over a dark base 5 cm inside it down to the walls' foot. */
export function storey(b) {
  const glass = plan(STOREY);
  prism(b, inward(glass, 0.05), FOOT, FLOOR + 0.1, DARK);
  prism(b, glass, FLOOR, SOFFIT + 0.1, GLASS);
  const out = inward(glass, -0.04);
  out.forEach((p, i) => {
    const q = out[(i + 1) % out.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.round(l / 1.6));
    for (let k = 0; k < n; k++) {
      const t = k / n, x = p[0] + t * (q[0] - p[0]), z = p[1] + t * (q[1] - p[1]);
      prism(b, [[x - 0.04, z - 0.04], [x + 0.04, z - 0.04], [x + 0.04, z + 0.04], [x - 0.04, z + 0.04]], FLOOR - 0.05, SOFFIT + 0.05, FRAME);
    }
  });
}

/** The upper storey's band from its underside (the soffit) to the parapet's top, the parapet round the roof, and the
 * roof within it, its edge 1 cm behind the parapet's inner face (so that no roof's edge shows on the faces); at the
 * chamfer's two ends a dark joint, as the photograph shows. */
export function band(b) {
  const outer = plan(OUTLINE);
  prism(b, outer, SOFFIT, ROOF - 0.15, CONCRETE);
  ring(b, outer, inward(outer, PARAPET.thick), ROOF - 0.2, PARAPET.top, CONCRETE);
  prism(b, inward(outer, PARAPET.thick + 0.01), ROOF - 0.1, ROOF + 0.01, ROOFS);
  for (const [p, q] of [OUTLINE[OUTLINE.length - 1], OUTLINE[0]]) {
    const [x, z] = at(p, q);
    prism(b, [[x - 0.09, z - 0.09], [x + 0.09, z - 0.09], [x + 0.09, z + 0.09], [x - 0.09, z + 0.09]], SOFFIT - 0.02, PARAPET.top - 0.04, FRAME);
  }
}

/** The columns under the band's edge, from the walls' foot into the band. */
export function columns(b) {
  for (const [p, q] of COLUMNS) bar(b, [p - 0.225, q], [p + 0.225, q], 0.45, FOOT, SOFFIT + 0.3, CONCRETE);
}

/** The deck at the floor's height, solid and dark down to the walls' foot; its railing of thin bars 1 m tall along
 * its edge; and the flight of steps from the court up to its west corner, the last one under the deck's edge. */
export function deck(b) {
  prism(b, plan(DECK.plan), FOOT, FLOOR, DARK);
  for (let i = 0; i + 1 < DECK.rail.length; i++) {
    const [p0, q0] = DECK.rail[i], [p1, q1] = DECK.rail[i + 1], l = Math.hypot(p1 - p0, q1 - q0), n = Math.round(l / 0.15);
    const off = (t) => [p0 + t * (p1 - p0), q0 + t * (q1 - q0)];
    bar(b, off(0), off(1), 0.05, FLOOR + 0.95, FLOOR + 1.0, FRAME);
    bar(b, off(0), off(1), 0.05, FLOOR + 0.08, FLOOR + 0.12, FRAME);
    for (let k = 0; k <= n; k++) { const [p, q] = off(k / n); bar(b, [p - 0.015, q], [p + 0.015, q], 0.03, FLOOR - 0.05, FLOOR + 0.97, FRAME); }
  }
  const { foot: [fp, fq], dir: [dp, dq], width, run, steps } = DECK.stair, rise = (FLOOR - COURT) / steps, g = run / steps;
  const [ep, eq] = [dq * (width / 2), -dp * (width / 2)], pt = (s, e) => [fp + s * dp + e * ep, fq + s * dq + e * eq];
  for (let i = 1; i < steps; i++) {
    prism(b, plan([pt((i - 1) * g, -1), pt((i - 1) * g, 1), pt(i * g, 1), pt(i * g, -1)]), FOOT, COURT + i * rise, CONCRETE);
  }
}

/** The box at the west corner and the block toward the east end, standing on the roof. */
export function high(b) {
  for (const h of HIGH) block(b, plan(h.plan), ROOF - 0.1, h.top, CONCRETE, ROOFS);
}
