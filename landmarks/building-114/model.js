// Building 114 (University of Auckland), drawn by rule from code alone. Each part lives in parts/ and is built here; a
// part that throws is logged and left out, so that one broken part never stops the others. `only` (the viewer's
// ?only=body) builds just those parts. Every landmark's model.js exports build(materials, only), which returns a Group.
// The parts are drawn in the view frame.
import { Builder } from "../kit/gothic.js";
import { body, roof, tower } from "./parts/block.js";
import { face, front } from "./parts/facade.js";

const PARTS = {
  body: (b) => body(b),
  roof: (b) => roof(b),
  tower: (b) => tower(b),
  face: (b) => face(b),
  front: (b) => front(b),
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
