# Te Kunenga ki Pūrehuroa Massey University (Massey): public campus data

Recon for a possible port, done on 2026-10-23 (New Zealand time) by the method in
[RECON.md](../../.claude/skills/campus-world-model/RECON.md). It records what Massey publishes
without a sign-in, and on what terms. No fetch script and no data file came with it. Since #PR the
Manawatū, Auckland and Wellington campuses are on the site in the Buildings form, from
OpenStreetMap ("On the site", below). The rest of this report is the recon as it was done.

Path name if the school is added: `/massey/` ("Decisions" in `PROGRESS.md`: each school's own short
name; Massey's web domain is `massey.ac.nz`). Time zone: Pacific/Auckland.

## On the site (2026-10-28)

On the maintainer's word of 2026-10-27, the loop fetched one Overpass area for each campus that this
report gives an address for (the Manawatū, Auckland and Wellington campuses) through
`scripts/fetch-osm.ts`, and the terrain tiles under them through `scripts/fetch-terrain.ts`. Not
part of this step: the School of Aviation at Palmerston North Airport, the Large Animal Teaching Unit
on Old West Road and the research farms (this report has venue codes or map files for them, no
address of a campus), and Singapore (a partner's campus abroad, outside LINZ's ground).

**Massey's own host.** The research browser (`scripts/research/polite.mjs`, documents only) asked
`www.massey.ac.nz` for its `robots.txt` and then its home page, once, on 2026-10-28 at 01:18
(New Zealand time), for the school's name and the brand-colour check (DESIGN.md, section 6): two
requests, since `polite.mjs` asks for a host's `robots.txt` before anything else. The page
answered (its status was not kept; no host was closed), and the browser blocked what it would have
loaded (its stylesheets and images on `d2ub1k1pknil0e.cloudfront.net`, its scripts, and its icons).
The reader that called it failed to save the page (its output folder did not exist), and no second
request went to the home page, so nothing was read from it. The name used is this report's, "Te Kunenga ki Pūrehuroa Massey
University"; OpenStreetMap's operator tag on the Manawatū library writes it "Massey University / Te
Kunenga ki Pūrehuroa". The brand colours were not compared: the site's accent and tones are the
project's own, taken from no school. No stylesheet was asked for, and nothing else went to any
Massey host.

**How each box was set.** This report gives addresses and no map points, so each box was drawn from
the address before the fetch, without asking any host, and checked against the snapshot's own
streets after it.

- **Manawatū** (`central`): "Tennent Drive, Turitea". The builder placed the campus from its own
  knowledge of Palmerston North, south of the Manawatū River, and drew the box about 1.3 km on every
  side of that place: `[-40.3967, 175.6022, -40.3733, 175.6328]`, 2.6 km north to south and 2.6 km
  east to west. Tennent Drive, University Avenue, Library Road, Riddet Road and Orchard Road run
  through the snapshot. `osm/context-massey-manawatu.json`: 2,881,782 bytes, 2,719 elements (996
  building ways and 7 relations), from `overpass-api.de`, OpenStreetMap base 2026-10-27 12:13 UTC;
  **1 request**. The 39 buildings the rule takes lie 499 m (south) to 1,222 m (north) inside the
  box's edges, and span 908 m east to west and 884 m north to south; the origin, the sun and the
  weather are at their middle (-40.3882, 175.6200).
- **Auckland**: "East Precinct, Dairy Flat Highway, SH17, Albany". Placed the same way, by the
  Albany Expressway south of Albany village, with about 1.4 km on every side, since the precinct's
  place was the least sure of the three: `[-36.7436, 174.6823, -36.7184, 174.7137]`, 2.8 km by
  2.8 km. The Albany Expressway, University Avenue, Albany Highway, Dairy Flat Highway and Oteha
  Valley Road run through it. `osm/context-massey-auckland.json`: 7,610,056 bytes, 8,180 elements
  (2,957 building ways and 8 relations); **3 requests**: `overpass-api.de` answered 502,
  `overpass.private.coffee` 504, and `overpass.kumi.systems` answered, with an OpenStreetMap base of
  2026-07-24 11:04 UTC, three months behind the main instance (the University of Auckland's
  `context.json` has the same base). The 8 buildings lie 795 m (north) to 1,094 m (west) inside its
  edges, and span 823 m east to west and 1,071 m north to south: the Design School stands at Albany
  village, 1 km north-west of the East Precinct.
- **Wellington**: "Wallace Street, Mount Cook". Otago's builder fetched a box round Mein Street,
  Newtown, on 2026-10-27, and deleted it (`docs/schools/otago.md`, "On the site"); its copy, kept
  outside the repository, was read here without a request. It held "Massey University Block 7"
  (`way/25374045`) at its northern edge, with Wallace Street and Tasman Street running north from
  it. So the box was drawn round those two streets, north to Buckle Street:
  `[-41.307, 174.771, -41.297, 174.782]`, 1.1 km by 0.9 km. `osm/context-massey-wellington.json`:
  2,312,036 bytes, 3,149 elements (1,326 building ways and 4 relations); **2 requests**:
  `overpass-api.de` answered 502, and `overpass.private.coffee` answered, with an OpenStreetMap base
  of 2026-07-24 11:04 UTC. The 8 buildings lie 258 m (north) to 334 m (east) inside its edges, and
  span 315 m east to west and 535 m north to south.

**What could be Massey's, by its tags.** In the three boxes, 2 buildings carry
`operator=Massey University` (the Manawatū library, as "Massey University / Te Kunenga ki
Pūrehuroa", and Te Rito at Albany), and 5 halls at Albany carry it too, as `building=dormitory`.
86 carry `building=university` with no operator (Manawatū 49, Auckland 2, Wellington 35), and none
with another operator. 2 carry `amenity=university` (the Registry and the Design School). 8 more
carry none of these, and a tag that says Massey: their name, the house name of their address, or the
place of their address (`addr:city=Massey University albany`, which Albany's mappers gave six
buildings). A childcare centre ("Massey Kids' Club", `amenity=childcare`) and a block of flats
("Massey Apartments", `building=apartments`) also have names that say Massey. No tag in the boxes
names another university or polytechnic: the schools beside the campuses (Kristin School at Albany,
Wellington High School and Wellington College at Mount Cook) tag theirs `building=school`. No box
holds an `amenity=university` area: `fetch-osm.ts` asks Overpass for buildings, streets, paths,
parks and trees, not for campus outlines.

**The rule** (`src/schools/massey/school.ts`), as VUW's, UC's and Otago's: a building is taken by
Massey's `operator` tag; by `building=university` or `amenity=university` with no other operator
named; or by its name, the house name of its address or the place of its address when it says
Massey; and by its name. A home is never considered, whatever its tags, and nor is a childcare
centre found only by a name that says Massey, so neither the halls nor the "Massey Kids' Club" is
named anywhere in the published data. Steps added for what Massey's boxes hold, each before the
step that would take it:

- a building whose own `fixme` tag asks mappers to check it: Student Central at Albany
  (`addr:city=Massey University albany`), whose `fixme` reads "can someone confirm whether or not
  this is the new police college?". The record keeps the tag's words;
- a kindergarten by its `building` value, beside Otago's childcare steps (no candidate in the boxes
  is one).

**Taken: 55.** Manawatū 39: the library by Massey's operator, the Registry by `amenity=university`,
35 by `building=university`, "A Massey University Research Unit" by its name and the Recreation and
Sports Centre by the house name of its address ("Massey Sports and Recreation Centre"). Auckland 8:
Te Rito by Massey's operator, the Sir Neil Waters Lecture Theatres (`ref=SNW`, its code on the map)
and the Innovation Complex by `building=university`, the Design School by `amenity=university`, the
Business School by its name, and the IIMS building, the Gym and Quadrangle Building B by the place of
their address. Wellington 8: the Dominion Museum Building, Te Ara Hihiko, Massey University Block 7,
the Massey University Gym, Te Rau Karamu Marae, K1 and K2 by `building=university`, and the Massey
University Library by its name. Heights: 14 from `building:levels`, 41 at a default (18 at 10 m, 23
at 6.5 m), none from `height`. Tallest: Science Towers A to D, 14.4 m (4 levels each), then the
Dominion Museum Building, Massey University Block 7, the Riddet Institute and the Veterinary Science
Building ("Vetinerary" in OpenStreetMap's name, kept as written), 10.8 m. **Left out: 43**, each with
its reason: 42 with no name (Manawatū 14, Wellington 28) and Student Central.

**Judgements for review.** (1) K1 and K2 are taken by `building=university`;
the Wellington map PDF this report read names a "K block", but no tag of theirs says Massey. (2) The
Riddet Institute (two buildings, `website=https://www.riddet.ac.nz/`) and the Riddet Complex are
taken by `building=university`; no tag of theirs names another body, as the Malaghan Institute's
did at VUW. (3) The Massey Islamic Centre (`building=university`, `amenity=place_of_worship`) is
taken by its tags; its contact tags (an email address and a phone number among them) are not read,
and are published nowhere. (4) "Collinson Village" and three buildings named "2", "3" and "4" beside it are
taken by `building=university`; their names do not say what they are. (5) Many of Massey's own
buildings carry no tag that says Massey (`building=yes` or `office` with no operator): the Sir
Geoffrey Peren Building, the Old Registry Building, the Refectory, the Geography Building and the
Veterinary Teaching Hospital at Manawatū, and the Atrium Building at Albany (`building=school`).
They stand in the surroundings with no name, as does the Hopkirk Research Institute. (6) Student
Central is left out on its own `fixme` tag. (7) The Auckland and Wellington snapshots came from
mirrors whose OpenStreetMap base is 2026-07-24; a refetch from `overpass-api.de` would give a newer
one, at one more request each.

**Left blank.** The Manawatū box holds 27 homes by their `building` value (21 dormitories; 5
named, the Mews Apartments among them) and the halls of residence that OpenStreetMap tags
`building=yes` with a hall's name (Moginie, Walter Dyer, McHardy, Colombo and Fergusson Halls), which
are not candidates; the Auckland box 188 homes (22 named, the five halls with Massey's operator
among them); the Wellington box 763 (16 named). The childcare centres (3 tagged in the Manawatū box,
1 at Albany, 2 at Mount Cook, and 6 `building=kindergarten` at Albany and Mount Cook) are not
candidates. None of their names is in the published data; a test checks this.

**The ground.** 24 tiles, 20 of them new: 9 under Manawatū, all naming LINZ's model
(`nzlinz/lds-tile-kl`); 9 under Auckland, all naming `nzlinz/lds-tile-ek`, the 4 south-west of the
campus with SRTM (`srtm/S37E174`) too and one of those with GMTED2010 as well; and 2 under
Wellington (`nzlinz/lds-tile-mk`). The other 4 under Wellington were already committed for VUW, and
`docs/schools/vuw.md` logs the headers of 3 of them (`lds-tile-mk`, one with SRTM and GMTED over
the harbour); they were not asked for again. So the shared terrain line in About holds for them.

**A question for the maintainer: the key dates.** This report's layer 4 found Massey's key-dates page
open, with Massey's licence for non-commercial reuse. Reading it is a fetch of a new source, a gate,
so `data/massey/academic-calendar.json` says `available: false`, and About says that the site does
not read the dates yet. The same holds for the course list (layer 5).

## Verdicts

| Layer | Verdict | What decided it |
| --- | --- | --- |
| 1. Footprints and surroundings | needs the maintainer: not checked here | No Overpass request was made (the brief for this recon forbids it). RECON.md calls OpenStreetMap usable everywhere under ODbL. The repository's seven areas are all for the University of Auckland, so the Auckland campus at Albany, the Manawatū campus at Turitea and the Wellington campus at Mount Cook each need a new area, fetched by `scripts/fetch-osm.ts` ("Needs the maintainer", 4) |
| 2. Indoor: buildings, floors, rooms | needs the maintainer | No source found gives room outlines or room positions. Open and read: the "Timetable building codes" page (53 rows: 14 Auckland, 28 Manawatū, 11 Wellington). It names the building for each venue code and gives the rule that puts a room on a floor ("first number denotes floor level"; Wellington "(block)(floor)(room number)"). The Wellington campus map PDF (a drawing, 2 pages). LibCal lists 12 bookable rooms in the Manawatū library, with room number and capacity. Closed by `robots.txt`: the Auckland and Manawatū campus map PDFs and the library path `/~wwwlib/mrbs/`. The Massey Uni app has campus maps, but it is a phone app and was not read. Ask Massey for the map data ("Needs the maintainer", 1) |
| 3. Timetable | needs the maintainer | The class timetable exists only behind a sign-in. "You will then be able to view your personal timetable in either the student portal or the Massey Uni app." The app says "keep track of your timetable (login required)". The old public "Class timetable" address of 2013 now answers 404. Course pages carry each offering's campus, semester and dates, but no class times. The exam timetable is personal, in the student portal. Two GitHub searches found no earlier student project for it |
| 4. Academic calendar | usable, while the site carries no advertising | One open page, "Key dates for semesters, exam periods and other events": six tables, 90 rows, for Semester One 2026 to Summer School 2027 to 2028, with the school holidays and the days the University is closed. The 2027 Calendar PDF has a "Diary of Key Dates" too. Massey's copyright page licenses reuse "for non-commercial purposes only" |
| 5. Subjects and courses | usable, while the site carries no advertising | The 2027 Calendar PDF (one request, 5,872,844 bytes, 436 pages) has a "Prescriptions and Schedule of Courses": about 2,500 six-digit course codes with title and credits, under 131 three-digit subject prefixes (a rough count by text extraction). Each of the 2,802 course pages in the sitemap holds a JSON block of its offerings: year, campus code, semester, delivery mode, dates. The course search is under `/search/`, which `robots.txt` disallows. Same licence condition as layer 4 |
| 6. Ground heights | needs the maintainer: not checked here | No layer-6 route was run. By web search only, not confirmed: LINZ lists a "Manawatu-Whanganui - Palmerston North LiDAR 1m DEM (2018)". Earlier recons for this repository found "Auckland Part 1 LiDAR 1m DEM (2024)" over AUT's North Campus (Northcote) and "Wellington - Wellington City LiDAR 1m DEM (2025)" over Kelburn, Pipitea and Te Aro. Whether they also cover Albany, Turitea and Mount Cook was not checked. The AWS Terrain Tiles were not tried ("Needs the maintainer", 5) |

Massey's main host, `www.massey.ac.nz`, was open to the research browser: 41 requests, no 401
and no 403. Its `robots.txt` lets every agent read the site except four paths and 1,218 named
documents, and these documents include two of the three campus map PDFs. The copyright page licenses
non-commercial reuse. So the open layers are the calendar and the courses. The two layers the
site's room view needs, rooms and class times, are not public: there are no room outlines or
positions, and the class timetable is behind a sign-in.

## Campuses

Massey's "Campus guides and maps" page says: "Massey University has 3 campuses in 3 New Zealand
cities – Auckland, Wellington, and the Manawatū campus in Palmerston North. Massey also has study
facilities in Singapore." Course offerings use the campus codes `A`, `M`, `W` and `D`
("Distance and online", not a place).

| Place | Address (source) | Map or rooms seen | OpenStreetMap in the repo | LiDAR 1 m DEM |
| --- | --- | --- | --- | --- |
| Auckland campus (code `A`; "Formerly called the Albany campus") | "Massey University East Precinct, Dairy Flat Highway, SH17, Albany, Auckland 0632, New Zealand" (Auckland campus maps page). The campus guides page also names "the East Precinct and Albany Village". "Most of the study facilities are on the East Precinct site" | Map PDF `/documents/1896/Albany_Campus_Map_-_25_May_2026.pdf` (`robots.txt`: Disallow; not requested). 14 venue-code rows (`AT`, `IC`, `MS`, `SC`, `SNW` and others) | none: a new area ("across the harbour from central Auckland, 15km away") | "Auckland Part 1 LiDAR 1m DEM (2024)" holds AUT's North Campus at Northcote (AUT's recon); Albany not checked |
| Manawatū campus (code `M`) | "Manawatū campus, Tennent Drive, Massey University, Turitea 4410" (Manawatū campus maps page) | Map PDF `/documents/43/Manawat%C5%AB_campus_maps_-_buildings_and_facilities_17_February_2026.pdf` (`robots.txt`: Disallow; not requested). 28 venue-code rows. 12 library rooms on LibCal | none: a new area | "Manawatu-Whanganui - Palmerston North LiDAR 1m DEM (2018)", by web search only: not confirmed; coverage not checked |
| Manawatū, away from the campus | Venue codes `SOAx.xx` ("School of Aviation – located at the PN Airport") and `LATU` ("Large Animal Teaching Unit – Old West Road") on the building codes page. `robots.txt` names map PDFs of several research farms | venue codes only | none | not checked |
| Wellington campus (code `W`) | "Manawatū campus, Wallace Street, Mount Cook, Wellington 6021, New Zealand" (sic: the Wellington campus maps page prints "Manawatū" here) | Map PDF `/documents/62/Wellington_Campus_Map_-_9_February_2026.pdf`: read, 200. 11 venue-code rows | none: a new area | "Wellington - Wellington City LiDAR 1m DEM (2025)" holds VUW's Te Aro campus (VUW's recon); Mount Cook not checked |
| Singapore | "Massey is proud to partner with PSB Academy to bring New Zealand's world-class education to the heart of Singapore" (Study in Singapore page) | a partner's campus | outside New Zealand | outside LINZ's coverage |

