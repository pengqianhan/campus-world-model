// Study Quest's effects: sparks, slashes, the shapes on the ground that warn of an attack, what is
// thrown, the boss's arena. Every kind of effect is one instanced mesh, made once, its arrays kept
// and filled again each frame, so that a busy fight costs a few draw calls and no garbage. Light is
// faked: additive colour and no shadows, no post-processing.
import {
  AdditiveBlending,
  BufferAttribute,
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DynamicDrawUsage,
  Euler,
  Group,
  InstancedBufferAttribute,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type Material,
} from "three";
import { merge } from "./gameModels.ts";

const _m = new Matrix4();
const _p = new Vector3();
const _q = new Quaternion();
const _s = new Vector3();
const _c = new Color();
const _d = new Vector3();
const _e = new Euler();
const UP = new Vector3(0, 1, 0);

/** Radians to turn a model that faces +z so that it faces a compass bearing (degrees from north). */
export function yawOf(bearing: number): number {
  return Math.PI - (bearing * Math.PI) / 180;
}

function additive(opacity = 1): MeshBasicMaterial {
  return new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false });
}

function instanced(geo: BufferGeometry, mat: Material, n: number, order = 0): InstancedMesh {
  const m = new InstancedMesh(geo, mat, n);
  m.instanceMatrix.setUsage(DynamicDrawUsage);
  m.setColorAt(0, _c.setRGB(1, 1, 1));
  m.instanceColor!.setUsage(DynamicDrawUsage);
  m.count = 0;
  m.frustumCulled = false;
  m.visible = false;
  m.renderOrder = order;
  m.castShadow = false;
  m.receiveShadow = false;
  return m;
}

/** Ends a frame's filling of an instanced mesh: how many, and that they changed. */
function close(m: InstancedMesh, n: number): void {
  m.count = n;
  m.visible = n > 0;
  if (n > 0) {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }
}

/** Colours a 0-to-1-high shape in its vertices, bright at the foot and fading to nothing (additive black) up it. */
function fadeUp<T extends BufferGeometry>(g: T, colour: number, power: number): T {
  const pos = g.getAttribute("position");
  const col = new Float32Array(pos.count * 3);
  const c = new Color(colour);
  for (let i = 0; i < pos.count; i++) {
    const k = Math.pow(1 - Math.max(0, Math.min(1, pos.getY(i))), power);
    col.set([c.r * k, c.g * k, c.b * k], i * 3);
  }
  g.setAttribute("color", new BufferAttribute(col, 3));
  return g;
}

/** A flat shape, lying on the ground (built in the XY plane, laid onto XZ). */
function flat<T extends BufferGeometry>(g: T): T {
  g.rotateX(-Math.PI / 2);
  return g;
}

// ---------------------------------------------------------------------------------------------
// Sparks
// ---------------------------------------------------------------------------------------------

const MAX_SPARKS = 360;

/** Little glowing bits that fly, fall and fade: hits, deaths, pick-ups, trails. */
export class Sparks {
  readonly mesh: InstancedMesh;
  private n = 0;
  private pos = new Float32Array(MAX_SPARKS * 3);
  private vel = new Float32Array(MAX_SPARKS * 3);
  private life = new Float32Array(MAX_SPARKS);
  private total = new Float32Array(MAX_SPARKS);
  private size = new Float32Array(MAX_SPARKS);
  private col = new Float32Array(MAX_SPARKS * 3);
  private grav = new Float32Array(MAX_SPARKS);
  /** Seconds of travel each spark is drawn stretched along: 0 for a round spark, more for a streak. */
  private streak = new Float32Array(MAX_SPARKS);
  /** Share of the sparks asked for that are made: fewer for reduced motion. */
  density = 1;

  constructor() {
    this.mesh = instanced(new IcosahedronGeometry(1, 0), additive(1), MAX_SPARKS, 5);
  }

  /** One spark at a scene point (three.js axes), going `v` metres a second. */
  one(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, color: number, gravity = 0, streak = 0): void {
    if (this.n >= MAX_SPARKS) return;
    const i = this.n++;
    this.streak[i] = streak;
    size *= 0.6;
    this.pos[i * 3] = x;
    this.pos[i * 3 + 1] = y;
    this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx;
    this.vel[i * 3 + 1] = vy;
    this.vel[i * 3 + 2] = vz;
    this.life[i] = this.total[i] = life;
    this.size[i] = size;
    _c.setHex(color);
    this.col[i * 3] = _c.r;
    this.col[i * 3 + 1] = _c.g;
    this.col[i * 3 + 2] = _c.b;
    this.grav[i] = gravity;
  }

