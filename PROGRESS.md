# PROGRESS

Handover notes for whoever (probably a future session of the same agent) picks this up next.
Read `AGENTS.md` first, then this file, then `git status` / `git log`. `GOAL.md`, the original brief,
is local only; its rules now live in `AGENTS.md`, and where this file cites a section of it ("GOAL
§2") it says what that section asked.

**If you are a contributor's agent:** "the user" here is the maintainer, who owns the repository,
not the person you work for. "Now working on" and "Needs the user" are the maintainer's lists; take
up an open issue instead. "Decisions" and "Tried and did not work" bind you too. Sections headed
with a date are records of that day: what was true then, not now; `CHANGELOG.md` has what came
after. Notes on "this machine" are about the maintainer's Windows computer.

Last updated: 2026-10-21 NZDT

## Now working on

The build is finished: everything in GOAL §2 that can be done without a timetable source is done and
verified on the live site (see "Final report" and "Acceptance criteria").

The project is moving to being maintained by coding agents, in three stages agreed with the user on
2026-10-13:

1. **Rules without automation (this stage).** `AGENTS.md`, `docs/standards.md`, `CONTRIBUTING.md`,
   issue and pull-request forms; end-to-end tests gate the deploy; `main` is protected and takes
   changes only through pull requests that the user merges.
2. **Agents write and review, the user merges.** From here a `LESSONS.md` (not started yet) records what had to be
   fixed twice, what should not have merged and what was verified too thinly; a lesson seen on three
   separate days moves into `docs/standards.md`. How the agents are triggered and paid for is not
   decided.
3. **Automatic merging for low-risk changes** (documents, tests, sourced data corrections). The gates
   in `AGENTS.md` keep waiting for the user.

Not built yet, and wanted by stage 2: a place for sourced corrections that the pipeline applies, so
that a fault in a source can be fixed without a hand edit to `public/data/`.

**If you are the maintainer's next session:** check `gh run list --limit 3` is green, run
`E2E_BASE_URL=https://campusworldmodel.com/uoa/ npm run e2e`, then take up an open issue, pick a bonus
item below or, if the user has added a timetable snapshot, follow README "Adding the class timetable".

Every bonus idea listed on 2026-10-13 that has a public source was done on 2026-10-14 and 15, at the
user's request (see "Data sources" and "Other sources"): types, signs and pinned outlines on the
floor plans; the real sun, current weather and seasons; every campus in 3D; the ground's heights.
The course catalogue was built too and is held back (see "Other sources"). Ideas still open:

1. The sea: OpenStreetMap's coastline is a line, and turning it into water (with the land polygons
   OpenStreetMap publishes for that, a new source) would put Leigh and Waiheke on their shores.
2. The 1 m LiDAR DEM in place of the 8 m model (AWS `nz-elevation`, LINZ, CC BY 4.0): a new
   dependency to read LERC-compressed GeoTIFFs, so a gate.
3. Chinese or other translations of the interface (the structure is there; one locale file each).

## Final report (2026-10-13)

- Live site: https://pengqianhan.github.io/campus-world-model/
- Repository: https://github.com/pengqianhan/campus-world-model (public, MIT for code)
- Verified at commit `435a4e0`: CI run green (build, e2e on software WebGL, deploy); the same 11
  Playwright tests pass against the live URL; screenshots read by eye (`docs/*.jpg` are taken from
  the live site).
- Data snapshots: campus map, OpenStreetMap and University Calendar all taken 2026-10-13
  (Pacific/Auckland); recorded with hashes in `data/sources.json` and shown in About.
- **Not achieved: class times.** No public, no-login source exists (table under "Data sources").
  Courses 0, scheduled classes 0, so the building/floor/room location percentages do not apply.
  Criteria 2 and 3 are therefore only partly met: rooms, floors and buildings work with real data,
  but a room cannot show real classes and a course code resolves only to its subject. The site says
  this plainly in the room card, the status strip, Search and About, and shows nothing invented.
- Done beyond the minimum: Grafton and Newmarket in the same scene, day/night lighting with lit
  windows, Open-Meteo temperature, illustrative room interiors (labelled as such), pins for rooms
  without an outline, e2e in CI.
- Not done: terrain (ground is flat), course-level catalogue, 3D for remote campuses, seasons,
  Chinese or other translations (structure only, as specified).

## Acceptance criteria (GOAL §2): status and evidence

Verified 2026-10-13 against https://pengqianhan.github.io/campus-world-model/ at commit `435a4e0` with
`E2E_BASE_URL=... npm run e2e` (11/11 passed) plus screenshots read by eye.

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | 3D City Campus, labelled buildings, rotate and zoom | Met | e2e "1."; canvas sampled for a real picture; `docs/campus-day.jpg` |
| 2 | Click a building, switch floors, see rooms, room shows classes at the selected time | Met for buildings, floors and rooms. **Classes: not met with real data** (no public timetable); the room card says so. The class display itself works, shown with a fixture | e2e "2." and "timetable features…"; `docs/room.jpg` |
| 3 | Search by course code, room number, building name; camera goes there | Met for rooms and buildings. **Course codes: partly** — only the subject is recognised (e.g. COMPSCI 101 -> Computer Science) with a note that class times are not public; there is no room to fly to | e2e "3." |
| 4 | Now (Pacific/Auckland) and Preview; non-teaching periods explained | Met | e2e "4.", "4b."; unit tests for daylight-saving days |
| 5 | URL restores building, floor, room and time | Met | e2e "5." |
| 6 | 390 px phone: search, building and class info | Met (class info = the "not shown" note) | e2e "6." (mobile project) |
| 7 | About: unofficial notice, sources with links and snapshot dates, OSM attribution, limitations | Met | e2e "7." |
| 8 | All text from locale files; `?lang=`; a new language is one new file | Met | e2e "8."; `tests/i18n.test.ts` |
| 9 | Repo pushed, CI green on `main`, README covers running, refreshing data, adding a language | Met | latest runs on `main`: build, e2e, deploy all success |
| 10 | Coverage numbers in the final report | See "Coverage" | `public/data/uoa/meta.json` |

## Coverage (snapshot 2026-10-13)

- Courses with timetable data: **0**. Scheduled classes: **0**. Share located to building / floor /
  room: **not applicable** (nothing to locate).
- What is covered instead: 194 buildings, all on the 3D map; 786 learning spaces with outlines, every
  one tied to a building and a floor from the official campus map; 4,573 further rooms locatable as a
  point on their floor; 14,840 other spaces drawn on their floors, each with the campus map's type
  for it; 251 subject codes; the 2026 academic calendar.
- What the campus map itself leaves out, of the 794 floors on the 3D map: 98 floors with no shape at
  all (`noPlan: "unmapped"`; 73 of them in halls of residence the source maps as a bare building),
  and 35 where its shapes cover under 30% of the floor (`partialPlan`; plant levels, mezzanines,
  split-level landings). The floor list marks both and the building bar says so.

## Schools

Several schools share this repository as `docs/schools/DESIGN.md` sets out: one build for each, at
`/<id>/`, each school's published data in `public/data/<id>/`, and its research in
`docs/schools/<id>.md`. The deploy publishes the schools on `.github/schools.json`.

