// Realistic 3D assets for the open-campus game: lofted vehicles & commuter e-scooters, the
// "Slice Co." wood-fired pizza van, grounded pickups (<= 0.45 m), and articulated ~1.75 m
// human fallback figures (complementing cloned walker.glb skeletons from figureBuild.ts).
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DataTexture,
  EquirectangularReflectionMapping,
  Euler,
  Group,
  LatheGeometry,
  LinearFilter,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  RGBAFormat,
  SphereGeometry,
  SRGBColorSpace,
  UnsignedByteType,
  Vector2,
  Vector3,
  type Material,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { HUMAN_PALETTES } from "./figureBuild.ts";
import { VEHICLE_SPECS, type VehicleKind, type VehicleSpec } from "../shared/campusVehicles.ts";
import type { PropKind } from "../shared/openWorld.ts";
import { createSlopVehicleActor } from "./slopCars.ts";
import { createMechaActor } from "./mechaSuit.ts";

export { VEHICLE_SPECS, type PropKind, type VehicleKind, type VehicleSpec };

export type V3 = [number, number, number];

export type HumanRole = "pedestrian" | "giver" | "freeRider" | "debateRival" | "allNighter" | "security";
export type PickupKind = "pizza" | "cash" | "coffee" | "package";

/** One primitive of a merged vertex-coloured model: its shape, colour, and local transform. */
export interface Piece {
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
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    g.deleteAttribute("uv");
    if (!g.getAttribute("normal")) g.computeVertexNormals();
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
const rbox = (w: number, h: number, d: number, r = 0.02) => new RoundedBoxGeometry(w, h, d, 2, r);
const cyl = (top: number, bottom: number, h: number, seg = 14) => new CylinderGeometry(top, bottom, h, seg);
const sph = (r: number, w = 12, h = 10) => new SphereGeometry(r, w, h);

// ---------------------------------------------------------------------------------------------
// Grounded Realistic Pickups (<= 0.45 m, subtle low ground ring tint, no vertical lasers)
// ---------------------------------------------------------------------------------------------

export const PICKUP_COLORS: Record<PickupKind, number> = {
  pizza: 0xffa63b,
  cash: 0x52c77a,
  coffee: 0xd4a373,
  package: 0x57b8ff,
};

/** Corrugated cardboard square pizza box (~0.42 m), hinged open with grease-proof insert & slices. */
export function pizzaGeo(): BufferGeometry {
  const CARD = 0xb88b5a;
  const CARD_IN = 0xd9b98b;
  const PAPER = 0xf2ead7;
  const CRUST = 0xc67c32;
  const CHEESE = 0xf0ca68;
  const PEPP = 0xa82822;
  const BASIL = 0x3b6e3c;

  const base: Piece[] = [
    // Corrugated cardboard bottom tray.
    { geo: box(0.42, 0.045, 0.42), color: CARD, at: [0, 0.022, 0] },
    { geo: box(0.38, 0.008, 0.38), color: PAPER, at: [0, 0.046, 0] },
    // Two wood-fired pizza slices resting on the grease-proof sheet.
    { geo: cyl(0.14, 0.14, 0.016, 3), color: CHEESE, at: [-0.07, 0.056, 0.02], rot: [0, 0.35, 0] },
    { geo: cyl(0.13, 0.13, 0.016, 3), color: CHEESE, at: [0.08, 0.056, -0.02], rot: [0, -2.5, 0] },
    { geo: box(0.19, 0.022, 0.036), color: CRUST, at: [-0.11, 0.058, -0.07], rot: [0, 0.35, 0] },
    { geo: box(0.18, 0.022, 0.036), color: CRUST, at: [0.11, 0.058, 0.07], rot: [0, -2.5, 0] },
    // Pepperoni & basil.
    { geo: cyl(0.024, 0.024, 0.008, 8), color: PEPP, at: [-0.07, 0.066, 0.02] },
    { geo: cyl(0.022, 0.022, 0.008, 8), color: PEPP, at: [0.07, 0.066, -0.03] },
    { geo: sph(0.018, 6, 4), color: BASIL, at: [-0.03, 0.066, 0.04], scale: [1.4, 0.3, 0.8] },
    // Hinged lid propped slightly open (~24 deg).
    { geo: box(0.42, 0.016, 0.42), color: CARD, at: [0, 0.13, -0.02], rot: [-0.42, 0, 0] },
    { geo: box(0.38, 0.006, 0.38), color: CARD_IN, at: [0, 0.123, -0.02], rot: [-0.42, 0, 0] },
    { geo: box(0.18, 0.006, 0.12), color: 0xa63c2c, at: [0, 0.141, -0.02], rot: [-0.42, 0, 0] },
  ];
  return merge(base);
}

/** Bound matte dossier/package with wrap strap and brushed-metal USB clip (~0.38 m). */
export function packageGeo(): BufferGeometry {
  return merge([
    { geo: rbox(0.36, 0.09, 0.27, 0.012), color: 0x2a323d, at: [0, 0.045, 0] },
    { geo: box(0.37, 0.095, 0.055), color: 0x4b5563, at: [0, 0.046, 0] },
    { geo: box(0.14, 0.006, 0.09), color: 0xe6e0d2, at: [0.08, 0.092, 0.06] },
    // Matte USB drive clipped to strap.
    { geo: box(0.065, 0.018, 0.028), color: 0x171a20, at: [-0.08, 0.098, 0] },
    { geo: box(0.024, 0.014, 0.022), color: 0xc2c8d0, at: [-0.04, 0.098, 0] },
  ]);
}

/** Dark takeaway coffee cup with matte charcoal sleeve and dark sip lid (~0.22 m). */
export function coffeeGeo(): BufferGeometry {
  return merge([
    { geo: cyl(0.068, 0.052, 0.19, 14), color: 0xebe5da, at: [0, 0.095, 0] },
    { geo: cyl(0.066, 0.058, 0.09, 14), color: 0x3b3530, at: [0, 0.09, 0] },
    { geo: cyl(0.073, 0.073, 0.022, 14), color: 0x1b1d21, at: [0, 0.195, 0] },
    { geo: cyl(0.055, 0.071, 0.018, 14), color: 0x1b1d21, at: [0, 0.214, 0] },
  ]);
}

/** Crisp bankroll envelope / cash clip (~0.24 m). */
export function cashGeo(): BufferGeometry {
  return merge([
    { geo: box(0.24, 0.022, 0.12), color: 0x4f7f58, at: [0, 0.012, 0] },
    { geo: box(0.24, 0.022, 0.12), color: 0x5c9166, at: [0.008, 0.032, 0.005], rot: [0, 0.06, 0] },
    { geo: box(0.045, 0.048, 0.126), color: 0xded9c8, at: [0, 0.024, 0] },
  ]);
}

export function pickupGeo(kind: PickupKind): BufferGeometry {
  switch (kind) {
    case "pizza":
      return pizzaGeo();
    case "package":
      return packageGeo();
    case "coffee":
      return coffeeGeo();
    case "cash":
      return cashGeo();
  }
}

/** Grounded campus street/plaza prop geometry (base flush at y = 0) for physical knock-around interaction. */
export function campusPropGeo(kind: PropKind): BufferGeometry {
  switch (kind) {
    case "bin":
      return merge([
        // Brushed dark-slate cylinder body with teal recycling collar & slotted lid
        { geo: cyl(0.24, 0.21, 0.78, 12), color: 0x334155, at: [0, 0.39, 0] },
        { geo: cyl(0.255, 0.255, 0.1, 12), color: 0x0f766e, at: [0, 0.76, 0] },
        { geo: cyl(0.22, 0.25, 0.12, 12), color: 0x1e293b, at: [0, 0.86, 0] },
        { geo: box(0.26, 0.03, 0.08), color: 0x0b0f14, at: [0, 0.92, 0] },
      ]);
    case "cone":
      return merge([
        // Weighted black rubber base + safety orange frustum + white reflective sleeve
        { geo: box(0.38, 0.045, 0.38), color: 0x181a1f, at: [0, 0.022, 0] },
        { geo: cyl(0.055, 0.145, 0.62, 12), color: 0xf97316, at: [0, 0.35, 0] },
        { geo: cyl(0.082, 0.108, 0.16, 12), color: 0xf1f5f9, at: [0, 0.39, 0] },
      ]);
    case "sign":
      return merge([
        // Folding A-frame pavement board (charcoal frame + warm cream board face)
        { geo: box(0.56, 0.88, 0.04), color: 0x1f242c, at: [0, 0.43, 0.15], rot: [-0.18, 0, 0] },
        { geo: box(0.56, 0.88, 0.04), color: 0x1f242c, at: [0, 0.43, -0.15], rot: [0.18, 0, 0] },
        { geo: box(0.46, 0.64, 0.048), color: 0xe7e0d0, at: [0, 0.48, 0.15], rot: [-0.18, 0, 0] },
        { geo: box(0.46, 0.64, 0.048), color: 0xe7e0d0, at: [0, 0.48, -0.15], rot: [0.18, 0, 0] },
      ]);
    case "chair":
      return merge([
        // Courtyard cafe / quad chair: dark alloy legs + oak seat & backrest
        { geo: cyl(0.018, 0.016, 0.44, 6), color: 0x262b33, at: [-0.19, 0.22, -0.19] },
        { geo: cyl(0.018, 0.016, 0.44, 6), color: 0x262b33, at: [0.19, 0.22, -0.19] },
        { geo: cyl(0.018, 0.016, 0.44, 6), color: 0x262b33, at: [-0.19, 0.22, 0.19] },
        { geo: cyl(0.018, 0.016, 0.44, 6), color: 0x262b33, at: [0.19, 0.22, 0.19] },
        { geo: rbox(0.44, 0.045, 0.44, 0.012), color: 0x8b6239, at: [0, 0.45, 0] },
        { geo: box(0.03, 0.4, 0.03), color: 0x262b33, at: [-0.18, 0.66, -0.2] },
        { geo: box(0.03, 0.4, 0.03), color: 0x262b33, at: [0.18, 0.66, -0.2] },
        { geo: rbox(0.44, 0.24, 0.04, 0.01), color: 0x8b6239, at: [0, 0.78, -0.2] },
      ]);
    case "box":
      return merge([
        // Sealed kraft courier carton + packing tape strip
        { geo: box(0.48, 0.42, 0.44), color: 0xb08252, at: [0, 0.21, 0] },
        { geo: box(0.08, 0.01, 0.45), color: 0xd6c7a9, at: [0, 0.422, 0] },
        { geo: box(0.14, 0.1, 0.444), color: 0xe6e0d2, at: [0.1, 0.24, 0] },
      ]);
  }
}

// ---------------------------------------------------------------------------------------------
// Lofted Realistic Vehicles (slopCars.ts) & Commuter E-Scooter
// ---------------------------------------------------------------------------------------------

/** Realistic fallback automotive / scooter colours (never university brand palettes). */
export const VEHICLE_PAINTS: readonly number[] = [
  0x3a4350, // metallic slate
  0xd0d7df, // pearl silver
  0x263f5b, // deep harbour slate-blue
  0x7a232e, // metallic burgundy
  0x485c4e, // sage metallic
  0x84603e, // warm bronze
  0xeef1f4, // alpine white
  0x1d2128, // obsidian charcoal
];

let sharedEnvMap: DataTexture | undefined;
function getVehicleEnvMap(): DataTexture {
  if (sharedEnvMap) return sharedEnvMap;
  const W = 128;
  const H = 64;
  const data = new Uint8Array(W * H * 4);
  const skyTop = new Color(0x3b76cc);
  const skyHorizon = new Color(0xdbeaf8);
  const sunGlow = new Color(0xfff7e2);
  const roadDark = new Color(0x1b2029);
  const groundRim = new Color(0x475264);
  const tmp = new Color();

  for (let y = 0; y < H; y++) {
    // v = 1 at top row (y = 0) down to 0 at bottom row (y = H - 1).
    const v = 1 - y / (H - 1);
    const elev = (v - 0.5) * Math.PI;
    const sinE = Math.sin(elev);
    for (let x = 0; x < W; x++) {
      const az = (x / W) * Math.PI * 2;
      if (sinE >= 0) {
        const k = Math.pow(sinE, 0.52);
        tmp.copy(skyHorizon).lerp(skyTop, k);
        // Bright afternoon solar highlight around azimuth 2.2 rad, elevation ~38 deg.
        const sunDot = Math.max(0, Math.sin(elev) * 0.62 + Math.cos(elev) * Math.cos(az - 2.2) * 0.78);
        tmp.lerp(sunGlow, Math.pow(sunDot, 16) * 0.85);
      } else {
        const k = Math.min(1, Math.pow(-sinE, 0.45));
        tmp.copy(groundRim).lerp(roadDark, k);
      }
      const idx = (y * W + x) * 4;
      data[idx] = Math.round(Math.min(255, tmp.r * 255));
      data[idx + 1] = Math.round(Math.min(255, tmp.g * 255));
      data[idx + 2] = Math.round(Math.min(255, tmp.b * 255));
      data[idx + 3] = 255;
    }
  }
  const tex = new DataTexture(data, W, H, RGBAFormat, UnsignedByteType);
  tex.mapping = EquirectangularReflectionMapping;
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.needsUpdate = true;
  sharedEnvMap = tex;
  return tex;
}

let sharedShadowTex: DataTexture | undefined;
function getContactShadowTex(): DataTexture {
  if (sharedShadowTex) return sharedShadowTex;
  const N = 64;
  const data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) {
    const ny = (y / (N - 1)) * 2 - 1;
    for (let x = 0; x < N; x++) {
      const nx = (x / (N - 1)) * 2 - 1;
      // Squircle falloff matching rectangular car footprint.
      const d = Math.pow(Math.pow(Math.abs(nx), 2.6) + Math.pow(Math.abs(ny), 2.6), 1 / 2.6);
      const a = Math.max(0, Math.min(1, (1 - d) / 0.34));
      const smooth = a * a * (3 - 2 * a) * 0.56;
      const idx = (y * N + x) * 4;
      data[idx] = 8;
      data[idx + 1] = 10;
      data[idx + 2] = 14;
      data[idx + 3] = Math.round(smooth * 255);
    }
  }
  const tex = new DataTexture(data, N, N, RGBAFormat, UnsignedByteType);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.needsUpdate = true;
  sharedShadowTex = tex;
  return tex;
}

