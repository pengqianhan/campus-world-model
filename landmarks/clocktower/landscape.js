// The street and planting round the Clock Tower, drawn by rule: Princes St with its kerbs, angle
// parking, lane markings and a zebra crossing with a median island; the forecourt and planting beds of
// shrubs and flax along the base; the lawn bank across the street; trees (bare plane trees, dark
// evergreens, a few tall conifers) placed and sized from the LINZ 2024 LiDAR (class 4/5 canopy tops,
// see tools/look_trees.md in the report); a lamp post and plain parking signposts.
// Heights follow the LiDAR ground (class 2): a forecourt falling to a low kerb at z = 25, a cambered
// road (crown ~0.45 m at z = 35), the far kerb at z = 44.4 and a bank up to the lawn at +2.4 m.
// Everything merged by material or instanced: ~12 draw calls.
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { ground, rng } from "./textures.js";
import { hook } from "./look/materials.js";

// ---- the ground --------------------------------------------------------------------------------
const KERB = 25.0, FAR_KERB = 44.4, FAR_PATH = 50.5, BANK_TOP = 53.5, LAWN = 2.4;
const slope = (x) => (x < 0 ? -0.0035 * x : -0.0085 * x); // the street falls toward +x
const smooth = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };

/** Ground height (m above the door) at (x, z), from the LiDAR profile. */
export function groundAt(x, z) {
  const s = slope(x);
  if (z < KERB) return Math.max(0.1, 0.28 - 0.025 * Math.max(0, z - 18)) + s * smooth(15, KERB, z);
  if (z < FAR_KERB) {
    const t = (z - KERB) / (FAR_KERB - KERB); // camber: gutters at both kerbs, crown just past the middle
    const crown = 0.48 * Math.sin(Math.PI * Math.pow(t, 0.85));
    return -0.03 + 0.08 * t + crown + s;
  }
  if (z < FAR_PATH) return 0.2 + s;
  if (z < BANK_TOP) return 0.2 + s + (LAWN - 0.2 - s) * smooth(FAR_PATH, BANK_TOP, z);
  return LAWN;
}

/** A strip of ground over x0..x1, z0..z1 following groundAt, raised by dy; UVs in metres. */
function strip(x0, x1, z0, z1, dx, dz, metres, dy = 0, h = groundAt) {
  const nx = Math.max(1, Math.ceil((x1 - x0) / dx)), nz = Math.max(1, Math.ceil((z1 - z0) / dz));
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = x0 + ((x1 - x0) * i) / nx, z = z0 + ((z1 - z0) * j) / nz;
    pos.push(x, h(x, z) + dy, z); uv.push(x / metres, z / metres);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g.toNonIndexed();
}

/** A box between corners whose top follows the ground plus `top` (a kerb, an island edge). */
function kerbAlongX(x0, x1, z, w, top, bottom, step = 2) {
  const gs = [];
  for (let x = x0; x < x1; x += step) {
    const xe = Math.min(x1, x + step), xm = (x + xe) / 2, y0 = groundAt(xm, z) + bottom, y1 = groundAt(xm, z) + top;
    gs.push(new THREE.BoxGeometry(xe - x, y1 - y0, w).translate(xm, (y0 + y1) / 2, z).toNonIndexed());
  }
  return gs;
}

