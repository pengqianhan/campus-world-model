// The link toward the Clock Tower (parts/common.js MEASURED.link): one storey under trees, with a flat
// roof. No photograph shows it, so it is a plain block of the wing's stone. Baseline (round 0). It stands
// from the campus map's first storey up, over the ground the map's floor "G" leaves open, where
// OpenStreetMap has a footway through a passage; over the space floor "G" has under its east third, it
// goes down to the ground.
import { MEASURED as M, FOOT } from "./common.js";

export function link(b) {
  const L = M.link;
  const G = M.linkGround;
  b.box(L.x[0], L.x[1], L.under, L.top - 0.15, L.z[0], L.z[1], "ashlar");
  b.box(G.x[0], G.x[1], FOOT, L.under, G.z[0], G.z[1], "ashlar");
  b.box(L.x[0], L.x[1] + 0.1, L.top - 0.15, L.top, L.z[0] - 0.1, L.z[1] + 0.1, "roofGrey");
}
