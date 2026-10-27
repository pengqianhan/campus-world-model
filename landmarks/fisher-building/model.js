// The Fisher Building (University of Auckland, building 804, 18 Waterloo Quadrant), drawn by rule from
// code alone. Each part lives in parts/ and is built here; a part that throws is logged and left out, so
// that one broken part never stops the others. `only` (the viewer's ?only=tower,shaft) builds just those
// parts. Every landmark's model.js exports build(materials, only), which returns a Group.
import { Builder } from "../kit/gothic.js";
import { tower, shaft, floorBands } from "./parts/tower.js";
import { wing } from "./parts/wing.js";
import { slot } from "./parts/slot.js";
import { canopy, deck } from "./parts/entrance.js";

const PARTS = {
  tower: (b) => tower(b),
  shaft: (b) => shaft(b),
  bands: (b) => floorBands(b),
  wing: (b) => wing(b),
  slot: (b) => slot(b),
  canopy: (b) => canopy(b),
  deck: (b) => deck(b),
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
