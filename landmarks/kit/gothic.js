// Gothic parts drawn by rule: walls with window openings, windows with mullions and transoms,
// pointed heads, pinnacles. Everything is added to a Builder in world coordinates (metres; x to the
// right as seen from the street, y up, z toward the street), which merges it into one mesh a material.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** UVs in metres on the face's dominant axis, so that every texture keeps its real size. */
export function worldUV(geometry, metres) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); }
    else if (ax >= az) { u = p.getZ(i); v = p.getY(i); }
    else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u / metres; uv[i * 2 + 1] = v / metres;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

export class Builder {
  constructor(materials) { this.materials = materials; this.parts = {}; this.matrix = null; }
  /** Adds a geometry already placed in the world (then moved by this.matrix, if set), in the material named. */
  add(geometry, material) {
    const m = this.materials[material];
    if (this.matrix) geometry.applyMatrix4(this.matrix);
    (this.parts[material] ??= []).push(worldUV(geometry, m.userData.metres ?? 2));
  }
  /** A box between two corners. */
  box(x0, x1, y0, y1, z0, z1, material) {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    this.add(g, material);
  }
  /** A flat shape facing the street (+z), extruded back from z = front by depth, moved by (x, y). */
  slab(shape, x, y, front, depth, material, bevel = 0) {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 10 });
    g.translate(x, y, front - depth);
    this.add(g, material);
  }
  /** One mesh a material, shadows on. */
  build() {
    const group = new THREE.Group();
    for (const [name, list] of Object.entries(this.parts)) {
      const mesh = new THREE.Mesh(mergeGeometries(list), this.materials[name]);
      mesh.castShadow = mesh.receiveShadow = name !== "glass";
      mesh.name = name;
      group.add(mesh);
    }
    return group;
  }
}

/**
 * The outline of an opening w wide and h tall from its sill, centred on x = 0: square-headed, or with a
 * pointed head whose arcs have radius k * w (k = 1 equilateral, less is blunter) rising to h.
 */
export function outline(w, h, head = "flat", k = 0.8) {
  const pts = [];
  if (head === "flat") return [new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(w / 2, h), new THREE.Vector2(-w / 2, h)];
  const R = Math.max(k * w, w / 2 + 1e-3), cx = -w / 2 + R;
  const rise = Math.sqrt(R * R - cx * cx), spring = h - rise;
  pts.push(new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(w / 2, spring));
  const n = 12;
  const a0 = 0, a1 = Math.acos(cx / R); // right arc: centre (-cx, spring) from angle 0 to the apex at x = 0
  for (let i = 1; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push(new THREE.Vector2(-cx + R * Math.cos(a), spring + R * Math.sin(a))); }
  for (let i = n - 1; i >= 0; i--) { const a = a0 + ((a1 - a0) * i) / n; pts.push(new THREE.Vector2(-(-cx + R * Math.cos(a)), spring + R * Math.sin(a))); }
  return pts;
}

const shapeOf = (pts, dx = 0, dy = 0) => new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x + dx, p.y + dy)));
const pathOf = (pts, dx = 0, dy = 0) => new THREE.Path(pts.map((p) => new THREE.Vector2(p.x + dx, p.y + dy)));

