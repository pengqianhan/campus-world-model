# Landmark: the Music School, drawn from code

The Music School (building 250 of the University of Auckland's campus map), a fan-shaped auditorium and
ranges of rendered walls round an open courtyard, drawn in three.js from code alone and sized by the LINZ
2024 LiDAR, checked against a Street View photograph of its face to the car park (November 2026). The kit
it is built with, the pipeline, the viewer and how to run them are shared by every landmark:
[`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=music-school&view=orbit`
  with the repository root served on port 8765. `site` is true (round 2): the site draws it in
  place of block 250 ("On the site", below).
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
  the campus map's two outlines overlap, and the model covers 12.0% of block 202 there, under roofs 7.30 to
  9.15 m above 32.7 (the south range's slab's underside 7.15 at its lowest) where block 202's top stands about
  0.3 m below it by the LiDAR's heights (its ground's
  median 28.79 m, plus 3.6; the LiDAR's ground in its outline, -3.84 m, gives 0.24 m below). On the site
  each stands on the map's ground, as "On the site" below says.

## References

`qru8…` (Google, 2022-09), in the car park 9.3 m out from the face to the car park near its north end, sees
that face whole, from the north corner to the canopy's south-east end, and the auditorium's ochre wall
beyond it at a slant; its 143 tiles were bought for this building on 2026-11-02, through the ledger.
`2LAG…` (2022-09), at the face's south-east end, was bought in round 2 (143 tiles, 2026-11-02, through the
ledger) for a squarer view of the ochre wall's window; its photographs stand turned about 8° in the cut and its
camera is not fitted, so it is not pinned and nothing is measured or scored through it. Their metadata's
`copyright` reads "From the Owner, Photo by: Google".

Its camera is set in `streetview.camera_fixes` (`camera_fixes_note`), never the recorded one: its pitch and
roll fitted to the photograph's own edges in the wide view, the parapet's treads against the sky, each a
level line at its height on the parapet's face (the long top at the LiDAR's 8.3 m and three treads below it
in equal rises to the LiDAR's 6.74); the views cut again level by the roll. Level lines on one face cannot
tell the yaw from the roll, nor place the camera along the face: round 1 held the yaw at the recorded
heading and set x where the risers best fit the LiDAR's returns on the parapet's top; round 2 fits the yaw and x
to two vertical edges of known place, the ochre wall's corners on the LiDAR's wall lines.

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
- **The auditorium's walls inside its eaves.** Through the camera, the ochre wall's two corners landed 10
  px (its corner at x -8.2) and 20 px (its west end) off the photograph's, which put them at x -7.4 and -16.0
  on the eave line the LiDAR's roof returns trace (z 16.4). The LiDAR's wall returns 0.5 to 7 m up stand
  inside that line by 0.76 m on the ochre wall (169 returns, at z 15.63) and by 0.74 to 0.88 m on the three
  other outer edges that show any: the walls now stand there, under the roof's underside and a fascia
  0.2 m deep (estimated) round its eaves, and in the wide view the two corners land on the photograph's
  within a few pixels.
- **Not drawn**: the 102 building returns 11-14 m high along the north-west block's outer edge, which stand
  among 139 returns of high vegetation (the trees by the road); the west corner's glazed roof in panes; the
  ochre wall's window, which `qru8…` sees at 16-19° to the wall, too slant to place (through the camera,
  on the plane of the LiDAR's eave at z 16.4, it spans x -15.0 to -11.1 and y 3.4 to 7.0, but each 0.1 m that
  the wall stands behind its eave moves it 0.3 m along it); the ivy, the cars, the crane and the
  neighbours.

