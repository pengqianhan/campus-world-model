# Landmarks drawn from code

A **landmark** is one real campus building drawn in three.js from code alone, sized by the LINZ
LiDAR and checked against Street View photographs. The site draws the landmarks whose
`placement.json` says `site: true` in place of their buildings' blocks (see "On the site"). The pipeline
and the viewer stay beside the site: it does not build, test or deploy them. How to make a landmark:
the `landmark-from-code` skill (`.claude/skills/landmark-from-code/`).
The many plain buildings are drawn by a program instead, as **measured massings**: the design is
[MASSING.md](MASSING.md), and "Measured massings" below says how it is built.

| Folder | What it holds | Shared? |
| --- | --- | --- |
| `kit/` | What every model is built with: `Builder` and the Gothic window, wall and pinnacle kit (`gothic.js`), textures drawn in code (`textures.js`), the materials (`materials.js`) | yes |
| `pipeline/` | `run.sh` and its `tools/`, the viewer page (`viewer/index.html`) and the silhouette page (`viewer/mask.html`) | yes |
| `<name>/` | One building: `config/<name>.json`, `model.js`, `parts/`, `placement.json`, `docs/`, and optionally `landscape.js` (its street, for the viewer only) | no |

- **What is automatic**: measuring the building, fetching the references, correcting their cameras,
  rendering and scoring the model against them, and placing it on the map (`pipeline/run.sh`).
  **What is not**: the model itself (`<name>/parts/`), which agents write and rewrite by looking at
  those comparisons.
- **The kit is shared.** A change to `kit/` changes every landmark, in the viewer and on the site.
  Add options and exports with defaults; keep what an existing call produces. Check each landmark
  after a kit change: the viewer with `?quality=low` and `?mask=1` draws the same picture every time,
  so its screenshots before and after the change must be identical.

## A landmark's files

- `model.js` exports `build(materials, only)`. It returns a `Group` in the view frame (below) and
  builds only the parts named in `only` when it is given.
- `config/<name>.json`: the building id, the LiDAR and aerial tiles, `ground`, `door`, the `frame`
  thresholds and `frame.expected`, the Street View panoramas and the refinement bounds.
  `config/default_camera.json` is the viewer's first view.
- `placement.json`: where the model stands on the campus map. `pipeline/run.sh <name> place` writes
  it; see "Placement".
- `landscape.js`, when there is one, exports `landscape(scene, { quality, shadows })`.

## Look at a landmark

From the repository root, after `npm install`:

```
python3 -m http.server 8765 --bind 127.0.0.1
```
then open `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=clocktower&view=orbit`
(drag to turn, wheel to zoom). Other options: `&only=tower` (one part), `&quality=low` (phone
settings), `&pos=x,y,z&look=x,y,z&fov=40` (a camera), `&landscape=0` (the building alone).

## Run the pipeline

```
landmarks/pipeline/run.sh clocktower            # all stages: data -> refs -> refine -> compare (+ metrics)
landmarks/pipeline/run.sh clocktower compare    # one stage; stages can be chained: ... refine compare
```

Every stage and tool runs in the landmark's folder; `run.sh` goes there. To run a tool alone, go there
first: `cd landmarks/clocktower && node ../pipeline/tools/compare.mjs --out out/me --match tower`.

The `data` and `refs` stages fetch through `scripts/lib/snapshot.ts` (see "Fetching"); `place`,
`refine`, `compare` and `metrics` work from what is on disk.

In a fresh clone the first `refs` needs a Google Maps key, `ALLOW_FETCH=1` and a ledger in
`GMAPS_BUDGET` (it buys the Street View tiles once: about 1,500 for the Clock Tower, inside the free
monthly quota, in about 28 minutes at one request every 1.1 s; see "What is billed"). After that
every run is offline from the local cache.

## Requirements

- Python 3.10+ with `pipeline/requirements.txt` (numpy, scipy, laspy with lazrs, pyproj, pillow,
  matplotlib, rasterio, requests), always run with `-I`. `PY=/path/to/python` picks the interpreter
  (default `python3`). The `place` stage needs only pyproj.
- The repository's own `npm install` (three.js and Playwright; nothing is added), Google Chrome
  (`CHROME_CHANNEL` picks another Playwright channel) and a GPU for the headless renders.
