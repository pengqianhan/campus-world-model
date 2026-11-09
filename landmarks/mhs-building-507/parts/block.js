// Building 507's roofs at 18 m with the walls under them, each side in its own material (the street face finned over
// its glazed base, the steps' fronts glazed and their sides dark, the rest plain); the raised parts on them, the lower
// parts beside them and the canopy over the entrance. Sizes from common.js.
import { CANOPY, FACE, FOOT, LOWER, MAIN, RAISED, at, plan } from "./common.js";
import { block, prism, tris } from "./shapes.js";

// The faces no photograph shows plain mid grey; the street face's fins and the steps' sides near black; glass; the
// roofs grey, as the 2023 aerial shows them.
const WALL = "grey", FIN = "screenBlack", GLASS = "glass", ROOF = "roofGrey";

/** Walls round a plan [[u, w], ...] from y0 to y1, side i in the materials face(i): [[material, from, to], ...] (heights
 * within y0 to y1), each facing out of the plan. */
function walls(b, corners, y0, y1, face) {
  const n = corners.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [u0, w0] = corners[i], [u1, w1] = corners[(i + 1) % n];
    area += u0 * w1 - u1 * w0;
  }
  const s = Math.sign(area);  // > 0: counter-clockwise in (u, w), the plan on each side's left
  for (let i = 0; i < n; i++) {
    const [u0, w0] = corners[i], [u1, w1] = corners[(i + 1) % n], len = Math.hypot(u1 - u0, w1 - w0);
    const [ox, oz] = at(s * (w1 - w0) / len, -s * (u1 - u0) / len);  // out of the plan
    const [x0, z0] = at(u0, w0), [x1, z1] = at(u1, w1);
    for (const [m, ya, yb] of face(i, y0, y1)) {
      tris(b, [[[x0, ya, z0], [x1, ya, z1], [x1, yb, z1]], [[x0, ya, z0], [x1, yb, z1], [x0, yb, z0]]], m,
        ([x, z]) => [x + ox, z + oz]);
    }
  }
}

export function main(b) {
  const M = MAIN, t = 0.15;
  walls(b, M.plan, FOOT, M.top - t, (i, y0, y1) =>
    i === M.face ? [[GLASS, y0, FACE.base], [FIN, FACE.base, y1]]
      : M.fronts.includes(i) ? [[GLASS, y0, y1]]
        : M.sides.includes(i) ? [[FIN, y0, y1]]
          : [[WALL, y0, y1]]);
  prism(b, plan(M.plan), M.top - t, M.top + 0.01, ROOF);
}

export function raised(b) {
  for (const R of RAISED) block(b, plan(R.plan), MAIN.top - 0.3, R.top, WALL, ROOF);
}

export function lower(b) {
  for (const L of LOWER) block(b, plan(L.plan), FOOT, L.top, WALL, ROOF);
}

export function canopy(b) {
  prism(b, plan(CANOPY.plan), CANOPY.y[0], CANOPY.y[1], FIN);
}
