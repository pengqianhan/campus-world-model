// Procedural lofted vehicles & buses ported from pengqianhan/slop-auckland (js/cars.js, js/vehicles.js, js/bus.js, js/traffic.js):
// ~45 monotone-cubic-spline lofted body sections with blended raked tip caps, open lofted glasshouse & high-roof Sprinter cabin,
// and anisotropic fwidth() anti-aliased WebGL2 SDF shaders for doors, shut lines, grilles, projector headlamps, DRLs, LED tail bars,
// NZ license plates, AT Metro / Link bus liveries, and 4 spoke-styled alloy wheels with brake discs & calipers.
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
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  LatheGeometry,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RGBAFormat,
  Shape,
  SRGBColorSpace,
  UnsignedByteType,
  Vector2,
  Vector3,
  Vector4,
  type Material,
} from "three";
import { LoftGeometry } from "three/examples/jsm/geometries/LoftGeometry.js";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { VehicleKind } from "../shared/campusVehicles.ts";

export type FourWheelVehicleKind = Exclude<VehicleKind, "scooter" | "mecha">;

export const CAR_PARTS = {
  BODY: 0,
  WINDOW: 1,
  TYRE: 2,
  ALLOY: 3,
  TRIM: 4,
  MIRROR: 5,
  SIGN: 6,
} as const;

const BUS_PARTS = {
  BODY: 0,
  TRIM: 1,
  POD: 2,
  FAIRING: 3,
} as const;

// Uniform campus-street scale factor for the 40-ft transit bus (~10.6 m long x 2.28 m wide)
const BUS_SCALE = 0.88;

interface EndRounding {
  halfWidth: [number, number, number];
  edge: [number, number, number];
  crown: [number, number, number];
  sill: [number, number, number];
  shoulder: [number, number, number];
}

interface RakeSpec {
  length: number;
  y: [number, number][];
  plan: number;
}

interface CabinSpec {
  cowl: number;
  roofFront: number;
  roofRear: number;
  deck: number;
  roofY: [number, number][];
  rail: [number, number];
  inset: number;
  bulge: number;
  roofEdge: number;
  roofCrown: number;
  roofRound: number;
  pillars: number[];
  glassEnd?: number;
}

interface CargoSpec {
  rise: [number, number][];
  roofEdge: number;
  roofRound: number;
  bumper: [number, number, number];
}

export interface CarBodySpec {
  name: FourWheelVehicleKind;
  zFront: number;
  zRear: number;
  wheelRadius: number;
  wheelZ: number;
  wheelX: number;
  archGap: number;
  archFlare: number;
  archPower?: number;
  tuck: number;
  lowerRound?: number;
  upperRound?: number;
  upperSamples?: number[];
  stationStep?: number;
  proxyStep?: number;
  halfWidth: [number, number][];
  sill: [number, number][];
  shoulder: [number, number][];
  edge: [number, number][];
  crown: [number, number][];
  tumble: [number, number][];
  nose: EndRounding;
  tail: EndRounding;
  noseRake?: RakeSpec;
  tailRake?: RakeSpec;
  cabin: CabinSpec;
  cargo?: CargoSpec;
  doors: number[];
  handles: number[];
  headlight: [number, number, number, number];
  taillight: [number, number, number, number];
  grille: [number, number, number];
  intake: [number, number, number];
  plates: [number, number];
  bumperLine: [number, number];
  bumpers: [[number, number], [number, number]];
  mirrorScale?: [number, number, number];
  chrome: boolean;
  cladding: number;
  sign: boolean;
  rails: boolean;
  rearWiper: boolean;
  bedCover?: boolean;
  tailStrip?: boolean;
  barnDoors?: [number, number];
  slidingDoor?: [number, number, number];
  _body?: (z: number) => BodySection;
  _layout?: CarLayout;
  _rake?: ((x: number, y: number, z: number) => number) | null;
}

interface BodySection {
  z: number;
  W: number;
  yB: number;
  ySill: number;
  yS: number;
  yE: number;
  yT: number;
  xE: number;
  xB: number;
}

interface CabinSection {
  z: number;
  beltX: number;
  beltY: number;
  railX: number;
  railY: number;
  h: number;
  bulge: number;
}

interface CarLayout {
  spec: CarBodySpec;
  body: (z: number) => BodySection;
  cabin: (z: number) => CabinSection;
  cabinTop: (c: CabinSection, x: number) => number;
  archR: number;
  belt: { cowl: { x: number; y: number }; deck: { x: number; y: number } };
  rail: {
    front: { x: number; y: number };
    mid: { x: number; y: number };
    rear: { x: number; y: number };
    roofMid: number;
  };
}

const SEDAN_SPEC: CarBodySpec = {
  name: "sedan",
  zFront: 2.22,
  zRear: -2.28,
  wheelRadius: 0.35,
  wheelZ: 1.4,
  wheelX: 0.8,
  archGap: 0.036,
  archFlare: 0.022,
  tuck: 0.07,
  halfWidth: [[2.22, 0.9], [1.4, 0.918], [0, 0.926], [-1.4, 0.922], [-2.28, 0.908]],
  sill: [[2.22, 0.265], [1.2, 0.245], [-1.2, 0.245], [-2.28, 0.285]],
  shoulder: [[2.22, 0.68], [1.75, 0.76], [1.4, 0.772], [0, 0.782], [-1.4, 0.795], [-2.28, 0.77]],
  edge: [[2.08, 0.81], [1.55, 0.865], [0.82, 0.948], [0.3, 0.97], [-0.4, 0.985], [-1.2, 1.0], [-1.58, 0.995], [-1.88, 0.968], [-2.12, 0.94]],
  crown: [[2.1, 0.04], [0.95, 0.035], [0.68, 0.004], [-1.66, 0.004], [-1.92, 0.018], [-2.28, 0.014]],
  tumble: [[2.22, 0.12], [0.9, 0.1], [-1.6, 0.1], [-2.28, 0.115]],
  nose: { halfWidth: [0.32, 0.68, 2.8], edge: [0.14, 0.74, 2.6], crown: [0.14, 0.012, 2], sill: [0.16, 0.31, 2], shoulder: [0.22, 0.62, 2.6] },
  tail: { halfWidth: [0.3, 0.72, 2.8], edge: [0.1, 0.91, 3], crown: [0.1, 0.008, 2], sill: [0.16, 0.36, 2], shoulder: [0.22, 0.7, 2.6] },
  noseRake: { length: 0.55, y: [[0.25, 0.045], [0.36, 0], [0.54, 0], [0.68, 0.03], [0.78, 0.1], [0.86, 0.14]], plan: 0.085 },
  tailRake: { length: 0.42, y: [[0.27, 0.075], [0.44, 0], [0.56, 0], [0.62, 0.012], [0.76, 0.015], [0.94, 0.03]], plan: 0.065 },
  cabin: {
    cowl: 0.82,
    roofFront: -0.02,
    roofRear: -1.12,
    deck: -1.86,
    roofY: [[-0.02, 1.41], [-0.55, 1.445], [-1.12, 1.405]],
    rail: [0.62, 0.595],
    inset: 0.03,
    bulge: 0.014,
    roofEdge: 0.05,
    roofCrown: 0.035,
    roofRound: 4,
    pillars: [-0.36],
    glassEnd: -1.56,
  },
  doors: [0.79, -0.36, -0.98],
  handles: [-0.2, -0.86],
  headlight: [0.6, 0.68, 0.24, 0.048],
  taillight: [0.6, 0.815, 0.265, 0.052],
  grille: [0.66, 0.3, 0.042],
  intake: [0.4, 0.55, 0.072],
  plates: [0.46, 0.665],
  bumperLine: [0.75, 0.555],
  bumpers: [[0.44, 0.03], [0.48, 0.03]],
  chrome: true,
  cladding: 0,
  sign: false,
  rails: false,
  rearWiper: false,
};

export const BODY_SPECS: Record<Exclude<FourWheelVehicleKind, "bus">, CarBodySpec> = {
  sedan: SEDAN_SPEC,
  taxi: { ...SEDAN_SPEC, name: "taxi", sign: true },
  security: { ...SEDAN_SPEC, name: "security" },
  hatchback: {
    name: "hatchback",
    zFront: 2.04,
    zRear: -2.08,
    wheelRadius: 0.33,
    wheelZ: 1.28,
    wheelX: 0.79,
    archGap: 0.038,
    archFlare: 0.022,
    tuck: 0.065,
    halfWidth: [[2.04, 0.87], [1.28, 0.895], [0, 0.9], [-1.28, 0.892], [-2.08, 0.86]],
    sill: [[2.04, 0.255], [1.0, 0.23], [-1.0, 0.23], [-2.08, 0.275]],
    shoulder: [[2.04, 0.65], [1.28, 0.75], [0, 0.785], [-1.28, 0.83], [-2.08, 0.82]],
    edge: [[1.9, 0.78], [1.45, 0.84], [0.78, 0.935], [0, 0.96], [-1.35, 1.005], [-1.96, 0.99], [-2.08, 0.96]],
    crown: [[1.9, 0.038], [0.9, 0.03], [0.65, 0.004], [-2.08, 0.006]],
    tumble: [[2.04, 0.12], [0.85, 0.095], [-1.4, 0.1], [-2.08, 0.115]],
    nose: { halfWidth: [0.28, 0.66, 2.8], edge: [0.14, 0.72, 2.6], crown: [0.14, 0.012, 2], sill: [0.15, 0.29, 2], shoulder: [0.2, 0.6, 2.6] },
    tail: { halfWidth: [0.24, 0.7, 2.8], edge: [0.07, 0.93, 3], crown: [0.07, 0.005, 2], sill: [0.15, 0.34, 2], shoulder: [0.18, 0.76, 2.6] },
    noseRake: { length: 0.5, y: [[0.24, 0.04], [0.35, 0], [0.52, 0], [0.68, 0.04], [0.82, 0.12]], plan: 0.08 },
    tailRake: { length: 0.36, y: [[0.26, 0.07], [0.42, 0], [0.62, 0], [0.82, 0.025], [0.98, 0.04]], plan: 0.055 },
    cabin: {
      cowl: 0.78,
      roofFront: -0.02,
      roofRear: -1.48,
      deck: -1.96,
      roofY: [[-0.02, 1.43], [-0.75, 1.455], [-1.48, 1.40]],
      rail: [0.625, 0.59],
      inset: 0.03,
      bulge: 0.014,
      roofEdge: 0.05,
      roofCrown: 0.032,
      roofRound: 4,
      pillars: [-0.36, -1.16],
      glassEnd: -1.72,
    },
    doors: [0.76, -0.36, -1.0],
    handles: [-0.2, -0.82],
    headlight: [0.58, 0.66, 0.23, 0.048],
    taillight: [0.59, 0.85, 0.245, 0.054],
    grille: [0.64, 0.29, 0.044],
    intake: [0.39, 0.56, 0.078],
    plates: [0.45, 0.67],
    bumperLine: [0.73, 0.57],
    bumpers: [[0.43, 0.032], [0.48, 0.035]],
    chrome: false,
    cladding: 0,
    sign: false,
    rails: false,
    rearWiper: true,
  },
  sports: {
    name: "sports",
    zFront: 2.24,
    zRear: -2.24,
    wheelRadius: 0.35,
    wheelZ: 1.38,
    wheelX: 0.84,
    archGap: 0.032,
    archFlare: 0.038,
    tuck: 0.08,
    halfWidth: [[2.24, 0.91], [1.38, 0.95], [0, 0.955], [-1.38, 0.968], [-2.24, 0.925]],
    sill: [[2.24, 0.215], [1.1, 0.20], [-1.1, 0.20], [-2.24, 0.235]],
    shoulder: [[2.24, 0.58], [1.7, 0.69], [1.38, 0.715], [0, 0.73], [-1.38, 0.77], [-2.24, 0.75]],
    edge: [[2.1, 0.72], [1.55, 0.785], [0.72, 0.875], [0.1, 0.895], [-0.8, 0.915], [-1.45, 0.93], [-2.05, 0.91], [-2.24, 0.895]],
    crown: [[2.1, 0.034], [0.95, 0.028], [0.62, 0.004], [-1.55, 0.004], [-1.95, 0.015], [-2.24, 0.012]],
    tumble: [[2.24, 0.14], [0.85, 0.115], [-1.5, 0.12], [-2.24, 0.135]],
    nose: { halfWidth: [0.36, 0.67, 2.8], edge: [0.18, 0.65, 2.6], crown: [0.18, 0.01, 2], sill: [0.16, 0.26, 2], shoulder: [0.24, 0.52, 2.6] },
    tail: { halfWidth: [0.28, 0.76, 2.8], edge: [0.09, 0.87, 3], crown: [0.09, 0.008, 2], sill: [0.16, 0.31, 2], shoulder: [0.2, 0.68, 2.6] },
    noseRake: { length: 0.64, y: [[0.2, 0.04], [0.32, 0], [0.48, 0], [0.64, 0.045], [0.76, 0.13], [0.84, 0.175]], plan: 0.095 },
    tailRake: { length: 0.4, y: [[0.24, 0.08], [0.42, 0], [0.56, 0], [0.7, 0.015], [0.9, 0.03]], plan: 0.06 },
    cabin: {
      cowl: 0.72,
      roofFront: -0.14,
      roofRear: -0.98,
      deck: -1.94,
      roofY: [[-0.14, 1.275], [-0.55, 1.30], [-0.98, 1.255]],
      rail: [0.61, 0.575],
      inset: 0.032,
      bulge: 0.016,
      roofEdge: 0.046,
      roofCrown: 0.028,
      roofRound: 4,
      pillars: [-0.88],
      glassEnd: -1.58,
    },
    doors: [0.68, -0.82],
    handles: [-0.46],
    headlight: [0.64, 0.605, 0.255, 0.038],
    taillight: [0.63, 0.765, 0.295, 0.042],
    grille: [0.575, 0.34, 0.032],
    intake: [0.345, 0.68, 0.085],
    plates: [0.39, 0.59],
    bumperLine: [0.68, 0.49],
    bumpers: [[0.38, 0.028], [0.44, 0.028]],
    chrome: false,
    cladding: 0,
    sign: false,
    rails: false,
    rearWiper: false,
  },
  suv: {
    name: "suv",
    zFront: 2.32,
    zRear: -2.35,
    wheelRadius: 0.38,
    wheelZ: 1.45,
    wheelX: 0.845,
    archGap: 0.05,
    archFlare: 0.032,
    tuck: 0.065,
    halfWidth: [[2.32, 0.935], [1.45, 0.964], [0, 0.97], [-1.45, 0.966], [-2.35, 0.945]],
    sill: [[2.32, 0.38], [1.2, 0.335], [-1.2, 0.335], [-2.35, 0.415]],
    shoulder: [[2.32, 0.81], [1.75, 0.885], [1.45, 0.9], [0, 0.925], [-1.45, 0.955], [-2.35, 0.94]],
    edge: [[2.16, 0.985], [1.65, 1.068], [1.1, 1.098], [0.82, 1.105], [0, 1.125], [-0.95, 1.15], [-1.55, 1.185], [-1.9, 1.2], [-2.2, 1.195], [-2.35, 1.17]],
    crown: [[2.16, 0.048], [0.95, 0.042], [0.68, 0.004], [-2.35, 0.004]],
    tumble: [[2.32, 0.125], [0.9, 0.105], [-1.6, 0.11], [-2.35, 0.125]],
    nose: { halfWidth: [0.34, 0.72, 2.8], edge: [0.14, 0.91, 2.6], crown: [0.14, 0.015, 2], sill: [0.16, 0.43, 2], shoulder: [0.22, 0.7, 2.6] },
    tail: { halfWidth: [0.28, 0.76, 2.8], edge: [0.06, 1.15, 3], crown: [0.06, 0.004, 2], sill: [0.16, 0.46, 2], shoulder: [0.2, 0.86, 2.6] },
    noseRake: { length: 0.62, y: [[0.35, 0.085], [0.5, 0], [0.76, 0.012], [0.92, 0.075], [1.04, 0.145]], plan: 0.075 },
    tailRake: { length: 0.42, y: [[0.38, 0.085], [0.54, 0], [0.66, 0], [0.76, 0.02], [1.02, 0.028], [1.19, 0.035]], plan: 0.045 },
    cabin: {
      cowl: 0.82,
      roofFront: -0.22,
      roofRear: -1.7,
      deck: -2.2,
      roofY: [[-0.22, 1.71], [-0.85, 1.735], [-1.7, 1.67]],
      rail: [0.665, 0.635],
      inset: 0.035,
      bulge: 0.014,
      roofEdge: 0.055,
      roofCrown: 0.032,
      roofRound: 4,
      pillars: [-0.38, -1.2],
      glassEnd: -1.9,
    },
    doors: [0.78, -0.38, -1.04],
    handles: [-0.2, -0.92],
    headlight: [0.63, 0.875, 0.245, 0.05],
    taillight: [0.65, 0.98, 0.25, 0.058],
    grille: [0.835, 0.375, 0.105],
    intake: [0.49, 0.48, 0.058],
    plates: [0.58, 0.82],
    bumperLine: [0.94, 0.66],
    bumpers: [[0.54, 0.04], [0.56, 0.04]],
    chrome: false,
    cladding: 0.46,
    sign: false,
    rails: true,
    rearWiper: true,
  },
  pickup: {
    name: "pickup",
    zFront: 2.74,
    zRear: -2.94,
    wheelRadius: 0.435,
    wheelZ: 1.92,
    wheelX: 0.91,
    archGap: 0.058,
    archPower: 3.2,
    archFlare: 0.042,
    tuck: 0.065,
    upperRound: 4.6,
    stationStep: 0.46,
    proxyStep: 1.3,
    halfWidth: [[2.74, 0.99], [1.92, 1.02], [0, 1.025], [-1.92, 1.02], [-2.94, 1.0]],
    sill: [[2.74, 0.51], [1.4, 0.48], [-1.4, 0.48], [-2.94, 0.52]],
    shoulder: [[2.74, 1.12], [2.15, 1.18], [1.92, 1.19], [0, 1.195], [-1.92, 1.195], [-2.94, 1.18]],
    edge: [[2.62, 1.25], [2.15, 1.29], [1.4, 1.305], [1.14, 1.31], [0.1, 1.31], [-0.96, 1.315], [-1.92, 1.315], [-2.82, 1.305]],
    crown: [[2.62, 0.042], [1.35, 0.038], [1.02, 0.005], [-2.94, 0.004]],
    tumble: [[2.74, 0.1], [1.14, 0.085], [-0.96, 0.085], [-2.94, 0.09]],
    nose: { halfWidth: [0.28, 0.82, 3.2], edge: [0.12, 1.22, 3.2], crown: [0.12, 0.015, 2], sill: [0.18, 0.55, 2.2], shoulder: [0.18, 1.04, 2.8] },
    tail: { halfWidth: [0.22, 0.86, 3.2], edge: [0.06, 1.28, 3], crown: [0.06, 0.004, 2], sill: [0.18, 0.56, 2.2], shoulder: [0.16, 1.1, 2.8] },
    noseRake: { length: 0.34, y: [[0.5, 0.045], [0.62, 0], [1.18, 0], [1.26, 0.018], [1.34, 0.045]], plan: 0.038 },
    tailRake: { length: 0.3, y: [[0.52, 0.055], [0.64, 0], [0.8, 0], [0.9, 0.018], [1.3, 0.022]], plan: 0.03 },
    cabin: {
      cowl: 1.14,
      roofFront: 0.34,
      roofRear: -0.68,
      deck: -0.96,
      roofY: [[0.34, 1.965], [-0.16, 1.99], [-0.68, 1.975]],
      rail: [0.75, 0.74],
      inset: 0.035,
      bulge: 0.012,
      roofEdge: 0.055,
      roofCrown: 0.028,
      roofRound: 4.5,
      pillars: [0.1],
      glassEnd: -0.78,
    },
    doors: [1.06, 0.1, -0.78],
    handles: [0.26, -0.58],
    headlight: [0.73, 1.09, 0.21, 0.11],
    taillight: [0.8, 1.1, 0.16, 0.14],
    grille: [0.99, 0.48, 0.235],
    intake: [0.61, 0.52, 0.065],
    plates: [0.66, 0.92],
    bumperLine: [1.24, 0.8],
    bumpers: [[0.6, 0.045], [0.6, 0.045]],
    mirrorScale: [1.28, 1.32, 1.12],
    chrome: true,
    cladding: 0.55,
    sign: false,
    rails: false,
    rearWiper: false,
    bedCover: true,
  },
  minivan: {
    name: "minivan",
    zFront: 2.5,
    zRear: -2.67,
    wheelRadius: 0.37,
    wheelZ: 1.515,
    wheelX: 0.845,
    archGap: 0.045,
    archFlare: 0.02,
    tuck: 0.06,
    halfWidth: [[2.5, 0.93], [1.515, 0.975], [0, 0.985], [-1.515, 0.98], [-2.67, 0.955]],
    sill: [[2.5, 0.33], [1.2, 0.31], [-1.2, 0.31], [-2.67, 0.38]],
    shoulder: [[2.5, 0.72], [1.5, 0.8], [0, 0.82], [-1.5, 0.84], [-2.67, 0.84]],
    edge: [[2.36, 0.88], [1.9, 0.95], [1.55, 1.0], [0.8, 1.04], [-0.5, 1.07], [-1.6, 1.11], [-2.3, 1.13], [-2.6, 1.11]],
    crown: [[2.36, 0.035], [1.6, 0.03], [1.4, 0.004], [-2.67, 0.004]],
    tumble: [[2.5, 0.12], [1.5, 0.1], [-1.5, 0.1], [-2.67, 0.12]],
    nose: { halfWidth: [0.36, 0.7, 2.7], edge: [0.16, 0.86, 2.5], crown: [0.16, 0.012, 2], sill: [0.18, 0.36, 2], shoulder: [0.24, 0.62, 2.5] },
    tail: { halfWidth: [0.26, 0.8, 2.8], edge: [0.07, 1.06, 3], crown: [0.07, 0.004, 2], sill: [0.16, 0.44, 2], shoulder: [0.2, 0.84, 2.6] },
    noseRake: { length: 0.6, y: [[0.3, 0.08], [0.45, 0], [0.62, 0], [0.75, 0.04], [0.9, 0.11]], plan: 0.08 },
    tailRake: { length: 0.42, y: [[0.38, 0.08], [0.52, 0], [0.7, 0], [0.85, 0.02], [1.1, 0.05]], plan: 0.05 },
    cabin: {
      cowl: 1.55,
      roofFront: 0.42,
      roofRear: -2.2,
      deck: -2.55,
      roofY: [[0.42, 1.72], [-0.6, 1.765], [-1.6, 1.755], [-2.2, 1.715]],
      rail: [0.76, 0.72],
      inset: 0.03,
      bulge: 0.012,
      roofEdge: 0.06,
      roofCrown: 0.03,
      roofRound: 4,
      pillars: [0.28, -0.98],
      glassEnd: -1.98,
    },
    doors: [1.05, 0.28, -0.98],
    handles: [0.42, 0.15],
    headlight: [0.66, 0.775, 0.24, 0.055],
    taillight: [0.7, 1.0, 0.2, 0.07],
    grille: [0.74, 0.3, 0.035],
    intake: [0.49, 0.55, 0.12],
    plates: [0.49, 0.84],
    bumperLine: [0.68, 0.72],
    bumpers: [[0.45, 0.04], [0.55, 0.04]],
    chrome: false,
    cladding: 0,
    sign: false,
    rails: false,
    rearWiper: true,
  },
  van: {
    name: "van",
    zFront: 2.8,
    zRear: -3.08,
    wheelRadius: 0.38,
    wheelZ: 1.8,
    wheelX: 0.86,
    archGap: 0.05,
    archFlare: 0.012,
    tuck: 0.05,
    lowerRound: 4,
    upperRound: 5,
    upperSamples: [1],
    halfWidth: [[2.8, 0.95], [1.8, 0.99], [0.8, 1.0], [-3.08, 1.0]],
    sill: [[2.8, 0.36], [2.1, 0.42], [1.2, 0.45], [-3.08, 0.48]],
    shoulder: [[2.8, 0.66], [2.2, 0.82], [1.6, 0.9], [-3.08, 0.92]],
    edge: [[2.64, 0.97], [2.2, 1.08], [1.75, 1.18], [1.0, 1.21], [0.4, 1.22], [-3.08, 1.22]],
    crown: [[2.64, 0.03], [1.9, 0.025], [1.6, 0.004], [-3.08, 0]],
    tumble: [[2.8, 0.1], [2.0, 0.06], [1.3, 0.015], [-3.08, 0.015]],
    nose: { halfWidth: [0.38, 0.74, 2.6], edge: [0.16, 0.95, 2.4], crown: [0.16, 0.01, 2], sill: [0.18, 0.4, 2], shoulder: [0.24, 0.62, 2.4] },
    tail: { halfWidth: [0.09, 0.93, 3.2], edge: [0.03, 1.2, 3], crown: [0.03, 0, 2], sill: [0.08, 0.5, 2], shoulder: [0.08, 0.9, 3] },
    noseRake: { length: 0.55, y: [[0.32, 0.06], [0.45, 0], [0.7, 0], [0.85, 0.05], [1.0, 0.12]], plan: 0.09 },
    cabin: {
      cowl: 1.75,
      roofFront: 1.22,
      roofRear: 0.48,
      deck: 0.42,
      roofY: [[1.22, 2.02], [0.48, 2.02]],
      rail: [0.92, 0.94],
      inset: 0,
      bulge: 0.006,
      roofEdge: 0.06,
      roofCrown: 0.03,
      roofRound: 4,
      pillars: [-0.1, -0.9],
      glassEnd: 0.44,
    },
    cargo: {
      rise: [[1.22, 0], [1.08, 0.12], [0.9, 0.29], [0.7, 0.44], [0.5, 0.54], [0.28, 0.6], [0.05, 0.62], [-2.94, 0.62], [-3.08, 0.585]],
      roofEdge: 0.15,
      roofRound: 4,
      bumper: [0.42, 0.62, 0.08],
    },
    doors: [1.32, 0.42, 0.33, -0.97],
    handles: [0.55, 0.22],
    headlight: [0.66, 0.84, 0.24, 0.08],
    taillight: [0.9, 0.9, 0.065, 0.28],
    grille: [0.73, 0.42, 0.13],
    intake: [0.46, 0.5, 0.05],
    plates: [0.47, 0.78],
    bumperLine: [0.575, 0.62],
    bumpers: [[0.48, 0.07], [0.52, 0.1]],
    chrome: false,
    cladding: 0.56,
    mirrorScale: [1.3, 2.6, 1.1],
    sign: false,
    rails: false,
    rearWiper: false,
    tailStrip: false,
    barnDoors: [0.8, 2.34],
    slidingDoor: [0.33, -0.97, 2.28],
  },
};

