# Landmark: the Fisher Building, drawn from code

The Fisher Building (building 804 of the University of Auckland's campus map, 18 Waterloo Quadrant), a
tan brick tower of about ten storeys in the city centre, drawn in three.js from code alone and sized by the
LINZ 2024 LiDAR, checked against two Street View photographs from Waterloo Quadrant (October 2026). The
kit it is built with, the pipeline, the viewer and how to run them are shared by every landmark:
[`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=fisher-building&view=orbit`
  with the repository root served on port 8765. The site draws it in place of block 804 (below, "On
  the site").
- Run its pipeline: `landmarks/pipeline/run.sh fisher-building [stage ...]`.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/fisher-building.json`, `frame`: x west (minus the axis, which the tower's walls give: x points
at bearing 268.6° on the map), y up from 29.1 m NZVD2016, z north; the mean of the tower's points
above 20 m at x = z = 0. The ground round the tower falls from +3.3 m on the south-west, toward
Waterloo Quadrant and the ramp, to -3.1 m on the north-east and east, toward the gully: the walls go
down to `FOOT`, -3.2 m.

## References

Two Google panoramas of April 2026 on Waterloo Quadrant, west-south-west of the tower, 44 m (`MGAo…`)
and 42 m (`W9y5…`) from it (286 tiles, bought through the ledger on 2026-10-27). A sight-line test
over the LiDAR (buildings and trees, the tower's own footprint masked, faces turned to the camera)
chose them from the 20 Google panoramas within 80 m: `MGAo…` sees 70% of the south faces, 67% of the
west and 54% of the south-west, `W9y5…` 55% of the west; the other 18 see under 2%, behind trees and
neighbours. No photograph shows the north-east and east faces.

`streetview.camera_fixes` puts both cameras where their photographs' own edges put them against the
LiDAR, each with a pitch (the third number, a pipeline option this branch adds): `MGAo…` 1.8 m from
its recorded place and 5.56° lower than its cut, from the floor bands, the brick's corner, the slot
and the canopy's tiles in its tower view (rms 10.4 px, 80 px at the recorded camera); `W9y5…` at its
recorded place, 6.41° lower, from the canopy's red eave in three of its views. The panoramas record a
roll from the car on the street's cross-slope (-4.16° and -5.71°), which the pipeline does not apply
when it cuts the views: the pitches are what those rolls give at the views' headings.

## Rounds 0 to 3 (October 2026, two builders)

Round 0 is the rough model from the LiDAR: the tower (413 m², its flat roof at 32.6 m) and the shaft
over its south-west half (178 m², 36.9 m), in brick with flat roofs and a white band every 3.3 m
(estimated). Round 1 gives it tan brick (the
kit's `brickTan`), the storeys the LiDAR's wall returns show (every 2.875 m, a cream band at each
floor), the lower part's balconies and dark louvres on the north-west, and the slot of windows in
the shaft's corner. Round 2 fits `MGAo…`'s camera, draws the south-west corners on lines fitted to the
wall returns (rms 0.03-0.17 m), sets the slot into the corner between the two faces, the entrance's
red tile canopy (8.76 m, the LiDAR's) and the ramp's deck (5.90 m) through the trees, the shaft's
parapet (37.95 m) and the light of the April photographs. Round 3 draws the ramp's side along the
street on the LiDAR's line (its top 6.22 m and its foot 4.66 m over the car park through the fitted
camera), fits `W9y5…`'s pitch, cuts the slot 0.33 m into the corner, and puts the shaft's top band at
33.75 m, where its returns peak: the top storey is not taller.

Against the photographs (`run.sh fisher-building compare`), round 3, both cameras corrected by
`camera_fixes`: silhouette IoU inside the model's own screen box (the likeness limits are read there,
maintainer, 2026-10-27) 0.629, 0.819, 0.992 and 0.540 over `W9y5…`'s wide, upper, door and tower views,
0.934, 0.961, 0.991 and 0.838 over `MGAo…`'s, mean 0.838; over the whole frame 0.698. That passes tier
1's limit (0.65), but here too the IoU in the box tells little: 2.3% of the boxes' counted pixels are
sky on the mean (`sky_in_box`), so a plain block filling each box would score 0.977 on the mean (1
minus that share), more than the model in seven views. The eighth, `MGAo…`'s tower view, is the one
with sky round the tower (18%): there the model scores 0.838 and a plain block 0.819. The likeness
rests on that view, the heights and the top view below, and the strips. The building's luma median,
drawn against photographed, is within 12 in every view (the largest gap 11, in `MGAo…`'s tower view).
From above (`run.sh fisher-building topview`): footprint IoU 0.907 against the LiDAR, 76% of cells
within 0.5 m of its height, the model 0.03 m below it at the median, 86.5% of block 804 under the
model. The model is 4,356 triangles in 8 meshes, one a material.

## Heights against the LiDAR

Building points of `data/fisher-building_pts.npy` in the view frame; model / LiDAR (median, or the
percentile said): the tower's roof 32.6 / 32.6; the shaft's roof 36.9 / 36.9 (37.4 at p90); the
shaft's parapet, the building's highest point, 37.95 / 38.09 at p99.9 (83 of the 84 returns above
37.6 m lie within 1 m of the shaft's outline); the floor bands at the
heights where the wall returns peak (8.6 to 31.6 m, every 2.875 m), the shaft's top band 33.75 /
33.5-34.0; the entrance canopy 8.76 / 8.76 (9.22 at p90); the ramp's deck 5.90 / 5.90. Every one within
0.15 m (limit 0.5 m). The windows of the slot and the balconies come from the photographs, as the
LiDAR does not see them.

## On the site (October 2026)

The model covers 86.5% of block 804, and no other block within 80 m by 0.5% or more, so
`building.also` is empty. Most of the rest of block 804 is the lobe of its outline on the south-west (the
entrance, x 4 to 10, z -17 to -9), under trees, where the LiDAR sees no roof and the model draws
nothing. The door is the foot of the tower's west face under the entrance canopy, 0.5 m out from the
wall, where the LiDAR ground is 29.29 m (0.07 / 0.19 / 0.28 m from `ground` at p10 / p50 / p90 within
a metre of it; 3 returns, the canopy and the trees hiding the rest): there the model's y is 0 and the
map's ground meets it. The entrance's deck and the ramp up from Waterloo Quadrant stand 5.9 m above
it, over the car park.

## Limits

- What no photograph shows is plain: the north-east and east faces are tan brick with their floor
  bands, and the roofs are flat.
- The lobe of block 804's outline on the south-west, under trees, is not drawn (above).
- The car park under the ramp is open: its red columns are not drawn, and the ramp is its deck and
  its side along the street, a grey face from 4.66 to 6.22 m; the planting along its top is not drawn.
- The lower part's balconies: their depth (1.0 m) and the louvres' share of a storey are estimated
  from the photograph, not measured.
