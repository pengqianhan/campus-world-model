// Massey's published data (docs/schools/DESIGN.md, section 8): its campuses in the Buildings form,
// from the committed OpenStreetMap snapshots of its areas by the rule in its descriptor, and nothing
// of Massey's own.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { pointInRing, ringArea, type Ring } from "../../../src/shared/geo.ts";
import type { AcademicCalendar, CampusData, Meta, Schedule } from "../../../src/shared/types.ts";
import { HOMES, school } from "../../../src/schools/massey/school.ts";
import { DEFAULT_HEIGHT, decide } from "../../../scripts/lib/osm-buildings.ts";

const read = <T>(file: string): T => JSON.parse(fs.readFileSync(`public/data/massey/${file}`, "utf8")) as T;
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

/** The buildings whose centroid lies outside their walls: Massey University Block 7 in Wellington, whose outline bends. */
const BENT = new Set(["way/25374045"]);

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

describe("Massey's buildings", () => {
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
      // A building's code is its ref, where OpenStreetMap gives one (the Sir Neil Waters Lecture
      // Theatres' SNW); none is made up: every other id names the element.
      expect(b.ref, b.id).toBe(tags.ref);
      expect(b.id).toBe(tags.ref ?? b.osm!.replace("/", "-").toUpperCase());
      expect(b.sourceText, b.id).toBe(tags.name);
      expect(b.name.en, b.id).toBe(tags.name);
      // The centre is the outline's centroid. An L- or U-shaped outline's centroid can lie outside
      // its walls, so the test asks for its bounds there.
      const outline = ring(b.outline[0]!);
      const [xs, ys] = [outline.map((p) => p[0]), outline.map((p) => p[1])];
      const inBounds = b.center[0] >= Math.min(...xs) && b.center[0] <= Math.max(...xs) && b.center[1] >= Math.min(...ys) && b.center[1] <= Math.max(...ys);
      expect(pointInRing(b.center, outline) || (BENT.has(b.osm!) && inBounds), `${b.id}: centre inside its outline`).toBe(true);
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

  it("decide the Manawatū cases as the pull request lists them", () => {
    // The library carries Massey's operator tag; the Registry is amenity=university.
    expect(verdict("way/173556203")?.reason).toMatch(/^operator=Massey University/);
    expect(verdict("way/173556201")?.reason).toMatch(/^amenity=university/);
    // Science Tower A, by building=university with no operator.
    expect(verdict("way/1408726640")?.reason).toMatch(/^building=university/);
    // Found by a name, or by the house name of its address, that says Massey.
    expect(verdict("way/219766061")?.reason).toMatch(/^Its name says Massey/);
    expect(verdict("way/219766134")?.reason).toMatch(/^The house name of its address says Massey/);
    // The halls of residence, the institutes and companies beside the campus and its two childcare
    // centres are not candidates: Moginie Hall, Hopkirk Research Institute, Manaaki Whenua, Fonterra,
    // the Massey Kids' Club and the Turitea Childcare Centre.
    for (const osm of ["way/219766016", "way/219766137", "relation/2865017", "way/219766035", "way/929449791"]) expect(verdict(osm), osm).toBeUndefined();
    expect(on("manawatu")).not.toContain("Massey Kids' Club");
  });

  it("decide the Auckland cases as the pull request lists them", () => {
    // Te Rito by Massey's operator; the Innovation Complex by building=university; the Design School by amenity=university.
    expect(verdict("way/640336667")?.reason).toMatch(/^operator=Massey University/);
    expect(verdict("way/226696411")?.reason).toMatch(/^building=university/);
    expect(verdict("way/71465471")?.reason).toMatch(/^amenity=university/);
    // Found by the place of its address, "Massey University albany".
    expect(verdict("way/420445870")?.reason).toMatch(/^Its address gives Massey University as its place/);
    // Student Central: its fixme tag asks whether it is the new police college, and its record keeps the tag.
    expect(verdict("way/226696407")?.reason).toMatch(/^Its fixme tag asks mappers to check it/);
    expect(campus.buildingExclusions?.find((x) => x.osm === "way/226696407")?.sourceText).toContain("fixme=can someone confirm");
    // The halls carry Massey's operator tag but are homes; the Atrium Building is building=school with no tag that says Massey.
    for (const osm of ["way/640336692", "way/640336695", "relation/15548036", "way/49447606"]) expect(verdict(osm), osm).toBeUndefined();
    // The one building with a ref keeps it as its code.
    expect(campus.buildings.find((b) => b.osm === "way/226696390")?.id).toBe("SNW");
  });

  it("decide the Wellington cases as the pull request lists them", () => {
    expect(on("wellington").sort()).toEqual(
      ["Dominion Museum Building", "K1", "K2", "Massey University Block 7", "Massey University Gym", "Massey University Library", "Te Ara Hihiko", "Te Rau Karamu Marae"].sort(),
    );
    // Wellington High School's and Wellington College's buildings are building=school with no tag that says Massey.
    for (const osm of ["way/221801346", "way/640756261"]) expect(verdict(osm), osm).toBeUndefined();
  });

  it("leave homes and childcare to the surroundings: no home and no centre tagged as childcare is named anywhere in the published data", () => {
    expect([...HOMES].sort()).toEqual([...ACCOMMODATION].sort());
    const published = fs.readdirSync("public/data/massey", { recursive: true, withFileTypes: true }).filter((f) => f.isFile());
    const text = published.map((f) => fs.readFileSync(`${f.parentPath}/${f.name}`, "utf8")).join("\n");
    const blank = [...elements.values()].filter((e) => ACCOMMODATION.includes(e.tags?.building ?? "") || /^(childcare|kindergarten)$/.test(e.tags?.amenity ?? "") || e.tags?.building === "kindergarten");
    // The Manawatū halls and flats, the Auckland campus's halls, and the Massey Kids' Club, at least.
    expect(blank.filter((e) => e.tags?.name).length).toBeGreaterThan(12);
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
      expect(fs.existsSync(`public/data/massey/context/${a.id}.json`), a.id).toBe(true);
      expect(fs.existsSync(`public/data/massey/terrain/${a.id}.json`), a.id).toBe(true);
    }
    expect(fs.existsSync("public/data/massey/context.json")).toBe(true);
    expect(fs.existsSync("public/data/massey/terrain/central.json")).toBe(true);
  });
});

