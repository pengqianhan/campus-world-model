// Grounded campus traffic, parked cars, E-Scooters, 2D vehicle physics, and road GPS routing.
// Extracts drivable polylines from ContextData.roads (decimetres -> metres) and places all
// parked vehicles and scooters on reachable awayFromHomes ground (>= 25 m from homes/childcare).
import { decodeRing, type Pt } from "./geo.ts";
import type { FlatRing, RoadClass } from "./types.ts";

export type VehicleKind = "sedan" | "hatchback" | "sports" | "taxi" | "suv" | "pickup" | "minivan" | "van" | "bus" | "security" | "scooter" | "mecha";

export type DrivableRoadClass = "motorway" | "major" | "street" | "service";

export interface RoadInput {
  k: RoadClass;
  p: FlatRing;
}

export interface RoadPolyline {
  id: number;
  kind: DrivableRoadClass;
  width: number;
  pts: Pt[];
  segLengths: number[];
  cumLengths: number[];
  totalLength: number;
}

export interface VehicleSpec {
  kind: VehicleKind;
  halfW: number;
  halfL: number;
  height: number;
  wheelRadius: number;
  maxSpeed: number;
  reverseSpeed: number;
  accel: number;
  brake: number;
  drag: number;
  /** Degrees per second base turn factor scaled by speed curve. */
  turnRate: number;
  driftGrip: number;
  mass: number;
  isTwoWheel: boolean;
}

export const DRIVABLE_ROAD_WIDTH: Readonly<Record<DrivableRoadClass, number>> = {
  motorway: 15,
  major: 11,
  street: 7.5,
  service: 4.2,
};

const LANE_OFFSET: Readonly<Record<DrivableRoadClass, number>> = {
  motorway: 3.2,
  major: 2.6,
  street: 1.85,
  service: 0.85,
};

export const VEHICLE_SPECS: Readonly<Record<VehicleKind, VehicleSpec>> = {
  sedan: { kind: "sedan", halfW: 0.88, halfL: 2.22, height: 1.45, wheelRadius: 0.35, maxSpeed: 28, reverseSpeed: 9, accel: 11.8, brake: 22, drag: 1.4, turnRate: 2.55, driftGrip: 6.8, mass: 1620, isTwoWheel: false },
  hatchback: { kind: "hatchback", halfW: 0.86, halfL: 2.06, height: 1.44, wheelRadius: 0.33, maxSpeed: 27, reverseSpeed: 9, accel: 12.6, brake: 23, drag: 1.5, turnRate: 2.85, driftGrip: 7.4, mass: 1360, isTwoWheel: false },
  sports: { kind: "sports", halfW: 0.94, halfL: 2.24, height: 1.3, wheelRadius: 0.35, maxSpeed: 34, reverseSpeed: 10, accel: 15.2, brake: 26, drag: 1.25, turnRate: 2.9, driftGrip: 8.2, mass: 1480, isTwoWheel: false },
  taxi: { kind: "taxi", halfW: 0.88, halfL: 2.22, height: 1.55, wheelRadius: 0.35, maxSpeed: 28, reverseSpeed: 9, accel: 11.8, brake: 22, drag: 1.4, turnRate: 2.55, driftGrip: 6.8, mass: 1620, isTwoWheel: false },
  suv: { kind: "suv", halfW: 0.94, halfL: 2.33, height: 1.74, wheelRadius: 0.38, maxSpeed: 26, reverseSpeed: 8.5, accel: 10.4, brake: 21, drag: 1.5, turnRate: 2.3, driftGrip: 6.2, mass: 2100, isTwoWheel: false },
  pickup: { kind: "pickup", halfW: 0.98, halfL: 2.82, height: 1.98, wheelRadius: 0.435, maxSpeed: 25, reverseSpeed: 8.5, accel: 9.8, brake: 20, drag: 1.55, turnRate: 2.05, driftGrip: 5.8, mass: 2450, isTwoWheel: false },
  minivan: { kind: "minivan", halfW: 0.95, halfL: 2.56, height: 1.77, wheelRadius: 0.37, maxSpeed: 24, reverseSpeed: 8, accel: 9.4, brake: 20, drag: 1.55, turnRate: 2.15, driftGrip: 6.0, mass: 2050, isTwoWheel: false },
  van: { kind: "van", halfW: 0.98, halfL: 2.92, height: 2.64, wheelRadius: 0.38, maxSpeed: 22, reverseSpeed: 7.5, accel: 8.4, brake: 18, drag: 1.6, turnRate: 1.9, driftGrip: 5.5, mass: 2700, isTwoWheel: false },
  bus: { kind: "bus", halfW: 1.14, halfL: 5.32, height: 2.75, wheelRadius: 0.44, maxSpeed: 19, reverseSpeed: 6, accel: 6.2, brake: 16, drag: 1.7, turnRate: 1.45, driftGrip: 5.0, mass: 9500, isTwoWheel: false },
  security: { kind: "security", halfW: 0.88, halfL: 2.22, height: 1.52, wheelRadius: 0.35, maxSpeed: 31, reverseSpeed: 10, accel: 13.5, brake: 24, drag: 1.35, turnRate: 2.7, driftGrip: 7.0, mass: 1720, isTwoWheel: false },
  scooter: { kind: "scooter", halfW: 0.28, halfL: 0.62, height: 1.12, wheelRadius: 0.14, maxSpeed: 14, reverseSpeed: 3.5, accel: 10.5, brake: 18, drag: 2.2, turnRate: 3.3, driftGrip: 11.0, mass: 22, isTwoWheel: true },
  mecha: { kind: "mecha", halfW: 0.56, halfL: 0.58, height: 2.38, wheelRadius: 0.42, maxSpeed: 42, reverseSpeed: 12, accel: 24, brake: 30, drag: 1.5, turnRate: 3.4, driftGrip: 14.0, mass: 780, isTwoWheel: false },
};

export interface CampusVehicle {
  id: number;
  kind: VehicleKind;
  at: Pt;
  heading: number;
  speed: number;
  vx: number;
  vz: number;
  angularVel: number;
  pitch: number;
  pitchVel: number;
  roll: number;
  rollVel: number;
  heave: number;
  heaveVel: number;
  steerAngle: number;
  wheelSpin: number;
  rpm: number;
  gear: number;
  colorIdx: number;
  isTraffic: boolean;
  isParked: boolean;
  isPolice: boolean;
  driver: "none" | "player" | "npc" | "security";
  hp: number;
  maxHp: number;
  siren: boolean;
  altitude: number;
  vy: number;
  flying: boolean;
  thrust: number;
  attackT: number;
  stunT: number;
  crashCooldown: number;
  roadIdx?: number;
  roadDist?: number;
  roadDir?: 1 | -1;
}

export interface StaticObstacle {
  at: Pt;
  heading?: number;
  halfW: number;
  halfL: number;
}

export interface VehicleControlInput {
  throttle: number;
  brake: number;
  steer: number;
  handbrake: boolean;
  horn?: boolean;
  ascend?: number;
  descend?: number;
  boost?: boolean;
}

export interface VehicleHost {
  spot(near: Pt, taken: readonly Pt[], place?: Pt): Pt | undefined;
  near?(p: Pt): Pt | undefined;
  ground?(p: Pt): boolean;
  free?(p: Pt): boolean;
  roofTopAboveGround?(p: Pt): number | undefined;
  random(): number;
  roads?: readonly RoadInput[];
}

export interface VehicleTelemetry {
  id: number;
  kind: VehicleKind;
  kmh: number;
  gear: number;
  rpm: number;
  siren: boolean;
  hp: number;
  altitude?: number;
  flying?: boolean;
}

export interface VehicleStepEvents {
  crashes: { vehicleId: number; otherVehicleId?: number; speed: number; at: Pt; normal?: Pt; kind?: "vehicle" | "wall" | "prop" }[];
  npcHits: { npcId: number; vehicleId: number; at: Pt; speed: number }[];
}

