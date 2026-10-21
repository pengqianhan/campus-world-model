#!/usr/bin/env bash
# Landmark pipeline: data -> refs -> refine -> compare -> metrics. Each stage is idempotent.
#   ./run.sh [data|refs|refine|compare|metrics|all] ...      (default: all)
# Environment:
#   CONFIG=config/clocktower.json   building config
#   PY=python3                      Python with numpy laspy[lazrs] pyproj scipy pillow matplotlib rasterio requests
#   OUT=out/pipeline/compare        compare/metrics output folder
#   REFS_ONLINE=1                   refs: ask Google for panorama ids and metadata again (free calls) instead of
#                                   rebuilding from refs/streetview/metadata.json; tiles still come from the cache
#   QUERY="only=tower"              passed to the page by compare
#   PORT=8765                       where the page is served (each tool reads $PORT too)
#   ALLOW_FETCH=1                   refs: buy the Street View tiles that are not cached (billed; needed once in a fresh clone)
# Street View tiles are bought only with ALLOW_FETCH=1 (see README, "What is billed").
set -euo pipefail
cd "$(dirname "$0")"
CONFIG=${CONFIG:-config/clocktower.json}
PY=${PY:-python3}
OUT=${OUT:-out/pipeline/compare}
PORT=${PORT:-8765}
py() { "$PY" -I "$@"; }

# The page is served from the repository root, so that its import map reaches node_modules/three.
ROOT=$(cd ../.. && pwd)
PAGE="http://localhost:$PORT/${PWD#"$ROOT"/}/index.html"
server() {  # start a server on $PORT unless one already serves this page
  if ! curl -sf -o /dev/null "$PAGE"; then
    echo "starting http.server on :$PORT in $ROOT"
    python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT" >/dev/null 2>&1 &
    SERVER_PID=$!; trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
    for _ in $(seq 50); do curl -sf -o /dev/null "$PAGE" && break; sleep 0.1; done
  fi
}

stage_data() {
  echo "== data"
  py tools/data/fetch_lidar.py --config "$CONFIG"
  py tools/data/measure.py --config "$CONFIG"
  py tools/data/heightmap.py --config "$CONFIG"
}
stage_refs() {
  echo "== refs"
  if [[ -f refs/streetview/metadata.json && -z "${REFS_ONLINE:-}" ]]; then
    py tools/streetview_collect.py --config "$CONFIG" --offline
  else
    py tools/streetview_collect.py --config "$CONFIG" ${ALLOW_FETCH:+--allow-fetch}
  fi
  py tools/sky_mask.py
}
stage_refine() { echo "== refine"; server; node tools/refine_cameras.mjs --config "$CONFIG"; }
stage_compare() { echo "== compare"; server; node tools/compare.mjs --out "$OUT" ${QUERY:+--query "$QUERY"}; }
stage_metrics() {
  echo "== metrics"
  if [[ -f "$OUT/views_used.json" ]]; then py tools/metrics.py "$OUT"   # on the last compare's renders
  else server; node tools/compare.mjs --out "$OUT" ${QUERY:+--query "$QUERY"}; fi
}

[[ $# -eq 0 ]] && set -- all
for s in "$@"; do
  case $s in
    data|refs|refine|compare|metrics) "stage_$s" ;;
    all) stage_data; stage_refs; stage_refine; stage_compare ;;  # compare runs the metrics too
    *) echo "unknown stage $s (data|refs|refine|compare|metrics|all)"; exit 2 ;;
  esac
done
