// Building 903's parts: the clad box under its roof of two slopes, the parapets round the south face and the east
// end's gable, and the cap along the ridge; and `along`, the shape every part is made of. Sizes from common.js.
import * as THREE from "three";
import {
  CAP, DIR, EAST, FOOT, FORWARD, GABLE, HIGH, LEAN, NORTH, PARAPET, RIDGE, SET, SOFFIT, SOUTH, STEP, WEST, pt, roofAt,
} from "./common.js";

// The walls the pale grey of the photograph's corrugated cladding; the roofs light grey, as the aerial shows them.
export const WALL = "claddingPale", ROOFS = "roofPale", GLASS = "glass";

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** A closed solid: the convex profile [[q, y], ...] carried along p from p0 to p1. mats[i] is the material of the
 * side from point i to point i + 1 (null: not drawn), `cap` that of the two ends (or [at p0, at p1]), `caps` which
 * ends are drawn. Every triangle faces out. */
export function along(b, p0, p1, profile, mats, cap, caps = [true, true]) {
  const n = profile.length, byMat = new Map();
  let area = 0;
  profile.forEach(([q, y], i) => { const [q1, y1] = profile[(i + 1) % n]; area += q * y1 - q1 * y; });
  const put = (m, [a, c, d], out) => {
    const tri = dot(cross(sub(c, a), sub(d, a)), out) >= 0 ? [a, c, d] : [a, d, c];
    if (!byMat.has(m)) byMat.set(m, []);
    byMat.get(m).push(tri);
  };
  profile.forEach(([q0, y0], i) => {
    const m = mats[i];
    if (!m) return;
    const [q1, y1] = profile[(i + 1) % n];
    const s = area > 0 ? 1 : -1, nq = s * (y1 - y0), ny = -s * (q1 - q0);
    const out = [nq * DIR.q[0], ny, nq * DIR.q[2]];
    const A = pt(p0, q0, y0), B = pt(p1, q0, y0), C = pt(p1, q1, y1), D = pt(p0, q1, y1);
    put(m, [A, B, C], out); put(m, [A, C, D], out);
  });
  [[p0, DIR.p.map((v) => -v)], [p1, DIR.p]].forEach(([p, out], k) => {
    if (!caps[k]) return;
    const ring = profile.map(([q, y]) => pt(p, q, y)), m = Array.isArray(cap) ? cap[k] : cap;
    for (let i = 1; i < n - 1; i++) put(m, [ring[0], ring[i], ring[i + 1]], out);
  });
  for (const [m, list] of byMat) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(list.flat(2), 3));
    b.add(g, m);
  }
}

/** The clad box's section under its roof, from its underside to the south face at `q` and the north face. */
const section = (q) => [[NORTH, SOFFIT], [q, SOFFIT], [q, roofAt(q)], [RIDGE.q, RIDGE.y], [NORTH, roofAt(NORTH)]];
const SIDES = [WALL, WALL, ROOFS, ROOFS, WALL];

/** The clad box: its east part to the south face, its west part stepped forward to the forward face, and the step's
 * return between them; its underside drawn, where it overhangs the glazed storeys. */
export function body(b) {
  along(b, EAST, STEP, section(SOUTH), SIDES, WALL, [true, false]);
  along(b, STEP, WEST, section(FORWARD), SIDES, WALL, [false, true]);
  along(b, STEP, STEP + 0.01, [[SOUTH, SOFFIT], [FORWARD, SOFFIT], [FORWARD, roofAt(FORWARD)],
    [SOUTH, roofAt(SOUTH)]], [null, null, null, null], WALL, [true, false]);
}

/** The parapets: the east end's gable within its parapet, along the south face, round the step's return and along
 * the forward face, each 0.3 m thick and standing from within the roof to its top. */
export function parapet(b) {
  const t = PARAPET.thick, top = PARAPET.top;
  along(b, EAST, EAST + t, [[NORTH, roofAt(NORTH) - 0.3], [SOUTH, roofAt(SOUTH) - 0.3], [SOUTH, GABLE.south],
    [RIDGE.q, GABLE.ridge], [NORTH, GABLE.north]], [null, WALL, WALL, WALL, WALL], WALL);
  const strip = (p0, p1, q0, q1) => along(b, p0, p1, [[q0, roofAt(q1) - 0.3], [q1, roofAt(q1) - 0.3], [q1, top],
    [q0, top]], [null, WALL, WALL, WALL], WALL);
  strip(EAST + t, STEP + t, SOUTH - t, SOUTH);
  strip(STEP, STEP + t, SOUTH, FORWARD - t);
  strip(STEP, WEST, FORWARD - t, FORWARD);
}

/** The cap along the ridge, from within the east end's parapet to the west end (its ends within the parapet and
 * 1 cm short of the end wall, out of their planes). */
export function cap(b) {
  along(b, EAST + PARAPET.thick - 0.05, WEST - 0.01, [[CAP.q0, roofAt(CAP.q0) - 0.1], [CAP.q1, roofAt(CAP.q1) - 0.1],
    [CAP.q1, CAP.top], [CAP.q0, CAP.top]], [null, ROOFS, ROOFS, ROOFS], ROOFS);
}

/** The plant, the duct, the unit and the fan on the roof, each standing from within the roof under it. */
export function lean(b) {
  const q0 = SOUTH - SET, roof = (q) => LEAN.y - LEAN.fall * (q - LEAN.at), d = LEAN.deep;
  along(b, LEAN.p[0], LEAN.p[1], [[q0, roof(q0) - d], [LEAN.q, roof(LEAN.q) - d], [LEAN.q, roof(LEAN.q)], [q0, roof(q0)]],
    [WALL, WALL, ROOFS, null], WALL);
}

export function high(b) {
  for (const { p: [p0, p1], q: [q0, q1], top } of HIGH) {
    const base = Math.min(roofAt(q0), roofAt(q1)) - 0.1;
    along(b, p0, p1, [[q0, base], [q1, base], [q1, top], [q0, top]], [null, WALL, WALL, WALL], WALL);
  }
}
