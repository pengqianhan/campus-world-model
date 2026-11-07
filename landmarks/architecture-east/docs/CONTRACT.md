# Contract: Architecture - East (421E)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-west (the frame's `-axis`), **y** up from the frame's ground (31.6 m NZVD2016, the
  median ground in the crop box, 25 m round the outline; to be the LiDAR's ground at the config's `door`, step 7),
  **z** north-west (`toStreet`); the frame's centre at x = z = 0. `config/architecture-east.json`, `frame`. The site
  falls about 27 m across the crop.
- Two frames of the building's own: its walls run in two directions 45 degrees apart (the campus map's ring: its
  edges at -4.4 and 40.0 degrees from x toward z). `parts/common.js` gives `at(F, u, w)` and `rect(F, u, w)`: in
  frame `W` the lower wing and the west tower, in frame `E` the main block and the tall tower; u along the walls'
  first direction, w across it.
- What the LiDAR shows (`parts/common.js` holds the numbers):
  - **the lower wing**, its roof at 22.3 m inside a parapet at 23.3 m;
  - **the west tower** on it, its top a plane rising to 33.6 m at its end;
  - **the main block**, its walls to eaves at 25 m under a gabled roof whose ridge runs at 30 m;
  - **the tall tower** out of that roof, its top a plane rising to 36.7 m at its end;
  - **the ring's south-east part**, a car park at the ground: not drawn;
  - the ground round the plans from -1.16 m to +8.5 m (the raised terrace to the north-west): walls go down to `FOOT`,
    -1.5 m.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frames): the lead.
- `parts/building.js` (every part, round 0), `parts/shapes.js` (the shapes the parts share), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 94 triangles, 3 draw
  calls.

## Rounds
- Round 0 (2026-11-07): the four parts as blocks at the LiDAR's plans and heights; walls in the kit's
  `claddingPale`, roofs `roofGrey`, the towers `screenGrey`. Silhouette IoU 0.927 in the photograph (0.927 in the
  model's screen box); the building's luma median 242 against the photograph's 176 (the viewer's default light).
  The top view: footprint IoU 0.766 (the LiDAR's 1,600 m² against the model's 1,362, both 1,286), 50% of the cells
  within 0.5 m (p10/p50/p90 -1.43/-0.3/2.02: the terraces and the stepped faces, which round 0 does not draw), the
  highest point 36.64 m against 36.56; block 421E under the model 57.2% (its ring takes in the car park), 421W 8.5%.

## Rules
- Measure, don't guess: a size the LiDAR gives is taken from it; one it does not is estimated and said to be.
- The photograph (one, from the raised terrace to the north-west, about 50 m from the tall tower; `refs/photos/`,
  gitignored) is a reference for the look: nothing is traced or sampled from it, and no size is measured from it.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces of different
  materials in one plane.

## How to check
- `landmarks/pipeline/run.sh architecture-east compare topview` (with `PORT` serving the repository): the strip in
  `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view in `out/topview/`. GPU steps only under
  `~/.campus-loop/gpu.lock`.
