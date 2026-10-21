# Landmarks drawn from code

A **landmark** is one real campus building drawn in three.js from code alone, sized by the LINZ
LiDAR and checked against Street View photographs. It lives beside the campus map: nothing here is
built, tested or deployed with the site, and the map does not read it yet. How to make one: the
`landmark-from-code` skill (`.claude/skills/landmark-from-code/`).

| Folder | What it holds | Shared? |
| --- | --- | --- |
| `kit/` | What every model is built with: `Builder` and the Gothic window, wall and pinnacle kit (`gothic.js`), textures drawn in code (`textures.js`), the materials (`materials.js`) | yes |
| `pipeline/` | `run.sh` and its `tools/`, the viewer page (`viewer/index.html`) and the silhouette page (`viewer/mask.html`) | yes |
| `<name>/` | One building: `config/<name>.json`, `model.js`, `parts/`, `placement.json`, `docs/`, and optionally `landscape.js` (its street, for the viewer only) | no |

- **What is automatic**: measuring the building, fetching the references, correcting their cameras,
  rendering and scoring the model against them, and placing it on the map (`pipeline/run.sh`).
  **What is not**: the model itself (`<name>/parts/`), which agents write and rewrite by looking at
  those comparisons.
- **The kit is shared.** A change to `kit/` changes every landmark. Add options and exports with
  defaults; keep what an existing call produces. Check each landmark after a kit change: the viewer
  with `?quality=low` and `?mask=1` draws the same picture every time, so its screenshots before and
  after the change must be identical.

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

In a fresh clone the first `refs` needs a Google Maps key and `ALLOW_FETCH=1` (it buys the Street View
tiles once: about 1,500 for the Clock Tower, inside the free monthly quota; see "What is billed").
After that every run is offline from the local cache.

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
  - facade axis = principal axis of building points `min_above` to `spine_below` m high within
    `spine_radius` m of the centre (pointing north-ish); x is minus this axis;
  - toStreet = the axis turned 90° toward `street_side`; this is +z.

  It writes `data/<name>_frame.json` and warns when the frame moves from `frame.expected` in the
  config. The model, the cameras and the placement use `frame.expected`.
- **The map's frame**, in which the site draws everything (`public/data/campus.json`): metres east
  and north of the same origin through an equirectangular projection (`makeProjector` in
  `src/shared/geo.ts`), true north. It is not NZTM. At the Clock Tower the two frames differ by
  4.2 m and 1.06°, so a number in one frame is not a place in the other.

## Placement

`pipeline/run.sh <name> place` (also the end of `data`) takes the view frame through longitude and
latitude to the map's frame and writes `<name>/placement.json`:

| key | what it is |
| --- | --- |
| `building` | the campus map's building id |
| `centre` | the model's x = z = 0, in map metres east and north |
| `bearing` | the compass bearings (true) of the model's +x and +z |
| `rotationY` | radians about the scene's y axis (x east, y up, z south) that turn the model onto the map |
| `scale` | map metres per model metre (1.0001 at the Clock Tower: leave it out) |
| `door` | the point whose ground is the model's y = 0, in the view frame (`model`) and on the map (`map`) |

The map's ground comes from another elevation model (the 8 m LINZ DEM) than `ground` (the LiDAR), so
a model stood on the map takes its height from the map's own ground at `door.map`, not from `ground`.
The stage needs no LiDAR: it reads `frame.expected` and `door` from the config.

## Stages

Script paths are in `pipeline/`; inputs and outputs are in the landmark's folder.