  /** A burst of `count` sparks out from a point, `speed` metres a second, any way round and up. */
  burst(x: number, y: number, z: number, count: number, speed: number, color: number, size = 0.12, life = 0.6, gravity = 6): void {
    const n = Math.max(1, Math.round(count * this.density));
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const up = Math.random() * 0.9 + 0.1;
      const s = speed * (0.4 + Math.random() * 0.6);
      this.one(x, y, z, Math.cos(a) * s * (1 - up * 0.5), up * s, Math.sin(a) * s * (1 - up * 0.5), life * (0.6 + Math.random() * 0.6), size * (0.6 + Math.random() * 0.8), color, gravity);
    }
  }

  /**
   * Streaks thrown from a hit point along a compass bearing (degrees), fanned `spread` degrees
   * either side and a little up: what a blow knocks off a foe, flying away from the walker.
   */
  cone(x: number, y: number, z: number, bearing: number, spread: number, count: number, speed: number, color: number, size = 0.1, life = 0.3, gravity = 9, streak = 0.035): void {
    const n = Math.max(1, Math.round(count * this.density));
    for (let k = 0; k < n; k++) {
      const a = ((bearing + (Math.random() * 2 - 1) * spread) * Math.PI) / 180;
      const s = speed * (0.5 + Math.random() * 0.7);
      const up = 0.15 + Math.random() * 0.55;
      this.one(x, y, z, Math.sin(a) * s, up * s, -Math.cos(a) * s, life * (0.6 + Math.random() * 0.6), size * (0.7 + Math.random() * 0.6), color, gravity, streak);
    }
  }

  /** A ring of sparks over the ground, out from a point. */
  ring(x: number, y: number, z: number, count: number, speed: number, color: number, size = 0.14): void {
    const n = Math.max(1, Math.round(count * this.density));
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      this.one(x, y, z, Math.cos(a) * speed, 0.4, Math.sin(a) * speed, 0.5, size, color, 0);
    }
  }

  step(dt: number): void {
    let w = 0;
    for (let i = 0; i < this.n; i++) {
      this.life[i]! -= dt;
      if (this.life[i]! <= 0) continue;
      if (w !== i) {
        for (let k = 0; k < 3; k++) {
          this.pos[w * 3 + k] = this.pos[i * 3 + k]!;
          this.vel[w * 3 + k] = this.vel[i * 3 + k]!;
          this.col[w * 3 + k] = this.col[i * 3 + k]!;
        }
        this.life[w] = this.life[i]!;
        this.total[w] = this.total[i]!;
        this.size[w] = this.size[i]!;
        this.grav[w] = this.grav[i]!;
        this.streak[w] = this.streak[i]!;
      }
      const drag = Math.exp(-dt * 2.2);
      this.vel[w * 3]! *= drag;
      this.vel[w * 3 + 2]! *= drag;
      this.vel[w * 3 + 1] = this.vel[w * 3 + 1]! * drag - this.grav[w]! * dt;
      this.pos[w * 3]! += this.vel[w * 3]! * dt;
      this.pos[w * 3 + 1]! += this.vel[w * 3 + 1]! * dt;
      this.pos[w * 3 + 2]! += this.vel[w * 3 + 2]! * dt;
      w++;
    }
    this.n = w;
    for (let i = 0; i < w; i++) {
      const k = this.life[i]! / this.total[i]!;
      const s = this.size[i]! * (0.3 + 0.7 * k);
      _p.set(this.pos[i * 3]!, this.pos[i * 3 + 1]!, this.pos[i * 3 + 2]!);
      const st = this.streak[i]!;
      if (st > 0) {
        // A streak: stretched along the way it flies, by how far it goes in `st` seconds.
        _d.set(this.vel[i * 3]!, this.vel[i * 3 + 1]!, this.vel[i * 3 + 2]!);
        const speed = _d.length();
        if (speed > 1e-3) _q.setFromUnitVectors(UP, _d.multiplyScalar(1 / speed));
        else _q.identity();
        _s.set(s * 0.6, s + speed * st, s * 0.6);
      } else {
        _s.set(s, s, s);
        _q.identity();
      }
      _m.compose(_p, _q, _s);
      this.mesh.setMatrixAt(i, _m);
      // Additive: darker is fainter, so fading is a colour going to black.
      _c.setRGB(this.col[i * 3]! * k, this.col[i * 3 + 1]! * k, this.col[i * 3 + 2]! * k);
      this.mesh.setColorAt(i, _c);
    }
    close(this.mesh, w);
  }

  clear(): void {
    this.n = 0;
    close(this.mesh, 0);
  }

  get count(): number {
    return this.n;
  }
}

// ---------------------------------------------------------------------------------------------
// Shapes on the ground: warnings, rings, shadows
// ---------------------------------------------------------------------------------------------

export interface GroundRing {
  x: number;
  y: number;
  z: number;
  r: number;
  color: number;
  /** 0 to 1. */
  alpha: number;
}

export interface GroundLine {
  x: number;
  y: number;
  z: number;
  /** Degrees, compass. */
  dir: number;
  length: number;
  width: number;
  color: number;
  alpha: number;
}

const MAX_TELLS = 24;

/** The warnings on the ground: an outline that shows where, and a fill that grows until it lands. */
export class Telegraphs {
  readonly group = new Group();
  private rings = instanced(flat(new RingGeometry(0.93, 1, 56)), additive(1), MAX_TELLS, 2);
  private discs = instanced(flat(new CircleGeometry(1, 48)), additive(0.5), MAX_TELLS, 1);
  private frames = instanced(flat(new PlaneGeometry(1, 1).translate(0, -0.5, 0)), additive(0.5), MAX_TELLS, 1);
  private edges = instanced(flat(new PlaneGeometry(1, 1).translate(0, -0.5, 0)), additive(1), MAX_TELLS * 2, 2);
  private nr = 0;
  private nd = 0;
  private nf = 0;
  private ne = 0;

  constructor() {
    this.group.add(this.rings, this.discs, this.frames, this.edges);
  }

  begin(): void {
    this.nr = this.nd = this.nf = this.ne = 0;
  }

  private put(m: InstancedMesh, i: number, x: number, y: number, z: number, yaw: number, sx: number, sz: number, color: number, alpha: number): void {
    _p.set(x, y, z);
    _q.setFromAxisAngle(UP, yaw);
    _s.set(sx, 1, sz);
    _m.compose(_p, _q, _s);
    m.setMatrixAt(i, _m);
    _c.setHex(color).multiplyScalar(alpha);
    m.setColorAt(i, _c);
  }

  ring(r: GroundRing): void {
    if (this.nr >= MAX_TELLS) return;
    this.put(this.rings, this.nr++, r.x, r.y, r.z, 0, r.r, r.r, r.color, r.alpha);
  }

