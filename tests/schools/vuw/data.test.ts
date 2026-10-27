// VUW's published data (docs/schools/DESIGN.md, section 8): its Kelburn, Pipitea and Te Aro
// campuses in the Buildings form, from the committed OpenStreetMap snapshots of its three areas by
// the rule in its descriptor, and nothing of VUW's own.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { pointInRing, ringArea, type Ring } from "../../../src/shared/geo.ts";
import type { AcademicCalendar, CampusData, Meta, Schedule } from "../../../src/shared/types.ts";
import { HOMES, school } from "../../../src/schools/vuw/school.ts";
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
/** Every element of the three areas' snapshots, with the area whose snapshot holds it. */
const areas = [school.areas.central, ...school.areas.remote];
const elements = new Map<string, Element>();
const areaOf = new Map<string, string>();
for (const area of areas) {
  const snapshot = JSON.parse(fs.readFileSync(`data/raw/${area.osm}`, "utf8")) as { elements: Element[] };
  for (const e of snapshot.elements) {
    const osm = `${e.type}/${e.id}`;
    if (elements.has(osm)) continue;
    elements.set(osm, e);
    areaOf.set(osm, area.id);
  }
}

/** OpenStreetMap's building values for a place people live or stay in (its "Accommodation" types), as the test reads them. */
const ACCOMMODATION = ["apartments", "barracks", "bungalow", "cabin", "detached", "annexe", "dormitory", "farm", "ger", "hotel", "house",
  "houseboat", "residential", "semidetached_house", "static_caravan", "stilt_house", "terrace", "tree_house", "trullo"];
/** Places where people live, and childcare: OpenStreetMap's tags for them. */
const isBlank = (tags: Record<string, string>) => ACCOMMODATION.includes(tags.building ?? "") || /^(childcare|kindergarten)$/.test(tags.amenity ?? "");

const ring = (flat: number[]): Ring => {
  const r: Ring = [];
  for (let i = 0; i < flat.length; i += 2) r.push([flat[i]! / 10, flat[i + 1]! / 10]);
  return r;
};

