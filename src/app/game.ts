// Study Quest, for the panel: a made-up action game the visitor starts from the walk. The walker
// grows by learning and fights made-up villains for study troubles. It is off until asked for, and
// it is a game laid over the map: no villain, book or quest is campus data, and none stands for a
// real class, course, person or due date. Progress is kept for the visit only; the best grade and
// the settings (sound, the music's and the effects' volumes, reduced motion, and the lessons the
// first minute has taught, so that a returning visitor is not taught again) are kept in this
// browser's storage, as conveniences, and nothing leaves the browser.
//
// This module, its sounds, the scene's game world and the game's panel are loaded the first time
// the Game button is pressed (gameState.ts): the rest of the site reads only gameState.ts.
import { batch, signal } from "@preact/signals";
import type { CampusScene } from "../scene/CampusScene.ts";
import { GameWorld, type GameAction, type GameWords } from "../scene/game.ts";
import { FOE_KINDS, LESSONS, QUEST, RANKS, type FoeKind, type GameEvent, type Quest } from "../shared/game.ts";
import { RADIO_STATIONS, audioStats, audioTap, release, resetMusic, setEngineSound, setMusic, setRadioStation, setSound, setVolumes, sfx, stinger, type Sfx } from "./gameAudio.ts";
import { gameMenu, gameOn, gameView, padSteer } from "./gameState.ts";
import { SHIFT_TAP, isShiftTap } from "../shared/locomotion.ts";
import { has, pick, t } from "./i18n.ts";
import "../ui/game.css";

export { gameMenu, gameOn, gameView };
/** The title card, until the visitor's first key, tap or click. */
export const gameTitle = signal(false);

export interface Banner {
  id: number;
  kind: "wave" | "rank" | "quest" | "phase" | "boss" | "foe" | "missionPass";
  title: string;
  sub?: string;
  quote?: string;
  /** The villain on a name card. */
  foe?: FoeKind;
  ms: number;
}
/** The big words high in the middle, one at a time: a wave coming, a rank risen, a quest done, a phase. */
export const gameBanner = signal<Banner | undefined>(undefined);
/** A villain's name card, low on the left; the big words wait while it is up. */
export const gameCard = signal<Banner | undefined>(undefined);
let cards: Banner[] = [];
let cardTimer = 0;
function nextCard(): void {
  cancelLater(cardTimer);
  const b = cards.shift();
  gameCard.value = b;
  if (b) cardTimer = later(nextCard, b.ms);
  // The words that waited for the card come after it.
  else if (!gameBanner.peek() && banners.length) nextBanner();
}
/** The feed down the right: villains beaten, things found. */
export const gameFeed = signal<{ id: number; text: string; value?: string; kind: string }[]>([]);
/** A new quest's line flashes in the tracker. */
export const gameQuestFlash = signal(0);

export interface GameSettings {
  sound: boolean;
  reducedMotion: boolean;
  /** The music's and the effects' volumes, 0 to 1. */
  music: number;
  effects: number;
  /** The lessons of the first minute this visitor has been taught (shared/game.ts LESSONS). */
  seen: string[];
}
const SETTINGS_KEY = "studyQuest.settings";
const BEST_KEY = "studyQuest.best";

function systemReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Whether the visitor has set reduced motion in the pause menu. Until then it follows the system's
 * setting each time a game starts, and is not stored: the lessons stored in the first minute must
 * not fix that day's system setting for good.
 */
let motionChosen = false;

function loadSettings(): GameSettings {
  const fallback = { sound: true, reducedMotion: systemReducedMotion(), music: 0.7, effects: 0.9, seen: [] as string[] };
  const level = (v: unknown, d: number) => (typeof v === "number" && v >= 0 && v <= 1 ? v : d);
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const s = JSON.parse(raw) as Partial<GameSettings>;
    motionChosen = typeof s.reducedMotion === "boolean";
    return {
      sound: s.sound !== false,
      reducedMotion: motionChosen ? s.reducedMotion! : fallback.reducedMotion,
      music: level(s.music, fallback.music),
      effects: level(s.effects, fallback.effects),
      seen: Array.isArray(s.seen) ? LESSONS.filter((l) => (s.seen as unknown[]).includes(l)) : [],
    };
  } catch {
    return fallback;
  }
}

