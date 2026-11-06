# Landmark: building 303S of the Science Centre, drawn from code

Building 303S of the University of Auckland's Science Centre, on Symonds Street, a block of eight storeys behind a
curtain wall of mirror-like blue glass, with a top storey set back on its roof, drawn in three.js from code alone and
sized by the LINZ 2024 LiDAR, compared with one photograph of it from the street to its south-east (November 2026).
The kit it is built with, the pipeline, the viewer and how to run them are shared by every landmark:
[`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=science-centre-303s&view=orbit`
  with the repository root served on port 8765. `site` is true: the site draws it in place of block 303S
  ("On the site", below).
- Run its pipeline: `landmarks/pipeline/run.sh science-centre-303s [stage ...]`. Its reference is read from
  `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`, `refs` (its
  masks, and so the default `all`), `refine`, `compare` and `metrics` need it, `data`, `place` and `topview`
  do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/science-centre-303s.json`, `frame`: x south-east (the axis, the bearing of most of the walls, and x is
minus it); y up from 39.3 m NZVD2016, the median ground in the first crop box and the LiDAR's ground at `door`; z
south-west, toward the street; the centre at x = z = 0. The face to the street is turned 8.75 degrees from the
frame (its returns at 26-31 m fit the line z = 8.445 + 0.1539 x within 0.41 m, p90: it bows a little), so
`parts/common.js` gives the building its own frame: `u` along that face from its north-west end toward the
south-east, `w` out of it, the street side positive (`at`, `rect`, `plan`, `uw`). Its back runs on a diagonal from
the north-west end (`backAt`), then steps back.

The crop runs 135 m round the outline (`crop_note`), so that it takes in the photograph's camera and
`tools/photo_camera.py` can hold it at a hand's height above the LiDAR's ground there; the frame comes from the
points near the outline and is the same as with the usual 25 m.

## Neighbours on the map

- The campus map's rings of 303 and 303S overlap along 303S's back, the diagonal from its north-west tip. The
  highest returns inside 303S's ring, 35.1-35.25 m, are the end bay of 303's slab (32.8 m above 303's ground of
  41.6 m), which reaches up to 1.6 m into the ring before the back's line from u 5 to 20; the model draws its own
  north-west part and top storey there, at 28.75 and 33.75 m.
- **Behind its back, a slot.** 303's model stops 0.5 to 1.6 m short of 303S's back, from the north-west tip to
  303's light well at u 19.7, where the LiDAR has 303's 16 m block (its returns at 15.5 m above 303S's ground,
  u -6 to 4.8) and its slab's end bay (35.1 m, u 4.8 to 19.7) reaching to 303S's back, with none below them. The
  slot lies outside 303S's ring and inside 303's, and block 303S, which stood at the same ring, left it open on
  `main` too; filling it is a change to 303's model.
- Building 302 stands 5.6 m to the south-east; its screens hide most of 303S's south-east end in the photograph.
- No other block has as much as half of it under the model (303 1.5%), so `building.also` is empty. Block 303S
  itself is 92.7% under the model.

## The reference

One photograph from the street about 95 m to the south-east, through a long lens, sees the face to the street
obliquely and the first metres of the south-east end. It is kept on the maintainer's computer in `refs/photos/`
(gitignored), with the picks on it, its fitted camera, its level cut and its mask. Nothing of it goes into git, and
how it is recorded and credited is for the maintainer to decide. No Street View photograph is used.

Its camera is fitted by `tools/photo_camera.py` to points and lines whose places the LiDAR gives: the top storey's
two corners at its top edge (33.75 m), the face's north-west end at its parapet (30.4 m), the south-east end's top
edge (29.5 m), and three verticals, the pier at the corner and two fins. With the crop at 25 m the fit went to a
camera 6.3 m under the deck of the overbridge it stands on, where the crop had no ground; with the crop at 135 m it
stands at 48.2 m, 1.55 m above the LiDAR's ground there, looking 340 degrees round and 6 degrees up, its field 32
degrees across, the principal point at the centre (set free, it moves only a few pixels): an rms of 0.85 px. No size is
measured from the photograph; the places of the last two fins (where the fitted camera's rays through them meet the
face) and the storey's height on the south-east end are estimated with it as a reference, and it is otherwise a
reference for the look, and the comparison.

The sky mask is the default. The viewer's light (`light`) is estimated: the photograph is taken on a clear day with
the sun high to the north, which leaves both faces it shows in shade, so the viewer's sun stands at 20 degrees round
and 60 degrees up, and the exposure (1.4) is set by the building's brightness against the photograph's.

## Round 0 (November 2026, the lead)

Each part a block at the LiDAR's plan and height, in the building's frame: the north-west part at 30.4 m, the top
storey at 33.4 m, the south-east part at 29.0 m, a lower part behind at 16 m and the ring's north-west tip at
16.4 m. Walls down to FOOT, -4.5 m: the ground rises 4.4 m along the face to the south-east. 176 triangles, 2 draw
calls. Silhouette IoU 0.767, 0.963 in the model's screen box (much of the south-east end, which the model draws in
full, stands behind 302's screens in the photograph), the luma median 110 against 129. From above: footprint IoU
0.857, 74% of the cells within 0.5 m of the LiDAR's height.

## Round 1's shape (November 2026, the lead)

From the LiDAR's 1 m cells and its returns:

- **The body**, eight storeys, its roof at 28.75 m (the cells 28.7-28.8); a thin parapet wall along the face at
  30.4 m from its north-west end to u 37.7, where the 30.4 m returns end; the north-west part's end wall at u 1.6
  with a parapet at 29.5 m.
- **The top storey**, from u 12.65 to 49.5, set back 1.45 m from the face, its back walls in the body's, a notch
  in its back from u 31.9 to 41; its roof at 33.1 m inside a parapet at 33.75 m, 0.3 m wide (estimated).
- **The south-east part**, from u 37.6 to its end face at u 59.6, back to w -18.3, inside a parapet at 29.5 m.
- **A lower part** behind the back's diagonal, u 29 to 32, at 15.5 m, and **the ring's north-west tip** at 15.6 m,
  with a parapet at 16.4 m along its front (step 6).

308 triangles, 2 draw calls; no two faces of different materials in one plane. Silhouette IoU 0.780, 0.972 in the
box; from above, 86% of the cells within 0.5 m, the highest point 33.75 m.

## The faces (step 5, November 2026, the lead)

The LiDAR has almost no returns on the glass and none in layers on the south-east end, so what it does not give is
estimated, the photograph as a reference:

- **The glass** of the face to the street (the kit's `glassPale`) 2 cm before its walls, from 0.5 m above FOOT,
  under the street's level: the ground storey is hidden behind the street's railing, and the street rises along the
  face.
- **The fins** on the face's south-east stretch, beyond the 30.4 m parapet, 0.4 m wide and 0.38 m deep, at u 37.9,
  42.5, 47.0 and 52.35, to the parapet's 29.5 m.
- **The pier** at the corner from u 57.5, to 29.7 m (its returns' p99 29.71; through the fitted camera the
  photograph's pier top is at 29.8 m).
- **The braces** between the last fin and the pier, a zigzag of bars 0.3 m wide, one turn every two storeys.
- **The south-east end**: its glass, and a pale spandrel band 0.9 m tall at each storey of 3.35 m, eight storeys
  from the ground at the end to the roof.
- **The colours**: the walls in the kit's `claddingPale` (the faces no photograph shows estimated alike), the roofs
  in `roofGrey` (grey in the 2023 aerial).

Silhouette IoU 0.781, 0.974 in the box (the box's sky 36%); the luma p10/p50/p90 96/131/188 against the
photograph's 87/130/190. From above: footprint IoU 0.859 (the LiDAR's 1,044 m², the model's 926, both 910), 86% of
the 3,577 cells within 0.5 m (the model's heights minus the LiDAR's p10/p50/p90 -0.62/-0.01/0.19), the highest
point 33.75 m against the LiDAR's 35.25, which is 303's slab's end bay reaching into the ring (above). 608 triangles, 3 draw
calls.

## On the map (step 7)

- **The door**: the entrance is not known (the photograph hides the ground storey behind the street's railing, and
  the campus map records none), so the door is on the pavement before the face, 39% along it from its north-west
  end, 1.8 m out from it (u 23, w 2.0 from the face's line, the drawn face at w 0.2; (-10.17, 8.90) in the view
  frame), where the LiDAR's ground is the frame's (13 returns within 1 m, p10/p50/p90
  -0.048/0.002/0.049 m). `door.note` says so.
- `building.also` is empty.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 303S. 303S's entry
in `landmarks/measured/exclusions.json` (the generator's massing of it failed the top-view check, 89% of its cells
within 0.5 m where 90% is asked) has gone; `MASSING.md` lists 303S among the landmarks and counts 34 stand-ins
measured.

- **The foot.** The model stands on the ground it shares with building 303 of the Science Centre, whose outline it
  touches (`standHeights` in `src/scene/landmarks.ts`; `../README.md`, "Placement"): its y = 0 at its LiDAR ground,
  39.3 m, plus the two landmarks' mean of the map's ground at the door minus the LiDAR's, -0.504 m, so at 38.796 m
  on the map, 0.892 m lower than the map's ground at its own door, and the two stand at the LiDAR's heights against
  each other. Its walls go down to FOOT, 4.5 m below the frame's ground, the glass, the fins and the pier from
  4.0 m below it; the foot check of `tests/landmarks.test.ts`, which tests each material's lowest points against
  the map's ground, passes.
- **The light form** (the map, and the walker views of the basic tier) draws `glassPale` as glass and `roofGrey` as
  roofs, as `LIGHT_ROLE` (`src/scene/landmarks.ts`) already says; `claddingPale` is walls.
- **Its card** says "estimated:" and the config's `estimated`, which begins "some heights, with a photograph as a
  reference" and goes on with the fins' places, sizes and spacing, the braces, the spandrel bands on the south-east
  end and the storey's height, the glazing from the street's level, and the colour of the walls no photograph shows.
- **The pictures** in `docs/landmarks/`: `science-centre-303s-front.jpg` and `-above.jpg` are the viewer's renders
  of the model alone, from its street and from above, with no photograph; `-map.jpg` and `-eyes.jpg` are shots of
  the site built from this branch, the map near it and a walker's eyes on its street.

## Not drawn yet

The glass's mullions and the fins along the face's north-west stretch, which the photograph sees only far off; the
ground storey's frames and doors, hidden behind the street's railing; the louvres near the top storey's north-west
end and the vent pipe on its roof; a lower patch at 11.3-11.9 m behind the back (w -20 to -22); the back and the
north-west end, which no photograph shows (plain); the recess of about 1.4 m in the south-east end between w -12.5
and -6 (its returns reach only u 58.4-58.8 there), which the model draws flat at u 59.6.
