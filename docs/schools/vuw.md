# Te Herenga Waka—Victoria University of Wellington (VUW): public campus data

Recon for a possible port, done on 2026-10-22 (New Zealand time) by the method in
[RECON.md](../../.claude/skills/campus-world-model/RECON.md). It records what VUW publishes without
a sign-in, and on what terms. Nothing here is on the site yet. No fetch script and no data file
comes with it.

Path name if the school is added: `/vuw/` ("Decisions" in `PROGRESS.md`: each school's own short
name; the University's mail domain is `vuw.ac.nz`, its web domain `wgtn.ac.nz`). Time zone:
Pacific/Auckland.

## Verdicts

| Layer | Verdict | What decided it |
| --- | --- | --- |
| 1. Footprints and surroundings | usable | OpenStreetMap (ODbL). The Auckland premises are already in the committed `central` snapshot (one building named "Victoria University of Wellington"). Wellington has no area in the repository yet: Kelburn, Pipitea and Te Aro need new areas, fetched by `scripts/fetch-osm.ts` as the repository's other areas are (see "Needs the maintainer", 4) |
| 2. Indoor: buildings, floors, rooms | usable for a room list; floor and room outlines not published | No indoor-mapping vendor: the campus maps are Google Maps embeds with named points. "Locate a room" lists 48 building codes and their campus; the ITS room report lists 266 teaching rooms with capacity and equipment class. Floor plans are PDF pictures only |
| 3. Timetable | needs the maintainer | Open: the "Academic Timetable" spreadsheets (2026, 2027) give every lecture, tutorial, lab and studio with days, times, weeks and room code, with no sign-in. But they sit under `/tools`, which `www.wgtn.ac.nz/robots.txt` disallows for all agents, so they were not fetched. Without them, lecture days and times are public only to the campus (no room). myTimetable (Scientia Publish) has guest timetables switched off |
| 4. Academic calendar | needs the maintainer | The dates are in the key-dates app and the 2026 Calendar PDF, both served from `/__data/`. `robots.txt` has `Disallow: /__data/.*`, which reads two ways (see "Needs the maintainer", 2). Only the teaching weeks are on an allowed page |
| 5. Subjects and courses | usable | The "Printable Course Catalogue" on `service-web.wgtn.ac.nz` (no `robots.txt`): four requests give all 2026 courses, 3,513 course codes in 174 subject codes, with title, points, trimester, CRN, lecture days and times, and campus |
| 6. Ground heights | usable | AWS Terrain Tiles hold the LINZ 8 m DEM (CC BY 3.0 NZ) under Kelburn, Pipitea and Te Aro. All 35 map points on VUW's three Wellington campus pages lie inside "Wellington - Wellington City LiDAR 1m DEM (2025)" (CC BY 4.0) |

VUW's copyright page allows non-commercial reproduction without asking (see "robots.txt and
terms"), so layers 3 and 4 are held back by `robots.txt` alone, not by the terms. The usable
verdicts hold while the site is non-commercial: it carries no advertising.

## Campuses

VUW names three campuses (Kelburn, Pipitea, Te Aro), "Auckland premises" and the Miramar Creative
Centre on "Our campuses and sites". Its "Locate a room" page gives each building code a campus or
other location, eight in all. Room codes are a building code of two to four letters, "LT" for a
lecture theatre, then the room number: "Typically the first digit of the number tells you what
level the room is on" ("Locate a room").

| Place | Address (source) | Building codes ("Locate a room") | Points on its campus page | Campus labels in the 2026 printable lists (undergraduate + postgraduate) | OpenStreetMap in the repo | LiDAR 1 m DEM |
| --- | --- | --- | --- | --- | --- | --- |
| Kelburn Campus (main campus) | Kelburn, Wellington (no street address on its page) | 31: AAG, AM, BWA, CO, CSB, CT, EA, FT, FT77, HB, HM, HU, KK, KP, LB, MARU, MC, MOKO, MS, MT, MY, OK, RB, RC, RS, SU, THW, TTR, VZ, VZS, WR | 24 | 2,807 + 1,764 | none: a new area | Wellington City (2025): all 24 points inside |
| Pipitea Campus | Government Buildings, 55 Lambton Quay; Rutherford House, 23 Lambton Quay | 2: GB, RH | 7 | 260 + 512 | none: a new area | Wellington City (2025): all 7 points inside |
| Te Aro Campus | 139 Vivian Street; Te Auaha, 65 Dixon Street; NEC House, 40 Taranaki Street; Wigan | 4: VS, TA, NEC, WG | 4 | 548 + 233 | none: a new area | Wellington City (2025): all 4 points inside |
| Auckland premises | Level 4, 50 Kitchener Street, Auckland CBD (its campus page) | 1: KS | 6 | 0 + 52 ("Auckland (Kitchener St)") | inside the `central` area: way 370301075 | not checked |
| Miramar Creative Centre | 133 Park Road, Miramar ("Locate a room") | 1: PR133 | not read (the page redirects to `/mcc`) | 0 + 54 | none | not checked |
| Lower Hutt | Gracefield Innovation Quarter, 69 Gracefield Road (GIQ; wings B, E, F, H and I of Paihau—Robinson Research Institute); 76 Sydney Street, Petone | 7: GIQ, RBG, REG, RFG, RHG, RIG, SS76 | none | none | none | Hutt City (2025) exists; not checked against these sites |
| Island Bay | Te Toka Tū Moana—Wellington University Coastal Ecology Laboratory, 396 The Esplanade | 1: CEL | none | none | none | not checked |
| Newtown | Ngā Puna Waiora—Wellington Hospital, 39 Riddiford Street | 1: WH | none | 16 + 69 ("Wellington Regional Hospital") | none | not checked |

The 2026 lists also name places that are not campuses: "Taught Online", "Distance",
"Inter-institutional (NZ)" (34), "RELC Singapore" (19), "NZDF Trentham" (16), "Karori" (2) and
"Access Victoria" (2), all in the postgraduate list. The 2027 undergraduate list adds
"Civic Square (WTH)" (2) and "Greek Field Trip" (1).

Places to leave blank: the specialist-facilities page names University Kids Wellington, which
"provides daycare to the families of staff and students"; the Kelburn campus map PDF has legend
symbols for an "Early childhood centre" and for "Student hall of residence". The halls and the
childcare centre were not located in this recon.

## What the site can do

- **With the usable layers only:** Kelburn, Pipitea and Te Aro in 3D from OpenStreetMap
  footprints on LINZ ground (and the Auckland premises, which the `central` area already holds).
  Buildings can take their names from VUW's own map points (24 on Kelburn) where a point falls in
  a footprint, and their codes from "Locate a room". The 266 teaching rooms of the ITS report can
  be listed by code and capacity: the code gives the building, and its first digit the level by
  VUW's rule, so a room is located to a building and an inferred floor, labelled as from the code,
  with no outline. Course search knows 3,513 course codes with titles and, for each offering, the
  trimester and the lecture days and times. Those times are known only to the campus, so they
  cannot be placed in a building or room: search can show them as "Kelburn campus, room not
  published", and the map shows no classes.
- **If the maintainer clears `/tools` (or VUW agrees):** every class meeting from the Academic
  Timetable, with its room code. A meeting is then located to a room code, with the building and
  an inferred floor from the code. Rooms still have no outline.
- **If the maintainer clears `/__data/` (or VUW agrees):** the key dates of 2026 from the
  Calendar PDF. Today only the teaching weeks are known.
- **Floor and room outlines:** no source found publishes them. Floors are inferred from room codes
  and labelled so; there are no floor plans to draw.

## Layer 1: footprints and surroundings

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Committed OSM snapshot | `data/raw/osm/context.json` (Overpass base 2026-07-24) | read locally, no request | Way 370301075: `building=yes`, `amenity=university`, `name` "Victoria University of Wellington", `name:mi` "Te Whare Wānanga o te Upoko o Te Ika a Māui", `wheelchair=yes`; no levels, no height; about 20 m across. Its centre is about 55 m from the "Auckland premise" point on VUW's Auckland page |
| The repository's areas | `scripts/lib/areas.ts` | read locally | `central` and six Auckland areas; none in Wellington |
| Overpass | not requested | none | AUT's recon of the same day found `overpass-api.de/robots.txt` disallows `/api/` and that Overpass refuses a headless browser (406). The pipeline's `scripts/fetch-osm.ts` is the route. The tags of VUW's Wellington buildings (`name`, `ref`, `building:levels`, `height`) were not read |
| Wellington City Council 3D buildings | `https://catalogue.data.govt.nz/dataset/p-mt-victoria-north` (one tile of a series) | 200 `text/html`, about 35 KB | "Wellington 3D buildings captured 5 May 2017. Part of a series of 3D Building data sets covering from Kaiwharawhara in the northwest to Rongotai in the southeast." Licence: "No License Provided". Source: an Esri REST service on `data-wcc.opendata.arcgis.com`. Not used |

Licence for OpenStreetMap: ODbL, credit in About.

## Layer 2: indoor (buildings, floors, rooms)

VUW's site header has a "Mapi / Maps" link to "Our campuses and sites". Each campus page has a
Google Maps frame and a list of named points. No indoor-mapping vendor (MazeMap, MapsIndoors,
Concept3D, Mappedin, ArcGIS Indoors, Pointr) was named in the pages read, and a web search found
none. The map frame itself was not read (next table).

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Campus map, own requests | `https://www.wgtn.ac.nz/about/campuses-facilities/campuses/kelburn` (also `/pipitea`, `/te-aro`, `/auckland`) | 200 `text/html` each | A frame `https://www.wgtn.ac.nz/nestable-content/maps/map?lat=…&long=…&zoom=17&folder=<id>&poi-list=yes`, and in the page itself a "Points of interest" list: each point has `data-lat`, `data-long` and a name ("Old Kirk building", "Hunter Building", "Maclaurin lecture theatres", "Library", bus stops). 24 points on Kelburn, 7 on Pipitea, 4 on Te Aro, 6 on Auckland. Points only: no outlines, no floors |
| The map frame | `…/nestable-content/maps/map?…` (four campuses) | 200, loaded by the browser by itself as part of each page (a lapse: `robots.txt` disallows `/nestable-content/`; see "Request log") | Not saved and not read. Its Google Maps scripts (`maps.googleapis.com`) were blocked |
| A Google My Maps frame | `https://www.google.com/maps/d/embed?mid=…` in the Kelburn page | not requested | It sits inside an HTML comment, so the page does not show it |
| Room directory: "Locate a room" | `https://www.wgtn.ac.nz/about/campuses-facilities/room-location` | 200 `text/html`, about 108 KB | 48 rows: building code, building name, campus or location (counts in "Campuses"). The room-code rule. No rooms listed |
| Room directory: ITS room report | `https://www.wgtn.ac.nz/itsroomspecs/RoomDetail.ashx` | 200 `text/html`, 11,822 bytes | "Rooms By Equipment Specification (with room capacity)": 266 rooms, each with code and capacity (0 to 355), in nine classes: FFTS ("Flat Floor Teaching Space") 75, X (no definition in the report) 61, STR ("Small Teaching Room") 55, LT ("Lecture Theatre") 35, FLS ("Flexible Learning Space") 13, MR ("Meeting Room") 12, CETS ("Computer Equipped Teaching Space") 8, MAV ("Medium AV") 5, AVL ("AV Equipped Lab") 2. The codes start with the building codes of "Locate a room" (CO, KK, MY, RH, VS, VZ and others). Some carry a letter level, not a digit (`GBG04`, `RHMZ03`). No floor field, no outline |
| Venue hire: lecture theatres | `https://www.wgtn.ac.nz/about/campuses-facilities/venue-hire/lecture-theatres` | 200 `text/html`, 119,570 bytes | Capacity ranges only ("134 to 340 people", "42 to 85 people") |
| Open data | web search for a VUW GIS or open-data portal | none found | Wellington City Council's 3D buildings (layer 1) are exteriors, not indoor |
| Floor-plan PDF, Kelburn | `https://www.wgtn.ac.nz/about/campuses-facilities/campuses/kelburn/kelburn-campus-map.pdf` | 200 `application/pdf`, 2,515,969 bytes, 2 pages, made 2025-12-08 | "Kelburn Campus Map" 2026: a campus drawing, accessible routes, and a directory of buildings, faculties, schools and services with building codes and grid references. Legend symbols include "Early childhood centre" and "Student hall of residence". No floor plans |
| Floor-plan PDF, Pipitea | `https://www.wgtn.ac.nz/about/campuses-facilities/campuses/pipitea/pipitea-campus-map.pdf` | 200 `application/pdf`, 5,240,996 bytes, 2 pages, made 2025-12-08 | "Pipitea Campus Map" 2026 with a directory (building code RH or GB, grid reference). No floor plans |
| Floor-plan PDF, Te Aro | `https://www.wgtn.ac.nz/wfadi/pdf/te-aro-campus-map.pdf` | 200 `application/pdf`, 349,592 bytes, 1 page, made 2025-01-29 | "Level 1 Campus Floor Plan 2025" of the Architecture and Design faculty: a picture with room labels (VS103 to VS128, WG101, LT1, LT2). No machine-readable outlines |

Without outlines the building view shows floors inferred from room codes, each labelled so.

## Layer 3: timetable

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Published file: Academic Timetable 2026 | `https://www.wgtn.ac.nz/tools/timetable/2026-Academic-Timetable.xlsx` | not requested: `robots.txt` has `Disallow: /tools` for all agents | The link says 251.8 KB. The page "University timetable" says it "includes the time and location for lectures, tutorials, labs, and studios for every scheduled course offered that year", and gives its columns: Course, CRN, Type, Weeks, Days (M T W R F S U), Start and Finish (24-hour), Room. "Classes that are held online are indicated by an empty cell for the room." It covers two summer periods too |
| Published file: Academic Timetable 2027 | `https://www.wgtn.ac.nz/tools/timetable/2027-academic-timetable.xlsx` | not requested, as above | The link says 117.1 KB |
| Published file: exam timetable | `https://www.wgtn.ac.nz/tools/timetable/end-year-exam-and-assessment-timetable.xlsx.xlsx` | not requested, as above | The link says 29.1 KB: "The 2026 end-year examination and final assessment timetable" |
| The pages that link them | `https://www.wgtn.ac.nz/students/study/timetable`, `…/timetable/academic-timetable` | 200 `text/html` each | The column guide above, and the teaching weeks (layer 4) |
| Public class search: course finder | `https://www.wgtn.ac.nz/courses/COMP/102?year=2026` | 200 `text/html`, 199,599 bytes | A client-side "Courses App". The page carries the data as JSON (`window.restResponse1Parsed`, from the search collection `sqc-all-courses`): 6 records (COMP 102 in 2025 to 2027, Trimesters 1 and 2), 54 field names in all, among them `courseCode`, `courseName`, `courseReferenceNumber`, `courseSubAcademicPeriod`, `courseOfferingStartDate` and `EndDate`, `courseLectureDays`, `courseLectureStartTime`, `courseLectureEndTime`, `courseLectureCampus` ("Kelburn"). No room. It also carries lecturer and coordinator names and staff ids, which a parser would drop |
| Course records behind it | `https://search.wgtn.ac.nz/s/cache?collection=sqc-all-courses&url=…` (XML, about 4.9 KB each by the page's own `fileSize`) | not requested: `search.wgtn.ac.nz/robots.txt` disallows `/s/` | Unknown |
| Student timetable: myTimetable | `https://timetable.victoria.ac.nz/` | 200 `text/html`: Scientia Publish, "Web 4.3.0-14 / Api 4.3.0.199"; the page shows "Welcome to Publish" and "Log in" | Closed without a sign-in (next row). "Log in" was not pressed |
| Its public settings (asked for by the app itself) | `https://cyon-syd-v4-api-d1-03.azurewebsites.net//api/Public/InstitutionSettings` | 200 `application/json`, 1,327 bytes | `"AnyGuestTimetablesEnabled": false`, `"PersonalTimetablesFeature": "Enabled"`, `"ObjectTimetablesFeature": "Full"`, sign-in through `sciauth.scientia.com`. So the room and course timetables exist in Publish, but only after a sign-in |
| Student portal: Pūaha | `https://puaha.wgtn.ac.nz/SignIn` (linked as "Log into Pūaha") | not requested: a sign-in page | VUW's pages say the personal timetable and the exam timetable are there |
| Tutorial sign-up: myAllocator | named on "Timetables and tutorials" | not requested | For enrolled students choosing class times |
| Official API | `https://www.wgtn.ac.nz/_service/courses/2.1/offerings/943?year=2026` (the 2018 route below; `robots.txt` has `Allow: /_service/courses/`) | 404 `text/html` (IIS "File or directory not found") | Gone. Web search found no developer API |
| Earlier student projects | GitHub `morganfrenchstagg/vuw-timetable` (2018), read on GitHub only | — | It read `https://www.victoria.ac.nz/_service/courses/2.1/offerings/<CRN>?year=<year>`, JSON with `timetable.items[].days[].times[].location.buildingName` and `.room`. That route now answers 404 (row above). GitHub searches for "wgtn timetable", "victoria university wellington timetable", "vuw course planner" and code search found nothing else |

Requests a full fetch would take, if `/tools` is cleared: two, one spreadsheet a year. Without the
spreadsheets, the lecture days, times and campus of every course come with layer 5 in four
requests, and the course pages add nothing that the lists do not have.

Precision: a room code locates a meeting to a room code. The building comes from the code list,
and the level from the first digit, which VUW says is "typically" the level: inferred and
labelled so. Rooms have no outlines.

## Layer 4: academic calendar

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Key dates, current students | `https://www.wgtn.ac.nz/students/study/dates` | 200 `text/html`, about 171 KB | No dates in the HTML: a script app (`keydates-app-v2`, audience "Key dates - Current Students") draws them. Its script is at `/__data/assets/git_bridge/…`, which `robots.txt` disallows, so it was not loaded |
| Key dates, future students | `https://www.wgtn.ac.nz/study/apply-enrol/dates` | 200 `text/html`, about 102 KB | The same app. The static text says "Apply for your Trimester 1 2027 programme of study by 20 January 2027" |
| Teaching weeks | `https://www.wgtn.ac.nz/students/study/timetable/academic-timetable` | 200 `text/html` | Trimester 1 "Weeks 8-12, mid-trimester break, weeks 15-21"; Trimester 2 "Weeks 27-32, mid-trimester break, 35-40"; Summer "Weeks 46-50", "Weeks 46-50, 1-5", "Weeks 1-5". Weeks, not dates; no exam periods or holidays |
| University Calendar | `https://www.wgtn.ac.nz/about/governance/university-publications/calendar` | 200 `text/html`, 107,244 bytes | "A yearly publication which includes dates, contact information, statutes, policies, regulations and general University information." Links `https://www.wgtn.ac.nz/__data/assets/pdf_file/0011/2321984/te-herenga-waka-calendar-2026.pdf` (6.7 MB) and the 2025 one (7.8 MB): not requested, under `/__data/` |
| Wall calendar | `…/__data/assets/pdf_file/0004/1991083/wall-calendar.pdf` (found by web search on a mirror host) | not requested: same path, and the mirror host is not VUW's own | A web search summary says it covers 2024 to early 2026 |

If `/__data/` is cleared: one request for the 2026 Calendar PDF, then transcribe the dates by hand
into `data/academic-calendar.json`, as for Auckland.

## Layer 5: subjects and courses

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Printable list, undergraduate 2026 | `https://service-web.wgtn.ac.nz/dotnet2/catprint.aspx?d=all&t=u2026` (linked from the course finder as `http://`, which redirects to `https://`) | 302, then 200 `text/html`, about 3.0 MB | "Printable Course Catalogue": 1,642 course codes in 113 subject codes. Each course: code, title, a description, points, prerequisites (P), corequisites (C), restrictions (X), "Not offered in 2026", and for each offering a line such as "1/3 • CRN 23001 • (L1) Mon, Fri 3-4pm [Kelburn]": trimester, CRN, lecture days and times, campus. 2,870 offering lines |
| Printable list, postgraduate 2026 | `…?d=all&t=p2026` | 200 `text/html`, about 2.3 MB | 1,883 codes in 154 subject codes; 2,559 offering lines |
| Printable list, pre-degree 2026 | `…?d=all&t=o2026` | 200 `text/html`, about 39 KB | 25 codes in 4 subject codes |
| Printable list, distance 2026 | `…?d=all&t=d2026` | 200 `text/html`, about 119 KB | 65 codes in 22 subject codes |
| Printable list, undergraduate 2027 | `…?d=all&t=u2027` (not linked; the same pattern) | 200 `text/html`, about 3.0 MB | 1,645 codes in 113 subject codes. Course enrolment for 2027 is open, by the future-students dates page |
| Subject names | `https://www.wgtn.ac.nz/students/study/enrolment/courses` | 200 `text/html`, about 198 KB | "Browse our courses by subject": 203 subject names, without codes. The subject codes come with the lists above |
| Course pages | layer 3 | 200 | One page a course, with three years in each |

Together the four 2026 lists hold 3,513 distinct course codes in 174 subject codes, in four
requests. Keep the facts (code, title, points, trimester, campus), not the descriptions: VUW's
copyright condition asks for reproduction "accurately and without modifications". A few
descriptions name a teacher, which is one more reason to drop them.

## Layer 6: ground heights

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| AWS Terrain Tiles, Kelburn | `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/14/16145/10258.png` | 200 `image/png` | `x-amz-meta-x-imagery-sources: nzlinz/lds-tile-mk.tif`: the LINZ 8 m DEM. Licence CC BY 3.0 NZ |
| AWS Terrain Tiles, Pipitea | `…/terrarium/14/16146/10258.png` | 200 `image/png` | `nzlinz/lds-tile-mk.tif, srtm/S42E174.tif, gmted/50S150E_20101117_gmted_mea075.tif`: LINZ first, SRTM and GMTED over the harbour |
| AWS Terrain Tiles, Te Aro | `…/terrarium/14/16146/10259.png` | 200 `image/png` | `nzlinz/lds-tile-mk.tif` |
| AWS Terrain Tiles, Auckland premises | `terrarium/14/16145/9998.png` | already committed in `data/raw/terrain/` | LINZ 8 m DEM, as for Auckland |
| LINZ elevation catalogue | `https://nz-elevation.s3.ap-southeast-2.amazonaws.com/catalog.json` | 200 `application/json`, 66,450 bytes | Wellington region DEMs include `wellington-city_2025`, `wellington-city_2019-2020`, `wellington_2013-2014`, `hutt-city_2025`, `hutt-city_2021` |
| Wellington City LiDAR 1m DEM (2025) | `…/wellington/wellington-city_2025/dem_1m/2193/collection.json` and `capture-area.geojson` | 200 `application/json` (4,281 bytes), 200 `application/geo+json` (2,843 bytes) | Licence `CC-BY-4.0`. Providers: Toitū Te Whenua Land Information New Zealand (host, processor), Aerial Surveys (producer), Wellington City Council (licensor). Capture 2025-01-22 to 2025-02-07 (UTC). 12 items. All 35 points of the Kelburn, Pipitea and Te Aro pages lie inside its capture area |
| Hutt City LiDAR 1m DEM (2025) | `…/wellington/hutt-city_2025/dem_1m/2193/collection.json` and `capture-area.geojson` | 200 (4,256 bytes), 200 (4,305 bytes) | Same licence and producer; licensor Hutt City Council. The Lower Hutt sites were not checked against it: VUW gives no coordinates for them |
| LINZ attribution page | not requested | — | AUT's recon of the same day got 403 from it (`www.linz.govt.nz`); see "Needs the maintainer", 5 |

Not checked: two known heights on each campus and pits where land meets sea (RECON.md, layer 6).
The Pipitea tile reaches the harbour (it mixes in SRTM and GMTED), so the pit check matters there.

## robots.txt and terms

| Host | robots.txt (2026-10-22) | Terms |
| --- | --- | --- |
| `www.wgtn.ac.nz` | 200 (last modified 2026-07-13). For all agents, among others: `Disallow: /tools`, `Disallow: /__data/.*`, `Disallow: /nestable-content/`, `Disallow: /search`, `Disallow: /api/.*`, `Disallow: /_service/` with `Allow: /_service/courses/`, `Disallow: /study/programmes-courses/courses.*`, `Disallow: /students/study/enrolment/courses/by-subject`. Agent groups `HeadlessChrome`, `ClaudeBot` and `Claude-Web` each have `Crawl-delay: 10` | <https://www.wgtn.ac.nz/site-info/copyright>: "You can reproduce such material free of charge for non-commercial purposes and without further permission from Te Herenga Waka—Victoria University of Wellington (the University), as long as you:" reproduce it accurately and without modifications, not in a derogatory or misleading context, and acknowledge the source and the owner. Commercial use needs prior written permission |
| `search.wgtn.ac.nz` | 200: `Disallow: /search/`, `Disallow: /s/` for all agents | as above |
| `service-web.wgtn.ac.nz` | 404: none | as above |
| `timetable.victoria.ac.nz` | none: every path, `/robots.txt` too, returns the app page (200 `text/html`) | as above; Scientia's terms not read (the route is closed) |
| `cyon-syd-v4-api-d1-03.azurewebsites.net` (Scientia's API) | 404: none | not read |
| `puaha.wgtn.ac.nz` | not requested | — |
| `nz-elevation.s3.ap-southeast-2.amazonaws.com` | 404: none | CC BY 4.0 per collection |
| `s3.amazonaws.com` | not requested (AUT's recon got 403 for it the same day) | AWS Open Data registry (already used by the repo) |
| `catalogue.data.govt.nz` | 200: `Disallow: /api/` and query patterns; `Crawl-Delay: 10` | the WCC dataset says "No License Provided" |
| `overpass-api.de` | not requested (AUT's recon: `Disallow: /api/`) | ODbL for the data |

Two notes on `www.wgtn.ac.nz/robots.txt`. Under RFC 9309 an agent follows the most specific group
that names it, so a `HeadlessChrome` browser falls under a group with only a crawl delay, while the
pipeline's own User-Agent (`scripts/lib/snapshot.ts`) falls under `*` and its disallows. This recon
kept both: the `*` disallows and the 10 s delay. Lines such as `/__data/.*` are written like
regular expressions; RFC 9309 gives the dot no special meaning, so read literally they match only
paths that start `/__data/.`. This recon took the wider reading.

## Needs the maintainer

1. **The Academic Timetable spreadsheets under `/tools`.** They are public and linked for students,
   and VUW's copyright page allows non-commercial reproduction, but `robots.txt` disallows `/tools`
   for all agents, the pipeline included. Ask VUW whether the site may fetch the two files (2026
   and 2027) when they change, or decide that two linked downloads are not what that line is for.
   With them, classes are located to a room code.
2. **What `/__data/.*` covers.** The 2026 Calendar PDF, the key-dates app and every PDF that VUW
   serves from its content system sit under `/__data/`. Read literally (RFC 9309) the line blocks
   almost nothing; read as written it blocks them all. Decide which reading the pipeline keeps, or
   ask VUW with item 1.
3. **The copyright condition.** VUW allows non-commercial reproduction "accurately and without
   modifications", with acknowledgement. The site simplifies what it takes, as it does for
   Auckland, so it stands on being non-commercial, crediting VUW and offering to remove anything
   on request. One message to VUW can cover items 1 to 3.
4. **Overpass for Wellington.** Run `scripts/fetch-osm.ts` for new areas over Kelburn, Pipitea and
   Te Aro (and Miramar, Gracefield, Island Bay and Newtown if wanted), as for Auckland. Not
   requested here, for the reasons in AUT's recon.
5. **The LINZ attribution page** (`www.linz.govt.nz`) answered 403 to a headless browser in AUT's
   recon. Read it in your own browser to confirm the credit wording for "Wellington City LiDAR 1m
   DEM (2025)", whose licensor is Wellington City Council.
6. **A tool gap: frames count as documents.** `politePage(…, { types: ["document"] })` lets a
   page's frames through, because a frame's request is a document too. Reading the campus pages
   that way loaded four map frames from `/nestable-content/`, a path `robots.txt` disallows, each
   1.1 s after its page (see "Request log"). Reading a page by an in-page `fetch()` instead avoids
   it, and this recon did so from then on. A `mainFrameOnly` option in `polite.mjs` would close
   the gap.

## Request log

Every request went through `scripts/research/polite.mjs` as it is on branch
`loop-polite-redirects` (pull request #71, open), which gates each redirect hop too: 18 runs of one
scratch reader
(`politeLaunch` and `politePage`; documents and in-page fetches, and twice the myTimetable app
with its scripts). Web searches, and reading one earlier student project through the GitHub API,
did not touch the school's hosts and are not in the log. UTC 2026-10-21 20:29:51 to 20:49:15
(2026-10-22 09:29 to 09:49 in New Zealand).

- **Sent:** 78. `www.wgtn.ac.nz` 34, `timetable.victoria.ac.nz` 21, `service-web.wgtn.ac.nz` 7,
  `nz-elevation.s3.ap-southeast-2.amazonaws.com` 6, `cyon-syd-v4-api-d1-03.azurewebsites.net` 4,
  `s3.amazonaws.com` 3, `catalogue.data.govt.nz` 2, `search.wgtn.ac.nz` 1. 77 GET and one OPTIONS
  (the CORS check the myTimetable app made before its settings request). Answers: 71 × 200, one
  301, two 302, four 404. No form was submitted, nothing was signed in to, and no POST went out.
- **Blocked before leaving the machine:** 446. 337 were the pages' own scripts, styles and images,
  refused by type (a reading run lets only documents and fetches through): 307 on
  `www.wgtn.ac.nz`, 24 on `catalogue.data.govt.nz`, 6 on `timetable.victoria.ac.nz`. 48 were the
  browser's own icon requests. 61 went to hosts not allowed: Google Tag Manager 15,
  `staticcdn.co.nz` 14, `polyfill-fastly.io` 14, `maps.googleapis.com` 4, Azure Application
  Insights and Rapid7 logging from the myTimetable app 7, Google Fonts 3, and others. No cookie
  banner was loaded, so none had to be refused.
- **Rate:** the shortest gap between two requests was 1.100 s, and no second held more than one.
- **Crawl delays:** `www.wgtn.ac.nz` asks 10 s of `HeadlessChrome` and `ClaudeBot`. Most of its
  requests were 10 s or more apart, but ten gaps were shorter: four map frames that the browser
  loaded 1.1 s after their campus pages, from a disallowed path (`/nestable-content/`); two
  redirect hops 1.1 s after the request that led to them; and four pages that came 9 s after one
  of those frames. After that run the pages were read by in-page fetch, one every 10 s.
  `catalogue.data.govt.nz` asks `Crawl-Delay: 10`: its second request went 4.0 s after its
  `robots.txt`, read in the same run. Both are lapses.
- **Order:** each host's `robots.txt` was read before anything else was sent to it, with one
  exception: `s3.amazonaws.com`, whose `robots.txt` answered 403 to AUT's recon the same day, so
  it was not asked for again. The myTimetable app's first load asked for
  `cyon-syd-v4-api-d1-03.azurewebsites.net` before that host's `robots.txt` was read; the request
  was blocked (host not allowed), and the host was allowed only after its `robots.txt` was read.
- **401, 403 and sign-in walls:** none answered. myTimetable shows "Log in" and its settings say
  guest timetables are off; "Log in" was not pressed. Pūaha's sign-in page was not requested.

The raw answers stay outside the repository and are not committed. VUW's terms allow
non-commercial reproduction, so nothing had to be deleted for terms.