export const gameSettings = signal<GameSettings>(loadSettings());

export function setGameSettings(next: Partial<GameSettings>): void {
  const s = { ...gameSettings.peek(), ...next };
  if (next.reducedMotion !== undefined) motionChosen = true;
  gameSettings.value = s;
  setSound(s.sound);
  setVolumes(s.music, s.effects);
  if (scene?.game) scene.game.reducedMotion = s.reducedMotion;
  try {
    const { reducedMotion: _motion, ...kept } = s;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(motionChosen ? s : kept));
  } catch {
    // Kept for this visit only.
  }
}

const GRADES = ["F", "D", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];
function loadBest(): { grade?: string; xp: number } {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const b = raw ? (JSON.parse(raw) as { grade?: string; xp?: number }) : {};
    return { grade: typeof b.grade === "string" && GRADES.includes(b.grade) ? b.grade : undefined, xp: typeof b.xp === "number" ? b.xp : 0 };
  } catch {
    return { xp: 0 };
  }
}
/** The best run in this browser: its grade and knowledge. */
export const gameBest = signal(loadBest());

function keepBest(grade: string, xp: number): boolean {
  const b = gameBest.peek();
  const better = !b.grade || GRADES.indexOf(grade) > GRADES.indexOf(b.grade) || (grade === b.grade && xp > b.xp);
  if (!better) return false;
  gameBest.value = { grade, xp };
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(gameBest.value));
  } catch {
    // Kept for this visit only.
  }
  return true;
}
/** Whether the last game beat the best before it. */
export const gameNewBest = signal(false);

let scene: CampusScene | undefined;
let timer = 0;

/**
 * The game's own clock, in ms: it stands still while a menu is up, the title card waits, or the
 * walker cannot play (indoors, in the air, on the map), so that the big words and the name cards
 * timed by it are not over unseen behind a pause. Read and its timers run in each poll (a tenth of a
 * second).
 */
let clockMs = 0;
let clockAt = 0;
let laterSeq = 1;
const laters = new Map<number, { at: number; fn: () => void }>();
/** Runs `fn` after `ms` of the game's clock. */
function later(fn: () => void, ms: number): number {
  const id = laterSeq++;
  laters.set(id, { at: clockMs + ms, fn });
  return id;
}
function cancelLater(id: number): void {
  laters.delete(id);
}
function tickClock(): void {
  const now = performance.now();
  const dt = clockAt ? Math.min(now - clockAt, 250) : 0;
  clockAt = now;
  const held = !!scene?.game?.menuPaused || !!gameView.peek()?.paused;
  if (!held) clockMs += dt;
  for (const [id, l] of [...laters]) {
    if (l.at > clockMs) continue;
    laters.delete(id);
    l.fn();
  }
}
let seq = 1;
let banners: Banner[] = [];
let bannerTimer = 0;
let pad = 0;
let stopKeys: (() => void) | undefined;
let flashTimer = 0;

export function questTitle(q: { key: string }): string {
  return t(`game.quest.${q.key}.title`);
}
export function questGoal(q: { key: string; place?: string | { name: string }; need: number }): string {
  const place = typeof q.place === "string" ? q.place : q.place?.name;
  return t(`game.quest.${q.key}.goal`, { need: q.need, place: place || t("game.openGround") });
}
export function rankName(rank: number): string {
  return t(`game.rank.${RANKS[rank]?.id ?? "fresher"}`);
}

/** Whether the game is played on a phone, where the big words are short (nextBanner). */
let compactHud = false;
const PHONE_BANNER_MS = 1800;

