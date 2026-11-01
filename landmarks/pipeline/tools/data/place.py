"""Data stage 4: where the landmark stands on the campus map, written to placement.json beside its config.
The model is drawn in its view frame (x along the facade, y up from the ground at the door, z toward
the street), which stands in the LiDAR frame: NZTM metres minus the NZTM of the campus origin, grid
north. The map (public/data/uoa/campus.json) uses metres east and north of the same origin through an
equirectangular projection, true north. The two frames differ: at the Clock Tower by 4.2 m and 1.06 deg.
So this stage takes the frame's centre and axes through longitude and latitude to the map, and the
site needs only placement.json.
Reads the config's frame.expected (the frame that the model and the cameras use), door,
building.id and building.also (the campus map's buildings whose blocks the model stands in place of),
and site (true puts the landmark on the site, which finds every placement.json that says so),
and part, when only a part of the building is drawn in detail (the building's card says which part, and
that the rest keeps its estimated height), and estimated, the words for a size of the model that nothing
measures (the building's card says it is estimated); needs no LiDAR, so it runs in a fresh clone.
  python -I ../pipeline/tools/data/place.py [--config config/<name>.json]
"""
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common
cfg = common.load(common.args(__doc__).config)

F = cfg["frame"]
centre, axis = F["expected"]["centre"], F["expected"]["axis"]
to_street = [-axis[1], axis[0]]  # as tools/data/measure.py turns it
if (F.get("street_side", "west") == "west") == (to_street[0] > 0):
    to_street = [-to_street[0], -to_street[1]]


def local(x, z):
    """A point of the view frame (x, z) in local NZTM metres: x runs along minus the axis."""
    return (centre[0] - x * axis[0] + z * to_street[0], centre[1] - x * axis[1] + z * to_street[1])


to_map = common.map_projector(cfg)
c = to_map(*local(0, 0))
STEP = 100.0  # metres along each axis, to read its direction and scale on the map
px, pz = to_map(*local(STEP, 0)), to_map(*local(0, STEP))
bearing = lambda p: math.degrees(math.atan2(p[0] - c[0], p[1] - c[1])) % 360
bx, bz = bearing(px), bearing(pz)
if abs((bz - bx - 90 + 180) % 360 - 180) > 0.1:
    sys.exit(f"place: z (bearing {bz:.2f}) is not 90 deg clockwise of x ({bx:.2f}): the view frame is mirrored, "
             "and no turn puts it on the map")
door = cfg["door"]
dm = to_map(*local(door["x"], door["z"]))
site = cfg.get("site", False)
if not isinstance(site, bool):
    sys.exit(f"place: site is {site!r}: true puts the landmark on the site, false or no site leaves it off")
r3 = lambda v: round(v, 3)
placement = {
    "note": "Where the landmark stands on the campus map. Written by landmarks/pipeline/tools/data/place.py "
            "from the config's frame.expected; do not edit. Map metres: east and north of the campus origin, "
            "true north, as public/data/uoa/campus.json. In three.js (scene x east, y up, z south), put the model "
            "at (centre[0], ground at door.map, -centre[1]) and turn it by rotationY about y. It stands in place "
            "of the blocks of `building` and of the buildings in `also`.",
    "site": site,
    "building": cfg["building"]["id"],
    "also": cfg["building"].get("also", []),
    "centre": [r3(c[0]), r3(c[1])],
    "bearing": {"x": r3(bx), "z": r3(bz)},
    "rotationY": round((math.pi / 2 - math.radians(bx)) % (2 * math.pi), 6),
    "scale": round(math.dist(c, px) / STEP, 6),
    "door": {"model": [door["x"], door["z"]], "map": [r3(dm[0]), r3(dm[1])]},
}
part = cfg.get("part")
if part is not None:
    if not isinstance(part, str) or not part.strip():
        sys.exit(f"place: part is {part!r}: the words for the part drawn in detail, or no part when it is the whole building")
    placement["part"] = part
estimated = cfg.get("estimated")
if estimated is not None:
    if not isinstance(estimated, str) or not estimated.strip():
        sys.exit(f"place: estimated is {estimated!r}: the words for the size that nothing measures, or none when every size is measured")
    placement["estimated"] = estimated
dst = os.path.join(common.ROOT, "placement.json")
with open(dst, "w", encoding="utf-8", newline="\n") as f:
    json.dump(placement, f, indent=1)
    f.write("\n")
grid_x = math.degrees(math.atan2(-axis[0], -axis[1])) % 360
print(f"place: centre ({c[0]:.3f}, {c[1]:.3f}) on the map, {math.dist(c, centre):.2f} m from the frame's own "
      f"({centre[0]}, {centre[1]}); x at {bx:.3f} deg true ({grid_x:.3f} grid), z at {bz:.3f}; "
      f"door at ({dm[0]:.2f}, {dm[1]:.2f}); wrote {os.path.relpath(dst, common.ROOT)}")
