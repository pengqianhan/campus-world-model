// The main block's walls (parts/common.js MEASURED.plan), as oWaF's and MOQA's photographs show its face
// to the road: on the curve a glass curtain wall over a white rendered base, a dark beam under the glass;
// the flat south-east face beside it board-marked concrete (a University banner hangs on it in the
// photographs: not drawn); a dark fascia under the roof's edge all round. The faces no photograph shows
// (the north end, the diagonal north-west face, the north-west wall, the south-west walls by the link)
// are plain render. Round 0 (the lead): the massing, the curtain wall's foot estimated.
import { MEASURED as M, FOOT } from "./common.js";
import { walls, prism, edgeBox } from "./shapes.js";

export function body(b) {
  const plan = M.plan, last = plan.length - 1;
  const [se0, se1] = M.faces.se, [c0, c1] = M.faces.curve;
  // the south-east face: concrete from the foot to the eave
  walls(b, plan, se0, se1, FOOT, M.eave, "grey");
  // the curve: the base, then the glass to the eave
  walls(b, plan, c0, c1, FOOT, M.glassFoot, "paint");
  walls(b, plan, c0, c1, M.glassFoot, M.eave, "glassPale");
  // every other face: plain render
  walls(b, plan, c1 + 1, last, FOOT, M.eave, "paint");
  // the fascia and the soffit: the roof's plan from the eave to the roof's edge
  prism(b, M.roofPlan, M.eave, M.roof.edge, "iron");
}

/** The dark beam under the curtain wall, along the curve: 0.35 m deep, standing 0.3 m out (estimated). */
export function beam(b) {
  const [c0, c1] = M.faces.curve;
  for (let i = c0; i <= c1; i++) edgeBox(b, M.plan, i, 0, 1, -0.05, 0.3, M.glassFoot - 0.35, M.glassFoot, "iron");
}
