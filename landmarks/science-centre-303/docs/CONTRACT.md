# Contract: building 303 of the Science Centre

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-west (the frame's `-axis`), **y** up from the frame's ground (41.6 m NZVD2016, the
  median ground in the crop box, provisional until the config's `door` is set at step 7), **z** north-west
  (`toStreet`); the frame's centre at x = z = 0. `config/science-centre-303.json`, `frame`: the axis is the bearing
  of most of the walls.
- The building's own frame: every wall runs square with its face to the street, which is turned 3.24 degrees from
  the view frame. `parts/common.js` gives `at(u, w)` and `rect(u, w)`: u along that face from its north-east end
  toward the south-west, w out of it (the street side positive).
- The building's own returns only; the plans follow the LiDAR. A tall block south of the rear (36-40 m), outside
  the campus map's ring of 303, is a neighbour and is not drawn. Round 0's plans run into the campus map's rings of
  its neighbours (the range's south-west end into 303S's, 56 m²; the block behind the slab into 305's, 79 m²; the
  wing into 301's, 71 m²): where each part ends is for the check (step 6).
- What the LiDAR shows (`parts/common.js` holds the numbers and says where each came from):
  - **the range along the street**, 11.2 m deep, its roof at 13.4 m, a parapet at 14.05 m along the face; at its
    north-east end, where the slab does not reach, it runs back to the slab's back line;
  - **the slab** behind it, 15 m deep, from u 5.1 to where 303S's ring begins (u 70.3), its roof at 33.6 m, with a
    raised part at 37.6 m, plant at 38.2 m and a round tank on it to 44.3 m;
  - **the block** behind the slab toward the south-west, to 305's ring (w -36.3): its roof at 13.4 m, ridges at
    17 m every 6 m, a part at 22.4 m, and six round stacks along the slab's back to 42.1 m;
  - **the wing** behind the slab toward the north-east, back to w -61, its roof at 18.3 m (sawtooth in the 2023
    aerial, drawn flat yet), a strip at 16.2 m along its north-east side and a part at 21 m against the slab;
  - **the range** ends where 303S's ring begins (u 70.3): the face's last 5 m are 303S's;
  - the ground falls 5.7 m along the face to the south-west: walls go down to `FOOT`, -6.0 m.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/building.js` (every part, round 0), `parts/shapes.js` (from building 302's), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 180 triangles, 2
  draw calls; round 1's shape 1,268 and 2.

## Rounds
- Round 0: silhouette IoU 0.959 (0.959 in the model's screen box: the photograph is close up, its sky 17%) through
  the fitted camera; the building's luma median 109 against the photograph's 156 (the concrete drawn too dark).
  The top view: footprint IoU 0.832 (the LiDAR's 3,706 m² against the model's 3,420), 64% of the cells within 0.5 m
  of the LiDAR's height (the courts and stepped roofs behind the slab, the rear block's 22 m part, the plant), the
  highest point 38.1 m against the LiDAR's 42.1 (p99.9, the plant); block 303 under the model 85.7%.
- Round 1's shape: the slab's raised part, plant and tank; the block's ridges, tall part and stacks; the wing's
  strip and raised part; the range, slab, block and wing ended at the rings of 303S, 305 and 301. The top view:
  footprint IoU 0.822, 73% of the cells within 0.5 m (the model's heights minus the LiDAR's p10/p50/p90
  -0.30/0.09/1.38: the wing's sawtooth and the block's ridges, drawn by their 2 m cells), the highest point 44.3 m,
  the tank's top (its own returns' p99 44.33; the whole roof's p99.9 is 42.1); block 303 under the model 85.2%,
  305 10.2%, 303S 0%. The silhouette and luma unchanged (the photograph sees only the range's face).

## Rules
- Measure, don't guess: a size the LiDAR gives is taken from it; one it does not is estimated and said to be.
- The photograph (one, of the lower part of the face to the street; `refs/photos/`, gitignored) is a reference
  for the look only: nothing is traced or sampled from it, and no size is read from it. The relief of white blocks
  on the face is an artwork: it is not drawn after; where it is, the model has plain panels.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces of different
  materials in one plane.

## How to check
- `landmarks/pipeline/run.sh science-centre-303 refine compare topview` (from the repository root, with `PORT`
  serving it): the strip in `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view in
  `out/topview/`. GPU steps only under `~/.campus-loop/gpu.lock`.