export interface FleetStyle {
  hex: number;
  livery: number;
  metallic: number;
  trim: number;
  wheel: number;
}

const code = (livery = 0, metallic = 0, trim = 0, wheel = 0, hex = 0x3a4350): FleetStyle => ({ hex, livery, metallic, trim, wheel });

export const FLEET_STYLES: Readonly<Record<FourWheelVehicleKind, readonly FleetStyle[]>> = {
  sedan: [
    code(3, 0, 1, 1, 0x12151a),
    code(0, 1, 1, 0, 0xc8d0d8),
    code(4, 1, 2, 2, 0xe6eaef),
    code(0, 1, 1, 1, 0x1d3b6c),
    code(0, 1, 0, 2, 0x52575e),
    code(0, 1, 1, 0, 0x741d22),
    code(0, 0, 0, 0, 0xf2f4f7),
    code(4, 1, 2, 2, 0x285086),
    code(0, 1, 2, 3, 0x363b42),
    code(0, 1, 1, 0, 0x1c2026),
    code(0, 1, 0, 1, 0x9aa2ac),
    code(3, 1, 2, 2, 0x161a20),
  ],
  hatchback: [
    code(4, 1, 2, 2, 0x285086),
    code(4, 0, 2, 1, 0xd8322c),
    code(0, 1, 0, 0, 0xf2f4f7),
    code(0, 1, 2, 3, 0x464d56),
    code(4, 1, 2, 2, 0x2e6b58),
    code(0, 1, 1, 1, 0x98a4b0),
    code(4, 0, 2, 0, 0xe08d28),
    code(0, 1, 2, 3, 0x181c22),
  ],
  sports: [
    code(4, 1, 2, 2, 0xc62028),
    code(4, 1, 2, 2, 0x1e4a8c),
    code(4, 1, 2, 3, 0xe8ecf0),
    code(0, 1, 2, 2, 0x16191f),
    code(4, 0, 2, 2, 0xdf821c),
    code(0, 1, 2, 3, 0x565e68),
    code(4, 1, 2, 2, 0x235244),
    code(0, 1, 1, 1, 0xc4ccd4),
  ],
  taxi: [
    code(0, 0, 0, 0, 0xf4f5f2),
    code(2, 0, 0, 0, 0x4fae3a),
    code(0, 0, 1, 0, 0xf4f5f2),
    code(2, 0, 0, 1, 0x4fae3a),
  ],
  suv: [
    code(3, 1, 2, 3, 0x171b22),
    code(0, 1, 1, 0, 0xf0f3f7),
    code(4, 0, 2, 2, 0xe4e8ed),
    code(0, 1, 0, 2, 0x3a434d),
    code(0, 1, 1, 1, 0x20385c),
    code(0, 1, 0, 0, 0x28382e),
    code(4, 1, 2, 2, 0x682024),
    code(0, 1, 1, 0, 0xbec6cf),
  ],
  pickup: [
    code(0, 1, 1, 1, 0x14171b),
    code(0, 0, 1, 0, 0xf2f3f5),
    code(0, 1, 0, 2, 0x9da4ab),
    code(0, 1, 2, 3, 0x22385c),
    code(0, 1, 1, 1, 0x6d2326),
    code(0, 1, 2, 3, 0x484f56),
  ],
  minivan: [
    code(3, 1, 1, 1, 0x111419),
    code(0, 1, 1, 0, 0xf0f2f5),
    code(0, 1, 0, 1, 0xaab2bb),
    code(0, 1, 0, 2, 0x4a5058),
    code(0, 1, 1, 0, 0x26354f),
    code(0, 1, 1, 0, 0x5a1f24),
  ],
  van: [
    code(0, 0, 0, 0, 0xf3f5f8),
    code(0, 1, 0, 1, 0xb4bcc6),
    code(0, 1, 2, 0, 0x2a3d5a),
    code(0, 0, 2, 1, 0x3b414a),
  ],
  bus: [
    code(0, 0, 0, 0, 0x12305e), // InnerLink Green (slot 0)
    code(1, 0, 0, 0, 0x12305e), // CityLink Red (slot 1)
    code(2, 0, 0, 0, 0x12305e), // AT Metro Blue (slot 2)
    code(3, 0, 0, 0, 0x12305e), // OuterLink Amber (slot 3)
    code(4, 0, 0, 0, 0x12305e), // AT Metro Blue (slot 4)
    code(5, 0, 0, 0, 0x12305e), // TamakiLink Teal (slot 5)
  ],
  security: [code(1, 0, 0, 0, 0xf6f9fc)],
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function part(geometry: BufferGeometry, id: number): BufferGeometry {
  const g = geometry.index ? geometry : mergeVertices(geometry);
  const posCount = g.attributes.position!.count;
  if (!g.attributes.uv) {
    g.setAttribute("uv", new Float32BufferAttribute(new Float32Array(posCount * 2), 2));
  }
  g.setAttribute("partId", new BufferAttribute(new Float32Array(posCount).fill(id), 1));
  return g;
}

function mirrorSection(right: [number, number][], center: [number, number] | undefined, z: number): Vector3[] {
  const pts: Vector3[] = [];
  for (const [x, y] of right) pts.push(new Vector3(-x, y, z));
  if (center) pts.push(new Vector3(center[0], center[1], z));
  for (let i = right.length - 1; i >= 0; i--) pts.push(new Vector3(right[i]![0], right[i]![1], z));
  return pts;
}

function roundedRectShape(hw: number, hh: number, r: number): Shape {
  const s = new Shape();
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return s;
}

function roundedBox(hw: number, hh: number, depth: number, r: number, bevel = 0.012): BufferGeometry {
  const g = new ExtrudeGeometry(roundedRectShape(hw - bevel, hh - bevel, Math.max(0.002, r - bevel)), {
    depth: Math.max(0.001, depth - 2 * bevel),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    curveSegments: 2,
  });
  return g.translate(0, 0, -(depth - 2 * bevel) / 2);
}

// Monotone cubic (Fritsch-Carlson) interpolation through [x, y] control points: smooth, never overshoots.
function smoothCurve(points: readonly [number, number][]): (x: number) => number {
  const pts = points.slice().sort((a, b) => a[0] - b[0]);
  const n = pts.length;
  if (n === 1) return () => pts[0]![1];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(xs[i + 1]! - xs[i]!);
    d.push((ys[i + 1]! - ys[i]!) / h[i]!);
  }
  const m = [d[0]!];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1]! * d[i]! <= 0) m.push(0);
    else {
      const w1 = 2 * h[i]! + h[i - 1]!;
      const w2 = h[i]! + 2 * h[i - 1]!;
      m.push((w1 + w2) / (w1 / d[i - 1]! + w2 / d[i]!));
    }
  }
  m.push(d[n - 2]!);
  return (x: number) => {
    if (x <= xs[0]!) return ys[0]!;
    if (x >= xs[n - 1]!) return ys[n - 1]!;
    let i = 0;
    while (x > xs[i + 1]!) i++;
    const t = (x - xs[i]!) / h[i]!;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i]! + (t3 - 2 * t2 + t) * h[i]! * m[i]! + (-2 * t3 + 3 * t2) * ys[i + 1]! + (t3 - t2) * h[i]! * m[i + 1]!;
  };
}

function endFactor(z: number, zTip: number, length: number, exponent = 2): number {
  const u = zTip > 0 ? (z - (zTip - length)) / length : (zTip + length - z) / length;
  if (u <= 0) return 1;
  if (u >= 1) return 0;
  return Math.pow(1 - Math.pow(u, exponent), 1 / exponent);
}

interface ProfileBaseSpec {
  zFront: number;
  zRear: number;
  wheelRadius: number;
  wheelZ: number;
  archGap: number;
  archPower?: number;
  archFlare: number;
  tuck: number;
  lowerRound?: number;
  upperRound?: number;
  upperSamples?: number[];
  stationStep?: number;
  proxyStep?: number;
  halfWidth: [number, number][];
  sill: [number, number][];
  shoulder: [number, number][];
  edge: [number, number][];
  crown: [number, number][];
  tumble: [number, number][];
  nose: EndRounding;
  tail: EndRounding;
  noseRake?: RakeSpec;
  tailRake?: RakeSpec;
  cabin?: CabinSpec;
  _body?: (z: number) => BodySection;
  _rake?: ((x: number, y: number, z: number) => number) | null;
}

function bodyProfile(spec: ProfileBaseSpec): (z: number) => BodySection {
  if (spec._body) return spec._body;
  const W0 = smoothCurve(spec.halfWidth);
  const B0 = smoothCurve(spec.sill);
  const S0 = smoothCurve(spec.shoulder);
  const E0 = smoothCurve(spec.edge);
  const C0 = smoothCurve(spec.crown);
  const T0 = smoothCurve(spec.tumble);
  const archR = spec.wheelRadius + spec.archGap;
  const axles = [spec.wheelZ, -spec.wheelZ];

  const rounded = (z: number, value: number, key: keyof EndRounding) => {
    const nose = spec.nose[key];
    const tail = spec.tail[key];
    if (nose && z > 0) value = nose[1] + (value - nose[1]) * endFactor(z, spec.zFront, nose[0], nose[2]);
    if (tail && z < 0) value = tail[1] + (value - tail[1]) * endFactor(z, spec.zRear, tail[0], tail[2]);
    return value;
  };

  const body = (z: number): BodySection => {
    let flare = 0;
    for (const axle of axles) {
      const d = (z - axle) / (archR + 0.4);
      if (Math.abs(d) < 1) flare = Math.max(flare, (1 - d * d) ** 2);
    }
    const W = rounded(z, W0(z) + spec.archFlare * flare, "halfWidth");
    const ySill = rounded(z, B0(z), "sill");
    const archPow = spec.archPower || 2;
    let yB = ySill;
    for (const axle of axles) {
      const d = Math.abs(z - axle);
      if (d < archR) {
        yB = Math.max(yB, ySill + (spec.wheelRadius + archR - ySill) * Math.pow(1 - Math.pow(d / archR, archPow), 1 / archPow));
      }
    }
    const yE = rounded(z, E0(z), "edge");
    const yT = yE + Math.max(0, rounded(z, C0(z), "crown"));
    const yS = Math.min(Math.max(rounded(z, S0(z), "shoulder"), yB + 0.035), yE - 0.035);
    const xE = Math.max(W - T0(z), W * 0.55);
    return { z, W, yB, ySill, yS, yE, yT, xE, xB: W - spec.tuck };
  };
  spec._body = body;
  return body;
}

function carLayout(spec: CarBodySpec): CarLayout {
  if (spec._layout) return spec._layout;
  const body = bodyProfile(spec);
  const archR = spec.wheelRadius + spec.archGap;
  const cab = spec.cabin;
  const roofY = smoothCurve(cab.roofY);
  const H = cab.roofEdge + cab.roofCrown;
  const belt = (z: number) => {
    const s = body(z);
    return { x: s.xE - cab.inset, y: s.yE - 0.004 };
  };
  const bc = belt(cab.cowl);
  const bd = belt(cab.deck);
  const railF = { x: cab.rail[0], y: roofY(cab.roofFront) - H };
  const railR = { x: cab.rail[1], y: roofY(cab.roofRear) - H };
  const roofMid = (cab.roofFront + cab.roofRear) / 2;
  const railM = { x: (cab.rail[0] + cab.rail[1]) / 2, y: roofY(roofMid) - H };
  const hCowl = Math.max(0.006, body(cab.cowl).yT - bc.y - 0.008);
  const hDeck = Math.max(0.006, body(cab.deck).yT - bd.y - 0.008);

  const cabin = (z: number): CabinSection => {
    const b = belt(z);
    let railX: number;
    let railY: number;
    let h: number;
    if (z >= cab.roofFront) {
      const t = (cab.cowl - z) / (cab.cowl - cab.roofFront);
      railX = lerp(bc.x, railF.x, t);
      railY = lerp(bc.y, railF.y, t);
      h = lerp(hCowl, H, Math.min(1, t * 1.6));
    } else if (z <= cab.roofRear) {
      const t = (z - cab.deck) / (cab.roofRear - cab.deck);
      railX = lerp(bd.x, railR.x, t);
      railY = lerp(bd.y, railR.y, t);
      h = lerp(hDeck, H, Math.min(1, t * 1.6));
    } else {
      const t = (cab.roofFront - z) / (cab.roofFront - cab.roofRear);
      railX = lerp(railF.x, railR.x, t);
      railY = roofY(z) - H;
      h = H;
    }
    return { z, beltX: Math.max(b.x, railX), beltY: Math.min(b.y, railY), railX, railY, h, bulge: cab.bulge };
  };

  const cabinTop = (c: CabinSection, x: number) => {
    const n = cab.roofRound;
    const ratio = Math.min(1, Math.abs(x) / Math.max(c.railX, 1e-4));
    const th = Math.acos(Math.pow(ratio, n / 2));
    return c.railY + c.h * Math.pow(Math.sin(th), 2 / n);
  };

  spec._layout = { spec, body, cabin, cabinTop, archR, belt: { cowl: bc, deck: bd }, rail: { front: railF, mid: railM, rear: railR, roofMid } };
  return spec._layout;
}

const BODY_LOWER_ROUND = 2.8;
const BODY_UPPER_ROUND = 3.2;

