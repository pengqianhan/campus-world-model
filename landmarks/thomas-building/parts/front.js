// The face to the road (south-east, v = outer.v[1]) and its wrap round the east corner to 110N's link,
// from FACADE (parts/common.js: each size with its source): four concrete bands, flush with the face;
// between them the windows, set back by the recess, in red steel frames; piers from the plinth to the top
// band, flush with the bands; a plain end at the south-west. Drawn in the building's own axes (u, v);
// model.js turns it. body.js stops the range to the road at the windows' plane.
import { FOOT, MEASURED, FACADE } from "./common.js";

const M = MEASURED, F = FACADE;
const U0 = M.outer.u[0], U1 = M.outer.u[1], V1 = M.outer.v[1];
export const VW = V1 - F.recess;   // the windows' plane on the face to the road
export const UW = U1 - F.recess;   // and on the north-east end, round the east corner

/** The bays between the piers (and the plain end, and the corner), [u0, u1, first mullion]. */
function bays() {
  const edges = [[U0, U0 + F.pierWidth], ...F.piers.map((p) => [p, p + F.pierWidth])];
  const out = [];
  for (let i = 0; i < edges.length; i++) {
    const a = edges[i][1], b = i + 1 < edges.length ? edges[i + 1][0] : UW;
    const start = F.mullion.starts[edges[i][0]] ?? a + F.mullion.width;
    out.push([a, b, start]);
  }
  return out;
}

export function front(b) {
  seed = 110;
  const top = F.bands[F.bands.length - 1][0];
  // the bands and the plinth, along the face and round the corner as far as the link
  for (const [y0, y1] of [[FOOT, F.plinth], ...F.bands]) {
    b.box(U0, U1, y0, y1, VW, V1, "grey");
    b.box(UW, U1, y0, y1, F.wrapTo, VW, "grey");
  }
  // the plain end at the south-west and the piers, from the plinth to the top band
  b.box(U0, U0 + F.pierWidth, F.plinth, top, VW, V1, "grey");
  for (const p of F.piers) b.box(p, p + F.pierWidth, F.plinth, top, VW, V1, "grey");

  const d = F.frameDepth, w = F.mullion.width, fw = 0.07;
  F.rows.forEach(([y0, y1], r) => {
    const split = F.dark.row === r ? F.dark.top : null;
    // the glass, a skin over the range's wall at the windows' plane; the dark panes are glass with no blind
    // (the kit's dark glass reads 21 in the upper view against the photograph's 59, the pale glass about 70)
    b.box(U0 + F.pierWidth, UW + 0.03, y0, y1, VW, VW + 0.03, "glassPale");
    b.box(UW, UW + 0.03, y0, y1, F.wrapTo, VW + 0.03, "glassPale");
    // the frames' horizontals: sill, head, transoms
    const hs = [y0, y1 - fw, F.transoms[r], F.transoms2[r]].filter((y) => y != null);
    for (const y of hs) {
      b.box(U0 + F.pierWidth, UW + d, y, y + fw, VW, VW + d, "roofTile");
      b.box(UW, UW + d, y, y + fw, F.wrapTo, VW + d, "roofTile");
    }
    // the panes' tiers between sill, transoms and head; in each pane a blind down (light) or up (the
    // glass), by a seeded draw at the row's share of light panes (FACADE.blinds)
    const tiers = [...new Set([y0, split, F.transoms[r], F.transoms2[r], y1].filter((y) => y != null))].sort((p, q) => p - q);
    const blind = (p0, p1, q0, q1, alongU) => {
      for (let t = 0; t + 1 < tiers.length; t++) {
        if (split && tiers[t] < split) continue;      // the dark panels stay dark
        if (rand() >= F.blinds[r]) continue;
        const ya = tiers[t] + fw / 2, yb = tiers[t + 1] - fw / 2;
        if (alongU) b.box(p0, p1, ya, yb, VW + 0.03, VW + 0.04, "paint");
        else b.box(UW + 0.03, UW + 0.04, ya, yb, q0, q1, "paint");
      }
    };
    // the mullions, bay by bay (none behind a pier), and the panes between them
    for (const [a, bb, start] of bays()) {
      let last = a;
      for (let u = start; u + w <= bb + 1e-6; u += F.mullion.step) {
        b.box(u, u + w, y0, y1, VW, VW + d, "roofTile");
        if (u - last > 0.1) blind(last, u, 0, 0, true);
        last = u + w;
      }
      if (bb - last > 0.1) blind(last, bb, 0, 0, true);
    }
    // round the corner, from the corner back to the link, at the same spacing (estimated)
    let last = VW;
    for (let v = VW - F.mullion.step; v - w >= F.wrapTo; v -= F.mullion.step) {
      b.box(UW, UW + d, y0, y1, v - w, v, "roofTile");
      blind(0, 0, v, last, false);
      last = v - w;
    }
  });
}

// a seeded generator (as the kit's rng), so that the same blinds are drawn every time
let seed = 110;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
