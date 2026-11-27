// Study Quest over the campus map: realistic human NPCs, traffic & drivable vehicles,
// Slice Co. pizza van, grounded pickups, Campus Security, and GTA Harbour-Night HUD bridge.
// Rules live in shared/game.ts, openWorld.ts, and campusVehicles.ts; 3D models live in openWorldScene.ts.
import { Group, Vector3, type Camera, type Material, type InstancedMesh } from "three";
import { decodeRing, type Pt } from "../shared/geo.ts";
import {
  HOME_MARGIN,
  PLAYER,
  QUEST,
  RANKS,
  SKILLS,
  StudyQuest,
  awayFromHomes,
  bearingTo,
  bookSpot,
  isHome,
  nearestReached,
  openSpot,
  questDraws,
  reachable,
  turnBetween,
  type Debrief,
  type FoeKind,
  type GameEvent,
  type ItemKind,
  type Lesson,
  type Place,
  type QuestKey,
  type SkillId,
} from "../shared/game.ts";
import { OPEN_WORLD, STORY_JOBS, SIDE_HUSTLES, type ActiveJob, type HumanNpc, type JobId, type PickupKind } from "../shared/openWorld.ts";
import type { CampusVehicle, VehicleControlInput, VehicleKind } from "../shared/campusVehicles.ts";
import type { RoofMap } from "../shared/roofmap.ts";
import type { Building, ContextData } from "../shared/types.ts";
import type { WalkMap } from "../shared/walkmap.ts";
import { cellOf, type WalkGrid } from "../shared/walkpath.ts";
import type { Move } from "./figureMoves.ts";
import { dodgeWay } from "../shared/locomotion.ts";
import { Debris, Puffs, Shocks, Slash, Sparks } from "./gameFx.ts";
import { GameOverlay } from "./gameOverlay.ts";
import { OpenWorldScene, type OpenWorldHuman, type OpenWorldPickup, type OpenWorldSpot, type OpenWorldVehicle } from "./openWorldScene.ts";
import type { LabelSpec } from "./labels.ts";
import { GROUND_PAINT, type WalkerState } from "./walkers.ts";
import type { GtaHudView, GtaPhoneCmd, GtaPhoneJob, GtaRadarBlip, GtaRadarBuilding, GtaRadarRoad } from "../ui/GameRadar.tsx";

/** What the scene lends the game. */
export interface GameSceneHost {
  groundAt(x: number, y: number): number;
  walkMap(): WalkMap | undefined;
  roofs(): RoofMap | undefined;
  buildings(): readonly Building[];
  walker(name: string): WalkerState | undefined;
  shove(name: string, dx: number, dy: number): void;
  face(name: string, bearing: number): void;
  paceScale(name: string, k: number): void;
  camera(): Camera;
  viewSize(): { width: number; height: number };
  act(name: string, move: Move | undefined, opts?: { dir?: number; rate?: number }): void;
  strafe(name: string, at: Pt | undefined): void;
  intent(name: string): number | undefined;
  jump(name: string): boolean;
  jumpable(name: string, can: boolean): void;
  pen(name: string, on: boolean): void;
  ring?(name: string, on: boolean): void;
  bodyVisible?(name: string, on: boolean): void;
  scooterPose?(name: string, on: boolean, speed: number, turnRate: number, dt: number): void;
  context?(): ContextData | undefined;
  lite?(): boolean;
  drivePose?(name: string, at: Pt, heading: number): void;
  teleport(name: string, at: Pt, heading: number): void;
}

/** Localized strings and formatters provided by app/game.ts. */
export interface GameWords {
  foes: Record<FoeKind, string>;
  place(b: Building): string;
  open: string;
  compass: readonly string[];
  metres(m: number): string;
  pizzaTake?: string;
  promptText?(action: string, label?: string): string;
  vehicleName?(kind: VehicleKind): string;
  radioInfo?(station: number): { id: string; name: string; genre?: string; off?: boolean };
  objectiveText?(active: ActiveJob | undefined, hasNextStory: boolean, nextJob?: { id: string; giver?: string; placeName?: string }): string | undefined;
  subtitleText?(speaker: string, key: string): string;
  statLabel?(key: string): string;
  zoneName?: string;
}

export type GameAction = "strike" | "heavy" | "dodge" | "card" | "eureka";

/** Legacy fight camera focus type preserved for CampusScene compatibility. */
export interface FightFocus {
  at: [number, number];
  foot: number;
  top: number;
  half: number;
  body: number;
  lane?: number;
  laneEnd: [number, number];
  passIn: number;
  hard: boolean;
}

/** What the panel shows of a game, ten times a second. */
export interface GameView {
  phase: "play" | "over";
  paused?: "indoor" | "fly" | "map";
  focus: number;
  maxFocus: number;
  stamina: number;
  maxStamina: number;
  xp: number;
  rank: number;
  rankXp: number;
  nextXp?: number;
  insight: number;
  crit: number;
  eureka: number;
  skills: { id: SkillId; open: boolean; rank: number; ready: number }[];
  quests: { id: string; key: QuestKey; main: boolean; place?: string; need: number; got: number; metres?: number; bearing?: number }[];
  boss?: { hp: number; max: number; phase: number };
  threat: { near: number; ddl: boolean };
  chain: number;
  slowed: boolean;
  locked: boolean;
  seconds: number;
  defeated: number;
  met: FoeKind[];
  lesson?: Lesson;
  taught: Lesson[];
  deaths: number;
  retry?: { quest: QuestKey; boss: boolean };
  events: GameEvent[];
  debrief?: Debrief;
  gta: GtaHudView;
}

const OVER_SETTLE = 5;
const FIELD = 320;
const FIELD_KEEP = 140;
const CLOSE_ITEMS = 12;
const CLOSE_REACH = 75;
const DRAW_HALF = 140;
const ITEM_UP = 0.55;
const ARENA_REACH = 75;
const ARENA_TRIES = 8;
const NEAR_RINGS = 30;
const ACCENT = 0xffb454;
const OPEN_BEHIND = 8;
const OPEN_AHEAD = 20;
const CRAMPED = 2.5;
const START_REACH = 16;
const START_ROOM = 6;
const BIG_FROM_REACH = 22;
const BIG_FROM_ROOM = 8;
const BIG_FROM_GAP = 25;
const SHOULDER_HOLD = 0.3;
const DUST = 0xcdc3ad;

const SPEAKER_COLOR_INDEX: Record<string, number> = {
  Maya: 0,
  Sam: 1,
  Tane: 2,
  "Slice Co.": 5,
  "Campus Security": 6,
};

function mapHumanState(state: HumanNpc["state"]): string {
  if (state === "windup") return "tell";
  return state;
}

function isPickupKind(kind: ItemKind): kind is PickupKind {
  return kind === "pizza" || kind === "cash" || kind === "coffee" || kind === "package";
}

function humanBlipKind(h: HumanNpc): GtaRadarBlip["kind"] {
  if (h.role === "security") return "security";
  if (h.isMissionTarget) return "objective";
  if (h.role === "freeRider" || h.role === "debateRival" || h.role === "allNighter") return "rival";
  if (h.role === "giver") return "mission";
  return "pedestrian";
}

function vehicleStateOf(hp: number): "ok" | "smoking" | "wrecked" {
  if (hp <= 20) return "wrecked";
  if (hp <= 55) return "smoking";
  return "ok";
}

