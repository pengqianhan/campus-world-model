// Architecture - West (421W; parts/common.js, MEASURED), drawn in its own frame (u along the slab, w across it).
// Round 0: each part a block at the LiDAR's plan and height, walls down to FOOT: the slab to its eave, its roof the
// lowest of its measured planes in convex pieces, the flat roof on the south-west side, the tower out of the roof,
// and the two lower blocks to the north-west. Round 1's faces: on the north-east faces the photograph shows a louvred
// parapet and a band of windows on each floor, the slab's doors' storey glazed. Parts that meet run into each other,
// so that no two faces of different materials lie in one plane.
import { FOOT, MEASURED, plan, rect } from "./common.js";
import { block, prism, slopedPrism } from "./shapes.js";

const M = MEASURED, WALL = "claddingPale", ROOF = "roofGrey", TOWER = "screenGrey", GLASS = "glass", LOUVRE = "plain";

const h = (p, [u, w]) => p.a + p.b * u + p.c * w;

/** The floors' levels from the first at or above `from` to the last below `to`, every M.floors.every. */
function levels(from, to) {
  const F = M.floors, out = [];
  for (let y = F.first + Math.ceil((from - F.first) / F.every - 1e-6) * F.every; y < to; y += F.every) out.push(y);
  return out;
}

/** On each floor from `from` up, below `top`, of the north-east face at w `wf` from u0 to u1: the louvred parapet
 * and over it the band of windows, standing out of the face, the windows' head no higher than 0.1 m under `top`. */
function floorsOn(b, [u0, u1], wf, from, top) {
  const P = M.parapet, W = M.windows;
  for (const y of levels(from, top - P.height)) {
    prism(b, rect([u0, u1], [wf - P.out, wf + 0.01]), y, y + P.height, LOUVRE);
    prism(b, rect([u0, u1], [wf - W.out, wf + 0.01]), y + W.sill, Math.min(y + W.head, top - 0.1), GLASS);
  }
}

/** The part of the convex polygon [[u, w], ...] where f([u, w]) <= 0, f linear (Sutherland-Hodgman). */
function clip(poly, f) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], fp = f(p), fq = f(q);
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
      const t = fp / (fp - fq);
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  }
  return out;
}

const area = (poly) => Math.abs(poly.reduce((s, [u, w], i) => { const [U, W] = poly[(i + 1) % poly.length]; return s + u * W - U * w; }, 0)) / 2;

/** A roof over the convex `region` [[u, w], ...]: the lowest of `planes`, from `floor` up; each plane's piece raised
 * from the floor to it, its sides in `side`. */
function roof(b, region, planes, floor, side = WALL) {
  planes.forEach((p, i) => {
    let piece = clip(region, (x) => floor - h(p, x));
    planes.forEach((q, j) => { if (j !== i) piece = clip(piece, (x) => h(p, x) - h(q, x)); });
    if (piece.length < 3 || area(piece) < 0.01) return;
    slopedPrism(b, plan(piece), floor, (x, z) => h(p, [-x, z]), side, ROOF);
  });
}

export function building(b) {
  const S = M.slab, R = M.roof, T = M.tower, P = S.plan, s = R.split, f = R.flat.from;
  // the slab's walls to its eave
  prism(b, plan(P), FOOT, S.top, WALL);
  // where w meets the plan's side along 421E's model's north-west end (its corners 4 and 5)
  const cut = (w) => P[4][0] + ((w - P[4][1]) / (P[5][1] - P[4][1])) * (P[5][0] - P[4][0]);
  // north-west of the split, one convex region; south-east of it, four, the set-back part's face under its eave in
  // the towers' dark cladding
  roof(b, [[s, -9.6], [14, -9.6], [14, 7.9], [s, 7.9]], [R.ne, ...R.nw], S.top);
  roof(b, [[-2.5, -9.6], [s, -9.6], [s, -7.0], [-2.5, -7.0]], [R.ne, ...R.se], S.top);
  roof(b, [P[3], [s, -7.0], [s, P[4][1]], P[4]], [R.ne, ...R.se], S.top, TOWER);
  roof(b, [P[4], [-1.5, P[4][1]], [-1.5, 10.8], P[5]], [R.ne, ...R.se], S.top);
  roof(b, [[-1.5, P[4][1]], [s, P[4][1]], [s, 7.9], [-1.5, 7.9]], [R.ne, ...R.se], S.top);
  // the flat roof on the south-west side, from under the slope, 4 cm inside its sides along 421E's model and at the
  // split, where the roof's pieces over it have their own sides
  block(b, plan([[s - 0.04, f], [s - 0.04, 7.9], [-1.5, 7.9], [-1.5, 10.8], [P[5][0] + 0.04, P[5][1]], [cut(f) + 0.04, f]]), S.top, R.flat.top, WALL, ROOF);
  // the tower, from inside the roof, 5 cm proud of the roof's halves' meeting
  const top = (x) => T.high + ((-x - T.u[0]) / (T.u[1] - T.u[0])) * (T.low - T.high);
  slopedPrism(b, rect([T.u[0] - 0.05, T.u[1]], [T.w[0], T.w[1] + 0.05]), S.top - 0.3, (x) => top(x), TOWER, TOWER);
  // the lower blocks to the north-west, each from 0.1 m inside the one before it and 5 cm inside the slab's side; the
  // further one in the brown cladding the photograph shows, its foot 5 cm higher than the nearer one's
  block(b, rect([M.low.u[0] - 0.1, M.low.u[1]], [M.low.w[0], M.low.w[1] - 0.05]), FOOT, M.low.top, WALL, ROOF);
  block(b, rect([M.lower.u[0] - 0.1, M.lower.u[1]], M.lower.w), FOOT + 0.05, M.lower.top, TOWER, ROOF);
  // the north-east faces the photograph shows, a floor on each storey above the doors' (below it the set-back part
  // and the nearer lower block are plain, where the site's ground lies lower than the LiDAR's): the slab's, its
  // doors' storey glazed; its set-back part's; the nearer lower block's
  const F = M.floors, Dr = M.doors;
  floorsOn(b, [-2.45, 13.95], P[0][1], F.doors + F.every, S.top);
  prism(b, rect([-2.45, 13.95], [P[0][1] - M.windows.out, P[0][1] + 0.01]), F.doors + Dr.sill, F.doors + Dr.head, GLASS);
  floorsOn(b, [P[3][0] + 0.05, -2.55], P[3][1], F.doors + F.every, S.top);
  floorsOn(b, [M.low.u[0] + 0.05, M.low.u[1] - 0.05], M.low.w[0], F.doors + F.every, M.low.top);
}
