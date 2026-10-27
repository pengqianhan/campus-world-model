// Otago's published data (docs/schools/DESIGN.md, section 8): its campuses in the Buildings form,
// from the committed OpenStreetMap snapshots of its areas by the rule in its descriptor, and nothing
// of Otago's own.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { pointInRing, ringArea, type Ring } from "../../../src/shared/geo.ts";
import type { AcademicCalendar, CampusData, Meta, Schedule } from "../../../src/shared/types.ts";
import { HOMES, school } from "../../../src/schools/otago/school.ts";
import { DEFAULT_HEIGHT, decide } from "../../../scripts/lib/osm-buildings.ts";

const read = <T>(file: string): T => JSON.parse(fs.readFileSync(`public/data/otago/${file}`, "utf8")) as T;
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
/** The buildings whose centroid lies outside their walls: the Owheo Building, whose outline bends round a yard. */
const COURTYARD = new Set(["way/532844359"]);

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

describe("Otago's buildings", () => {
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
      // OpenStreetMap gives none of them a building code, so none is made up: the id names the element.
      expect(b.ref, b.id).toBeUndefined();
      expect(b.id).toBe(b.osm!.replace("/", "-").toUpperCase());
      expect(b.sourceText, b.id).toBe(tags.name);
      expect(b.name.en, b.id).toBe(tags.name);
      // The centre is the outline's centroid. An L- or U-shaped outline's centroid can lie outside
      // its walls, so the test asks for its bounds there.
      const outline = ring(b.outline[0]!);
      const [xs, ys] = [outline.map((p) => p[0]), outline.map((p) => p[1])];
      const inBounds = b.center[0] >= Math.min(...xs) && b.center[0] <= Math.max(...xs) && b.center[1] >= Math.min(...ys) && b.center[1] <= Math.max(...ys);
      expect(pointInRing(b.center, outline) || (COURTYARD.has(b.osm!) && inBounds), `${b.id}: centre inside its outline`).toBe(true);
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

  it("decide Dunedin's cases as the pull request lists them", () => {
    const verdict = (osm: string) => decide(rule, elements.get(osm)!.tags ?? {});
    // The two that carry Otago's operator tag: Student Health (amenity=doctors) and the Hocken Collections (amenity=library).
    expect(verdict("way/123661265")?.reason).toMatch(/^operator=University of Otago/);
    expect(verdict("way/159925411")?.reason).toMatch(/^operator=University of Otago/);
    // The Clocktower Building, by building=university with no operator.
    expect(verdict("way/125694343")?.take).toBe(true);
    // Otago Polytechnic names itself as the operator of its blocks.
    for (const block of ["way/125697277", "way/123661268", "way/123661263", "way/502795856", "way/123661269", "way/236976933", "way/381844712", "way/925023394", "way/381845850", "way/500843229", "way/1495968534"])
      expect(verdict(block)?.reason, block).toMatch(/^Its operator tag names another operator/);
    // Its I Block holds a childcare centre, by its description: that reason comes first.
    expect(verdict("way/983387961")?.reason).toMatch(/childcare centre, by its description/);
    // B Block carries no operator but is named in the Polytechnic's lettered series; Poho stands between its A and B Blocks.
    expect(verdict("way/381857677")?.reason).toMatch(/^Named as one of Otago Polytechnic's lettered blocks/);
    expect(verdict("way/236976992")?.reason).toMatch(/^No tag says whose it is/);
    // The students' association's two buildings.
    expect(verdict("way/103620364")?.reason).toMatch(/Otago University Students' Association/);
    expect(verdict("way/123661267")?.reason).toMatch(/Otago University Students' Association/);
    // A building=university named Childcare Centre, with no amenity tag.
    expect(verdict("way/1536828869")?.reason).toMatch(/^A childcare centre, by its name/);
    // The museum and the book shop are building=yes with no operator: not candidates.
    expect(verdict("way/159929111")).toBeUndefined();
    expect(verdict("way/125694344")).toBeUndefined();
  });

  it("decide the Christchurch cases as the pull request lists them", () => {
    const verdict = (osm: string) => decide(rule, elements.get(osm)!.tags ?? {});
    const on = (id: string) => campus.buildings.filter((b) => b.campus === id).map((b) => b.name.en).sort();
    expect(on("christchurch")).toEqual(["Terrace House", "University of Otago - Wai Ora Building", "University of Otago, Department of General Practice"].sort());
    // The School of Medicine on the hospital's grounds is tagged amenity=university, building=hospital and a
    // wikidata item, with no operator: it waits for a person to check the item, and its record keeps the tag.
    expect(verdict("way/27167079")?.reason).toMatch(/^A hospital building.*wikidata tag names an item that was not looked up/);
    expect(campus.buildingExclusions?.find((x) => x.osm === "way/27167079")?.sourceText).toContain("wikidata=Q7896032");
    // The health board's outpatients' building and UC's Music & Classics are not candidates.
    expect(verdict("way/459668365")).toBeUndefined();
    expect(verdict("way/32050466")).toBeUndefined();
    // Every building taken in Christchurch says in its own tags that it is Otago's: its operator or its name.
    for (const b of campus.buildings.filter((x) => x.campus === "christchurch")) {
      const tags = elements.get(b.osm!)!.tags ?? {};
      expect(tags.operator === "University of Otago" || /^University of Otago\b/.test(tags.name ?? ""), b.id).toBe(true);
    }
  });

  it("leave homes and childcare to the surroundings: no home and no centre tagged as childcare is named anywhere in the published data", () => {
    expect([...HOMES].sort()).toEqual([...ACCOMMODATION].sort());
    const published = fs.readdirSync("public/data/otago", { recursive: true, withFileTypes: true }).filter((f) => f.isFile());
    const text = published.map((f) => fs.readFileSync(`${f.parentPath}/${f.name}`, "utf8")).join("\n");
    const blank = [...elements.values()].filter((e) => ACCOMMODATION.includes(e.tags?.building ?? "") || /^(childcare|kindergarten)$/.test(e.tags?.amenity ?? "") || e.tags?.building === "kindergarten");
    // North Dunedin's named flats and the residential colleges, at least.
    expect(blank.filter((e) => e.tags?.name).length).toBeGreaterThan(40);
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // A dormitory 420 m north of the Richardson Building carries the same name (way/493742022): the
    // name the site shows is the University building's, and the dormitory is not published.
    const takenNames = new Set(campus.buildings.map((b) => b.name.en));
    expect(takenNames.has("Richardson Building")).toBe(true);
    expect(text).not.toContain("493742022");
    for (const e of blank) {
      expect(decide(rule, e.tags ?? {}), `${e.type}/${e.id}`).toBeUndefined();
      // The name as a whole value, a JSON string or a tag in an exclusion's text.
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
      expect(fs.existsSync(`public/data/otago/context/${a.id}.json`), a.id).toBe(true);
      expect(fs.existsSync(`public/data/otago/terrain/${a.id}.json`), a.id).toBe(true);
    }
    expect(fs.existsSync("public/data/otago/context.json")).toBe(true);
    expect(fs.existsSync("public/data/otago/terrain/central.json")).toBe(true);
  });
});

describe("the rule on OpenStreetMap's tags", () => {
  const take = (tags: Record<string, string>) => decide(rule, tags)?.take;

  it("takes a named building by Otago's operator tag, or by building=university with no operator", () => {
    expect(take({ building: "university", name: "Hocken Collections", operator: "University of Otago" })).toBe(true);
    expect(take({ building: "university", name: "Richardson Building" })).toBe(true);
    // The operator tag alone makes a candidate, whatever the building tag says.
    expect(take({ building: "yes", name: "A store", operator: "University of Otago" })).toBe(true);
    // A ground floor numbered 0 stands on the ground.
    expect(take({ building: "university", "building:min_level": "0", name: "A building", operator: "University of Otago" })).toBe(true);
    // A hospital's building carrying Otago's operator tag says in its own tags that it is Otago's.
    expect(take({ building: "hospital", name: "A clinic", operator: "University of Otago" })).toBe(true);
  });

  it("leaves out what it cannot name, what does not stand on the ground, and another body's building", () => {
    expect(decide(rule, { building: "university" })?.reason).toMatch(/^No name/);
    expect(decide(rule, { building: "university", name: "Overbridge", "building:min_level": "2" })?.reason).toMatch(/^It starts above the ground/);
    expect(decide(rule, { building: "university", name: "A bunker", "building:levels": "0" })?.reason).toMatch(/no storey above the ground/);
    expect(decide(rule, { building: "construction", name: "A new building", operator: "University of Otago" })?.reason).toMatch(/under construction/);
    expect(take({ building: "university", name: "A bridge", man_made: "bridge" })).toBe(false);
    expect(take({ building: "ruins", name: "A ruin", operator: "University of Otago" })).toBe(false);
    expect(decide(rule, { building: "university", name: "A Block", operator: "Otago Polytechnic" })?.reason).toMatch(/^Its operator tag names another operator/);
    expect(decide(rule, { "building:part": "yes", operator: "University of Otago" })?.reason).toMatch(/^A building part/);
    expect(decide(rule, { building: "hospital", amenity: "university", name: "School of Medicine" })?.reason).toMatch(/^A hospital building/);
    // Childcare stays blank, even if it were ever tagged as the University's.
    expect(decide(rule, { building: "university", amenity: "childcare", name: "A childcare centre" })?.reason).toMatch(/^A childcare centre/);
    expect(decide(rule, { building: "university", name: "Childcare Centre", operator: "University of Otago" })?.reason).toMatch(/^A childcare centre, by its name/);
  });

  it("never considers a home, whatever its operator, nor a building that carries none of its tags", () => {
    for (const home of HOMES) expect(decide(rule, { building: home, name: "A home", operator: "University of Otago" }), home).toBeUndefined();
    for (const home of HOMES) expect(decide(rule, { building: home, name: "A home", amenity: "university" }), home).toBeUndefined();
    expect(decide(rule, { building: "yes", name: "Tūhura Otago Museum" })).toBeUndefined();
    expect(decide(rule, { building: "hospital", name: "Christchurch Outpatients", operator: "Canterbury District Health Board" })).toBeUndefined();
    expect(decide(rule, { building: "yes", amenity: "childcare", name: "A childcare centre" })).toBeUndefined();
  });
});

describe("Otago's absent layers", () => {
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
    expect(fs.existsSync("public/data/otago/plans")).toBe(false);
  });

  it("carry the descriptor's verdicts, and the sources are OpenStreetMap and the terrain only", () => {
    expect(meta.layers).toEqual(school.layers);
    expect(meta.sources.map((s) => s.id)).toEqual(["osm", "terrain"]);
    for (const s of meta.sources) {
      expect(s.snapshotDate, s.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.url, s.id).not.toMatch(/otago\.ac\.nz/);
    }
    expect(meta.coverage).toMatchObject({ buildings: campus.buildings.length, rooms: 0, indexedRooms: 0, subjects: 0, sessions: 0 });
  });
});