  disc(r: GroundRing): void {
    if (this.nd >= MAX_TELLS) return;
    this.put(this.discs, this.nd++, r.x, r.y, r.z, 0, r.r, r.r, r.color, r.alpha);
  }

  /** A strip on the ground from a point along a bearing: its frame, and a fill to `fill` of its length. */
  line(l: GroundLine, fill: number): void {
    if (this.nf >= MAX_TELLS || this.ne + 2 > MAX_TELLS * 2) return;
    const yaw = yawOf(l.dir);
    this.put(this.frames, this.nf++, l.x, l.y, l.z, yaw, l.width, l.length * Math.max(0.02, fill), l.color, l.alpha);
    // Its two long edges, bright.
    const rx = Math.cos((l.dir * Math.PI) / 180);
    const ry = -Math.sin((l.dir * Math.PI) / 180);
    for (const side of [-1, 1]) {
      const ox = rx * side * (l.width / 2);
      const oz = -ry * side * (l.width / 2);
      this.put(this.edges, this.ne++, l.x + ox, l.y + 0.01, l.z + oz, yaw, 0.12, l.length, l.color, Math.min(1, l.alpha * 2));
    }
  }

  end(): void {
    close(this.rings, this.nr);
    close(this.discs, this.nd);
    close(this.frames, this.nf);
    close(this.edges, this.ne);
  }
}

/** Soft dark spots under whatever floats, so that it reads as standing over the ground. */
export class Shadows {
  readonly mesh = instanced(flat(new CircleGeometry(1, 24)), new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), 40, 0);
  private n = 0;
  begin(): void {
    this.n = 0;
  }
  add(x: number, y: number, z: number, r: number): void {
    if (this.n >= 40) return;
    _p.set(x, y + 0.04, z);
    _q.identity();
    _s.set(r, 1, r);
    _m.compose(_p, _q, _s);
    this.mesh.setMatrixAt(this.n++, _m);
  }
  end(): void {
    close(this.mesh, this.n);
  }
}

// ---------------------------------------------------------------------------------------------
// What flies: flashcards and dark orbs
// ---------------------------------------------------------------------------------------------

export class Missiles {
  readonly group = new Group();
  private cards = instanced(new BoxGeometry(0.62, 0.05, 0.42), new MeshBasicMaterial({ color: 0xffffff }), 16, 3);
  private cardGlow = instanced(new BoxGeometry(0.9, 0.12, 0.7), additive(0.6), 16, 4);
  private orbs = instanced(new SphereGeometry(0.42, 14, 10), new MeshBasicMaterial({ color: 0xffffff }), 40, 3);
  private halos = instanced(new SphereGeometry(0.8, 14, 10), additive(0.55), 40, 4);
  private nc = 0;
  private no = 0;
  constructor() {
    this.group.add(this.cards, this.cardGlow, this.orbs, this.halos);
  }
  begin(): void {
    this.nc = this.no = 0;
  }
  card(x: number, y: number, z: number, spin: number): void {
    if (this.nc >= 16) return;
    _p.set(x, y, z);
    _q.setFromAxisAngle(UP, spin);
    _s.set(1, 1, 1);
    _m.compose(_p, _q, _s);
    this.cards.setMatrixAt(this.nc, _m);
    this.cards.setColorAt(this.nc, _c.setHex(0xfff6e0));
    this.cardGlow.setMatrixAt(this.nc, _m);
    this.cardGlow.setColorAt(this.nc, _c.setHex(0xffb454));
    this.nc++;
  }
  orb(x: number, y: number, z: number, pulse: number, boss: boolean): void {
    if (this.no >= 40) return;
    _p.set(x, y, z);
    _q.identity();
    _s.setScalar(1);
    _m.compose(_p, _q, _s);
    this.orbs.setMatrixAt(this.no, _m);
    this.orbs.setColorAt(this.no, _c.setHex(boss ? 0x2a0710 : 0x1a0f3a));
    _s.setScalar(pulse);
    _m.compose(_p, _q, _s);
    this.halos.setMatrixAt(this.no, _m);
    this.halos.setColorAt(this.no, _c.setHex(boss ? 0xff2d3d : 0x9b5cff));
    this.no++;
  }
  end(): void {
    close(this.cards, this.nc);
    close(this.cardGlow, this.nc);
    close(this.orbs, this.no);
    close(this.halos, this.no);
  }
}

// ---------------------------------------------------------------------------------------------
// One-off meshes: the slash and the arena
// ---------------------------------------------------------------------------------------------

/** A sweep of light in front of the walker, for each blow: an arc, or a full ring for the third. */
export class Slash {
  readonly group = new Group();
  private arc: Mesh;
  private full: Mesh;
  private arcMat = additive(1);
  private fullMat = additive(1);
  private t = 0;
  private total = 0.16;
  private sweep = 1;
  private yaw = 0;
  private heavy = false;

