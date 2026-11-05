// The street wing's south-west face, the one the photograph shows (parts/common.js, MEASURED.faces). Round 1: the
// brick bands standing out from the ribbons of windows between them; the panes, their frames and the film in
// vertical stripes over two of every three; the stair's slot, glazed in red frames; the entrance at its foot. The
// aisles' walls stand at the ribbons' glazing on this face (parts/wings.js), the bands before them.
import { MEASURED } from "./common.js";
import { prism } from "./shapes.js";

const F = MEASURED.faces;
// the film's stripes across a pane, from its left: colour and share of the pane's width (estimated)
const STRIPES = [["filmRed", 0.4], ["filmYellow", 0.12], ["filmOrange", 0.33], ["filmRed", 0.15]];
const FRAME = 0.08;  // the frames' width (estimated)

/** One pane's film from x0 to x1, y0 to y1, a thin layer before the glass at zg. */
function film(b, x0, x1, y0, y1, zg) {
  let x = x0;
  for (const [material, share] of STRIPES) {
    const w = (x1 - x0) * share;
    b.box(x, x + w, y0, y1, zg + 0.03, zg + 0.04, material);
    x += w;
  }
}

/** A part of the face: its bands, and between them (and from the top band to the soffit) the ribbons of windows. */
function part(b, P) {
  const [x0, x1] = P.x, zg = P.z - F.recess, soffit = P.top - MEASURED.fascia, zb = zg - 0.05;
  // each band from just behind the glazing to the face; with `mitre`, its x0 end along the corner (45 degrees)
  const plan = [[P.mitre ? x0 - (P.z - zb) : x0, zb], [x1, zb], [x1, P.z], [x0, P.z]];
  for (const [y0, y1] of P.bands) prism(b, plan, y0, y1, "brickBuff");
  const n = Math.max(1, Math.round((x1 - x0) / F.module)), w = (x1 - x0) / n;
  P.bands.forEach(([, y0], i) => {
    const y1 = i + 1 < P.bands.length ? P.bands[i + 1][0] : soffit;
    b.box(x0, x1, y0, y1, zg, zg + 0.02, "glass");
    b.box(x0, x1, y0, y0 + FRAME, zg + 0.02, zg + 0.08, "iron");
    b.box(x0, x1, y1 - FRAME, y1, zg + 0.02, zg + 0.08, "iron");
    for (let k = 0; k <= n; k++) {
      const x = x0 + k * w;
      b.box(Math.max(x0, x - FRAME / 2), Math.min(x1, x + FRAME / 2), y0 + FRAME, y1 - FRAME, zg + 0.02, zg + 0.08, "iron");
      if (k < n && k % 3 !== 2) film(b, x + FRAME / 2, x + w - FRAME / 2, y0 + FRAME, y1 - FRAME, zg);
    }
  });
}

/** The stair's slot: glass from the base to the soffit in red frames, a transom at each band's foot. */
function slot(b) {
  const [x0, x1] = F.slot.x, R = F.right, zg = R.z - F.recess + 0.03, top = R.top - MEASURED.fascia;
  b.box(x0, x1, R.bands[0][1], top, zg, zg + 0.02, "glass");
  // its frames just inside its sides, so that none stands in the plane of a band's end or a pane's frame
  for (const x of [x0 + 0.06, (x0 + x1) / 2, x1 - 0.06]) b.box(x - 0.06, x + 0.06, R.bands[0][1], top, zg + 0.02, zg + 0.1, "frameRed");
  for (const [y] of R.bands.slice(1)) b.box(x0, x1, y - 0.06, y + 0.06, zg + 0.02, zg + 0.1, "frameRed");
}

/** The entrance at the slot's foot: dark frames, glass doors in the middle, the film either side. Its front just
 * before the north-west part's bands, its back just behind the south-east part's glazing. */
function entrance(b) {
  const [x0, x1] = F.entrance.x, y0 = 0.15, y1 = F.entrance.top, zb = F.right.z - F.recess - 0.02, zf = F.left.z + 0.05;
  const d0 = -0.65, d1 = 0.6;  // the doors (estimated: the photograph's, about 1.2 m between the film)
  b.box(x0, x1, y1 - 0.25, y1, zb, zf, "iron");
  for (const x of [x0, d0, d1, x1]) b.box(x - 0.05, x + 0.05, y0, y1 - 0.25, zb, zf, "iron");
  b.box(d0 + 0.05, d1 - 0.05, y0, y1 - 0.25, zf - 0.05, zf - 0.03, "glass");
  film(b, x0 + 0.05, d0 - 0.05, y0, y1 - 0.25, zf - 0.08);
  film(b, d1 + 0.05, x1 - 0.05, y0, y1 - 0.25, zf - 0.08);
}

export function facade(b) {
  part(b, F.right);
  part(b, F.left);
  slot(b);
  entrance(b);
}
