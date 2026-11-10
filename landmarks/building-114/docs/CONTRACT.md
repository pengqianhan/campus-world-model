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
  w -8.2 to 8.1) under a flat roof with a deep eave all round, the roof's edge at 8.35 (u -29.6 to 29.1, w -9.6 to
  9.8: 1.7 m out on the south-west, about 1 m at the ends), the flat roof at 8.55 inside it and a raised strip down its
  middle at 10.05 (u -26 to 25, w -4 to 4); a glass stair tower on the south-west face (u -18.0 to -14.5, its front at
  w 9.3, under the eave). The LiDAR's roof reaches 2 to 3 m past the campus map's ring at the south-east end and along
  the north-east face: the model follows the LiDAR. The lower part past the south-east end (its roof at 5.4, u -45 to
  -32) lies outside 114's ring and is not drawn. A few returns over the roof up to 12 m (flues, vents) are not drawn,
  nor the two steel struts under the south-west eave that the photograph shows.
- Walls go down to `FOOT`, 2.6 m under 38.65 m: the ground lies from 37.6 to 39.7 along the south-west face and down
  to 36.5 along the north-east face.

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/facade.js`, `parts/shapes.js` (106's),
  `model.js`: the lead.

## Budget
- Whole building ≤ 20k triangles and ≤ 6 draw calls (tier 3, a measured massing drawn in detail), merged by
  material. Round 0: 72 triangles, 3 draw calls; steps 5 to 7: 648, 6.

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
  no record of the entrance), `H`, the thresholds and the camera moved with it, `FOOT` down to 36.5 m. The light: the
  sun high to the west-north-west (300 deg, 65 up), exposure 0.92: the cladding's luma 185 against 193 and 189.
  Silhouette IoU 0.934 (0.951 in the box), luma p50 183 against 173; top view as before.
- Step 8 (2026-11-11): on the site; the glass bands start 1 cm over their sills and stop 1 cm under the eave or
  2 cm under the floor band, the posts stand 1 cm off the wall and the stair tower's uprights run 2 cm past its glass,
  where the landmark tests' faces check found faces of two materials in one plane. 648 triangles, 6 draw calls.

## Rules
- Measure, don't guess: a size not from the LiDAR is named in the config's `estimated`, here and on the card.
- No photograph, Street View image or anything made from one goes into a commit.
