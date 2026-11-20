// The globe itself: the land drawn into a texture in the site's own palette (scripts/lib/picker.ts, STYLE), a pin
// for each campus (the site's own schools in its accent), turned by dragging and zoomed by the wheel or a pinch.
// A pin under the pointer names its campus; a click or a tap opens its page. It turns slowly by itself until
// someone touches it, and not at all for those who ask for less motion. It draws only while on screen.
import {
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { type GlobeData, type GlobeLand, type GlobePoint, facing, latLonToVector, mapPixel, middle } from "./data.ts";

/** The site's palette: the panels' ink for the sea, a lighter ink for the land, the accent for the site's own schools. */
const COLOURS = { sea: "#14222e", land: "#3b5163", coast: "#5d7487", own: 0xffb454, other: 0xeef3f6 };
const TEXTURE = { width: 2048, height: 1024 };
const PIN = 0.024;
const DISTANCE = { near: 1.9, far: 5.5, start: 4.1 };

/** The land drawn on an equirectangular map, sea behind it. */
function landTexture(land: GlobeLand): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE.width;
  canvas.height = TEXTURE.height;
  const g = canvas.getContext("2d")!;
  g.fillStyle = COLOURS.sea;
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.beginPath();
  for (const ring of land) {
    for (let i = 0; i < ring.length; i += 2) {
      const [x, y] = mapPixel(ring[i + 1]! / 10, ring[i]! / 10, canvas.width, canvas.height);
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
  }
  g.fillStyle = COLOURS.land;
  g.fill("evenodd");
  g.lineWidth = 1.5;
  g.strokeStyle = COLOURS.coast;
  g.stroke();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Puts the globe into `figure` and shows it. */
export async function mountGlobe(figure: HTMLElement, data: GlobeData, landUrl: string): Promise<void> {
  const res = await fetch(landUrl);
  if (!res.ok) throw new Error(`${landUrl}: HTTP ${res.status}`);
  const land = (await res.json()) as GlobeLand;

  const stage = figure.querySelector<HTMLElement>(".globe-stage")!;
  const tip = figure.querySelector<HTMLElement>(".globe-tip")!;
  figure.removeAttribute("hidden");

  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.setAttribute("aria-hidden", "true");
  stage.prepend(renderer.domElement);
  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 20);
  camera.position.set(0, 0, DISTANCE.start);

  const globe = new Group();
  scene.add(globe);
  const sphere = new Mesh(new SphereGeometry(1, 96, 64), new MeshBasicMaterial({ map: landTexture(land) }));
  globe.add(sphere);
  const pinGeometry = new SphereGeometry(PIN, 16, 12);
  const materials = { own: new MeshBasicMaterial({ color: COLOURS.own }), other: new MeshBasicMaterial({ color: COLOURS.other }) };
  const pins: Mesh[] = data.points.map((p) => {
    const pin = new Mesh(pinGeometry, p.own ? materials.own : materials.other);
    const [x, y, z] = latLonToVector(p.lat, p.lon);
    pin.position.set(x * (1 + PIN * 0.6), y * (1 + PIN * 0.6), z * (1 + PIN * 0.6));
    pin.userData.point = p;
    globe.add(pin);
    return pin;
  });

  const start = facing(middle(data.points).lat, middle(data.points).lon);
  globe.rotation.set(start.pitch, start.yaw, 0);

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let touchedAt = still ? Infinity : -Infinity;
  let visible = true;
  let dirty = true;

  const resize = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  new IntersectionObserver(([e]) => {
    visible = !!e?.isIntersecting;
  }).observe(stage);

  // What is under the pointer: the nearest pin on the side facing the viewer within a finger's reach on screen,
  // so a small pin is easy to hit and a pin behind the globe is never named.
  const world = new Vector3();
  const screen = new Vector3();
  const pick = (clientX: number, clientY: number, reach = 14): GlobePoint | undefined => {
    const r = renderer.domElement.getBoundingClientRect();
    camera.updateMatrixWorld();
    let best: { p: GlobePoint; d: number } | undefined;
    for (const pin of pins) {
      pin.getWorldPosition(world);
      // facing the camera: the pin's outward direction points toward it
      if (world.dot(screen.copy(camera.position).sub(world)) <= 0) continue;
      screen.copy(world).project(camera);
      const x = r.left + ((screen.x + 1) / 2) * r.width;
      const y = r.top + ((1 - screen.y) / 2) * r.height;
      const d = Math.hypot(x - clientX, y - clientY);
      if (d <= reach && (!best || d < best.d)) best = { p: pin.userData.point as GlobePoint, d };
    }
    return best?.p;
  };
  const show = (p: GlobePoint | undefined, clientX = 0, clientY = 0) => {
    if (!p) {
      tip.hidden = true;
      stage.style.cursor = "grab";
      return;
    }
    const r = stage.getBoundingClientRect();
    tip.querySelector(".site")!.textContent = p.site;
    tip.querySelector(".name")!.textContent = p.name;
    tip.style.left = `${Math.min(clientX - r.left + 14, r.width - 220)}px`;
    tip.style.top = `${clientY - r.top + 14}px`;
    tip.hidden = false;
    stage.style.cursor = "pointer";
  };

  // Turning and zooming. A press that moves less than a few pixels is a click.
  const pointers = new Map<number, { x: number; y: number }>();
  let travelled = 0;
  let pinchFrom = 0;
  const el = renderer.domElement;
  el.style.touchAction = "none";
  el.addEventListener("pointerdown", (e) => {
    el.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    travelled = 0;
    touchedAt = performance.now();
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchFrom = Math.hypot(a!.x - b!.x, a!.y - b!.y);
    }
  });
  el.addEventListener("pointermove", (e) => {
    const last = pointers.get(e.pointerId);
    if (!last) {
      // A mouse over the globe holds it still, so the pin it names stays under it.
      if (e.pointerType === "mouse") {
        touchedAt = still ? Infinity : performance.now();
        show(pick(e.clientX, e.clientY), e.clientX, e.clientY);
      }
      return;
    }
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    touchedAt = performance.now();
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (pinchFrom > 0) zoom(pinchFrom / d);
      pinchFrom = d;
      travelled += 10;
      return;
    }
    travelled += Math.abs(dx) + Math.abs(dy);
    const k = (0.9 * (camera.position.z - 1)) / stage.clientHeight;
    globe.rotation.y += dx * k * 2;
    globe.rotation.x = Math.max(-1.3, Math.min(1.3, globe.rotation.x + dy * k * 2));
    tip.hidden = true;
    dirty = true;
  });
  const release = (e: PointerEvent) => {
    const was = pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchFrom = 0;
    if (!was || travelled > 6) return;
    const p = pick(e.clientX, e.clientY, e.pointerType === "mouse" ? 14 : 24);
    if (!p) return show(undefined);
    // A mouse opens at once; a touch names the campus first, and a second tap on it opens it.
    if (e.pointerType === "mouse" || (!tip.hidden && tip.dataset.id === p.id)) window.location.href = p.href;
    else {
      tip.dataset.id = p.id;
      show(p, e.clientX, e.clientY);
    }
  };
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", (e) => pointers.delete(e.pointerId));
  el.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse" && !pointers.size) show(undefined);
  });
  const zoom = (factor: number) => {
    camera.position.z = Math.max(DISTANCE.near, Math.min(DISTANCE.far, camera.position.z * factor));
    dirty = true;
  };
  el.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      touchedAt = performance.now();
      zoom(Math.exp(e.deltaY * 0.001));
    },
    { passive: false },
  );

  // For the end-to-end tests: where each pin facing the viewer is on screen.
  (figure as HTMLElement & { pins?: () => { id: string; x: number; y: number }[] }).pins = () => {
    const r = renderer.domElement.getBoundingClientRect();
    camera.updateMatrixWorld();
    return pins.flatMap((pin) => {
      pin.getWorldPosition(world);
      if (world.dot(screen.copy(camera.position).sub(world)) <= 0) return [];
      screen.copy(world).project(camera);
      return [{ id: (pin.userData.point as GlobePoint).id, x: r.left + ((screen.x + 1) / 2) * r.width, y: r.top + ((1 - screen.y) / 2) * r.height }];
    });
  };

  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (visible) {
      // Turns eastward by itself, as the Earth does, after ten seconds untouched.
      if (now - touchedAt > 10_000 && pointers.size === 0) {
        globe.rotation.y += dt * 0.06;
        dirty = true;
      }
      if (dirty) {
        renderer.render(scene, camera);
        dirty = false;
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
