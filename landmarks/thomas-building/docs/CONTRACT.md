# Engineering contract (read before writing code)

The Thomas Building (building 110 of the University of Auckland's campus map) drawn in three.js from
code alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js through the import map of the
shared viewer, `../pipeline/viewer/index.html`. No external 3D models or image textures: every mesh and
texture is generated in code. Photographs are **references only**; nothing is traced or sampled from
them into the model.

## Frame and sizes
- View frame, metres: **x** north-east (the frame's `-axis`, along the road), **y** up from the frame's
  ground (36.17 m NZVD2016, the LiDAR's at `door`, the foot of the face to the road), **z** south-east
  (`toStreet`, toward the road and the panoramas); the centre of the roofs round the courtyard at
  x = z = 0. `config/thomas-building.json`, `frame`: the axis is the bearing of most of the walls, of
  the two the one nearest the long axis of the whole building.
- The building's long faces run 1.04° off x (`SLOPE` in `parts/common.js`): the parts are drawn in the
  building's own axes, **u** along its long faces and **v** across them, and `model.js` turns them
  onto the frame (x = u cos t - v sin t, z = u sin t + v cos t). Every size in `parts/common.js` is in
  (u, v).
- The building's own returns only: `building.outline` is campus.json's ring trimmed where 110N's link,
  Lippincott Cottage (118) and the Overbridge (129) meet it (its `outline_note`), within 1.5 m.
- What the LiDAR shows (`parts/common.js` holds the numbers and says where each came from):
  - **four ranges round a courtyard**: outside u -29.1 to 30.95, v -22.01 to 21.78 (60.1 by 43.8 m), the
    courtyard u -10.95 to 13.47, v -7.88 to 7.55; four storeys under broad parapets 15.13 m high, with
    horizontal ledges at 2.38, 7.12 and 11.12 m on every outer face;
  - **behind the parapets** a gutter at 14.26 m and over each range a storey set back from it, under
    roofs that rise to 18-20.5 m: a ridge over the back range, sawtooths over the range to the road and
    the south-west range, two slopes and a valley over the north-east range;
  - **a plant room** at the east corner to 23.46 m (the building's highest returns 25.1 m);
  - **a round stair** at the south-west end, half outside the end wall, its roof at 16.6 m, where the
    Overbridge (129) lands; a flue beside it to 25.7 m;
  - **the ground**: -0.88 to +0.44 along the face to the road, down to -1.83 at the north-east end;
    walls go down to `FOOT` (-2.0 m);
  - **the courtyard** holds 1,880 building returns 1.5-9 m high, scattered and uneven (trees in shade,
    by their spread): not drawn; the top view counts them as LiDAR footprint.
- **Where it meets 110N** (the Thomas Building Extension, its own landmark): 110N's glazed link reaches
  the north-east end at u 29.5-29.9, v -4.6 to 16.4 in this frame, its roof (17.04 m above 34.6, i.e.
  51.64 m NZVD) running over 110's parapet (15.13 m above 36.17, 51.30 m NZVD). The link is 110N's:
  this model draws 110's wall and parapet under it and nothing of the link.

## Ownership
- `parts/body.js` (the ranges' walls and parapets), `parts/roofs.js` (the set-back storeys, their roofs,
  the plant room), `parts/stair.js` (the round stair and the flue), `parts/shapes.js` (shared helpers:
  one owner per round, named in the brief). `model.js` and `parts/common.js` are the lead's.
- `landmarks/kit/` and `landmarks/pipeline/` are shared by every landmark: add, with defaults, and show
  the other landmarks' pictures unchanged (`?quality=low` and `?mask=1`, or byte-identical stage outputs).

## Budget (tier 2: the site runs in a browser, phones too)
- Whole building ≤ 100k triangles and ≤ 10 draw calls (merged by material). Build time of a part
  ≤ ~300 ms on this machine (the console logs it).
- Street View: ≤ 1,200 tiles for this building; 143 bought (2026-10-28, `S_C8…`), and `oWaF…`'s
  cached tiles (bought for 110N).

## References
- `S_C8…` (2024-08), on the road 17 m out from the face to the road: that face whole, four storeys,
  a tree before its south-west part and a bus shelter before its middle. `oWaF…` (2024-08, bought for
  110N): the north-east end and the east corner, at a slant; half of each of its views is black (tiles
  never bought), which the sky masks ignore. Their metadata's `copyright` reads "From the Owner, Photo
  by: Google".
- Measure through a camera fixed from the photograph's own edges against the LiDAR
  (`streetview.camera_fixes`, its note), never through the recorded one.
- No photograph shows the back, the south-west end square, the courtyard or the roofs: draw them
  plainly at the LiDAR's sizes.

## How to render and compare
- `landmarks/pipeline/run.sh thomas-building refine compare topview` (from the repository root, with
  `PORT` serving it): the strips in `out/pipeline/compare/`, the metrics in its `metrics.md`, the top
  view in `out/topview/`. GPU steps only under `~/.campus-loop/gpu.lock`.

## Rules
- Measure, don't guess: a size comes from the LiDAR, the outline or a photograph through its fixed
  camera; say which in a comment, and say "estimated" where neither shows it.
- Real or absent: what no photograph shows is plain wall, not invented windows.
- No people, no cars, no bus shelter, no tree, no sign: they are in the photographs, not in the model.
