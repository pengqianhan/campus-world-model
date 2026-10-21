# Outline overlays for tools/refine_cameras.mjs: python tools/outline.py photo before.png after.png ...
# Draws the model's silhouette edge before (red) and after (green) the refinement on the photograph,
# with the photo's sky mask edge in blue; writes <after>_outline.jpg next to the label images.
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
a = sys.argv[1:]
for ref, b, c in zip(a[::3], a[1::3], a[2::3]):
    im = np.asarray(Image.open(b).convert("RGB")); W, H = im.shape[1], im.shape[0]
    photo = np.asarray(Image.open(ref).convert("RGB").resize((W, H))).copy()
    mk = os.path.join(os.path.dirname(ref), "masks", os.path.basename(ref).replace(".jpg", ".png"))
    edge = lambda m: m & ~ndi.binary_erosion(m, iterations=2)
    if os.path.exists(mk):
        sky = np.asarray(Image.open(mk).resize((W, H), Image.NEAREST)) == 0
        photo[edge(sky)] = (60, 120, 255)
    for f, col in ((b, (255, 40, 40)), (c, (40, 255, 40))):
        l = np.asarray(Image.open(f).convert("RGB")); m = (l[..., 0] > 127) | (l[..., 1] > 127)
        photo[edge(m)] = col
    Image.fromarray(photo).save(c.replace("_after.png", "_outline.jpg"), quality=85)
print(f"outlines: {len(a) // 3} written")
