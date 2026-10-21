// The recessed centre between the pavilions: a deep Tudor-arched doorway under a two-turreted oriel,
// a broad flight of steps between cheek walls and pedestals, a flat-roofed porch on piers to the right,
// three-light windows in the side bays, a parapet, and crocketed pinnacles on the turrets.
// Sizes from the LINZ 2024 LiDAR (wall face, bay width, steps, porch, parapet, pinnacles) and, for
// what the LiDAR cannot see, scaled from the Street View door views (see the centre report).
import * as THREE from "three";
import { addWindow, addPinnacle, addCourse, outline, cuspedOutline } from "../gothic.js";
import { TOWER_HALF } from "./common.js";
import { tudor, archBand, ring, shapeOf, pathOf, loft, pedestal, boss, pendant, shield, lantern, faceFrame } from "./centre_kit.js";

// Measured (view frame, metres). The doorway axis is not the tower's: steps, cheek walls and oriel
// turrets are all symmetric about x = -0.95.
const AX = -0.95; // doorway axis
const W = 10.8; // face of the centre's wall (LiDAR 10.6–11.0; common.js BAY_FRONT says 12.5)
const LAND = 1.6; // top of the landing before the door (LiDAR 1.6)
const PARA = 11.9; // parapet top (LiDAR 11.9–12.0); flat roof behind at 11.0
const STEP_END = 17.5; // foot of the steps (LiDAR 17.4–17.6)
const LAND_END = 15.0; // front edge of the landing (LiDAR)
const CHEEK = [2.05, 2.8]; // cheek walls, inner and outer offsets from the axis (LiDAR)
// the door: opening, springing and rise of its four-centred head, above the landing
const DW = 2.9, DSPR = 3.0, DRISE = 0.42;
// oriel turrets: prow-shaped bays at AX ± TX, back half-width THW, projecting TD; corbelled out from
// TY0 to TY1, faces to TTOP; apex pinnacles to ~14.8 (LiDAR 14.5–14.8)
const TX = 2.45, THW = 1.1, TD = 1.3, TY0 = 4.95, TY1 = 5.8, TTOP = 11.3;
const CB = TX - THW; // half-width of the flat centre between the turrets
const CF = W + 0.32; // its face (LiDAR 11.0–11.2)
// windows of the side bays (x offsets from the axis)
const SIDE = 4.5, SW = 1.7;
const GROUND = { y: 2.95, h: 2.6 }, UPPER = { y: 7.45, h: 2.55 };

/** The recessed centre between the pavilions, from x0 to x1 (the pavilions' inner sides). */
export function centre(b, x0, x1) {
  body(b, x0, x1);
  frontWall(b, x0, x1);
  doorway(b);
  for (const s of [-1, 1]) turret(b, AX + s * TX);
  centrePanel(b);
  parapet(b, x0, x1);
  steps(b);
  porch(b);
  for (const s of [-1, 1]) lantern(b, AX + s * 2.62, 3.75, W);
}

