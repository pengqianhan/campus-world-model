# Engineering contract (read before writing code)

Old Choral Hall (building 104 of the University of Auckland's campus map) drawn in three.js from code
alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js through the import map of the
shared viewer, `../pipeline/viewer/index.html`. No external 3D models or image textures: every mesh
and texture is generated in code. Photographs are **references only**; nothing is traced or sampled
from them into the model.

## What this round draws, and why only that
Every source shows the building during works (README.md, "The sources: works in progress"): the LiDAR was flown
on 18 May 2024 with the north-east blocks scaffolded and wrapped, and the Symonds Street panoramas of
2024-08 show the wraps. Only the **south-west range and its two end pavilions** are seen as they are,
in panoramas of 2022-09 taken before the works, and the LiDAR measured them unwrapped. So this round
draws that range in detail, and **everything else plainly** at the LiDAR's sizes: no windows, no
ornament where no photograph shows a face.

## Frame and sizes
- View frame, metres: **x** to the right as seen from Symonds Street on the south-east, **y** up from
  37.7 m NZVD2016 (the ground in the middle of the street front), **z** toward the street.
  `config/old-choral-hall.json`, `frame`.
- `parts/common.js` (the lead's) holds the shared sizes: `GROUND` (the footpaths: the front falls from
  +0.8 to −0.85 m along x; the south-west footpath rises from +1.0 m at the corner to +2.9 m at the
  back), `SW` (the south-west range, turned 22.25° from the frame, with `swMatrix()` and `swPoint()`
  to draw it in its own frame x', z'), `FRONT`, `RANGES`, `NE`, `BACK`.
- The LiDAR: `data/old-choral-hall_pts.npy` (x, y, z, class in local NZTM metres; class 6 building,
  2 ground, 5 high vegetation). Its frame: `data/old-choral-hall_frame.json` (`centre`; `axis` = −x;
  `toStreet` = +z; ground 37.7). Beware: along the south-west side the plane trees' crowns, 17.5 to
  25 m up, are classed as building; over the north-east blocks the tops are partly the scaffolds'
  temporary roofs. If a size in `common.js` is wrong, measure it and say so in your report with the
  numbers; do not edit `common.js` (use your own constants meanwhile).

## References (`refs/streetview/`, views `*_wide.jpg`, `*_upper.jpg`, `*_door.jpg`)
- Before the works: `Uype…` (2022-09, off the corner: the range and the corner pavilion, through a
  plane tree), `nAxE…` (2022-09: the range and the north-west pavilion, clearest), `e8T_…` (2022-09,
  further north-west). `BCtN…` (undated) and `C1kG…` (2024-10) are across the corner: check what they
  show before you rely on them.
- During the works: `OpqZ…`, `ctyQ…`, `m1hD…`, `zPP5…`, `LwAj…`, `iz57…` (2024-08, Symonds Street)
  show scaffolds and white wraps; `xKYw…` (2025-05) is behind on the north-west. Use them for the
  outline at most, never for what a surface looks like.
- The views are aimed at the middle of the building, so the range is often at a view's edge: crop and
  zoom into the full panorama views with PIL as you need.
- Do not fetch more Street View imagery yourself (it is billed per tile); ask the lead.

## Running things
- The viewer, from the repository root served on port 8765 (the lead keeps it running):
  `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=old-choral-hall&view=orbit`.
- Compare with the references, in this folder: `node ../pipeline/tools/compare.mjs --out out/<you>/<round> --match Uype`
  (or `nAxE`, `e8T_`, …) writes, per view, the render and `*_strip.jpg` (reference | render | overlay).
  Open them and look.
- One picture from any camera: `node ../pipeline/tools/shot.mjs out/<you>/x.png "pos=x,y,z&look=x,y,z&fov=40" 1600x1067`.
- Triangles and build time without a browser, from the repository root:
  `node -e "import('./landmarks/old-choral-hall/model.js').then(async({build})=>{const{geometryMaterials}=await import('./landmarks/kit/materials.js');const g=build(geometryMaterials(),['southwest']);let t=0;g.traverse(o=>{if(o.isMesh){t+=o.geometry.attributes.position.count/3;console.log(o.name,o.geometry.attributes.position.count/3)}});console.log('triangles',t)})"`
- From above against the LiDAR (no GPU needed): `node ../pipeline/tools/topview.mjs --out out/<you>/topview`
  (with `PY` set to a Python that has `../pipeline/requirements.txt`), then look at `topview.png`.
- A part that throws is logged (`part <name> failed`) and left out of the model. Fix every error or
  warning you cause.
- **GPU, one task at a time.** Before each compare or shot batch, take `~/.campus-loop/gpu.lock`: if it
  exists, is younger than 60 minutes and is not yours, wait (re-check every minute, work meanwhile);
  else write `<date> A2 104 <you>` into it, and delete it as soon as the batch ends. Other agents run
  long GPU tests: keep batches short (one `--match`, not every view).

## Ownership (edit only your files; read anything)
| Owner | Files |
| --- | --- |
| lead | `model.js`, `parts/common.js`, `config/`, `docs/`, `README.md`, the look (`../kit/materials.js`) |
| southwest | `parts/southwest.js`, new `parts/southwest_*.js`: the south-west range, its two end pavilions and the corner pavilion's face on Symonds Street |
| rest | `parts/massing.js`, new `parts/massing_*.js`: everything else (the gabled ranges, the north-east wing, the blocks behind, the low block in the recess), plainly |

- `../kit/` and `../pipeline/` are shared by every landmark: do not edit them; ask the lead. The
  `Builder` (`../kit/gothic.js`) merges everything into one mesh per material name. Names for this
  building: `brick` (red brick with pale joints), `render` (cream painted render), `paint` (white
  frames and bars), `glassPale` (panes), `roofPale` (light grey roofs), `void` (dark openings). A name
  the kit does not have makes the part fail.
- Parts are added to `model.js` by the lead; tell the lead the name and file of a new part.

## Budget (tier 1: the site runs in a browser, phones too)
- Whole building ≤ 150k triangles and ≤ 12 draw calls (one a material). Shares: southwest ≤ 110k,
  rest ≤ 25k. Build time of a part ≤ ~300 ms. Repeated pieces (windows, dentils, modillions) cheap:
  `boxesGeometry`, `quadsGeometry` (`../kit/gothic.js`) or instancing by hand into one geometry.
- Street View: 1,715 tiles of the tier's 2,000 (43 for an earlier low-resolution look, 1,672 for the
  twelve panoramas).

## Rules
- Determinism: same code, same picture. Seeded randomness only, no `Math.random`, no `Date`.
- Real sizes first: the LiDAR is the truth for positions and heights; the photographs for what the
  surfaces look like. Where they disagree, say so in the report.
- What no photograph and no measurement shows is drawn plainly, not invented.
- Do not commit; the lead commits after reviewing.
- Finish with a short report: what you built, files, numbers (triangles, build ms), before/after
  strips (paths), measurements, what still differs and what you would do next.