function banner(b: Omit<Banner, "id">): void {
  // A phase goes before what waits.
  if (b.kind === "phase") banners.unshift({ ...b, id: seq++ });
  else banners.push({ ...b, id: seq++ });
  if (banners.length > 4) banners = banners.slice(0, 4);
  if (!gameBanner.peek()) nextBanner();
}

/** The next of the big words, one at a time; none starts while a villain's name card is up. */
function nextBanner(): void {
  cancelLater(bannerTimer);
  const b = gameCard.peek() ? undefined : banners.shift();
  gameBanner.value = b;
  // On a phone they are a short line at the top, gone in under two seconds.
  if (b) bannerTimer = later(nextBanner, compactHud ? Math.min(b.ms, PHONE_BANNER_MS) : b.ms);
}

function feed(text: string, kind: string, value?: string): void {
  const line = { id: seq++, text, value, kind };
  gameFeed.value = [...gameFeed.peek().slice(-4), line];
  later(() => (gameFeed.value = gameFeed.peek().filter((l) => l.id !== line.id)), 4200);
}

const VEHICLE_LABELS: Record<string, string> = {
  sedan: "Executive Sedan",
  hatchback: "Hot Hatch",
  sports: "GT Sport Coupe",
  taxi: "Auckland Taxi",
  suv: "Crossover SUV",
  pickup: "Dual-Cab Ute",
  minivan: "People Mover",
  van: "Sprinter Van",
  bus: "City Link Bus",
  security: "Campus Security",
  scooter: "E-Scooter",
  mecha: "Mark-IV Exo-Suit",
};

const SUB_FALLBACKS: Record<string, string> = {
  "game.sub.groupProject.start": "Rival crew took our slides — meet me by the Quad!",
  "game.sub.pizzaOrdered": "Hot Slice Co. order slipped right into your pocket!",
};

function tr(key: string, fallback: string, params?: Record<string, string | number>): string {
  return has(key) ? t(key, params) : fallback;
}