/** The mass behind the front wall, leaving a vestibule behind the door, and the flat roof. */
function body(b, x0, x1) {
  const back = TOWER_HALF, vb = W - 3.2, a = AX - DW / 2 - 0.05, c = AX + DW / 2 + 0.05;
  b.box(x0, a, 0, 11.0, back, W - 0.6, "smooth");
  b.box(c, x1, 0, 11.0, back, W - 0.6, "smooth");
  b.box(a, c, 0, 11.0, back, vb, "smooth");
  b.box(a, c, LAND + DSPR + 0.45, 11.0, vb, W - 0.6, "smooth"); // vestibule ceiling
  b.box(a, c, 0, LAND, vb, W, "smooth"); // vestibule floor
  b.box(x0, x1, 10.9, 11.0, back, W - 0.3, "roof");
  // the vestibule: tiled walls in shade, a timber inner doorway with glazed leaves and a fanlight
  const z = vb + 0.02, top = LAND + DSPR + 0.45;
  b.box(a + 0.02, a + 0.06, LAND, top, vb, W - 0.6, "shade");
  b.box(c - 0.06, c - 0.02, LAND, top, vb, W - 0.6, "shade");
  b.box(a, c, LAND, top, vb, z, "shade");
  b.box(a + 0.1, c - 0.1, top - 0.05, top, vb, W - 0.6, "shade");
  // the inner doorway: a dark hall seen past an open leaf (left) and a closed glazed leaf (right), under a fanlight
  const dw = 1.8, dh = 3.0, zi = z + 0.01;
  b.box(AX - dw / 2, AX + dw / 2, LAND, LAND + dh, zi, zi + 0.005, "iron");
  const bars = [[-dw / 2 - 0.12, -dw / 2, 0, dh + 0.12], [dw / 2, dw / 2 + 0.12, 0, dh + 0.12], [-dw / 2, dw / 2, dh, dh + 0.12],
    [-dw / 2, dw / 2, 2.3, 2.42], [-0.06, 0.06, 0, 2.3], [dw / 2 - 0.1, dw / 2, 0, 2.3], [0.06, dw / 2, 0, 0.7], [0.42, 0.48, 0.7, 2.3], [-0.03, 0.03, 2.42, dh]];
  for (const [u0, u1, v0, v1] of bars) b.box(AX + u0, AX + u1, LAND + v0, LAND + v1, zi, zi + 0.07, "timber");
  b.box(AX + 0.06, AX + dw / 2, LAND + 0.7, LAND + 2.3, zi + 0.02, zi + 0.025, "glass");
  b.box(AX - dw / 2, AX + dw / 2, LAND + 2.42, LAND + dh, zi + 0.02, zi + 0.025, "glass");
  b.box(AX - dw / 2 - 0.02, AX - dw / 2 + 0.04, LAND, LAND + 2.3, zi + 0.07, zi + 0.85, "timber"); // the open leaf
}

/** The front wall of the centre with its window and door openings, plinth and courses. */
function frontWall(b, x0, x1) {
  const wins = [];
  for (const s of [-1, 1]) {
    wins.push({ x: AX + s * SIDE, y: GROUND.y, w: SW, h: GROUND.h, lights: 3, transoms: [1.7] });
    wins.push({ x: AX + s * SIDE, y: UPPER.y, w: SW, h: UPPER.h, head: "pointed", lights: 3, transoms: [1.45], k: 0.78 });
    wins.push({ x: AX + s * 3.1, y: 2.85, w: 0.48, h: 1.75, lights: 1 });
  }
  const s = new THREE.Shape([[x0, 0], [x1, 0], [x1, 11.3], [x0, 11.3]].map(([x, y]) => new THREE.Vector2(x, y)));
  for (const w of wins) s.holes.push(pathOf(outline(w.w, w.h, w.head ?? "flat", w.k ?? 0.8), w.x, w.y));
  s.holes.push(pathOf(tudor(DW, DSPR, DRISE), AX, LAND));
  b.slab(s, 0, 0, W, 0.6, "smooth");
  for (const w of wins) addWindow(b, w, W);
  // hood moulds with label stops over the upper side windows
  for (const sx of [-1, 1]) {
    const x = AX + sx * SIDE, u = UPPER;
    b.slab(archBand(outline(SW + 0.52, u.h + 0.36, "pointed", 0.78), outline(SW + 0.3, u.h + 0.2, "pointed", 0.78), 0.3), x, u.y - 0.12, W + 0.14, 0.14, "dressed");
  }
  // rock-faced plinth of the side bays and the courses
  for (const [a, c] of [[x0, AX - CHEEK[1]], [AX + CHEEK[1], x1]]) {
    b.box(a, c, 0, 2.55, W - 0.2, W + 0.08, "ashlar");
    addCourse(b, a, c, 2.55, W + 0.08, 0.14, 0.08);
    for (const [p, q] of [[a, AX - TX - THW], [AX + TX + THW, c]]) if (q > p) addCourse(b, Math.max(p, a), Math.min(q, c), 7.2, W, 0.14, 0.1);
  }
}