/** Builds outboard-oriented tyre + concave 5-spoke metallic alloy geometries for left (-1) or right (+1) side. */
function buildWheelParts(r: number, side: -1 | 1): { tyre: BufferGeometry; alloy: BufferGeometry } {
  const width = r * 0.68;
  const rim = r * 0.66;
  const hubR = rim * 0.28;
  // Lathe profiles revolve around +Y from inboard (-) to outboard (+).
  const tyreLathe = new LatheGeometry(
    [
      new Vector2(rim, -width * 0.42),
      new Vector2(r * 0.88, -width * 0.5),
      new Vector2(r, -width * 0.34),
      new Vector2(r, width * 0.34),
      new Vector2(r * 0.88, width * 0.5),
      new Vector2(rim, width * 0.42),
    ],
    18,
  );
  // Inboard dark backing disc closing the wheel well aperture.
  const backDisc = new CircleGeometry(rim * 0.98, 12);
  backDisc.rotateX(Math.PI / 2);
  backDisc.translate(0, -width * 0.4, 0);

  // Rotate so +Y axis points OUTBOARD (+X when side = +1, -X when side = -1).
  const orient = -side * Math.PI * 0.5;
  const tyre = merge([
    { geo: tyreLathe, color: 0x16181c, rot: [0, 0, orient] },
    { geo: backDisc, color: 0x111317, rot: [0, 0, orient] },
  ]);

  // Outer alloy lip, brake rotor behind spokes, hub cap, and 5 sculpted spokes.
  const lip = cyl(rim, rim, width * 0.14, 18);
  lip.translate(0, width * 0.36, 0);
  const rotor = cyl(rim * 0.78, rim * 0.78, width * 0.14, 14);
  rotor.translate(0, width * 0.14, 0);
  const hub = cyl(hubR, hubR * 1.1, width * 0.22, 12);
  hub.translate(0, width * 0.34, 0);

  const alloyPieces: Piece[] = [
    { geo: lip, color: 0xb6bec8, rot: [0, 0, orient] },
    { geo: rotor, color: 0x4b515a, rot: [0, 0, orient] },
    { geo: hub, color: 0x262a31, rot: [0, 0, orient] },
  ];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const spoke = box(rim * 0.19, width * 0.12, rim * 0.86);
    spoke.rotateY(a);
    spoke.translate(Math.sin(a) * rim * 0.48, width * 0.33, Math.cos(a) * rim * 0.48);
    alloyPieces.push({ geo: spoke, color: 0xd0d6de, rot: [0, 0, orient] });
  }
  return { tyre, alloy: merge(alloyPieces) };
}

