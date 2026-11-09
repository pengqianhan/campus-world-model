# Contract: Te Pūtahi Tangata (201)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-west (the frame's `-axis`), **y** up from the door's ground (35.50 m NZVD2016, the
  plaza before the entrance's canopy), **z** north-west (`toStreet`, toward the street); the frame's centre, the
  middle of the building's points over 3 m above the first crop box's ground, at x = z = 0.
  `config/te-putahi-tangata.json`, `frame`: the building's returns within 1.5 m of the campus map's ring, the axis
  along its walls (bearing 45.5 deg). The frame's thresholds were set above 28.33 m, the median ground in the first
  crop box, and moved with the ground to the door's (7.17 m higher), so that the frame stays the same.
- The building's own frame: **u** north-east (`-x`), along the street front, **w** toward the street (`z`).
  `parts/common.js` gives `at` and `plan`, and `H`, which turns a height measured above 28.33 m into one above the
  door's ground.
- What the LiDAR shows (`parts/common.js` holds the numbers): the hall on the street (u -18.2 to 16.2, w -4.5 to
  40.2), its folded roof's ridges at 19.1 to 19.4 and valleys at 16.9 to 17.2 above 28.33 m, 7.3 m apart, the roof's
  top out to w 42 over the street; the canopy over the entrance at 10.85 (u -0.27 to 6.76); the north-east block
  (u 16.2 to 36.75, out to w 43.0) at 23.9 to 24.6 with a raised part at 27.0 to 27.5 (from u 14.6, its wall standing
  from the hall's roof); the long block behind (u -43.0 to 34, w -26 to -4.5) at 31.2 to 32.2, with strips 2 to 3 m
  wide at 34.5 to 35 across its middle, raised parts at 37.2 to 38 at each end of it, the stair's core at 33.2 to 33.7
  (u -15 to -2.5), the podium at 7.6 to 8.0 (its parapets to 9) along its south-east side and round its south-west end,
  and 12, a low roof at -0.5 and a part at 3 to 4 by its south-west end, and a link at 13.5 beside the hall, with a
  strip at 10.3 to 11.8 along the long block and the hall's south-west side, open under it in places.
  Roofs west of the hall (17 to 26 m) stand outside the ring: other buildings, not drawn.
- Walls go down to `FOOT`, 4.5 m under 28.33 m, all but the canopy's and the two plates' at 10.9, which hang from the
  walls beside them: the ground falls from 35.5 to 36.1 on the street side to 24.2 to 24.9 on the south-east side.

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/shapes.js` (the Humanities
  Building's), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 638 triangles, 5 draw
  calls; step 8: 648, 5; the review's round 1: 712, 5; round 2: 728, 5; round 3: 744, 5; its review:
  776, 5.

## Rounds
- Round 0 (2026-11-09, the lead alone): the plans at the LiDAR's edges and the campus map's ring; the hall's walls,
  its glazed front (`glass`) and the folded roof's plates, grey on top (`roofGrey`) and near black under and at their
  edges (`screenBlack`), 1.4 m deep at the front (estimated, through the photograph's fitted camera: the glass meets
  the plates' underside about 1.45 m under the LiDAR's top); the canopy and the north-east block's faces toward the
  street and the hall pale metal (`claddingPale`); the faces no photograph shows plain (`grey`); the strips over the
  long block's middle drawn solid (the LiDAR's returns there lie both at their top and on the roof under them); the
  light. The photograph's sky is all behind the plane trees' leaves, so the silhouette IoU tells nothing here (0.639
  in the model's screen box, with no sky in it); the camera's fit (rms 1.77 px over the canopy, the foot of the
  glass, the hall's two ends and an edge of the street) and the model laid over the photograph are the check. Luma
  204 against 213 as the metrics take it (the model at any height: under the ground line the photograph shows the
  street), 210 against 201 above the ground line. Top view: footprint IoU 0.874 (of the 511 m² only the model covers,
  most is the hall's roof over its glazing strips and a planted part, which the LiDAR classes as vegetation), 74% of
  16,036 cells within 0.5 m, highest 30.54 against 30.93 over the door's ground; block 201 86.8% under the model.
- Step 8 (2026-11-09): the hall's roof falling 0.75 m to the back, as the LiDAR's; the tops at the LiDAR's roof levels
  (their medians, where round 0 took their 95th percentiles); the podium on its roof, not its parapets; the long
  block's raised parts 0.1 m back from its north edge. 648 triangles. Top view: 0.874, 80% of 16,036 cells within
  0.5 m. Luma 213 against 203 as the metrics take it, 198 against 209 above the ground line; IoU in the box 0.646.
- The review's round 1 (2026-11-09): the north-east block's raised part from u 14.6, its wall down from the hall's
  roof (it overhung the hall by 2.2 m with nothing under it); the north-east block's front and east side at the
  LiDAR's edges (w 43.0, u 36.75); the stair's core at u -15 to -2.5, to w -33; the long block's south-west end at u
  -43.0, the podium round it, the low roof at -0.5 and the part at 3.6 beyond it, where a block at 9 stood; the link
  at 10.9 by the block; the canopy's depth named on the card. 712 triangles, 5 draw calls. Top view: footprint IoU
  0.896, 80% of 16,031 cells within 0.5 m; block 201 85.1% under the model. Luma as at step 8; the IoU in the box 0.652.
- The review's round 2 (2026-11-09): the north-east block's front corner at the LiDAR's (w 39 from u 35.5); the
  long block's north-west extension to u -39 and w -0.5; the part at 12 to u 7, over the podium no further; the link
  at 13.5 to u -19.5, at 10.9 along the long block and along the hall. 728 triangles, 5 draw calls. Top view:
  footprint IoU 0.902, 80% of 16,029 cells within 0.5 m; block 201 84.6% under the model by the top view's count,
  which counts only what stands more than 2.5 m over the door's ground (94.4% of its outline counted from the ground
  under each cell, 98.1% of the cells in it where the LiDAR has a roof). Luma and the IoU in the box as before.
- The review's round 3 (2026-11-10): the long block's north-west extension to u -29.1, where its roof ends, and the
  strip at 10.9 from there, closing the slot between the extension and the link; the strip at 10.9 along the hall's
  whole south-west side, to w 31; the part at 3.6 to w -0.5; the two low parts named as under the map's ground on the
  site. 744 triangles, 5 draw calls. Top view: footprint IoU 0.911, 80% of 16,204 cells within 0.5 m; block 201 85.3%
  under the model by the top view's count (95.0% of its outline counted from the ground under each cell, 98.9% of the
  cells in it where the LiDAR has a roof). Luma and the IoU in the box as before.
- The review of round 3's fix (2026-11-10): where the LiDAR sees the ground or planting under the strip at 10.9 (over
  the passage by the north-west extension, and along the hall north of the link), a plate 0.6 m deep (estimated), hung
  from the walls beside it, not a block down to `FOOT`; its depth named in `estimated` and on the card; the link's 13.5
  part to its north wall at w 3.7. 776 triangles, 5 draw calls. Top view: footprint IoU 0.911, 80% of 16,188 cells
  within 0.5 m; block 201 85.1% (94.8% and 98.8% by the second count). Luma and the IoU in the box as before.

## Rules
- Measure, don't guess: a size not from the LiDAR is named in the config's `estimated`, here and on the card.
- No two faces of different materials in one plane; every wall down to `FOOT` but the canopy's and the plates', hung
  from the walls beside them.
- The photograph is a reference only: never traced, sampled or published; it stays in the gitignored `refs/photos/`.
