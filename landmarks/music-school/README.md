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

Its camera is set in `streetview.camera_fixes` (`camera_fixes_note`), never the recorded one: its pitch and
roll fitted to the photograph's own edges in the wide view, the parapet's treads against the sky, each a
level line at its height on the parapet's face (the long top at the LiDAR's 8.3 m and three treads below it
in equal rises to the LiDAR's 6.74); the views cut again level by the roll. Level lines on one face cannot
tell the yaw from the roll, nor place the camera along the face: the yaw is held at the recorded heading,
and x is set where the risers the photograph shows best fit the LiDAR's returns on the parapet's top.

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

## Round 1 (November 2026, one builder)

Each change measured in the LiDAR or in the photograph through its fitted camera, every size in
`parts/common.js` with its source:

- **The camera** (above): pitch -1.12°, roll +2.27°, the recorded heading, z 27.32 (0.38 m nearer the face
  than recorded), x 18.96 (0.40 m toward -x): 0.7 px rms over 318 points on the first cut, and on the views
  cut again level, pitch -0.02° and roll +0.02° more, 0.3 to 0.9 px on the three upper treads. The refine
  stage keeps it (`refine.keep_fixes`); it would move it 0.69 m toward the face, 0.50 m up and 0.75° down, for an IoU
  of 0.893 where it starts at 0.881. Through it the auditorium's ochre wall's top against the sky reads 7.98 to 8.41 m along
  x -17.7 to -8.5, where the cone gives 7.92 to 8.46.
- **The parapet's steps**: from x 15 the photograph shows three risers against the sky, four levels in equal
  rises of 0.39 m from 6.74 to 8.3, and through the camera puts the risers at x 15.88, 16.64 and 17.44
  (round 0 drew the LiDAR's five levels in 0.5 m bins, 7.07 to 7.99). The first riser of the four, from
  6.74, stands before Te Pūtahi Tangata in the photograph, and the three lower steps, from 5.52, before the
  ivy and that building: they keep the LiDAR's bins, in equal rises (estimated where they begin, to about
  0.25 m).
- **The canopy's lower edge**, where the white sheet meets the shaded wall under it: 2.69 m on its outer edge
  (z 18.4), the same row in every column of the wide view from u 1100 to 1450; round 0 carried its curve on to
  2.9 m. Its top now runs 0.1 m into the wall it meets.
- **The walls in white paint** (the kit's `paint`): through round 0's camera, changing nothing else, the
  luma's median read 244-245 against the photograph's 245-248, where `render` read 220-223 (through the
  fixed camera, below: 244-245 against 247-248). The auditorium keeps `trim`, the ochre of its wall. The
  walls no photograph shows take the same paint (estimated).
- **The roofs south and west of the courtyard**, each the lowest of a few planes fitted together to its
  region's cells: the south range a gable along x hipped at its west end (ridge 9.65 m at z -14; 91% of its
  cells within 0.5 m, 86% as round 0's gable), the south-east part a gable along z (ridge near x -11, 10.1 to
  10.4 m; 88%, 70% before), its south boundary moved to where the auditorium's cone ends (z -3.5 west of
  x -11); the low link at the courtyard's east corner, flat at 5.02 m, which round 0 left out; the stack on
  the south-east part's ridge, 33 returns above 14 m, drawn to their median, 15.14 m (its highest return
  16.28 m); the north wing carried to the edge of its returns on its north-west side; and the slit 0.4 m
  wide that round 0 left between the north wing and the south range closed.
- **Not drawn**: the 102 building returns 11-14 m high along the north-west block's outer edge, which stand
  among 139 returns of high vegetation (the trees by the road); the west corner's glazed roof in panes; the
  ochre wall's window, which `qru8…` sees at 16-19° to the wall, too slant to place (through the camera,
  on the plane of the LiDAR's eave at z 16.4, it spans x -15.0 to -11.1 and y 3.4 to 7.0, but each 0.1 m that
  the wall stands behind its eave moves it 0.3 m along it); the ivy, the cars, the crane and the
  neighbours.

Against the photograph (`run.sh music-school refine compare topview`): IoU in the box 0.937, 0.840 and 0.964
over the wide, upper and door views, a mean of 0.914 (sky in the box 0.517, 0.320 and 0.059: in the door
view the face fills the box, so a plain block scores as high; the strips show the steps and the canopy
landing on the photograph's). The luma's median 245, 244 and 244 against 248, 248 and 247. Heights against
the LiDAR: the parapet's top 8.3 (its returns 8.26-8.45), the north wing's roof 5.16 (the median of its
returns 5.16), the auditorium's apex 12.53 (its returns within 1 m: p90 12.55, highest 12.57), the south
range's ridge 9.65 (9.67 at x 5), the south-east part's 10.24 (10.15 at x -11, z -7), the north-west block
10.27 (10.20 at x 22, z -9.5), the west corner 13.27 (13.62 at its corner). From above: footprint IoU 0.935,
88% of cells within 0.5 m, the highest point 15.14 against 15.39 (p99.9), 80.7% of block 250 and 12.0% of
block 202 under the model. 692 triangles in 4 meshes (`paint`, `trim`, `roofGrey`, `roofPale`).

Still different: the ochre wall's two corners land 10 px (its corner at x -8.2) and 20 px (its west end at
x -18.2) off the photograph's, which put them at x -7.4 and -16.0 on the LiDAR's eave line (z 16.4): its
walls likely stand behind its eaves, which the LiDAR's roof returns trace. The shadow the viewer's default
light casts under the canopy is broader and darker than the photograph's.