interface ScooterAssets {
  body: BufferGeometry;
  glass: BufferGeometry;
  trim: BufferGeometry;
  lights: BufferGeometry;
  brake: BufferGeometry;
  shadow: BufferGeometry;
  wheelL: { tyre: BufferGeometry; alloy: BufferGeometry };
}

let scooterCache: ScooterAssets | undefined;

function getScooterAssets(): ScooterAssets {
  if (scooterCache) return scooterCache;
  const frame = merge([
    // Deck & teal side accent rails.
    { geo: rbox(0.17, 0.045, 0.64, 0.012), color: 0x2c3237, at: [0, 0.14, 0] },
    { geo: box(0.14, 0.01, 0.52), color: 0x1a1d21, at: [0, 0.165, 0] },
    { geo: box(0.18, 0.016, 0.58), color: 0x39c6a5, at: [0, 0.14, 0] },
    // Rear mudguard.
    { geo: box(0.075, 0.016, 0.2), color: 0x2c3237, at: [0, 0.25, -0.4], rot: [-0.25, 0, 0] },
    // Raked stem & handlebar.
    { geo: cyl(0.022, 0.026, 0.96, 10), color: 0x2c3237, at: [0, 0.62, 0.36], rot: [-0.14, 0, 0] },
    { geo: cyl(0.028, 0.028, 0.09, 10), color: 0x39c6a5, at: [0, 0.8, 0.33], rot: [-0.14, 0, 0] },
    { geo: cyl(0.015, 0.015, 0.48, 10), color: 0x2c3237, at: [0, 1.08, 0.3], rot: [0, 0, Math.PI / 2] },
    { geo: cyl(0.021, 0.021, 0.11, 10), color: 0x16181c, at: [-0.2, 1.08, 0.3], rot: [0, 0, Math.PI / 2] },
    { geo: cyl(0.021, 0.021, 0.11, 10), color: 0x16181c, at: [0.2, 1.08, 0.3], rot: [0, 0, Math.PI / 2] },
  ]);
  const glass = merge([{ geo: box(0.06, 0.01, 0.03), color: 0x11151b, at: [0, 1.09, 0.32] }]);
  const trim = merge([{ geo: box(0.05, 0.05, 0.02), color: 0x22262c, at: [0, 0.14, -0.41] }]);
  const lights = merge([{ geo: box(0.05, 0.035, 0.02), color: 0xfff5dc, at: [0, 1.02, 0.34] }]);
  const brake = merge([{ geo: box(0.04, 0.025, 0.016), color: 0xff222a, at: [0, 0.24, -0.5] }]);
  const shadow = new PlaneGeometry(0.65, 1.25);
  shadow.rotateX(-Math.PI / 2);
  scooterCache = { body: frame, glass, trim, lights, brake, shadow, wheelL: buildWheelParts(0.115, 1) };
  return scooterCache;
}

