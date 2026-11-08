# Landmark: building 303 of the Science Centre, drawn from code

Building 303 of the University of Auckland's Science Centre, a range of four storeys along its street faced in
bands of precast panels, before a slab of ten storeys, with lower blocks behind, drawn in three.js from code alone
and sized by the LINZ 2024 LiDAR, compared with one photograph of the lower part of its face to the street
(November 2026). The kit it is built with, the pipeline, the viewer and how to run them are shared by every
landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=science-centre-303&view=orbit`
  with the repository root served on port 8765. `site` is true: the site draws it in place of block 303
  ("On the site", below).
- Run its pipeline: `landmarks/pipeline/run.sh science-centre-303 [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its
  masks, and so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview`
  do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/science-centre-303.json`, `frame`: x south-west (the axis, the bearing of most of the walls, and x is
minus it); y up from 41.6 m NZVD2016, the median ground in the crop box and the LiDAR's ground at `door`; z
north-west; the centre at x = z = 0. Every wall runs square with the face to the street, which is turned 3.24
degrees from the frame (its returns fit the line z = 26.144 - 0.05655 x within 0.08 m), so `parts/common.js`
gives the building its own frame: `u` along that face from its north-east end toward the south-west, `w` out of
it, the street side positive (`at`, `rect`, `uw`).

## Neighbours on the map

- The campus map's rings of 303S, 305 and 301 adjoin 303's: the face's last 5 m to the south-west are 303S's
  (its ring from u 70.1-70.4), the low roofs behind the rear block are 305's (from w -36.3), and the wing's back
  runs into 301's (from w -59.5). The model ends where each begins (303S's ring runs 0.2 m behind the rear block's
  back), but for 303S's side (below) and for two slivers where 305's ring reaches into
  303's own parts, which the model draws as the LiDAR has them: from the rear block's back across it and its
  22.4 m part into the slab (u 37 to 41, to w -24.4), and along the wing's south-west side (u 23.5 to 25,
  w -36.3 to -46.3).
- **On to 303S's back.** The range and the slab run on past u 70.3, where the campus map's rings meet, to 303S's
  back, as the LiDAR has them, with no returns below them in between: the slab's end bay at 32.8 m to u 71.65 (its
  returns' u p98 71.55-71.73 from w -12 to -26), 1.35 to 1.5 m into 303S's ring; the range at 13.4 m along
  303S's back, about 5 cm into 303S's model (u 71.84 at the face, 1.6 cm into the tip; 71.44 and, past a step in
  303S's back, 71.40 at w -7.6; 71.28 at the range's back),
  where 303S's tip stands at its height; the face's gaps run on with it to u 71.80. Until 2026-11-07, when 303S
  came onto the site, the model ended at u 70.3 and a slot 0.5 to 1.5 m wide stood open between it and 303S's
  model; the maintainer asked for it to be closed.
- No other block has as much as half of it under the model (305 10.2%, its two slivers; 303S 3.7%, the range and
  the end bay over its ring's edge; 301 1.5%), so `building.also` is empty.
- **Block 303 itself** is 85.6% under the model (84.96% before the range and the slab ran on to 303S): its ring takes
  in a light well 2 m wide between the wing and the slab, where the LiDAR has no returns, and the model leaves it
  open.

## The reference

One photograph from the street before the entrance sees the lower part of the range's face to the street, close
up through a wide lens. It is kept on the maintainer's computer in `refs/photos/` (gitignored), with the picks on
it, its fitted camera, its level cut and its mask. Nothing of it goes into git, and how it is recorded and
credited is for the maintainer to decide. No Street View photograph is used.

Its camera is fitted by `tools/photo_camera.py` to lines whose places the LiDAR gives (the face's top edge at
14.05 m, the two gaps between its bands at the layers of returns on it, 10.15 and 5.85 m, and the canopy's front
edge, 2.74 m and 0.93 m out of the face), to the face's north-east corner at its top, and to five verticals of the
glazing and the panels: an rms of 2.65 px. The lens bows the long edges by a few pixels, which a pinhole camera
leaves as residuals of up to 6 px along the gaps; with the principal point at the centre the fit rolls the camera
9 degrees, which the photograph's vanishing points (its face's lines meet at (-538, 525) px, five verticals at
(595, -1704): f 461 px, pitch 12 degrees, roll 0.4) do not, so the principal point is solved too. No size is measured
from the photograph; two heights are estimated with it as a reference, the gaps' height (0.4 m) and the
lowest band's bottom (3.0 m), and it is otherwise a reference for the look, and the comparison.