function boxUV(g, metres = 1) {
  g = g.index ? g.toNonIndexed() : g;
  const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    uv[2 * i] = (ay > 0.5 ? p.getX(i) : ax > 0.5 ? p.getZ(i) : p.getX(i)) / metres;
    uv[2 * i + 1] = (ay > 0.5 ? p.getZ(i) : p.getY(i)) / metres;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

// ---- trees, from the LiDAR canopy tops: [x, z, top (m above the door), crown radius, kind] -------
// B = bare deciduous (plane, oak), E = dark evergreen broadleaf, C = tall conifer.
const TREES = [
  [-55.0, -30.0, 13.0, 2.5, "E"], [-48.0, -30.0, 13.2, 2.8, "B"], [-18.0, -30.0, 10.6, 2.5, "E"], [-9.5, -28.5, 9.7, 3.0, "E"],
  [-51.0, -28.0, 13.1, 4.5, "B"], [-60.0, -27.5, 11.6, 2.5, "E"], [11.0, -27.5, 8.5, 4.8, "E"], [-39.5, -26.5, 19.1, 8.8, "B"],
  [12.5, -24.0, 8.2, 4.7, "E"], [-52.5, -23.5, 12.6, 2.5, "B"], [-75.5, -22.0, 11.0, 3.0, "B"], [-35.0, -21.5, 18.8, 9.2, "B"],
  [-41.0, -20.0, 18.9, 9.0, "B"], [7.5, -19.5, 11.8, 6.0, "E"], [23.0, -19.5, 10.8, 5.8, "E"], [31.5, -16.5, 12.3, 4.2, "E"],
  [-18.5, -16.0, 12.8, 6.0, "E"], [-4.0, -15.5, 13.8, 4.0, "E"], [-28.0, -13.0, 13.7, 7.0, "E"], [-25.5, -12.0, 13.8, 7.0, "E"],
  [-64.0, -4.0, 6.5, 2.5, "E"], [-52.5, 4.0, 19.1, 5.2, "E"], [-47.0, 6.5, 18.2, 8.8, "E"], [-72.0, 7.5, 8.2, 2.5, "E"],
  [-35.5, 8.5, 18.2, 8.8, "E"], [-25.0, 8.5, 19.3, 2.8, "C"], [49.5, 10.5, 15.7, 3.0, "E"], [-53.5, 12.0, 16.2, 6.8, "E"],
  [-66.0, 12.5, 9.3, 3.9, "E"], [-51.0, 16.5, 16.9, 7.0, "E"], [-39.5, 18.5, 15.8, 6.5, "E"],
  [-54.5, 20.0, 15.7, 6.5, "E"], [-44.0, 20.5, 16.4, 6.8, "E"], [-63.0, 21.5, 25.8, 3.2, "C"], [-47.5, 22.0, 16.3, 6.7, "E"],
  [-29.0, 23.0, 10.9, 3.0, "E"], [38.5, 24.5, 14.2, 4.5, "B"], [55.5, 25.5, 17.7, 3.5, "B"], [56.5, 29.0, 19.1, 3.5, "B"],
  // the big plane tree in front of the right pavilion and the evergreen beside it (two LiDAR tops each)
  [17.0, 21.5, 18.1, 9.0, "B"], [26.0, 18.0, 16.6, 7.0, "E"],
  // across the street
  [30.5, 41.5, 20.6, 4.0, "B"], [-44.0, 42.5, 28.5, 4.8, "C"], [-19.0, 42.5, 18.2, 7.5, "B"], [-60.5, 43.5, 21.3, 3.5, "E"],
  [-23.7, 44.7, 19.9, 8.2, "B"], [-5.5, 46.0, 28.7, 4.2, "C"], [12.0, 46.0, 13.7, 5.6, "B"], [-39.0, 47.5, 20.7, 8.4, "E"],
  [-58.0, 48.0, 18.6, 3.5, "E"], [-33.0, 50.5, 19.6, 7.7, "E"], [-42.5, 53.5, 21.7, 8.2, "E"], [-52.5, 54.0, 19.6, 6.8, "E"],
  [-36.0, 56.0, 20.9, 7.7, "E"], [-15.5, 57.5, 22.5, 3.5, "E"], [-54.5, 58.5, 17.3, 3.8, "E"], [-51.0, 68.5, 21.8, 2.8, "E"],
];

/** Tapered open cylinder from a to b (radii ra, rb), `sides` around, appended to arrays. */
function limb(out, a, b, ra, rb, sides) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length();
  const g = new THREE.CylinderGeometry(rb, ra, len, sides, 1, true);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  g.translate(a.x, a.y, a.z);
  out.push(g.toNonIndexed());
}

