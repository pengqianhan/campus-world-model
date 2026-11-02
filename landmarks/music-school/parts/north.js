// The north wing (a flat roof round the courtyard), the stepped parapet over its face to the car park and the
// curved canopy along that face (parts/common.js, MEASURED.north, .parapet, .canopy).
import { FOOT, MEASURED } from "./common.js";
import { prism, roof, along } from "./shapes.js";

const M = MEASURED;

export function north(b) {
  prism(b, M.north.plan, FOOT, M.north.top - 0.12, "paint"); // to the roof slab's underside
  roof(b, M.north.plan, M.north.top, 0.12, "roofGrey");
}

/** The parapet: one box a step, from just under the roof to the step's top, its face 2 cm proud of the wall's
 * so that it covers the roof's edge behind it. */
export function parapet(b) {
  const p = M.parapet, s = p.steps;
  for (let i = 0; i < s.length; i++) {
    const x0 = s[i][0], x1 = i + 1 < s.length ? s[i + 1][0] : p.x[1];
    // each step overlaps the next by 1 cm; the first and last stand 1 cm past the wing's ends, so that no face
    // of theirs lies in the plane of the roof's or the walls' ends
    b.box(x0 - (i ? 0 : 0.01), x1 + 0.01, M.north.top - 0.2, s[i][1], p.z[0], p.z[1] + 0.02, "paint");
  }
}

/** The canopy: its curved sheet, the section drawn along x. */
export function canopy(b) {
  const c = M.canopy, top = c.section, t = c.thick;
  const section = [...top, ...top.slice().reverse().map(([z, y]) => [z, y - t])];
  along(b, section, c.x[0] - 0.01, c.x[1], "roofPale"); // its west end 1 cm past the wall's end
}
