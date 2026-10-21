# References stage: Street View panoramas round the building as reference views, each with the camera
# that took it in the model's view frame (x right as seen from the street, y up from the ground at the
# door, z toward the street, tower centre at x = z = 0). Only the tiles that face the building are used.
#
#   python -I tools/streetview_collect.py [--config config/clocktower.json] [--offline] [--allow-fetch]
#
# Cache-first: tiles live in refs/streetview/tiles/<panoId>/<zoom>_<col>_<row>.jpg and are never fetched
# again. A missing tile is NOT fetched (tiles are billed) unless --allow-fetch is given; without it the
# run lists the missing tiles and leaves them black. Online, the run makes only the free calls
# (createSession, panoIds, metadata) and saves the metadata to refs/streetview/metadata.json;
# --offline rebuilds every view from that file and the cached tiles without any network call.
# A view whose tiles are not all cached keeps its existing image (a fresh clone has the views but no tiles).
# Key: $GOOGLE_MAPS_KEY or ~/.gmaps_key. Needs data/<name>_frame.json etc. (run the data stage first).
import argparse, io, json, math, os, sys, time
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "data"))
import common
import numpy as np
from PIL import Image
from pyproj import Transformer

ap = argparse.ArgumentParser()
ap.add_argument("--config", default=common.DEFAULT_CONFIG)
ap.add_argument("--offline", action="store_true", help="no network: use refs/streetview/metadata.json and cached tiles")
ap.add_argument("--allow-fetch", action="store_true", help="download missing tiles (billed: $2 per 1,000 after 100,000 a month)")
ap.add_argument("--max-panos", type=int, help="override config streetview.max_panos")
a = ap.parse_args()
cfg = common.load(a.config); SV = cfg["streetview"]
MAX = a.max_panos or SV["max_panos"]; RADIUS = SV["radius_m"]
OUT = os.path.join(common.ROOT, "refs", "streetview"); os.makedirs(OUT, exist_ok=True)
META = os.path.join(OUT, "metadata.json")
API = "https://tile.googleapis.com/v1"

fr = common.load_frame(cfg)
E0, N0, centre, ax, to_street, G = fr["E0"], fr["N0"], fr["centre"], fr["axis"], fr["toStreet"], fr["ground"]
to_nztm = Transformer.from_crs(4326, 2193, always_xy=True)
to_ll = Transformer.from_crs(2193, 4326, always_xy=True)
pts = np.load(common.out(cfg, "pts.npy")); ground_pts = pts[pts[:, 3] == 2]

def view_frame(lat, lng):
    """Lat/lng -> (x, z) in the model's view frame, metres."""
    e, n = to_nztm.transform(lng, lat)
    d = np.array([e - E0, n - N0]) - centre
    return float(-(d @ ax)), float(d @ to_street)

def ground_at(lat, lng):
    e, n = to_nztm.transform(lng, lat)
    d = np.hypot(ground_pts[:, 0] - (e - E0), ground_pts[:, 1] - (n - N0))
    near = ground_pts[d < 3]
    return float(np.median(near[:, 2])) if len(near) else None

def bearing_to_tower(lat, lng):
    """Compass bearing (true north) from a point to the tower's centre."""
    lng_t, lat_t = to_ll.transform(E0 + centre[0], N0 + centre[1])
    y = math.sin(math.radians(lng_t - lng)) * math.cos(math.radians(lat_t))
    x = math.cos(math.radians(lat)) * math.sin(math.radians(lat_t)) - math.sin(math.radians(lat)) * math.cos(math.radians(lat_t)) * math.cos(math.radians(lng_t - lng))
    return math.degrees(math.atan2(y, x)) % 360, lat_t, lng_t

calls = {"createSession": 0, "panoIds": 0, "metadata": 0, "tiles": 0}
s = q = None
if a.offline:
    if not os.path.exists(META): sys.exit(f"--offline needs {META}; run once online first")
    raw = json.load(open(META))["metadata"]
    print(f"offline: {len(raw)} panoramas from {os.path.relpath(META, common.ROOT)}")
