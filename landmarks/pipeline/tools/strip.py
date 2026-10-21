# reference | render | overlay strips for tools/compare.mjs: python tools/strip.py ref1 render1 ref2 render2 ...
import sys
from PIL import Image
a = sys.argv[1:]
for ref, ren in zip(a[::2], a[1::2]):
    r = Image.open(ren).convert("RGB"); f = Image.open(ref).convert("RGB").resize(r.size)
    o = Image.blend(f, r, 0.5)
    s = Image.new("RGB", (r.width * 3 + 20, r.height), "white")
    for i, im in enumerate((f, r, o)): s.paste(im, (i * (r.width + 10), 0))
    h = 600; s = s.resize((int(s.width * h / s.height), h))
    s.save(ren.replace(".png", "_strip.jpg"), quality=88)
