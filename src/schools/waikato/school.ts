// The University of Waikato's descriptor (docs/schools/DESIGN.md, section 5): data only. Waikato is
// in the Buildings form (DESIGN.md, section 2): the buildings of its Hamilton campus come from
// OpenStreetMap, on the LINZ ground, and the University's own campus map, which the maintainer gave
// the project, says which of them are the University's (CAMPUS_MAP below). Its rooms, class times,
// dates and paper list are not shown (docs/schools/waikato.md, "Verdicts"). Nothing is asked of any
// Waikato host: its robots.txt closes www.waikato.ac.nz to this project's agents.
import type { CampusMapTable, SceneArea, School } from "../../shared/school.ts";
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

/** The reason for a building the map draws with no block code, which OpenStreetMap leaves unnamed. */
const noCode = (where: string) =>
  `The University's campus map draws it ${where} with no block code of its own, and OpenStreetMap gives it no name: there is nothing to call it by. ${SURROUNDINGS}`;

/**
 * Which of OpenStreetMap's buildings are the University's, read off the University's own campus map:
 * "Hamilton Campus Map Update", one A3 page, "Version: Q1 2025", which the maintainer downloaded in
 * their own browser from www.waikato.ac.nz and gave the project on 2026-10-28 (SHA-256 3fd3677df5caf8badba299ada5b77353a6febd4b52f5086868176f026fc2492c).
 * Its address, as the recon gives it from a web search (docs/schools/waikato.md, layer 2), is in
 * `source.url`. No agent of this project fetched it: Waikato's robots.txt closes that host to them.
 * The map is not in the repository, and nothing of it is but the block codes and names below.
 *
 * How the table was made. The map is a drawing, turned about 30 degrees from north and not to an
 * even scale, with a grid (columns A to I, rows 1 to 9) and an index of blocks with their grid
 * squares. Its labelled buildings were tied to OpenStreetMap's named ones (Gallagher Academy, UL1,
 * UL2, ULS, Oranga, SUB, Uni Rec Centre, ITS, LSL, blocks C to S, TT, TC, TL, the management school,
 * Law, the pavilion, Facilities Management, and three buildings east of Hillcrest Road), and every
 * OpenStreetMap outline was laid over the drawing by a local fit to those points. Each outline was
 * then checked by its shape against the building drawn there. A row is "name" where OpenStreetMap's
 * name is the map's name or code for the block, and "place" where the outline stands where the map
 * draws the block. A building OpenStreetMap leaves unnamed takes the map's block code as its name
 * (blockLabel in scripts/lib/osm-buildings.ts: "G Block" for a letter, else the code), and the
 * building card says so.
 *
 * What the map shows and the table does not take:
 * - Not the University's, by the map's own names, and so not candidates: the two large buildings
 *   the map names NIWA (way/1447813527, way/1447813528, unnamed in OpenStreetMap); the building it
 *   names Te Kūwaha o te Waiora - Health NZ, which OpenStreetMap names NIWA (relation/2389691);
 *   Landcare Research (way/179065305); St John's College (way/178621688 and six more); a kura
 *   kaupapa Māori (a school) and a kōhanga reo by Gate 10, which the map names as their own
 *   (way/179065309 and nine more; the kōhanga reo is childcare too); and the houses the map marks as
 *   private property on Aurora Terrace, Scotland Place and Hillcrest Road.
 * - Homes and childcare, which stay unnamed among the surroundings by the site's rules and are never
 *   listed in `left`, so nothing about them is published: the halls of residence (Bryant Hall,
 *   College Hall, Orchard Park with its chalets and the Orchard Park Apartments, the Student Village,
 *   the Scotland Place flats), the University's rental houses on Silverdale Road, and the créche by
 *   Gate 4c (way/179065299 and six more round it). Left with them, since whether people live in
 *   them cannot be told: the four small buildings the map marks TTH by Gate 3 (TTH1 to TTH4 in
 *   OpenStreetMap; the map's index does not list TTH or say what they hold) and the hut and garage
 *   beside them; the houses the map numbers 1, 3, 4, 6, TX5 and 194H by Gates 4a to 4c, with the two
 *   buildings east of them (way/179065276, way/837235353); and the two small buildings beside
 *   College Hall (way/179065203, way/179065220).
 * - Not drawn by the map at all: a 40 m² outline south of LSL (way/649353614), and two shelters.
 * - On the map but not in OpenStreetMap, so not drawn: TA (beside TC), ELT, MS1, MS3, MS4, MS5,
 *   MS6 and MS9. The map's index also lists TC2, which its drawing does not place.
 *
 * Two of the index's lines are read as the drawing has them: its "General" list sets each code one
 * line below its name from Shops down (UniRec Centre's SRC stands against WSU), and the drawing
 * writes SRC on the Uni Rec Centre and SUB on the Students' Union's building. The index gives the
 * Faculty of Māori and Indigenous Studies the code ITS (E8), as it does Information Technology
 * Services (D8); the drawing writes no code on the faculty's building, only its name beside it.
 */
