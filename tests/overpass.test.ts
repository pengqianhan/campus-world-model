import { describe, expect, it } from "vitest";
import { askOverpass, failure, type OverpassDeps } from "../scripts/lib/overpass.ts";
import { HttpError } from "../scripts/lib/snapshot.ts";

const A = "https://a.example/api/interpreter";
const B = "https://b.example/api/interpreter";
const C = "https://c.example/api/interpreter";

/** The instances' answers, in the order they are asked: a Buffer, or an error to throw. */
function fake(answers: (string | Error)[], opts: { closedBefore?: [string, string][]; cached?: string } = {}) {
  const asked: string[] = [];
  const closed: string[] = [];
  const waits: number[] = [];
  const d: OverpassDeps = {
    cached: () => (opts.cached === undefined ? undefined : Buffer.from(opts.cached)),
    get: async (url) => {
      asked.push(url);
      const next = answers.shift();
      if (next === undefined) throw new Error("asked more often than the test expects");
      if (next instanceof Error) throw next;
      return Buffer.from(next);
    },
    closed: () => new Map(opts.closedBefore ?? []),
    close: (url) => {
      closed.push(url);
    },
    wait: async (ms) => {
      waits.push(ms);
    },
    warn: () => {},
  };
  return { d, asked, closed, waits };
}

// snapshot.ts words a failed request as "<url> -> <name>: <message> (<cause>)"
const status = (url: string, n: number) => new HttpError(`${url} -> HTTP ${n}`, n);
const dropped = (url: string) => new Error(`${url} -> TypeError: fetch failed (Connect Timeout Error)`);
const reset = (url: string) => new Error(`${url} -> TypeError: fetch failed (other side closed)`);
const redirected = (url: string) => new Error(`${url} -> TypeError: fetch failed (unexpected redirect)`);
const timedOut = (url: string) => new Error(`${url} -> TimeoutError: The operation was aborted due to timeout`);
// a failure on this machine after the answer came: snapshot.ts writes the file outside its request
const diskFull = () => new Error("ENOSPC: no space left on device, write 'osm/context.json.part'");

describe("Overpass instances", () => {
  it("read an area that is on disk with no request, whatever the record says", async () => {
    const f = fake([], { cached: "{}", closedBefore: [[A, "HTTP 403"], [B, "HTTP 403"], [C, "HTTP 403"]] });
    expect((await askOverpass([A, B, C], f.d)).toString()).toBe("{}");
    expect(f.asked).toEqual([]);
  });

  it("ask a busy instance again in the next round, and record nothing", async () => {
    const f = fake([status(A, 504), status(B, 429), timedOut(C), "{}"]);
    expect((await askOverpass([A, B, C], f.d)).toString()).toBe("{}");
    expect(f.asked).toEqual([A, B, C, A]);
    expect(f.closed).toEqual([]);
    expect(f.waits).toContain(60_000);
  });

  it("record a refusal and a redirect at once, and never ask those instances again", async () => {
    for (const refusal of [status(A, 403), status(A, 401), redirected(A)]) {
      const f = fake([refusal, status(B, 504), "{}"]);
      await askOverpass([A, B], f.d);
      // round 1 asks A and B; round 2 asks B alone
      expect(f.asked).toEqual([A, B, B]);
      expect(f.closed).toEqual([A]);
    }
  });

  it("record a dropped connection once another instance answers, which shows this machine is online", async () => {
    for (const drop of [dropped(A), reset(A)]) {
      const f = fake([drop, status(B, 504), "{}"]);
      await askOverpass([A, B], f.d);
      expect(f.asked).toEqual([A, B, B]);
      expect(f.closed).toEqual([A]);
    }
    const g = fake([dropped(A), "{}"]);
    await askOverpass([A, B], g.d);
    expect(g.closed).toEqual([A]);
  });

  it("record nothing when no instance could be reached: the fault is this machine's", async () => {
    const f = fake([dropped(A), dropped(B), dropped(C)]);
    await expect(askOverpass([A, B, C], f.d)).rejects.toThrow(/no Overpass instance could be reached, so none is recorded as closed/);
    expect(f.closed).toEqual([]);
    // nothing is asked again after every instance dropped: no minute's wait for a second round
    expect(f.waits).not.toContain(60_000);
  });

  it("stop at once on a fault of ours, recording nothing and asking no other instance", async () => {
    for (const ours of [status(A, 400), diskFull()]) {
      const f = fake([ours]);
      await expect(askOverpass([A, B, C], f.d)).rejects.toBe(ours);
      expect(f.asked).toEqual([A]);
      expect(f.closed).toEqual([]);
    }
  });

  it("leave an instance that answers another 4xx for the rest of the run, without recording it", async () => {
    const f = fake([status(A, 404), status(B, 504), "{}"]);
    await askOverpass([A, B], f.d);
    expect(f.asked).toEqual([A, B, B]);
    expect(f.closed).toEqual([]);
  });

  it("do not ask an instance recorded as closed in an earlier run", async () => {
    const f = fake(["{}"], { closedBefore: [[A, "HTTP 403"]] });
    await askOverpass([A, B], f.d);
    expect(f.asked).toEqual([B]);
  });

  it("fail, naming each closed instance, why and the record to edit, when none answers", async () => {
    const f = fake([status(A, 403), status(B, 504), status(B, 504), status(B, 504)]);
    await expect(askOverpass([A, B], f.d)).rejects.toThrow(/no Overpass instance answered; .*a\.example.* is closed \(HTTP 403\); delete its line in .*overpass-closed\.txt/);
  });

  it("tell a refusal, a drop, a busy answer and our own fault apart", () => {
    for (const n of [500, 502, 503, 504, 429]) expect(failure(A, status(A, n)), String(n)).toBe("busy");
    for (const n of [401, 403]) expect(failure(A, status(A, n)), String(n)).toBe("refused");
    for (const n of [404, 410]) expect(failure(A, status(A, n)), String(n)).toBe("unavailable");
    expect(failure(A, status(A, 400))).toBe("ours");
    expect(failure(A, timedOut(A))).toBe("busy");
    expect(failure(A, redirected(A))).toBe("refused");
    expect(failure(A, dropped(A))).toBe("dropped");
    expect(failure(A, diskFull())).toBe("ours");
  });
});
