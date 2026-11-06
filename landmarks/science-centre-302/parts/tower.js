// The tower (parts/common.js, MEASURED.tower and .low), drawn in its own frame (a toward the north-east from its
// south-west face, b toward the north-west from its south-east face): its walls up to the lower roofs' height, the
// main roof's two planes, the band across its middle (a court, three sawtooth ramps, a block and a slot), the
// parapets and the raised strip along the north-east face, the plant; the two lower roofs at its ends, each with its
// ramp up to the south-west parapet, its upstand along the face and, at the south-east end, a slab; the annex north of
// it; a lower wing along its north-east face. Pale walls, grey roofs; step 5, the faces the photograph shows: the south-west face's ribbons of glass between
// bands of metal and its slats, the south-east face's brown cladding and fins. What stands on a roof starts inside the
// walls under it, and a roof's plate (1 cm thick) leaves out what stands on it, so that no two faces of different
// materials lie in one plane.
import { FOOT, MEASURED, towerAt, towerRect as rect } from "./common.js";
import { block, prism, slopedPrism } from "./shapes.js";

const T = MEASURED.tower, L = MEASURED.low, WALL = "claddingPale", ROOF = "roofGrey", PLANT = "grey", GLASS = "glassPale";
const FIN = "finBrown";
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
  const ne = T.ne, sw = T.parapet.sw.width, pa = T.parapet.ne.a, sa = T.strip.a, R = T.sw.recess;
  // the walls up to the lower roofs' height, the north-east face stepping out between the ends, the south-west face
  // at the glass's line
  prism(b, [[R, 0], [ne.ends, 0], [ne.ends, B0], [ne.main, B0], [ne.main, B1], [ne.ends, B1], [ne.ends, NW], [R, NW]].map(([a, c]) => towerAt(a, c)), FOOT, L.roof, WALL);
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
  // the parapet along the south-west face (from the top ribbon's head), the raised strip and the parapet along the
  // north-east face
  prism(b, rect([0, sw], [0, NW]), T.sw.ribbons.at(-1)[1], T.parapet.sw.top, WALL);
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
  // the lower wing along the north-east face, its foot 0.1 m below the tower's
  slopedPrism(b, rect(L.wing.a, L.wing.b), FOOT - 0.1, alongA(...L.wing.h), WALL, ROOF);
  faces(b);
}

/** The faces the photograph shows: the south-west face's ribbons, bands and slats, the south-east face's cladding
 * and fins. */
function faces(b) {
  const S = T.sw, R = S.recess, rib = S.ribbons, se = L.se, F = T.se.fins, ua0 = se.upstand.a[0];
  // the bands of metal, from the lower block's roof up, between the ribbons, standing out of the walls by R; the
  // ribbons' glass just in front of the walls (and 1 cm in from the end faces)
  for (let i = 0; i < rib.length; i++) {
    prism(b, rect([0, R + 0.05], [0, NW]), i ? rib[i - 1][1] : MEASURED.block.top - 0.1, rib[i][0], WALL);
    prism(b, rect([R - 0.04, R + 0.02], [0.01, NW - 0.01]), rib[i][0], rib[i][1], GLASS);
  }
  // the slats before the parapet, from the ledge to its top
  for (let c = S.slat.step / 2; c < NW; c += S.slat.step)
    prism(b, rect([-S.slat.depth, 0.02], [c - S.slat.width / 2, c + S.slat.width / 2]), S.ledge, T.parapet.sw.top, WALL);
  // the south-east face: its cladding 4 cm thick from the screen's top, 1 cm under what tops the face (the ramp, the
  // upstand, the slab), its pieces' ends 1 cm off the upstand's ends and the slab's side, and the fins before it
  const top = MEASURED.block.screenTop, skin = [-0.04, 0.04], [k0, k1] = [ua0 - 0.01, se.slab.a - 0.01];
  slopedPrism(b, rect([R + 0.05, k0], skin), top, alongA(0, se.ramp.h[0] - 0.01, 1, se.ramp.h[0] + se.ramp.h[1] - 0.01), FIN, FIN);
  prism(b, rect([k0, k1], skin), top, L.upstand - 0.01, FIN);
  prism(b, rect([k1, T.ne.ends - 0.01], skin), top, se.slab.top - 0.01, FIN);
  for (let c = F.from; c < T.ne.ends - 0.3; c += F.step)
    prism(b, rect([c - F.width / 2, c + F.width / 2], [-F.depth, -0.02]), top, (c < se.slab.a ? L.upstand : se.slab.top) - 0.05, FIN);
}
