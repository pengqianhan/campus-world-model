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
