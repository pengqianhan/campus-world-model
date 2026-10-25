// The south-west range on Symonds Street in detail: two storeys of red brick with cream dressings, ten
// window bays between two cream end pavilions with giant columns in antis. Drawn in the face's own frame
// (parts/southwest_kit.js: u = z' along the range toward Grafton Road, y up, d out of the brick face).
//
// Sizes. The LiDAR: the parapet's outer edge (x' -24.6, top 14.2 to 14.35), the range's ends (z' about
// -23.6 at the back, the corner on the Grafton Road line), the footpath (GROUND.southWest). The 2022-09
// panoramas (Uype, nAxE, e8T_) and C1kG (2024-10): heights on the face interpolated between the parapet top
// and the plinth's foot (level floors: the plinth's top at 2.78 at both ends), and the plan in bays: the
// bays are equally spaced, so a 1D homography from bay index to image column, fitted in each view (residuals
// about 1 px), places the pavilions' edges in bay units; scaled to the LiDAR's length (37.7 m = 16.63 bays).
import { GROUND, swMatrix } from "./common.js";
import { Acc, faceMatrix, blocks, column, rusticated, arcBand, arcBlocks, wallWithHoles } from "./southwest_kit.js";

// ---- layout ----------------------------------------------------------------------------------------
export const FACE = -24.4;               // the brick face, x' (the parapet's face 0.2 out: the LiDAR edge -24.6)
const S = 2.266;                         // bay spacing
const K0 = -14.99;                       // bay 0's centre, u
export const bay = (k) => K0 + S * k;    // bays 0..9 between the pavilions
const PAV_D = 0.35;                      // the pavilions' pilasters stand out of the brick face by this
// u of the range's back end and of the corner (the pavilion's face meets the Grafton Road line z = 22.4)
const A = (22.25 * Math.PI) / 180;
export const BACK = -23.6;
export const CORNER = (22.4 + (FACE - PAV_D) * Math.sin(A)) / Math.cos(A); // 14.08
export const NWP = { u0: BACK, u1: bay(-0.5) };          // the north-west pavilion (bays -3.8 to -0.5)
export const CEP = { u0: bay(9.5), u1: CORNER };         // the corner pavilion (bays 9.5 to 12.83)

// heights (above the datum, 37.7 m)
export const H = {
  plinth: 2.78,                          // the plinth's top: the floors are level, the footpath falls to the corner
  gf: { apron: 3.76, sill: 4.42, glass: [4.63, 7.57], head: 8.15, cap: 8.36 },
  band: [8.86, 9.33],                    // the first floor's continuous sill band
  ff: { sill: 9.66, top: 12.55, upper: [11.3, 11.95] },
  cornice: [12.77, 13.95],
  parapet: 14.3,
  cap: 11.1,                             // the giant columns' and pilasters' capitals
  arch: [11.1, 12.0],                    // the entablature blocks over each pilaster and column
};
const GLASS_W = 0.68 * S;                // window glass, both floors (1.54)
const SURR_W = 0.84 * S;                 // the ground floor's architrave, outside (1.90)

/** The footpath's height at u (GROUND.southWest, in z'). */
export function groundAt(u) {
  const g = GROUND.southWest;
  if (u >= g[0][0]) return g[0][1];
  for (let i = 0; i < g.length - 1; i++) {
    const [z0, y0] = g[i], [z1, y1] = g[i + 1];
    if (u <= z0 && u >= z1) return y0 + ((y1 - y0) * (u - z0)) / (z1 - z0);
  }
  return g[g.length - 1][1];
}
const FOOT = -0.6;                       // walls and plinths reach down to here (the site's DEM differs)

// ---- pieces ----------------------------------------------------------------------------------------
/**
 * A steel window of many panes in an opening u0..u1, y0..y1, set `set` back: the panes, a white-grey frame,
 * a transom at `tr` (fraction of the height) and bars making `cols` columns, `lo` rows below the transom and
 * `hi` above. Its reveals in `reveal`.
 */
