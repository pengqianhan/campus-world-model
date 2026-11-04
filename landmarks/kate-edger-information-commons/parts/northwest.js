// The north-west range (parts/common.js, MEASURED.northwest), its higher north-east end and the end that stands
// out over the court beyond it, the raised part on its roof, and its two lower wings. Round 0: flat-topped
// blocks at the LiDAR's heights, plain walls; the end over the court down to FOOT (the LiDAR cannot see under it).
import { FOOT, MEASURED } from "./common.js";
import { block } from "./shapes.js";

const M = MEASURED;

export function northwest(b) {
  block(b, M.northwest.plan, FOOT, M.northwest.top, "renderGrey", "roofGrey");
  block(b, M.raised.plan, M.northwest.top - 0.3, M.raised.top, "renderGrey", "roofGrey");
}

export function northeast(b) {
  block(b, M.northeast.plan, FOOT, M.northeast.top, "renderGrey", "roofGrey");
  block(b, M.overhang.plan, FOOT, M.overhang.top, "renderGrey", "roofGrey");
}

export function wings(b) {
  for (const k of ["corner", "wing"]) block(b, M[k].plan, FOOT, M[k].top, "renderGrey", "roofGrey");
}