function formatGear(v: CampusVehicle): string {
  if (v.kind === "mecha") {
    if (v.flying) return Math.abs(v.speed) >= 24 ? `MACH · ${Math.round(v.altitude)}m` : `HOVER · ${Math.round(v.altitude)}m`;
    return v.altitude > 0.5 ? `ROOF · ${Math.round(v.altitude)}m` : "WALK";
  }
  if (v.kind === "scooter") return "E";
  if (v.speed < -0.5) return "R";
  if (Math.abs(v.speed) < 0.4) return "N";
  return String(Math.max(1, v.gear));
}

/**
 * Open-campus Study Quest world: owns `StudyQuest`, `OpenWorldScene`, lightweight sparks/dust/slash FX,
 * driving seat synchronization, and the Harbour-Night `GtaHudView` projection.
 */
export class GameWorld {
  readonly group = new Group();
  menuPaused = false;
  reducedMotion = false;
  mapView = false;
  labelsVersion = 0;

  onEvent?: (e: GameEvent) => void;
  onStep?: (run: boolean) => void;
  onJump?: (what: "jump" | "land" | "landHard") => void;
  onPhoneCmd?: (cmd: GtaPhoneCmd) => void;

  private quest?: StudyQuest;
  private name = "";
  private words?: GameWords;
  quiet = false;
  private events: GameEvent[] = [];
  private seconds = 0;
  private trauma = 0;
  paused?: "indoor" | "fly" | "map";
  private overFor = 0;
  private stillDrawn = false;
  private feet = -1;
  private jumps = -1;
  private landings = -1;
  private bodyHidden = false;
  private onScooter = false;
  private lastScooterHeading?: number;
  private lastCash = 0;
  private cashDelta = 0;
  private cashDeltaKey = 0;
  private cashDeltaT = 0;
  private radioKey = 0;
  private lastZone = "";
  private lastStreet = "";
  private placeShowKey = 0;
  private activeSub?: { who: string; text: string; colorIdx: number; left: number };

  private field?: {
    grid: WalkGrid;
    reached: Uint8Array;
    free: Uint8Array;
    homes: Pt[][];
    draws: { b: Building; center: Pt; weight: number }[];
    centre: Pt;
  };
  private meAt: Pt = [0, 0];
  private camYaw = 0;
  private drivingCtrl: VehicleControlInput = { throttle: 0, brake: 0, steer: 0, handbrake: false, horn: false };

  private openWorldScene: OpenWorldScene;
  private sparks = new Sparks();
  private slash = new Slash();
  private debris = new Debris();
  private puffs = new Puffs();
  private shocks = new Shocks();
  private nudge = { side: 0, push: 0, strikeT: 0 };
  private slashDue?: { t: number; combo: number; dir: number };
  private trailT = 0;
  private overlay?: GameOverlay;
  private motionApplied?: boolean;

  constructor(
    private host: GameSceneHost,
    overlayParent?: HTMLElement,
  ) {
    const isLite = !!host.lite?.();
    this.openWorldScene = new OpenWorldScene(!isLite, isLite);
    this.group.userData.noPick = true;
    this.group.visible = false;
    this.group.add(this.openWorldScene.group, this.sparks.mesh, this.slash.group, this.debris.group, this.puffs.mesh, this.shocks.mesh);
    this.group.traverse((o) => {
      const m = (o as InstancedMesh).material as Material | undefined;
      if ((o as InstancedMesh).isMesh && m?.transparent) o.userData.noAO = true;
    });
    if (overlayParent) this.overlay = new GameOverlay(overlayParent);
  }

  get on(): boolean {
    return !!this.quest;
  }

  get player(): string {
    return this.name;
  }

  get walkerName(): string {
    return this.name;
  }

  /** Whether the player is currently riding or driving any Study Quest vehicle. */
  inVehicle(): boolean {
    return !!this.quest?.vehicles.current;
  }

  /** Whether the player is currently inside the Mark-IV Exo-Suit ("mecha"). */
  inMecha(): boolean {
    return this.quest?.vehicles.current?.kind === "mecha";
  }

  /** Whether the player is inside an enclosed vehicle or Exo-Suit (hides player body, widens chase camera). */
  enclosedVehicle(): boolean {
    const v = this.quest?.vehicles.current;
    return !!v && v.kind !== "scooter";
  }

  /** Whether the player's current vehicle is rolling or flying fast enough for camera follow-behind swing. */
  vehicleMoving(): boolean {
    const v = this.quest?.vehicles.current;
    return !!v && (Math.abs(v.speed) > 0.6 || (v.kind === "mecha" && (v.flying || Math.abs(v.vy) > 0.4)));
  }

  /** Returns follow camera distance, target lift, and aerial flight flag for the current enclosed vehicle. */
  vehicleCamera(): { distance: number; lift: number; flying?: boolean } | undefined {
    const cur = this.quest?.vehicles.current;
    const k = cur?.kind;
    if (!k || k === "scooter") return undefined;
    if (k === "mecha") {
      const alt = cur.altitude ?? 0;
      const flying = cur.flying || alt > 0.5;
      return {
        distance: flying ? 8.0 + Math.min(2.6, Math.abs(cur.speed) * 0.06) : 6.4,
        lift: 0.65 + alt,
        flying,
      };
    }
    if (k === "bus") return { distance: 13.2, lift: 0.95 };
    if (k === "van") return { distance: 9.2, lift: 0.55 };
    if (k === "pickup") return { distance: 8.6, lift: 0.28 };
    if (k === "suv" || k === "minivan") return { distance: 8.2, lift: 0.2 };
    if (k === "sports") return { distance: 7.2, lift: -0.05 };
    return { distance: 7.6, lift: 0.05 };
  }

  /** Updates live driving inputs forwarded from keyboard/touch controls. */
  setDrivingControl(ctrl: Partial<VehicleControlInput>): void {
    Object.assign(this.drivingCtrl, ctrl);
  }

  start(name: string, words: GameWords, quiet = false, compact = false, seen: readonly string[] = []): boolean {
    this.stop();
    this.quiet = quiet;
    const walker = this.host.walker(name);
    if (!walker || !this.host.walkMap()) return false;
    this.name = name;
    this.words = words;
    this.field = undefined;
    this.events = [];
    this.seconds = 0;
    this.trauma = 0;
    this.overFor = 0;
    this.stillDrawn = false;
    this.menuPaused = false;
    this.bodyHidden = false;
    this.onScooter = false;
    this.lastScooterHeading = undefined;
    this.cashDelta = 0;
    this.cashDeltaT = 0;
    this.cashDeltaKey = 0;
    this.radioKey = 0;
    this.activeSub = undefined;
    this.drivingCtrl = { throttle: 0, brake: 0, steer: 0, handbrake: false, horn: false };

    let at: Pt = [walker.at[0], walker.at[1]];
    if (this.cramped(at)) {
      const f = this.fieldAt(at);
      const open = f ? openSpot(f.grid, f.reached, at, START_REACH, START_ROOM, at, Math.random, 60, 0) : undefined;
      if (open) at = open;
    }
    const heading = this.openHeading(at, walker.heading);
    if (at[0] !== walker.at[0] || at[1] !== walker.at[1]) this.host.teleport(name, at, heading);
    else if (heading !== walker.heading) this.host.face(name, heading);
    this.meAt = [at[0], at[1]];

    const roads = this.host.context?.()?.roads;
    this.quest = new StudyQuest(
      {
        spot: (near, taken, place) => this.spot(near, taken, place),
        place: (near, avoid, big) => this.place(near, avoid, big),
        campusAnchor: (near, avoid, minDist, maxDist, minGap) => this.campusAnchor(near, avoid, minDist, maxDist, minGap),
        near: (p) => {
          const f = this.fieldAt(this.meAt);
          return f ? nearestReached(f.grid, f.free, p, NEAR_RINGS) : undefined;
        },
        ground: (p) => this.onGround(p),
        free: (p) => this.onGround(p, true),
        roofTopAboveGround: (p) => {
          const r = this.host.roofs()?.at(p);
          return r === undefined ? undefined : Math.max(0, r - this.surfaceAt(p[0], p[1]));
        },
        open: (centre, away) => {
          const f = this.fieldAt(this.meAt);
          if (!f) return undefined;
          const far = Math.hypot(centre[0] - away[0], centre[1] - away[1]);
          return (
            openSpot(f.grid, f.free, centre, BIG_FROM_REACH, BIG_FROM_ROOM, away, Math.random, 60, BIG_FROM_GAP) ??
            openSpot(f.grid, f.free, away, far, BIG_FROM_ROOM, away, Math.random, 120, BIG_FROM_GAP)
          );
        },
        random: Math.random,
        roads,
      },
      at,
      heading,
      seen,
    );
    this.lastCash = this.quest.cash;
    this.motionApplied = undefined;
    this.group.visible = true;
    this.overlay?.setWords(words.compass, words.metres);
    this.overlay?.show(true);
    this.overlay?.root.classList.toggle("compact", compact);
    this.host.pen(name, false);
    this.host.ring?.(name, false);
    this.host.bodyVisible?.(name, true);
    this.host.scooterPose?.(name, false, 0, 0, 0);
    this.host.act(name, undefined);
    this.slashDue = undefined;
    this.sync(this.host.walker(name) ?? walker, 0);
    this.labelsVersion++;
    return true;
  }

