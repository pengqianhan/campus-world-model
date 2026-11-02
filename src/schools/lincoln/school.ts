// Lincoln University's descriptor (docs/schools/DESIGN.md, section 5): data only. Lincoln is in the
// Buildings form (DESIGN.md, section 2): the buildings of its Lincoln campus come from OpenStreetMap,
// on the LINZ ground, and only those OpenStreetMap's own tags call the University's (the
// maintainer's decision of 2026-11-02). Its rooms, class times, dates and course list are not shown
// (docs/schools/lincoln.md, "Verdicts"). Nothing is asked of any Lincoln University host: the
// robots.txt of www.lincoln.ac.nz closes it to this project's agents.
import type { SceneArea, School } from "../../shared/school.ts";
import en from "./locales/en.json";

/**
 * The Lincoln campus, in the town of Lincoln. The recon read no address, so the box was drawn
 * before the fetch, about 1.3 km on every side of the point that two public pages found by web
 * search give for "Lincoln University" (NZ Topo Map and Wikipedia), without asking any host
 * (docs/schools/lincoln.md, "The OpenStreetMap check"). The buildings the rule below takes lie 1,057
 * to 1,216 m inside its edges. Its id is "central", the area the app loads first. Its raw snapshot
 * carries the school's id first (DESIGN.md, section 3). The maintainer let the loop fetch it on
 * 2026-10-27.
 */
const LINCOLN: SceneArea = { id: "central", bbox: [-43.6561, 172.4508, -43.6327, 172.4832], osm: "osm/context-lincoln.json" };

/** The operator tag OpenStreetMap gives Lincoln University's buildings. */
const LINCOLN_UNIVERSITY = /^Lincoln University$/;

/**
 * OpenStreetMap's `building` values for a building people live or stay in (its "Accommodation"
 * types). Floors where people live stay blank (AGENTS.md, "Places, not people"), so a home is never
 * one of Lincoln's campus buildings, whatever its operator: it stays in the surroundings with no
 * name. The campus's halls of residence carry building=yes and neither of the rule's tags, so the
 * rule never considers them.
 */
export const HOMES: readonly string[] = ["apartments", "barracks", "bungalow", "cabin", "detached", "annexe", "dormitory", "farm", "ger",
  "hotel", "house", "houseboat", "residential", "semidetached_house", "static_caravan", "stilt_house", "terrace", "tree_house", "trullo"];

/** A `building` value other than a home's (HOMES). */
const NOT_HOME = new RegExp(`^(?!(?:${HOMES.join("|")})$)`);

/**
 * Matches nothing. Lincoln's rooms are not used in the Buildings form, so no room code is read: the
 * School type asks for a grammar, and this is the least the type and tests/schools.test.ts accept.
 * It is not Lincoln's grammar, and none is made up.
 */
const NONE = /(?!)/;

const PART = "A building part (building:part), not a building. The campus takes whole buildings only; the part stays in the surroundings.";
const SURROUNDINGS =
  "The surroundings draw it as they draw any other building, unless it overlaps one of Lincoln University's buildings on the map or covers less than 12 square metres.";

/** Why Memorial Hall, tagged building=university, is not shown as one of the University's buildings in use. */
const DISUSED = `OpenStreetMap maps it as disused (disused=yes): a building that is not in use. ${SURROUNDINGS}`;

/** Why the building OpenStreetMap names AgResearch, tagged building=university, is not shown as Lincoln University's. */
const AGRESEARCH = `Its name, AgResearch, is the name of another body, not Lincoln University's: building=university alone does not make a building the University's when its name says whose it is. ${SURROUNDINGS}`;

