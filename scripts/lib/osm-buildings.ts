// The osm-buildings campus adapter (docs/schools/DESIGN.md, section 4), shared by every school in
// the Buildings form: a school whose campus map cannot be used takes its buildings from
// OpenStreetMap alone ("One source for a University building" in PROGRESS.md). The school's
// descriptor holds the rule, written in OpenStreetMap's tags (`osmBuildings`). Each building gets
// its name or `ref`, its outline, a height by the rule below with `heightSource`, and `osm`, the
// element it comes from. It gets no floors and no rooms. Every candidate the rule leaves out goes
// to `buildingExclusions` with the reason of the step that left it out.
import { cleanRing, encodeRing, pointInRing, ringArea, ringCentroid, simplifyRing, type Ring } from "../../src/shared/geo.ts";
import type { OsmBuildingRule, TagTest } from "../../src/shared/school.ts";
import type { Building, BuildingExclusion, CampusData, FloorPlans, RoomIndex } from "../../src/shared/types.ts";
import { outerRings, type OsmElement } from "./context.ts";
import { inBox, placeOnMap, type MapFrame } from "./map-frame.ts";
import { readSnapshot } from "./snapshot.ts";

/**
 * Metres per storey: `campus.floorHeight`, the storey the windows are drawn at. A building with
 * `building:levels` stands that many storeys high, so it shows as many storeys as it has levels
 * ("Building height" in PROGRESS.md, "Decisions", as amended by the design).
 */
export const FLOOR_HEIGHT = 3.6;
/** The defaults of the surrounding buildings with no height or levels (buildContext): 10 m over 900 m², else 6.5 m. */
export const DEFAULT_HEIGHT = { small: 6.5, large: 10, largeFrom: 900 };
/** Outline simplification, metres, as buildContext simplifies the same outlines. */
const SIMPLIFY = 0.5;

const round1 = (n: number) => Math.round(n * 10) / 10;

