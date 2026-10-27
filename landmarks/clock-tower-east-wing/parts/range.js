// The main range (parts/common.js MEASURED.range): two storeys of rock-faced stone under a red tile roof
// hipped at both ends. On the lawn side (the photographs): between the pavilions and the stair tower, a
// pair of round-headed windows upstairs and three narrow square-headed ones below, each side. The back,
// the ends and the two blocks at the back are in no photograph: plain walls. Baseline (round 0).
import { addWall } from "../../kit/gothic.js";
import { MEASURED as M, FOOT } from "./common.js";
import { roofX } from "./shapes.js";

const T = 0.4; // wall thickness of a face drawn with openings

export const UPPER = { w: 0.95, h: 2.1, head: "pointed", k: 0.5, lights: 1, reveal: 0.25, hood: false };
export const LOWER = { w: 0.6, h: 2.0, head: "flat", lights: 1, reveal: 0.22, hood: false };

/** A front wall facing the lawn at z, over [x0, x1], from the foot to `top`, with its windows. */
export function frontWall(b, x0, x1, z, top, windows) {
  addWall(b, [[0, 0], [x1 - x0, 0], [x1 - x0, top - FOOT], [0, top - FOOT]], x0, FOOT, z, T, windows);
}

/** Upstairs a pair of round-headed windows, downstairs `n` narrow ones, centred on x = cx. */
export function bayWindows(cx, n = 3, pair = 1.25) {
  const R = M.range, list = [];
  for (const s of [-1, 1]) list.push({ ...UPPER, x: cx + (s * pair) / 2, y: R.floor + 0.8 });
  for (let i = 0; i < n; i++) list.push({ ...LOWER, x: cx + (i - (n - 1) / 2) * 1.1, y: 0.8 });
  return list;
}

export function range(b) {
  const R = M.range, [w, e] = M.pavilions;
  // the body: the front wall between the pavilions is drawn on its own, so the body stops behind it
  b.box(-17.8, R.x[1], FOOT, R.eave, R.z[0], R.z[1] - T, "ashlar");
  b.box(R.x[0], -17.8, FOOT, R.eave, R.z[0], 1.1, "ashlar");
  b.box(w.x[1], e.x[0], R.eave - 0.25, R.eave, R.z[1] - T, R.z[1], "ashlar");
  // the lawn side, either side of the stair tower
  const t = M.tower;
  frontWall(b, w.x[1], t.x[0], R.z[1], R.eave - 0.25, bayWindows((w.x[1] + t.x[0]) / 2));
  frontWall(b, t.x[1], e.x[0], R.z[1], R.eave - 0.25, bayWindows((t.x[1] + e.x[0]) / 2));
  // the roof, its eaves a little proud of the walls
  roofX(b, R.x[0] - 0.3, R.x[1] + 0.3, R.z[0] - 0.3, R.z[1] + 0.3, R.eave, R.ridge, R.ridgeZ, 6.3, "roofTile");
}

export function backs(b) {
  for (const k of M.backs) b.box(k.x[0], k.x[1], FOOT, M.backTop, k.z[0], k.z[1], "ashlar");
  const L = M.leanTo;
  b.box(L.x[0], L.x[1], L.top - 0.2, L.top, L.z[0], L.z[1], "roofGrey");
}
