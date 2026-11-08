# Contract: M&HS Building (501)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** west-north-west (the frame's `-axis`, along the long block), **y** up from the frame's
  ground, 71.88 m NZVD2016, the median ground in the first crop box, 25 m round the outline (provisional: the LiDAR's
  ground at the door at step 7), **z** north-north-east (`toStreet`, toward building 502); the frame's centre, at the
  top of the tower, at x = z = 0. `config/mhs-building-501.json`, `frame`. The campus's origin is about 1 km to the
  north: there the map's true north and NZTM's grid north differ by about 1 degree, so the map's metres and the
  frame's local NZTM metres lie about 19 m apart (`place` turns one into the other).
- The building's own frame: **u** east-south-east (`-x`), toward the plaza, and **w** toward 502 (`z`).
  `parts/common.js` gives `at(u, w)`, `plan(corners)` and `rect(u, w)`.
- What the LiDAR shows (`parts/common.js` holds the numbers):
  - **the long block**, about 29.8 m, u -28.5 to -2 and w -6.5 to 9.5, its west end over a yard 4.8 m below the
    plaza;
  - **the tower** at its east end, toward the plaza, u -2 to 9 and w -7 to 10: its **crown**'s flat top at 32.4 m,
    its edges falling to about 28 to 30 m;
  - **a plant room** of 34.8 m on the block's south side, **a lower part** south of it (30.6 and 28.6 m), **a
    concrete link** of 28.6 m on its north side;
  - **atria** to the north and south between it and buildings 502 and 503, which return nothing (glass roofs);
  - **a glazed box** of 4.5 m before the tower's east face, to u 16.8;
  - inside the campus map's ring of 501, **the south edge of building 502**, its roof rising from 27.5 m at its south
    wall (w 13.8) to 30.6 m (w 24); and **the plaza** east of the tower, the ground and trees;
  - the ground about +0.2 to +0.4 on the plaza and along the north side, -4.8 at the west end and along the south
    side west of the tower: walls go down to `FOOT`, -5.3 m.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/tower.js`, `parts/block.js` (every part), `parts/shapes.js` (the shapes the parts share, as the Humanities
  Building's), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2, a large teaching building), merged by material. Round
  0: 244 triangles, 4 draw calls.

## Rounds
- Round 0 (2026-11-09): the tower's shaft (`renderGrey`), its crown (`roofGrey`) and the glazed box before it
  (`glass`), the long block, the plant room, the parts south and north of it (`renderGrey`, their roofs
  `roofGrey`), the atria (`glass`) and 502's south edge (`claddingPale`, its roof `roofGrey`), at the LiDAR's plans
  and heights. Silhouette IoU 0.470 in the photograph (0.893 in the model's screen box); the building's luma median
  196 against the photograph's 131 (the viewer's default light, the faces plain). The top view: footprint IoU 0.654
  (the LiDAR's 1,006 m² against the model's 1,510, both 995: the atria, which return nothing, are the model's only),
  64% of the 3,934 cells both cover within 0.5 m (p10/p50/p90 -0.43/0.13/4.04), the highest point 34.81 m against
  the LiDAR's 34.71 (p99.9); block 501 under the model 74.8% (its ring takes in the plaza), 501C 13.2%, 502 6.3%,
  503 4.5%.

## Rules
- Measure, don't guess: a size the LiDAR gives is taken from it; one it does not is estimated and said to be.
- The photograph (one, from the plaza about 67 m before the tower's east face; `refs/photos/`, gitignored) is a
  reference for the look: nothing is traced or sampled from it, and no size is measured from it but the crown's eave
  over the east face and the atria's tops, which are estimated through its fitted camera.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces of different
  materials in one plane.

## How to check
- `landmarks/pipeline/run.sh mhs-building-501 compare topview` (with `PORT` serving the repository): the strip in
  `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view in `out/topview/`. GPU steps only under
  `~/.campus-loop/gpu.lock`.
