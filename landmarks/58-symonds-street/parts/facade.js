// 58 Symonds Street's faces: every floor's slab band round the tower, the band of louvres hung under it, the window
// wall set back behind the bands with its sill panels and mullions, a column at each corner and piers between, and
// the dark ground storey under the lowest band. Sizes from common.js; the bands' tops and the outer edge are the
// LiDAR's, the rest is estimated through the photograph's camera.
import { FACE, FOOT, TOWER, plan } from "./common.js";
import { prism } from "./shapes.js";

const BAND = "claddingPale", GLASS = "glass", LOUVRE = "screenGrey", DARK = "screenBlack";

const box = ([u0, u1], [w0, w1]) => plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]);

/** A rectangle's outline `d` in from the tower's outer edge. */
const inner = (d) => [[TOWER.u[0] + d, TOWER.u[1] - d], [TOWER.w[0] + d, TOWER.w[1] - d]];

/** A ring `t` deep round the rectangle `d` in from the outer edge, from y0 to y1: four boxes, the long faces' boxes
 * running to the corners and the ends' between them, so that no two of them share a face. */
function ring(b, d, t, y0, y1, material) {
  const [[u0, u1], [w0, w1]] = inner(d);
  prism(b, box([u0, u1], [w0, w0 + t]), y0, y1, material);
  prism(b, box([u0, u1], [w1 - t, w1]), y0, y1, material);
  prism(b, box([u0, u0 + t], [w0 + t, w1 - t]), y0, y1, material);
  prism(b, box([u1 - t, u1], [w0 + t, w1 - t]), y0, y1, material);
}

export function bands(b) {
  // each slab's band over the whole plan (the roof's edge too: the ledge round the upper roof stands on it)
  for (const top of [...TOWER.slabs, TOWER.edge]) prism(b, box(TOWER.u, TOWER.w), top - FACE.band, top, BAND);
}

export function storeys(b) {
  const tops = [...TOWER.slabs, TOWER.edge];
  const wall = inner(FACE.set);
  for (let k = 0; k + 1 < tops.length; k++) {
    const y0 = tops[k], head = tops[k + 1] - FACE.band;
    // the window wall: the glass from inside the band below to inside the band above; the sill panels 2 cm before it
    prism(b, box(...wall), y0 - 0.02, head + 0.02, GLASS);
    ring(b, FACE.set - 0.02, 0.12, y0 - 0.03, y0 + FACE.sill, BAND);
    // mullions before the glass, FACE.bay apart along each face, from the sill to the head
    const [[u0, u1], [w0, w1]] = wall;
    for (let u = u0 + FACE.bay; u < u1 - 0.5; u += FACE.bay) {
      prism(b, box([u - 0.04, u + 0.04], [w0 - 0.05, w0 + 0.02]), y0 + FACE.sill, head, BAND);
      prism(b, box([u - 0.04, u + 0.04], [w1 - 0.02, w1 + 0.05]), y0 + FACE.sill, head, BAND);
    }
    for (let w = w0 + FACE.bay; w < w1 - 0.5; w += FACE.bay) {
      prism(b, box([u0 - 0.05, u0 + 0.02], [w - 0.04, w + 0.04]), y0 + FACE.sill, head, BAND);
      prism(b, box([u1 - 0.02, u1 + 0.05], [w - 0.04, w + 0.04]), y0 + FACE.sill, head, BAND);
    }
    // the louvres under the band above: FACE.slats thin slats a ring each, near the band's outer face
    for (let i = 0; i < FACE.slats; i++) {
      const top = head - 0.05 - i * FACE.slatGap;
      ring(b, FACE.louvre[0], FACE.louvre[1] - FACE.louvre[0], top - 0.05, top, LOUVRE);
    }
    // a column at each corner, between the bands, at the bands' corner
    const [[cu0, cu1], [cw0, cw1]] = inner(FACE.column[0]);
    const s = FACE.column[1];
    for (const [u, w] of [[cu0, cw0], [cu1 - s, cw0], [cu0, cw1 - s], [cu1 - s, cw1 - s]])
      prism(b, box([u, u + s], [w, w + s]), y0 - 0.04, head + 0.04, BAND);
    // the piers between them, from the columns' outer face to 2 cm behind the glass, on all four faces
    const deep = FACE.set + 0.02 - FACE.column[0], h = s / 2;
    for (const u of FACE.piers.u) {
      prism(b, box([u - h, u + h], [cw0, cw0 + deep]), y0 - 0.04, head + 0.04, BAND);
      prism(b, box([u - h, u + h], [cw1 - deep, cw1]), y0 - 0.04, head + 0.04, BAND);
    }
    for (const w of FACE.piers.w) {
      prism(b, box([cu0, cu0 + deep], [w - h, w + h]), y0 - 0.04, head + 0.04, BAND);
      prism(b, box([cu1 - deep, cu1], [w - h, w + h]), y0 - 0.04, head + 0.04, BAND);
    }
  }
  // the ground storey under the lowest band, dark and set back, down to the walls' foot
  prism(b, box(...inner(FACE.ground)), FOOT, tops[0] - FACE.band + 0.02, DARK);
}
