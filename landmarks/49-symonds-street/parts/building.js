// 49 Symonds Street (620; parts/common.js, MEASURED), drawn in its own frame (u west-south-west, w to the street).
// Round 0: each part a block at the LiDAR's plan and height: the tower with its roof inside a parapet, the mansard on
// it, the plant east of the mansard and the gable in the middle of each face; the podium to its east with the gable
// over its entrance and the canopy along its front; the lower buildings behind the podium. Round 1's faces: the tower's walls in glass between a base
// of dark stone and a white band, white on its bays and its north-east face, with an arched window under each white
// face's gable and a window either side of it in each storey, and one in each storey of the bays' sides; the podium and
// the lower buildings in the dark stone; the mansard's top pale.
// Walls down to FOOT. Parts that meet run into each other, so that no two faces of different materials lie in one
// plane.
import { FOOT, MEASURED, at, inset, plan, rect } from "./common.js";
import { block, hexahedron, prism, tris } from "./shapes.js";

const M = MEASURED, F = M.faces;
const WALL = "claddingPale", ROOF = "roofGrey", GLASS = "glass", STONE = "screenBlack", TOP = "roofPale";

/** A gable: a triangle `half` either side of `c` along a face, from y0 up to `apex`, between `d0` and `d1` across it;
 * the face along u (at w = d) when `side` is "w", along w (at u = d) when "u". */
function gable(b, side, c, d0, d1, y0, apex, half, material) {
  const p = (s, d, y) => {
    const [x, z] = side === "w" ? at(s, d) : at(d, s);
    return [x, y, z];
  };
  hexahedron(b, [p(c - half, d0, y0), p(c + half, d0, y0), p(c, d0, apex), p(c, d0, apex),
    p(c - half, d1, y0), p(c + half, d1, y0), p(c, d1, apex), p(c, d1, apex)], material);
}

/** The walls of a plan of [u, w] corners from y0 to y1, without ends, each side in `mats[i]`: a material, or a list of
 * [t, material], each from the fraction t of the side on. */
function walls(b, corners, y0, y1, mats) {
  const P = plan(corners), n = P.length;
  let area = 0;
  for (let i = 0; i < n; i++) area += P[i][0] * P[(i + 1) % n][1] - P[(i + 1) % n][0] * P[i][1];
  const s = Math.sign(area);
  for (let i = 0; i < n; i++) {
    const p = P[i], q = P[(i + 1) % n], dx = q[0] - p[0], dz = q[1] - p[1], out = [s * dz, -s * dx];
    const runs = typeof mats[i] === "string" ? [[0, mats[i]]] : mats[i];
    runs.forEach(([t0, m], k) => {
      const t1 = k + 1 < runs.length ? runs[k + 1][0] : 1;
      const a = [p[0] + t0 * dx, p[1] + t0 * dz], c = [p[0] + t1 * dx, p[1] + t1 * dz];
      tris(b, [[[a[0], y0, a[1]], [c[0], y0, c[1]], [c[0], y1, c[1]]], [[a[0], y0, a[1]], [c[0], y1, c[1]], [a[0], y1, a[1]]]], m,
        (ctr) => [ctr[0] + out[0], ctr[1] + out[1]]);
    });
  }
}

/** Panes on a face (along u at w = d when `side` is "w", along w at u = d when "u"; outward toward +u or +w when `out`
 * is 1, -u or -w when -1), `off` out of it: each a polygon of [s, y] (s along the face), in `material`. */
function panes(b, side, d, out, off, polys, material) {
  const dd = d + out * off;
  const p = (s, y) => { const [x, z] = side === "w" ? at(s, dd) : at(dd, s); return [x, y, z]; };
  const list = [];
  for (const poly of polys) for (let i = 1; i + 1 < poly.length; i++) list.push([p(...poly[0]), p(...poly[i]), p(...poly[i + 1])]);
  const [ox, oz] = side === "w" ? at(0, out) : at(out, 0);
  tris(b, list, material, (c) => [c[0] + ox, c[1] + oz]);
}

/** The windows of the ten storeys, `half` either side of `c`, as polygons of [s, y]. */
function storeys(c, half) {
  const W = F.windows, polys = [];
  for (let k = 0; k < W.count; k++) {
    const y1 = W.top - k * W.storey, y0 = y1 - W.height;
    polys.push([[c - half, y0], [c + half, y0], [c + half, y1], [c - half, y1]]);
  }
  return polys;
}

