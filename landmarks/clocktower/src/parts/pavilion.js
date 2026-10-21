// The two gabled pavilions that stand forward to the street.
// Sizes measured from the LINZ 2024 LiDAR (class 6 and wall points) and proportions from the Street View
// photographs. The building stands turned about 1.6 degrees from the view frame (its fronts reach
// further toward the street on the right: pavilion fronts z = 17.1 left / 17.9 right, range fronts 5.3
// left / 7.4 right), so the pavilions and ranges are drawn in the building's own frame (BUILDING) and
// turned into the view frame by b.matrix.
import * as THREE from "three";
import { addWall, addWindow, addPinnacle, addCourse, addHood, boxesGeometry } from "../gothic.js";

/** The building's own frame: x along the front, turned 1.6 degrees about the tower's axis. */
export const BUILDING = new THREE.Matrix4().makeRotationY(-THREE.MathUtils.degToRad(1.6));

// measured (building frame, metres; y from the ground at the door)
const PAV = { left: [-16.65, -6.15], right: [5.45, 16.2] };
const FRONT = 17.25, BACK = -17.8; // wall face toward the street, back wall
const SHOULDER = 12.0, APEX = 13.7, ROOF_EAVE = 11.3, ROOF_RIDGE = 13.3; // parapets, gable, roof
const PLINTH = 3.05, CORNICE = 9.6; // plinth top (ground-floor sills sit on its course), cornice at the hood springing
const PIER = 2.05; // the rock-faced corner piers either side of the window bay
const GY = 3.4, UY = 8.0; // sills of the ground-floor windows and of the upper lancets
const SIDE_PIER = 5.0; // the outer sides: a deep rock-faced corner pier (Wqs3, hyoe), then smooth stone with windows
const RANGE_FRONT = { left: 6.15, right: 6.75 }; // where the range meets the pavilion's outer side

/** Runs fn with b.matrix set to (current) * m, so that parts can be drawn in a local frame. */
export function inFrame(b, m, fn) {
  const prev = b.matrix;
  b.matrix = prev ? prev.clone().multiply(m) : m.clone();
  try { fn(); } finally { b.matrix = prev; }
}

/** The bay's head: a flat four-centred arch with an ogee kick at the apex, as points from the right springing to the left. */
function bayArch(cx, bw, spring, rise) {
  const us = [0, 0.02, 0.05, 0.09, 0.15, 0.3, 0.5, 0.7, 0.85, 0.92, 0.97, 1];
  // a steep start, a straight run up, and an ogee kick at the apex
  const g = (u) => 0.6 * Math.sqrt(Math.min(u / 0.15, 1)) + 0.3 * u + (u > 0.85 ? 0.1 * ((u - 0.85) / 0.15) ** 2 : 0);
  const right = us.map((u) => new THREE.Vector2(cx + (bw / 2) * (1 - u), spring + rise * g(u)));
  const left = us.slice(0, -1).reverse().map((u) => new THREE.Vector2(cx - (bw / 2) * (1 - u), spring + rise * g(u)));
  return [...right, ...left];
}

/** A slender octagonal shaft from y0 to y1 at (x, z), with a base and a capital. */
function shaft(b, x, z, y0, y1, r) {
  const g = new THREE.CylinderGeometry(r, r, y1 - y0, 8, 1);
  g.rotateY(Math.PI / 8);
  g.translate(x, (y0 + y1) / 2, z);
  b.add(g, "dressed");
  b.add(boxesGeometry([
    [x - r * 1.35, x + r * 1.35, y0, y0 + 0.3, z - r * 1.35, z + r * 1.35],
    [x - r * 1.3, x + r * 1.3, y1 - 0.12, y1, z - r * 1.3, z + r * 1.3],
  ]), "dressed");
}

/** A coping stone along a segment of the gable (a, b: [x, y]), on a wall whose face is at z = front. */
function coping(b, [ax, ay], [bx, by], front, t = 0.62) {
  const len = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax);
  const g = new THREE.BoxGeometry(len + 0.16, 0.24, t + 0.16);
  g.translate(0, 0.12, 0);
  g.rotateZ(ang);
  g.translate((ax + bx) / 2, (ay + by) / 2, front - t / 2 + 0.04);
  b.add(g, "dressed");
}

