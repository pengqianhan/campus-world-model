// The University of Auckland's campus adapter (docs/schools/DESIGN.md, section 4): its campus map,
// served by MapsIndoors (scripts/schools/uoa/fetch-mapsindoors.ts), made into the published campus.
// The types, room types, floor rules and patterns below are that map's words for this University:
// another school on MapsIndoors names its venues, rooms and spaces in words of its own.
import {
  cleanRing,
  encodeRing,
  interiorPoint,
  overlap,
  pointInRing,
  ringArea,
  ringCentroid,
  shareInside,
  simplifyRing,
  type Pt,
  type Ring,
} from "../../../src/shared/geo.ts";
import type {
  Building,
  Campus,
  CampusData,
  Floor,
  FloorPlans,
  Room,
  RoomIndex,
  RoomKind,
  SpaceIcon,
  SpaceKind,
  SpaceType,
} from "../../../src/shared/types.ts";
import { placeOnMap, type MapFrame } from "../../lib/map-frame.ts";
import { readSnapshot } from "../../lib/snapshot.ts";

/** Display convention for stacking floors; the source has no heights. */
const FLOOR_HEIGHT = 3.6;
/** A floor outline with less of its area than this over its own building belongs to another one. */
const MIN_FOOTPRINT_SHARE = 0.2;
/**
 * Two floors whose outlines share this much of the area either covers are drawn from outside as
 * one block. Of the 472 pairs of neighbouring floors in the snapshot of 2026-10-13, 251 share 99%
 * or more: the same walls, traced again floor by floor. The value keeps a real setback, which
 * takes away far more than a twentieth of a floor.
 */
const STACK_OVERLAP = 0.95;

const readJson = <T>(file: string): T => JSON.parse(readSnapshot(file).toString("utf8")) as T;
const round1 = (n: number) => Math.round(n * 10) / 10;

interface MiVenue {
  id: string;
  name: string;
  venueInfo: { name: string };
}
interface MiGeometry {
  type: "Polygon" | "MultiPolygon" | "Point";
  coordinates: unknown;
}
interface MiFloor {
  name: string;
  geometry: MiGeometry;
}
interface MiBuilding {
  administrativeId: string;
  venueId: string;
  buildingInfo: { name: string };
  geometry: MiGeometry;
  floors: Record<string, MiFloor>;
}
interface MiLocation {
  geometry: MiGeometry;
  properties: {
    name: string;
    type: string;
    floor: string;
    floorName: string;
    building: string;
    venue: string;
    locationType: string;
    status: number;
    externalId: string | null;
  };
}

/** Campus ids by the source's venue name. Whether a campus is on the map follows scripts/lib/areas.ts. */
const CAMPUS_IDS: Record<string, { id: string }> = {
  CITY_CAMPUS: { id: "city" },
  GRAFTON_CAMPUS: { id: "grafton" },
  NEWMARKET_CAMPUS: { id: "newmarket" },
  LEIGH_CAMPUS: { id: "leigh" },
  ARDMORE_CAMPUS: { id: "ardmore" },
  TAI_TOKERAU_CAMPUS: { id: "tai-tokerau" },
  TAI_TONGA_CAMPUS: { id: "tai-tonga" },
  WAIHEKE_RESEARCH_STATION: { id: "waiheke" },
};

/** Source room types that are published with an outline, and the kind they map to. */
const LEARNING_TYPES: Record<string, RoomKind> = {
  "Lecture theatres": "lectureTheatre",
  "Teaching spaces": "teaching",
  "Computer labs": "computerLab",
  Laboratories: "lab",
  "Lab-Undergrad": "lab",
  "Study spaces": "study",
  "Student spaces": "study",
  Library: "library",
  "Student hubs": "studentHub",
};