| stage | script | inputs | outputs |
| --- | --- | --- | --- |
| data | `tools/data/fetch_lidar.py` | config `lidar` | `data/lidar/*.laz` (skipped if present, symlinked from a mirror dir, else downloaded) |
| | `tools/data/measure.py` | LiDAR tiles, config | `data/<name>_pts.npy` (x, y, z, class in local m), `_ring.json` (E0, N0, crop box, outline), `_frame.json`, `_plan_frame.png`, `_front_elevation.png` |
| | `tools/data/heightmap.py` | points, LINZ aerial (public COG, read once) | `data/<name>_aerial.tif` (cached crop), `_heightmap_vs_aerial.jpg` |
| place | `tools/data/place.py` | config `frame.expected`, `door` | `placement.json` |
| refs | `tools/streetview_collect.py` | frame, points, cached tiles, `refs/streetview/metadata.json` | `refs/streetview/<pano>_{wide,tower,door}.jpg`, `views.json` (camera per view), `index.json`, `metadata.json` |
| | `tools/sky_mask.py` | the reference views | `refs/streetview/masks/<view>.png` (0 sky, 128 ignore, 255 solid) |
| refine | `tools/refine_cameras.mjs` + `viewer/mask.html` | views, masks, the model (`model.js`) | `refs/streetview/views_refined.json`, `out/refine/report.{json,md}`, `*_outline.jpg` |
| compare | `tools/compare.mjs` | the viewer, `views_refined.json` (else `views.json`) | `$OUT/<view>.png`, `<view>_strip.jpg` (reference, render, overlay), `labels/`, `views_used.json`, then metrics |
| metrics | `tools/metrics.py` | compare's renders, labels, masks | `$OUT/metrics.json`, `metrics.md` |

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

Cache-first: tiles are kept in `refs/streetview/tiles/<panoId>/<zoom>_<col>_<row>.jpg` and are
never fetched again. A tile that is not cached is **not** bought unless `--allow-fetch` is given;
the run lists it, and a view that would need it keeps its existing image. By default `run.sh refs`
works offline from `metadata.json` (no network call at all); `REFS_ONLINE=1` repeats the free calls
(createSession, panoIds, metadata) and saves the metadata again; a fresh clone has no
`metadata.json` and goes online. The panoramas are the ones listed in the config's
`streetview.pano_ids` (without that list, those within `radius_m` of the building). Each panorama
gives the views the config's `streetview.views` names (for the Clock Tower: `wide`, the whole front,
hfov 95°; `tower`, 30°; `door`, 45°); camera 2.5 m above the LiDAR ground under it.

### Camera refinement

Street View positions are good to about 1–3 m. For each panorama (its views share one camera)
`refine_cameras.mjs` searches a correction — position ±3 m, height ±1 m, yaw and pitch ±2°
(config `refine`) — that best overlaps the model's silhouette with the photograph's building/sky
boundary:

- the model is drawn flat in `viewer/mask.html` (red above the cut height, yellow below, green
  ground, black sky), which imports the landmark's `model.js` directly;
- the photo's sky is segmented by colour and smoothness (clear blue, plus pale sky that joins it);
  trees, orange leaves, dark trunks and glass, and blue that does not reach the sky are *ignored*;
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

## What is billed

- Map Tiles API **Street View tiles**: 100,000 free a month, then **$2 per 1,000** (the Clock
  Tower's 12 panoramas use 1,526 tiles: free inside the monthly quota, about $3 beyond it). The
  pipeline downloads **0** tiles unless `ALLOW_FETCH=1` (`--allow-fetch`) is given; a rerun reports
  `0 downloaded`.
- createSession, panoIds and metadata calls: free.
- LINZ LiDAR (OpenTopography bucket) and LINZ aerial (AWS open data): free, no login.

## Licences

- LiDAR: LINZ, Auckland LiDAR point cloud (2024), tiles `CL2_BA32_2024_1000_*`, via OpenTopography — CC BY 4.0.
- Aerial: LINZ, Auckland 0.06 m Urban Aerial Photos (2023) — CC BY 4.0.
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
   then pin the ones you keep) and run `ALLOW_FETCH=1 landmarks/pipeline/run.sh <name> refs` once
   (billed, see above).
4. The model: `model.js` and `parts/`, built with `kit/`, and `config/default_camera.json`; then a
   round of agents as in the skill's `METHOD.md`.
5. Set `door` in the config to the foot of the entrance, where the ground is `ground`, and run
   `landmarks/pipeline/run.sh <name> place`.
