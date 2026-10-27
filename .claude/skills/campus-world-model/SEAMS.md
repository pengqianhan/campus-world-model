# Seams

Reference for steps 3, 4 and 6 of [SKILL.md](SKILL.md). A **seam** is a place where Auckland is built
into this repo. `git grep -il -e auckland -e uoa -- . ':!.claude'` lists the files; this page holds
what the grep cannot tell you.

## Data seams (step 3)

**Geography.** `origin` and `areas` in the school's descriptor, `src/schools/<id>/school.ts`, which
`scripts/build-data.ts` (through `mapFrame` in `scripts/lib/map-frame.ts`) and
`scripts/lib/areas.ts` read: `central` round the main campus, and one small box (`remote`) for
each campus or outlying building away from it. Every published coordinate is metres east and north
of the origin, so put it at the centre of the main campus. `fetch-osm.ts` snapshots each area's surroundings; `build-data.ts`
writes `context.json` for the central area and `context/<area>.json` for each other one, and marks
a building or campus outside the central box with its `area`, which the app loads when that campus
or building is shown. A building in no area is published with `offMap: true`. The central box sets
how much city surrounds the main campus and the size of `context.json`: Auckland's box, 1.7 km wide
and 2.8 km tall, gives 612 KB. Budget: the whole deploy under 50 MB, the first load a few MB.
`CAMPUS_IDS` in the campus adapter names the campuses, by the source's venue names.

**Sources.** `scripts/schools/uoa/`: `fetch-mapsindoors.ts`, `fetch-calendar.ts`, `fetch-classes.ts`;
the campus adapter `mapsindoors.ts` (the `Mi*` types and `buildCampus`) and `subjects.ts`
(`buildSubjects`); `scripts/lib/classes.ts`; the `sources` list in `build-data.ts`. Write one
fetch script per usable source in `scripts/schools/<id>/` and chain them in the `data:fetch` script
of `package.json`. `LEARNING_TYPES` maps the source's room types onto `RoomKind`
and decides which rooms are named and selectable; `INDEX_EXCLUDED_TYPES` decides which stay out of
search. The `sources` list is what About shows: name, link, licence line, snapshot date. Every
request goes through `snapshot()` in `scripts/lib/snapshot.ts`, which paces, names the project and
times out after 240 s.

**Ground.** `scripts/fetch-terrain.ts` and `scripts/lib/terrain.ts` take the AWS Open Data Terrain
Tiles (terrarium PNGs, no key) under every area at zoom 14, decoded with Node's zlib
(`scripts/lib/png.ts`). The tiles are worldwide but their source differs by country: a tile's
`x-amz-meta-x-imagery-sources` header names it, and the Tilezen "joerd" attribution document gives
its licence and the credit to show. Auckland's is the LINZ 8 m DEM, CC BY 3.0 NZ, committed under
`data/raw/terrain/`; check that the new country's licence allows that too. Sample one tile at zoom
14 and 15 near the campus and keep the zoom at which the finer one adds nothing.
`buildTerrain` (`scripts/lib/terrain.ts`) writes a 10 m grid per area (`terrain/<area>.json`) and
clamps pits where land meets sea (`TERRAIN_FLOOR`); `TERRAIN_MARGIN` is how far past an area the
ground reaches. In the scene a
building stands at the ground under its middle, no more than `FOOTING` (4 m, `src/scene/terrain.ts`)
above its lowest corner, with a footing below. The credit goes in the `sources` list and in
`attribution.short` in `en.json`.

**Floors and floor plans.** Three things are built from the indoor source's outlines, and each falls
back to something plainer when the source is thinner. A building's shape in the campus view is its
floors stacked, each with its own outline (`src/shared/massing.ts`); a source with footprints only
gives boxes. Floors that are alike stand as one block: the pipeline marks a floor (`Floor.stackWith`)
whose outline shares `STACK_OVERLAP` of its area with the lowest floor of its run. That value was
read off Auckland's map, which traces the same walls again on every floor: 251 of its 472 pairs of
neighbouring floors share 99% or more. Print the same counts for the new source (`overlap` in
`src/shared/geo.ts`) and put the value in the gap between walls traced twice and real setbacks. A
floor outline that misses its own building is replaced by the footprint
(`MIN_FOOTPRINT_SHARE`): this catches a source's slips and carries over unchanged. Every space that
is not a named room becomes a shape in `public/data/uoa/plans/<building>.json`, with the source's type
for it and no code or name. Which floors stay blank is spelled in Auckland's words:
`PLAN_RESIDENTIAL_TYPES` holds the room types that mean someone lives there,
`PLAN_CHILDCARE_BUILDINGS` is a pattern on building names because the source has no type for
childcare, and `PLAN_SKIPPED_TYPES` holds shapes that are not rooms. `SPACE_KINDS` sorts the other
types into the groups that tint a shape's floor (office, other lab, toilet, stairs or lift, service);
a type it does not list is "other". `SPACE_ICONS` puts a sign on stairs, lifts, toilets and showers;
check what the new source's toilet types are named before mapping them (Auckland's "Accessible" is
always an accessible toilet, which only the names show). List the new source's room types with
their counts, and its building names, and find its words for each of the five.

