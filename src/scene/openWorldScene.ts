// Realistic open-world scene layer: pooled cloned walker.glb human NPCs (<= 14 within 110 m),
// lofted multi-part traffic/player vehicles & e-scooters, the "Slice Co." wood-fired pizza van,
// compact campus stands, and grounded pickups (<= 0.45 m) with subtle low ground rings.
// All dynamic InstancedMeshes use gameBuffers.ts (everyFrame/sendInstances/disposeInstances),
// castShadow = false, and userData.noPick = true.
import {
  AdditiveBlending,
  AnimationMixer,
  BufferAttribute,
  Color,
  CylinderGeometry,
  DoubleSide,
  Euler,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Quaternion,
  RingGeometry,
  Vector3,
  type AnimationAction,
  type AnimationClip,
  type Bone,
  type BufferGeometry,
  type Material,
  type Object3D,
  type SkinnedMesh,
} from "three";
import { disposeInstances, everyFrame, sendInstances } from "./gameBuffers.ts";
import { yawOf } from "./gameFx.ts";
import { clone, loadBody, makeHumanNpcGear, type HumanNpcGear } from "./figureBuild.ts";
import {
  PICKUP_COLORS,
  VEHICLE_PAINTS,
  VEHICLE_SPECS,
  campusPropGeo,
  campusStandAsset,
  createProceduralHuman,
  createVehicleActor,
  pickupGeo,
  sliceCoVanAsset,
  type HumanRole,
  type PickupKind,
  type ProceduralHuman,
  type PropKind,
  type VehicleActor,
  type VehicleKind,
} from "./gameModels.ts";

export interface OpenWorldHuman {
  id: number;
  role: HumanRole;
  at: [number, number];
  heading: number;
  speed: number;
  style: number;
  state?: string;
  target?: boolean;
}

export interface OpenWorldVehicle {
  id: number;
  kind: VehicleKind;
  at: [number, number];
  heading: number;
  speed: number;
  steer?: number;
  colorIdx?: number;
  braking?: boolean;
  siren?: boolean;
  pitch?: number;
  roll?: number;
  heave?: number;
  hp?: number;
  maxHp?: number;
  altitude?: number;
  flying?: boolean;
  thrust?: number;
  attackT?: number;
}

export interface OpenWorldPickup {
  id: number;
  kind: PickupKind;
  at: [number, number];
}

export interface OpenWorldSpot {
  id: string;
  kind: "pizzaCart" | "clubStand";
  at: [number, number];
  heading: number;
  radius: number;
  cooldown: number;
}

export interface OpenWorldProp {
  id: number;
  kind: PropKind;
  at: [number, number];
  heading: number;
  y: number;
  tilt: number;
  tiltDir: number;
}

export interface OpenWorldSyncInput {
  t: number;
  dt: number;
  viewerAt: [number, number];
  groundAt: (x: number, y: number) => number;
  humans: readonly OpenWorldHuman[];
  vehicles: readonly OpenWorldVehicle[];
  pickups: readonly OpenWorldPickup[];
  spots: readonly OpenWorldSpot[];
  props?: readonly OpenWorldProp[];
  checkpoint?: [number, number];
}

const MAX_HUMANS = 30;
const HUMAN_RANGE = 120;
const MAX_VEHICLES = 26;
const VEHICLE_RANGE = 185;
const MAX_PICKUPS_PER_KIND = 32;
const MAX_PROPS_PER_KIND = 24;
const MAX_RINGS = 96;
const MAX_SPOTS = 8;

const _m = new Matrix4();
const _p = new Vector3();
const _q = new Quaternion();
const _qTilt = new Quaternion();
const _axis = new Vector3();
const _s = new Vector3();
const _e = new Euler(0, 0, 0, "YXZ");
const _c = new Color();

interface SkinnedNpc {
  root: Group;
  mixer: AnimationMixer;
  idle: AnimationAction;
  walk: AnimationAction;
  run: AnimationAction;
  rightArm?: Bone;
  gear: HumanNpcGear;
  baseRightArmQ?: Quaternion;
  paletteIdx: number;
  roleKey: string;
}

interface HumanSlot {
  id: number;
  root: Group;
  proc?: ProceduralHuman;
  skinned?: SkinnedNpc;
  paletteIdx: number;
  roleKey: string;
  attackT: number;
  downBlend: number;
  staggerBlend: number;
  lastSeen: number;
}

