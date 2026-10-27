// The University of Waikato's descriptor (docs/schools/DESIGN.md, section 5): data only. Waikato is
// in the Buildings form (DESIGN.md, section 2): the buildings of its campuses come from
// OpenStreetMap by a rule on their tags, on the LINZ ground. Its rooms, class times, dates and paper
// list are not shown (docs/schools/waikato.md, "Verdicts"). Nothing is asked of any Waikato host:
// its robots.txt closes www.waikato.ac.nz to this project's agents.
import type { SceneArea, School } from "../../shared/school.ts";
import en from "./locales/en.json";

/**
 * The Hamilton campus in Hillcrest. The recon gives an address, by web search only, "Gate 1,
 * Knighton Road", and no map point (docs/schools/waikato.md, "Campuses"). So the box was drawn
 * before the fetch round the campus east of Knighton Road, about 1.2 km on every side of where the
 * campus was expected, without asking any host; Knighton Road, Hillcrest Road, Silverdale Road and
 * Ruakura Road run through the snapshot ("On the site" in waikato.md gives the margins). Its id is
 * "central", the area the app loads first. Its raw snapshot carries the school's id first
 * (DESIGN.md, section 3). The maintainer let the loop fetch it on 2026-10-27.
 */
const HAMILTON: SceneArea = { id: "central", bbox: [-37.799, 175.304, -37.777, 175.331], osm: "osm/context-waikato-hamilton.json" };

/** The operator tag OpenStreetMap gives Waikato's buildings. */
const WAIKATO = /^University of Waikato$/;

/**
 * OpenStreetMap's `building` values for a building people live or stay in (its "Accommodation"
 * types). Floors where people live stay blank (AGENTS.md, "Places, not people"), so a home is never
 * one of Waikato's campus buildings, whatever its tags: it stays in the surroundings with no name,
 * as the Orchard Park Apartments on the Hamilton campus do, whose operator tag is Waikato's.
 */
export const HOMES: readonly string[] = ["apartments", "barracks", "bungalow", "cabin", "detached", "annexe", "dormitory", "farm", "ger",
  "hotel", "house", "houseboat", "residential", "semidetached_house", "static_caravan", "stilt_house", "terrace", "tree_house", "trullo"];

/** A `building` value other than a home's (HOMES). */
const NOT_HOME = new RegExp(`^(?!(?:${HOMES.join("|")})$)`);

/**
 * Matches nothing. Waikato's rooms are not used in the Buildings form, so no room code is read: the
 * School type asks for a grammar, and this is the least the type and tests/schools.test.ts accept.
 * It is not Waikato's grammar, and none is made up.
 */
const NONE = /(?!)/;

const PART = "A building part (building:part), not a building. The campus takes whole buildings only; the part stays in the surroundings.";
const SURROUNDINGS =
  "The surroundings draw it as they draw any other building, unless it overlaps one of Waikato's buildings on the map or covers less than 12 square metres.";

