// Building 903's faces: the two glazed storeys set back under the clad box, with their plinth, piers, band and
// mullions, and the canopy over the corner's entrance; and the windows of the clad storeys. Sizes from common.js.
import { GLASS, WALL, along } from "./block.js";
import {
  BAND, CANOPIES, EAST, EAST_SILLS, FOOT, FORWARD, NORTH, PIERS, PLINTH, SET, SILLS, SOFFIT, SOUTH, STEP, WEST, WINDOWS,
} from "./common.js";

// The glazed storeys' faces: the south face, the forward face, the east end and the step's return.
const QG = SOUTH - SET, QF = FORWARD - SET, PE = EAST + SET, PS = STEP + SET;
const NONE = [null, null, null, null];

/** A box on a face, a0 to a1 along it, y0 to y1 high and d0 to d1 out from it: on "S" (a face at q = `at` facing the
 * road: a along p), "N" (q = `at`, facing away: a along p) or "E" (p = `at`, facing east-south-east: a along q).
 * `front` draws its front alone (a pane). */
function box(b, face, at, a0, a1, y0, y1, d0, d1, m, front = false) {
  const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
  if (face === "E") {
    along(b, at - d1, at - d0, [[lo, y0], [hi, y0], [hi, y1], [lo, y1]], front ? NONE : [m, m, m, m], m,
      [true, !front]);
    return;
  }
  const s = face === "S" ? 1 : -1, qa = at + s * d0, qb = at + s * d1;
  along(b, lo, hi, [[qa, y0], [qb, y0], [qb, y1], [qa, y1]], front ? [null, m, null, null] : [m, m, m, m], m,
    [!front, !front]);
}

/** A window of `n` units on a face from a0 to a1, its sill at y0 and its head at y1: its panes, a frame round it 0.06
 * m wide and 0.07 m proud, the cladding 0.3 m wide between its units, and a mullion in each unit wider than 1.6 m. */
function window(b, face, at, a0, a1, [y0, y1], n) {
  const lo = Math.min(a0, a1), hi = Math.max(a0, a1), f = 0.06, d = 0.07, w = (hi - lo) / n;
  box(b, face, at, lo, hi, y0, y1, 0, 0.03, GLASS, true);
  box(b, face, at, lo - f, hi + f, y1, y1 + f, 0, d, WALL);
  box(b, face, at, lo - f, hi + f, y0 - f, y0, 0, d, WALL);
  box(b, face, at, lo - f, lo, y0, y1, 0, d, WALL);
  box(b, face, at, hi, hi + f, y0, y1, 0, d, WALL);
  for (let i = 1; i < n; i++) box(b, face, at, lo + i * w - 0.15, lo + i * w + 0.15, y0, y1, 0, d, WALL);
  if (w > 1.6) for (let i = 0; i < n; i++) box(b, face, at, lo + (i + 0.5) * w - 0.025, lo + (i + 0.5) * w + 0.025,
    y0, y1, 0, 0.05, WALL);
}

/** The forward face's bands, which the photograph sees only at its far left: drawn as the south face's band, along
 * it 2 m in from each end, in units as wide. */
const FORWARD_BAND = (() => {
  const [a0, a1, n] = WINDOWS.south[1], unit = (a1 - a0) / n, lo = STEP + 2, hi = WEST - 2;
  return [lo, hi, Math.round((hi - lo) / unit)];
})();

/** The two glazed storeys under the clad box: glazing from the plinth to the box's underside, the plinth below it,
 * set back SET on the south and forward faces, the step's return and the east end; the north face plain, where the
 * lower block stands against it. */
export function glazed(b) {
  for (const [y0, y1, m] of [[PLINTH, SOFFIT, GLASS], [FOOT, PLINTH, WALL]]) {
    along(b, PE, PS, [[NORTH, y0], [QG, y0], [QG, y1], [NORTH, y1]], [null, m, null, WALL], [m, null], [true, false]);
    along(b, PS, WEST, [[NORTH, y0], [QF, y0], [QF, y1], [NORTH, y1]], [null, m, null, WALL], [null, WALL],
      [false, true]);
    along(b, PS, PS + 0.01, [[QG, y0], [QF, y0], [QF, y1], [QG, y1]], NONE, m, [true, false]);
  }
}

