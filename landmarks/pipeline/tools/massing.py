"""Measured massings (landmarks/MASSING.md): the plain buildings of the City campus as blocks and roofs
at the heights the LINZ 2024 LiDAR measures, drawn by landmarks/measured/model.js.

Reads the eight LiDAR tiles that the landmark pipeline already keeps in data/raw/landmarks/lidar/ (it
fetches nothing) and public/data/uoa/campus.json. For each tier-3 building in the tiles, and each of tiers 1
and 2 that the site does not draw as a landmark yet (MASSING.md, "Which buildings"), it measures the ground,
the roof and its layers and roof forms, builds the model with model.js (massing_triangles.mjs) and checks it
from above against the LiDAR. It writes
  landmarks/measured/buildings/<id>.json   each building that passes every limit (MASSING.md, decision 3)
  landmarks/measured/exclusions.json       each that does not, with its reason and its numbers
  landmarks/measured/out/<id>.png, report.md   the top views (LiDAR | model | difference) and a table (not committed)
Run from the repository root, with the pipeline's Python:
  $PY -I landmarks/pipeline/tools/massing.py            every such building in the tiles
  $PY -I landmarks/pipeline/tools/massing.py --tier3    tier 3 alone
  $PY -I landmarks/pipeline/tools/massing.py 216 113    these only; the other files are kept
"""
import json, math, os, re, subprocess, sys
from collections import deque

import numpy as np

ROOT = os.getcwd()
if not os.path.exists(os.path.join(ROOT, "public", "data", "uoa", "campus.json")):
    sys.exit("run from the repository root")
OUT = os.path.join(ROOT, "landmarks", "measured")
WORK = os.path.join(OUT, "out")     # gitignored (landmarks/.gitignore)
LIDAR = os.path.join(ROOT, "data", "raw", "landmarks", "lidar", "NZ24_Auckland")
TILES = [f"CL2_BA32_2024_1000_{t}" for t in ("3603", "3604", "3605", "3606", "3703", "3704", "3705", "3706")]

RES = 0.5            # m, the heightmap's cells
FLOOR = 2.5          # m above the reference ground: a roof
STEP = 1.0           # m between neighbouring cells: a wall between two layers
MIN_PIECE = 4.0      # m2: smaller pieces of roof are chimneys, vents and stray points
EAVE_BAND = 1.0      # m outside the outline where a roof edge is an eave, not a wall
GROUND_BAND = 5.0    # m outside the outline where the ground points are taken
PLANE_R = 1.2        # m: the neighbourhood a plane is fitted to
FLAT_DEG = 5.0       # a cell sloping less is flat
SIMPLIFY = 0.25      # m
SNAP = 0.75          # m: a layer's edge this near the outline goes onto it
MIN_OVERHANG = 0.2   # m: a smaller overhang is a wall on the outline
SLAB = 0.3           # m: the edge of a flat roof that overhangs its walls
FACE_MIN = 0.04      # a face of a sloping roof: at least this share of its sloping cells (a hipped end too)
# The limits (MASSING.md, decision 3): below any of them the block stays.
COVER_MIN, VEG_MAX, OPEN_MAX, IOU_MIN, WITHIN_MIN = 0.85, 0.15, 0.5, 0.90, 0.90
STOREY_MIN, STOREY_MAX = 2.4, 4.5

# The landmark queue's tiers 1 and 2 (MASSING.md, "Which buildings"). Until its landmark comes, a building of
# these tiers is measured too, through the same limits (a stand-in: making it a landmark deletes its data
# file); the buildings that the site draws as landmarks, and those in SOON, are left to the landmarks.
# `--tier3` measures tier 3 alone, as the generator did before.
TIER1 = {"102", "103", "104", "105", "105S", "107", "109", "118", "119", "130", "801", "802", "803", "804"}
TIER2 = {"106", "110", "110N", "201", "206", "207", "250", "260", "301", "302", "303", "303S", "305", "310",
         "311", "315", "401", "402", "405", "421E", "421W", "439", "440", "441", "442", "614", "616", "619",
         "620", "810", "818", "820"} | {str(i) for i in range(831, 838)}
# Landmarks in progress on their own branches, not yet on the site: the generator leaves them alone too.
SOON = {"801"}
# Buildings that keep their blocks in this batch, by decision (MASSING.md, "Decisions the maintainer must
# take"): 10 is the maintainer's (2026-10-22); 7 is the campus loop's lead's, as the design left it open;
# 6 stays at the design's default until the maintainer decides: places where people live (residential
# floors, and 434 and 450 by hand below) and childcare centres keep their blocks.
KEEP = {**{i: "Waipapa Marae: culturally significant; its block stays until the maintainer has asked the people "
              "it belongs to (decision 7)" for i in ("251", "252", "253", "254", "255", "256")},
        "275": "Fale Pasifika: culturally significant; its block stays until the maintainer has asked the people "
               "it belongs to (decision 7)",
        "408": "the 2024 LiDAR shows no roof on its outline; its block stays, and the campus map's record is for "
               "the maintainer to check (decision 10)",
        "434": "decision 6, a place where people live (the campus map shows an Accommodation Reception on its "
               "floor 2, though its floors are not marked residential): kept until the maintainer decides",
        "450": "decision 6, a place where people live (student housing by its name, though its floor is marked "
               "unmapped): kept until the maintainer decides"}
RESIDENTIAL = "decision 6, a place where people live: kept until the maintainer decides"

# A childcare centre by its name, when no floor is marked so (841 Nicholls Lane ECE was not, before PR #69)
CHILDCARE = re.compile(r"child|\bk[oō]hanga\b|early learning|\bECE\b|kindergarten|cr[eè]che", re.I)


def decode(flat):
    return np.array([[flat[i] / 10, flat[i + 1] / 10] for i in range(0, len(flat), 2)], float)


def _cross(a, b):
    a = np.asarray(a); b = np.asarray(b)
    return a[..., 0] * b[..., 1] - a[..., 1] * b[..., 0]


def area(ring):
    x, y = ring[:, 0], ring[:, 1]
    return 0.5 * float(np.dot(x, np.roll(y, -1)) - np.dot(np.roll(x, -1), y))


def ccw(ring):
    return ring if area(ring) > 0 else ring[::-1].copy()


def contains(rings, xy):
    """Even-odd over all the rings: inside the outer ring and in no hole."""
    from matplotlib.path import Path
    hit = np.zeros(len(xy), bool)
    for r in rings: hit ^= Path(r).contains_points(xy)
    return hit


def edge_distance(rings, xy):
    d = np.full(len(xy), np.inf)
    for r in rings:
        a = r; ab = np.roll(r, -1, axis=0) - r
        for k in range(len(r)):
            v = xy - a[k]; L = float(ab[k] @ ab[k]) or 1e-12
            t = np.clip(v @ ab[k] / L, 0, 1)
            d = np.minimum(d, np.hypot(v[:, 0] - t * ab[k, 0], v[:, 1] - t * ab[k, 1]))
    return d


