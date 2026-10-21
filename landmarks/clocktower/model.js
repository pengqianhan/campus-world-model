// The Clock Tower building (University of Auckland, building 105), drawn by rule from code alone.
// Each part lives in src/parts/ and is built here; a part that throws is logged and left out, so that
// one broken part never stops the others. ?only=tower,centre builds just those parts.
import { Builder } from "./gothic.js";
import { PAV_LEFT, PAV_RIGHT } from "./parts/common.js";
import { pavilion } from "./parts/pavilion.js";
import { centre } from "./parts/centre.js";
import { tower } from "./parts/tower.js";
import { ranges } from "./parts/ranges.js";

const PARTS = {
  pavilions: (b) => { pavilion(b, ...PAV_LEFT); pavilion(b, ...PAV_RIGHT); },
  centre: (b) => centre(b, -6.5, 6.0),
  tower: (b) => tower(b),
  ranges: (b) => ranges(b),
};

export function clockTower(materials, only) {
  const b = new Builder(materials);
  for (const [name, build] of Object.entries(PARTS)) {
    if (only && !only.includes(name)) continue;
    const t0 = performance.now();
    try { build(b); console.log(`part ${name}: ${(performance.now() - t0).toFixed(0)} ms`); }
    catch (e) { console.error(`part ${name} failed: ${e.stack}`); b.matrix = null; }
  }
  return b.build();
}
