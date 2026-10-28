# Landmark: the Thomas Building, drawn from code

The Thomas Building (building 110 of the University of Auckland's campus map), four storeys of
board-marked concrete and red-framed window bands round a courtyard, drawn in three.js from code alone
and sized by the LINZ 2024 LiDAR, checked against Street View photographs of its face to the road
(October 2026). The kit it is built with, the pipeline, the viewer and how to run them are shared by
every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=thomas-building&view=orbit`
  with the repository root served on port 8765. `site` is false: the site draws block 110 as before.
- Run its pipeline: `landmarks/pipeline/run.sh thomas-building [stage ...]`.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/thomas-building.json`, `frame`: x north-east, along the road (the axis, the bearing of most of
the walls, points south-west and x is minus it); y up from 36.17 m NZVD2016, the LiDAR's ground at the
foot of the face to the road (`door`); z south-east, toward the road and the panoramas; the centre of
the roofs round the courtyard at x = z = 0. The long faces run 1.04° off x, so the parts are drawn in
the building's own axes and `model.js` turns them.

The points the frame is measured from are the building's own. Within 1.5 m of campus.json's ring (the
face to the road stands 0.9-1.3 m outside it) the first run took the returns of three neighbours: 341 of
the Thomas Building Extension's glazed link, 25 of Lippincott Cottage (118) at the west corner and 41 of
the Overbridge (129), which lands on the round stair at the south-west end. `building.outline` trims
the ring at each (`outline_note`), and `campus_outline` keeps the map's ring.

## Where it meets the Thomas Building Extension (110N)

110N is a landmark of its own (`thomas-building-extension`, on its own branch). Its glazed link runs from
110N's south-west wall to this building's north-east end: in the LiDAR its roof (16.7-17.2 m above 110N's
ground of 34.6 m, 51.3-51.8 m NZVD) runs over 110's north-east parapet (15.13 m above 36.17, 51.30 m
NZVD) and ends at u 29.5-29.9 of this model's axes, v -4.6 to 16.4, where 110's gutter begins. The link
is 110N's, as its config says: neither this model nor this building's selection of points takes any of
it. This model draws 110's end wall and parapet under the link; 110N's model draws the link over them.

## References

`S_C8…` (Google, 2024-08), on the road 17 m out from the face to the road, sees that face whole; its 143
tiles were bought for this building on 2026-10-28, through the ledger. `oWaF…` (2024-08), bought for 110N,
sees the north-east end and the east corner at a slant; the half of its views toward the face to the road
needs tiles never bought and is black, which the sky masks ignore. 110N's other panorama, `MOQA…`, sees
110 almost only behind 110N and is not pinned. Their metadata's `copyright` reads "From the Owner, Photo
by: Google".

## Round 0 (October 2026, the lead)

The massing from the LiDAR: the four ranges round the courtyard, their outer faces and the courtyard's
walls fitted to the edges of their parapets' tops; walls to a gutter at 14.26 m behind broad parapets
15.13 m high; over each range a storey set back from the gutter under roofs fitted to the sections'
medians (a ridge at 19.23 m over the back range, sawtooths over the range to the road and the
south-west range, two slopes and a valley over the north-east range); the plant room at the east corner
to 23.46 m; the round stair at the south-west end to 16.6 m and the flue beside it to 25.7 m. FOOT
-2.0 m. All in the kit's `grey`, the roofs in `roofGrey`.

Against the photographs, recorded cameras (`oWaF…`'s search ran to its bounds and was not applied):
silhouette IoU in the model's own screen box 0.881, 1.000 and 1.000 over `S_C8…`'s wide, upper and door
views (sky in the box 0.086, 0 and 0: the face fills the box, so a plain block scores as high) and
0.672, 0.992 and 0.981 over `oWaF…`'s. From above (`run.sh thomas-building topview`): footprint IoU 0.868
against the LiDAR (whose footprint counts the courtyard's scattered returns), 76% of cells within 0.5 m
of its height, the highest point 25.7 against 25.0 (p99.9), 85.0% of block 110 under the model and 1.8% of
block 110N (where the two campus outlines overlap). 560 triangles in 3 meshes.
