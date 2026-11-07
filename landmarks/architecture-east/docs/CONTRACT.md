# Contract: Architecture - East (421E)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-west (the frame's `-axis`), **y** up from the LiDAR's ground at the config's
  `door` (39.56 m NZVD2016, on the raised terrace before the main block's north face), **z** north-west
  (`toStreet`); the frame's centre at x = z = 0. `config/architecture-east.json`, `frame`. The site falls about
  27 m across the crop.
- The heights in this file and in `parts/common.js` were measured before the door was set, above 31.6 m (the
  median ground in the crop box, 25 m round the outline): 7.96 m under the door's ground. `H` in
  `parts/common.js` moves each on to it.
- Two frames of the building's own: its walls run in two directions 45 degrees apart (the campus map's ring: its
  edges at -4.4 and 40.0 degrees from x toward z). `parts/common.js` gives `at(F, u, w)` and `rect(F, u, w)`: in
  frame `W` the lower wing and its tower, in frame `E` the main block and the tall tower (the frames' names, not
  compass points: the wing stands east of the main block); u along the walls' first direction (in `E` toward the
  west, in `W` toward the south-west), w across it (in `E` toward the north, in `W` toward the north-west).
- What the LiDAR shows (`parts/common.js` holds the numbers):
  - **the lower wing**, its corner cut square with the main block, its roof at 22.65 m inside a parapet at 23.5 m;
  - **the wing's tower**, its top a plane rising to 33.6 m at its end, with a lower slope on its south-east side;
  - **the main block**, a flat roof at 25.74 m and on it a hipped roof whose ridge runs at 30.1 m, its north
    eave at 28 m over a face down to the flat, which runs on as a ledge; at its
    east end a part at 25.1 m on its north side, and on the flat a box at 27 m; north of it, from u 9,
    the terrace's ground comes up to its face;
  - **the tall tower** out of the hipped roof, its top a plane rising to 36.7 m at its end;
  - **the faces** (round 1), with the photograph as a reference and every size estimated: floors every 3.55 m from
    the terrace's 8 m; on each floor of the main block's north faces a pale louvred parapet 1.1 m tall and
    over it a band of windows; under its north eave a face in the towers' dark cladding, with dormers 1.6 m
    wide every 4.1 m standing out of it on the ledge, behind a louvred parapet along the ledge's edge; round the
    wing a band of windows on each floor from the terrace's up (below it, where the photograph sees none, its walls
    are plain). Not drawn yet: the storeys' edges stepping out below the eave (returns at 12-28 m between w 3 and
    5.5), the glazed ground storey behind its columns, the louvres' slats, and a part reaching out to w 9-11.7 at
    the main block's west end (u 30 to 37.5, returns from 10 to 28 m), toward Architecture - West;
  - **the ring's east part**, a car park at the ground: not drawn;
  - the ground round the plans from -1.16 m to +8.5 m (the raised terrace to the north): walls go down to `FOOT`,
    -1.5 m.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frames): the lead.
- `parts/building.js` (every part, rounds 0 and 1), `parts/shapes.js` (the shapes the parts share), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 94 triangles, 3 draw
  calls. Round 1's shape: 184 and 3; round 1's faces: 844 and 5; on the site: 764 and 5.

## Rounds
- Round 0 (2026-11-07): the four parts as blocks at the LiDAR's plans and heights; walls in the kit's
  `claddingPale`, roofs `roofGrey`, the towers `screenGrey`. Silhouette IoU 0.927 in the photograph (0.927 in the
  model's screen box); the building's luma median 242 against the photograph's 176 (the viewer's default light).
  The top view: footprint IoU 0.766 (the LiDAR's 1,600 m² against the model's 1,362, both 1,286), 50% of the cells
  within 0.5 m (p10/p50/p90 -1.43/-0.3/2.02: the terraces and the stepped faces, which round 0 does not draw), the
  highest point 36.64 m against 36.56; block 421E under the model 57.2% (its ring takes in the car park), 421W 8.5%.
