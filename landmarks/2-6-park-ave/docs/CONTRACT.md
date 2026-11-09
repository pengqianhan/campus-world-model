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
  - round its west, south and north sides, inside the campus map's ring, **low parts** of one storey (3.6, 3.6 and
    6.3 m) where the LiDAR mostly sees the ground under them, or a canopy narrower than a metre; a **one-storey annex**
    on the west (u -11 to -7, to w -16.4, 3.5 m), which it roofs;
  - the ground under the eave on the north (to 1.66 m in), east (1.48 m) and south sides, and under the upper storeys
    at the south-east corner, up to 5.5 m in from the south end (w 8.3 to 14.8): the walls stand behind it, the ground
    storey open under that corner;
  - the ground: -0.4 to +0.1 m along Park Avenue, falling to about -0.8 on the west: walls go down to `FOOT`, 2.0 m
    under the provisional ground.
- What it draws: what the LiDAR has inside the campus map's ring of 529, but for the low parts it sees the ground
  under, which are left open.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/block.js` (every part), `parts/shapes.js` (the shapes the parts share, as 501's), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 1: 908 triangles, 7 draw
  calls; after the walls were set behind the eave: 848, 7.

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
- The ground under solid parts (2026-11-10): the LiDAR sees the ground under the low parts north and south of the block
  and under most of the one on the west: those are dropped, and the west one drawn as the annex where the LiDAR roofs
  it (u -11 to -7, out to w -16.4, 3.5 m); it sees the ground under the eave on the north, east and south sides and
  under the south-east corner, so the walls stand behind the eave's edge, 1.8 m on the north, 1.6 on the east, 1.8 on
  the south and 0.3 on the west (estimated), and the ground storey is open under that corner, its walls stopping at
  u 15.5 and w 8.3 (estimated). The raised part's roof is flat at 17.3 m, with plant on it at 18.3. The photograph's
  camera fitted to the planted bed's kerb along the footpath too (w 20.0, where the LiDAR's shrubs end), which holds
  its distance: its field 36.3 degrees, rms 2.28 px. 848 triangles, 7 draw calls.
- The door (2026-11-10): on the footpath of Park Avenue before the opening under the south-east corner (the campus map
  records no lobby or entrance in 529, OpenStreetMap none near it), u 17.5, w 17.0; the LiDAR's ground there 68.87 m
  (13 returns, p50), 0.01 m over the crop's median: the frame's thresholds lowered by as much, the heights moved on to
  it through `H`. The map's ground (its 8 m elevation model) is flat at about 79.8 m round the block, 10.9 m above the
  LiDAR's at the door. Silhouette IoU 0.911 in the photograph (0.957 in the model's screen box); the luma of the east
  face 92 against the photograph's 85. The top view: footprint IoU 0.854 (the LiDAR's 1,406 m² against the model's
  1,200, both 1,200: the rest of the LiDAR's lies in the low parts left open), 89% of the 4,798 cells within 0.5 m
  (p10/p50/p90 -0.29/0.01/0.35); the highest point 18.3 m against the LiDAR's 18.15 (p99.9); block 529 under the
  model 86.2%.
- On the site (2026-11-10): `site` true, the card's `estimated`; the foot check found the ground storey's brick
  starting at the door's ground: it now starts at `FOOT`. Beside an open neighbour the model gives way to block 529,
  whose footprint stands above the drawn ground on all its cells, by up to 0.84 m. 848 triangles, 7 draw calls.

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
