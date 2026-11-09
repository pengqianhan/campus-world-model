# Landmark: Building 907, drawn from code

Building 907, University of Auckland, on the Newmarket campus: a hall under a shallow barrel vault, clad in white
metal, with a band of glazing at the foot of its end toward the street, and beside it an annex of two storeys in
orange render whose roof falls away from the hall. It is drawn in three.js from code alone, sized by the LINZ 2024
LiDAR, and compared with one photograph from the street to its west-south-west (November 2026). The kit it is built
with, the pipeline, the viewer and how to run them are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=building-907&view=orbit` with the
  repository root served on port 8765. `site` is true: the site draws it in place of block 907 ("On the site",
  below).
- Run its pipeline: `landmarks/pipeline/run.sh building-907 [stage ...]`. Its reference is read from `refs/photos/`
  (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and so the default
  `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/building-907.json`, `frame`: x east-south-east (minus the axis), y up from 53.56 m NZVD2016, the LiDAR's ground
at `door`, on the yard before the annex's glazed door, z south-south-west, toward the annex; the centre at x = z = 0.
`parts/common.js` gives the building a frame of its own: `u` west-north-west (minus x), toward the hall's end the
photograph sees, and `w` toward the annex (z).

The frame is the vault's top: the building's returns more than 8.63 m over that ground (9 m over the first, provisional
ground of 53.19 m), which leave the annex out. Its axis is their principal axis (`axis_from` left out), bearing 284.90
degrees, within 0.24 degrees of the vault's crown line fitted to the LiDAR; along it both eaves keep their distance to
0.1 m. The walls axis that the other landmarks take gave 287.7 degrees on this roof, along which the eaves drift 1 m
over 30 m, so it is not used: `tools/photo_camera.py` reads the frame `measure` writes, and `place` and `topview` the
config's `expected`, so the two must be the same.

Newmarket lies about 1.7 km from the campus's origin (to its south-south-east), where the map's true north and NZTM's
grid north differ by about 1 degree: the map's metres and the frame's local NZTM metres lie about 31 m apart, and
`place` turns one into the other. The heightmap figure of the data stage draws the campus map's outline without that
turn, so there it stands 31 m off the building.

## The data

LiDAR tile 3905 was in the cache; aerial tile 2003 was not, and was fetched once through `snapshot.ts` (607,846,068
bytes; `data/sources.json`). The crop box reaches 45 m round the outline (`crop_margin`), so that it takes in the
street where the photograph is taken.

## The reference

One photograph from the street west-south-west of the building, about 27 m from the annex's nearest corner. Its camera
(`tools/photo_camera.py`) is fitted to the annex's two corners on its south-south-west face, their tops and feet, and
the vault's crown on the hall's west-north-west end, with the annex's two corners and the left edge of a pillar before
the gates as verticals: rms 2.45 px, 1.93 m over the LiDAR's ground, a lens of 71.6 degrees, looking up 6.3 degrees.
The crown and the annex's nearest corner fit to 0.6 to 2.3 px, its far corner's foot to 1.6 px and its far corner's top
to 7.6 px; the hall's end left of the crown stands about 18 px higher in the photograph than the model puts it, so
sizes read there are not used.

## The model (`parts/common.js`)

- **The hall**, u -22.9 to 23.0 and w -15.15 to 15.15: its walls of white metal cladding (`paint`) to its eaves at
  6.2 m, its two ends up to the vault's arc, and the vault (`roofPale`, near white in the 2023 aerial), the same all
  along, its profile the median of the roof's returns in 1 m strips across it, the two sides averaged: the crown 10.03 m
  over the provisional ground.
- **The annex** on its south-south-west side, an L as the LiDAR and the campus map's outline have it: a neck from the
  hall, u 16.3 to 21.8 and w 13.0 to 18.6, and a wider part beyond it, u 9.2 to 21.8 and w 18.6 to 24.6 (between the
  wider part and the hall the LiDAR sees the ground, and a small canopy against the neck), in orange render
  (`renderOrange`, a new colour of the kit's paint shader), its roof (`roofPale`, near white in the aerial) a plane
  falling from 8.5 m where it meets the hall (over the hall's eave by about 2 m) to 7.05 m at its far side.
- **The openings** (estimated, from the photograph through its fitted camera): on the hall's west-north-west end a band
  of glazing in dark frames from the ground to 4.4 m over the provisional ground (4.03 m over the door's), w -7.4 to
  9.65, with a pale strip across it from 1.9 to 2.95 m (1.53 to 2.58 m over the door's ground);
  on the annex's west-north-west face two columns of windows in dark frames, an upper window over a glazed door and an
  upper window over a lower one; on its south-south-west face a door.
- **The light**: the photograph is of an overcast day, so the viewer's sun stands behind the building (65 degrees round,
  40 up) and the exposure is 0.65: the building's luma p50 148 against the photograph's 150.

236 triangles in 5 draw calls (`paint`, `roofPale`, `renderOrange`, `glass`, `screenBlack`).

## How it compares

- Silhouette IoU 0.329 over the whole view, 0.862 in the model's screen box (where the photograph shows 7.1% sky); the
  building's luma p50 148 against the photograph's 150.
- Top view (`run.sh building-907 topview`): footprint IoU 0.963 (1,532 m² the LiDAR's, 1,477 the model's, 1,476 both);
  100% of the 5,858 cells both cover within 0.5 m of the LiDAR's height; the highest point 9.65 m over the door's ground
  against the LiDAR's 9.75 (p99.9). Block 907 is 89.2% under the model; no other block is near it.

## On the map (step 7)

- **The door**: the photograph shows a glazed door under a small canopy on the annex's west-north-west face (the campus
  map records no lobby or entrance in 907, and OpenStreetMap none within 120 m). The config's door is on the yard 1.5 m
  out from it, u 23.3 and w 17.8 (in the view frame (-23.3, 17.8)); the LiDAR's ground within 1 m, 22 returns, p50
  53.556 m.
- **The map's ground** (its 8 m elevation model) lies 0.70 m below the LiDAR's at the door, and under the model's plans
  from 1.25 m below the door's to 0.27 m above.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 907. 907's entry in
`landmarks/measured/exclusions.json` (the generator's massing of it failed: footprint IoU 0.859, 76% of its cells within
0.5 m; with the fourth round's forms 0.872 and 77%) has gone; `MASSING.md` notes it in the Newmarket round and the
fourth round, and `massing.py --campus newmarket` leaves it out and writes every other Newmarket file as before.

- **The foot.** It stands alone, its y = 0 on the map's ground at its door. Its walls go down to FOOT, 1.67 m under the
  door's ground, below the map's ground under every plan. The openings stand out of the walls by a few centimetres
  each, the frames behind the glass: no two faces of different materials lie in one plane.
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 907, which sinks on
  its footing, at most 4 m above the lowest ground under it (`updateLandmarks` in `src/scene/CampusScene.ts`), and whose
  footprint shows above the drawn ground on 87% of its cells, by up to 1.4 m.
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofPale` as roofs,
  as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `paint`, `renderOrange` and `screenBlack` are walls.
- **Its card** says "estimated:" and the config's `estimated`, which begins "some sizes, with a photograph as a
  reference" and goes on with the places and heights of the band of glazing and of the annex's windows and doors, and
  the faces no photograph shows.
- **The pictures** in `docs/landmarks/`: `building-907-front.jpg` and `-above.jpg` are the viewer's renders of the
  model alone, from the street and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of the site
  built from this branch, the map near it and a walker's eyes in the street.

## Not drawn yet

The ribs of the hall's cladding and the mullions between the glazing's panes; two dark louvred openings high on the
hall's end; the canopy over the annex's glazed door, a small one against its neck, and the cap along its top; the flues
beside the hall's end; the hall's other end and the annex's other faces, which no photograph shows, beyond plain walls.