  constructor() {
    // A thin crescent of light where the highlighter's tip goes, nothing inside it: colours in the
    // vertices, as additive light, dark (nothing) over most of the ring and bright just in from its
    // outer edge, pink as the highlighter's ink, so that it never washes a foe out.
    const SHADE: readonly [number, number][] = [
      [0, 0],
      [0.72, 0],
      [0.9, 1],
      [1, 0.35],
    ];
    const shade = (g: BufferGeometry, inner: number, outer: number) => {
      const pos = g.getAttribute("position");
      const col = new Float32Array(pos.count * 3);
      const a = new Color(0xff4fa3);
      const b = new Color(0xffd6ea);
      for (let i = 0; i < pos.count; i++) {
        const r = Math.hypot(pos.getX(i), pos.getZ(i));
        const k = Math.max(0, Math.min(1, (r - inner) / (outer - inner)));
        let v = 0;
        for (let j = 1; j < SHADE.length; j++) {
          const [k0, v0] = SHADE[j - 1]!;
          const [k1, v1] = SHADE[j]!;
          if (k <= k1) {
            v = v0 + ((v1 - v0) * (k - k0)) / Math.max(1e-6, k1 - k0);
            break;
          }
        }
        _c.copy(a).lerp(b, v * 0.6).multiplyScalar(v * 0.85);
        col.set([_c.r, _c.g, _c.b], i * 3);
      }
      g.setAttribute("color", new BufferAttribute(col, 3));
      return g;
    };
    this.arcMat.vertexColors = true;
    this.fullMat.vertexColors = true;
    // Rings across their width at the shading's steps, so that the crescent is sharp.
    const steps = (inner: number, outer: number, seg: number, start?: number, length?: number) => {
      // The dark part inside draws nothing, and is left out.
      const parts = SHADE.slice(2).map(([k], j) => new RingGeometry(inner + (outer - inner) * SHADE[j + 1]![0], inner + (outer - inner) * k, seg, 1, start, length));
      const out = merge(parts.map((geo) => ({ geo, color: 0xffffff })));
      out.deleteAttribute("color");
      return out;
    };
    this.arc = new Mesh(shade(flat(steps(0.9, 3.1, 32, -Math.PI / 2 - 1.25, 2.5)), 0.9, 3.1), this.arcMat);
    this.full = new Mesh(shade(flat(steps(1.2, 3.8, 64)), 1.2, 3.8), this.fullMat);
    this.arc.visible = this.full.visible = false;
    this.arc.renderOrder = this.full.renderOrder = 4;
    this.group.add(this.arc, this.full);
  }

  /** A blow begins: `combo` 0, 1 or 2, toward a compass bearing. */
  swing(combo: number, bearing: number): void {
    this.t = this.total = combo === 2 ? 0.2 : 0.12;
    this.sweep = combo === 1 ? -1 : 1;
    this.heavy = combo === 2;
    this.yaw = yawOf(bearing);
  }

  step(dt: number, x: number, y: number, z: number): void {
    this.t = Math.max(0, this.t - dt);
    const on = this.t > 0;
    const mesh = this.heavy ? this.full : this.arc;
    (this.heavy ? this.arc : this.full).visible = false;
    mesh.visible = on;
    if (!on) return;
    const k = 1 - this.t / this.total;
    mesh.position.set(x, y + 1.0, z);
    if (this.heavy) {
      mesh.rotation.set(0, this.yaw + k * 2.5, 0);
      const s = 0.7 + k * 0.5;
      mesh.scale.set(s, 1, s);
      this.fullMat.opacity = 1 - k;
    } else {
      mesh.rotation.set(0.12 * this.sweep, this.yaw + this.sweep * (0.9 - k * 1.8), 0.08 * this.sweep);
      mesh.scale.set(1, 1, 1);
      this.arcMat.opacity = k < 0.3 ? k / 0.3 : 1 - (k - 0.3) / 0.7;
    }
  }
}

/** The boss's arena: a wall of light round it, faint at the top. */
export class Arena {
  readonly mesh: Mesh;
  private mat = additive(0.9);
  constructor() {
    const g = fadeUp(new CylinderGeometry(1, 1, 1, 96, 4, true).translate(0, 0.5, 0), 0xff5a3d, 3);
    this.mat.vertexColors = true;
    this.mat.side = 2;
    this.mesh = new Mesh(g, this.mat);
    this.mesh.visible = false;
    this.mesh.renderOrder = 3;
  }
  show(x: number, y: number, z: number, r: number, active: boolean, t: number): void {
    this.mesh.visible = true;
    this.mesh.position.set(x, y - 0.5, z);
    this.mesh.scale.set(r, active ? 4 : 2.5, r);
    this.mat.opacity = active ? 0.3 + 0.08 * Math.sin(t * 3) : 0.22 + 0.06 * Math.sin(t * 2);
  }
  hide(): void {
    this.mesh.visible = false;
  }
}

// ---------------------------------------------------------------------------------------------
// What a beaten foe breaks into: pages, clock gears, drops of ink
// ---------------------------------------------------------------------------------------------

export type Bit = "page" | "gear" | "ink";
const BITS: readonly Bit[] = ["page", "gear", "ink"];
const MAX_BITS = 96;

/** One kind of bit: its instanced mesh and the state of each piece, in kept arrays. */
class BitPool {
  readonly mesh: InstancedMesh;
  n = 0;
  readonly pos = new Float32Array(MAX_BITS * 3);
  readonly vel = new Float32Array(MAX_BITS * 3);
  readonly rot = new Float32Array(MAX_BITS * 3);
  readonly spin = new Float32Array(MAX_BITS * 3);
  readonly life = new Float32Array(MAX_BITS);
  readonly total = new Float32Array(MAX_BITS);
  readonly size = new Float32Array(MAX_BITS);
  readonly floor = new Float32Array(MAX_BITS);
  readonly col = new Float32Array(MAX_BITS * 3);
  constructor(geo: BufferGeometry, mat: Material) {
    this.mesh = instanced(geo, mat, MAX_BITS, 0);
  }
}

/**
 * Bits that fly from a beaten foe, tumble, bounce on the ground and shrink away: pages that
 * flutter down slowly, gears and drops of ink that fall fast. Lit, three draw calls for all.
 */
export class Debris {
  readonly group = new Group();
  private pools: Record<Bit, BitPool>;
  private mat = new MeshLambertMaterial({ vertexColors: true, emissive: 0x4a4a4a });
  density = 1;

