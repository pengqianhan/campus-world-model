# Contract: Building 114

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-east (the frame's `-axis`), **y** up from the door's ground (38.04 m NZVD2016, on
  the path before the steps up to the stair tower's doors), **z** south-west
  (`toStreet`); the frame's centre at x = z = 0. `config/building-114.json`, `frame`: the building's returns within
  1.5 m of the campus map's ring, the axis along its long walls (bearing 315.6 deg).
- The building's own frame: **u** north-west (`-x`), along the long walls, **w** south-west (`z`). `parts/common.js`
  gives `at` and `plan`, and `H`, which turns a height measured above 38.65 m (the median ground in the outline's band)
  into one above the door's ground (0.61 m lower).
- What the LiDAR shows (`parts/common.js` holds the numbers): one long block of two storeys, its walls (u -28.6 to 28.2,
  w -9.0 to 8.1) under a flat roof with a deep eave all round, the roof's edge at 8.35 (u -29.6 to 29.1, w -9.6 to 9.8:
  1.7 m out on the south-west, about 1 m at the ends, 0.6 m on the north-east), the flat roof at 8.55 inside it and a
  raised strip down its middle at 10.05 (u -26 to 25, w -4 to 4); a glass stair tower on the south-west face (its
  front's returns at u -17.8 to -14.4 and w 9.3, under the eave; drawn from -18.0 to -14.5, between those and its edges
  in the photograph, -18.06 and -14.73); a second one on the part of that face the photograph does not see (its returns
  at u 17.35 to 20.65, front w 9.11, the ground seen inside it at 39.41 m), with a canopy beside it at about 4.05 m (u
  13.8 to 17.15, the ground seen under it). The LiDAR's roof reaches past the campus map's ring by its eave (p50 0.9 m
  on the south-west, 0.4 at the ends, 0.2 on the north-east): the model follows the LiDAR. The lower part past the
  south-east end (its roof at 5.4, u -45 to -32) is Lippincott Cottage (118), which keeps its block, and is not drawn. A
  few returns over the roof up to 12 m (flues, vents) are not drawn, nor the two steel struts under the south-west eave
  that the photograph shows.
- Walls go down to `FOOT`, 2.6 m under 38.65 m (36.05 m): the ground lies from 37.6 to 39.7 along the south-west face
  and down to 36.5 along the north-east face.

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/facade.js`, `parts/shapes.js` (106's),
  `model.js`: the lead.

## Budget
- Whole building ≤ 20k triangles and ≤ 6 draw calls (tier 3, a measured massing drawn in detail), merged by
  material. Round 0: 72 triangles, 3 draw calls; steps 5 to 7: 648, 6; the review's round 1: 696, 6; round 2: 704, 6.

## Rounds
- Round 0 (2026-11-11, the lead alone): the walls, the eave and the roofs at the LiDAR's edges and heights, the walls
  and the fascia white (`paint`), the roofs light grey (`roofPale`), the stair tower glass (`glassPale`). The
  photograph's camera fitted to the south-west eave's fascia against the sky, its south-east corner and two verticals
  (rms 0.47 px, 1.59 m over the LiDAR's ground). Silhouette IoU 0.930, 0.949 in the model's box; luma p50 179 against
  172. Top view: footprint IoU 0.942, 99% of 4,458 cells within 0.5 m; block 114 99.2% under the model.
- Steps 5 to 7 (2026-11-11): the south-west face where the photograph sees it (u -28.6 to -3.1), estimated through
  its fitted camera: the upper window band (6.25 to 8.0) and its white mullions 1.17 m apart, the floor band (3.4 to
  3.8), the ground storey's windows (2.0 to 3.4) between dark posts 3.2 m apart; the stair tower's white frames and
  transoms, its red double doors and four brick steps before them. The door on the path before the steps (38.04 m;
  no record of the entrance), `H`, the thresholds and the camera moved with it, `FOOT` under the north-east face's
  36.5 m. The light: the
  sun high to the west-north-west (300 deg, 65 up), exposure 0.92: the cladding's luma 185 against 193 and 189.
  Silhouette IoU 0.934 (0.951 in the box), luma p50 183 against 173; top view as before.
- Step 8 (2026-11-11): on the site; the glass bands start 1 cm over their sills and stop 1 cm under the eave or
  2 cm under the floor band, the posts stand 1 cm off the wall and the stair tower's uprights run 2 cm past its glass,
  where the landmark tests' faces check found faces of two materials in one plane. 648 triangles, 6 draw calls.
- The review's round 1 (2026-11-11): the north-east wall at w -9.0, where the LiDAR sees the ground under the eave and
  has returns on the wall (it stood at -8.2); the floor at 0.15, the ground the LiDAR sees inside the stair tower (it
  stood at 0.40, from returns on the wall's line), and the steps down to the door's ground; a plinth under the stair
  tower, which stood on nothing from the ground to its floor; a second stair tower and a canopy beside it on the part
  of the south-west face the photograph does not see, from the LiDAR; the roof's reach past the campus map's ring
  measured (it was said to be 2 to 3 m); the part past the south-east end named as Lippincott Cottage (118). 696
  triangles, 6 draw calls. Silhouette IoU 0.934 (0.951 in the box), luma p50 183 against 173. Top view: footprint
  IoU 0.942, 99% of 4,458 cells within 0.5 m.
- The review's round 2 (2026-11-11): the north-east wall's last 1.7 m by the north corner at w -8.3, where the LiDAR
  sees the ground in to -8.32; the steps' landing 1.6 m deep and treads 0.4 m, as the LiDAR's ground lies before the
  doors; the counts of the returns by the second stair tower and the canopy, and the canopy's slab named by its
  thickness. 704 triangles, 6 draw calls.

## Rules
- Measure, don't guess: a size not from the LiDAR is named in the config's `estimated`, here and on the card.
- No photograph, Street View image or anything made from one goes into a commit.