/** A deterministic hash of a few numbers to [0, 1) (no Math.random: same code, same picture). */
export function hash(...v) {
  let h = 2166136261;
  for (const n of v) { h ^= Math.round(n * 1000) | 0; h = Math.imul(h, 16777619); h ^= h >>> 13; }
  return ((h >>> 0) % 100000) / 100000;
}

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1).toNonIndexed().attributes.position.array;
/** Many boxes [x0, x1, y0, y1, z0, z1] as one non-indexed geometry (cheap: one add, one merge entry). */
export function boxesGeometry(list) {
  const pos = new Float32Array(list.length * UNIT_BOX.length);
  let o = 0;
  for (const [x0, x1, y0, y1, z0, z1] of list) {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2, sx = x1 - x0, sy = y1 - y0, sz = z1 - z0;
    for (let i = 0; i < UNIT_BOX.length; i += 3) {
      pos[o++] = cx + UNIT_BOX[i] * sx; pos[o++] = cy + UNIT_BOX[i + 1] * sy; pos[o++] = cz + UNIT_BOX[i + 2] * sz;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return g;
}

/** Many flat rectangles [x0, x1, y0, y1, z] facing the street (+z) as one geometry: 2 triangles each. */
export function quadsGeometry(list) {
  const pos = new Float32Array(list.length * 18);
  let o = 0;
  for (const [x0, x1, y0, y1, z] of list) for (const [x, y] of [[x0, y0], [x1, y0], [x1, y1], [x0, y0], [x1, y1], [x0, y1]]) { pos[o++] = x; pos[o++] = y; pos[o++] = z; }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return g;
}

/**
 * A pointed outline (as outline(w, h, "pointed", k)) whose head is cusped into a trefoil: one sharp cusp
 * on each arc pointing into the light, `depth` metres deep (default ~ a fifth of the width).
 */
export function cuspedOutline(w, h, k = 0.8, depth = 0.2 * w) {
  const pts = outline(w, h, "pointed", k);
  const R = Math.max(k * w, w / 2 + 1e-3), cx = -w / 2 + R, rise = Math.sqrt(R * R - cx * cx), spring = h - rise;
  const n = (pts.length - 3) / 2; // points per arc (outline() uses 12 + 12 - 1 + springs)
  return pts.map((p, i) => {
    if (i < 3) return p;
    const j = i - 2; // 1..2n-1 along the arch, right springing to left
    const right = j <= n, t = right ? j / n : (2 * n - j) / n; // 0 at the springing, 1 at the apex
    const bump = Math.max(0, 1 - Math.abs(t - 0.42) / 0.3) ** 2;
    if (bump <= 0) return p;
    const ox = right ? -cx : cx; // the arc's centre
    const dx = ox - p.x, dy = spring - p.y, l = Math.hypot(dx, dy) || 1;
    return new THREE.Vector2(p.x + (dx / l) * depth * bump, p.y + (dy / l) * depth * bump);
  });
}

/** A circle of radius r (or a cusped foil of `foils` lobes) as points, centred at (x, y). */
function foil(x, y, r, foils = 0, n = 24) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = foils ? r * (1 - 0.28 * Math.pow(Math.abs(Math.cos((a * foils) / 2 + Math.PI / 2)), 6)) : r;
    pts.push(new THREE.Vector2(x + rr * Math.cos(a), y + rr * Math.sin(a)));
  }
  return pts;
}

/**
 * A hood (label) moulding over an opening w wide and h tall from its sill, centred at (x, y), on a wall
 * face at z = front: it follows the head `off` metres out, `band` wide and `proud` deep, and ends in
 * short drops with square label stops. head "flat" gives a square label.
 */
export function addHood(b, x, y, w, h, front, { head = "flat", k = 0.8, off = 0.12, band = 0.13, proud = 0.1, drop = 0.3, material = "dressed" } = {}) {
  if (head === "flat") {
    const x0 = x - w / 2 - off - band, x1 = x + w / 2 + off + band, y1 = y + h + off;
    b.add(boxesGeometry([
      [x0, x1, y1, y1 + band, front, front + proud],
      [x0, x0 + band, y1 - drop, y1, front, front + proud],
      [x1 - band, x1, y1 - drop, y1, front, front + proud],
      [x0 - 0.05, x0 + band, y1 - drop - 0.12, y1 - drop, front, front + proud + 0.02],
      [x1 - band, x1 + 0.05, y1 - drop - 0.12, y1 - drop, front, front + proud + 0.02],
    ]), material);
    return;
  }
  const inner = outline(w + 2 * off, h + off, head, k).slice(2), outer = outline(w + 2 * (off + band), h + off + band, head, k).slice(2);
  const pts = [...outer, ...inner.reverse()];
  b.slab(new THREE.Shape(pts), x, y, front + proud, proud, material);
  const R = Math.max(k * (w + 2 * off), (w + 2 * off) / 2 + 1e-3), c = -(w + 2 * off) / 2 + R;
  const spring = y + h + off - Math.sqrt(R * R - c * c);
  const xl = x - w / 2 - off - band, xr = x + w / 2 + off;
  b.add(boxesGeometry([
    [xl, xl + band, spring - drop, spring, front, front + proud],
    [xr, xr + band, spring - drop, spring, front, front + proud],
    [xl - 0.06, xl + band, spring - drop - 0.12, spring - drop, front, front + proud + 0.02],
    [xr, xr + band + 0.06, spring - drop - 0.12, spring - drop, front, front + proud + 0.02],
  ]), material);
}

