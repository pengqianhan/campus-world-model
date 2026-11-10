# Landmark: Fine Arts Studio Block 431, drawn from code

Fine Arts Studio Block 431 of the University of Auckland, on the City campus: a long block of three storeys under a
roof of two pitches with a step between them, its south face over a lane and its car park, a lower annex on its north
side, and at its east end a glass stair tower beside the entrance. It is drawn in three.js from code alone, sized by
the LINZ 2024 LiDAR, and compared with one photograph of its south face from the car park (November 2026). Until now
it was a measured massing (`../MASSING.md`). The kit it is built with, the pipeline, the viewer and how to run them
are shared by every landmark: [`../README.md`](../README.md).

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
- Block 432's outline touches 431's on the north-east; 2.8% of it is under the model, and it keeps its block. Block
  433, the measured massing across the lane, is 4.0 m off. `building.also` is empty.
- The annex's roof (42.76 m) runs on east of 431's ring at the same height: only the part inside the ring is drawn.

## The reference

One photograph from the car park at the lane's west end, under broken cloud: the south face, receding to the east,
four rows of openings over a ground storey of roller doors, a low box with roller doors before it, cars at the far end
and a tree beyond. It has no record of its date. It is kept on the maintainer's computer in `refs/photos/`
(gitignored), with the picks on it, its fitted camera, its level cut and its masks. Nothing of it goes into git, and
how it is recorded and credited is for the maintainer to decide. No Street View photograph is used.

Its camera is fitted by `tools/photo_camera.py`, its principal point solved (`solve_centre`): every upright in the
photograph stands straight while the eave falls steeply toward the far end, so the camera is level and the photograph
is the upper left of a wider frame. The picks are lines and points whose places the LiDAR gives: the south eave
against the sky (46.6 m), its east corner, the low box's east corner at its top and at the ground, and four uprights.
It stands about 7 m out from the south face near its west end, 1.6 m over the LiDAR's ground, looking east-north-east
along the face through a lens of 88 degrees across: an rms of 0.40 px. No size is measured from the photograph but the
ones the next section names as estimated; it is a reference for the look and the comparison.

## The model (`parts/common.js`)

- **The main block** (`claddingPale`): its roof's edge from the LiDAR's returns, w' -7.9 to 9.0, u -17.0 (the south
  half) or -21.2 (the north half) to 23.15; its walls 0.35 m in under the eave (estimated), down to the walls' foot.
- **The roof** (`roofPale`, light grey as the 2023 aerial shows it), in two pitches, the LiDAR's returns in 0.5 m strips
  across the faces: the north one from 49.9 m at its eave to 51.33 at a step over w' 0, the south one from 48.3 at the
  step to 46.6 at its eave; the slab 0.3 m thick (estimated), its edges a fascia in the walls' colour.
- **The east end**: a flat block at 49.2 m east of the south half (u -21.2 to -17.0); the glass stair tower
  (`glassPale`) at 51.65 m (u -24.4 to -20.0, w -0.5 to 3.5); a lower roof at 50.35 m north of it; and the entrance's glass canopy at
  36.25 m east of the stair tower (18 returns), out of the campus map's ring.
- **The annex** on the north side at 42.76 m (737 returns, p50), its north edge from w -11.8 to -13.4, inside the ring
  (u -13.1 to 3.05).
- **The low box** before the south face at 36.3 m (u 7.7 to 19.3, out to w 11.4): its walls stop at u 17.1 and its
  roof runs on west of them as a canopy, open under it (estimated: through the photograph's camera the big roller door
  stands in the main face's plane there, its head at 37.0 m, which the box's walls would hide).
- **The south face**, through the photograph's camera (estimated): columns 0.55 m wide every 4.38 m (u 20.2 to -14.84),
  three lights a bay in white frames (`paint`, `glassPale`): the upper row from 44.55 to 46.3 m, the middle from 39.77
  to 43.43, the ground storey's high windows from 36.74 to 37.95 east of the big roller door; the roller doors
  (`screenSilver`): the big one on the main face from u 17.15 westward (its west edge out of the photograph, drawn to
  21.9) to 37.0 m, the box's two to 35.27 m (u 8.8 to 11.85 and 16.08 to 16.92).
- The light: the photograph is taken under broken cloud. The viewer's sun stands to the south-south-east (160 degrees
  round, 50 up), at an exposure of 0.38: the luma of the face's panels under the middle windows 145 against the
  photograph's 149, near the camera 182 against 168; over the model's screen box 153 against 150.

Silhouette IoU 0.974 over the photograph (0.977 in the model's screen box). The top view: footprint IoU 0.922 (the
LiDAR's 910 m² against the model's 881, both 859), 95% of the 3,398 cells both cover within 0.5 m (p10/p50/p90
-0.07/0.02/0.14 m); the highest point 18.56 m over the door's ground against the LiDAR's 18.60 (p99.9); block 431
95.8% under the model. 2,082 triangles, 5 draw calls.

## On the map (step 7)

- **The door**: the campus map records no lobby or entrance in 431. The config's door is under the east entrance's
  glass canopy, u -26.5 and w 1.0 (in the view frame (26.5, 1.0)); the LiDAR's ground
  within 1 m, 5 returns (the canopy hides the rest), p50 33.090 m; the lane before the south face lies at 33.06 to
  33.21.
- **The map's ground** (its 8 m elevation model) is 35.89 m at the door, 2.80 m over the LiDAR's, and from 0.02 m under
  to 3.55 m over that under the walls' corners; the model stands its y = 0 on it at the door.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 431. Its measured
massing's data file, `landmarks/measured/buildings/431.json`, has gone: a run of `massing.py` over the City campus
leaves it out, as it does every landmark on the site, and writes every other file as before. `MASSING.md` notes it.

- **The foot.** It stands alone, its y = 0 on the map's ground at its door. Its walls go down to FOOT, 1.59 m under the
  door's ground, under the map's ground at every corner of the walls (the lowest, 0.02 m under the door's, at the stair
  tower's south-east corner).
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 431, which sinks on
  its footing (`updateLandmarks` in `src/scene/CampusScene.ts`).
- **The light form** (the map, and the walker views of the basic tier) draws `glassPale` as glass and `roofPale` as a
  roof, as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `claddingPale`, `paint` and `screenSilver` are walls.
- **Its card** says "estimated:" and the config's `estimated`.
- **The pictures** in `docs/landmarks/`: `fine-arts-studio-block-431-front.jpg` and `-above.jpg` are the viewer's
  renders of the model alone, from the lane and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of
  the site built from this branch, the map near it and a walker's eyes in the car park, looking along the south face.

## Not drawn yet

The panels' joints, the windows' transoms, the side door in the low box, the plinth and the white units along the
ground storey, the downpipes and the gutter; the north and east faces' windows, which no photograph shows; the annex's
roof east of the ring; the cars and the trees. The faces no photograph shows are drawn plainly.
