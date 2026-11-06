# Landmark: building 302 of the Science Centre, drawn from code

Building 302 of the University of Auckland's Science Centre on Symonds Street, a tower of pale metal and glass
over a lower block wrapped in near-black folded screens, drawn in three.js from code alone and sized by the
LINZ 2024 LiDAR, checked against one photograph from the street corner to its south (November 2026). The kit
it is built with, the pipeline, the viewer and how to run them are shared by every landmark:
[`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=science-centre-302&view=orbit`
  with the repository root served on port 8765. `site` is true: the site draws it in place of block 302
  ("On the site", below).
- Run its pipeline: `landmarks/pipeline/run.sh science-centre-302 [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its
  masks, and so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview`
  do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/science-centre-302.json`, `frame`: x south-west, toward Symonds Street (the axis, the bearing of most
of the walls, the lower block's, and x is minus it); y up from 45.0 m NZVD2016, the median ground in the crop
box and the LiDAR's ground at `door`; z north-west; the centre at x = z = 0. The tower is turned 3.93 degrees
from it, and all its roofs run square with its own faces, so `parts/common.js` gives the tower its own frame
(`a` from its south-west face toward the north-east, `b` from its south-east face toward the north-west, from
its south corner) and `towerAt` and `towerRect` turn it into the view frame.

The points are the building's own. `building.outline` is campus.json's ring, which on the north-east side lies
5 to 7 m outside the tower's walls, 2 to 3 m past the lower wing there, over a valley and the edge of 301's roof:
the plans follow the LiDAR.

## Neighbours on the map

- No other block of the campus map within 80 m has as much as 0.5% of it under the model, so `building.also`
  is empty.
- **Block 302 itself** is 88.3% under the model (85% asked). Of the 316 m² of its ring the model leaves out,
  about 64 lie 2 to 3 m past the lower wing on the north-east side and about 144 beyond the wing's two ends,
  5 to 7 m off the tower (the edge of 301's roof, or no return above 2.5 m); about 92 lie on the south-west and
  south-east sides, where the ring runs 1 to 2.3 m outside the walls, and 17 on the north-west.

## The reference

One photograph from the street corner to its south sees the tower's south-west and south-east faces and the
lower block's two faces to the corner, with trees before its south-east side. It is kept on the maintainer's
computer in `refs/photos/` (gitignored), with the points picked on it, its fitted camera, its level cut and
its mask. Nothing of it goes into git, and how it is recorded and credited is for the maintainer to decide. No
Street View photograph is used (from 2026-11-04 new landmarks use none).

Its camera is fitted by `tools/photo_camera.py` to four corners whose places the LiDAR measures (the tower's
south and west corners at its top, the lower block's south corner and west end at its top, from the hulls of
their returns) and to three verticals picked on the photograph: an rms of 0.77 px, about 63 degrees across,
the principal point at the centre (the photograph is not cropped). The camera stands outside the crop box, so
its height is set above the ground of the whole LiDAR tile there. `photo_fit` keeps the camera through
`refine`.

The edges of the glazed corner are read off the photograph: the step in brightness from the glass to the black
frame round it, along six rows of it on the south-west face and three on the south face, cast through the
camera onto each face's plane. On the south-west face the edge falls 0.513 a metre from 17.0 m at the south
corner, on the south face 0.449 a metre from 17.0 m; the two lines meet at the corner within 0.01 m. The rest
of what the photograph shows is drawn after it but sized by the LiDAR, or estimated where the LiDAR does not
see it (the config's `estimated`).

The sky mask is the default (29.5% of the photograph is sky). The viewer's light (`light`) is estimated: the
photograph is under a bright overcast sky, so its sun stands behind the building from the north, which leaves
both faces the photograph shows in open shade, and the exposure (1.4) is set by the building's brightness
against the photograph's.

## Round 0 (November 2026, the lead)

The tower, a rectangle 44.35 m along its south-west face and 39 m along its south-east face, its main roof at
50.2 m with parapets along its south-west and north-east faces; lower roofs at 46.7 m along its two ends and
over a small annex north of it; and before its south-west face the lower block, flat at 25.5 m, its outer face
leaning away from the tower's. Plain walls down to FOOT, -6.5 m. 200 triangles, 3 draw calls. Silhouette IoU
0.571, 0.900 in the model's screen box; the luma median 150 against 153. From above: footprint IoU 0.803, 60%
of the cells within 0.5 m of the LiDAR's height.

## Round 1's shape and the check (November 2026, the lead)

Round 1 drew the roofs as the LiDAR's cells have them, square with the frame: 81% of the cells within 0.5 m.
The check, each part against its 0.5 m cells, found every edge half a cell to a cell out: the roofs all run
square with the tower, 3.93 degrees off. They are drawn now in the tower's frame, measured again: the main
roof from b 4.55 to 39.7, falling from 50.8 m at its ends to 50.1 m at a band across its middle (two planes);
in the band (b 16.5 to 28.0) a gutter at each side, a court at 46.7 m and three sawtooth ramps, each fitted to
its cells (a plane of slope 0.76 to 0.78, the cells within 0.11 m of it; the cells for 0.3 m before its top
are at its top too, so each is drawn from there, its slope 0.71 to 0.73), rising toward the south-west from 46.72
to 50.6 m, then a block at 51.1 m and a slot with openings to below; a parapet 0.9 m wide at 51.5 m along the
south-west face; a raised strip at 51.3 m along the north-east face with its parapet at 51.8; plant in four
boxes, each to its cells' p90, 53.6 to 53.8 m (their cells are units with gaps between, which the boxes fill;
the medians 53.0 to 53.25); the two lower roofs
each rising from the south-west parapet in a ramp fitted to its cells, with an upstand at 48.0 m along its
face. The north-east face steps out 0.8 m between the lower roofs. The check found, too, that the lower
block's screens run on from its two ends along the tower's end faces, 1.7 and 2 m deep, to 26.0 m (the
returns of the north-west one's outer face at every height from the ground; the photograph shows the
south-east one behind the trees). From above: footprint IoU 0.845, 90% of the cells within 0.5 m (the model's
heights minus the LiDAR's p10/p50/p90 -0.39/0.00/0.09), the highest point 53.25 m against 53.9 (p99.9).

## The faces (step 5, November 2026, the lead)

- **The tower's south-west face**: ribbons of glass between bands of pale metal standing 0.21 m out of them
  (estimated). The LiDAR's returns on the face lie in thin layers, the ribbons' sills and heads, each pair
  1.87 to 1.93 m apart, a storey 4.22 m: 30.27/32.14, 34.49/36.40, 38.72/40.64 and 42.95/44.88 m, and a
  ledge at 46.69 m under a band of slats to the parapet's top; the lowest ribbon, just above the lower block's
  roof, a storey below (26.04/27.91, estimated: the LiDAR has no returns on the face there, and the photograph
  shows that storey open behind posts, which are not drawn yet). That the glass lies between each pair's sill and head is the
  photograph's. The slats, 0.3 m wide and 0.15 m deep every 1.2 m, are estimated from its rhythm.
- **The tower's south-east face**: brown cladding from the screen's top up, and north-east of a flat stretch a
  row of deep brown fins, all estimated: the LiDAR has almost no returns on the face.
- **The lower block** and its screens near-black, with the glazed corner at its south end and a frame along
  the glass's two edges (on the south face to where the screen along the tower's south-east face begins, 2 m
  short of the tower, its face standing just before the block's beyond); on the faces the photograph shows, the screens' blades, plates 0.7 m deep every
  1.8 m, straight from the top and zigzagging below 20 m every 2 m, their folds catching the sky, reaching out
  to the hull of the returns at the block's top (the screens' outer edge), the walls behind them; a top rail;
  the ground storey glazed along Symonds Street below the canopy (all estimated, the photograph as a
  reference). The north-west screen, which it does not show, is plain.
- **Two materials** added to the kit: `screenBlack` and `finBrown`, the paint's shader in two more colours.
  The Clock Tower's, the Kate Edger Information Commons', the Music School's and the Old Choral Hall's viewer
  pictures at `?quality=low` and `?mask=1` are the same pixel for pixel with and without them.

Silhouette IoU 0.589, 0.923 in the box; the luma p10/p50/p90 99/161/180 against the photograph's
102/152/190 (its pixels are dark screens or pale metal, few between, so the median moves the most). From
above: footprint IoU 0.888, 90% of the cells within 0.5 m, the highest point 53.77 m against 53.9 (p99.9).
3,883 triangles, 6 draw calls; no two faces of different materials in one plane.

## The review (November 2026)

- **The lower wing** along the tower's north-east face, which the check had taken for the neighbouring block's
  returns: a roof of its own from b 15.3 to 46.0, out to a 43.3, where a valley at 29.8 m runs before 301's
  walls; a plane fitted to its cells, 32.82 m at the face falling 0.538 a metre to 30.94 (the returns within
  0.16 m of it, p90). The campus map's ring of 302 takes it in, 301's starts beyond it. No photograph shows it:
  it is drawn plainly. Block 302 under the model: 84.2% before it, 88.3% with it; footprint IoU 0.847 to 0.888.
- **The lower block's plan**: the south face's line, moved the blades' depth in, met the hull's short side at
  its south-east end 1 m past it, so the plan crossed itself; it now meets the inner side, inside the south-east screen's slab. The
  top rail and the glazed corner's frame are mitred at the south corner, and the glass and frame on the south
  face stop where the screen along the tower's south-east face begins.

## On the map (step 7)

- **The door** is on the pavement of Symonds Street at (32.15, -11.86), 1.5 m out from the lower block's
  south-west face and 15 m north-west of its south corner, before the glazed ground storey, where the LiDAR's
  ground is the frame's (45.01 m; 12 returns within 1 m, 44.93 to 45.03 from p10 to p90). The pavement falls
  along the face from 46.0 m at the south corner to 42.6 m at the west end, so a door at the corner would
  stand the model about 1 m above the LiDAR's ground. As for the Kate Edger Information Commons, the door
  is where the frame's ground is, every height is kept, and `door.note` says so.
- `building.also` is empty.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 302. 302's
entry in `landmarks/measured/exclusions.json` (the generator's massing of it failed the top-view check, 42% of
its cells within 0.5 m where 90% is asked) has gone; `MASSING.md` lists 302 among the landmarks and counts 37
stand-ins measured.

- **The foot.** The model stands on the map's ground at its door, and its walls go down to FOOT, 6.5 m below
  the frame's ground; `tests/landmarks.test.ts`, which checks that none hangs over the map's ground, passes.
- **The light form** (the map, and the walker views of the basic tier) draws `glassPale` as glass and
  `roofGrey` as roof, as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `screenBlack`, `finBrown`,
  `claddingPale` and `grey` are walls. About's words for the landmarks' materials ("such as ... glass ... and
  metal") cover it.
- **Its card** says "estimated:" and the config's `estimated`, which begins "some heights, with a photograph
  as a reference" and goes on with how far the south-west face's glass stands behind its metal, the sizes and
  spacing of the slats, fins and blades, the glazing at the street, and the colour of the walls no photograph
  shows. The card names the photograph only so (the maintainer, 2026-11-05). There is no `measured_by`.
- **The pictures** in `docs/landmarks/`: `science-centre-302-front.jpg` and `-above.jpg` are the viewer's
  renders of the model alone, from the street corner's side and from above, with no photograph; `-map.jpg` and
  `-eyes.jpg` are shots of the site built from this branch, the map near it and a walker's eyes south of it.

## Not drawn yet

The canopy along the street and the metal bands' ribs; the tower's open storey over the lower block, where the
photograph shows posts under its lowest band; the screens' folds as the photograph's own pattern (they are
drawn as plates zigzagging by a rule); the openings in the slot along the band's north-east end; and the rise
of the main roof in its last few metres toward the south-west parapet (0.6 m in the cells).