/**
 * A window: { x, y (sill), w, h, head, lights, transoms: [heights from the sill], k }.
 * Returns the outline to cut from the wall, and adds the frame of mullions and transoms (chamfered),
 * the glazing bars, the glass behind it (pane by pane, each tilted a hair so the reflections vary), the
 * reveal lining and a moulded surround, all set into a wall whose face is at z = front.
 * Options (all optional): reveal (depth of the reveal, 0.3), mullion (0.11), frame (0.1),
 *   bars (true: dark glazing bars, a casement frame round each pane and bars about every `bars` metres
 *     if a number, 0.6 if true; false: none), cusps (true for pointed heads: trefoil-cusped lights and a
 *     foiled light in the head), ratios (null: equal lights; e.g. [1, 2, 1]: relative widths of the lights), hood (false; true or an addHood options object: a label moulding),
 *   surround (true: the slightly proud moulded surround), sill (true), tilt (0.025 rad: glass tilt range).
 */
export function addWindow(b, win, front) {
  const { x, y, w, h, head = "flat", lights = 1, transoms = [], k = 0.8, reveal = 0.3, mullion = 0.11, frame = 0.1,
    bars = true, cusps = true, hood = false, surround = true, sill = true, tilt = 0.025, chamfer = head === "flat", ratios = null } = win;
  const pointed = head !== "flat";
  const outer = outline(w, h, head, k);
  // tracery plate: the opening, with each light (and each pane between transoms) cut out of it
  const plate = shapeOf(outer);
  const avail = w - 2 * frame - (lights - 1) * mullion, lw = avail / lights;
  const rs = ratios && ratios.length === lights ? ratios : null, rsum = rs ? rs.reduce((a, c) => a + c, 0) : 1;
  let left = -w / 2 + frame;
  const lightTop = !pointed ? h - frame : h - Math.max(0.35 * w, 0.3) - frame * 0.5;
  const panes = [];
  for (let i = 0; i < lights; i++) {
    const li = rs ? (avail * rs[i]) / rsum : lw, cx = left + li / 2;
    left += li + mullion;
    const cuts = [frame, ...transoms.map((t) => t), lightTop];
    for (let j = 0; j < cuts.length - 1; j++) {
      const lo = cuts[j] + (j ? mullion / 2 : 0), hi = cuts[j + 1] - (j < cuts.length - 2 ? mullion / 2 : 0);
      const last = j === cuts.length - 2;
      const ph = last && pointed ? hi - lo + li * 0.45 : hi - lo;
      const pane = last && pointed ? (cusps && li > 0.22 ? cuspedOutline(li, ph, 0.75, Math.min(0.14 * li, 0.07)) : outline(li, ph, "pointed", 0.75)) : outline(li, ph, "flat");
      plate.holes.push(pathOf(pane, cx, lo));
      panes.push({ pts: pane, cx, lo, w: li, h: ph, spring: last && pointed ? ph - Math.sqrt(0.5) * li : ph, i, j });
    }
  }
  if (pointed && lights > 1) {
    // a small round (or foiled) light in the head between the lights
    const r = Math.min(0.28 * w, 0.32), cy = lightTop + r + 0.18 + lw * 0.45;
    if (lightTop + 2 * r + 0.25 + lw * 0.45 < h - frame) {
      const pts = foil(0, cy, r, cusps ? (lights > 2 ? 4 : 3) : 0);
      plate.holes.push(new THREE.Path(pts.slice().reverse()));
      panes.push({ pts, cx: 0, lo: 0, w: 2 * r, h: 0, spring: 0, round: true, cy, r });
    }
  }
  // depths: the plate's face a little behind the wall face, the glass in the middle of the plate
  const pf = front - reveal * 0.3, pd = Math.max(0.1, reveal * 0.45), gz = pf - pd * 0.6;
  b.slab(plate, x, y, pf, pd, "dressed", chamfer ? Math.min(0.02, mullion * 0.15) : 0);
  // glass, pane by pane, each tilted a hair (deterministically) so that the reflections vary
  for (const p of panes) {
    const g = new THREE.ShapeGeometry(new THREE.Shape(p.round ? p.pts : p.pts.map((v) => new THREE.Vector2(v.x + p.cx, v.y + p.lo))), 6);
    const ccx = p.round ? 0 : p.cx, ccy = p.round ? p.cy : p.lo + p.h / 2;
    g.translate(-ccx, -ccy, 0);
    g.rotateX((hash(x, y, p.i, p.j, 1) - 0.5) * tilt);
    g.rotateY((hash(x, y, p.i, p.j, 2) - 0.5) * tilt);
    g.translate(x + ccx, y + ccy, gz);
    b.add(g, "glass");
  }
  // glazing bars: a slim casement frame round each rectangular part of a pane and bars across it
  if (bars) {
    // flat strips just in front of the glass (2 triangles each): from the street their depth never shows
    const step = typeof bars === "number" ? bars : 0.6, t = 0.035, zb = gz + 0.012, list = [];
    for (const p of panes) {
      if (p.round || p.w < 0.2) continue;
      const x0 = x + p.cx - p.w / 2, x1 = x + p.cx + p.w / 2, y0 = y + p.lo, y1 = y + p.lo + Math.max(p.spring, 0.1);
      list.push([x0, x0 + t, y0, y1, zb], [x1 - t, x1, y0, y1, zb], [x0, x1, y0, y0 + t, zb]);
      if (p.spring >= p.h - 1e-6) list.push([x0, x1, y1 - t, y1, zb]);
      const n = Math.max(0, Math.round((y1 - y0) / step) - 1);
      for (let q = 1; q <= n; q++) { const yy = y0 + ((y1 - y0) * q) / (n + 1); list.push([x0, x1, yy - t / 2, yy + t / 2, zb]); }
      if (p.w > 0.75) list.push([x + p.cx - t / 2, x + p.cx + t / 2, y0, y1, zb]);
    }
    if (list.length) b.add(quadsGeometry(list), "iron");
  }
  // reveal lining and a slightly proud surround
  if (reveal > 0) {
    const lining = shapeOf(outline(w + 0.04, h + 0.02, head, k), 0, -0.01); lining.holes.push(pathOf(outer));
    b.slab(lining, x, y, front, reveal, "dressed");
  }
  if (surround) {
    const s = shapeOf(outline(w + 0.3, h + 0.17, head, k), 0, -0.12); s.holes.push(pathOf(outline(w + 0.02, h + 0.01, head, k)));
    b.slab(s, x, y, front + 0.07, 0.07, "dressed");
  }
  if (hood) addHood(b, x, y, w + (surround ? 0.3 : 0), h + (surround ? 0.05 : 0), front + (surround ? 0.07 : 0), { head, k, ...(typeof hood === "object" ? hood : {}) });
  // sill
  if (sill) b.box(x - w / 2 - 0.2, x + w / 2 + 0.2, y - 0.14, y + 0.02, front - 0.05, front + 0.12, "dressed");
  return { x, y, pts: outer };
}

