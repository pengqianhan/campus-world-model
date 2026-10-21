// A landmark drawn in code, seen from where the reference photos were taken: ?landmark=<name> (its
// folder in landmarks/). ?view=orbit to look round; ?overlay=0.5 to lay the reference over the picture.
// Look options: ?quality=high|medium|low (AO and MSAA / MSAA / neither, shadow map size), ?tone=neutral|
// agx|aces, ?exposure=, ?hour= (NZST, sun place), ?sunaz=&sunel= (compass bearing and elevation),
// ?mask=1 (building/sky mask for measuring), ?ids=1 (each material in its own flat colour, red = which
// material, green = which way the face looks: for measuring a render by surface), ?landscape=0 (leave
// out the landmark's landscape.js), ?haze= (0..1, a paler sky).
// A landmark's config may hold a `light` block: defaults for these numbers (sunaz, sunel, hour, sun, env,
// envsat, haze, exposure, fog), for the light of its own photographs. The address still wins; without the
// block the light is the Clock Tower's.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DIR, config, build } from "./landmark.js";
import { makeMaterials } from "../../kit/materials.js";
import { makeSky, sunPosition, frameDir, viewFrame } from "./sky.js";
import { makePost } from "./post.js";

const params = new URLSearchParams(location.search);
const light = config.light ?? {};
const num = (k, d) => (params.has(k) ? Number(params.get(k)) : typeof light[k] === "number" ? light[k] : d);
const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
const quality = params.get("quality") ?? (coarse ? "medium" : "high");
const ids = params.get("ids") === "1";
const mask = params.get("mask") === "1" || ids;

