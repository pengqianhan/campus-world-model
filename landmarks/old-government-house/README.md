# Landmark: Old Government House, drawn from code

Old Government House (building 102 of the University of Auckland's campus map), drawn in three.js
from code alone and sized by the LINZ 2024 LiDAR, by a lead agent and teams of agents (October
2026). It stands among large trees in its grounds, so no photograph shows it whole: its shape is
checked against the LiDAR from above (`landmarks/README.md`, "Metrics"), and the two Street View
photographs that see part of it are used for what its surfaces look like. The kit it is built with,
the pipeline, the viewer and how to run them are shared by every landmark:
[`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=old-government-house&view=orbit`
  with the repository root served on port 8765. On the site it stands in place of building 102's
  block (its config says `"site": true`).
- Run its pipeline: `landmarks/pipeline/run.sh old-government-house [stage ...]`; the check from
  above is the `topview` stage.
- The rules the agents worked to: [`docs/CONTRACT.md`](docs/CONTRACT.md) and
  [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

| File | What it is |
| --- | --- |
| `model.js` | assembles the parts: `main`, `chimneys`, `back`, `bay`, `porch` |
| `parts/` | one file per part (`main.js`: the front range, the middle bay, the end wings and the chimneys; `bay.js`: the balcony bays, the low south-east range and the porch; `back.js`: the ranges round the courtyard behind), `front_kit.js` (sash windows, balustrades and roofs that `main.js` and `bay.js` share), and `common.js` (the sizes measured in the LiDAR) |
| `config/old-government-house.json` | the building (102), the LiDAR and aerial tiles, the frame, the ground and the door, the two Street View panoramas, the viewer's light |
| `placement.json` | where it stands on the campus map (written by the `place` stage) |

## The frame

- View frame: x to the right as seen from the lawn on the north-east, y up from the ground at the
  foot of the porch (37.5 m NZVD2016), z toward the lawn; the centre of the main roof's high points
  at x = z = 0.
- Measured on the roofs above the eaves only (`frame.min_above` 9.5 m): with the lower ranges behind
  counted, the axis turns 10° off the garden front. Only the points inside building 102's outline,
  or within 3 m of it, count (`frame.near_outline`): another building stands in the crop box.
- In the LiDAR frame (local NZTM metres) the centre is at (127.660, 269.745) and the axis points at
  bearing 142.68° (grid), so the garden front faces 52.68°.
- On the map (`placement.json`): the centre is at (122.650, 272.089), x runs at 321.62° and z at
  51.62° (true). The door, at the foot of the porch steps, is at (133.92, 280.25).
- Seen from above (0.5 m grid, cells above 2.5 m, 2026-10-22), the model covers 92.2% of building
  102's block and under 0.5% of any other block within 80 m, so it stands in place of 102 alone.

## References

Of the 30 Google panoramas within 120 m, only two (2025-05, from the campus road 72 and 82 m beyond
the south-east end) see the building, through trees; they were found with a low-resolution look at
all 30 (zoom 3, 180 tiles) before 96 tiles were bought for the two. User-contributed panoramas are
not used. The sun stands in one of them, so the viewer's light for this building is the
photographs' (config `light`: bearing 335°, 33° up). Their cameras could not be refined: trees hide
three quarters of the outline round the model.

## Round 1 (October 2026)

From above, against the LiDAR: footprint IoU 0.935, model minus LiDAR heights p10/p50/p90
−0.24/0.02/0.24 m, 92% of cells within 0.5 m, highest point 14.2 m (LiDAR 14.11 m). 30,151
triangles in 6 materials. Three agents: front (the main block, chimneys, balcony bays, porch), back
(the ranges behind, from the LiDAR alone) and look (painted weatherboards, trim and a pale roof in
shaders, and the photographs' light).

## Round 2 (October 2026)

From above: footprint IoU 0.954, heights p10/p50/p90 −0.21/0.02/0.21 m, 95% of cells within 0.5 m,
highest point 14.2 m (LiDAR 14.11 m); the model covers 93.4% of building 102's block. 33,854
triangles in 6 materials (`boards`, `trim`, `paint`, `glassPale`, `roofPale`, `void`), each part
built in 10 ms or less. What the photograph shows of the south-east end is now drawn: the balcony's
vase balusters and ochre pedestals, the fire-escape stair, the south-east wing's two tiers of windows,
paired eave brackets and ochre soffits, and the pediments over the garden front's upper windows. The
ranges behind gained fascias, gutters, downpipes and plain windows on the faces round the courtyard.
The light now has a sunlit lawn below the horizon, and the sashes a paler glass: measured surface by
surface, the shaded boards match the photograph (177 against 177), the windows are close (100 against
117), and the eave soffits match (136 against 132–139). The building region's luma over a whole
view cannot be compared: the photographs' region is mostly trees.