/** The arched window and the windows either side of it on a white face centred at `c` (along it). */
function windows(b, side, d, c) {
  const A = F.arch, W = F.windows, sp = A.crown - A.half, arch = [[c - A.half, A.foot], [c + A.half, A.foot]];
  for (let k = 0; k <= 8; k++) { const a = (Math.PI * k) / 8; arch.push([c + A.half * Math.cos(a), sp + A.half * Math.sin(a)]); }
  const mid = (W.from + W.to) / 2, half = (W.to - W.from) / 2;
  panes(b, side, d, Math.sign(d), 0.05, [arch, ...storeys(c + mid, half), ...storeys(c - mid, half)], GLASS);
}

export function building(b) {
  const T = M.tower, Ma = M.mansard, E = Ma.eaves, Tp = Ma.top;
  // the tower: its base in stone; its walls in glass, white on the bays and the north-east face (side 9, white from
  // its south-east end to w -5.4); the band and its roof inside a parapet 1 cm inside its walls
  prism(b, plan(T.plan), FOOT, F.base, STONE);
  const mats = T.plan.map((_, i) => (F.white.edges.includes(i) ? WALL : GLASS));
  const [w0, w1] = [T.plan[9][1], T.plan[10][1]];
  mats[9] = [[0, WALL], [(w0 - F.white.ene[0]) / (w0 - w1), GLASS]];
  walls(b, T.plan, F.base, F.band, mats);
  block(b, plan(T.plan), F.band, T.deck, WALL, ROOF);
  prism(b, plan(inset(T.plan, 0.01)), T.deck - 0.3, T.top, WALL, [plan(inset(T.plan, T.parapet))]);
  // the arched windows and the windows beside them, on the north-east face and the two bays' fronts
  windows(b, "u", T.plan[9][0], M.gables[2].at);
  windows(b, "w", T.plan[2][1], M.gables[0].at);
  windows(b, "w", T.plan[16][1], M.gables[1].at);
  // on the bays' sides a window in each storey, in the middle of the side (estimated: as on the side the photograph
  // shows, the street bay's north-east side)
  for (const i of [1, 3, 15, 17]) {
    const [u, wa] = T.plan[i], wb = T.plan[i + 1][1], out = Math.sign(u - M.gables[i < 10 ? 0 : 1].at);
    panes(b, "u", u, out, 0.05, storeys((wa + wb) / 2, F.windows.side), GLASS);
  }
  // the mansard: its walls from 0.3 m under the roof to its eaves, its slopes, and its flat top 1 cm over them
  prism(b, rect(E.u, E.w), T.deck - 0.3, E.h, WALL);
  const q = ([u0, u1], [w0_, w1_], h) => [[u0, w0_], [u1, w0_], [u1, w1_], [u0, w1_]].map(([u, w]) => { const [x, z] = at(u, w); return [x, h, z]; });
  hexahedron(b, [...q(E.u, E.w, E.h), ...q(Tp.u, Tp.w, Tp.h)], ROOF);
  prism(b, rect(Tp.u, Tp.w), Tp.h - 0.05, Tp.h + 0.01, TOP);
  for (const U of M.units) block(b, rect(U.u, U.w), Tp.h - 0.1, U.top, WALL, ROOF);
  // the plant, run 0.3 m into the mansard's walls
  block(b, rect([M.plant.u[0], Math.min(M.plant.u[1], E.u[0] + 0.3)], M.plant.w), T.deck - 0.3, M.plant.top, WALL, ROOF);
  // the gables, from 0.3 m inside the face to 5 cm before it, their feet 0.3 m under the parapet's top
  for (const g of M.gables) {
    const [side, d] = g.face, out = Math.sign(d);
    gable(b, side, g.at, d - out * M.gable.depth, d + out * 0.05, T.top - 0.3, g.apex, M.gable.half, WALL);
  }
}

export function podium(b) {
  const P = M.podium, En = P.entrance;
  block(b, plan(P.plan), FOOT - 0.05, P.roof, STONE, ROOF);
  // the gable over the entrance, its triangle to the street, its feet 0.3 m under the podium's roof
  const c = (En.u[0] + En.u[1]) / 2, half = (En.u[1] - En.u[0]) / 2;
  gable(b, "w", c, En.w[0], En.w[1], P.roof - 0.3, En.apex, half, STONE);
  prism(b, rect(P.canopy.u, P.canopy.w), P.canopy.top - 0.3, P.canopy.top, STONE);
}

export function low(b) {
  M.low.forEach((L, i) => block(b, plan(L.plan), FOOT - 0.1 - 0.05 * i, L.roof, STONE, ROOF));
}
