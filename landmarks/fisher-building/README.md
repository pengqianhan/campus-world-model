# Landmark: the Fisher Building, drawn from code

The Fisher Building (building 804 of the University of Auckland's campus map, 18 Waterloo Quadrant), a
tan brick tower in the city centre, drawn in three.js from code alone and sized by the
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

Two Google panoramas of April 2026 on Waterloo Quadrant, west-south-west of the tower, their recorded
cameras 38.3 m (`MGAo…`) and 36.2 m (`W9y5…`) from the frame's centre (286 tiles, bought through the
ledger on 2026-10-27). A sight-line test
over the LiDAR (buildings and trees, the tower's own footprint masked, faces turned to the camera)
chose them from the 20 Google panoramas within 80 m: `MGAo…` sees 70% of the south faces, 67% of the
west and 54% of the south-west, `W9y5…` 55% of the west; the other 18 see under 2%, behind trees and
neighbours. No photograph shows the faces turned north, east and south-east: both cameras stand
behind them.

`streetview.camera_fixes` puts both cameras where their photographs' own edges put them against the
LiDAR, each with a pitch (the third number, a pipeline option this branch adds): `MGAo…` 1.8 m from
its recorded place and 5.56° lower than its cut, from the floor bands, the brick's corner, the slot
and the canopy's tiles in its tower view (rms 10.4 px, 80 px at the recorded camera); `W9y5…` at its
recorded place, 6.41° lower, from the canopy's red eave in three of its views (`MGAo…`'s fitted camera
stands 40.0 m from the frame's centre). The panoramas record a roll from the car on the street's
cross-slope (-4.16° and -5.71°), which the pipeline does not apply when it cuts the views. At the
views' headings, 71° and 87° off the car's, those rolls give 3.9° and 5.7° of the two pitches (4.2° at
most for `MGAo…` with its recorded tilt); the rest, 1.4 to 1.6° of `MGAo…`'s and 0.7° of `W9y5…`'s, is
fitted to the photographs' edges and is not explained by the recorded roll.

## Rounds 0 to 4 (October 2026)

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
33.75 m, where its returns peak: the top storey is not taller. Round 4 answers the review: the
ramp's side goes on down to `FOOT` under the street where it stands on the pavement (`rampFoot`,
below, "On the site"), and the lower part's face turned north, the tower plan's edge 10, which no
photograph shows, is plain brick with its bands, no longer balconies.

