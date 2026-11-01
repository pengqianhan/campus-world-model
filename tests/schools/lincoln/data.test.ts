// Lincoln University's published data (docs/schools/DESIGN.md, section 8): its campus in the
// Buildings form, from the committed OpenStreetMap snapshot of its area by the rule in its
// descriptor, and nothing of Lincoln University's own.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { pointInRing, ringArea, type Ring } from "../../../src/shared/geo.ts";
import type { AcademicCalendar, CampusData, Meta, Schedule } from "../../../src/shared/types.ts";
import { HOMES, school } from "../../../src/schools/lincoln/school.ts";
import { DEFAULT_HEIGHT, decide } from "../../../scripts/lib/osm-buildings.ts";

const read = <T>(file: string): T => JSON.parse(fs.readFileSync(`public/data/lincoln/${file}`, "utf8")) as T;
const campus = read<CampusData>("campus.json");
const meta = read<Meta>("meta.json");
const rule = school.osmBuildings!;

interface Element {
  type: string;
  id: number;
  tags?: Record<string, string>;
}
/** Every element of the area's snapshot. */
const elements = new Map<string, Element>();
for (const e of (JSON.parse(fs.readFileSync(`data/raw/${school.areas.central.osm}`, "utf8")) as { elements: Element[] }).elements) {
  elements.set(`${e.type}/${e.id}`, e);
}

/**
 * OpenStreetMap's "Accommodation" values of `building` (https://wiki.openstreetmap.org/wiki/Key:building),
 * kept here apart from the descriptor's list, so that taking a value out of HOMES fails a test.
 */
const ACCOMMODATION = ["apartments", "barracks", "bungalow", "cabin", "detached", "annexe", "dormitory", "farm", "ger", "hotel", "house",
  "houseboat", "residential", "semidetached_house", "static_caravan", "stilt_house", "terrace", "tree_house", "trullo"];

/**
 * The halls of residence on the campus, by the names OpenStreetMap gives them (docs/schools/lincoln.md,
 * "On the site"). They carry building=yes and neither of the rule's tags.
 */
const HALLS = ["Centennial Hall", "Colombo Hall", "Lowry Hall", "Southland Hall", "Stevens Hall"];

const ring = (flat: number[]): Ring => {
  const r: Ring = [];
  for (let i = 0; i < flat.length; i += 2) r.push([flat[i]! / 10, flat[i + 1]! / 10]);
  return r;
};

