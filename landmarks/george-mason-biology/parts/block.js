// Building 106's parts: the long block with its attic and hipped roof, the wider middle with its raised parts, the two
// wings to the south-west, and the low parts round its foot. Sizes from common.js.
import { END, FOOT, LOW, MAIN, MIDDLE, WINGS, at, plan } from "./common.js";
import { block, hipRoof, prism } from "./shapes.js";

// The walls cream render, as the photograph shows the south-east end; the attic grey metal and the roofs grey, as the
// photograph and the 2023 aerial show them.
const WALL = "plain", ATTIC = "roofGrey", ROOF = "roofGrey", GLASS = "glass", FRAME = "frameRed";

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

/** A box on the end wall's face, from `d0` to `d1` in front of it, over [w0, w1] and [y0, y1]. */
function onEnd(b, d0, d1, [w0, w1], [y0, y1], material) {
  const u = END.u;
  prism(b, plan([[u - d1, w0], [u - d0, w0], [u - d0, w1], [u - d1, w1]]), y0, y1, material);
}

/** The south-east end's pilasters and windows: the glass 2 to 4 cm in front of the wall, the frames and the mullions
 * standing 10 and 7 cm out round it, so that no two of their faces lie in one plane. */
export function end(b) {
  for (const w of END.pilasters) {
    const u = END.u, h = END.pw / 2;
    const p = [[u - END.proud, w - h], [u, w - h], [u, w + h], [u - END.proud, w + h]];
    block(b, plan(p), FOOT, MAIN.top, WALL, ROOF);
  }
  const f = 0.08, m = 0.03;
  for (const c of END.bays) {
    const w0 = c - END.ww / 2, w1 = c + END.ww / 2;
    for (const [y0, y1] of END.rows) {
      onEnd(b, 0.02, 0.04, [w0, w1], [y0, y1], GLASS);
      onEnd(b, 0, 0.10, [w0 - f, w1 + f], [y1, y1 + f], FRAME);
      onEnd(b, 0, 0.10, [w0 - f, w1 + f], [y0 - f, y0], FRAME);
      onEnd(b, 0, 0.10, [w0 - f, w0], [y0, y1], FRAME);
      onEnd(b, 0, 0.10, [w1, w1 + f], [y0, y1], FRAME);
      for (let i = 1; i < END.lights; i++) {
        const wm = w0 + (i * END.ww) / END.lights;
        onEnd(b, 0, 0.07, [wm - m, wm + m], [y0, y1], FRAME);
      }
    }
  }
}
