import fs from "node:fs";
import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { LANDMARKS, landmarkBuildings, landmarkOf } from "../src/app/landmarks.ts";
import { Landmark } from "../src/scene/landmarks.ts";
// @ts-expect-error plain JavaScript in the landmarks' shared kit
import { geometryMaterials, makeMaterials } from "../landmarks/kit/materials.js";

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

describe("the landmark kit", () => {
  it("builds the geometry with each texture's real size, without drawing a texture", () => {
    const stand = geometryMaterials() as Record<string, { userData: { metres: number }; map: unknown }>;
    const drawn = makeMaterials("low") as Record<string, { userData: { metres: number } }>;
    expect(Object.keys(stand).sort()).toEqual(Object.keys(drawn).sort());
    for (const [name, m] of Object.entries(drawn)) expect(stand[name]!.userData.metres, name).toBe(m.userData.metres);
    expect(stand.ashlar!.map).toBeNull();
  });
});
