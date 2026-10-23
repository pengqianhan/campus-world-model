// Looking at a site counts as fetching from it (AGENTS.md, "Snapshot once" and "Closed is a
// verdict"; the porting skill's RECON.md). A headless browser opened for research goes through
// this file. Launch it with politeLaunch() and open its page with politePage(). The browser can
// send requests only to the hosts being studied, at most one request every PACE_MS. A request to
// a host waits for the answer to the request before it on that host, for at most ANSWER_WAIT_MS.
// Service workers are blocked. The browser's own fetch of a page's icon (its <link rel="icon">, or
// else /favicon.ico) is blocked: the full Chromium build makes it by itself, and the headless shell
// never did. Every request that this file sees is logged, sent or blocked. The limits below say
// what it does not see.
//
// The gate is the DevTools Fetch domain on the browser's own session, not page.route(). Playwright
// routes only the first request of a redirect chain and lets the browser follow each 3xx by itself,
// so a hop escaped the pace, the host check and the log. route.fetch() with maxRedirects 0 does not
// help: the browser still follows the fulfilled 3xx without the route. It also drops the Sec-Fetch
// headers that the browser sends. The Fetch domain stops each hop of a redirect, and the requests
// of popups, frames and workers. The browser itself sends each request, with its own headers and
// cookies. The Fetch domain works in Chromium only. It sees every request in the browser, so a
// browser has one polite page at a time. The closed hosts and the pace belong to the browser, so
// they hold from one polite page to the next. When the page's context closes, or the browser's
// close(), the requests still waiting their turn are dropped ("gone"), and none of them asks for
// anything more.
//
// A host is closed after a 401, after a 403, after a redirect to a sign-in page, after a request for
// a sign-in page, or after a dropped connection, its robots.txt included. Each later request to it
// is blocked with the reason "closed: <why>". The sign-in page itself is not asked for.
//
// robots.txt. Before the first request that it lets through to a scheme, host and port, the gate
// asks for robots.txt there, and keeps the answer for the life of the browser, beside the closed
// hosts and the pace: a second polite page does not ask again. politePage() asks for the robots.txt
// of `url` before it returns, and if robots.txt disallows `url`, or its host is closed, it says
// so (`blocked`, and a warning) and the page's request for `url` is blocked. The browser itself
// asks: each polite context has a robots page, a page of its own that only ever goes to a
// robots.txt. The gate lets that one request through in its turn at the pace, logs it with the
// type "robots" and the reason "robots", and reads the answer at the response stage: the status,
// the Location, and at most ROBOTS_MAX_BYTES of the body. Then it ends the request, so the robots
// page shows nothing and loads nothing, and the browser follows no redirect by itself. The request
// has the browser's own User-Agent, cookies, TLS and proxy.
// robots.mjs reads the file as RFC 9309 says, and says where it reads further. It takes the
// strictest reading of the groups: a path is allowed only if every group that applies allows it.
// Those are the "*" groups, and each group whose token is part of one of our names, ignoring case:
// the product names of the browser's own User-Agent (HeadlessChrome, Chrome) and Anthropic's agents
// (ClaudeBot, Claude-Web, Claude-User, Claude-SearchBot, anthropic-ai), because Claude drives this
// browser. Each request, of any type, from any page, frame, popup or worker, that robots.txt
// disallows is blocked with the reason "robots: <the rule as written>", and " (User-agent:
// <token>)" after it when the rule is not of a "*" group. A 404 or another 4xx allows everything.
// A 401, a 403, a sign-in redirect or a dropped connection closes the host, as above. A 429, a
// 5xx or no answer in ANSWER_WAIT_MS leaves the whole host alone for the life of the browser,
// every scheme and port of it ("robots: unreachable (<why>)"). A redirect of robots.txt is
// followed a hop at a time at the pace, for at most ROBOTS_REDIRECTS hops: within its host at
// once; to another host only if that host is allowed and not closed, and that host's own
// robots.txt, asked for first, allows the target. A target that is that host's /robots.txt gives
// its answer to both. Anything else makes the robots.txt "unreachable". An agent still quotes
// robots.txt in its report (RECON.md asks for that), but no longer decides by hand which paths to
// leave alone.
//
// politeLaunch() starts the full Chromium build (channel "chromium") on a new profile whose
// "Preload pages" setting is off (net.network_prediction_options = 2). Speculation rules then
// prefetch and prerender nothing. Playwright's default headless shell does not read that setting.
// It also passes POLITE_ARGS. politePage() removes WebRTC (RTCPeerConnection) and WebTransport
// from every page and frame: neither goes through the Fetch domain.
//
// Limits: what still goes out without this file.
// - In a browser that politeLaunch() did not start, speculation rules prefetch and prerender
//   outside the Fetch domain, to any host, at once and with no log.
// - A WebSocket does not go through the Fetch domain. It is not stopped, not logged, and not
//   checked against robots.txt.
// - A worker still has WebTransport: in Chromium 156 a dedicated worker can make one, and its QUIC
//   packets go out over UDP outside the Fetch domain, to any host, with no log.
// - After a dropped keep-alive connection, Chromium sends the same request again below the Fetch
//   domain, at once. The log has one row; the server gets the request twice.
// - A request that is sent and then gets no answer holds its host, and the queue, for up to
//   ANSWER_WAIT_MS. The page aborting it does not free the host. A navigation away from a page
//   with a slow request in flight waits too: the old page aborts it only after the navigation goes.
// - robots.txt is not read again in the life of a browser (RFC 9309 allows a day), and the gate
//   does not keep to Crawl-delay, which RFC 9309 does not define.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseRobots, robotsMatch } from "./robots.mjs";

