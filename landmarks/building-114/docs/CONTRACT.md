# Contract: Building 114

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-east (the frame's `-axis`), **y** up from the door's ground, **z** south-west
  (`toStreet`); the frame's centre at x = z = 0. `config/building-114.json`, `frame`: the building's returns within
  1.5 m of the campus map's ring, the axis along its long walls (bearing 315.6 deg).
- The building's own frame: **u** north-west (`-x`), along the long walls, **w** south-west (`z`). `parts/common.js`
  gives `at` and `plan`, and `H`, which turns a height measured above 38.65 m (the median ground in the outline's band)
  into one above the door's ground.
- What the LiDAR shows (`parts/common.js` holds the numbers): one long block of two storeys, its walls (u -28.6 to 28.2,
  w -8.2 to 8.1) under a flat roof with a deep eave all round, the roof's edge at 8.35 (u -29.6 to 29.1, w -9.6 to
  9.8: 1.7 m out on the south-west, about 1 m at the ends), the flat roof at 8.55 inside it and a raised strip down its
  middle at 10.05 (u -26 to 25, w -4 to 4); a glass stair tower on the south-west face (u -18.0 to -14.2, its front at
  w 9.3, under the eave). The LiDAR's roof reaches 2 to 3 m past the campus map's ring at the south-east end and along
  the north-east face: the model follows the LiDAR. The lower part past the south-east end (its roof at 5.4, u -45 to
  -32) lies outside 114's ring and is not drawn. A few returns over the roof up to 12 m (flues, vents) are not drawn.
- Walls go down to `FOOT`, 1.6 m under 38.65 m: the ground lies from 37.6 to 39.7 along the south-west face.

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/shapes.js` (106's), `model.js`: the
  lead.

## Budget
- Whole building ≤ 20k triangles and ≤ 6 draw calls (tier 3, a measured massing drawn in detail), merged by
  material. Round 0: 72 triangles, 3 draw calls.

## Rounds
- Round 0 (2026-11-11, the lead alone): the walls, the eave and the roofs at the LiDAR's edges and heights, the walls
  and the fascia white (`paint`), the roofs light grey (`roofPale`), the stair tower glass (`glassPale`). The
  photograph's camera fitted to the south-west eave's fascia against the sky, its south-east corner and two verticals
  (rms 0.47 px, 1.59 m over the LiDAR's ground). Silhouette IoU 0.930, 0.949 in the model's box; luma p50 179 against
  172. Top view: footprint IoU 0.942, 99% of 4,458 cells within 0.5 m; block 114 99.2% under the model.

## Rules
- Measure, don't guess: a size not from the LiDAR is named in the config's `estimated`, here and on the card.
- No photograph, Street View image or anything made from one goes into a commit.
