// The landmarks (src/app/landmarks.ts) as the scene draws them: each in place of its buildings'
// blocks where the camera comes near it, in one of two forms of the same geometry. Both are made in
// a worker (landmarkWorker.ts) the first time they are wanted, and drawn once their shaders are
// made (CampusScene.prepareLandmark):
// - "light": the landmark's shape in the map's colours, with no texture. The map draws it, and so
//   do the walker views of the basic tier (street/tier.ts): phones and software rendering.
// - "full": the same shape in the landmark's own materials (landmarks/kit/), in the
//   walker views of the full tier.
// The blocks stay in the scene. They are what a click finds and what opens on their floors (CampusScene).
import { BufferAttribute, BufferGeometry, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, Sphere, Vector3, type Material, type Object3D } from "three";
import { landmarkBuildings, type LandmarkEntry, type Placement } from "../app/landmarks.ts";

export type LandmarkForm = "light" | "full";
export type TextureQuality = "high" | "low";

/** A building a landmark draws, with its outline in the model's frame: rings of [x, z], the first outer. */
export interface Cover {
  id: string;
  rings: number[][][];
}

/** What the page asks the worker for. */
export type LandmarkRequest = { name: string; part: "geometry"; covers: Cover[] } | { name: string; part: "textures"; quality: TextureQuality };

/** One mesh of a landmark's model, as the worker sends it: in the model's frame, its triangles in one group a building. */
export interface MeshData {
  /** The kit's name for the material it is drawn in (landmarks/kit/materials.js). */
  material: string;
  castShadow: boolean;
  receiveShadow: boolean;
  attributes: { name: string; array: Float32Array; itemSize: number }[];
  /** Vertices of each building, as Cover's index. */
  groups: { start: number; count: number; materialIndex: number }[];
  /** Its bounding sphere: centre and radius. */
  sphere: number[];
}

/** One of the kit's stone textures: RGBA bytes, `size` square, repeating every `metres`. */
export interface TextureData {
  map: Uint8Array;
  normalMap: Uint8Array;
  size: number;
  metres: number;
}

export type LandmarkReply =
  /** `stone`: whether a mesh is in one of the kit's stone materials, the only ones the textures are for. */
  | { name: string; part: "geometry"; meshes: MeshData[]; stone: boolean }
  | { name: string; part: "textures"; quality: TextureQuality; textures: Record<string, TextureData> }
  | { name: string; part: "geometry" | "textures"; error: string };

/** The light form's materials for one building, coloured from the map's palette by the scene (CampusScene.restyle). */
export interface LightMaterials {
  walls: MeshLambertMaterial;
  roof: MeshLambertMaterial;
  /** The panes of the windows, which glow after dark as the blocks' windows do. */
  glass: MeshLambertMaterial;
  /** Bars, louvres and the dark behind openings. */
  openings: MeshLambertMaterial;
}

/**
 * The part of the light form each of the kit's materials falls in; every other material is wall,
 * as the painted timber's boards, trim and paint are.
 */
const LIGHT_ROLE: Record<string, keyof LightMaterials> = {
  roof: "roof",
  roofPale: "roof",
  glass: "glass",
  glassPale: "glass",
  iron: "openings",
  void: "openings",
};

/**
 * The full form's textures. At "low" the rock-faced ashlar repeats every 4 m over 1,024 pixels, half
 * the landmark viewer's 2,048: about 32 MB on the graphics card in place of 64, and less than half
 * the time to make, and still more than a walker's view shows of a wall a few metres away.
 */
const QUALITY: TextureQuality = "low";

/**
 * The full form's parts drawn into the depth buffer alone, before they are shaded: the stone's
 * weathering is worked out for every pixel it is drawn on, and the model's mouldings, frames and
 * panes lie one behind another. A little further off than the parts, so that they pass over it.
 */
const DEPTH_ONLY = Object.assign(new MeshBasicMaterial({ colorWrite: false }), { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });

/** What a landmark needs from the scene that draws it. */
export interface LandmarkHost {
  /** Counts a part being made: +1 when it is asked for, -1 when its form is made. */
  loading: (change: number) => void;
  /** Makes a form's shaders before it is first drawn; resolves when they are made. The form is drawn after. */
  prepare: (form: Object3D) => Promise<unknown>;
  /** A form that was being prepared is ready to draw, or failed: once for each prepare. */
  ready: () => void;
}

/** One mesh of the model, shared by both forms. */
interface Part {
  material: string;
  geometry: BufferGeometry;
  castShadow: boolean;
  receiveShadow: boolean;
}

/** One landmark in the scene. */
export class Landmark {
  readonly name: string;
  /** The buildings whose blocks it stands in place of, its own first. */
  readonly buildings: string[];
  readonly placement: Placement;
  /** Stands the landmark where it is on the map; the form drawn is a child of it. */
  readonly group = new Group();
  /** The form drawn now; none while the blocks are drawn in its place. */
  shown?: LandmarkForm;
  private lights: Map<string, LightMaterials>;
  private host: LandmarkHost;
  private forms: Partial<Record<LandmarkForm, Group>> = {};
  private parts?: Part[];
  /** The building of each group of the parts' triangles, as the worker sorted them. */
  private covered: string[] = [];
  private textures?: Record<string, TextureData>;
  private full?: Record<string, Material>;
  /** The full form while it is being made: it needs the geometry and the textures, whichever comes last. */
  private makingFull?: Promise<void>;
  private asked = new Set<LandmarkRequest["part"]>();
  /** The full form was asked for; its textures are asked for once the geometry says whether it needs them. */
  private wantsFull = false;
  /** Whether the model has stone, as the geometry says. */
  private stone = false;

  constructor(entry: LandmarkEntry, host: LandmarkHost) {
    const p = entry.placement;
    this.name = entry.name;
    this.buildings = landmarkBuildings(entry);
    this.placement = p;
    this.host = host;
    this.lights = new Map(
      this.buildings.map((id) => [
        id,
        { walls: new MeshLambertMaterial(), roof: new MeshLambertMaterial(), glass: new MeshLambertMaterial({ emissive: 0xffc56e, emissiveIntensity: 0 }), openings: new MeshLambertMaterial() },
      ]),
    );
    // The model's x = z = 0 at its place on the map, turned to its bearing (place.py).
    this.group.name = `landmark:${entry.name}`;
    this.group.position.set(p.centre[0]!, 0, -p.centre[1]!);
    this.group.rotation.y = p.rotationY;
    this.group.scale.setScalar(p.scale);
    this.group.visible = false;
    this.group.userData.noPick = true;
  }

  /** The middle of the landmark, map metres east and north. */
  get centre(): [number, number] {
    return [this.placement.centre[0]!, this.placement.centre[1]!];
  }

  /** The foot of its entrance, map metres east and north: the model's y = 0 is the ground there. */
  get door(): [number, number] {
    return [this.placement.door.map[0]!, this.placement.door.map[1]!];
  }

  /** The light form's materials for one of its buildings. */
  light(building: string): LightMaterials | undefined {
    return this.lights.get(building);
  }

  /** A point of the map, metres east and north, in the model's frame: [x, z]. */
  toModel(east: number, north: number): [number, number] {
    const p = this.placement;
    const dx = (east - p.centre[0]!) / p.scale;
    const dz = (p.centre[1]! - north) / p.scale;
    const c = Math.cos(p.rotationY);
    const s = Math.sin(p.rotationY);
    return [dx * c - dz * s, dx * s + dz * c];
  }

  /** Stands the model on the ground at its door, `ground` metres up. */
  stand(ground: number): void {
    this.group.position.y = ground;
  }

  /** Squashes it to `k` of its height, as its neighbours sink while a building is open. */
  squash(k: number): void {
    const s = this.placement.scale;
    this.group.scale.set(s, s * k, s);
  }

  /** Whether a form is made and ready to draw. */
  has(form: LandmarkForm): boolean {
    return !!this.forms[form];
  }