function steelWindow(acc, u0, u1, y0, y1, { set = 0.12, cols = 4, lo = 4, hi = 2, tr = 0.7, reveal = "render", mull = 0.06 } = {}) {
  const d = -set, f = 0.05, bar = 0.022;
  acc.quad("glassPale", u0, u1, y0, y1, d - 0.02);
  acc.box(reveal, u0 - 0.03, u0, y0, y1, d - 0.02, 0.0);
  acc.box(reveal, u1, u1 + 0.03, y0, y1, d - 0.02, 0.0);
  acc.box(reveal, u0 - 0.03, u1 + 0.03, y1, y1 + 0.03, d - 0.02, 0.0);
  acc.box("paint", u0, u0 + f, y0, y1, d - 0.02, d + 0.02);
  acc.box("paint", u1 - f, u1, y0, y1, d - 0.02, d + 0.02);
  acc.box("paint", u0, u1, y1 - f, y1, d - 0.02, d + 0.02);
  acc.box("paint", u0, u1, y0, y0 + f, d - 0.02, d + 0.02);
  const yt = y0 + (y1 - y0) * tr, c = (u0 + u1) / 2;
  acc.box("paint", u0, u1, yt - 0.03, yt + 0.03, d - 0.02, d + 0.025);
  if (cols % 2 === 0) acc.box("paint", c - mull / 2, c + mull / 2, y0, y1, d - 0.02, d + 0.025);
  for (let k = 1; k < cols; k++) if (!(cols % 2 === 0 && k === cols / 2)) { const uu = u0 + f + ((u1 - u0 - 2 * f) * k) / cols; acc.quad("paint", uu - bar / 2, uu + bar / 2, y0, y1, d + 0.012); }
  for (const [s0, s1, n] of [[y0 + f, yt - 0.03, lo], [yt + 0.03, y1 - f, hi]])
    for (let k = 1; k < n; k++) { const yy = s0 + ((s1 - s0) * k) / n; acc.quad("paint", u0 + f, u1 - f, yy - bar / 2, yy + bar / 2, d + 0.012); }
}

/** A window of three lights (narrow, wide, narrow) between cream mullions, in an opening u0..u1, y0..y1. */
function threeLight(acc, u0, u1, y0, y1, opts = {}) {
  const w = u1 - u0, m = 0.16, side = (w - 2 * m) / 4.3;
  const a = u0 + side, c = u1 - side;
  steelWindow(acc, u0, a, y0, y1, { cols: 2, ...opts });
  steelWindow(acc, a + m, c - m, y0, y1, { cols: 4, ...opts });
  steelWindow(acc, c, u1, y0, y1, { cols: 2, ...opts });
  for (const x of [a, c - m]) acc.box("render", x, x + m, y0, y1, -0.1, 0.02);
}

/**
 * The ground floor's architrave round a window (or a door, with `door`): cream sides SURR_W wide outside,
 * a head with a sunk panel line and a cornice cap, a projecting sill on an apron.
 */
function gfCase(acc, u, glassW, { door = false, d = 0 } = {}) {
  const { gf } = H, wo = glassW / 2 + (SURR_W - GLASS_W) / 2, wi = glassW / 2;
  const y0 = door ? H.plinth : gf.sill, gy0 = door ? H.plinth : gf.glass[0];
  acc.box("render", u - wo, u - wi, y0, gf.head, d, d + 0.08);
  acc.box("render", u + wi, u + wo, y0, gf.head, d, d + 0.08);
  acc.box("render", u - wo, u + wo, gf.glass[1], gf.head, d, d + 0.08);
  acc.box("render", u - wo + 0.06, u + wo - 0.06, gf.glass[1] + 0.06, gf.glass[1] + 0.09, d, d + 0.1); // the head's fillet
  acc.box("render", u - wi - 0.035, u - wi, gy0, gf.glass[1], d, d + 0.11); // the inner bead
  acc.box("render", u + wi, u + wi + 0.035, gy0, gf.glass[1], d, d + 0.11);
  acc.box("render", u - wi - 0.035, u + wi + 0.035, gf.glass[1], gf.glass[1] + 0.035, d, d + 0.11);
  acc.box("render", u - wo - 0.07, u + wo + 0.07, gf.head, gf.cap - 0.06, d, d + 0.14);
  acc.box("render", u - wo - 0.1, u + wo + 0.1, gf.cap - 0.06, gf.cap, d, d + 0.19);
  if (!door) {
    acc.box("render", u - wo, u + wo, gf.apron, gf.sill, d, d + 0.06);
    acc.box("render", u - wo - 0.06, u + wo + 0.06, gf.sill, gf.glass[0], d, d + 0.15);
  }
}

