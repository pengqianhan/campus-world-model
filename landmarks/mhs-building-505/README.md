# Landmark: M&HS Building (505), drawn from code

Building 505 of the M&HS Building, University of Auckland, on the Grafton campus: a long block of four storeys in white
concrete panels over a ground floor set back under its upper storeys, behind round columns on the north; on its north
face, toward a plaza, twelve bays of silver fins and louvres over set-back glazing between a white wall at each end,
glass at its north-east corner and a dark band round its cut south-east corner; over the parapet a higher middle of the
roof, and at its west end an atrium under a glass roof. It is drawn in three.js from code alone, sized by the LINZ 2024
LiDAR, and compared with one photograph of its north face from the main road (November 2026). The kit it is built with,
the pipeline, the viewer and how to run them are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=mhs-building-505&view=orbit` with
  the repository root served on port 8765. `site` is true: the site draws it in place of block 505 ("On the site",
  below).
- Run its pipeline: `landmarks/pipeline/run.sh mhs-building-505 [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and
  so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/mhs-building-505.json`, `frame`: x west-north-west (minus the axis, the bearing of the long block's walls), y up
from 72.16 m NZVD2016, the LiDAR's ground at `door`, on the plaza before the entrance in the north face's ground floor,
z north-north-east, toward the plaza and the main road; the centre, the mean of the building's returns near the
campus map's ring, at x = z = 0. `parts/common.js` gives the building a frame of its own: `u` east-south-east (minus
x), toward the main road, and `w` toward the plaza (z).

Every height in `parts/common.js` was measured before the door was set, above 72.13 m, the median ground in the first
crop box; `H` moves each on to the door's ground, 0.03 m higher. The frame's thresholds in the config were lowered by
the same 0.03 m. The frame was measured on the campus map's ring (0.000 m, 0.000 degrees) and is kept as
`frame.expected` now that `building.outline` is traced from the LiDAR ("Neighbours on the map").

The campus's origin is about 1 km to the north. There the map's true north and NZTM's grid north differ by about a
degree, and the map's metres and the frame's local NZTM metres lie about 20.5 m apart here: `place` turns one into the
other, as it does for every landmark.

## Neighbours on the map

- No other landmark's outline comes within 2 m of its (501's is 27.5 m away; 503 and 504 are blocks), so it stands
  alone on the map's ground at its door (`../README.md`, "Placement").
- The campus map's outlines of 505 (its ring kept as `campus_outline`) lie about 7 m north-north-east of the LiDAR's
  building: its storeys fit the LiDAR's when moved so. The ring takes in 10 to 12 m of the plaza north of the long
  block, where the LiDAR has the ground, misses a strip up to 4 m wide along the block's south side, and takes in the
  south edges of 503's roofs north of the atrium and the link, which block 503, drawn from its own offset storeys, does
  not reach. `building.outline` is traced from the LiDAR instead (its `outline_note`), so that the top view counts the
  building's own roofs. The model draws what the LiDAR has of 505, the strip along its south side outside the ring
  too, and those edges of 503's roofs (`EDGE` in `parts/common.js`), plainly at the LiDAR's heights, so that the map
  keeps the roof block 505 drew there; once block 505 gives way, no block draws them. The atrium's south side and the
  strip west of it (about 28 m²) lie inside 504's ring only, where the LiDAR has the atrium's roof.
- 78.9% of block 505 is under the model above 2.5 m; of the LiDAR's roof inside its ring (2,853 m²), 95.5%. Block 504
  is 6.1% under it and 503 2.7% (the edges of 503's roofs, drawn on a 0.5 m grid). No other block is under it by half,
  so `building.also` is empty.

## The reference

One photograph from the main road north-east of the long block, looking south-south-west at its north face: on the
left the north-east corner, the east face's glass seen edgewise and a dark clad tower beyond it; then a white wall,
twelve bays of fins and louvres and a white end bay with three windows; a glazed front and the low glazed link at the
right edge; the high middle of the roof over the parapet from a step in the roofline; a taxi, a van, bare trees and a
lawn in front. A smaller second picture is laid over its bottom right corner and is left out. It has no record of
its date. Its verticals are upright and its principal point lies low and left: it is a level picture cut from a wider
one. It is kept on the maintainer's computer in `refs/photos/` (gitignored), with the picks on it, its fitted camera,
its level cut and its mask. Nothing of it goes into git, and how it is recorded and credited is for the maintainer to
decide. No Street View photograph is used.

Its camera is fitted by `tools/photo_camera.py`, with its principal point solved, to lines and points whose places the
LiDAR gives: the north-east corner's top, the north face's parapet (17.45 m over the provisional ground), the east
face's top, and the high middle of the roof (20.85 m), whose north-east corner shows over the parapet 7 m behind it
and so holds the camera's distance, with three verticals, the camera held 1.6 m over the LiDAR's ground. It stands
about 42 m from the north-east corner, its field 58.7 degrees across: an rms of 1.37 px. Fitted to the faces alone,
the camera ran off to 75 m with a field of 95 degrees, where 503's roof of 30 m would stand in the photograph's sky.
No size is measured from the photograph but the ones the next section names as estimated; it is a reference for the
look and the comparison.

## The model (`parts/common.js`)

- **The ground floor**, under the upper storeys, which stand on it from the first floor's slab at 3.9 m (estimated):
  the LiDAR sees the ground under the roof up to 3.4 m in from the south face, on the whole width of the east end from
  u 51 and along the cut to w -12.3 to -10.8, so its walls stand behind those returns, at w -14.5 on the south, u 50.5
  at the east end and on a line between them behind the cut (estimated); on the north, the set-back glass (below).
  Before the south face a canopy at 4.75 m, 1.8 m out (the LiDAR's returns at 4.2 to 5.1 m, u -31 to 39.5).
- **The long block**, u -32.7 (against 504) to its east face, w -18.3 to 7.9. Its east face runs 17 degrees off square
  from the north-east corner (54.3, 7.9) to (60.5, -9.0); its south-east corner is cut back on a straight line from
  (61.3, -11.0) to (37.5, -18.3). Its roofs, each drawn flat: the middle at 20.85 m (20.7 to 21.0), w -10.2 to 1.0;
  the north strip at its parapet, 17.45 m (its roof falls from 17.9 to 17.3); the east part 17.8 m; the south band
  17.7 m. Walls `claddingPale`, roofs `roofGrey`.
- **The dark band** (`screenGrey`), 1.4 m deep, round the east face south of its glass, the cut corner and the south
  face east of u 30, from the first floor's slab to 18.7 m (18.6 to 18.8), a metre over the roofs inside it.
- **The north face**, through the photograph's fitted camera (estimated): the ground floor set back 2.5 m (w 5.4)
  under the upper storeys to its soffit at 4.6 m, the first floor's slab edge from 3.9 m, glazed, with round columns
  every three bays before it, each in the middle of a bay; a white wall at the north-east corner (u 50.62 to the
  corner); twelve bays of 2.755 m (u 17.56 to 50.62) whose glazing (`glass`, a band in each storey) stands 1 m behind
  silver fins (`screenSilver`) to 16.95 m, with twelve louvres a bay, every 0.975 m, a frame along their top and the
  white parapet over it to 17.45 m; the end bay, standing out to w 8.5 as the LiDAR has it, from the last fin to u 8.7,
  with a window in each storey (6.3 to 8.2, 10.1 to 12.1 and 13.7 to 15.45 m, u 11.8 to 17.3) in a dark frame 0.6 m
  deep; the shade the LiDAR has 1 m out at 15.6 m over the top window's head (u 9.0 to 16.3, west of where the
  photograph has the window); west of the end bay, u 4.0 to 8.7, a glazed front under a grey band from 16.15 m.
- **The east face's glass** from the north-east corner to w -4.3, from 4.4 m to the parapet (estimated).
- **The atrium** at the block's west end, u -45.5 to -14.5 and w -4.5 to 10.3 (where 503's roof begins): its glass
  roof, in vaults across it, rising from 21.6 m at its south side to 24.6 m at its north side, drawn as one slope.
- **The link** north of the block's west part, u -14.5 to 4.0, to w 10.3 to 13.5 where 503's east wing begins, 17.3 m:
  glass under a grey band (estimated); **the low strip** west of the atrium, u -48.5 to -45.5, 16.8 m.
- **The edges of 503's roofs** inside 505's ring, drawn plainly: north of the atrium (u -46 to -14.5, to w 15.5 to 17.5
  where block 503 begins) its roof rising from 28.7 m at the atrium to 29.8 m (29.0 to 29.3 in the middle); north of the
  link (u -14.5 to 2, to the ring's edge at w 18 to 22) its east wing at 21.0 m.
- The light: the photograph has no date, and the sun stands high in the north on the north face. The viewer's sun at
  350 degrees round and 50 up, exposure 1.0: the luma of the white wall at the north-east corner 241 against the
  photograph's 240, of the end bay's wall 240 against 243, of the north face between them 143 against 135, of the dark
  band 85 against 91 (the compare's figure, over the model's screen box, where the photograph has the road, cars and a
  lawn before the ground floor: 152 against 177).

Silhouette IoU 0.923 in the model's screen box (0.945 before the ground floor was set back on the south and the east).
The top view on the traced outline: footprint IoU 0.917 (the LiDAR's 3,273 m² against the model's 3,136, both 3,066),
92% of the 12,114 cells both cover within 0.5 m (p10/p50/p90 -0.28/0.03/0.36), the highest point 29.78 m against the
LiDAR's 30.07 (p99.9: 503's roof, beyond the edge the model draws; 505's own highest, the atrium's north side, 24.6 to
24.9 m, against the model's 24.56). 1,494 triangles, 5 draw calls.

## On the map (step 7)

- **The door**: neither the campus map (no lobby or entrance in 505) nor OpenStreetMap (no entrance near it) records an
  entrance. The photograph shows a glazed entrance under a sign band in the north face's ground floor; the config's
  door is on the plaza 4.1 m out from the ground floor's glass, u 24.3 and w 9.5 (in the view frame (-24.3, 9.5)); the
  LiDAR's ground within 1 m, 13 returns, p50 72.157 m.
- **The map's ground** (its 8 m elevation model) lies 1.25 m above the LiDAR's at the door, and along the outline from
  0.59 m below the door's to 2.48 m above, at the block's south-west corner on the street, where the LiDAR's ground
  lies 3.4 m under the door's: that corner stands about 6 m less over the drawn ground than over the real one.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 505. 505's entry in
`landmarks/measured/exclusions.json` (the generator's massing of it failed: the roof's cells covered 81% of its
outline, which takes in the plaza) has gone; `MASSING.md` notes it in the Grafton round, and
`massing.py --campus grafton` leaves it out and writes every other Grafton file as before.

- **The foot.** It stands alone, its y = 0 on the map's ground at its door. Its walls go down to FOOT, 4.53 m under the
  door's ground, below the map's ground under every plan: the foot check of `tests/landmarks.test.ts` passes. Toward
  the block's south-west corner the map's ground stands up to 2.48 m over the door's, where the LiDAR's falls: there
  the model's foot is buried deeper than on the plaza.
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 505, which sinks on
  its footing, at most 4 m above the lowest ground under it (`updateLandmarks` in `src/scene/CampusScene.ts`), and whose
  footprint shows above the drawn ground on 74% of its cells, by up to 3.12 m.
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofGrey` as roofs,
  as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `claddingPale`, `screenSilver` and `screenGrey` are walls.
- **Its card** says "estimated:" and the config's `estimated`: the north face's storeys, how far its glazing stands
  behind its fins and louvres, the fins' top and the louvres' spacing, where its end bay and the white wall at its
  north-east corner stop, the ground floor's set-back and its columns there, the end bay's windows and their frames,
  the east face's glass and its foot, and the glazed front and the link under their grey bands, with a photograph as a
  reference; how far the ground floor stands back on its other sides; the atrium's glass roof, drawn as one slope; and
  the faces no photograph shows, drawn plainly, as are the edges of the next building's roofs.
- **The pictures** in `docs/landmarks/`: `mhs-building-505-front.jpg` and `-above.jpg` are the viewer's renders of the
  model alone, from the plaza and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of the site
  built from this branch, the map near it and a walker's eyes on the main road north-east of it, where the
  photograph is taken.

## Not drawn yet

The panels' joints, the glazing's frames, the sign band and the entrance's doors, the things on the roofs, the
atrium's vaults; the plaza's lawn, low walls and trees. The faces no photograph shows (the south face, the west end,
the atrium's sides, the link's) are drawn plainly.
