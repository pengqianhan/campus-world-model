"""Stacks the frames from tools/video.mjs into one video per kind: the photograph on top, the model
in the middle, the two laid half over each other at the bottom.
  python -I tools/video.py out/video [wide tower door] [--across tower,door]   (needs FFMPEG=/path/to/ffmpeg or ffmpeg on PATH)
--across lays the three side by side (photo, model, overlay from left to right) for the kinds named.
Writes out/video/<kind>.mp4. The photographs are Google Street View: for looking at, not for publishing."""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

args = sys.argv[1:]
across = set(args.pop(args.index("--across") + 1).split(",")) if "--across" in args else set()
if "--across" in args: args.remove("--across")
root, kinds = args[0], args[1:] or ["wide", "tower", "door"]
ffmpeg = os.environ.get("FFMPEG", "ffmpeg")
try: font = ImageFont.truetype("DejaVuSans-Bold.ttf", 22)
except OSError: font = ImageFont.load_default()

def label(im, text):
    d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = d.textbbox((12, 10), text, font=font)
    d.rectangle((x0 - 6, y0 - 4, x1 + 6, y1 + 4), fill=(0, 0, 0))
    d.text((12, 10), text, font=font, fill=(255, 255, 255))

for kind in kinds:
    meta = json.load(open(f"{root}/{kind}/frames.json"))
    w, h = meta["width"], meta["height"]
    photos = {}
    def photo(f):
        if f not in photos: photos[f] = Image.open(f"refs/streetview/{f}").convert("RGB").resize((w, h), Image.LANCZOS)
        return photos[f]
    out = f"{root}/{kind}.mp4"
    side = kind in across; W, H = (w * 3, h) if side else (w, h * 3)
    enc = subprocess.Popen([ffmpeg, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                            "-r", str(meta["fps"]), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
                            "-preset", "slow", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for fr in meta["frames"]:
        (f0, a0), *rest = fr["photo"]
        ph = photo(f0) if not rest else Image.blend(photo(f0), photo(rest[0][0]), rest[0][1])
        model = Image.open(fr["model"]).convert("RGB")
        mix = Image.blend(ph, model, 0.5)
        frame = Image.new("RGB", (W, H))
        for i, (im, text) in enumerate([(ph.copy(), "Street View"), (model, "Model (code only)"), (mix, "Overlay 50%")]):
            label(im, text); frame.paste(im, (i * w, 0) if side else (0, i * h))
        enc.stdin.write(frame.tobytes())
    enc.stdin.close(); enc.wait()
    print(f"{out}: {len(meta['frames'])} frames, {W}x{H}")
