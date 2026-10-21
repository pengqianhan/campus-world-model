// The single-storey parts at the front, at the LINZ 2024 LiDAR's sizes:
//   - the balcony bays in the corners between the end wings and the front range (hRE5 shows the
//     south-east one: a flat roof that is a balcony, white balusters between ochre posts on an ochre
//     cornice; the LiDAR shows its floor at 4.4 and its rail at 6.3, and the same bay at the north-west end);
//   - the low range at the south-east end (the LiDAR's low roofs: a hipped roof to 4.6 and a lean-to
//     against the wing; seen in no photograph, so drawn plainly);
//   - the porch in the middle of the garden front (eaves 4.5, ridge 5.1 on the middle bay's axis; seen
//     in no photograph: square pillars, a plain entablature and a low pediment).
import { Acc, face, fbox, sash, balustrade, hip, gableZ, leanTo, bar } from "./front_kit.js";
import { MIDDLE } from "./main.js";
import { MEASURED as M } from "./common.js";

const BASE = -0.4;

// [x0, x1, z0, z1]: from the wing's end wall to the front range's end wall, and out from the wing's front;
// the end that stands free (-1 south-east, +1 north-west). The south-east bay's end is flush with the wing's
// end wall at x -23.5, not common.js's -24.3 (the LiDAR has nothing beyond x -23.5 from z 5 to 6.5 but the
// wing's eave; its end rail stands at x -23.0, its front rail at z 5.8-6.2, both 6.3-6.4 m), as the
// north-west one's end is flush with its wing's (22.65); in hRE5 its end face begins at the wing's corner.
const MB = M.balconies;
export const BALCONY = { se: [-23.5, MB.se.x[1], ...MB.se.z, -1], nw: [...MB.nw.x, ...MB.nw.z, 1], floor: MB.floor,
  cornice: [MB.cornice - 0.4, MB.cornice], rail: MB.rail, setFront: -0.35, setEnd: -0.6 };
// hRE5's balustrade: a heavy ochre coping and plinth, broad ochre pedestals at the ends and the corner, posts
// between, and white vase balusters (about 0.2 m apart) between them, on the end and along the front
const RAIL = { post: 1.5, postW: 0.32, endW: 0.5, cap: 0.21, capH: 0.16, plinth: 0.17, plinthH: 0.15, postD: 0.25 };

function balconyBay(a, [x0, x1, z0, z1, end]) {
  const { floor, cornice: [c0, c1], rail, setFront: df, setEnd: de } = BALCONY;
  a.box("boards", x0, x1, BASE, floor, z0, z1);
  const xe = end < 0 ? x0 : x1, xw = end < 0 ? x1 : x0, out = (v) => (end < 0 ? -v : v);
  // a parapet on the open sides, to the cornice
  a.box("boards", x0, x1, floor, c0, z1 - 0.3, z1);
  a.box("boards", xe, xe - out(0.3), floor, c0, z0, z1);
  // the cornice: ochre, deep on the open sides (hRE5: a strong shadow under it), on a bed moulding
  a.box("trim", xe + out(0.25), xe - out(0.3), c0 + 0.1, c1, z0, z1 + 0.25);
  a.box("trim", xe, xw, c0 + 0.1, c1, z1 - 0.3, z1 + 0.25);
  a.box("trim", xe + out(0.12), xe - out(0.3), c0 - 0.12, c0 + 0.1, z0, z1 + 0.12);
  a.box("trim", xe, xw, c0 - 0.12, c0 + 0.1, z1 - 0.3, z1 + 0.12);
  a.box("trim", xe + out(0.05), xe - out(0.3), c0 - 0.3, c0 - 0.12, z0, z1 + 0.05);
  a.box("trim", xe, xw, c0 - 0.3, c0 - 0.12, z1 - 0.3, z1 + 0.05);
  // the balustrade on top, set back from the cornice's edge as the LiDAR's rails stand
  const zEnd = z1 + df + RAIL.postD, xFront = xe + end * (de + RAIL.postD);   // the outer edges of the other run
  balustrade(a, face("z", z1, 1), Math.min(xFront, xw), Math.max(xFront, xw), c1, rail, df, RAIL);
  balustrade(a, face("x", xe, end), z0, zEnd, c1, rail, de, RAIL);
  // windows: three on the front, one on the end; ochre pilasters at the corners
  const win = { cols: 3, rows: 3, s: 0.2 };
  for (const u of [0.2, 0.5, 0.8].map((t) => x0 + (x1 - x0) * t)) sash(a, face("z", z1, 1), u, 1.25, 1.1, 2.5, win);
  sash(a, face("x", xe, end), (z0 + z1) / 2 + 0.15, 1.25, 0.95, 2.5, win);
  a.box("trim", xe - 0.25, xe + 0.25, BASE, c0 - 0.3, z1 - 0.25, z1 + 0.05);
}

