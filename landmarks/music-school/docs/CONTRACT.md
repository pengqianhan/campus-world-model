# Engineering contract (read before writing code)

The Music School (building 250 of the University of Auckland's campus map) drawn in three.js from code
alone, sized by the LINZ 2024 LiDAR. Zero-build ES modules, three.js through the import map of the shared
viewer, `../pipeline/viewer/index.html`. No external 3D models or image textures: every mesh and texture
is generated in code. Photographs are **references only**; nothing is traced or sampled from them into the
model.

## Frame and sizes
- View frame, metres: **x** north-west (the frame's `-axis`, along the face to the car park), **y** up
  from the frame's ground (32.7 m NZVD2016, the LiDAR's at `door`, the foot of the face to the car park),
  **z** north-east (`toStreet`, toward the car park and the panorama); the centre of the roofs round the
  courtyard at x = z = 0. `config/music-school.json`, `frame`: the axis is the bearing of most of the walls,
  of the two the one nearest the long axis of the whole building. The faces run along x and z to within
  about 0.8°, so the parts are drawn in the view frame itself.
- The building's own returns only: `building.outline` is campus.json's ring with one vertex moved 0.3 m
  in, where Te Pūtahi Tangata (201) stands 0.44 m off it (its `outline_note`), within 1.5 m. The Overbridge
  (202), a walkway under a slatted roof along the south-east and south sides, stands at most 2.5 m above
  32.7, under `min_above` (3 m): none of its returns is selected.
- What the LiDAR shows (`parts/common.js` holds the numbers and says where each came from):
  - **the auditorium** to the east: a fan-shaped plan under a grey roof in facets round one high point
    near its south side, which a cone fits (apex (-9.62, 1.18), 12.53 m, falling 0.267 a metre), out to
    eaves 0.74-0.88 m beyond its walls (the LiDAR's wall returns);
  - **the north wing** round the courtyard, flat at 5.16 m, with a **parapet** over its face to the car
    park stepping up in rises of about 0.4 m from 5.5 to 8.3 m toward the north corner, and a **curved
    canopy** along that face (4.55 m at the wall, 3.42 m at z 18.0, its lower edge at 2.69 m through the
    camera);
  - **the south range**, a low gable along x hipped at its west end (ridge near z -14, 9.65 m), **the
    south-east part** between it and the auditorium, a gable along z (ridge near x -11, 10.1-10.4 m) with a
    stack on it to 15.14 m, **the low link** at the courtyard's east corner (5.02 m), **the north-west block**
    and **the west corner**, single planes (the west corner's glazed roof is not drawn); each roof the lowest
    of its planes, fitted to the LiDAR;
  - **the courtyard**, open, with an amphitheatre and trees (not drawn: the top view counts no return
    there above 3 m);
  - **the ground**: -0.96 to +1.03 before the face to the car park, +1.4 to +2.1 along the road to the
    north-west, -3.9 to -3.0 along the south-east side; walls go down to `FOOT` (-4.5 m).
- **Neighbours.** Te Pūtahi Tangata (201, a block on the site) stands 0.44 m from 250's outline at its west
  corner; the model's west corner keeps to 250's returns. The Overbridge (202, a block 3.6 m tall from its
  floor count) runs along the south-east and south sides, its outline overlapping 250's: the model covers
  12.0% of block 202, under roofs 7.4-9.3 m above 32.7, where block 202's top stands about 0.3 m below
  32.7 by the LiDAR's heights (its ground's median 28.79 m, plus 3.6): neither shows through the other
  there. On the map's ground (round 2, `site` true) block 202's top stands 3.26 m above the model's door,
  4 m or more below every roof of the model over it (README, "On the site").

## Ownership
- `parts/fan.js` (the auditorium; its window, gutter and downpipes), `parts/north.js` (the north wing, the parapet and the canopy),
  `parts/ranges.js` (the south range, the south-east part and its stack, the low link, the north-west block
  and the west corner),
  `parts/shapes.js` (shared helpers: one owner per round, named in the brief). `model.js` and
  `parts/common.js` are the lead's.
- `landmarks/kit/` and `landmarks/pipeline/` are shared by every landmark: add, with defaults, and show
  the other landmarks' pictures unchanged (`?quality=low` and `?mask=1`, or byte-identical stage outputs).

## Budget (tier 2: the site runs in a browser, phones too)
- Whole building ≤ 100k triangles and ≤ 10 draw calls (merged by material). Build time of a part
  ≤ ~300 ms on this machine (the console logs it).
- Street View: ≤ 1,200 tiles for this building; 143 bought (2026-11-02, `qru8…`).

## References
- `2LAG…` (2022-09), at the face's south-east end, bought in round 2 for the ochre wall's window: not pinned (its
  photographs stand turned about 8° in the cut, its camera is not fitted); nothing is measured through it.
- `qru8…` (2022-09), in the car park 9.3 m out from the face to the car park, near its north end: that
  face whole, from the north corner to the canopy's south-east end, with cars before its foot, and the
  auditorium's ochre wall beyond it at a slant. Its metadata's `copyright` reads "From the Owner, Photo
  by: Google".
- Measure through the camera fixed from the photograph's own edges against the LiDAR
  (`streetview.camera_fixes`, its note), never through the recorded one: its pitch and roll from the
  parapet's treads against the sky, its yaw and x from the ochre wall's two corners on the LiDAR's wall lines.
  `refine.keep_fixes` keeps it.
- No photograph shows the road side (north-west), the south-east side, the courtyard or the roofs: draw
  them plainly at the LiDAR's sizes.

## How to render and compare
- `landmarks/pipeline/run.sh music-school refine compare topview` (from the repository root, with
  `PORT` serving it): the strips in `out/pipeline/compare/`, the metrics in its `metrics.md`, the top view
  in `out/topview/`. GPU steps only under `~/.campus-loop/gpu.lock`.

## Rules
- Measure, don't guess: a size comes from the LiDAR, the outline or a photograph through its fixed
  camera; say which in a comment, and say "estimated" where neither shows it, and name it in the config's
  `estimated`.
- Real or absent: what no photograph shows is plain wall, not invented windows.
- No people, no cars, no trees, no signs, no crane, no neighbour: they are in the photographs, not in the
  model.
- Walls go down to `FOOT`.
