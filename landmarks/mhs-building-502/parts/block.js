// Building 502's main block and its lower west part: walls from FOOT up to their roofs' edges, the roofs as the lowest
// of their fitted planes over each convex piece of their plans, the step where the main roof's middle stands over its
// lower ends, the raised part and the two plant rooms. Sizes from common.js.
import { CORE, FACES, FOOT, H, MAIN, PLANT_E, PLANT_W, WEST, at, rect, viewPlane } from "./common.js";
import { block, envelope, tris } from "./shapes.js";

// Pale concrete and panels; the north face's fins and textured spandrels together a mid grey; the east end's glazed
// strip near black; the roof's skirt dark metal; the east plant room's white lattice.
const WALL = "claddingPale", NORTH = "grey", DARK = "screenBlack", SKIRT = "screenGrey", ROOF = "roofGrey", PLANT = "paint";

const height = (P, u, w) => H(P[0] + P[1] * u + P[2] * w);
/** The main roof's height at (u, w): its middle has only the north and south slopes, each end its own hip too. */
export function mainRoof(u, w) {
  const M = MAIN, hs = [height(M.north, u, w), height(M.south, u, w)];
  if (u < M.ends[0]) hs.push(height(M.west, u, w));
  if (u > M.ends[1]) hs.push(height(M.east, u, w));
  return Math.min(...hs);
}
const westRoof = (u, w) => Math.min(height(WEST.north, u, w), height(WEST.south, u, w), height(WEST.west, u, w));

/** The strip's north edge's w at u (between its corners). */
function stripW(u) {
  const S = MAIN.strip;
  for (let i = 0; i + 1 < S.length; i++) {
    const [u0, w0] = S[i], [u1, w1] = S[i + 1];
    if (u >= u0 - 1e-9 && u <= u1 + 1e-9) return w0 + (w1 - w0) * (u - u0) / (u1 - u0);
  }
  throw new Error(`u ${u} off 501's strip`);
}

/** Walls under a line of plan points [[u, w], ...] (the building on its left), from y0 up to roof(u, w), in steps
 * of at most 0.5 m so that the top follows the roof's edge: each side in face(i) (its material) up to `skirt`, and
 * in SKIRT above it. */
function wallsUnder(b, line, roof, y0, skirt, face) {
  for (let i = 0; i + 1 < line.length; i++) {
    const [ua, wa] = line[i], [ub, wb] = line[i + 1], len = Math.hypot(ub - ua, wb - wa), n = Math.max(1, Math.ceil(len / 0.5));
    const out = [(wb - wa) / len, -(ub - ua) / len];  // to the right of the line, out of the building, in (u, w)
    const low = [], high = [];
    const P = (r, y) => { const [x, z] = at(...r); return [x, y, z]; };
    for (let k = 0; k < n; k++) {
      const p = [ua + (ub - ua) * k / n, wa + (wb - wa) * k / n], q = [ua + (ub - ua) * (k + 1) / n, wa + (wb - wa) * (k + 1) / n];
      const tp = roof(...p), tq = roof(...q), sp = Math.min(skirt, tp), sq = Math.min(skirt, tq);
      low.push([P(p, y0), P(q, y0), P(q, sq)], [P(p, y0), P(q, sq), P(p, sp)]);
      high.push([P(p, sp), P(q, sq), P(q, tq)], [P(p, sp), P(q, tq), P(p, tp)]);
    }
    const [ox, oz] = at(...out), way = ([x, z]) => [x + ox, z + oz];
    tris(b, low, face(i), way);
    tris(b, high, SKIRT, way);
  }
}

export function main(b) {
  const M = MAIN, [uW, uE] = M.u, [wS, wN] = M.w, [e0, e1] = M.ends, s0 = M.strip[0];
  const N = viewPlane(M.north), S = viewPlane(M.south), Wp = viewPlane(M.west), Ep = viewPlane(M.east);
  const sw = (u) => stripW(u);
  // the roof over four convex pieces: west of the strip, the strip's west end to the middle, the middle, the east end
  envelope(b, rect([uW, s0[0]], [wS, wN]), [N, S, Wp], ROOF);
  envelope(b, [at(s0[0], s0[1]), at(e0, sw(e0)), at(e0, wN), at(s0[0], wN)], [N, S, Wp], ROOF);
  envelope(b, [at(e0, sw(e0)), at(...M.strip[1]), at(e1, sw(e1)), at(e1, wN), at(e0, wN)], [N, S], ROOF);
  envelope(b, [at(e1, sw(e1)), at(uE, sw(uE)), at(uE, wN), at(e1, wN)], [N, S, Ep], ROOF);
  // the walls round it, the building on the left of the line (counter-clockwise in u, w)
  // the east end's dark glazed strip south of w FACES.eastStrip, its pale panels north of it; the north face grey
  const line = [[uW, wS], [s0[0], wS], s0, M.strip[1], [uE, sw(uE)], [uE, FACES.eastStrip], [uE, wN], [uW, wN], [uW, wS]];
  const face = (i) => (i === 4 ? DARK : i === 6 ? NORTH : WALL);
  wallsUnder(b, line, mainRoof, FOOT, FACES.skirt, face);
  // the steps up from each lower end to the middle: a triangle under the middle's two slopes, over the end's hip
  // (heights before H: the end's hip at u, where each slope reaches it, and the ridge)
  for (const [u, end, face] of [[e0, M.west, 1], [e1, M.east, -1]]) {
    const n = M.north, s = M.south, hr = end[0] + end[1] * u;
    const wN = (hr - n[0]) / n[2], wS = (hr - s[0]) / s[2], wR = (s[0] - n[0]) / (n[2] - s[2]), ridge = n[0] + n[2] * wR;
    const P = (w, y) => { const [x, z] = at(u, w); return [x, H(y), z]; };
    tris(b, [[P(wS, hr), P(wR, ridge), P(wN, hr)]], WALL, ([x, z]) => [x + face, z]);  // facing the lower end
  }
}

export function west(b) {
  const Wd = WEST, [uW, uE] = Wd.u, [wS, wN] = Wd.w;
  envelope(b, rect([uW, uE], [wS, wN]), [viewPlane(Wd.north), viewPlane(Wd.south), viewPlane(Wd.west)], ROOF);
  // its north, west and south walls; its east side stands against the main block's west wall
  wallsUnder(b, [[uE, wN], [uW, wN], [uW, wS], [uE, wS]], westRoof, FOOT, FACES.westSkirt, () => WALL);
  block(b, rect(CORE.u, CORE.w), H(24.5), CORE.top, WALL, ROOF);
}

export function plant(b) {
  block(b, rect(PLANT_W.u, PLANT_W.w), H(33.0), PLANT_W.top, WALL, ROOF);
  block(b, rect(PLANT_E.u, PLANT_E.w), H(32.5), PLANT_E.top, PLANT, PLANT);
}
