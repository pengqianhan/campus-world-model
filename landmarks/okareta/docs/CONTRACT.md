# Contract: Okareta (215)

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** south-west (the frame's `-axis`), **y** up from the frame's ground, 36.16 m NZVD2016, the
  median ground in the crop box, 25 m round the outline (provisional: the LiDAR's ground at the door at step 7),
  **z** north-west (`toStreet`, Symonds Street); the frame's centre, the house's, at x = z = 0.
  `config/okareta.json`, `frame`.
- The building's own frame: **u** north-east (`-x`) and **w** to the street (`z`). `parts/common.js` gives
  `at(u, w)`, `plan(corners)` and `rect(u, w)`.
- What the LiDAR shows (`parts/common.js` holds the numbers):
  - **the house**, a T of two storeys about 12.6 m along the street and 12 m deep, its walls from u -5.85 to 6.7;
  - **the south-west wing**, from the back to the front under a hipped roof, its ridge across the front at u -3.5,
    10.7 m, with a canted **bay** at its front (its eave's front at w 5.75);
  - **the north-east part**, under a hipped roof whose ridge runs along the front at w -1.75, 10.7 m, from the wing's
    roof to its north-east hip;
  - the eaves of both at 8.7 m; **a low roof** behind the north-east part's south-west end falling from 9.2 to
    8.65 m; **a porch** behind the north-east part, its flat roof at 3.2 m;
  - **the verandah** before the north-east part's front, its outer edge at w 4.3;
  - the street trees stand over the front up to 25 m, and some of their returns are classed as building: the roofs
    are read below 12.5 m;
  - the ground about +0.2 to +0.8 on the street side and -3.0 behind (a lower floor there), -3.6 in the passage on
    the south-west side: walls go down to `FOOT`, -3.9 m.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/house.js` (the house and its porches), `parts/facade.js` (the windows, the door and the bay's cornice),
  `parts/shapes.js` (the shapes the parts share, as the Humanities Building's), `model.js`: the lead.

## Budget
- Whole building ≤ 150k triangles and ≤ 12 draw calls (tier 1, a house of the 1880s), merged by material. Round 0:
  165 triangles, 2 draw calls; round 1: 417 triangles, 4 draw calls.

## Rounds
- Round 0 (2026-11-09): the walls (`trim`) with the cornice under the eaves, the two hipped roofs and the low roof
  behind (`roofGrey`), the verandah's roof and posts, the porch behind, at the LiDAR's plans and heights. Silhouette
  IoU 0.751 in the photograph (0.751 in the model's screen box); the building's luma median 155 against the
  photograph's 125 (the viewer's default light, the faces plain). The top view: footprint IoU 0.900 (the LiDAR's
  176 m² against the model's 179, both 168), 81% of the 662 cells within 0.5 m (p10/p50/p90 -6.8/0.0/0.27: the
  cells where the model is lower are the trees' over the front), the highest point 10.7 m against the LiDAR's
  19.98 (p99.9, the trees); block 215 under the model 98.7%.
- Round 1 (2026-11-09, the lead): the windows arched at their heads (`glass`) in their moulded surrounds (the kit's
  `render`): three over the verandah and two under it, the front door, two on each storey of the bay's face; the
  cornice round the bay between its storeys; the bay's face widened to where the photograph's windows and corners
  fall (u -1.15 to -5.45), its corners canted; the verandah's floor on a plinth, its ceiling, frieze, six posts and
  balustrade, its eave at 4.5 m. Their places and heights are estimated: the photograph's edges carried through its
  fitted camera onto the walls' planes. The light: the viewer's sun behind the house, 200 degrees round and 40 up, an
  exposure of 0.75. Silhouette IoU 0.776 (0.776 in the box); the luma median 130 against the photograph's 126.

## Rules
- Measure, don't guess: a size the LiDAR gives is taken from it; one it does not is estimated and said to be.
- The photograph (one, from the footpath before the house, about 18 m from its front; `refs/photos/`, gitignored) is
  a reference for the look: nothing is traced or sampled from it, and no size is measured from it but the places and
  heights of the windows, the door, the bay's face and cornice and the verandah's eave, floor and posts, which are
  estimated.
- Walls go down to `FOOT`. Where two parts meet, one's plan runs into the other's: no two faces of different
  materials in one plane.

## How to check
- `landmarks/pipeline/run.sh okareta compare topview` (with `PORT` serving the repository): the strip in
  `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view in `out/topview/`. GPU steps only under
  `~/.campus-loop/gpu.lock`.