/**
 * A wall facing the street: a polygon (local metres, from its lower left corner at x0, y0) with the
 * windows' openings cut through it, thickness t back from z = front.
 */
export function addWall(b, poly, x0, y0, front, t, windows, material = "ashlar") {
  const s = new THREE.Shape(poly.map(([px, py]) => new THREE.Vector2(px, py)));
  for (const win of windows) s.holes.push(pathOf(outline(win.w, win.h, win.head ?? "flat", win.k ?? 0.8), win.x - x0, win.y - y0));
  b.slab(s, x0, y0, front, t, material);
  for (const win of windows) if (!win.opening) addWindow(b, win, front);
}

/** A pinnacle: a square shaft, gablets, a crocketed spirelet and a finial, standing at (x, y, z). */
export function addPinnacle(b, x, y, z, w, h, material = "dressed") {
  const shaft = h * 0.42;
  b.box(x - w / 2, x + w / 2, y, y + shaft, z - w / 2, z + w / 2, material);
  b.box(x - w * 0.6, x + w * 0.6, y + shaft, y + shaft + w * 0.18, z - w * 0.6, z + w * 0.6, material);
  const cone = new THREE.ConeGeometry(w * 0.62, h - shaft - w * 0.18, 4, 1);
  cone.rotateY(Math.PI / 4);
  cone.translate(x, y + shaft + w * 0.18 + (h - shaft - w * 0.18) / 2, z);
  b.add(cone, material);
  // crockets: little knobs up the edges
  const steps = Math.max(2, Math.round((h - shaft) / 0.6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps, r = w * 0.62 * (1 - t) * 0.72, yy = y + shaft + w * 0.18 + (h - shaft - w * 0.18) * t;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = new THREE.IcosahedronGeometry(w * 0.09, 0);
      k.translate(x + dx * r, yy, z + dz * r);
      b.add(k, material);
    }
  }
  const fin = new THREE.IcosahedronGeometry(w * 0.16, 1);
  fin.translate(x, y + h + w * 0.05, z);
  b.add(fin, material);
}

/** A string course or cornice: a moulding along the face from x0 to x1 at height y. */
export function addCourse(b, x0, x1, y, front, height = 0.18, proud = 0.12) {
  b.box(x0 - proud, x1 + proud, y, y + height, front - 0.2, front + proud, "dressed");
  b.box(x0 - proud * 0.5, x1 + proud * 0.5, y - height * 0.5, y, front - 0.2, front + proud * 0.5, "dressed");
}
