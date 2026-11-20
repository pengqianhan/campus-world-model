// Takes the screenshot of a campus world of src/worlds/worlds.json: its play page, opened in the research
// browser of scripts/research/polite.mjs (robots.txt first, one request at a time at its pace, only the hosts
// named), left to load, and saved at 960×540 as src/worlds/screenshots/<id>.jpg. The entry's `screenshot`
// gets the file, the page and the day. A page that asks the visitor to sign in closes its host, and the
// entry is left without one. The maintainer runs it, one world at a time:
//   node scripts/worlds/screenshot.ts <id> [--allow <host>,...] [--wait <seconds>] [--close]
// A screenshot shows places, not people (AGENTS.md): --close shuts the page's open panels first (each visible
// button named close, ✕ or ×, in English or Chinese), for a page whose panel would show a person's name.
import fs from "node:fs";
import path from "node:path";
import { politeLaunch, politePage } from "../research/polite.mjs";
import type { World } from "../../src/worlds/worlds.ts";

const root = path.resolve(import.meta.dirname, "..", "..");
const listFile = path.join(root, "src", "worlds", "worlds.json");
const list = JSON.parse(fs.readFileSync(listFile, "utf8")) as { note: string; worlds: World[] };
const [id, ...rest] = process.argv.slice(2);
const opt = (name: string) => {
  const i = rest.indexOf(name);
  return i < 0 ? undefined : rest[i + 1];
};
const world = list.worlds.find((w) => w.id === id);
if (!world?.play) {
  console.error(world ? `${id} has no play link to take a screenshot of` : `usage: node scripts/worlds/screenshot.ts <id> [--allow <host>,...] [--wait <seconds>]`);
  process.exit(2);
}
const allow = opt("--allow")?.split(",").filter(Boolean) ?? [];
// Long enough for a 3D page to load its models one request at a time at the pace.
const waitMs = Number(opt("--wait") ?? 240) * 1000;

const { browser, close } = await politeLaunch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  const { page, log, closed, blocked } = await politePage(browser, { url: world.play, allow, viewport: { width: 960, height: 540 } });
  if (blocked) throw new Error(`${world.play} is blocked: ${blocked}`);
  await page.goto(world.play, { waitUntil: "domcontentloaded", timeout: 120_000 });
  // Wait for the page to go quiet, or for the time given, whichever comes first.
  await page.waitForLoadState("networkidle", { timeout: waitMs }).catch(() => {});
  await page.waitForTimeout(5000);
  if (rest.includes("--close")) {
    const closers = page.locator("button, [role=button]").filter({ hasText: /^\s*([✕×]|close|关闭|閉じる)\s*$/i });
    const named = page.locator('button[aria-label*="close" i], button[title*="close" i], button[aria-label*="关闭"], button[title*="关闭"]');
    for (const l of [closers, named]) {
      for (const b of await l.all()) {
        if (!(await b.isVisible())) continue;
        console.log(`closing: ${(await b.getAttribute("aria-label")) ?? (await b.textContent())?.trim()}`);
        await b.click().catch(() => {});
        await page.waitForTimeout(1500);
      }
    }
  }
  if (closed.size) throw new Error(`a host closed while loading: ${[...closed].map(([h, why]) => `${h} (${why})`).join(", ")}`);
  const file = `${world.id}.jpg`;
  fs.mkdirSync(path.join(root, "src", "worlds", "screenshots"), { recursive: true });
  await page.screenshot({ path: path.join(root, "src", "worlds", "screenshots", file), type: "jpeg", quality: 80 });
  world.screenshot = { file, url: world.play, date: new Date().toISOString().slice(0, 10) };
  delete world.noScreenshot;
  fs.writeFileSync(listFile, JSON.stringify(list, null, 2) + "\n");
  const sent = log.filter((r) => r.sent).length;
  console.log(`${world.id}: src/worlds/screenshots/${file}; ${sent} requests sent, ${log.length - sent} blocked`);
  for (const r of log.filter((r) => !r.sent).slice(0, 20)) console.log(`  blocked (${r.reason}) ${r.url}`);
} finally {
  await close();
}
