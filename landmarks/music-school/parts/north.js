// The north wing (a flat roof round the courtyard), the stepped parapet over its face to the car park and the
// curved canopy along that face (parts/common.js, MEASURED.north, .parapet, .canopy).
import { FOOT, MEASURED } from "./common.js";
import { prism, roof, along } from "./shapes.js";

const M = MEASURED;

export function north(b) {
  prism(b, M.north.plan, FOOT, M.north.top - 0.1, "render");
  roof(b, M.north.plan, M.north.top, 0.12, "roofGrey");
}

/** The parapet: one box a step, from just under the roof to the step's top. */
export function parapet(b) {
  const p = M.parapet, s = p.steps;
  for (let i = 0; i < s.length; i++) {
    const x0 = s[i][0], x1 = i + 1 < s.length ? s[i + 1][0] : p.x[1];
    b.box(x0, x1 + (i + 1 < s.length ? 0.01 : 0), M.north.top - 0.2, s[i][1], p.z[0], p.z[1], "render");
  }
}

/** The canopy: its curved sheet, the section drawn along x. */
export function canopy(b) {
  const c = M.canopy, top = c.section, t = c.thick;
  const section = [...top, ...top.slice().reverse().map(([z, y]) => [z, y - t])];
  along(b, section, c.x[0], c.x[1], "roofPale");
}