function bodyHalfProfile(s: BodySection, detail: number, spec: Partial<ProfileBaseSpec> = {}): [number, number][] {
  const n1 = spec.lowerRound || BODY_LOWER_ROUND;
  const n2 = spec.upperRound || BODY_UPPER_ROUND;
  const right: [number, number][] = [];
  const low = detail ? [0, 0.32, 0.64, 1] : [0, 1];
  const up = detail ? spec.upperSamples || [0.38, 0.72, 1] : [1];
  const top = detail ? [0.66, 0.33] : [0.5];
  for (const a of low) {
    const th = (a * Math.PI) / 2;
    const y = s.yS - (s.yS - s.yB) * Math.pow(Math.cos(th), 2 / n1);
    const u = Math.min(1, Math.max(0, (s.yS - y) / Math.max(s.yS - s.ySill, 1e-4)));
    right.push([s.xB + (s.W - s.xB) * Math.pow(Math.max(0, 1 - Math.pow(u, n1)), 1 / n1), y]);
  }
  for (const a of up) {
    const th = (a * Math.PI) / 2;
    right.push([s.xE + (s.W - s.xE) * Math.pow(Math.cos(th), 2 / n2), s.yS + (s.yE - s.yS) * Math.pow(Math.sin(th), 2 / n2)]);
  }
  for (const f of top) right.push([s.xE * f, s.yE + (s.yT - s.yE) * (1 - f * f)]);
  return right;
}

function bodyStations(spec: ProfileBaseSpec, detail: number): number[] {
  const zs: number[] = [];
  const add = (z: number) => zs.push(Math.min(spec.zFront, Math.max(spec.zRear, z)));
  const cab = spec.cabin;
  const step = detail ? spec.stationStep || 0.28 : 0.75;
  if (!cab) {
    for (let z = spec.zRear; z < spec.zFront; z += step) add(z);
  }
  add(spec.zFront);
  add(spec.zRear);
  const noseLen = Math.max(...Object.values(spec.nose).map((v) => v[0]));
  const tailLen = Math.max(...Object.values(spec.tail).map((v) => v[0]));
  for (const u of detail ? [0, 0.3, 0.52, 0.7, 0.83, 0.92, 0.97, 0.993] : [0, 0.72]) {
    add(spec.zFront - noseLen * (1 - u));
    add(spec.zRear + tailLen * (1 - u));
  }
  const archR = spec.wheelRadius + spec.archGap;
  const k = detail ? 8 : 4;
  for (const axle of [spec.wheelZ, -spec.wheelZ]) {
    for (let i = 0; i <= k; i++) add(axle + archR * Math.cos((i / k) * Math.PI));
    if (!cab) {
      add(axle + archR + 0.006);
      add(axle - archR - 0.006);
    }
  }
  if (detail && cab) {
    add(cab.cowl);
    add(cab.deck);
  }
  zs.sort((a, b) => b - a);
  const eps = detail ? 0.004 : 0.04;
  const out: number[] = [];
  for (const z of zs) {
    if (!out.length || out[out.length - 1]! - z > eps) out.push(z);
  }
  out[0] = spec.zFront;
  out[out.length - 1] = spec.zRear;
  if (!cab) return out;
  const filled: number[] = [out[0]!];
  for (let i = 1; i < out.length; i++) {
    const a = out[i - 1]!;
    const b = out[i]!;
    const mid = (a + b) / 2;
    const gap = !detail ? spec.proxyStep || 0.75 : mid < cab.cowl - 0.1 && mid > cab.deck + 0.1 ? 0.5 : spec.stationStep || 0.27;
    const n = Math.ceil((a - b) / gap - 0.15);
    for (let j = 1; j < n; j++) filled.push(lerp(a, b, j / n));
    filled.push(b);
  }
  return filled;
}

function bodyRake(spec: ProfileBaseSpec): ((x: number, y: number, z: number) => number) | null {
  if (spec._rake !== undefined) return spec._rake;
  const ends = ([
    [spec.noseRake, spec.zFront, 1],
    [spec.tailRake, spec.zRear, -1],
  ] as const)
    .filter((x): x is readonly [RakeSpec, number, 1 | -1] => !!x[0])
    .map(([rake, tip, dir]) => ({ tip, dir, length: rake.length, plan: rake.plan || 0, setback: smoothCurve(rake.y) }));
  spec._rake = ends.length
    ? (x: number, y: number, z: number) => {
        for (const e of ends) {
          const u = ((z - e.tip) * e.dir + e.length) / e.length;
          if (u > 0) return z - e.dir * (e.setback(y) + e.plan * x * x) * u * u;
        }
        return z;
      }
    : null;
  return spec._rake;
}

function buildTipCap(
  right: [number, number][],
  top: number,
  z: number,
  rake: (x: number, y: number, z: number) => number,
  front: boolean,
  columns: number,
): BufferGeometry {
  const pos: number[] = [];
  const index: number[] = [];
  const row = columns + 1;
  for (let i = 0; i < right.length; i++) {
    const [x, y] = right[i]!;
    for (let j = 0; j <= columns; j++) {
      const px = x * ((2 * j) / columns - 1);
      pos.push(px, y, rake(i === 0 ? x : px, y, z));
    }
  }
  const apex = pos.length / 3;
  pos.push(0, top, rake(0, top, z));
  const tri = (a: number, b: number, c: number) => (front ? index.push(a, b, c) : index.push(a, c, b));
  for (let i = 0; i < right.length - 1; i++) {
    for (let j = 0; j < columns; j++) {
      const a = i * row + j;
      tri(a, a + 1, a + row + 1);
      tri(a, a + row + 1, a + row);
    }
  }
  const last = (right.length - 1) * row;
  for (let j = 0; j < columns; j++) tri(last + j, last + j + 1, apex);
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

function buildBodyLoft(spec: ProfileBaseSpec, detail = 1): BufferGeometry {
  const body = bodyProfile(spec);
  const rake = bodyRake(spec);
  const stations = bodyStations(spec, detail);
  const sections = stations.map((z) => {
    const s = body(z);
    const section = mirrorSection(bodyHalfProfile(s, detail, spec), [0, s.yT], z);
    if (rake) for (const p of section) p.z = rake(p.x, p.y, z);
    return section;
  });
  if (!rake) return new LoftGeometry(sections, { capStart: true, capEnd: true });
  const loft = new LoftGeometry(sections, { closed: false });
  const under = new LoftGeometry(sections.map((sec) => [sec[sec.length - 1]!, sec[0]!]), { closed: false });
  const cols = detail ? 4 : 1;
  const ring = sections[0]!.length;
  const row = cols + 1;
  const nRight = (ring - 1) / 2;
  const lNorm = loft.attributes.normal!;
  const caps = [0, stations.length - 1].map((si) => {
    const s = body(stations[si]!);
    const cap = buildTipCap(bodyHalfProfile(s, detail, spec), s.yT, stations[si]!, rake, si === 0, cols);
    const cNorm = cap.attributes.normal!;
    const base = si * ring;
    const blend = (li: number, ci: number) => {
      const nx = lNorm.getX(li) + cNorm.getX(ci);
      const ny = lNorm.getY(li) + cNorm.getY(ci);
      const nz = lNorm.getZ(li) + cNorm.getZ(ci);
      const len = Math.hypot(nx, ny, nz) || 1;
      lNorm.setXYZ(li, nx / len, ny / len, nz / len);
      cNorm.setXYZ(ci, nx / len, ny / len, nz / len);
    };
    for (let i = 1; i < nRight; i++) {
      blend(base + i, i * row);
      blend(base + ring - 1 - i, i * row + cols);
    }
    blend(base + nRight, nRight * row);
    return part(cap, CAR_PARTS.BODY);
  });
  return mergeGeometries([part(loft, CAR_PARTS.BODY), ...caps, part(under, CAR_PARTS.TRIM)]);
}

function cabinSection(c: CabinSection, detail: number, roundness: number): Vector3[] {
  const right: [number, number][] = [[c.beltX, c.beltY]];
  if (detail) {
    for (const s of [1 / 3, 2 / 3]) {
      right.push([lerp(c.beltX, c.railX, s) + c.bulge * 4 * s * (1 - s), lerp(c.beltY, c.railY, s)]);
    }
  }
  right.push([c.railX, c.railY]);
  for (const f of detail ? [0.2, 0.42, 0.68] : [0.5]) {
    const th = (f * Math.PI) / 2;
    right.push([c.railX * Math.pow(Math.cos(th), 2 / roundness), c.railY + c.h * Math.pow(Math.sin(th), 2 / roundness)]);
  }
  return mirrorSection(right, [0, c.railY + c.h], c.z);
}

function cabinStations(spec: CarBodySpec, detail: number): number[] {
  const cab = spec.cabin;
  const zs: number[] = [];
  for (const t of detail ? [0, 0.1, 0.24, 0.42, 0.62, 0.82] : [0, 0.5]) zs.push(lerp(cab.cowl, cab.roofFront, t));
  for (const t of detail ? [0, 0.25, 0.5, 0.75] : [0, 0.5]) zs.push(lerp(cab.roofFront, cab.roofRear, t));
  for (const t of detail ? [1, 0.8, 0.6, 0.4, 0.22, 0.1, 0] : [1, 0.5, 0]) zs.push(lerp(cab.deck, cab.roofRear, t));
  return zs;
}

function buildCargoCabin(spec: CarBodySpec, detail = 1): BufferGeometry {
  const L = carLayout(spec);
  const cab = spec.cabin;
  const cargo = spec.cargo!;
  const rise = smoothCurve(cargo.rise);
  const fullRise = Math.max(...cargo.rise.map((p) => p[1]));
  const H = cab.roofEdge + cab.roofCrown;
  const rr = L.rail.rear;
  const bR = L.body(cab.roofRear);
  const lean = (bR.xE - cab.inset - rr.x) / (rr.y - (bR.yE - 0.004));
  const n = cargo.roofRound;
  const section = (z: number) => {
    let c: { beltX: number; beltY: number; railX: number; railY: number; h: number; bulge: number };
    if (z >= cab.roofRear) {
      c = L.cabin(z);
    } else {
      const s = L.body(z);
      const beltX = s.xE - cab.inset;
      const beltY = s.yE - 0.004;
      c = { beltX, beltY, railX: beltX - (rr.y - beltY) * lean, railY: rr.y, h: H, bulge: cab.bulge };
    }
    const up = z < cab.roofFront ? rise(z) : 0;
    const hR = lerp(c.h, cargo.roofEdge, Math.min(1, up / fullRise));
    const top = c.railY + c.h + up;
    const sy = top - hR;
    const sx = c.railX - (sy - c.railY) * lean;
    const round = (f: number, x: number, y: number): [number, number] => {
      const th = (f * Math.PI) / 2;
      return [x * Math.pow(Math.cos(th), 2 / n), y + hR * Math.pow(Math.sin(th), 2 / n)];
    };
    const right: [number, number][] = [[c.beltX, c.beltY]];
    if (detail) {
      for (const t of [1 / 3, 2 / 3]) {
        right.push([lerp(c.beltX, c.railX, t) + c.bulge * 4 * t * (1 - t), lerp(c.beltY, c.railY, t)]);
      }
      right.push([c.railX, c.railY]);
      const k = Math.min(1, up / 0.05);
      const r0 = round(0.1, sx, sy);
      right.push([lerp(r0[0], sx, k), lerp(r0[1], sy, k)]);
    } else {
      right.push([sx, sy]);
    }
    for (const f of detail ? [0.2, 0.42, 0.68] : [0.5]) right.push(round(f, sx, sy));
    return mirrorSection(right, [0, top], z);
  };
  const zr = spec.zRear;
  const knots = cargo.rise.map((p) => p[0]).filter((z) => z > zr);
  const capEnd = cargo.rise.find((p) => p[1] === fullRise)![0];
  const zs = detail
    ? [...[0, 0.12, 0.3, 0.55, 0.8].map((t) => lerp(cab.cowl, cab.roofFront, t)), ...knots, zr + 0.045, zr + 0.015, zr]
    : [cab.cowl, cab.roofFront, lerp(cab.roofFront, capEnd, 0.4), capEnd, zr];
  const parts = [part(new LoftGeometry(zs.map(section), { closed: false, capEnd: true }), CAR_PARTS.WINDOW)];
  if (detail) {
    const [bottom, top, depth] = cargo.bumper;
    const outline = roundedRectShape(L.body(zr + 0.1).W, depth, depth * 0.9);
    const bumper = new ExtrudeGeometry(outline, { depth: top - bottom, bevelEnabled: false, curveSegments: 2 })
      .rotateX(Math.PI / 2)
      .translate(0, top, zr);
    parts.push(part(bumper, CAR_PARTS.TRIM));
  }
  return mergeGeometries(parts);
}

function buildCarCabin(spec: CarBodySpec, detail = 1): BufferGeometry {
  if (spec.cargo) return buildCargoCabin(spec, detail);
  const L = carLayout(spec);
  const sections = cabinStations(spec, detail).map((z) => cabinSection(L.cabin(z), detail, spec.cabin.roofRound));
  return part(new LoftGeometry(sections, { closed: false }), CAR_PARTS.WINDOW);
}

const WHEEL_SEGMENTS = 18;

function buildWheelParts(spec: { wheelRadius: number; wheelX: number; archGap: number; sill: [number, number][]; archPower?: number }, side: -1 | 1): BufferGeometry[] {
  const r = spec.wheelRadius;
  const rim = r * 0.68;
  const width = r * 0.68;
  const bead = rim + 0.006;
  const hubR = rim * 0.3;
  const tyre = new LatheGeometry(
    [
      new Vector2(bead, -width * 0.42),
      new Vector2(r * 0.86, -width * 0.5),
      new Vector2(r, -width * 0.33),
      new Vector2(r, width * 0.33),
      new Vector2(r * 0.86, width * 0.5),
      new Vector2(bead, width * 0.42),
    ],
    WHEEL_SEGMENTS,
  );
  const face = new LatheGeometry(
    [new Vector2(bead, width * 0.42), new Vector2(rim - 0.01, width * 0.4), new Vector2(hubR, width * 0.25)],
    WHEEL_SEGMENTS,
  );
  const cap = new CircleGeometry(hubR, WHEEL_SEGMENTS, -Math.PI / 2);
  cap.attributes.position!.setZ(0, 0.012);
  cap.computeVertexNormals();
  cap.rotateX(-Math.PI / 2).translate(0, width * 0.25, 0);
  const back = new CircleGeometry((bead + 0.003) / Math.cos(Math.PI / 9), 9)
    .rotateX(Math.PI / 2)
    .translate(0, -width * 0.4, 0);

  const list = [part(tyre, CAR_PARTS.TYRE), part(face, CAR_PARTS.ALLOY), part(cap, CAR_PARTS.ALLOY), part(back, CAR_PARTS.TRIM)];
  for (const g of list) g.rotateZ(-side * Math.PI * 0.5);
  return list;
}

function buildSteerableWheelGeo(spec: CarBodySpec, side: -1 | 1): BufferGeometry {
  return mergeGeometries(buildWheelParts(spec, side));
}

function buildCarWheelWellLiners(spec: CarBodySpec): BufferGeometry {
  const r = spec.wheelRadius;
  const archR = r + spec.archGap;
  const width = r * 0.68;
  const y0 = spec.sill[1]![1];
  const rx = archR + 0.015;
  const ry = r + archR - y0 + 0.015;
  const archPow = spec.archPower || 2;
  const pieces: BufferGeometry[] = [];
  for (const side of [-1, 1] as const) {
    const x = side * (spec.wheelX - (width * 0.5 + 0.02));
    for (const z of [-spec.wheelZ, spec.wheelZ]) {
      for (const rotY of [side * Math.PI * 0.5, -side * Math.PI * 0.5]) {
        const geo = new CircleGeometry(1, 10, 0, Math.PI);
        if (archPow !== 2) {
          const pos = geo.attributes.position!;
          for (let i = 1; i < pos.count; i++) {
            const u = Math.min(1, Math.abs(pos.getX(i)));
            pos.setY(i, Math.pow(1 - Math.pow(u, archPow), 1 / archPow));
          }
        }
        pieces.push(part(geo.scale(rx, ry, 1).rotateY(rotY).translate(x, y0, z), CAR_PARTS.TRIM));
      }
    }
  }
  return mergeGeometries(pieces);
}

function buildMirrors(spec: CarBodySpec): BufferGeometry[] {
  const L = carLayout(spec);
  const z = spec.cabin.cowl - 0.17;
  const c = L.cabin(z);
  const [sx, sy, sz] = spec.mirrorScale || [1, 1, 1];
  const list: BufferGeometry[] = [];
  for (const side of [-1, 1] as const) {
    const housing = roundedBox(0.1, 0.06, 0.085, 0.035, 0.014)
      .scale(sx, sy, sz)
      .rotateY(side * 0.12)
      .translate(side * (c.beltX + 0.15), c.beltY + 0.085, z - 0.02);
    const arm = new BoxGeometry(0.12, 0.035, 0.06)
      .rotateZ(side * 0.35)
      .translate(side * (c.beltX + 0.04), c.beltY + 0.045, z);
    list.push(part(housing, CAR_PARTS.MIRROR), part(arm, CAR_PARTS.TRIM));
  }
  return list;
}

function buildRoofRails(spec: CarBodySpec): BufferGeometry[] {
  const L = carLayout(spec);
  const cab = spec.cabin;
  const list: BufferGeometry[] = [];
  for (const side of [-1, 1] as const) {
    const sections = [0.04, 0.1, 0.9, 0.96].map((t, i) => {
      const z = lerp(cab.roofFront, cab.roofRear, t);
      const c = L.cabin(z);
      const x = side * c.railX * 0.8;
      const y = L.cabinTop(c, x) + (i === 0 || i === 3 ? 0.004 : 0.05);
      return [
        new Vector3(x - 0.02, y - 0.016, z),
        new Vector3(x + 0.02, y - 0.016, z),
        new Vector3(x + 0.02, y + 0.016, z),
        new Vector3(x - 0.02, y + 0.016, z),
      ].reverse();
    });
    list.push(part(new LoftGeometry(sections, { capStart: true, capEnd: true }), CAR_PARTS.TRIM));
  }
  return list;
}

function taxiSignPlacement(spec: CarBodySpec): { z: number; y: number } {
  const L = carLayout(spec);
  const cab = spec.cabin;
  const z = lerp(cab.roofFront, cab.roofRear, 0.45);
  const c = L.cabin(z);
  return { z, y: c.railY + c.h };
}

function buildTaxiSign(spec: CarBodySpec): BufferGeometry[] {
  const { z, y } = taxiSignPlacement(spec);
  const shape = new Shape();
  const hw0 = 0.3;
  const hw1 = 0.27;
  const h = 0.15;
  const r = 0.035;
  shape.moveTo(-hw0, 0);
  shape.lineTo(hw0, 0);
  shape.lineTo(hw1, h - r);
  shape.quadraticCurveTo(hw1 - 0.004, h, hw1 - r, h);
  shape.lineTo(-hw1 + r, h);
  shape.quadraticCurveTo(-hw1 + 0.004, h, -hw1, h - r);
  shape.lineTo(-hw0, 0);
  const sign = new ExtrudeGeometry(shape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 3,
  }).translate(0, y + 0.03, z - 0.06);
  const mount = new BoxGeometry(0.46, 0.04, 0.12).translate(0, y + 0.012, z);
  return [part(sign, CAR_PARTS.SIGN), part(mount, CAR_PARTS.TRIM)];
}

function buildBedCover(spec: CarBodySpec): BufferGeometry[] {
  const body = bodyProfile(spec);
  const zs = [spec.cabin.deck - 0.01, spec.zRear + 0.42, spec.zRear + 0.08];
  const sections = zs.map((z) => {
    const s = body(z);
    const x = s.xE - 0.045;
    const y = s.yE + 0.014;
    return [
      [-x, y],
      [-x + 0.006, y + 0.032],
      [-x + 0.056, y + 0.032],
      [-x + 0.068, y + 0.02],
      [x - 0.068, y + 0.02],
      [x - 0.056, y + 0.032],
      [x - 0.006, y + 0.032],
      [x, y],
    ].map(([px, py]) => new Vector3(px, py, z));
  });
  return [part(new LoftGeometry(sections, { closed: false, capStart: false, capEnd: true }), CAR_PARTS.TRIM)];
}