/** A rotation of `dir` by angle `ang` away from it, about a random azimuth. */
function deviate(dir, ang, rand) {
  const t = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(dir, t).normalize(), v = new THREE.Vector3().crossVectors(dir, u);
  const phi = rand() * Math.PI * 2;
  return dir.clone().multiplyScalar(Math.cos(ang)).addScaledVector(u, Math.sin(ang) * Math.cos(phi)).addScaledVector(v, Math.sin(ang) * Math.sin(phi)).normalize();
}

/**
 * A branching skeleton: trunk to a fork, then limbs that split again and again. Adds bark geometry
 * to `bark` and returns the tips (for foliage). Built in unit size: height 1, crown radius ~0.5.
 */
function skeleton(bark, rand, { levels, fork = 0.33, spread = 0.75, kids = 3, upward = 0.35, sidesAt = [6, 5, 4, 3, 3, 3], radius = 0.035 }) {
  const tips = [];
  const grow = (p, dir, len, rad, lvl) => {
    const segs = lvl === 0 ? 2 : 2;
    let q = p.clone(), d = dir.clone();
    for (let s = 0; s < segs; s++) {
      d = deviate(d, 0.18 * rand(), rand); d.y += upward * 0.15 * (lvl > 0 ? 1 : 0); d.normalize();
      const n = q.clone().addScaledVector(d, len / segs);
      const r1 = rad * (1 - 0.3 * (s + 1) / segs);
      limb(bark, q, n, rad * (1 - 0.3 * s / segs), r1, sidesAt[Math.min(lvl, sidesAt.length - 1)]);
      q = n;
    }
    if (lvl >= levels) { tips.push({ p: q, d, len }); return; }
    const k = lvl === 0 ? kids + 1 : kids - (rand() < 0.3 ? 1 : 0);
    for (let i = 0; i < k; i++) {
      const ang = (lvl === 0 ? spread * 0.8 : spread * 0.6) + rand() * 0.35;
      let nd = deviate(d, ang, rand);
      if (lvl === 0) { const a = ((i + rand() * 0.5) / k) * Math.PI * 2; nd = new THREE.Vector3(Math.cos(a) * Math.sin(ang), Math.cos(ang), Math.sin(a) * Math.sin(ang)); }
      grow(q, nd, len * (0.62 + rand() * 0.16), rad * 0.62, lvl + 1);
    }
  };
  grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), fork, radius, 0);
  return tips;
}

