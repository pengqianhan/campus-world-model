# Contract: Security (409)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-west (the frame's `-axis`), **y** up from the door's ground (43.4 m NZVD2016, on
  the court at the foot of the steps up to the deck), **z** north-west (`toStreet`, the road); the frame's centre at
  x = z = 0. `config/security-409.json`, `frame`: the building's returns more than 3.04 m over that ground (2.99 m
  over the provisional 43.45 m), the axis along its long faces (bearing 42.0 deg).
- The building's own frame: **p** along its long faces toward the north-east and **q** toward the north-west. Its
  faces run 1.8 degrees off the frame's axis, so `parts/common.js` turns p and q by that before `at` and `plan` give
  the view frame; `Y` turns an elevation measured in the LiDAR into a height over the config's ground.
- What the LiDAR shows (`parts/common.js` holds the numbers): a block about 37 by 26 m to its parapet's outer edge
  (p -18.85 to 17.7, q -12.85 to 13.15), a step of 2.5 m in at its west corner, its south and east corners cut, a flat
  roof at 51.13 m within a parapet to 51.5 m; on the roof a box at the west corner to 53.88 m and a block toward the
  east end to 53.77 m. Returns of 54 to 58 m over the north corner are a tree's crown: they are not drawn.
- The south corner's chamfer is 3.4 m wide, at 42 degrees: where the photograph's fitted camera puts its top corners,
  on both faces' lines (the LiDAR's returns at the parapet's height lie on it).
- Walls go down to `FOOT`, 43.0 m, 0.4 m under the door's ground: the ground along the walls lies from 43.3 m on the
  court to the south-east to 46.5 m by the road to the north-west.

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/shapes.js` (619's), `model.js`: the
  lead.

## Budget
- Whole building ≤ 20k triangles and ≤ 6 draw calls (tier 3, a measured massing drawn in detail), merged by material.
  Round 0: 232 triangles, 2 draw calls; steps 5 and 6: 3,448 triangles, 5 draw calls; after the review of #168:
  3,354 triangles, 5 draw calls.

## Rounds
- Round 0 (2026-11-12, the lead alone): the block with its chamfers and the step at its west corner, the roof and
  its parapet, and the two blocks on the roof, at the LiDAR's edges and heights; the walls `paint`, the roofs
  `roofGrey`. The photograph's camera fitted to both faces' roof edges and seven upright edges (rms 0.76 px, 1.6 m
  over the LiDAR's ground about 10.5 m south of the south corner, level, a lens of 71.4 degrees). Silhouette IoU
  0.748 over the photograph, 0.787 in the model's box, where the trees leave 2.6% of it sky; luma p50 222 against
  160 (the light is not set yet).
- Steps 5 and 6 (2026-11-12): the faces (`parts/block.js`): the band of the upper storey from its underside at
  49.1 m, where the photograph's camera puts the band's lower edge, with a dark joint at each end of the chamfer; the
  ground storey's glazing and its frames set back under it, 1.85 m behind the south-east face and, under the south
  corner, 3.65 m behind the south-west end; columns 0.45 m square under the band's edge; a deck at 45.3 m under the
  corner and along the south-east face to q -16.0, its railing, and a flight of 11 steps from the court up to its west
  corner, all placed through the photograph's camera and estimated; the faces no photograph shows drawn as the ones
  it does. The light: the sun weak to the west-north-west and a strong sky, as the photograph's overcast, exposure
  0.95: luma 165 against 158. Silhouette IoU 0.745, 0.778 in the model's box.
- Step 7 (2026-11-12): the door at the foot of the steps, on the court (43.6 m, 8 returns within 1 m), the frame's
  thresholds lowered with it (the frame unchanged), the camera fitted again with its ground (rms 0.76 px). Top view:
  footprint IoU 0.937, 86% of 3,603 cells within 0.5 m (p10/p50/p90 -0.95/-0.03/0.22: the model lower under the
  tree's crown over the north corner and a row of small units on the roof), the highest point 10.29 m over the door's
  ground against 10.37 (p99.9 of the building's returns but the crown's), block 409 94.8% under the model.
- Step 8 (2026-11-12): the flight of steps and the door 1.1 m along the south-east face from where the camera puts the
  flight's foot, clear of Architecture - West's outline in the campus map, the door then on the court at 43.4 m (17
  returns within 1 m), the frame's thresholds raised 0.20 m with it (`min_above` 2.84 to 3.04 m); the highest point
  10.49 m over the door's ground against 10.57. On the site (`site: true`), its measured massing's data file gone; the
  roofs `roofPale`, light grey as the aerial shows them; the roof blocks' feet within the roof's slab, and the
  columns' and steps' feet under the deck's, where the landmark tests' faces check found them in one plane. Silhouette
  IoU 0.746, 0.779 in the model's box; luma 155 against 159. 3,448 triangles, 5 draw calls.
- The review of #168 (2026-11-12): the roof blocks to the LiDAR (the west box's roof rising from 51.7 m to 53.84 m,
  the east block's south part from p 3.75 and its south-east end at 53.0 m); the deck out to the flight's last riser
  and its railing from the flight's east side; the card names the chamfer's width and the floor, and says that neither
  the LiDAR nor the 2023 aerial shows the deck, its railing or the steps. Silhouette IoU 0.744, 0.777 in the model's
  box; luma 156 against 159. Top view: footprint IoU 0.937, 89% of 3,603 cells within 0.5 m (p10/p50/p90
  -0.61/-0.03/0.20: the model lower under the tree's crown along the north side and a row of small units on the roof,
  and off by more along the roof blocks' edges), the highest point 10.44 m over the door's ground against 10.57, block
  409 94.8% under the model. 3,354 triangles, 5 draw calls.
