# Landmark: Building 903, drawn from code

Building 903 of the University of Auckland, on the Newmarket campus: a long block of four storeys whose two upper
storeys are a box clad in pale corrugated metal, with windows singly and in bands, over two glazed storeys set back
under it on piers; a canopy over the entrance at its south-east corner, its south face stepped forward part of the way
along, and a low roof of two slopes behind a parapet, the east end a low gable. It is drawn in three.js from code
alone, sized by the LINZ 2024 LiDAR, and compared with a photograph of its south-east corner (November 2026). Until
now it was a measured massing (`../MASSING.md`). The kit it is built with, the pipeline, the viewer and how to run
them are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=building-903&view=orbit`
  with the repository root served on port 8765.
- Run its pipeline: `landmarks/pipeline/run.sh building-903 [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and
  so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/building-903.json`, `frame`: x east-south-east (minus the axis, the bearing of the long faces), y up from
52.64 m NZVD2016, the LiDAR's ground at `door`, on the platform before the entrance at the south-east corner, z
south-south-west, toward the road; the centre, the mean of the building's returns near the campus map's ring, at x =
z = 0. `parts/common.js` gives the building a frame of its own, `p` along its long faces to the west-north-west and
`q` to the south-south-west, turned 2.33 degrees from the frame's axis: the outermost roof returns of its four faces
drift 2.27 to 2.43 degrees against the axis, and none against `p` and `q`.

The frame was measured above 53.1 m, the median ground in the crop box; when the config's ground moved down 0.46 m to
the door's, its thresholds were raised by as much, so that they take the same returns, and `frame.expected` checks the
centre and the axis (0.000 m, 0.000 degrees). The campus map's ring stands about 29 m east-north-east of the building
in the LiDAR's local metres (it is in the map's frame); `place` converts.

## Neighbours on the map

- No other landmark's outline comes within 2 m of its (the nearest, Structures Hall's, is 8.3 m off), so it stands
  alone on the map's ground at its door (`../README.md`, "Placement").
- The model stands over 97.3% of block 903, 7.3% of block 904 and 2.0% of block 902. `building.also` is empty.
- Its roof runs on to the west-north-west, at the same height and with no seam in the LiDAR's returns, over Building
  902: the model ends where the campus map's ring does, and 902's measured massing draws the rest. Building 904, a
  lower block with a gable roof, stands against its north face; 904's measured massing has a flat strip at 16.8 m
  over its ground along its south side, 217 m² of it in 903's outline, which is the edge of 903's roof
  (`../MASSING.md`, "The third round").

## The reference

One photograph, kept on the maintainer's computer in `refs/photos/` (gitignored), with its picks, its fitted camera,
its level cut and its mask. Nothing of it goes into git, and how it is recorded and credited is for the maintainer to
decide. No Street View photograph is used.

- **The south-east corner**, from the road south-east of the building, under a bright overcast sky, looking
  north-west and up: the south face on the left, receding, stepped forward about 30 m along where three standpipes
  rise to the roof, and the east end on the right, receding steeply, its low gable's two roof edges against the sky;
  under the clad storeys the glazed storeys, a canopy over the entrance near the corner, steps and planters before
  them; beyond the east end's north corner a lower building's gable end. Its camera is fitted by `tools/photo_camera.py`
  to both faces' roof edges against the sky (the south face's at 70.1 m, the parapet's top in the LiDAR's returns
  along it; the east end's from 70.1 m up to 70.97 m over the ridge and down to 69.85 m at the north corner), to four
  upright edges (the cladding's corner, a standpipe, the east end's north edge and a pier) and to three corners (the
  ridge on the east end, the east end's north corner and the top of the south face's step forward), held near 1.6 m
  over the LiDAR's ground. It stands 1.62 m over the LiDAR's ground about 27 m south-east of the corner, its optical
  axis at bearing 336.7 degrees, looking up 14.9 degrees, through a lens of 60.3 degrees across: an rms of 0.85 px over
  46 residuals (the step's corner taken at p -7.4, where the LiDAR puts the step; at p -8.6, as first measured, the
  same rms with a lens of 59.4 degrees).
- Fitted to the edges and the upright edges alone, the camera wanted a lens of 62.8 degrees and put those three
  corners 12 to 39 px off: the lines alone do not fix the scale along them.

No size is measured from the photograph but the ones the next section names as estimated; it is a reference for the
look and the comparison.

## The model (`parts/common.js`)

From the LiDAR:

- **The block**: its roof's outer edges (the outermost roof returns on each face) at p -38.27 (the east end) to the
  campus map's ring's west-north-west end at p 36.5, the south face at q 15.84 from the east end to p -7.4, where it
  steps 2.68 m forward to q 18.52, and the north face at q -16.42 along the whole length.
- **The roof**: two slopes, 0.066 a metre (3.8 degrees), down from a ridge along q 1.0 at 70.3 m to the north eave at
  69.15 m and to the south parapet; a cap 2 m wide along the ridge to 70.75 m. The parapet along the south face to
  70.05 m (p90 of the returns within 0.6 m of it), 0.7 m thick; at the east end a gable within its parapet, 70.08 m at
  the south corner, 70.97 m over the ridge and 69.85 m at the north corner (p90 in 1 m strips).
- **On the roof**, from the returns standing more than 0.35 m over it: plant on a platform across the ridge (p -17 to
  -6, q -5 to 5.5) to 71.35 m, a duct from it to the north to 71.15 m, a unit toward the west end (p 23 to 28.3, q -5
  to -1) to 71.97 m, a fan to 71.91 m and a low block south of it to 70.65 m.
- **A roof under the step**, before the south face (p -10.0 to -6.25, out to q 26.2, the edge of block 903's ring),
  one plane falling from 57.6 m to 55.5 m, with the ground's returns under it all along; and **the canopies**: over
  the corner's entrance (p -37.9 to -33.1, out to q 17.05) at 55.5 m, along the forward face (p 4.05 to 25.1, out to q
  19.7) at 58.15 m and at its west end (p 33.4 to 36.4, out to q 20.7) at 55.65 m (the returns before the faces, with
  the ground's under them).
- **The clad box's underside** at 61.25 m (the returns under the faces stop there; through the camera the box's lower
  edge lies at 61.2 to 61.5 m), and **the glazed storeys** under it 0.45 m behind the south face and the east end
  (their returns between 54 and 61 m), with a band at the floor between them, 57.7 to 58.4 m (returns at
  58.0 m on both faces).
- **The walls' foot**, FOOT, 51.8 m: the ground along the walls (p1 of the returns 0.5 to 3 m out) lies from 51.89 m
  on the road before the forward face to 52.7 m by the east end's north corner.

Estimated, with the photograph as a reference: the plinth under the glazing to 53.0 m; the clad storeys' windows (on
the south face a pair of wide ones by the corner and a band of five, sills 63.25 and 66.35 m; on the east end two
single windows over a pair and a band of twelve to the north corner, sills 63.85 and 66.3 m) in frames 0.07 m proud,
the cladding 0.3 m wide between their units; the glazed storeys' piers (one 0.7 m square at the corner, one 1.5 m wide
on the south face and its like every 7.6 m along the south and forward faces, two on the east end) and a mullion every
1.5 m; the canopies' depth; the glazed storeys' place behind the forward face, where the canopy along it hides them
from the LiDAR, drawn as on the south face; and the depth of the roof under the step, drawn with nothing under it. The
forward face, which the photograph sees only at its far end, has the south face's bands; the north face, which no
photograph shows, is drawn as the south face.

## The light

The photograph is taken under a bright overcast and shows the faces evenly lit, with no shadow cast, so the viewer's
sun stands behind the building, to the north (0 degrees round, 50 up), weak (1.0, against 8), with a strong sky (3.4,
against 2.25), at an exposure of 0.78 (the config's `light`): over the model's screen box the luma (p50) 162 against
the photograph's 157.

## On the map (step 7)

- **The door**: the campus map records no entrance or lobby in 903's plans. The config's door is before the glazed
  entrance under the canopy at the south-east corner, on the platform 1.1 m out from the glazing, p -36.0 and q 16.5
  (in the view frame (36.64, 15.02)); the LiDAR's ground within 1 m, 11 returns, p50 52.637 m.
- **The map's ground** (its 8 m elevation model) is 57.65 m at the door, 5.01 m over the LiDAR's, and from 0.05 m
  under to 1.35 m over it under the walls' corners; the model stands its y = 0 on it at the door.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 903. Its measured
massing's data file, `landmarks/measured/buildings/903.json`, has gone: a run of `massing.py` over the Newmarket
campus leaves it out, as it does every landmark on the site, and writes every other file as before. `MASSING.md`
notes it.

- **The foot.** It stands alone, its y = 0 on the map's ground at its door. Its walls go down to FOOT, 0.84 m under
  the door's ground, under the map's ground at every corner of the walls (the lowest, 0.05 m under the door's, at the
  east end's south corner; 0.79 m to spare). Toward the west end the map's ground rises 1.35 m over the door's, so
  there the glazed storeys stand partly in it.
- **Its neighbours' massings.** The measured massings stand on the map's ground at their own doors too: 902's 7.33 m
  over the LiDAR's ground and 904's 5.71 m, where the model stands 5.01 m over it (903's measured massing, at the
  lowest point of its outline, stood 7.08 m over). So on the map 902's roof stands about 2.3 m over the model's at its
  west end, where they are one roof, and 904's strip 0.6 to 0.9 m over the model's roof along its north edge.
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 903, which sinks on
  its footing (`updateLandmarks` in `src/scene/CampusScene.ts`).
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofPale` as a roof,
  as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `claddingPale` is a wall.
- **Its card** says "estimated:" and the config's `estimated`.
- **The pictures** in `docs/landmarks/`: `building-903-front.jpg` and `-above.jpg` are the viewer's renders of the
  model alone, from the road to its south-east and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are
  shots of the site built from this branch: the map near it, and a walker's eyes on the road to its south-east.

## Not drawn yet

The entrance doors, the recessed entrance on the east end, the solid parts of the glazed storeys behind the trees on
the south face, the standpipes, the lights on the cladding, the steps and their rails, the planters and the trees,
and the windows' opening lights.
