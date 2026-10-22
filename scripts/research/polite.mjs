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
// they hold from one polite page to the next.
//
// A host is closed after a 401, after a 403, after a redirect to a sign-in page, after a request for
// a sign-in page, or after a dropped connection. Each later request to it is blocked with the
// reason "closed: <why>". The sign-in page itself is not asked for.
//
// robots.txt. Before the first request that it lets through to a scheme, host and port, the gate
// asks for robots.txt there, and keeps the answer for the life of the browser, beside the closed
// hosts and the pace: a second polite page does not ask again. politePage() asks for the robots.txt
// of `url` before it returns, and if robots.txt disallows `url`, or its host is closed, it says
// so (`blocked`, and a warning) and the page's request for `url` is blocked. The gate's own
// request is not the page's: Node sends it (node:http or node:https, one connection that closes
// after the answer), with the browser's own User-Agent, in its turn at the pace, and logs it with
// the type "robots" and the reason "robots". It does not depend on a page, and no page sees it.
// robots.mjs reads the file as RFC 9309 says, and says where it reads further. It takes the
// strictest reading of the groups: a path is allowed only if every group that applies allows it.
// Those are the "*" groups, the groups whose token is in a product name of the browser's own
// User-Agent (HeadlessChrome, Chrome), and the groups that name an Anthropic agent (ClaudeBot,
// Claude-Web, Claude-User, Claude-SearchBot, anthropic-ai), because Claude drives this browser.
// Each request, of any type, from any page, frame, popup or worker, that robots.txt disallows is
// blocked with the reason "robots: <the rule as written>", and " (User-agent: <token>)" after it
// when the rule is not of a "*" group. A 404 or another 4xx allows everything; a 401 or a 403 closes
// the host, as above. A 429, a 5xx, no answer in ANSWER_WAIT_MS, or a dropped connection makes
// the gate leave the whole host alone for the life of the browser ("robots: unreachable (<why>)").
// A redirect of robots.txt is followed, a hop at a time at the pace, to the hosts allowed, for at
// most ROBOTS_REDIRECTS hops; anything else is "unreachable" too. An agent still quotes robots.txt
// in its report (RECON.md asks for that), but no longer decides by hand which paths to leave alone.
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
// - A WebSocket does not go through the Fetch domain. It is not stopped and not logged.
// - A worker still has WebTransport: in Chromium 156 a dedicated worker can make one, and its QUIC
//   packets go out over UDP outside the Fetch domain, to any host, with no log.
// - After a dropped keep-alive connection, Chromium sends the same request again below the Fetch
//   domain, at once. The log has one row; the server gets the request twice.
// - A request that is sent and then gets no answer holds its host, and the queue, for up to
//   ANSWER_WAIT_MS. The page aborting it does not free the host. A navigation away from a page
//   with a slow request in flight waits too: the old page aborts it only after the navigation goes.
// - The gate's request for robots.txt goes from Node, not from the browser: a proxy given to the
//   browser does not carry it, and Node's own certificate store checks its TLS. A robots.txt that
//   does not come is "unreachable" and leaves the host alone; nothing goes out unlogged.
// - robots.txt is not read again in the life of a browser (RFC 9309 allows a day), and the gate
//   does not keep to Crawl-delay, which RFC 9309 does not define.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { parseRobots, robotsMatch } from "./robots.mjs";

export { ANTHROPIC_AGENTS, parseRobots, robotsAllows, robotsMatch } from "./robots.mjs";

export const PACE_MS = 1100;

/** How many redirects of robots.txt the gate follows (RFC 9309, 2.3.1.2: at least five). */
export const ROBOTS_REDIRECTS = 5;

/** How much of a robots.txt the gate reads (RFC 9309, 2.5: at least 500 KiB). */
const ROBOTS_MAX_BYTES = 500 * 1024;

