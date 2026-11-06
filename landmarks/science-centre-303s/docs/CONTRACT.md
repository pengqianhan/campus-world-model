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
- `parts/building.js` (every part's mass), `parts/faces.js` (the faces the photograph shows), `parts/shapes.js` (the
  shapes the parts share), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 176 triangles, 2
  draw calls; round 1's shape 308 and 2; the faces 584 and 3; after the check 596 and 3; on the site 608 and 3.

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
  tip at 15.6 m. The returns to 35.1 m up to 1.6 m before the back's line from u 5 to 20 are the end bay of building
  303's slab reaching into the ring, and those
  beyond the back's diagonal and below the notch lie outside the ring: not drawn. 308 triangles, 2 draw calls; no two
  faces of different materials in one plane. Silhouette IoU 0.780 (0.972 in the box); the top view: footprint IoU
  0.857, 86% of the cells within 0.5 m (p10/p50/p90 -0.62/-0.01/0.18), the highest point 33.75 m.
- The faces (step 5, `parts/faces.js`): the glass of the face to the street (the kit's `glassPale`) 2 cm before its
  walls, from under the street's level; on its south-east stretch, beyond the 30.4 m parapet, pale fins at u 37.9, 42.5, 47.0 and 52.35
  (the last two where the fitted camera's rays through the photograph's fins meet the face), the pier at the corner
  from u 57.5 to 30.4 m, and between the last fin and the pier the braces, a zigzag of bars every two storeys; the
  south-east end face's glass and a pale spandrel band at each storey of 3.35 m. The walls in the kit's
  `claddingPale` (the faces no photograph shows estimated alike), the roofs `roofGrey`. Estimated: the fins' and
  bands' sizes, the storey's height, the braces' bars and period, the glass from under the street's level. The viewer's light: the sun at
  20 deg round and 60 deg up, the exposure 1.4. 584 triangles, 3 draw calls; no two faces of different materials in
  one plane. Silhouette IoU 0.781 (0.974 in the box); the luma p10/p50/p90 96/131/188 against the photograph's
  87/130/190. The top view: footprint IoU 0.859, 85% of the cells within 0.5 m (the fins and the pier stand out of
  the face), block 303S under the model 92.7%.
- The check (step 6): the pier at the corner to 29.7 m (its returns' p99 29.71, where round 1 had 30.4; the
  photograph's pier top, through the fitted camera, 29.8 m); a parapet at 16.4 m along the tip's front. The highest
  of the LiDAR's cells in the ring, 35.1-35.25 m from u 5 to 20 before the back's line, are building 303's slab's
  end bay (32.8 m above 303's ground of 41.6 m) reaching into the ring. 596 triangles, 3 draw calls. The top view: footprint
  IoU 0.859, 86% of the cells within 0.5 m (p10/p50/p90 -0.62/-0.01/0.19), block 303S under the model 92.7%,
  303 1.5% (`building.also` stays empty).
- The door (step 7): the entrance is not known (the photograph hides the ground storey; the campus map records
  none), so the door is on the pavement before the face, 39% along it, 1.8 m out from it (u 23, w 2.0 from the
  face's line), where the LiDAR's ground is the
  frame's (13 returns within 1 m, p50 0.002 m); `place` wrote it into `placement.json`.
- On the site (step 8): the glass, the fins and the pier from 0.5 m above FOOT, under the street's level, for the
  foot check (the glass from y 0 stood 0.8 m above the map's ground at the north-west end). 608 triangles, 3 draw
  calls.

## Rules
- Measure, don't guess: a size the LiDAR gives is taken from it; one it does not is estimated and said to be.
- The photograph (one, from the street about 95 m to the south-east, through a long lens; `refs/photos/`,
  gitignored) is a reference for the look: nothing is traced or sampled from it, and no size is measured from it.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's, or the two stand at least 1 cm
  apart: no two faces of different materials in one plane.

## How to check
- `landmarks/pipeline/run.sh science-centre-303s refine compare topview` (from `landmarks/science-centre-303s/`, with
  `PORT` serving the repository): the strip in `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view
  in `out/topview/`. GPU steps only under `~/.campus-loop/gpu.lock`.
