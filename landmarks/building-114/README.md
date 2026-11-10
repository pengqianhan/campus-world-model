# Landmark: Building 114, drawn from code

Building 114 of the University of Auckland, on the City campus: a long block of two storeys under a flat roof with a
deep eave all round and a raised strip down the middle of its roof; on its south-west face, on a lawn and a car park,
a band of windows under the eave over white cladding, a ground storey of windows between dark posts, and a glass stair
tower with red doors up brick steps. It is drawn in three.js from code alone, sized by the LINZ 2024 LiDAR, and
compared with one photograph of its south-west face from the car park (November 2026). Until now it was a measured
massing (`../MASSING.md`), on the site since the first round (#79). The kit it is built with, the pipeline, the viewer
and how to run them are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=building-114&view=orbit` with the
  repository root served on port 8765. `site` is true: the site draws it in place of block 114 ("On the site", below).
- Run its pipeline: `landmarks/pipeline/run.sh building-114 [stage ...]`. Its reference is read from `refs/photos/`
  (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and so the default
  `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/building-114.json`, `frame`: x south-east (minus the axis, the bearing of the block's long faces), y up from
38.04 m NZVD2016, the LiDAR's ground at `door`, on the path before the steps up to the stair tower's doors, z
south-west, toward the car park; the centre, the mean of the building's returns near the campus map's ring, at x = z =
0. `parts/common.js` gives the building a frame of its own: `u` north-west (minus x), along the long faces, and `w`
toward the south-west (z).

Every height in `parts/common.js` was measured before the door was set, above 38.65 m, the median ground in the
outline's band; `H` moves each on to the door's ground, 0.61 m lower. The frame's thresholds in the config were raised
by the same 0.61 m, and `frame.expected` checks the centre and the axis (0.000 m, 0.000 degrees).

## Neighbours on the map

- No other landmark's outline comes within 2 m of its (the nearest, the Thomas Building's, is 17 m off), so it stands
  alone on the map's ground at its door (`../README.md`, "Placement").
- The LiDAR's roof reaches past the campus map's ring by its eave: on the south-west by 0.9 m (p50; p95 1.9), at the
  ends by 0.4 m (p95 1.4 to 1.9) and on the north-east by 0.2 m (p95 0.5). The model follows the LiDAR. The lower part
  past the south-east end (its roof at 5.4 m) is Lippincott Cottage (118, 801 of its 940 returns inside 118's ring and
  none in 114's), which keeps its own block: it is not drawn.
- 99.2% of block 114 is under the model above 2.5 m. No other block is under it at all, so `building.also` is empty.

## The reference

One photograph from the car park south-west of the building, about 15 m out from its south-west face, before its
south-east half: the two storeys under the deep eave, the stair tower with its red doors and steps, a lawn and plants
along the foot, the south-east end against the sky at the right; a clear day, the sun high. It has no record of its
date. It is kept on the maintainer's computer in `refs/photos/` (gitignored), with the picks on it, its fitted camera,
its level cut and its masks. Nothing of it goes into git, and how it is recorded and credited is for the maintainer to
decide. No Street View photograph is used.

Its camera is fitted by `tools/photo_camera.py`, its principal point not solved, to lines and points whose places the
LiDAR gives: the south-west eave's fascia against the sky (the roof's edge at 8.35 m over the provisional ground), the
eave's south-east corner, and two verticals. It stands about 15 m out from the south-west face at u -11.7, its field
79.8 degrees across, 1.59 m over the LiDAR's ground (held near 1.6 m): an rms of 0.47 px. The ground the LiDAR has just
outside the face and the stair tower's front (the LiDAR's returns on it at u -17.8 to -14.4, its edges in the photograph
through the camera at -18.06 and -14.73) fall where the photograph has them. The photograph sees the face from its
south-east end (u -28.6) to about u -3.1. No size is measured from the photograph but the ones the next section names as
estimated; it is a reference for the look and the comparison.

## The model (`parts/common.js`)

- **The walls** (`paint`), u -28.6 to 28.2 and w -9.0 to 8.1, behind the eave: the LiDAR sees the ground under the
  south-west eave up to w 8.0 (in to 7.7 in places: u -25 to -22, 6 to 14 and 25 to 28) and has returns on that face
  from 8.0 to 8.5, the ground under the north-east eave up to
  -8.87 to -9.25 in each 4 m along it from u -28 to 24 and returns on that wall at -8.99 to -9.20, but in to -8.32 over
  its last 1.7 m by the north corner, where the wall is drawn at -8.3; and returns on the end walls at u
  -28.6 and 28.2 (p50). The ground storey's floor at 0.15 m (the LiDAR's ground inside the stair tower, seen through
  its glass, 38.81 m, p50 of 15; on the landing before its doors 38.75 m).
- **The eave and the roofs**: the roof's edge (u -29.6 to 29.1, w -9.6 to 9.8, the LiDAR's roof cells to p99.5) at
  8.35 m (its returns along the edge 46.97 to 47.07 m), 1.7 m out on the south-west and about 1 m at the ends; its
  underside at 8.0 m (estimated, where the photograph's window heads meet it); the flat roof inside it at 8.55 m
  (`roofPale`, the LiDAR's 47.17 to 47.28 m), and a raised strip down its middle (u -26 to 25, w -4 to 4) at 10.05 m
  (the LiDAR's 48.7 m).
- **The stair tower** on the south-west face (`glassPale`), u -18.0 to -14.5, its front at w 9.3 (the LiDAR's returns
  on it, w 8.9 to 9.5), from the floor to the eave's underside, on a plinth from the walls' foot.
- **A second stair tower** on the part of the south-west face the photograph does not see: the LiDAR's returns at u
  17.35 to 20.65, w 8.96 to 9.39 (p50 9.11), at 1.9 to 5.5 m, at the heights of the first one's transoms and landings,
  and the ground inside its plan at 39.41 m, which it sees through it. It is drawn glass (`glassPale`) from that ground
  to the eave's underside, u 17.2 to 20.8 and out to w 9.2, on a plinth, with no frames (its look estimated). Beside
  it, u 13.8 to 17.15, a canopy from the wall at 3.95 to 4.15 m, out to w 9.2 (`paint`): the LiDAR has 14 returns
  along it at 3.93 to 4.11 m, out to w 9.37 (11 over the plan drawn), with the ground seen under them; its slab's
  thickness is estimated.
- **The south-west face** where the photograph sees it, u -28.6 to -3.1, through its fitted camera (estimated): the
  upper storey's window band from 6.25 to 8.0 m (`glassPale`) with white mullions about 1.17 m apart, the cladding under
  it down to a floor band from 3.4 to 3.8 m, the ground storey's windows from 2.0 to 3.4 m between dark posts (`grey`)
  about 3.2 m apart, white panels under them. On the stair tower's front white mullions and transoms, the red double
  doors (`frameRed`) from the floor to 2.35 m, and brick steps (`brick`) before them, a landing at the floor 1.6 m deep
  and three treads 0.4 m deep, four risers down to the ground at their foot (38.04 m, the LiDAR's p50 of 49), as the
  LiDAR's ground lies before the doors: flat at 38.70 to 38.78 m out to w 10.9, falling to 38.09 by w 12.1.
- The light: a clear day, the face bright and the eave's underside and the ground storey under the floor band in shade.
  The viewer's sun stands high to the west-north-west (300 degrees round, 65 up), so that it falls on the face at a
  glancing angle, at an exposure of 0.92: the luma of the upper storey's cladding 185 against the photograph's 193 left
  of the stair tower and 189 right of it (the compare's figure over the model's screen box: 183 against 173).

Silhouette IoU 0.934 in the photograph, 0.951 in the model's screen box. The top view: footprint IoU 0.942 (the LiDAR's
1,163 m² against the model's 1,141, both 1,117), 99% of the 4,458 cells both cover within 0.5 m (p10/p50/p90
-0.02/0.07/0.18 m); the highest point 10.67 m over the door's ground against the LiDAR's 11.53 (p99.9: the flues and
vents, not drawn). 704 triangles, 6 draw calls.

## On the map (step 7)

- **The door**: the campus map records no lobby or entrance in 114. The config's door is on the path before the foot
  of the brick steps up to the stair tower's red doors, u -16.05 and w 13.0 (in the view frame (16.05, 13.0)); the
  LiDAR's ground within 1 m, 30 returns, p50 38.043 m.
- **The map's ground** (its 8 m elevation model) is 37.21 m at the door, 0.83 m under the LiDAR's, and from 35.6 to
  39.2 m under the walls' corners; the model stands its y = 0 on it at the door.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 114. Its measured
massing's data file, `landmarks/measured/buildings/114.json`, has gone: a run of `massing.py` over the City campus
leaves it out, as it does every landmark on the site, and writes every other file as before. `MASSING.md` notes it.

- **The foot.** It stands alone, its y = 0 on the map's ground at its door. Its walls go down to FOOT, 1.99 m under the
  door's ground, which is under the map's ground at every corner of the walls (the lowest, 35.6 m, at the east corner).
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 114, which sinks on
  its footing (`updateLandmarks` in `src/scene/CampusScene.ts`).
- **The light form** (the map, and the walker views of the basic tier) draws `glassPale` as glass and `roofPale` as a
  roof, as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `paint`, `grey`, `frameRed` and `brick` are walls.
- **Its card** says "estimated:" and the config's `estimated`: the south-west face's window bands, mullions, floor band
  and posts, the stair tower's frames, its red doors and the brick steps before them, the eave's underside, with a
  photograph as a reference; the north-west stair tower's glass, with no frames, and the thickness of the canopy beside
  it, where no photograph reaches; the rest of that face and the other faces, which no photograph shows, drawn plainly.
- **The pictures** in `docs/landmarks/`: `building-114-front.jpg` and `-above.jpg` are the viewer's renders of the
  model alone, from the car park and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of the site
  built from this branch, the map near it and a walker's eyes in the car park south-west of it, where the photograph is
  taken.

## Not drawn yet

The cladding's joints, the windows' frames in the ground storey, the blinds behind the upper windows, the two steel
struts under the south-west eave, the north-west stair tower's frames, the flues on the roof, the plants, the lawn and
the steps' rail; a recess about 1 m wide near the middle of each end, where the LiDAR sees the ground about 1.1 m
inside the end wall; the ground storey's setback on the south-west face, where the LiDAR sees the ground in to w 7.7
under the eave in places (the art bible's "set a little back"; it is drawn flush). The rest of the
south-west face and the other faces, which no photograph shows, are drawn plainly.