export { ANTHROPIC_AGENTS, parseRobots, robotsAllows, robotsMatch } from "./robots.mjs";

export const PACE_MS = 1100;

/** How long a request to a host waits for the answer to the request before it. */
export const ANSWER_WAIT_MS = 10_000;

/** How many redirects of robots.txt the gate follows (RFC 9309, 2.3.1.2: at least five). */
export const ROBOTS_REDIRECTS = 5;

/** How much of a robots.txt the gate reads and parses (RFC 9309, 2.5: at least 500 KiB). */
export const ROBOTS_MAX_BYTES = 500 * 1024;

/** Launch arguments for a research browser: no WebRTC UDP except through a proxy. */
export const POLITE_ARGS = ["--force-webrtc-ip-handling-policy=disable_non_proxied_udp"];

/** Errors from the network that are not a verdict on the host: the page itself let go of the request. */
const NOT_A_VERDICT = new Set(["Aborted", "BlockedByClient", "BlockedByResponse"]);

/** Run in every page and frame before its own scripts: no WebRTC, no WebTransport. Workers keep WebTransport (see the limits). */
const NO_WEBRTC_WEBTRANSPORT = `for (const name of ["RTCPeerConnection", "webkitRTCPeerConnection", "WebTransport"]) delete globalThis[name];`;

/** The browsers that politeLaunch() started. */
const launched = new WeakSet();

/**
 * A research browser: the full Chromium build on a new profile with "Preload pages" off, launched
 * with POLITE_ARGS and `args`. `options` go to Playwright's launchPersistentContext. Use `browser`
 * with politePage(), and call `close()` at the end: it closes the browser and deletes the profile.
 */
export async function politeLaunch({ args = [], ...options } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "polite-profile-"));
  const remove = () => {
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
    } catch {}
  };
  let context;
  try {
    fs.mkdirSync(path.join(dir, "Default"));
    fs.writeFileSync(path.join(dir, "Default", "Preferences"), JSON.stringify({ net: { network_prediction_options: 2 } }));
    context = await chromium.launchPersistentContext(dir, { channel: "chromium", ...options, args: [...POLITE_ARGS, ...args] });
  } catch (err) {
    remove();
    throw err;
  }
  const browser = context.browser();
  launched.add(browser);
  const close = async () => {
    // The requests still waiting their turn go nowhere.
    stateOf(browser).shut = true;
    await context.close();
    remove();
  };
  return { browser, close };
}

/** The state of each browser: its closed hosts, its robots.txt answers and its pace hold from one polite page to the next. */
const states = new WeakMap();
function stateOf(browser) {
  let state = states.get(browser);
  if (!state) {
    state = {
      busy: false,
      shut: false,
      closed: new Map(),
      robots: new Map(),
      /** Hosts whose robots.txt was unreachable, with why: the whole host is left alone. */
      unreachable: new Map(),
      last: -Infinity,
      turn: Promise.resolve(),
      waiting: new Map(),
      userAgent: "",
    };
    states.set(browser, state);
  }
  return state;
}

