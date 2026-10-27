// Asking the public Overpass instances for a snapshot, and when to stop asking one. An area whose
// snapshot is on disk needs no request, and is read whatever follows. Closed is a verdict (AGENTS.md):
// an instance that refuses the query (401, 403) or sends it elsewhere (a redirect, which is not followed)
// is recorded at once in data/raw/overpass-closed.txt (gitignored, in the checkout that ran the fetch, as
// landmark-fetch.ts's closed.txt is), and is not asked again until a person deletes its line; so is one
// that drops the connection, once another instance answers after it (with a status, a redirect or a
// body; a timeout is no answer), which shows the fault is not this machine's network. A busy instance
// (5xx, 429, or no answer in time) is asked again in the next round, and one that answers another 4xx is
// left for the rest of that area's requests. A fault of ours is never an instance's verdict and stops the
// run with its error, since every instance would answer the same: an answer of 400 (the query is wrong)
// or a failure on this machine (a file that cannot be written). Nor is a drop that no answer follows: the
// network that failed may be this machine's.
import fs from "node:fs";
import path from "node:path";
import { HttpError, RAW_DIR } from "./snapshot.ts";

export const CLOSED_FILE = path.join(RAW_DIR, "overpass-closed.txt");

/** What a failed request to an instance says about it. */
export type Failure = "refused" | "dropped" | "busy" | "unavailable" | "ours";

/**
 * Sorts a failed request by its error. `url` is the instance's: snapshot.ts words every failure of the
 * request itself as "<url> -> <name>: <message> (<cause>)", so an error without that prefix happened on
 * this machine after the answer came (writing the snapshot down).
 */
export function failure(url: string, e: unknown): Failure {
  if (e instanceof HttpError) {
    if (e.status === 401 || e.status === 403) return "refused";
    if (e.status >= 500 || e.status === 429) return "busy";
    if (e.status === 400) return "ours";
    return "unavailable";
  }
  const m = e instanceof Error ? e.message : String(e);
  if (!m.startsWith(`${url} -> `)) return "ours";
  if (/ -> TimeoutError\b/.test(m)) return "busy";
  if (/redirect/i.test(m)) return "refused";
  return "dropped";
}

export interface OverpassDeps {
  /** The area's snapshot if it is on disk (and not to be refreshed). */
  cached: () => Buffer | undefined;
  /** One request to an instance (snapshot.ts in the script). */
  get: (url: string) => Promise<Buffer>;
  /** The instances recorded as closed, with why. */
  closed: () => Map<string, string>;
  /** Records an instance as closed. */
  close: (url: string, why: string) => void;
  wait: (ms: number) => Promise<void>;
  warn: (message: string) => void;
}

/** The part of a failure worth keeping: the status, or snapshot.ts's words after the URL. */
function why(url: string, e: unknown): string {
  if (e instanceof HttpError) return `HTTP ${e.status}`;
  const m = e instanceof Error ? e.message : String(e);
  return (m.startsWith(`${url} -> `) ? m.slice(url.length + 4) : m).replace(/\s+/g, " ");
}

/**
 * Returns the area's snapshot: from disk if it is there, else the first answer of the instances, asked
 * in order up to `rounds` times round, a minute apart.
 */
export async function askOverpass(endpoints: string[], d: OverpassDeps, rounds = 3): Promise<Buffer> {
  const disk = d.cached();
  if (disk) return disk;
  const shut = d.closed();
  const left = new Set<string>();
  const dropped = new Map<string, string>();
  // An answer from an instance makes every drop before it another instance's verdict: this machine
  // reaches Overpass. A dropped instance is not asked again in this call, so no answer is its own.
  const answered = (from: string) => {
    for (const [u, r] of dropped) {
      if (u === from || shut.has(u)) continue;
      shut.set(u, r);
      d.close(u, r);
    }
  };
  for (let round = 0; round < rounds; round++) {
    const open = endpoints.filter((u) => !shut.has(u) && !left.has(u) && !dropped.has(u));
    if (!open.length) break;
    if (round > 0) await d.wait(60_000);
    for (const url of open) {
      try {
        const buf = await d.get(url);
        answered(url);
        return buf;
      } catch (e) {
        d.warn(String(e));
        const kind = failure(url, e);
        if (kind === "ours") throw e;
        if (kind === "refused") {
          shut.set(url, why(url, e));
          d.close(url, why(url, e));
        } else if (kind === "unavailable") left.add(url);
        else if (kind === "dropped") dropped.set(url, why(url, e));
        // a status or a redirect is an answer; a timeout, busy with no status, is not
        if (e instanceof HttpError || kind === "refused") answered(url);
        await d.wait(5000);
      }
    }
  }
  const unheard = [...dropped].filter(([u]) => !shut.has(u)).map(([u, r]) => `${u} dropped the connection (${r})`);
  const closedNow = endpoints.filter((u) => shut.has(u)).map((u) => `${u} is closed (${shut.get(u)})`);
  const notes: string[] = [];
  if (unheard.length) {
    const none = unheard.length > 1 ? "none of them is" : "it is not";
    notes.push(`${unheard.join("; ")}, and no other instance answered after, so ${none} recorded as closed: is this machine online?`);
  }
  if (closedNow.length) {
    notes.push(`${closedNow.join("; ")}; delete its line in ${path.relative(process.cwd(), CLOSED_FILE)} to ask it again`);
  }
  throw new Error(`no Overpass instance answered${notes.length ? `; ${notes.join("; ")}` : ""}`);
}

/** The closed record on disk: one line per instance, "<time> <url> <why>". */
export const closedOnDisk = {
  closed: (): Map<string, string> => {
    const m = new Map<string, string>();
    if (!fs.existsSync(CLOSED_FILE)) return m;
    for (const line of fs.readFileSync(CLOSED_FILE, "utf8").split("\n")) {
      const [, url, ...reason] = line.trim().split(" ");
      if (url) m.set(url, reason.join(" "));
    }
    return m;
  },
  close: (url: string, reason: string): void => {
    fs.mkdirSync(path.dirname(CLOSED_FILE), { recursive: true });
    fs.appendFileSync(CLOSED_FILE, `${new Date().toISOString()} ${url} ${reason.replace(/\s+/g, " ")}\n`);
  },
};
