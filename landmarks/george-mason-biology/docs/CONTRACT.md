# Contract: the George Mason Biology Building (106)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-east (the frame's `-axis`), **y** up from the door's ground (provisional: 37.30 m
  NZVD2016, the median ground in the first crop box, until the door is set at step 7), **z** south-west (`toStreet`);
  the frame's centre at x = z = 0. `config/george-mason-biology.json`, `frame`: the building's returns within 1.5 m of
  the campus map's ring, the axis along its long walls (bearing -44.25 deg). The outline is now traced from the LiDAR
  (`building.outline_note`: the campus map's ring is about 5 m short at each end); the frame measured on the campus
  map's ring is kept as `frame.expected`, so that the model, the camera and the placement keep it.
- The building's own frame: **u** north-west (`-x`), along the long walls, **w** south-west (`z`). `parts/common.js`
  gives `at` and `plan`, and `H`, which turns a height measured above 37.30 m into one above the door's ground.
- What the LiDAR shows (`parts/common.js` holds the numbers): the long block (u -29.1 to 29.4, w -6.0 to 6.0) with its
  walls to a parapet at 12.2 to 12.6, a grey attic set back about 0.8 m to 14.7 and a low hipped roof to 15.8; the
  middle wider (u -17.0 to 17.0, w -8.8 to 8.8), its walls to 12.4 to 12.7, its attic to 14.4 and roof to 16.4, raised
  parts at 17.1 to 17.9 over it at each end; two wings to the south-west (to w 12.0) whose roofs stand at 14.2; a
  tower at 15.5 and a strip at 12.5 on the north-east side; and low parts round its foot at 4.0 to 7.0.
- Walls go down to `FOOT`, 3 m under 37.30 m: the ground lies from 35.9 to 38.8 round the building (p5 to p95).

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/shapes.js` (Te Pūtahi Tangata's),
  `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 388 triangles, 2 draw
  calls.

## Rounds
- Round 0 (2026-11-10, the lead alone): the parts at the LiDAR's edges, the walls cream (`plain`), the attics grey
  metal and the roofs grey (`roofGrey`). The photograph's camera fitted to the south-east end wall (its foot, its top
  and its north-east corner, its two pilasters) and the attic's top behind it (rms 1.39 px). Top view: footprint IoU
  0.897, 75% of 3,935 cells within 0.5 m; block 106 98.5% under the model.

## Rules
- Measure, don't guess: a size not from the LiDAR is named in the config's `estimated`, here and on the card.
- No two faces of different materials in one plane; every wall down to `FOOT`.
- The photograph is a reference only: never traced, sampled or published; it stays in the gitignored `refs/photos/`.
