// Study Quest's marks over the picture, moved in every frame: the compass tape, the names and health
// of the foes near, the numbers that jump from a blow, the quest's diamonds, the lock-on, the arcs
// that say where a blow came from. Every element is made once and kept; a frame changes only
// transforms and opacity, and text only when it changes.
import { Vector3, type Camera } from "three";
import { turnBetween } from "../shared/game.ts";

const PX_PER_DEG = 3;
/** Degrees of the compass's eight points, north first and clockwise; their names come from the visitor's language (setWords). */
const POINTS = [0, 45, 90, 135, 180, 225, 270, 315];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  parent?.appendChild(e);
  return e;
}

function setText(e: HTMLElement, text: string): void {
  if (e.textContent !== text) e.textContent = text;
}

/** A foe's plate, as the scene gives it. */
export interface PlateIn {
  id: number;
  /** Scene point over its head. */
  x: number;
  y: number;
  z: number;
  name: string;
  hp: number;
  max: number;
  elite: boolean;
  /** Showing an attack coming. */
  warn: boolean;
}

export interface MarkIn {
  /** Compass bearing from the walker, degrees. */
  bearing: number;
  metres: number;
  kind: "main" | "side" | "foe" | "boss";
  /** A scene point to put a diamond over, when it is to be drawn in the world too. */
  world?: [number, number, number];
}

const v = new Vector3();

export class GameOverlay {
  readonly root: HTMLDivElement;
  private compass: HTMLDivElement;
  private tape: HTMLDivElement;
  private heading: HTMLSpanElement;
  private cmarks: { e: HTMLDivElement; d: HTMLSpanElement }[] = [];
  private plates: { e: HTMLDivElement; name: HTMLElement; fill: HTMLElement; id: number; text: string }[] = [];
  private nums: { e: HTMLSpanElement; t: number; x: number; y: number; z: number; drift: number; pop: number }[] = [];
  private nextNum = 0;
  private marks: { e: HTMLDivElement; d: HTMLSpanElement }[] = [];
  private lock: HTMLDivElement;
  private hits: { e: HTMLDivElement; t: number }[] = [];
  private nextHit = 0;
  private arcs: { e: HTMLDivElement; t: number; bearing: number }[] = [];
  private nextArc = 0;
  private tick = 0;
  private hurtT = 0;
  private flashT = 0;
  private flashEl: HTMLDivElement;
  private compassWidth = 0;
  private used = new Set<number>();
  /** Whether the boss's bar is out: on a phone it takes a band under the vitals, so plates stay below it. */
  bossOut = false;
  /** The compass's points on the tape, three turns of each, and how a distance is written. */
  private points: HTMLElement[][] = POINTS.map(() => []);
  private metres: (m: number) => string = (m) => String(m);

  /** The compass's eight points' names, north first and clockwise, and how a distance in metres is written. */
  setWords(points: readonly string[], metres: (m: number) => string): void {
    this.points.forEach((els, i) => els.forEach((e) => setText(e, points[i] ?? "")));
    this.metres = metres;
  }

  constructor(parent: HTMLElement) {
    this.root = el("div", "gx", parent);
    this.root.setAttribute("aria-hidden", "true");
    this.root.hidden = true;
    el("div", "gx-vignette", this.root);
    this.flashEl = el("div", "gx-flash", this.root);
    this.compass = el("div", "gx-compass", this.root);
    const wrap = el("div", "gx-tape-wrap", this.compass);
    this.tape = el("div", "gx-tape", wrap);
    // Three turns of the tape, so that it never runs out at either end.
    for (let turn = -1; turn <= 1; turn++) {
      for (let d = 0; d < 360; d += 15) {
        const tickEl = el("i", d % 45 === 0 ? "mj" : "mn", this.tape);
        tickEl.style.left = `${(turn * 360 + d) * PX_PER_DEG}px`;
      }
      POINTS.forEach((d, i) => {
        const b = el("b", i % 2 === 0 ? "card" : "ic", this.tape);
        b.style.left = `${(turn * 360 + d) * PX_PER_DEG}px`;
        this.points[i]!.push(b);
      });
    }
    el("div", "gx-needle", this.compass);
    this.heading = el("span", "gx-heading", this.compass);
    const cm = el("div", "gx-cmarks", this.compass);
    for (let k = 0; k < 8; k++) {
      const e = el("div", "gx-cm", cm);
      el("i", "", e);
      const d = el("span", "", e);
      this.cmarks.push({ e, d });
    }
    const plates = el("div", "gx-plates", this.root);
    for (let k = 0; k < 14; k++) {
      const e = el("div", "gx-plate", plates);
      const name = el("b", "", e);
      const bar = el("i", "", e);
      const fill = el("span", "", bar);
      e.style.opacity = "0";
      this.plates.push({ e, name, fill, id: -1, text: "" });
    }
    const marks = el("div", "gx-marks", this.root);
    for (let k = 0; k < 6; k++) {
      const e = el("div", "gx-wm", marks);
      el("i", "", e);
      const d = el("span", "", e);
      e.style.opacity = "0";
      this.marks.push({ e, d });
    }
    this.lock = el("div", "gx-lock", this.root);
    for (let k = 0; k < 4; k++) el("i", "", this.lock);
    const nums = el("div", "gx-nums", this.root);
    for (let k = 0; k < 28; k++) {
      const e = el("span", "gx-num", nums);
      e.style.opacity = "0";
      this.nums.push({ e, t: 0, x: 0, y: 0, z: 0, drift: 0, pop: 1 });
    }
    for (let k = 0; k < 4; k++) {
      const e = el("div", "gx-hit", this.root);
      for (let j = 0; j < 4; j++) el("i", "", e);
      this.hits.push({ e, t: 0 });
    }
    const arcs = el("div", "gx-arcs", this.root);
    for (let k = 0; k < 4; k++) {
      const e = el("div", "gx-arc", arcs);
      e.innerHTML = '<svg viewBox="-50 -50 100 100"><path d="M -14 -46 A 48 48 0 0 1 14 -46"/></svg>';
      this.arcs.push({ e, t: 0, bearing: 0 });
    }
  }

