// The four-storey block behind the house (parts/common.js MEASURED.block). From the photographs from the
// east (fF8q, 51j5): its long side toward the library is clad in grey metal with standing seams and no
// windows where they see it; the east end is a deep grey frame round three bays of glazing, split by two
// slender fins, three storeys of it, each standing on a pale band of slats, the glazing veiled by thin
// vertical rods; under it the lowest storey stands back, white walls and glass doors, up steps from the
// campus path. The long side toward the Clock Tower is in no photograph: plain grey, as the other.
// A low hipped roof of four pitches with a plant room on it (the LiDAR).
import { boxesGeometry } from "../../kit/gothic.js";
import { MEASURED as M, FOOT } from "./common.js";
import { hipRoof } from "./shapes.js";

const B = M.block;
// the storeys over the recess: their floors, a pale band of slats at the foot of each, glazing above
export const LEVELS = [0.6, 4.75, 8.9];
const STOREY = 4.15, BAND = 1.1;
const RECESS = 1.8;                         // how far the lowest storey stands back under the east end
const FRAME = { side: 0.7, top: 0.45, out: 0.45 }; // the east end's grey frame
const SEAM = 0.45;                          // the standing seams of the long sides' cladding

export function block(b) {
  const [x0, x1] = B.x, [z0, z1] = B.z, E = B.eave, g = B.eastGround;
  // the walls: over the recess from its soffit, elsewhere from the foot
  b.box(x0, x1, LEVELS[0], E, z0, z1, "panel");
  b.box(x0, x1, FOOT.block, LEVELS[0], z0 + RECESS, z1, "panel");
  // standing seams on both long sides (thin ribs), up to the eaves
  const seams = [];
  for (let z = z0 + 0.3; z < z1; z += SEAM) {
    seams.push([x0 - 0.04, x0, LEVELS[0], E - 0.3, z - 0.02, z + 0.02], [x1, x1 + 0.04, LEVELS[0], E - 0.3, z - 0.02, z + 0.02]);
  }
  b.add(boxesGeometry(seams), "panel");
  // the east end: the frame, the two fins, and the three storeys of bands and veiled glazing
  const fz = z0 - FRAME.out, ix0 = x0 + FRAME.side, ix1 = x1 - FRAME.side;
  b.add(boxesGeometry([
    [x0, ix0, LEVELS[0], E, fz, z0], [ix1, x1, LEVELS[0], E, fz, z0], [x0, x1, E - FRAME.top, E, fz, z0],
    [x0, x1, LEVELS[0] - 0.1, LEVELS[0] + 0.12, fz - 0.05, z0],
  ]), "panel");
  const bay = (ix1 - ix0) / 3, fins = [], bands = [], rods = [], glass = [];
  for (const k of [1, 2]) { const x = ix0 + bay * k; fins.push([x - 0.1, x + 0.1, LEVELS[0], E - FRAME.top, fz + 0.05, z0]); }
  for (const L of LEVELS) {
    const top = Math.min(L + STOREY, E - FRAME.top);
    bands.push([ix0, ix1, L + 0.12, L + BAND, z0 - 0.3, z0 - 0.1]);
    glass.push([ix0, ix1, L + BAND, top, z0 - 0.02, z0]);
    for (let x = ix0 + 0.12; x < ix1; x += 0.16) rods.push([x - 0.012, x + 0.012, L + BAND, top, z0 - 0.3, z0 - 0.27]);
  }
  b.add(boxesGeometry(fins.concat(rods)), "panel");
  b.add(boxesGeometry(bands), "paint");
  b.add(boxesGeometry(glass), "glass");
  // the lowest storey at the east end, set back: white walls, a band of glass doors and windows, round
  // columns at the corners under the storeys above, and the landing and steps down to the path
  const zr = z0 + RECESS;
  b.box(x0 + 0.2, x1 - 0.2, FOOT.block, LEVELS[0], zr - 0.05, zr, "paint");
  b.box(x0 + 0.8, x0 + 4.6, g + 0.75, LEVELS[0] - 0.5, zr - 0.08, zr - 0.05, "glass");
  b.box(x1 - 4.4, x1 - 1.2, g + 0.75, LEVELS[0] - 0.5, zr - 0.08, zr - 0.05, "glass");
  b.add(boxesGeometry([[x0 + 0.5, x0 + 0.75, g + 0.75, LEVELS[0], z0 + 0.1, z0 + 0.35], [x1 - 0.75, x1 - 0.5, g + 0.75, LEVELS[0], z0 + 0.1, z0 + 0.35]]), "paint");
  b.box(x0, x1, FOOT.block, g + 0.75, z0 - 1.2, zr, "dressed");
  for (let i = 0; i < 4; i++) b.box(x0 + 0.5, x1 - 0.5, FOOT.block, g + 0.15 + 0.15 * i, z0 - 1.2 - 0.4 * (4 - i), z0 - 1.2 - 0.4 * (3 - i), "dressed");
  // the roof: a thin dark edge, the four planes, and the plant room
  const [rx0, rx1] = B.roofX, [rz0, rz1] = B.roofZ;
  b.add(boxesGeometry([[rx0, rx1, E - 0.12, E, rz0, rz0 + 0.12], [rx0, rx1, E - 0.12, E, rz1 - 0.12, rz1],
    [rx0, rx0 + 0.12, E - 0.12, E, rz0, rz1], [rx1 - 0.12, rx1, E - 0.12, E, rz0, rz1]]), "panel");
  hipRoof(b, B.roofX, B.roofZ, E, B.slope, "roofPale");
  const P = B.plant;
  b.box(P.x[0], P.x[1], E, P.top, P.z[0], P.z[1], "panel");
}