| School | Path | Form (DESIGN.md, section 2) | Coverage (`public/data/<id>/meta.json`) |
| --- | --- | --- | --- |
| University of Auckland | `/uoa/` | Floor plans, from its campus map | 194 buildings, all on the map; 786 learning spaces with outlines; 4,573 more rooms located as points; 14,840 other spaces; 251 subject codes; 0 classes (see "Coverage") |
| Auckland University of Technology (AUT) | `/aut/` | Buildings: the City, North and South campuses from OpenStreetMap, picked by the `operator` tag and AUT's building code (a campus letter and a building letter) in `ref` or as the whole `name`, each on the campus of the area it stands in, on the LINZ ground | 41 buildings, all on the map (City 18, North 15, South 8); 6 more left out, each with its reason (`buildingExclusions`; North's AE Building is 15 separate rings); heights: 0 from a `height` tag, 4 from `building:levels`, 37 estimated; 0 rooms, subjects and classes |
| Te Herenga Waka—Victoria University of Wellington (VUW) | `/vuw/` | Buildings: the Kelburn, Pipitea and Te Aro campuses from OpenStreetMap, picked by the `operator` and `building=university` tags and a name, never a home, each on the campus of the area it stands in, on the LINZ ground | 56 buildings, all on the map (Kelburn 52, Pipitea 3, Te Aro 1); 30 more left out by the tag rule, each with its reason (26 with no name, 2 that start above the ground, 1 with another operator, and the Malaghan Institute of Medical Research, an independent institute on the campus); heights: 0 from a `height` tag, 46 from `building:levels`, 10 estimated; 0 rooms, subjects and classes |
| University of Otago \| Ōtākou Whakaihu Waka (Otago) | `/otago/` | Buildings: the Dunedin and Christchurch campuses from OpenStreetMap, picked by the `operator` and `building=university` tags and a name, never a home, and never a hospital building, the students' association's or the ones the Polytechnic's tags place among its own, each on the campus of the area it stands in, on the LINZ ground. Wellington and Invercargill are not shown: OpenStreetMap names no university building at either and gives none Otago as its operator (`docs/schools/otago.md`, "On the site") | 97 buildings, all on the map (Dunedin 94, Christchurch 3); 72 more left out by the tag rule, each with its reason (51 with no name, 15 with Otago Polytechnic's operator, one of them holding a childcare centre, a childcare centre by its name, 2 of the students' association's, B Block and Poho, and the School of Medicine on Christchurch Hospital's grounds, whose wikidata tag is left for a person to check); heights: 0 from a `height` tag, 21 from `building:levels`, 76 estimated; 0 rooms, subjects and classes |
| University of Canterbury (UC) | `/uc/` | Buildings: the Ilam and Dovedale campuses and the Arts Centre city location from OpenStreetMap, picked by the `operator` and `building=university` tags and a name, each on the campus of the area it stands in, on the LINZ ground; homes are never considered. Nelson is not shown: OpenStreetMap tags no building there as UC's | 57 buildings, all on the map (Ilam 45, Dovedale 11, the Arts Centre 1); 17 more left out by the tag rule, each with its reason (13 with no name, 2 under construction, 1 with no storey above the ground, and 1 of the University of Otago's at the Arts Centre); heights: 0 from a `height` tag, 52 from `building:levels`, 5 estimated; 0 rooms, subjects and classes |
| Te Kunenga ki Pūrehuroa Massey University (Massey) | `/massey/` | Buildings: the Manawatū, Auckland and Wellington campuses from OpenStreetMap, picked by the `operator`, `building=university` and `amenity=university` tags or a name, house name or address place that says Massey, and a name, never a home or a childcare centre, and never a building whose own `fixme` tag asks what it is, each on the campus of the area it stands in, on the LINZ ground. The School of Aviation, the Large Animal Teaching Unit, the research farms and Singapore are not shown (`docs/schools/massey.md`, "On the site") | 55 buildings, all on the map (Manawatū 39, Auckland 8, Wellington 8); 43 more left out by the tag rule, each with its reason (42 with no name, and Student Central at Albany, whose `fixme` tag asks whether it is the new police college); heights: 0 from a `height` tag, 14 from `building:levels`, 41 estimated; 0 rooms, subjects and classes |

AUT's open items, from `docs/schools/aut.md`, "Needs the maintainer" (each is the maintainer's to do):

1. AUT's permission for its class times, semester dates and course list: one request covers the
   three. Until it is asked, the site does not say that it has asked.
2. A written agreement with MazeMap, with AUT's consent, for AUT's floors and rooms.
3. Done on 2026-10-27: the North and South campuses are on the site, from one Overpass area each,
   which the maintainer let the loop fetch (`docs/schools/aut.md`, "North and South on the site").
4. Brand colours: on 2026-10-26 no brand colours published by AUT were found on its public site
   (no brand page at five likely addresses, none linked from its home page, and `robots.txt`
   disallows its stylesheets). Its home page's two logos are white and slate blue `#536972`, far
   from the accent `#ffb454` (CIEDE2000 29.1 and 46.3). If AUT publishes brand colours, compare
   them again (DESIGN.md, section 6).

VUW's open items, from `docs/schools/vuw.md`, "Needs the maintainer" (each is the maintainer's to do):

1. The Academic Timetable spreadsheets under `/tools`, which `robots.txt` disallows: ask VUW, or
   decide that two linked downloads are not what that line is for. With them, classes are located
   to a room code.
2. What `/__data/.*` in VUW's `robots.txt` covers: the key dates and the 2026 Calendar PDF are under
   it.
3. VUW's copyright condition, "accurately and without modifications": decide whether the site may
   show the room list (the Rooms by code form) and the course list on that reading, or ask VUW.
   Until then both are absent, and the site says so.
4. Done on 2026-10-27: the Pipitea and Te Aro campuses are on the site, from one Overpass area
   each, which the maintainer let the loop fetch (`docs/schools/vuw.md`, "The three campuses on the
   site"). Rutherford House stands at the 10 m default: OpenStreetMap gives its storeys only on its
   parts, which the height rule in "Decisions" does not read.
5. Brand colours: on 2026-10-27 VUW's home page sets `--green-brand: #115737` and `--green-light:
   #669787` in its own styles, with `#0d4c38` and `#fce500` in a heading; `/brand` and
   `/about/brand` answer 404. All are far from the accent `#ffb454` (CIEDE2000 57.0, 38.3, 60.8,
   21.0) and from the University buildings' tones; the nearest tones of the palette are the night
   map's trees, pitches and grass (`#2a5c40` 3.4 and `#244a33` 3.9 from VUW's greens), which every
   school shares.

Otago's open items, from `docs/schools/otago.md`, "Needs the maintainer" (each is the maintainer's
to do):

1. `www.otago.ac.nz` answered 403 to the recon's first request and is closed for this project: its
   campus map, room list, key dates, paper pages and terms stay unread. Reading its `robots.txt` and
   disclaimer in your own browser, and Otago's permission and access, are items 1 and 2 there.
2. The Web Timetable Viewer answers only on Otago's network or VPN (item 3 there).
3. Brand colours: not checked, since the site answered 403 (DESIGN.md, section 6); the accent and
   tones are the project's own, taken from no school.
4. Done on 2026-10-27: Dunedin and Christchurch are on the site, from one Overpass area each, which
   the maintainer let the loop fetch; Wellington and Invercargill were fetched and are not on the
   site, since OpenStreetMap names no university building at either and gives none Otago as its
   operator (`docs/schools/otago.md`, "On
   the site").

UC's open items, from `docs/schools/uc.md`, "Needs the maintainer" (each is the maintainer's to do):

1. UC's written permission: its copyright page forbids copying its web material without "prior,
   express written permission", which holds back its map points (rooms by building), its key dates
   and its subject codes, and would hold back any timetable. One request covers them all. Until it
   is asked, the site does not say that it has asked.
2. The timetable planner (`timetable.canterbury.ac.nz`), whose `robots.txt` disallows every agent,
   and the Course Information System, whose `robots.txt` disallows Claude's agents: the same
   request can ask about both.
3. Done on 2026-10-27: Ilam, Dovedale and the Arts Centre are on the site, from one Overpass area
   each, which the maintainer let the loop fetch (`docs/schools/uc.md`, "On the site"). Nelson's
   area held no building that OpenStreetMap traces to UC: the UC Nelson Centre's point stands among
   NMIT's blocks, tagged `building=school` with NMIT's website. Nelson waits for a source that
   traces a building there to UC.
4. The LINZ attribution page, for the 1 m DEMs of Christchurch and Nelson, if they are used (a new
   dependency, a gate).
