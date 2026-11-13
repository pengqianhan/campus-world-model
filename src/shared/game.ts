// The book game's rules, with no drawing in them. A walker on foot eats books that lie beside the
// buildings, on foot or on a scooter, and a made-up "Deadline" comes after it. Enough books turn the chase round for a
// while: then the walker can catch the Deadline. All of it is a game laid over the map: no book and
// no Deadline is campus data, and nothing here knows a real class or a real due date.
import type { Pt } from "./geo.ts";
import { WALK_COST, cellOf, centreOf, nearestFree, type WalkGrid } from "./walkpath.ts";

export const GAME = {
  /** Books that turn the chase round. */
  booksToPower: 6,
  /** Books that lie on the map at one time. */
  booksOut: 40,
  /** Metres from a book at which the walker eats it. */
  eatReach: 3.2,
  /** Metres from the Deadline at which it catches the walker, or the walker catches it. */
  catchReach: 2.8,
  /** Seconds the chase stays turned round. */
  powerSeconds: 12,
  /** Times the Deadline can catch the walker before the game ends. */
  lives: 3,
  /** Metres from the walker at which the Deadline starts, and starts again. */
  startGap: 90,
  /** Metres a second the Deadline goes at first; a walker on foot hurries at 3.5. */
  baseSpeed: 1.8,
  /** Metres a second it gains with each level. */
  perLevel: 0.35,
  /** Metres a second it gains each second, until it is caught. */
  growth: 0.015,
  /** Metres a second it never passes. */
  topSpeed: 4.4,
  /**
   * Times its speed while the walker rides the scooter: the scooter's top speed over a walker's
   * hurry (25 km/h over 3.5 m/s), so that the chase is as close on wheels as on foot.
   */
  scooterPace: 2,
  /** Share of its speed at which it flees. */
  fleeShare: 0.6,
  /** Seconds after a catch in which nothing can catch anything. */
  graceSeconds: 3,
  bookPoints: 10,
  /** Points for catching the Deadline, times the level. */
  deadlinePoints: 100,
  /** Metres from the walker beyond which a book is put somewhere nearer. */
  bookRange: 320,
} as const;

export interface Book {
  id: number;
  at: Pt;
}

export type GameEvent = "eat" | "power" | "powerEnd" | "caught" | "beat" | "over";

export interface GameHost {
  /** Somewhere to lay a book near the walker, away from the places taken; undefined when it finds none. */
  spot(near: Pt, taken: readonly Pt[]): Pt | undefined;
  /** 0 to 1, as Math.random gives. */
  random(): number;
}

export class BookGame {
  phase: "play" | "over" = "play";
  score = 0;
  level = 1;
  lives: number = GAME.lives;
  /** Books eaten towards the next turn of the chase. */
  eaten = 0;
  /** Seconds the chase stays turned round; 0 when the Deadline chases. */
  power = 0;
  /** Seconds in which nothing can catch anything. */
  grace: number = GAME.graceSeconds;
  /** Seconds played, less the pauses. */
  seconds = 0;
  books: Book[] = [];
  deadline: { at: Pt; speed: number };
  private nextId = 1;

  constructor(
    private host: GameHost,
    player: Pt,
  ) {
    this.deadline = { at: this.away(player), speed: GAME.baseSpeed };
    this.fill(player);
  }

  /** A point `startGap` metres from the walker, any way round. */
  private away(player: Pt): Pt {
    const a = this.host.random() * Math.PI * 2;
    return [player[0] + Math.sin(a) * GAME.startGap, player[1] + Math.cos(a) * GAME.startGap];
  }

  /** Lays books until `booksOut` lie on the map, or the host finds no more places. */
  private fill(player: Pt): void {
    while (this.books.length < GAME.booksOut) {
      const at = this.host.spot(
        player,
        this.books.map((b) => b.at),
      );
      if (!at) return;
      this.books.push({ id: this.nextId++, at });
    }
  }

  private startSpeed(): number {
    return Math.min(GAME.topSpeed, GAME.baseSpeed + (this.level - 1) * GAME.perLevel);
  }

