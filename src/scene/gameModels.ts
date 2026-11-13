// Study Quest's villains and pick-ups, built from code: boxes, spheres, cones and tori merged into one
// geometry a kind, each part coloured in its vertices, so that a whole crowd of one kind is drawn in
// two or three calls. All of them are made up, and look it: toys and cartoon monsters for study
// troubles, never a person, a course or anything on the campus. Each model stands on y = 0 and faces +z.
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  IcosahedronGeometry,
  LatheGeometry,
  Matrix4,
  OctahedronGeometry,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { FoeKind } from "../shared/game.ts";

type V3 = [number, number, number];

/** One primitive of a model: its shape, colour, and where it stands. */
interface Piece {
  geo: BufferGeometry;
  color: number;
  at?: V3;
  rot?: V3;
  scale?: V3;
}

const tmpM = new Matrix4();
const tmpQ = new Quaternion();
const tmpE = new Euler();
const tmpC = new Color();

/** Merges pieces into one geometry with a colour in each vertex (positions and normals only). */
export function merge(pieces: Piece[]): BufferGeometry {
  const list = pieces.map((p) => {
    let g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    g.deleteAttribute("uv");
    tmpE.set(...(p.rot ?? [0, 0, 0]));
    tmpQ.setFromEuler(tmpE);
    tmpM.compose(new Vector3(...(p.at ?? [0, 0, 0])), tmpQ, new Vector3(...(p.scale ?? [1, 1, 1])));
    g.applyMatrix4(tmpM);
    const n = g.getAttribute("position").count;
    const colors = new Float32Array(n * 3);
    tmpC.setHex(p.color);
    for (let i = 0; i < n; i++) colors.set([tmpC.r, tmpC.g, tmpC.b], i * 3);
    g.setAttribute("color", new BufferAttribute(colors, 3));
    if (p.geo !== g) p.geo.dispose();
    return g;
  });
  const out = mergeGeometries(list, false)!;
  for (const g of list) g.dispose();
  out.computeBoundingSphere();
  return out;
}

const box = (w: number, h: number, d: number) => new BoxGeometry(w, h, d);
const sph = (r: number, w = 14, h = 10) => new SphereGeometry(r, w, h);
const half = (r: number) => new SphereGeometry(r, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2);
const cyl = (top: number, bottom: number, h: number, seg = 14) => new CylinderGeometry(top, bottom, h, seg);
const cone = (r: number, h: number, seg = 10) => new ConeGeometry(r, h, seg);
const torus = (r: number, t: number, seg = 28) => new TorusGeometry(r, t, 6, seg);
const ico = (r: number, d = 0) => new IcosahedronGeometry(r, d);
const octa = (r: number) => new OctahedronGeometry(r, 0);

/** A model: what is lit (`body`), what glows (`glow`), and parts that move on their own. */
export interface Model {
  body: BufferGeometry;
  glow: BufferGeometry;
  /** Moving parts: each its own geometry, turned about its pivot by `anim`. */
  parts: { name: string; geo: BufferGeometry; glow: boolean; pivot: V3 }[];
  /** Metres from the ground to the top of its head, for its name plate. */
  height: number;
  /** Metres over the ground that it floats. */
  float: number;
}

// The palette: the project's own toy colours, none of them a university's.
const RED = 0xd8262e;
const RED_DARK = 0x7a1016;
const CHROME = 0xc8ccd4;
const INK = 0x16121c;
const CREAM = 0xfff4dc;