  private cramped(at: Pt): boolean {
    const map = this.host.walkMap();
    if (!map) return false;
    for (let deg = 0; deg < 360; deg += 45) {
      const r = (deg * Math.PI) / 180;
      if (map.wallAlong(at, [at[0] + Math.sin(r) * CRAMPED, at[1] + Math.cos(r) * CRAMPED]) !== undefined) return true;
    }
    return false;
  }

  private openHeading(at: Pt, heading: number): number {
    const map = this.host.walkMap();
    if (!map) return heading;
    const clear = (deg: number) => {
      const r = (deg * Math.PI) / 180;
      const line = (m: number) => map.wallAlong(at, [at[0] + Math.sin(r) * m, at[1] + Math.cos(r) * m]) ?? 1;
      const r2 = r + Math.PI / 2;
      const side = (k: number) => map.wallAlong(at, [at[0] + Math.sin(r2) * k * 4, at[1] + Math.cos(r2) * k * 4]) ?? 1;
      return (map.wallAlong(at, [at[0] - Math.sin(r) * OPEN_BEHIND, at[1] - Math.cos(r) * OPEN_BEHIND]) ?? 1) * 2 + line(OPEN_AHEAD) + 0.25 * (side(1) + side(-1));
    };
    if (clear(heading) >= 3.5 - 1e-6) return heading;
    let best = heading;
    let score = clear(heading);
    for (let k = 1; k <= 12; k++) {
      for (const side of [1, -1]) {
        const deg = (((heading + side * k * 15) % 360) + 360) % 360;
        const sc = clear(deg);
        if (sc > score + 1e-6) (score = sc), (best = deg);
      }
    }
    return best;
  }

  stop(): void {
    if (!this.quest) return;
    this.host.paceScale(this.name, 1);
    this.host.strafe(this.name, undefined);
    this.host.pen(this.name, false);
    this.host.ring?.(this.name, true);
    this.host.bodyVisible?.(this.name, true);
    this.host.scooterPose?.(this.name, false, 0, 0, 0);
    this.host.act(this.name, undefined);
    this.quest = undefined;
    this.field = undefined;
    this.bodyHidden = false;
    this.onScooter = false;
    this.lastScooterHeading = undefined;
    this.group.visible = false;
    this.sparks.clear();
    this.debris.clear();
    this.puffs.clear();
    this.shocks.clear();
    this.openWorldScene.sync({
      t: 0,
      dt: 0,
      viewerAt: this.meAt,
      groundAt: () => 0,
      humans: [],
      vehicles: [],
      pickups: [],
      spots: [],
    });
    this.nudge.side = this.nudge.push = this.nudge.strikeT = 0;
    this.overlay?.show(false);
    this.labelsVersion++;
  }

  retry(): boolean {
    const g = this.quest;
    if (!g) return false;
    const evs = g.retry();
    const r = evs.find((e) => e.type === "retry");
    if (!r || r.type !== "retry") return false;
    this.bodyHidden = false;
    this.onScooter = false;
    this.lastScooterHeading = undefined;
    this.host.bodyVisible?.(this.name, true);
    this.host.scooterPose?.(this.name, false, 0, 0, 0);
    this.host.teleport(this.name, r.at, r.heading);
    this.host.act(this.name, undefined);
    this.host.paceScale(this.name, 1);
    this.trauma = 0;
    this.overFor = 0;
    this.stillDrawn = false;
    this.slashDue = undefined;
    this.nudge.side = this.nudge.push = this.nudge.strikeT = 0;
    const me = this.host.walker(this.name);
    if (me) {
      this.meAt = [me.at[0], me.at[1]];
      for (const e of evs) this.effect(e, me);
    }
    this.events.push(...evs);
    return true;
  }

  act(a: GameAction): boolean {
    if (!this.quest || this.menuPaused || this.paused) return false;
    if (this.inVehicle() && !this.inMecha()) return false;
    return this.quest.act(a);
  }

  jump(): boolean {
    if (!this.quest || this.menuPaused || this.paused || this.quest.phase !== "play" || this.inVehicle()) return false;
    return this.host.jump(this.name);
  }

  toggleLock(): void {
    if (this.quest && !this.menuPaused) this.quest.toggleLock();
  }

  interact(): boolean {
    if (!this.quest || this.menuPaused || this.paused) return false;
    return this.quest.interact();
  }

  eatSlice(): boolean {
    if (!this.quest || this.menuPaused || this.paused || this.quest.phase !== "play") return false;
    return this.quest.eatSlice();
  }

  toggleVehicle(): boolean {
    if (!this.quest || this.menuPaused || this.paused || this.quest.phase !== "play") return false;
    return this.quest.toggleVehicle();
  }

  cycleRadio(): number {
    if (!this.quest || this.menuPaused || this.paused) return 0;
    this.radioKey++;
    return this.quest.cycleRadio();
  }

  switchWeapon(): "fists" | "textbook" {
    if (!this.quest || this.menuPaused || this.paused) return "fists";
    return this.quest.switchWeapon();
  }

  phoneAction(cmd: GtaPhoneCmd): boolean {
    if (!this.quest || this.quest.phase !== "play") return false;
    const ok = this.quest.phoneAction(cmd);
    if (ok) this.onPhoneCmd?.(cmd);
    return ok;
  }

  shake(out: Vector3): Vector3 {
    out.set(0, 0, 0);
    if (!this.quest || this.reducedMotion || this.trauma <= 0) return out;
    const k = this.trauma * this.trauma * 0.35;
    const t = this.seconds * 60;
    return out.set(Math.sin(t * 1.3) * k, Math.sin(t * 1.7 + 1) * k * 0.7, Math.sin(t * 1.1 + 2) * k);
  }

  cameraNudge(): { side: number; push: number } {
    return this.nudge;
  }

  fightFocus(): FightFocus | undefined {
    return undefined;
  }