Places to leave blank. The sitemap has 27 addresses under `/student-life/accommodation/`. By their
addresses, they are about halls of residence, apartments and studio units on all three campuses
(the pages were not read). The Manawatū maps page says its street map shows "the halls of
residence", and the Wellington map PDF labels a residential complex and a residential hall. The
sitemap lists a childcare page and three pages under it, about Palmerston North and the Manawatū
campus. The Manawatū facilities page lists a "Childcare centre". This document names none of them.
A build must find them in the source and leave them blank.

Pages read for this section that are not in a layer's table:

| Route | URL | Answer (2026-10-23) | What it holds |
| --- | --- | --- | --- |
| Study on campus | `https://www.massey.ac.nz/study/study-on-campus/` | 200 `text/html; charset=utf-8`, 61,510 bytes | "Study on campus with Massey University in Auckland, Wellington, the Manawatū or Singapore." "Explore our 4 campus options in Auckland, Palmerston North, Wellington and Singapore to find the best place to call home." Links to one "Study on the … campus" page each for Auckland, Manawatū and Wellington (not read). Nothing else on the page was recorded |
| Manawatū campus facilities | `https://www.massey.ac.nz/student-life/campus-guides-maps/manawat%C5%AB-campus-maps-transport-and-parking/manawat%C5%AB-campus-facilities/` | 200 `text/html; charset=utf-8`, 97,194 bytes | A "Childcare centre" entry: "We offer high-quality early childhood education. The childcare service providers are independent." "The Dining Hall", for "Students staying in Massey university halls". "Some halls of residence also have small computer labs." Only the lines about childcare and halls were looked at; the rest of the page was not recorded |
| Study in Singapore | `https://www.massey.ac.nz/study/international-students/study-in-singapore/` | 200 `text/html; charset=utf-8`, 52,251 bytes | The partner sentence quoted in the table above; intakes "in March, July and November"; a list of qualifications (the first is "Bachelor of Business"), with fees and applications on the partner's website. Nothing else on the page was recorded |

