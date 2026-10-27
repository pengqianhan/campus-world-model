import { describe, expect, it } from "vitest";
import { askOverpass, closes, type OverpassDeps } from "../scripts/lib/overpass.ts";
import { HttpError } from "../scripts/lib/snapshot.ts";

const A = "https://a.example/api/interpreter";
const B = "https://b.example/api/interpreter";

/** The endpoints' answers, in the order they are asked: a Buffer, or an error to throw. */
function fake(answers: (string | Error)[], closedBefore: [string, string][] = []) {
  const asked: string[] = [];
  const closed: string[] = [];
  const waits: number[] = [];
  const d: OverpassDeps = {
    get: async (url) => {
      asked.push(url);
      const next = answers.shift();
      if (next === undefined) throw new Error("asked more often than the test expects");
      if (next instanceof Error) throw next;
      return Buffer.from(next);
    },
    closed: () => new Map(closedBefore),
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

// snapshot.ts words a failed fetch as "<url> -> <name>: <message> (<cause>)"
const dropped = (url: string) => new Error(`${url} -> TypeError: fetch failed (Connect Timeout Error)`);
const timedOut = (url: string) => new Error(`${url} -> TimeoutError: The operation was aborted due to timeout`);

describe("Overpass endpoints", () => {
  it("asks a busy endpoint again in the next round, and records nothing", async () => {
    const f = fake([new HttpError(`${A} -> HTTP 504`, 504), new HttpError(`${B} -> HTTP 429`, 429), "{}"]);
    expect((await askOverpass([A, B], f.d)).toString()).toBe("{}");
    expect(f.asked).toEqual([A, B, A]);
    expect(f.closed).toEqual([]);
    expect(f.waits).toContain(60_000);
  });

  it("asks an endpoint that took the query and did not answer in time again", async () => {
    const f = fake([timedOut(A), timedOut(B), "{}"]);
    await askOverpass([A, B], f.d);
    expect(f.asked).toEqual([A, B, A]);
    expect(f.closed).toEqual([]);
  });

  it("records a refusal, a redirect and a dropped connection once, and never asks those endpoints again", async () => {
    for (const refusal of [new HttpError(`${A} -> HTTP 403`, 403), new HttpError(`${A} -> HTTP 401`, 401), dropped(A), new Error(`${A} -> TypeError: fetch failed (unexpected redirect)`)]) {
      const f = fake([refusal, new HttpError(`${B} -> HTTP 504`, 504), "{}"]);
      await askOverpass([A, B], f.d);
      // round 1 asks A and B; round 2 asks B alone
      expect(f.asked).toEqual([A, B, B]);
      expect(f.closed).toEqual([A]);
    }
  });

  it("does not ask an endpoint recorded as closed in an earlier run", async () => {
    const f = fake(["{}"], [[A, "HTTP 403"]]);
    await askOverpass([A, B], f.d);
    expect(f.asked).toEqual([B]);
  });

  it("fails, naming each closed endpoint and why, when none answers", async () => {
    const f = fake([new HttpError(`${A} -> HTTP 403`, 403), dropped(B)]);
    await expect(askOverpass([A, B], f.d)).rejects.toThrow(/no Overpass endpoint answered; .*a\.example.* is closed \(.*HTTP 403\).*b\.example.* is closed \(.*Connect Timeout/);
    // every endpoint closed after the first round: no second round is waited for
    expect(f.waits).not.toContain(60_000);
  });

  it("tells a busy answer from a closing one", () => {
    for (const status of [500, 502, 503, 504, 429]) expect(closes(new HttpError(`x -> HTTP ${status}`, status)), String(status)).toBe(false);
    for (const status of [400, 401, 403, 404, 410]) expect(closes(new HttpError(`x -> HTTP ${status}`, status)), String(status)).toBe(true);
    expect(closes(timedOut(A))).toBe(false);
    expect(closes(dropped(A))).toBe(true);
  });
});
