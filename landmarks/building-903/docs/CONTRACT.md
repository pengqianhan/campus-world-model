# Contract: Building 903

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** east-south-east (the frame's `-axis`), **y** up from the config's ground (53.1 m
  NZVD2016, the provisional ground until the door's replaces it), **z** south-south-west (`toStreet`, the road); the
  frame's centre at x = z = 0. `config/building-903.json`, `frame`: the building's returns more than 3.0 m over that
  ground and within 1.5 m of the campus map's ring, the axis along its long faces (bearing -71.7 deg).
- The building's own frame: **p** along its long faces toward the west-north-west and **q** toward the
  south-south-west. Its faces run 2.33 degrees off the frame's axis, so `parts/common.js` turns p and q by that before
  `at`, `plan` and `pt` give the view frame; `Y` turns an elevation measured in the LiDAR into a height over the
  config's ground.
- What the LiDAR shows (`parts/common.js` holds the numbers): a block about 75 by 32 m to its roof's outer edges
  (p -38.27 to 36.5, q -16.42 to 15.84), its south face stepped 2.68 m forward west of p -8.6; a roof of two slopes
  (3.8 degrees) from a ridge along q 1.0 at 70.3 m, with a cap 2 m wide to 70.75 m, down to the north eave at
  69.15 m; a parapet along the south face to 70.05 m, and at the east end a low gable within a parapet (70.08 m,
  70.97 m over the ridge, 69.85 m). The roof runs on to the west-north-west past p 36.5 at the same height, over the
  next building: the campus map's ring ends the model there.
- Walls go down to `FOOT`, 52.0 m: the ground along the walls lies from 52.2 m on the road south-east of the east
  end to 52.8 m before the south face.

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js` (with `along`, a profile carried along p),
  `model.js`: the lead.

## Budget
- Whole building ≤ 20k triangles and ≤ 6 draw calls (tier 3, a measured massing drawn in detail), merged by material.
  Round 0: 78 triangles, 2 draw calls.

## Rounds
- Round 0 (2026-11-12, the lead alone): the block with its step forward, its roof of two slopes and the cap along
  its ridge, the parapet along the south face and the east end's gable, at the LiDAR's edges and heights; the walls
  `claddingPale`, the roofs `roofPale`. The photograph's camera fitted to both faces' roof edges, four upright edges
  and three corners (rms 0.85 px, 1.62 m over the LiDAR's ground about 27 m south-east of the south-east corner, a
  lens of 59.4 degrees, looking up 15.0 degrees). Silhouette IoU 0.872 over the photograph, 0.960 in the model's
  box; luma p50 149 against 157 (the light is not set yet).
