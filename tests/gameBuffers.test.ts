import { describe, expect, it } from "vitest";
import { BoxGeometry, DynamicDrawUsage, InstancedBufferAttribute, InstancedMesh, MeshBasicMaterial, type Object3D } from "three";
import { ROOM, everyFrame, roomFor, sendInstances } from "../src/scene/gameBuffers.ts";
import { Debris, Decals, Missiles, Puffs, Shadows, Shocks, Sparks, Telegraphs } from "../src/scene/gameFx.ts";
import { MODELS } from "../src/scene/gameModels.ts";

/** The instanced meshes under an object. */
function instanced(root: Object3D): InstancedMesh[] {
  const out: InstancedMesh[] = [];
  root.traverse((o) => {
    if ((o as InstancedMesh).isInstancedMesh) out.push(o as InstancedMesh);
  });
  return out;
}

function drawn(m: InstancedMesh): number {
  const g = m.geometry;
  return g.index ? g.index.count : g.getAttribute("position").count;
}

describe("buffers written in every frame (gameBuffers.ts)", () => {
  it("have room for more instances than a third of the vertices drawn, and are dynamic", () => {
    const pools: Object3D[] = [new Sparks().mesh, new Puffs().mesh, new Shocks().mesh, new Shadows().mesh, new Decals().group, new Debris().group, new Telegraphs().group, new Missiles().group];
    const meshes = pools.flatMap(instanced);
    expect(meshes.length).toBeGreaterThan(10);
    for (const m of meshes) {
      const name = `${m.geometry.type} of ${drawn(m)} vertices`;
      expect(m.instanceMatrix.count, name).toBeGreaterThanOrEqual(Math.ceil(drawn(m) * ROOM));
      expect(m.instanceMatrix.usage, name).toBe(DynamicDrawUsage);
      if (m.instanceColor) expect(m.instanceColor.usage, name).toBe(DynamicDrawUsage);
      // Their own per-instance attributes, as long as the matrices.
      for (const a of Object.values(m.geometry.attributes)) {
        if (!(a instanceof InstancedBufferAttribute)) continue;
        expect(a.count, `${name}: ${a.name || "attribute"}`).toBeGreaterThanOrEqual(m.instanceMatrix.count);
        expect(a.usage, name).toBe(DynamicDrawUsage);
      }
    }
  });

  it("room for the villains' models is more than their caps where the models are detailed", () => {
    for (const make of Object.values(MODELS)) {
      const model = make();
      for (const g of [model.body, model.glow, ...model.parts.map((p) => p.geo)]) {
        const v = g.index ? g.index.count : g.getAttribute("position").count;
        expect(roomFor(g, 4)).toBeGreaterThanOrEqual(Math.max(4, Math.ceil(v * ROOM)));
      }
    }
  });

  it("sends only the instances in use", () => {
    const m = everyFrame(new InstancedMesh(new BoxGeometry(), new MeshBasicMaterial(), roomFor(new BoxGeometry(), 8)));
    const v = m.instanceMatrix.version;
    sendInstances(m, 3);
    expect(m.instanceMatrix.version).toBe(v + 1);
    expect(m.instanceMatrix.updateRanges).toEqual([{ start: 0, count: 3 * 16 }]);
  });
});
