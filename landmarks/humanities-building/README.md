# Landmark: the Humanities Building, drawn from code

The Humanities Building (building 206 of the University of Auckland's campus map), an L of two wings of buff
brick under red clay-tiled roofs beside the CLL Building, drawn in three.js from code alone and sized by the
LINZ 2024 LiDAR, checked against one photograph of the street wing's face to its courtyard (November 2026).
The kit it is built with, the pipeline, the viewer and how to run them are shared by every landmark:
[`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=humanities-building&view=orbit`
  with the repository root served on port 8765. `site` is true: the site draws it in place of block 206
  ("On the site", below).
- Run its pipeline: `landmarks/pipeline/run.sh humanities-building [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its
  masks, and so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview`
  do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/humanities-building.json`, `frame`: x south-east, along the street wing (the axis, the bearing of
most of the walls, and x is minus it); y up from 32.9 m NZVD2016, the median ground in the crop box and the
LiDAR's ground at `door`; z south-west, toward the courtyard; the centre at x = z = 0. Both wings are square
to it.

The points are the building's own. `building.outline` is campus.json's ring, which takes in the courtyard
south-west of the street wing, where there is no building, and lies a few metres outside the LiDAR's walls
on the north-west side: the plans follow the LiDAR's walls.

## Neighbours on the map

- **The CLL Building (207)**: 1.2% of its block under the model, so `building.also` is empty. No other block
  of the campus map within 80 m lies under it. 207's lowest storey, the first floor of its plan, runs on the
  map up to the street wing's face south-east of the entrance (its ring at the bands' face from x 1.9 to 7.0,
  0.1 to 0.4 m behind the glazing from 7.0 to 19.8) and round its south-east corner. The site draws it 3.3 m above the model's ground there (the
  map's ground is 2.6 m below the LiDAR's at the door), so from the courtyard it stands before the brick base
  and the lowest ribbon of windows south-east of the entrance, where the photograph shows them above the
  courtyard; block 206 hid it before.
- **Block 206 itself** is 72.8% under the model, short of the 85% asked: its ring takes in the courtyard.

## The reference

One photograph from the courtyard sees the street wing's face to it: its brick bands and ribbons of windows,
the striped film over most of the panes, the stair's slot and the entrance at its foot, with trees before
both its ends. It is kept on the maintainer's computer in `refs/photos/` (gitignored), with the points picked
on it, its fitted camera, its level cut and its masks. Nothing of it goes into git, and how it is recorded
and credited is for the maintainer to decide. No Street View photograph is used (from 2026-11-04 new
landmarks use none).

Its camera is fitted by `tools/photo_camera.py` to the edges of the bands and the eaves, whose heights the
LiDAR measures, and to verticals picked on the photograph: 1.6 m above the courtyard's ground, an rms of
1.34 px. The lens is wide (about 103 degrees across) and the photograph is cropped, so the principal point is
solved. `photo_fit` keeps the camera through `refine`.

The LiDAR gives the bands' edges on the face, but not the top band's upper edge, which the eave hides from it:
that edge (14.8 m south-east of the stair, 15.1 north-west of it) and the entrance's sides (x -2.0 and 1.3)
are read off the photograph, each cast through the camera onto the face's plane. The sill of the lowest
windows (0.9 m, behind a planter) and the panes' width (1.4 m, from their rhythm) are estimated from it.

The sky mask (`sky_mask` in the config) closes a tree's branches over the eaves (`branches_deg` 1.0). The
viewer's light (`light`) is estimated: the face is in soft light, so its sun stands behind the building from
the courtyard, and the exposure is set by the building's brightness against the photograph's.

## Round 0 (November 2026, the lead)

The LiDAR's roofs: each wing a middle under two low slopes (its ridge at 21.3 m, its eaves at 20.35), hipped
at its outer end; round the outer faces the aisles, falling from a step at 18.2 to 19.1 m to eaves at 16.8 to
17.3; a raised square with a pyramid to 23.9 m over the corner; the angle of the L filled at 20.7; and at the
street wing's south-east end, where the ground is 8 m lower, a low block (eaves 6.2 m, ridge 7.8). Plain
walls down to FOOT, -8.5 m. 273 triangles, 3 draw calls. Against the photograph: silhouette IoU 0.905, 0.936
in the model's screen box; the building's luma median 130 against 133. From above: footprint IoU 0.898, 93%
of the cells within 0.5 m of the LiDAR's height, the highest point 23.9 m against 23.86 (p99.9).

## Round 1 (November 2026, the lead)

- **The face to the courtyard** (`parts/facade.js`): four bands of buff brick at the LiDAR's heights, the top
  one's upper edge and the entrance's sides from the photograph, a brick base under the lowest windows; the
  ribbons of windows set back 0.25 m behind the bands, in dark frames, panes 1.4 m wide, two of every three
  under film in stripes of red, yellow and orange (by a rule: the photograph's are filmed in no rule the eye
  can follow); the stair's slot glazed in dark red frames, flush; the entrance at its foot. The part
  north-west of the slot stands 0.3 m forward, its bands' ends cut along its corner.
- **The walls** in buff brick, the other faces plain: no reference shows them.
- **Four materials** added to the kit: `brickBuff` (the brick's shader in a pale buff) and the film's
  `filmRed`, `filmOrange` and `filmYellow`. The Clock Tower's and the Kate Edger Information Commons'
  viewer pictures at `?quality=low` and `?mask=1` are the same pixel for pixel with and without them.

Silhouette IoU 0.900, 0.931 in the box; the luma median 141 against 133. 6,357 triangles, 9 draw calls.

## The check (November 2026)

Each part's 0.5 m cells against the model's own heights: the aisles, the middles and the low block were
within 0.5 m on 96 to 100% of their cells, the raised corner on 57%. The LiDAR's returns over the corner
above 21.4 m bound an octagon, the corners of a square cut, the north-east one most, along the diagonal; the
pyramid over the whole square stood up to a metre high over the cut corners and in the angle of the L. The
corner's roof is drawn now as the lowest of one plane for each of six sides of the octagon, each rising 0.65 a
metre from its eave (21.3 to 21.9 m), flat at the top at 23.8 m (fitted to the returns: an rms of 0.20 m, 90%
within 0.08); the short north-east and south-east sides have no plane of their own (no return lies on one),
their edges where the slopes beside them meet them, at up to 22.3 m. Under it the square at the aisles' tops, a
roof at 20.95 m in the angle of the L, and the two middles running on under it over the cut corners. The aisles' step on the face to the courtyard is at the stair's
slot, where the cells have it. The corner's cells are within 0.5 m on 96%, the whole building's on 98%; the
highest point 23.8 m against 23.86; footprint IoU 0.898. Silhouette IoU 0.899, 0.930 in the box; the luma
median 141 against 133. 6,589 triangles, 9 draw calls; no two faces in one plane.

The review (November 2026) found two holes under the ends of the aisles' roofs, where they rise above the
walls' tops to the step (up to 0.5 m² each, seen from the angle of the L), and a sliver of the street wing's
middle's open end standing outside the corner's roof: each end is closed now (`aisles()` in `parts/wings.js`,
`hipRoof()` in `parts/shapes.js`), 6,603 triangles.

## On the map (step 7)

- **The door** is on the path along the north-east wing's north-west face at (-18.6, -10.9), 1.45 m out from
  its eave, where the LiDAR's ground is the frame's (32.90 m; 12 returns within 1 m, 32.86 to 32.96 from p10
  to p90). The entrance the photograph shows, at the stair's foot on the courtyard, stands on ground 0.21 to
  0.36 m higher, and the nearest level ground at 32.9 m is this path, 33 m off (14 m south-east of the entrance
  the ground returns within 1 m have a median of 32.9 but span half a metre). So, as for the Kate Edger
  Information Commons, the door is where the frame's ground is, every height is kept, and `door.note` says where
  the entrance is.
- `building.also` is empty (block 207, 1.2%).

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 206. 206's
entry in `landmarks/measured/exclusions.json` (the generator's massing of it failed, its roof cells covering
77% of its outline where 85% is asked) has gone; `MASSING.md` lists 206 among the landmarks and counts 37
stand-ins measured.

- **The foot.** The model stands on the map's ground at its door, 30.29 m, 2.6 m below the LiDAR's there, and
  the walls go down at least 3.74 m below the map's ground under them, so none hangs.
  `tests/landmarks.test.ts` passes.
- **The light form** (the map, and the walker views of the basic tier) draws the film as glass, which
  `LIGHT_ROLE` (`src/scene/landmarks.ts`) now says; `glass` was a pane, `iron` an opening and `roofTile` and
  `roofGrey` roofs already, and the brick and the slot's red frames are walls. About's words for the
  landmarks' materials ("such as ... brick ... glass, ... clay tiles") cover it.
- **Its card** says "estimated:" and the config's `estimated`, which begins "some heights, with a photograph
  as a reference" and goes on with how far the windows stand back, how wide their panes are and which have
  the film, the roofs in the angle of its L, drawn flat, and the colours no photograph shows. The card names
  the photograph only so (the maintainer, 2026-11-05). There is no `measured_by`.
- **The pictures** in `docs/landmarks/`: `humanities-building-front.jpg` and `-above.jpg` are the viewer's
  renders of the model alone, from the courtyard's side and from above, with no photograph; `-map.jpg` and
  `-eyes.jpg` are shots of the site built from this branch, the map near it and a walker's eyes in its
  courtyard.

## Not drawn yet

The north-west part's bands' corners cut at the slot, the slot's depth (about 1 m) and the pattern on its
glass, the eaves' depth as the photograph shows them, the street wing's middle's south-east end as the LiDAR
has it (its hip runs on to x 21 at 19.7 m, its corners cut), and a low covering along the north-east wing's
north-west face (x -21 to -17.4, z -26 to -2, at 3.2 to 3.8 m: sparse returns, about 2 a square metre, and
no reference shows what it is).
