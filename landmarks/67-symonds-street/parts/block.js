// 67 Symonds Street's parts: the podium on the campus map's ring, the tower on it with its parapet, and the plant and
// core over the tower's roof. Sizes from common.js.
import { CORE, FOOT, PODIUM, PORCH, TOWER, plan } from "./common.js";
import { block, prism } from "./shapes.js";

// The walls white panels, as the photograph shows the tower; the roofs mid-grey, as the 2023 aerial shows them.
const WALL = "paint", ROOFS = "roofGrey";

export function podium(b) {
  block(b, plan(PODIUM.plan), FOOT, PODIUM.top, WALL, ROOFS);
}

/** The tower: its walls from the walls' foot (its south face goes down to the ground, the podium standing inside it
 * elsewhere) to the roof slab's underside, the parapet on them round its edge to its top, and the roof inside the
 * parapet, so that the walls are white up to the parapet's top. */
export function tower(b) {
  const [u0, u1] = TOWER.u, [w0, w1] = TOWER.w, t = TOWER.thick;
  prism(b, plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]), FOOT, TOWER.roof - 0.15, WALL);
  const inner = [[u0 + t, w0 + t], [u1 - t, w0 + t], [u1 - t, w1 - t], [u0 + t, w1 - t]];
  prism(b, plan(inner), TOWER.roof - 0.15, TOWER.roof, ROOFS);
  for (const p of [
    [[u0, w0], [u1, w0], [u1, w0 + t], [u0, w0 + t]],
    [[u0, w1 - t], [u1, w1 - t], [u1, w1], [u0, w1]],
    [[u0, w0 + t], [u0 + t, w0 + t], [u0 + t, w1 - t], [u0, w1 - t]],
    [[u1 - t, w0 + t], [u1, w0 + t], [u1, w1 - t], [u1 - t, w1 - t]],
  ]) prism(b, plan(p), TOWER.roof - 0.15, TOWER.parapet, WALL);
}

/** The porch's glass roof on the tower's south face, open under it. */
export function porch(b) {
  prism(b, plan(PORCH.plan), PORCH.y[0], PORCH.y[1], "glass");
}

export function core(b) {
  for (const c of CORE) block(b, plan(c.plan), TOWER.roof - 0.1, c.top, WALL, ROOFS);
}
