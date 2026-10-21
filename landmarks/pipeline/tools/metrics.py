"""Metrics stage: per view, how well the render matches the reference photograph.
  python -I tools/metrics.py <compare out dir>
Reads <dir>/views_used.json (written by tools/compare.mjs: per view the reference, the render and the
model's label image from tools/mask.html) and the sky masks (refs/streetview/masks, made by
tools/sky_mask.py; computed on the fly for a reference without one). Writes <dir>/metrics.json and
<dir>/metrics.md:
  iou          silhouette overlap above the cut height (model building vs photo solid; pixels the
               photo marks as trees/cars/people/dark glass and model pixels below the cut are left out)
  lum_ref/lum_render   luma percentiles p02 p10 p50 p90 p98 (Rec.709 on sRGB, 0..255) and
  rgb_ref/rgb_render   mean sRGB colour, both inside the building region = model building (any height)
               AND photo solid, i.e. where both show the building's stone and glass.
"""
import json, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sky_mask import classify

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1]
used = json.load(open(os.path.join(out, "views_used.json")))
W709 = np.array([0.2126, 0.7152, 0.0722])
rows = []
for u in used:
    lab = np.asarray(Image.open(u["label"]).convert("RGB")); H, W = lab.shape[:2]
    ref = Image.open(u["ref"]).convert("RGB").resize((W, H), Image.BILINEAR)
    mpath = os.path.join(ROOT, "refs", "streetview", "masks", os.path.basename(u["ref"]).rsplit(".", 1)[0] + ".png")
    mk = np.asarray(Image.open(mpath).resize((W, H), Image.NEAREST)) if os.path.exists(mpath) else classify(np.asarray(ref))
    ref = np.asarray(ref, np.float32); ren = np.asarray(Image.open(u["render"]).convert("RGB").resize((W, H), Image.BILINEAR), np.float32)
    R, G = lab[..., 0] > 127, lab[..., 1] > 127
    valid = ~G & ((mk < 64) | (mk >= 192))
    a, b = R & ~G & valid, (mk >= 192) & valid
    union = int((a | b).sum()); iou = float((a & b).sum() / union) if union else None
    region = R & (mk >= 192)
    def stats(img):
        px = img[region]
        if len(px) < 50: return None, None
        l = px @ W709
        return [round(float(v), 1) for v in np.percentile(l, [2, 10, 50, 90, 98])], [round(float(v), 1) for v in px.mean(0)]
    lr, cr = stats(ref); ln, cn = stats(ren)
    rows.append({"view": u["file"], "iou": None if iou is None else round(iou, 4), "region_px": int(region.sum()),
                 "lum_ref": lr, "lum_render": ln, "rgb_ref": cr, "rgb_render": cn, "camera": u.get("camera", "views.json")})
ious = [r["iou"] for r in rows if r["iou"] is not None]
summary = {"views": len(rows), "iou_mean": round(float(np.mean(ious)), 4) if ious else None}
for k in ("lum_ref", "lum_render", "rgb_ref", "rgb_render"):
    v = [r[k] for r in rows if r[k]]
    summary[k + "_mean"] = [round(float(x), 1) for x in np.mean(v, 0)] if v else None
json.dump({"summary": summary, "views": rows}, open(os.path.join(out, "metrics.json"), "w"), indent=1)
f = lambda v: "–" if v is None else " ".join(f"{x:.0f}" for x in v)
g = lambda x: "–" if x is None else f"{x:.3f}"
md = ["| view | camera | IoU | luma p02 p10 p50 p90 p98 ref | render | mean RGB ref | render |", "| --- | --- | ---: | --- | --- | --- | --- |"]
for r in rows:
    md.append(f"| {r['view']} | {r['camera']} | {g(r['iou'])} | {f(r['lum_ref'])} | {f(r['lum_render'])} | {f(r['rgb_ref'])} | {f(r['rgb_render'])} |")
md.append(f"| **mean** | | {g(summary['iou_mean'])} | {f(summary['lum_ref_mean'])} | {f(summary['lum_render_mean'])} | {f(summary['rgb_ref_mean'])} | {f(summary['rgb_render_mean'])} |")
open(os.path.join(out, "metrics.md"), "w").write("\n".join(md) + "\n")
print("\n".join(md))