- The pages are served from the **repository root** on `$PORT` (default 8765), so that their import
  maps reach `node_modules/three`. `run.sh` starts `python3 -m http.server` there if nothing serves
  the viewer, and stops it afterwards. If something else listens on 8765, use `PORT=8777`.
- For the references: a Google Maps Platform key with the Map Tiles API, in `$GOOGLE_MAPS_KEY` or
  `~/.gmaps_key` (either the bare key or `export GOOGLE_MAPS_KEY=...`). Never commit it.
- Comparison videos (photograph, model, overlay): `node ../pipeline/tools/video.mjs` then
  `python -I ../pipeline/tools/video.py out/video --across wide,tower,door` (needs ffmpeg). They hold
  Street View frames: keep them local.

## The frames

A landmark is measured in one frame and shown in another.

- **The view frame**, in which the model is drawn, in metres: **x** to the right as seen from the
  street, **y** up from the ground at the door (`ground`, NZVD2016), **z** toward the street, the
  tallest part's centre at x = z = 0. `measure.py` finds it in the LiDAR:
  - local metres = NZTM (EPSG:2193) minus the NZTM of the campus origin (-36.8523, 174.7691), grid north;
  - centre = mean x/y of building points (class 6) higher than `frame.tower_above` m above the ground;
    with `frame.near_outline` (metres), only the points inside the building's outline or that near
    its edge count, for a building with others in its crop box;
  - facade axis = principal axis of building points `min_above` to `spine_below` m high within
    `spine_radius` m of the centre (pointing north-ish when `street_side` is `west`, south-ish when
    it is `east`); x is minus this axis. With `frame.axis_from: "walls"`, for a building of wings
    at different angles whose principal axis falls between them, the axis is instead the bearing of
    most of its wall length, seen from above in its points (of the two square to each other, the
    one nearest the principal axis). `"walls"` is the only value it takes: any other stops `measure`;
  - toStreet = the axis turned 90° toward `street_side`; this is +z.

  It writes `data/<name>_frame.json` and warns when the frame moves from `frame.expected` in the
  config. The model, the cameras and the placement use `frame.expected`.
- **The map's frame**, in which the site draws everything (`public/data/uoa/campus.json`): metres east
  and north of the same origin through an equirectangular projection (`makeProjector` in
  `src/shared/geo.ts`), true north. It is not NZTM. At the Clock Tower the two frames differ by
  4.2 m and 1.06°, so a number in one frame is not a place in the other.

## Placement

`pipeline/run.sh <name> place` (also the end of `data`) takes the view frame through longitude and
latitude to the map's frame and writes `<name>/placement.json`:

| key | what it is |
| --- | --- |
| `site` | whether the site draws the landmark: the config's `site`, `true` or `false` (left out: `false`) |
| `building` | the campus map's building id |
| `also` | the other buildings of the campus map whose blocks the model covers (config `building.also`): the Clock Tower's south range is 105S |
| `centre` | the model's x = z = 0, in map metres east and north |
| `bearing` | the compass bearings (true) of the model's +x and +z |
| `rotationY` | radians about the scene's y axis (x east, y up, z south) that turn the model onto the map |
| `scale` | map metres per model metre (1.0001 at the Clock Tower: leave it out) |
| `door` | the point whose ground is the model's y = 0, in the view frame (`model`) and on the map (`map`) |
| `part` | only when a part of the building is drawn in detail: the config's `part`, the words for that part. The building's card names it and says that the rest keeps its estimated height (Old Choral Hall: "Its range on Symonds Street") |

The map's ground comes from another elevation model (the 8 m LINZ DEM) than `ground` (the LiDAR), so
a model stood on the map takes its height from the map's own ground at `door.map`, not from `ground`.
The two can be a metre or more apart: a model's walls go down below y = 0 as far as the map's ground
falls under it (Old Government House's to 1.6 m below its porch), so that their foot is nowhere
more than 0.25 m above it. `tests/landmarks.test.ts` checks that for every landmark on the site, at
the lowest points of each material's mesh that reaches y = 0 (the kit joins a model's parts by
material, so a part with a higher foot can hide behind another): give every part's walls the same
foot, as Old Government House's parts take `FOOT` from `common.js`.
The stage needs no LiDAR: it reads `frame.expected`, `door`, `building` and `site` from the config.

## On the site

