// The lower block before the tower's south-west face and the screens that run on from it along the tower's end faces
// (parts/common.js, MEASURED.block). Round 0: the block's walls up to its flat top at 25.5 m, at the LiDAR's plan and
// height; step 6: the screens, 1.7 and 2 m deep, to 26.0 m; step 5: their dark walls, the glazed corner at the block's
// south end, and on the faces the photograph shows the screens' folded blades and the frame round the glazed corner.
import { FOOT, MEASURED, towerAt, towerRect } from "./common.js";
import { block as slab, hexahedron, tris } from "./shapes.js";

const B = MEASURED.block, DARK = "screenBlack", ROOF = "roofGrey", GLASS = "glassPale";
const centre = B.plan.reduce(([x, z], [px, pz]) => [x + px / B.plan.length, z + pz / B.plan.length], [0, 0]);

/** The run of a face from p to q: its length, its direction and its outward normal (away from the block's centre),
 * and the point [x, y, z] at s along it, y up, d out of it. */
function run(p, q) {
  const l = Math.hypot(q[0] - p[0], q[1] - p[1]), e = [(q[0] - p[0]) / l, (q[1] - p[1]) / l];
  let n = [e[1], -e[0]];
  if (n[0] * (p[0] - centre[0]) + n[1] * (p[1] - centre[1]) < 0) n = [-n[0], -n[1]];
  return { l, e, n, at: (s, y, d) => [p[0] + e[0] * s + n[0] * d, y, p[1] + e[1] * s + n[1] * d] };
}

/** Where the lines p1 + t d1 and p2 + s d2 meet. */
function meet([p1, d1], [p2, d2]) {
  const t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / (d1[0] * d2[1] - d1[1] * d2[0]);
  return [p1[0] + t * d1[0], p1[1] + t * d1[1]];
}

export function block(b) {
  // The hull of the returns at the block's top is the screens' outer edge: on the faces the photograph shows, the
  // walls stand the blades' depth inside it, and the blades reach out to it.
  const P = B.plan, D = B.folds.depth;
  const inLine = (p, q) => { const r = run(p, q); return [[p[0] - r.n[0] * D, p[1] - r.n[1] * D], r.e]; };
  const along = (p, q) => [p, [q[0] - p[0], q[1] - p[1]]];
  const [sw, cutL, south] = [inLine(P[0], P[1]), inLine(P[0], P[6]), inLine(P[6], P[5])];
  const Q = [meet(sw, cutL), meet(sw, along(P[1], P[2])), P[2], P[3], P[4], meet(south, along(P[5], P[4])), meet(cutL, south)];
  // its foot 0.1 m below the tower's, so that where it runs inside the tower their undersides are not in one plane
  slab(b, Q, FOOT - 0.1, B.top, DARK, ROOF);
  // the screens, each with its inner side 0.1 m inside the tower's face; the south-east one's outer side too
  // stands the blades' depth inside the returns
  B.screens.forEach((S, i) => {
    const [b0, b1] = S.b[0] > 0 ? [S.b[0] - 0.1, S.b[1]] : [S.b[0] + (i === 1 ? D : 0), S.b[1] + 0.1];
    slab(b, towerRect(S.a, [b0, b1]), FOOT - 0.1, B.screenTop, DARK, ROOF);
  });
  // the faces the photograph shows, each with the line of the glazed corner's edge on it (its height at s), if any
  const G = B.glass, cut = run(Q[0], Q[6]), h6 = G.top - G.s * cut.l;
  const faces = [
    [run(Q[0], Q[1]), (s) => G.top - G.sw * s],
    [run(Q[6], Q[5]), (s) => h6 - G.s * s],
    // the screen along the tower's south-east face, to where the south face runs on in front of it
    [run(towerAt(26.0, B.screens[1].b[0] + D), towerAt(0.4, B.screens[1].b[0] + D)), null],
  ];
  corner(b, faces, cut);
  for (const [r, edge] of faces) blades(b, r, edge);
  // the screens' top rail along those faces, from the block's roof to 5 cm over the screens' top, as deep as the
  // blades (the photograph: one dark line along the top)
  for (const r of [faces[0][0], cut, faces[1][0], faces[2][0]]) {
    const q = [[0, B.top], [r.l, B.top], [r.l, B.screenTop + 0.05], [0, B.screenTop + 0.05]];
    hexahedron(b, [...q.map(([s, y]) => r.at(s, y, 0)), ...q.map(([s, y]) => r.at(s, y, B.folds.depth))], DARK);
  }
}