5. Judgements on the Ilam campus (`docs/schools/uc.md`, "On the site"): Haere-roa and Ilam
   Homestead, each with the website of a venue of its own, and Putaiao Koiora, mapped as closed
   since about 2020, are shown as UC's by their `building=university` tag; "47 Creyke Road" is shown by OpenStreetMap's name for
   it, with no floor or room, although UC's map gives it keywords of a postgraduate village; Alice
   Candy (`building=school`) and the UC Health Centre (`building=yes`) carry neither of the rule's
   tags and are not shown as UC's.
6. Brand colours: on 2026-10-27 UC's home page sets four colours in its own markup, in its
   accessibility widget's settings: teal `#477A7E`, navy `#052942`, gold `#FFCF4B` and white. It
   links no brand page, and its logo (an SVG) was not read. CIEDE2000 from the accent `#ffb454`:
   gold 11.3, the rest 29.0 to 73.4; the gold is 9.2 from the night hover `#ffd08a`, and the navy
   9.4 from the night roof tone `#2f4460`. The nearest tones of the palette are the night map's
   water, ground and road edge (4.3 to 5.8 from the navy), which every school shares, and the night
   lab-room colour `#4b7570` (4.6 from the teal), which `/uc/` never draws. UC keeps the project's
   accent. Whether the night map's navy and orange read too much like UC's navy and gold is the
   maintainer's call. If UC publishes brand colours, compare them again (DESIGN.md, section 6).

Massey's open items, from `docs/schools/massey.md`, "Needs the maintainer" and "On the site" (each
is the maintainer's to do):

1. Massey's key dates and course list are open, and its copyright page allows non-commercial reuse
   (layers 4 and 5 there), but reading them takes a fetch of a new source, a gate. Until the
   maintainer decides, both are absent, and the site says that it does not take them until then.
2. Massey's room data and class timetable: only Massey can open them (items 1 and 2 there).
3. Brand colours: not compared. Massey's home page (read twice on 2026-10-28, four requests in all)
   sets none in its own markup, and its stylesheets are on a CDN host the research browser does not
   ask; whether to ask that host, or a brand page Massey publishes, is the maintainer's. The accent
   and tones are the project's own, taken from no school.
4. The phone's top bar: "Massey World Model" reached 7 px past a 390 px screen. Since #114 a name
   longer than 17 characters is drawn at 14.5 px on phones and 13 px under 384 px, whole; DESIGN.md,
   section 6, asks such a name for a shorter form there, so the maintainer may prefer one.