- Round 1's shape (2026-11-07, from the 1 m cells and the returns' p50 in each part): the lower wing's roof at
  22.65 m and its corner cut at 45 degrees, square with the main block; the wing's tower's south-east slope; the main
  block's flat roof at 25.74 m with the hipped roof on it (its ridge at 30.1 m along w 0, its slopes to w -6.2 and
  4.5, its hips to u -7 and 37.5), the part at 25.1 m and the box at 27 m. A terrace tried before the north
  face from u 9 is not there: the LiDAR sees the terrace's ground (8 m) up to the face. 180 triangles, 3 draw
  calls; no two faces of different materials in one plane. Silhouette IoU 0.939 (0.939 in the box); the top view:
  footprint IoU 0.796 (1,600 m² against 1,288, both 1,280), 59% of the cells within 0.5 m (p10/p50/p90
  -1.16/-0.05/0.49), the highest point 36.66 m; block 421E under the model 54.5%. Then the hipped roof's north
  eave at 28 m at w 3 (the returns at w 2.5 to 3, p50 28.2), over a face down to the flat roof, which runs on to
  w 4.5 as a ledge; the storeys' edges stepping out below it (returns at 12-28 m between w 3 and 5.5) are for the
  faces. 184 triangles; silhouette IoU 0.942; the top view: 63% of the cells within 0.5 m (p10/p50/p90
  -1.29/-0.04/0.59). The viewer's light (estimated): the sun at 300 deg round and 45 up, the exposure 0.5; the
  building's luma median 174 against the photograph's 175.
- Round 1's faces (2026-11-07): the floors' parapets in the kit's `plain`, the windows in `glass`, the face under
  the eave and the dormers in `screenGrey`. The first try (the parapets in `render`, the windows 1.9 m tall) read
  dark and orange against the photograph (the luma median 153 against 175); with the parapets in `plain` and the
  windows 1.4 m tall, 174. 844 triangles, 5 draw calls; no two faces of different materials in one plane.
  Silhouette IoU 0.942 (0.942 in the box); the top view: footprint IoU 0.797, 63% of the cells within 0.5 m
  (p10/p50/p90 -1.24/-0.04/0.63), the highest point 36.66 m against 36.56; block 421E under the model 54.7%.
- The door (step 7, 2026-11-07): the entrance is not known (the campus map records no lobby or entrance in 421E,
  and no street passes it), so the door is on the raised terrace, which the photograph shows people coming to, in
  the middle of the stretch where it meets the main block's north face, 2.5 m out from it (u 23, w 7 in frame
  E); the LiDAR's ground there 39.56 m (13 returns within 1 m, p10/p90 39.534/39.578), the terrace along the face
  at 39.56 to 40.01 m. The config's ground is the door's; the frame's thresholds were lowered by the same 7.96 m,
  so the measured frame is the expected one (0.000 m, 0.000 degrees), and the photograph's camera (gitignored
  `refs/photos/views.json`) moved down with it. On the door's ground the viewer's ground plane stands at the
  door's terrace, about 4 m under the ground where the photograph's camera stands (43.60 m; 12 m under it
  before): silhouette IoU 0.938 (0.938 in the box), the luma median 174 against 175; the top view: footprint IoU
  0.824 (its cells above 2.5 m now counted from the door's ground), the 63% within 0.5 m unchanged (the heights'
  differences p10/p50/p90 -1.24/-0.04/0.58), the highest point 28.70 m against 28.63. `place`: the door at
  (15.48, -209.12) on the map.
- On the site (2026-11-07): the wing's bands of windows start at the terrace's floor, as the main block's do (from
  the floor under it the lowest band stood 4.0 m over the map's ground, the foot check of `tests/landmarks.test.ts`);
  below it the wing's walls are plain. 764 triangles, 5 draw calls; the comparison and the top view as above.

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
