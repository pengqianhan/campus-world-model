// The main block's walls (parts/common.js MEASURED.plan), as oWaF's and MOQA's photographs show its face
// to the road: on the curve a glass curtain wall of three storeys over a white rendered base, a dark
// beam under the glass (round 2: as far round the curve as the photographs show it, 25.1 m); the flat south-east face beside it board-marked concrete (a University banner
// hangs on it in the photographs: not drawn); a dark fascia under the roof's edge all round. The faces
// no photograph shows (the north end, the diagonal north-west face, the north-west wall, the south-west
// walls by the link) are plain render. Round 0 (the lead): the massing, the curtain wall's foot
// estimated. Round 1 (the lead): the curtain wall's storeys, heads, transoms and fins, the beam, the
// service doors and three windows of the base, each measured through the fixed cameras onto the wall
// (common.js says where each came from); what is estimated says so. Round 2: the concrete and the base by
// their brightness in each photograph (BASE below), and the curve plain where no photograph shows it.
import { MEASURED as M, FOOT } from "./common.js";
import { walls, prism, path, pathBox } from "./shapes.js";

/** The materials of the base's openings: dark glass, light grey louvres, a pier of the base's render. */
const OPEN = { dark: "glass", louvre: "grey", pier: "renderGrey" };

/**
 * The base's white render and the south-east face's board-marked concrete, by their brightness in the
 * photographs at the config's exposure 1.2 (round 2: each part's luma read where the fixed cameras put
 * it). The concrete reads 123 in MOQA's wide view and 126-133 in oWaF's: the kit's `grey`, drawn at
 * 132 (round 1 drew it in the cream `render`, at 165). The base's render, the same patch of wall (beside
 * the doors, 0.8-3.2 m up): 133-134 in MOQA's views and 158-159 in oWaF's, though both cameras face it
 * within 25 deg of square and the concrete beside it reads alike in both; so the panoramas disagree, and
 * the base is drawn between them in the kit's `renderGrey`, at about 141 (round 1's `grey`: 132).
 */
const BASE = "renderGrey", CONCRETE = "grey";

/** The light aluminium head strip over each storey's panes: 133-174 in oWaF's wide view (round 2), between
 * the kit's `grey` and its white `paint` (218, round 1's): drawn in `renderGrey`. */
const HEAD = "renderGrey";

export function body(b) {
  const plan = M.plan, last = plan.length - 1;
  const [se0, se1] = M.faces.se, [c0] = M.faces.curve, [, v1] = M.faces.seen;
  // the south-east face: render under the curtain wall's foot, concrete above it to the eave
  walls(b, plan, se0, se1, FOOT, M.curtain.beam[1], BASE);
  walls(b, plan, se0, se1, M.curtain.beam[1], M.eave, CONCRETE);
  // the curve as far as the photographs show it: the base, then the glass to the eave (its heads and
  // transoms stand on it: curtain)
  walls(b, plan, c0, v1, FOOT, M.curtain.beam[0], BASE);
  walls(b, plan, c0, v1, M.curtain.beam[0], M.eave, "glassPale");
  // the rest of the curve and every other face: no photograph shows them, plain render
  walls(b, plan, v1 + 1, last, FOOT, M.eave, BASE);
  // the fascia and the soffit: the roof's plan from the eave to the roof's edge
  prism(b, M.roofPlan, M.eave, M.roof.edge, "iron");
}

/** The curtain wall's parts on the glass: the beam under it, each storey's head strip and transom, the fins. */
export function curtain(b) {
  const C = M.curtain, [c0, c1] = M.faces.seen, p = path(M.plan, c0, c1);
  // the beam: its depth measured, how far it stands out estimated (0.3 m)
  pathBox(b, M.plan, p, 0, p.length, -0.05, 0.3, C.beam[0], C.beam[1], "iron");
  for (const [y0, y1] of C.heads) pathBox(b, M.plan, p, 0, p.length, -0.05, 0.08, y0, y1, HEAD);
  for (const [y0, y1] of C.transoms) pathBox(b, M.plan, p, 0, p.length, -0.05, 0.12, y0, y1, "iron");
  // the fins between the panes, from the beam to the eave: slim, of green glass (their depth estimated)
  for (let s = C.fins.from; s < p.length; s += C.fins.step) pathBox(b, M.plan, p, s - 0.03, s + 0.03, -0.05, 0.2, C.beam[1], M.eave, "glass");
}

/** The base's openings: the service doors and side lights, three small windows. */
export function openings(b) {
  const D = M.doors, [se0] = M.faces.se, [c0, c1] = M.faces.curve;
  const face = path(M.plan, se0, se0), curve = path(M.plan, c0, c1);
  for (const [a, c, kind] of D.face) pathBox(b, M.plan, face, face.length - a, face.length - c, -0.05, 0.04, D.y[0], D.y[1], OPEN[kind]);
  for (const [a, c, kind] of D.curve) pathBox(b, M.plan, curve, a, c, -0.05, 0.04, D.y[0], D.y[1], OPEN[kind]);
  for (const [a, c] of M.windows.at) pathBox(b, M.plan, curve, a, c, -0.05, 0.03, M.windows.y[0], M.windows.y[1], "glass");
}