// ---------------------------------------------------------------------------------------------
// The DDL: the old Deadline, grown into a red alarm-clock brute with fists, boots and a key in its back.
// ---------------------------------------------------------------------------------------------
function ddl(): Model {
  const y = 2.6; // the middle of the face
  const body: Piece[] = [
    // The drum and its chrome rim.
    { geo: cyl(1.55, 1.55, 1.0, 36), color: RED, at: [0, y, 0], rot: [Math.PI / 2, 0, 0] },
    { geo: torus(1.55, 0.16, 36), color: CHROME, at: [0, y, 0.5] },
    { geo: torus(1.55, 0.12, 36), color: RED_DARK, at: [0, y, -0.5] },
    // The face, and its twelve marks.
    { geo: cyl(1.36, 1.36, 0.06, 36), color: CREAM, at: [0, y, 0.5], rot: [Math.PI / 2, 0, 0] },
    // Bells, their caps and the hammer between them, like horns.
    { geo: half(0.62), color: RED, at: [-1.05, y + 1.35, 0], rot: [0, 0, 0.62] },
    { geo: half(0.62), color: RED, at: [1.05, y + 1.35, 0], rot: [0, 0, -0.62] },
    { geo: sph(0.14), color: CHROME, at: [-1.38, y + 1.82, 0] },
    { geo: sph(0.14), color: CHROME, at: [1.38, y + 1.82, 0] },
    { geo: box(0.14, 0.7, 0.14), color: INK, at: [0, y + 1.75, 0] },
    { geo: box(0.5, 0.16, 0.2), color: CHROME, at: [0, y + 2.1, 0] },
    // A fanged mouth under the hands.
    { geo: box(1.1, 0.34, 0.06), color: INK, at: [0, y - 0.72, 0.54] },
    { geo: cone(0.09, 0.22, 4), color: CREAM, at: [-0.36, y - 0.62, 0.58], rot: [Math.PI, 0, 0] },
    { geo: cone(0.09, 0.22, 4), color: CREAM, at: [-0.12, y - 0.62, 0.58], rot: [Math.PI, 0, 0] },
    { geo: cone(0.09, 0.22, 4), color: CREAM, at: [0.12, y - 0.62, 0.58], rot: [Math.PI, 0, 0] },
    { geo: cone(0.09, 0.22, 4), color: CREAM, at: [0.36, y - 0.62, 0.58], rot: [Math.PI, 0, 0] },
    // Angry brows.
    { geo: box(0.7, 0.16, 0.08), color: INK, at: [-0.5, y + 0.78, 0.56], rot: [0, 0, -0.45] },
    { geo: box(0.7, 0.16, 0.08), color: INK, at: [0.5, y + 0.78, 0.56], rot: [0, 0, 0.45] },
    // Legs and boots.
    { geo: cyl(0.2, 0.24, 1.2), color: INK, at: [-0.7, 0.85, 0], rot: [0, 0, -0.18] },
    { geo: cyl(0.2, 0.24, 1.2), color: INK, at: [0.7, 0.85, 0], rot: [0, 0, 0.18] },
    { geo: box(0.62, 0.36, 0.9), color: RED_DARK, at: [-0.85, 0.18, 0.15] },
    { geo: box(0.62, 0.36, 0.9), color: RED_DARK, at: [0.85, 0.18, 0.15] },
    // Arms out to the sides, and big white fists.
    { geo: cyl(0.14, 0.16, 1.3), color: INK, at: [-1.95, y - 0.2, 0.2], rot: [0.3, 0, 1.0] },
    { geo: cyl(0.14, 0.16, 1.3), color: INK, at: [1.95, y - 0.2, 0.2], rot: [0.3, 0, -1.0] },
    { geo: sph(0.42), color: CREAM, at: [-2.5, y - 0.6, 0.45] },
    { geo: sph(0.42), color: CREAM, at: [2.5, y - 0.6, 0.45] },
    { geo: torus(0.3, 0.09, 12), color: RED, at: [-2.35, y - 0.4, 0.4], rot: [0, 0.6, 0.6] },
    { geo: torus(0.3, 0.09, 12), color: RED, at: [2.35, y - 0.4, 0.4], rot: [0, -0.6, -0.6] },
  ];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const long = k % 3 === 0;
    body.push({ geo: box(long ? 0.1 : 0.06, long ? 0.26 : 0.14, 0.04), color: INK, at: [Math.sin(a) * 1.16, y + Math.cos(a) * 1.16, 0.55], rot: [0, 0, -a] });
  }
  const glow: Piece[] = [
    // Burning eyes.
    { geo: sph(0.2, 12, 8), color: 0xffe14a, at: [-0.48, y + 0.42, 0.56], scale: [1, 0.75, 0.5] },
    { geo: sph(0.2, 12, 8), color: 0xffe14a, at: [0.48, y + 0.42, 0.56], scale: [1, 0.75, 0.5] },
    { geo: sph(0.09, 8, 6), color: 0xff3b1f, at: [-0.48, y + 0.42, 0.66] },
    { geo: sph(0.09, 8, 6), color: 0xff3b1f, at: [0.48, y + 0.42, 0.66] },
    // The twelve o'clock mark, red hot.
    { geo: box(0.14, 0.3, 0.05), color: 0xff4630, at: [0, y + 1.16, 0.57] },
  ];
  const hand = (len: number, w: number) => {
    const g = box(w, len, 0.04);
    g.translate(0, len / 2, 0);
    return g;
  };
  const key = merge([
    { geo: box(0.14, 0.14, 0.7), color: CHROME, at: [0, 0, -0.35] },
    { geo: torus(0.34, 0.09, 16), color: CHROME, at: [-0.36, 0, -0.75], rot: [0, Math.PI / 2, 0] },
    { geo: torus(0.34, 0.09, 16), color: CHROME, at: [0.36, 0, -0.75], rot: [0, Math.PI / 2, 0] },
  ]);
  return {
    body: merge(body),
    glow: merge(glow),
    parts: [
      { name: "minute", geo: merge([{ geo: hand(1.02, 0.1), color: INK }]), glow: false, pivot: [0, y, 0.6] },
      { name: "hour", geo: merge([{ geo: hand(0.66, 0.16), color: 0xff3b1f }]), glow: true, pivot: [0, y, 0.62] },
      { name: "key", geo: key, glow: false, pivot: [0, y, -0.5] },
    ],
    height: 5.2,
    float: 0,
  };
}