Against the photographs (`run.sh fisher-building compare`), round 4, both cameras corrected by
`camera_fixes`, `rampFoot` drawn as the ground (`compare.underground`): silhouette IoU inside the
model's own screen box (the likeness limits are read there, maintainer, 2026-10-27) 0.627, 0.806,
0.992 and 0.539 over `W9y5…`'s wide, upper, door and tower views, 0.935, 0.960, 0.991 and 0.837 over
`MGAo…`'s, mean 0.836 (round 3: 0.838); over the whole frame 0.695. That passes tier
1's limit (0.65), but here too the IoU in the box tells little: 2.3% of the boxes' counted pixels are
sky on the mean (`sky_in_box`), so a plain block filling each box would score 0.977 on the mean (1
minus that share), more than the model in seven views. The eighth, `MGAo…`'s tower view, is the one
with sky round the tower (18%): there the model scores 0.837 and a plain block 0.819. The likeness
rests on that view, the heights and the top view below, and the strips. The building's luma median,
drawn against photographed, is within 12 in every view (the largest gaps 12, in `MGAo…`'s wide, upper
and tower views; round 3's largest was 11).
From above (`run.sh fisher-building topview`): footprint IoU 0.906 against the LiDAR, 76% of cells
within 0.5 m of its height, the model 0.03 m below it at the median, 86.5% of block 804 under the
model. The model is 4,248 triangles in 8 meshes, one a material.

## Heights against the LiDAR

Building points of `data/fisher-building_pts.npy` in the view frame; model / LiDAR (median, or the
percentile said): the tower's roof 32.6 / 32.6; the shaft's roof 36.9 / 36.9 (37.4 at p90); the
shaft's parapet, the building's highest point, 37.95 / 38.09 at p99.9 (83 of the 84 returns above
37.6 m lie within 1 m of the shaft's outline); the entrance canopy 8.76 / 8.76 (9.22 at p90); the
ramp's deck 5.90 / 5.90: each within 0.15 m (limit 0.5 m).

The floor bands are one every 2.875 m from 2.875 m. The wall returns within 2 m of the walls peak at
8.6, 11.5, 14.5, 17.4, 20.3, 23.1, 26.0, 28.9 and 31.6 m (0.25 m bins), and the middle of each band
from 8.625 m up is within 0.18 m of one (0.175 m at 20.3 m); the two lowest, at 2.875 and 5.75 m,
where the trees stand in front, carry the spacing on (estimated). The shaft's top band is at 33.75 m,
where its returns peak at 33.5-34.0 m. Through `MGAo…`'s fitted camera its tower view puts two bands
higher than drawn: at 26.1-26.2 m and 29.1-29.2 m (drawn at 25.875 and 28.75 m).

From the photographs, as the LiDAR does not see them: the ramp's side along the street (its top at
6.22 m and its foot over the car park at 4.66 m, `MGAo…`'s door and upper views through the fitted
camera), the slot's windows and frames, and the balconies. Estimated: the balconies' depth (1.0 m)
and the louvres' share of a storey, the canopy's depth (0.6 m), the deck's slab (0.5 m), the ramp's
side's thickness (0.3 m) and the parapet's (0.25 m).

## On the site (October 2026)

The model covers 86.5% of block 804, and no other block within 80 m by 0.5% or more, so
`building.also` is empty. The rest, 262 of the block's 1,942 cells of 0.5 m (`topview.py`'s grid, the
model above 2.5 m), is where the model draws nothing: a third of it (86 cells) in the lobe of the
outline on the south-west (the entrance, x 4 to 10, z -17 to -9), under trees, where the LiDAR sees no
roof; more (96 cells, 24 m²) west and north-west of the tower round the door and north of the canopy
(x 9 to 18, z -1 to 7), under trees too, where the LiDAR has building returns in 10 cells only, 6 of
them at 8.5 to 9.2 m just north of the drawn canopy's edge; 32 cells at the east corner (x -13 to -9);
and 48 in slivers along the outline's other edges. The door is a point at the foot of the tower's west-south-west face (the tower plan's edge
13, one of the balconies' faces), 0.43 m out from its outline and 0.72 m from the brick core behind
the balconies, 1.9 m north of the entrance canopy's nearest corner: not under the canopy, where the
LiDAR's ground is the car park's, 2.9 to 3.1 m higher. The LiDAR ground there is 29.29 m (0.07 / 0.19
/ 0.28 m from `ground` at p10 / p50 / p90 within a metre of it; 3 returns, the trees over it hiding
the rest): there the model's y is 0 and the map's ground meets it. The entrance's deck and the ramp up
from Waterloo Quadrant stand 5.9 m above it, over the car park.

The map's ground is not the LiDAR's (`../README.md`, "Placement"). Where the ramp's side meets the
pavement of Waterloo Quadrant, 5.2 and 5.7 m above the door's ground in the LiDAR, the map's ground is
only 2.3 and 2.4 m above it: from there to its street end the side goes down to `FOOT`, as the walls
do, so on the map it rises 3.8 to 3.9 m from the drawn street, where the street has the ramp's
parapet under a metre high. Over the car park the side and the deck stand clear of the ground, as the
photographs show them, but higher above the map's ground than above the LiDAR's: the side's foot 2.6
to 3.5 m up (1.0 to 1.8 m over the LiDAR's ground), the deck's underside 3.9 to 4.6 m (2.0 to 2.4
m). The part under the street, `rampFoot`, is drawn in the compare as the ground (`compare.underground`),
as the photographs show the street there; the viewer, whose ground is flat at y = 0, draws it as a grey
post under the ramp's end, and the README's two renders leave it out (`only=` the other parts); `model.js` names the ramp and its foot in `STANDS`, so that
`tests/landmarks.test.ts` checks their foot against the map's ground.

## Limits

- What no photograph shows is plain: the faces turned north, east and south-east are tan brick with
  their floor bands, the north face of the lower part among them (rounds 1 to 3 gave it the balconies
  of the faces beside it), and the roofs are flat.
- Block 804's outline under the trees by the entrance is not drawn: the lobe on the south-west and the
  part west and north-west of the tower round the door, a third of the block's uncovered cells each
  (above).
- The car park under the ramp is open: its red columns are not drawn, and the ramp is its deck and
  its side along the street, a grey face from 4.66 to 6.22 m over the car park, down to `FOOT` where it
  stands on the street; the planting along its top is not drawn. On the map the side's street end
  rises 3.8 to 3.9 m from the drawn street, and over the car park the side and the deck stand higher
  than in the LiDAR, as the map's ground there is 1.5 to 3.2 m lower than the LiDAR's (above).
- The lower part's balconies: their depth (1.0 m) and the louvres' share of a storey are estimated
  from the photograph, not measured.
