# Auckland University of Technology (AUT): public campus data

Recon for a possible port, done on 2026-10-22 (New Zealand time) by the method in
[RECON.md](../../.claude/skills/campus-world-model/RECON.md). It records what AUT publishes without
a sign-in, and on what terms. Nothing here is on the site yet. No fetch script and no data file
comes with it.

Path name if the school is added: `/aut/` ("Decisions" in `PROGRESS.md`: each school's own short
name). Time zone: Pacific/Auckland.

## Verdicts

| Layer | Verdict | What decided it |
| --- | --- | --- |
| 1. Footprints and surroundings | usable | OpenStreetMap (ODbL). The City Campus is already in the committed `central` snapshot: 20 AUT buildings there carry `ref` (WA to WZ). North and South need one Overpass area each |
| 2. Indoor: buildings, floors, rooms | needs the maintainer | The public MazeMap map gives 72 building records, 181 floors and room shapes with code and type, with no sign-in. MazeMap's terms forbid extraction of its maps or data without a written agreement |
| 3. Timetable | needs the maintainer | Open: Arion's public course pages list every class meeting with dates, day, time and room code. AUT's copyright page allows only private research and study, and asks for permission for other uses |
| 4. Academic calendar | needs the maintainer | Open: the semester-dates page (2026, 2027) and "Academic Dates" in the AUT Calendar PDF. The same AUT copyright condition applies |
| 5. Subjects and courses | needs the maintainer | Open: the Calendar PDF's "Index of Subject Codes" (about 137 codes; 2,586 course codes in its 2027 text) and Arion's course pages. The same AUT copyright condition applies |
| 6. Ground heights | usable | AWS Terrain Tiles hold the LINZ 8 m DEM (CC BY 3.0 NZ) under all three campuses. All three lie inside "Auckland Part 1 LiDAR 1m DEM (2024)" (CC BY 4.0) |

Layers 3, 4 and 5 are open and need no sign-in. Only the terms hold them back, and one request to
AUT can cover all three (see "Needs the maintainer").

## Campuses

