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
  // the south face's line, moved in, meets the inner side inside the south-east screen's slab: the hull's two corners
  // there (P4, P5) are left out, or the plan would cross itself
  const Q = [meet(sw, cutL), meet(sw, along(P[1], P[2])), P[2], P[3], meet(south, along(P[4], P[3])), meet(cutL, south)];
  // its foot 0.1 m below the tower's, so that where it runs inside the tower their undersides are not in one plane
  slab(b, Q, FOOT - 0.1, B.top, DARK, ROOF);
  // the screens, each with its inner side 0.1 m inside the tower's face; the south-east one's outer side too
  // stands the blades' depth inside the returns
  B.screens.forEach((S, i) => {
    const [b0, b1] = S.b[0] > 0 ? [S.b[0] - 0.1, S.b[1]] : [S.b[0] + (i === 1 ? D : 0), S.b[1] + 0.1];
    slab(b, towerRect(S.a, [b0, b1]), FOOT - 0.1, B.screenTop, DARK, ROOF);
  });
  // the faces the photograph shows, each with the line of the glazed corner's edge on it (its height at s), if any
  const G = B.glass, cut = run(Q[0], Q[5]), h6 = G.top - G.s * cut.l;
  const southR = run(Q[5], Q[4]);
  // where on the south face the south-east screen begins: its face stands a few centimetres before the south face's
  // from there, so the glazed corner's glass and frame stop there, and the blades beyond run down as if no edge
  const m = meet([Q[5], southR.e], [towerAt(B.screens[1].a[0], 0), MEASURED.tower.b]);
  const sEnd = (m[0] - Q[5][0]) * southR.e[0] + (m[1] - Q[5][1]) * southR.e[1];
  const faces = [
    // (the south-west face's edge to where it meets the ground storey's top: the blades beyond run down to it too)
    [run(Q[0], Q[1]), (s) => (s <= (G.top - B.folds.from) / G.sw ? G.top - G.sw * s : null)],
    [southR, (s) => (s <= sEnd ? h6 - G.s * s : null)],
    // the screen along the tower's south-east face, to where the south face runs on in front of it
    [run(towerAt(26.0, B.screens[1].b[0] + D), towerAt(0.4, B.screens[1].b[0] + D)), null],
  ];
  const swR = faces[0][0];
  // where a run's outer edge, d out of it, meets its neighbour's at the south corner and its short cut: the rail and
  // the frame are mitred there, with no notch at the corner
  const reach = (r, o, d) => {
    const [p, q] = [r.at(0, 0, d), o.at(0, 0, d)], x = meet([[p[0], p[2]], r.e], [[q[0], q[2]], o.e]);
    return (x[0] - p[0]) * r.e[0] + (x[1] - p[2]) * r.e[1];
  };
  const ends = (r, d) => r === swR ? [reach(r, cut, d), r.l] : r === cut ? [reach(r, swR, d), reach(r, southR, d)]
    : r === southR ? [reach(r, cut, d), r.l] : [0, r.l];
  corner(b, faces, cut, sEnd, ends);
  for (const [r, edge] of faces) blades(b, r, edge);
  // the screens' top rail along those faces, from the block's roof to 5 cm over the screens' top, as deep as the
  // blades (the photograph: one dark line along the top)
  for (const r of [swR, cut, southR, faces[2][0]]) {
    const [o0, o1] = ends(r, D), [y0, y1] = [B.top, B.screenTop + 0.05];
    hexahedron(b, [r.at(0, y0, 0), r.at(r.l, y0, 0), r.at(r.l, y1, 0), r.at(0, y1, 0),
      r.at(o0, y0, D), r.at(o1, y0, D), r.at(o1, y1, D), r.at(o0, y1, D)], DARK);
  }
}

/** The glazed corner: from the south corner along the south-west face to where its edge meets the foot, and round
 * the corner's short cut and along the south face to the south-east screen (sEnd along it), 3 cm before the walls;
 * the frame along its edges, its outer edge from and to `ends`. */
function corner(b, [[sw, swEdge], [south, sEdge]], cut, sEnd, ends) {
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
  panel({ ...south, l: sEnd }, G.top - G.s * cut.l, G.s);
  // the frame: above each edge from the corner down to the ground storey's top (or the glass's end), Fr.width wide,
  // mitred at the corners; the short cut's outer corners at its neighbours' heights there, so that they meet level
  const frame = (r, edge, s1, [h0, h1] = []) => {
    const [o0, o1] = ends(r, Fr.depth), e1 = s1 < r.l ? s1 : o1;
    const q = (s, h = edge(s)) => [[s, h], [s, h + Fr.width]];
    const [[a, d], [c, f]] = [q(0), q(s1)], [[g, j], [k, m]] = [q(o0, h0), q(e1, h1)];
    hexahedron(b, [...[a, c, f, d].map(([s, y]) => r.at(s, y, 0)), ...[g, k, m, j].map(([s, y]) => r.at(s, y, Fr.depth))], DARK);
  };
  const to = (edge, fall, l) => Math.min(l, (edge(0) - B.folds.from) / fall);
  frame(sw, swEdge, to(swEdge, G.sw, sw.l));
  frame(cut, (s) => G.top - G.s * s, cut.l, [swEdge(ends(sw, Fr.depth)[0]), sEdge(ends(south, Fr.depth)[0])]);
  frame(south, sEdge, to(sEdge, G.s, sEnd));
}

/** A face's folded blades: plates perpendicular to it, straight from the screens' top down to `straight`, then
 * zigzagging, from the ground storey's top or the frame over the glazed corner's edge. Each plate both ways. */
function blades(b, r, edge) {
  const F = B.folds, top = B.screenTop, list = [];
  for (let s0 = F.step / 2; s0 < r.l - F.step / 4; s0 += F.step) {
    const e = edge ? edge(s0) : null, y0 = Math.max(F.from, e === null ? F.from : e + F.frame.width);
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