/** Sounds, banners and the feed for what happened. */
function told(e: GameEvent): void {
  const world = scene?.game;
  switch (e.type) {
    case "take":
      if (e.kind === "pizza") {
        sfx("pizza");
        feed(t("game.feed.pizza"), "pizza", "+45 HP");
      } else if (e.kind === "cash") {
        sfx("cash");
        feed(t("game.phone.statCash"), "cash", `+$${e.value ?? 25}`);
      } else if (e.kind === "coffee") {
        sfx("coffee");
        feed(t("game.feed.coffee"), "take");
      } else {
        sfx("book");
        feed(t("game.card.mission"), "mission");
      }
      break;
    case "swing":
      sfx(`swing${e.combo}` as Sfx);
      break;
    case "hitHuman":
      sfx(world?.view()?.gta.weapon === "textbook" ? "textbook" : e.heavy ? "hitHeavy" : "punch");
      break;
    case "hitEnv":
      sfx(e.target === "vehicle" ? "crashLight" : e.heavy ? "hitHeavy" : "hit");
      break;
    case "drop":
      sfx("note");
      if (e.kind === "pizza") feed(t("game.feed.dropPizza"), "pizza");
      break;
    case "checkpoint":
      sfx("checkpoint");
      feed(t("game.feed.checkpoint"), "checkpoint", `${e.index + 1}/${e.total}`);
      break;
    case "job":
      if (e.state === "start") {
        sfx("quest");
        banner({ kind: "wave", title: t("game.card.mission"), sub: t(`game.jobs.${e.id}.title`), ms: 2200 });
      } else if (e.state === "stage") {
        sfx("checkpoint");
        feed(t(`game.jobs.${e.id}.title`), "mission");
      } else if (e.state === "pass") {
        sfx("missionPass");
        banner({
          kind: "missionPass",
          title: t("game.card.passed"),
          sub: `${t(`game.jobs.${e.id}.title`)} · ${t("game.card.rewardCash", { cash: e.cash ?? 0 })}`,
          ms: 3200,
        });
      } else if (e.state === "fail") {
        sfx("warn");
        banner({ kind: "wave", title: t("game.card.failed"), sub: t(`game.jobs.${e.id}.title`), ms: 2400 });
      }
      break;
    case "vehicle":
      if (e.action === "enter") {
        if (e.kind === "mecha") {
          sfx("eurekaReady");
          feed("Mark-IV Exo-Suit · Space/E Fly · Q/C Land", "mission");
        } else {
          sfx("vehicleEnter");
          feed(VEHICLE_LABELS[e.kind ?? "sedan"] ?? "Vehicle", "vehicle");
        }
      } else if (e.action === "exit") {
        sfx("vehicleExit");
      } else if (e.action === "crash") {
        sfx((e.speed ?? 0) >= 8 ? "crashHeavy" : "crashLight");
      } else if (e.action === "callScooter") {
        sfx("phoneChirp");
        feed(t("game.phone.callScooter"), "scooter");
      } else if (e.action === "callMecha") {
        sfx("eurekaReady");
        feed(t("game.phone.callMecha"), "mission");
      }
      break;
    case "radio":
      setRadioStation(e.station);
      sfx("uiMove");
      break;
    case "wanted":
      if (e.level > 0) sfx("wantedAlert");
      else if (e.evaded) {
        sfx("checkpoint");
        feed(t("game.hud.wantedLevel", { level: 0 }), "star");
      }
      break;
    case "subtitle":
      sfx("phoneChirp");
      break;
    case "hurt":
      sfx("hurt");
      break;
    case "evade":
      sfx("evade");
      break;
    case "dodge":
      sfx(e.sprint ? "sprint" : "dodge");
      break;
    case "card":
      sfx("card");
      break;
    case "eureka":
      sfx("eureka");
      break;
    case "rank":
      stinger("rank");
      banner({ kind: "rank", title: rankName(e.rank), sub: e.skill ? t("game.unlocked", { skill: t(`game.skill.${e.skill}.name`) }) : t("game.rankUpSub"), ms: 3000 });
      break;
    case "over": {
      if (!e.victory) {
        const busted = !!world?.state()?.busted;
        banner({ kind: "wave", title: t(busted ? "game.card.busted" : "game.card.wasted"), ms: 3000 });
      }
      stinger(e.victory ? "victory" : "defeat");
      break;
    }
    default:
      break;
  }
}

function poll(): void {
  tickClock();
  const v = scene?.game?.view();
  if (!v) {
    // Its walker left the map: the game went with it.
    stopGame();
    return;
  }
  const was = gameView.peek();
  const wasOver = was?.phase === "over";
  // The Eureka charged: a shimmer, once.
  if (was && was.eureka < 1 && v.eureka >= 1 && v.phase === "play") sfx("eurekaReady");
  const playingNow = gameMenu.peek() === "none" && !v.paused && v.phase === "play" && !gameTitle.peek();
  setEngineSound(
    !!v.gta.vehicle && playingNow,
    v.gta.vehicle?.kmh ?? 0,
    v.gta.vehicle?.rpm ?? 0.2,
    v.gta.vehicle?.kind === "scooter" || v.gta.vehicle?.kind === "mecha",
  );
  setMusic({
    t: performance.now() / 1000,
    title: gameTitle.peek(),
    over: v.phase === "over",
    boss: v.boss && v.boss.hp > 0 ? v.boss.phase : undefined,
    near: v.threat.near,
    ddl: v.threat.ddl,
    paused: gameMenu.peek() !== "none",
    low: v.phase === "play" && v.focus < v.maxFocus * 0.3,
  });
  if (v.phase === "over" && !wasOver && v.debrief) {
    gameNewBest.value = keepBest(v.debrief.grade, v.debrief.xp);
    gameMenu.value = "none";
    banners = [];
    cards = [];
    nextBanner();
    nextCard();
  }
  // A lesson taught is kept, so that a returning visitor is not taught it again.
  const seen = gameSettings.peek().seen;
  if (v.taught.some((l) => !seen.includes(l))) setGameSettings({ seen: [...new Set([...seen, ...v.taught])] });
  gameView.value = v;
}

