// Silhouette page for camera refinement and metrics (pipeline-owned; imports the model directly and
// never touches src/main.js). The model is drawn flat on black: red = building above the cut height,
// yellow = building below it, green = the ground plane, black = sky. Green channel set = left out of
// the overlap (IoU); red channel set = building.
//   http://localhost:8765/tools/mask.html[?only=tower,centre][&cut=8]
// API for tools/refine_cameras.mjs and tools/compare.mjs:
//   __loadMask(name, url)  -> loads a reference mask (0 sky, 128 ignore, 255 solid)
//   __score(views, delta, scale) -> per view {inter, union, model, photo, valid}
//   __search(views, bounds, opts) -> {best, score, base, evals}
//   __label(view, delta, w, h) -> draws the label image on the canvas (for screenshots)
import * as THREE from "three";
import { clockTower } from "../src/clocktower.js";

const params = new URLSearchParams(location.search);
const cut = { value: Number(params.get("cut") ?? 8) };
const label = new THREE.ShaderMaterial({
  uniforms: { cut },
  vertexShader: "varying float vY; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }",
  fragmentShader: "uniform float cut; varying float vY; void main(){ gl_FragColor = vY > cut ? vec4(1.0, 0.0, 0.0, 1.0) : vec4(1.0, 1.0, 0.0, 1.0); }",
  side: THREE.DoubleSide,
});
const groundMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// every material name the parts ask for maps to the one flat material (metres for worldUV)
label.userData.metres = 2;
const materials = new Proxy({}, { get: () => label });

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setClearColor(0x000000, 1);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const t0 = performance.now();
const model = clockTower(materials, params.get("only")?.split(","));
model.traverse((o) => { if (o.isMesh) o.material = label; }); // also parts that bring their own materials
scene.add(model);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), groundMat);
ground.position.y = -0.02; scene.add(ground);
let tris = 0; model.traverse((o) => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
console.log(`mask model built in ${(performance.now() - t0).toFixed(0)} ms, ${tris | 0} triangles`);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 3000);

/** Puts the camera at a view moved by delta = [dx, dy, dz (m), dyaw (deg, + pans right), dpitch (deg, + up)]. */
function place(v, d = [0, 0, 0, 0, 0]) {
  const p = new THREE.Vector3().fromArray(v.position), t = new THREE.Vector3().fromArray(v.target);
  const dir = t.clone().sub(p); const len = dir.length(); dir.normalize();
  const yaw = Math.atan2(dir.x, -dir.z) + THREE.MathUtils.degToRad(d[3]);
  const pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)) + THREE.MathUtils.degToRad(d[4]);
  const nd = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
  const np = p.clone().add(new THREE.Vector3(d[0], d[1], d[2]));
  camera.position.copy(np); camera.fov = v.vfov; camera.aspect = v.width / v.height; camera.up.set(0, 1, 0);
  camera.lookAt(np.clone().addScaledVector(nd, len)); camera.updateProjectionMatrix();
  return { position: np.toArray(), target: np.clone().addScaledVector(nd, len).toArray() };
}
window.__place = (v, d) => place(v, d);

const masks = {};
window.__loadMask = async (name, url) => {
  const img = new Image(); img.src = url; await img.decode();
  masks[name] = { img, cache: {} };
  return [img.width, img.height];
};
function maskAt(name, w, h) {
  const m = masks[name]; const k = `${w}x${h}`;
  if (!m.cache[k]) {
    const c = new OffscreenCanvas(w, h), g = c.getContext("2d", { willReadFrequently: true });
    g.imageSmoothingEnabled = false; g.drawImage(m.img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data, a = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) a[i] = d[i * 4];
    m.cache[k] = a;
  }
  return m.cache[k];
}
const targets = {};
function renderLabels(v, d, w, h) {
  const k = `${w}x${h}`;
  const rt = (targets[k] ??= new THREE.WebGLRenderTarget(w, h, { depthBuffer: true }));
  place(v, d);
  renderer.setRenderTarget(rt); renderer.render(scene, camera); renderer.setRenderTarget(null);
  const px = new Uint8Array(w * h * 4); renderer.readRenderTargetPixels(rt, 0, 0, w, h, px);
  return px; // rows bottom-up
}
/** Overlap of the model's silhouette (above the cut) with the photo's solid region, per view. */
function score1(v, d, scale) {
  const w = Math.max(8, Math.round(v.width * scale)), h = Math.max(8, Math.round(v.height * scale));
  const px = renderLabels(v, d, w, h), mk = maskAt(v.file, w, h);
  let inter = 0, union = 0, model = 0, photo = 0, valid = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = ((h - 1 - y) * w + x) * 4, m = mk[y * w + x];
    if (px[i + 1] > 127 || (m > 64 && m < 192)) continue;  // below the cut / ground, or ignore in the photo
    valid++;
    const a = px[i] > 127, b = m >= 192;
    if (a) model++; if (b) photo++; if (a && b) inter++; if (a || b) union++;
  }
  return { file: v.file, inter, union, model, photo, valid, iou: union ? inter / union : 0 };
}
/** How well the photo's sky is labelled round the model's silhouette: of the model-sky pixels within r px
 *  of the silhouette (above the cut), the share the photo calls sky, solid or ignore. */
