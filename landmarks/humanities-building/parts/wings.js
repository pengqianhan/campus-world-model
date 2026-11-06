// The two wings (parts/common.js, MEASURED): the aisles round their outer faces, the street wing's and the
// north-east wing's middles, the raised corner where they meet and the fill in the angle of the L. Round 0: the
// roofs' slopes, steps and hips at the LiDAR's heights, eaves with a fascia and a soffit, plain walls. Round 1: the
// walls in buff brick (estimated where the photograph does not show them), and on the street wing's south-west face
// the walls at the windows' glazing, set back behind its bands (parts/facade.js).
import { FOOT, MEASURED } from "./common.js";
import { block, envelope, hipRoof, inset, loft, prism, tris } from "./shapes.js";

const M = MEASURED;
const WALL = "brickBuff", ROOF = "roofTile", FLAT = "roofGrey";

/** Upright quads between points [x, z] of a line, from y0 (a height, or one per point) to each point's top, each
 * facing away from the line's left (the line runs round the building with it on its left). */
function curtain(b, line, tops, y0, material) {
  const foot = (i) => (Array.isArray(y0) ? y0[i] : y0);
  for (let i = 0; i + 1 < line.length; i++) {
    const [p, q] = [line[i], line[i + 1]], l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (l < 1e-6) continue;
    const out = [(q[1] - p[1]) / l, -(q[0] - p[0]) / l];
    const a = [p[0], foot(i), p[1]], c = [q[0], foot(i + 1), q[1]], ct = [q[0], tops[i + 1], q[1]], at = [p[0], tops[i], p[1]];
    tris(b, [[a, c, ct], [a, ct, at]], material, (m) => [m[0] + out[0] * 10, m[1] + out[1] * 10]);
  }
}

/** The fascia under a line of eave points [x, y, z] (`depth` deep, facing out from `wall`, the line of plan points
 * under it) and the soffit from its foot back to the wall, at the wall's top. */
function eaveEdge(b, eave, wall, wallTop, depth, material) {
  const dn = eave.map(([x, y, z]) => [x, y - depth, z]);
  for (let i = 0; i + 1 < eave.length; i++) {
    const out = [(eave[i][0] + eave[i + 1][0] - wall[i][0] - wall[i + 1][0]) / 2, (eave[i][2] + eave[i + 1][2] - wall[i][1] - wall[i + 1][1]) / 2];
    tris(b, [[eave[i], eave[i + 1], dn[i + 1]], [eave[i], dn[i + 1], dn[i]]], material, (m) => [m[0] + out[0] * 10, m[1] + out[1] * 10]);
  }
  const w = wall.map(([x, z], i) => [x, wallTop[i], z]), list = [];
  for (let i = 0; i + 1 < eave.length; i++) list.push([dn[i], dn[i + 1], w[i + 1]], [dn[i], w[i + 1], w[i]]);
  tris(b, list, material, "down");
}

/** The aisles: their roofs from the eaves to the step, the fascia and soffit, and the outer walls under them. The
 * walls' line runs on at both ends into the middles' blocks, so that no slit is left where they meet; the roofs'
 * two ends, which rise above the walls' tops to the step, are closed under their edges. */
export function aisles(b) {
  const E = M.eave, wall = inset(E.map(([x, , z]) => [x, z]), M.overhang), tops = E.map(([, y]) => y - M.fascia + 0.05);
  // the south-west face's two parts (the eave's points 3 to 6): the wall at the glazing, the bands before it
  for (const i of [3, 4, 5, 6]) wall[i][1] -= M.faces.recess;
  loft(b, E, M.aisleTop, ROOF);
  eaveEdge(b, E, wall, tops, M.fascia, ROOF);
  curtain(b, [[19.4, 3.1], ...wall, [-3.9, -24.0]], [tops[0], ...tops, tops[tops.length - 1]], FOOT, WALL);
  // each end (review, round 1: from the angle of the L, a hole up to 0.5 m2 under each): a wall under the edge
  // from the eave's point to its top at the step, down to the fascia's foot, facing away from the aisle; and the
  // soffit's end under it, back to the wall, and the soffit's last length, drawn both ways (the wall runs just
  // outside the edge at the north-east wing's end, so that a sliver of the soffit stands out past the roof there)
  for (const [i, j] of [[0, 1], [E.length - 1, E.length - 2]]) {
    const [e, t, f] = [E[i], M.aisleTop[i], E[j]], y = e[1] - M.fascia, away = [2 * e[0] - f[0], 2 * e[2] - f[2]];
    tris(b, [[[e[0], y, e[2]], [t[0], y, t[2]], t], [[e[0], y, e[2]], t, e]], WALL, () => away);
    const [ei, ej] = [[e[0], y, e[2]], [f[0], f[1] - M.fascia, f[2]]], [wi, wj] = [i, j].map((k) => [wall[k][0], tops[k], wall[k][1]]);
    const end = [ei, wi, [t[0], y, t[2]]];
    tris(b, [end], ROOF, "down");
    tris(b, [end, [ei, ej, wj], [ei, wj, wi]], ROOF, "up");
  }
}

/** A middle: its walls up to its eaves, its roof, and its eaves' fascia and soffit round the roof's rectangle. */
function middle(b, P, along) {
  const { x: [x0, x1], z: [z0, z1] } = P;
  prism(b, P.plan, FOOT, P.eave, WALL);
  hipRoof(b, P.x, P.z, P.eave, P.ridge, along, P.at, P.hip, ROOF);
  const rect = [[x0, P.eave, z0], [x1, P.eave, z0], [x1, P.eave, z1], [x0, P.eave, z1], [x0, P.eave, z0]];
  eaveEdge(b, rect, [...P.plan, P.plan[0]], Array(5).fill(P.eave - M.fascia + 0.05), M.fascia, ROOF);
}

export const street = (b) => middle(b, M.street, "x");
export const northeast = (b) => middle(b, M.northeast, "z");

/** The raised corner: the block under it at the aisles' tops, its roof of eight slopes and a flat top, its walls
 * and fascia at the roof's edge; the roof in the angle of the L beside it; and the fill there, flat. The two flat
 * roofs in the angle of the L are grey, not tiled (the 2023 aerial: light grey, its median 157-163/156-160/165-169,
 * where the tiled roofs round them are pink; review, round 1). */
export function corner(b) {
  const C = M.corner, F = M.fill, n = C.plan.length;
  block(b, C.base.plan, FOOT, C.base.top, WALL, ROOF);
  block(b, C.inner.plan, C.inner.foot, C.inner.top, WALL, FLAT);
  // each side's plane: its eave on the side, rising `slope` a metre inward
  const planes = [[C.top, 0, 0]];
  for (const [i, e] of Object.entries(C.eaves)) {
    const [p, q] = [C.plan[+i], C.plan[(+i + 1) % n]], l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const u = (-(q[1] - p[1]) / l) * C.slope, v = ((q[0] - p[0]) / l) * C.slope;
    planes.push([e - u * p[0] - v * p[1], u, v]);
  }
  for (const side of envelope(b, C.plan, planes, ROOF)) {
    const line = side.map(([x, , z]) => [x, z]), tops = side.map(([, y]) => y), under = tops.map((y) => y - M.fascia);
    curtain(b, line, under, C.foot, WALL);
    curtain(b, line, tops, under, ROOF);
  }
  prism(b, F.plan, FOOT, F.top - 0.25, WALL);
  prism(b, F.roof, F.top - 0.3, F.top, FLAT);
}
