// University of Otago | Ōtākou Whakaihu Waka's descriptor (docs/schools/DESIGN.md, section 5):
// data only. Otago is in the Buildings form (DESIGN.md, section 2): the buildings of its Dunedin and
// Christchurch campuses come from OpenStreetMap by a rule on their tags, on the LINZ ground. Its
// rooms, class times, dates and course list are not shown (docs/schools/otago.md, "Verdicts").
import type { SceneArea, School } from "../../shared/school.ts";
import en from "./locales/en.json";

/**
 * The Dunedin campus. The recon gives addresses and no map point (docs/schools/otago.md,
 * "Campuses"): 362 Leith Street, the Central Hub at the corner of Albany and Cumberland Streets and
 * the College of Education at 145 Union Street East. So the box was drawn before the fetch round
 * those streets in North Dunedin, wide on every side, without asking any host; the snapshot's own
 * streets and the buildings the rule below takes lie inside it ("On the site" in otago.md gives
 * their margins). Its id is "central", the area the app loads first. Its raw snapshot carries the
 * school's id first (DESIGN.md, section 3). The maintainer let the loop fetch it on 2026-10-27.
 */
const DUNEDIN: SceneArea = { id: "central", bbox: [-45.875, 170.503, -45.858, 170.5265], osm: "osm/context-otago-dunedin.json" };

/** The operator tag OpenStreetMap gives Otago's buildings. */
const OTAGO = /^University of Otago$/;

/**
 * OpenStreetMap's `building` values for a building people live or stay in (its "Accommodation"
 * types). Floors where people live stay blank (AGENTS.md, "Places, not people"), so a home is never
 * one of Otago's campus buildings, whatever its operator: it stays in the surroundings with no name,
 * as Dunedin's residential colleges do.
 */
export const HOMES: readonly string[] = ["apartments", "barracks", "bungalow", "cabin", "detached", "annexe", "dormitory", "farm", "ger",
  "hotel", "house", "houseboat", "residential", "semidetached_house", "static_caravan", "stilt_house", "terrace", "tree_house", "trullo"];

/** A `building` value other than a home's (HOMES). */
const NOT_HOME = new RegExp(`^(?!(?:${HOMES.join("|")})$)`);

/**
 * Matches nothing. Otago's rooms are not used in the Buildings form, so no room code is read: the
 * School type asks for a grammar, and this is the least the type and tests/schools.test.ts accept.
 * It is not Otago's grammar, and none is made up.
 */
const NONE = /(?!)/;

const PART = "A building part (building:part), not a building. The campus takes whole buildings only; the part stays in the surroundings.";
const SURROUNDINGS =
  "The surroundings draw it as they draw any other building, unless it overlaps one of Otago's buildings on the map or covers less than 12 square metres.";

