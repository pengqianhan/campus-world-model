// Fine Arts Studio Block 431's parts: the main block's walls up to its two pitches and the step between them, the
// roof's two slabs, the east end's block, stair tower and lower roof, the annex on the north side and the low box
// before the south face. Sizes from common.js.
import { ANNEX, BOX, EAST, EAVE, FOOT, IN, ROOF, Y, across, at, plan, planW } from "./common.js";
import { block, prism, tris } from "./shapes.js";

// The walls and the fascia the beige-grey of the photograph's panels; the roofs light grey, as the 2023 aerial shows
// them (luma 200 on the sunlit north pitch, 123 on the south); the stair tower glass.
const WALL = "claddingPale", ROOFS = "roofPale", GLASS = "glassPale";

/** A point [x, y, z] of the view frame at (u, w') and the elevation z. */
const p3 = (u, wp, z) => { const [x, zz] = at(u, wp); return [x, Y(z), zz]; };
/** A quad of four points as two triangles. */
const quad = (a, b2, c, d) => [[a, b2, c], [a, c, d]];
/** Faces turned away from the plan's middle (u, w'). */
const away = (u, wp) => () => at(u, wp);

const S = { u0: EAVE.east.south + IN, u1: EAVE.west - IN, w1: EAVE.south - IN };  // the south half's walls
const N = { u0: EAVE.east.north + IN, u1: EAVE.west - IN, w0: EAVE.north + IN };  // the north half's walls
const BASE = ROOF.south(S.w1) - ROOF.t;                                            // the south wall's top

/** The walls: all round from the walls' foot to the south wall's top, under the south pitch the two end walls up to
 * its slab, and under the north pitch its north wall, its two end walls and the step's face over w' 0, up to its
 * slab. */
export function body(b) {
  prism(b, plan([[N.u0, N.w0], [N.u1, N.w0], [S.u1, S.w1], [S.u0, S.w1], [S.u0, 0], [N.u0, 0]]), FOOT, Y(BASE), WALL);
  const s = (wp) => ROOF.south(wp) - ROOF.t, n = (wp) => ROOF.north(wp) - ROOF.t, list = [];
  for (const u of [S.u0, S.u1]) list.push([p3(u, 0, BASE), p3(u, S.w1, BASE), p3(u, 0, s(0))]);
  for (const u of [N.u0, N.u1]) list.push(...quad(p3(u, N.w0, BASE), p3(u, 0, BASE), p3(u, 0, n(0)), p3(u, N.w0, n(N.w0))));
  list.push(...quad(p3(N.u0, N.w0, BASE), p3(N.u1, N.w0, BASE), p3(N.u1, N.w0, n(N.w0)), p3(N.u0, N.w0, n(N.w0))));
  list.push(...quad(p3(N.u0, 0, BASE), p3(N.u1, 0, BASE), p3(N.u1, 0, n(0)), p3(N.u0, 0, n(0))));
  tris(b, list, WALL, ([x, z]) => { const m = at((N.u0 + N.u1) / 2, -2); return [2 * x - m[0], 2 * z - m[1]]; });
}

/** A sloped slab over u0 to u1 and w'0 to w'1, its top on the plane `top` (a function of w'), `t` thick: its top in
 * the roof's material, its underside and its edges (the fascia) in the walls'. */
function slab(b, [u0, u1], [w0, w1], top) {
  const T = (u, wp) => p3(u, wp, top(wp)), B = (u, wp) => p3(u, wp, top(wp) - ROOF.t);
  tris(b, quad(T(u0, w0), T(u1, w0), T(u1, w1), T(u0, w1)), ROOFS, "up");
  tris(b, quad(B(u0, w0), B(u1, w0), B(u1, w1), B(u0, w1)), WALL, "down");
  const mid = at((u0 + u1) / 2, (w0 + w1) / 2), out = ([x, z]) => [2 * x - mid[0], 2 * z - mid[1]];
  tris(b, [
    ...quad(B(u0, w0), B(u1, w0), T(u1, w0), T(u0, w0)), ...quad(B(u0, w1), B(u1, w1), T(u1, w1), T(u0, w1)),
    ...quad(B(u0, w0), B(u0, w1), T(u0, w1), T(u0, w0)), ...quad(B(u1, w0), B(u1, w1), T(u1, w1), T(u1, w0)),
  ], WALL, out);
}

/** The roof: the north pitch's slab from its eave to the step, the south pitch's from the step to its eave. */
export function roof(b) {
  slab(b, [EAVE.east.north, EAVE.west], [EAVE.north, 0], ROOF.north);
  slab(b, [EAVE.east.south, EAVE.west], [0, EAVE.south], ROOF.south);
}

/** The east end: the flat block east of the south half (into the main block's walls by 0.15 m), the glass stair
 * tower and the lower roof north of it, each from the walls' foot; and the entrance's glass canopy from the stair
 * tower's east face, open under it. */
export function east(b) {
  const { block: k, stair, low, canopy } = EAST;
  block(b, plan([[k.u[0], k.wp[0] - 0.2], [S.u0 + 0.15, k.wp[0] - 0.2], [S.u0 + 0.15, k.wp[1]], [k.u[0], k.wp[1]]]),
    FOOT, Y(k.top), WALL, ROOFS);
  prism(b, planW(stair.plan), FOOT, Y(stair.top), GLASS);
  block(b, planW(low.plan), FOOT, Y(low.top), WALL, ROOFS);
  prism(b, planW(canopy.plan), Y(canopy.y[0]), Y(canopy.y[1]), GLASS);
}

/** The annex on the north side, its plan into the main block's north wall. */
export function annex(b) {
  block(b, planW(ANNEX.plan), FOOT, Y(ANNEX.top), WALL, ROOFS);
}

/** The low box before the south face, from 0.15 m inside the face out to its front: its walls, and its roof over
 * them and on west of them as a canopy, open under it. */
export function box(b) {
  const [u0, u1] = BOX.u, w = (u) => across(u, S.w1 - 0.15), at4 = (a, c) => planW([[a, w(a)], [c, w(c)], [c, BOX.w], [a, BOX.w]]);
  prism(b, at4(u0, u1), FOOT, Y(BOX.top - 0.15), WALL);
  prism(b, at4(u0, BOX.roof), Y(BOX.top - 0.15), Y(BOX.top + 0.01), ROOFS);
}