// ---------------------------------------------------------------------------------------------
// Procrastination: a fat, sleepy lavender blob in a nightcap, hugging its pillow.
// ---------------------------------------------------------------------------------------------
function procrastination(): Model {
  const LAV = 0x9b86d8;
  const LAV_LIGHT = 0xcfc2f2;
  const body: Piece[] = [
    { geo: sph(1.2, 20, 14), color: LAV, at: [0, 1.05, 0], scale: [1.25, 0.9, 1.1] },
    { geo: sph(0.85, 18, 12), color: LAV_LIGHT, at: [0, 0.9, 0.48], scale: [1.05, 0.85, 0.6] },
    // Heavy eyelids over little eyes.
    { geo: half(0.24), color: LAV, at: [-0.42, 1.5, 1.0], rot: [0.35, 0, 0], scale: [1, 0.8, 1] },
    { geo: half(0.24), color: LAV, at: [0.42, 1.5, 1.0], rot: [0.35, 0, 0], scale: [1, 0.8, 1] },
    { geo: sph(0.22, 12, 8), color: 0xffffff, at: [-0.42, 1.47, 0.97] },
    { geo: sph(0.22, 12, 8), color: 0xffffff, at: [0.42, 1.47, 0.97] },
    { geo: sph(0.08, 8, 6), color: INK, at: [-0.42, 1.38, 1.17] },
    { geo: sph(0.08, 8, 6), color: INK, at: [0.42, 1.38, 1.17] },
    // A long yawn.
    { geo: sph(0.2, 12, 8), color: 0x3a1d3d, at: [0, 1.08, 1.12], scale: [1.1, 1.4, 0.5] },
    // The nightcap, its stripe and bobble.
    { geo: cone(0.62, 1.3, 16), color: 0x3fa7a0, at: [0.15, 2.3, -0.05], rot: [-0.25, 0, -0.55] },
    { geo: torus(0.6, 0.12, 20), color: 0xf2f2f2, at: [0, 1.85, 0], rot: [Math.PI / 2 - 0.2, 0, -0.1] },
    { geo: sph(0.2), color: 0xf2f2f2, at: [0.78, 2.72, -0.3] },
    // Stubby arms round a pillow.
    { geo: box(1.5, 0.55, 0.5), color: 0xf6efe0, at: [0, 0.75, 1.15], rot: [0.15, 0, 0] },
    { geo: sph(0.3), color: LAV, at: [-0.85, 0.85, 1.1] },
    { geo: sph(0.3), color: LAV, at: [0.85, 0.85, 1.1] },
    // Slippers.
    { geo: sph(0.32), color: 0xff8fb1, at: [-0.55, 0.12, 0.45], scale: [1, 0.5, 1.5] },
    { geo: sph(0.32), color: 0xff8fb1, at: [0.55, 0.12, 0.45], scale: [1, 0.5, 1.5] },
  ];
  // Z, Z, z over its head.
  const z = (s: number, x: number, y: number): Piece[] => [
    { geo: box(0.36 * s, 0.07 * s, 0.05), color: 0xbfd8ff, at: [x, y + 0.18 * s, 0] },
    { geo: box(0.36 * s, 0.07 * s, 0.05), color: 0xbfd8ff, at: [x, y - 0.18 * s, 0] },
    { geo: box(0.46 * s, 0.07 * s, 0.05), color: 0xbfd8ff, at: [x, y, 0], rot: [0, 0, 0.78] },
  ];
  const glow: Piece[] = [...z(1, 0.9, 2.9), ...z(0.7, 1.35, 3.4), ...z(0.5, 1.7, 3.8)];
  return { body: merge(body), glow: merge(glow), parts: [], height: 3.2, float: 0 };
}

