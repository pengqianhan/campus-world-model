<div align="center">

# Campus World Model

**Unofficial**, student-made 3D maps of university campuses in New Zealand: buildings, floors and
teaching rooms you can fly over, step into and walk round.

**Live site: https://campusworldmodel.com/**

[![Deploy](https://github.com/pengqianhan/campus-world-model/actions/workflows/deploy.yml/badge.svg)](https://github.com/pengqianhan/campus-world-model/actions/workflows/deploy.yml)
[![Code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)

[Schools](#schools) · [Features](#features) · [Quick start](#quick-start) ·
[Documentation](#documentation) · [What's new](#whats-new) · [Contributing](#contributing)

</div>

> [!NOTE]
> This is an unofficial project. No map here is affiliated with, endorsed by or maintained by the
> university it shows, and none uses a university's logo or brand colours: the name, the palette
> and the favicon are the project's own.

![The University of Auckland's City Campus by day](docs/campus-day.jpg)

| Inside a building: floor G of the Science Centre | The same campus at night |
| --- | --- |
| ![A lecture theatre selected on a cut-away floor](docs/room.jpg) | ![The campus at night with lit windows](docs/campus-night.jpg) |

| Behind the walker on Symonds Street | Albert Park at night, through the walker's eyes |
| --- | --- |
| ![The walker from behind on a street with lane lines, kerbs, trees and buildings drawn by rule](docs/walker-street.jpg) | ![A park at night with trees, stars and the city's lit windows beyond](docs/walker-night.jpg) |

The project began as **UoA World Model**, a map of the University of Auckland built to answer two
questions a student actually has:

1. *Which building and floor is my room in?* Type a room code such as `303-G23`, a building name or
   number, and the camera flies to it. Click any building to step inside and browse its floors and
   rooms.
2. *Is a class timetabled in this room right now?* The feature is built and tested, but the site
   shows **no class times yet**: the University's timetable cannot be read without signing in, and
   nothing is made up to fill the gap (see
   [Adding the class timetable](docs/development.md#adding-the-class-timetable)).

## Schools

Each map is unofficial: it is not affiliated with, endorsed by or maintained by the university
named beside it.

| Map | University | Campuses | Shows |
| --- | --- | --- | --- |
| [UoA World Model](https://campusworldmodel.com/uoa/) | University of Auckland | City, Grafton, Newmarket, Tai Tokerau, Tai Tonga, Leigh, Waiheke, Ardmore | Buildings, floors and rooms |
| [AUT World Model](https://campusworldmodel.com/aut/) | Auckland University of Technology | City, North, South | Buildings |
| [VUW World Model](https://campusworldmodel.com/vuw/) | Te Herenga Waka—Victoria University of Wellington | Kelburn, Pipitea, Te Aro | Buildings |
| [Otago World Model](https://campusworldmodel.com/otago/) | University of Otago | Dunedin, Christchurch | Buildings |
| [UC World Model](https://campusworldmodel.com/uc/) | University of Canterbury | Ilam, Dovedale, the Arts Centre | Buildings |
| [Massey World Model](https://campusworldmodel.com/massey/) | Massey University | Manawatū, Auckland, Wellington | Buildings |
| [Waikato World Model](https://campusworldmodel.com/waikato/) | University of Waikato | Hamilton | Buildings |
| [Lincoln World Model](https://campusworldmodel.com/lincoln/) | Lincoln University | Lincoln | Buildings, chosen by OpenStreetMap's tags |

The University of Auckland's map is also at https://pengqianhan.github.io/campus-world-model/.
Every school's sources, licences and limits are in [About](https://campusworldmodel.com/#about),
and what each school publishes and what is closed is recorded in [docs/schools/](docs/schools/).

## Features

- **A rotatable miniature of every campus.** For the University of Auckland, 194 buildings stacked
  floor by floor from the public campus map, on a base of OpenStreetMap streets, parks, trees and
  surrounding buildings, over the real ground.
- **A cut-away view of every building.** Pick a floor and see its lecture theatres, teaching rooms,
  labs, studios and study spaces set in the rest of the floor plan.
- **Search** over 786 learning spaces, 4,573 further rooms, 194 buildings and 251 subject codes.
  Māori names match with or without macrons.
- **Now and Preview.** Auckland time or any day and time, with the academic calendar, the sun where
  it stands, the current weather from Open-Meteo and trees that turn with the seasons.
- **A walker.** A small made-up person to walk, scoot or fly round the campus, seen from above,
  from behind or through its eyes. Coding agents can steer it from the command line or over MCP.
- **Landmarks drawn from code.** Some buildings are drawn in detail in three.js from code alone,
  sized by LiDAR, in place of the blocks drawn by rule.
- **Every view is a link.** Building, floor, room, time and language are all in the URL.
- **A phone layout,** and all interface text in one locale file, ready for more languages.
- **Real or absent.** Every published record traces to a public source, precision is labelled on
  screen, and where no source exists the site shows nothing and says so.

## Quick start

Requires Node 22.18 or newer.

```bash
git clone https://github.com/pengqianhan/campus-world-model.git
cd campus-world-model
npm ci
npm run dev        # http://localhost:5273/campus-world-model/
```

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Production build into `dist/` |
| `npm run e2e` | Playwright tests against the built site |
| `SCHOOL=<id> npm run build` | Build another school's map, such as `SCHOOL=aut`, into `dist-<id>/` |

The site is static: three.js, Preact and Vite, with a data pipeline in TypeScript. Every merge
into `main` is tested and published. Testing, deployment, the layout of the code and how to add a
language are in [docs/development.md](docs/development.md).

## Walk the campus

In the browser, "Take a walk" (or `?walk=1` in the address) puts the walker on the map: W A S D to
walk, Shift to run, a scooter and a drone beside it. An agent that runs shell commands steers the
same walker:

```bash
npm run walker -- look                # buildings round it: distance, direction, what is ahead
npm run walker -- walk 109-305        # a room: into its building, up to its floor, to the room
npm run walker -- see --view eyes     # a picture through its eyes
npm run walker -- help                # every command
```

The same commands are MCP tools (`claude mcp add campus-walker -- node scripts/walker/mcp.ts`). The
controller runs on your computer only. More in [docs/walker.md](docs/walker.md).

## Landmarks drawn from code

The map draws every building by rule from its outline. A **landmark** is one real building drawn in
detail instead, in three.js from code alone: no photograph, texture image or 3D model is used. The
LINZ 2024 LiDAR gives its sizes, photographs are references each render is compared with and are
never published, and each building's card says what is estimated.

| | |
| --- | --- |
| ![The Clock Tower from Princes St, drawn from code](docs/landmarks/clocktower-front.jpg) | ![Old Government House from its lawn, the garden front, drawn from code](docs/landmarks/old-government-house-front.jpg) |

The landmarks are listed in [docs/landmarks.md](docs/landmarks.md). Each has a folder of its own
under [landmarks/](landmarks/README.md), whose README describes it, with its pictures and its scores
against the LiDAR and the photographs.

## What's new

The three latest days are below; everything, with its pull request, is in the
[changelog](CHANGELOG.md).

<details>
<summary><strong>Latest changes</strong></summary>

- **2026-11-14:** the walk's game is now Study Quest: grow by learning, beat made-up study troubles such as the DDL,
  and pass the Final Exam in a boss fight, to music made in the browser that follows the fight; every part of it is
  made up.
- **2026-11-13:** the walk has a game, off until you start it: the walker eats made-up books beside the buildings
  while a made-up Deadline chases it, and six books turn the chase round.
- **2026-11-13:** on the home page, About and the link to the source code stand on the heading's line as plain
  links, where two dark buttons stood above it.
- **2026-11-12:** on the Newmarket campus the map draws Structures Hall in detail, where it stood as a measured
  massing: two long blocks under roofs of one slope with three stacks between them, and a glazed south face over a
  ground storey set back behind piers and braces. Its sizes come from the LiDAR; it was compared with a
  photograph, which is not published, and its card says what is estimated.
- **2026-11-12:** on the Newmarket campus the map draws Building 903 in detail, where it stood as a measured
  massing: a box clad in pale corrugated metal over two glazed storeys set back on piers, under a low roof of two
  slopes. Its sizes come from the LiDAR; it was compared with a photograph, which is not published, and its card
  says what is estimated.
- **2026-11-12:** on the City campus the map draws Security in detail, where it stood as a measured massing: a
  band of pale concrete over a glazed ground storey set back on columns, its south corner cut, with a deck and
  steps before it. Its sizes come from the LiDAR; it was compared with a photograph, which is not published, and
  its card says what is estimated.
- **2026-11-12:** on the City campus the map draws 58 Symonds Street in detail, where it stood as a measured massing:
  a tower of eight storeys of windows over a dark ground storey, a pale band at every floor with louvres hung under it,
  and piers between the windows. Its sizes come from the LiDAR; it was compared with a photograph, which is not
  published, and its card says what is estimated.
- **2026-11-11:** four more buildings are drawn from the LiDAR as measured massings, their roofs at their
  measured heights: Engineering Blocks 1 and 2 on the City campus, Carlton Pines on the Grafton campus and
  Building 908 on the Newmarket campus.
- **2026-11-11:** on the City campus the map draws Fine Arts Studio Block 433 in detail, where it stood as a measured
  massing: a long block of four storeys under a shallow vault, a wall of glazing with coloured panels over a red ground
  storey on its face to the lane, and at its end yellow weatherboards, two balconies and an outside stair. Its sizes
  come from the LiDAR; it was compared with a photograph, which is not published, and its card says what is estimated.
- **2026-11-11:** on the City campus the map draws Fine Arts Studio Block 431 in detail, where it stood as a measured
  massing: a long block of three storeys under a roof of two pitches with a step between them, and on its south face
  over the lane rows of windows between columns over a ground storey of roller doors. Its sizes come from the LiDAR; it
  was compared with a photograph, which is not published, and its card says what is estimated.
- **2026-11-11:** on the City campus the map draws 67 Symonds Street (619) in detail, where a measured massing stood
  for it: a white tower of about eight storeys with its windows, a curved bay of dark glass and louvred panels, on a
  podium down the slope, a block turned on its roof and a glass porch over its entrance. Its sizes come from the
  LiDAR; it was compared with a photograph, which is not published, and its card says what is estimated.
- **2026-11-11:** every school's map has "All schools" in its campus panel, after the campuses: a link back to the
  page that lists every school's map.
- **2026-11-11:** on the City campus the map draws Building 114 in detail, where it stood as a measured massing: a
  long block of two storeys under a deep eave, a band of windows under it over white cladding, and a glass stair
  tower with red doors up brick steps. Its sizes come from the LiDAR; it was compared with a photograph, which is not
  published, and its card says what is estimated.
- **2026-11-11:** "Take a walk" is a game screen on every school's map: the view has the whole screen, with small panels
  in its corners, and the walker can walk, ride a made-up electric scooter at up to 25 km/h, or fly a made-up drone over
  the roofs, up to 120 m above the ground. On the City Campus it starts before the Clock Tower, facing it.
- **2026-11-11:** the map draws 17 Eden Crescent (803) from the LiDAR, as a measured massing: its roofs at their
  measured heights, with the eaves of its main roof.

</details>

## Documentation

| Document | What it covers |
| --- | --- |
| [docs/development.md](docs/development.md) | Running, testing and deploying; the layout of the code; updating the data snapshot; adding the class timetable; adding a language |
| [docs/walker.md](docs/walker.md) | The walker in the browser, from the command line and over MCP |
| [docs/landmarks.md](docs/landmarks.md) | What a landmark is, and the list of them; each one is described in its own folder under `landmarks/` |
| [docs/data-sources.md](docs/data-sources.md) | Every source, what it is used for and its terms, school by school |
| [docs/limitations.md](docs/limitations.md) | What the maps cannot say, and where a drawing is estimated |
| [docs/schools/](docs/schools/) | How schools share one site, and what each school publishes |
| [docs/standards.md](docs/standards.md) | The checks a change passes before it merges |
| [CHANGELOG.md](CHANGELOG.md) | Every change to the site, dated |
| [AGENTS.md](AGENTS.md) | The rules every change keeps, for people and for coding agents |

## Data sources and licences

| Source | Used for | Terms |
| --- | --- | --- |
| [University of Auckland campus maps](https://maps.auckland.ac.nz/) and [Calendar](https://www.auckland.ac.nz/en/about-us/about-the-university/the-university/official-publications/university-calendar/current-calendar.html) | Buildings, floors and rooms; semester dates and subject codes | © University of Auckland. Only derived facts are published |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Surroundings of every campus; the buildings of every other school | © OpenStreetMap contributors, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) |
| [LINZ 8 m Digital Elevation Model](https://data.linz.govt.nz/layer/51768-nz-8m-digital-elevation-model-2012/) | The height of the ground | [CC BY 3.0 NZ](https://creativecommons.org/licenses/by/3.0/nz/) |
| [Auckland LiDAR point cloud (2024)](https://doi.org/10.5069/G9HH6H8T) and LINZ aerial photographs | The sizes of landmarks and measured buildings | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| [Open-Meteo](https://open-meteo.com/) | Current weather, fetched by the visitor's browser | [CC BY 4.0](https://open-meteo.com/en/licence) |
| ["Animated Human" by Quaternius](https://opengameart.org/content/animated-human-low-poly) | The walker's body | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

The full table, with each school's part, the photographs used as references only and what is left
out, is in [docs/data-sources.md](docs/data-sources.md).

The **code** is under the MIT licence (see [LICENSE](LICENSE)). That licence does not cover the
data above; [NOTICE](NOTICE) says so too.

If you represent a university shown here and would like something changed or removed, please open
an issue.

## Known limitations

- **No class times** until a timetable snapshot is added, and a timetabled class is not the same
  as an occupied room.
- **Building heights are estimated and windows are drawn by rule,** except for the landmarks and
  the buildings measured from LiDAR.
- **Only learning spaces are named and can be selected.** Floors where people live and childcare
  centres stay blank.
- **Every school but the University of Auckland shows buildings only,** from OpenStreetMap.
- **The walker knows no doors, gates or fences,** and the academic calendar covers 2026 only.

The full list is in [docs/limitations.md](docs/limitations.md).

## Porting to another university

Most of the code carries over to another campus; the data pipeline and a handful of
Auckland-specific places do not. `.claude/skills/campus-world-model/` is a
[Claude Code](https://claude.com/claude-code) skill that takes an agent through a port: recon of
the new school's public data, rebuilding the pipeline, shipping the site and verifying it live.
Fork or clone this repository, open it in Claude Code and run
`/campus-world-model <university, campus>`. Beside it, `.claude/skills/street-look/` takes the
walker's street-level look to a world model that lacks it, or tunes it for another city:
`/street-look bring` or `/street-look tune`.

## Contributing

Reports and fixes are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md). The rules every change keeps
and the checks it passes are written for people and for coding agents alike, in
[AGENTS.md](AGENTS.md) and [docs/standards.md](docs/standards.md).

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
