// Looking at a site counts as fetching from it (AGENTS.md, "Snapshot once" and "Closed is a
// verdict"; the porting skill's RECON.md). A headless browser opened for research goes through
// this file. The browser can send requests only to the hosts being studied: at most one request
// every PACE_MS, and at most one request at a time to each host. Service workers are blocked.
// Every request that this file sees is logged, sent or blocked. The limits below say what it does
// not see.
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
// A request to a host waits for the answer to the request before it (at most ANSWER_WAIT_MS). A
// host is closed after a 401, after a 403, after a redirect to a sign-in page, after a request for
// a sign-in page, or after a dropped connection. Each later request to it is blocked with the
// reason "closed: <why>". The sign-in page itself is not asked for.
//
// Speculation rules make Chromium prefetch and prerender pages outside the Fetch domain. This file
// removes them: it renames the type of each <script type="speculationrules"> in a page and drops
// the Speculation-Rules header, and a script in each page makes the type inert when the page's own
// scripts set it.
//
// Limits: what still goes out without this file.
// - A WebSocket does not go through the Fetch domain. It is not stopped and not logged.
// - WebRTC sends UDP to any STUN server. Launch the browser with POLITE_ARGS to stop it.
// - After a dropped keep-alive connection, Chromium sends the same request again below the Fetch
//   domain, at once. The log has one row; the server gets the request twice.
// - Speculation rules in a page that is not ASCII-compatible (UTF-16), or added by script in a way
//   that the page script does not catch, are not removed.
export const PACE_MS = 1100;

/** How long a request to a host waits for the answer to the request before it. */
export const ANSWER_WAIT_MS = 10_000;

/** Launch arguments for a research browser: no WebRTC UDP except through a proxy. */
export const POLITE_ARGS = ["--force-webrtc-ip-handling-policy=disable_non_proxied_udp"];

/** Errors from the network that are not a verdict on the host: the page itself let go of the request. */
const NOT_A_VERDICT = new Set(["Aborted", "BlockedByClient", "BlockedByResponse"]);

/** The type that a speculation-rules script gets instead: an unknown type, which the browser ignores. */
const INERT = "x-polite-blocked-speculationrules";

/** The state of each browser: its closed hosts and its pace hold from one polite page to the next. */
const states = new WeakMap();
function stateOf(browser) {
  let state = states.get(browser);
  if (!state) {
    state = { busy: false, closed: new Map(), last: -Infinity, turn: Promise.resolve(), answer: new Map() };
    states.set(browser, state);
  }
  return state;
}

/**
 * A page in a fresh context of `browser` (Chromium) that keeps to the rules above. `url` names the
 * host being studied; `allow` adds more hosts; `types`, if given, lets only those resource types
 * through (["document"] to read one page and nothing it loads). Returns the page, its context, the
 * log, and the hosts closed so far with the reason for each (`closed`, a Map from host to reason,
 * shared by every polite page of this browser).
 */
export async function politePage(browser, { url, allow = [], types, viewport } = {}) {
  const state = stateOf(browser);
  if (state.busy) throw new Error("polite.mjs: this browser has a polite page open; close its context or launch another browser");
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
  /** For each request sent, the function that lets the next request to its host go. */
  const answered = new Map();
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
  // leaves at least PACE_MS after the request before it.
  const onRequest = (e) => {
    const row = { type: typeOf(e), method: e.request.method, url: e.request.url };
    const from = sentRows.get(e.redirectedRequestId);
    if (from) row.from = from.url;
    const host = hostOf(e.request.url);
    if (!hosts.has(host)) return block(e, row, "host not allowed");
    if (wanted && !wanted.has(row.type)) return block(e, row, "type not allowed");
    if (closed.has(host)) return block(e, row, `closed: ${closed.get(host)}`);
    if (row.type === "document" && isSignIn(row.url)) {
      close(host, "sign-in page");
      return block(e, row, "closed: sign-in page");
    }
    const mine = state.turn.then(async () => {
      await state.answer.get(host);
      for (let wait; (wait = state.last + PACE_MS - Date.now()) > 0; ) await new Promise((r) => setTimeout(r, wait));
      // The host can close while the request waits.
      if (closed.has(host)) return block(e, row, `closed: ${closed.get(host)}`);
      const at = Date.now();
      const sent = { at: new Date(at).toISOString(), ...row, sent: true };
      sentRows.set(e.requestId, sent);
      let free;
      const answer = new Promise((resolve) => {
        free = resolve;
        setTimeout(resolve, ANSWER_WAIT_MS).unref?.();
      });
      answered.set(e.requestId, free);
      if (!(await send("Fetch.continueRequest", { requestId: e.requestId }))) {
        // The page or the request went away while it waited: nothing was sent.
        sentRows.delete(e.requestId);
        answered.delete(e.requestId);
        log.push({ ...sent, sent: false, reason: "gone" });
        return;
      }
      state.last = at;
      state.answer.set(host, answer);
      log.push(sent);
    });
    state.turn = mine.catch(() => {});
    return mine;
  };

  const onResponse = async (e) => {
    answered.get(e.requestId)?.();
    answered.delete(e.requestId);
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
    if (typeOf(e) === "document" && !location) {
      const fulfil = await withoutSpeculation(cdp, e);
      if (fulfil) {
        if (row) row.note = fulfil.note;
        if (await send("Fetch.fulfillRequest", fulfil.params)) return true;
      }
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
      state.busy = false;
      cdp.detach().catch(() => {});
    });
    await context.addInitScript({ content: inertSpeculation(INERT) });
    const page = await context.newPage();
    return { page, context, log, closed };
  } catch (err) {
    await cdp.detach().catch(() => {});
    throw err;
  }
}

