# Contract: Structures Hall

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** east-south-east (the frame's `-axis`), **y** up from the config's ground (52.4 m
  NZVD2016, the provisional ground), **z** south-south-west (`toStreet`, the face the photograph sees); the frame's
  centre at x = z = 0. `config/structures-hall.json`, `frame`: the building's returns more than 3.0 m over that ground
  and within 1.5 m of the campus map's ring, the axis along its long faces (bearing -71.89 deg).
- The building's own frame: **p** along its long faces toward the west-north-west and **q** toward the
  south-south-west. Its faces run 2.28 degrees off the frame's axis, so `parts/common.js` turns p and q by that before
  `at`, `plan` and `pt` give the view frame; `Y` turns an elevation measured in the LiDAR into a height over the
  config's ground.
- What the LiDAR shows (`parts/common.js` holds the numbers): two blocks side by side along the line q 2.7. The
  southern one, p -22.4 to 32.05 and q 2.7 to 16.0 to its roof's outer edges, under a roof of one slope (5.9
  degrees) from 70.52 m at the south edge up to 71.90 m at the line, with a fascia along the south edge to 70.6 m. The
  northern one, p -23.95 to 23.05 and q -16.13 to 2.7, under a roof of one slope (7.5 degrees) from 71.61 m at the
  north eave up to 74.10 m at the line. A lower block against its east end, p -30.95 to -23.95 and q -15.8 to 2.55,
  flat at 68.31 m. Three stacks on the line, about 2.5 m square, their tops falling from 77.4 m to 76.6 m.
- Walls go down to `FOOT`, 52.0 m: the ground along the walls lies from 52.06 m to 53.06 m (p50 52.49 m).

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js` (the blocks, the stacks, and `along`, a
  profile carried along p), `model.js`: the lead.

## Budget
- Whole building ≤ 20k triangles and ≤ 6 draw calls (tier 3, a measured massing drawn in detail), merged by material.
  Round 0: 70 triangles, 2 draw calls.

## Rounds
- Round 0 (2026-11-12, the lead alone): the two blocks under their roofs of one slope, the lower block and the three
  stacks, at the LiDAR's edges and heights; the walls `claddingPale`, the roofs `roofPale`. The photograph's camera
  fitted to the south face's roof edge, its two ends, three of the stacks' upright edges and two corners of each of
  two stacks' tops and one of the third's (rms 0.72 px, 0.98 m over the LiDAR's ground about 64 m south of the south
  face, a lens of 49.2 degrees, looking up 7.5 degrees). Silhouette IoU 0.881 over the photograph, 0.959 in the model's box; luma p50 146 against 123 (the light is not set yet).
