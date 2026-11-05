// The tower (parts/common.js, MEASURED.tower and .low). Round 0: its walls up to its main roof, the parapets along
// its south-west and north-east faces, the lower roofs at 46.7 m along its south-east and north-west ends and over
// the annex north of it, at the LiDAR's heights; plain pale walls, grey roofs. Round 1 (the LiDAR's cells): the main
// roof's band of three ramps and its court, the two lower roofs' ramps up to the south-west face and their upstands
// along the faces, the plant on the main roof, the parapets as wide as the cells have them.
import { FOOT, MEASURED } from "./common.js";
import { block, inside, prism, slopedPrism } from "./shapes.js";

const M = MEASURED, WALL = "claddingPale", ROOF = "roofGrey", PLANT = "grey";

/** The point of the tower's side from corner `a` to corner `b` (its plan's) where z = `z`, or where x = `x`. */
function onSide(a, b, z) {
  const [p, q] = [M.tower.plan[a], M.tower.plan[b]], t = (z - p[1]) / (q[1] - p[1]);
  return [p[0] + t * (q[0] - p[0]), z];
}
function onSideX(a, b, x) {
  const [p, q] = [M.tower.plan[a], M.tower.plan[b]], t = (x - p[0]) / (q[0] - p[0]);
  return [x, p[1] + t * (q[1] - p[1])];
}
const rect = ([x0, x1], [z0, z1]) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
// a plate of roof 1 cm thick on a plan, so that its top is apart from the walls' top under it
const plate = (b, plan, y, holes = []) => prism(b, plan, y, y + 0.01, ROOF, holes);

export function tower(b) {
  const T = M.tower, L = M.low, [s, w, n, e] = T.plan, top = T.roof + 0.01;
  // each end's edge of the main roof: z0 (z1) south-west of xs (xn), z0b (z1b) north-east of it
  const [z0, z0b, xs] = T.ends.se, [z1, z1b, xn] = T.ends.nw;
  // the walls up to the lower roofs' height over the whole plan
  prism(b, T.plan, FOOT, L.roof, WALL);
  // the main roof between the two ends, less the band across it
  const main = [onSide(0, 1, z0), onSide(0, 1, z1), [xn, z1], [xn, z1b], onSide(3, 2, z1b), onSide(3, 2, z0b), [xs, z0b], [xs, z0]];
  const hole = rect(T.band.x, T.band.z);
  prism(b, main, L.roof, T.roof, WALL, [hole]);
  plate(b, main, T.roof, [hole]);
  // the band: its court at the lower roofs' height, and the three ramps on it
  plate(b, hole, L.roof);
  for (const [x0, x1] of T.band.ramps)
    slopedPrism(b, rect([x0, x1], T.band.z), L.roof + 0.01, (x) => T.band.low + ((x - x0) / (x1 - x0)) * (T.band.high - T.band.low), WALL, ROOF);
  // the two ends: each a lower roof north-east of its ramp, and the ramp rising south-west to the south-west face
  const ends = [
    [L.se, [onSideX(3, 0, L.se.x), [L.se.x, z0], [xs, z0], [xs, z0b], main[5], e], [s, main[0], [L.se.x, z0], onSideX(3, 0, L.se.x)]],
    [L.nw, [[L.nw.x, z1], onSideX(1, 2, L.nw.x), n, main[4], [xn, z1b], [xn, z1]], [main[1], w, onSideX(1, 2, L.nw.x), [L.nw.x, z1]]],
  ];
  for (const [E, low, ramp] of ends) {
    plate(b, low, L.roof);
    const x1 = Math.max(...ramp.map(([x]) => x)), [h0, h1] = E.ramp;
    slopedPrism(b, ramp, L.roof, (x) => h0 + ((x - E.x) / (x1 - E.x)) * (h1 - h0), WALL, ROOF);
  }
  // the upstands along the south-east and north-west faces
  const U = L.upstand;
  prism(b, inside(onSideX(3, 0, L.se.upstand[0]), onSideX(3, 0, L.se.upstand[1]), U.width), L.roof + 0.015, U.top, WALL);
  prism(b, inside(onSideX(1, 2, L.nw.upstand[1]), onSideX(1, 2, L.nw.upstand[0]), U.width), L.roof + 0.015, U.top, WALL);
  // the parapets, from just above the roof's top (so that their faces do not lie in the plate's)
  prism(b, inside(main[0], main[1], T.parapet.width[0]), top + 0.005, T.parapet.sw, WALL);
  prism(b, inside(main[4], main[5], T.parapet.width[1]), top + 0.005, T.parapet.ne, WALL);
  // the plant
  for (const P of T.plant) prism(b, rect(P.x, P.z), top + 0.005, P.top, PLANT);
  block(b, L.annex, FOOT, L.roof, WALL, ROOF);
}
