# Landmark: Alfred Nathan House, drawn from code

Alfred Nathan House (building 103 of the University of Auckland's campus map), drawn in three.js from
code alone and sized by the LINZ 2024 LiDAR, checked against five Street View photographs from
Princes Street and the campus path east of it (October 2026). It is two buildings in one block of the
map: the two-storey house on Princes Street, its front two canted bays and a porch under a bowed
balcony, and the four-storey block that runs 38 m behind it. The kit it is built with, the pipeline, the viewer and how to run
them are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=alfred-nathan-house&view=orbit`
  with the repository root served on port 8765. It is not on the site yet.
- Run its pipeline: `landmarks/pipeline/run.sh alfred-nathan-house [stage ...]`.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

| File | What it is |
| --- | --- |
| `model.js` | assembles the parts: `block`, `house` |
| `parts/` | `block.js` (the four-storey block: its cladding, the east end's frame and glazing, its roof and plant room, the lowest storey and steps at the east end), `house.js` (the house, its cornice and parapet, the canted bays, the porch and the bowed balcony over it), `shapes.js` (the hipped roof of four pitches, the bowed front), `common.js` (the sizes measured in the LiDAR) |
| `config/alfred-nathan-house.json` | the building (103), the LiDAR and aerial tiles, the frame, the ground and the door, the five Street View panoramas |
| `placement.json` | where it stands on the campus map (written by the `place` stage) |

## The frame

- View frame: x to the right as seen from Princes Street on the west-north-west, y up from the
  ground at the foot of the house's front steps (45.75 m NZVD2016), z toward the street; the centre
  of the block's roof at x = z = 0.
- The building is 50 m long and only its west end faces a street, so the axis is the walls' turned
  90° (`frame.axis_across`, added to `measure.py` for this building): z runs along the building, from
  the block's east end (z -20) to the house's front (z 26-30). Axis bearing 19.99° (grid); the front
  faces 289.99°.
- The centre is the mean of the building points above 11.75 m within 2 m of the outline (the
  General Library stands 5-8 m away): the block's roof, and a tree's crown over the house that the
  LiDAR classes as building, which pulls it about 1 m toward the street.
- In the LiDAR frame (local NZTM metres) the centre is at (23.908, 161.163). On the map
  (`placement.json`): the centre at (20.920, 161.593), x at 198.93° and z at 288.93° (true); the
  door at (-8.50, 171.37).

## References

Of the 53 panoramas within 120 m, the 13 Google ones within 70 m were looked at in low resolution
(zoom 3, 88 tiles); five show the building and 638 zoom-5 tiles were bought for them: 726 tiles for
this building. Three on Princes Street (2024-07, 48-49 m from the centre, 18-20 m from the house's
front) see the house's front, the block's top behind it; two on the campus path east of the block
(2025-05) see its east end and, at a slant, its long side toward the library. The others stand too
close to the east wall, behind a bus, or see the General Library and trees. User-contributed
panoramas are not used. No photograph shows the long side toward the Clock Tower whole, nor the
house's back.

## Round 0 (October 2026, one agent alone)

From the LiDAR, then from the photographs. The block: grey walls with standing seams, eaves level at
13.3 m, a hipped roof of four planes of different pitch fitted to its roof points (rms 0.21 m), the
plant room; its east end a grey frame round three bays of veiled glazing on pale bands, the storeys
taken from fF8q's photograph, and the lowest storey set back over a landing and steps. The house:
white walls, a cornice and a balustraded parapet with pedestals and finials, quoins, two canted bays
with slate tops, the porch up eight steps behind three round-headed openings, the balcony bowed over
it; the widths of the bays and the porch from vZGe's photograph. The viewer's light is the Clock
Tower's at exposure 0.74 (the house's paint at the photographs' luma).

- From above against the LiDAR: footprint IoU 0.916, heights p10/p50/p90 -0.18/0.01/0.23 m, 92% of
  cells within 0.5 m; highest point 18.55 m (LiDAR p99.9 18.73); 98.9% of block 103 under the model
  and under 0.5% of any other block. Eaves 13.3 (LiDAR 13.3-13.5), the roof's apex 16.5 (its ridge
  16.0-16.25), the house's parapet 11.45 (11.45), roof 10.25 (10.15-10.35), bays 8.9 (8.87), the
  balcony's entablature 8.75 (8.75).
- Against the photographs (`run.sh alfred-nathan-house compare`, every view on its Street View
  camera: see `refine.min_gain_note` in the config): silhouette IoU mean 0.515 over the 15 views;
  straight in front (vZGe) 0.16 wide, 0.71 upper, 0.75 door; the east end (fF8q) 0.34, 0.96, 0.94.
  The wide views are low because the General Library, the Clock Tower's ranges and the trees fill
  them and the model alone stands in them. The Street View cameras are not exact: the model stands
  a little to the side in the Princes Street views and about 0.7 m low in fF8q's. Luma p50 of the building region, photographs 133 and render 139 (mean over the views).
- On the site's drawn ground (stood at 41.48 m under the door, 4.3 m under the LiDAR's): it lies
  -0.87 to +0.01 m from the door's under the model; every material's lowest points are 1.32 m or
  more below it, so nothing floats; the block's east end, 3.35 m lower in the LiDAR, is partly under
  it on the map.
- 9,446 triangles in 8 materials (`panel`, `paint`, `glass`, `dressed`, `roofPale`, `roof`,
  `glassPale`, `timber`), built in about 20 ms.

What the next round should look at: the doors' dark red and the ground-floor windows' round-cornered
heads; the cornice's brackets; the bands' slight bow between the fins; the block's long side toward
the Clock Tower, in no photograph; the heights of the two campus-path cameras, about 1.1 m above where
their photographs put them.
