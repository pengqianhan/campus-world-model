# Contract: Sir Owen G Glenn Building (260)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-west (the frame's `-axis`), **y** up from the frame's ground (24.46 m NZVD2016,
  the median ground in the crop box, 25 m round the outline; to be the LiDAR's ground at the config's `door`, step
  7), **z** north-west (`toStreet`); the frame's centre at x = z = 0. `config/owen-g-glenn-building.json`, `frame`.
  The site falls about 28 m across the crop, from the road on the west to the gully on the east.
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
    the west): walls go down to `FOOT`, -14.0 m.

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
