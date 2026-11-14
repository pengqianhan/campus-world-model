// The difficulty curve, guarded: a fast run of the headless playtest bot (scripts/playtest/bot.ts)
// over Study Quest's rules. The full report, with many more runs, is scripts/playtest/report.ts.
import { describe, expect, it } from "vitest";
import { RANKS } from "../src/shared/game.ts";
import { playMany, quantile, summarise } from "../scripts/playtest/bot.ts";

describe("the difficulty curve, as the playtest bot plays it", () => {
  const average = playMany("average", 10, { maxSeconds: 1200 });
  const novice = playMany("novice", 8, { maxSeconds: 1800 });
  const expert = playMany("expert", 8, { maxSeconds: 1200 });

  it("brings an average player to the Final Exam in about eight to twelve minutes", () => {
    const s = summarise(average);
    expect(s.reachBoss).toBe(1);
    expect(s.bossMin![0]).toBeGreaterThanOrEqual(7.5);
    expect(s.bossMin![0]).toBeLessThanOrEqual(12);
  });

  it("raises an average player's rank every minute and a half to two and a half, early on", () => {
    for (let k = 1; k <= 3; k++) {
      const gap = quantile(
        average.map((r) => r.rankAt[k]! - r.rankAt[k - 1]!),
        0.5,
      )! / 60;
      expect(gap, RANKS[k]!.id).toBeGreaterThanOrEqual(1.2);
      expect(gap, RANKS[k]!.id).toBeLessThanOrEqual(3);
    }
  });

  it("never leaves an average player a minute and a half with nothing happening", () => {
    expect(quantile(average.map((r) => r.maxIdle), 0.5)!).toBeLessThanOrEqual(90);
  });

  it("lets a novice reach the boss, with a few defeats on the way", () => {
    const s = summarise(novice);
    expect(s.reachBoss).toBeGreaterThanOrEqual(0.75);
    const before = novice.map((r) => Object.entries(r.deaths).reduce((n, [k, v]) => n + (k === "finalExam" ? 0 : v), 0));
    expect(before.reduce((a, b) => a + b, 0) / before.length).toBeLessThanOrEqual(5);
  });

  it("keeps the A+ for an expert's clean run: none with a defeat, and few for an average player", () => {
    const won = [...expert, ...average].filter((r) => r.victory);
    expect(won.filter((r) => r.deathCount > 0 && r.grade === "A+")).toHaveLength(0);
    expect(expert.filter((r) => r.victory && r.deathCount === 0 && r.grade === "A+").length).toBeGreaterThan(0);
    expect(average.filter((r) => r.grade === "A+").length).toBeLessThanOrEqual(average.length / 4);
  });
});
