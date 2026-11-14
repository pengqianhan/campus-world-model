// The Final Exam, Proctor of the Last Hour: Study Quest's boss, drawn from code alone. An hourglass
// titan in a brass-and-wood frame whose sand runs out with its health; shoulders of bound books, a
// ruff of exam sheets, a scroll for a head with one red grading eye that goes from bored to stern
// to furious, a crown of pencils, two great red-pen arms that drip ink, a cape of exam papers that
// flutters and tears, and grade tiles circling it. Made up, and plainly so: no person, no course,
// nothing on any campus.
//
// It is cheap: the static parts are merged by material into a few meshes (the frame, books, pens
// and crown in one, with metal, roughness and gloss in each vertex), nine draws in all; what moves
// moves in the shaders (the sand, the paper, the tiles) or by a matrix (the arms, the ring of
// tiles), and nothing is made in a frame. The canvas textures (the printed sheets and the grade
// tiles) are drawn once.
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Euler,
  Group,
  LatheGeometry,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  Vector4,
  type WebGLProgramParametersWithUniforms,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type V3 = [number, number, number];

/** Metres from its base to the top of its crown, and over the ground it floats. */
export const BOSS_HEIGHT = 10.6;
export const BOSS_FLOAT = 0.5;
/** Where its arms hang from, in its own frame. */
const SHOULDER: V3 = [3.0, 6.95, 0.15];
/** Where the ring of grade tiles turns about. */
const HALO_AT: V3 = [0, 4.6, 0];

// The hourglass: the neck, the bottom and top of the glass, the bulbs' widest and the neck's radius.
const NECK = 3.8;
const BOT = 1.62;
const TOP = 5.98;
const MAXR = 1.5;
const NECKR = 0.14;
/** Radius of the glass at a height, in the bulb above or below the neck (the same in the shader). */
function bulbR(y: number): number {
  const s = y >= NECK ? (y - NECK) / (TOP - NECK) : (NECK - y) / (NECK - BOT);
  return NECKR + (MAXR - NECKR) * Math.pow(Math.sin(Math.PI * 0.96 * Math.min(1, Math.max(0, s))), 0.85);
}
const BULB_GLSL = /* glsl */ `
float sqBulbR(float y) {
  float s = y >= ${NECK.toFixed(3)} ? (y - ${NECK.toFixed(3)}) / ${(TOP - NECK).toFixed(3)} : (${NECK.toFixed(3)} - y) / ${(NECK - BOT).toFixed(3)};
  return ${NECKR.toFixed(3)} + ${(MAXR - NECKR).toFixed(3)} * pow(sin(3.14159265 * 0.96 * clamp(s, 0.0, 1.0)), 0.85);
}`;
/** The scroll that is its head: its axis, radius, foot and top; the eye and the mouth on it. */
const HEAD_R = 1.12;
const HEAD_LO = 7.05;
const HEAD_HI = 9.3;
const EYE_Y = 8.42;
const MOUTH_Y = 7.62;
/** The bar the cape hangs from, behind the frame. */
const CAPE_Y = 6.8;
const CAPE_Z = -2.3;

// The palette: the project's own, no university's.
const BRASS = 0xc9a24a;
const BRASS_DARK = 0x8a6a2a;
const WOOD = 0x6b3f22;
const WOOD_DARK = 0x3e2312;
const PEN_RED = 0xc4161f;
const PEN_DARK = 0x3a0a0e;
const STEEL = 0xd6d9de;
const INK = 0x1b1724;
const RED_INK = 0xa50f1a;
const PAPER = 0xf6f0e0;
const PAPER_LID = 0xe4d8bb;
const RIBBON = 0x9e1622;
const WAX = 0xb3141f;
const WAX_DARK = 0x6e0a11;
const PENCIL = 0xf2b630;
const PENCIL_WOOD = 0xe8c49a;
const GRAPHITE = 0x2b2b30;
const SAND = 0xf0b354;
const BOOKS = [0x1f5f6b, 0x7a1f2b, 0xc89a2c, 0x23305e, 0x3f6b2a, 0x5a2a6e];

/** Surfaces: metalness, roughness, and a lacquer's gloss at the edges. */
const S_BRASS: V3 = [1, 0.32, 0];
const S_STEEL: V3 = [1, 0.22, 0];
const S_WOOD: V3 = [0, 0.62, 0.25];
const S_LACQUER: V3 = [0, 0.3, 1];
const S_PAPER: V3 = [0, 0.9, 0];
const S_INK: V3 = [0, 0.35, 0.6];

// ---------------------------------------------------------------------------------------------
// Building geometry
// ---------------------------------------------------------------------------------------------

const _m = new Matrix4();
const _q = new Quaternion();
const _e = new Euler();
const _v = new Vector3();
const _c = new Color();

type Fill = Record<string, number[] | ((x: number, y: number, z: number, u: number, v: number) => number[])>;

interface Place {
  at?: V3;
  rot?: V3;
  scale?: V3;
  /** A rectangle of the texture the piece's own 0-1 uvs map into. */
  uv?: [number, number, number, number];
  /** The order of `rot`: XYZ, or YXZ to tilt a piece and then turn it about the vertical. */
  order?: "XYZ" | "YXZ";
}

/**
 * A piece made ready to merge: placed, without an index, with a value in each vertex of each of
 * `fill`'s attributes (a constant, or worked out from where the vertex ends up and its uv). Uvs are
 * kept only when `keepUv`.
 */
function bake(geo: BufferGeometry, fill: Fill, p: Place = {}, keepUv = false): BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  geo.dispose();
  const [rx, ry, rz] = p.rot ?? [0, 0, 0];
  _e.set(rx, ry, rz, p.order ?? "XYZ");
  _q.setFromEuler(_e);
  _m.compose(_v.set(...(p.at ?? [0, 0, 0])), _q, new Vector3(...(p.scale ?? [1, 1, 1])));
  g.applyMatrix4(_m);
  if (!g.getAttribute("normal")) g.computeVertexNormals();
  const pos = g.getAttribute("position");
  const uv = g.getAttribute("uv");
  const n = pos.count;
  if (keepUv && uv && p.uv) {
    const [u0, v0, u1, v1] = p.uv;
    for (let i = 0; i < n; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  }
  for (const [name, f] of Object.entries(fill)) {
    const size = typeof f === "function" ? f(0, 0, 0, 0, 0).length : f.length;
    const arr = new Float32Array(n * size);
    for (let i = 0; i < n; i++) {
      const vals = typeof f === "function" ? f(pos.getX(i), pos.getY(i), pos.getZ(i), uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0) : f;
      for (let k = 0; k < size; k++) arr[i * size + k] = vals[k]!;
    }
    g.setAttribute(name, new BufferAttribute(arr, size));
  }
  if (!keepUv) g.deleteAttribute("uv");
  for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal" && name !== "uv" && !(name in fill)) g.deleteAttribute(name);
  return g;
}

function mergeAll(list: BufferGeometry[]): BufferGeometry {
  const out = mergeGeometries(list, false)!;
  for (const g of list) g.dispose();
  out.computeBoundingSphere();
  return out;
}

/** A turned form about the vertical: [radius, height] from the bottom up. */
function lathe(pts: [number, number][], seg = 32): BufferGeometry {
  return new LatheGeometry(
    pts.map(([r, y]) => new Vector2(Math.max(0.001, r), y)),
    seg,
  );
}

/** A colour, its surface, for the one opaque material. */
const solid = (color: number, surf: V3): Fill => {
  _c.setHex(color);
  return { color: [_c.r, _c.g, _c.b], aSurf: surf };
};

