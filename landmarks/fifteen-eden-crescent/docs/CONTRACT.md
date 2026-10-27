# Engineering contract (read before writing code)

15 Eden Crescent (building 802 of the University of Auckland's campus map) drawn in three.js from code
alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js through the import map of the shared
viewer, `../pipeline/viewer/index.html`. No external 3D models or image textures: every mesh and texture is
generated in code. Photographs are **references only**; nothing is traced or sampled from them into the
model.

## Frame and sizes
- View frame, metres: **x** north-west along Eden Crescent (the frame's `-axis`), **y** up from the
  frame's ground (17.3 m NZVD2016), **z** north-east, toward Eden Crescent (`toStreet`); the frame's centre
  at x = z = 0. `config/fifteen-eden-crescent.json`, `frame`: `street_side` "east" turns the frame to face
  the street (the screening's "west" faced away from it).
- What the LiDAR shows, in this frame, from building 802's returns within 1 m of its floor outline:
  - **the building**: building 802's floor outline (x -24.2 to 19.5, z -12.7 to 12.3), two storeys; their
    roof (round 3) a plane on each side of the top storey, rising from 7.29 m at the street face and
    7.29-7.49 m at the back to 8.14 and 8.20 m at the top storey's walls, flat at 7.3 m along the street
    from x 14.5 to the north-west end;
  - **the top storey**: down the middle, its walls at z -6.0 and 6.0 (round 0), under a curved roof from
    10.60 m at the crown to 8.81 m at its eaves (z 6.3 and -6.8), from x -21.0 to 18.6; from x 16.0 its
    crown is cut flat at 9.72 m;
  - **the north-west end**: the roofs above run to the party wall with 9 Eden Crescent (801); the strip at
    11.6-11.8 m along it and the returns to 13.7 m by the street are 801's (its terrace parapet and raked
    corner), not drawn here;
  - **the ground**: -0.85 to -1.05 m on Eden Crescent's footpath at the street face's foot (-0.55 to -1.06
    along it), -0.17 to +0.1 m behind the building and along the lane at the south-east end. Walls go
    down to `FOOT` (-1.2 m).
- `parts/common.js` holds these sizes. It is the lead's: read it, do not edit it; report a size you
  measure and the lead moves it there.

## Ownership
- `parts/body.js` (the two storeys, their roofs, their base and the street face's windows and doors),
  `parts/top.js` (the top storey), `parts/shapes.js` (shared helpers: one owner per round, named in the
  brief). `model.js` and `parts/common.js` are the lead's.
- `landmarks/kit/` is shared by every landmark: add, with defaults, and show the other landmarks'
  pictures unchanged (`?quality=low` and `?mask=1` before and after).

## Budget (tier 1: the site runs in a browser, phones too)
- Whole building ≤ 150k triangles and ≤ 12 draw calls (merged by material). Build time of a part
  ≤ ~300 ms on this machine (the console logs it).
- Street View: ≤ 2,000 tiles for this building; 132 bought (2026-10-27), with 297 more of the same three
  panoramas bought for 9 Eden Crescent (801).

## References
- Three Google panoramas of 2024-08 on Eden Crescent (`streetview.pano_ids`), bought for 801. A sight-line
  test over the LiDAR finds them seeing 802's street face: v8ia 100%, MH15 100% (and the north-west end),
  mdk1 99%. `MH15…` (29 m away) shows the whole street face: it is the reference.
- Not yet bought: FIkN (2025-05, 24 m), which sees the east, south-east and south faces whole.
- No photograph shows the back: draw it plainly at the LiDAR's sizes.

## Rules
- Measure, don't guess: a size comes from the LiDAR, the outline or a photograph against them; say which
  in a comment.
- Real or absent: what no photograph shows is plain wall, not invented windows.
- No people, no cars: they are in the photographs, not in the model.
