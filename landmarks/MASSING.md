# Measured massing: a design for the small buildings

This is a design for the maintainer to decide. It has no code. Code follows only after the
decisions at the end are taken. It touches recorded decisions, so it is a gate (`AGENTS.md`, "How a
change lands").

A **measured massing** is a building drawn by a program, not by agents: blocks and roofs at the
heights that the LINZ 2024 LiDAR measures, and walls by rule. It is for the many plain University
buildings that are not worth a landmark made by hand (`landmark-from-code` skill): sheds, plant
rooms, glasshouses, footbridges, small houses, single-storey blocks. A landmark such as the Clock
Tower has its details drawn and compared with photographs. A measured massing has no details. It
only has the right shape and the right heights.

Words. The site's blocks are called "massing blocks" in `src/shared/massing.ts`. In this document,
"block" is the block that the site draws today from the campus map, and "measured massing" is what
the generator makes.

## 1. How the generator works

### Input

- **The LiDAR tiles** that the landmark pipeline already uses: Auckland Part 1 (2024),
  `CL2_BA32_2024_1000_{3603..3606, 3703..3706}`, fetched once through `scripts/lib/snapshot.ts`
  into `data/raw/landmarks/lidar/` (see `landmarks/README.md`, "Fetching", once PR #67 is
  merged). They cover local x -759 to 1161 m and y -692 to 748 m: the whole City campus.
  The generator reads them from disk. It fetches nothing.
- **The building's outline** from `public/data/campus.json`, taken from the map's frame to local
  NZTM metres (`map_to_local` in `pipeline/tools/data/common.py`, on the branch
  `loop-a2-old-government-house` until it is merged). The outline chooses the points:
  building points (class 6) inside it, or within 1 m of it for the eaves.
- **The ground**: the LiDAR's ground points (class 2) within 5 m outside the outline.
- **The building's record** in `campus.json`: its id, its floors and their `noPlan` marks. The
  generator uses these to decide what it may draw (see "Places, not people").

### Steps

1. **Ground.** Take the median height of the ground points round the outline as the reference
   ground. Keep their 5th and 95th percentiles: they show how much the site slopes.
2. **Heightmap.** On a 0.5 m grid, keep the highest building point in each cell, as
   `topview.py` does. A cell is roof if it is more than 2.5 m above the reference ground. Close
   single empty cells between points.
3. **Layers.** Split the roof cells into layers where neighbouring cells step by more than 1 m: a
   step of that size is a wall. A pitched roof does not split, because its cells change by less
   than 1 m. Drop pieces smaller than 4 m² (chimneys, vents, single stray points).
4. **Footprint of each layer.** Trace the layer's cells into a polygon and simplify it to within
   0.25 m. Where a layer meets the outline, snap its edge to the outline, so that the walls stand
   where the campus map has them. A roof edge that lies up to 1 m outside the outline is an eave
   overhang, not a wall.
5. **Roof form of each layer.** Fit a plane to each cell's neighbourhood (1.2 m). Sort the cells
   by their downhill direction into four sides of the layer's main axis.
   - **flat**: most cells slope less than 5°. It gets the map's roof rim.
   - **mono-pitch**: one downhill side.
   - **gable**: two opposite downhill sides; the ridge runs between them.
   - **hip**: four downhill sides.
   - Anything else, or a layer whose points do not lie on smooth planes, is **not drawn as a
     roof**. Its cells are reported, and the top-view check counts them as LiDAR only.

   Each layer keeps its eave height (the 10th percentile of its edge cells) and its ridge height
   (the 99th percentile of its cells), and each pitched side its slope.
6. **Model.** Each layer is a prism from below the ground up to its eave, with its roof on top.
   The model's y = 0 is the LiDAR ground at the lowest point of the outline. There it stands on the
   map's ground. Its walls go 1 m below y = 0, so that the map's coarser ground (the 8 m DEM) never
   shows a gap under them. The polygons are written in map metres, true north, so no turn and no
   scale are needed to place them.

### Walls, windows and materials, by rule

The generator does not look at a photograph. Walls, windows and materials come by rule, from the
measured shape alone:

- **Walls** take the street look's facade in the walker views, as the blocks next to them do
  (`street-look` skill). On the map they take the map's palette, as a landmark's light form does.
- **Storeys** come from the published data, as the blocks' storeys do: the building's number of
  levels at or above index 0 in `campus.json` (as `src/shared/massing.ts` counts them for the blocks: 216 Mona's B, G and 1 are three), spaced evenly from the ground to each eave. A
  storey is never under 2.4 m (the wall then has fewer storeys) or over 4.5 m (a plain band stays
  above the top storey). A 7.8 m wall under three levels has three storeys of 2.6 m. Windows sit
  on the street look's bays (`PROGRESS.md`, "Decisions": how a University building looks from
  outside), 3.2 m wide, one row a storey: the grid's 3.6 m is the storey itself, so its rows follow
  the storey height (`src/scene/CampusScene.ts`, `storey: floorHeight`). The alternative, storeys from the measured wall height alone, is
  decision 4; amendment 2 then ends with other words (section 3).
- **Roofs** take the map's roof colour, as the blocks do. A pitched roof takes the same colour; it
  shows its form by its light. Flat roofs keep the rim.

### What it does not do

- No ornament: no cornices, chimneys, porches, steps, doors, gutters, signs or railings.
- Nothing from photographs: no Street View, and no colour from the aerial photos.
- No floors inside: a click on the building still finds its block, which opens on its floors.
- Nothing under a roof that the LiDAR cannot see: no underside of a bridge, no underpass, no
  basement.

### When it leaves the block (real or absent)

The LiDAR is a survey of 2024. The generator replaces a building's block only where the LiDAR
supports it. It leaves the block as it is, and writes the building to `exclusions` with its reason,
when:

- roof cells cover less than 85% of the outline (trees, glass, a building too low to see, or a
  building that has changed since 2024);
- vegetation points (classes 3 to 5) lie over more than 15% of the outline;
- the building is under the ground (an underpass), where the LiDAR sees the street above it;
- ground points lie under the roof in most of its cells (a bridge or a canopy, open below; see
  decision 8);
- the model fails the top-view check below.

### How it is checked

Every measured massing passes the top-view check of the landmark pipeline (`topview.mjs` and
`topview.py`, on the branch `loop-a2-old-government-house`; `landmarks/README.md`, "Metrics", once
it is merged). The check draws the model and the LiDAR as heightmaps on a 0.5 m grid and gives:

- the footprint IoU: cells higher than 2.5 m in the model against those in the LiDAR;
- model minus LiDAR heights on the cells both cover (p10, p50, p90), and the share within 0.5 m;
- the highest point of each, and a picture (LiDAR | model | difference).

A measured massing goes on the site only if its footprint IoU is 0.90 or more and 90% or more of
its cells are within 0.5 m (decision 3). For a landmark made by hand, Old Government House reached
0.935 and 92% in its first round. The generator fits the LiDAR directly, so it should do as well.
A batch's pull request gives a table of these numbers, one row a building, and the pictures of the
worst five.

## 2. Where the output lives

Two ways. Both keep the generator in `landmarks/pipeline/tools/` beside the other tools.

- **A. A folder for each building**, as the Clock Tower has: `landmarks/<name>/` with its config,
  `placement.json` and a generated `model.js`.
- **B. One shared model and a data file for each building**: `landmarks/measured/model.js` builds
  any measured massing from its data, and `landmarks/measured/buildings/<id>.json` holds one
  building: its layers (polygons in map metres, eave, ridge, roof form, slopes), its ground, its
  top-view numbers, and its `building` id as a placement does.

| | A. Folder for each building | B. Shared model, one data file each |
| --- | --- | --- |
| Repository | 4 to 6 files a building (config, placement, generated `model.js`, `.gitkeep`s), about 6 to 8 KB. For 30 buildings: about 150 files, 200 KB | One `model.js` (a few KB) and one file a building of about 1 to 3 KB. For 30 buildings: 31 files, about 60 KB |
| Loading on the site | With PR #68 (`loop-a1b-landmark-discovery`) each `model.js` is a chunk of its own, fetched when the camera comes near. On the City campus 10 to 20 small buildings stand close together. The camera then asks for 10 to 20 chunks of 2 to 4 KB, and the worker builds them one after another (its queue). Each is its own set of meshes, so the draw calls grow with the number of buildings | One chunk for the shared model, and the data of all the measured massings in one chunk (about 60 KB, less when compressed). Coming near any of them fetches both once. The worker can join all the massings near the camera into one mesh for each material, so the draw calls stay few |
| How the site finds them | `placement.json` with `site: true`, as PR #68 has | PR #68's discovery needs a second glob (`landmarks/measured/buildings/*.json`), and the worker maps each to the shared model. A small change to `src/app/landmarks.ts` and `src/scene/landmarkWorker.ts` |
| Review | Each building is generated code that nobody wrote. A reviewer can only check its numbers | The generator and the shared model are reviewed once, as code. After that a batch is a table of numbers and small data files |
| Tests | `e2e/landmark.spec.ts` (PR #68) tests every landmark it finds: 30 more landmarks make the run slower | A unit test reads every data file (outline cover, heights, closed polygons). The e2e test covers the shared model on a few buildings |
| From massing to landmark | The folder is already there. Agents replace the generated `model.js` with `parts/`. Generated and hand-made models then share one kind of folder | A `landmarks/<name>/` folder starts, as for any landmark, from the massing's numbers as its first contract. The same pull request deletes `measured/buildings/<id>.json` |

**Recommended: B.** It is smaller to review and cheaper to load, and the boundary between a
generated building and a building drawn by hand stays plain. In both ways a unit test checks that no
building is drawn by two models (an id appears in one placement or data file only).

## 3. How it fits the Decisions

Decisions in `PROGRESS.md` that a measured massing touches:

1. **"One source for a University building", sub-point "Landmarks" (the user, 2026-10-21).** It
   lets a building with a landmark (`landmarks/<name>/`, sized by the LiDAR, placed by its
   `placement.json`) be drawn in place of its block. A measured massing is sized by the same LiDAR
   and placed the same way. But in option B it is not a `landmarks/<name>/` folder, and nobody
   draws it. The sub-point also says that About and the building card name the landmarks, and that
   the heights of the others are estimated from their floors. A measured massing makes a third kind:
   measured, but drawn by rule. **This needs an amendment (a gate).** Proposed words, under the
   sub-point:

   > **Measured massings (the user, <date>).** A plain building may be drawn by a measured massing
   > (`landmarks/MASSING.md`): blocks and roofs at the heights the LiDAR measures, made by a
   > program, with walls, storeys and windows by the street look's rules. It stands in place of its
   > block as a landmark does, and only where the LiDAR covers it and the top-view check passes;
   > elsewhere the block stays. About and the building card say which buildings are measured
   > massings.

   The reason for the decision was to avoid "some buildings surveyed and their neighbours
   estimated". Landmarks already accepted that for a few buildings. A measured massing extends it to
   some tens. Where a group of small buildings is measured together, the mix becomes smaller.
2. **"The street look", sub-point "By rule from the data already published; nothing placed".**
   Storeys, bays and wall materials come from what is in `public/data/`. The one exception is a
   landmark's building, "drawn for that building by agents from the LiDAR and compared with
   photographs". A measured massing reads the LiDAR, which is not in `public/data/`, and it is
   neither drawn by agents nor compared with photographs. **This needs an amendment (a gate).**
   Proposed words, after the sentence on the landmark's exception:

   > Since <date> a second exception (the user): a measured massing (`landmarks/MASSING.md`). Its
   > shape and heights come from the LiDAR, by a program, and are not compared with photographs.
   > Its walls, storeys, bays and windows stay by rule from `public/data/`: storeys from the
   > building's published levels, spaced to the measured walls. Nothing is placed on it: no doors,
   > steps, signs or street furniture. About says which buildings are measured massings.

   If the maintainer takes storeys from the measured wall height instead (decision 4), the words
   end differently: "Its walls, bays and windows stay by rule from `public/data/`; its storeys are
   the measured wall height in whole storeys near 3.6 m, which may differ from the building's
   published levels."
3. **"The street look", sub-point "Only the walker views change".** It already makes an exception
   for a building with a landmark: the map changes near it. Amendment 1 carries a measured massing
   into that exception. Further away, the blocks are drawn as before, and the map does not change
   by a pixel.
4. **"On the map, a light form".** This holds as it is. A measured massing has no textures at all.
   It loads only when the camera comes near, as a landmark does. No amendment.
5. **"How a University building looks from outside" (the user, 2026-10-14).** Roofs keep their own
   colour and flat roofs their rim. Windows keep the 3.2 m bays, one row a storey. Only the storey height
   moves away from 3.6 m, so that the published levels fit a measured wall. No amendment: the
   number of storeys still comes from the published data. Decision 4 says what changes if it does
   not.
6. **"All network fetching goes through `scripts/lib/snapshot.ts`".** The City campus needs no new
   fetch: its eight tiles are on disk. Grafton, Newmarket and the other campuses need more tiles of
   the same LiDAR, which is a fetch the pipeline has not asked for before (a gate). Tai Tokerau
   needs the Northland LiDAR, which is a new data source with its own licensor (a gate).

Not touched: the walker's paths keep the blocks (`src/shared/walkmap.ts` takes each building's
lowest block from `massing()`), and the building view keeps its cut-away of the block's floors.

### What About and the building card then say

- **The building card** has a third note beside "Drawn in detail, to sizes measured by LiDAR" and
  "Height estimated from the number of floors": "Heights and roof measured by LiDAR; walls and
  windows drawn by rule."
- **About**, under "Buildings drawn in detail", gets a second list: "Measured by LiDAR and drawn by
  rule: {buildings}. Their heights and roofs come from the same LiDAR. Their walls, storeys and
  windows are drawn by rule, not from photographs. The heights of all other buildings are estimated
  from their floors." The LiDAR credit there already covers them.
- **The README's "Known limitations"** names the measured buildings, or points to About for the
  list.
- **The walker's look report** (`src/app/walker.ts:215`) says "Building heights are estimated from
  the number of floors, not surveyed." It then says: "Building heights are estimated from the
  number of floors, except those of the landmarks and the measured massings, which the LiDAR
  measures." (This note is already out of date for the Clock Tower.)

## Which buildings

The generator is for the City campus buildings that no landmark is planned for. The landmark queue
puts the others in two tiers, and the generator leaves them to it:

- **Tier 1, historic and landmark buildings:** 102, 103, 104, 105 and 105S (the Clock Tower, on
  the site), 107, 109, 118, 119, 130, 801, 802, 803 and 804.
- **Tier 2, large teaching buildings and towers:** 106, 110, 110N, 201, 206, 207, 250, 260, 301,
  302, 303, 303S, 305, 310, 311, 315, 401, 402, 405, 421E, 421W, 439, 440, 441, 442, 614, 616,
  619, 620, 810, 818, 820 and 831 to 837.

Every other City campus building is the generator's (tier 3): 48 of them lie in the eight tiles.
A building moves out of tier 3 when the maintainer plans a landmark for it.

## Places, not people

- **Where people live and childcare centres.** An exterior shell is not a floor: it shows no room,
  no plan and no use. But a measured massing does make such a building plainer to see. Until the
  maintainer decides (decision 6), the generator leaves the block for every building with a floor
  marked `noPlan: "residential"` or `noPlan: "childcare"`, and for every building whose source name
  names a childcare centre. Among the buildings it would draw (those outside tiers 1 and 2, see
  "Which buildings") that is 123 Lodge, 436 University Hall Apartments, 617 7 City Road and 838
  Stuart McCutcheon House (residential floors), and 255 Te Kohanga Reo and 410 Symonds Street
  Early Childhood Centre (childcare). Inside the tiles, 102, 440, 441, 442, 614, 616, 818, 831 and
  833 of tiers 1 and 2 also have residential floors. The generator does not draw them, but
  decision 6 bears on them too: 102 Old Government House (residential floors 10 and 20) is being
  drawn as a landmark, outside and in detail, on the branch `loop-a2-old-government-house`.
  **841 Nicholls Lane ECE** is a childcare centre by its name. On `main` the data build's test
  (`PLAN_CHILDCARE_BUILDINGS` in `scripts/build-data.ts`) does not match "ECE", so its floor is not
  marked. Open PR #69 fixes that: the build then knows a childcare centre by "ECE" too, and 841's
  floor is blank. Once it is merged, 841 is caught by its `noPlan` mark like the others.
  **450 UniLodge Whitaker** is student housing by its name, but its one floor is marked
  `unmapped`, not `residential`. Its block is 3.6 m tall, and the LiDAR shows a tower about 47 m
  tall there. The generator would make the largest change of all to it, so it also stays a block
  until decision 6.
- **Waipapa Marae (251 to 256) and Fale Pasifika (275).** They are culturally significant. The
  generator gives them massing only: blocks and roof forms at measured heights, in the map's own
  colours. It never draws carvings, patterns, or colours of their own, and nobody adds them later
  by hand. Anything further asks the maintainer first. Whether even the massing is drawn before the
  maintainer has asked is decision 7. 255 Te Kohanga Reo is also a childcare centre, and stays
  blank in any case. 256 Manuhiri Shelter has no roof the LiDAR sees (it is under trees) and keeps
  its block.

## Three examples

Measured on 2026-10-22 from the cached tiles with a throwaway script, by the steps above (see "How
the numbers were measured"). Heights are above the reference ground: the median of the ground
points within 5 m outside the outline. "Today" is the block in `public/data/campus.json`.

| | 216 Mona | 113 Building 113 | 409 Security |
| --- | --- | --- | --- |
| Outline (campus map) | 153.4 m² | 618.9 m² | 929.2 m² |
| LiDAR roof inside the outline | 154.2 m² (100%) | 612.2 m² (99%) | 900.2 m² (97%) |
| Outline against LiDAR roof, IoU | 0.85 (eaves overhang the outline) | 0.87 | 0.90 |
| Vegetation over the outline | 3% | 1% | 4% |
| Ground (NZVD2016), p5 / p50 / p95 | 32.86 / 33.13 / 36.94 m: falls 3.8 m across the site | 38.09 / 39.06 / 39.41 m: level | 43.34 / 43.45 / 46.45 m: rises 3 m on one side |
| Roof layers | 1 | 2 | 2, and one piece not drawn |
| Layer 1 | 148 m², **hip**, sides of 27° to 33° (about 30°), eave 12.1 m, ridge 14.2 m | 416 m², **flat** (under 3°), 7.7 to 8.0 m (median 7.8 m) | 709 m², **flat** (about 1°), median 7.7 m |
| Layer 2 | none | 276 m², **gable** on top along the long axis, sides of 17°, eave 8.9 m, ridge 10.0 m | 174 m², **flat**, median 10.1 m |
| Not drawn | 13 m² of points 15 to 24 m high at one corner, within 1 m outside the outline: something beside it | none | 44 m² from 10.9 to 14.7 m whose points lie on no smooth plane: a tree classed as building, or a small roof (look at it) |
| Today | a flat block **10.8 m** tall (`heightSource: "floor-count"`, floors 20, 30, 40) | a flat block **10.8 m** tall (floor-count, floors 0, 10, 20) | a flat block **10.8 m** tall (floor-count, floors 0, 10, 20) |

What each would become:

- **216 Mona.** A small building with a hip roof of about 30° on all four sides. On the low side its
  walls stand 12.1 m to the eave, with three storeys of about 4 m; on the high side, where the
  ground is 3.8 m higher, about 8.3 m. The ridge is at 14.2 m (47.3 m NZVD2016). Today's block is
  flat at 10.8 m, so the roof gains 1.3 m at the eave and 3.4 m at the ridge, and the building gets
  its roof form.
- **113 Building 113.** A long flat-roofed block, 7.8 m to its rim, with three storeys of 2.6 m
  (its three published levels; two of 3.9 m under the other storey rule). Along its middle a
  narrower block rises to 8.9 m, with a gable of 17° to a ridge at 10.0 m. Today's block is about
  3.0 m too high over 60% of the roof, and 0.8 m above the ridge.
- **409 Security.** Two flat blocks: 709 m² at 7.7 m (three storeys of 2.6 m) and 174 m² at
  10.1 m (three storeys of 3.4 m), from its three published levels. Today's block is 10.8 m
  everywhere, so most of the roof comes down by 3.1 m. The 44 m² piece that fits no plane is not
  drawn, and the batch's table flags it: its cells count as LiDAR only in the top-view check.

None of the three has a residential or childcare floor, and none is culturally significant.

### Buildings the LiDAR cannot support

The same measurement leaves these as blocks:

| Building | Outline | LiDAR roof inside it | Vegetation over it | Why the block stays |
| --- | --- | --- | --- | --- |
| 122 Glasshouses | 24.5 m² | 0 m²: 17 building points, all under 2.5 m | 95% | glass under trees |
| 120 Grounds Bldg | 78.8 m² | 0 m² | 97% | under trees |
| 121 Gardener's Cottage | 59.4 m² | 19.8 m² (33%) | 90% | mostly under trees |
| 136 Chiller | 89.6 m² | 4.2 m² (5%) | 18% | low or open: ground is seen in 66 of its 1 m cells |
| 126 Northern Underpass | 257.8 m² | 0 m² | 41% | under the ground: the LiDAR sees the street |
| 331 Southern Underpass | 225.9 m² | 35.5 m² (16%), all from the tall buildings beside it | 72% | under the ground |
| 129 Overbridge | 26.1 m² | 17.8 m² (67%) | 27% | below the cover limit. Its top is 10.8 to 11.2 m above the road, and ground is seen under 17 of its 28 1 m cells: open below (decision 8) |
| 408 UniPress | 190.8 m² | 0 m² | 95% | ground is seen in 187 1 m cells under the trees, so the 2024 LiDAR shows no roof there. The campus map may be out of date or the outline misplaced: a question for the maintainer, not for the generator |

### How the numbers were measured

The eight tiles were cropped to the 48 tier-3 buildings (see "Which buildings"). Outlines were
taken from `campus.json` to local NZTM metres with the same projection as `common.py`. For each
building: building points inside the outline or within 1 m of it; a 0.5 m heightmap of the
highest point in each cell; roof cells above 2.5 m; layers by height bands and connected cells;
slopes from a plane fitted to each point's neighbours within 1.2 m. Cover and IoU are on the
0.5 m grid with single gaps closed, as `topview.py` does. The script stayed outside the repository.
The generator will measure these again, and its numbers decide.

## Decisions the maintainer must take

1. **Draw measured massings at all.** This amends "One source for a University building"
   (sub-point "Landmarks") and the street look's "By rule from the data already published; nothing
   placed", with the words proposed in section 3. A gate.
2. **Where the output lives:** A, a folder for each building, or B, one shared model with a data
   file for each building (recommended). B needs a small change to PR #68's discovery.
3. **The limits.** Roof cover of 85% of the outline or more, vegetation over 15% or less,
   footprint IoU of 0.90 or more and 90% of cells within 0.5 m in the top-view check. Below any of
   them the block stays.
4. **Storeys.** From the building's published levels, spaced to the measured walls (proposed; no
   further amendment), or from the measured wall height in whole storeys near 3.6 m (amendment 2
   then ends with the other words in section 3). They disagree: 113 has three levels on the map
   under a 7.8 m roof, so three storeys of 2.6 m, against two of 3.9 m. Spaced to each eave, parts
   of one building under different eaves get different storeys (409: 2.6 m and 3.4 m side by side),
   so their window rows do not line up where the parts meet.
5. **Roofs.** The map's roof colour for flat and pitched roofs alike, and no colour from the aerial
   photos (proposed). Or a second roof colour for pitched roofs.
6. **Where people live and childcare centres.** Draw their exterior shell, or keep their blocks
   (the default until decided). The same answer applies to the landmarks: 102 Old Government House
   has residential floors and is being drawn outside in detail on `loop-a2-old-government-house`.
   Also: whether 450 UniLodge Whitaker counts as a place where people live although its floor is
   not marked so. (841 Nicholls Lane ECE needs no decision here: open PR #69 marks its floor as a
   childcare centre's.)
7. **Waipapa Marae (251 to 256) and Fale Pasifika (275).** Massing only in any case. Include them
   in the first batch, or keep their blocks until the maintainer has asked the people they belong
   to.
8. **Bridges and canopies.** Keep their blocks (proposed for the first batch), or draw them open
   below with an underside one storey under the measured top, labelled "estimated" on screen.
9. **Which buildings first.** The 48 tier-3 buildings of the City campus (see "Which buildings"),
   in the eight tiles already on disk (proposed). Other campuses need new tiles (a gate), and Tai
   Tokerau another LiDAR set (a new data source).
10. **408 UniPress.** The 2024 LiDAR shows no roof on its outline. Keep its block and open a
    `source-data` issue to check the campus map's record (proposed), or keep its block and leave it
    at that.