/** A seeded random, so that the cracks and the papers are the same each time. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------------------------------------------------------------------------------------------
// The opaque body: frame, books, neck, crown, pencils
// ---------------------------------------------------------------------------------------------

function bodyGeometry(): BufferGeometry {
  const out: BufferGeometry[] = [];
  const add = (geo: BufferGeometry, color: number, surf: V3, p?: Place) => out.push(bake(geo, solid(color, surf), p));

  // The plinth under the lower bulb: a turned wooden foot with a cove and a bead, brass banded.
  add(
    lathe([
      [0.5, 0.55],
      [1.45, 0.6],
      [1.75, 0.72],
      [1.82, 0.86],
      [1.62, 1.0],
      [1.6, 1.12],
      [1.95, 1.2],
      [2.02, 1.32],
      [1.96, 1.44],
      [1.7, 1.5],
      [1.2, 1.56],
      [0.4, 1.62],
    ], 40),
    WOOD,
    S_WOOD,
  );
  add(new TorusGeometry(1.9, 0.07, 8, 48), BRASS, S_BRASS, { at: [0, 1.2, 0], rot: [Math.PI / 2, 0, 0] });
  add(new TorusGeometry(1.76, 0.05, 8, 48), BRASS, S_BRASS, { at: [0, 0.74, 0], rot: [Math.PI / 2, 0, 0] });
  // The cap over the upper bulb, the plinth's mirror, a little lighter.
  add(
    lathe([
      [0.4, 5.96],
      [1.2, 6.02],
      [1.7, 6.08],
      [1.98, 6.15],
      [2.05, 6.28],
      [1.98, 6.4],
      [1.65, 6.46],
      [1.62, 6.56],
      [1.0, 6.62],
      [0.3, 6.64],
    ], 40),
    WOOD,
    S_WOOD,
  );
  add(new TorusGeometry(1.92, 0.07, 8, 48), BRASS, S_BRASS, { at: [0, 6.36, 0], rot: [Math.PI / 2, 0, 0] });
  // Four turned pillars, beaded, with brass caps and feet.
  const pillar = (): BufferGeometry =>
    lathe([
      [0.001, 1.5],
      [0.2, 1.5],
      [0.2, 1.62],
      [0.12, 1.72],
      [0.15, 1.9],
      [0.09, 2.2],
      [0.13, 2.9],
      [0.085, 3.4],
      [0.16, 3.72],
      [0.16, 3.88],
      [0.085, 4.2],
      [0.13, 4.7],
      [0.09, 5.4],
      [0.15, 5.7],
      [0.12, 5.88],
      [0.2, 5.98],
      [0.2, 6.1],
      [0.001, 6.1],
    ], 10);
  for (const a of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
    const x = Math.sin(a) * 1.72;
    const z = Math.cos(a) * 1.72;
    add(pillar(), WOOD_DARK, S_WOOD, { at: [x, 0, z] });
    add(new SphereGeometry(0.2, 12, 8), BRASS, S_BRASS, { at: [x, 3.8, z] });
  }
  // A brass band round the glass's waist, on four struts to the pillars.
  add(new TorusGeometry(0.26, 0.06, 8, 24), BRASS, S_BRASS, { at: [0, NECK, 0], rot: [Math.PI / 2, 0, 0] });
  for (const a of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
    add(new CylinderGeometry(0.035, 0.035, 1.42, 6), BRASS_DARK, S_BRASS, { at: [Math.sin(a) * 0.99, NECK, Math.cos(a) * 0.99], rot: [0, a, Math.PI / 2] });
  }

  // Shoulders of bound books, three a side, fanned and askew: covers lacquered, pages cream, gilt bands.
  const book = (w: number, h: number, d: number, color: number, at: V3, rot: V3) => {
    const pages = 0.08;
    add(new RoundedBoxGeometry(w, h, d, 2, 0.05), color, S_LACQUER, { at, rot });
    // The page block shows on three sides, set in from the covers.
    const q = new Quaternion().setFromEuler(new Euler(...rot));
    const off = new Vector3(0.05, 0, 0).applyQuaternion(q);
    add(new RoundedBoxGeometry(w - pages, h - 0.12, d + 0.02, 1, 0.02), PAPER, S_PAPER, { at: [at[0] + off.x, at[1] + off.y, at[2] + off.z], rot });
    for (const k of [-0.32, 0.32]) {
      const band = new Vector3(-w / 2 - 0.005, 0, k * d).applyQuaternion(q);
      add(new RoundedBoxGeometry(0.04, h + 0.02, 0.06, 1, 0.015), BRASS, S_BRASS, { at: [at[0] + band.x, at[1] + band.y, at[2] + band.z], rot });
    }
  };
  for (const side of [-1, 1]) {
    book(2.0, 0.46, 1.4, BOOKS[side < 0 ? 0 : 3]!, [side * 2.4, 6.64, 0.05], [0, side * 0.12, side * -0.16]);
    book(1.75, 0.4, 1.26, BOOKS[side < 0 ? 1 : 4]!, [side * 2.55, 7.06, -0.02], [0, side * -0.2, side * -0.24]);
    book(1.45, 0.34, 1.1, BOOKS[side < 0 ? 2 : 5]!, [side * 2.7, 7.42, 0.06], [0, side * 0.28, side * -0.32]);
    // The shoulder's socket for the pen arm: a brass boss.
    add(new SphereGeometry(0.42, 16, 12), BRASS, S_BRASS, { at: [side * SHOULDER[0], SHOULDER[1], SHOULDER[2]] });
  }

  // The neck: a brass stem like a watch's, with a crown knob in front, up to the scroll.
  add(
    lathe([
      [0.001, 6.6],
      [0.55, 6.62],
      [0.42, 6.7],
      [0.34, 6.82],
      [0.4, 6.9],
      [0.6, 6.98],
      [0.62, 7.06],
      [0.001, 7.08],
    ], 24),
    BRASS,
    S_BRASS,
  );
  // The scroll's ends: brass caps and turned finials, and wooden rollers, top and bottom.
  for (const [y, up] of [
    [HEAD_LO, -1],
    [HEAD_HI, 1],
  ] as const) {
    add(new CylinderGeometry(1.12, 1.12, 0.16, 40), WOOD, S_WOOD, { at: [0, y + up * 0.06, 0] });
    add(new TorusGeometry(1.12, 0.06, 8, 48), BRASS, S_BRASS, { at: [0, y + up * 0.06, 0], rot: [Math.PI / 2, 0, 0] });
    for (const sx of [-1, 1]) {
      add(
        lathe([
          [0.001, 0],
          [0.13, 0],
          [0.1, 0.12],
          [0.17, 0.26],
          [0.11, 0.38],
          [0.001, 0.46],
        ], 12),
        BRASS,
        S_BRASS,
        { at: [sx * 1.15, y + up * 0.06, 0], rot: [0, 0, -sx * (Math.PI / 2)] },
      );
    }
  }
  // The crown: a brass band with points, and pencils standing in it, splayed, sharpened.
  add(
    lathe([
      [0.86, HEAD_HI + 0.12],
      [0.98, HEAD_HI + 0.14],
      [1.0, HEAD_HI + 0.44],
      [0.92, HEAD_HI + 0.46],
      [0.9, HEAD_HI + 0.2],
    ], 40),
    BRASS,
    S_BRASS,
  );
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    add(new ConeGeometry(0.12, 0.3, 4), BRASS, S_BRASS, { at: [Math.sin(a) * 0.98, HEAD_HI + 0.58, Math.cos(a) * 0.98], rot: [0, a, 0] });
  }
  const pencils = 9;
  for (let k = 0; k < pencils; k++) {
    const a = ((k + 0.5) / pencils) * Math.PI * 2;
    const len = 1.05 + (k % 3) * 0.18 + (k === 0 || k === pencils - 1 ? 0.12 : 0);
    const tilt = 0.32;
    const q = new Quaternion().setFromEuler(new Euler(Math.cos(a) * tilt, 0, -Math.sin(a) * tilt));
    const base = new Vector3(Math.sin(a) * 0.72, HEAD_HI + 0.2, Math.cos(a) * 0.72);
    const along = (d: number): V3 => {
      const p = new Vector3(0, d, 0).applyQuaternion(q).add(base);
      return [p.x, p.y, p.z];
    };
    const rot: V3 = [Math.cos(a) * tilt, 0, -Math.sin(a) * tilt];
    add(new CylinderGeometry(0.13, 0.13, len, 6), PENCIL, S_LACQUER, { at: along(len / 2), rot });
    add(new CylinderGeometry(0.135, 0.135, 0.12, 6), BRASS, S_BRASS, { at: along(0.06), rot });
    add(new ConeGeometry(0.13, 0.32, 6), PENCIL_WOOD, S_WOOD, { at: along(len + 0.16), rot });
    add(new ConeGeometry(0.045, 0.11, 6), GRAPHITE, [0.4, 0.4, 0.3], { at: along(len + 0.28), rot });
  }
  // The back of the scroll: the paper's outer edge rolled into a seam down it (where the sheet's
  // wound end lies), a red ribbon tied round it with its tails hanging, and a wax seal on the seam.
  const seamY = (HEAD_HI + HEAD_LO) / 2;
  const seamH = HEAD_HI - HEAD_LO - 0.08;
  add(new CylinderGeometry(0.075, 0.075, seamH, 10), PAPER_LID, S_PAPER, { at: [0.1, seamY, -HEAD_R - 0.02] });
  add(new BoxGeometry(0.3, seamH, 0.025), PAPER, S_PAPER, { at: [0.24, seamY, -HEAD_R - 0.005], rot: [0, 0.32, 0] });
  const RIBBON_Y = 8.0;
  add(new CylinderGeometry(HEAD_R + 0.025, HEAD_R + 0.025, 0.2, 48, 1, true), RIBBON, S_LACQUER, { at: [0, RIBBON_Y, 0] });
  for (const sx of [-1, 1]) {
    // The bow's loops, then its tails down the back, cut in a V at their ends.
    add(new TorusGeometry(0.16, 0.045, 6, 16), RIBBON, S_LACQUER, { at: [sx * 0.2, RIBBON_Y + 0.05, -HEAD_R - 0.1], rot: [0, sx * 0.5, sx * 0.4], scale: [1.2, 0.8, 0.5] });
    add(new BoxGeometry(0.16, 1.05, 0.03), RIBBON, S_LACQUER, { at: [sx * 0.13, RIBBON_Y - 0.55, -HEAD_R - 0.09], rot: [-0.08, 0, sx * 0.12] });
    add(new ConeGeometry(0.08, 0.14, 3), RIBBON, S_LACQUER, { at: [sx * 0.2, RIBBON_Y - 1.12, -HEAD_R - 0.13], rot: [Math.PI, 0, 0], scale: [1, 1, 0.3] });
  }
  // The seal: a disc of red wax, its rim pressed into lobes, a stamp at its middle.
  add(lathe([
    [0.001, 0],
    [0.24, 0],
    [0.27, 0.03],
    [0.25, 0.07],
    [0.15, 0.09],
    [0.001, 0.1],
  ], 10), WAX, S_LACQUER, { at: [0, RIBBON_Y, -HEAD_R - 0.12], rot: [-Math.PI / 2, 0, 0] });
  add(new TorusGeometry(0.12, 0.022, 6, 18), WAX_DARK, S_LACQUER, { at: [0, RIBBON_Y, -HEAD_R - 0.22] });
  // The bar the cape hangs from, behind and clear of the frame, on struts from the shoulders.
  add(new CylinderGeometry(0.09, 0.09, 4.6, 10), WOOD_DARK, S_WOOD, { at: [0, CAPE_Y, CAPE_Z], rot: [0, 0, Math.PI / 2] });
  for (const sx of [-1, 1]) {
    add(new SphereGeometry(0.16, 10, 8), BRASS, S_BRASS, { at: [sx * 2.32, CAPE_Y, CAPE_Z] });
    const a = new Vector3(sx * 2.32, CAPE_Y, CAPE_Z);
    const b = new Vector3(sx * SHOULDER[0], SHOULDER[1], SHOULDER[2]);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const eu = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize()));
    add(new CylinderGeometry(0.06, 0.06, a.distanceTo(b), 8), BRASS_DARK, S_BRASS, { at: [mid.x, mid.y, mid.z], rot: [eu.x, eu.y, eu.z] });
  }
  return mergeAll(out);
}

/** Metres down the arm from the shoulder to the elbow, where the pen's cap meets its barrel. */
const ELBOW = 1.68;