  view(): GameView | undefined {
    const g = this.quest;
    const walker = this.host.walker(this.name);
    if (!g || !walker) return undefined;
    const events = this.events;
    this.events = [];
    const s = g.stats;
    const cooldown: Record<SkillId, number> = {
      strike: 1 - g.strikeT / 0.42,
      dodge: g.stamina >= PLAYER.dodgeCost ? 1 : g.stamina / PLAYER.dodgeCost,
      flashcard: g.stamina >= PLAYER.cardCost ? 1 - g.cardT / PLAYER.cardCooldown : g.stamina / PLAYER.cardCost,
      sprint: g.stamina >= PLAYER.dodgeCost ? 1 : g.stamina / PLAYER.dodgeCost,
      eureka: g.eurekaMeter / PLAYER.eurekaCharge,
    };
    const over = g.phase === "over";
    const nearHostiles = g.openWorld.humans.filter((h) => h.state !== "down" && h.state !== "dead" && (h.role === "security" || h.role === "freeRider" || h.role === "debateRival" || h.role === "allNighter") && Math.hypot(h.at[0] - walker.at[0], h.at[1] - walker.at[1]) <= 24).length;

    return {
      phase: over ? "over" : "play",
      paused: g.phase === "play" ? this.paused : undefined,
      focus: g.focus,
      maxFocus: s.maxFocus,
      stamina: g.stamina,
      maxStamina: s.maxStamina,
      xp: g.xp,
      rank: g.rank,
      rankXp: RANKS[g.rank]!.xp,
      nextXp: RANKS[g.rank + 1]?.xp,
      insight: s.insight,
      crit: s.crit,
      eureka: g.eurekaMeter / PLAYER.eurekaCharge,
      skills: SKILLS.map((k) => ({ id: k.id, open: g.rank >= k.rank, rank: k.rank, ready: Math.max(0, Math.min(1, cooldown[k.id])) })),
      quests: [],
      threat: { near: nearHostiles + g.wanted, ddl: g.wanted >= 3 },
      chain: g.hits,
      slowed: g.slowT > 0,
      locked: g.lock !== undefined,
      seconds: g.seconds,
      defeated: g.rivalsBeat,
      met: [...g.met],
      lesson: g.phase === "play" && !this.paused ? g.lesson : undefined,
      taught: [...g.taught],
      deaths: g.deaths,
      retry: over && !g.victory ? { quest: "orientation", boss: false } : undefined,
      events,
      debrief: over ? g.debrief() : undefined,
      gta: this.buildGtaHud(g, walker),
    };
  }

  private buildGtaHud(g: StudyQuest, walker: WalkerState): GtaHudView {
    const [wx, wy] = walker.at;
    const buildings: GtaRadarBuilding[] = [];
    let nearestBuildingName = "";
    let nearestBuildingD = 32;
    for (const b of this.host.buildings()) {
      if (buildings.length >= 44) break;
      if (b.offMap) continue;
      const dCenter = Math.hypot(b.center[0] - wx, b.center[1] - wy);
      if (dCenter < nearestBuildingD) {
        const named = this.words?.place(b);
        if (named) {
          nearestBuildingD = dCenter;
          nearestBuildingName = named;
        }
      }
      if (dCenter > 175) continue;
      const raw = b.outline[0];
      if (!raw || raw.length < 6) continue;
      const ring = decodeRing(raw);
      const pts: [number, number][] = [];
      let near = false;
      for (const p of ring) {
        const dx = p[0] - wx;
        const dy = p[1] - wy;
        if (Math.abs(dx) <= 130 && Math.abs(dy) <= 130) near = true;
        pts.push([dx, dy]);
      }
      if (near && pts.length >= 3) buildings.push({ pts });
    }
    const ctx = this.host.context?.();
    if (ctx?.buildings) {
      for (const cb of ctx.buildings) {
        if (buildings.length >= 64) break;
        if (cb.p.length < 6) continue;
        const ring = decodeRing(cb.p);
        const pts: [number, number][] = [];
        let near = false;
        for (const p of ring) {
          const dx = p[0] - wx;
          const dy = p[1] - wy;
          if (Math.abs(dx) <= 130 && Math.abs(dy) <= 130) near = true;
          pts.push([dx, dy]);
        }
        if (near && pts.length >= 3) buildings.push({ pts });
      }
    }

    const roads: GtaRadarRoad[] = [];
    for (const r of g.vehicles.roads) {
      if (roads.length >= 56) break;
      const pts: [number, number][] = [];
      let near = false;
      for (const p of r.pts) {
        const dx = p[0] - wx;
        const dy = p[1] - wy;
        if (Math.abs(dx) <= 155 && Math.abs(dy) <= 155) near = true;
        pts.push([dx, dy]);
      }
      if (near && pts.length >= 2) {
        roads.push({ pts, major: r.kind === "motorway" || r.kind === "major" });
      }
    }

    const gpsRoute = g.gpsRoute?.map(([x, y]) => [x - wx, y - wy] as const);

    const blips: GtaRadarBlip[] = [];
    const objPt = g.openWorld.currentObjectivePoint() ?? g.gpsTarget;
    if (objPt) {
      blips.push({
        x: objPt[0] - wx,
        y: objPt[1] - wy,
        kind: g.openWorld.active?.stage === "checkpoints" ? "checkpoint" : "objective",
        pulse: true,
      });
    }
    for (const s of g.openWorld.spots) {
      const done = s.kind === "jobGiver" && s.missionId && g.openWorld.completedJobs.has(s.missionId as JobId);
      if (done) continue;
      blips.push({
        x: s.at[0] - wx,
        y: s.at[1] - wy,
        kind: s.kind === "pizzaVan" ? "cart" : s.kind === "jobGiver" ? "mission" : "activity",
        label: s.giver ? s.giver[0] : undefined,
        short: !!s.giver,
      });
    }
    for (const v of g.vehicles.vehicles) {
      if (v.id === g.vehicles.playerVehicleId) continue;
      const dx = v.at[0] - wx;
      const dy = v.at[1] - wy;
      if (dx * dx + dy * dy > 140 * 140) continue;
      blips.push({
        x: dx,
        y: dy,
        kind: v.kind === "mecha" ? "mecha" : v.kind === "scooter" ? "scooter" : v.isPolice && v.siren ? "security" : "vehicle",
      });
    }
    let pedBlips = 0;
    for (const h of g.openWorld.humans) {
      if (h.state === "down" || h.state === "dead") continue;
      const dx = h.at[0] - wx;
      const dy = h.at[1] - wy;
      if (dx * dx + dy * dy > 115 * 115) continue;
      const kind = humanBlipKind(h);
      if (kind === "pedestrian") {
        if (pedBlips >= 20) continue;
        pedBlips++;
      }
      blips.push({ x: dx, y: dy, kind, pulse: h.isMissionTarget });
    }
    for (const it of g.items) {
      if (!isPickupKind(it.kind)) continue;
      const dx = it.at[0] - wx;
      const dy = it.at[1] - wy;
      if (dx * dx + dy * dy > 130 * 130) continue;
      blips.push({ x: dx, y: dy, kind: it.kind === "pizza" ? "pizza" : "pickup" });
    }

    const active = g.openWorld.active;
    const rawPrompt = g.currentPrompt();
    const prompt = rawPrompt
      ? {
          key: rawPrompt.key,
          action: rawPrompt.action,
          text: this.words?.promptText?.(rawPrompt.action, rawPrompt.label) ?? rawPrompt.action,
        }
      : undefined;

    const tel = g.vehicles.telemetry();
    const curVeh = g.vehicles.current;
    const vehicle =
      tel && curVeh
        ? {
            kind: tel.kind,
            name: this.words?.vehicleName?.(tel.kind) ?? tel.kind,
            kmh: tel.kmh,
            gear: formatGear(curVeh),
            rpm: tel.rpm,
            health: curVeh.hp / Math.max(1, curVeh.maxHp),
            state: vehicleStateOf(tel.hp),
          }
        : undefined;

    const zone = this.words?.zoneName ?? "";
    const street = nearestBuildingName;
    if (zone !== this.lastZone || street !== this.lastStreet) {
      this.lastZone = zone;
      this.lastStreet = street;
      this.placeShowKey++;
    }

    const radioInfo = this.words?.radioInfo?.(g.radioStation);
    const jobs: GtaPhoneJob[] = [
      ...STORY_JOBS.map((j) => {
        const done = g.openWorld.completedJobs.has(j.id);
        const isActive = active?.id === j.id;
        const unlocked = !j.requires || g.openWorld.completedJobs.has(j.requires);
        return {
          id: j.id,
          kind: "story" as const,
          titleKey: `game.jobs.${j.id}.title`,
          giver: j.giver,
          blurbKey: `game.jobs.${j.id}.blurb`,
          status: (isActive ? "active" : done ? "done" : unlocked ? "available" : "locked") as GtaPhoneJob["status"],
          rewardCash: j.cash,
        };
      }),
      ...SIDE_HUSTLES.map((h) => {
        const isActive = active?.id === h.id;
        return {
          id: h.id,
          kind: "side" as const,
          titleKey: `game.jobs.${h.id}.title`,
          blurbKey: `game.jobs.${h.id}.blurb`,
          status: (isActive ? "active" : "available") as GtaPhoneJob["status"],
          rewardCash: h.cash,
          bestTime: g.openWorld.hustleBest[h.id],
        };
      }),
    ];

    const nextStory = jobs.find((j) => j.kind === "story" && j.status === "available");
    const nextSpot = nextStory ? g.openWorld.spots.find((s) => s.missionId === nextStory.id) : undefined;
    const hasNextStory = !!nextStory;
    const objective = this.words?.objectiveText?.(
      active,
      hasNextStory,
      nextStory ? { id: nextStory.id, giver: nextStory.giver, placeName: nextSpot?.placeName } : undefined,
    );
    const secWait = g.openWorld.humans.some((h) => h.role === "security" && h.state !== "down" && h.state !== "dead" && Math.hypot(h.at[0] - wx, h.at[1] - wy) < 3.6);
    const arrestProgress = g.wanted > 0 && secWait ? 0.55 : 0;

    return {
      health: g.focus,
      maxHealth: g.stats.maxFocus,
      armour: g.energy,
      maxArmour: 100,
      stamina: g.stamina,
      maxStamina: g.stats.maxStamina,
      wanted: g.wanted,
      wantedMax: 5,
      evading: g.wanted > 0 && g.evadeT > 0,
      arrestProgress,
      cash: g.cash,
      cashDelta: this.cashDeltaT > 0 ? this.cashDelta : undefined,
      cashDeltaKey: this.cashDeltaKey,
      weapon: g.weapon,
      hasTextbook: true,
      pizzaSlices: g.slices,
      pizzaBuffSec: g.pizzaBuff,
      yaw: this.camYaw,
      playerHeading: curVeh ? curVeh.heading : walker.heading,
      buildings,
      roads,
      gpsRoute,
      blips,
      timer: active?.timer !== undefined ? { seconds: active.timer, urgent: active.timer <= 15 } : undefined,
      radio: radioInfo ? { ...radioInfo, key: this.radioKey } : undefined,
      prompt,
      subtitle: this.activeSub ? { who: this.activeSub.who, text: this.activeSub.text, colorIdx: this.activeSub.colorIdx } : undefined,
      objective,
      place: zone || street ? { zone, street, showKey: this.placeShowKey } : undefined,
      vehicle,
      phoneUnread: g.openWorld.unreadPhone,
      jobs,
      stats: [
        { label: this.words?.statLabel?.("cash") ?? "Cash", value: `$${Math.round(g.cash)}` },
        { label: this.words?.statLabel?.("wanted") ?? "Wanted", value: String(g.wanted) },
        { label: this.words?.statLabel?.("slices") ?? "Slices", value: String(g.slices) },
      ],
      onPhoneAction: (cmd) => this.phoneAction(cmd),
    };
  }