  constructor() {
    const page = merge([
      { geo: new BoxGeometry(0.46, 0.012, 0.6), color: 0xffffff },
      // Lines of writing on it.
      ...[-0.16, -0.06, 0.04, 0.14].map((z) => ({ geo: new BoxGeometry(0.32, 0.004, 0.025), color: 0x8e8e9a, at: [0, 0.008, z] as [number, number, number] })),
    ]);
    const teeth = Array.from({ length: 8 }, (_, k) => {
      const a = (k / 8) * Math.PI * 2;
      return { geo: new BoxGeometry(0.1, 0.06, 0.1), color: 0xffffff, at: [Math.sin(a) * 0.27, 0, Math.cos(a) * 0.27] as [number, number, number], rot: [0, a, 0] as [number, number, number] };
    });
    const gear = merge([{ geo: new CylinderGeometry(0.24, 0.24, 0.06, 16), color: 0xffffff }, ...teeth, { geo: new CylinderGeometry(0.08, 0.08, 0.08, 10), color: 0x555555 }]);
    const ink = merge([{ geo: new SphereGeometry(0.12, 10, 8), color: 0xffffff, scale: [1, 1.5, 1] }]);
    this.pools = { page: new BitPool(page, this.mat), gear: new BitPool(gear, this.mat), ink: new BitPool(ink, this.mat) };
    for (const b of BITS) this.group.add(this.pools[b].mesh);
  }

  /**
   * `count` bits of a kind out from a scene point, `speed` metres a second, any way round and up,
   * landing on `floor` (metres up).
   */
  burst(bit: Bit, x: number, y: number, z: number, floor: number, count: number, speed: number, color: number, size = 1, life = 1.4): void {
    const p = this.pools[bit];
    _c.setHex(color);
    const n = Math.max(1, Math.round(count * this.density));
    for (let k = 0; k < n && p.n < MAX_BITS; k++) {
      const i = p.n++;
      const o = i * 3;
      const a = Math.random() * Math.PI * 2;
      const up = 0.35 + Math.random() * 0.65;
      const s = speed * (0.45 + Math.random() * 0.75);
      p.pos[o] = x + Math.cos(a) * 0.3;
      p.pos[o + 1] = y + Math.random() * 0.4;
      p.pos[o + 2] = z + Math.sin(a) * 0.3;
      p.vel[o] = Math.cos(a) * s * (1 - up * 0.6);
      p.vel[o + 1] = up * s * (bit === "page" ? 0.8 : 1.1);
      p.vel[o + 2] = Math.sin(a) * s * (1 - up * 0.6);
      const spin = bit === "page" ? 5 : 11;
      for (let j = 0; j < 3; j++) {
        p.rot[o + j] = Math.random() * 6;
        p.spin[o + j] = (Math.random() - 0.5) * spin;
      }
      p.life[i] = p.total[i] = life * (0.7 + Math.random() * 0.6);
      p.size[i] = size * (0.7 + Math.random() * 0.6);
      p.floor[i] = floor;
      // A little variety in the colour, as paper and ink are never quite one shade.
      const v = 0.85 + Math.random() * 0.15;
      p.col[o] = _c.r * v;
      p.col[o + 1] = _c.g * v;
      p.col[o + 2] = _c.b * v;
    }
  }

  step(dt: number): void {
    for (const b of BITS) {
      const p = this.pools[b];
      const flutter = b === "page";
      const drag = Math.exp(-dt * (flutter ? 2.8 : 0.6));
      const g = flutter ? 4 : 16;
      let w = 0;
      for (let i = 0; i < p.n; i++) {
        p.life[i]! -= dt;
        if (p.life[i]! <= 0) continue;
        if (w !== i) {
          p.pos.copyWithin(w * 3, i * 3, i * 3 + 3);
          p.vel.copyWithin(w * 3, i * 3, i * 3 + 3);
          p.rot.copyWithin(w * 3, i * 3, i * 3 + 3);
          p.spin.copyWithin(w * 3, i * 3, i * 3 + 3);
          p.col.copyWithin(w * 3, i * 3, i * 3 + 3);
          p.life[w] = p.life[i]!;
          p.total[w] = p.total[i]!;
          p.size[w] = p.size[i]!;
          p.floor[w] = p.floor[i]!;
        }
        const o = w * 3;
        p.vel[o]! *= drag;
        p.vel[o + 2]! *= drag;
        p.vel[o + 1] = p.vel[o + 1]! * (flutter ? drag : 1) - g * dt;
        // A page sways from side to side as it falls.
        if (flutter) {
          const sway = Math.sin(p.life[w]! * 9 + w) * 1.6 * dt;
          p.vel[o]! += sway;
          p.vel[o + 2]! -= sway * 0.6;
        }
        p.pos[o]! += p.vel[o]! * dt;
        p.pos[o + 1]! += p.vel[o + 1]! * dt;
        p.pos[o + 2]! += p.vel[o + 2]! * dt;
        if (p.pos[o + 1]! <= p.floor[w]!) {
          // It bounces, less each time, and stops turning on the ground.
          p.pos[o + 1] = p.floor[w]!;
          p.vel[o + 1] = Math.abs(p.vel[o + 1]!) * (flutter ? 0 : 0.32);
          p.vel[o]! *= 0.55;
          p.vel[o + 2]! *= 0.55;
          for (let k = 0; k < 3; k++) p.spin[o + k]! *= 0.5;
          // A page lies flat once it is down.
          if (flutter) ((p.rot[o] = p.rot[o]! * 0.8), (p.rot[o + 2] = p.rot[o + 2]! * 0.8));
        }
        for (let k = 0; k < 3; k++) p.rot[o + k]! += p.spin[o + k]! * dt;
        w++;
      }
      p.n = w;
      for (let i = 0; i < w; i++) {
        const o = i * 3;
        const k = p.life[i]! / p.total[i]!;
        // Full size until its last third, then it shrinks away.
        const s = p.size[i]! * Math.min(1, k * 3);
        _p.set(p.pos[o]!, p.pos[o + 1]! + 0.02, p.pos[o + 2]!);
        _q.setFromEuler(_e.set(p.rot[o]!, p.rot[o + 1]!, p.rot[o + 2]!));
        _s.set(s, s, s);
        _m.compose(_p, _q, _s);
        p.mesh.setMatrixAt(i, _m);
        p.mesh.setColorAt(i, _c.setRGB(p.col[o]!, p.col[o + 1]!, p.col[o + 2]!));
      }
      close(p.mesh, w);
    }
  }