describe("VUW's buildings", () => {
  it("are drawn in the frame of the descriptor's origin, all on the map, each campus with its own", () => {
    expect(campus.origin).toEqual(school.origin);
    expect(campus.floorHeight).toBe(3.6);
    expect(campus.campuses.map((c) => c.id)).toEqual(rule.campuses.map((c) => c.id));
    for (const c of campus.campuses) {
      const own = rule.campuses.find((r) => r.id === c.id)!;
      expect(c.name.en, c.id).toBe(own.name);
      expect(c.buildingCount, c.id).toBe(campus.buildings.filter((b) => b.campus === c.id).length);
      expect(c.onMap, c.id).toBe(true);
      // A remote campus names its area, as the other schools' do; the central one none.
      expect(c.area, c.id).toBe(own.area === school.areas.central.id ? undefined : own.area);
    }
    expect(campus.buildings.filter((b) => b.offMap).map((b) => b.id)).toEqual([]);
  });

  it("each stand on the campus of the area whose snapshot holds it", () => {
    for (const b of campus.buildings) {
      const area = areaOf.get(b.osm!)!;
      expect(b.campus, b.id).toBe(rule.campuses.find((c) => c.area === area)!.id);
      expect(b.area, b.id).toBe(area === school.areas.central.id ? undefined : area);
    }
    const names = (id: string) => campus.buildings.filter((b) => b.campus === id).map((b) => b.name.en).sort();
    expect(names("kelburn")).toHaveLength(52);
    // Pipitea: Government Buildings and Rutherford House (docs/schools/vuw.md, "Campuses"), each
    // holding points of VUW's own Pipitea page, and the Law School's lecture theatres beside them.
    expect(names("pipitea")).toEqual(["Law School Lecture Theatres", "Old Government Buildings", "Rutherford House"]);
    // Te Aro: 139 Vivian Street, which holds the page's "Te Aro Campus" and "Library" points.
    expect(names("te-aro")).toEqual(["Faculty of Architecture & Design"]);
  });

  it("each trace to an element of the committed snapshots that the rule takes, named as OpenStreetMap names it", () => {
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
    const blank = [...elements.entries()].filter(([, e]) => isBlank(e.tags ?? {}));
    expect(blank.length).toBeGreaterThan(0);
    for (const [osm, e] of blank) {
      expect(decide(rule, e.tags ?? {}), osm).toBeUndefined();
      expect(text, osm).not.toContain(osm);
      if (e.tags?.name) expect(text, e.tags.name).not.toContain(e.tags.name);
    }
    // Te Aro's box holds two homes that carry VUW's operator tag, a hall of residence and a block
    // of flats: a home is never a candidate, whatever its operator.
    for (const osm of ["way/256790623", "way/1082249353"]) {
      const tags = elements.get(osm)!.tags ?? {};
      expect(tags.operator, osm).toBe("Victoria University of Wellington");
      expect(isBlank(tags), osm).toBe(true);
    }
  });

  it("leave out the Te Aro buildings vuw.md names that OpenStreetMap does not tag as VUW's", () => {
    // Te Auaha (65 Dixon Street), operated by Whitireia, WelTec and Te Pūkenga by its tags, and NEC
    // House (40 Taranaki Street), an office building: neither is a candidate, so both stay in the
    // surroundings. Wigan Street's building is building=university with no name, so it is left out.
    expect(elements.get("way/430288873")?.tags?.name).toBe("Te Auaha");
    expect(elements.get("way/190554680")?.tags?.name).toBe("NEC House");
    for (const osm of ["way/430288873", "way/190554680"]) expect(decide(rule, elements.get(osm)!.tags ?? {}), osm).toBeUndefined();
    expect(campus.buildingExclusions?.find((x) => x.osm === "way/752299347")?.reason).toMatch(/^No name/);
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
    // The operator tag alone makes a candidate, whatever the building tag says, unless it is a home.
    expect(take({ building: "yes", name: "A lecture block", operator: "Victoria University of Wellington" })).toBe(true);
  });

  it("leaves out what it cannot name or that does not stand on the ground as VUW's", () => {
    expect(decide(rule, { building: "university" })?.reason).toMatch(/^No name/);
    expect(decide(rule, { building: "university", name: "Overbridge", "building:min_level": "2", operator: "Victoria University of Wellington" })?.reason).toMatch(/^It starts above the ground/);
    expect(take({ building: "university", name: "A bridge", man_made: "bridge" })).toBe(false);
    expect(take({ building: "ruins", name: "A ruin", operator: "Victoria University of Wellington" })).toBe(false);
    expect(decide(rule, { building: "university", name: "Victoria Rescue NZ-RT7", operator: "National Emergency Management Agency" })?.reason).toMatch(/^Its operator tag names another operator/);
    expect(decide(rule, { "building:part": "yes", operator: "Victoria University of Wellington" })?.reason).toMatch(/^A building part/);
    expect(decide(rule, { building: "no", "building:part": "yes", operator: "Victoria University of Wellington" })?.reason).toMatch(/^A building part/);
    // Childcare stays blank, even if it were ever tagged as the University's.
    expect(decide(rule, { building: "university", amenity: "childcare", name: "A childcare centre" })?.reason).toMatch(/^A childcare centre/);
  });

  it("does not consider homes, whatever their operator, or buildings that carry neither tag", () => {
    expect([...HOMES].sort()).toEqual([...ACCOMMODATION].sort());
    for (const building of ACCOMMODATION) {
      expect(decide(rule, { building, name: "A home", operator: "Victoria University of Wellington" }), building).toBeUndefined();
    }
    expect(decide(rule, { building: "school", name: "Old Kirk Building" })).toBeUndefined();
    expect(decide(rule, { building: "dormitory", name: "A hall of residence" })).toBeUndefined();
    expect(decide(rule, { building: "yes", amenity: "childcare", name: "A childcare centre" })).toBeUndefined();
    expect(decide(rule, { building: "yes", amenity: "arts_centre", name: "Te Auaha", operator: "Whitireia/Weltec/Te Pūkenga" })).toBeUndefined();
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

  it("give each remote campus its own surroundings and ground", () => {
    for (const area of school.areas.remote) {
      expect(fs.existsSync(`public/data/vuw/context/${area.id}.json`), area.id).toBe(true);
      expect(fs.existsSync(`public/data/vuw/terrain/${area.id}.json`), area.id).toBe(true);
    }
  });
});
