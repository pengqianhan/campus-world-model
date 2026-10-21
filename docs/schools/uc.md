# University of Canterbury | Te Whare Wānanga o Waitaha (UC): public campus data

Recon for a possible port, done on 2026-10-22 (New Zealand time) by the method in
[RECON.md](../../.claude/skills/campus-world-model/RECON.md). It records what UC publishes without
a sign-in, and on what terms. Nothing here is on the site yet. No fetch script and no data file
comes with it.

Path name if the school is added: `/uc/` ("Decisions" in `PROGRESS.md`: each school's own short
name; UC's web domain is `canterbury.ac.nz`). Time zone: Pacific/Auckland.

## Verdicts

| Layer | Verdict | What decided it |
| --- | --- | --- |
| 1. Footprints and surroundings | usable | OpenStreetMap (ODbL). The repository's seven areas are all in Auckland: Ilam and Dovedale, the city sites and Nelson need new areas, fetched by `scripts/fetch-osm.ts` as the others are (see "Needs the maintainer", 5) |
| 2. Indoor: buildings, floors, rooms | needs the maintainer | Open: the campus map's own request (one GET, no sign-in) returns 937 named points with latitude and longitude, among them 113 buildings and 85 points in the two classes the map itself calls teaching spaces ("Lecture theatres", "Teaching rooms"), which list 482 room labels. Points only: no floor or room outlines anywhere. UC's copyright page forbids copying its web material without written permission |
| 3. Timetable | needs the maintainer | The public "Timetable planner" (Allocate+, "a course schedule without being enrolled", with Subjects and Locations tabs) sits on `timetable.canterbury.ac.nz`, whose `robots.txt` disallows everything for every agent. The Course Information System's `robots.txt` disallows ClaudeBot, Claude-Web and anthropic-ai, so this recon did not read it. My Timetable needs a sign-in. Only the 2026 end-of-year exam timetable (course, date, time, venue) is open on an allowed path, under the same copyright line |
| 4. Academic calendar | needs the maintainer | Open: the key-dates page and the "Key University Dates" PDFs for 2026 and 2027. The same copyright line holds them back |
| 5. Subjects and courses | needs the maintainer | Open: the "Courses" page lists 164 four-letter subject codes. The course list itself is in the Course Information System (layer 3: not read). The same copyright line |
| 6. Ground heights | usable | "Canterbury - Christchurch LiDAR 1m DEM (2024-2025)" (CC BY 4.0) covers the Ilam, Dovedale and city points; "Nelson LiDAR 1m DEM (2025)" (CC BY 4.0) covers the Nelson centre. The AWS Terrain Tiles were not requested for Christchurch |

UC's copyright page says: "Material on the University of Canterbury (UC) webpages may not be
copied, distributed, or used for commercial purposes without the prior, express written permission
of UC." Unlike VUW's, it gives no non-commercial allowance, so layers 2, 4 and 5 wait on UC's
written permission, as AUT's did on AUT's. Two more doors are shut by `robots.txt`, not by the
terms: the timetable planner (to every agent) and the Course Information System (to Claude's
agents). One message to UC can cover all of it (see "Needs the maintainer").

## Campuses

UC's "Our campuses" page: "UC is based on the main Ilam campus in Christchurch, but we also have a
number of other locations. These include Dovedale campus, Arts Centre, Nelson campus, and our field
stations." The campus map's points carry a `campus` field on only 101 of 937 points (`ilam` 95,
`dovedale` 5, `uc-arts-city` 1), so the places below are located by their own points.

