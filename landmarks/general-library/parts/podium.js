// The podium (parts/common.js MEASURED.podium): flat-roofed blocks round the slab's foot, aligned with
// the frame. The photographs show, on Alfred Street (2022-09) and behind it on the north-east (2025-05),
// a screen of white concrete fins in front of the glazing, crowned by a row of folded "teeth" that rise
// to the roof's edge, over a plinth: red-brown brick on Alfred Street, grey render and dark glazing
// behind; the front block's end by the stair tower glazed in dark frames; at the north-west
// end (Princes Street's side, 2024-07) a band of glazing under a deep white fascia; at the south-east
// end of the low block (2025-05) glazing between dark piers. The faces that none of the twelve
// panoramas shows (the main block's back on the service lane, the low block's north-east face, the
// back wing's south-east side) are plain.
import { boxesGeometry } from "../../kit/gothic.js";
import { MEASURED as M, FOOT } from "./common.js";
import { face, faceBox, ribbons, glazing, prism, piers } from "./facade.js";

const IN = 0.3;
/** How far the crown's teeth stand out of the glazing behind the fins: the LiDAR's roof edge is theirs. */
const OUT = 1.6;

/**
 * A flat-roofed block with a pale roof. Its mass stands `inset` [x0, x1, z0, z1] inside the block's
 * edges, and below `split` m it stands `low` inside them instead, behind the glazing drawn there.
 * Above the roof's edge behind the fin screens (MEASURED.podium.edge) it stands `crown` inside them,
 * so that the sky shows between the hoods.
 */
function block(b, B, inset, low = inset, split = FOOT, crown = null) {
  const [x0, x1] = B.x, [z0, z1] = B.z, mid = crown ? M.podium.edge : B.top, ins = crown ?? inset;
  if (split > FOOT) b.box(x0 + low[0], x1 - low[1], FOOT, split, z0 + low[2], z1 - low[3], "paint");
  b.box(x0 + inset[0], x1 - inset[1], split, mid, z0 + inset[2], z1 - inset[3], "paint");
  if (crown) b.box(x0 + ins[0], x1 - ins[1], mid, B.top, z0 + ins[2], z1 - ins[3], "paint");
  b.box(x0 + ins[0] + 0.1, x1 - ins[1] - 0.1, B.top - 0.05, B.top + 0.02, z0 + ins[2] + 0.1, z1 - ins[3] - 0.1, "roofPale");
}

/**
 * The fin screen on a face from y0 to y1: glazing behind, white fins 0.3 m wide standing 1.0 m out every
 * `pitch` metres, and over them a crown of folded hoods, one every three fins, from y1 to `top`: each a
 * trapezoid, widest at the top (nearly touching the next), a third as wide at its foot, standing OUT
 * from the glazing at the top (fF8q's and v7l7's upper views).
 */
function fins(b, f, y0, y1, top, { pitch = 1.3, a0 = f.a0, a1 = f.a1 } = {}) {
  glazing(b, f, y0, y1, { inset: 0.3, bay: pitch * 3, a0, a1 });
  const n = Math.max(1, Math.round((a1 - a0) / pitch)), d = (a1 - a0) / n, F = [];
  for (let k = 0; k <= n; k++) { const a = a0 + d * k; F.push(faceBox(f, a - 0.15, a + 0.15, y0, y1 + 0.3, 0, 1.0)); }
  b.add(boxesGeometry(F), "paint");
  const teeth = Math.max(1, Math.round((a1 - a0) / (3 * d))), t = (a1 - a0) / teeth;
  for (let k = 0; k < teeth; k++) {
    const c = a0 + t * (k + 0.5), wt = t / 2 - 0.08, wb = t / 6;
    prism(b, f, [[c - wb, y1], [c + wb, y1], [c + wt, top], [c - wt, top]], -0.3, OUT, "paint");
  }
}