5. Done on 2026-10-28: the Manawatū, Auckland and Wellington campuses are on the site, from one
   Overpass area each, which the maintainer let the loop fetch (`docs/schools/massey.md`, "On the
   site").

## Done (with evidence)

As recorded on 2026-10-13. The counts below are of that day; today's are in the README and in
`public/data/uoa/meta.json`, and what was done since is in `CHANGELOG.md`.

- Local toolchain: Vite 8 + TypeScript 7 + Preact 11 + three 0.186 + Vitest 5 + Playwright 1.64.
- GitHub repo `pengqianhan/campus-world-model` (public), Pages enabled with `build_type=workflow`,
  workflow `.github/workflows/deploy.yml` (typecheck, unit tests, build, deploy; separate e2e job).
- Cron job `17 */5 * * *` was created at the start of session 1 (id 233af833) and deleted at the end
  of it, after the final report. It was session-only. A new session that has real work to continue
  (for example after the user supplies API credentials) should create a fresh one as GOAL §10 says:
  a session-only `CronCreate` job every 5 hours that resumes from this file, checked with `CronList`
  on each wake, remade before its 7-day expiry, and deleted when the work is done.
- Data feasibility research finished (see "Data sources").
- Data pipeline (`npm run data:fetch`, `npm run data:build`) writes `public/data/*.json`:
  194 buildings (139 on the 3D map), 786 learning spaces with outlines, 4,668 further rooms in a lazy
  index, 251 subject codes, the 2026 academic calendar, OSM context (2,525 buildings, 4,380 road
  segments, 563 green/water areas, 1,819 trees). Schedule is empty (`available: false`).
- App: three.js orthographic campus, building cut-away with floors and rooms, illustrative interior
  for the selected room, search, Now/Preview time panel, About, status strip with campus buttons,
  URL state, English locale file, phone layout, day/night lighting, Open-Meteo temperature.
- Tests: 66 unit tests (`npm test`), 11 Playwright tests (`npm run e2e`, 10 desktop + 1 phone) green
  locally on the real GPU, on SwiftShader (`E2E_GL=swiftshader`), in CI, and against the live site.
  Screenshots were inspected by eye: the canvas shows the campus, the floor view, the pin for
  outline-less rooms, the phone layout.
- README written (running, refreshing data, adding the timetable, adding a language, licences).
- `scripts/fetch-classes.ts` written from the OpenAPI document; untested against the live API.
- Looked at the reference site with Playwright (campus + classroom screenshots, local only).

## Data sources: what exists and what does not (researched 2026-10-13)

### Timetable (class times + rooms): NOT publicly available without a login

Every route was checked once, politely, with an honest User-Agent:

| Route | Result |
| --- | --- |
| `apis.auckland.ac.nz/classes/v2/classes` (official "Classes Api V2", documented at `developer.auckland.ac.nz/prd/documentation/api-classes-v2`) | HTTP 401 `Unauthorized` without credentials. Exactly the data we need: each class has `meetingPatterns[]` with `startDate, endDate, startTime, endTime, daysOfWeek, location`. Access needs an API key requested through the internal Athena tool and approved by the owning team; the Developer Portal's self-service OAuth credentials do not work (see "Tried and did not work"). |
| `api.auckland.ac.nz/service/classes/v1/classes` (legacy API older student projects used) | TCP connection reset after the request, for curl, for WebFetch and for a real headless Chromium. Closed to the outside. |
| `www.student.guest.auckland.ac.nz` (guest "browse course catalogue", still linked from auckland.ac.nz) | Whole host 302-redirects to an AskAuckland article that says "This answer is no longer available". Retired. |
| `www.student.auckland.ac.nz` (Student Services Online) | Redirects to the SSO login. |
| `courseoutline.auckland.ac.nz` | Redirects to the SSO login. |
| `study.auckland.ac.nz` (Curriculum Catalogue, Oracle APEX) | Public. Has course code, title, points, prescription, campus and terms offered. **No class times or rooms.** |

**Decision:** follow GOAL §12. Ship with real buildings/rooms and no fabricated classes; the whole
timetable pipeline and UI exist and are tested with a fixture, so they light up the moment a real
snapshot is supplied. See "Needs the user".

Do not retry the dead routes; do not try to get around the reset/401 (they are deliberate).

### Buildings, floors, rooms: official public campus map

`maps.auckland.ac.nz` is a public MapsIndoors app (solution id `auckland`). The same anonymous JSON
requests the page makes give venues (8 campuses), buildings (209, with per-floor outlines) and
locations (26,521 rooms with `externalId` = room code, floor, type, polygon).
Snapshot: `data/raw/mapsindoors/*.json` (gitignored; URL/date/sha256 in `data/sources.json`).

**Decisions:**
- Name and make selectable only the learning-space types (lecture theatres, teaching spaces,
  computer labs, laboratories, study spaces, library, student hubs). Other searchable rooms go into
  `rooms-index.json` as code + floor + one point. For another school, the named types are the ones
  its own source calls teaching or study spaces, listed in its descriptor: for Victoria the five
  classes of the ITS room report (FFTS, STR, CETS, LT, FLS); for Canterbury the room labels that its
  map lists under 'Lecture theatres' and 'Teaching rooms', less the 27 whose own type or label says
  office, reception, research lab, lab store or staff workshop, which are left out with the meeting
  rooms (41 points), and less the three 'Education Childcare' rooms in the Ilam Early Learning
  Centre, which stay blank; the five rooms of '47 Creyke Road Meeting rooms' wait until it is known
  whether they are in the postgraduate village (uc.md). Other rooms typed 'Workshop' are teaching
  rooms and stay named.
- Floor plans, since 2026-10-13 (the user chose this after comparing with the Tsinghua map, whose
  floors look complete): every other polygon on a floor of an on-map building is published as a bare
  shape in `public/data/uoa/plans/<building>.json`, with no code or name, and cannot be selected.
  That includes 2,086 rooms the source hides from its search (`status != 3`, mostly offices):
  drawn, never named. Left out, with `noPlan` on the floor and a note on screen: every floor holding
  student accommodation (139 floors) and the four childcare centres (255, 410, 511 and 841; matched by
  name, the source has no room type for them). Also left out: single parking bays, the source's
  "Void 2.0 test" records, shapes under 2 m², and three shapes that lie over a named room. On
  2026-10-13, 14,508 shapes on 490 floors of 108 buildings, 1,027 KB in all, loaded one building at
  a time; 14,840 since every campus was added and 841's floor was left blank (README). The codes of
  the unnamed rooms on those floors are left out of the search too (since 2026-10-23).
- Space types on the floor plans, since 2026-10-14 (the user chose this after asking why floors 6 to
  11 of building 405, all offices and research labs, showed only grey shapes): each shape carries
  the source's own type text, sorted by `SPACE_KINDS` in `scripts/schools/uoa/mapsindoors.ts` into seven groups that
  tint its floor (office 3,332, other lab 790, toilet or shower 1,155, stairs or lift 1,791,
  service or amenity 262, learning space not listed 7, other area 7,171). Pointing at a shape, or
  tapping it, shows the group and the type in the source's words; the legend lists the groups on
  the open floor. Still no code or name, still nothing to select. "Other area" is what the source
  calls "Non Usable Area", "Ancillary Area", "Nonasgn Rentable", "Unclassified Facilities" and
  "General Facility": it does not say what those hold, so neither does the site.
- Signs and pinned outlines, since 2026-10-15 (the user asked for every remaining item that has a
  public source): stairs, lifts, toilets, accessible toilets and showers carry a sign on the floor
  plan (`SPACE_ICONS` in `scripts/schools/uoa/mapsindoors.ts`; every "Accessible" shape in the snapshot is named as a
  toilet). Signs give way to room labels and cannot be clicked. A room found by its code in the
  source's search is pinned, and the shape it stands on is outlined and tinted, with its type on
  the room card. Only searchable rooms are in that index, so no hidden room gets a code this way.
- Room codes are `<building>-<room>`; the true floor comes from the map. Inference from the room
  number (agrees with the map for >85% of rooms, see `tests/roomcode.test.ts`) is only the fallback
  for unknown codes and is labelled "inferred" in the UI. For a school in the Rooms by code form,
  the floor comes only from the room number by the school's own published rule, or from a level
  heading in the source. A floor from the room number is labelled 'inferred from the room number,
  by <school>'s rule' on screen; a floor from a level heading is labelled 'inferred from a level
  heading in <source>: "<heading>"'. A code that the rule cannot read keeps no floor.
- Building height = (levels at or above index 0) × 3.6 m. Not surveyed; said so in About. A
  school's building from OpenStreetMap takes its `height` tag; else its `building:levels` × 3.6 m,
  the storey the windows are drawn at (`campus.floorHeight`), so that it shows as many storeys as it
  has levels; else 6.5 m, or 10 m over 900 m², the defaults of the surrounding buildings
  (`buildContext` in `scripts/lib/context.ts`). `heightSource` says which, and the building card
  says so.
- Building shape in the campus view, since 2026-10-13: the floors at or above entry level are
  stacked, each with the campus map's outline for that floor (`src/shared/massing.ts`), where it
  used to be the footprint raised to the full height. 91 of the 139 buildings on the map get more
  than one block. A mezzanine does not cut the storey it sits in. Windows are one pane per 3.2 m
  bay and storey, drawn by rule (`WINDOW_BAY` in `CampusScene.ts`); About says so.
- Nine floors in the 2026-10-13 snapshot carry the outline of a different building (floor 1 of 114
  has a basement 300 m away; the others are 301 B, 310 B1, 502 1, 507 -1, 901 4, 902 3 and two
  off the map). A floor outline with under 20% of its area over its own building's footprint is
  replaced by the footprint and marked `outlineFrom: "footprint"`; the building bar says so. Real
  outlines never score under 45%.

### Other sources

- Academic calendar: hand-transcribed into `data/uoa/academic-calendar.json` from the official 2026
  key-dates PDF (snapshot `data/raw/uoa-calendar/2026-key-dates.pdf`). 2027 only had start dates.
- Subject list: parsed from the Calendar's "course codes by faculty" page (251 subjects).
- Campuses away from the centre, since 2026-10-15 (the user asked for every remaining item that has
  a public source): `scripts/lib/areas.ts` lists the areas the map draws, the central one and one
  box with 400 m of margin round each of Tai Tokerau, Ardmore, Leigh, Waiheke, Tai Tonga and
  building 581 (18 Carrick Place, Grafton Campus, 3 km from the rest). Each has its own Overpass
  snapshot (`data/raw/osm/context-<area>.json`, committed) and its own `context/<area>.json`
  (6-152 KB), loaded when a campus or building in it is shown. All 194 buildings and all eight
  campuses are on the map; remote campuses are chosen from "Other campuses…" in the status strip,
  and the camera jumps rather than flies between areas. The ground and the shadow map follow the
  campus shown. One flat projection about the City Campus is kept for every area: at Tai Tokerau
  (125 km north) shapes are about 1.4% too narrow east to west, which About says. The sea is not
  drawn: OpenStreetMap's coastline is a line, and turning it into water was not attempted. The
  public Overpass instances answered 504 or nothing for most of an hour on 2026-10-15; the fetch now
  times out after 240 s (`scripts/lib/snapshot.ts`) and goes round the three instances up to three
  times, a minute apart; since 2026-10-28 one that refuses or redirects the query, or drops the
  connection (a reset, a close, a refused connection) where another instance answers after it, is
  recorded in `data/raw/overpass-closed.txt` and left alone, while a timeout or a host this machine
  could not reach is not (`scripts/lib/overpass.ts`).
- VUW's Kelburn Campus, since 2026-10-27 (the maintainer let the loop fetch it): one Overpass
  snapshot, `data/raw/osm/context-vuw-kelburn.json` (committed, ODbL; 2,073 elements), of the box
  round VUW's own 24 map points and the buildings its tag rule takes, with 150 m of margin, and the
  six terrain tiles under it. A school's own snapshot carries its id first
  (`docs/schools/DESIGN.md`, section 3).
- Context: OpenStreetMap via one Overpass query (`data/raw/osm/context.json`, committed, ODbL).
  Since 2026-10-13 the pipeline also uses what that snapshot already held and had ignored: the
  `building:part` ways (341 drawn; they replace 20 outlines and stand on 74 others) with their
  `height` and `min_height`, and `roof:shape` on 212 buildings and parts, drawn as six simplified
  shapes (`MeshBuilder.roof`). A tower mapped in parts is drawn at its full height (the Sky Tower,
  328 m); a tower that is one outline is still cut to a 24 m podium. The 45 parts inside University
  footprints are dropped: University buildings take their shape from the campus map. Since
  2026-10-27 a whole building takes its base from `min_height` or `building:min_level` (or the
  spelling `building:min_levels`) as a part does, and a bridge (`man_made=bridge`,
  `building=bridge`, or a `bridge` tag) is marked `bridge`. One whose tags give no base keeps its place in
  `context.json` and is not drawn or walked round (`drawnContext`; counted as
  `context.buildings.bridgeWithoutBase.notDrawn`, 5 in the central snapshot) rather than drawn as a
  block across the street. It keeps its place because the map gives each surrounding building a
  shade in order: removing one would change the shade of every building after it.
- Weather: Open-Meteo, fetched by the visitor's browser, on load and each half hour; optional.
  Since 2026-10-15 the same request also asks for cloud cover, precipitation and wind, and in Now
  mode (with the light left on automatic) the scene draws them: cloud greys the sky, softens the
  shadows and dims the sun, rain falls as streaks on a canvas over the map and darkens the ground
  and streets, fog hazes the distance. Preview draws a clear sky; past and future weather are not
  fetched.
- Sun: since 2026-10-15 the sun's direction is computed for the date and time shown
  (`src/shared/daylight.ts`, NOAA's solar-position equations; `tests/daylight.test.ts` checks it
  against Auckland's published sunrise and sunset), and night follows the sun's elevation, which
  replaced a sunrise/sunset approximation. Below 10° the sun is drawn at 10°.
- Seasons: the 21 trees OpenStreetMap tags `leaf_cycle=deciduous` (of 1,819 mapped) are kept apart
  in `context.json` and turn in April and May, stand bare from June to August and come into leaf
  in September and October. No other tree is tagged either way, so the rest stay evergreen.
- Terrain, since 2026-10-15 (the user asked for every remaining item that has a public source):
  `scripts/fetch-terrain.ts` takes the zoom-14 tiles of the AWS Open Data "Terrain Tiles" under
  every area (29 tiles, 2 MB, committed: over New Zealand they hold the LINZ 8 m DEM of 2012, CC BY
  3.0 NZ). Zoom 15 adds nothing there (within 0.1 m); zoom 16 does not exist. `buildTerrain` in
  `scripts/lib/terrain.ts` samples them on a 10 m grid over each area plus 700 m (central) or 500 m of margin
  and writes `terrain/<area>.json` (heights in decimetres as base64 Int16; 346 KB central, 90-135 KB
  each other area), clamping single-pixel pits where land meets sea (-1,421 m in Hobson Bay) to -2 m.
  The PNGs are decoded with Node's zlib (`scripts/lib/png.ts`), so no dependency is added. In the
  scene each grid is a mesh with skirts down to a flat plane at -2.5 m; paint on the ground (parks,
  streets, rails) is split to 10 m and laid over it, lifted 15 cm and pulled forward in depth layer
  by layer; trees stand on it; every building stands at the ground under its middle, never more
  than 4 m above its lowest corner, with a footing below that (`Terrain.footing`). Surrounding
  buildings sink to their footprints where they stand in building view; trees go at half way.
  Checked against the source: Symonds Street 41 m, Albert Park 41 m, Grafton Gully 19-22 m, lower
  Queen Street 9 m (the smooth contour model puts a ramp over reclaimed land), Mt Eden 188 m against
  196 m. The 1 m LiDAR DEM is also open (AWS `nz-elevation`, LINZ, CC BY 4.0) but as LERC-compressed
  Cloud Optimised GeoTIFFs, which would need a new dependency (a gate).
- Course catalogue: built and held back (the user, 2026-10-15). The Curriculum Catalogue
  (`study.auckland.ac.nz`, Oracle APEX, public, no sign-in) gives all 6,982 courses of 2026 with
  their terms and campuses in 29 requests inside one session, and no class times or rooms. Pull
  request #24 holds the fetch script, `courses.json` and its search. The user keeps it out of `main`
  until the Classes API key arrives, so that what each source supplies is settled once with both
  in hand: the timetable should bring the courses that have classes in the terms fetched, and the
  catalogue the rest (other terms, theses, research and online courses). The porting skill's text
  about it is in commit `0efea52`, on the closed pull request #26.
  The research for it, by a sub-agent on 2026-10-15, let a headless browser send up to six
  requests in one second to `study.auckland.ac.nz` and about 22 to third-party analytics before it
  blocked them. Exploration of a site goes through the same pacing as fetching (RECON.md).
- Landmarks, since 2026-10-21 (pull requests #63 and #64): buildings drawn in three.js from code,
  in `landmarks/` (`landmarks/README.md`). The site draws the Clock Tower in place of the blocks of
  105 and 105S since pull request #66 (`src/app/landmarks.ts`). Three sources (the user, 2026-10-21):
  - Sizes: the Auckland Part 1 LiDAR point cloud (2024), tiles `CL2_BA32_2024_1000_*`, from
    OpenTopography's public bucket (its "Auckland Part 1, New Zealand 2024", `NZ24_Auckland`,
    doi:10.5069/G9HH6H8T). No sign-in. Captured by Woolpert for Regional Software Holdings
    Limited; sourced from LINZ and licensed by Regional Software Holdings Limited for re-use under
    CC BY 4.0. The tiles stay local. The sizes measured from them are committed (the config's
    `frame.expected`, `parts/common.js`), and the site credits them in About.
  - Check figure: Auckland Central 0.06 m urban aerial photos (2023), no sign-in; sourced from LINZ
    and licensed by Auckland Council for re-use under CC BY 4.0. Not published.
  - Both licensors are as LINZ's page on attributing elevation and aerial imagery data names them.
    That page answered 403 to the research browser; the user sent a screenshot of it and asked for
    it to be read in their own Chrome on 2026-10-21, which showed it and the dataset's
    OpenTopography page.
  - References: Street View, through Google's Map Tiles API with the user's key. Renders are
    compared with it. It is never published, traced or sampled, and it stays local. Anyone can see
    the same views in Google Maps without signing in. Google Maps Platform Terms 3.2.3(c):
    "Customer will not create content based on Google Maps Content." The user chose on 2026-10-21
    to keep Street View as the references.

## Decisions (and why) — do not re-litigate without new information

- **One source for a University building (the user, 2026-10-13; amended 2026-10-21).** Its data
  (outline, floors, rooms) comes from the campus map alone. OpenStreetMap's copy stays dropped,
  although it tags a height on 9 of these buildings and maps the Clock Tower in 13 parts with a dome
  and pinnacles: the two sources disagree on height (building 405 is tagged 50 m and stands 32 m
  here from its floors), and mixing them would leave some buildings surveyed and their neighbours
  estimated. Reopen only if the user asks.
  - **Landmarks (the user, 2026-10-21).** A building that has a landmark (`landmarks/<name>/`,
    sized by the LINZ LiDAR, placed by its `placement.json`) is drawn by its landmark in place of
    its block, in the walker views and in the map view. The block stays: a click finds it, and it
    opens on its floors. Some buildings are then surveyed and their neighbours estimated, which
    this decision had avoided: About and the building card say which buildings are landmarks, and
    that the heights of the others are estimated from their floors.
  - **Measured massings (the user, 2026-10-22).** A plain building may be drawn by a measured massing
    (`landmarks/MASSING.md`): blocks and roofs at the heights the LiDAR measures, made by a
    program, with walls, storeys and windows by the street look's rules. It stands in place of its
    block as a landmark does, and only where the LiDAR covers it and the top-view check passes;
    elsewhere the block stays. About and the building card say which buildings are measured
    massings.
  - **On the map, a light form.** It takes the map's palette, hover and night, has no textures,
    and loads only when the camera comes near. Why: the full Clock Tower in the map view costs every
    visitor (measured 2026-10-21 on preview builds of 5435a91, 1440×900, an NVIDIA Quadro P600):
    textures of 64 MB made in 1.0 s on the main thread (5.2 s with the processor slowed four
    times, as on a phone), the page usable 1.3 s later (6.8 s slowed), and frames 24 to 42% slower
    on SwiftShader. "Only the walker views change" (the street look) does not hold for these
    buildings.
  - **A school whose campus map cannot be used.** Its buildings come from OpenStreetMap alone,
    picked by a rule on their tags in its descriptor (for AUT, its `operator` and `ref` tags). The
    building card names the source and says how the height was found. Floors and rooms stay absent
    until a usable indoor source exists.
  - **A school with a room list and no outlines.** Its buildings, their outlines and their heights
    come from OpenStreetMap, as for a school whose campus map cannot be used. The school's own
    sources give the names and the rooms. A building code or name joins an OpenStreetMap building
    only where the school's own map point stands inside that footprint, or where the OpenStreetMap
    building carries the code as its `ref`. A room joins a building by the building part of its
    code, or, where the source lists rooms under a map point (Canterbury), through that point. A
    teaching or study room whose code names no building the source lists (for Victoria, up to 13
    of the 186, whose prefix "Locate a room" does not list) goes to the room exclusions with that
    reason; a room of any other type is left out before this step, so its code is never published.
    A room whose building has no footprint is located to its campus and says so. The building
    stands as one block at its OpenStreetMap height, and no floor is drawn. The building card lists
    the rooms by floor, and each floor says where it came from: "inferred from the room number, by
    <school>'s rule", or "inferred from a level heading in <source>: '<heading>'". A room whose
    floor cannot be read is listed under "floor not known". Only the room types that the school's
    source calls teaching or study spaces are named; every other room is left out, with no code and
    no name. Class times located only to a campus (Victoria's lecture times) appear in search with
    their campus and "room needs permission", and never on the map.
- **A pull request says how it was made (the user, 2026-10-15).** The model as the tool names it,
  the harness with its version and the thinking effort, in "How it was made" on the pull-request
  form, which CI checks is filled in (`scripts/check-pr-form.ts`, `.github/workflows/pr-form.yml`;
  `docs/standards.md`, check 7). Why: to compare later which models and settings make good changes,
  to know how closely to review one, and so that anyone reading the code can see how it was made.
  The fields are as the contributor gives them and cannot be verified. `not known` with its reason
  is accepted; a guess is not. An agent cannot always see its own effort. Claude Code saves a level
  per model under `modelSettings` in the user settings. A top-level `effortLevel` there no longer
  applies to Opus 5.5 and later, which default to `medium` without a saved level
  (<https://code.claude.com/docs/en/model-config>). A level given with `--effort` at launch is saved
  nowhere. So the person who started the agent confirms the effort: Claude Code shows it in the
  session header and with `/effort status`. Since 2026-10-15 `how-it-was-made` is a required status
  check on `main`, beside `build` and `e2e`, for admins too. That is branch protection, a repository
  setting that does not show in the code.
- **The street look (the user, 2026-10-17, overnight).** Asked: "对于 walker 界面现在过于简陋，我想让这个界面
  能尽量接近真实世界，如果无法接近真实也增加细节，让整个画面是 3A 游戏质感", so that a walker can later tour the
  campus like a person and meet other walkers. Built in layers on the `walker-realism` branch (pull
  request #50), each by a sub-agent, reviewed by screenshot and committed by the orchestrating
  agent. What was decided, and why:
  - **Only the walker views change.** The map's palette and lighting were settled with the user on
    2026-10-14 and 15, so the map must stay bit-identical: every street material is swapped in on
    entering a walker view and the map's put back on leaving (`userData.mapMaterial`), and each layer
    was diffed against the previous commit pixel for pixel: identical through the sky, facade and
    ground layers; after the trees, two of eight map vantages differed now and then by at most 8 of
    255 on a few pixels (not visible; the cause, probably timing, was not found; see PR #50).
    Attributes the map never reads are the only cost there (about 24 MB, and `setContext` about
    70 ms slower). Since 2026-10-21 a building with a landmark is the exception: see "One source for
    a University building".
  - **By rule from the data already published; nothing placed.** Storeys, bays, wall materials,
    lit rooms, lane lines, kerbs, grass, leaves: all come from outlines, heights, classes and
    positions in `public/data/`, seeded by position so they are stable, and About says what is by
    rule. No doors, crossings, arrows, signs, lamps, benches, cars or people: none are mapped. Lamp
    posts and benches from OpenStreetMap would be a new fetch, so a gate; not asked for.
    Since 2026-10-21 one exception (the user): a landmark's building (`landmarks/<name>/model.js`),
    drawn for that building by agents from the LiDAR and compared with photographs. Its doors,
    steps and porch are part of the building. Its landscape (street, signs, lamp post, crossing,
    trees) stays in the landmark viewer: round it, the walker views keep their streets and trees by
    rule. About says which buildings are landmarks.
    Since 2026-10-22 a second exception (the user): a measured massing (`landmarks/MASSING.md`). Its
    shape and heights come from the LiDAR, by a program, and are not compared with photographs.
    Its walls, storeys, bays and windows stay by rule from `public/data/`: storeys from the
    building's published levels, spaced to the measured walls. Nothing is placed on it: no doors,
    steps, signs or street furniture. About says which buildings are measured massings.
  - **At street level the University's windows are split into lights and curtain walls get
    mullions**, within the 3.2 m x 3.6 m grid of the 2026-10-14 decision on how a University
    building looks from outside. The map is unchanged; the pull request flags this as a gate.
  - **No new dependency.** three 0.186's own output path (`outputBufferType: HalfFloatType` +
    `renderer.setEffects`, which draws straight to the screen when tone mapping is off, so the map
    is untouched) and its examples (Sky.js, GTAOPass at half resolution, UnrealBloomPass) do it all;
    EffectComposer, CSM, Water.js and screen-space reflections were judged and left out (cost, or an
    extra scene render). Textures are generated on canvases at start-up, not fetched.
  - **Tiers.** A software renderer (CI's SwiftShader), a phone (`lite`) or a frame-time governor
    gets a basic tier: the same sky and light, no effects, no environment map. The full tier caps the
    pixel ratio at 1.25; measured on the user's machine at 1800x1125, about 12-15 ms a frame on an
    NVIDIA Quadro P600 and 21-25 ms on an Intel UHD 770 (Chromium picks the NVIDIA unless told
    `--force_low_power_gpu`).
  - **Walker views keep the day palette's colours by night** and make the night with the light;
    the map's night stays in its colours.
  - Left for later, if wanted: reflections of lit windows in wet streets (needs screen-space
    reflections); neighbouring buildings in glass; a wind field from the weather; head bob and a
    vignette at the eyes; street furniture from OpenStreetMap (a gate).
- **The walker (the user, 2026-10-16), a bonus, not a base feature.** Asked for overnight: "给地图添加小人，
  并且从小人视角来逛校园... 在不违反隐私和相关规定的前提下尽量多做一些功能", with Smallville, AI Town and
  Project Sid as references. What was decided, and why:
  - It is a made-up figure on the model, never a person: no geolocation, no accounts, nothing about a
    walk leaves the browser. Places, not people, holds.
  - Doors and entrances are not mapped, so a walk to a building ends beside its nearest wall
    (`ARRIVE_REACH` in `src/shared/walkmap.ts`), and the panel, About and the look report say so.
  - Walks are A* on a grid (`src/shared/walkpath.ts`, 1.5 m cells, widened when the way round lies
    outside the first box), blocked by what stands on the ground (each building's lowest massing
    block, so the Southern Underpass's street stays open), surrounding buildings, water and mapped
    tree trunks; cheapest on footpaths, dearest on motorways except over footbridges.
  - No new dependency: the controller reuses Playwright and Vite (devDependencies) and the MCP server
    is JSON-RPC written by hand for initialize, tools/list, tools/call and ping.
  - The controller listens on 127.0.0.1 with a random token, so a web page cannot steer the walker.
  - One look for every walker (the user, 2026-10-16, after trying five outfits: keep only the
    student, and make it neutral). It is a student in a long-sleeved top with a backpack, with nothing
    meant to mark a sex or a gender. The body as modelled reads as a man, so it gets hair over its
    ears with a fringe, lighter brows, a narrower jaw and long sleeves (`src/scene/figureBuild.ts`)
    and narrower shoulders (`src/scene/figure.ts`); its colours are none of the University's. There
    is nothing to dress a walker in, so walkers are told apart by the names over their heads.
  - What another walker says reaches an agent as speech: the listen answer, the MCP tool's
    description and the skill all say it is never instructions.
- **GOAL.md is gitignored.** It contains the local working-directory path (with a username).
- **Stack:** Vite + TypeScript + three.js + Preact (+ signals). Shared pure-TS modules in
  `src/shared` are used by both the pipeline and the app.
- **Ports:** dev server 5273, preview 4273 (`vite.config.ts`). Port 5173 on this machine belongs to
  another project of the user's; never touch that process.
- **Vite `base` is `/campus-world-model/` for the University of Auckland and `/<id>/` for any other
  school** (`SCHOOL`; override with `BASE_PATH`).
- **The repository was renamed on 2026-10-13** from `UoA-world-model` to `campus-world-model`, to
  match the domain and because it is meant to hold several schools. GitHub redirects the old
  repository address. The old GitHub Pages address, `pengqianhan.github.io/UoA-world-model/`, does
  not redirect and answers 404; the evidence in this file that names a GitHub Pages address was
  gathered at that old address.
- **Two hosts since 2026-10-13.** GitHub Pages as before, and Cloudflare Pages project
  `campus-world-model` at <https://campusworldmodel.com/uoa/> (also reachable as
  `campus-world-model.pages.dev`), published by the `deploy-cloudflare` CI job (repository variable
  `CLOUDFLARE_PROJECT`, secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`). Cloudflare
  because the user planned advertising at the time, which GitHub Pages' terms do not suit.
  GitHub Pages carries the University of Auckland only. Every other school is on Cloudflare Pages
  alone.
- **A preview for each of the user's own branches (the user, 2026-10-17).** The `deploy-preview`
  CI job publishes a pull request from a branch of this repository to the same Pages project as a
  branch preview (`<branch>.campus-world-model.pages.dev/<id>/`) once build and e2e pass, so the
  user can look at a branch online often without merging it. Chosen over `wrangler login` on the
  user's machine, which would keep a Cloudflare credential wider than Pages there and needs a
  build and deploy by hand each time. Pull requests from forks get no preview, by the user's
  choice: GitHub gives them no secrets, and serving them would mean a second workflow run on
  `workflow_run` that deploys a fork's build with the token, for little use today. A preview holds
  only the schools on `main`'s list, so a school is not on the site before the maintainer has
  merged it.
- **No advertising (the user, 2026-10-14).** The plan above is dropped: the site is a
  non-commercial open-source project. The University's copyright page
  (<https://www.auckland.ac.nz/en/copyright.html>) asks for written permission before any
  commercial use of its material, so if advertising is ever wanted the University is asked first.
  Before any advertising, every hosted school whose material the site uses on non-commercial terms
  (Victoria, if it goes live) is asked too, as the University of Auckland would be.
- **One neutral address, one path per school.** The user plans to add other New Zealand universities
  and registered `campusworldmodel.com` with Cloudflare on 2026-10-13 (expires 2027-10-13,
  auto-renew off), with each school under its own path: `/uoa/` and `/aut/` now, and a school
  picker at the root (`scripts/build-root.ts`; until the second school the root redirected to
  `/uoa/`). Path names are each school's
  own short name, not its city: AUT is in Auckland too. Several schools share this repository as
  `docs/schools/DESIGN.md` sets out: one build per school (`SCHOOL`, `BASE_PATH=/<id>/`), each
  school's published data in `public/data/<id>/`, and a school picker at the root from the second
  school on. `www.campusworldmodel.com` is not set up.
- **Other worlds (the user, 2026-10-14).** The site names the Tsinghua World Model
  (`tsinghua-world-model.pages.dev`, an independent student project) as its inspiration, in About
  and in the README, and offers it on the campus view under "Other worlds". Following that link
  plays a 2.2 s flight through space, counting the great-circle distance from the City Campus,
  before the browser leaves for the other site; Escape or "Stay in Auckland" calls it off, and a
  visitor who asked for less motion gets a plain link. The other site is linked to and nothing is
  loaded from it. The list is `WORLDS` in `src/app/links.ts`; a school hosted here under its own
  path is meant to join the same row, which has not been built.
- **How a University building looks from outside (the user, 2026-10-14).** After comparing with
  the Tsinghua World Model the user asked for five changes, in this order: roofs in a colour of
  their own; floors that are alike drawn as one block; a rim and firmer edges on roofs; storeys and
  windows on the walls; fuller trees and ground. All five draw by rule from the campus-map outlines
  already in use, and none adds a data source. Floors are alike when their outlines share 95% of
  the area either covers (`STACK_OVERLAP` in `scripts/schools/uoa/mapsindoors.ts`), measured against the lowest
  floor of the run so that a slow drift up a tower still shows. The pipeline marks them
  (`Floor.stackWith`); inside a building each floor keeps its own outline. On the snapshot of
  2026-10-13 this takes the 139 buildings on the map from 471 blocks to 303. A school's building
  from OpenStreetMap is drawn by the same rules, as one block on its OpenStreetMap outline, with its
  storeys at 3.6 m.
- **All network fetching goes through `scripts/lib/snapshot.ts`** (cache-first, ≥1.1 s between
  requests, honest User-Agent). Never fetch a URL that already has a snapshot unless `--refresh`.
  Since 2026-10-21 this covers the landmark pipeline too (the user chose this over an exception in
  `AGENTS.md`): its LiDAR tiles, its aerial photos and its Street View calls are to go through
  `snapshot.ts`, by a batch entry that the Python tools call. Each is then cached in `data/raw/`,
  fetched at most once a second with the project's User-Agent, and logged in `data/sources.json`.
  None is committed: the LiDAR is too large, and Street View is Google's. The key never reaches a
  logged URL or a commit. Street View then takes about 28 minutes a building (1,526 tiles for the
  Clock Tower). Built on 2026-10-22: `scripts/landmarks/fetch.ts` (`landmarks/README.md`,
  "Fetching").
- **Labels are HTML, hit-tested by the scene** (`pointer-events: none`) so that a drag starting on a
  label still rotates the map.
- **Building view = cut-away:** floors above the selected one are hidden, floors below are a solid
  base, neighbours sink to footprints. Since 2026-10-15 (the user, after the Southern Underpass
  looked as if it stood on Symonds Street: "每次点开建筑物默认显示是0 层，因为对于人类来说一般首先到达的是0level"),
  a building opens on the floor at street level (`groundLevel` in `src/shared/massing.ts`: the lowest
  floor at or above index 0) instead of its lowest floor with learning spaces; that changed the
  opening floor of 19 buildings. That floor stands on the ground, where the campus view stands it,
  and the floors under it lie below the ground, drawn only while one of them is open. An open floor
  below the ground is drawn again over the picture with the ground over it at `GROUND_VEIL` (45%),
  so it is seen through the ground, and the floor list draws the ground as a dashed line under the
  street-level floor. Before, the stack was lifted so the lowest floor sat on the ground, and an
  underpass stood on the street it runs under. Since 2026-10-14 (the user, after comparing floors with the Tsinghua World Model): the base keeps
  the building's walls and windows, the open floor keeps its outer walls cut at the height of the
  rooms, rooms stand as walls on their outlines, and the camera frames the open floor to fill the
  screen beside the panels (`FLOOR_FILL` in `CampusScene.ts`).
- **Timetable features are tested with a fixture served only inside Playwright**
  (`e2e/helpers.ts`, courses named "TESTFIX … (not a real course)"). Nothing synthetic is ever
  written to `public/data`; `tests/search-classes-data.test.ts` asserts the published schedule is
  empty unless a real snapshot produced it.
- **Playwright on this Windows machine:** Chromium flags `--use-angle=d3d11 --enable-gpu
  --ignore-gpu-blocklist` give the real GPU; CI uses SwiftShader. `E2E_GL=swiftshader` reproduces CI.
  Since 2026-10-15 every non-Windows machine renders with SwiftShader and gets CI's timeouts and two
  workers (`playwright.config.ts`).
- **Shell quirks on the maintainer's Windows machine:** Git Bash heredocs break on non-ASCII text,
  so write source files with the Write tool; use `python -I -X utf8` for ad-hoc scripts; Python
  `\b` in a non-raw string is a backspace (it corrupted a regex once).

## Tried and did not work

- Screenshotting the reference site with SwiftShader: timed out. The real GPU works.
- `study.auckland.ac.nz` browse pages via plain HTTP: course lists are lazy-loaded, HTML has none.
- "Ghosting" neighbouring buildings (transparent) in building view: they overlapped the open floor.
  Replaced by sinking them to footprints.
- One CI run failed (commit 4d97b04) because scripts imported `./x.ts` before
  `allowImportingTsExtensions` was set. Always run `npm run typecheck && npm test` before pushing.
- The first CI e2e run failed on the phone test: the floor strip used `row-reverse` with
  `justify-content: flex-end`, which put the higher floors in overflow that cannot be scrolled to. It
  only showed up with Linux's wider fonts. Fixed (plain `row`), and the phone test now taps floor 7.
- **Self-service OAuth credentials for Classes Api V2 (2026-10-13, in the user's own signed-in
  browser, at their request).** A credential made on the portal dashboard does get a token from
  the API's `/oauth2/token` endpoint (the scope it needs is not documented). `GET
  /classes/v2/classes` with that token still answers 401 `Unauthorized`, generated by the gateway
  itself and identical to the answer for no token or a made-up one. So the token is not what that
  route checks. Not pursued further; the test credential was deleted from the dashboard afterwards.
- The OAuth route the student project `SOFTENG310-G7/degree-planner` used in 2023-24 for Course
  Catalog Api V3 (`/courses/v3/oauth2/token`) now answers 401 as well.
- **Blurring the map during the flight to another world (2026-10-14).** A CSS `filter: blur()` on
  the WebGL canvas, and a radial gradient repainted on the star canvas every frame, were fine on a
  GPU and on SwiftShader on this machine. On CI's software renderer (2 cores) a flight that had run
  for about a second left the page producing almost no frames: after it was called off, the next
  flight got 1 frame in 1.5 s, and with the departure tied to a frame it never left. Now the map is
  only scaled, the glow is CSS, the star canvas is capped at 1.5 million pixels, and a timer sends
  the browser on its way. Two things the tests learned the same day: Playwright holds back every
  locator, `evaluate` and screenshot while the page has a navigation pending, so the page reports
  what it showed from its own `beforeunload`; and reading a canvas back there (`getImageData`)
  holds the departure up when the renderer is behind.

## Needs the user

1. **A Classes API key: this is what unlocks "which class is in this room now".**
   The API takes an API key, and keys are not self-service. The portal dashboard
   (https://developer.auckland.ac.nz/prd/dashboard) points to the internal Athena tool
   (`athena.auckland.ac.nz`, Consume), whose form needs a registered University project and is
   approved by the owning team. The API document names Student Recruitment
   (`student-recruitment@list.auckland.ac.nz`) as the contact. Ask them, and say that the class
   times will be republished on a public site. With a key, follow the README section "Adding the
   class timetable" (`UOA_API_KEY`), and take up pull request #24, the course catalogue, at the same
   time (see "Other sources").
2. **Your Street View notes outside the repository (`~/.gmaps_streetview.md`).** Since the landmark
   pipeline fetches through `snapshot.ts` (2026-10-22), it runs the ledger itself: `check N` before
   a batch and `add` before each 25 tiles go out. Step 3 of those notes, which adds the
   "downloaded (billed)" count by hand (or N when that line is missing, as it is after a batch
   stops), would now count tiles twice: no hand `check` or `add` is needed. The tile cache is now
   `data/raw/landmarks/streetview/tiles/`, not a landmark's `refs/streetview/tiles/`, so the notes'
   list of places where Google's data may be kept needs it too.
3. **A `source-data` issue for 408 UniPress (measured massings, decision 10).** The 2024 LiDAR
   shows no roof on its outline in the campus map: ground is seen in 187 of its 1 m cells, under
   trees. Its block stays (`landmarks/measured/exclusions.json`); the issue asks whether the campus
   map's record (its outline or its place) is out of date.
4. **Waipapa Marae (251 to 256) and Fale Pasifika (275).** Their blocks stay in the first batch of
   measured massings (`landmarks/MASSING.md`, decision 7, kept by the campus loop's lead). Drawing
   even their massing (measured heights and roof forms in the map's own colours, never carvings,
   patterns or colours of their own) waits until you have asked the people they belong to.
5. **Where people live and childcare centres, for the measured massings (`landmarks/MASSING.md`,
   decision 6).** Draw their outside shell, with their floors blank, or keep their blocks. Until you
   decide, the generator keeps the blocks of the places where people live (123 Lodge, 436 University
   Hall Apartments, 617 7 City Road, 838 Stuart McCutcheon House by their residential floors; 434
   Waikohanga House, whose floor 2 has an Accommodation Reception on the campus map; 450 UniLodge
   Whitaker by its name) and of the childcare centres (410, 841, and 255 Te Kohanga Reo, which decision 7
   keeps too). You accepted 102 Old Government
   House's outside on 2026-10-22 (PR #75), and decision 6 says its answer applies to the landmarks
   too. Of these, 434 and 436 pass the top-view check in the first batch
   (`landmarks/measured/exclusions.json` has their numbers). Since the generator measures the
   buildings of tiers 1 and 2 as stand-ins too (2026-10-27, a gate for you), the same rule keeps the
   blocks of 440, 441, 442, 614, 616, 818, 831 and 833 by their residential floors, and by hand
   Carlaw Park's 832 and 834 to 837, which OpenStreetMap tags as dormitories run by the University though the campus map marks none of their floors residential; of these 616 55 Symonds Street (IoU 0.904, 90.8% within 0.5 m) and
   835 and 837 would pass the limits. On the Grafton campus (2026-10-28) the same rule keeps the
   blocks of 523, 644, 645 and 646 by their residential floors and of 511 Te Ako o Te Tui Early
   Childhood Centre, and by hand of Grafton Hall's 621 Grafton Hall Residences (by its name) and 643
   Grafton Hall Block A (a block of the same hall), whose floors the campus map marks unmapped; none
   of the seven would pass the limits. And one reading: the top-view check leaves the roof cells the
   generator does not draw to their height out of its share within 0.5 m, and counts those the model
   stands over as covered in its footprint IoU. Counted in the share, 409 (on the site), 240 and 305
   would fall below 90% (0.889, 0.719, 0.762); counted as LiDAR only, the footprint IoU of 435 (on the
   site), 240 and 305 would fall below 0.90 (0.873, 0.689, 0.739). Say which decision 3 means.
6. **Measured massings where two outlines overlap, and where the LiDAR sees no roof
   (`landmarks/MASSING.md`, "The third round").** 904's outline overlaps 903's by 220.4 m² and 902's
   by 71.6 m²; its layer at 16.8 m (321.0 m²: 217.1 m² in 903's outline, 71.6 m² in 902's, 32.3 m²
   in 904's alone) is the edge of their roofs, and stands above their 14.4 m blocks with a ragged
   edge. 305's layer 3 does the same over 303 (18.2 of 21.7 m²), and its layer 4 partly (28.0 of
   63.2 m²; on the site since #108). Keep such layers, keep 904's block, or have the generator leave
   a neighbour's outline out of the layers above the lowest (305 would change too). And: the
   generator now leaves out a traced piece of a layer where the LiDAR sees no roof of it at all (on
   Grafton and Newmarket; 906's lobe, which now stands at the lowest layer's 15.65 m where the LiDAR
   sees nothing over 2.4 m). Say whether to turn that rule on for the City campus too (it changes one
   number of 405's in `exclusions.json`, no data file). And a cell of an outline with no roof in the
   LiDAR still goes to its nearest layer: where that layer's piece has roof cells, the cell stands at
   its roof. 906 has 22.5 m² of such cells: 13.5 m² at the lowest layer (the lobe among them) and
   9.0 m² under its mono-pitches at 18.25 to 20.76 m, among them a strip about 1 m wide along its
   north-west edge where the LiDAR has no point of classes 2 to 6. The City's massings do the same since
   #79 and #108 (305: 10.0 of 28.5 m²; in all 72.25 of the fourteen's 191.0 m²; MASSING.md, "The third
   round"). Say whether such cells should stand at the lowest layer's height (or keep the block's)
   instead of their nearest layer's; that would change the City's massings.
