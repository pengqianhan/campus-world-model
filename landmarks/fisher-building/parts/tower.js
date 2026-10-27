// The tower and its shaft (parts/common.js MEASURED): brick walls from the plans the LiDAR traces, flat
// roofs, and a white band at every floor, as MGAo's photograph shows them on the brick faces seen from
// Waterloo Quadrant. Round 0 (the lead): the massing. Round 1 (the lead): the kit's tan brick, with
// parts/wing.js and parts/slot.js. The entrance and its ramp are a later round's.
import { MEASURED as M, FOOT } from "./common.js";
import { prism, roof, bands } from "./shapes.js";

export function tower(b) {
  prism(b, M.tower.plan, FOOT, M.tower.top, "brickTan");
  roof(b, M.tower.plan, M.tower.top + 0.02, 0.3, "roofGrey");
}

export function shaft(b) {
  prism(b, M.shaft.plan, M.tower.top, M.shaft.top, "brickTan");
  roof(b, M.shaft.plan, M.shaft.top, 0.3, "roofGrey");
}

/** The floor bands: on the tower to its roof, and on the shaft above it. */
export function floorBands(b) {
  const ys = [];
  for (let y = M.floor; y < M.tower.top - 0.5; y += M.floor) ys.push(y - 0.15);
  bands(b, M.tower.plan, ys, 0.3, 0.12, "paint");
  bands(b, M.tower.plan, [M.tower.top - 0.35], 0.35, 0.15, "paint");
  bands(b, M.shaft.plan, [M.shaft.top - 0.35], 0.35, 0.15, "paint");
}
