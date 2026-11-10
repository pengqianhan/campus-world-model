// What a walker rides besides its feet: a stand-up electric scooter, and a small drone with four
// rotors that it flies in its place. Both are made up and drawn here from boxes and cylinders, in
// greys with the site's teal; neither is any real make, and neither is any of the University's
// colours. Each faces north with no turn (-z), as the figure does, and stands with its base at its
// origin: the scooter's wheels on the ground, the drone's skids.
import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  ReplaceStencilOp,
  SphereGeometry,
  type BufferGeometry,
  type Material,
} from "three";

/** How a walker gets about: on foot, on a scooter, or flying a drone in its place. */
export type Ride = "walk" | "scooter" | "fly";
export const RIDES: readonly Ride[] = ["walk", "scooter", "fly"];

/** Metres from the ground to the top of the scooter's deck, where the rider's feet stand. */
export const DECK = 0.15;
/** Where the scooter's grips are in its own frame, metres: either side, up, and ahead (-z). */
export const GRIP = { x: 0.23, y: 1.1, z: -0.38 } as const;
/** Metres from the drone's skids to the middle of its body, which a camera behind it looks at. */
export const DRONE_MIDDLE = 0.12;
/** Metres from the drone's middle to the tips of its rotors: how close it comes to a wall. */
export const DRONE_REACH = 0.42;

const TEAL = 0x6ed3c8;

/** Materials that mark where the ride is seen, so that a walker's see-through shape stays off it (figure.ts). */
function marked<M extends Material>(m: M): M {
  m.stencilWrite = true;
  m.stencilRef = 1;
  m.stencilZPass = ReplaceStencilOp;
  return m;
}

function part(geometry: BufferGeometry, material: Material, x: number, y: number, z: number): Mesh {
  const m = new Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  m.userData.noPick = true;
  return m;
}

function disposeAll(root: Group): void {
  const seen = new Set<unknown>();
  root.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    for (const x of [m.geometry, ...[m.material].flat()]) {
      if (seen.has(x)) continue;
      seen.add(x);
      (x as { dispose(): void }).dispose();
    }
  });
}

/**
 * A stand-up electric scooter: a deck on two small wheels, a stem raked back a little to a
 * handlebar with grips, and a lamp at the front.
 */
export class Scooter {
  readonly root = new Group();
  private wheels: Mesh[] = [];

