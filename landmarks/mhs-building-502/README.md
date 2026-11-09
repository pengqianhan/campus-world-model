# Landmark: M&HS Building (502), drawn from code

Building 502 of the M&HS Building, University of Auckland, on the Grafton campus beside building 501: a main block of
seven storeys in pale concrete, its north face to the street a row of tall fins with window bays between them, its
east end pale panels beside a near-black glazed strip, under a dark metal skirt and a low hipped roof with a plant
room near each end; and a lower part of five storeys at its west end. It is drawn in three.js from code alone, sized
by the LINZ 2024 LiDAR, and compared with one photograph of the main block's east end and north face from the street
to its north-east (November 2026). The kit it is built with, the pipeline, the viewer and how to run them are shared
by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=mhs-building-502&view=orbit` with
  the repository root served on port 8765. `site` is true: the site draws it in place of block 502 ("On the site",
  below).
- Run its pipeline: `landmarks/pipeline/run.sh mhs-building-502 [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its masks, and
  so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/mhs-building-502.json`, `frame`: x west-north-west (minus the axis, the bearing of the main block's walls,
108.4 degrees, as 501's beside it), y up from 71.49 m NZVD2016, the LiDAR's ground at `door`, before the east end, z
north-north-east, toward the street; the centre, the mean of the returns more than 27.3 m over that ground (the main
block's roof), at x = z = 0. `parts/common.js` gives the building a frame of its own: `u` east-south-east (minus x),
along the main block, and `w` toward the street (z). The frame takes the building's returns more than 7.3 m up only
(`min_above`), so that the low canopies and the street's things are left out.

Every height in `parts/common.js` was measured before the door was set, above 68.80 m, the median ground in the first
crop box; `H` moves each on to the door's ground, 2.69 m higher. The frame's thresholds in the config were lowered by
the same 2.69 m, so the measured frame is the one the model was drawn in (0.000 m, 0.000 degrees). The crop box is 60 m
round the outline (`crop_note`), so that it takes in the street where the photograph is taken.

The campus's origin is about 1 km to the north. There the map's true north and NZTM's grid north differ by about a
degree, and the map's metres and the frame's local NZTM metres lie about 19 m apart: `place` turns one into the other,
as it does for every landmark.

## Neighbours on the map

- Building 501's landmark touches its outline, so the two share one ground (`../README.md`, "Placement"): against the
  map's ground at its own door 502 stands 0.919 m higher and 501 0.919 m lower (their offsets, the map's ground at
  the door minus the LiDAR's, -3.10 and -1.26 m, span 1.84 m).
- The main block's south strip, u -13.87 to 21.89 and w -17.58 to the edge of 502's ring, lies in 501's ring, where
  501's model draws it (`../mhs-building-501/README.md`). This model stops at the north edge of that strip
  (`MAIN.strip`: from (-13.87, -13.29) by (-7.04, -13.24) to (21.3, -11.74), a straight line within 0.007 m of that
  edge's other corners but two, which stand 0.25 and 0.17 m north of it at u 9.68 and 12.59), so that the two models
  overlap only there, by up to 0.25 m over about 3.5 m²; west of the strip its south side is the LiDAR's, w -17.9.
  Along the seam 501's roof stands 0.13 m above this one's west of u 15.8, and further east up to 1.04 m above it
  (at u 21.3): 501's strip is one plane, which does not fall with this roof's east hip as the LiDAR's roof does
  (this model is within 0.02 m of the LiDAR there).
- 87.0% of block 502 is under the model above 2.5 m; 4.3% of 501C (which the campus map has as a basement) and 0.9%
  of 501. No other block is under it by half, so `building.also` is empty.

## The reference

One photograph from the street north-east of the main block, about 38 m from its north-east corner: the east end, its
pale panels and the near-black glazed strip beside them, the north face's fins and bays, the dark skirt under the roof,
and the steps and the street's canopy at its foot. It has no record of its date. It is kept on the maintainer's
computer in `refs/photos/` (gitignored), with the picks on it, its fitted camera, its level cut and its mask. Nothing
of it goes into git, and how it is recorded and credited is for the maintainer to decide. No Street View photograph is
used.

Its camera is fitted by `tools/photo_camera.py` to lines and points whose places the LiDAR gives: the top of the roof's
skirt over the east end and over the north face, as lines, the main block's north-east and north-west corners on it,
and two upright edges of the east end's panels as verticals, with the camera held 1.6 m over the LiDAR's ground. It
looks up 15 degrees through a lens of 63.6 degrees across: an rms of 1.58 px. A first fit to the lines and the
north-east corner alone had 79.4 degrees across and put the north-west corner 85 px short; the lines do not fix where
along them the corners stand. No size is measured from the photograph but the edge of the glazed strip (below); it is
a reference for the look and the comparison, and shows that the roof's edge is a dark skirt, whose foot the LiDAR
gives.

## The model (`parts/common.js`)

- **The main block**, u -22.9 to 21.3 and w -17.9 to 14.25 (its outermost roof returns), its walls in pale cladding
  (`claddingPale`) up to the roof's edge, in 0.5 m steps so that their tops follow it. The roof is the lowest of planes
  fitted to its returns over each convex piece of the plan (`shapes.js`'s `envelope`): between u -12 and 12 the north
  slope and the south (rms 0.08 and 0.15 m) meet at w -1.83, at 34.78 m over the provisional ground; beyond them each
  end is a gentler hip, lower, with a step of up to 1.3 m up to the middle (the west end from 33.45 m at u -12, the
  east end fitted to rms 0.02 m). The roof's edge stands at about 31.85 m.
- **Its faces** (estimated): the roof's dark metal skirt (`screenGrey`), which the photograph shows, from 30.5 m up
  to the roof's edge, where the LiDAR's outermost roof cells reach down (their medians 30.3 to 30.7 m: cells that mix
  the skirt and the wall) and the skirt stands out over the wall; through the photograph's fitted camera, the east
  end's near-black glazed strip (`screenBlack`) south of w 3.4 and its pale panels north of it; the north face mid
  grey (`grey`), for its fins and textured spandrels together.
- **The lower west part**, u -46.71 to -22.9 and w -17.83 to 13.07, under a low hip whose north and south slopes (rms
  0.15 and 0.14 m) meet at w -1.85, at 26.26 m (the LiDAR's ridge band at 25.96 to 26.01 m), its west end falling to
  25.0 m; the same skirt from 23.7 m, the main block's skirt's depth below its roof's edge (the faces no photograph
  shows: estimated). **The raised part** beside the main block, u -29.72 to -22.9 and w -9.32 to 3.7, flat
  at 28.8 m.
- **The plant rooms** on the main roof, about 37.7 m: the east one, u 16.84 to 18.74 and w -3.83 to 1.21, a white
  lattice in the photograph (`paint`), from 32.3 m; the west one, u -22.62 to -20.2 and w -5.31 to 1.07, from 31.7 m:
  each just below the lowest of the roof under it, so that it stands on the roof.
- The light: the photograph has no date; the east end stands in sun and the north face is lit from the side. The
  viewer's sun at 75 degrees round and 40 up lights the east end; the building's luma median is 138 at an exposure of
  0.6 against the photograph's 137 (counted in the model's screen box).

Silhouette IoU 0.932 in the model's screen box. The top view, counting the cells more than 2.5 m over the door's
ground: footprint IoU 0.905 (the LiDAR's 2,016 m² against the model's 1,985, both 1,901; the strip 501 draws is the
LiDAR's only), 91% of the 7,536 cells both cover within 0.5 m (p10/p50/p90 -0.11/0.01/0.23), the highest point 35.02 m
over the door's ground against the LiDAR's 35.10 (p99.9). 1,964 triangles, 6 draw calls.

## On the map (step 7)

- **The door**: the campus map records no lobby or entrance in 502, and the OpenStreetMap snapshot no entrance within
  120 m, so its entrance is not known from a record. The config's door is before the middle of the east end, at the
  top of the steps the photograph shows at its foot, 1.5 m out from that face: u 22.8 and w 6.0 (in the view frame
  (-22.8, 6.0)); the LiDAR's ground within 1 m, 17 returns, p50 71.494 m.
- **The map's ground** (its 8 m elevation model) lies 3.10 m below the LiDAR's at the door, and under the model's
  plans from 0.53 m below the door's to 1.83 m above.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 502. 502's entry in
`landmarks/measured/exclusions.json` (the generator's massing of it failed the top-view check, its footprint IoU 0.858
against a limit of 0.9, and 0.873 with the roof forms of the fourth round) has gone; `MASSING.md` notes it in the
Grafton round and the fourth, and `massing.py --campus grafton` leaves it out and writes every other Grafton file as
before.

- **The foot.** It shares a ground with 501, its y = 0 0.92 m above the map's ground at its door. Its walls go down to
  FOOT, 4.89 m under the door's ground, below the map's ground under every plan: the foot check of
  `tests/landmarks.test.ts` passes, as does its faces check.
- **While a building is open** its neighbours sink to footprints, and the model gives way to block 502, which sinks on
  its footing, at most 4 m above the lowest ground under it (`updateLandmarks` in `src/scene/CampusScene.ts`), and whose
  footprint shows above the drawn ground on 61% of its cells, by up to 1.6 m.
- **The light form** (the map, and the walker views of the basic tier) draws `roofGrey` as roofs, as `LIGHT_ROLE`
  (`src/scene/landmarks.ts`) already says; `claddingPale`, `grey`, `screenGrey`, `screenBlack` and `paint` are walls,
  the glazed strip among them, as 302's dark bands are.
- **Its card** says "estimated:" and the config's `estimated`, which begins "some heights and places, with a
  photograph as a reference" and goes on with the foot of the roof's dark skirt and the edge of the east end's glazed
  strip, and the faces no photograph shows.
- **The pictures** in `docs/landmarks/`: `mhs-building-502-front.jpg` and `-above.jpg` are the viewer's renders of the
  model alone, from the street to its north-east and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are
  shots of the site built from this branch, the map near it and a walker's eyes on the street to its north-east.

## Not drawn yet

The north face's fins and window bays (drawn as one mid grey), the east end's panels' joints, the glazing's frames,
the steps and the street's canopy at the foot of the east end, the things on the roofs. The faces no photograph shows
(the south and west faces, the lower west part's) are drawn plainly, the west part's with the main block's skirt.
