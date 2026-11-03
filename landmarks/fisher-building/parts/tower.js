// The tower and its shaft (parts/common.js MEASURED): brick walls from the plans the LiDAR traces, flat
// roofs, and a band at every floor, as MGAo's photograph shows them on the brick faces seen from Waterloo
// Quadrant. Round 0 (the lead): the massing. Round 1 (the lead): the kit's tan brick, with parts/wing.js and
// parts/slot.js. Round 2: the south-west corners from the LiDAR's wall lines (common.js), the bands cream and
// 0.15 m high, the brick core set back behind the wing's balconies, which stand inside the outline. The
// entrance and its ramp are a later round's.
import { MEASURED as M, FOOT } from "./common.js";
import { prism, roof, bands, inset, edgeBox } from "./shapes.js";
import { notched } from "./slot.js";

export function tower(b) {
  // the brick core: the outline with the wing's faces set back by the balconies' depth (parts/wing.js), and
  // the slot's recess cut into its south-west corner (parts/slot.js)
  const plan = notched(M.tower.plan, M.slot.corner).plan;
  // the walls up to the roof slab's underside: the slab's own sides above (where the walls ran on up to
  // M.tower.top, their faces lay in the slab's sides, behind the top band)
  prism(b, inset(plan, M.wing.edges, M.wing.deep), FOOT, M.tower.top + 0.02 - 0.3, "brickTan");
  roof(b, plan, M.tower.top + 0.02, 0.3, "roofGrey");
}

export function shaft(b) {
  const plan = notched(M.shaft.plan, M.slot.shaftCorner).plan;
  // from the tower's roof's top to its own roof slab's underside, and its parapet from that slab's top, so that
  // no face of the brick lies in a side of either slab
  prism(b, plan, M.tower.top + 0.03, M.shaft.top - 0.3, "brickTan");
  // and its foot from the tower's roof's measured top (where its faces overhang the tower's, over the top band, a
  // slit showed the slab's side behind), 1 cm in from the faces it shares with the tower, behind the slab's sides
  const tower = notched(M.tower.plan, M.slot.corner).plan;
  const onTower = ([x, z]) => tower.some(([x0, z0], i) => {
    const [x1, z1] = tower[(i + 1) % tower.length], L = Math.hypot(x1 - x0, z1 - z0);
    const s = ((x - x0) * (x1 - x0) + (z - z0) * (z1 - z0)) / (L * L);
    return s > -1e-6 && s < 1 + 1e-6 && Math.abs((x - x0) * (z1 - z0) - (z - z0) * (x1 - x0)) / L < 1e-3;
  });
  const shared = plan.map((p, i) => i).filter((i) => {
    const p = plan[i], q = plan[(i + 1) % plan.length];
    return onTower(p) && onTower(q) && onTower([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]);
  });
  // (its top 3 cm over the slab's top, inside the shaft, which a walker's camera tells apart out to about 320 m;
  // both are hidden inside)
  prism(b, inset(plan, shared, 0.01), M.tower.top, M.tower.top + 0.06, "brickTan");
  roof(b, plan, M.shaft.top, 0.3, "roofGrey");
  // its parapet, standing on the walls' line, inside the outline
  for (let i = 0; i < plan.length; i++) edgeBox(b, plan, i, 0, 1, -0.25, 0, M.shaft.top + 0.01, M.shaft.parapet, "brickTan");
}

/** The floor bands, cream as MGAo's photograph shows them (round 1 drew them white): on the tower to its
 * roof, but not on the wing's faces, where the balconies' slabs and the tile fascia stand, nor across the
 * slot's recess (parts/slot.js); and on the shaft above it, the band nearest its top at the height the LiDAR
 * and the photograph give (MEASURED.band.shaft, round 3; round 2 put it at the next storey's 34.5 m). */
export function floorBands(b) {
  const { h, proud, shaft } = M.band, low = [];
  for (let y = M.floor; y < M.tower.top - 0.5; y += M.floor) low.push(y - h / 2);
  const tower = notched(M.tower.plan, M.slot.corner), top = notched(M.shaft.plan, M.slot.shaftCorner);
  bands(b, tower.plan, low, h, proud, "render", [...M.wing.edges, ...tower.notch]);
  bands(b, tower.plan, [M.tower.top - 0.35], 0.35, 0.15, "render", [...M.wing.edges, ...tower.notch]);
  bands(b, top.plan, [shaft - h / 2], h, proud, "render", top.notch);
  bands(b, top.plan, [M.shaft.top - 0.35], 0.35, 0.15, "render", top.notch);
}