export const school: School = {
  id: "lincoln",
  /** The middle of the extent of the Lincoln campus buildings the rule takes, in osm/context-lincoln.json. */
  origin: { lat: -43.6439, lon: 172.4666 },
  /** The Lincoln campus. */
  sun: { lat: -43.6439, lon: 172.4666 },
  weather:
    "https://api.open-meteo.com/v1/forecast?latitude=-43.6439&longitude=172.4666" +
    "&current=temperature_2m,weather_code,cloud_cover,precipitation,wind_speed_10m,wind_direction_10m&timezone=Pacific%2FAuckland",
  /** The campus buildings the rule takes span about 430 m east to west and 280 m north to south. */
  campusSpan: { lincoln: 500 },
  /**
   * The Lincoln campus alone. The recon names no other place it could read: Lincoln's own pages,
   * which would list its campuses, research farms and other sites, are on the closed host
   * (docs/schools/lincoln.md, "Campuses").
   */
  areas: {
    central: LINCOLN,
    remote: [],
  },
  roomCode: { building: NONE, wing: NONE, room: NONE, floorLetters: [], equivalentFloors: [] },
  words: { en },
  /**
   * The rule on OpenStreetMap's tags that picks Lincoln University's buildings ("A school whose
   * campus map cannot be used" in PROGRESS.md, "Decisions"). The maintainer decided on 2026-11-02
   * that Lincoln goes on the site with only the buildings OpenStreetMap tags as the University's. In
   * the box 2 buildings carry `operator=Lincoln University` (the Recreation Centre and a bicycle
   * shed) and 12 carry `building=university`, none with another operator; none carries
   * `amenity=university`, and no other tag on a building names the University. So a building is
   * taken by its operator, or by `building=university` with no other operator named, and by its
   * name, which is what it is called on the map. That takes 8 of the campus's 163 buildings; the
   * rest stand in the surroundings, with no name. Of the 13 candidates the rule leaves out 5: the
   * two `building=university` outlines with no name and the bicycle shed, Memorial Hall, which
   * OpenStreetMap maps as disused, and the building it names AgResearch. A home is never considered
   * (NOT_HOME). The 73 buildings east of Springs Road whose operator is the Bioeconomy Science
   * Institute carry neither tag, so they are not candidates either. OpenStreetMap gives none of the
   * buildings a `ref`.
   *
   * The maintainer may later take more of the campus's buildings from the University's own campus
   * map, as for Waikato: a table (`campusMap`, with its steps marked `map`) then joins this rule.
   * None is added now.
   */
  osmBuildings: {
    campuses: [{ id: "lincoln", name: "Lincoln campus", area: "central" }],
    candidates: [{ operator: LINCOLN_UNIVERSITY, building: NOT_HOME }, { operator: LINCOLN_UNIVERSITY, building: null }, { building: /^university$/ }],
    steps: [
      { when: { building: null }, take: false, reason: PART },
      { when: { building: /^no$/ }, take: false, reason: PART },
      {
        when: { amenity: /^(childcare|kindergarten)$/ },
        take: false,
        reason: "A childcare centre. Childcare centres stay blank: it stays in the surroundings, with no name.",
      },
      {
        when: { building: /^kindergarten$/ },
        take: false,
        reason: "A kindergarten (building=kindergarten). Childcare centres stay blank: it stays in the surroundings, with no name.",
      },
      {
        when: { name: /child ?care|kindergarten|kōhanga|early childhood|kids'? club/i },
        take: false,
        reason: "A childcare centre, by its name. Childcare centres stay blank: it stays in the surroundings, with no name.",
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
        // Reading its note tag here keeps the note's words in the record's original text.
        when: { disused: /^yes$/, note: /./ },
        take: false,
        reason: `${DISUSED} Its note tag, kept in this record, says why.`,
      },
      { when: { disused: /^yes$/ }, take: false, reason: DISUSED },
      {
        when: { man_made: /^bridge$/ },
        take: false,
        reason:
          "A bridge between buildings (man_made=bridge), not a building that stands on the ground. The surroundings keep it as a bridge, drawn from the height it starts at (min_height or building:min_level) unless it overlaps one of Lincoln University's buildings on the map; where its tags give no height, it is not drawn.",
      },
      {
        // A level of 0 is the ground floor, and a building that starts there stands on the ground.
        when: { "building:min_level": /^(?!0+(\.0+)?$)./ },
        take: false,
        reason:
          "It starts above the ground (building:min_level): a bridge or storeys over a passage, not a building that stands on the ground. The surroundings draw it from the height it starts at, unless it overlaps one of Lincoln University's buildings on the map.",
      },
      {
        when: { "building:levels": /^0+(\.0+)?$/ },
        take: false,
        reason:
          "OpenStreetMap gives it no storey above the ground (building:levels=0): it is under the ground, and the campus draws each building as a block standing on it. The surroundings draw it 1 m high, from its tags, unless it overlaps one of Lincoln University's buildings on the map or covers less than 12 square metres.",
      },
      {
        when: { fixme: /./ },
        take: false,
        reason: `Its fixme tag asks mappers to check it, and the record keeps the tag's words: the rule does not take a building whose own tags are in doubt. ${SURROUNDINGS}`,
      },
      {
        when: { name: null },
        take: false,
        reason: `No name to call it by: OpenStreetMap gives Lincoln University's buildings no building code (ref), and this one no name. ${SURROUNDINGS}`,
      },
      {
        // Reading its description tag here keeps the description's words in the record's original text.
        when: { name: /^AgResearch\b/, description: /./ },
        take: false,
        reason: `${AGRESEARCH} Its description tag, kept in this record, says what it is.`,
      },
      { when: { name: /^AgResearch\b/ }, take: false, reason: AGRESEARCH },
      { when: { operator: LINCOLN_UNIVERSITY }, take: true, reason: "operator=Lincoln University, and a name." },
      {
        when: { building: /^university$/, operator: null },
        take: true,
        reason:
          "building=university with no operator tag, and a name: no building=university in the Lincoln campus's box names another operator.",
      },
      {
        when: { operator: /./ },
        take: false,
        reason: `Its operator tag names another operator, not Lincoln University. ${SURROUNDINGS}`,
      },
    ],
    provides:
      "Lincoln University's buildings on its Lincoln campus, chosen by OpenStreetMap's tags (operator=Lincoln University, or building=university, and a name; one mapped as disused and one named for another body are left out): outlines, names, and heights where tagged. Every other building on the campus, and the streets, paths, parks and trees round it, as surroundings",
  },
  /** docs/schools/lincoln.md, "Verdicts"; for buildings and terrain, "On the site (2026-11-02)". */
  layers: {
    buildings: "usable",
    indoor: "needs-permission",
    timetable: "needs-permission",
    calendar: "needs-permission",
    subjects: "needs-permission",
    terrain: "usable",
  },
};
