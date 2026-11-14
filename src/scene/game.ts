// Study Quest on the map: the villains, the pick-ups, the blows and the warnings, drawn over the walk.
// The rules are in shared/game.ts; this draws them, and lends them the walker, the ground and the
// walking map. Everything here is made up and looks it: cartoon villains for study troubles, toy
// books and coffee with a beam of light over each. None of it is campus data, none of it stands for
// a real class, person or due date, and none of it can be picked or opened.
//
// Cost: each kind of villain is one merged geometry drawn instanced (two or three calls for a whole
// crowd), the effects are a handful of instanced meshes filled again each frame from kept arrays,
// nothing casts a shadow, and the marks over the picture are kept DOM elements moved by transform.
import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  CylinderGeometry,
  DynamicDrawUsage,
  Euler,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type Camera,
  type Material,
} from "three";
import type { Pt } from "../shared/geo.ts";
import {
  FOES,
  FOE_KINDS,
  FOE_TIME,
  PLAYER,
  QUEST,
  RANKS,
  SKILLS,
  StudyQuest,
  bearingTo,
  bookSpot,
  nearestReached,
  openSpot,
  reachable,
  type BookDraw,
  type Debrief,
  type Foe,
  type FoeKind,
  type GameEvent,
  type ItemKind,
  type Lesson,
  type Place,
  type QuestKey,
  type SkillId,
} from "../shared/game.ts";
import type { RoofMap } from "../shared/roofmap.ts";
import type { Building } from "../shared/types.ts";
import type { WalkMap } from "../shared/walkmap.ts";
import type { WalkGrid } from "../shared/walkpath.ts";
import type { Move } from "./figureMoves.ts";
import { Arena, Debris, Decals, Missiles, Puffs, Shadows, Shocks, Slash, Sparks, Telegraphs, yawOf } from "./gameFx.ts";
import { FoeMotion, newLook } from "./gameMotion.ts";
import { BossView, bossPose } from "./gameBoss.ts";
import { MODELS, bookParts, coffeeGeo, noteGeo, type Model } from "./gameModels.ts";
import { GameOverlay, type MarkIn, type PlateIn } from "./gameOverlay.ts";
import type { LabelSpec } from "./labels.ts";
import type { WalkerState } from "./walkers.ts";

/** What the scene lends the game. */
export interface GameSceneHost {
  groundAt(x: number, y: number): number;
  walkMap(): WalkMap | undefined;
  roofs(): RoofMap | undefined;
  buildings(): readonly Building[];
  walker(name: string): WalkerState | undefined;
  /** Pushes the walker over free ground; turns it to a bearing; sets the share of its pace it keeps. */
  shove(name: string, dx: number, dy: number): void;
  face(name: string, bearing: number): void;
  paceScale(name: string, k: number): void;
  camera(): Camera;
  viewSize(): { width: number; height: number };
  /** Starts a move of the walker's arms and body (figureMoves.ts), or lets go of it. */
  act(name: string, move: Move | undefined): void;
  /** Puts the highlighter in the walker's hand, or takes it away. */
  pen(name: string, on: boolean): void;
  /** Puts the walker at once at a place, facing a bearing, and the camera behind it: a retry. */
  teleport(name: string, at: Pt, heading: number): void;
}

/** The words the game shows on the map, in the visitor's language. */
export interface GameWords {
  foes: Record<FoeKind, string>;
  /** A building's name, as the map shows it. */
  place(b: Building): string;
  /** The word for a quest's place on open ground. */
  open: string;
}

export type GameAction = "strike" | "dodge" | "card" | "eureka";

/** What the camera behind the walker frames in a fight (GameWorld.fightFocus). */
export interface FightFocus {
  at: [number, number];
  foot: number;
  top: number;
  /** Metres either side of its middle. */
  half: number;
  /** Metres from its middle to the edge of its body: the camera keeps out of it. */
  body: number;
  /** The bearing a charge it shows or makes runs along, degrees; undefined when it is not charging. */
  lane?: number;
  hard: boolean;
}

/** What the panel shows of a game, ten times a second. */
export interface GameView {
  phase: "play" | "over";
  /** Why the clock is stopped: the walker is inside a building, or flying. */
  paused?: "indoor" | "fly" | "map";
  focus: number;
  maxFocus: number;
  stamina: number;
  maxStamina: number;
  xp: number;
  rank: number;
  /** Knowledge at which this rank began, and at which the next begins (undefined at the top). */
  rankXp: number;
  nextXp?: number;
  insight: number;
  crit: number;
  /** 0 to 1: the Eureka's charge. */
  eureka: number;
  skills: { id: SkillId; open: boolean; rank: number; ready: number }[];
  quests: { id: string; key: QuestKey; main: boolean; place?: string; need: number; got: number; metres?: number; bearing?: number }[];
  boss?: { hp: number; max: number; phase: number };
  /** Foes up and close enough to fight (for the music), and whether a DDL is among them. */
  threat: { near: number; ddl: boolean };
  /** Hits in a row. */
  chain: number;
  slowed: boolean;
  locked: boolean;
  seconds: number;
  defeated: number;
  /** Kinds met so far. */
  met: FoeKind[];
  /** The prompt up now, if any, and the lessons taught (kept in this browser). */
  lesson?: Lesson;
  taught: Lesson[];
  /** Times burnt out so far. */
  deaths: number;
  /** For a game lost: where a retry starts, at the start of a main quest or the boss's arena. */
  retry?: { quest: QuestKey; boss: boolean };
  events: GameEvent[];
  debrief?: Debrief;
}

/** Seconds after a game ends in which its foes' last moments and the debris are still drawn. */
const OVER_SETTLE = 5;
/** Metres: half the side of the ground the pick-ups are laid on, round the walker. */
const FIELD = 300;
const FIELD_KEEP = 140;
const CLOSE_ITEMS = 12;
const CLOSE_REACH = 75;
const DRAW_HALF = 110;
const ITEM_UP = 1.5;
/** Metres within which a foe counts as a fight, for the music. */
const THREAT_REACH = 24;
/** Metres from its building within which the last fight looks for open ground. */
const ARENA_REACH = 75;
/** The books' covers: the project's own bright colours, none a university's. */
const COVERS = [0xff5d73, 0x39c6a5, 0xffb454, 0x6c8cff, 0xc77dff];
const ACCENT = 0xffb454;
/** How many of each kind can be drawn at once. */
const CAP: Record<FoeKind, number> = { ddl: 3, procrastination: 8, distraction: 18, plagiarism: 6, anxiety: 8, exam: 1 };
/** Each kind's colour, for its sparks. */
const HUE: Record<FoeKind, number> = { ddl: 0xff3b1f, procrastination: 0xb9a6ff, distraction: 0x2fd7ff, plagiarism: 0xd9c7ff, anxiety: 0x8b5cff, exam: 0xffb347 };

const _m = new Matrix4();
const _b = new Matrix4();
const _l = new Matrix4();
const _p = new Vector3();
const _q = new Quaternion();
const _s = new Vector3();
const _e = new Euler(0, 0, 0, "YXZ");
const _c = new Color();
const _v = new Vector3();
const _r = new Matrix4();
const _tint = new Color();

/**
 * Makes a material take, for each instance, a colour that glows at its edges (`aTint`: red for a
 * warning, the boss's rage, the edges of what breaks up), a blow's flash (`aFx.y`: a white glint at
 * the edges, its form kept) and how much of it has broken up (`aFx.x`: pieces gone, the edges of the
 * gaps alight).
 */
function tinted<T extends Material>(m: T, lit: boolean): T {
  m.onBeforeCompile = (s) => {
    s.vertexShader =
      "attribute vec3 aTint;\nattribute vec2 aFx;\nvarying vec3 vTint;\nvarying vec2 vFx;\nvarying vec3 vLocal;\n" +
      s.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvTint = aTint;\nvFx = aFx;\nvLocal = position;");
    const pars = "varying vec3 vTint;\nvarying vec2 vFx;\nvarying vec3 vLocal;\nfloat sqHash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }\n";
    // Pieces about a seventh of a metre, some smaller, go first where the noise is lowest.
    const dissolve =
      "float sqGap = 0.0;\nif (vFx.x > 0.0) {\n  float n = 0.7 * sqHash(floor(vLocal * 7.0)) + 0.3 * sqHash(floor(vLocal * 19.0));\n  if (n < vFx.x) discard;\n  sqGap = 1.0 - smoothstep(vFx.x, vFx.x + 0.07, n);\n}\n";
    s.fragmentShader = pars + s.fragmentShader;
    if (lit)
      s.fragmentShader = s.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\n" +
          dissolve +
          "float sqRim = 1.0 - abs(dot(normal, normalize(vViewPosition)));\nfloat sqRim3 = sqRim * sqRim * sqRim;\n" +
          // The warning's red keeps to the edges, where it reads as a glow, and leaves the faces their
          // own colours: a small foe, nearly all edge, is not washed pink.
          "totalEmissiveRadiance += vColor.rgb * 0.18 + vTint * (0.02 + 3.4 * smoothstep(0.7, 0.97, sqRim)) + vTint * sqGap * 3.0;\n" +
          "totalEmissiveRadiance += vec3(1.0, 0.97, 0.9) * vFx.y * (0.06 + 1.5 * sqRim3);\n",
      );
    else
      s.fragmentShader = s.fragmentShader.replace(
        "#include <color_fragment>",
        "#include <color_fragment>\n" + dissolve + "diffuseColor.rgb += vTint * 0.12 + vTint * sqGap * 2.0 + vec3(vFx.y * 0.45);\n",
      );
  };
  m.customProgramCacheKey = () => (lit ? "study-quest-lit-5" : "study-quest-glow-5");
  return m;
}

