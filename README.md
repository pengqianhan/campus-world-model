<div align="center">

# UoA World Model

An **unofficial**, student-made 3D map of University of Auckland buildings, floors and teaching rooms.

**Live site: https://campusworldmodel.com/uoa/**<br>
(also at https://pengqianhan.github.io/campus-world-model/)

Also on the site: **AUT World Model**, an **unofficial** 3D map of the buildings of Auckland
University of Technology's City, North and South campuses, at https://campusworldmodel.com/aut/; **VUW World
Model**, an **unofficial** 3D map of the buildings of the Kelburn, Pipitea and Te Aro campuses of Te
Herenga Waka—Victoria University of Wellington, at https://campusworldmodel.com/vuw/; **Otago World
Model**, an **unofficial** 3D map of the buildings of the University of Otago's Dunedin and
Christchurch campuses, at https://campusworldmodel.com/otago/; **UC World Model**, an
**unofficial** 3D map of the buildings of the University of Canterbury's Ilam and Dovedale campuses
and its Arts Centre location, at https://campusworldmodel.com/uc/; **Massey World Model**, an
**unofficial** 3D map of the buildings of Massey University's Manawatū, Auckland and Wellington
campuses, at https://campusworldmodel.com/massey/; **Waikato World Model**, an **unofficial** 3D
map of the buildings of the University of Waikato's Hamilton campus, at
https://campusworldmodel.com/waikato/; and **Lincoln World Model**, an **unofficial** 3D map of the
buildings of Lincoln University's Lincoln campus, chosen by OpenStreetMap's tags, at
https://campusworldmodel.com/lincoln/

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
> University of Wellington, and uses no VUW logo; its colours are the project's own. Otago World
> Model is not affiliated with, endorsed by or maintained by the University of Otago | Ōtākou
> Whakaihu Waka, and uses no Otago logo; its colours are the project's own. UC World Model is not
> affiliated with, endorsed by or maintained by the University of Canterbury, and uses no UC logo;
> its colours are the project's own.
> Massey World Model is
> not affiliated with, endorsed by or maintained by Te Kunenga ki Pūrehuroa Massey University, and
> uses no Massey logo; its colours are the project's own. Waikato World Model is not affiliated
> with, endorsed by or maintained by The University of Waikato, and uses no Waikato logo; its
> colours are the project's own. Lincoln World Model is not affiliated with, endorsed by or
> maintained by Lincoln University, and uses no Lincoln logo; its colours are the project's own.

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

- **2026-11-10:** on the Grafton campus the map draws 2-6 Park Ave (529) in detail: a long block of four storeys with a
  balcony along each upper storey of every face, a ground storey of pale brick, a dark eave and a raised part with a red
  roof. Its sizes come from the LiDAR; it was compared with a photograph, which is not published, and its card says what
  is estimated.
- **2026-11-10:** on the Grafton campus the map draws building 505 of the M&HS Building in detail: a long block of four
  storeys in white panels over a recessed ground floor, its north face shaded by twelve bays of silver fins and louvres,
  glass at its north-east corner and a glass-roofed atrium at its west end. Its sizes come from the LiDAR; it was
  compared with a photograph, which is not published, and its card says what is estimated.
- **2026-11-10:** on the City campus the map draws the George Mason Biology Building (106) in detail: a long block of
  three storeys in cream render under a grey attic and a low hipped roof, with two wings and raised parts, and
  red-framed windows between pilasters at its south-east end on the street. Its sizes come from the LiDAR; it was
  compared with a photograph, which is not published, and its card says what is estimated.
- **2026-11-09:** on the City campus the map draws Te Pūtahi Tangata (201) in detail: a hall on the street, glass
  from the pavement to a folded roof whose plates rise and fall across its front, a taller block in pale metal at its
  north-east end, and behind them, down the slope, a long block with raised strips. Its sizes come from the LiDAR; it
  was compared with a photograph, which is not published, and its card says what is estimated.
- **2026-11-09:** on the Grafton campus the map draws building 507 of the M&HS Building in detail: along the street a
  block whose finned upper storeys stand over a glazed base, three glazed bays north of it each set back further, and
  a block behind them under flat roofs. Its sizes come from the LiDAR; it was compared with a photograph, which is not
  published, and its card says what is estimated.
- **2026-11-09:** on the Grafton campus the map draws building 502 of the M&HS Building in detail: a block of seven
  storeys in pale concrete, its north face a row of fins over grey bays, under a dark metal skirt and a low hipped
  roof, and a lower part at its west end. Its sizes come from the LiDAR; it was compared with a photograph, which is
  not published, and its card says what is estimated.
- **2026-11-09:** "Take a walk" is a button of its own beside the campus's name in the bottom-left corner, on
  every school's map, no longer a line inside the campus panel.
- **2026-11-09:** on the Newmarket campus the map draws Building 907 in detail: a hall under a shallow barrel
  vault in white metal cladding, a band of glazing at the foot of its end toward the street, and beside it an annex
  of two storeys in orange render. Its sizes come from the LiDAR; it was compared with a photograph, which is not
  published, and its card says what is estimated.
- **2026-11-09:** the map draws the Sir Owen G Glenn Building (260) in detail: a curved wing of glass, white
  spandrels and louvres, a Y of three arms round a raised plaza with a sloping canopy in its curve, a lower west
  wing and a lower building on the plaza's north-east side. Its sizes come from the LiDAR; it was compared with a
  photograph, which is not published, and its card says what is estimated.
- **2026-11-09:** on Symonds Street the map draws 49 Symonds Street (620) in detail: an office tower whose
  corners step back, in pale panels and blue glass, with a gable and a tall arched window in the middle of its
  faces, a mansard on its roof, and a podium in dark stone at its foot. Its sizes come from the LiDAR; it was
  compared with a photograph, which is not published, and its card says what is estimated.
- **2026-11-09:** beside Symonds Street the map draws Okareta (215) in detail: a villa of two storeys in warm
  yellow ochre under hipped roofs of grey iron, a verandah across the left of its front and a canted bay on the
  right, its windows arched at their heads. Its sizes come from the LiDAR; it was compared with a photograph,
  which is not published, and its card says what is estimated.
- **2026-11-09:** on the Grafton campus the map draws building 501 of the M&HS Building in detail: a tower of
  board-marked concrete under a dark crown at the east end of a long block, a strip of windows up its face, a
  glazed box at its foot and a glazed link beside it. Its sizes come from the LiDAR; it was compared with a
  photograph, which is not published, and its card says what is estimated.
- **2026-11-08:** on Symonds Street the map draws Auckland Bioengineering House (439) in detail: a tower clad all
  round in glass, its corners cut, two stone fins on its north face rising above its top and a plant room on its roof,
  with a lower building round its north and east sides. Its sizes come from the LiDAR; it was compared with a
  photograph, which is not published, and its card says what is estimated.
- **2026-11-08:** the map draws Architecture - West (421W) in detail: a slab in pale concrete with a pale
  louvred parapet and a band of windows on each floor of its north-east faces above its glazed storey of doors, a
  grey hipped roof with a tower in dark cladding on it, its top falling to the north-west, and two lower blocks at
  its north-west end. Its sizes come from the LiDAR; it was compared with a photograph, which is not published,
  and its card says what is estimated.

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

**In the browser:** "Take a walk", the button beside the campus's name in the bottom-left corner,
or `?walk=1` in the address, puts a small made-up person near the Clock Tower.
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
that each render is compared with (for the Kate Edger Information Commons, the Humanities Building, buildings 302, 303
and 303S of the Science Centre, Architecture - West, Architecture - East, Building 907, Auckland Bioengineering House,
the Sir Owen G Glenn Building, 49 Symonds Street, Okareta, buildings 501, 502, 505 and 507 of the M&HS Building, Te
Pūtahi Tangata, the George Mason Biology Building and 2-6 Park Ave, another photograph of each). A lead agent and five
agents in parallel made the first one, the Clock Tower, each agent owning one part (the tower, the entrance bay, the
pavilions, the light and
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
roof. Every height comes from the LiDAR, within 0.12 m, but the underside of the link toward the
Clock Tower, which stands at the campus map's storey height over a passage. One Street View panorama
sees its whole lawn side; against it the model's silhouette has an IoU of 0.63 to 0.96 over its
three views, and from above its outline covers the LiDAR's with an IoU of 0.83. Three more see it
over the old basalt wall of the Albert Barracks, which fills half their frames. Its back, its ends
and the low link toward the Clock Tower, which no photograph shows, are drawn plainly.

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

The eighth is its neighbour, 15 Eden Crescent (802), a long white building of two storeys along the
street. Its windows sit deep in square openings, in two rows with red frames, over a base of
brownish-grey tiles; a band of windows runs under the canopy at its top, and near its north-west end
two doors with steps and a louvre stand among them. Its roof slopes up from the street face and from the back
to a top storey down the middle, under a curved roof. Its heights come from the LiDAR, within 0.1 m,
except on two parts of its roofs drawn on from the rest, estimated: over a well at its south-east end,
3.5 to 4.1 m above the LiDAR's, and by the street at its north-west end, about 1 m above it; the
openings and the doors are measured in a Street View photograph through its camera. Counted inside the rectangle the model fills on the screen, the model's silhouette has an IoU
of 0.58 to 1.00 over the nine views of three panoramas, 9 Eden Crescent's model left out where it
stands in front, though there those rectangles hold so little sky that a plain block filling them
would score higher; from above its outline covers the LiDAR's with an IoU of 0.87, and on
90% of the cells both cover it is within 0.5 m of the LiDAR's height. Its back and ends, which no photograph shows, are drawn
plainly; a glazed case on its street face is measured and not drawn.

| | |
| --- | --- |
| ![15 Eden Crescent from Eden Crescent, drawn from code](docs/landmarks/fifteen-eden-crescent-front.jpg) | ![15 Eden Crescent from above the street, drawn from code](docs/landmarks/fifteen-eden-crescent-above.jpg) |
| ![15 Eden Crescent on the map, drawn from code in the map's colours](docs/landmarks/fifteen-eden-crescent-map.jpg) | ![15 Eden Crescent from Eden Crescent, through the walker's eyes](docs/landmarks/fifteen-eden-crescent-eyes.jpg) |

The ninth is the Fisher Building (804), a tan brick tower on Waterloo Quadrant, its higher half a
shaft over its south-west side. A cream band runs round it at each floor, every 2.875 m, as the
LiDAR's wall returns peak; a slot of windows framed in white runs up the shaft's corner;
down its west side stand balconies with dark louvres; a red tile canopy covers its entrance, and a
ramp runs to it from the street over a car park. Its roofs, its parapet, the canopy and the ramp's
deck are within 0.15 m of the LiDAR's heights, and the floor bands within 0.18 m of where its wall
returns peak, the two lowest, behind trees, carrying the spacing on (estimated); the ramp's side
along the street is measured in the photographs, and the balconies' depth is estimated. Two
Street View panoramas on Waterloo Quadrant see its west and south faces, their cameras set by the
photographs' own edges against the LiDAR; counted inside the rectangle the model fills on the screen,
the model's silhouette has an IoU of 0.54 to 0.99 over their eight views, though only one of those
rectangles holds much sky, and there the model scores a little more than a plain block filling it;
from above its outline covers the LiDAR's with an IoU of 0.91. Its faces turned north, east and
south-east, which no photograph shows, are drawn plainly, and the parts of its outline under the trees
by its entrance, where the LiDAR sees no roof, are not drawn.

| | |
| --- | --- |
| ![The Fisher Building from Waterloo Quadrant, drawn from code](docs/landmarks/fisher-building-front.jpg) | ![The Fisher Building from above, drawn from code](docs/landmarks/fisher-building-above.jpg) |
| ![The Fisher Building on the map, drawn from code in the map's colours](docs/landmarks/fisher-building-map.jpg) | ![The Fisher Building from Waterloo Quadrant, through the walker's eyes](docs/landmarks/fisher-building-eyes.jpg) |

The tenth is the Thomas Building Extension (110N) on Symonds Street, a curved building joined to the
Thomas Building (110) by a glazed link. Round its curve three storeys of glass curtain wall stand over a
white rendered base, a dark beam between them, with service doors and small windows in the base; beside
the curve is a flat face of board-marked concrete, where a University banner hangs (not drawn). Its pale
metal roof rises from its edge to a raised middle with plant on it. Its roofs' heights come from the
LiDAR, within 0.12 m of the medians of their returns but in the outer 0.2 m of the main roof, where
the returns are of two heights (a fascia and a gutter behind it); the curtain wall's storeys, the doors and the
windows are measured in two Street View photographs through their cameras, which are set from the
photographs' own edges; how far the beam and the glass's fins stand out is estimated. Counted inside the
rectangle the model fills on the screen, the model's silhouette has an IoU of 0.62 to 0.96 over the six
views of the two panoramas, though in the upper and door views that rectangle spans the frame's width
and the glass's reflected sky counts as sky there; from above its outline covers the LiDAR's with an IoU of 0.96,
and on 92% of the cells both cover it is within 0.5 m of the LiDAR's height. What no photograph shows is
drawn plainly: the curve round its north, its north-west faces, the link's sides and its roofs.

| | |
| --- | --- |
| ![The Thomas Building Extension from Symonds Street, drawn from code](docs/landmarks/thomas-building-extension-front.jpg) | ![The Thomas Building Extension from above, drawn from code](docs/landmarks/thomas-building-extension-above.jpg) |
| ![The Thomas Building Extension on the map, drawn from code in the map's colours](docs/landmarks/thomas-building-extension-map.jpg) | ![The Thomas Building Extension from Symonds Street, through the walker's eyes](docs/landmarks/thomas-building-extension-eyes.jpg) |

The eleventh is the Kenneth Myers Centre (820) on Shortland Street, a brick building whose pilasters rise
past its parapet into pinnacles. Along its street face a cream coping with small merlons stands over a
corbel table of small arches and tall blind arches with cream springers; between its west and east parts
a porch stands forward, with an arched cream doorway up steps from the street, three arched windows over
it and four tall spires; a radio mast stands on its roof. Its roofs, its east part and its porch are
sized by the LiDAR, every height within 0.15 m of the medians of their returns, and what its street face
carries is measured in one Street View photograph through its camera, which is set from the photograph's
own edges. Over the part west of the porch the LiDAR of 2024 holds temporary works, scaffolding and a
temporary roof: that part's plan comes from the LINZ aerial photograph of 2023 and its heights from the
Street View photograph, at the aerial's plan. The campus map's outline for 820 does not follow the
building that the LiDAR and the aerial show: it lies 0.3 to 0.9 m north of its street face, its back is
turned across the building's, and it adds a tail over the lane to its west and a nub over the roofs to its
east. The model, drawn where they show the building, stands in place of the block. Counted inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.45
to 1.00 over the three views of the panorama, though glass towers fill the sky round it, so the IoU
there says little; the brightness of its brick is within 6 of the photograph's in each view. From above
its outline covers the LiDAR's with an IoU of 0.88, 0.95 leaving out the west part, where the LiDAR
holds the works. What no photograph shows is drawn plainly: its sides, its back and its roofs.

| | |
| --- | --- |
| ![The Kenneth Myers Centre from Shortland Street, drawn from code](docs/landmarks/kenneth-myers-centre-front.jpg) | ![The Kenneth Myers Centre from above, drawn from code](docs/landmarks/kenneth-myers-centre-above.jpg) |
| ![The Kenneth Myers Centre on the map, drawn from code in the map's colours](docs/landmarks/kenneth-myers-centre-map.jpg) | ![The Kenneth Myers Centre from Shortland Street, through the walker's eyes](docs/landmarks/kenneth-myers-centre-eyes.jpg) |

The twelfth is the Thomas Building (110) on Symonds Street, beside the Thomas Building Extension and
joined to it by its glazed link: four ranges of board-marked concrete round a courtyard. Along its face
to the road four storeys of red-framed window bands stand back behind deep concrete bands, between
square piers; toward its north-east end, where the ground falls, its ground storey steps down, with a
white door and a white-framed louvre beside a pier, and the bands run round the east corner onto its
end. Its heights come from the LiDAR, where its returns gather on the parapets' tops, the ledges, the
gutters and the roofs; the window rows, the frames, the piers, the corner and the ground storey are
measured in two Street View photographs through their cameras, which are set from the photographs' own
edges against the LiDAR's. What nothing measures is estimated, and its card names it: among other things
how far its frames stand out, and how far its ground storey's windows, doors and posts stand behind its
piers there. Where 110N's glazed link meets it, its north-east parapet is left out, so that the link's
roof covers that stretch. Counted inside the rectangle the model fills on
the screen, its silhouette has an IoU of 0.848 to 1.000 over the six views of the two panoramas, though
in five of them the face fills that rectangle (photographed sky is 0 to 10% of it), so the IoU there
says little; the brightness of its concrete and windows is within 4 of the photographs' in each view. From above its outline covers the LiDAR's with an IoU of 0.87, the LiDAR's
counting scattered returns in the courtyard, and on 76% of the cells both cover it is within 0.5 m of
the LiDAR's height. What no photograph shows is drawn plainly: its back, its south-west end, the
courtyard and the roofs.

| | |
| --- | --- |
| ![The Thomas Building from the road, drawn from code](docs/landmarks/thomas-building-front.jpg) | ![The Thomas Building from above, drawn from code](docs/landmarks/thomas-building-above.jpg) |
| ![The Thomas Building on the map, drawn from code in the map's colours](docs/landmarks/thomas-building-map.jpg) | ![The Thomas Building from the road, through the walker's eyes](docs/landmarks/thomas-building-eyes.jpg) |

The thirteenth is the Music School (250) on Symonds Street, beside a car park: a fan-shaped auditorium
under a grey roof of facets round one high point, and ranges of rendered walls round an open courtyard.
Along its face to the car park a long wall of pale render, with no window, carries a curved canopy of white
corrugated metal and steps up toward its north corner in rises of about 0.4 m; beyond it the auditorium's
ochre wall has a window of four tall lights in two rows and white downpipes at its corners. Its heights and
roofs come from the LiDAR, each roof fitted to its returns (70% to 94% of each roof's cells within 0.5 m
of the fit, but 42% for the low link at the courtyard's east corner); the parapet's upper steps, the canopy's lower edge and the window are measured in a Street View
photograph through its camera, which is set from the photograph's own edges against the LiDAR's. What
nothing measures is estimated, and its card names it: among other things how thick its canopy and roofs
are and where the parapet's lower steps begin. Counted inside the rectangle the model fills on the screen,
its silhouette has an IoU of 0.84 to 0.97 over the three views of the panorama, though in the door view the
face fills that rectangle (photographed sky is 6% of it), so the IoU there says little; the brightness of
its render is within 4 of the photograph's in each view. From above its outline covers the LiDAR's with
an IoU of 0.94, and on 88% of the cells both cover it is within 0.5 m of the LiDAR's height. What no
photograph shows is drawn plainly: its faces to the road and to the south and west, the courtyard and the
roofs.

| | |
| --- | --- |
| ![The Music School from the car park beside it, drawn from code](docs/landmarks/music-school-front.jpg) | ![The Music School from above, drawn from code](docs/landmarks/music-school-above.jpg) |
| ![The Music School on the map, drawn from code in the map's colours](docs/landmarks/music-school-map.jpg) | ![The Music School from the car park beside it, through the walker's eyes](docs/landmarks/music-school-eyes.jpg) |

The fourteenth is the Kate Edger Information Commons (315) on Alfred Street, over a sunken court: two long
ranges of pale grey cladding with a glass-roofed atrium between them, open to the court at its north-east
end. On the south-east range's end to the street pale silver metal screens hang from 3.7 m to the roof over
green-tinted glazing, its corner is glazed in green, and grey mesh panels hang over the atrium's open end;
the north-west range's end reaches out over the court, glazed, open beneath it, with a roof light along it and
a glass canopy under its tip. Its heights come from the LiDAR, with the parapets round its north-west range
and the screened plant on its south-east range's roof; the heights of its screens, glazing, mesh panels and
shopfront, and of the lower edge of its end over the court, are estimated in a photograph from Alfred Street,
through a camera fitted to points picked on it whose places the LiDAR measures. Its roofs are drawn flat at the
LiDAR's heights, without their falls. What nothing measures is estimated, and its card names it: among
other things the rest of the underside of its end over the court. Counted inside the rectangle the model fills on the
screen, its silhouette has an IoU of 0.64 in that photograph, where bare trees stand before much of the sky;
the brightness of the building is within 1 of the photograph's, though the green glass at its corner is
drawn brighter. From above its outline covers the LiDAR's with an IoU of 0.88, the LiDAR's counting the roof
of AUSA House (322) next to it beyond the campus map's outline of that building, and on 76% of the cells both
cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly: its faces
to the north-west and south-east, its south-west end and its roofs.

| | |
| --- | --- |
| ![The Kate Edger Information Commons from the north-east, drawn from code](docs/landmarks/kate-edger-information-commons-front.jpg) | ![The Kate Edger Information Commons from above, drawn from code](docs/landmarks/kate-edger-information-commons-above.jpg) |
| ![The Kate Edger Information Commons on the map, drawn from code in the map's colours](docs/landmarks/kate-edger-information-commons-map.jpg) | ![The Kate Edger Information Commons from the north-east, by the Old Choral Hall, through the walker's eyes](docs/landmarks/kate-edger-information-commons-eyes.jpg) |

The fifteenth is the Humanities Building (206), beside the CLL Building: an L of two wings of buff brick under
red clay-tiled roofs, a higher middle along each wing with a lower roof round its outer sides, a raised roof
on eight sides over the corner where the wings meet, rising to a flat top, and a low block at the street
wing's south-east end, where the ground is 8 m lower. On the street wing's face to the courtyard four bands of
brick run between ribbons of windows set back behind them, most of their panes behind film in vertical stripes
of red, orange and yellow, with a glazed slot for the stair in dark red frames and the entrance at its foot.
Its heights come from the LiDAR, the slopes of its corner's roof fitted to the returns on it; the upper edge
of its top band, which the eave hides from the LiDAR, the sill of its lowest windows and the sides of its
entrance are estimated in a photograph from the courtyard, through a camera fitted to points picked on it
whose places the LiDAR measures. What nothing measures is estimated, and its card names it: among other things
how far its windows stand back and which panes have the film, drawn two in every three. Counted inside the
rectangle the model fills on the screen, its silhouette has an IoU of 0.93 in that photograph; the brightness
of the building is within 8 of the photograph's. From above its outline covers the LiDAR's with an IoU of
0.90, and on 98% of the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does
not show is drawn in plain brick: its other faces.

| | |
| --- | --- |
| ![The Humanities Building from its courtyard, drawn from code](docs/landmarks/humanities-building-front.jpg) | ![The Humanities Building from above, drawn from code](docs/landmarks/humanities-building-above.jpg) |
| ![The Humanities Building on the map, drawn from code in the map's colours](docs/landmarks/humanities-building-map.jpg) | ![The Humanities Building from its courtyard, through the walker's eyes](docs/landmarks/humanities-building-eyes.jpg) |

The sixteenth is building 302 of the Science Centre, on Symonds Street: a tower over a lower block before its
south-west face. The tower's south-west face is in bands of pale
metal between ribbons of glass, one a storey, under a band of tall slats; its south-east face is clad in
brown, with a row of deep brown fins. Its roofs, square with its faces, fall gently to a band across their middle
where three sawtooth ramps rise toward the south-west, with plant in four boxes and lower roofs at its two ends,
each rising in a ramp to the parapet, and a lower wing along its north-east face. The lower block is wrapped in near-black screens of folded blades, which run
on round its ends along the tower's end faces, round a tall glazed corner at its south end. Its
heights come from the LiDAR, the ribbons' sills and heads from the LiDAR's returns on the face and the ramps fitted
to the returns on them; the edges of its glazed corner are estimated in a photograph from the street corner to
its south, through a camera fitted to points picked on it whose places the LiDAR measures. What nothing measures
is estimated, and its card names it: among other things the sizes and spacing of its slats, fins and blades.
Counted inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.92 in that photograph;
the brightness of the building is within 9 of the photograph's. From above its outline covers the LiDAR's with an
IoU of 0.89, and on 90% of the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph
does not show is drawn plainly: its faces to the north-east and north-west, the screen along its north-west
face and the lower wing along its north-east face.

| | |
| --- | --- |
| ![Building 302 of the Science Centre from the street corner to its south, drawn from code](docs/landmarks/science-centre-302-front.jpg) | ![Building 302 of the Science Centre from above, drawn from code](docs/landmarks/science-centre-302-above.jpg) |
| ![Building 302 of the Science Centre on the map, drawn from code in the map's colours](docs/landmarks/science-centre-302-map.jpg) | ![Building 302 of the Science Centre from Symonds Street to its south, through the walker's eyes](docs/landmarks/science-centre-302-eyes.jpg) |

The seventeenth is building 303 of the Science Centre: a range of four storeys along its street, faced in three
bands of mauve-grey precast panels with a shadowed gap under each, a canopy along the entrance over the glazed
ground storey; behind it, set back, a slab of ten storeys, its roof at 33.6 m with a raised part, a screened deck,
a round tank and a box of plant on it; behind the slab a block of ridged roofs with six round stacks rising to
42 m along the slab's back, and a wing with two troughs across its roof, a light well between it and the slab.
Every wall runs square with the face to the street, turned 3 degrees from the bearing its config measured from
the LiDAR's walls. Its heights
and plans come from the LiDAR, the gaps between the bands and the canopy at the LiDAR's returns on the face; the
roofs' colours come from the 2023 aerial. A large relief on the face is an artwork: it is not drawn after, and
the band there is plain. One photograph sees the lower part of the face close up through a wide lens; counted
inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.96 in it, and the brightness
of the building is within 4 of the photograph's. From above its outline covers the LiDAR's with an IoU of 0.85,
and on 86% of the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is
drawn plainly: every face but the one to the street.

| | |
| --- | --- |
| ![Building 303 of the Science Centre from its street, drawn from code](docs/landmarks/science-centre-303-front.jpg) | ![Building 303 of the Science Centre from above, drawn from code](docs/landmarks/science-centre-303-above.jpg) |
| ![Building 303 of the Science Centre on the map, drawn from code in the map's colours](docs/landmarks/science-centre-303-map.jpg) | ![Building 303 of the Science Centre from its street, through the walker's eyes](docs/landmarks/science-centre-303-eyes.jpg) |

The eighteenth is building 303S of the Science Centre, on Symonds Street: a block of eight storeys whose face to
the street is a curtain wall of mirror-like blue glass; toward its south-east end pale fins stand out of it, and
between the last of them and the pier at the corner a zigzag of pale braces climbs the face; its south-east end has
a pale spandrel band at each storey. On its roof, set back from the face, a top storey in pale grey panels behind a
parapet. Its heights and plans come from the LiDAR (the glass has almost no returns: the face's line comes from those
at its top); the fins' places and the storey's height are estimated with the photograph as a reference. One
photograph from the street about 95 m to the south-east, through a long lens; counted inside the rectangle the model
fills on the screen, its silhouette has an IoU of 0.97 in it, and the brightness of the building is within 1 of the
photograph's. From above its outline covers the LiDAR's with an IoU of 0.86, and on 86% of the cells both cover it
is within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly: its back and its
north-west end.

| | |
| --- | --- |
| ![Building 303S of the Science Centre from Symonds Street to its south-east, drawn from code](docs/landmarks/science-centre-303s-front.jpg) | ![Building 303S of the Science Centre from above, drawn from code](docs/landmarks/science-centre-303s-above.jpg) |
| ![Building 303S of the Science Centre on the map, drawn from code in the map's colours](docs/landmarks/science-centre-303s-map.jpg) | ![Building 303S of the Science Centre from Symonds Street to its south-east, through the walker's eyes](docs/landmarks/science-centre-303s-eyes.jpg) |

The nineteenth is Architecture - West (421W), north-west of Architecture - East: a slab in pale grey concrete with, on
each floor of its north-east faces above its storey of doors, a pale louvred parapet under a band of windows, and that
storey glazed on a paved upper level; a grey hipped roof, with a tower in dark cladding on its ridge whose top falls to
the north-west; and two lower blocks at its north-west end. Its heights and plans come from the LiDAR; the storeys'
height, the parapets and the windows are estimated with the photograph as a reference. One photograph from the paved
upper level to its north, about 33 m from the tower; counted inside the rectangle the model fills on the screen, its
silhouette has an IoU of 0.97 in it, and the brightness of the building is within 1 of the photograph's. From above its
outline covers the LiDAR's with an IoU of 0.78, and on 82% of the cells both cover it is within 0.5 m of the LiDAR's
height (its south-east end, which joins Architecture - East and is left to that building's model, and lower parts before
its set-back face are not drawn). What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![Architecture - West from the north, drawn from code](docs/landmarks/architecture-west-front.jpg) | ![Architecture - West from above, drawn from code](docs/landmarks/architecture-west-above.jpg) |
| ![Architecture - West on the map, drawn from code in the map's colours](docs/landmarks/architecture-west-map.jpg) | ![Architecture - West from the paved level to its north, through the walker's eyes](docs/landmarks/architecture-west-eyes.jpg) |

The twentieth is Architecture - East (421E), beside the Grafton Gully: a building in pale grey concrete whose main
block has, on each floor of its face to a raised terrace, a pale louvred parapet before a band of windows, and along its
top floor, under a grey hipped roof, a face in dark cladding with a row of dormers standing out of it; beside it a lower
wing with a band of windows on each floor. Two towers in the same dark cladding rise out of them, their tops sloping up:
a tall one out of the main block's roof and a lower one on the wing. Its walls run in two directions 45 degrees apart,
the wing's and the main block's, as the campus map's outline does. Its heights and plans come from the LiDAR; the
storeys' height, the parapets, the windows and the dormers are estimated with the photograph as a reference. One
photograph from a paved deck above the raised terrace, about 50 m from the tall tower; counted inside the rectangle the
model fills on the screen, its silhouette has an IoU of 0.94 in it, and the brightness of the building is within 1 of
the photograph's. From above its outline covers the LiDAR's with an IoU of 0.82, and on 63% of the cells both cover it
is within 0.5 m of the LiDAR's height (the storeys' edges stepping out on the main block's face to the terrace are not
drawn). What the photograph does not show is drawn plainly, the main block's faces turned away from the terrace and the
wing's walls below it, or after what it shows, the wing's other faces.

| | |
| --- | --- |
| ![Architecture - East from its raised terrace, drawn from code](docs/landmarks/architecture-east-front.jpg) | ![Architecture - East from above, drawn from code](docs/landmarks/architecture-east-above.jpg) |
| ![Architecture - East on the map, drawn from code in the map's colours](docs/landmarks/architecture-east-map.jpg) | ![Architecture - East from its raised terrace, through the walker's eyes](docs/landmarks/architecture-east-eyes.jpg) |

The twenty-first is Building 907 (907), on the Newmarket campus: a hall under a shallow barrel vault, clad in white
metal, with a band of glazing at the foot of its end toward the street, and beside it an annex of two storeys in orange
render, its windows in dark frames and its roof falling away from the hall. Its heights and plans come from the LiDAR;
the places and heights of the glazing and of the annex's windows and doors are estimated with the photograph as a
reference. One photograph from the street to its west-south-west, about 27 m from the annex's nearest corner; counted
inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.86 in it, and the brightness of the
building is within 2 of the photograph's. From above its outline covers the LiDAR's with an IoU of 0.96, and on 100% of
the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![Building 907 from the street to its west-south-west, drawn from code](docs/landmarks/building-907-front.jpg) | ![Building 907 from above, drawn from code](docs/landmarks/building-907-above.jpg) |
| ![Building 907 on the map, drawn from code in the map's colours](docs/landmarks/building-907-map.jpg) | ![Building 907 from the street to its west-south-west, through the walker's eyes](docs/landmarks/building-907-eyes.jpg) |

The twenty-second is Auckland Bioengineering House (439), on Symonds Street: a tower clad all round in glass, its plan a
rectangle with its four corners cut, two stone fins on its north face rising a little above its top, and a plant room on
its roof; round its north and east sides a lower building, where the site falls steeply to the east. Its heights and
plans come from the LiDAR; the second fin's place is estimated with the photograph as a reference. One photograph from
Symonds Street to its north-west, about 32 m from the tower; counted inside the rectangle the model fills on the screen,
its silhouette has an IoU of 0.92 in it, and the brightness of the building is within 6 of the photograph's. From above
its outline covers the LiDAR's with an IoU of 0.92, and on 81% of the cells both cover it is within 0.5 m of the LiDAR's
height (the things on the tower's roof beside its plant room are not drawn). What the photograph does not show is drawn
plainly or after what it shows.

| | |
| --- | --- |
| ![Auckland Bioengineering House from the north-west, drawn from code](docs/landmarks/auckland-bioengineering-house-front.jpg) | ![Auckland Bioengineering House from above, drawn from code](docs/landmarks/auckland-bioengineering-house-above.jpg) |
| ![Auckland Bioengineering House on the map, drawn from code in the map's colours](docs/landmarks/auckland-bioengineering-house-map.jpg) | ![Auckland Bioengineering House from Symonds Street to its north-west, through the walker's eyes](docs/landmarks/auckland-bioengineering-house-eyes.jpg) |

The twenty-third is the Sir Owen G Glenn Building (260): a curved wing of several storeys over an open ground storey, its
glass behind bands of louvres between white spandrels and a crown of louvres along its top, a Y of three arms round a
raised plaza, with a sloping canopy in the curve's inner corner and a top storey along its west side; a lower west
wing along the road, a lower building on the plaza's north-east side, and under the plaza a deck of floors over the
gully to the east. Its heights and plans come from the LiDAR; the heights of the curved wing's bands are estimated
with the photograph as a reference. One photograph from the plaza's north edge, taken in December 2018, before the
building on the plaza's north-east side, which the comparison leaves out; counted inside the rectangle the model
fills on the screen, its silhouette has an IoU of 0.76 in it, and the brightness of the building is within 4 of the
photograph's. From above its outline covers the LiDAR's with an IoU of 0.93, and on 90% of the cells both cover it is
within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly or after what it shows.

| | |
| --- | --- |
| ![The Sir Owen G Glenn Building from the north-west, drawn from code](docs/landmarks/owen-g-glenn-building-front.jpg) | ![The Sir Owen G Glenn Building from above, drawn from code](docs/landmarks/owen-g-glenn-building-above.jpg) |
| ![The Sir Owen G Glenn Building on the map, drawn from code in the map's colours](docs/landmarks/owen-g-glenn-building-map.jpg) | ![The Sir Owen G Glenn Building from the driveway to its north, through the walker's eyes](docs/landmarks/owen-g-glenn-building-eyes.jpg) |

The twenty-fourth is 49 Symonds Street (620), on Symonds Street: an office tower of about thirteen storeys whose corners
step back, its bays under a gable in the middle of its faces clad in pale panels, each with a tall window arched at
its top, its steps in blue glass, with a white band along its top and a mansard on its roof; at its foot to the east a
podium in dark stone with a pointed gable over its entrance, and lower buildings behind it. Its heights and plans come
from the LiDAR; the heights of its white band, its dark base and its windows, and its windows' widths and places, are
estimated with the photograph as a reference. One photograph from Symonds Street to its east, about 48 m from the
tower; counted inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.89 in it, and the
brightness of the building is within 3 of the photograph's. From above its outline covers the LiDAR's with an IoU of
0.89, and on 83% of the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show
is drawn after what it shows.

| | |
| --- | --- |
| ![49 Symonds Street from the east, drawn from code](docs/landmarks/49-symonds-street-front.jpg) | ![49 Symonds Street from above, drawn from code](docs/landmarks/49-symonds-street-above.jpg) |
| ![49 Symonds Street on the map, drawn from code in the map's colours](docs/landmarks/49-symonds-street-map.jpg) | ![49 Symonds Street from Symonds Street, through the walker's eyes](docs/landmarks/49-symonds-street-eyes.jpg) |

The twenty-fifth is Okareta (215), beside Symonds Street: a villa of two storeys of the 1880s, rendered and painted a warm
yellow ochre under hipped roofs of grey iron, with a verandah across the left of its front and a canted bay of two
storeys on the right, its windows arched at their heads in moulded surrounds. Its heights and plans come from the
LiDAR; the places and heights of its windows, its door, its bay's face and its verandah are estimated with the
photograph as a reference. One photograph from the footpath before it, about 18 m from its front; counted inside the
rectangle the model fills on the screen, its silhouette has an IoU of 0.77 in it, and the brightness of the building
is within 4 of the photograph's. From above its outline covers the LiDAR's with an IoU of 0.90, and on 81% of the
cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![Okareta from the north, drawn from code](docs/landmarks/okareta-front.jpg) | ![Okareta from above, drawn from code](docs/landmarks/okareta-above.jpg) |
| ![Okareta on the map, drawn from code in the map's colours](docs/landmarks/okareta-map.jpg) | ![Okareta from the footpath before it, through the walker's eyes](docs/landmarks/okareta-eyes.jpg) |

The twenty-sixth is building 501 of the M&HS Building, on the Grafton campus: a long block in board-marked concrete with,
at its east end toward a plaza, a tower under a dark crown of standing-seam metal, its foot flared out over the shaft
and its corners hipped up to a flat top; a strip of windows up the middle of the tower's face, a glazed box at its foot,
and a glazed link beside it to the north. Its heights and plans come from the LiDAR; the crown's eave and band, the
glazed link's top and floors and the strip of windows are estimated with the photograph as a reference. One
photograph from the plaza, about 67 m from the tower; counted inside the rectangle the model fills on the screen, its
silhouette has an IoU of 0.91 in it, and the brightness of the building is within 7 of the photograph's. From above
its outline covers the LiDAR's with an IoU of 0.83, and on 78% of the cells both cover it is within 0.5 m of the
LiDAR's height. What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![Building 501 of the M&HS Building from its plaza, drawn from code](docs/landmarks/mhs-building-501-front.jpg) | ![Building 501 of the M&HS Building from above, drawn from code](docs/landmarks/mhs-building-501-above.jpg) |
| ![Building 501 of the M&HS Building on the map, drawn from code in the map's colours](docs/landmarks/mhs-building-501-map.jpg) | ![Building 501 of the M&HS Building from its plaza, through the walker's eyes](docs/landmarks/mhs-building-501-eyes.jpg) |

The twenty-seventh is building 502 of the M&HS Building, on the Grafton campus beside 501: a main block of seven storeys
in pale concrete, its north face to the street a row of tall fins with window bays between them, their spandrels in a
textured grey, its east end pale panels beside a near-black glazed strip, under a dark metal skirt and a low hipped
roof with a plant room at each end; and a lower part of five storeys at its west end. Its heights and plans come from
the LiDAR; the foot of the roof's skirt, which the photograph shows, from the LiDAR's outermost roof cells, and the
edge of the east end's glazed strip in the photograph are estimated. One photograph from the street to its
north-east, about 38 m from the main block's corner; counted inside the rectangle the model fills on the
screen, its silhouette has an IoU of 0.93 in it, and the brightness of the
building is within 1 of the photograph's. From above its outline covers the LiDAR's with an IoU of 0.91, and on 91% of
the cells both cover it is within 0.5 m of the LiDAR's height (the strip of its roof inside block 501's ring is drawn
by 501's model). What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![Building 502 of the M&HS Building from the street to its north-east, drawn from code](docs/landmarks/mhs-building-502-front.jpg) | ![Building 502 of the M&HS Building from above, drawn from code](docs/landmarks/mhs-building-502-above.jpg) |
| ![Building 502 of the M&HS Building on the map, drawn from code in the map's colours](docs/landmarks/mhs-building-502-map.jpg) | ![Building 502 of the M&HS Building from the street to its north-east, through the walker's eyes](docs/landmarks/mhs-building-502-eyes.jpg) |


The twenty-eighth is building 507 of the M&HS Building, on the Grafton campus: along the street a block of five
storeys, its upper storeys clad in tall near-black fins over a glazed base two storeys high; north of it three glazed
bays stepping back one behind another, with a canopy over the entrance at their foot; behind them a block under flat
roofs at the same height, with raised parts and a lower part on its south side. Its heights and plans come from the
LiDAR; the underside of the finned storeys and the foot of the canopy's fascia are estimated with the photograph as a
reference. One photograph from across the street to its east-south-east at dusk, about 16 m from the street face;
counted inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.97 in it, and the brightness
of the building is within 5 of the photograph's. From above its outline covers the LiDAR's with an IoU of 0.89, and on 92% of the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is drawn
plainly.

| | |
| --- | --- |
| ![Building 507 of the M&HS Building from across the street to its east-south-east, drawn from code](docs/landmarks/mhs-building-507-front.jpg) | ![Building 507 of the M&HS Building from above, drawn from code](docs/landmarks/mhs-building-507-above.jpg) |
| ![Building 507 of the M&HS Building on the map, drawn from code in the map's colours](docs/landmarks/mhs-building-507-map.jpg) | ![Building 507 of the M&HS Building from across the street to its east-south-east, through the walker's eyes](docs/landmarks/mhs-building-507-eyes.jpg) |


The twenty-ninth is Te Pūtahi Tangata (201), on the City campus between the Humanities Building and the Music School:
on the street a hall whose front is glass from the pavement to its roof, under a folded roof whose plates rise and fall
across the front, their ridges running back from the street; a canopy over its entrance; at its north-east end a taller
block clad in pale metal; and behind them, down the slope, a long block whose roofs stand about 25 m over the street,
with raised strips and parts. Its heights and plans come from the LiDAR; the depth of the folded roof's plates at the
front and of the canopy are estimated with the photograph as a reference, and that of two plates, along the hall's
south-west side and over a passage by the long block, without one. One photograph from the street to its north-west,
about 14 m from the glass, through three plane trees whose leaves hide all the sky over the roof: no silhouette can be
counted against the sky, so the model was checked by laying it over the photograph through the camera fitted to it (to
1.8 pixels), and the brightness of the building is within 11 of the photograph's. From above its outline covers the
LiDAR's with an IoU of 0.91, and on 80% of the cells both cover it is within 0.5 m of the LiDAR's height. What the
photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![Te Pūtahi Tangata from the street to its north-west, drawn from code](docs/landmarks/te-putahi-tangata-front.jpg) | ![Te Pūtahi Tangata from above, drawn from code](docs/landmarks/te-putahi-tangata-above.jpg) |
| ![Te Pūtahi Tangata on the map, drawn from code in the map's colours](docs/landmarks/te-putahi-tangata-map.jpg) | ![Te Pūtahi Tangata from the street to its north-west, through the walker's eyes](docs/landmarks/te-putahi-tangata-eyes.jpg) |


The thirtieth is the George Mason Biology Building (106), on the City campus beside the Thomas Building: a long
block of three storeys in cream render, its walls up to a parapet and a grey attic set back behind it under a low hipped
roof; its middle wider, with two wings to the south-west and raised parts over the roof; at its south-east end, on the
street, three bays of red-framed windows between pilasters. Its heights and plans come from the LiDAR, and so does its
outline, which the campus map gives about 3.5 m short at each end; the windows of its south-east end and its pilasters'
width are estimated with the photograph as a reference. One photograph from the street to its south-east, square to that
end, through plane trees and under a hazy sky: the copy the project has is squeezed across, and was stretched back to
16:9 before its camera was fitted (to 1.4 pixels); its sky is too faint to count a silhouette against, so the model was
checked by laying it over the photograph through that camera, and the brightness of a plain stretch of the end wall is
the photograph's. From above its outline covers the LiDAR's with an IoU of 0.93, and on 85% of the cells both cover it
is within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![The George Mason Biology Building from the south, drawn from code](docs/landmarks/george-mason-biology-front.jpg) | ![The George Mason Biology Building from above, drawn from code](docs/landmarks/george-mason-biology-above.jpg) |
| ![The George Mason Biology Building on the map, drawn from code in the map's colours](docs/landmarks/george-mason-biology-map.jpg) | ![The George Mason Biology Building from the street to its south-east, through the walker's eyes](docs/landmarks/george-mason-biology-eyes.jpg) |


The thirty-first is building 505 of the M&HS Building, on the Grafton campus: a long block of four storeys in white
concrete panels over a ground floor set back under its upper storeys, behind round columns on the north; on its north
face, toward a plaza, twelve bays of silver fins and louvres over set-back glazing between a white wall at each end,
glass at its north-east corner and a dark band round its cut south-east corner; over the parapet a higher middle of the
roof, and at its west end an atrium under a glass roof. Its heights and plans come from the LiDAR, and so does its
outline: the campus map's lies about 7 m north-north-east of it, over the plaza. The north face's storeys, how far its
glazing stands behind its fins and louvres, the fins' top and the louvres' spacing, where its end bay and the white wall
at its north-east corner stop, the ground floor's set-back and its columns there, the end bay's windows and their
frames, the east face's glass and its foot, and the glazed front and the link under their grey bands are estimated with
the photograph as a reference. One photograph from the main road north-east of it, about 42 m from its north-east
corner; counted inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.94 in it, and the
brightness of its white walls is within 3 of the photograph's. From above its outline covers the LiDAR's with an IoU of
0.93, and on 92% of the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is
drawn plainly.

| | |
| --- | --- |
| ![Building 505 of the M&HS Building from the main road to its north-east, drawn from code](docs/landmarks/mhs-building-505-front.jpg) | ![Building 505 of the M&HS Building from above, drawn from code](docs/landmarks/mhs-building-505-above.jpg) |
| ![Building 505 of the M&HS Building on the map, drawn from code in the map's colours](docs/landmarks/mhs-building-505-map.jpg) | ![Building 505 of the M&HS Building from the main road to its north-east, through the walker's eyes](docs/landmarks/mhs-building-505-eyes.jpg) |


The thirty-second is 2-6 Park Ave (529), on the Grafton campus: a long block of four storeys under a thin flat roof
with a dark eave; at each upper storey a balcony along every face on a pale slab with a light rail; on its east face, on
Park Avenue, the glazing behind them and a ground storey of pale grey brick; on its roof grey plant and a raised part
with a red roof. Its heights and plans come from the LiDAR, which also sees the balconies' slabs and rails all round,
and the ground under its eaves, where the walls are drawn set back, but for the part of a low wing south-west of it that
trees hide, drawn to the campus map's outline; the balconies' slabs' depth and their rails' bars and posts, the glazing
behind them on the east face and its ground storey's brick and windows are estimated with the photograph as a reference.
One photograph from the footpath of Park Avenue, looking along the east face; counted inside the rectangle the model
fills on the screen, its silhouette has an IoU of 0.96 in it, and the brightness of that face is within 8 of the
photograph's. From above its outline covers the LiDAR's with an IoU of 0.87, and on 89% of the cells both cover it is
within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![2-6 Park Ave from Park Avenue, drawn from code](docs/landmarks/2-6-park-ave-front.jpg) | ![2-6 Park Ave from above, drawn from code](docs/landmarks/2-6-park-ave-above.jpg) |
| ![2-6 Park Ave on the map, drawn from code in the map's colours](docs/landmarks/2-6-park-ave-map.jpg) | ![2-6 Park Ave from Park Avenue, through the walker's eyes](docs/landmarks/2-6-park-ave-eyes.jpg) |

The site draws each landmark in place of its buildings' blocks (the Clock Tower in place of buildings
105 and 105S, its south range; Old Government House in place of 102; the General Library in place
of 109; Old Choral Hall in place of 104; Maclaurin Chapel in place of 107; the Clock Tower East Wing
in place of 119; 9 Eden Crescent in place of 801; 15 Eden Crescent in place of 802; the Fisher Building in
place of 804; the Thomas Building Extension in place of 110N; the Kenneth Myers Centre in place of 820;
the Thomas Building in place of 110; the Music School in place of 250; the Kate Edger Information
Commons in place of 315; the Humanities Building in place of 206; building 302 of the Science Centre in place
of 302; building 303 of the Science Centre in place of 303; building 303S of the Science Centre in place of 303S;
Architecture - West in place of 421W; Architecture - East in place of 421E; Building 907 in place of 907; Auckland
Bioengineering House in place of 439; the Sir Owen G Glenn Building in place of 260; 49 Symonds Street in place of 620;
Okareta in place of 215; building 501 of the M&HS Building in place of 501; building 502 of the M&HS Building in place
of 502; building 505 of the M&HS Building in place of 505; building 507 of the M&HS Building in place of 507; Te Pūtahi
Tangata in place of 201; the George Mason Biology Building in place of 106; 2-6 Park Ave in place of 529) when the
camera comes
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
  measured heights, walls, storeys and windows by the street look's rules. Fourteen are on the site
  (`landmarks/measured/`): on the City campus six plain buildings, and three of the buildings planned
  as landmarks, which they stand in for until their landmarks come; on the Grafton campus one, and on
  the Newmarket campus four. The other buildings it measures keep their blocks, each with its reason
  in `landmarks/measured/exclusions.json`.
- What every landmark shares ([`landmarks/`](landmarks/README.md)): the kit the models are built
  with, the viewer, and the pipeline (`landmarks/pipeline/run.sh <name>`: measure from the LiDAR,
  collect the Street View references (or fit a photograph's camera), correct their cameras, render and
  score, and place the model
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
| [Auckland Part 1 LiDAR point cloud (2024)](https://doi.org/10.5069/G9HH6H8T), tiles `CL2_BA32_2024_1000_*`, captured by Woolpert for Regional Software Holdings Limited and distributed by OpenTopography and LINZ | The sizes of the Clock Tower (buildings 105 and 105S), Old Government House (102), the General Library (109), the range of Old Choral Hall (104) on Symonds Street, Maclaurin Chapel (107), the Clock Tower East Wing (119), 9 Eden Crescent (801), 15 Eden Crescent (802), the Fisher Building (804), the Thomas Building Extension (110N), the Kenneth Myers Centre (820) but for its west part, the Thomas Building (110), the Music School (250), the Kate Edger Information Commons (315), the Humanities Building (206), building 302 of the Science Centre (302), building 303 of the Science Centre (303), building 303S of the Science Centre (303S), Architecture - West (421W), Architecture - East (421E), Building 907 (907), Auckland Bioengineering House (439), the Sir Owen G Glenn Building (260), 49 Symonds Street (620), Okareta (215), buildings 501, 502, 505 and 507 of the M&HS Building (501, 502, 505, 507), Te Pūtahi Tangata (201), the George Mason Biology Building (106) and 2-6 Park Ave (529), measured for their models in `landmarks/clocktower/`, `landmarks/old-government-house/`, `landmarks/general-library/`, `landmarks/old-choral-hall/`, `landmarks/maclaurin-chapel/`, `landmarks/clock-tower-east-wing/`, `landmarks/nine-eden-crescent/`, `landmarks/fifteen-eden-crescent/`, `landmarks/fisher-building/`, `landmarks/thomas-building-extension/`, `landmarks/kenneth-myers-centre/`, `landmarks/thomas-building/`, `landmarks/music-school/`, `landmarks/kate-edger-information-commons/`, `landmarks/humanities-building/`, `landmarks/science-centre-302/`, `landmarks/science-centre-303/`, `landmarks/science-centre-303s/`, `landmarks/architecture-west/`, `landmarks/architecture-east/`, `landmarks/building-907/`, `landmarks/auckland-bioengineering-house/`, `landmarks/owen-g-glenn-building/`, `landmarks/49-symonds-street/`, `landmarks/okareta/`, `landmarks/mhs-building-501/`, `landmarks/mhs-building-502/`, `landmarks/mhs-building-505/`, `landmarks/mhs-building-507/`, `landmarks/te-putahi-tangata/`, `landmarks/george-mason-biology/` and `landmarks/2-6-park-ave/`; the heights and roofs of the measured massings, in `landmarks/measured/buildings/` | Sourced from LINZ and licensed by Regional Software Holdings Limited for re-use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) ([LINZ's attribution page](https://www.linz.govt.nz/products-services/data/licensing-and-using-data/attributing-elevation-or-aerial-imagery-data)). Only the measured sizes are published, in the landmark's config and `parts/common.js` and in the measured massings' data files; the tiles stay on the computer that fetched them. |
| Google Street View, through the Map Tiles API | Photographs the models of the Clock Tower, Old Government House, the General Library, Old Choral Hall, Maclaurin Chapel, the Clock Tower East Wing, 9 Eden Crescent, 15 Eden Crescent, the Fisher Building, the Thomas Building Extension, the Kenneth Myers Centre, the Thomas Building and the Music School were compared with while they were drawn, and the heights of the Kenneth Myers Centre's west part were measured in | © Google. Used as references only: never published, traced or sampled, and kept on the computer that fetched them. |
| A photograph of the Kate Edger Information Commons from Alfred Street | The look its model was compared with while it was drawn, and the heights of its screens, glazing, mesh panels and shopfront toward Alfred Street and of the lower edge of its end over the sunken court, estimated in it through a camera fitted to the LiDAR | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of the Humanities Building from its courtyard | The look its model was compared with while it was drawn, and the upper edge of its top brick band, the sill of its lowest windows and the sides of its entrance on its face to the courtyard, estimated in it through a camera fitted to the LiDAR | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of building 302 of the Science Centre from the street corner to its south | The look its model was compared with while it was drawn, and the edges of its glazed corner, estimated in it through a camera fitted to the LiDAR | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of building 303 of the Science Centre from its street | The look its model was compared with while it was drawn, and two heights on its face estimated with it as a reference: the gaps between its bands, and its lowest band's bottom | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of building 303S of the Science Centre from its street to the south-east | The look its model was compared with while it was drawn, and, as a reference, the storeys' height on its south-east end and the places of the fins on its face to the street | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of 49 Symonds Street from Symonds Street to its east | The look its model was compared with while it was drawn, and, as a reference, the heights of the white band along its top, its dark base and its windows and its windows' widths and places, estimated in it through a camera fitted to the LiDAR | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of Okareta from the footpath before it | The look its model was compared with while it was drawn, and, as a reference, the places and heights of its windows, its door, its bay's face and its verandah, estimated in it through a camera fitted to the LiDAR | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of building 501 of the M&HS Building from the plaza to its east | The look its model was compared with while it was drawn, and, as a reference, the heights of its crown's eave and band, the set-back of its shaft under the crown, the top and floors of the glazed link beside it and its strip of windows, estimated in it through a camera fitted to the LiDAR | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of building 502 of the M&HS Building from the street to its north-east | The look its model was compared with while it was drawn, and, as a reference, the dark skirt round its roof, whose foot the LiDAR gives, and the edge of its east end's glazed strip, estimated in it through a camera fitted to the LiDAR | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of building 507 of the M&HS Building from across the street to its east-south-east | The look its model was compared with while it was drawn, and, as a reference, the underside of its street face's finned upper storeys and the foot of its canopy's fascia, estimated in it through a camera fitted to the LiDAR | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of Te Pūtahi Tangata from the street to its north-west | The look its model was compared with while it was drawn, and, as a reference, the depth of its folded roof's plates at the front and of its canopy, estimated in it through a camera fitted to the LiDAR | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of the George Mason Biology Building from the street to its south-east | The look its model was compared with while it was drawn, and, as a reference, the sizes and places of the windows of its south-east end and its pilasters' width, estimated in it through a camera fitted to the LiDAR | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of building 505 of the M&HS Building from the main road to its north-east | The look its model was compared with while it was drawn, and, as a reference, its north face's storeys, how far its glazing stands behind its fins and louvres, the fins' top and the louvres' spacing, where its end bay and the white wall at its north-east corner stop, the ground floor's set-back and its columns there, the end bay's windows and their frames, the east face's glass and its foot, and the glazed front and the link under their grey bands, estimated in it through a camera fitted to the LiDAR | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of 2-6 Park Ave from the footpath of Park Avenue | The look its model was compared with while it was drawn, and, as a reference, its balconies' slabs' depth and their rails' bars and posts, the glazing behind them on the east face and its ground storey's brick and windows, estimated in it through a camera fitted to the LiDAR | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of Architecture - West from the paved level to its north | The look its model was compared with while it was drawn, and, as a reference, the storeys' height and the parapets and windows on its north-east faces | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of Auckland Bioengineering House from Symonds Street to its north-west | The look its model was compared with while it was drawn, and the place of the second stone fin on its north face, estimated in it through a camera fitted to the LiDAR | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of Architecture - East from a paved deck above its raised terrace | The look its model was compared with while it was drawn, and, as a reference, the storeys' height and the parapets, windows and dormers on its faces to the terrace | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| A photograph of Building 907 from the street to its west-south-west | The look its model was compared with while it was drawn, and, as a reference, the places and heights of the band of glazing on the hall's end and of the annex's windows and doors, estimated in it through a camera fitted to the LiDAR | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
| Auckland Central 0.06 m Urban Aerial Photos (2023), tiles `BA32_2000_*` of LINZ's imagery on AWS | The plan of the Kenneth Myers Centre's west part (820), where the 2024 LiDAR holds temporary works, measured for its model in `landmarks/kenneth-myers-centre/`; for the Kate Edger Information Commons (315), where its end over the sunken court ends and that its roof light is glass; for the Humanities Building (206), that its roofs are red clay tiles but for the two flat roofs in the angle of its L, which are grey; for building 302 of the Science Centre (302), that its roofs are grey; for building 303 of the Science Centre (303), that the roofs of its range along the street and of its slab are near white; for building 303S of the Science Centre (303S), that its roofs are grey; for Building 907 (907), that its roofs are near white; for 49 Symonds Street (620), that the flat top of the mansard on its roof is pale; for Okareta (215), that its roofs are grey; for buildings 501, 502, 505 and 507 of the M&HS Building (501, 502, 505, 507), that their roofs are grey; for Te Pūtahi Tangata (201), that its roofs are grey, with strips of glazing and a planted part on the hall's; for the George Mason Biology Building (106), that its roofs and its attic are grey; for 2-6 Park Ave (529), that its raised part's roof is red | Sourced from LINZ and licensed by Auckland Council for re-use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) ([LINZ's attribution page](https://www.linz.govt.nz/products-services/data/licensing-and-using-data/attributing-elevation-or-aerial-imagery-data)). Only the measured sizes are published, in the landmark's `parts/common.js`; the tiles stay on the computer that fetched them. |
| A photograph of the Sir Owen G Glenn Building from the north edge of its plaza | The look its model was compared with while it was drawn, and, as a reference, the heights of the bands of glass, spandrels and louvres on its curved wing, estimated in it through a camera fitted to the LiDAR | Used as a reference only: never published, traced or sampled, and kept on the maintainer's computer. |
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
gives the buildings of the Kelburn, Pipitea and Te Aro campuses, picked by their `operator` and
`building=university` tags, with their names, outlines and, where tagged, heights, and the streets
round them, from the snapshots of its three areas, `data/raw/osm/context-vuw-kelburn.json`,
`context-vuw-pipitea.json` and `context-vuw-te-aro.json`; `public/data/vuw/campus.json`,
`context.json` and `context/` are under the ODbL. The LINZ 8 m elevation model gives the ground
(`public/data/vuw/terrain/`), under CC BY 3.0 NZ. Open-Meteo gives the weather at the Kelburn Campus, and Quaternius's figure is the walker's
body. VUW's room list and course list wait
for the maintainer's reading of VUW's copyright terms, and its class times and key dates sit in
parts of its site that its `robots.txt` disallows: see [docs/schools/vuw.md](docs/schools/vuw.md).

**Otago World Model** (`/otago/`) uses the same four sources and nothing of the University of
Otago's own. OpenStreetMap gives the buildings of the Dunedin and Christchurch campuses, picked by
their `operator` and `building=university` tags, with their names, outlines and, where tagged,
heights, and the streets round them, from the snapshots of its two areas
(`data/raw/osm/context-otago-dunedin.json` and `context-otago-christchurch.json`);
`public/data/otago/campus.json`, `context.json` and `context/` are under the ODbL. The LINZ 8 m
elevation model gives the ground (`public/data/otago/terrain/`), under CC BY 3.0 NZ. Open-Meteo
gives the weather at the Dunedin campus, and Quaternius's figure is the walker's body. Otago's
campus map, room list, key dates and paper pages are on its main website, which refused the
project's first request to it; its class times answer only on its own network: see
[docs/schools/otago.md](docs/schools/otago.md).

**UC World Model** (`/uc/`) uses the same four sources and nothing of the University of
Canterbury's own. OpenStreetMap gives the buildings of the Ilam and Dovedale campuses and of the
Arts Centre city location, picked by their `operator` and `building=university` tags, with their
names, outlines and, where tagged, heights, and the streets round them, from the snapshots of its
three areas (`data/raw/osm/context-uc-ilam.json`, `context-uc-dovedale.json` and
`context-uc-arts-centre.json`); `public/data/uc/campus.json`, `context.json` and `context/` are
under the ODbL. The LINZ 8 m elevation model gives the ground (`public/data/uc/terrain/`), under
CC BY 3.0 NZ. Open-Meteo gives the weather at the Ilam campus,
and Quaternius's figure is the walker's body. UC's copyright page asks for its written permission
before material on its webpages is copied, which holds back its rooms, key dates and course list,
and its timetable planner is on a site whose `robots.txt` disallows every automated visitor: see
[docs/schools/uc.md](docs/schools/uc.md).

**Massey World Model** (`/massey/`) uses the same four sources and nothing of Massey University's
own. OpenStreetMap gives the buildings of the Manawatū, Auckland and Wellington campuses, picked by
their `operator`, `building=university` and `amenity=university` tags, or a name or an address that
says Massey,
with their names, outlines and, where tagged, heights, and the streets round them, from the
snapshots of its three areas (`data/raw/osm/context-massey-manawatu.json`, `context-massey-auckland.json`
and `context-massey-wellington.json`); `public/data/massey/campus.json`, `context.json` and
`context/` are under the ODbL. The LINZ 8 m elevation model gives the ground
(`public/data/massey/terrain/`), under CC BY 3.0 NZ. Open-Meteo gives the weather at the Manawatū
campus, and Quaternius's figure is the walker's body. Massey publishes no room outlines the site
could find, and its class timetable is behind a sign-in; its key dates and course list are open
for non-commercial use but are not read yet: see [docs/schools/massey.md](docs/schools/massey.md).

**Waikato World Model** (`/waikato/`) uses the same four sources and one of the University of
Waikato's own: its Hamilton campus map. OpenStreetMap gives the buildings of the Hamilton campus,
with their names, outlines and, where tagged, heights, and the streets round them, from the snapshot
of its one area (`data/raw/osm/context-waikato-hamilton.json`); `public/data/waikato/campus.json`
and `context.json` are under the ODbL. Which of those buildings are the University's comes from the
University's Hamilton campus map (version Q1 2025), which the site's maintainer downloaded in their
own browser and gave the project on 2026-10-28: a table in `src/schools/waikato/school.ts` ties each
building to the map's block, and the 17 buildings OpenStreetMap leaves unnamed are called by the
map's block codes. The map is the University of Waikato's and is not in the repository; About lists
it with the other sources. The LINZ 8 m elevation model gives the ground
(`public/data/waikato/terrain/`), under CC BY 3.0 NZ. Open-Meteo gives the weather at the Hamilton
campus, and Quaternius's figure is the walker's body. Waikato's main website, which holds its
campus maps, key dates and paper pages, is closed to this project by its `robots.txt`, so no
agent of the project reads it: see [docs/schools/waikato.md](docs/schools/waikato.md).

**Lincoln World Model** (`/lincoln/`) uses the same four sources and nothing of Lincoln University's
own. OpenStreetMap gives the buildings of the Lincoln campus, and only the ones it tags as the
University's, by their `operator` tag (`Lincoln University`) or `building=university`, are shown as
the University's, with their names, outlines and, where tagged, heights; every other building on
the campus, and the streets round it, are drawn as surroundings, from the snapshot of its one area
(`data/raw/osm/context-lincoln.json`); `public/data/lincoln/campus.json` and `context.json` are
under the ODbL. The LINZ 8 m elevation model gives the ground (`public/data/lincoln/terrain/`),
under CC BY 3.0 NZ. Open-Meteo gives the weather at the Lincoln campus, and Quaternius's figure is
the walker's body. Lincoln's main website, which holds its campus maps, key dates and course pages,
is closed to this project by its `robots.txt`, so no agent of the project reads it: see
[docs/schools/lincoln.md](docs/schools/lincoln.md).

Snapshot dates are shown in the site's About panel and recorded in `public/data/uoa/meta.json`,
`public/data/aut/meta.json`, `public/data/vuw/meta.json`, `public/data/otago/meta.json`,
`public/data/uc/meta.json`, `public/data/massey/meta.json`, `public/data/waikato/meta.json` and
`public/data/lincoln/meta.json`.

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
  (104) on Symonds Street, Maclaurin Chapel (107), the Clock Tower East Wing (119), 9 Eden
  Crescent (801), 15 Eden Crescent (802), the Fisher Building (804), the Thomas Building
  Extension (110N), the Kenneth Myers Centre (820), the Thomas Building (110), the Music School (250),
  the Kate Edger Information Commons (315), the Humanities Building (206), buildings 302, 303 and 303S of the
  Science Centre (302, 303, 303S), Architecture - West (421W), Architecture - East (421E), Building 907 (907), Auckland
  Bioengineering House (439), the Sir Owen G Glenn Building (260), 49 Symonds Street (620), Okareta (215), buildings
  501, 502, 505 and 507 of the M&HS Building (501, 502, 505, 507), Te Pūtahi Tangata (201), the George Mason Biology
  Building (106) and 2-6 Park Ave (529) are the exceptions:
  their models are drawn to
  sizes measured from LiDAR (the Kenneth Myers Centre's west part from an aerial photograph; some heights
  of the Kate Edger Information Commons, the Humanities Building, buildings 302, 303 and 303S of the Science Centre,
  Architecture - West, Architecture - East, Building 907, Auckland Bioengineering House, the Sir Owen G Glenn Building,
  49 Symonds Street, Okareta, buildings 501, 502, 505 and 507 of the M&HS Building, Te Pūtahi Tangata, the George Mason
  Biology Building and 2-6 Park Ave are estimated in a photograph, as is the place of one of Auckland Bioengineering
  House's stone fins). The
  measured massings (About lists them) are measured too: their
  heights and roofs come from the LiDAR, their walls and windows are drawn by rule. Five of them,
  Alfred Nathan House among them, are buildings planned as landmarks: until their landmarks come
  they are drawn as plainly as the others, with no detail of their own.
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
  aerial). The link stands over a passage where the campus map has no ground floor under it, from
  the map's storey height, 3.6 m: nothing measures its underside, and the LiDAR's ground under it is
  up to about 2.5 m higher than the site's 8 m elevation model, so the real passage is lower than
  drawn. The east pavilion's front, half hidden by the basalt wall, is drawn after the west
  pavilion's. The windows' glazing patterns are drawn as plain bars.
- **9 Eden Crescent is seen from its street end only.** Three Street View panoramas on Eden Crescent
  see the street end; its neighbours either side and a tall tower behind it stand in their wide views,
  so its likeness is counted inside the rectangle the model fills on the screen, which there holds so
  little sky that the number shows little. All three panoramas record their cameras about 1 m from
  where the LiDAR puts the building; they are set by hand, one from its photograph's own edges and the
  other two from the model's drawn openings. Its heights come from the LiDAR. What no
  photograph shows is drawn plainly: its long sides, which stand against their neighbours, its far
  end, and the plant on its roof (grey boxes at the LiDAR's sizes). Its white cladding is drawn
  without the panels' joints.
- **15 Eden Crescent is seen from Eden Crescent only, mostly along its street face.** The same three
  Street View panoramas see its street face, one of them square enough to measure its openings through
  its camera, which is set where 9 Eden Crescent's fit puts it; their rectangles hold so little sky that
  the likeness counted inside them shows little. Its heights come from the LiDAR, except on two parts
  of its roofs drawn on from the rest (estimated): over a well at its south-east end, about 6.5 by
  3.5 m, 3.5 to 4.1 m above the LiDAR's, and by the street face at its north-west end, about 1 m above
  it on about 2 m². What no photograph shows is drawn plainly: its back, its ends and the walls of its
  top storey, and its roofs are grey.
  The street face's windows beyond its first 14 m from the north-west keep the spacing measured there,
  and a red-framed glazed case near its north-west end is measured and not drawn: it stands on a street
  0.95 m below the building's ground, where the map's ground lies about 0.85 m below it, a little above
  the street. Its panels are drawn without their joints, its base's tiles and its two red-brown doors in
  a dark timber.
- **The Thomas Building Extension is seen from Symonds Street only.** Two Street View panoramas see its
  flat south-east face and the first 25 m of its curve; their cameras are set from the photographs' own
  edges, 0.8 and 1.3 m from where the panoramas record them. Its roofs' heights come from the LiDAR, its
  curtain wall's storeys and its base's doors and windows from the photographs. The two photographs
  differ by 25 in the brightness of its white base, and it is drawn between them. What no photograph
  shows is drawn plainly: the curve round its north, the north end, the diagonal north-west face, the
  north-west wall, the link's sides and the roofs. The University banner on its concrete face and the
  creeper on its base are not drawn, and how far the beam under its glass and the glass's fins stand
  out is estimated.
- **The Kenneth Myers Centre is seen from Shortland Street only, and its west part not by the LiDAR.**
  One Street View panorama sees its street face whole; its camera is set from the photograph's own
  edges, 1.1 m from where the panorama records it, and its views are cut turned level by 4.5°. Over the
  part west of its porch the LiDAR of 2024 holds scaffolding and a temporary roof: that part's plan comes
  from the aerial photograph of 2023 and its heights from the Street View photograph, and its roof from
  the LiDAR's few returns under the temporary roof. The campus map's outline for 820 does not follow the
  building: it lies 0.3 to 0.9 m north of its street face, its back is turned across the building's, and
  it adds a tail over the lane to its west and a nub over the roofs to its east. The model, drawn where
  the LiDAR and the aerial show the building, stands in place of the block. What no
  photograph shows is drawn plainly: its sides, its back and its roofs. The height of its west side's parapet and of its west part's dentil course, how far its pilasters, arcades,
  coping and door surround stand out, its parapets' thickness, the widths of the piers between its blind
  arches, of its merlons and of the porch's windows and colonnettes, where its blind arches come down, and
  its radio mast's members are estimated, and its card says so; the mast's
  red bands are not drawn.
- **The Thomas Building is seen from its face to the road and its east corner only.** Two Street View
  panoramas see it: one its face to the road whole, the other its east corner and the ground storey
  beside it at a slant; their cameras are set from the photographs' own edges against the LiDAR's. Its
  heights come from the LiDAR, its window rows, frames, piers and ground storey from the photographs.
  Toward its north-east end one photograph's camera reads the ground storey 0.2 to 0.5 m low, as it reads
  the ground there below the LiDAR's; the storey is drawn at the other's heights, whose camera reads the
  ground as the LiDAR does. Which panes have blinds is drawn by a seeded draw at the share the photographs
  show; that, how far its frames stand out and how thick their members are, how far its ground storey's
  windows, doors and posts stand behind its piers there and how thick its roofs are, among others, are
  estimated, and its card says so; the ledge along its bands' lower edges is not drawn. The site stands
  it and the Thomas Building Extension on one ground, at the LiDAR's heights against each other: the
  extension's glazed link's roof passes 0.24 m over its north-east parapet, which runs on under it. What
  no photograph shows is drawn plainly: its back, its south-west end, the courtyard and the roofs. The
  map's ground (the 8 m elevation model) lies up to 4.5 m above the ground at its door by its west
  corner and 2.4 to 3.1 m above it at its round stair, where the LiDAR's ground is within about 1 m of
  it, and hides the foot of its walls there; on its face to the road it covers the ground storey's
  windows wholly for 9.4 m past the pier at its south-west end and partly for 22 m more.
- **The Music School is seen from the car park beside it only.** One Street View panorama sees its face to the
  car park whole and the auditorium's ochre wall beyond it at a slant; its camera is set from the
  photograph's own edges against the LiDAR's. Its heights and roofs come from the LiDAR, the parapet's
  upper steps, the canopy's lower edge and the ochre wall's window from the photograph. A second panorama,
  whose photographs stand turned about 8° and whose camera is not fitted, shows the window squarer but
  measures nothing. How thick its canopy and roofs are, how deep the auditorium's fascia is, where the
  parapet's lower steps begin and how high its steps stand between the LiDAR's levels, the window's frames,
  the downpipes, where the auditorium's walls stand on its courtyard and south edges, and the colour of the walls no photograph shows are estimated, and its card says so. The west corner's glazed roof is drawn as
  one plane, the low link at the courtyard's east corner flat (42% of its cells within 0.5 m), and the
  trees by the road, which the LiDAR partly classes as building, are not drawn. What no photograph shows
  is drawn plainly: its faces to the road and to the south and west, the courtyard and the roofs. The
  Overbridge (202) meets it along its south-east and south sides, where the campus map's two outlines
  overlap: the model covers 12% of block 202, whose top the map stands about 3.3 m above the model's
  door, 3.9 m or more under the model's roofs there (7.30 to 9.15 m).
- **The Humanities Building is seen from its courtyard only.** One photograph sees the street wing's face to
  the courtyard, with trees before both its ends; its other faces, which no photograph shows, are plain buff
  brick, and its roofs are seen in the LiDAR and the 2023 aerial alone. Its heights come from the LiDAR; the
  upper edge of its top brick band, which the eave hides from the LiDAR, the sill of its lowest windows and
  the sides of its entrance are estimated in the photograph. How far its windows stand back behind the
  bands, how wide their panes are and which of them have the striped film are estimated (the film drawn on
  two panes in every three, by a rule: the photograph's are filmed in no rule), as are the roofs in the
  angle of its L, drawn flat, and the colour of the walls and roofs no photograph shows; its card says so.
  The stair's slot is drawn flush with the face, not about a metre deep, without the pattern on its glass;
  the street wing's middle ends square at its south-east end, where the LiDAR's roof runs on a metre further
  with its corners cut; and a low covering the LiDAR shows along the north-east wing's north-west face, at
  3.2 to 3.8 m, is not drawn. The campus map's outline of block 206 takes in the courtyard, where there is
  no building: the model covers 73% of it. The model stands at a point on the path along the north-east
  wing's north-west face where the LiDAR's ground is the model's; the courtyard before the entrance is 0.2
  to 0.36 m higher. The CLL Building's lowest storey, which the campus map runs up to the face south-east of
  the entrance, keeps its block and stands 3.3 m above the model's ground there, before the lowest ribbon of
  windows the photograph shows above the courtyard: the map's ground is 2.6 m below the LiDAR's at the door.
- **The Kate Edger Information Commons is seen from Alfred Street only.** One photograph sees its end to
  the street from under the trees there: the south-east range's screened face and green corner, the
  atrium's open end and the north-west range's end over the sunken court. Its camera is fitted to points
  picked on the photograph whose places the LiDAR measures, and is out by about 1 m sideways at the
  photograph's edge, where the end over the court is. Its heights come from the LiDAR; the heights of the
  screens, the glazing, the mesh panels and the shopfront, and of the lower edge of the end over the court,
  are estimated in the photograph. Its roofs are drawn flat at the LiDAR's heights, their falls left out,
  and the atrium's glazed roof with no fall; the rest of the underside of the end over the court, the
  atrium's floor under the glass and the colour of the walls and roofs no photograph shows are estimated,
  and its card says so. The green glass at its corner is drawn brighter than
  the photograph's. Its frames, white columns and strut, the canopies along its north-west face and at its
  south-west end, and a lower roof in the south-east range's north-east corner are not drawn; the atrium's
  open end is drawn as one floor at the street's level, where the LiDAR shows a floor a little above it
  between two stretches of the court. Its entrances are down in the sunken court, 3.5 m below Alfred
  Street, which the map's ground (the 8 m elevation model) does not have: the model stands at a point on
  the street's footpath where the LiDAR's ground is the model's, and there the map's ground covers the
  court's storey, with the shopfront across the atrium's end. The roofs north-west of its north-west range,
  which the LiDAR's cells by its outline take in, are AUSA House's (322, a measured massing beside it), and
  are not drawn as its own.
- **Building 302 of the Science Centre is seen from its south corner only.** One photograph sees the
  tower's south-west and south-east faces and the lower block's two faces to the street corner, with trees
  before its south-east side. Its heights come from the LiDAR; the edges of its glazed corner are estimated
  in the photograph. The tower's south-east face has almost no returns in the LiDAR, so its fins' place,
  spacing and depth are estimated; so are how far the south-west face's glass stands behind its metal, the
  slats, the screens' folded blades and the glazing at the street below the canopy. The screens' folds are
  drawn as plates zigzagging every 2 m, not as the photograph's own pattern; the canopy and the metal bands'
  ribs are not drawn. Its faces to the north-east and north-west, and the screen along its north-west face,
  which no photograph shows, are drawn plainly, and so is the lower wing along its north-east face. The
  campus map's outline of 302 runs 2 to 3 m past that wing, over a valley and the edge of 301's roof, and 5 to
  7 m off the tower beyond the wing's two ends, which the model leaves out.
- **Building 303 of the Science Centre is seen from its street only, and only its face's lower part.** One
  photograph sees the range's face to the street close up through a wide lens, whose bowing it leaves at a few
  pixels; its camera is fitted with the principal point free. Its heights come from the LiDAR; the gaps between
  the face's bands are drawn as dark strips on it, the lowest band's bottom, the canopy's depth and the glazing
  under it are estimated. A large relief of white blocks on the face is an artwork, not drawn after: the band is
  plain there. The slab, the rear block, the wing and their faces, which no photograph shows, are drawn plainly
  at the LiDAR's sizes, the roofs in the aerial's colours. Block 303 is 85.6% under the model: its ring takes in
  a light well, which has no returns, between the wing and the slab.
- **Building 303S of the Science Centre is seen from the south-east only, from far off.** One photograph, from the
  street about 95 m to the south-east through a long lens, sees its face to the street obliquely and the first
  metres of its south-east end; building 302's screens hide the rest of that end. The glass of the face to the
  street has almost no returns in the LiDAR, so the face's line comes from the returns at its top, and the fins'
  places, sizes and spacing, the braces' bars, the storey's height and the spandrel bands on the end are
  estimated. Its back and its north-west end, which no photograph shows, are drawn plainly, and the ground
  storey, hidden in the photograph behind the street's railing, is drawn as glass from the street's level. Its
  entrance is not known: its door is set on the pavement before its face to the street, and it stands on the
  ground it shares with building 303, 0.89 m below the map's ground there. A recess of about a metre in its
  south-east end, which the photograph does not show, is drawn flat.
- **Architecture - West is seen from its north only.** One photograph, from the paved upper level to its north, sees the
  slab's north-east faces and its tower. Its faces turned away, which no photograph shows, are drawn plainly. The
  storeys' height, the parapets and the bands of windows are estimated with the photograph as a reference; the storeys'
  edges stepping out on its north-east faces, the louvres' slats, the deep eave's soffit, the doors' storey's columns,
  the tower's flues, the dormers of its set-back part and the lower parts before that part are not drawn. Its entrance
  is not known from a record: its door is set before the glazed doors the photograph shows, on the paved upper level,
  where the map's ground lies 4.8 m under the LiDAR's. Its south-east end, where it joins Architecture - East, is drawn
  by that building's model. Block 421W is 62.3% under the model: its ring takes in that end, and parts beyond the roofs.
  While a building beside it is open, it gives way to block 421W, which sinks to a footprint on its footing, at most 4 m
  above the lowest ground under it: that footprint stands above the drawn ground on 39% of its cells, by up to 4.3 m.
- **Architecture - East is seen from above its raised terrace only.** One photograph, from a paved deck about 4 m above
  the terrace, sees the main block's face to it and the wing's beside it. The main block's faces turned away from the
  terrace, which no photograph shows, are drawn plainly, and so are the wing's walls below the terrace; the wing's other
  faces have the bands of windows of its face to the terrace. The storeys' height, the parapets, the bands of windows
  and the dormers are estimated with the photograph as a reference; the storeys' edges stepping out on the main block's
  face to the terrace, the louvres' slats, the glazed ground storey behind its columns, and a part reaching out from the
  main block's west end toward Architecture - West are not drawn. Its entrance is not known: its door is set on the
  terrace before the main block's face, where the map's ground lies 4.6 m under the LiDAR's. Block 421E is 54.7% under
  the model: its ring takes in a car park at the ground. While a building beside it is open, it gives way to block 421E,
  which sinks to a footprint on its footing, at most 4 m above the lowest ground under it: that footprint stands above
  the drawn ground on 38% of its cells, by up to 4.3 m.
- **Building 907 is seen from the street to its west-south-west only.** One photograph sees the hall's west-north-west
  end under the arc of its vault, and the annex's two faces at its corner nearest the street. The hall's other end and
  its sides and the annex's other faces, which no photograph shows, are drawn plainly; the band of glazing on the hall's
  end and the annex's windows and doors are placed with the photograph as a reference. The ribs of the hall's cladding,
  the mullions between the glazing's panes, two dark louvred openings high on the hall's end, the canopy over the
  annex's glazed door and a small one against its neck, the cap along its top and the flues beside the hall's end are
  not drawn. Its entrance is not known from a record: its door is set before the glazed door the photograph shows in the
  annex, on the yard, where the map's ground lies 0.7 m under the LiDAR's. While a building beside it is open, it gives
  way to block 907, which sinks to a footprint on its footing, at most 4 m above the lowest ground under it: that
  footprint stands above the drawn ground on 87% of its cells, by up to 1.4 m.
- **Auckland Bioengineering House is seen from Symonds Street only.** One photograph, from the street to its north-west,
  sees the tower's north face with its stone fins and its cut corners, and the entrance at its foot. The tower's other
  faces, which no photograph shows, are drawn as its glass, and the lower building's faces plainly. The second fin's
  place is estimated in the photograph, and its height and depth as the first's; the glass's frames, the recess stepped
  into the north face's west end over several floors, the sloping glazed roof over the entrance, the steps and the ramp,
  and the things on the tower's roof beside its plant room are not drawn. Its door is set on the landing at the top of
  the steps under the building's sign, where the map's ground lies 6.6 m under the LiDAR's. While a building beside it
  is open, it gives way to block 439, which sinks to a footprint on its footing, at most 4 m above the lowest ground
  under it: that footprint stands above the drawn ground on 50% of its cells, by up to 4.6 m.
- **The Sir Owen G Glenn Building is seen from its plaza only, as it was in 2018.** One photograph, from the plaza's
  north edge, sees the curved wing's inner face, the canopy in its curve and its north arm; it was taken before the
  building on the plaza's north-east side, which the LiDAR and the aerial show and the model draws plainly. The
  curved wing's bands go round its other faces as on its inner face, and the other parts are drawn plainly; the
  glass's frames, the louvres' blades, the columns of the open ground storey, the north arm's balconies, the raised
  lawn, and the back's stepped floors over the gully are not drawn. Its door is set on the plaza before the canopy,
  where the map's ground, a slope from the streets down to the gully under the deck, lies 6.2 m under the LiDAR's: the
  site draws the plaza about 6 m lower than it stands. While a building beside it is open, it gives way to block 260,
  which sinks to a footprint on its footing, at most 4 m above the lowest ground under it: that footprint stands above
  the drawn ground on 62% of its cells, by up to 4.4 m.
- **49 Symonds Street is seen from Symonds Street to its east only.** One photograph sees the tower's north-east face,
  the steps of its east corner and the podium before it. Its bays on the street and the back are drawn after the
  north-east face's white face, with its arched window and its windows, and its other faces in glass, as the LiDAR's
  few returns from them have them; the glass's frames, the bays' details, the podium's windows and doors and the
  lower buildings' faces are not drawn, nor a mast on the mansard. Its entrance is not known from a record: its door
  is set before the podium's pointed gable, which the photograph shows over a doorway, on the footpath of Symonds
  Street, where the map's ground lies 7.6 m under the LiDAR's; under the tower the map's ground rises up to 5.3 m over
  the door's, so the site draws the tower's lower storeys in the ground. Block 620 is 51.0% under the model: its ring
  takes in open ground round the lower buildings. While a building beside it is open, it gives way to block 620, which
  sinks to a footprint on its footing, at most 4 m above the lowest ground under it: that footprint stands above the
  drawn ground on 62% of its cells, by up to 4.6 m.
- **Okareta is seen from its front only.** One photograph sees its front from the footpath, much of it in the
  street trees' shade. Its sides and back, the porch behind it and the lower floor at its back are drawn plainly,
  without windows; the verandah's lace and fretwork, the cornices' brackets, the window frames' colour and the
  fence are not drawn. Its entrance is not known from a record: its door is set before the verandah's steps, below
  the front door the photograph shows, on the garden path, where the map's ground lies 4.4 m under the LiDAR's.
  While a building beside it is open, it gives way to block 215, which sinks to a footprint on its footing, at most 4 m
  above the lowest ground under it: that footprint stands above the drawn ground on 78% of its cells, by up to 1.0 m.
- **Building 501 of the M&HS Building is seen from its plaza only.** One photograph, from the plaza to its east, sees
  the tower's east face with its crown and the glazed box at its foot, and glazed links either side. The long block
  and the tower's other faces, which no photograph shows, are drawn plainly in the tower's concrete. The glazed link
  north of the tower is drawn after the photograph, where the LiDAR sees no roof (a glass roof, whose height is
  estimated); the one south of it stands in block 503's ring and is left to that block. Between the block and 502,
  west of the concrete link between them, the LiDAR sees nothing over a strip 6 m wide (a glass roof or an open
  court), which is not drawn. The concrete's boards and bands, the glazing's frames, the balcony rails, the box's
  doors and the things on the roofs are not drawn. Its entrance is not known from a record: its door is set before
  the glass doors the photograph shows in the glazed box, where the map's ground lies 1.3 m under the LiDAR's.
  Block 501 is 60.0% under the model: its ring takes in the plaza east of the tower, over the floors the campus map
  has below its ground, and that strip. Inside the ring the model also draws the south edge of building 502's roof,
  to the edge of 502's ring; the long block's south-west corner stands over the ring of 501C, a basement in the
  campus map.
  While a building beside it is open, it gives way to block 501, which sinks to a footprint on its footing, at most
  4 m above the lowest ground under it: that footprint stands above the drawn ground on 79% of its cells, by up to
  1.7 m.
- **Building 502 of the M&HS Building is seen from the street to its north-east only.** One photograph sees the main
  block's east end and its north face, under the roof's dark skirt. Its other faces and the lower west part's, which no
  photograph shows, are drawn plainly, the west part's with the same skirt; the north face is drawn mid grey for its
  fins and spandrels together, and the fins, the window bays, the east end's panels' joints, the steps and the street's
  canopy are not drawn. The strip of its roof that lies in block 501's ring is drawn by 501's model, and this one stops
  at that strip's edge. Its entrance is not known from a record: its door is set before the middle of the east end, at
  the top of its steps, where the map's ground lies 3.1 m under the LiDAR's. It shares one ground with building 501
  beside it: against the map's ground at its own door it stands 0.92 m higher and 501 0.92 m lower. Block 502 is 87.0%
  under the model. While a building beside it is open, it gives way to block 502, which sinks to a footprint on its
  footing, at most 4 m above the lowest ground under it: that footprint stands above the drawn ground on 61% of its
  cells, by up to 1.6 m.
- **Building 507 of the M&HS Building is seen from across the street to its east-south-east only, at dusk.** One
  photograph sees the street face of its south-east block and the glazed bays north of it. Its other faces, which no
  photograph shows, are drawn plainly in mid grey, and the fins, the windows, the recessed entrance under the street
  face's north end and its column, and the things on the roofs are not drawn; a court in the north-west block, under a
  roof the LiDAR partly sees through (open or glazed), is drawn as roof. The photograph's light, dusk with the windows
  lit from inside, is not drawn: the viewer lights the face from the front. Its roofs run up to 4.9 m past the campus map's outline in places, as the LiDAR has them. Its entrance is not known from a record: its door is set before the
  entrance under the canopy, where the map's ground lies 2.14 m above the LiDAR's. Block 507 is 93.1% under the model.
  While a building beside it is open, it gives way to block 507, which sinks to a footprint on its footing, at most 4 m
  above the lowest ground under it: that footprint stands above the drawn ground on 69% of its cells, by up to 4.2 m.
- **Te Pūtahi Tangata is seen from the street to its north-west only, through the leaves of three plane trees.** One
  photograph sees the hall's glazed front and the north-east block's corner beside it; the trees hide the roof's top
  and all the sky over it, so its likeness was checked by laying the model over the photograph through the camera
  fitted to it, not by a silhouette counted against the sky. The folded roof's plates are drawn 1.4 m deep at the
  front, estimated where the glass meets them in the photograph, and the canopy's depth is estimated in it too; a strip
  along the hall's south-west side and over a passage by the long block is a plate 0.6 m deep, open under it, its depth
  estimated. The long block behind and the north-east block's other faces, which no photograph shows, are drawn plainly;
  the strips across the long block's middle are drawn solid, where the LiDAR sees returns both at their top and on the
  roof under them. The glazing's mullions, the cladding's panels, the hall's glazed roof strips and planted part and the
  things on the roofs are not drawn. Its entrance is not known from a record: its door is set on the plaza before the
  canopy, where the map's ground lies 5.5 m under the LiDAR's. The map's ground falls about 7 m across its site where
  the LiDAR's falls about 11 m, so from the south-east the long block stands about 4 m less over the drawn ground than
  over the real one, and a low roof and a low part by its south-west end stand wholly under the drawn ground, where the
  site does not show them. It stands within 2 m of the Humanities Building and the Music School (0.57 and 0.44 m), but
  the map's ground at their three doors is off the LiDAR's by amounts 4.26 m apart, so each stands on the map's ground
  at its own door, as the Clock Tower and its East Wing do. While a building beside it is open, it gives way to block
  201, which sinks to a footprint on its footing, at most 4 m above the lowest ground under it: that footprint stands
  above the drawn ground on 70% of its cells, by up to 4.6 m.
- **The George Mason Biology Building is seen from the street to its south-east only.** One photograph sees its
  south-east end, through plane trees; the copy the project has is squeezed across (1398 x 953) and was stretched back
  to 16:9 before its camera was fitted, as only so do the LiDAR's pilasters and the end wall's height give one scale
  both ways. Its sky is too faint to count a silhouette against, so its likeness was checked by laying the model over
  the photograph through the camera fitted to it. The end's windows, their sizes and places, and its pilasters' width
  are estimated in the photograph, the upper windows' arched heads drawn square, and the depth of a canopy past its
  north-west end and how far its faces come down, which the LiDAR does not see, are estimated too. Its long sides, its
  north-west end and its wings, which no photograph shows, are drawn plainly; the glazing bars, the dormer over the end,
  the things on the roofs and a flue are not drawn. The campus map's outline is about 3.5 m short at each end of the
  long block and narrower on the south-west: the model follows the LiDAR, past block 106 at both ends. Its entrance is
  not known from a record: its door is set on the pavement before the middle of the south-east end, where the map's
  ground lies 3.0 m under the LiDAR's. Under the model the map's ground rises to 4.0 m above the door's toward the
  north-west end, the LiDAR's to about 2.5 m, so that end stands about 1.5 m less over the drawn ground than over the
  real one. While a building beside it is open, it gives way to block 106, which sinks to a footprint on its footing, at
  most 4 m above the lowest ground under it: that footprint stands above the drawn ground on 65% of its cells, by up to
  2.4 m.
- **Building 505 of the M&HS Building is seen from the main road to its north-east only.** One photograph sees its north
  face and the edge of its east face; it is a level picture cut from a wider one, and a smaller picture laid over its
  corner is left out. The north face's storeys, how far its glazing stands behind its fins and louvres, the fins' top
  and the louvres' spacing, where its end bay and the white wall at its north-east corner stop, the ground floor's
  set-back and its columns there, the end bay's windows and their frames, the east face's glass and its foot, and the
  glazed front and the link under their grey bands are estimated in the photograph; the LiDAR has a shade over the end
  bay's top window west of where the photograph has the window, and it is drawn where the LiDAR has it. On its other
  sides the LiDAR sees the ground under the upper storeys, up to 3.4 m in on the south and deeper under the east end
  toward its south: the ground floor is drawn set back just behind that, by an estimated depth. The atrium's glass roof,
  in vaults across it, is drawn as one slope. Its south face, its west end and the atrium's sides, which no photograph
  shows, are drawn plainly. The campus map's outlines of 505 lie about 7 m north-north-east of the LiDAR's building:
  they take in 10 to 12 m of the plaza north of it and miss up to 4 m of its south side, and 70% of block 505 is under
  the model (85% of the LiDAR's roof in that outline). Block 503 as the site draws it stops short of its own roofs'
  south edges inside 505's outline, and block 504 of a slot up to 2 m wide along the block's west end: once block 505
  gives way to the model, no block draws these (about 330 m², up to 30 m high). Its entrance is not known from a record:
  its door is set on the plaza before the entrance the photograph shows in the north face, where the map's ground lies
  1.2 m over the LiDAR's; at the block's south-west corner, on the street, the map's ground rises 2.5 m over the door's
  where the LiDAR's falls 3.4 m under it, so that corner stands about 6 m less over the drawn ground than over the real
  one. While a building beside it is open, it gives way to block 505, which sinks to a footprint on its footing, at most
  4 m above the lowest ground under it: that footprint stands above the drawn ground on 74% of its cells, by up to 3.1
  m.
- **2-6 Park Ave is seen from Park Avenue only.** One photograph, under an overcast sky, looks along its east face from
  the footpath near its north-east corner; its camera's distance is held by the planted bed's kerb along the footpath,
  where the LiDAR's shrubs end. The balconies' slabs and rails stand at the LiDAR's heights on every side; their slabs'
  depth and the rails' bars and posts, the glazing behind them on the east face and its ground storey's brick and
  windows are estimated in the photograph. The LiDAR sees the ground under the eave on its north, east and south sides:
  the walls are drawn behind it and the balconies, by estimated depths. Of the low parts the campus map's block takes
  in, a one-storey annex on the west and a low part south-west of the block are drawn, the second to the block's outline
  where trees hide its roof; low strips along the walls, up to about 1.5 m wide, are left open. Its other faces, which
  no photograph shows, are drawn plainly. Its entrance is not known from a record: its door is set on the footpath
  before the east face's south end. The map's ground round it stands about 11 m over the LiDAR's (the 8 m elevation
  model is flat at about 80 m there), so the model stands on the drawn ground at its door, 10.9 m higher than the real
  one, as the blocks round it do. While a building beside it is open, it gives way to block 529, which sinks to a
  footprint on its footing: that footprint stands above the drawn ground on all its cells, by up to 0.8 m.
- **The Fisher Building is seen from Waterloo Quadrant only.** Two Street View panoramas see its west
  and south faces; its faces turned north, east and south-east, which no photograph shows, are tan
  brick with their floor bands, and its roofs are flat. Block 804's outline under the trees by its
  entrance, where the LiDAR sees no roof, is not drawn: the lobe on its south-west and the part west
  and north-west of the tower, round its door, about a third of the block's 13.5% that the model
  leaves uncovered each. The car park under its ramp is open, without
  its red columns, and the planting along the ramp's top is not drawn; the depth of the balconies down
  its west side is estimated from a photograph.
- **Landmarks stand on the map's ground, which is not the LiDAR's.** A landmark stands at the
  map's ground under its door, and its walls go down far enough that their foot is nowhere more
  than 0.25 m above that ground (the Clock Tower's, up to 0.2 m). Landmarks side by side share one
  ground instead, at the LiDAR's heights against each other: 9 and 15 Eden Crescent stand 0.45 m, the
  Thomas Building and its Extension 0.31 m, buildings 303 and 303S of the Science Centre 0.89 m, and
  Architecture - West and Architecture - East 0.12 m, off the map's ground at their doors. The Clock Tower and
  its East Wing do not, as the map's ground at their doors is off the LiDAR's by amounts 5.07 m apart:
  each stands on the map's ground at its own door, and their heights against each other are not the
  LiDAR's (the map stands the Clock Tower 5.07 m lower against the wing). Under Old Government House the
  map's ground rises 2.75 m from end to end, more than the LiDAR's: its north-west end stands up to
  1.2 m too deep, and some of its ground-floor windows there are partly under the drawn ground. By the
  Fisher Building the map's ground on Waterloo Quadrant lies about 3 m below the LiDAR's: the side of
  its ramp, a parapet under a metre high on the pavement, goes down to the drawn street and rises 3.8
  to 3.9 m from it, and over the car park the ramp stands 2.6 to 4.6 m above the drawn ground, where
  the LiDAR has it 1.0 to 2.4 m up.
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
