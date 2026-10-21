// The long ranges either side behind the pavilions (context, seen at the edges of the views, mostly
// behind trees). Massing from the LINZ 2024 LiDAR in the building's frame (see pavilion.js): two storeys
// of smooth stone, a parapet to 9.9 m on the street side, a pitched slate roof (eaves 9.1, ridge 11.6)
// behind it; fronts at z = 6.1 (left) and 6.75 (right), backs at -9.8 and -8.7; the left one ends at
// x = -50.5 in a taller gabled block, the right one at x = 48.5.
import * as THREE from "three";
import { addWall, addCourse, boxesGeometry } from "../gothic.js";
import { BUILDING, inFrame } from "./pavilion.js";

const PARAPET = 9.9, EAVE = 9.1, RIDGE = 11.6, PLINTH = 1.2, FLOOR = 4.6;
const RANGES = [
  { x0: -50.5, x1: -16.6, front: 6.1, back: -9.8 },
  { x0: 16.15, x1: 48.5, front: 6.75, back: -8.7 },
];

/** A pitched roof over z0..z1, ridge along x from x0 to x1 (no overhang: it sits behind parapets). */
function roof(b, x0, x1, z0, z1, eave, ridge) {
  const s = new THREE.Shape([new THREE.Vector2(z0, eave), new THREE.Vector2(z1, eave), new THREE.Vector2((z0 + z1) / 2, ridge)]);
  const g = new THREE.ExtrudeGeometry(s, { depth: x1 - x0, bevelEnabled: false });
  g.rotateY(-Math.PI / 2);
  g.translate(x1, 0, 0);
  b.add(g, "roof");
}

/** The long ranges that run away either side behind the pavilions. */
export function ranges(b) {
  inFrame(b, BUILDING, () => {
    for (const { x0, x1, front, back } of RANGES) {
      const left = x0 < 0;
      b.box(x0, x1, -0.4, EAVE, back, front - 0.5, "smooth");
      roof(b, x0, x1, back + 0.4, front - 0.4, EAVE, RIDGE);
      // street wall: bays of two-light windows, square below and pointed above under hoods
      const wins = [], bay = 3.6, len = x1 - x0, n = Math.floor((len - 1.2) / bay), pad = (len - n * bay) / 2;
      for (let i = 0; i < n; i++) {
        const x = x0 + pad + bay * (i + 0.5);
        wins.push({ x, y: 1.6, w: 1.25, h: 2.4, lights: 2, transoms: [1.6], reveal: 0.25 });
        wins.push({ x, y: 5.4, w: 1.2, h: 2.75, head: "pointed", lights: 2, transoms: [1.5], k: 0.8, reveal: 0.25, hood: { off: 0.03, band: 0.1, drop: 0.25 } });
      }
      addWall(b, [[0, 0], [len, 0], [len, PARAPET], [0, PARAPET]], x0, 0, front, 0.5, wins, "smooth");
      b.box(x0, x1, -0.4, PLINTH, front - 0.4, front + 0.1, "ashlar");
      addCourse(b, x0, x1, PLINTH, front + 0.1, 0.16, 0.06);
      addCourse(b, x0, x1, FLOOR, front, 0.16, 0.08);
      addCourse(b, x0, x1, PARAPET - 0.75, front, 0.22, 0.12);
      b.box(x0, x1, PARAPET - 0.05, PARAPET + 0.12, front - 0.55, front + 0.08, "dressed");
      // shallow pilaster strips between the bays
      const st = [];
      for (let i = 0; i <= n; i++) { const x = x0 + pad + bay * i; st.push([x - 0.16, x + 0.16, PLINTH, PARAPET - 0.75, front, front + 0.07]); }
      b.add(boxesGeometry(st), "smooth");
      // back parapet
      b.box(x0, x1, EAVE - 0.3, PARAPET - 0.1, back, back + 0.4, "smooth");
      if (left) {
        // the taller gabled block at the far end (LiDAR: up to 18.6 m)
        const e0 = x0 - 0.5, e1 = x0 + 5.5;
        b.box(e0, e1, -0.4, 11.0, back, front + 0.1, "smooth");
        const s = new THREE.Shape([new THREE.Vector2(e0 - 0.2, 10.9), new THREE.Vector2(e1 + 0.2, 10.9), new THREE.Vector2((e0 + e1) / 2, 18.4)]);
        const g = new THREE.ExtrudeGeometry(s, { depth: front - back + 0.6, bevelEnabled: false });
        g.translate(0, 0, back - 0.3);
        b.add(g, "roof");
      } else {
        b.box(x1 - 0.5, x1, -0.4, PARAPET, back, front, "smooth");
      }
    }
  });
}
