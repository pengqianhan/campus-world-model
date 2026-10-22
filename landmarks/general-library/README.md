# Landmark: the General Library, drawn from code

The General Library (building 109 of the University of Auckland's campus map), on Alfred Street, drawn
in three.js from code alone and sized by the LINZ 2024 LiDAR, checked against twelve Street View
photographs (October 2026). The kit it is built with, the pipeline, the viewer and how to run them are
shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=general-library&view=orbit`
  with the repository root served on port 8765. It is not on the site.
- Run its pipeline: `landmarks/pipeline/run.sh general-library [stage ...]`.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

| File | What it is |
| --- | --- |
| `model.js` | assembles the parts: `slab`, `core`, `podium`, `canopy` |
| `parts/` | `slab.js` (the tower slab, its core and stair tower), `podium.js` (the podium, its fin screens, the canopy), `facade.js` (ribbon windows and glazing on any face), `common.js` (the sizes measured in the LiDAR) |
| `config/general-library.json` | the building (109), the LiDAR and aerial tiles, the frame, the ground and the door, the twelve Street View panoramas, the viewer's light |
| `placement.json` | where it stands on the campus map (written by the `place` stage); not on the site |

## The frame

- View frame: x to the right as seen from Alfred Street on the south-west, y up from the ground at the
  main entrance in the middle of the south-east end (41.5 m NZVD2016; `door` x 30.0, z -7.0), z toward
  Alfred Street; the slab's roof centre at x = z = 0.
- The centre is the mean of the building points higher than 26.5 m: the slab's roof and the core and
  plant on it. The axis is that of the walls (`frame.axis_from: "walls"`), bearing 311.83° (grid); the
  front faces 221.83°. The slab itself is turned 1.9° from the podium's walls, and is drawn so
  (`SLAB_TURN` in `parts/common.js`).
- In the LiDAR frame (local NZTM metres) the centre is at (24.550, 109.301). On the map
  (`placement.json`): the centre at (22.524, 109.747), x at 130.77° and z at 220.77° (true); the door at
  (49.82, 95.46).
- The site falls about 5 m: from 45.6 m on Princes Street's side to 40.6 m at the north-east corner;
  Alfred Street in front of the building is 43.3-44.8 m. The frame's thresholds are above the door's
  ground (they were set first above 44.0 m, then raised by 2.5 m with it, so the frame did not move).

## References

Within 120 m there are 63 panoramas: 50 of Google's own and 13 user-contributed (left out). The 26 of
Google's within 75 m were looked at in low resolution (zoom 3, 148 tiles, 126 of them bought); 22 show
the building. Twelve were pinned to cover each face and their zoom-5 tiles bought (a dry run counted
N = 1,650; 1,650 bought; 1,776 tiles for this building with the probe, inside the tier's 2,000). No
panorama used is indoors.

| Panoramas | Date | Where (view frame) | What they show |
| --- | --- | --- | --- |
| `B4NW…`, `MMME…`, `w8_f…`, `vbVX…` | 2022-09 | Alfred Street, in front of the slab (x 2 to 34, z 13 to 25) | the slab's ribbon windows, the stair tower, the front block's glazed end, the canopy, under plane trees |
| `CHbl…`, `v7l7…` | 2022-09 | Alfred Street, in front of the front block (x -7 and -16, z 28 and 32) | the fin screen with its crown of folded hoods on the brick plinth, the slab behind |
| `bsR6…`, `3HyL…`, `xKYw…` | 2025-05 | the south-east end (x 35 to 39) | the main entrance between dark grey piers, the curtain wall over it, the low block's end |
| `Zvdo…`, `fF8q…` | 2025-05 | behind, on the lawn (z -44 and -49) | the back wing's fin screen in full sun, over its dark ground-floor glazing |
| `Qaci…` | 2024-07 | off the north-west end (x -65, z 17) | the podium's north-west end and the slab rising behind |

Not used though they show it: `Ac3I…` (beside `bsR6…`), `-JHj…` and `uM18…` (close to the back's lower
walls), `dyTf…` and `u2Aj…` (Alfred Street further west, through trees), `FgM3…` and `e8T_…` (further
east), `EX9b…` (beside `fF8q…`), `S1Vu…` and `B-1T…` (beside `Qaci…`).

## Round 0 (October 2026, one agent alone)

A rough model from the LiDAR and the photographs: the slab with ribbon windows, its core and plant,
the stair tower; the podium's blocks with the fin screens and their crowns on Alfred Street and the
back lawn, the brick plinth, the glazed end by the stair tower, the north-west end's glazing, the
south-east end's glazed ground floor and entrance, the canopy.

- From above against the LiDAR (`topview`): footprint IoU 0.942; model minus LiDAR heights
  p10/p50/p90 -0.67/-0.03/+0.92 m, 70% of cells within 0.5 m (the podium's ribbed roof swings about
  its median, and a tree's crown over the front block is classed as building); highest point 38.8 m
  against the LiDAR's 38.78 m (p99.9); 94.1% of block 109 under the model, and under 0.5% of any other block within 80 m (`building.also` is empty).
- Against the photographs (`run.sh general-library refine compare`, 36 views, two cameras refined):
  silhouette IoU 0.793 on average; building region luma median 142 in the photographs and 150 drawn.
- On the site's drawn ground (the 8 m DEM, at the door 40.60 m against the LiDAR's 41.5): the DEM
  under the model's foot lies -0.21 to +1.00 m from the door's; the walls go down to -1.5 m, so no foot
  point stands above it (the highest is 1.29 m below).
- 9,468 triangles in 5 materials (`paint`, `glassPale`, `iron`, `roofPale`, `timber`), built in 13 ms.

What the next round should look at: the grey of the south-east end's piers and cladding and of the back
wing's plinth; a brick for the plinth; the fins' hoods (larger, each a folded plate the fins run up
into); the slab's lower floors on Alfred Street (taller glazing) and its front face's ledges (the
LiDAR has points up to 1.1 m in front of the roof's edge); the ribs of the podium's roof.
