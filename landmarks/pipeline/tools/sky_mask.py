"""Sky / building / ignore masks of the reference photographs, for camera refinement and metrics.
The sky is clear blue (pale near the sun): it is found by colour and smoothness; pale smooth sky only
where it touches clear-blue sky. Trees (green, orange leaves, dark trunks), dark glass and shadow are
'ignore': they are neither model nor sky. Everything else (cream stone, lit or in shade) is 'solid'.
Output: refs/streetview/masks/<view>.png, 0 = sky, 128 = ignore, 255 = solid. Skips masks newer than
their photo unless --force.
  python -I tools/sky_mask.py [--force] [--debug out/dir] [file ...]
"""
import argparse, glob, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SV = os.path.join(ROOT, "refs", "streetview")


def classify(rgb):
    f = rgb.astype(np.float32); r, g, b = f[..., 0], f[..., 1], f[..., 2]
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    mx, mn = f.max(-1), f.min(-1); sat = (mx - mn) / np.maximum(mx, 1)
    m1 = ndi.uniform_filter(lum, 5); m2 = ndi.uniform_filter(lum * lum, 5); std = np.sqrt(np.maximum(m2 - m1 * m1, 0))
    blue = (b - r > 22) & (b > 120) & (b >= g) & (std < 9)
    pale = (lum > 175) & (b - r > -4) & (sat < 0.25) & (std < 7)
    s9a = ndi.uniform_filter(lum, 9); s9b = ndi.uniform_filter(lum * lum, 9); std9 = np.sqrt(np.maximum(s9b - s9a * s9a, 0))
    haze = (lum > 200) & (sat < 0.12) & (std9 < 2.5)            # white haze / overexposed sky near the sun
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


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("files", nargs="*"); ap.add_argument("--force", action="store_true"); ap.add_argument("--debug")
    a = ap.parse_args()
    files = a.files or sorted(glob.glob(os.path.join(SV, "*_*.jpg")))
    os.makedirs(os.path.join(SV, "masks"), exist_ok=True)
    n = 0
    for f in files:
        o = os.path.join(SV, "masks", os.path.basename(f).replace(".jpg", ".png"))
        if not a.force and os.path.exists(o) and os.path.getmtime(o) > os.path.getmtime(f): continue
        rgb = np.asarray(Image.open(f).convert("RGB")); m = classify(rgb); Image.fromarray(m).save(o); n += 1
        if a.debug:
            os.makedirs(a.debug, exist_ok=True)
            vis = rgb.copy(); vis[m == 0] = (vis[m == 0] * 0.3 + np.array([0, 0, 255]) * 0.7).astype(np.uint8); vis[m == 128] = (vis[m == 128] * 0.4 + np.array([255, 0, 255]) * 0.6).astype(np.uint8)
            Image.fromarray(vis).save(os.path.join(a.debug, os.path.basename(f)), quality=80)
    print(f"sky masks: {n} written, {len(files) - n} up to date, in {os.path.relpath(os.path.join(SV, 'masks'), ROOT)}")