def simplify(ring, tol):
    """Douglas-Peucker on a closed ring, keeping its two points furthest apart."""
    n = len(ring)
    if n < 5: return ring
    i0 = 0; i1 = int(np.argmax(np.hypot(*(ring - ring[0]).T)))
    def dp(pts):
        if len(pts) < 3: return [pts[0]]
        a, b = pts[0], pts[-1]; ab = b - a; L = math.hypot(*ab)
        d = (np.abs(_cross(ab, pts - a)) / L) if L > 1e-9 else np.hypot(*(pts - a).T)
        k = int(np.argmax(d))
        if d[k] <= tol: return [a]
        return dp(pts[:k + 1]) + dp(pts[k:])
    out = dp(ring[i0:i1 + 1]) + dp(np.vstack([ring[i1:], ring[:1]]))
    return np.array(out)


def offset(ring, d):
    """A counter-clockwise ring moved out by d metres, each corner mitred (at most 3 d out)."""
    n = len(ring); out = []
    for i in range(n):
        p, a, q = ring[i - 1], ring[i], ring[(i + 1) % n]
        e1 = (a - p) / (np.hypot(*(a - p)) or 1); e2 = (q - a) / (np.hypot(*(q - a)) or 1)
        n1 = np.array([e1[1], -e1[0]]); n2 = np.array([e2[1], -e2[0]])
        m = n1 + n2; k = float(m @ n1)
        out.append(a + (m / k * d if k > 1 / 3 else n2 * d))
    return np.array(out)


def snap(ring, outer):
    """Puts the points of a layer's edge that lie within SNAP of the outline onto it, and the outline's
    corners between two such points, so that its walls stand where the campus map has them."""
    seg = np.roll(outer, -1, axis=0) - outer
    lens = np.hypot(*seg.T); cum = np.concatenate([[0], np.cumsum(lens)]); per = cum[-1]
    pts, ts = [], []
    for p in ring:
        v = p - outer; t = np.clip((v * seg).sum(1) / np.maximum(lens ** 2, 1e-12), 0, 1)
        q = outer + t[:, None] * seg; d = np.hypot(*(p - q).T); k = int(np.argmin(d))
        if d[k] <= SNAP: pts.append(q[k]); ts.append(cum[k] + t[k] * lens[k])
        else: pts.append(p); ts.append(None)
    out = []
    for i in range(len(pts)):
        out.append(pts[i]); j = (i + 1) % len(pts)
        if ts[i] is None or ts[j] is None: continue
        fwd = (ts[j] - ts[i]) % per
        chord = math.hypot(*(pts[j] - pts[i]))
        if fwd > 1e-6 and fwd <= 1.5 * chord + 1.0:
            for k in range(len(outer)):
                if 1e-6 < (cum[k] - ts[i]) % per < fwd - 1e-6: out.append(outer[k])
    out = sorted_unique(out)
    return np.array(out)


def sorted_unique(pts):
    out = []
    for p in pts:
        if not out or math.hypot(*(p - out[-1])) > 0.05: out.append(np.asarray(p, float))
    while len(out) > 2 and math.hypot(*(out[0] - out[-1])) <= 0.05: out.pop()
    # drop points on a straight line
    k = 0
    while len(out) > 3 and k < len(out):
        a, b, c = out[k - 1], out[k], out[(k + 1) % len(out)]
        ab, bc = b - a, c - b
        if abs(ab[0] * bc[1] - ab[1] * bc[0]) < 1e-3 * max(1e-9, math.hypot(*ab) * math.hypot(*bc)) * 10 and ab @ bc > 0:
            out.pop(k)
        else: k += 1
    return out


def despike(ring):
    """A ring without its spikes: points where the edge turns back on itself, within 15 degrees."""
    pts = [np.asarray(p, float) for p in ring]
    k = 0
    while len(pts) > 3 and k < len(pts):
        a, b, c = pts[k - 1], pts[k], pts[(k + 1) % len(pts)]
        u, v = a - b, c - b
        nu, nv = math.hypot(*u), math.hypot(*v)
        if nu < 1e-6 or nv < 1e-6 or (u @ v) / (nu * nv) > math.cos(math.radians(15)): pts.pop(k); k = max(0, k - 1)
        else: k += 1
    return np.array(pts)


def crosses(ring):
    """Whether two edges of a ring cross each other."""
    n = len(ring)
    def o(p, q, r): return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
    for i in range(n):
        a, b = ring[i], ring[(i + 1) % n]
        for j in range(i + 2, n):
            if i == 0 and j == n - 1: continue
            c, d = ring[j], ring[(j + 1) % n]
            if o(a, b, c) * o(a, b, d) < -1e-9 and o(c, d, a) * o(c, d, b) < -1e-9: return True
    return False


def bounding_angle(ring):
    """The long axis of the smallest rectangle round the ring (boundingRectangle in src/shared/geo.ts)."""
    best = (math.inf, 0.0)
    for i in range(len(ring)):
        e = ring[(i + 1) % len(ring)] - ring[i]
        if math.hypot(*e) <= 0.3: continue
        ang = math.atan2(e[1], e[0]); c, s = math.cos(ang), math.sin(ang)
        u = ring[:, 0] * c + ring[:, 1] * s; v = ring[:, 1] * c - ring[:, 0] * s
        a = (u.max() - u.min()) * (v.max() - v.min())
        if a < best[0]: best = (a, ang if u.max() - u.min() >= v.max() - v.min() else ang + math.pi / 2)
    return best[1]


# ---- the LiDAR, cropped to the buildings, in the map's frame -------------------------------------------

def projector(origin):
    """NZTM to map metres: through longitude and latitude to the equirectangular frame of
    makeProjector in src/shared/geo.ts, true north, as public/data/uoa/campus.json."""
    from pyproj import Transformer
    phi = math.radians(origin["lat"])
    m_lon = 111412.84 * math.cos(phi) - 93.5 * math.cos(3 * phi)
    m_lat = 111132.92 - 559.82 * math.cos(2 * phi) + 1.175 * math.cos(4 * phi)
    to_ll = Transformer.from_crs(2193, 4326, always_xy=True)
    to_nztm = Transformer.from_crs(4326, 2193, always_xy=True)
    def to_map(e, n):
        lon, lat = to_ll.transform(e, n)
        return (np.asarray(lon) - origin["lon"]) * m_lon, (np.asarray(lat) - origin["lat"]) * m_lat
    def to_grid(x, y):
        return to_nztm.transform(origin["lon"] + np.asarray(x) / m_lon, origin["lat"] + np.asarray(y) / m_lat)
    return to_map, to_grid


def load_points(boxes, to_map):
    """Points of classes 2 to 6 inside any of the boxes (NZTM), in map metres: x, y, z, class."""
    import laspy
    crop = json.dumps([[round(v, 1) for v in b] for b in boxes])
    cache = os.path.join(WORK, "points.npz")
    if os.path.exists(cache):
        c = np.load(cache)
        if str(c["boxes"]) == crop: return c["p"]
    parts = []
    for t in TILES:
        f = os.path.join(LIDAR, t + ".laz")
        if not os.path.exists(f): sys.exit(f"missing {os.path.relpath(f, ROOT)}: the generator fetches nothing (landmarks/README.md, Fetching)")
        with laspy.open(f) as r:
            for ch in r.chunk_iterator(4_000_000):
                x = np.asarray(ch.x); y = np.asarray(ch.y)
                keep = np.zeros(len(x), bool)
                for x0, y0, x1, y1 in boxes: keep |= (x >= x0) & (x <= x1) & (y >= y0) & (y <= y1)
                cl = np.asarray(ch.classification)
                keep &= (cl >= 2) & (cl <= 6)
                if keep.any(): parts.append(np.c_[x[keep], y[keep], np.asarray(ch.z)[keep], cl[keep]])
        print(f"  {t}: {sum(len(p) for p in parts)} points kept so far", flush=True)
    P = np.vstack(parts)
    mx, my = to_map(P[:, 0], P[:, 1])
    P = np.c_[mx, my, P[:, 2], P[:, 3]]
    os.makedirs(WORK, exist_ok=True)
    np.savez_compressed(cache, p=P, boxes=crop)
    return P


