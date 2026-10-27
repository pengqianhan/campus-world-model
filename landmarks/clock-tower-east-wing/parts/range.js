// The main range (parts/common.js MEASURED.range): two storeys of rock-faced stone under a red tile roof
// hipped at both ends. On the lawn side (EX9b's wide and upper views): either side of the stair tower,
// two windows upstairs with shallow segmental heads, two lights each under a fanlight, and four narrow
// square-headed ones below, all white-framed. The back, the ends and the two blocks at the back are in no
// photograph: plain walls. Round 1 (the lead).
import { MEASURED as M, FOOT } from "./common.js";
import { roofX, wall } from "./shapes.js";

const T = 0.4; // wall thickness of a face drawn with openings

// Upstairs: 1.3 m wide, sill 0.8 m above the first floor, the head rising 0.3 m from its springing to its
// crown at 6.55 m (the upper view: the crowns sit about 0.75 m under the eaves). Downstairs: 0.55 m wide,
// 1.9 m tall from a sill 0.85 m up, a transom 0.45 m under the head.
export const UPPER = { w: 1.3, h: 2.15, rise: 0.3, lights: 2, transom: 0 };
export const LOWER = { w: 0.55, h: 1.9, rise: 0, lights: 1, transom: 0.45 };

/** A front wall facing the lawn at z, over [x0, x1], from the foot to `top`, with its windows. */
export function frontWall(b, x0, x1, z, top, windows) {
  wall(b, [[0, 0], [x1 - x0, 0], [x1 - x0, top - FOOT], [0, top - FOOT]], x0, FOOT, z, T, windows);
}

/** Upstairs `up` windows `pair` m apart, downstairs `n` narrow ones `step` m apart, centred on x = cx. */
export function bayWindows(cx, { up = 2, pair = 2.1, n = 4, step = 1.05 } = {}) {
  const list = [];
  for (let i = 0; i < up; i++) list.push({ ...UPPER, x: cx + (i - (up - 1) / 2) * pair, y: M.range.floor + 0.8 });
  for (let i = 0; i < n; i++) list.push({ ...LOWER, x: cx + (i - (n - 1) / 2) * step, y: 0.85 });
  return list;
}

export function range(b) {
  const R = M.range, [w, e] = M.pavilions;
  // the body: under the tile roof up to its eaves, under the flat roof at the back up to that; the front
  // wall between the pavilions is drawn on its own, so the body stops behind it
  const low = R.flat - 0.15;
  b.box(R.x[0], R.x[1], FOOT, R.eave, R.back, R.z[1] - T, "ashlar");
  b.box(R.x[0], R.x[1], FOOT, low, R.z[0], R.back, "ashlar");
  // the lawn side, either side of the stair tower, with a plain band of stone at the eaves
  const t = M.tower, band = R.eave - 0.3;
  frontWall(b, w.x[1], t.x[0], R.z[1], band, bayWindows((w.x[1] + t.x[0]) / 2));
  frontWall(b, t.x[1], e.x[0], R.z[1], band, bayWindows((t.x[1] + e.x[0]) / 2));
  b.box(w.x[1], e.x[0], band, R.eave, R.z[1] - T, R.z[1] + 0.06, "dressed");
  // the tile roof over the front of the range, its eaves a little proud of the walls, and the flat roof
  // behind it, a little lower than its back eave
  roofX(b, R.x[0] - 0.3, R.x[1] + 0.3, R.back, R.z[1] + 0.3, R.eave, R.ridge, R.ridgeZ, R.hip, "roofTile");
  b.box(R.x[0] - 0.1, R.x[1] + 0.1, R.flat - 0.15, R.flat, R.z[0] - 0.1, R.back + 0.2, "roofGrey");
}

export function backs(b) {
  for (const k of M.backs) b.box(k.x[0], k.x[1], FOOT, M.backTop, k.z[0], k.z[1], "ashlar");
  const L = M.leanTo;
  b.box(L.x[0], L.x[1], L.top - 0.2, L.top, L.z[0], L.z[1], "roofGrey");
}
