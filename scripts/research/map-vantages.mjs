// The map's pixel diff (.claude/skills/street-look/CHECKS.md, "The map's pixel diff"; the eight
// vantages of docs/schools/DESIGN.md, section 9). It takes canvas-only shots of the map at eight
// vantages, 1280 x 800, with the interface and the walkers hidden, and diffs two sets of them at
// threshold 0. Build each commit, serve each build with `vite preview` on a port of its own, shoot
// both, and diff; repeat three times on the GPU and three times on SwiftShader.
//
//   node scripts/research/map-vantages.mjs shoot <site address> <folder> [gpu|swiftshader]
//   node scripts/research/map-vantages.mjs diff <folder a> <folder b>
//
// The site address ends with the base, for example http://localhost:4273/campus-world-model/.
// `shoot` asks only that address: every request to another origin, such as the app's own call for
// the weather (Open-Meteo), is aborted, and Preview's sky does not use the weather. `diff` prints, for each vantage, the pixels that differ and the
// largest difference in any channel, out of 255, and exits 1 when any pixel differs. A difference
// that comes and goes between runs of the same build is issue #51 of UoA World Model: on
// 2026-10-26 vantage 4 differed so on the GPU, by at most 4/255; a steady one is a change.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { decodePng } from "../lib/png.ts";

const T = "light=day&time=preview&date=2026-03-20&t=15:00";

/** The eight vantages: a name, the query, and whether the map is shot after leaving a walker view. */
const VANTAGES = [
  { name: "1-day", query: `?${T}` },
  { name: "2-night", query: "?light=night&time=preview&date=2026-03-20&t=21:00" },
  { name: "3-building", query: `?building=303&${T}` },
  { name: "4-below-ground", query: "?building=310&floor=B2&light=day&time=preview&date=2026-03-20&t=12:00" },
  { name: "5-grafton", query: `?campus=grafton&${T}` },
  { name: "6-leigh", query: `?campus=leigh&${T}` },
  { name: "7-after-follow", query: `?walk=1&view=follow&${T}`, leave: true },
  { name: "8-after-eyes", query: `?walk=1&view=eyes&${T}`, leave: true },
];

const GL = {
  gpu: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
  swiftshader: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
};

/** Waits for data, the first frames, and any camera animation to finish, as e2e/helpers.ts settle() does. */
async function settle(page) {
  await page.waitForFunction(() => !!window.__scene && window.__scene.frames > 2, undefined, { timeout: 120_000 });
  await page.waitForFunction(() => !document.querySelector(".splash"), undefined, { timeout: 120_000 });
  await page.waitForFunction(() => !window.__scene.animating && !window.__scene.loading && !window.__scene.preparing, undefined, { timeout: 120_000 });
  await page.waitForTimeout(250);
}

async function shoot(site, folder, gl = "gpu") {
  if (!GL[gl]) throw new Error(`the renderer is gpu or swiftshader, not ${gl}`);
  fs.mkdirSync(folder, { recursive: true });
  const browser = await chromium.launch({ args: GL[gl] });
  try {
    for (const v of VANTAGES) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
      const origin = new URL(site).origin;
      await page.route("**/*", (route) => (new URL(route.request().url()).origin === origin ? route.continue() : route.abort()));
      await page.goto(new URL(v.query, site).href);
      await settle(page);
      if (v.leave) {
        await page.waitForFunction(() => window.__walker?.ready(), undefined, { timeout: 120_000 });
        await page.waitForFunction(() => window.__scene.streetState().sky, undefined, { timeout: 120_000 });
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => document.querySelector('#walker-panel button[data-view="map"]')?.getAttribute("aria-pressed") === "true", undefined, { timeout: 120_000 });
        await settle(page);
      }
      // The canvas alone: every other element hidden, and the walkers, which move by the clock, taken off.
      const box = await page.evaluate(() => {
        const s = window.__scene;
        const canvas = s.renderer.domElement;
        canvas.setAttribute("data-vantage", "");
        const style = document.createElement("style");
        style.textContent = "body * { visibility: hidden !important; } canvas[data-vantage] { visibility: visible !important; }";
        document.head.append(style);
        s.walkers.group.visible = false;
        s.needsRender = true;
        const r = canvas.getBoundingClientRect();
        return { x: r.left, y: r.top, width: r.width, height: r.height, frames: s.frames };
      });
      await page.waitForFunction((f) => window.__scene.frames > f, box.frames, { timeout: 120_000 });
      await settle(page);
      await page.screenshot({ path: path.join(folder, `${v.name}.png`), clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
      await page.close();
      console.log(`${v.name}: shot`);
    }
  } finally {
    await browser.close();
  }
}

function diff(a, b) {
  let changed = 0;
  for (const v of VANTAGES) {
    const x = decodePng(fs.readFileSync(path.join(a, `${v.name}.png`)));
    const y = decodePng(fs.readFileSync(path.join(b, `${v.name}.png`)));
    if (x.width !== y.width || x.height !== y.height) {
      console.log(`${v.name}: sizes differ, ${x.width} x ${x.height} and ${y.width} x ${y.height}`);
      changed++;
      continue;
    }
    let pixels = 0;
    let most = 0;
    for (let i = 0; i < x.rgb.length; i += 3) {
      const d = Math.max(Math.abs(x.rgb[i] - y.rgb[i]), Math.abs(x.rgb[i + 1] - y.rgb[i + 1]), Math.abs(x.rgb[i + 2] - y.rgb[i + 2]));
      if (d > 0) pixels++;
      if (d > most) most = d;
    }
    console.log(`${v.name}: ${pixels} pixels differ, at most ${most}/255`);
    if (pixels) changed++;
  }
  return changed;
}

const [mode, ...args] = process.argv.slice(2);
if (mode === "shoot" && args.length >= 2) await shoot(args[0], args[1], args[2]);
else if (mode === "diff" && args.length === 2) process.exitCode = diff(args[0], args[1]) ? 1 : 0;
else {
  console.error("usage: map-vantages.mjs shoot <site address> <folder> [gpu|swiftshader] | diff <folder a> <folder b>");
  process.exitCode = 2;
}
