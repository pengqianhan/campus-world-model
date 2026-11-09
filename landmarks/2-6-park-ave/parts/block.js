// 2-6 Park Ave's block: its walls, eave and roof, the plant and the raised part on it, and the low parts round it
// (`body`); its east face on Park Avenue, with the balconies of its upper storeys, their rails, the glazing behind them
// and the brick ground storey (`east`). Sizes from common.js.
import {
  ANNEX, EAST, EAST_T, EAVE, FOOT, GROUND, GROUND_T, NE, NW, PLANT, RAISED, ROOF_IN, SE, SW, WALLS, inEast, lerp, plan,
  rect,
} from "./common.js";
import { block, prism } from "./shapes.js";

const WALL = "claddingPale", ROOF = "roofGrey", DARK = "screenGrey", GLASS = "glass", RAIL = "screenSilver",
  BRICK = "renderGrey", TILE = "roofTile";

/** The quad between two lines along the east face, from NE to SE: `d0` and `d1` metres in from the eave's edge. */
const strip = (d0, d1, t0 = 0, t1 = 1) => {
  const a = lerp(NE, SE, t0), b = lerp(NE, SE, t1);
  return [inEast(a, d0), inEast(b, d0), inEast(b, d1), inEast(a, d1)];
};

/** The block's walls (the ground storey's with its opening at the south-east corner) to the fascia, the eave over
 * them to the LiDAR's edge, the roof inside rising to 13.0 m, the plant, the raised part with its red roof and the
 * plant on it, and the annex. */
export function body(b) {
  prism(b, plan(GROUND.plan), FOOT, EAST.slabs[0][0], WALL);
  prism(b, plan(WALLS), EAST.slabs[0][0], EAST.fascia, WALL);
  block(b, plan([NW, NE, SE, SW]), EAST.fascia, EAVE, DARK, ROOF);
  const c = [(NW[0] + NE[0] + SE[0] + SW[0]) / 4, (NW[1] + NE[1] + SE[1] + SW[1]) / 4];
  const inner = [NW, NE, SE, SW].map((p) => {
    const d = Math.hypot(p[0] - c[0], p[1] - c[1]);
    return lerp(p, c, ROOF_IN.inset / d * Math.SQRT2);
  });
  block(b, plan(inner), EAVE - 0.05, ROOF_IN.top, WALL, ROOF);
  block(b, rect(PLANT.u, PLANT.w), ROOF_IN.top - 0.05, PLANT.top, BRICK, ROOF);
  const R = RAISED;
  block(b, rect(R.u, R.w), ROOF_IN.top - 0.05, R.top, WALL, TILE);
  block(b, rect(R.plant.u, R.plant.w), R.top - 0.05, R.plant.top, BRICK, ROOF);
  block(b, rect(ANNEX.u, ANNEX.w), FOOT, ANNEX.top, WALL, ROOF);
}

/** The east face: the ground storey's brick and windows, and at each upper storey a balcony on its slab, a rail of two
 * bars on posts at its edge, and the glazing behind it. */
export function east(b) {
  const B = EAST.back, E = EAST, [t0, t1] = EAST_T;
  prism(b, plan(strip(B - 0.05, B - 0.02, t0, GROUND_T)), 0, E.slabs[0][0], BRICK);
  prism(b, plan(strip(B - 0.08, B - 0.05, t0 + 0.02, GROUND_T - 0.02)), E.windows.y[0], E.windows.y[1], GLASS);
  const tops = [...E.slabs.map(([, y1]) => y1)], bottoms = [...E.slabs.slice(1).map(([y0]) => y0), E.fascia];
  tops.forEach((y0, i) => prism(b, plan(strip(B - 0.04, B - 0.02, t0 + 0.01, t1 - 0.01)), y0 + 0.1, bottoms[i] - 0.25, GLASS));
  const posts = 13;
  for (const [y0, y1] of E.slabs) {
    prism(b, plan(strip(0.05, B, t0, t1)), y0, y1, WALL);
    for (const r of E.rail) prism(b, plan(strip(0.08, 0.08 + E.bar, t0, t1)), y1 + r - E.bar, y1 + r, RAIL);
    for (let k = 0; k <= posts; k++) {
      const t = t0 + 0.005 + k * (t1 - t0 - 0.01) / posts, dt = 0.05 / Math.hypot(SE[0] - NE[0], SE[1] - NE[1]);
      prism(b, plan(strip(0.08, 0.08 + E.bar, t, t + dt)), y1, y1 + E.rail[1] - E.bar, RAIL);
    }
  }
}
