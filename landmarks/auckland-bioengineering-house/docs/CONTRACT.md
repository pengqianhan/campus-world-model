# Contract: Auckland Bioengineering House (439)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** west (the frame's `-axis`), **y** up from the LiDAR's ground at the config's `door`
  (59.75 m NZVD2016, on the landing at the top of the steps from Symonds Street before the tower's north face),
  **z** north (`toStreet`); the frame's centre at x = z = 0. `config/auckland-bioengineering-house.json`, `frame`.
  The site falls about 20 m across the crop, steeply toward the east.
- The heights in this file and in `parts/common.js` were measured before the door was set, above 57.96 m (the
  median ground in the crop box, 25 m round the outline): 1.79 m under the door's ground. `H` in `parts/common.js`
  moves each on to it.
- The building's own frame: **u** east (`-x`) and **w** north (`z`). `parts/common.js` gives `at(u, w)`,
  `rect(u, w)`, `plan(corners)` and `inset(corners, d)`.
- What the LiDAR shows (`parts/common.js` holds the numbers):
  - **the tower**, its plan a rectangle with its four corners cut, its roof at 38.73 m inside a top edge at 39.6 m;
  - **the plant room** on its roof, its top at 43.52 m;
  - **the lower building** round the tower's north and east sides, its flat roof at 8.54 m, with a strip at 11.28 m
    along the tower's east face and a part at 11.3 m before its north face;
  - the ground round the plans from -18.11 m (east of the lower building, where the site drops) to +2.3 m (Symonds
    Street to the north-west): walls go down to `FOOT`, -18.5 m.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/building.js` (every part, rounds 0 and 1), `parts/shapes.js` (the shapes the parts share, as 421W's),
  `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 256 triangles, 2 draw
  calls.

## Rounds
- Round 0 (2026-11-08): the tower, its parapet and plant room, the lower building and the two parts on it, as blocks
  at the LiDAR's plans and heights; walls in the kit's `claddingPale`, roofs `roofGrey`. Silhouette IoU 0.920 in the
  photograph (0.921 in the model's screen box); the building's luma median 242 against the photograph's 181 (the
  viewer's default light, the faces plain). The top view: footprint IoU 0.921 (the LiDAR's 1,240 m² against the
  model's 1,159, both 1,150), 81% of the 4,549 cells within 0.5 m (p10/p50/p90 -2.01/0.0/0.08: the things on the
  tower's roof, which round 0 does not draw), the highest point 43.53 m against the LiDAR's 44.43 (p99.9); block 439
  under the model 91.0%.
- Round 1, the faces and the light (2026-11-08): the tower's walls and parapet in the kit's `glass`; on its north
  face two stone fins (`concrete`) standing 0.35 m out of it and up to 40.2 m, the first at the LiDAR's returns (u
  -5.0 to -3.0), the second estimated with the photograph as a reference (u -12.7 to -11.0, as high and deep as the
  first). The viewer's light estimated (`config`'s `light`): the sun at 20 degrees round and 40 up, an exposure of
  1.4. Silhouette IoU 0.922 (0.923 in the box); the building's luma median 179 against the photograph's 181. 280
  triangles, 4 draw calls; the top view as round 0.
- The door (step 7, 2026-11-08): the entrance is under the sign on the tower's north face, as the photograph shows
  it (the campus map records no lobby or entrance in 439, and OpenStreetMap none near it): glass doors under a
  sloping glazed roof before the face, reached by steps and a ramp from the footpath of Symonds Street. The door is
  on the landing at the top of the steps, 1.9 m out from the tower's north face (u -15, w 12.5): its u from the
  doors' foot in the photograph through its fitted camera, its w from the LiDAR's ground, which steps down from the
  landing between w 13 and 14.5 (the camera stands too near the landing's level for a w through it). The LiDAR's
  ground there 59.75 m (11 returns within 1 m, p10/p90 59.738/59.762), the footpath below the steps 59.1 to 59.2 m.
  The config's ground is the door's; the frame's thresholds were lowered by the same 1.79 m, so the measured frame
  is the expected one (0.000 m, 0.000 degrees), and the photograph's camera (gitignored `refs/photos/views.json`)
  moved down with it. Silhouette IoU 0.919 (0.920 in the box), the luma median 176 against the photograph's 182;
  the top view: footprint IoU 0.921, 81% of the 4,547 cells within 0.5 m (p10/p50/p90 -1.98/0.0/0.09, its cells
  above 2.5 m now counted from the door's ground), the highest point 41.74 m against 42.64; block 439 under the
  model 91.0%, and no other block under it (`building.also` is empty). `place`: the door at (-237.29, -406.96) on
  the map, where the map's ground lies 6.57 m under the LiDAR's.
- On the site (step 8, 2026-11-08): `site` is true, and the site draws the model in place of block 439. It stands
  alone (no other landmark's outline comes within 2 m of its), its y = 0 on the map's ground at its door. The foot
  check of `tests/landmarks.test.ts` passes: every material's lowest points are no more than 0.25 m above the map's
  ground. No new roof, pane or opening material: `glass` is glass and `roofGrey` a roof in `LIGHT_ROLE` already, and
  `claddingPale` and `concrete` are walls. The card's `estimated`: with a photograph as a reference, the second fin's
  place; the parapet; the faces no photograph shows. 280 triangles, 4 draw calls.
- Not drawn: the sloping glazed roof over the entrance (the LiDAR has no returns from it, so neither its height nor
  its slope is known) and the recess stepped into the north face's west end and the north-west cut over several
  floors (the photograph shows its dark soffits; the LiDAR, which sees the roof, gives neither its plan nor how deep
  it is).

## Rules
- Measure, don't guess: a size the LiDAR gives is taken from it; one it does not is estimated and said to be.
- The photograph (one, from Symonds Street to the north-west, about 32 m from the tower's north face;
  `refs/photos/`, gitignored) is a reference for the look: nothing is traced or sampled from it, and no size is
  measured from it but the second fin's place, which is estimated.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces of different
  materials in one plane.

## How to check
- `landmarks/pipeline/run.sh auckland-bioengineering-house compare topview` (with `PORT` serving the repository):
  the strip in `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view in `out/topview/`. GPU steps
  only under `~/.campus-loop/gpu.lock`.
