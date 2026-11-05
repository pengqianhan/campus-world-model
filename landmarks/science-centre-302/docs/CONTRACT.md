# Engineering contract (read before writing code)

Building 302 of the University of Auckland's Science Centre drawn in three.js from code alone, sized by the LINZ
2024 LiDAR. Zero-build ES modules, three.js through the import map of the shared viewer,
`../pipeline/viewer/index.html`. No external 3D models or image textures: every mesh and texture is generated in
code. Photographs are **references only**; nothing is traced or sampled from them into the model.

## Frame and sizes
- View frame, metres: **x** south-west (the frame's `-axis`, toward Symonds Street), **y** up from the frame's
  ground (45.0 m NZVD2016, the median ground in the crop box, provisional until the config's `door` is set at
  step 7), **z** north-west (`toStreet`); the frame's centre at x = z = 0.
  `config/science-centre-302.json`, `frame`: the axis is the bearing of most of the walls (the lower block's); the
  tower is turned about 4 degrees from it.
- The building's own returns only. campus.json's ring of 302 lies 2 to 6 m outside the LiDAR's walls on the
  north-east side, where it runs into the neighbouring block's returns: the plans follow the LiDAR.
- What the LiDAR shows (`parts/common.js` holds the numbers and says where each came from):
  - **the tower**, a rectangle 44.35 m along its south-west face and 38.8 m along its south-east face, its main
    roof at 50.2 m, parapets at about 51.5-51.7 m along its south-west and north-east faces;
  - **lower roofs at 46.7 m**: a strip along the south-east end (north-east of x 6.5), a strip along the
    north-west end (north-east of x 9), and a small **annex** north of the tower (x -17.2 to -9.3, to z 32);
  - **the lower block** before the tower's south-west face, its top flat at 25.5 m (its edge 26.0), its outer
    face leaning away from the tower's: 15 m out at the south end, at the tower at the west end;
  - **the ground**: +0.2 to +1.4 along the south-east face, about 0 along the north-east, -2.8 to -4.1 along the
    north-west, -5.1 to +1.1 before the south-west face, where Symonds Street falls; walls go down to `FOOT`
    (-6.5 m).
  - Not drawn yet (round 0): rooftop plant above 52.5 m over the main roof (z -16 to -14 and 10 to 13), a band
    across the main roof (z -7 to 4) where the returns fall in four sloping strips down to 46.7, and the ends of
    the two strips of lower roof south-west of x 6.5 and 9, whose returns slope between the two roofs.
- What the photograph shows, through its fitted camera (`refs/photos/views.json`): the building from the street
  corner to its south. The tower's south-west face in horizontal bands of pale glass and the south-east face in
  vertical brown fins; before them the lower block's two faces of dark, folded screens, a tall glazed triangle in
  its south-west face; at the street, glazing under a canopy.

## Ownership
- `parts/tower.js` (the tower, its lower roofs, the annex), `parts/block.js` (the lower block), `parts/shapes.js`
  (shared helpers: one owner per round, named in the brief). `model.js` and `parts/common.js` are the lead's.
- The materials: the kit's `claddingPale` (the tower's walls, round 0), `screenGrey` (the lower block's walls,
  round 0) and `roofGrey` (the roofs: grey in the 2023 aerial).
- `landmarks/kit/` and `landmarks/pipeline/` are shared by every landmark: add, with defaults, and show the other
  landmarks' pictures unchanged (`?quality=low` and `?mask=1`, or byte-identical stage outputs).

## Budget (tier 2: the site runs in a browser, phones too)
- Whole building ≤ 100k triangles and ≤ 10 draw calls (merged by material). Round 0: 200 triangles, 3 draw calls.
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
- `landmarks/pipeline/run.sh science-centre-302 refine compare topview` (from the repository root, with `PORT`
  serving it): the strip in `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view in
  `out/topview/`. GPU steps only under `~/.campus-loop/gpu.lock`.
- Round 0: silhouette IoU 0.571 (0.900 in the model's screen box) through the fitted camera; the building's luma
  median 150 against the photograph's 153. The top view: footprint IoU 0.803 (the LiDAR's 2,709 m² against the
  model's 2,176: most of the rest a strip of the neighbouring block's returns inside the ring along the north-east
  side), 60% of the cells within 0.5 m of the LiDAR's height (the band of sloping strips and the strips' ends
  drawn at the main roof), the highest point 51.7 m against the LiDAR's 53.9 (p99.9, the plant); block 302 under
  the model 80.2%.

## Rules
- Measure, don't guess: a size comes from the LiDAR, the outline or a reference through its fitted camera; say
  which in a comment, and say "estimated" where neither shows it, and name it in the config's `estimated`.
- Real or absent: what no reference shows is plain wall, not invented windows.
- No people, no cars, no trees, no signs, no poles: they are in the photographs, not in the model.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces in one plane
  (`tests/landmarks.test.ts`, the coinciding faces).