## What the site could do

- **With the usable layers only:** no campus in 3D yet. Footprints wait on the maintainer's Overpass
  run for three new areas (layer 1). After that run: the Auckland, Manawatū and Wellington campuses
  from OpenStreetMap, each building named only where OpenStreetMap names it. Search would know
  about 2,500 course codes with titles, and the campuses and semesters each course is offered in.
  The academic calendar for 2026 and 2027 would show which teaching week a date falls in. A
  building is the finest place. No rooms and no classes.
- **With the venue-code key (open now, layer 2):** a venue code such as `AT1`, `IC2.01`, `SST2.xx`
  or `4D11` could be read as a building and a floor ("first number denotes floor level"; Wellington
  "4D11 is located in Block 4, level D, room 11"). Each building must be matched by hand to an
  OpenStreetMap footprint, and each floor would be inferred and labelled so. This helps only once a
  list of rooms or classes exists.
- **If Massey opens the timetable (layer 3):** class meetings would be located to a venue code, so
  to a building by the key above and, where the key gives one, a floor; not to a room outline. The
  key gives a floor for some rows only: ten of the 28 Manawatū rows give the floor rule, and
  `AH1-AH5` names a block with no floor.
- **Floor and room outlines:** no source found publishes them. The one campus map PDF read
  (Wellington) is a drawing of buildings, not floor plans. The Massey Uni app's map might hold
  more, but it was not read.