function buildCarChassisGeometry(spec: CarBodySpec): BufferGeometry {
  const rawBody = buildBodyLoft(spec, 1);
  const parts: BufferGeometry[] = [rawBody.getAttribute("partId") ? rawBody : part(rawBody, CAR_PARTS.BODY), buildCarCabin(spec, 1), ...buildMirrors(spec)];
  if (spec.rails) parts.push(...buildRoofRails(spec));
  if (spec.bedCover) parts.push(...buildBedCover(spec));
  if (spec.sign) parts.push(...buildTaxiSign(spec));
  return mergeGeometries(parts);
}

function buildLightbarGeometry(spec: CarBodySpec = SEDAN_SPEC): BufferGeometry {
  const L = carLayout(spec);
  const cab = spec.cabin;
  const z = lerp(cab.roofFront, cab.roofRear, 0.32);
  const c = L.cabin(z);
  const y = c.railY + c.h;
  const bar = roundedBox(0.13, 0.045, 1.12, 0.04, 0.02).rotateY(Math.PI / 2).translate(0, y + 0.075, z);
  const parts: BufferGeometry[] = [part(bar, CAR_PARTS.SIGN)];
  for (const side of [-1, 1] as const) {
    parts.push(part(new BoxGeometry(0.06, 0.05, 0.16).translate(side * 0.42, y + 0.02, z), CAR_PARTS.TRIM));
  }
  return mergeGeometries(parts);
}

// ---------------------------------------------------------------------------------------------
// Auckland Transit Bus Geometry (ported from slop-auckland/js/bus.js, scaled by BUS_SCALE = 0.88)
// ---------------------------------------------------------------------------------------------

const BUS_SPEC: ProfileBaseSpec = {
  zFront: 5.9,
  zRear: -6.22,
  wheelRadius: 0.5,
  wheelZ: 3.6,
  archGap: 0.085,
  archFlare: 0.012,
  tuck: 0.035,
  stationStep: 0.92,
  lowerRound: 3.4,
  upperRound: 7.5,
  upperSamples: [0.35, 0.66, 0.89, 1],
  halfWidth: [[5.9, 1.3], [-6.22, 1.3]],
  sill: [[5.9, 0.35], [-6.22, 0.36]],
  shoulder: [[5.9, 0.98], [-6.22, 0.98]],
  edge: [[5.9, 2.94], [-6.22, 2.94]],
  crown: [[5.9, 0.04], [-6.22, 0.04]],
  tumble: [[5.9, 0.055], [-6.22, 0.055]],
  nose: { halfWidth: [0.28, 1.06, 2.2], edge: [0.26, 2.74, 2], crown: [0.26, 0.006, 2], sill: [0.08, 0.42, 2], shoulder: [0.2, 0.92, 2] },
  tail: { halfWidth: [0.22, 1.12, 2.2], edge: [0.2, 2.78, 2], crown: [0.2, 0.006, 2], sill: [0.1, 0.46, 2], shoulder: [0.18, 0.94, 2] },
};
const BUS_WHEEL_X = 1.12;
const BUS_RAKE = 0.22;

function busRake(y: number, z: number, x = 0): number {
  const s = BUS_SPEC;
  const alongF = Math.min(1, Math.max(0, (z - (s.zFront - 1.15)) / 1.15));
  const upF = Math.min(1, Math.max(0, (y - 1.1) / 1.72));
  const noseBow = alongF * alongF * (0.028 * x * x + Math.max(0, 1.12 - y) * 0.035);
  const alongR = Math.min(1, Math.max(0, (s.zRear + 0.75 - z) / 0.75));
  const upR = Math.min(1, Math.max(0, (y - 1.38) / 1.5));
  const tailTaper = -0.055 * alongR * alongR * Math.pow(upR, 1.25);
  return BUS_RAKE * alongF * alongF * Math.pow(upF, 1.22) + noseBow + tailTaper;
}

function busBodyHalfWidthAt(z: number, y: number): number {
  const s = bodyProfile(BUS_SPEC)(z);
  const n1 = BUS_SPEC.lowerRound || BODY_LOWER_ROUND;
  const n2 = BUS_SPEC.upperRound || BODY_UPPER_ROUND;
  const pts: [number, number][] = [];
  for (let i = 0; i <= 16; i++) {
    const th = ((i / 16) * Math.PI) / 2;
    pts.push([s.xB + (s.W - s.xB) * Math.pow(Math.sin(th), 2 / n1), s.yS - (s.yS - s.yB) * Math.pow(Math.cos(th), 2 / n1)]);
  }
  for (let i = 1; i <= 16; i++) {
    const th = ((i / 16) * Math.PI) / 2;
    pts.push([s.xE + (s.W - s.xE) * Math.pow(Math.cos(th), 2 / n2), s.yS + (s.yE - s.yS) * Math.pow(Math.sin(th), 2 / n2)]);
  }
  if (y <= pts[0]![1]) return pts[0]![0];
  for (let i = 1; i < pts.length; i++) {
    if (y <= pts[i]![1]) {
      const t = (y - pts[i - 1]![1]) / Math.max(pts[i]![1] - pts[i - 1]![1], 1e-6);
      return lerp(pts[i - 1]![0], pts[i]![0], t);
    }
  }
  return s.xE;
}

function buildLoftedBusChassisGeometry(): BufferGeometry {
  const s = BUS_SPEC;
  const body = buildBodyLoft(s, 1);
  const pos = body.attributes.position!;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    pos.setZ(i, z - busRake(y, z, x));
  }
  body.computeVertexNormals();
  const parts: BufferGeometry[] = [part(body, BUS_PARTS.BODY)];

  const roofY = s.edge[0]![1] + s.crown[0]![1] - 0.03;
  const fairingStations = [
    [4.68, 0.92, 0.01, 0.005],
    [4.12, 1.08, 0.22, 0.035],
    [3.35, 1.13, 0.26, 0.04],
    [-0.35, 1.13, 0.26, 0.04],
    [-0.85, 1.12, 0.2, 0.035],
    [-5.55, 1.11, 0.19, 0.035],
    [-5.95, 0.98, 0.02, 0.008],
  ] as const;
  const fairingSections = fairingStations.map(([z, hw, h, cr]) =>
    mirrorSection(
      [
        [hw, roofY],
        [hw - 0.035, roofY + h * 0.68],
        [hw - 0.12, roofY + h],
        [hw * 0.45, roofY + h + cr * 0.8],
      ],
      [0, roofY + h + cr],
      z,
    ),
  );
  parts.push(part(new LoftGeometry(fairingSections, { closed: false }), BUS_PARTS.FAIRING));
  parts.push(part(roundedBox(0.88, 0.065, 2.5, 0.08, 0.025).translate(0, roofY + 0.22, -3.35), BUS_PARTS.POD));
  parts.push(part(roundedBox(0.84, 0.06, 2.7, 0.08, 0.025).translate(0, roofY + 0.27, 1.45), BUS_PARTS.POD));

  // Front & rear bumpers + folded front bike rack
  const zNose = s.zFront - busRake(0.48, s.zFront, 0);
  parts.push(part(roundedBox(1.27, 0.13, 0.26, 0.075, 0.028).translate(0, 0.47, zNose - 0.02), BUS_PARTS.TRIM));
  parts.push(part(roundedBox(1.26, 0.125, 0.24, 0.065, 0.028).translate(0, 0.46, s.zRear + 0.03), BUS_PARTS.TRIM));
  const rackZ = zNose + 0.14;
  parts.push(part(roundedBox(0.54, 0.022, 0.045, 0.018, 0.007).translate(0, 0.96, rackZ + 0.03), BUS_PARTS.TRIM));
  parts.push(part(roundedBox(0.5, 0.02, 0.045, 0.016, 0.007).translate(0, 0.68, rackZ), BUS_PARTS.TRIM));
  for (const side of [-1, 1] as const) {
    parts.push(part(new BoxGeometry(0.032, 0.34, 0.032).rotateX(-0.1).translate(side * 0.49, 0.81, rackZ + 0.015), BUS_PARTS.TRIM));
    parts.push(part(new BoxGeometry(0.024, 0.28, 0.024).rotateX(-0.1).translate(side * 0.18, 0.81, rackZ + 0.015), BUS_PARTS.TRIM));
    const mountY = side < 0 ? 2.48 : 2.16;
    const headY = side < 0 ? 2.28 : 1.98;
    const stalk = new BoxGeometry(0.036, 0.036, 0.44).rotateX(0.32).rotateY(side * 0.42).translate(side * 1.27, mountY - 0.06, s.zFront - 0.06);
    const head = roundedBox(0.072, 0.19, 0.055, 0.026, 0.01).translate(side * 1.37, headY, s.zFront + 0.08);
    parts.push(part(stalk, BUS_PARTS.TRIM), part(head, BUS_PARTS.TRIM));
  }
  const merged = mergeGeometries(parts);
  merged.scale(BUS_SCALE, BUS_SCALE, BUS_SCALE);
  return merged;
}

function buildBusWheelWellLiners(): BufferGeometry {
  const s = BUS_SPEC;
  const wellR = s.wheelRadius + s.archGap + 0.008;
  const wellDepth = 0.36;
  const parts: BufferGeometry[] = [];
  for (const side of [-1, 1] as const) {
    for (const z of [-s.wheelZ, s.wheelZ]) {
      const cyl = new CylinderGeometry(wellR, wellR, wellDepth, 10, 1, true, -0.28, Math.PI + 0.56)
        .scale(-1, 1, 1)
        .rotateZ(-Math.PI * 0.5)
        .translate(side * (BUS_WHEEL_X - 0.02), s.wheelRadius, z);
      const backOut = new CircleGeometry(wellR, 10, -0.28, Math.PI + 0.56)
        .rotateY(side * Math.PI * 0.5)
        .translate(side * (BUS_WHEEL_X - 0.19), s.wheelRadius, z);
      const backIn = new CircleGeometry(wellR, 10, -0.28, Math.PI + 0.56)
        .rotateY(-side * Math.PI * 0.5)
        .translate(side * (BUS_WHEEL_X - 0.19), s.wheelRadius, z);
      parts.push(part(cyl, BUS_PARTS.TRIM), part(backOut, BUS_PARTS.TRIM), part(backIn, BUS_PARTS.TRIM));
    }
  }
  const merged = mergeGeometries(parts);
  merged.scale(BUS_SCALE, BUS_SCALE, BUS_SCALE);
  return merged;
}

function buildBusSignGeometry(): BufferGeometry {
  const s = BUS_SPEC;
  const panels: BufferGeometry[] = [];
  const yF = 2.56;
  const z0 = s.zFront - busRake(yF - 0.13, s.zFront, 0);
  const z1 = s.zFront - busRake(yF + 0.13, s.zFront, 0);
  const front = new PlaneGeometry(1.94, 0.27);
  front.rotateX(-Math.atan2(z0 - z1, 0.26));
  front.translate(0, yF, (z0 + z1) * 0.5 + 0.014);
  panels.push(front);

  const sideZ = 3.74;
  const sideY = 2.26;
  const side = new PlaneGeometry(1.08, 0.19).rotateY(-Math.PI / 2);
  side.translate(-(busBodyHalfWidthAt(sideZ, sideY) + 0.007), sideY, sideZ);
  panels.push(side);

  const yR = 2.58;
  const zR0 = s.zRear - busRake(yR - 0.1, s.zRear, -0.45);
  const zR1 = s.zRear - busRake(yR + 0.1, s.zRear, -0.45);
  const rear = new PlaneGeometry(0.52, 0.21);
  const uv = rear.attributes.uv!;
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 0.29);
  rear.rotateY(Math.PI);
  rear.rotateX(Math.atan2(zR1 - zR0, 0.2));
  rear.translate(-0.45, yR, (zR0 + zR1) * 0.5 - 0.012);
  panels.push(rear);

  const merged = mergeGeometries(panels);
  merged.scale(BUS_SCALE, BUS_SCALE, BUS_SCALE);
  return merged;
}

function buildBusWheelGeo(side: -1 | 1): BufferGeometry {
  const r = BUS_SPEC.wheelRadius;
  const w = 0.3;
  const rimR = r * 0.59;
  const tyre = new LatheGeometry(
    [
      new Vector2(rimR, -w * 0.48),
      new Vector2(r * 0.95, -w * 0.44),
      new Vector2(r, -w * 0.28),
      new Vector2(r, w * 0.28),
      new Vector2(r * 0.95, w * 0.44),
      new Vector2(rimR, w * 0.48),
    ],
    22,
  );
  const disc = new LatheGeometry(
    [new Vector2(rimR, w * 0.48), new Vector2(rimR * 0.92, w * 0.42), new Vector2(rimR * 0.72, w * 0.18), new Vector2(0.115, w * 0.22)],
    22,
  );
  const backDisc = new LatheGeometry([new Vector2(0, -w * 0.18), new Vector2(rimR * 0.75, -w * 0.18), new Vector2(rimR, -w * 0.48)], 14);
  const cap = new CylinderGeometry(0.095, 0.118, 0.13, 14).translate(0, w * 0.26, 0);
  const parts = [part(tyre, CAR_PARTS.TYRE), part(disc, CAR_PARTS.ALLOY), part(backDisc, CAR_PARTS.ALLOY), part(cap, CAR_PARTS.ALLOY)];
  for (const g of parts) g.rotateZ(-side * Math.PI * 0.5);
  const merged = mergeGeometries(parts);
  merged.scale(BUS_SCALE, BUS_SCALE, BUS_SCALE);
  return merged;
}

// ---------------------------------------------------------------------------------------------
// Shared Textures & Environment Map
// ---------------------------------------------------------------------------------------------

const _tmpCol = new Color();
/** Converts an sRGB hex literal to linear GLSL vec3(...) so Three.js tone mapping & sRGB output match TSL. */
function glCol(hex: number): string {
  _tmpCol.setHex(hex);
  return `vec3(${_tmpCol.r.toFixed(4)}, ${_tmpCol.g.toFixed(4)}, ${_tmpCol.b.toFixed(4)})`;
}

