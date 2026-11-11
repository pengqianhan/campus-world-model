// Fine Arts Studio Block 433's massing, from the LiDAR: the main block, its walls rising at each end to the vault's
// underside; the vault, a slab bowed out in plan at both ends; and at the east-north-east end the lower block rounded
// in plan and the plant room on the vault. Sizes from common.js.
import * as THREE from "three";
import { EAST, FOOT, VAULT, WALL, Y, at, plan, vaultEast, vaultEnd, vaultTop } from "./common.js";
import { block, prism, tris } from "./shapes.js";

const YELLOW = "claddingYellow", ROOF = "roofPale", GREY = "claddingPale";
const N = 16;  // the vault's segments across the faces
const across = (w0, w1) => Array.from({ length: N + 1 }, (_, i) => w0 + ((w1 - w0) * i) / N);

/** The main block: its section across the faces (the walls from FOOT to the vault's underside, the gable's top
 * following it) run along x from the east-north-east end wall to the west-south-west one. */
export function body(b) {
  const W = WALL.w, top = (w) => Y(vaultTop(w) - VAULT.t) - 0.01;
  // Drawn in (-w, y), so that, turned a quarter round y, -w becomes +z and the extrusion runs along +x.
  const pts = [[-W, FOOT], [W, FOOT], ...across(W, -W).map((w) => [w, top(w)])];
  const s = new THREE.Shape(pts.map(([w, y]) => new THREE.Vector2(-w, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: WALL.east - WALL.west, bevelEnabled: false, curveSegments: 1 });
  g.rotateY(Math.PI / 2);
  g.translate(-WALL.east, 0, 0);
  b.add(g, YELLOW);
}

/** The vault: its top and underside between the bowed ends, the fascia round its edge. */
export function roof(b) {
  const ws = across(VAULT.half, -VAULT.half), t = VAULT.t;
  const p = (u, w, d) => { const [x, z] = at(u, w); return [x, Y(vaultTop(w)) - d, z]; };
  const west = (d) => ws.map((w) => p(vaultEnd(w, VAULT.west), w, d)), east = (d) => ws.map((w) => p(vaultEast(w), w, d));
  const sheet = (A, B) => { const l = []; for (let i = 0; i < N; i++) l.push([A[i], A[i + 1], B[i + 1]], [A[i], B[i + 1], B[i]]); return l; };
  const [wt, et, wb, eb] = [west(0), east(0), west(t), east(t)];
  tris(b, sheet(wt, et), ROOF, "up");
  tris(b, sheet(wb, eb), ROOF, "down");
  const mid = -(VAULT.west[1] + vaultEast(0)) / 2;  // x at the vault's middle: each edge faces away from it
  const edge = [...sheet(wt, wb), ...sheet(et, eb), [wt[0], et[0], eb[0]], [wt[0], eb[0], wb[0]], [wt[N], et[N], eb[N]], [wt[N], eb[N], wb[N]]];
  tris(b, edge, ROOF, ([x, z]) => [2 * x - mid, 2 * z]);
  // the gutters along the eaves, under the vault's edge and out past it, stopping 0.6 m short of its ends
  const g = VAULT.gutter, e = vaultTop(VAULT.half);
  for (const side of [1, -1]) {
    const w0 = side * (VAULT.half - 0.05), w1 = side * (VAULT.half + g), u0 = vaultEnd(VAULT.half, VAULT.west) + 0.6, u1 = vaultEast(VAULT.half) - 0.6;
    block(b, plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]), Y(e - VAULT.t - 0.05), Y(e - 0.05), ROOF, ROOF, 0.02);
  }
}

/** The east-north-east end: the lower block rounded in plan, its roof over its walls, and the plant room on it. */
export function east(b) {
  prism(b, plan(EAST.low.walls), FOOT, Y(EAST.low.top - 0.3), YELLOW);
  prism(b, plan(EAST.low.roof), Y(EAST.low.top - 0.3), Y(EAST.low.top + 0.01), ROOF);
  block(b, plan(EAST.plant.walls), Y(EAST.plant.foot), Y(EAST.plant.top), GREY, ROOF, 0.3);
  prism(b, plan(EAST.plant.roof), Y(EAST.plant.top - 0.3), Y(EAST.plant.top + 0.01), ROOF);
}
