// The measured massings (landmarks/MASSING.md): every data file that massing.py writes is a
// building the shared model can draw, within the limits the maintainer set, and no building is drawn
// by two models.
import fs from "node:fs";
import type { Mesh } from "three";
import { describe, expect, it } from "vitest";
import { LANDMARKS, MEASURED, landmarkBuildings, measuredOf } from "../src/app/landmarks.ts";
import { Landmark } from "../src/scene/landmarks.ts";
import type { CampusData } from "../src/shared/types.ts";
// @ts-expect-error plain JavaScript: the shared model of the measured massings
import { build } from "../landmarks/measured/model.js";

interface Layer {
  rings: number[][][];
  y0: number;
  wall: number;
  ridge: number;
  roof: "flat" | "mono" | "gable" | "hip";
  eave?: number;
  planes?: number[][];
  overhang: number;
  /** The lowest layer's overhang, edge by edge of its outer ring. */
  eaves?: number[];
  storey: number;
  storeys: number;
}
interface Data {
  place: { building: string; centre: number[]; door: number[] };
  ground: { zero: number; p5: number; p50: number; p95: number };
  levels: number;
  layers: Layer[];
  measured: { cover: number; vegetation: number; open_below: number };
  check: { iou: number; "within_0.5m": number };
}

const DIR = "landmarks/measured/buildings";
const FILES = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));
const DATA = FILES.map((f) => ({ file: f, data: JSON.parse(fs.readFileSync(`${DIR}/${f}`, "utf8")) as Data }));
const campus = JSON.parse(fs.readFileSync("public/data/uoa/campus.json", "utf8")) as CampusData;
const byId = new Map(campus.buildings.map((b) => [b.id, b]));
const exclusions = JSON.parse(fs.readFileSync("landmarks/measured/exclusions.json", "utf8")).buildings as Record<string, unknown>;

const area = (ring: number[][]) => ring.reduce((a, p, i) => a + p[0]! * ring[(i + 1) % ring.length]![1]! - ring[(i + 1) % ring.length]![0]! * p[1]!, 0) / 2;

/** Whether two segments cross at a point inside both. */
function cross(a: number[], b: number[], c: number[], d: number[]): boolean {
  const o = (p: number[], q: number[], r: number[]) => (q[0]! - p[0]!) * (r[1]! - p[1]!) - (q[1]! - p[1]!) * (r[0]! - p[0]!);
  return o(a, b, c) * o(a, b, d) < -1e-9 && o(c, d, a) * o(c, d, b) < -1e-9;
}

