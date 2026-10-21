"""Shared helpers for the pipeline's Python stages: the building config, paths, and the frame.
Run every stage with the geo env in isolated mode, e.g.
  python3 -I tools/data/measure.py [--config config/clocktower.json]
"""
import argparse, json, math, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_CONFIG = os.path.join(ROOT, "config", "clocktower.json")


def args(description, extra=None):
    p = argparse.ArgumentParser(description=description)
    p.add_argument("--config", default=DEFAULT_CONFIG, help="building config (default config/clocktower.json)")
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
    """NZTM of the local origin, computed exactly as the main project does (campus.json)."""
    from pyproj import Transformer
    o = cfg["origin"]
    t = Transformer.from_crs(4326, 2193, always_xy=True)
    return t.transform(o["lon"], o["lat"])


def load_frame(cfg):
    import numpy as np
    f = json.load(open(out(cfg, "frame.json")))
    r = json.load(open(out(cfg, "ring.json")))
    return {"E0": r["E0"], "N0": r["N0"], "centre": np.array(f["centre"]), "axis": np.array(f["axis"]),
            "toStreet": np.array(f["toStreet"]), "ground": f["ground"]}
