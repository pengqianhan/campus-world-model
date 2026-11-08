# Landmark: Sir Owen G Glenn Building (260), drawn from code

The Sir Owen G Glenn Building, building 260 of the University of Auckland: a curved wing of glass, white spandrels
and louvres, a Y of three arms round a raised plaza, with a sloping canopy in the curve's inner corner, a top storey
along its west side, a lower west wing along the road, and a lower building on the plaza's north-east side; under the
plaza a deck of floors that the site's east side, falling into the gully, shows. It is drawn in three.js from code
alone, sized by the LINZ 2024 LiDAR, and compared with one photograph of it from the plaza's north edge (November
2026). The kit it is built with, the pipeline, the viewer and how to run them are shared by every landmark:
[`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=owen-g-glenn-building&view=orbit`
  with the repository root served on port 8765. `site` is true: the site draws it in place of block 260 ("On the
  site", below).
- Run its pipeline: `landmarks/pipeline/run.sh owen-g-glenn-building [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and
  so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not. The
  comparison leaves the north-east building out: `QUERY="only=building"` (below).
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/owen-g-glenn-building.json`, `frame`: x south-west (the axis, the bearing of most of the building's walls, and
x is minus it); y up from 29.62 m NZVD2016, the LiDAR's ground at `door`, on the plaza before the canopy; z north-west;
the centre at x = z = 0. The site falls about 28 m across the crop, from the road on the west to the gully on the east,
where the ground beside the east arm lies about 18.6 m below the plaza. `parts/common.js` gives the building a frame
of its own: `u` north-east (minus x) and `w` north-west (z).

Every height in `parts/common.js` was measured before the door was set, above 24.46 m, the median ground in the crop
box; `H` moves each on to the door's ground, 5.16 m higher. The frame's thresholds in the config were lowered by the
same 5.16 m, so the measured frame is the one the model was drawn in (0.000 m, 0.000 degrees).

## Neighbours on the map

- No other landmark's outline comes within 2 m of its, so it stands alone on the map's ground at its door
  (`../README.md`, "Placement").
- No other block of the campus map lies under the model above 2.5 m (block 219, 8 Grafton Road, had 6.5% under the
  deck's edge while the heights stood on the provisional ground), so `building.also` is empty. Of block 260 itself
  48.8% is under the model above 2.5 m, as the plaza, the deck's top, is at the door's ground; of its 22,474 cells
  where the LiDAR has a roof more than 2.5 m above that ground, the model covers 95.5%.

## The reference

One photograph from the north edge of the plaza, looking south across a raised lawn, sees the curved wing's inner
face, the sloping canopy in its curve, and its north arm close on the right; a second, smaller picture of the
building's back is laid over its bottom right corner. It was taken in December 2018 (its own record). It is kept on
the maintainer's computer in `refs/photos/` (gitignored), with the picks on it, its fitted camera, its level cut and its
mask. Nothing of it goes into git, and how it is recorded and credited is for the maintainer to decide. No Street View
photograph is used.

Its camera is fitted by `tools/photo_camera.py` to points and lines whose places the LiDAR gives: the two ends of the
canopy's low edge, three corners of the raised lawn and the foot of the nearest, the crown of louvres on the east arm,
four columns under it and a steel post before the north arm. It stands 1.25 m above the plaza at its edge, looking 10.1
degrees up, its field 59.7 degrees across: an rms of 2.57 px. The inset is left out of its view with the tool's
`exclude` (rectangles of the photograph that are not the scene), so the sky mask ignores it. No size is measured from
the photograph but the heights of the curved wing's bands of faces (below); it is a reference for the look and the
comparison.

The north-east building on the plaza, which the 2023 aerial and the 2024 LiDAR show with its walls, is not in the
photograph: from where it was taken that building's south-west wall would fill its left quarter, and the photograph
shows the plaza there. The photograph predates it, so it is a part of its own (`northEast`), which the comparison
leaves out; the top view and the site take it in.

## Round 0 (November 2026, the lead)

Each part a block at the LiDAR's plan and height, its plan traced from the highest returns in 0.5 m cells (by height,
closed, filled, simplified to 0.6 m) and its height the returns' p50 inside it:

- **The deck**, the plaza and the floors under it, its top at 29.58 m; the LiDAR counts the plaza as ground.
- **The curved wing**, a Y of three arms round a curve, its roof at 52.83 m, and **the top storey** along the west
  side of its north and south-west arms at 56.57 m.
- **The west wing** along the road at 46.06 m, and a lower part west of its north end at 35.13 m.
- **The north-east building** on the plaza's north-east side at 35.85 m.
- **The canopy** in the curve's inner corner, a triangle in plan, its top a plane fitted to its 2,445 returns (rms
  0.73 m): 33.65 m at its north end, 34.5 m at its east end, rising south-west into the curve.

Walls in the kit's `claddingPale`, roofs `roofGrey`; walls down to -14.0 m above 24.46 m, where the ground falls to the
gully. 1,447 triangles, 2 draw calls. Silhouette IoU 0.873 (0.873 in the model's screen box) on the provisional
ground; from above, 85% of the cells within 0.5 m of the LiDAR's height.

## The faces and the light (round 1, November 2026, the lead)

- **The curved wing in bands**, estimated with the photograph as a reference: its edges on the east arm's inner face
  through the fitted camera, on the face's plane, scaled so that its foot and its crown fall at the plaza's 29.6 m and
  the crown's 53.8 m. The open ground storey and two glazed storeys to 41.4 m in the kit's `glass`; three storeys of a
  white spandrel (`paint`) and a band of louvres and windows (`glassPale`), 3.4 m apart; a white fascia from 51.6 m.
- **The crown of louvres** (`screenSilver`, 0.3 m wide, estimated) to 53.8 m along the sides of the wing where the
  LiDAR's returns within 1.2 m reach 53.5 m or more, and the short sides between two of them.
- **The canopy's top** in `screenSilver` over glass; the deck `grey`; the top storey, the west wing and the part west of
  it, and the north-east building plain.
- **The light**: the viewer's sun where the sun stood when the photograph was taken, 61.7 degrees round and 65.8 up.

3,403 triangles, 7 draw calls; no two faces of different materials in one plane.

## On the map (step 7)

- **The door**: the photograph shows a glazed front the height of the ground storey under the canopy, a banner in it
  and a dark wall with lettering beside it; its doors are not made out (the campus map records no lobby or entrance in
  260, only a reception on level 0, below the plaza, and OpenStreetMap no entrance near it). The door is on the plaza
  1.5 m out from the middle of the canopy's low edge (u 2.98, w 4.31; (-2.98, 4.31) in the view frame), where the
  LiDAR's ground is 29.62 m (17 returns within 1 m, p10/p50/p90 29.595/29.621/29.673 m). `door.note` says so.
- On this ground the comparison counts the model more than 4 m above it (the config's `refine.min_height_m`), and the
  plaza no longer counts as model: silhouette IoU 0.763 (0.763 in the box, where the photograph shows 76.0% sky); the
  luma median 160 against the photograph's 164 at an exposure of 1.5 (110 at 0.75). From above: 90% of the 21,331
  cells within 0.5 m (the model's heights minus the LiDAR's p10/p50/p90 -0.34/0.02/0.22), footprint IoU 0.931 (the
  LiDAR's 5,765 m², the model's 5,537, both 5,448), the highest point 26.96 m against the LiDAR's 27.34.
- **The map's ground** (its 8 m elevation model) runs as a slope under the deck from the streets to the gully: at the
  door it lies 6.18 m below the LiDAR's, at the plaza's north edge 4.15 m, on the road on the west 1.3 to 1.5 m below,
  level with it on the driveway on the north, and 7.68 m above it in the gully on the east.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 260. 260's entry in
`landmarks/measured/exclusions.json` (the generator's massing of it failed: its roof cells covered 51% of its outline,
where 85% is asked) has gone; `MASSING.md` lists 260 among the landmarks and counts 32 stand-ins measured.

- **The foot.** It stands alone, its y = 0 on the map's ground at its door, 6.18 m under the LiDAR's there: so the site
  draws the plaza about 6 m lower than it stands, and along the deck's plan the map's ground runs from 3.61 m below the
  model's y = 0 to 6.82 m above it. The deck's walls go down to FOOT, 19.16 m below the door's ground, and so do the
  walls of every part on the deck, inside it, and the deck is one material, its top too: the foot check of
  `tests/landmarks.test.ts`, which tests the lowest points of each material that comes down to the door's ground
  against the map's ground, passes. 3,207 triangles, 7 draw calls.
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 260, which sinks on
  its footing, at most 4 m above the lowest ground under it (`updateLandmarks` in `src/scene/CampusScene.ts`), and whose
  footprint shows above the drawn ground on 62% of its cells, by up to 4.43 m.
- **The light form** (the map, and the walker views of the basic tier) draws `glass` and `glassPale` as glass and
  `roofGrey` as roofs, as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `grey`, `paint`, `screenSilver` and
  `claddingPale` are walls.
- **Its card** says "estimated:" and the config's `estimated`, which begins "some heights, with a photograph as a
  reference" and goes on with the crown's width, the top of the strip between the west wing and the curved wing,
  which the LiDAR does not see, and the faces no photograph shows.
- **The pictures** in `docs/landmarks/`: `owen-g-glenn-building-front.jpg` and `-above.jpg` are the viewer's renders of
  the model alone, from the north-west and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of the
  site built from this branch, the map near it and a walker's eyes on the driveway to its north.

## Not drawn yet

The glass's frames and the louvres' blades; the columns and the recess of the open ground storey (drawn as glass in the
wing's plan); the north arm's balconies and steel posts; the raised lawn and the paving's lines; the things on the
roofs; the back's stepped floors over the gully, which the photograph's inset shows (the deck's walls are plain grey
there). The faces no photograph shows are drawn plainly, but for the curved wing's, whose bands go round it as on its
inner face.
