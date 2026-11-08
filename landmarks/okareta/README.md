# Landmark: Okareta (215), drawn from code

Okareta, building 215 of the University of Auckland: a villa of two storeys of the 1880s beside Symonds Street,
rendered and painted a warm yellow ochre under hipped roofs of grey iron, with a verandah across the left of its front
and a canted bay of two storeys on the right. It is drawn in three.js from code alone, sized by the LINZ 2024 LiDAR,
and compared with one photograph of its front from the footpath (November 2026). The kit it is built with, the
pipeline, the viewer and how to run them are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=okareta&view=orbit` with the
  repository root served on port 8765. `site` is true: the site draws it in place of block 215 ("On the site", below).
- Run its pipeline: `landmarks/pipeline/run.sh okareta [stage ...]`. Its reference is read from `refs/photos/` (the
  config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and so the default
  `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/okareta.json`, `frame`: x south-west (minus the axis, the bearing of the house's walls), y up from 36.43 m
NZVD2016, the LiDAR's ground at `door`, on the garden path before the verandah's steps, z north-west, to Symonds
Street; the house's centre, the mean of its returns more than 2.7 m up, at x = z = 0. `parts/common.js` gives the
building a frame of its own: `u` north-east (minus x) and `w` to the street (z).

Every height in `parts/common.js` was measured before the door was set, above 36.16 m, the median ground in the crop
box; `H` moves each on to the door's ground, 0.27 m higher. The frame's thresholds in the config were lowered by the
same 0.27 m, so the measured frame is the one the model was drawn in (0.000 m, 0.000 degrees).

## Neighbours on the map

- No other landmark's outline comes within 2 m of its (beside it 212 Belgrave is a block and 216 Mona a measured
  massing, which joins no ground), so it stands alone on the map's ground at its door (`../README.md`,
  "Placement").
- No other block of the campus map lies under the model above 2.5 m, so `building.also` is empty. Of block 215 itself
  98.7% is under the model above 2.5 m.

## The reference

One photograph from the footpath before the house, looking up at its front through the street trees: the verandah on
the left with three windows arched at their heads over it, the canted bay on the right under its own hipped roof, an
iron fence and a sign before it, much of the front in the trees' shade. It has no record of its date. It is kept on
the maintainer's computer in `refs/photos/` (gitignored), with the picks on it, its fitted camera, its level cut and
its mask. Nothing of it goes into git, and how it is recorded and credited is for the maintainer to decide. No Street
View photograph is used.

Its camera is fitted by `tools/photo_camera.py` to lines and a point whose places the LiDAR gives: the front eave of
the house's north-east part and the north-east eave of its south-west wing, 8.75 m up, that eave's front end, and the
upright front edge of the wing's north-east side, with the camera held 1.6 m over the LiDAR's ground. It stands about
18 m before the front, north-east of its middle, looking 9.1 degrees up, its field 44.9 degrees across: an rms of
0.53 px. Features it was not fitted to fall where the photograph has them: the main ridge within 5 px of the top of
the roof it shows, the front eave's north-east end on the cornice's end. No size is measured from the photograph but
the places and heights of the windows, the door, the bay's face and cornice and the verandah's eave, floor and posts
(below); it is a reference for the look and the comparison.

## Round 0 (November 2026, the lead)

The house at the LiDAR's plans and heights (the highest return in each 0.5 m cell below 12.5 m, as the street trees
stand over its front to 25 m and some of their returns are classed as building):

- **The walls** from the south-west side at u -5.85 to the north-east end at u 6.7, the back of the wing at w -7.0 and
  of the north-east part at w -5.0, the front of the north-east part at w 1.65, down to FOOT (the ground falls 3 m
  behind the house, to a lower floor there), with **a cornice** under the eaves.
- **The south-west wing's hipped roof**, its ridge across the front at u -3.5, 10.7 m, its eaves at 8.7 m, over the
  bay at its front; **the north-east part's**, its ridge along the front at w -1.75, 10.7 m, from the wing's roof to its
  north-east hip; where the two meet, the higher slope shows, as in the valleys the LiDAR has. **A low roof** behind,
  falling from 9.2 to 8.65 m, and **a porch** behind the north-east part, its flat roof at 3.2 m.
- **The verandah** before the north-east part, its outer edge at w 4.3.

Walls in the kit's `trim`, roofs `roofGrey` (grey in the 2023 aerial). 165 triangles, 2 draw calls. Silhouette IoU
0.751 (0.751 in the model's screen box); from above, footprint IoU 0.900 and 81% of the 662 cells within 0.5 m of the LiDAR's height.

## The front and the light (round 1, November 2026, the lead)

- **The windows** arched at their heads (`glass`) in moulded surrounds (`render`): three over the verandah and two
  under it, the front door, two on each storey of the bay's face. Their places and heights are estimated with the
  photograph as a reference: their edges carried through the fitted camera onto the walls' planes (the north-east
  part's front, w 1.65; the bay's face, w 5.15).
- **The bay's face** from u -1.15 to -5.45, where the photograph's windows and corners fall on that plane, its corners
  canted back to the wing's sides; **the cornice** round it between its storeys, 4.95 to 5.75 m.
- **The verandah**: its floor at 1.0 m on a plinth, its roof falling from 5.1 m at the wall to 4.5 at its edge, its
  ceiling, its frieze, six posts and a balustrade open before the door's steps; heights and posts estimated in the
  photograph.
- **The light**: the photograph has no date, and the trees keep most of the front in shade; the viewer's sun stands
  behind the house, 200 degrees round and 40 up, at an exposure of 0.75 (with the sun on the front the ochre turns
  near white).

417 triangles, 4 draw calls; no two faces of different materials in one plane. Silhouette IoU 0.776 (0.776 in the box);
the luma median 130 against the photograph's 126.

## On the map (step 7)

- **The door**: the photograph shows the front door under the verandah (the campus map records no lobby or entrance in
  215, and OpenStreetMap no entrance near it). The door is on the garden path 1.5 m out from the verandah's edge,
  before its steps (u 0.15, w 5.8; (-0.15, 5.8) in the view frame), where the LiDAR's ground is 36.43 m (11 returns
  within 1 m, p10/p50/p90 36.341/36.428/36.508 m). `door.note` says so.
- On this ground: silhouette IoU 0.771 (0.771 in the box: the comparison counts the model from 4 m over the door's
  ground); the luma median 130 against the photograph's 126. From above: footprint IoU 0.900 (the LiDAR's 176 m², the
  model's 179, both 168), 81% of the 662 cells within 0.5 m (the model's heights minus the LiDAR's p10/p50/p90
  -6.79/0.01/0.28: the cells where the model is lower are the trees' over the front), the highest point 10.43 m (the
  ridges) against the LiDAR's 19.71 (p99.9, the trees).
- **The map's ground** (its 8 m elevation model) lies 4.36 m below the LiDAR's at the door, and along the walls, about
  the door's, from 1.23 m below it to 0.27 m above it.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 215. 215's entry in
`landmarks/measured/exclusions.json` (the generator's massing of it failed the top-view check: its footprint had an
IoU of 0.857, and 76% of its cells were within 0.5 m, under its roofs of several ridges and the trees over them) has
gone; `MASSING.md` lists 215 among the landmarks and counts 32 stand-ins measured.

- **The foot.** It stands alone, its y = 0 on the map's ground at its door. Its walls go down to FOOT, 4.17 m under the
  door's ground, below the map's ground under the whole plan: the foot check of `tests/landmarks.test.ts` passes.
- **While a building is open** its neighbours sink to footprints: the site squashes a landmark about its own y = 0 and
  a block about its base, at most 4 m above the lowest ground under it (`squash` in `src/scene/landmarks.ts`,
  `applyFocus` and `baseOf` in `src/scene/CampusScene.ts`). Under the model the map's ground lies from 1.38 m below its
  y = 0 to 0.39 m above it, so beside an open neighbour its footprint shows above the drawn ground on about 93% of its
  cells, by up to 1.43 m, where block 215's showed on 78%, by up to 1.01 m.
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofGrey` as roofs,
  as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `trim` and `render` are walls.
