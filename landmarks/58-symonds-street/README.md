# Landmark: 58 Symonds Street, drawn from code

58 Symonds Street of the University of Auckland, on the City campus: a tower of eight storeys of windows over a dark
ground storey, on a slope that falls from the north-west to the south-east, a deep pale grey band at every floor with
a row of louvres hung under it, a column at each corner and piers between, an upper roof set in from its edge, and on
its street side a core whose roof falls to the street. It is drawn in three.js from code alone, sized by the LINZ 2024
LiDAR, and compared with a photograph of its north-east and north-west faces (November 2026). Until now it was a
measured massing (`../MASSING.md`). The kit it is built with, the pipeline, the viewer and how to run them are shared
by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=58-symonds-street&view=orbit`
  with the repository root served on port 8765.
- Run its pipeline: `landmarks/pipeline/run.sh 58-symonds-street [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and
  so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/58-symonds-street.json`, `frame`: x south-east (minus the axis, the bearing of the long faces), y up from
53.03 m NZVD2016, the LiDAR's ground at `door`, on the platform before the north-east face, z south-west, toward the
street; the centre, the mean of the tower's returns near the campus map's ring, at x = z = 0. `parts/common.js` gives
the building a frame of its own: `u` north-west (minus x) and `w` south-west (z).

The frame was measured above 50.65 m, the median ground in the outline's band, as the measured massing took it; its
thresholds in the config were lowered by the 2.38 m to the door's ground, and `frame.expected` checks the centre and
the axis (0.000 m, 0.000 degrees).

## Neighbours on the map

- No other landmark's outline comes within 2 m of its (the nearest, Fine Arts Studio Block 431's, is about 20 m off,
  and 49 Symonds Street's about 38 m), so it stands alone on the map's ground at its door (`../README.md`, "Placement").
- The model stands over 97.7% of block 435 and over no other block. `building.also` is empty.

## The reference

One photograph, kept on the maintainer's computer in `refs/photos/` (gitignored), with its picks, its fitted camera,
its level cut and its mask. Nothing of it goes into git, and how it is recorded and credited is for the maintainer to
decide. It has no record of its date. No Street View photograph is used.

- **The north-east and north-west faces**, from the ground north of the tower, on a bright day under a thin haze,
  looking south and up: the north-east face on the left, receding to the east corner, the north-west face on the right,
  receding to the west corner; the roof's edge against the sky on both, its apex at the near (north) corner above the
  frame; below, a car park's ramp and a bin enclosure, and a smaller picture laid over the bottom right, left out of the
  fit and the masks. Its camera is fitted by `tools/photo_camera.py` to the tops of seven floor slabs' bands where they
  meet at the north corner (58.8 to 77.04 m, the tops of the LiDAR's returns on the faces, 3.04 m apart) and to both
  faces' roof edges against the sky (80.15 m, the outer slab's top; the roof 2.2 m in, at 83.1 m, fits worse: 2.99 px
  against 0.99), held near 1.6 m over the LiDAR's ground; the photograph is cut off centre, so its principal point is
  solved too. It stands 1.6 m over the LiDAR's ground (54.9 m) about 20 m north of the north corner, through a lens of
  50 degrees across, its optical axis at bearing 180 degrees and 15 degrees up: an rms of 0.99 px over 38 residuals.

No size is measured from the photograph but the ones the next section names as estimated; it is a reference for the
look and the comparison.

## The model (`parts/common.js`)

From the LiDAR:

- **The tower**: its slabs' bands' outer edge (the returns on the faces to p0.5/p99.5) at u -10.7 (south-east) to 13.4
  (north-west) and w -8.6 (north-east) to 8.7 (south-west); the bands' tops about 3.05 m apart, 55.7 to 77.04 m (the
  peaks of the returns on the faces), and the roof's edge at 80.15 m (p90 of the returns round the edge).
- **The upper roof**, 2.2 to 2.4 m in from the edge (u -8.32 to 11.07, w -6.25 to 7.8), at 83.1 m (p50 of 2,662
  returns), a ledge at 80.16 m round it; plant on it at 84.5 to 85.2 m in three boxes (1 m cells of its returns).
- **The street side**: a low block by the south corner (61.83 m), a strip (83.22 m, p50 of 139 returns), a strip on
  the core's north-west (83.22 m), and the core (u -3.53 to 5.86, w 6.68 to 12.11), its roof one slope falling to the
  street, 0.3 m a metre, from 89.25 m at w 7.0 (the returns' p50 in 0.5 m strips run from 89.23 at w 7.0 to 87.75 m at
  w 12.0).
- **The walls' foot**, FOOT, 42.0 m: the ground within 5 m of the walls lies from about 45.8 m along the south-east
  face (p50 47.2) to 53.4 m on the platform before the north-east face, and rises to 55.5 m off the north-west face;
  it falls to about 42.4 m 10 to 12 m south-east of the tower.

Estimated, with the photograph as a reference (`FACE`): each slab's band 0.5 m deep from its top (19 to 20 px at the
photograph's near corner, where the fitted camera puts 0.5 m at 19 to 20 px and 0.7 m at 27 to 28); the window wall
1.2 m behind the bands' outer edge (the LiDAR's returns on the slabs' tops run 1.2 m in from it); a sill panel 0.9 m
high; mullions 1.6 m apart; five slats of louvres under each band; a column 0.9 m square at each corner and piers as
wide on a grid of 6.6 m from the north corner's column (the photograph's piers near u 6.0, -0.8 and -7.0 on the
north-east face and w -1.5 and, behind a tree, near 5 on the north-west); the dark ground storey 1.6 m in under the
lowest band. The faces no photograph shows (south-east and south-west) are drawn on the same grid.

The returns outside the bands' edge are trees near the ground (56 to 62 m, mostly class 5), not the louvres; nothing
stands out past the bands above 62 m.

## The light

The photograph's two faces face north-east and north-west and show about equally bright, so the viewer's sun stands to
the north-north-east (20 degrees round, 45 up), weaker than by default (3, against 8), with a stronger sky (3.2, against
2.25), at an exposure of 0.69 (the config's `light`): over the model's screen box the luma (p50) 177 against the
photograph's 177.

## On the map (step 7)

- **The door**: the campus map records no entrance in 435. The config's door is on the platform before the north-east
  face, 2 m out from its bands' edge and 2.4 m from the north corner, u 11.0 and w -10.6 (in the view frame (-11.0,
  -10.6)), where the photograph shows the ground storey; the LiDAR's ground within 1 m, 14 returns, p50 53.032 m.
- **The map's ground** (its 8 m elevation model) is 43.51 m at the door, 9.52 m under the LiDAR's, and from 2.08 m under
  it to 1.25 m over it under the walls' corners; the model stands its y = 0 on it at the door.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 435. Its measured
massing's data file, `landmarks/measured/buildings/435.json`, has gone: a run of `massing.py` over the City campus
leaves it out, as it does every landmark on the site, and writes every other file as before. `MASSING.md` notes it.

- **The foot.** It stands alone, its y = 0 on the map's ground at its door. Its walls go down to FOOT, 11.03 m under
  the door's ground, under the map's ground at every corner of the walls (the lowest, 2.08 m under the door's, at the
  tower's east corner; 8.95 m to spare).
- **Under the drawn ground.** The real ground falls about 6 m from the door to the tower's south-east side (the
  LiDAR's within 5 m of that face, p50 47.2 m); the map's 8 m ground falls only about 2 m there, so on the site the
  lowest 4 m or so on that side, the lower half of the dark ground storey there, stand under the drawn ground.
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 435, which sinks on
  its footing (`updateLandmarks` in `src/scene/CampusScene.ts`).
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofGrey` and
  `roofPlum` as roofs, as `LIGHT_ROLE` (`src/scene/landmarks.ts`) says (`roofPlum`, the core's roof, is new in the kit
  for it); `claddingPale`, `screenGrey` and `screenBlack` are walls.
- **Its card** says "estimated:" and the config's `estimated`.
- **The pictures** in `docs/landmarks/`: `58-symonds-street-front.jpg` and `-above.jpg` are the viewer's renders of the
  model alone, from the ground to its north and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of
  the site built from this branch: the map near it, and a walker's eyes on the ground to its north.

## Not drawn yet

The louvres' brackets, the windows' opening lights and the blinds behind them, the doors of the ground storey, the bin enclosure, the railings and the ramp before it; a low roof at about 56 m along the south-east side
(u -15.5 to -10.9), outside the campus map's outline; the trees.