The site draws each landmark whose `<name>/placement.json` says `site: true`, in place of the
blocks of `building` and `also` (`PROGRESS.md`, "Decisions": one source for a University building).
It finds them itself (`import.meta.glob` in `src/app/landmarks.ts`): no list in `src/` names them.

- **Only near it.** Nothing is fetched or made until the camera comes near: on the map, where a
  metre of ground takes 1.5 pixels or more; in a walker view, within 600 m (`LANDMARK_PIXELS` and
  `LANDMARK_REACH` in `src/scene/CampusScene.ts`). Further away the blocks are drawn as before, and
  the map does not change by a pixel.
- **Two forms of one geometry** (`src/scene/landmarks.ts`). The light form has the map's colours and
  no texture. The map draws it, and so do the walker views of the basic tier (phones and software
  rendering). The full form has the kit's materials. The walker views of the full tier draw it.
- **Off the main thread.** A worker (`src/scene/landmarkWorker.ts`) builds the geometry with
  `geometryMaterials()` and the textures with `makeTextures("low")`. It is an ES module
  (`worker.format` in `vite.config.ts`) that loads `<name>/model.js` by the landmark's name the
  first time it is asked for, so each model is a chunk of its own
  (`assets/landmark-<name>-<hash>.js`): coming near one landmark downloads the worker, which holds
  three.js and every file of `kit/` (`vite.config.ts` counts the kit's files as having side
  effects, so the build keeps each one in the worker), and then that landmark's model, and no other
  landmark's model.
  Every `<name>/model.js` is built and published as a chunk, on the site or not, and every
  `placement.json` goes into the page's code; "off the site" means only that the site does not draw
  it. The page then makes the
  materials with `makeMaterials("low", textures, { space: "object" })`, which lays the weathering
  in the model's own frame, as the viewer shows it, and makes their shaders before the form's first
  frame (`compileAsync`). A form is drawn once its shaders are made; until then the light form, or
  the blocks, stand in.
- **The blocks stay.** A click finds them, and they open on their floors. While a form is drawn
  they are on a layer that no camera draws. The worker sorts the model's triangles by the building
  whose outline holds them, so each building's part takes its own colours and its own hover.
- **The landscape stays in the viewer.** The walker views keep their own streets and trees round
  the building.

To put another landmark on the site, set `"site": true` in its config, list in `building.also`
every other building of the campus map whose block the model covers, and run `place`. The site
finds the new `placement.json` and loads the folder's `model.js`: no code in `src/` lists the
landmarks, and `e2e/landmark.spec.ts` tests every landmark it finds. The same pull request also
needs:

- a line in `CHANGELOG.md` and a few words in the README's "What's new": a new landmark changes
  what the site shows (`docs/standards.md`, check 6);
- a check of About's fixed words for the landmarks (`about.landmarks` in
  `src/i18n/locales/*.json`), which name their materials ("such as stone, brick, concrete, painted
  render and timber, glass, slate, clay tiles and metal"): change them if the new building is of
  another;
- for each material of the model that `LIGHT_ROLE` in `src/scene/landmarks.ts` does not list yet
  (it lists `roof`, `roofPale`, `roofGrey`, `roofGreen`, `roofTile`, `glass`, `glassPale`, `iron` and
  `void`)
  but that is a roof, a pane or an opening, its part there. Every other material is drawn as wall
  in the light form, so on the map a roof in a new material takes the wall colour until it is listed;
- in the README, the building in "Known limitations" (the buildings whose sizes are measured, not
  estimated) and, in the sources table, the LiDAR's and Street View's "Used for";
- a look at it on the map and from a walker's height, and the speed numbers (`docs/standards.md`,
  check 9).

To take one off the site, set `site` to `false` and run `place` again, and change the same
`CHANGELOG.md`, "What's new" and README lines (`docs/standards.md`, check 6). Then look at the map
and the walker's views where it stood, and give the speed numbers (check 9).

## Measured massings

A measured massing (`MASSING.md`) is a plain building drawn by a program from the LiDAR, with no
agent and no photograph. All of them share one model and have a data file each:

- `pipeline/tools/massing.py` measures every tier-3 building of the City campus that the eight
  LiDAR tiles in `data/raw/landmarks/lidar/` cover (it fetches nothing), and, as stand-ins until
  their landmarks come, the buildings of tiers 1 and 2 there that the site does not draw as
  landmarks (it reads the placements; `SOON` holds those in progress on other branches), from the
  repository root: `$PY -I landmarks/pipeline/tools/massing.py [--tier3] [ids]`. It writes
  `measured/buildings/<id>.json` for each that passes the limits, and `measured/exclusions.json` for
  each that keeps its block, with its reason; a run over every building also drops the data file of
  one it no longer measures. Its top views (LiDAR | model | difference) and a table go to
  `measured/out/`, which is not committed.
