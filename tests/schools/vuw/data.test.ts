// VUW's published data (docs/schools/DESIGN.md, section 8): its Kelburn Campus in the Buildings
// form, from the committed OpenStreetMap snapshot by the rule in its descriptor, and nothing of
// VUW's own.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { pointInRing, ringArea, type Ring } from "../../../src/shared/geo.ts";
import type { AcademicCalendar, CampusData, Meta, Schedule } from "../../../src/shared/types.ts";
import { school } from "../../../src/schools/vuw/school.ts";
import { DEFAULT_HEIGHT, decide } from "../../../scripts/lib/osm-buildings.ts";

const read = <T>(file: string): T => JSON.parse(fs.readFileSync(`public/data/vuw/${file}`, "utf8")) as T;
const campus = read<CampusData>("campus.json");
const meta = read<Meta>("meta.json");
const rule = school.osmBuildings!;

interface Element {
  type: string;
  id: number;
  tags?: Record<string, string>;
}
const snapshot = JSON.parse(fs.readFileSync(`data/raw/${school.areas.central.osm}`, "utf8")) as { elements: Element[] };
const elements = new Map(snapshot.elements.map((e) => [`${e.type}/${e.id}`, e]));

const ring = (flat: number[]): Ring => {
  const r: Ring = [];
  for (let i = 0; i < flat.length; i += 2) r.push([flat[i]! / 10, flat[i + 1]! / 10]);
  return r;
};

describe("VUW's buildings", () => {
  it("are drawn in the frame of the descriptor's origin, all on the map", () => {
    expect(campus.origin).toEqual(school.origin);
    expect(campus.floorHeight).toBe(3.6);
    expect(campus.campuses.map((c) => c.id)).toEqual([rule.campus.id]);
    expect(campus.campuses[0]!.buildingCount).toBe(campus.buildings.length);
    expect(campus.buildings.filter((b) => b.offMap).map((b) => b.id)).toEqual([]);
  });

  it("each trace to an element of the committed snapshot that the rule takes, named as OpenStreetMap names it", () => {
    expect(campus.buildings.length).toBeGreaterThan(0);
    for (const b of campus.buildings) {
      const e = elements.get(b.osm!);
      expect(e, `${b.id}: ${b.osm}`).toBeDefined();
      const tags = e!.tags ?? {};
      expect(decide(rule, tags)?.take, b.id).toBe(true);
      // OpenStreetMap gives none of them a building code, so none is made up: the id names the element.
      expect(b.ref, b.id).toBeUndefined();
      expect(b.id).toBe(b.osm!.replace("/", "-").toUpperCase());
      expect(b.sourceText, b.id).toBe(tags.name);
      expect(b.name.en, b.id).toBe(tags.name);
      // The centre is the outline's centroid. A U-shaped outline's centroid lies in its courtyard,
      // as the Central Services Building's (way/116816414) does, so the test asks for its bounds.
      const outline = ring(b.outline[0]!);
      const inside = pointInRing(b.center, outline);
      const [xs, ys] = [outline.map((p) => p[0]), outline.map((p) => p[1])];
      const inBounds = b.center[0] >= Math.min(...xs) && b.center[0] <= Math.max(...xs) && b.center[1] >= Math.min(...ys) && b.center[1] <= Math.max(...ys);
      expect(inside || (b.osm === "way/116816414" && inBounds), `${b.id}: centre inside its outline`).toBe(true);
    }
  });

  it("take every element the rule takes, and exclude every other candidate with its reason", () => {
    const taken = new Set(campus.buildings.map((b) => b.osm));
    const excluded = new Map((campus.buildingExclusions ?? []).map((x) => [x.osm, x]));
    for (const [osm, e] of elements) {
      const verdict = decide(rule, e.tags ?? {});
      if (!verdict) {
        expect(taken.has(osm) || excluded.has(osm), osm).toBe(false);
        continue;
      }
      if (verdict.take) expect(taken.has(osm), osm).toBe(true);
      else expect(excluded.get(osm)?.reason, osm).toBe(verdict.reason);
    }
    for (const x of campus.buildingExclusions ?? []) {
      expect(x.reason.length, x.osm).toBeGreaterThan(0);
      expect(x.sourceText.length, x.osm).toBeGreaterThan(0);
      expect(taken.has(x.osm), x.osm).toBe(false);
    }
    expect(meta.coverage.buildingsExcluded).toBe(campus.buildingExclusions?.length);
  });

  it("leave homes and childcare to the surroundings, with no name anywhere in the published data", () => {
    const published = fs.readdirSync("public/data/vuw", { recursive: true, withFileTypes: true }).filter((f) => f.isFile());
    const text = published.map((f) => fs.readFileSync(`${f.parentPath}/${f.name}`, "utf8")).join("\n");
    const blank = [...elements.values()].filter((e) => /^(dormitory|residential|house|apartments)$/.test(e.tags?.building ?? "") || /^(childcare|kindergarten)$/.test(e.tags?.amenity ?? ""));
    expect(blank.length).toBeGreaterThan(0);
    for (const e of blank) {
      expect(decide(rule, e.tags ?? {}), `${e.type}/${e.id}`).toBeUndefined();
      if (e.tags?.name) expect(text, e.tags.name).not.toContain(e.tags.name);
    }
  });

  it("stand at the height the rule gives, with its source, and have no floors or rooms", () => {
    for (const b of campus.buildings) {
      const tags = elements.get(b.osm!)!.tags ?? {};
      if (tags.height) expect(b.heightSource, b.id).toBe("osm-height");
      else if (tags["building:levels"]) {
        expect(b.heightSource, b.id).toBe("osm-levels");
        expect(b.height, b.id).toBeCloseTo(Number(tags["building:levels"]) * campus.floorHeight, 1);
      } else {
        expect(b.heightSource, b.id).toBe("estimated");
        const large = ringArea(ring(b.outline[0]!)) > DEFAULT_HEIGHT.largeFrom;
        expect(b.height, b.id).toBe(large ? DEFAULT_HEIGHT.large : DEFAULT_HEIGHT.small);
      }
      expect(b.floors, b.id).toEqual([]);
      expect(b.roomCount, b.id).toBe(0);
    }
    expect(campus.rooms).toEqual([]);
  });
});