# ---- one building ----------------------------------------------------------------------------------------

def levels_of(b):
    """Full levels at or above index 0, as src/shared/massing.ts stacks them: 216 Mona's B, G and 1 are three."""
    up = sorted(f["i"] for f in b["floors"] if f["i"] >= 0)
    if not up: return max(1, round(b["height"] / 3.6))
    full = [i for i in up if (i - up[0]) % 10 == 0]
    return (full[-1] - up[0]) // 10 + 1


def storeys(wall, levels):
    """Storeys spaced evenly from the ground to the eave (MASSING.md: never under 2.4 m, the wall then has
    fewer; never over 4.5 m, a plain band then stays above the top storey)."""
    n = max(1, levels); s = wall / n
    if s < STOREY_MIN: n = max(1, int(wall // STOREY_MIN)); s = wall / n
    if s > STOREY_MAX: s = STOREY_MAX
    return round(s, 3), n


def components(good, H, step):
    """Connected cells of good roof whose neighbours step by `step` or less."""
    lab = np.zeros(good.shape, int); k = 0
    for i0, j0 in zip(*np.nonzero(good)):
        if lab[i0, j0]: continue
        k += 1; lab[i0, j0] = k; q = deque([(i0, j0)])
        while q:
            i, j = q.popleft()
            for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                a, b = i + di, j + dj
                if 0 <= a < good.shape[0] and 0 <= b < good.shape[1] and good[a, b] and not lab[a, b] \
                        and abs(H[a, b] - H[i, j]) <= step:
                    lab[a, b] = k; q.append((a, b))
    return lab, k


def cell_planes(roof, H, cx, cy):
    """For each roof cell, a plane fitted to the roof cells within PLANE_R of it that stand within STEP of
    it: slope (deg), downhill direction (radians, east = 0, north = pi/2) and the RMS residual (m)."""
    r = int(math.ceil(PLANE_R / RES))
    offs = [(a, c) for a in range(-r, r + 1) for c in range(-r, r + 1) if math.hypot(a * RES, c * RES) <= PLANE_R + 1e-9]
    fit = np.full(roof.shape + (3,), np.nan)
    ny, nx = roof.shape
    for i, j in zip(*np.nonzero(roof)):
        pts = [(cx[j + c], cy[i + a], H[i + a, j + c]) for a, c in offs
               if 0 <= i + a < ny and 0 <= j + c < nx and roof[i + a, j + c] and abs(H[i + a, j + c] - H[i, j]) <= STEP]
        if len(pts) < 6: continue
        A = np.array(pts); M = np.c_[A[:, 0] - A[:, 0].mean(), A[:, 1] - A[:, 1].mean(), np.ones(len(A))]
        coef, *_ = np.linalg.lstsq(M, A[:, 2], rcond=None)
        res = A[:, 2] - M @ coef
        fit[i, j] = (math.degrees(math.atan(math.hypot(coef[0], coef[1]))), math.atan2(-coef[1], -coef[0]), float(np.sqrt((res ** 2).mean())))
    return fit


def fit_plane(x, y, z, gx=None, gy=None):
    """z = z0 + gx x + gy y: the dominant plane of the points. With the points' own gradients (their
    local planes), the median gradient and the most common offset under it start the fit, so that
    the points of another face that falls the same way do not tilt it; then least squares on the
    points within 0.3 m of it, twice."""
    if gx is not None and len(z) >= 6:
        g = (float(np.median(gx)), float(np.median(gy)))
        z0s = z - g[0] * x - g[1] * y
        hist, edges = np.histogram(z0s, bins=max(1, int(math.ceil((z0s.max() - z0s.min()) / 0.2))))
        mode = 0.5 * (edges[np.argmax(hist)] + edges[np.argmax(hist) + 1])
        keep = np.abs(z0s - mode) <= 0.3
    else:
        keep = np.ones(len(z), bool)
    coef = np.array([float(np.median(z)), 0.0, 0.0])
    for _ in range(3):
        if keep.sum() < 6: break
        M = np.c_[np.ones(keep.sum()), x[keep], y[keep]]
        coef, *_ = np.linalg.lstsq(M, z[keep], rcond=None)
        keep = np.abs(coef[0] + coef[1] * x + coef[2] * y - z) <= 0.3
    return coef


def roof_form(fit, H, ij, cx, cy, centre, zero, axis):
    """The roof of one layer: flat (with its height), or its sloping sides as planes, each fitted to the
    cells that fall that way (z = z0 + gx (x - centre x) + gy (y - centre y), above zero). The roof is the
    lowest of its planes at each point: one plane is a mono-pitch, two opposite a gable, more a hip."""
    slope, down = fit[ij[:, 0], ij[:, 1], 0], fit[ij[:, 0], ij[:, 1], 1]
    ok = ~np.isnan(slope)
    if ok.sum() < 8: return None, "too few cells for a plane"
    h = H[ij[:, 0], ij[:, 1]] - zero
    if (slope[ok] < FLAT_DEG).mean() >= 0.6: return {"form": "flat", "height": float(np.median(h))}, ""
    # a roof that one plane under 5 degrees holds within 0.3 m nearly everywhere is flat too, though its
    # cells tilt (ribs, plant, a membrane laid to falls)
    x = cx[ij[:, 1]] - centre[0]; y = cy[ij[:, 0]] - centre[1]
    z0, gx, gy = fit_plane(x, y, h)
    if math.hypot(gx, gy) < math.tan(math.radians(FLAT_DEG)) and (np.abs(z0 + gx * x + gy * y - h) <= 0.3).mean() >= 0.7:
        return {"form": "flat", "height": float(np.median(h))}, ""
    sl = ok & (slope >= FLAT_DEG) & (slope <= 70)
    # the directions the roof falls in: the peaks of a circular histogram of the cells' downhill
    # directions, 10 degrees a bin; each sloping cell goes with the peak within 40 degrees of it
    d = np.nan_to_num(down)
    hist = np.bincount((np.degrees(d[sl]) % 360 // 10).astype(int), minlength=36).astype(float)
    sm = sum(np.roll(hist, k) * w for k, w in ((-2, 1), (-1, 2), (0, 3), (1, 2), (2, 1))) / 9
    tot = max(1.0, float(sl.sum()))
    peaks = [k for k in range(36) if sm[k] >= sm[k - 1] and sm[k] > sm[(k + 1) % 36] and sm[k] * 5 / tot >= FACE_MIN]
    peaks = [math.radians(k * 10 + 5) for k in sorted(peaks, key=lambda k: -sm[k])]
    keep = []
    for pk in peaks:
        if all(abs((pk - q + math.pi) % (2 * math.pi) - math.pi) > math.radians(40) for q in keep): keep.append(pk)
    x = cx[ij[:, 1]] - centre[0]; y = cy[ij[:, 0]] - centre[1]
    turn = np.array([np.abs((d - q + math.pi) % (2 * math.pi) - math.pi) for q in keep]) if keep else np.zeros((0, len(d)))
    near = np.argmin(turn, 0) if keep else np.zeros(len(d), int)
    planes, dirs = [], []
    for k, q in enumerate(keep):
        m = sl & (near == k) & (turn[k] <= math.radians(40))
        if m.sum() < 8 or m.sum() < FACE_MIN * tot: continue
        t = np.tan(np.radians(slope[m]))
        z0, gx, gy = fit_plane(x[m], y[m], h[m], -t * np.cos(d[m]), -t * np.sin(d[m]))
        if math.degrees(math.atan(math.hypot(gx, gy))) < max(FLAT_DEG, 0.5 * float(np.median(slope[m]))): continue
        planes.append([round(float(gx), 4), round(float(gy), 4), round(float(z0), 3)]); dirs.append(math.atan2(-gy, -gx))
    if not planes: return {"form": "flat", "height": float(np.median(h))}, ""
    # then each plane again from the cells it fits best (within 0.5 m), three times
    for _ in range(3):
        pred = np.array([p[2] + p[0] * x + p[1] * y for p in planes])
        best = np.argmin(np.abs(pred - h), 0); off = np.abs(pred - h).min(0)
        for k in range(len(planes)):
            m = (best == k) & (off <= 0.5)
            if m.sum() < 8: continue
            z0, gx, gy = fit_plane(x[m], y[m], h[m])
            planes[k] = [round(float(gx), 4), round(float(gy), 4), round(float(z0), 3)]
    dirs = [math.atan2(-p[1], -p[0]) for p in planes]
    opposite = len(dirs) == 2 and abs((dirs[0] - dirs[1]) % (2 * math.pi) - math.pi) < math.radians(30)
    form = "mono" if len(planes) == 1 else "gable" if opposite else "hip"
    return {"form": form, "planes": planes, "slope": float(np.median(slope[sl]))}, ""


def roof_at(planes, x, y):
    return np.min([p[2] + p[0] * x + p[1] * y for p in planes], axis=0)


def along(ring, step=0.25):
    pts = []
    for k in range(len(ring)):
        a, b = ring[k], ring[(k + 1) % len(ring)]
        n = max(1, int(math.ceil(math.hypot(*(b - a)) / step)))
        pts += [a + (b - a) * t / n for t in range(n)]
    return np.array(pts)


def measure(b, P, others, campus_origin):
    rings = [ccw(decode(b["outline"][0]))] + [ccw(decode(r))[::-1] for r in b["outline"][1:]]
    outer = rings[0]
    x0, y0 = np.floor(outer.min(0) - 3); x1, y1 = np.ceil(outer.max(0) + 3)
    m = (P[:, 0] >= x0 - GROUND_BAND) & (P[:, 0] <= x1 + GROUND_BAND) & (P[:, 1] >= y0 - GROUND_BAND) & (P[:, 1] <= y1 + GROUND_BAND)
    Q = P[m]; xy = Q[:, :2]; z = Q[:, 2]; cl = Q[:, 3].astype(int)
    ins = contains(rings, xy); d = edge_distance(rings, xy)
    other = np.zeros(len(Q), bool)
    for o in others: other |= contains(o, xy)
    rec = {"outline_m2": round(sum(area(r) for r in rings), 1)}

    G = (cl == 2) & ~ins & (d <= GROUND_BAND)
    if G.sum() < 20: return rec, None, "too few ground points round the outline"
    g5, g50, g95 = (float(v) for v in np.percentile(z[G], [5, 50, 95]))
    rec["ground"] = {"p5": round(g5, 2), "p50": round(g50, 2), "p95": round(g95, 2)}

    # the model's y = 0: the LiDAR ground at the lowest point of the outline
    per = np.concatenate([[0], np.cumsum(np.hypot(*(np.roll(outer, -1, 0) - outer).T))])
    samples = []
    for k in range(len(outer)):
        a, bb = outer[k], outer[(k + 1) % len(outer)]
        n = max(1, int(math.hypot(*(bb - a))))
        samples += [a + (bb - a) * t / n for t in range(n)]
    gz = []
    gp = xy[cl == 2]; gzz = z[cl == 2]
    for s in samples:
        dd = np.hypot(*(gp - s).T); near = dd <= 1.5
        if near.sum() < 3: near = dd <= 3.0
        gz.append(float(np.median(gzz[near])) if near.sum() >= 3 else np.inf)
    k = int(np.argmin(gz))
    zero, door = (gz[k], samples[k]) if np.isfinite(gz[k]) else (g5, outer[0])
    rec["ground"]["zero"] = round(zero, 2)

    # the grid
    nx, ny = int((x1 - x0) / RES), int((y1 - y0) / RES)
    cx = x0 + (np.arange(nx) + 0.5) * RES; cy = y0 + (np.arange(ny) + 0.5) * RES
    CX, CY = np.meshgrid(cx, cy); cells = np.c_[CX.ravel(), CY.ravel()]
    Cin = contains(rings, cells).reshape(ny, nx)
    Cnear = Cin | (edge_distance(rings, cells).reshape(ny, nx) <= EAVE_BAND)
    Cother = np.zeros_like(Cin)
    for o in others: Cother |= contains(o, cells).reshape(ny, nx)
    Cnear &= ~Cother | Cin

    def bins(sel):
        ii = ((xy[sel, 1] - y0) / RES).astype(int); jj = ((xy[sel, 0] - x0) / RES).astype(int)
        ok = (ii >= 0) & (ii < ny) & (jj >= 0) & (jj < nx)
        return ii[ok], jj[ok], np.nonzero(sel)[0][ok]
    B = (cl == 6) & (ins | (d <= EAVE_BAND)) & ~(other & ~ins)
    high = B & (z > g50 + FLOOR)
    n_all = np.zeros((ny, nx)); n_roof = np.zeros((ny, nx)); H = np.full((ny, nx), -np.inf)
    i, j, _ = bins(np.ones(len(Q), bool)); np.add.at(n_all, (i, j), 1)
    i, j, _ = bins(high); np.add.at(n_roof, (i, j), 1)
    i, j, idx = bins(B); np.maximum.at(H, (i, j), z[idx])
    # a cell is roof where most of its points are roof points; single empty cells are closed
    roof = (n_all > 0) & (n_roof >= 0.5 * n_all)
    from scipy.ndimage import binary_closing, binary_fill_holes, distance_transform_edt
    empty = n_all == 0
    pad = np.pad(roof, 1); cnt = sum(np.roll(np.roll(pad, a, 0), c, 1) for a in (-1, 0, 1) for c in (-1, 0, 1) if a or c)[1:-1, 1:-1]
    fill = empty & (cnt >= 5)
    if fill.any():
        Hp = np.pad(np.where(roof, H, np.nan), 1, constant_values=np.nan)
        nb = np.stack([np.roll(np.roll(Hp, a, 0), c, 1)[1:-1, 1:-1] for a in (-1, 0, 1) for c in (-1, 0, 1) if a or c])
        H = np.where(fill, np.nanmedian(np.where(fill[None], nb, np.nan), 0) if fill.any() else H, H)
        roof |= fill
    roof &= Cnear & np.isfinite(H)
    A = RES * RES
    rec["roof_inside_m2"] = round(float((roof & Cin).sum() * A), 1)
    rec["cover"] = round(float((roof & Cin).sum() / max(1, Cin.sum())), 3)
    i, j, _ = bins((cl >= 3) & (cl <= 5))
    veg = np.zeros((ny, nx), bool); veg[i, j] = True
    rec["vegetation"] = round(float((veg & Cin).sum() / max(1, Cin.sum())), 3)
    # ground seen under the roof, on 1 m cells
    g1 = set(zip(*(((xy[(cl == 2) & ins] - [x0, y0]) // 1.0).astype(int).T)))
    r1 = set(zip(*(np.c_[CX[roof & Cin] - x0, CY[roof & Cin] - y0] // 1.0).astype(int).T))
    rec["open_below"] = round(len(g1 & r1) / max(1, len(r1)), 3)

    if rec["cover"] < COVER_MIN: return rec, None, f"roof cells cover {rec['cover']:.0%} of the outline (limit {COVER_MIN:.0%})"
    if rec["vegetation"] > VEG_MAX: return rec, None, f"vegetation over {rec['vegetation']:.0%} of the outline (limit {VEG_MAX:.0%})"
    if rec["open_below"] > OPEN_MAX: return rec, None, f"ground seen under {rec['open_below']:.0%} of the roof: open below, a bridge or a canopy (decision 8)"
    # the lowest layer stands on the outline itself: an outline that crosses itself has no inside to draw
    if any(crosses(r) for r in rings): return rec, None, "its outline on the campus map crosses itself: no inside to draw"

    # layers: smooth roof (planes that fit within 0.15 m), split where neighbours step by more than 0.6 m
    fit = cell_planes(roof, H, cx, cy)
    good = roof & (fit[..., 2] <= 0.15) & (fit[..., 0] <= 70)
    lab, n = components(good, H, 0.6)
    centre = [round(v, 2) for v in b["center"]]
    layers, dropped, info = [], [], {}
    for k in range(1, n + 1):
        mk = lab == k; a = float(mk.sum() * A); hk = H[mk] - zero
        piece = {"m2": round(a, 1), "from": round(float(hk.min()), 1), "to": round(float(hk.max()), 1)}
        if a < MIN_PIECE: lab[mk] = 0; continue
        if (mk & Cin).sum() < 0.5 * mk.sum(): dropped.append({**piece, "why": "mostly outside the outline: beside it"}); lab[mk] = 0; continue
        ij = np.argwhere(mk)
        hull = np.c_[cx[ij[:, 1]], cy[ij[:, 0]]]
        axis = bounding_angle(hull[_hull(hull)]) if len(hull) >= 3 else 0.0
        form, why = roof_form(fit, H, ij, cx, cy, centre, zero, axis)
        if form is None: dropped.append({**piece, "why": why}); lab[mk] = 0; continue
        form["m2"] = a; form["inside"] = int((mk & Cin).sum())
        form["low"] = float(np.percentile(hk, 10))
        info[k] = form; layers.append(k)
    rough = roof & Cin & ~np.isin(lab, layers)
    if rough.sum() * A >= MIN_PIECE:
        dropped.append({"m2": round(float(rough.sum() * A), 1), "why": "roof cells on no smooth plane, or in pieces under 4 m2: "
                        "counted as LiDAR only in the top-view check"})
    if not layers: return rec, None, "no layer of smooth roof of 4 m2 or more"
    layers.sort(key=lambda k: info[k]["low"])

    # every cell of the outline goes with a layer: a roof cell on no smooth plane with the layer within
    # 4 m whose roof is nearest its height there, any other cell with its nearest layer
    known = np.isin(lab, layers)
    _, (ii, jj) = distance_transform_edt(~known, return_indices=True)
    full = np.where(Cin, lab[ii, jj], 0)
    loose = Cin & ~known & roof & np.isfinite(H)
    if loose.any():
        X = CX[loose] - centre[0]; Y = CY[loose] - centre[1]; h = H[loose] - zero
        best = np.full(len(h), np.inf); pick = full[loose].copy()
        for k in layers:
            near = distance_transform_edt(lab != k)[loose] * RES <= 4.0
            f = info[k]
            off = np.abs(h - (f["height"] if f["form"] == "flat" else roof_at(f["planes"], X, Y)))
            take = near & (off < best)
            best[take] = off[take]; pick[take] = k
        full[loose] = pick
    # roof that no layer draws: a cell on no smooth plane more than 1 m from every layer's roof there
    # (a chimney, plant, a tree classed as building), or a piece under 4 m2. The top-view check counts
    # these cells as LiDAR only (MASSING.md, step 5)
    off = np.full(H.shape, np.inf)
    for k in layers:
        f = info[k]
        rh = f["height"] if f["form"] == "flat" else roof_at(f["planes"], CX - centre[0], CY - centre[1])
        off = np.minimum(off, np.abs(H - zero - rh))
    skip = roof & ~known & (off > 1.0)
    rec["not_drawn_m2"] = round(float(skip.sum() * A), 1)

    levels = levels_of(b)
    base = layers[0]
    out = []
    # the lowest layer stands on the whole outline (flat if it covers less than half of it), with its eaves
    # measured edge by edge from the building points at its eave, within 0.6 m (edge_eaves)
    bi = info[base]
    small = bi["inside"] < 0.5 * Cin.sum()
    flattened = small and bi["form"] != "flat"
    if flattened:
        bi = {**bi, "form": "flat", "height": float(np.median(H[lab == base] - zero))}
    eave0 = bi["height"] if bi["form"] == "flat" else float(roof_at(bi["planes"], *(along(outer) - centre).T).min())

    def traced(k):
        mk = binary_fill_holes(binary_closing(full == k, iterations=1)) & Cin
        for ring in trace(mk, cx, cy):
            plain = simplify(ring, SIMPLIFY)
            ring = snap(plain, outer)
            # snapping can fold a ring over itself; then the traced edge stays as it is
            ring = despike(np.round(ring, 2)) if len(ring) >= 3 else ring
            if len(ring) >= 3 and crosses(ring): ring = despike(np.round(plain, 2))
            if len(ring) < 3 or area(ring) < MIN_PIECE or crosses(ring): continue
            yield ccw(ring)

    def stands(rec_k):
        # a layer no higher than the walls it would stand on is part of the roof under it
        return rec_k["ridge"] > rec_k["y0"] + 0.2 and rec_k["wall"] > rec_k["y0"]

    def eaves_at(h):
        return edge_eaves(xy[B & (np.abs(z - zero - h) <= 0.6)], outer)

    out.append(layer_record(rings, bi, -1.0, eaves_at(eave0), levels, centre))
    lost = 0.0
    for k in layers[1:]:
        for ring in traced(k):
            rec_k = layer_record([ring], info[k], out[0]["wall"], 0.0, levels, centre)
            if stands(rec_k): out.append(rec_k)
            else: lost = max(lost, rec_k["m2"])
    # When the lowest layer covers less than half of the outline and the rule above would lose a roof (the
    # lowest layer's own slopes, flattened, or a larger layer under the walls it would stand on, as when two
    # hips meet in a valley), the walls round the outline stop instead at a flat plinth at the lowest eave of
    # all the layers (the 10th percentile of each one's roof), with its eaves, and every layer, the lowest
    # too, stands on it as traced. A sloping roof whose planes reach below the plinth's top has its walls
    # rise from that top, and those parts of its planes stay inside the plinth.
    if small and (flattened or lost > info[base]["m2"]):
        ups = [layer_record([ring], info[k], 0.0, 0.0, levels, centre) for k in layers for ring in traced(k)]
        e = min(info[k]["low"] for k in layers)
        if ups and e >= FLOOR:
            out = [layer_record(rings, {"form": "flat", "height": e, "m2": float(Cin.sum() * A)}, -1.0, eaves_at(e), levels, centre)]
            y0 = out[0]["wall"]
            for u in ups:
                u["y0"] = y0
                if u["roof"] != "flat" and u["wall"] <= y0 + 0.05 < u["ridge"] - 0.2:
                    u["wall"] = round(y0 + 0.05, 2)
                    u["storey"], u["storeys"] = storeys(u["wall"], levels)
                if stands(u): out.append(u)
    data = {
        "note": "A measured massing (landmarks/MASSING.md), written by landmarks/pipeline/tools/massing.py from the "
                "LINZ 2024 LiDAR and drawn by landmarks/measured/model.js; do not edit. Map metres east and north "
                "of the campus origin, true north, as public/data/uoa/campus.json. Heights in metres above "
                "ground.zero, the LiDAR ground (NZVD2016) at the lowest point of the outline, where the model "
                "stands on the map's ground (place.door).",
        "place": {"building": b["id"], "centre": centre, "door": [round(float(door[0]), 2), round(float(door[1]), 2)]},
        "lidar": "Auckland Part 1 LiDAR point cloud (2024), tiles " + ", ".join(t[-4:] for t in TILES),
        "ground": rec["ground"],
        "levels": levels,
        "layers": out,
        "dropped": dropped,
        "measured": {k: rec[k] for k in ("outline_m2", "roof_inside_m2", "cover", "vegetation", "open_below", "not_drawn_m2")},
    }
    rec["skip"] = np.c_[CX[skip], CY[skip]]
    return rec, data, None


def edge_eaves(pts, outer):
    """The overhang of each edge of a counter-clockwise outline, from the building points at its eave (`pts`):
    at each half metre of an edge where such points lie just inside, how far out they go, in a strip 1 m
    wide, with no gap of more than 0.6 m. An edge's overhang is the median of these, if half of the edge
    has roof at the eave; an edge under 1 m long takes the larger of its neighbours'. 0 where none has one."""
    def reach_at(p_, t_):
        n_ = np.array([t_[1], -t_[0]])                       # out of a counter-clockwise ring
        v = pts - p_
        along_t, out_d = v @ t_, v @ n_
        dd = np.sort(out_d[(np.abs(along_t) <= 0.5) & (out_d >= -0.5) & (out_d <= EAVE_BAND + 0.2)])
        if not len(dd) or dd[0] > 0: return None             # no roof at the eave just inside
        r_ = 0.0
        for k in range(1, len(dd)):
            if dd[k] - dd[k - 1] > 0.6: break
            r_ = max(r_, float(dd[k]))
        return min(r_, EAVE_BAND)

    ne = len(outer)
    eaves, short = [0.0] * ne, [False] * ne
    for k in range(ne):
        a_, b_ = outer[k], outer[(k + 1) % ne]
        L = float(np.hypot(*(b_ - a_)))
        if L < 1.0: short[k] = True; continue
        t_ = (b_ - a_) / L
        m = int(math.ceil(L / 0.5))
        got = [r for r in (reach_at(a_ + (b_ - a_) * (j + 0.5) / m, t_) for j in range(m)) if r is not None]
        o = float(np.median(got)) if len(got) >= 0.5 * m else 0.0
        eaves[k] = round(min(EAVE_BAND, o), 2) if o >= MIN_OVERHANG else 0.0
    eaves = [max(eaves[k - 1] if not short[k - 1] else 0.0, eaves[(k + 1) % ne] if not short[(k + 1) % ne] else 0.0)
             if short[k] else eaves[k] for k in range(ne)]
    return eaves if any(eaves) else 0.0


def _hull(p):
    """Indices of the convex hull (monotone chain)."""
    o = np.lexsort((p[:, 1], p[:, 0])); pts = p[o]
    def half(seq):
        h = []
        for k in seq:
            while len(h) >= 2 and _cross(pts[h[-1]] - pts[h[-2]], pts[k] - pts[h[-1]]) <= 0: h.pop()
            h.append(k)
        return h
    lo = half(range(len(pts))); hi = half(range(len(pts) - 1, -1, -1))
    return o[lo[:-1] + hi[:-1]]


def trace(mask, cx, cy):
    """The outlines of a mask's regions, through matplotlib's contour (its own contour algorithm
    "serial"), on a figure that is never drawn."""
    from matplotlib.figure import Figure
    z = np.pad(mask.astype(float), 1)
    cs = Figure().add_subplot().contour(z, levels=[0.5], algorithm="serial")
    lines = [ln for path in cs.get_paths() for ln in path.to_polygons(closed_only=False)]
    out = []
    for ln in lines:
        if len(ln) < 4: continue
        r = np.c_[cx[0] + (ln[:, 0] - 1) * RES, cy[0] + (ln[:, 1] - 1) * RES]
        if np.hypot(*(r[0] - r[-1])) < 1e-6: r = r[:-1]
        if area(r) > 0 or True: out.append(ccw(r))
    return out


def layer_record(rings, li, y0, over, levels, centre):
    """One layer as model.js draws it: its rings, its walls from y0 up to its roof, its storeys up to the
    lowest edge of its roof (`wall`), and its roof: flat at `eave`, or the lowest of its planes."""
    r = {"rings": [[[round(float(x), 2), round(float(y), 2)] for x, y in ring] for ring in rings], "y0": round(y0, 2)}
    if li["form"] == "flat":
        eave = li["height"]; wall = eave - SLAB if over else eave; ridge = eave
        r.update(roof="flat", eave=round(eave, 2))
    else:
        edge = along(rings[0]) - centre
        wall = float(roof_at(li["planes"], edge[:, 0], edge[:, 1]).min())
        gx, gy = np.meshgrid(np.arange(rings[0][:, 0].min(), rings[0][:, 0].max(), 0.5), np.arange(rings[0][:, 1].min(), rings[0][:, 1].max(), 0.5))
        inner = np.c_[gx.ravel(), gy.ravel()]; inner = np.vstack([inner[contains(rings[:1], inner)], along(rings[0])]) - centre
        ridge = float(max(roof_at(li["planes"], inner[:, 0], inner[:, 1]).max(), wall))
        r.update(roof=li["form"], planes=li["planes"], slope=round(li["slope"], 1))
    s, n = storeys(max(0.0, wall), levels)
    r.update(wall=round(wall, 2), ridge=round(ridge, 2), overhang=max(over) if isinstance(over, list) else over,
             storey=s, storeys=n, m2=round(li["m2"], 1))
    # the overhang of each edge of the outer ring, from its first point; `overhang` is the largest
    if isinstance(over, list): r["eaves"] = over
    return r


# ---- the check from above ----------------------------------------------------------------------------------

def topview(b, data, P, others, skip=None):
    """The model and the LiDAR as heightmaps on a 0.5 m grid (as tools/topview.py does for a landmark):
    footprint IoU, model minus LiDAR heights on the cells both cover, and a picture."""
    os.makedirs(WORK, exist_ok=True)
    src = os.path.join(WORK, f"{b['id']}.json"); tri = os.path.join(WORK, f"{b['id']}_triangles.bin")
    json.dump(data, open(src, "w"))
    subprocess.run(["node", os.path.join(ROOT, "landmarks", "pipeline", "tools", "massing_triangles.mjs"), src, tri], check=True)
    T = np.fromfile(tri, np.float32).reshape(-1, 3, 3).astype(float)   # east, north, up (above ground.zero)
    zero = data["ground"]["zero"]; g50 = data["ground"]["p50"]
    rings = [ccw(decode(b["outline"][0]))] + [ccw(decode(r))[::-1] for r in b["outline"][1:]]
    outer = rings[0]
    x0, y0 = np.floor(np.minimum(outer.min(0), T[..., :2].reshape(-1, 2).min(0)) - 3)
    x1, y1 = np.ceil(np.maximum(outer.max(0), T[..., :2].reshape(-1, 2).max(0)) + 3)
    nx, ny = int((x1 - x0) / RES), int((y1 - y0) / RES)
    cx = x0 + (np.arange(nx) + 0.5) * RES; cy = y0 + (np.arange(ny) + 0.5) * RES
    CX, CY = np.meshgrid(cx, cy); cells = np.c_[CX.ravel(), CY.ravel()]
    m = (P[:, 0] >= x0) & (P[:, 0] < x1) & (P[:, 1] >= y0) & (P[:, 1] < y1)
    Q = P[m]; xy = Q[:, :2]; z = Q[:, 2]; cl = Q[:, 3].astype(int)
    ins = contains(rings, xy); d = edge_distance(rings, xy)
    other = np.zeros(len(Q), bool)
    for o in others: other |= contains(o, xy)
    B = (cl == 6) & (ins | (d <= EAVE_BAND)) & ~(other & ~ins)
    ii = ((xy[:, 1] - y0) / RES).astype(int); jj = ((xy[:, 0] - x0) / RES).astype(int)
    n_all = np.zeros((ny, nx)); n_roof = np.zeros((ny, nx)); lidar = np.full((ny, nx), -np.inf)
    np.add.at(n_all, (ii, jj), 1)
    hi = B & (z > g50 + FLOOR); np.add.at(n_roof, (ii[hi], jj[hi]), 1)
    np.maximum.at(lidar, (ii[B], jj[B]), z[B])
    from scipy.ndimage import binary_closing
    L = binary_closing((n_all > 0) & (n_roof >= 0.5 * n_all), iterations=1)
    near = contains(rings, cells).reshape(ny, nx) | (edge_distance(rings, cells).reshape(ny, nx) <= EAVE_BAND)
    L &= near

    model = np.full((ny, nx), -np.inf)
    for t in T:
        xs, ys, hs = t[:, 0], t[:, 1], t[:, 2] + zero
        j0, j1 = np.searchsorted(cx, xs.min()), np.searchsorted(cx, xs.max(), "right")
        i0, i1 = np.searchsorted(cy, ys.min()), np.searchsorted(cy, ys.max(), "right")
        if j0 >= j1 or i0 >= i1: continue
        X, Y = np.meshgrid(cx[j0:j1], cy[i0:i1])
        den = (ys[1] - ys[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (ys[0] - ys[2])
        if abs(den) < 1e-12: continue
        w0 = ((ys[1] - ys[2]) * (X - xs[2]) + (xs[2] - xs[1]) * (Y - ys[2])) / den
        w1 = ((ys[2] - ys[0]) * (X - xs[2]) + (xs[0] - xs[2]) * (Y - ys[2])) / den
        w2 = 1 - w0 - w1
        inside = (w0 >= -1e-9) & (w1 >= -1e-9) & (w2 >= -1e-9)
        if not inside.any(): continue
        sub = model[i0:i1, j0:j1]
        np.copyto(sub, np.maximum(sub, np.where(inside, w0 * hs[0] + w1 * hs[1] + w2 * hs[2], -np.inf)))
    M = model > g50 + FLOOR
    if skip is not None and len(skip):
        si = np.floor((skip[:, 1] - y0) / RES).astype(int); sj = np.floor((skip[:, 0] - x0) / RES).astype(int)
        ok = (si >= 0) & (si < ny) & (sj >= 0) & (sj < nx)
        drop = np.zeros_like(M); drop[si[ok], sj[ok]] = True
    else: drop = np.zeros_like(M)
    both = L & M & ~drop & np.isfinite(lidar)
    diff = model[both] - lidar[both]
    r = {"iou": round(float((L & M).sum() / max(1, (L | M).sum())), 3),
         "lidar_m2": round(float(L.sum() * RES * RES), 1), "model_m2": round(float(M.sum() * RES * RES), 1),
         "within_0.5m": round(float((np.abs(diff) <= 0.5).mean()), 3) if both.any() else 0.0,
         "model_minus_lidar_m": {k: round(float(np.percentile(diff, q)), 2) for k, q in (("p10", 10), ("p50", 50), ("p90", 90))} if both.any() else None,
         "highest_m": {"model": round(float(model[M].max() - zero), 2) if M.any() else None,
                       "lidar": round(float(lidar[L & np.isfinite(lidar)].max() - zero), 2) if (L & np.isfinite(lidar)).any() else None}}
    picture(b["id"], np.where(L, lidar - zero, np.nan), np.where(M, model - zero, np.nan))
    for f in (src, tri): os.remove(f)
    return r


def picture(bid, lidar, model):
    import matplotlib; matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    top = np.nanmax([np.nanmax(lidar) if np.isfinite(lidar).any() else 1, np.nanmax(model) if np.isfinite(model).any() else 1])
    fig, ax = plt.subplots(1, 3, figsize=(12, 4.2))
    for a, im, t in ((ax[0], lidar, "LiDAR"), (ax[1], model, "model")):
        h = a.imshow(im, origin="lower", vmin=0, vmax=top, cmap="viridis"); a.set_title(f"{bid} {t} (m)"); fig.colorbar(h, ax=a, shrink=0.8)
    dd = model - lidar
    h = ax[2].imshow(dd, origin="lower", vmin=-2, vmax=2, cmap="RdBu_r"); ax[2].set_title("model - LiDAR (m)"); fig.colorbar(h, ax=ax[2], shrink=0.8)
    for a in ax: a.set_xticks([]); a.set_yticks([])
    fig.tight_layout(); fig.savefig(os.path.join(WORK, f"{bid}.png"), dpi=80); plt.close(fig)


def compact(data):
    """JSON with one line a key, and each point [x, y] and each plane on one line."""
    text = json.dumps(data, ensure_ascii=False, indent=1)
    text = re.sub(r"\[\s*(-?[\d.]+),\s*(-?[\d.]+)\s*\]", r"[\1, \2]", text)
    text = re.sub(r"\[\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+)\s*\]", r"[\1, \2, \3]", text)
    return text + "\n"


# ---- the batch --------------------------------------------------------------------------------------------

def landmark_buildings():
    """The buildings that the site draws as landmarks: `building` and `also` of each landmarks/<name>/placement.json
    with `site: true` for the University (no `school`, or "uoa"), as src/app/landmarks.ts finds them."""
    out = set()
    for name in os.listdir(os.path.join(ROOT, "landmarks")):
        f = os.path.join(ROOT, "landmarks", name, "placement.json")
        if not os.path.exists(f): continue
        p = json.load(open(f, encoding="utf-8"))
        if p.get("site") is True and p.get("school", "uoa") == "uoa": out |= {p["building"], *p.get("also", [])}
    return out


def main():
    campus = json.load(open(os.path.join(ROOT, "public", "data", "uoa", "campus.json"), encoding="utf-8"))
    origin = campus["origin"]
    to_map, to_grid = projector(origin)
    bounds = []
    import laspy
    missing = [t for t in TILES if not os.path.exists(os.path.join(LIDAR, t + ".laz"))]
    if missing:
        sys.exit(f"missing {', '.join(missing)} in {os.path.relpath(LIDAR, ROOT)}: the generator fetches nothing "
                 "(landmarks/README.md, Fetching)")
    for t in TILES:
        with laspy.open(os.path.join(LIDAR, t + ".laz")) as r: bounds.append((*r.header.mins[:2], *r.header.maxs[:2]))
    def in_tiles(ring):
        e, n = to_grid(ring[:, 0], ring[:, 1])
        return all(any(x0 <= a <= x1 and y0 <= c <= y1 for x0, y0, x1, y1 in bounds) for a, c in zip(e, n))
    city = [b for b in campus["buildings"] if b["campus"] == "city" and not b.get("offMap") and not b.get("area")]
    tier3 = [b for b in city if b["id"] not in TIER1 | TIER2 and in_tiles(decode(b["outline"][0]))]
    only3 = "--tier3" in sys.argv[1:]
    ask = [a for a in sys.argv[1:] if not a.startswith("--")]
    drawn = landmark_buildings()
    wider = [] if only3 else [b for b in city if b["id"] in TIER1 | TIER2 and b["id"] not in drawn | SOON
                              and in_tiles(decode(b["outline"][0]))]
    every = tier3 + wider
    todo = [b for b in every if not ask or b["id"] in ask]
    print(f"{len(tier3)} tier-3 buildings and {len(wider)} of tiers 1 and 2 with no landmark in the tiles; measuring {len(todo)}")
    boxes = []
    # the points round every building the generator may measure, so that one cache serves any run
    for b in every:
        r = decode(b["outline"][0]); lo = r.min(0) - 12; hi = r.max(0) + 12
        e, n = to_grid([lo[0], hi[0], lo[0], hi[0]], [lo[1], lo[1], hi[1], hi[1]])
        boxes.append((min(e), min(n), max(e), max(n)))
    P = load_points(boxes, to_map)
    os.makedirs(os.path.join(OUT, "buildings"), exist_ok=True)
    if not ask:
        # a run over every building writes the whole set: the data file of a building it no longer measures
        # (one that has become a landmark) goes
        for f in os.listdir(os.path.join(OUT, "buildings")):
            if f.endswith(".json") and f[:-5] not in {b["id"] for b in todo}: os.remove(os.path.join(OUT, "buildings", f))
    exfile = os.path.join(OUT, "exclusions.json")
    ex = json.load(open(exfile, encoding="utf-8"))["buildings"] if os.path.exists(exfile) and ask else {}
    rows = []
    outlines = {b["id"]: [ccw(decode(b["outline"][0]))] for b in city}
    for b in todo:
        bid = b["id"]; name = b["name"]["en"]
        target = os.path.join(OUT, "buildings", f"{bid}.json")
        if os.path.exists(target): os.remove(target)
        ex.pop(bid, None)
        r0 = decode(b["outline"][0]); lo, hi = r0.min(0) - 8, r0.max(0) + 8
        others = [o for i, o in outlines.items() if i != bid and (o[0].max(0) >= lo).all() and (o[0].min(0) <= hi).all()]
        rec, data, why = measure(b, P, others, origin)
        floors = b["floors"]
        policy = KEEP.get(bid)
        if not policy and (any(f.get("noPlan") == "childcare" for f in floors) or CHILDCARE.search(b["sourceText"] + " " + name)):
            policy = "decision 6, a childcare centre: kept until the maintainer decides"
        if not policy and any(f.get("noPlan") == "residential" for f in floors): policy = RESIDENTIAL
        if data and not why:
            data["check"] = topview(b, data, P, others, rec.pop("skip", None))
            c = data["check"]
            rec["check"] = c
            if c["iou"] < IOU_MIN or c["within_0.5m"] < WITHIN_MIN:
                why = f"top-view check: footprint IoU {c['iou']:.3f} (limit {IOU_MIN}), {c['within_0.5m']:.0%} of cells within 0.5 m (limit {WITHIN_MIN:.0%})"
        why = policy or why
        if why:
            rec.pop("skip", None)
            ex[bid] = {"name": name, "reason": why, **({"measured": rec} if rec else {})}
            rows.append((bid, name, None, why))
            print(f"{bid} {name}: block stays: {why}")
        else:
            open(target, "w", encoding="utf-8", newline="\n").write(compact(data))
            rows.append((bid, name, data, None))
            c = data["check"]
            print(f"{bid} {name}: drawn, {len(data['layers'])} layer(s) "
                  f"{'/'.join(l['roof'] for l in data['layers'])}, IoU {c['iou']}, within {c['within_0.5m']}")
    json.dump({"note": "The buildings of the City campus in the eight LiDAR tiles that the generator measures (tier 3, and "
                       "tiers 1 and 2 until their landmarks come) and that keep their blocks, each with its reason "
                       "(landmarks/MASSING.md). Written by landmarks/pipeline/tools/massing.py; do not edit.",
               "buildings": dict(sorted(ex.items()))}, open(exfile, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
    with open(os.path.join(WORK, "report.md"), "w", encoding="utf-8") as f:
        f.write("| Building | Layers | Roofs | IoU | Within 0.5 m | p10 / p50 / p90 (m) | Highest model / LiDAR (m) |\n|---|---|---|---|---|---|---|\n")
        for bid, name, data, why in rows:
            if data:
                c = data["check"]; q = c["model_minus_lidar_m"]
                f.write(f"| {bid} {name} | {len(data['layers'])} | {', '.join(l['roof'] for l in data['layers'])} | {c['iou']:.3f} | "
                        f"{c['within_0.5m']:.0%} | {q['p10']} / {q['p50']} / {q['p90']} | {c['highest_m']['model']} / {c['highest_m']['lidar']} |\n")
        f.write("\n| Building | Why the block stays |\n|---|---|\n")
        for bid, name, data, why in rows:
            if why: f.write(f"| {bid} {name} | {why} |\n")


if __name__ == "__main__":
    # Names such as "Māori" go to a console or a pipe that may not be UTF-8 (Windows: cp1252).
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main()
