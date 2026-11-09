# Landmark: the George Mason Biology Building (106), drawn from code

The George Mason Biology Building, building 106 of the University of Auckland, on the City campus beside the Thomas
Building: a long block of three storeys in cream render, its walls up to a parapet and a grey attic set back behind it
under a low hipped roof; its middle wider, with two wings to the south-west and raised parts over the roof; and at its
south-east end, on the street, three bays of red-framed windows between pilasters. It is drawn in three.js from code
alone, sized by the LINZ 2024 LiDAR, and compared with one photograph of its south-east end from the street (November
2026). The kit it is built with, the pipeline, the viewer and how to run them are shared by every landmark:
[`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=george-mason-biology&view=orbit`
  with the repository root served on port 8765. `site` is true: the site draws it in place of block 106 ("On the
  site", below).
- Run its pipeline: `landmarks/pipeline/run.sh george-mason-biology [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and
  so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame and the outline

`config/george-mason-biology.json`, `frame`: x south-east (minus the axis, the bearing of the building's long walls,
-44.25 degrees), y up from 36.61 m NZVD2016, the LiDAR's ground at `door`, on the pavement before the south-east end, z
south-west; the centre, the mean of the building's returns within 1.5 m of the campus map's outline and more than 3 m
over the first crop box's ground, at x = z = 0. `parts/common.js` gives the building a frame of its own: `u` north-west
(minus x), along the long walls, and `w` south-west (z).

The campus map's outline for building 106 is about 5 m short at each end of the long block and narrower on its
south-west side, so within 1.5 m of it the data stage and the top view left out the long block's ends and the wings.
The config's `building.outline` is traced from the LiDAR (`building.outline_note`), and campus.json's is kept as
`campus_outline`. The frame measured on the campus map's outline is kept as `frame.expected`: on the traced outline the
data stage measures one 1.26 m and 0.37 degrees from it, and the model, the camera and the placement keep the first.

Every height in `parts/common.js` was measured before the door was set, above 37.30 m, the median ground in the first
crop box; `H` moves each on to the door's ground, 0.69 m lower. The frame's thresholds in the config were raised by
the same 0.69 m.

## Neighbours on the map

- No other landmark's outline comes within 2 m of it (the Thomas Building's is 9.5 m off), so it stands on the map's
  ground at its own door.
- The Overbridge (129) lands on its north-east side; it is a building of its own and is not drawn (10.7% of its block
  lies under the model).
- 98.5% of block 106 is under the model by the top view's count; the model reaches past the block at both ends of the
  long block, as the LiDAR does. No other block is under it by half, so `building.also` is empty.

## The reference

One photograph from the street south-east of the building, square to its south-east end: two floors of red-framed
windows between pilasters over a plain ground floor, the parapet, and the grey attic with a dormer behind it; plane
trees across the top and on both sides, and ivy over the end's south-west corner. It has no record of its date. The copy
the project has is squeezed across (1398 x 953): the pilasters, 3.5 m apart in the LiDAR, and the end wall, 13.1 m
high, give one scale both ways only with its width stretched 1.2117 times, to 16:9, so the reference is that stretched
copy. It is kept on the maintainer's computer in `refs/photos/` (gitignored), with the picks on it, its fitted camera,
its level cut and its mask. Nothing of it goes into git, and how it is recorded and credited is for the maintainer to
decide. No Street View photograph is used.

Its camera is fitted by `tools/photo_camera.py`, with its principal point solved (the picture is cut from a wider one,
its verticals upright), to the end wall's foot, its top and its north-east corner, its two pilasters, and the attic's
top behind the parapet (14.7 m over 37.30 m, 0.9 m behind the wall), the only pick off the wall's plane, which sets
the camera's distance; the camera held near 1.6 m over the LiDAR's ground. It stands about 14.6 m from the end wall
and 24 m south-west of its middle, its lens 109 degrees across, its principal point off the picture to the left: an
rms of 1.39 px. With the picks on the wall alone the fit drew the camera 40 to 50 m away, off the LiDAR's ground.

The sky mask finds almost no sky (2,523 px): the sky is hazy white low down and the leaves cover the rest. So the
silhouette IoU (0.875 in the model's screen box, with no sky in the box) tells little. The check is the camera's fit
and the model laid over the photograph through it: the end wall, its pilasters, its windows, the parapet and the
attic fall on the photograph's.

## The model (`parts/common.js`)

- **The long block**: u -29.1 to 29.4 and w -6.0 to 6.0, its walls to the parapet at 12.3 (the LiDAR's 12.2 to 12.6),
  the attic set back about 0.8 m to its eaves at 14.7 and a low hipped roof to the ridge at 15.8.
- **The middle**, wider on both sides (u -17.0 to 17.0, w -8.8 to 8.8): its walls to 12.5, its attic (w -7.8 to 7.8)
  to 14.4 and its roof to 16.4; over the attic at each end of it a raised part at 17.2 (u -17.5 to -13.0 and 13.0 to
  17.5), each with a vent on its middle at 17.9. A flue at 18.3 to 18.8 (three returns) is not drawn.
- **The two wings** to the south-west (u -17.0 to -10.4 and 10.6 to 17.0, out to w 12.0): their walls to 12.5 and
  their roofs at 14.2. Between them the LiDAR sees open ground about 1 m up, a courtyard, with a low part at 4 to 6
  beside each wing only.
- **The low parts**: a tower at 15.5 and a strip at 12.5 on the north-east side, a part at 6.6 past the north-west end,
  and annexes at 7.0 and 4.1 on the south-west side.
- **The south-east end**, the face the photograph sees: two pilasters 0.25 m proud of it (the LiDAR's), 0.7 m wide
  (estimated), and in each of its three bays two red-framed windows in three lights, 2.6 m wide, the lower from 4.05 to
  6.45 and the upper from 8.3 to 10.55 (estimated, in the photograph through its fitted camera; the upper ones' arched
  heads drawn square).
- The walls cream render (`plain`), the attics and roofs grey (`roofGrey`), the windows `glass` in `frameRed`.
- The light: the end wall is in soft shade under a hazy bright sky; the viewer's sun stands behind the building (250
  degrees round, 35 up), at an exposure of 0.75: a plain stretch of the end wall between the window rows of its
  north-east bay, free of leaves, has a luma of 161 in the render and in the photograph (140 in the photograph in the
  middle bay, in the branches' shade). The metrics' luma over the model's screen box, 161 against 132, takes the
  photograph's leaves, which cover most of it.

The top view: footprint IoU 0.930 (the LiDAR's 1,055 m² against the model's 1,012, both 996), 84% of the 3,945 cells
both cover within 0.5 m (p10/p50/p90 -0.17/0.07/0.38), the highest point 18.60 m over the door's ground against the
LiDAR's 18.59 (p99.9). 1,012 triangles, 4 draw calls.

## On the map (step 7)

- **The door**: its entrance is not known from a record: the campus map has no lobby or entrance for building 106, and
  OpenStreetMap has no entrance within 80 m. The config's door is on the pavement 1 m out from the middle of the
  south-east end, the face on the street that the photograph sees: u -30.1 and w 0 (in the view frame (30.1, 0)); the
  LiDAR's ground within 1 m, 11 returns, 36.55 to 36.65 m (p10 to p90).
- **The map's ground** (its 8 m elevation model) lies 3.03 m under the LiDAR's at the door, and under the model's plans
  from 0.27 m below the door's to 3.95 m above. Under the building the LiDAR's ground rises to about 2.5 m over the
  door's toward the north-west end, so that end stands about 1.5 m less over the drawn ground than over the real one.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 106. 106's entry in
`landmarks/measured/exclusions.json` (the generator's massing of it failed the top-view check, its footprint IoU 0.865
against a limit of 0.9 and 87% of its cells within 0.5 m against 90%) has gone; `MASSING.md` notes it.

- **The foot.** Its y = 0 is the map's ground at its door. Its walls go down to FOOT, 2.31 m under the door's ground,
  below the map's ground under every plan: the foot check of `tests/landmarks.test.ts` passes, as does its faces check.
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 106, which sinks on
  its footing, at most 4 m above the lowest ground under it (`updateLandmarks` in `src/scene/CampusScene.ts`), and whose
  footprint shows above the drawn ground on 65% of its cells, by up to 2.4 m.
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofGrey` as roofs,
  as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `plain` and `frameRed` are walls.
- **Its card** says "estimated:" and the config's `estimated`: the windows of the south-east end, their sizes and
  places, and its pilasters' width, with the photograph as a reference; and the faces no photograph shows.
- **The pictures** in `docs/landmarks/`: `george-mason-biology-front.jpg` and `-above.jpg` are the viewer's renders of
  the model alone, from the street and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of the site
  built from this branch, the map near it and a walker's eyes from the street before its south-east end.

## Not drawn yet

The windows' glazing bars and the upper ones' arched heads, the dormer over the south-east end, the windows of the
long sides, the north-west end and the wings, which no photograph shows (drawn plainly), the things on the roofs and a
flue.