describe("the rule on OpenStreetMap's tags", () => {
  const take = (tags: Record<string, string>) => decide(rule, tags)?.take;

  it("takes a named building by VUW's operator tag, or by building=university with no operator", () => {
    expect(take({ building: "university", name: "Rankine Brown", operator: "Victoria University of Wellington" })).toBe(true);
    expect(take({ building: "university", name: "Hunter Building" })).toBe(true);
    // The operator tag alone makes a candidate, whatever the building tag says.
    expect(take({ building: "yes", name: "A hall", operator: "Victoria University of Wellington" })).toBe(true);
  });

  it("leaves out what it cannot name or that does not stand on the ground as VUW's", () => {
    expect(decide(rule, { building: "university" })?.reason).toMatch(/^No name/);
    expect(decide(rule, { building: "university", name: "Overbridge", "building:min_level": "2", operator: "Victoria University of Wellington" })?.reason).toMatch(/^It starts above the ground/);
    expect(take({ building: "university", name: "A bridge", man_made: "bridge" })).toBe(false);
    expect(take({ building: "ruins", name: "A ruin", operator: "Victoria University of Wellington" })).toBe(false);
    expect(decide(rule, { building: "university", name: "Victoria Rescue NZ-RT7", operator: "National Emergency Management Agency" })?.reason).toMatch(/^Its operator tag names another operator/);
    expect(decide(rule, { "building:part": "yes", operator: "Victoria University of Wellington" })?.reason).toMatch(/^A building part/);
    // Childcare stays blank, even if it were ever tagged as the University's.
    expect(decide(rule, { building: "university", amenity: "childcare", name: "A childcare centre" })?.reason).toMatch(/^A childcare centre/);
  });

  it("does not consider buildings that carry neither tag", () => {
    expect(decide(rule, { building: "school", name: "Old Kirk Building" })).toBeUndefined();
    expect(decide(rule, { building: "dormitory", name: "A hall of residence" })).toBeUndefined();
    expect(decide(rule, { building: "yes", amenity: "childcare", name: "A childcare centre" })).toBeUndefined();
  });
});

describe("VUW's absent layers", () => {
  it("are written empty, never left out", () => {
    const calendar = read<AcademicCalendar>("calendar.json");
    expect(calendar.available).toBe(false);
    expect(calendar.holidays).toEqual([]);
    expect(calendar.terms).toEqual([]);
    const schedule = read<Schedule>("schedule.json");
    expect(schedule.available).toBe(false);
    expect([schedule.terms, schedule.courses, schedule.sessions, schedule.exclusions]).toEqual([[], [], [], []]);
    expect(read<unknown[]>("subjects.json")).toEqual([]);
    expect(read<object>("rooms-index.json")).toEqual({});
    expect(fs.existsSync("public/data/vuw/plans")).toBe(false);
  });

  it("carry the descriptor's verdicts, and the sources are OpenStreetMap and the terrain only", () => {
    expect(meta.layers).toEqual(school.layers);
    expect(meta.sources.map((s) => s.id)).toEqual(["osm", "terrain"]);
    for (const s of meta.sources) {
      expect(s.snapshotDate, s.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.url, s.id).not.toMatch(/wgtn\.ac\.nz|vuw\.ac\.nz|victoria\.ac\.nz/);
    }
    expect(meta.coverage).toMatchObject({ buildings: campus.buildings.length, rooms: 0, indexedRooms: 0, subjects: 0, sessions: 0 });
  });
});
