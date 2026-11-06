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
  - **the slab** behind it, 15.6 m deep, from u 6.75 to where 303S's ring begins (u 70.3), its roof at 33.6 m with a
    bay at each end at 32.8 m; on it a raised part at 37.6 m, a screened deck, a round tank to 41.8 m with a flue to
    44.7 m, and a box at 38.1 m;
  - **the block** behind the slab toward the south-west, to 305's ring (w -36.3): its roof at 13.4 m, flat-topped ridges
    at 17 m 2.75 to 3.25 m wide (the last 5.25) about every 6 m, a part at 22.4 m, and six round stacks along the slab's back to 42.1 m;
  - **the wing** behind the slab toward the north-east, from w -31 back to -61, its roof at 18.3 m with two troughs
    across it behind w -36, a strip at 16.2 m along its north-east side and its front, a light well 2 m wide between it
    and the slab, and a part at 21 m against the slab;
  - **the range** ends where 303S's ring begins (u 70.3): the face's last 5 m are 303S's;
  - the ground falls 5.7 m along the face to the south-west: walls go down to `FOOT`, -6.0 m.
- **The door** (step 7) is on the forecourt 5.5 m out from the face before the entrance (u 19.5), at its front edge,
  where the LiDAR's ground is the frame's (27 returns within 1 m, p50 -0.016 m); the forecourt under the canopy is
  0.08-0.12 m above it. No other block of the campus map has half of it under the model (305 10.2%, 301 1.5%):
  `building.also` is empty.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/building.js` (every part's mass), `parts/faces.js` (the face to the street), `parts/shapes.js` (the shapes the
  parts share), `model.js`: the lead.

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
- The check begun (step 6): the wing's two troughs as ramps (16.9 to 18.2 m over 2.5 m), the block's ridges at
  their 0.5 m cells (3 m wide, from its back to the stacks): 77% of the cells within 0.5 m (p10/p50/p90 -0.36/0.09/
  0.94); 1,360 triangles, 2 draw calls. Then the slab's end bays, its plant as the 1 m cells have it, the slab's
  north-east end at u 6.75 and its back at w -26.8, the wing's front strip and the light well: 86% of the cells within
  0.5 m (p10/p50/p90 -0.27/0.07/0.29), footprint IoU 0.839, the model's 3,113 m² of which 3,110 the LiDAR's too;
  block 303 under the model 83.7% (the light well, which has no returns, is in its ring); 1,512 triangles.
- Step 5's face (the one the photograph shows): the gaps between its bands as dark strips 2 cm before it at the
  LiDAR's layers (10.15 and 5.85 m), the shadow under the lowest band, the canopy along the entrance (its returns:
  2.74 m, 0.93 m out, u 11.6-52.6) and the ground storey glazed under it (estimated); the walls in `concreteMauve`,
  added to the kit (the paint's shader in a mauve grey: the Clock Tower's, the Kate Edger Information Commons', the
  Humanities Building's and the Thomas Building's viewer pictures at `?quality=low` and `?mask=1` the same pixel for
  pixel before and after); the viewer's light from behind (overcast), its exposure 2.0. Silhouette IoU 0.960 (0.960
  in the box); the luma p10/p50/p90 50/152/158 against the photograph's 111/156/200. From above: footprint IoU
  0.848, 86% of the cells within 0.5 m; block 303 under the model 84.8%. 1,572 triangles, 5 draw calls.
- The roofs' colours from the 2023 aerial: the range's and the slab's near white (about 210 luma), drawn in the kit's
  `roofPale`; the rear block's and the wing's darker (a blue grey and a mauve grey), drawn in `roofGrey`
  (estimated). 6 draw calls.

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