/** How long a request to a host waits for the answer to the request before it. */
export const ANSWER_WAIT_MS = 10_000;

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
    state = { busy: false, closed: new Map(), robots: new Map(), last: -Infinity, turn: Promise.resolve(), waiting: new Map(), userAgent: undefined };
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
 * `url` itself, if it will ("robots: Disallow: /", "closed: 403").
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
  const close = (host, reason) => {
    if (!closed.has(host)) closed.set(host, reason);
  };

  // The requests take turns. Each one waits for the answer to the last request to its host, and
  // leaves at least PACE_MS after the request before it. The first one to an origin waits for its
  // robots.txt, which is asked for in that turn.
  const onRequest = (e) => {
    const row = { type: typeOf(e), method: e.request.method, url: e.request.url };
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
    const known = robotsReason(state.robots.get(originOf(row.url)), row.url);
    if (known) return block(e, row, known);
    const mine = state.turn.then(async () => {
      const refused = robotsReason(await robotsOf(state, row.url, hosts, log), row.url);
      if (closed.has(host)) return block(e, row, `closed: ${closed.get(host)}`);
      if (refused) return block(e, row, refused);
      await state.waiting.get(host)?.answered;
      await paced(state);
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
    state.turn = mine.catch(() => {});
    return mine;
  };

  const onResponse = (e) => {
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
    state.userAgent ??= (await cdp.send("Browser.getVersion")).userAgent;
    // The robots.txt of `url`, in its turn, before the page asks for anything.
    const first = hostOf(url);
    if (!closed.has(first) && originOf(url)) await turn(state, () => robotsOf(state, url, hosts, log));
    const blocked = closed.has(first) ? `closed: ${closed.get(first)}` : robotsReason(state.robots.get(originOf(url)), url);
    if (blocked) console.warn(`polite.mjs: ${url} will be blocked (${blocked})`);
    await cdp.send("Fetch.enable", {
      patterns: [
        { urlPattern: "*", requestStage: "Request" },
        { urlPattern: "*", requestStage: "Response" },
      ],
    });
    const context = await browser.newContext({ serviceWorkers: "block", ...(viewport ? { viewport } : {}) });
    context.on("close", () => {
      state.busy = false;
      cdp.detach().catch(() => {});
    });
    await context.addInitScript({ content: NO_WEBRTC_WEBTRANSPORT });
    const page = await context.newPage();
    return { page, context, log, closed, robots: state.robots, blocked };
  } catch (err) {
    await cdp.detach().catch(() => {});
    throw err;
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
 * The robots.txt answer for the origin of `url`, asked for once in the life of the browser. Call
 * it in a turn. Undefined for a URL that is not http or https, and when the host closed before
 * robots.txt was asked for (then nothing is kept, and the closed host blocks the request).
 */
async function robotsOf(state, url, hosts, log) {
  const origin = originOf(url);
  if (!origin) return undefined;
  if (!state.robots.has(origin)) {
    const answer = await askRobots(state, origin, hosts, log);
    if (!answer) return undefined;
    state.robots.set(origin, answer);
  }
  return state.robots.get(origin);
}

/** Ask for `<origin>/robots.txt`, a hop at a time at the pace, each hop logged, and read the answer. */
async function askRobots(state, origin, hosts, log) {
  const url0 = `${origin}/robots.txt`;
  const answer = (fields) => ({ url: url0, rules: [], ...fields });
  const unreachable = (why, fields = {}) => answer({ ...fields, disallowAll: `unreachable (${why})` });
  let url = url0;
  let from;
  for (let hop = 0; ; hop++) {
    const host = hostOf(url);
    await state.waiting.get(host)?.answered;
    await paced(state);
    if (state.closed.has(host)) return hop === 0 ? undefined : unreachable(`redirect to a closed host: ${host}`);
    const at = Date.now();
    state.last = at;
    const row = { at: new Date(at).toISOString(), type: "robots", method: "GET", url, ...(from ? { from } : {}), sent: true, reason: "robots" };
    log.push(row);
    const got = await getOnce(url, state.userAgent);
    if (got.error) {
      row.error = got.error;
      return unreachable(got.error, { error: got.error });
    }
    const status = got.status;
    row.status = status;
    if (status === 401 || status === 403) {
      closeHost(state, host, String(status));
      return host === hostOf(url0) ? answer({ status, disallowAll: `closed: ${status}` }) : unreachable(`${status} from ${host}`, { status });
    }
    if (status >= 200 && status < 300) return answer({ status, rules: parseRobots(got.body, state.userAgent), text: got.body });
    if (status === 429 || status >= 500) return unreachable(String(status), { status });
    if (status >= 400) return answer({ status });
    if (status < 300) return unreachable(`status ${status}`, { status });
    let target;
    try {
      target = got.location && new URL(got.location, url).href;
    } catch {}
    if (!target) return unreachable(`${status} with no location`, { status });
    const blockedHop = (reason) => log.push({ at: new Date().toISOString(), type: "robots", method: "GET", url: target, from: url, sent: false, reason });
    if (isSignIn(target)) {
      closeHost(state, host, "sign-in redirect");
      blockedHop("closed: sign-in redirect");
      return host === hostOf(url0) ? answer({ status, disallowAll: "closed: sign-in redirect" }) : unreachable(`sign-in redirect from ${host}`, { status });
    }
    if (!/^https?:$/.test(new URL(target).protocol) || !hosts.has(hostOf(target))) {
      blockedHop("host not allowed");
      return unreachable(`redirect to a host not allowed: ${new URL(target).host || target}`, { status });
    }
    if (hop === ROBOTS_REDIRECTS) {
      blockedHop(`robots: more than ${ROBOTS_REDIRECTS} redirects`);
      return unreachable(`more than ${ROBOTS_REDIRECTS} redirects`, { status });
    }
    from = url;
    url = target;
  }
}

/**
 * One GET from Node, on a connection of its own that closes after the answer. Resolves to the
 * status, the Location header and up to ROBOTS_MAX_BYTES of the body, or to `error`. Never rejects.
 */
function getOnce(url, userAgent) {
  return new Promise((resolve) => {
    let timer;
    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(result);
    };
    const fail = (err) => finish({ error: err?.code ?? String(err?.message ?? err).split("\n")[0] });
    let req;
    try {
      const headers = { accept: "text/plain, */*;q=0.1", ...(userAgent ? { "user-agent": userAgent } : {}) };
      req = (url.startsWith("https:") ? https : http).get(url, { agent: false, headers }, (res) => {
        const chunks = [];
        let size = 0;
        res.on("data", (chunk) => {
          if (size < ROBOTS_MAX_BYTES) chunks.push(chunk);
          size += chunk.length;
        });
        res.on("end", () => finish({ status: res.statusCode, location: res.headers.location, body: Buffer.concat(chunks).subarray(0, ROBOTS_MAX_BYTES).toString("utf8") }));
        res.on("error", fail);
        res.on("close", () => fail(new Error("connection closed before the end of the answer")));
      });
    } catch (err) {
      return fail(err);
    }
    req.on("error", fail);
    timer = setTimeout(() => {
      finish({ error: `no answer in ${ANSWER_WAIT_MS / 1000} s` });
      req.destroy();
    }, ANSWER_WAIT_MS);
  });
}

/** Why robots.txt (its answer for the origin of `url`) disallows `url`, or undefined if it does not. */
function robotsReason(answer, url) {
  if (!answer) return undefined;
  if (answer.disallowAll) return answer.disallowAll.startsWith("closed: ") ? answer.disallowAll : `robots: ${answer.disallowAll}`;
  const u = new URL(url);
  const rule = robotsMatch(answer.rules, `${u.pathname}${u.search}`);
  if (!rule || rule.allow) return undefined;
  return rule.agent === "*" ? `robots: ${rule.text}` : `robots: ${rule.text} (User-agent: ${rule.agent})`;
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