/** The main cornice and the parapet over u0..u1, its frieze plane at d. Ends returned when asked. */
function cornice(acc, u0, u1, d, { left = 0, right = 0 } = {}) {
  const [c0, c1] = H.cornice;
  const L = (p) => u0 - (left ? p : 0), R = (p) => u1 + (right ? p : 0);
  acc.box("render", L(0.1), R(0.1), c0, c0 + 0.13, d - 0.2, d + 0.1);          // bed mould
  acc.box("render", L(0.12), R(0.12), c0 + 0.13, c0 + 0.33, d - 0.2, d + 0.12);  // behind the dentils
  blocks(acc, "render", L(0.12) + 0.03, R(0.12) - 0.03, c0 + 0.13, c0 + 0.31, d + 0.12, d + 0.2, 0.085, 0.17); // dentils
  acc.box("render", L(0.22), R(0.22), c0 + 0.33, c0 + 0.4, d - 0.2, d + 0.22);   // a fillet
  acc.box("render", L(0.22), R(0.22), c0 + 0.4, c0 + 0.73, d - 0.2, d + 0.24);   // the soffit's backing
  blocks(acc, "render", L(0.22) + 0.1, R(0.22) - 0.1, c0 + 0.44, c0 + 0.73, d + 0.24, d + 0.56, 0.13, 0.46); // modillions
  acc.box("render", L(0.6), R(0.6), c0 + 0.73, c1 - 0.13, d - 0.2, d + 0.6);     // corona
  acc.box("render", L(0.56), R(0.56), c1 - 0.13, c1, d - 0.2, d + 0.55);         // cymatium
  // the parapet, plain, its face 0.2 out of the brick face (the LiDAR's edge), and its coping
  acc.box("render", L(0.2), R(0.2), c1, H.parapet - 0.07, d - 0.2, d + 0.2);
  acc.box("render", L(0.23), R(0.23), H.parapet - 0.07, H.parapet, d - 0.25, d + 0.23);
}

// ---- the range between the pavilions ---------------------------------------------------------------
function range(acc) {
  const r0 = NWP.u1, r1 = CEP.u0;
  const holes = [];
  for (let k = 0; k < 10; k++) {
    const u = bay(k), g0 = u - GLASS_W / 2, g1 = u + GLASS_W / 2;
    // ground floor: the window in its architrave
    holes.push([g0, g1, H.gf.glass[0], H.gf.glass[1]]);
    steelWindow(acc, g0, g1, H.gf.glass[0], H.gf.glass[1], { cols: 4, lo: 4, hi: 2, tr: 0.68 });
    gfCase(acc, u, GLASS_W);
    // first floor: the window on its sill block on the band
    holes.push([g0, g1, H.ff.sill, H.ff.top]);
    steelWindow(acc, g0, g1, H.ff.sill, H.ff.top, { cols: 4, lo: 4, hi: 2, tr: 0.68, reveal: "brick" });
    acc.box("render", g0 - 0.12, g1 + 0.12, H.band[1], H.ff.sill - 0.08, 0, 0.1);
    acc.box("render", g0 - 0.16, g1 + 0.16, H.ff.sill - 0.08, H.ff.sill, 0, 0.15);
  }
  // the brick wall
  wallWithHoles(acc, "brick", r0, r1, H.plinth, H.cornice[0], -0.4, 0, holes);
  // the plinth: cream, from below the footpath to the floor, a moulded top
  acc.box("render", r0, r1, FOOT, H.plinth - 0.12, -0.3, 0.07);
  acc.box("render", r0, r1, H.plinth - 0.12, H.plinth, -0.3, 0.1);
  // the first floor's sill band, and the cream band through the brick at the level of the upper panes
  acc.box("render", r0, r1, H.band[0], H.band[1], -0.1, 0.06);
  const up = H.ff.upper, bh = [];
  for (let k = 0; k < 10; k++) bh.push([bay(k) - GLASS_W / 2 - 0.04, bay(k) + GLASS_W / 2 + 0.04, up[0], up[1]]);
  wallWithHoles(acc, "render", r0, r1, up[0], up[1], 0, 0.03, bh);
  cornice(acc, r0, r1, 0);
  // small vents in the plinth, one under each pier
  for (let k = -1; k < 10; k++) { const u = bay(k + 0.5); if (u > r0 + 0.3 && u < r1 - 0.3) acc.box("void", u - 0.1, u + 0.1, H.plinth - 0.5, H.plinth - 0.38, 0.07, 0.075); }
}

