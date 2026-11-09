# Contract: Building 907

The rules every part of this landmark keeps. The kit, the pipeline and the viewer are shared
(`../../README.md`); this file is the building's own.

## Frame and sizes
- View frame, metres: **x** east-south-east (the frame's `-axis`, along the hall's vault), **y** up from the frame's
  ground, 53.19 m NZVD2016, the median LiDAR ground in the first crop box (provisional until the door is set),
  **z** south-south-west (`toStreet`, toward the annex); the frame's centre, the middle of the vault's top, at
  x = z = 0. `config/building-907.json`, `frame`: the vault's top (the building's points over 9 m), its principal
  axis, bearing 284.90 deg, within 0.24 deg of the crown line fitted to the LiDAR. The campus's origin is about
  1.6 km to the north-west: there the map's true north and NZTM's grid north differ by about 1 degree, so the map's
  metres and the frame's local NZTM metres lie about 31 m apart (`place` turns one into the other).
- The building's own frame: **u** west-north-west (`-x`), toward the hall's end the photograph sees, and **w** toward
  the annex (`z`). `parts/common.js` gives `at(u, w)`, `plan(corners)` and `rect(u, w)`.
- What the LiDAR shows (`parts/common.js` holds the numbers):
  - **the hall**, u -22.9 to 23.0 and w -15.15 to 15.15, under a **barrel vault** the same all along: its crown
    10.03 m over the ground, its eaves 6.2 m, its profile the median of the roof's returns in 1 m strips;
  - **the annex** on its south-south-west side, u 9.2 to 21.8 and w 13.0 to 24.6, its roof falling from 8.5 m where
    it meets the hall (over the hall's eave by about 2 m) to 7.05 m at its far side;
  - the ground flat round both, -1.0 to +0.7: walls go down to `FOOT`, -1.3 m.

## Who owns what
- `parts/common.js` (the measured sizes and the building's frame): the lead.
- `parts/hall.js`, `parts/annex.js`, `parts/shapes.js` (the shapes the parts share, as the M&HS Building's),
  `model.js`: the lead.

## Budget
- Whole building ≤ 100k triangles and ≤ 10 draw calls (tier 2), merged by material. Round 0: 86 triangles, 3 draw
  calls; round 1: 230, 5.

## Rounds
- Round 0 (2026-11-09): the hall's walls (`paint`, white metal cladding) and ends up to the vault's arc, the vault
  (`roofPale`), the annex's walls (`renderOrange`, a new colour of the kit's paint shader) up to its roof's plane and
  its roof (`roofPale`). Silhouette IoU 0.341, 0.869 in the model's screen box; the building's luma p50 183 against
  the photograph's 150 (the default light). Top view: footprint IoU 0.957, 98% of 5,888 cells within 0.5 m, the
  highest point 10.02 against the LiDAR's 10.12; block 907 89.2% under the model.
- Round 1 (2026-11-09, the lead alone): the openings, from the photograph through its fitted camera (estimated): the
  band of glazing on the hall's west-north-west end with its pale strip, the annex's windows and glazed door on its
  west-north-west face and its door on its south-south-west face, each a dark frame (`screenBlack`) and glass
  (`glass`) standing a few centimetres out of the wall; the light of an overcast day (the sun behind the building,
  exposure 0.65). 230 triangles, 5 draw calls. Silhouette IoU 0.862 in the model's screen box; luma 148 against 150.
- The door (step 7): on the yard before the annex's glazed door, the LiDAR's ground 53.56 m, 0.37 m over the
  provisional ground; `H` moves every height by it. The map's ground there lies 0.70 m under the LiDAR's.
- On the site (step 8): `site` true and the card's `estimated`; 907's measured-massing exclusion gone. The faces
  check found the pale strip's ends in the plane of the glass's: the strip now runs 0.05 m past the glass at each end.

## Rules
- Measure, don't guess: a size not from the LiDAR is named in the config's `estimated`, here and on the card.
- No two faces of different materials in one plane; every wall down to `FOOT`.
- The photograph is a reference only: never traced, sampled or published; it stays in the gitignored `refs/photos/`.
