// The window slot in the corner between the shaft's two south-west faces (MGAo's photograph; parts/common.js
// MEASURED.slot): a narrow column of windows, one a storey, framed in white concrete, the frames' sides running
// up the corner from the first floor to the shaft's top. Round 1 (the lead) put it on one face, read from the
// photograph through the recorded camera; round 2 put it in the corner the LiDAR's wall lines meet at, at the
// widths the photograph gives through the fitted camera. Round 3 cuts it into the corner as the LiDAR's wall
// returns show it (MEASURED.slot.recess): the brick stops at the recess's edges, its panes stand on the
// recess's back walls, and a white sill fills the recess at each floor.
import { MEASURED as M, FOOT } from "./common.js";
import { edgeBox, outward, prism } from "./shapes.js";

/** The plan with its corner k cut back into a recess (MEASURED.slot.recess): the corner becomes five points,
 * the recess's edge on the face ending at k, the back walls' three corners, and its edge on the face starting
 * at k. Returns the new plan and the indices of the recess's four edges in it. */
export function notched(plan, k) {
  const { onB, onC, depth } = M.slot.recess, n = plan.length;
  const K = plan[k], A = plan[(k - 1 + n) % n], C = plan[(k + 1) % n];
  const unit = (p) => {
    const L = Math.hypot(p[0] - K[0], p[1] - K[1]);
    return [(p[0] - K[0]) / L, (p[1] - K[1]) / L];
  };
  const uB = unit(A), uC = unit(C), nB = outward(plan, (k - 1 + n) % n), nC = outward(plan, k);
  const PB = [K[0] + uB[0] * onB, K[1] + uB[1] * onB], PC = [K[0] + uC[0] * onC, K[1] + uC[1] * onC];
  const QB = [PB[0] - nB[0] * depth, PB[1] - nB[1] * depth], QC = [PC[0] - nC[0] * depth, PC[1] - nC[1] * depth];
  // the back corner: where the line through QB along face B meets the line through QC along face C
  const den = uB[0] * uC[1] - uB[1] * uC[0];
  const t = ((QC[0] - QB[0]) * uC[1] - (QC[1] - QB[1]) * uC[0]) / den;
  const Q = [QB[0] + uB[0] * t, QB[1] + uB[1] * t];
  return { plan: [...plan.slice(0, k), PB, QB, Q, QC, PC, ...plan.slice(k + 1)], notch: [k, k + 1, k + 2, k + 3] };
}

export function slot(b) {
  const f = M.floor, { corner: k, onB, onC, recess: R } = M.slot;
  const { plan } = notched(M.tower.plan, k);
  const len = (i) => {
    const [x0, z0] = plan[i], [x1, z1] = plan[(i + 1) % plan.length];
    return Math.hypot(x1 - x0, z1 - z0);
  };
  const iB = k - 1, iC = k + 4;  // the faces' rest: the face ending at the recess, the face starting from it
  const top = M.shaft.top - 0.35;
  // below the first floor the corner is brick
  prism(b, plan.slice(k, k + 5), FOOT, f - 0.15, "brickTan");
  // the white frames beside the recess, 0.1 m proud: from its edges to the frames' outer edges in the photograph
  edgeBox(b, plan, iB, 1 - (onB - R.onB) / len(iB), 1, -0.02, 0.1, f, top, "paint");
  edgeBox(b, plan, iC, 0, (onC - R.onC) / len(iC), -0.02, 0.1, f, top, "paint");
  for (let y = f; y < M.shaft.top - 1.0; y += f) {
    // a pane in each storey on the recess's two back walls, and a white sill filling the recess below it
    edgeBox(b, plan, k + 1, -0.02, 1.02, 0.0, 0.03, y + 0.45, Math.min(y + f - 0.35, top), "glass");
    edgeBox(b, plan, k + 2, -0.02, 1.02, 0.0, 0.03, y + 0.45, Math.min(y + f - 0.35, top), "glass");
    prism(b, plan.slice(k, k + 5), y - 0.15, y + 0.45, "paint");
  }
}