/**
 * An arm in two: the upper (a shoulder ball and the pen's cap, with its clip and band) hangs from the
 * shoulder; the forearm (the barrel, the grip, the steel nib, ink dripping) from the elbow, a brass
 * hinge. Each drawn along -y from its own pivot.
 */
function armGeometry(side: number): { upper: BufferGeometry; lower: BufferGeometry } {
  const up: BufferGeometry[] = [];
  const low: BufferGeometry[] = [];
  const add = (to: BufferGeometry[], geo: BufferGeometry, color: number, surf: V3, p?: Place) => to.push(bake(geo, solid(color, surf), p));
  add(up, new SphereGeometry(0.5, 18, 12), BRASS, S_BRASS);
  add(
    up,
    lathe([
      [0.001, -0.25],
      [0.3, -0.3],
      [0.4, -0.45],
      [0.44, -1.0],
      [0.42, -1.5],
      [0.47, -1.55],
      [0.47, -1.66],
      [0.001, -1.68],
    ], 24),
    PEN_RED,
    S_LACQUER,
  );
  add(up, new TorusGeometry(0.44, 0.05, 8, 28), BRASS, S_BRASS, { at: [0, -1.6, 0], rot: [Math.PI / 2, 0, 0] });
  add(up, new RoundedBoxGeometry(0.12, 1.1, 0.16, 1, 0.04), BRASS, S_BRASS, { at: [side * 0.46, -0.95, 0], rot: [0, 0, side * 0.03] });
  add(up, new SphereGeometry(0.1, 10, 8), BRASS, S_BRASS, { at: [side * 0.47, -1.5, 0] });
  // The elbow: a brass hinge across the joint.
  add(low, new CylinderGeometry(0.2, 0.2, 0.86, 16), BRASS, S_BRASS, { rot: [0, 0, Math.PI / 2] });
  add(low, new SphereGeometry(0.36, 16, 12), BRASS_DARK, S_BRASS);
  add(
    low,
    lathe([
      [0.001, -0.1],
      [0.37, -0.12],
      [0.38, -1.4],
      [0.34, -1.5],
      [0.34, -2.2],
      [0.29, -2.27],
      [0.001, -2.3],
    ], 24),
    PEN_RED,
    S_LACQUER,
  );
  for (let k = 0; k < 5; k++) add(low, new TorusGeometry(0.35, 0.035, 6, 24), PEN_DARK, S_INK, { at: [0, -1.6 - k * 0.13, 0], rot: [Math.PI / 2, 0, 0] });
  // The nib: steel, split, its tip red with ink.
  add(low, new ConeGeometry(0.31, 0.8, 16), STEEL, S_STEEL, { at: [0, -2.68, 0], rot: [Math.PI, 0, 0] });
  add(low, new CylinderGeometry(0.012, 0.02, 0.5, 4), INK, S_INK, { at: [0, -2.68, 0.21], rot: [0.38, 0, 0] });
  add(low, new SphereGeometry(0.08, 10, 8), RED_INK, S_INK, { at: [0, -3.07, 0] });
  // Ink dripping off the nib and the grip: thin runs, each ending in a drop.
  const run = (x: number, z: number, top: number, len: number, r: number) => {
    add(low, new CylinderGeometry(r * 0.45, r * 0.8, len, 6), RED_INK, S_INK, { at: [x, top - len / 2, z] });
    add(low, new SphereGeometry(r, 10, 8), RED_INK, S_INK, { at: [x, top - len - r * 0.4, z], scale: [1, 1.35, 1] });
  };
  run(0.05, 0.02, -3.05, 0.35, 0.09);
  run(-0.06, 0.04, -3.02, 0.18, 0.06);
  run(side * 0.2, 0.22, -2.5, 0.28, 0.06);
  return { upper: mergeAll(up), lower: mergeAll(low) };
}

// ---------------------------------------------------------------------------------------------
// The face: printed in ink on the scroll, and changing with its mood
// ---------------------------------------------------------------------------------------------

/** A point on the scroll's face at `x` across and `y` up, `lift` metres off the paper. */
function onScroll(x: number, y: number, lift: number): V3 {
  const r = HEAD_R + lift;
  const xx = Math.max(-r * 0.98, Math.min(r * 0.98, x));
  return [xx, y, Math.sqrt(r * r - xx * xx)];
}

interface Strip {
  /** For each mood (calm, stern, furious): the strip's two edges, as many points each, across and up. */
  moods: [number, number][][][];
  color: number;
  surf: V3;
  lift: number;
}

