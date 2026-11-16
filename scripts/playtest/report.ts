// The playtest bot's report: each profile plays many seeded runs of Study Quest, and the curve is
// printed as markdown tables. Usage: npx tsx scripts/playtest/report.ts [runs] [out.md]
import { writeFileSync } from "node:fs";
import { RANKS } from "../../src/shared/game.ts";
import { PROFILES, playMany, summarise, type ProfileId, type RunResult, type Summary } from "./bot.ts";

const runs = Number(process.argv[2] ?? 40);
const out = process.argv[3];
const ids = Object.keys(PROFILES) as ProfileId[];

const t0 = performance.now();
const results: Record<string, RunResult[]> = {};
const sums: Summary[] = [];
for (const id of ids) {
  results[id] = playMany(id, runs);
  sums.push(summarise(results[id]!));
}
const ms = performance.now() - t0;

const f = (x: number | undefined, d = 1) => (x === undefined || !Number.isFinite(x) ? "–" : x.toFixed(d));
const pct = (x: number | undefined) => (x === undefined ? "–" : `${Math.round(x * 100)}%`);
const lines: string[] = [];
lines.push(`${runs} seeded runs a profile, ${(ms / 1000).toFixed(1)} s of computing in all.`, "");
lines.push("| | " + ids.join(" | ") + " |", "|---|" + ids.map(() => "---:").join("|") + "|");
const row = (name: string, cell: (s: Summary) => string) => lines.push(`| ${name} | ${sums.map(cell).join(" | ")} |`);
row("reach the boss", (s) => pct(s.reachBoss));
row("beat the boss", (s) => pct(s.victory));
row("minutes to the boss (median [p25–p75])", (s) => (s.bossMin ? `${f(s.bossMin[0])} [${f(s.bossMin[1])}–${f(s.bossMin[2])}]` : "–"));
row("minutes in the boss fight (median, retries in)", (s) => f(s.bossFightMin));
row("defeats a run (mean)", (s) => f(s.deathsTotal, 2));
row("Focus kept after a fight (mean / p10)", (s) => `${pct(s.focusAfter[0])} / ${pct(s.focusAfter[1])}`);
row("longest stretch with no new beat, s (median / worst)", (s) => `${f(s.quiet[0], 0)} / ${f(s.quiet[1], 0)}`);
row("longest stretch with no beat and no fight, s (median / worst)", (s) => (s.idle ? `${f(s.idle[0], 0)} / ${f(s.idle[1], 0)}` : "–"));
row("A+ among clean wins / wins with a defeat", (s) => `${pct(s.aPlusClean)} / ${pct(s.aPlusDefeated)}`);
row("grades of the wins", (s) =>
  Object.entries(s.grades)
    .sort()
    .map(([g, n]) => `${g}×${n}`)
    .join(" "),
);
lines.push("", "Minutes to each rank (median), and the minutes between ranks:", "");
lines.push("| rank | xp | " + ids.join(" | ") + " |", "|---|---:|" + ids.map(() => "---:").join("|") + "|");
for (let k = 1; k < RANKS.length; k++) {
  lines.push(`| ${RANKS[k]!.id} | ${RANKS[k]!.xp} | ${sums.map((s) => (s.rankMin[k] === undefined ? "–" : `${f(s.rankMin[k])} (+${f(s.rankMin[k]! - (s.rankMin[k - 1] ?? 0))})`)).join(" | ")} |`);
}
lines.push("", "Defeats a run, by main quest (mean):", "");
const keys = ["orientation", "ddl1", "studyGroup", "revision", "ddl2", "finalExam"] as const;
lines.push("| quest | " + ids.join(" | ") + " |", "|---|" + ids.map(() => "---:").join("|") + "|");
for (const k of keys) lines.push(`| ${k} | ${sums.map((s) => f(s.deaths[k] ?? 0, 2)).join(" | ")} |`);
const text = lines.join("\n");
console.log(text);
if (out) writeFileSync(out, text + "\n");
