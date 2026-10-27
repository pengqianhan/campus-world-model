// The block (parts/common.js MEASURED): four storeys of white cladding under a flat roof, the top storey
// sloping back along the south-east side. The street end (south-west, -x) as the three panoramas from
// Eden Crescent show it: three bays between white piers; downstairs a vehicle way, the glazed entrance and
// a glazed corner; upstairs a ribbon of glazing in each bay on two storeys (the corner bay's lower one
// taller), and a band of glazing across the top storey. The long sides stand against their neighbours and
// the north-east end faces a slope behind: no photograph shows them, so they are plain white walls.
import { MEASURED as M, FOOT } from "./common.js";
import { wall, facing, tris } from "./shapes.js";

const T = 0.35; // the street end's thickness

export function block(b) {
  const B = M.block, S = M.street, [s0, s1] = B.slope.z;
  // the body behind the street end, up to the roof, and the lower part along the sloping side
  b.box(B.x[0] + T, B.x[1], FOOT, B.roof, s1, B.z[1], "paint");
  b.box(B.x[0] + T, B.x[1], FOOT, B.slope.low, B.z[0], s1, "paint");
  // the sloping side of the top storey: one plane from its low edge up to the roof, facing up and out
  const a0 = [B.x[0], B.slope.low, s0], a1 = [B.x[1], B.slope.low, s0], r0 = [B.x[0], B.roof, s1], r1 = [B.x[1], B.roof, s1];
  tris(b, [[a0, r1, a1], [a0, r0, r1]], "roofGrey");
  // the flat roof and its parapet
  b.box(B.x[0], B.x[1], B.roof - 0.1, B.roof, s1, B.z[1], "roofGrey");
  b.box(B.x[0], B.x[1], B.roof, B.parapet, B.z[1] - 0.25, B.z[1], "paint");
  b.box(B.x[1] - 0.25, B.x[1], B.roof, B.parapet, s1, B.z[1], "paint");
  // the street end, facing -x: in that turned frame x runs along +z (to the right as seen from the street)
  facing(b, "-x", 0, 0, () => {
    const wins = [];
    const [L, C, R] = S.bays;
    const mid = (r) => (r[0] + r[1]) / 2, wd = (r) => r[1] - r[0] - 0.5;
    // downstairs: the vehicle way (an opening, dark), the entrance and the glazed corner
    wins.push({ x: mid(C), w: wd(C), y: S.ground[0], h: S.ground[1] - S.ground[0], transom: 2.3, bay: 1.2 });
    wins.push({ x: mid(R), w: wd(R), y: S.ground[0], h: S.ground[1] - S.ground[0], bay: 1.2 });
    for (const [y0, y1] of S.bands) for (const r of [L, C]) wins.push({ x: mid(r), w: wd(r), y: y0, h: y1 - y0 });
    wins.push({ x: mid(R), w: wd(R), y: S.corner[0], h: S.corner[1] - S.corner[0] });
    wins.push({ x: mid(R), w: wd(R), y: S.bands[1][0], h: S.bands[1][1] - S.bands[1][0] });
    wins.push({ x: (s1 + 0.3 + R[1] - 0.25) / 2, w: R[1] - 0.25 - (s1 + 0.3), y: S.top[0], h: S.top[1] - S.top[0], bay: 1.5 });
    const poly = [[0, 0], [B.z[1] - B.z[0], 0], [B.z[1] - B.z[0], B.parapet - FOOT], [s1 - B.z[0], B.parapet - FOOT], [0, B.slope.low - FOOT]];
    // the vehicle way: an opening with nothing in it, dark inside
    wins.push({ x: mid(L), w: wd(L), y: S.ground[0], h: S.ground[1] - 0.3 - S.ground[0], open: true });
    wall(b, poly, B.z[0], FOOT, -S.x, T, wins);
  });
}