/** The face's strips as one geometry, with the stern and the furious faces as morph targets. */
function faceGeometry(): BufferGeometry {
  const strips: Strip[] = [];
  const N = 16;
  const edge = (w: number, y: (s: number) => number): [number, number][] => Array.from({ length: N + 1 }, (_, i) => {
    const s = -1 + (2 * i) / N;
    return [s * w, y(s)];
  });
  // The eye: an almond of paper white; its upper and lower lids drawn in ink.
  const EW = 0.68;
  const EH = 0.35;
  const top = (s: number) => EYE_Y + EH * Math.sqrt(Math.max(0, 1 - s * s));
  const bot = (s: number) => EYE_Y - EH * Math.sqrt(Math.max(0, 1 - s * s));
  const still = (a: [number, number][], b: [number, number][]) => [a, b];
  const three = (f: (mood: number) => [number, number][][]) => [f(0), f(1), f(2)];
  strips.push({ moods: three(() => still(edge(EW, bot), edge(EW, top))), color: 0xfbf7ec, surf: S_PAPER, lift: 0.02 });
  // The upper lid's fold: bored and low, then raised and level, then hard down in the middle.
  const lid = (mood: number) => (s: number) => {
    const want = mood === 0 ? EYE_Y + 0.02 + 0.03 * s * s : mood === 1 ? EYE_Y + 0.17 - 0.06 * (1 - Math.abs(s)) : EYE_Y + 0.06 + 0.22 * Math.abs(s);
    return Math.min(top(s), want);
  };
  strips.push({ moods: three((m) => [edge(EW + 0.02, lid(m)), edge(EW + 0.02, (s) => top(s) + 0.04)]), color: PAPER_LID, surf: S_PAPER, lift: 0.05 });
  strips.push({ moods: three((m) => [edge(EW + 0.04, (s) => lid(m)(s) - 0.05 - (m === 2 ? 0.02 : 0)), edge(EW + 0.04, lid(m))]), color: INK, surf: S_INK, lift: 0.06 });
  // The lower lid: a thin line, pushed up in a squint when furious.
  const low = (mood: number) => (s: number) => Math.max(bot(s), mood === 2 ? EYE_Y - 0.17 + 0.1 * s * s : bot(s));
  strips.push({ moods: three((m) => [edge(EW + 0.02, (s) => bot(s) - 0.04), edge(EW + 0.02, low(m))]), color: PAPER_LID, surf: S_PAPER, lift: 0.05 });
  strips.push({ moods: three((m) => [edge(EW, (s) => low(m)(s) - 0.035), edge(EW, low(m))]), color: INK, surf: S_INK, lift: 0.06 });
  // The pupil: a round, bored dot; a slit; a thin, wide-awake slit.
  const pupil = (mood: number) => {
    const w = [0.11, 0.07, 0.045][mood]!;
    const h = [0.15, 0.26, 0.3][mood]!;
    return [edge(w, (s) => EYE_Y - h * Math.sqrt(Math.max(0, 1 - s * s))), edge(w, (s) => EYE_Y + h * Math.sqrt(Math.max(0, 1 - s * s)))];
  };
  strips.push({ moods: three(pupil), color: 0x120d12, surf: S_INK, lift: 0.04 });
  // The brow: one thick stroke of ink, tapered; arched, then level and low, then a hard V.
  const brow = (mood: number) => {
    const mid = (s: number) => (mood === 0 ? EYE_Y + 0.62 - 0.08 * s * s : mood === 1 ? EYE_Y + 0.46 + 0.1 * Math.abs(s) : EYE_Y + 0.3 + 0.36 * Math.abs(s));
    const thick = (s: number) => (0.07 + (mood === 2 ? 0.08 : 0.05)) * (1 - 0.7 * s * s);
    const w = mood === 2 ? 0.86 : 0.78;
    return [edge(w, (s) => mid(s) - thick(s)), edge(w, (s) => mid(s) + thick(s))];
  };
  strips.push({ moods: three(brow), color: INK, surf: S_INK, lift: 0.075 });
  // The mouth, a mark in red ink: a flat frown; a deeper, parted one; a jagged roar with teeth.
  const MW = [0.42, 0.46, 0.56];
  const mTop = (mood: number) => (s: number) => (mood === 0 ? MOUTH_Y - 0.1 * s * s : mood === 1 ? MOUTH_Y + 0.03 - 0.2 * s * s : MOUTH_Y + 0.12 - 0.22 * s * s);
  const mBot = (mood: number) => (s: number) => (mood === 0 ? MOUTH_Y - 0.1 * s * s : mood === 1 ? MOUTH_Y - 0.03 - 0.17 * s * s : MOUTH_Y - 0.36 + 0.16 * s * s);
  strips.push({ moods: three((m) => [edge(MW[m]!, mBot(m)), edge(MW[m]!, mTop(m))]), color: 0x2a0608, surf: S_INK, lift: 0.02 });
  // Teeth, only when it roars: a saw edge of paper under the top lip.
  const teeth = (mood: number) => {
    const t = mTop(mood);
    return [
      edge(MW[mood]!, (s) => {
        const i = Math.round(((s + 1) * N) / 2);
        return t(s) - (mood === 2 ? (i % 2 ? 0.01 : 0.11) * (1 - s * s * 0.5) : 0);
      }),
      edge(MW[mood]!, t),
    ];
  };
  strips.push({ moods: three(teeth), color: 0xf3ead2, surf: S_PAPER, lift: 0.03 });
  const lip = (f: (mood: number) => (s: number) => number, sign: number) => (mood: number) => [edge(MW[mood]! + 0.03, (s) => f(mood)(s) - (sign < 0 ? 0.055 : 0)), edge(MW[mood]! + 0.03, (s) => f(mood)(s) + (sign > 0 ? 0.055 : 0))];
  strips.push({ moods: three(lip(mTop, 1)), color: RED_INK, surf: S_INK, lift: 0.04 });
  strips.push({ moods: three(lip(mBot, -1)), color: RED_INK, surf: S_INK, lift: 0.04 });
  // Ink running down from the mouth's corners and the eye: none when calm, longer as it rages.
  const drip = (x: number, from: (mood: number) => number, len: number[], w: number, color: number) =>
    strips.push({
      moods: three((m) => {
        const y0 = from(m);
        const l = len[m]!;
        const pts = (k: number): [number, number][] =>
          Array.from({ length: N + 1 }, (_, i) => {
            const t = i / N;
            // Thin at the top, a drop at the foot.
            const half = w * (0.35 + 0.65 * Math.pow(t, 3) + (t > 0.85 ? 0.4 : 0));
            return [x + k * half, y0 - l * t];
          });
        return [pts(-1), pts(1)];
      }),
      color,
      surf: S_INK,
      lift: 0.025,
    });
  drip(-0.42, (m) => mBot(m)(-0.75), [0, 0.32, 0.62], 0.035, RED_INK);
  drip(0.47, (m) => mBot(m)(0.84), [0, 0.18, 0.48], 0.03, RED_INK);
  drip(0.1, (m) => mBot(m)(0.18), [0, 0, 0.36], 0.03, RED_INK);
  drip(-0.5, (m) => low(m)(-0.8) - 0.03, [0, 0.12, 0.3], 0.028, INK);

  // Each strip: quads between its two edges, the same triangles in each mood.
  const pos: number[][] = [[], [], []];
  const col: number[] = [];
  const surf: number[] = [];
  for (const st of strips) {
    _c.setHex(st.color);
    for (let i = 0; i < N; i++) {
      for (const [a, b] of [
        [0, i],
        [0, i + 1],
        [1, i],
        [1, i],
        [0, i + 1],
        [1, i + 1],
      ] as const) {
        for (let m = 0; m < 3; m++) {
          const p = st.moods[m]![a]![b]!;
          pos[m]!.push(...onScroll(p[0], p[1], st.lift));
        }
        col.push(_c.r, _c.g, _c.b);
        surf.push(...st.surf);
      }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos[0]!), 3));
  g.setAttribute("color", new BufferAttribute(new Float32Array(col), 3));
  g.setAttribute("aSurf", new BufferAttribute(new Float32Array(surf), 3));
  g.morphAttributes.position = [new BufferAttribute(new Float32Array(pos[1]!), 3), new BufferAttribute(new Float32Array(pos[2]!), 3)];
  // The face is on the paper, and lit as the paper is: its normals point out from the scroll.
  const nrm = new Float32Array(pos[0]!.length);
  for (let i = 0; i < nrm.length; i += 3) {
    const x = pos[0]![i]!;
    const z = pos[0]![i + 2]!;
    const l = Math.hypot(x, z) || 1;
    nrm[i] = x / l;
    nrm[i + 2] = z / l;
  }
  g.setAttribute("normal", new BufferAttribute(nrm, 3));
  g.computeBoundingSphere();
  return g;
}

// ---------------------------------------------------------------------------------------------
// The glass, the sand, what glows
// ---------------------------------------------------------------------------------------------

function glassGeometry(): BufferGeometry {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const y = BOT + ((TOP - BOT) * i) / 40;
    pts.push([bulbR(y) + 0.02, y]);
  }
  return bake(lathe(pts, 40), {});
}

/** The sand: the heap above (part 0), the heap below (1), the stream between (2). The shader moves them. */
function sandGeometry(): BufferGeometry {
  const out: BufferGeometry[] = [];
  _c.setHex(SAND);
  const tone = (k: number) => [_c.r * k, _c.g * k, _c.b * k];
  // Above: the bulb filled from the neck to three quarters, its top dished towards the neck.
  const up: [number, number][] = [[0.001, NECK]];
  for (let i = 1; i <= 14; i++) {
    const y = NECK + ((TOP - NECK) * 0.72 * i) / 14;
    up.push([bulbR(y) - 0.05, y]);
  }
  up.push([0.4, NECK + (TOP - NECK) * 0.72 - 0.1], [0.001, NECK + (TOP - NECK) * 0.6]);
  out.push(bake(lathe(up, 28), { color: tone(1), aPart: [0] }));
  // Below: a mound on the floor of the lower bulb.
  const low: [number, number][] = [[0.001, BOT + 0.03]];
  for (let i = 1; i <= 10; i++) {
    const y = BOT + 0.03 + (1.0 * i) / 10;
    low.push([bulbR(y) - 0.05, y]);
  }
  low.push([0.001, BOT + 1.55]);
  out.push(bake(lathe(low, 28), { color: tone(0.92), aPart: [1] }));
  // The stream, from the neck to the floor; the shader ends it on the heap.
  out.push(bake(new CylinderGeometry(0.05, 0.05, NECK - BOT, 8, 16, true), { color: tone(1.15), aPart: [2] }, { at: [0, (NECK + BOT) / 2, 0] }));
  return mergeAll(out);
}

