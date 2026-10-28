// What the street faces carry (parts/common.js FRONT): pilasters rising past the parapet into pinnacles, the
// cream coping with its merlons, a cream dentil course, the corbel table of small arches under it, the tall
// blind arches with their cream springers, the porch's door in its cream surround with three arched windows
// over it, and the steps up to the door. Each face is a line of the plan, with its street on the outside;
// everything on it is built in the face's own frame: s along it from its first corner, y up, t out of it.
import * as THREE from "three";
import { MEASURED as M, FRONT as F } from "./common.js";
import { eastFrontZ } from "./body.js";

const W = M.walls;
const PIER = 0.22; // the brick between two blind arches: estimated (the photograph, about 9 px at 41 px/m)
const SKIN = 0.12; // how far the wall round the blind arches stands in front of the arches: estimated
const RING = 0.19; // the depth of the ring of brick round each blind arch's head (5.99 - 5.80 m on the east part)
const MERLON = { w: 0.25, pitch: 0.5, t: 0.36 }; // the coping's merlons: estimated (the photograph's teeth)

/** A face from p0 to p1 in plan, its street on the side of (-ez, ex): its frame and length. */
function face(p0, p1) {
  const dx = p1[0] - p0[0], dz = p1[1] - p0[1], L = Math.hypot(dx, dz);
  const e = new THREE.Vector3(dx / L, 0, dz / L), n = new THREE.Vector3(-dz / L, 0, dx / L);
  const m = new THREE.Matrix4().makeBasis(e, new THREE.Vector3(0, 1, 0), n).setPosition(p0[0], 0, p0[1]);
  return { p0, L, m };
}

/** A box in a face's frame. */
function box(b, f, s0, s1, y0, y1, t0, t1, material) {
  const g = new THREE.BoxGeometry(s1 - s0, y1 - y0, t1 - t0);
  g.translate((s0 + s1) / 2, (y0 + y1) / 2, (t0 + t1) / 2);
  g.applyMatrix4(f.m);
  b.add(g, material);
}

/** A flat shape in a face's frame (s, y), extruded out of the face from t0 by `depth`. */
function slab(b, f, shape, t0, depth, material) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, t0);
  g.applyMatrix4(f.m);
  b.add(g, material);
}

/** The outline of a round-headed opening `w` wide, from y0 to its springing ys, centred on s. */
function archPath(path, s, w, y0, ys) {
  const r = w / 2;
  path.moveTo(s - r, y0); path.lineTo(s + r, y0); path.lineTo(s + r, ys);
  path.absarc(s, ys, r, 0, Math.PI, false);
  path.lineTo(s - r, y0);
  return path;
}

/** The wall's skin from s0 to s1 and y0 to y1, with a row of round-headed openings (recesses) in it. */
function arcade(b, f, s0, s1, y0, y1, openings, depth, material = "brickBrown") {
  const sh = new THREE.Shape();
  sh.moveTo(s0, y0); sh.lineTo(s1, y0); sh.lineTo(s1, y1); sh.lineTo(s0, y1); sh.lineTo(s0, y0);
  for (const [s, w, ya, ys] of openings) sh.holes.push(archPath(new THREE.Path(), s, w, ya, ys));
  slab(b, f, sh, 0, depth, material);
}

/** `n` openings `w` wide, evenly spaced between s0 and s1. */
function spaced(s0, s1, n) {
  const step = (s1 - s0) / n;
  return Array.from({ length: n }, (_, i) => s0 + step * (i + 0.5));
}

/** A spire on a pilaster or a block's corner, centred on (s, tc) in the face's frame: a square shaft `w`
 * wide (and `dep` deep) from `base` to 0.6 of the way to `tip` (the photograph's proportion), a cream ring,
 * a brick pyramid, and a small cream cap at the tip. */
