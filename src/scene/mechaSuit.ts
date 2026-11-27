// Articulated Iron-Man-inspired Mark-IV Exo-Suit ("mecha") actor:
// Sculpted clearcoat crimson & titanium gold armor plates, glowing cyan Arc Reactor & visor,
// dorsal flight stabilizer flaps, articulated limbs for ground stride & hydraulic punches,
// and horizontal 3D jet-flight posture with dynamic palm & boot plasma thruster plumes.
import {
  AdditiveBlending,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  type Material,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { VehicleActor, VehiclePose } from "./gameModels.ts";
import { getSlopVehicleEnvMap } from "./slopCars.ts";

interface MechaPalette {
  primary: number;
  accent: number;
  glow: number;
}

const MECHA_PALETTES: readonly MechaPalette[] = [
  { primary: 0xb81422, accent: 0xe5b85b, glow: 0x68f6ff }, // Mark-IV Crimson & Titanium Gold
  { primary: 0x262d38, accent: 0xc2cbd8, glow: 0x5ce6ff }, // Stealth Gunmetal & Silver
  { primary: 0x16489c, accent: 0xe5b85b, glow: 0x70f8ff }, // Deep Cobalt & Gold
  { primary: 0xe6ecf4, accent: 0xb81422, glow: 0x4de8ff }, // Orbital White & Crimson
];

let sharedShadowTex: CanvasTexture | undefined;
function getMechaShadowTex(): CanvasTexture {
  if (sharedShadowTex) return sharedShadowTex;
  if (typeof document === "undefined") {
    sharedShadowTex = new CanvasTexture({ width: 1, height: 1 } as unknown as HTMLCanvasElement);
    return sharedShadowTex;
  }
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, "rgba(0,0,0,0.68)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.3)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  sharedShadowTex = new CanvasTexture(c);
  return sharedShadowTex;
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

function makePlume(outerMat: Material, innerMat: Material, radius: number, length: number): Group {
  const g = new Group();
  const outer = new Mesh(new ConeGeometry(radius, length, 10, 1, true), outerMat);
  outer.rotation.x = Math.PI; // Apex at thruster nozzle, flare pointing -Y
  outer.position.y = -length * 0.5;
  outer.castShadow = false;
  outer.receiveShadow = false;
  outer.userData.noPick = true;
  outer.userData.noAO = true;

  const inner = new Mesh(new ConeGeometry(radius * 0.52, length * 0.72, 8, 1, true), innerMat);
  inner.rotation.x = Math.PI;
  inner.position.y = -length * 0.36;
  inner.castShadow = false;
  inner.receiveShadow = false;
  inner.userData.noPick = true;
  inner.userData.noAO = true;

  g.add(outer, inner);
  return g;
}

/** Instantiates a ~2.38 m Iron-Man-style Exo-Suit facing +Z at heading 0. */
export function createMechaActor(styleIdx = 0, paintOverride?: number, lite = false): VehicleActor {
  const pal0 = MECHA_PALETTES[((Math.floor(styleIdx) % MECHA_PALETTES.length) + MECHA_PALETTES.length) % MECHA_PALETTES.length]!;
  const envMap = lite ? undefined : getSlopVehicleEnvMap();

  const primaryMat = lite
    ? new MeshLambertMaterial({ color: paintOverride ?? pal0.primary })
    : new MeshPhysicalMaterial({
        color: paintOverride ?? pal0.primary,
        metalness: 0.74,
        roughness: 0.18,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        envMap,
        envMapIntensity: 1.55,
      });
  const accentMat = lite
    ? new MeshLambertMaterial({ color: pal0.accent })
    : new MeshPhysicalMaterial({
        color: pal0.accent,
        metalness: 0.86,
        roughness: 0.18,
        clearcoat: 0.9,
        clearcoatRoughness: 0.08,
        envMap,
        envMapIntensity: 1.45,
      });
  const frameMat = lite
    ? new MeshLambertMaterial({ color: 0x181d26 })
    : new MeshStandardMaterial({
        color: 0x181d26,
        metalness: 0.82,
        roughness: 0.34,
        envMap,
        envMapIntensity: 0.9,
      });
  const reactorRingMat = new MeshBasicMaterial({ color: 0x16b8ff });
  const reactorCoreMat = new MeshBasicMaterial({ color: pal0.glow });
  const plumeOuterMat = new MeshBasicMaterial({
    color: 0x24b4ff,
    transparent: true,
    opacity: 0.68,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const plumeInnerMat = new MeshBasicMaterial({
    color: 0xeaffff,
    transparent: true,
    opacity: 0.9,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const shadowMat = new MeshBasicMaterial({
    map: getMechaShadowTex(),
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });

  const disposables: Material[] = [
    primaryMat,
    accentMat,
    frameMat,
    reactorRingMat,
    reactorCoreMat,
    plumeOuterMat,
    plumeInnerMat,
    shadowMat,
  ];

  const mark = <T extends Mesh>(m: T): T => {
    m.castShadow = false;
    m.receiveShadow = false;
    m.userData.noPick = true;
    return m;
  };
  const part = (geo: ConstructorParameters<typeof Mesh>[0], mat: Material, at: [number, number, number], rot?: [number, number, number]) => {
    const m = mark(new Mesh(geo, mat));
    m.position.set(at[0], at[1], at[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    return m;
  };

  const root = new Group();
  root.userData.noPick = true;

  const shadowGeo = new PlaneGeometry(1.45, 1.45);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMesh = mark(new Mesh(shadowGeo, shadowMat));
  shadowMesh.position.y = 0.03;
  shadowMesh.renderOrder = 1;
  root.add(shadowMesh);

  // Center-of-mass pivot at hip/pelvis height (1.16 m) for natural Iron-Man forward pitch & banking
  const bodyPivot = new Group();
  bodyPivot.position.y = 1.16;
  root.add(bodyPivot);

  const torso = new Group();
  bodyPivot.add(torso);

  // Pelvis & segmented waist
  torso.add(
    part(new RoundedBoxGeometry(0.46, 0.22, 0.34, 2, 0.035), primaryMat, [0, -0.02, 0]),
    part(new RoundedBoxGeometry(0.24, 0.2, 0.36, 2, 0.03), accentMat, [0, -0.04, 0.02]),
    part(new RoundedBoxGeometry(0.38, 0.24, 0.29, 2, 0.03), frameMat, [0, 0.16, 0]),
    part(new RoundedBoxGeometry(0.32, 0.08, 0.31, 2, 0.02), accentMat, [0, 0.13, 0.01]),
    part(new RoundedBoxGeometry(0.34, 0.08, 0.31, 2, 0.02), primaryMat, [0, 0.23, 0.01]),
  );

  // Heroic V-tapered Chest Cuirass & Collar
  torso.add(
    part(new RoundedBoxGeometry(0.62, 0.38, 0.38, 3, 0.055), primaryMat, [0, 0.45, 0.02]),
    part(new RoundedBoxGeometry(0.25, 0.26, 0.08, 2, 0.025), accentMat, [-0.16, 0.48, 0.19], [-0.14, 0.2, 0.08]),
    part(new RoundedBoxGeometry(0.25, 0.26, 0.08, 2, 0.025), accentMat, [0.16, 0.48, 0.19], [-0.14, -0.2, -0.08]),
    part(new RoundedBoxGeometry(0.18, 0.06, 0.16, 2, 0.02), accentMat, [-0.24, 0.64, 0.03], [0.12, 0, -0.18]),
    part(new RoundedBoxGeometry(0.18, 0.06, 0.16, 2, 0.02), accentMat, [0.24, 0.64, 0.03], [0.12, 0, 0.18]),
    part(new RoundedBoxGeometry(0.36, 0.1, 0.3, 2, 0.03), frameMat, [0, 0.64, -0.01]),
    part(new CylinderGeometry(0.11, 0.13, 0.1, 12), frameMat, [0, 0.69, 0]),
  );

  // Glowing Chest Arc Reactor
  torso.add(
    part(new CylinderGeometry(0.105, 0.115, 0.045, 20), frameMat, [0, 0.47, 0.205], [Math.PI / 2, 0, 0]),
    part(new TorusGeometry(0.086, 0.015, 10, 22), accentMat, [0, 0.47, 0.228]),
    part(new TorusGeometry(0.064, 0.014, 10, 22), reactorRingMat, [0, 0.47, 0.232]),
    part(new CylinderGeometry(0.044, 0.044, 0.02, 16), reactorCoreMat, [0, 0.47, 0.226], [Math.PI / 2, 0, 0]),
  );

  // Dorsal Flight Spine, Glowing Reactor Slits & Articulated Airbrake Flaps (-Z back)
  torso.add(
    part(new RoundedBoxGeometry(0.36, 0.46, 0.16, 2, 0.03), primaryMat, [0, 0.44, -0.19]),
    part(new RoundedBoxGeometry(0.14, 0.48, 0.08, 2, 0.02), frameMat, [0, 0.43, -0.24]),
    part(new RoundedBoxGeometry(0.035, 0.09, 0.02, 1, 0.006), reactorCoreMat, [0, 0.56, -0.28]),
    part(new RoundedBoxGeometry(0.035, 0.09, 0.02, 1, 0.006), reactorCoreMat, [0, 0.43, -0.28]),
    part(new RoundedBoxGeometry(0.035, 0.09, 0.02, 1, 0.006), reactorCoreMat, [0, 0.3, -0.28]),
    part(new CylinderGeometry(0.035, 0.055, 0.08, 10), frameMat, [-0.11, 0.24, -0.24], [-0.25, 0, 0]),
    part(new CylinderGeometry(0.035, 0.055, 0.08, 10), frameMat, [0.11, 0.24, -0.24], [-0.25, 0, 0]),
  );

  const flapL = new Group();
  flapL.position.set(-0.15, 0.56, -0.24);
  flapL.add(part(new RoundedBoxGeometry(0.16, 0.34, 0.045, 2, 0.014), accentMat, [-0.07, -0.12, -0.02], [0.1, -0.18, 0.15]));
  const flapR = new Group();
  flapR.position.set(0.15, 0.56, -0.24);
  flapR.add(part(new RoundedBoxGeometry(0.16, 0.34, 0.045, 2, 0.014), accentMat, [0.07, -0.12, -0.02], [0.1, 0.18, -0.15]));
  torso.add(flapL, flapR);

  // Dorsal thruster plumes
  const packPlumeL = makePlume(plumeOuterMat, plumeInnerMat, 0.055, 0.55);
  packPlumeL.position.set(-0.11, 0.2, -0.25);
  packPlumeL.rotation.x = 0.22;
  const packPlumeR = makePlume(plumeOuterMat, plumeInnerMat, 0.055, 0.55);
  packPlumeR.position.set(0.11, 0.2, -0.25);
  packPlumeR.rotation.x = 0.22;
  torso.add(packPlumeL, packPlumeR);

  // Sculpted Helmet Head
  const headPivot = new Group();
  headPivot.position.set(0, 0.74, 0.01);
  torso.add(headPivot);
  headPivot.add(
    part(new RoundedBoxGeometry(0.24, 0.29, 0.27, 3, 0.065), primaryMat, [0, 0.15, 0]),
    part(new RoundedBoxGeometry(0.185, 0.23, 0.06, 2, 0.024), accentMat, [0, 0.145, 0.115], [-0.06, 0, 0]),
    // Brow ridge & chin guard
    part(new RoundedBoxGeometry(0.21, 0.055, 0.12, 2, 0.018), primaryMat, [0, 0.245, 0.095], [0.22, 0, 0]),
    part(new RoundedBoxGeometry(0.15, 0.06, 0.09, 2, 0.016), primaryMat, [0, 0.045, 0.105]),
    // Glowing eye slits
    part(new RoundedBoxGeometry(0.062, 0.022, 0.025, 1, 0.006), reactorCoreMat, [-0.048, 0.175, 0.142], [0, 0.14, 0.08]),
    part(new RoundedBoxGeometry(0.062, 0.022, 0.025, 1, 0.006), reactorCoreMat, [0.048, 0.175, 0.142], [0, -0.14, -0.08]),
  );

  // Articulated Arms (shoulders + elbows + palm repulsor thrusters)
  const buildArm = (side: -1 | 1) => {
    const shoulder = new Group();
    shoulder.position.set(side * 0.39, 0.56, 0.01);
    torso.add(shoulder);

    // Layered shoulder pauldron + bicep
    shoulder.add(
      part(new SphereGeometry(0.115, 12, 10), frameMat, [0, 0, 0]),
      part(new RoundedBoxGeometry(0.21, 0.19, 0.24, 2, 0.045), primaryMat, [side * 0.045, 0.04, 0], [0, 0, -side * 0.24]),
      part(new RoundedBoxGeometry(0.15, 0.08, 0.18, 2, 0.02), accentMat, [side * 0.05, 0.09, 0], [0, 0, -side * 0.24]),
      part(new CylinderGeometry(0.078, 0.07, 0.28, 12), frameMat, [side * 0.03, -0.16, 0]),
      part(new RoundedBoxGeometry(0.15, 0.22, 0.16, 2, 0.035), accentMat, [side * 0.04, -0.17, 0]),
    );

    const elbow = new Group();
    elbow.position.set(side * 0.03, -0.33, 0);
    shoulder.add(elbow);

    elbow.add(
      part(new SphereGeometry(0.068, 10, 8), frameMat, [0, 0, 0]),
      part(new RoundedBoxGeometry(0.155, 0.31, 0.175, 2, 0.038), primaryMat, [0, -0.16, 0.01]),
      part(new RoundedBoxGeometry(0.09, 0.22, 0.185, 2, 0.02), accentMat, [side * 0.02, -0.15, 0.015]),
      // Armored fist & glowing palm repulsor emitter
      part(new RoundedBoxGeometry(0.125, 0.11, 0.135, 2, 0.025), primaryMat, [0, -0.34, 0.02]),
      part(new CylinderGeometry(0.038, 0.038, 0.025, 12), reactorCoreMat, [0, -0.39, 0.02]),
    );

    const plume = makePlume(plumeOuterMat, plumeInnerMat, 0.052, 0.56);
    plume.position.set(0, -0.4, 0.02);
    elbow.add(plume);

    return { shoulder, elbow, plume };
  };
  const armL = buildArm(-1);
  const armR = buildArm(1);

  // Articulated Legs (hips + knees + boot thrusters)
  const buildLeg = (side: -1 | 1) => {
    const hip = new Group();
    hip.position.set(side * 0.17, -0.1, 0);
    torso.add(hip);

    hip.add(
      part(new SphereGeometry(0.095, 10, 8), frameMat, [0, 0, 0]),
      part(new RoundedBoxGeometry(0.21, 0.44, 0.24, 3, 0.05), primaryMat, [0, -0.24, 0]),
      part(new RoundedBoxGeometry(0.13, 0.3, 0.25, 2, 0.03), accentMat, [0, -0.24, 0.01]),
    );

    const knee = new Group();
    knee.position.set(0, -0.49, 0);
    hip.add(knee);

    knee.add(
      part(new RoundedBoxGeometry(0.16, 0.15, 0.18, 2, 0.035), accentMat, [0, 0, 0.05]),
      part(new RoundedBoxGeometry(0.19, 0.45, 0.22, 3, 0.045), primaryMat, [0, -0.25, -0.01]),
      part(new RoundedBoxGeometry(0.12, 0.34, 0.23, 2, 0.025), accentMat, [0, -0.24, 0.01]),
      // Boot & sole thruster nozzle (bottom reaches -0.57 -> + (-0.49) + (-0.10) + 1.16 = 0.00 m!)
      part(new RoundedBoxGeometry(0.21, 0.13, 0.34, 2, 0.035), primaryMat, [0, -0.505, 0.05]),
      part(new CylinderGeometry(0.07, 0.085, 0.045, 14), frameMat, [0, -0.565, 0.03]),
      part(new CylinderGeometry(0.055, 0.055, 0.02, 12), reactorCoreMat, [0, -0.572, 0.03]),
    );

    const plume = makePlume(plumeOuterMat, plumeInnerMat, 0.082, 0.92);
    plume.position.set(0, -0.58, 0.03);
    knee.add(plume);

    return { hip, knee, plume };
  };
  const legL = buildLeg(-1);
  const legR = buildLeg(1);

  const _e = new Euler(0, 0, 0, "YXZ");

  return {
    kind: "mecha",
    root,
    setPaint(hex: number) {
      primaryMat.color.setHex(hex);
    },
    setStyle(idx: number, overrideHex?: number) {
      const p = MECHA_PALETTES[((Math.floor(idx) % MECHA_PALETTES.length) + MECHA_PALETTES.length) % MECHA_PALETTES.length]!;
      primaryMat.color.setHex(overrideHex ?? p.primary);
      accentMat.color.setHex(p.accent);
      reactorCoreMat.color.setHex(p.glow);
    },
    update(steer: number, wheelSpin: number, braking: boolean, _siren: boolean, t: number, pose?: VehiclePose) {
      const alt = pose?.altitude ?? 0;
      const flying = !!pose?.flying || alt > 0.2;
      const thrust = clamp(pose?.thrust ?? (flying ? 0.55 : 0), 0, 1);
      const speed = Math.abs(pose?.speed ?? 0);
      const jet = flying ? clamp(speed / 24, 0, 1) : 0;
      const atk = clamp(pose?.attackT ?? 0, 0, 1);

      // Ground contact shadow projected downward from suit's altitude
      shadowMesh.position.y = 0.03 - alt;
      const shadowVis = alt < 20;
      shadowMesh.visible = shadowVis;
      if (shadowVis) {
        const sc = Math.max(0.4, 1 - alt * 0.03);
        shadowMesh.scale.set(sc, 1, sc);
        shadowMat.opacity = 0.6 * Math.max(0, 1 - alt / 20);
      }

      // Hover bob in mid-air or subtle power stance breathing on ground
      const bob = flying ? Math.sin(t * 3.8) * 0.05 * (1 - jet * 0.5) : Math.sin(t * 2.4) * 0.012;
      bodyPivot.position.y = 1.16 + (pose?.heave ?? 0) + bob;

      // Positive pitch rotates +Y toward +Z (superman forward flight lean)
      _e.set(pose?.pitch ?? 0, 0, pose?.roll ?? 0, "YXZ");
      bodyPivot.quaternion.setFromEuler(_e);

      // Helmet looks forward along flight vector when pitched horizontally
      headPivot.rotation.set(flying ? -0.58 * jet : 0, clamp(-steer * 0.35, -0.35, 0.35), 0);

      // Dorsal flight stabilizer flaps open dynamically in flight or under braking
      const flapOpen = flying ? 0.45 + jet * 0.45 + (braking ? 0.4 : 0) : 0.06;
      flapL.rotation.set(0.25 * flapOpen, -flapOpen, 0.35 * flapOpen);
      flapR.rotation.set(0.25 * flapOpen, flapOpen, -0.35 * flapOpen);

      if (flying) {
        // Legs: subtle dynamic stagger during hover, locked & streamlined at high speed
        const hoverSpread = (1 - jet) * 0.1;
        legL.hip.rotation.set(0.08 * (1 - jet) - hoverSpread * 0.5, 0, -0.055 * (1 - jet));
        legL.knee.rotation.set(0.18 * (1 - jet), 0, 0);
        legR.hip.rotation.set(-0.04 * (1 - jet) + hoverSpread, 0, 0.055 * (1 - jet));
        legR.knee.rotation.set(0.08 * (1 - jet), 0, 0);

        // Arms: outward hover stabilizers -> swept back along hips at supersonic speed
        const armOut = 0.36 * (1 - jet * 0.68);
        const armBack = 0.24 + 0.16 * jet;
        armL.shoulder.rotation.set(armBack, 0, -armOut);
        armL.elbow.rotation.set(-0.22 * (1 - jet * 0.7), 0, 0);
        armR.shoulder.rotation.set(armBack, 0, armOut);
        armR.elbow.rotation.set(-0.22 * (1 - jet * 0.7), 0, 0);
      } else {
        // Ground hydraulic walk / sprint stride driven by wheelSpin phase
        const stride = clamp(speed / 5.5, 0, 1);
        const s = Math.sin(wheelSpin);
        const c = Math.cos(wheelSpin);
        legL.hip.rotation.set(-s * 0.62 * stride, 0, -0.03);
        legL.knee.rotation.set(Math.max(0, c) * 0.78 * stride, 0, 0);
        legR.hip.rotation.set(s * 0.62 * stride, 0, 0.03);
        legR.knee.rotation.set(Math.max(0, -c) * 0.78 * stride, 0, 0);

        armL.shoulder.rotation.set(s * 0.5 * stride + 0.06, 0, -0.08);
        armL.elbow.rotation.set(-0.28 - Math.max(0, -s) * 0.35 * stride, 0, 0);
        armR.shoulder.rotation.set(-s * 0.5 * stride + 0.06, 0, 0.08);
        armR.elbow.rotation.set(-0.28 - Math.max(0, s) * 0.35 * stride, 0, 0);
      }

      // Hydraulic melee right punch override
      if (atk > 0.01) {
        const swing = Math.sin(atk * Math.PI);
        armR.shoulder.rotation.x = -1.48 * swing;
        armR.shoulder.rotation.z = 0.06;
        armR.elbow.rotation.x = -0.18 * (1 - swing * 0.6);
      }

      // Plasma thruster plumes: boot & palm jets stay off while walking/running on ground so flames never clip terrain
      const flicker = 0.88 + Math.sin(t * 44) * 0.12;
      const bootOn = flying;
      const bootScale = bootOn ? (0.45 + thrust * 0.95) * flicker : 0;
      const palmScale = flying ? (0.35 + thrust * 0.7) * flicker : atk > 0.05 ? 0.55 * Math.sin(atk * Math.PI) : 0;
      const packScale = flying ? (0.4 + thrust * 0.85) * flicker : thrust > 0.15 ? thrust * 1.1 * flicker : 0;

      legL.plume.visible = bootScale > 0.02;
      legR.plume.visible = bootScale > 0.02;
      if (bootScale > 0.02) {
        legL.plume.scale.set(0.85 + thrust * 0.25, bootScale, 0.85 + thrust * 0.25);
        legR.plume.scale.set(0.85 + thrust * 0.25, bootScale, 0.85 + thrust * 0.25);
      }

      armL.plume.visible = palmScale > 0.02;
      armR.plume.visible = palmScale > 0.02;
      if (palmScale > 0.02) {
        armL.plume.scale.set(0.8, palmScale, 0.8);
        armR.plume.scale.set(0.8, palmScale, 0.8);
      }

      packPlumeL.visible = packScale > 0.02;
      packPlumeR.visible = packScale > 0.02;
      if (packScale > 0.02) {
        packPlumeL.scale.set(0.9, packScale, 0.9);
        packPlumeR.scale.set(0.9, packScale, 0.9);
      }
    },
    dispose() {
      for (const m of disposables) m.dispose();
    },
  };
}
