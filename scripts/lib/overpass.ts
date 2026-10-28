// Asking the public Overpass instances for a snapshot, and when to stop asking one. An area whose
// snapshot is on disk needs no request, and is read whatever follows. Closed is a verdict (AGENTS.md):
// an instance that refuses the query (401, 403) or sends it elsewhere (a redirect, which is not followed)
// is recorded at once in data/raw/overpass-closed.txt (gitignored, in the checkout that ran the fetch, as
// landmark-fetch.ts's closed.txt is), and is not asked again until a person deletes its line; so is one
// that drops the connection (refuses it, resets it or closes it: the errors that show the host's answer),
// once another instance answers after it with a status, a redirect or a body. Not a verdict, and asked
// again in the next round: a busy instance (5xx, 429, or no answer in time, a connection not made in time
// included), and any other failure, which does not show the host's answer: a name not resolved, no route
// to it, an error on this machine (no local port, a firewall, a certificate it does not trust), which is
// how a network failing on this side shows. One that answers another 4xx is left for the rest of that
// area's requests. A fault of ours stops the run with
// its error, since every instance would answer the same: an answer of 400 (the query is wrong) or a
// failure on this machine after the answer came (a file that cannot be written); either is an answer, so
// a drop before it is recorded first. What this cannot tell apart: a refusal, a reset or a close made on this side
// (by a local firewall, say) that another instance's answer follows is recorded as the host's; delete its
// line then.
import fs from "node:fs";
import path from "node:path";
import { HttpError, RAW_DIR } from "./snapshot.ts";

export const CLOSED_FILE = path.join(RAW_DIR, "overpass-closed.txt");

/** What a failed request to an instance says about it. */
export type Failure = "refused" | "dropped" | "busy" | "offline" | "unavailable" | "ours";

/**
 * Sorts a failed request by its error. `url` is the instance's: snapshot.ts words every failure of the
 * request itself as "<url> -> <name>: <message> (<cause>)", so an error without that prefix happened on
 * this machine after the answer came (writing the snapshot down). Of the request's own failures, a timeout
 * (the request's or the connection's) is busy; a redirect, not followed, is a refusal; the errors that show
 * the host's answer (a refused connection, a reset, a socket the other side closed, a body cut short) are a
 * drop; and any other ("offline") does not show it: a name not resolved, no route, an error on this machine,
 * an alert during the TLS handshake (a middlebox can send one as well as the host; after the handshake the
 * host's alert reads as a closed socket, a drop), a malformed answer. A name tried
 * at several addresses comes with each attempt's error (`attempts`, snapshot.ts): it is a drop if the host
 * answered so at any address; failing that, busy if the last attempt timed out (Node cuts every attempt but
 * the last short after 250 ms, so only the last one's timeout is the host's silence), else offline.
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
  const attempts = (e as { attempts?: unknown }).attempts;
  if (Array.isArray(attempts) && attempts.length) {
    const told = attempts.map(String);
    if (told.some((a) => DROPPED.test(a))) return "dropped";
    return TIMEOUT.test(told.at(-1)!) ? "busy" : "offline";
  }
  const said = m.slice(url.length + 4);
  if (TIMEOUT.test(said)) return "busy";
  if (/\bunexpected redirect\b/.test(said)) return "refused";
  if (DROPPED.test(said)) return "dropped";
  return "offline";
}

/** No answer in time: the request's own timeout, or a connection not made in time. */
const TIMEOUT = /^TimeoutError\b|\bConnect Timeout Error\b|\bETIMEDOUT\b/;
/** The host's answer that drops the connection: it refused it, reset it or closed the socket, or cut its body
 * short (undici's words for that when the answer is not kept alive, always after "terminated": the body's
 * length, a chunked body's end; the same length words after "fetch failed" are a malformed header, not a cut). */
const DROPPED = /\b(ECONNREFUSED|ECONNRESET|EPIPE)\b|other side closed|socket hang up|socket disconnected|terminated \(Response body length does not match content-length header\)|terminated \(.*Invalid EOF state/;

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
  const offline = new Map<string, string>();
  // An answer from an instance makes every drop before it the dropped instance's verdict. A dropped
  // instance is not asked again in this call, so no answer is its own.
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
        offline.delete(url);
        if (kind === "ours") {
          // a 400 is an answer, and so is one this machine could not write down
          answered(url);
          throw e;
        }
        if (kind === "refused") {
          shut.set(url, why(url, e));
          d.close(url, why(url, e));
        } else if (kind === "unavailable") left.add(url);
        else if (kind === "dropped") dropped.set(url, why(url, e));
        else if (kind === "offline") offline.set(url, why(url, e));
        // a status or a redirect is an answer; a timeout, or a host this machine did not reach, is not
        if (e instanceof HttpError || kind === "refused") answered(url);
        await d.wait(5000);
      }
    }
  }
  const notes: string[] = [];
  if (offline.size) {
    const unreached = [...offline].map(([u, r]) => `${u} failed with no answer that shows the host's (${r})`);
    notes.push(`${unreached.join("; ")}: is this machine online, or something on it in the way?`);
  }
  const unheard = [...dropped].filter(([u]) => !shut.has(u)).map(([u, r]) => `${u} dropped the connection (${r})`);
  if (unheard.length) {
    const none = unheard.length > 1 ? "none of them is" : "it is not";
    notes.push(`${unheard.join("; ")}, and no other instance answered after, so ${none} recorded as closed`);
  }
  const closedNow = endpoints.filter((u) => shut.has(u)).map((u) => `${u} is closed (${shut.get(u)})`);
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
