# Landmark: Maclaurin Chapel, drawn from code

Maclaurin Chapel (building 107 of the University of Auckland's campus map), drawn in three.js from code
alone and sized by the LINZ 2024 LiDAR, checked against five Street View photographs from Princes
Street (October 2026). The kit it is built with, the pipeline, the viewer and how to run them are
shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=maclaurin-chapel&view=orbit`
  with the repository root served on port 8765. It is not on the site yet.
- Run its pipeline: `landmarks/pipeline/run.sh maclaurin-chapel [stage ...]`.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

| File | What it is |
| --- | --- |
| `model.js` | assembles the parts: `chapel`, `spire`, `bay`, `hall` |
| `parts/` | `chapel.js` (the hexagonal chapel, its corner window and roof, the spire, the bay), `hall.js` (the hall, its walk-ways and entrance), `shapes.js` (the hexagon, beams and the low gable they share), `common.js` (the sizes measured in the LiDAR) |
| `config/maclaurin-chapel.json` | the building (107), the LiDAR and aerial tiles, the frame, the ground and the door, the five Street View panoramas |
| `placement.json` | where it stands on the campus map (written by the `place` stage) |

## The frame

- View frame: x to the right as seen from Princes Street on the west-north-west, y up from the
  ground at the foot of the entrance steps (43.5 m NZVD2016), z toward the street; the apex of the
  chapel's roof at x = z = 0.
- The centre is the mean of the building points above 9.7 m within 4 m of the highest one
  (`frame.tower_radius`, added to `measure.py` for this building): the top of the roof and the spire.
  A tree's crown over the hall's far end is classed as building and would pull the centre 13.6 m away.
- The axis is that of the walls (`frame.axis_from: "walls"`), bearing 19.82° (grid); the street side
  faces 289.82°. Building points within 2.5 m of the outline count (`frame.near_outline`): the hall's
  flat roof reaches 1.5–1.7 m beyond its walls over the walk-ways.
- In the LiDAR frame (local NZTM metres) the centre is at (87.402, 369.253). On the map
  (`placement.json`): the centre at (80.552, 370.843), x at 198.76° and z at 288.76° (true); the
  door at (68.77, 367.24).

## References

Of the 50 Google panoramas within 120 m, the 19 within 70 m were looked at in low resolution (zoom 3,
118 tiles); five on Princes Street (2024-07, 32–41 m from the chapel) show the chapel and the hall, and
715 zoom-5 tiles were bought for them: 825 tiles for this building. The others see trees, at most the
spire's tip. User-contributed panoramas are not used. The photographs show the street side only.

## Round 0 (October 2026, the lead alone)

From the LiDAR, then from the photographs: the chapel a regular hexagon (fitted to its roof's edge,
rms 0.21 m), its walls white and plain but for the great window that wraps the street corner, a low
pyramid roof, a square spire with a cross; the bay; the hall with its flat roofs, fascias, walk-ways
and entrance. From above against the LiDAR: footprint IoU 0.902, heights p50 −0.04 m, 80% of cells
within 0.5 m (the rest are trees classed as building over the hall and the chapel's corners); every
measured height within 0.13 m of the LiDAR's. 2,750 triangles in 7 materials.
