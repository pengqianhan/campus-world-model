# Landmark: Security, drawn from code

Security (building 409) of the University of Auckland, on the City campus: a low block of two storeys whose upper
storey is a deep band of pale concrete, its south corner cut by a chamfer that faces a paved court, over a ground storey
of glazing set back under it on columns; before the corner a deck with a railing and a flight of steps down to the
court, and on its flat roof, behind a low parapet, a box at its west corner and a lower block toward its east end. It
is drawn in three.js from code alone, sized by the LINZ 2024 LiDAR, and compared with a photograph of its south corner
(November 2026). Until now it was a measured massing (`../MASSING.md`). The kit it is built with, the pipeline, the
viewer and how to run them are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=security-409&view=orbit`
  with the repository root served on port 8765.
- Run its pipeline: `landmarks/pipeline/run.sh security-409 [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and
  so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/security-409.json`, `frame`: x south-west (minus the axis, the bearing of the long faces), y up from 43.4 m
NZVD2016, the LiDAR's ground at `door`, on the court at the foot of the steps, z north-west, toward the road; the
centre, the mean of the building's returns near the campus map's ring, at x = z = 0. `parts/common.js` gives the
building a frame of its own, `p` along its long faces to the north-east and `q` to the north-west, turned 1.8 degrees
from the frame's axis: the LiDAR's long faces and ends alike run that far off it (their outermost returns drift 1 m
over 30 m against the axis, and none against `p` and `q`).

The frame was measured above 43.45 m, the median ground in the outline's band, as the measured massing took it; its
thresholds in the config were raised by the 0.05 m to the door's ground, and `frame.expected` checks the centre and
the axis (0.000 m, 0.000 degrees).

## Neighbours on the map

- No other landmark's outline comes within 2 m of its (the nearest, Architecture - West's, is about 4.7 m off, and
  building 302 of the Science Centre's about 30 m), so it stands alone on the map's ground at its door (`../README.md`,
  "Placement").
- The model stands over 94.8% of block 409 and over no other block. `building.also` is empty.

## The reference

One photograph, kept on the maintainer's computer in `refs/photos/` (gitignored), with its picks, its fitted camera,
its level cut and its mask. Nothing of it goes into git, and how it is recorded and credited is for the maintainer to
decide. No Street View photograph is used.

- **The south corner**, from the paved court south of the building, under a tree, on a bright, pale overcast day,
  looking north-north-west: the south-west end on the left, receding steeply under leaves, the chamfer facing the
  camera, and the south-east face on the right, behind a tree and a post; under the band of the upper storey the
  glazed ground storey, a deck with its railing and a flight of steps before the corner. Its camera is fitted by
  `tools/photo_camera.py` to both faces' roof edges against the sky and the leaves (51.5 m, the parapet's top in the
  LiDAR's returns along the faces) and to seven upright edges (the chamfer's joints, a column, a post and a panel), held
  near 1.6 m over the LiDAR's ground. It stands 1.6 m over the LiDAR's ground (45.2 m) about 10.5 m south of the
  south corner, level (0.9 degrees down), its optical axis at bearing 348.9 degrees, through a lens of 71.4 degrees
  across, as the camera's own record gives (a 24 mm equivalent: 71.6 degrees across this frame): an rms of 0.76 px
  over 26 residuals. It stands about 2.5 m inside Architecture - West's outline in the campus map; the LiDAR's returns
  over it, at 50 to 57 m, lie over returns from the ground, as a tree's crown's or an overhang's would: the
  photographer stood under one, or the fit is that far off.
- Through it the chamfer's top corners, which the fit does not use, fall on the two faces' lines within 0.01 m: the
  chamfer is 3.4 m wide, at 42 degrees to the faces. The LiDAR's returns at the parapet's height lie on that line;
  those at the corner beyond it are the tree's, and a fit to them (a chamfer of 2.6 m) wants a lens of 65 degrees, a
  roll of 3 degrees and leaves 3.3 px.

No size is measured from the photograph but the ones the next section names as estimated; it is a reference for the
look and the comparison.

## The model (`parts/common.js`)

From the LiDAR:

- **The block**: its parapet's outer edge (the returns on the roof to p1/p99 in strips along each face) at p -18.85
  (south-west, south of q 5.5; -16.35 north of it, a step of 2.5 m in at the west corner) to 17.7 (north-east, drawing
  in to 16.85 north of q 4) and q -12.85 (south-east) to 13.15 (north-west); the east corner cut by its returns, about
  1.7 m; the north corner drawn square, its returns a tree's crown (54 to 58 m, uneven).
- **The roof** at 51.13 m (p50 of the returns 4 m and more inside the faces) and the parapet's top at 51.5 m (the
  highest returns within 0.8 m of the faces, p50 51.42 to 51.49), 0.3 m thick.
- **On the roof**: a box at the west corner (p -15.6 to -9.75, q 9.6 to 13.0), its roof rising toward the north-east
  from 51.7 m to 53.84 m at p -11.8 and flat beyond (the p50s of its returns in 0.5 m strips); and a block toward the
  east end (along the south-east side from p 3.75 and from p -2 to 16.6, and up to q 3 from p 8) to 53.77 m (p90 of
  its returns), but for its south-east end (p 11.5 to 16.6, q -11 to -8.8), at 53.0 m.
- **The walls' foot**, FOOT, 43.0 m: the ground along the walls lies from 43.3 m on the court to the south-east to
  46.5 m by the road to the north-west.

Estimated, with the photograph as a reference: the chamfer at the south corner, 3.4 m wide; the band's underside at
49.1 m (the camera puts the band's lower edge on the chamfer and the south-east face at 49.06 to 49.11 m), with a dark
joint at each end of the chamfer; the ground storey's glazing 1.85 m behind the south-east face (where the camera puts
its head at the soffit) and, under the south corner, 3.65 m behind the south-west end, a porch; its frames 1.6 m
apart; columns 0.45 m square under the band's edge, 0.55 m in, the two the photograph shows and the rest on a grid of
6.5 m from them, 5.2 to 5.3 m apart along the south-west end; the floor and the deck at 45.3 m, at the camera's eye;
the deck out to 3.15 m before the south-east face, where the camera puts its railing's top 1 m over it, its railing of
thin bars; and a flight of 11 steps from the court up to it along the chamfer's normal, its foot where the camera puts
it but drawn 1.1 m further along the south-east face, clear of Architecture - West's outline. Neither the 2024 LiDAR
nor the 2023 aerial shows the deck, its railing or the steps: both see the paved court open there, at 43.4 m, up to
the south-east face (the photograph, taken later in 2024, shows them; they are drawn from it). The faces no photograph
shows (north-west and north-east) are drawn as the ones it does, the glazing 1.85 m in.

## The light

The photograph is taken under a bright, pale overcast and shows the faces evenly lit, with no shadow cast, so the
viewer's sun stands to the west-north-west (300 degrees round, 45 up), weak (1.5, against 8), with a strong sky (3.4,
against 2.25), at an exposure of 0.95 (the config's `light`): over the model's screen box the luma (p50) 156 against
the photograph's 159 (155 before the review of #168).

## On the map (steps 7 and 8)

- **The door**: the campus map records no entrance in 409. The config's door is on the court at the foot of the steps
  up to the deck, p -19.5 and q -18.3 (in the view frame (18.92, -18.9)); the LiDAR's ground within 1 m, 17 returns,
  p50 43.400 m.
- **The map's ground** (its 8 m elevation model) is 39.57 m at the door, 3.83 m under the LiDAR's, and from 0.27 m to
  1.08 m over it under the walls' corners; the model stands its y = 0 on it at the door.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 409. Its measured
massing's data file, `landmarks/measured/buildings/409.json`, has gone: a run of `massing.py` over the City campus
leaves it out, as it does every landmark on the site, and writes every other file as before. `MASSING.md` notes it.

- **The foot.** It stands alone, its y = 0 on the map's ground at its door. Its walls go down to FOOT, 0.4 m under the
  door's ground, under the map's ground at every corner of the walls (the lowest, 0.27 m over the door's, at the south
  end of the south-east face; 0.67 m to spare).
- **The ground storey on the north-west side.** The real ground rises 2.9 m from the door to the road on the north-west
  side, about 1 m over the ground storey's floor; the map's 8 m ground rises only about 1.1 m there, so on the site the
  ground storey's glazing shows whole along that side.
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 409, which sinks on
  its footing (`updateLandmarks` in `src/scene/CampusScene.ts`).
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofPale` as a roof,
  as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `claddingPale`, `screenGrey` and `screenBlack` are walls.
- **Its card** says "estimated:" and the config's `estimated`.
- **The pictures** in `docs/landmarks/`: `security-409-front.jpg` and `-above.jpg` are the viewer's renders of the
  model alone, from the court to its south and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of
  the site built from this branch: the map near it, and a walker's eyes on the court to its south.

## Not drawn yet

The lean-to of sloping glass and the lower fenced deck along the south-east face, the stairs' handrails, the doors and
the frames' colour (dark green), the joints between the band's panels, a row of small units on the roof, the tree's
crown over the north corner and the trees round it.
