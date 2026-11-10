// Building 114's south-west face where the photograph sees it: the upper window band and its mullions, the floor band,
// the ground storey's windows and posts; and the stair tower's frames, its red doors and the brick steps before them.
// Sizes from common.js, every one estimated through the photograph's fitted camera.
import { FACE, ROOF, TOWER, TOWER_FRONT, WALLS, plan } from "./common.js";
import { prism } from "./shapes.js";

const WHITE = "paint", GLASS = "glassPale", POST = "grey", DOOR = "frameRed", STEP = "brick";

/** A box on the south-west face, from `d0` to `d1` in front of the plane w = `w0`, over [u0, u1] and [y0, y1]. */
function on(b, w0, d0, d1, [u0, u1], [y0, y1], material) {
  prism(b, plan([[u0, w0 + d0], [u1, w0 + d0], [u1, w0 + d1], [u0, w0 + d1]]), y0, y1, material);
}

/** The face: the glass 2 to 4 cm in front of the wall, the frames and the mullions 8 and 6 cm out round it, the band
 * 12 cm out and the posts from 1 to 13 cm, the glass starting 1 cm over its sill and stopping 1 cm under the eave
 * (the upper) or 2 cm under the band the posts meet (the lower), so that no two of their faces lie in one plane (the
 * landmark tests' faces check). */
export function face(b) {
  const w = FACE.w, [u0, u1] = FACE.u, [tu0, tu1] = [TOWER.plan[0][0], TOWER.plan[1][0]];
  // the window bands, either side of the tower
  for (const [a, c] of [[u0 + 0.3, tu0], [tu1, u1]]) {
    on(b, w, 0.02, 0.04, [a, c], [FACE.upper[0] + 0.01, FACE.upper[1] - 0.01], GLASS);
    on(b, w, 0, 0.08, [a, c], [FACE.upper[0] - 0.08, FACE.upper[0]], WHITE);
    on(b, w, 0.02, 0.04, [a, c], [FACE.lower[0] + 0.01, FACE.band[0] - 0.02], GLASS);
    on(b, w, 0, 0.08, [a, c], [FACE.lower[0] - 0.08, FACE.lower[0]], WHITE);
  }
  for (const m of FACE.mullions) on(b, w, 0, 0.06, [m - 0.04, m + 0.04], FACE.upper, WHITE);
  on(b, w, 0, 0.12, [u0, tu0], FACE.band, WHITE);
  on(b, w, 0, 0.12, [tu1, u1], FACE.band, WHITE);
  for (const p of FACE.posts) on(b, w, 0.01, 0.13, [p - 0.12, p + 0.12], [WALLS.floor - 0.4, FACE.band[0]], POST);
}

/** The stair tower's white frame round its glass, its mullions and transoms, the red doors, and the brick steps. The
 * frame's uprights run 2 cm past the glass's ends, so that their ends and the glass's lie in no one plane. */
export function front(b) {
  const w = TOWER.plan[2][1], [u0, u1] = [TOWER.plan[0][0], TOWER.plan[1][0]], top = ROOF.edge - ROOF.fascia;
  const y = [WALLS.floor - 0.02, top - 0.02];
  for (const u of [u0, u1]) on(b, w, -0.02, 0.06, [u - 0.06, u + 0.06], y, WHITE);
  for (const u of TOWER_FRONT.mullions) on(b, w, 0, 0.05, [u - 0.04, u + 0.04], [TOWER_FRONT.doors.top, top - 0.01], WHITE);
  for (const t of TOWER_FRONT.transoms) on(b, w, 0, 0.05, [u0, u1], [t - 0.04, t + 0.04], WHITE);
  const [d0, d1] = TOWER_FRONT.doors.u;
  on(b, w, 0.01, 0.03, [d0, d1], [WALLS.floor, TOWER_FRONT.doors.top - 0.04], DOOR);
  // the steps: a landing at the floor, then three treads down to the ground (four risers), each a block from below
  // the ground up
  const S = TOWER_FRONT.steps, rise = (WALLS.floor - S.ground) / 4;
  let w0 = w, w1 = w + S.landing;
  for (let i = 0; i < 4; i++) {
    prism(b, plan([[S.u[0], w0], [S.u[1], w0], [S.u[1], w1], [S.u[0], w1]]), S.ground - 0.3, WALLS.floor - i * rise, STEP);
    w0 = w1; w1 += S.tread;
  }
}
