// The landmark pipeline's way out to the network (landmarks/README.md, "Fetching"; PROGRESS.md,
// "Decisions": all network fetching goes through snapshot.ts). The pipeline's Python stages give
// their fetches to scripts/landmarks/fetch.ts as a batch of JSON operations; each fetch goes to
// snapshot(), which caches it in data/raw/landmarks/, sends at most one request every 1.1 s with the
// project's User-Agent, and logs it in data/sources.json. Only these are let through:
//  - whole files from the two public LINZ buckets the landmarks are measured from (LiDAR, aerial);
//  - the Map Tiles API's Street View calls: createSession, panoIds and metadata, which are free, and
//    tiles, which are billed. A tile is bought only with ALLOW_FETCH=1, after the ledger
//    ($GMAPS_BUDGET check N) allows the N tiles that are not cached. Tiles are then added to the
//    ledger before they are sent, up to TILE_CHUNK at a time ($GMAPS_BUDGET add k): a batch stopped
//    part way, even killed, has counted too many, never too few.
// No redirect is followed. The key goes in a request header, never in a URL. The session token is
// written as <session> in every logged URL, and both are taken out of every error message.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { type FetchOptions, HttpError, RAW_DIR, hasSnapshot, manifest, readSnapshot, recordSnapshot, snapshot } from "./snapshot.ts";

/** Whole files, by URL prefix: the source each is logged under and its folder in data/raw. */
export const FILE_SOURCES = [
  {
    prefix: "https://opentopography.s3.sdsc.edu/pc-bulk/NZ24_Auckland/",
    source: "linz-lidar",
    dir: "landmarks/lidar/NZ24_Auckland",
  },
  {
    prefix: "https://nz-imagery.s3-ap-southeast-2.amazonaws.com/auckland/auckland-central_2023_0.06m/rgb/2193/",
    source: "linz-aerial",
    dir: "landmarks/aerial/auckland-central_2023_0.06m",
  },
];
export const MAP_TILES = "https://tile.googleapis.com/v1/";
/** The Map Tiles API paths let through. Thumbnails, 2D and 3D tiles never are. */
const STREET_VIEW_PATHS = [/^createSession$/, /^streetview\/panoIds$/, /^streetview\/metadata$/, /^streetview\/tiles\/\d+\/\d+\/\d+$/];
/** A file name or a panorama id: no path separators, no leading dot. */
const NAME = /^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/;
const SV = "landmarks/streetview";
const SESSION_FILE = `${SV}/session.json`;
/** Large LiDAR and aerial files take longer than snapshot()'s default timeout. */
const FILE_TIMEOUT_MS = 30 * 60_000;
/** Tiles added to the ledger at a time, before they are sent. */
export const TILE_CHUNK = 25;
/** Tries for a tile that fails with a 5xx, a timeout or a dropped connection, as the old tool did. */
const TILE_TRIES = 3;

/** The source and data/raw file of a URL the pipeline may fetch. Throws for any other URL. */
export function allowed(url: string): { source: string; file?: string } {
  let u: URL | undefined;
  try {
    u = new URL(url);
  } catch {}
  // A URL that does not read back as written (dot segments, escapes, a user name) is refused.
  if (u && u.href === url && !u.hash) {
    for (const f of FILE_SOURCES) {
      const name = url.slice(f.prefix.length);
      if (url.startsWith(f.prefix) && NAME.test(name) && !u.search) return { source: f.source, file: `${f.dir}/${name}` };
    }
    const rest = u.pathname.slice("/v1/".length);
    if (url.startsWith(MAP_TILES) && STREET_VIEW_PATHS.some((re) => re.test(rest))) {
      return { source: "streetview" };
    }
  }
  throw new Error(`not a host or path the landmark pipeline fetches: ${redact(url)}`);
}