  /**
   * Moves the game on by `dt` seconds with the walker at `player`, and tells what happened. A walker
   * that cannot play (inside a building, or flying) stops the clock: `active` is false. `pace`
   * multiplies the Deadline's speed, chasing and fleeing, for a walker that goes faster than on foot.
   */
  step(dt: number, player: Pt, active = true, pace = 1): GameEvent[] {
    const events: GameEvent[] = [];
    if (this.phase !== "play" || !active || dt <= 0) return events;
    this.seconds += dt;
    this.grace = Math.max(0, this.grace - dt);

    // Books.
    let ate = false;
    this.books = this.books.filter((b) => {
      if (Math.hypot(b.at[0] - player[0], b.at[1] - player[1]) > GAME.eatReach) return true;
      ate = true;
      this.score += GAME.bookPoints;
      events.push("eat");
      // Books eaten while the chase is turned round count for the score alone.
      if (this.power <= 0) this.eaten++;
      return false;
    });
    if (ate) {
      // The walker has moved on: books left far behind are laid again near it.
      this.books = this.books.filter((b) => Math.hypot(b.at[0] - player[0], b.at[1] - player[1]) <= GAME.bookRange);
      this.fill(player);
    }
    if (this.power <= 0 && this.eaten >= GAME.booksToPower) {
      this.eaten = 0;
      this.power = GAME.powerSeconds;
      events.push("power");
    } else if (this.power > 0) {
      this.power = Math.max(0, this.power - dt);
      if (this.power === 0) events.push("powerEnd");
    }

    // The Deadline: after the walker, or away from it while the chase is turned round.
    const d = this.deadline;
    if (this.power <= 0) d.speed = Math.min(GAME.topSpeed, d.speed + GAME.growth * dt);
    const dx = player[0] - d.at[0];
    const dy = player[1] - d.at[1];
    const gap = Math.hypot(dx, dy);
    if (this.grace <= 0 && gap > 1e-6) {
      const flee = this.power > 0;
      const go = Math.min(flee ? Infinity : gap, d.speed * pace * (flee ? GAME.fleeShare : 1) * dt) * (flee ? -1 : 1);
      d.at = [d.at[0] + (dx / gap) * go, d.at[1] + (dy / gap) * go];
    }
    const now = Math.hypot(player[0] - d.at[0], player[1] - d.at[1]);
    if (this.grace <= 0 && now <= GAME.catchReach) {
      if (this.power > 0) {
        this.score += GAME.deadlinePoints * this.level;
        this.level++;
        this.power = 0;
        events.push("beat");
      } else {
        this.lives--;
        this.eaten = 0;
        events.push("caught");
        if (this.lives <= 0) {
          this.phase = "over";
          events.push("over");
          return events;
        }
      }
      this.deadline = { at: this.away(player), speed: this.startSpeed() };
      this.grace = GAME.graceSeconds;
    }
    return events;
  }
}

/** The compass bearing from one point to another, degrees clockwise from north. */
export function bearingTo(from: Pt, to: Pt): number {
  return ((Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI + 360) % 360;
}

/**
 * The cells of a walking grid that a walker at `from` can get to on foot, 1 for each. Books lie
 * only on these, so that none is shut in a courtyard or across a motorway.
 */
export function reachable(g: WalkGrid, from: Pt): Uint8Array {
  const mask = new Uint8Array(g.cols * g.rows);
  const start = nearestFree(g, from, 40);
  if (!start) return mask;
  const open = (i: number) => g.cost[i]! <= WALK_COST.open;
  const queue = new Int32Array(g.cols * g.rows);
  let head = 0;
  let tail = 0;
  const first = start[1] * g.cols + start[0];
  mask[first] = 1;
  queue[tail++] = first;
  while (head < tail) {
    const i = queue[head++]!;
    const c = i % g.cols;
    const r = (i - c) / g.cols;
    const next = [c > 0 ? i - 1 : -1, c < g.cols - 1 ? i + 1 : -1, r > 0 ? i - g.cols : -1, r < g.rows - 1 ? i + g.cols : -1];
    for (const n of next) {
      if (n < 0 || mask[n] || !open(n)) continue;
      mask[n] = 1;
      queue[tail++] = n;
    }
  }
  return mask;
}

/** A place books gather round: a building's middle, and how many books it draws against the others. */
export interface BookDraw {
  center: Pt;
  weight: number;
}

/** Metres from a building's middle within which its books lie. */
const DRAW_REACH = 70;
/** Metres between two books, and between a new book and the walker. */
const BOOK_GAP = 8;
/** Metres from the walker within which a book lies when no building draws it. */
const OPEN_REACH = 220;

/**
 * Somewhere to lay a book: a reachable cell beside one of the `draws`, picked by weight, or
 * anywhere reachable within `openReach` metres of the walker when there is none. Undefined when a
 * few tries find no place.
 */
export function bookSpot(
  g: WalkGrid,
  reached: Uint8Array,
  draws: readonly BookDraw[],
  near: Pt,
  taken: readonly Pt[],
  random: () => number,
  openReach: number = OPEN_REACH,
): Pt | undefined {
  const total = draws.reduce((sum, d) => sum + d.weight, 0);
  for (let attempt = 0; attempt < 40; attempt++) {
    let centre = near;
    let reach = openReach;
    if (total > 0) {
      let pick = random() * total;
      for (const d of draws) {
        pick -= d.weight;
        if (pick <= 0) {
          centre = d.center;
          reach = DRAW_REACH;
          break;
        }
      }
    }
    const a = random() * Math.PI * 2;
    const far = Math.sqrt(random()) * reach;
    const p: Pt = [centre[0] + Math.sin(a) * far, centre[1] + Math.cos(a) * far];
    const [c, r] = cellOf(g, p);
    if (c < 0 || r < 0 || c >= g.cols || r >= g.rows || !reached[r * g.cols + c]) continue;
    const at = centreOf(g, c, r);
    if (Math.hypot(at[0] - near[0], at[1] - near[1]) < BOOK_GAP) continue;
    if (taken.some((t) => Math.hypot(at[0] - t[0], at[1] - t[1]) < BOOK_GAP)) continue;
    return at;
  }
  return undefined;
}