interface VehicleSlot {
  id: number;
  actor: VehicleActor;
  wheelSpin: number;
  colorIdx: number;
  lastSeen: number;
}

function propsForRole(role: HumanRole, style: number): { paletteIdx: number; backpack: boolean; cap: boolean; hiVisVest: boolean; clipboard: boolean } {
  if (role === "security") {
    return { paletteIdx: 10 + (Math.abs(style) % 2), backpack: false, cap: true, hiVisVest: true, clipboard: false };
  }
  if (role === "giver") {
    return { paletteIdx: Math.abs(style) % 8, backpack: false, cap: false, hiVisVest: false, clipboard: true };
  }
  if (role === "freeRider" || role === "debateRival" || role === "allNighter") {
    return {
      paletteIdx: Math.abs(style) % 8,
      backpack: role !== "debateRival",
      cap: role === "freeRider",
      hiVisVest: false,
      clipboard: role === "debateRival",
    };
  }
  const st = Math.abs(style);
  return {
    paletteIdx: st === 9 ? 9 : st % 8,
    backpack: st !== 9 && st % 3 !== 0,
    cap: st === 9 || st % 5 === 0,
    hiVisVest: false,
    clipboard: false,
  };
}

/** Open-world 3D scene layer for human NPCs, vehicles, Slice Co. pizza van, stands, and grounded pickups. */
export class OpenWorldScene {
  readonly group = new Group();
  private bodyAsset?: { scene: Object3D; clips: AnimationClip[] };
  private bodyLoading = false;

  private humanSlots = new Map<number, HumanSlot>();
  private vehicleSlots = new Map<number, VehicleSlot>();
  private spotNodes = new Map<string, { kind: "pizzaCart" | "clubStand"; root: Group }>();
  private sharedSignMat?: Material;

  private meshes: InstancedMesh[] = [];
  private geos: BufferGeometry[] = [];
  private mats: Material[] = [];

  private pickupMeshes: Record<PickupKind, InstancedMesh>;
  private propMeshes: Record<PropKind, InstancedMesh>;
  private ringMesh: InstancedMesh;
  private indicatorMesh: InstancedMesh;
  private checkpointRim: InstancedMesh;

  private frame = 0;