const secrets: { value: string; as: string }[] = [];
/** The text with the key and the session token taken out. */
export function redact(text: string): string {
  let t = text.replace(/([?&]key=)[^&\s"']*/g, "$1<key>").replace(/([?&]session=)[^&\s"']*/g, "$1<session>");
  for (const s of secrets) t = t.replaceAll(s.value, s.as);
  return t;
}
function secret(value: string, as: string): string {
  if (value && !secrets.some((s) => s.value === value)) secrets.push({ value, as });
  return value;
}

/** Read at the moment of a request: $GOOGLE_MAPS_KEY, or ~/.gmaps_key (the bare key, or NAME=key). */
function apiKey(): string {
  let key = process.env.GOOGLE_MAPS_KEY ?? "";
  if (!key) {
    const file = path.join(os.homedir(), ".gmaps_key");
    if (!fs.existsSync(file)) throw new Error("no Google Maps key: set GOOGLE_MAPS_KEY or put it in ~/.gmaps_key");
    const line = fs.readFileSync(file, "utf8").trim();
    key = line.slice(line.indexOf("=") + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return secret(key, "<key>");
}

/** What a batch needs from outside; the tests give their own. */
export interface Deps {
  /** ALLOW_FETCH=1: tiles that are not cached may be bought. */
  allowFetch: boolean;
  has: (file: string) => boolean;
  read: (file: string) => Buffer;
  get: (o: FetchOptions) => Promise<Buffer>;
  /** Runs the ledger: true if it allows `check n`, or recorded `add n`. */
  ledger: (verb: "check" | "add", n: number) => boolean;
  /** One record in data/sources.json for a panorama's tiles. */
  recordTiles: (pano: string) => void;
}

/** The interpreter and script of the ledger, as Windows wants them when given as /c/... by Git Bash. */
function native(p: string): string {
  return process.platform === "win32" ? p.replace(/^\/([a-zA-Z])\//, "$1:/") : p;
}

export function runLedger(verb: "check" | "add", n: number): boolean {
  const script = process.env.GMAPS_BUDGET;
  if (!script) throw new Error("GMAPS_BUDGET is not set: the path of the Street View ledger script (check N, add X)");
  const r = spawnSync(native(process.env.PY ?? "python3"), ["-I", native(script), verb, String(n)], { encoding: "utf8" });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  if (out) console.error(`ledger ${verb} ${n}: ${out}`);
  if (r.error) throw new Error(`the ledger did not run: ${r.error.message}`);
  return r.status === 0;
}

const REQUEST_LOG = path.join(RAW_DIR, "landmarks", "requests.log");
function logSend(source: string, url: string) {
  return (at: Date) => {
    fs.mkdirSync(path.dirname(REQUEST_LOG), { recursive: true });
    fs.appendFileSync(REQUEST_LOG, `${at.toISOString()} ${source} ${url}\n`);
  };
}

export const defaultDeps = (): Deps => ({
  allowFetch: process.env.ALLOW_FETCH === "1",
  has: hasSnapshot,
  read: readSnapshot,
  get: (o) => {
    allowed(o.url);
    // A redirect would take the request, and the key's header, to a host allowed() never saw.
    return snapshot({ ...o, redirect: "error", onSend: logSend(o.source, o.logUrl ?? o.url) });
  },
  ledger: runLedger,
  recordTiles,
});

/**
 * One record for all of a panorama's cached tiles, in place of one per tile: their count, total
 * size, the sha256 of the list of "<file> <sha256>" lines sorted by file name, and the time the
 * newest came. Left as it is when the tiles are the same, so it can be called on every batch: a
 * batch that was killed before it recorded its tiles is recorded by the next one.
 */
export function recordTiles(pano: string): void {
  const dir = path.join(RAW_DIR, SV, "tiles", pano);
  if (!fs.existsSync(dir)) return;
  const names = fs.readdirSync(dir).filter((n) => n.endsWith(".jpg")).sort();
  if (!names.length) return;
  const all = createHash("sha256");
  let bytes = 0;
  let newest = 0;
  for (const n of names) {
    const b = fs.readFileSync(path.join(dir, n));
    bytes += b.length;
    newest = Math.max(newest, fs.statSync(path.join(dir, n)).mtimeMs);
    all.update(`${n} ${createHash("sha256").update(b).digest("hex")}\n`);
  }
  const file = `${SV}/tiles/${pano}`;
  const sha256 = all.digest("hex");
  if (manifest().some((s) => s.file === file && s.sha256 === sha256 && s.count === names.length)) return;
  recordSnapshot({
    file,
    url: `${MAP_TILES}streetview/tiles/{zoom}/{x}/{y}?session=<session>&panoId=${pano}`,
    fetchedAt: new Date(newest).toISOString(),
    bytes,
    sha256,
    source: "streetview",
    count: names.length,
  });
}

export type Op =
  | { op: "file"; url: string }
  | { op: "panoIds"; locations: { lat: number; lng: number }[]; radius: number }
  | { op: "metadata"; panos: string[] }
  | { op: "tiles"; tiles: { pano: string; zoom: number; x: number; y: number }[] };

function panoId(p: string): string {
  if (!NAME.test(p)) throw new Error(`not a panorama id: ${p}`);
  return p;
}

/** A batch of operations, in order, sharing one Street View session. */
export async function runBatch(ops: Op[], d: Deps = defaultDeps()): Promise<unknown[]> {
  let session: string | undefined;
  const headers = () => ({ "X-Goog-Api-Key": apiKey(), "Content-Type": "application/json" });
  // Kept while it has more than ten minutes to run, as Google asks: one session, not one a run.
  async function getSession(): Promise<string> {
    if (session) return session;
    if (d.has(SESSION_FILE)) {
      const s = JSON.parse(d.read(SESSION_FILE).toString("utf8")) as { session: string; expiry: string };
      if (Number(s.expiry) * 1000 > Date.now() + 10 * 60_000) return (session = secret(s.session, "<session>"));
    }
    const buf = await d.get({
      source: "streetview",
      file: SESSION_FILE,
      url: `${MAP_TILES}createSession`,
      method: "POST",
      body: JSON.stringify({ mapType: "streetview", language: "en-US", region: "NZ" }),
      headers: headers(),
      refresh: true,
    });
    const s = JSON.parse(buf.toString("utf8")) as { session?: string };
    if (!s.session) throw new Error("createSession gave no session");
    return (session = secret(s.session, "<session>"));
  }

  const results: unknown[] = [];
  for (const o of ops) {
    if (o.op === "file") {
      const { source, file } = allowed(o.url);
      if (!file) throw new Error(`not a file: ${redact(o.url)}`);
      const sent = !d.has(file);
      if (sent) await d.get({ source, file, url: o.url, timeoutMs: FILE_TIMEOUT_MS });
      results.push({ path: path.join(RAW_DIR, file), sent: Number(sent) });
    } else if (o.op === "panoIds") {
      const body = JSON.stringify({ locations: o.locations, radius: o.radius });
      const file = `${SV}/panoIds/${createHash("sha256").update(body).digest("hex").slice(0, 16)}.json`;
      const sent = !d.has(file);
      const url = sent ? `${MAP_TILES}streetview/panoIds?session=${await getSession()}` : "";
      const buf = sent
        ? await d.get({ source: "streetview", file, url, logUrl: redact(url), method: "POST", body, headers: headers() })
        : d.read(file);
      results.push({ panoIds: (JSON.parse(buf.toString("utf8")) as { panoIds?: string[] }).panoIds ?? [], sent: Number(sent) });
    } else if (o.op === "metadata") {
      const metadata: unknown[] = [];
      let sent = 0;
      for (const p of o.panos.map(panoId)) {
        const file = `${SV}/metadata/${p}.json`;
        if (d.has(file)) {
          metadata.push(JSON.parse(d.read(file).toString("utf8")));
          continue;
        }
        const url = `${MAP_TILES}streetview/metadata?session=${await getSession()}&panoId=${p}`;
        sent++;
        try {
          metadata.push(JSON.parse((await d.get({ source: "streetview", file, url, logUrl: redact(url), headers: headers() })).toString("utf8")));
        } catch (e) {
          // A panorama Google no longer has is left out, as before; any other failure stops the batch.
          if (!(e instanceof HttpError && e.status === 404)) throw e;
          console.error(`WARNING: no metadata for panorama ${p} (HTTP 404): left out`);
          metadata.push({ panoId: p });
        }
      }
      results.push({ metadata, sent });
    } else if (o.op === "tiles") {
      const want = o.tiles.map((t) => ({ ...t, file: `${SV}/tiles/${panoId(t.pano)}/${t.zoom}_${t.x}_${t.y}.jpg` }));
      for (const t of want) if (![t.zoom, t.x, t.y].every((v) => Number.isInteger(v) && v >= 0)) throw new Error(`not a tile: ${t.file}`);
      // Tiles a killed batch bought but did not record are recorded now.
      for (const p of new Set(want.map((t) => t.pano))) d.recordTiles(p);
      const missing = [...new Map(want.filter((t) => !d.has(t.file)).map((t) => [t.file, t])).values()];
      let sent = 0;
      let counted = 0;
      if (missing.length && d.allowFetch) {
        if (!d.ledger("check", missing.length)) {
          throw new Error(`the ledger does not allow ${missing.length} more tiles: none bought`);
        }
        // Into the ledger before it goes out, TILE_CHUNK at a time.
        const count = (left: number) => {
          if (sent < counted) return;
          const k = Math.min(TILE_CHUNK, Math.max(1, left));
          if (!d.ledger("check", k)) throw new Error(`the ledger does not allow ${k} more tiles: stopped after ${sent}`);
          if (!d.ledger("add", k)) throw new Error(`the ledger did not record ${k} tiles: stopped after ${sent}`);
          counted += k;
        };
        let last: string | undefined;
        try {
          for (const [i, t] of missing.entries()) {
            if (last && last !== t.pano) d.recordTiles(last);
            last = t.pano;
            const url = `${MAP_TILES}streetview/tiles/${t.zoom}/${t.x}/${t.y}?session=${await getSession()}&panoId=${t.pano}`;
            for (let tries = 1; ; tries++) {
              count(missing.length - i);
              sent++;
              try {
                await d.get({ source: "streetview", file: t.file, url, logUrl: redact(url), headers: headers(), record: false });
                break;
              } catch (e) {
                // A refusal (4xx) stops the batch: closed is a verdict, and a 404 can mean the API is
                // off. A 5xx, a timeout or a dropped connection is tried again, then left black.
                if (e instanceof HttpError && e.status < 500) throw e;
                console.error(`WARNING: ${redact(e instanceof Error ? e.message : String(e))} (try ${tries} of ${TILE_TRIES})`);
                if (tries === TILE_TRIES) break;
              }
            }
          }
        } finally {
          if (last) d.recordTiles(last);
          if (counted > sent) console.error(`the ledger counts ${counted - sent} tiles more than were sent (counted before sending)`);
        }
      } else if (missing.length) {
        console.error(`${missing.length} Street View tiles are not cached; ALLOW_FETCH=1 buys them (billed, through the ledger)`);
      }
      results.push({
        paths: want.map((t) => (d.has(t.file) ? path.join(RAW_DIR, t.file) : null)),
        missing: new Set(want.filter((t) => !d.has(t.file)).map((t) => t.file)).size,
        sent,
        counted,
      });
    } else {
      throw new Error(`unknown operation ${JSON.stringify((o as { op?: unknown }).op)}`);
    }
  }
  return results;
}

/** A lock older than this is taken to be left by a batch that died, even if its pid is in use again. */
const LOCK_STALE_MS = 12 * 3600_000;

/** One batch at a time: a second one would break the pacing and the manifest. */
export function takeLock(): () => void {
  const lock = path.join(RAW_DIR, "landmarks", ".fetch.lock");
  const mine = `${process.pid} ${Date.now()}`;
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  for (let i = 0; i < 3; i++) {
    try {
      fs.writeFileSync(lock, mine, { flag: "wx" });
      return () => {
        // Only our own: a lock another batch took over is left alone.
        if (fs.existsSync(lock) && fs.readFileSync(lock, "utf8") === mine) fs.rmSync(lock, { force: true });
      };
    } catch {
      let held = "";
      try {
        held = fs.readFileSync(lock, "utf8");
      } catch {
        continue; // gone in between: try again
      }
      const [pid, since] = held.split(" ").map(Number);
      let alive = false;
      try {
        process.kill(pid!, 0);
        alive = true;
      } catch {}
      if (alive && Date.now() - (since ?? 0) < LOCK_STALE_MS) {
        throw new Error(`another landmark fetch is running (pid ${pid}); if not, delete data/raw/landmarks/.fetch.lock`);
      }
      // Left by a batch that died. Moved aside, not deleted: of two batches that both find it, one
      // moves it and the other fails to, so neither removes a lock the other has just taken.
      try {
        fs.renameSync(lock, `${lock}.${process.pid}.stale`);
        fs.rmSync(`${lock}.${process.pid}.stale`, { force: true });
      } catch {}
    }
  }
  throw new Error("could not take the landmark fetch lock");
}
