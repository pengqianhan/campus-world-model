# Landmark: M&HS Building (501), drawn from code

Building 501 of the M&HS Building, University of Auckland, on the Grafton campus: a long block in board-marked concrete
with, at its east end toward a plaza, a tower under a dark crown of standing-seam metal, a strip of windows up the
middle of the tower's face, a glazed box at its foot, and glazed links either side between it and buildings 502 and
503. It is drawn in three.js from code alone, sized by the LINZ 2024 LiDAR, and compared with one photograph of the
tower's east face from the plaza (November 2026). The kit it is built with, the pipeline, the viewer and how to run
them are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=mhs-building-501&view=orbit` with
  the repository root served on port 8765. `site` is true: the site draws it in place of block 501 ("On the site",
  below).
- Run its pipeline: `landmarks/pipeline/run.sh mhs-building-501 [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and
  so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/mhs-building-501.json`, `frame`: x west-north-west (minus the axis, the bearing of the long block's walls), y up
from 72.19 m NZVD2016, the LiDAR's ground at `door`, on the plaza before the glazed box, z north-north-east, toward
building 502; the centre, the mean of the returns more than 29.7 m over that ground (the tower's top), at x = z = 0.
`parts/common.js` gives the building a frame of its own: `u` east-south-east (minus x), toward the plaza, and `w`
toward 502 (z). The frame takes the building's returns more than 9.7 m up only (`min_above`), so that the plaza's low
things and its trees are left out.

Every height in `parts/common.js` was measured before the door was set, above 71.88 m, the median ground in the first
crop box; `H` moves each on to the door's ground, 0.31 m higher. The frame's thresholds in the config were lowered by
the same 0.31 m, so the measured frame is the one the model was drawn in (0.000 m, 0.000 degrees). The crop box is 70 m
round the outline (`crop_note`), so that it takes in the plaza where the photograph is taken.

The campus's origin is about 1 km to the north. There the map's true north and NZTM's grid north differ by about a
degree, and the map's metres and the frame's local NZTM metres lie about 19 m apart: `place` turns one into the other,
as it does for every landmark.

## Neighbours on the map

- No other landmark's outline comes within 2 m of its (502 and 503 are blocks), so it stands alone on the map's ground
  at its door (`../README.md`, "Placement").
- Block 501's ring takes in, besides the building, the plaza east of the tower, over the floors the campus map has
  below its ground (-5, -10 and -20), and the south edge of building 502's roof. The model draws that edge (plainly,
  in pale cladding, its roof rising as the LiDAR has it), so that the map keeps the roof the block drew there. 74.7% of
  block 501 is under the model above 2.5 m; of the LiDAR's roof inside its ring (899 m²), 98.9%. Of the other blocks,
  501C (13.0%), 502 (6.3%) and 503 (4.5%) are under it by less than half, so `building.also` is empty.

## The reference

One photograph from the plaza east of the tower, looking west at its east face: the dark crown, the concrete shaft
with its strip of windows, the glazed box at its foot, the glazed links either side with a balcony rail on each floor,
503's east end nearer on the left and 502's on the right, the plaza's lawn, benches and lamp posts in front. It has no
record of its date. Its verticals are upright and its eye level lies low in the frame: it is cut off centre, or was
straightened. It is kept on the maintainer's computer in `refs/photos/` (gitignored), with the picks on it, its fitted
camera, its level cut and its mask. Nothing of it goes into git, and how it is recorded and credited is for the
maintainer to decide. No Street View photograph is used.

Its camera is fitted by `tools/photo_camera.py`, with its principal point solved, to lines and points whose places the
LiDAR gives: the front edge of the crown's flat top (32.4 m over the provisional ground) and the top and foot of the
glazed box before the east face (4.5 m and the plaza), with their ends, and the crown's eave over that face, with the
camera held 1.6 m over the LiDAR's ground. It stands about 67 m before the face, looking 4.0 degrees up, its field 48.1
degrees across: an rms of 2.78 px. The crown's eave is at 27.8 m: the LiDAR's edge cells there mix the crown and the
wall (28 to 30 m), and the fit's residual on the eave was 22 px at the outermost cell's 29.2 m and 1 px at 27.8. No
size is measured from the photograph but that eave, the glazed links' tops and floors and the strip of windows (below);
it is a reference for the look and the comparison.

## Round 0 (November 2026, the lead)

The model at the LiDAR's plans and heights (`parts/common.js`):

- **The tower**: its shaft (`renderGrey`) under the crown, u -2.0 to 8.6 and w -6.4 to 9.8, 0.4 m in from the crown's
  eave all round (the photograph shows the crown's flared foot standing out from the shaft by about that); the crown
  (u -2.4 to 9.0, w -6.8 to 10.2): a steep band from its eave at 27.8 m to 29.2 m, slopes up to its flat top at 32.4 m
  (u -1.4 to 8.0, w -5.8 to 9.2; its returns 32.2 to 32.6).
- **The glazed box** before the east face, its roof at 4.5 m (its beams 5.4 to 7.0 above it), its face at u 16.8.
- **The long block** west of it, 29.8 m (29.5 to 30.2), to its west end at u -28.5, where the ground is 4.8 m below the
  plaza; **the plant room** on its south side, 34.8 m; **the part south of it**, 30.6 and 28.6 m; **the concrete link**
  on its north side, 28.6 m.
- **The atria** either side, which the LiDAR does not see (no return of any class: glass roofs).
- **502's south edge** inside the ring, its south wall at w 13.8, its roof rising from 27.5 m to 30.6 m at w 24.

Silhouette IoU 0.893 in the model's screen box; the building's luma median 196 against the photograph's 131 (the
viewer's default light). The top view: footprint IoU 0.654, 64% of the 3,934 cells both cover within 0.5 m.

## Round 1 (November 2026, the lead)

- **The light well** in the long block's roof, u -21 to -7, w 3.5 to 7.8, its floor at 26.3 m (25.7 to 27.0).
- **The atria's glass** to 27 m, with each floor's slab every 3.8 m from 4.8 m standing 0.05 m out of it (the
  photograph's glazed links either side of the tower, through its fitted camera: estimated).
- **The strip of windows** up the middle of the tower's east face, w -0.6 to 1.4, from 5.0 to 26.7 m (`glass`;
  estimated in the photograph).
- **The crown**'s band and slopes in the kit's dark grey `screenGrey` (the photograph's standing seams), its flat top
  a roof (`roofGrey`).
- **The light**: the photograph has no date, and its east face stands in sun. The viewer's sun at 70 degrees round
  and 45 up lights that face; the building's luma median is 136 at an exposure of 0.4 against the photograph's 131.

## On the map (step 7)

- **The door**: the photograph shows glass doors in the middle of the glazed box's east face (the campus map records
  no lobby or entrance in 501, and OpenStreetMap none near it). The config's door is on the plaza 0.7 m out from
  them, u 17.5 and w 0.9 (in the view frame (-17.5, 0.9)); the LiDAR's ground within 1 m, 29 returns, p50 72.193 m.
- **The map's ground** (its 8 m elevation model) lies 1.26 m below the LiDAR's at the door, and under the model's
  plans from 1.42 m below the door's to 1.15 m above.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 501. 501's entry in
`landmarks/measured/exclusions.json` (the generator's massing of it failed: the roof's cells covered 58% of its
outline, which takes in the plaza) has gone; `MASSING.md` notes it in the Grafton round, and
`massing.py --campus grafton` leaves it out and writes every other Grafton file as before.

- **The foot.** It stands alone, its y = 0 on the map's ground at its door. Its walls go down to FOOT, 5.61 m under the
  door's ground, below the map's ground under every plan: the foot check of `tests/landmarks.test.ts` passes. Where
  the atria and the glazed box run into the walls they meet, their glass starts 0.1 m over FOOT, and the plant room's
  ends stand 0.1 m inside the part south of the block, so that no two faces of different materials lie in one plane
  (the faces check).
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 501, which sinks on
  its footing, at most 4 m above the lowest ground under it (`updateLandmarks` in `src/scene/CampusScene.ts`), and whose
  footprint shows above the drawn ground on 79% of its cells, by up to 1.67 m.
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofGrey` as roofs,
  as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `renderGrey`, `screenGrey` and `claddingPale` are walls. 640
  triangles, 5 draw calls.
- **Its card** says "estimated:" and the config's `estimated`, which begins "some heights, with a photograph as a
  reference" and goes on with the crown's eave, the links' tops and floors and the strip of windows, the links' glass
  roofs, and the faces no photograph shows.
- **The pictures** in `docs/landmarks/`: `mhs-building-501-front.jpg` and `-above.jpg` are the viewer's renders of the
  model alone, from the plaza and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of the site
  built from this branch, the map near it and a walker's eyes on the plaza (at 10:00, when the sun is on the east face,
  as in the photograph).

## Not drawn yet

The concrete's boards and floor bands, the glazing's frames, the balcony rails of the links, the box's doors, the
things on the roofs; the plaza's lawn, benches and lamp posts. The faces no photograph shows (the long block's, the
tower's other faces, 502's south edge) are drawn plainly, and the links along the atria's whole length after the ones
it shows.