let sharedEnvMap: DataTexture | undefined;
export function getSlopVehicleEnvMap(): DataTexture {
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
    const v = 1 - y / (H - 1);
    const elev = (v - 0.5) * Math.PI;
    const sinE = Math.sin(elev);
    for (let x = 0; x < W; x++) {
      const az = (x / W) * Math.PI * 2;
      if (sinE >= 0) {
        tmp.copy(skyHorizon).lerp(skyTop, Math.pow(sinE, 0.52));
        const sunDot = Math.max(0, Math.sin(elev) * 0.62 + Math.cos(elev) * Math.cos(az - 2.2) * 0.78);
        tmp.lerp(sunGlow, Math.pow(sunDot, 16) * 0.85);
      } else {
        tmp.copy(groundRim).lerp(roadDark, Math.min(1, Math.pow(-sinE, 0.45)));
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
export function getSlopShadowTex(): DataTexture {
  if (sharedShadowTex) return sharedShadowTex;
  const N = 64;
  const data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) {
    const ny = (y / (N - 1)) * 2 - 1;
    for (let x = 0; x < N; x++) {
      const nx = (x / (N - 1)) * 2 - 1;
      const d = Math.pow(Math.pow(Math.abs(nx), 2.6) + Math.pow(Math.abs(ny), 2.6), 1 / 2.6);
      const a = Math.max(0, Math.min(1, (1 - d) / 0.34));
      const smooth = a * a * (3 - 2 * a) * 0.58;
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

let _plateTex: CanvasTexture | DataTexture | undefined;
function getPlateTexture(): CanvasTexture | DataTexture {
  if (_plateTex) return _plateTex;
  if (typeof document === "undefined") {
    const tex = new DataTexture(new Uint8Array(4 * 4 * 4).fill(235), 4, 4, RGBAFormat, UnsignedByteType);
    tex.colorSpace = SRGBColorSpace;
    tex.needsUpdate = true;
    _plateTex = tex;
    return tex;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const rows = ["QKM482", "NTL917", "PXD305", "RHA640"];
  rows.forEach((label, row) => {
    const y0 = row * 64;
    ctx.fillStyle = "#16181a";
    ctx.fillRect(0, y0, 128, 64);
    ctx.fillStyle = "#f3f3ee";
    ctx.fillRect(3, y0 + 3, 122, 58);
    ctx.fillStyle = "#121416";
    ctx.font = "bold 30px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 64, y0 + 34, 112);
  });
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  _plateTex = tex;
  return tex;
}

let _busSignTex: CanvasTexture | DataTexture | undefined;
function getBusSignTexture(): CanvasTexture | DataTexture {
  if (_busSignTex) return _busSignTex;
  if (typeof document === "undefined") {
    const tex = new DataTexture(new Uint8Array(4 * 4 * 4).fill(200), 4, 4, RGBAFormat, UnsignedByteType);
    tex.colorSpace = SRGBColorSpace;
    tex.needsUpdate = true;
    _busSignTex = tex;
    return tex;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#090b10";
  ctx.fillRect(0, 0, 512, 512);
  const routes: readonly [string, string, string, string][] = [
    ["INN", "INNER LINK / CITY", "#00a651", "#ff9d1c"],
    ["CTY", "CITY LINK / QUEEN ST", "#e2231a", "#ff9d1c"],
    ["NX1", "NORTHERN EXPRESS", "#0058b8", "#46d8ff"],
    ["OUT", "OUTER LINK / GRAFTON", "#f7941d", "#ff9d1c"],
    ["70", "BOTANY / SYMONDS ST", "#0058b8", "#ff9d1c"],
    ["TMK", "TAMAKI LINK / UNI", "#00b5cc", "#46d8ff"],
    ["18", "NEW LYNN / UNI", "#0058b8", "#ff9d1c"],
    ["75", "GLEN INNES / UNI", "#0058b8", "#ff9d1c"],
  ];
  routes.forEach(([route, dest, badgeBg, textCol], idx) => {
    const y0 = idx * 64;
    ctx.fillStyle = "#0b0e14";
    ctx.fillRect(6, y0 + 8, 500, 48);
    ctx.fillStyle = badgeBg;
    ctx.fillRect(12, y0 + 11, 126, 42);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(route, 75, y0 + 33, 116);
    ctx.fillStyle = textCol;
    ctx.font = "800 24px monospace";
    ctx.textAlign = "left";
    ctx.fillText(dest, 152, y0 + 33, 346);
  });
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  _busSignTex = tex;
  return tex;
}

// ---------------------------------------------------------------------------------------------
// WebGL2 GLSL SDF Shader Builders (1-to-1 Translation of slop-auckland TSL Shaders)
// ---------------------------------------------------------------------------------------------

function polygonPlanes(points: readonly [number, number][], margins: readonly number[]): [number, number, number][] {
  const planes: [number, number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i]!;
    const [bx, by] = points[(i + 1) % points.length]!;
    const len = Math.hypot(bx - ax, by - ay);
    const nx = (by - ay) / len;
    const ny = -(bx - ax) / len;
    planes.push([nx, ny, ax * nx + ay * ny - margins[i]!]);
  }
  return planes;
}

function glslPolygonEdge(fnName: string, planes: readonly [number, number, number][], k: number): string {
  let body = "";
  planes.forEach(([nx, ny, c], i) => {
    const eVar = `e${i}`;
    const wVar = `we${i}`;
    body += `  float ${eVar} = px * (${nx.toFixed(6)}) + py * (${ny.toFixed(6)}) - (${c.toFixed(6)});\n`;
    body += `  float ${wVar} = fu * ${(Math.abs(nx)).toFixed(6)} + fv * ${(Math.abs(ny)).toFixed(6)};\n`;
    if (i === 0) {
      body += `  float d = ${eVar}; float w = ${wVar}; float nearest = ${eVar};\n`;
    } else {
      body += `  d = slopSmax(d, ${eVar}, ${k.toFixed(4)});\n`;
      body += `  w = mix(w, ${wVar}, step(nearest, ${eVar}));\n`;
      body += `  nearest = max(nearest, ${eVar});\n`;
    }
  });
  return `vec2 ${fnName}(float px, float py, float fu, float fv) {\n${body}  return vec2(d, w);\n}\n`;
}

const SLOP_GLSL_COMMON = /* glsl */ `
float slopSmax(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return max(a, b) + h * h * k * 0.25;
}
float slopCov(float d, float w) {
  return smoothstep(w * 0.5, -w * 0.5, d);
}
float slopBand(float d, float h, float w) {
  return clamp((min(d + h, w * 0.5) - max(d - h, -w * 0.5)) / w, 0.0, 1.0);
}
vec2 slopRrectEdge(vec2 pt, vec2 hs, float rad, vec2 fw2) {
  vec2 q = abs(pt) - hs + rad;
  float d = length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - rad;
  float w = mix(fw2.y, fw2.x, step(q.y, q.x));
  return vec2(d, w);
}
float slopRrect(vec2 pt, vec2 hs, float rad, vec2 fw2) {
  vec2 e = slopRrectEdge(pt, hs, rad, fw2);
  return slopCov(e.x, e.y);
}
float slopMaxEdgeW(float a, float b, float wa, float wb) {
  return mix(wa, wb, step(a, b));
}
float slopMinEdgeW(float a, float b, float wa, float wb) {
  return mix(wa, wb, step(b, a));
}
`;

const SLOP_WHEEL_GLSL = /* glsl */ `
vec3 evalSlopAlloy(vec2 wheelVec, float rNorm, float fwRing, float fwSpoke, float isPolice, float isBlackout, float wheelCode) {
  float wAngle = atan(wheelVec.y, wheelVec.x);
  float inSpokeZone = smoothstep(0.14, 0.18, rNorm) * smoothstep(0.63, 0.59, rNorm);
  float wSel1 = step(abs(wheelCode - 1.0), 0.25);
  float wSel2 = step(abs(wheelCode - 2.0), 0.25);
  float spokeVal = 0.0;
  if (isPolice > 0.5) {
    float steelHoles = smoothstep(0.048, 0.028, abs(rNorm - 0.44)) * smoothstep(0.2, 0.5, cos(wAngle * 10.0));
    spokeVal = 1.0 - steelHoles;
  } else if (wSel2 > 0.5) {
    float fork = mix(0.62, 0.22, smoothstep(0.34, 0.56, rNorm));
    spokeVal = smoothstep(0.26, 0.1, abs(cos(wAngle * 7.0) - fork));
  } else if (wSel1 > 0.5) {
    spokeVal = smoothstep(0.32, 0.62, cos(wAngle * 10.0 + rNorm * 2.2));
  } else {
    float c5 = abs(cos(wAngle * 5.0));
    spokeVal = smoothstep(0.54, 0.68, c5) * (1.0 - smoothstep(0.86, 0.94, c5) * smoothstep(0.24, 0.34, rNorm));
  }
  float fadeRing = smoothstep(0.042, 0.012, max(fwRing, fwSpoke));
  float spokes = mix(0.55, spokeVal, smoothstep(0.042, 0.012, fwSpoke)) * inSpokeZone;
  float rimRing = smoothstep(0.59, 0.62, rNorm) * smoothstep(0.695, 0.675, rNorm);
  float centerHub = smoothstep(0.2, 0.16, rNorm);
  float lugHoles = smoothstep(0.145, 0.115, rNorm) * smoothstep(0.08, 0.105, rNorm) * smoothstep(0.4, 0.7, cos(wAngle * 5.0)) * fadeRing;
  float centerCap = smoothstep(0.075, 0.055, rNorm) * (1.0 - isPolice);
  float alloyMetal = clamp(max(spokes, max(rimRing, centerHub)) - max(lugHoles * 0.85, centerCap * 0.75), 0.0, 1.0);
  float brakeDisc = smoothstep(0.2, 0.24, rNorm) * smoothstep(0.5, 0.46, rNorm) * (1.0 - alloyMetal);
  float brakeCaliper = brakeDisc * smoothstep(0.15, 0.25, wheelVec.x) * smoothstep(0.05, 0.15, wheelVec.y);
  vec3 finishBase = mix(${glCol(0xd8e0e8)}, ${glCol(0x4a5058)}, max(isBlackout, step(abs(wheelCode - 3.0), 0.25)));
  vec3 wheelFinish = mix(finishBase, ${glCol(0x181b1f)}, isPolice * (1.0 - centerHub));
  vec3 rotorCol = mix(mix(${glCol(0x0c0f13)}, ${glCol(0x3e444b)}, brakeDisc), ${glCol(0x8a1c20)}, brakeCaliper);
  return mix(rotorCol, wheelFinish, alloyMetal);
}
vec3 evalSlopTyre(float rNorm, float fwRing) {
  float sidewallRib = smoothstep(0.018, 0.004, abs(rNorm - 0.8)) * 0.06 * smoothstep(0.018, 0.005, fwRing);
  float tyreShade = 0.92 - smoothstep(0.88, 0.96, rNorm) * 0.14 + sidewallRib;
  return ${glCol(0x17191c)} * tyreShade;
}
`;

interface CarShaderUniforms {
  uPaintColor: { value: Color };
  uCarState: { value: Vector4 };
  uStyle: { value: Vector4 };
  uDamage: { value: number };
  uPlateTex: { value: CanvasTexture | DataTexture };
}

function createSlopCarMaterial(spec: CarBodySpec, style: FleetStyle, envMap: DataTexture): { mat: MeshPhysicalMaterial; u: CarShaderUniforms } {
  const L = carLayout(spec);
  const cab = spec.cabin;
  const bc = L.belt.cowl;
  const bd = L.belt.deck;
  const glassEndZ = cab.glassEnd ?? cab.deck;
  const bEndY = L.body(glassEndZ).yE - 0.004;
  const rearEdgeMargin = cab.glassEnd !== undefined ? 0.034 : 0.065;
  const rf = L.rail.front;
  const rm = L.rail.mid;
  const rr = L.rail.rear;

  const sidePoly: [number, number][] = [[cab.cowl, bc.y], [cab.roofFront, rf.y], [L.rail.roofMid, rm.y], [cab.roofRear, rr.y], [glassEndZ, bEndY]];
  const sidePlanes = polygonPlanes(sidePoly, [0.048, 0.028, 0.028, rearEdgeMargin, 0.02]);
  const frontPoly: [number, number][] = [[-1, cab.cowl], [-1, cab.roofFront], [rf.x, cab.roofFront], [bc.x, cab.cowl]];
  const frontPlanes = polygonPlanes(frontPoly, [0, 0.042, 0.058, 0.048]);
  const rearPoly: [number, number][] = [[-1, cab.roofRear], [-1, cab.deck], [bd.x, cab.deck], [rr.x, cab.roofRear]];
  const rearPlanes = polygonPlanes(rearPoly, [0, 0.045, 0.062, 0.048]);

  const [hlX, hlY, hlW, hlH] = spec.headlight;
  const [tlX, tlY, tlW, tlH] = spec.taillight;
  const [grY, grW, grH] = spec.grille;
  const [inY, inW, inH] = spec.intake;
  const [plateF, plateR] = spec.plates;
  const frontZone = spec.zFront - 0.58;
  const rearZone = spec.zRear + 0.58;
  const sillY = spec.sill[1]![1];
  const rearSill = spec.tail.sill[1];
  const signY = taxiSignPlacement(spec).y + 0.105;
  const doorMid = (spec.doors[0]! + spec.doors[1]!) / 2;
  const trunkBot = Math.min(spec.bumperLine[1], plateR - 0.115);

  const u: CarShaderUniforms = {
    uPaintColor: { value: new Color(style.hex) },
    uCarState: { value: new Vector4(0, 0, 0, 0) },
    uStyle: { value: new Vector4(style.livery, style.metallic, style.trim, style.wheel) },
    uDamage: { value: 0 },
    uPlateTex: { value: getPlateTexture() },
  };

  const mat = new MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.18,
    metalness: 0.35,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMap,
    envMapIntensity: 1.45,
  });

  mat.customProgramCacheKey = () => `slop-car-v1-${spec.name}`;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uPaintColor = u.uPaintColor;
    shader.uniforms.uCarState = u.uCarState;
    shader.uniforms.uStyle = u.uStyle;
    shader.uniforms.uDamage = u.uDamage;
    shader.uniforms.uPlateTex = u.uPlateTex;

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float partId;\nvarying vec3 vCarPos;\nvarying vec3 vCarNormal;\nvarying float vPartId;\n")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvCarPos = position;\nvCarNormal = normal;\nvPartId = partId;\n");

    const glslPillarCuts = cab.pillars
      .map((zp) => `  { float e = 0.038 - abs(p.z - (${zp.toFixed(4)})); wSideG = slopMaxEdgeW(dSideG, e, wSideG, fwZ); dSideG = max(dSideG, e); }`)
      .concat(cab.pillars.length === 1 ? [`  { float e = 0.014 - abs(p.z - (${(cab.roofRear - 0.04).toFixed(4)})); wSideG = slopMaxEdgeW(dSideG, e, wSideG, fwZ); dSideG = max(dSideG, e); }`] : [])
      .join("\n");
    const glslSeams = spec.doors.map((zd) => `      seams = max(seams, slopBand(p.z - (${zd.toFixed(4)}), 0.0035, fwZ));`).join("\n");
    const glslHandles = spec.handles.slice(1).map((zh) => `      hDistZ = min(hDistZ, abs(p.z - (${zh.toFixed(4)})));`).join("\n");

    const glslSpecHelpers = /* glsl */ `
uniform vec3 uPaintColor;
uniform vec4 uCarState;
uniform vec4 uStyle;
uniform float uDamage;
uniform sampler2D uPlateTex;
varying vec3 vCarPos;
varying vec3 vCarNormal;
varying float vPartId;
${SLOP_GLSL_COMMON}
${glslPolygonEdge("evalSidePoly", sidePlanes, 0.065)}
${glslPolygonEdge("evalFrontPoly", frontPlanes, 0.085)}
${glslPolygonEdge("evalRearPoly", rearPlanes, 0.085)}
vec4 evalWindowGlass(vec3 p, float ax, float fwX, float fwZ, float fwY) {
  vec2 sideE = evalSidePoly(p.z, p.y, fwZ, fwY);
  float dSideG = sideE.x;
  float wSideG = sideE.y;
${glslPillarCuts}
  vec2 frontE = evalFrontPoly(ax, p.z, fwX, fwZ);
  float sideGlass = slopCov(dSideG, wSideG);
  float frontGlass = slopCov(frontE.x, frontE.y);
  float rearGlass = 0.0;
  float dSeal = min(sideE.x, frontE.x);
  float wSeal = slopMinEdgeW(sideE.x, frontE.x, sideE.y, frontE.y);
${
  spec.cargo
    ? ""
    : `  vec2 rearE = evalRearPoly(ax, p.z, fwX, fwZ);
  rearGlass = slopCov(rearE.x, rearE.y);
  wSeal = slopMinEdgeW(dSeal, rearE.x, wSeal, rearE.y);
  dSeal = min(dSeal, rearE.x);`
}
  float glass = max(max(sideGlass, frontGlass), rearGlass);
  float seal = slopCov(dSeal - 0.016, wSeal);
  return vec4(glass, frontGlass, rearGlass, seal);
}
`;

    const bodyAndEmissiveFragment = /* glsl */ `
  vec3 p = vCarPos;
  vec3 n = normalize(vCarNormal);
  float ax = abs(p.x);
  vec3 fwp = max(fwidth(p), vec3(0.0005));
  float fwX = fwp.x; float fwY = fwp.y; float fwZ = fwp.z;
  vec2 fwXY = vec2(fwX, fwY);
  vec2 fwXZ = vec2(fwX, fwZ);
  vec2 fwZY = vec2(fwZ, fwY);

  float livery = uStyle.x;
  float isMetallic = uStyle.y;
  float trimCode = uStyle.z;
  float wheelCode = uStyle.w;
  float isPolice = step(abs(livery - 1.0), 0.25);
  float isBoro = step(abs(livery - 2.0), 0.25);
  float isTLC = step(abs(livery - 3.0), 0.25);
  float isTwoTone = max(step(abs(livery - 4.0), 0.25), step(abs(trimCode - 3.0), 0.25));
  float isBlackout = step(abs(trimCode - 2.0), 0.25);
  float hasChrome = max(${spec.chrome ? "1.0" : "0.0"}, step(abs(trimCode - 1.0), 0.25)) * (1.0 - isBlackout);

  float isBody = step(abs(vPartId - 0.0), 0.25);
  float isWindow = step(abs(vPartId - 1.0), 0.25);
  float isMirror = step(abs(vPartId - 5.0), 0.25);
  float isSign = step(abs(vPartId - 6.0), 0.25);

  float isSide = smoothstep(0.45, 0.7, abs(n.x));
  float belt = mix(${bd.y.toFixed(4)}, ${bc.y.toFixed(4)}, clamp((p.z - (${cab.deck.toFixed(4)})) / ${(cab.cowl - cab.deck).toFixed(4)}, 0.0, 1.0));
  float ndv = clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0);
  float fresnel = pow(1.0 - ndv, 3.2);

  float fadeFineX = smoothstep(0.018, 0.005, fwX);
  float fadeFineZ = smoothstep(0.018, 0.005, fwZ);
  float fadeFineXY = smoothstep(0.018, 0.005, max(fwX, fwY));
  float fadeFineY = smoothstep(0.018, 0.005, fwY);

  // Sample plate texture unconditionally before branches (strict WebGL2 mipmaps/derivatives).
  float plateVariant = floor(fract(uPaintColor.r * 7.0 + uPaintColor.g * 13.0 + uPaintColor.b * 17.0 + isTLC * 0.75) * 4.0);
  float isFrontSide = smoothstep(-0.02, 0.02, n.z);
  float plateSignX = mix(-0.31, 0.31, isFrontSide);
  float plateCenterY = mix(${plateR.toFixed(4)}, ${plateF.toFixed(4)}, isFrontSide);
  vec2 plateUV = vec2(clamp(p.x / plateSignX + 0.5, 0.02, 0.98), (clamp((p.y - plateCenterY) / 0.115 + 0.5, 0.06, 0.94) + plateVariant) / 4.0);
  vec3 plateCol = texture2D(uPlateTex, plateUV).rgb;

  // Damage darkens paint slightly and roughens scuffed edges on worn chassis.
  vec3 paintCol = uPaintColor * mix(1.0, 0.72, uDamage);
  float paintLuma = dot(paintCol, vec3(0.299, 0.587, 0.114));
  float whiteComp = mix(0.98, 0.84, smoothstep(0.60, 0.92, paintLuma));
  float paintFlop = mix(1.0, ndv * 0.22 + 0.82, isMetallic);
  vec3 basePaint = paintCol * whiteComp * paintFlop;

  float wheelDist = length(vec2(abs(p.z) - ${spec.wheelZ.toFixed(4)}, p.y - ${spec.wheelRadius.toFixed(4)}));
  float archLip = smoothstep(${(L.archR + 0.05).toFixed(4)}, ${(L.archR - 0.005).toFixed(4)}, wheelDist) * smoothstep(0.6, 0.9, ax);
  float ao = (smoothstep(0.22, 0.66, p.y) * 0.2 + 0.8) * (1.0 - archLip * 0.55);

  vec3 outCol = ${glCol(0x181b1f)};
  float paintRough = mix(0.11, 0.16, isMetallic) + uDamage * 0.18;
  float paintMetal = mix(0.32, 0.42, isMetallic) + fresnel * 0.14;
  float slopRough = 0.78;
  float slopMetal = 0.04;
  vec3 slopEmit = vec3(0.0);

  float brake = uCarState.x;
  float blink = max(uCarState.y * step(0.0, p.x), uCarState.z * step(p.x, 0.0));
  float revOn = uCarState.w;

  // Evaluate window & light geometry helpers once where needed
  vec4 wInfo = evalWindowGlass(p, ax, fwX, fwZ, fwY);
  float glass = wInfo.x;
  float frontGlass = wInfo.y;
  float rearGlass = wInfo.z;
  float seal = wInfo.w;

  if (isBody > 0.5) {
    vec3 bCol = basePaint * ao;
${
  spec.cladding > 0
    ? `    float clad = max(smoothstep(${(spec.cladding + 0.01).toFixed(4)}, ${(spec.cladding - 0.01).toFixed(4)}, p.y), smoothstep(${(L.archR + 0.068).toFixed(4)}, ${(L.archR + 0.052).toFixed(4)}, wheelDist));
    bCol = mix(bCol, ${glCol(0x1d2024)}, clad);`
    : ""
}
${
  spec.bedCover
    ? `    float bedTop = slopCov(p.z - ${(cab.deck - 0.01).toFixed(4)}, fwZ) * slopCov(${(spec.zRear + 0.08).toFixed(4)} - p.z, fwZ) * smoothstep(0.68, 0.85, n.y) * slopCov(ax - 0.88, fwX);
    bCol = mix(bCol, ${glCol(0x16191d)}, bedTop);`
    : ""
}
    float grime = smoothstep(${(sillY + 0.16).toFixed(4)}, ${(sillY - 0.01).toFixed(4)}, p.y) * (0.2 + uDamage * 0.25);
    bCol = mix(bCol, ${glCol(0x2d2b28)}, clamp(grime, 0.0, 0.65));

    if (isSide > 0.05) {
      float hasLivery = max(isPolice, max(isBoro, ${spec.sign ? "1.0" : "0.0"}));
      if (hasLivery > 0.5) {
        // Campus Security / NZ Police Battenburg yellow & navy checks along sides
        float along = smoothstep(${(spec.zRear + 0.22).toFixed(4)}, ${(spec.zRear + 0.3).toFixed(4)}, p.z) * smoothstep(${(spec.zFront - 0.28).toFixed(4)}, ${(spec.zFront - 0.36).toFixed(4)}, p.z);
        float checks = slopBand(p.y - 0.585, 0.1, fwY) * along;
        float wave = abs(fract(p.z / 1.04) - 0.5) * 2.0;
        float soft = clamp(fwZ * 2.0, 0.01, 0.5);
        float blueBlock = smoothstep(0.5 - soft, 0.5 + soft, wave);
        float letterPattern = mix(0.35, smoothstep(0.2, 0.55, sin(p.z * 72.0)), fadeFineZ);
        float lettering = letterPattern * slopBand(p.y - 0.765, 0.042, fwY) * slopBand(p.z - (${doorMid.toFixed(4)}), 0.24, fwZ);
        float polMask = isPolice * isSide * ao;
        bCol = mix(bCol, mix(${glCol(0xd6e21c)}, ${glCol(0x0b3f9c)}, blueBlock), checks * polMask);
        bCol = mix(bCol, ${glCol(0x0b3f9c)}, lettering * polMask);

        float hasTaxiBadge = max(${spec.sign ? "1.0" : "0.0"}, isBoro) * isSide;
        float badge = slopRrect(vec2(p.z - (${doorMid.toFixed(4)}), p.y - 0.66), vec2(0.21, 0.052), 0.012, fwZY) * hasTaxiBadge;
        vec2 emblemUV = vec2(abs(p.z - (${doorMid.toFixed(4)})) - 0.15, p.y - 0.66);
        float emblemLen = length(emblemUV);
        float emblemW = (abs(emblemUV.x) * fwZ + abs(emblemUV.y) * fwY) / max(emblemLen, 0.0001);
        float emblem = slopCov(emblemLen - 0.039, emblemW);
        float letters = mix(0.4, smoothstep(0.15, 0.55, sin(p.z * 95.0)), fadeFineZ) * slopBand(p.z - (${doorMid.toFixed(4)}), 0.1, fwZ) * slopBand(p.y - 0.66, 0.028, fwY);
        vec3 badgeBg = mix(${glCol(0x0d4fa3)}, ${glCol(0xf2f6f0)}, isBoro) * ao;
        vec3 badgeFg = mix(${glCol(0xf7f9fb)}, ${glCol(0x2c8a2a)}, isBoro) * ao;
        bCol = mix(mix(bCol, badgeBg, badge), badgeFg, max(emblem, letters) * badge);
      }

${
  spec.slidingDoor
    ? `      float frontOfSlide = smoothstep(${(spec.slidingDoor[0] + 0.02).toFixed(4)}, ${(spec.slidingDoor[0] + 0.06).toFixed(4)}, p.z);
      float sideDoorMask = max(frontOfSlide, step(p.x, 0.0));
      float topDoorFade = mix(1.0, smoothstep(0.0, -0.015, p.y - belt), frontOfSlide);`
    : `      float sideDoorMask = 1.0;
      float topDoorFade = smoothstep(0.0, -0.015, p.y - belt);`
}
      float onDoors = isSide * smoothstep(${(sillY + 0.04).toFixed(4)}, ${(sillY + 0.07).toFixed(4)}, p.y) * topDoorFade * sideDoorMask;
      float seams = 0.0;
${glslSeams}
      float hDistZ = abs(p.z - (${spec.handles[0]!.toFixed(4)}));
${glslHandles}
      vec2 hUV = vec2(hDistZ, p.y - (belt - 0.092));
      float handleBar = slopRrect(hUV, vec2(0.066, 0.0085), 0.005, fwZY) * onDoors;
      vec2 pocketE = slopRrectEdge(vec2(hDistZ, hUV.y + 0.002), vec2(0.028, 0.015), 0.009, fwZY);
      float handlePocket = slopCov(pocketE.x - 0.004, pocketE.y) * (1.0 - handleBar) * onDoors;
      bCol = bCol * (1.0 - seams * onDoors * 0.58) * (1.0 - handlePocket * 0.68);
      bCol = mix(bCol, mix(bCol * 1.12, ${glCol(0xd8dfe6)}, hasChrome * 0.75), handleBar);
${
  spec.slidingDoor
    ? `      float slideTrack = slopRrect(vec2(p.z - (${(spec.slidingDoor[1] - 0.42).toFixed(4)}), p.y - (belt - 0.048)), vec2(0.42, 0.009), 0.004, fwZY) * step(p.x, 0.0) * isSide;
      bCol = mix(bCol, ${glCol(0x121519)}, slideTrack);`
    : ""
}
    }

    if (p.z > ${frontZone.toFixed(4)} && n.z > 0.02) {
      float front = smoothstep(0.12, 0.38, n.z);
      float hoodSeam = slopBand(p.y - (${spec.bumperLine[0].toFixed(4)}), 0.0035, fwY) * slopCov(ax - ${(hlX - hlW * 0.5).toFixed(4)}, fwX) * front;
      bCol *= (1.0 - hoodSeam * 0.52);

      vec2 gE = slopRrectEdge(vec2(p.x, p.y - (${grY.toFixed(4)})), vec2(${grW.toFixed(4)}, ${grH.toFixed(4)}), 0.015, fwXY);
      float grille = slopCov(gE.x, gE.y) * front;
      float grilleOuter = slopCov(gE.x - 0.013, gE.y) * front;
      float grilleWing = slopBand(p.y - ${(grY + grH * 0.12).toFixed(4)}, 0.0045, fwY) * grille;
      float grilleFrame = max(grilleOuter - grille, grilleWing * 0.75);
      float emblemFront = slopRrect(vec2(p.x, p.y - ${(grY + grH * 0.12).toFixed(4)}), vec2(0.032, 0.015), 0.008, fwXY) * grille;
      float intake = slopRrect(vec2(p.x, p.y - (${inY.toFixed(4)})), vec2(${inW.toFixed(4)}, ${inH.toFixed(4)}), 0.032, fwXY) * front;
      float airCurtain = slopRrect(vec2(ax - ${(hlX + hlW * 0.42).toFixed(4)}, p.y - ${(inY + 0.03).toFixed(4)}), vec2(0.042, ${(inH * 0.85).toFixed(4)}), 0.014, fwXY) * front;
      float meshWave = smoothstep(-0.1, 0.35, sin((p.x + p.y) * 110.0) * sin((p.x - p.y) * 110.0));
      float meshPattern = mix(0.68, meshWave * 0.38 + 0.52, fadeFineXY);
      float slatWave = smoothstep(0.3, 0.6, fract(p.y * 52.0));
      float intakeSlats = mix(0.72, slatWave * 0.35 + 0.55, fadeFineY);
      vec3 frameCol = mix(${glCol(0x181b20)}, ${glCol(0xd2d8de)}, hasChrome);
      bCol = mix(bCol, frameCol, grilleFrame);
      bCol = mix(bCol, ${glCol(0x101317)} * meshPattern, grille * (1.0 - grilleWing));
      bCol = mix(bCol, ${glCol(0xd4dbe2)}, emblemFront);
      bCol = mix(bCol, ${glCol(0x0f1216)} * intakeSlats, max(intake, airCurtain));

      vec2 hlUV = vec2(ax - ${hlX.toFixed(4)}, p.y - ${hlY.toFixed(4)} - (ax - ${hlX.toFixed(4)}) * 0.032);
      float headlight = slopRrect(hlUV, vec2(${hlW.toFixed(4)}, ${hlH.toFixed(4)}), 0.014, fwXY) * smoothstep(0.02, 0.25, n.z);
      float turnFront = smoothstep(${(hlW * 0.76).toFixed(4)}, ${(hlW * 0.83).toFixed(4)}, hlUV.x) * headlight;
      float lit = headlight * (1.0 - turnFront);
      vec2 projUV = vec2(abs(hlUV.x + ${(hlW * 0.09).toFixed(4)}) - ${(hlW * 0.25).toFixed(4)}, hlUV.y - ${(hlH * 0.08).toFixed(4)});
      vec2 projE = slopRrectEdge(projUV, vec2(${(hlW * 0.165).toFixed(4)}, ${(hlH * 0.44).toFixed(4)}), 0.009, fwXY);
      float projBucket = slopCov(projE.x - 0.008, projE.y) * lit;
      float projRing = slopCov(projE.x - 0.002, projE.y) * lit;
      float headlightLens = slopCov(projE.x + 0.004, projE.y) * lit;
      float drlH = max(abs(hlUV.y + ${(hlH * 0.6).toFixed(4)}), max(hlUV.x - ${(hlW * 0.67).toFixed(4)}, ${(-hlW * 0.82).toFixed(4)} - hlUV.x));
      float drlV = max(abs(hlUV.x - ${(hlW * 0.67).toFixed(4)}), max(hlUV.y - ${(hlH * 0.48).toFixed(4)}, ${(-hlH * 0.6).toFixed(4)} - hlUV.y));
      float drl = slopCov(min(drlH, drlV) - 0.0045, slopMinEdgeW(drlH, drlV, fwY, fwX)) * lit;

      vec3 lampBezel = mix(mix(${glCol(0x13171d)}, ${glCol(0x4a535e)}, projBucket), ${glCol(0x9ea8b2)}, projRing * 0.78);
      vec3 lampColor = mix(mix(lampBezel, ${glCol(0xf4f8ff)}, headlightLens), ${glCol(0xffffff)}, drl);
      bCol = mix(bCol, mix(lampColor, ${glCol(0xb85e16)}, turnFront), headlight);

      slopEmit = ${glCol(0xfff8ec)} * (headlightLens * 1.45 + drl * 1.55) * (1.0 - max(turnFront, drl) * blink) + ${glCol(0xff9812)} * (max(turnFront, drl * 0.75) * blink * 2.2);

      vec2 frontPlateE = slopRrectEdge(vec2(p.x, p.y - ${plateF.toFixed(4)}), vec2(0.155, 0.055), 0.008, fwXY);
      float plateRecessF = slopCov(frontPlateE.x - 0.015, frontPlateE.y) * front;
      float plateFront = slopCov(frontPlateE.x, frontPlateE.y) * front;
      bCol = mix(bCol, ${glCol(0x1e2227)}, plateRecessF);
      bCol = mix(bCol, plateCol, plateFront);
    } else if (p.z < ${rearZone.toFixed(4)} && n.z < -0.02) {
      float rear = smoothstep(0.12, 0.38, -n.z);
      vec2 rearPlateE = slopRrectEdge(vec2(p.x, p.y - ${plateR.toFixed(4)}), vec2(0.155, 0.06), 0.008, fwXY);
      float platePocket = slopRrect(vec2(p.x, p.y - ${(plateR + 0.01).toFixed(4)}), vec2(0.24, 0.105), 0.03, fwXY) * rear;
${
  spec.barnDoors
    ? `      float barnSide = ax - ${spec.barnDoors[0].toFixed(4)};
      float barnBottom = ${trunkBot.toFixed(4)} - p.y;
      float barnW = slopMaxEdgeW(barnBottom, barnSide, fwY, fwX);
      float trunkSeam = max(slopBand(max(barnSide, barnBottom), 0.0035, barnW), slopBand(p.x, 0.0045, fwX) * slopCov(barnBottom, fwY)) * rear * (1.0 - platePocket);`
    : `      float trunkWidth = mix(${(tlX - tlW - 0.025).toFixed(4)}, ${tlX.toFixed(4)}, smoothstep(${(tlY - tlH).toFixed(4)}, ${spec.tail.edge[1].toFixed(4)}, p.y));
      float trunkSide = ax - trunkWidth;
      float trunkBottom = ${trunkBot.toFixed(4)} - p.y;
      float trunkSeam = slopBand(max(trunkSide, trunkBottom), 0.003, slopMaxEdgeW(trunkBottom, trunkSide, fwY, fwX)) * rear * (1.0 - platePocket);`
}
      bCol *= (1.0 - trunkSeam * 0.56);
      float pocketShade = 0.9 - smoothstep(${(plateR - 0.09).toFixed(4)}, ${(plateR + 0.115).toFixed(4)}, p.y) * 0.25;
      bCol = mix(bCol, bCol * pocketShade, platePocket);

      vec2 tlUV = vec2(ax - ${tlX.toFixed(4)}, p.y - ${tlY.toFixed(4)});
      vec2 tailE = slopRrectEdge(tlUV, vec2(${(tlW * 1.04).toFixed(4)}, ${(tlH * 1.2).toFixed(4)}), 0.018, fwXY);
      float taillight = slopCov(tailE.x, tailE.y) * smoothstep(0.02, 0.25, -n.z);
      float lowerStrip = smoothstep(${(-tlH * 0.12).toFixed(4)}, ${(-tlH * 0.24).toFixed(4)}, tlUV.y);
      float tailLens = slopCov(tailE.x + 0.0045, tailE.y) * taillight;
      float turnRearSection = lowerStrip * smoothstep(0.0, ${(tlW * 0.08).toFixed(4)}, tlUV.x);
      float reverseRearSection = lowerStrip * smoothstep(${(tlW * 0.04).toFixed(4)}, ${(-tlW * 0.04).toFixed(4)}, tlUV.x);
      float ledBarMask = max(slopBand(tlUV.y - ${(tlH * 0.36).toFixed(4)}, 0.0085, fwY), slopBand(tlUV.y + ${(tlH * 0.02).toFixed(4)}, 0.0085, fwY));
      float ledBar = ledBarMask * tailLens * (1.0 - max(turnRearSection, reverseRearSection));
      float tailFacet = smoothstep(${(-tlH).toFixed(4)}, ${tlH.toFixed(4)}, tlUV.y) * 0.28 + 0.78;
      vec3 tailRuby = mix(${glCol(0x981018)} * tailFacet, ${glCol(0xff2834)}, ledBar);
      vec3 tailColor = mix(mix(tailRuby, ${glCol(0xf07818)}, turnRearSection), ${glCol(0xe4edf4)}, reverseRearSection);

      float tailgateHandle = ${
        spec.bedCover
          ? `slopRrect(vec2(p.x, p.y - ${(tlY + tlH * 0.42).toFixed(4)}), vec2(0.085, 0.016), 0.005, fwXY) * rear`
          : spec.barnDoors
            ? `slopRrect(vec2(p.x + 0.072, p.y - 1.04), vec2(0.013, 0.056), 0.005, fwXY) * rear`
            : "0.0"
      };
      float rearValance = smoothstep(${(rearSill + 0.075).toFixed(4)}, ${(rearSill + 0.02).toFixed(4)}, p.y) * rear;
      vec2 exhE = slopRrectEdge(vec2(ax - 0.5, p.y - ${(rearSill + 0.036).toFixed(4)}), vec2(0.052, 0.017), 0.008, fwXY);
      float exhaustRim = slopCov(exhE.x, exhE.y) * rearValance;
      float exhaustBore = slopCov(exhE.x + 0.006, exhE.y) * rearValance;
      float reflector = slopRrect(vec2(ax - 0.65, p.y - ${(spec.bumpers[1]![0] + 0.04).toFixed(4)}), vec2(0.075, 0.01), 0.004, fwXY) * rear;
      float emblemRear = ${spec.barnDoors ? "0.0" : `slopRrect(vec2(p.x, p.y - ${(tlY - tlH * 0.12).toFixed(4)}), vec2(0.022, 0.01), 0.009, fwXY) * rear`};

      bCol = mix(bCol, ${glCol(0x14171b)}, max(rearValance, tailgateHandle));
      bCol = mix(mix(bCol, ${glCol(0x828a92)}, exhaustRim), ${glCol(0x060709)}, exhaustBore);
      bCol = mix(bCol, ${glCol(0x8a0c14)}, reflector);
      bCol = mix(bCol, ${glCol(0x16090c)}, taillight);
      bCol = mix(bCol, tailColor, tailLens);
      bCol = mix(bCol, ${glCol(0xb8c0c8)}, emblemRear);

      float plateRecessR = slopCov(rearPlateE.x - 0.02, rearPlateE.y) * rear;
      float plateRear = slopCov(rearPlateE.x, rearPlateE.y) * rear;
      bCol = mix(bCol, ${glCol(0x1e2227)}, plateRecessR);
      bCol = mix(bCol, plateCol, plateRear);

      float turnRear = turnRearSection * tailLens;
      float redArea = tailLens * (1.0 - max(turnRearSection, reverseRearSection));
      float redLens = max(redArea * 0.58, ledBarMask * redArea);
      slopEmit = ${glCol(0xff0c16)} * (redLens * (brake * 2.1 + 0.24)) + ${glCol(0xff9812)} * (turnRear * blink * 2.2) + ${glCol(0xf0f6ff)} * (tailLens * reverseRearSection * revOn * 1.8);
    }

    outCol = mix(bCol, ${glCol(0x0c0e11)}, smoothstep(-0.25, -0.55, n.y));
    slopRough = paintRough + smoothstep(${(sillY + 0.1).toFixed(4)}, ${(sillY - 0.01).toFixed(4)}, p.y) * 0.16;
    slopMetal = paintMetal;
  } else if (isWindow > 0.5) {
    float beltStrip = slopBand(p.y - (belt + 0.01), 0.007, fwY) * smoothstep(0.5, 0.7, abs(n.x)) * slopCov(${(glassEndZ + 0.03).toFixed(4)} - p.z, fwZ) * slopCov(p.z - ${(cab.cowl - 0.07).toFixed(4)}, fwZ);
    float chromeBelt = beltStrip * hasChrome;
    float chmsl = ${
      spec.barnDoors
        ? `slopRrect(vec2(p.x, p.y - ${(spec.barnDoors[1] + 0.055).toFixed(4)}), vec2(0.16, 0.015), 0.005, fwXY) * smoothstep(-0.15, -0.45, n.z) * smoothstep(${(rearZone + 0.05).toFixed(4)}, ${(rearZone - 0.05).toFixed(4)}, p.z)`
        : `slopRrect(vec2(p.x, p.z - ${(cab.roofRear - 0.075).toFixed(4)}), vec2(0.16, 0.011), 0.005, fwXZ) * rearGlass * smoothstep(-0.05, -0.2, n.z)`
    };
    float rearWiper = ${spec.rearWiper ? `slopRrect(vec2(p.x + 0.15, p.z - ${(cab.deck + 0.075).toFixed(4)}), vec2(0.22, 0.006), 0.003, fwXZ) * rearGlass` : "0.0"};
    vec3 glassBase = mix(${glCol(0x0a1016)}, ${glCol(0x1a2632)}, max(smoothstep(0.2, 0.9, n.y), fresnel * 0.55));
    float tlcSticker = slopRrect(vec2(p.x + ${(bc.x - 0.16).toFixed(4)}, p.z - ${(cab.cowl - 0.14).toFixed(4)}), vec2(0.045, 0.03), 0.008, fwXZ) * frontGlass * isTLC;
    vec3 glassCol = mix(glassBase, ${glCol(0x3a88e8)}, tlcSticker * 0.65);
    vec3 roofPaint = mix(basePaint * ao, ${glCol(0x111418)}, isTwoTone * slopCov(${(rf.y - 0.04).toFixed(4)} - p.y, fwY));
${
  spec.slidingDoor
    ? `    float sdMidZ = ${((spec.slidingDoor[0] + spec.slidingDoor[1]) * 0.5).toFixed(4)};
    float sdHalfZ = ${((spec.slidingDoor[0] - spec.slidingDoor[1]) * 0.5).toFixed(4)};
    float slideSide = abs(p.z - sdMidZ) - sdHalfZ;
    float slideTop = p.y - ${spec.slidingDoor[2].toFixed(4)};
    float slideW = slopMaxEdgeW(slideTop, slideSide, fwY, fwZ);
    float slideSeamW = slopBand(max(slideSide, slideTop), 0.0035, slideW) * step(p.x, -0.2) * isSide;
    float panelRibW = slopBand(p.z + 1.98, 0.0035, fwZ) * slopCov(slideTop, fwY) * isSide * 0.55;
    roofPaint *= (1.0 - max(slideSeamW, panelRibW) * 0.58);`
    : ""
}
${
  spec.barnDoors
    ? `    float rearWall = smoothstep(-0.15, -0.45, n.z) * smoothstep(${(rearZone + 0.05).toFixed(4)}, ${(rearZone - 0.05).toFixed(4)}, p.z);
    float barnSide = ax - ${spec.barnDoors[0].toFixed(4)};
    float barnTopD = p.y - ${spec.barnDoors[1].toFixed(4)};
    float barnW = slopMaxEdgeW(barnTopD, barnSide, fwY, fwX);
    float barnSeamW = max(slopBand(max(barnSide, barnTopD), 0.0035, barnW), slopBand(p.x, 0.0045, fwX) * slopCov(barnTopD, fwY)) * rearWall;
    float barnHinge = slopRrect(vec2(ax - ${spec.barnDoors[0].toFixed(4)}, abs(p.y - 1.78) - 0.34), vec2(0.022, 0.03), 0.005, fwXY) * rearWall;
    roofPaint = mix(roofPaint * (1.0 - barnSeamW * 0.58), ${glCol(0x14171b)}, barnHinge);`
    : ""
}
    vec3 wCol = mix(mix(mix(mix(roofPaint, ${glCol(0x111315)}, max(seal, beltStrip)), glassCol, glass), ${glCol(0xd2d8de)}, chromeBelt), ${glCol(0x6a0a0e)}, chmsl);
    outCol = mix(wCol, ${glCol(0x14171a)}, rearWiper);
    slopRough = mix(mix(paintRough, 0.78, seal), 0.06, glass);
    slopMetal = mix(mix(paintMetal, 0.04, seal), mix(0.18, 0.42, fresnel), glass);
    if (brake > 0.5) slopEmit = ${glCol(0xff0c16)} * (chmsl * 2.2);
  } else if (isMirror > 0.5) {
    float mirrorGlass = smoothstep(0.45, 0.65, -n.z);
    float mirrorTurn = smoothstep(0.05, 0.2, n.z) * slopBand(p.y - ${(bc.y + 0.082).toFixed(4)}, 0.006, fwY) * slopCov(0.88 - ax, fwX);
    vec3 mirrorCapPaint = mix(basePaint, ${glCol(0x121519)}, max(isTwoTone, isBlackout));
    outCol = mix(mix(mirrorCapPaint, ${glCol(0x8896a2)}, mirrorGlass), ${glCol(0x98a4ae)}, mirrorTurn);
    slopRough = 0.12;
    slopMetal = mix(paintMetal, 0.65, mirrorGlass);
  } else if (isSign > 0.5) {
    float signFace = smoothstep(0.55, 0.75, abs(n.z));
    float signGlyph = smoothstep(0.25, 0.58, sin(p.x * 90.0)) * slopBand(p.x, 0.17, fwX) * slopBand(p.y - ${signY.toFixed(4)}, 0.042, fwY) * fadeFineX;
    outCol = mix(${glCol(0xf3efe2)}, mix(${glCol(0xfff1b8)}, ${glCol(0x15181b)}, signGlyph), signFace);
    slopRough = 0.35;
    slopEmit = ${glCol(0xffe28a)} * (signFace * (1.0 - signGlyph * 0.9) * 1.5);
  }
  diffuseColor.rgb = outCol;
`;

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${glslSpecHelpers}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${bodyAndEmissiveFragment}`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n  roughnessFactor = slopRough;")
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\n  metalnessFactor = slopMetal;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  totalEmissiveRadiance += slopEmit;");
  };
  return { mat, u };
}

function createSlopWheelMaterial(wheelRadius: number, style: FleetStyle, envMap: DataTexture): { mat: MeshStandardMaterial; u: { uStyle: { value: Vector4 } } } {
  const u = { uStyle: { value: new Vector4(style.livery, style.metallic, style.trim, style.wheel) } };
  const mat = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.78, envMap, envMapIntensity: 1.35 });
  mat.customProgramCacheKey = () => `slop-wheel-v1-${wheelRadius.toFixed(3)}`;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uStyle = u.uStyle;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float partId;\nvarying vec3 vWPos;\nvarying float vWPart;\n")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWPos = position;\nvWPart = partId;\n");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform vec4 uStyle;\nvarying vec3 vWPos;\nvarying float vWPart;\n${SLOP_WHEEL_GLSL}`)
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
  float isPolice = step(abs(uStyle.x - 1.0), 0.25);
  float isBlackout = step(abs(uStyle.z - 2.0), 0.25);
  float wheelCode = uStyle.w;
  float isAlloy = step(abs(vWPart - 3.0), 0.25);
  float isTyre = step(abs(vWPart - 2.0), 0.25);
  vec2 wheelVec = vec2(vWPos.z, vWPos.y);
  float wheelDist = length(wheelVec);
  float rNorm = wheelDist / ${wheelRadius.toFixed(4)};
  vec2 fwZY = max(vec2(fwidth(vWPos.z), fwidth(vWPos.y)), vec2(0.0005));
  vec2 wDir = wheelVec / max(wheelDist, 0.0001);
  float fwRing = abs(wDir.x) * fwZY.x + abs(wDir.y) * fwZY.y;
  float fwSpoke = abs(wDir.y) * fwZY.x + abs(wDir.x) * fwZY.y;
  vec3 wCol = ${glCol(0x181b1f)};
  if (isAlloy > 0.5) wCol = evalSlopAlloy(wheelVec, rNorm, fwRing, fwSpoke, isPolice, isBlackout, wheelCode);
  else if (isTyre > 0.5) wCol = evalSlopTyre(rNorm, fwRing);
  diffuseColor.rgb = wCol;
`,
      )
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n  roughnessFactor = mix(0.82, mix(0.22, 0.52, step(abs(uStyle.x - 1.0), 0.25)), step(abs(vWPart - 3.0), 0.25));")
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\n  metalnessFactor = mix(0.04, mix(0.84, 0.22, step(abs(uStyle.x - 1.0), 0.25)), step(abs(vWPart - 3.0), 0.25));");
  };
  return { mat, u };
}

function createSlopLightbarMaterial(): { mat: MeshStandardMaterial; u: { uTime: { value: number }; uSiren: { value: number } } } {
  const u = { uTime: { value: 0 }, uSiren: { value: 0 } };
  const mat = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.12, metalness: 0.25 });
  mat.customProgramCacheKey = () => "slop-lightbar-v1";
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = u.uTime;
    shader.uniforms.uSiren = u.uSiren;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float partId;\nvarying vec3 vLPos;\nvarying float vLPart;\n")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLPos = position;\nvLPart = partId;\n");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;\nuniform float uSiren;\nvarying vec3 vLPos;\nvarying float vLPart;\n")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
  float isLens = step(abs(vLPart - 6.0), 0.25);
  float t = fract(uTime * 1.75);
  float strobe = step(0.45, fract(t * 6.0)) * uSiren;
  float redOn = step(t, 0.5) * strobe;
  float blueOn = step(0.5, t) * strobe;
  float whiteOn = step(0.75, fract(t * 3.0)) * strobe;
  float isRed = smoothstep(-0.045, -0.065, vLPos.x);
  float isBlue = smoothstep(0.045, 0.065, vLPos.x);
  float isWhite = 1.0 - max(isRed, isBlue);
  float pod = smoothstep(-0.05, 0.35, sin(vLPos.x * 52.0)) * 0.35 + 0.65;
  vec3 lens = mix(mix(${glCol(0xdce2e8)}, ${glCol(0x8e0d14)}, isRed), ${glCol(0x0f3c9a)}, isBlue) * pod;
  diffuseColor.rgb = mix(${glCol(0x14171a)}, lens, isLens);
  vec3 lbEmit = (${glCol(0xff1820)} * (isRed * redOn * 4.5) + ${glCol(0x286eff)} * (isBlue * blueOn * 5.0) + ${glCol(0xf4f8ff)} * (isWhite * whiteOn * 2.8)) * pod * isLens;
`,
      )
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  totalEmissiveRadiance += lbEmit;");
  };
  return { mat, u };
}

