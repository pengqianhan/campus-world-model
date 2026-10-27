// The window slot near the south end of the shaft's south-west face (MGAo's photograph): a narrow
// column of windows, one a storey, each framed in white concrete, the frames' sides running up the
// face from the first floor to the shaft's top. Its place and width are read from the photograph,
// not measured. Round 1 (the lead).
import { MEASURED as M } from "./common.js";
import { edgeBox } from "./shapes.js";

export function slot(b) {
  const plan = M.tower.plan, { edge: i, from: a, to: c } = M.slot, f = M.floor;
  const side = 0.08;
  // the white frame's two sides, standing 0.15 m proud
  edgeBox(b, plan, i, a, a + side, -0.02, 0.15, f, M.shaft.top - 0.35, "paint");
  edgeBox(b, plan, i, c - side, c, -0.02, 0.15, f, M.shaft.top - 0.35, "paint");
  for (let y = f; y < M.shaft.top - 1.0; y += f) {
    // a pane in each storey, set just proud of the brick, with a white sill below it
    edgeBox(b, plan, i, a + side, c - side, 0.0, 0.03, y + 0.45, y + f - 0.35, "glass");
    edgeBox(b, plan, i, a, c, -0.02, 0.15, y - 0.15, y + 0.45, "paint");
  }
}
