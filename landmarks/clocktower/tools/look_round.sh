#!/bin/bash
# One look round: masks + renders of the wide views, then the luminance table.  tools/look_round.sh rNN [match] [query]
R=$1; M=${2:-_wide}; Q=${3:-}
cd "$(dirname "$0")/.."
node tools/compare.mjs --out out/look/$R-mask --match "$M" --query "mask=1&$Q" --no-metrics > /dev/null 2>&1
node tools/compare.mjs --out out/look/$R --match "$M" --query "$Q" 2>&1 | grep -v "calls,"
"${PY:-python3}" -I tools/look_measure.py out/look/$R out/look/$R-mask "$M"
