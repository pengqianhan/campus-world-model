// Polite, cache-first fetcher for raw data snapshots.
//
// Rules this module enforces (see README "Updating the data snapshot"):
//  - every URL is fetched at most once; later runs read the file on disk unless --refresh is passed
//  - at most one request per second, per process
//  - an honest User-Agent that links back to this repository
//  - every snapshot is recorded in data/sources.json with URL, fetch time, size and sha256
//
// Raw snapshots live under data/raw/ which is gitignored except for openly licensed data.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const USER_AGENT =
  "campus-world-model/0.1 (unofficial student project; https://github.com/pengqianhan/campus-world-model)";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const RAW_DIR = path.join(ROOT, "data", "raw");
const MANIFEST = path.join(ROOT, "data", "sources.json");
const MIN_INTERVAL_MS = 1100;
/** Longer than Overpass's own 180 s query limit. */
const TIMEOUT_MS = 240_000;

export interface SnapshotRecord {
  /** Path relative to data/raw, forward slashes. */
  file: string;
  url: string;
  fetchedAt: string;
  bytes: number;
  sha256: string;
  source: string;
  /** For a record of a folder of files fetched alike (one Street View panorama's tiles): how many. */
  count?: number;
}

interface Manifest {
  note: string;
  snapshots: SnapshotRecord[];
}

function readManifest(): Manifest {
  if (!fs.existsSync(MANIFEST)) {
    return {
      note: "Provenance of every raw snapshot used to build public/data. Raw files are local-only unless openly licensed.",
      snapshots: [],
    };
  }
  return JSON.parse(fs.readFileSync(MANIFEST, "utf8")) as Manifest;
}

function writeManifest(m: Manifest): void {
  m.snapshots.sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + "\n");
}

let lastRequestAt = 0;
/** Wait as if a request had just been sent: for a process that follows another one's last request. */
export function paceFromNow(): void {
  lastRequestAt = Date.now();
}
/** Waits out the interval and returns the time the request is let through. */
async function throttle(): Promise<number> {
  // A timer can fire a millisecond early: wait until the whole interval has passed.
  for (let wait = lastRequestAt + MIN_INTERVAL_MS - Date.now(); wait > 0; wait = lastRequestAt + MIN_INTERVAL_MS - Date.now()) {
    await new Promise((r) => setTimeout(r, wait));
  }
  return (lastRequestAt = Date.now());
}

export interface FetchOptions {
  /** Logical source id, e.g. "mapsindoors" or "osm". */
  source: string;
  /** File path relative to data/raw. */
  file: string;
  url: string;
  method?: "GET" | "POST";
  body?: string;
  headers?: Record<string, string>;
  /** Re-download even if the snapshot exists. */
  refresh?: boolean;
  /** The URL as logged and in errors, when `url` holds a secret (a session token). Default `url`. */
  logUrl?: string;
  /** False: cache and pace, but leave the record in data/sources.json to the caller. Default true. */
  record?: boolean;
  /** Longer for large files. Default 240 s. */
  timeoutMs?: number;
  /** Called the moment the request is let through, after the pacing. */
  onSend?: (at: Date) => void;
  /** "error": a redirect fails instead of being followed to a host nobody checked. Default "follow". */
  redirect?: RequestRedirect;
  /** Called with the answer's status and headers when it comes, before its body is read: to log a header. */
  onResponse?: (answer: { status: number; headers: Headers }) => void;
}

/** A response other than 2xx, with its status. */
export class HttpError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** What follows the last attempt's error in a failed fetch's words, before the earlier attempts'. */
export const EARLIER_ATTEMPTS = "earlier attempts:";

/**
 * How a failed fetch is worded: its name and message, then its cause's message in brackets. A name with
 * several addresses is tried at each in turn, and the attempts' errors come gathered in an AggregateError
 * with no message of its own. Node cuts every attempt but the last short after 250 ms (ETIMEDOUT) and
 * passes on from an address this machine has no route to, so the last attempt says what the host did:
 * its error comes first, then EARLIER_ATTEMPTS and the others' (scripts/lib/overpass.ts sorts by the first).
 */
export function fetchFailure(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const c = e.cause;
  if (!(c instanceof Error)) return `${e.name}: ${e.message}`;
  const each = c instanceof AggregateError && Array.isArray(c.errors) ? c.errors.map((x: unknown) => (x instanceof Error ? x.message : String(x))) : [];
  if (!each.length) return `${e.name}: ${e.message} (${c.message})`;
  const earlier = each.slice(0, -1);
  return `${e.name}: ${e.message} (${[each.at(-1), ...(earlier.length ? [`${EARLIER_ATTEMPTS} ${earlier.join("; ")}`] : []), c.message].filter(Boolean).join("; ")})`;
}

/** Returns the snapshot bytes, downloading them only if they are not on disk yet. */
export async function snapshot(opts: FetchOptions): Promise<Buffer> {
  const abs = path.join(RAW_DIR, opts.file);
  if (fs.existsSync(abs) && !opts.refresh) return fs.readFileSync(abs);

  const logUrl = opts.logUrl ?? opts.url;
  const sentAt = await throttle();
  opts.onSend?.(new Date(sentAt));
  let res: Response;
  let buf: Buffer;
  try {
    res = await fetch(opts.url, {
      method: opts.method ?? "GET",
      body: opts.body,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json, */*;q=0.5", ...opts.headers },
      redirect: opts.redirect ?? "follow",
      // A server that never answers is a failure like any other, not a wait without end.
      signal: AbortSignal.timeout(opts.timeoutMs ?? TIMEOUT_MS),
    });
    opts.onResponse?.({ status: res.status, headers: res.headers });
    buf = res.ok ? Buffer.from(await res.arrayBuffer()) : Buffer.alloc(0);
  } catch (e) {
    // The error of a failed fetch can quote the URL: give the logged one only.
    throw new Error(`${logUrl} -> ${fetchFailure(e).replaceAll(opts.url, logUrl)}`);
  }
  if (!res.ok) throw new HttpError(`${logUrl} -> HTTP ${res.status}`, res.status);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  // Written whole or not at all: a file cut short by a kill would pass for a snapshot.
  fs.writeFileSync(`${abs}.part`, buf);
  fs.renameSync(`${abs}.part`, abs);

  const file = opts.file.replaceAll("\\", "/");
  if (opts.record ?? true) {
    recordSnapshot({
      file,
      url: logUrl,
      fetchedAt: new Date().toISOString(),
      bytes: buf.length,
      sha256: createHash("sha256").update(buf).digest("hex"),
      source: opts.source,
    });
  }
  console.log(`fetched ${file} (${buf.length} B)`);
  return buf;
}

/** Adds a record to data/sources.json, in place of any earlier one for the same file. */
export function recordSnapshot(rec: SnapshotRecord): void {
  const m = readManifest();
  m.snapshots = m.snapshots.filter((s) => s.file !== rec.file);
  m.snapshots.push(rec);
  writeManifest(m);
}

export function readSnapshot(file: string): Buffer {
  return fs.readFileSync(path.join(RAW_DIR, file));
}

export function hasSnapshot(file: string): boolean {
  return fs.existsSync(path.join(RAW_DIR, file));
}

export function manifest(): SnapshotRecord[] {
  return readManifest().snapshots;
}