describe("the rule on OpenStreetMap's tags", () => {
  const take = (tags: Record<string, string>) => decide(rule, tags)?.take;

  it("takes a named building by Massey's operator tag, by building=university or amenity=university with no operator, or by a tag that says Massey", () => {
    expect(take({ building: "school", name: "Library", operator: "Massey University / Te Kunenga ki Pūrehuroa" })).toBe(true);
    expect(take({ building: "university", name: "Science Tower A" })).toBe(true);
    expect(take({ building: "school", amenity: "university", name: "Registry" })).toBe(true);
    expect(take({ building: "yes", name: "Massey University Business School" })).toBe(true);
    expect(take({ building: "yes", amenity: "library", name: "Massey University Library" })).toBe(true);
    expect(take({ building: "school", name: "Recreation and Sports Centre", "addr:housename": "Massey Sports and Recreation Centre" })).toBe(true);
    expect(take({ building: "yes", name: "Gym", "addr:city": "Massey University albany" })).toBe(true);
    // A ground floor numbered 0 stands on the ground.
    expect(take({ building: "university", "building:min_level": "0", name: "A building" })).toBe(true);
  });

  it("leaves out what it cannot name, what is in doubt, what does not stand on the ground, and another body's building", () => {
    expect(decide(rule, { building: "university" })?.reason).toMatch(/^No name/);
    expect(decide(rule, { building: "yes", "addr:city": "Massey University albany" })?.reason).toMatch(/^No name/);
    expect(decide(rule, { building: "yes", name: "Student Central", "addr:city": "Massey University albany", fixme: "check" })?.reason).toMatch(/^Its fixme tag/);
    expect(decide(rule, { building: "university", name: "Overbridge", "building:min_level": "2" })?.reason).toMatch(/^It starts above the ground/);
    expect(decide(rule, { building: "university", name: "A bunker", "building:levels": "0" })?.reason).toMatch(/no storey above the ground/);
    expect(decide(rule, { building: "construction", name: "A new building", operator: "Massey University" })?.reason).toMatch(/under construction/);
    expect(take({ building: "university", name: "A bridge", man_made: "bridge" })).toBe(false);
    expect(take({ building: "ruins", name: "A ruin", operator: "Massey University" })).toBe(false);
    expect(decide(rule, { building: "university", name: "A lab", operator: "AgResearch" })?.reason).toMatch(/^Its operator tag names another operator/);
    expect(decide(rule, { building: "yes", name: "Massey Lab", operator: "AgResearch" })?.reason).toMatch(/^Its operator tag names another operator/);
    expect(decide(rule, { "building:part": "yes", operator: "Massey University" })?.reason).toMatch(/^A building part/);
    // Childcare stays blank, even if it were ever tagged as the University's.
    expect(decide(rule, { building: "university", amenity: "childcare", name: "A childcare centre" })?.reason).toMatch(/^A childcare centre/);
    expect(decide(rule, { building: "university", name: "Kids' Club" })?.reason).toMatch(/^A childcare centre, by its name/);
    expect(decide(rule, { building: "kindergarten", name: "A kindergarten", operator: "Massey University" })?.reason).toMatch(/^A kindergarten/);
  });

  it("never considers a home, whatever its tags, nor a childcare centre found only by its name, nor a building that carries none of its tags", () => {
    for (const home of HOMES) expect(decide(rule, { building: home, name: "A home", operator: "Massey University" }), home).toBeUndefined();
    for (const home of HOMES) expect(decide(rule, { building: home, name: "A home", amenity: "university" }), home).toBeUndefined();
    for (const home of HOMES) expect(decide(rule, { building: home, name: "Massey Apartments" }), home).toBeUndefined();
    expect(decide(rule, { building: "yes", amenity: "childcare", name: "Massey Kids' Club" })).toBeUndefined();
    expect(decide(rule, { building: "kindergarten", name: "Massey Kindergarten" })).toBeUndefined();
    expect(decide(rule, { building: "yes", name: "Sir Geoffrey Peren Building" })).toBeUndefined();
    expect(decide(rule, { building: "office", name: "Manaaki Whenua Landcare Research" })).toBeUndefined();
    expect(decide(rule, { building: "yes", amenity: "childcare", name: "A childcare centre" })).toBeUndefined();
  });
});

describe("Massey's absent layers", () => {
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
    expect(fs.existsSync("public/data/massey/plans")).toBe(false);
  });

  it("carry the descriptor's verdicts, and the sources are OpenStreetMap and the terrain only", () => {
    expect(meta.layers).toEqual(school.layers);
    expect(meta.sources.map((s) => s.id)).toEqual(["osm", "terrain"]);
    for (const s of meta.sources) {
      expect(s.snapshotDate, s.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.url, s.id).not.toMatch(/massey\.ac\.nz/);
    }
    expect(meta.coverage).toMatchObject({ buildings: campus.buildings.length, rooms: 0, indexedRooms: 0, subjects: 0, sessions: 0 });
  });
});