- How it measures: the ground round the outline; roof cells (a 0.5 m heightmap, a cell being roof
  where most of its points are building points over 2.5 m); layers where neighbouring cells step
  by more than 0.6 m, of cells that a plane fits within 0.15 m; each layer's roof flat, or the
  lowest of its sloping planes (one plane a mono-pitch, two opposite a gable, more a hip), each
  plane fitted to the cells that fall that way, then again to the cells it fits best. The lowest layer stands on the campus outline,
  with its eaves round it, edge by edge (how far building points at its eave reach out past each
  edge: the median along it); the others stand on it, traced from the LiDAR and put onto the outline
  where they meet it. Roof that no layer draws (a chimney, plant, a tree classed as building) is
  left out.
- `measured/model.js` builds any of them from its data file with the site's `MeshBuilder`
  (`src/scene/geometry.ts`), so that its walls carry what the blocks' walls carry: storeys from the
  published levels spaced to the measured walls (2.4 to 4.5 m), the map's 3.2 m bays, the roof
  rim on flat roofs, and the street look's facade data. `pipeline/tools/massing_triangles.mjs`
  gives its triangles to the top-view check: footprint IoU 0.90 or more against the LiDAR, and 90%
  of the cells both cover within 0.5 m (cells of roof that no layer draws are left out of the
  heights).
- On the site (`src/app/landmarks.ts`, `MEASURED`) each data file is a landmark named
  `measured/<id>`. The page's code holds only each file's `place`; the worker loads the shared model
  and all the data files, one chunk each, the first time one is wanted. A measured massing has one
  form, in its block's own materials: the map's palette, windows and night on the map, the facades
  drawn by rule in the walker views. It is drawn where a metre of ground takes 4 pixels or more
  (`MEASURED_PIXELS`), nearer than a landmark, and gives way to the blocks while a building is open.
- `tests/measured.test.ts` checks every data file (closed rings, heights, the limits) and that no
  building is drawn by two models; `e2e/landmark.spec.ts` finds them all and tests three. Vitest
  keeps transformed modules in `node_modules/.vitest-cache`, which does not see a data file added
  or removed: run it with `--fsModuleCache=false` after the generator has run.
- Kept as blocks by decision, whatever the LiDAR (each in `measured/exclusions.json` with its
  reason): places where people live (123, 436, 617 and 838, and of tiers 1 and 2 440, 441, 442,
  614, 616, 818, 831 and 833, by their residential floors; 434, whose
  floor 2 has an Accommodation Reception on the campus map; 450 by its name) and childcare centres
  (410, 841, and 255, which decision 7 keeps too), both until the maintainer decides (MASSING.md
  decision 6); Waipapa Marae (251 to 256) and
  Fale Pasifika (275), until the maintainer has asked the people they belong to (decision 7); and
  408 UniPress, whose outline the LiDAR shows no roof on (decision 10).
- Roofs: every roof, flat or sloping, takes its block's roof: the map's roof colour on the map, and
  the street look's flat roof in the walker views (decision 5). A sloping facet is marked as the
  builder's roofs are (`MeshBuilder.facet`, `facade.cap`).
- To make one a landmark: start `<name>/` as for any landmark, with the massing's numbers as its
  first contract, and delete `measured/buildings/<id>.json` in the same pull request.

## Stages

Script paths are in `pipeline/`; inputs and outputs are in the landmark's folder.

