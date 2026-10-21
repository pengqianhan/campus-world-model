"""Data stage 2: crop the LiDAR round the building and measure its frame.
Outputs in data/ (prefix = config name):
  <name>_pts.npy         x, y, z, class (local NZTM metres east/north of the origin; z NZVD2016; class 6 building, 2 ground)
  <name>_ring.json       E0, N0 (NZTM of the origin), the crop box, and the campus.json outline (display only)
  <name>_frame.json      centre, axis (along the facade = -x of the view frame), toStreet (= +z), ground
  <name>_plan_frame.png  plan heightmap in the building frame (street side up)
  <name>_front_elevation.png  front elevation, colour = distance toward the street
The frame comes from the LiDAR points, not from the campus.json outline (which is offset by metres).
  python -I tools/data/measure.py [--config config/clocktower.json] [--force]
"""
import glob, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common
a = common.args(__doc__, lambda p: p.add_argument("--force", action="store_true", help="recompute even if the outputs exist"))
cfg = common.load(a.config)
import numpy as np

outputs = [common.out(cfg, s) for s in ("pts.npy", "ring.json", "frame.json", "plan_frame.png", "front_elevation.png")]
if not a.force and all(os.path.exists(f) for f in outputs):
    print("measure: outputs present, skipping (--force to recompute)"); sys.exit(0)

# 1. crop the tiles to the outline's box plus a margin (local metres)
import laspy
E0, N0 = common.origin_nztm(cfg)
ring = np.array(cfg["building"]["outline"], float); M = cfg["crop_margin"]
box = [ring[:, 0].min() - M, ring[:, 0].max() + M, ring[:, 1].min() - M, ring[:, 1].max() + M]
tiles = [os.path.join(cfg["_data"], "lidar", os.path.basename(cfg["lidar"]["url"].format(tile=t))) for t in cfg["lidar"]["tiles"]]
missing = [t for t in tiles if not os.path.exists(t)]
if missing: sys.exit(f"measure: missing LiDAR tiles {missing}; run tools/data/fetch_lidar.py first")
parts = []
for f in tiles:
    las = laspy.read(f); x = np.asarray(las.x) - E0; y = np.asarray(las.y) - N0
    m = (x > box[0]) & (x < box[1]) & (y > box[2]) & (y < box[3])
    parts.append(np.c_[x[m], y[m], np.asarray(las.z)[m], np.asarray(las.classification)[m]])
P = np.vstack(parts)
G = cfg["ground"]
gnd = P[P[:, 3] == 2]
print(f"measure: {len(P)} points in the crop box, {np.sum(P[:, 3] == 6)} building, {len(gnd)} ground")
print("  ground z p5/p50/p95 %.2f %.2f %.2f (config ground %.2f)" % (*np.percentile(gnd[:, 2], [5, 50, 95]), G))
np.save(outputs[0], P)
json.dump({"ring": ring.tolist(), "E0": E0, "N0": N0, "box": box}, open(outputs[1], "w"))

# 2. the frame, from the building's points
F = cfg["frame"]
B = P[(P[:, 3] == 6) & (P[:, 2] > G + F["min_above"])]
c = B[B[:, 2] > G + F["tower_above"], :2].mean(0)
S = B[(B[:, 2] < G + F["spine_below"]) & (np.linalg.norm(B[:, :2] - c, axis=1) < F["spine_radius"])]
w, v = np.linalg.eigh(np.cov((S[:, :2] - c).T)); ax = v[:, np.argmax(w)]
if ax[1] < 0: ax = -ax
nrm = np.array([-ax[1], ax[0]])
if (F.get("street_side", "west") == "west") == (nrm[0] > 0): nrm = -nrm
print("  tower centre local (%.2f, %.2f); facade axis bearing %.2f deg; front faces bearing %.2f deg"
      % (c[0], c[1], np.degrees(np.arctan2(ax[0], ax[1])), np.degrees(np.arctan2(nrm[0], nrm[1])) % 360))
