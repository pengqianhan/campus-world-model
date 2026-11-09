// Building 907's annex on the hall's south-south-west side: its orange rendered walls up to its roof, which falls
// away from the hall. Sizes from common.js.
import { ANNEX, FOOT, OPENINGS, at, rect } from "./common.js";
import { prism, tris } from "./shapes.js";

const WALL = "renderOrange", ROOF = "roofPale";

/** The roof's height at w. */
const top = (w) => ANNEX.top[0] + (ANNEX.top[1] - ANNEX.top[0]) * (w - ANNEX.w[0]) / (ANNEX.w[1] - ANNEX.w[0]);

/** The walls round the L from FOOT to the roof's plane, and the roof over its two parts. */
export function annex(b) {
  const L = ANNEX.plan;
  const P = (u, w, y) => { const [x, z] = at(u, w); return [x, y, z]; };
  const walls = [];
  for (let i = 0; i < L.length; i++) {
    const [ua, wa] = L[i], [ub, wb] = L[(i + 1) % L.length];
    const a0 = P(ua, wa, FOOT), b0 = P(ub, wb, FOOT), a1 = P(ua, wa, top(wa)), b1 = P(ub, wb, top(wb));
    walls.push([a0, b0, b1], [a0, b1, a1]);
  }
  // each wall faces away from the L's inside: the point 1 m out from its middle, square to it, lies outside the L
  const inside = ([u, w]) => {  // even-odd, over the plan
    let c = false;
    for (let i = 0, j = L.length - 1; i < L.length; j = i++) {
      const [ui, wi] = L[i], [uj, wj] = L[j];
      if ((wi > w) !== (wj > w) && u < ui + (w - wi) * (uj - ui) / (wj - wi)) c = !c;
    }
    return c;
  };
  const out = [];
  for (let i = 0; i < L.length; i++) {
    const [ua, wa] = L[i], [ub, wb] = L[(i + 1) % L.length], mu = (ua + ub) / 2, mw = (wa + wb) / 2;
    const nu = wb - wa, nw = -(ub - ua), len = Math.hypot(nu, nw);
    const o = inside([mu + nu / len * 0.5, mw + nw / len * 0.5]) ? [mu - nu / len, mw - nw / len] : [mu + nu / len, mw + nw / len];
    out.push(at(...o));
  }
  for (let i = 0; i < L.length; i++) tris(b, walls.slice(2 * i, 2 * i + 2), WALL, () => out[i]);
  // the roof in two rectangles, the neck's and the wider part's, split along the wider part's inner edge
  const [n0, n1, n2, n3, n4, n5] = L;
  const roof = [[n5, n0, [n0[0], n3[1]], n4], [n3, [n0[0], n3[1]], n1, n2]].map((q) => q.map(([u, w]) => P(u, w, top(w))));
  tris(b, roof.flatMap((r) => [[r[0], r[1], r[2]], [r[0], r[2], r[3]]]), ROOF, "up");
}

/** The windows and the glazed door on the west-north-west face and the door on the south-south-west face: each a
 * dark frame standing 0.03 m out of the wall and, but for the door, glass 0.01 to 0.06 m out over it, 0.08 m in. */
export function openings(b) {
  const u = ANNEX.u[1], w = ANNEX.w[1];
  for (const o of OPENINGS.annexFace) {
    const y0 = Math.max(o.y[0], FOOT + 0.1);
    prism(b, rect([u, u + 0.03], [o.w[0] - 0.08, o.w[1] + 0.08]), y0, o.y[1] + 0.08, "screenBlack");
    prism(b, rect([u + 0.01, u + 0.06], o.w), y0 + 0.08, o.y[1], "glass");
  }
  const d = OPENINGS.annexDoor;
  prism(b, rect(d.u, [w, w + 0.04]), FOOT + 0.1, d.y[1], "screenBlack");
}
