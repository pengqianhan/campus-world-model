// Builds a landmark's geometry and its stone textures away from the page's main thread, where they
// would stop the page: the textures took 1.0 s there on a desktop and 5.2 s with the processor
// slowed four times, as on a phone (PROGRESS.md, measured 2026-10-21). landmarks.ts draws them.
// The worker is an ES module (vite.config.ts, worker.format): each landmark's model.js is a chunk of
// its own, fetched the first time that landmark is asked for, so coming near one building loads its
// model and no other model. Every file of the shared kit (landmarks/kit/) is part of the worker
// itself: the glob below imports each one, and vite.config.ts counts the kit's files as having side
// effects, so that the bundler keeps them here even where a file only exports functions. So the
// build never splits the kit into a chunk of its own, which would be one more request before a
// model could load.
import type { BufferAttribute, BufferGeometry, Group, Material, Mesh } from "three";
// @ts-expect-error plain JavaScript in the landmarks' shared kit
import { geometryMaterials, makeTextures } from "../../landmarks/kit/materials.js";
import type { Cover, LandmarkReply, LandmarkRequest, MeshData, TextureData } from "./landmarks.ts";

import.meta.glob("../../landmarks/kit/*.js", { eager: true });

type Build = (materials: Record<string, Material>) => Group;
/** Each landmark's model.js, loaded when first asked for, by the name of its folder (src/app/landmarks.ts). */
const MODELS = import.meta.glob<Build>("../../landmarks/*/model.js", { import: "build" });
const modelOf = (name: string) => MODELS[`../../landmarks/${name}/model.js`];

interface MadeTexture {
  map: { image: { data: Uint8Array; width: number } };
  normalMap: { image: { data: Uint8Array } };
  metres: number;
}

const reply = (message: LandmarkReply, transfer: ArrayBuffer[] = []) => self.postMessage(message, { transfer });

// One request after another, in the order they came, as when every model was in this file: a
// request waits while the one before it fetches its model.
let queue = Promise.resolve();
self.onmessage = ({ data: ask }: MessageEvent<LandmarkRequest>) => {
  queue = queue.then(() => answer(ask));
};

async function answer(ask: LandmarkRequest): Promise<void> {
  try {
    if (ask.part === "geometry") {
      const load = modelOf(ask.name);
      if (!load) throw new Error(`no landmark ${ask.name}`);
      const build = await load();
      const materials = geometryMaterials() as Record<string, Material>;
      const names = new Map(Object.entries(materials).map(([k, m]) => [m, k]));
      // The parts log how long each took, for the landmark viewer; here that is noise. A part that
      // fails is still reported, as an error.
      const log = console.log;
      console.log = () => {};
      let model: Group;
      try {
        model = build(materials);
      } finally {
        console.log = log;
      }
      model.updateMatrixWorld(true);
      const meshes: MeshData[] = [];
      const buffers = new Set<ArrayBuffer>();
      model.traverse((o) => {
        const mesh = o as Mesh;
        if (!mesh.isMesh || Array.isArray(mesh.material)) return;
        const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
        g.applyMatrix4(mesh.matrixWorld);
        g.computeBoundingSphere();
        const sphere = g.boundingSphere!;
        const { attributes, groups } = byBuilding(g, ask.covers);
        for (const a of attributes) buffers.add(a.array.buffer as ArrayBuffer);
        meshes.push({
          material: names.get(mesh.material) ?? "",
          castShadow: mesh.castShadow,
          receiveShadow: mesh.receiveShadow,
          attributes,
          groups,
          sphere: [...sphere.center.toArray(), sphere.radius],
        });
      });
      reply({ name: ask.name, part: "geometry", meshes }, [...buffers]);
    } else {
      const made = makeTextures(ask.quality) as Record<string, MadeTexture>;
      const textures: Record<string, TextureData> = {};
      const buffers: ArrayBuffer[] = [];
      for (const [k, t] of Object.entries(made)) {
        textures[k] = { map: t.map.image.data, normalMap: t.normalMap.image.data, size: t.map.image.width, metres: t.metres };
        buffers.push(t.map.image.data.buffer as ArrayBuffer, t.normalMap.image.data.buffer as ArrayBuffer);
      }
      reply({ name: ask.name, part: "textures", quality: ask.quality, textures }, buffers);
    }
  } catch (e) {
    reply({ name: ask.name, part: ask.part, error: e instanceof Error ? e.message : String(e) });
  }
}

/**
 * The triangles of a mesh sorted by the building they stand in, one group each, so that each part
 * of the landmark can take its own building's colours on the map. A triangle stands in the
 * building whose outline holds its middle, seen from above, or else in the nearest one.
 */
function byBuilding(g: BufferGeometry, covers: Cover[]): Pick<MeshData, "attributes" | "groups"> {
  const pos = g.getAttribute("position") as BufferAttribute;
  const triangles = pos.count / 3;
  const owner = new Uint8Array(triangles);
  const counts = covers.map(() => 0);
  for (let t = 0; t < triangles; t++) {
    let x = 0;
    let z = 0;
    for (let k = 0; k < 3; k++) {
      x += pos.getX(t * 3 + k) / 3;
      z += pos.getZ(t * 3 + k) / 3;
    }
    owner[t] = coverAt(x, z, covers);
    counts[owner[t]!]!++;
  }
  const starts = counts.map((_, i) => counts.slice(0, i).reduce((a, b) => a + b, 0));
  const attributes = Object.entries(g.attributes).map(([name, a]) => {
    const size = a.itemSize * 3;
    const from = (a as BufferAttribute).array as Float32Array;
    const array = new Float32Array(from.length);
    const next = starts.slice();
    for (let t = 0; t < triangles; t++) array.set(from.subarray(t * size, t * size + size), next[owner[t]!]!++ * size);
    return { name, array, itemSize: a.itemSize };
  });
  const groups = covers.flatMap((_, i) => (counts[i] ? [{ start: starts[i]! * 3, count: counts[i]! * 3, materialIndex: i }] : []));
  return { attributes, groups };
}

/** The index of the building at a point of the model's ground (x, z): the first whose outline holds it, or the nearest. */
function coverAt(x: number, z: number, covers: Cover[]): number {
  const holds = covers.findIndex(({ rings: [outer, ...holes] }) => !!outer && inside(x, z, outer) && !holes.some((h) => inside(x, z, h)));
  if (holds >= 0) return holds;
  let best = 0;
  let bestDistance = Infinity;
  covers.forEach(({ rings: [outer] }, i) => {
    const d = outer ? distance(x, z, outer) : Infinity;
    if (d < bestDistance) {
      best = i;
      bestDistance = d;
    }
  });
  return best;
}

function inside(x: number, z: number, ring: number[][]): boolean {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i]!;
    const [xj, zj] = ring[j]!;
    if (zi! > z !== zj! > z && x < ((xj! - xi!) * (z - zi!)) / (zj! - zi!) + xi!) hit = !hit;
  }
  return hit;
}

function distance(x: number, z: number, ring: number[][]): number {
  let d = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, az] = ring[j]!;
    const [bx, bz] = ring[i]!;
    const ex = bx! - ax!;
    const ez = bz! - az!;
    const t = Math.max(0, Math.min(1, ((x - ax!) * ex + (z - az!) * ez) / (ex * ex + ez * ez || 1)));
    d = Math.min(d, Math.hypot(x - ax! - t * ex, z - az! - t * ez));
  }
  return d;
}