  show(on: boolean): void {
    this.root.hidden = !on;
    if (!on) {
      for (const n of this.nums) ((n.t = 0), (n.e.style.opacity = "0"));
      for (const p of this.plates) ((p.id = -1), (p.e.style.opacity = "0"));
      this.root.classList.remove("low", "hurt", "slowed");
    }
  }

  /** A number that jumps from a scene point: a blow's damage, knowledge gained. */
  number(x: number, y: number, z: number, text: string, cls: string): void {
    const n = this.nums[this.nextNum]!;
    this.nextNum = (this.nextNum + 1) % this.nums.length;
    n.t = cls.includes("xp") ? 1.3 : 0.9;
    n.x = x;
    n.y = y;
    n.z = z;
    n.drift = (Math.random() - 0.5) * 40;
    n.e.className = `gx-num ${cls}`;
    // How far it jumps out at first: more for a harder blow.
    n.pop = cls.includes("crit") ? (cls.includes("heavy") ? 2.1 : 1.9) : cls.includes("heavy") ? 1.6 : cls.includes("light") ? 1.25 : 1.5;
    // Hidden until it is put in its place in the next frame, not shown where its last use left it.
    n.e.style.opacity = "0";
    setText(n.e, text);
  }

  /** The X that says a blow landed, at a scene point. */
  hit(x: number, y: number, z: number, kill: boolean, cam: Camera, w: number, h: number): void {
    const s = this.project(x, y, z, cam, w, h);
    if (!s) return;
    const m = this.hits[this.nextHit]!;
    this.nextHit = (this.nextHit + 1) % this.hits.length;
    m.t = kill ? 0.32 : 0.18;
    m.e.className = `gx-hit ${kill ? "kill" : ""}`;
    m.e.style.transform = `translate3d(${s[0]}px, ${s[1]}px, 0)`;
  }

  /** An arc on the side of the screen that a blow came from. */
  hurt(bearing: number): void {
    const a = this.arcs[this.nextArc]!;
    this.nextArc = (this.nextArc + 1) % this.arcs.length;
    a.t = 1;
    a.bearing = bearing;
    this.hurtT = 0.35;
  }

  /** A flash of the whole screen: the Eureka, a phase. */
  flash(cls: string): void {
    this.flashT = 0.5;
    this.flashEl.className = `gx-flash on ${cls}`;
  }

