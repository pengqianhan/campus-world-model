// Study Quest, for the panel: a made-up action game the visitor starts from the walk. The walker
// grows by learning and fights made-up villains for study troubles. It is off until asked for, and
// it is a game laid over the map: no villain, book or quest is campus data, and none stands for a
// real class, course, person or due date. Progress is kept for the visit only; the best grade and
// the settings (sound, reduced motion) are kept in this browser's storage, as conveniences, and
// nothing leaves the browser.
import { batch, signal } from "@preact/signals";
import type { CampusScene } from "../scene/CampusScene.ts";
import type { GameAction, GameView } from "../scene/game.ts";
import { FOE_KINDS, RANKS, type FoeKind, type GameEvent, type Quest } from "../shared/game.ts";
import { sfx, setSound, type Sfx } from "./gameAudio.ts";
import { pick, t } from "./i18n.ts";

export const gameOn = signal(false);
/** What the panel shows of the game, refreshed ten times a second. */
export const gameView = signal<GameView | undefined>(undefined);
/** The menu over the game: none, the pause menu, or the walker's study record (stats and skills). */
export const gameMenu = signal<"none" | "pause" | "sheet">("none");
/** The title card, for the first seconds of a game. */
export const gameTitle = signal(false);

export interface Banner {
  id: number;
  kind: "wave" | "rank" | "quest" | "phase" | "boss" | "foe";
  title: string;
  sub?: string;
  quote?: string;
  /** The villain on a name card. */
  foe?: FoeKind;
  ms: number;
}
/** The big words across the middle: a wave coming, a rank risen, a quest done, a villain's name card. */
export const gameBanner = signal<Banner | undefined>(undefined);
/** A villain's name card, low on the left, in its own channel beside the banners. */
export const gameCard = signal<Banner | undefined>(undefined);
let cards: Banner[] = [];
let cardTimer = 0;
function card(b: Omit<Banner, "id">): void {
  cards.push({ ...b, id: seq++ });
  if (!gameCard.peek()) nextCard();
}
function nextCard(): void {
  window.clearTimeout(cardTimer);
  const b = cards.shift();
  gameCard.value = b;
  if (b) cardTimer = window.setTimeout(nextCard, b.ms);
}
/** The feed down the right: villains beaten, things found. */
export const gameFeed = signal<{ id: number; text: string; value?: string; kind: string }[]>([]);
/** A new quest's line flashes in the tracker. */
export const gameQuestFlash = signal(0);

export interface GameSettings {
  sound: boolean;
  reducedMotion: boolean;
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

function loadSettings(): GameSettings {
  const fallback = { sound: true, reducedMotion: systemReducedMotion() };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const s = JSON.parse(raw) as Partial<GameSettings>;
    return { sound: s.sound !== false, reducedMotion: typeof s.reducedMotion === "boolean" ? s.reducedMotion : fallback.reducedMotion };
  } catch {
    return fallback;
  }
}

export const gameSettings = signal<GameSettings>(loadSettings());

