// The landmark pipeline's fetches, one batch at a time, each through scripts/lib/snapshot.ts
// (scripts/lib/landmark-fetch.ts says what is let through). The Python stages call it through
// landmarks/pipeline/tools/data/fetch_bridge.py.
//   node scripts/landmarks/fetch.ts < batch.json      batch: {"ops": [{"op": "file", "url": ...}, ...]}
// Prints {"results": [...]} on stdout, one result an operation; progress and errors go to stderr.
// Environment: ALLOW_FETCH=1 lets billed Street View tiles be bought; GMAPS_BUDGET is the ledger
// script and PY the Python that runs it; GOOGLE_MAPS_KEY, else ~/.gmaps_key.
import fs from "node:fs";
import { redact, runBatch, takeLock, type Op } from "../lib/landmark-fetch.ts";
import { paceFromNow } from "../lib/snapshot.ts";

// stdout carries the result only.
console.log = console.error;
const { ops } = JSON.parse(fs.readFileSync(0, "utf8")) as { ops: Op[] };
let release = () => {};
try {
  release = takeLock();
  // The batch before this one may have sent a request a moment ago.
  paceFromNow();
  const results = await runBatch(ops);
  process.stdout.write(JSON.stringify({ results }));
} catch (e) {
  console.error(`fetch: ${redact(e instanceof Error ? e.message : String(e))}`);
  process.exitCode = 1;
} finally {
  release();
}
