// Shared sizes, measured in the LINZ 2024 LiDAR (data/old-choral-hall_pts.npy, building 104's points) in
// the view frame of config/old-choral-hall.json: x to the right as seen from Symonds Street on the
// south-east, y up from the ground at the middle of the street front (37.7 m NZVD2016 for now), z toward
// the street; the centre of the high roofs at x = z = 0. Owned by the lead: read, do not edit. Rough
// sizes for the first model, measured 2026-10-22 on 4 m bands; the first round measures them closely.
export const MEASURED = {
  // the tall gabled hall along the south-west side, turned about 16.4 deg off the frame
  hall: { from: [-27.5, -20], to: [-16.6, 22], width: 11, eave: 15, ridge: 24 },
  // the main block between it and the street front, flat-roofed
  main: { x: [-22, 22.5], z: [-12, 12], top: 16.4 },
  // the street front: two blocks either side of a lower entrance between them
  frontLeft: { x: [-20, -10], z: [12, 22], top: 16.5 },
  entrance: { x: [-10, 1.6], z: [12, 20], top: 9.2 },
  frontRight: { x: [1.6, 24.4], z: [12, 22], top: 16.5 },
  // behind: a block as high as the main one, and a lower one beside it
  backRight: { x: [5.7, 24.4], z: [-32, -12], top: 16 },
  backLeft: { x: [-22, 5.7], z: [-32, -12], top: 11 },
};
