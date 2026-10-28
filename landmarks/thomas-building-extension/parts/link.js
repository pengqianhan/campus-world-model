// The link to the Thomas Building (110) on the south-west (parts/common.js MEASURED.link): a glazed
// roof between the two buildings, its south-east end glazed (oWaF's photograph, beyond the banner wall).
// Its north-west side and its end against 110 no photograph shows: plain render. Round 0 (the lead).
import { MEASURED as M, FOOT } from "./common.js";
import { walls, roof as flat } from "./shapes.js";

export function link(b) {
  const L = M.link, [x0, x1] = L.x, [z0, z1] = L.z;
  const plan = [[x1, z0], [x1, z1], [x0, z1], [x0, z0]];
  walls(b, plan, 0, 0, FOOT, L.top - 0.1, "glass");    // the south-east end
  walls(b, plan, 1, 2, FOOT, L.top - 0.1, "grey");     // against 110, and the north-west side: plain render
  flat(b, plan, L.top, 0.1, "glass");
}
