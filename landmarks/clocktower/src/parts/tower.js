// The tower: four chamfered corner blocks round the foot of the shaft (the lower stage, its roofline
// bristling with stacked "cross" pinnacles and flared gablets); an octagonal shaft between strong corner
// ribs, each face with slit lights, a deep central opening, pierced feather tracery and, on the four
// main faces, a clock (a feather star on the diagonals) under a flared gable; a pinnacle on every corner, a low
// pyramid roof and a tall pinnacle-spirelet in the middle.
// Sizes from the LINZ 2024 LiDAR (see the report): the shaft's faces stand 3.55 m from the axis, the
// corner pinnacles at r = 3.7-3.8 m reach 36.3 m, the gables' foot is at 32.7 m, the spirelet 40.8 m;
// the corner blocks fill |x|, |z| from 2.3 to 6.7-6.9 m, walls to 18.6 m, pinnacles to 21-23 m.
import * as THREE from "three";
import { addWindow, outline } from "../gothic.js";
import { SPIRE_TOP } from "./common.js";
import { Part, faceMatrix, crossPinnacle, gablePts, gableCoping, fern, pointedBand, clock } from "./tower_kit.js";

const A = 3.3; // apothem of the shaft's faces
const TURN = (-2.5 * Math.PI) / 180; // the shaft stands turned 2.5 degrees from the facade's axes (LiDAR)
const W = 2 * A * Math.tan(Math.PI / 8); // a face's width, corner to corner
const FOOT = 12.0; // the shaft and blocks start inside the centre's roof
const EAVE = 32.7, GABLE = 1.3; // the foot and rise of the gables over the faces
const RIB_R = A / Math.cos(Math.PI / 8), PIN_TOP = 36.35;
const BLOCK_TOP = 18.0;

/** One face of the shaft, facing +z with its surface at z = A; cardinal faces carry the clock. */
function shaftFace(cardinal, k) {
  const p = new Part();
  const sh = new THREE.Shape([new THREE.Vector2(-W / 2 - 0.02, FOOT), new THREE.Vector2(W / 2 + 0.02, FOOT), ...gablePts(W + 0.04, GABLE, 10, EAVE).reverse()]);
  const hole = (x, y, w, h, head = "pointed", kk = 0.8) => sh.holes.push(new THREE.Path(outline(w, h, head, kk).map((v) => new THREE.Vector2(v.x + x, v.y + y))));
  // lower register: slit lights either side, in two tiers
  for (const x of [-0.78, 0.78]) { hole(x, 17.7, 0.3, 2.05, "flat"); hole(x, 20.1, 0.3, 1.95, "flat"); }
  // middle register: the deep central opening and a narrow light each side
  hole(0, 22.45, 0.7, 4.45, "pointed", 0.8);
  for (const x of [-0.78, 0.78]) hole(x, 22.45, 0.3, 3.15, "pointed", 0.8);
  // the pierced tracery above: three pointed lights filled with feathers, the middle one over the opening
  for (const x of [-0.665, 0.665]) hole(x, 25.85, 0.6, 4.25, "pointed", 0.9);
  hole(0, 27.15, 0.5, 3.05, "pointed", 0.9);
  if (!cardinal) hole(0, 30.35, 0.9, 2.3, "pointed", 0.9); // the diagonals: a feather star where the clocks are
  p.slab(sh, 0, 0, A, 0.42, "smooth", 6);
  // glass and bars in the central opening
  p.slab(new THREE.Shape(outline(0.72, 4.47, "pointed", 0.8)), 0, 22.44, A - 0.3, 0.02, "glass");
  for (const x of [-0.12, 0.12]) p.box(x - 0.025, x + 0.025, 22.45, 26.6, A - 0.29, A - 0.24, "iron");
  for (let y = 23.0; y < 26.5; y += 0.55) p.box(-0.35, 0.35, y, y + 0.04, A - 0.29, A - 0.25, "iron");
  // feathers in the tracery lights
  for (const x of [-0.665, 0.665]) fern(p, x, 25.85, 29.95, 0.6, A - 0.04, 0.2, "dressed", -0.9, 0.5, 0.15);
  fern(p, 0, 27.15, 30.05, 0.5, A - 0.04, 0.2, "dressed", -0.9, 0.46, 0.14);
  // colonnettes between the lights, with little corbel ledges at the transoms
  for (const x of [-0.465, 0.465]) {
    p.box(x - 0.065, x + 0.065, 17.4, 26.0, A - 0.02, A + 0.1, "dressed");
    for (const y of [19.82, 25.85]) p.box(x - 0.16, x + 0.16, y, y + 0.12, A - 0.02, A + 0.2, "dressed");
  }
  p.box(-1.06, 1.06, 22.2, 22.34, A - 0.02, A + 0.16, "dressed");
  p.box(-1.06, 1.06, 17.25, 17.4, A - 0.02, A + 0.12, "dressed");
  // the pointed arch round the tracery and the clock, and the gable's coping
  pointedBand(p, 0, 25.75, 1.98, 8.0, 0.95, 0.11, A + 0.1, 0.12);
  gableCoping(p, W, GABLE, 0.22, EAVE, A + 0.1, 0.3);
  if (cardinal) clock(p, 31.3, 0.9, A, (k * 0.9 + 2.1) % (Math.PI * 2), 5.2);
  else {
    fern(p, 0, 30.35, 32.5, 0.9, A - 0.04, 0.2, "dressed", -0.7, 0.46, 0.14);
    fern(p, 0, 30.6, 31.9, 0.9, A - 0.08, 0.14, "dressed", 0.7, 0.5, 0.1);
  }
  return p;
}

