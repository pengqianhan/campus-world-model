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
  and 95.8 m and plant at 92.8 m; a podium round its north and west, inside the campus map's ring, its roof at 72.5 to
  73.8 m, running down the slope to the gully on the west (its ground at about 40 m); in the ring's triangle south of
  the tower's south-east part a roof at 71.0 to 72.3 m over ground the LiDAR sees through it (the porch). The walkway
  and its canopy, outside the ring, and the lower block to the south-west (65 m) are not drawn.
- Walls go down to `FOOT`, 16.7 m under 55.66 m (38.96 m): the ground round the ring lies from 39.9 m (the gully) to
  66.5 m (the street).

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/facade.js`, `parts/shapes.js` (114's),
  `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2, a stand-in measured massing drawn in detail), merged by
  material. Round 0 and steps 5 to 7: 816 triangles, 4 draw calls.

## Rounds
- Round 0 to step 7 (2026-11-11, the lead alone): the podium on the campus map's ring at the LiDAR's roof, the tower at
  its parapet and roof, the core's block, bar and plant at the LiDAR's edges and heights; the porch's glass roof; the
  walls white (`paint`), the roofs light grey (`roofPale`). The photograph's camera fitted to the tower's two roof
  edges against the sky, its south-east and south-west corners and their verticals (rms 2.25 px, 1.67 m over the
  LiDAR's ground at the camera, a lens of 46.6 degrees, about 57 m from the south-east corner). The faces it sees,
  estimated through it: storeys 4.04 m apart, five rows of windows (`glass`) on the south face's three columns and the
  east face's three, its louvred panels (`claddingPale`), the curved bay's dark bands. The door on the walkway before
  the porch (63.49 m; no record of the entrance), `H`, the thresholds and the camera moved with it. The light: the sun
  high to the north-north-east (15 deg, 45 up), exposure 0.62: the south face's plain panels 143 against 144, the east
  face's 198 against 194. Silhouette IoU 0.943 in the model's box (0.696 over the photograph); luma p50 144 against
  152. Top view: footprint IoU 0.929, 79% of 5,200 cells within 0.5 m (the podium's and the tower's parapets and the
  plant over the roofs, not drawn, make most of the rest); the highest point 32.52 m over the door's ground against
  the LiDAR's 32.66; block 619 99.9% under the model.

## Rules
- Measure, don't guess: a size not from the LiDAR is named in the config's `estimated`, here and on the card.
- No photograph, Street View image or anything made from one goes into a commit.