Against the photograph (`run.sh music-school refine compare topview`): IoU in the box 0.939, 0.840 and 0.964
over the wide, upper and door views, a mean of 0.914 (sky in the box 0.515, 0.320 and 0.059: in the door
view the face fills the box, so a plain block scores as high; the strips show the steps and the canopy
landing on the photograph's). The luma's median 245, 244 and 244 against 248, 248 and 247. Heights against
the LiDAR: the parapet's top 8.3 (its returns 8.26-8.45), the north wing's roof 5.16 (the median of its
returns 5.16), the auditorium's apex 12.53 (its returns within 1 m: p90 12.55, highest 12.57), the south
range's ridge 9.65 (9.67 at x 5), the south-east part's 10.24 (10.15 at x -11, z -7), the north-west block
10.27 (10.20 at x 22, z -9.5), the west corner 13.27 (13.62 at its corner). From above: footprint IoU 0.935,
88% of cells within 0.5 m, the highest point 15.14 against 15.39 (p99.9), 80.7% of block 250 and 12.0% of
block 202 under the model. 728 triangles in 4 meshes (`paint`, `trim`, `roofGrey`, `roofPale`).

Still different: the shadow the viewer's default light casts under the canopy is broader and darker than the
photograph's; the ochre wall's window is not drawn (above).

## Round 2 (November 2026, one builder)

From round 1's list, each change measured in the photograph through its fitted camera or in the LiDAR, every size
in `parts/common.js` with its source:

- **The camera's yaw and x**, from the ochre wall's two corners, vertical edges whose place the LiDAR's wall
  returns give (x -8.66 and -17.59 on z 15.64), eight points in the wide view, with the treads as before: x 19.12
  (sd 0.13) and yaw -0.22° (sd 0.08), the corners 0.6 px rms; with x held at round 1's 18.96 the yaw is -0.32°,
  and with all five free x 19.24, z 27.48, pitch -0.14°, yaw -0.40°, roll -0.37°, each within about 1.5 sd of the
  four held. The cut does not change (byte-identical pictures). Through it the risers land at x 16.09, 16.84 and
  17.64 (round 1: 15.88, 16.64, 17.44).
- **The ochre wall's window**, through that camera on the wall's plane (z 15.64): x -16.57 to -12.70, its sill's
  foot at 3.30 m, its head's top at 6.92, its transom at 5.02; four lights in two rows, as both photographs show.
  The wall's z holds to 0.1 m, which moves the window 0.2-0.45 m along it at `qru8…`'s slant of 16-19°; through the
  same camera the wall's west end lands at x -17.45, where its returns put it at -17.59. The panes are drawn on the
  wall's face; the frames' and head's sizes and how far they stand out are estimated.
- **The gutter and the downpipes**: the fascia round the auditorium's eaves in white paint, as the photographs
  show its gutter (0.2 m deep, estimated), and white downpipes at the ochre wall's two corners (their radius
  estimated). In the wide view the window, the corners and the downpipes land on the photograph's.
- **`2LAG…`**, bought for a squarer view of the window: it shows the four lights and the head (the house before
  it hides the lower row), but its photographs stand turned about 8° in the cut, its camera is not fitted, and the
  refine stage does not correct it (14% sky round the silhouette): it is not pinned. Pinned for one compare
  through its recorded camera, its views gave IoU in the box 0.738, 0.708 and 0.801 and luma medians 244 against
  231-232: the same wall reads 231-232 in its photographs and 245-248 in `qru8…`'s, a difference of exposure.
- **The west corner**: its edge toward the south range moved to where its returns rise above the range's roof
  (x 16.2-16.6, where round 1 had 15.5): 70% of its cells within 0.5 m of its plane, 60% before; the south range
  then 90% (1,419 cells). Neither two planes nor a hip of four fits the west corner better: a fifth of its returns
  fall 1 m or more below the plane, between the glazing bars of the roof the 2023 aerial shows there, which the
  model does not draw. The north-west block (81%) and the low link (42%) fit no better with more planes or a
  second level: left as they are.
- **The shadow under the canopy** is the viewer's light, not the model: left as it is.

Against the photograph (`run.sh music-school refine compare topview`, `qru8…`'s camera fixed): IoU in the box 0.940,
0.841 and 0.965 (sky in the box 0.518, 0.321 and 0.059), a mean of 0.915; the luma's median 245, 244 and 244
against 248, 248 and 247. From above: footprint IoU 0.936, 88% of cells within 0.5 m, the highest point 15.14
against 15.39 (p99.9), 80.5% of block 250 and 12.0% of block 202 under the model. 906 triangles in 5 meshes
(`paint`, `trim`, `roofGrey`, `roofPale`, `glassPale`).

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 250 (80.8% of
it under the model, where RUNBOOK A2's criterion 1 asks for 85%: of the 1,220 cells of 0.5 m of its outline
that the model leaves uncovered, 1,198 hold no building return over 3 m, the open courtyard and a garden, and
22 hold one, along the south range's south-west eave; the maintainer is asked to accept the shortfall, since
filling the courtyard would draw what is not there). `building.also` is empty: of the campus
map's blocks whose centres lie within 80 m, the model covers only block 202's, by 12.0%, where the two campus
outlines overlap. 250's entry in `landmarks/measured/exclusions.json` (its roof cells covered 77% of its
outline) has gone: the generator leaves the landmarks on the site alone; `MASSING.md` lists 250 among them
and counts 39 stand-ins measured.

