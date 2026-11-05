# Landmark: the Kate Edger Information Commons, drawn from code

The Kate Edger Information Commons (building 315 of the University of Auckland's campus map), two long
ranges of pale grey cladding with a glass-roofed atrium between them over a sunken court on Alfred Street,
drawn in three.js from code alone and sized by the LINZ 2024 LiDAR, checked against one photograph of its
end to Alfred Street (November 2026). The kit it is built with, the pipeline, the viewer and how to run
them are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=kate-edger-information-commons&view=orbit`
  with the repository root served on port 8765. `site` is true: the site draws it in place of block 315
  ("On the site", below).
- Run its pipeline: `landmarks/pipeline/run.sh kate-edger-information-commons [stage ...]`. Its reference is
  read from `refs/photos/` (the config's `"refs": "photos"`), which a fresh clone does not have: `photo`,
  `refs` (its masks, and so the default `all`), `refine` and `compare` need it, `data`, `place` and
  `topview` do not.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/kate-edger-information-commons.json`, `frame`: x south-west, along the two long ranges (the axis,
the bearing of most of the walls, and x is minus it); y up from 41.5 m NZVD2016, the median ground in the
crop box and the LiDAR's ground at `door`; z north-west, toward the Student Commons; the centre at
x = z = 0. The south-east range's face to the south-east stands about 5° off x, and so do the ranges'
edges on the atrium: their plans follow the LiDAR, not the frame.

The points are the building's own. `building.outline` is campus.json's ring, within 1.5 m. The ring lies
about 2 to 4 m north-west of the LiDAR's walls, as other buildings' rings do, so the plans follow the
LiDAR's walls, and within 1.5 m of the ring's north-west side the LiDAR's cells take in AUSA House's roof
(below).

## Neighbours on the map

- **AUSA House (322)**, a measured massing north-west of it. Its hipped roof runs on past the campus map's
  ring of it toward 315's north-west range, its slopes unbroken from 11.5 m down to 9.0. Round 0 drew those
  roofs, before the north-west range's face from x -17 to -10, as a lower wing of 315 at 9.8 m; on the map
  it ran 2.5 m into 322's outline, where the site draws 322's massing, and covered 9.2% of block 322. The
  wing was taken out when the model was placed (step 7): the model covers none of block 322.
- No other block of the campus map within 80 m lies under the model: `building.also` is empty.
- A flat roof at 7.8 m against the north-west face (x -14.5 to -12, z 17.8 to 20.5), whose building
  neither the LiDAR nor the photograph shows, is not drawn.

## The reference

One photograph from Alfred Street, taken under the bare plane trees there, sees the end to the street:
the south-east range's screened face and green corner, the atrium's open end and the north-west range's
end over the sunken court. It is kept on the maintainer's computer in `refs/photos/` (gitignored), with
the points picked on it, its fitted camera, its level cut and its masks. Nothing of it goes into git, and
how it is recorded and credited is for the maintainer to decide. No Street View photograph is used (from
2026-11-04 new landmarks use none).

Its camera is fitted by `tools/photo_camera.py` to corners, edges and verticals picked on the photograph
whose places the LiDAR measures: 1.6 m above the ground, an rms of 1.27 px over 34 residuals, 5.8 px at
most. The principal point is solved and the verticals are held, since the photograph's verticals look
straightened: without them the fit ran off, its camera below the ground with a false roll. `photo_fit`
keeps the camera through `refine`.

On the far building the camera is good to about a pixel, but for things 5 to 15 m away at the
photograph's edge, where the end over the court is, it is out by about 1 m sideways. So the LiDAR places
the parts, and the photograph gives only heights, each pick cast through the camera onto its face's plane:
the screens from 3.7 m, the corner's glazing from 2.9 m, the mesh panels over the atrium's end from 4.2 m,
and the end over the court's lower edge down to 5.1 m.

The sky mask (`sky_mask` in the config) closes the bare branches before the sky (`branches_deg` 1.0) and
keeps the pale screens from passing for cloud (`pale_tint` 30). The viewer's light (`light`) is estimated:
the photograph's light is soft, so its sun stands behind the building from Alfred Street.

## Round 0 (November 2026, the lead)

Flat-topped blocks at the LiDAR's medians: the south-east range at 15.93 m with the upper strip (20.10),
the upper block (19.25) and the plant (19.6) on it; the north-west range at 15.80 with its north-east end
(16.6), the end over the court (14.2), the raised part (19.0) and two lower wings (11.7 and 9.8); the
atrium's glass at 13.5 and a low roof at 4.2. FOOT -4.5 m. 484 triangles in 3 meshes. Against the
photograph: silhouette IoU 0.218, and 0.485 in the model's own screen box; the building's luma median 238
against the photograph's 140.

## Round 1 (November 2026, the lead)

- **The end over the court** (the prow): a rim at 12.8 m, a glazed roof light at 14.2, its underside
  sloping down to 5.1 m (from the photograph), open beneath it, and a glass canopy at 3.3 m under its tip.
- **The north-east end's face** on the LiDAR's slant, glazed, green-tinted under the prow.
- **The atrium** open at its north-east end (round 0's estimated end wall taken out), its glass roof from
  x -22 to 9.6 with no fall, the raised part over it at 18.3 m and a roof at 7.7 m between the ranges
  south-west of it.
- **The south-east range's face to the street**: pale silver screens from 3.7 m over green-tinted glazing,
  its corner glazed in green from 2.9 m, grey mesh panels over the atrium's end from 4.2 m, and a dark
  shopfront across the atrium's end at the court's level.
- **Four materials** added to the kit, at the end of `makeMaterials`: `claddingPale`, `screenSilver`,
  `screenGrey` and `glassGreen`. Every other landmark's viewer picture at `?quality=low`, and the Clock
  Tower's at `?mask=1`, is the same pixel for pixel with and without them.

Silhouette IoU 0.416, 0.634 in the box; the luma median 138 against 140. 812 triangles, 7 draw calls. The
gain in the box came from the sky mask, not the model: with bare trees before the sky, round 0's mask
counted the sky between the branches as solid. Scored against round 0's mask, round 1's model gets 0.456.

## The check (November 2026)

From above (`run.sh kate-edger-information-commons topview`) the totals passed at once: 93.3% of the main
block under the model, the highest point 20.11 m against the LiDAR's 20.48 (p99.9). Each part's 0.5 m
cells against the model's own heights found three errors over 0.5 m: the parapets round the north-west
range were missing (16.4 to 16.6 m), the plant was one block where the LiDAR has 1 m screens at 20.35 m
round a unit at 18.6, and the prow's roof stood 1 m high, at its rim's height, where only its two sides
have a rim. All three are drawn as the LiDAR has them now, and the prow's plan and roof light follow its
cells. Six building returns at the rim's height beyond the prow's tip, among a tree's, are not drawn: the
2023 aerial, allowing for its lean, and the photograph put the corner at the plan's tip, and drawn they
cost 0.04 of the IoU in the box.

After the check: 93.1% of the main block under the model, footprint IoU 0.893, 75% of the cells both
cover within 0.5 m of the LiDAR's height, the highest point 20.35 m against 20.48; every part's top, the
parapet and the plant's screens within 0.5 m of their cells' median. Silhouette IoU 0.415, 0.637 in the
box; the luma median 142 against 141. 1,208 triangles, 7 draw calls; no two faces in one plane.

## On the map (step 7)

- **The door** is on Alfred Street's footpath at (-42.0, 19.75), 4.4 m north-east of the end of the
  prow's north-west side, where the LiDAR's ground is the frame's (41.50 m; 21 returns, 41.43 to 41.57
  from p10 to p90). No wall's foot stands at that height. The entrances the photograph shows are down in
  the sunken court, 3.5 m lower, which the map's ground (the 8 m elevation model) does not have: there the
  map's ground stands 2.41 m above the LiDAR's, and on the footpath 0.96 m below it. A door in the court
  would have stood the model's street face 3.4 m above the map's street. So, as for the Thomas Building,
  the door is where the frame's ground is, every height is kept, and `door.note` says where the entrances
  are.
- Without the wing that was AUSA House's: block 315 is 91.8% under the model, its footprint IoU 0.881 (the
  LiDAR's cells near the ring taking in 322's roof), 76% of the cells within 0.5 m; block 322 0%.
  1,160 triangles, 7 draw calls.

