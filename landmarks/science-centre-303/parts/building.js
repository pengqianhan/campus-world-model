// The building of the Science Centre's 303 (parts/common.js, MEASURED), drawn in its own frame (u along its face to
// the street, w out of it). Round 0: each part a block at the LiDAR's plan and height, walls down to FOOT: the range
// along the street with its parapet, the slab behind it, the block behind toward the south-west and the wing toward
// the north-east. Round 1's shape: the slab's raised part, plant and round tank; the block's ridges, its 22.4 m part
// and its six stacks; the wing's strip, raised part and the two troughs across its roof; the range and the slab end
// where 303S's ring begins. Parts that meet run into each other, and ends that would meet in one plane stand a few
// centimetres apart, so that no two faces of different materials lie in one plane.
import { FOOT, MEASURED, at, rect, uw } from "./common.js";
import { block, prism, slopedPrism } from "./shapes.js";

const M = MEASURED, WALL = "concrete", ROOF = "roofGrey";

/** A round plan of n sides about [u, w] in the building's frame, r round. */
function round([u, w], r, n = 16) {
  return Array.from({ length: n }, (_, i) => at(u + r * Math.cos((2 * Math.PI * i) / n), w + r * Math.sin((2 * Math.PI * i) / n)));
}

export function building(b) {
  const R = M.range, S = M.slab, Q = M.rear, K = M.wing;
  // the range along the street, into the slab behind it; its north-east end back to the slab's back line
  block(b, rect(R.u, [R.w[0] - 0.3, R.w[1]]), FOOT, R.roof, WALL, ROOF);
  block(b, rect(R.ne.u, [R.ne.w[0] + 0.1, R.ne.w[1] + 0.3]), FOOT - 0.05, R.roof, WALL, ROOF);
  // the parapet along the face, from inside the range's walls
  prism(b, rect([R.u[0] + 0.01, R.u[1] - 0.01], [-R.parapet.width, -0.01]), R.roof - 0.3, R.parapet.top, WALL);
  // the slab (its end 5 cm short of the range's), its raised part, its plant and the round tank on it
  block(b, rect([S.u[0], S.u[1] - 0.05], S.w), FOOT - 0.1, S.roof, WALL, ROOF);
  block(b, rect(S.raised.u, S.raised.w), S.roof - 0.3, S.raised.top, WALL, ROOF);
  block(b, rect(S.plant.u, S.plant.w), S.roof - 0.3, S.plant.top, WALL, ROOF);
  block(b, round(S.tank.at, S.tank.r, 20), S.plant.top - 0.3, S.tank.top, WALL, ROOF);
  // behind it toward the south-west: the block, running into the slab; its ridges, its tall part and its stacks
  block(b, rect(Q.u, Q.w), FOOT - 0.15, Q.roof, WALL, ROOF);
  const w0 = Q.ridges.w[0] + 0.1;
  for (const [u0, u1] of Q.ridges.u) block(b, rect([u0, Math.min(u1, Q.u[1] - 0.1)], [w0, Q.ridges.w[1]]), Q.roof - 0.3, Q.ridges.top, WALL, ROOF);
  block(b, rect(Q.tower.u, [w0, Q.tower.w[1]]), Q.roof - 0.3, Q.tower.top, WALL, ROOF);
  for (const u of Q.stacks.u) block(b, round([u, Q.stacks.w], Q.stacks.r), Q.roof - 0.3, Q.stacks.top, WALL, ROOF);
  // toward the north-east: the wing, running into the slab, its front part flat, behind w -36 flat between its two
  // troughs, each a ramp rising from its north-east side; the lower strip along its north-east side, 10 cm inside its
  // ends; its raised part against the slab
  const T = K.troughs;
  block(b, rect(K.u, [T.w, K.w[1]]), FOOT - 0.2, K.roof, WALL, ROOF);
  let u0 = K.u[0];
  for (const [a0, a1] of T.u) {
    block(b, rect([u0, a0], [K.w[0], T.w + 0.1]), FOOT - 0.2, K.roof, WALL, ROOF);
    slopedPrism(b, rect([a0, a1], [K.w[0], T.w + 0.1]), FOOT - 0.2, (x, z) => T.low + ((uw(x, z)[0] - a0) / (a1 - a0)) * (T.high - T.low), WALL, ROOF);
    u0 = a1;
  }
  block(b, rect([u0, K.u[1]], [K.w[0], T.w + 0.1]), FOOT - 0.2, K.roof, WALL, ROOF);
  block(b, rect(K.ne.u, [K.w[0] + 0.1, K.w[1] - 0.1]), FOOT - 0.25, K.ne.top, WALL, ROOF);
  block(b, rect(K.raised.u, [K.raised.w[0], K.raised.w[1] - 0.1]), K.roof - 0.3, K.raised.top, WALL, ROOF);
}