  /** Rich inspection state for unit and e2e tests. */
  state() {
    const g = this.quest;
    if (!g) return undefined;
    const cur = g.vehicles.current;
    return {
      phase: g.phase,
      books: [] as Pt[],
      pizzas: g.items.filter((i) => i.kind === "pizza").map((i) => i.at),
      items: g.items.map((i) => ({ kind: i.kind, at: i.at, quest: i.quest, dropped: i.dropped })),
      foes: g.openWorld.humans
        .filter((h) => h.role !== "pedestrian" && h.role !== "giver")
        .map((h) => ({ id: h.id, kind: h.role, at: h.at, hp: h.hp, state: h.state })),
      quests: [] as { key: QuestKey; need: number; got: number; place?: Place }[],
      focus: g.focus,
      energy: g.energy,
      slices: g.slices,
      weapon: g.weapon,
      xp: g.xp,
      rank: g.rank,
      main: g.mainStep,
      victory: g.victory,
      cash: g.cash,
      cred: g.cred,
      wanted: g.wanted,
      heat: g.heat,
      busted: g.busted,
      pizzaBuff: g.pizzaBuff,
      pizzasEaten: g.pizzasEaten,
      kmDriven: g.kmDriven,
      rivalsBeat: g.rivalsBeat,
      radioStation: g.radioStation,
      gpsRoute: g.gpsRoute ?? [],
      inVehicle: cur ? { id: cur.id, kind: cur.kind, speed: cur.speed, kmh: Math.round(Math.abs(cur.speed) * 3.6), altitude: cur.altitude, flying: cur.flying } : undefined,
      vehicles: g.vehicles.vehicles.map((v) => ({ id: v.id, kind: v.kind, at: v.at, speed: v.speed, driver: v.driver, hp: v.hp, rollVel: v.rollVel, pitchVel: v.pitchVel, altitude: v.altitude, flying: v.flying })),
      humans: g.openWorld.humans.map((h) => ({ id: h.id, role: h.role, name: h.name, at: h.at, hp: h.hp, state: h.state, target: h.isMissionTarget })),
      props: g.openWorld.props.map((p) => ({ id: p.id, kind: p.kind, at: p.at, tilt: p.tilt, vx: p.vx, vz: p.vz })),
      openWorld: {
        spots: g.openWorld.spots.map((s) => ({ id: s.id, kind: s.kind, missionId: s.missionId, at: s.at, cooldown: s.cooldown })),
        active: g.openWorld.active
          ? { id: g.openWorld.active.id, stage: g.openWorld.active.stage, got: g.openWorld.active.got, need: g.openWorld.active.need, timer: g.openWorld.active.timer }
          : undefined,
        completedJobs: [...g.openWorld.completedJobs],
        students: g.openWorld.humans.length,
      },
    };
  }

  labels(): LabelSpec[] {
    return [];
  }

