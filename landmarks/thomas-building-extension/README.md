# Landmark: the Thomas Building Extension, drawn from code

The Thomas Building Extension (building 110N of the University of Auckland's campus map), a curved
building with a glass curtain wall over a rendered base, joined by a glazed link to the Thomas Building
(110), drawn in three.js from code alone and sized by the LINZ 2024 LiDAR, checked against two Street
View photographs of its face to the road (October 2026). The kit it is built with, the pipeline, the
viewer and how to run them are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=thomas-building-extension&view=orbit`
  with the repository root served on port 8765. The site does not draw it yet (`site` is false).
- Run its pipeline: `landmarks/pipeline/run.sh thomas-building-extension [stage ...]`.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/thomas-building-extension.json`, `frame`: x toward the road on the south-east (the axis, the
bearing of most of the walls, points north-west and x is minus it); y up from 34.6 m NZVD2016; z toward
the link and the Thomas Building on the south-west; the centre of the building's roof returns at
x = z = 0. A curved building has no one street face, and its walls give z either toward 110 or toward
the trees on the north-east.

The points the frame is measured from are the building's own: campus.json's outlines of 110N and 110
overlap by 0.6 to 1.0 m where the link meets 110, and within 1.5 m of 110N's outline the first data run
took 343 of 110's returns (its roof beyond the join, its parapet and wall beside the link), which pulled
the centre 0.78 m toward 110. `building.outline` ends the link at the join instead (`outline_note`), and
`campus_outline` keeps the map's ring.

## References

Two Google panoramas of August 2024 on the road to the south-east, bought on 2026-10-27 (286 tiles, none
since): `oWaF…`, which sees the flat south-east face and the curve, and `MOQA…`, which sees the curve
nearer square. Their metadata's `copyright` reads "From the Owner, Photo by: Google", as every
landmark's on the site does (the panoramas that people upload name them there instead). A University
banner hangs on the south-east face in both: it is not part of the model.

## Round 0 (October 2026, the lead)

The massing from the LiDAR: the main block's plan, its walls fitted to their returns and its curve
traced from the roof's edge; walls to the eave at 15.8 m; a pale metal roof rising from its edge
(16.3 m) 0.094 m a metre inward to the raised middle, a flat-roofed box at 19.86 m with plant on it; the
glazed link to 110 at 17.04 m. The curtain wall's foot estimated at 5.6 m.

## Round 1 (October 2026, the lead alone)

- **The cameras**, fixed first from each photograph's own edges against the LiDAR's lines
  (`streetview.camera_fixes`, its note says how): the south-east corner, the curtain wall's first edge,
  the roof's edge against the sky, the curve's right silhouette, the glass's foot along the curve and
  the kerb along the road. They stand 0.79 and 1.27 m from where their panoramas record them and turn
  2.2 and 2.9° to the left, and each photograph stands turned about 2° anticlockwise in its cut, as
  the panoramas' own tilt and roll turn it; the views are cut again turned level (camera_fixes' fifth
  number, the same code as the Kenneth Myers Centre's branch). The camera search (`refine`, with
  `keep_fixes`) would move `MOQA…`'s camera by 0.3 m and gain 0.003 in IoU: the fixed camera fits its
  silhouette. `oWaF…`'s search runs to its bounds (2.3 m, 3.0 m and 1.0 m up) for 0.07 more; why was
  not found (the Thomas Building, which the model does not draw, stands beside it in that
  photograph), and its fixed camera is kept.
- **The curtain wall**, measured through both cameras onto the curve: the glass's foot is the top of a
  dark beam at 4.13-4.33 m (its underside 3.8), and three storeys of glass run to 8.0, 12.25 and the
  eave, each storey's glass under a light head strip (8.0-8.27, 12.25-12.5) and a dark transom
  (8.27-8.5, 12.5-12.75); fins every 2.11 m along the curve, where `MOQA…`'s upper view has them.
