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
- **The plan is the LiDAR's, and the aerial's for the west part.** campus.json's outline of 820 lies about 2 m north of the building's
  front and back and adds a tail on the west and a nub on the east over lower roofs; the config's
  `building.outline` is a ring traced from the LiDAR instead (`building.outline_note`), and
  `building.campus_outline` keeps the University's. The data stage's heightmap figure draws the
  map-frame outline without taking it to NZTM, so there it stands about 5 m off. The model stands
  where the LiDAR and the aerial show the building and replaces block 820, of which it covers 90.2%.
- What the LiDAR shows, in this frame (`parts/common.js` holds every size, with where it came from):
  - **the main range**: x -13.6 to 21.4, z -12.6 to 13.6, its flat roof at 6.62 m, a parapet round it
    (7.9 m; on the west side as high as the west part's coping band, estimated); the east wall runs 3.5°
    off the frame's z, the west wall (the aerial's) 3.4°, from (-13.6, 13.6) to (-15.16, -12.6);
  - **the street face**: the west part's and the east part's on one line 3.9° off the frame's x
    (z = 12.663 - 0.0688 x, fitted to the east part's wall returns; the aerial's coping edge follows it
    over the west part), the west part's from (-13.6, 13.6) to (0.0, 12.66), the east part's from
    (7.2, 12.17) to (21.37, 11.19); between them the porch stands forward to 14.78 (x 0.0 to 7.2), with
    a spired pilaster block at each end standing out to 15.3 and 15.0;
  - **the porch** at 8.37 m; **two blocks** at 10.06 and 10.03 m on the main roof;
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
  13,242 triangles in 5 meshes (`brickBrown`, `render`, `void`, `roofGrey`, `paint`); round 2, 13,700
  in the same 5.
- Street View: ≤ 1,200 tiles for this building; 429 bought (one panorama, 2026-10-27). Nothing more.

## References
- One Google panorama of 2026-04 on Shortland Street, `0Rjk296LTsGDt_gXXn3yrg`
  (`streetview.pano_ids`), 32 m from the frame's centre, south-east of the building: its `wide` view
  sees the whole street face, `upper` the porch and the east part's upper storey, `door` the door and
  its steps. Its copyright reads "From the Owner, Photo by: Google". The cut does not apply its own
  tilt and roll, so its views stood turned 4.53° clockwise: `streetview.camera_fixes` cuts them level
  and sets the camera (`camera_fixes_note`). Through it the east part and the porch agree with the LiDAR
  to 9.5 px, and the east part's coping reads 7.95 to 8.12 m against the LiDAR's 8.05.
- **The LiDAR over the west part is temporary works** (`camera_fixes_note`): scaffolding with netting
  and a temporary roof, 43 to 64% of its returns classed building where the building's other roofs are 98
  to 100%. The maintainer decided on 2026-11-02 that the west part is drawn from the 2023 aerial (its
  plan: the street face on the east part's line, the west wall, the pinnacles' places) and the
  photograph through the camera at the aerial's plan (its heights: the coping 7.75 m, the pinnacles 8.78
  to 9.30), not from the LiDAR; its roof from the LiDAR's returns under the temporary roof (6.48 m). The
  top view compares the model with a LiDAR that holds the works: it is read whole and without the west
  part's cells, and the model is not fitted to the works.
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
2. **Measure, don't guess.** The LiDAR for positions and heights (the aerial for the west part's
   plan); the photographs, through the camera, for what the faces carry and the west part's heights;
   what no view shows is estimated, says so in `parts/common.js`, and is named in the config's
   `estimated`.
3. **References only.** No photograph, crop or trace of one goes into the model or a commit.
4. **Determinism.** Seeded randomness only: same code, same picture.
5. **The budget** above, for the whole building.
6. **Agents do not commit**; the lead does. Every agent ends with a report: what it built, files,
   numbers, before and after strips, what still differs, what it would do next.