// The fire-escape in hRE5 (painted pale grey, so drawn in paint), in the corner between the south-east wing's front and the front range's end
// wall, above the balcony: a landing about 7.2 m up (under the wing's eave, so the LiDAR does not see it)
// with a railing, on two struts from the wing, and a steep stair (stringers, treads, handrails) from its
// front down to the balcony's floor inside the balustrade. Drawn simply.
const STAIR = { x: [-18.5, -17.2], z: [MB.se.z[0], 5.05], deck: 7.2, foot: { z: 5.8, y: MB.floor }, width: [-17.95, -17.3] };

function fireStair(a) {
  const { x: [x0, x1], z: [z0, z1], deck, foot, width: [w0, w1] } = STAIR, I = "paint";  // pale grey paint in the photograph
  a.box(I, x0, x1, deck - 0.06, deck, z0, z1);                                        // the landing's plate
  a.box(I, x0, x1, deck - 0.2, deck - 0.06, z1 - 0.05, z1);                           // its edge
  for (const x of [x0 + 0.1, x1 - 0.15]) bar(a, I, [x, deck - 1.0, z0], [x, deck - 0.1, z1 - 0.05], 0.06); // struts
  // the railing: posts at the outer corners, a top rail and a middle rail on the open sides
  const posts = [[x0 + 0.03, z0 + 0.03], [x0 + 0.03, z1 - 0.03], [w0 - 0.03, z1 - 0.03]];
  for (const [x, z] of posts) a.box(I, x - 0.025, x + 0.025, deck, deck + 1.0, z - 0.025, z + 0.025);
  for (const y of [deck + 0.5, deck + 0.98]) {
    a.box(I, x0, x0 + 0.05, y - 0.025, y + 0.025, z0, z1);
    a.box(I, x0, w0, y - 0.025, y + 0.025, z1 - 0.05, z1);
  }
  // the stair: two stringers and two handrails from the landing's front to the floor, treads between
  const top = [deck, z1], bot = [foot.y, foot.z];
  for (const x of [w0, w1]) {
    bar(a, I, [x, top[0], top[1]], [x, bot[0], bot[1]], 0.07);
    bar(a, I, [x, top[0] + 0.95, top[1]], [x, bot[0] + 0.95, bot[1]], 0.04);
    a.box(I, x - 0.02, x + 0.02, bot[0], bot[0] + 0.95, bot[1] - 0.02, bot[1] + 0.02);
  }
  const n = Math.round((top[0] - bot[0]) / 0.25);
  for (let i = 1; i < n; i++) {
    const t = i / n, y = top[0] + (bot[0] - top[0]) * t, z = top[1] + (bot[1] - top[1]) * t;
    a.box(I, w0 + 0.035, w1 - 0.035, y - 0.03, y, z - 0.09, z + 0.09);
  }
}

// The low range at the south-east end: a room under a hipped roof (its ridge runs into the wing), a lower
// lean-to beyond its end, and a lean-to against the wing in front of it, hipped down at its north-east end.
// The LiDAR: the room's hip end runs from 3.4-3.7 m at x -34.5 to its ridge's 4.5 at -32; beyond it a roof
// falls evenly from 3.2 at x -34.5 to 2.6 at -37.75 (z -10 to -4.3); the lean-to rises from 3.5 at x -28 to
// 4.5-4.6 by the wing, and falls again from 4.6 at z -0.5 to 3.4-3.5 at z 2.5.
export const LOW = { room: { x: [-34.2, -23.5], z: [-9.5, -3.8], eaves: [-34.5, -19.95, -9.9, -3.4], eave: 3.3, ridge: M.low.ridge, top: 2.95 },
  end: { x: [-37.45, -34.5], z: [-9.7, -4.6], eaves: [-37.75, -34.5, -10.0, -4.3], hi: 3.25, lo: 2.6, top: 2.3 },
  lean: { x: [-27.9, -23.5], z: [-3.8, 2.2], eaves: [-28.4, -23.5, -3.8, 2.6], hi: 4.6, lo: 3.4, top: 3.1, hipFrom: -0.6 } };

