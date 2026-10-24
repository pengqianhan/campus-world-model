# Engineering contract (read before writing code)

Maclaurin Chapel (building 107 of the University of Auckland's campus map) drawn in three.js from code
alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js through the import map of the
shared viewer, `../pipeline/viewer/index.html`. No external 3D models or image textures: every mesh
and texture is generated in code. Photographs are **references only**; nothing is traced or sampled
from them into the model.

## Frame and sizes
- View frame, metres: **x** to the right as seen from Princes Street (on the west-north-west), **y** up
  from the ground at the foot of the entrance steps (43.5 m NZVD2016; `door` x 7.2, z 10.0), **z**
  toward the street; the apex of the
  chapel's roof at x = z = 0. `config/maclaurin-chapel.json`, `frame`: the centre is the top of the
  roof and the spire on it (`tower_radius`: a tree's crown over the hall is classed as building), the
  axis is the hall's walls (bearing 19.82°; the front faces 289.82°).
- What the LiDAR shows, in this frame (`data/maclaurin-chapel_plan_frame.png`, `_front_elevation.png`):
  - **the chapel**: a regular hexagon in plan, a corner toward the street (+z) and a flat side toward
    the hall (+x); walls about 6.0 m from the centre to the middle of a side, up to eaves at 8.95 m,
    level all round; a low hexagonal pyramid roof, about 15°, to 10.55 m; and on its apex a slender
    spire, under 0.5 m wide, its tip at about 19.85 m and a cross on it to 21.1 m, 0.9 m wide;
  - **a bay** against the chapel's far side (x ≈ -9.9 to -5.9, z ≈ -3.5 to 3.1), 7.0–7.6 m high where
    the LiDAR sees it (7.1–7.7 m); a tree's crown hides the rest;
  - **the hall** (x ≈ 6 to 28.3, z ≈ -7.4 to 8.7): two end rooms and walk-ways along the middle under
    one flat roof at 3.37 m (3.25 m over the far end), which reaches 2.2–2.4 m beyond the middle room's walls (ground points
    under it: open walk-ways); the middle room (x ≈ 9 to 22.3, z ≈ -5.1 to 5.9) rises to a very low
    gable, eaves 4.55 m, ridge 5.0 m.
  - Trees: a crown over the hall's far end (x 23–29, 9–19 m up) and two over the corners between the
    chapel and the hall (9–15 m) are classed as building. They are not part of the model; they show in
    the top-view check as LiDAR higher than the model.
- The sizes every part shares go in `parts/common.js` (the lead's). If a size there is wrong, measure
  it from the LiDAR (`data/maclaurin-chapel_pts.npy`: x, y, z, class in local NZTM metres) and say so
  in your report with the numbers; do not edit `common.js`.
- The 2023 aerial (`data/maclaurin-chapel_heightmap_vs_aerial.jpg`) shows the chapel's roof green,
  with a rib on each hip, and the hall's roofs green and corrugated.

- The walls go down to y = -0.7 (`FOOT` in `parts/common.js`): the LiDAR ground falls to -0.62 m at
  the back, and the site stands the model on its own drawn ground (the 8 m DEM), which lies -0.18 to
  +0.06 m from the door's under the footprint.

## References
- Five Google panoramas on Princes Street (2024-07, a winter morning), 32–41 m in front of the street
  side: `refs/streetview/dtDw…`, `dsLb…`, `PC_4…`, `34Yw…`, `JYSz…`, each with `*_wide.jpg`,
  `*_upper.jpg` (the chapel and its spire) and `*_door.jpg`. `dsLb…` and `34Yw…` are the clearest;
  trees stand in front of all of them, `PC_4…` and `JYSz…` most. They show the street side only:
  the far side, the back of the hall and the bay's far end are in no photograph.
- Found with a low-resolution look (zoom 3) at the 19 Google panoramas within 70 m; the others see
  trees. 825 tiles in all (110 for the look, 715 for the five).
- Do not fetch Street View imagery yourself (it is billed per tile); ask the lead.

## Running things
- The viewer, from the repository root served on port 8766:
  `http://localhost:8766/landmarks/pipeline/viewer/index.html?landmark=maclaurin-chapel&view=orbit`.
- Compare with the references: `node ../pipeline/tools/compare.mjs --out out/<you>/<round> [--match <pano>]`
  writes, per view, the render and `*_strip.jpg` (reference | render | overlay). Open them and look.
- From above against the LiDAR: `../pipeline/run.sh maclaurin-chapel topview` (or
  `node ../pipeline/tools/topview.mjs --out out/<you>/topview` in this folder).
- A part that throws is logged (`part <name> failed`) and left out of the model. Fix every error or
  warning you cause. GPU: before each render batch (compare, topview, shot) take
  `~/.campus-loop/gpu.lock` as the loop's rules say, and delete it as soon as the batch ends.

## Ownership (edit only your files; read anything)
| Owner | Files |
| --- | --- |
| lead | `model.js`, `parts/common.js`, `config/`, `docs/` |
| chapel | `parts/chapel*.js`: the chapel's walls, roof, spire and the bay |
| hall | `parts/hall*.js`: the hall, its raised middle and the walk-ways |

- `../kit/` and `../pipeline/` are shared by every landmark: a change there adds options with
  defaults and leaves the other landmarks' viewer pictures (`?quality=low`, `?mask=1`) identical,
  pixel for pixel.
- The `Builder` (`../kit/gothic.js`) merges everything into one mesh per material name; a name the
  kit does not have makes the part fail: ask the lead. Names for this building, all the kit's own:
  `paint` (the white rendered walls, the window's frames, the hall's fascias and posts), `glass`,
  `roofPale` (the roofs: the aerial shows them light green, which the kit has no material for yet:
  a green metal roof is for a later round, as an option of the kit), `iron` (the dark line at the
  roofs' edges, the cross), `shade` (the spire's grey), `timber` (the doors and the entrance's
  fascia) and `dressed` (the entrance steps).

## Budget (tier 1: the site runs in a browser, phones too)
- Whole building ≤ 150k triangles and ≤ 12 draw calls (merged by material). Build time of a part
  ≤ ~300 ms on this machine (the console logs it).
- Generated textures ≤ 2048², and as few as possible; reuse the kit's where they fit.
- Street View: ≤ 2,000 tiles for this building (see "References" for what was bought).

## Rules
- Determinism: same code, same picture. Seeded randomness only, no `Math.random`, no `Date`.
- Real sizes first: the LiDAR is the truth for positions and heights; the photographs for what the
  surfaces look like. Where they disagree, say so in the report.
- What no photograph and no measurement shows is drawn plainly, not invented.
- Do not commit; the lead commits after reviewing.
