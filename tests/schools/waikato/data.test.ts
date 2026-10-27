// The University of Waikato's published data (docs/schools/DESIGN.md, section 8): its campuses in
// the Buildings form, from the committed OpenStreetMap snapshots of its areas by the rule in its
// descriptor, and nothing of Waikato's own.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { pointInRing, ringArea, type Ring } from "../../../src/shared/geo.ts";
import type { AcademicCalendar, CampusData, Meta, Schedule } from "../../../src/shared/types.ts";
import { HOMES, school } from "../../../src/schools/waikato/school.ts";
import { DEFAULT_HEIGHT, decide } from "../../../scripts/lib/osm-buildings.ts";

const read = <T>(file: string): T => JSON.parse(fs.readFileSync(`public/data/waikato/${file}`, "utf8")) as T;
const campus = read<CampusData>("campus.json");
const meta = read<Meta>("meta.json");
const rule = school.osmBuildings!;

interface Element {
  type: string;
  id: number;
  tags?: Record<string, string>;
}
/** Every element of the areas' snapshots, with the area whose snapshot holds it. */
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

/**
 * OpenStreetMap's "Accommodation" values of `building` (https://wiki.openstreetmap.org/wiki/Key:building),
 * kept here apart from the descriptor's list, so that taking a value out of HOMES fails a test.
 */
const ACCOMMODATION = ["apartments", "barracks", "bungalow", "cabin", "detached", "annexe", "dormitory", "farm", "ger", "hotel", "house",
  "houseboat", "residential", "semidetached_house", "static_caravan", "stilt_house", "terrace", "tree_house", "trullo"];

const ring = (flat: number[]): Ring => {
  const r: Ring = [];
  for (let i = 0; i < flat.length; i += 2) r.push([flat[i]! / 10, flat[i + 1]! / 10]);
  return r;
};

const verdict = (osm: string) => decide(rule, elements.get(osm)!.tags ?? {});
const on = (id: string) => campus.buildings.filter((b) => b.campus === id).map((b) => b.name.en);

