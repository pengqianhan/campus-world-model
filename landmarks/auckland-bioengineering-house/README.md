# Landmark: Auckland Bioengineering House (439), drawn from code

Auckland Bioengineering House, building 439 of the University of Auckland, on Symonds Street: a tower clad all round in
tinted glass, its plan a rectangle with its four corners cut, two stone fins on its north face rising a little above its
top and a plant room on its roof; round its north and east sides a lower building, where the site falls steeply to the
east. It is drawn in three.js from code alone, sized by the LINZ 2024 LiDAR, and compared with one photograph of it from
Symonds Street to its north-west (November 2026). The kit it is built with, the pipeline, the viewer and how to run them
are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=auckland-bioengineering-house&view=orbit`
  with the repository root served on port 8765. `site` is true: the site draws it in place of block 439 ("On the
  site", below).
- Run its pipeline: `landmarks/pipeline/run.sh auckland-bioengineering-house [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and
  so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/auckland-bioengineering-house.json`, `frame`: x west (the axis, the bearing of most of its walls, within 1 to 3
degrees of the tower's, and x is minus it); y up from 59.75 m NZVD2016, the LiDAR's ground at `door`, on the landing at
the top of the steps from Symonds Street; z north; the centre at x = z = 0. The site falls about 20 m across the crop,
steeply toward the east, where the ground beside the lower building lies about 18 m below the street. `parts/common.js`
gives the building a frame of its own: `u` east (minus x) and `w` north (z).

Every height in `parts/common.js` was measured before the door was set, above 57.96 m, the median ground in the crop
box; `H` moves each on to the door's ground, 1.79 m higher. The frame's thresholds in the config were lowered by the
same 1.79 m, so the measured frame is the one the model was drawn in (0.000 m, 0.000 degrees).

## Neighbours on the map

- No other landmark's outline comes within 2 m of its, so it stands alone on the map's ground at its door
  (`../README.md`, "Placement").
- No other block of the campus map lies under the model, so `building.also` is empty. Block 439 itself is 91.1% under
  it.

## The reference

One photograph from Symonds Street to the north-west, about 32 m from the tower's north face and looking up at it,
sees the north face with its two stone fins, the north-west and north-east cuts, and at its foot the entrance under a
sloping glazed roof. It is kept on the maintainer's computer in `refs/photos/` (gitignored), with the picks on it, its
fitted camera, its level cut and its mask. Nothing of it goes into git, and how it is recorded and credited is for the
maintainer to decide. No Street View photograph is used.

Its camera is fitted by `tools/photo_camera.py` to points and lines whose places the LiDAR gives: three corners of the
tower's top (the hull of its roof's returns), the north face's and the north-west cut's top edges, the north-east cut's
edge, and the stone fins' edges. It stands 1.61 m above the LiDAR's ground there, looking 23.5 degrees up, rolled -1.8
degrees, its field 45.5 degrees across: an rms of 1.03 px. No size is measured from the photograph but the second
fin's place (below); it is a reference for the look and the comparison.

The sky mask is the default. The viewer's light (`light`) is estimated: the photograph is taken on a cloudy day with the
sun breaking through, the glass taking the sky's light, so the viewer's sun stands at 20 degrees round, on the north
face's side of the sky, and 40 up, and the exposure (1.4) is set by the building's brightness against the photograph's.

## Round 0 (November 2026, the lead)

The tower, its parapet and plant room, the lower building and the two parts on it, as blocks at the LiDAR's plans and
heights, from the returns' p50 in 1 m cells and the hull of the tower's roof:

- **The tower**, a rectangle with its four corners cut (the west face 20.5 m, the north 16.7, the east 20.9, the south
  15.6; the cuts 4.3 to 6.0 m), its roof at 38.73 m inside a top edge at 39.6 m, a parapet estimated 0.3 m wide.
- **The plant room** on its roof, its top at 43.52 m.
- **The lower building** round the tower's north and east sides, its flat roof at 8.54 m, its plan the returns' edge
  and the campus map's ring on the LiDAR; on it a strip at 11.28 m along the tower's east face, and a part at 11.3 m
  before its north face.

Walls in the kit's `claddingPale`, roofs `roofGrey`. 256 triangles, 2 draw calls. Silhouette IoU 0.920 (0.921 in the
model's screen box); from above, footprint IoU 0.921 and 81% of the cells within 0.5 m of the LiDAR's height. (These
heights are above 57.96 m, as measured; above the door's ground each is 1.79 m lower.)

## The faces and the light (round 1, November 2026, the lead)

- **The tower** clad all round in the kit's `glass`, its parapet too.
- **Two stone fins** (`concrete`) on its north face, standing 0.35 m out of it and rising to 40.2 m, above the tower's
  top: the first at the LiDAR's returns (u -5.0 to -3.0, its returns above 39.9 m near the north edge, the highest
  40.24), the second, which the LiDAR does not see, placed after the photograph (its edges through the fitted camera,
  on the face's plane: u -12.7 to -11.0), as high and as deep as the first (estimated).

With the light above, the building's luma median is 179 against the photograph's 181 (151 at an exposure of 1.0, 191
at 1.6). Silhouette IoU 0.922 (0.923 in the box). 280 triangles, 4 draw calls; no two faces of different materials in
one plane.

## On the map (step 7)

- **The door**: the entrance is under the sign on the tower's north face, as the photograph shows it (the campus map
  records no lobby or entrance in 439, and OpenStreetMap none near it): glass doors under a sloping glazed roof before
  the face, reached by steps and a ramp from the footpath. The door is on the landing at the top of the steps, 1.9 m out
  from the tower's north face (u -15, w 12.5; (15.0, 12.5) in the view frame): its u from the doors' foot in the
  photograph through its fitted camera, its w from the LiDAR's ground, which steps down from the landing between w 13
  and 14.5 (the camera stands too near the landing's level for a w through it). The LiDAR's ground there is 59.75 m
  (11 returns within 1 m, p10/p50/p90 59.738/59.750/59.762 m); the footpath below the steps lies at 59.1 to 59.2 m,
  falling to 58.8 m 8 m out. `door.note` says so.
- The viewer's ground plane now stands at the landing: silhouette IoU 0.919 (0.920 in the box), the luma median 176
  against the photograph's 182. From above: footprint IoU 0.921 (the LiDAR's 1,240 square metres, the model's 1,159,
  both 1,150; its cells above 2.5 m now counted from the door's ground), 81% of the 4,547 cells within 0.5 m (the
  model's heights minus the LiDAR's p10/p50/p90 -1.98/0.0/0.09: the things on the tower's roof that the model does not
  draw), the highest point 41.74 m against the LiDAR's 42.64.
- `building.also` is empty.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 439. 439's entry in
`landmarks/measured/exclusions.json` (the generator's massing of it failed: 88% of its cells within 0.5 m, where 90% is
asked) has gone; `MASSING.md` lists 439 among the landmarks and counts 32 stand-ins measured.

- **The foot.** It stands alone, its y = 0 on the map's ground at its door, which lies 6.57 m under the LiDAR's there.
  Its walls go down to FOOT, 20.29 m below the door's ground, where the LiDAR's ground falls to the east; the foot check
  of `tests/landmarks.test.ts`, which tests each material's lowest points against the map's ground, passes. 288
  triangles, 4 draw calls (280 until the review closed a shaft of 0.55 square metres between the lower building and the
  tower's north-east cut; since then the top view's footprint IoU is 0.922, 81% of the 4,550 cells within 0.5 m, and
  block 439 91.1% under the model).
- **While a building is open** its neighbours sink to footprints: the site squashes a landmark about its own y = 0 and a
  block about its base, at most 4 m above the lowest ground under it (`squash` in `src/scene/landmarks.ts`, `applyFocus`
  and `baseOf` in `src/scene/CampusScene.ts`). 439's y = 0 is the map's ground at its door on Symonds Street, and under
  the model the map's ground lies from 1.06 m above it to 7.59 m below, where the site falls away to the east, so beside
  an open neighbour its footprint shows above the drawn ground on about 95% of its cells, by up to 7.69 m, where block
  439's showed on 50%, by up to 4.59 m.
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofGrey` as roofs,
  as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `claddingPale` and `concrete` are walls.
- **Its card** says "estimated:" and the config's `estimated`, which begins "with a photograph as a reference" (no
  height of it is taken from the photograph) and goes on with the place of the second stone fin, the tower's parapet,
  and the faces no photograph shows, the tower's drawn after the ones it shows and the lower building's plainly.
- **The pictures** in `docs/landmarks/`: `auckland-bioengineering-house-front.jpg` and `-above.jpg` are the viewer's
  renders of the model alone, from the north-west and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are
  shots of the site built from this branch, the map near it and a walker's eyes on Symonds Street to its north-west.

## Not drawn yet

The glass's frames and panes; the recess stepped into the north face's west end and the north-west cut over several
floors (the photograph shows its dark soffits; the LiDAR, which sees the roof, gives neither its plan nor how deep it
is); the sloping glazed roof over the entrance, its fascia and the sign (the LiDAR has no returns from the glass, so
neither its height nor its slope is known), the steps and the ramp; the things on the tower's roof beside the plant
room; the lower building's faces, which the photograph barely shows (plain).