export function setGameSettings(next: Partial<GameSettings>): void {
  const s = { ...gameSettings.peek(), ...next };
  gameSettings.value = s;
  setSound(s.sound);
  if (scene) scene.game.reducedMotion = s.reducedMotion;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
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
let seq = 1;
let banners: Banner[] = [];
let bannerTimer = 0;
let titleTimer = 0;
let pad = 0;
let stopKeys: (() => void) | undefined;

export function questTitle(q: { key: string }): string {
  return t(`game.quest.${q.key}.title`);
}
export function questGoal(q: { key: string; place?: string | { name: string }; need: number }): string {
  const place = typeof q.place === "string" ? q.place : q.place?.name;
  return t(`game.quest.${q.key}.goal`, { need: q.need, place: place ?? t("game.openGround") });
}
export function rankName(rank: number): string {
  return t(`game.rank.${RANKS[rank]?.id ?? "fresher"}`);
}

function banner(b: Omit<Banner, "id">): void {
  // A phase goes before what waits.
  if (b.kind === "phase") banners.unshift({ ...b, id: seq++ });
  else banners.push({ ...b, id: seq++ });
  if (banners.length > 4) banners = banners.slice(0, 4);
  if (!gameBanner.peek()) nextBanner();
}

function nextBanner(): void {
  window.clearTimeout(bannerTimer);
  const b = banners.shift();
  gameBanner.value = b;
  if (b) bannerTimer = window.setTimeout(nextBanner, b.ms);
}

function feed(text: string, kind: string, value?: string): void {
  const line = { id: seq++, text, value, kind };
  gameFeed.value = [...gameFeed.peek().slice(-4), line];
  window.setTimeout(() => (gameFeed.value = gameFeed.peek().filter((l) => l.id !== line.id)), 4200);
}

/** Sounds, banners and the feed for what happened. */
function told(e: GameEvent): void {
  switch (e.type) {
    case "take":
      sfx(e.kind === "note" ? "note" : e.kind === "coffee" ? "sip" : "pickup");
      if (e.kind === "coffee") feed(t("game.feed.coffee"), "take");
      break;
    case "swing":
      sfx(e.combo === 2 ? "swing3" : "swing", 1 + e.combo * 0.12);
      break;
    case "hit":
      sfx(e.crit ? "crit" : "hit", e.heavy ? 0.8 : 1);
      break;
    case "kill":
      sfx(e.kind === "exam" || e.kind === "ddl" ? "bigKill" : "kill");
      feed(t(`game.foe.${e.kind}.name`), "kill", `+${e.xp}`);
      break;
    case "hurt":
      sfx("hurt");
      break;
    case "evade":
      sfx("evade");
      break;
    case "dodge":
      sfx("dodge");
      break;
    case "card":
      sfx("card");
      break;
    case "eureka":
      sfx("eureka");
      break;
    case "rank":
      sfx("rank");
      banner({ kind: "rank", title: rankName(e.rank), sub: e.skill ? t("game.unlocked", { skill: t(`game.skill.${e.skill}.name`) }) : t("game.rankUpSub"), ms: 3000 });
      break;
    case "quest":
      if (e.done) {
        sfx("quest");
        if (e.quest.key !== "finalExam") banner({ kind: "quest", title: t("game.questDone"), sub: `${questTitle(e.quest)} · +${e.quest.reward}`, ms: 2400 });
      } else gameQuestFlash.value = performance.now();
      break;
    case "wave":
      sfx("warn");
      banner({ kind: "wave", title: t("game.banner.wave"), sub: e.place, ms: 2600 });
      break;
    case "arrive":
      if (e.kind === "exam") {
        sfx("roar");
        card({ kind: "boss", foe: e.kind, title: t("game.foe.exam.name"), sub: t("game.foe.exam.title"), quote: t("game.foe.exam.taunt"), ms: 3800 });
      } else if (e.kind === "ddl") {
        sfx("alarm");
        if (e.first) card({ kind: "foe", foe: e.kind, title: t("game.foe.ddl.name"), sub: t("game.foe.ddl.title"), quote: t("game.foe.ddl.taunt"), ms: 3400 });
      } else if (e.first) card({ kind: "foe", foe: e.kind, title: t(`game.foe.${e.kind}.name`), sub: t(`game.foe.${e.kind}.title`), quote: t(`game.foe.${e.kind}.taunt`), ms: 3000 });
      break;
    case "tell":
      if (e.kind === "ddl") sfx("ring");
      else if (e.kind === "exam") sfx("charge");
      break;
    case "phase":
      sfx("phase");
      banner({ kind: "phase", title: t(`game.phase.${e.phase}.title`), sub: t(`game.phase.${e.phase}.name`), ms: 2600 });
      break;
    case "over":
      sfx(e.victory ? "victory" : "defeat");
      break;
  }
}

function poll(): void {
  const v = scene?.game.view();
  if (!v) {
    // Its walker left the map: the game went with it.
    stopGame();
    return;
  }
  const wasOver = gameView.peek()?.phase === "over";
  if (v.phase === "over" && !wasOver && v.debrief) {
    gameNewBest.value = keepBest(v.debrief.grade, v.debrief.xp);
    gameMenu.value = "none";
    banners = [];
    cards = [];
    nextBanner();
    nextCard();
  }
  gameView.value = v;
}

/** The keys of the game, besides the walker's own: J or F strike, Space dodges, K or E throw, R the Eureka, Tab locks on, P pauses, C the record. */
function startKeys(): () => void {
  const down = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (gameTitle.peek() && !e.repeat) dismissTitle();
    if (k === "p" && !e.repeat) {
      togglePause();
      return;
    }
    if ((k === "c" || k === "i") && !e.repeat && gameView.peek()?.phase === "play") {
      gameMenu.value = gameMenu.peek() === "sheet" ? "none" : "sheet";
      return;
    }
    if (gameMenu.peek() !== "none" || gameView.peek()?.phase !== "play") return;
    const map: Record<string, GameAction | "lock"> = { j: "strike", f: "strike", " ": "dodge", k: "card", e: "card", r: "eureka", l: "eureka", tab: "lock" };
    const a = map[k];
    if (!a) return;
    e.preventDefault();
    if (e.repeat && a !== "strike") return;
    gameAct(a);
  };
  window.addEventListener("keydown", down);
  return () => window.removeEventListener("keydown", down);
}

/** An action from any of the controls. */
export function gameAct(a: GameAction | "lock"): void {
  if (!scene || gameMenu.peek() !== "none") return;
  if (gameTitle.peek()) dismissTitle();
  if (a === "lock") scene.game.toggleLock();
  else scene.game.act(a);
}

