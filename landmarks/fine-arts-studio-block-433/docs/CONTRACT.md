# Contract: Fine Arts Studio Block 433

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** west-south-west (the frame's `-axis`), **y** up from the door's ground (33.1 m NZVD2016,
  on the lane before the north-west face), **z** north-north-west (`toStreet`); the frame's centre at x = z = 0.
  `config/fine-arts-studio-block-433.json`, `frame`: the building's returns within 1.5 m of the campus map's ring, the
  axis along its long walls (bearing 58.3 deg). The centre is the mean of those points, the lower block at the
  east-north-east end among them, so the main block's walls run from u -24.5 to 20.1, not about the centre.
- The building's own frame: **u** east-north-east (`-x`), along the frame's axis, and **w** north-north-west (`z`).
  `parts/common.js` gives `at` and `plan` for (u, w) and `Y`, which turns an elevation into a height over the door's
  ground.
- What the LiDAR shows (`parts/common.js` holds the numbers): a long block, its long walls at w 8.25 and -8.25 (where
  the returns under the eave peak), its east-north-east end wall at u 20.1; a shallow vault, 51.9 m at the crown and
  falling 2.05 m to w 10.15, its eaves at w 10.3 and its ends bowed out in plan (u -25.2 at the eaves to -26.8 at the
  crown, and 21.2 to 23.1); at the east-north-east end a lower block at 50.5 m, rounded in plan to u 30.3, and a plant
  room on the vault at 54.5 m; at the west-south-west end the balconies (46.9 to 47.8 m at u -27.5 to -26.5) and the
  outside stair (w -6 to -9.5). The ground: the lane before the north-west face at 33.1 m, the south-east side at
  30.2, the end's ground falling from 33.3 to 30.5.
- The west-south-west end wall at u -24.5 is where the photograph's camera puts the west corner: the LiDAR sees the
  balconies and the stair before it, not the wall.
- Walls go down to `FOOT`, 28.5 m, 4.6 m under the door's ground.

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/facade.js`, `parts/shapes.js` (106's,
  as every landmark's): the lead.

## Budget
- Tier 3 (a plain building of the measured massings, upgraded): 20k triangles, 6 draw calls, one per material.

## Rounds
- Round 0 and steps 3 to 7 (2026-11-11): the photograph's camera fitted to the north-west eave against the sky, the
  face's foot on the lane, the eave's far end, the vault's south corner at the end and four verticals (rms 0.87 px, its
  principal point at the photograph's centre); the model from the LiDAR, the faces the photograph sees through the
  camera (estimated): the red ground storey to 38.0 m, the glazing with mullions every 1.53 m, floor bands at 42.0 and
  47.0 m and seven coloured panels, the end's grey bay with a door to each balcony and the windows north of it, the two
  balconies with bowed fronts, the outside stair's four flights, its landings and three posts. The door at a blue door in
  the north-west face (33.1 m; no record of the entrance), `Y` and the thresholds moved with it. The light: the sun to
  the west-north-west (290 deg, 50 up), exposure 0.75. 1,316 triangles, 6 draw calls; silhouette IoU 0.925 (0.928 in the
  model's box); top view: footprint IoU 0.930, 98% of 4,035 cells within 0.5 m, block 433 97.4% under the model.
- Step 8 (2026-11-11): on the site; the glazing's glass 1 cm short of the mullions' ends, where the landmark tests'
  faces check found its top and foot in one plane with theirs.

## Rules
- Measure, don't guess: every size from the LiDAR, or named estimated in the config's `estimated` and here.
- No two faces of different materials face the same way in one plane (the landmark tests' faces check).
- Nothing of the photographs goes into git.
