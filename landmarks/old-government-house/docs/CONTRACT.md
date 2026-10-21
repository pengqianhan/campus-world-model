# Engineering contract (read before writing code)

Old Government House (building 102 of the University of Auckland's campus map) drawn in three.js from
code alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js through the import map of
the shared viewer, `../pipeline/viewer/index.html`. No external 3D models or image textures: every
mesh and texture is generated in code. Photographs are **references only**; nothing is traced or
sampled from them into the model.

## Frame and sizes
- View frame, metres: **x** to the right as seen from the lawn on the north-east, **y** up from the
  ground at the porch of the garden front (37.5 m NZVD2016), **z** toward the lawn (north-east); the
  centre of the main roof's high points at x = z = 0. `config/old-government-house.json`, `frame`.
- What the LiDAR shows, in this frame (`data/old-government-house_plan_frame.png`, `_front_elevation.png`):
  - the main block, two storeys, from x ≈ -24 to 23 and z ≈ -10 to 8: its middle (x ≈ -18 to 15)
    stands forward to z ≈ 8, its ends to z ≈ 5; eaves about 9–10.5 m, ridges about 12.4–12.7 m,
    chimneys to 13.8–15.1 m;
  - lower ranges behind it round a courtyard (south-west, z ≈ -25 to -1), eaves up to about 8.5–9 m,
    with one higher ridge at z ≈ -19 (x ≈ -9 to 15);
  - a porch of about 4.4 m at the middle of the garden front (x ≈ -6 to 0, z ≈ 8 to 12).
- The axis is that of the upper roofs (`frame.min_above` 9.5 m), along the garden front: with the
  lower ranges counted it turns 10° off it.
- The sizes every part shares go in `parts/common.js` (the lead's). If a size there is wrong, measure
  it from the LiDAR (`data/old-government-house_pts.npy`: x, y, z, class in local NZTM metres) and
  say so in your report with the numbers; do not edit `common.js`.

## References
- The building stands among large trees in its grounds. Of the 30 Google panoramas within 120 m,
  only two see it, both from the campus road beyond its south-east end (2025-05, 72 and 82 m):
  `refs/streetview/hRE5…` (the south-east end and the corner of the garden front, upper storey, clear)
  and `refs/streetview/d8o4…` (small, through trees). Views `*_wide.jpg`, `*_upper.jpg`, `*_door.jpg`.
- So the silhouette is checked against the LiDAR, not the photographs: the model's roof seen from
  above against the LiDAR heightmap (IoU ≥ 0.80), and its eaves, ridges and chimneys within 0.5 m of
  the LiDAR. The two views check what the surfaces look like and the parts of the south-east end.
- Do not fetch more Street View imagery yourself (it is billed per tile); ask the lead.

## Running things
- The viewer, from the repository root served on port 8765:
  `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=old-government-house&view=orbit`.
- Compare with the references: `node ../pipeline/tools/compare.mjs --out out/<you>/<round> [--match hRE5]`
  writes, per view, the render and `*_strip.jpg` (reference | render | overlay). Open them and look.
- One picture from any camera: `node ../pipeline/tools/shot.mjs out/<you>/x.png "pos=x,y,z&look=x,y,z&fov=40" 1600x1067`.
- A part that throws is logged (`part <name> failed`) and left out of the model. Fix every error or
  warning you cause. The GPU is shared: render what you need.

## Ownership (edit only your files; read anything)
The parts and their owners are set when the rough model is drawn (the lead), and written here then.
`../kit/` and `../pipeline/` are shared by every landmark: a change there adds options with defaults
and leaves the Clock Tower's viewer pictures (`?quality=low`, `?mask=1`) identical.

## Budget (tier 1: the site runs in a browser, phones too)
- Whole building ≤ 150k triangles and ≤ 12 draw calls (merged by material). Build time of a part
  ≤ ~300 ms on this machine (the console logs it).
- Generated textures ≤ 2048², and as few as possible; reuse the kit's where they fit.
- Street View: 276 tiles so far (180 for the low-resolution look, 96 for the two kept views), of the
  tier's 2,000.

## Rules
- Determinism: same code, same picture. Seeded randomness only, no `Math.random`, no `Date`.
- Real sizes first: the LiDAR is the truth for positions and heights; the photographs for what the
  surfaces look like. Where they disagree, say so in the report.
- What no photograph and no measurement shows is drawn plainly, not invented: no ornament on a face
  that no reference shows.
- Do not commit; the lead commits after reviewing.
- Finish with a short report: what you built, files, numbers (triangles, build ms), before/after
  strips (paths), what still differs and what you would do next.