/** What glows, each from the phase it shows in: the eye, cracks in the glass and the frame, red-hot pencil tips. */
function glowGeometry(): BufferGeometry {
  const out: BufferGeometry[] = [];
  const add = (geo: BufferGeometry, color: number, phase: number, p?: Place) => {
    _c.setHex(color);
    out.push(bake(geo, { color: [_c.r, _c.g, _c.b], aPhase: [phase] }, p));
  };
  // The grading eye: a red iris with a hot core, behind the pupil.
  const [ex, ey, ez] = onScroll(0, EYE_Y, 0.03);
  add(new CylinderGeometry(0.25, 0.25, 0.01, 28), 0xff1f2e, 1, { at: [ex, ey, ez], rot: [Math.PI / 2, 0, 0] });
  add(new CylinderGeometry(0.15, 0.15, 0.01, 20), 0xff8a5c, 1, { at: [ex, ey, ez + 0.004], rot: [Math.PI / 2, 0, 0] });
  // Cracks in the glass: a few in the second phase, more in the last. Each a star of straight
  // fractures from a point of impact, some forking once, thinning to their ends: straight on the
  // glass, they follow the bulb's curve in short pieces.
  const rand = rng(7);
  const line = (a0: number, h0: number, dir: number, len: number, w0: number, w1: number, phase: number) => {
    // `dir`: radians on the unrolled glass, 0 up; a and h step straight there.
    const PIECES = 4;
    let a = a0;
    let h = h0;
    let p = new Vector3(Math.sin(a) * (bulbR(h) + 0.03), h, Math.cos(a) * (bulbR(h) + 0.03));
    for (let i = 0; i < PIECES; i++) {
      const step = len / PIECES;
      h = Math.max(BOT + 0.12, Math.min(TOP - 0.12, h + Math.cos(dir) * step));
      a += (Math.sin(dir) * step) / Math.max(0.3, bulbR(h));
      const q = new Vector3(Math.sin(a) * (bulbR(h) + 0.03), h, Math.cos(a) * (bulbR(h) + 0.03));
      const l = p.distanceTo(q);
      if (l < 1e-3) break;
      const mid = p.clone().add(q).multiplyScalar(0.5);
      const t0 = i / PIECES;
      const t1 = (i + 1) / PIECES;
      const g = new CylinderGeometry(w0 + (w1 - w0) * t1, w0 + (w1 - w0) * t0, l, 3);
      const eu = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), q.clone().sub(p).normalize()));
      add(g, 0xffc46a, phase, { at: [mid.x, mid.y, mid.z], rot: [eu.x, eu.y, eu.z] });
      p = q;
    }
    return { a, h };
  };
  const star = (a0: number, h0: number, rays: number, reach: number, phase: number) => {
    const turn0 = rand() * Math.PI * 2;
    for (let k = 0; k < rays; k++) {
      const dir = turn0 + (k / rays) * Math.PI * 2 + (rand() - 0.5) * 0.5;
      const len = reach * (0.55 + rand() * 0.6);
      const w = 0.016 + rand() * 0.008;
      // A fork part way along, at an angle, shorter.
      const split = 0.35 + rand() * 0.3;
      const mid = line(a0, h0, dir, len * split, w, w * 0.8, phase);
      line(mid.a, mid.h, dir, len * (1 - split), w * 0.8, 0.004, phase);
      if (rand() < 0.6) line(mid.a, mid.h, dir + (rand() < 0.5 ? -1 : 1) * (0.45 + rand() * 0.3), len * (1 - split) * 0.7, w * 0.6, 0.003, phase);
    }
  };
  for (const [a, y] of [
    [0.5, 2.5],
    [-0.4, 5.0],
    [0.9, 4.6],
  ] as const)
    star(a, y, 4, 0.75, 2);
  for (let k = 0; k < 5; k++) star(-1.4 + (k / 4) * 2.8 + (rand() - 0.5) * 0.3, k % 2 ? 2.3 + rand() * 0.6 : 4.5 + rand() * 0.8, 5, 0.85, 3);
  // Cracks in the frame's wood, glowing from within, in the last phase.
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + 0.2;
    const y = k % 2 ? 1.32 : 6.28;
    add(new CylinderGeometry(0.03, 0.02, 0.36, 4), 0xff6a2a, 3, { at: [Math.sin(a) * 2.04, y, Math.cos(a) * 2.04], rot: [0, a, 0.6 * (k % 3 ? 1 : -1)] });
  }
  // The pencils' points, red hot in the last phase.
  for (let k = 0; k < 9; k++) {
    const a = ((k + 0.5) / 9) * Math.PI * 2;
    const len = 1.05 + (k % 3) * 0.18 + (k === 0 || k === 8 ? 0.12 : 0);
    const tilt = 0.32;
    const q = new Quaternion().setFromEuler(new Euler(Math.cos(a) * tilt, 0, -Math.sin(a) * tilt));
    const p = new Vector3(0, len + 0.3, 0).applyQuaternion(q).add(new Vector3(Math.sin(a) * 0.72, HEAD_HI + 0.2, Math.cos(a) * 0.72));
    add(new SphereGeometry(0.07, 8, 6), 0xff5a1f, 3, { at: [p.x, p.y, p.z] });
  }
  return mergeAll(out);
}

// ---------------------------------------------------------------------------------------------
// Paper: the ruff, the cape, the skirt, the scroll
// ---------------------------------------------------------------------------------------------

