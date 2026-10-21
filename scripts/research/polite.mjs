// Looking at a site counts as fetching from it (AGENTS.md, "Snapshot once" and "Closed is a
// verdict"; the porting skill's RECON.md). A headless browser opened for research goes through
// this file. The browser can send requests only to the hosts being studied, at most one request
// every PACE_MS. Service workers are blocked. Every request is logged, sent or blocked. Anything
// else is stopped before it leaves the machine.
//
// The gate is the DevTools Fetch domain on the browser's own session, not page.route(). Playwright
// routes only the first request of a redirect chain and lets the browser follow each 3xx by itself,
// so a hop escaped the pace, the host check and the log. route.fetch() with maxRedirects 0 does not
// help: the browser still follows the fulfilled 3xx without the route. It also drops the Sec-Fetch
// headers that the browser sends. The Fetch domain stops every request: each hop, and the requests
// of popups, frames and workers. The browser itself sends each request, with its own headers and
// cookies. The Fetch domain works in Chromium only. It sees every request in the browser, so a
// browser has one polite page at a time. A WebSocket does not go through the Fetch domain: this
// file does not stop it or log it.
//
// A host is closed for the rest of the page after a 401, after a 403, after a redirect to a sign-in
// page, or after a dropped connection. Each later request to it is blocked with the reason
// "closed: <why>". The redirect to a sign-in page is not followed.
export const PACE_MS = 1100;

/** The browsers that have a polite page open now. */
const busy = new WeakSet();

/** Errors from the network that are not a verdict on the host: the page itself let go of the request. */
const NOT_A_VERDICT = new Set(["Aborted", "BlockedByClient", "BlockedByResponse"]);

/**
 * A page in a fresh context of `browser` (Chromium) that keeps to the rules above. `url` names the
 * host being studied; `allow` adds more hosts; `types`, if given, lets only those resource types
 * through (["document"] to read one page and nothing it loads). Returns the page, its context, the
 * log, and the hosts closed so far with the reason for each (`closed`, a Map from host to reason).
 */
export async function politePage(browser, { url, allow = [], types, viewport } = {}) {
  if (busy.has(browser)) throw new Error("polite.mjs: this browser has a polite page open; close its context or launch another browser");
  busy.add(browser);
  try {
    return await open(browser, { url, allow, types, viewport });
  } catch (err) {
    busy.delete(browser);
    throw err;
  }
}

async function open(browser, { url, allow, types, viewport }) {
  const hosts = new Set([new URL(url).host, ...allow]);
  // The Fetch domain calls a fetch() request "xhr", so "fetch" lets those through.
  const wanted = types && new Set(types.flatMap((t) => (t === "fetch" ? ["fetch", "xhr"] : [t])));
  const log = [];
  const closed = new Map();
  /** The log row of each request sent, by its interception id, to add its status and to name the hop it led to. */
  const sentRows = new Map();
  const cdp = await browser.newBrowserCDPSession();
  // A request or a page can go away while it waits; then there is nothing left to answer.
  const send = (method, params) => cdp.send(method, params).catch(() => {});
  const block = (e, row, reason) => {
    log.push({ at: new Date().toISOString(), ...row, sent: false, reason });
    return send("Fetch.failRequest", { requestId: e.requestId, errorReason: "BlockedByClient" });
  };
  const close = (host, reason) => {
    if (!closed.has(host)) closed.set(host, reason);
  };

  // The requests take turns. Each one leaves at least PACE_MS after the one before it.
  let turn = Promise.resolve();
  let last = -Infinity;
  const onRequest = (e) => {
    const row = { type: typeOf(e), method: e.request.method, url: e.request.url };
    const from = sentRows.get(e.redirectedRequestId);
    if (from) row.from = from.url;
    const host = hostOf(e.request.url);
    if (!hosts.has(host)) return block(e, row, "host not allowed");
    if (wanted && !wanted.has(row.type)) return block(e, row, "type not allowed");
    if (closed.has(host)) return block(e, row, `closed: ${closed.get(host)}`);
    const mine = turn.then(async () => {
      for (let wait; (wait = last + PACE_MS - Date.now()) > 0; ) await new Promise((r) => setTimeout(r, wait));
      // The host can close while the request waits.
      if (closed.has(host)) return block(e, row, `closed: ${closed.get(host)}`);
      last = Date.now();
      const sent = { at: new Date(last).toISOString(), ...row, sent: true };
      log.push(sent);
      sentRows.set(e.requestId, sent);
      return send("Fetch.continueRequest", { requestId: e.requestId });
    });
    turn = mine.catch(() => {});
    return mine;
  };

  const onResponse = (e) => {
    const host = hostOf(e.request.url);
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
    await cdp.send("Fetch.enable", {
      patterns: [
        { urlPattern: "*", requestStage: "Request" },
        { urlPattern: "*", requestStage: "Response" },
      ],
    });
    const context = await browser.newContext({ serviceWorkers: "block", ...(viewport ? { viewport } : {}) });
    context.on("close", () => {
      busy.delete(browser);
      cdp.detach().catch(() => {});
    });
    const page = await context.newPage();
    return { page, context, log, closed };
  } catch (err) {
    await cdp.detach().catch(() => {});
    throw err;
  }
}

/** The resource type in Playwright's words: "document", "script", "xhr" and so on. */
function typeOf(e) {
  return String(e.resourceType ?? "other").toLowerCase();
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