/** The street front: rock-faced piers and gable, the smooth window bay under its great hood. */
function front(b, x0, x1) {
  const W = x1 - x0, cx = (x0 + x1) / 2, F = FRONT;
  const bx0 = x0 + PIER, bx1 = x1 - PIER, bw = bx1 - bx0, rise = 2.0;
  const arch = bayArch(cx, bw, CORNICE, rise);
  // rock-faced wall with the bay cut out of it
  const wall = new THREE.Shape([
    [x0, -0.4], [x1, -0.4], [x1, SHOULDER], [x1 - 1.6, SHOULDER], [cx, APEX], [x0 + 1.6, SHOULDER], [x0, SHOULDER],
  ].map(([x, y]) => new THREE.Vector2(x, y)));
  wall.holes.push(new THREE.Path([new THREE.Vector2(bx0, PLINTH + 0.25), new THREE.Vector2(bx1, PLINTH + 0.25), ...arch]));
  b.slab(wall, 0, 0, F, 0.6, "ashlar");
  // the bay: smooth stone set 0.15 back, with its windows
  const bf = F - 0.15, wins = [];
  const sx = 1.25; // the two shafts, either side of the middle
  const gs = (bw / 2 + sx) / 2; // centre of each side group
  wins.push({ x: cx, y: GY, w: 2.0, h: 2.75, lights: 3, transoms: [1.75], ratios: [1, 2, 1] });
  for (const s of [-1, 1]) wins.push({ x: cx + s * gs, y: GY, w: 1.4, h: 2.75, lights: 3, transoms: [1.75], ratios: [1, 1.5, 1] });
  const lancet = (x, w, h, tr = 1.2) => wins.push({ x, y: UY, w, h, head: "pointed", k: 0.75, lights: 1, transoms: [tr], surround: false, sill: false, frame: 0.06 });
  lancet(cx, 1.2, 3.0, 1.3);
  for (const s of [-1, 1]) {
    lancet(cx + s * 0.86, 0.34, 2.45, 1.2);
    lancet(cx + s * gs, 0.55, 2.75, 1.3);
    for (const d of [-0.5, 0.5]) lancet(cx + s * gs + d, 0.32, 2.4, 1.2);
  }
  const rel = [[0, 0], [bw, 0], ...arch.map((p) => [p.x - bx0, p.y - PLINTH - 0.25])];
  addWall(b, rel, bx0, PLINTH + 0.25, bf, 0.45, wins, "smooth");
  // a moulded frame round each group of lancets, and one sill under them
  const fr = [];
  for (const [gx, gw] of [[cx, 2.2], [cx - gs, 1.48], [cx + gs, 1.48]]) {
    fr.push([gx - gw / 2 - 0.08, gx - gw / 2 + 0.04, UY - 0.1, CORNICE, bf, bf + 0.08], [gx + gw / 2 - 0.04, gx + gw / 2 + 0.08, UY - 0.1, CORNICE, bf, bf + 0.08]);
    fr.push([gx - gw / 2 - 0.12, gx + gw / 2 + 0.12, UY - 0.18, UY, bf - 0.02, bf + 0.12]);
  }
  // blind panels between the floors: rails, a ledge and upright fillets under each light
  const P0 = GY + 2.95, P1 = UY - 0.18;
  fr.push([bx0, bx1, P0, P0 + 0.1, bf, bf + 0.06], [bx0, bx1, (P0 + P1) / 2, (P0 + P1) / 2 + 0.07, bf, bf + 0.08]);
  const fil = [cx - 0.64, cx + 0.64, cx - 1.06, cx + 1.06];
  for (const s of [-1, 1]) for (const d of [-0.3, 0.3, -0.7, 0.7]) fil.push(cx + s * gs + d);
  for (const x of fil) fr.push([x - 0.04, x + 0.04, P0, P1, bf, bf + 0.06]);
  // blind tracery under the hood: fillets rising from the lancets to the arch
  for (const [x, y0] of [[cx - 0.64, UY + 2.5], [cx + 0.64, UY + 2.5], [cx - gs, UY + 2.85], [cx + gs, UY + 2.85]]) fr.push([x - 0.035, x + 0.035, y0, CORNICE + rise * 0.8 - Math.abs(x - cx) * 0.2, bf, bf + 0.05]);
  b.add(boxesGeometry(fr), "dressed");
  // the great hood over the bay, landing on the cornice either side
  const off = 0.04, band = 0.2;
  const outer = bayArch(cx, bw + 2 * (off + band), CORNICE - 0.02, rise + off + band), inner = bayArch(cx, bw + 2 * off, CORNICE - 0.02, rise + off);
  b.slab(new THREE.Shape([...outer, ...inner.reverse()]), 0, 0, F + 0.14, 0.3, "dressed");
  // two slender shafts from the plinth course up through the hood, ending in small pinnacles
  for (const s of [-1, 1]) {
    shaft(b, cx + s * sx, bf + 0.12, PLINTH + 0.25, 11.4, 0.17);
    addPinnacle(b, cx + s * sx, 11.4, bf + 0.12, 0.32, 1.0);
  }
  // reveals of the bay (the piers' inner faces are dressed where they meet the smooth stone)
  b.add(boxesGeometry([[bx0 - 0.06, bx0 + 0.07, PLINTH + 0.25, CORNICE, bf, F + 0.01], [bx1 - 0.07, bx1 + 0.06, PLINTH + 0.25, CORNICE, bf, F + 0.01]]), "dressed");
  // plinth, its weathered course, the cornice on the piers
  b.box(x0 - 0.12, x1 + 0.12, -0.4, PLINTH, F - 0.5, F + 0.12, "ashlar");
  addCourse(b, x0 - 0.1, x1 + 0.1, PLINTH, F + 0.12, 0.25, 0.1);
  for (const [a, c] of [[x0, bx0 - 0.05], [bx1 + 0.05, x1]]) addCourse(b, a, c, CORNICE - 0.1, F, 0.22, 0.1);
  // gable coping, kneelers, a small cross at the apex
  const top = [[x0, SHOULDER], [x0 + 1.6, SHOULDER], [cx, APEX], [x1 - 1.6, SHOULDER], [x1, SHOULDER]];
  for (let i = 0; i < top.length - 1; i++) coping(b, top[i], top[i + 1], F);
  for (const x of [x0 + 1.6, x1 - 1.6]) b.box(x - 0.25, x + 0.25, SHOULDER - 0.05, SHOULDER + 0.42, F - 0.6, F + 0.12, "dressed");
  b.add(boxesGeometry([
    [cx - 0.22, cx + 0.22, APEX + 0.1, APEX + 0.5, F - 0.45, F],
    [cx - 0.07, cx + 0.07, APEX + 0.5, APEX + 1.15, F - 0.3, F - 0.16],
    [cx - 0.24, cx + 0.24, APEX + 0.82, APEX + 0.95, F - 0.3, F - 0.16],
  ]), "dressed");
}