/** The doorway: a four-centred arch in receding moulded orders, the timber tracery head and open doors. */
function doorway(b) {
  const y = LAND;
  // three receding orders and an outer hollow, each a ring a little wider, higher and further forward
  const orders = [[DW, 0.0, 0.06], [DW + 0.36, 0.14, 0.12], [DW + 0.8, 0.26, 0.2], [DW + 1.25, 0.32, 0.26]];
  for (let i = 1; i < orders.length; i++) {
    const [wi, , ] = orders[i - 1], [wo, dz] = orders[i];
    const lift = (wo - DW) * 0.22;
    const li = (wi - DW) * 0.22, ro = 0.85 * (DRISE + lift * 0.9), ri = 0.85 * (DRISE + li * 0.9);
    const o = tudor(wo, DSPR + lift * 0.4, DRISE + lift * 0.9, ro), n = tudor(wi, DSPR + li * 0.4, DRISE + li * 0.9, ri);
    b.slab(ring(o, n), AX, y, W + dz, 0.6 + dz, i === orders.length - 1 ? "smooth" : "dressed");
  }
  // a hood moulding rising to a point under the carved panel, between the turrets' corbels
  const hoodO = tudor(DW + 1.5, DSPR + 0.3, DRISE + 0.62, 0.85), hoodI = tudor(DW + 1.3, DSPR + 0.28, DRISE + 0.5, 0.75);
  b.slab(archBand(hoodO, hoodI, 0.35), AX, y, W + 0.4, 0.4, "dressed");
  // reveal lining through the wall
  b.slab(ring(tudor(DW + 0.02, DSPR, DRISE), tudor(DW - 0.06, DSPR - 0.02, DRISE - 0.03)), AX, y, W, 0.6, "dressed");
  // timber frame set back in the opening: posts, transom and the traceried head of six pointed lights
  const zf = W - 0.55, tr = 2.4; // transom height above the landing
  for (const s of [-1, 1]) b.box(AX + s * (DW / 2 - 0.06) - 0.07, AX + s * (DW / 2 - 0.06) + 0.07, y, y + tr, zf - 0.12, zf, "timber");
  b.box(AX - DW / 2, AX + DW / 2, y + tr - 0.02, y + tr + 0.14, zf - 0.14, zf, "timber");
  const lights = 6, lw = (DW - 0.24) / lights, headSil = tr + 0.14;
  const plate = new THREE.Shape(archOfHead(headSil));
  for (let i = 0; i < lights; i++) {
    const cx = -DW / 2 + 0.12 + lw / 2 + i * lw, top = Math.min(headTop(cx - lw / 2), headTop(cx + lw / 2)) - 0.06;
    const lh = Math.max(0.25, top - headSil + 0.02), lp = cuspedOutline(lw - 0.11, lh, 0.75, 0.05);
    plate.holes.push(pathOf(lp, cx, headSil + 0.06));
    b.slab(shapeOf(lp), AX + cx, y + headSil + 0.06, zf - 0.08, 0.02, "glass");
  }
  b.slab(plate, AX, y, zf, 0.12, "timber");
  // the two door leaves folded back against the reveals inside the opening
  for (const s of [-1, 1]) {
    const x = AX + s * (DW / 2 - 0.12);
    b.box(x - 0.04, x + 0.04, y, y + tr - 0.03, zf - 0.12 - DW / 2 + 0.05, zf - 0.12, "timber");
  }
  // a low iron gate across part of the landing, left of the door (seen in the photographs)
}

/** The door head above the transom at height sill, as a closed outline (local to the door axis). */
function archOfHead(sill) {
  const arch = tudor(DW, DSPR, DRISE).slice(2);
  return [new THREE.Vector2(DW / 2, sill), ...arch, new THREE.Vector2(-DW / 2, sill)];
}

/** Height of the door head's intrados above the landing at local x. */
function headTop(x) {
  const pts = tudor(DW, DSPR, DRISE).slice(2), ax = Math.min(Math.abs(x), DW / 2);
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i], q = pts[i + 1];
    if (p.x >= ax && q.x <= ax) return p.y + ((ax - p.x) * (q.y - p.y)) / (q.x - p.x || 1);
  }
  return DSPR + DRISE;
}