/** Source types left out of the lazy room index: private, non-rooms, or not something to navigate to. */
const INDEX_EXCLUDED_TYPES = new Set([
  "Stud Residential Accom",
  "Accommodation Reception",
  "Parking For Vehicles",
  "Non Usable Area",
  "Nonasgn Rentable",
  "Ancillary Area",
  "Void 2.0 test",
  "Stairs",
  "Elevator",
  "Female",
  "Male",
  "Unisex",
  "Accessible",
  "Gender Diverse",
  "Shower",
  "Squat",
  "Cages",
  "Bike Store",
  "Building",
]);

/** A floor holding any of these gets no floor plan and no unnamed room's code in the search: where
 * people live is not drawn, even unnamed. */
const PLAN_RESIDENTIAL_TYPES = new Set(["Stud Residential Accom"]);
/** Buildings that get no floor plan and no unnamed room's code in the search, by their name in the source:
 * childcare centres ("ECE" is early childhood education, as in "Nicholls Lane ECE"). */
const PLAN_CHILDCARE_BUILDINGS = /Early Childhood|K[oō]hanga Reo|\bECE\b/i;
/** Shapes that are not rooms: single parking bays and the source's own test records. */
const PLAN_SKIPPED_TYPES = new Set(["Parking For Vehicles", "Void 2.0 test"]);
/**
 * The group each source type of a floor-plan shape is drawn in. A type not listed here, such as
 * "Non Usable Area", "Ancillary Area" or "Nonasgn Rentable", is "other": the source does not say
 * what it holds. A learning type lands here when the source hides the room from its search or
 * gives it no standard code, so it is not named.
 */
const SPACE_KINDS: Record<string, SpaceKind> = {
  ...Object.fromEntries(Object.keys(LEARNING_TYPES).map((t) => [t, "learning"])),
  "Office Accommodation": "office",
  "Lab-Research": "lab",
  "Lab-Postgrad": "lab",
  "Lab-Circulation spaces": "lab",
  "Lab-Music": "lab",
  "Lab-Media": "lab",
  Female: "toilet",
  Male: "toilet",
  Unisex: "toilet",
  Accessible: "toilet",
  "Gender Diverse": "toilet",
  Squat: "toilet",
  Shower: "toilet",
  Stairs: "stairs",
  Elevator: "stairs",
  "Cafes and Restaurants": "amenity",
  Bars: "amenity",
  Groceries: "amenity",
  Pharmacy: "amenity",
  Post: "amenity",
  Kitchen: "amenity",
  Gyms: "amenity",
  "Health and counselling": "amenity",
  "Disability services": "amenity",
  "Information Serv": "amenity",
  "Parent Space": "amenity",
  "Accommodation Reception": "amenity",
  Emergency: "amenity",
  "Bike Store": "amenity",
};
/**
 * The sign drawn on a shape of these types. In the snapshot of 2026-10-13 every "Accessible" shape
 * is named as a toilet ("Accessible - Unisex", "Accessible - Female"), and "Squat" as a squat toilet.
 */
const SPACE_ICONS: Record<string, SpaceIcon> = {
  Stairs: "stairs",
  Elevator: "lift",
  Female: "toilet",
  Male: "toilet",
  Unisex: "toilet",
  "Gender Diverse": "toilet",
  Squat: "toilet",
  Accessible: "accessible",
  Shower: "shower",
};
/**
 * A floor on which the campus map's shapes, of every kind, cover less of the floor than this is
 * marked as partly drawn. In the snapshot of 2026-10-13 such floors hold stairs, lifts, toilets and
 * plant and little else: roof plant levels, mezzanines, the landings of a split-level building.
 */
const PARTIAL_PLAN = 0.3;

const CODE_RE = /^(\d{3}[A-Z]?)-([A-Z0-9]+)$/;

function toRing(project: MapFrame["project"], coords: number[][], tolerance: number): Ring {
  return simplifyRing(cleanRing(coords.map((c) => project(c[0]!, c[1]!))), tolerance);
}

