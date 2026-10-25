# Landmark: Old Choral Hall, drawn from code

Old Choral Hall (building 104 of the University of Auckland's campus map), at the corner of Symonds
Street and Grafton Road, drawn in three.js from code alone and sized by the LINZ 2024 LiDAR, by a lead
agent and a team of agents (October 2026). Every source shows the building during building works (see "The sources: works in
progress"), except the panoramas of its south-west range on Symonds Street from before the works
(2022-09) and after them (2024-10). So only that range, with its two end pavilions, is drawn in
detail as those panoramas show it. The rest of the building keeps the campus map's estimated block
until the works end: the maintainer's choice of 2026-10-23 (see "On the site"). The kit, the
pipeline and the viewer are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=old-choral-hall&view=orbit`
  with the repository root served on port 8765. The site draws it in place of block 104.
- Run its pipeline: `landmarks/pipeline/run.sh old-choral-hall [stage ...]`.

| File | What it is |
| --- | --- |
| `config/old-choral-hall.json` | the building (104), `site: true`, the LiDAR and aerial tiles, the frame, the ground and the door, the eleven Street View panoramas (`streetview.pano_ids`), the viewer's light |
| `placement.json` | where it stands on the campus map (written by the `place` stage); on the site |
| `model.js` | assembles the parts: `southwest`, `rest` |
| `parts/` | one file per part (`southwest.js`, `southwest_range.js`, `southwest_kit.js`: the south-west range and its pavilions, in detail; `rest.js`: the rest, as the campus map's estimated block) and `common.js` (the range's frame and the footpaths, measured in the LiDAR) |
| `docs/` | the rules the agents worked to: `CONTRACT.md`, `ART_BIBLE.md` |
| `landscape.js` | the ground round it, for the viewer only: the LiDAR's ground on a 2.5 m grid |

Renders of the model (no photograph): [`docs/landmarks/old-choral-hall-symonds.jpg`](../../docs/landmarks/old-choral-hall-symonds.jpg)
(the south-west range from Symonds Street), [`-corner.jpg`](../../docs/landmarks/old-choral-hall-corner.jpg)
(the range from off the corner, the corner pavilion at the right) and
[`-above.jpg`](../../docs/landmarks/old-choral-hall-above.jpg) (the range, and the rest as the map's
block behind it).

## The frame

- View frame: x to the right as seen from Grafton Road on the south-east, y up from 37.7 m NZVD2016,
  z toward the street. The door (config `door`, x 1.5, z 22.6) is on the Grafton Road footpath at the
  mouth of the forecourt, where the LiDAR's ground is 37.78 m; the footpath falls from 38.5 m at the
  corner pavilion to 36.85 m at the north-east corner, and the Symonds Street footpath rises from
  38.7 m at the corner to 40.6 m at the north-west pavilion.
- In the LiDAR frame (local NZTM metres) the centre is at (107.520, 86.738) and the axis points at
  bearing 225.3° (grid), so the street front faces 135.3°. The axis is the bearing of most of the
  walls seen from above (`frame.axis_from: "walls"`): the building is wings at two angles.
- The streets: Grafton Road along the front (+z) and Symonds Street along the south-west range, as
  the name blades at the corner read in panorama C1kG (the first config said Symonds Street for the
  front).

## The sources: works in progress

Each of the three sources was taken while the building was being rebuilt:

- **The LiDAR** (LINZ, Auckland Part 1, 2024) was flown over the building on 18 May 2024 (the
  points' GPS times: 17 May, 22:08 to 22:28 UTC). Over the north-east half of the building its
  "roofs" are the temporary roofs of the scaffolds: between x = 9.5 and 14.5 m, from z = −8 to
  21 m, a level deck 16.3 m up (p5 to p95: 16.1 to 16.5 m, 1,266 points), the shape of the white
  wrap that the panoramas show; and in the 3 m in front of the wrapped street front, 137 points
  classed as vegetation stand 1 to 14 m up (the scaffold's tubes).
- **The aerial** (LINZ, Auckland Central 0.06 m, 2023) already shows the works: a site yard with
  stacked materials behind the building on the north-west, bare earth in its courtyards, and a
  band of pale boards about 1 m wide round each of the three north-east blocks, at the foot of
  their hipped roofs (scaffolds, not yet wrapped).
- **Street View.** The newest panoramas on Grafton Road, in front of the building, are of 2024-08:
  the north-east block wrapped whole in white sheeting on scaffolding, the middle in scaffolding and
  the corner pavilion in scaffolding. Behind, on the north-west, a panorama of 2025-05 still shows a
  wrapped block and a scaffold on the roof (see "References").

So most of the building cannot be checked against what stands there now. Before the works, the
panoramas of 2022-09 on Symonds Street show the south-west range whole: two storeys of red brick with
cream dressings between two cream pavilions with giant columns; and in 2024-10 (C1kG) the corner
pavilion and the range stand restored, out of their scaffolds, as they were. The LiDAR measured that
range's roof and parapet (a scaffold deck stood 1.7 m out from the parapet in May 2024, classed as
vegetation), and its plan and parapet agree with those panoramas. That range is drawn in detail; the
rest keeps the campus map's estimated block (see "On the site").

**What would let the rest be drawn**: Google panoramas on Grafton Road taken after the works (newer
than 2024-08), for the street front and its look; and, for the roofs, LiDAR flown after the works
(another LiDAR set is a new data source, for the maintainer). With newer panoramas alone the walls
could be drawn and checked, but the roofs of the wrapped blocks would stay unmeasured.

## On the site: the street range only (2026-10-23)

The maintainer chose to put on the site now only the south-west range on Symonds Street, the part
that panoramas show before the works (2022-09) and after them (2024-10). How to draw the whole
building is the maintainer's to decide later. So the model is two parts:

- **`southwest`**: the range and its two pavilions as round 1 drew them (below), at the measured
  sizes.
- **`rest`** (`parts/rest.js`): the rest of building 104 as the campus map draws it. Its footprint is
  the outline the map extrudes for block 104 (`src/shared/massing.ts`: floor G's own outline in
  `public/data/uoa/campus.json`, which floor 1 stacks on), taken into the view frame through
  `placement.json`, less the part on the range's side of the range's inner wall
  (x' ≤ −13.0 in the range's frame: the range and its corner pavilion stand wholly there, and the
  map's outline runs 3.0 to 3.7 m beyond the range's face toward Symonds Street). Its top is flat and
  stands where the map's block top stands: the map draws block 104 as 2 storeys of 3.6 m (7.2 m,
  `heightSource` "floor-count", `src/shared/massing.ts`) on its footing (`terrain.ts`: the DEM at
  the outline's middle, 38.60 m), so 45.80 m, which is y 8.97 over the DEM at the door (36.83 m).
  Its walls are plain and go down to y −2.0, below the DEM everywhere under it (its lowest is
  y −1.41). Nothing in it comes from the LiDAR or the photographs: the scaffold era's roofs, heights
  and shapes stay out. Round 1's LiDAR-measured rest (`parts/massing.js`, commit 83c449d) is not
  drawn.
- **Its finish.** In the walker views the rest's walls are `plain`: no texture and no shader, in the
  map's own wall colour for a teaching building by day (`0xfaf1dc`). That is the plainest finish
  that is honest: it claims no surface, as the map's block claims none, where cream render or brick
  would claim one that no photograph shows as it stands. The range's inner side, which no photograph
  shows either, is `plain` too above the rest's roof and, beyond block 104's outline, down to the
  ground by the recess. Two pieces are still brick that no photograph shows: the range mass's end
  face at its front end, about 3.9 m by 14.5 m, in the recess facing Grafton Road, and a strip about
  0.75 m wide along the top of the brick, where the low roof's valley dips below it. Its flat roof is `roofGrey`, the roofs'
  grey in the 2023 aerial. On the map the light form draws both in the map's colours (`roofGrey` is
  a roof in `LIGHT_ROLE`, `src/scene/landmarks.ts`).

What this gives (2026-10-23, against round 1):

- From above, the model covers 95.3% of block 104 on a 0.5 m grid (the 4.7% it does not cover is
  on the range's side of the map's outline, most of it beyond the range's face), and no other block
  of the campus map at all (136 Chiller: 0%), so `building.also` stays empty.
- The range's heights are round 1's (below), against the LiDAR's points over the range without the
  plane trees' crowns: parapet 14.30 m against 14.39 (the median along its outer edge), ridge 15.10
  against 15.15 (the median in a 1 m band along it). The model's highest point, 15.50 m, is the
  pavilions' pediments, sized from the photographs: over them the LiDAR has only the plane trees'
  crowns, 14.3 to 24 m. The rest's top is y 8.97, the map's block top to 0.01 m.
- 19,409 triangles in 7 draw calls (`render`, `paint`, `brick`, `void`, `glassPale`, `roofGrey`,
  `plain`); the rest is 113 of them.
- The building's card says that only the range is drawn in detail and that the rest keeps its
  estimated height: the config's `part` ("Its range on Symonds Street"), which `place` writes into
  `placement.json`.
- Against the photographs (`refine compare`): the nine views of 2022-09, which show the range, keep
  their refined cameras and an IoU of 0.58 to 1.0 (mean 0.883); C1kG (2024-10) falls from 0.72,
  0.83 and 0.98 to 0.38, 0.61 and 0.62, because behind the corner pavilion it sees the wrapped
  middle and north-east blocks, up to 16 m, where the map's block is 9 m high. The luma median of
  the building in the nine 2022-09 views is 126 in the photographs and 134 drawn. The Grafton Road
  views of 2024-08 show the wraps, which the map's block does not match: over all 33 views the mean
  IoU is 0.667, and the refine stage now corrects 4 panoramas' cameras, not 7.

## The first rough model (superseded)

The first rough model (164 triangles, commit 4e9f7bb) was drawn from the LiDAR on 4 m bands before
the references were looked at. Two things in it are not the building:

- **The "hall" along the south-west side, with its gable to 24 m, is the plane trees.** Along that
  side 1,953 points classed as building stand 17.5 to 25 m up (median 20.2 m), from x ≈ −30.5 to
  −15.5, where the trees' crowns overhang the roof; half of them have a vegetation point within
  1.5 m. Under them the south-west range's roof is a gable with its ridge at 15.0 to 16.7 m.
- **The roofs are drawn flat.** The LiDAR shows three gabled ranges side by side running toward the
  street, their ridges at x ≈ −20 (turned with the south-west range), −3.5 and 8.5, 15.1 to 16.7 m
  up, with valleys at 13.6 to 14.8 m; at the north-east end, three cross gables with their ridges
  along x at z ≈ 16, −3.5 and −20 (16.1 to 16.6 m). Some of these are the temporary roofs of the
  wraps (below), not the building's.

Measured from above against the LiDAR (`topview`, 2026-10-22, before the references): footprint
IoU 0.876, model minus LiDAR heights p10/p50/p90 −0.67/0.93/4.44 m, highest point 24.0 m against
the LiDAR's 24.87 m (the trees), 96.9% of building 104's block under the model.

## References

Within 120 m there are 54 panoramas: 51 of Google's own and 3 user-contributed (left out). The
twelve nearest of Google's were bought on 2026-10-22 (a dry run counted N = 1,672 tiles at zoom 5;
inside the free monthly quota; with the 43 of an earlier low-resolution look, 1,715 of the tier's
2,000). Eleven are pinned in `streetview.pano_ids`: the twelfth, `BCtN…` (undated), is a panorama
inside a cafe, not of the building. Views `*_wide.jpg` (hfov 95°), `*_upper.jpg` (40°) and
`*_door.jpg` (45°), aimed at the centre.

| Panoramas | Date | Where (view frame) | What they show |
| --- | --- | --- | --- |
| `OpqZ…`, `ctyQ…`, `m1hD…`, `zPP5…`, `LwAj…`, `iz57…` | 2024-08 | Grafton Road, z ≈ 31, x from −13 to 39: 9 m in front of the street front | the works: the north-east block (x ≈ 2.5 to 24.5) wrapped whole in white sheeting on scaffolding, up to a temporary gabled roof; the middle (x ≈ −10 to 2.5) a scaffold with a builder's banner; the south-west corner block (cream render, pilasters, brick panels, a cornice) in scaffolding, its ground floor wrapped; a hoarding along the footpath |
| `Uype…`, `nAxE…`, `e8T_…` | 2022-09 | Symonds Street, from off the corner (x -30, z 20) to the north-west (x -43, z -12.5) | before the works: the south-west range whole, red brick and cream dressings, with its two end pavilions, through the plane trees; in the morning sun from the north-east, the face in shade |
| `C1kG…` | 2024-10 | across the corner (x -32, z 40) | the corner pavilion and the south-west range restored, out of their scaffolds; the middle still in scaffolding and the north-east block wrapped |
| `xKYw…` | 2025-05 | behind, on the north-west (x -21, z -37) | still the works: a block wrapped in white sheeting, a scaffold on the roof behind it |

The cameras: two panoramas of 2022-09, nAxE and Uype, record their camera 3.4 and 3.8 m nearer the
range than they stood, and the refine stage cannot find that through the plane trees (13-14% sky
round the silhouette); their cameras were fitted to two lines in each photograph, the parapet top
and the plinth's foot on the footpath (0.1 m rms), and are set in the config
(`streetview.camera_fixes`). C1kG's camera is off by more than that (the model draws about twice the
photograph's size there) and is not fixed: that view is used for what the corner pavilion looks like.
From there the refine stage corrected seven panoramas' cameras within its ±3 m (nAxE and Uype among
them); ctyQ, OpqZ, xKYw and C1kG kept theirs (too little sky round the silhouette, or too little gain).

## Round 1 (October 2026)

Two agents and the lead. A usage limit stopped both agents at 10:24 NZDT, part way through their
rounds; the lead finished the round.

- **The south-west range** (`parts/southwest.js`, `southwest_range.js`, `southwest_kit.js`; the
  southwest agent): ten bays of red brick with cream dressings between two cream pavilions, as the
  panoramas of 2022-09 show it: eared architraves on the ground floor, the first floor on a sill band
  with a cream band at its upper panes, multi-pane windows, a dentilled cornice under the parapet; the
  pavilions with giant columns in antis between rusticated pilasters and segmental pediments; the
  corner pavilion's face on Grafton Road. Floor heights fitted to the photographs (plinth top 2.78 m,
  ground-floor glass 4.63-7.57, first-floor sill band 8.86-9.33, glass 9.66-12.55, cornice from
  12.77), the plan and the parapet (14.3 m) to the LiDAR. After the cut the lead opened what the
  range's mass hid (the north-west pavilion's double doors, the pavilions' three-light windows, the
  corner pavilion's windows on Grafton Road) and added the windows e8T_ shows on the range's
  north-west end.
- **The rest** (`parts/massing.js`; the rest agent): every other block fitted to the LiDAR's roof
  planes (rms 0.02-0.05 m), plainly: no windows, no ornament. The scaffold decks of May 2024 are left
  out (the 11.2 m deck in the street front's recess, lifts along the back). Not drawn since
  2026-10-23 (see "On the site"); the file is in commit 83c449d.
- **The look** (the lead): brick and cream render as shaders in the kit, measured against the
  2022-09 views in shade; the sun of those panoramas (config `light`); and, for the viewer only, the
  LiDAR's ground (`landscape.js`), so that the plinth meets the footpaths, which rise about 3 m from
  Grafton Road to the back of the range.

From above against the LiDAR (`topview`): footprint IoU 0.917; heights p10/p50/p90
-1.90/-0.04/0.06 m and 85% of cells within 0.5 m; without the plane trees' crowns over the south-west
side (class-6 points above 17.3 m west of x -14) -0.24/-0.04/0.06 m and 89%. Highest point 16.81 m
against the LiDAR's 17.24 m (p99.9 without the trees; 24.87 m with them). Ridges and eaves sampled
against the LiDAR (model / LiDAR, m): middle range 16.18 / 16.09, right range 16.64 / 16.56,
north-east front gable 16.55 / 16.46, the block behind 16.83 / 16.76 and its eave 14.23 / 14.17, the
south-west range's ridge 15.10 / 15.10-15.24 and its parapet 14.30 / 14.0-14.35. 93.4% of block 104
under the model, and no other block of the campus map by more than 2.3% (136 Chiller), so
`building.also` is empty.

Against the photographs (33 views, cameras refined): silhouette IoU 0.831 on average. The luma median
of the building region: in the 2022-09 views, the only ones that show the building's own surfaces,
126 in the photographs and 133 drawn (mean over 9 views; brick 61-63 against 63-65, cream 130-146
against 140-141); over all 33 views 153 and 138, because 21 of them show white wraps where the model
has plain cream render. The front views on Grafton Road (2024-08) are of the wraps: their IoU runs
from 0.38 (iz57's wide view, from the north-east end: the north-east wing drawn from the LiDAR of May
2024 runs further back than the wrap the photograph shows in August) to 1.0. 19,567 triangles in 6 draw calls (`render`, `paint`, `brick`, `void`,
`glassPale`, `roofPale`), the south-west range built in about 25 ms.

**On the map's ground.** The site stands a landmark on its own 8 m DEM at the door
(`placement.json`); there the DEM is 36.83 m, 0.95 m under the LiDAR's 37.78 m. Relative to the door,
the DEM stands 0.3-0.6 m higher than the LiDAR along the south-west range (the plinth's foot will look
a little buried there) and falls 1.43 m under the north-east wing, where the LiDAR falls 0.88 m: the
walls go down to y -2.0 there (-0.6 under the range, -1.2 under the corner pavilion), and no foot of
the model stands above the DEM.