  step(dt: number, _now?: number): boolean {
    const g = this.quest;
    if (!g) return false;
    const walker = this.host.walker(this.name);
    if (!walker) {
      this.stop();
      return true;
    }
    this.paused = walker.indoor ? "indoor" : walker.ride === "fly" ? "fly" : this.mapView ? "map" : undefined;
    const frozen = this.menuPaused || !!this.paused || g.phase !== "play";
    const gdt = this.menuPaused || this.paused ? 0 : dt;

    if (this.cashDeltaT > 0 && !frozen) this.cashDeltaT = Math.max(0, this.cashDeltaT - dt);
    if (this.activeSub && !frozen) {
      this.activeSub.left -= dt;
      if (this.activeSub.left <= 0) this.activeSub = undefined;
    }

    const drivingBefore = g.vehicles.current;
    const evs = g.step(
      gdt,
      {
        at: walker.at,
        heading: walker.heading,
        move: drivingBefore ? undefined : this.host.intent(this.name),
        air: walker.air ?? 0,
        active: !frozen,
        pace: walker.ride === "scooter" ? QUEST.scooterPace : 1,
      },
      drivingBefore ? this.drivingCtrl : undefined,
    );

    if (g.cash !== this.lastCash) {
      const diff = g.cash - this.lastCash;
      this.lastCash = g.cash;
      if (diff !== 0) {
        this.cashDelta = diff;
        this.cashDeltaT = 2.4;
        this.cashDeltaKey++;
      }
    }

    const drivingNow = g.vehicles.current;
    const enclosed = !!drivingNow && drivingNow.kind !== "scooter";
    if (enclosed !== this.bodyHidden) {
      this.bodyHidden = enclosed;
      this.host.bodyVisible?.(this.name, !enclosed);
    }

    const ridingScooter = !!drivingNow && drivingNow.kind === "scooter";
    if (ridingScooter) {
      const turnRate =
        this.lastScooterHeading !== undefined && gdt > 1e-4
          ? Math.max(-180, Math.min(180, turnBetween(this.lastScooterHeading, drivingNow.heading) / gdt))
          : 0;
      this.lastScooterHeading = drivingNow.heading;
      this.onScooter = true;
      this.host.scooterPose?.(this.name, true, drivingNow.speed, turnRate, gdt);
    } else {
      this.lastScooterHeading = undefined;
      if (this.onScooter) {
        this.onScooter = false;
        this.host.scooterPose?.(this.name, false, 0, 0, 0);
      }
    }

    if (drivingNow) {
      if (this.host.drivePose) this.host.drivePose(this.name, drivingNow.at, drivingNow.heading);
      else this.host.teleport(this.name, drivingNow.at, drivingNow.heading);
      this.host.jumpable(this.name, false);
      this.host.strafe(this.name, undefined);
      this.host.paceScale(this.name, 1);
      if (this.drivingCtrl.handbrake && Math.abs(drivingNow.speed) > 4 && !frozen && Math.random() < dt * 16) {
        this.puffs.puff(drivingNow.at[0], this.surfaceAt(drivingNow.at[0], drivingNow.at[1]) + 0.08, -drivingNow.at[1], 1, 0.5, DUST, 0.7, 0.35);
      }
    } else {
      this.host.jumpable(this.name, g.canJump && !frozen);
      const o = g.orders;
      if (o.face !== undefined) this.host.face(this.name, o.face);
      if (o.shove[0] || o.shove[1]) this.host.shove(this.name, o.shove[0], o.shove[1]);
      this.host.paceScale(this.name, o.slow);
      this.host.strafe(this.name, undefined);
    }

    if (!frozen) this.seconds += dt;
    const me = this.host.walker(this.name) ?? walker;
    this.meAt = [me.at[0], me.at[1]];
    for (const e of evs) this.effect(e, me);

    if (!drivingNow) {
      const feet = Math.floor(me.footfalls ?? -1);
      if (feet !== this.feet && this.feet >= 0 && feet >= 0 && !frozen) this.onStep?.(me.speed > 3.2);
      const jumps = me.jumps ?? -1;
      const lands = me.landings ?? -1;
      if (jumps !== this.jumps && this.jumps >= 0 && jumps >= 0 && !frozen) this.onJump?.("jump");
      if (lands !== this.landings && this.landings >= 0 && lands >= 0 && !frozen) {
        const hard = me.hard ?? 0;
        this.onJump?.(hard > 0.5 ? "landHard" : "land");
        if (!this.reducedMotion || hard > 0.5) this.sparks.burst(me.at[0], me.height + 0.06, -me.at[1], 8 + 10 * hard, 2.2 + 2 * hard, DUST, 0.11 + 0.05 * hard, 0.42, 2.5);
        if (hard > 0.5) this.trauma = Math.min(1, this.trauma + 0.15 * hard);
      }
      this.jumps = jumps;
      this.landings = lands;
      this.feet = feet;
    }

    this.events.push(...evs);
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    this.sync(me, frozen && this.menuPaused ? 0 : dt);
    this.overFor = g.phase === "play" ? 0 : this.overFor + dt;
    const still = this.menuPaused || !!this.paused || this.overFor > OVER_SETTLE;
    const draw = !still || !this.stillDrawn || this.trauma > 0;
    this.stillDrawn = still;
    return draw;
  }

  refresh(): void {
    this.field = undefined;
  }

  dispose(): void {
    this.stop();
    this.openWorldScene.dispose();
    this.group.remove(this.openWorldScene.group);
    this.overlay?.dispose();
    this.group.traverse((o) => {
      const m = o as InstancedMesh;
      if (m.isMesh) {
        m.geometry.dispose();
        (m.material as Material).dispose();
      }
    });
  }

  // -------------------------------------------------------------------------------------------
  // Places
  // -------------------------------------------------------------------------------------------

  /** Height of the drawn campus surface (grass, paths, roads) where feet and tyres stand. */
  private surfaceAt(x: number, y: number): number {
    return this.host.groundAt(x, y) + GROUND_PAINT;
  }

  private onGround(p: Pt, free = false): boolean {
    const f = this.fieldAt(this.meAt);
    if (!f) return true;
    const [c, r] = cellOf(f.grid, p);
    return c >= 0 && r >= 0 && c < f.grid.cols && r < f.grid.rows && !!(free ? f.free : f.reached)[r * f.grid.cols + c];
  }

  private fieldAt(near: Pt): NonNullable<GameWorld["field"]> | undefined {
    const map = this.host.walkMap();
    if (!map) return undefined;
    let f = this.field;
    if (!f || Math.hypot(near[0] - f.centre[0], near[1] - f.centre[1]) > FIELD_KEEP) {
      const grid = map.grid([near[0] - FIELD, near[1] - FIELD, near[0] + FIELD, near[1] + FIELD], 2);
      const inField = (b: Building) => !b.offMap && Math.abs(b.center[0] - near[0]) < FIELD - 40 && Math.abs(b.center[1] - near[1]) < FIELD - 40;
      const all = this.host.buildings().filter(inField);
      const draws = questDraws(all, near, DRAW_HALF);
      const homes = this.host
        .buildings()
        .filter((b) => !b.offMap && isHome(b) && Math.abs(b.center[0] - near[0]) < FIELD + 60 && Math.abs(b.center[1] - near[1]) < FIELD + 60)
        .map((b) => decodeRing(b.outline[0] ?? []));
      const reached = reachable(grid, near);
      f = this.field = { grid, reached, free: awayFromHomes(grid, reached, homes), homes, draws, centre: [near[0], near[1]] };
    }
    return f;
  }

