// The block (parts/common.js MEASURED): four storeys of white cladding under a flat roof with plant on it,
// the top storey standing back behind a terrace along the south-east side. The street end (-x) as the three panoramas from Eden Crescent show
// it, every size measured in round 1 (parts/common.js, "street"): a white top storey whose face comes down
// over three bays set back between two white piers, its corner raked on the south-east; in the bays a
// band of glazing on each of the two storeys below it, the right bay's lower one taller; downstairs a
// vehicle way, the glazed entrance with its doors and a glazed corner under a glazed canopy. The long sides
// stand against their neighbours and the far end faces a slope behind: no photograph shows them, so they
// are plain white walls.
import { MEASURED as M, FOOT } from "./common.js";
import { wall, facing } from "./shapes.js";

const T = 0.35; // the street end's thickness
const STREET = -0.75; // the street at the end's foot (the LiDAR: -0.72), where the vehicle way opens

export function block(b) {
  const B = M.block, S = M.street, R = B.terrace, [s0, s1] = R.z;
  // the body behind the street end, up to the roof, and the lower part along the terrace side; below the
  // top storey it starts D behind the end's face, so that the bays' openings look into rooms and the vehicle
  // way into its dark passage, closed at its two sides. Each roof is a grey slab on its walls' top, the
  // walls stopping under it, so that no two faces lie in one plane.
  const D = S.recess + T + 1.25, top = S.bayTop;
  b.box(B.x[0] + T, B.x[1], top, B.roof - 0.1, s1, B.z[1], "paint");
  b.box(B.x[0] + D, B.x[1], FOOT, top, s1, B.z[1], "paint");
  b.box(B.x[0] + T, B.x[1], top, R.y - 0.1, s0, s1, "paint");
  b.box(B.x[0] + D, B.x[1], FOOT, top, s0, s1, "paint");
  b.box(B.x[0] + T, B.x[0] + D, FOOT, top, B.z[1] - 0.3, B.z[1], "paint");
  b.box(B.x[0] + T, B.x[0] + D, FOOT, top, s0, s0 + 0.3, "paint");
  // the terrace along the south-east side, its parapet on the edge, and the top storey's wall behind it
  // (the face of the box above, at z = s1)
  b.box(B.x[0] + T, B.x[1], R.y - 0.1, R.y, s0 + 0.25, s1, "roofGrey");
  b.box(B.x[0] + T, B.x[1], R.y - 0.1, R.parapet, s0, s0 + 0.25, "paint");
  // the flat roof and its parapet
  b.box(B.x[0] + T, B.x[1] - 0.25, B.roof - 0.1, B.roof, s1, B.z[1] - 0.25, "roofGrey");
  b.box(B.x[0] + T, B.x[1], B.roof - 0.1, B.parapet, B.z[1] - 0.25, B.z[1], "paint");
  b.box(B.x[1] - 0.25, B.x[1], B.roof - 0.1, B.parapet, s1, B.z[1] - 0.25, "paint");
  // the plant on the roof, plain grey boxes at the LiDAR's sizes
  for (const p of M.plant) b.box(p.x[0], p.x[1], B.roof - 0.1, p.y, p.z[0], p.z[1], "roofGrey");
  // the street end, facing -x: in that turned frame x runs along +z (to the right as seen from the street)
  // and the end's face is at z = F
  facing(b, "-x", 0, 0, () => {
    const F = -S.x, R = S.recess, [z0, z1] = S.z, [P1, P2] = S.piers;
    // the top storey's face, from the bays' head to its top, raked at its south-east corner, with its band
    const W = z1 - z0, H = S.crest - top, t = S.band;
    const face = [[0, 0], [W, 0], [W, H], [S.rake.z - z0, H], [0, S.rake.low - top]];
    wall(b, face, z0, top, F, T, [{ x: (t.z[0] + t.z[1]) / 2, w: t.z[1] - t.z[0], y: t.y[0], h: t.y[1] - t.y[0], bay: 1.45 }]);
    // the two piers and the end's narrow south-east edge, in the face's plane, down to the street
    for (const [p0, p1] of [P1, P2, [z0, S.vehicle.z[0]]]) b.box(p0, p1, FOOT, top, F - R - 0.05, F, "paint");
    // the bays, set back R behind the piers: one wall across the end, from the foot to the top storey's face
    const wins = [];
    const span = (a, c, y0, y1, o = {}) => ({ x: (a + c) / 2, w: c - a, y: y0, h: y1 - y0, ...o });
    const [lo, up] = [S.lower, S.upper], cu = S.cornerUp;
    // upstairs: the left and centre bays' two bands, the right bay's upper band and its taller lower window
    for (const [y0, y1] of [lo, up]) wins.push(span(S.leftWin, P1[0], y0, y1), span(P1[1], P2[0], y0, y1));
    wins.push(span(P2[1], S.rightWin, up[0], up[1]), span(P2[1], cu.z1, cu.y[0], cu.y[1], { transom: cu.transom - cu.y[0] }));
    // downstairs: the vehicle way (open, dark inside), the entrance with its doors, the glazed corner
    wins.push(span(S.vehicle.z[0], S.vehicle.z[1], STREET, S.vehicle.head, { open: true }));
    const e = S.entrance;
    wins.push(span(P1[1], P2[0], e.y[0], e.y[1], { bay: 1.05, posts: e.doors }));
    wins.push(span(S.corner.z[0], S.corner.z[1], S.corner.y[0], S.corner.y[1], { bay: 1.2 }));
    wall(b, [[0, 0], [W, 0], [W, top - FOOT], [0, top - FOOT]], z0, FOOT, F - R, T, wins);
    // the glazed canopy over the corner, standing out from the bay to its far edge past the end
    const c = S.canopy;
    b.box(P2[1], c.z1, c.y[0] + 0.06, c.y[1] - 0.06, F - R, F + c.out, "glass");
    for (const y of [c.y[0], c.y[1] - 0.06]) b.box(P2[1], c.z1, y, y + 0.06, F - R, F + c.out, "iron");
  });
}
