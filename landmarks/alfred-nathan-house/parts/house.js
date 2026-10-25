// The two-storey house at the west end, its front on Princes Street (parts/common.js MEASURED.house):
// white painted walls, a cornice and a balustraded parapet along the front; two canted bays of two
// storeys with tall windows; between them a porch up steps from the path, its door under three
// openings, and over it a balcony with a railing, columns and an entablature that bow out toward the
// street (the photographs from Princes Street). The sides: plain walls, a few windows where a
// photograph shows them; the back stands against the block.
import * as THREE from "three";
import { boxesGeometry, outline } from "../../kit/gothic.js";
import { MEASURED as M, FOOT } from "./common.js";
import { bowPoints, band } from "./shapes.js";

const H = M.house;

/** A horizontal slab whose plan is the polygon `pts` ([[x, z], ...]), from y0 to y1. */
function slab(b, pts, y0, y1, material) {
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments: 4 });
  g.rotateX(Math.PI / 2);
  g.translate(0, y1, 0);
  b.add(g, material);
}

/** A box on the face from a to c (plan points; outward is to the left of a -> c), from t0 to t1 of its
 * length, y0 to y1 high, from o0 to o1 m out from the face. */
function onFace(b, a, c, t0, t1, y0, y1, o0, o1, material) {
  const dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz), nx = -dz / L, nz = dx / L;
  const len = (t1 - t0) * L, mid = (t0 + t1) / 2, o = (o0 + o1) / 2;
  const g = new THREE.BoxGeometry(len, y1 - y0, o1 - o0);
  g.rotateY(-Math.atan2(dz, dx));
  g.translate(a[0] + dx * mid + nx * o, (y0 + y1) / 2, a[1] + dz * mid + nz * o);
  b.add(g, material);
}

/** A plan shape (in the face's own x, from its centre, and y) extruded o0 to o1 m out from the face a -> c
 * at t of its length. */
function faceShape(b, a, c, t, shape, o0, o1, material) {
  const dx = c[0] - a[0], dz = c[1] - a[1];
  const g = new THREE.ExtrudeGeometry(shape, { depth: o1 - o0, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, o0);
  g.rotateY(-Math.atan2(dz, dx));
  g.translate(a[0] + dx * t, 0, a[1] + dz * t);
  b.add(g, material);
}

/** The outline of an opening x0..x1, y0..y1 whose head's corners are rounded to radius r. */
function roundHead(path, x0, x1, y0, y1, r) {
  path.moveTo(x0, y0); path.lineTo(x1, y0); path.lineTo(x1, y1 - r);
  path.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  path.lineTo(x0 + r, y1);
  path.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  path.lineTo(x0, y0);
  return path;
}

/** A window on the face a -> c, centred at t of its length, w wide, y0 to y1: glass set into a white
 * surround. With `round`, the head's corners are rounded (the ground floor's windows in vZGe's and
 * RHEq's photographs: square heads with quarter-round corners, about a fifth of the width across). */
function faceWindow(b, a, c, t, w, y0, y1, round = false) {
  const L = Math.hypot(c[0] - a[0], c[1] - a[1]), h = w / 2 / L, f = 0.12 / L;
  if (round) {
    const r = Math.min(0.3, w * 0.22), F = 0.12, x = w / 2;
    faceShape(b, a, c, t, roundHead(new THREE.Shape(), -x, x, y0, y1, r), 0, 0.03, "glassPale");
    const frame = roundHead(new THREE.Shape(), -x - F, x + F, y0 - 0.12, y1 + F, r + F);
    frame.holes.push(roundHead(new THREE.Path(), -x, x, y0, y1, r));
    faceShape(b, a, c, t, frame, 0, 0.1, "paint");
    onFace(b, a, c, t - h - f, t + h + f, y1 + F, y1 + F + 0.15, 0, 0.12, "paint");
    onFace(b, a, c, t - h - f, t + h + f, y0 - 0.15, y0, 0, 0.12, "paint");
    return;
  }
  onFace(b, a, c, t - h, t + h, y0, y1, 0, 0.03, "glassPale");
  onFace(b, a, c, t - h - f, t - h, y0 - 0.12, y1 + 0.2, 0, 0.1, "paint");
  onFace(b, a, c, t + h, t + h + f, y0 - 0.12, y1 + 0.2, 0, 0.1, "paint");
  onFace(b, a, c, t - h - f, t + h + f, y1, y1 + 0.3, 0, 0.12, "paint");
  onFace(b, a, c, t - h - f, t + h + f, y0 - 0.15, y0, 0, 0.12, "paint");
}

/** A balustrade along the polyline pts, y0 to y1: a plinth, balusters every `step` m and a top rail. */
function balustrade(b, pts, y0, y1, step = 0.28) {
  band(b, pts, y0, y0 + 0.15, 0.3, "paint");
  band(b, pts, y1 - 0.12, y1, 0.32, "paint");
  const list = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, az] = pts[i], [cx, cz] = pts[i + 1], L = Math.hypot(cx - ax, cz - az), n = Math.max(1, Math.round(L / step));
    const nx = -(cz - az) / L, nz = (cx - ax) / L;
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, x = ax + (cx - ax) * t - nx * 0.15, z = az + (cz - az) * t - nz * 0.15, w = 0.06;
      list.push([x - w, x + w, y0 + 0.15, y1 - 0.12, z - w, z + w]);
    }
  }
  b.add(boxesGeometry(list), "paint");
}

