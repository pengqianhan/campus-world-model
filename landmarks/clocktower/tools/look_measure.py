# Luminance and colour of the building and the sky, reference vs render, inside the render's own mask.
#   python tools/look_measure.py <render dir> <mask dir> [match]
# Masks come from compare.mjs --query mask=1 (building above 2.3 m white, sky blue). Prints p02/p10/p50/p90/p98
# of luma (0..255, Rec.709 on sRGB values) and the mean sRGB colour, for each view.
import sys, os, json, glob
import numpy as np
from PIL import Image
from scipy import ndimage
rd, md = sys.argv[1], sys.argv[2]; match = sys.argv[3] if len(sys.argv) > 3 else ""
views = json.load(open("refs/streetview/views_refined.json" if os.path.exists("refs/streetview/views_refined.json") else "refs/streetview/views.json"))
def stats(px):
    if len(px) < 50: return None
    l = px @ np.array([0.2126, 0.7152, 0.0722])
    return dict(p=[round(float(v)) for v in np.percentile(l, [2, 10, 50, 90, 98])], rgb=[round(float(v)) for v in px.mean(0)], n=len(px))
rows = {}
for v in views:
    f = v["file"]
    if match not in f: continue
    stem = os.path.splitext(f)[0]
    rp, mp = f"{rd}/{stem}.png", f"{md}/{stem}.png"
    if not (os.path.exists(rp) and os.path.exists(mp)): continue
    ren = np.asarray(Image.open(rp).convert("RGB")).astype(float)
    ref = np.asarray(Image.open(f"refs/streetview/{f}").convert("RGB").resize((ren.shape[1], ren.shape[0]))).astype(float)
    m = np.asarray(Image.open(mp).convert("RGB")).astype(int)
    bld = ndimage.binary_erosion((m[..., 0] > 200) & (m[..., 1] > 200) & (m[..., 2] > 200), iterations=4)
    sky = ndimage.binary_erosion((m[..., 2] > 200) & (m[..., 0] < 60) & (m[..., 1] < 60), iterations=4)
    H = ren.shape[0]; top = np.zeros_like(sky); top[: H // 3] = True
    r = {}
    for name, mm in (("bld", bld), ("sky", sky), ("skyTop", sky & top)):
        r[name] = (stats(ref[mm]), stats(ren[mm]))
    rows[stem] = r
    print(stem)
    for name, (a, b) in r.items():
        if a is None: continue
        print(f"  {name:6s} ref p{a['p']} rgb{a['rgb']}  |  ren p{b['p']} rgb{b['rgb']}  (n={a['n']})")
json.dump(rows, open(f"{rd}/measure.json", "w"), indent=1)
