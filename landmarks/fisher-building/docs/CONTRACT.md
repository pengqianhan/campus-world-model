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
    p90); its south-west faces are the tower's own; a parapet round its roof to 37.95 m (round 2: 83 of
    the 84 returns above 37.6 m lie within 1 m of its outline);
  - **the south-west faces** (round 2): lines fitted to the wall returns between 12 and 31.5 m (rms
    0.03-0.17 m) meet at the west corner (14.3, -4.2), the slot's corner (12.49, -8.48) and the south
    corner (9.04, -11.64), where the plan's 0.6 m simplification had cut the corners; the returns stop
    0.33 and 0.52 m short of the slot's corner on either side (its recess); round 3: 0.33 m deep, to
    0.8 m along the north-west face and 0.4 m along the south-east one, cut into both plans' corner;
  - **the storeys**: the returns within 2 m of the walls peak at 8.6, 11.5, 14.5, 17.4, 20.3, 23.1,
    26.0, 28.9 and 31.6 m (0.25 m bins), about every 2.875 m: the floor bands, one every 2.875 m from
    2.875 m, each within 0.18 m of a peak from 8.625 m up (the two lowest, under the trees, carry the
    spacing on, estimated); on the shaft the band nearest its top
    is at 33.75 m (round 3: its returns peak at 33.5-34.0 m, and MGAo's tower view through the fitted
    camera puts it at 33.7-34.0 m), not at a storey's 34.5 m: the top storey is not taller;
  - **the ground**: +3.3 m on the south-west (the street side, the ramp), 0 to +0.4 m on the north and
    south, -2.7 to -3.1 m on the north-east and east (toward the gully). Walls go down to `FOOT`
    (-3.2 m).
  - The outline's lobe on the south-west (the entrance, x 4 to 10, z -17 to -9) is under trees: the
    LiDAR sees no roof there, and ground at +0.4 m. So is the part of the outline west and north-west
    of the tower round the door, north of the canopy (about x 9 to 18, z -1 to 7): trees, and building
    returns only along the canopy's north edge.
  - **the ramp** (round 2; drawn in round 3): through the trees the LiDAR's building returns show a deck
    at 5.9 m west of the tower (x 15 to 18.5, z -8.5 to -3.4) over ground at 3.2 m (the car park). Its
    side along the street runs on the line of the planter's flat returns at 6.6-6.85 m, from (18.0, -2.2)
    to (25.5, -14.5), where the ground has risen to it (5.65 m); its grey face, top 6.22 m and foot
    4.66 m over the car park, is MGAo's door and upper views through the fitted camera on that line.
    Round 4: from its corner 4 on, where its foot is the LiDAR's ground (5.24 and 5.65 m), it stands on
    the pavement and goes on down to `FOOT` (`rampFoot`), as the walls do, so that it meets the map's
    ground, 2.3 to 2.4 m over the door's there; `model.js` names both parts in `STANDS` for the foot
    check, and the compare draws `rampFoot` as the ground (`compare.underground`).
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
  `MGAo…` (its recorded camera 38.3 m from the frame's centre) sees 70% of the south faces, 67% of the
  west and 54% of the south-west; `W9y5…` (36.2 m) 55% of the west. The other 18 see under 2%,
  behind trees and neighbours.
- `MGAo…`'s `tower` view (aimed at 19 m, 60° wide) shows the brick faces from the ramp up: it is the
  reference. `W9y5…` is mostly leaves.
- `MGAo…`'s camera is set by `streetview.camera_fixes` (round 2): fitted to its tower view's floor
  bands, corners and the canopy's edge against the LiDAR's, 1.8 m from the recorded camera, its
  photograph looking 5.56° lower than its cut says. The panorama's roll, which the cut does not
  apply, gives 3.9° of that at the view's heading (4.2° at most with its tilt); the other 1.4 to 1.6°
  is fitted, not explained by the recorded orientation. Its note says how. `W9y5…`'s (round 3) keeps
  its recorded position, which no edge through the leaves can fit, and takes a pitch only, fitted to the canopy's red eave in its tower, upper and door
  views against the LiDAR's canopy roof: its photograph looks 6.41° lower than its cut says (its
  panorama's roll, -5.71° at 87° off the car's heading, gives 5.70° of it; the other 0.7° is fitted).
- Not used: six panoramas that are not Google's (user-contributed).
- No photograph shows the faces turned north, east and south-east (both cameras stand behind them),
  the lower part's north face (the tower plan's edge 10) among them: draw them plainly at the LiDAR's
  sizes. The lower part's edge 11 is seen edge-on in `MGAo…`'s tower view, a pale strip.

## Rules
- Measure, don't guess: a size comes from the LiDAR, the outline or a photograph against them; say
  which in a comment.
- Real or absent: what no photograph shows is plain brick with the floor bands, not invented windows.
- No people, no cars: they are in the photographs, not in the model.