const renderer = new THREE.WebGLRenderer({ antialias: quality === "low", preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = mask ? THREE.NoToneMapping : { agx: THREE.AgXToneMapping, aces: THREE.ACESFilmicToneMapping, neutral: THREE.NeutralToneMapping }[params.get("tone") ?? "neutral"];
renderer.toneMappingExposure = num("exposure", 1.0);
renderer.shadowMap.enabled = !mask;
renderer.shadowMap.type = quality === "low" ? THREE.PCFShadowMap : THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const cam = await (await fetch(`${DIR}config/default_camera.json`)).json();
const camera = new THREE.PerspectiveCamera(cam.vfov, innerWidth / innerHeight, 0.3, 3000);
camera.position.fromArray(cam.position);
camera.lookAt(new THREE.Vector3().fromArray(cam.target));
let refImage = null;  // ?sv=<view file> sets it: the overlay needs a reference to lay over the picture
if (params.get("sv")) {
  const v = (await (await fetch(`${DIR}refs/streetview/views.json`)).json()).find((v) => v.file === params.get("sv"));
  camera.position.fromArray(v.position); camera.lookAt(new THREE.Vector3().fromArray(v.target));
  camera.fov = v.vfov; camera.updateProjectionMatrix();
  refImage = `${DIR}refs/streetview/${v.file}`;
}
if (params.get("pos")) {
  camera.position.fromArray(params.get("pos").split(",").map(Number));
  camera.lookAt(new THREE.Vector3().fromArray(params.get("look").split(",").map(Number)));
  camera.fov = num("fov", 50); camera.updateProjectionMatrix();
}

// ---- light: the low winter sun behind the building, the blue sky in front --------------------------
const sunPlace = sunPosition(num("hour", 9.25));
const sunDir = frameDir(viewFrame(config.frame), num("sunaz", sunPlace.bearing), num("sunel", sunPlace.elevation));
const { sky } = makeSky(renderer, scene, { sunDir, envIntensity: num("env", 2.25), envSat: num("envsat", 0.5), haze: num("haze", 0), quality });
scene.fog = new THREE.FogExp2(0xb4c4d8, num("fog", 0.0018));

const sun = new THREE.DirectionalLight(0xfff0dc, num("sun", 8.0));
sun.position.copy(sunDir).multiplyScalar(150);
sun.target.position.set(0, 0, 0);
sun.castShadow = !mask;
const smap = { high: 4096, medium: 2048, low: 1024 }[quality] ?? 2048;
sun.shadow.mapSize.set(smap, smap);
{
  // fit the shadow camera round the building, the trees and the street, as seen from the sun
  const look = new THREE.Matrix4().lookAt(sun.position, new THREE.Vector3(), new THREE.Vector3(0, 1, 0)).invert();
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity), hi = lo.clone().negate(), p = new THREE.Vector3();
  for (const x of [-75, 70]) for (const y of [-1, 42]) for (const z of [-35, 60]) {
    p.set(x, y, z).sub(sun.position).applyMatrix4(look); lo.min(p); hi.max(p);
  }
  Object.assign(sun.shadow.camera, { left: lo.x, right: hi.x, bottom: lo.y, top: hi.y, near: Math.max(1, -hi.z - 5), far: -lo.z + 5 });
  sun.shadow.camera.updateProjectionMatrix();
}
sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.04;
sun.shadow.radius = 2;
scene.add(sun, sun.target);

// ---- the building and the street ---------------------------------------------------------------
const materials = makeMaterials(quality);
const building = build(materials, params.get("only")?.split(","));
building.name = "building";
scene.add(building);
// The street round the building, when the landmark has one (landscape.js beside its model.js).
const hasLand = params.get("landscape") !== "0" && (await fetch(`${DIR}landscape.js`, { method: "HEAD" })).ok;
const land = hasLand ? (await import(`${DIR}landscape.js`)).landscape(scene, { quality, shadows: !mask }) : null;

// ---- mask mode: building above 2.3 m white, below red, sky blue, everything else black ---------------
if (mask) {
  const bMat = new THREE.ShaderMaterial({
    vertexShader: "varying float vy; void main(){ vy = (modelMatrix * vec4(position, 1.0)).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "varying float vy; void main(){ gl_FragColor = vy > 2.3 ? vec4(1.0) : vec4(1.0, 0.0, 0.0, 1.0); }",
  });
  // ?ids=1: red = 10 x (the material's place in the kit's list + 1), green = the face's world normal,
  // 40 +x, 80 -x, 120 +y, 160 -y, 200 +z, 240 -z (the largest component); blue 255
  const names = Object.keys(materials);
  const idMat = (name) => new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    vertexShader: "varying vec3 vn; void main(){ vn = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `varying vec3 vn; void main(){ vec3 n = normalize(gl_FrontFacing ? vn : -vn), a = abs(n);
      float g = a.x >= a.y && a.x >= a.z ? (n.x > 0.0 ? 40.0 : 80.0) : a.y >= a.z ? (n.y > 0.0 ? 120.0 : 160.0) : (n.z > 0.0 ? 200.0 : 240.0);
      gl_FragColor = vec4(${(10 * (names.indexOf(name) + 1)).toFixed(1)} / 255.0, g / 255.0, 1.0, 1.0); }`,
  });
  building.traverse((o) => { if (o.isMesh) o.material = ids ? idMat(o.name) : bMat; });
  land?.traverse((o) => { if (o.isMesh) o.material = new THREE.MeshBasicMaterial({ color: 0x000000 }); });
  sky.material = new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.BackSide, depthWrite: false });
  scene.fog = null; scene.environment = null;
}

const post = makePost(renderer, scene, camera, mask ? "low" : quality, { radius: num("aor", 0.7), intensity: num("aoi", 1.0), thickness: num("aot", 1.0) });

if (params.get("view") === "orbit") {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 12, 0); controls.update();
  addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); post.setSize(innerWidth, innerHeight); });
  renderer.setAnimationLoop(() => post.render());
}
if (params.get("overlay") && refImage) {
  const img = Object.assign(document.createElement("img"), { src: refImage });
  Object.assign(img.style, { position: "fixed", inset: 0, width: "100%", height: "100%", opacity: params.get("overlay"), pointerEvents: "none" });
  document.body.appendChild(img);
  await img.decode();
}
post.render();
post.render();
// the scene's own cost (the post passes draw it again, so renderer.info over-counts): triangles and draw calls
function cost(root) {
  let tris = 0, calls = 0;
  root.traverse((o) => {
    if (!o.isMesh || !o.visible || o === sky) return;
    const g = o.geometry, n = g.index ? g.index.count : g.attributes.position.count;
    tris += (n / 3) * (o.isInstancedMesh ? o.count : 1); calls++;
  });
  return { tris: Math.round(tris), calls };
}
const info = () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, building: cost(building), landscape: land ? cost(land) : null });
// for tools/compare.mjs: put the camera where a reference view was taken and draw
window.__setView = (v) => {
  post.setSize(v.width, v.height);
  camera.aspect = v.width / v.height; camera.fov = v.vfov;
  camera.position.fromArray(v.position); camera.lookAt(new THREE.Vector3().fromArray(v.target));
  camera.updateProjectionMatrix();
  renderer.info.autoReset = false; renderer.info.reset();
  post.render();
  const i = info(); renderer.info.autoReset = true;
  return i;
};
window.__info = info();
if (params.has("costs")) land?.children.forEach((o) => console.log("cost", o.name, JSON.stringify(cost(o))));
window.__ready = true;
