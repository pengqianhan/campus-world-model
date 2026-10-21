"""Shared helpers for the pipeline's Python stages: the building config, paths, and the frames.
Every stage runs in the landmark's folder, landmarks/<name>/ (../pipeline/run.sh <name> goes there),
in isolated mode, e.g.
  python3 -I ../pipeline/tools/data/measure.py [--config config/<name>.json]
"""
import argparse, json, math, os, sys

ROOT = os.getcwd()
NAME = os.path.basename(ROOT)
DEFAULT_CONFIG = os.path.join(ROOT, "config", f"{NAME}.json")
if os.path.basename(os.path.dirname(ROOT)) != "landmarks" or not os.path.exists(DEFAULT_CONFIG):
    sys.exit("run the stages in a landmark's folder (landmarks/<name>/, with config/<name>.json), "
             "or through landmarks/pipeline/run.sh <name>")


def args(description, extra=None):
    p = argparse.ArgumentParser(description=description)
    p.add_argument("--config", default=DEFAULT_CONFIG, help=f"building config (default config/{NAME}.json)")
    if extra: extra(p)
    return p.parse_args()


def load(path=DEFAULT_CONFIG):
    cfg = json.load(open(path))
    cfg["_data"] = os.path.join(ROOT, "data")
    os.makedirs(cfg["_data"], exist_ok=True)
    return cfg


def out(cfg, suffix):
    """data/<name>_<suffix>, e.g. data/clocktower_pts.npy"""
    return os.path.join(cfg["_data"], f"{cfg['name']}_{suffix}")


def origin_nztm(cfg):
    """NZTM (EPSG:2193) of the campus origin. The landmark's frame is NZTM minus this point, with grid
    north. The map's frame is not: see map_projector."""
    from pyproj import Transformer
    o = cfg["origin"]
    t = Transformer.from_crs(4326, 2193, always_xy=True)
    return t.transform(o["lon"], o["lat"])


def _metres_per_degree(o):
    """(m_lon, m_lat) at the origin's latitude, as makeProjector in src/shared/geo.ts."""
    phi = math.radians(o["lat"])
    return (111412.84 * math.cos(phi) - 93.5 * math.cos(3 * phi),
            111132.92 - 559.82 * math.cos(2 * phi) + 1.175 * math.cos(4 * phi))


def map_projector(cfg):
    """The map's frame: metres east and north of the campus origin through the equirectangular
    projection of src/shared/geo.ts (makeProjector), true north, as public/data/campus.json. Returns a
    function from local NZTM metres (the landmark's frame) to map metres."""
    from pyproj import Transformer
    o = cfg["origin"]
    m_lon, m_lat = _metres_per_degree(o)
    E0, N0 = origin_nztm(cfg)
    t = Transformer.from_crs(2193, 4326, always_xy=True)

    def to_map(x, y):
        lon, lat = t.transform(E0 + x, N0 + y)
        return ((lon - o["lon"]) * m_lon, (lat - o["lat"]) * m_lat)
    return to_map


def map_to_local(cfg):
    """The inverse of map_projector: a function from map metres to local NZTM metres."""
    from pyproj import Transformer
    o = cfg["origin"]
    m_lon, m_lat = _metres_per_degree(o)
    E0, N0 = origin_nztm(cfg)
    t = Transformer.from_crs(4326, 2193, always_xy=True)

    def to_local(x, y):
        e, n = t.transform(o["lon"] + x / m_lon, o["lat"] + y / m_lat)
        return (e - E0, n - N0)
    return to_local


def near_outline(cfg, xy, d):
    """Which of the points xy (local NZTM metres, shape (n, 2)) stand inside the building's outline
    (config building.outline, in the map's frame, taken to local metres) or within d m of its edge."""
    import numpy as np
    from matplotlib.path import Path
    to_local = map_to_local(cfg)
    a = np.array([to_local(x, y) for x, y in cfg["building"]["outline"]])
    ab = np.roll(a, -1, axis=0) - a
    t = np.clip(((xy[:, None, :] - a) * ab).sum(-1) / (ab * ab).sum(-1), 0, 1)
    edge = np.linalg.norm(xy[:, None, :] - (a + t[..., None] * ab), axis=-1).min(1)
    return Path(a).contains_points(xy) | (edge < d)


def load_frame(cfg):
    import numpy as np
    f = json.load(open(out(cfg, "frame.json")))
    r = json.load(open(out(cfg, "ring.json")))
    return {"E0": r["E0"], "N0": r["N0"], "centre": np.array(f["centre"]), "axis": np.array(f["axis"]),
            "toStreet": np.array(f["toStreet"]), "ground": f["ground"]}