/**
 * The outer side wall, facing away from the centre (side = -1 left, +1 right), from the front back to
 * the range: a rock-faced corner pier, then smooth stone with three bays of windows.
 */
function outerSide(b, x, side, rangeFront) {
  const len = FRONT - rangeFront;
  // local frame: x along the wall from the corner backward (right) or from the range forward (left), z out of the wall
  const m = new THREE.Matrix4().makeTranslation(x, 0, side > 0 ? FRONT : rangeFront).multiply(new THREE.Matrix4().makeRotationY(side * Math.PI / 2));
  inFrame(b, m, () => {
    // in this frame the corner (z = FRONT) is at local x = 0 on the right side and at x = len on the left
    const c0 = side > 0 ? 0 : len - SIDE_PIER, c1 = side > 0 ? SIDE_PIER : len; // the corner pier
    const s0 = side > 0 ? SIDE_PIER : 0, s1 = side > 0 ? len : len - SIDE_PIER; // the smooth part with the windows
    b.box(c0, c1, -0.4, SHOULDER, -0.6, 0, "ashlar");
    const wins = [], n = 3, bay = (s1 - s0) / n;
    for (let i = 0; i < n; i++) {
      const wx = s0 + bay * (i + 0.5);
      wins.push({ x: wx, y: GY, w: 0.62, h: 2.75, lights: 1, transoms: [1.75] });
      wins.push({ x: wx, y: UY, w: 0.55, h: 2.45, head: "pointed", k: 0.8, lights: 1, transoms: [1.05], hood: { off: 0.04, band: 0.1, drop: 0.25 } });
    }
    addWall(b, [[0, 0], [s1 - s0, 0], [s1 - s0, SHOULDER - PLINTH - 0.25], [0, SHOULDER - PLINTH - 0.25]], s0, PLINTH + 0.25, -0.05, 0.55, wins, "smooth");
    // pilaster strips between the bays, plinth and course, cornice on the pier, parapet coping
    const st = [];
    for (let i = 0; i <= n; i++) { const px = s0 + bay * i; st.push([px - 0.14, px + 0.14, PLINTH + 0.25, SHOULDER - 0.6, -0.05, 0.05]); }
    b.add(boxesGeometry(st), "smooth");
    b.box(0, len, -0.4, PLINTH, -0.5, 0.12, "ashlar");
    addCourse(b, 0, len, PLINTH, 0.12, 0.25, 0.1);
    addCourse(b, c0, c1, CORNICE - 0.1, 0, 0.22, 0.1);
    addCourse(b, s0, s1, SHOULDER - 0.6, 0, 0.18, 0.08);
    b.box(-0.08, len + 0.08, SHOULDER, SHOULDER + 0.24, -0.66, 0.08, "dressed");
  });
}

