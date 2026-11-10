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
- What the LiDAR shows (`parts/common.js` holds the numbers): a long block, its roof's edge from u -17.0 (and -21.2 for
  its north part, north of w' -4) to 23.15 and from w' -7.9 to 9.0, its long walls about 1.05 m in under the eave (w'
  7.95 and -6.85, where the returns on them peak), its end walls at u -16.75 to -16.25; a roof of two pitches: the north
  one from 49.9 m at its eave to 51.33 at a step over w' 0, the south one from 48.3 there to 46.6 at its eave; east of u
  -17.0 over w' -4 to 5 one roof falling to the south from 50.4 m to 48.8 (south of w' 0 from u -20.2 to -16.35); at the
  east end a stair tower at 51.45 m (u -23.25 to -19.65, w 0.35 to 3.1), a lower roof at 50.2 m north of it, and the
  entrance's canopy at 36.25 m (out of the campus map's ring); on the north side an annex at 42.76 m, its north edge
  past the ring's north side by up to 2.5 m (east of it the roof at 41.4 to 43.3 m is building 432's); before the south
  face a low box at 36.3 m, u 11.3 to 19.3. The ground: the lane and its car park at 33.1 m, the garden north of the
  main block at 38.0. That the stair tower and the canopy are glass is the photograph of the east entrance's.
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

- The review's round 1 (2026-11-11): the low box from u 11.3, where the LiDAR's returns on its roof begin (it had been
  drawn from 7.7, over ground the LiDAR sees), and the photograph's camera fitted again to that corner (rms 0.40 px, 6.9
  m further west), and through it the columns, the rows and the roller doors estimated again; the long walls where the
  LiDAR's returns on them peak (w' 7.95 and -6.85, not 0.35 m in); east of the main block one roof falling to the south
  over w' -4 to 5, where the north pitch had been drawn on with its step; the stair tower to its returns over 51 m (u
  -23.25 to -19.65, w 0.35 to 3.1, at 51.45 m) and the lower roof and the canopy to meet it; the annex's north edge to
  the LiDAR's line out to u -13.1. The light at an exposure of 0.55. 1,944 triangles, 5 draw calls; silhouette IoU 0.952
  (0.954 in the model's box), luma 144 against 150; top view: footprint IoU 0.927, 97% of 3,390 cells within 0.5 m,
  block 431 95.6% under the model.

- The review's round 2 (2026-11-11): the east end's roof south of w' 0 from u -20.2 (its returns' east edge south of the
  stair tower; the ground seen east of it) to -16.35, where its returns stop over the south pitch's, and its walls 0.35
  m in under it (an open strip had stood between that roof's edge at -17.0 and the walls' west end at -16.5); the lower
  roof north of the stair tower on to the east end's walls (u -20.85); the big roller door to the wall's end. 1,970
  triangles, 5 draw calls; silhouette IoU 0.952 (0.954 in the model's box), luma 143 against 150; top view: footprint
  IoU 0.926, 97% of 3,383 cells within 0.5 m, block 431 95.5% under the model.

## Rules
- Measure, don't guess: every size from the LiDAR, or named estimated in the config's `estimated` and here.
- No two faces of different materials face the same way in one plane (the landmark tests' faces check).
- Nothing of the photographs goes into git.