/** The printed paper, drawn once: an exam sheet (left half), the scroll's ruled parchment (right). */
function paperTexture(): CanvasTexture | undefined {
  if (typeof document === "undefined") return undefined;
  const W = 1024;
  const H = 1024;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  const rand = rng(11);
  // The sheet: cream, aged at its edges, ruled, with question numbers, writing, and red marks.
  const sheet = (x0: number, w: number) => {
    const grad = g.createLinearGradient(x0, 0, x0 + w, 0);
    grad.addColorStop(0, "#e6dcc2");
    grad.addColorStop(0.08, "#fbf6e8");
    grad.addColorStop(0.92, "#fbf6e8");
    grad.addColorStop(1, "#e2d6ba");
    g.fillStyle = grad;
    g.fillRect(x0, 0, w, H);
    g.strokeStyle = "rgba(90, 120, 170, 0.55)";
    g.lineWidth = 2;
    for (let y = 70; y < H - 20; y += 34) {
      g.beginPath();
      g.moveTo(x0 + 20, y);
      g.lineTo(x0 + w - 16, y);
      g.stroke();
    }
    g.strokeStyle = "rgba(200, 40, 50, 0.7)";
    g.beginPath();
    g.moveTo(x0 + 70, 0);
    g.lineTo(x0 + 70, H);
    g.stroke();
    g.fillStyle = "#2a2730";
    g.font = "bold 26px Georgia, 'Times New Roman', serif";
    let q = 1;
    for (let y = 104; y < H - 40; y += 34 * 4) {
      g.fillText(`${q++}.`, x0 + 22, y);
      // Writing: loops of graphite along the next lines.
      for (let line = 0; line < 3; line++) {
        const yy = y + line * 34 - 8;
        let x = x0 + 86;
        const end = x0 + w - 40 - rand() * 120;
        g.strokeStyle = "rgba(40, 38, 48, 0.8)";
        g.lineWidth = 2.2;
        g.beginPath();
        g.moveTo(x, yy);
        while (x < end) {
          const step = 10 + rand() * 14;
          g.quadraticCurveTo(x + step * 0.5, yy - 10 - rand() * 10, x + step, yy - rand() * 3);
          x += step;
          if (rand() < 0.12) {
            x += 14;
            g.moveTo(x, yy);
          }
        }
        g.stroke();
      }
      // A red tick or a cross in the margin.
      g.strokeStyle = "rgba(200, 20, 30, 0.9)";
      g.lineWidth = 5;
      g.beginPath();
      if (rand() < 0.5) {
        g.moveTo(x0 + w - 70, y + 10);
        g.lineTo(x0 + w - 58, y + 24);
        g.lineTo(x0 + w - 34, y - 6);
      } else {
        g.moveTo(x0 + w - 66, y - 8);
        g.lineTo(x0 + w - 40, y + 20);
        g.moveTo(x0 + w - 40, y - 8);
        g.lineTo(x0 + w - 66, y + 20);
      }
      g.stroke();
    }
    // A grade circled in red at the head of the sheet.
    g.strokeStyle = "rgba(200, 20, 30, 0.95)";
    g.lineWidth = 5;
    g.beginPath();
    g.ellipse(x0 + w - 70, 34, 26, 22, -0.2, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "rgba(200, 20, 30, 0.95)";
    g.font = "bold 34px Georgia, serif";
    g.fillText("F", x0 + w - 81, 46);
  };
  sheet(0, 512);
  // The scroll: parchment, faintly ruled; the face is drawn over it in ink.
  const grad = g.createLinearGradient(512, 0, 1024, 0);
  grad.addColorStop(0, "#d9cba8");
  grad.addColorStop(0.18, "#f3ead3");
  grad.addColorStop(0.5, "#fbf5e6");
  grad.addColorStop(0.82, "#f3ead3");
  grad.addColorStop(1, "#d9cba8");
  g.fillStyle = grad;
  g.fillRect(512, 0, 512, H);
  g.strokeStyle = "rgba(120, 110, 90, 0.35)";
  g.lineWidth = 2;
  for (let y = 30; y < H; y += 42) {
    g.beginPath();
    g.moveTo(512, y);
    g.lineTo(1024, y);
    g.stroke();
  }
  // Foxing: small stains of age.
  for (let k = 0; k < 60; k++) {
    g.fillStyle = `rgba(150, 110, 60, ${0.04 + rand() * 0.08})`;
    g.beginPath();
    g.arc(rand() * W, rand() * H, 4 + rand() * 22, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new CanvasTexture(cv);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const SHEET_UV: [number, number, number, number] = [0, 0, 0.5, 1];
const SCROLL_UV: [number, number, number, number] = [0.5, 0, 1, 1];

/**
 * A sheet of paper, hanging from its top edge: curled at its sides and its foot, and with `folds`
 * soft folds down its length, deeper towards its foot (`fold` metres deep there).
 */
function sheetGeo(w: number, h: number, curl: number, roll: number, sw = 6, sh = 14, folds = 0, fold = 0): BufferGeometry {
  const g = new PlaneGeometry(w, h, sw, sh);
  const pos = g.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = x / w + 0.5;
    const v = y / h + 0.5;
    const side = Math.abs(u - 0.5) * 2;
    const pleat = folds ? fold * (0.35 + 0.65 * (1 - v)) * Math.sin(u * Math.PI * 2 * folds) : 0;
    pos.setZ(i, curl * Math.pow(side, 3) + roll * Math.pow(1 - v, 4) + 0.04 * Math.sin(v * 9 + u * 3) + pleat);
    pos.setY(i, y - roll * 0.25 * Math.pow(1 - v, 5));
  }
  g.computeVertexNormals();
  return g;
}

function paperGeometry(): BufferGeometry {
  const out: BufferGeometry[] = [];
  const rand = rng(23);
  const tint = (k: number) => [k, k * 0.985, k * 0.95];
  // A piece: its flutter (how far it moves, from nothing at its top), its own beat, and when it tears (2: never).
  const add = (geo: BufferGeometry, p: Place, flut: (x: number, y: number, z: number, u: number, v: number) => number[], shade = 1) =>
    out.push(bake(geo, { color: tint(shade), aFlut: flut }, p, true));

  // The cape: long exam sheets from the bar behind the shoulders, hung in an arc that wraps round
  // the back (the outer sheets come forward and turn in), each with soft folds; and over them a
  // shorter layer, sheets between sheets, so that it reads as a cape of papers, not a panel.
  const CAPE = 7;
  const arc = (s: number, out: number): { at: [number, number]; turn: number } => {
    // Round the frame's middle, from behind it: s from -1 to 1 across the cape.
    const a = s * 0.95;
    const r = 2.25 + out;
    return { at: [Math.sin(a) * r, CAPE_Z + 2.25 - Math.cos(a) * r], turn: a };
  };
  for (let layer = 0; layer < 2; layer++) {
    const n = layer ? CAPE - 1 : CAPE;
    for (let k = 0; k < n; k++) {
      const s = layer ? (k + 0.5 - (CAPE - 1) / 2) / ((CAPE - 1) / 2) : (k - (CAPE - 1) / 2) / ((CAPE - 1) / 2);
      const h = (layer ? 3.6 : 6.2) - Math.abs(s) * (layer ? 0.6 : 1.1) + (rand() - 0.5) * 0.3;
      const beat = rand() * 6.28;
      const tears = 0.15 + rand() * 0.35;
      const { at, turn } = arc(s, layer ? 0.12 : 0);
      add(
        sheetGeo(layer ? 1.0 : 1.25, h, -0.16, layer ? -0.2 : -0.35, 8, 14, layer ? 1 : 2, layer ? 0.07 : 0.12),
        { at: [at[0], CAPE_Y - h / 2 + 0.1 - layer * 0.05, at[1] - 0.06], rot: [-0.1 - layer * 0.05, Math.PI + turn, s * 0.06], uv: SHEET_UV, order: "YXZ" },
        (_x, _y, _z, _u, v) => [Math.pow(1 - v, 1.3) * (layer ? 0.8 : 1), beat, v > 0.6 ? 2 : tears + 0.9 * (v / 0.6)],
        layer ? 0.93 + (k % 2) * 0.04 : 0.97 + (k % 2) * 0.03,
      );
    }
  }
  // The ruff: a ring of small sheets round the neck, splayed out like a proctor's collar.
  const RUFF = 14;
  for (let k = 0; k < RUFF; k++) {
    const a = (k / RUFF) * Math.PI * 2;
    const beat = rand() * 6.28;
    add(
      sheetGeo(0.62, 0.95, 0.1, 0.12, 3, 4),
      { at: [Math.sin(a) * 0.95, 6.86, Math.cos(a) * 0.95], rot: [1.05, a, 0], uv: [0.05, 0.6, 0.45, 0.95], order: "YXZ" },
      (_x, _y, _z, _u, v) => [0.15 * (1 - v), beat, 2],
      k % 2 ? 1 : 0.94,
    );
  }
  // The skirt: tattered sheets hanging from under the plinth.
  const SKIRT = 12;
  for (let k = 0; k < SKIRT; k++) {
    const a = (k / SKIRT) * Math.PI * 2 + 0.13;
    const h = 1.1 + rand() * 0.35;
    const beat = rand() * 6.28;
    const tears = 0.3 + rand() * 0.4;
    add(
      sheetGeo(0.95, h, 0.12, 0.1, 3, 6),
      { at: [Math.sin(a) * 1.66, 0.66 - h / 2, Math.cos(a) * 1.66], rot: [-0.22, a, 0], uv: [0.02, 0.05, 0.48, 0.4], order: "YXZ" },
      (_x, _y, _z, _u, v) => [0.6 * Math.pow(1 - v, 1.2), beat, v > 0.5 ? 2 : tears + v],
      0.95,
    );
  }
  // The scroll: its paper wound round, its seam at the back, the face to the front.
  const scroll = new CylinderGeometry(HEAD_R, HEAD_R, HEAD_HI - HEAD_LO, 40, 4, true, Math.PI, Math.PI * 2);
  add(scroll, { at: [0, (HEAD_HI + HEAD_LO) / 2, 0], uv: SCROLL_UV }, () => [0, 0, 2]);
  // A loose leaf peeling off the scroll's side, curling out.
  add(
    sheetGeo(0.9, 1.7, 0.3, 0.3, 4, 8),
    { at: [-1.02, 8.1, -0.25], rot: [0, -Math.PI / 2 - 0.5, 0.1], uv: SHEET_UV, order: "YXZ" },
    (_x, _y, _z, _u, v) => [0.5 * (1 - v), 1.3, 2],
  );
  return mergeAll(out);
}

/** The grade tiles: bevelled slabs, a letter on each face, in a ring. */
function tileTexture(): CanvasTexture | undefined {
  if (typeof document === "undefined") return undefined;
  const S = 128;
  const cv = document.createElement("canvas");
  cv.width = S * 5;
  cv.height = S;
  const g = cv.getContext("2d")!;
  const tiles: [string, string, string][] = [
    ["A", "#4fe08a", "#1d7a45"],
    ["B", "#a6e35a", "#4f7d1d"],
    ["C", "#ffd23f", "#9a7a10"],
    ["D", "#ff9f1c", "#9a4f08"],
    ["F", "#ff3b3b", "#8a1010"],
  ];
  tiles.forEach(([letter, light, dark], k) => {
    const x = k * S;
    const grad = g.createLinearGradient(0, 0, 0, S);
    grad.addColorStop(0, light);
    grad.addColorStop(1, dark);
    g.fillStyle = grad;
    g.fillRect(x, 0, S, S);
    g.strokeStyle = "rgba(255, 255, 255, 0.75)";
    g.lineWidth = 6;
    g.strokeRect(x + 8, 8, S - 16, S - 16);
    // A gloss over the top half.
    g.fillStyle = "rgba(255, 255, 255, 0.18)";
    g.fillRect(x + 8, 8, S - 16, S / 2 - 8);
    g.fillStyle = "rgba(0, 0, 0, 0.35)";
    g.font = "bold 86px Georgia, 'Times New Roman', serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(letter, x + S / 2 + 3, S / 2 + 7);
    g.fillStyle = "#fffaf0";
    g.fillText(letter, x + S / 2, S / 2 + 4);
  });
  const tex = new CanvasTexture(cv);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

const TILES = 10;
const TILE_R = 4.5;
function tilesGeometry(): BufferGeometry {
  const out: BufferGeometry[] = [];
  for (let k = 0; k < TILES; k++) {
    const a = (k / TILES) * Math.PI * 2;
    const cell = k % 5;
    const g = new RoundedBoxGeometry(0.62, 0.76, 0.12, 2, 0.05);
    // Each face shows its letter; the edges take the tile's own colour from the middle of its cell.
    const uv = g.getAttribute("uv");
    const nrm = g.getAttribute("normal");
    for (let i = 0; i < uv.count; i++) {
      const front = Math.abs(nrm.getZ(i)) > 0.7;
      const u = front ? (nrm.getZ(i) > 0 ? uv.getX(i) : 1 - uv.getX(i)) : 0.5;
      uv.setXY(i, (cell + 0.06 + u * 0.88) / 5, front ? uv.getY(i) : 0.5);
    }
    out.push(bake(g, { aIdx: [k] }, { at: [Math.sin(a) * TILE_R, 0, Math.cos(a) * TILE_R], rot: [0, a, 0] }, true));
  }
  return mergeAll(out);
}

// ---------------------------------------------------------------------------------------------
// Materials: one set of uniforms for the whole figure
// ---------------------------------------------------------------------------------------------

/** What the shaders read each frame. Shared by every material of the figure. */
function makeUniforms() {
  return {
    uSqTint: { value: new Color(0, 0, 0) },
    /** Broken up (0-1) and a blow's flash (0-1). */
    uSqFx: { value: new Vector2(0, 0) },
    /**
     * Parts nearer the camera than `x` metres (over the ground, along the way it looks) are thinned
     * by `y` (0-1), so that the walker shows through; and where from and which way that is measured:
     * the camera's place east and south (three's x and z), and the way it looks over the ground.
     */
    uSqFade: { value: new Vector2(0, 0) },
    uSqFadeFrom: { value: new Vector4(0, 0, 0, 1) },
    uSqT: { value: 0 },
    /** The sand left above (its health), and how fast it runs. */
    uSqLevel: { value: 1 },
    uSqFlow: { value: 1 },
    /** The phase, eased (1-3), the paper's flutter, how far it has torn, and the glow. */
    uSqPhase: { value: 1 },
    uSqWind: { value: 0.1 },
    uSqTear: { value: 0 },
    uSqHot: { value: 0 },
    uSqGlow: { value: 1 },
    uSqBob: { value: 0.15 },
    /** How much of a stylised sky and ground the metal reflects, as no environment map may be there. */
    uSqEnv: { value: 0.6 },
  };
}
type Uniforms = ReturnType<typeof makeUniforms>;

const FX_PARS = /* glsl */ `
uniform vec3 uSqTint;
uniform vec2 uSqFx;
uniform vec2 uSqFade;
uniform vec4 uSqFadeFrom;
uniform float uSqT;
varying vec3 vSqLocal;
varying float vSqDepth;
float sqHash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float sqBayer(vec2 p) {
  ivec2 q = ivec2(mod(p, 4.0));
  int i = q.x + q.y * 4;
  float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
  return (m[i] + 0.5) / 16.0;
}
`;
/** Thinned where nearer than the walker; broken up as it dies, the edges of the gaps alight. */
const FX_CLIP = /* glsl */ `
#include <clipping_planes_fragment>
if (uSqFade.y > 0.0 && vSqDepth < uSqFade.x && sqBayer(gl_FragCoord.xy) < uSqFade.y) discard;
float sqGap = 0.0;
if (uSqFx.x > 0.0) {
  float n = 0.7 * sqHash(floor(vSqLocal * 5.0)) + 0.3 * sqHash(floor(vSqLocal * 15.0));
  if (n < uSqFx.x) discard;
  sqGap = 1.0 - smoothstep(uSqFx.x, uSqFx.x + 0.07, n);
}
`;
const FX_LIT = /* glsl */ `
#include <emissivemap_fragment>
float sqNV = abs(dot(normal, normalize(vViewPosition)));
float sqRim = 1.0 - sqNV;
totalEmissiveRadiance += uSqTint * (0.03 + 2.0 * smoothstep(0.62, 0.97, sqRim)) + uSqTint * sqGap * 3.0;
totalEmissiveRadiance += vec3(1.0, 0.97, 0.9) * uSqFx.y * (0.05 + 1.3 * sqRim * sqRim * sqRim);
`;

function inject(s: WebGLProgramParametersWithUniforms, u: Uniforms, lit: boolean, extra: { vPars?: string; vMain?: string; fPars?: string; fLit?: string; fColor?: string; fAlpha?: string } = {}): void {
  Object.assign(s.uniforms, u);
  s.vertexShader = FX_PARS + (extra.vPars ?? "") + s.vertexShader;
  s.vertexShader = s.vertexShader
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvSqLocal = position;\n" + (extra.vMain ?? ""))
    .replace("#include <project_vertex>", "#include <project_vertex>\nvSqDepth = dot((modelMatrix * vec4(transformed, 1.0)).xz - uSqFadeFrom.xy, uSqFadeFrom.zw);");
  s.fragmentShader = FX_PARS + (extra.fPars ?? "") + s.fragmentShader;
  s.fragmentShader = s.fragmentShader.replace("#include <clipping_planes_fragment>", FX_CLIP);
  if (extra.fColor) s.fragmentShader = s.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n" + extra.fColor);
  if (lit) s.fragmentShader = s.fragmentShader.replace("#include <emissivemap_fragment>", FX_LIT + (extra.fLit ?? ""));
  else s.fragmentShader = s.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb += uSqTint * 0.1 + uSqTint * sqGap * 2.0 + vec3(uSqFx.y * 0.4);");
  if (extra.fAlpha) s.fragmentShader = s.fragmentShader.replace("#include <opaque_fragment>", extra.fAlpha + "\n#include <opaque_fragment>");
}

/** The opaque material: colour, metalness, roughness and lacquer in each vertex; metal shows a stylised sky. */
function solidMaterial(u: Uniforms): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  m.onBeforeCompile = (s) =>
    inject(s, u, true, {
      vPars: "attribute vec3 aSurf;\nvarying vec3 vSurf;\n",
      vMain: "vSurf = aSurf;\n",
      fPars: "uniform float uSqEnv;\nvarying vec3 vSurf;\n",
      fLit: /* glsl */ `
vec3 sqV = normalize(vViewPosition);
vec3 sqR = reflect(-sqV, normal);
vec3 sqUp = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
float sqH = dot(sqR, sqUp);
vec3 sqEnv = mix(vec3(0.16, 0.13, 0.1), vec3(0.95, 0.93, 0.88), smoothstep(-0.2, 0.3, sqH)) + vec3(1.0, 0.95, 0.85) * pow(max(0.0, sqH), 10.0) * 1.2;
totalEmissiveRadiance += diffuseColor.rgb * sqEnv * vSurf.x * uSqEnv;
totalEmissiveRadiance += vSurf.z * pow(sqRim, 4.0) * vec3(0.5, 0.52, 0.56) * uSqEnv;
totalEmissiveRadiance += diffuseColor.rgb * 0.08 * (1.0 - vSurf.x);
`,
    });
  m.onBeforeCompile = wrapSurf(m.onBeforeCompile);
  m.customProgramCacheKey = () => "sq-boss-solid-1";
  return m;
}
/** Metalness and roughness from the vertex, in place of the material's own. */
function wrapSurf(f: MeshStandardMaterial["onBeforeCompile"]): MeshStandardMaterial["onBeforeCompile"] {
  return (s, r) => {
    f(s, r);
    s.fragmentShader = s.fragmentShader
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = vSurf.x;")
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = vSurf.y;");
  };
}

function glassMaterial(u: Uniforms): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: 0xcfe8ff, roughness: 0.06, metalness: 0, transparent: true, depthWrite: false, side: DoubleSide });
  m.onBeforeCompile = (s) =>
    inject(s, u, true, {
      fLit: /* glsl */ `
float sqS = smoothstep(0.09, 0.0, abs(normal.x + 0.52)) + 0.6 * smoothstep(0.035, 0.0, abs(normal.x - 0.36));
totalEmissiveRadiance += vec3(1.0, 0.99, 0.96) * sqS * 1.0 + vec3(0.62, 0.82, 1.0) * pow(sqRim, 2.5) * 0.6;
`,
      fAlpha: "diffuseColor.a = clamp(mix(0.05, 0.62, pow(sqRim, 2.0)) + sqS * 0.7, 0.0, 0.9) * (gl_FrontFacing ? 1.0 : 0.4);",
    });
  m.customProgramCacheKey = () => "sq-boss-glass-1";
  return m;
}