describe("measured massings", () => {
  it("are on the site, one a data file, each for a building of the City campus map", () => {
    expect(FILES.length).toBeGreaterThan(0);
    expect(MEASURED.map((m) => m.placement.building).sort()).toEqual(DATA.map((d) => d.data.place.building).sort());
    for (const { file, data } of DATA) {
      expect(file).toBe(`${data.place.building}.json`);
      const b = byId.get(data.place.building);
      expect(b, file).toBeDefined();
      expect(b!.campus).toBe("city");
      expect(b!.offMap).toBeFalsy();
      expect(exclusions[data.place.building], `${file} is also in exclusions.json`).toBeUndefined();
      expect(measuredOf(data.place.building)?.name).toBe(`measured/${data.place.building}`);
    }
  });

  it("each data file was made from the campus map now published: its outline and its centre", () => {
    for (const { file, data } of DATA) {
      const b = byId.get(data.place.building)!;
      expect(data.place.centre, file).toEqual(b.center.map((v) => Math.round(v * 100) / 100));
      // The lowest layer stands on the outline itself (massing.py turns it counter-clockwise).
      const outline = (b.outline[0] as number[]).reduce<number[][]>((acc, v, i, all) => (i % 2 ? acc : [...acc, [v / 10, all[i + 1]! / 10]]), []);
      const ring = data.layers[0]!.rings[0]!;
      const same = (a: number[][]) => a.length === ring.length && a.every((p, i) => Math.abs(p[0]! - ring[i]![0]!) < 0.006 && Math.abs(p[1]! - ring[i]![1]!) < 0.006);
      expect(same(outline) || same([...outline].reverse()), `${file}: its lowest layer is not the campus map's outline`).toBe(true);
    }
  });

  it("no building is drawn by two models", () => {
    const drawn = [...LANDMARKS, ...MEASURED].flatMap(landmarkBuildings);
    expect(new Set(drawn).size).toBe(drawn.length);
  });

  it("leave the blocks of places where people live, childcare centres, Waipapa Marae, Fale Pasifika and UniPress (decisions 6, 7 and 10)", () => {
    for (const { data } of DATA) {
      const b = byId.get(data.place.building)!;
      expect(["251", "252", "253", "254", "255", "256", "275", "408"]).not.toContain(b.id);
      expect(b.floors.some((f) => f.noPlan === "childcare"), b.id).toBe(false);
      // Places where people live: residential floors, and those massing.py keeps by hand (434, 450, and
      // Carlaw Park's blocks, which OpenStreetMap tags as dormitories).
      expect(b.floors.some((f) => f.noPlan === "residential"), b.id).toBe(false);
      expect(["434", "450", "831", "832", "833", "834", "835", "836", "837", "838"]).not.toContain(b.id);
    }
  });

  it("each data file is closed rings and heights within the limits of MASSING.md", () => {
    for (const { file, data } of DATA) {
      expect(data.measured.cover, file).toBeGreaterThanOrEqual(0.85);
      expect(data.measured.vegetation, file).toBeLessThanOrEqual(0.15);
      expect(data.measured.open_below, file).toBeLessThanOrEqual(0.5);
      expect(data.check.iou, file).toBeGreaterThanOrEqual(0.9);
      expect(data.check["within_0.5m"], file).toBeGreaterThanOrEqual(0.9);
      expect(data.layers.length, file).toBeGreaterThan(0);
      expect(data.layers[0]!.y0, file).toBe(-1);
      for (const l of data.layers) {
        for (const ring of l.rings) {
          expect(ring.length, file).toBeGreaterThanOrEqual(3);
          for (const p of ring) expect(p.every(Number.isFinite), file).toBe(true);
          expect(Math.abs(area(ring)), file).toBeGreaterThan(1);
          // A ring that crosses itself has no inside to draw.
          for (let i = 0; i < ring.length; i++)
            for (let j = i + 2; j < ring.length; j++) {
              if (i === 0 && j === ring.length - 1) continue;
              expect(cross(ring[i]!, ring[(i + 1) % ring.length]!, ring[j]!, ring[(j + 1) % ring.length]!), `${file} ring crosses itself`).toBe(false);
            }
        }
        expect(area(l.rings[0]!), `${file}: the outer ring goes counter-clockwise`).toBeGreaterThan(0);
        expect(l.wall, file).toBeGreaterThan(l.y0);
        expect(l.ridge, file).toBeGreaterThanOrEqual(l.wall - 1e-6);
        expect(["flat", "mono", "gable", "hip"]).toContain(l.roof);
        if (l.roof === "flat") expect(l.eave, file).toBeDefined();
        else expect(l.planes!.length, file).toBe(l.roof === "mono" ? 1 : l.roof === "gable" ? 2 : l.planes!.length);
        // Storeys from the published levels, spaced to the wall: 2.4 m to 4.5 m each (MASSING.md).
        expect(l.storeys, file).toBeGreaterThan(0);
        expect(l.storeys, file).toBeLessThanOrEqual(Math.max(1, data.levels));
        if (l.wall >= 2.4) expect(l.storey, file).toBeGreaterThanOrEqual(2.4 - 1e-3);
        expect(l.storey, file).toBeLessThanOrEqual(4.5 + 1e-3);
        expect(l.storey * l.storeys, file).toBeLessThanOrEqual(l.wall + 0.01);
        // Eaves edge by edge: one an edge of the outer ring, 0 to 1 m, the largest as `overhang`.
        if (l.eaves) {
          expect(l.eaves.length, file).toBe(l.rings[0]!.length);
          for (const e of l.eaves) expect(e >= 0 && e <= 1, file).toBe(true);
          expect(Math.max(...l.eaves), file).toBe(l.overhang);
        }
      }
    }
  });

  it("the shared model draws each one as walls and roofs, at the heights its data gives", () => {
    for (const { file, data } of DATA) {
      const group = build({}, undefined, data);
      const meshes = group.children as Mesh[];
      expect(meshes.map((m) => m.name).sort(), file).toEqual(["roof", "walls"]);
      let top = -Infinity;
      let bottom = Infinity;
      for (const m of meshes) {
        const p = m.geometry.getAttribute("position");
        for (let i = 0; i < p.count; i++) {
          expect(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)), file).toBe(true);
          top = Math.max(top, p.getY(i));
          bottom = Math.min(bottom, p.getY(i));
        }
        // The facade data the walker views draw walls with goes with every vertex.
        expect(m.geometry.getAttribute("facade")?.count, file).toBe(p.count);
        // Every wall faces out: a band drawn upside down would face in.
        if (m.name === "walls") {
          m.geometry.computeBoundingBox();
          const n = m.geometry.getAttribute("normal");
          const idx = m.geometry.index!;
          for (let t = 0; t < idx.count; t += 3) {
            const [a, b, c] = [idx.getX(t), idx.getX(t + 1), idx.getX(t + 2)];
            const ux = p.getX(b) - p.getX(a), uy = p.getY(b) - p.getY(a), uz = p.getZ(b) - p.getZ(a);
            const vx = p.getX(c) - p.getX(a), vy = p.getY(c) - p.getY(a), vz = p.getZ(c) - p.getZ(a);
            const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
            if (Math.hypot(cx, cy, cz) < 1e-6) continue;
            // The winding agrees with the normal the face is shaded with.
            expect(cx * n.getX(a) + cy * n.getY(a) + cz * n.getZ(a), `${file}: a wall wound against its normal`).toBeGreaterThan(0);
          }
        }
      }
      const ridge = Math.max(...data.layers.map((l) => l.ridge));
      // A flat roof's rim stands up to 0.9 m above it.
      expect(top, file).toBeGreaterThanOrEqual(ridge - 0.05);
      expect(top, file).toBeLessThanOrEqual(ridge + 0.95);
      expect(bottom, file).toBeCloseTo(-1, 5);
    }
  });

  it("each stands on the map's ground at its door, in the map's frame about its centre", () => {
    const host = { loading: () => {}, prepare: async () => {}, ready: () => {} };
    for (const entry of MEASURED) {
      const l = new Landmark(entry, host);
      expect(l.measured).toBe(true);
      const [east, north] = entry.placement.door.map as [number, number];
      const [x, z] = l.toModel(east, north);
      expect(x).toBeCloseTo(east - entry.placement.centre[0]!, 6);
      expect(z).toBeCloseTo(entry.placement.centre[1]! - north, 6);
      l.dispose();
    }
  });
});