/** A corner rib of the shaft, at radius 0 along local +z, with its capital and pinnacle. */
function cornerRib() {
  const p = new Part();
  p.box(-0.32, 0.32, FOOT, EAVE - 0.15, -0.35, 0.08, "smooth");
  p.box(-0.17, 0.17, FOOT + 0.5, EAVE - 0.3, 0.08, 0.17, "dressed");
  for (const y of [17.25, 22.2]) p.box(-0.36, 0.36, y, y + 0.16, -0.35, 0.22, "dressed");
  p.box(-0.42, 0.42, EAVE - 0.25, EAVE + 0.35, -0.45, 0.42, "dressed");
  crossPinnacle(0.46, PIN_TOP - EAVE - 0.35, 5, 0.14).into(p, new THREE.Matrix4().makeTranslation(0, EAVE + 0.35, 0));
  return p;
}

/** One corner block of the lower stage, in the quadrant (sx, sz). */
function cornerBlock(b, sx, sz) {
  // plan in quadrant coordinates (u, v) = (sx * x, sz * z), chamfered on its outer corners
  const plan = [[2.3, 2.3], [6.2, 2.3], [6.7, 2.8], [6.7, 6.3], [6.1, 6.9], [2.9, 6.9], [2.3, 6.3]];
  const pts = plan.map(([u, v]) => [sx * u, sz * v]);
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: BLOCK_TOP - FOOT, bevelEnabled: false });
  g.rotateX(-Math.PI / 2); g.translate(0, FOOT, 0); b.add(g, "smooth");
  // a low roof inside the parapet
  const inset = new THREE.Shape(plan.map(([u, v]) => new THREE.Vector2(sx * (u + (u > 4 ? -0.35 : 0.35)), -sz * (v + (v > 4 ? -0.35 : 0.35)))));
  const r = new THREE.ExtrudeGeometry(inset, { depth: 0.7, bevelEnabled: false });
  r.rotateX(-Math.PI / 2); r.translate(0, BLOCK_TOP, 0); b.add(r, "roof");
  const cx = sx * 4.5, cz = sz * 4.6;
  for (let i = 0; i < pts.length; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % pts.length];
    const L = Math.hypot(x1 - x0, z1 - z0);
    let nx = (z1 - z0) / L, nz = -(x1 - x0) / L;
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    if (nx * (mx - cx) + nz * (mz - cz) < 0) { nx = -nx; nz = -nz; }
    b.matrix = faceMatrix(mx, mz, nx, nz);
    // the visible width of the face and its centre along it (inner faces are half hidden by the shaft)
    const inner = i === 0 || i === pts.length - 1;
    const vis = inner ? 2.5 : L;
    const o = inner ? centreOffset(x0, z0, x1, z1, nx, nz, vis) : 0;
    // parapet course and a flared gablet over each face
    b.box(-L / 2, L / 2, BLOCK_TOP - 0.3, BLOCK_TOP - 0.12, -0.2, 0.12, "dressed");
    const gw = (inner ? vis : L) - 0.35;
    const gs = new THREE.Shape(gablePts(gw, gw > 1.5 ? 0.75 : 0.5, 8, 0));
    b.slab(gs, o, BLOCK_TOP - 0.12, 0.0, 0.3, "smooth");
    const cp = new Part(); gableCoping(cp, gw, gw > 1.5 ? 0.75 : 0.5, 0.14, BLOCK_TOP - 0.12, 0.08, 0.26);
    cp.stamp(b, new THREE.Matrix4().multiplyMatrices(b.matrix, new THREE.Matrix4().makeTranslation(o, 0, 0)));
    if (vis >= 2.0) {
      // pointed windows, two on the long outer faces, each under a blind feather panel
      const xs = vis > 3.0 ? [o - 0.85, o + 0.85] : [o];
      const fp = new Part();
      for (const x of xs) {
        addWindow(b, { x, y: 13.6, w: 0.85, h: 2.4, head: "pointed", lights: 1, k: 0.9, reveal: 0.1, frame: 0.06 }, 0.12);
        pointedBand(fp, x, 16.2, 0.8, 1.65, 0.85, 0.08, 0.1, 0.12);
        fern(fp, x, 16.25, 17.7, 0.78, 0.07, 0.07, "dressed", 0.9, 0.34, 0.08);
      }
      fp.stamp(b, b.matrix);
    } else if (L > 1.0) {
      // chamfers: a slim blind lancet
      const fp = new Part(); pointedBand(fp, 0, 15.0, 0.4, 2.6, 0.9, 0.08, 0.06, 0.08);
      fp.stamp(b, b.matrix);
    }
    b.matrix = null;
  }
  // pilasters up the corners of the plan (not the inner one, which is inside the shaft), ending in pinnacles
  const small = crossPinnacle(0.4, 2.4, 3);
  for (let i = 1; i < plan.length; i++) {
    const [u, v] = plan[i];
    const du = u > 4 ? -0.12 : 0.12, dv = v > 4 ? -0.12 : 0.12, x = sx * (u + du), z = sz * (v + dv);
    b.box(x - 0.26, x + 0.26, FOOT, BLOCK_TOP + 0.1, z - 0.26, z + 0.26, "dressed");
    small.stamp(b, new THREE.Matrix4().makeTranslation(x, BLOCK_TOP + 0.1, z));
  }
  crossPinnacle(0.5, 4.4, 4).stamp(b, new THREE.Matrix4().makeTranslation(sx * 3.9, BLOCK_TOP + 0.1, sz * 3.9));
}

