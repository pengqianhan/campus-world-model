// AUT's published data (docs/schools/DESIGN.md, section 8): its City, North and South campuses in
// the Buildings form, from the committed OpenStreetMap snapshots of its three areas by the rule in
// its descriptor, and nothing of AUT's own.
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
/** A building's code: its `ref`, else its whole `name` where that is a code (AY, MA). */
const codeOf = (tags: Record<string, string>) => tags.ref ?? tags.name!;
/** The buildings whose centroid lies outside their walls: AA, AN (North) and MH (South). */
const COURTYARD = new Set(["way/67762413", "way/324441691", "way/835383090"]);
/** AUT's campus letters (its page "Getting around AUT"; docs/schools/aut.md, "Campuses"). */
const LETTER: Record<string, string> = { city: "W", north: "A", south: "M" };

const ring = (flat: number[]): Ring => {
  const r: Ring = [];
  for (let i = 0; i < flat.length; i += 2) r.push([flat[i]! / 10, flat[i + 1]! / 10]);
  return r;
};

describe("AUT's buildings", () => {
  it("are drawn in the frame of the descriptor's origin", () => {
    expect(campus.origin).toEqual(school.origin);
    expect(campus.floorHeight).toBe(3.6);
    expect(campus.campuses.map((c) => c.id)).toEqual(rule.campuses.map((c) => c.id));
    for (const c of campus.campuses) {
      const own = rule.campuses.find((r) => r.id === c.id)!;
      expect(c.name.en, c.id).toBe(own.name);
      expect(c.buildingCount, c.id).toBe(campus.buildings.filter((b) => b.campus === c.id).length);
      expect(c.onMap, c.id).toBe(true);
      // A remote campus names its area, as the University of Auckland's do; the central one none.
      expect(c.area, c.id).toBe(own.area === school.areas.central.id ? undefined : own.area);
    }
  });

  it("each stand on the campus of the area whose snapshot holds it, with its campus's letter", () => {
    for (const b of campus.buildings) {
      const area = areaOf.get(b.osm!)!;
      expect(b.campus, b.id).toBe(rule.campuses.find((c) => c.area === area)!.id);
      expect(b.area, b.id).toBe(area === school.areas.central.id ? undefined : area);
      expect(b.offMap, b.id).toBeUndefined();
      expect(codeOf(elements.get(b.osm!)!.tags ?? {})[0], b.id).toBe(LETTER[b.campus]);
    }
    const codes = (id: string) => campus.buildings.filter((b) => b.campus === id).map((b) => codeOf(elements.get(b.osm!)!.tags ?? {})).sort();
    // North: the 14 coded in ref, less AE (15 separate rings), and AY and AZ by name.
    expect(codes("north")).toEqual(["AA", "AB", "AF", "AG", "AH", "AJ", "AK", "AL", "AM", "AN", "AO", "AP", "AS", "AY", "AZ"]);
    // South: all eight of MazeMap's count, every one by name.
    expect(codes("south")).toEqual(["MA", "MB", "MC", "MD", "ME", "MF", "MG", "MH"]);
  });

  it("leave childcare and homes on the North and South campuses blank", () => {
    for (const b of campus.buildings.filter((x) => x.campus !== "city")) {
      const tags = elements.get(b.osm!)!.tags ?? {};
      expect(tags.amenity ?? "", b.id).not.toMatch(/childcare|kindergarten/);
      expect(tags.building, b.id).not.toMatch(/^(kindergarten|residential|house|apartments|dormitory|detached|terrace)$/);
      expect(JSON.stringify(tags), b.id).not.toMatch(/child|kindy|early learning|student village/i);
    }
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
      // The centre is the outline's centroid. A U- or L-shaped outline's centroid can lie outside
      // its walls, as AA's and AN's on the North Campus and MH's on the South Campus do, so the
      // test asks for its bounds there.
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
      // A building the rule takes is on the campus, unless its outline cannot be drawn as one
      // block: North Campus's AE, a multipolygon of 15 separate rings.
      if (verdict.take) expect(taken.has(osm) || /^Its outline in the snapshot is /.test(excluded.get(osm)?.reason ?? ""), osm).toBe(true);
      else expect(excluded.get(osm)?.reason, osm).toBe(verdict.reason);
    }
    for (const x of campus.buildingExclusions ?? []) {
      expect(x.reason.length, x.osm).toBeGreaterThan(0);
      expect(x.sourceText.length, x.osm).toBeGreaterThan(0);
      expect(taken.has(x.osm), x.osm).toBe(false);
    }
    expect(meta.coverage.buildingsExcluded).toBe(campus.buildingExclusions?.length);
  });

  it("have unique ids: the code, or the code and the element where two share it, or the element where there is no ref", () => {
    const ids = campus.buildings.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of campus.buildings) {
      const [type, id] = b.osm!.split("/");
      if (!b.ref) {
        expect(b.id, b.osm).toBe(`${type!.toUpperCase()}-${id}`);
        continue;
      }
      const shared = campus.buildings.filter((o) => o.ref === b.ref).length > 1;
      expect(b.id, b.osm).toBe(shared ? `${b.ref}-${id}` : b.ref);
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
    // Homes are treated as the hall is: a block of flats with an AUT building code would be taken;
    // the flats at 47 Saint Paul Street carry none, so they stay out for that, and say so.
    expect(decide(rule, { building: "apartments", operator: "AUT" })?.reason).toMatch(/^No building code/);
    expect(take({ building: "apartments", operator: "AUT", ref: "WX" })).toBe(true);
    expect(take({ building: "university", operator: "AUT", man_made: "bridge" })).toBe(false);
    expect(take({ building: "university", operator: "Wilson Parking", ref: "WO" })).toBe(false);
    expect(take({ "building:part": "yes", ref: "WT" })).toBe(false);
    // A part tagged building=no is a part too, whatever step would come later.
    expect(decide(rule, { building: "no", "building:part": "yes", operator: "AUT", ref: "WT" })?.reason).toMatch(/^A building part/);
    // operator=AUT with a code that is not AUT's: left out, and not as "another operator".
    expect(decide(rule, { building: "university", operator: "AUT", ref: "W1" })?.reason).toMatch(/^operator=AUT, but/);
    // Not a candidate: another school's building, or a building with no tag the rule names.
    expect(decide(rule, { building: "university", ref: "303" })).toBeUndefined();
    expect(decide(rule, { building: "yes" })).toBeUndefined();
    // North: a code in ref and no operator, whatever the building tag (AH, AL).
    expect(take({ building: "yes", name: "AH Building", ref: "AH" })).toBe(true);
    expect(take({ amenity: "library", building: "civic", name: "AL", ref: "AL" })).toBe(true);
    // North and South: no ref, and a whole name that is a code (AZ, MA, MF).
    expect(take({ building: "yes", "building:levels": "4", name: "AZ" })).toBe(true);
    expect(take({ building: "university", name: "MA" })).toBe(true);
    expect(take({ building: "yes", name: "MF" })).toBe(true);
    // A name that only starts with a code, or a code of no AUT campus, is not one.
    expect(decide(rule, { building: "university", name: "Safety and Security" })).toBeUndefined();
    expect(decide(rule, { building: "yes", name: "BP", operator: "BP" })).toBeUndefined();
    expect(decide(rule, { building: "college", name: "NZMA Manukau Campus" })).toBeUndefined();
    expect(decide(rule, { building: "yes", name: "MA Building 2" })).toBeUndefined();
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