const CAMPUS_MAP: CampusMapTable = {
  source: {
    name: "The University of Waikato, Hamilton campus map (version Q1 2025)",
    url: "https://www.waikato.ac.nz/assets/Uploads/About-us/Our-campuses/Campus-maps/Hamilton-campus-map.pdf",
    licence:
      "© The University of Waikato. Downloaded by the site's maintainer and used only to choose which of OpenStreetMap's buildings are the University's, and to call those OpenStreetMap leaves unnamed by their block codes. The map is not copied here.",
    received: "2026-10-28",
    provides: "Which of OpenStreetMap's buildings on the Hamilton campus are the University's, and the block codes of those OpenStreetMap leaves unnamed",
  },
  rows: [
    // By name: OpenStreetMap names the building as the map names or codes the block.
    { osm: "way/66211908", block: "PA", by: "name" }, // Gallagher Academy of Performing Arts
    { osm: "way/179065186", block: "UL1", by: "name" },
    { osm: "way/179065297", block: "UL2", by: "name" },
    { osm: "way/179065179", block: "ULS", by: "name" },
    { osm: "way/179065176", block: "UL3", by: "name" }, // Education Resource Centre: the map's words for UL3, with a line to it
    { osm: "way/179065663", block: "Oranga", by: "name" },
    { osm: "way/66211519", block: "SUB", by: "name" }, // the map writes SUB and WSU on it
    { osm: "way/66212129", block: "SRC", by: "name" }, // Uni Rec Centre
    { osm: "way/66210779", block: "ITS", by: "name" }, // Information Technology Services
    { osm: "way/649353616", block: "LSL", by: "name" }, // the west part of LSL; the east part is a row by place
    { osm: "way/66210777", block: "C", by: "name" },
    { osm: "way/66210776", block: "D", by: "name" },
    { osm: "way/66210766", block: "E", by: "name" },
    { osm: "way/66210765", block: "F", by: "name" },
    { osm: "relation/19798011", block: "G", by: "name" },
    { osm: "way/66210761", block: "I", by: "name" },
    { osm: "way/66210760", block: "J", by: "name" },
    { osm: "relation/19846888", block: "K", by: "name" },
    { osm: "way/66211517", block: "L", by: "name" },
    { osm: "way/66210778", block: "R", by: "name" },
    { osm: "relation/19798010", block: "S", by: "name" },
    { osm: "way/179065277", block: "FG", by: "name" }, // FG Link, between F and G
    { osm: "way/1414486064", block: "The Pā", by: "name" }, // The Pa
    { osm: "relation/19815926", block: "M", by: "name" }, // Student Centre
    { osm: "way/66211089", block: "ITS", by: "name" }, // Faculty of Māori and Indigenous Studies: see above for its code
    { osm: "way/66211451", block: "TT", by: "name" },
    { osm: "way/66211483", block: "TC", by: "name" },
    { osm: "relation/19798028", block: "TC", by: "name" }, // the south half of the TC block; OpenStreetMap names both halves TC Block
    { osm: "way/66211506", block: "TL", by: "name" },
    { osm: "way/179065158", block: "MSB", by: "name" }, // Waikato Management School/PWC
    { osm: "way/459912419", block: "N", by: "name" }, // Te Piringa - Faculty of Law: the map writes Law on block N
    { osm: "way/66211505", block: "PAV", by: "name" }, // Don Llewellyn Sports Complex: the map's Don Llewellyn Pavilion
    // By place, with OpenStreetMap's own name, which is not the map's.
    { osm: "way/179065156", block: "FM", by: "place" }, // Facilities Management Division; the map's FM, Property Services
    { osm: "way/179065157", block: "TSR", by: "place" }, // Hiko hub, at the south-east end of the Education blocks
    { osm: "way/66212188", block: "Nº5D", by: "place" }, // The Cowshed, by SUB
    { osm: "way/66210985", block: "LAIN", by: "place" }, // Pathways College: the west part of LAIN, University of Waikato College
    // By place, unnamed in OpenStreetMap: each takes the block code as its name.
    { osm: "way/66210788", block: "LSL", by: "place" }, // the east part of LSL: with way/649353616 it makes the one outline the map draws
    { osm: "way/179065206", block: "LAIN", by: "place" }, // the east part of LAIN
    { osm: "way/179065300", block: "EAS", by: "place" },
    { osm: "way/649353653", block: "TRU", by: "place" }, // between R and D
    { osm: "way/179065159", block: "CHSS", by: "place" }, // the chaplaincy, health service and chapel, one outline
    { osm: "way/624321944", block: "Shop", by: "place" }, // the shops by the Village Green; the index's code is Shop
    { osm: "way/66211486", block: "TG", by: "place" }, // the gymnasium north of TT
    { osm: "way/66211511", block: "TW", by: "place" }, // the west part of TW
    { osm: "way/179065166", block: "TW", by: "place" }, // the east part of TW
    { osm: "way/235929726", block: "CRC", by: "place" }, // by Gate 6, east of Hillcrest Road
    { osm: "way/179065289", block: "MS8", by: "place" }, // the long block east of MSB
    { osm: "way/179065261", block: "MAR", by: "place" }, // the marae: the four buildings round its courtyard
    { osm: "way/179065231", block: "MAR", by: "place" },
    { osm: "way/179065284", block: "MAR", by: "place" },
    { osm: "way/179065250", block: "MAR", by: "place" },
    { osm: "way/179065273", block: "FC1", by: "place" }, // the long building west of Landcare Research
    { osm: "way/179065242", block: "FC2", by: "place" }, // south of FC1
  ],
  left: [
    {
      osm: "way/179065668",
      reason: `The University's campus map draws it between the Uni Rec Centre and SUB with no block code of its own: it writes SUB on the building OpenStreetMap names SUB, beside it. OpenStreetMap gives it no name, so there is nothing to call it by. ${SURROUNDINGS}`,
    },
    ...["way/179065218", "way/179065272", "way/179065164"].map((osm) => ({
      osm,
      reason: `The University's campus map writes its block code CONF over a row of three small buildings, and which of the three carries it cannot be told. OpenStreetMap gives none of them a name. ${SURROUNDINGS}`,
    })),
    ...["way/179065183", "way/179065264", "way/179065280", "way/179065267", "way/649353639", "way/649353643", "way/649353641"].map((osm) => ({
      osm,
      reason: `One of the small buildings north-east of LSL. The University's campus map writes two block codes among them, LITB and BL, and which outline carries which cannot be told. OpenStreetMap gives none of them a name. ${SURROUNDINGS}`,
    })),
    {
      osm: "way/179065302",
      reason: `The University's campus map draws it beside FC1 with no block code of its own, and the words it writes there stand between the two, so which building they name cannot be told. OpenStreetMap gives it no name. ${SURROUNDINGS}`,
    },
    { osm: "way/649353660", reason: noCode("between K and J") },
    { osm: "way/649353662", reason: noCode("between J and I") },
    { osm: "way/649353664", reason: noCode("against the east side of I") },
    { osm: "way/179065162", reason: noCode("north of F") },
    { osm: "way/649353655", reason: noCode("between F and E") },
    { osm: "way/649353658", reason: noCode("between E and D") },
    { osm: "way/649353651", reason: noCode("between D and C") },
    { osm: "way/649353702", reason: noCode("by the closed pool, west of TG") },
    { osm: "way/179065292", reason: noCode("east of TC, across the courtyard from TL") },
    { osm: "way/179065187", reason: noCode("north of the Student Centre (M)") },
    { osm: "way/1255232944", reason: noCode("at the fleet parking south-west of ITS") },
    { osm: "way/649353632", reason: noCode("at the north end of the pavilion, which carries the code PAV,") },
    { osm: "way/498018310", reason: noCode("as the cricket nets by the tennis courts,") },
  ],
};

