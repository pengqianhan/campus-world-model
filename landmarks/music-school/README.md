# Landmark: the Music School, drawn from code

The Music School (building 250 of the University of Auckland's campus map), a fan-shaped auditorium and
ranges of rendered walls round an open courtyard, drawn in three.js from code alone and sized by the LINZ
2024 LiDAR, checked against a Street View photograph of its face to the car park (November 2026). The kit
it is built with, the pipeline, the viewer and how to run them are shared by every landmark:
[`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=music-school&view=orbit`
  with the repository root served on port 8765. `site` is false: the site draws block 250 as before.
- Run its pipeline: `landmarks/pipeline/run.sh music-school [stage ...]`.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/music-school.json`, `frame`: x north-west, along the face to the car park (the axis, the bearing of
most of the walls, points south-east and x is minus it); y up from 32.7 m NZVD2016, the LiDAR's ground at
the foot of the face to the car park (`door`); z north-east, toward the car park and the panorama; the
centre of the roofs round the courtyard at x = z = 0. The faces run along x and z to within about 0.8°,
so the parts are drawn in the view frame itself. The screening's frame put +z to the south-west, away from
the car park; `street_side` east and the centre of all the roofs (`tower_above` 3 m) turn it round.

The points the frame is measured from are the building's own. Within 1.5 m of campus.json's ring the first
run took one return of Te Pūtahi Tangata (201), whose outline stands 0.44 m off 250's at the west corner:
`building.outline` moves that corner's vertex 0.3 m in (`outline_note`), and `campus_outline` keeps the
map's ring. The Overbridge (202), a walkway under a slatted roof along the south-east and south sides,
stands at most 2.5 m above the frame's ground, under `min_above` (3 m), so none of its returns count; the
selected returns within 0.5 m of its outline stand 3.5 to 9.5 m up, this building's walls and eaves over
it. The house east of the car park is not on the campus map and stands more than 1.5 m off.

## Neighbours on the map

- **Te Pūtahi Tangata (201)**, a block, 0.44 m from 250's outline at the west corner: the model's west
  corner keeps to 250's returns.
- **The Overbridge (202)**, a block 3.6 m tall by its floor count, along the south-east and south sides:
  the campus map's two outlines overlap, and the model covers 12.5% of block 202 there, under roofs 7.9 to
  9.7 m above 32.7 where block 202's top stands about 0.4 m above it by the LiDAR's heights. How the two
  stand on the map's own ground, each at its own, is to be checked before `site` is set.

## References

`qru8…` (Google, 2022-09), in the car park 9.3 m out from the face to the car park near its north end, sees
that face whole, from the north corner to the canopy's south-east end, and the auditorium's ochre wall
beyond it at a slant; its 143 tiles were bought for this building on 2026-11-02, through the ledger.
`2LAG…` (2022-09), which also sees this face, was not bought. Their metadata's `copyright` reads "From the
Owner, Photo by: Google".

## Round 0 (November 2026, the lead)

The massing from the LiDAR, each region of the plan fitted to its returns' medians in 0.5 m cells
(`parts/common.js`): the auditorium under a cone of facets (apex 12.50 m, falling 0.268 a metre; 92% of its
cells within 0.5 m); the north wing flat at 5.16 m (89%), the stepped parapet over its face to the car park
at the LiDAR's tops (5.52 to 8.3 m) and the curved canopy along it at the LiDAR's section; the south range
a gable along x (ridge 9.65 m; 86%), the south-east part a gable along z (ridge 10.06 m; 70%), the
north-west block and the west corner single planes (81% and 60%). FOOT -4.5 m. Walls in the kit's
`render`, the auditorium's in `trim`, the roofs in `roofGrey` and `roofPale`, the canopy in `roofPale`.

Against the photograph, its camera refined by the refine stage (dx -0.81, dy +0.50, dz -1.69 m, yaw 0.63°,
pitch 0.13°: IoU 0.834 to 0.862): silhouette IoU in the model's own screen box 0.900, 0.867 and 0.876 over the wide, upper and
door views (sky in the box 0.490, 0.245 and 0.128). The luma's median 220-223 against the photograph's
245-248: the kit's `render` is too dark and too yellow for the sunlit render. From above
(`run.sh music-school topview`): footprint IoU 0.934, 84% of cells within 0.5 m of the LiDAR's height,
the highest point 13.68 against 15.39 (p99.9), 78.5% of block 250 under the model (its outline holds the
courtyard and a garden) and 12.5% of block 202. 557 triangles in 4 meshes.