  clear(): void {
    for (const b of BITS) {
      this.pools[b].n = 0;
      close(this.pools[b].mesh, 0);
    }
  }

  get count(): number {
    return this.pools.page.n + this.pools.gear.n + this.pools.ink.n;
  }
}

// ---------------------------------------------------------------------------------------------
// Dust: soft puffs that swell and fade
// ---------------------------------------------------------------------------------------------

const MAX_PUFFS = 64;

/**
 * Puffs of dust at a foe's feet when it is struck, stamps or lands an attack. Drawn as soft
 * spheres, each with its own opacity, in one draw call.
 */
export class Puffs {
  readonly mesh: InstancedMesh;
  private n = 0;
  private pos = new Float32Array(MAX_PUFFS * 3);
  private vel = new Float32Array(MAX_PUFFS * 3);
  private life = new Float32Array(MAX_PUFFS);
  private total = new Float32Array(MAX_PUFFS);
  private size = new Float32Array(MAX_PUFFS);
  private col = new Float32Array(MAX_PUFFS * 3);
  private alpha: InstancedBufferAttribute;
  density = 1;

  constructor() {
    const geo = new IcosahedronGeometry(1, 2);
    this.alpha = new InstancedBufferAttribute(new Float32Array(MAX_PUFFS), 1);
    this.alpha.setUsage(DynamicDrawUsage);
    geo.setAttribute("aAlpha", this.alpha);
    const mat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        attribute float aAlpha;
        varying float vAlpha;
        varying vec3 vColor;
        varying float vFacing;
        void main() {
          vAlpha = aAlpha;
          vColor = instanceColor;
          vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          vec3 n = normalize(normalMatrix * mat3(instanceMatrix) * normal);
          // Soft at its rim, as a cloud of dust is.
          vFacing = abs(dot(n, normalize(-mv.xyz)));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        varying vec3 vColor;
        varying float vFacing;
        void main() {
          gl_FragColor = vec4(vColor, vAlpha * vFacing * vFacing);
        }`,
    });
    this.mesh = instanced(geo, mat, MAX_PUFFS, 1);
  }

  /** `count` puffs round a scene point at ground level, `spread` metres out, drifting outward and up. */
  puff(x: number, y: number, z: number, count: number, spread: number, color: number, size = 0.6, life = 0.6): void {
    _c.setHex(color);
    const n = Math.max(1, Math.round(count * this.density));
    for (let k = 0; k < n && this.n < MAX_PUFFS; k++) {
      const i = this.n++;
      const o = i * 3;
      const a = Math.random() * Math.PI * 2;
      const r = spread * (0.3 + Math.random() * 0.7);
      this.pos[o] = x + Math.cos(a) * r * 0.4;
      this.pos[o + 1] = y + 0.1;
      this.pos[o + 2] = z + Math.sin(a) * r * 0.4;
      this.vel[o] = Math.cos(a) * r * 2.2;
      this.vel[o + 1] = 0.5 + Math.random() * 0.8;
      this.vel[o + 2] = Math.sin(a) * r * 2.2;
      this.life[i] = this.total[i] = life * (0.7 + Math.random() * 0.6);
      this.size[i] = size * (0.6 + Math.random() * 0.8);
      this.col[o] = _c.r;
      this.col[o + 1] = _c.g;
      this.col[o + 2] = _c.b;
    }
  }

  step(dt: number): void {
    let w = 0;
    const drag = Math.exp(-dt * 4);
    for (let i = 0; i < this.n; i++) {
      this.life[i]! -= dt;
      if (this.life[i]! <= 0) continue;
      if (w !== i) {
        this.pos.copyWithin(w * 3, i * 3, i * 3 + 3);
        this.vel.copyWithin(w * 3, i * 3, i * 3 + 3);
        this.col.copyWithin(w * 3, i * 3, i * 3 + 3);
        this.life[w] = this.life[i]!;
        this.total[w] = this.total[i]!;
        this.size[w] = this.size[i]!;
      }
      for (let k = 0; k < 3; k++) {
        this.vel[w * 3 + k]! *= drag;
        this.pos[w * 3 + k]! += this.vel[w * 3 + k]! * dt;
      }
      w++;
    }
    this.n = w;
    for (let i = 0; i < w; i++) {
      const k = this.life[i]! / this.total[i]!;
      // It swells as it fades.
      const s = this.size[i]! * (0.45 + 0.9 * (1 - k));
      _p.set(this.pos[i * 3]!, this.pos[i * 3 + 1]!, this.pos[i * 3 + 2]!);
      _q.identity();
      _s.set(s, s * 0.7, s);
      _m.compose(_p, _q, _s);
      this.mesh.setMatrixAt(i, _m);
      this.mesh.setColorAt(i, _c.setRGB(this.col[i * 3]!, this.col[i * 3 + 1]!, this.col[i * 3 + 2]!));
      this.alpha.setX(i, 0.5 * k * Math.min(1, (1 - k) * 8));
    }
    close(this.mesh, w);
    if (w) this.alpha.needsUpdate = true;
  }

  clear(): void {
    this.n = 0;
    close(this.mesh, 0);
  }
}

// ---------------------------------------------------------------------------------------------
// Shock rings: a crisp ring of light that runs out over the ground
// ---------------------------------------------------------------------------------------------

const MAX_SHOCKS = 12;

/**
 * Rings that run out over the ground from a point and are gone in a moment: the Eureka, a slam
 * landing, the boss's roar. Each keeps a thin band of light of its own width, however wide the ring
 * grows, brightest just in from its outer edge and nothing inside, so that it never washes the
 * ground out.
 */
export class Shocks {
  readonly mesh: InstancedMesh;
  private n = 0;
  private at = new Float32Array(MAX_SHOCKS * 3);
  private max = new Float32Array(MAX_SHOCKS);
  private width = new Float32Array(MAX_SHOCKS);
  private delay = new Float32Array(MAX_SHOCKS);
  private life = new Float32Array(MAX_SHOCKS);
  private total = new Float32Array(MAX_SHOCKS);
  private col = new Float32Array(MAX_SHOCKS * 3);
  private rw: InstancedBufferAttribute;

  constructor() {
    // A ring of unit radius whose vertices carry how far across its band they are (in y), and how
    // bright it is there (faint inside, brightest just in from the outer edge).
    const across: readonly [number, number][] = [
      [0, 0],
      [0.55, 0.15],
      [0.86, 1],
      [1, 0.5],
    ];
    const seg = 128;
    const pos: number[] = [];
    const bright: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      for (const [b, k] of across) {
        pos.push(Math.cos(a), b, Math.sin(a));
        bright.push(k);
      }
    }
    const w = across.length;
    for (let i = 0; i < seg; i++) {
      for (let j = 0; j < w - 1; j++) {
        const a = i * w + j;
        const b = a + w;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
    geo.setAttribute("aBright", new BufferAttribute(new Float32Array(bright), 1));
    geo.setIndex(idx);
    this.rw = new InstancedBufferAttribute(new Float32Array(MAX_SHOCKS * 2), 2);
    this.rw.setUsage(DynamicDrawUsage);
    geo.setAttribute("aRW", this.rw);
    const mat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: 2,
      vertexShader: /* glsl */ `
        attribute vec2 aRW;
        attribute float aBright;
        varying vec3 vColor;
        void main() {
          vColor = instanceColor * aBright;
          float r = max(0.0, aRW.x - aRW.y * (1.0 - position.y));
          vec4 p = instanceMatrix * vec4(position.x * r, 0.0, position.z * r, 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * p;
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, 1.0);
        }`,
    });
    this.mesh = instanced(geo, mat, MAX_SHOCKS, 4);
  }

  /**
   * A ring out from a scene point to `radius` metres over `life` seconds, `width` metres across,
   * after `delay` seconds.
   */
  fire(x: number, y: number, z: number, radius: number, width: number, color: number, life = 0.3, delay = 0): void {
    if (this.n >= MAX_SHOCKS) return;
    const i = this.n++;
    this.at[i * 3] = x;
    this.at[i * 3 + 1] = y;
    this.at[i * 3 + 2] = z;
    this.max[i] = radius;
    this.width[i] = width;
    this.delay[i] = delay;
    this.life[i] = this.total[i] = life;
    _c.setHex(color);
    this.col[i * 3] = _c.r;
    this.col[i * 3 + 1] = _c.g;
    this.col[i * 3 + 2] = _c.b;
  }

  step(dt: number): void {
    let w = 0;
    for (let i = 0; i < this.n; i++) {
      if (this.delay[i]! > 0) this.delay[i]! -= dt;
      else this.life[i]! -= dt;
      if (this.life[i]! <= 0) continue;
      if (w !== i) {
        this.at.copyWithin(w * 3, i * 3, i * 3 + 3);
        this.col.copyWithin(w * 3, i * 3, i * 3 + 3);
        this.max[w] = this.max[i]!;
        this.width[w] = this.width[i]!;
        this.delay[w] = this.delay[i]!;
        this.life[w] = this.life[i]!;
        this.total[w] = this.total[i]!;
      }
      w++;
    }
    this.n = w;
    let drawn = 0;
    for (let i = 0; i < w; i++) {
      if (this.delay[i]! > 0) continue;
      const k = 1 - this.life[i]! / this.total[i]!;
      // Fast out, slowing: most of its way in the first third of its life.
      const out = 1 - Math.pow(1 - k, 3);
      const r = 0.4 + (this.max[i]! - 0.4) * out;
      const fade = k < 0.08 ? k / 0.08 : 1 - Math.pow((k - 0.08) / 0.92, 1.6);
      _p.set(this.at[i * 3]!, this.at[i * 3 + 1]!, this.at[i * 3 + 2]!);
      _q.identity();
      _s.set(1, 1, 1);
      _m.compose(_p, _q, _s);
      this.mesh.setMatrixAt(drawn, _m);
      this.mesh.setColorAt(drawn, _c.setRGB(this.col[i * 3]! * fade, this.col[i * 3 + 1]! * fade, this.col[i * 3 + 2]! * fade));
      this.rw.setXY(drawn, r, Math.min(r, this.width[i]! * (1 - 0.5 * k)));
      drawn++;
    }
    close(this.mesh, drawn);
    if (drawn) this.rw.needsUpdate = true;
  }

  clear(): void {
    this.n = 0;
    close(this.mesh, 0);
  }
}

// ---------------------------------------------------------------------------------------------
// Warnings that fill: decals on the ground for an attack coming
// ---------------------------------------------------------------------------------------------

/** The fill of a warning, as a decal: a darker wash that fills to its edge, a bright leading edge and rim. */
function decalMaterial(shape: "circle" | "line"): ShaderMaterial {
  const body =
    shape === "circle"
      ? /* glsl */ `
        float d = length(vLocal);
        if (d > 1.0) discard;
        float m = d * size;
        float rim = smoothstep(size - 0.34, size - 0.12, m);
        float lead = 1.0 - smoothstep(0.0, 0.2, abs(m - fill * size));
        float inside = 1.0 - smoothstep(fill * size - 0.02, fill * size + 0.02, m);
        // Rings that run in toward the middle, faint, while it fills.
        float run = 0.5 + 0.5 * sin(m * 4.0 + uTime * 9.0);`
      : /* glsl */ `
        float across = abs(vLocal.x) * 2.0;
        float m = vLocal.y * size;
        float halfW = vDecal.z;
        float rim = smoothstep(1.0 - 0.36 / max(halfW, 0.36), 1.0 - 0.1 / max(halfW, 0.36), across);
        float lead = 1.0 - smoothstep(0.0, 0.3, abs(m - fill * size));
        float inside = 1.0 - smoothstep(fill * size - 0.03, fill * size + 0.03, m);
        // Chevrons that run along it, the way the charge will go.
        float run = 0.5 + 0.5 * sin((m - abs(vLocal.x) * halfW * 1.6) * 2.4 - uTime * 10.0);`;
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute vec4 aDecal;
      varying vec4 vDecal;
      varying vec2 vLocal;
      varying vec3 vColor;
      void main() {
        vDecal = aDecal;
        vColor = instanceColor;
        vLocal = position.xz;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec4 vDecal;
      varying vec2 vLocal;
      varying vec3 vColor;
      void main() {
        // aDecal: how full (0-1), opacity, half its width (a strip), and its size in metres (radius or length).
        float fill = vDecal.x;
        float alpha = vDecal.y;
        float size = vDecal.w;
        ${body}
        float a = alpha * (0.12 + inside * (0.24 + 0.08 * run) + rim * 0.7 + lead * inside * 0.85);
        vec3 c = mix(vColor * 0.6, vec3(1.0, 0.9, 0.8), lead * inside * 0.75 + rim * 0.2);
        gl_FragColor = vec4(c, clamp(a, 0.0, 0.92));
      }`,
  });
}

