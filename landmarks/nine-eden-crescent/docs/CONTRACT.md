# Engineering contract (read before writing code)

9 Eden Crescent (building 801 of the University of Auckland's campus map) drawn in three.js from code
alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js through the import map of the
shared viewer, `../pipeline/viewer/index.html`. No external 3D models or image textures: every mesh
and texture is generated in code. Photographs are **references only**; nothing is traced or sampled
from them into the model.

## Frame and sizes
- View frame, metres: **x** along the building, its street end toward -x where it meets Eden
  Crescent (the frame's axis points at bearing 44.5° and x is minus it, so the street end faces
  north-east), **y** up from 17.6 m NZVD2016 (the LiDAR ground's median round the building, and the
  ground at the door: x -18.8, z 10.4, the foot of the street end's north-west corner, 17.54 m),
  **z** across it, +z to the right as seen from the street; the middle of its roof at x = z = 0.
  `config/nine-eden-crescent.json`, `frame`: the axis is the bearing of most of the walls.
- What the LiDAR shows, in this frame (`data/nine-eden-crescent_plan_frame.png`,
  `_front_elevation.png`, and the building points of `_pts.npy` in 0.5 m bands):
  - **the block** (x -18.3 to 21.3, z -9.4 to 10.9): a flat roof at 14.0 m with a parapet to 14.2 m;
  - **the street end** (x -18.3): its top at 14.7-14.9 m from z -5.5 to the north-west edge, falling
    to 12.8 m at the south-east corner, a raked corner;
  - **the south-east side**: the top storey stands back behind a terrace, whose roof is at 10.45 m
    from the side wall to z -6.4 (-6.0 in the last 7 m), with a parapet at 11.1-11.3 m along its edge;
  - **on the roof**: a plant room at x 2.2 to 11.2, z 5.1 to 10.6 (15.6 m, its taller part 16.6 m)
    and two low units at about 15.0 m;
  - the ground: -0.04 m at the street end's north-west corner, falling to -1.0 m at its south-east
    corner along Eden Crescent, rising to +4.3 m at the far end. Walls go down to `FOOT` (-1.3 m).
- The street end's openings come from the photographs, measured on its plane from `v8ia…`'s camera as
  `streetview.camera_fixes` puts it, and checked on `mdk1…`'s (`parts/common.js`, "street").
- `parts/common.js` holds these sizes, with where each was measured.

## Ownership
- `parts/block.js` (the block, the terrace, the roof and its plant, the street end), `parts/shapes.js`
  (shared helpers: a wall with ribbon windows cut through it, a wall facing any way). `model.js` and
  `parts/common.js` are the lead's: read them; a size an agent measures goes to the lead.
- `landmarks/kit/` and `landmarks/pipeline/` are shared by every landmark: add options with defaults,
  and show the other landmarks' outputs unchanged. For this building the pipeline gained
  `sky_mask.pale_tint` (white walls in open shade are not sky) and the metrics the IoU inside the
  model's own screen box; the kit is unchanged.

## Budget (the limits of tier 1: the site runs in a browser, phones too)
- Whole building ≤ 150k triangles and ≤ 12 draw calls (merged by material): 1,548 triangles in 6
  meshes (round 2). Build time of a part ≤ ~300 ms (11 ms).
- Generated textures: none of its own; it uses the kit's materials (`paint`, `roofGrey`, `glassPale`,
  `glass`, `iron`, `void`).
- Street View: 429 tiles, bought 2026-10-27; buy no more for it without the maintainer.

## References
- Three Google panoramas of 2024-08 on Eden Crescent, about 12 m off the street end
  (`streetview.pano_ids`): `v8ia…` square on, `mdk1…` from the north-west, `MH15…` from the
  south-east. Each sees the whole street end; the neighbours either side and the 70 m tower behind
  stand in their wide views.
- No photograph shows the long sides, the far end or the roof.

## Rules
- Measure, don't guess: a size comes from the LiDAR, the outline or a photograph against them; say
  which in a comment.
- Real or absent: what no photograph shows is plain white wall or, on the roof, plain grey boxes at
  the LiDAR's sizes; no invented windows.
- No people, no cars, no signs: they are in the photographs, not in the model.
