// What the rest of the site knows of Study Quest (app/game.ts) before it is played: whether a game
// is on, its menu, and the way to start it. The game's own code, its sounds, its world and its
// panel come in a chunk of their own, loaded the first time the Game button is pressed, so that a
// visitor who never plays downloads and builds none of it.
import { computed, signal } from "@preact/signals";
import type { CampusScene } from "../scene/CampusScene.ts";
import type { GameView } from "../scene/game.ts";

export const gameOn = signal(false);
/** What the panel shows of the game, refreshed ten times a second. */
export const gameView = signal<GameView | undefined>(undefined);
/** The menu over the game: none, the pause menu, or the walker's study record (stats and skills). */
export const gameMenu = signal<"none" | "pause" | "sheet">("none");
/** Whether the game is played now (not over): its keys take Esc. Changes only with the phase, not each refresh. */
export const gamePlaying = computed(() => gameView.value?.phase === "play");
/** Whether the game is over: burnt out or won, with its debrief. */
export const gameOver = computed(() => gameView.value?.phase === "over");

/** Whether the game holds the walker still: a menu is open over it. */
export function gameHolds(): boolean {
  return gameOn.peek() && gameMenu.peek() !== "none";
}

/** How the walk steers its walker from a game pad (set by the walk, which owns the pace). */
let steer: ((forward: number, turn: number) => void) | undefined;
export function setPadSteer(fn: ((forward: number, turn: number) => void) | undefined): void {
  steer = fn;
}
export function padSteer(): ((forward: number, turn: number) => void) | undefined {
  return steer;
}

type GameModule = typeof import("./game.ts");
let scene: CampusScene | undefined;
let mod: GameModule | undefined;
let loading: Promise<GameModule> | undefined;

/** The game's own code, loaded once, and bound to the scene when it comes. */
export function loadGame(): Promise<GameModule> {
  loading ??= import("./game.ts").then((m) => {
    mod = m;
    m.bindGameScene(scene);
    return m;
  });
  return loading;
}

/** Connects the game to the scene; a scene that goes takes its game with it. */
export function bindGameScene(s: CampusScene | undefined): void {
  scene = s;
  mod?.bindGameScene(s);
}

export function stopGame(): void {
  mod?.stopGame();
}

export function togglePause(): void {
  mod?.togglePause();
}

export function setMenu(m: "none" | "pause" | "sheet"): void {
  mod?.setMenu(m);
}
