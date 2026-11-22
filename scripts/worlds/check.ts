// Checks the links of every campus world in src/worlds/worlds.json (PROGRESS.md, "Decisions", A global collection
// of campus worlds: "Links"). The maintainer runs it by hand; nothing runs it on a schedule:
//   npm run worlds:check
// Each play page and each source page is asked for once, through scripts/lib/snapshot.ts (paced to one request a
// second, the project's User-Agent), fresh each time and kept in gitignored data/raw/worlds-check/, with no record
// in data/sources.json: a check is not a source. Redirects are followed by hand, a hop at a time, so that a
// sign-in page is seen and never asked for. A host in src/worlds/closed.json is not asked at all; a 401, a 403, a
// redirect to a sign-in page or a dropped connection closes its host there, once (AGENTS.md, "Closed is a
// verdict"). For each play page it says whether another site may show it in a frame (X-Frame-Options, and CSP
// frame-ancestors). It exits with 1 when a link is broken or closed, so that the maintainer can mark or remove it.
import fs from "node:fs";
import path from "node:path";
import { isSignIn } from "../research/polite.mjs";
import { HttpError, snapshot } from "../lib/snapshot.ts";
import type { World } from "../../src/worlds/worlds.ts";

const root = path.resolve(import.meta.dirname, "..", "..");
const worlds = (JSON.parse(fs.readFileSync(path.join(root, "src", "worlds", "worlds.json"), "utf8")) as { worlds: World[] }).worlds;
const closedFile = path.join(root, "src", "worlds", "closed.json");
const closed = JSON.parse(fs.readFileSync(closedFile, "utf8")) as { note: string; hosts: Record<string, { reason: string; date: string }> };
const today = new Date().toISOString().slice(0, 10);

/** What one link came to. */
type Result = { ok: true; status: number; frame?: "allowed" | "refused" } | { ok: false; why: string; verdict: boolean };

/** Whether a page's headers let another site show it in a frame. */
function framing(h: Headers): "allowed" | "refused" {
  const xfo = h.get("x-frame-options")?.toLowerCase();
  if (xfo && /deny|sameorigin/.test(xfo)) return "refused";
  const fa = /frame-ancestors([^;]*)/i.exec(h.get("content-security-policy") ?? "")?.[1]?.trim();
  if (fa !== undefined && !/(^|\s)\*(\s|$)/.test(fa)) return "refused";
  return "allowed";
}

function close(host: string, reason: string): void {
  closed.hosts[host] = { reason, date: today };
}

/** Asks for one link, a hop at a time, at most five redirects. */
async function check(id: string, kind: "play" | "source", start: string): Promise<Result> {
  let url = start;
  for (let hop = 0; hop <= 5; hop++) {
    const host = new URL(url).host;
    const verdict = closed.hosts[host];
    if (verdict) return { ok: false, why: `closed since ${verdict.date}: ${verdict.reason}`, verdict: true };
    let headers: Headers | undefined;
    let status = 0;
    try {
      await snapshot({
        source: "worlds-check",
        file: `worlds-check/${id}-${kind}-${hop}.html`,
        url,
        refresh: true,
        record: false,
        redirect: "manual",
        timeoutMs: 30_000,
        onResponse: (a) => {
          status = a.status;
          headers = a.headers;
        },
      });
      return { ok: true, status, frame: kind === "play" && headers ? framing(headers) : undefined };
    } catch (e) {
      if (e instanceof HttpError && e.status >= 300 && e.status < 400 && headers?.get("location")) {
        const next = new URL(headers.get("location")!, url).href;
        if (isSignIn(next)) {
          close(host, `redirect to a sign-in page (${new URL(next).host})`);
          return { ok: false, why: "redirects to a sign-in page", verdict: true };
        }
        url = next;
        continue;
      }
      if (e instanceof HttpError && (e.status === 401 || e.status === 403)) {
        close(host, `HTTP ${e.status}`);
        return { ok: false, why: `HTTP ${e.status}`, verdict: true };
      }
      if (e instanceof HttpError) return { ok: false, why: `HTTP ${e.status}`, verdict: false };
      // A page that is only slow is not closed: it is checked again next time.
      if (/timeout|aborted/i.test((e as Error).message)) return { ok: false, why: "no answer within 30 s", verdict: false };
      close(host, "dropped connection");
      return { ok: false, why: `dropped connection (${(e as Error).message.slice(0, 80)})`, verdict: true };
    }
  }
  return { ok: false, why: "more than five redirects", verdict: false };
}

let bad = 0;
for (const w of worlds) {
  for (const kind of ["play", "source"] as const) {
    const url = w[kind];
    if (!url) continue;
    const r = await check(w.id, kind, url);
    if (r.ok) console.log(`ok      ${w.id} ${kind}: HTTP ${r.status}${r.frame ? `, a frame ${r.frame}` : ""}`);
    else {
      bad++;
      console.log(`${r.verdict ? "closed " : "broken "} ${w.id} ${kind}: ${r.why} (${url})`);
    }
  }
}
fs.writeFileSync(closedFile, JSON.stringify(closed, null, 2) + "\n");
console.log(bad ? `\n${bad} link(s) to mark or remove in src/worlds/worlds.json.` : "\nEvery link opens.");
process.exit(bad ? 1 : 0);
