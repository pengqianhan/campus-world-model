"""The model seen from above, against the LiDAR (the check of a landmark without references for its
silhouette, and of every landmark's sizes). Reads $OUT/triangles.bin (written by topview.mjs: the model's
triangles in the view frame) and the data stage's points; both are drawn as heightmaps on a 0.5 m grid in
the view frame of the config's frame.expected (as place.py), the LiDAR's from the points of this building
and of those in building.also only (inside their outlines or within frame.near_outline m of them,
default 3; the outlines of building.also from public/data/campus.json).
Writes $OUT/metrics.json, metrics.md and topview.png (LiDAR | model | difference).
  - footprint IoU: cells higher than 2.5 m in the model against those in the LiDAR (gaps between LiDAR
    points closed);
  - height: model minus LiDAR on the cells both cover, and the highest point of each.
  - blocks: for each block of public/data/campus.json whose centre is within 80 m, the share of its
    cells under the model's footprint (what building.also lists: the blocks it covers by half or more).
  python -I ../pipeline/tools/topview.py [--config config/<name>.json] [--out out/topview]
"""
import argparse, json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "data"))
import common
import numpy as np

ap = argparse.ArgumentParser(description=__doc__)
ap.add_argument("--config", default=common.DEFAULT_CONFIG)
ap.add_argument("--out", default="out/topview")
a = ap.parse_args()
cfg = common.load(a.config)
F = cfg["frame"]; G = cfg["ground"]; RES = 0.5; FLOOR = 2.5

# the view frame of frame.expected, as place.py and measure.py turn it
centre, axis = np.array(F["expected"]["centre"]), np.array(F["expected"]["axis"])
to_street = np.array([-axis[1], axis[0]])
if (F.get("street_side", "west") == "west") == (to_street[0] > 0): to_street = -to_street

T = np.fromfile(os.path.join(a.out, "triangles.bin"), np.float32).reshape(-1, 3, 3).astype(float)
P = np.load(common.out(cfg, "pts.npy"))
B = P[(P[:, 3] == 6) & (P[:, 2] > G + FLOOR)]
near = F.get("near_outline", 3)
keep = common.near_outline(cfg, B[:, :2], near)
for ring in common.also_outlines(cfg): keep |= common.near_outline(cfg, B[:, :2], near, ring)
B = B[keep]
d = B[:, :2] - centre
lx, lz, lh = -(d @ axis), d @ to_street, B[:, 2] - G

x0 = np.floor(min(T[..., 0].min(), lx.min()) - 2); x1 = np.ceil(max(T[..., 0].max(), lx.max()) + 2)
z0 = np.floor(min(T[..., 2].min(), lz.min()) - 2); z1 = np.ceil(max(T[..., 2].max(), lz.max()) + 2)
nx, nz = int((x1 - x0) / RES), int((z1 - z0) / RES)

lidar = np.full((nz, nx), -np.inf)
np.maximum.at(lidar, (((lz - z0) / RES).astype(int), ((lx - x0) / RES).astype(int)), lh)

