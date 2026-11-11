# Contract: 67 Symonds Street (619)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** east (the frame's `-axis`), **y** up from the door's ground (63.49 m NZVD2016, on the
  walkway before the entrance's porch), **z** south (`toStreet`); the frame's centre at x = z = 0.
  `config/67-symonds-street.json`, `frame`: the building's returns within 1.5 m of the campus map's ring, the axis along
  the tower's south face (bearing 270.4 deg).
- The building's own frame: **u** west (`-x`), along the tower's south face, **w** south (`z`). `parts/common.js` gives
  `at` and `plan`, and `H`, which turns a height measured above 55.66 m (the median ground in the outline's band) into
  one above the door's ground (7.83 m higher).
- What the LiDAR shows (`parts/common.js` holds the numbers): a tower (u -19.9 to 5.5, w -5.65 to 19.65) with its
  parapet's top at 91.30 to 91.36 m and its roof at 90.3 m, a block turned 45 degrees and a bar over its roof to 96.0
  and 95.2 m, two plant rooms at 92.8 m, plant between the bar's end and the block at 93.34 m and a low plant room
  at 92.47 m; a podium round its north and west, inside the campus map's ring, its roof at
  72.5 to 73.8 m, running down the slope to the gully on the west (its ground at about 40 m); in the ring's triangle
  south of the tower's south-east part a roof at 71.0 to 72.3 m over ground the LiDAR sees through it (the porch). The
  walkway and its canopy, outside the ring, and the lower block to the south-west (65 m) are not drawn.
- Walls go down to `FOOT`, 16.7 m under 55.66 m (38.96 m): the ground round the ring lies from 39.9 m (the gully) to
  63.5 m on its south side, the street before it rising to 66.5 m.

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/facade.js`, `parts/shapes.js` (114's),
  `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2, a stand-in measured massing drawn in detail), merged by
  material. Round 0 and steps 5 to 7: 816 triangles, 4 draw calls; the review's round 1: 744, 4; round 2: 856, 4.

## Rounds
- Round 0 to step 7 (2026-11-11, the lead alone): the podium on the campus map's ring at the LiDAR's roof, the tower at
  its parapet and roof, the core's block, bar and plant at the LiDAR's edges and heights; the porch's glass roof; the
  walls white (`paint`), the roofs mid-grey (`roofGrey`, as the 2023 aerial shows them). The photograph's camera fitted
  to the tower's two roof edges against the sky, its south-east and south-west corners and their verticals (rms 2.25 px,
  1.67 m over the LiDAR's ground at the camera, a lens of 46.6 degrees, about 57 m from the south-east corner). The
  faces it sees, estimated through it: storeys 4.04 m apart, five rows of windows (`glass`) on the south face's three
  columns and the east face's three, its louvred panels (`claddingPale`), the curved bay's dark bands. The
  door on the walkway before the porch (63.49 m; no record of the entrance), `H`, the thresholds and the camera moved
  with it. The light: the sun high to the north-north-east (15 deg, 45 up), exposure 0.62: the south face's plain panels
  143 against 144, the east face's 198 against 194. Silhouette IoU 0.944 in the model's box (0.697 over the photograph);
  luma p50 144 against 152. Top view: footprint IoU 0.929, 79% of 5,200 cells within 0.5 m (the parapets and plant on
  the roofs make most of the rest); the highest point 32.52 m over the door's ground against the
  LiDAR's 32.66; block 619 99.9% under the model.

- Step 8 (2026-11-11): on the site; the tower's walls down to the walls' foot, the podium's south side 0.1 m inside
  the tower's south face and the parapet from 1 cm over the roof's slab, where the landmark tests' faces check found
  faces of two materials in one plane; the roofs mid-grey (`roofGrey`), as the 2023 aerial shows them (luma 124 to
  184). 816 triangles, 4 draw calls.

- The review's round 1 (2026-11-11): the bar over the roof to the LiDAR's returns over 94 m (u -17.1 to -7.5, w 5.0
  to 7.2, at 95.2 m; it ran out west of the turned block over bare roof), a second plant room at 92.8 m (u -14.2 to
  -8.9, w 3.2 to 5.0) and the first trimmed to u -8.6; the podium's east side inside the tower's east face, where the
  ring stood 0.2 m out from it from the walls' foot to 72.6 m; the tower's walls white up to the parapet's top, the roof
  slab inside the parapet; four rows of windows, the ones the photograph sees, their heads 0.3 m under the camera's,
  under the roof's deck; the porch's plan named as the campus map's (estimated); the stand-ins the generator measures
  26. 744 triangles, 4 draw calls; silhouette IoU 0.947 in the model's box (0.698 over the photograph), luma p50 144
  against 152; top view: footprint IoU 0.929, 80% of 5,200 cells within 0.5 m.
- The review's round 2 (2026-11-11): the east face's fifth row of windows back (round 1 took the south face's fifth,
  which the porch's pyramid hides, and the east face's with it, which the photograph sees behind the tree's branches);
  over the tower's roof the plant between the bar's end and the turned block (93.34 m) and a low plant room (92.47 m),
  which the LiDAR has and the narrower bar left bare. 856 triangles, 4 draw calls; silhouette IoU 0.947 in the model's
  box, top view 0.929 and 80% within 0.5 m, as round 1.
- The review's round 3 (2026-11-11): the low plant room to its returns over 92 m (u -10.2 to -8.3, w 12.7 to 14.3);
  it had been drawn over a box that took in the deck east of it. 856 triangles, 4 draw calls; the figures as round 2.

## Rules
- Measure, don't guess: a size not from the LiDAR is named in the config's `estimated`, here and on the card.
- No photograph, Street View image or anything made from one goes into a commit.