export const school: School = {
  id: "waikato",
  /** The middle of the extent of the Hamilton campus buildings the table takes, in osm/context-waikato-hamilton.json. */
  origin: { lat: -37.786, lon: 175.3173 },
  /** The Hamilton campus. */
  sun: { lat: -37.786, lon: 175.3173 },
  weather:
    "https://api.open-meteo.com/v1/forecast?latitude=-37.786&longitude=175.3173" +
    "&current=temperature_2m,weather_code,cloud_cover,precipitation,wind_speed_10m,wind_direction_10m&timezone=Pacific%2FAuckland",
  /**
   * The opening view frames 500 m round the campus's centre, the median of its buildings' centres,
   * which stands among the teaching blocks. At 1440 x 900 it labels 34 of the 53 buildings. The
   * school e2e asks for the three tallest: FG Link (the one building OpenStreetMap gives levels,
   * 10.8 m), then S Block and G Block, first of the many at the 10 m default. Framed at 600 or 700 m,
   * G Block's label gives way to its neighbours'. The rule for a campus away from the
   * centre would frame 1.6 times the span of every building's centre, from Facilities Management in
   * the north to FC2 in the south-east: about 1.8 km.
   */
  campusSpan: { hamilton: 500 },
  /**
   * Hamilton alone. The Tauranga campus's box ([-37.6935, 176.1565, -37.6775, 176.1745], round
   * Durham Street) held no building that OpenStreetMap traces to Waikato: three building=university
   * ways by Durham Street with no name and no operator. The campus map the maintainer gave the
   * project is Hamilton's alone. So Tauranga is not on the site (Real or absent): its area was taken
   * out again, and its snapshot deleted with its record ("On the site" in waikato.md). Hangzhou is a
   * partner's campus abroad, not part of this.
   */
  areas: {
    central: HAMILTON,
    remote: [],
  },
  roomCode: { building: NONE, wing: NONE, room: NONE, floorLetters: [], equivalentFloors: [] },
  words: { en },
  /**
   * Which buildings are Waikato's. OpenStreetMap tags only one Hamilton building as the
   * University's, the Gallagher Academy of Performing Arts (`operator`); the rest carry names, or
   * nothing, and no tag that says whose they are. So the University's own campus map decides, by the
   * table CAMPUS_MAP above, which the maintainer is asked to accept (its pull request starts with
   * "Gate:"). Every row is a candidate and is taken unless a step before the map's own step leaves
   * it out; none does. The tag candidates stay, so that the buildings OpenStreetMap ties to Waikato
   * by its tags are each recorded: in the Hamilton box, the Gallagher Academy (a row of the table),
   * a bicycle shed with no name, the Orchard Park Apartments (a home, never considered) and the
   * medical school's building site, which its name calls a construction site. A candidate the table
   * does not take is left out. The snapshot holds no campus outline (`amenity=university` area):
   * `fetch-osm.ts` asks Overpass for buildings, streets, paths, parks and trees.
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
        map: true,
        when: {},
        take: true,
        reason: "The University's campus map shows a block of the University's where it stands (CAMPUS_MAP in the descriptor).",
      },
      {
        map: false,
        when: { name: null },
        take: false,
        reason: `No name to call it by: it has no name tag, and the University's campus map gives it no block code. ${SURROUNDINGS}`,
      },
      {
        map: false,
        when: {},
        take: false,
        reason: `The University's campus map, which decides which buildings are the University's, does not show it among them. ${SURROUNDINGS}`,
      },
    ],
    provides:
      "Waikato's buildings on its Hamilton campus, as the University's campus map shows them: outlines, names where OpenStreetMap gives them, and heights where tagged. Surrounding buildings, streets, paths, parks and trees",
    campusMap: CAMPUS_MAP,
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
