// The book game, for the panel: a game the visitor starts from the walk, in which the walker eats
// made-up books and a made-up "Deadline" comes after it. It is off until asked for, and it is a game
// laid over the map: no book and no Deadline is campus data. The score is kept for the visit only;
// nothing is stored and nothing leaves the browser.
import { batch, signal } from "@preact/signals";
import type { CampusScene } from "../scene/CampusScene.ts";
import type { GameView } from "../scene/game.ts";
import { t } from "./i18n.ts";

export const gameOn = signal(false);
/** What the panel shows of the game, refreshed ten times a second. */
export const gameView = signal<GameView | undefined>(undefined);
/** The best score of this visit. */
export const gameBest = signal(0);
/** What last happened, for the panel to flash: a book eaten, the chase turned, a life lost. */
export const gameFlash = signal<{ kind: "power" | "caught" | "beat"; at: number } | undefined>(undefined);

let scene: CampusScene | undefined;
let timer = 0;

function poll(): void {
  const v = scene?.game.view();
  if (!v) {
    // Its walker left the map: the game went with it.
    stopGame();
    return;
  }
  for (const e of v.events) if (e === "power" || e === "caught" || e === "beat") gameFlash.value = { kind: e, at: performance.now() };
  if (v.score > gameBest.peek()) gameBest.value = v.score;
  gameView.value = v;
}

/**
 * Starts a game for the walker called `name`, or starts it again. `quiet` leaves the buildings' names
 * off the walker's view meanwhile, for a small screen. False when there is no such walker.
 */
export function startGame(name: string, quiet = false): boolean {
  if (!scene?.game.start(name, { deadline: t("game.deadline"), fleeing: t("game.fleeing") }, quiet)) return false;
  window.clearInterval(timer);
  timer = window.setInterval(poll, 100);
  batch(() => {
    gameOn.value = true;
    gameFlash.value = undefined;
  });
  poll();
  return true;
}

export function stopGame(): void {
  window.clearInterval(timer);
  scene?.game.stop();
  batch(() => {
    gameOn.value = false;
    gameView.value = undefined;
    gameFlash.value = undefined;
  });
}

/** Connects the game to the scene; a scene that goes takes its game with it. */
export function bindGameScene(s: CampusScene | undefined): void {
  if (gameOn.peek()) stopGame();
  scene = s;
}
