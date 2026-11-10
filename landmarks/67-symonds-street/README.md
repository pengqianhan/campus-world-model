# Landmark: 67 Symonds Street (619), drawn from code

67 Symonds Street, building 619 of the University of Auckland, on the City campus: a white office tower of about eight
storeys over Symonds Street on its south, on a podium that runs down the slope to the gully on its north and west, with
a block turned 45 degrees and plant over its roof and a glass porch over its entrance. It is drawn in three.js from code
alone, sized by the LINZ 2024 LiDAR, and compared with one photograph of its south and east faces from the street
(November 2026). Until now it was a measured massing standing in for it (`../MASSING.md`). The kit it is built with,
the pipeline, the viewer and how to run them are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=67-symonds-street&view=orbit` with
  the repository root served on port 8765. `site` is true: the site draws it in place of block 619 ("On the site",
  below).
- Run its pipeline: `landmarks/pipeline/run.sh 67-symonds-street [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and
  so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/67-symonds-street.json`, `frame`: x east (minus the axis, the bearing of the tower's south face), y up from
63.49 m NZVD2016, the LiDAR's ground at `door`, on the walkway before the entrance's porch, z south, toward the street;
the centre, the mean of the building's returns near the campus map's ring, at x = z = 0. `parts/common.js` gives the
building a frame of its own: `u` west (minus x), along the tower's south face, and `w` south (z).

Every height in `parts/common.js` was measured before the door was set, above 55.66 m, the median ground in the
outline's band; `H` moves each on to the door's ground, 7.83 m higher. The frame's thresholds in the config were
lowered by the same 7.83 m, and `frame.expected` checks the centre and the axis (0.000 m, 0.000 degrees).

The campus's origin is about 620 m to the north-east. There the map's true north and NZTM's grid north differ by
about a degree, and the map's metres and the frame's local NZTM metres lie about 11.5 m apart here: `place` turns one
into the other, as it does for every landmark.

## Neighbours on the map

- No other landmark's outline comes within 2 m of its (the nearest, Auckland Bioengineering House's, is 156 m off), so
  it stands alone on the map's ground at its door (`../README.md`, "Placement").
- The walkway and its canopy before the entrance, and the lower block to the south-west (its roof at 65 m), lie outside
  619's ring: not drawn.
- 99.9% of block 619 is under the model above 2.5 m; `building.also` is empty.

## The reference

One photograph from the street south-east of the tower, under an overcast sky: the tower's south face (its west end
plain, a curved bay of dark glass bands, three columns of windows) and its east face (a louvred panel and three windows
a storey, behind a tree) meeting at its south-east corner, the porch with its glass pyramid and the walkway's canopy
before it, a car park's entry, signs and a passer-by. It has no record of its date. It is kept on the maintainer's
computer in `refs/photos/` (gitignored), with the picks on it, its fitted camera, its level cut and its masks. Nothing
of it goes into git, and how it is recorded and credited is for the maintainer to decide. No Street View photograph is
used.

Its camera is fitted by `tools/photo_camera.py`, its principal point not solved, to lines and points whose places the
LiDAR gives: the tower's south and east roof edges against the sky (the parapet's top at 91.35 m), its south-east and
south-west corners at that height and their verticals. It stands about 57 m from the south-east corner, its field 46.6
degrees across, 1.67 m over the LiDAR's ground: an rms of 2.25 px (the east edge's far picks off by up to 7.5 px, where
a dark panel on the roof meets it). No size is measured from the photograph but the ones the next section names as
estimated; it is a reference for the look and the comparison.

## The model (`parts/common.js`)

- **The tower** (`paint`), its parapet's outer edge at u -19.9 to 5.5 and w -5.65 to 19.65 (the LiDAR's roof returns to
  p99.5), its top at 91.35 m (91.30 to 91.36 along every edge), 0.4 m thick (estimated); its roof inside at 90.3 m
  (`roofGrey`). Its south face goes down to the walls' foot.
- **Over its roof**: a block turned 45 degrees (its sides on u + w = 1.65 and 15.74 and u - w = -18.79 and -6.2) to 96.0
  m, a bar along its south-east side (u -16.6 to 2.1, w 4.6 to 8.6) to 95.8 m, and plant at 92.8 m (u -14.1 to -8.1, w
  -1.0 to 1.9): the LiDAR's returns over 95 m and at 92.8.
- **The podium** (`paint`, its roof `roofGrey`): the campus map's ring, its roof at 72.6 m (the LiDAR's 72.5 to 73.8
  over it), down to the walls' foot; it runs down the slope to the gully on the west, where the ground lies at about 40
  m. Its walls follow the ring (estimated); the LiDAR's roof reaches past it by up to about 1 m in places.
- **The porch**: in the ring's triangle south of the tower's south-east part, the LiDAR has a roof at 71.0 to 72.3 m
  (p50 71.9) over the ground it sees through it (120 returns at 61.9 to 65.4 m): a glass roof (`glass`) from 71.66 to
  72.26 m on the tower's face, open under it. The glass pyramid the photograph shows on it (its top about 74.8 m
  through the photograph's camera) is not drawn.
- **The faces the photograph sees**, through its fitted camera (estimated): storeys 4.04 m apart, the top windows' heads
  0.9 m under the parapet's top and each window 2.46 m tall, five rows seen over the porch; on the south face three
  columns of windows (`glass`; u -9.34 to -7.45, -12.14 to -10.29, -15.16 to -13.17), the curved bay (u -6.38 to -2.24)
  as dark bands from 31.08 to 33.96 m over 55.66 m a storey, and plain panels either side; on the east face a louvred
  panel (`claddingPale`, w 12.55 to 15.13) and three windows (w 9.30 to 11.81, 5.65 to 8.39, 1.89 to 4.66) a storey.
  The rest of the east face, behind the tree, and the faces no photograph shows are drawn plainly.
- The light: the photograph is overcast, its east face brighter than its south. The viewer's sun stands high to the
  north-north-east (15 degrees round, 45 up), at an exposure of 0.62: the luma of the south face's plain panels 143
  against the photograph's 144 and 149, of the east face's 198 against 194 (the compare's figure over the model's screen
  box: 144 against 152).

Silhouette IoU 0.944 in the model's screen box (0.697 over the photograph, whose neighbouring towers, tree and canopy
the model does not draw). The top view: footprint IoU 0.929 (the LiDAR's 1,400 m² against the model's 1,303, both
1,302), 79% of the 5,200 cells both cover within 0.5 m (p10/p50/p90 -1.09/0.05/0.19 m: the parapets and plant on the
roofs make most of the rest); the highest point 32.52 m over the door's ground against the LiDAR's 32.66 (p99.9). 816
triangles, 4 draw calls.

## On the map (step 7)

- **The door**: the campus map records no lobby or entrance in 619. The config's door is on the walkway before the
  entrance's porch, u -12.5 and w 25.0 (in the view frame (12.5, 25.0)), where the walkway has come down from the street
  (66.1 m); the LiDAR's ground within 1 m, 30 returns, p50 63.491 m.
- **The map's ground** (its 8 m elevation model) is 58.52 m at the door, 4.97 m under the LiDAR's, and from 13.3 m lower
  to 0.2 m lower than that under the walls' corners; the model stands its y = 0 on it at the door.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 619. Its measured
massing's data file, `landmarks/measured/buildings/619.json`, has gone: a run of `massing.py` over the City campus
leaves it out, as it does every landmark on the site, and writes every other file as before. `MASSING.md` notes it.

- **The foot.** It stands alone, its y = 0 on the map's ground at its door. Its walls go down to FOOT, 24.53 m under the
  door's ground, under the map's ground at every corner of the walls (the lowest, 13.3 m under the door's, at the
  podium's north-west corner).
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 619, which sinks on
  its footing (`updateLandmarks` in `src/scene/CampusScene.ts`).
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofGrey` as a roof,
  as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `paint` and `claddingPale` are walls.
- **Its card** says "estimated:" and the config's `estimated`.
- **The pictures** in `docs/landmarks/`: `67-symonds-street-front.jpg` and `-above.jpg` are the viewer's renders of the
  model alone, from the street and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of the site
  built from this branch, the map near it and a walker's eyes on the street before the walkway, looking up at the south
  face.

## Not drawn yet

The panels' joints, the windows' frames, the curved bay's curve and its railing, the glass pyramid on the porch, the
dark sloping panel on the roof near the south-east corner, the walkway and its canopy, the signs and the trees; the
podium's parapets and the plant on its roof. The faces no photograph shows are drawn plainly.
