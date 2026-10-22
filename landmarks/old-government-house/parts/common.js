// Shared sizes, measured in the LINZ 2024 LiDAR (data/old-government-house_pts.npy) by the first round's
// front and back agents (2026-10-22), in the view frame of config/old-government-house.json: x to the
// right as seen from the lawn on the north-east, y up from the ground at the porch (37.5 m NZVD2016),
// z toward the lawn; the centre of the main roof's high points at x = z = 0. Owned by the lead: read,
// do not edit. Since round 2 the parts read these numbers and apply, in their own files, what that round
// measured more closely (to fold in here next round, keeping the model the same):
//   wings.se.x[1] -14.1 (eave on the courtyard side); balconies.se.x[0] -23.5 (flush with the wing);
//   behind.x [-3.95, 3.5]; chimneys: the north-west one at about [18.0, -4.2, 12.9], and a south-east one
//   at [-19.85, -4.2, 12.85]; low: the room's hip end at x -34.5, a lean-to beyond it falling from 3.25 to
//   2.6 m by x -37.75; west: x [-10.6, -7.5], z [-25.65, -8], eaves 3.55 (west) and 3.9 (east), ridge at
//   x -8.7; east: its east end at x 22.3 (z -21.6) to 22.0 (z -14.6); northEast: z [-13.95, -9.6];
//   southEast: x [-16, -10.6], its ridge stopping at x -13.0; south: from x -7.4 to 16.0-16.15.
// The front range looks turned about 1.3 deg in the frame (north-west end toward the lawn): its
// balustrade stands at z 6.6 near x -12 and 7.1 near x +9 (main.js FRONT.backFlush makes up for it).
// Where the walls start: below the ground at the porch (y = 0), deep enough for the site's ground. The site
// stands the model at its ground under the door, and that ground is the 8 m elevation model, which falls
// up to 1.1 m below the porch under the south-east end (the LiDAR's ground there: 0.6-0.9 m) and rises up
// to 2.4 m under the north-west end. The walls go down to 1.6 m below the porch, so that no end hangs in
// the air, as a block's footing does (src/scene/terrain.ts).
export const FOOT = -1.6;

export const MEASURED = {
  // the front range: eave edge, a flat cornice band, and a hipped roof rising from z 6.5 to its ridge
  front: { x: [-17.6, 16.3], z: [-2.0, 7.75], cornice: 10.8, ridge: 12.65, ridgeZ: 2.6 },
  // its middle bay, 0.65 m forward under a cross gable that stops at z 6.5
  middle: { x: [-4.85, 3.65], front: 8.4, ridge: 12.85, ridgeX: -0.6 },
  // the end wings, their ridges along z
  wings: { se: { x: [-24.1, -14.4], z: [-10.2, 4.85] }, nw: { x: [14.0, 23.25], z: [-10.2, 5.75] }, eave: 9.9, ridge: 11.6 },
  // the wing behind the middle
  behind: { x: [-3.6, 3.75], back: -7.6, eave: 10.5, ridge: 12.1 },
  // the balcony bays in the corners between the wings and the front range
  balconies: { se: { x: [-24.3, -17.2], z: [4.25, 6.4] }, nw: { x: [15.9, 22.65], z: [5.15, 7.25] }, floor: 4.4, cornice: 5.35, rail: 6.3 },
  // the low range at the south-east end: a hipped roof, and a lean-to against the wing
  low: { x: [-36.5, -23.5], eave: 3.3, ridge: 4.6, ridgeZ: -6.65 },
  // the porch in the middle of the garden front
  porch: { x: [-3.55, 2.35], z: [7.95, 13.1], eave: 4.5, ridge: 5.1 },
  // chimneys: [x, z, top]
  chimneys: [[14.75, 3.2, 14.2], [-15.55, 2.75, 14.1], [-0.85, -0.75, 13.9], [19.25, -4.25, 12.95]],
  // the ranges behind, round the courtyard (back agent): the south range is turned 2.58 deg off the frame
  south: { x: [-7.3, 16], z: [-25.5, -12.3], eave: 5.8, ridge: 9.4, turn: 2.58 },
  east: { x: [16, 22.15], z: [-21.6, -14.6], eave: 4.65, ridge: 6.55 },
  northEast: { x: [14.6, 22.8], z: [-14.6, -10.3], roof: 7.7, parapet: 8.35 },
  west: { x: [-11.05, -7.5], z: [-26.1, -8], eave: 3.7, ridge: 4.5 },
  southEast: { x: [-16, -11], z: [-15.3, -8], eave: 3.95, ridge: 5.2 },
};
