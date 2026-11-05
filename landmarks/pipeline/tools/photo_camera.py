"""A photograph's camera, from points picked on it whose positions the LiDAR gives.
For a reference photograph that is not a Street View panorama: one whose camera nobody recorded. Picks
on the photograph, kept beside it in refs/photos/<photo>.points.json (gitignored, as the photograph is),
pair its pixels with places the LiDAR measures:
  {"points":    [{"px": [u, v], "at": [x, y, z], "what": "..."}],
   "lines":     [{"px": [[u, v], ...], "from": [x, y, z], "to": [x, y, z], "what": "..."}],
   "verticals": [{"px": [[u, v], [u, v]], "what": "..."}],
   "solve_centre": false,
   "start":     {"at": [x, y], "height_m": 1.6, "height_sd_m": 0.3, "yaw": deg, "pitch": deg, "hfov": deg}}
x, y are metres east and north in the frame of data/<name>_pts.npy (NZTM less the ring's E0, N0) and z the
LiDAR's elevation. u, v are the file's pixels as stored: an EXIF orientation is not applied (one
photograph's tag turned it 90 degrees off its upright pixels), and the tool says when a file has one.
A point is a corner seen on the photograph. A line is an edge (a roof edge, a corner)
of which only some pixels are sure: each must fall on the edge's image. A vertical is the two ends of
anything upright on the photograph (a post, a column, a wall's corner), wherever it stands: it must point
at the camera's vertical vanishing point, which fixes pitch and roll. Solves the camera's position, yaw,
pitch, roll and focal length by least squares from "start"; with "solve_centre" the principal point too
(a photograph whose verticals were straightened, or which was cut off centre: its principal point is not
its centre). With "height_sd_m" the camera's height above the LiDAR ground where it stands is held near
"height_m" (a hand-held photograph), one standard deviation weighing as 3 pixels.
Writes refs/photos/views.json (photographs named on the command line replace their own views and keep the
others'), one view per photograph in the form of refs/streetview/views.json (the
model's view frame: position, target, vfov, width, height), with a "photo_fit" record: the pixel error
of every pick and the camera's height above the LiDAR ground. And refs/photos/<photo>_level.jpg: the
photograph as the viewer's camera sees it, which does not roll and looks through its centre (turned back
by the roll and moved so that the principal point is at its centre, made as large as holds the whole
photograph; black outside it), and refs/photos/<photo>_level_inside.png, white where the photograph lies in
that cut (tools/sky_mask.py reads it). The check image out/photo_camera/<photo>.png shows every pick (green)
against where the camera puts it (red) over the photograph, with the LiDAR's building points (orange).
  python -I ../pipeline/tools/photo_camera.py [--config config/<name>.json] [photo ...]
"""
import argparse, glob, json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.optimize import least_squares

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "data"))
import common

ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
ap.add_argument("--config", default=common.DEFAULT_CONFIG)
ap.add_argument("photos", nargs="*", help="photographs in refs/photos (default: every one with a .points.json)")
a = ap.parse_args()
cfg = common.load(a.config)
fr = common.load_frame(cfg)
centre, axis, to_street, G = fr["centre"], fr["axis"], fr["toStreet"], fr["ground"]
REFS = os.path.join(common.ROOT, "refs", "photos")
OUT = os.path.join(common.ROOT, "out", "photo_camera"); os.makedirs(OUT, exist_ok=True)
pts = np.load(common.out(cfg, "pts.npy"))
ground = pts[pts[:, 3] == 2]
UP = np.array([0.0, 0.0, 1.0])


def basis(yaw, pitch, roll):
    """Forward, right and up of a camera looking at compass `yaw`, `pitch` up, turned `roll` clockwise
    (as tools/streetview_collect.py's perspective: right, up = cr right - sr up, sr right + cr up)."""
    cy, sy, cp, sp = math.cos(math.radians(yaw)), math.sin(math.radians(yaw)), math.cos(math.radians(pitch)), math.sin(math.radians(pitch))
    fwd = np.array([sy * cp, cy * cp, sp]); right = np.array([cy, -sy, 0.0]); up = np.cross(right, fwd)
    cr, sr = math.cos(math.radians(roll)), math.sin(math.radians(roll))
    return fwd, cr * right - sr * up, sr * right + cr * up


def unpack(p, W, H):
    """Camera parameters p = [x, y, z, yaw, pitch, roll, log f, (cx, cy)] -> position, basis, f, cx, cy."""
    fwd, right, up = basis(p[3], p[4], p[5])
    cx, cy = (p[7], p[8]) if len(p) > 7 else (W / 2, H / 2)
    return np.asarray(p[:3]), fwd, right, up, math.exp(p[6]), cx, cy


def project(p, P, W, H):
    C, fwd, right, up, f, cx, cy = unpack(p, W, H)
    d = np.atleast_2d(P) - C
    z = d @ fwd
    return np.c_[cx + f * (d @ right) / z, cy - f * (d @ up) / z], z