**Surroundings.** `buildContext` (`scripts/lib/context.ts`) draws what the OpenStreetMap snapshot of
an area holds: building parts with their heights, six roof shapes, a tower at its full height when
it is mapped in parts, and trees, with those tagged `leaf_cycle=deciduous` kept apart for the seasons. It carries over
unchanged. A campus building has one source: where the indoor layer gives it a footprint,
OpenStreetMap's copy and its parts are dropped (`insideUni`). The public Overpass instances can
answer 504 for an hour: `fetch-osm.ts` goes round them up to three times, a minute apart, and a
snapshot already on disk is never fetched again. One that refuses or redirects the query, or drops the
connection where another instance answers after it, is recorded in `data/raw/overpass-closed.txt` and
not asked again (closed is a verdict; `scripts/lib/overpass.ts`). The sea is not drawn; OpenStreetMap's coastline is
a line, and a campus on the shore stands on land to the edge of its area.

**Room codes.** The grammar in the descriptor's `roomCode`, the parser in `src/shared/roomcode.ts`
(it takes the descriptor as its first argument), `CODE_RE` in the campus adapter, `tests/roomcode.test.ts`.
Auckland's grammar is `<building>-<room>` with the floor in the room's first character. Derive the new
grammar from real codes in the snapshot and write the tests from them. Where the indoor layer gives
true floors, measure how often inference from the code agrees and record the figure. Inference is
the fallback for codes the map does not know.

**Time zone.** `src/shared/time.ts` and everything that imports its `auckland*` functions;
`tests/time.test.ts`; `timezone` in `types.ts`. The zone name is one constant, but `aucklandInstant`
tries Auckland's two UTC offsets, 780 and 720 minutes, by number. Make it work from the new zone's
offsets, rename the functions, and rewrite the tests around the new zone's own changeover days: the
skipped hour, the repeated hour, a class on each side of the change. A zone without daylight saving
gets one test asserting the constant offset.

**Sun, weather and seasons.** `src/shared/daylight.ts` computes the sun's position from NOAA's
equations for the descriptor's `sun`, the main campus: change its two numbers. `tests/daylight.test.ts`
checks it against Auckland's own solstice noon heights and published sunrise and sunset times, and
a daylight-saving date; rewrite each from the new city's published times. The descriptor's `weather`
(`WEATHER_URL` in `src/ui/weather.ts`) carries the coordinates and the zone in its URL (Open-Meteo, worldwide, no key). The months in
`deciduousColour` in `CampusScene.ts` are the southern hemisphere's: autumn in April and May, bare
from June to August; shift them by six months in the north.

**Timetable model.** A `Session` is a weekly meeting: weekday, start and end in minutes after local
midnight, an inclusive date range. A timetable in periods and week numbers converts into it: periods
become clock times through the official period table, which is a source to snapshot, and a week list
becomes one session per unbroken run of weeks. `TermDates.kind` and the term codes are Auckland's;
rename them to the new school's terms.

**Calendar.** `data/uoa/academic-calendar.json` (`data/<id>/` for each school), read by
`src/shared/calendar.ts` for teaching weeks, breaks, exams and the default Preview date.

## Identity seams (step 4)

**Base path.** `base` in `vite.config.ts`, `baseURL` in `playwright.config.ts`. On project Pages it
is `/<repository name>/`. A wrong base works locally and returns 404 for every asset on the public
URL.

**Names and words.** `package.json` (then `npm install`, which refreshes the lock file),
`index.html` (its head and `noscript` text name `app.*` keys of `en.json`, which `vite.config.ts` fills
in), `src/i18n/locales/en.json`, `REPO` in `src/app/links.ts`, `USER_AGENT` in
`scripts/lib/snapshot.ts`. The descriptor's `campusSpan` (`CAMPUS_SPAN` in `src/ui/SceneHost.tsx`) is the camera framing in metres
for each central campus id; a campus in an area of its own is framed from its buildings. The site's name shares the phone's top bar with four buttons, and
`e2e/mobile.spec.ts` measures the fit down to a 360 px screen: a name longer than "UoA World Model"
needs a shorter form there. In `en.json`, the strings that explain an absent layer state Auckland's
verdicts:
`about.limits.*`, `about.whatNoTimetable`, `status.noTimetable`, `room.noTimetableWhy`,
`search.subjectNoTimetable`. Rewrite each from this school's recon. All interface text lives in the
locale file, and `tests/i18n.test.ts` enforces it.

