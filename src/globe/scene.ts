// The globe itself: the land drawn into a texture in the site's own palette (scripts/lib/picker.ts, STYLE), a pin
// for each campus (the site's own schools in its accent), and a line for each lineage a project states in public.
// It is turned by dragging and zoomed by the wheel or a pinch. The pins under the pointer are named, all of them
// where campuses stand closer than any zoom can part; a click opens a lone campus and offers a choice among several,
// and a tap always offers the choice. A tour visits the campuses in the order they joined. On a wide screen with a
// mouse it starts by itself after ten seconds untouched; on a phone, or for those who ask for less motion, only
// from its button. Any input stops it. The globe draws only while on screen.
import {
  BackSide,
  CanvasTexture,
  CatmullRomCurve3,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { type GlobeData, type GlobeLand, type GlobePoint, arcPoints, facing, latLonToVector, mapPixel, middle, tourOrder, within } from "./data.ts";

/**
 * The site's palette, light: a pale sky blue for the sea, its sand (--ground) for the land with its edge colour for
 * the coast, the accent for the site's own schools and a deep sea blue for the others'. Every pin has a thin
 * outline in the site's ink, so both show on sea and sand alike. Lineage is drawn in the darker accent.
 */
const COLOURS = { sea: "#bfd9e6", land: "#f6f1e4", coast: "#8b7b62", own: 0xffb454, other: 0x2c6e8f, ring: 0x0f1b25, arc: 0xc06a0c };
const TEXTURE = { width: 2048, height: 1024 };
const PIN = 0.021;
const DISTANCE = { near: 1.9, far: 5.5, start: 4.1 };
/** How long the tour stays at a campus once it has arrived, and how long the globe waits untouched before it turns or tours by itself. */
const DWELL_MS = 4500;
const IDLE_MS = 10_000;

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
  g.lineWidth = 2;
  g.strokeStyle = COLOURS.coast;
  g.stroke();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** What the list beside the globe can ask of it. */
export interface GlobeControl {
  /** Stops the tour, turns the globe to a campus, lights its pin and names it. */
  focus(id: string): void;
  /** Lets go of the campus focus() named. */
  release(): void;
}

/** An element with its text, made safe by being text. */
function el(tag: string, cls: string, text: string): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.textContent = text;
  return e;
}

/**
 * Puts the globe into `figure` and shows it. `onLight` hears the campuses whose pins are named, or none, so that
 * the list can light their lines.
 */
