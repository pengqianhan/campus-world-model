// The face to the road (south-east, v = outer.v[1]) and its wrap round the east corner toward 110N's link,
// from FACADE (parts/common.js: each size with its source): four concrete bands, flush with the face;
// between them the windows, set back by the recess, in red steel frames; piers from the plinth to the top
// band, flush with the bands; a plain end at the south-west; toward the north-east end, the ground storey
// as oWaF's door view shows it (FACADE.groundNE). Drawn in the building's own axes (u, v); model.js turns
// it. body.js stops the range to the road at the windows' plane.
import { FOOT, MEASURED, FACADE } from "./common.js";

const M = MEASURED, F = FACADE, G = F.groundNE;
const U0 = M.outer.u[0], U1 = M.outer.u[1], V1 = M.outer.v[1];
export const VW = V1 - F.recess;   // the windows' plane on the face to the road
export const UW = U1 - F.recess;   // and on the north-east end, round the east corner
const VG = V1 - G.back, UG = U1 - G.back;   // the ground storey's plane toward the north-east end, and round it
const C = "concrete";

/** The bays between the piers (and the plain end, and the corner), [u0, u1, first mullion]. */
function bays() {
  const edges = [[U0, U0 + F.pierWidth], ...F.piers.map((p, i) => [p, p + F.pierWidths[i]])];
  const out = [];
  for (let i = 0; i < edges.length; i++) {
    const a = edges[i][1], b = i + 1 < edges.length ? edges[i + 1][0] : UW;
    const start = F.mullion.starts[edges[i][0]] ?? a + F.mullion.width;
    out.push([a, b, start]);
  }
  return out;
}

/** The plinth's top at u: G's beyond G.from. */
const plinthAt = (u) => (u >= G.from ? G.plinth : F.plinth);
/** A row's [u0, u1, sill, head, plane] over [ua, ub] of the face, split at G.from for the ground storey,
 * whose part beyond it stands on its own plane and runs to the corner's (UG). */
function spans(r, ua, ub) {
  const [y0, y1] = F.rows[r];
  if (r !== 0 || ub <= G.from) return [[ua, ub, y0, y1, VW]];
  const ne = [Math.max(ua, G.from), ub >= UW ? UG : ub, G.plinth, G.band, VG];
  return ua >= G.from ? [ne] : [[ua, G.from, y0, y1, VW], ne];
}
const inAny = (u0, u1, list) => list.some(([a, b]) => u1 > a + 1e-6 && u0 < b - 1e-6);
// Toward the north-east end the ground storey's sills stand below the door's ground (y = 0), on the plinth.
// The site's foot check reads each material's lowest points as a footing (tests/landmarks.test.ts), so the
// glass, the mullions and the panels there run on down inside the plinth to FOOT, where nothing shows them,
// as the walls run down into the ground (and past it by 1, 2 and 3 cm, so that no two of their feet and the
// plinth's lie in one plane); the sills' frames stay at G.plinth.