else:
    import requests
    key = os.environ.get("GOOGLE_MAPS_KEY")
    if not key:  # ~/.gmaps_key holds either the bare key or a line "export GOOGLE_MAPS_KEY=..."
        key = open(os.path.expanduser("~/.gmaps_key")).read().strip().split("=", 1)[-1].strip().strip("'\"")
    s = requests.Session()
    r = s.post(f"{API}/createSession?key={key}", json={"mapType": "streetview", "language": "en-US", "region": "NZ"}).json()
    if "session" not in r: sys.exit(f"createSession failed: {r.get('error', {}).get('message', r)} (or run with --offline)")
    session = r["session"]
    calls["createSession"] += 1
    q = f"session={session}&key={key}"
    # 1. panoramas near the tower (free calls), or the ones the config names
    _, lat_t, lng_t = bearing_to_tower(-36.85, 174.77)
    locs = None if SV.get("pano_ids") else []
    for dn in (np.arange(-RADIUS, RADIUS + 1, 15) if locs is not None else []):
        for de in np.arange(-RADIUS, RADIUS + 1, 15):
            if dn * dn + de * de <= RADIUS * RADIUS:
                locs.append({"lat": lat_t + dn / 111320, "lng": lng_t + de / (111320 * math.cos(math.radians(lat_t)))})
    ids = set(SV.get("pano_ids", []))
    for i in range(0, len(locs or []), 100):
        r = s.post(f"{API}/streetview/panoIds?{q}", json={"locations": locs[i:i + 100], "radius": 12}).json(); calls["panoIds"] += 1
        ids |= {p for p in r.get("panoIds", []) if p}
    with ThreadPoolExecutor(4) as ex:
        raw = [m for m in ex.map(lambda i: s.get(f"{API}/streetview/metadata?{q}&panoId={i}").json(), sorted(ids)) if "lat" in m]
    calls["metadata"] += len(ids)
    raw.sort(key=lambda m: m["panoId"])
    json.dump({"note": "Map Tiles API Street View metadata, saved for --offline. Imagery and metadata (c) Google; references only.", "radius_m": RADIUS, "metadata": raw}, open(META, "w"), indent=1)
    print(f"{len(raw)} panoramas within {RADIUS:.0f} m; metadata saved to {os.path.relpath(META, common.ROOT)}")

metas = []
for m0 in raw:
    m = dict(m0)
    # where the camera stood, not the point snapped onto the road
    m["lat"], m["lng"] = m.get("originalLat", m["lat"]), m.get("originalLng", m["lng"])
    x, z = view_frame(m["lat"], m["lng"])
    m["dist"] = math.hypot(x, z); m["view_xz"] = [x, z]
    metas.append(m)
metas.sort(key=lambda m: m["dist"])
json.dump([{k: m[k] for k in ("panoId", "lat", "lng", "date", "heading", "tilt", "roll", "dist", "view_xz", "imageWidth")} for m in metas], open(os.path.join(OUT, "index.json"), "w"), indent=1)
for m in metas[:MAX]: print(f"  {m['panoId'][:12]}  {m['date']}  {m['dist']:5.1f} m  at x {m['view_xz'][0]:6.1f} z {m['view_xz'][1]:6.1f}")

