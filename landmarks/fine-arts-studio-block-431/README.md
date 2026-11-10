# Landmark: Fine Arts Studio Block 431, drawn from code

Fine Arts Studio Block 431 of the University of Auckland, on the City campus: a long block of three storeys under a
roof of two pitches with a step between them, its south face over a lane and its car park, a lower annex on its north
side, and at its east end a glass stair tower beside the entrance. It is drawn in three.js from code alone, sized by
the LINZ 2024 LiDAR, and compared with a photograph of its south face from the car park; a second photograph, of its
east entrance, is a reference for the glass there (November 2026). Until now it was a measured massing
(`../MASSING.md`). The kit it is built with, the pipeline, the viewer and how to run them are shared by every
landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=fine-arts-studio-block-431&view=orbit`
  with the repository root served on port 8765. `site` is true: the site draws it in place of block 431 ("On the
  site", below).
- Run its pipeline: `landmarks/pipeline/run.sh fine-arts-studio-block-431 [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and
  so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/fine-arts-studio-block-431.json`, `frame`: x east-north-east (minus the axis, the bearing of the long walls),
y up from 33.09 m NZVD2016, the LiDAR's ground at `door`, under the entrance's canopy at the east end, z
south-south-east, toward the lane; the centre, the mean of the building's returns near the campus map's ring, at x =
z = 0. `parts/common.js` gives the building a frame of its own: `u` west-south-west (minus x), and across the long
faces, which lie 2.0 degrees off the axis, `w'`, the distance from the line through w 0 at u 23.1 that runs with them.

The frame was measured above 33.16 m, the median ground in the outline's band, as the measured massing took it; its
thresholds in the config were raised by the 0.07 m to the door's ground, and `frame.expected` checks the centre and
the axis (0.000 m, 0.000 degrees).

## Neighbours on the map

- No other landmark's outline comes within 2 m of its (the nearest, Auckland Bioengineering House's, is 58 m off), so
  it stands alone on the map's ground at its door (`../README.md`, "Placement").
- Block 432's outline touches 431's on the north-east; 2.8% of it is under the model, and it keeps its block. East of
  the annex the LiDAR's roof at 41.4 to 43.3 m lies inside 432's outline: it is 432's, not drawn here. Block 433, the
  measured massing across the lane, is about 3.3 m off. `building.also` is empty.

## The references

Two photographs, kept on the maintainer's computer in `refs/photos/` (gitignored), with the picks on the first, its
fitted camera, its level cut and its masks. Nothing of them goes into git, and how they are recorded and credited is for
the maintainer to decide. Neither has a record of its date. No Street View photograph is used.

- **The south face**, from the car park at the lane's west end, under broken cloud: the face receding to the east,
  three rows of windows over a ground storey of roller doors, the low box with roller doors before it, cars at the far
  end and a tree beyond. Its camera is fitted by `tools/photo_camera.py`, its principal point solved (`solve_centre`):
  every upright in the photograph stands straight while the eave falls steeply toward the far end, so the camera is
  level, and the photograph is the upper right of a wider frame (the principal point lies just off its left edge). The
  picks are lines and points whose places the LiDAR gives: the south eave against the sky (46.6 m), its east corner,
  the low box's east corner at its top and at the ground (u 11.3, the LiDAR's first returns on its roof), and four
  uprights. It stands about 6 m west of the building's west end and 8 m out from the line of its south face, 1.6 m
  over the LiDAR's ground, through a lens of 78 degrees across, its optical axis at bearing 8 degrees, the photograph
  itself looking north-east along the face: an rms of 0.40 px. Fitted to the low box's corner at u 7.7 instead, it fits
  as well, 6.9 m further east; the LiDAR's corner chooses between them.
- **The east entrance**, under trees: the glass stair tower and the glass canopy over the entrance, with a brick wall
  beside them. No camera is fitted to it; it is a reference for what is glass at the east end, and nothing is measured
  from it.

No size is measured from the photographs but the ones the next section names as estimated; they are references for the
look and the comparison.

## The model (`parts/common.js`)

- **The main block** (`claddingPale`): its roof's edge from the LiDAR's returns, w' -7.9 to 9.0, u -17.0 to 23.15 (and
  -21.2 for its north part, north of w' -4); its long walls where the LiDAR's returns on them peak, about 1.05 m in
  under the eave (the south one at w' 7.95, the north one at -6.85), the end walls 0.35 m in (their returns at u -16.75
  to -16.25), down to the walls' foot.
- **The roof** (`roofPale`, light grey as the 2023 aerial shows it), the LiDAR's returns in 0.5 m strips across the
  faces: the north pitch from 49.9 m at its eave to 51.33 at a step over w' 0, the south pitch from 48.3 at the step to
  46.6 at its eave; east of u -17.0 over w' -4 to 5 one roof falling to the south, from 50.4 m to 48.8; each slab 0.3 m
  thick (estimated), its edges a fascia in the walls' colour.
