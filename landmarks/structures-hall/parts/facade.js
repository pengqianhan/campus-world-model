// Structures Hall's south face, the one the photograph sees: the glazed storeys' bands, mullions and joints, the
// fascia and the dark frames at its ends; and under the box, the ground storey's windows, door and entrance, its piers
// and braces. Sizes from common.js.
import * as THREE from "three";
import { DARK, FRAMES, GLASS, WALL, along } from "./block.js";
import {
  BANDS, BAYS, BOX, BRACES, CLERESTORY, DOOR, ENTRANCE, FACE, FASCIA, FOOT, FRAME, NORTH, PIERS, SOUTH, WALL_Q,
  WINDOWS_GS, bay, pt,
} from "./common.js";

/** A box on the south face, p0 to p1 along it, y0 to y1 high and from q0 to q1; `sides` the materials of its
 * bottom, front, top and back, `ends` whether its ends at p0 and p1 are drawn. */
function box(b, p0, p1, y0, y1, q0, q1, m, sides = [m, m, m, null], ends = [true, true]) {
  along(b, Math.min(p0, p1), Math.max(p0, p1), [[q0, y0], [q1, y0], [q1, y1], [q0, y1]], sides, m, ends);
}

/** A pane: the front alone, at q, p0 to p1 and y0 to y1. */
const pane = (b, p0, p1, y0, y1, q, m) => box(b, p0, p1, y0, y1, q - 0.01, q, m, [null, m, null, null], [false, false]);

/** The glazed storeys: the light bands before the glass, a joint at each band's middle, the mullions (every second
 * one heavier) from the box's foot to the fascia, and the fascia between the frames; the frames themselves. */
export function glazing(b) {
  const p0 = BAYS.east, p1 = BAYS.west;
  for (const [y0, y1] of BANDS) {
    pane(b, p0, p1, y0, y1, FACE + 0.03, WALL);
    box(b, p0, p1, (y0 + y1) / 2 - 0.02, (y0 + y1) / 2 + 0.02, FACE - 0.02, FACE + 0.05, DARK, [DARK, DARK, DARK, null],
      [false, false]);
  }
  for (let k = 1; k < BAYS.n; k++) {
    const p = bay(k), w = k % 2 ? 0.025 : 0.05;
    box(b, p - w, p + w, BOX, FASCIA.y0, FACE - 0.02, FACE + 0.06, DARK, [null, DARK, null, null]);
  }
  box(b, p0, p1, FASCIA.y0, FASCIA.top, FACE - 0.02, FASCIA.q, WALL, [WALL, WALL, WALL, null], [false, false]);
  // the frames 5 mm before the glass, so that their ends are not in the plane of the box's ends behind it
  for (const [a, c] of [[SOUTH.p0, p0], [p1, SOUTH.p1]]) {
    box(b, a, c, BOX - 0.05, FRAME.top, FACE + 0.005, FASCIA.q, FRAMES, [FRAMES, FRAMES, FRAMES, FRAMES]);
  }
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** A brace: a bar 0.25 m wide from (pa, ya) to (pb, yb) on the south face, from q0 to q1, every triangle facing away
 * from the bar's middle. */
function brace(b, pa, ya, pb, yb, q0, q1, m) {
  const h = 0.125, s = Math.sign(pb - pa) || 1;
  const quad = [[pa - h * s, ya], [pa + h * s, ya], [pb + h * s, yb], [pb - h * s, yb]];
  const A = quad.map(([p, y]) => pt(p, q0, y)), B = quad.map(([p, y]) => pt(p, q1, y));
  const quads = [[B[0], B[1], B[2], B[3]], [A[0], A[1], A[2], A[3]]];
  for (let i = 0; i < 4; i++) quads.push([A[i], A[(i + 1) % 4], B[(i + 1) % 4], B[i]]);
  const mid = pt((pa + pb) / 2, (q0 + q1) / 2, (ya + yb) / 2), tris = [];
  for (const [a, c, d, e] of quads) for (const [x, y, z] of [[a, c, d], [a, d, e]]) {
    const o = sub([0, 1, 2].map((k) => (x[k] + y[k] + z[k]) / 3), mid);
    tris.push(dot(cross(sub(y, x), sub(z, x)), o) >= 0 ? [x, y, z] : [x, z, y]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(tris.flat(2), 3));
  b.add(g, m);
}

/** The ground storey under the box: its windows, door and entrance on the wall, the canopy, the piers and the
 * braces. */
export function ground(b) {
  pane(b, WINDOWS_GS.p0, WINDOWS_GS.p1, WINDOWS_GS.y0, WINDOWS_GS.y1, WALL_Q + 0.02, DARK);
  pane(b, DOOR.p0, DOOR.p1, FOOT, DOOR.top, WALL_Q + 0.02, DARK);
  pane(b, ENTRANCE.p0, ENTRANCE.p1, FOOT, ENTRANCE.top, WALL_Q + 0.02, DARK);
  box(b, ENTRANCE.p0 - 0.2, ENTRANCE.p1 + 0.2, ...ENTRANCE.canopy, WALL_Q - 0.02, ENTRANCE.out, DARK);
  for (let k = PIERS.from; k < BAYS.n; k += PIERS.every) {
    const p = bay(k);
    box(b, p - PIERS.w / 2, p + PIERS.w / 2, FOOT, BOX, PIERS.q0, PIERS.q1, WALL, [null, WALL, null, WALL]);
  }
  for (const [k0, k1] of BRACES) {
    const pa = bay(k0), pc = bay(k1), pm = (pa + pc) / 2;
    brace(b, pa, BOX - 0.05, pm, FOOT, 14.87, 15.13, WALL);
    brace(b, pc, BOX - 0.05, pm, FOOT, 14.87, 15.13, WALL);
  }
}

/** The band of glazing in the face the northern block turns south over the southern block's roof. */
export function clerestory(b) {
  pane(b, NORTH.p0 + 0.3, NORTH.p1 - 0.3, CLERESTORY.y0, CLERESTORY.y1, NORTH.q1 + 0.02, GLASS);
}