/** Geometry -> list of polygons, each a list of rings (outer first). */
function polygons(project: MapFrame["project"], g: MiGeometry, tolerance: number): Ring[][] {
  const raw =
    g.type === "Polygon"
      ? [g.coordinates as number[][][]]
      : g.type === "MultiPolygon"
        ? (g.coordinates as number[][][][])
        : [];
  const out: Ring[][] = [];
  for (const poly of raw) {
    const rings = poly.map((r) => toRing(project, r, tolerance)).filter((r) => r.length >= 3);
    const outer = rings[0];
    if (!outer || ringArea(outer) < 2) continue;
    out.push([outer, ...rings.slice(1).filter((r) => ringArea(r) >= 1)]);
  }
  return out;
}

/** Area of polygons with holes, square metres. */
function polygonsArea(polys: Ring[][]): number {
  return polys.reduce((n, [outer, ...holes]) => n + ringArea(outer!) - holes.reduce((h, r) => h + ringArea(r), 0), 0);
}

function buildingName(raw: string, id: string): string {
  // Source names repeat the building id as a prefix ("B303 Science Centre", "B6WA A Block")
  // or as a suffix in brackets ("Med School Hospital Underpass (595)").
  const prefix = `B${id}`;
  const unprefixed = raw.startsWith(`${prefix} `) || raw === prefix ? raw.slice(prefix.length) : raw;
  let n = unprefixed
    .replace(/^B\d{3}[A-Z]?\b\s*/, "")
    .replace(/\s*\(\d{3}[A-Z]?\)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!n) n = `Building ${id}`;
  return n;
}

function roomKind(sourceType: string, name: string): RoomKind {
  const kind = LEARNING_TYPES[sourceType] ?? "other";
  if (kind === "teaching" && /^studio/i.test(name)) return "studio";
  if (kind === "teaching" && /^(informal|study)/i.test(name)) return "study";
  return kind;
}