| Place | Address (source) | Its points on the campus map | OpenStreetMap in the repo | LiDAR 1 m DEM |
| --- | --- | --- | --- | --- |
| Ilam campus (main) | Ilam, Christchurch (no street address on "Our campuses") | Most of the 937; for example a "Puaka-James Hight" point at -43.5236, 172.5828 | none: a new area | Christchurch (2024-2025): inside |
| Dovedale campus | no street address on its page; "home of UC's Bachelor of Digital Screen with Honours degree" | 5 points carry `campus:dovedale` (a café, a parents' room, the security office, a defibrillator); the building points "Otakaro" (keyword `ed03`) at -43.5211, 172.5678 and "Otakaro Annex" (`ed02`) carry none; lecture theatres "Otakaro 146 L1" and "Otakaro 236 L2" | none: a new area (beside Ilam) | Christchurch (2024-2025): inside |
| UC Arts city location (Arts Centre) | "3 Hereford St, Christchurch City" (its page): "UC Music and UC Classics city centre location hosts certain Arts classes and lectures" | "Arts Centre" (building), "Arts Centre Teaching Rooms", "Old Chemistry Building" (`campus:uc-arts-city`) | none: a new area | Christchurch (2024-2025): inside |
| Manawa | "276 Antigua Street", "Health Research and Education Facility" (its map point) | "Manawa" (building), "Manawa Teaching Rooms" (rooms `Manawa HREF HP101` and on) | none: a new area | Christchurch (2024-2025): inside |
| Rose Centre for Stroke Recovery and Research | no address read | two points at -43.5103, 172.6191 | none | Christchurch (2024-2025): inside |
| Nelson campus | "145 Collingwood Street" (its page); "UC's Nelson Campus offers Teacher Education programmes" ("Our campuses") | "UC Nelson Centre" at -41.2760, 173.2870 | none | Nelson (2025): inside |
| Field stations | "Research Field Stations" page: Mt John Observatory, Cass Station, Westport Station, Kaikōura Station | one point each (Cass, Kaikōura, Westport, "Mt John Observatory, Takapō") | none | none of the two DEMs checked covers them |

The map's class "UC off campus locations" has 16 points besides the four field stations; one is
the Nelson centre, and the other 15 are not campuses but places named for UC's work, such as "New Plymouth Centre", "Rotorua Centre", "Oamaru", "Hagley College",
"Lincoln University", "Christchurch District Court", "Halswell Quarry", "Mt Cook", "Scion",
"SoFA Gallery", "University Theatre". Course occurrence codes carry a site letter ("a course
occurrence code includes additional information on when and where a course is held (year,
semester, and site)", the "Courses" page): the exam timetable shows `(C)` and `(D)`. Their meanings
were not read.

Places to leave blank. The map's class "Halls of residence" has 10 points (Arcady Hall, College
House, Hayashi, Ilam Apartments, Kirkwood Avenue Hall, Rochester and Rutherford Hall, Sonoda
Christchurch Campus, Tupuanuku, University Hall, Waitakiri Village) and "Early Childhood Centres"
3 (Ilam Early Learning Centre, Montana Early Childhood Learning Centre, Early Childhood Learning
Centre). Two points in the teaching class need a check before any room in them is named:
"Education Childcare Teaching Rooms" (rooms 106 to 108; its name suggests a childcare building)
and "47 Creyke Road Meeting rooms" (its keywords say "postgraduate village common room").

## What the site could do

- **With the usable layers only:** Ilam and Dovedale, the Arts Centre, Manawa and Nelson in 3D from
  OpenStreetMap footprints, on ground from the repository's terrain route or LINZ's 1 m DEM. A
  building is the finest place, named only where OpenStreetMap names it. No floors, no rooms, no
  classes.
- **With UC's written permission (layers 2, 4, 5):** buildings named from UC's own map points (113
  building points; a point that falls in a footprint names it). Teaching rooms listed by label
  under their building point: 482 labels in the map's two teaching classes, less the 27 whose own
  type or label says office, reception, research lab, lab store or staff workshop, which stay
  unnamed with the meeting rooms (41 points). A room is located to a building, not to a floor or
  an outline. The floor is known only for the 12 rooms that a point lists under a "Level" heading
  (for example "Level 2 | Biology 275"): UC publishes a rule for course codes ("the first digit of
  the number indicates the level of the course"), not for rooms, and its room labels include
  `Jack Erskine 031`, `Special Purposes Laboratory 1702B`, `Rata E10`, `Civil B108` and
  `Otakaro 236 L2`, where "L2" names the second Ōtākaro lecture theatre (the 2022 campus map PDF
  lists "L1 – L2 Ōtākaro lecture theatres"), not a level. Search knows 164 subject codes; the
  calendar works from the key-dates page.
- **If UC also clears the timetable planner (its `robots.txt` and the copyright line):** class
  meetings by subject, and by location through the planner's Locations tab, each located to a room
  label. The exam timetable alone gives the 2026 end-of-year exams with their venue labels
  ("Jack Erskine 248 Comp Lab", "C1 Lecture Theatre").
- **Floor and room outlines:** no source found publishes them. The AV wiki's 35 "Map - …" pages
  are location pictures (one JPEG each), not floor plans.

## Layer 1: footprints and surroundings

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| The repository's areas | `scripts/lib/areas.ts`, `data/raw/osm/` | read locally, no request | Seven areas (`context.json` and six others), all in Auckland; none in Canterbury or Nelson |
| Overpass | not requested | none | AUT's recon of the same day found `overpass-api.de/robots.txt` disallows `/api/` and that Overpass refuses a headless browser (406). The pipeline's `scripts/fetch-osm.ts` is the route. The tags of UC's buildings (`name`, `ref`, `building:levels`, `height`) were not read |
| Open data | web search for a UC or Christchurch GIS layer of campus buildings | none found | Environment Canterbury runs an open-data portal; it holds no UC building data in the results seen |

Licence for OpenStreetMap: ODbL, credit in About.

## Layer 2: indoor (buildings, floors, rooms)

UC's site menu has "Campus maps", which leads to `/about-uc/our-campus-and-environment/maps`. The
map is UC's own component (`cmp-poi`) on Google Maps, with no indoor-mapping vendor (MazeMap,
MapsIndoors, Concept3D, Mappedin, ArcGIS Indoors, Pointr). Its script asks for every point in one request,
and that request was read: RECON's first route, by in-page fetch, without loading the map.

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Campus map page | `https://www.canterbury.ac.nz/about-uc/our-campus-and-environment/maps` | 200 `text/html`, 252,390 bytes | "Campus maps", a search box, and a category filter of 72 entries (14 top-level), among them "Teaching spaces and meeting rooms" (Lecture theatres, Meeting rooms, Teaching rooms), "Halls of residence" and "Early Childhood Centres". The page loads the Google Maps script with a key of UC's in its markup (not loaded here, and not copied into this document). A download link to the campus map PDF |
| The map's script | `…/etc.clientlibs/datacom-commons/components/content/poi/clientlibs.lc-57155e6e….js` | 200 `application/javascript`, 67,399 bytes | `getAllPois()` asks `/graphql/execute.json/uoc-main-site/poi-all` and draws `data.poiModelList.items`. (A second script, `poi-upload`, 554 bytes, posts edits to `/bin/uoc/poi-upload` for UC staff; not touched) |
| Campus map, own request | `https://www.canterbury.ac.nz/graphql/execute.json/uoc-main-site/poi-all` (an Adobe Experience Manager persisted query) | 200 `application/json`, 546,484 bytes | 937 points, each with `poiId`, `englishTitle`, `teReoTitle`, `subTitle`, `description` (HTML), `image`, `keywords`, `latitude`, `longitude`, `category`, `campus`. 113 in "buildings" (71 with a code-like keyword such as `ed03`, `en10`, `rh01`: UC's own building codes, whose scheme is not published), 17 "lecture-theatres", 69 "teaching-rooms" (85 points in the two), 41 "meeting-rooms", 10 "halls-of-residence", 3 "early-childhood-centres", 20 "uc-off-campus-locations" (4 of them "field-stations"). A teaching point stands for a building or a group: its description lists the rooms ("Alice Candy 105 (Class Room)", "Jack Erskine 031 (Lecture Theatre)"), sometimes under "Level 1", "Level 2" headings. A simple parse finds 482 distinct room labels in the 85 points, 292 of them with a type in brackets (104 "Class Room", 39 "Teaching Lab Wet", 38 "Studio", 36 "Workshop", 17 "Lecture Theatre", 19 research labs, 3 "Office" and others) and 12 under a "Level" heading. 27 carry a non-teaching type or label of their own (19 research labs, 3 offices, a reception, a lab store, three staff or research rooms named so). Points only: no outline, no floor field. The parse kept room labels only; descriptions also hold booking addresses and prose |
| Room directory: UC Digital Services AV wiki | `https://ucdigitalsms.atlassian.net/wiki/spaces/AV/pages/3290106912/Jack+Erskine+121` (Confluence on Atlassian, "viewing this with anonymous access") | 200 `text/html`, 1,767,233 bytes | One room page: "Capacity 35", "Room Type L-CTA Teaching", "Host Key SC21121", "Owner UOC", a telephone extension, and the author line of the page (a person; dropped). The space calls itself "a central source of information for technology in teaching spaces and meeting rooms on campus" |
| Its page list | `…/wiki/rest/api/space/AV/content/page?expand=ancestors&limit=…&start=0, 200, 400` (three requests) | 200 `application/json`: 702,301, 704,398 and 3,479 bytes | 401 pages; 290 room pages under "AV Rooms" (Jack Erskine 28, Ernest Rutherford 27, Rehua 37, Psychology - Sociology 17 and others), titles only. Their capacity and type are on each page: 290 more requests, not made |
| Its "All Spaces" report | `…/wiki/rest/api/content/3290106620?expand=body.view` | 200 `application/json`, 9,477 bytes | "Generating page properties report...": the table is drawn in the browser. Not pursued |
| Its building maps | `…/wiki/rest/api/content/3290108302?expand=body.view,children.attachment` ("Map - Jack Erskine", one of 35) | 200 `application/json`, 4,948 bytes | One JPEG (`uc_campus_map_jackerskine.jpg`, 408,203 bytes, not downloaded): "Click on the map below to open the interactive UC campus map to help find this room". A location picture, not a floor plan |
| The old maps address | `https://www.canterbury.ac.nz/theuni/maps` (printed on the campus map PDF) | 404 `text/html` | Gone |
| Open data | web search | none found | Layer 1 |
| Floor-plan PDF | `https://www.canterbury.ac.nz/content/dam/uoc-main-site/documents/pdfs/maps/UC-campus-map.pdf.coredownload.pdf` | 200 `application/pdf`, 2,016,242 bytes, 1 page, made 2022-03-10 | "UC Campus Map": a drawing with grid references for cafés, computer workrooms, halls of residence, lecture theatres ("A1 – A3 North Arts lecture theatres", "L1 – L2 Ōtākaro lecture theatres"), libraries and services. No floor plans. No floor plan of any building was found |

Without outlines the building view could show only floors inferred from the "Level" headings, each
labelled so; most rooms would have no floor.

## Layer 3: timetable

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| UC's page for it | `https://www.canterbury.ac.nz/life/it-logins-and-tools/timetable-planner` | 200 `text/html`, 228,075 bytes | "The Timetable planner tool lets you enter UC courses and preview how they'll fit into a timetable. It's an easy way to see a course schedule without being enrolled." Links to `https://timetable.canterbury.ac.nz/even/timetable/#subjects` |
| Public class search: the timetable planner | `https://timetable.canterbury.ac.nz/even/timetable/` | 200 `text/html`, 16,233 bytes: requested once, a lapse (see "Request log"); `robots.txt` disallows `/` for every agent | The app shell: "Allocate+ Timetable", tabs "Subjects", "Locations", "Groups", a "Code / Description" search, day and time filters. Nothing it would load was requested, so what it returns is unknown |
| Student timetable: My Timetable | `https://timetable.canterbury.ac.nz/even/student` (2026), `…/odd/student` (2025), linked as "2026 Timetable Log in" from `/life/it-logins-and-tools/my-timetable` (200, 231,467 bytes) | not requested: a sign-in, and `robots.txt` | "Use My Timetable to view all your classes for the semester". "The 2026 timetable was finalised on 15th October 2025" |
| Course Information System | `https://courseinfo.canterbury.ac.nz/GetCourseDetails.aspx?course=COSC121&occurrence=26S1(C)&year=2026` (the form found in a 2026 study-abroad document) | not requested: its `robots.txt` has `Disallow: /` for `ClaudeBot`, `Claude-Web` and `anthropic-ai` | Unknown to this recon. UC's key-dates page sends readers to "course pages" there for "dates and timetables" |
| The same system on the main host | `https://www.canterbury.ac.nz/courseinfo/Mygetcourses.aspx` (the "Fees estimator" link on the Courses page) | not requested | The same system under another host name; reading it there would go round the door above |
| Published file: exam timetable | `https://www.canterbury.ac.nz/content/dam/uoc-main-site/documents/pdfs/d-other/exams/EOY26_FinalExamTimetable.pdf` | 200 `application/pdf`, 388,752 bytes, 18 pages, made 2026-10-18 | "2026 End-of-Year Examination Timetable (Course Order)": Exam Code (`ACCT103-26S2 (C)`), Exam Title, Date, Start Time, Duration, notes, Venue Description ("C1 Lecture Theatre", "Jack Erskine 248 Comp Lab", "Rt 342 CAD Lab", "Otkro 236 L2 (Dovedale Campus)", "Online Respondus") and a "General room student split" by surname ranges ("A - Jef"), which a parser would drop. About 465 distinct exam codes by a simple parse. Exams only, not classes |
| Its page | `/study/study-support-info/study-related-topics/examinations/exam-dates-rooms-and-timetables` | 200 `text/html`, 223,487 bytes | Exam periods 2026; "The final exam timetable also includes the venue/room" |
| Published files: ICS | none public found | — | A 2026 student project (below) reads personal iCal links from `timetable.canterbury.ac.nz`, which belong to a signed-in student |
| Official API | web search | none found | — |
| Earlier student projects | three on GitHub, read on GitHub only | — | `CanterburyTimetableManager` (2015, C#): signed in to `mytimetable.canterbury.ac.nz/aplus/rest/student/login`, an older Allocate+ host; not tested (a sign-in). `UniversityCanterburyCourseSearch` (2025, Python): read `courseinfo.canterbury.ac.nz/GetCourses.aspx?Keyword=…&site=C` and `GetCourseDetails.aspx?course=…`. `uc-timetable-editor` (2026, Go): personal iCal feeds |

Requests a full fetch would take, if UC clears them: unknown for the planner (its data requests
were not seen); one request for each exam timetable PDF.

Precision: a planner or exam venue is a room label ("Jack Erskine 248"). It matches the map's
labels where the wording agrees, which locates a meeting to a building. The exam PDF shortens some
names: "Rt 222/223 Drawing Room" stands beside the map's "Rata 222 Drawing Office 2", and "Otkro
236 L2" beside "Otakaro 236 L2"; a parser would need a list of such short forms, read from the
source, not guessed. The floor stays unknown except where layer 2 gives a
"Level" heading.

## Layer 4: academic calendar

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Key dates | `https://www.canterbury.ac.nz/study/study-support-info/dates-and-timetables` | 200 `text/html`, 229,271 bytes | Links to "Key university dates", "Enrolment dates", "Other important dates" |
| Key university dates | `…/dates-and-timetables/key-university-dates` | 200 `text/html`, 246,154 bytes | 2026 from 21 August on (earlier dates have gone from the page) and all of 2027: lecture start and end, mid-semester breaks, study breaks, exam periods, holidays ("Labour Day (University closed)", "Canterbury Show Day (University closed)", "Matariki public holiday"), results and refund deadlines. Each with "Add to calendar". "Listed dates are subject to change" |
| Key University Dates 2026 PDF | `…/content/dam/uoc-main-site/documents/pdfs/d-other/Key%20University%20Dates%202026.pdf.coredownload.pdf` | 200 `application/pdf`, 152,142 bytes, 2 pages, made 2025-11-24 | The whole of 2026, from "UC reopens" on 5 January. Its two columns come apart in text extraction: transcribe by hand from the page |
| Key University Dates 2027 PDF | `…/Key%20University%20Dates%202027.pdf.coredownload.pdf` | 200 `application/pdf`, 255,755 bytes, 2 pages, made 2026-08-25 | The whole of 2027 |
| Exam periods | the exam page of layer 3 | 200 | "Mid-Year Examination Period: Monday 8 June to Saturday 20 June inclusive"; "End-of-Year Examination Period: Tuesday 27 October to Saturday 7 November inclusive" (2026) |

If UC agrees: two PDFs, transcribed by hand into `data/academic-calendar.json`, as for Auckland.

## Layer 5: subjects and courses

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Subject codes | `https://www.canterbury.ac.nz/study/qualifications-and-courses/course-codes/` | 302 to `/study/academic-study/courses`, then 200 `text/html`, 204,064 bytes | "Course subject codes": 164 distinct four-letter codes with their subject names ("Accounting - ACCT", "Teacher Education - TE**/AKOT/AKOA"). The code rule: "a four-letter subject code and a three-digit number, for example 'PHYS339' … the first digit of the number indicates the level of the course". Its "Search all UC courses" links to `courseinfo.canterbury.ac.nz` |
| Subject list | `https://www.canterbury.ac.nz/study/academic-study/subjects` and its "Search undergraduate subjects" link | 200 `text/html`, 182,646 bytes, the same page both times | "over 250 subject areas"; the list is drawn in the browser by a Funnelback search, whose requests were not followed |
| Course catalogue: Course Information System | `https://courseinfo.canterbury.ac.nz/` | not requested (`robots.txt`, layer 3) | Every course, by the 2025 student project's code: keyword search and one page per course |
| The course search box | `…/components/content/cis-search/clientlibs….js` | 200 `application/javascript`, 1,162 bytes | It only builds a link `?source=courses&type=course&search=1&value=…&year=…` to the system above |

Keep the facts (code, title, terms, sites), not descriptions, if UC agrees. Without the Course
Information System, search knows subject codes but not course titles.

## Layer 6: ground heights

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| AWS Terrain Tiles | not requested | — | AUT's recon of the same day got 403 for `s3.amazonaws.com/robots.txt`; VUW's found the LINZ 8 m DEM (`nzlinz/lds-tile-mk.tif`) in the tiles under Wellington. The pipeline's `scripts/fetch-terrain.ts` would show the header for Christchurch |
| LINZ elevation catalogue | `https://nz-elevation.s3.ap-southeast-2.amazonaws.com/catalog.json` | 200 `application/json`, 66,450 bytes | Canterbury DEMs include `christchurch_2024-2025`, `christchurch_2020-2021`, `canterbury_2020-2023` ("Canterbury LiDAR 1m DEM (2020-2025)"); Nelson `nelson_2025`, `nelson_2021` |
| Canterbury - Christchurch LiDAR 1m DEM (2024-2025) | `…/canterbury/christchurch_2024-2025/dem_1m/2193/collection.json` and `capture-area.geojson` | 200 `application/json` (7,376 bytes), 200 `application/geo+json` (3,190 bytes) | Licence `CC-BY-4.0`. Providers: Toitū Te Whenua Land Information New Zealand (host, processor), Aerial Surveys (producer), Environment Canterbury (licensor). Capture 2024-12-09 to 2025-01-19 (UTC). 27 items. The capture area holds the Ilam, Dovedale, Arts Centre, Manawa and Rose Centre points |
| Nelson LiDAR 1m DEM (2025) | `…/nelson/nelson_2025/dem_1m/2193/collection.json` and `capture-area.geojson` | 200 (7,065 bytes), 200 (56,778 bytes) | Same licence; producer Landpro, licensor Nelson City Council. 26 items. Holds the "UC Nelson Centre" point |
| LINZ attribution page | not requested | — | AUT's recon got 403 from `www.linz.govt.nz`; see "Needs the maintainer", 6 |

Not checked: two known heights on each campus and pits where land meets sea (RECON.md, layer 6).
The field stations lie outside both DEMs checked.

## robots.txt and terms

| Host | robots.txt (2026-10-22) | Terms |
| --- | --- | --- |
| `www.canterbury.ac.nz` | 200 `text/plain`, 207 bytes: `User-agent: *`, `Allow: /`, `Disallow: /content/dam/uoc-main-site/private`; two `AdsBot-Google` groups with `Allow: /`; a `Sitemap`. No crawl delay | <https://www.canterbury.ac.nz/about-uc/corporate-information/privacy-copyright-official-information/copyright>: "Material on the University of Canterbury (UC) webpages may not be copied, distributed, or used for commercial purposes without the prior, express written permission of UC." |
| `courseinfo.canterbury.ac.nz` | 200 `text/plain`, 2,676 bytes, "Cloudflare Managed content": `User-agent: *`, `Content-Signal: search=yes,ai-train=no,use=reference`, `Allow: /`; then `Disallow: /` for named agents, among them `ClaudeBot`, `anthropic-ai`, `Claude-Web`, `GPTBot`, `CCBot`, `Google-Extended` | as above |
| `timetable.canterbury.ac.nz` | 200 `text/plain`, 25 bytes, on one line: `User-agent: * Disallow: /` | as above; Allocate+'s own terms not read |
| `ucdigitalsms.atlassian.net` | 200 `text/plain`, 347 bytes: `User-agent: *`, `Crawl-delay: 1`, `Allow: /wiki/`, `Disallow:` for `/login`, `/logout`, `/secure/admin/` and others | UC's content: UC's copyright line. Atlassian's terms not read |
| `nz-elevation.s3.ap-southeast-2.amazonaws.com` | 404: none | CC BY 4.0 per collection |
| `s3.amazonaws.com` | not requested (AUT's recon got 403) | AWS Open Data registry |
| `overpass-api.de` | not requested (AUT's recon: `Disallow: /api/`) | ODbL for the data |

Two notes. First, `courseinfo` answers every agent but Claude's and some others: the pipeline's own
User-Agent (`scripts/lib/snapshot.ts`) falls under `*`, which allows it with "ai-train=no", while
a Claude agent falls under `ClaudeBot` or `Claude-Web`, which this recon applied to itself. Second,
`timetable`'s file is on one line. Read strictly as RFC 9309 lines, it names an agent called
"* Disallow: /" and so disallows nothing; read as written, it disallows everything for everyone.
The second reading is plainly the intended one, and this recon keeps it (see "Request log" for the
one request made before it did).

## Needs the maintainer

1. **UC's written permission.** UC's copyright line forbids copying or distributing its web
   material without "prior, express written permission". That holds back the campus map's points
   (layer 2), the key dates (layer 4) and the subject codes (layer 5), and would hold back any
   timetable. Ask UC for permission to show, non-commercially and with credit, building and room
   labels with their map points, the key dates, the subject and course codes, and class times and
   rooms. Only UC can grant it.
2. **The timetable planner.** It is public ("without being enrolled") and has a Locations tab, but
   `timetable.canterbury.ac.nz/robots.txt` disallows everything. The same message can ask whether
   the site may read the planner's subject or location timetables once a term, or whether UC would
   publish them as a file.
3. **The Course Information System.** Its `robots.txt` disallows Claude's agents and allows `*`
   with "ai-train=no". Decide whether the pipeline, under its own User-Agent, may read it once
   UC agrees to item 1; this recon did not read it.
4. **The sign-in walls.** My Timetable (`timetable.canterbury.ac.nz/even/student`) is linked as
   "Log in"; it was not requested, and is recorded here once and left alone.
5. **Overpass for Christchurch and Nelson.** Run `scripts/fetch-osm.ts` for new areas over Ilam
   with Dovedale, the Arts Centre with Manawa, and the Nelson centre, as for Auckland. Not
   requested here, for the reasons in AUT's recon.
6. **The LINZ attribution page** (`www.linz.govt.nz`) answered 403 to a headless browser in AUT's
   recon. Read it in your own browser to confirm the credit wording for the Christchurch
   (2024-2025) DEM, licensor Environment Canterbury, and the Nelson (2025) DEM, licensor Nelson
   City Council.
7. **Rooms in a home or a childcare centre.** Before naming any room of the map's teaching class,
   check "Education Childcare Teaching Rooms" (rooms 106 to 108) and "47 Creyke Road Meeting rooms"
   (a "postgraduate village common room"): the rules leave childcare centres and homes blank.
8. **A tool gap: `robots.txt` is read by each reader.** `polite.mjs` paces, gates hosts and logs,
   but does not read `robots.txt`: each research script parses it itself. This recon's parser read
   `timetable`'s one-line file as having no rules and sent one request before that was fixed. A
   `robots.txt` check inside `polite.mjs`, keeping the strictest reading, would close the gap.

## Request log

Every request went through `scripts/research/polite.mjs` as it is on branch
`loop-polite-redirects` (pull request #71, open), from one scratch reader in 20 runs: each run
started one browser with `politeLaunch()`, opened one polite page that let only documents and
fetches through, loaded the host's `robots.txt` as the page, then read each URL by an in-page
`fetch()` with `redirect: "manual"`, so no frame, script or image of a page was loaded and each
redirect hop was a request of its own, checked against `robots.txt` before it went. Each host was
paced to the larger of 1.1 s and the largest `Crawl-delay` of the groups for `*`, `HeadlessChrome`,
`ClaudeBot`, `Claude-Web` and `anthropic-ai`, counted from the last request to it in any run. The
browser's User-Agent was "… HeadlessChrome/156.0.0.0 …". Web searches, and reading three student
projects through the GitHub API, did not touch the school's hosts and are not in the log. UTC
2026-10-21 21:40:44 to 21:53:06 (2026-10-22 10:40 to 10:53 in New Zealand).

- **Sent:** 60, all GET. `www.canterbury.ac.nz` 38 (10 of them its `robots.txt`, once a run),
  `ucdigitalsms.atlassian.net` 12 (6 `robots.txt`), `nz-elevation.s3.ap-southeast-2.amazonaws.com`
  7 (2 `robots.txt`), `timetable.canterbury.ac.nz` 2, `courseinfo.canterbury.ac.nz` 1 (its
  `robots.txt` only). Answers: 54 × 200, three 302 (two of them the same field-stations address,
  once more to see where it led), three 404 (the old maps address and the elevation bucket's
  missing `robots.txt` twice). No form was submitted, nothing was signed in to, no POST went out.
- **Blocked before leaving the machine:** 20, all the browser's own icon request (`favicon.ico`),
  one a run. No page's own scripts, styles or frames were asked for, because no page was loaded
  as a page; no other host was asked for. No cookie banner was loaded, so none had to be refused.
- **Rate:** the shortest gap between two requests was 1.121 s, and no second held more than one.
  Per host: `www.canterbury.ac.nz` 1.121 s, `ucdigitalsms.atlassian.net` 1.206 s (its
  `Crawl-delay: 1` kept), the elevation bucket 1.171 s, `timetable.canterbury.ac.nz` 7.295 s.
- **Order:** each host's `robots.txt` was read before anything else was sent to it.
- **Disallowed path:** 1 request, a lapse. `https://timetable.canterbury.ac.nz/even/timetable/`
  went 7.3 s after that host's `robots.txt` (`User-agent: * Disallow: /`, on one line), because
  the reader split the file into lines only at line ends and so found no rule. The answer (the
  planner's app shell, 16,233 bytes) is described in layer 3 and nothing it would have loaded was
  requested. The parser was fixed straight after, and no later request went to that host.
- **Crawl delays:** none broken. Only `ucdigitalsms.atlassian.net` names one (1 s).
- **Paths kept off:** `courseinfo.canterbury.ac.nz` beyond its `robots.txt` (two URLs refused by
  the reader before sending), `www.canterbury.ac.nz/courseinfo/`, `/content/dam/uoc-main-site/private`
  (never asked for).
- **401, 403 and sign-in walls:** none answered. My Timetable's "Log in" was not requested.

The raw answers stayed outside the repository and are not committed. UC's terms forbid copying its
material without permission, so every saved answer (the pages, the campus map's points, the AV
wiki's page lists, the PDFs) was deleted from the scratch folder once the counts above had been
taken and checked. Only the request log (URL, time, status) is kept there.