/**
 * A page in a fresh context of `browser` (Chromium, best from politeLaunch()) that keeps to the
 * rules above. `url` names the host being studied; `allow` adds more hosts; `types`, if given, lets
 * only those resource types through (["document"] to read one page and nothing it loads). Returns
 * the page, its context, the log, the hosts closed so far with the reason for each (`closed`, a
 * Map from host to reason), the robots.txt answers so far (`robots`, a Map from origin to answer;
 * both are shared by every polite page of this browser), and `blocked`: why the gate will block
 * `url` itself, if it will ("robots: Disallow: /", "closed: 403"). The context also holds the
 * robots page, which only ever asks for robots.txt.
 */
export async function politePage(browser, { url, allow = [], types, viewport } = {}) {
  const state = stateOf(browser);
  if (state.busy) throw new Error("polite.mjs: this browser has a polite page open; close its context or launch another browser");
  if (!launched.has(browser)) console.warn("polite.mjs: this browser was not started by politeLaunch(), so speculation rules can prefetch outside the gate");
  state.busy = true;
  try {
    return await open(browser, state, { url, allow, types, viewport });
  } catch (err) {
    state.busy = false;
    throw err;
  }
}

async function open(browser, state, { url, allow, types, viewport }) {
  const hosts = new Set([new URL(url).host, ...allow]);
  // The Fetch domain calls a fetch() request "xhr", so "fetch" lets those through.
  const wanted = types && new Set(types.flatMap((t) => (t === "fetch" ? ["fetch", "xhr"] : [t])));
  const log = [];
  const { closed } = state;
  /** The log row of each request sent, by its interception id, to add its status and to name the hop it led to. */
  const sentRows = new Map();
  const cdp = await browser.newBrowserCDPSession();
  // A request or a page can go away while it waits; then the command fails, and that is the answer.
  const send = (method, params) => cdp.send(method, params).then(() => true, () => false);
  const block = (e, row, reason) => {
    log.push({ at: new Date().toISOString(), ...row, sent: false, reason });
    return send("Fetch.failRequest", { requestId: e.requestId, errorReason: "BlockedByClient" });
  };
  const close = (host, reason) => closeHost(state, host, reason);
  /** Set when the context closes: the requests still waiting their turn then do nothing more. */
  let closedContext = false;
  const gone = () => closedContext || state.shut;

  // The robots page and the robots.txt request it is making now.
  const robots = { page: undefined, frameId: undefined, job: undefined, ids: new Set() };

  /**
   * Ask for one robots.txt hop through the robots page. Call it in a turn, after the pace. Resolves
   * to { status, location, body }, { error }, or { gone }. Never rejects.
   */
  const fetchHop = (hopUrl, from) =>
    new Promise((resolve) => {
      const job = { url: hopUrl, from, requestId: undefined, row: undefined, done: false };
      const timer = setTimeout(() => {
        if (job.row) job.row.error = `no answer in ${ANSWER_WAIT_MS / 1000} s`;
        job.finish({ timeout: true });
        robots.page?.goto("about:blank").catch(() => {});
      }, ANSWER_WAIT_MS);
      job.finish = (result) => {
        if (job.done) return;
        job.done = true;
        clearTimeout(timer);
        if (robots.job === job) robots.job = undefined;
        resolve(result);
      };
      if (gone() || !robots.page) return job.finish({ gone: true });
      robots.job = job;
      robots.page.goto(hopUrl).catch(() => {});
    });

  /** The robots request, at the request stage: it goes now, as its turn and its pace came before it. */
  const onRobotsRequest = async (e, row) => {
    const job = robots.job;
    if (!job || job.requestId || row.type !== "document" || row.url !== job.url) return block(e, row, "robots page");
    job.requestId = e.requestId;
    robots.ids.add(e.requestId);
    const at = Date.now();
    job.row = { at: new Date(at).toISOString(), type: "robots", method: row.method, url: row.url, ...(job.from ? { from: job.from } : {}), sent: true, reason: "robots" };
    const agent = Object.entries(e.request.headers ?? {}).find(([name]) => name.toLowerCase() === "user-agent")?.[1];
    if (agent) state.userAgent = agent;
    if (!(await send("Fetch.continueRequest", { requestId: e.requestId }))) {
      log.push({ ...job.row, sent: false, reason: "gone" });
      return job.finish({ gone: true });
    }
    state.last = at;
    log.push(job.row);
  };

  /** The robots request, at the response stage: read the answer, then end the request. */
  const onRobotsResponse = async (e) => {
    robots.ids.delete(e.requestId);
    const job = robots.job?.requestId === e.requestId ? robots.job : undefined;
    if (e.responseErrorReason) {
      if (job) {
        job.row.error = e.responseErrorReason;
        job.finish({ error: e.responseErrorReason });
      }
      return send("Fetch.continueRequest", { requestId: e.requestId });
    }
    if (job) {
      job.row.status = e.responseStatusCode;
      const result = { status: e.responseStatusCode, location: header(e.responseHeaders, "location") };
      if (result.status >= 200 && result.status < 300) {
        const body = await readBody(cdp, e.requestId);
        if (body === undefined) {
          job.row.error = "body not read";
          return job.finish({ error: "body not read" }), send("Fetch.failRequest", { requestId: e.requestId, errorReason: "Aborted" });
        }
        result.body = body;
      }
      job.finish(result);
    }
    return send("Fetch.failRequest", { requestId: e.requestId, errorReason: "Aborted" });
  };

  const ctx = { state, hosts, log, gone, fetchHop };

  // The requests take turns. Each one waits for the answer to the last request to its host, and
  // leaves at least PACE_MS after the request before it. The first one to an origin waits for its
  // robots.txt, which is asked for in that turn.
  const onRequest = (e) => {
    const row = { type: typeOf(e), method: e.request.method, url: e.request.url };
    if (robots.frameId && e.frameId === robots.frameId) return onRobotsRequest(e, row);
    const from = sentRows.get(e.redirectedRequestId);
    if (from) row.from = from.url;
    if (isBrowserIcon(e)) return block(e, row, "favicon");
    const host = hostOf(e.request.url);
    if (!hosts.has(host)) return block(e, row, "host not allowed");
    if (wanted && !wanted.has(row.type)) return block(e, row, "type not allowed");
    if (closed.has(host)) return block(e, row, `closed: ${closed.get(host)}`);
    if (row.type === "document" && isSignIn(row.url)) {
      close(host, "sign-in page");
      return block(e, row, "closed: sign-in page");
    }
    const known = refusal(state, row.url);
    if (known) return block(e, row, known);
    return turn(state, async () => {
      if (gone()) return block(e, row, "gone");
      await robotsOf(ctx, row.url, new Set());
      if (gone()) return block(e, row, "gone");
      const refused = refusal(state, row.url);
      if (refused) return block(e, row, refused);
      await state.waiting.get(host)?.answered;
      await paced(state);
      if (gone()) return block(e, row, "gone");
      // The host can close while the request waits.
      if (closed.has(host)) return block(e, row, `closed: ${closed.get(host)}`);
      const at = Date.now();
      const sent = { at: new Date(at).toISOString(), ...row, sent: true };
      sentRows.set(e.requestId, sent);
      const wait = { requestId: e.requestId };
      wait.answered = new Promise((resolve) => {
        wait.free = resolve;
        setTimeout(resolve, ANSWER_WAIT_MS).unref?.();
      });
      if (!(await send("Fetch.continueRequest", { requestId: e.requestId }))) {
        // The page or the request went away while it waited: nothing was sent.
        sentRows.delete(e.requestId);
        log.push({ ...sent, sent: false, reason: "gone" });
        return;
      }
      state.last = at;
      state.waiting.set(host, wait);
      log.push(sent);
    });
  };

  const onResponse = (e) => {
    if (robots.ids.has(e.requestId)) return onRobotsResponse(e);
    const host = hostOf(e.request.url);
    // The next request to the host can go.
    const wait = state.waiting.get(host);
    if (wait?.requestId === e.requestId) wait.free();
    const row = sentRows.get(e.requestId);
    if (e.responseErrorReason) {
      if (row) row.error = e.responseErrorReason;
      if (!NOT_A_VERDICT.has(e.responseErrorReason)) close(host, `dropped (${e.responseErrorReason})`);
      return send("Fetch.continueRequest", { requestId: e.requestId });
    }
    const status = e.responseStatusCode;
    if (row) row.status = status;
    if (status === 401 || status === 403) close(host, String(status));
    const location = status >= 300 && status < 400 ? header(e.responseHeaders, "location") : undefined;
    let target;
    try {
      target = location && new URL(location, e.request.url).href;
    } catch {}
    if (target && isSignIn(target)) {
      close(host, "sign-in redirect");
      log.push({
        at: new Date().toISOString(),
        type: row?.type ?? typeOf(e),
        method: e.request.method,
        url: target,
        from: e.request.url,
        sent: false,
        reason: "closed: sign-in redirect",
      });
      return send("Fetch.failRequest", { requestId: e.requestId, errorReason: "BlockedByClient" });
    }
    return send("Fetch.continueRequest", { requestId: e.requestId });
  };

  cdp.on("Fetch.requestPaused", async (e) => {
    try {
      const atResponse = e.responseStatusCode !== undefined || e.responseErrorReason !== undefined;
      await (atResponse ? onResponse(e) : onRequest(e));
    } catch (err) {
      // A request this code cannot judge does not go out.
      log.push({ at: new Date().toISOString(), type: typeOf(e), method: e.request?.method, url: e.request?.url, sent: false, reason: `error: ${String(err).split("\n")[0]}` });
      await send("Fetch.failRequest", { requestId: e.requestId, errorReason: "BlockedByClient" });
    }
  });
  try {
    state.userAgent ||= (await cdp.send("Browser.getVersion")).userAgent;
    await cdp.send("Fetch.enable", {
      patterns: [
        { urlPattern: "*", requestStage: "Request" },
        { urlPattern: "*", requestStage: "Response" },
      ],
    });
    const context = await browser.newContext({ serviceWorkers: "block", ...(viewport ? { viewport } : {}) });
    context.on("close", () => {
      closedContext = true;
      robots.job?.finish({ gone: true });
      state.busy = false;
      cdp.detach().catch(() => {});
    });
    await context.addInitScript({ content: NO_WEBRTC_WEBTRANSPORT });
    robots.page = await context.newPage();
    const frames = await context.newCDPSession(robots.page);
    robots.frameId = (await frames.send("Page.getFrameTree")).frameTree.frame.id;
    await frames.detach().catch(() => {});
    // The robots.txt of `url`, in its turn, before the page asks for anything.
    if (originOf(url) && !refusal(state, url)) await turn(state, () => robotsOf(ctx, url, new Set()));
    const blocked = refusal(state, url);
    if (blocked) console.warn(`polite.mjs: ${url} will be blocked (${blocked})`);
    const page = await context.newPage();
    return { page, context, log, closed, robots: state.robots, blocked };
  } catch (err) {
    await cdp.detach().catch(() => {});
    throw err;
  }
}

