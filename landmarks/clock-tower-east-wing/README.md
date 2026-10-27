# Landmark: the Clock Tower East Wing, drawn from code

The Clock Tower East Wing (building 119 of the University of Auckland's campus map), drawn in three.js
from code alone and sized by the LINZ 2024 LiDAR, checked against four Street View photographs of its
lawn side (October 2026). The kit it is built with, the pipeline, the viewer and how to run them are
shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=clock-tower-east-wing&view=orbit`
  with the repository root served on port 8765. The site draws it in place of block 119 (below, "On
  the site").
- Run its pipeline: `landmarks/pipeline/run.sh clock-tower-east-wing [stage ...]`.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/clock-tower-east-wing.json`, `frame`: x to the right as seen from the lawn and the car park on
the south-west (so south-east), y up from the ground at the foot of the stair tower (40.0 m NZVD2016),
z toward the lawn; the middle of the main range at x = z = 0. The centre is the mean of the building's
points above 9 m within 1.5 m of building 119's outline without its north-west tail: with the tail, the
Clock Tower's own points and the trees over the link pull it 10 m away. The axis is the bearing of
most of the walls (-45.44°; the principal axis of the points is 1.3° from it).

## References

Four Google panoramas of May 2025 on the lawn side, 572 tiles, bought through the ledger on
2026-10-27. `EX9b…`, across the car park 28.5 m from the wing, sees the whole lawn side: the two
pavilions, the stair tower, the range between them and its roof. The other three, 35 to 62 m away, look
along the old basalt wall of the Albert Barracks, which fills half their frames and more; above it
they show the roofline. Three Google panoramas on Princes Street (80 to 97 m, behind the Clock Tower
South Wing) and two that are not Google's were not used. No photograph shows the back, the ends or
the link.

## Round 0 and round 1 (October 2026, the lead alone)

Round 0 is the rough model: the main range, the pavilions, the stair tower, the blocks at the back and
the link, as boxes and roofs at the LiDAR's sizes. Round 1 draws the windows as `EX9b…` shows them
(upstairs two lights under a shallow segmental head, downstairs narrow square-headed ones, white
frames and bars, stone sills), the tile roof over the front of the range only with a flat roof behind
it, the stair tower's stepped top, and moves every height the LiDAR gives into `parts/common.js`.
The windows are drawn by this landmark's own `wall()` in `parts/shapes.js`: the kit's windows have
pointed heads only. The kit gains one material, `roofTile` (red clay tiles, the pale roof's shader).

Against the photographs (`run.sh clock-tower-east-wing compare`), round 1: silhouette IoU 0.630, 0.943
and 0.963 over `EX9b…`'s wide, upper and door views, the only ones whose camera could be corrected;
over all twelve views 0.481, the other three panoramas' views scoring 0.07 to 0.61 because the basalt
wall in front of them is solid in the photograph and absent from the model. The building's luma
median 150 in the renders, 145 in the photographs. From above (`run.sh clock-tower-east-wing
topview`): footprint IoU 0.811 against the LiDAR (the link is drawn and the LiDAR selection leaves it
out), 81% of cells within 0.5 m of the LiDAR's height, 97.4% of block 119 under the model. After the
heights were checked one by one against the LiDAR (below), 86%, the model 0.05 m above the LiDAR at
the median, and the silhouettes the same to 0.01.

## Heights against the LiDAR

Building points of `data/clock-tower-east-wing_pts.npy` in the view frame; model / LiDAR (median,
or 90th or 95th percentile where said): the main ridge 9.50 / 9.42; the tile roof just behind the
front wall 7.27 / 7.17 and at z -1.2 7.22 / 7.24; the flat roof behind it 7.00 / 6.93; the pavilions'
ridges 7.90 / 7.84 and 7.90; their gables' apexes 8.50 / 8.52 and 8.45 (p90); their side eaves
7.20 / 7.26 and 7.19 (p90); the stair tower's top 10.35 / 10.38 (p95) and its shoulders 9.95 / 10.07
(p90); the blocks at the back 10.05 / 10.03; the low roof between them 4.05 / 4.06; the link 6.55 /
6.55 where trees do not stand over it. Every one within 0.12 m (limit 0.5 m). The LiDAR's highest
point near the wing, 12.19 m (p99.9), is the Clock Tower South Wing's eaves at x -21 to -20, within
1.5 m of the outline's west end.

## On the site (October 2026)

The model covers 97.4% of block 119 and no other block within 80 m by half, so `building.also` is
empty. The door is the foot of the stair tower's face toward the car park, where the LiDAR ground is
40.0 m (-0.06 to +0.08 m within a metre); the photographs show no doorway there, so it only sets where
the model meets the map's ground. The walls go down to `FOOT`, -1.0 m: the LiDAR ground falls to
-0.86 m behind the range and rises about 3 m under the link.

## Limits

- What no photograph shows is plain stone wall: the back, the ends, the two blocks at the back and the
  link. The grey of the roofs behind the pavilions' gables comes from the aerial.
- The windows' glazing patterns (geometric bars, leaded fanlights) are drawn as plain white bars.
- The stone is the Clock Tower's `ashlar`, a little greyer than the photographs' warm cream.