function sandMaterial(u: Uniforms): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  m.onBeforeCompile = (s) =>
    inject(s, u, true, {
      vPars: `attribute float aPart;\nuniform float uSqLevel;\nuniform float uSqFlow;\nvarying float vPart;\nvarying float vSY;\n${BULB_GLSL}\n`,
      vMain: /* glsl */ `
vPart = aPart;
float lvl = clamp(uSqLevel, 0.0, 1.0);
float heap = ${BOT.toFixed(3)} + 0.03 + 1.52 * (0.1 + 0.9 * (1.0 - lvl));
if (aPart < 0.5) transformed.y = ${NECK.toFixed(3)} + (transformed.y - ${NECK.toFixed(3)}) * max(lvl, 0.015);
else if (aPart < 1.5) transformed.y = ${BOT.toFixed(3)} + 0.03 + (transformed.y - ${BOT.toFixed(3)} - 0.03) * (0.1 + 0.9 * (1.0 - lvl));
else {
  float s = (${NECK.toFixed(3)} - transformed.y) / ${(NECK - BOT).toFixed(3)};
  transformed.y = mix(${NECK.toFixed(3)}, heap - 0.2, clamp(s, 0.0, 1.0));
  transformed.xz *= (0.5 + 0.28 * uSqFlow) * (lvl > 0.005 ? 1.0 : 0.0);
}
if (aPart < 1.5) {
  float rr = length(transformed.xz);
  float rm = sqBulbR(transformed.y) - 0.05;
  if (rr > rm) transformed.xz *= max(rm, 0.0) / rr;
}
vSY = transformed.y;
`,
      fPars: "uniform float uSqFlow;\nvarying float vPart;\nvarying float vSY;\n",
      fColor: "diffuseColor.rgb *= 0.86 + 0.28 * sqHash(floor(vSqLocal * 38.0));",
      fLit: /* glsl */ `
float sqRun = vPart > 1.5 ? 0.55 + 0.45 * sin(vSY * 16.0 + uSqT * uSqFlow * 9.0) : 0.0;
totalEmissiveRadiance += diffuseColor.rgb * (0.3 + 0.12 * uSqFlow + sqRun);
`,
    });
  m.customProgramCacheKey = () => "sq-boss-sand-1";
  return m;
}

function paperMaterial(u: Uniforms, map?: CanvasTexture): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ vertexColors: true, map: map ?? null, roughness: 0.88, metalness: 0, side: DoubleSide });
  m.onBeforeCompile = (s) =>
    inject(s, u, true, {
      vPars: "attribute vec3 aFlut;\nuniform float uSqWind;\nvarying float vTear;\nvarying vec2 vSqUv;\n",
      vMain: /* glsl */ `
float sqW = aFlut.x * uSqWind;
transformed.z += sin(uSqT * 3.3 + aFlut.y + position.y * 1.4) * sqW;
transformed.x += sin(uSqT * 2.1 + aFlut.y * 1.7 + position.y * 0.8) * sqW * 0.35;
transformed.y += sin(uSqT * 2.7 + aFlut.y) * sqW * 0.15;
vTear = aFlut.z;
vSqUv = uv;
`,
      fPars: "uniform float uSqTear;\nuniform float uSqHot;\nvarying float vTear;\nvarying vec2 vSqUv;\nfloat sqEdge = 0.0;\n",
      fColor: /* glsl */ `
if (vTear < 1.5) {
  float j = (sqHash(vec3(floor(vSqUv * vec2(40.0, 80.0)), 3.0)) - 0.5) * 0.1;
  float cut = uSqTear - vTear + j;
  if (cut > 0.0) discard;
  sqEdge = smoothstep(-0.05, 0.0, cut);
  diffuseColor.rgb *= 1.0 - 0.45 * sqEdge;
}
`,
      fLit: "totalEmissiveRadiance += vec3(1.0, 0.42, 0.08) * sqEdge * uSqHot;\ntotalEmissiveRadiance += diffuseColor.rgb * 0.1;\n",
    });
  m.customProgramCacheKey = () => "sq-boss-paper-1";
  return m;
}