/** Read at most ROBOTS_MAX_BYTES of the body of a request paused at its response, as UTF-8. Undefined if it cannot be read. */
async function readBody(cdp, requestId) {
  let stream;
  try {
    ({ stream } = await cdp.send("Fetch.takeResponseBodyAsStream", { requestId }));
    const chunks = [];
    let size = 0;
    while (size < ROBOTS_MAX_BYTES) {
      const { data, base64Encoded, eof } = await cdp.send("IO.read", { handle: stream, size: Math.min(65536, ROBOTS_MAX_BYTES - size) });
      const chunk = Buffer.from(data, base64Encoded ? "base64" : "utf8");
      chunks.push(chunk);
      size += chunk.length;
      if (eof) break;
    }
    return Buffer.concat(chunks).subarray(0, ROBOTS_MAX_BYTES).toString("utf8");
  } catch {
    return undefined;
  } finally {
    if (stream) await cdp.send("IO.close", { handle: stream }).catch(() => {});
  }
}

/** Run `job` in the browser's queue of turns, after every job queued before it. */
function turn(state, job) {
  const mine = state.turn.then(job);
  state.turn = mine.catch(() => {});
  return mine;
}

/** Wait until PACE_MS have passed since the last request sent. */
async function paced(state) {
  for (let wait; (wait = state.last + PACE_MS - Date.now()) > 0; ) await new Promise((r) => setTimeout(r, wait));
}

