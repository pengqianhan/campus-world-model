# Engineering contract (read before writing code)

The Humanities Building (building 206 of the University of Auckland's campus map) drawn in three.js from code
alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js through the import map of the shared viewer,
`../pipeline/viewer/index.html`. No external 3D models or image textures: every mesh and texture is generated in
code. Photographs are **references only**; nothing is traced or sampled from them into the model.

## Frame and sizes
- View frame, metres: **x** south-east (the frame's `-axis`, along the street wing), **y** up from the frame's
  ground (32.9 m NZVD2016, the median ground in the crop box: provisional, step 7 sets it at the door), **z**
  south-west (`toStreet`, toward the courtyard and Symonds Street); the frame's centre at x = z = 0.
  `config/humanities-building.json`, `frame`: the axis is the bearing of most of the walls; both wings are square
  to it.
- The building's own returns only. campus.json's ring of 206 takes in the courtyard south-west of the street wing
  (the ground and trees there, no building) and lies a few metres outside the LiDAR's walls on its north-west side:
  the plans follow the LiDAR.
- What the LiDAR shows (`parts/common.js` holds the numbers and says where each came from):
  - an **L**: the **street wing** along x (x -17.9 to 24.25, z 2.4 to 16.6 at the eaves' fronts) and the
    **north-east wing** from its north-west end along z (to z -30.55), their outer corners cut at 45 degrees;
  - each wing a **middle** under a roof of two low slopes, its ridge at 21.3 m and its eaves at 20.35 (on the
    inner faces, in the angle of the L, and at the step), hipped at the street wing's south-east end and the north-
    east wing's north-east end; round its outer faces a lower roof, **the aisles**, falling from a step at
    18.2-19.1 m to eaves at 16.8 m, 17.3 m along the street wing's south-west face north-west of x -1.3 (0.3 m further
    forward there) and along the north-west end;
  - over the corner where the wings meet, **a raised square** (x -10.9 to 0.3, z -1.75 to 10.4) with a pyramid to
    23.9 m (drawn as one pyramid: its slopes are not one pyramid's, round 1); in the angle of the L, the inner
    faces' corner filled at 20.7 m;
  - at the street wing's south-east end, where the ground is 8 m lower, **the low block**: its eaves at 6.2 m and
    a ridge at 7.8 m, hipped at its south-east end;
  - **the ground**: about +0.2 in the courtyard and along the north-west end, -1.7 to 0 along the north-east wing's
    north-west face, -7.6 to -7.9 in the angle of the L, at the north-east end and round the low block; walls go
    down to `FOOT` (-8.5 m).
- What the photograph shows, through its fitted camera (`refs/photos/views.json`): the street wing's south-west
  face from the courtyard. Four bands of buff brick between ribbons of windows (the bands' edges, from the LiDAR,
  at 3.00/4.68, 6.48/8.19, 9.96/11.75 and 13.45/14.33 m south-east of x -1.3, the floors 3.5 m apart), the
  windows' frames dark, most of their panes behind film in vertical stripes of red, orange and yellow; the part
  north-west of x -1.3 0.3 m forward, its bands' corners cut at its south-east end; a slot at x -1.0 to 0.5 for the
  stair, glazed in dark red frames; the entrance at the ground in the slot's foot; the eaves' fascia dark red.
- Round 1 draws that face (`parts/facade.js`, `MEASURED.faces`): the bands at the LiDAR's heights, the top band's
  upper edge read off the photograph through its fitted camera (14.8 m south-east of the stair, 15.1 north-west of
  it: the LiDAR cannot see it under the eave), a brick base under the lowest windows to 0.9 m; the ribbons of
  windows set back 0.25 m behind the bands (estimated), panes 1.4 m wide (estimated from the photograph's rhythm), two
  of every three under the film (estimated: the photograph's are filmed in no rule); the slot glazed in red frames;
  the entrance at its foot (its sides at x -2.0 and 1.3 read off the photograph, its top at the LiDAR's 3.3 m). The
  other faces stay plain brick: no reference shows them.
- Not drawn yet: the north-west part's bands' corners cut at the slot, the slot's depth (about 1 m: drawn flush),
  the patterned glass in it, the eaves' depth and fascia as the photograph shows them, the pyramid's true shape, the
  inner corner's roofs, a low strip of returns at 3-5 m along the north-east wing's north-west face (x -22 to -18).

## Ownership
- `parts/wings.js` (the aisles, the two middles, the raised corner and the fill in the angle of the L),
  `parts/low.js` (the low block), `parts/facade.js` (the street wing's south-west face: its bands, windows, slot and
  entrance), `parts/shapes.js` (shared helpers: one owner per round, named in the brief).
  `model.js` and `parts/common.js` are the lead's.
- The materials (`landmarks/kit/materials.js`): this building's own (round 1) `brickBuff` (the walls, the brick's
  shader in a pale buff; estimated on the faces no reference shows) and the film's `filmRed`, `filmOrange` and
  `filmYellow`; the kit's `glass` (the panes), `iron` (the windows' frames), `frameRed` (the slot's frames),
  `roofTile` (the roofs, red clay tiles in the 2023 aerial) and `roofGrey` (the low block's roof, estimated). On the
  site the film is the light form's glass (`LIGHT_ROLE`, `src/scene/landmarks.ts`, at step 8).
- `landmarks/kit/` and `landmarks/pipeline/` are shared by every landmark: add, with defaults, and show the other
  landmarks' pictures unchanged (`?quality=low` and `?mask=1`, or byte-identical stage outputs).

## Budget (tier 2: the site runs in a browser, phones too)
- Whole building ≤ 100k triangles and ≤ 10 draw calls (merged by material). Round 0: 273 triangles, 3 draw calls; round 1: 6,357
  triangles, 9 draw calls.
  Build time of a part ≤ ~300 ms on this machine (the console logs it).
- Street View: none (2026-11-04: new landmarks use none).

## References
- The references are kept on the maintainer's machine in `refs/photos/` (gitignored): each with its camera fitted
  by `tools/photo_camera.py` from points picked on it against the LiDAR (`refs/photos/views.json`), which
  `"refs": "photos"` in the config makes refine, compare, metrics, sky_mask and the viewer's `?sv=` read. How
  they are recorded is for the maintainer to decide; nothing of them goes into git.
- Measure through the fitted camera (`photo_fit`); `refine.keep_fixes` keeps it.
- What no reference shows is drawn plainly at the LiDAR's sizes.

## How to render and compare
- `landmarks/pipeline/run.sh humanities-building refine compare topview` (from the repository root, with `PORT`
  serving it): the strip in `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view in
  `out/topview/`. The black outside the photograph in its level cut is ignored (its mask's `inside`). The config's
  `sky_mask` closes the branches over the eaves (`branches_deg`); its `light` gives the viewer the photograph's soft
  light. GPU steps only under `~/.campus-loop/gpu.lock`.
- Round 0: silhouette IoU 0.905 (0.936 in the model's box) through the fitted camera; the building's luma median
  130 against the photograph's 133. The top view: footprint IoU 0.898, 93% of the cells within 0.5 m of the
  LiDAR's height, the highest point 23.9 m against the LiDAR's 23.86 (p99.9); block 206 under the model 72.8% (its
  ring takes in the courtyard), block 207 1.2%.
- Round 1: silhouette IoU 0.900 (0.931 in the box); the building's luma median 141 against 133 (p10-p90 45-153
  against 95-184), its mean colour 135/110/92 against 148/136/124 (the photograph's trees before the face are green);
  the top view as round 0's.

## Rules
- Measure, don't guess: a size comes from the LiDAR, the outline or a reference through its fitted camera; say
  which in a comment, and say "estimated" where neither shows it, and name it in the config's `estimated`.
- Real or absent: what no reference shows is plain wall, not invented windows.
- No people, no cars, no trees, no signs, no bicycles, no neighbour: they are in the photographs, not in the model.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces in one plane
  (`tests/landmarks.test.ts`, the coinciding faces).