/** A prow-shaped oriel turret at x = cx: corbelled out over the ground floor, two-light windows in both faces. */
function turret(b, cx) {
  const L = [cx - THW, W], A = [cx, W + TD], R = [cx + THW, W];
  // corbelling: a concave cove from the wall out to the full prow, and a pendant boss under the apex
  const levels = [];
  // stepped corbel courses on a concave line (vertical faces only, so no faceted shading)
  for (let i = 0; i < 6; i++) {
    const t = (i + 1) / 6, p = TD * (1 - Math.cos((Math.PI / 2) * t)) * 0.96 + 0.03, hw = THW;
    const y0 = TY0 + ((TY1 - TY0) * i) / 6, y1 = TY0 + ((TY1 - TY0) * (i + 1)) / 6, pts = [[cx - hw, W - 0.05], [cx, W + p], [cx + hw, W - 0.05]];
    levels.push(loft([{ y: y0, pts }, { y: y1, pts }]));
  }
  for (const g of levels) b.add(g, "dressed");
  pendant(b, cx, TY0 + 0.35, W + TD * 0.3, 0.4);
  for (const s of [-1, 1]) pendant(b, cx + s * (THW - 0.05), TY0 + 0.35, W + 0.2, 0.34);
  // the two faces, each a wall with a two-light window and a crocketed gablet over it
  for (const [p, q] of [[L, A], [A, R]]) {
    const len = faceFrame(b, p[0], p[1], q[0], q[1]);
    const ww = 0.82, win = { x: len / 2, y: UPPER.y, w: ww, h: UPPER.h, head: "pointed", lights: 2, transoms: [1.45], k: 0.8 };
    // the face's foot is a flat pointed arch from corbel to corbel, the cove showing under it
    const arch = tudor(len - 0.16, 0, TY1 - TY0 - 0.3, 0.25).slice(2).reverse().map((v) => new THREE.Vector2(v.x + len / 2, v.y + TY0 + 0.3));
    const s = new THREE.Shape([new THREE.Vector2(0, TY0 + 0.3), ...arch, new THREE.Vector2(len, TY0 + 0.3), new THREE.Vector2(len, TTOP), new THREE.Vector2(0, TTOP)]);
    s.holes.push(pathOf(outline(ww, UPPER.h, "pointed", 0.8), len / 2, UPPER.y));
    b.slab(s, 0, 0, 0, 0.3, "smooth");
    addWindow(b, win, 0);
    // blind panel below the window, and the gablet
    b.slab(ring(outline(len - 0.35, UPPER.y - TY1 - 0.45), outline(len - 0.5, UPPER.y - TY1 - 0.6), 0.075), len / 2, TY1 + 0.15, 0.03, 0.03, "dressed");
    // a tall crocketed gablet over the window, its finial at the cornice
    const top = UPPER.y + UPPER.h, gh = TTOP - 0.1 - (top - 0.55), gab = new THREE.Shape([[-ww / 2 - 0.14, top - 0.55], [ww / 2 + 0.14, top - 0.55], [0, top - 0.55 + gh]].map(([x, y]) => new THREE.Vector2(x, y)));
    gab.holes.push(new THREE.Path([[-ww / 2 + 0.02, top - 0.47], [0, top - 0.55 + gh - 0.28], [ww / 2 - 0.02, top - 0.47]].map(([x, y]) => new THREE.Vector2(x, y))));
    b.slab(gab, len / 2, 0, 0.12, 0.1, "dressed");
    for (let i = 1; i <= 4; i++) for (const sd of [-1, 1]) {
      const t = i / 5, k = new THREE.IcosahedronGeometry(0.05, 0);
      k.translate(len / 2 + sd * (ww / 2 + 0.14) * (1 - t), top - 0.55 + gh * t + 0.04, 0.08);
      b.add(k, "dressed");
    }
    // blind panel with a pointed head between the gablet and the cornice
    // cornice and parapet along the face
    b.box(-0.05, len + 0.05, TTOP, TTOP + 0.18, -0.25, 0.12, "dressed");
    b.box(0, len, TTOP + 0.18, TTOP + 0.65, -0.25, 0, "smooth");
    b.box(-0.05, len + 0.05, TTOP + 0.65, TTOP + 0.75, -0.3, 0.06, "dressed");
    b.matrix = null;
  }
  // a slim shaft up the prow from the pendant to the pinnacle, and pinnacles at the apex and the corners
  b.box(cx - 0.11, cx + 0.11, TY0 + 0.3, TTOP + 0.75, W + TD - 0.12, W + TD + 0.08, "dressed");
  addPinnacle(b, cx, TTOP + 0.75, W + TD - 0.1, 0.42, 2.75);
  for (const s of [-1, 1]) addPinnacle(b, cx + s * (THW - 0.12), TTOP + 0.75, W + 0.05, 0.3, 1.9);
  // a roof over the turret
  b.add(loft([{ y: TTOP + 0.4, pts: [[cx - THW + 0.1, W - 0.1], [cx, W + TD - 0.15], [cx + THW - 0.1, W - 0.1]] }, { y: TTOP + 0.5, pts: [[cx - THW + 0.1, W - 0.1], [cx, W + TD - 0.15], [cx + THW - 0.1, W - 0.1]] }]), "roof");
}

