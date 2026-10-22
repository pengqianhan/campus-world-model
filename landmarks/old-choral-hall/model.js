// Old Choral Hall (University of Auckland, building 104), drawn by rule from code alone.
// Each part lives in parts/ and is built here; a part that throws is logged and left out, so that
// one broken part never stops the others. `only` (the viewer's ?only=southwest,rest) builds just those
// parts. Every landmark's model.js exports build(materials, only), which returns a Group.
//
// Only the south-west range on Symonds Street is drawn in detail (parts/southwest.js): it is the one part
// that panoramas show before the building works (2022-09) and after them (2024-10). The rest of the
// building keeps the campus map's estimated block (parts/rest.js) until the works end (README.md).
import { Builder } from "../kit/gothic.js";
import { southwest } from "./parts/southwest.js";
import { rest } from "./parts/rest.js";

const PARTS = {
  southwest: (b) => southwest(b),
  rest: (b) => rest(b),
};

export function build(materials, only) {
  const b = new Builder(materials);
  for (const [name, part] of Object.entries(PARTS)) {
    if (only && !only.includes(name)) continue;
    const t0 = performance.now();
    try { part(b); console.log(`part ${name}: ${(performance.now() - t0).toFixed(0)} ms`); }
    catch (e) { console.error(`part ${name} failed: ${e.stack}`); b.matrix = null; }
  }
  return b.build();
}