- **The door** stays at (7.0, 19.0), the foot of the face to the car park, 0.6 m out from the canopy's edge,
  where the frame's ground (32.7 m; the LiDAR's 32.68) is measured. On the map the model stands on the map's
  ground there, 25.83 m (the 8 m elevation model, whose heights are not the LiDAR's).
- **The foot.** Stood as the site stands it, every part's walls go down to `FOOT` (-4.5 m), below the map's
  ground everywhere under them: under the auditorium the drawn ground lies 1.5 m below to 0.1 m below the
  door's, under the north wing 0.3 m below to 1.8 m above, under the ranges 1.1 m below to 2.5 m above, so the
  walls' foot lies 3.0 m or more below the drawn ground everywhere, and none hangs. The LiDAR's ground falls to -3.9 m along the
  south-east side, where the map's lies only about 1.5 m below the door's: the map raises the ground there
  and buries the walls deeper. The canopy, the roofs, the parapet and the window's panes stand clear of the
  ground by design. `tests/landmarks.test.ts` passes.
- **Te Pūtahi Tangata (201)** is a block 39.6 m tall by its floor count, standing on the map's ground (its
  footing's base 27.10 m, 1.27 m above the door's); no point of the model lies inside its outline, and its
  wall stands 0.44 m off 250's outline at the west corner, beside the model's west corner.
- **The Overbridge (202)** is a block 3.6 m tall by its floor count, on its footing's base (25.49 m, 0.34 m
  below the door's), its top 3.26 m above the model's door: there the map stands it about 3.5 m higher
  against the model than the LiDAR has the bridge (its slatted roof 2.0-2.5 m above 32.7 at most, its deck
  -1 to -0.5). Inside its outline the model has only its walls, from `FOOT` up through the block to the
  roofs, which stand 7.30 to 7.57 m above the door over it (the south range's, its slab's underside 7.15 at its
  lowest) and 8.56 to 9.15 m (the auditorium's eaves): the block's top lies 3.9 m or more below every roof over
  it, so nothing of
  either shows through the other there; where the block stands inside the model's walls, they hide it, and
  outside them it stands against them, as the bridge does.
- **The light form** (the map, and the walker views of the basic tier) draws the roofs (`roofGrey`,
  `roofPale`, the canopy among them) as roofs and the window's panes (`glassPale`) as panes, all in
  `LIGHT_ROLE` already; the paint and the ochre render are walls. No new material: About's words for the
  landmarks' materials (painted render, glass and metal among them) cover it.
- **Its card** says "estimated:" and the config's `estimated`. Its sizes come from the LiDAR, and the details of
  its face to the car park and the ochre wall from the photograph through a camera fitted to the LiDAR's edges:
  no `measured_by`.

## The review's fixes (November 2026)

The review of ed5461f found:

- **The courtyard eave east of x 11.4.** 67 building returns, 8.4-9.1 m high, stand past the south range's
  courtyard edge (z -7) at x 11.8-15.5, their outer edge a line from z -6.91 at x 11.5 to -4.51 at x 14.5: the
  plan follows it now, to (14.8, -4.28). Block 250 is then 80.8% under the model (80.5% before), and of the
  1,220 cells it leaves uncovered, 1,198 hold no building return over 3 m.
- **The north wing's north corner** is square at x 22.4, where its returns are (x 22.36-22.43 in every 0.25 m of
  z from 14.0 to 16.4, 4.6-8.33 m high); the parapet runs to it. Round 1 cut the corner, and the parapet's last
  step stood 0.13-0.40 m over nothing.
- **Faces that coincided** (the same plane, facing the same way, in two materials, which flicker): the ranges'
  walls ran up through their roof slabs' sides (53.6 m²), the auditorium's fascia lay on its walls on the seven
  edges where those stand at the eave line (2.7 m²), and the north wing's walls on its roof slab's side (1.6 m²);
  and smaller ones at the parapet's and the canopy's ends and in the window. Now the walls stop at the slabs'
  undersides, the fascia is drawn only on the four faces whose walls stand in, the auditorium's other walls run
  up to the roof's edge themselves, and the ends stand 1 cm apart: built in node, no two triangles of different
  materials overlap in one plane facing the same way.
- **The downpipes** run up to the soffit over each.

After the fixes (`run.sh music-school refine compare topview`): IoU in the box 0.940, 0.841 and 0.965, the luma
as before; from above footprint IoU 0.940, 88% of 5,184 cells within 0.5 m, block 250 80.8% and block 202 12.0%
under the model; 896 triangles in 5 meshes.