// ---------------------------------------------------------------------------------------------
// Distraction: a phone with bat wings, its screen lit with eyes, a red badge always on.
// ---------------------------------------------------------------------------------------------
function distraction(): Model {
  const body: Piece[] = [
    { geo: box(0.62, 1.0, 0.1), color: 0x23242c, at: [0, 0, 0] },
    { geo: box(0.66, 0.06, 0.12), color: 0x4a4d5a, at: [0, 0.5, 0] },
    { geo: box(0.66, 0.06, 0.12), color: 0x4a4d5a, at: [0, -0.5, 0] },
    { geo: box(0.2, 0.03, 0.02), color: 0x0c0c10, at: [0, 0.42, 0.06] },
    // Little claws under it.
    { geo: cone(0.05, 0.22, 5), color: 0x4a4d5a, at: [-0.16, -0.6, 0], rot: [Math.PI, 0, 0] },
    { geo: cone(0.05, 0.22, 5), color: 0x4a4d5a, at: [0.16, -0.6, 0], rot: [Math.PI, 0, 0] },
  ];
  const glow: Piece[] = [
    { geo: box(0.54, 0.82, 0.02), color: 0x2fd7ff, at: [0, 0, 0.055] },
    // Eyes on the screen, hungry for a look.
    { geo: sph(0.09, 10, 8), color: 0xffffff, at: [-0.13, 0.12, 0.07], scale: [1, 1.3, 0.4] },
    { geo: sph(0.09, 10, 8), color: 0xffffff, at: [0.13, 0.12, 0.07], scale: [1, 1.3, 0.4] },
    { geo: sph(0.045, 8, 6), color: 0x10131c, at: [-0.13, 0.1, 0.1] },
    { geo: sph(0.045, 8, 6), color: 0x10131c, at: [0.13, 0.1, 0.1] },
    { geo: box(0.22, 0.04, 0.02), color: 0x10131c, at: [0, -0.12, 0.07], rot: [0, 0, 0.12] },
    // The badge that never clears.
    { geo: sph(0.14, 12, 8), color: 0xff2d55, at: [0.3, 0.5, 0.06] },
    { geo: box(0.03, 0.1, 0.02), color: 0xffffff, at: [0.3, 0.52, 0.2] },
  ];
  const wing = (side: number): BufferGeometry =>
    merge([
      { geo: box(0.7, 0.04, 0.42), color: 0x5b2a86, at: [side * 0.35, 0, 0], rot: [0, 0, 0] },
      { geo: cone(0.12, 0.3, 4), color: 0x5b2a86, at: [side * 0.62, -0.02, -0.25], rot: [Math.PI / 2, 0, 0] },
      { geo: cone(0.12, 0.3, 4), color: 0x5b2a86, at: [side * 0.3, -0.02, -0.25], rot: [Math.PI / 2, 0, 0] },
    ]);
  return {
    body: merge(body),
    glow: merge(glow),
    parts: [
      { name: "wingL", geo: wing(-1), glow: false, pivot: [-0.32, 0.18, -0.04] },
      { name: "wingR", geo: wing(1), glow: false, pivot: [0.32, 0.18, -0.04] },
    ],
    height: 1.0,
    float: 1.4,
  };
}

