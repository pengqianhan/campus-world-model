# Contract: M&HS Building (507)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** north-north-east (the frame's `-axis`), **y** up from the door's ground (68.50 m NZVD2016,
  the LiDAR's ground at the door; the heights in `parts/common.js` are measured above 68.03 m, the median ground in the
  first crop box, and `H` moves them), **z** east-south-east (`toStreet`, toward the street); the frame's centre, the
  middle of the building's roofs, at x = z = 0. `config/mhs-building-507.json`, `frame`: the building's returns over
  10 m, the centre from those over 17 m (over the first ground), the axis along its walls (bearing 198.3 deg, as 501's
  and 502's). The campus's origin is about 1 km to the north: the map's metres and the frame's local NZTM metres lie
  about 18.5 m apart (`place` turns one into the other).
- The building's own frame: **u** south-south-west (`-x`), along the south-east block's street face, **w** toward the
  street (`z`). `parts/common.js` gives `at` and `plan`.
- What the LiDAR shows (`parts/common.js` holds the numbers): the roofs at about 18 m (the cells 17.8 to 18.2) over the
  south-east block along the street (its face from w 31.85 at u 3.6 to 33.2 at u 40, 2 degrees off the axis, to u
  44.3), the north-west block (u -41.2 to -10, w -43.4 to 4.6) and the three glazed steps between them (fronts at w
  10.75, 16.3 and 22.2, sides slanting 17 degrees); raised parts at 20.8, 19.25 and 19.1; a lower part at 9.65, one at
  5.5 and a strip at 9.35; the entrance canopy at 5.15. The LiDAR's roofs run up to 4.9 m past the campus map's ring in
  places (the north-west block's west side and corner, the canopy's front), and no other block lies within 6 m of it:
  the model draws the LiDAR's building. Lower roofs west and north of it (3 to 10 m), outside the ring, are other
  buildings: not drawn.
- Walls go down to `FOOT`, 4.97 m under the door's ground (the ground round the building lies from -0.6 to +1.0 over
  the first ground, in the sunken courtyard between the blocks at -4.1).

## Who owns what
- `parts/common.js` (the measured sizes and the frame), `parts/block.js`, `parts/shapes.js` (the Humanities
  Building's), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 494 triangles, 4 draw
  calls; after the review's round 1: 510, 4.

## Rounds
- Round 0 (2026-11-09, the lead alone): the plans at the LiDAR's edges, flat roofs; the street face's finned upper
  storeys (`screenBlack`) from 7.75 m (estimated, through the photograph's fitted camera) over its glazed base
  (`glass`), the steps' fronts glazed and their sides dark, the canopy dark, the faces no photograph shows plain
  (`grey`), the roofs `roofGrey`; the light. Silhouette IoU 0.970 in the model's screen box; luma 141 against 146. Top
  view: footprint IoU 0.874, 89% of 13,418 cells within 0.5 m, highest 20.81 against 20.92; block 507 93.4% under the
  model.
- The review's round 1 (2026-11-09): every plan back to the LiDAR's edges where it ran past them over open ground (the
  low strip at the south end from w 18.55, not 16; the south-east block's west side over the sunken courtyard 2
  degrees off the axis, w 2.27 to 3.85, not 2; the part at 5.5 to u 5.25; the raised parts about 1 m in); the
  canopy on before the third bay. Silhouette IoU 0.969 in the box, luma 142 against 147; top view: footprint IoU
  0.887, 91% of 13,453 cells within 0.5 m; block 507 93.1% under the model.

## Rules
- Measure, don't guess: a size not from the LiDAR is named in the config's `estimated`, here and on the card.
- No two faces of different materials in one plane; every wall down to `FOOT`.
- The photograph is a reference only: never traced, sampled or published; it stays in the gitignored `refs/photos/`.
