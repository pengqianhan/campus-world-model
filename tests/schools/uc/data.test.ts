// UC's published data (docs/schools/DESIGN.md, section 8): its campuses in the Buildings form, from
// the committed OpenStreetMap snapshots of its areas by the rule in its descriptor, and nothing of
// UC's own.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { pointInRing, ringArea, type Ring } from "../../../src/shared/geo.ts";
import type { AcademicCalendar, CampusData, Meta, Schedule } from "../../../src/shared/types.ts";
import { HOMES, school } from "../../../src/schools/uc/school.ts";
import { DEFAULT_HEIGHT, decide } from "../../../scripts/lib/osm-buildings.ts";

const read = <T>(file: string): T => JSON.parse(fs.readFileSync(`public/data/uc/${file}`, "utf8")) as T;
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
/** The buildings whose centroid lies outside their walls: Te Whare Akonga o Te Akatoki (Ilam) and Ōtākaro (Dovedale). */
const COURTYARD = new Set(["way/135622394", "way/822082267"]);

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

describe("UC's buildings", () => {
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
      // its walls, as Te Whare Akonga o Te Akatoki's and Ōtākaro's do, so the test asks for its
      // bounds there.
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

  it("decide Ilam's cases as the pull request lists them", () => {
    const verdict = (osm: string) => decide(rule, elements.get(osm)!.tags ?? {});
    // Ernest Rutherford is tagged building:min_level=0, the ground floor: it stands on the ground.
    expect(verdict("way/1473488762")?.take).toBe(true);
    // The Music Bunker has no storey above the ground (building:levels=0).
    expect(verdict("way/824450838")?.reason).toMatch(/^OpenStreetMap gives it no storey above the ground/);
    // Takurua and another building of UC's are still being built.
    expect(verdict("way/1430475446")?.reason).toMatch(/under construction/);
    expect(verdict("way/1430475447")?.reason).toMatch(/under construction/);
    // UC's three bicycle sheds carry its operator and no name.
    for (const shed of ["way/810897651", "way/993164576", "way/993164583"]) expect(verdict(shed)?.reason, shed).toMatch(/^No name/);
    // Alice Candy is tagged building=school, with no operator: OpenStreetMap does not trace it to UC.
    expect(verdict("way/993761498")).toBeUndefined();
  });

  it("decide the Dovedale and Arts Centre cases as the pull request lists them", () => {
    const verdict = (osm: string) => decide(rule, elements.get(osm)!.tags ?? {});
    const on = (id: string) => campus.buildings.filter((b) => b.campus === id).map((b) => b.name.en).sort();
    expect(on("dovedale")).toEqual(["Collective Cafe", "Henry Field", "Jack Mann", "Kōawa", "Kōtuku", "Ōrakipaoa", "Ōtākaro", "Ōtākaro Annex", "Waimairi", "Wairakei", "Whekī"].sort());
    // At the Arts Centre only the Chemistry Building, named Music & Classics, is tagged as UC's.
    expect(on("arts-centre")).toEqual(["Music & Classics"]);
    expect(verdict("way/32050466")?.reason).toMatch(/^operator=University of Canterbury/);
    // The University of Otago's building there names Otago as its operator.
    expect(verdict("way/101079305")?.reason).toMatch(/^Its operator tag names another operator/);
    // A language school on the Dovedale campus, with its own operator and building=yes, is not a candidate.
    expect(verdict("way/101220671")).toBeUndefined();
    // Every building taken by building=university with no operator stands at Ilam or Dovedale, not
    // in the Arts Centre's box, where the University of Otago has buildings too.
    for (const b of campus.buildings) {
      const tags = elements.get(b.osm!)!.tags ?? {};
      if (!tags.operator) expect(b.campus, b.id).not.toBe("arts-centre");
    }
  });

  it("leave homes and childcare to the surroundings, with no name anywhere in the published data", () => {
    expect([...HOMES].sort()).toEqual([...ACCOMMODATION].sort());
    const published = fs.readdirSync("public/data/uc", { recursive: true, withFileTypes: true }).filter((f) => f.isFile());
    const text = published.map((f) => fs.readFileSync(`${f.parentPath}/${f.name}`, "utf8")).join("\n");
    const blank = [...elements.values()].filter((e) => ACCOMMODATION.includes(e.tags?.building ?? "") || /^(childcare|kindergarten)$/.test(e.tags?.amenity ?? "") || e.tags?.building === "kindergarten");
    // Ilam's halls of residence and its early learning centre, at least.
    expect(blank.filter((e) => e.tags?.name).length).toBeGreaterThan(40);
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const e of blank) {
      expect(decide(rule, e.tags ?? {}), `${e.type}/${e.id}`).toBeUndefined();
      // The name as a whole value, a JSON string or a tag in an exclusion's text: the hall wing
      // "Popper" is not the building "Karl Popper", nor "Home" "Ilam Homestead".
      const name = e.tags?.name;
      if (!name) continue;
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
      expect(fs.existsSync(`public/data/uc/context/${a.id}.json`), a.id).toBe(true);
      expect(fs.existsSync(`public/data/uc/terrain/${a.id}.json`), a.id).toBe(true);
    }
    expect(fs.existsSync("public/data/uc/context.json")).toBe(true);
    expect(fs.existsSync("public/data/uc/terrain/central.json")).toBe(true);
  });
});

