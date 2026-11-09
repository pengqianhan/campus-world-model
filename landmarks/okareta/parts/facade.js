// Okareta's front: the windows arched at their heads in their moulded surrounds, the front door, and the cornice
// round the bay between its storeys. Sizes from common.js (WINDOWS: estimated from the photograph).
import { HOUSE, WINDOWS } from "./common.js";
import { prism, tris } from "./shapes.js";

const GLASS = "glass", SURROUND = "render";

/** A convex outline [[u, h], ...] upright on the plane w, facing the street (+w). */
function face(b, outline, w, material) {
  const P = outline.map(([u, h]) => [-u, h, w]);
  tris(b, P.slice(1, -1).map((_, i) => [P[0], P[i + 1], P[i + 2]]), material, (m) => [m[0], m[1] + 1]);
}

/** A window's outline from u0 to u1, its sill at h0 and the crown of its arched head at h1 (a segmental arch of
 * `rise`: an arc of the circle through its springs and its crown), grown by `d` all round. */
function arched([u0, u1, h0, h1], d = 0, rise = 0.3, n = 8) {
  const s = Math.sign(u1 - u0), a = u0 - s * d, c = u1 + s * d, top = h1 + d, spring = top - rise;
  const half = Math.abs(c - a) / 2, mid = (a + c) / 2, R = (half * half + rise * rise) / (2 * rise), t0 = Math.asin(half / R);
  const head = Array.from({ length: n + 1 }, (_, i) => {
    const t = t0 - (2 * t0 * i) / n;     // from the spring at u1 over the crown to the spring at u0
    return [mid + s * R * Math.sin(t), top - R + R * Math.cos(t)];
  });
  return [[a, h0 - d], [c, h0 - d], ...head];
}

/** Each window: its surround 0.12 m wide standing 0.04 m off the wall, the glass 0.03 m before that. */
function windows(b, list, w) {
  for (const win of list) {
    face(b, arched(win, 0.12), w + 0.04, SURROUND);
    face(b, arched(win), w + 0.07, GLASS);
  }
}

export function facade(b) {
  const front = HOUSE.walls[1][1], bay = HOUSE.walls[4][1];
  windows(b, WINDOWS.front, front);
  windows(b, [WINDOWS.door], front);
  windows(b, WINDOWS.bay, bay);
  // The bay's cornice: round its face and its canted corners, standing out by `out`, its back inside the wing.
  const [y0, y1, out] = WINDOWS.bayCornice, [, , , [ua, wa], [ub, wb], [uc, wc], [ud, wd]] = HOUSE.walls;
  const k = out * Math.SQRT1_2;
  prism(b, [[ua + out, wa - 0.4], [ua + out, wa], [ub + k, wb + out], [uc - k, wc + out], [ud - out, wd], [ud - out, wd - 0.4]]
    .map(([u, w]) => [-u, w]), y0, y1, SURROUND);
}
