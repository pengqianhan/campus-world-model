// Shared sizes (from the LINZ 2024 LiDAR, see tools/data/) and roof helpers. Owned by the lead: read, do not edit.
// View frame: x to the right as seen from Princes St, y up from the ground at the door (45.8 m NZVD2016),
// z toward the street, the tower's centre at x = z = 0.
import * as THREE from "three";

// Legacy first-guess sizes below: some parts still read them, so they are kept as they were. The
// measured sizes (LiDAR + photographs, round 1 agents' reports) are in MEASURED; parts move to those.
export const MEASURED = {
  buildingTurn: -1.6,          // degrees: the building's axes are turned from the view frame (fronts nearer the street on the right)
  towerTurn: -2.5,             // degrees: the tower's octagon relative to the facade
  doorAxisX: -0.95,            // the doorway, steps and oriel turrets are symmetric about this, not x = 0
  pavilionLeft: [-17.1, -6.5], pavilionRight: [4.9, 15.8],      // view frame, at the front
  pavilionFront: [17.1, 17.9], pavilionBack: -17.8,               // left, right
  pavilionCornice: 9.6, pavilionParapet: 12.0, pavilionRidge: 13.3, gableApex: 13.65, plinthTop: [2.6, 3.3],
  bayFront: 10.8, bayRoof: 11.0, bayParapetTop: 11.9,
  towerFace: 3.3, towerCorner: 3.7, stageHalf: 6.8, stageEave: 18.0, gableFoot: 32.7, crownPinnacles: 36.35, spireTop: 40.8,
  rangesFront: [6.1, 6.75], rangesBack: [-9.8, -8.7], rangesEave: 9.1, rangesParapet: 9.9, rangesRidge: 11.6,
};

export const EAVE = 9.8, RIDGE = 13.3; // the gabled pavilions
export const PAV_FRONT = 17.0, PAV_BACK = -14.0;
export const PAV_LEFT = [-16.0, -6.5], PAV_RIGHT = [6.0, 16.5];
export const BAY_FRONT = 12.5, BAY_TOP = 11.0; // the recessed centre, x from -6.5 to 6.0
export const TOWER_HALF = 4.75, STAGE_TOP = 18.5, SHAFT_TOP = 33.5, SPIRE_TOP = 40.8;

/** A pitched roof over x0..x1, ridge along z from z0 to z1. */
export function roofAlongZ(b, x0, x1, eave, ridge, z0, z1) {
  const s = new THREE.Shape([new THREE.Vector2(x0 - 0.3, eave - 0.15), new THREE.Vector2(x1 + 0.3, eave - 0.15), new THREE.Vector2((x0 + x1) / 2, ridge + 0.1)]);
  const g = new THREE.ExtrudeGeometry(s, { depth: z1 - z0, bevelEnabled: false });
  g.translate(0, 0, z0);
  b.add(g, "roof");
}

/** A pitched roof over z0..z1, ridge along x from x0 to x1. */
export function roofAlongX(b, x0, x1, eave, ridge, z0, z1) {
  const s = new THREE.Shape([new THREE.Vector2(z0 - 0.3, eave - 0.15), new THREE.Vector2(z1 + 0.3, eave - 0.15), new THREE.Vector2((z0 + z1) / 2, ridge + 0.1)]);
  const g = new THREE.ExtrudeGeometry(s, { depth: x1 - x0, bevelEnabled: false });
  g.rotateY(-Math.PI / 2);
  g.translate(x1, 0, 0);
  b.add(g, "roof");
}
