// Study Quest's effects: sparks, slashes, the shapes on the ground that warn of an attack, what is
// thrown, the boss's arena. Every kind of effect is one instanced mesh, made once, its arrays kept
// and filled again each frame, so that a busy fight costs a few draw calls and no garbage. Light is
// faked: additive colour and no shadows, no post-processing.
import {
  AdditiveBlending,
  BufferAttribute,
  BoxGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DynamicDrawUsage,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
  type Material,
} from "three";

const _m = new Matrix4();
const _p = new Vector3();
const _q = new Quaternion();
const _s = new Vector3();
const _c = new Color();
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
  /** Share of the sparks asked for that are made: fewer for reduced motion. */
  density = 1;

  constructor() {
    this.mesh = instanced(new IcosahedronGeometry(1, 0), additive(1), MAX_SPARKS, 5);
  }

  /** One spark at a scene point (three.js axes), going `v` metres a second. */
  one(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, color: number, gravity = 0): void {
    if (this.n >= MAX_SPARKS) return;
    const i = this.n++;
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
      _s.set(s, s, s);
      _q.identity();
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
// One-off meshes: the slash, the Eureka burst, the arena, rings at the walker's feet
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
    // Faint inside, bright at the edge: colours in the vertices, as additive light.
    const shade = (g: BufferGeometry, inner: number, outer: number) => {
      const pos = g.getAttribute("position");
      const col = new Float32Array(pos.count * 3);
      const a = new Color(0xffb454);
      const b = new Color(0xfff3d6);
      for (let i = 0; i < pos.count; i++) {
        const r = Math.hypot(pos.getX(i), pos.getZ(i));
        const k = Math.max(0, Math.min(1, (r - inner) / (outer - inner)));
        _c.copy(a).lerp(b, k).multiplyScalar(0.15 + 0.85 * k * k);
        col.set([_c.r, _c.g, _c.b], i * 3);
      }
      g.setAttribute("color", new BufferAttribute(col, 3));
      return g;
    };
    this.arcMat.vertexColors = true;
    this.fullMat.vertexColors = true;
    this.arc = new Mesh(shade(flat(new RingGeometry(0.9, 3.1, 24, 3, -Math.PI / 2 - 1.25, 2.5)), 0.9, 3.1), this.arcMat);
    this.full = new Mesh(shade(flat(new RingGeometry(1.2, 3.8, 48, 3)), 1.2, 3.8), this.fullMat);
    this.arc.visible = this.full.visible = false;
    this.arc.renderOrder = this.full.renderOrder = 4;
    this.group.add(this.arc, this.full);
  }

  /** A blow begins: `combo` 0, 1 or 2, toward a compass bearing. */
  swing(combo: number, bearing: number): void {
    this.t = this.total = combo === 2 ? 0.26 : 0.16;
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

/** A low wall of light that runs out over the ground from the walker: the Eureka burst. */
export class Burst {
  readonly mesh: Mesh;
  private mat = additive(1);
  private t = 0;
  private max = 8.5;
  constructor() {
    this.mat.color.setHex(0xffc970);
    this.mat.vertexColors = true;
    this.mat.side = 2;
    this.mesh = new Mesh(fadeUp(new CylinderGeometry(1, 1, 1, 64, 1, true).translate(0, 0.5, 0), 0xffffff, 2), this.mat);
    this.mesh.visible = false;
    this.mesh.renderOrder = 4;
  }
  fire(max: number): void {
    this.t = 0.45;
    this.max = max;
  }
  step(dt: number, x: number, y: number, z: number): void {
    this.t = Math.max(0, this.t - dt);
    this.mesh.visible = this.t > 0;
    if (!this.mesh.visible) return;
    const k = 1 - this.t / 0.45;
    const r = 0.5 + (this.max - 0.5) * (1 - (1 - k) * (1 - k));
    this.mesh.position.set(x, y, z);
    this.mesh.scale.set(r, 1.6 * (1 - k * 0.6), r);
    this.mat.opacity = 0.9 * (1 - k);
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