window.__reliability = (views, d, scale = 0.25, r = 3) => {
  let near = 0, sky = 0, solid = 0;
  for (const v of views) {
    const w = Math.max(8, Math.round(v.width * scale)), h = Math.max(8, Math.round(v.height * scale));
    const px = renderLabels(v, d, w, h), mk = maskAt(v.file, w, h);
    const bld = (x, y) => px[((h - 1 - y) * w + x) * 4] > 127;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = ((h - 1 - y) * w + x) * 4;
      if (px[i] > 127 || px[i + 1] > 127) continue;
      let close = false;
      for (let dy = -r; dy <= r && !close; dy++) for (let dx = -r; dx <= r && !close; dx++) {
        const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && bld(xx, yy)) close = true;
      }
      if (!close) continue;
      near++; const m = mk[y * w + x]; if (m < 64) sky++; else if (m >= 192) solid++;
    }
  }
  return { near, sky: near ? sky / near : 0, solid: near ? solid / near : 0, ignore: near ? 1 - (sky + solid) / near : 0 };
};
window.__score = (views, d, scale = 0.25) => views.map((v) => score1(v, d, scale));
const total = (r) => { const i = r.reduce((s, x) => s + x.inter, 0), u = r.reduce((s, x) => s + x.union, 0); return u ? i / u : 0; };

/** Compass search over delta within bounds (multi-start), maximising the pooled IoU of the views. */
window.__search = (views, bounds, opts = {}) => {
  const scale = opts.scale ?? 0.25, B = bounds; let evals = 0;
  // pooled IoU minus a small prior that keeps the camera near the Street View position when the overlap is flat
  const prior = opts.prior ?? 0.01;
  const iou = (d) => { evals++; return total(views.map((v) => score1(v, d, scale))); };
  const f = (d) => iou(d) - prior * d.reduce((s, x, i) => s + (x / B[i]) ** 2, 0);
  const clampD = (d) => d.map((x, i) => Math.max(-B[i], Math.min(B[i], x)));
  const base = iou([0, 0, 0, 0, 0]);
  let best = [0, 0, 0, 0, 0], bestS = base;
  const starts = opts.starts ?? [[0, 0, 0, 0, 0], [2, 0, 0, 0, 0], [-2, 0, 0, 0, 0], [0, 0, 2, 0, 0], [0, 0, -2, 0, 0]];
  for (const s0 of starts) {
    let x = clampD(s0), fx = f(x), step = B.map((b) => b / 2);
    while (step[0] > B[0] / 24) {
      let improved = false;
      for (let i = 0; i < 5; i++) for (const sg of [1, -1]) {
        const y = x.slice(); y[i] += sg * step[i]; const c = clampD(y);
        if (c[i] === x[i]) continue;
        const fy = f(c);
        if (fy > fx + 1e-6) { x = c; fx = fy; improved = true; }
      }
      if (!improved) step = step.map((s) => s / 2);
    }
    if (fx > bestS) { best = x; bestS = fx; }
  }
  return { best, score: iou(best), objective: bestS, base, evals };
};

/** Draws the label image of a view on the page's canvas (for screenshots). */
window.__label = (v, d, w, h) => {
  renderer.setSize(w, h); place(v, d); renderer.render(scene, camera);
};
window.__ready = true;
