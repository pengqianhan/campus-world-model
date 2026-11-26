// Grounded student campus open-world simulation: realistic human NPCs (pedestrians, mission
// givers, rival students, Campus Security), attack-token melee combat (MAX_ATTACKERS = 2),
// Slice Co. Wood-Fired Pizza van, grounded pickups (pizza/cash/coffee/package), 4 made-up
// story jobs (Maya, Sam, Tane), and 3 repeatable side hustles.
// All placement respects reachable awayFromHomes ground (>= 25 m from residential/childcare)
// and stays >= 18 m from startAt. Zero real people, courses, or timetables.
import type { Pt } from "./geo.ts";

export type HumanRole = "pedestrian" | "giver" | "freeRider" | "debateRival" | "allNighter" | "security";
export type HumanProp = "none" | "backpack" | "cap" | "clipboard" | "hivis";
export type HumanState = "idle" | "walk" | "chase" | "circle" | "windup" | "attack" | "stagger" | "down" | "flee" | "dead";

export type PickupKind = "pizza" | "cash" | "coffee" | "package";

export type JobId = "groupProject" | "pizzaExpress" | "turfTable" | "lateSubmission";
export type HustleId = "sidePizzaRun" | "sideCourtyardBrawl" | "sideCampusSprint";
export type MissionId = JobId | HustleId;

export type SpotKind = "pizzaVan" | "jobGiver" | "hustlePoint";
export type JobStage = "fight" | "collect" | "checkpoints" | "goto" | "evade";
export type PropKind = "bin" | "cone" | "sign" | "chair" | "box";

export interface CampusProp {
  id: number;
  kind: PropKind;
  at: Pt;
  heading: number;
  y: number;
  vx: number;
  vz: number;
  vy: number;
  tilt: number;
  tiltVel: number;
  tiltDir: number;
  spinVel: number;
  radius: number;
  mass: number;
  hitCount: number;
}

export interface HumanNpc {
  id: number;
  role: HumanRole;
  name: string;
  at: Pt;
  heading: number;
  speed: number;
  palette: number;
  prop: HumanProp;
  hp: number;
  maxHp: number;
  state: HumanState;
  t: number;
  cool: number;
  hasToken: boolean;
  push: Pt;
  waypoint: Pt;
  waitT: number;
  chatIdx: number;
  chatT: number;
  jobId?: MissionId;
  isMissionTarget: boolean;
  circleDir: 1 | -1;
  attackDamage: number;
  weapon: "fists" | "textbook";
}

export interface PickupItem {
  id: number;
  kind: PickupKind;
  at: Pt;
  value: number;
  dropped?: boolean;
  open?: boolean;
  jobId?: MissionId;
  label?: string;
}

export interface CampusSpot {
  id: string;
  kind: SpotKind;
  missionId?: MissionId;
  giver?: string;
  at: Pt;
  heading: number;
  radius: number;
  cooldown: number;
  placeName: string;
}

export interface ActiveJob {
  id: MissionId;
  kind: "story" | "hustle";
  giver: string;
  spotId: string;
  placeName: string;
  stage: JobStage;
  got: number;
  need: number;
  gotPackage: boolean;
  gotPizza: boolean;
  timer?: number;
  maxTimer?: number;
  checkpoints?: Pt[];
  targetAt?: Pt;
  targets: number[];
  xp: number;
  cash: number;
}

export interface JobDef {
  id: JobId;
  giver: string;
  requires?: JobId;
  xp: number;
  cash: number;
}

export interface HustleDef {
  id: HustleId;
  giver: string;
  xp: number;
  cash: number;
}

export type OpenWorldEvent =
  | { type: "job"; id: MissionId; state: "start" | "stage" | "pass" | "fail"; stage?: JobStage; xp?: number; cash?: number }
  | { type: "checkpoint"; index: number; total: number; at: Pt }
  | { type: "drop"; kind: PickupKind; at: Pt; value: number }
  | { type: "subtitle"; speaker: string; key: string; ttl: number };

export interface OpenWorldHost {
  spot(near: Pt, taken: readonly Pt[], place?: Pt): Pt | undefined;
  near?(p: Pt): Pt | undefined;
  ground?(p: Pt): boolean;
  free?(p: Pt): boolean;
  open?(centre: Pt, away: Pt): Pt | undefined;
  place(near: Pt, avoid: readonly Pt[], big?: boolean): { name: string; at: Pt } | undefined;
  campusAnchor?(near: Pt, avoid: readonly Pt[], minDist: number, maxDist: number, minGap?: number): { name: string; at: Pt } | undefined;
  random(): number;
}

export interface OpenWorldBridge {
  host: OpenWorldHost;
  startAt: Pt;
  wanted: number;
  inVehicle: boolean;
  playerIframes: number;
  obstacles?: readonly { at: Pt; radius: number }[];
  hurtPlayer(amount: number, from: Pt): void;
  addWanted(stars: number): void;
  setWanted(stars: number): void;
  spawnPickup(kind: PickupKind, at: Pt, value: number, opts?: { dropped?: boolean; open?: boolean; jobId?: MissionId }): PickupItem;
  pickups: readonly PickupItem[];
  grantReward(xp: number, cash: number): void;
  setGpsTarget(at: Pt | undefined): void;
  emit(event: OpenWorldEvent): void;
  safeGround(at: Pt): Pt;
}

export const MAX_ATTACKERS = 2;

export const OPEN_WORLD = {
  startClearance: 18,
  spotRadius: 3.6,
  interactRadius: 5.0,
  checkpointRadius: 4.5,
  spotCooldown: 16,
  pedestrianCount: 34,
  pizzaPrice: 12,
} as const;

export const STORY_JOBS: readonly JobDef[] = [
  { id: "groupProject", giver: "Maya", xp: 120, cash: 180 },
  { id: "pizzaExpress", giver: "Sam", requires: "groupProject", xp: 140, cash: 240 },
  { id: "turfTable", giver: "Tane", requires: "pizzaExpress", xp: 160, cash: 300 },
  { id: "lateSubmission", giver: "Maya", requires: "turfTable", xp: 200, cash: 400 },
];

export const SIDE_HUSTLES: readonly HustleDef[] = [
  { id: "sidePizzaRun", giver: "Sam", xp: 90, cash: 150 },
  { id: "sideCourtyardBrawl", giver: "Tane", xp: 100, cash: 160 },
  { id: "sideCampusSprint", giver: "Maya", xp: 95, cash: 140 },
];

const ROLE_STATS: Record<HumanRole, { hp: number; speed: number; damage: number; prop: HumanProp }> = {
  pedestrian: { hp: 50, speed: 1.35, damage: 0, prop: "backpack" },
  giver: { hp: 200, speed: 0, damage: 0, prop: "clipboard" },
  freeRider: { hp: 85, speed: 3.3, damage: 9, prop: "cap" },
  debateRival: { hp: 115, speed: 3.2, damage: 12, prop: "clipboard" },
  allNighter: { hp: 155, speed: 3.7, damage: 15, prop: "backpack" },
  security: { hp: 140, speed: 4.1, damage: 14, prop: "hivis" },
};

const PROP_SPECS: Record<PropKind, { radius: number; mass: number }> = {
  bin: { radius: 0.34, mass: 1.8 },
  cone: { radius: 0.26, mass: 0.55 },
  sign: { radius: 0.35, mass: 1.1 },
  chair: { radius: 0.34, mass: 0.95 },
  box: { radius: 0.32, mass: 0.7 },
};

