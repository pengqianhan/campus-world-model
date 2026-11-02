// The auditorium to the east: its walls and its roof of facets round one high point (parts/common.js,
// MEASURED.fan: a cone fitted to the LiDAR). Its wall to the car park is the ochre one in the photographs.
// The roof reaches out to the eaves the LiDAR's roof returns trace; the walls stand inside them where the
// LiDAR's wall returns do, under the roof's underside and a white fascia and gutter round its edge. In the
// ochre wall, its window (round 2); at that wall's corners, two white downpipes.
import { FOOT, MEASURED } from "./common.js";
import { walls, fanRoof, fanHeight, cylinder } from "./shapes.js";

const F = MEASURED.fan, T = 0.2; // the roof's own thickness at its eaves, the fascia's depth (estimated)
const cone = (x, z) => F.top - F.fall * Math.hypot(x - F.apex[0], z - F.apex[1]);
const apex = [F.apex[0], F.top, F.apex[1]];
const roofAt = (x, z) => fanHeight(F.plan, apex, cone, x, z);

export function fan(b) {
  // the walls up to just under the roof's top: on the four outer faces they stand inside the eaves, under the
  // roof's underside; on the other edges, at the eave line, they close the roof's edge themselves
  walls(b, F.walls, FOOT, (x, z) => roofAt(x, z) - 0.01, "trim");
  fanRoof(b, F.plan, apex, cone, "roofGrey");
  fanRoof(b, F.plan, [apex[0], apex[1] - T, apex[2]], (x, z) => cone(x, z) - T, "roofGrey", true);
  walls(b, F.plan, (x, z) => cone(x, z) - T, cone, "paint", F.eaves); // the fascia, where the walls stand in
}

/** The ochre wall's window: panes on the wall's face, a white frame of four lights in two rows standing a little
 * out from it, a head over it and a sill under it. */
export function fanWindow(b) {
  const w = F.window, z = F.walls[2][1], [x0, x1] = w.x, [y0, y1] = w.y, f = w.frame;
  b.box(x0 + 0.01, x1 - 0.01, y0 + f, y1 - w.head - 0.01, z - 0.01, z + 0.01, "glassPale"); // the panes, on the face, inside the jambs
  const front = (a0, a1, b0, b1) => b.box(a0, a1, b0, b1, z - 0.02, z + w.out, "paint");
  front(x0 - f, x1 + f, y1 - w.head, y1);                                             // the head
  front(x0 - f, x1 + f, y0 - 0.02, y0 + f);                                           // the sill
  front(x0 - f, x0, y0, y1 - w.head); front(x1, x1 + f, y0, y1 - w.head);             // the jambs
  front(x0, x1, w.transom - f / 2, w.transom + f / 2);                               // the transom
  for (let i = 1; i < w.lights; i++) {                                                // the mullions
    const x = x0 + ((x1 - x0) * i) / w.lights;
    front(x - f / 2, x + f / 2, y0, y1 - w.head);
  }
  for (const [px, pz] of F.pipes) cylinder(b, px, pz + F.pipeR, F.pipeR, FOOT, roofAt(px, pz + F.pipeR) - T, "paint", 8);
}
