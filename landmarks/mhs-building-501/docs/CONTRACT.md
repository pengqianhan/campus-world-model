# Contract: M&HS Building (501)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** west-north-west (the frame's `-axis`, along the long block), **y** up from the frame's
  ground, 72.19 m NZVD2016, the LiDAR's ground at the door, on the plaza before the glazed box (the heights in
  `parts/common.js` were measured above 71.88 m, the median ground in the first crop box, and `H` moves them on),
  **z** north-north-east (`toStreet`, toward building 502); the frame's centre, at the top of the tower, at x = z = 0.
  `config/mhs-building-501.json`, `frame`. The campus's origin is about 1 km to the north: there the map's true north
  and NZTM's grid north differ by about 1 degree, so the map's metres and the frame's local NZTM metres lie about 19 m
  apart (`place` turns one into the other).
- The building's own frame: **u** east-south-east (`-x`), toward the plaza, and **w** toward 502 (`z`).
  `parts/common.js` gives `at(u, w)`, `plan(corners)` and `rect(u, w)`.
- What the LiDAR shows (`parts/common.js` holds the numbers; measured cell by cell after the review's round 1):
  - **the long block**, about 29.8 m, u -26 to -6 and w -6 to 10, a light well in its roof (25.8 m), its last 4 m to
    the tower at 28.5 m;
  - **the tower** at its east end, toward the plaza, u -2 to 9 and w -7 to 10: its **crown**'s flat top at 32.4 m,
    its edges falling to about 28 to 30 m;
  - **a plant room** of 34.6 m on the block's south side (u -13 to -4.5, w -7 to -3), **a lower part** south of it
    (30.5 and 28.6 m) on to w -11, past 501's ring at w -9.3 into 503's; **a concrete link** of 28.5 m on its north side
    (u -5.5 to -2) to 502;
  - **a glazed link** beside the tower's north side (u -2 to 0.5, w 10 to 15), which returns nothing (a glass roof),
    and, west of the concrete link, a strip 6 m wide between the block and 502 that returns nothing either;
  - **a glazed box** of 4.5 m before the tower's east face, to u 16.8;
  - inside the campus map's ring of 501, **the south edge of building 502**, its south wall at w 16, its roof rising
    from 28.8 m; and **the plaza** east of the tower, the ground and trees;
  - the ground about +0.3 round the building and 5.2 m below the door's beyond its west end: walls go down to `FOOT`,
    -5.3 m over the provisional ground.
- What it draws: what the LiDAR has inside block 501's ring, so that it stands over no part of the blocks of 502 and
  503 (and the block's south-west corner, over 501C's ring, a basement in the campus map).

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/tower.js`, `parts/block.js` (every part), `parts/shapes.js` (the shapes the parts share, as the Humanities
  Building's), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2, a large teaching building), merged by material. Round
  0: 244 triangles, 4 draw calls; round 1: 640, 5; after the review's rounds 1, 2 and 3: 395, 409 and 423, 5.

## Rounds
- Round 0 (2026-11-09): the tower's shaft (`renderGrey`), its crown (`roofGrey`) and the glazed box before it
  (`glass`), the long block, the plant room, the parts south and north of it (`renderGrey`, their roofs
  `roofGrey`), the atria (`glass`) and 502's south edge (`claddingPale`, its roof `roofGrey`), at the LiDAR's plans
  and heights. Silhouette IoU 0.470 in the photograph (0.893 in the model's screen box); the building's luma median
  196 against the photograph's 131 (the viewer's default light, the faces plain). The top view: footprint IoU 0.654
  (the LiDAR's 1,006 m² against the model's 1,510, both 995: the atria, which return nothing, are the model's only),
  64% of the 3,934 cells both cover within 0.5 m (p10/p50/p90 -0.43/0.13/4.04), the highest point 34.81 m against
  the LiDAR's 34.71 (p99.9); block 501 under the model 74.8% (its ring takes in the plaza), 501C 13.2%, 502 6.3%,
  503 4.5%.
- Round 1 (2026-11-09, the lead alone): the light well in the block's roof (its floor 26.3 m); the atria's tops at
  27 m and their floors' slabs every 3.8 m from 4.8 m, standing out of the glass (the photograph's glazed links,
  through its fitted camera: estimated), each atrium run 0.5 m into the walls it meets; the strip of windows up the
  middle of the tower's east face (`glass`, 5.0 to 26.7 m: estimated); the crown's band and slopes in `screenGrey`,
  its flat top `roofGrey`; the light (sun at 70 degrees round and 45 up, exposure 0.4: estimated). 640 triangles, 5
  draw calls. Silhouette IoU 0.894 in the model's screen box; the building's luma median 136 against the
  photograph's 131. The top view: footprint IoU 0.656, 65% of the 3,934 cells within 0.5 m (p10/p50/p90
  -0.45/0.12/1.45), block 501 under the model 74.7%.
- The door (2026-11-09): before the glass doors in the middle of the glazed box's east face, on the plaza (the campus
  map records no lobby or entrance in 501, OpenStreetMap none near it), the LiDAR's ground there 72.19 m (29
  returns, p50), 0.31 m over the crop's median: the frame's thresholds lowered by as much, the heights moved on to it
  through `H`, the photograph's view lowered by it, the measured frame unchanged (0.000 m, 0.000 degrees). The map's
  ground (its 8 m elevation model) at the door lies 1.26 m below the LiDAR's; under the model's plans it runs from
  1.42 m below the door's to 1.15 m above (FOOT -5.61 is under it everywhere). Silhouette IoU 0.893 in the model's
  screen box, luma 136 against 131; the top view as before, block 501 under the model 74.7% (its ring takes in the
  plaza, over the floors the campus map has below its ground), the LiDAR's roof inside that ring
  98.9% (899 m²); 501C 13.0%, 502 6.3%, 503 4.5%: `also` stays empty.
- On the site (2026-11-09): `site` true, the card's `estimated`; the faces check found glass and walls of different
  materials in one plane where the atria and the glazed box met the walls round them, and 502's south edge's foot in
  the link's: the box and the atria now run 0.5 m into the walls they meet and their glass starts 0.1 m over FOOT, the
  atria's ends stop 0.1 m short of 502's east end and their south faces 0.1 m inside the part south of the block, the
  link stops at 502's south wall and the plant room's ends stand 0.1 m inside that part. The foot check passes. Beside
  an open neighbour the model gives way to block 501, whose footprint stands above the drawn ground on 79% of its
  cells, by up to 1.67 m. 640 triangles, 5 draw calls; the comparison and the top view as at step 7.
- The review's round 1 (2026-11-09): the plans measured again cell by cell (the first reading of 2 m cells had put
  several edges 1 to 2.5 m off): 502's south wall at w 16, the block's west end at u -26, the plant room at u -13 to
  -4 and w -7 to -3; the model clipped to 501's ring (502's edge to 502's ring, the part south of the block to w -9.3);
  the atria along the block's whole length dropped (the LiDAR has a planted surface at the plaza's level on the
  south-west and nothing on the north-west), the glazed link kept beside the tower's north side only, where the
  photograph shows it; the card names every size estimated in the photograph. 395 triangles, 5 draw calls.
  Silhouette IoU 0.914 in the model's screen box, luma 136 against 126; the top view: footprint IoU 0.797, 72% of
  the 3,374 cells within 0.5 m (p10/p50/p90 -0.13/0.12/1.49); block 501 under the model 57.8%, the LiDAR's roof in
  its ring 92.9%; 502 0.0%, 503 0.4%, 501C 2.7%.
- The review's round 2 (2026-11-09): 502's edge drawn to 501's ring's north edge east of u -6.45, where the straight
  line to 502's ring had left a strip up to 1.9 m wide undrawn; the block's last 4 m to the tower at 28.5 m and the
  light well on to it (u -6); the plant room's east end at u -4.5 and the second part south of the block's at -1.5.
  409 triangles, 5 draw calls. Silhouette IoU 0.909 in the model's screen box, luma 136 against 129; the top view:
  footprint IoU 0.830, 78% of the 3,511 cells within 0.5 m (p10/p50/p90 -0.13/0.10/1.27); block 501 under the model
  60.0%, the LiDAR's roof in its ring 96.8%; 502 0.1%, 503 0.3%, 501C 2.7%.

## Rules
- Measure, don't guess: a size the LiDAR gives is taken from it; one it does not is estimated and said to be.
- The photograph (one, from the plaza about 67 m before the tower's east face; `refs/photos/`, gitignored) is a
  reference for the look: nothing is traced or sampled from it, and no size is measured from it but the crown's eave
  and band over the east face, the shaft's set-back under the crown, the glazed link's top and floors and the tower's
  strip of windows and the glazed box's beam, which are estimated through its fitted camera.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces of different
  materials in one plane.

## How to check
- `landmarks/pipeline/run.sh mhs-building-501 compare topview` (with `PORT` serving the repository): the strip in
  `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view in `out/topview/`. GPU steps only under
  `~/.campus-loop/gpu.lock`.
