// The face to the street (parts/common.js, MEASURED.face; step 5), the one the photograph shows, in the building's
// frame: the dark gaps between its three bands of panels, a strip 2 cm before the face (the bands' outer faces are the
// range's wall); the canopy along the entrance; the ground storey's glazing under it. The relief of white blocks on
// the lowest band is an artwork: it is not drawn after; the band there is plain.
import { FOOT, MEASURED, rect } from "./common.js";
import { prism } from "./shapes.js";

const M = MEASURED, F = M.face, GAP = "screenGrey", GLASS = "glass", CANOPY = "grey";

export function faces(b) {
  // along the whole face, on to its end beside 303S (M.ends.face)
  const [u0, u1] = [M.range.u[0] + 0.02, M.ends.face];
  for (const [y0, y1] of F.gaps) prism(b, rect([u0, u1], [0, 0.02]), y0, y1, GAP);
  // under the lowest band, which ends a metre short of the north-east end: its soffit's shadow
  prism(b, rect([F.band1.u0, u1], [0, 0.02]), F.canopy.top + 0.01, F.band1.bottom, GAP);
  const C = F.canopy;
  prism(b, rect(C.u, [0.01, C.out]), C.top - C.t, C.top, CANOPY);
  prism(b, rect([C.u[0] + 0.01, C.u[1] - 0.01], [0, 0.03]), FOOT + 0.5, C.top - C.t - 0.01, GLASS);
}
