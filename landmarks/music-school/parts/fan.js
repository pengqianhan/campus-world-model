// The auditorium to the east: its walls and its roof of facets round one high point (parts/common.js,
// MEASURED.fan: a cone fitted to the LiDAR). Its wall to the car park is the ochre one in the photographs.
// The roof reaches out to the eaves the LiDAR's roof returns trace; the walls stand inside them where the
// LiDAR's wall returns do, under the roof's underside and a fascia round its edge.
import { FOOT, MEASURED } from "./common.js";
import { walls, fanRoof, fanHeight } from "./shapes.js";

const F = MEASURED.fan, T = 0.2; // the roof's own thickness at its eaves (estimated)
const cone = (x, z) => F.top - F.fall * Math.hypot(x - F.apex[0], z - F.apex[1]);
const apex = [F.apex[0], F.top, F.apex[1]];
const roofAt = (x, z) => fanHeight(F.plan, apex, cone, x, z);

export function fan(b) {
  walls(b, F.walls, FOOT, (x, z) => roofAt(x, z) - T / 2, "trim");
  fanRoof(b, F.plan, apex, cone, "roofGrey");
  fanRoof(b, F.plan, [apex[0], apex[1] - T, apex[2]], (x, z) => cone(x, z) - T, "roofGrey", true);
  walls(b, F.plan, (x, z) => cone(x, z) - T, cone, "roofGrey");
}