  /**
   * Asks the worker for what a form needs, the first time; `ready` is called when it is in place.
   * `covers` gives the outlines of its buildings, for the geometry.
   */
  want(form: LandmarkForm, covers: () => Cover[]): void {
    if (!this.asked.has("geometry")) this.fetch({ name: this.name, part: "geometry", covers: covers() });
    if (form === "full") {
      this.wantsFull = true;
      this.askTextures();
    }
  }

  /**
   * The full form's textures, once the geometry has come: the kit's textures are its stone's, so a
   * model with no stone, as one of painted timber, asks for none and makes its full form without them.
   */
  private askTextures(): void {
    if (!this.wantsFull || !this.parts || this.asked.has("textures")) return;
    if (this.stone) {
      this.fetch({ name: this.name, part: "textures", quality: QUALITY });
    } else {
      this.asked.add("textures");
      this.textures = {};
      // The geometry may have come long before (the map wanted the light form first): make it now.
      this.makeFullWhenReady()?.catch((e) => console.error(`landmark ${this.name}`, e));
    }
  }

  /** Makes the full form once the geometry and the textures are both in, whichever comes last. */
  private makeFullWhenReady(): Promise<void> | undefined {
    return this.parts && this.textures ? (this.makingFull ??= this.makeFull()) : undefined;
  }

  /** Draws a form, or none, so that the blocks show. A form not yet made counts as none. True if that changed. */
  show(form: LandmarkForm | undefined): boolean {
    const next = form && this.forms[form] ? form : undefined;
    if (next === this.shown) return false;
    this.shown = next;
    for (const [k, g] of Object.entries(this.forms)) g.visible = k === next;
    this.group.visible = !!next;
    return true;
  }

  dispose(): void {
    for (const part of this.parts ?? []) part.geometry.dispose();
    const materials = [...[...this.lights.values()].flatMap((l) => Object.values(l)), ...Object.values(this.full ?? {})];
    for (const m of materials) {
      const { map, normalMap } = m as { map?: { dispose(): void } | null; normalMap?: { dispose(): void } | null };
      map?.dispose();
      normalMap?.dispose();
      m.dispose();
    }
  }

  private fetch(request: LandmarkRequest): void {
    this.asked.add(request.part);
    if (request.part === "geometry") this.covered = request.covers.map((c) => c.id);
    this.host.loading(1);
    void ask(request)
      .then((reply) => this.take(reply))
      .catch((e) => console.error(`landmark ${this.name}`, e))
      .finally(() => this.host.loading(-1));
  }

  private async take(reply: LandmarkReply): Promise<void> {
    if ("error" in reply) throw new Error(`${reply.part}: ${reply.error}`);
    if (reply.part === "geometry") {
      this.parts = reply.meshes.map((m) => {
        const geometry = new BufferGeometry();
        for (const a of m.attributes) geometry.setAttribute(a.name, new BufferAttribute(a.array, a.itemSize));
        for (const g of m.groups) geometry.addGroup(g.start, g.count, g.materialIndex);
        geometry.boundingSphere = new Sphere(new Vector3(m.sphere[0], m.sphere[1], m.sphere[2]), m.sphere[3]);
        return { material: m.material, geometry, castShadow: m.castShadow, receiveShadow: m.receiveShadow };
      });
      // Each building's part in its own colours: one material a group.
      const lights = this.covered.map((id) => this.lights.get(id)!);
      this.place("light", this.form((part) => lights.map((l) => l[LIGHT_ROLE[part.material] ?? "walls"])));
      this.stone = reply.stone;
      this.askTextures();
    } else {
      this.textures = reply.textures;
    }
    await this.makeFullWhenReady();
  }

  /** Puts a form among those that can be drawn once its shaders are made, and says so, made or not. */
  private place(name: LandmarkForm, form: Group): void {
    void this.host
      .prepare(form)
      .then(() => (this.forms[name] = form))
      .catch((e) => console.error(`landmark ${this.name}`, e))
      .finally(() => this.host.ready());
  }

