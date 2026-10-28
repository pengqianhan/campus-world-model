// University of Canterbury's descriptor (docs/schools/DESIGN.md, section 5): data only. UC is in
// the Buildings form (DESIGN.md, section 2): the buildings of its Ilam and Dovedale campuses and of
// its Arts Centre city location come from OpenStreetMap by a rule on their tags, on the LINZ
// ground. Its rooms, class times, dates and course list are not shown (docs/schools/uc.md,
// "Verdicts").
import type { SceneArea, School } from "../../shared/school.ts";
import en from "./locales/en.json";

/**
 * The Ilam campus. The recon gives one point for it, the Central Library (docs/schools/uc.md,
 * "Campuses"), so the box was drawn before the fetch, wide on every side; the buildings the rule
 * below takes lie 389 to 499 m inside its edges. Its id is "central", the area the app loads first.
 * Its raw snapshot carries the school's id first (DESIGN.md, section 3). The maintainer let the
 * loop fetch it on 2026-10-27.
 */
const ILAM: SceneArea = { id: "central", bbox: [-43.5317, 172.5718, -43.5168, 172.5922], osm: "osm/context-uc-ilam.json" };

/** The operator tag OpenStreetMap gives UC's buildings. */
const UC = /^University of Canterbury$/;

/**
 * OpenStreetMap's `building` values for a building people live or stay in (its "Accommodation"
 * types). Floors where people live stay blank (AGENTS.md, "Places, not people"), so a home is never
 * one of UC's campus buildings, whatever its operator: it stays in the surroundings with no name, as
 * Ilam's halls of residence do.
 */
export const HOMES: readonly string[] = ["apartments", "barracks", "bungalow", "cabin", "detached", "annexe", "dormitory", "farm", "ger",
  "hotel", "house", "houseboat", "residential", "semidetached_house", "static_caravan", "stilt_house", "terrace", "tree_house", "trullo"];

/** A `building` value other than a home's (HOMES). */
const NOT_HOME = new RegExp(`^(?!(?:${HOMES.join("|")})$)`);

/**
 * Matches nothing. UC's rooms are not used in the Buildings form, so no room code is read: the
 * School type asks for a grammar, and this is the least the type and tests/schools.test.ts accept.
 * It is not UC's grammar, and none is made up.
 */
const NONE = /(?!)/;

const PART = "A building part (building:part), not a building. The campus takes whole buildings only; the part stays in the surroundings.";
const SURROUNDINGS =
  "The surroundings draw it as they draw any other building, unless it overlaps one of UC's buildings on the map or covers less than 12 square metres.";

