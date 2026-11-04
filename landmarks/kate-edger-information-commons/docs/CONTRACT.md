# Engineering contract (read before writing code)

The Kate Edger Information Commons (building 315 of the University of Auckland's campus map) drawn in three.js
from code alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js through the import map of the
shared viewer, `../pipeline/viewer/index.html`. No external 3D models or image textures: every mesh and texture
is generated in code. Photographs are **references only**; nothing is traced or sampled from them into the
model.

## Frame and sizes
- View frame, metres: **x** south-west (the frame's `-axis`, along the two long ranges), **y** up from the
  frame's ground (41.5 m NZVD2016, the median ground in the crop box: provisional until `door` is set), **z**
  north-west (`toStreet`, toward the Student Commons); the frame's centre at x = z = 0.
  `config/kate-edger-information-commons.json`, `frame`: the axis is the bearing of most of the walls. The two
  ranges run along x; the south-east range's face to the south-east does not (about 5° off), nor do the ranges'
  edges on the atrium: their plans follow the LiDAR.
- The building's own returns only: `building.outline` is campus.json's ring, within 1.5 m. The ring lies about
  2-4 m north-west of the LiDAR's walls, as other buildings' rings do; the plans follow the LiDAR.
- What the LiDAR shows (`parts/common.js` holds the numbers and says where each came from):
  - **the south-east range**, flat at 15.93 m, its north-east face at x -31.0 and set back to x -28.0 by the
    atrium; on it **the upper strip** (20.10 m, its north-east end at x -25.45), **the upper block** south-west of
    it (19.25 m) and **plant** beyond (18.6-20.3 m, one block at 19.6 in round 0);
  - **the north-west range**, flat at 15.80 m, its **north-east end** higher (16.6 m, its face at x -34.2), with
    **the end over the court** beyond it (14.2 m; how far down it reaches the LiDAR cannot say: round 0 draws it
    to `FOOT`), **the raised part** on its roof (19.0 m), a **lower wing** at its south-west corner (11.7 m) and
    another on its face to the north-west (about 9.8 m);
  - **the atrium** between the ranges, glazed (few returns; a line of them at 13.3-13.7 m along it): round 0
    draws a flat glazed roof at 13.5 m and a glazed end toward the court (estimated); south-west of it, between
    the ranges, **a low roof** at 4.2 m;
  - **the ground**: -3.5 in the sunken court at the north-east end, near -0.4 on Alfred Street beyond it, +0.2
    to +4.1 on the north-west side and at the south-west end; walls go down to `FOOT` (-4.5 m).
- Not drawn yet: a lower roof near 10 m in the south-east range's north-east corner (x -30 to -27), the roofs'
  falls and parapets, a raised part over the atrium at x 2 to 8 (returns at 18.5 m), the canopies at about 4.3 m
  along the north-west face and at the south-west end.

## Ownership
- `parts/southeast.js` (the south-east range and what stands on it), `parts/northwest.js` (the north-west range,
  its north-east end and the end over the court, the raised part, the two lower wings), `parts/atrium.js` (the
  atrium's glazed roof and end, the low roof), `parts/shapes.js` (shared helpers: one owner per round, named in
  the brief). `model.js` and `parts/common.js` are the lead's.
- `landmarks/kit/` and `landmarks/pipeline/` are shared by every landmark: add, with defaults, and show the other
  landmarks' pictures unchanged (`?quality=low` and `?mask=1`, or byte-identical stage outputs).

## Budget (tier 2: the site runs in a browser, phones too)
- Whole building ≤ 100k triangles and ≤ 10 draw calls (merged by material). Round 0: 484 triangles, 3 draw calls.
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
- `landmarks/pipeline/run.sh kate-edger-information-commons photo refine compare topview` (from the repository
  root, with `PORT` serving it): the strips in `out/pipeline/compare/`, the metrics in its `metrics.md`, the top
  view in `out/topview/`. The black outside the photograph in its level cut is ignored (its mask's `inside`). GPU
  steps only under `~/.campus-loop/gpu.lock`.

## Rules
- Measure, don't guess: a size comes from the LiDAR, the outline or a reference through its fitted camera; say
  which in a comment, and say "estimated" where neither shows it, and name it in the config's `estimated`.
- Real or absent: what no reference shows is plain wall, not invented windows.
- No people, no cars, no trees, no signs, no umbrellas, no neighbour: they are in the photographs, not in the
  model.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces in one plane
  (`tests/landmarks.test.ts`, the coinciding faces).
