"""Data stage 1: the LINZ 2024 LiDAR tiles (public, no login) into data/lidar/.
A tile already in data/lidar/ is skipped; one found in a mirror directory (config lidar.mirrors) is
symlinked; otherwise it is downloaded from OpenTopography's public bucket.
  python -I tools/data/fetch_lidar.py [--config config/clocktower.json]
"""
import os, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common

cfg = common.load(common.args(__doc__).config)
L = cfg["lidar"]; dst = os.path.join(cfg["_data"], "lidar"); os.makedirs(dst, exist_ok=True)
got = {"present": 0, "linked": 0, "downloaded": 0}
for t in L["tiles"]:
    url = L["url"].format(tile=t); fn = os.path.join(dst, os.path.basename(url))
    if os.path.exists(fn):
        got["present"] += 1; continue
    src = next((os.path.join(m, os.path.basename(url)) for m in L.get("mirrors", []) if os.path.exists(os.path.join(m, os.path.basename(url)))), None)
    if src:
        os.symlink(src, fn); got["linked"] += 1; print(f"  {os.path.basename(fn)}: linked to {src}"); continue
    print(f"  {os.path.basename(fn)}: downloading {url}", flush=True)
    urllib.request.urlretrieve(url, fn + ".part"); os.replace(fn + ".part", fn); got["downloaded"] += 1
print(f"lidar: {len(L['tiles'])} tiles in {dst} ({got['present']} present, {got['linked']} linked, {got['downloaded']} downloaded)")
