# Contract: Security (409)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-west (the frame's `-axis`), **y** up from the config's ground (43.45 m NZVD2016,
  the provisional ground until the door's replaces it), **z** north-west (`toStreet`, the road); the frame's centre at
  x = z = 0. `config/security-409.json`, `frame`: the building's returns more than 2.99 m over that ground, the axis
  along its long faces (bearing 42.0 deg).
- The building's own frame: **p** along its long faces toward the north-east and **q** toward the north-west. Its
  faces run 1.8 degrees off the frame's axis, so `parts/common.js` turns p and q by that before `at` and `plan` give
  the view frame; `Y` turns an elevation measured in the LiDAR into a height over the config's ground.
- What the LiDAR shows (`parts/common.js` holds the numbers): a block about 37 by 26 m to its parapet's outer edge
  (p -18.85 to 17.7, q -12.85 to 13.15), a step of 2.5 m in at its west corner, its south and east corners cut, a flat
  roof at 51.13 m within a parapet to 51.5 m; on the roof a box at the west corner to 53.88 m and a block toward the
  east end to 53.77 m. Returns of 54 to 58 m over the north corner are a tree's crown: they are not drawn.
- The south corner's chamfer is 3.4 m wide, at 42 degrees: where the photograph's fitted camera puts its top corners,
  on both faces' lines (the LiDAR's returns at the parapet's height lie on it).
- Walls go down to `FOOT`, 43.0 m: the ground along the walls lies from 43.3 m on the court to the south-east to
  46.5 m by the road to the north-west.

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/shapes.js` (619's), `model.js`: the
  lead.

## Budget
- Whole building ≤ 20k triangles and ≤ 6 draw calls (tier 3, a measured massing drawn in detail), merged by material.
  Round 0: 232 triangles, 2 draw calls.

## Rounds
- Round 0 (2026-11-12, the lead alone): the block with its chamfers and the step at its west corner, the roof and
  its parapet, and the two blocks on the roof, at the LiDAR's edges and heights; the walls `paint`, the roofs
  `roofGrey`. The photograph's camera fitted to both faces' roof edges and seven upright edges (rms 0.76 px, 1.6 m
  over the LiDAR's ground about 10.5 m south of the south corner, level, a lens of 71.4 degrees). Silhouette IoU
  0.748 over the photograph, 0.787 in the model's box, where the trees leave 2.6% of it sky; luma p50 222 against
  160 (the light is not set yet).