const D2R = Math.PI / 180;

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function bearingTo(from: Pt, to: Pt): number {
  return ((Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI + 360) % 360;
}

function turnBetween(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

function isFree(host: VehicleHost, p: Pt): boolean {
  if (host.free) return host.free(p);
  if (host.ground) return host.ground(p);
  return true;
}

function isDrivable(k: RoadClass): k is DrivableRoadClass {
  return k === "motorway" || k === "major" || k === "street" || k === "service";
}

/** Extracts drivable road polylines in metres from ContextData.roads. */
export function extractDrivableRoads(roads: readonly RoadInput[] = []): RoadPolyline[] {
  const out: RoadPolyline[] = [];
  for (const r of roads) {
    if (!isDrivable(r.k)) continue;
    const pts = decodeRing(r.p);
    if (pts.length < 2) continue;
    const segLengths: number[] = [];
    const cumLengths: number[] = [0];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const len = dist(pts[i]!, pts[i + 1]!);
      segLengths.push(len);
      total += len;
      cumLengths.push(total);
    }
    if (total < 8) continue;
    out.push({
      id: out.length,
      kind: r.k,
      width: DRIVABLE_ROAD_WIDTH[r.k],
      pts,
      segLengths,
      cumLengths,
      totalLength: total,
    });
  }
  return out;
}

/** Samples point and forward bearing at `distance` metres along `road` in `dir` (+1 or -1). */
export function sampleRoad(road: RoadPolyline, distance: number, dir: 1 | -1 = 1): { at: Pt; tangent: Pt; heading: number } {
  const d = clamp(distance, 0, road.totalLength);
  let seg = 0;
  while (seg < road.segLengths.length - 1 && road.cumLengths[seg + 1]! < d) seg++;
  const a = road.pts[seg]!;
  const b = road.pts[seg + 1]!;
  const len = Math.max(1e-4, road.segLengths[seg]!);
  const t = clamp((d - road.cumLengths[seg]!) / len, 0, 1);
  const at: Pt = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const tx = ((b[0] - a[0]) / len) * dir;
  const ty = ((b[1] - a[1]) / len) * dir;
  const heading = ((Math.atan2(tx, ty) * 180) / Math.PI + 360) % 360;
  return { at, tangent: [tx, ty], heading };
}

/** Returns left-hand traffic lane offset (NZ left-hand driving: (-ty, tx)). */
export function leftLanePoint(road: RoadPolyline, distance: number, dir: 1 | -1, extraOffset = 0): { at: Pt; heading: number } {
  const s = sampleRoad(road, distance, dir);
  const off = LANE_OFFSET[road.kind] + extraOffset;
  const lx = -s.tangent[1];
  const ly = s.tangent[0];
  return {
    at: [s.at[0] + lx * off, s.at[1] + ly * off],
    heading: s.heading,
  };
}

/** Shortest distance from point `p` to a vehicle's oriented bounding box (0 when inside). */
export function vehicleBodyDist(p: Pt, v: Pick<CampusVehicle, "at" | "heading" | "kind">): number {
  const spec = VEHICLE_SPECS[v.kind];
  const dx = p[0] - v.at[0];
  const dy = p[1] - v.at[1];
  const s = Math.sin(v.heading * D2R);
  const c = Math.cos(v.heading * D2R);
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  const qx = Math.max(0, Math.abs(lx) - spec.halfW);
  const qy = Math.max(0, Math.abs(ly) - spec.halfL);
  return Math.hypot(qx, qy);
}

interface ObbBox {
  at: Pt;
  heading: number;
  halfW: number;
  halfL: number;
}

/** 2D Separating Axis Theorem overlap check between two oriented boxes; normal `nx, ny` points from `a` to `b`. */
function obbOverlap(a: ObbBox, b: ObbBox): { overlap: number; nx: number; ny: number; contact: Pt } | undefined {
  const ra = a.heading * D2R;
  const rb = b.heading * D2R;
  const fxA = Math.sin(ra);
  const fyA = Math.cos(ra);
  const rxA = Math.cos(ra);
  const ryA = -Math.sin(ra);
  const fxB = Math.sin(rb);
  const fyB = Math.cos(rb);
  const rxB = Math.cos(rb);
  const ryB = -Math.sin(rb);

  const dx = b.at[0] - a.at[0];
  const dy = b.at[1] - a.at[1];

  const axes: readonly [number, number][] = [
    [rxA, ryA],
    [fxA, fyA],
    [rxB, ryB],
    [fxB, fyB],
  ];

  let minPen = Infinity;
  let bestNx = 1;
  let bestNy = 0;

  for (const [ux, uy] of axes) {
    const rA = a.halfW * Math.abs(ux * rxA + uy * ryA) + a.halfL * Math.abs(ux * fxA + uy * fyA);
    const rB = b.halfW * Math.abs(ux * rxB + uy * ryB) + b.halfL * Math.abs(ux * fxB + uy * fyB);
    const distCenter = dx * ux + dy * uy;
    const pen = rA + rB - Math.abs(distCenter);
    if (pen <= 0) return undefined;
    if (pen < minPen) {
      minPen = pen;
      const sign = distCenter >= 0 ? 1 : -1;
      bestNx = ux * sign;
      bestNy = uy * sign;
    }
  }

  // Approximate contact by averaging closest OBB boundary points toward each other.
  const clampInBox = (p: Pt, box: ObbBox, fx: number, fy: number, rx: number, ry: number): Pt => {
    const vx = p[0] - box.at[0];
    const vy = p[1] - box.at[1];
    const lx = clamp(vx * rx + vy * ry, -box.halfW, box.halfW);
    const ly = clamp(vx * fx + vy * fy, -box.halfL, box.halfL);
    return [box.at[0] + rx * lx + fx * ly, box.at[1] + ry * lx + fy * ly];
  };
  const cA = clampInBox(b.at, a, fxA, fyA, rxA, ryA);
  const cB = clampInBox(a.at, b, fxB, fyB, rxB, ryB);
  return {
    overlap: minPen,
    nx: bestNx,
    ny: bestNy,
    contact: [(cA[0] + cB[0]) * 0.5, (cA[1] + cB[1]) * 0.5],
  };
}

interface GraphNode {
  at: Pt;
  edges: { to: number; dist: number }[];
}

/**
 * Campus vehicle simulation: drivable road extraction, left-hand traffic, parked cars,
 * E-Scooters, Security patrol cruisers, realistic 2D driving physics, and road GPS routing.
 */
export class CampusVehiclesState {
  roads: RoadPolyline[] = [];
  vehicles: CampusVehicle[] = [];
  playerVehicleId?: number;
  private nextId = 1;
  private startAt: Pt;
  private graph: GraphNode[] = [];

  constructor(host: VehicleHost, startAt: Pt, heading = 0) {
    this.startAt = [startAt[0], startAt[1]];
    this.roads = extractDrivableRoads(host.roads);
    this.buildRoadGraph();
    this.spawnInitialFleet(host, startAt, heading);
  }

  get current(): CampusVehicle | undefined {
    return this.playerVehicleId !== undefined ? this.vehicles.find((v) => v.id === this.playerVehicleId) : undefined;
  }

  private buildRoadGraph(): void {
    this.graph = [];
    if (this.roads.length === 0) return;
    const addNode = (at: Pt): number => {
      for (let i = 0; i < this.graph.length; i++) {
        if (dist(this.graph[i]!.at, at) <= 7) return i;
      }
      this.graph.push({ at, edges: [] });
      return this.graph.length - 1;
    };
    const link = (a: number, b: number) => {
      if (a === b) return;
      const d = dist(this.graph[a]!.at, this.graph[b]!.at);
      if (!this.graph[a]!.edges.some((e) => e.to === b)) this.graph[a]!.edges.push({ to: b, dist: d });
      if (!this.graph[b]!.edges.some((e) => e.to === a)) this.graph[b]!.edges.push({ to: a, dist: d });
    };

    for (const r of this.roads) {
      let prev = addNode(r.pts[0]!);
      // Sample intermediate nodes every ~35 m so long curves and mid-block intersections connect cleanly
      let acc = 0;
      for (let i = 1; i < r.pts.length; i++) {
        acc += r.segLengths[i - 1]!;
        if (acc >= 35 || i === r.pts.length - 1) {
          const cur = addNode(r.pts[i]!);
          link(prev, cur);
          prev = cur;
          acc = 0;
        }
      }
    }
  }

  /** Computes a yellow GPS route polyline along road nodes from `from` to `to`. */
  computeGpsRoute(from: Pt, to: Pt): Pt[] {
    if (this.graph.length < 2) return [from, to];
    const nearestNode = (p: Pt): number => {
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < this.graph.length; i++) {
        const d = dist(this.graph[i]!.at, p);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    };
    const startIdx = nearestNode(from);
    const goalIdx = nearestNode(to);
    if (startIdx === goalIdx) return [from, this.graph[startIdx]!.at, to];

    const n = this.graph.length;
    const gScore = new Float64Array(n).fill(Infinity);
    const prev = new Int32Array(n).fill(-1);
    const visited = new Uint8Array(n);
    gScore[startIdx] = 0;

    for (let iter = 0; iter < n; iter++) {
      let u = -1;
      let bestF = Infinity;
      for (let i = 0; i < n; i++) {
        if (visited[i] || gScore[i] === Infinity) continue;
        const f = gScore[i]! + dist(this.graph[i]!.at, this.graph[goalIdx]!.at);
        if (f < bestF) {
          bestF = f;
          u = i;
        }
      }
      if (u === -1 || u === goalIdx) break;
      visited[u] = 1;
      for (const e of this.graph[u]!.edges) {
        if (visited[e.to]) continue;
        const cand = gScore[u]! + e.dist;
        if (cand < gScore[e.to]!) {
          gScore[e.to] = cand;
          prev[e.to] = u;
        }
      }
    }

    if (prev[goalIdx] === -1) return [from, to];
    const chain: Pt[] = [];
    let cur = goalIdx;
    while (cur !== -1) {
      chain.push(this.graph[cur]!.at);
      cur = prev[cur]!;
    }
    chain.reverse();
    return [from, ...chain, to];
  }

  private spawnInitialFleet(host: VehicleHost, startAt: Pt, heading: number): void {
    const trafficKinds: readonly VehicleKind[] = ["sedan", "suv", "hatchback", "taxi", "pickup", "minivan", "sports", "van"];
    const parkedKinds: readonly VehicleKind[] = ["sports", "pickup", "hatchback", "taxi", "suv", "sedan", "minivan", "van"];
    const clearPlace = (p: Pt, minFromStart = 18): Pt | undefined => {
      if (dist(p, startAt) < minFromStart) return undefined;
      if (isFree(host, p)) return p;
      const snapped = host.near?.(p);
      if (snapped && isFree(host, snapped) && dist(snapped, startAt) >= minFromStart) return snapped;
      return undefined;
    };

    // 1. Spawn diverse left-hand moving traffic cars + Link/Metro transit buses + kerb-parked cars on drivable roads
    const localRoads = this.roads
      .map((r, idx) => ({ r, idx, d: dist(sampleRoad(r, r.totalLength * 0.5).at, startAt) }))
      .filter((x) => x.d <= 280)
      .sort((a, b) => a.d - b.d);

    let trafficCount = 0;
    let busCount = 0;
    let parkedCount = 0;
    for (const { r, idx } of localRoads) {
      if (r.kind !== "service" && trafficCount < 14) {
        const dir: 1 | -1 = trafficCount % 2 === 0 ? 1 : -1;
        const dPos = clamp(r.totalLength * (0.2 + 0.6 * host.random()), 4, Math.max(4, r.totalLength - 4));
        const lane = leftLanePoint(r, dPos, dir);
        const wantBus = (r.kind === "major" || r.kind === "street") && r.totalLength >= 45 && busCount < 2 && trafficCount % 5 === 2;
        const gap = wantBus ? 14 : 10;
        if (isFree(host, lane.at) && dist(lane.at, startAt) >= 18 && this.vehicles.every((v) => dist(v.at, lane.at) >= gap)) {
          const kind = wantBus ? "bus" : trafficKinds[trafficCount % trafficKinds.length]!;
          this.vehicles.push(
            this.makeVehicle(kind, lane.at, lane.heading, {
              isTraffic: true,
              driver: "npc",
              colorIdx: (trafficCount * 5 + 3) % 12,
              roadIdx: idx,
              roadDist: dPos,
              roadDir: dir,
            }),
          );
          if (wantBus) busCount++;
          trafficCount++;
        }
      }
      if (parkedCount < 8 && r.totalLength >= 16) {
        const dir: 1 | -1 = parkedCount % 2 === 0 ? 1 : -1;
        const dPos = clamp(r.totalLength * (0.15 + 0.7 * host.random()), 4, Math.max(4, r.totalLength - 4));
        const kerb = leftLanePoint(r, dPos, dir, Math.max(0.5, r.width * 0.5 - 1.1 - LANE_OFFSET[r.kind]));
        const spot = clearPlace(kerb.at, 18);
        if (spot && this.vehicles.every((v) => dist(v.at, spot) >= 8)) {
          const kind = parkedKinds[parkedCount % parkedKinds.length]!;
          this.vehicles.push(this.makeVehicle(kind, spot, kerb.heading, { isParked: true, colorIdx: (parkedCount * 3 + 1) % 12 }));
          parkedCount++;
        }
      }
    }

    // Fallback parked cars & scooters on reachable awayFromHomes ground when a test host provides no roads
    const taken = () => this.vehicles.map((v) => v.at);
    if (parkedCount < 3) {
      const fbKinds: readonly VehicleKind[] = ["sports", "sedan", "pickup"];
      for (let i = 0; i < 3 - parkedCount; i++) {
        const deg = heading + 44 + i * 95;
        const rad = deg * D2R;
        const cand: Pt = [startAt[0] + Math.sin(rad) * (22 + i * 12), startAt[1] + Math.cos(rad) * (22 + i * 12)];
        const p = clearPlace(cand, 18) ?? host.spot(cand, taken(), cand);
        if (p && isFree(host, p) && dist(p, startAt) >= 18) {
          this.vehicles.push(this.makeVehicle(fbKinds[i % fbKinds.length]!, p, (deg + 90) % 360, { isParked: true, colorIdx: i * 3 }));
        }
      }
    }

    // 2. Spawn 6 teal E-Scooters (one nearby ~20-26 m from startAt, others distributed across campus walkways)
    for (let i = 0; i < 6; i++) {
      const deg = heading - 42 + i * 62;
      const rad = deg * D2R;
      const r = 21 + (i % 4) * 18;
      const cand: Pt = [startAt[0] + Math.sin(rad) * r, startAt[1] + Math.cos(rad) * r];
      const p = clearPlace(cand, 18) ?? host.spot(cand, taken(), cand);
      if (p && isFree(host, p) && dist(p, startAt) >= 18 && this.vehicles.every((v) => dist(v.at, p) >= 6)) {
        this.vehicles.push(this.makeVehicle("scooter", p, (deg + 90) % 360, { isParked: true, colorIdx: 0 }));
      }
    }

    // 3. Deterministic initial Mark-IV Exo-Suit ("mecha") on reachable awayFromHomes ground (never consuming host.random)
    for (const r of [22, 27, 32]) {
      let placed = false;
      for (const offset of [28, -28, 74, -74, 120, -120, 165, -165]) {
        const rad = ((heading + offset) % 360) * D2R;
        const cand: Pt = [startAt[0] + Math.sin(rad) * r, startAt[1] + Math.cos(rad) * r];
        const p = clearPlace(cand, 18);
        if (p && isFree(host, p) && dist(p, startAt) >= 18 && this.vehicles.every((v) => dist(v.at, p) >= 5.5)) {
          this.vehicles.push(this.makeVehicle("mecha", p, (heading + 180) % 360, { isParked: true, colorIdx: 0, hp: 180, maxHp: 180 }));
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  private makeVehicle(
    kind: VehicleKind,
    at: Pt,
    heading: number,
    opts: Partial<Omit<CampusVehicle, "id" | "kind" | "at" | "heading">> = {},
  ): CampusVehicle {
    return {
      id: this.nextId++,
      kind,
      at: [at[0], at[1]],
      heading,
      speed: 0,
      vx: 0,
      vz: 0,
      angularVel: 0,
      pitch: 0,
      pitchVel: 0,
      roll: 0,
      rollVel: 0,
      heave: 0,
      heaveVel: 0,
      steerAngle: 0,
      wheelSpin: 0,
      rpm: 0.15,
      gear: 1,
      colorIdx: opts.colorIdx ?? 0,
      isTraffic: opts.isTraffic ?? false,
      isParked: opts.isParked ?? false,
      isPolice: opts.isPolice ?? kind === "security",
      driver: opts.driver ?? "none",
      hp: opts.hp ?? 100,
      maxHp: opts.maxHp ?? 100,
      siren: opts.siren ?? false,
      altitude: opts.altitude ?? 0,
      vy: opts.vy ?? 0,
      flying: opts.flying ?? false,
      thrust: opts.thrust ?? 0,
      attackT: opts.attackT ?? 0,
      stunT: 0,
      crashCooldown: 0,
      roadIdx: opts.roadIdx,
      roadDist: opts.roadDist,
      roadDir: opts.roadDir,
    };
  }

  /** Spawns a free teal E-Scooter on reachable awayFromHomes ground near `near`. */
  callScooter(host: VehicleHost, near: Pt, heading: number): CampusVehicle | undefined {
    const existing = this.vehicles.find((v) => v.kind === "scooter" && dist(v.at, near) <= 7 && v.driver === "none");
    if (existing) return existing;
    const rad = ((heading + 70) % 360) * D2R;
    const cand: Pt = [near[0] + Math.sin(rad) * 4.5, near[1] + Math.cos(rad) * 4.5];
    const p = isFree(host, cand) ? cand : host.near?.(cand) ?? host.spot(near, [near], near);
    if (!p || !isFree(host, p)) return undefined;
    const sc = this.makeVehicle("scooter", p, heading, { isParked: true, colorIdx: 0 });
    this.vehicles.push(sc);
    return sc;
  }

  /** Deploys or repositions an Iron-Man-style Mark-IV Exo-Suit beside `near` on reachable awayFromHomes ground. */
  callMecha(host: VehicleHost, near: Pt, heading: number): CampusVehicle | undefined {
    const rad = ((heading + 32) % 360) * D2R;
    const cand: Pt = [near[0] + Math.sin(rad) * 3.8, near[1] + Math.cos(rad) * 3.8];
    const p = isFree(host, cand) ? cand : host.near?.(cand) ?? host.spot(near, [near], near);
    if (!p || !isFree(host, p)) return undefined;
    const existing = this.vehicles.find((v) => v.kind === "mecha" && v.driver === "none");
    if (existing) {
      existing.at = [p[0], p[1]];
      existing.heading = (heading + 180) % 360;
      existing.speed = existing.vx = existing.vz = existing.vy = existing.altitude = 0;
      existing.pitch = existing.pitchVel = existing.roll = existing.rollVel = existing.heave = existing.heaveVel = 0;
      existing.flying = false;
      existing.thrust = 0;
      existing.attackT = 0;
      existing.hp = existing.maxHp = 180;
      existing.isParked = true;
      return existing;
    }
    const mecha = this.makeVehicle("mecha", p, (heading + 180) % 360, {
      isParked: true,
      colorIdx: 0,
      hp: 180,
      maxHp: 180,
    });
    this.vehicles.push(mecha);
    return mecha;
  }

  /** Ensures up to `targetCount` Security patrol cruisers exist while wanted >= 2. */
  syncSecurityPatrols(host: VehicleHost, player: Pt, wanted: number): void {
    const want = wanted >= 2 ? Math.min(3, wanted - 1) : 0;
    const active = this.vehicles.filter((v) => v.isPolice && v.driver === "security" && v.id !== this.playerVehicleId);
    if (want === 0) {
      for (const v of active) {
        v.siren = false;
        v.driver = "none";
        v.isParked = true;
      }
      return;
    }
    if (active.length < want) {
      const roadChoice = this.roads.find((r) => {
        const mid = sampleRoad(r, r.totalLength * 0.5).at;
        const d = dist(mid, player);
        return d >= 28 && d <= 120;
      });
      let spawnAt: Pt | undefined;
      let spawnHeading = 0;
      if (roadChoice) {
        const s = leftLanePoint(roadChoice, roadChoice.totalLength * 0.5, 1);
        if (isFree(host, s.at) && dist(s.at, this.startAt) >= 18) {
          spawnAt = s.at;
          spawnHeading = s.heading;
        }
      }
      if (!spawnAt) {
        const angle = host.random() * 360;
        const cand: Pt = [player[0] + Math.sin(angle * D2R) * 34, player[1] + Math.cos(angle * D2R) * 34];
        const p = isFree(host, cand) ? cand : host.near?.(cand) ?? host.spot(player, [player]);
        if (p && isFree(host, p) && dist(p, this.startAt) >= 18) {
          spawnAt = p;
          spawnHeading = bearingTo(p, player);
        }
      }
      if (spawnAt) {
        this.vehicles.push(this.makeVehicle("security", spawnAt, spawnHeading, { isPolice: true, driver: "security", siren: true }));
      }
    }
  }

  /** Finds nearest enterable vehicle within reach (`3.2` m cars, `2.6` m scooters). */
  nearestEnterable(player: Pt): CampusVehicle | undefined {
    let best: CampusVehicle | undefined;
    let bestD = Infinity;
    for (const v of this.vehicles) {
      if (v.id === this.playerVehicleId || v.hp <= 0) continue;
      if (v.driver === "security") continue;
      const reach = v.kind === "scooter" ? 2.6 : 3.2;
      const d = vehicleBodyDist(player, v);
      if (d <= reach && d < bestD) {
        bestD = d;
        best = v;
      }
    }
    return best;
  }

  /** Attempts to enter the nearest vehicle. Returns { vehicle, carjacked } or undefined. */
  enterNearest(player: Pt): { vehicle: CampusVehicle; carjacked: boolean } | undefined {
    if (this.playerVehicleId !== undefined) return undefined;
    const v = this.nearestEnterable(player);
    if (!v) return undefined;
    const carjacked = v.driver === "npc";
    v.driver = "player";
    v.isTraffic = false;
    v.isParked = false;
    v.siren = v.isPolice;
    this.playerVehicleId = v.id;
    return { vehicle: v, carjacked };
  }

  /** Exits the current vehicle onto clear ground beside the driver door. Returns exit position & bail flag. */
  exitCurrent(host: VehicleHost): { at: Pt; heading: number; bailed: boolean; speed: number; vehicle: CampusVehicle } | undefined {
    const v = this.current;
    if (!v) return undefined;
    const spec = VEHICLE_SPECS[v.kind];
    const speed = Math.abs(v.speed);
    const bailed = speed > 14;
    const rad = v.heading * D2R;
    if (v.kind === "mecha") {
      const safeAt = !host.ground || host.ground(v.at) ? v.at : host.near?.(v.at) ?? v.at;
      v.at = [safeAt[0], safeAt[1]];
      v.altitude = 0;
      v.vy = 0;
      v.flying = false;
      v.thrust = 0;
      v.pitch = 0;
      v.roll = 0;
      v.speed = v.vx = v.vz = 0;
      const exitAt: Pt = [safeAt[0] - Math.cos(rad) * 1.1, safeAt[1] + Math.sin(rad) * 1.1];
      const finalExit = !host.ground || host.ground(exitAt) ? exitAt : safeAt;
      v.driver = "none";
      v.isParked = true;
      v.siren = false;
      this.playerVehicleId = undefined;
      return { at: finalExit, heading: v.heading, bailed: false, speed: 0, vehicle: v };
    }
    // NZ right-hand drive: driver exits on right (-x) or left (+x), try both sides then rear/front
    const offsets: readonly [number, number][] = spec.isTwoWheel
      ? [[-0.8, 0], [0.8, 0], [0, -1.0]]
      : [[-(spec.halfW + 0.75), 0.2], [spec.halfW + 0.75, 0.2], [0, -(spec.halfL + 0.8)]];
    let exitAt: Pt | undefined;
    for (const [lx, ly] of offsets) {
      const wx = v.at[0] + lx * Math.cos(rad) + ly * Math.sin(rad);
      const wy = v.at[1] - lx * Math.sin(rad) + ly * Math.cos(rad);
      if (!host.ground || host.ground([wx, wy])) {
        exitAt = [wx, wy];
        break;
      }
    }
    if (!exitAt) {
      exitAt = host.near?.(v.at) ?? [v.at[0] - Math.cos(rad) * (spec.halfW + 0.8), v.at[1] + Math.sin(rad) * (spec.halfW + 0.8)];
    }
    v.driver = "none";
    v.isParked = true;
    v.siren = false;
    this.playerVehicleId = undefined;
    return { at: exitAt, heading: v.heading, bailed, speed, vehicle: v };
  }

  telemetry(): VehicleTelemetry | undefined {
    const v = this.current;
    if (!v) return undefined;
    return {
      id: v.id,
      kind: v.kind,
      kmh: Math.round(Math.abs(v.speed) * 3.6),
      gear: v.gear,
      rpm: v.rpm,
      siren: v.siren,
      hp: v.hp,
      altitude: v.altitude,
      flying: v.flying,
    };
  }

  /** Applies melee strike impact to the closest vehicle in arc: suspension rock, body dent damage & scooter shove. */
  hitVehicleMelee(
    from: Pt,
    dir: number,
    reach: number,
    arc: number,
    damage: number,
    heavy: boolean,
  ): { vehicle: CampusVehicle; at: Pt } | undefined {
    let best: CampusVehicle | undefined;
    let bestD = reach;
    for (const v of this.vehicles) {
      if (v.id === this.playerVehicleId) continue;
      const d = vehicleBodyDist(from, v);
      if (d > bestD) continue;
      const off = Math.abs(turnBetween(dir, bearingTo(from, v.at)));
      if (off > arc && d > 0.45) continue;
      bestD = d;
      best = v;
    }
    if (!best) return undefined;
    const spec = VEHICLE_SPECS[best.kind];
    const massScale = clamp(1650 / spec.mass, 0.28, 2.2);
    const rad = best.heading * D2R;
    const fx = Math.sin(rad);
    const fy = Math.cos(rad);
    const rx = Math.cos(rad);
    const ry = -Math.sin(rad);
    const dx = from[0] - best.at[0];
    const dy = from[1] - best.at[1];
    const side = dx * rx + dy * ry;
    const along = dx * fx + dy * fy;
    best.rollVel += (side >= 0 ? 1 : -1) * (heavy ? 2.4 : 1.35) * massScale;
    best.pitchVel += (along >= 0 ? -1 : 1) * (heavy ? 1.5 : 0.85) * massScale;
    best.heaveVel -= (heavy ? 0.85 : 0.45) * massScale;
    if (best.kind === "scooter") {
      const dRad = dir * D2R;
      const kick = heavy ? 4.2 : 2.4;
      best.vx += Math.sin(dRad) * kick;
      best.vz += Math.cos(dRad) * kick;
    }
    best.hp = Math.max(0, best.hp - Math.round(damage * (heavy ? 0.55 : 0.35)));
    if (best.driver === "npc") {
      best.stunT = Math.max(best.stunT, 0.25);
    }
    const cx = (from[0] + best.at[0]) * 0.5;
    const cy = (from[1] + best.at[1]) * 0.5;
    return { vehicle: best, at: [cx, cy] };
  }

  step(
    dt: number,
    player: Pt,
    ctrl: VehicleControlInput,
    host: VehicleHost,
    npcPositions: readonly { id: number; at: Pt }[],
    obstacles: readonly StaticObstacle[] = [],
  ): VehicleStepEvents {
    const events: VehicleStepEvents = { crashes: [], npcHits: [] };
    if (dt <= 0) return events;

    for (const v of this.vehicles) {
      if (v.crashCooldown > 0) v.crashCooldown = Math.max(0, v.crashCooldown - dt);
      if (v.stunT > 0) v.stunT = Math.max(0, v.stunT - dt);
      if (v.attackT > 0) v.attackT = Math.max(0, v.attackT - dt);

      const prevVx = v.vx;
      const prevVz = v.vz;

      if (v.id === this.playerVehicleId) {
        if (v.kind === "mecha") {
          this.stepMecha(v, dt, ctrl, host, npcPositions, events);
          continue;
        }
        this.stepPlayerVehicle(v, dt, ctrl, host, npcPositions, events);
      } else if (v.isTraffic && v.driver === "npc" && v.stunT <= 0 && v.hp > 0) {
        this.stepTrafficVehicle(v, dt, player);
      } else if (v.driver === "security" && v.stunT <= 0 && v.hp > 0) {
        this.stepSecurityVehicle(v, dt, player, host);
      } else {
        this.stepCoastVehicle(v, dt, host);
        if (v.kind === "mecha" && v.altitude > 0) {
          v.vy = Math.max(-18, v.vy - 18 * dt);
          v.altitude = Math.max(0, v.altitude + v.vy * dt);
          if (v.altitude === 0) ((v.vy = 0), (v.flying = false), (v.thrust = 0));
        }
      }

      // Spin & suspension spring-damper driven by accel, cornering, and impact impulses.
      if (Math.abs(v.angularVel) > 0.2) {
        v.heading = ((v.heading + v.angularVel * dt) % 360 + 360) % 360;
        v.angularVel *= Math.exp(-5.2 * dt);
      } else {
        v.angularVel = 0;
      }

      const rad = v.heading * D2R;
      const fx = Math.sin(rad);
      const fy = Math.cos(rad);
      const rx = Math.cos(rad);
      const ry = -Math.sin(rad);
      const ax = (v.vx - prevVx) / Math.max(0.01, dt);
      const az = (v.vz - prevVz) / Math.max(0.01, dt);
      const longG = clamp((ax * fx + az * fy) / 14, -1.2, 1.2);
      const latG = clamp((ax * rx + az * ry) / 14, -1.2, 1.2);
      const wantPitch = -longG * 0.045;
      const wantRoll = latG * 0.065;

      const kSpr = 72;
      const cDamp = 9.5;
      v.pitchVel += ((wantPitch - v.pitch) * kSpr - v.pitchVel * cDamp) * dt;
      v.rollVel += ((wantRoll - v.roll) * kSpr - v.rollVel * cDamp) * dt;
      v.heaveVel += (-v.heave * 95 - v.heaveVel * 11) * dt;
      v.pitch = clamp(v.pitch + v.pitchVel * dt, -0.18, 0.18);
      v.roll = clamp(v.roll + v.rollVel * dt, -0.22, 0.22);
      v.heave = clamp(v.heave + v.heaveVel * dt, -0.14, 0.14);
    }

    this.resolveVehicleCollisions(host, obstacles, events);
    return events;
  }

  private stepCoastVehicle(v: CampusVehicle, dt: number, host: VehicleHost): void {
    const curSpeed = Math.hypot(v.vx, v.vz);
    if (curSpeed > 0.08) {
      const drag = v.hp <= 0 ? 4.2 : 2.8;
      const decay = Math.exp(-drag * dt);
      v.vx *= decay;
      v.vz *= decay;
      const next: Pt = [v.at[0] + v.vx * dt, v.at[1] + v.vz * dt];
      this.moveWithWallCheck(v, next, host);
      const rad = v.heading * D2R;
      v.speed = v.vx * Math.sin(rad) + v.vz * Math.cos(rad);
      v.wheelSpin += (v.speed / VEHICLE_SPECS[v.kind].wheelRadius) * dt;
    } else {
      v.speed = v.vx = v.vz = 0;
    }
  }

  /** Multi-corner perimeter ground check so car bumpers/corners never ghost inside buildings or props. */
  private moveWithWallCheck(
    v: CampusVehicle,
    next: Pt,
    host: VehicleHost,
  ): { hitWall: boolean; impact: number; contact?: Pt; spinSign: number } {
    if (!host.ground) {
      v.at = next;
      return { hitWall: false, impact: 0, spinSign: 0 };
    }
    const clear = host.ground;
    if (!clear(v.at)) {
      // Already slightly off-mesh (e.g. near kerb edge): fall back to center point.
      if (clear(next)) {
        v.at = next;
        return { hitWall: false, impact: 0, spinSign: 0 };
      }
      const impact = Math.hypot(v.vx, v.vz);
      v.vx *= -0.25;
      v.vz *= -0.25;
      v.speed *= 0.25;
      return { hitWall: impact > 0.5, impact, contact: next, spinSign: 0 };
    }

    const spec = VEHICLE_SPECS[v.kind];
    const rad = v.heading * D2R;
    const fx = Math.sin(rad);
    const fy = Math.cos(rad);
    const rx = Math.cos(rad);
    const ry = -Math.sin(rad);
    const hw = spec.halfW * 0.88;
    const hl = spec.halfL * 0.92;
    const samplePts: readonly [number, number][] = [
      [hw, hl],
      [-hw, hl],
      [hw, -hl],
      [-hw, -hl],
      [0, spec.halfL * 0.96],
      [0, -spec.halfL * 0.96],
    ];

    let blockedX = 0;
    let blockedY = 0;
    let blockedCount = 0;
    let contact: Pt | undefined;
    let torqueAcc = 0;

    for (const [lx, ly] of samplePts) {
      const px = next[0] + rx * lx + fx * ly;
      const py = next[1] + ry * lx + fy * ly;
      if (!clear([px, py])) {
        // Push direction points inward from blocked perimeter point toward next center.
        blockedX += next[0] - px;
        blockedY += next[1] - py;
        blockedCount++;
        contact = [px, py];
        torqueAcc += lx * (ly >= 0 ? -1 : 1);
      }
    }

    if (blockedCount === 0 && clear(next)) {
      v.at = next;
      return { hitWall: false, impact: 0, spinSign: 0 };
    }

    const preSpeed = Math.hypot(v.vx, v.vz);
    let nLen = Math.hypot(blockedX, blockedY);
    let nx = nLen > 1e-4 ? blockedX / nLen : 0;
    let ny = nLen > 1e-4 ? blockedY / nLen : 0;
    if (nLen <= 1e-4) {
      const dx = next[0] - v.at[0];
      const dy = next[1] - v.at[1];
      const dLen = Math.hypot(dx, dy);
      if (dLen > 1e-4) {
        nx = -dx / dLen;
        ny = -dy / dLen;
      }
    }

    // Try sliding along X or Z if only one axis is free, otherwise stay at clear `v.at`.
    if (clear([next[0], v.at[1]]) && !clear([v.at[0], next[1]])) {
      v.at = [next[0], v.at[1]];
      nx = 0;
      ny = v.vz >= 0 ? -1 : 1;
    } else if (clear([v.at[0], next[1]]) && !clear([next[0], v.at[1]])) {
      v.at = [v.at[0], next[1]];
      nx = v.vx >= 0 ? -1 : 1;
      ny = 0;
    } else if (blockedCount > 0 && blockedCount < 5 && clear([v.at[0] + nx * 0.12, v.at[1] + ny * 0.12])) {
      v.at = [v.at[0] + nx * 0.08, v.at[1] + ny * 0.08];
    }

    const vn = v.vx * nx + v.vz * ny;
    let impact = preSpeed;
    if (vn < 0) {
      impact = -vn;
      const restitution = 0.3;
      v.vx -= (1 + restitution) * vn * nx;
      v.vz -= (1 + restitution) * vn * ny;
      // Glancing wall scrape trims tangential velocity.
      v.vx *= 0.84;
      v.vz *= 0.84;
    } else {
      v.vx *= 0.45;
      v.vz *= 0.45;
    }
    v.speed = v.vx * fx + v.vz * fy;
    return {
      hitWall: true,
      impact,
      contact: contact ?? next,
      spinSign: Math.sign(torqueAcc),
    };
  }

  private applyChassisJolt(v: CampusVehicle, impact: number, nx: number, ny: number, spinSign = 0): void {
    const rad = v.heading * D2R;
    const fx = Math.sin(rad);
    const fy = Math.cos(rad);
    const rx = Math.cos(rad);
    const ry = -Math.sin(rad);
    const fwdDot = nx * fx + ny * fy;
    const latDot = nx * rx + ny * ry;
    const k = clamp(impact / 10, 0.25, 1.5);
    v.pitchVel += fwdDot * 1.45 * k;
    v.rollVel += latDot * 1.65 * k;
    v.heaveVel += 0.9 * k;
    if (spinSign !== 0) {
      v.angularVel = clamp(v.angularVel + spinSign * impact * 7.5, -240, 240);
    }
  }

  private resolveVehicleCollisions(
    host: VehicleHost,
    obstacles: readonly StaticObstacle[],
    events: VehicleStepEvents,
  ): void {
    const n = this.vehicles.length;
    for (let i = 0; i < n; i++) {
      const a = this.vehicles[i]!;
      if (a.altitude > 2.4) continue;
      const specA = VEHICLE_SPECS[a.kind];
      // Ensure rail-bound traffic cars expose accurate linear velocity before collision checks.
      if (a.isTraffic && a.driver === "npc" && a.stunT <= 0) {
        const ra = a.heading * D2R;
        a.vx = Math.sin(ra) * a.speed;
        a.vz = Math.cos(ra) * a.speed;
      }
      const boxA: ObbBox = { at: a.at, heading: a.heading, halfW: specA.halfW, halfL: specA.halfL };

      for (let j = i + 1; j < n; j++) {
        const b = this.vehicles[j]!;
        if (b.altitude > 2.4) continue;
        if (Math.abs(a.at[0] - b.at[0]) > 8 || Math.abs(a.at[1] - b.at[1]) > 8) continue;
        const specB = VEHICLE_SPECS[b.kind];
        if (b.isTraffic && b.driver === "npc" && b.stunT <= 0) {
          const rb = b.heading * D2R;
          b.vx = Math.sin(rb) * b.speed;
          b.vz = Math.cos(rb) * b.speed;
        }
        const boxB: ObbBox = { at: b.at, heading: b.heading, halfW: specB.halfW, halfL: specB.halfL };
        const hit = obbOverlap(boxA, boxB);
        if (!hit) continue;

        const invA = 1 / specA.mass;
        const invB = 1 / specB.mass;
        const invSum = invA + invB;

        // Positional separation weighted by inverse mass.
        const sepA = hit.overlap * (invA / invSum) + 0.01;
        const sepB = hit.overlap * (invB / invSum) + 0.01;
        const nA: Pt = [a.at[0] - hit.nx * sepA, a.at[1] - hit.ny * sepA];
        const nB: Pt = [b.at[0] + hit.nx * sepB, b.at[1] + hit.ny * sepB];
        if (!host.ground || host.ground(nA)) a.at = nA;
        if (!host.ground || host.ground(nB)) b.at = nB;

        // Relative velocity along contact normal (positive when separating).
        const rvx = b.vx - a.vx;
        const rvz = b.vz - a.vz;
        const relVn = rvx * hit.nx + rvz * hit.ny;
        if (relVn >= 0) continue;

        const impactSpeed = -relVn;
        const restitution = 0.42;
        const jImp = (-(1 + restitution) * relVn) / invSum;
        const jx = jImp * hit.nx;
        const jy = jImp * hit.ny;

        a.vx -= jx * invA;
        a.vz -= jy * invA;
        b.vx += jx * invB;
        b.vz += jy * invB;

        const radA = a.heading * D2R;
        const radB = b.heading * D2R;
        a.speed = a.vx * Math.sin(radA) + a.vz * Math.cos(radA);
        b.speed = b.vx * Math.sin(radB) + b.vz * Math.cos(radB);

        // Rotational torque from off-center impact lever arm.
        const armAx = hit.contact[0] - a.at[0];
        const armAy = hit.contact[1] - a.at[1];
        const armBx = hit.contact[0] - b.at[0];
        const armBy = hit.contact[1] - b.at[1];
        const spinA = clamp((armAx * -jy - armAy * -jx) * invA * 22, -160, 160);
        const spinB = clamp((armBx * jy - armBy * jx) * invB * 22, -160, 160);
        a.angularVel = clamp(a.angularVel + spinA, -240, 240);
        b.angularVel = clamp(b.angularVel + spinB, -240, 240);

        if (impactSpeed >= 1.6) {
          if (a.isTraffic && a.driver === "npc") {
            a.stunT = Math.max(a.stunT, 2.6);
            if (impactSpeed >= 3.5) {
              a.isTraffic = false;
              a.driver = "none";
              a.isParked = true;
            }
          }
          if (b.isTraffic && b.driver === "npc") {
            b.stunT = Math.max(b.stunT, 2.6);
            if (impactSpeed >= 3.5) {
              b.isTraffic = false;
              b.driver = "none";
              b.isParked = true;
            }
          }

          this.applyChassisJolt(a, impactSpeed, -hit.nx, -hit.ny, Math.sign(spinA));
          this.applyChassisJolt(b, impactSpeed, hit.nx, hit.ny, Math.sign(spinB));

          const dmgA = Math.round(clamp((impactSpeed - 1.4) * 3.4 * Math.pow(specB.mass / specA.mass, 0.35), 1, 32));
          const dmgB = Math.round(clamp((impactSpeed - 1.4) * 3.4 * Math.pow(specA.mass / specB.mass, 0.35), 1, 32));
          if (a.crashCooldown <= 0 || b.crashCooldown <= 0) {
            a.hp = Math.max(0, a.hp - dmgA);
            b.hp = Math.max(0, b.hp - dmgB);
            a.crashCooldown = 0.22;
            b.crashCooldown = 0.22;
            events.crashes.push({
              vehicleId: a.id,
              otherVehicleId: b.id,
              speed: impactSpeed,
              at: hit.contact,
              normal: [hit.nx, hit.ny],
              kind: "vehicle",
            });
          }
        }
      }

      // Solid static obstacles (Slice Co. pizza van, campus stands).
      for (const obs of obstacles) {
        if (Math.abs(a.at[0] - obs.at[0]) > 8 || Math.abs(a.at[1] - obs.at[1]) > 8) continue;
        const hit = obbOverlap(boxA, {
          at: obs.at,
          heading: obs.heading ?? 0,
          halfW: obs.halfW,
          halfL: obs.halfL,
        });
        if (!hit) continue;
        a.at = [a.at[0] - hit.nx * (hit.overlap + 0.02), a.at[1] - hit.ny * (hit.overlap + 0.02)];
        const vn = a.vx * hit.nx + a.vz * hit.ny;
        if (vn > 0) {
          const impact = vn;
          a.vx -= 1.32 * vn * hit.nx;
          a.vz -= 1.32 * vn * hit.ny;
          a.vx *= 0.85;
          a.vz *= 0.85;
          const radA = a.heading * D2R;
          a.speed = a.vx * Math.sin(radA) + a.vz * Math.cos(radA);
          const armAx = hit.contact[0] - a.at[0];
          const armAy = hit.contact[1] - a.at[1];
          const spin = clamp(-(armAx * hit.ny - armAy * hit.nx) * impact * 6, -150, 150);
          if (impact >= 1.6) {
            this.applyChassisJolt(a, impact, -hit.nx, -hit.ny, Math.sign(spin));
            if (a.crashCooldown <= 0) {
              const dmg = Math.round(clamp((impact - 1.5) * 3.0, 1, 26));
              a.hp = Math.max(0, a.hp - dmg);
              a.crashCooldown = 0.22;
              events.crashes.push({
                vehicleId: a.id,
                speed: impact,
                at: hit.contact,
                normal: [-hit.nx, -hit.ny],
                kind: "prop",
              });
            }
          }
        }
      }
    }
  }

  private stepPlayerVehicle(
    v: CampusVehicle,
    dt: number,
    ctrl: VehicleControlInput,
    host: VehicleHost,
    npcPositions: readonly { id: number; at: Pt }[],
    events: VehicleStepEvents,
  ): void {
    const spec = VEHICLE_SPECS[v.kind];
    const rad = v.heading * D2R;
    const fx = Math.sin(rad);
    const fy = Math.cos(rad);
    const rx = Math.cos(rad);
    const ry = -Math.sin(rad);

    let fwd = v.vx * fx + v.vz * fy;
    let lat = v.vx * rx + v.vz * ry;

    const wrecked = v.hp <= 0;
    const throttle = wrecked ? 0 : clamp(ctrl.throttle, -1, 1);
    const brake = clamp(ctrl.brake, 0, 1);
    const steer = clamp(ctrl.steer, -1, 1);

    if (throttle > 0.02) {
      fwd += throttle * spec.accel * dt * (1 - 0.35 * clamp(fwd / spec.maxSpeed, 0, 1));
    } else if (throttle < -0.02 || brake > 0.02) {
      const amount = Math.max(-throttle, brake);
      if (fwd > 0.6) fwd = Math.max(0, fwd - amount * spec.brake * dt);
      else fwd = Math.max(-spec.reverseSpeed, fwd - amount * spec.accel * 0.75 * dt);
    } else {
      fwd *= Math.exp(-spec.drag * dt);
      if (Math.abs(fwd) < 0.04) fwd = 0;
    }

    if (ctrl.handbrake) {
      fwd *= Math.exp(-spec.brake * 0.14 * dt);
    }
    fwd = clamp(fwd, -spec.reverseSpeed, spec.maxSpeed);

    // Speed-dependent turning (steers only while rolling)
    const speedRatio = clamp(Math.abs(fwd) / 3.5, 0, 1);
    const highSpeedDamp = 1 - 0.38 * clamp(Math.abs(fwd) / spec.maxSpeed, 0, 1);
    const dirSign = fwd >= -0.1 ? 1 : -1;
    const yawDeltaDeg = steer * spec.turnRate * speedRatio * highSpeedDamp * dirSign * (180 / Math.PI) * dt;
    v.heading = ((v.heading + yawDeltaDeg) % 360 + 360) % 360;
    v.steerAngle += (steer * 0.52 - v.steerAngle) * (1 - Math.exp(-12 * dt));

    const grip = ctrl.handbrake ? spec.driftGrip * 0.28 : spec.driftGrip;
    lat *= Math.exp(-grip * dt);

    const nRad = v.heading * D2R;
    const nfx = Math.sin(nRad);
    const nfy = Math.cos(nRad);
    const nrx = Math.cos(nRad);
    const nry = -Math.sin(nRad);
    v.vx = nfx * fwd + nrx * lat;
    v.vz = nfy * fwd + nry * lat;
    v.speed = fwd;
    v.wheelSpin += (fwd / spec.wheelRadius) * dt;

    // Gear & RPM telemetry
    if (fwd < -0.3) {
      v.gear = 0;
      v.rpm = clamp(0.25 + (Math.abs(fwd) / spec.reverseSpeed) * 0.65, 0.2, 0.95);
    } else {
      const ratio = clamp(Math.abs(fwd) / spec.maxSpeed, 0, 1);
      v.gear = Math.min(5, Math.max(1, Math.floor(ratio * 5) + 1));
      const band = (ratio * 5) % 1;
      v.rpm = clamp(0.2 + band * 0.68 + Math.max(0, throttle) * 0.12, 0.18, 0.98);
    }

    // Multi-corner building / boundary collision with bounce, spin, damage & jolt
    const next: Pt = [v.at[0] + v.vx * dt, v.at[1] + v.vz * dt];
    const wall = this.moveWithWallCheck(v, next, host);
    if (wall.hitWall && wall.impact >= 2.2) {
      this.applyChassisJolt(v, wall.impact, -nfx, -nfy, wall.spinSign);
      if (v.crashCooldown <= 0) {
        v.hp = Math.max(0, v.hp - Math.round(clamp((wall.impact - 2.0) * 2.8, 1, 24)));
        v.crashCooldown = 0.22;
        events.crashes.push({
          vehicleId: v.id,
          speed: wall.impact,
          at: wall.contact ?? v.at,
          kind: "wall",
        });
      }
    }

    // NPC collisions
    if (Math.abs(v.speed) > 2.0) {
      for (const npc of npcPositions) {
        if (vehicleBodyDist(npc.at, v) <= 0.72) {
          v.heaveVel += 0.35;
          v.pitchVel -= Math.sign(v.speed) * 0.45;
          events.npcHits.push({ npcId: npc.id, vehicleId: v.id, at: npc.at, speed: Math.abs(v.speed) });
        }
      }
    }
  }

  /** Dual-mode Mark-IV Exo-Suit physics: powered ground stride + full 3D Iron-Man hover & jet flight with roof overflight. */
  private stepMecha(
    v: CampusVehicle,
    dt: number,
    ctrl: VehicleControlInput,
    host: VehicleHost,
    npcPositions: readonly { id: number; at: Pt }[],
    events: VehicleStepEvents,
  ): void {
    const surfaceAltAt = (p: Pt): number => {
      if (!host.ground || host.ground(p)) return 0;
      return host.roofTopAboveGround?.(p) ?? Infinity;
    };

    const ascend = clamp(ctrl.ascend ?? (ctrl.handbrake ? 1 : 0), 0, 1);
    const descend = clamp(ctrl.descend ?? 0, 0, 1);
    const boost = !!ctrl.boost;
    const throttle = v.hp <= 0 ? 0 : clamp(ctrl.throttle, -1, 1);
    const brake = clamp(ctrl.brake, 0, 1);
    const steer = clamp(ctrl.steer, -1, 1);

    // 1. Vertical thrust, mid-air auto-hover, and rooftop/ground landing
    if (ascend > 0.05 && v.hp > 0) {
      v.flying = true;
      const climbMax = boost ? 24 : 16;
      v.vy += (climbMax * ascend - v.vy) * Math.min(1, dt * 6.5);
    } else if (descend > 0.05) {
      v.vy += (-16 * descend - v.vy) * Math.min(1, dt * 6.5);
    } else if (v.flying) {
      v.vy *= Math.exp(-7.5 * dt);
      if (Math.abs(v.vy) < 0.03) v.vy = 0;
    }

    v.altitude = clamp(v.altitude + v.vy * dt, 0, 135);
    const floorHere = surfaceAltAt(v.at);
    const landedHeight = Number.isFinite(floorHere) ? floorHere : 0;
    if (v.altitude <= landedHeight + 0.06 && ascend <= 0.05) {
      v.altitude = landedHeight;
      v.vy = 0;
      if (landedHeight <= 0.05 || descend > 0.05) v.flying = false;
    } else if (!v.flying && v.altitude > landedHeight + 0.55) {
      // Stepped off a high rooftop -> thrusters ignite automatically into hover
      v.flying = true;
    }

    // 2. Yaw & horizontal thrust
    const turnSpeedDeg = v.flying ? 115 : 138;
    v.heading = ((v.heading + steer * turnSpeedDeg * dt) % 360 + 360) % 360;
    v.steerAngle += (-steer * 0.45 - v.steerAngle) * (1 - Math.exp(-12 * dt));

    const rad = v.heading * D2R;
    const fx = Math.sin(rad);
    const fy = Math.cos(rad);
    const rx = Math.cos(rad);
    const ry = -Math.sin(rad);
    let fwd = v.vx * fx + v.vz * fy;
    let lat = v.vx * rx + v.vz * ry;

    const maxFwd = v.flying ? (boost ? 44 : 32) : boost ? 17 : 12.5;
    const maxRev = v.flying ? 12 : 6;
    const accelRate = v.flying ? (boost ? 34 : 24) : 22;
    if (throttle > 0.02) {
      fwd += throttle * accelRate * dt * (1 - 0.25 * clamp(fwd / maxFwd, 0, 1));
    } else if (throttle < -0.02 || brake > 0.02) {
      const amount = Math.max(-throttle, brake);
      if (fwd > 0.4) fwd = Math.max(0, fwd - amount * 30 * dt);
      else fwd = Math.max(-maxRev, fwd - amount * 16 * dt);
    } else {
      fwd *= Math.exp(-(v.flying ? 1.85 : 5.5) * dt);
      if (Math.abs(fwd) < 0.04) fwd = 0;
    }
    fwd = clamp(fwd, -maxRev, maxFwd);
    lat *= Math.exp(-11 * dt);

    v.vx = fx * fwd + rx * lat;
    v.vz = fy * fwd + ry * lat;
    v.speed = fwd;

    // 3. Roof-aware 3D collision: fly over roofs once altitude clears roofTopAboveGround
    const canOccupy = (p: Pt): boolean => {
      if (!host.ground || host.ground(p)) return true;
      const surf = surfaceAltAt(p);
      return Number.isFinite(surf) && v.altitude >= surf - 0.12;
    };
    const next: Pt = [v.at[0] + v.vx * dt, v.at[1] + v.vz * dt];
    if (canOccupy(next)) {
      v.at = next;
    } else if (canOccupy([next[0], v.at[1]])) {
      v.at = [next[0], v.at[1]];
      v.vz = 0;
    } else if (canOccupy([v.at[0], next[1]])) {
      v.at = [v.at[0], next[1]];
      v.vx = 0;
    } else {
      v.vx *= -0.15;
      v.vz *= -0.15;
    }
    v.speed = v.vx * fx + v.vz * fy;

    // 4. Articulated stride phase, Iron-Man forward pitch & banking roll, thruster glow & HUD telemetry
    v.wheelSpin = (v.wheelSpin + (Math.abs(v.speed) * dt) / 0.42) % (Math.PI * 2);
    const wantPitch = v.flying ? clamp((v.speed / 30) * 1.12, -0.22, 1.15) : clamp((v.speed / 17) * 0.18, -0.08, 0.18);
    const wantRoll = v.flying
      ? clamp(-steer * (0.14 + 0.46 * clamp(Math.abs(v.speed) / 26, 0, 1)), -0.6, 0.6)
      : clamp(-steer * 0.08, -0.1, 0.1);
    const poseK = 1 - Math.exp(-8.5 * dt);
    v.pitch += (wantPitch - v.pitch) * poseK;
    v.roll += (wantRoll - v.roll) * poseK;
    v.heave *= Math.exp(-8 * dt);
    v.thrust = v.flying
      ? clamp(0.38 + ascend * 0.45 + clamp(Math.abs(v.speed) / 32, 0, 0.5) + (boost && Math.abs(v.speed) > 2 ? 0.25 : 0), 0, 1)
      : ascend > 0.05
        ? 0.65
        : boost && Math.abs(v.speed) > 4
          ? 0.24
          : 0;
    v.gear = v.flying ? 6 : 1;
    v.rpm = clamp(0.16 + (Math.abs(v.speed) / maxFwd) * 0.62 + v.thrust * 0.24, 0.15, 1);

    if (v.altitude < 1.8 && Math.abs(v.speed) > 6.5) {
      for (const npc of npcPositions) {
        if (vehicleBodyDist(npc.at, v) <= 0.72) {
          events.npcHits.push({ npcId: npc.id, vehicleId: v.id, at: npc.at, speed: Math.abs(v.speed) * 1.2 });
        }
      }
    }
  }

  private stepTrafficVehicle(v: CampusVehicle, dt: number, player: Pt): void {
    if (v.roadIdx === undefined || v.roadDist === undefined || !this.roads[v.roadIdx]) return;
    const road = this.roads[v.roadIdx]!;
    const dir = v.roadDir ?? 1;
    // Slow down if player or another vehicle is ahead within 8 m
    const rad = v.heading * D2R;
    const fx = Math.sin(rad);
    const fy = Math.cos(rad);
    let blocked = false;
    const pdx = player[0] - v.at[0];
    const pdy = player[1] - v.at[1];
    const pd = Math.hypot(pdx, pdy);
    if (pd < 8 && pd > 0.1 && (pdx * fx + pdy * fy) / pd > 0.7) blocked = true;
    if (!blocked) {
      for (const o of this.vehicles) {
        if (o === v) continue;
        const dx = o.at[0] - v.at[0];
        const dy = o.at[1] - v.at[1];
        const d = Math.hypot(dx, dy);
        if (d < 9.5 && d > 0.1 && (dx * fx + dy * fy) / d > 0.75) {
          blocked = true;
          break;
        }
      }
    }
    const targetSpeed = blocked ? 0 : road.kind === "major" || road.kind === "motorway" ? 12.5 : 9.2;
    v.speed += (targetSpeed - v.speed) * (1 - Math.exp(-3.5 * dt));
    v.roadDist += dir * v.speed * dt;
    if (v.roadDist >= road.totalLength - 2) {
      v.roadDist = road.totalLength - 2;
      v.roadDir = -1;
    } else if (v.roadDist <= 2) {
      v.roadDist = 2;
      v.roadDir = 1;
    }
    const next = leftLanePoint(road, v.roadDist, v.roadDir ?? 1);
    v.at = next.at;
    v.heading = next.heading;
    v.wheelSpin += (v.speed / VEHICLE_SPECS[v.kind].wheelRadius) * dt;
  }

  private stepSecurityVehicle(v: CampusVehicle, dt: number, player: Pt, host: VehicleHost): void {
    const d = dist(v.at, player);
    const targetHeading = bearingTo(v.at, player);
    const turn = turnBetween(v.heading, targetHeading);
    v.heading = ((v.heading + clamp(turn, -140 * dt, 140 * dt)) % 360 + 360) % 360;
    const wantSpeed = d > 13 ? 15 : d < 9 ? 0 : 6;
    v.speed += (wantSpeed - v.speed) * (1 - Math.exp(-4 * dt));
    const rad = v.heading * D2R;
    const next: Pt = [v.at[0] + Math.sin(rad) * v.speed * dt, v.at[1] + Math.cos(rad) * v.speed * dt];
    if (!host.ground || host.ground(next)) {
      v.at = next;
    } else {
      v.speed *= 0.2;
    }
    v.wheelSpin += (v.speed / VEHICLE_SPECS[v.kind].wheelRadius) * dt;
  }
}
