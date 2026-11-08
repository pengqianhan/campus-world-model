# Contract: Architecture - West (421W)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-east (the frame's `-axis`), **y** up from the frame's ground (43.5 m NZVD2016, the
  LiDAR's ground at the config's `door`, on the paved upper level before the slab's north-east doors; the heights in
  `parts/common.js` were measured above 36.83 m, the median ground in the crop box, and its `H` moves them on to
  it), **z** south-west (`toStreet`); the frame's centre at x = z = 0. `config/architecture-west.json`, `frame`. The
  site falls about 16 m across the crop.
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
  - the ground round the plans from 34.85 m (the south-west side) to 43.4-43.5 m (the paved upper level to the north
    and north-west), with the lower courtyard at 39.6-40 m before the set-back part: walls go down to `FOOT`,
    34.53 m.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/building.js` (every part, rounds 0 and 1), `parts/shapes.js` (the shapes the parts share, as 421E's),
  `model.js`: the lead.

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
- Round 1, the faces (2026-11-08), all estimated: on the three north-east faces the photograph shows (the slab's, its
  set-back part's and the lower block's), floors every 3.55 m, as 421E's: on each above the doors' storey a louvred
  parapet (the kit's `plain`) and a band of windows (`glass`), and the slab's doors' storey at the upper level glazed;
  the faces the photograph does not show plain. 445 triangles, 5 draw calls. The silhouette as round 0; the building's
  luma median 240 against 167: the viewer's ground is the frame's (36.83 m), 6.6 m under the paved level the
  photograph stands on, so the plain walls below that level count as the building's until step 7 sets the door's
  ground.
- Step 7, the door (2026-11-08): before the photograph's glazed doors in the slab's north-east face, 2.5 m out on the
  paved upper level (u 7, w -12.1), the LiDAR's ground 43.5 m; the frame's thresholds lowered with it, so that the
  measured frame is the expected one (0.000 m). With the viewer's ground there, as the photograph's: silhouette IoU
  0.830 (0.966 in the box: the comparison's ground plane now hides the walls below the upper level).
- The light (estimated, `config`'s `light`): the sun at 65 degrees round and 40 up, behind the camera to its left,
  as the photograph's (the tower's north-east face lit, its north-west face in shade), and an exposure of 0.8: the
  building's luma median 167 against the photograph's 168 (p10/p90 87/240 against 114/221). The block furthest
  north-west, brown-clad in the photograph, in the tower's dark grey.
- Step 8, on the site (2026-11-08): the floors start at the door's ground, the doors' storey's (they stood 0.35 m
  lower, in step with 421E's, and the doors' glazing then came down below the door, 0.92 m over the site's ground
  at the face's south-east end); the set-back part's faces start a storey up, as the slab's, plain below (its
  lowest parapet stood 3.1 m over the site's ground, which lies there lower than the LiDAR's). 421 triangles, 5
  draw calls.

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
