// 67 Symonds Street's faces where the photograph sees them: the south face's windows and its curved glazed bay, the
// east face's louvred panels and windows. Sizes from common.js, every one estimated through the photograph's camera.
import { FACES } from "./common.js";
import { prism } from "./shapes.js";

const GLASS = "glass", LOUVRE = "claddingPale";

/** A box on the south face (w = FACES.south.w), from d0 to d1 in front of it, over [u0, u1] and [y0, y1]. */
function south(b, d0, d1, [u0, u1], [y0, y1], material) {
  const w = FACES.south.w;
  prism(b, [[-u0, w + d0], [-u1, w + d0], [-u1, w + d1], [-u0, w + d1]], y0, y1, material);
}

/** A box on the east face (u = FACES.east.u), from d0 to d1 in front of it (to the east), over [w0, w1] and [y0, y1]. */
function east(b, d0, d1, [w0, w1], [y0, y1], material) {
  const u = FACES.east.u;
  prism(b, [[-(u - d0), w0], [-(u - d1), w0], [-(u - d1), w1], [-(u - d0), w1]], y0, y1, material);
}

export function faces(b) {
  const S = FACES.south, E = FACES.east;
  for (const head of FACES.heads) {
    const rows = [head - FACES.window, head];
    for (const span of S.windows) south(b, 0.02, 0.04, span, rows, GLASS);
    const k = FACES.heads[0] - head;
    south(b, 0.02, 0.04, S.bay, [S.band[0] - k, S.band[1] - k], GLASS);
    east(b, 0.02, 0.04, E.louvre, rows, LOUVRE);
    for (const span of E.windows) east(b, 0.02, 0.04, span, rows, GLASS);
  }
}
