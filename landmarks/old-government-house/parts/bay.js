// The single-storey parts at the front, at the LINZ 2024 LiDAR's sizes:
//   - the balcony bays in the corners between the end wings and the front range (hRE5 shows the
//     south-east one: a flat roof that is a balcony, white balusters between ochre posts on an ochre
//     cornice; the LiDAR shows its floor at 4.4 and its rail at 6.3, and the same bay at the north-west end);
//   - the low range at the south-east end (the LiDAR's low roofs: a hipped roof to 4.6 and a lean-to
//     against the wing; seen in no photograph, so drawn plainly);
//   - the porch in the middle of the garden front (eaves 4.5, ridge 5.1 on the middle bay's axis; seen
//     in no photograph: square pillars, a plain entablature and a low pediment).
import { Acc, face, fbox, sash, balustrade, hip, gableZ, leanTo } from "./front_kit.js";
import { MIDDLE } from "./main.js";

const BASE = -0.4;

// [x0, x1, z0, z1]: from the wing's end (flush with its eaves) to the front range's end wall, and out
// from the wing's front; the end that stands free (-1 south-east, +1 north-west)
export const BALCONY = { se: [-24.3, -17.2, 4.25, 6.4, -1], nw: [15.9, 22.65, 5.15, 7.25, 1], floor: 4.4, cornice: [4.95, 5.35], rail: 6.3, set: -0.45 };

function balconyBay(a, [x0, x1, z0, z1, end]) {
  const { floor, cornice: [c0, c1], rail } = BALCONY;
  a.box("boards", x0, x1, BASE, floor, z0, z1);
  const xe = end < 0 ? x0 : x1, xw = end < 0 ? x1 : x0;
  // a parapet on the open sides, to the cornice
  a.box("boards", x0, x1, floor, c0, z1 - 0.3, z1);
  a.box("boards", end < 0 ? x0 : x1 - 0.3, end < 0 ? x0 + 0.3 : x1, floor, c0, z0, z1);
  // the cornice: ochre, proud on the open sides
  a.box("trim", end < 0 ? x0 - 0.14 : x1 - 0.3, end < 0 ? x0 + 0.3 : x1 + 0.14, c0, c1, z0, z1 + 0.14);
  a.box("trim", Math.min(xe, xw), Math.max(xe, xw), c0, c1, z1 - 0.3, z1 + 0.14);
  a.box("trim", end < 0 ? x0 - 0.06 : x1 - 0.3, end < 0 ? x0 + 0.3 : x1 + 0.06, c0 - 0.22, c0, z0, z1 + 0.06);
  a.box("trim", x0, x1, c0 - 0.22, c0, z1 - 0.3, z1 + 0.06);
  // the balustrade on top
  // the balustrade on top, set back from the cornice's edge (the LiDAR's rail at 6.3 lies 0.3-0.7 m in)
  const d = BALCONY.set, xs = end < 0 ? [x0 - d - 0.16, x1] : [x0, x1 + d + 0.16];
  balustrade(a, face("z", z1, 1), xs[0], xs[1], c1, rail, d, { post: 1.9 });
  balustrade(a, face("x", xe, end), z0 + 0.02, z1 + d + 0.16, c1, rail, d, { post: 1.9 });
  // windows: three on the front, one on the end; ochre pilasters at the corners
  for (const u of [0.2, 0.5, 0.8].map((t) => x0 + (x1 - x0) * t)) sash(a, face("z", z1, 1), u, 1.25, 1.1, 2.5, { cols: 3, rows: 3 });
  sash(a, face("x", xe, end), (z0 + z1) / 2 + 0.15, 1.25, 0.95, 2.5, { cols: 3, rows: 3 });
  a.box("trim", xe - 0.25, xe + 0.25, BASE, c0 - 0.22, z1 - 0.25, z1 + 0.05);
}

// The low range at the south-east end: a room under a hipped roof (its ridge runs into the wing) and a
// lean-to against the wing in front of it.
export const LOW = { room: { x: [-35.6, -23.5], z: [-9.5, -3.8], eaves: [-35.6, -19.95, -9.9, -3.4], eave: 3.3, ridge: 4.6, top: 2.95, skirt: -36.5 },
  lean: { x: [-27.9, -23.5], z: [-3.8, 2.2], eaves: [-28.4, -23.5, -3.8, 2.6], hi: 4.6, lo: 3.4, top: 3.1 } };

function lowRange(a) {
  const { room: r, lean: l } = LOW;
  a.box("boards", r.x[0], r.x[1], BASE, r.top, r.z[0], r.z[1]);
  a.box("paint", r.skirt, r.x[1], r.top - 0.2, r.top, r.eaves[2], r.eaves[3]);
  a.box("paint", r.eaves[0], r.x[1], r.top, r.eave, r.eaves[2], r.eaves[3]);
  hip(a, ...r.eaves, r.eave, r.ridge);
  a.box("boards", l.x[0], l.x[1], BASE, l.top, l.z[0], l.z[1]);
  a.box("paint", l.eaves[0], l.eaves[1], l.top, l.top + 0.25, l.eaves[2], l.eaves[3]);
  leanTo(a, l.eaves[0], l.eaves[1], l.eaves[2], l.eaves[3], "x1", l.hi, l.lo);
  const w = { cols: 3, rows: 2 };
  for (const u of [-8.0, -5.5]) sash(a, face("x", r.x[0], -1), u, 0.95, 1.0, 1.7, w);
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
  lowRange(a);
  nwPorch(a);
  a.flush(b);
}

// The porch: on the middle bay's axis, from its wall out to z 13.1; eaves 4.5, ridge 5.1.
export const PORCH = { half: 2.95, z: [MIDDLE.z, 13.1], eave: 4.5, ridge: 5.1, floor: 0.85 };

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
