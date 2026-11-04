// The Kate Edger Information Commons (University of Auckland, building 315), drawn by rule from code alone. Each
// part lives in parts/ and is built here; a part that throws is logged and left out, so that one broken part never
// stops the others. `only` (the viewer's ?only=southeast,upper) builds just those parts. Every landmark's model.js
// exports build(materials, only), which returns a Group. The parts are drawn in the view frame.
import { Builder } from "../kit/gothic.js";
import { southeast, upper, facade } from "./parts/southeast.js";
import { northwest, northeast, wings } from "./parts/northwest.js";
import { atrium, low } from "./parts/atrium.js";

const PARTS = {
  southeast: (b) => southeast(b),
  upper: (b) => upper(b),
  facade: (b) => facade(b),
  northwest: (b) => northwest(b),
  northeast: (b) => northeast(b),
  wings: (b) => wings(b),
  atrium: (b) => atrium(b),
  low: (b) => low(b),
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
