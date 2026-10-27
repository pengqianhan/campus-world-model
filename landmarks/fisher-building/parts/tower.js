// The tower and its shaft (parts/common.js MEASURED): brick walls from the plans the LiDAR traces, flat
// roofs, and a band at every floor, as MGAo's photograph shows them on the brick faces seen from Waterloo
// Quadrant. Round 0 (the lead): the massing. Round 1 (the lead): the kit's tan brick, with parts/wing.js and
// parts/slot.js. Round 2: the south-west corners from the LiDAR's wall lines (common.js), the bands cream and
// 0.15 m high, the brick core set back behind the wing's balconies, which stand inside the outline. The
// entrance and its ramp are a later round's.
import { MEASURED as M, FOOT } from "./common.js";
import { prism, roof, bands, inset } from "./shapes.js";

export function tower(b) {
  // the brick core: the outline with the wing's faces set back by the balconies' depth (parts/wing.js)
  prism(b, inset(M.tower.plan, M.wing.edges, M.wing.deep), FOOT, M.tower.top, "brickTan");
  roof(b, M.tower.plan, M.tower.top + 0.02, 0.3, "roofGrey");
}

export function shaft(b) {
  prism(b, M.shaft.plan, M.tower.top, M.shaft.top, "brickTan");
  roof(b, M.shaft.plan, M.shaft.top, 0.3, "roofGrey");
}

/** The floor bands, cream as MGAo's photograph shows them (round 1 drew them white): on the tower to its
 * roof, but not on the wing's faces, where the balconies' slabs and the tile fascia stand; and on the shaft
 * above it, where its floor at 34.5 m shows as the band nearest its top. */
export function floorBands(b) {
  const { h, proud } = M.band, low = [], high = [];
  for (let y = M.floor; y < M.shaft.top - 0.5; y += M.floor) (y < M.tower.top - 0.5 ? low : high).push(y - h / 2);
  bands(b, M.tower.plan, low, h, proud, "render", M.wing.edges);
  bands(b, M.tower.plan, [M.tower.top - 0.35], 0.35, 0.15, "render", M.wing.edges);
  bands(b, M.shaft.plan, high, h, proud, "render");
  bands(b, M.shaft.plan, [M.shaft.top - 0.35], 0.35, 0.15, "render");
}
