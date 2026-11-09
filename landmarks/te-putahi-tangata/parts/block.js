// Building 201's parts: the hall with its glazed front under the folded roof, the entrance's canopy, the north-east
// block in pale metal with the raised part on its roof, and the long block behind with its raised parts, core and
// podium. Sizes from common.js.
import { CANOPY, FOOT, HALL, NE, SOUTH, at, plan } from "./common.js";
import { block, prism, tris } from "./shapes.js";

// The faces no photograph shows plain mid grey; the north-east block's pale metal; the roof's plates near black
// underneath, as the photograph shows them, and grey on top, as the 2023 aerial; the canopy pale.
const WALL = "grey", PALE = "claddingPale", SOFFIT = "screenBlack", GLASS = "glass", ROOF = "roofGrey";

/** Walls round a plan [[u, w], ...] from y0 to y1, side i in the materials face(i): [[material, from, to], ...] (heights
 * within y0 to y1), each facing out of the plan. */
function walls(b, corners, y0, y1, face) {
  const n = corners.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [u0, w0] = corners[i], [u1, w1] = corners[(i + 1) % n];
    area += u0 * w1 - u1 * w0;
  }
  const s = Math.sign(area);  // > 0: counter-clockwise in (u, w), the plan on each side's left
  for (let i = 0; i < n; i++) {
    const [u0, w0] = corners[i], [u1, w1] = corners[(i + 1) % n], len = Math.hypot(u1 - u0, w1 - w0);
    const [ox, oz] = at(s * (w1 - w0) / len, -s * (u1 - u0) / len);  // out of the plan
    const [x0, z0] = at(u0, w0), [x1, z1] = at(u1, w1);
    for (const [m, ya, yb] of face(i, y0, y1)) {
      tris(b, [[[x0, ya, z0], [x1, ya, z1], [x1, yb, z1]], [[x0, ya, z0], [x1, yb, z1], [x0, yb, z0]]], m,
        ([x, z]) => [x + ox, z + oz]);
    }
  }
}

const P = (u, y, w) => { const [x, z] = at(u, w); return [x, y, z]; };

/** The hall: walls up to the roof's lowest underside, the glass between that and the folded roof's underside at the
 * front and plain at the ends, and the roof's plates (grey on top, near black under and at their edges). */
export function hall(b) {
  const { plan: pl, front, fold, w: [wb, wf], t, fall } = HALL;
  const low = Math.min(...fold.map(([, y]) => y)) - t - fall;
  const Y = (y, w) => y - fall * (wf - w) / (wf - wb);  // the roof's height at y over the front, falling to the back
  walls(b, pl, FOOT, low, (i, y0, y1) => [[front.includes(i) ? GLASS : WALL, y0, y1]]);
  const wg = pl[2][1], ends = [fold[0], fold[fold.length - 1]];
  const top = [], under = [], edge = [], glass = [];
  for (let i = 0; i + 1 < fold.length; i++) {
    const [u0, y0] = fold[i], [u1, y1] = fold[i + 1];
    top.push([P(u0, Y(y0, wb), wb), P(u1, Y(y1, wb), wb), P(u1, y1, wf)],
      [P(u0, Y(y0, wb), wb), P(u1, y1, wf), P(u0, y0, wf)]);
    under.push([P(u0, Y(y0, wb) - t, wb), P(u1, Y(y1, wb) - t, wb), P(u1, y1 - t, wf)],
      [P(u0, Y(y0, wb) - t, wb), P(u1, y1 - t, wf), P(u0, y0 - t, wf)]);
    for (const w of [wf, wb]) {
      const a = Y(y0, w), c = Y(y1, w);
      edge.push([P(u0, a - t, w), P(u1, c - t, w), P(u1, c, w)], [P(u0, a - t, w), P(u1, c, w), P(u0, a, w)]);
    }
    // the glazed gables under the roof at the front, down to the walls' top
    const a = Y(y0, wg) - t, c = Y(y1, wg) - t;
    glass.push([P(u0, low, wg), P(u1, low, wg), P(u1, c, wg)], [P(u0, low, wg), P(u1, c, wg), P(u0, a, wg)]);
  }
  tris(b, top, ROOF, "up");
  tris(b, under, SOFFIT, "down");
  tris(b, edge, SOFFIT, ([x, z]) => [x, z + (z > (wb + wf) / 2 ? 1 : -1)]);
  tris(b, glass, GLASS, ([x, z]) => [x, z + 1]);
  // each end: its plate's edge, and the wall under it up to the plate
  for (const [u, y] of ends) {
    const out = u < 0 ? -1 : 1;
    const yb = Y(y, wb), yg = Y(y, wg);
    tris(b, [[P(u, yb - t, wb), P(u, y - t, wf), P(u, y, wf)], [P(u, yb - t, wb), P(u, y, wf), P(u, yb, wb)]], SOFFIT,
      ([x, z]) => [x - out, z]);
    tris(b, [[P(u, low, wb), P(u, low, wg), P(u, yg - t, wg)], [P(u, low, wb), P(u, yg - t, wg), P(u, yb - t, wb)]],
      WALL, ([x, z]) => [x - out, z]);
  }
}

export function canopy(b) {
  prism(b, plan(CANOPY.plan), CANOPY.y[0], CANOPY.y[1], PALE);
}

export function northEast(b) {
  const t = 0.15;
  walls(b, NE.plan, FOOT, NE.top - t, (i, y0, y1) => [[NE.pale.includes(i) ? PALE : WALL, y0, y1]]);
  prism(b, plan(NE.plan), NE.top - t, NE.top + 0.01, ROOF);
  block(b, plan(NE.raised.plan), NE.top - 0.3, NE.raised.top, WALL, ROOF);
}

export function south(b) {
  block(b, plan(SOUTH.main.plan), FOOT, SOUTH.main.top, WALL, ROOF);
  for (const R of SOUTH.raised) block(b, plan(R.plan), SOUTH.main.top - 0.3, R.top, WALL, ROOF);
  for (const L of SOUTH.low) block(b, plan(L.plan), FOOT, L.top, WALL, ROOF);
}