def to_view(P):
    """Local NZTM metres and elevation -> the model's view frame (x, y above the frame's ground, z)."""
    d = P[..., :2] - centre
    return np.stack([-(d @ axis), P[..., 2] - G, d @ to_street], -1)


def ground_at(x, y):
    d = np.hypot(ground[:, 0] - x, ground[:, 1] - y)
    for r in (2, 4, 8):
        if (d < r).any(): return float(np.median(ground[d < r, 2]))
    return None


photos = a.photos or sorted(os.path.basename(f)[:-len(".points.json")] for f in glob.glob(os.path.join(REFS, "*.points.json")))
if not photos: sys.exit(f"no picks: put <photo>.points.json beside the photographs in {REFS}")
views = []
for name in photos:
    picks = json.load(open(os.path.join(REFS, f"{name}.points.json"), encoding="utf-8"))
    img = Image.open(os.path.join(REFS, name))
    if img.getexif().get(0x0112, 1) != 1:  # picks are the file's own pixels: a viewer that turns it by its tag shows others
        print(f"{name}: its EXIF orientation is {img.getexif()[0x0112]}, not applied: pick its pixels as stored, unturned")
    img = img.convert("RGB"); W, H = img.size
    s = picks["start"]
    g0 = ground_at(*s["at"])
    p0 = [s["at"][0], s["at"][1], (g0 if g0 is not None else G) + s.get("height_m", 1.6), s["yaw"], s["pitch"], s.get("roll", 0.0),
          math.log((W / 2) / math.tan(math.radians(s["hfov"]) / 2))] + ([W / 2, H / 2] if picks.get("solve_centre") else [])
    P_pt = np.array([q["at"] for q in picks.get("points", [])], float).reshape(-1, 3)
    U_pt = np.array([q["px"] for q in picks.get("points", [])], float).reshape(-1, 2)
    lines, verticals = picks.get("lines", []), picks.get("verticals", [])

    def residuals(p):
        r = []
        if len(P_pt): r.append((project(p, P_pt, W, H)[0] - U_pt).ravel())
        for L in lines:
            (a2, b2), _ = project(p, np.array([L["from"], L["to"]], float), W, H)
            n = np.array([-(b2[1] - a2[1]), b2[0] - a2[0]]); n /= np.linalg.norm(n) + 1e-12
            r.append((np.array(L["px"], float) - a2) @ n)  # each pixel's distance from the edge's image
        if verticals:
            _, fwd, right, up, f, cx, cy = unpack(p, W, H)
            vp = np.array([f * (right @ UP) + cx * (fwd @ UP), -f * (up @ UP) + cy * (fwd @ UP), fwd @ UP])  # homogeneous
            for V in verticals:
                e = np.c_[np.array(V["px"], float), np.ones(2)]
                l = np.cross(e.mean(0), vp)  # the line from the segment's middle to the vanishing point
                r.append(e @ l / (math.hypot(l[0], l[1]) + 1e-12))
        if "height_sd_m" in s:
            g = ground_at(p[0], p[1])
            r.append([3.0 * (p[2] - (g if g is not None else G) - s.get("height_m", 1.6)) / s["height_sd_m"]])
        return np.concatenate(r)

    fit = least_squares(residuals, p0, loss="soft_l1", f_scale=3.0, x_scale=[1, 1, 1, 1, 1, 1, 0.05] + ([10, 10] if len(p0) > 7 else []))
    p = fit.x
    res = residuals(p)
    C, fwd, right, up, f, cx, cy = unpack(p, W, H)
    gc = ground_at(p[0], p[1])
    rms = float(np.sqrt(np.mean(res ** 2)))
    # the level cut: what a camera at the same place, looking the same way through its centre, without roll, sees;
    # as large as holds the whole photograph
    f0, r0, u0 = basis(p[3], p[4], 0.0)
    corners = np.array([[0, 0], [W, 0], [0, H], [W, H]], float)
    rays = f * fwd[None] + (corners[:, :1] - cx) * right[None] - (corners[:, 1:] - cy) * up[None]
    lu, lv = f * (rays @ r0) / (rays @ f0), -f * (rays @ u0) / (rays @ f0)
    W2 = int(2 * math.ceil(min(np.abs(lu).max(), W))); H2 = int(2 * math.ceil(min(np.abs(lv).max(), H)))
    us, vs = np.meshgrid(np.arange(W2) + 0.5 - W2 / 2, H2 / 2 - (np.arange(H2) + 0.5))
    d = f * f0[None, None] + us[..., None] * r0[None, None] + vs[..., None] * u0[None, None]
    pu = cx + f * (d @ right) / (d @ fwd) - 0.5; pv = cy - f * (d @ up) / (d @ fwd) - 0.5
    src = np.asarray(img, float)
    x0 = np.floor(pu).astype(int); y0 = np.floor(pv).astype(int); fx = (pu - x0)[..., None]; fy = (pv - y0)[..., None]
    ok = (x0 >= 0) & (x0 < W - 1) & (y0 >= 0) & (y0 < H - 1)
    x0c, y0c = x0.clip(0, W - 2), y0.clip(0, H - 2)
    lev = (src[y0c, x0c] * (1 - fx) * (1 - fy) + src[y0c, x0c + 1] * fx * (1 - fy) + src[y0c + 1, x0c] * (1 - fx) * fy + src[y0c + 1, x0c + 1] * fx * fy)
    lev[~ok] = 0
    level = f"{os.path.splitext(name)[0]}_level.jpg"
    Image.fromarray(lev.astype(np.uint8)).save(os.path.join(REFS, level), quality=92)
    # where the photograph lies in the cut, for tools/sky_mask.py (its top is the photograph's, not the cut's)
    Image.fromarray(ok.astype(np.uint8) * 255).save(os.path.join(REFS, f"{os.path.splitext(level)[0]}_inside.png"))
    Cv = to_view(C); dist = float(np.hypot(Cv[0], Cv[2]))
    Tv = to_view(C + f0 * dist)
    picks_out, k = [], 0
    for q in picks.get("points", []):
        picks_out.append({"what": q.get("what", ""), "error_px": round(float(np.hypot(res[k], res[k + 1])), 2)}); k += 2
    for L in lines + verticals:
        n = len(L["px"]); picks_out.append({"what": L.get("what", ""), "error_px": [round(float(e), 2) for e in res[k:k + n]]}); k += n
    view = {"file": level, "photo": name, "position": [round(float(c), 3) for c in Cv], "target": [round(float(c), 3) for c in Tv],
            "vfov": math.degrees(2 * math.atan((H2 / 2) / f)), "width": W2, "height": H2,
            "bearing": round(p[3] % 360, 2), "pitch": round(p[4], 2),
            "photo_fit": {"roll_deg": round(p[5], 2), "hfov_deg": round(math.degrees(2 * math.atan((W / 2) / f)), 2), "focal_px": round(f, 1),
                          "centre_px": [round(cx, 1), round(cy, 1)], "rms_px": round(rms, 2),
                          "camera_above_ground_m": None if gc is None else round(p[2] - gc, 2),
                          "at": [round(float(c), 2) for c in C], "picks": picks_out}}
    views.append(view)
    # the check image
    chk = img.copy(); dr = ImageDraw.Draw(chk)
    b = pts[pts[:, 3] == 6]
    uv, z = project(p, b[:, :3], W, H)
    for (u, v) in uv[(z > 1) & (uv[:, 0] >= 0) & (uv[:, 0] < W) & (uv[:, 1] >= 0) & (uv[:, 1] < H)][::3]:
        dr.point((u, v), fill=(255, 150, 40))
    for q in picks.get("points", []):
        u, v = project(p, np.array([q["at"]], float), W, H)[0][0]
        dr.ellipse([q["px"][0] - 3, q["px"][1] - 3, q["px"][0] + 3, q["px"][1] + 3], outline=(0, 255, 0))
        dr.line([tuple(q["px"]), (u, v)], fill=(255, 0, 0)); dr.ellipse([u - 2, v - 2, u + 2, v + 2], fill=(255, 0, 0))
    for L in lines:
        (a2, b2), _ = project(p, np.array([L["from"], L["to"]], float), W, H)
        dr.line([tuple(a2), tuple(b2)], fill=(255, 0, 0))
        for q in L["px"]: dr.ellipse([q[0] - 2, q[1] - 2, q[0] + 2, q[1] + 2], outline=(0, 255, 0))
    for V in verticals: dr.line([tuple(V["px"][0]), tuple(V["px"][1])], fill=(0, 255, 0))
    chk.save(os.path.join(OUT, f"{os.path.splitext(name)[0]}.png"))
    print(f"{name}: camera at ({p[0]:.2f}, {p[1]:.2f}), {view['photo_fit']['camera_above_ground_m']} m above the LiDAR ground; bearing {p[3] % 360:.2f}, pitch {p[4]:.2f}, roll {p[5]:.2f} deg; "
          f"hfov {view['photo_fit']['hfov_deg']} deg, centre ({cx:.1f}, {cy:.1f}); rms {rms:.2f} px over {len(res)} residuals; level cut {W2} x {H2}")
    for q in picks_out: print("   ", q["what"], q["error_px"])
path = os.path.join(REFS, "views.json")
if a.photos and os.path.exists(path):  # some of the photographs named: the others keep their views
    done = {v["photo"]: v for v in views}
    views = [done.pop(v.get("photo"), v) for v in json.load(open(path, encoding="utf-8"))] + list(done.values())
json.dump(views, open(path, "w"), indent=1)
print(f"{len(views)} views -> refs/photos/views.json")
