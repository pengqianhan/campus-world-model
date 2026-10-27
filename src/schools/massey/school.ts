// Te Kunenga ki Pūrehuroa Massey University's descriptor (docs/schools/DESIGN.md, section 5): data
// only. Massey is in the Buildings form (DESIGN.md, section 2): the buildings of its campuses come
// from OpenStreetMap by a rule on their tags, on the LINZ ground. Its rooms, class times, dates and
// course list are not shown (docs/schools/massey.md, "Verdicts").
import type { SceneArea, School } from "../../shared/school.ts";
import en from "./locales/en.json";

/**
 * The Manawatū campus at Turitea, Palmerston North, Massey's largest. The recon gives an address,
 * "Tennent Drive, Turitea", and no map point (docs/schools/massey.md, "Campuses"). So the box was
 * drawn before the fetch round the campus south of the Manawatū River, about 1.3 km on every side of
 * where the campus was expected, without asking any host; Tennent Drive, University Avenue and
 * Library Road run through the snapshot ("On the site" in massey.md gives the margins). Its id is
 * "central", the area the app loads first. Its raw snapshot carries the school's id first (DESIGN.md,
 * section 3). The maintainer let the loop fetch it on 2026-10-27.
 */
const MANAWATU: SceneArea = { id: "central", bbox: [-40.3967, 175.6022, -40.3733, 175.6328], osm: "osm/context-massey-manawatu.json" };

/** The operator tag OpenStreetMap gives Massey's buildings: "Massey University / Te Kunenga ki Pūrehuroa" on the Manawatū library. */
const MASSEY = /^Massey University\b/;

/** A name that says Massey. */
const NAMED_MASSEY = /\bMassey\b/;

/**
 * OpenStreetMap's `building` values for a building people live or stay in (its "Accommodation"
 * types). Floors where people live stay blank (AGENTS.md, "Places, not people"), so a home is never
 * one of Massey's campus buildings, whatever its tags: it stays in the surroundings with no name,
 * as the Manawatū halls of residence do.
 */
export const HOMES: readonly string[] = ["apartments", "barracks", "bungalow", "cabin", "detached", "annexe", "dormitory", "farm", "ger",
  "hotel", "house", "houseboat", "residential", "semidetached_house", "static_caravan", "stilt_house", "terrace", "tree_house", "trullo"];

/** A `building` value other than a home's (HOMES). */
const NOT_HOME = new RegExp(`^(?!(?:${HOMES.join("|")})$)`);

/** A `building` value other than a home's or a kindergarten's: what a building found only by a name that says Massey may be. */
const NOT_BLANK = new RegExp(`^(?!(?:${[...HOMES, "kindergarten"].join("|")})$)`);

/** An `amenity` value other than a childcare centre's. */
const NOT_CHILDCARE = /^(?!(?:childcare|kindergarten)$)/;

/**
 * A building found by a tag that says Massey: its name, the house name of its address, or the place
 * of its address (addr:city, which the Auckland campus's mappers set to "Massey University albany").
 * A home or a childcare centre with such a name is never a candidate, so its name is published
 * nowhere: the Manawatū campus's "Massey Kids' Club" stays blank, as do the Auckland campus's
 * halls, whose operator tag is Massey's.
 */
const namedMassey = (key: string) => [
  { [key]: NAMED_MASSEY, building: NOT_BLANK, amenity: null },
  { [key]: NAMED_MASSEY, building: NOT_BLANK, amenity: NOT_CHILDCARE },
];

/**
 * Matches nothing. Massey's rooms are not used in the Buildings form, so no room code is read: the
 * School type asks for a grammar, and this is the least the type and tests/schools.test.ts accept.
 * It is not Massey's grammar, and none is made up.
 */
const NONE = /(?!)/;

const PART = "A building part (building:part), not a building. The campus takes whole buildings only; the part stays in the surroundings.";
const SURROUNDINGS =
  "The surroundings draw it as they draw any other building, unless it overlaps one of Massey's buildings on the map or covers less than 12 square metres.";