The sky mask is the default. The viewer's light (`light`) is estimated: the photograph is under an overcast sky,
so its sun stands behind the building from the south-east, which leaves the face to the street in open shade, and
the exposure (2.0) is set by the building's brightness against the photograph's.

## Round 0 (November 2026, the lead)

Each part a block at the LiDAR's plan and height, in the building's frame: the range along the street, 11.2 m
deep, its roof at 13.4 m behind a parapet at 14.05 m; the slab behind it, its roof at 33.6 m; behind it a block at
17 m toward the south-west and a wing at 18.3 m toward the north-east. Walls down to FOOT, -6.0 m. 180 triangles,
2 draw calls. Silhouette IoU 0.959 in the photograph (its sky 17%), the luma median 109 against 156. From above:
footprint IoU 0.832, 64% of the cells within 0.5 m of the LiDAR's height.

## Round 1's shape and the check (November 2026, the lead)

From the LiDAR's 1 m and 0.5 m cells and its returns:

- **The slab**: from u 6.75 to 303S's ring, w -11.2 to -26.8, its roof at 33.6 m (the cells 33.4-34.0), a bay at
  each end at 32.8 m; on it a raised part at 37.6 m (u 15.0-26.0), an enclosure of screens to 35.85 m round a deck
  at 34.5 m, a round tank 8 m across to 41.8 m with a flue to 44.7 m at its edge, and a box at 38.1 m.
- **The rear block**, toward the south-west, to 305's ring: its roof at 13.4 m with flat-topped ridges at 17 m,
  2.75 to 3.25 m wide (the last 5.25) and about 6 m apart, from its back to the stacks, a part at 22.4 m, and six round stacks along the
  slab's back, 2.7 m across, to 42.1 m (at their returns' centres, 6.0 to 6.3 m apart, the last pair 7.7).
- **The wing**, toward the north-east, from w -31 back to -61: its roof at 18.3 m, with two troughs across it
  behind w -36, each falling sharply to 16.9 m and rising to 18.2 m 2.5 m on; a strip at 16.2 m, 1.7 to 1.75 m wide, along
  its north-east side and its front; a light well 2 m wide between it and the slab; a part at 21 m against the slab.
- **The range**'s north-east end runs back to the slab's line, where the slab does not reach.