# 2. tiles facing the building, stitched (cache first); 3. perspective views aimed at it
missing = []
def fetch_band(m, zoom, yaw_c, half_yaw, pitch_lo, pitch_hi):
    W = 512 * (1 << zoom); H = W // 2
    cols, rows = W // 512, H // 512
    def col_of(yaw): return int(((yaw - m["heading"] + 180) % 360) / 360 * W) // 512
    c0 = col_of(yaw_c - half_yaw); n_cols = int(math.ceil(2 * half_yaw / 360 * cols)) + 2
    r0 = max(0, int((90 - pitch_hi) / 180 * H) // 512); r1 = min(rows - 1, int((90 - pitch_lo) / 180 * H) // 512)
    tiles = [((c0 + i) % cols, r) for i in range(n_cols) for r in range(r0, r1 + 1)]
    pano = np.zeros((H, W, 3), np.uint8)
    cache = os.path.join(OUT, "tiles", m["panoId"]); os.makedirs(cache, exist_ok=True)
    def get(t):
        c, r = t
        fn = os.path.join(cache, f"{zoom}_{c}_{r}.jpg")
        if os.path.exists(fn): return t, open(fn, "rb").read(), False
        if not a.allow_fetch or s is None:
            missing.append(fn); return t, None, False
        for attempt in range(3):
            resp = s.get(f"{API}/streetview/tiles/{zoom}/{c}/{r}?{q}&panoId={m['panoId']}")
            if resp.ok:
                open(fn, "wb").write(resp.content)
                return t, resp.content, True
            time.sleep(1)
        return t, None, True
    fetched = 0
    with ThreadPoolExecutor(6) as ex:
        for (c, r), data, new in ex.map(get, tiles):
            fetched += new
            if data:
                pano[r * 512:(r + 1) * 512, c * 512:(c + 1) * 512] = np.asarray(Image.open(io.BytesIO(data)).convert("RGB"))
    return pano, len(tiles), fetched

def perspective(pano, m, yaw, pitch, hfov, w, h):
    H, W = pano.shape[:2]
    f = (w / 2) / math.tan(math.radians(hfov) / 2)
    xs, ys = np.meshgrid(np.arange(w) - w / 2 + 0.5, h / 2 - np.arange(h) - 0.5)
    # camera rays: forward (yaw, pitch), right, up; then their compass yaw and pitch
    cy, sy, cp, sp = math.cos(math.radians(yaw)), math.sin(math.radians(yaw)), math.cos(math.radians(pitch)), math.sin(math.radians(pitch))
    fwd = np.array([sy * cp, cy * cp, sp]); right = np.array([cy, -sy, 0]); up = np.cross(right, fwd)
    d = fwd[None, None] * f + right[None, None] * xs[..., None] + up[None, None] * ys[..., None]
    ryaw = np.degrees(np.arctan2(d[..., 0], d[..., 1])); rpit = np.degrees(np.arctan2(d[..., 2], np.hypot(d[..., 0], d[..., 1])))
    px = (((ryaw - m["heading"] + 180) % 360) / 360 * W) - 0.5; py = ((90 - rpit) / 180 * H) - 0.5
    x0 = np.floor(px).astype(int); y0 = np.clip(np.floor(py).astype(int), 0, H - 2); fx = (px - x0)[..., None]; fy = (py - y0)[..., None]
    x0 %= W; x1 = (x0 + 1) % W
    img = (pano[y0, x0] * (1 - fx) * (1 - fy) + pano[y0, x1] * fx * (1 - fy) + pano[y0 + 1, x0] * (1 - fx) * fy + pano[y0 + 1, x1] * fx * fy)
    return Image.fromarray(img.astype(np.uint8))

views = []
used = 0
for m in metas[:MAX]:
    b, _, _ = bearing_to_tower(m["lat"], m["lng"])
    dist = m["dist"]
    g = ground_at(m["lat"], m["lng"]); cam_y = (g if g is not None else G) + SV["camera_height_m"] - G
    zoom = 5 if dist < 70 else 4
    n_missing = len(missing)
    pano, n, fetched = fetch_band(m, zoom, b, 60, -30, 80); used += n; calls["tiles"] += fetched
    incomplete = len(missing) > n_missing  # some tiles are not cached: never overwrite a good image with a holed one
    x, z = m["view_xz"]
    pid = m["panoId"][:16]
    for V in SV["views"]:
        name, aim_y, hfov, w, h = V["name"], V["aim_y"], V["hfov"], V["width"], V["height"]
        pitch = math.degrees(math.atan2(aim_y - cam_y, max(dist, 1)))
        img = perspective(pano, m, b, pitch, hfov, w, h)
        fn = f"{pid}_{name}.jpg"
        if not (incomplete and os.path.exists(os.path.join(OUT, fn))): img.save(os.path.join(OUT, fn), quality=92)
        vfov = math.degrees(2 * math.atan(math.tan(math.radians(hfov) / 2) * h / w))
        views.append({"file": fn, "pano": m["panoId"], "date": m["date"], "position": [x, cam_y, z], "target": [0, aim_y, 0], "vfov": vfov, "width": w, "height": h, "bearing": b, "pitch": pitch, "ground_lidar": g})
    print(f"  {pid}: {n} tiles at zoom {zoom} ({fetched} downloaded), bearing to tower {b:.0f} deg, camera {cam_y:.1f} m above the door's ground")
json.dump(views, open(os.path.join(OUT, "views.json"), "w"), indent=1)
print(f"{len(views)} views from {min(MAX, len(metas))} panoramas; {used} tiles used, {calls['tiles']} downloaded (billed); "
      f"free calls: {calls['createSession']} createSession, {calls['panoIds']} panoIds, {calls['metadata']} metadata")
if missing:
    print(f"WARNING: {len(missing)} tiles not in the cache and not fetched (views that need them keep their existing image, or are left with black holes if new); rerun with --allow-fetch to buy them (~${len(missing) * 0.002:.2f} past the free tier)")
