# Contract: 58 Symonds Street (435)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-east (the frame's `-axis`), **y** up from the config's ground (50.65 m NZVD2016,
  the median ground in the outline's band; the door's ground replaces it at step 7), **z** south-west (`toStreet`,
  the street); the frame's centre at x = z = 0. `config/58-symonds-street.json`, `frame`: the tower's returns more than
  2.99 m over that ground, the axis along its long faces (bearing 313.6 deg).
- The building's own frame: **u** north-west (`-x`), along the tower's long faces, **w** south-west (`z`).
  `parts/common.js` gives `at` and `plan`, and `Y`, which turns an elevation measured in the LiDAR into a height over
  the config's ground.
- What the LiDAR shows (`parts/common.js` holds the numbers): a tower (u -10.7 to 13.4, w -8.6 to 8.7 at its floor
  slabs' bands' outer edge) whose slabs' tops stand 3.04 m apart from 58.8 to 77.04 m and whose roof's edge is at
  80.15 m; an upper roof 2.2 to 2.4 m in from the edge at 83.1 m; on the street side, standing out from the south-west
  face, a low block by the south corner to 61.83 m, a strip to 84.14 m and a core to 89.16 m. A low roof at about
  56 m runs along the south-east side (u -15.5 to -10.9); whether it is this building's is for step 8's ring and
  `also`, and round 0 does not draw it.
- Walls go down to `FOOT`, 42.0 m: the ground round the tower lies from about 42.4 m on the south-east to 54.5 m on
  the north-west, the car park's ramp falling along the north-east side.

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/shapes.js` (619's), `model.js`: the
  lead.

## Budget
- Whole building ≤ 20k triangles and ≤ 6 draw calls (tier 3, a measured massing drawn in detail), merged by material.
  Round 0: 204 triangles in the mask model.

## Rounds
- Round 0 (2026-11-11, the lead alone): the tower, its slabs' bands, the upper roof and the street side's three
  blocks at the LiDAR's edges and heights; the walls `paint`, the bands `claddingPale`, the roofs `roofGrey`. The
  photograph's camera fitted to the tops of seven slabs' bands at the north corner and both faces' roof edges against
  the sky (rms 0.99 px, 1.6 m over the LiDAR's ground about 20 m north of that corner, a lens of about 50 degrees,
  the principal point solved). Silhouette IoU 0.943 over the photograph, 0.962 in the model's box; luma p50 244
  against 176 (the light is not set yet).
