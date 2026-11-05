// The atrium between the two ranges (parts/common.js, MEASURED.atrium): its glazed roof from range to range, open
// at its north-east end, and its floor; the raised part over it (MEASURED.bridge); south-west of the glass, the
// roof between the ranges at 7.7 m (MEASURED.link); and the low roof between them beyond (MEASURED.low).
import { FOOT, MEASURED } from "./common.js";
import { prism, block } from "./shapes.js";

const M = MEASURED;

export function atrium(b) {
  const a = M.atrium;
  prism(b, a.plan, a.top - 0.2, a.top, "glassPale");
  prism(b, a.floor.plan, a.floor.top - 0.3, a.floor.top, "claddingPale");
  block(b, M.bridge.plan, a.top - 0.3, M.bridge.top, "claddingPale", "roofGrey");
}

export function low(b) {
  block(b, M.link.plan, FOOT, M.link.top, "claddingPale", "roofGrey");
  block(b, M.low.plan, FOOT, M.low.top, "claddingPale", "roofGrey");
}
