// Maclaurin Chapel (University of Auckland, building 107), drawn by rule from code alone.
// Each part lives in parts/ and is built here; a part that throws is logged and left out, so that
// one broken part never stops the others. `only` (the viewer's ?only=chapel,hall) builds just those
// parts. Every landmark's model.js exports build(materials, only), which returns a Group.
import { Builder } from "../kit/gothic.js";
import { chapel, spire, bay, room } from "./parts/chapel.js";
import { hall } from "./parts/hall.js";

const PARTS = {
  chapel: (b) => chapel(b),
  spire: (b) => spire(b),
  bay: (b) => bay(b),
  room: (b) => room(b),
  hall: (b) => hall(b),
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
