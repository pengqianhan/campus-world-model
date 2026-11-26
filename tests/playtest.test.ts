// The Round 2 open-world difficulty curve, guarded: a fast run of the headless playtest bot
// (scripts/playtest/bot.ts) through all 4 story jobs (groupProject -> pizzaExpress -> turfTable -> lateSubmission).
import { describe, expect, it } from "vitest";
import { playMany, quantile, summarise } from "../scripts/playtest/bot.ts";

describe("the Round 2 open-world difficulty curve, as the playtest bot plays it", () => {
  const average = playMany("average", 6, { maxSeconds: 600 });
  const novice = playMany("novice", 5, { maxSeconds: 600 });
  const expert = playMany("expert", 5, { maxSeconds: 600 });

  it("lets average and expert players complete all 4 story jobs cleanly", () => {
    const sa = summarise(average);
    const se = summarise(expert);
    expect(sa.victory).toBe(1);
    expect(se.victory).toBe(1);
    expect(sa.bossMin![0]).toBeLessThanOrEqual(6);
  });

  it("raises ranks steadily across the story arc", () => {
    const sa = summarise(average);
    expect(sa.rankMin[1]).toBeDefined();
    expect(sa.rankMin[1]!).toBeGreaterThan(0);
    expect(sa.rankMin[1]!).toBeLessThanOrEqual(4);
  });

  it("never leaves an average player over a minute with nothing happening", () => {
    expect(quantile(average.map((r) => r.maxIdle), 0.5)!).toBeLessThanOrEqual(60);
  });

  it("lets a novice complete the story with at most a few retries", () => {
    const sn = summarise(novice);
    expect(sn.victory).toBeGreaterThanOrEqual(0.8);
    expect(sn.deathsTotal).toBeLessThanOrEqual(4);
  });

  it("rewards clean expert runs with A+ grades and higher cash than deaths", () => {
    const won = [...expert, ...average].filter((r) => r.victory);
    expect(won.filter((r) => r.deathCount > 0 && r.grade === "A+")).toHaveLength(0);
    expect(expert.filter((r) => r.victory && r.deathCount === 0 && r.grade === "A+").length).toBeGreaterThan(0);
    expect(expert.every((r) => r.cash > 900)).toBe(true);
  });
});
