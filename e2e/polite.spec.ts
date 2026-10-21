// The research browser (scripts/research/polite.mjs) keeps to "Snapshot once" and "Closed is a
// verdict" for every request, the hops of a redirect too. These tests do not use the site. Each one
// starts a server of its own on 127.0.0.1 and a browser of its own, and asks no other host.
// They are here and not in tests/ because the CI job that runs vitest has no browser installed.
import http from "node:http";
import type { AddressInfo } from "node:net";
import { chromium, expect, test, type Browser, type Page } from "@playwright/test";
import { PACE_MS, isSignIn, politePage, type PoliteRow } from "../scripts/research/polite.mjs";

type Answer = (res: http.ServerResponse, req: http.IncomingMessage) => void;
interface Hit {
  host: string;
  path: string;
  at: number;
}

/**
 * A server on 127.0.0.1 that answers by path. `pages` gets the port, so that a page can name
 * http://localhost:<port>, which is the same server under a host that is not allowed: a request
 * that got there would show in `hits`. Every request the server gets is recorded in `hits`.
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
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const port = (server.address() as AddressInfo).port;
  answers = pages(port);
  return {
    hits,
    base: `http://127.0.0.1:${port}`,
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
  (body: string): Answer =>
  (res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(`<!doctype html><html><body>${body}</body></html>`);
  };
const script =
  (code: string): Answer =>
  (res) => {
    res.writeHead(200, { "content-type": "text/javascript" });
    res.end(code);
  };
const status =
  (code: number): Answer =>
  (res) => {
    res.writeHead(code, { "content-type": "text/plain" });
    res.end(String(code));
  };

/** The gaps in milliseconds between one time and the next. */
const gaps = (times: number[]) => times.slice(1).map((t, i) => t - times[i]!);
const sentTimes = (log: PoliteRow[]) => log.filter((r) => r.sent).map((r) => Date.parse(r.at));
const expectPaced = (log: PoliteRow[]) => {
  for (const gap of gaps(sentTimes(log))) expect(gap).toBeGreaterThanOrEqual(PACE_MS);
};
/** A global that the page's own script set. */
const value = (page: Page, name: string) => page.evaluate((n) => (window as unknown as Record<string, unknown>)[n], name);

let browser: Browser;
test.beforeEach(async () => {
  browser = await chromium.launch();
});
test.afterEach(async () => {
  await browser.close();
});

test("research browser: each hop of a redirect, of a page and of a script, waits its turn and is logged", async () => {
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
    expect(site.hits.map((h) => h.path)).toEqual(["/a", "/b", "/c", "/s1", "/s2"]);

    // Each one left at least PACE_MS after the one before in the log, and at least a second after
    // it at the server. A hop that the browser followed by itself would come at once.
    expectPaced(log);
    for (const gap of gaps(site.hits.map((h) => h.at))) expect(gap).toBeGreaterThanOrEqual(1000);
    expect([...closed]).toEqual([]);
  } finally {
    await site.stop();
  }
});

test("research browser: a redirect to a host not allowed is blocked and logged, for a script and for a page", async () => {
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

test("research browser: after a 403 the host is closed, and the page's next request to it is blocked before it goes", async () => {
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
    expect(Object.fromEntries(closed)).toEqual({ [new URL(site.base).host]: "403" });
    // A new page load on the closed host is blocked too.
    await expect(page.goto(`${site.base}/start`)).rejects.toThrow(/ERR_BLOCKED_BY_CLIENT/);
    expect(site.hits.map((h) => h.path)).toEqual(["/start", "/forbidden"]);
    expectPaced(log);
  } finally {
    await site.stop();
  }
});

test("research browser: a redirect to a sign-in page is not followed, and closes the host", async () => {
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
    expect(Object.fromEntries(closed)).toEqual({ [new URL(site.base).host]: "sign-in redirect" });
    expect(site.hits.map((h) => h.path)).toEqual(["/private"]);
  } finally {
    await site.stop();
  }
});

test("research browser: after a dropped connection the host is closed", async () => {
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
    expect(closed.get(new URL(site.base).host)).toMatch(/^dropped \(/);
    expect(log.find((r) => r.url === `${site.base}/after`)).toMatchObject({ sent: false, reason: expect.stringMatching(/^closed: dropped \(/) });
    expect(site.hits.map((h) => h.path)).not.toContain("/after");
  } finally {
    await site.stop();
  }
});

test("research browser: a popup the page opens goes through the same gate, its redirect too", async () => {
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

test("research browser: a browser holds one polite page at a time", async () => {
  const first = await politePage(browser, { url: "http://127.0.0.1:9/" });
  await expect(politePage(browser, { url: "http://127.0.0.1:9/" })).rejects.toThrow(/polite page open/);
  await first.context.close();
  const second = await politePage(browser, { url: "http://127.0.0.1:9/" });
  await second.context.close();
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
