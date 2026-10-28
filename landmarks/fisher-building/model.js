// The Fisher Building (University of Auckland, building 804, 18 Waterloo Quadrant), drawn by rule from
// code alone. Each part lives in parts/ and is built here; a part that throws is logged and left out, so
// that one broken part never stops the others. `only` (the viewer's ?only=tower,shaft) builds just those
// parts. Every landmark's model.js exports build(materials, only), which returns a Group.
import { Builder } from "../kit/gothic.js";
import { tower, shaft, floorBands } from "./parts/tower.js";
import { wing } from "./parts/wing.js";
import { slot } from "./parts/slot.js";
import { canopy, deck, ramp } from "./parts/entrance.js";

const PARTS = {
  tower: (b) => tower(b),
  shaft: (b) => shaft(b),
  bands: (b) => floorBands(b),
  wing: (b) => wing(b),
  slot: (b) => slot(b),
  canopy: (b) => canopy(b),
  deck: (b) => deck(b),
  // the ramp's white side along the street, on the LiDAR's line (round 3; round 2 measured it 1-5 m nearer
  // MGAo's camera, where it widened the model's screen box over the street and the trees)
  ramp: (b) => ramp(b),
};

// The parts that stand on ground higher than the door's, where their foot is above y = 0 in the source: the
// ramp's side, on the pavement of Waterloo Quadrant at its street end, 5.2-5.7 m above the door's ground.
// tests/landmarks.test.ts builds each alone and checks its lowest points against the map's ground, as it checks
// every mesh that reaches y = 0 (landmarks/README.md, "Placement").
export const STANDS = ["ramp"];

export function build(materials, only) {
  const b = new Builder(materials);
  for (const [name, part] of Object.entries(PARTS)) {
    if (!part || (only && !only.includes(name))) continue;
    const t0 = performance.now();
    try { part(b); console.log(`part ${name}: ${(performance.now() - t0).toFixed(0)} ms`); }
    catch (e) { console.error(`part ${name} failed: ${e.stack}`); b.matrix = null; }
  }
  return b.build();
}
