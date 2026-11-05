// The tower (parts/common.js, MEASURED.tower and .low), drawn in its own frame (a toward the north-east from its
// south-west face, b toward the north-west from its south-east face): its walls up to the lower roofs' height, the
// main roof's two planes, the band across its middle (a court, three sawtooth ramps, a block and a slot), the
// parapets and the raised strip along the north-east face, the plant; the two lower roofs at its ends, each with its
// ramp up to the south-west parapet, its upstand along the face and, at the south-east end, a slab; the annex north of
// it. Plain pale walls, grey roofs. What stands on a roof starts inside the walls under it, and a roof's plate
// (1 cm thick) leaves out what stands on it, so that no two faces of different materials lie in one plane.
import { FOOT, MEASURED, towerAt, towerRect as rect } from "./common.js";
import { block, prism, slopedPrism } from "./shapes.js";

const T = MEASURED.tower, L = MEASURED.low, WALL = "claddingPale", ROOF = "roofGrey", PLANT = "grey";
const NW = 44.35, [B0, B1] = T.main.b, [N0, N1] = T.band.b;
// a and b of a point [x, z] of the view frame
const ab = (x, z) => [(x - T.corner[0]) * T.a[0] + (z - T.corner[1]) * T.a[1], (x - T.corner[0]) * T.b[0] + (z - T.corner[1]) * T.b[1]];
// a height that runs linearly from h0 at a0 (or b0) to h1 at a1 (b1), for slopedPrism
const alongA = (a0, h0, a1, h1) => (x, z) => h0 + ((ab(x, z)[0] - a0) / (a1 - a0)) * (h1 - h0);
const alongB = (b0, h0, b1, h1) => (x, z) => h0 + ((ab(x, z)[1] - b0) / (b1 - b0)) * (h1 - h0);
// a roof's plate, 1 cm thick
const plate = (b, plan, y = L.roof) => prism(b, plan, y, y + 0.01, ROOF);
// the foot of what stands on a roof: inside the walls under it
const SUNK = L.roof - 0.3;

export function tower(b) {
  const ne = T.ne, sw = T.parapet.sw.width, pa = T.parapet.ne.a, sa = T.strip.a;
  // the walls up to the lower roofs' height, the north-east face stepping out between the ends
  prism(b, [[0, 0], [ne.ends, 0], [ne.ends, B0], [ne.main, B0], [ne.main, B1], [ne.ends, B1], [ne.ends, NW], [0, NW]].map(([a, c]) => towerAt(a, c)), FOOT, L.roof, WALL);
  // the main roof's two planes, falling from its ends to the band
  slopedPrism(b, rect([sw, sa], [B0, N0]), L.roof, alongB(B0, T.roof.end, N0, T.roof.band), WALL, ROOF);
  slopedPrism(b, rect([sw, sa], [N1, B1]), L.roof, alongB(N1, T.roof.band, B1, T.roof.end), WALL, ROOF);
  // the band: the main roof south-west of the court, the plate under the court, the gutters and the slot, the ramps,
  // the block
  const N = T.band;
  slopedPrism(b, rect([sw, N.sw.a], [N0, N1]), L.roof, alongA(sw, N.sw.top[0], N.sw.a, N.sw.top[1]), WALL, ROOF);
  plate(b, rect([N.sw.a, pa], [N0, N1]));
  for (const [a0, a1] of N.ramps) slopedPrism(b, rect([a0, a1], N.rampB), L.roof + 0.005, alongA(a0, N.high, a1, N.low), WALL, ROOF);
  block(b, rect(N.island.a, N.rampB), L.roof + 0.005, N.island.top, WALL, ROOF);
  // the parapet along the south-west face, the raised strip and the parapet along the north-east face
  prism(b, rect([0, sw], [0, NW]), SUNK, T.parapet.sw.top, WALL);
  for (const span of [[B0, N0], [N1, B1]]) block(b, rect([sa, pa], span), SUNK, T.strip.top, WALL, ROOF);
  prism(b, rect([pa, ne.main], [B0, B1]), SUNK, T.parapet.ne.top, WALL);
  // the plant, from inside the main roof
  for (const P of T.plant) prism(b, rect(P.a, P.b), T.roof.band - 0.5, P.top, PLANT);

  // the south-east end: its ramp, its upstand along the face, the slab beyond it, the plate between
  const se = L.se;
  slopedPrism(b, rect([sw, se.ramp.a], [0, B0]), L.roof, alongA(0, se.ramp.h[0], 1, se.ramp.h[0] + se.ramp.h[1]), WALL, ROOF);
  prism(b, rect(se.upstand.a, [0, se.upstand.width]), SUNK, L.upstand, WALL);
  block(b, rect([se.slab.a, ne.ends], [0, B0]), SUNK, se.slab.top, WALL, ROOF);
  plate(b, rect([se.ramp.a, se.slab.a], [se.upstand.width, B0]));
  // the north-west end: its ramp, its upstand, the plate round the upstand's end
  const nw = L.nw, u0 = NW - nw.upstand.width, [ua0, ua1] = nw.upstand.a;
  slopedPrism(b, rect([sw, nw.ramp.a], [B1, NW]), L.roof, alongA(0, nw.ramp.h[0], 1, nw.ramp.h[0] + nw.ramp.h[1]), WALL, ROOF);
  prism(b, rect([ua0, ua1], [u0, NW]), SUNK, L.upstand, WALL);
  plate(b, [[nw.ramp.a, B1], [ne.ends, B1], [ne.ends, NW], [ua1, NW], [ua1, u0], [nw.ramp.a, u0]].map(([a, c]) => towerAt(a, c)));
  // the annex north of the tower
  block(b, L.annex, FOOT, L.roof, WALL, ROOF);
}