/** Where along an inner face (in its local x) the visible part, vis wide at the outer end, is centred. */
function centreOffset(x0, z0, x1, z1, nx, nz, vis) {
  // local x runs along t = (nz, -nx); the outer end is the one farther from the axis
  const tx = nz, tz = -nx, L = Math.hypot(x1 - x0, z1 - z0);
  const s0 = (x0 - (x0 + x1) / 2) * tx + (z0 - (z0 + z1) / 2) * tz; // local x of the first end
  const outerS = Math.hypot(x0, z0) > Math.hypot(x1, z1) ? s0 : -s0;
  return Math.sign(outerS) * (L / 2 - vis / 2 - 0.15);
}

export function tower(b) {
  // the lower stage: four corner blocks
  for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) cornerBlock(b, sx, sz);

  // the octagonal shaft: a dark core, then eight pierced faces and eight corner ribs
  const core = new THREE.CylinderGeometry((A - 0.5) / Math.cos(Math.PI / 8), (A - 0.5) / Math.cos(Math.PI / 8), EAVE - FOOT, 8);
  core.rotateY(Math.PI / 8 + TURN); core.translate(0, (FOOT + EAVE) / 2, 0); b.add(core, "iron");
  const deck = new THREE.CylinderGeometry(A / Math.cos(Math.PI / 8), A / Math.cos(Math.PI / 8), 0.2, 8);
  deck.rotateY(Math.PI / 8 + TURN); deck.translate(0, EAVE - 0.1, 0); b.add(deck, "smooth");
  const cardinal = shaftFace(true, 0), diagonal = shaftFace(false, 0);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    (k % 2 ? diagonal : cardinal).stamp(b, new THREE.Matrix4().makeRotationY(a + TURN));
  }
  const rib = cornerRib();
  for (let k = 0; k < 8; k++) {
    const a = Math.PI / 8 + (k * Math.PI) / 4 + TURN;
    rib.stamp(b, new THREE.Matrix4().makeRotationY(a).multiply(new THREE.Matrix4().makeTranslation(0, 0, RIB_R)));
  }

  // the crown: a low pyramid roof behind the gables and the central pinnacle-spirelet
  const roof = new THREE.ConeGeometry(A / Math.cos(Math.PI / 8) - 0.1, 2.9, 8, 1, true);
  roof.rotateY(Math.PI / 8 + TURN); roof.translate(0, EAVE + 1.45, 0); b.add(roof, "roof");
  const base = new THREE.CylinderGeometry(0.45, 0.6, 1.2, 8); base.translate(0, 35.3, 0); b.add(base, "dressed");
  crossPinnacle(0.6, SPIRE_TOP - 35.85, 7, 0.16).stamp(b, new THREE.Matrix4().makeTranslation(0, 35.85, 0));
}
