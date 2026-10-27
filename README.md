<div align="center">

# UoA World Model

An **unofficial**, student-made 3D map of University of Auckland buildings, floors and teaching rooms.

**Live site: https://campusworldmodel.com/uoa/**<br>
(also at https://pengqianhan.github.io/campus-world-model/)

Also on the site: **AUT World Model**, an **unofficial** 3D map of the buildings of Auckland
University of Technology's City, North and South campuses, at https://campusworldmodel.com/aut/; and **VUW World
Model**, an **unofficial** 3D map of the buildings of the Kelburn Campus of Te Herenga Waka—Victoria
University of Wellington, at https://campusworldmodel.com/vuw/

[![Deploy](https://github.com/pengqianhan/campus-world-model/actions/workflows/deploy.yml/badge.svg)](https://github.com/pengqianhan/campus-world-model/actions/workflows/deploy.yml)
[![Code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)

[What's new](#whats-new) · [Changelog](CHANGELOG.md) · [Run it locally](#run-it-locally) ·
[Data sources](#data-sources-and-licences) · [Contributing](CONTRIBUTING.md)

</div>

> [!NOTE]
> It is not affiliated with, endorsed by or maintained by the University of Auckland, and uses no
> University logos or branding. AUT World Model is not affiliated with, endorsed by or maintained by
> Auckland University of Technology, and uses no AUT logo; its colours are the project's own. VUW
> World Model is not affiliated with, endorsed by or maintained by Te Herenga Waka—Victoria
> University of Wellington, and uses no VUW logo; its colours are the project's own.

![The City Campus by day](docs/campus-day.jpg)

| Inside a building: floor G of the Science Centre | The same campus at night |
| --- | --- |
| ![A lecture theatre selected on a cut-away floor](docs/room.jpg) | ![The campus at night with lit windows](docs/campus-night.jpg) |

| Behind the walker on Symonds Street | Albert Park at night, through the walker's eyes |
| --- | --- |
| ![The walker from behind on a street with lane lines, kerbs, trees and buildings drawn by rule](docs/walker-street.jpg) | ![A park at night with trees, stars and the city's lit windows beyond](docs/walker-night.jpg) |

It is built to answer two questions a student actually has:

1. *Which building and floor is my room in?* Type a room code such as `303-G23`, a building name or
   number, and the camera flies to it. Click any building to step inside and browse floors and rooms.
2. *Is a class timetabled in this room right now?* The whole feature is built and tested, but the
   published site has **no class times yet**, because the University's timetable can no longer be read
   without signing in. See [Adding the class timetable](#adding-the-class-timetable). Nothing is made up
   to fill the gap.

## What's new

- **2026-10-27:** a third school, at [/vuw/](https://campusworldmodel.com/vuw/): the 52 buildings
  of VUW's Kelburn Campus from OpenStreetMap, each with its name and height and how the height was
  found; its rooms, class times, dates and course list are not shown, and the site says why.
  [campusworldmodel.com](https://campusworldmodel.com/) lists the schools on the
  site, each with its city, how much of it the site shows and the date of its campus snapshot; it
  no longer sends every visitor to /uoa/. Bridges between the surrounding buildings span the street
  at their mapped height instead of standing on it; five with no mapped height are not drawn.
  [/aut/](https://campusworldmodel.com/aut/) adds AUT's North and South campuses: 23 more buildings
  from OpenStreetMap, chosen from "Other campuses" in the campus list and labelled by their AUT
  codes. Near the Clock Tower the map draws its East Wing in detail: rock-faced stone, two gabled
  pavilions, a stair tower and a red tile roof. At /vuw/ the status strip and the time panel say
  trimester dates, not semester dates. On Eden Crescent the map draws 9 Eden Crescent in detail: a
  white four-storey building, its street end of piers, bays and bands of windows over a glazed entrance.
- **2026-10-26:** a second school, at [/aut/](https://campusworldmodel.com/aut/): the buildings of
  AUT's City Campus from OpenStreetMap, each with its code, name and height and how the height was
  found. Its floors, rooms, class times and dates wait for AUT's permission, and the site says so.
- **2026-10-25:** near Maclaurin Chapel the map draws it in detail, from code and to its measured
  sizes: in the map's colours on the map, and from a walker's height in white walls, glass, a light
  green metal roof and a slender spire. A click still opens its floors.

Everything, with its pull request, is in the [changelog](CHANGELOG.md).

<details>
<summary><strong>Contents</strong></summary>

- [What you get](#what-you-get)
- [Run it locally](#run-it-locally)
- [Walk the campus](#walk-the-campus)
- [Updating the data snapshot](#updating-the-data-snapshot)
- [Adding the class timetable](#adding-the-class-timetable)
- [Adding a language](#adding-a-language)
- [Porting to another university](#porting-to-another-university)
- [Contributing](#contributing)
- [How it is put together](#how-it-is-put-together)
- [Data sources and licences](#data-sources-and-licences)
- [Known limitations](#known-limitations)
- [Inspiration](#inspiration)
- [Star history](#star-history)

</details>

## What you get

- **A rotatable miniature of every campus on the campus map:** 139 University buildings across the
  City, Grafton and Newmarket campuses, and 55 more at Tai Tokerau, Tai Tonga, Leigh, Waiheke, Ardmore
  and one Grafton building on Carrick Place, each on a base of OpenStreetMap streets, parks, trees and
  surrounding buildings. Each University building is stacked floor by floor from the campus map, so
  its podium, tower, setbacks and courtyards show. The city around it is drawn with the parts,
  heights and roof shapes OpenStreetMap holds, from house gables to the Sky Tower.
- **A cut-away view of every building:** pick a floor, see its learning spaces (lecture theatres,
  teaching rooms, labs, studios, study spaces) drawn from the outlines on the official campus map, set
  in the rest of the floor plan: 14,840 other spaces without names, each tinted by its type on the
  campus map (office, other lab, toilet, stairs or lift, service) and showing that type when pointed
  at or tapped. Stairs, lifts and toilets carry a sign.
- **Search** over 786 learning spaces, 4,573 further rooms (located as a point), 194 buildings and 251
  subject codes. Māori names match with or without macrons (`Maori` finds `Māori`).
- **"Now"** (Auckland time, daylight saving included) **and "Preview"** (any day and time), with the
  academic calendar: teaching week, breaks, study break, exams, public holidays.
- **The sun where it stands at the time shown,** so winter shadows are long and summer ones short; in
  Now mode, the current cloud, rain and fog from Open-Meteo; deciduous trees that turn and go bare
  with the seasons.
- **A walker:** a small made-up person who walks and runs, to take round the buildings and along
  the paths, seen from above, from behind or through its eyes. Agents can steer it too (see
  [Walk the campus](#walk-the-campus)).
- **Every view is a link:** building, floor, room, time and language are all in the URL.
- **A phone layout.**
- **All interface text in one locale file,** ready for more languages.

## Run it locally

Requires Node 22.18 or newer, which runs TypeScript files directly (developed and built in CI on
Node 24).

```bash
npm ci
npm run dev        # http://localhost:5273/campus-world-model/
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests (room codes, floors, Auckland time and daylight saving, calendar, search, data checks) |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve `dist/` at http://localhost:4273/campus-world-model/ |
| `npm run e2e` | Playwright tests against the preview build: run `npm run build` first, and `npx playwright install chromium` once (on Linux, `npx playwright install --with-deps chromium`) |
| `npm run data:fetch` | Download any data snapshot that is not cached yet (maintainer; see below) |
| `npm run data:build` | Rebuild `public/data/uoa/*.json` from the cached snapshots (maintainer; see below) |

The end-to-end tests draw with WebGL. On Windows they use the real GPU; on macOS and Linux they use
the SwiftShader software renderer, as CI does, with CI's longer timeouts and two workers. That is
slower but sees what CI sees; `E2E_GL=swiftshader` does the same on Windows.

To test a deployed copy instead of a local build:

```bash
E2E_BASE_URL=https://pengqianhan.github.io/campus-world-model/ npm run e2e
```

In Windows PowerShell, set the variable first: `$env:E2E_BASE_URL = "https://…"; npm run e2e`. The
same goes for every `NAME=value command` line in this README.

The site is static. A merge into `main` runs `.github/workflows/deploy.yml`, which type-checks, runs
the unit and end-to-end tests, builds, and publishes to GitHub Pages only if the University of
Auckland's build and tests passed (the Cloudflare copy waits for every school's, below). The
Vite `base` is `/campus-world-model/`; set `BASE_PATH=/` to host at a domain root.

The schools that the site holds are listed in `.github/schools.json`; today it holds `uoa`, the
University of Auckland, and `aut`, Auckland University of Technology (see
[docs/schools/DESIGN.md](docs/schools/DESIGN.md)). The `build` job
builds the University of Auckland into `dist/`, the GitHub Pages copy, and each other school on the
list with `SCHOOL=<id>` into `dist-<id>/`. Each other school also gets an end-to-end job of its own,
`e2e, <id>`, which runs only `e2e/schools/common.spec.ts` and `e2e/schools/<id>/`
(`SCHOOL=<id> npm run e2e` does the same on your machine, after `SCHOOL=<id> npm run build`). The
`schools` check passes when each of them passed, or when the list holds no other school.

The same workflow publishes a second copy to Cloudflare Pages, with each school on the list under
its own path (`/uoa/`, `/<id>/`) and the files in `cloudflare/` at the site root. It waits for
`build`, `e2e` and `schools`, so one school that fails holds back every school's Cloudflare copy.
That job runs only when the repository variable `CLOUDFLARE_PROJECT` names a Pages project and the
secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set, so a fork deploys to GitHub
Pages alone until it has them. Only the steps that run `wrangler` get the two secrets.

The root of the Cloudflare site is the school picker, `index.html`, and an unknown path gets
`404.html` with status 404. After the schools are laid out in `site/`, `scripts/build-root.ts`
writes both: static pages with no script, which list each school on the list with its name, its
city, its form and the date of its campus snapshot, from its `meta.json` and the `picker.*` words
of `src/i18n/locales/en.json`. To make them on your machine after the same layout:
`node scripts/build-root.ts .github/schools.json site`. The root does not redirect.

A pull request from a branch of this repository also gets a preview on the same Pages project, at
`https://<branch>.<project>.pages.dev/uoa/` (the picker at `/`), once its checks pass; the pull request's "View
deployment" opens it, and each push updates it. A preview holds only the schools on `main`'s list,
built from the branch's code: a school that a branch adds is not online before the merge, and if
`main`'s list cannot be read, the preview fails. A pull request from a fork gets no preview, because
GitHub gives it no secrets.

## Walk the campus

**In the browser:** "Take a walk" in the campus panel (the button with the campus's name in the
bottom-left corner), or `?walk=1` in the address, puts a small made-up person near the Clock Tower.
W A S D or the arrow keys walk it, and Shift breaks into a run. On a phone or tablet it is steered as
in a game: a stick under the left thumb walks and turns it, and the other thumb drags the view round.
Its panel switches between the map, the view from behind it and the view through its eyes. There a
drag looks round, and a click on a building or the ground walks it there; as it walks by hand, the
view comes back round behind it. "Let it wander" sends it strolling on its own from building to
building. Every walker looks the
same: a student with nothing meant to mark a sex or a gender, who opens an umbrella when Open-Meteo
reports rain.
Behind it, the camera stops in front of a wall rather than inside it, and wherever a building or a
tree hides the walker, its shape shows through in the colour of its ring.

**With an agent:** Claude Code (or any agent that runs shell commands) steers it with
`npm run walker -- <command>`. The first command opens the map in a browser window with the walker
on it, so you can watch; `--headless` keeps it hidden.

```bash
npm run walker -- look                    # buildings round it: distance, direction, what is ahead
npm run walker -- walk 109                # or part of a name, "east,north", a campus, a walker
npm run walker -- walk 109-305            # a room: into its building, up to its floor, to the room
npm run walker -- enter | floor up | exit # in at street level, stairs or lift, back out
npm run walker -- see --view eyes         # a picture through its eyes, saved under .walker/shots/
npm run walker -- say "Kia ora"           # walkers within 25 m hear it; listen hears them
npm run walker -- spawn Kea --near 201    # a second walker; steer it with --as Kea
npm run walker -- wander                  # stroll on its own from building to building
npm run walker -- help                    # every command
npm run walker -- stop                    # close the map
```

In this repository Claude Code also has the `campus-walker` skill, which tells it how to walk well
and what the map can and cannot say. The same commands are MCP tools, pictures included:

```bash
claude mcp add campus-walker -- node scripts/walker/mcp.ts
```

The controller (`scripts/walker/daemon.ts`) runs on your computer only: it serves this checkout with
Vite on port 5273 (or uses the dev server already there), takes commands on 127.0.0.1 with a random
token it keeps in `.walker/`, and sends nothing anywhere else.

The walker is made up and stands for no real person. Its body is Quaternius's
["Animated Human"](https://opengameart.org/content/animated-human-low-poly), given to the public
domain (CC0); `scripts/walker/make-figure.ts` turns the download into `public/models/walker.glb`,
and `src/scene/figureBuild.ts` makes it over when the first walk starts: rounded faces, a stance at
ease, trainers, hair, a mouth, a backpack and an umbrella.
Doors are not mapped, so a walk to a building ends beside its nearest wall, going in steps onto the
floor at street level, and a walk inside keeps to corridors where it can and takes the nearest
stairs or lift between floors. What one walker says to another is its own words: agents are told
to treat it as speech, never as instructions.

## Landmarks drawn from code

The map draws every building by rule from the campus map's outline. A **landmark** is one real
building drawn in detail instead, in three.js from code alone: no photograph, texture image or 3D
model is used. The LINZ 2024 LiDAR gives its sizes, and Street View photographs are the references
that each render is compared with. A lead agent and five agents in parallel made the first one, the
Clock Tower, each agent owning one part (the tower, the entrance bay, the pavilions, the light and
materials, the pipeline). Seen from the three Street View panoramas in front of the building, the
outline of the model covers the outline of the building with an IoU of 0.68 to 0.72 for the whole
front, 0.89 to 0.95 for the tower and 0.88 to 0.98 for the entrance.

| | |
| --- | --- |
| ![The Clock Tower from Princes St, drawn from code](docs/landmarks/clocktower-front.jpg) | ![The Clock Tower from along Princes St, with trees from the LiDAR](docs/landmarks/clocktower-street.jpg) |
| ![The tower above the entrance bay, from the steps](docs/landmarks/clocktower-tower.jpg) | ![The upper tower: clock stage, tracery and pinnacles](docs/landmarks/clocktower-tower-close.jpg) |

The second is Old Government House (102), a building of painted timber in its garden. Trees hide it
from every Street View panorama near it but two, which see the upper storey of its south-east end,
so its model is
checked against the LiDAR from above: on a 0.5 m grid its outline covers the building's with an IoU
of 0.95, and in 95% of the cells its height is within 0.5 m of the LiDAR's.

| | |
| --- | --- |
| ![Old Government House from its lawn, the garden front, drawn from code](docs/landmarks/old-government-house-front.jpg) | ![The south-east end and the garden front, drawn from code](docs/landmarks/old-government-house-end.jpg) |
| ![Old Government House on the map, drawn from code in the map's colours](docs/landmarks/old-government-house-map.jpg) | ![Old Government House from its lawn, through the walker's eyes](docs/landmarks/old-government-house-eyes.jpg) |

The third is the General Library (109) on Alfred Street: a tower slab of ribbon windows over a podium
whose white fins stand on a brick plinth. Twelve Street View panoramas see its front on Alfred Street,
its two ends and its back wing's north-east side; the faces they do not show are drawn plain or
after the faces they do show (see Known limitations). Seen from them, the outline of the model covers the outline of the building with an IoU
of 0.80 on average over 35 views; from above, its footprint covers the LiDAR's with an IoU of 0.946, and its
highest point is 38.8 m, as the LiDAR's.

| | |
| --- | --- |
| ![The General Library from Alfred Street, drawn from code](docs/landmarks/general-library-alfred.jpg) | ![The General Library's south-east end, its entrance between grey piers, drawn from code](docs/landmarks/general-library-southeast.jpg) |
| ![The General Library on the map, drawn from code in the map's colours](docs/landmarks/general-library-map.jpg) | ![The General Library from Alfred Street, through the walker's eyes](docs/landmarks/general-library-eyes.jpg) |

The fourth is Old Choral Hall (104), at the corner of Symonds Street and Grafton Road. Every source
shows it during building works, so only its range on Symonds Street is drawn in detail: ten bays of
red brick with cream dressings between two pavilions with giant columns, as panoramas show it before
the works and after. Seen from the three panoramas of 2022-09, its outline covers the building's
with an IoU of 0.58 to 1.0. The rest of the building keeps the map's estimated block until the
works end.

| | |
| --- | --- |
| ![Old Choral Hall's range on Symonds Street, drawn from code](docs/landmarks/old-choral-hall-corner.jpg) | ![Old Choral Hall from above: the range in detail, the rest as the map's estimated block](docs/landmarks/old-choral-hall-above.jpg) |

The fifth is Maclaurin Chapel (107) on Princes Street: a white hexagonal chapel with a great window
round its street corner, a low green roof and a slender spire, and a low hall behind it. Every height
comes from the LiDAR, within 0.1 m. Five Street View panoramas see its street side, through bare
winter trees; against them the model's silhouette has a mean IoU of 0.45 over 15 views (0.55 over
the 9 views whose cameras could be corrected), and from above its outline covers the LiDAR's with an
IoU of 0.88. The small room beyond its bay, under a tree in the LiDAR and in every photograph, is
drawn plainly.

| | |
| --- | --- |
| ![Maclaurin Chapel from Princes Street, drawn from code](docs/landmarks/maclaurin-chapel-front.jpg) | ![Maclaurin Chapel and its hall from above the street, drawn from code](docs/landmarks/maclaurin-chapel-above.jpg) |
| ![Maclaurin Chapel on the map, drawn from code in the map's colours](docs/landmarks/maclaurin-chapel-map.jpg) | ![Maclaurin Chapel from the lawn by Princes Street, through the walker's eyes](docs/landmarks/maclaurin-chapel-eyes.jpg) |

The sixth is the Clock Tower East Wing (119), below the Clock Tower to the south-east: two storeys of
the same rock-faced cream stone, two gabled pavilions toward the lawn and the car park, a plain stair
tower rising between them, segmental-headed windows upstairs and narrow ones below, and a red tile
roof. Every height comes from the LiDAR, within 0.12 m. One Street View panorama sees its whole lawn
side; against it the model's silhouette has an IoU of 0.63 to 0.96 over its three views, and from
above its outline covers the LiDAR's with an IoU of 0.83. Three more see it over the old basalt wall
of the Albert Barracks, which fills half their frames. Its back, its ends and the low link toward the
Clock Tower, which no photograph shows, are drawn plainly.

| | |
| --- | --- |
| ![The Clock Tower East Wing from the car park, drawn from code](docs/landmarks/clock-tower-east-wing-front.jpg) | ![The Clock Tower East Wing from above the lawn, drawn from code](docs/landmarks/clock-tower-east-wing-above.jpg) |
| ![The Clock Tower East Wing on the map, drawn from code in the map's colours](docs/landmarks/clock-tower-east-wing-map.jpg) | ![The Clock Tower East Wing from the lawn, through the walker's eyes](docs/landmarks/clock-tower-east-wing-eyes.jpg) |

The seventh is 9 Eden Crescent (801), a white four-storey building in the city centre. Its street
end on Eden Crescent has a white top storey, raked at its south-east corner, over three bays set back
between two white piers: bands of windows, a vehicle way, a glazed entrance and a glazed corner under a
canopy. Along its south-east side the top storey stands back behind a terrace, and plant stands on its
flat roof. Every height comes from the LiDAR, within 0.25 m. Three Street View panoramas see the
street end square on, with the neighbours either side and a 70 m tower behind it in their wide views;
counted inside the rectangle the model fills on the screen, so that the neighbours do not count,
the model's silhouette has an IoU of 0.81 to 1.00 over their nine views, though there those rectangles
hold so little sky that a plain block filling them would score as high; from above its outline covers
the LiDAR's with an IoU of 0.91. Its long sides, which stand against their neighbours, and its
far end, which no photograph shows, are drawn plainly.

| | |
| --- | --- |
| ![9 Eden Crescent from Eden Crescent, drawn from code](docs/landmarks/nine-eden-crescent-front.jpg) | ![9 Eden Crescent from above the street, drawn from code](docs/landmarks/nine-eden-crescent-above.jpg) |
| ![9 Eden Crescent on the map, drawn from code in the map's colours](docs/landmarks/nine-eden-crescent-map.jpg) | ![9 Eden Crescent from Eden Crescent, through the walker's eyes](docs/landmarks/nine-eden-crescent-eyes.jpg) |

The site draws each landmark in place of its buildings' blocks (the Clock Tower in place of buildings
105 and 105S, its south range; Old Government House in place of 102; the General Library in place
of 109; Old Choral Hall in place of 104; Maclaurin Chapel in place of 107; the Clock Tower East Wing
in place of 119; 9 Eden Crescent in place of 801) when the camera comes
near: on the map in the map's colours, and from a walker's height in its own materials on a
computer with a graphics card. The blocks still answer a click and open on their floors. The
geometry and the textures are made in a worker, the first time they are wanted, so that the page
does not stop for them ([`landmarks/README.md`](landmarks/README.md), "On the site").

| On the map, near it | Through a walker's eyes on Princes Street |
| --- | --- |
| ![The Clock Tower on the map, drawn from code in the map's colours](docs/landmarks/clocktower-map.jpg) | ![The Clock Tower from Princes Street, through the walker's eyes](docs/landmarks/clocktower-eyes.jpg) |

The pipeline and the viewer stay beside the site. To look at the model alone, serve the repository
root (`python3 -m http.server 8765 --bind 127.0.0.1`) and open
`http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=clocktower&view=orbit`.

- The model and the rules the agents worked to: [`landmarks/clocktower/`](landmarks/clocktower/).
- **Measured massings** ([`landmarks/MASSING.md`](landmarks/MASSING.md)): plain buildings that a
  program draws from the same LiDAR, with no agent and no photograph: blocks and roofs at the
  measured heights, walls, storeys and windows by the street look's rules. Five are on the site
  (`landmarks/measured/`); the other tier-3 buildings keep their blocks, each with its reason in
  `landmarks/measured/exclusions.json`.
- What every landmark shares ([`landmarks/`](landmarks/README.md)): the kit the models are built
  with, the viewer, and the pipeline (`landmarks/pipeline/run.sh <name>`: measure from the LiDAR,
  collect the Street View references, correct their cameras, render and score, and place the model
  on the campus map).
- How to make the next landmark: the `landmark-from-code` skill
  ([`.claude/skills/landmark-from-code/`](.claude/skills/landmark-from-code/SKILL.md)), with the
  method and every agent's brief.
- Street View is used through Google's Map Tiles API with a key of your own; its imagery stays on
  the computer that fetched it and is in no commit. The way of working follows
  [Athenaion](https://github.com/Leonxlnx/athenaion) by Leon Lin.

## Updating the data snapshot

Data is fetched once, cached as raw snapshots under `data/raw/`, and every later build reads the cache.
`data/sources.json` records the URL, fetch time, size and SHA-256 of each snapshot.

The campus map's snapshots are not in the repository (see below), so a fresh clone cannot run
`npm run data:build`, and a contributor does not fetch new ones: that would ask the University's map
for data the project already holds, and give a `public/data/uoa/` that differs from the published one.
The maintainer rebuilds the data. A pull request that needs a rebuild changes the pipeline's code and
says so in its first line (see [CONTRIBUTING.md](CONTRIBUTING.md)).

```bash
npm run data:fetch                                          # fetches only what is missing
npx tsx scripts/schools/uoa/fetch-mapsindoors.ts --refresh  # re-download the campus map (4 requests)
npx tsx scripts/fetch-osm.ts --refresh                      # re-download OpenStreetMap context (1 request per area, 7)
npx tsx scripts/fetch-terrain.ts --refresh                  # re-download the elevation tiles (29 at zoom 14)
npx tsx scripts/schools/uoa/fetch-calendar.ts --refresh     # re-download the Calendar pages (3 requests)
npm run data:build                                          # rebuild public/data/uoa from the snapshots
npm test                                                    # the data consistency tests must still pass
```

Then commit `public/data/uoa/`, `data/sources.json` and, if refreshed, `data/raw/osm/` and
`data/raw/terrain/`.

Rules the fetch scripts follow, and that any new one should too (`scripts/lib/snapshot.ts` enforces
them): only public pages that need no login; at most one request per second; each URL fetched once and
cached; an honest User-Agent that links to this repository. Raw snapshots of University data stay out
of the repository (`data/raw/` is gitignored); OpenStreetMap data and the LINZ elevation tiles are
openly licensed and are committed.

When a new academic year starts, `data/uoa/academic-calendar.json` has to be re-transcribed by hand from
the University Calendar's key-dates page (the source URL is in the file).

## Adding the class timetable

The official source is the University's **Classes API v2**
(<https://developer.auckland.ac.nz/prd/documentation/api-classes-v2>). It returns, for each class, the
meeting patterns with day, start and end time, date range and room: exactly what this site needs. It
requires credentials that only someone with a University account can obtain, so this step is yours:

1. Get an **API key** for "Classes Api V2". Keys are not self-service: the Developer Portal dashboard
   (<https://developer.auckland.ac.nz/prd/dashboard>) sends you to the University's internal Athena
   tool, where the team that owns the API (the API document names Student Recruitment) approves the
   request. Say in the request that the class times will be republished on a public site.
   The portal's self-service OAuth credentials do not work for this API: a token is issued, but the
   class search still answers 401 (checked 2026-10-13).
2. Fetch and rebuild, with the key in the environment (never in a file that gets committed):

   ```bash
   UOA_API_KEY=... npx tsx scripts/schools/uoa/fetch-classes.ts
   npm run data:build
   npm test && npm run build
   ```

3. Commit `public/data/uoa/` and push. Rooms then show what is timetabled at the selected time, buildings
   show a count of classes in progress, and courses become searchable.

> [!WARNING]
> `scripts/schools/uoa/fetch-classes.ts` was written from the published OpenAPI document and has **not** been run
> against the live API (the project was built without a key), so the key header (`apikey`, which the
> API document does not spell out) or the paging parameters may need a small adjustment on first use.
> The part that turns API records into the published timetable (`scripts/lib/classes.ts`) is
> unit-tested, and the interface is tested end to end with a fixture timetable that exists only inside
> the test browser.

What the pipeline keeps for every class: course code and title, class type and section, day, times,
date range, the original location text, and how precisely it could be located (room, floor or
building). Records it cannot use are kept in an `exclusions` list with the reason. Staff names are
never read or published.

## Adding a language

1. Copy `src/i18n/locales/en.json` to `src/i18n/locales/<code>.json` (for example `mi.json`,
   `zh.json`).
2. Translate the values. Keep the keys and the `{placeholders}`. Set `_meta.name` to the language's own
   name; that is what the language menu shows.
3. That is all. The file is picked up automatically, the language appears in the menu in About, and
   `?lang=<code>` selects it. Missing keys fall back to English.

Names in the data are language-keyed too (`"name": { "en": "…" }`), so a translation of a building or
term name is one more key next to `en` (the calendar already carries a few `mi` names). The pipeline
writes only `en` today because that is all the sources provide.

`npm test` checks that every key used in the code exists in `en.json` and that components contain no
hard-coded interface text.

## Porting to another university

Most of the code carries over to another campus; the data pipeline and a handful of Auckland-specific
places do not. `.claude/skills/campus-world-model/` is a [Claude Code](https://claude.com/claude-code)
skill that takes an agent through a port: recon of the new school's public data, rebuilding the
pipeline, shipping the site and verifying it live. Fork or clone this repository, open it in Claude
Code and run `/campus-world-model <university, campus>`. Beside it, `.claude/skills/street-look/`
takes the walker's street-level look to a world model that lacks it, or tunes it for another city:
`/street-look bring` or `/street-look tune`.

## Contributing

Reports and fixes are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md). The rules every change keeps
and the checks it passes are written for people and for coding agents alike, in
[AGENTS.md](AGENTS.md) and [docs/standards.md](docs/standards.md).

## How it is put together

```text
scripts/            data pipeline (Node + TypeScript, run with tsx)
  lib/snapshot.ts     polite, cache-first fetcher
  lib/context.ts      the surroundings of each area, from OpenStreetMap (every school)
  lib/terrain.ts      the ground under each area, from the elevation tiles (every school)
  fetch-osm.ts, fetch-terrain.ts   the shared fetches, over the school's areas
  schools/uoa/        the University of Auckland's own fetch scripts (campus map, Calendar,
                      classes), its campus adapter (mapsindoors.ts) and its subject list
  build-data.ts       snapshots -> public/data/uoa/*.json
  check-pr-form.ts    CI: a pull request says how it was made
  school-list.ts      CI: reads and checks .github/schools.json, the schools the site holds
  walker/             the walker's controller, CLI and MCP server (npm run walker), and the
                      script that makes its figure
data/
  sources.json        provenance of every snapshot
  uoa/academic-calendar.json   hand-transcribed key dates
  raw/                snapshots (gitignored except OpenStreetMap and the elevation tiles)
public/data/uoa/    published data: campus, context, rooms-index, subjects, calendar, schedule, meta,
                    and plans/ with one floor-plan file per building
public/models/      the walker's figure (CC0)
src/shared/         pure logic shared by pipeline and app: geometry, room codes, Auckland time,
                    calendar, schedule, search
src/scene/          three.js scene
src/app/            state, URL, data loading, translations
src/ui/             Preact components and styles
src/i18n/locales/   interface text
tests/              unit tests (Vitest)
e2e/                browser tests (Playwright), numbered after the acceptance criteria
```

Accuracy is labelled wherever it matters. A room drawn with an outline comes from the campus map. A
room shown as a pin is known to the campus map by its code; the pin stands on the shape that the
floor plan draws for it, which is outlined. The shapes carry the campus map's type for each, in its
own words, and no code or name. A room that the map does not know is placed on a floor inferred from
its number and marked as inferred. A building's shape comes from the campus map's outline of each
floor, with floors that are alike within a twentieth of their area drawn as one block; its height is
an estimate of 3.6 m a floor, and its windows and roof rims are drawn by rule.

## Data sources and licences

| Source | Used for | Terms |
| --- | --- | --- |
| [University of Auckland campus maps](https://maps.auckland.ac.nz/) (the public map, served by MapsIndoors) | Buildings, floors, room codes, room types and positions | © University of Auckland. Only derived facts are published here: learning spaces with their names and simplified outlines; other searchable rooms as a code, floor and point; every other space as a simplified outline with the map's type for it and no code or name. Floors with student accommodation, childcare centres and single parking bays are left out, and a room the map marks as not searchable is never named. |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) via the Overpass API | Surrounding buildings, streets, paths, parks, trees | © OpenStreetMap contributors, [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/). The snapshot in `data/raw/osm/` and the derived `public/data/uoa/context.json` are under the same licence. |
| [University of Auckland Calendar 2026](https://www.auckland.ac.nz/en/about-us/about-the-university/the-university/official-publications/university-calendar/current-calendar.html) | Semester dates, breaks, holidays; list of subject codes | © University of Auckland. Dates and codes are quoted as facts with a link to the source. |
| [LINZ 8 m Digital Elevation Model (2012)](https://data.linz.govt.nz/layer/51768-nz-8m-digital-elevation-model-2012/), via the [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) | The height of the ground | New Zealand terrain data © Land Information New Zealand and the New Zealand Government, [CC BY 3.0 NZ](https://creativecommons.org/licenses/by/3.0/nz/). The tiles also hold SRTM and GMTED2010 data (U.S. Geological Survey) and ETOPO1 (U.S. NOAA) at the coast. The tiles in `data/raw/terrain/` and the derived `public/data/uoa/terrain/` are under the same terms. |
| [Auckland Part 1 LiDAR point cloud (2024)](https://doi.org/10.5069/G9HH6H8T), tiles `CL2_BA32_2024_1000_*`, captured by Woolpert for Regional Software Holdings Limited and distributed by OpenTopography and LINZ | The sizes of the Clock Tower (buildings 105 and 105S), Old Government House (102), the General Library (109), the range of Old Choral Hall (104) on Symonds Street, Maclaurin Chapel (107), the Clock Tower East Wing (119) and 9 Eden Crescent (801), measured for their models in `landmarks/clocktower/`, `landmarks/old-government-house/`, `landmarks/general-library/`, `landmarks/old-choral-hall/`, `landmarks/maclaurin-chapel/`, `landmarks/clock-tower-east-wing/` and `landmarks/nine-eden-crescent/`; the heights and roofs of the measured massings, in `landmarks/measured/buildings/` | Sourced from LINZ and licensed by Regional Software Holdings Limited for re-use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) ([LINZ's attribution page](https://www.linz.govt.nz/products-services/data/licensing-and-using-data/attributing-elevation-or-aerial-imagery-data)). Only the measured sizes are published, in the landmark's config and `parts/common.js` and in the measured massings' data files; the tiles stay on the computer that fetched them. |
| Google Street View, through the Map Tiles API | Photographs the models of the Clock Tower, Old Government House, the General Library, Old Choral Hall, Maclaurin Chapel, the Clock Tower East Wing and 9 Eden Crescent were compared with while they were drawn | © Google. Used as references only: never published, traced or sampled, and kept on the computer that fetched them. |
| [Open-Meteo](https://open-meteo.com/) | Current weather in Auckland (temperature, cloud, rain, wind), fetched by the visitor's browser | [CC BY 4.0](https://open-meteo.com/en/licence) |
| ["Animated Human" by Quaternius](https://opengameart.org/content/animated-human-low-poly) | The walker's body and its idle, walk and run, in `public/models/walker.glb` | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/), public domain. Downloaded once, on 2026-10-16. |

**AUT World Model** (`/aut/`) uses four of these sources and nothing of AUT's own. OpenStreetMap
gives the buildings of AUT's City, North and South campuses, picked by their `operator` tag and
AUT's building code, with their names, codes, outlines and, where tagged, heights, and the city
round them; `public/data/aut/campus.json` is derived from the committed snapshots of its three areas (the City
Campus from the same snapshot as the University's), `context.json` from that one, and `context/north.json` and `context/south.json` from the snapshots of
those two campuses, all under the ODbL. The LINZ 8 m elevation model gives the ground (`public/data/aut/terrain/`), under CC BY 3.0
NZ. Open-Meteo gives the weather at the City Campus, and Quaternius's figure is the walker's body.
AUT's rooms, class times, semester dates and course list wait for AUT's permission, and its floor
plans for a written agreement with MazeMap: see [docs/schools/aut.md](docs/schools/aut.md).

**VUW World Model** (`/vuw/`) uses the same four sources and nothing of VUW's own. OpenStreetMap
gives the Kelburn Campus buildings, picked by their `operator` and `building=university` tags, with
their names, outlines and, where tagged, heights, and the streets round them, from its own snapshot
`data/raw/osm/context-vuw-kelburn.json`; `public/data/vuw/campus.json` and `context.json` are under
the ODbL. The LINZ 8 m elevation model gives the ground (`public/data/vuw/terrain/`), under CC BY
3.0 NZ. Open-Meteo gives the weather at the Kelburn Campus, and Quaternius's figure is the walker's
body. VUW's room list and course list wait
for the maintainer's reading of VUW's copyright terms, and its class times and key dates sit in
parts of its site that its `robots.txt` disallows: see [docs/schools/vuw.md](docs/schools/vuw.md).

Snapshot dates are shown in the site's About panel and recorded in `public/data/uoa/meta.json`,
`public/data/aut/meta.json` and `public/data/vuw/meta.json`.

The **code** is under the MIT licence (see `LICENSE`). That licence does not cover the data above;
`NOTICE` says so too, beside the licence.

If you represent the University and would like something changed or removed, please open an issue.

## Known limitations

- **No class times** until a timetable snapshot is added (see above).
- **A timetabled class is not the same as an occupied room.**
- **Building heights are estimated and windows are drawn by rule.** The ground's heights come from
  the LINZ 8 m elevation model, drawn from contours: smooth, peaks a few metres low. A building stands
  at the ground under its middle, with a footing of up to 4 m on a slope. The Clock Tower (105 and
  105S), Old Government House (102), the General Library (109), the range of Old Choral Hall
  (104) on Symonds Street, Maclaurin Chapel (107), the Clock Tower East Wing (119) and 9 Eden
  Crescent (801) are the exceptions: their models are drawn to
  sizes measured from LiDAR. The measured massings (About lists them) are measured too: their
  heights and roofs come from the LiDAR, their walls and windows are drawn by rule.
- **Only Old Choral Hall's range on Symonds Street is drawn in detail.** Every source shows the
  building during building works: the LiDAR of May 2024 has scaffold decks over its north-east
  blocks, and the newest Street View panoramas show them wrapped. Only the south-west range and its
  two pavilions are seen as they stand, before the works (2022-09) and after them (2024-10). The
  rest of the building keeps the map's estimated block (two storeys, flat-topped, plain walls) until
  the works end, so it is lower than the building is.
- **Old Government House is seen in only two photographs.** Trees hide it from the other Street View
  panoramas near it, and the two see the upper storey of its south-east end. Its sizes and roofs
  come from the LiDAR. What no photograph shows is drawn plainly or after the parts the photographs
  do show: most of the garden front (its windows repeat the two that are seen), the porch, the
  north-west wing, the backs of the main block, the north-west lobby, the low south-east range, the
  north-west balcony (like the south-east one) and the ranges round the courtyard behind.
- **The General Library is drawn plain, or after the faces they do show, where its photographs do
  not show it, and simpler than them where they do.** None of its twelve Street View panoramas shows the main block's back on the
  service lane, the low block's north-east face or either end of the back wing: the back wing's
  north-west end is drawn with the fins of its north-east face, the others plain.
  At the south-east end, the
  two-storey curtain wall over the entrance is drawn as the slab's ribbon windows, the dark stone
  cladding and the louvre of the ground floor as glazing between the grey piers, and the north-west
  end's stone panel is drawn white.
- **Maclaurin Chapel is seen from Princes Street only, through trees.** Five Street View panoramas
  see its street side; its heights come from the LiDAR. What no source shows is drawn plainly: the
  small room beyond the bay, which a tree hides in the LiDAR and in every photograph (white walls on
  the campus map's floor outline, a flat roof at the height the LiDAR finds under the tree), the
  colour of the bay's and that room's roofs (pale), and the faces away from the street (plain white
  walls). The row of skylights in the hall's far roof, which the aerial photograph shows, is not
  drawn.
- **The Clock Tower East Wing is seen whole from one place.** One Street View panorama, across the
  car park, sees its lawn side; three more see its roofline over the old basalt wall of the Albert
  Barracks. Its heights come from the LiDAR. What no photograph shows is drawn plainly: its back, its
  ends, the two blocks at the back, the low link toward the Clock Tower (under trees; a flat roof at
  the height the LiDAR finds) and the grey roofs behind the pavilions' gables (their colour from the
  aerial). The east pavilion's front, half hidden by the basalt wall, is drawn after the west
  pavilion's. The windows' glazing patterns are drawn as plain bars.
- **9 Eden Crescent is seen from its street end only.** Three Street View panoramas on Eden Crescent
  see the street end; its neighbours either side and a tall tower behind it stand in their wide views,
  so its likeness is counted inside the rectangle the model fills on the screen, which there holds so
  little sky that the number shows little. All three panoramas record their cameras about 1 m from
  where the LiDAR puts the building; they are set by hand, v8ia's from its photograph's own edges and
  mdk1's and MH15's from the model's drawn openings. Its heights come from the LiDAR. What no
  photograph shows is drawn plainly: its long sides, which stand against their neighbours, its far
  end, and the plant on its roof (grey boxes at the LiDAR's sizes). Its white cladding is drawn
  without the panels' joints.
- **Landmarks stand on the map's ground, which is not the LiDAR's.** A landmark stands at the
  map's ground under its door, and its walls go down far enough that their foot is nowhere more
  than 0.25 m above that ground (the Clock Tower's, up to 0.2 m). Under Old Government House the
  map's ground rises 2.75 m from end to end, more than the LiDAR's: its north-west end stands up to
  1.2 m too deep, and some of its ground-floor windows there are partly under the drawn ground.
- **Only learning spaces are named and can be selected.** The rest of a floor is shapes that show the
  campus map's type and nothing more; where the map's type says nothing ("Non Usable Area",
  "Nonasgn Rentable" and the like) the site says "Other area". Floors where people live and
  childcare centres are blank, and the furniture in a selected room is illustrative.
- **The campus map itself draws nothing on 98 floors of the 3D map** (most of them in halls of
  residence) and only a few spaces on 35 more. The floor list marks both and the building bar says
  so.
- **The campuses away from the centre** (Tai Tokerau, Tai Tonga, Leigh, Waiheke, Ardmore) each stand
  in a patch of surroundings a few hundred metres across, and the map jumps between them. Everything
  is drawn on one flat map centred on the City Campus, so shapes 125 km north are about 1.4% too
  narrow east to west. The sea is not drawn (OpenStreetMap's coastline is a line, not an area).
- **The walker knows no doors, gates or fences.** Its walks keep round the buildings, water and
  mapped tree trunks and to OpenStreetMap's paths and streets, and end beside a building's nearest
  wall; it passes barriers the map does not have.
- **The academic calendar covers 2026 only.**

## Inspiration

This project was inspired by the
[Tsinghua World Model](https://tsinghua-world-model.pages.dev/?campus=1&classMode=live), an
independent student project that lets you walk through Tsinghua University's campus and find
courses and classrooms in it. The idea of a campus you can step into comes from there. The code,
models and data here were made separately; nothing is copied from that site.

## Star history

<a href="https://www.star-history.com/#pengqianhan/campus-world-model&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=pengqianhan/campus-world-model&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=pengqianhan/campus-world-model&type=Date" />
    <img alt="A chart of this repository's GitHub stars over time" src="https://api.star-history.com/svg?repos=pengqianhan/campus-world-model&type=Date" />
  </picture>
</a>
