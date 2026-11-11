# Contract: Building 903

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** east-south-east (the frame's `-axis`), **y** up from the config's ground (52.64 m
  NZVD2016, the LiDAR's ground at the door), **z** south-south-west (`toStreet`, the road); the
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
- The clad box stands from its underside at 61.25 m; the two glazed storeys under it are set back 0.45 m on the
  south and forward faces and the east end (the LiDAR's returns on them), on a plinth to 53.0 m, with a band at the
  floor between them (57.7 to 58.4 m). The windows of the clad storeys, the glazed storeys' piers and the canopy over
  the corner's entrance are estimated in the photograph through its fitted camera (`parts/common.js` says where).
- On the roof: plant on a platform across the ridge to 71.35 m, a duct from it to the north, a unit toward the west
  end to 71.97 m and a fan (the LiDAR's returns standing over the roof).
- Walls go down to `FOOT`, 51.8 m: the ground along the walls lies from 51.89 m on the road before the forward face
  to 52.7 m by the east end's north corner. The door is before the glazed entrance under the canopy at the south-east
  corner, on the platform at 52.64 m (the campus map records no entrance in 903).

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js` (the clad box, its parapets and its ridge's
  cap, and `along`, a profile carried along p), `parts/facade.js` (the glazed storeys, their piers, band and
  mullions, the canopy, the windows), `model.js`: the lead.

## Budget
- Whole building ≤ 20k triangles and ≤ 6 draw calls (tier 3, a measured massing drawn in detail), merged by material.
  Round 0: 78 triangles, 2 draw calls. Round 1: 3,810 triangles, 3 draw calls (`claddingPale`, `glass`,
  `roofPale`). Step 7: 3,850 triangles, 3 draw calls.

## Rounds
- Round 0 (2026-11-12, the lead alone): the block with its step forward, its roof of two slopes and the cap along
  its ridge, the parapet along the south face and the east end's gable, at the LiDAR's edges and heights; the walls
  `claddingPale`, the roofs `roofPale`. The photograph's camera fitted to both faces' roof edges, four upright edges
  and three corners (rms 0.85 px, 1.62 m over the LiDAR's ground about 27 m south-east of the south-east corner, a
  lens of 59.4 degrees, looking up 15.0 degrees). Silhouette IoU 0.872 over the photograph, 0.960 in the model's
  box; luma p50 149 against 157 (the light is not set yet).
- Round 1 (2026-11-12, the lead alone): the faces. The clad box from its underside; under it the two glazed storeys
  set back, with a plinth, a band at their floor, piers (one at the corner, one 1.5 m wide on the south face and its
  like every 7.6 m along it, two on the east end) and a mullion every 1.5 m; the canopy over the corner's entrance;
  the clad storeys' windows in frames 0.07 m proud, as the photograph shows them on the south face and the east end,
  the forward face's bands as the south face's, and the north face, which no photograph shows, drawn as the south
  face. The light: a weak sun behind the building and a strong sky, at an exposure of 0.78. Silhouette IoU 0.866,
  0.963 in the model's box; luma p50 162 against 157, p90 174 against 178.
- Step 7 (2026-11-12): the door and its ground (52.64 m), the frame's thresholds with it (the frame unchanged), the
  camera fitted again; the plant, the duct, the unit and the fan on the roof. Top view: footprint IoU 0.910, 95% of
  10,042 cells within 0.5 m of the LiDAR's height, the highest point 19.33 m over the door's ground against 19.28;
  block 903 96.3% under the model (904 7.3%, 902 2.0%: `also` empty).