export function podium(b) {
  const P = M.podium, A = P.main, G = M.ground;
  // the masses stand behind the fins' glazing (OUT + 0.5 in from the teeth), and lower down behind the
  // glazing of the north-west end (0.9), of the back wing's ground floor and of the low block's end
  const C = OUT + 2.0;
  block(b, A, [IN, 0, IN, OUT + 0.5], [0.9, 0, IN, OUT + 0.5], 11.0, [IN, 0, IN, C]);
  block(b, P.middle, [0, 0, 0, 0]);
  block(b, P.back, [OUT + 0.5, 0, OUT + 0.5, 0], [OUT + 0.5, 0, OUT + 1.0, 0], 6.3, [C, 0, C, 0]);
  block(b, P.low, [0, IN, 0, 0], [0, 0.9, 0, 0], 5.0);
  // Alfred Street: a brick plinth and the fin screen the whole length of the front block; its end by the
  // stair tower (facing +x, B4NW's photograph) glazed in two storeys of dark frames over the brick
  const front = face("z", A.z[1] - OUT, 1, A.x[0], A.x[1]), plinth = 5.2;
  b.add(boxesGeometry([faceBox(front, A.x[0], A.x[1], FOOT, plinth, -0.5, 1.0)]), "brick");
  fins(b, front, plinth, 10.4, A.top, { a0: A.x[0] + 0.4, a1: A.x[1] - 0.4 });
  const end = face("x", A.x[1], 1, M.stair.w[1] + 0.1, A.z[1] - OUT + 1.0);
  b.add(boxesGeometry([faceBox(end, end.a0, end.a1, FOOT, plinth, -0.2, 0.05)]), "brick");
  b.add(boxesGeometry([faceBox(end, end.a0, end.a1, plinth, plinth + 0.45, -0.2, 0.25), faceBox(end, end.a0, end.a1, 12.2, A.top, -0.2, 0.25)]), "paint");
  glazing(b, end, plinth + 0.45, 12.2, { inset: -0.15, bay: 1.4 });
  // the north-west end (Qaci): a band of glazing under a white fascia, and toward Alfred Street
  // (z > 14.6) a blank panel
  const nw = face("x", A.x[0], -1, A.z[0], A.z[1]);
  glazing(b, nw, G.nwEnd + 1.2, 11.0, { inset: 0.6, bay: 2.4, a1: 14.6 });
  b.add(boxesGeometry([faceBox(nw, A.z[0], 14.6, FOOT, G.nwEnd + 1.2, -0.9, 0), faceBox(nw, 14.6, A.z[1] - OUT, FOOT, 11.0, -0.9, 0),
    faceBox(nw, A.z[0], A.z[1] - OUT, 11.0, M.podium.edge, -IN, 0)]), "paint");
  // the back wing's north-east face (the lawn): grey plinth, dark glazing, a white floor edge, the fins
  const ne = face("z", P.back.z[0] + OUT, -1, P.back.x[0] + OUT, P.back.x[1]);
  glazing(b, ne, G.back + 1.6, 5.6, { inset: 0.8, bay: 5.0 });
  b.add(boxesGeometry([faceBox(ne, ne.a0, ne.a1, FOOT, G.back + 1.6, -1.0, 0)]), "grey");
  b.add(boxesGeometry([faceBox(ne, ne.a0, ne.a1, 5.6, 6.3, -IN, 0.15)]), "paint");
  fins(b, ne, 6.3, 10.0, P.back.top, { a0: ne.a0 + 0.4, a1: ne.a1 - 0.4 });
  // its north-west side, as EX9b's photograph shows it: the same fins
  fins(b, face("x", P.back.x[0] + OUT, -1, P.back.z[0] + OUT, P.back.z[1]), 6.3, 10.0, P.back.top, { a0: P.back.z[0] + OUT + 0.4, a1: P.back.z[1] - 0.4 });
  // the low block's south-east end: glazing between dark piers, two floors above the ground floor
  ribbons(b, face("x", P.low.x[1], 1, P.low.z[0], P.low.z[1]), 5.0, P.low.top, [8.5], { sp: 0.9, bay: 2.2 });
  glazing(b, face("x", P.low.x[1], 1, P.low.z[0], P.low.z[1]), G.seEnd - 0.3, 5.0, { inset: 0.6, bay: 4.4 });
  piers(b, face("x", P.low.x[1], 1, P.low.z[0], P.low.z[1]), FOOT, 5.0, { bay: 4.4 });
}

/** The glass canopy along the slab's foot on Alfred Street, on slender posts. */
export function canopy(b) {
  const y = M.ground.frontRight + 3.4, z0 = 10.0, z1 = 13.2, x0 = 6.5, x1 = 27.0, posts = [];
  b.box(x0, x1, y, y + 0.08, z0, z1, "glassPale");
  posts.push([x0, x1, y - 0.25, y, z1 - 0.15, z1]);
  for (let x = x0 + 0.5; x <= x1; x += 5.1) posts.push([x - 0.08, x + 0.08, FOOT, y, z1 - 0.6, z1 - 0.44]);
  b.add(boxesGeometry(posts), "iron");
}
