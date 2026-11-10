// Fine Arts Studio Block 431's parts: the main block's walls up to its two pitches and the step between them, the
// roof's slabs, the east end's roof falling to the south, its glass stair tower, lower roof and canopy, the annex on
// the north side and the low box before the south face. Sizes from common.js.
import { ANNEX, BOX, EAST, EAVE, FOOT, ROOF, WALL, Y, across, at, plan, planW } from "./common.js";
import { block, prism, tris } from "./shapes.js";

// The walls and the fascia the beige-grey of the photograph's panels; the roofs light grey, as the 2023 aerial shows
// them (luma 200 on the sunlit north pitch, 123 on the south); the stair tower and the canopy glass, as the photograph
// of the east entrance shows them.
const WALLS = "claddingPale", ROOFS = "roofPale", GLASS = "glassPale";

/** A point [x, y, z] of the view frame at (u, w') and the elevation z. */
const p3 = (u, wp, z) => { const [x, zz] = at(u, wp); return [x, Y(z), zz]; };
/** A quad of four points as two triangles. */
const quad = (a, b2, c, d) => [[a, b2, c], [a, c, d]];
/** Faces turned away from a point (u, w') of the plan. */
const awayFrom = (u, wp) => ([x, z]) => { const m = at(u, wp); return [2 * x - m[0], 2 * z - m[1]]; };

const U0 = EAVE.east + WALL.in, U0N = EAVE.eastNorth + WALL.in, U1 = EAVE.west - WALL.in;   // the walls' ends
const WS = WALL.south, WN = WALL.north, P = EAVE.part;
const BASE = ROOF.south(WS) - ROOF.t;                                                    // the south wall's top
const s = (wp) => ROOF.south(wp) - ROOF.t, n = (wp) => ROOF.north(wp) - ROOF.t;           // the slabs' undersides

/** The walls: all round from the walls' foot to the south wall's top; under the south pitch its two end walls up to
 * its slab; under the north pitch, north of w' -4 from the east end of its north part and south of it from the main
 * block's east end, its north wall, its end walls, the face over w' -4 where the north part runs on east, and the
 * step's face over w' 0, up to its slab. */
export function body(b) {
  prism(b, plan([[U0N, WN], [U1, WN], [U1, WS], [U0, WS], [U0, P], [U0N, P]]), FOOT, Y(BASE), WALLS);
  const list = [];
  for (const u of [U0, U1]) list.push([p3(u, 0, BASE), p3(u, WS, BASE), p3(u, 0, s(0))]);
  for (const [u, w0, w1] of [[U0N, WN, P], [U0, P, 0], [U1, WN, 0]]) {
    list.push(...quad(p3(u, w0, BASE), p3(u, w1, BASE), p3(u, w1, n(w1)), p3(u, w0, n(w0))));
  }
  list.push(...quad(p3(U0N, WN, BASE), p3(U1, WN, BASE), p3(U1, WN, n(WN)), p3(U0N, WN, n(WN))));
  list.push(...quad(p3(U0N, P, BASE), p3(U0, P, BASE), p3(U0, P, n(P)), p3(U0N, P, n(P))));
  list.push(...quad(p3(U0, 0, BASE), p3(U1, 0, BASE), p3(U1, 0, n(0)), p3(U0, 0, n(0))));
  tris(b, list, WALLS, awayFrom((U0 + U1) / 2, -2.5));
}

/** A sloped slab over u0 to u1 and w'0 to w'1, its top on the plane `top` (a function of w'), `t` thick: its top in
 * the roof's material, its underside and its edges (the fascia) in the walls'. */
function slab(b, [u0, u1], [w0, w1], top) {
  const T = (u, wp) => p3(u, wp, top(wp)), B = (u, wp) => p3(u, wp, top(wp) - ROOF.t);
  tris(b, quad(T(u0, w0), T(u1, w0), T(u1, w1), T(u0, w1)), ROOFS, "up");
  tris(b, quad(B(u0, w0), B(u1, w0), B(u1, w1), B(u0, w1)), WALLS, "down");
  tris(b, [
    ...quad(B(u0, w0), B(u1, w0), T(u1, w0), T(u0, w0)), ...quad(B(u0, w1), B(u1, w1), T(u1, w1), T(u0, w1)),
    ...quad(B(u0, w0), B(u0, w1), T(u0, w1), T(u0, w0)), ...quad(B(u1, w0), B(u1, w1), T(u1, w1), T(u1, w0)),
  ], WALLS, awayFrom((u0 + u1) / 2, (w0 + w1) / 2));
}

/** The roof: the north pitch's slab, from its eave to w' -4 along the whole block with its north part, and from there
 * to the step along the main block; the south pitch's from the step to its eave; and east of the main block the roof
 * falling to the south over w' -4 to 5. */
export function roof(b) {
  slab(b, [EAVE.eastNorth, EAVE.west], [EAVE.north, P], ROOF.north);
  slab(b, [EAVE.east, EAVE.west], [P, 0], ROOF.north);
  slab(b, [EAVE.east, EAVE.west], [0, EAVE.south], ROOF.south);
  slab(b, ROOF.eastU.north, [P, 0], ROOF.east);
  slab(b, ROOF.eastU.south, [0, ROOF.eastSouth], ROOF.east);
}

/** The east end: under its roof the walls (into the main block's by 0.15 m, and into the north part's by 0.2 m), up to
 * the roof's underside, 0.35 m in from its edges: north of w' 0 from u -20.85, south of it from -19.85; the glass stair
 * tower (from 2 cm under the walls' foot, so that its floor and the walls' do not lie in one plane), the lower roof
 * north of it and the entrance's glass canopy from that roof's east face, open under it. */
export function east(b) {
  const w0 = P - 0.2, w1 = ROOF.eastSouth - WALL.in, u1 = U0 + 0.15, e = (wp) => ROOF.east(wp) - ROOF.t;
  const uS = ROOF.eastU.south[0] + WALL.in;
  // the north part to the roof's underside over w' 0, the south part to its underside over its south wall; and the
  // end walls up to the roof (the west one closes it over the south pitch, which stands lower)
  for (const [ue, a, c, top] of [[U0N, w0, 0, e(0)], [uS, 0, w1, e(w1)]]) {
    prism(b, plan([[ue, a], [u1, a], [u1, c], [ue, c]]), FOOT, Y(top), WALLS);
    for (const u of [ue, u1]) {
      const gable = quad(p3(u, a, top), p3(u, c, top), p3(u, c, e(c)), p3(u, a, e(a)));
      tris(b, gable, WALLS, awayFrom((ue + u1) / 2, (a + c) / 2));
    }
  }
  const { stair, low, canopy } = EAST;
  prism(b, planW(stair.plan), FOOT - 0.02, Y(stair.top), GLASS);
  block(b, planW(low.plan), FOOT, Y(low.top), WALLS, ROOFS);
  prism(b, planW(canopy.plan), Y(canopy.y[0]), Y(canopy.y[1]), GLASS);
}

/** The annex on the north side, its plan into the main block's north wall. */
export function annex(b) {
  block(b, planW(ANNEX.plan), FOOT, Y(ANNEX.top), WALLS, ROOFS);
}

/** The low box before the south face, from 0.15 m inside the face out to its front. */
export function box(b) {
  const [u0, u1] = BOX.u, w = (u) => across(u, WS - 0.15);
  block(b, planW([[u0, w(u0)], [u1, w(u1)], [u1, BOX.w], [u0, BOX.w]]), FOOT, Y(BOX.top), WALLS, ROOFS);
}