/** The campus from the campus map's snapshot: buildings, floors, named rooms, the room index and the floor plans. */
export function buildCampus(frame: MapFrame): { data: CampusData; index: RoomIndex; plans: FloorPlans[]; stats: Record<string, number> } {
  const { project } = frame;
  const venues = readJson<MiVenue[]>("mapsindoors/venues.json");
  const miBuildings = readJson<MiBuilding[]>("mapsindoors/buildings.json");
  const locations = readJson<MiLocation[]>("mapsindoors/locations.json");
  const stats: Record<string, number> = {};
  const bump = (k: string, n = 1) => (stats[k] = (stats[k] ?? 0) + n);

  const venueById = new Map(venues.map((v) => [v.id, v]));
  const venueCampus = (name: string) => CAMPUS_IDS[name]?.id ?? name.toLowerCase();

  const buildings: Building[] = [];
  /** Area of the outline each floor has in effect, square metres, by `${building}|${floor}`. */
  const floorArea = new Map<string, number>();
  for (const b of miBuildings) {
    const venue = venueById.get(b.venueId);
    if (!venue) continue;
    const id = b.administrativeId;
    if (/^Cage\b/i.test(b.buildingInfo.name)) {
      bump("buildings.skipped.cage");
      continue;
    }
    const outlinePolys = polygons(project, b.geometry, 0.25);
    const outline = outlinePolys[0];
    if (!outline) {
      bump("buildings.skipped.noGeometry");
      continue;
    }
    const center = ringCentroid(outline[0]!);

    const floors: Floor[] = [];
    // The outline each floor has in effect: its own, or the one it repeats from the floor below.
    const shapes: (Ring[][] | undefined)[] = [];
    let prevKey = "";
    const sorted = Object.entries(b.floors)
      .map(([k, f]) => ({ i: Number(k), f }))
      .sort((a, z) => a.i - z.i);
    for (const { i, f } of sorted) {
      const floor: Floor = { i, name: f.name };
      let rings = polygons(project, f.geometry, 0.25);
      // A few floors in the source carry the outline of a different building. The footprint
      // stands in for an outline that misses its own building, and the floor is marked.
      if (rings.length && shareInside(rings, outline[0]!) < MIN_FOOTPRINT_SHARE) {
        rings = [outline];
        floor.outlineFrom = "footprint";
        bump("floors.outlineFromFootprint");
      }
      const polys = rings.map((poly) => poly.map(encodeRing));
      const key = JSON.stringify(polys);
      if (polys.length && key !== prevKey) floor.outline = polys;
      if (polys.length) prevKey = key;
      shapes.push(floor.outline ? rings : shapes[shapes.length - 1]);
      floors.push(floor);
      floorArea.set(`${id}|${i}`, polygonsArea(shapes[shapes.length - 1] ?? [outline]));
    }
    // Storeys that are alike from outside stand as one block: each run of full levels at or above
    // entry is measured against its lowest floor, so that a slow drift up a tower still shows.
    const entry = floors.find((f) => f.i >= 0)?.i;
    let run: { i: number; shape: Ring[][] } | undefined;
    floors.forEach((floor, k) => {
      if (entry === undefined || floor.i < 0 || (floor.i - entry) % 10 !== 0) return;
      const shape = shapes[k] ?? [outline];
      if (run && shape !== run.shape && overlap(run.shape, shape) >= STACK_OVERLAP) {
        floor.stackWith = run.i;
        bump("floors.stackedWithLower");
      } else if (!run || shape !== run.shape) run = { i: floor.i, shape };
    });
    const above = floors.filter((f) => f.i >= 0).map((f) => f.i);
    const levels = above.length ? (Math.max(...above) - Math.min(...above)) / 10 + 1 : 0;
    const height = levels > 0 ? round1(levels * FLOOR_HEIGHT) : 1.2;

    buildings.push({
      id,
      campus: venueCampus(venue.name),
      name: { en: buildingName(b.buildingInfo.name, id) },
      sourceText: b.buildingInfo.name,
      outline: outline.map(encodeRing),
      center: [round1(center[0]), round1(center[1])],
      floors,
      height,
      heightSource: "floor-count",
      roomCount: 0,
      ...placeOnMap(frame, center),
    });
  }
  buildings.sort((a, z) => a.id.localeCompare(z.id, "en", { numeric: true }));
  const byId = new Map(buildings.map((b) => [b.id, b]));

  // Rooms. A code can appear more than once in the source; keep the largest outline.
  const rooms = new Map<string, Room>();
  const index: RoomIndex = {};
  const indexed = new Set<string>();
  for (const loc of locations) {
    const p = loc.properties;
    const code = p.externalId?.trim().toUpperCase();
    if (!code) continue;
    const m = CODE_RE.exec(code);
    if (!m) {
      bump("rooms.skipped.nonStandardCode");
      continue;
    }
    if (p.status !== 3) {
      bump("rooms.skipped.notSearchableInSource");
      continue;
    }
    // Trust the code's own building prefix when that building exists; otherwise the source field.
    const building = byId.get(m[1]!) ?? byId.get(p.building);
    if (!building) {
      bump("rooms.skipped.unknownBuilding");
      continue;
    }
    const floorIndex = Number(p.floor);
    if (!Number.isFinite(floorIndex) || !building.floors.some((f) => f.i === floorIndex)) {
      bump("rooms.skipped.unknownFloor");
      continue;
    }
    if (loc.geometry.type !== "Polygon") continue;
    const ring = toRing(project, (loc.geometry.coordinates as number[][][])[0]!, 0.15);
    if (ring.length < 3) continue;
    const area = ringArea(ring);
    const c = interiorPoint(ring);
    const roomPart = m[2]!;
    const fullCode = `${building.id}-${roomPart}`;

    const kind = LEARNING_TYPES[p.type] ? roomKind(p.type, p.name) : undefined;
    if (kind) {
      const existing = rooms.get(fullCode);
      if (existing) bump("rooms.duplicateCodes");
      if (!existing || existing.area < area) {
        rooms.set(fullCode, {
          code: fullCode,
          b: building.id,
          f: floorIndex,
          name: { en: p.name.trim() || p.type },
          kind,
          sourceType: p.type,
          poly: encodeRing(ring),
          c: [round1(c[0]), round1(c[1])],
          area: Math.round(area),
        });
      }
    } else if (!INDEX_EXCLUDED_TYPES.has(p.type) && p.locationType === "room" && !indexed.has(fullCode)) {
      indexed.add(fullCode);
      (index[building.id] ??= []).push([roomPart, floorIndex, Math.round(c[0] * 10), Math.round(c[1] * 10)]);
    } else {
      bump("rooms.notPublished");
    }
  }
  // A code published with an outline does not need an index entry as well.
  for (const [bid, list] of Object.entries(index)) {
    index[bid] = list.filter(([part]) => !rooms.has(`${bid}-${part}`)).sort((a, z) => a[0].localeCompare(z[0]));
  }

  const roomList = [...rooms.values()].sort((a, z) => a.code.localeCompare(z.code, "en", { numeric: true }));
  for (const r of roomList) byId.get(r.b)!.roomCount++;

  // Floor plans: whatever else the map draws on a floor, as shapes with the map's type for each.
  // Unlike the rooms above, these need no code and may be hidden from the source's search,
  // because nothing names them.
  for (const b of buildings) {
    if (PLAN_CHILDCARE_BUILDINGS.test(b.sourceText)) for (const f of b.floors) f.noPlan = "childcare";
  }
  const placed: { building: Building; floor: Floor; loc: MiLocation }[] = [];
  // How much of each floor the campus map covers with shapes of any kind, named or not.
  const drawnArea = new Map<string, number>();
  for (const loc of locations) {
    if (loc.geometry.type !== "Polygon") continue;
    const p = loc.properties;
    const m = CODE_RE.exec(p.externalId?.trim().toUpperCase() ?? "");
    const building = (m && byId.get(m[1]!)) ?? byId.get(p.building);
    const floor = building?.floors.find((f) => f.i === Number(p.floor));
    if (!building || !floor) continue;
    const key = `${building.id}|${floor.i}`;
    drawnArea.set(key, (drawnArea.get(key) ?? 0) + polygonsArea(polygons(project, loc.geometry, 0.2)));
    if (PLAN_RESIDENTIAL_TYPES.has(p.type)) floor.noPlan = "residential";
    else if (m && rooms.has(`${building.id}-${m[2]}`)) continue;
    else if (!building.offMap) placed.push({ building, floor, loc });
  }
  // A floor left blank because people live there or it is a childcare centre is blank in the
  // search too: no unnamed room on it can be found and pinned. (A named teaching room on such a
  // floor is published, and found, as any named room is.)
  for (const [bid, list] of Object.entries(index)) {
    const floors = byId.get(bid)!.floors;
    index[bid] = list.filter(([, i]) => {
      const blank = floors.find((f) => f.i === i)?.noPlan;
      if (blank !== "residential" && blank !== "childcare") return true;
      bump(`rooms.skipped.${blank}Floor`);
      return false;
    });
  }
  const namedOn = new Map<string, Pt[]>();
  for (const r of roomList) namedOn.set(`${r.b}|${r.f}`, [...(namedOn.get(`${r.b}|${r.f}`) ?? []), r.c]);
  const shapes = new Map<string, Map<number, { rings: Ring[]; area: number; type: string }[]>>();
  for (const { building, floor, loc } of placed) {
    if (floor.noPlan) {
      bump(`plans.skipped.${floor.noPlan}Floor`);
      continue;
    }
    if (PLAN_SKIPPED_TYPES.has(loc.properties.type)) {
      bump("plans.skipped.notARoom");
      continue;
    }
    // polygons() drops outlines under 2 square metres, which here are ducts and risers.
    const poly = polygons(project, loc.geometry, 0.2)[0];
    if (!poly) {
      bump("plans.skipped.tiny");
      continue;
    }
    // A shape lying over a named room is the open area around it; the room is what is drawn there.
    const named = namedOn.get(`${building.id}|${floor.i}`) ?? [];
    if (named.some((c) => pointInRing(c, poly[0]!) && !poly.slice(1).some((hole) => pointInRing(c, hole)))) {
      bump("plans.skipped.coversNamedRoom");
      continue;
    }
    let floors = shapes.get(building.id);
    if (!floors) shapes.set(building.id, (floors = new Map()));
    let list = floors.get(floor.i);
    if (!list) floors.set(floor.i, (list = []));
    const type = loc.properties.type.trim();
    list.push({ rings: poly, area: ringArea(poly[0]!), type });
    if (loc.properties.status !== 3) bump("plans.shapes.hiddenFromSourceSearch");
    bump(`plans.shapes.kind.${SPACE_KINDS[type] ?? "other"}`);
  }
  const plans: FloorPlans[] = [];
  for (const b of buildings) {
    const floors = shapes.get(b.id);
    if (!floors) continue;
    const plan: FloorPlans = { version: 2, building: b.id, types: [], floors: {}, typeOf: {} };
    const typeIndex = new Map<string, number>();
    const typeOf = (text: string): number => {
      let k = typeIndex.get(text);
      if (k === undefined) {
        const icon = SPACE_ICONS[text];
        k = plan.types.push({ text, kind: SPACE_KINDS[text] ?? "other", ...(icon ? { icon } : {}) } satisfies SpaceType) - 1;
        typeIndex.set(text, k);
      }
      return k;
    };
    b.planShapes = 0;
    for (const [i, list] of [...floors].sort((a, z) => a[0] - z[0])) {
      // Largest first, so a room inside an open area is drawn after the area around it.
      list.sort((a, z) => z.area - a.area);
      plan.floors[i] = list.map((s) => s.rings.map(encodeRing));
      plan.typeOf[i] = list.map((s) => typeOf(s.type));
      b.planShapes += list.length;
      bump("plans.floors");
    }
    plans.push(plan);
  }
  // Mark what the campus map itself leaves out, so that a bare floor is not taken for one this
  // site failed to draw.
  for (const b of buildings) {
    if (b.offMap) continue;
    for (const f of b.floors) {
      if (f.noPlan) continue;
      const key = `${b.id}|${f.i}`;
      const drawn = drawnArea.get(key) ?? 0;
      if (drawn === 0) {
        f.noPlan = "unmapped";
        bump("floors.unmapped");
      } else if (drawn < PARTIAL_PLAN * (floorArea.get(key) ?? 0)) {
        f.partialPlan = true;
        bump("floors.partialPlan");
      }
    }
  }

  const campuses: Campus[] = venues
    .map((v) => {
      const id = venueCampus(v.name);
      const own = buildings.filter((b) => b.campus === id);
      // Median of building centres, so one far-away outlier does not drag the campus centre.
      const xs = own.map((b) => b.center[0]).sort((a, z) => a - z);
      const ys = own.map((b) => b.center[1]).sort((a, z) => a - z);
      const mid = Math.floor(own.length / 2);
      const center: [number, number] = [round1(xs[mid] ?? 0), round1(ys[mid] ?? 0)];
      // A campus is on the map when its middle is; a building far from the rest has its own area.
      const place = placeOnMap(frame, center);
      return {
        id,
        name: { en: v.venueInfo.name },
        onMap: !place.offMap,
        ...(place.area ? { area: place.area } : {}),
        center,
        buildingCount: own.length,
      };
    })
    // The central campuses first, then those in areas of their own, then any off the map.
    .sort((a, z) => Number(z.onMap) - Number(a.onMap) || Number(!!a.area) - Number(!!z.area) || z.buildingCount - a.buildingCount);

  return {
    data: {
      version: 1,
      generatedAt: new Date().toISOString(),
      origin: frame.origin,
      floorHeight: FLOOR_HEIGHT,
      campuses,
      buildings,
      rooms: roomList,
    },
    index,
    plans,
    stats,
  };
}
