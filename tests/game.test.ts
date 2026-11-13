import { describe, expect, it } from "vitest";
import type { Pt } from "../src/shared/geo.ts";
import { BookGame, GAME, bearingTo, bookSpot, reachable, type GameHost } from "../src/shared/game.ts";
import { blockPolygon, cellOf, makeGrid } from "../src/shared/walkpath.ts";

/** A repeatable Math.random. */
function seeded(seed = 1): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** A host that lays books in a row to the east of the walker, 20 m apart, far from where it stands. */
function rowHost(): GameHost {
  return {
    spot: (near, taken) => [near[0] + 500 + taken.length * 20, near[1]],
    random: () => 0,
  };
}

const HERE: Pt = [0, 0];

describe("the book game's rules", () => {
  it("starts with its books out and the Deadline a way off", () => {
    const g = new BookGame(rowHost(), HERE);
    expect(g.books).toHaveLength(GAME.booksOut);
    expect(Math.hypot(...g.deadline.at)).toBeCloseTo(GAME.startGap);
    expect(g.lives).toBe(GAME.lives);
  });

  it("eats a book the walker stands on, and lays another", () => {
    const g = new BookGame(rowHost(), HERE);
    const book = g.books[0]!;
    const events = g.step(0.1, book.at);
    expect(events).toContain("eat");
    expect(g.score).toBe(GAME.bookPoints);
    expect(g.eaten).toBe(1);
    expect(g.books.some((b) => b.id === book.id)).toBe(false);
    expect(g.books).toHaveLength(GAME.booksOut);
  });

  it("comes after the walker, faster as time goes, and waits out the first seconds", () => {
    const g = new BookGame(rowHost(), HERE);
    const gap = () => Math.hypot(...g.deadline.at);
    g.step(1, HERE);
    expect(gap()).toBeCloseTo(GAME.startGap);
    for (let k = 0; k < 40; k++) g.step(0.1, HERE);
    // 5 s gone, 3 of them waiting: less than 2 s at the first speed, a little more with its gain.
    expect(gap()).toBeLessThan(GAME.startGap - GAME.baseSpeed * 1.9);
    expect(gap()).toBeGreaterThan(GAME.startGap - GAME.baseSpeed * 2.2);
    expect(g.deadline.speed).toBeGreaterThan(GAME.baseSpeed);
  });

  it("goes faster after a walker on the scooter", () => {
    const [foot, wheels] = [new BookGame(rowHost(), HERE), new BookGame(rowHost(), HERE)];
    foot.grace = wheels.grace = 0;
    foot.step(1, HERE);
    wheels.step(1, HERE, true, GAME.scooterPace);
    const went = (g: BookGame) => GAME.startGap - Math.hypot(...g.deadline.at);
    expect(went(wheels)).toBeCloseTo(went(foot) * GAME.scooterPace);
  });

  it("takes a life when the Deadline catches the walker, and ends the game at the last", () => {
    const g = new BookGame(rowHost(), HERE);
    for (let life = GAME.lives; life > 0; life--) {
      g.grace = 0;
      g.deadline.at = [1, 0];
      const events = g.step(0.1, HERE);
      expect(events).toContain("caught");
      expect(g.lives).toBe(life - 1);
    }
    expect(g.phase).toBe("over");
    // A game that is over stays as it ended.
    expect(g.step(1, HERE)).toEqual([]);
  });

  it("turns the chase round after enough books: the Deadline flees and can be caught", () => {
    const g = new BookGame(rowHost(), HERE);
    g.grace = 0;
    let at: Pt = HERE;
    const events: string[] = [];
    for (let k = 0; k < GAME.booksToPower; k++) {
      at = g.books[0]!.at;
      events.push(...g.step(0.01, at));
    }
    expect(events.filter((e) => e === "eat")).toHaveLength(GAME.booksToPower);
    expect(events).toContain("power");
    expect(g.power).toBeGreaterThan(0);
    expect(g.eaten).toBe(0);

    const before = Math.hypot(g.deadline.at[0] - at[0], g.deadline.at[1] - at[1]);
    g.step(1, at);
    expect(Math.hypot(g.deadline.at[0] - at[0], g.deadline.at[1] - at[1])).toBeGreaterThan(before);

    const score = g.score;
    g.deadline.at = [at[0] + 1, at[1]];
    expect(g.step(0.01, at)).toContain("beat");
    expect(g.score).toBe(score + GAME.deadlinePoints);
    expect(g.level).toBe(2);
    expect(g.power).toBe(0);
    expect(g.lives).toBe(GAME.lives);
    expect(g.deadline.speed).toBeCloseTo(GAME.baseSpeed + GAME.perLevel);
  });

  it("turns the chase back when the time runs out", () => {
    const g = new BookGame(rowHost(), HERE);
    g.power = 0.5;
    g.deadline.at = [400, 0];
    expect(g.step(1, HERE)).toContain("powerEnd");
    expect(g.power).toBe(0);
  });

  it("stops the clock while the walker cannot play", () => {
    const g = new BookGame(rowHost(), HERE);
    g.grace = 0;
    g.deadline.at = [1, 0];
    expect(g.step(1, HERE, false)).toEqual([]);
    expect(g.lives).toBe(GAME.lives);
    expect(g.seconds).toBe(0);
  });
});

describe("where the books lie", () => {
  // A walled yard in the middle of open ground: the walker stands outside it.
  const grid = () => {
    const g = makeGrid([-100, -100, 100, 100], 2);
    const wall = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ];
    blockPolygon(g, [wall(-30, -30, 30, 30), wall(-20, -20, 20, 20)]);
    return g;
  };

  it("reaches the open ground and not a yard shut in by walls", () => {
    const g = grid();
    const reached = reachable(g, [-80, -80]);
    const at = (p: Pt) => {
      const [c, r] = cellOf(g, p);
      return reached[r * g.cols + c];
    };
    expect(at([80, 80])).toBe(1);
    expect(at([0, 0])).toBe(0);
    expect(at([-25, 0])).toBe(0);
  });

  it("lays books beside the building that draws them, apart from each other and from the walker", () => {
    const g = grid();
    const near: Pt = [-80, -80];
    const reached = reachable(g, near);
    const random = seeded(7);
    const taken: Pt[] = [];
    for (let k = 0; k < 12; k++) {
      const at = bookSpot(g, reached, [{ center: [0, 0], weight: 1 }], near, taken, random);
      expect(at).toBeDefined();
      const [c, r] = cellOf(g, at!);
      expect(reached[r * g.cols + c]).toBe(1);
      expect(Math.hypot(...at!)).toBeLessThan(72);
      for (const t of taken) expect(Math.hypot(at![0] - t[0], at![1] - t[1])).toBeGreaterThanOrEqual(8);
      expect(Math.hypot(at![0] - near[0], at![1] - near[1])).toBeGreaterThanOrEqual(8);
      taken.push(at!);
    }
  });

  it("lays books round the walker where no building draws them, and none where nothing is reached", () => {
    const g = grid();
    const near: Pt = [-80, -80];
    expect(bookSpot(g, reachable(g, near), [], near, [], seeded(3))).toBeDefined();
    expect(bookSpot(g, new Uint8Array(g.cols * g.rows), [], near, [], seeded(3))).toBeUndefined();
  });
});

describe("bearingTo", () => {
  it("gives compass degrees", () => {
    expect(bearingTo([0, 0], [0, 10])).toBeCloseTo(0);
    expect(bearingTo([0, 0], [10, 0])).toBeCloseTo(90);
    expect(bearingTo([0, 0], [-10, 0])).toBeCloseTo(270);
  });
});
