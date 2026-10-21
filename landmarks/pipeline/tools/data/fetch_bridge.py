"""The pipeline's one way out to the network. Every fetch goes as a batch to scripts/landmarks/fetch.ts,
which gives it to scripts/lib/snapshot.ts: cached in data/raw/landmarks/ (fetched at most once), one
request every 1.1 s with the project's User-Agent, logged in data/sources.json. What it lets through,
and how Street View tiles are bought, is in scripts/lib/landmark-fetch.ts and landmarks/README.md,
"Fetching". The key and the session token stay in the Node side; nothing here sees them.
"""
import json, os, shutil, subprocess, sys

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", ".."))
ENTRY = os.path.join(REPO, "scripts", "landmarks", "fetch.ts")


def run(ops, allow_fetch=False):
    """Runs the operations in one batch and returns a result for each. Street View tiles that are not
    cached are bought only with allow_fetch (and the ledger's leave); else they are counted as missing."""
    env = dict(os.environ, PY=sys.executable)  # the ledger runs on this Python
    env.pop("ALLOW_FETCH", None)
    if allow_fetch: env["ALLOW_FETCH"] = "1"
    p = subprocess.run(["node", ENTRY], input=json.dumps({"ops": ops}), stdout=subprocess.PIPE,
                       text=True, encoding="utf-8", env=env)
    if p.returncode: sys.exit(f"fetch: the batch stopped (exit {p.returncode}); see the message above")
    return json.loads(p.stdout)["results"]


def files(urls):
    """Whole public files (LiDAR, aerial): their paths in data/raw, fetched first if not there."""
    return [r["path"] for r in run([{"op": "file", "url": u} for u in urls])] if urls else []


def link(src, dst):
    """Puts a cached file at dst: a hard link (no second copy on disk), else a copy."""
    try: os.link(src, dst)
    except OSError: shutil.copyfile(src, dst)