/** The glazed storeys' piers, 0.1 m proud of the glazing, the band at the floor between the storeys, and a mullion
 * every 1.5 m between the piers. */
export function piers(b) {
  const c = PIERS.corner, south = [];
  along(b, PE - 0.1, PE + c - 0.1, [[QG - c + 0.1, FOOT], [QG + 0.1, FOOT], [QG + 0.1, SOFFIT],
    [QG - c + 0.1, SOFFIT]], [null, WALL, null, WALL], WALL);
  for (let p0 = PIERS.south[0]; p0 + (PIERS.south[1] - PIERS.south[0]) < WEST; p0 += PIERS.step) {
    const p1 = p0 + (PIERS.south[1] - PIERS.south[0]);
    south.push([p0, p1]);
    box(b, "S", p1 < PS ? QG : QF, p0, p1, FOOT, SOFFIT, -0.25, 0.1, WALL);
  }
  for (const [q0, q1] of PIERS.east) box(b, "E", PE, q0, q1, FOOT, SOFFIT, -0.25, 0.1, WALL);
  box(b, "S", QG, PE - 0.05, PS, BAND.y0, BAND.y1, -0.02, 0.05, WALL);
  box(b, "S", QF, PS - 0.05, WEST, BAND.y0, BAND.y1, -0.02, 0.05, WALL);
  box(b, "E", PS, QG, QF + 0.05, BAND.y0, BAND.y1, -0.02, 0.05, WALL);
  box(b, "E", PE, NORTH, QG + 0.05, BAND.y0, BAND.y1, -0.02, 0.05, WALL);
  const clear = (a, spans) => spans.every(([s0, s1]) => a < s0 - 0.1 || a > s1 + 0.1);
  for (let p = PE + c; p < WEST - 0.5; p += 1.5) {
    if (!clear(p, south) || Math.abs(p - PS) < 0.3) continue;
    box(b, "S", p < PS ? QG : QF, p - 0.03, p + 0.03, PLINTH, SOFFIT, -0.02, 0.04, WALL);
  }
  for (let q = QG - c; q > NORTH + 0.5; q -= 1.5) {
    if (!clear(q, PIERS.east.map(([a, z]) => [Math.min(a, z), Math.max(a, z)]))) continue;
    box(b, "E", PE, q - 0.03, q + 0.03, PLINTH, SOFFIT, -0.02, 0.04, WALL);
  }
}

/** The canopy over the corner's entrance, from the glazing out to its front. */
export function canopy(b) {
  for (const c of CANOPIES) {
    const at = c.face === "S" ? QG : QF;
    box(b, "S", at, c.p0, c.p1, c.top - c.deep, c.top, -0.02, c.q - at, WALL);
  }
}

/** The clad storeys' windows: on the south face as the photograph shows them, on the forward face its bands, on the
 * east end as the photograph shows them; the north face, which no photograph shows, drawn as the south face. */
export function windows(b) {
  for (const row of ["upper", "lower"]) {
    for (const [a0, a1, n] of WINDOWS.south) {
      window(b, "S", SOUTH, a0, a1, SILLS[row], n);
      window(b, "N", NORTH, a0, a1, SILLS[row], n);
    }
    window(b, "S", FORWARD, ...FORWARD_BAND.slice(0, 2), SILLS[row], FORWARD_BAND[2]);
    window(b, "N", NORTH, ...FORWARD_BAND.slice(0, 2), SILLS[row], FORWARD_BAND[2]);
    for (const [a0, a1, n] of WINDOWS.east[row]) window(b, "E", EAST, a0, a1, EAST_SILLS[row], n);
  }
}
