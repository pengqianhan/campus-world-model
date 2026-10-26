// AUT's published data (docs/schools/DESIGN.md, section 8): its City Campus in the Buildings form,
// from the committed OpenStreetMap snapshot by the rule in its descriptor, and nothing of AUT's own.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { pointInRing, ringArea, type Ring } from "../../../src/shared/geo.ts";
import type { AcademicCalendar, CampusData, Meta, Schedule } from "../../../src/shared/types.ts";
import { school } from "../../../src/schools/aut/school.ts";
import { DEFAULT_HEIGHT, decide, osmHeight, tagsMatch } from "../../../scripts/lib/osm-buildings.ts";

const read = <T>(file: string): T => JSON.parse(fs.readFileSync(`public/data/aut/${file}`, "utf8")) as T;
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

describe("AUT's buildings", () => {
  it("are drawn in the frame of the descriptor's origin", () => {
    expect(campus.origin).toEqual(school.origin);
    expect(campus.floorHeight).toBe(3.6);
    expect(campus.campuses.map((c) => c.id)).toEqual([rule.campus.id]);
    expect(campus.campuses[0]!.buildingCount).toBe(campus.buildings.length);
  });

  it("each trace to an element of the committed snapshot that the rule takes", () => {
    expect(campus.buildings.length).toBeGreaterThan(0);
    for (const b of campus.buildings) {
      const e = elements.get(b.osm!);
      expect(e, `${b.id}: ${b.osm}`).toBeDefined();
      const tags = e!.tags ?? {};
      expect(decide(rule, tags)?.take, b.id).toBe(true);
      expect(b.ref, b.id).toBe(tags.ref);
      expect(b.sourceText, b.id).toBe(tags.name ?? tags.ref);
      expect(b.name.en, b.id).toBe(b.sourceText);
      expect(pointInRing(b.center, ring(b.outline[0]!)), `${b.id}: centre inside its outline`).toBe(true);
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

  it("have unique ids: the code, or the code and the element where two share it", () => {
    const ids = campus.buildings.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of campus.buildings) {
      const shared = campus.buildings.filter((o) => o.ref === b.ref).length > 1;
      expect(b.id, b.osm).toBe(shared ? `${b.ref}-${b.osm!.split("/")[1]}` : b.ref);
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
        expect([DEFAULT_HEIGHT.small, DEFAULT_HEIGHT.large], b.id).toContain(b.height);
      }
      expect(b.floors, b.id).toEqual([]);
      expect(b.roomCount, b.id).toBe(0);
    }
    expect(campus.rooms).toEqual([]);
  });
});

describe("the rule on OpenStreetMap's tags", () => {
  it("reads a tag given as null as absent", () => {
    expect(tagsMatch({ operator: null }, { building: "university" })).toBe(true);
    expect(tagsMatch({ operator: null }, { operator: "AUT" })).toBe(false);
    expect(tagsMatch({ operator: /^AUT$/ }, {})).toBe(false);
  });

  it("decides the cases the design named (DESIGN.md, Measurements and risk 8)", () => {
    const take = (tags: Record<string, string>) => decide(rule, tags)?.take;
    expect(take({ building: "university", operator: "AUT", ref: "WG" })).toBe(true);
    // A building code and no operator: WY.
    expect(take({ building: "university", ref: "WY" })).toBe(true);
    // A hall of residence with a building code stays a building; it has no floors to blank.
    expect(take({ building: "dormitory", operator: "AUT", ref: "WQ" })).toBe(true);
    expect(take({ building: "ruins", operator: "AUT", ref: "WW" })).toBe(false);
    expect(take({ building: "apartments", operator: "AUT" })).toBe(false);
    expect(take({ building: "university", operator: "AUT", man_made: "bridge" })).toBe(false);
    expect(take({ building: "university", operator: "Wilson Parking", ref: "WO" })).toBe(false);
    expect(take({ "building:part": "yes", ref: "WT" })).toBe(false);
    // Not a candidate: another school's building, or a building with no tag the rule names.
    expect(decide(rule, { building: "university", ref: "303" })).toBeUndefined();
    expect(decide(rule, { building: "yes" })).toBeUndefined();
  });

  it("gives heights from height, then levels, then the surroundings' default", () => {
    expect(osmHeight({ height: "55.8", "building:levels": "17" }, 100)).toEqual({ height: 55.8, heightSource: "osm-height" });
    expect(osmHeight({ "building:levels": "6" }, 100)).toEqual({ height: 21.6, heightSource: "osm-levels" });
    expect(osmHeight({ height: "0" }, 1000)).toEqual({ height: 10, heightSource: "estimated" });
    expect(osmHeight({}, 900)).toEqual({ height: 6.5, heightSource: "estimated" });
  });
});

describe("AUT's absent layers", () => {
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
    expect(fs.existsSync("public/data/aut/plans")).toBe(false);
  });

  it("carry the descriptor's verdicts, and the sources are OpenStreetMap and the terrain only", () => {
    expect(meta.layers).toEqual(school.layers);
    expect(meta.sources.map((s) => s.id)).toEqual(["osm", "terrain"]);
    for (const s of meta.sources) {
      expect(s.snapshotDate, s.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.url, s.id).not.toMatch(/aut\.ac\.nz|mazemap/);
    }
    expect(meta.coverage).toMatchObject({ buildings: campus.buildings.length, rooms: 0, indexedRooms: 0, subjects: 0, sessions: 0 });
  });

  it("leave the buildings at the defaults' areas they were measured on", () => {
    // The defaults depend on the outline's area as published, so a change of simplification shows here.
    for (const b of campus.buildings.filter((x) => x.heightSource === "estimated")) {
      const large = ringArea(ring(b.outline[0]!)) > DEFAULT_HEIGHT.largeFrom;
      expect(b.height, b.id).toBe(large ? DEFAULT_HEIGHT.large : DEFAULT_HEIGHT.small);
    }
  });
});