| stage | script | inputs | outputs |
| --- | --- | --- | --- |
| data | `tools/data/fetch_lidar.py` | config `lidar` | `data/lidar/*.laz` (skipped if present, symlinked from a mirror dir, else fetched once into `data/raw/landmarks/` and linked) |
| | `tools/data/measure.py` | LiDAR tiles, config | `data/<name>_pts.npy` (x, y, z, class in local m), `_ring.json` (E0, N0, crop box, outline), `_frame.json`, `_plan_frame.png`, `_front_elevation.png` |
| | `tools/data/heightmap.py` | points, LINZ aerial (whole public tiles, fetched once into `data/raw/landmarks/`) | `data/<name>_aerial.tif` (cached crop), `_heightmap_vs_aerial.jpg` |
| place | `tools/data/place.py` | config `frame.expected`, `door`, `building`, `site` | `placement.json` |
| refs | `tools/streetview_collect.py` | frame, points, cached tiles, `refs/streetview/metadata.json` | `refs/streetview/<pano>_{wide,tower,door}.jpg`, `views.json` (camera per view), `index.json`, `metadata.json` |
| | `tools/sky_mask.py` | the reference views, config `sky_mask` | `refs/streetview/masks/<view>.png` (0 sky, 128 ignore, 255 solid) |
| refine | `tools/refine_cameras.mjs` + `viewer/mask.html` | views, masks, the model (`model.js`) | `refs/streetview/views_refined.json`, `out/refine/report.{json,md}`, `*_outline.jpg` |
| compare | `tools/compare.mjs` | the viewer, `views_refined.json` (else `views.json`) | `$OUT/<view>.png`, `<view>_strip.jpg` (reference, render, overlay), `labels/`, `views_used.json`, then metrics |
| metrics | `tools/metrics.py` | compare's renders, labels, masks | `$OUT/metrics.json`, `metrics.md` |
| topview | `tools/topview.mjs` + `tools/topview.py` | the model (`model.js`), the data stage's points | `out/topview/triangles.bin`, `metrics.json`, `metrics.md`, `topview.png` |

`$OUT` defaults to `out/pipeline/compare`. `compare.mjs` keeps its command line
(`--out`, `--match`, `--query`); `--no-metrics` skips the silhouette renders and the metrics. Other
tools: `shot.mjs` (one picture from any camera), `part_count.mjs <part>` (a part's triangles per
material and its build time), `look_round.sh` and `look_measure.py` (a round of light measurements).

Idempotence: data outputs are skipped when present (`--force` to redo); refs rebuilds the same
images from the cache (byte-identical); refine and compare overwrite their outputs, and give the same
result for the same model.

Nothing under a landmark's `data/`, `refs/` or `out/` is committed (`landmarks/.gitignore`): the
LiDAR derivatives are rebuilt by `data`, and the Street View imagery and metadata are Google's and
stay on the machine that fetched them.

### References (Street View)

Cache-first: metadata and tiles are kept in `data/raw/landmarks/streetview/` (see "Fetching") and
are never fetched again. A tile that is not cached is **not** bought unless `--allow-fetch` is given
and the ledger allows it;
the run counts it, and a view that would need it keeps its existing image. By default `run.sh refs`
works offline from `refs/streetview/metadata.json` (no network call at all); `REFS_ONLINE=1` makes
it again from the snapshots, with the free calls (createSession, panoIds, metadata) for what is not
cached; a fresh clone has no `metadata.json` and goes online, and so does a run with `ALLOW_FETCH=1`. The panoramas are the ones listed in the config's
`streetview.pano_ids` (without that list, those within `radius_m` of the building). Each panorama
gives the views the config's `streetview.views` names (for the Clock Tower: `wide`, the whole front,
hfov 95°; `tower`, 30°; `door`, 45°); camera 2.5 m above the LiDAR ground under it. A
panorama's size comes from its metadata (`imageWidth`): most are 16,384 pixels wide at zoom 5, some
13,312, and those have fewer columns of tiles at every zoom. A panorama whose recorded camera is off
by more than the refinement can find may have its camera set in the config
(`streetview.camera_fixes`: panorama id to `[x, z]` in the view frame, with a note saying how it was
found): its views are cut from the panorama as before, and drawn from there looking the same way.

### Camera refinement

Street View positions are good to about 1–3 m. For each panorama (its views share one camera)
`refine_cameras.mjs` searches a correction — position ±3 m, height ±1 m, yaw and pitch ±2°
(config `refine`) — that best overlaps the model's silhouette with the photograph's building/sky
boundary:

- the model is drawn flat in `viewer/mask.html` (red above the cut height, yellow below, green
  ground, black sky), which imports the landmark's `model.js` directly;
- the photo's sky is segmented by colour and smoothness (clear blue, plus pale sky that joins it);
  trees, orange leaves, dark trunks and glass, and blue that does not reach the sky are *ignored*;
  where bare winter branches stand in front of the sky, the config's `sky_mask.branches_deg` (r)
  classifies each photograph again after a grey closing with a disc of r degrees, which gives what
  is darker than its surroundings and narrower than 2r the colour round it, and adds the sky it finds
  (Maclaurin Chapel: 0.4); without it the masks are as before, byte for byte;
