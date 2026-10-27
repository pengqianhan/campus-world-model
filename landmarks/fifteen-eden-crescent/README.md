# Landmark: 15 Eden Crescent, drawn from code

15 Eden Crescent (building 802 of the University of Auckland's campus map), a long white building on
Eden Crescent in the city centre, next to 9 Eden Crescent (801), drawn in three.js from code alone and
sized by the LINZ 2024 LiDAR, checked against three Street View photographs of its street face (October
2026). The kit it is built with, the pipeline, the viewer and how to run them are shared by every
landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=fifteen-eden-crescent&view=orbit`
  with the repository root served on port 8765. The site draws it in place of block 802 (below, "On
  the site").
- Run its pipeline: `landmarks/pipeline/run.sh fifteen-eden-crescent [stage ...]`.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/fifteen-eden-crescent.json`, `frame`: x along Eden Crescent, toward the north-west (the axis
points south-east and x is minus it); y up from 17.3 m NZVD2016, the LiDAR's ground behind the building
and along the lane at its south-east end; z toward Eden Crescent, so that the street face looks
north-east (bearing 43.4°); the middle of the building at x = z = 0. The axis is the bearing of most of
its walls. Eden Crescent's footpath lies 0.55 to 1.06 m below y = 0 along the street face.

## References

The three Google panoramas of August 2024 on Eden Crescent that were bought for 801 next door, with 132
more of their tiles bought for this building's views on 2026-10-27 (none since). A sight-line test over the LiDAR finds each
seeing the street face whole; `MH15…`, 29 m from the middle of the building, sees it square enough to
measure its openings, the other two along it. No photograph shows the back or the ends.

The panoramas record their cameras about 1 m from where the LiDAR puts what they see, all three the same
way (801's round 1). The error is the panorama's, whatever building it looks at, so
`streetview.camera_fixes` puts each camera where 801's fit puts it, turned into this frame;
`refine.keep_fixes` keeps them there (the camera search still runs and reports what it would move). The
footpath at the street face's foot comes out at -0.9 to -0.96 m through `MH15…`'s camera and at -0.85 to
-1.05 m in the LiDAR.

## Rounds 0 to 3 (October 2026, the lead alone, then one builder)

Round 0 is the rough model: the floor outline raised to the LiDAR's roof, the top storey down the middle
and an end block at the north-west end. Round 1 sets the street face's panels 0.35 m in front of its
windows and gives the base its dark tiles. Round 2 moves the cameras and the light to 801's, keeps the
photographs' white cladding out of their sky (`sky_mask.pale_tint`) and measures the windows, the base,
the panels' top and the canopy through `MH15…`'s camera. Round 3 draws the roofs as the LiDAR shows
them and measures the openings and the doors again:

- **The roofs.** The two storeys' roof is a plane on each side of the top storey, rising from 7.29 m at
  the street face and 7.29-7.49 m at the back to 8.14 and 8.20 m at the top storey's walls (least
  squares over 2,558 and 2,100 returns; 99% and 76% within 0.1 m of it); from x 14.5 to the north-west
  end the street side is flat at 7.3 m. The top storey's roof is curved, 10.60 m at its crown to 8.81 m
  at its eaves, the medians of its returns in 0.5 m bands following it within 0.05 m; over its last
  2.6 m before 801 its crown is cut flat at 9.72 m.
- **The north-west end.** Round 0's end block, 10.72 m across the whole depth, is gone. What the LiDAR
  shows there above the roofs is 801's: a strip at 11.6-11.8 m along the party line is 801's terrace
  parapet, which 801's model draws there (11.1 m in 801's frame, whose ground is 0.3 m higher), with
  801's terrace at 10.75 m beyond it, and the returns to 13.0-13.7 m by the street are 801's raked
  corner.
- **The openings.** Through `MH15…`'s camera the openings are square, not splayed: the opening's edge
  on the panels' face and the frame's edge on the windows' plane fall at the same place along the face
  (11.42 and 11.44 m) and at the same height (5.72 and 5.68 m). What looks like a splay is the jamb and
  the head seen from below and to one side. The frames fill the openings, 1.0 m wide upstairs and 1.1 m
  downstairs; round 2 had measured only the red the far jamb leaves in view. South-east of 14 m along
  the face the windows keep the measured spacing (estimated): the wide view shows a window in every bay
  there, but at that slant its camera places none better than the spacing does.
