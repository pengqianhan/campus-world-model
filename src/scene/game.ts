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
  PLAYER,
  QUEST,
  RANKS,
  SKILLS,
  StudyQuest,
  bearingTo,
  bookSpot,
  reachable,
  type BookDraw,
  type Debrief,
  type Foe,
  type FoeKind,
  type GameEvent,
  type ItemKind,
  type Place,
  type QuestKey,
  type SkillId,
} from "../shared/game.ts";
import type { RoofMap } from "../shared/roofmap.ts";
import type { Building } from "../shared/types.ts";
import type { WalkMap } from "../shared/walkmap.ts";
import type { WalkGrid } from "../shared/walkpath.ts";
import { Arena, Burst, Missiles, Shadows, Slash, Sparks, Telegraphs, yawOf } from "./gameFx.ts";
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

/** What the panel shows of a game, ten times a second. */
export interface GameView {
  phase: "play" | "over";
  /** Why the clock is stopped: the walker is inside a building, or flying. */
  paused?: "indoor" | "fly";
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
  /** Hits in a row. */
  chain: number;
  slowed: boolean;
  locked: boolean;
  seconds: number;
  defeated: number;
  /** Kinds met so far. */
  met: FoeKind[];
  events: GameEvent[];
  debrief?: Debrief;
}

/** Metres: half the side of the ground the pick-ups are laid on, round the walker. */
const FIELD = 300;
const FIELD_KEEP = 140;
const CLOSE_ITEMS = 12;
const CLOSE_REACH = 75;
const DRAW_HALF = 110;
const ITEM_UP = 1.5;
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

