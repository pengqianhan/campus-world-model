// 49 Symonds Street (620; parts/common.js, MEASURED), drawn in its own frame (u west-south-west, w to the street).
// Round 0: each part a block at the LiDAR's plan and height: the tower with its roof inside a parapet, the mansard on
// it, the plant east of the mansard and the gable in the middle of each face; the podium to its east with the gable
// over its entrance; the lower buildings behind the podium. Walls down to FOOT. Parts that meet run into each other,
// so that no two faces of different materials lie in one plane.
import { FOOT, MEASURED, at, inset, plan, rect } from "./common.js";
import { block, hexahedron, prism } from "./shapes.js";

const M = MEASURED, WALL = "claddingPale", ROOF = "roofGrey";

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

export function building(b) {
  const T = M.tower, Ma = M.mansard, E = Ma.eaves, Tp = Ma.top;
  // the tower, its roof inside a parapet 1 cm inside its walls
  block(b, plan(T.plan), FOOT, T.deck, WALL, ROOF);
  prism(b, plan(inset(T.plan, 0.01)), T.deck - 0.3, T.top, WALL, [plan(inset(T.plan, T.parapet))]);
  // the mansard: its walls from 0.3 m under the roof to its eaves, its slopes and flat top
  prism(b, rect(E.u, E.w), T.deck - 0.3, E.h, WALL);
  const q = ([u0, u1], [w0, w1], h) => [[u0, w0], [u1, w0], [u1, w1], [u0, w1]].map(([u, w]) => { const [x, z] = at(u, w); return [x, h, z]; });
  hexahedron(b, [...q(E.u, E.w, E.h), ...q(Tp.u, Tp.w, Tp.h)], ROOF);
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
  block(b, plan(P.plan), FOOT - 0.05, P.roof, WALL, ROOF);
  // the gable over the entrance, its triangle to the street, its feet 0.3 m under the podium's roof
  const c = (En.u[0] + En.u[1]) / 2, half = (En.u[1] - En.u[0]) / 2;
  gable(b, "w", c, En.w[0], En.w[1], P.roof - 0.3, En.apex, half, WALL);
}

export function low(b) {
  M.low.forEach((L, i) => block(b, plan(L.plan), FOOT - 0.1 - 0.05 * i, L.roof, WALL, ROOF));
}
