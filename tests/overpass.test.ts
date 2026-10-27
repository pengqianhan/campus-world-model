import { describe, expect, it } from "vitest";
import { askOverpass, failure, type OverpassDeps } from "../scripts/lib/overpass.ts";
import { HttpError, fetchFailure } from "../scripts/lib/snapshot.ts";

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
const host = (url: string) => new URL(url).host;
// the host dropping the connection
const dropped = (url: string) => new Error(`${url} -> TypeError: fetch failed (read ECONNRESET)`);
const closedSocket = (url: string) => new Error(`${url} -> TypeError: fetch failed (other side closed)`);
const refusedTcp = (url: string) => new Error(`${url} -> TypeError: fetch failed (connect ECONNREFUSED 192.0.2.1:443)`);
const redirected = (url: string) => new Error(`${url} -> TypeError: fetch failed (unexpected redirect)`);
// no answer in time
const timedOut = (url: string) => new Error(`${url} -> TimeoutError: The operation was aborted due to timeout`);
const connectTimeout = (url: string) =>
  new Error(`${url} -> TypeError: fetch failed (Connect Timeout Error (attempted address: ${host(url)}:443, timeout: 10000ms))`);
// the network failing on this machine: the host is not reached
const noDns = (url: string) => new Error(`${url} -> TypeError: fetch failed (getaddrinfo EAI_AGAIN ${host(url)})`);
const notFound = (url: string) => new Error(`${url} -> TypeError: fetch failed (getaddrinfo ENOTFOUND ${host(url)})`);
const noRoute = (url: string) => new Error(`${url} -> TypeError: fetch failed (connect ENETUNREACH 192.0.2.1:443)`);
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
    // a connection not made in time is no answer in time, and a request with no answer in time is asked again too
    for (const late of [connectTimeout(A), timedOut(A)]) {
      const g = fake([late, "{}"]);
      await askOverpass([A], g.d);
      expect(g.asked).toEqual([A, A]);
      expect(g.closed).toEqual([]);
    }
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

  it("record a dropped connection once another instance answers after it", async () => {
    for (const drop of [dropped(A), closedSocket(A), refusedTcp(A)]) {
      const f = fake([drop, status(B, 504), "{}"]);
      await askOverpass([A, B], f.d);
      expect(f.asked).toEqual([A, B, B]);
      expect(f.closed).toEqual([A]);
    }
    const g = fake([dropped(A), "{}"]);
    await askOverpass([A, B], g.d);
    expect(g.closed).toEqual([A]);
  });

  it("never record an instance this machine could not reach, and ask it again: the network may be this machine's", async () => {
    const f = fake([noDns(A), notFound(B), noRoute(C), noDns(A), noDns(B), noDns(C), noDns(A), noDns(B), noDns(C)]);
    await expect(askOverpass([A, B, C], f.d)).rejects.toThrow(/could not be reached from this machine .*: is this machine online\?/);
    expect(f.asked).toEqual([A, B, C, A, B, C, A, B, C]);
    expect(f.closed).toEqual([]);
    // a host not reached is no answer: a drop before it stays unrecorded
    const h = fake([dropped(A), noDns(B), noDns(B), noDns(B)]);
    await expect(askOverpass([A, B], h.d)).rejects.toThrow(/it is not recorded as closed/);
    expect(h.closed).toEqual([]);
    // the network fails after a busy answer and comes back before the next round: nothing is recorded
    for (const gone of [noDns, connectTimeout]) {
      const g = fake([status(A, 504), gone(B), gone(C), "{}"]);
      expect((await askOverpass([A, B, C], g.d)).toString()).toBe("{}");
      expect(g.asked).toEqual([A, B, C, A]);
      expect(g.closed).toEqual([]);
    }
  });

  it("record nothing when every instance drops and none answers", async () => {
    const f = fake([dropped(A), dropped(B), dropped(C)]);
    await expect(askOverpass([A, B, C], f.d)).rejects.toThrow(/no other instance answered after, so none of them is recorded as closed/);
    expect(f.closed).toEqual([]);
    // nothing is asked again after every instance dropped: no minute's wait for a second round
    expect(f.waits).not.toContain(60_000);
  });

  it("record no drop that no answer follows, though an instance answered before it", async () => {
    // round 1 asks A, B and C; round 2 asks A alone
    const f = fake([status(A, 504), dropped(B), dropped(C), dropped(A)]);
    await expect(askOverpass([A, B, C], f.d)).rejects.toThrow(/none of them is recorded as closed/);
    expect(f.asked).toEqual([A, B, C, A]);
    expect(f.closed).toEqual([]);
    // a timeout is no answer
    const g = fake([timedOut(A), dropped(B), dropped(C), dropped(A)]);
    await expect(askOverpass([A, B, C], g.d)).rejects.toThrow(/none of them is recorded as closed/);
    expect(g.closed).toEqual([]);
    // one instance, busy and then dropping: no other instance answered after
    const h = fake([status(A, 504), dropped(A)]);
    await expect(askOverpass([A], h.d)).rejects.toThrow(/it is not recorded as closed/);
    expect(h.closed).toEqual([]);
  });

  it("record a drop when another instance answers after it with a status or a redirect, and not with a timeout", async () => {
    const answers: (string | Error)[][] = [
      [status(B, 504), status(B, 504), status(B, 504)],
      [status(B, 403)],
      [redirected(B)],
      [status(B, 404)],
    ];
    for (const after of answers) {
      const f = fake([dropped(A), ...after]);
      await expect(askOverpass([A, B], f.d)).rejects.toThrow(/no Overpass instance answered/);
      expect(f.closed).toContain(A);
    }
    const g = fake([dropped(A), timedOut(B), timedOut(B), timedOut(B)]);
    await expect(askOverpass([A, B], g.d)).rejects.toThrow(/it is not recorded as closed/);
    expect(g.closed).toEqual([]);
  });

  it("record a drop that a fault of ours follows, which is an answer too, and then stop", async () => {
    for (const ours of [status(B, 400), diskFull()]) {
      const f = fake([dropped(A), ours]);
      await expect(askOverpass([A, B, C], f.d)).rejects.toBe(ours);
      expect(f.asked).toEqual([A, B]);
      expect(f.closed).toEqual([A]);
    }
  });

  it("name the instances closed before, and the record, when the one left drops", async () => {
    const f = fake([dropped(C)], { closedBefore: [[A, "HTTP 403"], [B, "HTTP 403"]] });
    const err = await askOverpass([A, B, C], f.d).catch((e: Error) => e);
    expect(String(err)).toMatch(/c\.example.* dropped the connection .*it is not recorded as closed/);
    expect(String(err)).toMatch(/a\.example.* is closed \(HTTP 403\); .*b\.example.* is closed \(HTTP 403\); delete its line in .*overpass-closed\.txt/);
    expect(f.asked).toEqual([C]);
    expect(f.closed).toEqual([]);
  });

  it("stop at once on a fault of ours, recording nothing and asking no other instance", async () => {
    for (const ours of [status(A, 400), diskFull()]) {
      const f = fake([ours]);
      await expect(askOverpass([A, B, C], f.d)).rejects.toBe(ours);
      expect(f.asked).toEqual([A]);
      expect(f.closed).toEqual([]);
    }
  });

  it("leave an instance that answers another 4xx for the rest of that area's requests, without recording it", async () => {
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

  it("word every address's failure when a name has several, so that it is sorted by what failed", () => {
    // Node tries each of a name's addresses in turn and gathers the attempts' errors, with no message of its own
    const tried = (...messages: string[]) => new TypeError("fetch failed", { cause: new AggregateError(messages.map((m) => new Error(m)), "") });
    const said = (e: Error) => new Error(`${A} -> ${fetchFailure(e)}`);
    const unreached = tried("connect ENETUNREACH 192.0.2.1:443", "connect ENETUNREACH 2001:db8::1:443");
    expect(fetchFailure(unreached)).toBe("TypeError: fetch failed (connect ENETUNREACH 192.0.2.1:443; connect ENETUNREACH 2001:db8::1:443)");
    expect(failure(A, said(unreached))).toBe("offline");
    expect(failure(A, said(tried("connect ETIMEDOUT 192.0.2.1:443", "connect ECONNREFUSED 2001:db8::1:443")))).toBe("busy");
    expect(failure(A, said(tried("connect ECONNREFUSED 192.0.2.1:443", "connect ECONNREFUSED 2001:db8::1:443")))).toBe("dropped");
    // one address: the cause's own message, as before
    expect(fetchFailure(new TypeError("fetch failed", { cause: new Error("other side closed") }))).toBe("TypeError: fetch failed (other side closed)");
  });

  it("tell a refusal, a drop, a busy answer, a host not reached and our own fault apart", () => {
    for (const n of [500, 502, 503, 504, 429]) expect(failure(A, status(A, n)), String(n)).toBe("busy");
    for (const n of [401, 403]) expect(failure(A, status(A, n)), String(n)).toBe("refused");
    for (const n of [404, 410]) expect(failure(A, status(A, n)), String(n)).toBe("unavailable");
    expect(failure(A, status(A, 400))).toBe("ours");
    expect(failure(A, timedOut(A))).toBe("busy");
    expect(failure(A, connectTimeout(A))).toBe("busy");
    expect(failure(A, redirected(A))).toBe("refused");
    for (const drop of [dropped(A), closedSocket(A), refusedTcp(A)]) expect(failure(A, drop)).toBe("dropped");
    for (const gone of [noDns(A), notFound(A), noRoute(A)]) expect(failure(A, gone)).toBe("offline");
    expect(failure(A, diskFull())).toBe("ours");
  });
});
