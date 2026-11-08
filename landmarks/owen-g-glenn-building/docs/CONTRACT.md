# Contract: Sir Owen G Glenn Building (260)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-west (the frame's `-axis`), **y** up from the frame's ground (29.62 m NZVD2016,
  the LiDAR's ground at the config's `door`, on the plaza before the canopy; from 24.46 m, the median ground in the
  crop box, before step 7), **z** north-west (`toStreet`); the frame's centre at x = z = 0.
  `config/owen-g-glenn-building.json`, `frame`. The site falls about 28 m across the crop, from the road on the west
  to the gully on the east.
- The building's own frame: **u** north-east (`-x`) and **w** north-west (`z`). `parts/common.js` gives `at(u, w)`,
  `rect(u, w)` and `plan(corners)`.
- What the LiDAR shows (`parts/common.js` holds the numbers; every plan traced from it):
  - **the deck**, the plaza north-east of the curved wing and the floors under it, its top the plaza's at 29.58 m;
    the LiDAR counts the plaza as ground;
  - **the curved wing**, a Y of three arms round a curve, its roof at 52.83 m, the crown of louvres along its inner
    face to 53.8 m, and **the top storey** along the west side of its north and south-west arms at 56.57 m;
  - **the west wing** along the road on the west at 46.06 m, and a lower part west of its north end at 35.13 m;
  - **the north-east building** on the deck north-east of the plaza at 35.85 m;
  - **the sloping canopy** in the curve's inner corner, a triangle in plan, its top a plane fitted to its returns
    (33.65 m at its north end, 34.5 m at its east end, rising south-west into the curve);
  - the ground within 3 m round the deck from 10.98 m (east of the east arm, where the site drops) to 31.21 m (on
    the west): walls go down to `FOOT`, -14.0 m above 24.46 m (-19.16 m above the door's ground).
- `parts/common.js` measures every height above 24.46 m, and its `H` moves it on to the door's ground (5.16 m
  higher).

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/building.js` (every part, rounds 0 and 1), `parts/shapes.js` (the shapes the parts share, as Auckland
  Bioengineering House's), `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 1,447 triangles
  (`building` 1,351, `northEast` 96), 2 draw calls. Round 1: 3,403 triangles (`building` 3,307, `northEast` 96), 7
  draw calls.

## Rounds
- Round 0 (2026-11-09): the deck, the curved wing and its top storey, the west wing and the part west of it, the
  north-east building and the canopy, as blocks at the LiDAR's plans and heights (the canopy's top sloping); walls
  in the kit's `claddingPale`, roofs `roofGrey`. Silhouette IoU 0.873 in the photograph (0.873 in the model's screen
  box, where the photograph shows 52.7% sky), without the north-east building (below); the building's luma median
  168 against the photograph's 194 (the viewer's default light, the faces plain). The top view: 85% of the 22,683
  cells within 0.5 m (p10/p50/p90 -0.94/0.01/0.22), the highest point 32.12 m against the LiDAR's 32.5 (p99.9);
  footprint IoU 0.593 (the LiDAR's 5,965 m² against the model's 9,663, both 5,818: the deck's top, the plaza, which
  the LiDAR counts as ground); block 260 under the model 85.7%, block 219 6.5%.
- Round 1 (2026-11-09, the lead): the curved wing in bands, estimated with the photograph as a reference (its edges
  on the east arm's inner face through its fitted camera, on the face's plane, scaled so that its foot and its crown
  fall at the plaza's 29.6 m and the crown's 53.8 m): the open ground storey and two glazed storeys to 41.4 m in the
  kit's `glass`, then three storeys of a white spandrel (`paint`) and a band of louvres and windows (`glassPale`),
  3.4 m apart, and a white fascia from 51.6 m to the roof; the crown of louvres (`screenSilver`, 0.3 m wide,
  estimated) to 53.8 m along the sides the LiDAR shows it on; the canopy's top in `screenSilver` over glass; the
  deck's walls `grey`; the parts the photograph does not show (the top storey, the west wing and the part west of
  it, the north-east building) plain. The light: the viewer's sun where the sun stood when the photograph was taken
  (61.7 degrees round, 65.8 up), exposure 0.75. Silhouette IoU 0.904 (0.904 in the box); luma median 198 against the
  photograph's 193. The top view: 86% of the cells within 0.5 m (p10/p50/p90 -0.91/0.02/0.22), the rest as round 0.
