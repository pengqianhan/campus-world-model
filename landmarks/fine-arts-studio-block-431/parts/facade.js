// Fine Arts Studio Block 431's south face where the photograph sees it: the columns between its bays, the three rows
// of windows with their mullions, sills and heads, the big roller door in the west bay and the low box's roller
// doors. Sizes from common.js, every one estimated through the photograph's fitted camera.
import { BOX, EAVE, FACE, IN, Y, plan, planW } from "./common.js";
import { prism } from "./shapes.js";

const WALL = "claddingPale", WHITE = "paint", GLASS = "glassPale", DOOR = "screenSilver";
const W = EAVE.south - IN;  // the south face, w'

/** A box on the south face, from d0 to d1 in front of it, over [u0, u1] and the elevations [z0, z1]. */
function on(b, d0, d1, [u0, u1], [z0, z1], material) {
  prism(b, plan([[u0, W + d0], [u1, W + d0], [u1, W + d1], [u0, W + d1]]), Y(z0), Y(z1), material);
}

/** The spans between the columns and the face's ends, each cut to `from` and `to` along the face. */
function spans(from, to) {
  const c = FACE.column / 2, edges = [FACE.ends[1], ...FACE.columns.flatMap((k) => [k + c, k - c]), FACE.ends[0]];
  const out = [];
  for (let i = 0; i + 1 < edges.length; i += 2) {
    const a = Math.max(edges[i + 1], from), z = Math.min(edges[i], to);
    if (z - a > 0.3) out.push([a, z]);
  }
  return out;
}

/** The face: the columns 1 to 13 cm out; in each span the glass 2 to 4 cm out, starting 1 cm in from its ends and
 * 1 cm over its sill, the sill and head 0 to 8 cm out under and over it, two mullions 0 to 6 cm out at its thirds;
 * the doors 2 to 6 cm out. No two faces of different materials lie in one plane facing one way (the landmark tests'
 * faces check). */
export function face(b) {
  for (const k of FACE.columns) on(b, 0.01, 0.13, [k - FACE.column / 2, k + FACE.column / 2], [38.0, 46.3], WALL);
  FACE.rows.forEach(([z0, z1], r) => {
    const to = r === 2 ? FACE.bigDoor.u[0] : FACE.ends[1];
    for (const [a, c] of spans(FACE.ends[0], to)) {
      on(b, 0.02, 0.04, [a + 0.01, c - 0.01], [z0 + 0.01, z1 - 0.01], GLASS);
      on(b, 0, 0.08, [a, c], [z0 - 0.08, z0], WHITE);
      on(b, 0, 0.08, [a, c], [z1, z1 + 0.08], WHITE);
      for (const f of [1 / 3, 2 / 3]) {
        const m = a + f * (c - a);
        on(b, 0, 0.06, [m - 0.04, m + 0.04], [z0, z1], WHITE);
      }
    }
  });
  on(b, 0.02, 0.06, FACE.bigDoor.u, [33.1, FACE.bigDoor.top], DOOR);
  for (const [u0, u1] of FACE.boxDoors) {
    const front = planW([[u0, BOX.w], [u1, BOX.w], [u1, BOX.w + 0.04], [u0, BOX.w + 0.04]]);
    prism(b, front, Y(33.1), Y(FACE.boxDoorTop), DOOR);
  }
}
