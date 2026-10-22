// The tower slab, its core and the stair tower in front of it (parts/common.js MEASURED.slab, core,
// stair, plant), drawn in the slab's own frame and turned by SLAB_TURN onto the podium's. The photographs
// (Alfred Street 2022-09, the south-east end 2025-05) show white concrete with ribbon windows in dark
// frames between spandrels, floor by floor; the core and stair tower blank white; the south-east end's
// ground floor glazed between dark grey piers, the entrance in its middle.
import * as THREE from "three";
import { boxesGeometry } from "../../kit/gothic.js";
import { MEASURED as M, FOOT, SLAB_TURN } from "./common.js";
import { face, ribbons, glazing, piers } from "./facade.js";

const IN = 0.3; // the mass stands this far inside the faces, behind the spandrels

export function slab(b) {
  const S = M.slab, C = M.core, P = M.podium.main;
  const [u0, u1] = S.u, [w0, w1] = S.w;
  b.matrix = new THREE.Matrix4().makeRotationY(SLAB_TURN);
  // the mass, its roof and the raised middle of the right half
  // the ground storey stands back behind its glazing on Alfred Street (1.5) and at the south-east end (0.9)
  b.box(u0 + IN, u1 - IN, 5.0, S.roof, w0 + IN, w1 - IN, "paint");
  b.box(u0 + IN, u1 - 0.9, FOOT, 5.0, w0 + IN, w1 - 1.5, "paint");
  b.box(u0 + IN + 0.3, u1 - IN - 0.3, S.roof - 0.05, S.roof + 0.02, w0 + IN + 0.3, w1 - IN - 0.3, "roofPale");
  b.box(S.raised.u[0], S.raised.u[1], S.roof, S.raised.top, S.raised.w[0], S.raised.w[1], "paint");
  // a parapet round the roof
  const par = [];
  for (const [a0, a1, c0, c1] of [[u0, u1, w1 - 0.25, w1], [u0, u1, w0, w0 + 0.25]]) par.push([a0, a1, S.roof - 0.4, S.roof + 0.25, c0, c1]);
  for (const [a0, a1] of [[u0, u0 + 0.25], [u1 - 0.25, u1]]) par.push([a0, a1, S.roof - 0.4, S.roof + 0.25, w0, w1]);
  b.add(boxesGeometry(par), "paint");
  // the floors' edges stand out of the roof's: on Alfred Street 1.2 m on the right half and 0.3 m on the
  // left, at the back 0.55 m, at the north-west end 0.3 m (the LiDAR's points on each floor's sill, at
  // w 9.4-9.75, 8.6-8.8 and -10.4 to -10.5, u -31.7): ribbon windows on those planes, their spandrels
  // reaching back to the mass
  const top = S.roof - 0.4, E = S.edges, mw0 = w0 + IN, mw1 = w1 - IN;
  ribbons(b, face("z", E.frontLeft, 1, E.nw, C.u[0]), P.top, top, S.floors, { deep: E.frontLeft - mw1 });
  ribbons(b, face("z", E.frontRight, 1, C.u[1], u1), 5.0, top, S.floors, { deep: E.frontRight - mw1 });
  ribbons(b, face("z", E.back, -1, E.nw, C.u[0]), P.top, top, S.floors, { deep: mw0 - E.back });
  ribbons(b, face("z", E.back, -1, C.u[1], u1), M.podium.middle.top, top, S.floors, { deep: mw0 - E.back });
  // the right half's ground floor on Alfred Street: dark glazing set back behind the first floor's edge
  glazing(b, face("z", w1, 1, C.u[1], u1), M.ground.frontRight - 0.2, 5.0, { inset: 1.2, bay: 3.0 });
  // the south-east end: ribbons above the ground floor, which is glazed between dark piers (the entrance)
  ribbons(b, face("x", u1, 1, E.back, E.frontRight), 5.0, top, S.floors, { deep: 0.6 });
  glazing(b, face("x", u1, 1, w0, w1), M.ground.seEnd, 5.0, { inset: 0.6, bay: 4.4 });
  piers(b, face("x", u1, 1, w0, w1), FOOT, 5.0, { bay: 4.4 });
  // the north-west end above the podium: ribbons too (Qaci's upper view)
  ribbons(b, face("x", E.nw, -1, E.back, E.frontLeft), P.top, top, S.floors, { deep: u0 + IN - E.nw });
  b.matrix = null;
}

export function core(b) {
  const C = M.core, T = M.stair, Q = M.plant;
  b.matrix = new THREE.Matrix4().makeRotationY(SLAB_TURN);
  b.box(C.u[0], C.u[1], FOOT, C.roof, C.w[0], C.w[1], "paint");
  b.box(C.u[0] + 0.3, C.u[1] - 0.3, C.roof - 0.05, C.roof + 0.02, C.w[0] + 0.3, C.w[1] - 0.3, "roofPale");
  // the stair tower in front of the core, up to just over the slab's roof
  b.box(T.u[0], T.u[1], FOOT, T.top, T.w[0], T.w[1], "paint");
  // the plant on the core's roof
  b.box(Q.u[0], Q.u[1], C.roof, Q.top, Q.w[0], Q.w[1], "paint");
  b.matrix = null;
}