/** The flat centre between the turrets: carved armorial panel over the door, three-light window, raised parapet. */
function centrePanel(b) {
  const x0 = AX - CB, x1 = AX + CB, t = CF - W;
  const win = { x: AX, y: UPPER.y, w: 1.75, h: UPPER.h + 0.15, head: "pointed", lights: 3, transoms: [1.45], k: 0.75 };
  const s = new THREE.Shape([[x0, 5.75], [x1, 5.75], [x1, 12.0], [x0, 12.0]].map(([x, y]) => new THREE.Vector2(x, y)));
  s.holes.push(pathOf(outline(win.w, win.h, "pointed", 0.75), win.x, win.y));
  b.slab(s, 0, 0, CF, t + 0.05, "smooth");
  addWindow(b, win, CF);
  b.slab(archBand(outline(win.w + 0.5, win.h + 0.34, "pointed", 0.75), outline(win.w + 0.28, win.h + 0.2, "pointed", 0.75), 0.25), AX, win.y - 0.12, CF + 0.13, 0.13, "dressed");
  // the carved panel: a moulded frame with two leaning shields, a stem with knots and a ribbon of foliage
  b.slab(ring(outline(2.1, 1.55), outline(1.9, 1.35), 0.1), AX, 5.85, CF + 0.06, 0.06, "dressed");
  for (const sd of [-1, 1]) {
    const g = new THREE.ExtrudeGeometry(shield(0.68, 0.82), { depth: 0.07, bevelEnabled: false, curveSegments: 6 });
    g.rotateZ(sd * 0.16); g.translate(AX + sd * 0.45, 6.15, CF);
    b.add(g, "dressed");
  }
  b.box(AX - 0.05, AX + 0.05, 5.95, 7.1, CF, CF + 0.09, "dressed");
  for (const yy of [6.55, 6.85]) boss(b, AX, yy + 0.12, CF + 0.08, 0.16);
  for (let i = 0; i < 7; i++) {
    const k = new THREE.IcosahedronGeometry(0.075, 0); k.translate(AX - 0.75 + i * 0.25, 7.25 - Math.abs(i - 3) * 0.03, CF + 0.08);
    b.add(k, "dressed");
  }
  // the parapet between the turrets with two blind shields and a cornice
  for (const sd of [-1, 1]) {
    b.slab(ring(outline(0.8, 0.95), outline(0.66, 0.81), 0.07), AX + sd * 0.62, 10.72, CF + 0.04, 0.04, "dressed");
    b.slab(shield(0.46, 0.56), AX + sd * 0.62, 10.92, CF + 0.08, 0.08, "dressed");
  }
  addCourse(b, x0, x1, 11.75, CF, 0.12, 0.08);
  b.box(x0 - 0.05, x1 + 0.05, 11.95, 12.1, W - 0.4, CF + 0.08, "dressed");
  b.box(x0, x1, 11.0, 12.0, W - 0.5, W, "smooth");
}

