# Contract: M&HS Building (505)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** west-north-west (the frame's `-axis`, along the long block), **y** up from the frame's
  ground, the LiDAR's ground at the door (until step 7, 72.13 m NZVD2016, the median ground in the first crop box,
  from which the heights in `parts/common.js` are measured; `H` moves them on), **z** north-north-east (`toStreet`,
  toward the plaza and the main road); the frame's centre at x = z = 0. `config/mhs-building-505.json`, `frame`. The
  campus's origin is about 1 km to the north: there the map's true north and NZTM's grid north differ by about 1
  degree, so the map's metres and the frame's local NZTM metres lie about 19 m apart (`place` turns one into the
  other).
- The building's own frame: **u** east-south-east (`-x`), toward the main road, and **w** toward the plaza (`z`).
  `parts/common.js` gives `at(u, w)`, `plan(corners)` and `rect(u, w)`.
- What the LiDAR shows (`parts/common.js` holds the numbers):
  - **the long block**, u -32.7 (against 504) to its east end, w -18.3 to 7.9. Its east face is not square to the
    axis: from the north-east corner (54.3, 7.9) to (60.5, -9.0), 17 degrees off; its south-east corner is cut back
    on a straight line from (61.3, -11.0) to (37.5, -18.3), with a raised band of 18.7 m along that cut and the south
    face east of u 30;
  - its roof: **a flat middle** of 20.85 m (w -10.2 to 1.0, u -32.7 or -14.5 to 37.5) with lower strips round it,
    **the north strip** 17.9 m falling to 17.3 at the north face, **the east part** 18.2 m falling to 17.4 at the east
    face, **the south band** 17.9 m falling to 17.4 at the south face;
  - **the atrium** at the block's west end, between it and 503 (u -45.5 to -14.5, w -4.5 to 10.3), its glass roof
    rising from 21.6 m at its south side to 24.6 m at its north side;
  - **a low link** of 17.3 m north of the block's west part (u -13 to 8), to 503's east wing, and **a low strip** of
    16.8 m west of the atrium;
  - inside the campus map's ring of 505 but not of it: 10 to 12 m of **the plaza** north of the block (the ring takes
    in the storeys under it), and a strip of **503**'s roof (28.7 to 30 m) north of the atrium;
  - the ground: 0 on the plaza north of the block, rising to about +2.5 by the main road at its south-east corner and
    falling to -3.4 along the street south of its west end: walls go down to `FOOT`, -4.5 m over the provisional
    ground.
- What it draws: what the LiDAR has of 505 inside its ring, so that it stands over no part of the blocks of 503 and
  504. The outline (`building.outline`) is traced from the LiDAR; the campus map's ring is kept as `campus_outline`.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/block.js` (every part), `parts/shapes.js` (the shapes the parts share, as 501's), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2, a large teaching building), merged by material. Round
  0: 208 triangles, 3 draw calls; round 1: 1,270, 5.

## Rounds
- Round 0 (2026-11-10): the long block's four parts and the atrium, the link and the low strip, at the LiDAR's plans
  and heights, each roof flat (walls `plain`, roofs `roofGrey`, the atrium's roof `glass`). Silhouette IoU 0.942 in
  the photograph (0.952 in the model's screen box, a third of it sky); the building's luma median 240 against the
  photograph's 176 (the viewer's default light, the faces plain). The top view: footprint IoU 0.773 (the LiDAR's
  3,207 m² against the model's 2,674, both 2,564: 503's strip in the ring is the LiDAR's only), 81% of the 10,132
  cells both cover within 0.5 m (p10/p50/p90 -0.45/0.03/0.50); the highest point 23.01 m against the LiDAR's 30.12
  (p99.9, 503's roof in the ring); block 505 under the model 68.8% (its ring takes in the plaza), 504 5.9%.
- Round 1 (2026-11-10, the lead alone): the north face, through the photograph's fitted camera (estimated): the
  ground floor set back 2.5 m under the upper storeys to its soffit at 4.6 m (the first floor's slab edge from 3.9 m),
  round columns every three bays before it; a white panel wall at the north-east corner (u 50.62 to the corner);
  twelve bays of 2.755 m with their glazing set back 1 m behind silver fins (`screenSilver`) and twelve louvres a
  bay, a frame along their top and the white parapet over it; the end bay, a white wall standing out to w 8.5 (the
  LiDAR) from the last fin to u 8.7, with a window in each storey in a dark frame (`screenGrey`), and the shade the
  LiDAR has over the top one; the glazed front west of it under a grey band; the east face's glass from the
  north-east corner to w -4.3 (from 4.4 m); the dark band (`screenGrey`) round the south-east cut to 18.7 m; the
  atrium's glass roof one slope from 21.6 to 24.6 m; the link glazed under a grey band; the walls `claddingPale`
  (the photograph's panels are a neutral white; `plain` is the kit's warm white for estimated blocks). The light:
  the sun at 350 degrees round and 50 up, exposure 1.0 (estimated: the luma of the white wall at the north-east
  corner 241 against the photograph's 240, of the end bay's wall 240 against 243, of the north face between them 143
  against 135, of the dark band 85 against 91; the compare's figure over the model's screen box, where the photograph
  has the road, cars and a lawn before the ground floor, 152 against 177). The outline traced from the LiDAR (the
  ring kept as `campus_outline`). 1,270 triangles, 5 draw calls. Silhouette IoU 0.934 in the photograph (0.945 in
  the model's screen box). The top view: footprint IoU 0.917 (the LiDAR's 2,915 m² against the model's 2,695, both
  2,683), 93% of the 10,600 cells within 0.5 m; the highest point 24.59 m against the LiDAR's 28.81 (p99.9: 503's
  edge, within the top view's 1.5 m of the outline); block 505 under the model 69.4% (its ring takes in the plaza),
  504 5.9%.
- The door (2026-11-10): before the glazed entrance the photograph shows in the north face's ground floor, on the
  plaza 4.1 m out from its glass (the campus map records no lobby or entrance in 505, OpenStreetMap none near it),
  the LiDAR's ground there 72.16 m (13 returns, p50), 0.03 m over the crop's median: the frame's thresholds lowered by
  as much, the heights moved on to it through `H`, the photograph's camera refitted on it (the same camera). The map's
  ground (its 8 m elevation model) at the door lies 1.25 m above the LiDAR's; along the outline it runs from 0.56 m
  below the door's to 2.48 m above (FOOT -4.53 is under it everywhere). The comparison and the top view as in round 1.
- On the site (2026-11-10): `site` true, the card's `estimated`; the faces check found the end fins' feet in the white
  walls' undersides and the fins' backs in the glazing's glass: the fins now start 0.02 m over the soffit and 0.05 m
  out of the glazing. The foot check passes. Beside an open neighbour the model gives way to block 505, whose
  footprint stands above the drawn ground on 74% of its cells, by up to 3.12 m. 1,270 triangles, 5 draw calls.

## Rules
- Measure, don't guess: a size the LiDAR gives is taken from it; one it does not is estimated and said to be.
- The photograph (one, from the main road about 42 m north-east of the block's north-east corner; `refs/photos/`,
  gitignored) is a reference for the look: nothing is traced or sampled from it, and no size is measured from it
  unless this contract names it as estimated through its fitted camera.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces of different
  materials in one plane.

## How to check
- `landmarks/pipeline/run.sh mhs-building-505 compare topview` (with `PORT` serving the repository): the strip in
  `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view in `out/topview/`. GPU steps only under
  `~/.campus-loop/gpu.lock`.
