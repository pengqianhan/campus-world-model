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

110N is a landmark of its own (`thomas-building-extension`, on the site since #122). Its glazed link runs from
110N's south-west wall to this building's north-east end: in the LiDAR its roof (16.7-17.2 m above 110N's
ground of 34.6 m, 51.3-51.8 m NZVD) runs over 110's north-east parapet (15.13 m above 36.17, 51.30 m
NZVD) and ends at u 29.5-29.9 of this model's axes, v -4.6 to 16.4, where 110's gutter begins. The link
is 110N's, as its config says: neither this model nor this building's selection of points takes any of
it. This model draws 110's end wall and parapet under the link; 110N's model draws the link over them.
From the link to the east corner (v 16.4 to 21.78) the end is the face to the road's treatment carried
round the corner, as `oWaF…` shows it: the bands over windows set back behind them.

## References

`S_C8…` (Google, 2024-08), on the road 17 m out from the face to the road, sees that face whole; its 143
tiles were bought for this building on 2026-10-28, through the ledger. `oWaF…` (2024-08), bought for 110N,
sees the north-east end and the east corner at a slant; the half of its views toward the face to the road
needs tiles never bought and is black, which the sky masks ignore. 110N's other panorama, `MOQA…`, sees
110 almost only behind 110N and is not pinned. Their metadata's `copyright` reads "From the Owner, Photo
by: Google".

Both cameras are set in `streetview.camera_fixes` (`camera_fixes_note`), never the recorded ones: `S_C8…`'s
fitted to its photograph's four horizontal edges against the LiDAR's ledges, `oWaF…`'s place and heading
where 110N's round 1 fitted them to that panorama's edges, moved into this frame (its pitch and roll are
not carried over). 110N's model is drawn in front of this one in the compare (`compare.occluders`): where
it hides the north-east end in `oWaF…`'s views, those pixels count in neither the IoU nor the luma.

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

## Round 1 (October-November 2026, one builder)

The face to the road (`parts/front.js`), every size in `parts/common.js`'s `FACADE` with its source,
measured through `S_C8…`'s fixed camera and checked against the LiDAR: four concrete bands flush with the
face, their tops on the LiDAR's ledges (2.38, 7.12, 11.12 and the parapet's 15.13 m) and their lower edges
at 13.35, 9.38 and 5.45 (the LiDAR's returns at the band face gather at 13.25-13.75, 9.25-9.75 and
5.25-5.75), the ground storey's band from 1.46; the windows 1.35 m behind them (no return in the window
rows from 0.8 to 2.3 m behind the face; the gutter's returns 1.33-2.94 m in), in four rows with their transoms; red
steel frames with mullions every 0.58 m, bay by bay; four piers 1.15 m wide and 12.0 m apart, flush with
the bands, from the plinth to the top band; and the treatment carried round the east corner to 110N's
link. Most panes read light grey with the blinds and fittings behind them: a seeded draw puts blinds in
about two panes in three, in half in the second row, none in the ground storey's (estimated from the
photographs' luma, not which panes); the second row's panes below its transom at 3.47 are dark, glass
with no blind. In the photographs: the piers at u 1.72 and 13.72 land on `S_C8…`'s within about 10 px and
the rows on their rows; the one at u 25.72 (at the measured spacing) lands on `oWaF…`'s within about 10 px
in its wide view but 50-70 px (about 2°) right of it in its upper and door views, which look higher and
lower through a camera whose pitch and roll are not yet fitted.

Estimated (the config's `estimated`, for the card), no photograph or return giving them: how far the frames stand out (0.12 m), the plinth's top
(0.35 m, behind the hedge), the second row's upper transom (4.45 m, read to about 0.1 m), the plain end at
the south-west (a pier's width: no photograph shows that end square), the first mullion in the bays the
camera does not see square. The other faces are round 0's massing at the LiDAR's sizes: no photograph
shows the back, the south-west end or the courtyard, and they are plain walls.

Against the photographs: IoU in the box 0.895, 1.000 and 1.000 over `S_C8…`'s wide, upper and door views
(sky in the box 0.095, 0 and 0, so a plain block scores as high: the strips show the likeness), and 0.848,
0.993 and 0.983 over `oWaF…`'s (0.672-0.675 before its camera was set and 110N drawn in front; sky in the
box 0.321 in the wide view). The luma's median within 6 of the photographs' in every view (107-108 against
107-113); in `S_C8…`'s upper view the dark panes read 64 against 59, the third row's panes 137 against
123, the bands 106 against 105, the piers 106 against 112. The concrete is the kit's cool `grey`, the
photographs' warm grey-brown (mean RGB 114/98/90 on the bands against 98/108/120 drawn). From above,
unchanged: footprint IoU 0.868, 76% of cells within 0.5 m, block 110 85.0% under the model. 10,040
triangles in 5 meshes (`grey`, `roofGrey`, `paint`, `glassPale`, `roofTile` for the red frames).