- Step 7 (2026-11-09): the door on the plaza before the glazed front under the canopy, 1.5 m out from the middle
  of the canopy's low edge (`door` in the config: the photograph shows that front, a banner in it and a dark wall
  with lettering beside it; its doors are not made out; the campus map records no lobby or entrance in 260, only a
  reception on level 0, below the plaza, and OpenStreetMap no entrance near it). The LiDAR's ground there, 29.62 m,
  is the frame's ground: the frame's thresholds lowered by the 5.16 m, the heights moved by `H`, the photograph's
  camera lowered with them; `measure` gives the expected frame (0.000 m, 0.000 degrees). With the ground at the
  door, the comparison counts the model more than 4 m above it (the config's `refine.min_height_m`), so the plaza on
  the deck no longer counts as model: silhouette IoU 0.763 (0.763 in the box, where the photograph shows 76.0% sky);
  the luma, on those parts, 110 against the photograph's 164 at exposure 0.75, so the exposure is set at 1.5: 160
  against 164. The top view, on this ground: 90% of the 21,331 cells within 0.5 m (p10/p50/p90 -0.34/0.02/0.22),
  footprint IoU 0.931 (the LiDAR's 5,765 m² against the model's 5,537, both 5,448: the deck's top is at the ground
  now, under the 2.5 m the footprint counts from), the highest point 26.96 m against the LiDAR's 27.34; block 260
  under the model 48.8% (the plaza, at the ground, is not under it), block 219 6.5%: `also` stays empty.
- The map's ground (its 8 m elevation model) runs as a slope from the streets down to the gully under the deck: at
  the door it lies 6.18 m below the LiDAR's, 4.15 m below at the plaza's north edge, 1.3 to 1.5 m below on the road
  on the west, level with it on the driveway on the north, 7.68 m above it in the gully on the east. The site stands
  the model on the map's ground at the door, so the plaza there is drawn 6.18 m lower than it stands, and along the
  deck's plan the map's ground runs from 3.61 m below the model's y = 0 to 6.82 m above it.
- On the site (step 8, 2026-11-09): `site` is true, and the site draws the model in place of block 260. It stands
  alone (no other landmark's outline comes within 2 m of its), its y = 0 on the map's ground at its door. The foot
  check of `tests/landmarks.test.ts` asks each material that comes down to the door's ground to come down to the
  map's: the deck's top is the door's ground, and the map's ground round the deck falls up to 3.61 m below it, so
  every part on the deck takes its walls down to `FOOT` inside the deck (their feet a few centimetres apart), and the
  deck is drawn in one material, `grey`, its top (the plaza's paving) too. No new roof, pane or opening material:
  `glass` and `glassPale` are glass and `roofGrey` a roof in `LIGHT_ROLE` already; `grey`, `paint`, `screenSilver` and
  `claddingPale` are walls. The card's `estimated`: some heights, with a photograph as a reference; the crown's
  width; the top of the strip between the west wing and the curved wing, which the LiDAR does not see; the faces no
  photograph shows. 3,207 triangles (`building` 3,111, `northEast` 96), 7 draw calls; the comparison and the top view
  as at step 7.

## Rules
- Measure, don't guess: a size the LiDAR gives is taken from it; one it does not is estimated and said to be.
- The photograph (one, from the north edge of the plaza, looking south across a raised lawn at the curved wing's
  inner face; `refs/photos/`, gitignored) is a reference for the look: nothing is traced or sampled from it, and no
  size is measured from it but the heights of the curved wing's bands of faces, which are estimated. It was taken
  in December 2018, before the north-east building that the 2023 aerial and the 2024 LiDAR show: from where it was
  taken that building's south-west wall would fill its left quarter, and the photograph shows the plaza there. So
  the comparison leaves that part out (`QUERY="only=building"`); the top view takes in every part.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's, or one stands on the other's
  roof: no two faces of different materials in one plane.

## How to check
- `QUERY="only=building" landmarks/pipeline/run.sh owen-g-glenn-building compare`, then
  `landmarks/pipeline/run.sh owen-g-glenn-building topview` (with `PORT` serving the repository): the strip in
  `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view in `out/topview/`. GPU steps only under
  `~/.campus-loop/gpu.lock`.
