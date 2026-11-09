# Landmark: Te Pūtahi Tangata (201), drawn from code

Te Pūtahi Tangata, building 201 of the University of Auckland, on the City campus between the Humanities Building and
the Music School: on the street a hall whose front is glass from the pavement to its roof, under a folded roof whose
plates rise and fall across the front, their ridges running back from the street; a canopy over its entrance; at its
north-east end a taller block clad in pale metal; and behind them, down the slope, a long block whose roofs stand about
25 m over the street, with raised strips and parts, a stair's core and a podium. It is drawn in three.js from code
alone, sized by the LINZ 2024 LiDAR, and compared with one photograph of the hall's front from the street (November
2026). The kit it is built with, the pipeline, the viewer and how to run them are shared by every landmark:
[`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=te-putahi-tangata&view=orbit` with
  the repository root served on port 8765. `site` is true: the site draws it in place of block 201 ("On the site",
  below).
- Run its pipeline: `landmarks/pipeline/run.sh te-putahi-tangata [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and
  so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not. The top
  view's Python step prints the building's name, which has a macron: on a console that cannot print it (Windows'
  cp1252), run it with `-X utf8`.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/te-putahi-tangata.json`, `frame`: x south-west (minus the axis, the bearing of the building's walls, 45.5
degrees), y up from 35.50 m NZVD2016, the LiDAR's ground at `door`, on the plaza before the entrance, z north-west,
toward the street; the centre, the mean of the building's returns within 1.5 m of the campus map's outline and more than
3 m over the first crop box's ground, at x = z = 0. `parts/common.js` gives the building a frame of its own: `u`
north-east (minus x), along the street front, and `w` toward the street (z).

Every height in `parts/common.js` was measured before the door was set, above 28.33 m, the median ground in the first
crop box (the site falls about 11 m from the street to the building's south-east side); `H` moves each on to the door's
ground, 7.17 m higher. The frame's thresholds in the config were lowered by the same 7.17 m, so the measured frame is
the one the model was drawn in (0.000 m, 0.000 degrees).

## Neighbours on the map

- Its outline comes within 2 m of two landmarks': the Humanities Building's (0.57 m) and the Music School's (0.44 m).
  The three make one group, but the map's ground at their doors is off the LiDAR's by 5.47 m (201), 2.61 m (206) and
  6.87 m (250), all below: a span of 4.26 m, more than `SHARED_SPREAD`, so each stands on the map's ground at its own
  door, as the Clock Tower and its East Wing do, and 206 and 250 stand where they stood.
- The roofs west of the hall (17 to 26 m) stand outside the outline: other buildings, not drawn.
- 85.1% of block 201 is under the model above 2.5 m. No other block is under it by half, so `building.also` is empty.

## The reference

One photograph from the street north-west of the hall, square to its glazed front: the glass from the pavement to the
roof, the canopy over the entrance left of the middle, the north-east block's pale metal cladding at the left edge, an
older building at the right edge, and three plane trees in front, whose leaves hide the roof's top and all the sky
over it. It has no record of its date. It is kept on the maintainer's computer in `refs/photos/` (gitignored), with the
picks on it, its fitted camera, its level cut and its mask. Nothing of it goes into git, and how it is recorded and
credited is for the maintainer to decide. No Street View photograph is used.

Its camera is fitted by `tools/photo_camera.py`, with its principal point solved (the picture is cut from a wider one,
its verticals upright), to lines and points whose places the LiDAR gives: the canopy's top (10.85 m over 28.33 m) and
its two ends, the foot of the glazed front (7.4), the hall's two ends (the north-east block's corner and the glass's
south-west end) and the edge of the strip along the street's kerb, the camera held near 1.6 m over the LiDAR's ground.
It stands about 14 m before the glass, 1.14 m over the road, level, its lens 114.6 degrees across, its principal point
at (552, 753) of 1372 x 1029: an rms of 1.77 px. A line picked as the kerb's foot (residuals 14 to 20 px) and the roof's
two visible peaks taken as the plates' top at the front (rms 20 px) were left out: those peaks are where the glass
meets the plates' underside, about 1.45 m under the LiDAR's top. No size is measured from the photograph but the
plates' depth at the front and the canopy's (below); it is a reference for the look and the comparison.

The sky mask finds no sky: the leaves cover it all. So refine has nothing to move the camera by, and the silhouette IoU
(0.646 in the model's screen box, with no sky in the box) tells nothing. The check is the camera's fit and the model
laid over the photograph through it: the canopy, the foot of the glass, the hall's two ends and the folded roof's
underside along the glass fall on the photograph's.

## The model (`parts/common.js`)

- **The hall** on the street: u -18.2 to the north-east block at 16.2, its glazed front (`glass`) at w 40.1 to 40.2,
  stepped back to 33.4 at its south-west end, its back on the long block at w -4.5. Its folded roof, from w -4.5 out to
  42.0 over the street: ridges at 19.25 and valleys at 17.05 at the front (the LiDAR's 19.1 to 19.4 and 16.9 to 17.2),
  7.3 m apart and running back from the street, falling 0.75 m to the back (as the LiDAR's). The plates are 1.4 m deep
  at the front (estimated, through the photograph's fitted camera: under the ridge at u -11.4 the glass meets them
  about 1.45 m under the LiDAR's top), grey on top (`roofGrey`) and near black under and at their edges
  (`screenBlack`); the glass fills the folds' gables over the front.
- **The canopy** over the entrance: u -0.27 to 6.76 (the LiDAR's), out to w 42.2, its top at 10.85 and its face 0.55
  m deep (estimated, in the photograph through its fitted camera), pale (`claddingPale`).
- **The north-east block**: u 16.2 to 36.75, out to w 43.0 from u 20.5 to 36.5 and to 40 beside it, at the LiDAR's
  edges (its front 1.2 m short of the campus map's outline), its roof at 24.35 (the LiDAR's 23.9 to 24.6); its raised
  part at 27.35 from u 14.6, over the hall's end, to 27 (27.0 to 27.5), its south-west wall standing from the hall's
  roof, where the LiDAR has a wall from 18.5 to 26.5, down to `FOOT`. Its faces
  toward the street and the hall pale metal (`claddingPale`), as the photograph shows the hall's side; the others
  plain.
- **The long block** behind: its roofs at 31.95 (the LiDAR's 31.2 to 32.2), u -43.0 to 34 and w -26 to -4.5, and on to
  w 0 at u -40 to -28 and 20 to 30; raised parts at 37.7 at each end of its north side (37.2 to 38); across its middle
  seven strips 2 to 3 m wide at 34.8, 1 to 2 m apart (u -20 to 11, w -18 to -6.5), drawn solid: the LiDAR's returns
  there lie both at the strips' top and on the roof under them (screens or roof lights, which no photograph shows);
  the stair's core on its south-east side at 33.4 (u -15 to -2.5, to w -33); the podium at 7.9 (its roof 7.6 to 8.0,
  its parapets to 9) along its south-east side and round its south-west end (u -46 to -43), and 12 beside the core;
  past the podium's south-west end a low roof at -0.5, about 2.6 m over the ground; north of the block's west end a
  part at 3.6; and the link between it and the hall's south-west end at 10.9 by the block and 13.5 on to the hall.
  Every face plain mid grey
  (`grey`), the roofs `roofGrey`.
- The light: the photograph's light is soft and bright, the front lit under the trees; the viewer's sun stands behind
  the camera, low in the north-west (300 degrees round, 35 up), at an exposure of 1.15: the building's luma median 213
  against the photograph's 203 as the metrics take it (the model at any height, and under the ground line the
  photograph shows the street) and 198 against 209 above the ground line.

The top view: footprint IoU 0.896 (the LiDAR's 4,176 m² against the model's 4,492, both 4,097; of the 395 m² only the
model covers, about two thirds is the hall's roof over its glazed strips, which the LiDAR does not see, and over a
planted part at its north-east end, whose returns at the roof's height the LiDAR classes as vegetation), 80% of the
16,031 cells both cover within 0.5 m (p10/p50/p90 -0.39/0.06/0.65), the highest point 30.54 m over the door's ground
against the LiDAR's 30.93 (p99.9). 712 triangles, 5 draw calls.

## On the map (step 7)

- **The door**: its entrance is not known from a record. The photograph shows the entrance under the canopy. The
  config's door is on the plaza 2.3 m out from the canopy's front, in the middle of it: u 3.2 and w 44.5 (in the view
  frame (-3.2, 44.5)); the LiDAR's ground within 1 m, 6 returns, 35.46 to 35.54 m (p10 to p90).
- **The map's ground** (its 8 m elevation model) lies 5.47 m under the LiDAR's at the door, and under the model's plans
  from 6.92 m below the door's to 0.49 m above. It falls about 7 m across the site where the LiDAR's falls about 11 m,
  so from the south-east the long block stands about 4 m less over the drawn ground than over the real one.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 201. 201's entry in
`landmarks/measured/exclusions.json` (the generator's massing of it failed the top-view check, its footprint IoU 0.872
against a limit of 0.9 and 84% of its cells within 0.5 m against 90%) has gone; `MASSING.md` notes it.

- **The foot.** Its y = 0 is the map's ground at its door. Its walls go down to FOOT, 11.67 m under the door's ground,
  below the map's ground under every plan: the foot check of `tests/landmarks.test.ts` passes, as does its faces check.
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 201, which sinks on
  its footing, at most 4 m above the lowest ground under it (`updateLandmarks` in `src/scene/CampusScene.ts`), and whose
  footprint shows above the drawn ground on 70% of its cells, by up to 4.6 m.
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofGrey` as roofs,
  as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `grey`, `claddingPale` and `screenBlack` are walls.
- **Its card** says "estimated:" and the config's `estimated`: the depth of the folded roof's plates at the front, with
  the photograph as a reference; the strips across the long block's middle, drawn solid; and the faces no photograph
  shows.
- **The pictures** in `docs/landmarks/`: `te-putahi-tangata-front.jpg` and `-above.jpg` are the viewer's renders of the
  model alone, from the street and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of the site
  built from this branch, the map near it and a walker's eyes from the street before it.

## Not drawn yet

The glazing's mullions, the metal cladding's panels and its rounded corner by the hall, the hall's glazed roof strips
and planted part, the things on the roofs, the faces no photograph shows (the long block's, the north-east block's
other sides), which are drawn plainly.