AUT names five places of study. Room codes start with a campus letter (AUT's page "Getting around
AUT": W = City, A = North, M = South; the second letter is the building, the first digit the level).

| Campus | Address (source) | Room letter | MazeMap campus | MazeMap buildings / floors | OpenStreetMap in the repo | LINZ LiDAR DEM |
| --- | --- | --- | --- | --- | --- | --- |
| City Campus | 55 Wellesley Street East, Auckland Central | W | 103 | 18 / 107 (WW and WD are marked "Closed", with no floors) | inside the `central` area | Auckland Part 1 (2024) |
| North Campus | 90 Akoranga Drive, Northcote | A | 114 | 46 / 59 (30 records are one-room units: AE 101 to AE 126, AET01 to AET04; AY has no floors) | none: a new area | Auckland Part 1 (2024) |
| South Campus | 640 Great South Road, Manukau | M | 113 | 8 / 15 | none: a new area (the `tai-tonga` box ends about 60 m south of it) | Auckland Part 1 (2024) |
| AUT Millennium Campus | 17 Antares Place, Mairangi Bay (2027 Calendar) | none seen | not in MazeMap | none | none | not checked |
| AUT Ōtautahi Satellite Campus | Christchurch, no street address (2027 Calendar) | none seen | not in MazeMap | none | none | not checked |

The campuses page also lists the AUT Refugee Education Centre as a location. Its address was not
read. The timetable rows seen use only W, A and M rooms.

Places to leave blank: the North Campus page names the Akoranga Childcare Centre on the campus.
Student homes: Te Āhuru Mayoral Drive and the Akoranga Student Village (off the campuses), and the
WQ building, which the City map calls the "Student Accommodation & Recreation Centre".
OpenStreetMap tags WQ `building=dormitory` with 15 levels, and MazeMap draws only WQ1 to WQ5.

## What the site can do

- **With the usable layers only:** the City, North and South campuses in 3D from OpenStreetMap
  footprints, on LINZ ground. A building is the finest place. AUT buildings are named by their
  OpenStreetMap `ref` and `name` where tagged (20 on the City Campus). No floors, no rooms, no
  classes.
- **With AUT's permission for layers 3 to 5:** every class meeting from Arion, with its room code.
  The code gives the campus, the building and the level by AUT's own published rule, so a class is
  located to a building and a floor from its code. The floor is labelled as from the code, not
  from a map. Course search and the calendar work too.
- **With a written agreement from MazeMap, and AUT's consent as the owner of the map data:**
  buildings with an outline for each floor, and rooms with their code and type. Classes are then
  located to the room. The floor names in MazeMap match the level digit in room codes: floor "WA5"
  holds rooms WA504 to WA527.

## Layer 1: footprints and surroundings

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Committed OSM snapshot | `data/raw/osm/context.json` (Overpass base 2026-07-24, committed 2026-10-13) | read locally, no request | Inside MazeMap's City Campus outline: 63 buildings and 1 building part. Of the buildings, 39 carry `name`, 20 `ref`, 20 `building:levels`, none `height`. AUT ones: `ref` WA, WB, WC, WD, WE, WF, WG (named "Sir Paul Reeves Building"), WH, WM, WN, WO (17 levels), WP, WQ, WS (6 levels), WU, WW (`building=ruins`), WY, WZ |
| Overpass: four queries (AUT university areas; buildings in each campus box) | `https://overpass-api.de/api/interpreter?data=…` | 406 Not Acceptable (three), time-out after 45 s (one), `text/html` | Nothing. Overpass refuses the headless browser. Its `robots.txt` has `Disallow: /api/`, so the route was not tried again |
| OpenStreetMap API, `api.openstreetmap.org` | `https://api.openstreetmap.org/robots.txt` | 200 after a redirect to `www.openstreetmap.org/robots.txt` | `Disallow: /api/` and the way, node and relation pages. Not used |

North and South Campus tags were not read in this recon. The pipeline's own route
(`scripts/fetch-osm.ts` through `scripts/lib/snapshot.ts`) fetched seven areas for Auckland; it is
the way to take these two. Licence: ODbL, credit in About.

## Layer 2: indoor (buildings, floors, rooms)

AUT's campus maps send readers to MazeMap ("For more details, use MazeMaps - mazemap.aut.ac.nz",
on all three PDF maps). MazeMap is an indoor-mapping vendor.

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Campus map, own requests | `https://mazemap.aut.ac.nz/` | 302 to `https://use.mazemap.com/` (a JavaScript app) | Three sniffs. The app asks, with no sign-in: `api.mazemap.com/api/webappconfig/AUT/`, `api/campuscollection/AUT/?withcampuses=true`, `api/campus/103/?srid=4326`, `api/types/<id>`, `api/campus/103/bookingconfig/` and vector tiles `tiles.mazemap.com/AUT/latest/<z-level>/<zoom>/<x>/<y>.mvt` |
| Web-app configuration | `https://api.mazemap.com/api/webappconfig/AUT/` | 200 `application/json`, 1.6 KB | `requiresViewAccessToken: false`, `ssoLoginSupported: false`; the three campuses |
| Campus collection | `https://api.mazemap.com/api/campuscollection/AUT/?withcampuses=true` | 200 `application/json`, 4.4 KB | Campus ids 103 (City), 114 (North), 113 (South) with outline and centre |
| Permissions | `https://auth.mazemap.com/permissions` | 401, asked by the app itself with no credentials (in two sniffs) | The app goes on without it and draws the floors. Not asked for on its own |
| One floor tile | `https://tiles.mazemap.com/AUT/latest/4.0/18/258332/159976.mvt` | 200 `application/vnd.mapbox-vector-tile`, 54 KB | Layers `buildings` (name, e.g. "WA Building"), `outlines`, `rooms` (165 polygons), `walls`, `doors`, `stairs`, `elevators`, `inventory`, `markers` (labels such as "WA505 Meeting Room", "WF402 Classroom", "WA505A Office", "WG519 WC (All/Acc)"). Labels give code and type; none names a person in this tile |
| One POI type | `https://api.mazemap.com/api/types/788` | 200 `application/json` | `{"title": "Toilet - All Gender Accessible", …}` |
| Buildings by campus (MazeMap's documented data API; the app did not ask for it in these sniffs) | `https://api.mazemap.com/api/buildings/?campusid=103&srid=4326`, then `113`, `114` | 200 `application/json`: 396 KB, 84 KB, 221 KB | Per building: id, name, outline; per floor: id, name ("WA2"), `z`, outline. Counts in "Campuses" |
| One POI by a marker id | `https://api.mazemap.com/api/pois/12255670/?srid=4326` | 404 | Marker ids are not POI ids |
| Room booking | `booking.mazemap.com/api/roombooking/roomavailability/…` (made by the app) | blocked by `polite.mjs`, not sent | Not studied: room bookings, not places |
| Room directory | none found on `www.aut.ac.nz` (site map read) | none | The "Getting around AUT" page explains room codes; there is no list |
| Open data | web search for an AUT open-data or GIS portal | none found | Auckland Council's open data holds no AUT indoor data |
| Floor-plan PDFs | `https://www.aut.ac.nz/__data/assets/pdf_file/0011/118919/AUT-campus-map-city.pdf`, `…/0006/118905/AUT-campus-map-north.pdf`, `…/0008/118925/AUT-campus-map-south.pdf` | 200 `application/pdf`: 520 KB, 385 KB, 213 KB | One-page campus maps (City and North April and June 2026, South February 2025): building letters, school receptions, services. No floor plans |

A full indoor fetch would take the three building lists and about 154 floor tiles at zoom 18 (the
tiles over each building's outline, for each of its floor levels): about 3 minutes at one request
every 1.1 s. This recon took 9 tiles in its sniff and one by itself.

Terms (<https://www.mazemap.com/terms>, "Updated on June 23rd, 2025", read 2026-10-22): "All
extraction and use of maps or data from our Services is prohibited unless a written agreement with
MazeMap has been made." The same page says the customer, here AUT, owns the map data it provides.
These terms were read after the requests above. No MazeMap data was fetched after they were read.

Without this layer the site shows buildings without floors. With the timetable, rooms come from
the room codes, and floors from the level digit.

## Layer 3: timetable

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Public class search: Arion course page | `https://arion.aut.ac.nz/ArionMain/CourseInfo/Information/Qualifications/Details/PaperDetails.aspx?actiontype=1&id=42737` (COMP500) | 200 `text/html`, 68 KB | Code, title, points, level, EFTS, prescriptor, qualifications. A "Timetable" table for each teaching period: Class (`COMP500/W201`), Stream, Starting, Ending, Day, Time, Room (`WA220`, `WS313-314`). 33 meetings in 2026 Semester 2, 2027 Semester 1 and 2027 Semester 2. No staff names, no enrolment numbers, no class type |
| Same, North Campus course | `…/PaperDetails.aspx?actiontype=2&id=44644&id2=5467` (NURS503) | 200 `text/html`, 114 KB | 241 meetings in "2026, Other" and both 2027 half-years, rooms AA, AB, AE, AF, AJ, AN, AZ and one South room (MH320). Every row has a room code |
| Same, a course with no classes listed | `…/PaperDetails.aspx?actiontype=1&id=39153` (COMP717) | 200 `text/html`, 37 KB | "No timetable information is available." |
| Listing pages (GET links) | `…/Qualifications/OrgUnits.aspx`, `Quals.aspx?actiontype=3&id=150082`, `Quals.aspx?actiontype=3&id=150208`, `Details/QualDetails.aspx?id=126`, `PaperTable.aspx?id=5495`, `PaperTable.aspx?id=5467`, `QualificationTypes.aspx`, `Subjects.aspx` | 200 `text/html` each | 22 faculties and schools; 27 and 5 qualifications in two of them; 48 and 28 courses in two qualifications. "Click on the Course Code or Description for further information about the course including timetables." |
| Course search | `…/Qualifications/PaperSearch.aspx` | 200 `text/html` | An ASP.NET form that posts back. Not submitted |
| Arion folder | `https://arion.aut.ac.nz/ArionMain/CourseInfo/` | 403 | Directory listing refused. Not tried again |
| Student system | `https://arion.aut.ac.nz/ArionMain/Enrolments/Information/CurrentStudents/ClassEnrolments.aspx` | 302 to `Default.aspx?action=3`: the Arion sign-in page ("View your timetable or results") | Closed. Not tried again |
| My AUT | `https://my.aut.ac.nz/` | 200 `text/html`, 4.7 KB app shell | AUT's pages say the personal timetable is there after sign-in ("AUT App and My AUT"). Not signed in |
| Lab and study-room booking | `www.labbooking.aut.ac.nz` (named on "Booking PCs and study spaces") | not requested | The page says it needs the AUT network login |
| Exam timetable | `https://www.aut.ac.nz/student-life/studying/study-help/assessments-and-exams/exams` | 200 `text/html` | Exam times are on Canvas, and exam rooms in the AUT App, both after sign-in |
| Published files, official API | AUT site map read; web search | none found | No ICS, CSV or timetable API |
| Earlier student projects | GitHub `MattRipia/AutTimetableScraper` (2018), `vst2213/AUT-Plus` (2024) | read on GitHub only | The 2018 project read the same `PaperDetails.aspx?actiontype=1&id=…` pages, which still answer. The 2024 one points at `ClassEnrolments.aspx`, which now asks for sign-in |

Requests a full fetch would take: about 22 faculty pages, two pages for each qualification (a few
hundred), and one page for each course (2,586 course codes in the 2027 Calendar). That is about
3,000 to 4,000 requests, about one hour at one request every 1.1 s. This is an estimate, not a
count. Each page shows only the current and the coming teaching periods.

Precision: a room code locates a meeting to a room if the indoor layer exists. Without it, the
code gives the building and the level (AUT's rule), and the room stays a code.

## Layer 4: academic calendar

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Key-dates page | `https://www.aut.ac.nz/study/semester-dates` | 200 `text/html`, 58 KB | 2026 and 2027: orientation, first day of classes, mid-semester breaks, study and assessment weeks, last day, for both semesters and summer school. "AUT reserves the right to amend individual dates as required." |
| AUT Calendar 2027 | `https://www.aut.ac.nz/__data/assets/pdf_file/0004/119506/Calendar_2027.pdf` | 200 `application/pdf`, 3.6 MB, 588 pages, made 2026-09-29 | "Academic Dates for 2027" (pages 6 and 7): the above, plus public holidays (Auckland Anniversary, Waitangi Day, Easter, Anzac Day, King's Birthday, Matariki, Labour Day) and the inter-semester breaks |
| AUT Calendar 2026 | `https://www.aut.ac.nz/__data/assets/pdf_file/0008/1167587/Calendar_2026_AUT.pdf` | 200 `application/pdf`, 4.0 MB, 659 pages | The same for 2026 |
| Calendar sections | `https://www.aut.ac.nz/about/auts-leadership/official-aut-publications/read-by-section-academic-calendar` links `./?a=119658` (Academic Dates) | page 200; the `?a=` links not requested | `robots.txt` disallows `/*?a=*`, so the PDFs were used instead |

Business masters and MBA programmes have their own dates (linked from the key-dates page; not
read). Transcribe by hand into `data/academic-calendar.json`, as for Auckland.

## Layer 5: subjects and courses

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Subject codes | 2027 Calendar PDF, "Index of Subject Codes" (page 12) | in the PDF above | About 137 four-letter codes with names (ACCT Accounting to VSAR Visual Arts). "Course codes that begin with ON are offered fully online." |
| Course codes and titles | 2027 Calendar PDF, qualification tables | in the PDF above | 2,586 distinct course codes in the text (2,625 in the 2026 Calendar), with titles and points in each qualification's table |
| Course catalogue | Arion course pages (layer 3) | 200 | Code, title, points, level, EFTS, qualifications, and the periods in which each course has classes. One page per course; no listing endpoint that answers a GET |

The Calendar PDF gives the whole list in one request. Arion adds the terms and campuses, at one
request per course.

## Layer 6: ground heights

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| AWS Terrain Tiles, City | `terrarium/14/16145/9998.png` | already committed in `data/raw/terrain/` (fetched 2026-10-14) | LINZ 8 m DEM, as for Auckland |
| AWS Terrain Tiles, South | `terrarium/14/16151/10006.png` | already committed in `data/raw/terrain/` | LINZ 8 m DEM |
| AWS Terrain Tiles, North | `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/14/16145/9995.png` | 200 `image/png`, 68 KB | `x-amz-meta-x-imagery-sources: nzlinz/lds-tile-ek.tif, srtm/S37E174.tif, gmted/…`: the LINZ 8 m DEM first. Licence CC BY 3.0 NZ |
| LINZ elevation catalogue | `https://nz-elevation.s3.ap-southeast-2.amazonaws.com/catalog.json` | 200 `application/json`, 66 KB | Auckland DEMs: `auckland-north_2016-2018`, `auckland-south_2016-2017`, `auckland-part-1_2024`, `auckland-part-2_2024` |
| Auckland Part 1 LiDAR 1m DEM (2024) | `…/auckland/auckland-part-1_2024/dem_1m/2193/collection.json` and `capture-area.geojson` | 200 `application/json` (24 KB), 200 `application/geo+json` (11 KB) | Licence `CC-BY-4.0`. Providers: Toitū Te Whenua Land Information New Zealand (host, processor), Woolpert (producer), Regional Software Holdings Limited (licensor). Capture interval 2024-04-29 to 2024-06-26 (UTC). 109 tiles. Every vertex of all three MazeMap campus outlines lies inside its capture area |
| Auckland Part 2 LiDAR 1m DEM (2024) | `…/auckland/auckland-part-2_2024/dem_1m/2193/collection.json` and `capture-area.geojson` | 200 | Same providers and licence. No campus vertex inside |
| LINZ attribution page | `https://www.linz.govt.nz/products-services/data/licensing-and-using-data/attributing-elevation-or-aerial-imagery-data` | 403 (CloudFront), as it was for the Clock Tower work (`PROGRESS.md`, "Landmarks") | Not tried again. See "Needs the maintainer" |

The licensor above is as LINZ's own catalogue metadata names it. It agrees with the wording the
repository already uses for the Auckland Part 1 point cloud (`PROGRESS.md`, "Landmarks").
Not checked: two known heights on each campus and pits where land meets sea (RECON.md, layer 6).

## robots.txt and terms

| Host | robots.txt (2026-10-22) | Terms |
| --- | --- | --- |
| `www.aut.ac.nz` | 200. For all agents: `Disallow:/*?a=*`, `/s/`, `/course-search?sq_content_src*`, `/forms/`, `/*_asset*` and others. Every page and PDF read here is outside these | <https://www.aut.ac.nz/copyright>: "Material that the University owns the copyright for may be used in accordance with the Fair Dealing provisions in the Copyright Act 1994 for the purposes of private research and study." It asks for permission for all other uses |
| `arion.aut.ac.nz` | 404: none | AUT's copyright page covers "the Auckland University of Technology websites" |
| `my.aut.ac.nz` | 404: none (read after its one request) | as above |
| `mazemap.aut.ac.nz` | redirects to the app: none | MazeMap's terms |
| `use.mazemap.com`, `api.mazemap.com`, `tiles.mazemap.com` | 404: none (tiles read after its first requests) | <https://www.mazemap.com/terms>, quoted in layer 2 |
| `auth.mazemap.com` | 200: `Disallow:` (nothing), read after its requests | as above |
| `www.mazemap.com` | 200: `Allow: /`, `Disallow: /search` for all agents | as above |
| `overpass-api.de` | 200: `Disallow: /api/` for all agents. Requested first in the same run as the four queries, and read after they had gone out | Overpass usage policy (not read in this recon) |
| `www.openstreetmap.org` | 200: `Disallow: /api/`, `/way/`, `/node/`, `/relation/` and others | ODbL |
| `s3.amazonaws.com` | 403 for `/robots.txt` | AWS Open Data registry (already used by the repo) |
| `nz-elevation.s3.ap-southeast-2.amazonaws.com` | 404: none | CC BY 4.0 per collection |
| `www.linz.govt.nz` | 403 | not readable from the headless browser |

## Needs the maintainer

1. **AUT's permission for layers 3, 4 and 5.** The timetable, the dates and the course list are
   open, but AUT's copyright page allows only private research and study, and asks for permission
   for other uses by email to its Copyright Advisor (address on <https://www.aut.ac.nz/copyright>).
   Ask once for all three and say the site is non-commercial and credits AUT. Or decide that
   class times, dates and codes are facts outside that page; that is the maintainer's call.
2. **A written agreement from MazeMap, with AUT's consent, for layer 2.** MazeMap's terms forbid
   extraction without one, and give AUT ownership of the map data. MazeMap's site advertises "Map
   and Data Export" to its customers, so AUT may be able to give an export itself.
3. **The LINZ attribution page** answered 403 to the headless browser. Read it in your own browser
   to confirm the licensor wording for "Auckland Part 1 LiDAR 1m DEM (2024)".
4. **Overpass for North and South.** Run the pipeline's `scripts/fetch-osm.ts` for two new areas.
   Overpass refused the headless browser (406), and its `robots.txt` disallows `/api/`; the
   repository already uses Overpass as an API client, so whether that line binds the pipeline is
   for you to judge.
5. **A tool gap in `scripts/research/polite.mjs`.** Playwright routes only the first request of a
   redirect chain, so a redirect hop is neither paced nor logged. Six hops went out this way (see
   below).

## Request log

Every request went through `scripts/research/polite.mjs`: 29 reader runs (`politePage` from the
main checkout, documents and in-page fetches only) and three `sniff.mjs` runs on the MazeMap app.
UTC 2026-10-21 11:41:56 to 12:04:40 (2026-10-22 00:41 to 01:05 in New Zealand).

- **Sent:** 165. `api.mazemap.com` 59, `use.mazemap.com` 27, `www.aut.ac.nz` 23,
  `arion.aut.ac.nz` 17, `tiles.mazemap.com` 11, `nz-elevation.s3.ap-southeast-2.amazonaws.com` 6,
  `overpass-api.de` 5, `mazemap.aut.ac.nz` 4, `auth.mazemap.com` 3, `www.mazemap.com` 3,
  `my.aut.ac.nz` 2, `s3.amazonaws.com` 2, `www.linz.govt.nz` 2, `api.openstreetmap.org` 1.
  148 GET and 17 POST. All 17 POSTs were the MazeMap app's own analytics calls to
  `api.mazemap.com/api/analytics/ingest/…`. No form was submitted and nothing was signed in to.
- **Blocked before leaving the machine:** 819. Most were the pages' own scripts, styles and
  images (`www.aut.ac.nz` 434, `arion.aut.ac.nz` 117), and third parties: Mapbox 39, Datadog 22,
  Google Tag Manager 19, LinkedIn 19, Typekit 19, CookieYes 17 and others. No cookie banner was
  loaded, so none had to be refused.
- **Rate:** the shortest gap between two sent requests was 1.088 s; no one-second window held two.
- **Outside the log:** six redirect hops that the browser followed at once (four from
  `mazemap.aut.ac.nz` to `use.mazemap.com`, one Arion sign-in redirect, one from
  `api.openstreetmap.org` to `www.openstreetmap.org`). With them, 171 requests in all.
- **401, 403 and sign-in walls:** `auth.mazemap.com/permissions` 401 (asked by the MazeMap app
  itself), `arion.aut.ac.nz/ArionMain/CourseInfo/` 403, the Arion sign-in redirect,
  `s3.amazonaws.com/robots.txt` 403, `www.linz.govt.nz` 403 (`robots.txt` and the page). Each was
  recorded and not tried again. Overpass answered 406; it was not tried again either.

The raw answers stay outside the repository and are not committed.
