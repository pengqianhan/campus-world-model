// Auckland University of Technology's descriptor (docs/schools/DESIGN.md, section 5): data only.
// AUT is in the Buildings form (DESIGN.md, section 2): its City Campus buildings come from
// OpenStreetMap by a rule on their tags, on the LINZ ground; its rooms, class times, dates and
// course list wait for AUT's permission, and its floor plans for a written agreement with MazeMap
// (docs/schools/aut.md, "Verdicts").
import type { SceneArea, School } from "../../shared/school.ts";
import en from "./locales/en.json";

/**
 * The University of Auckland's central area, the same box and so the same committed snapshot:
 * AUT's City Campus lies inside it (DESIGN.md, section 3). A box of its own would be a new
 * Overpass request, and a new box under this file name would overwrite the shared snapshot.
 */
const CENTRAL: SceneArea = { id: "central", bbox: [-36.8689, 174.7608, -36.8441, 174.7797], osm: "osm/context.json" };

/** A building code on the City Campus as OpenStreetMap tags it: W and one letter (WA to WZ). */
const CODE = /^W[A-Z]$/;

/**
 * Matches nothing. AUT publishes no room list the site may use, so no room code is read: the
 * School type asks for a grammar, and this is the least the type and tests/schools.test.ts accept.
 * It is not AUT's grammar, and none is made up.
 */
const NONE = /(?!)/;

export const school: School = {
  id: "aut",
  /** The middle of the extent of AUT's City Campus buildings in the committed OpenStreetMap snapshot, osm/context.json. */
  origin: { lat: -36.8533, lon: 174.766 },
  /** The City Campus. */
  sun: { lat: -36.8533, lon: 174.766 },
  weather:
    "https://api.open-meteo.com/v1/forecast?latitude=-36.8533&longitude=174.766" +
    "&current=temperature_2m,weather_code,cloud_cover,precipitation,wind_speed_10m,wind_direction_10m&timezone=Pacific%2FAuckland",
  /** The City Campus buildings span about 340 m east to west and 280 m north to south. */
  campusSpan: { city: 600 },
  /** North and South need an Overpass request each, a gate (docs/schools/aut.md, "Needs the maintainer", 4). */
  areas: { central: CENTRAL, remote: [] },
  roomCode: { building: NONE, wing: NONE, room: NONE, floorLetters: [], equivalentFloors: [] },
  words: { en },
  /**
   * The rule on OpenStreetMap's tags that picks AUT's buildings ("A school whose campus map cannot
   * be used" in PROGRESS.md, "Decisions"): its `operator` and `ref` tags. The pull request that
   * built it lists every building it takes and every one it leaves out.
   */
  osmBuildings: {
    campus: { id: "city", name: "City Campus" },
    candidates: [{ operator: /^AUT$/ }, { ref: CODE }],
    steps: [
      {
        when: { building: null },
        take: false,
        reason: "A building part (building:part), not a building. The campus takes whole buildings only; the part stays in the surroundings.",
      },
      {
        when: { building: /^no$/ },
        take: false,
        reason: "A building part (building:part), not a building. The campus takes whole buildings only; the part stays in the surroundings.",
      },
      {
        when: { building: /^ruins$/ },
        take: false,
        reason: "OpenStreetMap maps it as a ruin (building=ruins), not as a building in use. It stays in the surroundings, with no name.",
      },
      {
        when: { man_made: /^bridge$/ },
        take: false,
        reason: "A bridge between buildings (man_made=bridge), not a building that stands on the ground. It stays in the surroundings.",
      },
      {
        when: { ref: null },
        take: false,
        reason: "No building code (ref) to name it by. It stays in the surroundings.",
      },
      { when: { ref: CODE, operator: /^AUT$/ }, take: true, reason: "A building code (ref) and operator=AUT." },
      {
        when: { ref: CODE, operator: null, building: /^university$/ },
        take: true,
        reason: "A building code (ref) and building=university, with no operator tag: no other operator is named.",
      },
      {
        when: { operator: /^AUT$/ },
        take: false,
        reason: "operator=AUT, but its ref is not one of AUT's building codes (W and a letter). It stays in the surroundings.",
      },
      {
        when: { operator: /./ },
        take: false,
        reason: "Its operator tag names another operator, not AUT. It stays in the surroundings.",
      },
    ],
    provides:
      "AUT's City Campus buildings, picked by their operator and ref tags: outlines, names, codes, and heights where tagged. Surrounding buildings, streets, paths, parks and trees",
  },
  /** docs/schools/aut.md, "Verdicts". */
  layers: {
    buildings: "usable",
    indoor: "needs-permission",
    timetable: "needs-permission",
    calendar: "needs-permission",
    subjects: "needs-permission",
    terrain: "usable",
  },
};
