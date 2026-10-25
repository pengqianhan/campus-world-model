# Engineering contract (read before writing code)

Alfred Nathan House (building 103 of the University of Auckland's campus map) drawn in three.js from
code alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js through the import map of
the shared viewer, `../pipeline/viewer/index.html`. No external 3D models or image textures: every
mesh and texture is generated in code. Photographs are **references only**; nothing is traced or
sampled from them into the model.

## Frame and sizes
- View frame, metres: **x** to the right as seen from Princes Street (on the west-north-west), that is
  toward the General Library (south-south-west); **y** up from the ground at the foot of the house's
  front steps (45.75 m NZVD2016; `door` x 0, z 31.0); **z** toward the street. The building is 50 m
  long and only its west end, the house's front, faces a street, so the frame's axis is the walls'
  turned 90° (`frame.axis_across`) and z runs along the building, from the block's east end (z -20)
  to the house's front (z 26-30). The centre is the mean of the building points above 11.75 m (the
  block's roof); a tree's crown over the house, classed as building, pulls it about 1 m toward the
  street. Axis bearing 19.99° (grid); the front faces 289.99°.
- What the LiDAR shows, in this frame (`data/alfred-nathan-house_plan_frame.png`,
  `_front_elevation.png`, `_heightmap_vs_aerial.jpg`):
  - **the block**: a rectangle, walls at x -6.45 and 7.25, z -19.8 to 17.5; eaves level all round at
    13.3 m; a low hipped roof of four planes of different pitch (fitted: 0.32 m a metre from the
    left edge, 0.79 from the right, 0.27 from the east end, 0.125 from the west), its apex about
    16.5 m up near x 3.5, z -8; a plant room on it, x 1.85 to 4.9, z -9.25 to -6.45, 18.55 m.
  - **the house**: x -6.6 to 8.4 behind (z 17.5 to 21.5) and -6.9 to 7.2 in front (to z 26.3); a flat
    roof at 10.25 m behind a parapet that rises to 11.45 on the front wall; before the front, tops
    8.75-9.15 m up, two canted bays to z 28.4 and between them a balcony bowed out to z 29.8 over the
    porch (the LiDAR sees x -7.5 to 6.9 at z 27.5, -5.1 to 5.0 at 28.5, -2.4 to 2.2 at 29.5). The
    widths of the bays and the porch, and the heights of the floors, come from vZGe's photographs
    (`parts/common.js`).
  - **the ground** falls away from the house's front: 0 at the door, -1.35 at the house's back
    corners, -2.2 at the block's west end, -3.35 at its east end, -4.5 at its north-north-east corner.
    The walls go down to `FOOT` in `parts/common.js` (the house -1.9, the block -4.8).
  - Trees: a crown over the house's north-north-east corner (x -8 to -5, z 15 to 23, up to 17.4 m) is
    classed as building. It is not part of the model.
- On the map the site stands the model on its own drawn ground (`public/data/terrain/central.json`)
  under the door: 41.48 m there, 4.3 m under the LiDAR's, and nearly level under the building (-0.87
  to +0.01 m from the door's). The block's east end, which stands 3.35 m lower in the LiDAR, is
  therefore partly under the map's ground there; nothing floats (each material's lowest points 1.8 m
  or more under it).
- The sizes every part shares go in `parts/common.js` (the lead's). If a size there is wrong, measure
  it from the LiDAR (`data/alfred-nathan-house_pts.npy`: x, y, z, class in local NZTM metres) and say
  so in your report with the numbers; do not edit `common.js`.

## References
- Cameras: every view keeps its Street View camera but the two campus-path panoramas', which
  `refine.fixed` in the config corrects on evidence from the east frame's own outline (fF8q 1.31 m
  lower, 51j5 pitched 4.38° down; the reasons are there). Do not let a search score the silhouette
  against other buildings: the photographs' solid holds the General Library and the Clock Tower's
  ranges.
- Five Google panoramas: three on Princes Street (2024-07, 48-49 m from the centre, 18-20 m from the
  house's front): `vZGe…` (straight in front), `RHEq…` (to the right) and `rA70…` (to the left,
  through a tree); two on the campus path east of the block (2025-05): `fF8q…` (33 m, 13 m from the
  east end) and `51j5…` (48 m, the east end and the long side toward the library). Each has
  `*_wide.jpg`, `*_upper.jpg` and `*_door.jpg`. No photograph shows the long side toward the Clock
  Tower (x-) whole, nor the house's back.
- Found with a low-resolution look (zoom 3) at the 13 Google panoramas within 70 m; 726 tiles in all
  (88 for the look, 638 for the five).
- Do not fetch Street View imagery yourself (it is billed per tile); ask the lead.

## Running things
- The viewer, from the repository root served on port 8769:
  `http://localhost:8769/landmarks/pipeline/viewer/index.html?landmark=alfred-nathan-house&view=orbit`.
- Compare with the references: `node ../pipeline/tools/compare.mjs --out out/<you>/<round> [--match <pano>]`
  writes, per view, the render and `*_strip.jpg` (reference | render | overlay). Open them and look.
- From above against the LiDAR: `../pipeline/run.sh alfred-nathan-house topview`.
- A part that throws is logged (`part <name> failed`) and left out of the model. GPU: before each
  render batch (compare, topview, shot) take `~/.campus-loop/gpu.lock` as the loop's rules say, and
  delete it as soon as the batch ends.

## Ownership (edit only your files; read anything)
| Owner | Files |
| --- | --- |
| lead | `model.js`, `parts/common.js`, `parts/shapes.js`, `config/`, `docs/` |
| block | `parts/block*.js`: the four-storey block, its roof and plant room, its east entrance |
| house | `parts/house*.js`: the house, its parapet, bays, porch and balcony |

- `../kit/` and `../pipeline/` are shared by every landmark: a change there adds options with
  defaults and leaves the other landmarks' viewer pictures (`?quality=low`, `?mask=1`) identical.
- The `Builder` (`../kit/gothic.js`) merges everything into one mesh per material name. Names for
  this building: `paint` (the house's white walls, trim, posts; the block's lowest storey),
  `panel` (the block's grey frame, fins and plant room, and its hipped roof: grey metal in the
  aerial; added to the kit for this building), `panelSeam` (the block's long walls: `panel` with
  standing seams 0.45 m apart drawn by its shader, which fades them out under about three pixels a
  seam; added in round 1), `glass` (the block's glazing), `glassPale` (the house's sashes),
  `roofPale` (the top of the balcony's entablature), `roof` (the slate over the bays, and the
  house's flat roof: dark grey in the aerial), `dressed` (steps and the porch's floor), `doorRed`
  (the house's two dark red doors: added to the kit for this building).

## Budget (tier 1: the site runs in a browser, phones too)
- Whole building ≤ 150k triangles and ≤ 12 draw calls (merged by material). Build time of a part
  ≤ ~300 ms on this machine (the console logs it). Round 1: 9,582 triangles in 9 draw calls, the
  block in 4 ms and the house in 12 ms.
- Generated textures ≤ 2048², and as few as possible; reuse the kit's where they fit.
- Street View: ≤ 2,000 tiles for this building (726 bought).

## Rules
- Determinism: same code, same picture. Seeded randomness only, no `Math.random`, no `Date`.
- Real sizes first: the LiDAR is the truth for positions and heights; the photographs for what the
  surfaces look like. Where they disagree, say so in the report.
- What no photograph and no measurement shows is drawn plainly, not invented.
- Do not commit; the lead commits after reviewing.
