# Landmark: Alfred Nathan House, drawn from code

Alfred Nathan House (building 103 of the University of Auckland's campus map), drawn in three.js from
code alone and sized by the LINZ 2024 LiDAR, checked against five Street View photographs from
Princes Street and the campus path east of it (October 2026). It is two buildings in one block of the
map: the two-storey house on Princes Street, its front two canted bays and a porch under a bowed
balcony, and the four-storey block that runs 38 m behind it. The kit it is built with, the pipeline, the viewer and how to run
them are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=alfred-nathan-house&view=orbit`
  with the repository root served on port 8765. It is not on the site yet.
- Run its pipeline: `landmarks/pipeline/run.sh alfred-nathan-house [stage ...]`.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

| File | What it is |
| --- | --- |
| `model.js` | assembles the parts: `block`, `house` |
| `parts/` | `block.js` (the four-storey block: its seamed cladding, the east end's frame and glazing, its grey roof and plant room, the lowest storey and steps at the east end), `house.js` (the house, its cornice and parapet, the canted bays, the porch and the bowed balcony over it), `shapes.js` (the hipped roof of four pitches, the bowed front), `common.js` (the sizes measured in the LiDAR) |
| `config/alfred-nathan-house.json` | the building (103), the LiDAR and aerial tiles, the frame, the ground and the door, the five Street View panoramas |
| `placement.json` | where it stands on the campus map (written by the `place` stage) |

## The frame

- View frame: x to the right as seen from Princes Street on the west-north-west, y up from the
  ground at the foot of the house's front steps (45.75 m NZVD2016), z toward the street; the centre
  of the block's roof at x = z = 0.
- The building is 50 m long and only its west end faces a street, so the axis is the walls' turned
  90° (`frame.axis_across`, added to `measure.py` for this building): z runs along the building, from
  the block's east end (z -20) to the house's front (z 26-30). Axis bearing 19.99° (grid); the front
  faces 289.99°.
- The centre is the mean of the building points above 11.75 m within 2 m of the outline (the
  General Library stands 5-8 m away): the block's roof, and a tree's crown over the house that the
  LiDAR classes as building, which pulls it about 1 m toward the street.
- In the LiDAR frame (local NZTM metres) the centre is at (23.908, 161.163). On the map
  (`placement.json`): the centre at (20.920, 161.593), x at 198.93° and z at 288.93° (true); the
  door at (-8.50, 171.37).

## References

Of the 53 panoramas within 120 m, the 13 Google ones within 70 m were looked at in low resolution
(zoom 3, 88 tiles); five show the building and 638 zoom-5 tiles were bought for them: 726 tiles for
this building. Three on Princes Street (2024-07, 48-49 m from the centre, 18-20 m from the house's
front) see the house's front, the block's top behind it; two on the campus path east of the block
(2025-05) see its east end and, at a slant, its long side toward the library. The others stand too
close to the east wall, behind a bus, or see the General Library and trees. User-contributed
panoramas are not used. No photograph shows the long side toward the Clock Tower whole, nor the
house's back.

## Round 0 (October 2026, one agent alone)

From the LiDAR, then from the photographs. The block: grey walls with standing seams, eaves level at
13.3 m, a hipped roof of four planes of different pitch fitted to its roof points (rms 0.21 m), the
plant room; its east end a grey frame round three bays of veiled glazing on pale bands, the storeys
taken from fF8q's photograph, and the lowest storey set back over a landing and steps. The house:
white walls, a bracketed cornice and a balustraded parapet with pedestals and finials, quoins, two
canted bays with slate tops, the porch up eight steps behind three round-headed openings, dark red
doors (a paint the kit gains for them), the balcony bowed over it; the widths of the bays and the
porch from vZGe's photograph. The viewer's light is the Clock Tower's at exposure 0.74 (the house's
paint at the photographs' luma).

- From above against the LiDAR: footprint IoU 0.916, heights p10/p50/p90 -0.18/0.01/0.23 m, 92% of
  cells within 0.5 m; highest point 18.55 m (LiDAR p99.9 18.73); 98.9% of block 103 under the model
  and under 0.5% of any other block. Eaves 13.3 (LiDAR 13.3-13.5), the roof's apex 16.5 (its ridge
  16.0-16.25), the house's parapet 11.45 (11.45), roof 10.25 (10.15-10.35), bays 8.9 (8.87), the
  balcony's entablature 8.75 (8.75).
- Against the photographs (`run.sh alfred-nathan-house compare`, every view on its Street View
  camera: see `refine.min_gain_note` in the config): silhouette IoU mean 0.515 over the 15 views;
  straight in front (vZGe) 0.16 wide, 0.71 upper, 0.75 door; the east end (fF8q) 0.34, 0.96, 0.94.
  The wide views are low because the General Library, the Clock Tower's ranges and the trees fill
  them and the model alone stands in them. The Street View cameras are not exact: the model stands a
  little to the side in the Princes Street views and about 0.7 m low in fF8q's. Luma p50 of the
  building region, photographs 133 and render 139 (mean over the views).
- On the site's drawn ground (stood at 41.48 m under the door, 4.3 m under the LiDAR's): it lies
  -0.87 to +0.01 m from the door's under the model; every material's lowest points are 1.32 m or
  more below it, so nothing floats; the block's east end, 3.35 m lower in the LiDAR, is partly under
  it on the map.
- 8,990 triangles in 8 materials (`panel`, `paint`, `glass`, `dressed`, `roofPale`, `roof`,
  `glassPale`, `doorRed`), built in about 20 ms.

What round 0 left for the next round: the ground-floor windows' round-cornered heads; the block's
roof, grey metal in the aerial and pale here; the bands' slight bow between the fins; the standing
seams, closer in the photographs than the 0.9 m kept here so that they do not shimmer far off; the
block's long side toward the Clock Tower, in no photograph; the heights of the two campus-path
cameras, about 1.1 m above where their photographs put them.

## Round 1 (October 2026, one agent alone, on `main`)

Brought onto `main` first: the folder, its records in `data/sources.json`, `measure.py`'s
`frame.axis_from: "walls"` and `frame.axis_across` and the kit's `panel` and `doorRed`; the frame is
`frame.expected` to 0.000 m and 0.001°, and `place` writes the same `placement.json`.

- **The roofs, from the 2023 aerial** (its colour at the LiDAR's roof points): the block's hipped
  roof is grey metal, median sRGB 141 148 165 (luma 148), so it is now `panel` (143 147 150), as its
  walls; the house's flat roof behind the parapet is dark grey (luma 76), so it is now the kit's
  `roof`. Neither is seen from a street.
- **The ground floor's windows** have square heads with quarter-round corners (vZGe's and RHEq's
  photographs): the bays' and the left side's ground-floor windows now have them, glass and
  surround, a fifth of the width across.
- **The standing seams** are 0.45 m apart in 51j5's upper view (counted against round 0's 0.9 m
  ribs drawn from the same camera: twice as many over the same span). They are no longer ribs of
  geometry but lines that a new kit material, `panelSeam` (the `panel` paint with the seams in its
  shader), draws on the long walls, and fades out where a seam's spacing comes under about three
  pixels (fully gone under 6.3 pixels a metre). On the map the light form draws no texture, so they
  cannot shimmer there; in a walker's view they fade before they could.
- **The campus-path cameras**, fitted to the east frame's own outline against the sky in each wide
  view's mask, nothing of any other building (`refine.fixed` in the config, with the evidence): fF8q's
  camera 1.31 m lower (rms 25.8 px to 5.9 px; round 0 read about 1.1 m from the face's rows), 51j5's
  pitched 4.38° down (rms 45 px to 2.0 px; a height alone would need it 2.97 m lower, and the Clock
  Tower's top, 91 m away, stands as far above where the Street View camera puts it as the frame,
  28 m away: a pitch). `refine_cameras.mjs` gains the option: a panorama listed there is not
  searched.

| | round 0 (on `main`) | round 1 |
| --- | ---: | ---: |
| silhouette IoU, mean | 0.515 (15 views) | 0.482 (14 views) |
| the same 14 views | 0.484 | 0.482 |
| vZGe (Princes Street, straight in front): wide, upper, door | 0.164, 0.710, 0.753 | 0.164, 0.710, 0.753 |
| fF8q (the east end): wide, upper, door | 0.337, 0.962, 0.941 | 0.325, 0.960, – |
| 51j5 (the east end and the long side): wide, upper, door | 0.081, 0.529, 0.579 | 0.096, 0.601, 0.476 |
| rA70, RHEq: wide, upper, door | 0.121, 0.482, 0.680; 0.141, 0.506, 0.735 | 0.121, 0.481, 0.680; 0.141, 0.505, 0.735 |
| luma p50, photographs / render (mean) | 133 / 139 | 134 / 144 |
| top view: footprint IoU; heights p10/p50/p90; highest | 0.916; -0.18/0.01/0.23 m; 18.55 (LiDAR 18.73) | the same |
| triangles, draw calls | 8,990, 8 | 9,582, 9 |

- fF8q's door view has nothing of the model above the 4 m cut with its camera lowered (its
  photograph shows the lowest storey and the band over it), so it has no IoU and leaves the mean.
- Why the wide views stay low: in each, the photograph's solid outside the model's own screen box
  (the General Library, the Clock Tower's ranges, trees the mask calls solid) is 66-88% of the
  union. Inside the model's screen box, the same pixels give an IoU of
  0.77-0.94 for the wide views. That box IoU is an extra figure for the maintainer, not the
  criterion, which is unchanged.

  | wide view | IoU | IoU inside the model's screen box | photo solid outside the box, share of the union |
  | --- | ---: | ---: | ---: |
  | vZGe | 0.164 | 0.827 | 0.80 |
  | fF8q | 0.325 | 0.944 | 0.66 |
  | 51j5 | 0.096 | 0.811 | 0.88 |
  | rA70 | 0.121 | 0.769 | 0.84 |
  | RHEq | 0.141 | 0.824 | 0.83 |

- What holds each view's IoU down, from its overlay (photo-only red, model-only blue): the Princes
  Street views (vZGe, RHEq, rA70) by the masks: the bare plane trees in front of the house are solid
  in them (its upper views lose 9-12% of the union inside the model's box to branches), and rA70's
  is mostly trees; the Street View camera puts the model a little to the right in vZGe's (4% of the
  union is model over sky at its right corner). The campus-path views by the General Library (51j5:
  15-45% of the union) and by the camera (before the fit). The model itself shows nowhere where a
  photograph contradicts it by more than a moulding.

What the next round should look at: the pale bands on the east end, white paint here (render luma
p90 about 236) and light grey slats in shade in the photographs (about 175), which put fF8q's
render 29-48 above its photograph's luma; the bands' slight bow between the fins; fF8q's door view,
whose photograph shows the whole east end, wider than its 45° should from 13 m; the masks' bare
branches in the Princes Street views (a mask option, as Maclaurin Chapel's round 1 has on its own
branch, would let the front views pass); the block's long side toward the Clock Tower, in no
photograph.
