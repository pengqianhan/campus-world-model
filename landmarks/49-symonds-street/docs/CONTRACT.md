# Contract: 49 Symonds Street (620)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** east-north-east (the frame's `-axis`), **y** up from the frame's ground, the LiDAR's
  ground at the config's `door` (56.87 m NZVD2016, on the footpath before the podium's entrance; step 7), **z**
  south-south-east (`toStreet`, Symonds Street); the frame's centre, the tower's, at x = z = 0.
  `config/49-symonds-street.json`, `frame`. The heights below, and those in `parts/common.js`, are measured above
  56.79 m, the median ground in the crop box, 25 m round the outline; its `H` moves each on to the door's ground,
  0.08 m higher.
- The building's own frame: **u** west-south-west (`-x`) and **w** to the street (`z`). `parts/common.js` gives
  `at(u, w)`, `rect(u, w)`, `plan(corners)` and `inset(corners, d)`.
- What the LiDAR shows (`parts/common.js` holds the numbers):
  - **the tower**, a square of about 33 m with its corners stepped and a bay out of its street and back faces, its
    parapet's top at 47.06 m and its roof inside it at 45.80 m;
  - **the mansard** on its roof, its eaves at 49.3 m and its flat top at 51.94 m with three units on it to 52.94 m,
    its plan stepped in at the tower's east and west corners as the tower's is, and **the plant** east of it at
    49.8 m;
  - **a gable** in the middle of each of its four faces, its apex at 49.05 to 49.8 m;
  - **the podium** to its east, its flat roof at 7.68 m, with a gable over its entrance to the street at 10.13 m and a
    canopy along its front at 3.06 m;
  - **three lower buildings** behind the podium and north of it, at 4.59, 5.42 and 3.04 m;
  - the ground round the plans from -0.56 m (beside the podium) to +1.97 m (Symonds Street before the tower), and the
    map's ground (its 8 m elevation model) under them, about the door's, from -1.55 m to +5.33 m: walls go down to
    `FOOT`, -1.8 m.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/building.js` (every part, rounds 0 and 1), `parts/shapes.js` (the shapes the parts share, as Architecture -
  West's), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 800 triangles, 2 draw
  calls; round 1: 1,241 triangles, 5 draw calls; step 7: 1,253; the review's round 1: 1,289.

## Rounds
- Round 0 (2026-11-09): the tower with its parapet, the mansard, the plant and the four gables, the podium with its
  entrance's gable and the three lower buildings, as blocks at the LiDAR's plans and heights; walls in the kit's
  `claddingPale`, roofs `roofGrey`. Silhouette IoU 0.788 in the photograph (0.788 in the model's screen box); the
  building's luma median 245 against the photograph's 133 (the viewer's default light, the faces plain). The top view:
  footprint IoU 0.884 (the LiDAR's 1,672 m² against the model's 1,512, both 1,494), 80% of the 5,885 cells within
  0.5 m (p10/p50/p90 -0.23/0.02/1.07), the highest point 51.94 m against the LiDAR's 52.63 (p99.9); block 620 under
  the model 51.0%, of its 6,436 cells where the LiDAR has a roof 92.7%.
- Round 1 (2026-11-09, the lead): the faces (`docs/ART_BIBLE.md`): the tower's walls in `glass` between a base in the
  kit's `screenBlack` and a band in `claddingPale`, white on its bays and its north-east face, with the arched windows
  and the windows of each storey in glass; the podium and the lower buildings in `screenBlack`; the mansard's top
  `roofPale`; the three units on it. The photograph's camera refitted with one more point (the apex of the gable over
  the podium's entrance): rms 2.25 px. The light: the viewer's sun 75 degrees round and 30 up, an exposure of 0.8.
  Silhouette IoU 0.881 (0.882 in the box); the luma median 134 against the photograph's 132.
- Step 7 (2026-11-09): the door on the footpath before the podium's entrance, the frame's ground the LiDAR's there
  (56.87 m), the canopy along the podium's front. Silhouette IoU 0.881 (0.882 in the box), luma 134 against 132; the
  top view: footprint IoU 0.882, 80% of the 5,893 cells within 0.5 m (p10/p50/p90 -0.23/0.03/1.06), the highest point
  52.87 m against the LiDAR's 52.55; block 620 under the model 51.4%, of its 6,426 cells where the LiDAR has a roof
  93.0%; no other block under it by more than 0.1%. The map's ground at the door lies 7.61 m below the LiDAR's.
- The review's round 1 (2026-11-09): the mansard's eaves and top stepped in at the tower's east and west corners, as
  the LiDAR has them; the plant run into the mansard's walls; the windows beside the arched ones at the mean of the
  photograph's two places. Silhouette IoU 0.889 (0.890 in the box), luma 135 against 132; the top view: footprint IoU
  0.885, 83% of the 5,888 cells within 0.5 m (p10/p50/p90 -0.24/0.02/0.61), the highest point 52.87 m against
  52.55; block 620 under the model 51.0%, of its LiDAR roof cells 92.9%.

## Rules
- Measure, don't guess: a size the LiDAR gives is taken from it; one it does not is estimated and said to be.
- The photograph (one, from Symonds Street about 48 m east of the tower's north-east face, looking west at it;
  `refs/photos/`, gitignored) is a reference for the look: nothing is traced or sampled from it, and no size is
  measured from it but the heights of the faces' white band, dark base and windows and the windows' widths and
  places, which are estimated.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces of different
  materials in one plane.

## How to check
- `landmarks/pipeline/run.sh 49-symonds-street compare topview` (with `PORT` serving the repository): the strip in
  `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view in `out/topview/`. GPU steps only under
  `~/.campus-loop/gpu.lock`.
