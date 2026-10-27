// The window slot in the corner between the shaft's two south-west faces (MGAo's photograph; parts/common.js
// MEASURED.slot): a narrow column of windows, one a storey, framed in white concrete, the frames' sides running
// up the corner from the first floor to the shaft's top. Round 1 (the lead) put it on one face, read from the
// photograph through the recorded camera; round 2 puts it in the corner the LiDAR's wall lines meet at, at
// the widths the photograph gives through the fitted camera. Its recess (the LiDAR's wall returns stop 0.33
// and 0.52 m short of the corner) is not cut: the panes stand just proud of the brick.
import { MEASURED as M } from "./common.js";
import { edgeBox } from "./shapes.js";

export function slot(b) {
  const plan = M.tower.plan, f = M.floor, { corner: k, onB, onC, frameB, frameC } = M.slot;
  const n = plan.length, iB = (k - 1 + n) % n, iC = k;  // the face ending at the corner, the face starting there
  const len = (i) => { const [x0, z0] = plan[i], [x1, z1] = plan[(i + 1) % n]; return Math.hypot(x1 - x0, z1 - z0); };
  const LB = len(iB), LC = len(iC);
  const bA = 1 - onB / LB, bF = 1 - (onB - frameB) / LB;  // on the face ending at the corner: the frame, then the glass
  const cF = (onC - frameC) / LC, cA = onC / LC;          // on the face starting there: the glass, then the frame
  const top = M.shaft.top - 0.35;
  // the white frame's two sides, standing 0.15 m proud
  edgeBox(b, plan, iB, bA, bF, -0.02, 0.15, f, top, "paint");
  edgeBox(b, plan, iC, cF, cA, -0.02, 0.15, f, top, "paint");
  for (let y = f; y < M.shaft.top - 1.0; y += f) {
    // a pane in each storey on both sides of the corner, set just proud of the brick, with a white sill below it
    edgeBox(b, plan, iB, bF, 1.02, 0.0, 0.03, y + 0.45, y + f - 0.35, "glass");
    edgeBox(b, plan, iC, -0.02, cF, 0.0, 0.03, y + 0.45, y + f - 0.35, "glass");
    edgeBox(b, plan, iB, bA, 1.02, -0.02, 0.15, y - 0.15, y + 0.45, "paint");
    edgeBox(b, plan, iC, -0.02, cA, -0.02, 0.15, y - 0.15, y + 0.45, "paint");
  }
}