/** Makes a material take a per-instance tint (`aTint`): white for a blow's flash, red for a warning. */
function tinted<T extends Material>(m: T, lit: boolean): T {
  m.onBeforeCompile = (s) => {
    s.vertexShader = "attribute vec3 aTint;\nvarying vec3 vTint;\n" + s.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvTint = aTint;");
    s.fragmentShader =
      "varying vec3 vTint;\n" +
      (lit
        ? s.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vTint + vColor.rgb * 0.18;")
        : s.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb += vTint;"));
  };
  m.customProgramCacheKey = () => (lit ? "study-quest-lit" : "study-quest-glow");
  return m;
}

/** One instanced mesh of a kind's model, with its tint. */
interface Layer {
  mesh: InstancedMesh;
  tint: InstancedBufferAttribute;
  part?: { name: string; pivot: [number, number, number] };
}

class KindView {
  readonly model: Model;
  readonly layers: Layer[] = [];
  n = 0;

  constructor(
    readonly kind: FoeKind,
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
      const mesh = new InstancedMesh(geo, mat, cap);
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      mesh.count = 0;
      mesh.visible = false;
      mesh.frustumCulled = false;
      mesh.castShadow = mesh.receiveShadow = false;
      group.add(mesh);
      this.layers.push({ mesh, tint, part });
    };
    add(this.model.body, lit);
    add(this.model.glow, glow);
    for (const p of this.model.parts) add(p.geo, p.glow ? glow : lit, { name: p.name, pivot: p.pivot });
  }

  begin(): void {
    this.n = 0;
  }

  /** One foe: its matrix, its tint, and how its parts are turned. */
  put(base: Matrix4, tint: Color, local: (name: string, out: Matrix4) => void): void {
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
    }
  }

  end(): void {
    for (const l of this.layers) {
      l.mesh.count = this.n;
      l.mesh.visible = this.n > 0;
      if (this.n) {
        l.mesh.instanceMatrix.needsUpdate = true;
        l.tint.needsUpdate = true;
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
  /** Fewer sparks, and no shaking of the view. */
  reducedMotion = false;
  /** Told of each thing that happens, in the frame it happens: for the sound. */
  onEvent?: (e: GameEvent) => void;
  private quest?: StudyQuest;
  private name = "";
  private words?: GameWords;
  private field?: { grid: WalkGrid; reached: Uint8Array; draws: (BookDraw & { b: Building })[]; centre: Pt };
  private events: GameEvent[] = [];
  private paused?: "indoor" | "fly";
  private seconds = 0;
  private trauma = 0;
  private heights = new Map<number, number>();
  private kinds: Record<FoeKind, KindView>;
  private items = new ItemsView();
  private sparks = new Sparks();
  private tells = new Telegraphs();
  private shadows = new Shadows();
  private missiles = new Missiles();
  private slash = new Slash();
  private burst = new Burst();
  private arena = new Arena();
  private lit = tinted(new MeshLambertMaterial({ vertexColors: true, emissive: 0x1c1c22 }), true);
  private glow = tinted(new MeshBasicMaterial({ vertexColors: true }), false);
  private overlay?: GameOverlay;
  private camYaw = 0;
  private trailT = 0;
  /** Metres the view stands back, more while the boss is out, so that the whole of it is seen. */
  private pull = 0;

  constructor(
    private host: GameSceneHost,
    overlayParent?: HTMLElement,
  ) {
    this.group.userData.noPick = true;
    this.group.visible = false;
    this.kinds = Object.fromEntries(FOE_KINDS.map((k) => [k, new KindView(k, this.lit, this.glow, this.group)])) as Record<FoeKind, KindView>;
    this.group.add(this.items.group, this.sparks.mesh, this.tells.group, this.shadows.mesh, this.missiles.group, this.slash.group, this.burst.mesh, this.arena.mesh);
    if (overlayParent) this.overlay = new GameOverlay(overlayParent);
  }

  get on(): boolean {
    return !!this.quest;
  }

  /**
   * Starts a game for the walker called `name`. `words` are what it shows in the visitor's language.
   * `quiet` leaves the buildings' names off the walker's view meanwhile; `compact` keeps the marks over
   * the picture few, for a phone. False when the walker or the walking map is not there.
   */
  start(name: string, words: GameWords, quiet = false, compact = false): boolean {
    this.stop();
    this.quiet = quiet;
    const walker = this.host.walker(name);
    if (!walker || !this.host.walkMap()) return false;
    this.name = name;
    this.words = words;
    this.events = [];
    this.seconds = 0;
    this.trauma = 0;
    this.menuPaused = false;
    this.heights.clear();
    this.quest = new StudyQuest({ spot: (near, taken, place) => this.spot(near, taken, place), place: (near, avoid, big) => this.place(near, avoid, big), random: Math.random }, walker.at);
    this.events.push(...this.drainStart());
    this.sparks.density = this.reducedMotion ? 0.4 : 1;
    this.group.visible = true;
    this.overlay?.show(true);
    this.overlay?.root.classList.toggle("compact", compact);
    this.overlay?.root.classList.toggle("rm", this.reducedMotion);
    this.sync(walker, 0);
    this.labelsVersion++;
    return true;
  }

  /** The quests the game opened with, for the panel. */
  private drainStart(): GameEvent[] {
    return this.quest!.quests.map((quest) => ({ type: "quest" as const, quest, done: false }));
  }

  stop(): void {
    if (!this.quest) return;
    this.host.paceScale(this.name, 1);
    this.quest = undefined;
    this.field = undefined;
    this.pull = 0;
    this.group.visible = false;
    this.sparks.clear();
    this.arena.hide();
    this.overlay?.show(false);
    this.labelsVersion++;
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

  /** Metres to add to the view's distance behind the walker, and degrees to its height: a boss camera. */
  viewPull(): { distance: number; elevation: number } {
    return { distance: this.pull, elevation: this.pull * 1.1 };
  }

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
    return {
      phase: g.phase,
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
      chain: g.chain,
      slowed: g.slowT > 0,
      locked: g.lock !== undefined,
      seconds: g.seconds,
      defeated: g.defeated,
      met: [...g.met],
      events,
      debrief: g.phase === "over" ? g.debrief() : undefined,
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

  /** Moves the game on by `dt` seconds. True while a game is on: it is drawn in every frame. */
  step(dt: number, _now?: number): boolean {
    const g = this.quest;
    if (!g) return false;
    const walker = this.host.walker(this.name);
    if (!walker) {
      this.stop();
      return true;
    }
    this.paused = walker.indoor ? "indoor" : walker.ride === "fly" ? "fly" : undefined;
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
    for (const e of evs) this.effect(e, me);
    this.events.push(...evs);
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    const wantPull = g.arena?.active && g.boss ? 4.5 : 0;
    this.pull += (wantPull - this.pull) * Math.min(1, dt * 1.5);
    this.sync(me, frozen && this.menuPaused ? 0 : dt);
    return true;
  }

  /** Puts everything on the ground again, after the ground or the buildings changed. */
  refresh(): void {
    this.field = undefined;
    this.heights.clear();
  }

  dispose(): void {
    this.stop();
    for (const k of Object.values(this.kinds)) k.dispose();
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
    if (place) return bookSpot(f.grid, f.reached, [{ center: place, weight: 1 }], near, taken, Math.random) ?? undefined;
    const close = taken.filter((t) => Math.hypot(t[0] - near[0], t[1] - near[1]) <= CLOSE_REACH).length;
    const beside = close < CLOSE_ITEMS ? bookSpot(f.grid, f.reached, [], near, taken, Math.random, CLOSE_REACH) : undefined;
    return beside ?? bookSpot(f.grid, f.reached, f.draws, near, taken, Math.random) ?? bookSpot(f.grid, f.reached, [], near, taken, Math.random);
  }

  /**
   * A place for a quest: reachable ground beside a building with rooms to teach in, 60 to 260 m off,
   * away from the other quests' places. `big`: the building with the most rooms, for the last fight.
   */
  private place(near: Pt, avoid: readonly Pt[], big = false): Place | undefined {
    const f = this.fieldAt(near);
    if (!f || !this.words) return undefined;
    const ok = f.draws.filter((d) => {
      const far = Math.hypot(d.center[0] - near[0], d.center[1] - near[1]);
      return far >= 50 && far <= 260 && avoid.every((a) => Math.hypot(a[0] - d.center[0], a[1] - d.center[1]) > 60);
    });
    const pool = ok.length ? ok : f.draws;
    if (!pool.length) {
      const at = bookSpot(f.grid, f.reached, [], near, [], Math.random, 160);
      return at ? { name: this.words.open, at } : undefined;
    }
    const d = big ? pool.reduce((a, b) => (b.b.roomCount > a.b.roomCount ? b : a)) : pool[Math.floor(Math.random() * pool.length)]!;
    const at = bookSpot(f.grid, f.reached, [{ center: d.center, weight: 1 }], near, [], Math.random) ?? d.center;
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
        this.slash.swing(e.combo, e.dir);
        if (e.combo === 2) this.sparks.ring(sx, sy + 0.3, sz, 10, 6, ACCENT, 0.1);
        break;
      case "hit": {
        const h = this.footOf(e.foe) + 1.4;
        this.sparks.burst(e.at[0], h, -e.at[1], e.heavy || e.crit ? 16 : 9, e.heavy ? 9 : 6, e.crit ? 0xffd54a : 0xfff1d0, 0.11, 0.45, 8);
        this.sparks.burst(e.at[0], h, -e.at[1], 4, 3, HUE[e.kind], 0.16, 0.5, 2);
        o?.number(e.at[0], h + 1, -e.at[1], String(e.amount), e.crit ? "crit" : e.heavy ? "heavy" : "");
        o?.hit(e.at[0], h, -e.at[1], false, cam, width, height);
        this.trauma = Math.min(1, this.trauma + (e.heavy || e.crit ? 0.28 : 0.14));
        break;
      }
      case "kill": {
        const h = this.footOf(e.foe) + 1.2;
        const big = e.kind === "exam" ? 3 : e.kind === "ddl" ? 2 : 1;
        this.sparks.burst(e.at[0], h, -e.at[1], 26 * big, 8 * big, HUE[e.kind], 0.18, 0.9, 5);
        this.sparks.burst(e.at[0], h, -e.at[1], 12 * big, 5, 0xffffff, 0.1, 0.6, 3);
        this.sparks.ring(e.at[0], h - 1, -e.at[1], 18, 7 * big, HUE[e.kind], 0.16);
        o?.number(e.at[0], h + 1.6, -e.at[1], `+${e.xp}`, "xp");
        o?.hit(e.at[0], h, -e.at[1], true, cam, width, height);
        this.trauma = Math.min(1, this.trauma + 0.2 * big);
        break;
      }
      case "hurt":
        o?.hurt(bearingTo(me.at, e.from));
        this.sparks.burst(sx, sy + 1.2, sz, 10, 5, 0xff3b30, 0.1, 0.5, 6);
        this.trauma = Math.min(1, this.trauma + 0.38);
        break;
      case "evade":
        o?.number(sx, sy + 2.3, sz, "✦", "evade");
        break;
      case "dodge":
        this.trailT = e.sprint ? 0.4 : 0.3;
        break;
      case "eureka":
        this.burst.fire(PLAYER.eurekaRadius);
        this.sparks.ring(sx, sy + 0.4, sz, 36, 14, 0xffc970, 0.2);
        this.sparks.burst(sx, sy + 1, sz, 30, 10, 0xfff1d0, 0.14, 0.8, 4);
        o?.flash("eureka");
        this.trauma = Math.min(1, this.trauma + 0.5);
        break;
      case "rank":
        for (let k = 0; k < 3; k++) this.sparks.ring(sx, sy + 0.3 + k * 0.8, sz, 20, 4 + k, ACCENT, 0.14);
        this.sparks.burst(sx, sy + 1, sz, 30, 6, 0xfff1d0, 0.12, 1.2, -2);
        o?.flash("rank");
        break;
      case "phase":
        o?.flash("phase");
        this.trauma = 1;
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

  /** Metres above sea level of a foe's feet as last drawn. */
  private footOf(id: number): number {
    return this.heights.get(id) ?? this.host.walker(this.name)?.height ?? 0;
  }

  // -------------------------------------------------------------------------------------------
  // Drawing
  // -------------------------------------------------------------------------------------------

  private sync(walker: WalkerState, dt: number): void {
    const g = this.quest!;
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
    for (const k of FOE_KINDS) this.kinds[k].begin();
    this.shadows.begin();
    const plates: PlateIn[] = [];
    const tint = _tint;
    for (const f of g.foes) {
      const far = Math.hypot(f.at[0] - wx, f.at[1] - walker.at[1]);
      if (far > 180) continue;
      const kv = this.kinds[f.kind];
      const model = kv.model;
      // Over the ground and the roofs, rising and falling smoothly.
      const want = this.floatAt(f.at);
      const had = this.heights.get(f.id);
      const rise = 12 * dt;
      const foot = had === undefined || dt <= 0 ? want : had + Math.max(-rise, Math.min(rise, want - had));
      this.heights.set(f.id, foot);
      const phase = f.id * 1.37;
      let y = foot + model.float + Math.sin(t * (f.kind === "distraction" ? 6 : 2.2) + phase) * (f.kind === "distraction" ? 0.22 : 0.1);
      let scale = f.kind === "ddl" ? 1 + (f.tier - 1) * 0.25 : 1;
      let sx = 1;
      let sy = 1;
      let lean = 0;
      let roll = 0;
      let spin = 0;
      let jx = 0;
      let jz = 0;
      tint.setRGB(0, 0, 0);
      if (f.state === "rise") {
        const total = f.kind === "exam" ? 3.2 : 0.8;
        const k = Math.max(0, Math.min(1, 1 - f.t / total));
        const back = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
        scale *= Math.max(0.01, back);
        y -= (1 - k) * 2;
      } else if (f.state === "dead") {
        const k = Math.max(0, f.t / 0.7);
        scale *= Math.max(0.01, k);
        spin = (1 - k) * 7;
        y += (1 - k) * 1.5;
        tint.setRGB(1 - k, 1 - k, 1 - k);
      } else if (f.state === "tell" || f.state === "phase") {
        const pulse = 0.5 + 0.5 * Math.sin(t * 28);
        tint.setRGB(0.75 * pulse, 0.08 * pulse, 0);
        lean = f.kind === "exam" ? -0.08 : -0.22;
        jx = (Math.random() - 0.5) * (f.state === "phase" ? 0.4 : 0.1);
        jz = (Math.random() - 0.5) * (f.state === "phase" ? 0.4 : 0.1);
        if (f.kind === "ddl") roll = Math.sin(t * 45) * 0.12;
        if (f.kind === "procrastination") ((sx = 1.15), (sy = 0.85));
      } else if (f.state === "attack") {
        lean = 0.45;
      } else if (f.state === "stagger") {
        lean = -0.35;
      }
      if (f.state !== "dead" && f.hurtAgo < 0.14) {
        // A blow flashes it white; the boss, so big, only a little.
        const k = (1 - f.hurtAgo / 0.14) * (f.kind === "exam" ? 0.4 : 1);
        tint.setRGB(Math.max(tint.r, k), Math.max(tint.g, k), Math.max(tint.b, k));
        scale *= 1 + k * 0.08;
      }
      if (f.kind === "procrastination" && f.state === "chase") ((sx = 1 + Math.sin(t * 1.6 + phase) * 0.05), (sy = 1 - Math.sin(t * 1.6 + phase) * 0.05));
      if (f.kind === "anxiety" && f.state !== "dead") ((jx += (Math.random() - 0.5) * 0.06), (jz += (Math.random() - 0.5) * 0.06));
      if (f.kind === "ddl" && f.state === "chase") roll = Math.sin(t * 9 + phase) * 0.06;
      if (f.kind === "exam" && f.phase === 3 && f.state !== "dead") tint.r = Math.max(tint.r, 0.25 + 0.15 * Math.sin(t * 6));
      if (f.kind === "plagiarism") roll += Math.sin(t * 2.5 + phase) * 0.1;
      _p.set(f.at[0] + jx, y, -f.at[1] + jz);
      _q.setFromEuler(_e.set(lean, yawOf(f.facing) + spin, roll));
      _s.set(scale * sx, scale * sy, scale * sx);
      _b.compose(_p, _q, _s);
      kv.put(_b, tint, (name, out) => this.partPose(name, f, t, out));
      if (f.state !== "dead") this.shadows.add(f.at[0], foot, -f.at[1], FOES[f.kind].radius * (f.kind === "exam" ? 1.2 : 0.9) * scale);
      // Its plate: the big ones always; the small ones when near, or hurt.
      const elite = f.kind === "ddl" || f.kind === "exam";
      if (f.state !== "dead" && f.state !== "rise" && f.kind !== "exam" && (elite || far < 26 || f.hp < f.maxHp) && this.words) {
        plates.push({ id: f.id, x: f.at[0], y: y + model.height * scale + 0.5, z: -f.at[1], name: this.words.foes[f.kind], hp: f.hp, max: f.maxHp, elite, warn: f.state === "tell" });
      }
      // Trails and moods.
      if (dt > 0 && f.state !== "dead") {
        if (f.kind === "procrastination" && Math.random() < dt * 1.5) this.sparks.one(f.at[0] + 0.6, y + 2.6, -f.at[1], 0.3, 0.8, 0, 1.6, 0.12, 0xbfd8ff, -0.2);
        if (f.kind === "anxiety" && Math.random() < dt * 6) this.sparks.one(f.at[0], y + 1.5, -f.at[1], (Math.random() - 0.5) * 2, 1.2, (Math.random() - 0.5) * 2, 0.7, 0.14, 0x5b3dbb, -0.5);
        if (f.kind === "exam" && Math.random() < dt * 12) this.sparks.one(f.at[0] + (Math.random() - 0.5) * 3, y + 3 + Math.random() * 4, -f.at[1] + (Math.random() - 0.5) * 3, 0, 1.5, 0, 1.0, 0.12, 0xffb347, -0.3);
        if (f.state === "attack") this.sparks.burst(f.at[0], y + 1.2, -f.at[1], 2, 2, HUE[f.kind], 0.2, 0.4, 0);
      }
    }
    for (const k of FOE_KINDS) this.kinds[k].end();
    this.shadows.end();

    // Warnings on the ground, the boss's rings, and rings at the walker's feet.
    this.tells.begin();
    for (const tl of g.tells) {
      const h = this.host.groundAt(tl.at[0], tl.at[1]) + 0.18;
      const k = 1 - tl.t / tl.total;
      const blink = tl.t < 0.25 ? (Math.floor(t * 20) % 2 ? 1 : 0.4) : 1;
      if (tl.shape === "circle") {
        this.tells.ring({ x: tl.at[0], y: h, z: -tl.at[1], r: tl.radius, color: 0xff3b2f, alpha: 0.9 * blink });
        this.tells.disc({ x: tl.at[0], y: h - 0.01, z: -tl.at[1], r: tl.radius * k, color: 0xff3b2f, alpha: 0.55 });
      } else {
        this.tells.line({ x: tl.at[0], y: h, z: -tl.at[1], dir: tl.dir, length: tl.length, width: tl.width, color: 0xff3b2f, alpha: 0.45 * blink }, k);
      }
    }
    for (const w of g.waves) {
      const h = this.host.groundAt(w.at[0], w.at[1]) + 0.25;
      this.tells.ring({ x: w.at[0], y: h, z: -w.at[1], r: w.r, color: 0xff7a2f, alpha: 1 - w.r / w.max });
      this.tells.ring({ x: w.at[0], y: h + 0.4, z: -w.at[1], r: w.r - 0.3, color: 0xffc06a, alpha: 0.6 * (1 - w.r / w.max) });
    }
    if (g.eurekaMeter >= PLAYER.eurekaCharge && g.phase === "play") this.tells.ring({ x: wx, y: wy + 0.12, z: wz, r: 1.1 + Math.sin(t * 6) * 0.08, color: ACCENT, alpha: 0.9 });
    const locked = g.foes.find((f) => f.id === g.lock);
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
    this.slash.step(dt, wx, wy, wz);
    this.burst.step(dt, wx, wy, wz);
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
      this.overlay.frame(dt, cam, width, height, this.camYaw, plates, marks, lockAt, g.focus < g.stats.maxFocus * 0.3 && g.phase === "play", g.slowT > 0);
    }
  }

  /** How a moving part of a foe is turned now, about its pivot. */
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
      case "armL":
      case "armR": {
        const side = name === "armL" ? 1 : -1;
        let x = Math.sin(t * 1.4 + (side > 0 ? 0 : 1.5)) * 0.15;
        if (f.state === "tell" && (f.move?.type === "slam" || f.move?.type === "beams")) x = -2.4;
        else if (f.state === "tell" && f.move?.type === "orb") x = side > 0 ? -1.4 : 0.1;
        else if (f.state === "recover") x = 0.5;
        else if (f.state === "phase") x = -2.8 + Math.sin(t * 20) * 0.2;
        _q.setFromEuler(_e.set(x, 0, side * 0.12));
        out.makeRotationFromQuaternion(_q);
        return;
      }
      case "halo":
        out.makeRotationY(t * (f.phase === 3 ? 2.2 : 0.8));
        return;
      default:
        out.identity();
    }
  }
}

/** Metres from a foe's feet to its middle, for the lock-on mark. */
const KIND_MID: Record<FoeKind, number> = { ddl: 2.6, procrastination: 1.2, distraction: 1.4, plagiarism: 1.5, anxiety: 1.8, exam: 5 };
