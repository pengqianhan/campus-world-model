// Counts the triangles of one part per material and its build time. In the landmark's folder:
//   node ../pipeline/tools/part_count.mjs [part]
import { chromium } from "playwright";
import { NAME, viewer } from "./page.mjs";
const part = process.argv[2] ?? "tower";
const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL ?? "chrome" });
const page = await browser.newPage();
page.on("console", (m) => console.log("[page]", m.text()));
await page.goto(viewer("index.html", "only=none"));
await page.waitForFunction(() => window.__ready === true, undefined, { timeout: 180000 });
const r = await page.evaluate(async ([part, name]) => {
  const THREE = await import("three");
  const { build } = await import(`/landmarks/${name}/model.js`);
  // one flat material for every name the parts ask for (metres for worldUV)
  const mats = new Proxy({}, { get: (t, n) => (t[n] ??= Object.assign(new THREE.MeshBasicMaterial(), { userData: { metres: 2 } })) });
  const t0 = performance.now(); const g = build(mats, [part]); const ms = performance.now() - t0;
  const per = {}; let total = 0;
  g.traverse((o) => { if (o.isMesh) { const n = o.geometry.attributes.position.count / 3; per[o.name] = n; total += n; } });
  return { ms: Math.round(ms), total, per };
}, [part, NAME]);
console.log(JSON.stringify(r));
await browser.close();
