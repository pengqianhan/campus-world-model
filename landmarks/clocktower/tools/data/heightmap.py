"""Data stage 3: the LiDAR heightmap next to the LINZ aerial photo, north up, with the campus.json
outline drawn on both (it shows the outline's offset). The aerial crop is read from LINZ's public
bucket once (cloud-optimised GeoTIFF, only the needed blocks) and cached as data/<name>_aerial.tif.
Outputs: data/<name>_aerial.tif, data/<name>_heightmap_vs_aerial.jpg
  python -I tools/data/heightmap.py [--config config/clocktower.json] [--force]
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common
a = common.args(__doc__, lambda p: p.add_argument("--force", action="store_true"))
cfg = common.load(a.config)
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import maximum_filter
import matplotlib; matplotlib.use("Agg"); import matplotlib.cm as cm

jpg, tif = common.out(cfg, "heightmap_vs_aerial.jpg"), common.out(cfg, "aerial.tif")
if not a.force and os.path.exists(jpg):
    print("heightmap: output present, skipping (--force to redraw)"); sys.exit(0)
P = np.load(common.out(cfg, "pts.npy")); r = json.load(open(common.out(cfg, "ring.json"))); ring = np.array(r["ring"])
x0, x1, y0, y1 = ring[:, 0].min() - 20, ring[:, 0].max() + 20, ring[:, 1].min() - 20, ring[:, 1].max() + 20
res = 0.25; W, H = int((x1 - x0) / res), int((y1 - y0) / res); G = cfg["ground"]
hm = np.full((H, W), np.nan)
m = np.isin(P[:, 3], (1, 2, 6))
c = ((P[m, 0] - x0) / res).astype(int); rr = ((y1 - P[m, 1]) / res).astype(int)
ok = (c >= 0) & (c < W) & (rr >= 0) & (rr < H)
np.fmax.at(hm, (rr[ok], c[ok]), P[m][ok, 2] - G)
hf = np.where(np.isnan(hm), -99, hm); hf = np.where(hf == -99, maximum_filter(hf, 5), hf)
img = (cm.turbo(np.clip(hf / 42, 0, 1))[:, :, :3] * 255).astype(np.uint8); img[hf < -50] = 0
im = Image.fromarray(img).resize((W * 2, H * 2), Image.NEAREST); dr = ImageDraw.Draw(im)
pts = [((px - x0) / res * 2, (py * -1 + y1) / res * 2) for px, py in ring]
dr.line(pts + [pts[0]], fill=(255, 255, 255), width=3)

E0, N0 = r["E0"], r["N0"]
if not os.path.exists(tif):
    os.environ.setdefault("GDAL_DISABLE_READDIR_ON_OPEN", "EMPTY_DIR")
    import rasterio
    from rasterio.merge import merge
    srcs = ["/vsicurl/" + cfg["aerial"]["url"].format(tile=t) for t in cfg["aerial"]["tiles"]]
    arr, tr = merge([rasterio.open(s) for s in srcs], bounds=(E0 + x0, N0 + y0, E0 + x1, N0 + y1), res=res / 2, indexes=[1, 2, 3])
    with rasterio.open(tif, "w", driver="GTiff", width=arr.shape[2], height=arr.shape[1], count=3, dtype=arr.dtype, crs="EPSG:2193", transform=tr, compress="deflate") as f:
        f.write(arr)
    print(f"heightmap: aerial crop cached in {os.path.relpath(tif, common.ROOT)}")
import rasterio
with rasterio.open(tif) as f: arr = f.read()
ae = Image.fromarray(np.moveaxis(arr, 0, -1)).resize(im.size); da = ImageDraw.Draw(ae); da.line(pts + [pts[0]], fill=(255, 0, 255), width=3)
o = Image.new("RGB", (im.width * 2 + 20, im.height), (255, 255, 255)); o.paste(im, (0, 0)); o.paste(ae, (im.width + 20, 0))
o.save(jpg, quality=88)
print(f"heightmap: wrote {os.path.relpath(jpg, common.ROOT)} {o.size}; north up; colour = height above {G} m, 0 (blue) to 42 m (red); outline = campus.json")
