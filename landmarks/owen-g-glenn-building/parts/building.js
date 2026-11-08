// Sir Owen G Glenn Building (260; parts/common.js, MEASURED), drawn in its own frame (u north-east, w north-west).
// Round 0: each part a block at the LiDAR's plan and height: the deck under the plaza, down to FOOT; on it the curved
// wing with the top storey on it, the west wing and the lower part west of it, and the sloping canopy in the curve;
// and, a part of its own, the north-east building on the deck, which the photograph (December 2018) predates: the
// comparison with it leaves that part out (compare's QUERY="only=building"). Parts that meet run into each other, so
// that no two faces of different materials lie in one plane.
import { FOOT, MEASURED, plan } from "./common.js";
import { block, slopedPrism } from "./shapes.js";

const M = MEASURED, WALL = "claddingPale", ROOF = "roofGrey";

export function building(b) {
  const D = M.deck;
  // the deck, its top the plaza
  block(b, plan(D.plan), FOOT, D.top, WALL, ROOF);
  // the parts on it, each from 0.3 m under its top; the top storey on the curved wing's roof (from its roof's top,
  // 1 cm over M.wing.roof: their plans share edges, where its walls would lie in the roof's edge)
  for (const p of [M.wing, M.west, M.westLow]) block(b, plan(p.plan), D.top - 0.3, p.roof, WALL, ROOF);
  block(b, plan(M.top.plan), M.wing.roof + 0.01, M.top.roof, WALL, ROOF);
  // the canopy: its plan raised from 0.3 m under the deck's top to its sloping top (h in u and w; x is -u, z is w)
  const C = M.canopy;
  slopedPrism(b, plan(C.plan), D.top - 0.3, (x, z) => C.top(-x, z), WALL, ROOF);
}

export function northEast(b) {
  block(b, plan(M.ne.plan), M.deck.top - 0.3, M.ne.roof, WALL, ROOF);
}