describe("the rule on OpenStreetMap's tags", () => {
  const take = (tags: Record<string, string>) => decide(rule, tags)?.take;

  it("takes a named building by UC's operator tag, or by building=university with no operator", () => {
    expect(take({ building: "university", name: "West", operator: "University of Canterbury" })).toBe(true);
    expect(take({ building: "university", name: "Jack Erskine" })).toBe(true);
    // The operator tag alone makes a candidate, whatever the building tag says (the Recreation Centre).
    expect(take({ building: "yes", name: "Recreation Centre", operator: "University of Canterbury" })).toBe(true);
    // A ground floor numbered 0 stands on the ground.
    expect(take({ building: "university", "building:min_level": "0", name: "Ernest Rutherford", operator: "University of Canterbury" })).toBe(true);
  });

  it("leaves out what it cannot name or that does not stand on the ground as UC's", () => {
    expect(decide(rule, { building: "university" })?.reason).toMatch(/^No name/);
    expect(decide(rule, { building: "university", name: "Overbridge", "building:min_level": "2" })?.reason).toMatch(/^It starts above the ground/);
    expect(decide(rule, { building: "university", name: "A bunker", "building:levels": "0", "building:levels:underground": "1" })?.reason).toMatch(/no storey above the ground/);
    expect(decide(rule, { building: "construction", name: "Takurua", operator: "University of Canterbury" })?.reason).toMatch(/under construction/);
    expect(take({ building: "university", name: "A bridge", man_made: "bridge" })).toBe(false);
    expect(take({ building: "ruins", name: "A ruin", operator: "University of Canterbury" })).toBe(false);
    expect(decide(rule, { building: "university", name: "A shop", operator: "Somebody Else" })?.reason).toMatch(/^Its operator tag names another operator/);
    expect(decide(rule, { "building:part": "yes", operator: "University of Canterbury" })?.reason).toMatch(/^A building part/);
    // Childcare stays blank, even if it were ever tagged as the University's.
    expect(decide(rule, { building: "university", amenity: "childcare", name: "A childcare centre" })?.reason).toMatch(/^A childcare centre/);
  });

  it("never considers a home, whatever its operator, nor a building that carries neither tag", () => {
    for (const home of HOMES) expect(decide(rule, { building: home, name: "A home", operator: "University of Canterbury" }), home).toBeUndefined();
    expect(decide(rule, { building: "school", name: "Alice Candy" })).toBeUndefined();
    expect(decide(rule, { building: "yes", amenity: "doctors", name: "UC Health Centre" })).toBeUndefined();
    expect(decide(rule, { building: "yes", amenity: "childcare", name: "A childcare centre" })).toBeUndefined();
  });
});

describe("UC's absent layers", () => {
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
    expect(fs.existsSync("public/data/uc/plans")).toBe(false);
  });

  it("carry the descriptor's verdicts, and the sources are OpenStreetMap and the terrain only", () => {
    expect(meta.layers).toEqual(school.layers);
    expect(meta.sources.map((s) => s.id)).toEqual(["osm", "terrain"]);
    for (const s of meta.sources) {
      expect(s.snapshotDate, s.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.url, s.id).not.toMatch(/canterbury\.ac\.nz/);
    }
    expect(meta.coverage).toMatchObject({ buildings: campus.buildings.length, rooms: 0, indexedRooms: 0, subjects: 0, sessions: 0 });
  });
});
