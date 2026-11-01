// The body: four ranges round the courtyard, from FOOT to the gutter behind the parapets, and the
// parapets' broad tops. Drawn in the building's own axes (u, v: parts/common.js); model.js turns it.
import { FOOT, MEASURED, FACADE } from "./common.js";

const M = MEASURED;

/** The four ranges, as boxes from FOOT to the gutter (the courtyard left open). The range to the road
 * stops at its windows' plane, FACADE.recess behind the bands (parts/front.js draws the face), and so
 * does its north-east end from the corner to 110N's link (FACADE.wrapTo). */
export function body(b) {
  const { outer: o, court: c, parapet: p } = M;
  const y0 = FOOT, y1 = p.gutter, vw = o.v[1] - FACADE.recess, uw = o.u[1] - FACADE.recess;
  b.box(o.u[0], o.u[1], y0, y1, o.v[0], c.v[0], "grey");          // the back range (north-west)
  b.box(o.u[0], uw, y0, y1, c.v[1], vw, "grey");                  // the range to the road (south-east)
  b.box(uw, o.u[1], y0, y1, c.v[1], FACADE.wrapTo, "grey");       // its north-east end behind the link
  b.box(o.u[0], c.u[0], y0, y1, c.v[0], c.v[1], "grey");          // the south-west range
  b.box(c.u[1], o.u[1], y0, y1, c.v[0], c.v[1], "grey");          // the north-east range
}

/** The parapets: from the gutter to their tops, along the outer faces and round the courtyard. */
export function parapets(b) {
  const { outer: o, court: c, parapet: p } = M;
  const y0 = p.gutter - 0.01, y1 = p.top, w = p.outer, n = p.inner;
  b.box(o.u[0], o.u[1], y0, y1, o.v[1] - w.se, o.v[1], "grey");
  b.box(o.u[0], o.u[1], y0, y1, o.v[0], o.v[0] + w.nw, "grey");
  b.box(o.u[0], o.u[0] + w.sw, y0, y1, o.v[0], o.v[1], "grey");
  b.box(o.u[1] - w.ne, o.u[1], y0, y1, o.v[0], o.v[1], "grey");
  b.box(c.u[0] - n.sw, c.u[1] + n.ne, y0, y1, c.v[1], c.v[1] + n.se, "grey");
  b.box(c.u[0] - n.sw, c.u[1] + n.ne, y0, y1, c.v[0] - n.nw, c.v[0], "grey");
  b.box(c.u[0] - n.sw, c.u[0], y0, y1, c.v[0], c.v[1], "grey");
  b.box(c.u[1], c.u[1] + n.ne, y0, y1, c.v[0], c.v[1], "grey");
}