export const school: School = {
  id: "massey",
  /** The middle of the extent of the Manawatū campus buildings the rule takes, in osm/context-massey-manawatu.json. */
  origin: { lat: -40.3882, lon: 175.62 },
  /** The Manawatū campus. */
  sun: { lat: -40.3882, lon: 175.62 },
  weather:
    "https://api.open-meteo.com/v1/forecast?latitude=-40.3882&longitude=175.62" +
    "&current=temperature_2m,weather_code,cloud_cover,precipitation,wind_speed_10m,wind_direction_10m&timezone=Pacific%2FAuckland",
  /**
   * The Manawatū campus buildings span about 910 m east to west and 880 m north to south. Four of
   * them, Science Towers A to D, are the tallest (4 levels each) and stand side by side, so their
   * labels overlap from afar. The opening view frames 525 m round the campus's centre: at 1440 x 900
   * it labels 27 of the 39 buildings, with Towers B, C and D among them. With 900 m framed it labels
   * 24, and Tower C's label gives way to its neighbours'. The Auckland and Wellington campuses are
   * framed by the rule for a campus away from the centre.
   */
  campusSpan: { manawatu: 525 },
  /**
   * The Auckland campus at Albany and the Wellington campus at Mount Cook, each in an area of its own,
   * as the other schools' campuses away from the centre are (docs/schools/massey.md, "Campuses";
   * "On the site" says how each box was placed). The recon gives each an address and no map point.
   * Auckland's box was drawn wide round the East Precinct on the Albany Expressway, about 1.3 km on
   * every side, without asking any host. Wellington's was drawn round Wallace Street and Tasman
   * Street, Mount Cook, from Otago's deleted Mein Street snapshot of 2026-10-27, which held "Massey
   * University Block 7" at its northern edge. The maintainer let the loop fetch them on 2026-10-27.
   * Their raw snapshots carry the school's id first (DESIGN.md, section 3).
   */
  areas: {
    central: MANAWATU,
    remote: [
      { id: "auckland", bbox: [-36.7436, 174.6823, -36.7184, 174.7137], osm: "osm/context-massey-auckland.json" },
      { id: "wellington", bbox: [-41.307, 174.771, -41.297, 174.782], osm: "osm/context-massey-wellington.json" },
    ],
  },
  roomCode: { building: NONE, wing: NONE, room: NONE, floorLetters: [], equivalentFloors: [] },
  words: { en },
  /**
   * The rule on OpenStreetMap's tags that picks Massey's buildings ("A school whose campus map cannot
   * be used" in PROGRESS.md, "Decisions"), as VUW's, UC's and Otago's do. OpenStreetMap gives one
   * of them a `ref` (SNW, the Sir Neil Waters Lecture Theatres). In the three boxes 2 buildings carry
   * `operator=Massey University…` (and 5 halls, which are homes), 86 carry `building=university`
   * with no operator, 2 more carry `amenity=university`, and 8 that carry neither are found only by
   * a tag that says Massey (`name`, `addr:housename`, or `addr:city`); a childcare centre and a block
   * of flats whose names say Massey are not candidates. No other university or
   * polytechnic has a building in them; the schools beside the campuses (Kristin School, Albany's
   * high schools, Wellington High School and Wellington College) tag theirs `building=school`. So a
   * building is taken by Massey's operator tag; by `building=university` or `amenity=university` with
   * no other operator named; or by a tag that says Massey; and by its name, which is what it is
   * called on the map. A home is never considered, and a childcare centre is left out before any step
   * that would take it. A building that no tag traces to Massey is not a candidate: the Crown research
   * institutes and companies beside the Manawatū campus tag theirs `building=office`, `industrial`
   * or `yes`, and so do many of Massey's own buildings. A building's campus is the area it stands in,
   * named as Massey's campus pages name it. The pull request that built it lists every building it
   * takes and every one it leaves out.
   */
  osmBuildings: {
    campuses: [
      { id: "manawatu", name: "Manawatū campus", area: "central" },
      { id: "auckland", name: "Auckland campus", area: "auckland" },
      { id: "wellington", name: "Wellington campus", area: "wellington" },
    ],
    candidates: [
      { operator: MASSEY, building: NOT_HOME },
      { operator: MASSEY, building: null },
      { building: /^university$/ },
      { amenity: /^university$/, building: NOT_HOME },
      ...namedMassey("name"),
      ...namedMassey("addr:housename"),
      ...namedMassey("addr:city"),
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
        when: { man_made: /^bridge$/ },
        take: false,
        reason:
          "A bridge between buildings (man_made=bridge), not a building that stands on the ground. The surroundings keep it as a bridge, drawn from the height it starts at (min_height or building:min_level) unless it overlaps one of Massey's buildings on the map; where its tags give no height, it is not drawn.",
      },
      {
        // A level of 0 is the ground floor, and a building that starts there stands on the ground.
        when: { "building:min_level": /^(?!0+(\.0+)?$)./ },
        take: false,
        reason:
          "It starts above the ground (building:min_level): a bridge or storeys over a passage, not a building that stands on the ground. The surroundings draw it from the height it starts at, unless it overlaps one of Massey's buildings on the map.",
      },
      {
        when: { "building:levels": /^0+(\.0+)?$/ },
        take: false,
        reason:
          "OpenStreetMap gives it no storey above the ground (building:levels=0): it is under the ground, and the campus draws each building as a block standing on it. The surroundings draw it 1 m high, from its tags, unless it overlaps one of Massey's buildings on the map or covers less than 12 square metres.",
      },
      {
        when: { fixme: /./ },
        take: false,
        reason: `Its fixme tag asks mappers to check it, and the record keeps the tag's words: the rule does not take a building whose own tags are in doubt. ${SURROUNDINGS}`,
      },
      {
        when: { name: null },
        take: false,
        reason: `No name to call it by: OpenStreetMap gives Massey's buildings no building code (ref), and this one no name tag (the house name of an address is not read as a name). ${SURROUNDINGS}`,
      },
      { when: { operator: MASSEY }, take: true, reason: "operator=Massey University, and a name." },
      {
        when: { operator: /./ },
        take: false,
        reason: `Its operator tag names another operator, not Massey. ${SURROUNDINGS}`,
      },
      {
        when: { building: /^university$/ },
        take: true,
        reason:
          "building=university with no operator tag, and a name. No other university or polytechnic has a building=university in Massey's three boxes, and no other operator is named.",
      },
      {
        when: { amenity: /^university$/ },
        take: true,
        reason: "amenity=university with no operator tag, and a name. No other university or polytechnic stands in Massey's three boxes, and no other operator is named.",
      },
      { when: { name: NAMED_MASSEY }, take: true, reason: "Its name says Massey, and no other operator is named." },
      {
        when: { "addr:housename": NAMED_MASSEY },
        take: true,
        reason: "The house name of its address says Massey, and no other operator is named. The map calls it by its name tag.",
      },
      {
        when: { "addr:city": NAMED_MASSEY },
        take: true,
        reason: "Its address gives Massey University as its place (addr:city), and no other operator is named. The map calls it by its name tag.",
      },
    ],
    provides:
      "Massey's buildings on its Manawatū, Auckland and Wellington campuses, picked by their operator, building and name tags: outlines, names, and heights where tagged. Surrounding buildings, streets, paths, parks and trees",
  },
  /** docs/schools/massey.md, "Verdicts". */
  layers: {
    buildings: "usable",
    indoor: "needs-permission",
    timetable: "needs-permission",
    calendar: "usable",
    subjects: "usable",
    terrain: "usable",
  },
};
