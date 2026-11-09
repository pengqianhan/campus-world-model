# Landmark: 2-6 Park Ave (529), drawn from code

2-6 Park Ave, building 529 of the University of Auckland, on the Grafton campus: a long block of four storeys under a
thin flat roof with a dark eave standing out over its faces; at each upper storey a balcony along every face on a pale
slab with a light rail; on its east face, on Park Avenue, the glazing behind them and a ground storey of pale grey
brick; on its roof grey plant and a raised part with a red roof. It is drawn in three.js from code alone, sized by the
LINZ 2024 LiDAR, and compared with one photograph of its east face from the footpath of Park Avenue (November 2026). The
kit it is built with, the pipeline, the viewer and how to run them are shared by every landmark:
[`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=2-6-park-ave&view=orbit` with the
  repository root served on port 8765. `site` is true: the site draws it in place of block 529 ("On the site", below).
- Run its pipeline: `landmarks/pipeline/run.sh 2-6-park-ave [stage ...]`. Its reference is read from `refs/photos/`
  (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and so the default
  `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/2-6-park-ave.json`, `frame`: x north-north-east (minus the axis, the bearing of the block's long east face), y
up from 68.87 m NZVD2016, the LiDAR's ground at `door`, on the footpath of Park Avenue before the east face's south end,
z east-south-east, toward Park Avenue; the centre, the mean of the building's returns near the campus map's ring, at x =
z = 0. `parts/common.js` gives the building a frame of its own: `u` south-south-west (minus x), along the east face
toward its south end, and `w` toward Park Avenue (z).

Every height in `parts/common.js` was measured before the door was set, above 68.86 m, the median ground in the first
crop box; `H` moves each on to the door's ground, 0.01 m higher. The frame's thresholds in the config were lowered by
the same 0.01 m, and `frame.expected` checks the centre and the axis.

The campus's origin is about 1 km to the north. There the map's true north and NZTM's grid north differ by about a
degree, and the map's metres and the frame's local NZTM metres lie about 21.7 m apart here: `place` turns one into the
other, as it does for every landmark.

## Neighbours on the map

- No other landmark's outline comes within 2 m of its (none on the site lies within 60 m), so it stands alone on the
  map's ground at its door (`../README.md`, "Placement").
- The campus map's ring of 529 takes in, besides the block, a one-storey annex on its west and a low part south-west of
  it, joined to the block on the map by a sliver: both are drawn. Its other low strips along the block's walls, up to
  about 1.5 m wide (canopies at 3.5 to 6.4 m, and the eave's edge), are left open: 67.5 m² of the LiDAR's roof inside
  the ring, 41 m² of it with no ground seen under it.
- 93.1% of block 529 is under the model above 2.5 m. No other block is under it by half, so `building.also` is empty.

## The reference

One photograph from the footpath of Park Avenue near the block's north-east corner, looking south-south-west along its
east face: four storeys under a dark eave, the balconies of the upper three with their rails, the brick ground storey
behind a planted bed of shrubs and young trees, a sign post and trees in front, and the face's south end against the
sky at the left; an overcast sky. It has no record of its date. It is kept on the maintainer's computer in
`refs/photos/` (gitignored), with the picks on it, its fitted camera, its level cut and its masks. Nothing of it goes
into git, and how it is recorded and credited is for the maintainer to decide. No Street View photograph is used.

Its camera is fitted by `tools/photo_camera.py`, its principal point not solved, to lines and points whose places the
LiDAR gives: the east face's eave (12.45 m over the provisional ground), the top of its south end, the planted bed's
kerb along the footpath, at w 20.0, where the LiDAR's shrubs end, and two verticals. It stands about 8 m out from the
east face, near its north end, its field 36.3 degrees across, 2.15 m over the LiDAR's ground: an rms of 2.28 px. Fitted
to the eave alone, its distance was not held, and the lowest balcony's underside came out at 1.4 m; the kerb holds it,
and the storeys come out about 3.1 m apart, against the LiDAR's 2.95 m: the balconies are drawn at the LiDAR's heights.
No size is measured from the photograph but the ones the next section names as estimated; it is a reference for the look
and the comparison.

## The model (`parts/common.js`)

- **The block**, about 2 degrees off the frame's axis, its corners at the roof's edges NW (-21.9, -12.6), NE (-22.8,
  14.5), SE (20.6, 16.2) and SW (21.4, -11.2) (u, w): a dark eave (`screenGrey`) from 12.0 m to the roof's edge at
  12.45 m (12.4 to 12.5 on every edge); inside it the roof, 12.6 to 13.1 m, drawn as a flat top of 13.0 m
  (`roofGrey`) whose edges stand 1.9 m in from the eave's on the east and west and 3.0 m on the north and south.
- **The walls** (`claddingPale`) stand behind the eave's edge (estimated): 1.8 m on the north, 1.6 m on the east and 1.8
  m on the south, behind the ground the LiDAR sees under the eave (its returns to 1.66, 1.48 and 1.46 m in), and 1.8 m
  on the west, where the ground is hidden; on every side the balconies' slabs reach 1.2 to 1.4 m in from the eave's
  edge. Inside the walls the LiDAR has the roof and no ground.
- **On the roof** plant at 14.6 m (14.4 to 14.8) over u -14 to -5, w -5 to 6 (`renderGrey`); a raised part with a
  flat roof at 17.3 m (17.1 to 17.5), red on the 2023 aerial (`roofTile`), over u 4 to 16, w -3 to 7, and plant on it
  at 18.3 m (17.9 to 18.3) over u 8 to 11, w 2 to 5.
- **The east face**, through the photograph's fitted camera (estimated): the glazing (`glass`) of each upper storey
  behind its balcony; the ground storey in pale grey brick (`renderGrey`) from the north wall to the south wall, its
  windows from 0.9 to 2.9 m under the first slab.
- **The balconies** on every side: the LiDAR has, under the eave from the walls to the eave's edge, three slabs, their
  tops at 3.60, 6.55 and 9.50 m (p50 on each side within 0.02 m; the storeys 2.95 m apart), reaching 1.2 to 1.4 m in,
  and 0.9 m over each a band near the edge (4.50, 7.46 and 10.41 m), the rails' tops. Each slab is drawn from the
  wall to the eave's edge (`claddingPale`), its front 0.5 m deep, and each rail of two bars, at 0.45 and 0.9 m, on
  posts about 3 m apart (`screenSilver`), 0.08 m in from the edge, as the photograph shows them on the east face
  (estimated). On the west the lowest slab runs on up to 1.5 m past the eave's edge, as a canopy: that part is left
  out.
- **The annex** west of the block, one storey, its roof at 3.5 m (its returns 3.48 to 3.53) from u -11 to -5.9 (the
  ring's edge) and out to w -17.3 (the ring's edge; the LiDAR's roof runs to about -17.4), with no ground under it; its
  outer wall at w -16.85, where the LiDAR sees a wall's face (its returns at -16.85 to -17.15) and the ground beyond,
  and its north end at u -10.7, behind a ground return (estimated); its roof over them from 3.2 m. It runs into the
  block's west wall.
- **The low part south-west of the block**, inside the ring (u 9.1 to 23.0, w -23.6 to -30.4): its flat roof at 3.44 m
  (3.40 to 3.49) from the LiDAR from u 9.2 to 22.8 and w -23.7 to -27.6, where trees hide the rest of it, so it is drawn
  to the ring's outer edge, w -29.9 (estimated; the campus map's ground floor has its rooms there). The LiDAR sees the
  ground under its roof's edges, up to 1.0 m in on the north and 0.75 m on the east: its walls stand behind them, its
  roof over them from 3.2 m (estimated).
- The light: the photograph is overcast, its east face in soft light without shadows. The viewer's sun stands behind
  the block (290 degrees round, 40 up), so that the east face takes the sky's light only, at an exposure of 1.0: the
  luma of the east face between the eave and the brick 92 against the photograph's 85, of its brick 87 against 111, of
  its slabs' fronts 147 against 189, of its glazing 85 against 75 (the compare's figure over the model's screen box,
  where the photograph has its bright sky, trees and a sign: 82 against 145).

Silhouette IoU 0.911 in the photograph, 0.956 in the model's screen box. The top view: footprint IoU 0.875 (the
LiDAR's 1,406 m² against the model's 1,301, both 1,263), 89% of the 5,047 cells both cover within 0.5 m
(p10/p50/p90 -0.28/0.00/0.34); the highest point 18.3 m against the LiDAR's 18.15 (p99.9). 2,496 triangles, 7 draw
calls.

## On the map (step 7)

- **The door**: neither the campus map (no lobby or entrance in 529) nor OpenStreetMap (no entrance near it) records an
  entrance. The config's door is on the footpath of Park Avenue before the east face's south end, 0.9 m out from the
  eave's edge, u 17.5 and w 17.0 (in the view frame (-17.5, 17.0)); the LiDAR's ground within 1 m, 13 returns, p50
  68.867 m.
- **The map's ground** (its 8 m elevation model) is flat at about 79.8 m round the block, 10.9 m above the LiDAR's at
  the door. The elevation model has the ground there that high; the blocks round 529 stand on it as the model does,
  so the map shows them together, all about 11 m higher than the real ground.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 529. 529's entry in
`landmarks/measured/exclusions.json` (the generator's massing of it was below the top-view limits: trees over part of
the roof, and its raised part drawn larger than the LiDAR has it) has gone; `MASSING.md` notes it in the Grafton round
and the fourth round, and `massing.py --campus grafton` leaves it out and writes every other Grafton file as before.

- **The foot.** It stands alone, its y = 0 on the map's ground at its door. Its walls go down to FOOT, 2.01 m under the
  door's ground; the map's ground is flat round it, so FOOT is under it everywhere: the foot check of
  `tests/landmarks.test.ts` passes.
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 529, which sinks on
  its footing (`updateLandmarks` in `src/scene/CampusScene.ts`): its footprint stands above the drawn ground on all its
  cells, by up to 0.84 m.
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofGrey` and
  `roofTile` as roofs, as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `claddingPale`, `renderGrey`,
  `screenSilver` and `screenGrey` are walls.
- **Its card** says "estimated:" and the config's `estimated`: the balconies' slabs' depth and their rails' bars and
  posts, the glazing behind them on the east face and its ground storey's brick and windows, with a photograph as a
  reference; how far the walls stand behind the eaves and the balconies, behind where the LiDAR sees the ground under
  them; the low part south-west of the block where trees hide its roof, drawn to the campus map's outline; and the faces
  no photograph shows, drawn plainly.
- **The pictures** in `docs/landmarks/`: `2-6-park-ave-front.jpg` and `-above.jpg` are the viewer's renders of the
  model alone, from Park Avenue and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of the site
  built from this branch, the map near it and a walker's eyes on Park Avenue north-east of it, where the photograph is
  taken.

## Not drawn yet

The balconies' louvred fronts and the canopy on the west, the brick's courses, the windows' frames, the doors, the sign post and the things on the
roof; the planted bed and the trees. The faces no photograph shows (the north, south and west faces, the annex and the
low part south-west of the block) are drawn plainly.
