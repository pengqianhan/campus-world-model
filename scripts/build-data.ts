// Builds the published data files in public/data/<school>/ from the raw snapshots in data/raw.
// Never touches the network: run the fetch scripts first (they are cache-first).
//
//   npx tsx scripts/build-data.ts
//
// SCHOOL picks the school (docs/schools/DESIGN.md); the University of Auckland, uoa, is the
// default. A school in the Buildings form (its descriptor has `osmBuildings`, such as aut) is built
// too. The build runs the five steps of the design's section 4:
//   1. the school's campus adapter makes the campus, the room index and the floor plans;
//   2. buildContext (scripts/lib/context.ts) draws the surroundings of each area;
//   3. buildTerrain (scripts/lib/terrain.ts) makes the ground under each area;
//   4. the school's subjects, calendar and timetable, or their empty forms;
//   5. meta.json takes the school's sources, coverage and layers, and every file goes to public/data/<school>/.
import fs from "node:fs";
import path from "node:path";
import type { AcademicCalendar, Coverage, Meta, Schedule, SourceInfo } from "../src/shared/types.ts";
import { AREAS, CENTRAL } from "./lib/areas.ts";
import { buildSchedule, loadClassSnapshots } from "./lib/classes.ts";
import { buildContext } from "./lib/context.ts";
import { mapFrame } from "./lib/map-frame.ts";
import { buildOsmCampus } from "./lib/osm-buildings.ts";
import { hasSnapshot, manifest } from "./lib/snapshot.ts";
import { sharedFilesOf, snapshotDate as snapshotDateOf } from "./lib/snapshot-date.ts";
import { buildTerrain } from "./lib/terrain.ts";
import { SCHOOL, school } from "./lib/school.ts";
import { buildCampus } from "./schools/uoa/mapsindoors.ts";
import { buildSubjects } from "./schools/uoa/subjects.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
/**
 * The Buildings form's rule, for a school whose campus comes from OpenStreetMap. Without it, the
 * campus adapter, the subjects, the timetable and the sources below are the University of
 * Auckland's: never write them as another school's data.
 */
const osmForm = school.osmBuildings;
if (SCHOOL !== "uoa" && !osmForm) throw new Error(`build-data.ts builds the University of Auckland and schools in the Buildings form, not SCHOOL=${SCHOOL}`);
const OUT = path.join(ROOT, "public", "data", SCHOOL);

/**
 * The local frame round the school's origin, with the areas the 3D map draws (scripts/lib/areas.ts)
 * whose OpenStreetMap snapshot has been taken. An area without its snapshot is not drawn.
 */
const frame = mapFrame(
  school.origin,
  CENTRAL,
  AREAS.filter((area) => hasSnapshot(area.osm)),
);

/** This school's own files of the shared sources, osm and terrain: its snapshot dates count only these. */
const ownFiles = sharedFilesOf(AREAS);
const records = manifest();
const snapshotDate = (source: string) => snapshotDateOf(records, source, ownFiles);