function spire(b, f, s, tc, w, dep, base, tip) {
  const shaftTop = base + 0.6 * (tip - base);
  box(b, f, s - w / 2, s + w / 2, base - 0.02, shaftTop, tc - dep / 2, tc + dep / 2, "brickBrown");
  box(b, f, s - w / 2 - 0.04, s + w / 2 + 0.04, shaftTop - 0.08, shaftTop, tc - dep / 2 - 0.04, tc + dep / 2 + 0.04, "render");
  const h = tip - 0.12 - shaftTop, r = (w / 2) * Math.SQRT2 * 0.95;
  const cone = new THREE.ConeGeometry(r, h, 4, 1);
  cone.rotateY(Math.PI / 4); cone.translate(s, shaftTop + h / 2, tc);
  cone.applyMatrix4(f.m); b.add(cone, "brickBrown");
  const cap = new THREE.ConeGeometry(0.09, 0.2, 4, 1);
  cap.rotateY(Math.PI / 4); cap.translate(s, tip - 0.1, tc);
  cap.applyMatrix4(f.m); b.add(cap, "render");
}

/** A pilaster `w` wide and `d` proud centred on s, from y0 to the coping, and its spire above to `tip`. */
function pilaster(b, f, s, w, d, y0, coping, tip) {
  box(b, f, s - w / 2, s + w / 2, y0, coping, -0.05, d, "brickBrown");
  spire(b, f, s, (d - 0.05) / 2, w, d + 0.05, coping, tip);
}

/** The coping along a face from s0 to s1: a cream band, merlons on it, and a dentil course under it. */
function coping(b, f, s0, s1, band, top, dentil) {
  box(b, f, s0, s1, band[0], band[1], -MERLON.t, 0.1, "render");
  const n = Math.max(1, Math.floor((s1 - s0) / MERLON.pitch));
  for (const s of spaced(s0, s1, n)) box(b, f, s - MERLON.w / 2, s + MERLON.w / 2, band[1] - 0.01, top, -MERLON.t + 0.02, 0.08, "render");
  if (dentil) box(b, f, s0, s1, dentil[0], dentil[1], 0, 0.06, "render");
}

/** A street face: its pilasters (s, width, proud, tip), its coping, the corbel table and the blind arches. */
function streetFace(b, f, { pilasters, foot, coping: cop, frieze, arches, parapet, range }) {
  const [s0, s1] = range ?? [0, f.L];
  if (parapet) box(b, f, s0, s1, parapet[0], parapet[1], -0.3, 0, "brickBrown");
  coping(b, f, s0, s1, cop.band, cop.top, cop.dentil);
  for (const p of pilasters) pilaster(b, f, p.s, p.w, p.d, foot, cop.band[1], p.tip);
  // each bay between two pilasters (or a pilaster and the face's end)
  const edges = [s0, ...pilasters.flatMap((p) => [p.s - p.w / 2, p.s + p.w / 2]), s1];
  for (let i = 0; i + 1 < edges.length; i += 2) {
    const a = edges[i], c = edges[i + 1];
    if (c - a < 0.6) continue;
    if (frieze) {
      const n = Math.max(1, Math.round((c - a) / frieze.pitch)), w = frieze.w;
      arcade(b, f, a, c, frieze.y0, frieze.y1, spaced(a, c, n).map((s) => [s, w, frieze.y0 + 0.1, frieze.ys]), 0.08);
    }
    if (arches) {
      const n = Math.max(1, Math.round((c - a) / arches.pitch)), w = Math.min(arches.max ?? 9, (c - a - (n + 1) * PIER) / n);
      const ss = spaced(a, c, n);
      arcade(b, f, a, c, arches.y0, arches.y1, ss.map((s) => [s, w, arches.y0 + 0.15, arches.ys]), SKIN);
      // a ring of brick on edge round each arch's head, standing a little out of the wall (the photograph's
      // rings: from the openings' crowns, 5.80 m, to the rings' tops, 5.99, on the east part; estimated proud)
      for (const s of ss) {
        const r = w / 2, R = r + RING, ring = new THREE.Shape();
        ring.moveTo(s + R, arches.ys); ring.absarc(s, arches.ys, R, 0, Math.PI, false);
        ring.lineTo(s - r, arches.ys); ring.absarc(s, arches.ys, r, Math.PI, 0, true); ring.lineTo(s + R, arches.ys);
        slab(b, f, ring, SKIN, 0.035, "brickBrown");
      }
      // the cream springer blocks on the piers, either side of each arch
      for (const s of ss) for (const k of [-1, 1]) {
        const sp = s + k * (w / 2 + PIER / 2);
        box(b, f, sp - PIER / 2 - 0.02, sp + PIER / 2 + 0.02, arches.ys - 0.24, arches.ys, SKIN - 0.02, SKIN + 0.05, "render");
      }
    }
  }
}