- **The east end**: the glass stair tower (`glassPale`, glass as the photograph of the east entrance shows it) at
  51.45 m (u -23.25 to -19.65, w 0.35 to 3.1, the LiDAR's returns over 51 m); north of it a lower roof at 50.2 m (u
  -24.3 to -21.2, w -3.5 to 0.35); and the entrance's glass canopy east of that at 36.25 m (16 returns), out of the
  campus map's ring.
- **The annex** on the north side at 42.76 m (737 returns, p50), its north edge the LiDAR's, from w -11.8 at u 3.05 to
  -14.7 at -13.1, the ring's east side (past the ring's north side by up to 2.5 m).
- **The low box** before the south face at 36.3 m, u 11.3 to 19.3 and out to w 11.4 (the LiDAR's returns on its roof;
  the ground in every 0.5 m east of it).
- **The south face**, through the photograph's camera (estimated): columns 0.6 m wide at u 19.17, 14.31, 9.44, 5.05,
  0.53, -3.77, -8.07 and -12.19 (4.1 to 4.9 m apart), from 38.0 m to under the eave, three lights a bay in white frames
  (`paint`, `glassPale`): the upper row from 45.16 to 46.35 m, the middle from 40.07 to 43.97, the ground storey's high
  windows from 36.85 to 38.14 east of the big roller door; the roller doors (`screenSilver`): the big one on the face
  west of the box, from u 20.2 to its west end (its west edge out of the photograph, drawn to 22.9), to 37.1 m; on the
  box one on its front (u 12.5 to 16.0) and one on its west end (w 9.75 to 10.5), to 35.3 m.
- The light: the photograph is taken under broken cloud. The viewer's sun stands to the south-south-east (160 degrees
  round, 50 up), at an exposure of 0.55: over the model's screen box the luma 144 against the photograph's 150; the
  face's panels under the middle windows halfway along it 144 against 149, but near the camera 214 against 168 and
  under the upper windows 216 against 168, where the photograph's face lies in a softer light than the viewer's sun
  gives.

Silhouette IoU 0.952 over the photograph (0.954 in the model's screen box). The top view: footprint IoU 0.927 (the
LiDAR's 910 m² against the model's 872, both 857), 97% of the 3,390 cells both cover within 0.5 m (p10/p50/p90
-0.07/0.02/0.12 m); the highest point 18.36 m over the door's ground against the LiDAR's 18.60 (p99.9); block 431
95.6% under the model. 1,944 triangles, 5 draw calls.

## On the map (step 7)

- **The door**: the campus map records no lobby or entrance in 431. The config's door is under the east entrance's
  glass canopy, u -26.5 and w 1.0 (in the view frame (26.5, 1.0)); the LiDAR's ground within 1 m, 5 returns (the canopy
  hides the rest), p50 33.090 m; the lane before the south face lies at 33.06 to 33.21.
- **The map's ground** (its 8 m elevation model) is 35.89 m at the door, 2.80 m over the LiDAR's, and from 0.01 m to
  3.49 m over that under the walls' corners; the model stands its y = 0 on it at the door.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 431. Its measured
massing's data file, `landmarks/measured/buildings/431.json`, has gone: a run of `massing.py` over the City campus
leaves it out, as it does every landmark on the site, and writes every other file as before. `MASSING.md` notes it.

- **The foot.** It stands alone, its y = 0 on the map's ground at its door. Its walls go down to FOOT, 1.59 m under the
  door's ground, under the map's ground at every corner of the walls (the lowest, 0.01 m over the door's, at the east
  end's south-east corner).
- **Under the drawn ground.** The LiDAR's lane is level along the south face, at the door's ground; the map's 8 m
  ground rises along it from 0.04 m over that at the east end to 0.70 at u -6, 1.74 at the low box's east end, 2.24 at
  its west end and 2.46 at the west end. On the site the face's ground storey stands that much under the drawn ground:
  the low box (3.2 m high) shows 1.0 to 1.5 m of it, its roller doors 0 to 0.4 m, the big roller door about 1.6 m of
  its 4.0 m. The picture from a walker's eyes shows it.
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 431, which sinks on
  its footing (`updateLandmarks` in `src/scene/CampusScene.ts`).
- **The light form** (the map, and the walker views of the basic tier) draws `glassPale` as glass and `roofPale` as a
  roof, as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `claddingPale`, `paint` and `screenSilver` are walls.
- **Its card** says "estimated:" and the config's `estimated`.
- **The pictures** in `docs/landmarks/`: `fine-arts-studio-block-431-front.jpg` and `-above.jpg` are the viewer's
  renders of the model alone, from the car park and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are
  shots of the site built from this branch, the map near it and a walker's eyes in the car park, looking along the
  south face.

## Not drawn yet

The panels' joints, the windows' transoms, the side door at the low box, the plinth and the white units along the
ground storey, the downpipes and the gutter; a recess about 1.4 m deep at the south face's east end, where the LiDAR
sees the ground at w' 6.5 to 6.9; the brick and the windows beside the stair tower, which the photograph of the east
entrance shows; the north face's windows, which no photograph shows; the cars and the trees. The faces no photograph
shows are drawn plainly.