// ---- the pavilions ---------------------------------------------------------------------------------
/**
 * A pavilion u0..u1: rusticated pilasters at each end, two giant columns in antis, the brick bay recessed
 * between them with a door (`door`) or a three-light window below and a three-light window above, the
 * entablature blocks over each pilaster-and-column pair, the frieze and the main cornice broken forward,
 * and a segmental pediment over the bay. `cornerRight`: the right end is the corner on Grafton Road.
 */
function pavilion(b, acc, P, { door = false, cornerRight = false } = {}) {
  const { u0, u1 } = P, d = PAV_D, c = (u0 + u1) / 2;
  const pil = 0.62 * S, r = 0.45, colU = 0.87 * S;
  const cl = u0 + colU, cr = u1 - colU;                         // column axes
  const bayD = -0.6;                                            // the recessed brick bay's face
  const base = H.plinth, foot = FOOT;
  // the pavilion's body: plinth across the whole width, rusticated pilasters, the bay's brick wall
  acc.box("render", u0, u1, foot, base - 0.12, bayD - 0.3, d + 0.1);
  acc.box("render", u0 - 0.03, u1 + (cornerRight ? 0.05 : 0.03), base - 0.12, base, bayD - 0.3, d + 0.13);
  for (const [a, e] of [[u0, u0 + pil], [u1 - pil, u1]]) {
    rusticated(acc, a, e, base, H.cap - 0.35, d, { course: 0.42, joint: 0.07, deep: 0.05 });
    acc.box("render", a, e, H.cap - 0.35, H.cap, 0, d + 0.06);   // the pilaster's capital band
    acc.box("render", a, e, base, H.arch[1], -0.3, d - 0.05);    // its core
  }
  // the bay between the pilasters, brick, with its openings
  const b0 = u0 + pil, b1 = u1 - pil;
  const winW = 1.21 * S, w0 = c - winW / 2, w1 = c + winW / 2;
  const holes = [[w0, w1, H.ff.sill, H.arch[1]]];
  if (door) holes.push([c - 0.8, c + 0.8, base, 5.9]);
  else holes.push([w0, w1, H.gf.glass[0], H.gf.glass[1]]);
  wallWithHoles(acc, "brick", b0, b1, base, H.arch[1], bayD - 0.3, bayD, holes);
  // the bands across the bay (as the range's), set on the recessed face
  acc.box("render", b0, b1, H.band[0], H.band[1], bayD - 0.1, bayD + 0.06);
  acc.box("render", w0 - 0.15, w1 + 0.15, H.band[1], H.ff.sill, bayD, bayD + 0.12);
  // the upper window, three lights, to the frieze, in a cream surround (sides and sill; the frieze is its head)
  acc.box("render", w0 - 0.18, w0, H.ff.sill, H.arch[1], bayD - 0.05, bayD + 0.05);
  acc.box("render", w1, w1 + 0.18, H.ff.sill, H.arch[1], bayD - 0.05, bayD + 0.05);
  acc.box("render", w0 - 0.18, w1 + 0.18, H.ff.sill - 0.08, H.ff.sill + 0.02, bayD - 0.05, bayD + 0.08);
  acc.box("void", w0, w1, H.ff.sill, H.arch[1], bayD - 0.3, bayD - 0.2);   // behind the glass (0.14 in)
  {
    const sub = new Acc();
    threeLight(sub, w0, w1, H.ff.sill + 0.02, H.arch[1] - 0.05, { tr: 0.72, lo: 4, hi: 2 });
    shift(sub, acc, bayD);
  }
  if (door) {
    // double doors in a cream case with a cornice, a panel above them
    const sub = new Acc();
    gfCase(sub, c, 1.6, { door: true });
    sub.box("void", c - 0.8, c + 0.8, base, 5.9, -0.3, -0.12);
    sub.box("paint", c - 0.78, c + 0.78, base, 5.25, -0.14, -0.1);
    sub.quad("glassPale", c - 0.68, c - 0.08, base + 1.0, 5.0, -0.095);
    sub.quad("glassPale", c + 0.08, c + 0.68, base + 1.0, 5.0, -0.095);
    sub.box("paint", c - 0.02, c + 0.02, base, 5.25, -0.1, -0.08);
    sub.box("render", c - 0.8, c + 0.8, 5.9, H.gf.glass[1], 0.0, 0.04);   // the panel over the doors, proud of the brick
    sub.box("render", c - 0.8, c + 0.8, 5.25, 5.9, -0.12, -0.08);
    shift(sub, acc, bayD);
  } else {
    const sub = new Acc();
    threeLight(sub, w0, w1, H.gf.glass[0], H.gf.glass[1], { tr: 0.68, lo: 4, hi: 2 });
    sub.box("render", w0 - 0.18, w0, H.gf.sill, H.gf.head, 0, 0.08);
    sub.box("render", w1, w1 + 0.18, H.gf.sill, H.gf.head, 0, 0.08);
    sub.box("render", w0 - 0.18, w1 + 0.18, H.gf.glass[1], H.gf.head, 0, 0.08);
    sub.box("render", w0 - 0.26, w1 + 0.26, H.gf.head, H.gf.cap, 0, 0.17);
    sub.box("render", w0 - 0.18, w1 + 0.18, H.gf.apron, H.gf.sill, 0, 0.06);
    sub.box("render", w0 - 0.24, w1 + 0.24, H.gf.sill, H.gf.glass[0], 0, 0.15);
    shift(sub, acc, bayD);
  }
  // the giant columns in antis
  for (const u of [cl, cr]) {
    column(b, acc, u, d - r, base, H.cap, r, { seg: 18, top: 0.88 });
    acc.box("render", u - r * 1.25, u + r * 1.25, foot, base, d - r * 2.3, d + 0.06); // its pedestal block
  }
  // the entablature blocks over each pilaster-and-column pair, the frieze across the pavilion
  for (const [a, e] of [[u0, cl + r * 1.3], [cr - r * 1.3, u1]]) {
    acc.box("render", a, e, H.arch[0], H.arch[0] + 0.25, -0.3, d + 0.05);
    acc.box("render", a - 0.02, e + 0.02, H.arch[0] + 0.25, H.arch[0] + 0.35, -0.3, d + 0.1);
    acc.box("render", a, e, H.arch[0] + 0.35, H.arch[1] - 0.15, -0.3, d + 0.03);
    acc.box("render", a - 0.03, e + 0.03, H.arch[1] - 0.15, H.arch[1], -0.3, d + 0.12);
  }
  acc.box("render", u0, u1, H.arch[1], H.cornice[0], -0.3, d);  // the frieze
  for (const u of [u0 + pil / 2, u1 - pil / 2]) acc.box("void", u - 0.12, u + 0.12, 12.35, 12.42, d, d + 0.005); // vents
  cornice(acc, u0, u1, d, { left: true, right: !cornerRight });
  if (cornerRight) {
    // run the projecting mouldings on past the corner a little, to meet those of the Grafton Road face
    cornice(acc, u1, u1 + 0.25, d);
  }
  // returns of the pavilion's projection at its ends (the brick range's face is behind by d)
  if (!cornerRight) acc.box("render", u1 - 0.01, u1, foot, H.cornice[0], 0, d);
  acc.box("render", u0, u0 + 0.01, foot, H.cornice[0], 0, d);
  pediment(acc, c, (cr - cl) + 2 * r + 0.3, d);
}

