# The University of Waikato (Waikato): public campus data

Recon for a possible port, done on 2026-10-25 (New Zealand time) by the method in
[RECON.md](../../.claude/skills/campus-world-model/RECON.md). It records what Waikato publishes
without a sign-in, and on what terms. No fetch script and no data file came with it. Since #PR the
Hamilton campus is on the site in the Buildings form, from OpenStreetMap, with the University's
buildings chosen by the University's own campus map, which the maintainer gave the project ("On the
site", below). The rest of this report is the recon as it was done.

Path name if the school is added: `/waikato/` ("Decisions" in `PROGRESS.md`: each school's own
short name; Waikato's web domain is `waikato.ac.nz`). Time zone: Pacific/Auckland.

## On the site (2026-10-28)

On the maintainer's word of 2026-10-27, the loop fetched one Overpass area for each campus that this
report gives an address for (Hamilton and Tauranga) through `scripts/fetch-osm.ts`, and the terrain
tiles under them through `scripts/fetch-terrain.ts`. Not part of this step: Hangzhou, a partner's
campus abroad, outside LINZ's ground. **No request went to any Waikato host**, then or since:
`www.waikato.ac.nz`'s `robots.txt` closes it to this project's agents. The school's name is this
report's, "The University of Waikato"; the report gives no name in te reo Māori, so the root page
gives none.

**How each box was set.** This report gives addresses and no map points, so each box was drawn from
the address before the fetch, without asking any host, and checked against the snapshot's own
streets after it.

- **Hamilton** (`central`): "Gate 1, Knighton Road", in Hillcrest. The box was drawn round the
  campus east of Knighton Road, about 1.2 km on every side of where the campus was expected:
  `[-37.799, 175.304, -37.777, 175.331]`, 2.4 km east to west and 2.4 km north to south. Knighton
  Road, Hillcrest Road, Silverdale Road and Ruakura Road run through the snapshot.
  `osm/context-waikato-hamilton.json`: 5,104,056 bytes, 6,534 elements (4,514 building ways and 12
  relations); **2 requests**: `overpass-api.de` answered 502, and `overpass.kumi.systems` answered,
  with an OpenStreetMap base of 2026-06-01 08:52 UTC. The 53 buildings taken lie 528 m (north) to
  970 m (south) inside the box's edges, and span 675 m east to west and 948 m north to south; the
  origin, the sun and the weather are at their middle (-37.786, 175.3173).
- **Tauranga**: "101-121 Durham Street", in the city centre. A box of 1.8 km north to south and 1.6 km east to
  west, `[-37.6935, 176.1565, -37.6775, 176.1745]`; **4 requests**. It held three `building=university`
  ways by Durham Street with no name and no operator, and no building that OpenStreetMap ties to
  Waikato. So Tauranga is not on the site (Real or absent): its area was taken out again, and its
  snapshot and its record were deleted before any commit.

**The ground.** Nine AWS terrain tiles at zoom 14 under the Hamilton box, **9 requests**. Each
tile's `x-amz-meta-x-imagery-sources` header names one source only, LINZ's model
(`nzlinz/lds-tile-gl`), so the site's terrain line, the LINZ 8 m elevation model, holds for them.

**Which buildings are Waikato's.** OpenStreetMap ties only one building in the Hamilton box to the
University by its tags: the Gallagher Academy of Performing Arts (`operator=University of
Waikato`). The other operator-tagged ones are a bicycle shed with no name and the Orchard Park
Apartments, a home; the one `building=university` way is the medical school's building site, which
its name calls a construction site. J Block, the Student Centre, TT Block and the campus's other
buildings carry names, or nothing, and no tag that says whose they are. So on 2026-10-28 the
maintainer downloaded the University's Hamilton campus map in their own browser ("Hamilton Campus
Map Update", one A3 page, version Q1 2025; the address in layer 2 below) and gave it to the loop,
to decide which of OpenStreetMap's buildings are the University's and to call those OpenStreetMap
leaves unnamed by the map's block codes. No agent of this project fetched it; it is not in the
repository, and nothing of it is but block codes and names. The maintainer asked Waikato by email,
the same day, whether the project may read its pages.

The descriptor (`src/schools/waikato/school.ts`, `CAMPUS_MAP`) holds the result: one row for each
OpenStreetMap element, with the map's block code and how it was matched, and a comment for every
judgement. The map is a drawing, turned about 30 degrees from north and not to an even scale. Its
labelled buildings were tied to OpenStreetMap's named ones, every outline was laid over the drawing
by a local fit to those points, and each was checked by its shape against the building drawn there.

- **Taken: 53.** 32 by name, where OpenStreetMap's name is the map's name or code for the block (the
  lettered blocks C to S, TT, TC, TL, UL1, UL2, ULS, SUB, ITS, LSL, the Gallagher Academy (PA), the
  Student Centre (M), the management school (MSB), Law (N), the pavilion (PAV) and more). 21 by
  place, where the outline stands where the map draws the block: 4 keep OpenStreetMap's own name
  (Facilities Management Division at FM, Hiko hub at TSR, The Cowshed at Nº5D, Pathways College at
  LAIN), and the 17 that OpenStreetMap leaves unnamed are called by the block code (TRU, EAS, CHSS,
  TG, TW, CRC, MS8, FC1, FC2, MAR, Shop, and the second outlines of LSL and LAIN). The building
  card says where such a name comes from. Heights: 1 from `building:levels` (FG Link), 52
  estimated.
- **Left out, with their reasons in the data: 27.** 25 that the map draws on the campus: small
  buildings it gives no code of its own and OpenStreetMap no name (link buildings between the
  lettered blocks, a shed, the cricket nets), three small buildings under one code CONF, seven
  small buildings among which it writes LITB and BL, and two buildings beside SUB and FC1 whose
  code or name cannot be tied to one outline. And 2 tag candidates: the bicycle shed (no name) and
  the medical school's building site.
- **Not the University's,** by the map's own names, and so not candidates: NIWA's two buildings,
  Te Kūwaha o te Waiora - Health NZ (which OpenStreetMap names NIWA), Landcare Research, St John's
  College, a kura kaupapa Māori and a kōhanga reo by Gate 10, and the houses the map marks as
  private property.
- **Homes and childcare** stay unnamed among the surroundings, and nothing about them is published:
  the halls of residence (Bryant Hall, College Hall, Orchard Park, the Student Village, the
  Scotland Place flats), the University's rental houses, the créche, and, since whether people live
  in them cannot be told, the four small buildings the map marks TTH and the numbered houses by
  Gates 4a to 4c.
- **Not drawn:** the blocks the map draws that OpenStreetMap does not have, among them TA, ELT and
  the MS blocks but MS8.

The map is Hamilton's alone, so it says nothing about Tauranga.

## Verdicts

| Layer | Verdict | What decided it |
| --- | --- | --- |
| 1. Footprints and surroundings | needs the maintainer: not checked here | No Overpass request was made (the brief for this recon forbids it). RECON.md calls OpenStreetMap usable everywhere under ODbL. The repository's seven areas are all for the University of Auckland, so the Hamilton and Tauranga campuses each need a new area, fetched by `scripts/fetch-osm.ts` ("Needs the maintainer", 5) |
| 2. Indoor: buildings, floors, rooms | needs the maintainer | The campus maps page (with an interactive map, by web search only: not confirmed) and the campus map PDFs are on `www.waikato.ac.nz`, which `robots.txt` closes to this reader (`User-agent: anthropic-ai`, `Disallow: /`). None was requested. Open and read: the online timetable gives a room code for each class, such as `L.G.01` or `TC.4.14`: 17 codes under 9 building prefixes in the one paper read. A code names a building prefix, a floor and a room. No source read gives a room outline or a room position |
| 3. Timetable | needs the maintainer | The online timetable (`timetable.waikato.ac.nz`) is public. Its data API answered two anonymous requests that the app made itself: one paper search (8 offerings) and one paper's activities (23, with day, times, dates, teaching weeks and room codes). Then the research browser closed the timetable host after a dropped request (a font file), and this recon asked nothing more of it or of its API. The terms are on the closed host and were not read. The number of requests for a full build was not counted |
| 4. Academic calendar | needs the maintainer | Every route found is on `www.waikato.ac.nz` (key dates, teaching and assessment periods, principal dates), closed to this reader by `robots.txt`. None was read. The two timetable answers give some 2026 dates (each offering's start and end, one exam day), but not the calendar |
| 5. Subjects and courses | needs the maintainer | "Find a paper" and the Calendar's schedule of papers are on `www.waikato.ac.nz` (closed). The "Catalogue of Papers" host, `papers.waikato.ac.nz`, sends its `robots.txt` to `www.waikato.ac.nz` with a 301, so the research browser left that host alone. The timetable API's paper search answered once by paper code; its subject list was not requested |
| 6. Ground heights | needs the maintainer: not checked here | No layer-6 route was run. By web search only, not confirmed: LINZ lists "Waikato - Hamilton LiDAR 1m DSM (2019)" and "Bay of Plenty LiDAR 1m DEM (2019-2022)" (Tauranga is in its area). The AWS Terrain Tiles were not tried ("Needs the maintainer", 6) |

One door decides most of this. Waikato's main host, `www.waikato.ac.nz`, holds its campus maps,
key dates, paper pages and copyright page. Its `robots.txt`, dated 2026-10-21 in its first lines,
has a group `User-agent: anthropic-ai` with `Disallow: /`. The research browser reads a group whose
token is one of Anthropic's agents as its own, and it blocked every path on the host. This recon
sent one request to that host, its `robots.txt`, and nothing else. The online timetable is on
another host and answered openly, but it closed on a dropped request part way through. So no layer
is usable now. A port of Waikato needs Waikato's answer first ("Needs the maintainer", 1).

## Campuses

No page that lists Waikato's campuses was read: they are on the closed host. What the timetable's
answers show is marked "read"; the rest is by web search only, not confirmed.

| Place | Address (source) | Map or rooms seen | OpenStreetMap in the repo | LiDAR 1 m DEM |
| --- | --- | --- | --- | --- |
| Hamilton campus (location code `HAM`, read) | By web search only, not confirmed: "Gate 1, Knighton Road, Hamilton" (a search result on the University's contact page); in the suburb of Hillcrest (another search result) | Read: 17 room codes under 9 building prefixes (`I`, `L`, `MSB`, `R`, `S`, `SUB`, `TA`, `TC`, `TL`) in one paper's activities. The timetable links each prefix to the campus maps page (`https://www.waikato.ac.nz/about/campus/campus-maps/?MSB`, not requested) | none: a new area | By web search only, not confirmed: "Waikato - Hamilton LiDAR 1m DSM (2019)" (a surface model); a DEM of the same survey was not seen |
| Tauranga campus | By web search only, not confirmed: "101-121 Durham Street", in the city centre; a building map shows facilities on five floors | No Tauranga offering was in the two answers read, so no Tauranga room code was seen | none: a new area | By web search only, not confirmed: "Bay of Plenty LiDAR 1m DEM (2019-2022)", which names Tauranga |
| Hangzhou, China (location code `ZUC`, read) | By web search only, not confirmed: a joint institute at Hangzhou City University, "previously known as Zhejiang University City College (ZUCC)" | Read: two offerings of one paper with `(ZUC)`. No rooms | outside New Zealand | outside LINZ's coverage |
| Online (location code `NET`, read) | The timetable app's help text: "papers with a location code of (NET) are offered online and tend not to have timetabled activities" (markup removed) | not a place | — | — |
| Other location codes, read | `HWC`, `SEC` and `HNU`, one offering each in the paper search. The app's code also holds `(hmn)` and `(blk)`. No page read says what they mean | — | — | — |

By web search only, not confirmed: the University's "Our campuses" page says "We have three unique
campuses at the University of Waikato" (Hamilton, Tauranga and the Hangzhou partner).

Places to leave blank. The pages that would list Waikato's halls of residence and childcare are on
the closed host, so this recon did not check them. A build must find them in the source and leave
them blank. This document names none of them.

## What the site could do

- **With the usable layers only:** nothing from Waikato, because no layer is usable now. After the
  maintainer's Overpass run for two new areas (layer 1), the site could show the Hamilton and
  Tauranga campuses from OpenStreetMap, each building named only where OpenStreetMap names it. A
  building would be the finest place. No rooms, no classes, no calendar.
- **If Waikato agrees to the use of its timetable (layer 3):** each class meeting has a paper
  offering code and title, an activity type and stream (for example `LAB 01 *A`), a weekday, start
  and end times, a date range, a 52-character string of teaching weeks, and one or more room codes.
  A room code such as `TC.4.14` names a building prefix, a floor (`G` or a number) and a room. A
  class could then be put on a floor of a building, once each prefix is matched by hand to an
  OpenStreetMap footprint. The floor would come from the code and be labelled so. No room outline
  is known, so the room itself would be text, not a shape. The campus map that could place each
  prefix is on the closed host.
- **Tauranga:** no room code was seen. The campus is one building of five floors, by web search
  only: not confirmed.
- **Floor and room outlines:** no source read publishes them. Whether the interactive campus map
  holds them is not known: its page was not requested.

## Layer 1: footprints and surroundings

| Route | URL | Answer (2026-10-25) | What it holds |
| --- | --- | --- | --- |
| The repository's areas | `scripts/lib/areas.ts` | read locally, no request | Seven areas, all for the University of Auckland. `central` is `[-36.8689, 174.7608, -36.8441, 174.7797]` (south, west, north, east). None covers Hamilton or Tauranga |
| Overpass | not requested | — | The brief forbids Overpass here. `scripts/fetch-osm.ts` is the route. The tags of Waikato's buildings (`name`, `ref`, `building:levels`, `height`) were not read |
| Open data | web search for a Waikato campus map on MazeMap or Concept3D | none found | — |

Licence for OpenStreetMap: ODbL, credit in About.

## Layer 2: indoor (buildings, floors, rooms)

| Route | URL | Answer (2026-10-25) | What it holds |
| --- | --- | --- | --- |
| Campus maps page and its interactive map | `https://www.waikato.ac.nz/about/campus/campus-maps/` | not requested: `robots.txt`, `User-agent: anthropic-ai`, `Disallow: /` | Not seen. By web search only, not confirmed: an interactive map with map layers; rooms "referenced by building letter or code, floor number and then the room number" (the search result's words, with the example "S.1.17") |
| Hamilton campus map PDF | `https://www.waikato.ac.nz/assets/Uploads/About-us/Our-campuses/Campus-maps/Hamilton-campus-map.pdf` (web search) | not requested: the same rule | Not seen. By web search only, not confirmed: it lists building codes |
| Tauranga locations | `https://waikato.ac.nz/about/campus/campus-maps/tauranga-locations` (web search) | not requested: the bare `waikato.ac.nz` host was not asked | Not seen |
| Copies on other hosts | a Hamilton map PDF on `calendartest.waikato.ac.nz` and a Tauranga map PDF on `research.waikato.ac.nz` (web search) | not requested | By their web-search addresses, they are files under `/assets/Uploads/`, the closed host's upload path. Reading them from another host would go round that host's `robots.txt` |
| Room directory: the online timetable | `https://timetable.waikato.ac.nz/COMPX101-26A%20(HAM)`, whose app asked `POST …/api/events` (layer 3) | 200 `application/json; charset=utf-8`, 11,104 bytes | 23 activities, each with `TeachingActivityRooms`, a list of `RoomCode`. 17 distinct codes, for example `L.G.01`, `MSB.1.21`, `R.G.10`, `SUB.1.12C`, `TC.4.14`. One exam activity has no room. Codes only: no building names, no outlines, no positions |
| Room to map link | the page above | read | Each room code's prefix links to `https://www.waikato.ac.nz/about/campus/campus-maps/?<prefix>` (for example `?MSB`, `?TC`). The app's code takes the prefix with the pattern `^(\w+)\..*$` |
| Floor-plan PDF | the Tauranga map PDF above | not requested | By web search only, not confirmed: ground floor and levels 1 to 4, with room labels such as "2.03" |

Without a readable source of rooms, the building view could show only OpenStreetMap's buildings.
A floor taken from a room code would be labelled as such.

## Layer 3: timetable

| Route | URL | Answer (2026-10-25) | What it holds |
| --- | --- | --- | --- |
| Online timetable: home | `https://timetable.waikato.ac.nz/` | 200 `text/html`, 3,222 bytes, `Last-Modified` 2025-11-06 | A Blazor WebAssembly app's shell. "The Online Timetable allows you to browse the extensive range of papers offered at Waikato." Its footer links "Copyright and legal statement" to `https://www.waikato.ac.nz/copyright-and-disclaimer/` |
| The app's boot list | `https://timetable.waikato.ac.nz/_framework/blazor.boot.json` | 200 `application/json`, 8,830 bytes | 87 files (81 assemblies, 3 ICU data files, 3 runtime files); main assembly `Client` |
| The app's settings | `https://timetable.waikato.ac.nz/appsettings.json` | 200 `application/json`, 147 bytes | An OpenID Connect sign-in authority on `api.svc.waikato.ac.nz` (not requested) |
| The app's code | `https://timetable.waikato.ac.nz/_framework/Client.wasm` | 200 `application/wasm`, 279,317 bytes | The data API's address, `https://uow-func-net-stdntenrol-timetblmngmt-aue-<dev, uat or prod>.azurewebsites.net/api/`. Path names `papers`, `events`, `subjects`, `academicPeriods`, and `personal/all`, `personal/exams`, `personal/summary` (for MyTimetable, by their names). A staff view (`/staff-search`) and MyTimetable sit behind the sign-in; the app's message for that is "You need to log in before using this resource!". Help text: "Rooms and times of activities can change without notice." |
| Paper search | `https://timetable.waikato.ac.nz/COMPX101&year=2026` (the form of a web-search result) | 404 `text/html` (the app's shell, which the app then renders) | The app asked `POST https://uow-func-net-stdntenrol-timetblmngmt-aue-prod.azurewebsites.net/api/papers` (after a CORS `OPTIONS`, 200): 200 `application/json; charset=utf-8`, 1,524 bytes. `Items`: 8 offerings, each `PaperOccurrenceCode` (for example `COMPX101-26A (HAM)`), `PaperOccurrenceName`, `AcademicYear`, `StartDate`, `EndDate`; `NextPageLink` and `Count` null |
| One paper's activities | `https://timetable.waikato.ac.nz/COMPX101-26A%20(HAM)` | 404 `text/html` (the shell) | The app asked `POST …/api/events` with the body `{"paperCode": "COMPX101-26A (HAM)"}` (after a CORS `OPTIONS`, 200): 200 `application/json; charset=utf-8`, 11,104 bytes. One item: `AcademicYear`, `LocationCode` (`HAM`), `PaperOccurrenceName`, and 23 `TeachingActivities` (12 `TUT`, 6 `LAB`, 3 `LEC`, 2 `EXAM`). Each has `TeachingActivityTypeCode`, `TeachingActivityType.Name`, `TeachingActivityCode` (for example `COMPX101-26A (HAM) LAB 01 *A`), `PaperOccurrenceCode`, `Days`, `StartTime`, `EndTime`, `StartDate`, `EndDate`, `WeekInYear` (52 characters of 0 and 1, or null for an exam), `AcademicPeriod`, `TeachingActivityRooms`, and `ActivityStaff` with `StaffName` (names on 3 of 23: drop them at parse time). The page says: "Teaching hours are usually between 8am and 6pm." |
| Subject list | `GET …/api/subjects` | not sent: the reader moved to the next page while the request waited its turn | — |
| A second paper | `https://timetable.waikato.ac.nz/COMPX101-26B%20(HWC)` | blocked before sending: the host was closed (next row) | — |
| Host closed | `https://timetable.waikato.ac.nz/_content/Radzen.Blazor/fonts/MaterialSymbolsOutlined.woff2` | sent; ended with the network error "Failed", no status | `polite.mjs` closed the host as a dropped connection. This recon did not ask the timetable host or its API again |
| Student timetable: MyTimetable and MyWaikato | the app's `/my-timetable` and `https://my.waikato.ac.nz` | not requested: sign-ins | A student's own classes and exams ("MyTimetable shows you all scheduled activities for the paper(s) you have added to your enrolment in MyWaikato") |
| Moodle | `https://elearn.waikato.ac.nz/` | not requested: sign-in | Tutorial and lab sign-up, by the app's help text |
| Paper outlines | `paperoutlines.waikato.ac.nz` (web search) | not requested | By web search only, not confirmed: the outline's timetable section is taken from the timetable, and the outlines a user is linked to are behind a sign-in |
| Published files: ICS, CSV | none found | — | — |
| Official API documentation | web search | none found | — |
| Earlier student projects | three GitHub repository searches through the GitHub API ("waikato timetable": 1 result; "waikato paper planner": 0; "timetable.waikato.ac.nz": 0) | — | The one result schedules lab demonstrators; by its description it does not read the online timetable |

Precision, if Waikato agrees: a room code, which names a building prefix and a floor. A full build
would ask `events` once for each paper offering. How many offerings there are, and whether the
`subjects` and `papers` paths list them in fewer requests, was not found out before the host closed.

## Layer 4: academic calendar

| Route | URL | Answer (2026-10-25) | What it holds |
| --- | --- | --- | --- |
| Key university dates | `https://www.waikato.ac.nz/study/key-university-dates/` (web search) | not requested: `robots.txt` | Not seen. By web search only, not confirmed: in 2026, Trimester A from 2 March, last teaching day 5 June, exams 15 to 26 June; Trimester B from 13 July, last teaching day 16 October, exams 27 October to 6 November |
| Teaching and assessment periods | `https://www.waikato.ac.nz/about/calendar/important-dates/teaching-and-assessment-periods/` (linked from the timetable app) | not requested: `robots.txt` | Not seen |
| Principal dates | `https://www.waikato.ac.nz/about/calendar/important-dates/principal-dates` (web search) | not requested: `robots.txt` | Not seen |
| Teaching dates on the intranet | a SharePoint page, linked from the timetable app ("Academic Teaching Weeks can be reviewed here", markup removed) | not requested: an intranet | — |
| The timetable's own dates | the two API answers in layer 3 | read | Offering dates: `COMPX101-26A (HAM)` from 2026-03-02 to 2026-06-28, `COMPX101-26B (HAM)` from 2026-07-13 to 2026-11-08; one exam on 2026-06-22; teaching weeks in `WeekInYear`. These agree with the web-search dates above but are not a calendar |

Transcribe the key-dates page by hand into `data/<id>/academic-calendar.json` only after Waikato agrees
("Needs the maintainer", 1).

## Layer 5: subjects and courses

| Route | URL | Answer (2026-10-25) | What it holds |
| --- | --- | --- | --- |
| Find a paper | `https://www.waikato.ac.nz/study/papers/` (linked from the timetable app) | not requested: `robots.txt` | Not seen. The `*` group of the same file also disallows each paper page of earlier years (`Disallow: /study/papers/*/2025` and so on) |
| Schedule of papers in the Calendar | `https://www.waikato.ac.nz/about/calendar/schedule-of-papers/` (web search) | not requested: `robots.txt` | Not seen |
| Catalogue of Papers | `https://papers.waikato.ac.nz/` (linked from the timetable app) | its `robots.txt` answered 301 to `www.waikato.ac.nz`; `polite.mjs` did not follow it (that host was not allowed in the run), called the robots.txt unreachable and left the host alone | Not seen |
| Sitemap | `https://www.waikato.ac.nz/sitemap.xml` (named in `robots.txt`) | not requested: `robots.txt` | Not seen |
| The timetable's paper search | `POST …/api/papers` (layer 3) | 200, 1,524 bytes | Offering code, title, year and dates for one paper code. The app checks a code with the pattern `^\w{4,5}\d{3}-\d{2}\w{1,2} \(\w{3}\)$`: subject, number, year, period, location. Its `subjects` path was not requested |

## Layer 6: ground heights

| Route | URL | Answer (2026-10-25) | What it holds |
| --- | --- | --- | --- |
| AWS Terrain Tiles (the repository's own route) | not requested | — | This recon asked only Waikato's hosts and its timetable API, besides three searches of GitHub's API (see layer 3). `scripts/fetch-terrain.ts` over each campus would show the tiles' source header |
| LINZ elevation catalogue | not requested | — | By web search only, not confirmed: "Waikato - Hamilton LiDAR 1m DSM (2019)" (a surface model, captured in 2019) and "Bay of Plenty LiDAR 1m DEM (2019-2022)" (captured from 27 October 2019 to 24 October 2022; Tauranga in its area) |

Not checked: a Hamilton DEM; whether these capture areas hold both campuses; their licences; two
known heights on each campus; pits where land meets sea (RECON.md, layer 6). A 1 m DEM needs a new
dependency for LERC-compressed GeoTIFFs, a gate (`PROGRESS.md`, "Ideas still open", 2).

## robots.txt and terms

| Host | robots.txt (2026-10-25) | Terms |
| --- | --- | --- |
| `www.waikato.ac.nz` | 200, 7,149 bytes, 342 lines, read by `polite.mjs` (which does not record the content type). It begins "# robots.txt for waikato.ac.nz", "# 2026-10-21", "# If you want to make contact", "# - email webmaster@waikato.ac.nz", "# User-agents that do not follow robots.txt may be blocked", and "# Per RFC 9309, crawlers apply only rules from a matching User-agent group;". 66 groups by the count made when it was read; 65 are described here (the saved file was deleted with the other answers, so the 66th cannot be named). `User-agent: *`: `Crawl-delay: 10` ("# 10s crawl delay = 8,640 crawls/day") and 47 `Disallow:` lines, among them `/search/`, `/dates/`, `/staff/`, `/__data/assets`, and paper pages of earlier years. Under "# disallowed agents", 61 groups have only `Disallow: /`, one of them `User-agent: anthropic-ai`. Three more groups allow a few paths and disallow the rest. `Sitemap: https://www.waikato.ac.nz/sitemap.xml` | `https://www.waikato.ac.nz/copyright-and-disclaimer/` (linked from the timetable's footer): not requested, `robots.txt`. By web search only, not confirmed: a search result gives its sentence "Copyright in all material residing on servers using the domain name waikato.ac.nz ("University of Waikato servers") is owned by the University of Waikato." The search result also says, in its own words, that printing or redistributing the material needs written permission |
| `timetable.waikato.ac.nz` | 404: every path allowed | No terms page on the host; its footer links the copyright page above |
| `uow-func-net-stdntenrol-timetblmngmt-aue-prod.azurewebsites.net` (the timetable's data API, on Microsoft Azure) | 404: every path allowed | None found |
| `papers.waikato.ac.nz` | 301 to `www.waikato.ac.nz`, not followed: host left alone | — |
| `my.waikato.ac.nz`, `elearn.waikato.ac.nz`, `api.svc.waikato.ac.nz` | not requested: sign-ins | — |
| `calendartest.waikato.ac.nz`, `research.waikato.ac.nz`, `waikato.ac.nz`, `paperoutlines.waikato.ac.nz` | not requested | — |
| `overpass-api.de`, `s3.amazonaws.com`, `nz-elevation.s3.ap-southeast-2.amazonaws.com` | not requested | ODbL for OpenStreetMap; LINZ licences not checked |

The copyright page could not be read before any content, as the brief asks, because it is on the
closed host. By the web-search result, its claim covers "servers using the domain name
waikato.ac.nz". The timetable's data comes from an Azure host outside that domain, through an app
on `timetable.waikato.ac.nz`. Whether the claim covers it is for Waikato to say. With the terms
unread and, by web search, restrictive, this recon kept no raw data: counts and conclusions only
(see "Request log").

## Needs the maintainer

1. **Ask Waikato whether the project may use its pages and data.** Waikato's `robots.txt`, dated
   2026-10-21, closes `www.waikato.ac.nz` to `anthropic-ai` and names `webmaster@waikato.ac.nz` for
   contact. That host holds the campus maps, the map PDFs, the key dates, the paper pages and the
   copyright page. The same message can ask about the online timetable (layer 3) and the campus
   map's data (buildings and rooms, with outlines or points), with credit and not for profit. A
   port of Waikato waits on that answer. Only Waikato can give it.
2. **Terms not read.** The copyright and disclaimer page is on the closed host. By web search only,
   not confirmed, it asks for written permission to redistribute. No layer of Waikato's own data can be called
   usable before it is read.
3. **The online timetable closed on a dropped request.** At 22:13:48 UTC on 2026-10-24
   (11:13 on 2026-10-25 in New Zealand) a font file of the timetable app ended with the network
   error "Failed". `polite.mjs` closed the host, and this recon asked nothing more of it or of its
   data API. Whether that was the server or the browser is not known. It is recorded here once and
   left alone.
4. **Sign-in walls, recorded once and left alone:** MyWaikato (`my.waikato.ac.nz`), Moodle
   (`elearn.waikato.ac.nz`), the timetable's MyTimetable and staff view (sign-in authority on
   `api.svc.waikato.ac.nz`), and, by web search only, the Paper Outlines site. None was requested.
5. **Overpass for two new areas.** Run `scripts/fetch-osm.ts` for the Hamilton campus (Hillcrest)
   and the Tauranga campus (Durham Street; both places by web search only, not confirmed). Not requested here, by the brief.
6. **Ground heights.** Run `scripts/fetch-terrain.ts` over both campuses and read the tiles' source
   header. Find a Hamilton 1 m DEM, and read the capture areas and licences of the Hamilton (2019)
   and Bay of Plenty (2019-2022) surveys.
7. **Places to leave blank.** Before any room is named, list Waikato's halls of residence and
   childcare from the source, so the build leaves them blank. Not checked here: the pages are on the
   closed host.
8. **Hosts not asked.** `calendartest.waikato.ac.nz` and `research.waikato.ac.nz` serve, by web
   search, files under `/assets/Uploads/`, the closed host's upload path. They were not asked,
   because reading them would go round the closed host's `robots.txt`.

## Request log

Every request went through `scripts/research/polite.mjs` as it is on `main` (commit b6e5172, pull
request #86), from one scratch reader (Massey's reader, rewritten for the new `polite.mjs`) in 7
runs. Each run started one browser with `politeLaunch()` and opened one polite page. `polite.mjs`
asked each origin's `robots.txt` itself before anything else, and blocked each path it disallows,
frames included. Five runs read single URLs: the page let only documents and fetches through,
loaded the host's `robots.txt` as its document (on `www` and `papers` the gate blocked that load),
and read each URL by an in-page `fetch()` with `redirect: "manual"`. Two runs loaded the timetable
app as a page, to see its own requests: all resource types, with only the timetable host and its
data API allowed. Web searches and three GitHub searches through the GitHub API did not send a
request to Waikato's hosts, and are not in the log. UTC 2026-10-24 22:05:30 to 22:16:36
(2026-10-25 11:05 to 11:16 in New Zealand).

- **Sent:** 245. `timetable.waikato.ac.nz` 237, the data API host 6, `www.waikato.ac.nz` 1 (its
  `robots.txt`), `papers.waikato.ac.nz` 1 (its `robots.txt`). By method: 241 GET, 2 OPTIONS (CORS
  preflights by the browser), 2 POST (made by the app itself when it opened a paper's address). By
  type: 180 fetches (171 of them files of the app's runtime under `_framework/`, 4 to the data
  API), 24 scripts, 16 images, 9 stylesheets, 9 `robots.txt` asked by `polite.mjs`, 6 documents
  (3 of them the reader's own load of `/robots.txt`), 1 font. Answers: 225 × 200, 12 × 404 (seven
  `robots.txt` asked by `polite.mjs`, the three reader loads of `/robots.txt`, and two app
  addresses that the server answers with the app's shell), 6 × 304, 1 × 301, 1 failed (the font).
  No form was filled, nothing was signed in to.
- **Blocked before leaving the machine:** 50. 27 resources of a type the run did not allow (the
  timetable shell's styles, scripts and images in the single-URL runs), 7 browser icon requests, 6
  to `www.googletagmanager.com` and 3 to `fonts.googleapis.com` (hosts not allowed), 2 to the
  timetable host after it closed, 1 to `www.waikato.ac.nz` by `robots.txt` (`Disallow: /`, group
  `anthropic-ai`), 1 to `www.waikato.ac.nz` as a redirect hop from `papers.waikato.ac.nz` (host not
  allowed), 1 to `papers.waikato.ac.nz` (its `robots.txt` unreachable), and 2 left waiting when the
  page moved on (the app's `GET /api/subjects` and one image). No cookie banner was seen, so none
  had to be refused.
- **Rate:** the shortest gap between two requests was 1.100 s, and no second held more than one.
  Per host: `timetable.waikato.ac.nz` 1.100 s, the data API 1.103 s. `www.waikato.ac.nz` asks for
  `Crawl-delay: 10`; it got one request.
- **Order:** each host's `robots.txt` was asked for before anything else was sent to it.
- **Disallowed path:** none sent.
- **401, 403 and sign-in walls:** none answered. One dropped request (the font) closed the timetable
  host. The sign-ins in "Needs the maintainer", 4, were not requested.

The raw answers stayed outside the repository and are not committed. The terms are unread and, by
web search, restrictive, and the activities carry staff names, so every saved answer was deleted
from the scratch folder once the counts above had been taken and checked. Only the request logs
(URL, time, status, type) are kept there.
