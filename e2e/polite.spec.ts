// The research browser (scripts/research/polite.mjs) keeps to "Snapshot once" and "Closed is a
// verdict" for every request it sees, the hops of a redirect too, and to each host's robots.txt,
// which it asks for before anything else on that host. These tests do not use the site.
// The browser tests each launch a browser of their own (politeLaunch(), but for the one that pins
// a limit of a plain browser) and start one to three servers of their own on 127.0.0.1; the
// WebRTC and WebTransport test also opens a UDP and a TCP socket there. They ask no other host.
// They are here and not in tests/ because the CI job that runs vitest has no browser installed.
import dgram from "node:dgram";
import fs from "node:fs";
import http from "node:http";
import net, { type AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { chromium, expect, test, type Browser, type Page } from "@playwright/test";
import { ANSWER_WAIT_MS, PACE_MS, ROBOTS_MAX_BYTES, isSignIn, politeLaunch, politePage, type PoliteRow } from "../scripts/research/polite.mjs";

type Answer = (res: http.ServerResponse, req: http.IncomingMessage) => void;
interface Hit {
  host: string;
  path: string;
  at: number;
  headers: http.IncomingHttpHeaders;
}

/**
 * A server on 127.0.0.1 that answers by path. `pages` gets the port, so that a page can name
 * http://localhost:<port>, which is the same server under a host that is not allowed: a request
 * that got there would show in `hits`. Every request the server gets is recorded in `hits`, and
 * `connections` counts the TCP connections made to it.
 */
async function serve(pages: (port: number) => Record<string, Answer>) {
  const hits: Hit[] = [];
  let answers: Record<string, Answer> = {};
  const server = http.createServer((req, res) => {
    const path = req.url ?? "/";
    hits.push({ host: req.headers.host ?? "", path, at: Date.now(), headers: req.headers });
    const answer = answers[path.split("?")[0]!];
    if (answer) return answer(res, req);
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not here");
  });
  let connections = 0;
  server.on("connection", () => connections++);
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const port = (server.address() as AddressInfo).port;
  answers = pages(port);
  return {
    hits,
    paths: () => hits.map((h) => h.path),
    connections: () => connections,
    base: `http://127.0.0.1:${port}`,
    host: `127.0.0.1:${port}`,
    other: `http://localhost:${port}`,
    stop: () => new Promise((done) => server.close(done)),
  };
}

const redirect =
  (to: string, status = 302): Answer =>
  (res) => {
    res.writeHead(status, { location: to });
    res.end();
  };
const html =
  (body: string, headers: Record<string, string> = {}): Answer =>
  (res) => {
    res.writeHead(200, { "content-type": "text/html", ...headers });
    res.end(`<!doctype html><html><head></head><body>${body}</body></html>`);
  };
const script =
  (code: string): Answer =>
  (res) => {
    res.writeHead(200, { "content-type": "text/javascript" });
    res.end(code);
  };
const text =
  (body: string): Answer =>
  (res) => {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end(body);
  };
const status =
  (code: number, delay = 0): Answer =>
  (res) => {
    setTimeout(() => {
      res.writeHead(code, { "content-type": "text/plain" });
      res.end(String(code));
    }, delay);
  };

/** The gaps in milliseconds between one time and the next. */
const gaps = (times: number[]) => times.slice(1).map((t, i) => t - times[i]!);
const sentTimes = (log: PoliteRow[]) => log.filter((r) => r.sent).map((r) => Date.parse(r.at));
/** The log without the rows of the browser's own icon requests, which the gate blocks (see the favicon tests). */
const pages = (log: PoliteRow[]) => log.filter((r) => r.reason !== "favicon");
const expectPaced = (log: PoliteRow[]) => {
  for (const gap of gaps(sentTimes(log))) expect(gap).toBeGreaterThanOrEqual(PACE_MS);
};
/** At the server the gaps can be a little shorter than in the log, on a busy machine; a hop that escaped would come at once. */
const expectPacedAt = (hits: Hit[]) => {
  for (const gap of gaps(hits.map((h) => h.at))) expect(gap).toBeGreaterThanOrEqual(PACE_MS / 2);
};
/** A global that the page's own script set. */
const value = (page: Page, name: string) => page.evaluate((n) => (window as unknown as Record<string, unknown>)[n], name);

// Speculation rules make Chromium prefetch and prerender outside the Fetch domain. Each page below
// names three pages in its rules: another path on the page's own host (it would go out at once,
// unpaced), a host not allowed, and a host closed by a 403. Returns the three servers after it.
const SPECULATION = ["a list in the page", "the Speculation-Rules header", "a rule that the page's script adds", "a character reference in the type", "an XHTML page"] as const;
async function speculate(browser: Browser, how: (typeof SPECULATION)[number]) {
  let rules = "";
  const xhtml: Answer = (res) => {
    res.writeHead(200, { "content-type": "application/xhtml+xml" });
    res.end(`<html xmlns="http://www.w3.org/1999/xhtml" xmlns:h="http://www.w3.org/1999/xhtml"><head></head><body><p>xhtml</p><h:script type="speculationrules">${rules}</h:script></body></html>`);
  };
  const site = await serve(() => ({
    "/page": (res, req) =>
      ({
        "a list in the page": () => html(`list<script type="speculationrules">${rules}</script>`),
        "the Speculation-Rules header": () => html("header", { "speculation-rules": '"/rules.json"' }),
        "a rule that the page's script adds": () =>
          html(
            `script<script>` +
              `const a = document.createElement("script"); a.type = "speculationrules"; a.textContent = ${JSON.stringify(rules)}; document.head.append(a);` +
              `const b = document.createElement("script"); b.setAttribute("type", "speculationrules"); b.textContent = ${JSON.stringify(rules)}; document.head.append(b);` +
              `</script>`,
          ),
        "a character reference in the type": () => html(`charref<script type="&#115;peculationrules">${rules}</script>`),
        "an XHTML page": () => xhtml,
      })[how]()(res, req),
    "/rules.json": (res) => {
      res.writeHead(200, { "content-type": "application/speculationrules+json" });
      res.end(rules);
    },
  }));
  const outside = await serve(() => ({}));
  const shut = await serve(() => ({ "/forbidden": status(403) }));
  const urls = [`${site.base}/same-host`, `${outside.base}/not-allowed`, `${shut.base}/closed-host`];
  rules = JSON.stringify({ prefetch: [{ source: "list", urls }], prerender: [{ source: "list", urls: urls.map((u) => `${u}?prerender`) }] });
  try {
    const { page } = await politePage(browser, { url: site.base, allow: [shut.host] });
    await page.goto(`${shut.base}/forbidden`);
    await page.goto(`${site.base}/page`);
    await page.waitForTimeout(3000);
    return { site: site.paths(), outside: outside.paths(), outsideConnections: outside.connections(), shut: shut.paths() };
  } finally {
    await Promise.all([site.stop(), outside.stop(), shut.stop()]);
  }
}

test.describe("research browser", () => {
  let browser: Browser;
  let close: () => Promise<void>;
  test.beforeEach(async () => {
    ({ browser, close } = await politeLaunch());
  });
  test.afterEach(async () => {
    await close();
  });

  test("each hop of a redirect, of a page and of a script, waits its turn and is logged", async () => {
    const site = await serve(() => ({
      "/a": redirect("/b"),
      "/b": redirect("/c", 301),
      "/c": html(`C page<script src="/s1"></script>`),
      "/s1": redirect("/s2", 307),
      "/s2": script("window.S2 = 'ran';"),
    }));
    try {
      const { page, log, closed } = await politePage(browser, { url: `${site.base}/a` });
      const res = await page.goto(`${site.base}/a`);
      await expect.poll(() => value(page, "S2")).toBe("ran");

      // The browser ends on the last page, with its text, as before.
      expect(page.url()).toBe(`${site.base}/c`);
      expect(res!.status()).toBe(200);
      expect(await res!.text()).toContain("C page");

      // Each hop went through the gate: logged as sent, with the hop it came from and its status.
      const path = (url?: string) => url?.slice(site.base.length);
      const sent = pages(log).filter((r) => r.sent).map((r) => ({ url: path(r.url), type: r.type, from: path(r.from), status: r.status }));
      expect(sent).toEqual([
        { url: "/robots.txt", type: "robots", from: undefined, status: 404 },
        { url: "/a", type: "document", from: undefined, status: 302 },
        { url: "/b", type: "document", from: "/a", status: 301 },
        { url: "/c", type: "document", from: "/b", status: 200 },
        { url: "/s1", type: "script", from: undefined, status: 307 },
        { url: "/s2", type: "script", from: "/s1", status: 200 },
      ]);
      expect(pages(log).filter((r) => !r.sent)).toEqual([]);
      expect(site.paths()).toEqual(["/robots.txt", "/a", "/b", "/c", "/s1", "/s2"]);

      // Each one left at least PACE_MS after the one before in the log, and well apart at the server.
      expectPaced(log);
      expectPacedAt(site.hits);
      expect([...closed]).toEqual([]);
    } finally {
      await site.stop();
    }
  });

  test("a redirect to a host not allowed is blocked and logged, for a script and for a page", async () => {
    const site = await serve((port) => ({
      "/start": html(`start<script src="/away.js"></script>`),
      "/away.js": redirect(`http://localhost:${port}/x.js`),
      "/leave": redirect(`http://localhost:${port}/landing`),
    }));
    try {
      const { page, log } = await politePage(browser, { url: `${site.base}/start` });
      await page.goto(`${site.base}/start`);
      await expect
        .poll(() => log.find((r) => r.url === `${site.other}/x.js`))
        .toMatchObject({ type: "script", from: `${site.base}/away.js`, sent: false, reason: "host not allowed" });

      await expect(page.goto(`${site.base}/leave`)).rejects.toThrow(/ERR_BLOCKED_BY_CLIENT/);
      expect(log.find((r) => r.url === `${site.other}/landing`)).toMatchObject({ type: "document", from: `${site.base}/leave`, sent: false, reason: "host not allowed" });

      expect(site.hits.map((h) => `${h.host.split(":")[0]} ${h.path}`)).toEqual(["127.0.0.1 /robots.txt", "127.0.0.1 /start", "127.0.0.1 /away.js", "127.0.0.1 /leave"]);
      expectPaced(log);
    } finally {
      await site.stop();
    }
  });

  test("after a 403 the host is closed, and the page's next request to it is blocked before it goes", async () => {
    const site = await serve(() => ({
      "/start": html(`<script>
        fetch("/forbidden")
          .then((r) => { window.FIRST = r.status; return fetch("/after"); })
          .then(() => { window.SECOND = "sent"; }, () => { window.SECOND = "blocked"; });
      </script>`),
      "/forbidden": status(403),
      "/after": status(200),
    }));
    try {
      const { page, log, closed } = await politePage(browser, { url: `${site.base}/start` });
      await page.goto(`${site.base}/start`);
      await expect.poll(() => value(page, "SECOND")).toBe("blocked");
      expect(await value(page, "FIRST")).toBe(403);

      expect(log.find((r) => r.url === `${site.base}/forbidden`)).toMatchObject({ sent: true, status: 403 });
      expect(log.find((r) => r.url === `${site.base}/after`)).toMatchObject({ type: "xhr", sent: false, reason: "closed: 403" });
      expect(Object.fromEntries(closed)).toEqual({ [site.host]: "403" });
      // A new page load on the closed host is blocked too.
      await expect(page.goto(`${site.base}/start`)).rejects.toThrow(/ERR_BLOCKED_BY_CLIENT/);
      expect(site.paths()).toEqual(["/robots.txt", "/start", "/forbidden"]);
      expectPaced(log);
    } finally {
      await site.stop();
    }
  });

  test("a request waits for the answer to the one before it on its host, so a slow 403 still closes the host first", async () => {
    const site = await serve(() => ({
      "/start": html(`<script>
        const go = (path) => fetch(path).then((r) => r.status, () => "blocked");
        Promise.all([go("/slow-forbidden"), go("/next1"), go("/next2")]).then((all) => { window.ALL = all; });
      </script>`),
      "/slow-forbidden": status(403, 3000),
      "/next1": status(200),
      "/next2": status(200),
    }));
    try {
      const { page, log, closed } = await politePage(browser, { url: `${site.base}/start` });
      await page.goto(`${site.base}/start`);
      await expect.poll(() => value(page, "ALL"), { timeout: 20_000 }).toEqual([403, "blocked", "blocked"]);
      expect(Object.fromEntries(closed)).toEqual({ [site.host]: "403" });
      for (const path of ["/next1", "/next2"]) expect(log.find((r) => r.url === `${site.base}${path}`)).toMatchObject({ sent: false, reason: "closed: 403" });
      expect(site.paths()).toEqual(["/robots.txt", "/start", "/slow-forbidden"]);
    } finally {
      await site.stop();
    }
  });

  test("a redirect to a sign-in page is not followed, and closes the host", async () => {
    const site = await serve(() => ({
      "/private": redirect("/account/login?ReturnUrl=%2Fprivate"),
      "/account/login": html("sign in"),
    }));
    try {
      const { page, log, closed } = await politePage(browser, { url: `${site.base}/private` });
      await expect(page.goto(`${site.base}/private`)).rejects.toThrow(/ERR_BLOCKED_BY_CLIENT/);
      expect(log.find((r) => r.url === `${site.base}/private`)).toMatchObject({ sent: true, status: 302 });
      expect(log.find((r) => r.url === `${site.base}/account/login?ReturnUrl=%2Fprivate`)).toMatchObject({
        type: "document",
        from: `${site.base}/private`,
        sent: false,
        reason: "closed: sign-in redirect",
      });
      expect(Object.fromEntries(closed)).toEqual({ [site.host]: "sign-in redirect" });
      expect(site.paths()).toEqual(["/robots.txt", "/private"]);
    } finally {
      await site.stop();
    }
  });

  test("a page's own move to a sign-in page is not followed, and closes the host", async () => {
    const site = await serve(() => ({
      "/start": html(`<script>location.href = "/account/login";</script>`),
      "/account/login": html("sign in"),
    }));
    try {
      const { page, log, closed } = await politePage(browser, { url: `${site.base}/start` });
      await page.goto(`${site.base}/start`);
      await expect.poll(() => log.find((r) => r.url === `${site.base}/account/login`)).toMatchObject({ type: "document", sent: false, reason: "closed: sign-in page" });
      expect(Object.fromEntries(closed)).toEqual({ [site.host]: "sign-in page" });
      expect(site.paths()).toEqual(["/robots.txt", "/start"]);
    } finally {
      await site.stop();
    }
  });

  test("after a dropped connection the host is closed; Chromium sends the dropped request again itself, which is a known limit", async () => {
    const site = await serve(() => ({
      "/start": html(`<script>
        fetch("/drop")
          .catch(() => fetch("/after"))
          .then(() => { window.AFTER = "sent"; }, () => { window.AFTER = "blocked"; });
      </script>`),
      "/drop": (_res, req) => req.socket.destroy(),
      "/after": status(200),
    }));
    try {
      const { page, log, closed } = await politePage(browser, { url: `${site.base}/start` });
      await page.goto(`${site.base}/start`);
      await expect.poll(() => value(page, "AFTER")).toBe("blocked");
      expect(closed.get(site.host)).toMatch(/^dropped \(/);
      expect(log.find((r) => r.url === `${site.base}/after`)).toMatchObject({ sent: false, reason: expect.stringMatching(/^closed: dropped \(/) });
      // The log has one row for /drop. The server got it twice, at once: the keep-alive connection
      // of /start was dropped, and Chromium sent /drop again below the Fetch domain.
      expect(log.filter((r) => r.url === `${site.base}/drop`)).toHaveLength(1);
      expect(site.paths()).toEqual(["/robots.txt", "/start", "/drop", "/drop"]);
      const [, , first, second] = site.hits;
      expect(second!.at - first!.at).toBeLessThan(PACE_MS / 2);
    } finally {
      await site.stop();
    }
  });

  test("a popup the page opens goes through the same gate, its redirect too", async () => {
    const site = await serve(() => ({
      "/start": html(`<script>window.open("/pop1");</script>`),
      "/pop1": redirect("/pop2"),
      "/pop2": html("popup"),
    }));
    try {
      const { page, context, log } = await politePage(browser, { url: `${site.base}/start` });
      const popup = context.waitForEvent("page");
      await page.goto(`${site.base}/start`);
      await (await popup).waitForURL(`${site.base}/pop2`);
      expect(pages(log).map((r) => [r.url.slice(site.base.length), r.from?.slice(site.base.length), r.sent])).toEqual([
        ["/robots.txt", undefined, true],
        ["/start", undefined, true],
        ["/pop1", undefined, true],
        ["/pop2", "/pop1", true],
      ]);
      expectPaced(log);
    } finally {
      await site.stop();
    }
  });

  test("a browser holds one polite page at a time, and its closed hosts and its pace hold from one page to the next", async () => {
    const site = await serve(() => ({ "/ok": html("ok"), "/forbidden": status(403) }));
    try {
      const first = await politePage(browser, { url: site.base });
      await expect(politePage(browser, { url: site.base })).rejects.toThrow(/polite page open/);
      await first.page.goto(`${site.base}/ok`);
      await first.page.goto(`${site.base}/forbidden`);
      await first.context.close();

      const second = await politePage(browser, { url: site.base });
      expect(second.closed).toBe(first.closed);
      await expect(second.page.goto(`${site.base}/ok`)).rejects.toThrow(/ERR_BLOCKED_BY_CLIENT/);
      expect(pages(second.log)).toMatchObject([{ url: `${site.base}/ok`, sent: false, reason: "closed: 403" }]);
      await second.context.close();
      expect(site.paths()).toEqual(["/robots.txt", "/ok", "/forbidden"]);

      // The pace too: a page on another host, opened at once, still waits its turn.
      const other = await serve(() => ({ "/ok": html("ok") }));
      try {
        const third = await politePage(browser, { url: other.base });
        await third.page.goto(`${other.base}/ok`);
        expect(other.hits[0]!.at - site.hits[2]!.at).toBeGreaterThanOrEqual(PACE_MS / 2);
        const lastOfFirst = first.log.filter((r) => r.sent).at(-1)!;
        const firstOfThird = third.log.filter((r) => r.sent)[0]!;
        expect(Date.parse(firstOfThird.at) - Date.parse(lastOfFirst.at)).toBeGreaterThanOrEqual(PACE_MS);
        await third.context.close();
      } finally {
        await other.stop();
      }
    } finally {
      await site.stop();
    }
  });

  test("a request that goes away while it waits is logged as gone, not as sent", async () => {
    const images = Array.from({ length: 6 }, (_, i) => `<img src="/img${i}.png">`).join("");
    const site = await serve(() => ({ "/start": html(images) }));
    try {
      const { page, context, log } = await politePage(browser, { url: site.base });
      await page.goto(`${site.base}/start`, { waitUntil: "domcontentloaded" });
      await context.close();
      await new Promise((r) => setTimeout(r, 3 * PACE_MS));
      // Each row logged as sent reached the server, and nothing reached it unlogged.
      const sent = log.filter((r) => r.sent).map((r) => r.url.slice(site.base.length));
      expect(sent).toEqual(site.paths());
      expect(log.filter((r) => !r.sent).every((r) => r.reason === "gone")).toBe(true);
    } finally {
      await site.stop();
    }
  });

  test("a request that the page aborts after it was sent holds its host for ANSWER_WAIT_MS, a known limit", async () => {
    const site = await serve(() => ({
      "/start": html(`<script>
        const stop = new AbortController();
        fetch("/slow", { signal: stop.signal }).catch(() => {});
        // /slow leaves one turn of the pace after this page; it is aborted well after that.
        setTimeout(() => { stop.abort(); fetch("/next").then((r) => { window.NEXT = r.status; }); }, ${2 * PACE_MS});
      </script>`),
      "/slow": status(200, 8000),
      "/next": status(200),
    }));
    try {
      const { page, log } = await politePage(browser, { url: site.base });
      await page.goto(`${site.base}/start`);
      await expect.poll(() => value(page, "NEXT"), { timeout: ANSWER_WAIT_MS + 5000 }).toBe(200);
      const slow = log.find((r) => r.url === `${site.base}/slow`);
      expect(slow).toMatchObject({ sent: true });
      expect(slow!.status).toBeUndefined();
      const at = (path: string) => site.hits.find((h) => h.path === path)!.at;
      // The aborted /slow brings the gate no answer, so /next waits until ANSWER_WAIT_MS after
      // /slow, though the page let go of /slow after 2 * PACE_MS; then it goes.
      const gap = at("/next") - at("/slow");
      expect(gap).toBeGreaterThanOrEqual(ANSWER_WAIT_MS - PACE_MS / 2);
      expect(gap).toBeLessThan(ANSWER_WAIT_MS + 2 * PACE_MS);
    } finally {
      await site.stop();
    }
  });

  test("the browser's own request for /favicon.ico is blocked before it goes, and logged", async () => {
    const site = await serve(() => ({ "/start": html("start") }));
    try {
      const { page, log } = await politePage(browser, { url: site.base });
      await page.goto(`${site.base}/start`);
      await expect.poll(() => log.find((r) => r.url === `${site.base}/favicon.ico`)).toMatchObject({ sent: false, reason: "favicon" });
      expect(log.filter((r) => r.sent).map((r) => r.url)).toEqual([`${site.base}/robots.txt`, `${site.base}/start`]);
      expect(site.paths()).toEqual(["/robots.txt", "/start"]);
    } finally {
      await site.stop();
    }
  });

  test("the browser's own request for the icon a page names is blocked, at any path, and the page's own image still goes through", async () => {
    const site = await serve(() => ({
      "/start": (res) => {
        res.writeHead(200, { "content-type": "text/html" });
        res.end(`<!doctype html><html><head><link rel="icon" href="/brand/icon.png"></head><body><img src="/brand/other.png"></body></html>`);
      },
    }));
    try {
      const { page, log } = await politePage(browser, { url: site.base });
      await page.goto(`${site.base}/start`);
      await expect.poll(() => log.find((r) => r.url === `${site.base}/brand/icon.png`)).toMatchObject({ sent: false, reason: "favicon" });
      expect(log.find((r) => r.url === `${site.base}/brand/other.png`)).toMatchObject({ type: "image", sent: true });
      expect(site.paths()).toEqual(["/robots.txt", "/start", "/brand/other.png"]);
    } finally {
      await site.stop();
    }
  });

  test("robots.txt: a frame, an image and a worker's fetch on a disallowed path are blocked before they go; an allowed path loads", async () => {
    const site = await serve(() => ({
      "/robots.txt": text("User-agent: *\nDisallow: /private/\n"),
      "/start": html(`<iframe src="/private/x.html"></iframe><img src="/private/a.png"><iframe src="/public/y.html"></iframe><img src="/public/b.png">
        <script>new Worker("/public/w.js");</script>`),
      "/private/x.html": html("private"),
      "/public/y.html": html("public"),
      "/public/b.png": status(200),
      "/public/w.js": script(`fetch("/private/from-worker").catch(() => {});`),
    }));
    try {
      const { page, log, robots } = await politePage(browser, { url: `${site.base}/start` });
      await page.goto(`${site.base}/start`);
      const wanted = ["/private/x.html", "/private/a.png", "/public/y.html", "/public/b.png", "/public/w.js", "/private/from-worker"];
      await expect.poll(() => wanted.filter((p) => log.some((r) => r.url === `${site.base}${p}`)), { timeout: 20_000 }).toEqual(wanted);
      const rule = "robots: Disallow: /private/";
      expect(log.find((r) => r.url === `${site.base}/private/x.html`)).toMatchObject({ type: "document", sent: false, reason: rule });
      expect(log.find((r) => r.url === `${site.base}/private/a.png`)).toMatchObject({ type: "image", sent: false, reason: rule });
      expect(log.find((r) => r.url === `${site.base}/private/from-worker`)).toMatchObject({ sent: false, reason: rule });
      for (const p of ["/public/y.html", "/public/b.png", "/public/w.js"]) expect(log.find((r) => r.url === `${site.base}${p}`)).toMatchObject({ sent: true, status: 200 });
      // The server got robots.txt first, then only the allowed paths.
      expect(site.paths()[0]).toBe("/robots.txt");
      expect(site.paths().slice(1).sort()).toEqual(["/public/b.png", "/public/w.js", "/public/y.html", "/start"]);
      expect(robots.get(site.base)).toMatchObject({
        status: 200,
        rules: [{ allow: false, path: "/private/", text: "Disallow: /private/", line: 2 }],
        text: "User-agent: *\nDisallow: /private/\n",
      });
      expectPaced(log);
      expectPacedAt(site.hits);
    } finally {
      await site.stop();
    }
  });

  test("robots.txt: the first request to each host is its robots.txt, at the pace, and a second polite page does not ask again", async () => {
    const other = await serve(() => ({ "/robots.txt": text("User-agent: *\nAllow: /\n"), "/i.png": status(200) }));
    const site = await serve(() => ({
      "/robots.txt": text("User-agent: *\nAllow: /\n"),
      "/a": html(`a<img src="${other.base}/i.png">`),
      "/b": html("b"),
    }));
    try {
      const first = await politePage(browser, { url: `${site.base}/a`, allow: [other.host] });
      await first.page.goto(`${site.base}/a`);
      await expect.poll(() => other.paths()).toEqual(["/robots.txt", "/i.png"]);
      expect(site.paths()).toEqual(["/robots.txt", "/a"]);
      expect(pages(first.log).map((r) => [r.url, r.type, r.sent, r.status, r.reason])).toEqual([
        [`${site.base}/robots.txt`, "robots", true, 200, "robots"],
        [`${site.base}/a`, "document", true, 200, undefined],
        [`${other.base}/robots.txt`, "robots", true, 200, "robots"],
        [`${other.base}/i.png`, "image", true, 200, undefined],
      ]);
      expectPaced(first.log);
      expectPacedAt([...site.hits, ...other.hits].sort((x, y) => x.at - y.at));
      await first.context.close();

      const second = await politePage(browser, { url: `${site.base}/b`, allow: [other.host] });
      await second.page.goto(`${site.base}/b`);
      expect(site.paths()).toEqual(["/robots.txt", "/a", "/b"]);
      expect(second.log.filter((r) => r.type === "robots")).toEqual([]);
      expect(second.robots).toBe(first.robots);
      expect([...second.robots.keys()]).toEqual([site.base, other.base]);
      await second.context.close();
    } finally {
      await Promise.all([site.stop(), other.stop()]);
    }
  });

  test("robots.txt: a 404 allows everything", async () => {
    const site = await serve(() => ({ "/start": html(`<img src="/img.png">`), "/img.png": status(200) }));
    try {
      const { page, log, robots, blocked } = await politePage(browser, { url: `${site.base}/start` });
      expect(blocked).toBeUndefined();
      await page.goto(`${site.base}/start`);
      await expect.poll(() => site.paths()).toEqual(["/robots.txt", "/start", "/img.png"]);
      expect(robots.get(site.base)).toEqual({ url: `${site.base}/robots.txt`, status: 404, rules: [] });
      expect(pages(log).filter((r) => !r.sent)).toEqual([]);
    } finally {
      await site.stop();
    }
  });

  for (const [name, answer, why, closedAs] of [
    ["a 503 leaves the host alone", status(503), /^robots: unreachable \(503\)$/, undefined],
    ["a dropped connection closes the host", ((_res, req) => req.socket.destroy()) as Answer, /^closed: dropped \(/, /^dropped \(/],
    ["a 403 closes the host", status(403), /^closed: 403$/, /^403$/],
    ["a redirect to a sign-in page closes the host", redirect("/account/login?ReturnUrl=%2Frobots.txt"), /^closed: sign-in redirect$/, /^sign-in redirect$/],
  ] as const) {
    test(`robots.txt: ${name}; nothing but robots.txt is asked for`, async () => {
      const site = await serve(() => ({ "/robots.txt": answer, "/start": html("start"), "/account/login": html("sign in") }));
      try {
        const { page, log, closed, blocked } = await politePage(browser, { url: `${site.base}/start` });
        expect(blocked).toMatch(why);
        await expect(page.goto(`${site.base}/start`)).rejects.toThrow(/ERR_BLOCKED_BY_CLIENT/);
        expect(log[0]).toMatchObject({ url: `${site.base}/robots.txt`, type: "robots", sent: true });
        expect(log.find((r) => r.url === `${site.base}/start`)).toMatchObject({ sent: false, reason: expect.stringMatching(why) });
        if (closedAs) expect(closed.get(site.host)).toMatch(closedAs);
        else expect(closed.has(site.host)).toBe(false);
        // Only robots.txt; after a dropped keep-alive connection Chromium may send it again by itself (see the limits).
        expect(new Set(site.paths())).toEqual(new Set(["/robots.txt"]));
      } finally {
        await site.stop();
      }
    });
  }

  test("robots.txt: the browser itself asks for it, with its own headers", async () => {
    const site = await serve(() => ({ "/robots.txt": text("User-agent: *\nAllow: /\n") }));
    try {
      await politePage(browser, { url: `${site.base}/start` });
      expect(site.hits.map((h) => h.path)).toEqual(["/robots.txt"]);
      const headers = site.hits[0]!.headers;
      expect(headers["user-agent"]).toMatch(/Chrome\/\d/);
      expect(headers["sec-fetch-dest"]).toBe("document");
      expect(headers["sec-fetch-mode"]).toBe("navigate");
    } finally {
      await site.stop();
    }
  });

  for (const [name, theirs] of [
    ["is unreachable", status(503)],
    ["disallows the target", text("User-agent: *\nDisallow: /private/\n")],
  ] as const) {
    test(`robots.txt: a redirect to another host whose robots.txt ${name} is not followed, and leaves the first host alone`, async () => {
      const other = await serve(() => ({ "/robots.txt": theirs, "/private/x": text("User-agent: *\nAllow: /\n") }));
      const site = await serve(() => ({ "/robots.txt": redirect(`${other.base}/private/x`), "/start": html("start") }));
      try {
        const { log, blocked } = await politePage(browser, { url: `${site.base}/start`, allow: [other.host] });
        expect(blocked).toMatch(new RegExp(`^robots: unreachable \\(redirect to ${other.base}/private/x, `));
        expect(site.paths()).toEqual(["/robots.txt"]);
        expect(other.paths()).toEqual(["/robots.txt"]);
        expect(log.find((r) => r.url === `${other.base}/private/x`)).toMatchObject({ type: "robots", from: `${site.base}/robots.txt`, sent: false });
        expectPaced(log);
      } finally {
        await Promise.all([site.stop(), other.stop()]);
      }
    });
  }

  test("robots.txt: a redirect to another host's robots.txt takes that host's answer for both, asked for once", async () => {
    const other = await serve(() => ({ "/robots.txt": text("User-agent: *\nDisallow: /x\n") }));
    const site = await serve(() => ({ "/robots.txt": redirect(`${other.base}/robots.txt`), "/x": html("x"), "/y": html("y") }));
    try {
      const { page, robots, blocked } = await politePage(browser, { url: `${site.base}/x`, allow: [other.host] });
      expect(blocked).toBe("robots: Disallow: /x");
      await page.goto(`${site.base}/y`);
      expect(site.paths()).toEqual(["/robots.txt", "/y"]);
      expect(other.paths()).toEqual(["/robots.txt"]);
      expect(robots.get(site.base)).toMatchObject({ url: `${site.base}/robots.txt`, status: 200, rules: [{ path: "/x" }] });
      expect(robots.get(other.base)).toMatchObject({ url: `${other.base}/robots.txt`, status: 200, rules: [{ path: "/x" }] });
    } finally {
      await Promise.all([site.stop(), other.stop()]);
    }
  });

  test("robots.txt: a redirect to another host's robots.txt is allowed even when that file's own rules would disallow it", async () => {
    // RFC 9309, 2.2.2: /robots.txt is always allowed. As with http://h redirecting to https://h.
    const other = await serve(() => ({ "/robots.txt": text("User-agent: *\nDisallow: /*.txt$\n") }));
    const site = await serve(() => ({ "/robots.txt": redirect(`${other.base}/robots.txt`), "/page": html("page") }));
    try {
      const { page, blocked, robots } = await politePage(browser, { url: `${site.base}/page`, allow: [other.host] });
      expect(blocked).toBeUndefined();
      await page.goto(`${site.base}/page`);
      expect(site.paths()).toEqual(["/robots.txt", "/page"]);
      expect(other.paths()).toEqual(["/robots.txt"]);
      expect(robots.get(site.base)).toMatchObject({ status: 200, rules: [{ path: "/*.txt$" }] });
    } finally {
      await Promise.all([site.stop(), other.stop()]);
    }
  });

  test("robots.txt: a redirect on within another host is checked against that host's robots.txt, read on the first hop", async () => {
    const other = await serve(() => ({ "/robots.txt": text("User-agent: *\nDisallow: /private/\n"), "/ok": redirect("/private/x"), "/private/x": text("User-agent: *\nAllow: /\n") }));
    const site = await serve(() => ({ "/robots.txt": redirect(`${other.base}/ok`), "/start": html("start") }));
    try {
      const { log, blocked } = await politePage(browser, { url: `${site.base}/start`, allow: [other.host] });
      expect(blocked).toBe(`robots: unreachable (redirect to ${other.base}/private/x, robots: Disallow: /private/)`);
      expect(other.paths()).toEqual(["/robots.txt", "/ok"]);
      expect(log.find((r) => r.url === `${other.base}/private/x`)).toMatchObject({ type: "robots", from: `${other.base}/ok`, sent: false, reason: "robots: Disallow: /private/" });
    } finally {
      await Promise.all([site.stop(), other.stop()]);
    }
  });

  test("robots.txt: a file cut at 500 KiB loses its partial last line, so a cut Allow line allows nothing", async () => {
    const head = "User-agent: *\nDisallow: /\n";
    const cut = "Allow: /pub";
    const filler = `#${"x".repeat(ROBOTS_MAX_BYTES - head.length - cut.length - 2)}\n`;
    const site = await serve(() => ({ "/robots.txt": text(`${head}${filler}Allow: /public-page\n# more\n`) }));
    try {
      const { blocked, robots } = await politePage(browser, { url: `${site.base}/publicity` });
      expect(blocked).toBe("robots: Disallow: /");
      expect(robots.get(site.base)!.text!.length).toBe(head.length + filler.length);
    } finally {
      await site.stop();
    }
  });

  test("robots.txt: a request still waiting its turn when the context closes asks for nothing, robots.txt included", async () => {
    const other = await serve(() => ({ "/robots.txt": text("User-agent: *\nAllow: /\n"), "/late.png": status(200) }));
    const images = Array.from({ length: 4 }, (_, i) => `<img src="/img${i}.png">`).join("");
    const site = await serve(() => ({ "/start": html(`${images}<img src="${other.base}/late.png">`) }));
    try {
      const { page, context, log } = await politePage(browser, { url: site.base, allow: [other.host] });
      await page.goto(`${site.base}/start`, { waitUntil: "domcontentloaded" });
      await expect.poll(() => log.some((r) => r.url === `${site.base}/img0.png`)).toBe(true);
      await context.close();
      await new Promise((r) => setTimeout(r, 7 * PACE_MS));
      expect(other.paths()).toEqual([]);
      expect(log.filter((r) => r.url.startsWith(other.base))).toMatchObject([{ url: `${other.base}/late.png`, sent: false, reason: "gone" }]);
    } finally {
      await Promise.all([site.stop(), other.stop()]);
    }
  });

  test("robots.txt: a redirect is followed at the pace within the hosts allowed; one to a host not allowed leaves the host alone", async () => {
    const site = await serve(() => ({
      "/robots.txt": redirect("/robots-moved.txt", 301),
      "/robots-moved.txt": text("User-agent: *\nDisallow: /no/\n"),
      "/yes": html("yes"),
      "/no/x": html("no"),
    }));
    try {
      const { page, context, log, robots } = await politePage(browser, { url: `${site.base}/yes` });
      await page.goto(`${site.base}/yes`);
      await expect(page.goto(`${site.base}/no/x`)).rejects.toThrow(/ERR_BLOCKED_BY_CLIENT/);
      expect(pages(log).map((r) => [r.url.slice(site.base.length), r.from?.slice(site.base.length), r.sent, r.reason])).toEqual([
        ["/robots.txt", undefined, true, "robots"],
        ["/robots-moved.txt", "/robots.txt", true, "robots"],
        ["/yes", undefined, true, undefined],
        ["/no/x", undefined, false, "robots: Disallow: /no/"],
      ]);
      expect(robots.get(site.base)).toMatchObject({ status: 200, rules: [{ path: "/no/" }] });
      expect(site.paths()).toEqual(["/robots.txt", "/robots-moved.txt", "/yes"]);
      expectPaced(log);
      expectPacedAt(site.hits);
      await context.close();
    } finally {
      await site.stop();
    }

    const away = await serve((port) => ({ "/robots.txt": redirect(`http://localhost:${port}/robots.txt`), "/start": html("start") }));
    try {
      const { blocked, log } = await politePage(browser, { url: `${away.base}/start` });
      expect(blocked).toBe("robots: unreachable (redirect to a host not allowed: localhost:" + away.host.split(":")[1] + ")");
      expect(log.find((r) => r.url === `${away.other}/robots.txt`)).toMatchObject({ type: "robots", sent: false, reason: "host not allowed" });
      expect(away.hits.map((h) => `${h.host.split(":")[0]} ${h.path}`)).toEqual(["127.0.0.1 /robots.txt"]);
    } finally {
      await away.stop();
    }
  });

  test("robots.txt: a url that robots.txt disallows is reported by politePage(), and nothing but robots.txt is asked for", async () => {
    const site = await serve(() => ({ "/robots.txt": text("User-agent: *\nDisallow: /private\n"), "/private/page": html("private") }));
    try {
      const { page, log, blocked } = await politePage(browser, { url: `${site.base}/private/page` });
      expect(blocked).toBe("robots: Disallow: /private");
      await expect(page.goto(`${site.base}/private/page`)).rejects.toThrow(/ERR_BLOCKED_BY_CLIENT/);
      expect(pages(log).map((r) => [r.url.slice(site.base.length), r.sent, r.reason])).toEqual([
        ["/robots.txt", true, "robots"],
        ["/private/page", false, "robots: Disallow: /private"],
      ]);
      expect(site.paths()).toEqual(["/robots.txt"]);
    } finally {
      await site.stop();
    }
  });

  test("robots.txt: a host whose robots.txt disallows / for ClaudeBot alone is not asked for its page", async () => {
    const site = await serve(() => ({ "/robots.txt": text("User-agent: *\nAllow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n"), "/start": html("start") }));
    try {
      const { page, log, blocked } = await politePage(browser, { url: `${site.base}/start` });
      expect(blocked).toBe("robots: Disallow: / (User-agent: ClaudeBot)");
      await expect(page.goto(`${site.base}/start`)).rejects.toThrow(/ERR_BLOCKED_BY_CLIENT/);
      expect(log.find((r) => r.url === `${site.base}/start`)).toMatchObject({ sent: false, reason: "robots: Disallow: / (User-agent: ClaudeBot)" });
      expect(site.paths()).toEqual(["/robots.txt"]);
    } finally {
      await site.stop();
    }
  });

  test("robots.txt: a group for a product in the browser's own User-Agent (Chrome) applies", async () => {
    const site = await serve(() => ({ "/robots.txt": text("User-agent: Chrome\nDisallow: /c/\n"), "/start": html(`<img src="/c/i.png"><img src="/ok.png">`), "/ok.png": status(200) }));
    try {
      const { page, log } = await politePage(browser, { url: `${site.base}/start` });
      await page.goto(`${site.base}/start`);
      await expect.poll(() => log.find((r) => r.url === `${site.base}/c/i.png`)).toMatchObject({ type: "image", sent: false, reason: "robots: Disallow: /c/ (User-agent: Chrome)" });
      await expect.poll(() => site.paths()).toEqual(["/robots.txt", "/start", "/ok.png"]);
    } finally {
      await site.stop();
    }
  });

  for (const how of SPECULATION) {
    test(`speculation rules from ${how} prefetch and prerender nothing in a browser from politeLaunch()`, async () => {
      // The browser still reads the header's rule file, through the gate, but acts on none of its rules.
      const site = how === "the Speculation-Rules header" ? ["/robots.txt", "/page", "/rules.json"] : ["/robots.txt", "/page"];
      expect(await speculate(browser, how)).toEqual({ site, outside: [], outsideConnections: 0, shut: ["/robots.txt", "/forbidden"] });
    });
  }

  test("WebRTC and WebTransport are gone from every page and frame, so they reach no STUN, TURN or QUIC server, over UDP or TCP", async () => {
    const udp = dgram.createSocket("udp4");
    let packets = 0;
    udp.on("message", () => packets++);
    await new Promise<void>((done) => udp.bind(0, "127.0.0.1", done));
    let connections = 0;
    const tcp = net.createServer((socket) => {
      connections++;
      socket.on("error", () => {});
    });
    await new Promise<void>((done) => tcp.listen(0, "127.0.0.1", done));
    const servers = [
      { urls: `stun:127.0.0.1:${(udp.address() as AddressInfo).port}` },
      { urls: `turn:127.0.0.1:${(tcp.address() as AddressInfo).port}?transport=tcp`, username: "u", credential: "c" },
    ];
    const made = (code: string) => `(() => { try { ${code}; return "made"; } catch { return "none"; } })()`;
    const connect = (where: string, relay: boolean) =>
      made(
        `const pc = new ${where}RTCPeerConnection({ iceServers: ${JSON.stringify(servers)}${relay ? `, iceTransportPolicy: "relay"` : ""} });` +
          ` pc.createDataChannel("x"); pc.createOffer().then((o) => pc.setLocalDescription(o))`,
      );
    // WebTransport sends QUIC over UDP: the UDP socket would count its packets.
    const quic = made(`const t = new WebTransport("https://127.0.0.1:${(udp.address() as AddressInfo).port}/"); t.ready.catch(() => {}); t.closed.catch(() => {})`);
    const site = await serve(() => ({
      "/start": html(`<script>
        window.out = {};
        out.direct = ${connect("", false)};
        out.relay = ${connect("", true)};
        out.quic = ${quic};
        const blank = document.body.appendChild(document.createElement("iframe"));
        out.blankRelay = ${connect("blank.contentWindow.", true)};
        out.blank = [typeof blank.contentWindow.webkitRTCPeerConnection, typeof blank.contentWindow.WebTransport];
        const srcdoc = document.createElement("iframe");
        srcdoc.srcdoc = "<p>frame</p>";
        srcdoc.onload = () => { out.srcdoc = [typeof srcdoc.contentWindow.RTCPeerConnection, typeof srcdoc.contentWindow.WebTransport]; };
        document.body.appendChild(srcdoc);
        const worker = new Worker(URL.createObjectURL(new Blob(["postMessage([typeof RTCPeerConnection, typeof WebTransport])"])));
        worker.onmessage = (e) => { out.worker = e.data; };
      </script>`),
    }));
    try {
      const { page } = await politePage(browser, { url: site.base });
      await page.goto(`${site.base}/start`);
      await expect.poll(() => value(page, "out")).toEqual({
        direct: "none",
        relay: "none",
        quic: "none",
        blankRelay: "none",
        blank: ["undefined", "undefined"],
        srcdoc: ["undefined", "undefined"],
        // A limit, pinned: a worker has no WebRTC, but it still has WebTransport (see polite.mjs).
        worker: ["undefined", "function"],
      });
      await page.waitForTimeout(3000);
      expect({ packets, connections }).toEqual({ packets: 0, connections: 0 });
    } finally {
      udp.close();
      tcp.close();
      await site.stop();
    }
  });
});

// A limit, pinned: in a browser that politeLaunch() did not start (Playwright's default headless
// shell), speculation rules prefetch past the gate, to any host, even a closed one.
test("research browser: in a plain browser, speculation rules still prefetch outside the gate (a known limit)", async () => {
  const browser = await chromium.launch();
  try {
    const seen = await speculate(browser, "a list in the page");
    expect(seen.site).toContain("/same-host");
    expect(seen.outside).toContain("/not-allowed");
    expect(seen.shut).toContain("/closed-host");
  } finally {
    await browser.close();
  }
});

test("research browser: a launch that fails leaves no profile behind", async () => {
  // os.tmpdir() reads these at each call; the tests of one worker run one at a time.
  const names = ["TMPDIR", "TMP", "TEMP"] as const;
  const saved = names.map((n) => process.env[n]);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "polite-spec-"));
  for (const n of names) process.env[n] = tmp;
  try {
    await expect(politeLaunch({ executablePath: path.join(tmp, "no-browser") })).rejects.toThrow();
    expect(fs.readdirSync(tmp).filter((name) => name.startsWith("polite-profile-"))).toEqual([]);
  } finally {
    names.forEach((n, i) => (saved[i] === undefined ? delete process.env[n] : (process.env[n] = saved[i])));
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("research browser: what counts as a sign-in page", () => {
  for (const url of [
    "https://login.microsoftonline.com/common/oauth2/authorize?client_id=x",
    "https://example.ac.nz/idp/profile/SAML2/Redirect/SSO",
    "https://example.ac.nz/cas/login?service=https%3A%2F%2Fexample.ac.nz%2F",
    "https://example.ac.nz/Account/Login.aspx?ReturnUrl=%2F",
    "https://example.ac.nz/x?SAMLRequest=abc",
  ])
    expect(isSignIn(url), url).toBe(true);
  for (const url of [
    "https://example.ac.nz/",
    "https://example.ac.nz/en/",
    "https://example.ac.nz/authors/list",
    "https://example.ac.nz/maps/sso-guide.pdf",
    "https://www.example.ac.nz/timetable?term=1",
  ])
    expect(isSignIn(url), url).toBe(false);
});