/**
 * Whether Space jumps: on foot, out of doors and in the air of the game. Elsewhere it does what it
 * did before (flying, the drone climbs; on the scooter and indoors, the dodge).
 */
function jumpsHere(): boolean {
  const world = scene?.game;
  const v = gameView.peek();
  return !!world && !v?.paused && scene!.walkers.rideOf(world.walkerName) === "walk";
}

/**
 * The keys of the game, besides the walker's own: J or F strike, Space jumps, Shift tapped dodges
 * (held, the walk's own run), K or E throw, R the Eureka, Tab locks on, P pauses, C the record.
 */
function startKeys(): () => void {
  let shiftAt = -1;
  let shiftAlone = false;
  const up = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === "b") {
      scene?.game?.setDrivingControl({ horn: false });
      return;
    }
    if (k !== "shift") return;
    const held = shiftAt >= 0 ? (performance.now() - shiftAt) / 1000 : Infinity;
    const alone = shiftAlone;
    shiftAt = -1;
    if (!isShiftTap(held, alone) || gameMenu.peek() !== "none" || gameView.peek()?.phase !== "play") return;
    gameAct("dodge");
  };
  const down = (e: KeyboardEvent) => {
    const kk = e.key.toLowerCase();
    if (kk === "shift") {
      if (!e.repeat) ((shiftAt = performance.now()), (shiftAlone = true));
    } else shiftAlone = false;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (gameTitle.peek() && !e.repeat) dismissTitle();
    if (k === "p" && !e.repeat) {
      togglePause();
      return;
    }
    if (((k === "c" && gameView.peek()?.paused !== "fly" && !scene?.game?.inMecha()) || k === "i") && !e.repeat && gameView.peek()?.phase === "play") {
      setMenu(gameMenu.peek() === "sheet" ? "none" : "sheet");
      return;
    }
    if (gameMenu.peek() !== "none" || gameView.peek()?.phase !== "play") return;
    const world = scene?.game;
    if (!world) return;
    if (k === "f" && !e.repeat) {
      e.preventDefault();
      gameToggleVehicle();
      return;
    }
    if (k === "g" && !e.repeat) {
      e.preventDefault();
      const act = gameView.peek()?.gta.prompt?.action;
      if (act === "talk") gameInteract();
      else gameEatSlice();
      return;
    }
    if (k === "r" && !e.repeat) {
      e.preventDefault();
      gameCycleRadio();
      return;
    }
    if ((k === "q" || k === "1" || k === "2") && !world.inVehicle() && !e.repeat) {
      e.preventDefault();
      gameSwitchWeapon();
      return;
    }
    if (k === "b" && world.inVehicle()) {
      e.preventDefault();
      if (!e.repeat) sfx("horn");
      world.setDrivingControl({ horn: true });
      return;
    }
    if (world.inVehicle()) {
      if (world.inMecha() && (k === "j" || k === "k") && !e.repeat) {
        e.preventDefault();
        gameAct(k === "k" ? "heavy" : "strike");
      }
      return;
    }
    const map: Record<string, GameAction | "lock" | "jump"> = { j: "strike", k: "heavy", " ": "jump", e: "card", l: "eureka", tab: "lock" };
    let a = map[k];
    if (a === "jump" && !jumpsHere()) a = "dodge";
    if (!a) return;
    e.preventDefault();
    if (e.repeat && a !== "strike") return;
    gameAct(a);
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
  };
}

/** Triggers a nearby job giver, hustle stand, or pizza van. */
export function gameInteract(): boolean {
  const world = scene?.game;
  if (!world || gameMenu.peek() !== "none") return false;
  if (gameTitle.peek()) dismissTitle();
  return world.interact() || world.eatSlice();
}