- score = IoU of model-above-cut vs photo-solid over pixels that are neither ignored nor below the
  cut, pooled over the panorama's views, minus a small prior on the size of the correction;
- compass search from five starts at quarter resolution (~500 renders per panorama).

A correction is applied only when the photo's sky is well labelled round the model's silhouette
(≥ 20 % photo sky and ≤ 50 % photo solid next to it) and it raises the IoU by ≥ 0.01. Backlit views
with hazy white sky, views mostly of trees, and back views keep their Street View camera.
`views_refined.json` holds every view, with `refine: {from, delta, applied, iou_before, iou_after}`.

### Metrics

Per view: silhouette IoU (as above) and, inside the building region (model building ∩ photo
solid), luma percentiles p02/p10/p50/p90/p98 (Rec.709 on sRGB, 0–255) and the mean sRGB colour of
the reference and of the render; plus the mean over views.

From above (`run.sh <name> topview`), for every landmark and above all for one that no photograph
shows whole: the model's triangles and the LiDAR's points of this building and of those in
`building.also` (inside their outlines, from `campus.json` for `also`, or within `frame.near_outline`
m of them) are drawn as heightmaps on a 0.5 m grid in the view frame of `frame.expected`. It gives the IoU of the two footprints (cells above 2.5 m; gaps between LiDAR points
closed), model minus LiDAR heights on the cells both cover (p10/p50/p90, and the share within
0.5 m), the highest point of each, `topview.png` (LiDAR | model | difference), and for every
block of the campus map within 80 m the share of it under the model's footprint: the blocks it
covers by half or more go in `building.also`.

## Fetching

Every request the pipeline sends goes through `scripts/lib/snapshot.ts` (`PROGRESS.md`,
"Decisions": all network fetching). The Python stages give a batch of operations to
`scripts/landmarks/fetch.ts` through `tools/data/fetch_bridge.py`; what it lets through, and how, is
in `scripts/lib/landmark-fetch.ts`.

- **Only these.** Whole files from the two LINZ buckets the Clock Tower is measured from (the LiDAR
  on OpenTopography, the aerial photos on AWS), and the Map Tiles API's Street View `createSession`,
  `panoIds`, `metadata` and `tiles`. Any other host or path is an error before anything is sent. A
  landmark measured from another LiDAR or aerial set adds its bucket there: that is a new data
  source, for the maintainer to decide.
- **Cached once.** All of it is kept in `data/raw/landmarks/` (gitignored), shared by all landmarks,
  and never fetched again: `lidar/`, `aerial/`, and `streetview/` (`metadata/<panoId>.json`,
  `panoIds/`, `tiles/<panoId>/<zoom>_<col>_<row>.jpg`). A file is written whole or not at all. The
  one exception is the session (`streetview/session.json`): it is used again until ten minutes
  before it expires (two weeks), then asked for anew. The data stage links the LiDAR tiles into the
  landmark's `data/lidar/`. Tiles that the pipeline cached before 2026-10-22, in a landmark's
  `refs/streetview/tiles/<panoId>/`, are no longer read: move each panorama's folder to
  `data/raw/landmarks/streetview/tiles/<panoId>/`, and the next `refs` records them instead of
  buying them again.
- **Paced and logged.** One request every 1.1 s, also from one batch to the next, and one batch at a
  time for the user, from any checkout (a lock in `~/.campus-world-model/`, beside the ledger it
  guards), with the project's User-Agent. The time and URL of
  each request go to `data/raw/landmarks/requests.log`. `data/sources.json` gets one record for each
  LiDAR or aerial file, each panorama's metadata, each `panoIds` answer and the session, and one
  for each panorama's tiles: their count, total size, one sha256 over the sorted list of
  `<file> <sha256>` lines, and when the newest came (the Clock Tower's 1,526 tiles are in 12 records;
  three of the panoramas also gave Old Government House a few tiles, so those records now count both).
  A batch records each panorama's tiles when it is done with them, and at its start records any
  that a batch killed part way left unrecorded. No redirect is followed: a redirect stops the
  batch.
