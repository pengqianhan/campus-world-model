# Several schools on one site: design

A design for serving several New Zealand universities from this repository, each under its own
path of `campusworldmodel.com`. It is a gate: nothing here is built until the maintainer takes the
decisions at the end. No code comes with it.

Written on 2026-10-22 against `main` at `4a797e7`, with three research reports: AUT
([aut.md](aut.md), pull request #72), Victoria University of Wellington ([vuw.md](vuw.md), #73)
and Canterbury ([uc.md](uc.md), #74). The links work once those pull requests merge.

## In short

- **One repository, one build per school.** `SCHOOL=<id>` picks the school when the site and its
  data are built, and `BASE_PATH=/<id>/` puts it under its path. The scene, the interface and the
  tests are shared. Each school brings a small descriptor, its own words, its fetch scripts and its
  published data in `public/data/<id>/`.
- **`/uoa/` does not change.** Its addresses, its data bytes and its map pixels stay the same
  through four small migration pull requests, each with a check that proves it (section 9).
- **A school shows only what its sources give.** There are three forms: *buildings*, *rooms by
  code* and *floor plans* (section 2). From the three reports, AUT and Canterbury can be shown
  today only as buildings. Victoria can be shown as rooms by code if the maintainer accepts the
  report's reading of its terms. The University of Auckland has floor plans. Every absent layer says why, in the school's own words from its report.
- **The University of Auckland's e2e job stays as it is.** It already takes up to 17 min 26 s of its
  20-minute limit. Every other school gets an e2e job of its own, run in parallel, with a
  10-minute limit (section 8).
- **The root becomes a school picker** when the second school goes live. That changes
  `cloudflare/_redirects`, which is deployment, so it is a gate of its own (section 7).
- Section 11 lists the 12 decisions the maintainer must take.

## What this design rests on

The design uses these entries of `PROGRESS.md`, "Decisions". Where it would change one, the
proposed words are given. An amendment becomes part of this gate: the maintainer applies it, or
the first migration pull request does, once approved.

| Decision in `PROGRESS.md` | How this design uses it | Proposed amendment |
| --- | --- | --- |
| "One neutral address, one path per school" | The whole design: each school under `/<id>/`, the id its own short name; a picker at the root later; today the root redirects to `/uoa/` | Replace "Holding several schools in this one repository is a refactor that has not started." with "Several schools share this repository as `docs/schools/DESIGN.md` sets out: one build per school (`SCHOOL`, `BASE_PATH=/<id>/`), each school's published data in `public/data/<id>/`, and a school picker at the root from the second school on." |
| "Two hosts since 2026-10-13" | GitHub Pages keeps the University of Auckland at `/campus-world-model/`, built as today. Cloudflare Pages carries every school | Add: "GitHub Pages carries the University of Auckland only. Every other school is on Cloudflare Pages alone." |
| "A preview for each of the user's own branches" | A branch preview holds every school: `<branch>.campus-world-model.pages.dev/<id>/` | Add "for every school" after "branch preview" |
| "One source for a University building" | Each school's buildings have one source. For the University of Auckland that stays its campus map | Add a sub-entry: "**A school whose campus map cannot be used.** Its buildings come from OpenStreetMap alone, picked by a rule on their tags in its descriptor (for AUT, its `operator` and `ref` tags). The building card names the source and says how the height was found. Floors and rooms stay absent until a usable indoor source exists." |
| "Building height = (levels at or above index 0) × 3.6 m" (under "Buildings, floors, rooms") | Unchanged for a building from a campus map | Add: "A building from OpenStreetMap takes its `height` tag, else `building:levels` × 3.3 m + 1 m, else 6.5 m (10 m over 900 m²), as the surrounding buildings do (`buildContext` in `scripts/build-data.ts`). `heightSource` says which, and the building card says so." |
| "No advertising" | AUT's, Victoria's and Canterbury's terms all turn on non-commercial use; the reports' verdicts hold only while the site has no advertising | none |
| "Vite `base` is `/campus-world-model/`" | The default build (`SCHOOL=uoa`, no `BASE_PATH`) stays exactly this | none |
| "All network fetching goes through `scripts/lib/snapshot.ts`" | Every school's fetch scripts use it. A raw snapshot two schools share is fetched once | none |
| "The street look": "Only the walker views change" | The map of `/uoa/` stays the same picture, checked by the map's pixel diff | none |
| "Other worlds" | A school hosted here is meant to join the "Other worlds" row. That stays optional (decision 12) | none |
| "Timetable features are tested with a fixture served only inside Playwright" | Each school's tests keep the rule: a fixture is never written to `public/data/` | none |
| "Stack" and "No new dependency" (in "The street look") | The design adds no package: the Vite plugin and the picker builder are a few lines of TypeScript | none |

`AGENTS.md` binds every school as it binds this one: real or absent, snapshot once, closed is a
verdict, places not people, label the precision, unofficial visibly, secrets outside.

## Measurements

Taken on 2026-10-22 on `4a797e7`. The local numbers come from a 12th Gen Intel Core i7-12700 with
Node 24.19 on Windows 11.

| What | Number | How it was measured |
| --- | --- | --- |
| `public/data/` (UoA) | 3,713,256 bytes in 177 files: `plans/` 1,068,735 bytes in 157 files, `context.json` 612,363, `campus.json` 438,391, `terrain/central.json` 345,924, the other 6 terrain and 6 context files 1.15 MB | `du -sb`, `wc -c` |
| Built site, one school | `dist/` 5,615,586 bytes in 194 files: data 3.71 MB, `assets/` 1.34 MB, `models/` 0.56 MB | `BASE_PATH=/uoa/ npx vite build`, `du -sb dist` |
| Site build | `vite build` 0.5 s; `tsc --noEmit` 1.5 s. In CI the build step takes 1 to 2 s | local `time`; CI step times |
| Data build (UoA, every file) | 2.5 s and 3.2 s in two runs | `npx tsx scripts/build-data.ts` with the snapshots on disk |
| Data build, repeated | The same snapshots give the same bytes, except `generatedAt` in `campus.json`, `meta.json` and `schedule.json` | rebuilt, then `git diff --word-diff`; restored after |
| Unit tests in CI | 242 tests in 24 files, 4.9 s | log of run 39669215740 |
| e2e step in CI | 46 tests on 2 workers with SwiftShader. Over 26 green runs from 2026-10-18 to 2026-10-22: shortest 9 min 52 s, median 15 min 12 s, 90th percentile 16 min 17 s, longest 16 min 51 s. The job adds about 40 s before the tests (`npm ci`, Playwright install 23 s, build) | `gh run list --workflow deploy.yml`, `gh run view <id> --json jobs` |
| e2e job against its limit | Longest job 17 min 26 s (run 39664951754), limit `timeout-minutes: 20`. About 42 s of one worker for each test on average (16.3 min × 2 workers ÷ 46) | as above |
| `deploy-cloudflare` job | 24 to 27 s over the last 4 runs on `main`; in the last two, the build step took 2 s and the upload 7 and 8 s | `gh run view` job and step times |
| AUT in the committed OpenStreetMap snapshot | 20 buildings tagged `operator=AUT`: 18 with `ref` (WA to WU), 3 with `building:levels`, none with `height`. Among the 20 are a ruin (WW, `building=ruins`), a hall of residence (WQ, `building=dormitory`) and a block of flats (`building=apartments`). One more AUT building, WY, has a `ref` and no `operator` | `data/raw/osm/context.json`, read with a short Node script |

Not measured: the e2e run on the maintainer's GPU, and the size of another school's data, which
waits on its snapshots.

## 1. Addresses and paths

- **The site of a school** is `https://campusworldmodel.com/<id>/`. The id is the school's own
  short name in lower case, as the decision says: `uoa`, and from the reports `aut`, `vuw` and
  `uc`.
- **The view** is the query string after the path, with the same parameters for every school:
  `building`, `floor`, `room`, `campus`, `time`, `date`, `t`, `light`, `panel`, `lang`, `walk`,
  `view` (`src/app/state.ts`). Building and room codes are each school's own, so a link keeps to
  its school.
- **Published data** is at `/<id>/data/<file>`. The app fetches `${import.meta.env.BASE_URL}data/<file>`
  (`getJson` in `src/app/data.ts`) and needs no change: each school's build carries only its own
  data. For the University of Auckland the addresses stay `/uoa/data/campus.json` and so on.
- **Scripts and styles** are at `/<id>/assets/<name>-<hash>.js`. `cloudflare/_headers` already
  caches `/:school/assets/*` for good, so it needs no change.
- **The root** `/` redirects to `/uoa/` (302) until the picker ships (section 7).
- **GitHub Pages** (`pengqianhan.github.io/campus-world-model/`) keeps the University of Auckland
  only, built with the default base as today. The `deploy` job does not change.
- **Branch previews** hold every school, at `<branch>.campus-world-model.pages.dev/<id>/`.
- An unknown path gets Cloudflare's 404. `www.campusworldmodel.com` stays not set up.

## 2. What a school's site shows

A school's site is as fine as its best usable source, and says so ("Label the precision"). The
three reports and the University of Auckland give three forms.

| Form | Indoor source | Building card and floors | Rooms | Search finds |
| --- | --- | --- | --- | --- |
| **Buildings** | none usable | Name, `ref` and height, each with its source; no floor list; one line says floors and rooms are not published and why | none | building names and refs |
| **Rooms by code** | a list of rooms with codes, without outlines | Floors from the room codes, each marked "inferred from the room number" and drawn with the building's footprint (`outlineFrom: "footprint"`); rooms listed on their floor, without a shape; rooms whose floor cannot be read stay in a list "floor not known" | teaching and study rooms, named, located to a building or to an inferred floor | room codes, buildings, course codes |
| **Floor plans** | outlines for each floor and room | As the University of Auckland today | As today | As today |

**The three schools, today and with permission** (from the reports' "What the site can do"):

| School | Campuses in 3D | Form today | What it would take to go further |
| --- | --- | --- | --- |
| AUT | City (inside the `central` area already committed), North, South (two new areas: Overpass, a gate). Millennium and Ōtautahi are not in MazeMap | **Buildings**: about 20 buildings on the City Campus, picked by a tag rule such as `operator=AUT` (the rule needs care: see "Measurements"); heights from OpenStreetMap or estimated. Ground from the LINZ 8 m DEM (City and South tiles committed, North tile to fetch) | AUT's permission gives class times with room codes (Arion), dates and course codes: rooms by code, the floor from AUT's level digit. A written agreement with MazeMap, with AUT's consent, gives floor plans |
| Victoria (VUW) | Kelburn, Pipitea, Te Aro (three new areas and new terrain tiles in Wellington) | **Rooms by code**, if the maintainer accepts the report's reading of VUW's terms ("accurately and without modifications"): building codes from "Locate a room" (48), names from VUW's map points (24 on Kelburn), the 186 rooms in the five teaching classes of the ITS room report, each to a building and, where VUW's level rule holds, an inferred floor. Course search: 3,513 course codes with lecture days and times located to the campus only | The Academic Timetable files under `/tools` (disallowed by `robots.txt`) would locate classes to a room code. The 2026 Calendar PDF under `/__data/` would give the dates. Both are the maintainer's decisions in the report |
| Canterbury (UC) | Ilam with Dovedale, the Arts Centre with Manawa, Nelson (new areas) | **Buildings**, named only where OpenStreetMap names them. Ground: LINZ 1 m DEMs exist; the AWS tiles for Christchurch were not requested yet | UC's written permission gives building names from its map points and 452 teaching-room labels (447 until 47 Creyke Road is checked), each to a building, and 12 to a floor: rooms by code. The timetable planner needs its `robots.txt` cleared too |

**A school in the Buildings form** (AUT or Canterbury today) looks like this. The map shows its
campus in 3D on the real ground, with the city round it from OpenStreetMap. Its own buildings take
the roof and wall colours that University of Auckland buildings take today, with storeys and
windows by rule, and labels from OpenStreetMap's `name` or `ref`. Clicking a building opens its
card and no floors. The status strip says "Buildings only: floors, rooms and class times are not
published for this school", and About gives one line for each absent layer from the report, for
example for AUT: "AUT's copyright page allows its material for private research and study only;
the site has asked AUT for permission." That line is written only once the maintainer has asked.
The time panel keeps Now and Preview for the sun and the light, and says that no semester dates
are shown, and why. The walker works as it does today. There are no landmarks.

**A school in the Rooms by code form** (Victoria today) adds the building view with inferred floors
and listed rooms, and search for room codes. A room shows its code, its type and capacity where
the source gives them, its building, its floor with "inferred", and no outline and no pin, since
the source gives no position.

**The data contract** (`src/shared/types.ts`) grows only by optional fields, so the University of
Auckland's files do not change:

- `Building.heightSource` gains `"osm-height"`, `"osm-levels"` and `"estimated"`; `Building.osm`
  (for example `"way/104475936"`) traces a building to its OpenStreetMap element. In the Buildings
  form `floors` is empty.
- `CampusData.listedRooms` (optional) holds rooms without a shape: code, building, floor or none,
  `floorInferred`, kind and the source's type. `Room` itself, which every room with an outline
  uses, does not change.
- `AcademicCalendar` gains `available?: false` for a school without usable dates, with `terms`
  empty.
- `Meta.layers` (optional) gives each layer's verdict (`usable`, `needs-permission`,
  `not-published`), which About and the status strip turn into the school's own words.

## 3. Published data: `public/data/<school>/`

```
public/data/
  uoa/                    today's public/data/, moved with git mv; not a byte changes
    campus.json  calendar.json  schedule.json  subjects.json  meta.json  rooms-index.json
    context.json  context/<area>.json  terrain/<area>.json  plans/<building>.json
  aut/                    the same names; files a form lacks are written empty, never left out
    campus.json           buildings from OpenStreetMap, floors []
    calendar.json         { available: false, terms: [] }
    schedule.json         available: false
    subjects.json         []
    rooms-index.json      {}
    meta.json             sources, coverage, layers
    context.json  context/north.json  context/south.json
    terrain/central.json  terrain/north.json  terrain/south.json
```

Every school has the same file names, so `src/app/data.ts` does not change. `plans/` exists only
for a school with floor plans; a building without plans never asks for one.

**How a build carries only its school's data.** Vite copies all of `public/` into `dist/`. The
design stops that for `data/` with Vite's own `build.copyPublicDir: false` and a plugin of about
30 lines in `vite.config.ts`, with no new package:

1. On `writeBundle`, copy `public/` without its `data/` folder, then `public/data/<SCHOOL>/` to
   `dist/data/`.
2. In the dev server, map a request for `<base>data/<file>` to `public/data/<SCHOOL>/<file>`.

For `SCHOOL=uoa` the result is today's `dist/`, file for file. `vite preview`, which the e2e tests
use, serves `dist/` and needs nothing more.

**Raw data stays where it is.** `data/raw/` is one store keyed by source and file
(`snapshot.ts`'s `file`), and `data/sources.json` is one record for every school. The University of
Auckland's raw paths do not move, so the maintainer's local snapshots and their records stay
valid. A new school names its sources and files with its id first (`aut-calendar/…`,
`osm/context-aut-north.json`). Two schools whose areas are the same box share one OpenStreetMap
snapshot: AUT's City Campus buildings are already in the University of Auckland's `central`
snapshot, so AUT's City Campus can be built from the committed `data/raw/osm/context.json` with no
new request. Terrain tiles
are keyed by zoom, x and y, and every school shares them.

**Hand-made inputs** move to a folder for each school: `data/uoa/academic-calendar.json` (moved,
unchanged) and later `data/<id>/academic-calendar.json`, and any list a parser needs, such as the
short venue names of Canterbury's exam timetable.

## 4. Fetching and building for each school

- **Commands.** `SCHOOL=<id> npm run data:fetch` and `SCHOOL=<id> npm run data:build`. The default
  is `uoa`, so today's commands do what they do now. `npm run data:build:all` builds every
  school in turn.
- **The descriptor** `src/schools/<id>/school.ts` is data only, read by the pipeline and the app.
  It names the school's areas (box and raw OpenStreetMap file), its origin, its campuses, its
  fetch scripts, its campus adapter and the source lines that About shows.
- **Shared fetches** run over the chosen school's areas: `scripts/fetch-osm.ts` and
  `scripts/fetch-terrain.ts` already loop over a list of areas and skip a file already on disk.
- **The school's own fetches** live in `scripts/schools/<id>/`. The University of Auckland's three
  (`fetch-mapsindoors.ts`, `fetch-calendar.ts`, `fetch-classes.ts`) move there unchanged. A new
  school's first fetch script is a gate: a new data source, or a request a host has not had before.
  Only the maintainer runs fetches, as now.
- **The build** `scripts/build-data.ts` becomes the shared driver:
  1. the school's campus adapter makes `CampusData`, the room index and the floor plans;
  2. `buildContext` (moved to `scripts/lib/context.ts`, unchanged) draws the surroundings and drops
     the OpenStreetMap copies of the school's own buildings, as it does today;
  3. `buildTerrain` (moved to `scripts/lib/terrain.ts`) writes the ground for each area;
  4. the school's calendar, subjects and timetable builders run, or the empty forms are written;
  5. `meta.json` takes the school's source lines and coverage, and every file goes to
     `public/data/<id>/`.
- **Campus adapters.** `mapsindoors` is today's `buildCampus` with its constants (`LEARNING_TYPES`,
  `INDEX_EXCLUDED_TYPES`, `PLAN_*`, `SPACE_KINDS`, `SPACE_ICONS`, `CODE_RE`, `STACK_OVERLAP`), all in
  the University of Auckland's words. `osm-buildings` is new and shared: it takes the buildings that
  match the descriptor's tag rule, gives them heights as the surroundings get them, and no floors.
  A `room-list` adapter comes with the first school in the Rooms by code form.
- **Proof for each school.** A pull request that builds a school's data gives its `coverage`
  before and after, as `docs/standards.md` check 3 asks. For the University of Auckland, a refactor
  of the build must give the same bytes except `generatedAt`, which is true of today's build.

## 5. Shared code and code for each school

The seams of `.claude/skills/campus-world-model/SEAMS.md` are where the University of Auckland is
built in. Each goes one of two ways:

| Seam (SEAMS.md) | Where it goes |
| --- | --- |
| Geography: `ORIGIN`, the areas, `CAMPUS_IDS` | the descriptor |
| Sources: fetch scripts, `Mi*` types, `buildCampus`, the `sources` list | the school's fetch scripts and campus adapter; source lines in the descriptor |
| Ground: `fetch-terrain.ts`, `scripts/lib/terrain.ts`, `buildTerrain` | shared, over the school's areas |
| Floors and floor plans: `STACK_OVERLAP`, `PLAN_*`, `SPACE_KINDS`, `SPACE_ICONS` | the campus adapter, since they are the source's words |
| Surroundings: `buildContext` | shared |
| Room codes: `src/shared/roomcode.ts`, `CODE_RE` | the descriptor holds the school's grammar; the parser is shared |
| Time zone: `src/shared/time.ts` | shared. Every university in New Zealand keeps Pacific/Auckland time, so the `auckland*` functions keep their names: they name the zone |
| Sun and weather: `LAT`, `LON` in `src/shared/daylight.ts`, `WEATHER_URL` in `src/ui/weather.ts` | the descriptor; the code is shared |
| Seasons: `deciduousColour` | shared: every school is in the southern hemisphere |
| Timetable model, calendar | shared model; terms, term codes and the calendar file for each school |
| Base path | `BASE_PATH=/<id>/`. With no `BASE_PATH` the default stays `/campus-world-model/` for `uoa`, and is `/<id>/` for any other school |
| Names and words: `index.html`, `en.json`, `REPO`, `USER_AGENT`, `CAMPUS_SPAN` | `index.html` and the locale overlay for each school; `REPO` and `USER_AGENT` shared (one project); `CAMPUS_SPAN` in the descriptor |
| Look: `src/scene/palette.ts`, `public/favicon.svg`, the accent | shared, the project's own (section 6) |
| Other worlds: `WORLDS` | shared |
| Landmarks: `landmarks/<name>/placement.json` | gains `school`; a file without it is the University of Auckland's, so the Clock Tower's does not change. `src/app/landmarks.ts` keeps the landmarks of the school being built |

**How the app gets its school.** `vite.config.ts` reads `SCHOOL` (default `uoa`) and points the
alias `@school` at `src/schools/<SCHOOL>/school.ts`. A build therefore holds one school's
descriptor and words only. `tsconfig.json` points `@school` at the University of Auckland's for
the type check, and a unit test loads every descriptor and checks its fields.

**Words.** `src/i18n/locales/en.json` stays as it is: it holds the University of Auckland's
words. A school's overlay, `src/schools/<id>/locales/en.json`, replaces the keys that name a
school, its campus map or its verdicts: 35 of today's 292 keys, among them `app.*`,
`about.unofficial`, `about.limits.*`, `attribution.short`, `room.noTimetableWhy`, `travel.leaving`
and `travel.stay`. A unit test makes every school other than `uoa` override each of these keys.
For `uoa` there is no overlay, so the dictionary is today's. `index.html` takes its title,
description and `noscript` text from the school's overlay through the same Vite plugin; for `uoa`
the built `index.html` keeps today's text.

## 6. Each school's identity

- **Name.** Each school's site is "<short name> World Model", as the University of Auckland's is
  "UoA World Model": "AUT World Model", "VUW World Model", "UC World Model" (decision 4). The name
  shares the phone's top bar with four buttons, and `e2e/mobile.spec.ts` measures the fit down to a
  360 px screen. A name longer than "UoA World Model" needs a shorter form there.
- **Unofficial notice** in the page title (`app.documentTitle` and `<title>`), the description,
  the `noscript` text, About (`about.unofficial`, with the school's full name: "not affiliated
  with, endorsed by or maintained by Auckland University of Technology"), the README and the
  picker.
- **Palette and favicon.** The project's own, the same for every school: the map palette settled
  with the user on 2026-10-14 and 15 (`src/scene/palette.ts`), the accent `#ffb454`, and
  `public/favicon.svg`. None is a university's. Before a school goes live, its pull request
  compares the accent and the roof and wall tones with the brand colours the school publishes. If
  one is close, that school gets an accent of its own, never the brand colour (decision 5).
- **About.** Sources come from the school's `meta.json`, each with link, licence line and
  snapshot date. Limits come from the overlay, one for each absent layer, with the reason from the
  report. Credits shared by every school: OpenStreetMap (ODbL) and the LINZ 8 m DEM through the AWS
  Terrain Tiles (CC BY 3.0 NZ). The Tsinghua World Model stays the inspiration.
- **Terms.** The reports quote each school's terms. AUT's copyright page allows private research
  and study and asks for permission otherwise; Victoria's allows non-commercial reproduction
  "accurately and without modifications", with acknowledgement; Canterbury's asks for written
  permission. The Buildings form takes nothing from a school, only from OpenStreetMap and LINZ.
  Every other layer waits for the maintainer's reading or the school's answer.
- **README.** One README for the project. Its opening names every school live, each with its
  unofficial line, and "Data sources and licences" gets a part for each school.
- **Handover.** `docs/schools/<id>.md` keeps each school's research. `PROGRESS.md` gains a
  "Schools" section: for each school its form, its coverage and its open "Needs the user" items.
- **The porting skill.** `.claude/skills/campus-world-model/` keeps its port into a repository of
  its own. A school added here follows its recon, pipeline, identity and acceptance steps, with this
  design in place of its step 5 (a new repository) and of its own `PROGRESS.md`. The skill gains a
  short section that says so, with the first new school.

## 7. The school picker at the root

- **What.** A static page at `/`: no WebGL and no script. For each school, its full name (and its
  name in te reo Māori where the school uses one), its city, its form in plain words ("buildings,
  floors and rooms", "buildings and room codes", "buildings only"), the date of its snapshot and a
  link to `/<id>/`. A notice: "An unofficial student project. Not affiliated with any of these
  universities." The project's palette; no logo.
- **How.** `scripts/build-root.ts` writes `site/index.html` in the deploy job from the descriptors,
  each school's `meta.json` and the `picker.*` keys of the locale files. No new package. A unit test
  checks that the page lists every school and links to its path.
- **`_redirects`.** The line `/ /uoa/ 302` comes out in the same commit that ships the picker, and
  not before. That is deployment, so it is a gate.
- **When.** With the second school (decision 6). Until then the root keeps redirecting. A visitor
  who kept the root address then gets the picker, one click from `/uoa/`.

## 8. Tests and the CI time budget

| Job | Today (measured) | With more schools |
| --- | --- | --- |
| `build` | 18 to 28 s over the last 4 runs on `main`: type check, 242 unit tests in 4.9 s, build in 1 to 2 s | Also builds every school (about 1 s each) and runs every school's unit tests. Budget: `npm test` under 30 s |
| `e2e` (University of Auckland) | 46 tests; job up to 17 min 26 s of its 20 | **Unchanged**: same name, same 46 tests, same base. `playwright.config.ts` leaves out `e2e/schools/` when `SCHOOL=uoa`. Nothing for other schools goes into this job |
| `e2e-schools` (new) | none | A matrix, one job for each other school, in parallel: build with `SCHOOL=<id>`, run `e2e/schools/common.spec.ts` and `e2e/schools/<id>/`. At most 8 tests a school: about 3 min at CI's 42 s of a worker for each test, plus about 40 s to set up. `timeout-minutes: 10` |
| `schools` (new) | none | Waits for the matrix and fails if any school failed, so one required check covers every school however many there are |
| `deploy-cloudflare`, `deploy-preview` | 24 to 27 s | Build each school in turn (about 2 s each), the picker, then one upload |
| `deploy` (GitHub Pages) | 11 to 72 s over the last 4 runs on `main` | Unchanged |

A pull request then takes as long as its slowest job, about 17 minutes, as now.

**The common school spec** proves each school's acceptance (RUNBOOK B3): the page loads at
`/<id>/`; the canvas is a real picture (`probe()` finds more than 12 colours); the main buildings
carry labels; About has the unofficial notice with the school's full name, and every source with
link and snapshot date; each absent layer says why on screen; `?lang=` falls back to English; the
phone's top bar fits at 360 px; search finds a building. A school's own specs re-point the
numbered tests that its form supports (SEAMS.md, "Tests"), keeping their numbers.

**Unit tests** for a school's data go in `tests/schools/<id>/`. The six test files that read
`public/data/` today read `public/data/uoa/`; only the path changes.

**Live check** for a school: `SCHOOL=<id> E2E_BASE_URL=https://campusworldmodel.com/<id>/ npx
playwright test`, twice after a deploy, as for `/uoa/` today.

`schools` and the matrix are new check names. Making `schools` required is a branch-protection
setting outside the repository (decision 7).

## 9. Migration, with `/uoa/` unchanged

Four pull requests, each small and each with its proof. None changes what a visitor to `/uoa/`
sees.

| Step | What changes | Proof that `/uoa/` did not change |
| --- | --- | --- |
| **M1. Data in a folder** (gate: deployment) | `git mv public/data/* public/data/uoa/`; the Vite plugin of section 3; `OUT` in `build-data.ts` becomes `public/data/<school>/`; the paths in six unit tests | `git diff -M --stat` shows only renames at 100%. `dist/` built before and after is identical, file for file (`diff -r`): the app's code does not change in this step, so the asset names do not either. The 46 e2e tests pass with no e2e file changed |
| **M2. The descriptor** | `src/schools/uoa/school.ts` holds today's constants, copied unchanged (`ORIGIN`, `LAT`, `LON`, the weather address, `CAMPUS_SPAN`, the areas, the room-code grammar); the `@school` alias; overlays and `index.html` through the plugin; landmarks filtered by school | The built `index.html` has today's text. The map's pixel diff (`.claude/skills/street-look/CHECKS.md`, "The map's pixel diff") is 0 at seven vantages, below, on the GPU and on SwiftShader, three times each. The 46 e2e tests pass unchanged |
| **M3. The build split** (needs a rebuild by the maintainer) | `buildContext` and `buildTerrain` to `scripts/lib/`; `buildCampus` to the `mapsindoors` adapter; the three fetch scripts to `scripts/schools/uoa/`; `data/academic-calendar.json` to `data/uoa/` | The maintainer rebuilds: only `generatedAt` differs, and `coverage` is the same before and after |
| **M4. CI and deploy for a list of schools** (gate: `.github/`) | The deploy jobs loop over a list that holds only `uoa`; the `e2e-schools` matrix and the `schools` job, empty until a school joins | The site on Cloudflare has the same files at `/uoa/` (compare the hash of each file before and after). The live e2e passes, run twice |

Then **B3**, one pull request for each new school: its descriptor, overlay, fetch scripts (a gate),
data, tests, and a line in the list. The picker and the `_redirects` change are a pull request of
their own, after the first new school is live.

**The seven vantages**, canvas only, 1280 × 800, with the interface and the walkers hidden:

1. the City Campus by day: `?light=day&time=preview&date=2026-03-20&t=15:00`
2. by night: `?light=night&time=preview&date=2026-03-20&t=21:00`
3. a building open on its street-level floor: `?building=303&light=day&time=preview&date=2026-03-20&t=15:00`
4. a floor below the ground: `?building=310&floor=B2&light=day&time=preview&date=2026-03-20&t=12:00`
5. Grafton: `?campus=grafton&light=day&time=preview&date=2026-03-20&t=15:00`
6. a campus in an area of its own: `?campus=leigh&light=day&time=preview&date=2026-03-20&t=15:00`
7. the map after leaving a walker view: open `?walk=1&view=follow&light=day&time=preview&date=2026-03-20&t=15:00`, then leave it

M2 commits the script that takes them, so a later change to shared map code can run it again. Two
vantages have been seen to differ now and then by at most 8 of 255 on a few pixels since the
street look's trees (issue #51); a difference that comes and goes is that issue, and a steady one
is a change.

**Not changed by the migration:** the e2e files, the URL parameters, `_headers`, `_redirects` and
the GitHub Pages copy.

## 10. Risks

1. **A refactor changes `/uoa/`.** Shared code moves in M2 and M3. Each step carries the proof in
   section 9, and M1 and M3 move code without editing it.
2. **The e2e job runs out of time.** It already uses up to 17 min 26 s of 20. A test added to it for
   another school would fail it. So no school's test goes there, and each school's job has a limit
   of its own.
3. **A change for one school changes another.** Shared code serves every school. A pull request
   that touches shared code runs every school's e2e (the matrix), and the map's pixel diff for
   `/uoa/` when it touches the scene.
4. **A shared snapshot.** AUT's City Campus and the University of Auckland share
   `data/raw/osm/context.json`. Fetching it again (`--refresh`) changes both sites: rebuild both and
   give both `coverage` blocks.
5. **Terms.** AUT and Canterbury need permission for anything of their own; Victoria allows
   non-commercial use on a condition the site meets only by the maintainer's reading; MazeMap's
   terms forbid extraction without an agreement. The Buildings form avoids all of these.
6. **Looking official.** A page listing several universities can read as a joint or official
   service. Mitigation: the picker's notice, each school's own unofficial notice, the project's
   own palette and no logo.
7. **Heights that look surveyed.** In the Buildings form 17 of the 20 City Campus buildings tagged
   `operator=AUT` have no height or levels in OpenStreetMap and stand at a default. The building
   card and About say so. Heights from the LINZ LiDAR would need a reader for LERC GeoTIFFs, a new
   dependency (a gate).
8. **A tag rule that picks the wrong buildings.** `operator=AUT` picks a ruin, a hall of residence
   and a block of flats, and misses WY, which has no `operator` tag. The first pull request for a
   school in the Buildings form lists every building its rule picks and every one it leaves out,
   for review, and keeps a rule written in the source's tags, not a list typed by hand.
9. **Contract changes reach the University of Auckland's code.** Every new field is optional, and
   `Room` does not change, so the University of Auckland's data stays as it is and its code paths
   keep their types.
10. **More for the maintainer to hold.** Each school adds snapshots that only the maintainer has,
    and rebuilds that only the maintainer runs. The loop opens pull requests and merges none.
11. **Hosting limits.** Each school adds about 200 files and a few MB to the Cloudflare
    deployment. Cloudflare Pages limits the files in a deployment and the size of a file: compare
    the figures in Cloudflare's own documents before M4.

## 11. Decisions for the maintainer

1. **The structure.** One repository with one build per school (`SCHOOL`, `BASE_PATH`), as
   sections 1 to 5 describe. The other ways were one bundle that picks the school when the page
   loads (every school's code and words in every visitor's download), and a repository for each
   school, as the `campus-world-model` skill does (no shared fixes).
2. **Moving the University of Auckland's data.** M1 moves `public/data/` to `public/data/uoa/` with
   `git mv`, so not a byte changes. `AGENTS.md` says `public/data/` is written only by
   `npm run data:build`: approve the move as a rename, or rebuild instead, which changes
   `generatedAt` in three files and so the "built" date in About.
3. **GitHub Pages.** Keep it as a copy of the University of Auckland only (proposed), or retire it.
4. **Names.** "<short name> World Model" for each school (proposed), or the project's name
   "Campus World Model" with the school's name beside it.
5. **One palette.** The project's palette and favicon for every school (proposed), with an accent
   of the school's own only where its brand colours come close.
6. **The picker.** Ship it with the second school (proposed), and take out the root's redirect in
   the same pull request.
7. **CI.** A job for each other school and a `schools` job, and `schools` as a required check on
   `main` beside `build`, `e2e` and `how-it-was-made`. The required check is a setting only the
   maintainer can change.
8. **The first new school.** Proposed: AUT's City Campus in the Buildings form, from the snapshots
   already committed: no new request and no permission needed. North and South follow once the
   maintainer approves their Overpass fetch. The other choice is Victoria in the Rooms by code
   form, which needs new fetches in Wellington and the maintainer's reading of Victoria's terms.
9. **The Buildings form.** Approve a school shown as buildings and ground only, from OpenStreetMap
   and LINZ, with the amendment to "One source for a University building" given above. Or wait for
   a school's own source before showing it at all.
10. **Heights in the Buildings form.** OpenStreetMap's tags, else a default, each labelled
    (proposed), or wait for LiDAR heights, which need a new dependency.
11. **The amendments** to `PROGRESS.md` in "What this design rests on": who applies them, and when.
12. **Other worlds.** Whether a school hosted here also joins the "Other worlds" row, with the
    flight between campuses. Not needed for the first school.

What is outside the repository stays the maintainer's: the messages to AUT, MazeMap, Victoria and
Canterbury that the reports list under "Needs the maintainer". The design does not wait for them.
Each layer joins its school's site when an answer arrives.
