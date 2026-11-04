# Engineering contract (read before writing code)

The Kate Edger Information Commons (building 315 of the University of Auckland's campus map) drawn in three.js
from code alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js through the import map of the
shared viewer, `../pipeline/viewer/index.html`. No external 3D models or image textures: every mesh and texture
is generated in code. Photographs are **references only**; nothing is traced or sampled from them into the
model.

## Frame and sizes
- View frame, metres: **x** south-west (the frame's `-axis`, along the two long ranges), **y** up from the
  frame's ground (41.5 m NZVD2016, the median ground in the crop box), **z** north-west (`toStreet`, toward the
  Student Commons); the frame's centre at x = z = 0. `door` (-42.0, 19.75) is on Alfred Street's footpath, 4.4 m
  north-east of the end of the prow's north-west side, where the LiDAR's ground is the frame's (41.50 m): no wall's foot stands
  on it, and the entrances the photograph shows are in the sunken court, 3.5 m lower, which the map's ground does not
  have (the config's `door.note`).
  `config/kate-edger-information-commons.json`, `frame`: the axis is the bearing of most of the walls. The two
  ranges run along x; the south-east range's face to the south-east does not (about 5° off), nor do the ranges'
  edges on the atrium: their plans follow the LiDAR.
- The building's own returns only: `building.outline` is campus.json's ring, within 1.5 m. The ring lies about
  2-4 m north-west of the LiDAR's walls, as other buildings' rings do; the plans follow the LiDAR.
- What the LiDAR shows (`parts/common.js` holds the numbers and says where each came from):
  - **the south-east range**, flat at 15.93 m, its north-east face at x -31.0 and set back to x -28.0 by the
    atrium; on it **the upper strip** (20.10 m, its north-east end at x -25.45), **the upper block** south-west of
    it (19.25 m) and **the plant** at its south-west end: screens 1 m thick at 20.35 m round x 20.6 to 28.6, z -16.0
    to -9.0, and within them one unit at 18.6 m;
  - **the north-west range**, flat at 15.80 m with a **parapet** at 16.55 m round it (its cells 16.4-16.6),
    its **north-east end** higher (16.6 m, its face at x -35.2 and then on a slant to (-31.2, 17.5)), with **the end
    over the court** (the prow) beyond it: its roof at 11.8 m, a rim at 12.8 m along its south-east and north-west
    sides, its north-east face curving from x -42.4 at its tip (z 7.0) back to -37.6 at its north-west side, and a
    glazed roof light on it (returns both at 11.6-12.0 and at 14.1-14.5 m in every cell of a band along it:
    14.2 m). How far down the prow reaches the LiDAR cannot say; the photograph shows the court and the building
    behind under it, its lower edge falling in a curve from its rim to about 5.1 m: its underside drawn level 0.45 m
    under its roof south-east of z 7.2, sloping to 5.1 m at z 9.1, and level beyond (estimated: the camera is out by
    about 1 m sideways at that edge of the photograph). Beyond its tip six building returns at its rim's height
    among a tree's are not drawn: the 2023 aerial, allowing for its lean, and the photograph put the corner at the
    plan's tip. Under its tip, a glazed **canopy** at 3.3 m (returns at 3.0-3.5 m). **The raised part** on the
    range's roof (19.0 m) and a **lower wing** at its south-west corner (11.7 m). Not 315's: the roofs before its
    face to the north-west from x -17 to -10 (drawn as a lower wing at 9.8 m until step 7) are AUSA House's (322, a
    measured massing on the site), whose hipped roof runs on beyond the campus map's ring of it toward this range, its slopes
    unbroken from 11.5 m to 9.0;
  - **the atrium** between the ranges: open at its north-east end (x -28 to -22: only its floor near 0.0 m, and the
    photograph's mesh panels with no roof's edge across them), then glazed (few returns; some at 13.5 m at both ends,
    no fall): a flat glazed roof at 13.5 m from x -22 to 9.6 and a floor at 0.0 m (estimated under the glass);
    over it at x 2 to 8 **a raised part** (18.3 m; how far down it reaches is not seen); south-west of the glass,
    between the ranges, **a roof at 7.7 m** (x 9.4 to 18) and beyond it **a low roof** at 4.2 m;
  - **the ground**: -3.5 in the sunken court at the north-east end, near -0.4 on Alfred Street beyond it, +0.2
    to +4.1 on the north-west side and at the south-west end; walls go down to `FOOT` (-4.5 m).
- What the photograph shows, through its fitted camera (`parts/common.js`, `faces`): the south-east range's
  north-east face behind pale silver screens from 3.7 m to its roof, green-tinted glazing under them; its corner
  glazed in green from 2.9 m; its face to the atrium's open end under grey mesh panels from 4.2 m, over
  green-tinted glazing; a dark shopfront across the atrium's end at the court's level; the prow's glass; the north-
  east end's face glazed, green under the prow.
- Not drawn yet: a lower roof near 10 m in the south-east range's north-east corner (x -30 to -27), the roofs'
  falls, the north-west range's strip along its face to the north-west (16.1-16.2 m, x -11 to 21) and the slot at
  14.5 m before it, the prow's lower edge as a curve (drawn as a slope), the frames, white columns and the diagonal
  strut, the canopies at about 4.3 m along the north-west face and at the south-west end, a flat roof at 7.8 m against
  the north-west face (x -14.5 to -12, z 17.8 to 20.5) whose building neither the LiDAR nor the photograph shows.
- The check (after round 1): `out/topview` and each part's cells against the LiDAR. The main block under the model
  93.1%, footprint IoU 0.893; the highest point 20.35 m against the LiDAR's 20.48 (p99.9); every part's top, the
  parapet and the plant's screens within 0.5 m of the median of their cells (the parapet 16.55 against 16.4-16.6).
  Placed on the map (step 7), without the wing that was AUSA House's: block 315 under the model 91.8%, footprint IoU
  0.881 (the LiDAR's cells within 1.5 m of 315's ring take in 322's roof beyond its ring), block 322 under it 0%
  (9.2% with the wing); no other block within 80 m: `building.also` is empty.

## Ownership
- `parts/southeast.js` (the south-east range and what stands on it, and its faces seen from Alfred Street),
  `parts/northwest.js` (the north-west range and its parapet, its north-east end and the prow, the canopy, the
  raised part, the lower wing), `parts/atrium.js` (the atrium's glazed roof and floor, the raised part over it, the roofs
  between the ranges south-west of it), `parts/shapes.js` (shared helpers: one owner per round, named in the
  brief). `model.js` and `parts/common.js` are the lead's.
- The materials (`landmarks/kit/materials.js`): the pale grey cladding `claddingPale`, the screens
  `screenSilver` and `screenGrey`, the green-tinted glazing `glassGreen` (round 1, this building's own), and the
  kit's `glassPale` (the prow, the roof light, the canopy, the atrium's roof), `glass` (the shopfront) and
  `roofGrey`. On the site `glassGreen` is the light form's glass (`LIGHT_ROLE`, `src/scene/landmarks.ts`); the
  cladding and the screens are its walls.
- `landmarks/kit/` and `landmarks/pipeline/` are shared by every landmark: add, with defaults, and show the other
  landmarks' pictures unchanged (`?quality=low` and `?mask=1`, or byte-identical stage outputs).

## Budget (tier 2: the site runs in a browser, phones too)
- Whole building ≤ 100k triangles and ≤ 10 draw calls (merged by material). Round 0: 484 triangles, 3 draw calls;
  round 1: 812 triangles, 7 draw calls; after the check: 1,208 triangles, 7 draw calls; placed on the map: 1,160
  triangles, 7 draw calls.
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
  view in `out/topview/`. The black outside the photograph in its level cut is ignored (its mask's `inside`). The
  config's `sky_mask` closes the bare branches before the sky (`branches_deg`) and keeps the pale screens and walls
  from passing for cloud (`pale_tint`); its `light` gives the viewer the photograph's soft light. GPU steps only
  under `~/.campus-loop/gpu.lock`.

## Rules
- Measure, don't guess: a size comes from the LiDAR, the outline or a reference through its fitted camera; say
  which in a comment, and say "estimated" where neither shows it, and name it in the config's `estimated`.
- Real or absent: what no reference shows is plain wall, not invented windows.
- No people, no cars, no trees, no signs, no umbrellas, no neighbour: they are in the photographs, not in the
  model.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces in one plane
  (`tests/landmarks.test.ts`, the coinciding faces).