## On the site

`site` is true: `place` writes `placement.json`, and the site draws the model in place of block 315.
315's entry in `landmarks/measured/exclusions.json` (the generator's massing of it failed the top-view
check, its footprint IoU 0.865 where 0.9 is asked) has gone; `MASSING.md` lists 315 among the landmarks and counts 38 stand-ins measured.

- **The foot.** The model stands on the map's ground at its door, 40.54 m, and every material's walls go
  down 3.9 to 5.2 m below the map's ground under them, so none hangs. `tests/landmarks.test.ts` passes.
- **The court.** The map's ground covers the court's storey and the shopfront across the atrium's end:
  README's "Known limitations" says so.
- **The light form** (the map, and the walker views of the basic tier) draws `glassGreen` as glass, which
  `LIGHT_ROLE` (`src/scene/landmarks.ts`) now says; `glassPale` and `glass` were panes and `roofGrey` a
  roof already, and the cladding and the screens are walls. About's words for the landmarks' materials
  ("such as ... glass and metal") cover it.
- **Its card** says "estimated:" and the config's `estimated`, which begins "some heights, with a
  photograph as a reference" and goes on with the roofs, drawn flat, and the other sizes nothing measures.
  The card names the photograph only so (the maintainer, 2026-11-05). There is no `measured_by`, which
  would need the photograph's credit.
- **The pictures** in `docs/landmarks/`: `kate-edger-information-commons-front.jpg` and `-above.jpg` are
  the viewer's renders of the model alone, from the north-east and from above, with no photograph;
  `-map.jpg` and `-eyes.jpg` are shots of the site built from this branch, the map near it and a walker's
  eyes north-east of it, by the Old Choral Hall.

## Not drawn yet

A lower roof near 10 m in the south-east range's north-east corner, the roofs' falls, the north-west
range's strip along its face to the north-west (16.1 to 16.2 m) and the slot at 14.5 m before it, the
prow's lower edge as a curve (drawn as a slope), the frames, the white columns and the diagonal strut, and
the canopies along the north-west face and at the south-west end. The green glass at the corner is drawn
brighter than the photograph's, from the sky it reflects. The atrium's open end is drawn as one floor at
the street's level, where the LiDAR shows a floor a little above it between two stretches of the court.