/** Eats a stored pizza slice or buys/eats from the Slice Co. van. */
export function gameEatSlice(): boolean {
  const world = scene?.game;
  if (!world || gameMenu.peek() !== "none") return false;
  if (gameTitle.peek()) dismissTitle();
  return world.eatSlice();
}

/** Enters the nearest vehicle/scooter or exits the current one. */
export function gameToggleVehicle(): boolean {
  const world = scene?.game;
  if (!world || gameMenu.peek() !== "none") return false;
  if (gameTitle.peek()) dismissTitle();
  return world.toggleVehicle();
}

/** Cycles the Campus Radio station. */
export function gameCycleRadio(): number {
  const world = scene?.game;
  if (!world || gameMenu.peek() !== "none") return 0;
  const st = world.cycleRadio();
  setRadioStation(st);
  return st;
}

/** Switches between Fists and Textbook. */
export function gameSwitchWeapon(): "fists" | "textbook" {
  const world = scene?.game;
  if (!world || gameMenu.peek() !== "none") return "fists";
  const w = world.switchWeapon();
  sfx("uiMove");
  return w;
}

/** An action from any of the controls. */
export function gameAct(a: GameAction | "lock" | "jump"): void {
  const world = scene?.game;
  if (!world || gameMenu.peek() !== "none") return;
  if (gameTitle.peek()) dismissTitle();
  if (a === "lock") world.toggleLock();
  else if (a === "jump") world.jump();
  else world.act(a);
}

/**
 * A game pad, read in each frame while the game is on, laid out as action games lay theirs: the left
 * stick walks, A jumps, B tapped dodges and held runs, X strikes, Y throws, RT the Eureka, RB locks
 * on, Start pauses.
 */
let padWas: boolean[] = [];
let padStick = false;
/** When B went down, ms; -1 while it is up. */
let padB = -1;
function readPad(): void {
  const pads = navigator.getGamepads?.() ?? [];
  const p = Array.from(pads).find((x) => x && x.connected);
  // No pad: the loop stops, until one is connected (gamepadconnected).
  if (!p) {
    pad = 0;
    return;
  }
  pad = requestAnimationFrame(readPad);
  const press = (i: number) => !!p.buttons[i]?.pressed;
  const edge = (i: number) => press(i) && !padWas[i];
  if (edge(9)) togglePause();
  const playing = gameMenu.peek() === "none" && gameView.peek()?.phase === "play";
  if (playing) {
    if (edge(0)) gameAct("jump");
    if (edge(2)) gameAct("strike");
    if (edge(3)) gameAct("card");
    if (edge(7)) gameAct("eureka");
    if (edge(5)) gameAct("lock");
  }
  // B: tapped, the dodge as it is let go; held, a run.
  const now = performance.now();
  if (edge(1)) padB = now;
  const bHeld = press(1);
  if (!bHeld && padB >= 0) {
    if (playing && isShiftTap((now - padB) / 1000, true)) gameAct("dodge");
    padB = -1;
  }
  const run = bHeld && padB >= 0 && now - padB >= SHIFT_TAP * 1000;
  for (let i = 0; i < p.buttons.length; i++) padWas[i] = !!p.buttons[i]?.pressed;
  const x = p.axes[0] ?? 0;
  const y = p.axes[1] ?? 0;
  const dead = (v: number) => (Math.abs(v) < 0.18 ? 0 : (v - Math.sign(v) * 0.18) / 0.82);
  const fx = dead(-y);
  const tx = dead(x);
  if (fx || tx) {
    padStick = true;
    padSteer()?.(fx, tx, run);
  } else if (padStick) {
    padStick = false;
    padSteer()?.(0, 0);
  }
}

/** Reads the pad in each frame while the game is on and a pad is connected; not at all without one. */
function startPad(): void {
  cancelAnimationFrame(pad);
  pad = 0;
  if (gameOn.peek() && Array.from(navigator.getGamepads?.() ?? []).some((x) => x && x.connected)) pad = requestAnimationFrame(readPad);
}
window.addEventListener("gamepadconnected", startPad);

