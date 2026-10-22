// Shared sizes, measured in the LINZ 2024 LiDAR (data/old-choral-hall_pts.npy, flown 18 May 2024) by the
// lead (2026-10-22), in the view frame of config/old-choral-hall.json: x to the right as seen from Grafton
// Road on the south-east, y up from 37.7 m NZVD2016 (the ground at the door, config `door`), z
// toward the street. Owned by the lead: read, do not edit; report a size that is wrong, with numbers.
//
// The LiDAR was flown during building works: over the north-east blocks its tops are partly the temporary
// roofs of the scaffolds and their white wraps (README.md, "The sources: works in progress"); and along the south-west
// side the plane trees' crowns (17.5 to 25 m) are classed as building. Read heights there with care.
//
// After round 1 (2026-10-22) the closer measurements live in the parts, to fold in here next round (moving
// them would not change the model): parts/massing.js BLOCKS, every roof plane fitted to the LiDAR (rms
// 0.02-0.05 m), supersedes RANGES, NE, BACK, FRONT.porch and MEASURED below (the recess's "porch" is a
// scaffold deck and is not drawn); parts/southwest_range.js holds the range's face (FACE x' -24.4, the
// parapet's face 0.2 further out at the LiDAR's edge), its ends (BACK z' -23.6, CORNER 14.08), its bay
// spacing (2.266 m) and the floor heights fitted to the photographs (H: plinth top 2.78, ground-floor glass
// 4.63-7.57, sill band 8.86-9.33, first-floor glass 9.66-12.55, cornice 12.77-13.95, parapet 14.3).
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

// The Grafton Road front: the corner pavilion's face and the north-east block's face stand on z ~ 22.4;
// between them (x -10 to 2) the front is recessed to z ~ 13.2, with a low block 11 m up to z ~ 16.3.
export const FRONT = { z: 22.4, recess: { x: [-10, 2], z: 13.2 }, porch: { x: [-10, 2], z: [13.2, 16.3], top: 11.0 } };

// The gabled ranges behind the street front, side by side, their ridges along z (rough: measure them).
export const RANGES = {
  middle: { x: [-12.5, 2], z: [-9.5, 13.2], ridgeX: -3.5, ridge: 16.15, eave: 14.0 },
  right: { x: [2, 15], z: [-10, 22.4], ridgeX: 8.5, ridge: 16.65, eave: 14.8 },
};
// The north-east wing (x 15 to 24.5): three gables with their ridges along x, joined by low links.
export const NE = {
  x: [15, 24.5],
  gables: [
    { z: [5.5, 22.4], ridgeZ: 16.0, ridge: 16.5, eave: 14.25 },
    { z: [-10.5, 3.5], ridgeZ: -3.3, ridge: 16.1, eave: 14.15 },
  ],
  links: [{ z: [3.5, 5.5], top: 11.3 }, { z: [-13.5, -10.5], top: 11.9 }],
};
// Behind: a gabled block with its ridge along x (as high as the others), a lower range in the middle with
// its ridge along z, and low blocks on the south-west.
export const BACK = {
  right: { x: [6.5, 24.5], z: [-30.5, -13.5], ridgeZ: -20.5, ridge: 16.8, eave: 14.3 },
  middle: { x: [-12, 3.5], z: [-29, -10.5], ridgeX: -3.5, ridge: 13.2, eave: 9.5 },
  left: { x: [-21, -12], z: [-29, -12], top: 9.5 },
};

// The rough model's sizes (parts/massing.js, the baseline of round 1), kept until its parts are redrawn.
export const MEASURED = {
  main: { x: [-12.5, 15], z: [-10, 13.2], top: 16.2 },
  frontRight: { x: [2, 24.5], z: [13.2, 22.4], top: 16.5 },
  entrance: { x: [-10, 2], z: [13.2, 16.3], top: 11.0 },
  ne: { x: [15, 24.5], z: [-10.5, 13.2], top: 16.1 },
  backRight: { x: [6.5, 24.5], z: [-30.5, -10], top: 16.8 },
  backLeft: { x: [-21, 6.5], z: [-29, -10], top: 12.0 },
};