const D2R = Math.PI / 180;

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function dirOf(deg: number): Pt {
  return [Math.sin(deg * D2R), Math.cos(deg * D2R)];
}

function bearingTo(from: Pt, to: Pt): number {
  return ((Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI + 360) % 360;
}

function turnBetween(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

function isFree(host: OpenWorldHost, p: Pt): boolean {
  if (host.free) return host.free(p);
  if (host.ground) return host.ground(p);
  return true;
}

function snapCandidate(host: OpenWorldHost, cand: Pt, avoid: readonly Pt[], startAt: Pt): Pt | undefined {
  const tries: (Pt | undefined)[] = [
    host.near?.(cand),
    host.open?.(cand, startAt),
    host.spot(cand, avoid, cand),
    isFree(host, cand) ? cand : undefined,
  ];
  for (const p of tries) {
    if (!p) continue;
    if (!isFree(host, p)) continue;
    if (dist(p, startAt) < OPEN_WORLD.startClearance) continue;
    return p;
  }
  return undefined;
}

function pickSpotPos(
  host: OpenWorldHost,
  startAt: Pt,
  minDist: number,
  maxDist: number,
  preferredDeg: number,
  avoid: readonly Pt[],
  allowPlace: boolean,
): { at: Pt; placeName: string } | undefined {
  const anchor = host.campusAnchor?.(startAt, avoid, minDist, maxDist, 18);
  if (
    anchor &&
    isFree(host, anchor.at) &&
    dist(anchor.at, startAt) >= OPEN_WORLD.startClearance &&
    avoid.every((a) => dist(a, anchor.at) >= 16)
  ) {
    return { at: anchor.at, placeName: anchor.name };
  }
  if (allowPlace) {
    const [ux, uy] = dirOf(preferredDeg);
    const probe: Pt = [startAt[0] + ux * ((minDist + maxDist) * 0.5), startAt[1] + uy * ((minDist + maxDist) * 0.5)];
    const pl = host.place(probe, avoid);
    if (
      pl &&
      isFree(host, pl.at) &&
      dist(pl.at, startAt) >= Math.max(OPEN_WORLD.startClearance, minDist - 5) &&
      dist(pl.at, startAt) <= maxDist + 12 &&
      avoid.every((a) => dist(a, pl.at) >= 18)
    ) {
      return { at: pl.at, placeName: pl.name };
    }
  }
  const angles = [0, 30, -30, 65, -65, 110, -110, 155, -155, 180];
  const mid = (minDist + maxDist) * 0.5;
  for (const r of [mid, minDist + 2, maxDist - 2]) {
    for (const off of angles) {
      const [ux, uy] = dirOf(preferredDeg + off);
      const cand: Pt = [startAt[0] + ux * r, startAt[1] + uy * r];
      const p = snapCandidate(host, cand, avoid, startAt);
      if (!p) continue;
      const d = dist(p, startAt);
      if (d < Math.max(OPEN_WORLD.startClearance, minDist - 4) || d > maxDist + 10) continue;
      if (avoid.some((a) => dist(a, p) < 15)) continue;
      return { at: p, placeName: "" };
    }
  }
  for (let i = 0; i < 16; i++) {
    const p = host.spot(startAt, avoid);
    if (p && isFree(host, p) && dist(p, startAt) >= OPEN_WORLD.startClearance && avoid.every((a) => dist(a, p) >= 12)) {
      return { at: p, placeName: "" };
    }
  }
  return undefined;
}

function pickRingPos(host: OpenWorldHost, center: Pt, minR: number, maxR: number, startAt: Pt, angleBase: number): Pt {
  const mid = (minR + maxR) * 0.5;
  for (let i = 0; i < 12; i++) {
    const deg = angleBase + i * 30;
    const r = i === 0 ? mid : minR + host.random() * (maxR - minR);
    const [ux, uy] = dirOf(deg);
    const cand: Pt = [center[0] + ux * r, center[1] + uy * r];
    const p = snapCandidate(host, cand, [startAt], startAt);
    if (p && dist(p, startAt) >= OPEN_WORLD.startClearance) return p;
  }
  const fallback = host.near?.(center) ?? host.spot(center, [startAt], center);
  if (fallback && isFree(host, fallback) && dist(fallback, startAt) >= OPEN_WORLD.startClearance) return fallback;
  const [ux, uy] = dirOf(angleBase);
  const safe: Pt = [center[0] + ux * minR, center[1] + uy * minR];
  return dist(safe, startAt) >= OPEN_WORLD.startClearance ? safe : [startAt[0] + ux * OPEN_WORLD.startClearance, startAt[1] + uy * OPEN_WORLD.startClearance];
}

/**
 * Grounded open-world state: Slice Co. van, story/hustle spots, pedestrian/rival/security
 * HumanNpcs with MAX_ATTACKERS=2 token combat, and active story/side job progression.
 */
export class OpenWorldState {
  spots: CampusSpot[] = [];
  humans: HumanNpc[] = [];
  props: CampusProp[] = [];
  active?: ActiveJob;
  completedJobs = new Set<JobId>();
  hustleBest: Partial<Record<HustleId, number>> = {};
  hustleCounts: Partial<Record<HustleId, number>> = {};
  unreadPhone = true;
  private nextHumanId = 1;
  private nextPropId = 1;
  private startAt: Pt;
  private campusWaypoints: Pt[] = [];

  constructor(host: OpenWorldHost, startAt: Pt, heading = 0) {
    this.startAt = [startAt[0], startAt[1]];
    this.initSpots(host, startAt, heading);
    this.initHumans(host, startAt, heading);
    this.initProps(host, startAt, heading);
  }

  private initSpots(host: OpenWorldHost, startAt: Pt, heading: number): void {
    const defs: readonly {
      id: string;
      kind: SpotKind;
      missionId?: MissionId;
      giver?: string;
      min: number;
      max: number;
      deg: number;
      allowPlace: boolean;
    }[] = [
      // Slice Co. Wood-Fired Pizza van on campus quad ~20-32 m from startAt
      { id: "spot-pizzaVan", kind: "pizzaVan", min: 20, max: 32, deg: heading - 58, allowPlace: true },
      // Story Job 1: Maya (Group Project) near Quad ~20-30 m from startAt
      { id: "spot-groupProject", kind: "jobGiver", missionId: "groupProject", giver: "Maya", min: 20, max: 30, deg: heading + 62, allowPlace: true },
      // Story Job 2: Sam (Pizza Express) ~40-62 m
      { id: "spot-pizzaExpress", kind: "jobGiver", missionId: "pizzaExpress", giver: "Sam", min: 40, max: 62, deg: heading - 108, allowPlace: true },
      // Story Job 3: Tane (Turf Table) ~58-84 m
      { id: "spot-turfTable", kind: "jobGiver", missionId: "turfTable", giver: "Tane", min: 58, max: 84, deg: heading + 135, allowPlace: true },
      // Story Job 4: Maya (Late Submission) ~76-105 m
      { id: "spot-lateSubmission", kind: "jobGiver", missionId: "lateSubmission", giver: "Maya", min: 76, max: 105, deg: heading - 148, allowPlace: true },
      // Side Hustles anchored to campus buildings/courtyards
      { id: "spot-sidePizzaRun", kind: "hustlePoint", missionId: "sidePizzaRun", giver: "Sam", min: 32, max: 50, deg: heading + 28, allowPlace: true },
      { id: "spot-sideCourtyardBrawl", kind: "hustlePoint", missionId: "sideCourtyardBrawl", giver: "Tane", min: 48, max: 72, deg: heading - 28, allowPlace: true },
      { id: "spot-sideCampusSprint", kind: "hustlePoint", missionId: "sideCampusSprint", giver: "Maya", min: 66, max: 94, deg: heading + 172, allowPlace: true },
    ];
    const avoid: Pt[] = [startAt];
    for (const d of defs) {
      const placed = pickSpotPos(host, startAt, d.min, d.max, d.deg, avoid, d.allowPlace);
      if (!placed) continue;
      avoid.push(placed.at);
      this.spots.push({
        id: d.id,
        kind: d.kind,
        missionId: d.missionId,
        giver: d.giver,
        at: placed.at,
        heading: bearingTo(placed.at, startAt),
        radius: OPEN_WORLD.spotRadius,
        cooldown: 0,
        placeName: placed.placeName,
      });
    }
  }

  private offsetFree(host: OpenWorldHost, origin: Pt, headings: readonly number[], radius: number, startAt: Pt): Pt | undefined {
    for (const deg of headings) {
      const [ux, uy] = dirOf(deg);
      const cand: Pt = [origin[0] + ux * radius, origin[1] + uy * radius];
      if (isFree(host, cand) && dist(cand, startAt) >= OPEN_WORLD.startClearance) return cand;
    }
    return undefined;
  }

  private initHumans(host: OpenWorldHost, startAt: Pt, heading: number): void {
    // 1. Spawn visible giver NPCs standing cleanly behind/beside each folding table (never clipping through tabletop)
    for (const sp of this.spots) {
      if (sp.kind === "jobGiver") {
        const standAt =
          this.offsetFree(host, sp.at, [sp.heading + 180, sp.heading - 90, sp.heading + 90, sp.heading], 1.05, startAt) ??
          [sp.at[0], sp.at[1]];
        this.humans.push({
          id: this.nextHumanId++,
          role: "giver",
          name: sp.giver ?? "",
          at: standAt,
          heading: bearingTo(standAt, startAt),
          speed: 0,
          palette: sp.giver === "Maya" ? 2 : sp.giver === "Sam" ? 3 : 6,
          prop: "clipboard",
          hp: 200,
          maxHp: 200,
          state: "idle",
          t: 0,
          cool: 0,
          hasToken: false,
          push: [0, 0],
          waypoint: [standAt[0], standAt[1]],
          waitT: 99,
          chatIdx: 0,
          chatT: 5,
          jobId: sp.missionId,
          isMissionTarget: false,
          circleDir: 1,
          attackDamage: 0,
          weapon: "fists",
        });
      } else if (sp.kind === "pizzaVan") {
        // Place a Slice Co. vendor beside the serving hatch
        const vendorAt = this.offsetFree(host, sp.at, [sp.heading + 90, sp.heading - 90, sp.heading + 180], 1.65, startAt);
        if (vendorAt) {
          this.humans.push({
            id: this.nextHumanId++,
            role: "pedestrian",
            name: "Slice Co.",
            at: vendorAt,
            heading: (sp.heading + 90) % 360,
            speed: 0,
            palette: 9,
            prop: "cap",
            hp: 120,
            maxHp: 120,
            state: "idle",
            t: 0,
            cool: 0,
            hasToken: false,
            push: [0, 0],
            waypoint: [vendorAt[0], vendorAt[1]],
            waitT: 1e9,
            chatIdx: 0,
            chatT: 6,
            isMissionTarget: false,
            circleDir: 1,
            attackDamage: 0,
            weapon: "fists",
          });
        }
      }
    }

    // 2. Gather campus walkway/building anchors so students throng campus plazas & paths
    const pool: Pt[] = this.spots.map((s) => s.at);
    for (let i = 0; i < 18; i++) {
      const anchor = host.campusAnchor?.(startAt, pool, 18, 125, 12);
      if (!anchor || !isFree(host, anchor.at)) break;
      pool.push(anchor.at);
    }
    this.campusWaypoints = pool;

    // 3. Spawn 34 strolling student pedestrians across campus (>= 18 m from startAt, awayFromHomes)
    const props: readonly HumanProp[] = ["backpack", "cap", "none", "backpack", "clipboard"];
    for (let i = 0; i < OPEN_WORLD.pedestrianCount; i++) {
      let pos: Pt | undefined;
      if (pool.length > 0 && i < OPEN_WORLD.pedestrianCount - 6) {
        const anchor = pool[i % pool.length]!;
        const jitterDeg = heading + i * 137.5;
        const [ux, uy] = dirOf(jitterDeg);
        const jr = 4.2 + (i % 4) * 3.1;
        const cand: Pt = [anchor[0] + ux * jr, anchor[1] + uy * jr];
        const snapped = snapCandidate(host, cand, [startAt], startAt);
        if (snapped && this.humans.every((h) => dist(h.at, snapped) >= 2.2)) pos = snapped;
      }
      if (!pos) {
        const deg = heading + 20 + i * (360 / OPEN_WORLD.pedestrianCount);
        const r = 20 + (i % 5) * 18 + host.random() * 10;
        const [ux, uy] = dirOf(deg);
        const cand: Pt = [startAt[0] + ux * r, startAt[1] + uy * r];
        pos = snapCandidate(host, cand, [startAt], startAt);
      }
      if (!pos) continue;
      if (pool.length < 48) pool.push(pos);
      const wp = this.pickWaypoint(host, pos, pool, startAt);
      const pausing = i % 5 === 0;
      this.humans.push({
        id: this.nextHumanId++,
        role: "pedestrian",
        name: "",
        at: pos,
        heading: bearingTo(pos, wp),
        speed: 1.15 + host.random() * 0.5,
        palette: (i * 5 + Math.floor(i / 8)) % 8,
        prop: props[i % props.length]!,
        hp: 50,
        maxHp: 50,
        state: pausing ? "idle" : "walk",
        t: 0,
        cool: 0,
        hasToken: false,
        push: [0, 0],
        waypoint: wp,
        waitT: pausing ? 2.2 + host.random() * 3.8 : host.random() * 1.4,
        chatIdx: Math.floor(host.random() * 6),
        chatT: 3 + host.random() * 4,
        isMissionTarget: false,
        circleDir: i % 2 === 0 ? 1 : -1,
        attackDamage: 0,
        weapon: "fists",
      });
    }
  }

  /** Places movable street/campus props (bins, cones, A-frame signs, chairs, boxes) on reachable awayFromHomes ground. */
  private initProps(host: OpenWorldHost, startAt: Pt, heading: number): void {
    const kinds: readonly PropKind[] = ["bin", "chair", "sign", "cone", "box"];
    const maxProps = 42;
    const clearProp = (p: Pt) =>
      isFree(host, p) &&
      dist(p, startAt) >= OPEN_WORLD.startClearance &&
      this.spots.every((s) => dist(s.at, p) >= 2.6) &&
      this.humans.every((h) => dist(h.at, p) >= 1.3) &&
      this.props.every((q) => dist(q.at, p) >= 1.3);

    const addProp = (kind: PropKind, at: Pt, rotDeg: number) => {
      const sp = PROP_SPECS[kind];
      this.props.push({
        id: this.nextPropId++,
        kind,
        at: [at[0], at[1]],
        heading: ((rotDeg % 360) + 360) % 360,
        y: 0,
        vx: 0,
        vz: 0,
        vy: 0,
        tilt: 0,
        tiltVel: 0,
        tiltDir: 0,
        spinVel: 0,
        radius: sp.radius,
        mass: sp.mass,
        hitCount: 0,
      });
    };

    // Place contextual clusters near each campus stand / Slice Co. van (kept >= 2.6 m clear of spot centres).
    for (let i = 0; i < this.spots.length && this.props.length < maxProps; i++) {
      const s = this.spots[i]!;
      const spotKinds: readonly PropKind[] = s.kind === "pizzaVan" ? ["sign", "bin", "chair", "box"] : ["sign", "chair", "bin"];
      for (let k = 0; k < spotKinds.length && this.props.length < maxProps; k++) {
        const ang = s.heading + (k - 1) * 68;
        const [ux, uy] = dirOf(ang);
        const r = s.kind === "pizzaVan" ? 3.4 + k * 0.45 : 2.9 + k * 0.4;
        const cand: Pt = [s.at[0] + ux * r, s.at[1] + uy * r];
        if (clearProp(cand)) addProp(spotKinds[k]!, cand, s.heading + k * 35);
      }
    }

    // Scatter remaining campus bins, cones, chairs & supply cartons along campus waypoints.
    for (let i = 0; i < 40 && this.props.length < maxProps; i++) {
      const anchor = this.campusWaypoints.length > 0 ? this.campusWaypoints[i % this.campusWaypoints.length]! : startAt;
      const deg = heading + i * 111.5;
      const [ux, uy] = dirOf(deg);
      const r = 3.5 + (i % 5) * 1.25;
      const cand: Pt = [anchor[0] + ux * r, anchor[1] + uy * r];
      if (clearProp(cand)) addProp(kinds[i % kinds.length]!, cand, deg);
    }
  }

  /** Applies melee strike impulse to campus street props in swing arc, toppling and sliding them realistically. */
  hitPropsMelee(from: Pt, dir: number, reach: number, arc: number, heavy: boolean, bridge: OpenWorldBridge): CampusProp[] {
    const hit: CampusProp[] = [];
    for (const p of this.props) {
      const d = dist(from, p.at);
      if (d > reach + p.radius + 0.15) continue;
      const off = Math.abs(turnBetween(dir, bearingTo(from, p.at)));
      if (off > arc && d > p.radius + 0.55) continue;
      const launchDir = d > 0.15 ? bearingTo(from, p.at) : dir;
      const [ux, uy] = dirOf(launchDir);
      const speed = (heavy ? 8.5 : 5.2) / p.mass;
      p.vx += ux * speed;
      p.vz += uy * speed;
      p.vy = Math.max(p.vy, Math.min(3.4, (heavy ? 2.6 : 1.5) / Math.sqrt(p.mass)));
      p.tiltDir = launchDir;
      p.tiltVel = Math.max(p.tiltVel, (heavy ? 11 : 7.5) / Math.sqrt(p.mass));
      p.spinVel += (p.id % 2 === 0 ? 1 : -1) * (heavy ? 260 : 140);
      p.hitCount++;
      hit.push(p);
      if (p.hitCount === 1 && heavy && (p.kind === "bin" || p.kind === "box") && p.id % 3 === 0) {
        const dropKind: PickupKind = p.id % 2 === 0 ? "coffee" : "cash";
        const dropAt = bridge.safeGround([p.at[0] + ux * 0.6, p.at[1] + uy * 0.6]);
        bridge.spawnPickup(dropKind, dropAt, dropKind === "cash" ? 10 : 1, { dropped: true });
      }
    }
    return hit;
  }

  /** Steps rigid-impulse physics for campus props (foot bumps, running kicks, vehicle plows, toppling & friction). */
  stepProps(
    dt: number,
    player: Pt,
    playerSpeed: number,
    playerHeading: number,
    inVehicle: boolean,
    vehicles: readonly { at: Pt; heading: number; speed: number; halfW: number; halfL: number }[],
    host: OpenWorldHost,
  ): CampusProp[] {
    if (dt <= 0) return [];
    const bumped: CampusProp[] = [];
    for (const p of this.props) {
      // Foot bump / sprint kick
      if (!inVehicle && p.y < 0.6) {
        const dp = dist(player, p.at);
        const minSep = p.radius + 0.42;
        if (dp < minSep) {
          const away = dp > 0.05 ? bearingTo(player, p.at) : playerHeading;
          const [ux, uy] = dirOf(away);
          p.at = [player[0] + ux * minSep, player[1] + uy * minSep];
          if (playerSpeed > 2.6) {
            const kick = (playerSpeed * 1.35) / p.mass;
            p.vx += ux * kick;
            p.vz += uy * kick;
            p.vy = Math.max(p.vy, 1.1 / Math.sqrt(p.mass));
            p.tiltDir = away;
            p.tiltVel = Math.max(p.tiltVel, 6.5);
            bumped.push(p);
          } else {
            p.vx += ux * 1.4;
            p.vz += uy * 1.4;
            p.tiltDir = away;
            p.tiltVel = Math.max(p.tiltVel, 2.2);
          }
        }
      }

      // Vehicle plow against OBB footprint
      for (const v of vehicles) {
        const spd = Math.abs(v.speed);
        if (spd < 0.6 || p.y > 1.4) continue;
        const rad = v.heading * D2R;
        const fx = Math.sin(rad);
        const fy = Math.cos(rad);
        const rx = Math.cos(rad);
        const ry = -Math.sin(rad);
        const dx = p.at[0] - v.at[0];
        const dy = p.at[1] - v.at[1];
        const lat = dx * rx + dy * ry;
        const fwd = dx * fx + dy * fy;
        if (Math.abs(lat) < v.halfW + p.radius && Math.abs(fwd) < v.halfL + p.radius) {
          const launchDeg = v.speed >= 0 ? v.heading + (lat >= 0 ? 22 : -22) : (v.heading + 180) % 360;
          const [ux, uy] = dirOf(launchDeg);
          const launch = Math.max(4, spd * 1.15);
          p.vx = ux * launch;
          p.vz = uy * launch;
          p.vy = Math.max(p.vy, Math.min(3.8, 1.2 + spd * 0.14));
          p.tiltDir = launchDeg;
          p.tiltVel = Math.max(p.tiltVel, 12);
          p.spinVel += (p.id % 2 === 0 ? 1 : -1) * 320;
          p.at = [p.at[0] + ux * 0.45, p.at[1] + uy * 0.45];
          bumped.push(p);
          break;
        }
      }

      // Linear velocity + wall bounce + friction
      const spd2 = Math.hypot(p.vx, p.vz);
      if (spd2 > 0.02) {
        const next: Pt = [p.at[0] + p.vx * dt, p.at[1] + p.vz * dt];
        if (host.ground && !host.ground(next)) {
          p.vx *= -0.35;
          p.vz *= -0.35;
        } else {
          p.at = next;
        }
        const damp = Math.exp(-3.4 * dt);
        p.vx *= damp;
        p.vz *= damp;
      } else {
        p.vx = 0;
        p.vz = 0;
      }

      // Vertical bounce
      if (p.y > 0 || p.vy > 0) {
        p.vy -= 14.5 * dt;
        p.y += p.vy * dt;
        if (p.y <= 0) {
          p.y = 0;
          p.vy = p.vy < -1.5 ? -p.vy * 0.26 : 0;
        }
      }

      // Topple dynamics: past tipping angle (0.42 rad), gravity pulls prop flat onto the ground; otherwise springs back.
      const flatTilt = Math.PI * 0.48;
      if (Math.abs(p.tiltVel) > 0.01 || (p.tilt > 0.005 && p.tilt < flatTilt - 0.01)) {
        if (p.tilt > 0.42) {
          p.tiltVel += 18 * dt;
        } else {
          p.tiltVel -= p.tilt * 22 * dt;
          p.tiltVel *= Math.exp(-5 * dt);
        }
        p.tilt += p.tiltVel * dt;
        if (p.tilt >= flatTilt) {
          p.tilt = flatTilt;
          p.tiltVel = p.tiltVel > 2.2 ? -p.tiltVel * 0.22 : 0;
        } else if (p.tilt <= 0) {
          p.tilt = 0;
          p.tiltVel = 0;
        }
      }

      if (Math.abs(p.spinVel) > 0.5) {
        p.heading = ((p.heading + p.spinVel * dt) % 360 + 360) % 360;
        p.spinVel *= Math.exp(-4 * dt);
      } else {
        p.spinVel = 0;
      }
    }
    return bumped;
  }

  private pickWaypoint(host: OpenWorldHost, from: Pt, pool: readonly Pt[], startAt: Pt): Pt {
    const candidates = pool.filter((p) => dist(p, from) >= 8 && dist(p, startAt) >= OPEN_WORLD.startClearance && isFree(host, p));
    if (candidates.length > 0) return candidates[Math.floor(host.random() * candidates.length)]!;
    return pickRingPos(host, from, 14, 28, startAt, host.random() * 360);
  }

  isJobAvailable(id: JobId): boolean {
    const def = STORY_JOBS.find((j) => j.id === id);
    if (!def) return false;
    return !def.requires || this.completedJobs.has(def.requires);
  }

  nearSpot(player: Pt, maxDist: number = OPEN_WORLD.interactRadius): CampusSpot | undefined {
    let best: CampusSpot | undefined;
    let bestD = maxDist;
    for (const s of this.spots) {
      const d = dist(player, s.at);
      if (d <= bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  }

  currentObjectivePoint(): Pt | undefined {
    const a = this.active;
    if (!a) {
      const next = STORY_JOBS.find((j) => !this.completedJobs.has(j.id) && this.isJobAvailable(j.id));
      return next ? this.spots.find((s) => s.missionId === next.id)?.at : undefined;
    }
    if (a.stage === "checkpoints" && a.checkpoints) return a.checkpoints[a.got];
    if (a.stage === "goto" && a.targetAt) return a.targetAt;
    if (a.stage === "fight") {
      const tgt = this.humans.find((h) => a.targets.includes(h.id) && h.state !== "dead");
      if (tgt) return tgt.at;
    }
    return a.targetAt;
  }

  /** Spawns a hostile rival or security officer on reachable awayFromHomes ground. */
  spawnHuman(role: HumanRole, at: Pt, host: OpenWorldHost, opts: { jobId?: MissionId; isMissionTarget?: boolean; tier?: number } = {}): HumanNpc {
    const safeAt = isFree(host, at) ? at : host.near?.(at) ?? host.spot(at, [this.startAt], at) ?? at;
    const spec = ROLE_STATS[role];
    const tier = opts.tier ?? 1;
    const hp = Math.round(spec.hp * tier);
    const npc: HumanNpc = {
      id: this.nextHumanId++,
      role,
      name: "",
      at: [safeAt[0], safeAt[1]],
      heading: bearingTo(safeAt, this.startAt),
      speed: spec.speed,
      palette: role === "security" ? 10 : role === "allNighter" ? 8 : role === "debateRival" ? 5 : 2,
      prop: spec.prop,
      hp,
      maxHp: hp,
      state: role === "pedestrian" ? "walk" : role === "giver" ? "idle" : "chase",
      t: 0,
      cool: 0.35 + host.random() * 0.4,
      hasToken: false,
      push: [0, 0],
      waypoint: [safeAt[0], safeAt[1]],
      waitT: 0,
      chatIdx: 0,
      chatT: 5,
      jobId: opts.jobId,
      isMissionTarget: opts.isMissionTarget ?? false,
      circleDir: this.nextHumanId % 2 === 0 ? 1 : -1,
      attackDamage: Math.round(spec.damage * tier),
      weapon: role === "allNighter" ? "textbook" : "fists",
    };
    this.humans.push(npc);
    return npc;
  }

  /** Starts a job or hustle by ID (from phone or spot). */
  startMission(id: MissionId, player: Pt, bridge: OpenWorldBridge): boolean {
    if (this.active) return false;
    const spot = this.spots.find((s) => s.missionId === id);
    if (!spot) return false;
    this.startFromSpot(spot, player, bridge);
    return true;
  }

  abortActive(bridge: OpenWorldBridge): boolean {
    if (!this.active) return false;
    this.failJob(bridge);
    return true;
  }

  interact(player: Pt, bridge: OpenWorldBridge): boolean {
    const spot = this.nearSpot(player, OPEN_WORLD.interactRadius);
    if (!spot) return false;
    if (spot.kind === "pizzaVan") return false; // pizza van purchase/eat handled by StudyQuest.eatSlice()
    if (this.active) return false;
    if (spot.missionId && spot.kind === "jobGiver" && !this.isJobAvailable(spot.missionId as JobId)) return false;
    this.startFromSpot(spot, player, bridge);
    return true;
  }

  resetActive(): void {
    this.active = undefined;
    for (const s of this.spots) s.cooldown = 0;
    this.humans = this.humans.filter((h) => h.role === "pedestrian" || h.role === "giver");
    for (const h of this.humans) h.hasToken = false;
  }

  /** Applies melee damage from player to a HumanNpc. Returns true if knocked out. */
  damageHuman(h: HumanNpc, amount: number, pushDir: number, pushForce: number, knockdown: boolean, bridge: OpenWorldBridge): boolean {
    if (h.state === "dead") return false;
    h.hp = Math.max(0, h.hp - amount);
    const [ux, uy] = dirOf(pushDir);
    h.push = [h.push[0] + ux * pushForce * 5.6, h.push[1] + uy * pushForce * 5.6];
    h.hasToken = false;

    // Witness panic: nearby standing pedestrians scatter when a brawl or assault breaks out
    for (const other of this.humans) {
      if (other.id === h.id || other.role !== "pedestrian" || other.state === "dead" || other.state === "down") continue;
      if (dist(other.at, h.at) <= 12) {
        other.waitT = 0;
        other.state = "flee";
        other.t = 4.5 + (other.id % 4) * 0.75;
        other.heading = bearingTo(h.at, other.at);
      }
    }

    if (h.role === "pedestrian") {
      // Hitting an innocent pedestrian raises wanted star, visibly staggers/knocks them down, and 1-in-4 fights back
      bridge.addWanted(1);
      if (h.hp > 0) {
        h.waitT = 0;
        h.state = knockdown ? "down" : "stagger";
        h.t = knockdown ? 1.4 : 0.42;
        if (h.id % 4 === 0 && h.name !== "Slice Co.") {
          h.role = "freeRider";
          h.attackDamage = 8;
          h.speed = 3.1;
          h.maxHp = Math.max(h.maxHp, 65);
        }
      }
    } else if (h.hp > 0) {
      h.state = knockdown ? "down" : "stagger";
      h.t = knockdown ? 1.5 : 0.38;
    }

    if (h.hp <= 0) {
      h.state = "dead";
      h.t = 3.0;
      h.hasToken = false;
      this.onHumanDefeated(h, bridge);
      return true;
    }
    return false;
  }

  private onHumanDefeated(h: HumanNpc, bridge: OpenWorldBridge): void {
    const dropAt = bridge.safeGround(h.at);
    // Knockdown drops: cash roll + pizza boxes for rival students, occasional cash/coffee from street brawls
    if (h.role === "freeRider" || h.role === "debateRival" || h.role === "allNighter" || h.role === "security") {
      const cashVal = h.role === "allNighter" ? 45 : h.role === "security" ? 30 : 22;
      bridge.spawnPickup("cash", dropAt, cashVal, { dropped: true });
      bridge.emit({ type: "drop", kind: "cash", at: dropAt, value: cashVal });
      if (h.role !== "security") {
        const slices = h.role === "allNighter" ? 2 : 1;
        for (let i = 0; i < slices; i++) {
          const pAt = bridge.safeGround([dropAt[0] + (i === 0 ? 1.1 : -1.1), dropAt[1] + 0.7]);
          bridge.spawnPickup("pizza", pAt, 1, { dropped: true, open: true });
          bridge.emit({ type: "drop", kind: "pizza", at: pAt, value: 1 });
        }
      }
    } else if (h.role === "pedestrian" && h.id % 2 === 0) {
      const kind: PickupKind = h.id % 4 === 0 ? "cash" : "coffee";
      const val = kind === "cash" ? 12 : 1;
      bridge.spawnPickup(kind, dropAt, val, { dropped: true });
      bridge.emit({ type: "drop", kind, at: dropAt, value: val });
    }

    const a = this.active;
    if (a && a.stage === "fight" && a.targets.includes(h.id)) {
      a.got++;
      if (a.got >= a.need) {
        if (a.id === "groupProject" || a.id === "turfTable") {
          const pkgAt = bridge.safeGround([dropAt[0] - 0.9, dropAt[1] - 0.9]);
          bridge.spawnPickup("package", pkgAt, 1, { dropped: true, jobId: a.id });
          bridge.emit({ type: "drop", kind: "package", at: pkgAt, value: 1 });
          // Ensure a pizza box is also nearby for groupProject's collect package & eat pizza flow
          if (a.id === "groupProject" && !bridge.pickups.some((p) => p.kind === "pizza" && dist(p.at, pkgAt) <= 18)) {
            const pAt = bridge.safeGround([pkgAt[0] + 1.6, pkgAt[1] + 0.6]);
            bridge.spawnPickup("pizza", pAt, 1, { dropped: true, open: true });
          }
          a.stage = "collect";
          a.got = 0;
          a.need = a.id === "groupProject" ? 2 : 1;
          a.gotPackage = false;
          a.gotPizza = false;
          a.targetAt = pkgAt;
          bridge.setGpsTarget(pkgAt);
          bridge.emit({ type: "job", id: a.id, state: "stage", stage: "collect" });
        } else {
          this.passJob(bridge);
        }
      }
    }
  }

  /** Called when a grounded pickup is collected. */
  onPickupCollected(p: PickupItem, bridge: OpenWorldBridge): void {
    const a = this.active;
    if (!a) return;
    if (a.stage === "collect") {
      if (p.kind === "package" && (!p.jobId || p.jobId === a.id)) {
        if (a.id === "lateSubmission") {
          // Grabbing the lateSubmission USB triggers Campus Security alert + getaway!
          bridge.addWanted(2);
          const spot = this.spots.find((s) => s.id === a.spotId);
          a.stage = "goto";
          a.got = 0;
          a.need = 1;
          a.timer = 90;
          a.maxTimer = 90;
          a.targetAt = spot?.at ?? bridge.startAt;
          bridge.setGpsTarget(a.targetAt);
          bridge.emit({ type: "job", id: a.id, state: "stage", stage: "goto" });
          return;
        }
        a.gotPackage = true;
      }
      if (p.kind === "pizza") a.gotPizza = true;

      if (a.id === "groupProject") {
        a.got = (a.gotPackage ? 1 : 0) + (a.gotPizza ? 1 : 0);
        if (a.gotPackage && a.gotPizza) this.passJob(bridge);
      } else if (a.id === "turfTable" && a.gotPackage) {
        this.passJob(bridge);
      }
    }
  }

  /** Called when the player eats a stored slice via [G] while a collect stage wants a pizza. */
  onSliceEaten(bridge: OpenWorldBridge): void {
    const a = this.active;
    if (!a || a.stage !== "collect") return;
    if (a.id === "groupProject") {
      a.gotPizza = true;
      a.got = (a.gotPackage ? 1 : 0) + 1;
      if (a.gotPackage) this.passJob(bridge);
    }
  }

  step(dt: number, player: Pt, bridge: OpenWorldBridge): void {
    for (const s of this.spots) {
      if (s.cooldown > 0) s.cooldown = Math.max(0, s.cooldown - dt);
    }

    // Auto-start groupProject / unlocked story jobs or hustles on walking up (unless pizzaVan or on cooldown)
    if (!this.active && !bridge.inVehicle) {
      const spot = this.spots.find((s) => s.kind !== "pizzaVan" && s.cooldown <= 0 && dist(player, s.at) <= s.radius);
      if (spot && spot.missionId) {
        if (spot.kind !== "jobGiver" || (!this.completedJobs.has(spot.missionId as JobId) && this.isJobAvailable(spot.missionId as JobId))) {
          this.startFromSpot(spot, player, bridge);
        }
      }
    }

    // Security officer spawns while wanted >= 1
    this.syncSecurityOfficers(bridge, player);

    // Step all human NPCs (including attack-token combat)
    this.stepHumans(dt, player, bridge);

    // Active job checkpoints / goto / timer
    const a = this.active;
    if (a) {
      if (a.stage === "checkpoints" && a.checkpoints) {
        const cp = a.checkpoints[a.got];
        if (cp && dist(player, cp) <= OPEN_WORLD.checkpointRadius) {
          a.got++;
          if (a.got >= a.need) {
            if (a.id === "pizzaExpress") {
              bridge.spawnPickup("pizza", bridge.safeGround([cp[0] + 1.8, cp[1]]), 1, { dropped: true, open: true });
            }
            this.passJob(bridge);
            return;
          }
          const next = a.checkpoints[a.got]!;
          a.targetAt = next;
          bridge.setGpsTarget(next);
          bridge.emit({ type: "checkpoint", index: a.got, total: a.need, at: next });
        }
      } else if (a.stage === "goto" && a.targetAt) {
        if (dist(player, a.targetAt) <= OPEN_WORLD.checkpointRadius && bridge.wanted === 0) {
          this.passJob(bridge);
          return;
        }
        // Also allow passing lateSubmission once wanted drops to 0 OR reaching drop-off with wanted <= 1
        if (dist(player, a.targetAt) <= OPEN_WORLD.checkpointRadius && a.id === "lateSubmission") {
          bridge.setWanted(0);
          this.passJob(bridge);
          return;
        }
      }

      if (a.timer !== undefined) {
        a.timer = Math.max(0, a.timer - dt);
        if (a.timer <= 0) this.failJob(bridge);
      }
    }
  }

  private syncSecurityOfficers(bridge: OpenWorldBridge, player: Pt): void {
    const want = bridge.wanted <= 0 ? 0 : Math.min(4, bridge.wanted + 1);
    const live = this.humans.filter((h) => h.role === "security" && h.state !== "dead");
    if (want === 0) {
      for (const h of live) {
        h.hasToken = false;
        h.state = "walk";
        h.role = "pedestrian";
      }
      return;
    }
    if (live.length < want) {
      const p = pickRingPos(bridge.host, player, 22, 32, bridge.startAt, bridge.host.random() * 360);
      this.spawnHuman("security", p, bridge.host, { tier: 1 + (bridge.wanted - 1) * 0.15 });
    }
  }

  private stepHumans(dt: number, player: Pt, bridge: OpenWorldBridge): void {
    const pool = this.campusWaypoints.length > 0 ? this.campusWaypoints : this.spots.map((s) => s.at);
    const blockedByObstacle = (from: Pt, next: Pt) =>
      bridge.obstacles?.some((o) => {
        const dNext = dist(next, o.at);
        if (dNext >= o.radius) return false;
        // Only block entry or deeper penetration so someone already near an edge can walk out cleanly
        return dNext < dist(from, o.at);
      }) ?? false;
    // Count current active attack tokens (MAX_ATTACKERS = 2)
    let activeTokens = 0;
    for (const h of this.humans) {
      if (h.state === "dead") {
        h.hasToken = false;
        continue;
      }
      if (h.hasToken) activeTokens++;
    }

    for (const h of this.humans) {
      h.chatT -= dt;
      if (h.chatT <= 0) {
        h.chatIdx = (h.chatIdx + 1) % 6;
        h.chatT = 4 + bridge.host.random() * 4;
      }

      if (h.state === "dead") {
        h.t -= dt;
        continue;
      }

      // Decay knockback push
      if (Math.hypot(h.push[0], h.push[1]) > 0.01) {
        const nextPush: Pt = [h.at[0] + h.push[0] * dt, h.at[1] + h.push[1] * dt];
        if (isFree(bridge.host, nextPush)) h.at = nextPush;
        const fade = Math.exp(-8 * dt);
        h.push = [h.push[0] * fade, h.push[1] * fade];
      }

      if (h.role === "giver") {
        h.heading = bearingTo(h.at, player);
        continue;
      }

      if (h.state === "stagger" || h.state === "down") {
        h.t -= dt;
        if (h.t <= 0) {
          if (h.role === "pedestrian") {
            h.state = "flee";
            h.t = 5.5;
          } else {
            h.state = "chase";
          }
        }
        continue;
      }

      if (h.role === "pedestrian") {
        if (h.state === "flee") {
          h.t -= dt;
          const away = bearingTo(player, h.at);
          const [ux, uy] = dirOf(away);
          const next: Pt = [h.at[0] + ux * 3.8 * dt, h.at[1] + uy * 3.8 * dt];
          if (isFree(bridge.host, next)) h.at = next;
          h.heading = away;
          if (h.t <= 0) h.state = "walk";
          continue;
        }
        if (h.waitT > 0) {
          h.waitT = Math.max(0, h.waitT - dt);
          if (h.waitT <= 0) h.state = "walk";
          continue;
        }
        const d = dist(h.at, h.waypoint);
        if (d <= 1.2) {
          h.waitT = 0.8 + bridge.host.random() * 1.6;
          h.state = "idle";
          h.waypoint = this.pickWaypoint(bridge.host, h.at, pool, this.startAt);
          h.heading = bearingTo(h.at, h.waypoint);
          continue;
        }
        const dir = bearingTo(h.at, h.waypoint);
        const [ux, uy] = dirOf(dir);
        const step = Math.min(d, h.speed * dt);
        const next: Pt = [h.at[0] + ux * step, h.at[1] + uy * step];
        const canStep = (p: Pt) => isFree(bridge.host, p) && dist(p, this.startAt) >= OPEN_WORLD.startClearance && !blockedByObstacle(h.at, p);
        if (canStep(next)) {
          h.state = "walk";
          h.heading = dir;
          h.at = next;
          continue;
        }
        // Sidestep around campus stands, pizza van, or parked vehicles before picking a new waypoint
        let steered = false;
        for (const off of [55, -55]) {
          const altDir = (dir + off + 360) % 360;
          const [ax, ay] = dirOf(altDir);
          const altNext: Pt = [h.at[0] + ax * step, h.at[1] + ay * step];
          if (canStep(altNext)) {
            h.state = "walk";
            h.heading = altDir;
            h.at = altNext;
            steered = true;
            break;
          }
        }
        if (!steered) {
          h.waypoint = this.pickWaypoint(bridge.host, h.at, pool, this.startAt);
          h.waitT = 0.4;
          h.state = "idle";
        }
        continue;
      }

      // Hostile combat NPCs (freeRider, debateRival, allNighter, security)
      h.cool = Math.max(0, h.cool - dt);
      const d = dist(h.at, player);
      const toward = bearingTo(h.at, player);
      h.heading = toward;

      if (h.state === "windup") {
        h.t -= dt;
        if (h.t <= 0) {
          h.state = "attack";
          h.t = 0.22;
          if (d <= 2.4 && !bridge.inVehicle && bridge.playerIframes <= 0) {
            bridge.hurtPlayer(h.attackDamage, h.at);
          }
        }
        continue;
      }

      if (h.state === "attack") {
        h.t -= dt;
        if (h.t <= 0) {
          h.state = "circle";
          h.cool = 0.9 + bridge.host.random() * 0.6;
          if (h.hasToken) {
            h.hasToken = false;
            activeTokens = Math.max(0, activeTokens - 1);
          }
        }
        continue;
      }

      // Token acquisition (MAX_ATTACKERS = 2)
      if (!h.hasToken && d < 6.0 && h.cool <= 0 && activeTokens < MAX_ATTACKERS) {
        h.hasToken = true;
        activeTokens++;
      } else if (h.hasToken && d > 8.0) {
        h.hasToken = false;
        activeTokens = Math.max(0, activeTokens - 1);
      }

      if (h.hasToken || d > 5.0) {
        h.state = "chase";
        if (d > 1.75) {
          const [ux, uy] = dirOf(toward);
          const next: Pt = [h.at[0] + ux * h.speed * dt, h.at[1] + uy * h.speed * dt];
          if (isFree(bridge.host, next)) h.at = next;
        } else if (h.hasToken && h.cool <= 0) {
          h.state = "windup";
          h.t = 0.42;
        }
      } else {
        // Circle at arm's length without piling on
        h.state = "circle";
        const [ux, uy] = dirOf(toward);
        const tangentX = -uy * h.circleDir;
        const tangentY = ux * h.circleDir;
        const radial = Math.max(-1.2, Math.min(1.2, (d - 3.4) * 1.4));
        const vx = tangentX * 1.6 + ux * radial;
        const vy = tangentY * 1.6 + uy * radial;
        const next: Pt = [h.at[0] + vx * dt, h.at[1] + vy * dt];
        if (isFree(bridge.host, next)) h.at = next;
      }
    }

    // Clean up expired dead NPCs (keep mission targets until job ends if needed, otherwise remove after fade)
    this.humans = this.humans.filter((h) => !(h.state === "dead" && h.t <= 0));
  }

  private startFromSpot(spot: CampusSpot, _player: Pt, bridge: OpenWorldBridge): void {
    const id = spot.missionId;
    if (!id) return;
    spot.cooldown = OPEN_WORLD.spotCooldown;
    this.unreadPhone = false;

    const story = STORY_JOBS.find((j) => j.id === id);
    const hustle = SIDE_HUSTLES.find((h) => h.id === id);
    const xp = story?.xp ?? hustle?.xp ?? 100;
    const cash = story?.cash ?? hustle?.cash ?? 150;
    const kind: "story" | "hustle" = story ? "story" : "hustle";
    const giver = story?.giver ?? hustle?.giver ?? spot.giver ?? "";

    if (id === "groupProject") {
      const away = bearingTo(bridge.startAt, spot.at);
      const r1 = this.spawnHuman("freeRider", pickRingPos(bridge.host, spot.at, 10, 14, bridge.startAt, away - 35), bridge.host, { jobId: id, isMissionTarget: true });
      const r2 = this.spawnHuman("freeRider", pickRingPos(bridge.host, spot.at, 10, 14, bridge.startAt, away + 35), bridge.host, { jobId: id, isMissionTarget: true });
      this.active = {
        id,
        kind,
        giver,
        spotId: spot.id,
        placeName: spot.placeName,
        stage: "fight",
        got: 0,
        need: 2,
        gotPackage: false,
        gotPizza: false,
        targets: [r1.id, r2.id],
        xp,
        cash,
      };
      bridge.setGpsTarget(r1.at);
      bridge.emit({ type: "job", id, state: "start", stage: "fight" });
      bridge.emit({ type: "subtitle", speaker: "Maya", key: "game.sub.groupProject.start", ttl: 4 });
      return;
    }

    if (id === "pizzaExpress" || id === "sidePizzaRun" || id === "sideCampusSprint") {
      const count = id === "sideCampusSprint" ? 4 : 3;
      const timer = id === "pizzaExpress" ? 75 : id === "sidePizzaRun" ? 65 : 55;
      const cps = this.buildCheckpoints(spot.at, count, 28, 45, bridge);
      this.active = {
        id,
        kind,
        giver,
        spotId: spot.id,
        placeName: spot.placeName,
        stage: "checkpoints",
        got: 0,
        need: count,
        gotPackage: false,
        gotPizza: false,
        timer,
        maxTimer: timer,
        checkpoints: cps,
        targetAt: cps[0],
        targets: [],
        xp,
        cash,
      };
      bridge.setGpsTarget(cps[0]);
      bridge.emit({ type: "job", id, state: "start", stage: "checkpoints" });
      bridge.emit({ type: "checkpoint", index: 0, total: count, at: cps[0]! });
      return;
    }

    if (id === "turfTable" || id === "sideCourtyardBrawl") {
      const away = bearingTo(bridge.startAt, spot.at);
      const foes =
        id === "turfTable"
          ? [
              this.spawnHuman("debateRival", pickRingPos(bridge.host, spot.at, 10, 14, bridge.startAt, away - 30), bridge.host, { jobId: id, isMissionTarget: true }),
              this.spawnHuman("allNighter", pickRingPos(bridge.host, spot.at, 10, 14, bridge.startAt, away + 30), bridge.host, { jobId: id, isMissionTarget: true, tier: 1.15 }),
            ]
          : [
              this.spawnHuman("freeRider", pickRingPos(bridge.host, spot.at, 10, 14, bridge.startAt, away - 40), bridge.host, { jobId: id, isMissionTarget: true }),
              this.spawnHuman("freeRider", pickRingPos(bridge.host, spot.at, 10, 14, bridge.startAt, away + 40), bridge.host, { jobId: id, isMissionTarget: true }),
              this.spawnHuman("debateRival", pickRingPos(bridge.host, spot.at, 10, 14, bridge.startAt, away), bridge.host, { jobId: id, isMissionTarget: true }),
            ];
      this.active = {
        id,
        kind,
        giver,
        spotId: spot.id,
        placeName: spot.placeName,
        stage: "fight",
        got: 0,
        need: foes.length,
        gotPackage: false,
        gotPizza: false,
        targets: foes.map((f) => f.id),
        xp,
        cash,
      };
      bridge.setGpsTarget(foes[0]!.at);
      bridge.emit({ type: "job", id, state: "start", stage: "fight" });
      return;
    }

    // lateSubmission
    const lateAnchor = bridge.host.campusAnchor?.(spot.at, [bridge.startAt, spot.at], 24, 62, 18);
    const pkgAt =
      lateAnchor && isFree(bridge.host, lateAnchor.at) && dist(lateAnchor.at, bridge.startAt) >= OPEN_WORLD.startClearance
        ? lateAnchor.at
        : pickRingPos(bridge.host, spot.at, 26, 38, bridge.startAt, bearingTo(bridge.startAt, spot.at));
    bridge.spawnPickup("package", pkgAt, 1, { dropped: true, jobId: id });
    this.active = {
      id,
      kind,
      giver,
      spotId: spot.id,
      placeName: spot.placeName,
      stage: "collect",
      got: 0,
      need: 1,
      gotPackage: false,
      gotPizza: false,
      targetAt: pkgAt,
      targets: [],
      xp,
      cash,
    };
    bridge.setGpsTarget(pkgAt);
    bridge.emit({ type: "job", id, state: "start", stage: "collect" });
  }

  private buildCheckpoints(start: Pt, count: number, minGap: number, maxGap: number, bridge: OpenWorldBridge): Pt[] {
    const out: Pt[] = [];
    let cur = start;
    let baseDir = bearingTo(bridge.startAt, start);
    for (let i = 0; i < count; i++) {
      baseDir = (baseDir + (i === 0 ? 35 : 55)) % 360;
      const anchor = bridge.host.campusAnchor?.(cur, [bridge.startAt, start, ...out], Math.max(14, minGap - 4), maxGap + 22, 18);
      if (anchor && isFree(bridge.host, anchor.at) && dist(anchor.at, bridge.startAt) >= OPEN_WORLD.startClearance) {
        out.push(anchor.at);
        cur = anchor.at;
        continue;
      }
      let chosen: Pt | undefined;
      for (const off of [0, 35, -35, 75, -75, 120, -120]) {
        const r = minGap + bridge.host.random() * (maxGap - minGap);
        const [ux, uy] = dirOf(baseDir + off);
        const cand: Pt = [cur[0] + ux * r, cur[1] + uy * r];
        const p = snapCandidate(bridge.host, cand, [bridge.startAt, ...out], bridge.startAt);
        if (p && dist(p, cur) >= minGap - 6 && dist(p, cur) <= maxGap + 10) {
          chosen = p;
          break;
        }
      }
      if (!chosen) chosen = pickRingPos(bridge.host, cur, minGap, maxGap, bridge.startAt, baseDir);
      out.push(chosen);
      cur = chosen;
    }
    return out;
  }

  private passJob(bridge: OpenWorldBridge): void {
    const a = this.active;
    if (!a) return;
    this.active = undefined;
    if (a.kind === "story") {
      this.completedJobs.add(a.id as JobId);
    } else {
      const hid = a.id as HustleId;
      this.hustleCounts[hid] = (this.hustleCounts[hid] ?? 0) + 1;
      if (a.maxTimer !== undefined && a.timer !== undefined) {
        const elapsed = Math.round((a.maxTimer - a.timer) * 10) / 10;
        const prev = this.hustleBest[hid];
        if (prev === undefined || elapsed < prev) this.hustleBest[hid] = elapsed;
      }
    }
    const spot = this.spots.find((s) => s.id === a.spotId);
    if (spot) spot.cooldown = OPEN_WORLD.spotCooldown;
    for (const h of this.humans) h.isMissionTarget = false;
    bridge.setGpsTarget(undefined);
    bridge.grantReward(a.xp, a.cash);
    bridge.emit({ type: "job", id: a.id, state: "pass", xp: a.xp, cash: a.cash });
  }

  private failJob(bridge: OpenWorldBridge): void {
    const a = this.active;
    if (!a) return;
    this.active = undefined;
    const spot = this.spots.find((s) => s.id === a.spotId);
    if (spot) spot.cooldown = 10;
    for (const h of this.humans) {
      if (a.targets.includes(h.id)) {
        h.isMissionTarget = false;
        h.hasToken = false;
      }
    }
    bridge.setGpsTarget(undefined);
    bridge.emit({ type: "job", id: a.id, state: "fail" });
  }
}
