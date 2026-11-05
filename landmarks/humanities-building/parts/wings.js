// The two wings (parts/common.js, MEASURED): the aisles round their outer faces, the street wing's and the
// north-east wing's middles, the raised corner where they meet and the fill in the angle of the L. Round 0: the
// roofs' slopes, steps and hips at the LiDAR's heights, eaves with a fascia and a soffit, plain walls. Round 1: the
// walls in buff brick (estimated where the photograph does not show them), and on the street wing's south-west face
// the walls at the windows' glazing, set back behind its bands (parts/facade.js).
import { FOOT, MEASURED } from "./common.js";
import { hipRoof, inset, loft, prism, pyramid, tris } from "./shapes.js";

const M = MEASURED;
const WALL = "brickBuff", ROOF = "roofTile";

/** Upright quads between points [x, z] of a line, from y0 to each point's top, each facing away from the line's
 * left (the line runs round the building with it on its left). */
function curtain(b, line, tops, y0, material) {
  for (let i = 0; i + 1 < line.length; i++) {
    const [p, q] = [line[i], line[i + 1]], l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (l < 1e-6) continue;
    const out = [(q[1] - p[1]) / l, -(q[0] - p[0]) / l];
    const a = [p[0], y0, p[1]], c = [q[0], y0, q[1]], ct = [q[0], tops[i + 1], q[1]], at = [p[0], tops[i], p[1]];
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
 * walls' line runs on at both ends into the middles' blocks, so that no slit is left where they meet. */
export function aisles(b) {
  const E = M.eave, wall = inset(E.map(([x, , z]) => [x, z]), M.overhang), tops = E.map(([, y]) => y - M.fascia + 0.05);
  // the south-west face's two parts (the eave's points 3 to 6): the wall at the glazing, the bands before it
  for (const i of [3, 4, 5, 6]) wall[i][1] -= M.faces.recess;
  loft(b, E, M.aisleTop, ROOF);
  eaveEdge(b, E, wall, tops, M.fascia, ROOF);
  curtain(b, [[19.4, 3.1], ...wall, [-3.9, -24.0]], [tops[0], ...tops, tops[tops.length - 1]], FOOT, WALL);
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

/** The raised corner: its walls, its pyramid and its eaves; and the fill in the angle of the L, flat. */
export function corner(b) {
  const C = M.corner, { x: [x0, x1], z: [z0, z1] } = C.roof, F = M.fill;
  prism(b, C.plan, FOOT, C.eave, WALL);
  pyramid(b, C.roof.x, C.roof.z, C.eave, C.apex, ROOF);
  const rect = [[x0, C.eave, z0], [x1, C.eave, z0], [x1, C.eave, z1], [x0, C.eave, z1], [x0, C.eave, z0]];
  eaveEdge(b, rect, [...C.plan, C.plan[0]], Array(5).fill(C.eave - M.fascia + 0.05), M.fascia, ROOF);
  prism(b, F.plan, FOOT, F.top - 0.25, WALL);
  prism(b, F.roof, F.top - 0.3, F.top, ROOF);
}