export function front(b) {
  seed = 110;
  const top = F.bands[F.bands.length - 1][0];
  // the plinth and the bands, along the face and round the corner as far as the wrap; the ground storey's
  // band and the plinth reach lower beyond G.from and round the corner
  const layers = [[FOOT, F.plinth, FOOT, G.plinth], ...F.bands.map(([y0, y1], i) => (i === 0 ? [y0, y1, G.band, y1] : [y0, y1, y0, y1]))];
  for (const [y0, y1, z0, z1] of layers) {
    b.box(U0, G.from, y0, y1, VW, V1, C);
    b.box(UW, U1, z0, z1, F.wrapTo, VW, C);
    if (z1 !== G.plinth) { b.box(G.from, U1, z0, z1, VW, V1, C); continue; }
    // the plinth toward the north-east end, lower before the white door, which comes down to the ground
    // (the middle piece 1 cm into its neighbours, so that its ends lie in none of the white door's faces)
    const [d0, d1] = G.door.u;
    b.box(G.from, d0, z0, z1, VW, V1, C);
    b.box(d0 - 0.01, d1 + 0.01, z0, G.door.foot, VW, V1, C);
    b.box(d1, U1, z0, z1, VW, V1, C);
  }
  // the plain end at the south-west and the piers, from the plinth to the top band (1 cm into each, so that
  // their tops and feet lie in none of the frames')
  b.box(U0, U0 + F.pierWidth, F.plinth, top + 0.01, VW, V1, C);
  F.piers.forEach((p, i) => b.box(p, p + F.pierWidths[i], plinthAt(p) - 0.01, top + 0.01, VW, V1, C));
  // toward the north-east end the ground storey's plane, VG, stands in front of the range's wall: fill
  // between them, along the face and round the corner; its posts between the windows, on that plane (1 cm
  // into the plinth and the band, past the sill's foot and the head's top)
  b.box(G.from, UG, G.plinth, G.band, VW, VG - 0.01, C);
  b.box(UW, UG - 0.01, G.plinth, G.band, F.wrapTo, VG, C);
  for (const [a, c, t] of G.posts) b.box(a, c, G.plinth - 0.01, G.band + 0.01, VG, VG + t, C);

  // The glass is a skin 2 cm thick, 1 cm in front of the range's wall and the piers' backs; the frames stand from
  // 2 cm in front of them, through the glass, to `d`; the glass's edges stop inside the frames, the plain end, the
  // fill or the corner's glass, and below the ground storey on VG it and the mullions run down past FOOT by 1 and
  // 2 cm: so no face of the glass, the frames or the concrete lies in a face of another of them. What shows, the
  // glass's face and the frames', stands where it stood.
  const d = F.frameDepth, w = F.mullion.width, fw = F.frame;
  F.rows.forEach((row, r) => {
    const split = F.dark.row === r ? F.dark.top : null;
    for (const [ua, ub, y0, y1, pv] of spans(r, U0 + F.pierWidth, UW + 0.03)) {
      // the glass, a skin over the range's wall at the windows' plane; the dark panes are glass with no blind
      // (the kit's dark glass reads 21 in the upper view against the photograph's 59, the pale glass about 70)
      const ga = ua === G.from ? ua + 0.02 : ua - 0.01, gb = ub === G.from || ub === UG ? ub + 0.01 : ub - 0.005;
      b.box(ga, gb, pv === VG ? FOOT - 0.01 : y0 + fw / 2, y1 - fw / 2, pv + 0.01, pv + 0.03, "glassPale");
      // the frames' horizontals: sill, head, transoms
      const ua2 = ua === G.from ? ua + 0.01 : ua;
      const ue = ub === G.from ? ub + 0.01 : ub === UG ? ub + 0.02 : pv === VW ? Math.min(ub, UW + d) - 0.01 : ub;
      for (const y of [y0, y1 - fw, F.transoms[r], F.transoms2[r]].filter((y) => y != null)) b.box(ua2, ue, y, y + fw, pv + 0.02, pv + d, "frameRed");
    }
    // round the corner: the ground storey's heights and plane there are G's
    const [e0, e1, eu] = r === 0 ? [G.plinth, G.band, UG] : [...row, UW];
    const ev = r === 0 ? VG : VW;
    b.box(eu + 0.01, eu + 0.03, ev === VG ? FOOT - 0.01 : e0 + fw / 2, e1 - fw / 2, F.wrapTo - 0.01, ev + 0.03, "glassPale");
    for (const y of [e0, e1 - fw, F.transoms[r], F.transoms2[r]].filter((y) => y != null)) b.box(eu + 0.02, eu + d, y, y + fw, F.wrapTo, ev + d, "frameRed");
    // the panes' tiers between sill, transoms and head; in each pane a blind down (light) or up (the
    // glass), by a seeded draw at the row's share of light panes (FACADE.blinds)
    const [y0, y1] = row;
    const tiers = [...new Set([y0, split, F.transoms[r], F.transoms2[r], y1].filter((y) => y != null))].sort((p, q) => p - q);
    const blind = (p0, p1, q0, q1, alongU) => {
      for (let t = 0; t + 1 < tiers.length; t++) {
        if (split && tiers[t] < split) continue;      // the dark panels stay dark
        if (rand() >= F.blinds[r]) continue;
        const ya = tiers[t] + fw / 2, yb = tiers[t + 1] - fw / 2;
        if (alongU) b.box(p0, p1, ya, yb, VW + 0.03, VW + 0.04, "blind");
        else b.box(UW + 0.03, UW + 0.04, ya, yb, q0, q1, "blind");
      }
    };
    // the mullions, bay by bay (none behind a pier, a door, the louvre or a post), and the panes between them
    for (const [a, bb, start] of bays()) {
      let last = a;
      for (let u = start; u + w <= bb + 1e-6; u += F.mullion.step) {
        if (r === 0 && inAny(u, u + w, [...G.panels, ...G.posts])) continue;
        for (const [, , m0, m1, pv] of spans(r, u, u + w)) b.box(u, u + w, pv === VG ? FOOT - 0.02 : m0, m1, pv + 0.02, pv + d, "frameRed");
        if (u - last > 0.1) blind(last, u, 0, 0, true);
        last = u + w;
      }
      if (bb - last > 0.1) blind(last, bb, 0, 0, true);
    }
    // round the corner, from the corner back to the wrap's end, at the same spacing (estimated)
    let last = ev;
    for (let v = ev - F.mullion.step; v - w >= F.wrapTo; v -= F.mullion.step) {
      b.box(eu + 0.02, eu + d, ev === VG ? FOOT - 0.02 : e0, e1, v - w, v, "frameRed");
      blind(0, 0, v, last, false);
      last = v - w;
    }
  });
  // the ground storey's white door and white-framed louvre toward the north-east end (oWaF's door view),
  // drawn as light panels a little in front of the glass
  // (down past FOOT by 3 cm, below the glass's and the mullions' feet)
  for (const [a, c] of G.panels) b.box(a, c, FOOT - 0.03, G.band - fw, VG + 0.03, VG + 0.06, "paint");
}

// a seeded generator (as the kit's rng), so that the same blinds are drawn every time
let seed = 110;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
