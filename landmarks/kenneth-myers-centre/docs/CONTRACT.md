# Engineering contract (read before writing code)

The Kenneth Myers Centre (building 820 of the University of Auckland's campus map, 74 Shortland
Street) drawn in three.js from code alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js
through the import map of the shared viewer, `../pipeline/viewer/index.html`. No external 3D models or
image textures: every mesh and texture is generated in code. Photographs are **references only**;
nothing is traced or sampled from them into the model.

## Frame and sizes
- View frame, metres: **x** east-north-east (the frame's `-axis`, to the right as seen from Shortland
  Street), **y** up from the frame's ground (25.5 m NZVD2016, the street before the door), **z**
  south-south-east (`toStreet`, toward Shortland Street); the mean of the building's points above 8 m
  at x = z = 0. `config/kenneth-myers-centre.json`, `frame`: the centre from the points within 1.5 m of
  building 820's outline in campus.json (the first data run), the axis from the walls.
- **The plan is the LiDAR's.** campus.json's outline of 820 lies about 2 m north of the building's
  front and back and adds a tail on the west and a nub on the east over lower roofs; the config's
  `building.outline` is a ring traced from the LiDAR instead (`building.outline_note`), and
  `building.campus_outline` keeps the University's. The data stage's heightmap figure draws the
  map-frame outline without taking it to NZTM, so there it stands about 5 m off.
- What the LiDAR shows, in this frame (`parts/common.js` holds every size, with where it came from):
  - **the main range**: x -16.7 to 21.4, z -12.6 to 16.2, its flat roof at 6.62 m, a parapet at 7.9 m
    round its east part; the east wall runs 3.5° off the frame's z;
  - **the street face** steps back twice from west to east: the west part's face at z 16.21 (x -16.7
    to 0.0), the porch's at 14.78 (x 0.0 to 7.2) with a spired pilaster block at each end standing out
    to 15.3 and 15.0, the east part's on a line 3.9° off the frame's x, from (7.2, 12.17) to
    (21.37, 11.19);
  - **the west part's range along the street** at 10.04 m, 4.4 m deep, turning back down the west side
    as a wing at 10.15 m; **the porch** at 8.37 m; **two blocks** at 10.06 and 10.03 m on the main roof;
  - **the mast**: a lattice on the main roof at (2.96, -1.04), 3.9 m across at 13 m, 1.6 m at 37 m, its
    top at 39.3 m: the model's highest point, and the LiDAR's;
  - **the ground**: -0.2 m on Shortland Street before the door, +0.65 before the east part, -2.8 on
    the east, -12.1 along the back and -13.0 in the lane on the west. Walls go down to `FOOT` (-13.1 m).
- `parts/common.js` is the lead's: read it, do not edit it; report a size you measure and the lead
  moves it there.

## Ownership
- `parts/body.js` (the masses and roofs), `parts/mast.js` (the mast), `parts/front.js` (what the
  street faces carry: pilasters, pinnacles, the cornice, the blind arches, the windows, the door and
  its steps), `parts/shapes.js` (shared helpers, after the Fisher Building's: one owner per round,
  named in the brief). `model.js` and `parts/common.js` are the lead's.
- `landmarks/kit/` is shared by every landmark: add, with defaults, and show the other landmarks'
  pictures unchanged (`?quality=low` and `?mask=1` before and after).

## Budget (tier 2: the site runs in a browser, phones too)
- Whole building ≤ 100k triangles and ≤ 10 draw calls (merged by material). Build time of a part
  ≤ ~300 ms on this machine (the console logs it).
- No image textures; the walls use the kit's `brickBrown` (the brick's shader in a browner, duller
  brick, added for this building), the dressings its `render`, the openings its `void`. Round 1:
  13,242 triangles in 5 meshes (`brickBrown`, `render`, `void`, `roofGrey`, `paint`).
- Street View: ≤ 1,200 tiles for this building; 429 bought (one panorama, 2026-10-27). Nothing more.

## References
- One Google panorama of 2026-04 on Shortland Street, `0Rjk296LTsGDt_gXXn3yrg`
  (`streetview.pano_ids`), 32 m from the frame's centre, south-east of the building: its `wide` view
  sees the whole street face, `upper` the porch and the east part's upper storey, `door` the door and
  its steps. Its copyright reads "From the Owner, Photo by: Google". The cut does not apply its own
  tilt and roll, so its views stood turned 4.53° clockwise: `streetview.camera_fixes` cuts them level
  and sets the camera (`camera_fixes_note`). Through it the east part and the porch agree with the LiDAR
  to 9.5 px; the west part does not (its corner falls at x -8.3, its coping at 7.0 m, where the LiDAR
  has x -16.7 and 10.3 m): that part of the photograph is not measured through the camera.
- Glass towers stand behind the building, so the photographs show little sky round it: the IoU in
  the model's box says little (`sky_in_box`); the luma of the brick and the strips say more.
- A construction fence, a digger, a truck and a portable toilet stand in front of the east part's foot
  in the photographs: what they hide is not drawn from them.

## How to look and measure
- `landmarks/pipeline/run.sh kenneth-myers-centre refine compare topview` (serve the repository root
  on a free port first, `PORT=…`, and hold the GPU lock); the strips are in `out/pipeline/compare/`,
  the metrics in its `metrics.md`, the top view in `out/topview/`.
- The viewer: `landmarks/pipeline/viewer/index.html?landmark=kenneth-myers-centre&view=orbit`.

## Rules
1. **One writer per file.** Each agent edits only the files it owns.
2. **Measure, don't guess.** The LiDAR for positions and heights; the photographs, through the
   camera, for what the faces carry; what no view shows is estimated and says so.
3. **References only.** No photograph, crop or trace of one goes into the model or a commit.
4. **Determinism.** Seeded randomness only: same code, same picture.
5. **The budget** above, for the whole building.
6. **Agents do not commit**; the lead does. Every agent ends with a report: what it built, files,
   numbers, before and after strips, what still differs, what it would do next.
