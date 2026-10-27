// The Clock Tower East Wing (University of Auckland, building 119), drawn by rule from code alone.
// Each part lives in parts/ and is built here; a part that throws is logged and left out, so that
// one broken part never stops the others. `only` (the viewer's ?only=range,tower) builds just those
// parts. Every landmark's model.js exports build(materials, only), which returns a Group.
import { Builder } from "../kit/gothic.js";
import { range, backs } from "./parts/range.js";
import { pavilions } from "./parts/pavilions.js";
import { tower } from "./parts/tower.js";
import { link } from "./parts/link.js";

const PARTS = {
  range: (b) => range(b),
  pavilions: (b) => pavilions(b),
  tower: (b) => tower(b),
  backs: (b) => backs(b),
  link: (b) => link(b),
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
