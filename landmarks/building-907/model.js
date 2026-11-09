// Building 907 (University of Auckland), drawn by rule from code alone. Each part lives in parts/ and is built here;
// a part that throws is logged and left out, so that one broken part never stops the others. `only` (the viewer's
// ?only=hall) builds just those parts. Every landmark's model.js exports build(materials, only), which returns a
// Group. The parts are drawn in the view frame.
import { Builder } from "../kit/gothic.js";
import { hall } from "./parts/hall.js";
import { annex } from "./parts/annex.js";

const PARTS = {
  hall: (b) => hall(b),
  annex: (b) => annex(b),
};

export function build(materials, only) {
  const b = new Builder(materials);
  for (const [name, part] of Object.entries(PARTS)) {
    if (only && !only.includes(name)) continue;
    const t0 = performance.now();
    try { part(b); console.log(`part ${name}: ${(performance.now() - t0).toFixed(0)} ms`); }
    catch (e) { console.error(`part ${name} failed: ${e.stack}`); }
  }
  return b.build();
}
