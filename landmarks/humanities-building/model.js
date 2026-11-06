// The Humanities Building (University of Auckland, building 206), drawn by rule from code alone. Each part lives in
// parts/ and is built here; a part that throws is logged and left out, so that one broken part never stops the
// others. `only` (the viewer's ?only=aisles,corner) builds just those parts. Every landmark's model.js exports
// build(materials, only), which returns a Group. The parts are drawn in the view frame.
import { Builder } from "../kit/gothic.js";
import { aisles, street, northeast, corner } from "./parts/wings.js";
import { low } from "./parts/low.js";
import { facade } from "./parts/facade.js";

const PARTS = {
  aisles: (b) => aisles(b),
  street: (b) => street(b),
  northeast: (b) => northeast(b),
  corner: (b) => corner(b),
  low: (b) => low(b),
  facade: (b) => facade(b),
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