export function landscape(scene, { quality = "high", shadows = true } = {}) {
  const group = new THREE.Group(); group.name = "landscape";
  const tex = { asphalt: ground("asphalt", 6, 1024), path: ground("asphalt", 16, 512), grass: ground("grass", 7, 512), soil: ground("soil", 8, 512) };
  const mats = {
    road: new THREE.MeshStandardMaterial({ map: tex.asphalt.map, normalMap: tex.asphalt.normalMap, roughness: 0.82, color: 0xffffff }),
    path: new THREE.MeshStandardMaterial({ map: tex.path.map, normalMap: tex.path.normalMap, roughness: 0.8, color: 0x9a9a9a }),
    grass: new THREE.MeshStandardMaterial({ map: tex.grass.map, normalMap: tex.grass.normalMap, roughness: 0.95, color: 0xffffff }),
    soil: new THREE.MeshStandardMaterial({ map: tex.soil.map, normalMap: tex.soil.normalMap, roughness: 0.95, color: 0xffffff }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x6f6d68, roughness: 0.85 }),
    paint: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  };
  const parts = { road: [], path: [], grass: [], soil: [], concrete: [], paint: [] };
  const X0 = -220, X1 = 220;
  // building side: forecourt / footpath, planting beds at the pavilion bases, a grass verge
  // the forecourt between the pavilions' fronts and the kerb; beside the ranges only a footpath along the kerb, lawn and planting behind it
  parts.path.push(strip(-17, 17, 14, KERB, 2, 1, 4), strip(X0, -17, 22.5, KERB, 4, 1, 4), strip(17, X1, 22.5, KERB, 4, 1, 4));
  parts.grass.push(strip(X0, -17, 14, 22.5, 4, 1, 4, 0.03), strip(17, X1, 14, 22.5, 4, 1, 4, 0.03));
  parts.concrete.push(...kerbAlongX(X0, -17, 22.45, 0.1, 0.08, -0.05, 4), ...kerbAlongX(17, X1, 22.45, 0.1, 0.08, -0.05, 4));
  parts.grass.push(strip(X0, X1, -60, 14, 6, 4, 4, -0.02));
  parts.soil.push(strip(-16.5, -6.3, 16.95, 18.7, 0.5, 0.5, 3, 0.07), strip(5.8, 16.8, 16.95, 18.7, 0.5, 0.5, 3, 0.07));
  parts.grass.push(strip(-24, -6.5, 22.6, 24.8, 1, 0.5, 4, 0.05));
  parts.concrete.push(...kerbAlongX(-24, -6.5, 22.55, 0.12, 0.1, -0.05, 4.4), ...kerbAlongX(-16.5, -6.3, 18.75, 0.12, 0.12, -0.05, 2.6), ...kerbAlongX(5.8, 16.8, 18.75, 0.12, 0.12, -0.05, 2.75));
  // kerb and road
  parts.concrete.push(...kerbAlongX(X0, X1, KERB, 0.16, groundAt(0, KERB - 0.01) - groundAt(0, KERB + 0.01) + 0.0, -0.08, 4).map((g) => g));
  parts.road.push(strip(X0, X1, KERB, FAR_KERB, 4, 0.75, 4));
  // median island at the crossing
  parts.concrete.push(...kerbAlongX(6, 18, 34.3, 0.15, 0.16, -0.05, 2), ...kerbAlongX(6, 18, 36.3, 0.15, 0.16, -0.05, 2));
  parts.soil.push(strip(6, 18, 34.35, 36.25, 1, 0.5, 3, 0.14));
  // far side: kerb, footpath, bank and lawn
  parts.concrete.push(...kerbAlongX(X0, X1, FAR_KERB, 0.16, 0.0, -0.18, 4));
  parts.path.push(strip(X0, X1, FAR_KERB, FAR_PATH, 4, 1, 4, 0.02));
  parts.grass.push(strip(X0, X1, FAR_PATH, BANK_TOP + 0.5, 4, 0.5, 4), strip(X0, X1, BANK_TOP + 0.5, 140, 8, 8, 4));

  // markings: angle-parking bays, lane lines, the zebra crossing, yellow no-stopping lines
  {
    const white = new THREE.Color(0xd8d8d2), yellow = new THREE.Color(0xc9a227);
    const line = (x0, z0, x1, z1, w, col) => {
      const len = Math.hypot(x1 - x0, z1 - z0), g = new THREE.PlaneGeometry(len, w, Math.max(1, Math.ceil(len / 2)), 1);
      g.rotateX(-Math.PI / 2); g.rotateY(-Math.atan2(z1 - z0, x1 - x0)); g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) p.setY(i, groundAt(p.getX(i), p.getZ(i)) + 0.012);
      const c = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) col.toArray(c, i * 3);
      g.setAttribute("color", new THREE.BufferAttribute(c, 3));
      parts.paint.push(g.toNonIndexed());
    };
    const BAY = 30.4;
    for (const [a, b] of [[-200, -1.5], [28, 200]]) {
      line(a, BAY, b, BAY, 0.1, white);
      for (let x = a + 1; x < b - 2; x += 2.7) line(x, KERB + 0.3, x + 2.4, BAY, 0.1, white);
    }
    for (let x = -200; x < 200; x += 6) if (x + 3 < 5 || x > 19) line(x, 35.3, x + 3, 35.3, 0.1, white);
    line(5, 35.3, 6, 35.3, 0.1, white); line(18, 35.3, 19, 35.3, 0.1, white);
    for (const [a, b] of [[-200, -2], [22, 200]]) line(a, 40.6, b, 40.6, 0.1, white);
    for (let z = KERB + 0.6; z < FAR_KERB - 0.4; z += 1.0) if (z < 34.0 || z > 36.6) line(9.5, z, 12.5, z, 0.5, white);
    for (let x = -1.5; x < 27.5; x += 1.6) line(x, KERB + 0.25, x + 1.0, KERB + 0.25, 0.08, yellow);
    for (let x = -2; x < 22; x += 1.6) line(x, FAR_KERB - 0.25, x + 1.0, FAR_KERB - 0.25, 0.08, yellow);
  }
  for (const [name, list] of Object.entries(parts)) {
    const g = mergeGeometries(list.map((g) => (g.attributes.uv ? g : boxUV(g))).map((g) => { if (!g.attributes.normal) g.computeVertexNormals(); for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k); if (!g.attributes.color && name === "paint") throw new Error("paint without colour"); return g; }));
    const m = new THREE.Mesh(g, mats[name]); m.receiveShadow = shadows; m.name = "ground-" + name; group.add(m);
  }

  // ---- trees --------------------------------------------------------------------------------
  const rand = rng(2024);
  const bark = [], clumps = []; // clumps: [x, y, z, sx, sy, sz, rotY, shade, kind]
  const near = (x, z) => Math.hypot(x / 1.6, z - 30) < 45; // close to the street front: more detail
  for (const [x, z, top, r, kind] of TREES) {
    const base = groundAt(x, z), h = top - base;
    const parts0 = [];
    const R = rng(Math.round(x * 131 + z * 71 + 7));
    if (kind === "B") {
      // the big plane trees near the front get the full crown; the others fewer orders of branches
      const full = quality !== "low" && Math.hypot(x - 20, z - 22) < 12;
      const tips = skeleton(parts0, R, { levels: full ? 5 : near(x, z) && quality !== "low" ? 4 : 3, fork: 0.3, spread: 0.7, kids: 3, upward: 0.3, radius: 0.026 });
      // a brush of fine twigs at every tip: the grey haze of a bare crown in winter
      if (full) for (const t of tips) for (let k = 0; k < 3; k++) {
        const d = deviate(t.d, 0.5 + R() * 0.5, R), e = t.p.clone().addScaledVector(d, t.len * (0.5 + R() * 0.4));
        limb(parts0, t.p, e, 0.0016, 0.0006, 3);
      }
      // scale the unit skeleton to the measured crown: height h, radius r
      let maxR = 0.01, maxY = 0.01; for (const t of tips) { maxR = Math.max(maxR, Math.hypot(t.p.x, t.p.z)); maxY = Math.max(maxY, t.p.y); }
      const sx = r / maxR, sy = h / maxY, sr = Math.sqrt(sx * sy);
      for (const g of parts0) { g.scale(sx, sy, sx); }
      // keep the trunk's girth sensible after the non-uniform scale
      void sr;
    } else if (kind === "E") {
      const tips = skeleton(parts0, R, { levels: 2, fork: 0.2, spread: 0.7, kids: 3, upward: 0.4, radius: 0.022 });
      let maxR = 0.01, maxY = 0.01; for (const t of tips) { maxR = Math.max(maxR, Math.hypot(t.p.x, t.p.z)); maxY = Math.max(maxY, t.p.y); }
      const sx = (r * 0.8) / maxR, sy = (h * 0.8) / maxY;
      for (const g of parts0) g.scale(sx, sy, sx);
      // foliage: overlapping clumps filling a crown from ~0.35 h to h
      const n = Math.round(Math.min(150, Math.max(24, r * r * 2.2)) * (near(x, z) ? 1 : 0.4));
      const cy = h * 0.6, ry = h * 0.4, cs = Math.max(0.9, r * 0.27);
      // a dark core of a few big masses so the sky does not show between the tufts
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + R(), d = r * 0.3;
        clumps.push([x + Math.cos(a) * d, base + cy + (R() - 0.4) * ry * 0.5, z + Math.sin(a) * d, r * 0.62, ry * 0.75, r * 0.62, R() * 6.3, 0.45, 0]);
      }
      for (let i = 0; i < n; i++) {
        const a = R() * Math.PI * 2, u = Math.pow(R(), 0.35), v = R() * 2 - 1;
        const px = Math.cos(a) * u * (r - cs * 0.6), pz = Math.sin(a) * u * (r - cs * 0.6), py = cy + v * ry * Math.sqrt(1 - u * u) * 0.9;
        const s = cs * (0.75 + R() * 0.5);
        clumps.push([x + px, base + py, z + pz, s, s * (0.75 + R() * 0.3), s, R() * 6.3, 0.75 + 0.45 * R() + 0.3 * (py - cy) / ry, 0]);
      }
    } else {
      // a tall conifer: straight trunk and tiers of dark foliage
      limb(parts0, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, h, 0), 0.35, 0.05, 7);
      const tiers = Math.round(h / 2.4);
      for (let t = 0; t < tiers; t++) {
        const f = t / tiers, y = h * (0.3 + 0.68 * f), rr = r * (1 - f * 0.85) + 0.4, k = Math.max(3, Math.round(rr * 2));
        for (let i = 0; i < k; i++) {
          const a = (i / k) * Math.PI * 2 + R() * 0.6, d = rr * (0.45 + 0.35 * R());
          clumps.push([x + Math.cos(a) * d, base + y, z + Math.sin(a) * d, rr * 0.55, 0.6 + R() * 0.3, rr * 0.55, a, 0.7 + 0.4 * R(), 1]);
        }
      }
    }
    for (const g of parts0) { g.translate(x, base, z); bark.push(g); }
  }
  const barkMat = hook(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), "bark-v1", /* glsl */ `
    { float n = wfbm(vWPos * vec3(6.0, 1.5, 6.0)); diffuseColor.rgb = mix(vec3(0.07, 0.065, 0.055), vec3(0.22, 0.2, 0.17), n); }`);
  const barkMesh = new THREE.Mesh(mergeGeometries(bark.map((g) => { g.deleteAttribute("uv"); return g; })), barkMat);
  barkMesh.castShadow = barkMesh.receiveShadow = shadows; barkMesh.name = "trees-bark";
  group.add(barkMesh);

  // a lumpy clump of leaves, shared by every instance
  const clumpGeo = (() => {
    const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position, R = rng(99), v = new THREE.Vector3();
    const bumps = Array.from({ length: 14 }, () => new THREE.Vector3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1).normalize());
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).normalize();
      let k = 0.82; for (const b of bumps) k += 0.22 * Math.pow(Math.max(0, v.dot(b)), 6);
      p.setXYZ(i, v.x * k, v.y * k * (v.y < 0 ? 0.7 : 1), v.z * k);
    }
    g.deleteAttribute("normal"); g.deleteAttribute("uv");
    const m = mergeVertices(g); m.computeVertexNormals();
    return m;
  })();
  // a smaller, ragged tuft for tree crowns: many of these read as foliage rather than as balls
  const tuftGeo = (() => {
    const g = new THREE.IcosahedronGeometry(1, 0), R = rng(77);
    g.deleteAttribute("normal"); g.deleteAttribute("uv");
    const m = mergeVertices(g), p = m.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).multiplyScalar(0.7 + R() * 0.55); p.setXYZ(i, v.x, v.y, v.z); }
    m.computeVertexNormals();
    return m;
  })();
  const leafMat = hook(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }), "leaf-v2", /* glsl */ `
    { float n = wn(vWPos * 3.5) * 0.5 + wn(vWPos * 13.0) * 0.3 + wn(vWPos * 37.0) * 0.2; diffuseColor.rgb *= 0.35 + 1.1 * n; }`, {}, "#include <map_fragment>");
  // leafy, broken-up shading: jitter the normal with world-space noise
  const leafCompile = leafMat.onBeforeCompile;
  leafMat.onBeforeCompile = (sh) => { leafCompile(sh); sh.fragmentShader = sh.fragmentShader.replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\n normal = normalize(normal + 0.6 * (vec3(wn(vWPos * 14.0), wn(vWPos * 14.0 + 5.0), wn(vWPos * 14.0 + 11.0)) - 0.5));"); };
  {
    const m = new THREE.InstancedMesh(tuftGeo, leafMat, clumps.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
    const ever = new THREE.Color(0.07, 0.11, 0.045), con = new THREE.Color(0.04, 0.065, 0.04);
    clumps.forEach(([x, y, z, sx, sy, sz, ry, shade, kind], i) => {
      m4.compose(new THREE.Vector3(x, y, z), q.setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, sy, sz));
      m.setMatrixAt(i, m4); m.setColorAt(i, c.copy(kind ? con : ever).multiplyScalar(shade).offsetHSL(((i * 37) % 11) / 400 - 0.012, 0, 0));
    });
    m.castShadow = m.receiveShadow = shadows; m.name = "trees-foliage";
    group.add(m);
  }

  // ---- planting along the base: low shrubs and flax ----------------------------------------------
  {
    const R = rng(42), shrubs = [], flax = [];
    for (const [a, b] of [[-16.3, -6.5], [6.0, 16.6]]) {
      for (let x = a + 0.2; x < b - 0.1; x += 0.28 + R() * 0.22) {
        const z = 17.25 + R() * 1.35;
        if (R() < 0.12) flax.push([x, z, 0.8 + R() * 0.5]); else shrubs.push([x, z, 0.16 + R() * 0.2]);
        if (R() < 0.6) shrubs.push([x + R() * 0.2, 17.3 + R() * 1.3, 0.12 + R() * 0.12]);
      }
    }
    for (let x = -23.5; x < -7; x += 1.4 + R() * 1.2) { if (R() < 0.5) shrubs.push([x, 23 + R() * 1.5, 0.25 + R() * 0.25]); else flax.push([x, 23.2 + R() * 1.2, 0.8 + R() * 0.4]); }
    for (let x = 6.6; x < 17.5; x += 1.2 + R()) flax.push([x, 34.8 + R() * 1.0, 0.6 + R() * 0.3]);
    // understorey: shrubs and flax in front of the ranges, under the trees either side
    for (const [a0, a1] of [[-70, -17.5], [17.5, 70]]) for (let x = a0; x < a1; x += 0.9 + R() * 1.2) {
      const z = 9 + R() * 12;
      if (R() < 0.25) flax.push([x, z, 0.9 + R() * 0.6]); else shrubs.push([x, z, 0.4 + R() * 0.6]);
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
    const sm = new THREE.InstancedMesh(clumpGeo, leafMat, shrubs.length);
    shrubs.forEach(([x, z, s], i) => {
      m4.compose(new THREE.Vector3(x, groundAt(x, z) + 0.07 + s * 0.55, z), q.setFromEuler(new THREE.Euler(0, R() * 6.3, 0)), new THREE.Vector3(s * 1.4, s * (0.55 + R() * 0.3), s * 1.4));
      sm.setMatrixAt(i, m4); sm.setColorAt(i, c.setRGB(0.035 + R() * 0.02, 0.05 + R() * 0.025, 0.025));
    });
    sm.castShadow = false; sm.receiveShadow = shadows; sm.name = "shrubs"; group.add(sm);
    // flax: a fan of long arching blades
    const blades = [];
    const RB = rng(5);
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2 + RB() * 0.4, lean = 0.15 + RB() * 0.45, len = 0.8 + RB() * 0.4, w = 0.05;
      const pts = []; for (let s = 0; s <= 4; s++) { const t = s / 4; pts.push([Math.sin(lean * 1.6 * t) * len * t * 0.8, Math.cos(lean * t) * len * t]); }
      const pos = [];
      for (let s = 0; s < 4; s++) {
        const [r0, y0] = pts[s], [r1, y1] = pts[s + 1], w0 = w * (1 - s / 4), w1 = w * (1 - (s + 1) / 4);
        const P = (r, y, o) => [Math.cos(a) * r - Math.sin(a) * o, y, Math.sin(a) * r + Math.cos(a) * o];
        pos.push(...P(r0, y0, -w0), ...P(r1, y1, -w1), ...P(r0, y0, w0), ...P(r0, y0, w0), ...P(r1, y1, -w1), ...P(r1, y1, w1));
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); blades.push(g);
    }
    const flaxGeo = mergeGeometries(blades);
    const flaxMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, side: THREE.DoubleSide });
    const fm = new THREE.InstancedMesh(flaxGeo, flaxMat, flax.length);
    flax.forEach(([x, z, s], i) => {
      m4.compose(new THREE.Vector3(x, groundAt(x, z) + 0.05, z), q.setFromEuler(new THREE.Euler(0, R() * 6.3, 0)), new THREE.Vector3(s, s, s));
      fm.setMatrixAt(i, m4); fm.setColorAt(i, c.setRGB(0.10 + R() * 0.05, 0.13 + R() * 0.04, 0.06));
    });
    fm.castShadow = false; fm.receiveShadow = shadows; fm.name = "flax"; group.add(fm);
  }

  // ---- street furniture: a lamp post and plain parking signposts (vertex coloured, one mesh) ------
  {
    const gs = [];
    const col = (g, c) => { g = g.toNonIndexed(); const a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length / 3; i++) new THREE.Color(c).toArray(a, i * 3); g.setAttribute("color", new THREE.BufferAttribute(a, 3)); g.deleteAttribute("uv"); return g; };
    const lamp = (x, z) => {
      const y = groundAt(x, z);
      gs.push(col(new THREE.CylinderGeometry(0.06, 0.1, 7.0, 10).translate(x, y + 3.5, z), 0xb9bcbc));
      // a gentle arm reaching over the footpath, and the lantern
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, y + 6.9, z), new THREE.Vector3(x, y + 7.6, z), new THREE.Vector3(x, y + 7.6, z - 0.9));
      gs.push(col(new THREE.TubeGeometry(curve, 8, 0.05, 6), 0xb9bcbc));
      gs.push(col(new THREE.CylinderGeometry(0.22, 0.12, 0.25, 10).translate(x, y + 7.45, z - 0.95), 0x9a9c9c));
    };
    const sign = (x, z) => {
      const y = groundAt(x, z);
      gs.push(col(new THREE.CylinderGeometry(0.03, 0.03, 2.7, 6).translate(x, y + 1.35, z), 0x9da2a6));
      gs.push(col(new THREE.BoxGeometry(0.32, 0.46, 0.02).translate(x, y + 2.35, z + 0.03), 0x1f4f9a));
    };
    lamp(-20.5, 24.7); lamp(11.5, 24.7); lamp(46, 24.7);
    sign(-8.6, 24.8); sign(-27, 24.8); sign(31, 24.8); sign(4.6, 24.8);
    const m = new THREE.Mesh(mergeGeometries(gs), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.2 }));
    m.castShadow = false; m.receiveShadow = shadows; m.name = "street-furniture"; group.add(m);
  }

  scene.add(group);
  return group;
}