function glowMaterial(u: Uniforms): MeshBasicMaterial {
  const m = new MeshBasicMaterial({ vertexColors: true });
  m.onBeforeCompile = (s) =>
    inject(s, u, false, {
      vPars: "attribute float aPhase;\nuniform float uSqPhase;\nvarying float vShow;\n",
      vMain: "vShow = aPhase <= uSqPhase + 0.01 ? 1.0 : 0.0;\nif (vShow < 0.5) transformed = vec3(0.0);\n",
      fPars: "uniform float uSqGlow;\nvarying float vShow;\n",
      fColor: "if (vShow < 0.5) discard;\ndiffuseColor.rgb *= uSqGlow;",
    });
  m.customProgramCacheKey = () => "sq-boss-glow-1";
  return m;
}

function tileMaterial(u: Uniforms, map?: CanvasTexture): MeshBasicMaterial {
  const m = new MeshBasicMaterial({ map: map ?? null, color: map ? 0xffffff : 0xffd23f });
  m.onBeforeCompile = (s) =>
    inject(s, u, false, {
      vPars: "attribute float aIdx;\nuniform float uSqBob;\n",
      vMain: "transformed.y += sin(uSqT * 2.2 + aIdx * 1.9) * uSqBob;\n",
      fColor: "diffuseColor.rgb *= 1.15;",
    });
  m.customProgramCacheKey = () => "sq-boss-tiles-1";
  return m;
}

// ---------------------------------------------------------------------------------------------
// The figure
// ---------------------------------------------------------------------------------------------

/** What the figure is doing this frame. */
export interface BossPose {
  /** Seconds, for what moves by itself; and since the last frame. */
  t: number;
  dt: number;
  /** Its phase, 1 to 3, and the share of its health left. */
  phase: number;
  health: number;
  /** The glow at its edges (a warning, its rage), how far it has broken up, and a blow's flash. */
  tint: { r: number; g: number; b: number };
  dissolve: number;
  flash: number;
  /** Radians each arm swings forward (negative) or back at the shoulder, and bends forward (negative) at the elbow; the ring of tiles turned. */
  armL: number;
  armR: number;
  elbowL: number;
  elbowR: number;
  halo: number;
  /**
   * Metres from the camera within which its parts are thinned, over the ground along the way it
   * looks, and how much (0-1); the camera's place (three's x and z) and that way (a unit vector).
   */
  fadeNear: number;
  fade: number;
  fadeFrom: [number, number, number, number];
  /** Seconds into its roar at a change of phase (0-1), or negative. */
  roar: number;
}

export function bossPose(): BossPose {
  return { t: 0, dt: 0, phase: 1, health: 1, tint: { r: 0, g: 0, b: 0 }, dissolve: 0, flash: 0, armL: 0, armR: 0, elbowL: -0.35, elbowR: -0.35, halo: 0, fadeNear: 0, fade: 0, fadeFrom: [0, 0, 0, 1], roar: -1 };
}

/** The Final Exam as drawn: one group, placed by a matrix each frame it is out. */
export class BossView {
  readonly root = new Group();
  readonly height = BOSS_HEIGHT;
  readonly float = BOSS_FLOAT;
  private u = makeUniforms();
  private mats: Material[];
  private face: Mesh;
  private armL = new Group();
  private armR = new Group();
  private elbowL = new Group();
  private elbowR = new Group();
  private tiles: Mesh;
  private halo = new Group();
  private placed = false;
  /** The expression shown, eased: how stern, how furious. */
  private mood = [0, 0];
  private phaseShown = 1;
  private textures: CanvasTexture[] = [];

  constructor() {
    const paperTex = paperTexture();
    const tileTex = tileTexture();
    for (const t of [paperTex, tileTex]) if (t) this.textures.push(t);
    const solid = solidMaterial(this.u);
    const glass = glassMaterial(this.u);
    const sand = sandMaterial(this.u);
    const paper = paperMaterial(this.u, paperTex);
    const glow = glowMaterial(this.u);
    const tiles = tileMaterial(this.u, tileTex);
    this.mats = [solid, glass, sand, paper, glow, tiles];
    const mesh = (g: BufferGeometry, m: Material, order = 0) => {
      const o = new Mesh(g, m);
      o.frustumCulled = false;
      o.castShadow = o.receiveShadow = false;
      o.renderOrder = order;
      // Out of the walker view's ambient occlusion (street/effects.ts): that pass draws the scene
      // in a material of its own, without this figure's thinning, tearing and flutter, and would
      // shade the ground from a shape that is not there. It also halves the figure's draws.
      o.userData.noAO = true;
      return o;
    };
    this.root.matrixAutoUpdate = false;
    this.root.visible = false;
    this.root.add(mesh(bodyGeometry(), solid), mesh(sandGeometry(), sand), mesh(paperGeometry(), paper), mesh(glowGeometry(), glow), mesh(glassGeometry(), glass, 1));
    this.face = mesh(faceGeometry(), solid);
    this.face.morphTargetInfluences = [0, 0];
    this.root.add(this.face);
    for (const [g, e, side] of [
      [this.armL, this.elbowL, -1],
      [this.armR, this.elbowR, 1],
    ] as const) {
      const arm = armGeometry(side);
      g.position.set(side * SHOULDER[0], SHOULDER[1], SHOULDER[2]);
      e.position.set(0, -ELBOW, 0);
      g.add(mesh(arm.upper, solid), e);
      e.add(mesh(arm.lower, solid));
      this.root.add(g);
    }
    this.halo.position.set(...HALO_AT);
    this.halo.rotation.order = "ZXY";
    this.tiles = mesh(tilesGeometry(), tiles);
    this.halo.add(this.tiles);
    this.root.add(this.halo);
    this.root.userData.noPick = true;
  }

  /** Draw calls the figure takes. */
  get draws(): number {
    let n = 0;
    this.root.traverse((o) => {
      if ((o as Mesh).isMesh) n++;
    });
    return n;
  }

  begin(): void {
    this.placed = false;
  }

  /** Places the figure by `base` (its feet, facing +z) and poses it. */
  place(base: Matrix4, p: BossPose): void {
    this.placed = true;
    this.root.visible = true;
    this.root.matrix.copy(base);
    const u = this.u;
    const dt = Math.max(0, Math.min(0.1, p.dt));
    // The phase shown eases in, so that the sand, the tears and the face change over a moment.
    this.phaseShown += (p.phase - this.phaseShown) * (dt > 0 ? 1 - Math.exp(-dt * 3) : 1);
    if (Math.abs(p.phase - this.phaseShown) < 0.01) this.phaseShown = p.phase;
    const ph = this.phaseShown;
    const roar = p.roar >= 0 ? Math.sin(Math.PI * Math.min(1, p.roar)) : 0;
    u.uSqT.value = p.t;
    u.uSqPhase.value = p.phase;
    u.uSqTint.value.setRGB(p.tint.r, p.tint.g, p.tint.b);
    u.uSqFx.value.set(p.dissolve, p.flash);
    u.uSqFade.value.set(p.fadeNear, p.fade);
    u.uSqFadeFrom.value.set(...p.fadeFrom);
    u.uSqLevel.value = Math.max(0, Math.min(1, p.health));
    u.uSqFlow.value = 1 + (ph - 1) * 1.25 + roar * 1.5;
    u.uSqWind.value = 0.08 + (ph - 1) * 0.08 + roar * 0.25;
    u.uSqTear.value = ph < 2 ? 0 : ph < 3 ? (ph - 1.5) * 0.7 : 0.35 + (ph - 2) * 0.5;
    u.uSqHot.value = Math.max(0, ph - 2) * 2.2 + roar * 1.5;
    u.uSqGlow.value = 0.8 + (ph - 1) * 0.35 + roar * 0.9 + (ph > 2.5 ? 0.15 * Math.sin(p.t * 9) : 0);
    u.uSqBob.value = 0.14 + (ph - 1) * 0.1;
    // The face: calm in the first phase, stern in the second, furious in the last and in a roar.
    const want0 = p.phase === 2 && p.roar < 0 ? 1 : 0;
    const want1 = p.phase >= 3 || p.roar >= 0 ? 1 : 0;
    const k = dt > 0 ? 1 - Math.exp(-dt * 6) : 1;
    this.mood[0]! += (want0 - this.mood[0]!) * k;
    this.mood[1]! += (want1 - this.mood[1]!) * k;
    const inf = this.face.morphTargetInfluences!;
    inf[0] = this.mood[0]! * (1 - this.mood[1]!);
    inf[1] = this.mood[1]!;
    this.armL.rotation.set(p.armL, 0, -0.16);
    this.armR.rotation.set(p.armR, 0, 0.16);
    this.elbowL.rotation.set(p.elbowL, 0, 0.06);
    this.elbowR.rotation.set(p.elbowR, 0, -0.06);
    this.halo.rotation.set(0.22, p.halo, 0.12);
    this.root.updateMatrixWorld(true);
  }

  /** Where the tip of an arm's nib is now, in the world: for the ink that drips. */
  nib(side: -1 | 1, out: Vector3): Vector3 {
    const arm = side < 0 ? this.elbowL : this.elbowR;
    return out.set(0, -3.2, 0).applyMatrix4(arm.matrixWorld);
  }

  end(): void {
    if (!this.placed) this.root.visible = false;
  }

  hide(): void {
    this.placed = false;
    this.root.visible = false;
  }

  dispose(): void {
    this.root.traverse((o) => {
      if ((o as Mesh).isMesh) (o as Mesh).geometry.dispose();
    });
    for (const m of this.mats) m.dispose();
    for (const t of this.textures) t.dispose();
  }
}
