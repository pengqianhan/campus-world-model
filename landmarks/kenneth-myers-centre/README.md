# Landmark: the Kenneth Myers Centre, drawn from code

The Kenneth Myers Centre (building 820 of the University of Auckland's campus map, 74 Shortland Street),
a brick building whose pilasters rise past its parapet into pinnacles, with a cream coping, a corbel
table of small arches and tall blind arches along its street face, a porch with an arched cream doorway,
and a radio mast on its roof, drawn in three.js from code alone, sized by the LINZ 2024 LiDAR and, over
its west part, by the LINZ 2023 aerial photograph, and checked against one Street View photograph of its
street face (October and November 2026). The kit it is built with, the pipeline, the viewer and how to
run them are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=kenneth-myers-centre&view=orbit`
  with the repository root served on port 8765. The site draws it in place of block 820 (below, "On the
  site").
- Run its pipeline: `landmarks/pipeline/run.sh kenneth-myers-centre [stage ...]`.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/kenneth-myers-centre.json`, `frame`: x east-north-east along the street face (the axis, the
bearing of most of the walls, points west-south-west and x is minus it); y up from 25.5 m NZVD2016, the
street before the door; z south-south-east, toward Shortland Street; the mean of the building's returns
above 8 m at x = z = 0.

**The campus map's outline for 820 is about 2 m off the building.** Taken to the LiDAR's grid, it lies
about 2 m north of the building's front and back (its front edge at z 11.8 to 12.7 where the LiDAR's
wall stands at 16.2 before the porch, its back at -11.6 to -13.8 against -12.6), and adds a tail on the
west and a nub on the east over lower roofs. The outline is the University's and is not changed here:
`building.campus_outline` keeps it, and the model, drawn where the LiDAR and the aerial show the
building, stands in place of block 820, of which it covers 90.2% from above. The data stage chooses the
building's points by a ring traced from the LiDAR instead (`building.outline`, `outline_note`).

## References

One Google panorama of April 2026 on Shortland Street, `0Rjk…`, 32 m from the frame's centre, bought on
2026-10-27 (429 tiles, none since): its `wide` view sees the whole street face, `upper` the porch and the
east part's top, `door` the door and its steps. Its metadata's `copyright` reads "From the Owner, Photo
by: Google", as every landmark's on the site does. The panorama records a tilt of 5.89° and a roll of
-2.41°, which the cut does not apply, so its views stood turned 4.53° clockwise: they are cut turned
back by it, level, and the camera is set from the photograph's own edges against the LiDAR's walls, 1.12
m from where the panorama records it (`streetview.camera_fixes`, `camera_fixes_note`): fifteen points of
the east part and the porch fit at rms 9.5 px. Through it the east part's coping reads 7.95 to 8.12 m
against the LiDAR's 8.05. A construction fence, a digger, cars and a portable toilet stand in front of
the building in the photograph: what they hide is not drawn from it.

## The west part: the aerial and the photograph, not the LiDAR

Over the part west of the porch the 2024 LiDAR holds temporary works: a vertical face 3.3 m out on the
footpath, a slope back and a roof at 9 to 10 m, and only 43 to 64% of its returns there classed building,
where the rest of the building's roofs are 98 to 100%. The photograph of 2026 shows no such thing: a
brick face with a level coping and four pinnacles. The maintainer decided on 2026-11-02 that the west
part is drawn from the 2023 aerial and the photograph:

- its plan from the aerial: the street face on the line fitted to the east part's wall returns
  (z = 12.663 - 0.0688 x), which the aerial's coping edge follows to within 0.1 to 0.3 m, and the west
  wall from (-13.6, 13.6) to (-15.16, -12.6), parallel to the east wall; its four pinnacles at the
  aerial's caps, x -13.1, -9.6, -6.4 and -2.9;
- its heights from the photograph through the camera, at the aerial's plan: the coping 7.75 m (7.65 to
  7.78 along the face), the coping band's foot 7.18, the small arches 6.45 to 6.95, the blind arches
  springing at 5.2 under crowns at 5.6, the pinnacles' tips 8.78, 8.82, 8.90 and 9.30;
- its roof from the LiDAR's own returns under the temporary roof: 6.48 m (245 returns), the main roof's
  height, which the model carries on to the street face.