exp = F.get("expected")
if exp:
    dc = np.linalg.norm(c - exp["centre"]); da = np.degrees(np.arccos(min(1, abs(float(ax @ exp["axis"])))))
    print(f"  vs expected frame: centre off by {dc:.3f} m, axis by {da:.3f} deg" + ("" if dc < exp["tolerance_m"] else "  <-- WARNING: frame moved; the model and the cameras use the expected one"))
json.dump({"centre": c.tolist(), "axis": ax.tolist(), "toStreet": nrm.tolist(), "ground": G}, open(outputs[2], "w"))

# 3. figures (as the one-off ct_frame.py drew them)
from PIL import Image, ImageDraw
import matplotlib; matplotlib.use("Agg"); import matplotlib.cm as cm
u = (B[:, :2] - c) @ ax; s = (B[:, :2] - c) @ nrm; z = B[:, 2] - G
res = 0.25; R = 35; n = int(2 * R / res)
hm = np.full((n, n), -1.0)
i = ((R - s) / res).astype(int); j = ((u + R) / res).astype(int); ok = (i >= 0) & (i < n) & (j >= 0) & (j < n)
np.maximum.at(hm, (i[ok], j[ok]), z[ok])
img = (cm.turbo(np.clip(hm / 42, 0, 1))[:, :, :3] * 255).astype(np.uint8); img[hm < 0] = 20
im = Image.fromarray(img).resize((n * 2, n * 2), Image.NEAREST); d = ImageDraw.Draw(im)
for m in range(-30, 31, 5):
    p = (m + R) / res * 2; d.line([(p, 0), (p, 8)], fill="white"); d.text((p + 2, 10), str(m), fill="white")
    q = (R - m) / res * 2; d.line([(0, q), (8, q)], fill="white"); d.text((10, q + 2), str(m), fill="white")
d.text((n, 4), "street side is UP; u (along facade) to the right; ticks in m from tower centre", fill="white")
im.save(outputs[3])
res2 = 0.2; ne = int(2 * R / res2); el = np.full((int(45 / res2), ne), 0, np.uint8)
jj = ((u + R) / res2).astype(int); ii = ((45 - z) / res2).astype(int); val = np.clip((s + 30) / 60 * 255, 0, 255).astype(np.uint8)
ok = (jj >= 0) & (jj < ne) & (ii >= 0) & (ii < el.shape[0])
order = np.argsort(s, kind="stable"); order = order[ok[order]]  # far first, near overwrite
el[ii[order], jj[order]] = val[order]
ei = (cm.viridis(el / 255)[:, :, :3] * 255).astype(np.uint8); ei[el == 0] = 255
e = Image.fromarray(ei).resize((ne * 2, el.shape[0] * 2), Image.NEAREST); de = ImageDraw.Draw(e)
for h in range(0, 45, 5):
    y = (45 - h) / res2 * 2; de.line([(0, y), (ne * 2, y)], fill=(200, 200, 200)); de.text((2, y - 12), f"{h} m", fill="black")
for m in range(-30, 31, 5):
    x = (m + R) / res2 * 2; de.line([(x, el.shape[0] * 2 - 10), (x, el.shape[0] * 2)], fill="black"); de.text((x + 2, el.shape[0] * 2 - 22), str(m), fill="black")
e.save(outputs[4])
for name, (a0, b0, s0) in {"left pavilion": (-22, -8, 8), "centre bay": (-4, 4, 8), "right pavilion": (8, 22, 8), "tower": (-4, 4, -10)}.items():
    m = (u > a0) & (u < b0) & (s > s0 - 30)
    print(f"  {name:15s} height p50 {np.percentile(z[m], 50):5.1f}  p95 {np.percentile(z[m], 95):5.1f}  max {z[m].max():5.1f} m")
print("measure: wrote " + ", ".join(os.path.relpath(f, common.ROOT) for f in outputs))