/** Copies a sub-accumulator's boxes and quads into acc, moved out by dd (for things set on a recessed face). */
function shift(sub, acc, dd) {
  for (const [m, list] of Object.entries(sub.boxes)) for (const [u0, u1, y0, y1, d0, d1] of list) acc.box(m, u0, u1, y0, y1, d0 + dd, d1 + dd);
  for (const [m, list] of Object.entries(sub.quads)) for (const [u0, u1, y0, y1, d0] of list) acc.quad(m, u0, u1, y0, y1, d0 + dd);
}

/**
 * The segmental pediment over the pavilion's bay, standing on the main cornice: a raking cornice on an arc
 * (corona, modillions, dentils), its tympanum with a radiating panel of voussoirs and a keystone.
 */
function pediment(acc, c, span, d) {
  const y0 = H.cornice[1], rise = 1.05;
  const R = (span * span) / 4 / rise / 2 + rise / 2, cy = y0 + rise - R;
  const half = Math.asin(span / 2 / R), a0 = Math.PI / 2 - half, a1 = Math.PI / 2 + half;
  // the tympanum: a flat segment filled with render, set back a little
  const n = 20, tris = [];
  for (let i = 0; i < n; i++) {
    const t0 = a0 + ((a1 - a0) * i) / n, t1 = a0 + ((a1 - a0) * (i + 1)) / n;
    acc.tri("render", c, y0, d - 0.05, c + R * Math.cos(t0), cy + R * Math.sin(t0), d - 0.05, c + R * Math.cos(t1), cy + R * Math.sin(t1), d - 0.05);
  }
  // radiating panel: voussoirs fanning from a point below the springing line, and a keystone at the top
  const fc = y0 - 0.2, fr0 = 0.55, fr1 = rise + 0.2 - 0.32;
  for (let i = 0; i < 9; i++) {
    const t = Math.PI * (0.18 + (0.64 * (i + 0.5)) / 9);
    acc.rbox("render", c + ((fr0 + fr1) / 2) * Math.cos(t), fc + ((fr0 + fr1) / 2) * Math.sin(t), t, fr1 - fr0, 0.05, d - 0.05, d + 0.02);
  }
  acc.box("render", c - 0.14, c + 0.14, y0 + rise - 0.55, y0 + rise - 0.05, d - 0.05, d + 0.12);
  // the raking cornice on the arc: soffit with modillions, corona, cymatium
  arcBand(acc, "render", c, cy, R, R + 0.12, a0, a1, d - 0.2, d + 0.2, 22);
  arcBlocks(acc, "render", c, cy, R - 0.12, a0 + 0.06, a1 - 0.06, 9, 0.12, 0.13, d + 0.05, d + 0.42);
  arcBand(acc, "render", c, cy, R + 0.12, R + 0.38, a0 - 0.01, a1 + 0.01, d - 0.2, d + 0.55, 22);
  arcBand(acc, "render", c, cy, R + 0.38, R + 0.5, a0 - 0.01, a1 + 0.01, d - 0.2, d + 0.48, 22);
}