- **The key** is read at the moment of a request, from `$GOOGLE_MAPS_KEY` or `~/.gmaps_key`, and sent
  in the `X-Goog-Api-Key` header, never in a URL. The session token is written as `<session>` in
  every logged URL, and both are taken out of every error message.
- **Tiles are bought through a ledger only.** With `ALLOW_FETCH=1` the batch counts the tiles that
  are not cached (N) and runs `$PY -I $GMAPS_BUDGET check N` first: if it exits other than 0,
  nothing is bought. Then it adds the tiles to the ledger before it sends them, 25 at a time
  (`check 25`, `add 25`), so a batch stopped part way, even killed, has counted a few too many,
  never too few: do not add them to the ledger by hand. A tile that fails with a server error
  (5xx) is tried three times, each try counted. Anything else stops the batch: a refusal (4xx), a
  redirect, a timeout, a dropped connection, a failed write, or a tile that fails all three tries.
  The reason is written to `data/raw/landmarks/streetview/closed.txt`, and no tile is bought
  until a person has looked and deleted it ("closed is a verdict"); a rerun then goes on from the
  cache. Without `GMAPS_BUDGET` nothing is bought. The ledger is a script outside the repository that keeps a
  monthly and a daily count under a cap.

## What is billed

- Map Tiles API **Street View tiles**: 100,000 free a month, then **$2 per 1,000** (the Clock
  Tower's 12 panoramas use 1,526 tiles: free inside the monthly quota, about $3 beyond it). The
  pipeline downloads **0** tiles unless `ALLOW_FETCH=1` (`--allow-fetch`) is given and the ledger
  allows them (see "Fetching"); a rerun reports `0 downloaded`.
- createSession, panoIds and metadata calls: free.
- LINZ LiDAR (OpenTopography bucket) and LINZ aerial (AWS open data): free, no login.

## Licences

- LiDAR: Auckland Part 1 LiDAR point cloud (2024), tiles `CL2_BA32_2024_1000_*` (OpenTopography's
  "Auckland Part 1, New Zealand 2024", `NZ24_Auckland`, https://doi.org/10.5069/G9HH6H8T): sourced
  from LINZ and licensed by Regional Software Holdings Limited for re-use under CC BY 4.0.
- Aerial: Auckland Central 0.06 m Urban Aerial Photos (2023): sourced from LINZ and licensed by
  Auckland Council for re-use under CC BY 4.0.
- Each licensor is as LINZ's page on attributing elevation and aerial imagery data names it
  (checked 2026-10-21). A page that publishes what a landmark measures gives the credit, or LINZ's
  short one ("Sourced from LINZ. CC BY 4.0") with a link to that page.
- Street View imagery and metadata: © Google. Used as references only, to compare against —
  never published, never traced or sampled into the model's geometry or textures.
- Code: MIT, as the rest of the repository. The way of working follows
  [Athenaion](https://github.com/Leonxlnx/athenaion) by Leon Lin (MIT); see the skill's `METHOD.md`.

## Another building

1. Make `landmarks/<name>/config/<name>.json`, starting from `clocktower/config/clocktower.json`.
   Set `name` (the folder's name, and the prefix of every file in `data/`), `building.id`,
   `building.outline` (any rough outline in map metres: it only chooses the crop box), `ground`
   (NZVD2016 height at the entrance), `lidar.tiles` / `aerial.tiles` (the LINZ tile numbers covering
   it), the `frame` thresholds (the tallest part's height, the height band and radius of the main
   range) and `street_side`. Leave out `frame.expected` on the first run, then fill it from
   `data/<name>_frame.json`. Add empty `data/.gitkeep` and `refs/.gitkeep`.
2. `landmarks/pipeline/run.sh <name> data` and look at the plan, elevation and heightmap figures.
3. References: set `streetview` in the config (leave out `pano_ids` to search round the building,
   then pin the ones you keep) and run `ALLOW_FETCH=1 GMAPS_BUDGET=<ledger> landmarks/pipeline/run.sh <name> refs`
   once (billed, see above).
4. The model: `model.js` and `parts/`, built with `kit/`, and `config/default_camera.json`; then a
   round of agents as in the skill's `METHOD.md`.
5. Set `door` in the config to the foot of the entrance, where the ground is `ground`, and run
   `landmarks/pipeline/run.sh <name> place`.
6. To show it on the site, set `"site": true` in the config and run `place` again: see "On the site".
