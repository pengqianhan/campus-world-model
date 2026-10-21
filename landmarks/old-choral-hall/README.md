# Landmark: Old Choral Hall, drawn from code

Old Choral Hall (building 104 of the University of Auckland's campus map), on Symonds Street, drawn
in three.js from code alone and sized by the LINZ 2024 LiDAR, by a lead agent and a team of agents
(October 2026). Every source shows the building during building works (see "The sources: works in
progress"), except the panoramas of 2022-09 of its south-west range. So that range, with its two end
pavilions, is drawn in detail as those panoramas show it, and the rest of the building plainly, at
the LiDAR's sizes, with no windows or ornament. The kit, the pipeline and the viewer are shared by
every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=old-choral-hall&view=orbit`
  with the repository root served on port 8765. It is not on the site.
- Run its pipeline: `landmarks/pipeline/run.sh old-choral-hall [stage ...]`.

| File | What it is |
| --- | --- |
| `config/old-choral-hall.json` | the building (104), the LiDAR and aerial tiles, the frame, the twelve Street View panoramas (`streetview.pano_ids`) |
| `model.js` | assembles the parts: `southwest`, `massing` |
| `parts/` | one file per part (`southwest.js`: the south-west range and its pavilions; `massing.js`: the rest, plainly) and `common.js` (the sizes measured in the LiDAR) |
| `docs/` | the rules the agents worked to: `CONTRACT.md`, `ART_BIBLE.md` |

## The frame

- View frame: x to the right as seen from Symonds Street on the south-east, y up from the ground in
  the middle of the street front (37.7 m NZVD2016, provisional: the street falls from 38.8 m at the
  south-west end to 36.8 m at the north-east), z toward the street.
- In the LiDAR frame (local NZTM metres) the centre is at (107.520, 86.738) and the axis points at
  bearing 225.3° (grid), so the street front faces 135.3°. The axis is the bearing of most of the
  walls seen from above (`frame.axis_from: "walls"`): the building is wings at two angles.

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
- **Street View.** The newest panoramas on Symonds Street, in front of the building, are of 2024-08:
  the north-east block wrapped whole in white sheeting on scaffolding, the middle in scaffolding and
  the corner pavilion in scaffolding. Behind, on the north-west, a panorama of 2025-05 still shows a
  wrapped block and a scaffold on the roof (see "References").

So most of the building cannot be checked against what stands there now. Before the works, the
panoramas of 2022-09 on the south-west street show the south-west range whole: two storeys of red brick
with cream dressings between two cream pavilions with giant columns. The LiDAR measured that range
unwrapped, and its plan and parapet agree with those panoramas. That range is drawn in detail; the
rest is drawn plainly, as the rules say for what no photograph shows.

**What would let the rest be drawn**: Google panoramas on Symonds Street taken after the works (newer
than 2024-08), for the street front and its look; and, for the roofs, LiDAR flown after the works
(another LiDAR set is a new data source, for the maintainer). With newer panoramas alone the walls
could be drawn and checked, but the roofs of the wrapped blocks would stay unmeasured.

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
twelve nearest of Google's are pinned in `streetview.pano_ids` and were bought on 2026-10-22
(1,672 tiles at zoom 5, inside the free monthly quota; with the 43 of an earlier low-resolution
look, 1,715 of the tier's 2,000). Views `*_wide.jpg` (hfov 95°), `*_upper.jpg` (40°) and
`*_door.jpg` (45°), aimed at the centre.

| Panoramas | Date | Where (view frame) | What they show |
| --- | --- | --- | --- |
| `OpqZ…`, `ctyQ…`, `m1hD…`, `zPP5…`, `LwAj…`, `iz57…` | 2024-08 | Symonds Street, z ≈ 31, x from −13 to 39: 9 m in front of the street front | the works: the north-east block (x ≈ 2.5 to 24.5) wrapped whole in white sheeting on scaffolding, up to a temporary gabled roof; the middle (x ≈ −10 to 2.5) a scaffold with a builder's banner; the south-west corner block (cream render, pilasters, brick panels, a cornice) in scaffolding, its ground floor wrapped; a hoarding along the footpath |
| `Uype…`, `nAxE…`, `e8T_…` | 2022-09 | the south-west street, from off the corner (x -30, z 20) to the north-west (x -43, z -12.5) | before the works: the south-west range whole, red brick and cream dressings, with its two end pavilions, through the plane trees; in the morning sun from the north-east, the face in shade |
| `xKYw…` | 2025-05 | behind, on the north-west (x -21, z -37) | still the works: a block wrapped in white sheeting, a scaffold on the roof behind it |
