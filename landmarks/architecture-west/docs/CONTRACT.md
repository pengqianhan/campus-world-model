# Contract: Architecture - West (421W)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-east (the frame's `-axis`), **y** up from the frame's ground (36.83 m NZVD2016, the
  median ground in the crop box, 25 m round the outline; to be the LiDAR's ground at the config's `door`, step 7),
  **z** south-west (`toStreet`); the frame's centre at x = z = 0. `config/architecture-west.json`, `frame`. The site
  falls about 16 m across the crop.
- The building's own frame: **u** along the slab, to the north-west (`-x`), and **w** across it, to the south-west
  (`z`). `parts/common.js` gives `at(u, w)`, `rect(u, w)` and `plan(corners)`.
- What the LiDAR shows (`parts/common.js` holds the numbers):
  - **the slab**, its walls to 20.17 m, its north-east face at w -9.6, set back to w -7.0 south-east of u -2.5;
  - **its roof**, the lowest of measured planes: a north-east slope shared by both halves; south-east of the tower a
    ridge at 25.4 m and a south-west slope down to a flat roof at 20.52 m; north-west of it a wider top at 24.7 m, a
    longer south-west slope and a hip at the north-west end;
  - **the tower** on the ridge, its top a plane falling to the north-west from 31.57 m to 27.97 m;
  - **two lower blocks** to the north-west, 17.43 m and 15.9 m;
  - **its south-east end**, where it joins 421E: drawn up to where #140's model of 421E ends (that model's main
    block, u 37.5 and w 4.5 in its frame E), so that the two do not overlap below the roofs;
  - the ground round the plans from -1.98 m (the south-west side) to +6.6 m (the paved upper level to the north and
    north-west): walls go down to `FOOT`, -2.3 m.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/building.js` (every part, round 0), `parts/shapes.js` (the shapes the parts share, as 421E's), `model.js`:
  the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 217 triangles, 3 draw
  calls.

## Rounds
- Round 0 (2026-11-08): the slab, its roof's planes, the tower and the two lower blocks at the LiDAR's plans and
  heights; walls in the kit's `claddingPale`, roofs `roofGrey`, the tower and the set-back part's face under its
  eave `screenGrey`. Silhouette IoU 0.870 in the photograph (0.971 in the model's screen box); the building's luma
  median 245 against the photograph's 167 (the viewer's default light). The top view: footprint IoU 0.761 (the
  LiDAR's 760 m² against the model's 611, both 592: the LiDAR's extra is the slab's south-east end, where #140's
  model of 421E stands, and lower parts before the set-back face, which round 0 does not draw), 82% of the cells
  within 0.5 m (p10/p50/p90 -0.32/-0.01/0.55), the highest point 31.35 m against 31.38; block 421W under the model
  62.3%, 421E 2.8%.

## Rules
- Measure, don't guess: a size the LiDAR gives is taken from it; one it does not is estimated and said to be.
- The photograph (one, from the paved upper level to the building's north, about 33 m from its tower;
  `refs/photos/`, gitignored) is a reference for the look: nothing is traced or sampled from it, and no size is
  measured from it.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces of different
  materials in one plane.

## How to check
- `landmarks/pipeline/run.sh architecture-west compare topview` (with `PORT` serving the repository): the strip in
  `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view in `out/topview/`. GPU steps only under
  `~/.campus-loop/gpu.lock`.