/** A game pad, read in each frame while the game is on: the left stick walks, A strikes, B dodges, X throws, Y the Eureka, RB locks on, Start pauses. */
let padWas: boolean[] = [];
let padStick = false;
let steer: ((forward: number, turn: number) => void) | undefined;
function readPad(): void {
  pad = requestAnimationFrame(readPad);
  const pads = navigator.getGamepads?.() ?? [];
  const p = Array.from(pads).find((x) => x && x.connected);
  if (!p) return;
  const press = (i: number) => !!p.buttons[i]?.pressed;
  const edge = (i: number) => press(i) && !padWas[i];
  if (edge(9)) togglePause();
  if (gameMenu.peek() === "none" && gameView.peek()?.phase === "play") {
    if (edge(0)) gameAct("strike");
    if (edge(1)) gameAct("dodge");
    if (edge(2)) gameAct("card");
    if (edge(3)) gameAct("eureka");
    if (edge(5)) gameAct("lock");
  }
  padWas = p.buttons.map((b) => b.pressed);
  const x = p.axes[0] ?? 0;
  const y = p.axes[1] ?? 0;
  const dead = (v: number) => (Math.abs(v) < 0.18 ? 0 : (v - Math.sign(v) * 0.18) / 0.82);
  const fx = dead(-y);
  const tx = dead(x);
  if (fx || tx) {
    padStick = true;
    steer?.(fx, tx);
  } else if (padStick) {
    padStick = false;
    steer?.(0, 0);
  }
}

/** Lets the walk's own code steer from the pad (set by the walk, which owns the pace). */
export function setPadSteer(fn: ((forward: number, turn: number) => void) | undefined): void {
  steer = fn;
}

export function togglePause(): void {
  if (!gameOn.peek() || gameView.peek()?.phase !== "play") return;
  setMenu(gameMenu.peek() === "none" ? "pause" : "none");
}

export function setMenu(m: "none" | "pause" | "sheet"): void {
  gameMenu.value = m;
  if (scene) scene.game.menuPaused = m !== "none";
  sfx("click");
}

/** Whether the game holds the walker still: a menu is open over it. */
export function gameHolds(): boolean {
  return gameOn.peek() && gameMenu.peek() !== "none";
}

function dismissTitle(): void {
  window.clearTimeout(titleTimer);
  gameTitle.value = false;
}

/**
 * Starts a game for the walker called `name`, or starts it again. `quiet` leaves the buildings' names
 * off the walker's view meanwhile; `compact` is for a phone. False when there is no such walker.
 */
export function startGame(name: string, quiet = false, compact = false): boolean {
  if (!scene) return false;
  const words = {
    foes: Object.fromEntries(FOE_KINDS.map((k) => [k, t(`game.foe.${k}.name`)])) as Record<FoeKind, string>,
    place: (b: { name: Parameters<typeof pick>[0] }) => pick(b.name),
    open: t("game.openGround"),
  };
  scene.game.reducedMotion = gameSettings.peek().reducedMotion;
  scene.game.onEvent = told;
  if (!scene.game.start(name, words, quiet, compact)) return false;
  setSound(gameSettings.peek().sound);
  window.clearInterval(timer);
  timer = window.setInterval(poll, 100);
  stopKeys?.();
  stopKeys = startKeys();
  cancelAnimationFrame(pad);
  pad = requestAnimationFrame(readPad);
  // A button that keeps the focus would take Space from the dodge.
  (document.activeElement as HTMLElement | null)?.blur?.();
  banners = [];
  cards = [];
  window.clearTimeout(bannerTimer);
  window.clearTimeout(cardTimer);
  window.clearTimeout(titleTimer);
  titleTimer = window.setTimeout(dismissTitle, 5000);
  batch(() => {
    gameOn.value = true;
    gameMenu.value = "none";
    gameBanner.value = undefined;
    gameCard.value = undefined;
    gameFeed.value = [];
    gameTitle.value = true;
    gameNewBest.value = false;
    gameView.value = undefined;
  });
  sfx("start");
  poll();
  return true;
}

export function stopGame(): void {
  window.clearInterval(timer);
  window.clearTimeout(bannerTimer);
  window.clearTimeout(cardTimer);
  window.clearTimeout(titleTimer);
  cancelAnimationFrame(pad);
  stopKeys?.();
  stopKeys = undefined;
  banners = [];
  cards = [];
  if (padStick) steer?.(0, 0);
  padStick = false;
  scene?.game.stop();
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

/** Connects the game to the scene; a scene that goes takes its game with it. */
export function bindGameScene(s: CampusScene | undefined): void {
  if (gameOn.peek()) stopGame();
  scene = s;
  if (s) {
    s.game.reducedMotion = gameSettings.peek().reducedMotion;
    s.onGameClick = (a) => gameAct(a);
  }
}

export type { Quest, Sfx };