function closeHost(state, host, reason) {
  if (!state.closed.has(host)) state.closed.set(host, reason);
}

/**
 * Why the gate blocks `url` before anything else is asked: its host is closed, its host's
 * robots.txt was unreachable, or the robots.txt of its origin disallows it. Undefined if none of
 * these holds, or the robots.txt of its origin is not known yet.
 */
function refusal(state, url) {
  const host = hostOf(url);
  if (state.closed.has(host)) return `closed: ${state.closed.get(host)}`;
  if (state.unreachable.has(host)) return `robots: ${state.unreachable.get(host)}`;
  const answer = state.robots.get(originOf(url));
  if (!answer) return undefined;
  if (answer.disallowAll) return answer.disallowAll.startsWith("closed: ") ? answer.disallowAll : `robots: ${answer.disallowAll}`;
  const u = new URL(url);
  const rule = robotsMatch(answer.rules, `${u.pathname}${u.search}`);
  if (!rule || rule.allow) return undefined;
  return rule.agent === "*" ? `robots: ${rule.text}` : `robots: ${rule.text} (User-agent: ${rule.agent})`;
}

/**
 * The robots.txt answer for the origin of `url`, asked for once in the life of the browser. Call
 * it in a turn. Undefined for a URL that is not http or https, for an origin whose robots.txt is
 * being asked for already (`asking`, a redirect loop), when the host is closed or left alone
 * before robots.txt is asked for, and when the page has gone; then nothing is kept.
 */