  constructor() {
    const frame = marked(new MeshStandardMaterial({ color: 0x2c3237, roughness: 0.45, metalness: 0.6 }));
    const rubber = marked(new MeshStandardMaterial({ color: 0x141618, roughness: 0.9 }));
    const tape = marked(new MeshStandardMaterial({ color: 0x1d2125, roughness: 0.95 }));
    const trim = marked(new MeshStandardMaterial({ color: TEAL, roughness: 0.5, metalness: 0.2 }));
    const lamp = marked(new MeshBasicMaterial({ color: 0xfff6dc }));
    const r = 0.11;
    // The wheels, on their sides across the way it goes.
    const wheel = new CylinderGeometry(r, r, 0.055, 20);
    wheel.rotateZ(Math.PI / 2);
    for (const z of [-0.43, 0.39]) {
      const w = part(wheel, rubber, 0, r, z);
      this.wheels.push(w);
      this.root.add(w);
    }
    // The deck, with grip tape on top and a teal line along each side.
    this.root.add(part(new BoxGeometry(0.17, 0.05, 0.62), frame, 0, DECK - 0.03, -0.02));
    this.root.add(part(new BoxGeometry(0.15, 0.008, 0.5), tape, 0, DECK, -0.02));
    for (const x of [-0.087, 0.087]) this.root.add(part(new BoxGeometry(0.006, 0.02, 0.56), trim, x, DECK - 0.03, -0.02));
    // A mudguard over the back wheel.
    const guard = part(new BoxGeometry(0.07, 0.012, 0.2), frame, 0, 2 * r + 0.015, 0.4);
    guard.rotation.x = 0.25;
    this.root.add(guard);
    // The stem, from the front axle up to the handlebar, raked back a little.
    const foot = { y: r, z: -0.43 };
    const head = { y: GRIP.y, z: GRIP.z };
    const len = Math.hypot(head.y - foot.y, head.z - foot.z);
    const stem = part(new CylinderGeometry(0.02, 0.024, len, 12), frame, 0, (foot.y + head.y) / 2, (foot.z + head.z) / 2);
    stem.rotation.x = Math.atan2(head.z - foot.z, head.y - foot.y);
    this.root.add(stem);
    const band = part(new CylinderGeometry(0.026, 0.026, 0.08, 12), trim, 0, foot.y + (head.y - foot.y) * 0.62, foot.z + (head.z - foot.z) * 0.62);
    band.rotation.x = stem.rotation.x;
    this.root.add(band);
    // The handlebar and its grips.
    const bar = new CylinderGeometry(0.014, 0.014, 2 * GRIP.x + 0.04, 10);
    bar.rotateZ(Math.PI / 2);
    this.root.add(part(bar, frame, 0, GRIP.y, GRIP.z));
    const grip = new CylinderGeometry(0.019, 0.019, 0.1, 10);
    grip.rotateZ(Math.PI / 2);
    for (const x of [-GRIP.x, GRIP.x]) this.root.add(part(grip, rubber, x, GRIP.y, GRIP.z));
    const light = part(new BoxGeometry(0.05, 0.03, 0.02), lamp, 0, GRIP.y - 0.08, GRIP.z - 0.035);
    light.castShadow = false;
    this.root.add(light);
    this.root.userData.noPick = true;
  }

  /** Turns the wheels by the metres gone since the last frame. */
  roll(metres: number): void {
    for (const w of this.wheels) w.rotation.x -= metres / 0.11;
  }

  dispose(): void {
    disposeAll(this.root);
  }
}

/**
 * A small drone with four rotors on arms, a camera under its nose, two skids and lights: white at
 * the front, red at the back.
 */
export class Drone {
  readonly root = new Group();
  /** Leans with the way it flies; the rotors spin on it. */
  private body = new Group();
  private rotors: Group[] = [];
  private blur: MeshBasicMaterial;
  private tail: MeshBasicMaterial;
  private spin = 0;

