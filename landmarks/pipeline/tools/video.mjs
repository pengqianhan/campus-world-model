// Renders the model along a camera path through the front panoramas' refined cameras, one frame per
// step, for tools/video.py to stack under the photographs as a video. At each panorama the camera
// holds (photo and model line up); between two, it moves and the photo crossfades.
//   node ../pipeline/tools/video.mjs --out out/video [--kinds wide,tower,door] [--panos 5w8k,d0Oz,aOMM] [--fps 30]
// (in the landmark's folder).
import { chromium } from "playwright";
import { viewer } from "./page.mjs";
import fs from "node:fs";
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const out = arg("--out", "out/video"), fps = Number(arg("--fps", 30));
const kinds = arg("--kinds", "wide,tower,door").split(","), panos = arg("--panos", "5w8kaFoBkWuw,d0Oz7kRxTCo9,aOMMiRPRCQ37").split(",");
const HOLD = 1.2, MOVE = 2.0, SCALE = { wide: 0.75, tower: 0.667, door: 0.833 };
const views = JSON.parse(fs.readFileSync("refs/streetview/views_refined.json", "utf8"));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);

const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL ?? "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=vulkan", "--enable-features=Vulkan"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
page.on("pageerror", (e) => console.log("[page error]", e.message));
await page.goto(viewer("index.html", arg("--query", "")));
await page.waitForFunction(() => window.__ready === true, undefined, { timeout: 180000 });
for (const kind of kinds) {
  const keys = panos.map((p) => views.find((v) => v.file.startsWith(p) && v.file.endsWith(`_${kind}.jpg`)));
  const path = [...keys, ...keys.slice(0, -1).reverse()]; // there and back, so the video loops
  const s = SCALE[kind], w = Math.round((keys[0].width * s) / 2) * 2, h = Math.round((keys[0].height * s) / 2) * 2;
  const dir = `${out}/${kind}`; fs.mkdirSync(dir, { recursive: true });
  await page.setViewportSize({ width: w, height: h });
  const frames = [];
  const shot = async (cam, photo) => {
    const n = frames.length, file = `${dir}/model_${String(n).padStart(4, "0")}.png`;
    await page.evaluate((v) => window.__setView(v), { ...cam, width: w, height: h });
    await page.screenshot({ path: file });
    frames.push({ model: file, photo });
  };
  for (let i = 0; i < path.length; i++) {
    const a = path[i], b = path[i + 1];
    for (let f = 0; f < HOLD * fps; f++) await shot(a, [[a.file, 1]]);
    if (!b) break;
    for (let f = 1; f <= MOVE * fps; f++) {
      const t = smooth(f / (MOVE * fps));
      await shot({ position: lerp(a.position, b.position, t), target: lerp(a.target, b.target, t), vfov: a.vfov + (b.vfov - a.vfov) * t }, [[a.file, 1 - t], [b.file, t]]);
    }
  }
  fs.writeFileSync(`${dir}/frames.json`, JSON.stringify({ kind, width: w, height: h, fps, keys: keys.map((k) => k.file), frames }, null, 1));
  console.log(`${kind}: ${frames.length} frames ${w}x${h}`);
}
await browser.close();
