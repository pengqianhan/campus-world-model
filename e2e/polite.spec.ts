// The research browser (scripts/research/polite.mjs) keeps to "Snapshot once" and "Closed is a
// verdict" for every request it sees, the hops of a redirect too. These tests do not use the site.
// The browser tests each launch a browser of their own and start servers of their own on
// 127.0.0.1 (one, or three for speculation rules), and ask no other host.
// They are here and not in tests/ because the CI job that runs vitest has no browser installed.
import dgram from "node:dgram";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { chromium, expect, test, type Browser, type Page } from "@playwright/test";
import { PACE_MS, POLITE_ARGS, isSignIn, politePage, type PoliteRow } from "../scripts/research/polite.mjs";

type Answer = (res: http.ServerResponse, req: http.IncomingMessage) => void;
interface Hit {
  host: string;
  path: string;
  at: number;
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
    hits.push({ host: req.headers.host ?? "", path, at: Date.now() });
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
const expectPaced = (log: PoliteRow[]) => {
  for (const gap of gaps(sentTimes(log))) expect(gap).toBeGreaterThanOrEqual(PACE_MS);
};
/** At the server the gaps can be a little shorter than in the log, on a busy machine; a hop that escaped would come at once. */
const expectPacedAt = (hits: Hit[]) => {
  for (const gap of gaps(hits.map((h) => h.at))) expect(gap).toBeGreaterThanOrEqual(PACE_MS / 2);
};
/** A global that the page's own script set. */
const value = (page: Page, name: string) => page.evaluate((n) => (window as unknown as Record<string, unknown>)[n], name);

test.describe("research browser", () => {
  let browser: Browser;
  test.beforeEach(async () => {
    browser = await chromium.launch({ args: POLITE_ARGS });
  });
  test.afterEach(async () => {
    await browser.close();
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
      const sent = log.filter((r) => r.sent).map((r) => ({ url: path(r.url), type: r.type, from: path(r.from), status: r.status }));
      expect(sent).toEqual([
        { url: "/a", type: "document", from: undefined, status: 302 },
        { url: "/b", type: "document", from: "/a", status: 301 },
        { url: "/c", type: "document", from: "/b", status: 200 },
        { url: "/s1", type: "script", from: undefined, status: 307 },
        { url: "/s2", type: "script", from: "/s1", status: 200 },
      ]);
      expect(log.filter((r) => !r.sent)).toEqual([]);
      expect(site.paths()).toEqual(["/a", "/b", "/c", "/s1", "/s2"]);

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

      expect(site.hits.map((h) => `${h.host.split(":")[0]} ${h.path}`)).toEqual(["127.0.0.1 /start", "127.0.0.1 /away.js", "127.0.0.1 /leave"]);
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
      expect(site.paths()).toEqual(["/start", "/forbidden"]);
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
      expect(site.paths()).toEqual(["/start", "/slow-forbidden"]);
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
      expect(site.paths()).toEqual(["/private"]);
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
      expect(site.paths()).toEqual(["/start"]);
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
      expect(site.paths()).toEqual(["/start", "/drop", "/drop"]);
      const [, first, second] = site.hits;
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
      expect(log.map((r) => [r.url.slice(site.base.length), r.from?.slice(site.base.length), r.sent])).toEqual([
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
      expect(second.log).toMatchObject([{ url: `${site.base}/ok`, sent: false, reason: "closed: 403" }]);
      await second.context.close();
      expect(site.paths()).toEqual(["/ok", "/forbidden"]);

      // The pace too: a page on another host, opened at once, still waits its turn.
      const other = await serve(() => ({ "/ok": html("ok") }));
      try {
        const third = await politePage(browser, { url: other.base });
        await third.page.goto(`${other.base}/ok`);
        expect(other.hits[0]!.at - site.hits[1]!.at).toBeGreaterThanOrEqual(PACE_MS / 2);
        expect(Date.parse(third.log[0]!.at) - Date.parse(first.log[1]!.at)).toBeGreaterThanOrEqual(PACE_MS);
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

  // Speculation rules make Chromium prefetch and prerender outside the Fetch domain. Each case
  // names three pages: another path on the page's own host (it would go out at once, unpaced), a
  // host not allowed, and a host closed by a 403. None of them may reach a server.
  for (const how of ["a list in the page", "the Speculation-Rules header", "a rule that the page's script adds"] as const) {
    test(`speculation rules from ${how} are removed, so nothing is prefetched or prerendered`, async () => {
      let rules = "";
      const ruleScript = () =>
        `const a = document.createElement("script"); a.type = "speculationrules"; a.textContent = ${JSON.stringify(rules)}; document.head.append(a);` +
        `const b = document.createElement("script"); b.setAttribute("type", "speculationrules"); b.textContent = ${JSON.stringify(rules)}; document.head.append(b);`;
      const site = await serve(() => ({
        "/page": (res, req) =>
          ({
            "a list in the page": html(`list<script type="speculationrules">${rules}</script>`),
            "the Speculation-Rules header": html("header", { "speculation-rules": '"/rules.json"' }),
            "a rule that the page's script adds": html(`script<script>${ruleScript()}</script>`),
          })[how](res, req),
        "/rules.json": (res) => {
          res.writeHead(200, { "content-type": "application/speculationrules+json" });
          res.end(rules);
        },
      }));
      const outside = await serve(() => ({}));
      const shut = await serve(() => ({ "/forbidden": status(403) }));
      const urls = [`${site.base}/same-host`, `${outside.base}/not-allowed`, `${shut.base}/closed-host`];
      rules = JSON.stringify({
        prefetch: [{ source: "list", urls }],
        prerender: [{ source: "list", urls: urls.map((u) => `${u}?prerender`) }],
      });
      try {
        const { page, log } = await politePage(browser, { url: site.base, allow: [shut.host] });
        await page.goto(`${shut.base}/forbidden`);
        await page.goto(`${site.base}/page`);
        await page.waitForTimeout(3000);
        expect(site.paths()).toEqual(["/page"]);
        expect(shut.paths()).toEqual(["/forbidden"]);
        expect(outside.hits).toEqual([]);
        expect(outside.connections()).toBe(0);
        if (how !== "a rule that the page's script adds") expect(log.find((r) => r.url === `${site.base}/page`)?.note).toMatch(/removed/);
      } finally {
        await Promise.all([site.stop(), outside.stop(), shut.stop()]);
      }
    });
  }

  test("with POLITE_ARGS, WebRTC sends nothing to a STUN server", async () => {
    const udp = dgram.createSocket("udp4");
    let packets = 0;
    udp.on("message", () => packets++);
    await new Promise<void>((done) => udp.bind(0, "127.0.0.1", done));
    const stun = `stun:127.0.0.1:${(udp.address() as AddressInfo).port}`;
    const site = await serve(() => ({
      "/start": html(`<script>
        const pc = new RTCPeerConnection({ iceServers: [{ urls: ${JSON.stringify(stun)} }] });
        pc.createDataChannel("x");
        pc.createOffer().then((o) => pc.setLocalDescription(o));
      </script>`),
    }));
    try {
      const { page } = await politePage(browser, { url: site.base });
      await page.goto(`${site.base}/start`);
      await page.waitForTimeout(3000);
      expect(packets).toBe(0);
    } finally {
      udp.close();
      await site.stop();
    }
  });
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