From above (after the review, below): footprint IoU 0.849, 86% of the cells within 0.5 m (the model's heights minus
the LiDAR's p10/p50/p90 -0.29/0.06/0.29), the highest point 44.71 m, the flue's top (its own 8 returns to 44.79; the top view's p99.9 of
every roof cell, 42.1 m, leaves out a part so small).

## The face (step 5, November 2026, the lead)

- **The bands**: three bands of precast panels, their outer faces in one plane (the face's returns at every
  height within 0.1 m of the line); the gaps between them at the layers of returns on the face, 10.15 and 5.85 m,
  drawn as dark strips 2 cm before it, each 0.4 m tall (estimated); the shadow under the lowest band, which ends a
  metre short of the north-east end (its returns), from 3.0 m (estimated).
- **The relief** on the lowest band, white blocks in a maze-like pattern, is an artwork: it is not drawn after,
  and the band there is plain.
- **The canopy** along the entrance at its returns (its top 2.74 m, 0.93 m out, from u 11.6 to 52.6), 0.3 m deep
  (estimated), and the ground storey glazed under it (estimated).
- **The colours**: the walls in `concreteMauve`, added to the kit (the paint's shader in a mauve grey, after the
  photograph's panels; the faces it does not show estimated alike); the roofs of the range and the slab in
  `roofPale`, near white in the 2023 aerial, the others in `roofGrey` (the aerial: a blue grey and a mauve grey,
  estimated). The Clock Tower's, the Kate Edger Information Commons', the Humanities Building's and the Thomas
  Building's viewer pictures at `?quality=low` and `?mask=1` are the same pixel for pixel with and without the new
  material.

Silhouette IoU 0.960, 0.960 in the box; the luma p10/p50/p90 50/152/158 against the photograph's 111/156/200 (its
glazing and gaps hold the p10 down). 1,572 triangles, 6 draw calls; no two faces of different materials in one
plane.

## The review (November 2026)

- **The flue** at the tank's edge stood on the tank's top, but its plan lies outside the tank's round: it hung from
  41.5 to 44.7 m. It rises from the slab's roof, as the LiDAR's returns in its plan do.
- **The wing's raised part** ended 10 cm short of the slab's back; it runs 10 cm into it.
- **The wing's roof** runs on at 18.3 m between the raised part's end (u 23.5) and the rear block's start (u 24.8),
  back to the slab, where the LiDAR's returns are at 18.2-18.3 m and the model had left a slot 1.3 m by 4.2 m open
  from the foot to the sky.

From above: footprint IoU 0.849 (the LiDAR's 3,706 m², the model's 3,159, both 3,153), 86% of the 12,219 cells
within 0.5 m; block 303 84.96% under the model. 1,596 triangles, 6 draw calls.

## On the map (step 7)

- **The door** is on the forecourt 5.5 m out from the face before the entrance (u 19.5, w 5.5 in the building's
  frame; (-10.78, 32.26) in the view frame), at the forecourt's front edge, where the LiDAR's ground is the
  frame's (27 returns within 1 m, p10/p50/p90 -0.065/-0.016/0.049 m); the forecourt under the canopy is 0.08-0.12 m
  above it. Every height is kept, and `door.note` says so.
- `building.also` is empty.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 303. 303's entry
in `landmarks/measured/exclusions.json` (the generator's massing of it failed the top-view check, 84% of its cells
within 0.5 m where 90% is asked) has gone; `MASSING.md` lists 303 among the landmarks and counts 35 stand-ins
measured.

- **The foot.** Since building 303S of the Science Centre came onto the site, the model stands on the ground it
  shares with 303S, whose outline it touches (`standHeights` in `src/scene/landmarks.ts`; `../README.md`,
  "Placement"): its y = 0 at its LiDAR ground, 41.6 m, plus the two landmarks' mean of the map's ground at the
  door minus the LiDAR's, -0.504 m, so at 41.096 m on the map, 0.892 m higher than the map's ground at its own
  door, and the two stand at the LiDAR's heights against each other. Its walls go down to FOOT, 6.0 m below the
  frame's ground (each wall's foot 6.0 to 6.35 m below it, the glazing under the canopy from 5.5 m below it);
  the foot check of `tests/landmarks.test.ts`, which
  tests each material's lowest points against the map's ground, passes.
- **The light form** (the map, and the walker views of the basic tier) draws `glass` as glass and `roofPale` and
  `roofGrey` as roofs, as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `concreteMauve`, `screenGrey` and
  `grey` are walls.
- **Its card** says "estimated:" and the config's `estimated`, which begins "some heights, with a photograph as a
  reference" and goes on with the gaps between the bands, the canopy's depth, the glazing at the street, the plain
  panels where the relief stands, and the colour of the walls no photograph shows and of the wing's roof (the
  aerial's mauve grey, drawn in `roofGrey`).
- **The pictures** in `docs/landmarks/`: `science-centre-303-front.jpg` and `-above.jpg` are the viewer's renders
  of the model alone, from its street and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of
  the site built from this branch, the map near it and a walker's eyes on its street. All four were taken again on
  2026-11-07, when the range and the slab ran on to 303S's back (1,672 triangles, 6 draw calls), the map's and the
  walker's with 303S beside it, on the ground the two share.

## Not drawn yet

The panels' joints and the bands' depth (the gaps are dark strips on one plane); the ground storey's frames and
doors; the face's window bay at its south-west part above the canopy; the slab's, the rear block's and the wing's
faces, which no photograph shows (plain); the rear block's lower courts' slope toward 305; the slab's gentle
crossfall (0.4 m) and its front edge's gutter.