/** A low roof over a bay (plan corners from the wall round its front back to the wall): from the
 * bay's top at its front faces up to `rise` m higher at the wall (vZGe's upper view: dark slate). */
function bayRoof(b, bay, y, rise) {
  const zw = bay[0][1], zf = bay[1][1], pos = [];
  const lift = ([x, z]) => [x, y + (rise * (z - zf)) / (zw - zf), z];
  const pts = bay.map(lift);
  for (let k = 1; k + 1 < pts.length; k++) pos.push(...pts[0], ...pts[k + 1], ...pts[k]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  if (g.attributes.normal.getY(0) < 0) { const a = g.attributes.position.array; for (let i = 0; i < a.length; i += 9) for (let j = 0; j < 3; j++) [a[i + 3 + j], a[i + 6 + j]] = [a[i + 6 + j], a[i + 3 + j]]; }
  b.add(g, "roof");
}

export function house(b) {
  const [bx0, bx1] = H.back.x, [bz0, bz1] = H.back.z, [fx0, fx1] = H.front.x, [fz0, fz1] = H.front.z;
  const P = H.porch, Bal = H.balcony, W = H.windows;
  // the walls and the roof
  b.box(bx0, bx1, FOOT.house, H.roof, bz0, bz1, "paint");
  b.box(fx0, fx1, FOOT.house, H.roof, fz0, fz1, "paint");
  // its flat roof, dark grey in the 2023 aerial (median luma 76 at the LiDAR's roof points, sRGB 57 77
  // 118), behind the parapet and seen from no street: the kit's dark roof
  b.box(bx0 + 0.3, bx1 - 0.3, H.roof, H.roof + 0.05, bz0 + 0.3, bz1, "roof");
  b.box(fx0 + 0.3, fx1 - 0.3, H.roof, H.roof + 0.05, fz0, fz1 - 0.3, "roof");
  // the cornice round the front and sides, the parapet on the front with its pedestals
  const c = 0.3, cy = H.roof - 0.25;
  b.add(boxesGeometry([
    [fx0 - c, fx1 + c, cy, H.cornice, fz1 - 0.3, fz1 + c],
    [fx0 - c, fx0, cy, H.cornice, fz0, fz1], [fx1, fx1 + c, cy, H.cornice, fz0, fz1],
    [bx0 - c, bx0, cy, H.cornice, bz0, bz1], [bx1, bx1 + c, cy, H.cornice, bz0, bz1],
    [fx0, fx0 + 0.3, H.cornice, H.cornice + 0.5, fz0, fz1 - 0.3], [fx1 - 0.3, fx1, H.cornice, H.cornice + 0.5, fz0, fz1 - 0.3],
  ]), "paint");
  // the brackets under the cornice, in pairs about every 0.55 m along the front and its sides, and the
  // frieze below them (vZGe's upper view)
  const brackets = [[fx0 - 0.04, fx1 + 0.04, cy - 0.45, cy, fz1, fz1 + 0.04]];
  for (let x = fx0 + 0.3; x < fx1 - 0.2; x += 0.55) brackets.push([x - 0.06, x + 0.06, cy - 0.3, cy, fz1, fz1 + c - 0.04]);
  for (let z = fz0 + 0.3; z < fz1; z += 0.55) {
    brackets.push([fx0 - c + 0.04, fx0, cy - 0.3, cy, z - 0.06, z + 0.06], [fx1, fx1 + c - 0.04, cy - 0.3, cy, z - 0.06, z + 0.06]);
  }
  b.add(boxesGeometry(brackets), "paint");
  const pz = fz1 - 0.05;
  balustrade(b, [[fx0, pz], [fx1, pz]], H.cornice, H.parapet);
  // pedestals at the corners and either side of the middle (vZGe's views), a ball finial on each
  const PEDS = H.pedestals;
  const peds = PEDS.map((x) => [x - 0.25, x + 0.25, H.cornice, H.parapet + 0.12, pz - 0.5, pz]);
  b.add(boxesGeometry(peds), "paint");
  b.add(boxesGeometry(PEDS.map((x) => [x - 0.12, x + 0.12, H.parapet + 0.12, H.parapet + 0.5, pz - 0.37, pz - 0.13])), "paint");
  // rusticated quoins up the front corners, to the cornice
  const quoins = [];
  for (let y = 0, i = 0; y < H.roof - 0.6; y += 0.55, i++) {
    const w = i % 2 ? 0.45 : 0.7;
    quoins.push([fx0 - 0.04, fx0 + w, y + 0.04, y + 0.51, fz1 - 0.02, fz1 + 0.04], [fx1 - w, fx1 + 0.04, y + 0.04, y + 0.51, fz1 - 0.02, fz1 + 0.04]);
    quoins.push([fx0 - 0.04, fx0 + 0.02, y + 0.04, y + 0.51, fz1 - w, fz1], [fx1 - 0.02, fx1 + 0.04, y + 0.04, y + 0.51, fz1 - w, fz1]);
  }
  b.add(boxesGeometry(quoins), "paint");
  // the canted bays: walls to their tops, a string course between the floors, a cornice on top, windows
  for (const bay of H.bays) {
    slab(b, bay, FOOT.house, H.bayTop - 0.3, "paint");
    slab(b, bay, H.bayTop - 0.3, H.bayTop, "paint");
    bayRoof(b, bay, H.bayTop, 0.45);
    for (let i = 0; i + 1 < bay.length; i++) {
      const a = bay[i], e = bay[i + 1], front = i === 1;
      onFace(b, a, e, -0.04, 1.04, P.top - 0.15, P.top + 0.1, 0, 0.1, "paint");
      onFace(b, a, e, -0.04, 1.04, H.bayTop - 0.45, H.bayTop - 0.05, 0, 0.18, "paint");
      for (const [y0, y1] of [W.ground, W.upper]) faceWindow(b, a, e, 0.5, front ? 1.25 : 0.7, y0, y1, y0 === W.ground[0]);
    }
  }
  // the porch: its floor up steps from the path, the front door, three openings under a beam
  const [px0, px1] = P.x, pf = P.front;
  b.box(px0, px1, FOOT.house, P.floor, fz1, pf, "paint");
  const steps = 8, tread = (31.0 - pf) / steps; // to the door (config: x 0.3, z 31.0)
  for (let i = 0; i < steps; i++) b.box(-0.9, 1.5, FOOT.house, (P.floor * (steps - i)) / (steps + 1), pf + i * tread, pf + (i + 1) * tread, "dressed");
  b.box(-0.45, 1.05, P.floor, 4.1, fz1, fz1 + 0.04, "doorRed");
  // the porch's front: a wall from its floor to the balcony with three round-headed openings, a wide
  // one in the middle and a narrow one each side, all crowned at P.arch; columns between them
  const front = new THREE.Shape([[px0, P.floor], [px1, P.floor], [px1, P.top], [px0, P.top]].map(([x, y]) => new THREE.Vector2(x, y)));
  for (const [x0, x1] of P.openings) {
    const w = x1 - x0, cx = (x0 + x1) / 2, h = P.arch - P.floor;
    front.holes.push(new THREE.Path(outline(w, h, "pointed", 0.5).map((p) => new THREE.Vector2(p.x + cx, p.y + P.floor)).reverse()));
  }
  b.slab(front, 0, 0, pf, 0.35, "paint");
  const caps = [];
  for (const x of [(P.openings[0][1] + P.openings[1][0]) / 2, (P.openings[1][1] + P.openings[2][0]) / 2]) {
    caps.push([x - 0.2, x + 0.2, P.floor, P.floor + 0.25, pf - 0.4, pf + 0.05], [x - 0.22, x + 0.22, P.arch - 1.55, P.arch - 1.3, pf - 0.4, pf + 0.06]);
  }
  b.add(boxesGeometry(caps), "paint");
  // the balcony over the porch: its floor and bowed railing, columns and entablature, the roof over it
  const bow = bowPoints(px0, px1, pf, Bal.bow, 12);
  const plan = [[px0, fz1], ...bow, [px1, fz1]];
  slab(b, plan, P.top - 0.2, P.top, "paint");
  balustrade(b, bow, P.top, Bal.rail);
  const cols = [];
  for (const i of [0, 4, 8, 12]) { const [x, z] = bow[i], w = 0.13; cols.push([x - w, x + w, Bal.rail, Bal.top - 0.55, z - 0.4, z - 0.14]); }
  b.add(boxesGeometry(cols), "paint");
  band(b, bow, Bal.top - 0.55, Bal.top, 0.35, "paint");
  slab(b, plan, Bal.top - 0.1, Bal.top, "roofPale");
  b.box(-0.45, 1.05, P.top, P.top + 2.6, fz1, fz1 + 0.04, "doorRed");
  // the sides: plain, two windows a floor on the left side's front part (rA70's view, through a
  // tree), one small window high on the right side (RHEq's)
  const L0 = [fx0, fz0], L1 = [fx0, fz1]; // outward (-x) to the left of L0 -> L1
  for (const [y0, y1] of [W.ground, W.upper]) for (const t of [0.25, 0.7]) faceWindow(b, L0, L1, t, 1.0, y0, y1, y0 === W.ground[0]);
  faceWindow(b, [fx1, fz1], [fx1, fz0], 0.65, 0.6, W.upper[0] + 0.3, W.upper[1]);
}