export async function mountGlobe(figure: HTMLElement, data: GlobeData, landUrl: string, onLight: (ids: string[]) => void = () => {}): Promise<GlobeControl> {
  const res = await fetch(landUrl);
  if (!res.ok) throw new Error(`${landUrl}: HTTP ${res.status}`);
  const land = (await res.json()) as GlobeLand;

  const stage = figure.querySelector<HTMLElement>(".globe-stage")!;
  const tip = figure.querySelector<HTMLElement>(".globe-tip")!;
  const tourButton = figure.querySelector<HTMLButtonElement>(".globe-tour")!;
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
  const materials = {
    own: new MeshBasicMaterial({ color: COLOURS.own }),
    other: new MeshBasicMaterial({ color: COLOURS.other }),
    ring: new MeshBasicMaterial({ color: COLOURS.ring, side: BackSide }),
    arc: new MeshBasicMaterial({ color: COLOURS.arc }),
  };
  const byId = new Map(data.points.map((p) => [p.id, p]));
  const pins: Mesh[] = data.points.map((p) => {
    const pin = new Mesh(pinGeometry, p.own ? materials.own : materials.other);
    const [x, y, z] = latLonToVector(p.lat, p.lon);
    pin.position.set(x * (1 + PIN * 1.2), y * (1 + PIN * 1.2), z * (1 + PIN * 1.2));
    // the outline: a larger ball drawn on its far side only, so it rims the pin from every angle
    const ring = new Mesh(pinGeometry, materials.ring);
    ring.scale.setScalar(1.28);
    pin.add(ring);
    pin.userData.point = p;
    globe.add(pin);
    return pin;
  });
  for (const arc of data.arcs) {
    const a = byId.get(arc.from);
    const b = byId.get(arc.to);
    if (!a || !b) continue;
    const curve = new CatmullRomCurve3(arcPoints(a, b).map(([x, y, z]) => new Vector3(x, y, z)));
    globe.add(new Mesh(new TubeGeometry(curve, 96, 0.004, 6, false), materials.arc));
  }
  /** The words of a campus's lineage: who inspired it, if a project says so. */
  const lineage = (p: GlobePoint): string | undefined => {
    const arc = data.arcs.find((x) => x.to === p.id);
    const from = arc && byId.get(arc.from);
    return from ? data.words.inspired.replace("{from}", from.site) : undefined;
  };

  const start = facing(middle(data.points).lat, middle(data.points).lon);
  globe.rotation.set(start.pitch, start.yaw, 0);

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // A tour starts by itself only on a wide screen with a mouse (PROGRESS.md, "Decisions": not on a phone).
  const tourByItself = !still && window.matchMedia("(min-width: 900px) and (pointer: fine)").matches;
  let touchedAt = performance.now();
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

  // Where each pin facing the viewer is on the page.
  const world = new Vector3();
  const screen = new Vector3();
  const onScreen = (pin: Mesh): { x: number; y: number } | undefined => {
    const r = renderer.domElement.getBoundingClientRect();
    camera.updateMatrixWorld();
    pin.getWorldPosition(world);
    // facing the camera: the pin's outward direction points toward it
    if (world.dot(screen.copy(camera.position).sub(world)) <= 0) return undefined;
    screen.copy(world).project(camera);
    return { x: r.left + ((screen.x + 1) / 2) * r.width, y: r.top + ((1 - screen.y) / 2) * r.height };
  };
  const shown = () => pins.flatMap((pin) => {
    const at = onScreen(pin);
    return at ? [{ pin, p: pin.userData.point as GlobePoint, ...at }] : [];
  });
  /** The campuses under the pointer: every pin facing the viewer within reach, nearest first. */
  const pick = (clientX: number, clientY: number, reach: number): GlobePoint[] => within(shown(), clientX, clientY, reach).map((q) => q.p);

  // The pins that are lit, drawn larger, and their lines in the list.
  let litIds: string[] = [];
  const light = (ids: string[]) => {
    if (ids.join() === litIds.join()) return;
    for (const pin of pins) pin.scale.setScalar(ids.includes((pin.userData.point as GlobePoint).id) ? 1.9 : 1);
    litIds = ids;
    onLight(ids);
    dirty = true;
  };

  /**
   * Names campuses by the given place on the page: one by its project and its school, with its lineage; several as
   * a list. `links`: as links to their pages, for a click among several or a tap, and the name can be chosen.
   */
  const name = (ps: GlobePoint[], clientX: number, clientY: number, links = false) => {
    light(ps.map((p) => p.id));
    if (!ps.length) {
      tip.hidden = true;
      tip.classList.remove("open");
      stage.style.cursor = "grab";
      return;
    }
    tip.replaceChildren();
    const entry = (p: GlobePoint, box: HTMLElement) => {
      box.append(el("p", "site", p.site));
      const n = el("p", "name", links ? "" : p.name);
      if (links) {
        const a = el("a", "", p.name) as HTMLAnchorElement;
        a.href = p.href;
        n.append(a);
      }
      box.append(n);
      const l = lineage(p);
      if (l) box.append(el("p", "lineage", l));
    };
    if (ps.length === 1) entry(ps[0]!, tip);
    else {
      tip.append(el("p", "site", data.words.group.replace("{count}", String(ps.length))));
      const ul = document.createElement("ul");
      for (const p of ps) {
        const li = document.createElement("li");
        entry(p, li);
        ul.append(li);
      }
      tip.append(ul);
    }
    tip.classList.toggle("open", links);
    tip.hidden = false;
    const r = stage.getBoundingClientRect();
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    tip.style.left = `${Math.max(8, Math.min(clientX - r.left + 14, r.width - w - 8))}px`;
    tip.style.top = `${Math.max(8, Math.min(clientY - r.top + 14, r.height - h - 8))}px`;
    stage.style.cursor = "pointer";
  };

  // Where the globe is turning to, for a campus named from the list or by the tour, and that campus, whose name follows its pin.
  let aim: { yaw: number; pitch: number } | undefined;
  let focused: GlobePoint | undefined;
  const turnTo = (p: GlobePoint) => {
    const to = facing(p.lat, p.lon);
    // the same turn, give or take whole turns, nearest to where the globe is now
    const turns = Math.round((globe.rotation.y - to.yaw) / (2 * Math.PI));
    aim = { yaw: to.yaw + turns * 2 * Math.PI, pitch: Math.max(-1.3, Math.min(1.3, to.pitch)) };
    focused = p;
    light([p.id]);
    dirty = true;
  };

  // The tour: each campus in turn, in the order it joined, round and round until something stops it.
  const stops = tourOrder(data.points);
  let tour: { at: number; arrivedAt?: number } | undefined;
  const setTour = (on: boolean) => {
    if (on && !tour) {
      tour = { at: -1 };
      next();
    } else if (!on && tour) {
      tour = undefined;
      focused = undefined;
      aim = undefined;
      name([], 0, 0);
    }
    tourButton.textContent = tour ? data.words.stop : data.words.tour;
    tourButton.setAttribute("aria-pressed", String(!!tour));
  };
  const next = () => {
    if (!tour || !stops.length) return;
    tour.at = (tour.at + 1) % stops.length;
    tour.arrivedAt = undefined;
    turnTo(stops[tour.at]!);
  };
  tourButton.hidden = !stops.length;
  tourButton.addEventListener("click", () => {
    touchedAt = performance.now();
    setTour(!tour);
  });
  /** Someone did something: the tour stops, and the globe waits before it moves by itself again. */
  const touched = () => {
    touchedAt = performance.now();
    if (tour) setTour(false);
  };
  window.addEventListener("keydown", (e) => {
    if (e.target !== tourButton) touched();
  });

  // Turning and zooming. A press that moves less than a few pixels is a click.
  const pointers = new Map<number, { x: number; y: number }>();
  let travelled = 0;
  let pinchFrom = 0;
  const canvas = renderer.domElement;
  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", (e) => {
    // A pointer that cannot be captured (one the page made up) still turns and clicks.
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    travelled = 0;
    touched();
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchFrom = Math.hypot(a!.x - b!.x, a!.y - b!.y);
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    const last = pointers.get(e.pointerId);
    if (!last) {
      // A mouse over the globe holds it still, so the pins it names stay under it; a chooser that is open stays open.
      if (e.pointerType === "mouse" && !tip.classList.contains("open")) {
        touched();
        focused = undefined;
        name(pick(e.clientX, e.clientY, 14), e.clientX, e.clientY);
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
    aim = undefined;
    focused = undefined;
    const k = (0.9 * (camera.position.z - 1)) / stage.clientHeight;
    globe.rotation.y += dx * k * 2;
    globe.rotation.x = Math.max(-1.3, Math.min(1.3, globe.rotation.x + dy * k * 2));
    name([], 0, 0);
    dirty = true;
  });
  canvas.addEventListener("pointerup", (e) => {
    const was = pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchFrom = 0;
    if (!was || travelled > 6) return;
    const mouse = e.pointerType === "mouse";
    const ps = pick(e.clientX, e.clientY, mouse ? 14 : 24);
    // A click on a lone campus opens it; among several, and on any tap, the campuses are offered as links.
    if (mouse && ps.length === 1) window.location.href = ps[0]!.href;
    else name(ps, e.clientX, e.clientY, true);
  });
  canvas.addEventListener("pointercancel", (e) => pointers.delete(e.pointerId));
  canvas.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse" && !pointers.size && !tip.classList.contains("open") && !focused) name([], 0, 0);
  });
  const zoom = (factor: number) => {
    camera.position.z = Math.max(DISTANCE.near, Math.min(DISTANCE.far, camera.position.z * factor));
    dirty = true;
  };
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      touched();
      zoom(Math.exp(e.deltaY * 0.001));
    },
    { passive: false },
  );

  // For the end-to-end tests: where each pin facing the viewer is on screen, and whether the tour is on.
  Object.assign(figure, {
    pins: () => shown().map(({ p, x, y }) => ({ id: p.id, x, y })),
    touring: () => (tour ? stops[tour.at]?.id ?? null : null),
  });

  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (aim) {
      // Eases toward the campus named, the short way round.
      const k = still ? 1 : 1 - Math.exp(-dt * 4);
      globe.rotation.y += (aim.yaw - globe.rotation.y) * k;
      globe.rotation.x += (aim.pitch - globe.rotation.x) * k;
      if (Math.abs(aim.yaw - globe.rotation.y) + Math.abs(aim.pitch - globe.rotation.x) < 1e-3) {
        aim = undefined;
        if (tour) tour.arrivedAt = now;
      }
      dirty = true;
    }
    if (tour?.arrivedAt !== undefined && now - tour.arrivedAt > DWELL_MS) next();
    const idle = now - touchedAt > IDLE_MS && pointers.size === 0 && !tip.classList.contains("open");
    if (idle && !tour && !focused && tourByItself) setTour(true);
    else if (idle && !tour && !focused && !still) {
      // Turns eastward by itself, as the Earth does.
      globe.rotation.y += dt * 0.06;
      dirty = true;
    }
    if (focused && dirty) {
      const pin = pins.find((m) => m.userData.point === focused);
      const at = pin && onScreen(pin);
      if (at) name([focused], at.x - 14, at.y - 14);
      else tip.hidden = true;
      light([focused.id]);
    }
    if (visible && dirty) {
      renderer.render(scene, camera);
      dirty = false;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  setTour(false);

  return {
    focus(id) {
      const p = byId.get(id);
      if (!p) return;
      touched();
      // held until released, so that the globe neither turns nor tours under a line being read
      touchedAt = Infinity;
      tip.classList.remove("open");
      turnTo(p);
    },
    release() {
      focused = undefined;
      aim = undefined;
      touchedAt = performance.now();
      name([], 0, 0);
    },
  };
}
