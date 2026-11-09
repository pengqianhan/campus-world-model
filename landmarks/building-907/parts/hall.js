// Building 907's hall: its walls of white metal cladding to the eaves, its two ends up to the vault's arc, and the
// vault. Sizes from common.js.
import { FOOT, HALL, OPENINGS, at, rect } from "./common.js";
import { loft, prism, tris } from "./shapes.js";

const WALL = "paint", ROOF = "roofPale";

/** The vault's arc across the hall at u, from one eave to the other: [[x, y, z], ...]. */
export function arc(u) {
  const half = HALL.vault.map(([w, h]) => [w, h]);
  const pts = [...half.slice(1).reverse().map(([w, h]) => [-w, h]), ...half];
  return pts.map(([w, h]) => { const [x, z] = at(u, w); return [x, h, z]; });
}

/** The walls from FOOT to the eaves, each end's face up to the arc, and the vault. */
export function hall(b) {
  const [u0, u1] = HALL.u, W = HALL.w, eave = HALL.vault[HALL.vault.length - 1][1];
  prism(b, rect([u0, u1], [-W, W]), FOOT, eave, WALL);
  for (const u of [u0, u1]) {
    const a = arc(u), [mx, mz] = at(u, 0), mid = [mx, eave, mz];
    const list = [];
    for (let i = 0; i < a.length - 1; i++) list.push([mid, a[i], a[i + 1]]);
    // facing out of the hall, along x
    tris(b, list, WALL, ([x, z]) => [x + Math.sign(x) * 10, z]);
  }
  loft(b, arc(u0), arc(u1), ROOF);
}

/** The band of glazing on the west-north-west end: its dark frame standing 0.03 m out of the wall, the glass 0.01 to
 * 0.06 m out over it (0.1 m in from the frame's edge), the pale strip across it 0.02 to 0.09 m out (0.05 m past the
 * glass at each end, so that no side of it lies in a side of the glass). */
export function glazing(b) {
  const u = HALL.u[1], G = OPENINGS.hallGlazing, [w0, w1] = G.w;
  prism(b, rect([u, u + 0.03], [w0 - 0.1, w1 + 0.1]), FOOT + 0.1, G.top + 0.1, "screenBlack");
  prism(b, rect([u + 0.01, u + 0.06], [w0, w1]), FOOT + 0.2, G.top, "glass");
  prism(b, rect([u + 0.02, u + 0.09], [w0 - 0.05, w1 + 0.05]), G.strip[0], G.strip[1], WALL);
}
