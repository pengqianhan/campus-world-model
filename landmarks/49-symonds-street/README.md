# Landmark: 49 Symonds Street (620), drawn from code

49 Symonds Street, building 620 of the University of Auckland: an office tower of about thirteen storeys on Symonds
Street whose corners step back, a bay under a gable in the middle of its faces, a mansard on its roof; at its foot to
the east a podium of dark stone with a pointed gable over its entrance, and lower buildings behind it. It is drawn in
three.js from code alone, sized by the LINZ 2024 LiDAR, and compared with one photograph of it from Symonds Street to
its east (November 2026). The kit it is built with, the pipeline, the viewer and how to run them are shared by every
landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=49-symonds-street&view=orbit` with
  the repository root served on port 8765. `site` is true: the site draws it in place of block 620 ("On the site",
  below).
- Run its pipeline: `landmarks/pipeline/run.sh 49-symonds-street [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and
  so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/49-symonds-street.json`, `frame`: x east-north-east (minus the axis, the bearing of the tower's walls), y up
from 56.87 m NZVD2016, the LiDAR's ground at `door`, on the footpath of Symonds Street before the podium's entrance,
z south-south-east, to Symonds Street; the tower's centre, the mean of the returns more than 30 m up, at x = z = 0.
`parts/common.js` gives the building a frame of its own: `u` west-south-west (minus x) and `w` to the street (z).

Every height in `parts/common.js` was measured before the door was set, above 56.79 m, the median ground in the crop
box; `H` moves each on to the door's ground, 0.08 m higher. The frame's thresholds in the config were lowered by the
same 0.08 m, so the measured frame is the one the model was drawn in (0.000 m, 0.000 degrees).

## Neighbours on the map

- No other landmark's outline comes within 2 m of its, so it stands alone on the map's ground at its door
  (`../README.md`, "Placement").
- No other block of the campus map lies under the model above 2.5 m by more than 0.1% (O'Rorke Hall, 614, behind it),
  so `building.also` is empty. Of block 620 itself 51.0% is under the model above 2.5 m, as its ring takes in open
  ground round the lower buildings; of its 6,426 cells where the LiDAR has a roof more than 2.5 m above the door's
  ground, the model covers 92.9%.

## The reference

One photograph from Symonds Street to the building's east, looking west and up at the tower's north-east face: its
gable and arched window in the middle of a white face with a window either side in each storey, the steps of its east
corner in blue glass on the left, smaller steps on the right, and at its foot the podium of dark stone with a pointed
gable over a doorway; O'Rorke Hall behind on the right. It has no record of its date. It is kept on the maintainer's
computer in `refs/photos/` (gitignored), with the picks on it, its fitted camera, its level cut and its mask. Nothing
of it goes into git, and how it is recorded and credited is for the maintainer to decide. No Street View photograph is
used.

Its camera is fitted by `tools/photo_camera.py` to points and lines whose places the LiDAR gives: the apex and the two
feet of the north-east face's gable, the tops of three faces of the east corner's steps, the apex of the gable over
the podium's entrance, and two upright edges. It stands 1.59 m above the ground about 48 m east of the north-east
face, looking 23.3 degrees up, its field 37.6 degrees across: an rms of 2.25 px. Each of the tower's four faces has a
gable in its middle, as the LiDAR shows; which face the photograph sees was told by its stepped corners, the podium at
its foot and O'Rorke Hall behind it. No size is measured from the photograph but the heights of the faces' white
band, dark base and windows and the windows' widths and places (below); it is a reference for the look and the
comparison.

## Round 0 (November 2026, the lead)

Each part a block at the LiDAR's plan and height:

- **The tower**, a square of about 33 m with its corners stepped and a bay 2.8 m out of its street face and 2.2 m out
  of its back, its plan each face's place in the parapet's returns (46.6 to 47.8 m, their 2nd or 98th percentile over
  the face's span), its parapet's top at 47.06 m and its roof inside the parapet at 45.80 m.
- **The mansard** on its roof, walls to its eaves at 49.3 m and slopes up to a flat top at 51.94 m, its plan stepped
  in at the tower's east and west corners as the tower's is, and **the plant** east of it at 49.8 m.
- **A gable** in the middle of each face, its apex the face's highest return, 49.05 to 49.8 m.
- **The podium** to the tower's east, its roof at 7.68 m, with a gable over its entrance to the street at 10.13 m.
- **Three lower buildings** behind the podium and north of it, at 4.59, 5.42 and 3.04 m, their plans the outlines of
  the 0.5 m cells in their bands of heights inside the campus map's ring.

Walls in the kit's `claddingPale`, roofs `roofGrey`. 800 triangles, 2 draw calls. Silhouette IoU 0.788 (0.788 in the
model's screen box) with the first fit of the camera; from above, 80% of the cells within 0.5 m of the LiDAR's height.

## The faces and the light (round 1, November 2026, the lead)

- **The tower's walls** in the kit's `glass` between a base of dark stone (`screenBlack`) to 11.0 m and a white band
  (`claddingPale`) from 45.2 m to the parapet's top, both estimated with the photograph as a reference: their edges on
  the steps' faces through the fitted camera, on the faces' planes.
- **White** where the LiDAR has returns from the walls between 14 and 45 m, which glass gives it few of: the bays on
  the street and the back, all round, and the north-east face but for its north-west end, which the photograph shows
  in glass. The west face shows no returns either, and no photograph: glass.
- **In the middle of each white face**, under its gable, a window 3.2 m wide arched at its top, from 12.0 m to its
  crown at 46.3 m, and either side of it a window 1.8 m high in each of ten storeys 3.35 m apart; one in each storey
  of the bays' sides. Their places on the north-east face are estimated with the photograph as a reference; the bays'
  are drawn after it.
- **The podium and the lower buildings** in the dark stone; **the mansard's flat top** pale (`roofPale`, as the 2023
  aerial shows it), with three units on it to 52.94 m from the LiDAR (a mast to 54.0 m, two returns, is left out).
- **The light**: the photograph has no date and soft light under broken cloud; the viewer's sun stands on the north-east
  face's side, 75 degrees round and 30 up, at an exposure of 0.8.

The camera was refitted with the apex of the gable over the podium's entrance as one more point, which brought the
lower part of the photograph in line. 1,241 triangles, 5 draw calls; no two faces of different materials in one plane.

## On the map (step 7)

- **The door**: the photograph shows a doorway under the pointed gable on the podium's front to Symonds Street (the
  campus map records no lobby or entrance in 620, and OpenStreetMap no entrance near it). The door is on the footpath
  1.5 m out from the gable's front, past the canopy along the podium's front (u -22.4, w 7.0; (22.4, 7.0) in the view
  frame), where the LiDAR's ground is 56.87 m (14 returns within 1 m, p10/p50/p90 56.816/56.872/56.910 m). `door.note`
  says so.
- **The canopy** along the podium's front at 3.06 m, from its returns.
- On this ground: silhouette IoU 0.881 (0.882 in the box, where the photograph shows 49.5% sky); the luma median 134
  against the photograph's 132. From above: 80% of the 5,893 cells within 0.5 m (the model's heights minus the LiDAR's
  p10/p50/p90 -0.23/0.03/1.06), footprint IoU 0.882 (the LiDAR's 1,669 m², the model's 1,523, both 1,496), the highest
  point 52.87 m against the LiDAR's 52.55 (p99.9).
- **The map's ground** (its 8 m elevation model) lies 7.61 m below the LiDAR's at the door, and under the plans, about
  the door's, from 1.55 m below it (by the lowest of the lower buildings) to 5.33 m above it (under the tower, toward
  the street's rise to the south-west).

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 620. 620's entry in
`landmarks/measured/exclusions.json` (the generator's massing of it failed: its roof cells covered 53% of its outline,
where 85% is asked) has gone; `MASSING.md` lists 620 among the landmarks and counts 29 stand-ins measured
(with 421E's, 439's and 260's gone too).

- **The foot.** It stands alone, its y = 0 on the map's ground at its door. Its walls go down to FOOT, 1.88 m under the
  door's ground, below the map's ground under every plan: the foot check of `tests/landmarks.test.ts`, which tests the
  lowest points of each material that comes down to the door's ground against the map's ground, passes. Under the
  tower the map's ground rises up to 5.3 m over the door's, so the site draws the tower's lower storeys in the ground.
  1,289 triangles, 5 draw calls.
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 620, which sinks on
  its footing, at most 4 m above the lowest ground under it (`updateLandmarks` in `src/scene/CampusScene.ts`), and whose
  footprint shows above the drawn ground on 62% of its cells, by up to 4.64 m.
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofGrey` and
  `roofPale` as roofs, as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `claddingPale` and `screenBlack` are
  walls.
- **Its card** says "estimated:" and the config's `estimated`, which begins "some heights and sizes, with a photograph
  as a reference" and goes on with the parapet's width, the gables' depth and the canopy's thickness, and the faces no
  photograph shows.
- **The pictures** in `docs/landmarks/`: `49-symonds-street-front.jpg` and `-above.jpg` are the viewer's renders of the
  model alone, from the east and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of the site built
  from this branch, the map near it and a walker's eyes on Symonds Street to its east.

## The review (November 2026)

The review's first round found the mansard's eaves drawn as a rectangle over the tower's east and west corners, where
the tower steps in and the LiDAR has no mansard: its plan and its top's now step in there as the tower's do (its
returns over 48.5 m in 0.5 m cells), its slopes drawn between the two plans' sides. And the plant runs 0.3 m into the
mansard's walls, as it was meant to; the windows beside the arched ones keep about the mean of the two places
the photograph shows (2.85 to 4.49 and 2.81 to 5.07 m out), 2.8 to 4.7 m out from the middle, kept off the north-east
face's end. Silhouette IoU 0.889 (0.890 in the box), the luma median 135
against the photograph's 132; from above, footprint IoU 0.885 (the LiDAR's 1,669 m², the model's 1,514, both 1,494),
83% of the 5,888 cells within 0.5 m (p10/p50/p90 -0.24/0.02/0.61), the highest point 52.87 m against 52.55; block
620 under the model 51.0%, of its LiDAR roof cells 92.9%. 1,289 triangles, 5 draw calls.

## Not drawn yet

The glass's frames and the panes' mullions; the white faces' details round the arched windows; the podium's windows,
doors and the doorway's arch; the lower buildings' faces; the things on the roofs but the plant and three units; a
mast on the mansard. The faces no photograph shows are drawn after the ones it shows: the bays as the north-east
face's white face, the other faces in glass.