// ---------------------------------------------------------------------------------------------
// Plagiarism: a ghost in a sheet with two faces, one pasted over the other, slightly out of place.
// ---------------------------------------------------------------------------------------------
function plagiarism(): Model {
  const pts: Vector2[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    // From the crown (top) down to a hem that flares.
    const y = 2.1 - t * 2.0;
    const r = t < 0.3 ? Math.sin((t / 0.3) * (Math.PI / 2)) * 0.75 : 0.75 + (t - 0.3) * 0.5;
    pts.push(new Vector2(Math.max(0.001, r), y));
  }
  const SHEET = 0xe7ecff;
  const body: Piece[] = [
    { geo: new LatheGeometry(pts, 22), color: SHEET },
    // A ragged hem.
    ...Array.from({ length: 8 }, (_, k): Piece => {
      const a = (k / 8) * Math.PI * 2;
      return { geo: cone(0.18, 0.5, 6), color: SHEET, at: [Math.sin(a) * 0.95, 0.05, Math.cos(a) * 0.95], rot: [Math.PI, 0, 0] };
    }),
    // Sleeves reaching out.
    { geo: cone(0.22, 0.9, 8), color: SHEET, at: [-0.85, 1.15, 0.3], rot: [0.4, 0, 1.1] },
    { geo: cone(0.22, 0.9, 8), color: SHEET, at: [0.85, 1.15, 0.3], rot: [0.4, 0, -1.1] },
    // The pasted face: a second mask, pink, a little to the side and behind.
    { geo: sph(0.5, 16, 10), color: 0xffb3c7, at: [0.22, 1.62, 0.52], scale: [1, 1.15, 0.35] },
    // The front mask.
    { geo: sph(0.5, 16, 10), color: 0xffffff, at: [-0.05, 1.55, 0.66], scale: [1, 1.15, 0.35] },
    // Quote marks on its chest, its crime.
    { geo: box(0.08, 0.2, 0.05), color: 0x3b2a6b, at: [-0.15, 0.95, 0.83], rot: [0, 0, 0.3] },
    { geo: box(0.08, 0.2, 0.05), color: 0x3b2a6b, at: [0.0, 0.95, 0.85], rot: [0, 0, 0.3] },
  ];
  const glow: Piece[] = [
    { geo: sph(0.11, 10, 8), color: 0x8b5cff, at: [-0.22, 1.66, 0.84], scale: [1, 1.4, 0.5] },
    { geo: sph(0.11, 10, 8), color: 0x8b5cff, at: [0.12, 1.66, 0.84], scale: [1, 1.4, 0.5] },
    { geo: box(0.3, 0.05, 0.04), color: 0x8b5cff, at: [-0.05, 1.32, 0.83] },
    // The pasted face's eyes, a beat behind.
    { geo: sph(0.08, 8, 6), color: 0xff5fa2, at: [0.12, 1.76, 0.7] },
    { geo: sph(0.08, 8, 6), color: 0xff5fa2, at: [0.42, 1.76, 0.65] },
  ];
  return { body: merge(body), glow: merge(glow), parts: [], height: 2.5, float: 0.6 };
}