- **The base**: the service doors measured through `MOQA…`'s wide view, which sees them nearer square
  (from 1.15 m along the south-east face round onto the curve to 3.59 m along it; sills at 0.13-0.17,
  heads at 2.63-2.66); `oWaF…`'s view, at a slant, puts them 0.4-1.3 m further along and its sills
  0.2-0.3 m higher. Three of the small windows further round, also through `MOQA…` (`oWaF…`'s, along
  the wall at a grazing slant, puts them 2-3 m earlier). The base in the kit's grey and the concrete
  face in its cream render, by their brightness in the photographs (parts/body.js); the exposure 1.2.
- **The plant** on the raised middle as the LiDAR shows it: a screen along its north-east side, its top
  22.70 m (35 returns, the building's highest point; the LiDAR's p99.9 is 22.79), and a unit at 21.21
  (36 returns), in place of round 0's box at 21.63.
- **The north-west corner**: campus.json's outline adds a small block there, which round 0 drew to the
  eave; the LiDAR has a tree there and no roof, and it is left out.

Against the photographs (`run.sh thomas-building-extension compare`), every camera set by
`camera_fixes`: silhouette IoU in the model's own screen box (the likeness limits are read there,
maintainer, 2026-10-27) 0.843, 0.957 and 0.854 over `MOQA…`'s wide, upper and door views and 0.812, 0.884
and 0.622 over `oWaF…`'s, mean 0.829 (tier 2's limit 0.60); over the whole frame 0.805. The IoU in the
box tells less than it seems: in the upper and door views the box is the whole frame, the photographs'
glass reflects the sky and the masks take it for sky (4-38% of the box), and the model, which fills the
box, scores 1 minus that share. In the wide views, where the box has edges, the model beats a plain block
filling the box (0.843 against 0.823 in `MOQA…`'s, 0.812 against 0.731 in `oWaF…`'s). The building's luma
median, drawn against photographed: 132/121, 131/130, 132/131, 138/139, 133/136 and 133/150 (the last,
`oWaF…`'s door view, 17 apart: `oWaF…`'s photographs are brighter than `MOQA…`'s on the same base). From
above (`run.sh thomas-building-extension topview`): footprint IoU 0.959 against the LiDAR, 92% of cells
within 0.5 m of its height (round 0: 88%), the model 0.10 m below it at the median, 99.4% of block 110N
under the model (the corner block left out) and 0.9% of block 110. 2,298 triangles in 8 meshes (round 0:
804 in 7).

## Heights against the LiDAR

Building returns of `data/thomas-building-extension_pts.npy` in the view frame; model / LiDAR (medians):
the roof 0.5-1 m in from its edge 16.37 / 16.38 (554 returns), 8.5-9 m in 17.12 / 17.14 (174); beside
the raised middle 16.36 / 16.34 (south-west, 106), 17.39 / 17.46 (north-east, 211), 16.86 / 16.98
(north-west, 199) and 17.13 / 17.15 (south-east, 145); the raised middle's roof 19.86 / 19.86 (1,218);
the plant's screen 22.70 / 22.69 (35) and unit 21.21 / 21.21 (36); the link's roof 17.04 / 17.00 (265).
Every one within 0.12 m (limit 0.5 m). In the roof's outer 0.2 m the LiDAR's returns are of two
heights (p25 15.64, p50 15.76, p75 16.49, p90 16.88: the fascia's face and a gutter behind its lip),
where the model has its fascia from the walls' top at 15.8 to the roof's edge at 16.3; a gutter at 15.81
over the outer 0.75 m, tried in round 1, cost 0.004-0.012 of IoU in the box in the wide views and gained
nothing from above, and was not kept. The highest point: 22.70 / 22.79 (the LiDAR's p99.9). The curtain
wall's storeys and the base's openings come from the photographs (above).

## Limits

- What no photograph shows is plain: the north-west, the north, the diagonal face and the roofs.
- The University banner on the south-east face is not drawn, nor the creeper on the base.
- The glass is the kit's pale glass, without the photographs' green tint and without the offices' window
  frames that show through it; the base's render is the kit's grey and the concrete its cream render.
- The walls go down to `FOOT` (-1.6 m) all round; in the viewer, which draws no ground here, they show
  below the forecourt.
- The beam's depth out from the base and the fins' depth are estimated.
