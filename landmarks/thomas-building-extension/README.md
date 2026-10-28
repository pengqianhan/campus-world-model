# Landmark: the Thomas Building Extension, drawn from code

The Thomas Building Extension (building 110N of the University of Auckland's campus map), a curved
building with a glass curtain wall over a rendered base, joined by a glazed link to the Thomas Building
(110), drawn in three.js from code alone and sized by the LINZ 2024 LiDAR, checked against two Street
View photographs of its face to the road (October 2026). The kit it is built with, the pipeline, the
viewer and how to run them are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=thomas-building-extension&view=orbit`
  with the repository root served on port 8765. The site does not draw it yet (`site` is false).
- Run its pipeline: `landmarks/pipeline/run.sh thomas-building-extension [stage ...]`.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/thomas-building-extension.json`, `frame`: x toward the road on the south-east (the axis, the
bearing of most of the walls, points north-west and x is minus it); y up from 34.6 m NZVD2016; z toward
the link and the Thomas Building on the south-west; the centre of the building's roof returns at
x = z = 0. A curved building has no one street face, and its walls give z either toward 110 or toward
the trees on the north-east.

The points the frame is measured from are the building's own: campus.json's outlines of 110N and 110
overlap by 0.6 to 1.0 m where the link meets 110, and within 1.5 m of 110N's outline the first data run
took 343 of 110's returns (its roof beyond the join, its parapet and wall beside the link), which pulled
the centre 0.78 m toward 110. `building.outline` ends the link at the join instead (`outline_note`), and
`campus_outline` keeps the map's ring.

## References

Two Google panoramas of August 2024 on the road to the south-east, bought on 2026-10-27 (286 tiles, none
since): `oWaF…`, which sees the flat south-east face and the curve, and `MOQA…`, which sees the curve
nearer square. Their metadata's `copyright` reads "From the Owner, Photo by: Google", as every
landmark's on the site does (the panoramas that people upload name them there instead). A University
banner hangs on the south-east face in both: it is not part of the model.

## Round 0 (October 2026, the lead)

The massing from the LiDAR: the main block's plan, its walls fitted to their returns and its curve
traced from the roof's edge; walls to the eave at 15.8 m; a pale metal roof rising from its edge
(16.3 m) 0.094 m a metre inward to the raised middle, a flat-roofed box at 19.86 m with plant on it; the
glazed link to 110 at 17.04 m. The curtain wall's foot estimated at 5.6 m.

## Limits

- What no photograph shows is plain: the north-west, the north, the diagonal face and the roofs.
- The University banner on the south-east face is not drawn, nor the creeper on the base.
