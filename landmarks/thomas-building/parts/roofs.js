// The roofs behind the parapets: over each range a storey set back from the gutter, under roofs in
// planes fitted to the LiDAR (parts/common.js); the plant room at the east corner. Drawn in the
// building's own axes (u, v); model.js turns it.
import { MEASURED } from "./common.js";
import { rect, slab } from "./shapes.js";

const M = MEASURED, G = M.parapet.gutter, T = 0.25; // the roof's own thickness over its walls

/** A set-back storey over the plan, its walls from the gutter, its roof the plane `top`. */
function storey(b, plan, top) {
  slab(b, plan, () => G, (u, v) => top(u, v) - T, "grey");
  slab(b, plan, (u, v) => top(u, v) - T, (u, v) => top(u, v), "roofGrey");
}

export function roofs(b) {
  const R = M.roofs;
  // the back range: a ridge, steeper to the outside
  storey(b, rect(R.nw.u, [R.nw.v[0], R.nw.ridge]), (u, v) => R.nw.top + R.nw.out * (v - R.nw.ridge));
  storey(b, rect(R.nw.u, [R.nw.ridge, R.nw.v[1]]), (u, v) => R.nw.top - R.nw.in * (v - R.nw.ridge));
  // the range to the road: a sawtooth, its high edge toward the road
  const s = R.se;
  storey(b, rect(s.u, [s.v[0], s.b[0]]), (u, v) => s.a[1] + s.a[2] * (v - s.a[0]));
  storey(b, rect(s.u, [s.b[0], s.b[1]]), () => s.b[2]);
  storey(b, rect(s.u, [s.b[1], s.v[1]]), (u, v) => s.c[1] + s.c[2] * (v - s.c[0]));
  storey(b, rect(R.seEast.u, R.seEast.v), () => R.seEast.top);
  // the south-west range: a gentle slope up from the end wall, the raised strip, a steep slope down
  const w = R.sw;
  storey(b, rect(w.out.u, w.out.v), (u) => w.out.y + w.out.k * (u - w.out.at));
  storey(b, rect(w.in.u, w.in.v), (u) => w.in.y + w.in.k * (u - w.in.at));
  // the north-east range: two slopes either side of a valley
  const e = R.ne;
  storey(b, rect(e.a.u, e.v), (u) => e.a.y + e.a.k * (u - e.a.at));
  storey(b, rect(e.valley.u, e.v), () => e.valley.y);
  storey(b, rect(e.b.u, e.v), (u) => e.b.y + e.b.k * (u - e.b.at));
}

/** The plant room at the east corner. */
export function plant(b) {
  const p = M.plant;
  b.box(p.u[0], p.u[1], G, p.top, p.v[0], p.v[1], "grey");
}
