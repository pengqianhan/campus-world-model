# Contract: M&HS Building (502)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** west-north-west (the frame's `-axis`, along the main block), **y** up from the frame's
  ground (68.80 m NZVD2016, the median LiDAR ground in the first crop box, until the door is set), **z** north-north-east
  (`toStreet`, toward the street); the frame's centre, the middle of the main block's roof, at x = z = 0.
  `config/mhs-building-502.json`, `frame`: the building's returns over 10 m, the centre from those over 30 m, the axis
  along the main block's walls (bearing 108.43 deg, as 501's beside it). The campus's origin is about 1 km to the north:
  the map's metres and the frame's local NZTM metres lie about 19 m apart (`place` turns one into the other).
- The building's own frame: **u** east-south-east (`-x`), **w** toward the street (`z`). `parts/common.js` gives `at`,
  `plan`, `rect`.
- What the LiDAR shows (`parts/common.js` holds the numbers): the main block, u -22.9 to 21.3 and w -17.9 to 14.25,
  its hipped roof (the middle's two slopes meeting at 34.78, each end a lower hip, the roof's edge at 31.85); the two
  plant rooms (37.7); the lower west part, u -46.71 to -22.9, its low hipped roof (its planes meet at 26.26, the LiDAR's
  ridge band at 25.96 to 26.01); the raised part beside the
  block (28.8). The main block's south strip lies in block 501's ring, where 501's model draws it: this model stops at
  that strip's north edge.
- Walls go down to `FOOT`, -2.2 m (the ground round the building lies from -1.8 to +3.5).

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/shapes.js` (the Humanities
  Building's), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 1,032 triangles, 4 draw
  calls; round 1: 1,964, 6.

## Rounds
- Round 0 (2026-11-09): the main block and the west part at the LiDAR's plans, their roofs as the lowest of their fitted
  planes, the raised part and the plant rooms; walls `claddingPale`, roofs `roofGrey`, the east plant room `paint`.
  Silhouette IoU 0.901 in the model's screen box; luma 243 against 151 (the default light; the first camera). Top view:
  footprint IoU 0.879 (the strip 501 draws is the LiDAR's only), 91% of 7,566 cells within 0.5 m, highest 37.71 against
  37.78; block 502 87.0% under the model.
- Round 1 (2026-11-09, the lead alone): the camera fitted again with the roof's north-west corner as a point (the first
  fit, lines only, had a lens of 79 degrees and put that corner 85 px short); the faces, estimated through it: the
  roof's dark skirt (`screenGrey`) from 30.5 m (23.7 m on the west part), the east end's glazed strip (`screenBlack`)
  south of w 3.4, the north face mid grey (`grey`, its fins and spandrels together); the light. 1,964 triangles, 6 draw
  calls. Silhouette IoU 0.934 in the box, luma 138 against 141.
- The review's round 1 (2026-11-09): the plant rooms start just below the lowest of the roof under each (the west one
  stood 0.8 to 1.1 m over the west hip). Refined and compared again with the camera's view on the door's ground (step
  7): silhouette IoU 0.932 in the box, luma 138 against 137; top view, counting the cells more than 2.5 m over the
  door's ground (over the first ground before): footprint IoU 0.905, 91% of 7,536 cells within 0.5 m, highest 35.02
  against 35.10 over the door's ground; block 502 87.0% under the model. 1,964 triangles, 6 draw calls.

## Rules
- Measure, don't guess: a size not from the LiDAR is named in the config's `estimated`, here and on the card.
- No two faces of different materials in one plane; every wall down to `FOOT`.
- The photograph is a reference only: never traced, sampled or published; it stays in the gitignored `refs/photos/`.
