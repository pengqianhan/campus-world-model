import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { allowed, type Deps, redact, runBatch, runLedger, takeLock } from "../scripts/lib/landmark-fetch.ts";
import { type FetchOptions, HttpError } from "../scripts/lib/snapshot.ts";

const KEY = "AIzaTestKeyNotReal";
const SESSION = "testSessionToken123";
const env = { ...process.env };
afterEach(() => {
  process.env = { ...env };
});

/** A batch's outside world with nothing cached yet, and a ledger that allows all. */
function fake(over: Partial<Deps> = {}) {
  const sent: FetchOptions[] = [];
  const ledger: string[] = [];
  const cached = new Set<string>();
  let verdict: string | undefined;
  const d: Deps = {
    allowFetch: false,
    has: (file) => cached.has(file),
    read: () => {
      throw new Error("not read in these tests");
    },
    get: async (o) => {
      allowed(o.url);
      sent.push(o);
      cached.add(o.file);
      const expiry = String(Math.round(Date.now() / 1000) + 86_400);
      return Buffer.from(o.url.endsWith("createSession") ? JSON.stringify({ session: SESSION, expiry }) : "{}");
    },
    ledger: (verb, n) => {
      ledger.push(`${verb} ${n}`);
      return true;
    },
    recordTiles: () => {},
    closed: () => verdict,
    close: (why) => {
      verdict = why;
    },
    ...over,
  };
  return { d, sent, ledger };
}
const tiles = [
  { pano: "abcDEF_-1234567890abcd", zoom: 5, x: 3, y: 4 },
  { pano: "abcDEF_-1234567890abcd", zoom: 5, x: 4, y: 4 },
];