  private spot(near: Pt, taken: readonly Pt[], place?: Pt): Pt | undefined {
    const f = this.fieldAt(near);
    if (!f) return undefined;
    if (place) return bookSpot(f.grid, f.free, [{ center: place, weight: 1 }], near, taken, Math.random, undefined, QUEST.noteReach) ?? undefined;
    const close = taken.filter((t) => Math.hypot(t[0] - near[0], t[1] - near[1]) <= CLOSE_REACH).length;
    const beside = close < CLOSE_ITEMS ? bookSpot(f.grid, f.free, [], near, taken, Math.random, CLOSE_REACH) : undefined;
    return beside ?? bookSpot(f.grid, f.free, f.draws, near, taken, Math.random) ?? bookSpot(f.grid, f.free, [], near, taken, Math.random);
  }

  private place(near: Pt, avoid: readonly Pt[], big = false): Place | undefined {
    const f = this.fieldAt(near);
    if (!f || !this.words) return undefined;
    const ok = f.draws.filter((d) => {
      const far = Math.hypot(d.center[0] - near[0], d.center[1] - near[1]);
      return far >= QUEST.placeRange[0] && far <= QUEST.placeRange[1] && avoid.every((a) => Math.hypot(a[0] - d.center[0], a[1] - d.center[1]) > 60);
    });
    const pool = ok.length ? ok : f.draws;
    if (!pool.length) {
      const at = bookSpot(f.grid, f.free, [], near, [], Math.random, 160);
      return at ? { name: this.words.open, at } : undefined;
    }
    if (big) {
      const clear = awayFromHomes(f.grid, f.reached, f.homes, HOME_MARGIN + QUEST.arenaRadius);
      const byRooms = [...pool].sort((a, b) => b.b.roomCount - a.b.roomCount).slice(0, ARENA_TRIES);
      for (const c of byRooms) {
        const at = openSpot(f.grid, clear, c.center, ARENA_REACH, QUEST.arenaRadius * 0.75, near, Math.random);
        if (at) return { name: this.words.place(c.b) || this.words.open, at, building: c.b.id };
      }
    }
    const d = big ? pool.reduce((a, b) => (b.b.roomCount > a.b.roomCount ? b : a)) : pool[Math.floor(Math.random() * pool.length)]!;
    const at =
      (big ? openSpot(f.grid, f.free, d.center, ARENA_REACH, QUEST.arenaRadius * 0.75, near, Math.random) : undefined) ??
      bookSpot(f.grid, f.free, [{ center: d.center, weight: 1 }], near, [], Math.random) ??
      nearestReached(f.grid, f.free, d.center, NEAR_RINGS) ??
      d.center;
    return { name: this.words.place(d.b) || this.words.open, at, building: d.b.id };
  }

  /** Picks a reachable campus courtyard/walkway spot anchored beside a real teaching building inside the campus. */
  private campusAnchor(
    near: Pt,
    avoid: readonly Pt[],
    minDist: number,
    maxDist: number,
    minGap = 18,
  ): { name: string; at: Pt } | undefined {
    const f = this.fieldAt(this.meAt);
    if (!f || !f.draws.length) return undefined;
    const ordered = [...f.draws].sort(() => Math.random() - 0.5);
    for (const d of ordered) {
      const toBuilding = Math.hypot(d.center[0] - near[0], d.center[1] - near[1]);
      if (toBuilding > maxDist + 42) continue;
      const at =
        bookSpot(f.grid, f.free, [{ center: d.center, weight: 1 }], this.meAt, avoid, Math.random, undefined, 26) ??
        nearestReached(f.grid, f.free, d.center, 14);
      if (!at) continue;
      if (!this.onGround(at, true)) continue;
      if (Math.hypot(at[0] - this.meAt[0], at[1] - this.meAt[1]) < OPEN_WORLD.startClearance) continue;
      const dNear = Math.hypot(at[0] - near[0], at[1] - near[1]);
      if (dNear < minDist || dNear > maxDist) continue;
      if (avoid.some((a) => Math.hypot(a[0] - at[0], a[1] - at[1]) < minGap)) continue;
      if (!f.draws.some((b) => Math.hypot(b.center[0] - at[0], b.center[1] - at[1]) <= 38)) continue;
      const name = this.words?.place(d.b) || this.words?.open || "";
      return { name, at };
    }
    return undefined;
  }

  // -------------------------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------------------------

  private effect(e: GameEvent, me: WalkerState): void {
    this.onEvent?.(e);
    const sx = me.at[0];
    const sz = -me.at[1];
    const sy = me.height;
    const o = this.overlay;

    switch (e.type) {
      case "take": {
        const h = this.surfaceAt(e.at[0], e.at[1]) + ITEM_UP;
        const colour = e.kind === "coffee" ? 0x8ff0d0 : e.kind === "cash" ? 0x5cf28c : e.kind === "pizza" ? 0xff9e44 : ACCENT;
        this.sparks.burst(e.at[0], h, -e.at[1], e.kind === "pizza" ? 16 : 10, 4, colour, 0.08, 0.5, 2.5);
        if (e.kind === "pizza") o?.number(e.at[0], h + 0.8, -e.at[1], this.words?.pizzaTake ?? `+${QUEST.pizzaFocus}`, "pizza buff");
        else if (e.kind === "cash") o?.number(e.at[0], h + 0.7, -e.at[1], `+$${e.value ?? 25}`, "cash");
        else if (e.xp) o?.number(e.at[0], h + 0.7, -e.at[1], `+${e.xp}`, "xp");
        break;
      }
      case "swing": {
        const move =
          this.quest?.weapon === "fists" || e.combo === 2
            ? (`punch${e.combo}` as Move)
            : (`strike${e.combo}` as Move);
        this.host.act(this.name, move);
        this.nudge.strikeT = SHOULDER_HOLD;
        break;
      }
      case "hitHuman": {
        this.trauma = Math.min(1, this.trauma + (e.heavy ? 0.14 : 0.05));
        break;
      }
      case "hitEnv": {
        this.trauma = Math.min(1, this.trauma + (e.heavy ? 0.1 : 0.04));
        break;
      }
      case "hurt": {
        o?.hurt(bearingTo(me.at, e.from));
        this.trauma = Math.min(1, this.trauma + Math.min(0.4, 0.1 + e.amount * 0.01));
        break;
      }
      case "dodge": {
        let way = dodgeWay(e.dir, me.heading);
        if (way !== "B") {
          this.host.face(this.name, e.dir);
          way = "F";
        }
        this.host.act(this.name, e.sprint && way === "F" ? "sprint" : (`dodge${way}` as Move));
        break;
      }
      case "drop": {
        break;
      }
      case "checkpoint": {
        const gy = this.surfaceAt(e.at[0], e.at[1]) + 0.25;
        this.shocks.fire(e.at[0], gy, -e.at[1], 3.4, 0.35, 0x4ee68a, 0.3);
        this.sparks.burst(e.at[0], gy + 0.6, -e.at[1], 14, 5, 0x4ee68a, 0.1, 0.55, 2);
        break;
      }
      case "vehicle": {
        if (e.action === "crash") {
          const spd = e.speed ?? 6;
          const floorY = this.surfaceAt(e.at[0], e.at[1]);
          const gy = floorY + 0.65;
          const hard = spd >= 8;
          this.sparks.burst(e.at[0], gy, -e.at[1], hard ? 28 : 16, hard ? 9.5 : 6.0, 0xffd06e, 0.1, 0.45, 7);
          this.sparks.burst(e.at[0], gy + 0.15, -e.at[1], hard ? 14 : 8, hard ? 7.0 : 4.5, 0xfff5dc, 0.08, 0.32, 4);
          if (!this.reducedMotion) {
            this.sparks.burst(e.at[0], gy + 0.1, -e.at[1], hard ? 10 : 5, hard ? 6.5 : 4.0, 0xff7b3b, 0.11, 0.55, 9);
            this.puffs.puff(e.at[0], gy - 0.15, -e.at[1], hard ? 7 : 4, hard ? 1.9 : 1.2, DUST, hard ? 1.25 : 0.9, 0.6);
            if (hard) this.shocks.fire(e.at[0], floorY + 0.15, -e.at[1], 3.4, 0.22, 0xffb84d, 0.25);
          }
          this.trauma = Math.min(1, this.trauma + Math.min(0.65, 0.14 + spd * 0.032));
        } else if (e.action === "callScooter") {
          const gy = this.surfaceAt(e.at[0], e.at[1]) + 0.4;
          this.sparks.burst(e.at[0], gy, -e.at[1], 12, 3.5, 0x2de2d0, 0.08, 0.45, 1.5);
        } else if (e.action === "callMecha") {
          const gy = this.surfaceAt(e.at[0], e.at[1]) + 0.3;
          this.shocks.fire(e.at[0], gy, -e.at[1], 2.8, 0.25, 0x5cf2ff, 0.28);
          this.sparks.burst(e.at[0], gy + 0.4, -e.at[1], 18, 5.2, 0x5cf2ff, 0.09, 0.45, 3);
        }
        break;
      }
      case "subtitle": {
        this.activeSub = {
          who: e.speaker,
          text: this.words?.subtitleText?.(e.speaker, e.key) ?? e.key,
          colorIdx: SPEAKER_COLOR_INDEX[e.speaker] ?? 0,
          left: e.ttl,
        };
        break;
      }
      case "over":
        if (!e.victory) this.host.act(this.name, "down");
        break;
      case "retry":
        this.sparks.burst(sx, sy + 0.9, sz, 14, 4, ACCENT, 0.09, 0.6, -1);
        break;
      default:
        break;
    }
  }