/** The parapet of the side bays: a cornice, a plain parapet with carved bosses, and a coping. */
function parapet(b, x0, x1) {
  for (const [a, c] of [[x0, AX - TX - THW], [AX + TX + THW, x1]]) {
    addCourse(b, a, c, 11.15, W, 0.16, 0.1);
    b.box(a, c, 11.3, PARA - 0.1, W - 0.35, W, "smooth");
    b.box(a, c, PARA - 0.1, PARA, W - 0.4, W + 0.06, "dressed");
    const x = AX + Math.sign(a + c - 2 * AX) * SIDE;
    boss(b, x, 11.75, W + 0.05, 0.2);
  }
  b.box(x0, x1, 10.9, PARA - 0.1, W - 0.6, W - 0.35, "smooth");
}

/** Steps up to the landing between cheek walls, pedestals at the head and foot, handrails. */
function steps(b) {
  const n = 9, run = (STEP_END - LAND_END) / n, a = AX - CHEEK[0], c = AX + CHEEK[0];
  b.box(a, c, 0, LAND, W, LAND_END, "dressed");
  for (let i = 0; i < n; i++) b.box(a, c, 0, LAND - ((i + 1) * LAND) / (n + 1), W, LAND_END + (i + 1) * run, "dressed");
  for (const s of [-1, 1]) {
    const xi = AX + s * CHEEK[0], xo = AX + s * CHEEK[1], [p, q] = s < 0 ? [xo, xi] : [xi, xo], xm = (p + q) / 2;
    b.box(p, q, 0, 2.45, W, STEP_END, "smooth");
    // coping with a sloped top
    const cop = new THREE.Shape([[-0.42, 0], [0.42, 0], [0.42, 0.06], [0, 0.2], [-0.42, 0.06]].map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(cop, { depth: STEP_END - W, bevelEnabled: false }); g.translate(xm, 2.45, W);
    b.add(g, "dressed");
    pedestal(b, xm, 15.2, 0.95, 0, 3.3);
    pedestal(b, xm, STEP_END - 0.45, 0.9, 0, 2.75);
    // handrail along the inner face of the cheek wall
    const rx = xi - s * 0.12;
    const len = Math.hypot(STEP_END - LAND_END, LAND), ang = Math.atan2(LAND, STEP_END - LAND_END);
    const r = new THREE.CylinderGeometry(0.025, 0.025, len, 6); r.rotateX(Math.PI / 2 + ang); r.translate(rx, LAND / 2 + 0.9, (LAND_END + STEP_END) / 2);
    b.add(r, "iron");
    b.box(rx - 0.02, rx + 0.02, LAND + 0.9, LAND + 0.93, W + 0.5, LAND_END, "iron");
    for (const zz of [W + 0.6, LAND_END - 0.1]) b.box(rx - 0.02, rx + 0.02, LAND, LAND + 0.92, zz - 0.02, zz + 0.02, "iron");
  }
}

/** The flat-roofed porch to the right of the steps: a thin slab on square piers, a dark fascia. */
function porch(b) {
  const p0 = AX + CHEEK[1] + 0.15, p1 = 4.75, zf = 14.9, top = 4.4;
  for (const [a, c] of [[p0, p0 + 0.9], [p1 - 0.5, p1]]) b.box(a, c, 0, top - 0.3, zf - 0.7, zf, "smooth");
  b.box(p1 - 0.5, p1, 0, top - 0.3, W, zf - 0.62, "smooth"); // side wall toward the pavilion
  b.box(p0 - 0.1, p1 + 0.1, top - 0.3, top, W, zf + 0.1, "smooth");
  b.box(p0 - 0.12, p1 + 0.12, top - 0.32, top - 0.06, zf + 0.1, zf + 0.14, "iron");
  b.box(p0 - 0.14, p0 - 0.1, top - 0.32, top - 0.06, W, zf + 0.14, "iron");
  // the glazed lift lobby under it
  b.box(p0 + 0.7, p1 - 0.6, 0, 2.6, W + 1.2, W + 1.25, "iron");
  b.box(p0 + 0.75, p0 + 1.6, 0.2, 2.4, W + 1.25, W + 1.27, "glass");
}
