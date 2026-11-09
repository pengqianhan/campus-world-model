// The M&HS Building's long block: its roofs' four parts and the dark band round its south-east corner (`body`); its
// north face, with the white end walls, the fins and louvres over the set-back glazing, the parapet, the first floor's
// slab edge, the columns and the ground floor's glass, and the east face's glass (`north`); the atrium at its west
// end, the link north of it and the low strip west of the atrium (`west`). Sizes from common.js.
import {
  ATRIUM, BACK, BAND, BAYS, COLUMNS, EAST_GLASS, END_BAY, FIN, FOOT, FRONT, GLAZING, LINK, LOUVRES, MIDDLE, NORTH_W, SOFFIT,
  SOUTH_W, STOREY_GLASS, TOP_E, TOP_N, TOP_S, WEST, WEST_U, at, eastU, plan, rect,
} from "./common.js";
import { block, inset, prism, tris } from "./shapes.js";

const WALL = "claddingPale", ROOF = "roofGrey", GLASS = "glass", FIN_M = "screenSilver", DARK = "screenGrey";
const SLAB = 3.9;  // the first floor's slab under the north face's upper storeys, from 3.9 m to the soffit (estimated)

/** The band's inner line (from its south-face end to its east-face end) and where it crosses w. */
const INNER = inset(BAND.line.slice().reverse(), BAND.depth);
function crossing(line, w) {
  for (let i = 0; i + 1 < line.length; i++) {
    const [p, q] = [line[i], line[i + 1]];
    if ((p[1] - w) * (q[1] - w) <= 0 && p[1] !== q[1]) {
      const t = (w - p[1]) / (q[1] - p[1]);
      return { i, at: [p[0] + t * (q[0] - p[0]), w] };
    }
  }
  throw new Error(`the band's inner line does not cross w ${w}`);
}

/** The roof's four parts, each from FOOT to its own roof, and the dark band. */
export function body(b) {
  const x = crossing(INNER, -10.2), e1 = BAND.line[0];
  block(b, plan(MIDDLE.plan), FOOT, MIDDLE.top, WALL, ROOF);
  // the north strip behind the north face's upper storeys (w to 5.4) and, west of the end bay, to the north face
  const n5 = eastU(BACK);
  block(b, plan([[-14.5, 1.0], [56.4, 1.0], [n5, BACK], [FRONT.u[0], BACK], [FRONT.u[0], NORTH_W], [-14.5, NORTH_W]]),
    FOOT, TOP_N, WALL, ROOF);
  block(b, plan([[37.5, -10.2], x.at, ...INNER.slice(x.i + 1), e1, [56.4, 1.0], [37.5, 1.0]]), FOOT, TOP_E, WALL, ROOF);
  block(b, plan([[WEST_U, SOUTH_W], BAND.line[BAND.line.length - 1], ...INNER.slice(0, x.i + 1), x.at, [WEST_U, -10.2]]),
    FOOT, TOP_S, WALL, ROOF);
  block(b, plan([...BAND.line, ...INNER]), FOOT, BAND.top, DARK, ROOF);
}

