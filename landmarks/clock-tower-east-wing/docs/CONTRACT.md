# Engineering contract (read before writing code)

The Clock Tower East Wing (building 119 of the University of Auckland's campus map) drawn in three.js
from code alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js through the import map
of the shared viewer, `../pipeline/viewer/index.html`. No external 3D models or image textures: every
mesh and texture is generated in code. Photographs are **references only**; nothing is traced or
sampled from them into the model.

## Frame and sizes
- View frame, metres: **x** to the right as seen from the lawn and the car park on the south-west
  (so +x is south-east, toward Symonds Street, and -x north-west, toward the Clock Tower), **y** up
  from the ground at the foot of the stair tower (40.0 m NZVD2016; `door` x -0.4, z 9.0), **z** toward
  the lawn; the middle of the main range at x = z = 0. `config/clock-tower-east-wing.json`, `frame`:
  the centre is the mean of the building's points above 9 m, within 1.5 m of building 119's outline
  without its north-west tail (the Clock Tower's own points and the trees over the link would pull it
  10 m away); the axis is the bearing of most of the walls (-45.44°; the principal axis is 1.3° from
  it); the front faces 224.56°.
- What the LiDAR shows, in this frame (`data/clock-tower-east-wing_plan_frame.png`,
  `_front_elevation.png`; the walls from building 119's floor outline in campus.json):
  - **the main range** (x -19.9 to 17.0, z -4.4 to 8.2; its west end steps in to x -17.8 from z 1.1):
    two storeys under a red tile roof hipped at both ends, ridge 9.2-9.6 m along z 1.5 to 3.5, eaves
    about 7.3 m (8.0 m on the slope just behind the front wall, 7.0 m at the back);
  - **two pavilions** toward the lawn (x -17.7 to -7.4 and 6.7 to 17.0, z 8.2 to 13.05): walls to
    7.4 m at the corners, a gable toward the lawn with its apex at 8.3-8.6 m, a low roof along z
    behind it (8.0-8.15 m on its ridge);
  - **the stair tower** in the middle of the front (x -3.1 to 2.3, 0.8 m proud of the wall at z 9.0,
    its body back to about z 6): flat-topped at 10.3-10.4 m;
  - **two blocks at the back** (x -10.3 to -5.0 and 4.6 to 9.4, z -6.7 to about -1.5): flat-topped at
    10.0-10.35 m; between them a low roof at 3.1 m over the back wall's foot (z -5.5 to -4.4);
  - **the link** toward the Clock Tower (x about -33 to -19.9, z -4.3 to 1.1): one storey, a flat roof
    at 6.5-6.6 m, on ground that rises about 3 m toward the tower; under trees.
  - The ground: 0 to +0.1 m on the car park in front, -0.6 to -0.9 m behind the range, rising to about
    +3 m under the link. Walls go down to `FOOT` (-1.0 m).
- `parts/common.js` holds these sizes. It is the lead's: read it, do not edit it; report a size you
  measure and the lead moves it there.

## Ownership
- `parts/range.js` (the main range, its front walls between the pavilions and the tower, its roof; the
  back blocks and the low roof between them), `parts/pavilions.js`, `parts/tower.js`, `parts/link.js`,
  `parts/shapes.js` (shared helpers: one owner per round, named in the brief). `model.js` and
  `parts/common.js` are the lead's.
- `landmarks/kit/` is shared by every landmark: add, with defaults, and show the other landmarks'
  pictures unchanged (`?quality=low` and `?mask=1` before and after). `roofTile` (red clay tiles, the
  pale roof's shader) was added for this building.

## Budget (tier 1: the site runs in a browser, phones too)
- Whole building ≤ 150k triangles and ≤ 12 draw calls (merged by material). Build time of a part
  ≤ ~300 ms on this machine (the console logs it).
- Generated textures ≤ 2048², and as few as possible; reuse the kit's where they fit (the walls use
  the Clock Tower's `ashlar`).
- Street View: ≤ 2,000 tiles for this building; 572 bought (2026-10-27).

## References
- Four Google panoramas of 2025-05 on the lawn side (`streetview.pano_ids`). `EX9b…` (28.5 m away,
  across the car park) shows the whole lawn side of the range, both pavilions and the tower: it is the
  reference. `fF8q…`, `51j5u…` and `-JHjl…` (35-62 m) look along the old basalt wall of the Albert
  Barracks, which fills half their frames and more; above it they show the roofline, the tower and the
  pavilions' gables. Their silhouette scores measure the wall, not the wing.
- Not used: three Google panoramas on Princes Street (2024-07, 80-97 m away, behind the Clock Tower
  South Wing) and two that are not Google's (user-contributed).
- No photograph shows the back, the ends or the link: draw them plainly at the LiDAR's sizes.

## Rules
- Measure, don't guess: a size comes from the LiDAR, the outline or a photograph against them; say
  which in a comment.
- Real or absent: what no photograph shows is plain stone wall, not invented windows.
- No people, no cars: they are in the photographs, not in the model.
