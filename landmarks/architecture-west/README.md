# Landmark: Architecture - West (421W), drawn from code

Architecture - West, building 421W of the University of Auckland: a slab in pale grey concrete running north-west from
Architecture - East, with a pale louvred parapet and a band of windows on each floor of its north-east faces above its
glazed storey of doors, on a paved upper level, a grey hipped roof, a tower in dark cladding on its ridge, its top
falling to the north-west, and two lower blocks at its north-west end. It is drawn in three.js from code alone, sized by
the LINZ 2024 LiDAR, and compared with one photograph of it from that paved level to its north (November 2026). The kit
it is built with, the pipeline, the viewer and how to run them are shared by every landmark:
[`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=architecture-west&view=orbit`
  with the repository root served on port 8765. `site` is true: the site draws it in place of block 421W
  ("On the site", below).
- Run its pipeline: `landmarks/pipeline/run.sh architecture-west [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its
  masks, and so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview`
  do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/architecture-west.json`, `frame`: x south-east (the axis, the bearing of the slab's walls, and x is minus it);
y up from 43.5 m NZVD2016, the LiDAR's ground at `door`, on the paved upper level; z south-west; the centre at
x = z = 0. The site falls about 16 m across the crop, from the upper level down to a lower courtyard before the
slab's south-east part (39.6 to 40 m) and further down on its south-west side (34.9 m). `parts/common.js` gives the
building a frame of its own: `u` along the slab, toward the north-west (minus x), and `w` across it, toward the
south-west (z).

Every height in `parts/common.js` was measured before the door was set, above 36.83 m, the median ground in the crop
box; `H` moves each on to the door's ground, 6.67 m higher. The frame's thresholds in the config were lowered by the
same 6.67 m, so the measured frame is the one the model was drawn in (0.000 m, 0.000 degrees).

## Neighbours on the map

- Architecture - East (421E) joins the slab's south-east end, its main block's walls 45 degrees from the slab's; where
  they meet, its ridge turns into this one's. This model is drawn up to where the model of 421E in pull request #140
  ends (that model's main block, u 37.5 and w 4.5 in its frame `E`), so that the two do not overlap below the roofs;
  south-east of the slab's tower its roof runs on to that line. If both are on the site they stand on one ground
  (`../README.md`, "Placement"): their rings on the campus map overlap, by about 140 m² where the slab meets 421E's main
  block, and the map's ground less the LiDAR's at their doors is -4.78 m here and -4.55 m at 421E's, 0.23 m apart. On
  this branch 421E is not on the site, and 421W stands alone on the map's ground at its door.
- 421E's block is 2.8% under the model, so `building.also` is empty. Block 421W itself is 62.3% under the model: of its
  ring's cells within the top view's reach, 88.6% hold the LiDAR's roofs and the model covers 86.5% of those; the rest,
  86 m², is all but about 8 m² of it the slab's end that the model of 421E draws; the ring's parts beyond the roofs
  (about 200 m²) lie outside the top view's reach.

## The reference

One photograph from the paved upper level to the building's north (its LiDAR ground 43.45 m, near the door's), about
33 m from the tower, looking 172 degrees round, sees the slab's north-east faces, the tower, the lower blocks to the
right and 421E's main block to the left. It is kept on the maintainer's computer in `refs/photos/` (gitignored), with
the picks on it, its fitted camera, its level cut and its mask. Nothing of it goes into git, and how it is recorded
and credited is for the maintainer to decide. No Street View photograph is used.

Its camera is fitted by `tools/photo_camera.py` to points and lines whose places the LiDAR gives: the tower's top
edges and two corners (its top falls from 68.4 m to 64.8 m to the north-west), the slab's eave by its north corner and
its hip (57.0 m), the ridge of 421E's main roof (61.9 m), and three upright edges (the tower's corners and a
downpipe). It stands 1.56 m above the LiDAR's ground there, looking 14.6 degrees up, rolled -1.5 degrees, its field
63.2 degrees across: an rms of 1.84 px. Fitted to the tower and the slab's lines alone it rolled -3 degrees and put
421E's ridge on a slant; the ridge and the uprights hold it. No size is measured from the photograph; it is a
reference for the look, the storeys' height and the faces' parts, and the comparison.

The sky mask is the default. The viewer's light (`light`) is estimated: the photograph shows the tower's north-east
face lit and its north-west face in shade, so the viewer's sun stands at 65 degrees round and 40 up, behind the
camera to its left, and the exposure (0.8) is set by the building's brightness against the photograph's.

## Round 0 (November 2026, the lead)

The slab's walls to its eave at 20.17 m (over the old ground), its roof the lowest of planes fitted to the LiDAR's
returns in 1 m strips, cut into convex pieces: a north-east slope both halves share; south-east of the tower a ridge
at 25.4 m and a south-west slope down to a flat roof at 20.52 m; north-west of it a wider top at 24.7 m, a longer
south-west slope and a hip at the north-west end. The tower on the ridge, its top a plane falling from 31.57 m to
27.97 m; two lower blocks at 17.43 and 15.9 m. Walls in the kit's `claddingPale`, roofs `roofGrey`, the tower and the
set-back part's face under its eave `screenGrey`. 217 triangles, 3 draw calls. Silhouette IoU 0.870 (0.971 in the
model's screen box); from above, footprint IoU 0.761 and 82% of the cells within 0.5 m of the LiDAR's height.

## The faces (step 5, November 2026, the lead)

The LiDAR has few returns on the faces, so what it does not give is estimated, the photograph as a reference:

- **The floors**, every 3.55 m, as 421E's, from the door's ground, the storey of the slab's doors (the photograph's
  bands of louvres and windows keep that step, through its fitted camera).
- **On each floor above it of the north-east faces** (the slab's, its set-back part's and the nearer lower block's), a
  pale louvred parapet 1.1 m tall (the kit's `plain`) and over it a band of windows 1.4 m tall (`glass`), standing a
  few centimetres out of the face; the slab's doors' storey glazed.
- **The block furthest north-west**, brown-clad in the photograph, in the tower's dark grey (`screenGrey`).

## On the map (step 7)

- **The door**: the entrance is not known from a record (the campus map records no lobby or entrance in 421W), so the
  door is before the glazed doors the photograph shows in the slab's north-east face, under the school's sign, 2.5 m
  out on the paved upper level (u 7, w -12.1; (-7, -12.1) in the view frame), where the LiDAR's ground is 43.50 m (25
  returns within 1 m, p10/p50/p90 43.467/43.503/43.534 m). Along the face from u 1 to 16 the level lies at 43.35 to
  43.52 m. `door.note` says so.
- The comparison's ground plane now stands at the door, as the photograph's camera does: silhouette IoU 0.830 (0.966
  in the box), the luma median 167 against the photograph's 168. From above: footprint IoU 0.782 (the LiDAR's 736 m²,
  the model's 611, both 591), 82% of the 2,322 cells within 0.5 m (the model's heights minus the LiDAR's p10/p50/p90
  -0.32/-0.01/0.54), the highest point 24.68 m above the door's ground against the LiDAR's 24.72.
- `building.also` is empty.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 421W. 421W's entry
in `landmarks/measured/exclusions.json` (the generator's massing of it failed: its roof cells covered 72% of its
outline, where 85% is asked) has gone; `MASSING.md` lists 421W among the landmarks and counts 33 stand-ins measured.

- **The foot.** It stands alone on this branch, its y = 0 on the map's ground at its door, which lies 4.78 m under
  the LiDAR's there. Its walls go down to FOOT, 8.97 m below the door's ground; the foot check of
  `tests/landmarks.test.ts`, which tests each material's lowest points against the map's ground, passes. The floors
  start at the door's ground: from 0.35 m lower, in step with 421E's, the doors' glazing stood 0.92 m over the map's
  ground at the face's south-east end; and the set-back part's faces start a storey up, as the slab's: from the
  doors' storey its lowest parapet stood 3.1 m over the map's ground, which lies lower there. 421 triangles, 5 draw
  calls.
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 421W, which sinks on
  its footing, 4 m above the lowest ground under it (`updateLandmarks` in `src/scene/CampusScene.ts`, since 2026-11-07),
  and whose footprint shows above the drawn ground on 39% of its cells, by up to 4.32 m. Before that the site squashed
  the model about its own y = 0, the map's ground at its door on the upper level: under its ring the map's ground falls
  toward its south-east end, from 0.98 m above it to 6.06 m below, so beside an open neighbour (421E, 423 or 409) its
  footprint showed above the drawn ground on about 73% of its cells, by up to 6.08 m.
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofGrey` as
  roofs, as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `claddingPale`, `plain` and `screenGrey` are walls.
- **Its card** says "estimated:" and the config's `estimated`, which begins "some heights, with a photograph as a
  reference" and goes on with the storeys' height, the parapets and the bands of windows on the slab's north-east
  faces, the glazed storey of its doors, and the faces no photograph shows, drawn plainly.
- **The pictures** in `docs/landmarks/`: `architecture-west-front.jpg` and `-above.jpg` are the viewer's renders of
  the model alone, from the north and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of the
  site built from this branch, the map near it and a walker's eyes on the paved upper level to its north.

## Not drawn yet

The storeys' edges stepping out on the north-east faces; the louvres' slats; the deep eave's soffit over the glazed
top floor and the doors' storey's columns; the brown-clad corner with its rainwater head and downpipe, and the railing
on the lower block's roof; the flues on the tower; the lower parts before the set-back face (the LiDAR's returns there
lie between 46.8 and 59.6 m); the dormers in the set-back part's dark face; the faces no photograph shows (plain).