export const school: School = {
  id: "uc",
  /** The middle of the extent of the Ilam campus buildings the rule takes, in osm/context-uc-ilam.json. */
  origin: { lat: -43.5242, lon: 172.5814 },
  /** The Ilam campus. */
  sun: { lat: -43.5242, lon: 172.5814 },
  weather:
    "https://api.open-meteo.com/v1/forecast?latitude=-43.5242&longitude=172.5814" +
    "&current=temperature_2m,weather_code,cloud_cover,precipitation,wind_speed_10m,wind_direction_10m&timezone=Pacific%2FAuckland",
  /** The Ilam campus buildings span about 740 m east to west and 860 m north to south. */
  campusSpan: { ilam: 900 },
  /**
   * Dovedale and the Arts Centre city location, each in an area of its own, as the other schools'
   * campuses away from the centre are (docs/schools/uc.md, "Campuses"; "On the site" says how each
   * box was placed). Dovedale's box is round the Ōtākaro point of the report, about 200 m to each
   * side and 250 m to north and south; its 11 buildings lie 27 to 166 m inside its edges, and the
   * streets east of them are residential. The report gives the Arts Centre an address, 3 Hereford
   * Street, and no point, so its box is about 600 m a side round the Arts Centre's block on that
   * street; UC's one building there lies 245 to 353 m inside its edges. Nelson's box held no building that
   * OpenStreetMap traces to UC, so it is not on the site (Real or absent). The maintainer let the
   * loop fetch them on 2026-10-27. Their raw snapshots carry the school's id first (DESIGN.md,
   * section 3).
   */
  areas: {
    central: ILAM,
    remote: [
      { id: "dovedale", bbox: [-43.5234, 172.5653, -43.5189, 172.5703], osm: "osm/context-uc-dovedale.json" },
      { id: "arts-centre", bbox: [-43.5345, 172.6239, -43.5291, 172.6313], osm: "osm/context-uc-arts-centre.json" },
    ],
  },
  roomCode: { building: NONE, wing: NONE, room: NONE, floorLetters: [], equivalentFloors: [] },
  words: { en },
  /**
   * The rule on OpenStreetMap's tags that picks UC's buildings ("A school whose campus map cannot
   * be used" in PROGRESS.md, "Decisions"), as VUW's does. OpenStreetMap gives none of them a `ref`.
   * In the Ilam box 11 buildings carry `operator=University of Canterbury` and 52 carry
   * `building=university`, none of them with another operator; Dovedale's box has 12
   * `building=university` and no operator on them; in the Arts Centre's box UC's one building,
   * Music & Classics, carries UC's operator, and the University of Otago's one
   * `building=university` carries Otago's. So a building is taken by its operator, or by
   * `building=university` with no other operator named, and by its name, which is what it is called
   * on the map. A home is never considered (NOT_HOME). A building's campus is the area it stands in,
   * named as UC's "Our campuses" page names it. The pull request that built it lists every building
   * it takes and every one it leaves out.
   */
  osmBuildings: {
    campuses: [
      { id: "ilam", name: "Ilam campus", area: "central" },
      { id: "dovedale", name: "Dovedale campus", area: "dovedale" },
      { id: "arts-centre", name: "Arts Centre", area: "arts-centre" },
    ],
    candidates: [{ operator: UC, building: NOT_HOME }, { operator: UC, building: null }, { building: /^university$/ }],
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
        when: { building: /^construction$/ },
        take: false,
        reason: `OpenStreetMap maps it as a building under construction (building=construction), not as a building in use. ${SURROUNDINGS}`,
      },
      {
        when: { man_made: /^bridge$/ },
        take: false,
        reason:
          "A bridge between buildings (man_made=bridge), not a building that stands on the ground. The surroundings keep it as a bridge, drawn from the height it starts at (min_height or building:min_level) unless it overlaps one of UC's buildings on the map; where its tags give no height, it is not drawn.",
      },
      {
        // A level of 0 is the ground floor: Ernest Rutherford is tagged so, and stands on the ground.
        when: { "building:min_level": /^(?!0+(\.0+)?$)./ },
        take: false,
        reason:
          "It starts above the ground (building:min_level): a bridge or storeys over a passage, not a building that stands on the ground. The surroundings draw it from the height it starts at, unless it overlaps one of UC's buildings on the map.",
      },
      {
        when: { "building:levels": /^0+(\.0+)?$/ },
        take: false,
        reason:
          "OpenStreetMap gives it no storey above the ground (building:levels=0): it is under the ground, and the campus draws each building as a block standing on it. The surroundings draw it 1 m high, from its tags, unless it overlaps one of UC's buildings on the map or covers less than 12 square metres.",
      },
      {
        when: { name: null },
        take: false,
        reason: `No name to call it by: OpenStreetMap gives UC's buildings no building code (ref), and this one no name. ${SURROUNDINGS}`,
      },
      { when: { operator: UC }, take: true, reason: "operator=University of Canterbury, and a name." },
      {
        when: { building: /^university$/, operator: null },
        take: true,
        reason:
          "building=university with no operator tag, and a name. The one other university with a building in UC's boxes, the University of Otago in the Arts Centre's, names itself as its operator.",
      },
      {
        when: { operator: /./ },
        take: false,
        reason: `Its operator tag names another operator, not UC. ${SURROUNDINGS}`,
      },
    ],
    provides:
      "UC's buildings on its Ilam and Dovedale campuses and at the Arts Centre, picked by their operator and building tags: outlines, names, and heights where tagged. Surrounding buildings, streets, paths, parks and trees",
  },
  /** docs/schools/uc.md, "Verdicts". */
  layers: {
    buildings: "usable",
    indoor: "needs-permission",
    timetable: "needs-permission",
    calendar: "needs-permission",
    subjects: "needs-permission",
    terrain: "usable",
  },
};
