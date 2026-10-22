// Shared sizes, measured in the LINZ 2024 LiDAR (data/old-choral-hall_pts.npy, flown 18 May 2024) by the
// lead (2026-10-22), in the view frame of config/old-choral-hall.json: x to the right as seen from Grafton
// Road on the south-east, y up from 37.7 m NZVD2016 (the ground at the door, config `door`), z
// toward the street. Owned by the lead: read, do not edit; report a size that is wrong, with numbers.
//
// The LiDAR was flown during building works: over the north-east blocks its tops are partly the temporary
// roofs of the scaffolds and their white wraps (README.md, "The sources: works in progress"); and along the south-west
// side the plane trees' crowns (17.5 to 25 m) are classed as building. Read heights there with care.
//
// Only the south-west range is drawn from these (parts/southwest.js, parts/southwest_range.js). The rest of the
// building keeps the campus map's estimated block (parts/rest.js), so round 1's LiDAR sizes of the rest (the
// gabled ranges, the north-east wing, the blocks behind, and parts/massing.js that drew them) are left out:
// they are in the history of loop-a2-old-choral-hall (83c449d) for a later round. The range's closer
// measurements live in parts/southwest_range.js: its face (FACE x' -24.4, the parapet's face 0.2 further out
// at the LiDAR's edge), its ends (BACK z' -23.6, CORNER 14.08), its bay spacing (2.266 m) and the floor
// heights fitted to the photographs (H: plinth top 2.78, ground-floor glass 4.63-7.57, sill band 8.86-9.33,
// first-floor glass 9.66-12.55, cornice 12.77-13.95, parapet 14.3).
import * as THREE from "three";

// The ground, as metres above the datum: the Grafton Road footpath falls along the front, and the
// footpath along the south-west range rises toward its back end.
export const GROUND = {
  front: [[-18, 0.8], [-10, 0.45], [0, 0.05], [10, -0.3], [20, -0.65], [26, -0.85]],   // [x, y] at z ~ 25
  southWest: [[14, 1.0], [6, 1.65], [-2, 1.9], [-10, 2.3], [-18, 2.7], [-24, 2.9]],       // [z', y] in SW's frame
};

// The south-west range (the heritage front of the 2022-09 panoramas: red brick, cream dressings, a
// pavilion at each end) is turned 22.25 deg from the frame. Its own frame (x', z'): x' across (negative
// outward, to Symonds Street), z' along it toward Grafton Road. swMatrix() takes a point drawn
// in that frame to the view frame: x = x' cos a + z' sin a, z = -x' sin a + z' cos a.
export const SW = {
  angle: 22.25,
  // the outer edge of its cornice and parapet seen from above (the wall face is a little inside it)
  edge: -24.6,
  // its inner side: the valley against the middle ranges' roofs
  inner: -13.0,
  // its ends along z': the back pavilion (north-west) and the corner pavilion on Grafton Road
  back: -24.0,
  front: 14.6,
  // top of the parapet over the cornice (along the whole outer edge, 14.0 to 14.35)
  parapet: 14.3,
  // a low roof behind the parapet: ridge along z' at x' -19.5, valley at x' -13
  ridge: { x: -19.5, y: 15.1 },
  valley: 13.8,
};
export function swMatrix() {
  return new THREE.Matrix4().makeRotationY((SW.angle * Math.PI) / 180);
}
/** A point (x', y, z') in the south-west range's frame, in the view frame. */
export function swPoint(xp, y, zp) {
  const a = (SW.angle * Math.PI) / 180;
  return [xp * Math.cos(a) + zp * Math.sin(a), y, -xp * Math.sin(a) + zp * Math.cos(a)];
}
