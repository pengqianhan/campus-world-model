# Engineering contract (read before writing code)

The Thomas Building Extension (building 110N of the University of Auckland's campus map) drawn in
three.js from code alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js through the
import map of the shared viewer, `../pipeline/viewer/index.html`. No external 3D models or image
textures: every mesh and texture is generated in code. Photographs are **references only**; nothing is
traced or sampled from them into the model.

## Frame and sizes
- View frame, metres: **x** south-east (the frame's `-axis`, toward the road and the panoramas), **y** up
  from the frame's ground (34.6 m NZVD2016), **z** south-west (`toStreet`, toward the link and the Thomas
  Building, 110); the frame's centre at x = z = 0. `config/thomas-building-extension.json`, `frame`: the
  axis is the bearing of most of the walls; a curved building has no one street face, and the walls give
  z either toward 110 or toward the trees on the north-east.
- The building's own returns only: `building.outline` is campus.json's with the link's end moved back
  to where it meets 110 (its `outline_note`), within 1.0 m.
- What the LiDAR shows, in this frame (`parts/common.js` holds the numbers and says where each came
  from):
  - **the main block**: a flat south-east face (x 19.4, z 7.5 to 14.9), a curve from there round the
    east and north to z -21, a diagonal north-west face, a north-west wall at x -18.5, and the
    south-west walls either side of the link (z 14.8 and 15.1); walls to the eave at 15.8 m; not the
    small block campus.json adds at the north-west corner, where the LiDAR has a tree and no roof;
  - **the main roof**: a pale metal roof rising from its edge (16.3 m) 0.094 m a metre inward, to
    16.3-17.5 m against the raised middle; past the diagonal face and the north-west wall it overhangs
    0.6-0.7 m;
  - **the raised middle**: x -11.6 to 7.8, z -4.3 to 13.3, its flat roof at 19.86 m; on it a screen
    to 22.70 m (the highest point) and a plant unit to 21.21 m;
  - **the link** to 110: x -13.4 to 7.4, z 14.8 to 20.4, its glazed roof at 17.04 m;
  - **the ground**: -0.33 to +1.48 round the building, -1.40 at the lowest within 3 m; walls go down to
    `FOOT` (-1.6 m).

## Ownership
- `parts/body.js` (the main block's walls, the curtain wall, the base and the fascia), `parts/roof.js`
  (the main roof, the raised middle, the plant), `parts/link.js` (the link), `parts/shapes.js` (shared
  helpers: one owner per round, named in the brief). `model.js` and `parts/common.js` are the lead's.
- `landmarks/kit/` and `landmarks/pipeline/` are shared by every landmark: add, with defaults, and show
  the other landmarks' pictures unchanged (`?quality=low` and `?mask=1`, or byte-identical stage outputs).

## Budget (tier 2: the site runs in a browser, phones too)
- Whole building ≤ 100k triangles and ≤ 10 draw calls (merged by material). Build time of a part
  ≤ ~300 ms on this machine (the console logs it).
- Street View: ≤ 1,200 tiles for this building; 286 bought (2026-10-27, two panoramas), none since.

## References
- Two Google panoramas of 2024-08 on the road to the south-east (`streetview.pano_ids`), 33 and 31 m from
  the frame's centre: `oWaF…` sees the flat south-east face and the curve, `MOQA…` the curve nearer
  square. Their metadata's `copyright` reads "From the Owner, Photo by: Google", as every landmark's
  on the site does. A University banner hangs on the south-east face: not part of the model.
- Their cameras are fixed from the photographs' own edges against the LiDAR (`streetview.camera_fixes`,
  its note: position, pitch, yaw and the photograph's roll in its cut), and `refine.keep_fixes` keeps
  them there. Measure through them onto the walls' planes; where the two disagree (the base's doors, by
  0.4-1.3 m along the wall), trust the one that sees the feature nearer square and say so.
- No photograph shows the curve round the north (from 25.1 m along it: `MEASURED.faces.seen`), the north-west,
  the north or the roofs: draw them plainly at the LiDAR's sizes.

## Rules
- Measure, don't guess: a size comes from the LiDAR, the outline or a photograph through its fixed
  camera; say which in a comment, and say "estimated" where neither shows it.
- Real or absent: what no photograph shows is plain wall, not invented windows.
- No people, no cars, no banner: they are in the photographs, not in the model.