- **The north-west end of the street face.** Two red-brown fire doors with their steps, one with a
  glazed panel and one under a glazed light, a louvre over a small green hood, a tall window over the
  second door and a band of windows under the canopy, each sized through the camera. The street lies
  0.95 m below the frame's ground, and the site's ground 1.3 m below it there, so whatever comes down
  below y = 0 there without reaching the ground would stand 0.6-0.9 m above it, which
  `tests/landmarks.test.ts` refuses for every material that comes down to y = 0. The doors' leaves are
  drawn in the kit's dark timber, the base's material, which reaches the ground and whose colour is near
  their red-brown. The red-framed glazed case under the hood (a sprinkler inlet's) is measured and not
  drawn, as its red frame and glass would not reach the ground; the panel stands there.

Against the photographs (`run.sh fifteen-eden-crescent compare`), round 3, every camera set by
`camera_fixes`: silhouette IoU inside the model's own screen box (the likeness limits are read there,
maintainer, 2026-10-27) 0.579, 0.768 and 0.998 over `MH15…`'s wide, upper and door views, 0.580, 0.644
and 0.821 over `v8ia…`'s and 0.679, 0.692 and 0.673 over `mdk1…`'s, mean 0.715 (round 2: 0.690); over
the whole frame 0.554. That passes tier 1's limit (0.65), but here too the IoU in the box tells little:
3.7% of the boxes' counted pixels are sky on the mean (`sky_in_box`, 0-24% in each view), so a plain
block filling each box would score 0.963, more than the model in every view. The likeness rests on the
heights and the top view below, and on the strips. The building's luma median 242-249 in the renders,
236-252 in the photographs: within 12 in eight views; in `mdk1…`'s wide view 249 against 236. There 59%
of the model's region is its north-west end, which 801 stands in front of in the photograph (801's white
cladding and dark glass: 235 there, against 249 drawn, which the inferred sun lights); over the rest of
the region the medians are 242 and 242. From above (`run.sh
fifteen-eden-crescent topview`): footprint IoU 0.865 against the LiDAR, 90% of cells within 0.5 m of its
height (round 2: 69%), the model 0.05 m below it at the median, 99.9% of block 802 under the model. The
model is 4,176 triangles in 9 meshes, one a material.

## Heights against the LiDAR

Building points of `data/fifteen-eden-crescent_pts.npy` in the view frame; model / LiDAR (median of a
0.5 m band across the building at x -18 to 15, unless said): the street side's roof by the face (z 11 to
11.5) 7.34 / 7.34, by the top storey (z 6.5 to 7) 8.03 / 8.01; the back's roof by the back wall (z -12 to
-11.5) 7.42 / 7.35, by the top storey (z -7 to -6.5) 8.10 / 8.08; the flat roof at the north-west end
7.3 / 7.1-7.4 (0.5 m cells); the canopy's top 7.42 / 7.34 (z 12 to 12.5); the top storey's crown 10.60 /
10.59-10.60, its roof at z 5.75 and -5.75 9.10 and 9.34 / 9.09 and 9.32, its eaves 8.81 / 8.89 and 8.91;
the cut crown at the north-west end 9.72 / 9.71-9.76 (0.5 m cells). Every one within 0.1 m (limit 0.5 m). The building's highest point is the top storey's
crown, 10.60 m (10.63-10.64 at p90). The LiDAR's highest points inside the block, 13.09 m (p99.9), are
801's raked corner and terrace parapet along the party line; the storeys of the street face (its rows
of windows, its base and its doors) come from the photographs, as the LiDAR does not see them.

## On the site (October 2026)

The model covers 99.9% of block 802 and no other block within 80 m by half or more, so `building.also`
is empty. The door is the foot of the plan's south-east tip on the lane along the building's south-east
end, where the LiDAR ground is 17.19 m (-0.16 to -0.06 m from `ground` within a metre of it): there the
model's y is 0 and the map's ground meets it. No street door's foot is at y = 0: Eden Crescent's
footpath lies 0.55 to 1.06 m below it along the street face, and the walls go down to `FOOT`, -1.2 m.

## Limits

- What no photograph shows is plain: the back, the ends and the top storey's walls. The top storey's
  roof and the two storeys' roofs are grey, their colour not seen in any photograph.
- The street face's panels are drawn as smooth paint, without their joints, and the base's tiles in the
  kit's dark timber, whose brightness is nearest the tiles'.
- The sprinkler inlet's glazed case is measured and not drawn, and the doors' red-brown leaves are drawn
  in the kit's dark timber (above).
- At the south-east end the LiDAR has the top storey's back half lower than its curved roof: a well
  about 6.5 m long and 3.5 m wide (x -22 to -15.5, z -4 to -0.5) whose floor is at 6.5 m, with a unit at
  8.1 m in it, and a strip at 9.1-9.2 m beyond it (z -6 to -4.5). It is drawn as the rest of the roof:
  the top view's cells where the model stands highest over the LiDAR are there.
- The windows south-east of 14 m along the face, and the mullions of the band under the canopy beyond
  the two the photographs show, keep the measured spacing: estimated.