export function togglePause(): void {
  if (!gameOn.peek() || gameView.peek()?.phase !== "play") return;
  setMenu(gameMenu.peek() === "none" ? "pause" : "none");
}

export function setMenu(m: "none" | "pause" | "sheet"): void {
  gameMenu.value = m;
  if (scene?.game) scene.game.menuPaused = m !== "none";
  // A menu holds the walker still at once, even with a key or the stick still held; the walk's keys
  // take it on again when the menu shuts.
  if (m !== "none") padSteer()?.(0, 0);
  sfx("uiConfirm");
}

/** The title card goes at the visitor's first key, tap or click, and the game's clock starts. */
export function dismissTitle(): void {
  if (!gameTitle.peek()) return;
  gameTitle.value = false;
  if (scene?.game && gameMenu.peek() === "none") scene.game.menuPaused = false;
}

/**
 * Starts a game for the walker called `name`, or starts it again. `quiet` leaves the buildings' names
 * off the walker's view meanwhile; `compact` is for a phone. False when there is no such walker.
 */
/** The compass's points, north first and clockwise: their names are game.compass.* in the locale. */
const COMPASS_POINTS = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;

export function startGame(name: string, quiet = false, compact = false, title = true): boolean {
  const world = scene?.game;
  if (!world) return false;
  const words: GameWords = {
    foes: Object.fromEntries(FOE_KINDS.map((k) => [k, t(`game.foe.${k}.name`)])) as Record<FoeKind, string>,
    place: (b: { name: Parameters<typeof pick>[0] }) => pick(b.name),
    open: t("game.openGround"),
    compass: COMPASS_POINTS.map((p) => t(`game.compass.${p}`)),
    metres: (metres: number) => t("game.metres", { metres }),
    pizzaTake: `+${QUEST.pizzaFocus} ${t("game.hud.health")} · +${QUEST.pizzaEnergy} ${t("game.hud.armour")}`,
    zoneName: t("game.title"),
    vehicleName: (kind) => VEHICLE_LABELS[kind] ?? kind,
    promptText: (action, label) => {
      if (action === "suitUp") return t("game.hud.suitUp");
      if (action === "drive") return `${t("game.touch.interact")} · ${label ? (VEHICLE_LABELS[label] ?? label) : "Vehicle"}`;
      if (action === "ride") return VEHICLE_LABELS.scooter!;
      if (action === "exit") return t("game.touch.exit");
      if (action === "eat") return t("game.touch.slice");
      if (action === "buyPizza") return t("game.phone.orderPizza");
      return label || t("game.touch.interact");
    },
    radioInfo: (station) => {
      const info = RADIO_STATIONS[station] ?? RADIO_STATIONS[0]!;
      return { id: `st-${info.index}`, name: info.name, genre: info.genre, off: info.index === 0 };
    },
    objectiveText: (active, hasNextStory, nextJob) => {
      if (active) {
        const title = t(`game.jobs.${active.id}.title`);
        const stage = tr(`game.activity.${active.id}.${active.stage}`, active.stage);
        return active.need > 1 ? `${title} · ${stage} (${active.got}/${active.need})` : `${title} · ${stage}`;
      }
      if (nextJob) {
        const title = t(`game.jobs.${nextJob.id}.title`);
        const who = nextJob.giver ? `${nextJob.giver} · ` : "";
        const where = nextJob.placeName ? ` (${nextJob.placeName})` : "";
        return `${who}${title}${where}`;
      }
      return hasNextStory ? t("game.phone.subIdle") : undefined;
    },
    subtitleText: (_speaker, key) => tr(key, SUB_FALLBACKS[key] ?? ""),
    statLabel: (key) => (key === "cash" ? t("game.phone.statCash") : key === "wanted" ? t("game.phone.statWanted") : t("game.phone.statSlices")),
  };
  // Until the visitor sets it, reduced motion follows the system's setting of the day.
  if (!motionChosen) gameSettings.value = { ...gameSettings.peek(), reducedMotion: systemReducedMotion() };
  world.reducedMotion = gameSettings.peek().reducedMotion;
  world.onEvent = told;
  world.onPhoneCmd = () => sfx("phoneChirp");
  if (!world.start(name, words, quiet, compact, gameSettings.peek().seen)) return false;
  compactHud = compact;
  const set = gameSettings.peek();
  setSound(set.sound);
  setVolumes(set.music, set.effects);
  resetMusic();
  world.onStep = (run) => sfx(run ? "stepRun" : "step");
  world.onJump = (what) => sfx(what);
  window.clearInterval(timer);
  timer = window.setInterval(poll, 100);
  stopKeys?.();
  stopKeys = startKeys();
  // A button that keeps the focus would take Space from the dodge.
  (document.activeElement as HTMLElement | null)?.blur?.();
  banners = [];
  cards = [];
  cancelLater(bannerTimer);
  cancelLater(cardTimer);
  cancelLater(flashTimer);
  // The game waits on its title card until the visitor is ready; a game played again starts at once.
  world.menuPaused = title;
  batch(() => {
    gameOn.value = true;
    gameMenu.value = "none";
    gameBanner.value = undefined;
    gameCard.value = undefined;
    gameFeed.value = [];
    gameTitle.value = title;
    gameNewBest.value = false;
    gameView.value = undefined;
  });
  startPad();
  sfx("start");
  poll();
  return true;
}

