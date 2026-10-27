"""Sky / building / ignore masks of the reference photographs, for camera refinement and metrics.
The sky is clear blue (pale near the sun): it is found by colour and smoothness; pale smooth sky only
where it touches clear-blue sky. Trees (green, orange leaves, dark trunks), dark glass and shadow are
'ignore': they are neither model nor sky. Everything else (cream stone, lit or in shade) is 'solid'.
Output: refs/streetview/masks/<view>.png, 0 = sky, 128 = ignore, 255 = solid. Skips masks newer than
their photo unless --force.
Option (config "sky_mask", left out: none): "branches_deg": r. Bare winter branches in front of the sky
make it rough, so most of it fails the smoothness test and counts as solid. With r, the photograph is
also classified a second time after a grey closing of each channel with a disc of r degrees (in pixels:
r x the view's height / its vfov, from views.json), which gives what is darker than its surroundings and
narrower than 2r (branches, twigs, wires; a thin spire too) the colour round it; what that second pass
finds as sky is sky. Without the option the masks are made as before, byte for byte.
Option "pale_tint": t (0-255). Pale and hazy sky are found by being pale, smooth and grey or bluish, so
a white wall that the camera took as white as a hazy sky (a white building in open shade, exposed for
the shade: R = G = B near 250) passes for sky where it touches the top of the view or sky that does.
With t, a pale or hazy pixel is sky only where its blue exceeds its red by t or more: clear and pale
blue sky stay sky; white walls, and the sky's own clipped white, go to solid (9 Eden Crescent: 8).
Without it the masks are made as before, byte for byte.
  python -I ../pipeline/tools/sky_mask.py [--config config/<name>.json] [--force] [--debug out/dir] [file ...]
"""
import argparse, glob, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.getcwd()  # the landmark's folder: every stage runs there
SV = os.path.join(ROOT, "refs", "streetview")
CONFIG = os.environ.get("CONFIG") or os.path.join("config", os.path.basename(ROOT) + ".json")


def classify(rgb, pale_tint=0):
    f = rgb.astype(np.float32); r, g, b = f[..., 0], f[..., 1], f[..., 2]
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    mx, mn = f.max(-1), f.min(-1); sat = (mx - mn) / np.maximum(mx, 1)
    m1 = ndi.uniform_filter(lum, 5); m2 = ndi.uniform_filter(lum * lum, 5); std = np.sqrt(np.maximum(m2 - m1 * m1, 0))
    blue = (b - r > 22) & (b > 120) & (b >= g) & (std < 9)
    pale = (lum > 175) & (b - r > -4) & (sat < 0.25) & (std < 7)
    s9a = ndi.uniform_filter(lum, 9); s9b = ndi.uniform_filter(lum * lum, 9); std9 = np.sqrt(np.maximum(s9b - s9a * s9a, 0))
    haze = (lum > 200) & (sat < 0.12) & (std9 < 2.5)            # white haze / overexposed sky near the sun
    if pale_tint:  # config sky_mask.pale_tint: pale and hazy sky only where blue exceeds red by this much
        tint = b - r >= pale_tint
        pale &= tint; haze &= tint
    pale |= haze
    cand = blue | pale
    lab, n = ndi.label(cand)
    top = np.zeros(n + 1, bool); top[np.unique(lab[:3])] = True; top[0] = False
    hasblue = np.zeros(n + 1, bool); hasblue[np.unique(lab[blue])] = True; hasblue[0] = False
    sky = (top & hasblue)[lab] | (top[lab] & pale & (lab > 0) & (np.arange(lum.shape[0])[:, None] < lum.shape[0] * 0.5))
    sky = ndi.binary_closing(sky, iterations=2) | sky
    # blue that does not reach the top (sky between branches, reflections in glass, cars) is ambiguous
    island = (blue | haze) & ~sky
    veg = ((g > r + 4) & (g > b)) | ((r - b > 60) & (sat > 0.45)) | (lum < 75)
    veg = ndi.binary_dilation(veg, iterations=2)
    out = np.full(lum.shape, 255, np.uint8)
    out[veg | island] = 128; out[sky] = 0
    return out


def close_branches(rgb, r):
    """Grey closing of each channel with a disc of radius r pixels: what is darker than its surroundings and
    narrower than 2r takes the colour round it."""
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    disc = x * x + y * y <= r * r
    return np.stack([ndi.grey_closing(rgb[..., k], footprint=disc) for k in range(3)], -1)


def mask(rgb, branches_px=0, pale_tint=0):
    out = classify(rgb, pale_tint)
    if branches_px > 0:
        out[classify(close_branches(rgb, branches_px), pale_tint) == 0] = 0
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("files", nargs="*"); ap.add_argument("--force", action="store_true"); ap.add_argument("--debug")
    ap.add_argument("--config", default=CONFIG)
    a = ap.parse_args()
    opt = (json.load(open(a.config, encoding="utf-8")) if os.path.exists(a.config) else {}).get("sky_mask", {})
    deg, tint = opt.get("branches_deg", 0), opt.get("pale_tint", 0)
    views ={v["file"]: v for v in json.load(open(os.path.join(SV, "views.json")))} if deg else {}
    files = a.files or sorted(glob.glob(os.path.join(SV, "*_*.jpg")))
    os.makedirs(os.path.join(SV, "masks"), exist_ok=True)
    n = 0
    for f in files:
        o = os.path.join(SV, "masks", os.path.basename(f).replace(".jpg", ".png"))
        if not a.force and os.path.exists(o) and os.path.getmtime(o) > os.path.getmtime(f): continue
        rgb = np.asarray(Image.open(f).convert("RGB"))
        v = views.get(os.path.basename(f))
        m = mask(rgb, round(deg * v["height"] / v["vfov"]) if v else 0, tint); Image.fromarray(m).save(o); n += 1
        if a.debug:
            os.makedirs(a.debug, exist_ok=True)
            vis = rgb.copy(); vis[m == 0] = (vis[m == 0] * 0.3 + np.array([0, 0, 255]) * 0.7).astype(np.uint8); vis[m == 128] = (vis[m == 128] * 0.4 + np.array([255, 0, 255]) * 0.6).astype(np.uint8)
            Image.fromarray(vis).save(os.path.join(a.debug, os.path.basename(f)), quality=80)
    print(f"sky masks: {n} written, {len(files) - n} up to date, in {os.path.relpath(os.path.join(SV, 'masks'), ROOT)}"
          + (f" (branches closed, {deg} deg)" if deg else "") + (f" (pale sky tinted blue by {tint} or more)" if tint else ""))