function createSlopBusMaterial(slot: number, envMap: DataTexture): { mat: MeshPhysicalMaterial; u: { uBusState: { value: Vector4 }; uSlot: { value: number } } } {
  const s = BUS_SPEC;
  const [wy0, wy1] = [1.22, 2.42];
  const winMid = (wy0 + wy1) * 0.5;
  const winHalf = (wy1 - wy0) * 0.5;
  const invBusScale = 1 / BUS_SCALE;

  const u = { uBusState: { value: new Vector4(0, 0, 0, 0) }, uSlot: { value: slot } };
  const mat = new MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.16,
    metalness: 0.24,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    envMap,
    envMapIntensity: 1.3,
  });
  mat.customProgramCacheKey = () => "slop-bus-v1";
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uBusState = u.uBusState;
    shader.uniforms.uSlot = u.uSlot;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float partId;\nvarying vec3 vBusPos;\nvarying vec3 vBusNormal;\nvarying float vBusPart;\n")
      .replace("#include <begin_vertex>", `#include <begin_vertex>\nvBusPos = position * ${invBusScale.toFixed(6)};\nvBusNormal = normal;\nvBusPart = partId;\n`);

    const busFrag = /* glsl */ `
  vec3 p = vBusPos;
  vec3 n = normalize(vBusNormal);
  float ax = abs(p.x);
  float az = abs(p.z);
  vec3 fwp = max(fwidth(p), vec3(0.0015));
  float fwX = fwp.x; float fwY = fwp.y; float fwZ = fwp.z;
  float invX = 1.0 / fwX; float invY = 1.0 / fwY; float invZ = 1.0 / fwZ;
  float invXY = 1.0 / max(fwX, fwY);
  float invZY = 1.0 / max(fwZ, fwY);

  float isBody = step(abs(vBusPart - 0.0), 0.25);
  float isTrim = step(abs(vBusPart - 1.0), 0.25);
  float isPod = step(abs(vBusPart - 2.0), 0.25);
  float isFairing = step(abs(vBusPart - 3.0), 0.25);
  float isSkin = max(isBody, isFairing);

  float front = smoothstep(0.15, 0.42, n.z) * smoothstep(${(s.zFront - 0.98).toFixed(4)}, ${(s.zFront - 0.9).toFixed(4)}, p.z) * isBody;
  float rear = smoothstep(0.15, 0.42, -n.z) * smoothstep(${(s.zRear + 0.98).toFixed(4)}, ${(s.zRear + 0.9).toFixed(4)}, p.z) * isBody;
  float side = smoothstep(0.45, 0.72, abs(n.x)) * isSkin;
  float curb = step(p.x, 0.0);

  float slot8 = mod(floor(uSlot + 0.5), 8.0);
  float isS0 = step(abs(slot8 - 0.0), 0.25);
  float isS1 = step(abs(slot8 - 1.0), 0.25);
  float isS3 = step(abs(slot8 - 3.0), 0.25);
  float isS5 = step(abs(slot8 - 5.0), 0.25);
  float isLink = clamp(isS0 + isS1 + isS3 + isS5, 0.0, 1.0);
  vec3 linkColour = ${glCol(0x4fa83d)} * isS0 + ${glCol(0xd3222a)} * isS1 + ${glCol(0xf08a1c)} * isS3 + ${glCol(0x12a0b4)} * isS5;

  // Front windshield & brow markers
  vec2 frontMaskE = slopBusRBox(p.x, p.y - 1.97, 1.22, 0.8, 0.15, invX, invY);
  float frontMask = slopBusCov(frontMaskE.x, frontMaskE.y) * front;
  float frontGlassOuter = slopBusBoxMask(p.x, p.y - 1.8, 1.15, 0.56, invX, invY) * frontMask;
  float centerDiv = 1.0 - slopBusBand(p.x, 0.015, invX);
  float inWiperY = smoothstep(1.23, 1.25, p.y) * smoothstep(1.97, 1.95, p.y);
  float wiperTilt = (p.y - 1.24) * 0.36;
  float wipers = max(slopBusBand(p.x - 0.38 + wiperTilt, 0.015, invX), slopBusBand(p.x + 0.14 - wiperTilt, 0.015, invX)) * inWiperY;
  float frontGlass = frontGlassOuter * centerDiv * (1.0 - wipers * 0.85);
  float signBand = slopBusBoxMask(p.x, p.y - 2.56, 1.02, 0.16, invX, invY) * front;
  float browCenterX = min(ax, abs(ax - 0.13));
  float browMarker = max(slopBusCovAt(0.022, length(vec2(browCenterX * 0.7, (p.y - 2.81) * 1.4)), invXY), slopBusCovAt(0.025, length(vec2((ax - 0.98) * 0.65, (p.y - 2.79) * 1.4)), invXY)) * front;

  // Rear face
  float rearSignBox = slopBusBoxMask(p.x + 0.45, p.y - 2.58, 0.31, 0.14, invX, invY) * rear;
  float rearLouverArea = slopBusBoxMask(p.x - 0.42, p.y - 2.58, 0.44, 0.14, invX, invY) * slopBusCovUp(0.024, abs(p.x - 0.42), invX) * rear;
  float rearUpperSlats = mix(0.58, smoothstep(0.32, 0.46, fract(p.y * 22.0)) * 0.55 + 0.25, smoothstep(0.028, 0.007, fwY));
  float rearIdLamps = max(slopBusCovAt(0.02, length(vec2(min(ax, abs(ax - 0.14)) * 0.7, (p.y - 2.79) * 1.4)), invXY), slopBusCovAt(0.023, length(vec2((ax - 0.96) * 0.65, (p.y - 2.74) * 1.4)), invXY)) * rear;
  vec2 rearAdE = slopBusBoxEdge(p.x, p.y - 1.82, 0.63, 0.21, invX, invY);
  float rearAdInner = slopBusCov(rearAdE.x, rearAdE.y) * rear;
  float rearAdFrame = slopBusCovAt(0.03, rearAdE.x, rearAdE.y) * rear;
  float rearSeam = max(slopBusBand(p.y - 1.42, 0.008, invY) * smoothstep(0.95, 0.93, ax), slopBusBand(ax - 0.92, 0.008, invX) * smoothstep(0.58, 0.62, p.y) * smoothstep(2.77, 2.73, p.y)) * rear;
  float highBrake = slopBusBoxMask(p.x, p.y - 1.48, 0.2, 0.018, invX, invY) * rear;

  float sideRearGrille = max(slopBusBoxMask(p.z - ${(s.zRear + 0.52).toFixed(4)}, p.y - 0.88, 0.38, 0.3, invZ, invY), slopBusBoxMask(p.z - ${(s.zRear + 0.48).toFixed(4)}, p.y - 2.62, 0.26, 0.13, invZ, invY)) * side;
  float slats = mix(0.56, smoothstep(0.38, 0.52, fract(p.y * 18.0)) * 0.5 + 0.3, smoothstep(0.028, 0.007, fwY));

  // Side windows & doors
  vec2 sideWinE = slopBusRBox(p.z + 0.78, p.y - ${winMid.toFixed(4)}, 4.92, ${winHalf.toFixed(4)}, 0.065, invZ, invY);
  float sideBand = slopBusCov(sideWinE.x, sideWinE.y) * side;
  float sideSeal = slopBusCovAt(0.044, sideWinE.x, sideWinE.y) * side;
  float invZRep = invZ / 0.76;
  float mullion = 1.0 - slopBusBand(fract(p.z * 0.76 + 0.18) - 0.5, 0.038, invZRep);
  float transomBar = 1.0 - slopBusBand(p.y - 2.08, 0.015, invY) * 0.88;
  float sideSignCut = 1.0 - slopBusBoxMask(p.z - 3.74, p.y - 2.26, 0.56, 0.11, invZ, invY) * curb;
  vec2 drvWinE = slopBusBoxEdge(p.z - 4.92, p.y - ${(winMid + 0.02).toFixed(4)}, 0.52, ${winHalf.toFixed(4)}, invZ, invY);
  float driverSeal = slopBusCovAt(0.044, drvWinE.x, drvWinE.y) * side * (1.0 - curb);
  float driverWin = slopBusCov(drvWinE.x, drvWinE.y) * slopBusCovUp(0.02, abs(p.z - 4.92), invZ) * side * (1.0 - curb);

  float dzDoor = min(abs(p.z - 4.89), abs(p.z + 1.54));
  float doorSide = side * curb;
  float doorFrame = slopBusBoxMask(dzDoor, p.y - 1.42, 0.525, 1.02, invZ, invY) * doorSide;
  float doorGlass = slopBusBoxMask(abs(dzDoor - 0.25), p.y - 1.48, 0.19, 0.86, invZ, invY) * (1.0 - slopBusBand(p.y - 1.18, 0.015, invY) * 0.85) * doorSide;
  float sideGlassPanes = sideBand * mullion * transomBar * sideSignCut * (1.0 - doorFrame);
  float glass = clamp(max(frontGlass, max(max(sideGlassPanes, driverWin), doorGlass)), 0.0, 1.0);
  float seal = clamp(max(max(frontMask, rearSignBox), max(max(sideSeal, driverSeal), max(signBand, doorFrame))), 0.0, 1.0);

  vec2 archVec = vec2(az - ${s.wheelZ.toFixed(4)}, max(0.0, p.y - ${s.wheelRadius.toFixed(4)}));
  float dArch = length(archVec);
  vec2 archDir = archVec / max(dArch, 0.0001);
  float invArch = 1.0 / max(abs(archDir.x) * fwZ + abs(archDir.y) * fwY, 0.0005);
  float archFlareMask = slopBusBand(dArch - ${(s.wheelRadius + s.archGap + 0.0225).toFixed(4)}, 0.0325, invArch) * slopBusCovUp(0.35, p.y, invY) * side;

  // AT Metro / Link livery stripes
  float shadeY = smoothstep(0.34, 1.25, p.y) * 0.16 + 0.84;
  float uArc = (p.z - 2.65) / 1.95;
  float arcTopY = 2.86 - uArc * uArc * 0.38;
  float invArc = 1.0 / (fwY + abs(uArc) * 0.39 * fwZ);
  float inUpperArcZ = smoothstep(0.65, 0.85, p.z) * smoothstep(4.65, 4.45, p.z) * slopBusCovUp(2.42, p.y, invY) * side;
  float upperGoldArc = slopBusBand(p.y - arcTopY + 0.0375, 0.0375, invArc) * inUpperArcZ;
  float upperSkyFill = slopBusCovAt(-0.075, p.y - arcTopY, invArc) * inUpperArcZ;

  float diagY = p.y - (p.z + 0.9) * 0.28;
  float invDiag = 1.0 / (fwY + fwZ * 0.28);
  float inMidDiag = smoothstep(0.38, 0.42, p.y) * smoothstep(1.22, 1.18, p.y) * smoothstep(-1.06, -1.02, p.z) * side * (1.0 - doorFrame);
  float midGoldBand = slopBusBand(diagY - 0.8, 0.11, invDiag) * inMidDiag;
  float midSkyBand = slopBusBand(diagY - 0.6, 0.09, invDiag) * inMidDiag;

  float frontSpeedLines = mix(0.55, smoothstep(0.36, 0.56, fract((p.y + (5.5 - p.z) * 0.11) * 13.0)), smoothstep(0.055, 0.014, fwY + fwZ * 0.11)) * smoothstep(0.8, 2.4, p.z) * smoothstep(5.55, 5.35, p.z) * smoothstep(0.4, 0.43, p.y) * smoothstep(1.2, 1.16, p.y) * side;
  float rearSpeedLines = mix(0.52, smoothstep(0.38, 0.58, fract((p.y - (p.z - (${s.zRear.toFixed(4)})) * 0.26) * 10.5)), smoothstep(0.055, 0.014, fwY + fwZ * 0.26)) * smoothstep(-3.3, -4.3, p.z) * smoothstep(0.4, 0.43, p.y) * smoothstep(2.4, 2.2, p.y) * side;

  vec3 bodyCol = mix(${glCol(0x12305e)}, linkColour, isLink);
  vec3 sweepCol = mix(${glCol(0x2a9bd8)}, ${glCol(0xf4f7fa)}, isLink);
  vec3 lineCol = mix(${glCol(0xe6edf4)}, linkColour * 0.55, isLink);
  vec3 modernLivery = mix(bodyCol, sweepCol, max(upperSkyFill, max(midSkyBand, frontSpeedLines * 0.8)));
  modernLivery = mix(modernLivery, lineCol, max(max(upperGoldArc, midGoldBand), rearSpeedLines * 0.7));
  modernLivery = mix(modernLivery, bodyCol * 0.72, rear);
  vec3 liveryCol = mix(modernLivery, ${glCol(0x181c22)}, slopBusCovAt(0.415, p.y, invY)) * shadeY;

  // Front & rear lamps
  float lampTiltY = p.y - (0.74 + (ax - 0.76) * 0.14);
  float podMask = slopBusBoxMask(ax - 0.93, lampTiltY, 0.21, 0.064, invX, invY) * front;
  float headLamp = slopBusCovAt(0.041, length(vec2(abs(ax - 0.91) - 0.07, lampTiltY)), invXY) * podMask;
  float drlStrip = slopBusBand(lampTiltY + 0.038, 0.011, invY) * podMask;
  float turnFront = slopBusBoxMask(ax - 1.05, p.y - 0.62, 0.075, 0.022, invX, invY) * front;

  float inRearStack = smoothstep(0.59, 0.61, p.y) * smoothstep(1.41, 1.39, p.y) * rear;
  float dRearLamp = length(vec2(ax - 1.03, (fract((p.y - 0.6) * 5.0) - 0.5) * 0.2));
  float rearBezel = slopBusCovAt(0.066, dRearLamp, invXY) * inRearStack;
  float rearLens = slopBusCovAt(0.049, dRearLamp, invXY) * inRearStack;
  float turnRear = rearLens * step(1.2, p.y);
  float tailLamp = rearLens * step(0.8, p.y) * step(p.y, 1.2);
  float reverseL = rearLens * step(p.y, 0.8);
  float sideMarkers = slopBusCovAt(0.025, length(vec2(az - ${(s.wheelZ + 0.68).toFixed(4)}, p.y - 1.02)), invZY) * side;

  float skyGrad = clamp((p.y - 1.22) * 0.85, 0.0, 1.0);
  float seatBack = smoothstep(1.64, 1.54, p.y) * smoothstep(0.1, 0.2, abs(fract(p.z * 1.15) - 0.5)) * smoothstep(3.85, 3.75, p.z);
  float grabRail = slopBusBand(fract(p.z * 0.76 + 0.5) - 0.5, 0.026, invZRep) * smoothstep(2.3, 2.26, p.y);
  float frontInt = smoothstep(1.62, 1.3, p.y) * smoothstep(0.15, 0.35, ax) * front;
  float ceilStrip = smoothstep(2.12, 2.32, p.y) * smoothstep(4.45, 4.35, p.z);
  vec3 baseGlass = mix(${glCol(0x0f1c2b)}, ${glCol(0x1f3852)}, skyGrad);
  vec3 glassTint = mix(mix(mix(baseGlass, ${glCol(0x0a1524)}, max(seatBack * 0.68, frontInt * 0.45)), ${glCol(0xb8921c)}, grabRail * side * 0.5), ${glCol(0x324d66)}, ceilStrip * 0.28);

  vec3 res = mix(liveryCol, ${glCol(0x12161b)}, max(seal, max(archFlareMask, rearSeam)));
  res = mix(res, ${glCol(0x181c22)} * slats, sideRearGrille);
  res = mix(res, ${glCol(0x282418)} * rearUpperSlats, rearLouverArea);
  res = mix(res, ${glCol(0x1c222b)}, rearAdFrame);
  res = mix(res, ${glCol(0x162e48)}, rearAdInner);
  res = mix(res, ${glCol(0x12151a)}, max(podMask, rearBezel));
  res = mix(res, ${glCol(0xf2f8ff)}, max(headLamp, drlStrip));
  res = mix(res, ${glCol(0xff9d14)}, max(turnFront, max(browMarker, sideMarkers)));
  res = mix(res, ${glCol(0x9e0e16)}, max(tailLamp, max(highBrake, rearIdLamps)));
  res = mix(res, ${glCol(0xd86e18)}, turnRear);
  res = mix(res, ${glCol(0xe8eef4)}, reverseL);
  res = mix(res, glassTint, glass);
  res = mix(mix(res, ${glCol(0x191d22)}, isTrim), ${glCol(0xd0d5dc)}, isPod);
  diffuseColor.rgb = res;

  float busRough = mix(mix(mix(0.16, 0.06, max(glass, max(headLamp, rearLens))), 0.68, max(isTrim, max(archFlareMask, seal * (1.0 - glass)))), 0.36, isPod);
  float busMetal = mix(mix(0.24, 0.82, glass), 0.06, max(isTrim, isPod));
  float brake = uBusState.x;
  float blink = max(uBusState.y * step(0.0, p.x), uBusState.z * step(p.x, 0.0));
  vec3 busEmit = ${glCol(0xe8f4ff)} * (podMask * 0.25 + drlStrip * 1.45 + headLamp * 1.8) + ${glCol(0xff9210)} * (max(browMarker, sideMarkers) * 0.75) + ${glCol(0xff9a14)} * (max(turnFront, turnRear) * blink * 2.1) + ${glCol(0xff0c14)} * (tailLamp * (brake * 1.6 + 0.65) + highBrake * brake * 1.8) + ${glCol(0xeef5ff)} * (reverseL * uBusState.w * 1.5);
`;

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `#include <common>
uniform vec4 uBusState;
uniform float uSlot;
varying vec3 vBusPos;
varying vec3 vBusNormal;
varying float vBusPart;
float slopBusCov(float d, float inv) { return clamp(0.5 - d * inv, 0.0, 1.0); }
float slopBusCovAt(float r, float d, float inv) { return clamp(0.5 - (d - r) * inv, 0.0, 1.0); }
float slopBusCovUp(float r, float d, float inv) { return clamp(0.5 + (d - r) * inv, 0.0, 1.0); }
float slopBusBand(float d, float h, float inv) { float halfW = 0.5 / inv; return clamp((min(d + h, halfW) - max(d - h, -halfW)) * inv, 0.0, 1.0); }
vec2 slopBusBoxEdge(float dx, float dy, float hx, float hy, float ix, float iy) {
  float ex = abs(dx) - hx; float ey = abs(dy) - hy;
  return vec2(max(ex, ey), mix(iy, ix, step(ey, ex)));
}
float slopBusBoxMask(float dx, float dy, float hx, float hy, float ix, float iy) {
  vec2 e = slopBusBoxEdge(dx, dy, hx, hy, ix, iy);
  return slopBusCov(e.x, e.y);
}
vec2 slopBusRBox(float dx, float dy, float hx, float hy, float r, float ix, float iy) {
  float ex = abs(dx) - (hx - r); float ey = abs(dy) - (hy - r);
  return vec2(length(vec2(max(ex, 0.0), max(ey, 0.0))) + min(max(ex, ey), 0.0) - r, mix(iy, ix, step(ey, ex)));
}
`,
      )
      .replace("#include <color_fragment>", `#include <color_fragment>\n${busFrag}`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n  roughnessFactor = busRough;")
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\n  metalnessFactor = busMetal;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  totalEmissiveRadiance += busEmit;");
  };
  return { mat, u };
}