  private project(x: number, y: number, z: number, cam: Camera, w: number, h: number): [number, number] | undefined {
    v.set(x, y, z).project(cam);
    if (v.z > 1 || v.z < -1) return undefined;
    return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h];
  }

  /** One frame. `yaw` is the bearing the camera looks along. */
  frame(
    dt: number,
    cam: Camera,
    w: number,
    h: number,
    yaw: number,
    plates: readonly PlateIn[],
    marks: readonly MarkIn[],
    lock: [number, number, number] | undefined,
    low: boolean,
    slowed: boolean,
  ): void {
    this.tick += dt;
    const text = this.tick >= 0.2;
    if (text) this.tick = 0;

    // The compass.
    if (!this.compassWidth || text) this.compassWidth = this.compass.clientWidth || 360;
    const halfW = this.compassWidth / 2;
    this.tape.style.transform = `translate3d(${halfW - yaw * PX_PER_DEG}px, 0, 0)`;
    if (text) setText(this.heading, String(Math.round(yaw) % 360).padStart(3, "0"));
    for (let k = 0; k < this.cmarks.length; k++) {
      const c = this.cmarks[k]!;
      const m = marks[k];
      if (!m) {
        c.e.style.opacity = "0";
        continue;
      }
      const rel = turnBetween(yaw, m.bearing) * PX_PER_DEG;
      const edge = Math.abs(rel) > halfW - 12;
      const x = Math.max(-halfW + 12, Math.min(halfW - 12, rel));
      c.e.style.opacity = edge ? "0.55" : "1";
      c.e.style.transform = `translate3d(${x}px, 0, 0)`;
      const cls = `gx-cm ${m.kind}`;
      if (c.e.className !== cls) c.e.className = cls;
      if (text) setText(c.d, m.kind === "main" || m.kind === "side" ? this.metres(Math.round(m.metres)) : "");
    }

    // Diamonds in the world over the quests' places.
    let wk = 0;
    for (const m of marks) {
      if (!m.world || wk >= this.marks.length) continue;
      const s = this.project(m.world[0], m.world[1], m.world[2], cam, w, h);
      const d = this.marks[wk++]!;
      if (!s || m.metres < 6) {
        d.e.style.opacity = "0";
        continue;
      }
      d.e.style.opacity = m.kind === "main" ? "0.95" : "0.7";
      d.e.style.transform = `translate3d(${s[0]}px, ${s[1]}px, 0)`;
      const cls = `gx-wm ${m.kind}`;
      if (d.e.className !== cls) d.e.className = cls;
      if (text) setText(d.d, this.metres(Math.round(m.metres)));
    }
    for (; wk < this.marks.length; wk++) this.marks[wk]!.e.style.opacity = "0";

    // The foes' plates.
    const plateTop = this.root.classList.contains("compact") ? h * (this.bossOut ? 0.36 : 0.25) : 92;
    const used = this.used;
    used.clear();
    for (const p of plates) {
      const s = this.project(p.x, p.y, p.z, cam, w, h);
      if (!s) continue;
      let slot = this.plates.find((q) => q.id === p.id);
      if (!slot) slot = this.plates.find((q) => q.id === -1 || !plates.some((pp) => pp.id === q.id));
      if (!slot) continue;
      slot.id = p.id;
      used.add(p.id);
      slot.e.style.opacity = "1";
      // A plate never climbs into the panels along the top of the screen.
      slot.e.style.transform = `translate3d(${s[0]}px, ${Math.max(plateTop, s[1])}px, 0)`;
      const cls = `gx-plate ${p.elite ? "elite" : ""} ${p.warn ? "warn" : ""}`;
      if (slot.e.className !== cls) slot.e.className = cls;
      if (slot.text !== p.name) {
        slot.text = p.name;
        slot.name.textContent = p.name;
      }
      slot.fill.style.transform = `scaleX(${Math.max(0, p.hp / p.max)})`;
    }
    for (const q of this.plates) {
      if (q.id !== -1 && !used.has(q.id)) {
        q.id = -1;
        q.e.style.opacity = "0";
      }
    }

    // The lock-on.
    const ls = lock && this.project(lock[0], lock[1], lock[2], cam, w, h);
    this.lock.style.opacity = ls ? "1" : "0";
    if (ls) this.lock.style.transform = `translate3d(${ls[0]}px, ${ls[1]}px, 0) rotate(${(performance.now() / 8) % 360}deg)`;

    // Numbers that jump and fade.
    for (const n of this.nums) {
      if (n.t <= 0) continue;
      n.t -= dt;
      const s = this.project(n.x, n.y, n.z, cam, w, h);
      if (!s || n.t <= 0) {
        n.e.style.opacity = "0";
        continue;
      }
      const age = (n.e.className.includes("xp") ? 1.3 : 0.9) - n.t;
      const rise = 26 * age + 40 * Math.min(age, 0.15);
      // Out big at once, back to its size in a tenth of a second.
      const pop = age < 0.1 ? 1 + (n.pop - 1) * (1 - age / 0.1) * (1 - age / 0.1) : 1;
      n.e.style.opacity = String(Math.min(1, n.t * 3));
      n.e.style.transform = `translate3d(${s[0] + n.drift * age}px, ${s[1] - rise}px, 0) translate(-50%, -50%) scale(${pop})`;
    }
    for (const m of this.hits) {
      if (m.t <= 0) continue;
      m.t -= dt;
      m.e.style.opacity = m.t > 0 ? "1" : "0";
    }
    for (const a of this.arcs) {
      if (a.t <= 0) continue;
      a.t -= dt * 1.1;
      a.e.style.opacity = String(Math.max(0, a.t));
      a.e.style.transform = `translate(-50%, -50%) rotate(${turnBetween(yaw, a.bearing)}deg)`;
    }
    this.hurtT = Math.max(0, this.hurtT - dt);
    if (this.flashT > 0) {
      this.flashT -= dt;
      if (this.flashT <= 0) this.flashEl.className = "gx-flash";
    }
    this.root.classList.toggle("hurt", this.hurtT > 0);
    this.root.classList.toggle("low", low);
    this.root.classList.toggle("slowed", slowed);
  }

  dispose(): void {
    this.root.remove();
  }
}
