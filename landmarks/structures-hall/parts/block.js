// Structures Hall's blocks: the southern and northern blocks under their roofs of one slope, the lower block against
// the east end, the stacks on the line between the blocks; and `along`, the shape every part is made of. Sizes from
// common.js.
import * as THREE from "three";
import {
  BOX, DIR, FACE, FOOT, GS_EAST, LOW, NORTH, SOUTH, STACK, STACKS, WALL_Q, northRoof, pt, southRoof,
} from "./common.js";

// The walls, the bands and the fascia the pale grey of the photograph's panels; the roofs light grey, as the aerial
// shows them; the glass the light glazing that shows the sky; the mullions, louvres and the ground storey's windows
// near black; the frames at the south face's ends brown.
export const WALL = "claddingPale", ROOFS = "roofPale", GLASS = "glassPale", DARK = "screenBlack", FRAMES = "finBrown";

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

/** The southern block: the ground storey from FOOT to the box's underside, its wall set back to WALL_Q, and over it
 * the glazed box to its roof, its glass at FACE. Their sides along the line between the blocks are drawn only west
 * of the northern block (p 23.05 on): east of that they lie within it. */
export function south(b) {
  const { p0, p1, q0, qWest } = SOUTH;
  // east of the northern block's west end against it (q0), west of it to its own north wall (qWest)
  const parts = (q) => [
    [GS_EAST, [[q, FOOT], [WALL_Q, FOOT], [WALL_Q, BOX], [q, BOX]], [null, WALL, null]],
    [p0, [[q, BOX], [FACE, BOX], [FACE, southRoof(FACE)], [q, southRoof(q)]], [WALL, GLASS, ROOFS]],
  ];
  for (const [from, section, [m0, m1, m2]] of parts(q0)) along(b, from, NORTH.p1, section, [m0, m1, m2, null], WALL, [true, false]);
  for (const [, section, [m0, m1, m2]] of parts(qWest)) along(b, NORTH.p1, p1, section, [m0, m1, m2, WALL], WALL, [false, true]);
}

/** The northern block, from FOOT to its roof; its south side, over the southern block's roof, is the face that looks
 * south over it. */
export function north(b) {
  const { p0, p1, q0, q1 } = NORTH;
  along(b, p0, p1, [[q0, FOOT], [q1, FOOT], [q1, northRoof(q1)], [q0, northRoof(q0)]], [WALL, WALL, ROOFS, WALL], WALL);
}

/** The lower block against the northern one's east end (its west end within that block, not drawn). */
export function low(b) {
  const { p0, p1, q0, q1, top } = LOW;
  along(b, p0, p1, [[q0, FOOT], [q1, FOOT], [q1, top], [q0, top]], [WALL, WALL, ROOFS, WALL], WALL, [true, false]);
}

/** The three stacks, each standing from within the southern block's roof: a light base, dark louvres, and a light
 * band to its sloping top. */
export function stacks(b) {
  const { q0, q1 } = STACK, base = southRoof(q1) - 0.2;
  for (const [p0, p1] of STACKS) {
    along(b, p0, p1, [[q0, base], [q1, base], [q1, STACK.louvre], [q0, STACK.louvre]], [null, WALL, null, WALL], WALL);
    along(b, p0, p1, [[q0, STACK.louvre], [q1, STACK.louvre], [q1, STACK.band], [q0, STACK.band]],
      [null, DARK, null, DARK], DARK);
    along(b, p0, p1, [[q0, STACK.band], [q1, STACK.band], [q1, STACK.south], [q0, STACK.north]],
      [null, WALL, ROOFS, WALL], WALL);
  }
}
