# Contract: Fine Arts Studio Block 431

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** east-north-east (the frame's `-axis`), **y** up from the door's ground (33.09 m NZVD2016,
  under the entrance's canopy at the east end), **z** south-south-east (`toStreet`); the frame's centre at x = z = 0.
  `config/fine-arts-studio-block-431.json`, `frame`: the building's returns within 1.5 m of the campus map's ring, the
  axis along its long walls (bearing 252.6 deg).
- The building's own frame: **u** west-south-west (`-x`), along the frame's axis; the long faces lie 2.0 degrees off
  it, so across them `parts/common.js` uses **w'**, the distance from the line through w 0 at u 23.1 that runs with
  them (w = w' + 0.0355 (23.1 - u)). It gives `at` and `plan` for (u, w'), `atW` and `planW` for (u, w), and `Y`,
  which turns an elevation into a height over the door's ground.
- What the LiDAR shows (`parts/common.js` holds the numbers): a long block, its roof's edge from u -17.0 (the south
  half; the north half to -21.2) to 23.15 and from w' -7.9 to 9.0, under a roof of two pitches: the north one from
  49.9 m at its eave to 51.33 at a step over w' 0, the south one from 48.3 there to 46.6 at its eave; at the east end a
  flat block at 49.2 m, a glass stair tower at 51.65 m, a lower roof at 50.35 m north of it and the entrance's canopy
  at 36.25 m (out of the campus map's ring); on the north side an annex at 42.76 m inside the ring (its roof runs on
  east of the ring at the same height, not drawn); before the south face a low box at 36.3 m. The ground: the lane and
  its car park at 33.1 m, the garden north of the main block at 38.0.
- Walls go down to `FOOT`, 31.5 m, 1.59 m under the door's ground.

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/facade.js`, `parts/shapes.js` (106's,
  as every landmark's): the lead.

## Budget
- Tier 3 (a plain building of the measured massings, upgraded): 20k triangles, 6 draw calls, one per material.

## Rounds
- Round 0 and steps 3 to 7 (2026-11-11): the photograph's camera fitted to the south eave against the sky, its east
  corner, the low box's east corner and four verticals (rms 0.40 px, a level camera with its principal point solved);
  the model from the LiDAR, the south face through the camera (estimated): columns every 4.38 m, three rows of windows
  of three lights a bay (44.55 to 46.3 m, 39.77 to 43.43, 36.74 to 37.95), the roller doors. The door under the
  entrance's canopy (33.09 m; no record of the entrance), `Y` and the thresholds moved with it. The light: the sun to
  the south-south-east (160 deg, 50 up), exposure 0.38. 2,082 triangles, 5 draw calls; silhouette IoU 0.974 (0.977 in
  the model's box); top view: footprint IoU 0.922, 95% of 3,398 cells within 0.5 m, block 431 95.8% under the model.
- Step 8 (2026-11-11): on the site; the stair tower's floor 2 cm under the walls' foot, where the landmark tests'
  faces check found it in one plane with the east block's.

## Rules
- Measure, don't guess: every size from the LiDAR, or named estimated in the config's `estimated` and here.
- No two faces of different materials face the same way in one plane (the landmark tests' faces check).
- Nothing of the photograph goes into git.