describe("the landmark pipeline's fetches", () => {
  it("let through only the two LINZ buckets and the Street View calls the pipeline makes", () => {
    expect(allowed("https://opentopography.s3.sdsc.edu/pc-bulk/NZ24_Auckland/CL2_BA32_2024_1000_3603.laz")).toEqual({
      source: "linz-lidar",
      file: "landmarks/lidar/NZ24_Auckland/CL2_BA32_2024_1000_3603.laz",
    });
    expect(allowed("https://tile.googleapis.com/v1/streetview/tiles/5/3/4?session=S&panoId=P").source).toBe("streetview");
    for (const url of [
      "https://tile.googleapis.com/v1/streetview/thumbnail?session=S&panoId=P",
      "https://tile.googleapis.com/v1/2dtiles/1/2/3?session=S",
      "https://tile.googleapis.com/v1/3dtiles/root.json",
      "https://tile.googleapis.com/v1/streetview/tiles/5/3/../4",
      "http://tile.googleapis.com/v1/createSession",
      "https://opentopography.s3.sdsc.edu/pc-bulk/NZ24_Northland/CL2_AU28_2024_1000_0101.laz",
      "https://opentopography.s3.sdsc.edu/pc-bulk/NZ24_Auckland/../NZ24_Northland/a.laz",
      "https://opentopography.s3.sdsc.edu/pc-bulk/NZ24_Auckland/..",
      "https://opentopography.s3.sdsc.edu/pc-bulk/NZ24_Auckland/a.laz?x=1",
      "https://example.com/v1/streetview/tiles/5/3/4",
    ]) {
      expect(() => allowed(url), url).toThrow(/not a host or path the landmark pipeline fetches/);
    }
  });

  it("send nothing for a file outside the buckets", async () => {
    const { d, sent } = fake();
    await expect(runBatch([{ op: "file", url: "https://example.com/a.laz" }], d)).rejects.toThrow(/not a host or path/);
    expect(sent).toEqual([]);
  });

  it("buy no tile without ALLOW_FETCH, and count the ones missing", async () => {
    const { d, sent, ledger } = fake();
    const [r] = await runBatch([{ op: "tiles", tiles: [...tiles, tiles[0]!] }], d);
    expect(r).toMatchObject({ paths: [null, null, null], sent: 0 });
    expect(sent).toEqual([]);
    expect(ledger).toEqual([]);
  });

  it("buy no tile when the ledger script's check fails", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-"));
    const script = path.join(dir, "ledger.py");
    // A fake ledger: writes down how it was called, and refuses every check.
    fs.writeFileSync(
      script,
      "import sys\nopen(sys.argv[0] + '.calls', 'a').write(' '.join(sys.argv[1:]) + '\\n')\nsys.exit(1 if sys.argv[1] == 'check' else 0)\n",
    );
    process.env.GMAPS_BUDGET = script;
    process.env.PY = process.platform === "win32" ? "python" : "python3";
    const { d, sent } = fake({ allowFetch: true, ledger: runLedger });
    await expect(runBatch([{ op: "tiles", tiles }], d)).rejects.toThrow(/does not allow 2 more tiles: none bought/);
    expect(sent).toEqual([]);
    expect(fs.readFileSync(`${script}.calls`, "utf8").trim()).toBe("check 2");
  });

  it("stop before any tile when no ledger is given", async () => {
    delete process.env.GMAPS_BUDGET;
    const { d, sent } = fake({ allowFetch: true, ledger: runLedger });
    await expect(runBatch([{ op: "tiles", tiles }], d)).rejects.toThrow(/GMAPS_BUDGET is not set/);
    expect(sent).toEqual([]);
  });

  /** Tile requests let through, and how many tiles the ledger had counted at each. */
  function counting(d: Deps, ledger: string[], fail: (n: number) => Error | undefined) {
    const at: { n: number; counted: number }[] = [];
    const get = d.get;
    d.get = async (o) => {
      if (!o.url.includes("/tiles/")) return get(o);
      const counted = ledger.filter((l) => l.startsWith("add ")).reduce((a, l) => a + Number(l.slice(4)), 0);
      at.push({ n: at.length + 1, counted });
      const e = fail(at.length);
      if (e) throw e;
      return get(o);
    };
    return at;
  }

  it("count every tile in the ledger before it is sent, so a killed batch never counts too few", async () => {
    process.env.GOOGLE_MAPS_KEY = KEY;
    const many = Array.from({ length: 60 }, (_, i) => ({ pano: tiles[0]!.pano, zoom: 5, x: i % 32, y: Math.floor(i / 32) }));
    const { d, ledger } = fake({ allowFetch: true });
    const at = counting(d, ledger, () => undefined);
    const [r] = await runBatch([{ op: "tiles", tiles: many }], d);
    for (const a of at) expect(a.counted).toBeGreaterThanOrEqual(a.n);
    expect(ledger).toEqual(["check 60", "check 25", "add 25", "check 25", "add 25", "check 10", "add 10"]);
    expect(r).toMatchObject({ sent: 60, counted: 60, missing: 0 });
  });

  it("try a tile that fails with a 5xx three times, count each try, and stop when all three fail", async () => {
    process.env.GOOGLE_MAPS_KEY = KEY;
    const three = [...tiles, { ...tiles[0]!, x: 5 }];
    const { d, ledger } = fake({ allowFetch: true });
    const at = counting(d, ledger, (n) => (n >= 2 ? new HttpError("tile -> HTTP 503", 503) : undefined));
    await expect(runBatch([{ op: "tiles", tiles: three }], d)).rejects.toThrow(/HTTP 503/);
    // The first tile, then three tries of the second; the third tile is never asked for.
    expect(at.length).toBe(4);
    for (const a of at) expect(a.counted).toBeGreaterThanOrEqual(a.n);
  });

  it("go on after a 5xx that a second try gets past", async () => {
    process.env.GOOGLE_MAPS_KEY = KEY;
    const { d, ledger } = fake({ allowFetch: true });
    counting(d, ledger, (n) => (n === 2 ? new HttpError("tile -> HTTP 503", 503) : undefined));
    const [r] = await runBatch([{ op: "tiles", tiles }], d);
    expect(r).toMatchObject({ sent: 3, counted: 3, missing: 0 });
  });

  it("stop at a dropped connection or a timeout, without trying again", async () => {
    process.env.GOOGLE_MAPS_KEY = KEY;
    const { d, ledger } = fake({ allowFetch: true });
    const at = counting(d, ledger, (n) => (n === 1 ? new Error("tile -> TypeError: fetch failed (ECONNRESET)") : undefined));
    await expect(runBatch([{ op: "tiles", tiles }], d)).rejects.toThrow(/ECONNRESET/);
    expect(at.length).toBe(1);
  });

  it("count nothing when there is no key to send, even with a session still cached", async () => {
    delete process.env.GOOGLE_MAPS_KEY;
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "home-"));
    process.env.HOME = process.env.USERPROFILE = home;
    const session = JSON.stringify({ session: SESSION, expiry: String(Math.round(Date.now() / 1000) + 86_400) });
    const { d, sent, ledger } = fake({
      allowFetch: true,
      has: (file) => file === "landmarks/streetview/session.json",
      read: () => Buffer.from(session),
    });
    await expect(runBatch([{ op: "tiles", tiles }], d)).rejects.toThrow(/no Google Maps key/);
    expect(sent).toEqual([]);
    expect(ledger).toEqual(["check 2"]);
  });

  it("stop at a refusal (4xx), with every tile sent already counted", async () => {
    process.env.GOOGLE_MAPS_KEY = KEY;
    const { d, ledger } = fake({ allowFetch: true });
    const at = counting(d, ledger, (n) => (n === 2 ? new HttpError("tile -> HTTP 403", 403) : undefined));
    await expect(runBatch([{ op: "tiles", tiles }], d)).rejects.toThrow(/HTTP 403/);
    expect(at.length).toBe(2);
    expect(ledger).toEqual(["check 2", "check 2", "add 2"]);
    // Recorded once: the next batch buys nothing and asks nothing until a person clears it.
    await expect(runBatch([{ op: "tiles", tiles }], d)).rejects.toThrow(/tiles were closed: tile -> HTTP 403/);
    expect(at.length).toBe(2);
    expect(ledger).toEqual(["check 2", "check 2", "add 2"]);
  });

  it("leave out a panorama whose metadata Google no longer has, and stop at any other failure", async () => {
    process.env.GOOGLE_MAPS_KEY = KEY;
    const { d } = fake();
    const get = d.get;
    d.get = async (o) => (o.url.includes("/metadata") ? Promise.reject(new HttpError("metadata -> HTTP 404", 404)) : get(o));
    const [r] = await runBatch([{ op: "metadata", panos: [tiles[0]!.pano] }], d);
    expect(r).toEqual({ metadata: [{ panoId: tiles[0]!.pano }], sent: 1 });
    const { d: d2 } = fake();
    const get2 = d2.get;
    d2.get = async (o) => (o.url.includes("/metadata") ? Promise.reject(new HttpError("metadata -> HTTP 403", 403)) : get2(o));
    await expect(runBatch([{ op: "metadata", panos: [tiles[0]!.pano] }], d2)).rejects.toThrow(/HTTP 403/);
  });

  it("run as the pipeline runs it: plain node, a batch on stdin, the results alone on stdout", () => {
    // Node strips the types and runs the file: syntax it cannot strip fails here, not in vitest.
    // A home folder of its own, so that the test never holds the user's lock.
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "home-"));
    const r = spawnSync(process.execPath, ["scripts/landmarks/fetch.ts"], {
      input: JSON.stringify({ ops: [] }),
      encoding: "utf8",
      env: { ...process.env, HOME: home, USERPROFILE: home },
    });
    expect(r.stderr).toBe("");
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual({ results: [] });
  });

  it("run one batch at a time, and take over a lock whose batch is gone", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "home-"));
    process.env.HOME = process.env.USERPROFILE = home;
    const lock = path.join(home, ".campus-world-model", "landmark-fetch.lock");
    const release = takeLock();
    expect(fs.readFileSync(lock, "utf8").split(" ")[0]).toBe(String(process.pid));
    release();
    expect(fs.existsSync(lock)).toBe(false);
    // Held by a batch that is alive (here the test runner's parent process): refused.
    fs.writeFileSync(lock, `${process.ppid} ${Date.now()}`);
    expect(() => takeLock()).toThrow(/another landmark fetch is running/);
    // A batch that died: a pid no process has.
    fs.writeFileSync(lock, `999999999 ${Date.now()}`);
    takeLock()();
    expect(fs.existsSync(lock)).toBe(false);
    // A dead batch's pid, given again to this process: taken over.
    fs.writeFileSync(lock, `${process.pid} ${Date.now()}`);
    takeLock()();
    // A lock that cannot be read, but is young: held, and the message names no home folder.
    fs.writeFileSync(lock, "");
    expect(() => takeLock()).toThrow(/another landmark fetch is running.*delete ~\/\.campus-world-model\/landmark-fetch\.lock$/);
  });

  it("send nothing for a file already cached", async () => {
    const url = "https://opentopography.s3.sdsc.edu/pc-bulk/NZ24_Auckland/CL2_BA32_2024_1000_3603.laz";
    const { d, sent } = fake({ has: () => true });
    const [r] = await runBatch([{ op: "file", url }], d);
    expect(r).toMatchObject({ sent: 0 });
    expect(sent).toEqual([]);
  });

  it("keep the key out of every URL, and the session out of every logged URL and error", async () => {
    process.env.GOOGLE_MAPS_KEY = KEY;
    const { d, sent } = fake({ allowFetch: true });
    await runBatch([{ op: "metadata", panos: [tiles[0]!.pano] }, { op: "tiles", tiles }], d);
    expect(sent.length).toBe(4);
    for (const o of sent) {
      expect(o.headers?.["X-Goog-Api-Key"]).toBe(KEY);
      expect(o.url).not.toContain(KEY);
      expect(o.logUrl ?? o.url).not.toContain(SESSION);
    }
    expect(sent[1]!.logUrl).toContain("session=<session>");
    expect(redact(`failed: ${KEY} ${SESSION}`)).toBe("failed: <key> <session>");
  });
});
