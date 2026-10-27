// The lower part's west faces, to the left of the shaft in MGAo's photograph (parts/common.js
// MEASURED.wing): at every floor a white concrete balcony slab standing out from a pale wall, and
// between the slabs dark red-brown louvres along the balconies' outer edge, their lower half open.
// Their depth (1.0 m) and the louvres' share of a storey are read from the photograph, not measured.
// Round 1 (the lead).
import { MEASURED as M } from "./common.js";
import { edgeBox } from "./shapes.js";

export function wing(b) {
  const plan = M.tower.plan, f = M.floor, deep = 1.0;
  for (const i of M.wing.edges) {
    // the pale wall behind the balconies, a skin over the brick
    edgeBox(b, plan, i, 0, 1, 0.0, 0.04, f, M.tower.top - 0.35, "render");
    for (let y = f; y < M.tower.top - 0.5; y += f) {
      edgeBox(b, plan, i, -0.02, 1.02, 0.0, deep, y - 0.15, y + 0.15, "paint");
      edgeBox(b, plan, i, 0, 1, deep - 0.12, deep - 0.04, y + 0.15 + f * 0.35, y + f - 0.15, "timber");
    }
  }
}