describe("Lincoln University's buildings", () => {
  it("are drawn in the frame of the descriptor's origin, all on the map, on the one campus", () => {
    expect(campus.origin).toEqual(school.origin);
    expect(campus.floorHeight).toBe(3.6);
    expect(school.areas.remote).toEqual([]);
    expect(campus.campuses.map((c) => c.id)).toEqual(["lincoln"]);
    const [c] = campus.campuses;
    expect(c!.name.en).toBe("Lincoln campus");
    expect(c!.buildingCount).toBe(campus.buildings.length);
    expect(c!.onMap).toBe(true);
    expect(c!.area).toBeUndefined();
    for (const b of campus.buildings) {
      expect(b.campus, b.id).toBe("lincoln");
      expect(b.area, b.id).toBeUndefined();
    }
    expect(campus.buildings.filter((b) => b.offMap).map((b) => b.id)).toEqual([]);
  });

  it("each trace to an element of the committed snapshot that the rule takes, named as OpenStreetMap names it", () => {
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
      expect(b.nameSource, b.id).toBeUndefined();
      expect(pointInRing(b.center, ring(b.outline[0]!)), `${b.id}: centre inside its outline`).toBe(true);
    }
  });

  it("are the eight buildings the pull request lists, each by a tag that says it is the University's", () => {
    expect(campus.buildings.map((b) => b.name.en).sort()).toEqual(
      ["Forbes Building", "Hudson Hall", "Ivey Hall", "James Stewart Building", "Landscape Architecture Building", "Recreation Centre", "The Poplars",
        "Young Farmers Club Hall"].sort(),
    );
    // Every one is taken by the operator tag or by building=university: the two tags About, the
    // source line, the changelog and the README name.
    for (const b of campus.buildings) {
      const tags = elements.get(b.osm!)!.tags ?? {};
      expect(tags.operator === "Lincoln University" || tags.building === "university", b.id).toBe(true);
      expect(decide(rule, tags)!.reason, b.id).toMatch(/^(operator=Lincoln University|building=university)/);
    }
    expect(rule.campusMap).toBeUndefined();
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

  it("decide the Lincoln cases as the pull request lists them", () => {
    const verdict = (osm: string) => decide(rule, elements.get(osm)!.tags ?? {});
    const out = (osm: string) => campus.buildingExclusions?.find((x) => x.osm === osm);
    // The Recreation Centre carries the University's operator; Ivey Hall building=university alone.
    expect(verdict("way/218953880")?.reason).toMatch(/^operator=Lincoln University/);
    expect(verdict("way/193053945")?.reason).toMatch(/^building=university with no operator tag/);
    // Memorial Hall is mapped as disused, and its record keeps its note.
    expect(verdict("way/193053946")?.reason).toMatch(/^OpenStreetMap maps it as disused/);
    expect(out("way/193053946")?.sourceText).toContain("note=closed following post-earthquake damage and assessment");
    // AgResearch is another body's name; its record keeps its description.
    expect(verdict("way/1175305051")?.reason).toMatch(/^Its name, AgResearch, is the name of another body/);
    expect(out("way/1175305051")?.sourceText).toContain("description=Science building, replaced the earthquake-damaged Hilgendorf Wing");
    // Two building=university outlines and the bicycle shed, which carries the University's operator, have no name.
    for (const osm of ["way/218959834", "way/218959958", "way/1426114966"]) expect(verdict(osm)?.reason, osm).toMatch(/^No name/);
    expect(campus.buildingExclusions?.map((x) => x.osm)).toEqual(["way/193053946", "way/218959834", "way/218959958", "way/1175305051", "way/1426114966"]);
    // The Commerce Building and the Bioeconomy Science Institute's buildings carry neither tag: not candidates.
    const named = (name: string) => [...elements.values()].filter((e) => e.tags?.name === name);
    expect(named("Commerce Building").length).toBeGreaterThan(0);
    for (const e of named("Commerce Building")) expect(decide(rule, e.tags ?? {})).toBeUndefined();
    const institute = [...elements.values()].filter((e) => e.tags?.operator === "Bioeconomy Science Institute Maiangi Taiao" && e.tags?.building);
    expect(institute.length).toBe(73);
    for (const e of institute) expect(decide(rule, e.tags ?? {}), `${e.type}/${e.id}`).toBeUndefined();
  });

  it("leave homes, halls of residence and childcare to the surroundings, with no name anywhere in the published data", () => {
    expect([...HOMES].sort()).toEqual([...ACCOMMODATION].sort());
    const published = fs.readdirSync("public/data/lincoln", { recursive: true, withFileTypes: true }).filter((f) => f.isFile());
    const text = published.map((f) => fs.readFileSync(`${f.parentPath}/${f.name}`, "utf8")).join("\n");
    const blank = [...elements.values()].filter(
      (e) =>
        ACCOMMODATION.includes(e.tags?.building ?? "") ||
        /^(childcare|kindergarten)$/.test(e.tags?.amenity ?? "") ||
        e.tags?.building === "kindergarten" ||
        HALLS.includes(e.tags?.name ?? ""),
    );
    expect(blank.filter((e) => HALLS.includes(e.tags?.name ?? "")).length).toBe(16);
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const e of blank) {
      expect(decide(rule, e.tags ?? {}), `${e.type}/${e.id}`).toBeUndefined();
      const name = e.tags?.name;
      if (!name) continue;
      expect(text, name).not.toContain(JSON.stringify(name));
      expect(text, name).not.toMatch(new RegExp(`name=${escape(name)}(;|"|$)`));
    }
  });

  it("publish no name of a building the rule does not consider", () => {
    const published = fs.readdirSync("public/data/lincoln", { recursive: true, withFileTypes: true }).filter((f) => f.isFile());
    const text = published.map((f) => fs.readFileSync(`${f.parentPath}/${f.name}`, "utf8")).join("\n");
    const shown = new Set(campus.buildings.map((b) => b.name.en));
    for (const e of elements.values()) {
      const tags = e.tags ?? {};
      if (!tags.building || !tags.name || decide(rule, tags) || shown.has(tags.name)) continue;
      expect(text, tags.name).not.toContain(JSON.stringify(tags.name));
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
    // About's words: three from their levels, five at a default.
    expect(campus.buildings.filter((b) => b.heightSource === "osm-levels").length).toBe(3);
    expect(campus.buildings.filter((b) => b.heightSource === "estimated").length).toBe(5);
    expect(campus.rooms).toEqual([]);
  });

  it("have the surroundings and the ground of the area", () => {
    expect(fs.existsSync("public/data/lincoln/context.json")).toBe(true);
    expect(fs.existsSync("public/data/lincoln/terrain/central.json")).toBe(true);
    expect(fs.existsSync("public/data/lincoln/context")).toBe(false);
  });
});

describe("the rule on OpenStreetMap's tags", () => {
  const take = (tags: Record<string, string>) => decide(rule, tags)?.take;

  it("takes a named building by the University's operator tag, or by building=university with no operator", () => {
    expect(take({ building: "university", name: "Recreation Centre", operator: "Lincoln University" })).toBe(true);
    expect(take({ building: "university", name: "Forbes Building" })).toBe(true);
    // The operator tag alone makes a candidate, whatever the building tag says.
    expect(take({ building: "yes", name: "A hall", operator: "Lincoln University" })).toBe(true);
    // A ground floor numbered 0 stands on the ground.
    expect(take({ building: "university", "building:min_level": "0", name: "A building" })).toBe(true);
  });

  it("leaves out what it cannot name, what is disused or not built, what does not stand on the ground, and another body's building", () => {
    expect(decide(rule, { building: "university" })?.reason).toMatch(/^No name/);
    expect(decide(rule, { building: "university", name: "A hall", disused: "yes" })?.reason).toMatch(/^OpenStreetMap maps it as disused/);
    expect(decide(rule, { building: "university", name: "A hall", disused: "yes", note: "closed" })?.reason).toMatch(/Its note tag, kept in this record/);
    expect(decide(rule, { building: "university", name: "AgResearch" })?.reason).toMatch(/^Its name, AgResearch/);
    expect(decide(rule, { building: "university", name: "Overbridge", "building:min_level": "2" })?.reason).toMatch(/^It starts above the ground/);
    expect(decide(rule, { building: "university", name: "A bunker", "building:levels": "0" })?.reason).toMatch(/no storey above the ground/);
    expect(decide(rule, { building: "construction", name: "A new building", operator: "Lincoln University" })?.reason).toMatch(/under construction/);
    expect(take({ building: "university", name: "A bridge", man_made: "bridge" })).toBe(false);
    expect(take({ building: "ruins", name: "A ruin", operator: "Lincoln University" })).toBe(false);
    expect(decide(rule, { building: "university", name: "A lab", fixme: "check" })?.reason).toMatch(/^Its fixme tag/);
    expect(decide(rule, { building: "university", name: "A lab", operator: "Somebody Else" })?.reason).toMatch(/^Its operator tag names another operator/);
    expect(decide(rule, { "building:part": "yes", operator: "Lincoln University" })?.reason).toMatch(/^A building part/);
    // Childcare stays blank, even if it were ever tagged as the University's.
    expect(decide(rule, { building: "university", amenity: "childcare", name: "A childcare centre" })?.reason).toMatch(/^A childcare centre/);
    expect(decide(rule, { building: "university", name: "Early Childhood Centre" })?.reason).toMatch(/^A childcare centre, by its name/);
  });

  it("never considers a home, whatever its operator, nor a building that carries neither tag", () => {
    for (const home of HOMES) expect(decide(rule, { building: home, name: "A home", operator: "Lincoln University" }), home).toBeUndefined();
    expect(decide(rule, { building: "yes", name: "Colombo Hall" })).toBeUndefined();
    expect(decide(rule, { building: "yes", name: "Commerce Building" })).toBeUndefined();
    expect(decide(rule, { building: "yes", amenity: "childcare", name: "A childcare centre" })).toBeUndefined();
  });
});

describe("Lincoln University's absent layers", () => {
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
    expect(fs.existsSync("public/data/lincoln/plans")).toBe(false);
  });

  it("carry the descriptor's verdicts, and the sources are OpenStreetMap and the terrain only", () => {
    expect(meta.layers).toEqual(school.layers);
    for (const v of Object.values(school.layers ?? {})) expect(["usable", "needs-permission"]).toContain(v);
    expect(meta.sources.map((s) => s.id)).toEqual(["osm", "terrain"]);
    for (const s of meta.sources) {
      expect(s.snapshotDate, s.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.url, s.id).not.toMatch(/lincoln\.ac\.nz/);
    }
    expect(meta.coverage).toMatchObject({ buildings: 8, buildingsOnMap: 8, buildingsExcluded: 5, rooms: 0, indexedRooms: 0, subjects: 0, sessions: 0 });
  });
});
