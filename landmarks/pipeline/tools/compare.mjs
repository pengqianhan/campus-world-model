// Renders the model from every reference view and writes, per view, the render and a strip of
// reference | render | half-and-half overlay, for looking at side by side; then the metrics
// (silhouette IoU, luminance and colour; tools/metrics.py) into <out>/metrics.{json,md}.
//   node ../pipeline/tools/compare.mjs --out out/<you> [--match tower] [--query "only=tower"] [--no-metrics]
// (in the landmark's folder; ../pipeline/run.sh <name> compare runs it there).
// Cameras: refs/streetview/views_refined.json (tools/refine_cameras.mjs) when present, else views.json.
// Needs the page served from the repository root on $PORT (default 8765; run.sh starts a server).
import { chromium } from "playwright";
import { CONFIG, TOOLS, viewer } from "./page.mjs";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const out = arg("--out", "out/compare"), match = arg("--match", ""), query = arg("--query", ""), metrics = !process.argv.includes("--no-metrics");
const PY = process.env.PY ?? "python3";
fs.mkdirSync(out, { recursive: true });
const refined = fs.existsSync("refs/streetview/views_refined.json");
const camFile = refined ? "views_refined.json" : "views.json";
const views = [
  ...JSON.parse(fs.readFileSync(`refs/streetview/${camFile}`, "utf8")).map((v) => ({ ...v, ref: `refs/streetview/${v.file}`, camera: v.refine?.applied ? "refined" : "street view" })),
].filter((v) => v.file.includes(match));
console.log(`cameras from refs/streetview/${camFile}`);
const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL ?? "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=vulkan", "--enable-features=Vulkan"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1067 } });
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("[page]", m.text()); });
page.on("pageerror", (e) => console.log("[page error]", e.message));
const t0 = Date.now();
await page.goto(viewer("index.html", query));
await page.waitForFunction(() => window.__ready === true, undefined, { timeout: 180000 });
console.log(`built in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
const done = [], used = [];
for (const v of views) {
  await page.setViewportSize({ width: v.width, height: v.height });
  const info = await page.evaluate((v) => window.__setView(v), v);
  const png = `${out}/${v.file.replace(/\.\w+$/, "")}.png`;
  await page.screenshot({ path: png });
  done.push([v.ref, png]);
  used.push({ file: v.file, ref: v.ref, render: png, label: `${out}/labels/${v.file.replace(/\.\w+$/, "")}.png`, camera: v.camera });
  console.log(`${v.file}: ${info.calls} calls, ${info.triangles} triangles`);
}
if (metrics) { // the model's silhouette from the same cameras (viewer/mask.html), for the metrics
  const cfg = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
  fs.mkdirSync(`${out}/labels`, { recursive: true });
  const mp = await browser.newPage({ viewport: { width: 800, height: 600 } });
  mp.on("pageerror", (e) => console.log("[mask page error]", e.message));
  await mp.goto(viewer("mask.html", `cut=${cfg.refine.min_height_m}&${query}`));
  await mp.waitForFunction(() => window.__ready === true, undefined, { timeout: 180000 });
  for (const [i, v] of views.entries()) {
    await mp.setViewportSize({ width: v.width, height: v.height });
    await mp.evaluate(([v, w, h]) => window.__label(v, [0, 0, 0, 0, 0], w, h), [v, v.width, v.height]);
    await mp.screenshot({ path: used[i].label });
  }
  fs.writeFileSync(`${out}/views_used.json`, JSON.stringify(used, null, 1));
}
await browser.close();
execFileSync(PY, ["-I", path.join(TOOLS, "strip.py"), ...done.flat()], { stdio: "inherit" });
if (metrics) execFileSync(PY, ["-I", path.join(TOOLS, "metrics.py"), out], { stdio: "inherit" });