/**
 * The page `e` without its speculation rules, as the parameters of Fetch.fulfillRequest, or null
 * if it has none. The body is read as bytes (latin1), so any ASCII-compatible charset stays as it was.
 */
async function withoutSpeculation(cdp, e) {
  const headers = e.responseHeaders ?? [];
  const ruleHeader = headers.some((h) => h.name.toLowerCase() === "speculation-rules");
  let bytes;
  let changed = false;
  if (/html/i.test(header(headers, "content-type") ?? "")) {
    const got = await cdp.send("Fetch.getResponseBody", { requestId: e.requestId }).catch(() => null);
    if (got) {
      bytes = Buffer.from(got.body, got.base64Encoded ? "base64" : "utf8");
      const text = bytes.toString("latin1");
      const clean = text.replace(/<script\b[^>]*>/gi, (tag) => tag.replace(/speculationrules/gi, INERT));
      if (clean !== text) {
        bytes = Buffer.from(clean, "latin1");
        changed = true;
      }
    }
  }
  if (!changed && !ruleHeader) return null;
  if (!bytes) {
    const got = await cdp.send("Fetch.getResponseBody", { requestId: e.requestId }).catch(() => null);
    if (!got) return null;
    bytes = Buffer.from(got.body, got.base64Encoded ? "base64" : "utf8");
  }
  // The body is the one the browser decoded, so its old encoding and length no longer apply.
  const drop = new Set(["speculation-rules", "content-encoding", "content-length"]);
  return {
    note: [changed && "speculation rules removed", ruleHeader && "Speculation-Rules header removed"].filter(Boolean).join("; "),
    params: {
      requestId: e.requestId,
      responseCode: e.responseStatusCode,
      responsePhrase: e.responseStatusText || undefined,
      responseHeaders: headers.filter((h) => !drop.has(h.name.toLowerCase())),
      body: bytes.toString("base64"),
    },
  };
}

/**
 * A script for each new page: a script element whose type is set to speculationrules by the
 * page's own scripts gets the inert type instead, and HTMLScriptElement.supports says no to it.
 */
function inertSpeculation(inert) {
  return `(() => {
  const INERT = ${JSON.stringify(inert)};
  const fix = (v) => String(v).replace(/speculationrules/gi, INERT);
  const isType = (el, name) => el instanceof HTMLScriptElement && String(name).toLowerCase() === "type";
  const S = HTMLScriptElement.prototype;
  const type = Object.getOwnPropertyDescriptor(S, "type");
  Object.defineProperty(S, "type", { ...type, set(v) { type.set.call(this, fix(v)); } });
  const supports = HTMLScriptElement.supports;
  if (supports) HTMLScriptElement.supports = function (t) { return /speculationrules/i.test(String(t)) ? false : supports.call(this, t); };
  const E = Element.prototype;
  const setAttribute = E.setAttribute;
  E.setAttribute = function (name, v) { return setAttribute.call(this, name, isType(this, name) ? fix(v) : v); };
  const setAttributeNS = E.setAttributeNS;
  E.setAttributeNS = function (ns, name, v) { return setAttributeNS.call(this, ns, name, isType(this, name) ? fix(v) : v); };
  for (const key of ["setAttributeNode", "setAttributeNodeNS"]) {
    const set = E[key];
    E[key] = function (attr) { if (isType(this, attr.name)) attr.value = fix(attr.value); return set.call(this, attr); };
  }
  const value = Object.getOwnPropertyDescriptor(Attr.prototype, "value");
  Object.defineProperty(Attr.prototype, "value", { ...value, set(v) { value.set.call(this, this.ownerElement && isType(this.ownerElement, this.name) ? fix(v) : v); } });
  const html = (s) => String(s).replace(/<script\\b[^>]*>/gi, (tag) => fix(tag));
  for (const key of ["write", "writeln"]) {
    const write = Document.prototype[key];
    Document.prototype[key] = function (...parts) { return write.apply(this, parts.map(html)); };
  }
  const fragment = Range.prototype.createContextualFragment;
  Range.prototype.createContextualFragment = function (s) { return fragment.call(this, html(s)); };
})();`;
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
