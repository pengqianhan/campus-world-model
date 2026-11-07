# Landmark: Architecture - East (421E), drawn from code

Architecture - East, building 421E of the University of Auckland, beside the Grafton Gully: a main block in pale grey
concrete with a pale louvred parapet and a band of windows on each floor of its face to a raised terrace, and along its
top floor, under a grey hipped roof, a face in dark cladding with a row of dormers; a lower wing beside it, and two
towers in the same dark cladding, their tops sloping up. It is drawn in three.js from code alone, sized by the LINZ 2024
LiDAR, and compared with one photograph of it from a paved deck about 4 m above the raised terrace (November 2026). The
kit it is built with, the pipeline, the viewer and how to run them are shared by every landmark:
[`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=architecture-east&view=orbit`
  with the repository root served on port 8765. `site` is true: the site draws it in place of block 421E
  ("On the site", below).
- Run its pipeline: `landmarks/pipeline/run.sh architecture-east [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its
  masks, and so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview`
  do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/architecture-east.json`, `frame`: x south-west (the axis, the bearing of most of the walls, and x is minus
it); y up from 39.56 m NZVD2016, the LiDAR's ground at `door`, on the raised terrace; z north-west; the centre at
x = z = 0. The site falls about 27 m across the crop, from the terrace down to the car park to the east and the
gully beyond it. The walls run in two directions 44.4 degrees apart, as the campus map's outline does (its edges at
-4.4 and 40.0 degrees from x toward z, length-weighted), so `parts/common.js` gives the building two frames of its
own, `W` for the wing and its tower and `E` for the main block and the tall tower (the frames' names, not compass
points: the wing stands east of the main block): `u` along the walls' first direction (in `E`, toward the west; in
`W`, toward the south-west), `w` across it (in `E`, toward the north, the terrace's side; in `W`, toward the
north-west).

Every height in `parts/common.js` was measured before the door was set, above 31.6 m, the median ground in the
crop box; `H` moves each on to the door's ground, 7.96 m higher. The frame's thresholds in the config were lowered
by the same 7.96 m, so the measured frame is the one the model was drawn in (0.000 m, 0.000 degrees).

## Neighbours on the map

- No other landmark stands within 2 m of it, so it stands alone on the map's ground at its door (`../README.md`,
  "Placement").
- Architecture - West (421W) is 8.5% under the model and the Architecture Acoustics Laboratory (422) 3.3%, so
  `building.also` is empty. Block 421E itself is 54.7% under the model: its ring takes in a car park at the
  ground on its east side, which the model does not draw.
- At the main block's west end the LiDAR has returns from 10 to 28 m reaching out 4.5 to 7 m past its face to the
  terrace (u 30 to 37.5, w 9 to 11.7), toward Architecture - West; the model stops at the face.

## The reference

One photograph from a paved deck about 4 m above the raised terrace (its LiDAR ground 43.60 m, the door's 39.56; the
ground steps up between them 16 to 19 m out from the door), about 50 m west-north-west of the tall tower, looking 116
degrees round, sees the main block's face to the terrace obliquely, the wing's face to it and both towers. It is kept on
the maintainer's computer in `refs/photos/` (gitignored), with the picks on it, its fitted camera, its level cut and its
mask. Nothing of it goes into git, and how it is recorded and credited is for the maintainer to decide. No Street View
photograph is used.

Its camera is fitted by `tools/photo_camera.py` to points and lines whose places the LiDAR gives: the two towers'
tops (the tall tower's high edge, at its returns above 36.3 m over the old ground, and the wing's tower's ridge),
and three of the towers' vertical corners. It stands 1.61 m above the LiDAR's ground there, looking 8.9 degrees
up, rolled 1.2 degrees, its field 53.4 degrees across: an rms of 1.33 px. No size is measured from the photograph;
it is a reference for the look, the storeys' height and the faces' parts, and the comparison.

The sky mask is the default. The viewer's light (`light`) is estimated: the photograph is taken on a clear
afternoon, the sun to the north-west on the faces it shows, so the viewer's sun stands at 300 degrees round and
45 up, and the exposure (0.5) is set by the building's brightness against the photograph's.

## Round 0 (November 2026, the lead)

The four parts as blocks at the LiDAR's plans and heights: the wing, its tower, the main block and the
tall tower. Walls in the kit's `claddingPale`, roofs `roofGrey`, the towers `screenGrey`. 94 triangles, 3 draw
calls. Silhouette IoU 0.927 (0.927 in the model's screen box); from above, footprint IoU 0.766 and 50% of the cells
within 0.5 m of the LiDAR's height.

## Round 1's shape (November 2026, the lead)

From the LiDAR's 1 m cells and the returns' p50 in each part:

- **The wing**, its roof at 22.65 m inside a parapet at 23.5 m, 0.3 m wide (estimated), its corner toward the main
  block cut at 45 degrees, square with it.
- **The wing's tower**, its top a plane rising along the wing to 33.6 m at its end, with a lower slope on its
  south-east side, from 28 m at the tower to 25 m.
- **The main block**, its flat roof at 25.74 m, and on it a hipped roof whose ridge runs at 30.1 m; on the
  terrace's side its eave at 28 m over a face down to the flat roof, which runs on as a ledge to the face; a part
  at 25.1 m at its east end on the terrace's side, and a box at 27 m on the flat.
- **The tall tower** out of the hipped roof, its top a plane rising to 36.7 m at its end.

184 triangles, 3 draw calls; no two faces of different materials in one plane. Silhouette IoU 0.942 (0.942 in the
box); from above, 63% of the cells within 0.5 m. (These heights are above 31.6 m, as measured; above the door's
ground each is 7.96 m lower.)

## The faces (step 5, November 2026, the lead)

The LiDAR has few returns on the faces, so what it does not give is estimated, the photograph as a reference:

- **The floors**, every 3.55 m from the terrace's level up to the main block's flat roof, five storeys, and the
  wing's at the same levels.
- **On each floor of the main block's face to the terrace**, a pale louvred parapet 1.1 m tall (the kit's
  `plain`) and over it a band of windows 1.4 m tall (`glass`), standing a few centimetres out of the face.
- **Under the main block's eave on the terrace's side**, a face in the towers' dark cladding (`screenGrey`), and
  out of it, on the ledge, a row of seven dormers 1.6 m wide every 4.1 m, each with its pane, behind a louvred
  parapet along the ledge's edge.
- **Round the wing**, a band of windows 1.4 m tall on each floor (on the site, from the terrace's level up: "On the
  site", below).

A first try, with the parapets in `render` and the windows 1.9 m tall, read dark and orange against the
photograph (the building's luma median 153 against 175); with the parapets in `plain` and the windows 1.4 m tall,
174. Silhouette IoU 0.942 (0.942 in the box). 844 triangles, 5 draw calls.

## On the map (step 7)

- **The door**: the entrance is not known (the campus map records no lobby or entrance in 421E, and no street passes it:
  OpenStreetMap has only footways, steps and a service lane round it, with the Grafton Gully's motorway to the east), so
  the door is on the raised terrace, in the middle of the stretch where it meets the main block's face, 2.5 m out from
  it (u 23, w 7 in frame `E`; (13.12, 20.15) in the view frame), where the LiDAR's ground is 39.56 m (13 returns within
  1 m, p10/p50/p90 39.534/39.558/39.578 m). Along the face the terrace lies at 39.56 to 40.01 m. `door.note` says so.
- The viewer's ground plane now stands at the door's terrace, about 4 m under the ground where the photograph's
  camera stands (12 m under it before):
  silhouette IoU 0.938 (0.938 in the box), the luma median 174 against the photograph's 175. From above: footprint
  IoU 0.824 (the LiDAR's 1,535 m², the model's 1,295, both 1,279; its cells above 2.5 m now counted from the door's
  ground), 63% of the 5,051 cells within 0.5 m (the model's heights minus the LiDAR's p10/p50/p90
  -1.24/-0.04/0.58), the highest point 28.70 m against the LiDAR's 28.63.
- `building.also` is empty.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 421E. 421E's entry
in `landmarks/measured/exclusions.json` (the generator's massing of it failed: its roof cells covered 60% of its
outline, where 85% is asked) has gone; `MASSING.md` lists 421E among the landmarks and counts 33 stand-ins
measured.

- **The foot.** It stands alone, its y = 0 on the map's ground at its door, which lies 4.56 m under the LiDAR's there
  (3.3 to 6.2 m round the building). Its walls go down to FOOT, 9.46 m below the door's ground; the foot check of
  `tests/landmarks.test.ts`, which tests each material's lowest points against the map's ground, passes. The wing's
  bands of windows start at the terrace's floor, as the main block's do: from the two floors below it the lowest band
  stood 4.0 m over the map's ground where it falls away from the terrace. 764 triangles, 5 draw calls.
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofGrey` as
  roofs, as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `claddingPale`, `plain` and `screenGrey` are
  walls.
- **Its card** says "estimated:" and the config's `estimated`, which begins "some heights, with a photograph as a
  reference" and goes on with the storeys' height, the parapets and the bands of windows, the dark face under the
  eave and its dormers, and the faces no photograph shows, drawn plainly or after the ones it shows.
- **The pictures** in `docs/landmarks/`: `architecture-east-front.jpg` and `-above.jpg` are the viewer's renders
  of the model alone, from its terrace and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of
  the site built from this branch, the map near it and a walker's eyes on its terrace.

## Not drawn yet

The storeys' edges stepping out on the main block's face to the terrace (the LiDAR's returns at 12 to 28 m between
w 3 and 5.5); the louvres' slats; the glazed ground storey behind its columns at the terrace; the part reaching out
from the main block's west end; the main block's faces turned away from the terrace, which no photograph shows
(plain), and the wing's walls below the terrace (plain; its other faces have the bands of its face to the
terrace); the car park in the ring's east part.