async function robotsOf(ctx, url, asking) {
  const { state } = ctx;
  const origin = originOf(url);
  if (!origin || asking.has(origin)) return undefined;
  if (state.robots.has(origin)) return state.robots.get(origin);
  asking.add(origin);
  const got = await askRobots(ctx, origin, asking);
  asking.delete(origin);
  if (!got) return undefined;
  state.robots.set(origin, got.answer);
  if (got.answer.disallowAll && !got.answer.disallowAll.startsWith("closed: ") && !state.unreachable.has(hostOf(origin))) state.unreachable.set(hostOf(origin), got.answer.disallowAll);
  // A redirect that ended on another origin's /robots.txt gives that origin its answer too.
  if (got.alsoFor && !state.robots.has(got.alsoFor)) state.robots.set(got.alsoFor, { ...got.answer, url: `${got.alsoFor}/robots.txt` });
  return got.answer;
}

/** Ask for `<origin>/robots.txt`, a hop at a time at the pace, each hop logged, and read the answer. */
async function askRobots(ctx, origin, asking) {
  const { state, hosts, log, gone, fetchHop } = ctx;
  const url0 = `${origin}/robots.txt`;
  const host0 = hostOf(url0);
  const answer = (fields, alsoFor) => ({ answer: { url: url0, rules: [], ...fields }, alsoFor });
  const unreachable = (why, fields = {}) => answer({ ...fields, disallowAll: `unreachable (${why})` });
  /** Closed: by the robots.txt of the host itself, or, for a hop on another host, unreachable. */
  const closedBy = (host, why, fields) => (host === host0 ? answer({ ...fields, disallowAll: `closed: ${why}` }) : unreachable(`${why} from ${host}`, fields));
  let url = url0;
  let from;
  for (let hop = 0; ; hop++) {
    const host = hostOf(url);
    await state.waiting.get(host)?.answered;
    await paced(state);
    if (gone()) return undefined;
    if (state.closed.has(host) || state.unreachable.has(host)) return hop === 0 ? undefined : unreachable(`redirect to a host left alone: ${host}`);
    const got = await fetchHop(url, from);
    if (got.gone) return undefined;
    if (got.timeout) return unreachable(`no answer in ${ANSWER_WAIT_MS / 1000} s`);
    if (got.error) {
      if (NOT_A_VERDICT.has(got.error)) return gone() ? undefined : unreachable(got.error);
      closeHost(state, host, `dropped (${got.error})`);
      return closedBy(host, `dropped (${got.error})`, { error: got.error });
    }
    const status = got.status;
    if (status === 401 || status === 403) {
      closeHost(state, host, String(status));
      return closedBy(host, String(status), { status });
    }
    const final = new URL(url);
    const alsoFor = final.pathname === "/robots.txt" && !final.search && final.origin !== origin ? final.origin : undefined;
    if (status >= 200 && status < 300) return answer({ status, rules: parseRobots(got.body, state.userAgent), text: got.body }, alsoFor);
    if (status === 429 || status >= 500) return unreachable(String(status), { status });
    if (status >= 400) return answer({ status }, alsoFor);
    if (status < 300) return unreachable(`status ${status}`, { status });
    let target;
    try {
      const t = new URL(got.location, url);
      t.hash = "";
      target = t.href;
    } catch {}
    if (!got.location || !target) return unreachable(`${status} with no location`, { status });
    const blockedHop = (reason) => log.push({ at: new Date().toISOString(), type: "robots", method: "GET", url: target, from: url, sent: false, reason });
    if (isSignIn(target)) {
      closeHost(state, host, "sign-in redirect");
      blockedHop("closed: sign-in redirect");
      return closedBy(host, "sign-in redirect", { status });
    }
    if (hop === ROBOTS_REDIRECTS) {
      blockedHop(`robots: more than ${ROBOTS_REDIRECTS} redirects`);
      return unreachable(`more than ${ROBOTS_REDIRECTS} redirects`, { status });
    }
    const next = hostOf(target);
    if (next !== host) {
      // Another host: only if it is allowed and not closed, and its own robots.txt allows the target.
      if (!originOf(target) || !hosts.has(next)) {
        blockedHop("host not allowed");
        return unreachable(`redirect to a host not allowed: ${next || target}`, { status });
      }
      const theirs = await robotsOf(ctx, target, asking);
      if (gone()) return undefined;
      const refused = refusal(state, target) ?? (theirs ? undefined : "robots: not known");
      if (refused) {
        blockedHop(refused);
        return unreachable(`redirect to ${target}, ${refused}`, { status });
      }
      // The target is that host's own robots.txt, read just now: its answer is this one's too.
      const t = new URL(target);
      if (t.pathname === "/robots.txt" && !t.search) return answer({ ...theirs, url: url0 });
    }
    from = url;
    url = target;
  }
}