  constructor() {
    const shell = marked(new MeshStandardMaterial({ color: 0x3a4148, roughness: 0.4, metalness: 0.35 }));
    const dark = marked(new MeshStandardMaterial({ color: 0x1b1f23, roughness: 0.6, metalness: 0.4 }));
    const trim = marked(new MeshStandardMaterial({ color: TEAL, roughness: 0.5, metalness: 0.2 }));
    const blade = marked(new MeshStandardMaterial({ color: 0x24282c, roughness: 0.5 }));
    const glass = marked(new MeshStandardMaterial({ color: 0x0a0d10, roughness: 0.08, metalness: 0.9 }));
    this.blur = new MeshBasicMaterial({ color: 0x9aa6ae, transparent: true, opacity: 0, depthWrite: false });
    this.tail = new MeshBasicMaterial({ color: 0xff3b30 });
    const front = new MeshBasicMaterial({ color: 0xf4fbff });
    this.root.add(this.body);
    this.body.position.y = DRONE_MIDDLE;
    // The body: a shell with a lighter top and a teal line round it.
    this.body.add(part(new BoxGeometry(0.2, 0.075, 0.3), shell, 0, 0, 0));
    this.body.add(part(new BoxGeometry(0.16, 0.03, 0.22), dark, 0, 0.05, 0.02));
    this.body.add(part(new BoxGeometry(0.205, 0.012, 0.305), trim, 0, -0.012, 0));
    // The camera on its mount under the nose.
    this.body.add(part(new BoxGeometry(0.05, 0.03, 0.04), dark, 0, -0.05, -0.12));
    this.body.add(part(new SphereGeometry(0.03, 16, 10), dark, 0, -0.075, -0.14));
    const lens = part(new CylinderGeometry(0.014, 0.014, 0.012, 14), glass, 0, -0.075, -0.168);
    lens.rotation.x = Math.PI / 2;
    this.body.add(lens);
    // Arms out to the four motors, with a rotor on each.
    const arm = new BoxGeometry(0.03, 0.022, 1);
    const motor = new CylinderGeometry(0.026, 0.03, 0.045, 14);
    const prop = new BoxGeometry(0.25, 0.004, 0.024);
    const disc = new CylinderGeometry(0.13, 0.13, 0.002, 28);
    for (const [x, z] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      const at = { x: x * 0.2, z: z * 0.18 };
      const a = part(arm, dark, at.x / 2, 0, at.z / 2);
      a.rotation.y = Math.atan2(at.x, at.z);
      a.scale.z = Math.hypot(at.x, at.z);
      this.body.add(a);
      this.body.add(part(motor, dark, at.x, 0.02, at.z));
      const rotor = new Group();
      rotor.position.set(at.x, 0.048, at.z);
      for (const turn of [0, Math.PI / 2]) {
        const p = part(prop, blade, 0, 0, 0);
        p.rotation.y = turn;
        rotor.add(p);
      }
      const d = new Mesh(disc, this.blur);
      d.userData.noPick = true;
      d.renderOrder = 2;
      rotor.add(d);
      this.rotors.push(rotor);
      this.body.add(rotor);
      const light = part(new SphereGeometry(0.012, 8, 6), z < 0 ? front : this.tail, at.x, -0.01, at.z);
      light.castShadow = false;
      this.body.add(light);
    }
    // Two skids under it.
    const leg = new BoxGeometry(0.012, 0.08, 0.012);
    const skid = new CylinderGeometry(0.008, 0.008, 0.24, 8);
    skid.rotateX(Math.PI / 2);
    for (const x of [-0.07, 0.07]) {
      for (const z of [-0.06, 0.06]) this.body.add(part(leg, dark, x, -0.075, z));
      this.body.add(part(skid, dark, x, -DRONE_MIDDLE + 0.008, 0));
    }
    this.root.userData.noPick = true;
  }

  /**
   * Moves it on by `dt` seconds: the rotors spin, blurred the faster they go, and the body leans
   * into the way it flies, `forward` metres a second, and banks into a turn of `turn` degrees a
   * second. `t` seconds keep it bobbing a little where it hovers.
   */
  fly(dt: number, forward: number, turn: number, climb: number, t: number, flying: boolean): void {
    // Spinning, the blades are a blur; standing, they are still.
    this.spin = (this.spin + dt * (flying ? 70 : 0)) % (Math.PI * 2);
    this.rotors.forEach((r, i) => {
      r.rotation.y = i % 3 === 0 ? this.spin : -this.spin;
      r.children.forEach((c, k) => (c.visible = k < 2 ? !flying : flying));
    });
    this.blur.opacity = flying ? 0.28 : 0;
    const k = Math.min(1, dt * 4);
    const pitch = -Math.max(-0.22, Math.min(0.22, forward * 0.018));
    const roll = -Math.max(-0.25, Math.min(0.25, (turn / 90) * Math.min(1, Math.abs(forward) / 4 + 0.3) * 0.25));
    this.body.rotation.x += (pitch - this.body.rotation.x) * k;
    this.body.rotation.z += (roll - this.body.rotation.z) * k;
    this.body.position.y = DRONE_MIDDLE + (flying ? Math.sin(t * 2.1) * 0.025 + Math.max(-0.03, Math.min(0.03, climb * -0.006)) : 0);
    this.tail.color.setHex(Math.sin(t * 5) > 0 || !flying ? 0xff3b30 : 0x5a120f);
  }

  dispose(): void {
    disposeAll(this.root);
  }
}