## Layer 1: footprints and surroundings

| Route | URL | Answer (2026-10-23) | What it holds |
| --- | --- | --- | --- |
| The repository's areas | `scripts/lib/areas.ts` | read locally, no request | Seven areas, all for the University of Auckland. `central` is `[-36.8689, 174.7608, -36.8441, 174.7797]` (south, west, north, east). None covers Albany, Palmerston North or Wellington |
| Overpass | not requested | — | The brief forbids Overpass here. AUT's recon found that `overpass-api.de/robots.txt` disallows `/api/`. The pipeline's `scripts/fetch-osm.ts` is the route. The tags of Massey's buildings (`name`, `ref`, `building:levels`, `height`) were not read |
| Open data | web search for a Massey campus building layer | none found | — |

Licence for OpenStreetMap: ODbL, credit in About.

## Layer 2: indoor (buildings, floors, rooms)

| Route | URL | Answer (2026-10-23) | What it holds |
| --- | --- | --- | --- |
| Campus guides and maps | `https://www.massey.ac.nz/student-life/campus-guides-maps/` | 200 `text/html; charset=utf-8`, 43,925 bytes | Links to one page for each campus, "Campus revitalisation", "Accommodation" and the Massey Uni app. No map data on the page |
| Auckland campus maps | `https://www.massey.ac.nz/student-life/campus-guides-maps/auckland-campus-maps-transport-and-parking/` | 200 `text/html; charset=utf-8`, 88,700 bytes | The address, links to the map PDF (pages 1 and 2: "Auckland campus street map", "Auckland campus map"), and tables of first-aid and defibrillator places by building and room (for example "QA1.03", "AT1.27", "IC1.16"). "Get campus information and maps in your pocket with the Massey Uni app." |
| Auckland map PDF | `https://www.massey.ac.nz/documents/1896/Albany_Campus_Map_-_25_May_2026.pdf` ("Auckland Campus Map Brochure - May 2026 (PDF, 501.8 KB)") | not requested: `robots.txt` has `Disallow: /documents/1896/Albany_Campus_Map_-_25_May_2026.pdf` | Not seen |
| Manawatū campus maps | `https://www.massey.ac.nz/student-life/campus-guides-maps/manawat%C5%AB-campus-maps-transport-and-parking/` | 200 `text/html; charset=utf-8`, 100,001 bytes | The address and the map PDF's two pages. "The street map shows roads into and around the main (Manawatū) campus, the main car parks and buildings, plus the halls of residence. The list beside the map gives the names of the numbered buildings." Page 2: "use the map grid to find buildings in the list below" |
| Manawatū map PDF | `https://www.massey.ac.nz/documents/43/Manawat%C5%AB_campus_maps_-_buildings_and_facilities_17_February_2026.pdf` ("(PDF, 2.5 MB)") | not requested: `robots.txt` disallows this exact path | Not seen |
| Wellington campus maps | `https://www.massey.ac.nz/student-life/campus-guides-maps/wellington-campus-maps-transport-and-parking/` | 200 `text/html; charset=utf-8`, 94,927 bytes | The address (see "Campuses"), the map PDF, and first-aid and defibrillator places by block |
| Wellington map PDF | `https://www.massey.ac.nz/documents/62/Wellington_Campus_Map_-_9_February_2026.pdf` | 200 `application/pdf`, 282,138 bytes, 2 pages, dated "9 February 2026" | A drawing: Blocks 1 to 12, the T buildings (`T4` to `T40`) and K block, with entrances A to F and a numbered key on page 2. No floors, no rooms, no coordinates |
| Old map PDFs (web search results) | `/documents/56/Auckland_campus_map.pdf`, `/documents/42/Manawatu_Campus_Map.pdf`, `/documents/66/Wellington-campus-aerial-map.pdf` | 404 `text/html; charset=utf-8`, 4,850 bytes each | Gone |
| Room directory: timetable building codes | `https://www.massey.ac.nz/student-life/starting-university/timetable-building-codes/` (the old `/massey/learning/timetables/timetable-building-codes.cfm` answers 301 to it) | 200 `text/html; charset=utf-8`, 99,115 bytes | "Find out what the venue codes in your personal timetable mean including which buildings they are and their locations." Three tables, "Venue code" and "Location" or "Building details": Auckland 14 rows (for example `AT1`, "Level one of the Atrium Building"; `IC2.01, IC2.21, …`, "Innovation Complex Level 2"), Manawatū 28 rows (for example `AH1-AH5`, "Lecture Theatres situated in Agricultural and Horticultural Lecture Block (AHLB)"; ten rows say "(first number denotes floor level)"), Wellington 11 rows ("All rooms on Wellington Campus are coded (block)(floor)(room number). For example, 4D11 is located in Block 4, level D, room 11"; "LT100 (4C09)", "LT200 (6C15)"). Codes and floors in words; no outlines, no positions, no full room list |
| Room directory: library rooms | `https://massey.libcal.com/reserve/manawatu` (linked from `https://www.massey.ac.nz/study/library/campus-libraries-and-off-campus-library-services/library-room-booking/`, 200, 62,608 bytes) | 200 `text/html; charset=utf-8`, 57,667 bytes | Springshare LibCal. 12 spaces in "Manawatū Library - Students", each with `title`, `eid`, `gid`, `lid`, `grouping` ("Discussion Rooms", "Quiet Study Rooms"), `capacity`. Titles carry a room number (for example "Discussion Room 1 - 2.46 (Capacity 6)"), with no building code. Booking needs a sign-in (Massey's room-booking page: "If you are not already logged in you will be asked to do this now"; not requested). The Auckland and Wellington lists were not requested |
| Room booking: a library path | `https://www.massey.ac.nz/~wwwlib/mrbs/` | not requested: `robots.txt` has `Disallow: /~wwwlib/mrbs/` | Not seen. The path's name matches MRBS, an open-source meeting-room booking system |
| The Massey Uni app | Google Play `nz.ac.massey.orientation.droid`, App Store `id772415885` (links on each campus page) | not requested: a phone app, not a web page | "look at campus maps" (systems page). Where its map data comes from was not seen. By web search only, not confirmed: a store listing says it finds teaching rooms on the three campuses |
| Open data | web search for Massey on MazeMap, Concept3D, MapsIndoors and ArcGIS | none found | — |
| Floor-plan PDF | none found | — | — |

Without a readable source of rooms, the building view could show only OpenStreetMap's buildings;
any floor would be inferred and labelled so.

## Layer 3: timetable

| Route | URL | Answer (2026-10-23) | What it holds |
| --- | --- | --- | --- |
| Massey's help page for it | `https://www.massey.ac.nz/student-life/starting-university/` | 200 `text/html; charset=utf-8`, 77,832 bytes | "Make sure you know where you need to be and when by creating your timetable in the student portal. You will then be able to view your personal timetable in either the student portal or the Massey Uni app." In the portal: "you'll be able to see all of the available lectures, tutorials and labs for each of the courses you're enrolled in." "Confirm your tutorial times in Stream" |
| Systems page | `https://www.massey.ac.nz/student-life/starting-university/get-set-up-on-masseys-systems/` | 200 `text/html; charset=utf-8`, 54,128 bytes | "You can view your class timetable in both the student portal and the Massey Uni App." The app: "keep track of your timetable (login required)" |
| Student timetable: the student portal | `https://smsportal.massey.ac.nz/sitsvision/wrd/siw_lgn` | not requested: a sign-in | A student's own timetable and exam timetable |
| Student timetable: the Massey Uni app | the store links above | not requested: a phone app with a sign-in for the timetable | — |
| Tutorials: Stream | `https://stream.massey.ac.nz/` | not requested: a sign-in | "If your course coordinator has set tutorial times, you'll be able to see yours on this page" |
| Public class search (old) | `https://www.massey.ac.nz/massey/learning/timetables/class-timetable_home.cfm`, linked as "Class timetable" in a student blog post of 25 February 2013 on `sites.massey.ac.nz` (200 `text/html; charset=UTF-8`, 27,879 bytes) | 404 `text/html; charset=utf-8`, 4,850 bytes | Gone. The post said: "If you're an internal student, you can get a copy of your study timetable here" |
| Public class search (now) | `https://www.massey.ac.nz/search/` | not requested: `robots.txt` has `Disallow: /search/` | The course search. Nothing read says it holds class times |
| Course pages | for example `https://www.massey.ac.nz/study/courses/applied-statistics-161111/` | 200 `text/html; charset=utf-8`, 75,880 bytes; three more course pages read (55,034, 57,065 and 52,992 bytes) | A `course-offerings` JSON block: 12, 4 and 2 offerings on three pages, none on the fourth. Each offering has `year`, `location`, `campus_code`, `delivery_mode` (`INT`, `DIS`), `semester`, `semester_label`, `college`, `subject`, `dates` (start, end, withdrawal dates), `fees`, and `events` (`notes` and a list; the list was empty in all 18 offerings seen). A `coordinator` object holds a person's name and email: drop it at parse time. No class times or rooms |
| Published files: exam timetable | `https://www.massey.ac.nz/study/exams/timetables-clashes-and-exam-changes/` | 200 `text/html; charset=utf-8`, 48,562 bytes | "You'll be able to see your exam timetable in the student portal, usually by the end of week 4 each semester." No public exam timetable |
| Published files: ICS, CSV | none found | — | — |
| Official API | web search | none found | — |
| Earlier student projects | two GitHub searches through the GitHub API ("massey timetable": no result; "massey university" with timetable, planner or course: 15 results) | — | None reads Massey's timetable. The 15 are course material and assignments |

Precision, if Massey opens the timetable: a venue code, which the building-codes key puts on a
building and, where the key gives one, a floor.

## Layer 4: academic calendar

| Route | URL | Answer (2026-10-23) | What it holds |
| --- | --- | --- | --- |
| Key dates | `https://www.massey.ac.nz/study/key-dates-for-semesters-exam-periods-other-events/` | 200 `text/html; charset=utf-8`, 140,777 bytes | Six tables ("Semester One 2026", "Semester Two 2026", "Summer School 2026 to 2027", "Semester One 2027", "Semester Two 2027", "Summer School 2027 to 2028"), 90 rows of "Event" and "Date". For example: Semester One 2026, "Semester and lectures start" 23 February, "Final day of lectures" 29 May, exams 8 June to 19 June; Semester Two 2026, start 13 July, last lectures 16 October, exams 27 October to 9 November; Semester One 2027, start 22 February. Holidays: "School and tertiary institutions holiday (university closed)". "Some courses do not follow the standard semester dates. For details, see the course descriptions ." |
| The Calendar | `https://www.massey.ac.nz/about/university-calendar-and-regulations/massey-university-calendar/` (200, 51,514 bytes) and `https://www.massey.ac.nz/documents/2278/2027-Massey-University-Calendar.pdf` | 200 `application/pdf`, 5,872,844 bytes, 436 pages | "Diary of Key Dates" for 2027, month by month. Editions from 2017 to 2027 are linked |
| Old address | `https://massey.ac.nz/massey/learning/programme-course/semester-dates.cfm` (web search) | not requested | — |

Transcribe the key-dates page by hand into `data/<id>/academic-calendar.json`, as for Auckland.

## Layer 5: subjects and courses

| Route | URL | Answer (2026-10-23) | What it holds |
| --- | --- | --- | --- |
| Course codes explained | `https://www.massey.ac.nz/study/courses/` | 200 `text/html; charset=utf-8`, 42,144 bytes | "Each course is numbered using six digits. The first three numbers show you which subject the course is about. The fourth number shows the level of the course." Its "Advanced course search" link goes to `/search/` (disallowed) |
| Course catalogue: the Calendar | `https://www.massey.ac.nz/documents/2278/2027-Massey-University-Calendar.pdf` | as in layer 4 | "Prescriptions and Schedule of Courses", from page 319: subject headings with their prefix (for example "110 Accountancy"), then each course's code, title and credits, then a prescription. About 2,500 distinct codes under 131 prefixes (a rough count of "code title … N credits" lines). Keep code, title and credits; leave the prescriptions out (prose) |
| Course catalogue: course pages | `https://www.massey.ac.nz/cms_sitemap.xml` (from `https://www.massey.ac.nz/sitemap.xml`, 200 `application/xml`, 347 bytes) | 200 `application/xml`, 1,409,538 bytes, 9,606 URLs, newest `lastmod` 2026-10-22 | 2,802 URLs under `/study/courses/`. Three of the four course pages read have the `course-offerings` JSON of layer 3: the campuses, semesters and modes each course is offered in, for 2026 and 2027. Reading all of them takes 2,802 requests, about 52 minutes at one request each 1.1 s |
| The old sitemap | `https://www.massey.ac.nz/massey/sitemap.xml` | 200 `application/xml`, 1,404 bytes, `Last-Modified` 2021-03-03 | Eight extracts (`massey_extract_paper.xml`, `massey_extract_paper_offering.xml` and others). Not read: last changed in 2021 |
| Subjects by campus | `https://www.massey.ac.nz/documents/260/Massey_University_Subjects_by_Campus.pdf` | not requested: `robots.txt` disallows it | — |

One request (the Calendar) gives codes and titles. The offerings need the course pages. The course
search might give them in fewer requests, but it is under `/search/`, which `robots.txt` closes.

## Layer 6: ground heights

| Route | URL | Answer (2026-10-23) | What it holds |
| --- | --- | --- | --- |
| AWS Terrain Tiles (the repository's own route) | not requested | — | This recon asked only Massey's hosts and LibCal. `scripts/fetch-terrain.ts` over each campus would show the tiles' source header |
| LINZ elevation catalogue | not requested | — | By web search only, not confirmed: "Manawatu-Whanganui - Palmerston North LiDAR 1m DEM (2018)", captured for the city council in 2018. From earlier recons in this repository: "Auckland Part 1 LiDAR 1m DEM (2024)" (CC BY 4.0) holds AUT's three Auckland campuses; "Wellington - Wellington City LiDAR 1m DEM (2025)" (CC BY 4.0) holds VUW's campuses at Kelburn, Pipitea and Te Aro |

Not checked: whether those capture areas hold Albany, Turitea and Mount Cook; two known heights on
each campus; pits where land meets sea (RECON.md, layer 6). A 1 m DEM needs a new dependency for
LERC-compressed GeoTIFFs, a gate (`PROGRESS.md`, "Ideas still open", 2).

## robots.txt and terms

| Host | robots.txt (2026-10-23) | Terms |
| --- | --- | --- |
| `www.massey.ac.nz` | 200 `text/plain`, 83,575 bytes, 2,443 lines, read before each of 9 runs. One group, `User-agent: *`: `Allow: /`, `Disallow: /admin/`, `Disallow: /django-admin/`, `Disallow: /search/`, `Disallow: /~wwwlib/mrbs/`, then 1,218 `Disallow:` lines for single files under `/documents/`. These include the Auckland and Manawatū campus maps (`/documents/1896/…`, `/documents/43/…`, `/documents/52/…`, `/documents/59/…`), another Wellington map (`/documents/933/Wellington_Map_V6.pdf`), farm maps and "Massey_University_Subjects_by_Campus.pdf". No `Sitemap:` line, no crawl delay, no group for any named agent | `https://www.massey.ac.nz/about/copyright/` (200 `text/html; charset=utf-8`, 37,484 bytes): "Apart from any use permitted by the Act, the university grants users of this website a licence (within the meaning of the Act) to download, print, share or otherwise reproduce the information for non-commercial purposes only." |
| `massey.libcal.com` | 200 `text/plain; charset=utf-8`, 531 bytes. Named agents (`crawl`, `crawler`, `discobot`, `AddThis.com`, `Yandex`, the `Baiduspider` agents, `SemrushBot`, `SemrushBot-SA`, `GPTBot`) have `Disallow: /`; `Twitterbot` has an empty `Disallow:`; `User-agent: *` has `Crawl-delay: 10` and `Disallow: /process_`. `Sitemap: https://massey.libcal.com/sitemap.xml` (not read). The reader kept the 10 s delay | Springshare's terms: not read. No terms link was found on the page read |
| `sites.massey.ac.nz` | 200 `text/plain; charset=utf-8`, 223 bytes. Two `User-agent: *` groups: `Disallow: /wp-admin/`, `Allow: /wp-admin/admin-ajax.php`, `Disallow: /wp-content/uploads/wpforms/` | No terms page found; Massey's copyright page speaks of "this website" |
| `smsportal.massey.ac.nz`, `stream.massey.ac.nz`, `myhub.massey.ac.nz` | not requested: sign-ins | — |
| `overpass-api.de`, `s3.amazonaws.com`, `nz-elevation.s3.ap-southeast-2.amazonaws.com` | not requested | ODbL for OpenStreetMap; CC BY 4.0 for the Auckland and Wellington City DEMs (earlier recons) |

Order on `www.massey.ac.nz`: the first run that asked for pages asked for `/about/copyright` first
and got a 301 to `/about/copyright/`. The reader does not follow a redirect without `--follow`, so
the campus guides and key-dates pages came next in that run, and the copyright page itself was read
about 32 seconds after the 301, first in the next run. The licence covers "this website". This
recon kept the raw answers outside the repository and deleted them after counting (see "Request
log").

The licence is for non-commercial use. RECON.md's rule applies: the layer 4 and 5 verdicts hold only
while the site carries no advertising. The licence does not name derived data or maps. The
University of Auckland's verdict rests on the same kind of condition (RECON.md, "Worked example").

## Needs the maintainer

1. **Ask Massey for the room data.** No public source gives room outlines or positions. The Massey
   Uni app has campus maps; ask Massey which service it uses and whether the project may read its
   buildings and rooms (code, floor, type, outline or point), with credit and not for profit. The
   same message can ask to read the Auckland and Manawatū campus map PDFs, which `robots.txt`
   disallows, and the library's `/~wwwlib/mrbs/` path. Only Massey can grant these.
2. **Ask Massey about the timetable.** Class times are in the student portal and the app, behind a
   sign-in. The same message can ask whether Massey would publish class times and venue codes,
   for example as files once a semester. A "Class timetable" page was on the public site in 2013;
   whether it showed every class was not seen.
3. **Sign-in walls, recorded once and left alone:** the student portal
   (`smsportal.massey.ac.nz/sitsvision/wrd/siw_lgn`), Stream, MyHub, the Massey Uni app's timetable
   ("login required") and LibCal's booking step. None was requested.
4. **Overpass for three new areas.** Run `scripts/fetch-osm.ts` for the Auckland campus (East
   Precinct, Albany), the Manawatū campus (Tennent Drive, Turitea) and the Wellington campus
   (Wallace Street, Mount Cook). Decide whether the School of Aviation at Palmerston North airport
   and the farms need areas. Not requested here, by the brief.
5. **Ground heights.** Run `scripts/fetch-terrain.ts` over each campus and read the tiles' source
   header. Read the capture areas and licences of the Palmerston North (2018), Auckland Part 1
   (2024) and Wellington City (2025) DEMs, to see which campus each covers.
6. **Places to leave blank.** Before any room is named, list Massey's halls of residence (all three
   campuses) and its childcare on the Manawatū campus from the source, so the build leaves them
   blank.
7. **The licence condition.** Massey's licence is "for non-commercial purposes only". Keep the
   site free of advertising while Massey data is on it, or ask Massey for written permission.
8. **Terms read after content.** LibCal's (Springshare's) terms were not read before its Manawatū
   room list was read, and they are still unread. On `www.massey.ac.nz`, two pages (campus guides
   and key dates) were read before the copyright page ("robots.txt and terms").
9. **Two tool gaps,** as in the earlier recons: `polite.mjs` does not read `robots.txt`, and it lets
   frames load from any path. This recon's reader read each host's `robots.txt` itself and let only
   documents and fetches through.

## Request log

Every request went through `scripts/research/polite.mjs` as it is on branch
`loop-polite-redirects` (pull request #71, open; commit 9c32102), from one scratch reader (Otago's
reader, copied) in 12 runs. Each run started one browser with `politeLaunch()` and opened one
polite page that let only documents and fetches through. It loaded the host's `robots.txt` as the
page, then read each URL by an in-page `fetch()` with `redirect: "manual"`. So no frame, script or
image of a page was loaded, and each redirect hop was a request of its own, checked against
`robots.txt` before it went. Each host was paced to the larger of 1.1 s and its largest
`Crawl-delay`, counted from the last request to it in any run. The reader would have refused, before
launching a browser, any host that had answered 401 or 403 or dropped a connection; none did. The
browser's User-Agent was "… HeadlessChrome/156.0.0.0 …". Web searches and two GitHub searches
through the GitHub API did not send a request to the school's web servers, and are not in the log.
UTC 2026-10-22 15:27:09 to 15:35:13 (2026-10-23 04:27 to 04:35 in New Zealand).

- **Sent:** 47, all GET. `www.massey.ac.nz` 41 (9 of them its `robots.txt`, once a run),
  `sites.massey.ac.nz` 4 (2 `robots.txt`), `massey.libcal.com` 2 (1 `robots.txt`). Answers: 39 ×
  200, four 301 (`/about/copyright` to `/about/copyright/`, the old building-codes address, an old
  "first week" address to `/student-life/starting-university/`, and the blog's `?p=27` to the
  post), four 404 (three old map PDFs and the old class-timetable page). No form was submitted,
  nothing was signed in to, no POST went out.
- **Blocked before leaving the machine:** 12, all the browser's own icon request (`favicon.ico`),
  one a run. No page's own scripts, styles or frames were asked for, because no page was loaded
  as a page; no other host was asked for. No cookie banner was loaded, so none had to be refused.
- **Refused by the reader before sending:** three URLs that `robots.txt` disallows (the Auckland
  and Manawatū map PDFs and "Subjects by Campus"). In the first run, three more URLs were
  malformed by the shell and skipped as "not this run's host"; nothing was sent for them, and they
  were asked for again correctly in the next run.
- **Rate:** the shortest gap between two requests was 1.184 s, and no second held more than one.
  Per host: `www.massey.ac.nz` 1.184 s, `sites.massey.ac.nz` 3.777 s, `massey.libcal.com` 11.256 s
  (its `Crawl-delay: 10` kept).
- **Order:** each host's `robots.txt` was read before anything else was sent to it.
- **Disallowed path:** none requested.
- **401, 403 and sign-in walls:** none answered. The student portal, Stream, MyHub and LibCal's
  booking step were not requested.

The raw answers stayed outside the repository and are not committed. Course pages carry a
person's name and email (the `coordinator` field), and LibCal's terms were not read, so every saved
answer was deleted from the scratch folder once the counts above had been taken and checked. Only
the two request logs (URL, time, status, content type, size) are kept there.
