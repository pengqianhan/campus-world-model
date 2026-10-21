// The model seen from above, against the LiDAR: builds the whole model in the viewer's page, writes its
// triangles in the view frame to $OUT/triangles.bin (float32 x, y, z per corner), then runs topview.py,
// which compares the model's top-view heightmap with the LiDAR's. In the landmark's folder:
//   node ../pipeline/tools/topview.mjs [--out out/topview] [--only main,back]
// Needs the page served from the repository root on $PORT (run.sh starts it) and the data stage's points.
import { chromium } from "playwright";
import { NAME, CONFIG, viewer } from "./page.mjs";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const out = arg("--out", "out/topview"), only = arg("--only", "");
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL ?? "chrome" });
const page = await browser.newPage();
page.on("console", (m) => console.log("[page]", m.text()));
await page.goto(viewer("index.html", "only=none"));
await page.waitForFunction(() => window.__ready === true, undefined, { timeout: 180000 });
const tris = await page.evaluate(async ([name, only]) => {
  const THREE = await import("three");
  const { build } = await import(`/landmarks/${name}/model.js`);
  const mats = new Proxy({}, { get: (t, n) => (t[n] ??= Object.assign(new THREE.MeshBasicMaterial(), { userData: { metres: 2 } })) });
  const g = build(mats, only ? only.split(",") : undefined);
  g.updateMatrixWorld(true);
  const all = [];
  const v = new THREE.Vector3();
  g.traverse((o) => {
    if (!o.isMesh) return;
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    const p = geo.attributes.position;
    const n = o.isInstancedMesh ? o.count : 1, m = new THREE.Matrix4();
    for (let k = 0; k < n; k++) {
      if (o.isInstancedMesh) { o.getMatrixAt(k, m); m.premultiply(o.matrixWorld); } else m.copy(o.matrixWorld);
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m); all.push(v.x, v.y, v.z); }
    }
  });
  return all;
}, [NAME, only]);
await browser.close();
fs.writeFileSync(path.join(out, "triangles.bin"), Buffer.from(new Float32Array(tris).buffer));
console.log(`topview: ${tris.length / 9} triangles written to ${path.join(out, "triangles.bin")}`);
const py = process.env.PY ?? "python3";
const here = path.dirname(fileURLToPath(import.meta.url));
execFileSync(py, ["-I", path.join(here, "topview.py"), "--config", CONFIG, "--out", out], { stdio: "inherit" });