// ---- the corner pavilion's face on Grafton Road (the view frame, z = 22.4) ---------------------------
function graftonFace(b) {
  const acc = new Acc();
  // in this face's frame u = view x (to the right), d out toward the street; the corner is at the left
  const xc = CORNER * Math.sin(A) + (FACE - PAV_D) * Math.cos(A);   // the corner's view x (-17.58)
  const x1 = -10.3;                                                   // where the face turns back (LiDAR)
  const P = { u0: xc, u1: x1 };
  b.matrix = faceMatrix([0, 1], [0, 22.4 - PAV_D]);
  const d = PAV_D, pil = 0.62 * S, r = 0.45, w = x1 - xc, colU = Math.min(0.87 * S, w * 0.27);
  const cl = xc + colU, cr = x1 - colU, c = (xc + x1) / 2, bayD = -0.6, base = H.plinth, foot = -1.2;
  acc.box("render", xc - 0.25, x1, foot, base - 0.12, bayD - 0.3, d + 0.1);
  acc.box("render", xc - 0.3, x1 + 0.03, base - 0.12, base, bayD - 0.3, d + 0.13);
  for (const [a, e] of [[xc, xc + pil], [x1 - pil, x1]]) {
    rusticated(acc, a, e, base, H.cap - 0.35, d, { course: 0.42, joint: 0.07, deep: 0.05 });
    acc.box("render", a, e, H.cap - 0.35, H.cap, 0, d + 0.06);
    acc.box("render", a, e, foot, H.arch[1], -0.3, d - 0.05);
  }
  const b0 = xc + pil, b1 = x1 - pil, winW = Math.min(1.21 * S, b1 - b0 - 2 * r - 0.6), w0 = c - winW / 2, w1 = c + winW / 2;
  wallWithHoles(acc, "brick", b0, b1, base, H.arch[1], bayD - 0.3, bayD, [[w0, w1, H.ff.sill, H.arch[1]], [w0, w1, H.gf.glass[0], H.gf.glass[1]]]);
  acc.box("render", b0, b1, H.band[0], H.band[1], bayD - 0.1, bayD + 0.06);
  acc.box("render", w0 - 0.15, w1 + 0.15, H.band[1], H.ff.sill, bayD, bayD + 0.12);
  acc.box("render", w0 - 0.18, w0, H.ff.sill, H.arch[1], bayD - 0.05, bayD + 0.05);
  acc.box("render", w1, w1 + 0.18, H.ff.sill, H.arch[1], bayD - 0.05, bayD + 0.05);
  acc.box("render", w0 - 0.18, w1 + 0.18, H.ff.sill - 0.08, H.ff.sill + 0.02, bayD - 0.05, bayD + 0.08);
  acc.box("void", w0, w1, H.ff.sill, H.arch[1], bayD - 0.3, bayD - 0.2);
  acc.box("void", w0, w1, H.gf.glass[0], H.gf.glass[1], bayD - 0.3, bayD - 0.2);
  const sub = new Acc();
  threeLight(sub, w0, w1, H.ff.sill + 0.02, H.arch[1] - 0.05, { tr: 0.72 });
  threeLight(sub, w0, w1, H.gf.glass[0], H.gf.glass[1], { tr: 0.68 });
  sub.box("render", w0 - 0.18, w0, H.gf.sill, H.gf.head, 0, 0.08);
  sub.box("render", w1, w1 + 0.18, H.gf.sill, H.gf.head, 0, 0.08);
  sub.box("render", w0 - 0.18, w1 + 0.18, H.gf.glass[1], H.gf.head, 0, 0.08);
  sub.box("render", w0 - 0.26, w1 + 0.26, H.gf.head, H.gf.cap, 0, 0.17);
  sub.box("render", w0 - 0.18, w1 + 0.18, H.gf.apron, H.gf.sill, 0, 0.06);
  sub.box("render", w0 - 0.24, w1 + 0.24, H.gf.sill, H.gf.glass[0], 0, 0.15);
  shift(sub, acc, bayD);
  for (const u of [cl, cr]) {
    column(b, acc, u, d - r, base, H.cap, r, { seg: 18, top: 0.88 });
    acc.box("render", u - r * 1.25, u + r * 1.25, foot, base, d - r * 2.3, d + 0.06);
  }
  for (const [a, e] of [[xc, cl + r * 1.3], [cr - r * 1.3, x1]]) {
    acc.box("render", a, e, H.arch[0], H.arch[0] + 0.25, -0.3, d + 0.05);
    acc.box("render", a - 0.02, e + 0.02, H.arch[0] + 0.25, H.arch[0] + 0.35, -0.3, d + 0.1);
    acc.box("render", a, e, H.arch[0] + 0.35, H.arch[1] - 0.15, -0.3, d + 0.03);
    acc.box("render", a - 0.03, e + 0.03, H.arch[1] - 0.15, H.arch[1], -0.3, d + 0.12);
  }
  acc.box("render", xc, x1, H.arch[1], H.cornice[0], -0.3, d);
  cornice(acc, xc - 0.25, x1, d, { right: true });
  // its right end turns back along view x = -10.3: return the pavilion's projection
  acc.box("render", x1 - 0.01, x1, -1.2, H.cornice[0], -0.4, d);
  acc.flush(b);
  b.matrix = null;
}