  // -------------------------------------------------------------------------------------------
  // Drawing
  // -------------------------------------------------------------------------------------------

  private sync(walker: WalkerState, dt: number): void {
    const g = this.quest!;
    this.overlay?.root.classList.toggle("menu", this.menuPaused || g.phase === "over");
    if (this.motionApplied !== this.reducedMotion) {
      this.motionApplied = this.reducedMotion;
      this.sparks.density = this.reducedMotion ? 0.4 : 1;
      this.overlay?.root.classList.toggle("rm", this.reducedMotion);
    }

    const t = performance.now() / 1000;
    const wx = walker.at[0];
    const wz = -walker.at[1];
    const wy = walker.height;

    const humans: OpenWorldHuman[] = g.openWorld.humans.map((h) => {
      const animSpeed =
        h.role === "giver" ||
        h.state === "idle" ||
        h.state === "stagger" ||
        h.state === "down" ||
        h.state === "dead" ||
        (h.role === "pedestrian" && h.waitT > 0)
          ? 0
          : h.state === "flee"
            ? 3.8
            : h.state === "circle"
              ? 1.5
              : h.speed;
      return {
        id: h.id,
        role: h.role,
        at: h.at,
        heading: h.heading,
        speed: animSpeed,
        style: h.palette,
        state: mapHumanState(h.state),
        target: h.isMissionTarget,
      };
    });

    const vehicles: OpenWorldVehicle[] = g.vehicles.vehicles
      .filter((v) => !(v.id === g.vehicles.playerVehicleId && v.kind === "scooter"))
      .map((v) => ({
        id: v.id,
        kind: v.kind,
        at: v.at,
        heading: v.heading,
        speed: v.speed,
        steer: v.steerAngle,
        colorIdx: v.colorIdx,
        braking: (v.driver === "player" && this.drivingCtrl.brake > 0.1) || (v.isTraffic && Math.abs(v.speed) < 0.8),
        siren: v.siren,
        pitch: v.pitch,
        roll: v.roll,
        heave: v.heave,
        hp: v.hp,
        maxHp: v.maxHp,
        altitude: v.altitude,
        flying: v.flying,
        thrust: v.thrust,
        attackT: v.attackT,
      }));

    // Emit rising engine-bay smoke from damaged or wrecked vehicles nearby.
    if (dt > 0 && !this.menuPaused && !this.paused && !this.reducedMotion) {
      for (const v of g.vehicles.vehicles) {
        if (v.kind === "scooter" || v.hp > 55) continue;
        if (Math.hypot(v.at[0] - wx, v.at[1] - walker.at[1]) > 90) continue;
        const rate = v.hp <= 20 ? 11 : 5;
        if (Math.random() < dt * rate) {
          const rad = (v.heading * Math.PI) / 180;
          const bx = v.at[0] + Math.sin(rad) * 1.4;
          const by = v.at[1] + Math.cos(rad) * 1.4;
          const gy = this.surfaceAt(bx, by) + 1.05;
          const smokeCol = v.hp <= 20 ? 0x2d3138 : 0x858a92;
          this.puffs.puff(bx, gy, -by, 1, 0.65, smokeCol, v.hp <= 20 ? 1.15 : 0.78, 0.65);
        }
      }
    }

    const pickups: OpenWorldPickup[] = [];
    for (const it of g.items) {
      if (!isPickupKind(it.kind)) continue;
      if (Math.hypot(it.at[0] - wx, it.at[1] - walker.at[1]) > 140) continue;
      pickups.push({ id: it.id, kind: it.kind, at: it.at });
    }

    const spots: OpenWorldSpot[] = g.openWorld.spots.map((s) => ({
      id: s.id,
      kind: s.kind === "pizzaVan" ? "pizzaCart" : "clubStand",
      at: s.at,
      heading: s.heading,
      radius: s.radius,
      cooldown: s.cooldown,
    }));

    this.openWorldScene.sync({
      t,
      dt,
      viewerAt: walker.at,
      groundAt: (x, y) => this.surfaceAt(x, y),
      humans,
      vehicles,
      pickups,
      spots,
      props: g.openWorld.props,
      checkpoint: g.openWorld.currentObjectivePoint(),
    });

    if (this.slashDue && !this.menuPaused && !this.paused) {
      this.slashDue.t -= dt;
      if (this.slashDue.t <= 0) {
        const s = this.slashDue;
        this.slashDue = undefined;
        this.slash.swing(s.combo, s.dir);
      }
    }
    this.nudge.strikeT = Math.max(0, this.nudge.strikeT - dt);
    const wantSide = this.nudge.strikeT > 0 && !this.reducedMotion ? 1 : 0;
    this.nudge.side += (wantSide - this.nudge.side) * Math.min(1, dt * 10);

    if (this.trailT > 0 && dt > 0) {
      this.trailT -= dt;
      if (!this.reducedMotion && Math.random() < dt * 28) this.sparks.one(wx, wy + 0.9, wz, 0, 0.8, 0, 0.25, 0.08, 0xffd27a, 0, 0.02);
    }

    this.sparks.step(dt);
    this.debris.step(dt);
    this.puffs.step(dt);
    this.shocks.step(dt);
    this.slash.step(dt, wx, wy, wz);

    const cam = this.host.camera();
    const { width, height } = this.host.viewSize();
    const fwd = new Vector3();
    cam.getWorldDirection(fwd);
    this.camYaw = ((Math.atan2(fwd.x, -fwd.z) * 180) / Math.PI + 360) % 360;
    this.overlay?.frame(dt, cam, width, height, this.camYaw, [], [], undefined, g.focus < g.stats.maxFocus * 0.3, g.slowT > 0);
  }
}
