// The book game on the map: the books, the Deadline that comes after the walker, and the ring round
// a walker that has turned the chase. The rules are in shared/game.ts; this draws them and gives
// them the walker, the ground and the walking map. Everything here is made up and looks it: bright
// toys with a beam of light over each book, and a red alarm clock that floats over the roofs. None
// of it is campus data, and none of it can be picked or opened.
import { BoxGeometry, CircleGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, SphereGeometry, TorusGeometry, type Material } from "three";
import type { Pt } from "../shared/geo.ts";
import { BookGame, GAME, bearingTo, bookSpot, reachable, type BookDraw, type GameEvent } from "../shared/game.ts";
import type { RoofMap } from "../shared/roofmap.ts";
import type { Building } from "../shared/types.ts";
import type { WalkMap } from "../shared/walkmap.ts";
import type { WalkGrid } from "../shared/walkpath.ts";
import type { LabelSpec } from "./labels.ts";
import type { WalkerState } from "./walkers.ts";

/** What the scene lends the game. */
export interface GameSceneHost {
  groundAt(x: number, y: number): number;
  walkMap(): WalkMap | undefined;
  roofs(): RoofMap | undefined;
  buildings(): readonly Building[];
  walker(name: string): WalkerState | undefined;
}

/** What the panel shows of a game. */
export interface GameView {
  phase: "play" | "over";
  /** Why the clock is stopped: the walker is inside a building, or flying. */
  paused?: "indoor" | "fly";
  score: number;
  level: number;
  lives: number;
  eaten: number;
  need: number;
  /** Seconds the chase stays turned round; 0 when the Deadline chases. */
  power: number;
  /** Metres from the walker to the Deadline. */
  distance: number;
  /** Degrees clockwise from the way the walker faces to the Deadline. */
  bearing: number;
  /** What happened since the panel last asked. */
  events: GameEvent[];
}

/** Metres: half the side of the ground the books are laid on, round the walker. */
const FIELD = 300;
/** Metres the walker goes from the middle of that ground before it is worked out again. */
const FIELD_KEEP = 140;
/** Metres over the ground, or over a roof, that the Deadline floats. */
const FLOAT = 0.7;
/** Books kept within `CLOSE_REACH` metres of the walker, so that there is always one to go for. */
const CLOSE_BOOKS = 12;
const CLOSE_REACH = 75;
/** Metres from the walker at which a building draws half the books it would beside it. */
const DRAW_HALF = 110;
/** Metres over the ground that a book hangs. */
const BOOK_UP = 1.5;
/** The books' covers: the project's own bright colours, none a university's. */
const COVERS = [0xff5d73, 0x39c6a5, 0xffb454, 0x6c8cff, 0xc77dff];
const RED = 0xe5383b;
const SCARED = 0x6aa9ff;

class BookMesh {
  readonly root = new Group();
  private spin = new Group();
  constructor(
    readonly id: number,
    readonly at: Pt,
    private ground: number,
    parts: { cover: BoxGeometry; pages: BoxGeometry; beam: CylinderGeometry; coverMat: Material; pagesMat: Material; beamMat: Material },
    private phase: number,
  ) {
    const cover = new Mesh(parts.cover, parts.coverMat);
    const pages = new Mesh(parts.pages, parts.pagesMat);
    pages.position.z = 0.07;
    this.spin.add(cover, pages);
    this.spin.rotation.z = 0.18;
    const beam = new Mesh(parts.beam, parts.beamMat);
    beam.position.y = 8.2;
    this.root.add(this.spin, beam);
    this.root.position.set(at[0], ground + BOOK_UP, -at[1]);
  }

  /** Puts it on the ground again, after the ground changed. */
  settle(ground: number): void {
    this.ground = ground;
  }

  turn(seconds: number): void {
    this.spin.rotation.y = seconds * 1.6 + this.phase;
    this.root.position.y = this.ground + BOOK_UP + Math.sin(seconds * 2.2 + this.phase) * 0.14;
  }
}

/** The books, the Deadline and the ring, and the game they draw. */
export class GameWorld {
  readonly group = new Group();
  /** Bumped when the labels must be built again: the game started or stopped, or the chase turned. */
  labelsVersion = 0;
  /** Whether the buildings' names are left off the walker's view while the game is on: on a phone. */
  quiet = false;
  private game?: BookGame;
  private name = "";
  private words = { deadline: "Deadline", fleeing: "Deadline" };
  private books = new Map<number, BookMesh>();
  private field?: { grid: WalkGrid; reached: Uint8Array; draws: BookDraw[]; centre: Pt };
  private events: GameEvent[] = [];
  private paused?: "indoor" | "fly";
  private seconds = 0;
  private label: LabelSpec = { id: "game:deadline", x: 0, y: 0, z: 0, text: "", priority: 9.5e6, className: "lbl-deadline" };

