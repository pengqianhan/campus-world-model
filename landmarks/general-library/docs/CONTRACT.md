# Engineering contract (read before writing code)

The General Library (building 109 of the University of Auckland's campus map) drawn in three.js from
code alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js through the import map of
the shared viewer, `../pipeline/viewer/index.html`. No external 3D models or image textures: every
mesh and texture is generated in code. Photographs are **references only**; nothing is traced or
sampled from them into the model.

## Frame and sizes
- View frame, metres: **x** to the right as seen from Alfred Street on the south-west (toward the
  south-east end), **y** up from the ground at the main entrance in the south-east end (41.5 m
  NZVD2016; `door` x 30.0, z -7.0), **z** toward Alfred Street; the tower slab's roof centre at
  x = z = 0. `config/general-library.json`, `frame`: the centre is the mean of the building points
  higher than 26.5 m (the slab's roof and the core and plant on it); the axis is the walls'
  (`axis_from: "walls"`, bearing 311.83° grid), so the front faces 221.83°.
- What the LiDAR shows, in this frame (`data/general-library_plan_frame.png`, `_front_elevation.png`,
  `_heightmap_vs_aerial.jpg`; the sizes in `parts/common.js`):
  - **the tower slab**, turned 1.9° from the podium (`SLAB_TURN`): 61.3 m by 18.1 m, its roof at
    30.1 m, a raised middle over its right half at 31.6 m; floors 3.5 m apart (the LiDAR's horizontal
    lines on the street face at 12.0, 15.5, 19.0, 22.5 and 26.0 m). The floors' edges stand out of the
    roof's edge (the LiDAR's points on the sills): on Alfred Street 1.2 m on the right half and 0.3 m
    on the left, at the back 0.55 m, at the north-west end 0.3 m (`MEASURED.slab.edges`);
  - **the core** across the slab's middle, 16 m wide, to 36.05 m, with plant on it to 38.8 m (39.8 m
    at most), and **the stair tower** in front of it on Alfred Street, to 32.0 m;
  - **the podium**, aligned with the frame: the front-left block and the main body (x -46.3 to -3.8,
    z -21.2 to 21.3) and the middle behind the slab, roof 12.96 m; the back wing (x -12.5 to 16,
    z to -36), 12.91 m; the low block at the back right (x 16 to 29.4), 12.1 m. Its roof is ribbed
    (the aerial shows rows of roof lights; ribs at 13.05 m, troughs at 12.05 m, about 2.4-2.5 m
    apart): the LiDAR's heights there swing about ±0.5 m round the flat roof drawn at their median.
    Behind the fin screens' hoods the roof's edge is at the troughs' height, 12.0 m, so the sky shows
    between the hoods as the photographs show.
  - The ground falls 5 m across the site: Alfred Street in front of the podium is 2.9-3.2 m above
    y = 0, in front of the slab 1.2-2.2 m, the north-west end 2.5-4.1 m, the back 0.4-1.3 m, the
    north-east corner -0.9 m.
  - Trees: a plane tree's crown over the podium's front, by the stair tower (x -19 to -4, 13-21 m up),
    is classed partly as building. It is not part of the model.
- The walls go down to y = -1.5 (`FOOT`): the site stands the model on its own drawn ground (the 8 m
  DEM, on a 10 m grid), which lies -0.21 to +1.00 m from the door's under the model's foot, so no
  foot point stands above it (the highest is 1.29 m below it).
- The sizes every part shares go in `parts/common.js` (the lead's). If a size there is wrong, measure
  it from the LiDAR (`data/general-library_pts.npy`: x, y, z, class in local NZTM metres) and say so in
  your report with the numbers; do not edit `common.js`.

## Ownership
| File | What it draws |
| --- | --- |
| `parts/slab.js` | `slab` (the slab, its ribbon windows, roof and raised middle, the ground storey's glazing) and `core` (the core, the stair tower, the plant) |
| `parts/podium.js` | `podium` (the blocks, the fin screens and their crowns, the brick plinth, the glazed end by the stair tower, the north-west end, the back wing, the low block's end) and `canopy` (the glass canopy on Alfred Street) |
| `parts/facade.js` | the face helpers every part uses: `face`, `faceBox`, `ribbons`, `glazing` |
| `parts/common.js` | the measured sizes (the lead's) |
| `landscape.js` | the LiDAR's ground round the building, for the viewer only (the lead's) |

## Budget (tier 1)
- At most 150,000 triangles and 12 draw calls (one per material) for the whole model; round 0 is
  10,128 triangles in 5 materials (`paint`, `glassPale`, `iron`, `roofPale`, `timber`), built in 3-18 ms;
  on the site 10,248 in 6 (`brick` and `grey` in place of `timber`).
- No textures: the materials above are shader hooks without image textures, so the site never makes
  the stone textures for this model.

## References
- Twelve Google panoramas (`streetview.pano_ids`): six on Alfred Street in front of the slab and the
  podium (2022-09: `B4NW…`, `MMME…`, `w8_f…`, `CHbl…`, `v7l7…`, `vbVX…`), three at the south-east end
  (2025-05: `bsR6…`, `3HyL…`, `xKYw…`), two behind on the north-east (2025-05: `Zvdo…`, `fF8q…`) and one
  off the north-west end (2024-07: `Qaci…`), each with `*_wide.jpg` (hfov 95°), `*_upper.jpg` (40°) and
  `*_door.jpg` (45°). The Alfred Street views are under plane trees and close to the building (25-37 m
  from the slab's centre), so the refine stage corrected only two cameras (`xKYw…`, `Qaci…`).
- Faces in none of the twelve: the main block's back on the service lane (north-east of the front
  block), the low block's north-east face and both ends of the back wing. The back wing's north-west
  end is drawn with the fins of its north-east face (`EX9b…`'s probe image, not one of the twelve,
  sees it only edge-on); the others are drawn plain. The slab's north-west end above the podium is drawn from
  `Qaci…`'s upper view.
- Do not fetch Street View imagery yourself (it is billed per tile); ask the lead.

## Running things
- The viewer, from the repository root served on port 8770:
  `http://localhost:8770/landmarks/pipeline/viewer/index.html?landmark=general-library&view=orbit`.
- Compare with the references: `node ../pipeline/tools/compare.mjs --out out/<you>/<round> [--match <pano>]`
  writes, per view, the render and `*_strip.jpg` (reference | render | overlay). Open them and look.
- From above against the LiDAR: `../pipeline/run.sh general-library topview`.
- A part that throws is logged (`part <name> failed`) and left out of the model. Fix every error or
  warning you cause. GPU: before each render batch (compare, topview, shot) take
  `~/.campus-loop/gpu.lock` as the loop's rules say, and delete it as soon as the batch ends.
