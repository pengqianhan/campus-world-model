# Engineering contract (read before writing code)

A reproducible pipeline that draws the University of Auckland's Clock Tower (building 105) in three.js
from code alone, sized by real measurements and checked against real photographs. Zero-build ES
modules, three.js r186 through the import map in `index.html` (from `node_modules/three`, `npm install`). No external 3D models or image textures: every mesh and texture is
generated in code. Photographs are **references only**; nothing is traced or sampled from them into the
model.

## Frame and sizes
- View frame, metres: **x** to the right as seen from Princes St, **y** up from the ground at the door
  (45.8 m NZVD2016), **z** toward the street; the tower's centre at x = z = 0.
- Sizes from the LINZ 2024 LiDAR (CC BY 4.0) are in `src/parts/common.js`. The raw measurements, written
  by `./run.sh data`: `data/clocktower_pts.npy` (x, y, z, class in local NZTM metres; class 6 =
  building, 2 = ground), `data/clocktower_frame.json` (tower centre, facade axis `axis` (= -x),
  `toStreet` (= +z), ground), `data/clocktower_plan_frame.png`, `data/clocktower_front_elevation.png`.
  Python with numpy/laspy/pyproj/scipy/PIL (`requirements.txt`), run with `-I`.
- If a size in `common.js` is wrong, measure it from the LiDAR and say so in your final report with the
  numbers; do not edit `common.js` (the lead does).

## References
- `refs/streetview/views.json`: one entry per reference view, each with the camera that took it
  (`position`, `target`, `vfov`, `width`, `height`) in the view frame. Files `*_wide.jpg` (whole
  front), `*_tower.jpg` (the tower), `*_door.jpg` (the doorway), from Street View panoramas of 2024-07
  (Princes St) and 2025-05. People and cars in them are not part of the model.
- Do not fetch more Street View imagery yourself (it is billed per tile); ask the lead.

## Running things
- The page is served from the repository root at
  `http://localhost:8765/landmarks/clocktower/index.html` (the lead starts it; if not running:
  `python3 -m http.server 8765 --bind 127.0.0.1` in the repository root). Paths below are relative
  to this folder.
- Refined reference cameras: `refs/streetview/views_refined.json` (used by `compare.mjs` when present;
  rerun `./run.sh refine` after big shape changes). `./run.sh` runs every stage; see `README.md`.
- Compare with the references: `node tools/compare.mjs --out out/<you>/<round> [--match tower]
  [--query "only=tower"]` builds the model once in headless Chrome on the RTX 3080 and writes, per
  view, the render and `*_strip.jpg` (reference | render | 50% overlay). Open the strips and look.
- One picture from any camera: `node tools/shot.mjs out/<you>/x.png "?pos=x,y,z&look=x,y,z&fov=40" 1600x1067`.
  Interactive: `?view=orbit`. Lay the reference over a view: `?sv=<file>&overlay=0.5`.
- Read the page's console output that the tools print; fix every error or warning you cause. A part
  that throws is logged (`part <name> failed`) and left out of the model.
- The GPU is shared by several agents: render what you need, not everything every time
  (`--match`, `--query only=`).

## Ownership (edit only your files; read anything)
| Owner | Files |
| --- | --- |
| lead | `src/clocktower.js`, `src/parts/common.js`, `docs/`, `index.html` |
| pipeline | `tools/` (except that others may add `tools/<owner>_*.mjs|py` helpers), `run.sh`, `README.md`, `data/` |
| tower | `src/parts/tower.js`, new `src/parts/tower_*.js` |
| centre | `src/parts/centre.js`, new `src/parts/centre_*.js` |
| facade | `src/parts/pavilion.js`, `src/parts/ranges.js`, `src/gothic.js` (the shared Gothic kit) |
| look | `src/main.js`, `src/textures.js`, new `src/look/*.js`, new `src/landscape.js` |

- `src/gothic.js` is shared: the facade agent owns it and keeps every exported signature backward
  compatible (add options, never remove or rename). Others who need a new general part write it in
  their own file, and may suggest it for the kit in their report.
- The `Builder` (gothic.js) merges everything into one mesh per material name. Material names in use:
  `ashlar`, `smooth`, `dressed`, `glass`, `timber`, `roof`, `iron`, `dial`, `shade`. The look agent owns
  the materials (`src/main.js`); a part that needs a new material asks for it in its report and uses an
  existing one meanwhile.

## Budget (the site runs in a browser, phones too)
- Whole building ≤ ~400k triangles, ≤ ~60 draw calls (merged by material, so this is mostly about
  materials and instanced meshes). Build time of a part ≤ ~300 ms on this machine (the console logs it).
- Generated textures ≤ 2048², and as few as possible.
- Repeated small parts (pinnacles, crockets, tracery) in merged geometry or instanced; keep
  triangle counts per pinnacle modest.

## Rules
- Determinism: same code, same picture. Seeded randomness only (`rng(seed)` in textures.js), no
  `Math.random`, no `Date`.
- Real sizes first: the LiDAR is the truth for positions and heights; the photographs for what the
  surfaces look like. Where they disagree, say so in the report.
- Do not commit; the lead commits after reviewing. Do not touch files outside this folder.
- Finish with a short report: what you built, files, numbers (triangles, build ms), before/after
  strips (paths), what still differs from the photographs and what you would do next.