export const school: School = {
  id: "waikato",
  /** The middle of the extent of the Hamilton campus buildings the rule takes, in osm/context-waikato-hamilton.json. */
  origin: { lat: -37.7865, lon: 175.315 },
  /** The Hamilton campus. */
  sun: { lat: -37.7865, lon: 175.315 },
  weather:
    "https://api.open-meteo.com/v1/forecast?latitude=-37.7865&longitude=175.315" +
    "&current=temperature_2m,weather_code,cloud_cover,precipitation,wind_speed_10m,wind_direction_10m&timezone=Pacific%2FAuckland",
  /**
   * The Hamilton campus has one building on the map, the Gallagher Academy of Performing Arts, at
   * its western edge by Knighton Road; the rule for one building would frame 260 m round it. The
   * opening view frames 700 m, so that the lakes and the campus's other buildings east of it, which
   * stand among the surroundings, are in view as well.
   */
  campusSpan: { hamilton: 700 },
  /**
   * Hamilton alone. The Tauranga campus's box ([-37.6935, 176.1565, -37.6775, 176.1745], round
   * Durham Street) held no building that OpenStreetMap traces to Waikato: three building=university
   * ways by Durham Street with no name and no operator. So Tauranga is not on the site (Real or
   * absent): its area was taken out again, and its snapshot deleted with its record ("On the site"
   * in waikato.md). Hangzhou is a partner's campus abroad, not part of this.
   */
  areas: {
    central: HAMILTON,
    remote: [],
  },
  roomCode: { building: NONE, wing: NONE, room: NONE, floorLetters: [], equivalentFloors: [] },
  words: { en },
  /**
   * The rule on OpenStreetMap's tags that picks Waikato's buildings ("A school whose campus map
   * cannot be used" in PROGRESS.md, "Decisions"), as the other schools' do. OpenStreetMap gives none
   * of them a `ref`. In the Hamilton box 3 buildings carry `operator=University of Waikato`: the
   * Gallagher Academy of Performing Arts, a bicycle shed with no name, and the Orchard Park
   * Apartments, a home. One carries `building=university`, the medical school's building site, which
   * its name calls a construction site; none carries `amenity=university`. The campus's other
   * buildings carry `building=yes` (some `office` or `retail`) and, at most, a name: J Block, the
   * Student Centre, Te Piringa - Faculty of Law and the rest say nothing of whose they are, and the
   * name "Waikato" is the region's as well as the University's (the Waikato Tennis Centre, Food
   * Innovation Waikato). So a building is taken by Waikato's operator tag, or by
   * `building=university` or `amenity=university` with no other operator named, and by its name,
   * which is what it is called on the map. A home is never considered (NOT_HOME). The snapshot holds
   * no campus outline (`amenity=university` area): `fetch-osm.ts` asks Overpass for buildings,
   * streets, paths, parks and trees. The pull request that built it lists every building it takes
   * and every one it leaves out.
   */
  osmBuildings: {
    campuses: [{ id: "hamilton", name: "Hamilton campus", area: "central" }],
    candidates: [
      { operator: WAIKATO, building: NOT_HOME },
      { operator: WAIKATO, building: null },
      { building: /^university$/ },
      { amenity: /^university$/, building: NOT_HOME },
    ],
    steps: [
      { when: { building: null }, take: false, reason: PART },
      { when: { building: /^no$/ }, take: false, reason: PART },
      {
        when: { amenity: /^(childcare|kindergarten)$/ },
        take: false,
        reason: "A childcare centre. Childcare centres stay blank: it stays in the surroundings, unnamed on the map.",
      },
      {
        when: { building: /^kindergarten$/ },
        take: false,
        reason: "A kindergarten (building=kindergarten). Childcare centres stay blank: it stays in the surroundings, unnamed on the map.",
      },
      {
        when: { name: /child ?care|kindergarten|kōhanga|early childhood|kids'? club/i },
        take: false,
        reason: "A childcare centre, by its name. Childcare centres stay blank: it stays in the surroundings, unnamed on the map.",
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
        when: { name: /\bconstruction site\b/i },
        take: false,
        reason: `Its name calls it a construction site: the place where a building is going up, not a building in use. ${SURROUNDINGS}`,
      },
      {
        when: { man_made: /^bridge$/ },
        take: false,
        reason:
          "A bridge between buildings (man_made=bridge), not a building that stands on the ground. The surroundings keep it as a bridge, drawn from the height it starts at (min_height or building:min_level) unless it overlaps one of Waikato's buildings on the map; where its tags give no height, it is not drawn.",
      },
      {
        // A level of 0 is the ground floor, and a building that starts there stands on the ground.
        when: { "building:min_level": /^(?!0+(\.0+)?$)./ },
        take: false,
        reason:
          "It starts above the ground (building:min_level): a bridge or storeys over a passage, not a building that stands on the ground. The surroundings draw it from the height it starts at, unless it overlaps one of Waikato's buildings on the map.",
      },
      {
        when: { "building:levels": /^0+(\.0+)?$/ },
        take: false,
        reason:
          "OpenStreetMap gives it no storey above the ground (building:levels=0): it is under the ground, and the campus draws each building as a block standing on it. The surroundings draw it 1 m high, from its tags, unless it overlaps one of Waikato's buildings on the map or covers less than 12 square metres.",
      },
      {
        when: { fixme: /./ },
        take: false,
        reason: `Its fixme tag asks mappers to check it, and the record keeps the tag's words: the rule does not take a building whose own tags are in doubt. ${SURROUNDINGS}`,
      },
      {
        when: { name: null },
        take: false,
        reason: `No name to call it by: it has no name tag and no building code (ref). ${SURROUNDINGS}`,
      },
      { when: { operator: WAIKATO }, take: true, reason: "operator=University of Waikato, and a name." },
      {
        when: { operator: /./ },
        take: false,
        reason: `Its operator tag names another operator, not Waikato. ${SURROUNDINGS}`,
      },
      {
        when: { building: /^university$/ },
        take: true,
        reason: "building=university with no operator tag, and a name.",
      },
      {
        when: { amenity: /^university$/ },
        take: true,
        reason: "amenity=university with no operator tag, and a name.",
      },
    ],
    provides:
      "Waikato's buildings on its Hamilton campus, picked by their operator, building and amenity tags: outlines, names, and heights where tagged. Surrounding buildings, streets, paths, parks and trees",
  },
  /** docs/schools/waikato.md, "Verdicts". */
  layers: {
    buildings: "usable",
    indoor: "needs-permission",
    timetable: "needs-permission",
    calendar: "needs-permission",
    subjects: "needs-permission",
    terrain: "usable",
  },
};