/** The glazed corner: from the south corner along the south-west face to where its edge meets the foot, and round
 * the corner's short cut and along the south face to the tower, 3 cm before the walls; the frame along its edges. */
function corner(b, [[sw, swEdge], [south, sEdge]], cut) {
  const G = B.glass, Fr = B.folds.frame, out = 0.03;
  // a run's glass under its edge line, from h0 at its start falling `fall` a metre, as panels down to the foot
  const panel = (r, h0, fall) => {
    const h1 = h0 - fall * r.l;
    const list = h1 > FOOT
      ? [[r.at(0, h0, out), r.at(r.l, h1, out), r.at(r.l, FOOT, out)], [r.at(0, h0, out), r.at(r.l, FOOT, out), r.at(0, FOOT, out)]]
      : [[r.at(0, h0, out), r.at((h0 - FOOT) / fall, FOOT, out), r.at(0, FOOT, out)]];
    tris(b, list, GLASS, (m) => [m[0] + r.n[0], m[1] + r.n[1]]);
  };
  panel(sw, G.top, G.sw);
  // and the ground storey's glazing along the south-west face, under the canopy (estimated: to the screens' foot)
  tris(b, [[sw.at(0, B.folds.from, out), sw.at(sw.l, B.folds.from, out), sw.at(sw.l, FOOT, out)], [sw.at(0, B.folds.from, out), sw.at(sw.l, FOOT, out), sw.at(0, FOOT, out)]], GLASS, (m) => [m[0] + sw.n[0], m[1] + sw.n[1]]);
  panel(cut, G.top, G.s);
  panel(south, G.top - G.s * cut.l, G.s);
  // the frame: above each edge from the corner down to the ground storey's top (or the run's end), Fr.width wide
  const frame = (r, edge, s1) => {
    const q = [[0, edge(0)], [s1, edge(s1)], [s1, edge(s1) + Fr.width], [0, edge(0) + Fr.width]];
    hexahedron(b, [...q.map(([s, y]) => r.at(s, y, 0)), ...q.map(([s, y]) => r.at(s, y, Fr.depth))], DARK);
  };
  const to = (edge, fall, l) => Math.min(l, (edge(0) - B.folds.from) / fall);
  frame(sw, swEdge, to(swEdge, G.sw, sw.l));
  frame(cut, (s) => G.top - G.s * s, cut.l);
  frame(south, sEdge, to(sEdge, G.s, south.l));
}

/** A face's folded blades: plates perpendicular to it, straight from the screens' top down to `straight`, then
 * zigzagging, from the ground storey's top or the frame over the glazed corner's edge. Each plate both ways. */
function blades(b, r, edge) {
  const F = B.folds, top = B.screenTop, list = [];
  for (let s0 = F.step / 2; s0 < r.l - F.step / 4; s0 += F.step) {
    const y0 = Math.max(F.from, edge ? edge(s0) + F.frame.width : F.from);
    if (y0 >= top - 0.5) continue;
    // the blade's line on the face: [s, y] from the top down
    const line = [[s0, top]];
    for (let j = 0, y = F.straight; ; j++, y -= F.pitch / 2) {
      const pt = [s0 + (j % 2 ? F.amp : 0), Math.min(y, top)];
      if (pt[1] > y0) { line.push(pt); continue; }
      const [ps, py] = line.at(-1), t = (py - y0) / (py - pt[1]);
      line.push([ps + t * (pt[0] - ps), y0]);
      break;
    }
    for (let i = 0; i + 1 < line.length; i++) {
      const [[s1, y1], [s2, y2]] = [line[i], line[i + 1]];
      if (y1 - y2 < 1e-3) continue;
      list.push([r.at(s1, y1, 0), r.at(s2, y2, 0), r.at(s2, y2, F.depth)], [r.at(s1, y1, 0), r.at(s2, y2, F.depth), r.at(s1, y1, F.depth)]);
    }
  }
  tris(b, list, DARK, (m) => [m[0] + r.e[0], m[1] + r.e[1]]);
  tris(b, list, DARK, (m) => [m[0] - r.e[0], m[1] - r.e[1]]);
}
