# Landmark: the Clock Tower, drawn from code

An experiment beside the campus map: the University of Auckland Clock Tower (building 105) drawn in
three.js from code alone, sized by the LINZ 2024 LiDAR and checked against Street View photographs,
by a lead agent and five agents in parallel. It is not part of the site: nothing here is built,
tested or deployed with it, and the map does not read it. How to make the next one: the
`landmark-from-code` skill (`.claude/skills/landmark-from-code/`).

![The Clock Tower, rendered from code](../../docs/landmarks/clocktower-front.jpg)

- **What is automatic**: measuring the building, fetching the references, correcting their cameras,
  rendering and scoring the model against them (`./run.sh`). **What is not**: the model itself
  (`src/parts/`), which the agents write and rewrite by looking at those comparisons.
- The rules the agents worked to: [`docs/CONTRACT.md`](docs/CONTRACT.md) and
  [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## Look at the model

From the repository root, after `npm install`:

```
python3 -m http.server 8765 --bind 127.0.0.1
```
then open `http://localhost:8765/landmarks/clocktower/index.html?view=orbit` (drag to turn, wheel to
zoom). Other options: `?only=tower` (one part), `?quality=low` (phone settings),
`?pos=x,y,z&look=x,y,z&fov=40` (a camera).

## Run the pipeline

```
./run.sh            # all stages: data -> refs -> refine -> compare (+ metrics)
./run.sh compare    # one stage; stages can be chained: ./run.sh refine compare
```

In a fresh clone the first `refs` needs a Google Maps key and `ALLOW_FETCH=1` (it buys the Street View
tiles once: about 1,500, inside the free monthly quota; see "What is billed"). After that every run is
offline from the local cache.

## Requirements

- Python 3.10+ with `requirements.txt` (numpy, scipy, laspy with lazrs, pyproj, pillow, matplotlib,
  rasterio, requests), always run with `-I`. `PY=/path/to/python ./run.sh` picks the interpreter
  (default `python3`).
- The repository's own `npm install` (three.js and Playwright; nothing is added), Google Chrome
  (`CHROME_CHANNEL` picks another Playwright channel) and a GPU for the headless renders.
- The page is served from the **repository root** on `$PORT` (default 8765), so that its import map
  reaches `node_modules/three`. `run.sh` starts `python3 -m http.server` there if nothing serves the
  page, and stops it afterwards. If something else listens on 8765, use `PORT=8777 ./run.sh`.
- For the references: a Google Maps Platform key with the Map Tiles API, in `$GOOGLE_MAPS_KEY` or
  `~/.gmaps_key` (either the bare key or `export GOOGLE_MAPS_KEY=...`). Never commit it.
- Comparison videos (photograph, model, overlay): `node tools/video.mjs` then
  `python -I tools/video.py out/video --across wide,tower,door` (needs ffmpeg). They hold Street
  View frames: keep them local.

## The frame

Everything shares one frame, in metres: **x** to the right as seen from Princes St, **y** up from
the ground at the door (45.8 m NZVD2016), **z** toward the street, the tower's centre at x = z = 0.
It is measured from the LiDAR, not from the campus outline (the main project's `campus.json` outline
is several metres off the LiDAR):

- local metres = NZTM (EPSG:2193) minus the NZTM of the campus origin (-36.8523, 174.7691);
- tower centre = mean x/y of building points (class 6) higher than 30 m above the ground;
- facade axis = principal axis of building points 3–16 m high within 45 m of the centre (pointing
  north-north-east, bearing 19.0°); the view frame's x is minus this axis;
- toStreet = the axis turned 90° toward the west (the front faces bearing 289°); this is +z.

Result: `data/clocktower_frame.json` (centre (35.196, 228.507) local m). `measure.py` checks it
against `frame.expected` in the config and warns if it moves.

## Stages

| stage | script | inputs | outputs |
| --- | --- | --- | --- |
| data | `tools/data/fetch_lidar.py` | config `lidar` | `data/lidar/*.laz` (8 tiles; skipped if present, symlinked from a mirror dir, else downloaded) |
| | `tools/data/measure.py` | LiDAR tiles, config | `data/clocktower_pts.npy` (x, y, z, class in local m), `_ring.json` (E0, N0, crop box, outline), `_frame.json`, `_plan_frame.png`, `_front_elevation.png` |
| | `tools/data/heightmap.py` | points, LINZ aerial (public COG, read once) | `data/clocktower_aerial.tif` (cached crop), `_heightmap_vs_aerial.jpg` |
| refs | `tools/streetview_collect.py` | frame, points, cached tiles, `refs/streetview/metadata.json` | `refs/streetview/<pano>_{wide,tower,door}.jpg`, `views.json` (camera per view), `index.json`, `metadata.json` |
| | `tools/sky_mask.py` | the reference views | `refs/streetview/masks/<view>.png` (0 sky, 128 ignore, 255 solid) |
| refine | `tools/refine_cameras.mjs` + `tools/mask.html` | views, masks, the model (`src/clocktower.js`) | `refs/streetview/views_refined.json`, `out/refine/report.{json,md}`, `*_outline.jpg` |
| compare | `tools/compare.mjs` | the page, `views_refined.json` (else `views.json`) | `$OUT/<view>.png`, `<view>_strip.jpg` (reference, render, overlay), `labels/`, `views_used.json`, then metrics |
| metrics | `tools/metrics.py` | compare's renders, labels, masks | `$OUT/metrics.json`, `metrics.md` |

`$OUT` defaults to `out/pipeline/compare`. `compare.mjs` keeps its command line
(`--out`, `--match`, `--query`); `--no-metrics` skips the silhouette renders and the metrics.

Idempotence: data outputs are skipped when present (`--force` to redo); refs rebuilds the same
images from the cache (byte-identical); refine and compare overwrite their outputs, and give the same
result for the same model.

Nothing under `data/` or `refs/` is committed: the LiDAR derivatives are rebuilt by `data`, and the
Street View imagery and metadata are Google's and stay on the machine that fetched them.

### References (Street View)

Cache-first: tiles are kept in `refs/streetview/tiles/<panoId>/<zoom>_<col>_<row>.jpg` and are
never fetched again. A tile that is not cached is **not** bought unless `--allow-fetch` is given;
the run lists it, and a view that would need it keeps its existing image. By default `run.sh refs`
works offline from `metadata.json` (no network call at all); `REFS_ONLINE=1 ./run.sh refs` repeats
the free calls (createSession, panoIds, metadata) and saves the metadata again; a fresh clone has no
`metadata.json` and goes online. The panoramas are the ones listed in the config's
`streetview.pano_ids` (without that list, those within `radius_m` of the building). 12 panoramas, three
views each: `wide` (whole front, hfov 95°), `tower` (30°), `door` (45°); camera 2.5 m above the
LiDAR ground under it.

### Camera refinement

Street View positions are good to about 1–3 m. For each panorama (its three views share one
camera) `refine_cameras.mjs` searches a correction — position ±3 m, height ±1 m, yaw and pitch ±2°
(config `refine`) — that best overlaps the model's silhouette with the photograph's building/sky
boundary:

- the model is drawn flat in `tools/mask.html` (red above the cut height of 8 m, yellow below,
  green ground, black sky), which imports `src/clocktower.js` directly;
- the photo's sky is segmented by colour and smoothness (clear blue, plus pale sky that joins it);
  trees, orange leaves, dark trunks and glass, and blue that does not reach the sky are *ignored*;
- score = IoU of model-above-cut vs photo-solid over pixels that are neither ignored nor below the
  cut, pooled over the panorama's views, minus a small prior on the size of the correction;
- compass search from five starts at quarter resolution (~500 renders per panorama, ~15 s for all).

A correction is applied only when the photo's sky is well labelled round the model's silhouette
(≥ 20 % photo sky and ≤ 50 % photo solid next to it) and it raises the IoU by ≥ 0.01. Backlit views
with hazy white sky, views mostly of trees, and the back view keep their Street View camera.
`views_refined.json` holds every view, with `refine: {from, delta, applied, iou_before, iou_after}`.

### Metrics

Per view: silhouette IoU (as above) and, inside the building region (model building ∩ photo
solid), luma percentiles p02/p10/p50/p90/p98 (Rec.709 on sRGB, 0–255) and the mean sRGB colour of
the reference and of the render; plus the mean over views.

## What is billed

- Map Tiles API **Street View tiles**: 100,000 free a month, then **$2 per 1,000** (the 12
  panoramas use 1,526 tiles: free inside the monthly quota, about $3 beyond it). The pipeline downloads
  **0** tiles unless `ALLOW_FETCH=1` (`--allow-fetch`) is given; a rerun reports `0 downloaded`.
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

1. Copy `config/clocktower.json` to `config/<name>.json` and set `name` (prefix of every file in
   `data/`), `building.id`, `building.outline` (any rough outline in local metres: it only chooses
   the crop box), `ground` (NZVD2016 height at the entrance), `lidar.tiles` / `aerial.tiles` (the
   LINZ tile numbers covering it), the `frame` thresholds (the tallest part's height, the height band
   and radius of the main range) and `street_side`; drop `frame.expected` on the first run, then fill
   it from `data/<name>_frame.json`.
2. `CONFIG=config/<name>.json ./run.sh data` and look at the plan, elevation and heightmap figures.
3. References: `streetview_collect.py` writes into `refs/streetview/`: move the current ones away
   first, set `streetview` in the config (drop `pano_ids` to search round the building, then pin
   the ones you keep), and run `ALLOW_FETCH=1 CONFIG=config/<name>.json ./run.sh refs` (billed, see above).
4. The model (`src/`) and `tools/mask.html` still draw the Clock Tower; a new building needs its
   own model module, imported by the page and by `tools/mask.js`, written by a round of agents as
   in the skill's `METHOD.md`.