/** "scheme://host:port" for an http or https URL, else "". */
function originOf(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.origin : "";
  } catch {
    return "";
  }
}

/** The resource type as the Fetch domain gives it, in lower case: "document", "script", "xhr" and so on. */
function typeOf(e) {
  return String(e.resourceType ?? "other").toLowerCase();
}

/**
 * True for the browser's own fetch of a page's icon: the Fetch domain gives it the type "Other",
 * and it asks for an image. Each image that the page itself loads has the type "Image", and the
 * page's other "Other" requests (a worker's script, <object>, <embed>) accept any type.
 */
function isBrowserIcon(e) {
  const accept = Object.entries(e.request.headers ?? {}).find(([name]) => name.toLowerCase() === "accept")?.[1] ?? "";
  return e.resourceType === "Other" && accept.startsWith("image/");
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

function header(headers = [], name) {
  return headers.find((h) => h.name.toLowerCase() === name)?.value;
}

/** Path parts and first host labels that name a sign-in page, and the query keys that only sign-in flows use. */
const SIGN_IN_PART = /^(login|log-in|logon|log-on|signin|sign-in|sign_in|sso|saml2?|oauth2?|authorize|adfs|idp|auth)$/i;
const SIGN_IN_HOST = /^(login|logon|signin|sso|idp|adfs|auth|accounts)$/i;
const SIGN_IN_QUERY = /[?&](SAMLRequest|redirect_uri)=/i;

/** True if `url` looks like a sign-in page: a redirect there means the host is closed to us. */
export function isSignIn(url) {
  const u = new URL(url);
  if (SIGN_IN_HOST.test(u.hostname.split(".")[0] ?? "")) return true;
  if (u.pathname.split("/").some((part) => SIGN_IN_PART.test(part.replace(/\.[a-z]+$/i, "")))) return true;
  return SIGN_IN_QUERY.test(u.search);
}

/** The hosts given as `--allow=a.example,b.example` among the arguments, and the arguments left. */
export function allowArg(args) {
  const flag = args.find((a) => a.startsWith("--allow="));
  return {
    allow: flag ? flag.slice("--allow=".length).split(",").filter(Boolean) : [],
    rest: args.filter((a) => a !== flag),
  };
}
