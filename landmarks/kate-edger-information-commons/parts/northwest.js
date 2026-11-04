// The north-west range (parts/common.js, MEASURED.northwest), its higher north-east end and the end that stands
// out over the court beyond it, the raised part on its roof, and its two lower wings. Round 0: flat-topped
// blocks at the LiDAR's heights, plain walls. Round 1: the end over the court (the prow) glazed and open under it,
// its underside sloping up to its south-east side, with its roof light; the glazed canopy under its tip; the
// north-east end's face glazed (the photograph shows glass in frames over the prow and under it).
import { FOOT, MEASURED } from "./common.js";
import { block, panel, prism, prismBetween } from "./shapes.js";

const M = MEASURED;

export function northwest(b) {
  block(b, M.northwest.plan, FOOT, M.northwest.top, "claddingPale", "roofGrey");
  block(b, M.raised.plan, M.northwest.top - 0.3, M.raised.top, "claddingPale", "roofGrey");
}

export function northeast(b) {
  const E = M.northeast;
  block(b, E.plan, FOOT, E.top, "claddingPale", "roofGrey");
  // its north-east face, in two runs, glazed 3 cm before the wall: under the prow green-tinted (the photograph's
  // dark green glass over the canopy), up to 0.1 m into the prow's underside; above that the prow's glass, its top
  // 5 cm under the roof
  const O = M.overhang, S = O.slope, t = 0.15;
  for (const [a, c] of [[E.plan[0], E.plan[1]], [E.plan[1], E.plan[2]]]) {
    const l = Math.hypot(c[0] - a[0], c[1] - a[1]), n = [-(c[1] - a[1]) / l, (c[0] - a[0]) / l];
    panel(b, a, c, n, 0.03, 0.05, FOOT + 0.05, O.under + 0.1, "glassGreen");
    panel(b, a, c, n, 0.03, 0.05, O.under + 0.1, E.top - 0.05, "glassPale");
  }
  // the prow, in two pieces either side of z = slope.z1: south-east of it the underside slopes, beyond it is level.
  // Each piece: its underside 0.15 m thick, glass above it to the roof; one roof over both; the roof light standing
  // from 0.3 m under the roof
  const [tip, back] = [O.plan[0][0], O.plan[7][0]];
  const se = [O.plan[8], O.plan[0], [tip, S.z1], [back, S.z1], O.plan[7]];
  const nw = [[tip, S.z1], ...O.plan.slice(1, 7), [back, S.z1]];
  const under = (x, z) => O.under + (S.y0 - O.under) * (S.z1 - z) / (S.z1 - S.z0);
  prismBetween(b, se, under, (x, z) => under(x, z) + t, "claddingPale");
  prismBetween(b, se, (x, z) => under(x, z) + t, () => O.top - t, "glassPale");
  prism(b, nw, O.under, O.under + t, "claddingPale");
  prism(b, nw, O.under + t, O.top - t, "glassPale");
  prism(b, O.plan, O.top - t, O.top + 0.01, "roofGrey");
  prism(b, O.light.plan, O.top - 0.3, O.light.top, "glassPale");
  // the glazed canopy under its tip
  prism(b, M.canopy.plan, M.canopy.top - t, M.canopy.top, "glassPale");
}

export function wings(b) {
  for (const k of ["corner", "wing"]) block(b, M[k].plan, FOOT, M[k].top, "claddingPale", "roofGrey");
}
