import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { allowed, type Deps, redact, runBatch, runLedger } from "../scripts/lib/landmark-fetch.ts";
import type { FetchOptions } from "../scripts/lib/snapshot.ts";

const KEY = "AIzaTestKeyNotReal";
const SESSION = "testSessionToken123";
const env = { ...process.env };
afterEach(() => {
  process.env = { ...env };
});

/** A batch's outside world with nothing cached, nothing sent, and a ledger that allows all. */
function fake(over: Partial<Deps> = {}) {
  const sent: FetchOptions[] = [];
  const ledger: string[] = [];
  const d: Deps = {
    allowFetch: false,
    has: () => false,
    read: () => {
      throw new Error("nothing is cached");
    },
    get: async (o) => {
      allowed(o.url);
      sent.push(o);
      const expiry = String(Math.round(Date.now() / 1000) + 86_400);
      return Buffer.from(o.url.endsWith("createSession") ? JSON.stringify({ session: SESSION, expiry }) : "{}");
    },
    ledger: (verb, n) => {
      ledger.push(`${verb} ${n}`);
      return true;
    },
    recordTiles: () => {},
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

  it("add to the ledger every tile request sent, also when one fails", async () => {
    process.env.GOOGLE_MAPS_KEY = KEY;
    let n = 0;
    const { d, sent, ledger } = fake({ allowFetch: true });
    const get = d.get;
    d.get = async (o) => {
      if (o.url.includes("/tiles/") && ++n === 2) throw new Error(`${o.logUrl} -> HTTP 500`);
      return get(o);
    };
    await expect(runBatch([{ op: "tiles", tiles }], d)).rejects.toThrow(/HTTP 500/);
    expect(ledger).toEqual(["check 2", "add 2"]);
    expect(sent.map((o) => o.url.split("?")[0])).toEqual([
      "https://tile.googleapis.com/v1/createSession",
      "https://tile.googleapis.com/v1/streetview/tiles/5/3/4",
    ]);
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