function lowRange(a) {
  const { room: r, end: e, lean: l } = LOW;
  a.box("boards", r.x[0], r.x[1], BASE, r.top, r.z[0], r.z[1]);
  a.box("paint", r.eaves[0], r.x[1], r.top, r.eave, r.eaves[2], r.eaves[3]);
  a.box("paint", r.eaves[0] + 2.5, r.x[1], r.top, r.eave, r.eaves[3], -3.05);   // a gutter: the LiDAR's eave at 3.0-3.4 reaches z -3.0
  hip(a, ...r.eaves, r.eave, r.ridge);
  a.box("boards", e.x[0], e.x[1], BASE, e.top, e.z[0], e.z[1]);
  a.box("paint", e.eaves[0], e.eaves[1], e.top, e.top + 0.2, e.eaves[2], e.eaves[3]);
  leanTo(a, ...e.eaves, "x1", e.hi, e.lo);
  a.box("boards", l.x[0], l.x[1], BASE, l.top, l.z[0], l.z[1]);
  a.box("paint", l.eaves[0], l.eaves[1], l.top, l.top + 0.25, l.eaves[2], l.eaves[3]);
  // the lean-to: one slope up to the wing, hipped down to the north-east
  const [lx0, lx1, lz0, lz1] = l.eaves, ins = [(lx0 + lx1) / 2, l.lo - 2, (lz0 + lz1) / 2];
  a.quad("roofPale", [lx0, l.lo, lz0], [lx0, l.lo, lz1], [lx1, l.hi, l.hipFrom], [lx1, l.hi, lz0], ins);
  a.tri("roofPale", [lx0, l.lo, lz1], [lx1, l.lo, lz1], [lx1, l.hi, l.hipFrom], ins);
  const w = { cols: 3, rows: 2 };
  for (const u of [-8.0, -5.5]) sash(a, face("x", e.x[0], -1), u, 0.8, 1.0, 1.25, w);
  sash(a, face("z", e.z[1], 1), -36.0, 0.8, 1.0, 1.25, w);
  for (const u of [-33.3, -30.3]) sash(a, face("z", r.z[1], 1), u, 0.95, 1.0, 1.7, w);
  for (const u of [-2.2, 0.6]) sash(a, face("x", l.x[0], -1), u, 0.95, 1.0, 1.85, w);
  sash(a, face("z", l.z[1], 1), -25.7, 0.95, 1.0, 1.85, w);
}

// a small single-storey lobby against the north-west end (the LiDAR's flat roof at 5.3; seen in no photograph)
export const NW_LOBBY = { x: [22.65, 25.4], z: [-4.6, 0.8], top: 5.35 };
function nwPorch(a) {
  const { x: [x0, x1], z: [z0, z1], top } = NW_LOBBY;
  a.box("boards", x0, x1 - 0.3, BASE, top - 0.4, z0 + 0.3, z1 - 0.3);
  a.box("trim", x0, x1, top - 0.4, top - 0.1, z0, z1);
  a.box("roofPale", x0, x1 - 0.05, top - 0.1, top, z0 + 0.05, z1 - 0.05);
  sash(a, face("x", x1 - 0.3, 1), (z0 + z1) / 2, 0.75, 1.5, 3.0, { door: true });
}

export function bay(b) {
  const a = new Acc();
  balconyBay(a, BALCONY.se);
  balconyBay(a, BALCONY.nw);
  fireStair(a);
  lowRange(a);
  nwPorch(a);
  a.flush(b);
}

// The porch: on the middle bay's axis, from its wall out to z 13.1; eaves 4.5, ridge 5.1.
export const PORCH = { half: (M.porch.x[1] - M.porch.x[0]) / 2, z: [MIDDLE.z, M.porch.z[1]], eave: M.porch.eave, ridge: M.porch.ridge, floor: 0.85 };

export function porch(b) {
  const a = new Acc(), { axis } = MIDDLE, { half, z: [z0, z1], eave, ridge, floor } = PORCH;
  const xo = half - 0.45, zf = z1 - 0.5;                               // the outer pillars' centres, the front row's
  a.box("boards", axis - xo - 0.3, axis + xo + 0.3, BASE, floor, z0, zf + 0.3);
  for (let i = 1; i <= 3; i++) a.box("boards", axis - 1.6, axis + 1.6, BASE, floor - 0.2 * i, zf + 0.3, zf + 0.3 + 0.32 * i);
  const pillars = [];
  for (const s of [-1, 1]) pillars.push([axis + s * xo, zf], [axis + s * 1.15, zf], [axis + s * xo, (z0 + zf) / 2 + 0.2]);
  for (const [x, z] of pillars) {
    a.box("trim", x - 0.26, x + 0.26, floor, floor + 0.3, z - 0.26, z + 0.26);   // base
    a.box("trim", x - 0.19, x + 0.19, floor + 0.3, 3.7, z - 0.19, z + 0.19);     // shaft
    a.box("trim", x - 0.27, x + 0.27, 3.7, 3.85, z - 0.27, z + 0.27);            // capital
  }
  for (const s of [-1, 1]) a.box("trim", axis + s * xo - 0.12, axis + s * xo + 0.12, floor, 3.85, z0, z0 + 0.12); // pilasters on the wall
  // the entablature round the three open sides, a ceiling under the roof, the roof with a pediment to the lawn
  a.box("trim", axis - xo - 0.3, axis + xo + 0.3, 3.85, 4.35, zf - 0.3, zf + 0.3);
  for (const s of [-1, 1]) a.box("trim", axis + s * xo - 0.3, axis + s * xo + 0.3, 3.85, 4.35, z0, zf);
  a.box("paint", axis - half, axis + half, 4.35, eave, z0, z1);
  gableZ(a, axis, half, z0, z1, eave, ridge, { setback: 0.35 });
  a.flush(b);
}
