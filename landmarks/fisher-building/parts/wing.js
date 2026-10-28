// The lower part's west faces, to the left of the shaft in MGAo's photograph (parts/common.js
// MEASURED.wing): at every floor a white concrete balcony slab, its edge on the line the LiDAR's roof
// outline gives at 30 m (the roof and its red tile fascia stand over the balconies), the pale wall behind
// it set back by the balconies' depth; between the slabs dark red-brown louvres along the balconies' outer
// edge, their lower part open; at the top, under the roof's edge, the red tile fascia. Round 1 (the lead)
// stood the balconies 1.0 m outside the outline; round 2 puts them inside it (parts/tower.js draws the brick
// core from the outline set back by the same depth). The depth (1.0 m) and the louvres' share of a storey are
// estimated from the photograph, not measured; the fascia's height (1.0 m) is the photograph's through the
// fitted camera (about 35 px at about 30 m).
import { MEASURED as M } from "./common.js";
import { edgeBox } from "./shapes.js";

export function wing(b) {
  const plan = M.tower.plan, f = M.floor, { deep, fascia } = M.wing;
  for (const i of M.wing.edges) {
    // the pale wall behind the balconies, a skin over the brick core
    edgeBox(b, plan, i, 0, 1, -deep, -deep + 0.04, f, M.tower.top - fascia, "render");
    for (let y = f; y < M.tower.top - fascia; y += f) {
      edgeBox(b, plan, i, -0.02, 1.02, -deep, 0.0, y - 0.15, y + 0.15, "paint");
      edgeBox(b, plan, i, 0, 1, -0.12, -0.04, y + 0.15 + f * 0.35, Math.min(y + f - 0.15, M.tower.top - fascia), "timber");
    }
    // the red tile fascia under the roof's edge
    edgeBox(b, plan, i, -0.02, 1.02, -0.1, 0.06, M.tower.top - fascia, M.tower.top - 0.02, "roofTile");
  }
}
