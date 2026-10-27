# Engineering contract (read before writing code)

The Fisher Building (building 804 of the University of Auckland's campus map, 18 Waterloo Quadrant)
drawn in three.js from code alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js
through the import map of the shared viewer, `../pipeline/viewer/index.html`. No external 3D models or
image textures: every mesh and texture is generated in code. Photographs are **references only**;
nothing is traced or sampled from them into the model.

## Frame and sizes
- View frame, metres: **x** west (the frame's `-axis`), **y** up from the frame's ground (29.1 m
  NZVD2016), **z** north (`toStreet`); the mean of the tower's points above 20 m at x = z = 0.
  `config/fisher-building.json`, `frame`: the centre and the axis from the tower's points within 1.5 m
  of building 804's floor outline, the axis from the walls.
- What the LiDAR shows, in this frame (`data/fisher-building_plan_frame.png`,
  `_front_elevation.png`):
  - **the tower**: an irregular octagon about 27 m across (x -12.5 to 14.5, z -12.0 to 12.0), its flat
    roof at 32.6 m (median); building 804's floor outline in campus.json holds 95% of it;
  - **the shaft**: its south-west half (178 m2) rises to a second flat roof at 36.9 m (median, 37.4 at
    p90); its south-west faces are the tower's own;
  - **the south-west faces** (round 2): lines fitted to the wall returns between 12 and 31.5 m (rms
    0.03-0.17 m) meet at the west corner (14.3, -4.2), the slot's corner (12.49, -8.48) and the south
    corner (9.04, -11.64), where the plan's 0.6 m simplification had cut the corners; the returns stop
    0.33 and 0.52 m short of the slot's corner on either side (its recess);
  - **the storeys**: the returns within 2 m of the walls peak every 2.875 m, at 8.6, 11.5, 14.5,
    17.4, 20.3, 23.1, 26.0, 28.9 and 31.6 m: the floor bands;
  - **the ground**: +3.3 m on the south-west (the street side, the ramp), 0 to +0.4 m on the north and
    south, -2.7 to -3.1 m on the north-east and east (toward the gully). Walls go down to `FOOT`
    (-3.2 m).
  - The outline's lobe on the south-west (the entrance, x 4 to 10, z -17 to -9) is under trees: the
    LiDAR sees no roof there, and ground at +0.4 m.
  - **the ramp** (round 2, not drawn yet): through the trees the LiDAR's building returns show a deck at
    6 to 7 m west of the tower (x 16 to 19, z -9 to -3) rising to 9 to 10 m off its west corner (x 13 to
    19, z -2 to 1), over ground at 3.2 m (the car park); in MGAo's wide view they lie along the top of
    the ramp's white parapet.
- `parts/common.js` holds these sizes. It is the lead's: read it, do not edit it; report a size you
  measure and the lead moves it there.

## Ownership
- `parts/tower.js` (the tower, the shaft, their roofs and floor bands), `parts/shapes.js` (shared
  helpers: one owner per round, named in the brief). `model.js` and `parts/common.js` are the lead's.
- `landmarks/kit/` is shared by every landmark: add, with defaults, and show the other landmarks'
  pictures unchanged (`?quality=low` and `?mask=1` before and after).

## Budget (tier 1: the site runs in a browser, phones too)
- Whole building ≤ 150k triangles and ≤ 12 draw calls (merged by material). Build time of a part
  ≤ ~300 ms on this machine (the console logs it).
- Generated textures ≤ 2048², and as few as possible; the walls use the kit's `brick`.
- Street View: ≤ 2,000 tiles for this building; 286 bought (2026-10-27).

## References
- Two Google panoramas of 2026-04 on Waterloo Quadrant, west-south-west of the tower
  (`streetview.pano_ids`). A sight-line test over the LiDAR (buildings and trees, the tower's own
  footprint masked, faces turned to the camera) chose them from the 20 Google panoramas within 80 m:
  `MGAo…` (44 m) sees 70% of the south faces, 67% of the west and 54% of the south-west; `W9y5…`
  (42 m) 55% of the west. The other 18 see under 2%, behind trees and neighbours.
- `MGAo…`'s `tower` view (aimed at 19 m, 60° wide) shows the brick faces from the ramp up: it is the
  reference. `W9y5…` is mostly leaves.
- `MGAo…`'s camera is set by `streetview.camera_fixes` (round 2): fitted to its tower view's floor
  bands, corners and the canopy's edge against the LiDAR's, 1.8 m from the recorded camera, its
  photograph looking 5.56° lower than its cut says (the panorama's roll, which the cut does not
  apply). Its note says how. `W9y5…`'s is not fitted (no edge shows through the leaves).
- Not used: six panoramas that are not Google's (user-contributed).
- No photograph shows the north or east faces: draw them plainly at the LiDAR's sizes.

## Rules
- Measure, don't guess: a size comes from the LiDAR, the outline or a photograph against them; say
  which in a comment.
- Real or absent: what no photograph shows is plain brick with the floor bands, not invented windows.
- No people, no cars: they are in the photographs, not in the model.