/** One instanced mesh of a kind's model, with its tint. */
interface Layer {
  mesh: InstancedMesh;
  tint: InstancedBufferAttribute;
  fx: InstancedBufferAttribute;
  part?: { name: string; pivot: [number, number, number] };
}

/** The villains drawn in crowds; the Final Exam is drawn by a figure of its own (gameBoss.ts). */
type CrowdKind = Exclude<FoeKind, "exam">;
const CROWD_KINDS = FOE_KINDS.filter((k): k is CrowdKind => k !== "exam");

class KindView {
  readonly model: Model;
  readonly layers: Layer[] = [];
  n = 0;

  constructor(
    readonly kind: CrowdKind,
    lit: Material,
    glow: Material,
    group: Group,
  ) {
    this.model = MODELS[kind]();
    const cap = CAP[kind];
    const add = (geo: BufferGeometry, mat: Material, part?: Layer["part"]) => {
      const tint = new InstancedBufferAttribute(new Float32Array(cap * 3), 3);
      tint.setUsage(DynamicDrawUsage);
      geo.setAttribute("aTint", tint);
      const fx = new InstancedBufferAttribute(new Float32Array(cap * 2), 2);
      fx.setUsage(DynamicDrawUsage);
      geo.setAttribute("aFx", fx);
      const mesh = new InstancedMesh(geo, mat, cap);
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      mesh.count = 0;
      mesh.visible = false;
      mesh.frustumCulled = false;
      mesh.castShadow = mesh.receiveShadow = false;
      group.add(mesh);
      this.layers.push({ mesh, tint, fx, part });
    };
    add(this.model.body, lit);
    add(this.model.glow, glow);
    for (const p of this.model.parts) add(p.geo, p.glow ? glow : lit, { name: p.name, pivot: p.pivot });
  }

  begin(): void {
    this.n = 0;
  }

  /** One foe: its matrix, its tint, how much it has broken up and how bright its flash, and how its parts are turned. */
  put(base: Matrix4, tint: Color, dissolve: number, flash: number, local: (name: string, out: Matrix4) => void): void {
    if (this.n >= CAP[this.kind]) return;
    const i = this.n++;
    for (const l of this.layers) {
      if (l.part) {
        local(l.part.name, _l);
        _m.makeTranslation(l.part.pivot[0], l.part.pivot[1], l.part.pivot[2]).multiply(_l);
        _m.premultiply(base);
        l.mesh.setMatrixAt(i, _m);
      } else l.mesh.setMatrixAt(i, base);
      l.tint.setXYZ(i, tint.r, tint.g, tint.b);
      l.fx.setXY(i, dissolve, flash);
    }
  }

  end(): void {
    for (const l of this.layers) {
      l.mesh.count = this.n;
      l.mesh.visible = this.n > 0;
      if (this.n) {
        l.mesh.instanceMatrix.needsUpdate = true;
        l.tint.needsUpdate = true;
        l.fx.needsUpdate = true;
      }
    }
  }

  dispose(): void {
    for (const l of this.layers) {
      l.mesh.geometry.dispose();
      l.mesh.dispose();
    }
  }
}

/** The instanced pick-ups: books, notes and coffee, and a beam of light over each. */
class ItemsView {
  readonly group = new Group();
  private cover: InstancedMesh;
  private pages: InstancedMesh;
  private coffee: InstancedMesh;
  private note: InstancedMesh;
  private beam: InstancedMesh;
  private nb = 0;
  private nc = 0;
  private nn = 0;
  private nbeam = 0;
  private lit: MeshLambertMaterial;

  constructor() {
    // Lit, and a little lit from within by its own colours, so that a cover reads in shade and at night.
    this.lit = new MeshLambertMaterial({ vertexColors: true });
    this.lit.onBeforeCompile = (s) => {
      s.fragmentShader = s.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vColor.rgb * 0.35;");
    };
    this.lit.customProgramCacheKey = () => "study-quest-items";
    const { cover, pages } = bookParts();
    const im = (g: BufferGeometry, mat: Material, n: number) => {
      const m = new InstancedMesh(g, mat, n);
      m.instanceMatrix.setUsage(DynamicDrawUsage);
      m.setColorAt(0, _c.setRGB(1, 1, 1));
      m.count = 0;
      m.frustumCulled = false;
      m.castShadow = false;
      this.group.add(m);
      return m;
    };
    this.cover = im(cover, this.lit, 56);
    this.pages = im(pages, this.lit, 56);
    this.coffee = im(coffeeGeo(), this.lit, 10);
    this.note = im(noteGeo(), this.lit, 14);
    // A beam that fades to nothing at the top: colours in its vertices, as additive light.
    const g = new CylinderGeometry(0.06, 0.2, 14, 8, 1, true);
    const pos = g.getAttribute("position");
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const k = pos.getY(i) > 0 ? 0 : 0.6;
      col.set([k, k, k], i * 3);
    }
    g.setAttribute("color", new BufferAttribute(col, 3));
    this.beam = im(g, new MeshBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false }), 80);
    this.beam.renderOrder = 2;
  }

  begin(): void {
    this.nb = this.nc = this.nn = this.nbeam = 0;
  }

  add(kind: ItemKind, id: number, x: number, ground: number, z: number, t: number, quest: boolean): void {
    const phase = id * 1.7;
    const y = ground + ITEM_UP + Math.sin(t * 2.2 + phase) * 0.14;
    _q.setFromEuler(_e.set(0, t * 1.6 + phase, kind === "book" ? 0.18 : 0));
    _p.set(x, y, z);
    _s.setScalar(kind === "note" ? 1.15 : 1);
    _m.compose(_p, _q, _s);
    let colour = 0xffffff;
    if (kind === "book" && this.nb < 56) {
      colour = COVERS[id % COVERS.length]!;
      this.cover.setMatrixAt(this.nb, _m);
      this.cover.setColorAt(this.nb, _c.setHex(colour));
      this.pages.setMatrixAt(this.nb, _m);
      this.nb++;
    } else if (kind === "coffee" && this.nc < 10) {
      colour = 0x8ff0d0;
      this.coffee.setMatrixAt(this.nc++, _m);
    } else if (kind === "note" && this.nn < 14) {
      colour = ACCENT;
      this.note.setMatrixAt(this.nn++, _m);
    } else return;
    if (this.nbeam >= 80) return;
    _q.identity();
    _p.set(x, ground + ITEM_UP + 8.1, z);
    _s.set(quest ? 1.8 : 1, 1, quest ? 1.8 : 1);
    _m.compose(_p, _q, _s);
    this.beam.setMatrixAt(this.nbeam, _m);
    this.beam.setColorAt(this.nbeam++, _c.setHex(quest ? ACCENT : colour));
  }

  end(): void {
    for (const [m, n] of [
      [this.cover, this.nb],
      [this.pages, this.nb],
      [this.coffee, this.nc],
      [this.note, this.nn],
      [this.beam, this.nbeam],
    ] as const) {
      m.count = n;
      m.visible = n > 0;
      if (n) {
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
      }
    }
  }

  dispose(): void {
    for (const m of [this.cover, this.pages, this.coffee, this.note, this.beam]) {
      m.geometry.dispose();
      m.dispose();
    }
    this.lit.dispose();
    (this.beam.material as Material).dispose();
  }
}

/** Everything of the game on the map, and the game it draws. */
export class GameWorld {
  readonly group = new Group();
  /** Bumped when the labels must be built again: the game started or stopped. */
  labelsVersion = 0;
  /** Whether the buildings' names are left off the walker's view while the game is on: on a phone. */
  quiet = false;
  /** Set by the visitor's pause menu: the game's clock stops. */
  menuPaused = false;
  /** Set by the scene: its view is the map, where the game is not played and waits. */
  mapView = false;
  /** Fewer sparks, and no shaking of the view. */
  reducedMotion = false;
  /** Told of each thing that happens, in the frame it happens: for the sound. */
  onEvent?: (e: GameEvent) => void;
  /** The walker put a foot down while the game is on: `run` when it runs. */
  onStep?: (run: boolean) => void;
  private feet = -1;
  private quest?: StudyQuest;
  private name = "";
  private words?: GameWords;
  private field?: { grid: WalkGrid; reached: Uint8Array; draws: (BookDraw & { b: Building })[]; centre: Pt };
  private events: GameEvent[] = [];
  private paused?: "indoor" | "fly" | "map";
  private seconds = 0;
  private trauma = 0;
  /** Seconds since the game ended, and whether the picture of a game held still has been drawn. */
  private overFor = 0;
  private stillDrawn = false;
  private heights = new Map<number, number>();
  private kinds: Record<CrowdKind, KindView>;
  /** The Final Exam, and how it is posed; how far its near parts are thinned for the walker to show. */
  private boss = new BossView();
  private bossPose = bossPose();
  private bossFade = 0;
  private items = new ItemsView();
  private sparks = new Sparks();
  private tells = new Telegraphs();
  private shadows = new Shadows();
  private missiles = new Missiles();
  private slash = new Slash();
  private arena = new Arena();
  private debris = new Debris();
  private puffs = new Puffs();
  private shocks = new Shocks();
  private decals = new Decals();
  private motion = new FoeMotion();
  private look = newLook();
  /**
   * The camera's nudges (cameraNudge): over the walker's shoulder while it strikes, and in on the
   * boss as it changes phase. Each 0 to 1, eased.
   */
  private nudge = { side: 0, push: 0, strikeT: 0 };
  /** Frames left in which a few of each effect are drawn out of sight, to make their shaders. */
  private warm = 0;
  private lit = tinted(new MeshLambertMaterial({ vertexColors: true, emissive: 0x1c1c22 }), true);
  private glow = tinted(new MeshBasicMaterial({ vertexColors: true }), false);
  private overlay?: GameOverlay;
  private camYaw = 0;
  private trailT = 0;
  /** A blow's arc of light, due when the highlighter meets the foe: seconds to wait, the blow and its bearing. */
  private slashDue?: { t: number; combo: number; dir: number };
  private motionApplied?: boolean;

