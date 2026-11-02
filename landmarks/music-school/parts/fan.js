// The auditorium to the east: its walls and its roof of facets round one high point (parts/common.js,
// MEASURED.fan: a cone fitted to the LiDAR). Its wall to the car park is the ochre one in the photographs.
import { FOOT, MEASURED } from "./common.js";
import { walls, fanRoof } from "./shapes.js";

const F = MEASURED.fan;
const cone = (x, z) => F.top - F.fall * Math.hypot(x - F.apex[0], z - F.apex[1]);

export function fan(b) {
  walls(b, F.plan, FOOT, cone, "trim");
  fanRoof(b, F.plan, [F.apex[0], F.top, F.apex[1]], cone, "roofGrey");
}