  // One of each shape and colour, shared by every book.
  private coverGeo = new BoxGeometry(0.42, 1.7, 1.3);
  private pagesGeo = new BoxGeometry(0.3, 1.56, 1.26);
  private beamGeo = new CylinderGeometry(0.16, 0.4, 14, 12, 1, true);
  private pagesMat = new MeshLambertMaterial({ color: 0xfffaf0, emissive: 0xfffaf0, emissiveIntensity: 0.35 });
  private coverMats = COVERS.map((c) => new MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.45 }));
  private beamMats = COVERS.map((c) => new MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5, depthWrite: false }));

  private clock = new Group();
  private clockMat = new MeshLambertMaterial({ color: RED, emissive: RED, emissiveIntensity: 0.4 });
  private clockHands: Mesh[] = [];
  private clockHeight = 0;
  private ring: Mesh;
  private ringMat = new MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.85, depthWrite: false });
  private made: { geometry: { dispose(): void } }[] = [];

  constructor(private host: GameSceneHost) {
    this.group.userData.noPick = true;
    this.group.visible = false;
    this.buildClock();
    this.ring = new Mesh(new TorusGeometry(1.15, 0.09, 8, 40), this.ringMat);
    this.ring.rotation.x = Math.PI / 2;
    this.ring.visible = false;
    this.made.push(this.ring);
    this.group.add(this.clock, this.ring);
  }

  /** A red alarm clock with a cross face: two bells, two feet, hands that race. It faces along +z. */
  private buildClock(): void {
    const add = (mesh: Mesh, x: number, y: number, z: number): Mesh => {
      mesh.position.set(x, y, z);
      this.clock.add(mesh);
      this.made.push(mesh);
      return mesh;
    };
    const dark = new MeshBasicMaterial({ color: 0x1a1206 });
    const white = new MeshLambertMaterial({ color: 0xfffdf6, emissive: 0xfffdf6, emissiveIntensity: 0.55 });
    const body = add(new Mesh(new CylinderGeometry(1.5, 1.5, 0.7, 40), this.clockMat), 0, 0, 0);
    body.rotation.x = Math.PI / 2;
    add(new Mesh(new CircleGeometry(1.22, 40), white), 0, 0, 0.36);
    // Bells and the hammer between them.
    add(new Mesh(new SphereGeometry(0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.clockMat), -0.95, 1.2, 0).rotation.z = 0.6;
    add(new Mesh(new SphereGeometry(0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.clockMat), 0.95, 1.2, 0).rotation.z = -0.6;
    add(new Mesh(new BoxGeometry(0.16, 0.5, 0.16), dark), 0, 1.7, 0);
    // Feet.
    add(new Mesh(new CylinderGeometry(0.12, 0.16, 0.6, 10), dark), -0.85, -1.55, 0).rotation.z = -0.5;
    add(new Mesh(new CylinderGeometry(0.12, 0.16, 0.6, 10), dark), 0.85, -1.55, 0).rotation.z = 0.5;
    // A cross face: eyes under slanted brows.
    add(new Mesh(new CircleGeometry(0.15, 16), dark), -0.48, 0.3, 0.38);
    add(new Mesh(new CircleGeometry(0.15, 16), dark), 0.48, 0.3, 0.38);
    add(new Mesh(new BoxGeometry(0.62, 0.13, 0.02), dark), -0.5, 0.62, 0.38).rotation.z = -0.42;
    add(new Mesh(new BoxGeometry(0.62, 0.13, 0.02), dark), 0.5, 0.62, 0.38).rotation.z = 0.42;
    // The hands turn about the middle of the face, a little under the eyes.
    for (const [length, width] of [
      [0.8, 0.09],
      [0.55, 0.13],
    ] as const) {
      const geometry = new BoxGeometry(width, length, 0.02);
      geometry.translate(0, length / 2, 0);
      this.clockHands.push(add(new Mesh(geometry, dark), 0, -0.3, 0.385));
    }
    add(new Mesh(new CircleGeometry(0.1, 12), dark), 0, -0.3, 0.39);
  }

  get on(): boolean {
    return !!this.game;
  }

  /**
   * Starts a game for the walker called `name`. `words` are the Deadline's names in the visitor's
   * language: as it chases, and as it flees. `quiet` leaves the buildings' names off the walker's
   * view meanwhile. False when the walker or the walking map is not there.
   */
  start(name: string, words: { deadline: string; fleeing: string }, quiet = false): boolean {
    this.stop();
    this.quiet = quiet;
    const walker = this.host.walker(name);
    if (!walker || !this.host.walkMap()) return false;
    this.name = name;
    this.words = words;
    this.events = [];
    this.seconds = 0;
    this.game = new BookGame({ spot: (near, taken) => this.spot(near, taken), random: Math.random }, walker.at);
    const at = this.game.deadline.at;
    this.clockHeight = this.floatAt(at);
    this.group.visible = true;
    this.sync(walker);
    this.labelsVersion++;
    return true;
  }

  stop(): void {
    if (!this.game) return;
    this.game = undefined;
    this.field = undefined;
    for (const b of this.books.values()) this.group.remove(b.root);
    this.books.clear();
    this.ring.visible = false;
    this.group.visible = false;
    this.labelsVersion++;
  }

  /** What the panel shows, with what happened since it last asked. */
  view(): GameView | undefined {
    const g = this.game;
    const walker = this.host.walker(this.name);
    if (!g || !walker) return undefined;
    const events = this.events;
    this.events = [];
    return {
      phase: g.phase,
      paused: g.phase === "play" ? this.paused : undefined,
      score: g.score,
      level: g.level,
      lives: g.lives,
      eaten: g.eaten,
      need: GAME.booksToPower,
      power: g.power,
      distance: Math.hypot(g.deadline.at[0] - walker.at[0], g.deadline.at[1] - walker.at[1]),
      bearing: (bearingTo(walker.at, g.deadline.at) - walker.heading + 360) % 360,
      events,
    };
  }

  /** The game as it stands, for tests: where the books and the Deadline are, and the score. */
  state(): { phase: "play" | "over"; books: Pt[]; deadline: Pt; score: number; level: number; lives: number; eaten: number; power: number } | undefined {
    const g = this.game;
    if (!g) return undefined;
    return { phase: g.phase, books: g.books.map((b) => b.at), deadline: g.deadline.at, score: g.score, level: g.level, lives: g.lives, eaten: g.eaten, power: g.power };
  }

  /** The Deadline's name over it. */
  labels(): LabelSpec[] {
    return this.game ? [this.label] : [];
  }

  /** Moves the game on by `dt` seconds. True while a game is on: its books turn in every frame. */
  step(dt: number, now: number): boolean {
    const g = this.game;
    if (!g) return false;
    const walker = this.host.walker(this.name);
    if (!walker) {
      this.stop();
      return true;
    }
    this.paused = walker.indoor ? "indoor" : walker.ride === "fly" ? "fly" : undefined;
    this.events.push(...g.step(dt, walker.at, !this.paused, walker.ride === "scooter" ? GAME.scooterPace : 1));
    if (!this.paused && g.phase === "play") this.seconds += dt;
    this.sync(walker, dt, now / 1000);
    return true;
  }

  /** Puts everything on the ground again, after the ground or the buildings changed. */
  refresh(): void {
    this.field = undefined;
    for (const b of this.books.values()) b.settle(this.host.groundAt(b.at[0], b.at[1]));
  }

  dispose(): void {
    this.stop();
    for (const m of this.made) m.geometry.dispose();
    for (const g of [this.coverGeo, this.pagesGeo, this.beamGeo]) g.dispose();
    for (const m of [this.pagesMat, this.clockMat, this.ringMat, ...this.coverMats, ...this.beamMats]) m.dispose();
  }

  /** Metres above sea level at which the Deadline floats over a point: over the ground, or over a roof. */
  private floatAt(p: Pt): number {
    return Math.max(this.host.groundAt(p[0], p[1]), this.host.roofs()?.at(p) ?? -Infinity) + FLOAT;
  }

  /** Somewhere to lay a book: on ground the walker can get to, beside a building with rooms to teach in. */
  private spot(near: Pt, taken: readonly Pt[]): Pt | undefined {
    const map = this.host.walkMap();
    if (!map) return undefined;
    let f = this.field;
    if (!f || Math.hypot(near[0] - f.centre[0], near[1] - f.centre[1]) > FIELD_KEEP) {
      const grid = map.grid([near[0] - FIELD, near[1] - FIELD, near[0] + FIELD, near[1] + FIELD], 2);
      const inField = (b: Building) => !b.offMap && Math.abs(b.center[0] - near[0]) < FIELD - 40 && Math.abs(b.center[1] - near[1]) < FIELD - 40;
      const all = this.host.buildings().filter(inField);
      // Buildings with teaching rooms draw the books, more of them the more rooms they have; where
      // the map names no rooms, every building draws alike.
      const teaching = all.filter((b) => b.roomCount > 0);
      const draws = (teaching.length ? teaching : all).map((b) => {
        const far = Math.hypot(b.center[0] - near[0], b.center[1] - near[1]) / DRAW_HALF;
        return { center: b.center, weight: (1 + Math.sqrt(b.roomCount)) / (1 + far * far) };
      });
      f = this.field = { grid, reached: reachable(grid, near), draws, centre: [near[0], near[1]] };
    }
    // A few books stay close to the walker; the rest lie beside the buildings.
    const close = taken.filter((t) => Math.hypot(t[0] - near[0], t[1] - near[1]) <= CLOSE_REACH).length;
    const beside = close < CLOSE_BOOKS ? bookSpot(f.grid, f.reached, [], near, taken, Math.random, CLOSE_REACH) : undefined;
    return beside ?? bookSpot(f.grid, f.reached, f.draws, near, taken, Math.random) ?? bookSpot(f.grid, f.reached, [], near, taken, Math.random);
  }

  /** Draws the game as it stands. */
  private sync(walker: WalkerState, dt = 0, seconds = 0): void {
    const g = this.game!;
    // Books: those eaten go, those laid come.
    const out = new Set(g.books.map((b) => b.id));
    for (const [id, mesh] of this.books) {
      if (out.has(id)) continue;
      this.group.remove(mesh.root);
      this.books.delete(id);
    }
    for (const b of g.books) {
      if (this.books.has(b.id)) continue;
      const k = b.id % COVERS.length;
      const mesh = new BookMesh(
        b.id,
        b.at,
        this.host.groundAt(b.at[0], b.at[1]),
        { cover: this.coverGeo, pages: this.pagesGeo, beam: this.beamGeo, coverMat: this.coverMats[k]!, pagesMat: this.pagesMat, beamMat: this.beamMats[k]! },
        b.id * 1.7,
      );
      this.books.set(b.id, mesh);
      this.group.add(mesh.root);
    }
    for (const mesh of this.books.values()) mesh.turn(seconds);

    // The Deadline: over the ground and the roofs, its face to the walker; pale and shaking as it flees.
    const at = g.deadline.at;
    const want = this.floatAt(at);
    const rise = 9 * dt;
    this.clockHeight = dt > 0 ? this.clockHeight + Math.max(-rise, Math.min(rise, want - this.clockHeight)) : want;
    const fleeing = g.power > 0;
    // In its last seconds of fleeing it flickers back to red.
    const turning = fleeing && g.power < 3 && Math.floor(seconds * 6) % 2 === 0;
    const colour = fleeing && !turning ? SCARED : RED;
    this.clockMat.color.setHex(colour);
    this.clockMat.emissive.setHex(colour);
    const shake = fleeing ? Math.sin(seconds * 40) * 0.08 : 0;
    this.clock.position.set(at[0] + shake, this.clockHeight + 1.9 + Math.sin(seconds * 3) * 0.15, -at[1]);
    this.clock.rotation.y = Math.atan2(walker.at[0] - at[0], -(walker.at[1] - at[1]));
    this.clock.rotation.z = fleeing ? 0 : Math.sin(seconds * 9) * 0.06;
    this.clock.visible = g.phase === "play" || Math.floor(seconds * 2) % 2 === 0;
    this.clockHands[0]!.rotation.z = -seconds * 5;
    this.clockHands[1]!.rotation.z = -seconds * 0.6;
    this.label.x = at[0];
    this.label.y = this.clock.position.y + 2.6;
    this.label.z = -at[1];
    // The labels are compared with the ones before by their object, so new words are a new label.
    const text = fleeing ? this.words.fleeing : this.words.deadline;
    if (text !== this.label.text) {
      this.label = { ...this.label, text, className: fleeing ? "lbl-deadline fleeing" : "lbl-deadline" };
      this.labelsVersion++;
    }

    // The ring round a walker that has turned the chase.
    this.ring.visible = fleeing && !walker.indoor;
    if (this.ring.visible) {
      const pulse = 1 + Math.sin(seconds * 8) * 0.12;
      this.ring.scale.set(pulse, pulse, 1);
      this.ring.position.set(walker.at[0], walker.height + 0.25, -walker.at[1]);
      this.ringMat.opacity = g.power < 3 ? 0.35 + 0.5 * Math.abs(Math.sin(seconds * 8)) : 0.85;
    }
  }
}
