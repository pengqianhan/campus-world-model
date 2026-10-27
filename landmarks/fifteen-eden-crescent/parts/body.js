// The building's two storeys (parts/common.js MEASURED.body), as MH15's photograph shows its face to
// Eden Crescent: white panelled walls on a base of dark brown tiles with a cream band over it, its
// windows set deep in square openings, their frames red; a flat roof. The windows are on the street
// face only, every 3.3 m (counted in the photograph, not measured); the faces no photograph shows
// are plain. Round 0 (the lead).
import { MEASURED as M, FOOT } from "./common.js";
import { prism, roof, edgeBox } from "./shapes.js";

/** The plan's edge along Eden Crescent: from [18.9, 11.6] to [-19.3, 12.3]. */
const STREET = 1;

export function body(b) {
  prism(b, M.body.plan, FOOT, M.body.top, "paint");
  roof(b, M.body.plan, M.body.top + 0.02, 0.3, "roofGrey");
  // the base: dark tiles to 1.2 m and a cream band over them, on every face
  for (let i = 0; i < M.body.plan.length; i++) {
    edgeBox(b, M.body.plan, i, -0.01, 1.01, 0.0, 0.04, FOOT, 1.2, "brick");
    edgeBox(b, M.body.plan, i, -0.01, 1.01, 0.0, 0.05, 1.2, 1.5, "render");
  }
}

/** The windows of the street face: two rows, each pane on the wall's face in a red frame standing 0.08 m
 * out (round 0: the openings are not yet cut into the wall). */
export function windows(b) {
  const plan = M.body.plan;
  const [x0, z0] = plan[STREET], [x1, z1] = plan[STREET + 1];
  const L = Math.hypot(x1 - x0, z1 - z0);
  for (let s = 1.6; s < L - 1.0; s += 3.3) {
    const a = s / L, c = (s + 1.4) / L;
    for (const [y0, y1] of [[1.7, 3.2], [M.floor + 0.9, M.floor + 2.4]]) {
      edgeBox(b, plan, STREET, a, c, 0.0, 0.02, y0, y1, "glass");
      edgeBox(b, plan, STREET, a - 0.04 / L, a + 0.06 / L, -0.02, 0.08, y0, y1, "roofTile");
      edgeBox(b, plan, STREET, c - 0.06 / L, c + 0.04 / L, -0.02, 0.08, y0, y1, "roofTile");
      edgeBox(b, plan, STREET, a, c, -0.02, 0.1, y0 - 0.12, y0, "roofTile");
    }
  }
}
