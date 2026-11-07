# Contract: Architecture - East (421E)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-west (the frame's `-axis`), **y** up from the frame's ground (31.6 m NZVD2016, the
  median ground in the crop box, 25 m round the outline; to be the LiDAR's ground at the config's `door`, step 7),
  **z** north-west (`toStreet`); the frame's centre at x = z = 0. `config/architecture-east.json`, `frame`. The site
  falls about 27 m across the crop.
- Two frames of the building's own: its walls run in two directions 45 degrees apart (the campus map's ring: its
  edges at -4.4 and 40.0 degrees from x toward z). `parts/common.js` gives `at(F, u, w)` and `rect(F, u, w)`: in
  frame `W` the lower wing and the west tower, in frame `E` the main block and the tall tower; u along the walls'
  first direction, w across it.
- What the LiDAR shows (`parts/common.js` holds the numbers):
  - **the lower wing**, its corner cut square with the main block, its roof at 22.65 m inside a parapet at 23.5 m;
  - **the west tower** on it, its top a plane rising to 33.6 m at its end, with a lower slope on its south-east side;
  - **the main block**, a flat roof at 25.74 m and on it a hipped roof whose ridge runs at 30.1 m, its north-west
    eave at 28 m over a face down to the flat, which runs on as a ledge; at its
    south-west end a part at 25.1 m on its north-west side, and on the flat a box at 27 m; north-west of it, from u 9,
    the terrace's ground comes up to its face;
  - **the tall tower** out of the hipped roof, its top a plane rising to 36.7 m at its end;
  - **the ring's south-east part**, a car park at the ground: not drawn;
  - the ground round the plans from -1.16 m to +8.5 m (the raised terrace to the north-west): walls go down to `FOOT`,
    -1.5 m.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frames): the lead.
- `parts/building.js` (every part, round 0), `parts/shapes.js` (the shapes the parts share), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 94 triangles, 3 draw
  calls. Round 1's shape: 184 and 3.

## Rounds
- Round 0 (2026-11-07): the four parts as blocks at the LiDAR's plans and heights; walls in the kit's
  `claddingPale`, roofs `roofGrey`, the towers `screenGrey`. Silhouette IoU 0.927 in the photograph (0.927 in the
  model's screen box); the building's luma median 242 against the photograph's 176 (the viewer's default light).
  The top view: footprint IoU 0.766 (the LiDAR's 1,600 m² against the model's 1,362, both 1,286), 50% of the cells
  within 0.5 m (p10/p50/p90 -1.43/-0.3/2.02: the terraces and the stepped faces, which round 0 does not draw), the
  highest point 36.64 m against 36.56; block 421E under the model 57.2% (its ring takes in the car park), 421W 8.5%.
- Round 1's shape (2026-11-07, from the 1 m cells and the returns' p50 in each part): the lower wing's roof at
  22.65 m and its corner cut at 45 degrees, square with the main block; the west tower's south-east slope; the main
  block's flat roof at 25.74 m with the hipped roof on it (its ridge at 30.1 m along w 0, its slopes to w -6.2 and
  4.5, its hips to u -7 and 37.5), the part at 25.1 m and the box at 27 m. A terrace tried before the north-west
  face from u 9 is not there: the LiDAR sees the terrace's ground (8 m) up to the face. 180 triangles, 3 draw
  calls; no two faces of different materials in one plane. Silhouette IoU 0.939 (0.939 in the box); the top view:
  footprint IoU 0.796 (1,600 m² against 1,288, both 1,280), 59% of the cells within 0.5 m (p10/p50/p90
  -1.16/-0.05/0.49), the highest point 36.66 m; block 421E under the model 54.5%. Then the hipped roof's north-west
  eave at 28 m at w 3 (the returns at w 2.5 to 3, p50 28.2), over a face down to the flat roof, which runs on to
  w 4.5 as a ledge; the storeys' edges stepping out below it (returns at 12-28 m between w 3 and 5.5) are for the
  faces. 184 triangles; silhouette IoU 0.942; the top view: 63% of the cells within 0.5 m (p10/p50/p90
  -1.29/-0.04/0.59). The viewer's light (estimated): the sun at 300 deg round and 45 up, the exposure 0.5; the
  building's luma median 174 against the photograph's 175.

## Rules
- Measure, don't guess: a size the LiDAR gives is taken from it; one it does not is estimated and said to be.
- The photograph (one, from the raised terrace to the north-west, about 50 m from the tall tower; `refs/photos/`,
  gitignored) is a reference for the look: nothing is traced or sampled from it, and no size is measured from it.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces of different
  materials in one plane.

## How to check
- `landmarks/pipeline/run.sh architecture-east compare topview` (with `PORT` serving the repository): the strip in
  `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view in `out/topview/`. GPU steps only under
  `~/.campus-loop/gpu.lock`.
