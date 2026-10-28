// The radio mast (parts/common.js MEASURED.mast): a square lattice tower standing on the main roof, its
// width and height the LiDAR's (3.9 m across at 13 m, 1.6 m at 37 m, its top at 39.3 m), drawn simply:
// four legs, a ring of girts every panel and a cross on each face of each panel, painted white. The red bands
// the photograph shows on it are left for a later round. The panel height (about 3 m) and the members'
// sizes are estimated.
import * as THREE from "three";
import { MEASURED as M } from "./common.js";

const LEG = 0.14, MEMBER = 0.06; // the legs' and the bracing's thickness: estimated

/** A square member of thickness t from p to q. */
function strut(list, p, q, t) {
  const d = new THREE.Vector3().subVectors(q, p), L = d.length();
  const g = new THREE.BoxGeometry(t, L, t);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  g.translate((p.x + q.x) / 2, (p.y + q.y) / 2, (p.z + q.z) / 2);
  list.push(g);
}

export function mast(b) {
  const m = M.mast, y0 = M.roof, y1 = m.top;
  // the width at height y: the line through the two widths the LiDAR gives
  const width = (y) => m.low.w + ((y - m.low.y) / (m.high.y - m.low.y)) * (m.high.w - m.low.w);
  const corner = (y, i) => {
    const h = width(y) / 2, [sx, sz] = [[-1, -1], [1, -1], [1, 1], [-1, 1]][i];
    return new THREE.Vector3(m.x + sx * h, y, m.z + sz * h);
  };
  const list = [];
  const panels = Math.round((y1 - y0) / 3);
  for (let i = 0; i < 4; i++) strut(list, corner(y0, i), corner(y1, i), LEG);
  for (let k = 0; k <= panels; k++) {
    const y = y0 + ((y1 - y0) * k) / panels;
    for (let i = 0; i < 4; i++) strut(list, corner(y, i), corner(y, (i + 1) % 4), MEMBER);
    if (k === panels) break;
    const ya = y, yb = y0 + ((y1 - y0) * (k + 1)) / panels;
    for (let i = 0; i < 4; i++) {
      strut(list, corner(ya, i), corner(yb, (i + 1) % 4), MEMBER);
      strut(list, corner(ya, (i + 1) % 4), corner(yb, i), MEMBER);
    }
  }
  for (const g of list) b.add(g, "paint");
}
