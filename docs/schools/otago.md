# University of Otago | Ōtākou Whakaihu Waka (Otago): public campus data

Recon for a possible port, done on 2026-10-22 (New Zealand time) by the method in
[RECON.md](../../.claude/skills/campus-world-model/RECON.md). It records what Otago publishes
without a sign-in, and on what terms. No fetch script and no data file came with it. Since #PR the
Dunedin and Christchurch campuses are on the site in the Buildings form, from OpenStreetMap ("On
the site", below); Wellington and Invercargill are not. The rest of this report is the recon as it
was done.

Path name if the school is added: `/otago/` ("Decisions" in `PROGRESS.md`: each school's own short
name; Otago's web domain is `otago.ac.nz`). Time zone: Pacific/Auckland.

## On the site (2026-10-27)

On the maintainer's word of 2026-10-27, the loop fetched one Overpass area for each campus that this
report gives an address for (Dunedin, Christchurch, Wellington and Invercargill) through
`scripts/fetch-osm.ts`, and the terrain tiles under the two kept through `scripts/fetch-terrain.ts`.
No request went to any Otago host: `www.otago.ac.nz` answered 403 to this report's first request,
so it is closed for this project ("Closed is a verdict"). For the same reason no brand-colour check
was made (DESIGN.md, section 6): the site's accent and tones are the project's own, taken from no
school. The name used is this report's, "University of Otago | Ōtākou Whakaihu Waka". Not part of
this step: the Auckland Centre (an office floor in a city building), the Wellington Liaison Office
(an office) and the Queenstown sites being set up.

**How each box was set.** This report gives addresses and no map points, so each box was drawn from
the address before the fetch, without asking any host, and checked against the snapshot's own
streets after it.

- **Dunedin** (`central`): round the streets of the addresses above in North Dunedin (362 Leith
  Street; the corner of Albany and Cumberland Streets; 145 Union Street East), wide on every side:
  `[-45.875, 170.503, -45.858, 170.5265]`, 1.9 km north to south and 1.8 km east to west. Leith,
  Albany, Cumberland, Castle and Great King Streets and Union Street East all run through the
  snapshot. `osm/context-otago-dunedin.json`: 6,565,134 bytes, 9,048 elements (3,090 building ways
  and 10 relations), from `overpass-api.de`, OpenStreetMap base 2026-10-27 08:44 UTC; **1 request**.
  The 94 buildings the rule takes lie 51 m (the Sargood Centre, at Logan Park) to 897 m inside the
  box's edges, and span 1,457 m east to west and 866 m north to south; the origin, the sun and the
  weather are at their middle (-45.8661, 170.5167).
- **Christchurch**: the address is 2 Riccarton Avenue, Christchurch Hospital's. The University of
  Canterbury's committed Arts Centre snapshot (`osm/context-uc-arts-centre.json`, #110) holds
  Otago's Department of General Practice at 14 Gloucester Street (`operator=University of Otago`)
  and the hospital's School of Medicine, so the box was drawn round the hospital and those two:
  `[-43.5372, 172.6215, -43.5275, 172.632]`, 1.1 km by 0.85 km. Riccarton Avenue, Hagley Avenue,
  Oxford Terrace and Gloucester Street run through it. `osm/context-otago-christchurch.json`:
  1,912,367 bytes, 1,966 elements, `overpass-api.de`, base 2026-10-27 08:44 UTC; **1 request**.
  Otago's 3 buildings lie 245 to 277 m inside its edges.
- **Wellington**: the address is 23A Mein Street, Newtown, by Wellington Hospital. The box was drawn
  round the hospital and Mein Street: `[-41.3125, 174.7735, -41.3035, 174.7845]`, 1.0 km by
  0.9 km. Mein Street runs through the snapshot from Riddiford Street east. 2,384,487 bytes, 2,655
  elements, `overpass-api.de`, base 2026-10-27 08:45 UTC; **1 request**. **No building there traces
  to Otago by its tags.** The box holds 19 `building=university`, none with an operator tag and none
  whose name says Otago: 16 have no name (5 of them stand about 60 to 100 m north of Mein Street,
  on the hospital's side), and the three named are "Massey University Block 7" and "K1" and "K2",
  50 m from it. The rule's last step would take K1 and K2 by `building=university` with no
  operator, but in this box that tag does not single out Otago: the one building named for a
  university is Massey's, with no operator either. The hospital's buildings are
  `building=hospital`, with no university tag. So
  Wellington is not on the site (Real or absent): its area was taken out again, and its snapshot
  deleted with its record before the commit; no terrain tile was fetched under it.
- **Invercargill**: the address is 100 Nelson Street, Georgetown. With no street layout of
  Invercargill to hand, the box was drawn wide round Georgetown and the hospital south-east of the
  city centre, to be narrowed by what it held: `[-46.442, 168.34, -46.415, 168.382]`, 3.0 km by
  3.2 km. Nelson Street runs through it from north to south (168.3668 E, from 46.4178 to 46.4323 S),
  and the hospital stands in it as "Kew Hospital" (`building=hospital`). 9,632,920 bytes, 11,875
  elements (8,996 buildings), `overpass-api.de`, base 2026-10-27 08:59 UTC; **7 requests** in the
  script's three rounds: `overpass-api.de` answered 502 twice, `overpass.kumi.systems` 502 once,
  two waited 240 s with no answer (`overpass.kumi.systems`, `overpass.private.coffee`), one
  connection to `overpass.private.coffee` failed before a request was sent, and the seventh was
  answered. **No building there traces to Otago by its tags**: the box holds no
  `building=university`, no building with Otago's operator tag, and no name that says Otago, and no
  building carries the address 100 Nelson Street. So Invercargill is not on the site (Real or
  absent): its area was taken out again, and its snapshot deleted with its record before the
  commit; no terrain tile was fetched under it, and the box was not narrowed.

**What could be Otago's, by its tags.** In the Dunedin box 2 buildings carry
`operator=University of Otago` (Student Health, `amenity=doctors`, and the Hocken Collections,
`amenity=library`), 147 carry `building=university` with no operator (50 of them with no name), and
15 carry `building=university` with `operator=Otago Polytechnic`, the one other tertiary school
there. No building in it has `amenity=university`. In the Christchurch box 2 carry Otago's operator
(Terrace House and the Department of General Practice) and 2 `building=university` with no operator
(the "University of Otago - Wai Ora Building" and one with no name); the School of Medicine is
`building=hospital` with `amenity=university` and no operator. Neither snapshot holds an
`amenity=university` area: `fetch-osm.ts` asks Overpass for buildings, streets, paths, parks and
trees, not for campus outlines.

**The rule** (`src/schools/otago/school.ts`), as VUW's and UC's: a building is taken by Otago's
`operator` tag, or by `building=university` with no other operator named, and by its name; a home is
never considered, whatever its operator. A building with `amenity=university` is a candidate too,
so that the School of Medicine is considered and its verdict recorded. Steps added for what Otago's
boxes hold, each before the step that would take it:

- a childcare centre by its name or its description, not only by `amenity`: a `building=university`
  named "Childcare Centre", and the Polytechnic's I Block ("Polykids Childcare Centre");
- `building=hospital` with no Otago operator: the School of Medicine on Christchurch Hospital's
  grounds. Its tags name no operator, and `amenity=university` with that name does not say which
  university's it is; a building of another body is shown as Otago's only where its own tags say so,
  as for the Malaghan Institute at VUW (#101);
- the Otago University Students' Association's two buildings, by their names: a body of its own;
- "B Block" (`building=university`, no operator): named in Otago Polytechnic's lettered series on
  Forth Street, whose A, D, F, G, H, I, L, N, O, P, S and T Blocks all carry the Polytechnic's
  operator tag;
- "Poho" (`building=university`, no operator): no tag says whose it is, and it stands between the
  Polytechnic's A Block and B Block.

**Taken: 97.** Dunedin 94: 2 by Otago's operator, 92 by `building=university`. Christchurch 3:
Terrace House and the Department of General Practice by Otago's operator, and the Wai Ora Building
by `building=university`, its name naming Otago. Heights: 21 from `building:levels`, 76 at a
default (20 at 10 m, 56 at 6.5 m), none from `height`. Tallest: the Richardson Building and the
Otago Business School 39.6 m (11 levels), the Microbiology Building 32.4 m, Science 2 and the Wai
Ora Building 28.8 m. **Left out: 72**, each with its reason: 51 with no name (Dunedin 50,
Christchurch 1), 14 with the Polytechnic's operator, the Polytechnic's I Block (a childcare centre,
by its description), the Childcare Centre, B Block, Poho, the students' association's 2, and the
School of Medicine.

**Judgements for review.** (1) B Block and Poho are left out on the Polytechnic's tags round them;
if they are Otago's, two steps come out. (2) Eight buildings off Union Street East are taken by
`building=university` with no operator, though their names do not say whose they are and they stand
near the Polytechnic's buildings: the Administration Block, Auditorium, Teaching Wing, Tower Block,
Education and Resource Centre, Dunedin Study Building, Drama Centre and Theatre, and Te Korokoro 2.
Beside them, the names of the "University of Otago College of Education Gymnasium" and the
"University of Otago School of Performing Arts" (`alt_name=Te Korokoro 1`) say Otago. (3) Te Roopu
Maori, the University Staff Club and the Pacific Islands Centre are taken by their tags; their names
do not say whether a group of the University's or a body of its own uses them. (4) "Thomson
Residence (Former)" is taken: by its name, nobody lives there now. (5) The Sargood Centre at Logan
Park and University Plaza by the stadium are taken by `building=university`. (6) A dormitory 420 m
north of the Richardson Building carries the same name (`way/493742022`); it is not a candidate and
stays blank, and the name the site shows is the University building's.

**Left blank.** The Dunedin box holds 684 homes by their `building` value (166 of them named, 91
dormitories among them, the residential colleges' buildings with them) and one
`building=kindergarten`; the Christchurch box holds 50 homes (3 named). None is a candidate, and
none of their names is in the published data except where a building the rule takes carries the
same name (6, above); a test checks this.

**The ground.** 13 tiles, 9 under Dunedin and 4 under Christchurch. Each tile's
`x-amz-meta-x-imagery-sources` header was logged as it came (`scripts/fetch-terrain.ts`, de7942b
from #110): every Dunedin tile names LINZ's model (`nzlinz/lds-tile-tf`, with `lds-tile-uf` in 3),
and 5 of them mix in SRTM and GMTED2010 at the harbour, one of those ETOPO1 too; the 4 Christchurch
tiles name `nzlinz/lds-tile-ph` only. So the shared terrain line in About holds for them.

## Verdicts

| Layer | Verdict | What decided it |
| --- | --- | --- |
| 1. Footprints and surroundings | usable | OpenStreetMap (ODbL). The repository's seven areas are for the University of Auckland. Dunedin, Christchurch, Wellington and Invercargill need new areas, fetched by `scripts/fetch-osm.ts` as the others are. The Auckland Centre (an office on Level 4 of 385 Queen Street) is in Auckland's city centre, near the existing `central` area (see "Needs the maintainer", 5) |
| 2. Indoor: buildings, floors, rooms | needs the maintainer | The routes that could give buildings and rooms with their positions or floors are all on `www.otago.ac.nz`: the online campus map (`/maps/`), the "List of lecture theatres and seminar rooms", and the campus map PDF. That host answered 403 to this recon's first request, its `robots.txt`. The research browser closed the host there, so none of them was requested. The Web Timetable Viewer's "Rooms" list works only on Otago's network or VPN (its host timed out). Resource Booker needs a sign-in |
| 3. Timetable | needs the maintainer | Otago's own help article: "The Web Timetable Viewer is available when connected to the campus network or the University of Otago VPN." Its host (`tts-web-prod.otago.ac.nz`) did not answer from outside (connection timed out). eVision and the Aonui student portal need a sign-in. The exam pages are on `www.otago.ac.nz` (403), by web search only: not confirmed. The class timetable exists, behind Otago's network |
| 4. Academic calendar | needs the maintainer | Open, on an allowed host: AskOtago's "Semester codes" article gives the 2026 teaching periods with dates (S1, S2, FY, SS and others). The key-dates pages and the "Academic Dates with Week Maps for 2025 and 2026" PDF are on `www.otago.ac.nz` (403). Otago's terms could not be read (same host) |
| 5. Subjects and courses | needs the maintainer | The paper (course) pages and subject lists are on `www.otago.ac.nz` (403), by web search only: not confirmed. Nothing of this layer was found on another Otago host |
| 6. Ground heights | needs the maintainer: not checked here, likely usable with a gate ("Needs the maintainer", 6) | No layer-6 route was run by this recon (see the layer's table). LINZ's catalogue has 1 m DEMs titled for each campus city: "Otago - Dunedin and Mosgiel LiDAR 1m DEM (2021)", "Canterbury - Christchurch LiDAR 1m DEM (2024-2025)", "Wellington - Wellington City LiDAR 1m DEM (2025)", "Southland LiDAR 1m DEM (2020-2024)", and Auckland's 2024 DEMs. Reading them needs a new dependency for LERC-compressed GeoTIFFs, a gate (`PROGRESS.md`, "Ideas still open", 2). Whether each capture area holds each campus was not checked. The repository's own route, the AWS Terrain Tiles, was not tried here |

One door decides most of this. By AskOtago's links, `www.otago.ac.nz` holds Otago's campus map,
room list, key dates and terms; by web search only, its paper and exam pages too. Its first answer to this recon was a 403, to
`https://www.otago.ac.nz/robots.txt`. The host's addresses are Cloudflare's (162.159.141.125 and
172.66.1.121, by DNS). `polite.mjs` closed the host after the 403. This recon did not ask that host
again, and did not ask the bare `otago.ac.nz` (the same addresses) at all. So the layers 2, 4 and 5 verdicts
rest on that one answer. They also rest on what Otago's own help site (`ask.otago.ac.nz`, open,
read) says and links to. Web search results describe some of the closed pages; this document
marks each such fact "web search" and did not confirm it.

## Campuses

AskOtago's "Campus addresses and postcodes" (KA-10002203) lists six places. A web search result
summarises Otago's international campuses page as saying that the University has campuses in five
main centres in New Zealand. Otago's campus page, also seen only in a web search result, says that
Otago is setting up a Queenstown campus. AskOtago calls the campus map it links "the Dunedin
campus map" (SA-000112); whether it also shows other campuses was not seen.

| Place | Address (source) | Map or rooms seen | OpenStreetMap in the repo | LiDAR 1 m DEM (catalogue title) |
| --- | --- | --- | --- | --- |
| Dunedin campus (main) | "362 Leith Street Dunedin 9016" (KA-10002203). AskOtago's hubs: the Central Hub "in the Information Services Building (corner of Albany and Cumberland Streets, opposite the Otago Museum)", the "Clocktower Building Hub – Leith Street", and the "College of Education Hub – 145 Union Street East" (KA-10004379) | The online campus map (`/maps/`) and its PDF ("Campus-Map-2026-web.pdf", 861 KB by AskOtago's link text) are for Dunedin. Neither was requested (403 host) | none: a new area | "Otago - Dunedin and Mosgiel LiDAR 1m DEM (2021)"; coverage not checked |
| Christchurch campus | "University of Otago, Christchurch 2 Riccarton Avenue Christchurch 8011" | none found | none: a new area | "Canterbury - Christchurch LiDAR 1m DEM (2024-2025)"; coverage not checked |
| Wellington campus | "University of Otago, Wellington 23A Mein Street Newtown Wellington 6021" | none found | none: a new area | "Wellington - Wellington City LiDAR 1m DEM (2025)"; coverage not checked |
| Wellington Liaison Office | "Level 5, Lambton Centre 17 Lambton Quay Wellington 6104". Its website link says "(requires staff login)" | an office, not a campus | none | as above |
| Invercargill campus | "University of Otago Invercargill Campus 100 Nelson Street Georgetown Invercargill 9812" | none found | none: a new area | "Southland LiDAR 1m DEM (2020-2024)"; coverage not checked |
| Auckland Centre | "Level 4, 385 Queen Street Auckland 1010" | an office floor in a city building | near the `central` area (`scripts/lib/areas.ts`); not geocoded here | Auckland 2024 DEMs; the repository already has ground for central Auckland |
| Queenstown (being set up) | web search only: teaching "will initially take place in existing facilities at Queenstown Resort College and at our Jack's Point lakeside facility, Hākitekura" (`https://www.otago.ac.nz/queenstown/study/campus`, not requested) | none | none | "Otago - Queenstown LiDAR 1m DEM (2021)"; coverage not checked |

Places to leave blank. Otago's residential colleges, its childcare centres, and any housing at the
Queenstown sites are homes or childcare under the rules. Their list is on `www.otago.ac.nz`, which
was not read, so this document names none. A build must find them in the source and leave them
blank.

## What the site could do

- **With the usable layers only:** Dunedin, Christchurch, Wellington (Newtown) and Invercargill in
  3D from OpenStreetMap footprints. The ground comes from the repository's terrain route (the AWS
  Terrain Tiles, not checked here for these cities) or, after the dependency gate, from LINZ's 1 m
  DEMs. A building is the finest place, named only where OpenStreetMap names it. No floors, no
  rooms, no classes. The Auckland Centre is one floor of a city building; the site could at most
  mark that building.
- **If Otago agrees and lets the project read `www.otago.ac.nz` ("Needs the maintainer", 2):**
  the campus map's own requests (vendor and fields unknown: the page was not loaded) could name
  buildings, and perhaps rooms.
  The room list gives teaching rooms by code. A web search result describes its pages: one page
  for each building, with each room's code, floor and capacity (for example "BURN1", a ground-floor
  lecture theatre in the Arts Building, and "R7N10", a seventh-floor seminar room in the Richardson
  Building). Rooms would then be located to a floor, as a floor named in words, not an outline.
  The calendar would come from the key-dates pages and the week-maps PDF, and search would know the
  paper codes. The 2026 teaching periods are open now on AskOtago (layer 4).
- **If Otago also opens the timetable:** the Web Timetable Viewer searches by paper or by room
  (web search). AskOtago tells students to "Click on the Rooms link on the left then scroll the
  list to find a computer lab with its room code". With it, class meetings would be located to a
  room code. Today it answers only on Otago's network or VPN.
- **Floor and room outlines:** no source found publishes them. The Dunedin campus map PDF has a
  building index with codes and grid squares (web search). It is a drawing, not floor plans.

## Layer 1: footprints and surroundings

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| The repository's areas | `scripts/lib/areas.ts`, `data/raw/osm/` | read locally, no request | Seven areas for the University of Auckland. `central` is `[-36.8689, 174.7608, -36.8441, 174.7797]` (south, west, north, east). None is in Otago, Canterbury, Wellington or Southland |
| Overpass | not requested | none | AUT's recon of the same day found that `overpass-api.de/robots.txt` disallows `/api/` and that Overpass refuses a headless browser (406). The pipeline's `scripts/fetch-osm.ts` is the route. The tags of Otago's buildings (`name`, `ref`, `building:levels`, `height`) were not read |
| Open data | web search for an Otago or Dunedin GIS layer of campus buildings | none found | — |

Licence for OpenStreetMap: ODbL, credit in About.

## Layer 2: indoor (buildings, floors, rooms)

AskOtago's "Finding a lecture location" (KA-10004015) gives the routes: "Using the map on the
Student App", "Searching the Otago campus map", a "List of lecture theatres and seminar rooms", and
"Computer study spaces on the Dunedin campus". "If you cannot find the room, contact the relevant
department as it may be a departmental room."

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Campus map page (RECON's route 1) | `https://www.otago.ac.nz/maps/` (linked from KA-10002193, KA-10004015, KA-10002148) | not requested: the host answered 403 to its `robots.txt` (see "Request log") | Unknown. AskOtago says: "Use the Search function on the Otago Campus Map to find these locations". The map's own requests, and whether a vendor (MazeMap, MapsIndoors, Concept3D, Mappedin, ArcGIS Indoors, Pointr) serves them, were not seen. Web searches for the map on those vendors found none |
| The Student App's map | `http://www.otago.ac.nz/app` (KA-10002807) | not requested (403 host) | "The Dunedin campus map" is in the app for anyone. A mobile app, "not available on the web"; it "will be retired at the end of Semester 1, 2026". Semester 1 of 2026 ended on 17 June 2026 (layer 4), so the app may be retired already. Its successor, the Aonui student portal (KA-10005961), is about a student's own timetable and papers |
| Room directory: list of lecture theatres and seminar rooms | `https://www.otago.ac.nz/its/services/teaching/otago028458.html` (linked from KA-10004015) | not requested (403 host) | Web search: Digital Services pages under `…/teaching-and-research-services/lecture-theatres-seminar-rooms/list/<building>`, one for each building. They give each room's code, floor and capacity: Richardson Building (`RMOOT`, "Moot Court", tenth floor; `R7N10`, seventh floor), Castle Lecture Theatre Complex (`CAST1`, ground floor), Geology Building (`QUAD1`, `QUAD3`), Arts Building (`BURN1`, ground floor; `BURN4`; `BURN7`), Surveying Building (`SVG10` for "Surveying G.10", `SV205` for "2.05"). The search results said these are pool rooms, grouped as Central Campus and East Campus. Not confirmed |
| Room directory: computer labs | `https://ask.otago.ac.nz/knowledgebase/article/KA-10002148` | 200 `text/html; charset=utf-8`, 96,235 bytes | "Computer areas on the Dunedin campus": a list of computer labs with the library or building each is in (for example "Arts CAL", "Central CAL", "Hercus CAL", "North CAL", "Otago Business School 1.18", "TCOL-Mac (TG05) and TCOL-PC (TG06)") and four "eStops". Names, no building codes, floors or points. "Use the Search function on the Otago Campus Map to find these locations" |
| Room directory: Web Timetable Viewer, "Rooms" | `https://tts-web-prod.otago.ac.nz/wtv2026/default.aspx` (KA-10002148, KA-10004014) | not requested; the request for its host's `robots.txt` failed (the browser reported `net::ERR_CONNECTION_TIMED_OUT`) | "this is only available through the University network or VPN" (KA-10002148). The host name is a DNS alias of `its-ttsweb-p01.registry.otago.ac.nz` (139.80.64.177) |
| Room directory: Resource Booker | `https://resourcebooker.otago.ac.nz/` (KA-10002148) | not requested: a sign-in | "To see CAL lab capacities: Open Resource Booker and log in". Its DNS name points to `cyon-rb-otago.azurewebsites.net` |
| Open data | web search | none found | Layer 1 |
| Floor-plan PDF | `https://www.otago.ac.nz/__data/assets/pdf_file/0027/247806/Campus-Map-2026-web.pdf` (KA-10002193: "Download the campus map ( PDF 861 KB )") | not requested (403 host) | Web search: the Dunedin campus map PDF has a building and department index with building codes and grid squares. A campus map, not floor plans. No floor plan of any building was found |
| Wayfinding | `https://ask.otago.ac.nz/knowledgebase/article/SA-000112` | 200 `text/html; charset=utf-8`, 91,710 bytes | "The Dunedin campus map can be viewed online and downloaded as a PDF". "Physical signage on all campuses is managed by Property Services." No map data |

Without a readable source, the building view could show only OpenStreetMap's buildings; any floor
would be inferred and labelled so.

## Layer 3: timetable

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Otago's help article for it | `https://ask.otago.ac.nz/knowledgebase/article/KA-10004014` | 200 `text/html; charset=utf-8`, 93,307 bytes | "View a timetable": "You can view your timetable using eVision or the Web Timetable Viewer." "The Web Timetable Viewer is available when connected to the campus network or the University of Otago VPN." "The provisional timetable … does not include room information. Room information is added once the timetable is finalised, usually by the Friday before semester starts" |
| Public class search: the Web Timetable Viewer | `https://tts-web-prod.otago.ac.nz/wtv2026/default.aspx` | not requested. Its host's `robots.txt` was requested once: no answer (connection timed out after it was sent); host left alone | Otago's network or VPN only. A web search result for Otago's "study timetables" page says that it searches by paper or by room |
| Student timetable: eVision | `https://evision.otago.ac.nz/sitsvision/wrd/siw_lgn` (KA-10004014: "Log in to eVision") | not requested: a sign-in | A student's own timetable. A web search result for the exam pages says that each student's exam details appear in the Timetable section of eVision |
| Student timetable: Aonui student portal | described in KA-10005961 (`https://ask.otago.ac.nz/knowledgebase/article/KA-10005961?svcArticleNumber=SA-10005966`, 200 `text/html; charset=utf-8`, 94,570 bytes) | the portal was not requested: a student's own | "The My Timetable widget allows you to view your daily schedule of classes … You can find the time and location of each class, along with the paper code and title." Signed in |
| Published files: exam timetable | `https://www.otago.ac.nz/courses/examinations/examination-periods-and-timetabling` and `…/health-sciences-professional-programme-special-examinations` (web search) | not requested (403 host) | Web search: the semester 2 exam period is 19 October to 7 November 2026; the special-exams page lists paper code, date, time and room (for example `OBSG19`, `ME202`); the main exam timetable is in each student's eVision. Not confirmed |
| Published files: ICS | none public found | — | — |
| Official API | web search | none found | — |
| Earlier student projects | three on GitHub, read through the GitHub API only | — | `otago-timetable-to-ics` (2024, Python): "Copy and paste the schedule view on eVision into a .txt file". `timetable_app` (2017, Android, "Otago University Timetable App."): its only Otago address is the eVision sign-in page. `Stucal` (2024, a student calendar): its upload page names `evision.otago.ac.nz`. All three start from a signed-in eVision. None was tested (a sign-in) |

Precision, if Otago opens the viewer: a room code (the viewer lists rooms "with its room code"),
which the room list would put on a building and a floor.

## Layer 4: academic calendar

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Otago's help article for it | `https://ask.otago.ac.nz/knowledgebase/article/KA-10003623` | 200 `text/html; charset=utf-8`, 92,301 bytes | "2026 Study dates": links to "Academic key dates" (`https://www.otago.ac.nz/news/academic-key-dates`) and to the "University of Otago Academic Dates with Week Maps for 2025 and 2026 ( PDF 269 KB )" (`https://www.otago.ac.nz/__data/assets/pdf_file/0030/314994/2025-2026-Timetable-Services-Week-Maps.pdf`). Both on the 403 host, not requested |
| Semester codes | `https://ask.otago.ac.nz/knowledgebase/article/KA-10005987/en-us` | 200 `text/html; charset=utf-8`, 93,570 bytes | Each teaching period's code and 2026 dates: "S1 – Semester 1, 20 February 2026 to 17 June 2026", "S2 – Semester 2, 13 July 2026 to 7 November 2026", "FY – Full year", "SS – Summer School, 5 January 2026 to 19 February 2026", the thesis periods T1, T2 and TY, the foundation periods F2 to F4, and N1 to N8 and SC with dates "for each specific paper". No breaks, holidays or 2027 dates |
| Key dates, one page each | `https://www.otago.ac.nz/study/academic-key-dates/2026/…` (web search) | not requested (403 host) | Web search titles: "Lectures end before semester 2 examinations" (Fri 16 October 2026), "Semester 2 examinations begin" (Mon 19 October 2026), "Formal lectures begin" (Mon 01 March 2027). Not confirmed |
| Week maps for 2026 and 2027 | `https://www.otago.ac.nz/__data/assets/pdf_file/0030/314994/2026-2027-Timetable-Services-Week-Maps.pdf` (web search) | not requested (403 host) | Not seen |

If Otago agrees and lets the project read `www.otago.ac.nz`: the week-maps PDF, transcribed by hand into
`data/<id>/academic-calendar.json`, as for Auckland.

## Layer 5: subjects and courses

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| Subject and paper codes | `https://www.otago.ac.nz/courses/…` (the paper pages; web search) | not requested (403 host) | Otago's courses are "papers" with a four-letter subject code and three digits (the special-exams page lists `PHCY211A`, `PHCY211B`, `PHCY220B`; web search). Paper selection "becomes available from early September" (KA-10003623). Not confirmed |
| Course catalogue | the same host | not requested (403 host) | Unknown: whether paper pages carry terms, campuses or class times was not seen |
| Teaching-period codes | KA-10005987 (layer 4) | 200 | The codes for a paper's teaching period (S1, S2, FY, SS and others): "Semester codes help you understand the duration of your papers" |

Keep the facts (code, title, periods, campuses), not descriptions, if Otago agrees.

## Layer 6: ground heights

| Route | URL | Answer (2026-10-22) | What it holds |
| --- | --- | --- | --- |
| AWS Terrain Tiles (the repository's own route) | not requested: RECON's layer-6 step (one tile, its `x-amz-meta-x-imagery-sources` header read) was not run here | — | AUT's recon of the same day got 403 for `s3.amazonaws.com/robots.txt` alone. VUW's then fetched three tiles and found the LINZ 8 m DEM under Wellington. This recon asked only Otago's own hosts, so the tiles over Dunedin, Christchurch and Invercargill are unchecked. The pipeline's `scripts/fetch-terrain.ts` would show their header |
| LINZ elevation catalogue | `https://nz-elevation.s3.ap-southeast-2.amazonaws.com/catalog.json` | not requested by this recon: read from the copy that VUW's recon saved on the same day (200 `application/json`, 66,450 bytes, 2026-10-22 09:46 NZDT) | DEM titles for the campus cities: "Otago - Dunedin and Mosgiel LiDAR 1m DEM (2021)", "Otago - Coastal Catchments LiDAR 1m DEM (2021)", "Otago LiDAR 1m DEM (2016)", "Canterbury - Christchurch LiDAR 1m DEM (2024-2025)", "Wellington - Wellington City LiDAR 1m DEM (2025)", "Wellington City LiDAR 1m DEM (2019-2020)", "Southland LiDAR 1m DEM (2020-2024)", "Auckland Part 1 LiDAR 1m DEM (2024)", "Auckland Part 2 LiDAR 1m DEM (2024)", "Otago - Queenstown LiDAR 1m DEM (2021)" |
| Each DEM's licence and capture area | `…/<region>/<name>/dem_1m/2193/collection.json` and `capture-area.geojson` | not requested | UC's recon read the Christchurch (2024-2025) collection: `CC-BY-4.0`, licensor Environment Canterbury. The others' licences and capture areas were not read |
| LINZ attribution page | not requested | — | AUT's recon got 403 from `www.linz.govt.nz`; see "Needs the maintainer", 6 |

Not checked: two known heights on each campus and pits where land meets sea (RECON.md, layer 6).

## robots.txt and terms

| Host | robots.txt (2026-10-22) | Terms |
| --- | --- | --- |
| `www.otago.ac.nz` | 403 (no body kept). The research browser closed the host; not asked again | The footer of every AskOtago page links "Copyright and disclaimer" to `https://www.otago.ac.nz/tools/disclaimer`, on this host: not read |
| `ask.otago.ac.nz` | 200 `text/plain; charset=utf-8`, 1,211 bytes, read before each run. Two groups. The first, under "# Allow AI search/citation bots", names `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Claude-User`, `Claude-SearchBot`, `Google`, `Google-Extended`, `Bingbot`, `Applebot-Extended` and `DuckAssistBot`, with `Allow: /`. Both groups (that one and `User-agent: *`) have the same `Disallow:` lines: `/*?sq_content_src=`, `/*?utm_`, `/*?fbclid`, `/public-course-advice`, `/public-account-request-form`, `/crsmticket`, `/ticket`, `/edit`, `/preview`, `/archive`, `/view`, `/edit-old`, `/acknowledge`, `/approval*`, `/my-articles`. `Sitemap: https://ask.otago.ac.nz/sitemap-xml`. No crawl delay | Footer of each article read: "© Copyright 2026. All rights reserved" |
| `tts-web-prod.otago.ac.nz` | no answer: the request failed (the browser reported `net::ERR_CONNECTION_TIMED_OUT`; the log keeps "Failed") | Otago's network or VPN only (KA-10004014) |
| `evision.otago.ac.nz`, `resourcebooker.otago.ac.nz`, `aonui.otago.ac.nz` | not requested: sign-ins | — |
| `nz-elevation.s3.ap-southeast-2.amazonaws.com` | not requested (VUW's recon: 404, none) | CC BY 4.0 for the Christchurch DEM (UC's recon); the others not read |
| `overpass-api.de`, `s3.amazonaws.com` | not requested (AUT's recon: `Disallow: /api/`; 403) | ODbL for the data; AWS Open Data registry |

The one copyright line read is AskOtago's footer, "© Copyright 2026. All rights reserved". It
grants nothing. Otago's own statement of what may be reused is on the disclaimer page, which could
not be read. A web search result summarised that page: other uses, commercial ones among them,
need Otago's permission. This document does not rely on that summary. RECON.md asks for a host's
terms before fetching from it; AskOtago's terms are that same unread page, so its 19 requests were
made under its `robots.txt` alone, and no page body was kept.

## Needs the maintainer

1. **`www.otago.ac.nz` answered 403.** It was the first request of this recon, to `/robots.txt`,
   from a headless Chromium ("HeadlessChrome/156"). The host is behind Cloudflare. Under "Closed
   is a verdict" the project's tools leave the host alone: no retry with another browser or
   another User-Agent, and no request to the bare `otago.ac.nz`, which resolves to the same
   addresses. Read `https://www.otago.ac.nz/robots.txt` and
   `https://www.otago.ac.nz/tools/disclaimer` yourself, in your own browser, as for the LINZ page
   (6), to learn Otago's terms. Any reading of the host by the pipeline waits on Otago's answer to
   item 2. If Otago allows it, the routes are the campus map's own requests (`/maps/`), the
   lecture-theatre list, the week-maps PDF and the paper pages.
2. **Otago's permission and access.** AskOtago's pages say "All rights reserved", and the
   disclaimer was not read. Ask Otago (through the contact its disclaimer names) for permission to
   show, with credit and not for profit, building and room codes with their map positions, the
   key dates, the paper codes, and class times and rooms. The same message can say that
   `www.otago.ac.nz` refuses the project's research browser, and ask whether Otago will let the
   project's pipeline read those pages once a term, or send the data as files. Only Otago can
   grant either.
3. **The Web Timetable Viewer.** It searches by paper or by room (web search), and it lists rooms
   with their codes (AskOtago), but only on Otago's network or VPN. The same message can ask
   whether Otago would open it to the public or publish its room timetables as files once a term.
4. **The sign-in walls, recorded once and left alone:** eVision
   (`evision.otago.ac.nz/sitsvision/wrd/siw_lgn`), the Aonui student portal, Resource Booker
   ("Open Resource Booker and log in") and the Wellington Liaison Office link "(requires staff
   login)". None was requested.
5. **Overpass for the campus cities.** Run `scripts/fetch-osm.ts` for new areas over the Dunedin
   campus, the Christchurch campus (2 Riccarton Avenue), the Wellington campus (23A Mein Street,
   Newtown) and the Invercargill campus (100 Nelson Street). Check whether 385 Queen Street falls
   inside the `central` area. Not requested here, for the reasons in AUT's recon.
6. **LINZ.** Read the capture areas of the DEMs named in layer 6, to see which campus each one
   covers, and their licences. Read the attribution page (`www.linz.govt.nz`, 403 to a headless
   browser in AUT's recon) in your own browser for the credit wording. Or run
   `scripts/fetch-terrain.ts` over each campus and read the tiles' source header.
7. **Places to leave blank.** Before any room is named, list Otago's residential colleges,
   childcare centres and any housing at the Queenstown sites from the source, so the build leaves
   them blank.
8. **Two tool gaps.** First, `polite.mjs` does not read `robots.txt`; this recon's reader parsed it
   itself, as UC's did. Second, a host that `polite.mjs` closes stays closed only inside one
   browser: the next run starts open. This recon's reader kept a list of closed hosts in a file
   and refused them before launching. A `robots.txt` check, and a closed-hosts list kept across
   runs, inside `polite.mjs` would close both gaps.

## Request log

Every request went through `scripts/research/polite.mjs` as it is on branch
`loop-polite-redirects` (pull request #71, open; commit 9c32102), from one scratch reader (UC's reader, copied) in
8 runs. Each run started one browser with `politeLaunch()` and opened one polite page that let only
documents and fetches through. It loaded the host's `robots.txt` as the page, then read each URL
by an in-page `fetch()` with `redirect: "manual"`. So no frame, script or image of a page was
loaded, and each redirect hop was a request of its own, checked against `robots.txt` before it
went. Each host was paced to at least 1.1 s, counted from the last request to it in any run. The
reader refused, before launching a browser, any host that had answered 401 or 403 or dropped a
connection in an earlier run. The browser's User-Agent was "… HeadlessChrome/156.0.0.0 …". Web
searches, DNS lookups and reading three student projects through the GitHub API did not send a
request to the school's web servers, and are not in the log. UTC 2026-10-22 05:42:53 to 05:51:09
(18:42 to 18:51 in New Zealand).

- **Sent:** 21, all GET. `ask.otago.ac.nz` 19 (6 of them its `robots.txt`, once a run),
  `www.otago.ac.nz` 1 (its `robots.txt`), `tts-web-prod.otago.ac.nz` 1 (its `robots.txt`).
  Answers: 18 × 200, one 301 (`/sitemap-xml` to `/sitemap-xml/`), one 403
  (`www.otago.ac.nz/robots.txt`), one connection timed out (`tts-web-prod.otago.ac.nz/robots.txt`).
  No form was submitted, nothing was signed in to, no POST went out.
- **Blocked before leaving the machine:** 7. Six were the browser's own icon request
  (`favicon.ico`) on `ask.otago.ac.nz`, one a run. One was `polite.mjs` refusing a second
  `www.otago.ac.nz/robots.txt` request after the 403 ("closed: 403"). No page's own scripts,
  styles or frames were asked for, because no page was loaded as a page; no other host was asked
  for. No cookie banner was loaded, so none had to be refused.
- **Rate:** the shortest gap between two requests was 1.293 s, and no second held more than one.
  Per host: `ask.otago.ac.nz` 1.293 s; the other two hosts had one request each.
- **Order:** each host's `robots.txt` was asked for before anything else was sent to it. Two of
  the three gave no file (403, time-out), and nothing else was sent to them.
- **Disallowed path:** none requested. Every `ask.otago.ac.nz` URL was checked against its file
  first. The sitemap was read through its `Sitemap:` line: 280,404 bytes, `Text/XML`, 1,443 URLs,
  1,357 of them knowledge-base articles, newest `lastmod` 2026-10-22.
- **Crawl delays:** none named.
- **401, 403 and sign-in walls:** `www.otago.ac.nz` 403 (above), recorded once. `tts-web-prod`'s
  dropped connection, recorded once. eVision, Aonui, Resource Booker and the staff-login link were
  not requested.

The raw answers stayed outside the repository and are not committed. AskOtago's pages say "All
rights reserved", so every saved answer (the 11 articles, the sitemap and the `robots.txt`
copies) was deleted from the scratch folder once the counts above had been taken and checked. Only
the two request logs (URL, time, status, content type, size) and the list of closed hosts are kept
there.