/** A tagged number; zero or less is a mapping slip and counts as missing. */
function positive(s: string | undefined): number | undefined {
  const n = parseFloat(s ?? "");
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Whether a tag test holds for these tags. */
export function tagsMatch(test: TagTest, tags: Readonly<Record<string, string>>): boolean {
  return Object.entries(test).every(([key, pattern]) => (pattern === null ? tags[key] === undefined : tags[key] !== undefined && pattern.test(tags[key])));
}

/** The height of a building from its tags: `height`, else `building:levels` storeys, else the surroundings' default. */
export function osmHeight(tags: Readonly<Record<string, string>>, area: number): Pick<Building, "height" | "heightSource"> {
  const tagged = positive(tags.height);
  if (tagged !== undefined) return { height: round1(tagged), heightSource: "osm-height" };
  const levels = positive(tags["building:levels"]);
  if (levels !== undefined) return { height: round1(levels * FLOOR_HEIGHT), heightSource: "osm-levels" };
  return { height: area > DEFAULT_HEIGHT.largeFrom ? DEFAULT_HEIGHT.large : DEFAULT_HEIGHT.small, heightSource: "estimated" };
}

/** Every key the rule reads, with the element's name: the original text an exclusion keeps. */
function ruleKeys(rule: OsmBuildingRule): string[] {
  const keys = new Set(["building", "building:part", "name"]);
  for (const test of [...rule.candidates, ...rule.steps.map((s) => s.when)]) for (const k of Object.keys(test)) keys.add(k);
  return [...keys].sort();
}

const tagText = (tags: Readonly<Record<string, string>>, keys: readonly string[]) =>
  keys
    .filter((k) => tags[k] !== undefined)
    .map((k) => `${k}=${tags[k]}`)
    .join("; ");

/** The rule's verdict on one element: undefined when it is not a candidate. */
export function decide(rule: OsmBuildingRule, tags: Readonly<Record<string, string>>): { take: boolean; reason: string; step: number } | undefined {
  const building = tags.building !== undefined && tags.building !== "no";
  const part = tags["building:part"] !== undefined && tags["building:part"] !== "no";
  if (!building && !part) return undefined;
  if (!rule.candidates.some((test) => tagsMatch(test, tags))) return undefined;
  const step = rule.steps.findIndex((s) => tagsMatch(s.when, tags));
  if (step < 0) return { take: false, reason: "No step of the school's rule takes it.", step };
  return { take: rule.steps[step]!.take, reason: rule.steps[step]!.reason, step };
}

/** The outline of an element: its outer ring, and any inner rings inside it as holes. */
function outlineOf(e: OsmElement, project: MapFrame["project"]): Ring[] | undefined {
  const outer = outerRings(e, project);
  if (outer.length !== 1) return undefined;
  const ring = simplifyRing(outer[0]!, SIMPLIFY);
  const holes: Ring[] = [];
  for (const m of e.type === "relation" ? (e.members ?? []) : []) {
    if (m.type !== "way" || m.role !== "inner" || !m.geometry || m.geometry.length < 4) continue;
    const hole = cleanRing(m.geometry.map((n) => project(n.lon, n.lat)));
    if (hole.length >= 3 && pointInRing(ringCentroid(hole), ring)) holes.push(simplifyRing(hole, SIMPLIFY));
  }
  return [ring, ...holes];
}

/**
 * The campus of a school in the Buildings form, from the OpenStreetMap snapshot of each area of its
 * map (`frame.boxes`: the central one and every remote one whose snapshot has been taken). A
 * building belongs to the campus of the area it stands in: the area its centre lies in, else the
 * area whose snapshot holds it. An element in two snapshots is read once, from the first.
 */
export function buildOsmCampus(
  rule: OsmBuildingRule,
  frame: MapFrame,
): { data: CampusData; index: RoomIndex; plans: FloorPlans[]; stats: Record<string, number> } {
  const stats: Record<string, number> = {};
  const bump = (k: string, n = 1) => (stats[k] = (stats[k] ?? 0) + n);
  const keys = ruleKeys(rule);
  const campusOf = new Map(rule.campuses.map((c) => [c.area, c]));

  const taken: { e: OsmElement; tags: Record<string, string>; outline: Ring[]; area: string }[] = [];
  const exclusions: BuildingExclusion[] = [];
  const seen = new Set<string>();
  const elements = frame.boxes.flatMap((box) => {
    const osm = JSON.parse(readSnapshot(box.area.osm).toString("utf8")) as { elements: OsmElement[] };
    return osm.elements.map((e) => ({ e, area: box.area.id }));
  });
  for (const { e, area } of elements) {
    const tags = e.tags ?? {};
    const verdict = decide(rule, tags);
    if (!verdict) continue;
    const osmId = `${e.type}/${e.id}`;
    if (seen.has(osmId)) continue;
    seen.add(osmId);
    bump("osmBuildings.candidates");
    if (!verdict.take) {
      exclusions.push({ osm: osmId, sourceText: tagText(tags, keys), reason: verdict.reason });
      bump("osmBuildings.excluded");
      continue;
    }
    const outline = outlineOf(e, frame.project);
    if (!outline || ringArea(outline[0]!) <= 0) {
      // A multipolygon of several separate outlines (North Campus's AE, 15 rings) says so.
      const rings = outline ? 1 : outerRings(e, frame.project).length;
      const reason =
        rings > 1
          ? `Its outline in the snapshot is ${rings} separate rings, not one: the campus draws a building as one block on one outline. The rings stay in the surroundings.`
          : "Its outline in the snapshot is not one closed ring.";
      exclusions.push({ osm: osmId, sourceText: tagText(tags, keys), reason });
      bump("osmBuildings.excluded");
      continue;
    }
    taken.push({ e, tags, outline, area });
  }

  // The building's id is its code (`ref`); where two buildings carry the same code, each takes
  // the code and its OpenStreetMap id, so that no code is made up and both can be told apart. A
  // building with no code takes its element (WAY-26127574), in capitals, as the app reads an id
  // from an address in capitals (src/app/state.ts).
  const refCount = new Map<string, number>();
  for (const { tags } of taken) refCount.set(tags.ref ?? "", (refCount.get(tags.ref ?? "") ?? 0) + 1);

  const buildings: Building[] = taken.map(({ e, tags, outline, area }) => {
    const ref = tags.ref;
    const id = ref && refCount.get(ref) === 1 ? ref : `${ref ?? e.type.toUpperCase()}-${e.id}`;
    const center = ringCentroid(outline[0]!);
    const name = tags.name ?? ref ?? id;
    const h = osmHeight(tags, ringArea(outline[0]!));
    bump(`osmBuildings.height.${h.heightSource}`);
    const standsIn = frame.boxes.find((b) => inBox(b, center))?.area.id ?? area;
    const campus = campusOf.get(standsIn);
    if (!campus) throw new Error(`${e.type}/${e.id} stands in the area "${standsIn}", which the rule gives no campus`);
    return {
      id,
      campus: campus.id,
      name: { en: name },
      sourceText: name,
      outline: outline.map(encodeRing),
      center: [round1(center[0]), round1(center[1])],
      floors: [],
      ...h,
      roomCount: 0,
      osm: `${e.type}/${e.id}`,
      ...(ref ? { ref } : {}),
      ...placeOnMap(frame, center),
    };
  });
  buildings.sort((a, z) => a.id.localeCompare(z.id, "en", { numeric: true }));
  exclusions.sort((a, z) => a.osm.localeCompare(z.osm, "en", { numeric: true }));
  stats["osmBuildings.taken"] = buildings.length;

  // Each campus's centre is the median of its building centres, as for the University of
  // Auckland. A campus with no building is left out: no campus is drawn without its buildings.
  const campuses = rule.campuses.flatMap((c) => {
    const own = buildings.filter((b) => b.campus === c.id);
    if (own.length === 0) return [];
    const xs = own.map((b) => b.center[0]).sort((a, z) => a - z);
    const ys = own.map((b) => b.center[1]).sort((a, z) => a - z);
    const mid = Math.floor(own.length / 2);
    const center: [number, number] = [round1(xs[mid]!), round1(ys[mid]!)];
    const place = placeOnMap(frame, center);
    stats[`osmBuildings.taken.${c.id}`] = own.length;
    return [{ id: c.id, name: { en: c.name }, onMap: !place.offMap, ...(place.area ? { area: place.area } : {}), center, buildingCount: own.length }];
  });

  return {
    data: {
      version: 1,
      generatedAt: new Date().toISOString(),
      origin: frame.origin,
      floorHeight: FLOOR_HEIGHT,
      campuses,
      buildings,
      rooms: [],
      buildingExclusions: exclusions,
    },
    index: {},
    plans: [],
    stats,
  };
}