model = np.full((nz, nx), -np.inf)
cx = x0 + (np.arange(nx) + 0.5) * RES; cz = z0 + (np.arange(nz) + 0.5) * RES
for t in T:  # each triangle onto the cell centres under it, keeping the highest
    xs, zs, ys = t[:, 0], t[:, 2], t[:, 1]
    j0, j1 = np.searchsorted(cx, xs.min()), np.searchsorted(cx, xs.max(), "right")
    i0, i1 = np.searchsorted(cz, zs.min()), np.searchsorted(cz, zs.max(), "right")
    if j0 >= j1 or i0 >= i1: continue
    X, Z = np.meshgrid(cx[j0:j1], cz[i0:i1])
    den = (zs[1] - zs[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (zs[0] - zs[2])
    if abs(den) < 1e-12: continue  # a wall: seen edge-on from above
    w0 = ((zs[1] - zs[2]) * (X - xs[2]) + (xs[2] - xs[1]) * (Z - zs[2])) / den
    w1 = ((zs[2] - zs[0]) * (X - xs[2]) + (xs[0] - xs[2]) * (Z - zs[2])) / den
    w2 = 1 - w0 - w1
    inside = (w0 >= -1e-9) & (w1 >= -1e-9) & (w2 >= -1e-9)
    if not inside.any(): continue
    y = w0 * ys[0] + w1 * ys[1] + w2 * ys[2]
    sub = model[i0:i1, j0:j1]
    np.copyto(sub, np.maximum(sub, np.where(inside, y, -np.inf)))

from scipy.ndimage import binary_closing
L = binary_closing(lidar > FLOOR, iterations=1); M = model > FLOOR
both = (lidar > FLOOR) & M
diff = model[both] - lidar[both]
r = {
    "grid_m": RES, "floor_m": FLOOR,
    "footprint": {"iou": round(float((L & M).sum() / max(1, (L | M).sum())), 3),
                  "lidar_m2": round(float(L.sum() * RES * RES)), "model_m2": round(float(M.sum() * RES * RES)),
                  "both_m2": round(float((L & M).sum() * RES * RES))},
    "height": {"cells": int(both.sum()),
               "model_minus_lidar_m": {k: round(float(np.percentile(diff, q)), 2) for k, q in (("p10", 10), ("p50", 50), ("p90", 90))} if both.any() else None,
               "within_0.5m": round(float((np.abs(diff) <= 0.5).mean()), 3) if both.any() else None,
               "highest_m": {"model": round(float(model.max()), 2), "lidar": round(float(lidar.max()), 2),
                             "lidar_p99.9": round(float(np.percentile(lh, 99.9)), 2)}},
}
# the campus map's blocks under the model (for building.also): the share of each block's 0.5 m cells
# that the model's footprint covers, for every block whose centre is within 80 m
from matplotlib.path import Path
to_local, to_map = common.map_to_local(cfg), common.map_projector(cfg)
cm_x, cm_z = to_map(*centre)
campus = json.load(open(os.path.join(common.ROOT, "..", "..", "public", "data", "campus.json"), encoding="utf-8"))
r["blocks"] = []
for bld in campus["buildings"]:
    if np.hypot(bld["center"][0] - cm_x, bld["center"][1] - cm_z) > 80: continue
    ring = bld["outline"][0]
    pts = np.array([to_local(ring[k] / 10, ring[k + 1] / 10) for k in range(0, len(ring), 2)]) - centre
    pts = np.c_[-(pts @ axis), pts @ to_street]
    j = np.arange(int(np.floor((pts[:, 0].min() - x0) / RES)), int(np.ceil((pts[:, 0].max() - x0) / RES)) + 1)
    i = np.arange(int(np.floor((pts[:, 1].min() - z0) / RES)), int(np.ceil((pts[:, 1].max() - z0) / RES)) + 1)
    J, I = np.meshgrid(j, i)
    inside = Path(pts).contains_points(np.c_[(x0 + (J.ravel() + 0.5) * RES), (z0 + (I.ravel() + 0.5) * RES)])
    if not inside.any(): continue
    J, I = J.ravel()[inside], I.ravel()[inside]
    ok = (J >= 0) & (J < nx) & (I >= 0) & (I < nz)
    share = float(M[I[ok], J[ok]].sum()) / len(J)
    if share >= 0.005: r["blocks"].append({"id": bld["id"], "name": bld["name"].get("en", ""), "covered": round(share, 3)})
r["blocks"].sort(key=lambda b: -b["covered"])
json.dump(r, open(os.path.join(a.out, "metrics.json"), "w"), indent=1)
md = ["| top view | value |", "| --- | ---: |",
      f"| footprint IoU (cells above {FLOOR} m) | {r['footprint']['iou']:.3f} |",
      f"| footprint m2 LiDAR / model / both | {r['footprint']['lidar_m2']} / {r['footprint']['model_m2']} / {r['footprint']['both_m2']} |"]
if both.any():
    h = r["height"]
    md += [f"| model - LiDAR height p10 / p50 / p90 (m) | {h['model_minus_lidar_m']['p10']} / {h['model_minus_lidar_m']['p50']} / {h['model_minus_lidar_m']['p90']} |",
           f"| cells within 0.5 m | {h['within_0.5m'] * 100:.0f}% of {h['cells']} |",
           f"| highest point model / LiDAR (p99.9) (m) | {h['highest_m']['model']} / {h['highest_m']['lidar_p99.9']} |"]
md += [f"| block {b['id']} ({b['name']}) under the model | {b['covered'] * 100:.1f}% |" for b in r["blocks"]]
open(os.path.join(a.out, "metrics.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")
print("\n".join(md))

# picture: LiDAR | model | difference (z toward the street at the top)
from PIL import Image
import matplotlib; matplotlib.use("Agg"); import matplotlib.cm as cm
top = max(lidar.max(), model.max(), 1)
def hm(a):
    img = (cm.turbo(np.clip(a / top, 0, 1))[:, :, :3] * 255).astype(np.uint8); img[~(a > FLOOR)] = 24
    return img[::-1]
dd = np.zeros_like(model); dd[both] = diff
dimg = (cm.RdBu_r(np.clip(dd / 3 * 0.5 + 0.5, 0, 1))[:, :, :3] * 255).astype(np.uint8)
dimg[~(L | M)] = 24; dimg[L & ~M] = (255, 170, 0); dimg[M & ~L] = (160, 0, 200)
sep = np.full((nz, 4, 3), 255, np.uint8)
Image.fromarray(np.hstack([hm(lidar), sep, hm(model), sep, dimg[::-1]])).resize((nx * 6 + 16, nz * 2), Image.NEAREST).save(os.path.join(a.out, "topview.png"))
print(f"topview: wrote {os.path.join(a.out, 'metrics.md')}, topview.png (LiDAR | model | model minus LiDAR: blue lower, red higher, orange LiDAR only, purple model only)")
