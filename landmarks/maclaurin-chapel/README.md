# Landmark: Maclaurin Chapel, drawn from code

Maclaurin Chapel (building 107 of the University of Auckland's campus map), drawn in three.js from code
alone and sized by the LINZ 2024 LiDAR, checked against five Street View photographs from Princes
Street (October 2026). The kit it is built with, the pipeline, the viewer and how to run them are
shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=maclaurin-chapel&view=orbit`
  with the repository root served on port 8765. The site draws it in place of block 107 (below, "On
  the site").
- Run its pipeline: `landmarks/pipeline/run.sh maclaurin-chapel [stage ...]`.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

| File | What it is |
| --- | --- |
| `model.js` | assembles the parts: `chapel`, `spire`, `bay`, `room`, `hall` |
| `parts/` | `chapel.js` (the hexagonal chapel, its corner window and roof, the spire, the bay, the small room beyond it), `hall.js` (the hall, its walk-ways and entrance), `shapes.js` (the hexagon, beams and the low gable they share), `common.js` (the sizes measured in the LiDAR) |
| `config/maclaurin-chapel.json` | the building (107), the LiDAR and aerial tiles, the frame, the ground and the door, the five Street View panoramas, the sky masks' option, the viewer's light |
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

What round 0 left to the next round: a sky mask that leaves bare branches out; the roofs' light
green; the bay's height (the LiDAR 7.1-7.5 m, a photograph about half a metre more); the part of
the bay and the small rounded room beyond it that a tree hides (the floor outline has them).

## Round 1 (October 2026, one agent alone, on `main`)

- **The photographs, made usable.** `sky_mask.py` has an option, `sky_mask.branches_deg` in the
  config (0.4 here): each photograph is classified again after a grey closing with a disc of 0.4°,
  so that bare branches, twigs and wires in front of the sky count as sky. Sky in a view: 0-17%
  before, 6.4-56.3% after. The other landmarks do not use it, and their masks are byte for byte as
  before. Three of the five cameras are now refined (dtDw, dsLb, PC_4: 20-25% photo sky round the
  silhouette, against 0-1% in round 0); 34Yw (15%) and JYSz (7%, toward the sun) keep Street View's.
- **The roofs.** A new kit material, `roofGreen` (light green corrugated metal, shader only), on the
  roofs the 2023 aerial shows green: the chapel's pyramid and its hip ribs, the hall's flat roofs and
  its middle room's low gable.
- **The bay's height**, decided by the LiDAR. Its roof is a low gable along x: in each half metre
  across it the lowest points run 7.04-7.2 m at both eaves and 7.7-7.8 m along the middle, the same
  where the LiDAR classes them building (near the chapel) and where a tree over it has them classed
  vegetation (its far half). So eaves 7.1 m and ridge 7.8 m (round 0: flat at 7.5). From the street
  the near slope (12°) rises more steeply than the line of sight (about 9°), so the ridge, not the
  eave, is the bay's top in the photographs: that is most of round 0's "half a metre more", which was
  read in 34Yw's upper view, whose camera is not refined. Through the refined cameras the bay's top
  in the photograph still stands 0.2 m (dtDw's upper view) to 0.4 m (dsLb's) above the model's
  ridge; the refined cameras are good to about that (dsLb's camera moved 0.25 m in height between
  round 0's model and this one), and the LiDAR measures the roof to a tenth of a metre, so the LiDAR
  decides.
- **The small room beyond the bay** and its link to the bay's street corner: walls on building 107's
  floor outline, straight between its points, and a flat roof at 3.40 m, the level surface the LiDAR
  finds under the tree over it (3.29-3.53 m, 67 points, classed vegetation) and nowhere else round
  the bay. The dark timber door the photographs show at the foot of the bay's far end is on its face
  toward the street.
- **The light**: exposure 0.65 (was 0.78): see the numbers below.

Numbers (round 0 -> round 1; `run.sh maclaurin-chapel refine compare topview`). The rise in the
silhouette comes from the new masks and the refined cameras, not from the model: round 0's model
against round 1's masks and cameras scores 0.452 (`out/r1/compare-a/metrics.md`), and round 1's
model against round 0's masks 0.227. The model's own changes this round (the bay's gable, the small
room, the green roofs, the light) leave the silhouette where it was.

| | round 0 | round 1 |
| --- | ---: | ---: |
| silhouette IoU, mean of 15 views | 0.223 | 0.449 |
| upper and door views of the 3 refined panoramas | 0.21-0.52 | 0.54-0.82 |
| wide views (all 5) | 0.02-0.08 | 0.05-0.28 |
| 34Yw upper / door (Street View camera) | 0.21 / 0.46 | 0.55 / 0.62 |
| JYSz wide / upper / door (toward the sun) | 0.02 / 0.08 / 0.17 | 0.05 / 0.18 / 0.22 |
| luma p50 of the building region, photograph / drawn (mean) | 138 / 159 | 137 / 145 |
| luma p50, the most apart (JYSz excepted) | 133 / 158 (34Yw door) | 132 / 144 (34Yw door) |
| top view: footprint IoU against the LiDAR | 0.902 | 0.883 |
| top view: cells within 0.5 m of the LiDAR | 80% | 80% |
| block 107 under the model | 95.3% | 98.1% |
| triangles / draw calls | 3,134 / 7 | 3,168 / 8 |

Per view, round 1: dtDw wide 0.282, upper 0.603, door 0.796; dsLb 0.220, 0.755, 0.820; PC_4 0.123,
0.543, 0.789; 34Yw 0.188, 0.548, 0.617; JYSz 0.046, 0.184, 0.217. The luma median is within 12 of
the photograph's in every view but JYSz's three (111-117 against 143-144: that panorama looks toward
the sun, and its camera darkened the building).

**Against A2 criterion 2.** The mean (0.449) is under tier 1's 0.65, and 7 of the 15 views are under
0.45: the five wide views and JYSz's upper and door. In the wide views the building is a
small part of the picture, and the trees in front of it are most of it: the masks count their pale
bark and lit leaves as solid (61,000 of dsLb wide's pixels are photo solid outside the model, 598 are
model on photo sky). The masks still cannot be trusted there, so this round proposes reading criterion 2 as for
a building with no usable reference: the top view's outline IoU against the LiDAR, 0.883 (≥ 0.80).
Photographs do exist, and over the 9 refined views the mean is 0.548, under 0.65; JYSz's brightness
is 27-33 off its photograph. Whether this reading may stand is the maintainer's decision.
The footprint IoU fell from 0.902 because the small room (13 m²) is drawn where the LiDAR classes its
roof vegetation: the LiDAR's own footprint leaves it out.

## On the site (October 2026)

Round 1's model, unchanged, with `"site": true` in the config; `place` wrote it into
`placement.json`. The site draws it near the camera in place of block 107 and of no other block.

- **The blocks it stands in place of.** From above on a 0.5 m grid, the model covers 98.1% of block
  107 (`run.sh maclaurin-chapel topview`, in the view frame) and 98.4% of it in the map's frame
  (through `placement.json`). The only other block whose centre is within 80 m, 123 (Lodge), it
  covers not at all. So `building.also` is empty.
- **The door** is the foot of the entrance steps (x 7.2, z 10.0), where the LiDAR ground is 43.5 m
  (the ground points within 1 m of it: p10/p50/p90 -0.05/+0.03/+0.23 m from `ground`).
- **The footing.** The site stands the model on its own drawn ground (the 8 m DEM) at the door. Under
  the footprint that ground lies -0.18 to +0.05 m from the door's. The walls, the steps and the
  porch go down to y = -0.70 (`FOOT`), so the lowest points of each material that reaches the ground
  are below the drawn ground: the walls by 0.52 to 0.75 m and the steps by 0.67 to 0.70 m. The small
  room's timber door stands on y = 0, 0.10 m above the drawn ground (`tests/landmarks.test.ts`
  allows 0.25 m).
- **What the LiDAR gives** (every height within 0.1 m of it): the chapel's eaves (8.95 m against
  8.94 m, the median of its points 6.6 to 7.1 m from the centre), its roof (10.21 m against 10.22 m,
  1.3 m from the apex), the spire's cross (21.1 m against 21.05 m, the highest point), the bay's
  eaves and ridge (7.1 and 7.8 m against the lowest points, 7.04 to 7.2 m and 7.77 to 7.81 m), the
  hall's flat roofs (3.37 m against 3.38 to 3.39 m; the far end's 3.25 m against 3.25 m), its middle
  room's ridge (5.0 m against 5.03 m) and the small room's roof (3.40 m). The plan is the chapel's
  hexagon fitted to its roof's edge, and building 107's floor outline where a tree hides the walls.
  The building card says "Drawn in detail, to sizes measured by LiDAR", and no part of the model is
  estimated, so the config gives no `part`.
- **What is plain, because no source shows it** (see "Limits"): the small room beyond the bay, the
  colour of the bay's and the room's roofs (pale), the hall's skylights (not drawn), and the faces
  away from Princes Street (plain white walls).
- **Its forms.** On the map, and in the walker views of the basic tier, it has the map's colours: its
  roofs (`roofGreen`, `roofPale`) take the roof colour, its glass and its iron trim (the eaves bands
  and the spire's cross) the colour of openings, and the rest the wall colour. In the walker views of the full tier it has its own materials. Its steps and its spire
  are in the kit's dressed stone (`dressed`, `shade`), so its full form asks the worker for the stone
  textures, as the Clock Tower's does.

## Limits

- The far half of the bay (x < -8.4) and the small room beyond it are under a tree in the LiDAR and in
  every photograph. They are drawn plainly: the bay's gable carried on to the floor outline's end (the
  vegetation points over it follow the same gable), the room's walls straight between the floor
  outline's points (rounded in plan only as far as the outline is), white, with a flat roof at the
  height the LiDAR finds under the tree. The colours of the bay's and the room's roofs are in no
  photograph: they are drawn pale, as round 0 drew the bay's.
- The photographs show the street side only; the back of the hall and the chapel are plain walls.
- The hall's far end shows a row of pale skylights in the aerial; they are not drawn.