**Look.** `src/scene/palette.ts`, `public/favicon.svg`, the accent colour in `src/ui/styles.css`.
Choose colours of your own, distinct from the school's brand, and keep roof, wall and ground three
tones apart (`uniRoof*`, `uni*`, `ground`): seen from above, a roof the colour of the ground is a
building that has gone. What the scene draws by rule carries over unchanged: the storey height, the
window bay and ground storey, the rim round a roof, the shape of a tree. `about.limits.*` says which
of these are drawn by rule; keep that true. The walker views' street look carries over as well;
what in it is Auckland's, and how to feed it the new school's data, is the `street-look` skill's
[LAYERS.md](../street-look/LAYERS.md), "Auckland in it" under each layer.

**Other worlds.** `WORLDS` in `src/app/links.ts` is the row of other schools' maps on the campus
view. Following one plays a flight that names the city being left (`travel.leaving`, `travel.stay`)
and counts the distance from this campus to that one, so each entry carries its campus's
coordinates. Keep the Tsinghua World Model, where the idea comes from, and add UoA World Model,
which this is a port of.

**Auckland's data.** `public/data/uoa/*`, `data/raw/osm/`, `data/raw/terrain/`, `data/sources.json` and
`docs/*.jpg` are regenerated by the pipeline and the screenshots, never edited by hand. A port in a
repository of its own holds one school and can keep the folder's name, `uoa`, which `SCHOOL`'s
default picks in `vite.config.ts` and `scripts/lib/school.ts`, the check in `scripts/build-data.ts`
asks for, and the list `.github/schools.json` names, which `.github/workflows/deploy.yml` reads.
Renaming it is a change to all four at once, to the
`uoa` that `deploy.yml`, `playwright.config.ts`, `scripts/lib/school-list.ts` and
`scripts/walker/daemon.ts` treat as the school built into `dist/`, and to the output folder and
`base` that `vite.config.ts` gives a school other than `uoa` (`dist-<id>/`, `/<id>/`).

**Credit.** `LICENSE` keeps its existing copyright line and gains yours. The site is a port of UoA
World Model, which was inspired by the Tsinghua World Model, and says so with a link to each in
three places: `README.md`, `about.inspiration` and the "Other worlds" row.

## Tests (steps 3 and 6)

An assertion that names a place or a count states a fact about Auckland. Re-point it at a place in
the new data that shows the same thing, and take a count from the new `meta.json`. Where the new
data has no such place, such as a hall of residence or a tower mapped in parts, delete the assertion
and record that under Decisions.

**Unit tests (step 3)**, beyond the room-code and time-zone files named above:

- `tests/search-classes-data.test.ts`: the names that search must find; the scale of buildings,
  rooms and plan shapes; the floors that must be blank; the areas away from the centre; and the
  ground's height at named places (a ridge, a gully, the waterfront) and under one tall building.
- `tests/daylight.test.ts`: the new city's solstice noon heights and published sunrise and sunset.
- `tests/massing.test.ts`: two buildings whose floors differ in outline, one of them a tower on a
  podium; and a tower of floors that are alike, drawn as one block.
- `tests/travel.test.ts`: the distance from this campus to each world, which no grep for a name
  finds.
- `tests/roofs.test.ts`, "published surroundings": the tallest thing in the scene, and how many
  parts and roofs OpenStreetMap holds there.

**End-to-end tests (step 6)**: `e2e/site.spec.ts`, `e2e/mobile.spec.ts`, `e2e/travel.spec.ts`,
`e2e/sky.spec.ts`, `e2e/ground.spec.ts`, the fixture in `e2e/helpers.ts`. The travel tests name the
city left and the distance the flight counts to. Substitute from the new data: a building with
several floors, a room on its entry floor and one on an upper floor, a second building for the URL
test, a second campus if there is one and a campus in an area of its own, a teaching date and a
non-teaching date from the new calendar, a course code. The tests without a number
need a floor with a floor plan, signs and a room found by its code, a floor left blank, and a floor
marked `outlineFrom`. `sky.spec.ts` needs the sun's height at the new city's solstice noons;
`ground.spec.ts` needs the local coordinates of a high and a low place. The Open-Meteo answers in
`sky.spec.ts` are fixtures, served only inside the test browser. The
fixture's courses keep the "not a real course" wording and are served only inside Playwright;
`public/data` receives only what the pipeline builds from snapshots.
