#!/usr/bin/env bash
# Landmark pipeline: data -> refs -> refine -> compare -> metrics, for one landmark (a folder in landmarks/).
# Each stage is idempotent and runs in the landmark's folder.
#   landmarks/pipeline/run.sh <name> [data|place|refs|refine|compare|metrics|all] ...      (default: all)
# Environment:
#   CONFIG=config/<name>.json       building config, in the landmark's folder
#   PY=python3                      Python with numpy laspy[lazrs] pyproj scipy pillow matplotlib rasterio requests
#   OUT=out/pipeline/compare        compare/metrics output folder
#   REFS_ONLINE=1                   refs: ask Google for panorama ids and metadata again (free calls) instead of
#                                   rebuilding from refs/streetview/metadata.json; tiles still come from the cache
#   QUERY="only=tower"              passed to the page by compare
#   PORT=8765                       where the pages are served (each tool reads $PORT too)
#   ALLOW_FETCH=1                   refs: buy the Street View tiles that are not cached (billed; needed once in a fresh clone)
# Street View tiles are bought only with ALLOW_FETCH=1 (see landmarks/README.md, "What is billed").
set -euo pipefail
T=$(cd "$(dirname "$0")" && pwd)/tools
ROOT=$(cd "$T/../../.." && pwd)
if [[ $# -lt 1 || ! -f "$ROOT/landmarks/${1:-}/config/${1:-}.json" ]]; then
  echo "usage: $0 <name> [stage ...]: <name> is a folder in landmarks/ with config/<name>.json"; exit 2
fi
NAME=$1; shift
cd "$ROOT/landmarks/$NAME"
CONFIG=${CONFIG:-config/$NAME.json}
PY=${PY:-python3}
OUT=${OUT:-out/pipeline/compare}
PORT=${PORT:-8765}
py() { "$PY" -I "$@"; }

# The pages are served from the repository root, so that their import maps reach node_modules/three.
PAGE="http://localhost:$PORT/landmarks/pipeline/viewer/index.html"
server() {  # start a server on $PORT unless one already serves the viewer
  if ! curl -sf -o /dev/null "$PAGE"; then
    echo "starting http.server on :$PORT in $ROOT"
    python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT" >/dev/null 2>&1 &
    SERVER_PID=$!; trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
    for _ in $(seq 50); do curl -sf -o /dev/null "$PAGE" && break; sleep 0.1; done
  fi
}

stage_data() {
  echo "== data"
  py "$T/data/fetch_lidar.py" --config "$CONFIG"
  py "$T/data/measure.py" --config "$CONFIG"
  py "$T/data/heightmap.py" --config "$CONFIG"
  stage_place
}
stage_place() { echo "== place"; py "$T/data/place.py" --config "$CONFIG"; }
stage_refs() {
  echo "== refs"
  if [[ -f refs/streetview/metadata.json && -z "${REFS_ONLINE:-}" ]]; then
    py "$T/streetview_collect.py" --config "$CONFIG" --offline
  else
    py "$T/streetview_collect.py" --config "$CONFIG" ${ALLOW_FETCH:+--allow-fetch}
  fi
  py "$T/sky_mask.py"
}
stage_refine() { echo "== refine"; server; CONFIG=$CONFIG node "$T/refine_cameras.mjs" --config "$CONFIG"; }
stage_compare() { echo "== compare"; server; CONFIG=$CONFIG node "$T/compare.mjs" --out "$OUT" ${QUERY:+--query "$QUERY"}; }
stage_metrics() {
  echo "== metrics"
  if [[ -f "$OUT/views_used.json" ]]; then py "$T/metrics.py" "$OUT"   # on the last compare's renders
  else server; CONFIG=$CONFIG node "$T/compare.mjs" --out "$OUT" ${QUERY:+--query "$QUERY"}; fi
}

[[ $# -eq 0 ]] && set -- all
for s in "$@"; do
  case $s in
    data|place|refs|refine|compare|metrics) "stage_$s" ;;
    all) stage_data; stage_refs; stage_refine; stage_compare ;;  # compare runs the metrics too
    *) echo "unknown stage $s (data|place|refs|refine|compare|metrics|all)"; exit 2 ;;
  esac
done