- **Its card** says "estimated:" and the config's `estimated`, which begins "some heights and sizes, with a photograph
  as a reference" and goes on with the cornice's depth, the eaves' overhang and the porches' posts, and the faces no
  photograph shows.
- **The pictures** in `docs/landmarks/`: `okareta-front.jpg` and `-above.jpg` are the viewer's renders of the model
  alone, from the north and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of the site built
  from this branch, the map near it and a walker's eyes on the footpath before it.

## The review (November 2026)

The review's first round found the walls' flat top, at 9.0 m over the crop's median ground, standing above the low
roof behind the house (8.74 m over the back wall) and the north-east part's slope over its back wall (8.97 m): about
4.6 m² of it showed at the back, in the walls' ochre. The walls now stop at 8.5 m, inside the cornice, which fills
the eaves' line under every roof; the low roof's eave is at 8.7 m as the others' (its returns there 8.6 to 8.7), and
its north-east end, which was open, is closed down to the cornice's top. The review after the pull request opened
found its south-west end open too, where it stopped on the wing's eave line: it now runs on under the wing's roof
to u -1.1, where the wing's slope stands over it everywhere (the LiDAR's returns there, 9.14 to 9.18 m, are the low
roof's own). The cornice's top stands 5 mm under the eaves, where it stood 2 cm under them. 419 triangles, 4 draw
calls; the comparison and the top view are as at step 7.

## Not drawn yet

The verandah's lace and fretwork, the cornices' brackets, the window frames' teal and the glazing bars; the iron fence
and the garden; chimneys (the LiDAR shows none above the trees' returns). The faces no photograph shows (its sides and
back, the porch behind it, the lower floor at its back) are drawn plainly, without windows.
