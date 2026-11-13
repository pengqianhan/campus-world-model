# Landmarks drawn from code

The map draws every building by rule from the campus map's outline. A **landmark** is one real
building drawn in detail instead, in three.js from code alone: no photograph, texture image or 3D
model is used. The LINZ 2024 LiDAR gives its sizes, and photographs are the references that each
render is compared with: Street View panoramas for the first thirteen, another photograph of the
building for each one since. No photograph is published.

| | |
| --- | --- |
| ![The Clock Tower from Princes St, drawn from code](landmarks/clocktower-front.jpg) | ![The Clock Tower from along Princes St, with trees from the LiDAR](landmarks/clocktower-street.jpg) |

The site draws each landmark in place of its buildings' blocks when the camera comes near: on the
map in the map's colours, and from a walker's height in its own materials on a computer with a
graphics card. The blocks still answer a click and open on their floors. The geometry and the
textures are made in a worker, the first time they are wanted, so that the page does not stop for
them ([`landmarks/README.md`](../landmarks/README.md), "On the site").

## The landmarks

Each landmark's folder holds its model and a README of its own. "In brief" there says what the
building is, where its sizes come from, how it scores against the LiDAR and the photographs and
what is estimated, with its pictures. They are listed in the order they were made.

- [The Clock Tower](../landmarks/clocktower/README.md#in-brief)
- [Old Government House](../landmarks/old-government-house/README.md#in-brief)
- [The General Library](../landmarks/general-library/README.md#in-brief)
- [Old Choral Hall](../landmarks/old-choral-hall/README.md#in-brief)
- [Maclaurin Chapel](../landmarks/maclaurin-chapel/README.md#in-brief)
- [The Clock Tower East Wing](../landmarks/clock-tower-east-wing/README.md#in-brief)
- [9 Eden Crescent](../landmarks/nine-eden-crescent/README.md#in-brief)
- [15 Eden Crescent](../landmarks/fifteen-eden-crescent/README.md#in-brief)
- [The Fisher Building](../landmarks/fisher-building/README.md#in-brief)
- [The Thomas Building Extension](../landmarks/thomas-building-extension/README.md#in-brief)
- [The Kenneth Myers Centre](../landmarks/kenneth-myers-centre/README.md#in-brief)
- [The Thomas Building](../landmarks/thomas-building/README.md#in-brief)
- [The Music School](../landmarks/music-school/README.md#in-brief)
- [The Kate Edger Information Commons](../landmarks/kate-edger-information-commons/README.md#in-brief)
- [The Humanities Building](../landmarks/humanities-building/README.md#in-brief)
- [Building 302 of the Science Centre](../landmarks/science-centre-302/README.md#in-brief)
- [Building 303 of the Science Centre](../landmarks/science-centre-303/README.md#in-brief)
- [Building 303S of the Science Centre](../landmarks/science-centre-303s/README.md#in-brief)
- [Architecture - West (421W)](../landmarks/architecture-west/README.md#in-brief)
- [Architecture - East (421E)](../landmarks/architecture-east/README.md#in-brief)
- [Building 907](../landmarks/building-907/README.md#in-brief)
- [Auckland Bioengineering House (439)](../landmarks/auckland-bioengineering-house/README.md#in-brief)
- [Sir Owen G Glenn Building (260)](../landmarks/owen-g-glenn-building/README.md#in-brief)
- [49 Symonds Street (620)](../landmarks/49-symonds-street/README.md#in-brief)
- [Okareta (215)](../landmarks/okareta/README.md#in-brief)
- [M&HS Building (501)](../landmarks/mhs-building-501/README.md#in-brief)
- [M&HS Building (502)](../landmarks/mhs-building-502/README.md#in-brief)
- [M&HS Building (507)](../landmarks/mhs-building-507/README.md#in-brief)
- [Te Pūtahi Tangata (201)](../landmarks/te-putahi-tangata/README.md#in-brief)
- [The George Mason Biology Building (106)](../landmarks/george-mason-biology/README.md#in-brief)
- [M&HS Building (505)](../landmarks/mhs-building-505/README.md#in-brief)
- [2-6 Park Ave (529)](../landmarks/2-6-park-ave/README.md#in-brief)
- [Building 114](../landmarks/building-114/README.md#in-brief)
- [67 Symonds Street (619)](../landmarks/67-symonds-street/README.md#in-brief)
- [Fine Arts Studio Block 431](../landmarks/fine-arts-studio-block-431/README.md#in-brief)
- [Fine Arts Studio Block 433](../landmarks/fine-arts-studio-block-433/README.md#in-brief)
- [58 Symonds Street](../landmarks/58-symonds-street/README.md#in-brief)
- [Security](../landmarks/security-409/README.md#in-brief)
- [Building 903](../landmarks/building-903/README.md#in-brief)
- [Structures Hall](../landmarks/structures-hall/README.md#in-brief)

## How they are made

The pipeline and the viewer stay beside the site. To look at the model alone, serve the repository
root (`python3 -m http.server 8765 --bind 127.0.0.1`) and open
`http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=clocktower&view=orbit`.

- The model and the rules the agents worked to: [`landmarks/clocktower/`](../landmarks/clocktower/).
- **Measured massings** ([`landmarks/MASSING.md`](../landmarks/MASSING.md)): plain buildings that a
  program draws from the same LiDAR, with no agent and no photograph: blocks and roofs at the
  measured heights, walls, storeys and windows by the street look's rules. Nineteen are on the site
  (`landmarks/measured/`): on the City campus five plain buildings, and seven of the buildings planned
  as landmarks, which they stand in for until their landmarks come; on the Grafton campus two, and on
  the Newmarket campus five. Building 114, Fine Arts Studio Block 431, Fine Arts Studio Block 433, 58 Symonds Street,
  Security, Building 903 and Structures Hall, seven of the plain buildings, and 67 Symonds Street, which a measured
  massing stood in for, are landmarks now. The other buildings it measures
  keep their blocks, each with its reason
  in `landmarks/measured/exclusions.json`.
- What every landmark shares ([`landmarks/`](../landmarks/README.md)): the kit the models are built
  with, the viewer, and the pipeline (`landmarks/pipeline/run.sh <name>`: measure from the LiDAR,
  collect the Street View references (or fit a photograph's camera), correct their cameras, render and
  score, and place the model
  on the campus map).
- How to make the next landmark: the `landmark-from-code` skill
  ([`.claude/skills/landmark-from-code/`](../.claude/skills/landmark-from-code/SKILL.md)), with the
  method and every agent's brief.
- Street View is used through Google's Map Tiles API with a key of your own; its imagery stays on
  the computer that fetched it and is in no commit. The way of working follows
  [Athenaion](https://github.com/Leonxlnx/athenaion) by Leon Lin.