describe("Waikato's buildings", () => {
  it("are drawn in the frame of the descriptor's origin, all on the map, one campus for each area", () => {
    expect(campus.origin).toEqual(school.origin);
    expect(campus.floorHeight).toBe(3.6);
    expect(campus.campuses.map((c) => c.id)).toEqual(rule.campuses.map((c) => c.id));
    expect(rule.campuses.map((c) => c.area)).toEqual(areas.map((a) => a.id));
    for (const c of campus.campuses) {
      const own = rule.campuses.find((r) => r.id === c.id)!;
      expect(c.name.en, c.id).toBe(own.name);
      expect(c.buildingCount, c.id).toBe(campus.buildings.filter((b) => b.campus === c.id).length);
      expect(c.buildingCount, c.id).toBeGreaterThan(0);
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
  });

  it("each trace to an element of the committed snapshots that the rule takes, named as OpenStreetMap names it", () => {
    expect(campus.buildings.length).toBeGreaterThan(0);
    for (const b of campus.buildings) {
      const e = elements.get(b.osm!);
      expect(e, `${b.id}: ${b.osm}`).toBeDefined();
      const tags = e!.tags ?? {};
      expect(decide(rule, tags)?.take, b.id).toBe(true);
      // OpenStreetMap gives none of them a code (ref), and none is made up: each id names the element.
      expect(b.ref, b.id).toBe(tags.ref);
      expect(b.id).toBe(tags.ref ?? b.osm!.replace("/", "-").toUpperCase());
      expect(b.sourceText, b.id).toBe(tags.name);
      expect(b.name.en, b.id).toBe(tags.name);
      expect(pointInRing(b.center, ring(b.outline[0]!)), `${b.id}: centre inside its outline`).toBe(true);
    }
  });

  it("take every element the rule takes, and exclude every other candidate with its reason", () => {
    const taken = new Set(campus.buildings.map((b) => b.osm));
    const excluded = new Map((campus.buildingExclusions ?? []).map((x) => [x.osm, x]));
    for (const [osm, e] of elements) {
      const v = decide(rule, e.tags ?? {});
      if (!v) {
        expect(taken.has(osm) || excluded.has(osm), osm).toBe(false);
        continue;
      }
      if (v.take) expect(taken.has(osm), osm).toBe(true);
      else expect(excluded.get(osm)?.reason, osm).toBe(v.reason);
    }
    for (const x of campus.buildingExclusions ?? []) {
      expect(x.reason.length, x.osm).toBeGreaterThan(0);
      expect(x.sourceText.length, x.osm).toBeGreaterThan(0);
      expect(taken.has(x.osm), x.osm).toBe(false);
    }
    expect(meta.coverage.buildingsExcluded).toBe(campus.buildingExclusions?.length);
  });

  it("decide the Hamilton cases as the pull request lists them", () => {
    // The Gallagher Academy of Performing Arts carries Waikato's operator tag and a name.
    expect(verdict("way/66211908")?.reason).toMatch(/^operator=University of Waikato/);
    expect(on("hamilton")).toEqual(["Gallagher Academy of Performing Arts"]);
    // A bicycle shed with Waikato's operator tag has no name; the medical school's site is named a construction site.
    expect(verdict("way/1078686300")?.reason).toMatch(/^No name/);
    expect(verdict("way/1447813529")?.reason).toMatch(/^Its name calls it a construction site/);
    // Not candidates: the Orchard Park Apartments (a home, with Waikato's operator tag); J Block and the
    // Student Centre, which carry a name and no tag that says whose they are; NIWA's building; Hillcrest
    // High School's library (building=school); and Hillcrest Childcare (amenity=kindergarten).
    for (const osm of ["relation/17882437", "way/66210760", "relation/19815926", "relation/2389691", "way/179066961", "way/245271389"]) {
      expect(verdict(osm), osm).toBeUndefined();
    }
  });

  it("leave homes and childcare to the surroundings: no home and no centre tagged as childcare is named anywhere in the published data", () => {
    expect([...HOMES].sort()).toEqual([...ACCOMMODATION].sort());
    const published = fs.readdirSync("public/data/waikato", { recursive: true, withFileTypes: true }).filter((f) => f.isFile());
    const text = published.map((f) => fs.readFileSync(`${f.parentPath}/${f.name}`, "utf8")).join("\n");
    const blank = [...elements.values()].filter((e) => ACCOMMODATION.includes(e.tags?.building ?? "") || /^(childcare|kindergarten)$/.test(e.tags?.amenity ?? "") || e.tags?.building === "kindergarten");
    // The Orchard Park Apartments and Hillcrest Childcare, at least.
    expect(blank.filter((e) => e.tags?.name).length).toBeGreaterThan(1);
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const takenNames = new Set(campus.buildings.map((b) => b.name.en));
    for (const e of blank) {
      expect(decide(rule, e.tags ?? {}), `${e.type}/${e.id}`).toBeUndefined();
      const name = e.tags?.name;
      if (!name || takenNames.has(name)) continue;
      expect(text, name).not.toContain(JSON.stringify(name));
      expect(text, name).not.toMatch(new RegExp(`name=${escape(name)}(;|"|$)`));
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

  it("have the surroundings and the ground of each area", () => {
    for (const a of school.areas.remote) {
      expect(fs.existsSync(`public/data/waikato/context/${a.id}.json`), a.id).toBe(true);
      expect(fs.existsSync(`public/data/waikato/terrain/${a.id}.json`), a.id).toBe(true);
    }
    expect(fs.existsSync("public/data/waikato/context.json")).toBe(true);
    expect(fs.existsSync("public/data/waikato/terrain/central.json")).toBe(true);
  });
});

describe("the rule on OpenStreetMap's tags", () => {
  const take = (tags: Record<string, string>) => decide(rule, tags)?.take;

  it("takes a named building by Waikato's operator tag, or by building=university or amenity=university with no operator", () => {
    expect(take({ building: "yes", amenity: "theatre", name: "Gallagher Academy of Performing Arts", operator: "University of Waikato" })).toBe(true);
    expect(take({ building: "university", name: "A lecture block" })).toBe(true);
    expect(take({ building: "school", amenity: "university", name: "A teaching block" })).toBe(true);
    // A ground floor numbered 0 stands on the ground.
    expect(take({ building: "university", "building:min_level": "0", name: "A building" })).toBe(true);
  });

  it("leaves out what it cannot name, what is in doubt or not built, what does not stand on the ground, and another body's building", () => {
    expect(decide(rule, { building: "university" })?.reason).toMatch(/^No name/);
    expect(decide(rule, { building: "yes", amenity: "bicycle_parking", operator: "University of Waikato" })?.reason).toMatch(/^No name/);
    expect(decide(rule, { building: "university", name: "A medical school construction site" })?.reason).toMatch(/^Its name calls it a construction site/);
    expect(decide(rule, { building: "university", name: "A block", fixme: "check" })?.reason).toMatch(/^Its fixme tag/);
    expect(decide(rule, { building: "university", name: "Overbridge", "building:min_level": "2" })?.reason).toMatch(/^It starts above the ground/);
    expect(decide(rule, { building: "university", name: "A bunker", "building:levels": "0" })?.reason).toMatch(/no storey above the ground/);
    expect(decide(rule, { building: "construction", name: "A new building", operator: "University of Waikato" })?.reason).toMatch(/under construction/);
    expect(take({ building: "university", name: "A bridge", man_made: "bridge" })).toBe(false);
    expect(take({ building: "ruins", name: "A ruin", operator: "University of Waikato" })).toBe(false);
    expect(decide(rule, { building: "university", name: "A polytechnic block", operator: "Wintec" })?.reason).toMatch(/^Its operator tag names another operator/);
    expect(decide(rule, { building: "university", name: "A shared block", operator: "Toi Ohomai Institute of Technology" })?.reason).toMatch(/^Its operator tag names another operator/);
    expect(decide(rule, { "building:part": "yes", operator: "University of Waikato" })?.reason).toMatch(/^A building part/);
    // Childcare stays blank, even if it were ever tagged as the University's.
    expect(decide(rule, { building: "university", amenity: "childcare", name: "A childcare centre" })?.reason).toMatch(/^A childcare centre/);
    expect(decide(rule, { building: "university", name: "Kids' Club" })?.reason).toMatch(/^A childcare centre, by its name/);
    expect(decide(rule, { building: "kindergarten", name: "A kindergarten", operator: "University of Waikato" })?.reason).toMatch(/^A kindergarten/);
  });

  it("never considers a home, whatever its tags, nor a building that carries none of its tags", () => {
    for (const home of HOMES) expect(decide(rule, { building: home, name: "A home", operator: "University of Waikato" }), home).toBeUndefined();
    for (const home of HOMES) expect(decide(rule, { building: home, name: "A home", amenity: "university" }), home).toBeUndefined();
    expect(decide(rule, { building: "yes", name: "J Block" })).toBeUndefined();
    expect(decide(rule, { building: "yes", name: "Waikato Management School/PWC" })).toBeUndefined();
    expect(decide(rule, { building: "yes", amenity: "kindergarten", name: "A childcare centre" })).toBeUndefined();
  });
});

describe("Waikato's absent layers", () => {
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
    expect(fs.existsSync("public/data/waikato/plans")).toBe(false);
  });

  it("carry the descriptor's verdicts, and the sources are OpenStreetMap and the terrain only", () => {
    expect(meta.layers).toEqual(school.layers);
    expect(meta.sources.map((s) => s.id)).toEqual(["osm", "terrain"]);
    for (const s of meta.sources) {
      expect(s.snapshotDate, s.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.url, s.id).not.toMatch(/waikato\.ac\.nz/);
    }
    expect(meta.coverage).toMatchObject({ buildings: campus.buildings.length, rooms: 0, indexedRooms: 0, subjects: 0, sessions: 0 });
  });
});
