// Te Herenga Waka—Victoria University of Wellington's descriptor (docs/schools/DESIGN.md,
// section 5): data only. VUW is in the Buildings form (DESIGN.md, section 2): its Kelburn Campus
// buildings come from OpenStreetMap by a rule on their tags, on the LINZ ground. Its room list,
// class times, dates and course list are not shown (docs/schools/vuw.md, "Verdicts").
import type { SceneArea, School } from "../../shared/school.ts";
import en from "./locales/en.json";

/**
 * The Kelburn Campus, with 150 m of margin, rounded outwards: the box round the 24 points on
 * VUW's own Kelburn campus page (docs/schools/vuw.md, "Campuses") and round the buildings the rule
 * below takes, whose houses on Fairlie Terrace and Kelburn Parade reach 160 m further south-west
 * than the points. Its id is "central", the area the app loads first. Its raw snapshot carries the
 * school's id first (DESIGN.md, section 3). The maintainer let the loop fetch it on 2026-10-27.
 */
const KELBURN: SceneArea = { id: "central", bbox: [-41.2937, 174.7638, -41.2838, 174.7726], osm: "osm/context-vuw-kelburn.json" };

/** The operator tag OpenStreetMap gives VUW's buildings. */
const VUW = /^Victoria University of Wellington$/;

/**
 * Matches nothing. VUW's room list is not used in the Buildings form, so no room code is read: the
 * School type asks for a grammar, and this is the least the type and tests/schools.test.ts accept.
 * It is not VUW's grammar, and none is made up.
 */
const NONE = /(?!)/;

const PART = "A building part (building:part), not a building. The campus takes whole buildings only; the part stays in the surroundings.";

export const school: School = {
  id: "vuw",
  /** The middle of the extent of the Kelburn Campus buildings the rule takes, in osm/context-vuw-kelburn.json. */
  origin: { lat: -41.2897, lon: 174.7682 },
  /** The Kelburn Campus. */
  sun: { lat: -41.2897, lon: 174.7682 },
  weather:
    "https://api.open-meteo.com/v1/forecast?latitude=-41.2897&longitude=174.7682" +
    "&current=temperature_2m,weather_code,cloud_cover,precipitation,wind_speed_10m,wind_direction_10m&timezone=Pacific%2FAuckland",
  /** The Kelburn Campus buildings span about 430 m east to west and 610 m north to south. */
  campusSpan: { kelburn: 600 },
  /** Pipitea and Te Aro need an area each, not fetched yet (docs/schools/vuw.md, "Needs the maintainer", 5). */
  areas: { central: KELBURN, remote: [] },
  roomCode: { building: NONE, wing: NONE, room: NONE, floorLetters: [], equivalentFloors: [] },
  words: { en },
  /**
   * The rule on OpenStreetMap's tags that picks VUW's buildings ("A school whose campus map cannot
   * be used" in PROGRESS.md, "Decisions"). OpenStreetMap gives none of them a `ref`: 7 carry
   * `operator=Victoria University of Wellington`, and the rest `building=university` with no
   * operator, in a box where VUW is the only university. So a building is taken by its operator,
   * or by `building=university` with no other operator named, and by its name, which is what it
   * is called on the map. The pull request that built it lists every building it takes and every
   * one it leaves out.
   */
  osmBuildings: {
    campus: { id: "kelburn", name: "Kelburn Campus" },
    candidates: [{ operator: VUW }, { building: /^university$/ }],
    steps: [
      { when: { building: null }, take: false, reason: PART },
      { when: { building: /^no$/ }, take: false, reason: PART },
      {
        when: { amenity: /^(childcare|kindergarten)$/ },
        take: false,
        reason: "A childcare centre. Childcare centres stay blank: it stays in the surroundings, with no name.",
      },
      {
        when: { building: /^ruins$/ },
        take: false,
        reason: "OpenStreetMap maps it as a ruin (building=ruins), not as a building in use. It stays in the surroundings, with no name.",
      },
      {
        when: { man_made: /^bridge$/ },
        take: false,
        reason:
          "A bridge between buildings (man_made=bridge), not a building that stands on the ground. The surroundings keep it as a bridge, drawn from the height it starts at (min_height or building:min_level) unless it overlaps one of VUW's buildings on the map; where its tags give no height, it is not drawn.",
      },
      {
        when: { "building:min_level": /./ },
        take: false,
        reason:
          "It starts above the ground (building:min_level): a bridge or storeys over a passage, not a building that stands on the ground. The surroundings draw it from the height it starts at, unless it overlaps one of VUW's buildings on the map.",
      },
      {
        when: { name: null },
        take: false,
        reason: "No name to call it by: OpenStreetMap gives VUW's buildings no building code (ref), and this one no name. The surroundings draw it as they draw any other building, unless it overlaps one of VUW's buildings on the map or covers less than 12 square metres.",
      },
      {
        when: { name: /^Malaghan Institute/ },
        take: false,
        reason:
          "The Malaghan Institute of Medical Research, by its name and its wikidata tag an independent research institute, not a part of VUW, although it stands on the campus and is tagged building=university. The surroundings draw it as they draw any other building, unless it overlaps one of VUW's buildings on the map or covers less than 12 square metres.",
      },
      { when: { operator: VUW }, take: true, reason: "operator=Victoria University of Wellington, and a name." },
      {
        when: { building: /^university$/, operator: null },
        take: true,
        reason: "building=university with no operator tag, and a name: VUW is the only university in the Kelburn box, and no other operator is named.",
      },
      {
        when: { operator: /./ },
        take: false,
        reason: "Its operator tag names another operator, not VUW. The surroundings draw it as they draw any other building, unless it overlaps one of VUW's buildings on the map or covers less than 12 square metres.",
      },
    ],
    provides:
      "VUW's Kelburn Campus buildings, picked by their operator and building tags: outlines, names, and heights where tagged. Surrounding buildings, streets, paths, parks and trees",
  },
  /** docs/schools/vuw.md, "Verdicts". */
  layers: {
    buildings: "usable",
    indoor: "needs-permission",
    timetable: "needs-permission",
    calendar: "needs-permission",
    subjects: "needs-permission",
    terrain: "usable",
  },
};