Round 1's range at 10 m along the street, its wing down the west side and the 10 m roof behind the
porch's western block were the works', and are gone. From above, the model is compared with a LiDAR that
still holds the works: whole, its footprint IoU is 0.884 and 59% of the cells both cover are within
0.5 m; with the west part's cells left out (x < 0 and z > 8, or x < -13.1), 0.953 and 63%.

## Rounds

- **Round 0** (October 2026, the lead): the masses and roofs from the LiDAR's returns, the walls fitted
  to its wall returns as for the Fisher Building, the mast, the ground's fall to the north and west
  (`FOOT`, -13.1 m).
- **Round 1** (October 2026, the lead alone): the camera cut level and set from the photograph's edges;
  what the street faces carry, through it: the pinnacled pilasters, the cream coping with its merlons and
  dentil course, the corbel table, the blind arches with their springers, the porch's door in its cream
  surround with three arched windows over it, and the steps. IoU in the box 0.530 / 0.908 / 1.000, luma
  129 / 118 / 115 against 138 / 121 / 122.
- **Round 2** (November 2026, the lead alone): the west part from the aerial and the photograph (above).
  IoU in the box 0.455 / 0.913 / 1.000 in the wide, upper and door views (sky in the box 0.142 / 0.057 /
  0: glass towers fill the sky round it, and the wide view's box reaches up to the mast's top, so it
  holds the towers behind, which the model does not draw), luma 124 / 118 / 114 against 126 / 121 / 122.
  The wide view's IoU in the box fell from round 1's 0.530 as the west part came down to the
  photograph's height: the towers behind it count against it.

## Heights against the LiDAR

Building returns of `data/kenneth-myers-centre_pts.npy` in the view frame; model / LiDAR (medians, with
their counts in `parts/common.js`): the main roof 6.62 / 6.59, 6.68 and 6.58 over its east, middle and
west parts; the parapet 7.9 / 8.04 on the east part's street face, 7.83 on the east side and the back;
the east part's merlons 8.05 / 8.02 to 8.07 (p90 along the face); the porch's roof 8.37 / 8.37 and its
coping 8.86 / 8.86 (its highest at x 3 to 4); the two blocks on the roof 10.06 / 10.06 and 10.03 / 10.03;
the box 7.70 / 7.70 and the lantern 9.42 / 9.42; the mast's top 39.3 / 39.29 (its highest return; the
LiDAR's p99.9 over the whole building is 38.21). Every one within 0.15 m. The east part's pinnacles'
tips come from the photograph (9.27 to 9.93 m: the LiDAR rarely hits a spire's top, and its highest
returns there are 9.04 to 9.99), and the west part's heights from the photograph (above).

## On the site (November 2026)

The model covers 90.2% of block 820 and no other block within 80 m by 0.5% or more, so `building.also`
is empty. The door is the footpath at the foot of the steps before the door, on its centre line (x 4.0,
z 17.6), where the LiDAR's ground is -0.03 m from `ground`. The site stands the model on its own ground
at the door (the 8 m elevation model), which lies from 0.03 m to 1.03 m below it along the street face
and 3.9 to 4.0 m below it along the back; the walls go down to `FOOT` (-13.1 m), the east part's
pilasters and areaway to -2.7, the west part's face and the steps to -2.0, the porch to -0.6, each below
the drawn ground under it, so no part hangs above it (`tests/landmarks.test.ts` passes).

## Limits

- One photograph sees the building, from the south-east: its west and east sides, its back and its roofs
  are drawn plainly, brick with a parapet and grey roofs.
- The west part's plan comes from an aerial photograph of 2023 at 0.125 m a pixel and its heights from
  one photograph, where the LiDAR elsewhere gives them; its pilasters' widths are read from the
  photograph's silhouettes of their shafts against the tower behind, and how far they stand out is
  estimated.
- The height of the west side's parapet (drawn as high as the west part's coping band), the steps before
  the door (drawn as round 1 read them in the door view), how far the pilasters and arcades stand out,
  the parapets' thickness and the mast's members are estimated; the config's `estimated` says so on its
  card. The mast is white: its red bands are not drawn.
- The walls go down to `FOOT` (-13.1 m) all round; in the viewer, which draws no ground here, they show
  below the street; on the site they reach below the drawn ground everywhere.
  The two renders in the README (`docs/landmarks/kenneth-myers-centre-front.jpg` and `-above.jpg`) are
  the viewer's, with a flat grey ground filled in where the mask page (`viewer/mask.html`, from the same
  camera) draws its ground plane at y = 0.