const MAX_DECALS = 24;

/**
 * The warnings on the ground: a circle where a slam or a yawn will land, a strip where a charge or
 * a line of ink will run. Each fills from its middle (or its start) to its edge as the attack
 * comes, a bright edge leading, so that how long is left reads at a glance; drawn with ordinary
 * blending, darker than the ground, so that it never washes the picture out.
 */
export class Decals {
  readonly group = new Group();
  private circles: InstancedMesh;
  private lines: InstancedMesh;
  private cData: InstancedBufferAttribute;
  private lData: InstancedBufferAttribute;
  private mats: ShaderMaterial[];
  private nc = 0;
  private nl = 0;

  constructor() {
    const disc = flat(new PlaneGeometry(2, 2, 1, 1));
    // Its length along +z from 0 to 1, as the strips in Telegraphs.
    const strip = flat(new PlaneGeometry(1, 1).translate(0, -0.5, 0));
    this.cData = new InstancedBufferAttribute(new Float32Array(MAX_DECALS * 4), 4);
    this.lData = new InstancedBufferAttribute(new Float32Array(MAX_DECALS * 4), 4);
    this.cData.setUsage(DynamicDrawUsage);
    this.lData.setUsage(DynamicDrawUsage);
    disc.setAttribute("aDecal", this.cData);
    strip.setAttribute("aDecal", this.lData);
    this.mats = [decalMaterial("circle"), decalMaterial("line")];
    this.circles = instanced(disc, this.mats[0]!, MAX_DECALS, 1);
    this.lines = instanced(strip, this.mats[1]!, MAX_DECALS, 1);
    this.group.add(this.circles, this.lines);
  }

