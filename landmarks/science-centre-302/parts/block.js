// The lower block before the tower's south-west face and the screens that run on from it along the tower's end faces
// (parts/common.js, MEASURED.block). Round 0: the block's walls up to its flat top at 25.5 m, at the LiDAR's plan and
// height; step 6: the screens, 1.7 and 2 m deep, to 26.0 m; step 5: their dark walls (the photograph's near-black
// screens, drawn plain: their folds are not drawn yet) and the glazed corner at the block's south end.
import { FOOT, MEASURED, towerRect } from "./common.js";
import { block as slab, tris } from "./shapes.js";

const B = MEASURED.block, DARK = "screenBlack", ROOF = "roofGrey", GLASS = "glassPale";

export function block(b) {
  // its foot 0.1 m below the tower's, so that where it runs inside the tower their undersides are not in one plane
  slab(b, B.plan, FOOT - 0.1, B.top, DARK, ROOF);
  // the screens, each with its inner side 0.1 m inside the tower's face
  for (const S of B.screens) {
    const [b0, b1] = S.b[0] > 0 ? [S.b[0] - 0.1, S.b[1]] : [S.b[0], S.b[1] + 0.1];
    slab(b, towerRect(S.a, [b0, b1]), FOOT - 0.1, B.screenTop, DARK, ROOF);
  }
  corner(b);
}

/** The glazed corner: from the south corner (the plan's first point) along the south-west face to where its edge
 * meets the foot, and round the corner's short cut and along the south face to the tower, 3 cm before the walls. */
function corner(b) {
  const P = B.plan, G = B.glass, out = 0.03;
  const c = P.reduce(([x, z], [px, pz]) => [x + px / P.length, z + pz / P.length], [0, 0]);
  // a run of the face from p to q, its glass from height h0 at p falling `fall` a metre, as panels down to the foot;
  // returns the glass's height at q
  const panel = (p, q, h0, fall) => {
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]), e = [(q[0] - p[0]) / l, (q[1] - p[1]) / l], h1 = h0 - fall * l;
    // the outward normal: away from the plan's centre
    let n = [e[1], -e[0]];
    if (n[0] * (p[0] - c[0]) + n[1] * (p[1] - c[1]) < 0) n = [-n[0], -n[1]];
    const at = (s, y) => [p[0] + e[0] * s + n[0] * out, y, p[1] + e[1] * s + n[1] * out];
    const list = h1 > FOOT
      ? [[at(0, h0), at(l, h1), at(l, FOOT)], [at(0, h0), at(l, FOOT), at(0, FOOT)]]
      : [[at(0, h0), at((h0 - FOOT) / fall, FOOT), at(0, FOOT)]];
    tris(b, list, GLASS, (m) => [m[0] + n[0], m[1] + n[1]]);
    return h1;
  };
  // the south-west face, from the corner (P[0]) toward the west end (P[1])
  panel(P[0], P[1], G.top, G.sw);
  // the corner's short cut (P[0] to P[6]) and the south face (P[6] to P[5]), falling as the south face's edge
  panel(P[6], P[5], panel(P[0], P[6], G.top, G.s), G.s);
}