  /** The full form, from the geometry and the textures. */
  private async makeFull(): Promise<void> {
    const [kit, made] = await Promise.all([
      // @ts-expect-error plain JavaScript in the landmarks' shared kit
      import("../../landmarks/kit/materials.js") as Promise<Kit>,
      // @ts-expect-error plain JavaScript in the landmarks' shared kit
      import("../../landmarks/kit/textures.js") as Promise<KitTextures>,
    ]);
    const sets = Object.fromEntries(
      Object.entries(this.textures!).map(([k, t]) => [k, { map: made.texture(t.map, t.size, true), normalMap: made.texture(t.normalMap, t.size, false), metres: t.metres }]),
    );
    this.textures = undefined;
    // The weathering is laid in the model's own frame: on the map the model is moved and turned.
    const materials = (this.full = kit.makeMaterials(QUALITY, sets, { space: "object" }));
    this.place("full", this.form((part) => materials[part.material] ?? materials.ashlar!, true));
  }

  /**
   * A form: every part of the model in the material, or a material a building, that `materialOf`
   * gives it. With `depthFirst` the parts go into the depth buffer alone first, so that each pixel
   * of the model is shaded once, for its front surface only.
   */
  private form(materialOf: (part: Part) => Material | Material[], depthFirst = false): Group {
    const g = new Group();
    for (const part of this.parts!) {
      const mesh = new Mesh(part.geometry, materialOf(part));
      mesh.castShadow = part.castShadow;
      mesh.receiveShadow = part.receiveShadow;
      // A click finds the blocks, not the landmark's hundred thousand triangles.
      mesh.raycast = () => {};
      mesh.userData.noPick = true;
      g.add(mesh);
      if (depthFirst && !(mesh.material as Material).transparent) {
        const twin = new Mesh(part.geometry, DEPTH_ONLY);
        twin.renderOrder = -1;
        twin.raycast = () => {};
        twin.userData.noPick = true;
        g.add(twin);
      }
    }
    g.visible = false;
    this.group.add(g);
    return g;
  }
}

/** landmarks/kit/materials.js, as this file uses it. */
interface Kit {
  makeMaterials(quality: TextureQuality, textures: Record<string, unknown>, options: { space: "object" }): Record<string, Material>;
}
/** landmarks/kit/textures.js, as this file uses it. */
interface KitTextures {
  texture(data: Uint8Array, size: number, srgb: boolean): unknown;
}

// One worker builds every landmark, one request after another. It goes once nothing is asked of
// it, so that it does not keep three.js and the models in memory for nothing.
let worker: Worker | undefined;
const waiting = new Map<string, (reply: LandmarkReply) => void>();

function ask(request: LandmarkRequest): Promise<LandmarkReply> {
  worker ??= startWorker();
  const w = worker;
  return new Promise((resolve) => {
    waiting.set(`${request.name}:${request.part}`, resolve);
    w.postMessage(request);
  });
}

function startWorker(): Worker {
  const w = new Worker(new URL("./landmarkWorker.ts", import.meta.url), { type: "module" });
  const done = () => {
    if (waiting.size || worker !== w) return;
    w.terminate();
    worker = undefined;
  };
  w.onmessage = ({ data }: MessageEvent<LandmarkReply>) => {
    const key = `${data.name}:${data.part}`;
    waiting.get(key)?.(data);
    waiting.delete(key);
    // Not before the reply's handlers have run: what they ask for next (a landmark's textures once
    // its geometry has come) goes to this worker, not a new one.
    setTimeout(done);
  };
  // The worker could not start or stopped: every request still open fails.
  w.onerror = (e) => {
    e.preventDefault();
    for (const [key, resolve] of waiting) {
      const [name, part] = key.split(":") as [string, LandmarkRequest["part"]];
      resolve({ name, part, error: e.message || "the worker stopped" });
    }
    waiting.clear();
    done();
  };
  return w;
}