/**
 * Burnt out, tries again from the last checkpoint, at once and with no reload: the start of the
 * quest the walker was on, or the edge of the boss's arena with the boss whole. False when the game
 * is not lost.
 */
export function retryGame(): boolean {
  const world = scene?.game;
  if (!world || !world.retry()) return false;
  banners = [];
  cards = [];
  cancelLater(bannerTimer);
  cancelLater(cardTimer);
  resetMusic();
  batch(() => {
    gameMenu.value = "none";
    gameBanner.value = undefined;
    gameCard.value = undefined;
    gameFeed.value = [];
    gameNewBest.value = false;
  });
  world.menuPaused = false;
  (document.activeElement as HTMLElement | null)?.blur?.();
  sfx("start");
  poll();
  return true;
}

export function stopGame(): void {
  window.clearInterval(timer);
  laters.clear();
  cancelLater(flashTimer);
  cancelLater(bannerTimer);
  cancelLater(cardTimer);
  cancelAnimationFrame(pad);
  stopKeys?.();
  stopKeys = undefined;
  banners = [];
  cards = [];
  if (padStick) padSteer()?.(0, 0);
  padStick = false;
  scene?.game?.stop();
  if (scene?.game) {
    scene.game.onStep = undefined;
    scene.game.onPhoneCmd = undefined;
  }
  setEngineSound(false, 0, 0, false);
  // Every sound stops and its nodes, timers and context are let go.
  release();
  batch(() => {
    gameOn.value = false;
    gameView.value = undefined;
    gameMenu.value = "none";
    gameBanner.value = undefined;
    gameCard.value = undefined;
    gameFeed.value = [];
    gameTitle.value = false;
  });
}

/**
 * Connects the game to the scene, whose game world is made now the first time (gameState.ts binds
 * it when this module comes); a scene that goes takes its game with it.
 */
export function bindGameScene(s: CampusScene | undefined): void {
  if (gameOn.peek()) stopGame();
  scene = s;
  if (s) {
    s.withGame(GameWorld).reducedMotion = gameSettings.peek().reducedMotion;
    s.onGameClick = (a) => gameAct(a);
  }
}

/** For a test browser: what the sound is doing, and a tap on its mix for a recording. */
(window as unknown as { __sqAudio?: unknown }).__sqAudio = { stats: audioStats, tap: audioTap };

export type { Quest, Sfx };