/** The north face and the east face's glass. */
export function north(b) {
  const [u0, u1] = [BAYS.u0, BAYS.u1], ne = eastU(BACK);
  // the first floor's slab edge along the whole face, and the white walls over it at each end
  block(b, plan([[END_BAY.u[0], BACK], [ne, BACK], [eastU(NORTH_W), NORTH_W], [END_BAY.u[0], NORTH_W]]), SLAB, SOFFIT, WALL, WALL, 0.01);
  block(b, plan([[u1, BACK], [ne, BACK], [eastU(NORTH_W), NORTH_W], [u1, NORTH_W]]), SOFFIT, TOP_N, WALL, ROOF);
  block(b, rect(END_BAY.u, [BACK, END_BAY.face]), SOFFIT, END_BAY.top, WALL, ROOF);
  // between them: the glazing set back to w 6.9, the parapet over the bays, the fins, the louvres and their frame
  block(b, rect([u0, u1], [BACK, GLAZING]), SOFFIT, BAYS.top, WALL, WALL, 0.01);
  block(b, rect([u0, u1], [BACK, NORTH_W]), BAYS.top, TOP_N, WALL, ROOF);
  for (const [y0, y1] of STOREY_GLASS) prism(b, rect([u0, u1], [GLAZING, GLAZING + 0.02]), y0, y1, GLASS);
  const step = (u1 - u0) / BAYS.n;
  for (let k = 0; k <= BAYS.n; k++) {
    const u = u0 + k * step;
    // from just over the soffit, so that the end fins' feet, which run into the white walls, do not lie in theirs
    prism(b, rect([u - FIN.half, u + FIN.half], FIN.w), SOFFIT + 0.02, BAYS.top, FIN_M);
  }
  for (let k = 0; k < LOUVRES.n; k++) {
    const y = LOUVRES.first + k * LOUVRES.step;
    prism(b, rect([u0, u1], LOUVRES.w), y, y + LOUVRES.t, FIN_M);
  }
  prism(b, rect([u0, u1], FIN.w), BAYS.top - BAYS.frame, BAYS.top, FIN_M);
  // the end bay's windows, proud of its wall, each in a dark frame standing out as a hood
  const W = END_BAY.windows, f = 0.12, F = END_BAY.face, out = [F, F + W.depth];
  for (const [y0, y1] of W.rows) {
    prism(b, rect(W.u, [F + 0.02, F + 0.04]), y0, y1, GLASS);
    for (const [u, a, c] of [[W.u, y1, y1 + f], [W.u, y0 - f, y0], [[W.u[0] - f, W.u[0]], y0 - f, y1 + f], [[W.u[1], W.u[1] + f], y0 - f, y1 + f]])
      prism(b, rect(u, out), a, c, DARK);
  }
  const sh = END_BAY.shade;
  prism(b, rect(sh.u, [sh.w[0] + 0.01, sh.w[1]]), sh.y[0], sh.y[1], DARK);
  // the glazed front west of the end bay, under its grey band
  prism(b, rect(FRONT.u, [BACK, FRONT.face]), FOOT, FRONT.band, GLASS);
  block(b, rect(FRONT.u, [BACK, FRONT.face]), FRONT.band, FRONT.top, DARK, ROOF);
  // the ground floor's glass on the set-back wall, and the columns before it
  prism(b, rect([END_BAY.u[0], ne], [BACK, BACK + 0.02]), 0, SLAB, GLASS);
  for (const u of COLUMNS.u) {
    const ring = [];
    for (let i = 0; i < 8; i++) {
      const t = (i + 0.5) * Math.PI / 4;
      ring.push([u + COLUMNS.r * Math.cos(t), COLUMNS.w + COLUMNS.r * Math.sin(t)]);
    }
    prism(b, plan(ring).reverse(), FOOT, SLAB, WALL);
  }
  // the east face's glass, from the north-east corner to w -4.3, standing 0.02 m out of the face
  const face = [[eastU(EAST_GLASS.w[0]), EAST_GLASS.w[0]], [56.4, 1.0], [eastU(NORTH_W), NORTH_W]];
  prism(b, plan([...inset(face, -0.04), ...inset(face, -0.02).reverse()]), EAST_GLASS.y[0], EAST_GLASS.y[1], GLASS);
}

/** The atrium (its glass roof one slope from its south side up to its north side), the link north of the block's west
 * part (glass under a grey band) and the low strip west of the atrium. */
export function west(b) {
  const A = ATRIUM, [u0, u1] = A.u, [w0, w1] = A.w;
  prism(b, rect(A.u, A.w), FOOT, A.low, WALL);
  const p = (u, w, y) => { const [x, z] = at(u, w); return [x, y, z]; };
  tris(b, [[p(u0, w0, A.low), p(u1, w0, A.low), p(u1, w1, A.high)], [p(u0, w0, A.low), p(u1, w1, A.high), p(u0, w1, A.high)]], GLASS);
  const [cx, cz] = at((u0 + u1) / 2, (w0 + w1) / 2), away = (m) => [2 * m[0] - cx, 2 * m[1] - cz];
  tris(b, [[p(u0, w0, A.low), p(u0, w1, A.low), p(u0, w1, A.high)], [p(u1, w0, A.low), p(u1, w1, A.high), p(u1, w1, A.low)],
    [p(u0, w1, A.low), p(u1, w1, A.low), p(u1, w1, A.high)], [p(u0, w1, A.low), p(u1, w1, A.high), p(u0, w1, A.high)]], WALL, away);
  prism(b, plan(LINK.plan), FOOT, LINK.top - 1.5, GLASS);
  block(b, plan(LINK.plan), LINK.top - 1.5, LINK.top, DARK, ROOF);
  block(b, rect(WEST.u, WEST.w), FOOT, WEST.top, WALL, ROOF);
}