  constructor(
    private host: GameSceneHost,
    overlayParent?: HTMLElement,
  ) {
    this.group.userData.noPick = true;
    this.group.visible = false;
    this.kinds = Object.fromEntries(CROWD_KINDS.map((k) => [k, new KindView(k, this.lit, this.glow, this.group)])) as Record<CrowdKind, KindView>;
    this.group.add(this.boss.root, this.items.group, this.sparks.mesh, this.tells.group, this.shadows.mesh, this.missiles.group, this.slash.group, this.arena.mesh, this.debris.group, this.puffs.mesh, this.shocks.mesh, this.decals.group);
    // What is see-through (light, dust, warnings on the ground) stays out of the ambient occlusion
    // of the walker view (street/effects.ts): drawn there for depth and normals, a ring of light
    // would shade the ground round it as if it were a wall.
    this.group.traverse((o) => {
      const m = (o as InstancedMesh).material as Material | undefined;
      if ((o as InstancedMesh).isMesh && m?.transparent) o.userData.noAO = true;
    });
    if (overlayParent) this.overlay = new GameOverlay(overlayParent);
  }

  get on(): boolean {
    return !!this.quest;
  }

  /** The name of the walker the game is played by. */
  get player(): string {
    return this.name;
  }

  /**
   * Starts a game for the walker called `name`. `words` are what it shows in the visitor's language.
   * `quiet` leaves the buildings' names off the walker's view meanwhile; `compact` keeps the marks over
   * the picture few, for a phone. False when the walker or the walking map is not there.
   */
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
    this.heights.clear();
    // The game is seen from behind the walker. A walker in a corner between walls (as at some
    // schools' starting spots) steps out first to the most open ground near, and one with a wall at
    // its back turns to open ground, so that the camera has room behind it and the first book lies
    // ahead in the open.
    let at: Pt = [walker.at[0], walker.at[1]];
    if (this.cramped(at)) {
      const f = this.fieldAt(at);
      const open = f ? openSpot(f.grid, f.reached, at, START_REACH, START_ROOM, at, Math.random, 60, 0) : undefined;
      if (open) at = open;
    }
    const heading = this.openHeading(at, walker.heading);
    if (at[0] !== walker.at[0] || at[1] !== walker.at[1]) this.host.teleport(name, at, heading);
    else if (heading !== walker.heading) this.host.face(name, heading);
    this.meAt[0] = at[0];
    this.meAt[1] = at[1];
    this.quest = new StudyQuest(
      {
        spot: (near, taken, place) => this.spot(near, taken, place),
        place: (near, avoid, big) => this.place(near, avoid, big),
        near: (p) => {
          const f = this.fieldAt(this.meAt);
          return f ? nearestReached(f.grid, f.reached, p) : undefined;
        },
        random: Math.random,
      },
      at,
      heading,
      seen,
    );
    this.events.push(...this.drainStart());
    this.motionApplied = undefined;
    this.group.visible = true;
    this.overlay?.show(true);
    this.overlay?.root.classList.toggle("compact", compact);
    this.host.pen(name, true);
    this.host.act(name, undefined);
    this.slashDue = undefined;
    this.warm = 2;
    this.sync(this.host.walker(name) ?? walker, 0);
    this.labelsVersion++;
    return true;
  }

  /** Whether a wall stands within a couple of metres of a spot, any way round. */
  private cramped(at: Pt): boolean {
    const map = this.host.walkMap();
    if (!map) return false;
    for (let deg = 0; deg < 360; deg += 45) {
      const r = (deg * Math.PI) / 180;
      if (map.wallAlong(at, [at[0] + Math.sin(r) * CRAMPED, at[1] + Math.cos(r) * CRAMPED]) !== undefined) return true;
    }
    return false;
  }

  /**
   * The bearing to face at the start: the walker's own when the ground behind it is clear for the
   * camera and ahead of it for the first book, or else the nearest bearing round that is.
   */
  private openHeading(at: Pt, heading: number): number {
    const map = this.host.walkMap();
    if (!map) return heading;
    const clear = (deg: number) => {
      const r = (deg * Math.PI) / 180;
      const line = (m: number) => map.wallAlong(at, [at[0] + Math.sin(r) * m, at[1] + Math.cos(r) * m]) ?? 1;
      // Room behind for the camera counts most; then the open ground ahead, and a little each side.
      const r2 = r + Math.PI / 2;
      const side = (k: number) => map.wallAlong(at, [at[0] + Math.sin(r2) * k * 4, at[1] + Math.cos(r2) * k * 4]) ?? 1;
      return (map.wallAlong(at, [at[0] - Math.sin(r) * OPEN_BEHIND, at[1] - Math.cos(r) * OPEN_BEHIND]) ?? 1) * 2 + line(OPEN_AHEAD) + 0.25 * (side(1) + side(-1));
    };
    const full = 3.5;
    if (clear(heading) >= full - 1e-6) return heading;
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

  /** The quests the game opened with, for the panel. */
  private drainStart(): GameEvent[] {
    return this.quest!.quests.map((quest) => ({ type: "quest" as const, quest, done: false }));
  }

  stop(): void {
    if (!this.quest) return;
    this.host.paceScale(this.name, 1);
    this.host.pen(this.name, false);
    this.host.act(this.name, undefined);
    this.quest = undefined;
    this.field = undefined;
    this.group.visible = false;
    this.sparks.clear();
    this.debris.clear();
    this.puffs.clear();
    this.shocks.clear();
    this.motion.clear();
    this.nudge.side = this.nudge.push = this.nudge.strikeT = 0;
    this.arena.hide();
    this.overlay?.show(false);
    this.labelsVersion++;
  }

  /**
   * Burnt out, tries again from the last checkpoint: the walker is put where the quest it was on
   * began (or at the edge of the boss's arena), on its feet, and the game goes on. False when the
   * game is not lost.
   */
  retry(): boolean {
    const g = this.quest;
    if (!g) return false;
    const evs = g.retry();
    const r = evs.find((e) => e.type === "retry");
    if (!r || r.type !== "retry") return false;
    this.host.teleport(this.name, r.at, r.heading);
    this.host.act(this.name, undefined);
    this.host.paceScale(this.name, 1);
    this.trauma = 0;
    this.overFor = 0;
    this.stillDrawn = false;
    this.slashDue = undefined;
    this.nudge.side = this.nudge.push = this.nudge.strikeT = 0;
    this.motion.clear();
    this.heights.clear();
    const me = this.host.walker(this.name);
    if (me) {
      this.meAt[0] = me.at[0];
      this.meAt[1] = me.at[1];
      for (const e of evs) this.effect(e, me);
    }
    this.events.push(...evs);
    return true;
  }

  /** An action from the keys, the mouse, a pad or the buttons. False when it cannot be done now. */
  act(a: GameAction): boolean {
    if (!this.quest || this.menuPaused || this.paused) return false;
    return this.quest.act(a);
  }

  toggleLock(): void {
    if (this.quest && !this.menuPaused) this.quest.toggleLock();
  }

  /** The way the view is shaken now, metres, added to the camera's place. Zero for reduced motion. */
  shake(out: Vector3): Vector3 {
    out.set(0, 0, 0);
    if (!this.quest || this.reducedMotion || this.trauma <= 0) return out;
    const k = this.trauma * this.trauma * 0.35;
    const t = this.seconds * 60;
    return out.set(Math.sin(t * 1.3) * k, Math.sin(t * 1.7 + 1) * k * 0.7, Math.sin(t * 1.1 + 2) * k);
  }

  /**
   * How the camera behind the walker is nudged now, each 0 to 1 and eased: `side`, over the
   * walker's right shoulder while it strikes, so that the swing is not hidden by its body; `push`,
   * in on the boss as it changes phase. Both 0 for reduced motion, and when no game is on.
   */
  cameraNudge(): { side: number; push: number } {
    return this.nudge;
  }

  /**
   * What the camera behind the walker frames in a fight, or undefined when there is none: the foe
   * locked on to, the boss in its arena (both `hard`: the camera keeps them in view), or else the
   * nearest foe coming at the walker, the DDL first (soft: the visitor can still turn the view).
   * Metres east and north, heights of its feet and its top, and its half width. The same object each time.
   */
  fightFocus(): FightFocus | undefined {
    const g = this.quest;
    if (!g || this.menuPaused || this.paused) return undefined;
    const me = this.meAt;
    let pick: Foe | undefined;
    let hard = true;
    if (g.phase !== "play") {
      // A game won: the camera stays on the boss while it breaks up.
      if (g.victory) for (const f of g.foes) if (f.kind === "exam") pick = f;
      if (!pick) return undefined;
    }
    for (const f of g.foes) if (!pick && f.id === g.lock && f.state !== "dead") pick = f;
    if (!pick && g.arena?.active) pick = g.boss;
    if (!pick) {
      hard = false;
      let best = Infinity;
      for (const f of g.foes) {
        if (f.state === "dead" || f.state === "rise") continue;
        const d = Math.hypot(f.at[0] - me[0], f.at[1] - me[1]);
        if (d > (f.kind === "ddl" ? ENGAGE_DDL : ENGAGE)) continue;
        // The DDL comes first: a minion beside it matters less than the clock that charges.
        const score = d - (f.kind === "ddl" ? 100 : 0);
        if (score < best) (best = score), (pick = f);
      }
    }
    if (!pick) return undefined;
    const foot = this.footOf(pick.id);
    const o = this.focusOut;
    o.at[0] = pick.at[0];
    o.at[1] = pick.at[1];
    o.foot = foot;
    // Its model's top, with a little over for its crown of pens or its bob in the air.
    const model = pick.kind === "exam" ? this.boss : this.kinds[pick.kind].model;
    const scale = pick.kind === "ddl" ? 1 + (pick.tier - 1) * 0.25 : 1;
    o.top = foot + (model.float + model.height) * scale + 0.6 + (pick.state === "phase" ? PHASE_RISE : 0);
    // Its arms reach out past its body: the boss's red pens most.
    o.half = FOES[pick.kind].radius * 1.3 * scale;
    o.body = FOES[pick.kind].radius * scale;
    o.lane = pick.move?.type === "charge" && (pick.state === "tell" || pick.state === "attack") ? pick.move.dir : undefined;
    o.hard = hard;
    return o;
  }
  /** Where the walker stood at the last step. */
  private meAt: [number, number] = [0, 0];
  private focusOut: FightFocus = { at: [0, 0], foot: 0, top: 0, half: 0, body: 0, hard: false };

  /** What the panel shows, with what happened since it last asked. */
  view(): GameView | undefined {
    const g = this.quest;
    const walker = this.host.walker(this.name);
    if (!g || !walker) return undefined;
    const events = this.events;
    this.events = [];
    const s = g.stats;
    const boss = g.boss;
    const cooldown: Record<SkillId, number> = {
      strike: 1 - g.strikeT / 0.42,
      dodge: g.stamina >= PLAYER.dodgeCost ? 1 : g.stamina / PLAYER.dodgeCost,
      flashcard: g.stamina >= PLAYER.cardCost ? 1 - g.cardT / PLAYER.cardCooldown : g.stamina / PLAYER.cardCost,
      sprint: g.stamina >= PLAYER.dodgeCost ? 1 : g.stamina / PLAYER.dodgeCost,
      eureka: g.eurekaMeter / PLAYER.eurekaCharge,
    };
    // A game won shows its debrief once the boss has broken up, not over its death.
    const over = g.phase === "over" && !(g.victory && g.foes.some((f) => f.kind === "exam"));
    let near = 0;
    let ddl = false;
    for (const f of g.foes) {
      if (f.state === "dead" || f.state === "rise" || f.kind === "exam") continue;
      if (Math.hypot(f.at[0] - walker.at[0], f.at[1] - walker.at[1]) > THREAT_REACH) continue;
      near++;
      if (f.kind === "ddl") ddl = true;
    }
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
      quests: g.quests.map((q) => {
        const target = this.questTarget(q.id);
        return {
          id: q.id,
          key: q.key,
          main: q.main,
          place: q.place?.name,
          need: q.need,
          got: q.got,
          metres: target ? Math.hypot(target[0] - walker.at[0], target[1] - walker.at[1]) : undefined,
          bearing: target ? (bearingTo(walker.at, target) - this.camYaw + 360) % 360 : undefined,
        };
      }),
      boss: boss ? { hp: boss.hp, max: boss.maxHp, phase: boss.phase } : undefined,
      threat: { near, ddl },
      chain: g.hits,
      slowed: g.slowT > 0,
      locked: g.lock !== undefined,
      seconds: g.seconds,
      defeated: g.defeated,
      met: [...g.met],
      lesson: g.phase === "play" && !this.paused ? g.lesson : undefined,
      taught: [...g.taught],
      deaths: g.deaths,
      retry: over && !g.victory ? { quest: g.quests.find((q) => q.main)?.key ?? "orientation", boss: !!g.arena?.active } : undefined,
      events,
      debrief: over ? g.debrief() : undefined,
    };
  }

  /** Where a quest leads: its place, or the foe it is for, or its nearest note. */
  private questTarget(id: string): Pt | undefined {
    const g = this.quest!;
    const q = g.quests.find((x) => x.id === id);
    if (!q) return undefined;
    const me = this.host.walker(this.name)?.at ?? [0, 0];
    if (q.goal === "defeat" && q.started) {
      const foes = g.foes.filter((f) => f.quest === id && f.state !== "dead");
      if (foes.length) return foes.reduce((a, b) => (Math.hypot(a.at[0] - me[0], a.at[1] - me[1]) < Math.hypot(b.at[0] - me[0], b.at[1] - me[1]) ? a : b)).at;
    }
    if (q.goal === "collect" && q.started) {
      const notes = g.items.filter((i) => i.quest === id);
      if (notes.length) return notes.reduce((a, b) => (Math.hypot(a.at[0] - me[0], a.at[1] - me[1]) < Math.hypot(b.at[0] - me[0], b.at[1] - me[1]) ? a : b)).at;
    }
    if (q.goal === "boss" && g.boss) return g.boss.at;
    if (q.key === "orientation") {
      const books = g.items.filter((i) => i.kind === "book");
      if (books.length) return books.reduce((a, b) => (Math.hypot(a.at[0] - me[0], a.at[1] - me[1]) < Math.hypot(b.at[0] - me[0], b.at[1] - me[1]) ? a : b)).at;
    }
    return q.place?.at;
  }

  /** The game as it stands, for tests. */
  state():
    | {
        phase: "play" | "over";
        books: Pt[];
        items: { kind: ItemKind; at: Pt; quest?: string }[];
        foes: { id: number; kind: FoeKind; at: Pt; hp: number; state: string }[];
        quests: { key: QuestKey; need: number; got: number; place?: Place }[];
        focus: number;
        xp: number;
        rank: number;
        main: number;
        victory: boolean;
      }
    | undefined {
    const g = this.quest;
    if (!g) return undefined;
    return {
      phase: g.phase,
      books: g.items.filter((i) => i.kind === "book").map((i) => i.at),
      items: g.items.map((i) => ({ kind: i.kind, at: i.at, quest: i.quest })),
      foes: g.foes.map((f) => ({ id: f.id, kind: f.kind, at: f.at, hp: f.hp, state: f.state })),
      quests: g.quests.map((q) => ({ key: q.key, need: q.need, got: q.got, place: q.place })),
      focus: g.focus,
      xp: g.xp,
      rank: g.rank,
      main: g.mainStep,
      victory: g.victory,
    };
  }

  /** The game draws no labels of the map's kind: its marks are its own (gameOverlay.ts). */
  labels(): LabelSpec[] {
    return [];
  }

  /**
   * Moves the game on by `dt` seconds. True when the picture must be drawn again: in every frame
   * while it is played. A game held still (its title card, a menu over it, the walker indoors or in
   * the air) is drawn once as it stops, and a game over once its foes' last moments have played, so
   * that a still picture is not drawn again and again (#53).
   */
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
    // A game that is over still runs its foes' last moments; a pause stops everything.
    const gdt = this.menuPaused || this.paused ? 0 : dt;
    const evs = g.step(gdt, { at: walker.at, heading: walker.heading, active: !frozen, pace: walker.ride === "scooter" ? QUEST.scooterPace : 1 });
    if (!frozen) this.seconds += dt;
    // What the game asks of the walker: to be pushed, to turn to its blow, to go slower.
    const o = g.orders;
    if (o.face !== undefined) this.host.face(this.name, o.face);
    if (o.shove[0] || o.shove[1]) this.host.shove(this.name, o.shove[0], o.shove[1]);
    this.host.paceScale(this.name, o.slow);
    const me = this.host.walker(this.name) ?? walker;
    this.meAt[0] = me.at[0];
    this.meAt[1] = me.at[1];
    for (const e of evs) this.effect(e, me);
    // A footstep each time the figure puts a foot down, while the game runs.
    const feet = Math.floor(me.footfalls ?? -1);
    if (feet !== this.feet && this.feet >= 0 && feet >= 0 && !frozen) this.onStep?.(me.speed > 3.2);
    this.feet = feet;
    this.events.push(...evs);
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    this.sync(me, frozen && this.menuPaused ? 0 : dt);
    this.overFor = g.phase === "play" ? 0 : this.overFor + dt;
    const still = this.menuPaused || !!this.paused || this.overFor > OVER_SETTLE;
    const draw = !still || !this.stillDrawn || this.trauma > 0;
    this.stillDrawn = still;
    return draw;
  }

  /** Puts everything on the ground again, after the ground or the buildings changed. */
  refresh(): void {
    this.field = undefined;
    this.heights.clear();
  }

  dispose(): void {
    this.stop();
    for (const k of Object.values(this.kinds)) k.dispose();
    this.boss.dispose();
    this.items.dispose();
    this.lit.dispose();
    this.glow.dispose();
    this.overlay?.dispose();
    this.group.traverse((o) => {
      const m = o as InstancedMesh;
      if (m.isMesh && !(m as InstancedMesh).geometry.attributes.aTint) {
        m.geometry.dispose();
        (m.material as Material).dispose();
      }
    });
  }

  // -------------------------------------------------------------------------------------------
  // Places
  // -------------------------------------------------------------------------------------------

  private floatAt(p: Pt): number {
    return Math.max(this.host.groundAt(p[0], p[1]), this.host.roofs()?.at(p) ?? -Infinity);
  }

  /** The ground round the walker: what it can reach, and the buildings that draw the pick-ups. */
  private fieldAt(near: Pt): NonNullable<GameWorld["field"]> | undefined {
    const map = this.host.walkMap();
    if (!map) return undefined;
    let f = this.field;
    if (!f || Math.hypot(near[0] - f.centre[0], near[1] - f.centre[1]) > FIELD_KEEP) {
      const grid = map.grid([near[0] - FIELD, near[1] - FIELD, near[0] + FIELD, near[1] + FIELD], 2);
      const inField = (b: Building) => !b.offMap && Math.abs(b.center[0] - near[0]) < FIELD - 40 && Math.abs(b.center[1] - near[1]) < FIELD - 40;
      const all = this.host.buildings().filter(inField);
      // Buildings with teaching rooms draw the pick-ups and the quests, more the more rooms they
      // have; where the map names no rooms, every building draws alike.
      const teaching = all.filter((b) => b.roomCount > 0);
      const draws = (teaching.length ? teaching : all).map((b) => {
        const far = Math.hypot(b.center[0] - near[0], b.center[1] - near[1]) / DRAW_HALF;
        return { b, center: b.center, weight: (1 + Math.sqrt(b.roomCount)) / (1 + far * far) };
      });
      f = this.field = { grid, reached: reachable(grid, near), draws, centre: [near[0], near[1]] };
    }
    return f;
  }

  /** Somewhere to lay a pick-up: on ground the walker can get to, beside a building with rooms to teach in. */
  private spot(near: Pt, taken: readonly Pt[], place?: Pt): Pt | undefined {
    const f = this.fieldAt(near);
    if (!f) return undefined;
    if (place) return bookSpot(f.grid, f.reached, [{ center: place, weight: 1 }], near, taken, Math.random, undefined, QUEST.noteReach) ?? undefined;
    const close = taken.filter((t) => Math.hypot(t[0] - near[0], t[1] - near[1]) <= CLOSE_REACH).length;
    const beside = close < CLOSE_ITEMS ? bookSpot(f.grid, f.reached, [], near, taken, Math.random, CLOSE_REACH) : undefined;
    return beside ?? bookSpot(f.grid, f.reached, f.draws, near, taken, Math.random) ?? bookSpot(f.grid, f.reached, [], near, taken, Math.random);
  }

  /**
   * A place for a quest: reachable ground beside a building with rooms to teach in, QUEST.placeRange metres off,
   * away from the other quests' places. `big`: the building with the most rooms, for the last fight,
   * on the most open ground near it.
   */
  private place(near: Pt, avoid: readonly Pt[], big = false): Place | undefined {
    const f = this.fieldAt(near);
    if (!f || !this.words) return undefined;
    const ok = f.draws.filter((d) => {
      const far = Math.hypot(d.center[0] - near[0], d.center[1] - near[1]);
      return far >= QUEST.placeRange[0] && far <= QUEST.placeRange[1] && avoid.every((a) => Math.hypot(a[0] - d.center[0], a[1] - d.center[1]) > 60);
    });
    const pool = ok.length ? ok : f.draws;
    if (!pool.length) {
      const at = bookSpot(f.grid, f.reached, [], near, [], Math.random, 160);
      return at ? { name: this.words.open, at } : undefined;
    }
    const d = big ? pool.reduce((a, b) => (b.b.roomCount > a.b.roomCount ? b : a)) : pool[Math.floor(Math.random() * pool.length)]!;
    // The last fight is on the most open ground near its building, so that the camera sees the
    // whole of the boss with no wall or tree between.
    const at =
      (big ? openSpot(f.grid, f.reached, d.center, ARENA_REACH, QUEST.arenaRadius * 0.75, near, Math.random) : undefined) ??
      bookSpot(f.grid, f.reached, [{ center: d.center, weight: 1 }], near, [], Math.random) ??
      d.center;
    return { name: this.words.place(d.b) || this.words.open, at, building: d.b.id };
  }

  // -------------------------------------------------------------------------------------------
  // Effects of what happened
  // -------------------------------------------------------------------------------------------

  private effect(e: GameEvent, me: WalkerState): void {
    this.onEvent?.(e);
    const sx = me.at[0];
    const sz = -me.at[1];
    const sy = me.height;
    const o = this.overlay;
    const cam = this.host.camera();
    const { width, height } = this.host.viewSize();
    switch (e.type) {
      case "take": {
        const h = this.host.groundAt(e.at[0], e.at[1]) + ITEM_UP;
        this.sparks.burst(e.at[0], h, -e.at[1], 14, 5, e.kind === "coffee" ? 0x8ff0d0 : ACCENT, 0.1, 0.6, 3);
        if (e.xp) o?.number(e.at[0], h + 0.8, -e.at[1], `+${e.xp}`, "xp");
        break;
      }
      case "swing":
        // The arms wind up and strike; the arc of light comes as the blow lands. The camera goes
        // over the shoulder for the blow and a moment after.
        this.host.act(this.name, e.combo === 0 ? "strike0" : e.combo === 1 ? "strike1" : "strike2");
        this.slashDue = { t: Math.max(0, PLAYER.strikeContact[e.combo]! - SLASH_LEAD[e.combo]!), combo: e.combo, dir: e.dir };
        this.nudge.strikeT = PLAYER.strikeTime[e.combo]! + SHOULDER_HOLD;
        break;
      case "card":
        this.host.act(this.name, "card");
        break;
      case "hit": {
        const f = this.foeById(e.foe);
        if (f) this.motion.hit(f, e.dir, e.heavy, e.crit);
        // Light, finisher and critical blows each look and feel their own: the flash, the sparks,
        // the dust, the number and the shake grow with the blow.
        const tier = e.crit ? 2 : e.heavy ? 1 : 0;
        const foot = this.footOf(e.foe);
        const r = (e.dir * Math.PI) / 180;
        const near = FOES[e.kind].radius * 0.7;
        const hx = e.at[0] - Math.sin(r) * near;
        const hz = -(e.at[1] - Math.cos(r) * near);
        const h = foot + Math.min(KIND_MID[e.kind], 2.2);
        this.sparks.one(hx, h, hz, 0, 0, 0, 0.07, HIT_CORE[tier]!, e.crit ? 0xffe27a : 0xfff4dc, 0);
        this.sparks.cone(hx, h, hz, e.dir, 55, HIT_STREAKS[tier]!, HIT_SPEED[tier]!, e.crit ? 0xffd54a : 0xffe8b0, 0.09, 0.26, 12, 0.03);
        this.sparks.cone(hx, h, hz, e.dir, 75, 2 + tier * 2, 5, HUE[e.kind], 0.13, 0.4, 6, 0);
        this.puffs.puff(e.at[0], foot, -e.at[1], 2 + tier * 2, FOES[e.kind].radius * 0.8, DUST, 0.45 + 0.15 * tier, 0.55);
        if (tier > 0) this.shocks.fire(e.at[0], foot + 0.08, -e.at[1], FOES[e.kind].radius + 1.4 + tier, 0.22, e.crit ? 0xffd54a : 0xffb454, 0.22);
        o?.number(e.at[0], h + 1, -e.at[1], String(e.amount), e.crit ? (e.heavy ? "crit heavy" : "crit") : e.heavy ? "heavy" : "light");
        o?.hit(e.at[0], h, -e.at[1], false, cam, width, height);
        this.trauma = Math.min(1, this.trauma + HIT_SHAKE[tier]! + (e.crit && e.heavy ? 0.08 : 0));
        break;
      }
      case "kill": {
        const foot = this.footOf(e.foe);
        const h = foot + Math.min(KIND_MID[e.kind], 3);
        const x = e.at[0];
        const z = -e.at[1];
        const big = e.kind === "exam" ? 3 : e.kind === "ddl" ? 2 : 1;
        // Each breaks into the stuff of its trouble: gears from the clock, stuffing from the pillow,
        // shards of screen, copied pages, ink, and the exam's papers, pencils and red ink.
        const d = this.debris;
        switch (e.kind) {
          case "ddl":
            d.burst("gear", x, h, z, foot, 12, 7, 0xc8ccd4, 1.1);
            d.burst("gear", x, h, z, foot, 6, 6, 0xd8262e, 0.8);
            d.burst("page", x, h + 0.6, z, foot, 4, 4, 0xfff4dc, 0.7);
            break;
          case "procrastination":
            d.burst("page", x, h, z, foot, 10, 5, 0xf6efe0, 0.8);
            d.burst("page", x, h, z, foot, 6, 4, 0xcfc2f2, 0.6);
            break;
          case "distraction":
            d.burst("page", x, h, z, foot, 7, 5, 0x2fd7ff, 0.4, 0.9);
            d.burst("ink", x, h, z, foot, 3, 4, 0x23242c, 0.6, 0.9);
            break;
          case "plagiarism":
            d.burst("page", x, h, z, foot, 14, 4, 0xe7ecff, 0.8);
            d.burst("page", x, h, z, foot, 5, 4, 0xffb3c7, 0.8);
            break;
          case "anxiety":
            d.burst("ink", x, h, z, foot, 14, 5, 0x2b2450, 1);
            d.burst("ink", x, h, z, foot, 6, 4, 0x8b5cff, 0.8);
            break;
          case "exam":
            d.burst("page", x, h + 2, z, foot, 24, 7, 0xf7f3e8, 1.4, 2);
            d.burst("gear", x, h + 1, z, foot, 10, 8, 0xffc300, 1.6, 2);
            d.burst("ink", x, h + 1, z, foot, 10, 6, 0xc1121f, 1.4, 2);
            break;
        }
        this.sparks.burst(x, h, z, 12 * big, 7 * big, HUE[e.kind], 0.14, 0.7, 5);
        this.sparks.cone(x, h, z, 0, 180, 8 * big, 9 * big, 0xfff4dc, 0.08, 0.3, 8, 0.03);
        this.shocks.fire(x, foot + 0.1, z, 2.5 * big + 1, 0.3 * big, HUE[e.kind], 0.35);
        this.puffs.puff(x, foot, z, 4 * big, FOES[e.kind].radius, DUST, 0.6 * big, 0.7);
        o?.number(x, h + 1.6, -e.at[1], `+${e.xp}`, "xp");
        o?.hit(x, h, -e.at[1], true, cam, width, height);
        this.trauma = Math.min(1, this.trauma + 0.2 * big);
        break;
      }
      case "lash": {
        // An attack lands: the foe strikes, and the ground answers where it lands.
        const f = this.foeById(e.foe);
        if (f) this.motion.lash(f, e.move);
        const gy = this.host.groundAt(e.at[0], e.at[1]) + 0.1;
        if (e.move === "slam") {
          this.shocks.fire(e.at[0], gy, -e.at[1], e.radius + 0.6, 0.55, 0xff6a3d, 0.36);
          this.puffs.puff(e.at[0], gy, -e.at[1], e.kind === "exam" ? 10 : 7, e.radius * 0.6, DUST, 0.9, 0.7);
          this.sparks.ring(e.at[0], gy + 0.2, -e.at[1], 18, e.radius * 2.2, 0xffb08a, 0.12);
          this.trauma = Math.min(1, this.trauma + (e.kind === "exam" ? 0.45 : 0.3));
        } else if (e.move === "yawn") {
          this.shocks.fire(e.at[0], gy, -e.at[1], e.radius + 0.4, 0.5, 0xb9a6ff, 0.42);
          this.puffs.puff(e.at[0], gy, -e.at[1], 6, e.radius * 0.5, 0xd9cff5, 0.8, 0.8);
        } else if (e.move === "charge") {
          this.puffs.puff(e.at[0], gy, -e.at[1], 4, 1.2, DUST, 0.7, 0.6);
          this.trauma = Math.min(1, this.trauma + 0.12);
        } else if (e.move === "melee" || e.move === "blink") {
          const fx = f ? f.at : e.at;
          this.sparks.cone(fx[0], gy + 1.3, -fx[1], f ? f.facing : 0, 30, 6, 7, HUE[e.kind], 0.1, 0.25, 4, 0.03);
        }
        break;
      }
      case "hurt":
        this.host.act(this.name, "flinch");
        o?.hurt(bearingTo(me.at, e.from));
        this.sparks.burst(sx, sy + 1.2, sz, 10, 5, 0xff3b30, 0.1, 0.5, 6);
        this.trauma = Math.min(1, this.trauma + 0.38);
        break;
      case "evade":
        o?.number(sx, sy + 2.3, sz, "✦", "evade");
        break;
      case "dodge":
        this.trailT = e.sprint ? 0.4 : 0.3;
        this.host.act(this.name, e.sprint ? "sprint" : "dodge");
        break;
      case "eureka": {
        this.host.act(this.name, "eureka");
        // A crisp ring of light that runs out to the Eureka's reach and is gone, a thinner one just
        // behind it, and sparks that race out along the ground: no wash over the picture.
        const gy = sy + 0.1;
        this.shocks.fire(sx, gy, sz, PLAYER.eurekaRadius, 0.5, 0xfff0c8, 0.32);
        this.shocks.fire(sx, gy + 0.02, sz, PLAYER.eurekaRadius * 0.82, 0.22, 0xffb454, 0.3, 0.06);
        const n = Math.round(28 * this.sparks.density);
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2 + Math.random() * 0.2;
          const v = 18 + Math.random() * 6;
          this.sparks.one(sx + Math.cos(a) * 0.8, gy + 0.3, sz + Math.sin(a) * 0.8, Math.cos(a) * v, 1 + Math.random() * 2, Math.sin(a) * v, 0.3, 0.12, 0xffe2a0, 3, 0.025);
        }
        // From the hands thrust up over the head.
        this.sparks.burst(sx, sy + HANDS_UP, sz, 14, 7, 0xfff1d0, 0.1, 0.5, 4);
        this.puffs.puff(sx, sy, sz, 6, 1.6, DUST, 0.7, 0.6);
        o?.flash("eureka");
        this.trauma = Math.min(1, this.trauma + 0.4);
        break;
      }
      case "rank":
        for (let k = 0; k < 3; k++) this.sparks.ring(sx, sy + 0.3 + k * 0.8, sz, 20, 4 + k, ACCENT, 0.14);
        this.sparks.burst(sx, sy + 1, sz, 30, 6, 0xfff1d0, 0.12, 1.2, -2);
        o?.flash("rank");
        break;
      case "phase": {
        // The boss's change of phase: knocked back, then a roar. The effect stays on the boss and the
        // ground: its own glow (gameBoss.ts), one crisp shockwave and a thin one after it over the
        // arena, and a pulse at the edges of the picture (gameOverlay.ts), never a wash over all of it.
        o?.flash("phase");
        this.trauma = Math.min(1, this.trauma + 0.6);
        const b = this.quest?.boss;
        if (b) {
          const foot = this.footOf(b.id);
          const roar = FOE_TIME.phase * 0.2;
          this.shocks.fire(b.at[0], foot + 0.12, -b.at[1], QUEST.arenaRadius * 0.9, 0.55, 0xffc070, 0.7, roar);
          this.shocks.fire(b.at[0], foot + 0.14, -b.at[1], QUEST.arenaRadius * 0.75, 0.22, 0xff6a3d, 0.6, roar + 0.16);
          this.sparks.burst(b.at[0], foot + 5, -b.at[1], 40, 12, 0xffd27a, 0.16, 0.9, 6);
          this.puffs.puff(b.at[0], foot, -b.at[1], 10, 4, DUST, 1.3, 0.9);
        }
        break;
      }
      case "over":
        // Burnt out, the arms drop; a won game keeps the stance it had.
        if (!e.victory) this.host.act(this.name, "down");
        break;
      case "retry":
        // Back on its feet where the quest began: a ring of light, as at a rank risen, but smaller.
        this.sparks.ring(sx, sy + 0.3, sz, 18, 3, ACCENT, 0.12);
        this.sparks.burst(sx, sy + 1, sz, 16, 4, 0xfff1d0, 0.1, 0.8, -2);
        break;
      case "arrive": {
        const f = this.quest?.foes.find((x) => x.id === e.foe);
        if (f) this.sparks.burst(f.at[0], this.floatAt(f.at) + 0.5, -f.at[1], e.kind === "exam" ? 60 : 14, e.kind === "exam" ? 10 : 4, HUE[e.kind], 0.2, 0.9, -1);
        break;
      }
      case "tell":
        if (e.kind === "exam" || e.kind === "ddl") this.trauma = Math.min(1, this.trauma + 0.1);
        break;
      default:
        break;
    }
  }

  /** The foe of an id, while the game has it. */
  private foeById(id: number): Foe | undefined {
    const foes = this.quest?.foes;
    if (foes) for (const f of foes) if (f.id === id) return f;
    return undefined;
  }

  /** Metres above sea level of a foe's feet as last drawn. */
  private footOf(id: number): number {
    return this.heights.get(id) ?? this.host.walker(this.name)?.height ?? 0;
  }

  // -------------------------------------------------------------------------------------------
  // Drawing
  // -------------------------------------------------------------------------------------------

  private sync(walker: WalkerState, dt: number): void {
    const g = this.quest!;
    // The reduced-motion setting, changed in the pause menu, takes effect at once.
    // Under a full menu (the pause menu, the record, the debrief) the marks over the picture wait.
    this.overlay?.root.classList.toggle("menu", this.menuPaused || (g.phase === "over" && !(g.victory && g.foes.some((f) => f.kind === "exam"))));
    if (this.motionApplied !== this.reducedMotion) {
      this.motionApplied = this.reducedMotion;
      this.sparks.density = this.reducedMotion ? 0.4 : 1;
      this.overlay?.root.classList.toggle("rm", this.reducedMotion);
    }
    const t = performance.now() / 1000;
    const wx = walker.at[0];
    const wz = -walker.at[1];
    const wy = walker.height;

    // Pick-ups: only those within 160 m are drawn.
    this.items.begin();
    for (const it of g.items) {
      if (Math.hypot(it.at[0] - wx, it.at[1] - walker.at[1]) > 160 && !it.quest) continue;
      this.items.add(it.kind, it.id, it.at[0], this.host.groundAt(it.at[0], it.at[1]), -it.at[1], t, !!it.quest);
    }
    this.items.end();

    // Foes.
    for (const k of CROWD_KINDS) this.kinds[k].begin();
    this.boss.begin();
    this.shadows.begin();
    this.motion.begin();
    const plates: PlateIn[] = [];
    const tint = _tint;
    const look = this.look;
    let bossPhase = -1;
    for (const f of g.foes) {
      const far = Math.hypot(f.at[0] - wx, f.at[1] - walker.at[1]);
      if (far > 180) continue;
      const kv = f.kind === "exam" ? undefined : this.kinds[f.kind];
      const model = kv?.model ?? this.boss;
      // Over the ground and the roofs, rising and falling smoothly.
      const want = this.floatAt(f.at);
      const had = this.heights.get(f.id);
      const rise = 12 * dt;
      const foot = had === undefined || dt <= 0 ? want : had + Math.max(-rise, Math.min(rise, want - had));
      this.heights.set(f.id, foot);
      this.motion.look(f, dt, t, look);
      let y = foot + model.float + look.oy;
      let scale = f.kind === "ddl" ? 1 + (f.tier - 1) * 0.25 : 1;
      if (f.state === "rise") {
        const total = f.kind === "exam" ? 3.2 : 0.8;
        const k = Math.max(0, Math.min(1, 1 - f.t / total));
        const back = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
        scale *= Math.max(0.01, back);
        y -= (1 - k) * 2;
      }
      tint.setRGB(look.tr, look.tg, look.tb);
      // What breaks up glows at the edges of its gaps in its own colour.
      if (f.state === "dead" && f.kind !== "exam") tint.setHex(HUE[f.kind]).multiplyScalar(0.8);
      // The last phase's rage: a faint red at its edges; the figure itself shows the rest (gameBoss.ts).
      if (f.kind === "exam" && f.phase === 3 && f.state !== "dead" && f.state !== "phase") tint.r = Math.max(tint.r, 0.08 + 0.05 * Math.sin(t * 6));
      if (f.kind === "exam" && f.state === "phase") bossPhase = this.motion.since(f.id) / FOE_TIME.phase;
      _p.set(f.at[0] + look.ox, y, -(f.at[1] + look.on));
      _q.setFromEuler(_e.set(look.pitch, yawOf(f.facing) + look.yaw, look.roll));
      _s.set(scale * look.sx, scale * look.sy, scale * look.sz);
      _b.compose(_p, _q, _s);
      this.posing = f;
      this.posingT = t;
      if (kv) kv.put(_b, tint, look.dissolve, look.flash, this.poseOf);
      else this.placeBoss(f, _b, tint, look.dissolve, look.flash, t, dt, walker);
      if (f.state !== "dead") this.shadows.add(f.at[0] + look.ox, foot, -(f.at[1] + look.on), FOES[f.kind].radius * (f.kind === "exam" ? 1.2 : 0.9) * scale * Math.max(0.6, 1 - look.oy * 0.15));
      // Its plate: the big ones always; the small ones when near, or hurt.
      const elite = f.kind === "ddl" || f.kind === "exam";
      if (f.state !== "dead" && f.state !== "rise" && f.kind !== "exam" && (elite || far < 26 || f.hp < f.maxHp) && this.words) {
        plates.push({ id: f.id, x: f.at[0], y: foot + model.float + model.height * scale + 0.5, z: -f.at[1], name: this.words.foes[f.kind], hp: f.hp, max: f.maxHp, elite, warn: f.state === "tell" });
      }
      // Trails, moods, steps and daze.
      if (dt > 0) {
        const head = foot + model.float + model.height * scale * 0.92 + look.oy;
        if (f.state === "dead") {
          // The last hour breaks up slowly, shedding its pages.
          if (f.kind === "exam" && Math.random() < dt * 30) this.debris.burst("page", f.at[0] + (Math.random() - 0.5) * 3, foot + 2 + Math.random() * 7, -f.at[1] + (Math.random() - 0.5) * 3, foot, 1, 3, 0xf7f3e8, 1.2, 1.6);
          continue;
        }
        if (look.step) this.puffs.puff(f.at[0], foot, -f.at[1], f.kind === "exam" ? 3 : 2, FOES[f.kind].radius * 0.7, DUST, f.kind === "exam" ? 0.9 : 0.45, 0.5);
        if (look.dazed && Math.random() < dt * 9) {
          // Stars round its head: it is open.
          const a = t * 7 + f.id;
          const r = FOES[f.kind].radius * 0.6 + 0.2;
          this.sparks.one(f.at[0] + Math.cos(a) * r, head + 0.25, -f.at[1] + Math.sin(a) * r, -Math.sin(a) * 2.2, 0.3, Math.cos(a) * 2.2, 0.4, 0.16, 0xffe14a, 0);
        }
        if (f.kind === "procrastination" && Math.random() < dt * 1.5) this.sparks.one(f.at[0] + 0.6, y + 2.6, -f.at[1], 0.3, 0.8, 0, 1.6, 0.12, 0xbfd8ff, -0.2);
        if (f.kind === "anxiety" && Math.random() < dt * 6) this.sparks.one(f.at[0], y + 1.5, -f.at[1], (Math.random() - 0.5) * 2, 1.2, (Math.random() - 0.5) * 2, 0.7, 0.14, 0x5b3dbb, -0.5);
        if (f.kind === "exam" && Math.random() < dt * 12) this.sparks.one(f.at[0] + (Math.random() - 0.5) * 3, y + 3 + Math.random() * 4, -f.at[1] + (Math.random() - 0.5) * 3, 0, 1.5, 0, 1.0, 0.12, 0xffb347, -0.3);
        if (f.state === "attack" && look.step) this.puffs.puff(f.at[0], foot, -f.at[1], 2, 1, DUST, 0.6, 0.5);
      }
    }
    this.motion.end();
    // The camera: over the walker's shoulder while it strikes, in on the boss as it changes phase.
    {
      const n = this.nudge;
      n.strikeT = Math.max(0, n.strikeT - dt);
      const wantSide = this.reducedMotion || g.phase !== "play" ? 0 : n.strikeT > 0 ? 1 : 0;
      n.side += (wantSide - n.side) * (1 - Math.exp(-dt * (wantSide > n.side ? 9 : 2.2)));
      const wantPush = this.reducedMotion || bossPhase < 0 ? 0 : Math.sin(Math.PI * Math.min(1, bossPhase / 0.85)) * (bossPhase < 0.85 ? 1 : 0);
      n.push += (wantPush - n.push) * (1 - Math.exp(-dt * 5));
      if (n.side < 1e-3) n.side = 0;
      if (n.push < 1e-3) n.push = 0;
    }
    // In the first frames of a game, the Final Exam is drawn once far under the walker, so that its
    // shaders are made behind the title card and not as it rises.
    if (this.warm > 0 && !this.boss.root.visible) {
      _b.makeTranslation(wx, wy - 400, wz);
      this.placeBossAt(_b, 1, 1, _tint.setRGB(0, 0, 0), 0, 0, t, 0, -1);
    }
    for (const k of CROWD_KINDS) this.kinds[k].end();
    this.boss.end();
    this.shadows.end();

    // Warnings on the ground that fill as the attack comes, the boss's rings, and rings at the walker's feet.
    this.tells.begin();
    this.decals.begin(t);
    for (const tl of g.tells) {
      const h = this.host.groundAt(tl.at[0], tl.at[1]) + 0.17;
      const k = 1 - tl.t / tl.total;
      // Brighter in the last moment before it lands.
      const alpha = tl.t < 0.2 ? 0.85 + 0.15 * Math.sin(t * 60) : 0.8;
      if (tl.shape === "circle") this.decals.circle(tl.at[0], h, -tl.at[1], tl.radius, k, 0xff3b2f, alpha);
      else this.decals.line(tl.at[0], h, -tl.at[1], tl.dir, tl.length, tl.width, k, 0xff3b2f, alpha);
    }
    this.decals.end();
    for (const w of g.waves) {
      const h = this.host.groundAt(w.at[0], w.at[1]) + 0.25;
      this.tells.ring({ x: w.at[0], y: h, z: -w.at[1], r: w.r, color: 0xff7a2f, alpha: 1 - w.r / w.max });
      this.tells.ring({ x: w.at[0], y: h + 0.4, z: -w.at[1], r: w.r - 0.3, color: 0xffc06a, alpha: 0.6 * (1 - w.r / w.max) });
    }
    if (g.eurekaMeter >= PLAYER.eurekaCharge && g.phase === "play") this.tells.ring({ x: wx, y: wy + 0.12, z: wz, r: 1.1 + Math.sin(t * 6) * 0.08, color: ACCENT, alpha: 0.9 });
    const locked = g.lock === undefined ? undefined : this.foeById(g.lock);
    if (locked) this.tells.ring({ x: locked.at[0], y: this.footOf(locked.id) + 0.15, z: -locked.at[1], r: FOES[locked.kind].radius + 0.5, color: 0xff5a3d, alpha: 0.8 });
    this.tells.end();

    // What flies.
    this.missiles.begin();
    for (const s of g.shots) {
      const h = (s.mine ? wy : this.host.groundAt(s.at[0], s.at[1])) + (s.mine ? 1.2 : 1.4);
      if (s.mine) this.missiles.card(s.at[0], h, -s.at[1], t * 18);
      else this.missiles.orb(s.at[0], h, -s.at[1], 1 + Math.sin(t * 14 + s.id) * 0.15, s.damage > 12);
      if (dt > 0 && Math.random() < 0.7) this.sparks.one(s.at[0], h, -s.at[1], 0, 0.3, 0, 0.35, s.mine ? 0.12 : 0.18, s.mine ? ACCENT : 0x8b5cff, 0);
    }
    this.missiles.end();

    // The walker's own: the slash, the burst, the dodge's trail, the slow.
    if (this.slashDue && (this.slashDue.t -= dt) <= 0) {
      const d = this.slashDue;
      this.slashDue = undefined;
      this.slash.swing(d.combo, d.dir);
      if (d.combo === 2) this.sparks.ring(wx, wy + 0.3, wz, 10, 6, ACCENT, 0.1);
    }
    this.slash.step(dt, wx, wy, wz);
    if (this.warm > 0) {
      // A few of each effect, out of sight far under the walker, in the first frames of a game: their
      // shaders are made then, behind the title card, not in the middle of the first fight.
      this.warm--;
      const y = wy - 400;
      for (const bit of ["page", "gear", "ink"] as const) this.debris.burst(bit, wx, y, wz, y - 1, 1, 0, 0xffffff, 1, 0.05);
      this.puffs.puff(wx, y, wz, 1, 1, DUST, 1, 0.05);
      this.shocks.fire(wx, y, wz, 2, 0.3, 0xffffff, 0.05);
      this.decals.begin(t);
      this.decals.circle(wx, y, wz, 2, 0.5, 0xff3b2f, 0.5);
      this.decals.line(wx, y, wz, 0, 4, 2, 0.5, 0xff3b2f, 0.5);
      this.decals.end();
    }
    this.debris.step(dt);
    this.puffs.step(dt);
    this.shocks.step(dt);
    if (this.trailT > 0 && dt > 0) {
      this.trailT -= dt;
      for (let k = 0; k < 3; k++) this.sparks.one(wx + (Math.random() - 0.5) * 0.6, wy + 0.4 + Math.random() * 1.3, wz + (Math.random() - 0.5) * 0.6, 0, 0.2, 0, 0.45, 0.16, g.has("sprint") ? 0xffc970 : 0x9fd8ff, 0);
    }
    if (g.slowT > 0 && dt > 0 && Math.random() < dt * 5) this.sparks.one(wx, wy + 2, wz, 0.3, 0.6, 0, 1, 0.12, 0xb9a6ff, -0.3);
    this.sparks.step(dt);

    // The arena of the last fight.
    if (g.arena) this.arena.show(g.arena.at[0], this.host.groundAt(g.arena.at[0], g.arena.at[1]), -g.arena.at[1], g.arena.radius, g.arena.active, t);
    else this.arena.hide();

    // The marks over the picture.
    const cam = this.host.camera();
    cam.getWorldDirection(_v);
    this.camYaw = ((Math.atan2(_v.x, -_v.z) * 180) / Math.PI + 360) % 360;
    if (this.overlay) {
      const { width, height } = this.host.viewSize();
      const marks: MarkIn[] = [];
      for (const q of g.quests) {
        const target = this.questTarget(q.id);
        if (!target) continue;
        const metres = Math.hypot(target[0] - wx, target[1] - walker.at[1]);
        const foeTarget = q.goal === "defeat" && q.started;
        marks.push({
          bearing: bearingTo(walker.at, target),
          metres,
          kind: foeTarget || q.goal === "boss" ? "boss" : q.main ? "main" : "side",
          world: foeTarget || (q.goal === "boss" && g.boss) ? undefined : [target[0], this.host.groundAt(target[0], target[1]) + 4.5, -target[1]],
        });
      }
      for (const f of g.foes) {
        if (marks.length >= 8) break;
        if (f.state === "dead" || f.quest) continue;
        const d = Math.hypot(f.at[0] - wx, f.at[1] - walker.at[1]);
        if (d < 45) marks.push({ bearing: bearingTo(walker.at, f.at), metres: d, kind: "foe" });
      }
      const lockAt: [number, number, number] | undefined = locked ? [locked.at[0], this.footOf(locked.id) + KIND_MID[locked.kind], -locked.at[1]] : undefined;
      this.overlay.bossOut = !!g.boss;
      this.overlay.frame(dt, cam, width, height, this.camYaw, plates, marks, lockAt, g.focus < g.stats.maxFocus * 0.3 && g.phase === "play", g.slowT > 0);
    }
  }

  /**
   * Poses the Final Exam: its arms by what it is doing (raised for a slam or the essay's lines, one
   * drawn back to throw, forward for a charge, low as it recovers, flung up as it roars), its phase,
   * its health in the sand, and its near parts thinned while it stands between the camera and the
   * walker, or the camera is in it, so that the walker is never hidden behind it for more than a moment.
   */
  private placeBoss(f: Foe, base: Matrix4, tint: Color, dissolve: number, flash: number, t: number, dt: number, walker: WalkerState): void {
    const roar = f.state === "phase" ? this.motion.since(f.id) / FOE_TIME.phase : -1;
    // Hidden behind it: the line from the camera to the walker passes through its body, with its
    // middle nearer the camera than the walker, or hardly past it (the walker deep in its skirts).
    const camera = this.host.camera();
    const cam = camera.position;
    const wx = walker.at[0];
    const wz = -walker.at[1];
    const bx = f.at[0];
    const bz = -f.at[1];
    const dx = wx - cam.x;
    const dz = wz - cam.z;
    const len = Math.hypot(dx, dz) || 1;
    const along = ((bx - cam.x) * dx + (bz - cam.z) * dz) / len;
    const off = Math.hypot(cam.x + (dx / len) * along - bx, cam.z + (dz / len) * along - bz);
    const r = FOES.exam.radius;
    const inside = Math.hypot(cam.x - bx, cam.z - bz) < r + 1.2;
    const hides = (along > 0 && along < len + r * 0.25 && off < r * 1.1) || inside;
    const want = hides && f.state !== "dead" ? BOSS_THIN : 0;
    this.bossFade += (want - this.bossFade) * (dt > 0 ? 1 - Math.exp(-dt * (want > this.bossFade ? 14 : 4)) : 1);
    if (this.bossFade < 0.01) this.bossFade = 0;
    // Only what is clearly nearer the camera than the walker thins, over the ground along the way the
    // camera looks: what stands behind the walker, or over it, never does.
    camera.getWorldDirection(_v);
    const fl = Math.hypot(_v.x, _v.z) || 1;
    const from = this.bossPose.fadeFrom;
    from[0] = cam.x;
    from[1] = cam.z;
    from[2] = _v.x / fl;
    from[3] = _v.z / fl;
    const near = (wx - cam.x) * from[2] + (wz - cam.z) * from[3] - 1.2;
    this.placeBossAt(base, f.phase, f.hp / f.maxHp, tint, dissolve, flash, t, dt, roar, this.bossFade, near, f);
    // Ink drips from the pens' nibs, more as it rages.
    if (dt > 0 && f.state !== "dead" && Math.random() < dt * (0.8 + f.phase * 1.2)) {
      this.boss.nib(Math.random() < 0.5 ? -1 : 1, _v);
      this.sparks.one(_v.x, _v.y, _v.z, 0, -0.5, 0, 0.9, 0.11, 0xa50f1a, 9, 0.02);
    }
  }

  private placeBossAt(base: Matrix4, phase: number, health: number, tint: Color, dissolve: number, flash: number, t: number, dt: number, roar: number, fade = 0, near = 0, f?: Foe): void {
    const p = this.bossPose;
    p.t = t;
    p.dt = dt;
    p.phase = phase;
    p.health = health;
    p.tint.r = tint.r;
    p.tint.g = tint.g;
    p.tint.b = tint.b;
    p.dissolve = dissolve;
    p.flash = flash;
    p.roar = roar;
    p.fade = fade;
    p.fadeNear = near;
    p.halo = t * (phase === 3 ? 2.2 : phase === 2 ? 1.3 : 0.8);
    for (const side of [-1, 1] as const) {
      // Idle: a slow sway, the forearms forward and readier with each phase.
      let sh = Math.sin(t * 1.4 + (side > 0 ? 1.5 : 0)) * 0.15 - 0.1;
      let el = -0.4 - 0.12 * (phase - 1);
      const s = f?.state;
      const m = f?.move?.type;
      if (s === "tell" && (m === "slam" || m === "beams")) (sh = -2.3), (el = -0.9);
      else if (s === "tell" && m === "charge") (sh = -0.9), (el = -0.2);
      else if (s === "tell" && m === "orb") (sh = side < 0 ? -1.5 : 0.1), (el = side < 0 ? -1.0 : -0.4);
      else if (s === "attack") (sh = 0.7), (el = -0.1);
      else if (s === "recover") (sh = 0.45), (el = -0.15);
      else if (s === "phase") (sh = -2.7 + Math.sin(t * 20) * 0.15), (el = -0.5);
      if (side < 0) (p.armL = sh), (p.elbowL = el);
      else (p.armR = sh), (p.elbowR = el);
    }
    this.boss.place(base, p);
  }

  /** How a moving part of a foe is turned now, about its pivot. */
  /** The foe whose parts are being turned, and the clock: partPose by way of poseOf, made once. */
  private posing?: Foe;
  private posingT = 0;
  private poseOf = (name: string, out: Matrix4): void => this.partPose(name, this.posing!, this.posingT, out);

  private partPose(name: string, f: Foe, t: number, out: Matrix4): void {
    const ph = f.id * 0.9;
    switch (name) {
      case "minute": {
        // It ticks: a jump each half second, faster as it winds up to charge.
        const rate = f.state === "tell" ? 10 : 2;
        const tick = Math.floor(t * rate) + Math.min(1, ((t * rate) % 1) * 5);
        out.makeRotationZ(-tick * (Math.PI / 30) * 3);
        return;
      }
      case "hour":
        out.makeRotationZ(-t * (f.state === "tell" ? 4 : 0.5) - ph);
        return;
      case "key":
        out.makeRotationZ(t * (f.state === "attack" ? 14 : 2));
        return;
      case "wingL":
        out.makeRotationZ(Math.sin(t * 28 + ph) * 0.7);
        return;
      case "wingR":
        out.makeRotationZ(-Math.sin(t * 28 + ph) * 0.7);
        return;
      case "heart": {
        const beat = 1 + 0.3 * Math.abs(Math.sin(t * (f.state === "tell" ? 16 : 7)));
        out.makeScale(beat, beat, beat).premultiply(_r.makeRotationY(t * 2));
        return;
      }
      default:
        out.identity();
    }
  }
}

