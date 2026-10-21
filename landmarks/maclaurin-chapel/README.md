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

## Round 0 (October 2026, one agent alone)

From the LiDAR, then from the photographs: the chapel a regular hexagon (fitted to its roof's edge,
rms 0.21 m), its walls white and plain but for the great window that wraps the street corner (3.9 m
along the left face, 2.75 m along the right, as two photographs show), a low pyramid roof with a dark
edge, a square spire with a cross; the bay; the hall with its flat roofs and fascias, walk-ways, and
the entrance recessed under its roof. The viewer's light is the photographs' (a July morning, the
sun behind the building; exposure 0.78 puts the plain white face at the photograph's luma, 154).

- From above against the LiDAR: footprint IoU 0.902, heights p10/p50/p90 -8.05/-0.04/0.02 m, 80% of
  cells within 0.5 m (the rest are trees classed as building over the hall and the chapel's
  corners); every measured height within 0.13 m of the LiDAR's; 95.3% of block 107 under the model.
- Against the photographs (`run.sh maclaurin-chapel compare`): silhouette IoU 0.02-0.52, mean 0.22;
  luma p50 of the building region, photograph 138 and render 159. Neither says much yet: bare winter
  branches stand in front of every photograph, and the sky masks count the pale sky through them as
  solid, so the cameras could not be refined (0-1% sky round the silhouette). With textured pixels
  left out (a diagnostic, not the pipeline's metric) the clearest views reach 0.72 (dsLb upper) and
  0.77 (dsLb door), mean 0.41.
- On the site's drawn ground (the 8 m DEM): -0.18 to +0.05 m from the door's under the footprint;
  the walls go down to -0.70 m, so nothing floats.
- 3,134 triangles in 7 materials (`paint`, `glass`, `roofPale`, `iron`, `shade`, `timber`, `dressed`),
  built in 14 ms.

What the next round should look at: a sky mask that leaves bare branches out (an option of
`sky_mask.py`); the roofs' light green (the kit has no green roof yet); the bay's height (the LiDAR
7.1-7.5 m, a photograph about half a metre more); the part of the bay and the small rounded room
beyond it that a tree hides from the LiDAR and every photograph (the floor outline has them).