export const school: School = {
  id: "otago",
  /** The middle of the extent of the Dunedin campus buildings the rule takes, in osm/context-otago-dunedin.json. */
  origin: { lat: -45.8661, lon: 170.5167 },
  /** The Dunedin campus. */
  sun: { lat: -45.8661, lon: 170.5167 },
  weather:
    "https://api.open-meteo.com/v1/forecast?latitude=-45.8661&longitude=170.5167" +
    "&current=temperature_2m,weather_code,cloud_cover,precipitation,wind_speed_10m,wind_direction_10m&timezone=Pacific%2FAuckland",
  /**
   * The Dunedin campus buildings span about 1,460 m east to west and 870 m north to south. The
   * opening view frames 900 m round the campus's centre, where most of them stand, so that their
   * labels have room: 41 of the 94 show at 1440 x 900, against 27 with the whole extent framed.
   */
  campusSpan: { dunedin: 900 },
  /**
   * Christchurch, in an area of its own, as the other schools' campuses away from the centre are
   * (docs/schools/otago.md, "Campuses"; "On the site" says how its box was placed). The recon gives
   * it an address, 2 Riccarton Avenue, Christchurch Hospital's, and no point. The University of
   * Canterbury's Arts Centre snapshot (osm/context-uc-arts-centre.json, pull request #110) holds
   * Otago's Department of General Practice at 14 Gloucester Street (operator=University of Otago)
   * and the hospital's School of Medicine (building=hospital), so the box was drawn round the
   * hospital and those two before the fetch; Otago's buildings in it lie 245 to 277 m inside its
   * edges. The Wellington
   * and Invercargill boxes held no building that OpenStreetMap traces to Otago, so those campuses
   * are not on the site (Real or absent). The maintainer let the loop fetch them on 2026-10-27.
   * Their raw snapshots carry the school's id first (DESIGN.md, section 3).
   */
  areas: {
    central: DUNEDIN,
    remote: [{ id: "christchurch", bbox: [-43.5372, 172.6215, -43.5275, 172.632], osm: "osm/context-otago-christchurch.json" }],
  },
  roomCode: { building: NONE, wing: NONE, room: NONE, floorLetters: [], equivalentFloors: [] },
  words: { en },
  /**
   * The rule on OpenStreetMap's tags that picks Otago's buildings ("A school whose campus map cannot
   * be used" in PROGRESS.md, "Decisions"), as VUW's and UC's do. OpenStreetMap gives none of them a
   * `ref`. In the Dunedin box 2 buildings carry `operator=University of Otago` and 147 carry
   * `building=university` with no operator; 15 more carry `building=university` with
   * `operator=Otago Polytechnic`, the one other tertiary school in it. In the
   * Christchurch box 2 carry Otago's operator, and 2 `building=university` with no operator. So a
   * building is taken by its operator, or by `building=university` with no other operator named,
   * and by its name, which is what it is called on the map. A home is never considered (NOT_HOME).
   * A building of another body is left out: a hospital's (building=hospital), the students'
   * association's, and two on Forth Street that the Polytechnic's tags place among its own. A
   * building's campus is the area it stands in, named as Otago's AskOtago pages name it. The pull
   * request that built it lists every building it takes and every one it leaves out.
   */
  osmBuildings: {
    campuses: [
      { id: "dunedin", name: "Dunedin campus", area: "central" },
      { id: "christchurch", name: "Christchurch campus", area: "christchurch" },
    ],
    candidates: [
      { operator: OTAGO, building: NOT_HOME },
      { operator: OTAGO, building: null },
      { building: /^university$/ },
      { amenity: /^university$/, building: NOT_HOME },
    ],
    steps: [
      { when: { building: null }, take: false, reason: PART },
      { when: { building: /^no$/ }, take: false, reason: PART },
      {
        when: { amenity: /^(childcare|kindergarten)$/ },
        take: false,
        reason: "A childcare centre. Childcare centres stay blank: it stays in the surroundings, with no name.",
      },
      {
        when: { name: /child ?care|kindergarten|kōhanga|early childhood/i },
        take: false,
        reason: "A childcare centre, by its name. Childcare centres stay blank: it stays in the surroundings, with no name.",
      },
      {
        when: { description: /child ?care|kindergarten/i },
        take: false,
        reason: "It holds a childcare centre, by its description. Childcare centres stay blank: it stays in the surroundings, with no name.",
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
          "A bridge between buildings (man_made=bridge), not a building that stands on the ground. The surroundings keep it as a bridge, drawn from the height it starts at (min_height or building:min_level) unless it overlaps one of Otago's buildings on the map; where its tags give no height, it is not drawn.",
      },
      {
        // A level of 0 is the ground floor, and a building that starts there stands on the ground.
        when: { "building:min_level": /^(?!0+(\.0+)?$)./ },
        take: false,
        reason:
          "It starts above the ground (building:min_level): a bridge or storeys over a passage, not a building that stands on the ground. The surroundings draw it from the height it starts at, unless it overlaps one of Otago's buildings on the map.",
      },
      {
        when: { "building:levels": /^0+(\.0+)?$/ },
        take: false,
        reason:
          "OpenStreetMap gives it no storey above the ground (building:levels=0): it is under the ground, and the campus draws each building as a block standing on it. The surroundings draw it 1 m high, from its tags, unless it overlaps one of Otago's buildings on the map or covers less than 12 square metres.",
      },
      {
        when: { name: null },
        take: false,
        reason: `No name to call it by: OpenStreetMap gives Otago's buildings no building code (ref), and this one no name. ${SURROUNDINGS}`,
      },
      { when: { operator: OTAGO }, take: true, reason: "operator=University of Otago, and a name." },
      {
        when: { building: /^hospital$/ },
        take: false,
        reason: `A hospital building (building=hospital) on Christchurch Hospital's grounds, with no operator tag. amenity=university and its name, School of Medicine, do not say which university's it is, so OpenStreetMap does not trace it to Otago: a building of another body is shown as Otago's only where its own tags say so, as for the Malaghan Institute at VUW. ${SURROUNDINGS}`,
      },
      {
        when: { name: /^(Otago University Students Association|OUSA\b)/ },
        take: false,
        reason: `By its name, a building of the Otago University Students' Association (OUSA), a body of its own, not a part of the University, although it is tagged building=university. ${SURROUNDINGS}`,
      },
      {
        when: { name: /^[A-Z] Block$/, operator: null },
        take: false,
        reason: `Named as one of Otago Polytechnic's lettered blocks on Forth Street: A, D, F, G, H, I, L, N, O, P, S and T Block all carry operator=Otago Polytechnic, and this one carries no operator, so OpenStreetMap does not trace it to Otago. ${SURROUNDINGS}`,
      },
      {
        when: { name: /^Poho$/, operator: null },
        take: false,
        reason: `No tag says whose it is, and it stands among Otago Polytechnic's buildings on Forth Street, between A Block and B Block, so OpenStreetMap does not trace it to Otago. ${SURROUNDINGS}`,
      },
      {
        when: { building: /^university$/, operator: null },
        take: true,
        reason:
          "building=university with no operator tag, and a name. The one other tertiary school with buildings in Otago's boxes, Otago Polytechnic in Dunedin's, names itself as their operator.",
      },
      {
        when: { operator: /./ },
        take: false,
        reason: `Its operator tag names another operator, not Otago. ${SURROUNDINGS}`,
      },
    ],
    provides:
      "Otago's buildings on its Dunedin and Christchurch campuses, picked by their operator and building tags: outlines, names, and heights where tagged. Surrounding buildings, streets, paths, parks and trees",
  },
  /** docs/schools/otago.md, "Verdicts". */
  layers: {
    buildings: "usable",
    indoor: "needs-permission",
    timetable: "needs-permission",
    calendar: "needs-permission",
    subjects: "needs-permission",
    terrain: "usable",
  },
};