export interface VehiclePose {
  pitch?: number;
  roll?: number;
  heave?: number;
  damage?: number;
  reversing?: boolean;
  altitude?: number;
  flying?: boolean;
  thrust?: number;
  speed?: number;
  attackT?: number;
}

export interface VehicleActor {
  readonly kind: VehicleKind;
  readonly root: Group;
  setPaint(hex: number): void;
  setStyle?(styleIdx: number, paintOverride?: number): void;
  update(steer: number, wheelSpin: number, braking: boolean, siren: boolean, t: number, pose?: VehiclePose): void;
  dispose(): void;
}

const vehicleEnvMap = getVehicleEnvMap();
const sharedGlassMat = new MeshPhysicalMaterial({
  color: 0x0b1624,
  roughness: 0.05,
  metalness: 0.15,
  clearcoat: 1.0,
  clearcoatRoughness: 0.04,
  envMap: vehicleEnvMap,
  envMapIntensity: 1.75,
});
const sharedTrimMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.14 });
const sharedLightsMat = new MeshBasicMaterial({ vertexColors: true });
const sharedBrakeMat = new MeshBasicMaterial({ color: 0xff2634 });
const sharedTyreMat = new MeshStandardMaterial({ color: 0x16181c, roughness: 0.88, metalness: 0.04 });
const sharedAlloyMat = new MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.24,
  metalness: 0.78,
  envMap: vehicleEnvMap,
  envMapIntensity: 1.15,
});
const sharedShadowMat = new MeshBasicMaterial({
  map: getContactShadowTex(),
  transparent: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -1,
});

