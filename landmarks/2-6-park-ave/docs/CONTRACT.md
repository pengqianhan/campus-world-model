# Contract: 2-6 Park Ave (529)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** north-north-east (the frame's `-axis`, along the block's long east face), **y** up from
  the frame's ground, the LiDAR's ground at the door (until step 7, 68.86 m NZVD2016, the median ground in the first
  crop box, from which the heights in `parts/common.js` are measured; `H` moves them on), **z** east-south-east
  (`toStreet`, toward Park Avenue); the frame's centre at x = z = 0. `config/2-6-park-ave.json`, `frame`. The campus's
  origin is about 1 km to the north: there the map's true north and NZTM's grid north differ by about 1 degree, so the
  map's metres and the frame's local NZTM metres lie about 21.7 m apart here (`place` turns one into the other).
- The building's own frame: **u** south-south-west (`-x`), along the east face toward its south end, and **w** toward
  Park Avenue (`z`). `parts/common.js` gives `at(u, w)`, `plan(corners)` and `rect(u, w)`.
- What the LiDAR shows (`parts/common.js` holds the numbers):
  - **the block**, about 2 degrees off the frame's axis, its corners NW (-21.9, -12.6), NE (-22.8, 14.5), SE (20.6,
    16.2) and SW (21.4, -11.2) at the roof's edges, its eave at 12.45 m and its nearly flat roof 12.6 to 13.1 inside;
  - on the roof **plant** at 14.6 m (u -14 to -5, w -5 to 6) and **a raised part** at 17.3 m (u 4 to 16, w -3 to 7),
    its roof red on the 2023 aerial, with plant on it at 18.3;
  - **low parts** of one storey round its west (3.6 m), south (3.6 m) and north (6.3 m) sides;
  - the ground under the east face's eave to w 14.0, so the wall stands behind it;
  - the ground: -0.4 to +0.1 m along Park Avenue: walls go down to `FOOT`, -2.0 m over the provisional ground.
- What it draws: what the LiDAR has inside the campus map's ring of 529.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/block.js` (every part), `parts/shapes.js` (the shapes the parts share, as 501's), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 1: 908 triangles, 7 draw
  calls.

## Rounds
- Round 1 (2026-11-10, the lead alone): the block at the LiDAR's plan and eave, its walls `claddingPale` to a dark eave
  (`screenGrey`) from 12.0 m, the roof inside `roofGrey`; the plant (`renderGrey`); the raised part, its roof
  `roofTile` (red on the aerial); the low parts. The east face through the photograph's fitted camera (estimated): the
  wall 1.6 m behind the eave's edge; at each upper storey a balcony on its slab (3.4 to 3.9 m, 6.5 to 7.0, 9.6 to
  10.1) to the eave's line, with a rail of two bars on posts (`screenSilver`), the glazing behind it (`glass`); the
  ground storey in pale brick (`renderGrey`) with its windows. The light: the sun behind the block (290 degrees round,
  40 up), exposure 1.0 (the photograph is overcast). 908 triangles, 7 draw calls. Silhouette IoU 0.918 in the
  photograph (0.965 in the model's screen box); the luma of the east face 92 against the photograph's 85. The top view:
  footprint IoU 0.881 (the LiDAR's 1,406 m² against the model's 1,366, both 1,298), 87% of the 5,166 cells within
  0.5 m (p10/p50/p90 -0.35/0.02/0.34); the highest point 18.31 m against the LiDAR's 18.16 (p99.9); block 529 under
  the model 92.0%.

## Rules
- Measure, don't guess: a size the LiDAR gives is taken from it; one it does not is estimated and said to be.
- The photograph (one, from the footpath of Park Avenue near the block's north-east corner; `refs/photos/`,
  gitignored) is a reference for the look: nothing is traced or sampled from it, and no size is measured from it
  unless this contract names it as estimated through its fitted camera.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces of different
  materials in one plane.

## How to check
- `landmarks/pipeline/run.sh 2-6-park-ave compare topview` (with `PORT` serving the repository): the strip in
  `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view in `out/topview/`. GPU steps only under
  `~/.campus-loop/gpu.lock`.
