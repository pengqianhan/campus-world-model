// Asking the public Overpass instances for a snapshot, and when to stop asking one. Closed is a
// verdict (AGENTS.md): an endpoint that refuses (401, 403, or any other answer that is not a busy
// server's), sends the query elsewhere (a redirect, which is not followed) or drops the connection is
// recorded once in data/raw/overpass-closed.txt (gitignored, as landmark-fetch.ts's closed.txt is) and
// is not asked again, in this run or a later one, until a person deletes its line. Only a busy
// endpoint is asked again in the next round: a server error (5xx), 429, or no answer within
// snapshot.ts's timeout to a query it took.
import fs from "node:fs";
import path from "node:path";
import { HttpError, RAW_DIR } from "./snapshot.ts";

export const CLOSED_FILE = path.join(RAW_DIR, "overpass-closed.txt");

/** Whether a failed request closes its endpoint: anything but a busy server's answer or a timeout. */
export function closes(e: unknown): boolean {
  if (e instanceof HttpError) return !(e.status >= 500 || e.status === 429);
  // snapshot.ts words a failed fetch as "<url> -> <name>: <message>"; its own timeout is a TimeoutError
  return !/ -> TimeoutError\b/.test(e instanceof Error ? e.message : String(e));
}

export interface OverpassDeps {
  /** One request to an endpoint (snapshot.ts in the script). */
  get: (url: string) => Promise<Buffer>;
  /** The endpoints recorded as closed, with why. */
  closed: () => Map<string, string>;
  /** Records an endpoint as closed. */
  close: (url: string, why: string) => void;
  wait: (ms: number) => Promise<void>;
  warn: (message: string) => void;
}

/**
 * Asks the endpoints in order, up to `rounds` times round, a minute apart, and returns the first
 * answer. An endpoint that closes is recorded and left out of every later round.
 */
export async function askOverpass(endpoints: string[], d: OverpassDeps, rounds = 3): Promise<Buffer> {
  const shut = d.closed();
  for (let round = 0; round < rounds; round++) {
    const open = endpoints.filter((u) => !shut.has(u));
    if (!open.length) break;
    if (round > 0) await d.wait(60_000);
    for (const url of open) {
      try {
        return await d.get(url);
      } catch (e) {
        d.warn(String(e));
        if (closes(e)) {
          const why = e instanceof Error ? e.message : String(e);
          shut.set(url, why);
          d.close(url, why);
        }
        await d.wait(5000);
      }
    }
  }
  const closedNow = endpoints.filter((u) => shut.has(u)).map((u) => `${u} is closed (${shut.get(u)})`);
  throw new Error(`no Overpass endpoint answered${closedNow.length ? `; ${closedNow.join("; ")}` : ""}`);
}

/** The closed record on disk: one line per endpoint, "<time> <url> <why>". */
export const closedOnDisk = {
  closed: (): Map<string, string> => {
    const m = new Map<string, string>();
    if (!fs.existsSync(CLOSED_FILE)) return m;
    for (const line of fs.readFileSync(CLOSED_FILE, "utf8").split("\n")) {
      const [, url, ...why] = line.trim().split(" ");
      if (url) m.set(url, why.join(" "));
    }
    return m;
  },
  close: (url: string, why: string): void => {
    fs.mkdirSync(path.dirname(CLOSED_FILE), { recursive: true });
    fs.appendFileSync(CLOSED_FILE, `${new Date().toISOString()} ${url} ${why.replace(/\s+/g, " ")}\n`);
  },
};
