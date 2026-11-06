# Contract: building 303S of the Science Centre

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-east (the frame's `-axis`), **y** up from the frame's ground (39.3 m NZVD2016, the
  median ground in the first crop box, 25 m round the outline; to be the LiDAR's ground at the config's `door`, step
  7), **z** south-west (`toStreet`); the frame's centre at x = z = 0. `config/science-centre-303s.json`, `frame`: the
  axis is the bearing of most of the walls. The crop runs 135 m round the outline so that it takes in the
  photograph's camera (`crop_note`); the frame comes from the points near the outline and is the same.
- The building's own frame: its face to the street is turned 8.75 degrees from the view frame. `parts/common.js`
  gives `at(u, w)`, `rect(u, w)` and `plan(corners)`: u along that face from its north-west end toward the
  south-east, w out of it (the street side positive). Its back runs on a diagonal from the north-west end
  (`backAt(u)`), then steps back.
- The building's own returns, inside the campus map's ring of 303S; the plans follow the LiDAR. What it shows
  (`parts/common.js` holds the numbers and says where each came from):
  - **the face to the street**, glass, with almost no returns below 26 m: its line from the returns at 26-31 m;
  - **the body**, eight storeys, its roof at 28.75 m, with a thin parapet wall along the face at 30.4 m to u 37.7;
  - **the top storey**, from u 12.65 to 49.5, set back 1.45 m from the face, its roof at 33.1 m inside a parapet at
    33.75 m, its back walls in the body's;
  - **the south-east part**, to its end face at u 59.6, back to w -18.3, inside a parapet at 29.5 m;
  - **a lower part** behind the diagonal, u 29 to 32, at 15.5 m, and **the ring's north-west tip** at 15.6 m;
  - the ground rises 4.4 m along the face to the south-east: walls go down to `FOOT`, -4.5 m.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/building.js` (every part, round 0), `parts/shapes.js` (the shapes the parts share), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 176 triangles, 2
  draw calls; round 1's shape 308 and 2.

## Rounds
- Round 0: silhouette IoU 0.767, 0.963 in the model's screen box, through the fitted camera (much of the south-east
  end face, which the model draws in full, stands behind building 302's screens in the photograph); the building's
  luma median 110 against the photograph's 129 (the plain concrete against the glass). The top view: footprint IoU
  0.857 (the LiDAR's 1,044 m² against the model's 922, both 908), 74% of the cells within 0.5 m of the LiDAR's height
  (p10/p50/p90 -0.3/0.26/1.6: the north-west part drawn at its parapet's height, the parapets, the plant), the
  highest point 33.41 m against the LiDAR's 35.25 (p99.9, the plant on the north-west part); block 303S under the
  model 92.6%, 303 1.5%.
- Round 1's shape (from the 1 m cells): the body's roof at 28.75 m, a thin parapet wall along the face at 30.4 m to
  u 37.7, the north-west part's end wall at u 1.6 with its parapet; the top storey from u 12.65 to 49.5, its roof at
  33.1 m inside a parapet at 33.75 m; the south-east part inside a parapet at 29.5 m; the lower part at 15.5 m, the
  tip at 15.6 m. The returns to 35.1 m at u 5-11, w -5 and back are building 303's slab at the ring's edge, and those
  beyond the back's diagonal and below the notch lie outside the ring: not drawn. 308 triangles, 2 draw calls; no two
  faces of different materials in one plane. Silhouette IoU 0.780 (0.972 in the box); the top view: footprint IoU
  0.857, 86% of the cells within 0.5 m (p10/p50/p90 -0.62/-0.01/0.18), the highest point 33.75 m.

## Rules
- Measure, don't guess: a size the LiDAR gives is taken from it; one it does not is estimated and said to be.
- The photograph (one, from the street about 95 m to the south-east, through a long lens; `refs/photos/`,
  gitignored) is a reference for the look: nothing is traced or sampled from it, and no size is measured from it.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's, or the two stand 5 cm apart: no
  two faces of different materials in one plane.

## How to check
- `landmarks/pipeline/run.sh science-centre-303s refine compare topview` (from `landmarks/science-centre-303s/`, with
  `PORT` serving the repository): the strip in `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view
  in `out/topview/`. GPU steps only under `~/.campus-loop/gpu.lock`.