export function front(b) {
  const [EF0, EF1] = W.eastFront;
  // ---- the east part's street face, from the porch's east side to the east corner
  const E = face(EF0, EF1), sE = (x) => (x - EF0[0]) * (E.L / (EF1[0] - EF0[0]));
  const fe = F.east;
  streetFace(b, E, {
    foot: -2.7, // the areaway along its foot: the ground returns there at -2.6 (the LiDAR's sections)
    pilasters: fe.pilasters.map((x, i) => {
      let s = sE(x), w = 0.6;
      if (i === 0) s = Math.max(s, w / 2); if (i === fe.pilasters.length - 1) s = Math.min(s, E.L - w / 2);
      return { s, w, d: 0.35, tip: fe.tips[i] };
    }),
    coping: { band: [fe.band[0], M.parapet + 0.05], top: fe.copingTop, dentil: fe.dentil },
    frieze: { y0: fe.frieze[0] - 0.12, y1: fe.dentil[0], ys: fe.frieze[1] - 0.17, w: 0.34, pitch: 0.58 },
    arches: { pitch: 0.97, y0: 0.45, y1: fe.frieze[0] - 0.12, ys: fe.springer },
  });
  // ---- the porch: its street face, between its two pilaster blocks, and its east side
  const fp = F.porch, P = face([W.entranceWest, W.porchFront], [W.porchEast, W.porchFront]);
  const pBand = fp.band, pDentil = [pBand[0] - 0.22, pBand[0] - 0.04];
  const [bl, br] = fp.blocks.map((k) => ({ s0: k.x[0] - W.entranceWest, s1: k.x[1] - W.entranceWest, d: k.front - W.porchFront, tip: k.tip, spires: k.spires.map((x) => Math.min(Math.max(x - W.entranceWest, k.x[0] - W.entranceWest + 0.28), k.x[1] - W.entranceWest - 0.28)) }));
  streetFace(b, P, {
    range: [bl.s1, br.s0], foot: -0.6, parapet: [M.porch.top, pBand[1]], pilasters: [],
    coping: { band: pBand, top: fp.copingTop, dentil: pDentil },
    frieze: { y0: fp.frieze[0] - 0.12, y1: pDentil[0], ys: fp.frieze[1] - 0.17, w: 0.34, pitch: 0.58 },
  });
  // the two blocks: brick to the coping, a cream coping with merlons round their fronts, a spire at each
  // front corner
  for (const k of [bl, br]) {
    box(b, P, k.s0, k.s1, -0.6, pBand[1], -0.05, k.d, "brickBrown");
    box(b, P, k.s0 - 0.05, k.s1 + 0.05, pBand[0], pBand[1], k.d - 0.6, k.d + 0.1, "render");
    box(b, P, k.s0 - 0.03, k.s1 + 0.03, pDentil[0], pDentil[1], k.d - 0.3, k.d + 0.06, "render");
    for (const sp of k.spires) spire(b, P, sp, k.d - 0.3, 0.55, 0.55, pBand[1], k.tip);
  }
  const PE = face([W.porchEast, W.porchFront], W.eastFront[0]);
  streetFace(b, PE, {
    range: [br.d, PE.L], foot: -0.6, parapet: [M.porch.top, pBand[1]], pilasters: [],
    coping: { band: pBand, top: fp.copingTop, dentil: pDentil },
    frieze: { y0: fp.frieze[0] - 0.12, y1: pDentil[0], ys: fp.frieze[1] - 0.17, w: 0.34, pitch: 0.58 },
  });
  // the door: a cream surround standing out round a dark opening, centred between the blocks
  const d = fp.door, sc = (bl.s1 + br.s0) / 2, ro = d.outer / 2, ri = d.open / 2, ysO = d.outerCrown - ro, ysI = d.crown - ri;
  const sur = new THREE.Shape();
  sur.moveTo(sc - ro, d.threshold); sur.lineTo(sc - ri, d.threshold); sur.lineTo(sc - ri, ysI);
  sur.absarc(sc, ysI, ri, Math.PI, 0, true);
  sur.lineTo(sc + ri, d.threshold); sur.lineTo(sc + ro, d.threshold); sur.lineTo(sc + ro, ysO);
  sur.absarc(sc, ysO, ro, 0, Math.PI, false);
  sur.lineTo(sc - ro, d.threshold);
  slab(b, P, sur, 0, 0.32, "render");
  slab(b, P, archPath(new THREE.Shape(), sc, d.open, d.threshold, ysI), 0.01, 0.02, "void");
  // three arched windows over the door, with cream colonnettes and a cream sill
  const wn = fp.windows, col = 0.15, total = wn.n * wn.w + (wn.n + 1) * col;
  for (let i = 0; i < wn.n; i++) {
    const s = sc - total / 2 + col + wn.w / 2 + i * (wn.w + col);
    slab(b, P, archPath(new THREE.Shape(), s, wn.w, wn.sill, wn.crown - wn.w / 2), 0.01, 0.02, "void");
  }
  for (let i = 0; i <= wn.n; i++) {
    const s = sc - total / 2 + col / 2 + i * (wn.w + col);
    box(b, P, s - col / 2, s + col / 2, wn.sill, wn.crown - wn.w / 2, 0, 0.12, "render");
  }
  box(b, P, sc - total / 2 - 0.1, sc + total / 2 + 0.1, wn.sill - 0.12, wn.sill, 0, 0.14, "render");
  // ---- the west part's street face and its short return to the porch's western block
  const fw = F.west, WF = face([W.west, W.front], [W.entranceWest, W.front]);
  const wBand = fw.band;
  streetFace(b, WF, {
    foot: -1.6,
    parapet: [M.front.top, wBand[1]],
    pilasters: fw.pilasters.map((x, i) => {
      const w = 0.9; let s = x - W.west; if (i === 0) s = w / 2; s = Math.min(s, WF.L - w / 2);
      return { s, w, d: 0.45, tip: fw.tip };
    }),
    coping: { band: wBand, top: fw.copingTop, dentil: [wBand[0] - 0.2, wBand[0] - 0.03] },
    frieze: { y0: fw.frieze[0] - 0.12, y1: wBand[0] - 0.2, ys: fw.frieze[1] - 0.17, w: 0.34, pitch: 0.58 },
    arches: { pitch: 1.55, y0: 1.2, y1: fw.frieze[0] - 0.12, ys: fw.springer, max: 1.2 },
  });
  const WR = face([W.entranceWest, W.front], [W.entranceWest, W.porchFront + bl.d]);
  streetFace(b, WR, { foot: -0.6, parapet: [M.front.top, wBand[1]], pilasters: [], coping: { band: wBand, top: fw.copingTop } });
  // ---- the steps: a landing before the door at its threshold and a flight down westward along the west
  // part's foot to the street (the door view: about seven risers, a cream wall on the landing's east side).
  // Sizes estimated, the street's level from the LiDAR (-0.2 m before the door)
  const th = d.threshold, z0 = W.porchFront, z1 = W.front + 1.2, xl = W.entranceWest - 0.6, xr = W.entranceWest + br.s0 - 0.1;
  b.box(xl, xr, -0.6, th, z0, z1, "brickBrown");
  const n = 7, rise = (th + 0.2) / n, tread = 0.36;
  for (let i = 1; i <= n; i++) b.box(xl - tread * i, xl - tread * (i - 1), -0.6, th - rise * i, W.front, z1, "brickBrown");
  b.box(xr, xr + 0.3, -0.6, th + 0.9, z0 + br.d, z1, "render");
}