  constructor(preloadBody = true) {
    this.group.userData.noPick = true;
    const litMat = new MeshLambertMaterial({ vertexColors: true });
    const ringMat = new MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      transparent: true,
      opacity: 0.42,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
    });
    const indMat = new MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      side: DoubleSide,
    });
    this.mats.push(litMat, ringMat, indMat);

    const inst = (geo: BufferGeometry, mat: Material, cap: number, color: boolean, order = 0) => {
      this.geos.push(geo);
      const m = new InstancedMesh(geo, mat, cap);
      if (color) m.setColorAt(0, _c.setRGB(1, 1, 1));
      everyFrame(m);
      m.count = 0;
      m.visible = false;
      m.frustumCulled = false;
      m.castShadow = false;
      m.receiveShadow = false;
      m.renderOrder = order;
      m.userData.noPick = true;
      this.group.add(m);
      this.meshes.push(m);
      return m;
    };

    this.pickupMeshes = {
      pizza: inst(pickupGeo("pizza"), litMat, MAX_PICKUPS_PER_KIND, false),
      cash: inst(pickupGeo("cash"), litMat, MAX_PICKUPS_PER_KIND, false),
      coffee: inst(pickupGeo("coffee"), litMat, MAX_PICKUPS_PER_KIND, false),
      package: inst(pickupGeo("package"), litMat, MAX_PICKUPS_PER_KIND, false),
    };

    this.propMeshes = {
      bin: inst(campusPropGeo("bin"), litMat, MAX_PROPS_PER_KIND, false),
      cone: inst(campusPropGeo("cone"), litMat, MAX_PROPS_PER_KIND, false),
      sign: inst(campusPropGeo("sign"), litMat, MAX_PROPS_PER_KIND, false),
      chair: inst(campusPropGeo("chair"), litMat, MAX_PROPS_PER_KIND, false),
      box: inst(campusPropGeo("box"), litMat, MAX_PROPS_PER_KIND, false),
    };

    const ringGeo = new RingGeometry(0.48, 0.62, 24);
    ringGeo.rotateX(-Math.PI / 2);
    ringGeo.setAttribute("color", new BufferAttribute(new Float32Array(ringGeo.getAttribute("position").count * 3).fill(1), 3));
    this.ringMesh = inst(ringGeo, ringMat, MAX_RINGS, true, 2);

    // Small tasteful overhead ring/disc for mission givers & targets (no 14 m laser beams).
    const indGeo = new RingGeometry(0.14, 0.24, 18);
    indGeo.rotateX(-Math.PI / 2);
    indGeo.setAttribute("color", new BufferAttribute(new Float32Array(indGeo.getAttribute("position").count * 3).fill(1), 3));
    this.indicatorMesh = inst(indGeo, indMat, MAX_HUMANS, true, 3);

    // Subtle low rim for active GPS/race checkpoint.
    const cpGeo = new CylinderGeometry(2.1, 2.25, 0.28, 28, 1, true);
    cpGeo.translate(0, 0.14, 0);
    const cpPos = cpGeo.getAttribute("position");
    const cpCol = new Float32Array(cpPos.count * 3);
    for (let i = 0; i < cpPos.count; i++) {
      const k = cpPos.getY(i) > 0.2 ? 0 : 0.85;
      cpCol.set([k, k, k], i * 3);
    }
    cpGeo.setAttribute("color", new BufferAttribute(cpCol, 3));
    this.checkpointRim = inst(cpGeo, ringMat, 4, true, 2);

    if (preloadBody && typeof window !== "undefined") {
      this.ensureBodyLoaded();
    }
  }

  private ensureBodyLoaded(): void {
    if (this.bodyAsset || this.bodyLoading) return;
    this.bodyLoading = true;
    void loadBody()
      .then((asset) => {
        this.bodyAsset = asset;
      })
      .catch(() => {
        // Headless or test environment without walker.glb: procedural fallback handles rendering.
      });
  }

  private buildSkinnedNpc(role: HumanRole, style: number): SkinnedNpc | undefined {
    if (!this.bodyAsset) return undefined;
    const cfg = propsForRole(role, style);
    const root = clone(this.bodyAsset.scene) as Group;
    let mesh: SkinnedMesh | undefined;
    const bones = new Map<string, Bone>();
    root.traverse((o) => {
      o.userData.noPick = true;
      if ((o as SkinnedMesh).isSkinnedMesh) {
        mesh = o as SkinnedMesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.frustumCulled = false;
      }
      if ((o as Bone).isBone) bones.set(o.name, o as Bone);
    });
    if (!mesh) return undefined;

    for (const side of ["Left", "Right"]) {
      bones.get(`${side}Arm`)?.position.multiplyScalar(0.88);
      bones.get(`${side}Hand`)?.scale.setScalar(0.85);
    }

    const mixer = new AnimationMixer(root);
    const clip = (name: string) => {
      const c = this.bodyAsset!.clips.find((x) => x.name === name) ?? this.bodyAsset!.clips[0]!;
      const a = mixer.clipAction(c);
      a.play();
      return a;
    };
    const idle = clip("idle");
    const walk = clip("walk");
    const run = clip("run");
    idle.setEffectiveWeight(1);
    walk.setEffectiveWeight(0);
    run.setEffectiveWeight(0);
    mixer.update(0);
    root.updateMatrixWorld(true);

    const gear = makeHumanNpcGear(
      root,
      mesh,
      (name) => root.worldToLocal(bones.get(name)!.getWorldPosition(new Vector3())),
      cfg.paletteIdx,
      cfg,
    );
    mesh.material = gear.skin;
    const attachToBone = (part: Mesh | undefined, boneName: string) => {
      if (!part) return;
      root.add(part);
      part.updateMatrixWorld(true);
      bones.get(boneName)?.attach(part);
    };
    attachToBone(gear.hair, "Head");
    attachToBone(gear.cap, "Head");
    attachToBone(gear.backpack, "Spine2");
    attachToBone(gear.hiVisVest, "Spine2");
    if (gear.clipboard) {
      const hand = bones.get("RightHand");
      if (hand) {
        gear.clipboard.position.set(0.02, 0.08, -0.02);
        gear.clipboard.rotation.set(Math.PI / 2, 0, 0.25);
        hand.add(gear.clipboard);
      }
    }
    root.add(gear.blot);
    const rightArm = bones.get("RightArm");
    return {
      root,
      mixer,
      idle,
      walk,
      run,
      rightArm,
      gear,
      baseRightArmQ: rightArm?.quaternion.clone(),
      paletteIdx: cfg.paletteIdx,
      roleKey: `${role}:${cfg.cap}:${cfg.hiVisVest}:${cfg.clipboard}:${cfg.backpack}`,
    };
  }

  /** Synchronises all open-world entities for the current frame. */
  sync(input: OpenWorldSyncInput): void {
    const { t, dt, viewerAt, groundAt, humans, vehicles, pickups, spots, props, checkpoint } = input;
    this.frame++;
    const f = this.frame;

    this.syncSpots(groundAt, spots, t);
    this.syncHumans(t, dt, viewerAt, groundAt, humans, f);
    this.syncVehicles(t, dt, viewerAt, groundAt, vehicles, f);
    this.syncPickups(t, groundAt, pickups, spots, checkpoint);
    this.syncProps(viewerAt, groundAt, props ?? []);
  }

  private syncSpots(groundAt: (x: number, y: number) => number, spots: readonly OpenWorldSpot[], t: number): void {
    void t;
    const seen = new Set<string>();
    for (let i = 0; i < Math.min(MAX_SPOTS, spots.length); i++) {
      const s = spots[i]!;
      seen.add(s.id);
      let node = this.spotNodes.get(s.id);
      if (!node || node.kind !== s.kind) {
        if (node) {
          node.root.removeFromParent();
          node.root.traverse((o) => {
            const m = o as Mesh;
            if (m.isMesh && m.material !== this.mats[0] && m.material !== this.sharedSignMat) (m.material as Material).dispose();
          });
          this.spotNodes.delete(s.id);
        }
        const asset = s.kind === "pizzaCart" ? sliceCoVanAsset() : campusStandAsset();
        if (asset.signMat) this.sharedSignMat = asset.signMat;
        const root = new Group();
        root.userData.noPick = true;
        const lit = new Mesh(asset.lit, this.mats[0]!);
        lit.castShadow = false;
        lit.receiveShadow = false;
        lit.userData.noPick = true;
        const glow = new Mesh(asset.glow, new MeshBasicMaterial({ vertexColors: true }));
        glow.castShadow = false;
        glow.receiveShadow = false;
        glow.userData.noPick = true;
        root.add(lit, glow);
        if (asset.sign && asset.signMat) {
          const sign = new Mesh(asset.sign, asset.signMat);
          sign.castShadow = false;
          sign.receiveShadow = false;
          sign.userData.noPick = true;
          root.add(sign);
        }
        this.group.add(root);
        node = { kind: s.kind, root };
        this.spotNodes.set(s.id, node);
      }
      node.root.visible = true;
      node.root.position.set(s.at[0], groundAt(s.at[0], s.at[1]), -s.at[1]);
      node.root.rotation.set(0, yawOf(s.heading), 0);
    }
    for (const [id, node] of this.spotNodes) {
      if (!seen.has(id)) node.root.visible = false;
    }
  }

  private syncHumans(
    t: number,
    dt: number,
    viewerAt: [number, number],
    groundAt: (x: number, y: number) => number,
    humans: readonly OpenWorldHuman[],
    f: number,
  ): void {
    // Cap active human actors to <= 14 nearest within 110 m.
    const near: { h: OpenWorldHuman; d2: number }[] = [];
    const maxR2 = HUMAN_RANGE * HUMAN_RANGE;
    for (const h of humans) {
      const dx = h.at[0] - viewerAt[0];
      const dy = h.at[1] - viewerAt[1];
      const d2 = dx * dx + dy * dy;
      if (d2 <= maxR2) near.push({ h, d2 });
    }
    if (near.length > MAX_HUMANS) {
      near.sort((a, b) => a.d2 - b.d2);
      near.length = MAX_HUMANS;
    }

    let nInd = 0;
    for (const { h, d2 } of near) {
      const cfg = propsForRole(h.role, h.style);
      const roleKey = `${h.role}:${cfg.cap}:${cfg.hiVisVest}:${cfg.clipboard}:${cfg.backpack}`;
      let slot = this.humanSlots.get(h.id);
      if (!slot || slot.roleKey !== roleKey || slot.paletteIdx !== cfg.paletteIdx) {
        if (slot) {
          slot.root.removeFromParent();
          slot.skinned?.mixer.stopAllAction();
          this.humanSlots.delete(h.id);
        }
        const root = new Group();
        root.userData.noPick = true;
        this.group.add(root);
        const skinned = this.buildSkinnedNpc(h.role, h.style);
        const proc = skinned ? undefined : createProceduralHuman(cfg.paletteIdx, cfg);
        root.add(skinned ? skinned.root : proc!.root);
        slot = { id: h.id, root, skinned, proc, paletteIdx: cfg.paletteIdx, roleKey, attackT: 0, downBlend: 0, staggerBlend: 0, lastSeen: f };
        this.humanSlots.set(h.id, slot);
      } else if (!slot.skinned && this.bodyAsset) {
        // Upgrade from procedural fallback once walker.glb arrives.
        const skinned = this.buildSkinnedNpc(h.role, h.style);
        if (skinned) {
          slot.proc?.root.removeFromParent();
          slot.proc = undefined;
          slot.skinned = skinned;
          slot.root.add(skinned.root);
        }
      }
      slot.lastSeen = f;

      const gy = groundAt(h.at[0], h.at[1]);
      slot.root.position.set(h.at[0], gy, -h.at[1]);
      // Both walker.glb and procedural fallback face -z at heading 0.
      slot.root.rotation.set(0, (-h.heading * Math.PI) / 180, 0);

      const attacking = h.state === "attack" || h.state === "tell";
      const down = h.state === "down" || h.state === "dead";
      const stagger = h.state === "stagger";
      if (dt > 0) {
        slot.attackT = attacking ? Math.min(1, slot.attackT + dt * 3.5) : Math.max(0, slot.attackT - dt * 4);
        slot.downBlend += ((down ? 1 : 0) - slot.downBlend) * Math.min(1, dt * 6.5);
        slot.staggerBlend += ((stagger ? 1 : 0) - slot.staggerBlend) * Math.min(1, dt * 9);
      } else {
        slot.downBlend = down ? 1 : 0;
        slot.staggerBlend = stagger ? 1 : 0;
      }

      if (slot.skinned) {
        const sk = slot.skinned;
        if (down || slot.downBlend > 0.02) {
          sk.idle.setEffectiveWeight(1);
          sk.walk.setEffectiveWeight(0);
          sk.run.setEffectiveWeight(0);
          if (dt > 0) sk.mixer.update(dt);
          sk.root.rotation.x = -Math.PI * 0.47 * slot.downBlend;
          sk.root.position.y = 0.14 * slot.downBlend;
        } else {
          const moving = Math.min(1, h.speed / 1.3);
          const runW = Math.max(0, Math.min(1, (h.speed - 2.2) / 1.4));
          sk.idle.setEffectiveWeight(1 - moving);
          sk.walk.setEffectiveWeight(moving * (1 - runW));
          sk.run.setEffectiveWeight(moving * runW);
          // Freeze mixer updates when paused (dt <= 0); throttle far non-combatants to save CPU under SwiftShader.
          if (dt > 0) {
            if (d2 <= 50 * 50 || attacking || (f + h.id) % 2 === 0) {
              sk.mixer.update(d2 > 50 * 50 && !attacking ? dt * 2 : dt);
            }
            if (sk.rightArm && slot.attackT > 0.01) {
              _q.setFromAxisAngle(_p.set(1, 0, 0), -1.3 * Math.sin(slot.attackT * Math.PI));
              sk.rightArm.quaternion.multiply(_q);
            }
          }
          sk.root.rotation.x = -0.34 * slot.staggerBlend;
          sk.root.position.y = 0;
        }
      } else if (slot.proc) {
        slot.proc.pose(down ? 0 : h.speed, t + h.id * 0.7, slot.attackT, stagger, down);
      }

      if ((h.role === "giver" || h.target) && nInd < MAX_HUMANS) {
        _p.set(h.at[0], gy + 2.12 + Math.sin(t * 3 + h.id) * 0.04, -h.at[1]);
        _q.identity();
        _s.setScalar(1);
        _m.compose(_p, _q, _s);
        this.indicatorMesh.setMatrixAt(nInd, _m);
        this.indicatorMesh.setColorAt(nInd, _c.setHex(h.target && h.role !== "giver" ? 0xff4455 : 0xffcb2e));
        nInd++;
      }
    }

    for (const [id, slot] of this.humanSlots) {
      if (slot.lastSeen !== f) {
        slot.root.removeFromParent();
        slot.skinned?.mixer.stopAllAction();
        this.humanSlots.delete(id);
      }
    }

    this.flush(this.indicatorMesh, nInd);
  }

  private syncVehicles(
    t: number,
    dt: number,
    viewerAt: [number, number],
    groundAt: (x: number, y: number) => number,
    vehicles: readonly OpenWorldVehicle[],
    f: number,
  ): void {
    const near: { v: OpenWorldVehicle; d2: number }[] = [];
    const maxR2 = VEHICLE_RANGE * VEHICLE_RANGE;
    for (const v of vehicles) {
      const dx = v.at[0] - viewerAt[0];
      const dy = v.at[1] - viewerAt[1];
      const d2 = dx * dx + dy * dy;
      if (d2 <= maxR2) near.push({ v, d2 });
    }
    if (near.length > MAX_VEHICLES) {
      near.sort((a, b) => a.d2 - b.d2);
      near.length = MAX_VEHICLES;
    }

    for (const { v } of near) {
      const styleIdx = Math.abs(v.colorIdx ?? v.id);
      const paint = v.kind === "scooter" ? VEHICLE_PAINTS[styleIdx % VEHICLE_PAINTS.length]! : undefined;
      let slot = this.vehicleSlots.get(v.id);
      if (!slot || slot.actor.kind !== v.kind) {
        if (slot) {
          slot.actor.root.removeFromParent();
          slot.actor.dispose();
          this.vehicleSlots.delete(v.id);
        }
        const actor = createVehicleActor(v.kind, paint, styleIdx);
        this.group.add(actor.root);
        slot = { id: v.id, actor, wheelSpin: 0, colorIdx: styleIdx, lastSeen: f };
        this.vehicleSlots.set(v.id, slot);
      } else if (slot.colorIdx !== styleIdx) {
        slot.colorIdx = styleIdx;
        if (slot.actor.setStyle) slot.actor.setStyle(styleIdx, paint);
        else if (paint !== undefined) slot.actor.setPaint(paint);
      }
      slot.lastSeen = f;

      const gy = groundAt(v.at[0], v.at[1]);
      slot.actor.root.position.set(v.at[0], gy + (v.altitude ?? 0), -v.at[1]);
      slot.actor.root.rotation.set(0, yawOf(v.heading), 0);

      if (dt > 0) {
        const r = VEHICLE_SPECS[v.kind].wheelRadius;
        slot.wheelSpin = (slot.wheelSpin + (v.speed * dt) / Math.max(0.08, r)) % (Math.PI * 2);
      }
      const damage = v.hp !== undefined ? Math.max(0, 1 - v.hp / Math.max(1, v.maxHp ?? 100)) : 0;
      slot.actor.update(v.steer ?? 0, slot.wheelSpin, !!v.braking, !!v.siren, t, {
        pitch: v.pitch,
        roll: v.roll,
        heave: v.heave,
        damage,
        reversing: v.speed < -0.25,
        altitude: v.altitude,
        flying: v.flying,
        thrust: v.thrust,
        speed: v.speed,
        attackT: v.attackT,
      });
    }

    for (const [id, slot] of this.vehicleSlots) {
      if (slot.lastSeen !== f) {
        slot.actor.root.removeFromParent();
        slot.actor.dispose();
        this.vehicleSlots.delete(id);
      }
    }
  }

  private syncPickups(
    t: number,
    groundAt: (x: number, y: number) => number,
    pickups: readonly OpenWorldPickup[],
    spots: readonly OpenWorldSpot[],
    checkpoint?: [number, number],
  ): void {
    const counts: Record<PickupKind, number> = { pizza: 0, cash: 0, coffee: 0, package: 0 };
    let nRings = 0;

    for (const p of pickups) {
      const n = counts[p.kind];
      if (n >= MAX_PICKUPS_PER_KIND) continue;
      const gy = groundAt(p.at[0], p.at[1]);
      const phase = p.id * 1.3;
      const bob = Math.sin(t * 2.0 + phase) * 0.02;
      _p.set(p.at[0], gy + 0.05 + bob, -p.at[1]);
      _q.setFromEuler(_e.set(0, t * 1.1 + phase, 0));
      _s.setScalar(1);
      _m.compose(_p, _q, _s);
      this.pickupMeshes[p.kind].setMatrixAt(n, _m);
      counts[p.kind] = n + 1;

      if (nRings < MAX_RINGS) {
        _p.set(p.at[0], gy + 0.05, -p.at[1]);
        _q.identity();
        _s.setScalar(1 + 0.05 * Math.sin(t * 3 + phase));
        _m.compose(_p, _q, _s);
        this.ringMesh.setMatrixAt(nRings, _m);
        this.ringMesh.setColorAt(nRings, _c.setHex(PICKUP_COLORS[p.kind]));
        nRings++;
      }
    }

    // Subtle low ground rings on interactive spots (never tall beams).
    for (const s of spots) {
      if (nRings >= MAX_RINGS) break;
      const gy = groundAt(s.at[0], s.at[1]);
      _p.set(s.at[0], gy + 0.05, -s.at[1]);
      _q.identity();
      const ready = s.cooldown <= 0;
      _s.setScalar(Math.max(1.2, s.radius * 0.72));
      _m.compose(_p, _q, _s);
      this.ringMesh.setMatrixAt(nRings, _m);
      _c.setHex(s.kind === "pizzaCart" ? 0xffa63b : 0x57b8ff).multiplyScalar(ready ? 0.8 : 0.25);
      this.ringMesh.setColorAt(nRings, _c);
      nRings++;
    }

    let nCp = 0;
    if (checkpoint) {
      const gy = groundAt(checkpoint[0], checkpoint[1]);
      _p.set(checkpoint[0], gy + 0.06, -checkpoint[1]);
      _q.identity();
      _s.setScalar(1 + 0.06 * Math.sin(t * 4.5));
      _m.compose(_p, _q, _s);
      this.checkpointRim.setMatrixAt(nCp, _m);
      this.checkpointRim.setColorAt(nCp, _c.setHex(0xffcb2e));
      nCp++;
    }

    for (const k of ["pizza", "cash", "coffee", "package"] as const) {
      this.flush(this.pickupMeshes[k], counts[k]);
    }
    this.flush(this.ringMesh, nRings);
    this.flush(this.checkpointRim, nCp);
  }

  private syncProps(
    viewerAt: [number, number],
    groundAt: (x: number, y: number) => number,
    props: readonly OpenWorldProp[],
  ): void {
    const counts: Record<PropKind, number> = { bin: 0, cone: 0, sign: 0, chair: 0, box: 0 };
    const maxR2 = HUMAN_RANGE * HUMAN_RANGE;
    for (const p of props) {
      const n = counts[p.kind];
      if (n >= MAX_PROPS_PER_KIND) continue;
      const dx = p.at[0] - viewerAt[0];
      const dy = p.at[1] - viewerAt[1];
      if (dx * dx + dy * dy > maxR2) continue;
      const gy = groundAt(p.at[0], p.at[1]);
      _q.setFromEuler(_e.set(0, yawOf(p.heading), 0));
      if (p.tilt > 0.002) {
        const rad = (p.tiltDir * Math.PI) / 180;
        _axis.set(-Math.cos(rad), 0, -Math.sin(rad)).normalize();
        _qTilt.setFromAxisAngle(_axis, p.tilt);
        _q.premultiply(_qTilt);
      }
      _p.set(p.at[0], gy + p.y + Math.sin(p.tilt) * 0.14, -p.at[1]);
      _s.setScalar(1);
      _m.compose(_p, _q, _s);
      this.propMeshes[p.kind].setMatrixAt(n, _m);
      counts[p.kind] = n + 1;
    }
    for (const k of ["bin", "cone", "sign", "chair", "box"] as const) {
      this.flush(this.propMeshes[k], counts[k]);
    }
  }

  private flush(mesh: InstancedMesh, n: number): void {
    mesh.count = n;
    mesh.visible = n > 0;
    if (n > 0) sendInstances(mesh, n);
  }

  dispose(): void {
    for (const slot of this.humanSlots.values()) {
      slot.root.removeFromParent();
      slot.skinned?.mixer.stopAllAction();
    }
    this.humanSlots.clear();
    for (const slot of this.vehicleSlots.values()) {
      slot.actor.root.removeFromParent();
      slot.actor.dispose();
    }
    this.vehicleSlots.clear();
    for (const node of this.spotNodes.values()) {
      node.root.removeFromParent();
      node.root.traverse((o) => {
        const m = o as Mesh;
        if (m.isMesh && m.material !== this.mats[0] && m.material !== this.sharedSignMat) {
          (m.material as Material).dispose();
        }
      });
    }
    this.spotNodes.clear();
    for (const m of this.meshes) disposeInstances(m);
    for (const g of this.geos) g.dispose();
    for (const m of this.mats) m.dispose();
  }
}
