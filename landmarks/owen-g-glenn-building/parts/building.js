// Sir Owen G Glenn Building (260; parts/common.js, MEASURED), drawn in its own frame (u north-east, w north-west).
// Round 0: each part a block at the LiDAR's plan and height: the deck under the plaza, down to FOOT; on it the curved
// wing with the top storey on it, the west wing and the lower part west of it, and the sloping canopy in the curve;
// and, a part of its own, the north-east building on the deck, which the photograph (December 2018) predates: the
// comparison with it leaves that part out (compare's QUERY="only=building"). Round 1's faces: the curved wing in
// bands (its ground and glazed storeys in glass, white spandrels, bands of louvres and windows, a white fascia) with
// its crown of louvres along the sides the LiDAR shows it on; the canopy's louvres; the deck's walls grey. The parts
// the photograph does not show are drawn plainly. Parts that meet run into each other, or one stands on the other's
// roof, so that no two faces of different materials lie in one plane.
import { FOOT, MEASURED, plan } from "./common.js";
import { block, hexahedron, inside, prism, slopedPrism } from "./shapes.js";

const M = MEASURED, WALL = "claddingPale", ROOF = "roofGrey", GLASS = "glass", PANE = "glassPale", WHITE = "paint";
const LOUVRE = "screenSilver", DECK = "grey";

export function building(b) {
  const D = M.deck, Wg = M.wing, F = Wg.faces;
  // the deck, its top the plaza
  block(b, plan(D.plan), FOOT, D.top, DECK, ROOF);
  // the curved wing in bands, from 0.3 m under the deck's top: the open ground storey and the two glazed storeys,
  // then three spandrels and bands of louvres, the fascia and the roof
  const P = plan(Wg.plan);
  prism(b, P, D.top - 0.3, F.glazed[1], GLASS);
  for (const [y0, y1] of F.spandrels) prism(b, P, y0, y1, WHITE);
  for (const [y0, y1] of F.louvres) prism(b, P, y0, y1, PANE);
  block(b, P, F.fascia, Wg.roof, WHITE, ROOF);
  // the crown, on the roof's top, inside the sides the LiDAR shows it on
  let area = 0;
  for (let i = 0; i < P.length; i++) { const [a, c] = P[i], [d, e] = P[(i + 1) % P.length]; area += a * e - d * c; }
  for (const i of Wg.crown.sides) {
    const p = P[i], q = P[(i + 1) % P.length];
    const s = area > 0 ? inside(p, q, Wg.crown.width) : inside(q, p, Wg.crown.width);
    const at = (y) => s.map(([x, z]) => [x, y, z]);
    hexahedron(b, [...at(Wg.roof + 0.01), ...at(Wg.crown.top)], LOUVRE);
  }
  // the top storey on the curved wing's roof, and the west wing and the lower part west of it on the deck's (each
  // from its roof's top, 1 cm over its height: their plans share edges with those they stand on, where their walls
  // would lie in the roof's edge, and the west wing's runs into the curved wing's, where their feet would lie in one
  // plane)
  block(b, plan(M.top.plan), Wg.roof + 0.01, M.top.roof, WALL, ROOF);
  for (const p of [M.west, M.westLow]) block(b, plan(p.plan), D.top + 0.01, p.roof, WALL, ROOF);
  // the canopy: its plan raised from 0.3 m under the deck's top to its sloping top of louvres (h in u and w; x is -u,
  // z is w), over the glazed ground storey
  const C = M.canopy;
  slopedPrism(b, plan(C.plan), D.top - 0.3, (x, z) => C.top(-x, z), GLASS, LOUVRE);
}

export function northEast(b) {
  // on the deck's roof, as the west wing
  block(b, plan(M.ne.plan), M.deck.top + 0.01, M.ne.roof, WALL, ROOF);
}
