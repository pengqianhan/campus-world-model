# Contract: 58 Symonds Street (435)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-east (the frame's `-axis`), **y** up from the door's ground (53.03 m NZVD2016, on
  the platform before the north-east face), **z** south-west (`toStreet`, the street); the frame's centre at x = z = 0.
  `config/58-symonds-street.json`, `frame`: the tower's returns more than 2.99 m over 50.65 m (the median ground in the
  outline's band; the thresholds lowered by 2.38 m with the door's ground), the axis along its long faces (bearing
  313.6 deg).
- The building's own frame: **u** north-west (`-x`), along the tower's long faces, **w** south-west (`z`).
  `parts/common.js` gives `at` and `plan`, and `Y`, which turns an elevation measured in the LiDAR into a height over
  the config's ground.
- What the LiDAR shows (`parts/common.js` holds the numbers): a tower (u -10.7 to 13.4, w -8.6 to 8.7 at its floor
  slabs' bands' outer edge) whose eight slabs' tops stand about 3.05 m apart from 55.7 to 77.04 m and whose roof's
  edge is at 80.15 m; an upper roof 2.2 to 2.4 m in from the edge at 83.1 m; on the street side, standing out from the
  south-west face, a low block by the south corner to 61.83 m, two strips to 83.22 m and a core whose roof falls to
  the street from 89.25 to 87.72 m; plant on the upper roof at 84.5 to 85.2 m. A low roof at about 56 m runs along the
  south-east side (u -15.5 to -10.9), outside the campus map's outline: it is not drawn.
- Walls go down to `FOOT`, 42.0 m: the ground within 5 m of the walls lies from about 45.8 m along the south-east face
  (p50 47.2) to 53.4 m on the platform before the north-east face, and rises to 55.5 m off the north-west face; it
  falls to about 42.4 m 10 to 12 m south-east of the tower, the car park's ramp falling along the north-east side.

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/facade.js`, `parts/shapes.js`
  (619's), `model.js`: the lead.

## Budget
- Whole building ≤ 20k triangles and ≤ 6 draw calls (tier 3, a measured massing drawn in detail), merged by material.
  Round 0: 204 triangles in the mask model; steps 5 to 8: 7,098 triangles, 5 draw calls; after the review of #167:
  8,082 triangles, 6 draw calls.

## Rounds
- Round 0 (2026-11-11, the lead alone): the tower, its slabs' bands, the upper roof and the street side's three
  blocks at the LiDAR's edges and heights; the walls `paint`, the bands `claddingPale`, the roofs `roofGrey`. The
  photograph's camera fitted to the tops of seven slabs' bands at the north corner and both faces' roof edges against
  the sky (rms 0.99 px, 1.6 m over the LiDAR's ground about 20 m north of that corner, a lens of about 50 degrees,
  the principal point solved). Silhouette IoU 0.943 over the photograph, 0.962 in the model's box; luma p50 244
  against 176 (the light is not set yet).
- Steps 5 to 8 (2026-11-11): the faces (`parts/facade.js`): each slab's band 0.5 m deep with louvres under it, the
  window wall 1.2 m behind the bands' edge with sill panels and mullions, a column at each corner and piers on a 6.6 m
  grid, the dark ground storey, all estimated through the photograph's camera but the bands' tops and edge; the light
  (the sun to the north-north-east, weak, a strong sky, exposure 0.82: luma 177 against 177). The door on the platform
  before the north-east face (53.03 m); the core's roof as one slope to the street, the strip beside it at 83.22 m and
  the plant on the upper roof, to the LiDAR, where the top view found them off. On the site (`site: true`), its
  measured massing's data file gone. 7,098 triangles, 5 draw calls; silhouette IoU 0.938, 0.970 in the model's box;
  top view: footprint IoU 0.905, 93% of 1,873 cells within 0.5 m, the highest point 36.30 m over the door's ground
  against the LiDAR's 36.27, block 435 97.7% under the model.
- The review of #167 (2026-11-12): the lowest slab's band at 55.7 m (the LiDAR's 228 returns at 55.0 to 56.2 m in
  the bands' outer metre, 266 in their outer 1.2 m) and its storey of windows, which the photograph shows over the
  dark ground storey: eight storeys of windows, not seven; the core's roof a dull plum (`roofPlum`, new in the kit),
  as the 2023 aerial shows it; the two strips on the street side run in to the upper roof's edge, as the LiDAR's roof
  does; the ground's figures from the LiDAR within 5 m of each face (the real ground falls about 6 m from the door to
  the south-east face, not 11); the exposure 0.69 (0.82 gave 192 with the eighth storey drawn). Silhouette IoU 0.938,
  0.966 in the model's box; luma 177 against 177. Top view as before: footprint IoU 0.905, 93% of 1,873 cells within
  0.5 m, the highest point 36.30 m over the door's ground against 36.27. 8,082 triangles, 6 draw calls.