/** Metres behind the walker kept clear for the camera at the start, and ahead of it for the first book. */
const OPEN_BEHIND = 8;
const OPEN_AHEAD = 20;
/** Metres: a wall this near makes the starting spot a corner; then the most open ground within START_REACH, judged over START_ROOM round it. */
const CRAMPED = 2.5;
const START_REACH = 16;
const START_ROOM = 6;

/** Metres within which a foe coming at the walker is framed by the camera: the DDL from further off. */
const ENGAGE = 12;
const ENGAGE_DDL = 24;

/** Seconds before each blow lands that its arc of light begins, so that it is brightest as it lands. */
const SLASH_LEAD = [0.04, 0.04, 0.02];
/** How much of the boss's near parts is left out (a screen-door), while it would hide the walker. */
const BOSS_THIN = 0.65;
/** Metres the boss rises as it roars at its change of phase (gameMotion.ts), with a little over: the camera frames it. */
const PHASE_RISE = 1.6;
/** Seconds after a blow ends that the camera stays over the walker's shoulder. */
const SHOULDER_HOLD = 0.3;
/** By a blow's strength (light, finisher, critical): the flash's size, the streaks, their speed, and the shake. */
const HIT_CORE = [0.75, 1.05, 1.4];
const HIT_STREAKS = [6, 11, 16];
const HIT_SPEED = [9, 12, 15];
const HIT_SHAKE = [0.1, 0.28, 0.4];
/** The colour of dust kicked up: a pale grey-brown that reads on grass and paving alike. */
const DUST = 0xcdc3ad;

/** Metres over the walker's feet of its hands thrust up for the Eureka. */
const HANDS_UP = 2.15;

/** Metres from a foe's feet to its middle, for the lock-on mark. */
const KIND_MID: Record<FoeKind, number> = { ddl: 2.6, procrastination: 1.2, distraction: 1.4, plagiarism: 1.5, anxiety: 1.8, exam: 5 };
