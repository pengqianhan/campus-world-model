// Camera refinement: for each Street View panorama (its views share one camera), searches a small
// correction (position +-3 m, height +-1 m, yaw/pitch +-2 deg; bounds in the config) that best overlaps
// the model's silhouette (viewer/mask.html) with the photographs' building/sky boundary
// (refs/streetview/masks, from tools/sky_mask.py). Only the model above refine.min_height_m and the
// photo's solid/sky pixels count (trees, cars, people and dark glass are ignored). A correction is
// applied only where the photo's sky is well labelled round the model's silhouette (refine.min_sky of
// the model-sky pixels next to the silhouette are photo sky, at most refine.max_solid are photo solid)
// and it raises the IoU by refine.min_gain; otherwise the view keeps its Street View camera.
// Writes refs/streetview/views_refined.json (views.json with corrected position/target, plus a
// `refine` record per view) and out/refine/report.{json,md} and outline images.
//   node ../pipeline/tools/refine_cameras.mjs [--config config/<name>.json] [--match <pano>] [--out out/refine] [--no-images]
// (in the landmark's folder; ../pipeline/run.sh <name> refine runs it there).
// Needs the page served from the repository root on $PORT (run.sh starts it) and the masks (python -I tools/sky_mask.py).
import { chromium } from "playwright";
import { CONFIG, HERE, TOOLS, viewer } from "./page.mjs";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const cfg = JSON.parse(fs.readFileSync(arg("--config", CONFIG), "utf8"));
const R = cfg.refine, out = arg("--out", "out/refine"), match = arg("--match", ""), images = !process.argv.includes("--no-images");
fs.mkdirSync(out, { recursive: true });
const views = JSON.parse(fs.readFileSync("refs/streetview/views.json", "utf8"));
const panos = [...new Set(views.map((v) => v.pano))].filter((p) => p.includes(match));
const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL ?? "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=vulkan", "--enable-features=Vulkan"] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on("console", (m) => console.log("[page]", m.text()));
page.on("pageerror", (e) => console.log("[page error]", e.message));
await page.goto(viewer("mask.html", `cut=${R.min_height_m}`));
await page.waitForFunction(() => window.__ready === true, undefined, { timeout: 180000 });
for (const v of views) {
  if (!fs.existsSync(`refs/streetview/masks/${v.file.replace(".jpg", ".png")}`)) throw new Error(`no mask for ${v.file}: run python -I ../pipeline/tools/sky_mask.py`);
  await page.evaluate(([n, u]) => window.__loadMask(n, u), [v.file, `${HERE}refs/streetview/masks/${v.file.replace(".jpg", ".png")}`]);
}
const bounds = [R.position_m, R.height_m, R.position_m, R.yaw_deg, R.pitch_deg];
const old = fs.existsSync("refs/streetview/views_refined.json") ? JSON.parse(fs.readFileSync("refs/streetview/views_refined.json", "utf8")) : [];
const report = [];
const refined = views.map((v) => old.find((o) => o.file === v.file && JSON.stringify(o.refine?.from) === JSON.stringify({ position: v.position, target: v.target })) ?? v);
const t0 = Date.now();
for (const p of panos) {
  const vs = views.filter((v) => v.pano === p);
  const r = await page.evaluate(([vs, b, s]) => window.__search(vs, b, { scale: s[0], prior: s[1] }), [vs, bounds, [R.scale, R.prior ?? 0.01]]);
  const before = await page.evaluate(([vs, s]) => window.__score(vs, [0, 0, 0, 0, 0], s), [vs, R.scale]);
  const after = await page.evaluate(([vs, d, s]) => window.__score(vs, d, s), [vs, r.best, R.scale]);
  // trust it only when the photo shows enough of the building above the cut
  // and only when the photo's sky is well labelled round the model's silhouette (not haze, trees or flare)
  const rel = await page.evaluate(([vs, s]) => window.__reliability(vs, [0, 0, 0, 0, 0], s), [vs, R.scale]);
  const photo = after.reduce((s, x) => s + x.photo, 0), valid = after.reduce((s, x) => s + x.valid, 0);
  const ok = photo > 0.03 * valid && rel.sky >= (R.min_sky ?? 0.2) && rel.solid <= (R.max_solid ?? 0.5) && r.score - r.base >= (R.min_gain ?? 0.01);
  const d = ok ? r.best : [0, 0, 0, 0, 0];
  const rec = { pano: p, sky_round_silhouette: +rel.sky.toFixed(3), solid_round_silhouette: +rel.solid.toFixed(3), delta: r.best.map((x) => +x.toFixed(3)), applied: ok, iou_before: +r.base.toFixed(4), iou_after: +r.score.toFixed(4), evals: r.evals,
    views: vs.map((v, i) => ({ file: v.file, iou_before: +before[i].iou.toFixed(4), iou_after: +after[i].iou.toFixed(4), photo_px: after[i].photo, valid_px: after[i].valid })) };
  report.push(rec);
  for (const v of vs) {
    const c = await page.evaluate(([v, d]) => window.__place(v, d), [v, d]);
    const i = refined.findIndex((x) => x.file === v.file);
    refined[i] = { ...v, position: c.position, target: c.target,
      refine: { from: { position: v.position, target: v.target }, delta: { dx: d[0], dy: d[1], dz: d[2], dyaw_deg: d[3], dpitch_deg: d[4] }, applied: ok,
        iou_before: rec.views.find((x) => x.file === v.file).iou_before, iou_after: ok ? rec.views.find((x) => x.file === v.file).iou_after : rec.views.find((x) => x.file === v.file).iou_before } };
  }
  console.log(`${p.slice(0, 16)}: d = [${r.best.map((x) => x.toFixed(2)).join(", ")}]  IoU ${r.base.toFixed(3)} -> ${r.score.toFixed(3)}  round silhouette: sky ${(rel.sky * 100).toFixed(0)}% solid ${(rel.solid * 100).toFixed(0)}% ignore ${(rel.ignore * 100).toFixed(0)}%${ok ? "" : "  (not applied)"}  ${r.evals} evals`);
}
console.log(`search took ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (!match) fs.writeFileSync("refs/streetview/views_refined.json", JSON.stringify(refined, null, 1));
else console.log("--match given: views_refined.json not written");
fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 1));
const md = ["| panorama | sky / solid round silhouette | dx m | dy m | dz m | yaw ° | pitch ° | IoU before | IoU after | applied |", "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ...report.map((r) => `| ${r.pano.slice(0, 16)} | ${(r.sky_round_silhouette * 100).toFixed(0)}% / ${(r.solid_round_silhouette * 100).toFixed(0)}% | ${r.delta.map((x, i) => x.toFixed(i < 3 ? 2 : 2)).join(" | ")} | ${r.iou_before.toFixed(3)} | ${r.iou_after.toFixed(3)} | ${r.applied ? "yes" : "no"} |`)];
fs.writeFileSync(`${out}/report.md`, md.join("\n") + "\n");
console.log(md.join("\n"));
if (images) { // label images before/after, at half size, for the outline overlays
  const pairs = [];
  for (const r of report) for (const vf of r.views) {
    if (!/_(wide|tower)\.jpg$/.test(vf.file)) continue;
    const v = views.find((x) => x.file === vf.file), w = Math.round(v.width / 2), h = Math.round(v.height / 2);
    await page.setViewportSize({ width: w, height: h });
    for (const [tag, d] of [["before", [0, 0, 0, 0, 0]], ["after", r.applied ? r.delta : [0, 0, 0, 0, 0]]]) {
      await page.evaluate(([v, d, w, h]) => window.__label(v, d, w, h), [v, d, w, h]);
      await page.screenshot({ path: `${out}/${v.file.replace(".jpg", "")}_${tag}.png` });
    }
    pairs.push(`refs/streetview/${v.file}`, `${out}/${v.file.replace(".jpg", "")}_before.png`, `${out}/${v.file.replace(".jpg", "")}_after.png`);
  }
  await browser.close();
  execFileSync(process.env.PY ?? "python3", ["-I", path.join(TOOLS, "outline.py"), ...pairs], { stdio: "inherit" });
} else await browser.close();