function write(name: string, value: unknown): number {
  const file = path.join(OUT, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const text = JSON.stringify(value);
  fs.writeFileSync(file, text + "\n");
  return text.length;
}

// 1. The campus, from the school's campus adapter: OpenStreetMap by the school's rule in the
// Buildings form, else the University of Auckland's campus map.
const { data: campus, index, plans, stats: campusStats } = osmForm ? buildOsmCampus(osmForm, frame) : buildCampus(frame);
// 2. One file of surroundings per area: the central one loads with the map, the others when a
// campus or building in them is shown.
const contexts = frame.boxes.map((box) => ({ area: box.area, ...buildContext(campus, box, frame) }));
const contextStats = Object.assign({}, ...contexts.map((c) => c.stats)) as Record<string, number>;
// 3. The ground under each area, where its elevation tiles have been taken.
const terrains = frame.boxes.map((box) => ({ area: box.area, ...buildTerrain(box.area, frame) }));
Object.assign(contextStats, ...terrains.map((t) => t.stats));
// 4. Subjects, the calendar and the timetable. A school in the Buildings form has none of its own
// yet: its subjects and timetable are written empty, and its hand-made calendar file says
// `available: false` with no dates.
const subjects = osmForm ? [] : buildSubjects();
const calendar = JSON.parse(fs.readFileSync(path.join(ROOT, "data", SCHOOL, "academic-calendar.json"), "utf8")) as AcademicCalendar;

const emptySchedule: Schedule = { version: 1, generatedAt: campus.generatedAt, available: false, terms: [], courses: [], sessions: [], exclusions: [] };
const { schedule, stats: scheduleStats }: { schedule: Schedule; stats: object } = osmForm
  ? { schedule: emptySchedule, stats: {} }
  : buildSchedule(school, loadClassSnapshots(), campus, index, snapshotDate("uoa-classes"));

// 5. The coverage, the sources About shows, and every file to public/data/<school>/.
const count = (p: Schedule["sessions"][number]["precision"]) => schedule.sessions.filter((s) => s.precision === p).length;
const coverage: Coverage = {
  buildings: campus.buildings.length,
  buildingsOnMap: campus.buildings.filter((b) => !b.offMap).length,
  rooms: campus.rooms.length,
  indexedRooms: Object.values(index).reduce((n, l) => n + l.length, 0),
  planShapes: campus.buildings.reduce((n, b) => n + (b.planShapes ?? 0), 0),
  subjects: subjects.length,
  courses: schedule.courses.length,
  sessions: schedule.sessions.length,
  sessionsLocatedToRoom: count("room"),
  sessionsLocatedToFloor: count("floor"),
  sessionsLocatedToBuilding: count("building"),
  sessionsExcluded: schedule.exclusions.length,
  ...(campus.buildingExclusions ? { buildingsExcluded: campus.buildingExclusions.length } : {}),
};

const osmSource: SourceInfo = {
  id: "osm",
  name: "OpenStreetMap",
  url: "https://www.openstreetmap.org/copyright",
  licence: "© OpenStreetMap contributors, Open Database License (ODbL) 1.0",
  snapshotDate: snapshotDate("osm"),
  provides: osmForm ? osmForm.provides : "Surrounding buildings, streets, paths, parks and trees",
};
// A school's own campus map, where the maintainer gave one to choose its buildings with
// (OsmBuildingRule.campusMap): its line names the map and the day the maintainer got it. The map
// itself is never in the repository, and no fetch script asks for it.
const campusMap = osmForm?.campusMap?.source;
const campusMapSource: SourceInfo[] = campusMap
  ? [
      {
        id: "campus-map",
        name: campusMap.name,
        url: campusMap.url,
        licence: campusMap.licence,
        snapshotDate: campusMap.received,
        provides: campusMap.provides,
      },
    ]
  : [];
const sources: SourceInfo[] = osmForm
  ? [osmSource, ...campusMapSource]
  : [
      {
        id: "mapsindoors",
        name: "University of Auckland campus maps (maps.auckland.ac.nz)",
        url: "https://maps.auckland.ac.nz/",
        licence: "© University of Auckland. Public campus map; building, floor and room positions derived from it, outlines simplified.",
        snapshotDate: snapshotDate("mapsindoors"),
        provides: "Buildings, floors, room codes, room types and room positions",
      },
      osmSource,
      {
        id: "uoa-calendar",
        name: "University of Auckland Calendar 2026 (key dates and course codes)",
        url: "https://www.auckland.ac.nz/en/about-us/about-the-university/the-university/official-publications/university-calendar/current-calendar.html",
        licence: "© University of Auckland. Dates and subject codes are quoted as facts with a link to the source.",
        snapshotDate: snapshotDate("uoa-calendar"),
        provides: "Semester dates, breaks, holidays and the list of subject codes",
      },
    ];
if (terrains.some((t) => t.data)) {
  sources.push({
    id: "terrain",
    name: "Land Information New Zealand 8 m Digital Elevation Model (2012), via the AWS Terrain Tiles",
    url: "https://registry.opendata.aws/terrain-tiles/",
    licence:
      "New Zealand terrain data © Land Information New Zealand and the New Zealand Government, CC BY 3.0 NZ; tiles by Mapzen/Tilezen, with SRTM, GMTED2010 (U.S. Geological Survey) and ETOPO1 (U.S. NOAA) data at the coast.",
    snapshotDate: snapshotDate("terrain"),
    provides: "The height of the ground under the map",
  });
}
if (schedule.available) {
  sources.push({
    id: "uoa-classes",
    name: "University of Auckland Classes API v2",
    url: "https://developer.auckland.ac.nz/prd/documentation/api-classes-v2",
    licence: "© University of Auckland. Retrieved with the site maintainer's own API credentials.",
    snapshotDate: snapshotDate("uoa-classes"),
    provides: "Timetabled classes: course, day, time, date range and room",
  });
}

const meta: Meta = { version: 1, generatedAt: campus.generatedAt, sources, coverage, ...(school.layers ? { layers: school.layers } : {}) };

// One file per building, so opening a building loads only its own floors. The folder is rebuilt
// whole: a building that lost its plan must not keep an old file.
fs.rmSync(path.join(OUT, "plans"), { recursive: true, force: true });
const planBytes = plans.reduce((n, plan) => n + write(`plans/${plan.building}.json`, plan), 0);
fs.rmSync(path.join(OUT, "context"), { recursive: true, force: true });
fs.rmSync(path.join(OUT, "terrain"), { recursive: true, force: true });
const terrainBytes = Object.fromEntries(terrains.filter((t) => t.data).map((t) => [`terrain/${t.area.id}.json`, write(`terrain/${t.area.id}.json`, t.data)]));
const contextBytes = Object.fromEntries(
  contexts.map((c) => {
    const file = c.area === CENTRAL ? "context.json" : `context/${c.area.id}.json`;
    return [file, write(file, c.data)];
  }),
);

const sizes = {
  [`plans/ (${plans.length} files)`]: planBytes,
  "campus.json": write("campus.json", campus),
  ...contextBytes,
  ...terrainBytes,
  "rooms-index.json": write("rooms-index.json", index),
  "subjects.json": write("subjects.json", subjects),
  "calendar.json": write("calendar.json", calendar),
  "schedule.json": write("schedule.json", schedule),
  "meta.json": write("meta.json", meta),
};

console.log("coverage", coverage);
console.log("stats", { ...campusStats, ...contextStats, ...scheduleStats });
console.log("bytes", sizes);
