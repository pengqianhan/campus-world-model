// Building 106's parts: the long block with its attic and hipped roof, the wider middle with its raised parts, the two
// wings to the south-west, and the low parts round its foot. Sizes from common.js.
import { FOOT, LOW, MAIN, MIDDLE, WINGS, at, plan } from "./common.js";
import { block, hipRoof, prism } from "./shapes.js";

// The walls cream render, as the photograph shows the south-east end; the attic grey metal and the roofs grey, as the
// photograph and the 2023 aerial show them.
const WALL = "plain", ATTIC = "roofGrey", ROOF = "roofGrey";

/** An attic: grey walls from y0 to its eaves round [u0, u1] x [w0, w1], and its roof hipped back `hip` at each end. */
function attic(b, { u: [u0, u1], w: [w0, w1], eave, ridge, hip }, y0) {
  prism(b, plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]), y0, eave, ATTIC);
  const [x0] = at(u1, 0), [x1] = at(u0, 0);
  hipRoof(b, [x0, x1], [w0, w1], eave, ridge, "x", (w0 + w1) / 2, [hip, hip], ROOF);
}

export function main(b) {
  block(b, plan(MAIN.plan), FOOT, MAIN.top, WALL, ROOF);
  attic(b, MAIN.attic, MAIN.top - 0.2);
}

export function middle(b) {
  block(b, plan(MIDDLE.plan), FOOT, MIDDLE.top, WALL, ROOF);
  attic(b, MIDDLE.attic, MIDDLE.top - 0.2);
  for (const R of MIDDLE.raised) block(b, plan(R.plan), MIDDLE.attic.eave - 0.4, R.top, ATTIC, ROOF);
}

export function wings(b) {
  for (const G of WINGS) {
    block(b, plan(G.plan), FOOT, G.top, WALL, ROOF);
    block(b, plan(G.roof.plan), G.top - 0.2, G.roof.top, ATTIC, ROOF);
  }
}

export function low(b) {
  for (const L of LOW) block(b, plan(L.plan), FOOT, L.top, WALL, ROOF);
}