/** Creates a procedural vehicle: slopCars lofted + SDF-shaded car/bus/ute/van/taxi, Exo-Suit mecha, or commuter e-scooter. */
export function createVehicleActor(kind: VehicleKind, paintHex?: number, styleIdx = 0, lite = false): VehicleActor {
  if (kind === "mecha") {
    return createMechaActor(styleIdx, paintHex, lite);
  }
  if (kind !== "scooter") {
    return createSlopVehicleActor(kind, styleIdx, paintHex, lite);
  }
  const assets = getScooterAssets();
  const spec = VEHICLE_SPECS.scooter;
  const root = new Group();
  root.userData.noPick = true;

  const paintMat = lite
    ? new MeshLambertMaterial({ color: paintHex ?? VEHICLE_PAINTS[0]! })
    : new MeshStandardMaterial({
        color: paintHex ?? VEHICLE_PAINTS[0]!,
        roughness: 0.28,
        metalness: 0.45,
        envMap: vehicleEnvMap,
        envMapIntensity: 1.15,
      });

  const mark = (m: Mesh) => {
    m.castShadow = false;
    m.receiveShadow = false;
    m.userData.noPick = true;
    return m;
  };

  const shadowMesh = mark(new Mesh(assets.shadow, sharedShadowMat));
  shadowMesh.position.y = 0.03;
  shadowMesh.renderOrder = 1;
  root.add(shadowMesh);

  const chassisPivot = new Group();
  chassisPivot.position.y = spec.wheelRadius;
  const chassisInner = new Group();
  chassisInner.position.y = -spec.wheelRadius;
  chassisPivot.add(chassisInner);
  root.add(chassisPivot);

  chassisInner.add(
    mark(new Mesh(assets.body, paintMat)),
    mark(new Mesh(assets.glass, sharedGlassMat)),
    mark(new Mesh(assets.trim, sharedTrimMat)),
    mark(new Mesh(assets.lights, sharedLightsMat)),
  );
  const brakeMesh = mark(new Mesh(assets.brake, sharedBrakeMat));
  brakeMesh.visible = false;
  chassisInner.add(brakeMesh);

  const wheels: { pivot: Group; spin: Group; front: boolean }[] = [];
  const scooterWheelZ = 0.41;
  for (const [z, front] of [[scooterWheelZ, true], [-scooterWheelZ, false]] as const) {
    const pivot = new Group();
    pivot.position.set(0, spec.wheelRadius, z);
    const spin = new Group();
    spin.add(mark(new Mesh(assets.wheelL.tyre, sharedTyreMat)), mark(new Mesh(assets.wheelL.alloy, sharedAlloyMat)));
    pivot.add(spin);
    root.add(pivot);
    wheels.push({ pivot, spin, front });
  }

  return {
    kind,
    root,
    setPaint(hex: number) {
      paintMat.color.setHex(hex);
    },
    update(steer: number, wheelSpin: number, braking: boolean, _siren: boolean, _t: number, pose?: VehiclePose) {
      brakeMesh.visible = braking;
      chassisPivot.rotation.set(pose?.pitch ?? 0, 0, pose?.roll ?? 0);
      chassisPivot.position.y = spec.wheelRadius + (pose?.heave ?? 0);
      for (const w of wheels) {
        w.pivot.rotation.y = w.front ? steer : 0;
        w.spin.rotation.x = wheelSpin;
      }
    },
    dispose() {
      paintMat.dispose();
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Slice Co. Wood-Fired Pizza Van & Campus Info Stand
// ---------------------------------------------------------------------------------------------

function sliceCoSignTexture(): CanvasTexture | undefined {
  if (typeof document === "undefined") return undefined;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#1b1e23";
  g.fillRect(0, 0, 256, 96);
  g.strokeStyle = "#d98b32";
  g.lineWidth = 4;
  g.strokeRect(5, 5, 246, 86);
  g.fillStyle = "#f4efe4";
  g.font = "bold 36px sans-serif";
  g.textAlign = "center";
  g.fillText("SLICE CO.", 128, 46);
  g.fillStyle = "#e8a246";
  g.font = "bold 17px sans-serif";
  g.fillText("WOOD-FIRED PIZZA", 128, 74);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export interface PropAsset {
  lit: BufferGeometry;
  glow: BufferGeometry;
  sign?: BufferGeometry;
  signMat?: Material;
}

let sliceCoCache: PropAsset | undefined;
let standCache: PropAsset | undefined;

/** Realistic matte-charcoal & brushed-stainless "Slice Co." wood-fired pizza food van. */
export function sliceCoVanAsset(): PropAsset {
  if (sliceCoCache) return sliceCoCache;
  const CHARCOAL = 0x26292e;
  const STEEL = 0xbec4cc;
  const TRIM = 0x15171b;
  const BRICK = 0x8f432b;
  const WOOD = 0x6b4728;
  const BOX = 0xc99c68;

  const lit: Piece[] = [
    // Four wheels.
    { geo: cyl(0.36, 0.36, 0.24, 14), color: TRIM, at: [-0.94, 0.36, 1.55], rot: [0, 0, Math.PI / 2] },
    { geo: cyl(0.36, 0.36, 0.24, 14), color: TRIM, at: [0.94, 0.36, 1.55], rot: [0, 0, Math.PI / 2] },
    { geo: cyl(0.36, 0.36, 0.24, 14), color: TRIM, at: [-0.94, 0.36, -1.45], rot: [0, 0, Math.PI / 2] },
    { geo: cyl(0.36, 0.36, 0.24, 14), color: TRIM, at: [0.94, 0.36, -1.45], rot: [0, 0, Math.PI / 2] },
    // Alloy wheel hubs.
    { geo: cyl(0.2, 0.2, 0.26, 12), color: STEEL, at: [-0.94, 0.36, 1.55], rot: [0, 0, Math.PI / 2] },
    { geo: cyl(0.2, 0.2, 0.26, 12), color: STEEL, at: [0.94, 0.36, 1.55], rot: [0, 0, Math.PI / 2] },
    { geo: cyl(0.2, 0.2, 0.26, 12), color: STEEL, at: [-0.94, 0.36, -1.45], rot: [0, 0, Math.PI / 2] },
    { geo: cyl(0.2, 0.2, 0.26, 12), color: STEEL, at: [0.94, 0.36, -1.45], rot: [0, 0, Math.PI / 2] },
    // Lower chassis & bumpers.
    { geo: rbox(1.96, 0.72, 4.7, 0.04), color: CHARCOAL, at: [0, 0.78, -0.05] },
    { geo: rbox(1.98, 0.16, 4.82, 0.03), color: TRIM, at: [0, 0.44, -0.05] },
    // Front cab & sloped nose.
    { geo: rbox(1.92, 0.78, 1.15, 0.05), color: CHARCOAL, at: [0, 1.48, 1.62], rot: [0.16, 0, 0] },
    { geo: box(1.72, 0.62, 0.08), color: 0x0e151e, at: [0, 1.56, 2.08], rot: [-0.3, 0, 0] },
    // Upper food truck box (charcoal + brushed stainless trim).
    { geo: rbox(1.98, 1.28, 3.35, 0.04), color: CHARCOAL, at: [0, 1.72, -0.68] },
    { geo: box(2.02, 0.14, 3.38), color: STEEL, at: [0, 1.16, -0.68] },
    // Open serving hatch & brushed-stainless fold-down counter on +x side.
    { geo: box(0.08, 0.1, 2.15), color: STEEL, at: [1.14, 1.18, -0.68] },
    { geo: box(0.45, 0.05, 2.15), color: STEEL, at: [1.18, 1.16, -0.68] },
    // Hinged awning hatch propped open above serving window.
    { geo: box(0.85, 0.05, 2.15), color: CHARCOAL, at: [1.34, 2.26, -0.68], rot: [0, 0, -0.28] },
    { geo: box(0.87, 0.03, 2.17), color: STEEL, at: [1.34, 2.24, -0.68], rot: [0, 0, -0.28] },
    // Interior wood-fired brick oven dome visible through serving hatch.
    { geo: sph(0.46, 12, 8), color: BRICK, at: [0.25, 1.48, -0.95] },
    { geo: box(0.6, 0.45, 0.7), color: STEEL, at: [0.3, 1.32, -0.95] },
    // Stacked kraft pizza boxes inside counter.
    { geo: box(0.42, 0.05, 0.42), color: BOX, at: [0.88, 1.24, -0.25] },
    { geo: box(0.42, 0.05, 0.42), color: BOX, at: [0.88, 1.29, -0.24], rot: [0, 0.08, 0] },
    // Roof vent & flue chimney.
    { geo: box(0.65, 0.14, 0.65), color: STEEL, at: [0, 2.42, -0.35] },
    { geo: cyl(0.09, 0.1, 0.42, 10), color: STEEL, at: [-0.25, 2.55, -1.25] },
    // Wood menu A-frame board beside serving hatch.
    { geo: box(0.06, 0.92, 0.58), color: WOOD, at: [1.58, 0.46, 0.85], rot: [0, -0.3, 0] },
  ];

  const glow: Piece[] = [
    // Warm amber interior kitchen glow + wood-fire oven hearth glow.
    { geo: box(0.14, 0.82, 1.98), color: 0xffa640, at: [0.9, 1.66, -0.68] },
    { geo: box(0.18, 0.24, 0.28), color: 0xff6b24, at: [0.58, 1.44, -0.95] },
    // Front headlights & rear marker lamps.
    { geo: box(0.28, 0.09, 0.04), color: 0xfff5dc, at: [-0.66, 0.78, 2.31] },
    { geo: box(0.28, 0.09, 0.04), color: 0xfff5dc, at: [0.66, 0.78, 2.31] },
    { geo: box(0.26, 0.08, 0.04), color: 0xa8161e, at: [-0.72, 0.82, -2.41] },
    { geo: box(0.26, 0.08, 0.04), color: 0xa8161e, at: [0.72, 0.82, -2.41] },
  ];

  const sign = new BoxGeometry(0.04, 0.46, 1.48);
  sign.translate(1.03, 2.55, -0.68);
  const tex = sliceCoSignTexture();
  const signMat = new MeshBasicMaterial(tex ? { map: tex } : { color: 0x1b1e23 });

  sliceCoCache = { lit: merge(lit), glow: merge(glow), sign, signMat };
  return sliceCoCache;
}

/** Realistic compact campus pop-up table / info stand (no Lego canopy stripes). */
export function campusStandAsset(): PropAsset {
  if (standCache) return standCache;
  const FRAME = 0x2c323b;
  const DRAPE = 0x334155;
  const TOP = 0xe5e0d4;
  const FOLDER = 0x475569;

  const lit: Piece[] = [
    // Folding metal table legs & slate tablecloth drape.
    { geo: box(0.05, 0.82, 0.05), color: FRAME, at: [-0.85, 0.41, -0.38] },
    { geo: box(0.05, 0.82, 0.05), color: FRAME, at: [0.85, 0.41, -0.38] },
    { geo: box(0.05, 0.82, 0.05), color: FRAME, at: [-0.85, 0.41, 0.38] },
    { geo: box(0.05, 0.82, 0.05), color: FRAME, at: [0.85, 0.41, 0.38] },
    { geo: box(1.86, 0.06, 0.92), color: TOP, at: [0, 0.84, 0] },
    { geo: box(1.82, 0.62, 0.88), color: DRAPE, at: [0, 0.5, 0] },
    // Neat stacks of flyers, dossiers & clipboard on tabletop.
    { geo: box(0.32, 0.08, 0.24), color: 0xf4f1ea, at: [-0.45, 0.91, 0.05] },
    { geo: box(0.34, 0.07, 0.26), color: FOLDER, at: [0.4, 0.905, -0.04], rot: [0, 0.14, 0] },
    { geo: box(0.24, 0.025, 0.32), color: 0x2b3038, at: [0.02, 0.88, 0.12], rot: [0, -0.2, 0] },
    // Compact tabletop sign frame.
    { geo: box(0.04, 0.52, 0.04), color: FRAME, at: [-0.72, 1.12, -0.28] },
    { geo: box(0.56, 0.36, 0.04), color: 0x1e242d, at: [-0.48, 1.24, -0.28], rot: [0, 0.18, 0] },
  ];
  const glow: Piece[] = [{ geo: box(0.46, 0.06, 0.045), color: 0x57b8ff, at: [-0.48, 1.32, -0.26], rot: [0, 0.18, 0] }];
  standCache = { lit: merge(lit), glow: merge(glow) };
  return standCache;
}

// ---------------------------------------------------------------------------------------------
// Procedural Articulated ~1.75 m Human Fallback (before walker.glb loads or in headless tests)
// ---------------------------------------------------------------------------------------------

export interface ProceduralHuman {
  root: Group;
  pose(speed: number, t: number, attackT: number, stagger: boolean, down?: boolean): void;
  dispose(): void;
}

interface ProceduralParts {
  torso: Group;
  head: Mesh;
  armL: Group;
  armR: Group;
  legL: Group;
  legR: Group;
}

const procMatCache = new Map<string, Material>();
const procGeoCache: BufferGeometry[] = [];

function cachedMat(hex: string): MeshLambertMaterial {
  let m = procMatCache.get(hex) as MeshLambertMaterial | undefined;
  if (!m) {
    m = new MeshLambertMaterial({ color: hex });
    procMatCache.set(hex, m);
  }
  return m;
}

let sharedLimbGeos:
  | {
      torso: BufferGeometry;
      head: BufferGeometry;
      hair: BufferGeometry;
      arm: BufferGeometry;
      leg: BufferGeometry;
      shoe: BufferGeometry;
      pack: BufferGeometry;
      cap: BufferGeometry;
      vest: BufferGeometry;
      clipboard: BufferGeometry;
    }
  | undefined;

function getSharedLimbGeos() {
  if (sharedLimbGeos) return sharedLimbGeos;
  const torso = rbox(0.36, 0.54, 0.21, 0.04);
  torso.translate(0, 0.27, 0);
  const head = sph(0.115, 12, 10);
  const hair = new SphereGeometry(0.123, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const arm = cyl(0.048, 0.04, 0.5, 8);
  arm.translate(0, -0.25, 0);
  const leg = cyl(0.068, 0.055, 0.72, 8);
  leg.translate(0, -0.36, 0);
  const shoe = rbox(0.11, 0.09, 0.22, 0.02);
  shoe.translate(0, -0.795, -0.03);
  const pack = rbox(0.28, 0.36, 0.13, 0.03);
  pack.translate(0, 0.3, 0.16);
  const cap = merge([
    { geo: new SphereGeometry(0.128, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), color: 0x1d2638 },
    { geo: box(0.16, 0.02, 0.14), color: 0x141b28, at: [0, 0.01, -0.14] },
  ]);
  const vest = rbox(0.38, 0.42, 0.23, 0.03);
  vest.translate(0, 0.29, 0);
  const clipboard = box(0.2, 0.28, 0.02);
  sharedLimbGeos = { torso, head, hair, arm, leg, shoe, pack, cap, vest, clipboard };
  procGeoCache.push(...Object.values(sharedLimbGeos));
  return sharedLimbGeos;
}

/** Creates an articulated ~1.75 m human facing -z (matching walker.glb orientation) for instant fallback. */
export function createProceduralHuman(
  paletteIdx: number,
  opts: { backpack?: boolean; cap?: boolean; hiVisVest?: boolean; clipboard?: boolean },
): ProceduralHuman {
  const pal = HUMAN_PALETTES[((Math.floor(paletteIdx) % HUMAN_PALETTES.length) + HUMAN_PALETTES.length) % HUMAN_PALETTES.length]!;
  const geos = getSharedLimbGeos();
  const root = new Group();
  root.userData.noPick = true;

  const mk = (geo: BufferGeometry, mat: Material) => {
    const m = new Mesh(geo, mat);
    m.castShadow = false;
    m.receiveShadow = false;
    m.userData.noPick = true;
    return m;
  };

  const torso = new Group();
  torso.position.set(0, 0.84, 0);
  torso.add(mk(geos.torso, cachedMat(pal.top)));

  const head = mk(geos.head, cachedMat(pal.skin));
  head.position.set(0, 0.68, 0);
  head.add(mk(geos.hair, cachedMat(pal.hair)));
  if (opts.cap) head.add(mk(geos.cap, sharedTrimMat));
  torso.add(head);

  if (opts.backpack) torso.add(mk(geos.pack, cachedMat(pal.pack)));
  if (opts.hiVisVest) torso.add(mk(geos.vest, cachedMat("#c9dc2e")));

  const armL = new Group();
  armL.position.set(-0.23, 0.49, 0);
  armL.add(mk(geos.arm, cachedMat(pal.top)));
  const armR = new Group();
  armR.position.set(0.23, 0.49, 0);
  armR.add(mk(geos.arm, cachedMat(pal.top)));
  if (opts.clipboard) {
    const cb = mk(geos.clipboard, cachedMat("#2b3038"));
    cb.position.set(0, -0.45, -0.08);
    cb.rotation.x = Math.PI / 2;
    armR.add(cb);
  }
  torso.add(armL, armR);

  const legL = new Group();
  legL.position.set(-0.095, 0.84, 0);
  legL.add(mk(geos.leg, cachedMat(pal.bottom)), mk(geos.shoe, cachedMat(pal.shoes)));
  const legR = new Group();
  legR.position.set(0.095, 0.84, 0);
  legR.add(mk(geos.leg, cachedMat(pal.bottom)), mk(geos.shoe, cachedMat(pal.shoes)));

  root.add(torso, legL, legR);
  const parts: ProceduralParts = { torso, head, armL, armR, legL, legR };

  return {
    root,
    pose(speed: number, t: number, attackT: number, stagger: boolean, down = false) {
      if (down) {
        parts.legL.rotation.x = 0.08;
        parts.legR.rotation.x = -0.12;
        parts.armL.rotation.x = -0.25;
        parts.armR.rotation.x = 0.3;
        parts.torso.position.y = 0.84;
        parts.torso.rotation.set(0, 0, 0);
        root.rotation.x = -Math.PI * 0.47;
        root.position.y = 0.14;
        return;
      }
      root.rotation.x = 0;
      root.position.y = 0;
      const moving = Math.min(1, speed / 1.4);
      const stride = moving * Math.sin(t * (speed > 2.6 ? 9.5 : 6.0)) * (speed > 2.6 ? 0.65 : 0.45);
      parts.legL.rotation.x = stride;
      parts.legR.rotation.x = -stride;
      parts.armL.rotation.x = -stride * 0.75;
      parts.armR.rotation.x = stride * 0.75;
      parts.torso.position.y = 0.84 + Math.abs(stride) * 0.03;
      parts.torso.rotation.x = stagger ? -0.32 : speed > 2.6 ? 0.14 : 0.03 * moving;
      if (attackT > 0) {
        const swing = Math.sin(Math.min(1, attackT) * Math.PI);
        parts.armR.rotation.x = -1.45 * swing;
        parts.torso.rotation.y = 0.35 * swing;
      } else {
        parts.torso.rotation.y = 0;
      }
    },
    dispose() {
      // Shared procedural geometries and materials stay pooled for page lifetime.
    },
  };
}
