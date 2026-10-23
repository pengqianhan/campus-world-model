import fs from "node:fs";
import { Box3, Vector3, type Mesh, type Object3D } from "three";
import { describe, expect, it } from "vitest";
import { LANDMARKS, landmarkBuildings, landmarkOf } from "../src/app/landmarks.ts";
import { Landmark, type LandmarkRequest } from "../src/scene/landmarks.ts";
import { Terrain } from "../src/scene/terrain.ts";
import { massing } from "../src/shared/massing.ts";
import type { CampusData, TerrainData } from "../src/shared/types.ts";
// @ts-expect-error plain JavaScript in the landmarks' shared kit
import { geometryMaterials, makeMaterials } from "../landmarks/kit/materials.js";
// @ts-expect-error plain JavaScript in a landmark's parts
import { OUTLINE, TOP } from "../landmarks/old-choral-hall/parts/rest.js";

const host = { loading: () => {}, prepare: async () => {}, ready: () => {} };

describe("landmarks on the map", () => {
  it("the Clock Tower draws building 105 and its south range, 105S, and no other", () => {
    const clocktower = LANDMARKS.find((l) => l.name === "clocktower");
    expect(clocktower).toBeDefined();
    expect(landmarkBuildings(clocktower!)).toEqual(["105", "105S"]);
    expect(landmarkOf("105")?.name).toBe("clocktower");
    expect(landmarkOf("105S")?.name).toBe("clocktower");
    expect(landmarkOf("119")?.name).not.toBe("clocktower");
  });

  it("the site finds every landmark whose placement says site: true, and only those, each with its model", () => {
    const folders = fs.readdirSync("landmarks", { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(`landmarks/${d.name}/placement.json`));
    const onSite = folders.filter((d) => JSON.parse(fs.readFileSync(`landmarks/${d.name}/placement.json`, "utf8")).site === true).map((d) => d.name);
    expect(onSite).toContain("clocktower");
    expect(LANDMARKS.map((l) => l.name)).toEqual(onSite.sort());
    // The worker loads landmarks/<name>/model.js by the same name.
    for (const name of onSite) expect(fs.existsSync(`landmarks/${name}/model.js`), name).toBe(true);
    // A building's block gives way to one landmark at most.
    const buildings = LANDMARKS.flatMap(landmarkBuildings);
    expect(new Set(buildings).size).toBe(buildings.length);
  });

  it("the scene puts the model's door where place.py puts it on the map, and back", () => {
    for (const entry of LANDMARKS) {
      const l = new Landmark(entry, host);
      const [mx, mz] = entry.placement.door.model as [number, number];
      const [east, north] = entry.placement.door.map as [number, number];
      // Model to map through the group's own matrix: three.js's turn about y, as the scene draws it.
      l.group.updateMatrixWorld(true);
      const at = new Vector3(mx, 0, mz).applyMatrix4(l.group.matrixWorld);
      expect(at.x).toBeCloseTo(east, 2);
      expect(-at.z).toBeCloseTo(north, 2);
      // And the map back to the model, as the worker sorts the triangles by building.
      const [x, z] = l.toModel(east, north);
      expect(x).toBeCloseTo(mx, 2);
      expect(z).toBeCloseTo(mz, 2);
      l.dispose();
    }
  });
});

describe("a landmark's forms", () => {
  it("makes the full form whether the map's light form or a walker's full form is asked for first, with stone or without", async () => {
    // A stand-in for the worker: it answers each request a moment later, in order.
    let stone = false;
    const asked: string[] = [];
    let workers = 0;
    class StandIn {
      onmessage?: (e: { data: unknown }) => void;
      onerror: unknown = null;
      constructor() {
        workers++;
      }
      postMessage(r: LandmarkRequest) {
        asked.push(r.part);
        const mesh = { material: stone ? "ashlar" : "boards", castShadow: true, receiveShadow: true, attributes: [{ name: "position", array: new Float32Array(9), itemSize: 3 }], groups: [{ start: 0, count: 3, materialIndex: 0 }], sphere: [0, 0, 0, 1] };
        const data = r.part === "geometry" ? { name: r.name, part: "geometry", meshes: [mesh], stone } : { name: r.name, part: "textures", quality: r.quality, textures: {} };
        setTimeout(() => this.onmessage?.({ data }), 5);
      }
      terminate() {}
    }
    const real = globalThis.Worker;
    globalThis.Worker = StandIn as unknown as typeof Worker;
    const settle = () => new Promise((r) => setTimeout(r, 100));
    // Until the full form is made, or 20 s: the kit's first import can be slow on a busy machine.
    const made = async (l: Landmark) => {
      for (let t = 0; t < 200 && !l.has("full"); t++) await new Promise((r) => setTimeout(r, 100));
    };
    const entry = LANDMARKS[0]!;
    const covers = () => [{ id: landmarkBuildings(entry)[0]!, rings: [] }];
    try {
      for (const s of [false, true]) {
        for (const mapFirst of [true, false]) {
          stone = s;
          asked.length = 0;
          workers = 0;
          const l = new Landmark(entry, host);
          if (mapFirst) {
            l.want("light", covers);
            await settle();
          }
          l.want("full", covers);
          await made(l);
          const how = `${s ? "stone" : "no stone"}, ${mapFirst ? "map first" : "walker first"}`;
          expect(l.has("full"), how).toBe(true);
          // The stone's textures only for a model with stone.
          expect(asked, how).toEqual(s ? ["geometry", "textures"] : ["geometry"]);
          // Asked for at once, the geometry and then the textures go to one worker.
          if (!mapFirst) expect(workers, how).toBe(1);
          l.dispose();
        }
      }
    } finally {
      globalThis.Worker = real;
    }
  }, 120_000);
});

describe("each landmark on the site's ground", () => {
  it("stands at its door with each material's lowest points nowhere more than 0.25 m above the drawn ground", async () => {
    // The site's ground (the 8 m elevation model) can be a metre or more off the LiDAR's, which the
    // models are measured to; ordinary blocks get a footing for it (terrain.ts), a landmark its walls.
    const terrain = new Terrain([JSON.parse(fs.readFileSync("public/data/terrain/central.json", "utf8")) as TerrainData]);
    for (const entry of LANDMARKS) {
      const l = new Landmark(entry, host);
      l.stand(terrain.height(...(entry.placement.door.map as [number, number])));
      l.group.updateMatrixWorld(true);
      const { build } = (await import(`../landmarks/${entry.name}/model.js`)) as { build: (m: unknown) => Object3D };
      const log = console.log;
      console.log = () => {};
      const model = build(geometryMaterials());
      console.log = log;
      model.updateMatrixWorld(true);
      const meshes: Mesh[] = [];
      model.traverse((o) => void ((o as Mesh).isMesh && meshes.push(o as Mesh)));
      // Each mesh that comes down to the ground at the door (y = 0) or below, at its own lowest points. The kit's
      // Builder joins a model's parts into one mesh a material, so this is a material's foot, not
      // a part's: give every part the same foot (Old Government House's take FOOT from common.js).
      let worst = -Infinity;
      let at = "";
      const v = new Vector3();
      for (const m of meshes) {
        m.geometry.computeBoundingBox();
        const foot = new Box3().copy(m.geometry.boundingBox!).applyMatrix4(m.matrixWorld).min.y;
        if (foot > 0) continue;
        const p = m.geometry.getAttribute("position");
        for (let i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
          if (v.y > foot + 0.01) continue;
          v.applyMatrix4(l.group.matrixWorld);
          const gap = v.y - terrain.height(v.x, -v.z);
          if (gap > worst) [worst, at] = [gap, `${m.parent?.name ?? ""}/${m.name}`];
        }
      }
      expect(at, `${entry.name}: no mesh reaches the ground at its door`).not.toBe("");
      expect(worst, `${entry.name} ${at}`).toBeLessThan(0.25);
      l.dispose();
    }
  }, 60_000);
});

describe("the landmark kit", () => {
  it("builds the geometry with each texture's real size, without drawing a texture", () => {
    const stand = geometryMaterials() as Record<string, { userData: { metres: number }; map: unknown }>;
    const drawn = makeMaterials("low") as Record<string, { userData: { metres: number } }>;
    expect(Object.keys(stand).sort()).toEqual(Object.keys(drawn).sort());
    for (const [name, m] of Object.entries(drawn)) expect(stand[name]!.userData.metres, name).toBe(m.userData.metres);
    expect(stand.ashlar!.map).toBeNull();
  });
});

describe("Old Choral Hall's rest, the map's estimated block (parts/rest.js)", () => {
  it("stands on the outline the map extrudes for block 104 and reaches the top the map gives that block", () => {
    const campus = JSON.parse(fs.readFileSync("public/data/campus.json", "utf8")) as CampusData;
    const terrain = new Terrain([JSON.parse(fs.readFileSync("public/data/terrain/central.json", "utf8")) as TerrainData]);
    const b = campus.buildings.find((x) => x.id === "104")!;
    const blocks = massing(b, campus.floorHeight);
    const entry = LANDMARKS.find((l) => l.name === "old-choral-hall")!;
    const l = new Landmark(entry, host);
    // The outline: the lowest block's, in the model's frame, to the 0.01 m it is written to.
    const ring = blocks[0]!.outline[0]![0]!;
    const want: [number, number][] = [];
    for (let i = 0; i + 1 < ring.length; i += 2) want.push(l.toModel(ring[i]! / 10, ring[i + 1]! / 10));
    const outline = OUTLINE as [number, number][];
    expect(outline.length).toBe(want.length);
    outline.forEach(([x, z], i) => expect(Math.hypot(x - want[i]![0], z - want[i]![1]), `corner ${i}`).toBeLessThan(0.01));
    // The top: the block's top on the map (its footing, CampusScene.baseOf, and its blocks' height) over the ground at the door.
    const top = terrain.footing(b.outline[0]!).base + blocks.at(-1)!.y1 - terrain.height(...(entry.placement.door.map as [number, number]));
    expect(Math.abs((TOP as number) - top)).toBeLessThan(0.01);
    l.dispose();
  });
});