  begin(t: number): void {
    this.nc = this.nl = 0;
    for (const m of this.mats) m.uniforms.uTime!.value = t;
  }

  circle(x: number, y: number, z: number, r: number, fill: number, color: number, alpha: number): void {
    if (this.nc >= MAX_DECALS) return;
    _p.set(x, y, z);
    _q.identity();
    _s.set(r, 1, r);
    _m.compose(_p, _q, _s);
    this.circles.setMatrixAt(this.nc, _m);
    this.circles.setColorAt(this.nc, _c.setHex(color));
    this.cData.setXYZW(this.nc, fill, alpha, 0, r);
    this.nc++;
  }

  /** A strip from a scene point along a compass bearing, `length` long and `width` across. */
  line(x: number, y: number, z: number, dir: number, length: number, width: number, fill: number, color: number, alpha: number): void {
    if (this.nl >= MAX_DECALS) return;
    _p.set(x, y, z);
    _q.setFromAxisAngle(UP, yawOf(dir));
    _s.set(width, 1, length);
    _m.compose(_p, _q, _s);
    this.lines.setMatrixAt(this.nl, _m);
    this.lines.setColorAt(this.nl, _c.setHex(color));
    this.lData.setXYZW(this.nl, fill, alpha, width / 2, length);
    this.nl++;
  }

  end(): void {
    close(this.circles, this.nc);
    close(this.lines, this.nl);
    if (this.nc) this.cData.needsUpdate = true;
    if (this.nl) this.lData.needsUpdate = true;
  }
}
