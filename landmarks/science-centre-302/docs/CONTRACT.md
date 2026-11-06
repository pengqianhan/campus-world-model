# Engineering contract (read before writing code)

Building 302 of the University of Auckland's Science Centre drawn in three.js from code alone, sized by the LINZ
2024 LiDAR. Zero-build ES modules, three.js through the import map of the shared viewer,
`../pipeline/viewer/index.html`. No external 3D models or image textures: every mesh and texture is generated in
code. Photographs are **references only**; nothing is traced or sampled from them into the model.

## Frame and sizes
- View frame, metres: **x** south-west (the frame's `-axis`, toward Symonds Street), **y** up from the frame's
  ground (45.0 m NZVD2016, the median ground in the crop box, and the LiDAR's ground at the config's `door`), **z** north-west (`toStreet`); the frame's centre at x = z = 0.
  `config/science-centre-302.json`, `frame`: the axis is the bearing of most of the walls (the lower block's); the
  tower is turned about 4 degrees from it.
- The building's own returns only. campus.json's ring of 302 lies 5 to 7 m outside the tower's walls on the
  north-east side, 2 to 3 m past the lower wing there, over a valley and the edge of 301's roof: the plans follow
  the LiDAR.
- What the LiDAR shows (`parts/common.js` holds the numbers and says where each came from):
  - **the tower**, a rectangle 44.35 m along its south-west face and 39 m along its south-east face, turned 3.93
    degrees from the frame; its roofs all run square with its own faces, so the tower is drawn in its own frame
    (`a` from its south-west face toward the north-east, `b` from its south-east face toward the north-west,
    `towerAt` and `towerRect` in `parts/common.js`). Its north-east face steps out 0.8 m between the lower roofs;
  - **its main roof**, from b 4.55 to 39.7, falling from 50.8 m at its ends to 50.1 m at a **band** across its
    middle (b 16.5 to 28.0): from the south-west, a court at 46.7 m, three sawtooth ramps rising toward the
    south-west from 46.72 to 50.6 m, a block at 51.1 m and a slot; a parapet along the south-west face (51.5 m)
    and a raised strip along the north-east face (51.3 m, its parapet 51.8 m); four boxes of plant (53.6-53.8 m);
  - **lower roofs at 46.7 m** along the south-east and north-west ends, each rising in a ramp from the south-west
    parapet, an upstand at 48.0 m along each face, and a small **annex** north of the tower;
  - **a lower wing** along the north-east face, its roof falling away from it from 32.8 to 30.9 m (the review);
  - **the lower block** before the tower's south-west face, its top flat at 25.5 m (its edge 26.0), its outer
    face leaning away from the tower's: 15 m out at the south end, at the tower at the west end; from its two ends
    its **screens** run on along the tower's end faces, 1.7 and 2 m deep, to 26.0 m;
  - **the ground**: +0.2 to +1.4 along the south-east face, about 0 along the north-east, -2.8 to -4.1 along the
    north-west, -5.1 to +1.1 before the south-west face, where Symonds Street falls; walls go down to `FOOT`
    (-6.5 m).
- What the photograph shows, through its fitted camera (`refs/photos/views.json`): the building from the street
  corner to its south. The tower's south-west face in horizontal bands of pale glass and the south-east face in
  vertical brown fins; before them the lower block's two faces of dark, folded screens, a tall glazed triangle in
  its south-west face; at the street, glazing under a canopy. The dark screen runs on behind the trees along the
  tower's south-east face, where the LiDAR has the screen.

## Ownership
- `parts/tower.js` (the tower, its lower roofs, the annex, the lower wing), `parts/block.js` (the lower block), `parts/shapes.js`
  (shared helpers: one owner per round, named in the brief). `model.js` and `parts/common.js` are the lead's.
- The materials: the kit's `claddingPale` (the tower's walls and metal bands), `roofGrey` (the roofs: grey in the
  2023 aerial), `grey` (the plant, round 1), `glassPale` (the ribbons and the glazed corner, step 5), and two the
  kit gained for this building at step 5, `screenBlack` (the lower block and its screens) and `finBrown` (the
  south-east face's cladding and fins): the paint's shader in two more colours, added with nothing else changed
  (the Clock Tower, the Kate Edger Information Commons, the Music School and the Old Choral Hall in the viewer at
  `?quality=low` and `?mask=1` before and after: 0 pixels differ).
- `landmarks/kit/` and `landmarks/pipeline/` are shared by every landmark: add, with defaults, and show the other
  landmarks' pictures unchanged (`?quality=low` and `?mask=1`, or byte-identical stage outputs).

## Budget (tier 2: the site runs in a browser, phones too)
- Whole building ≤ 100k triangles and ≤ 10 draw calls (merged by material). Round 0: 200 triangles, 3 draw
  calls; round 1's shape 378 and 4; step 6: 464 and 4; step 5's faces and the review: 3,919 and 6. Build time of a part
  ≤ ~300 ms on this machine (the console logs it).
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
  model's 2,176: most of the rest along the north-east side: the edge of 301's roof inside the ring, the lower wing, drawn in the
  review, and the tower's own north-east strip), 60% of the cells within 0.5 m of the LiDAR's height (the band of sloping strips and the strips' ends
  drawn at the main roof), the highest point 51.7 m against the LiDAR's 53.9 (p99.9, the plant); block 302 under
  the model 80.2%.
- Round 1's shape (the roofs at the cells' heights, drawn square with the frame): IoU 0.578 (0.907 in the box),
  luma 150; the top view 81% of the cells within 0.5 m, the model's heights minus the LiDAR's p10/p50/p90
  -0.41/0.03/0.62.
- Step 6 (each part against the cells, the roofs redrawn in the tower's frame, the screens): IoU 0.581 (0.912 in the
  box), luma 150 against 153; the top view: footprint IoU 0.845 (2,300 m² of the LiDAR's 2,709), 90% of the cells
  within 0.5 m, p10/p50/p90 -0.39/0.00/0.09, the highest point 53.25 m against 53.9; block 302 under the model
  84.0%. What is left: cells at the faces and edges; the plant, whose units stand apart with gaps between them
  that the boxes fill; the main roof rising 0.6 m toward the south-west parapet in its last few metres; the
  slot's openings.
- Step 5's faces (the south-west face's ribbons, bands and slats; the south-east face's cladding and fins; the
  lower block dark, with its glazed corner and the frame along its edges, the screens' folded blades and top rail
  on the faces the photograph shows, reaching out to the hull of the returns, the walls behind them; the ground
  storey's glazing; the light from the north): IoU 0.589 (0.923 in the box); luma p10/p50/p90 99/161/180 at the
  exposure 1.4 against the photograph's 102/152/190; the top view: footprint IoU 0.888, 90% of the cells within
  0.5 m, the highest point 53.77 m against 53.9 (the plant to its cells' p90), block 302 under the model 88.4%
  (with the lower wing along the north-east face, drawn in the review; 84.2% before it). 3,919 triangles, 6 draw
  calls. Not drawn yet: the canopy, the metal
  bands' ribs, the tower's open storey over the lower block (posts in the photograph).

## Rules
- Measure, don't guess: a size comes from the LiDAR, the outline or a reference through its fitted camera; say
  which in a comment, and say "estimated" where neither shows it, and name it in the config's `estimated`.
- Real or absent: what no reference shows is plain wall, not invented windows.
- No people, no cars, no trees, no signs, no poles: they are in the photographs, not in the model.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces in one plane
  (`tests/landmarks.test.ts`, the coinciding faces).