// ---- the range's north-west end (facing north-west, along x' from the face inward) ------------------
function backEnd(b) {
  const acc = new Acc();
  // face frame: out = -z' (in the range's frame), u = -x' ... drawn with swMatrix() * faceMatrix
  b.matrix = swMatrix().multiply(faceMatrix([0, -1], [0, BACK]));
  // u here runs along -x': u = -x'. The face spans x' from the pavilion's face to the inner side (-13)
  const ua = 13.0, ub = -(FACE - PAV_D);    // u from 13 (inner) to 24.75 (the corner)
  const pil = 0.62 * S;
  // e8T_ (2022-09) shows, next to the pavilion's pilaster, a first-floor window like the range's and a
  // smaller ground-floor window in a cream surround
  const wu = ub - pil - 1.5, g0 = wu - GLASS_W / 2, g1 = wu + GLASS_W / 2, s0 = wu - 0.5, s1 = wu + 0.5, sy = [5.6, H.gf.glass[1]];
  wallWithHoles(acc, "brick", ua, ub - pil, H.plinth, H.cornice[0], -0.4, 0, [[g0, g1, H.ff.sill, H.ff.top], [s0, s1, sy[0], sy[1]]]);
  steelWindow(acc, g0, g1, H.ff.sill, H.ff.top, { cols: 4, lo: 4, hi: 2, tr: 0.68, reveal: "brick" });
  acc.box("render", g0 - 0.12, g1 + 0.12, H.band[1], H.ff.sill - 0.08, 0, 0.1);
  acc.box("render", g0 - 0.16, g1 + 0.16, H.ff.sill - 0.08, H.ff.sill, 0, 0.15);
  steelWindow(acc, s0, s1, sy[0], sy[1], { cols: 2, lo: 2, hi: 1, tr: 0.7 });
  acc.box("render", s0 - 0.16, s0, sy[0] - 0.1, sy[1] + 0.16, 0, 0.08);
  acc.box("render", s1, s1 + 0.16, sy[0] - 0.1, sy[1] + 0.16, 0, 0.08);
  acc.box("render", s0 - 0.16, s1 + 0.16, sy[1], sy[1] + 0.16, 0, 0.08);
  acc.box("render", s0 - 0.22, s1 + 0.22, sy[0] - 0.22, sy[0], 0, 0.14);
  acc.box("render", ua, ub, FOOT, H.plinth, -0.3, 0.1);
  acc.box("render", ua, ub - pil, H.band[0], H.band[1], -0.1, 0.06);
  wallWithHoles(acc, "render", ua, ub - pil, H.ff.upper[0], H.ff.upper[1], 0, 0.03, [[g0 - 0.04, g1 + 0.04, H.ff.upper[0], H.ff.upper[1]]]);
  rusticated(acc, ub - pil, ub, H.plinth, H.cap - 0.35, PAV_D, { course: 0.42, joint: 0.07, deep: 0.05 });
  acc.box("render", ub - pil, ub, H.cap - 0.35, H.arch[1], 0, PAV_D + 0.06);
  acc.box("render", ua, ub, H.arch[1], H.cornice[0], -0.3, 0.02);
  cornice(acc, ua, ub, 0, { right: true });
  acc.flush(b);
  b.matrix = null;
}

export function southwestRange(b) {
  const acc = new Acc();
  b.matrix = swMatrix().multiply(faceMatrix([-1, 0], [FACE, 0]));
  range(acc);
  pavilion(b, acc, NWP, { door: true });
  pavilion(b, acc, CEP, { cornerRight: true });
  acc.flush(b);
  b.matrix = null;
  graftonFace(b);
  backEnd(b);
}