// ---------------------------------------------------------------------------------------------
// Exam Anxiety: a jittery spiked shade in tatters, wide white eyes, a racing heart that glows.
// ---------------------------------------------------------------------------------------------
function anxiety(): Model {
  const SHADE = 0x1f2340;
  const SHADE_2 = 0x323a66;
  const body: Piece[] = [
    { geo: cone(0.75, 1.9, 12), color: SHADE, at: [0, 1.05, 0], rot: [Math.PI, 0, 0] },
    { geo: ico(0.62, 1), color: SHADE_2, at: [0, 2.15, 0] },
  ];
  // Spikes round the head, and tatters below.
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    body.push({ geo: cone(0.12, 0.6, 5), color: SHADE, at: [Math.sin(a) * 0.62, 2.35 + (k % 2) * 0.2, Math.cos(a) * 0.5 - 0.1], rot: [Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9] });
  }
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + 0.3;
    body.push({ geo: cone(0.16, 0.9, 5), color: SHADE_2, at: [Math.sin(a) * 0.35, 0.1, Math.cos(a) * 0.35], rot: [Math.PI - Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4] });
  }
  // Thin arms clutching itself.
  body.push({ geo: cyl(0.07, 0.09, 1.0), color: SHADE_2, at: [-0.55, 1.6, 0.3], rot: [0.9, 0, 0.5] });
  body.push({ geo: cyl(0.07, 0.09, 1.0), color: SHADE_2, at: [0.55, 1.6, 0.3], rot: [0.9, 0, -0.5] });
  const glow: Piece[] = [
    { geo: sph(0.2, 12, 8), color: 0xf4f7ff, at: [-0.24, 2.2, 0.5], scale: [1, 1.3, 0.5] },
    { geo: sph(0.2, 12, 8), color: 0xf4f7ff, at: [0.24, 2.2, 0.5], scale: [1, 1.3, 0.5] },
    { geo: sph(0.06, 8, 6), color: 0x10131c, at: [-0.24, 2.18, 0.62] },
    { geo: sph(0.06, 8, 6), color: 0x10131c, at: [0.24, 2.18, 0.62] },
    // Sweat.
    { geo: sph(0.08, 8, 6), color: 0x7fd4ff, at: [0.55, 2.35, 0.35], scale: [1, 1.5, 1] },
    { geo: sph(0.06, 8, 6), color: 0x7fd4ff, at: [-0.6, 2.0, 0.3], scale: [1, 1.5, 1] },
  ];
  return {
    body: merge(body),
    glow: merge(glow),
    parts: [{ name: "heart", geo: merge([{ geo: octa(0.26), color: 0xff3d7f }]), glow: true, pivot: [0, 1.45, 0.42] }],
    height: 2.9,
    float: 0.7,
  };
}

