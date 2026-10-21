// Counts the triangles of one part per material and its build time: node tools/tower_count.mjs [part]
import { chromium } from "playwright";
import { PAGE } from "./page.mjs";
const part = process.argv[2] ?? "tower";
const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL ?? "chrome" });
const page = await browser.newPage();
page.on("console", (m) => console.log("[page]", m.text()));
await page.goto(`${PAGE}index.html?only=none`);
await page.waitForFunction(() => window.__ready === true, undefined, { timeout: 180000 });
const r = await page.evaluate(async (part) => {
  const THREE = await import("three");
  const { clockTower } = await import("/src/clocktower.js");
  const names = ["ashlar", "smooth", "dressed", "glass", "timber", "roof", "iron", "dial", "shade"];
  const mats = Object.fromEntries(names.map((n) => [n, Object.assign(new THREE.MeshBasicMaterial(), { userData: { metres: 2 } })]));
  const t0 = performance.now(); const g = clockTower(mats, [part]); const ms = performance.now() - t0;
  const per = {}; let total = 0;
  g.traverse((o) => { if (o.isMesh) { const n = o.geometry.attributes.position.count / 3; per[o.name] = n; total += n; } });
  return { ms: Math.round(ms), total, per };
}, part);
console.log(JSON.stringify(r));
await browser.close();
