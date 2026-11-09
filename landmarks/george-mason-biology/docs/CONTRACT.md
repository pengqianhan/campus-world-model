# Contract: the George Mason Biology Building (106)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-east (the frame's `-axis`), **y** up from the door's ground (36.61 m NZVD2016, on the
  pavement before the middle of the south-east end), **z** south-west (`toStreet`); the frame's centre at x = z = 0.
  `config/george-mason-biology.json`, `frame`: the building's returns within 1.5 m of the campus map's ring, the axis
  along its long walls (bearing -44.25 deg). The outline is now traced from the LiDAR (`building.outline_note`: the
  campus map's ring is about 3.5 m short at each end); the frame measured on the campus map's ring is kept as
  `frame.expected`, so that the model, the camera and the placement keep it.
- The building's own frame: **u** north-west (`-x`), along the long walls, **w** south-west (`z`). `parts/common.js`
  gives `at` and `plan`, and `H`, which turns a height measured above 37.30 m, the first crop box's median ground, into
  one above the door's ground (0.69 m lower).
- What the LiDAR shows (`parts/common.js` holds the numbers): the long block (u -29.1 to 29.4, w -6.0 to 6.0) with its
  walls to a parapet at 12.2 to 12.6, a grey attic set back about 0.8 m at the ends and 1.4 m on the long sides to 14.7
  and a low hipped roof to 15.8; the middle wider (u -17.0 to 17.0, w -8.8 to 8.8), its walls to 12.4 to 12.7, its attic
  to 14.4 and roof to 16.4, raised parts at 17.1 to 17.9 over it at each end; two wings to the south-west (to w 12.0)
  whose roofs stand at 14.2; a tower at 15.5 on the north-east side; a canopy at 6.6 past the north-west end, with faces
  on its outer edge from 3.6 and its south-west side from 5.0, open under it; and low parts round its foot at 4.0 to
  7.0. A tree's returns at 9 to 13 on the north-east side near the south-east end are not drawn.
- Walls go down to `FOOT`, 3 m under 37.30 m (2.31 m under the door's ground): the ground lies from 35.9 to 38.8 round
  the building (p5 to p95).

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/shapes.js` (Te Pūtahi Tangata's),
  `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 388 triangles, 2 draw
  calls; step 5: 940, 4; steps 6 and 7: 1,012, 4; the review's round 1: 972, 4; round 2: 996, 4.

## Rounds
- Round 0 (2026-11-10, the lead alone): the parts at the LiDAR's edges, the walls cream (`plain`), the attics grey
  metal and the roofs grey (`roofGrey`). The photograph's camera fitted to the south-east end wall (its foot, its top
  and its north-east corner, its two pilasters) and the attic's top behind it (rms 1.39 px). Top view: footprint IoU
  0.897, 75% of 3,935 cells within 0.5 m; block 106 98.5% under the model.
- Step 5 (2026-11-10): the south-east end's two pilasters (0.25 m proud, the LiDAR's; 0.7 m wide, estimated) and its six
  red-framed windows (estimated in the photograph through its fitted camera), laid over the photograph on its own.
- Steps 6 and 7 (2026-11-10): the door on the pavement before the middle of the south-east end (36.61 m; no record of
  the entrance), `H`, the thresholds and the camera moved with it; the light (the sun behind the building, exposure 0.75
  from a plain stretch of the end wall: luma 161 against 161); from the top view, the raised parts 4.5 m long with a
  vent each at 17.9, and the courtyard between the wings open. Top view: footprint IoU 0.930, 84% of 3,945 cells within
  0.5 m, the highest point 18.60 against 18.59; block 106 98.5%.
- Step 8 (2026-11-10): on the site; the windows 2.6 m wide, clear of the pilasters, and the mullions into the frames,
  where the landmark tests' faces check found their faces in one plane with the pilasters' and the glass's.
- The review's round 1 (2026-11-10): the tower on the north-east side a solid block with its flat top at 15.5 (it was an
  L of 0.3 m walls); the strip at 12.5 near the south-east end not drawn (a tree's returns); the part at 6.6 past the
  north-west end a canopy 0.4 m deep (estimated), open under it; the campus map's ring 3.5 m short at each end, not 5.
  972 triangles, 4 draw calls. Top view: footprint IoU 0.928, 85% of 3,932 cells within 0.5 m, the highest point 18.60
  against 18.59; block 106 98.4%. Luma as before.
- The review's round 2 (2026-11-10): the canopy's faces, which the LiDAR sees on its outer edge from 3.6 up and on its
  south-west side from 5.0 up, drawn to their lowest returns (where they end below is estimated); 996 triangles, 4 draw
  calls.

## Rules
- Measure, don't guess: a size not from the LiDAR is named in the config's `estimated`, here and on the card.
- No two faces of different materials in one plane; every wall down to `FOOT`.
- The photograph is a reference only: never traced, sampled or published; it stays in the gitignored `refs/photos/`.