// ---------------------------------------------------------------------------------------------
// The Final Exam, Proctor of the Last Hour: an hourglass titan in a cape of exam sheets, with
// shoulders of stacked books, a scroll for a head and one red grading eye, a crown of pens, two
// great red-pen arms, and grades circling it.
// ---------------------------------------------------------------------------------------------
function exam(): Model {
  const GLASS = 0x9fd6ff;
  const WOOD = 0x5a3a22;
  const PAPER = 0xf7f3e8;
  const body: Piece[] = [
    // The hourglass torso in its wooden frame.
    { geo: cone(1.6, 2.2, 20), color: GLASS, at: [0, 4.9, 0], rot: [Math.PI, 0, 0] },
    { geo: cone(1.6, 2.2, 20), color: GLASS, at: [0, 2.7, 0] },
    { geo: cyl(1.95, 1.95, 0.35, 24), color: WOOD, at: [0, 6.05, 0] },
    { geo: cyl(1.95, 1.95, 0.35, 24), color: WOOD, at: [0, 1.55, 0] },
    { geo: cyl(0.12, 0.12, 4.6, 8), color: WOOD, at: [1.7, 3.8, 0.6] },
    { geo: cyl(0.12, 0.12, 4.6, 8), color: WOOD, at: [-1.7, 3.8, 0.6] },
    { geo: cyl(0.12, 0.12, 4.6, 8), color: WOOD, at: [0, 3.8, -1.75] },
    // A pedestal of stacked books it floats over.
    { geo: box(2.8, 0.45, 1.9), color: 0x8a2be2, at: [0, 0.9, 0], rot: [0, 0.15, 0] },
    { geo: box(2.4, 0.4, 1.7), color: 0x2a9d8f, at: [0, 0.48, 0], rot: [0, -0.1, 0] },
    { geo: box(3.0, 0.4, 2.0), color: 0xe76f51, at: [0, 0.1, 0], rot: [0, 0.05, 0] },
    // Shoulders: book stacks.
    { geo: box(1.6, 0.5, 1.2), color: 0x264653, at: [-2.3, 6.45, 0], rot: [0, 0, 0.12] },
    { geo: box(1.4, 0.45, 1.1), color: 0xe9c46a, at: [-2.3, 6.92, 0], rot: [0, 0.2, 0.12] },
    { geo: box(1.6, 0.5, 1.2), color: 0x264653, at: [2.3, 6.45, 0], rot: [0, 0, -0.12] },
    { geo: box(1.4, 0.45, 1.1), color: 0xe9c46a, at: [2.3, 6.92, 0], rot: [0, -0.2, -0.12] },
    // Neck and the scroll head.
    { geo: cyl(0.45, 0.6, 0.6, 12), color: WOOD, at: [0, 6.5, 0] },
    { geo: cyl(1.05, 1.05, 2.3, 24), color: PAPER, at: [0, 7.7, 0] },
    { geo: cyl(1.15, 1.15, 0.22, 24), color: 0xd9cfb7, at: [0, 8.9, 0] },
    { geo: cyl(1.15, 1.15, 0.22, 24), color: 0xd9cfb7, at: [0, 6.5, 0] },
    // Writing lines on the head's face.
    ...[7.0, 7.3, 7.6, 8.35, 8.6].map((y): Piece => ({ geo: box(1.2, 0.05, 0.05), color: 0x8e8e9a, at: [0, y, 1.04] })),
    // A frown of red ink.
    { geo: box(0.9, 0.12, 0.06), color: 0xc1121f, at: [0, 7.05, 1.07], rot: [0, 0, 0.0] },
    // The crown of pencils.
    ...Array.from({ length: 7 }, (_, k): Piece => {
      const a = ((k - 3) / 3) * 0.9;
      return { geo: cyl(0.13, 0.13, 1.1, 6), color: 0xffc300, at: [Math.sin(a) * 0.8, 9.55, Math.cos(a) * 0.55], rot: [0, 0, -a * 0.6] };
    }),
    ...Array.from({ length: 7 }, (_, k): Piece => {
      const a = ((k - 3) / 3) * 0.9;
      return { geo: cone(0.13, 0.32, 6), color: 0x2b2b2b, at: [Math.sin(a) * 0.8 - Math.sin(-a * 0.6) * 0.7, 10.2, Math.cos(a) * 0.55], rot: [0, 0, -a * 0.6] };
    }),
    // The cape of exam sheets behind.
    ...Array.from({ length: 6 }, (_, k): Piece => ({ geo: box(1.1, 3.2, 0.04), color: k % 2 ? PAPER : 0xe9e2cf, at: [-2.2 + k * 0.88, 4.0 - Math.abs(k - 2.5) * 0.25, -1.4 - Math.abs(k - 2.5) * 0.12], rot: [0.18, (k - 2.5) * 0.12, (k - 2.5) * 0.05] })),
  ];
  const glow: Piece[] = [
    // The sand: falling through, heaped below.
    { geo: cone(1.2, 1.0, 20), color: 0xffb347, at: [0, 2.15, 0] },
    { geo: cone(0.9, 0.7, 20), color: 0xffb347, at: [0, 5.25, 0], rot: [Math.PI, 0, 0] },
    { geo: cyl(0.05, 0.05, 2.4, 6), color: 0xffd27a, at: [0, 3.8, 0] },
    // The grading eye.
    { geo: sph(0.42, 16, 12), color: 0xffffff, at: [0, 8.0, 1.02], scale: [1.2, 0.9, 0.4] },
    { geo: sph(0.22, 12, 8), color: 0xff1f3d, at: [0, 8.0, 1.16] },
  ];
  // Grades circling it: A, B, C, D, F as glowing tiles.
  const halo: Piece[] = [];
  const tiles = [0x5cf28a, 0x9be15d, 0xffd23f, 0xff9f1c, 0xff3b3b];
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    halo.push({ geo: box(0.55, 0.7, 0.06), color: tiles[k % 5]!, at: [Math.sin(a) * 3.6, 0, Math.cos(a) * 3.6], rot: [0, a, 0] });
  }
  // An arm: shoulder ball, a great red pen, its silver nib.
  const arm = (side: number) =>
    merge([
      { geo: sph(0.5), color: 0x264653 },
      { geo: cyl(0.32, 0.36, 3.6, 12), color: 0xc1121f, at: [side * 0.2, -1.9, 0.3], rot: [0.15, 0, side * 0.1] },
      { geo: cyl(0.36, 0.36, 0.5, 12), color: 0x1d1d1d, at: [side * 0.05, -0.45, 0.05], rot: [0.15, 0, side * 0.1] },
      { geo: box(0.12, 1.2, 0.18), color: CHROME, at: [side * 0.5, -1.0, 0.45] },
      { geo: cone(0.32, 0.9, 12), color: CHROME, at: [side * 0.42, -4.1, 0.62], rot: [Math.PI + 0.15, 0, side * 0.1] },
    ]);
  return {
    body: merge(body),
    glow: merge(glow),
    parts: [
      { name: "armL", geo: arm(-1), glow: false, pivot: [-3.0, 6.4, 0.2] },
      { name: "armR", geo: arm(1), glow: false, pivot: [3.0, 6.4, 0.2] },
      { name: "halo", geo: merge(halo), glow: true, pivot: [0, 4.2, 0] },
    ],
    height: 10.6,
    float: 0.5,
  };
}