function createSlopBusWheelMaterial(envMap: DataTexture): MeshStandardMaterial {
  const invBusScale = 1 / BUS_SCALE;
  const mat = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.45, envMap, envMapIntensity: 1.1 });
  mat.customProgramCacheKey = () => "slop-bus-wheel-v1";
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float partId;\nvarying vec3 vBWPos;\nvarying float vBWPart;\n")
      .replace("#include <begin_vertex>", `#include <begin_vertex>\nvBWPos = position * ${invBusScale.toFixed(6)};\nvBWPart = partId;\n`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBWPos;\nvarying float vBWPart;\n")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
  float isTyre = step(abs(vBWPart - 2.0), 0.25);
  float radial = length(vec2(vBWPos.z, vBWPos.y));
  float theta = atan(vBWPos.y, vBWPos.z);
  vec2 fwZY = max(vec2(fwidth(vBWPos.z), fwidth(vBWPos.y)), vec2(0.0015));
  vec2 rDir = vec2(vBWPos.z, vBWPos.y) / max(radial, 0.0001);
  float fwRing = abs(rDir.x) * fwZY.x + abs(rDir.y) * fwZY.y;
  float fwTan = abs(rDir.y) * fwZY.x + abs(rDir.x) * fwZY.y;
  float fwRound = max(fwRing, fwTan);
  float dFade = smoothstep(0.036, 0.008, fwRound);
  float a10 = (fract(theta * 1.5915494 + 0.5) - 0.5) * 0.6283185;
  float dLug = length(vec2(radial - 0.175, radial * a10));
  float lugs = clamp(0.5 - (dLug - 0.015) / fwRound, 0.0, 1.0) * dFade;
  float a5 = (fract((theta - 0.31) * 0.7957747 + 0.5) - 0.5) * 1.256637;
  float vents = clamp(0.5 - (length(vec2(radial - 0.238, radial * a5 * 0.85)) - 0.03) / fwRound, 0.0, 1.0) * smoothstep(0.06, 0.015, fwRound);
  float dish = smoothstep(0.16, 0.27, radial) * 0.22 + 0.78;
  vec3 disc = mix(mix(mix(mix(${glCol(0xdce2e8)} * dish, ${glCol(0x101317)}, vents * 0.92), ${glCol(0x22262b)}, clamp(0.5 - (radial - 0.115) / fwRing, 0.0, 1.0)), ${glCol(0x3a4048)}, clamp(0.5 - (radial - 0.068) / fwRing, 0.0, 1.0)), ${glCol(0x1e2228)}, lugs * 0.88);
  float sidewall = (smoothstep(0.295, 0.36, radial) * (1.0 - smoothstep(0.44, 0.495, radial) * 0.22)) * 0.28 + 0.72;
  diffuseColor.rgb = mix(disc, ${glCol(0x16181b)} * sidewall, isTyre);
  float bwRough = mix(mix(0.32, 0.78, max(vents, smoothstep(0.12, 0.1, radial))), 0.86, isTyre);
  float bwMetal = mix(mix(0.55, 0.15, vents), 0.02, isTyre);
`,
      )
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n  roughnessFactor = bwRough;")
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\n  metalnessFactor = bwMetal;");
  };
  return mat;
}

// ---------------------------------------------------------------------------------------------
// Geometry Cache & Pooled Actor Builder
// ---------------------------------------------------------------------------------------------

interface SlopAssets {
  body: BufferGeometry;
  liners: BufferGeometry;
  wheelL: BufferGeometry;
  wheelR: BufferGeometry;
  shadow: BufferGeometry;
  lightbar?: BufferGeometry;
  busSign?: BufferGeometry;
  wheelRPhys: number;
  wheelX: number;
  wheelZ: number;
}

const slopCache = new Map<FourWheelVehicleKind, SlopAssets>();

function getSlopAssets(kind: FourWheelVehicleKind): SlopAssets {
  const hit = slopCache.get(kind);
  if (hit) return hit;

  if (kind === "bus") {
    const body = buildLoftedBusChassisGeometry();
    const liners = buildBusWheelWellLiners();
    const wheelL = buildBusWheelGeo(-1);
    const wheelR = buildBusWheelGeo(1);
    const busSign = buildBusSignGeometry();
    const shadow = new PlaneGeometry(BUS_SPEC.halfWidth[0]![1] * BUS_SCALE * 2.25, (BUS_SPEC.zFront - BUS_SPEC.zRear) * BUS_SCALE * 1.08);
    shadow.rotateX(-Math.PI / 2);
    const created: SlopAssets = {
      body,
      liners,
      wheelL,
      wheelR,
      shadow,
      busSign,
      wheelRPhys: BUS_SPEC.wheelRadius * BUS_SCALE,
      wheelX: BUS_WHEEL_X * BUS_SCALE,
      wheelZ: BUS_SPEC.wheelZ * BUS_SCALE,
    };
    slopCache.set(kind, created);
    return created;
  }

  const spec = BODY_SPECS[kind];
  const body = buildCarChassisGeometry(spec);
  const liners = buildCarWheelWellLiners(spec);
  const wheelL = buildSteerableWheelGeo(spec, -1);
  const wheelR = buildSteerableWheelGeo(spec, 1);
  const hw = spec.halfWidth.reduce((m, p) => Math.max(m, p[1]), 0.9);
  const shadow = new PlaneGeometry(hw * 2.38, (spec.zFront - spec.zRear) * 1.12);
  shadow.rotateX(-Math.PI / 2);
  const lightbar = kind === "security" ? buildLightbarGeometry(spec) : undefined;
  const created: SlopAssets = {
    body,
    liners,
    wheelL,
    wheelR,
    shadow,
    lightbar,
    wheelRPhys: spec.wheelRadius,
    wheelX: spec.wheelX,
    wheelZ: spec.wheelZ,
  };
  slopCache.set(kind, created);
  return created;
}

const sharedShadowMat = new MeshBasicMaterial({
  map: getSlopShadowTex(),
  transparent: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -1,
});
const sharedLinerMat = new MeshStandardMaterial({ color: 0x111317, roughness: 0.9, metalness: 0.05 });
const sharedLiteLinerMat = new MeshLambertMaterial({ color: 0x14171c });
const sharedLiteWheelMat = new MeshLambertMaterial({ color: 0x22262e });

export interface SlopVehiclePose {
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

export interface SlopVehicleActor {
  readonly kind: VehicleKind;
  readonly root: Group;
  setPaint(hex: number): void;
  setStyle?(styleIdx: number, paintOverride?: number): void;
  update(steer: number, wheelSpin: number, braking: boolean, siren: boolean, t: number, pose?: SlopVehiclePose): void;
  dispose(): void;
}

/** Instantiates a 4-wheel slop-auckland procedural vehicle with clearcoat SDF shading (or basic-tier Lambert on software renderers). */
export function createSlopVehicleActor(kind: FourWheelVehicleKind, styleIdx = 0, paintOverride?: number, lite = false): SlopVehicleActor {
  const assets = getSlopAssets(kind);
  const styles = FLEET_STYLES[kind];
  const pickStyle = (idx: number, hex?: number): FleetStyle => {
    const base = styles[((Math.floor(idx) % styles.length) + styles.length) % styles.length]!;
    return hex !== undefined && kind === "sedan" ? { ...base, hex } : base;
  };
  let curStyle = pickStyle(styleIdx, paintOverride);

  const root = new Group();
  root.userData.noPick = true;

  const mark = <T extends Mesh>(m: T): T => {
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
  chassisPivot.position.y = assets.wheelRPhys;
  const chassisInner = new Group();
  chassisInner.position.y = -assets.wheelRPhys;
  chassisPivot.add(chassisInner);
  root.add(chassisPivot);

  if (lite) {
    const bodyMat = new MeshLambertMaterial({ color: curStyle.hex });
    chassisInner.add(mark(new Mesh(assets.body, bodyMat)));
    chassisInner.add(mark(new Mesh(assets.liners, sharedLiteLinerMat)));
    if (assets.lightbar) chassisInner.add(mark(new Mesh(assets.lightbar, sharedLiteWheelMat)));
    const wheels: { pivot: Group; spin: Group; front: boolean }[] = [];
    for (const [z, front] of [[assets.wheelZ, true], [-assets.wheelZ, false]] as const) {
      for (const sx of [-1, 1] as const) {
        const pivot = new Group();
        pivot.position.set(sx * assets.wheelX, assets.wheelRPhys, z);
        const spin = new Group();
        spin.add(mark(new Mesh(sx < 0 ? assets.wheelL : assets.wheelR, sharedLiteWheelMat)));
        pivot.add(spin);
        root.add(pivot);
        wheels.push({ pivot, spin, front });
      }
    }
    return {
      kind,
      root,
      setPaint(hex: number) {
        if (kind !== "security" && kind !== "taxi") bodyMat.color.setHex(hex);
      },
      setStyle(idx: number, hex?: number) {
        curStyle = pickStyle(idx, hex);
        bodyMat.color.setHex(curStyle.hex);
      },
      update(steer, wheelSpin, _braking, _siren, _t, pose) {
        chassisPivot.rotation.set(pose?.pitch ?? 0, 0, pose?.roll ?? 0);
        chassisPivot.position.y = assets.wheelRPhys + (pose?.heave ?? 0);
        for (const w of wheels) {
          w.pivot.rotation.y = w.front ? steer : 0;
          w.spin.rotation.x = wheelSpin;
        }
      },
      dispose() {
        bodyMat.dispose();
      },
    };
  }

  const envMap = getSlopVehicleEnvMap();

  const disposables: Material[] = [];
  let updateState: (brake: number, blinkL: number, blinkR: number, rev: number, dmg: number, siren: boolean, t: number) => void;
  let applyStyle: (s: FleetStyle) => void;

  if (kind === "bus") {
    const { mat: busMat, u: busU } = createSlopBusMaterial(styleIdx, envMap);
    const wheelMat = createSlopBusWheelMaterial(envMap);
    const signMat = new MeshBasicMaterial({ map: getBusSignTexture() });
    disposables.push(busMat, wheelMat, signMat);

    // Body mesh first inside chassisInner to keep child ordering consistent with tests
    chassisInner.add(mark(new Mesh(assets.body, busMat)));
    chassisInner.add(mark(new Mesh(assets.liners, sharedLinerMat)));
    if (assets.busSign) chassisInner.add(mark(new Mesh(assets.busSign, signMat)));

    const wheels: { pivot: Group; spin: Group; front: boolean }[] = [];
    for (const [z, front] of [[assets.wheelZ, true], [-assets.wheelZ, false]] as const) {
      for (const sx of [-1, 1] as const) {
        const pivot = new Group();
        pivot.position.set(sx * assets.wheelX, assets.wheelRPhys, z);
        const spin = new Group();
        spin.add(mark(new Mesh(sx < 0 ? assets.wheelL : assets.wheelR, wheelMat)));
        pivot.add(spin);
        root.add(pivot);
        wheels.push({ pivot, spin, front });
      }
    }

    updateState = (brake, blinkL, blinkR, rev) => {
      busU.uBusState.value.set(brake, blinkL, blinkR, rev);
    };
    applyStyle = (_s) => {
      busU.uSlot.value = styleIdx;
    };

    return {
      kind,
      root,
      setPaint() {},
      setStyle(idx: number) {
        styleIdx = idx;
        busU.uSlot.value = idx;
      },
      update(steer, wheelSpin, braking, siren, t, pose) {
        chassisPivot.rotation.set(pose?.pitch ?? 0, 0, pose?.roll ?? 0);
        chassisPivot.position.y = assets.wheelRPhys + (pose?.heave ?? 0);
        const blinkOn = ((t * 2.2) % 1) < 0.55 ? 1 : 0;
        const blinkL = steer > 0.16 ? blinkOn : 0;
        const blinkR = steer < -0.16 ? blinkOn : 0;
        updateState(braking ? 1 : 0, blinkL, blinkR, pose?.reversing ? 1 : 0, pose?.damage ?? 0, siren, t);
        for (const w of wheels) {
          w.pivot.rotation.y = w.front ? steer : 0;
          w.spin.rotation.x = wheelSpin;
        }
      },
      dispose() {
        for (const m of disposables) m.dispose();
      },
    };
  }

  const spec = BODY_SPECS[kind];
  const { mat: carMat, u: carU } = createSlopCarMaterial(spec, curStyle, envMap);
  const { mat: wheelMat, u: wheelU } = createSlopWheelMaterial(spec.wheelRadius, curStyle, envMap);
  disposables.push(carMat, wheelMat);

  chassisInner.add(mark(new Mesh(assets.body, carMat)));
  chassisInner.add(mark(new Mesh(assets.liners, sharedLinerMat)));

  let lbU: { uTime: { value: number }; uSiren: { value: number } } | undefined;
  if (assets.lightbar) {
    const lb = createSlopLightbarMaterial();
    lbU = lb.u;
    disposables.push(lb.mat);
    chassisInner.add(mark(new Mesh(assets.lightbar, lb.mat)));
  }

  const wheels: { pivot: Group; spin: Group; front: boolean }[] = [];
  for (const [z, front] of [[assets.wheelZ, true], [-assets.wheelZ, false]] as const) {
    for (const sx of [-1, 1] as const) {
      const pivot = new Group();
      pivot.position.set(sx * assets.wheelX, assets.wheelRPhys, z);
      const spin = new Group();
      spin.add(mark(new Mesh(sx < 0 ? assets.wheelL : assets.wheelR, wheelMat)));
      pivot.add(spin);
      root.add(pivot);
      wheels.push({ pivot, spin, front });
    }
  }

  applyStyle = (s: FleetStyle) => {
    curStyle = s;
    carU.uPaintColor.value.setHex(s.hex);
    carU.uStyle.value.set(s.livery, s.metallic, s.trim, s.wheel);
    wheelU.uStyle.value.set(s.livery, s.metallic, s.trim, s.wheel);
  };
  updateState = (brake, blinkL, blinkR, rev, dmg, siren, t) => {
    carU.uCarState.value.set(brake, blinkL, blinkR, rev);
    carU.uDamage.value = Math.max(0, Math.min(1, dmg));
    if (lbU) {
      lbU.uTime.value = t;
      lbU.uSiren.value = siren ? 1 : 0;
    }
  };

  return {
    kind,
    root,
    setPaint(hex: number) {
      if (kind !== "security" && kind !== "taxi") {
        carU.uPaintColor.value.setHex(hex);
      }
    },
    setStyle(idx: number, hex?: number) {
      applyStyle(pickStyle(idx, hex));
    },
    update(steer, wheelSpin, braking, siren, t, pose) {
      chassisPivot.rotation.set(pose?.pitch ?? 0, 0, pose?.roll ?? 0);
      chassisPivot.position.y = assets.wheelRPhys + (pose?.heave ?? 0);
      const blinkOn = ((t * 2.2) % 1) < 0.55 ? 1 : 0;
      const blinkL = steer > 0.16 ? blinkOn : 0;
      const blinkR = steer < -0.16 ? blinkOn : 0;
      updateState(braking ? 1 : 0, blinkL, blinkR, pose?.reversing ? 1 : 0, pose?.damage ?? 0, siren, t);
      for (const w of wheels) {
        w.pivot.rotation.y = w.front ? steer : 0;
        w.spin.rotation.x = wheelSpin;
      }
    },
    dispose() {
      for (const m of disposables) m.dispose();
    },
  };
}
