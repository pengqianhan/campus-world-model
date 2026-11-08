# Contract: Auckland Bioengineering House (439)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** west (the frame's `-axis`), **y** up from the frame's ground (57.96 m NZVD2016, the
  median ground in the crop box, 25 m round the outline; to be the LiDAR's ground at the config's `door`, step 7),
  **z** north (`toStreet`); the frame's centre at x = z = 0. `config/auckland-bioengineering-house.json`, `frame`.
  The site falls about 20 m across the crop, steeply toward the east.
- The building's own frame: **u** east (`-x`) and **w** north (`z`). `parts/common.js` gives `at(u, w)`,
  `rect(u, w)`, `plan(corners)` and `inset(corners, d)`.
- What the LiDAR shows (`parts/common.js` holds the numbers):
  - **the tower**, its plan a rectangle with its four corners cut, its roof at 38.73 m inside a top edge at 39.6 m;
  - **the plant room** on its roof, its top at 43.52 m;
  - **the lower building** round the tower's north and east sides, its flat roof at 8.54 m, with a strip at 11.28 m
    along the tower's east face and a part at 11.3 m before its north face;
  - the ground round the plans from -18.11 m (east of the lower building, where the site drops) to +2.3 m (Symonds
    Street to the north-west): walls go down to `FOOT`, -18.5 m.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/building.js` (every part, round 0), `parts/shapes.js` (the shapes the parts share, as 421W's), `model.js`:
  the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 256 triangles, 2 draw
  calls.

## Rounds
- Round 0 (2026-11-08): the tower, its parapet and plant room, the lower building and the two parts on it, as blocks
  at the LiDAR's plans and heights; walls in the kit's `claddingPale`, roofs `roofGrey`. Silhouette IoU 0.920 in the
  photograph (0.921 in the model's screen box); the building's luma median 242 against the photograph's 181 (the
  viewer's default light, the faces plain). The top view: footprint IoU 0.921 (the LiDAR's 1,240 m² against the
  model's 1,159, both 1,150), 81% of the 4,549 cells within 0.5 m (p10/p50/p90 -2.01/0.0/0.08: the things on the
  tower's roof, which round 0 does not draw), the highest point 43.53 m against the LiDAR's 44.43 (p99.9); block 439
  under the model 91.0%.

## Rules
- Measure, don't guess: a size the LiDAR gives is taken from it; one it does not is estimated and said to be.
- The photograph (one, from Symonds Street to the north-west, about 32 m from the tower's north face;
  `refs/photos/`, gitignored) is a reference for the look: nothing is traced or sampled from it, and no size is
  measured from it.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces of different
  materials in one plane.

## How to check
- `landmarks/pipeline/run.sh auckland-bioengineering-house compare topview` (with `PORT` serving the repository):
  the strip in `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view in `out/topview/`. GPU steps
  only under `~/.campus-loop/gpu.lock`.