export const MODELS: Record<FoeKind, () => Model> = { ddl, procrastination, distraction, plagiarism, anxiety, exam };

// ---------------------------------------------------------------------------------------------
// Pick-ups
// ---------------------------------------------------------------------------------------------

/** A book: the cover (coloured per book) and its pages. */
export function bookParts(): { cover: BufferGeometry; pages: BufferGeometry } {
  return {
    cover: merge([
      { geo: box(0.42, 1.7, 1.3), color: 0xffffff },
      { geo: box(0.46, 0.12, 1.32), color: 0xf0e6c8, at: [0, 0.5, 0] },
    ]),
    pages: merge([{ geo: box(0.3, 1.56, 1.26), color: 0xfffaf0, at: [0, 0, 0.07] }]),
  };
}

/** A take-away coffee, lid, sleeve and steam. */
export function coffeeGeo(): BufferGeometry {
  return merge([
    { geo: cyl(0.42, 0.32, 1.0, 16), color: 0xfafafa, at: [0, 0, 0] },
    { geo: cyl(0.45, 0.45, 0.14, 16), color: 0x3b2a20, at: [0, 0.56, 0] },
    { geo: cyl(0.3, 0.42, 0.12, 16), color: 0x3b2a20, at: [0, 0.68, 0] },
    { geo: cyl(0.405, 0.36, 0.4, 16), color: 0xffb454, at: [0, 0.02, 0] },
  ]);
}

/** A quest note: a rolled scroll tied with a red ribbon. */
export function noteGeo(): BufferGeometry {
  return merge([
    { geo: cyl(0.26, 0.26, 1.3, 14), color: 0xfff1cf, rot: [0, 0, Math.PI / 2] },
    { geo: cyl(0.3, 0.3, 0.06, 14), color: 0xe0c48e, at: [0.66, 0, 0], rot: [0, 0, Math.PI / 2] },
    { geo: cyl(0.3, 0.3, 0.06, 14), color: 0xe0c48e, at: [-0.66, 0, 0], rot: [0, 0, Math.PI / 2] },
    { geo: torus(0.28, 0.05, 14), color: 0xe63946, rot: [0, Math.PI / 2, 0] },
    { geo: box(0.08, 0.4, 0.04), color: 0xe63946, at: [0.05, -0.38, 0.22], rot: [0, 0, 0.3] },
  ]);
}
