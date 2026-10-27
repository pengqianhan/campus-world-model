// The two pavilions on the lawn side (parts/common.js MEASURED.pavilions): each ends in a low stone gable
// toward the lawn, coped, over a pair of segmental-headed windows upstairs and a row of narrow ones below,
// spaced evenly about the gable's apex (EX9b's wide view: four of the west pavilion's lower windows show,
// the fifth place is behind a tree; the east pavilion is half behind the basalt wall and drawn the same).
// A low grey roof along z behind each gable (the aerial). The west pavilion's side toward the stair tower
// has one window upstairs and two below; the other sides are in no photograph. Round 1 (the lead).
import { MEASURED as M, FOOT } from "./common.js";
import { roofZ, facing, beam, wall } from "./shapes.js";
import { UPPER, LOWER } from "./range.js";

const T = 0.4;

function gableFront(b, x0, x1, z) {
  const P = M.pavilion, W = x1 - x0, cx = (x0 + x1) / 2, fl = M.range.floor;
  const poly = [[0, 0], [W, 0], [W, P.eave - FOOT], [W / 2, P.apex - FOOT], [0, P.eave - FOOT]];
  const wins = [
    { ...UPPER, x: cx - 1.3, y: fl + 0.8 }, { ...UPPER, x: cx + 1.3, y: fl + 0.8 },
    ...[-2, -1, 0, 1, 2].map((k) => ({ ...LOWER, x: cx + k * 1.3, y: 0.85 })),
  ];
  wall(b, poly, x0, FOOT, z, T, wins);
  // the coping along the gable's two slopes
  for (const s of [-1, 1]) beam(b, [cx + s * (W / 2 + 0.1), P.eave + 0.06, z - 0.15], [cx, P.apex + 0.1, z - 0.15], 0.5, 0.16, "dressed");
}

export function pavilions(b) {
  const P = M.pavilion, [w, e] = M.pavilions;
  for (const p of [w, e]) {
    const inner = p === w ? [p.x[0], p.x[1] - T] : [p.x[0], p.x[1]];
    b.box(inner[0], inner[1], FOOT, P.eave, p.z[0], p.z[1] - T, "ashlar");
    gableFront(b, p.x[0], p.x[1], p.z[1]);
    roofZ(b, p.x[0] - 0.2, p.x[1] + 0.2, 4.0, p.z[1] - 0.2, P.eave, P.ridge, (p.x[0] + p.x[1]) / 2, 0, "roofGrey");
  }
  // the west pavilion's side toward the stair tower (facing +x), z 8.2 to 13.05
  facing(b, "+x", 0, 0, () => {
    const z0 = w.z[0], z1 = w.z[1] - T, x = w.x[1], len = z1 - z0, mid = -(z0 + z1) / 2, fl = M.range.floor;
    wall(b, [[0, 0], [len, 0], [len, P.eave - FOOT], [0, P.eave - FOOT]], -z1, FOOT, x, T,
      [{ ...UPPER, w: 1.1, lights: 1, x: mid, y: fl + 0.8 }, { ...LOWER, x: mid - 0.6, y: 0.85 }, { ...LOWER, x: mid + 0.6, y: 0.85 }]);
  });
}