/** One of the two gabled pavilions that stand forward to the street (x0, x1 from common.js pick the side). */
export function pavilion(b, x0in, x1in) {
  const sideName = x0in < 0 ? "left" : "right", [x0, x1] = PAV[sideName], cx = (x0 + x1) / 2;
  const out = sideName === "left" ? -1 : 1, rangeFront = RANGE_FRONT[sideName];
  inFrame(b, BUILDING, () => {
    // body behind the walls, side and back walls, parapets
    b.box(x0 + 0.5, x1 - 0.5, -0.4, ROOF_EAVE, BACK + 0.5, FRONT - 0.55, "ashlar");
    const xo = out < 0 ? x0 : x1, xi = out < 0 ? x1 : x0;
    b.box(Math.min(xi, xi + out * 0.6), Math.max(xi, xi + out * 0.6), -0.4, SHOULDER, BACK, FRONT - 0.55, "ashlar"); // inner side
    b.box(Math.min(xo, xo - out * 0.6), Math.max(xo, xo - out * 0.6), -0.4, SHOULDER, BACK, rangeFront, "ashlar"); // outer side behind the range
    b.box(x0, x1, -0.4, SHOULDER, BACK, BACK + 0.6, "ashlar");
    b.box(x0 - 0.08, x0 + 0.62, SHOULDER, SHOULDER + 0.24, BACK, FRONT - 0.5, "dressed");
    b.box(x1 - 0.62, x1 + 0.08, SHOULDER, SHOULDER + 0.24, BACK, FRONT - 0.5, "dressed");
    // the low roof between the parapets, ridge along z
    const s = new THREE.Shape([new THREE.Vector2(x0 + 0.5, ROOF_EAVE), new THREE.Vector2(x1 - 0.5, ROOF_EAVE), new THREE.Vector2(cx, ROOF_RIDGE)]);
    const g = new THREE.ExtrudeGeometry(s, { depth: FRONT - 0.6 - BACK - 0.5, bevelEnabled: false });
    g.translate(0, 0, BACK + 0.5);
    b.add(g, "roof");
    front(b, x0, x1);
    outerSide(b, xo, out, rangeFront);
    // the inner side's plinth, from the front back to the recessed centre
    const xs = xi - out * 0.12;
    b.box(Math.min(xi, xs), Math.max(xi, xs), -0.4, PLINTH, 12.0, FRONT, "ashlar");
  });
}
