"""Data stage 1: the LINZ 2024 LiDAR tiles (public, no login) into data/lidar/.
A tile already in data/lidar/ is skipped; one found in a mirror directory (config lidar.mirrors) is
symlinked; otherwise it is fetched from OpenTopography's public bucket through scripts/lib/snapshot.ts
(fetch_bridge.py: cached once in data/raw/landmarks/, logged in data/sources.json) and linked here.
  python -I ../pipeline/tools/data/fetch_lidar.py [--config config/<name>.json]
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common, fetch_bridge

cfg = common.load(common.args(__doc__).config)
L = cfg["lidar"]; dst = os.path.join(cfg["_data"], "lidar"); os.makedirs(dst, exist_ok=True)
got = {"present": 0, "linked": 0, "from the snapshots": 0}
need = []
for t in L["tiles"]:
    url = L["url"].format(tile=t); fn = os.path.join(dst, os.path.basename(url))
    if os.path.exists(fn):
        got["present"] += 1; continue
    src = next((os.path.join(m, os.path.basename(url)) for m in L.get("mirrors", []) if os.path.exists(os.path.join(m, os.path.basename(url)))), None)
    if src:
        os.symlink(src, fn); got["linked"] += 1; print(f"  {os.path.basename(fn)}: linked to {src}"); continue
    need.append((url, fn))
for (url, fn), src in zip(need, fetch_bridge.files([u for u, _ in need])):
    fetch_bridge.link(src, fn); got["from the snapshots"] += 1
print(f"lidar: {len(L['tiles'])} tiles in {dst} ({', '.join(f'{v} {k}' for k, v in got.items())})")
