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
// The east end's storeys over the recess, from fF8q's wide view (its rows taken onto the face's plane
// with the Street View camera, then moved 1.17 m down so that the frame's top and the path below meet
// the LiDAR's eaves, 13.3, and ground, -3.35; the span between them, 16.9 m, is the LiDAR's within
// 0.2 m): a pale band of slats at the foot of each storey, 0.8-1.95, 5.2-6.35 and 9.0-10.15, glazing
// above each to the next band and to 12.55 under the frame's top; the frame's lower edge 0.15-0.8 over
// the recess, whose floor is a landing at -2.1, four steps up from the path.
export const LEVELS = [0.8, 5.2, 9.0];
const BAND = 1.15, GLAZE_TOP = 12.55, SOFFIT = 0.15, LANDING = -2.1;
const RECESS = 1.8;                         // how far the lowest storey stands back under the east end
const FRAME = { side: 0.7, out: 0.45 };     // the east end's grey frame

export function block(b) {
  const [x0, x1] = B.x, [z0, z1] = B.z, E = B.eave, g = B.eastGround;
  // the walls: over the recess from its soffit, elsewhere from the foot
  // in the seamed cladding: standing seams 0.45 m apart (51j5's upper view: about twice as close as
  // round 0's 0.9 m ribs), drawn by the material's shader, which fades them out where they would
  // shimmer, instead of as ribs of geometry
  b.box(x0, x1, SOFFIT, E, z0, z1, "panelSeam");
  b.box(x0, x1, FOOT.block, SOFFIT, z0 + RECESS, z1, "panelSeam");
  // the east end: the frame, the two fins, and the three storeys of bands and veiled glazing
  const fz = z0 - FRAME.out, ix0 = x0 + FRAME.side, ix1 = x1 - FRAME.side;
  b.add(boxesGeometry([
    [x0, ix0, SOFFIT, E, fz, z0], [ix1, x1, SOFFIT, E, fz, z0], [x0, x1, GLAZE_TOP, E, fz, z0],
    [x0, x1, SOFFIT, LEVELS[0], fz - 0.05, z0],
  ]), "panel");
  const bay = (ix1 - ix0) / 3, fins = [], bands = [], rods = [], glass = [];
  for (const k of [1, 2]) { const x = ix0 + bay * k; fins.push([x - 0.1, x + 0.1, LEVELS[0], GLAZE_TOP, fz + 0.05, z0]); }
  LEVELS.forEach((L, i) => {
    const top = i + 1 < LEVELS.length ? LEVELS[i + 1] : GLAZE_TOP;
    bands.push([ix0, ix1, L, L + BAND, z0 - 0.3, z0 - 0.1]);
    glass.push([ix0, ix1, L + BAND, top, z0 - 0.02, z0]);
    for (let x = ix0 + 0.12; x < ix1; x += 0.16) rods.push([x - 0.012, x + 0.012, L + BAND, top, z0 - 0.3, z0 - 0.27]);
  });
  b.add(boxesGeometry(fins.concat(rods)), "panel");
  b.add(boxesGeometry(bands), "paint");
  b.add(boxesGeometry(glass), "glass");
  // the lowest storey at the east end, set back: white walls, a band of glass doors and windows, round
  // columns at the corners under the storeys above, and the landing and steps down to the path
  const zr = z0 + RECESS;
  b.box(x0 + 0.2, x1 - 0.2, FOOT.block, SOFFIT, zr - 0.05, zr, "paint");
  b.box(x0 + 0.8, x0 + 4.6, LANDING, SOFFIT - 0.1, zr - 0.08, zr - 0.05, "glass");
  b.box(x1 - 4.4, x1 - 1.2, LANDING, SOFFIT - 0.1, zr - 0.08, zr - 0.05, "glass");
  b.add(boxesGeometry([[x0 + 0.5, x0 + 0.75, LANDING, SOFFIT, z0 + 0.1, z0 + 0.35], [x1 - 0.75, x1 - 0.5, LANDING, SOFFIT, z0 + 0.1, z0 + 0.35]]), "paint");
  b.box(x0, x1, FOOT.block, LANDING, z0 - 1.2, zr, "dressed");
  const rise = (LANDING - g) / 4;
  for (let i = 0; i < 4; i++) b.box(x0 + 0.5, x1 - 0.5, FOOT.block, g + rise * i, z0 - 1.2 - 0.4 * (4 - i), z0 - 1.2 - 0.4 * (3 - i), "dressed");
  // the roof: a thin dark edge, the four planes, and the plant room
  const [rx0, rx1] = B.roofX, [rz0, rz1] = B.roofZ;
  b.add(boxesGeometry([[rx0, rx1, E - 0.12, E, rz0, rz0 + 0.12], [rx0, rx1, E - 0.12, E, rz1 - 0.12, rz1],
    [rx0, rx0 + 0.12, E - 0.12, E, rz0, rz1], [rx1 - 0.12, rx1, E - 0.12, E, rz0, rz1]]), "panel");
  // grey metal, as the walls (the 2023 aerial: the roof's median sRGB 141 148 165, luma 148, at the
  // LiDAR's roof points; panel is 143 147 150)
  hipRoof(b, B.roofX, B.roofZ, E, B.slope, "panel");
  const P = B.plant;
  b.box(P.x[0], P.x[1], E, P.top, P.z[0], P.z[1], "panel");
}
