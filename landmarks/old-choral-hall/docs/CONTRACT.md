# Engineering contract (read before writing code)

Old Choral Hall (building 104 of the University of Auckland's campus map) drawn in three.js from code
alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js through the import map of the
shared viewer, `../pipeline/viewer/index.html`. No external 3D models or image textures: every mesh
and texture is generated in code. Photographs are **references only**; nothing is traced or sampled
from them into the model.

## What is drawn, and why only that
Every source shows the building during works (README.md, "The sources: works in progress"): the LiDAR was flown
on 18 May 2024 with the north-east blocks scaffolded and wrapped, and the Grafton Road panoramas of
2024-08 show the wraps. Only the **south-west range and its two end pavilions** are seen as they are,
in panoramas of 2022-09 taken before the works and of 2024-10 after them, and the LiDAR measured them
unwrapped. So that range is drawn in detail (`southwest`). **Everything else is the campus map's
estimated block** (`rest`), by the maintainer's choice of 2026-10-23: block 104's outline from
`public/data/campus.json` less the range's side, flat-topped at the map's block top, plain walls.
Nothing measured from the LiDAR or seen in a photograph outside the range goes into `rest`. Round 1
drew the rest at the LiDAR's sizes (`parts/massing.js`, in the history at 83c449d); it is not drawn,
because those sizes are partly the scaffolds'. How to draw the whole building after the works is the
maintainer's to decide.

## Frame and sizes
- View frame, metres: **x** to the right as seen from Grafton Road on the south-east, **y** up from
  37.7 m NZVD2016 (the ground in the middle of the street front), **z** toward the street.
  `config/old-choral-hall.json`, `frame`.
- `parts/common.js` (the lead's) holds the shared sizes: `GROUND` (the footpaths: the front falls from
  +0.8 to −0.85 m along x; the south-west footpath rises from +1.0 m at the corner to +2.9 m at the
  back), `SW` (the south-west range, turned 22.25° from the frame, with `swMatrix()` and `swPoint()`
  to draw it in its own frame x', z'). The rest's LiDAR sizes of round 1 (`FRONT`, `RANGES`, `NE`,
  `BACK`) are left out with it.
- `parts/rest.js` holds the map's block: `OUTLINE` (building 104's outline in `campus.json`, taken
  into the view frame through `placement.json`), `MAP_BLOCK` (its footing 1.77 m above the DEM at the
  door, and its 7.2 m: 2 storeys of 3.6 m) and `TOP` (y 8.97). If the door or the placement moves,
  work `OUTLINE` and `MAP_BLOCK.base` out again.
- The LiDAR: `data/old-choral-hall_pts.npy` (x, y, z, class in local NZTM metres; class 6 building,
  2 ground, 5 high vegetation). Its frame: `data/old-choral-hall_frame.json` (`centre`; `axis` = −x;
  `toStreet` = +z; ground 37.7). Beware: along the south-west side the plane trees' crowns, 17.5 to
  25 m up, are classed as building; over the north-east blocks the tops are partly the scaffolds'
  temporary roofs. If a size in `common.js` is wrong, measure it and say so in your report with the
  numbers; do not edit `common.js` (use your own constants meanwhile).

## References (`refs/streetview/`, views `*_wide.jpg`, `*_upper.jpg`, `*_door.jpg`)
- Before the works: `Uype…` (2022-09, off the corner: the range and the corner pavilion, through a
  plane tree), `nAxE…` (2022-09: the range and the north-west pavilion, clearest), `e8T_…` (2022-09,
  further north-west). `C1kG…` (2024-10) is across the corner: the corner pavilion and the range restored, out of
  their scaffolds; its camera is off (the model draws about twice the photograph's size there), so use
  it for what the corner pavilion looks like, not for where it falls.
- During the works: `OpqZ…`, `ctyQ…`, `m1hD…`, `zPP5…`, `LwAj…`, `iz57…` (2024-08, Grafton Road)
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
| southwest | `parts/southwest.js`, new `parts/southwest_*.js`: the south-west range, its two end pavilions and the corner pavilion's face on Grafton Road |
| rest | `parts/rest.js`: everything else, as the campus map's estimated block until the works end; a later round replaces this file |

- `../kit/` and `../pipeline/` are shared by every landmark: do not edit them; ask the lead. The
  `Builder` (`../kit/gothic.js`) merges everything into one mesh per material name. Names for this
  building: `brick` (red brick with pale joints), `render` (cream painted render), `paint` (white
  frames and bars), `glassPale` (panes), `roofGrey` (mid-grey roofs), `void` (dark openings), `plain`
  (the rest's walls: no texture, no shader, the map's wall colour). A name the kit does not have makes
  the part fail.
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
- What no photograph and no measurement shows is drawn plainly, not invented. Where every source shows
  the building during works, the map's estimated block stands in for it (`rest`).
- Do not commit; the lead commits after reviewing.
- Finish with a short report: what you built, files, numbers (triangles, build ms), before/after
  strips (paths), measurements, what still differs and what you would do next.
