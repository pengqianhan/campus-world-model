// Shared sizes, measured in the LINZ 2024 LiDAR (data/fifteen-eden-crescent_pts.npy, building 802's points
// within 1 m of its floor outline) in the view frame of config/fifteen-eden-crescent.json: x is -axis
// (north-west, along Eden Crescent), y up from the frame's ground (17.3 m NZVD2016), z is toStreet
// (north-east, toward Eden Crescent); the frame's centre at x = z = 0. Owned by the lead: read, do not
// edit. Measured 2026-10-27 (baseline, round 0).

// The ground (the LiDAR's ground returns, round 2): -0.85 to -1.05 m on Eden Crescent's footpath at the
// street face's foot, -0.17 to +0.1 m behind the building, -0.16 at the south-east end (round 0 had the
// footpath and the back the wrong way round); walls go down to FOOT.
export const FOOT = -1.2;

export const MEASURED = {
  // The building: building 802's floor outline in campus.json, in this frame. Its two storeys' roof
  // stands at 7.65 m along the street (median of the returns at z 7 to 11) and 7.84 m behind (z -11 to
  // -7); 7.75 m here.
  body: {
    plan: [[19.1, 3.9], [18.9, 11.6], [-19.3, 12.3], [-18.7, 6.8], [-20.2, 6.6], [-18.9, -2.9], [-24.2, -2.2],
      [-24.0, -3.5], [-18.7, -4.2], [-18.6, -4.9], [-17.2, -4.9], [-16.4, -10.7], [-7.3, -10.9], [-7.1, -12.7],
      [-2.1, -12.7], [-2.1, -12.4], [0.0, -12.3], [0.0, -10.9], [19.5, -11.2]],
    top: 7.75,
  },
  // The top storey, set back from both long sides: every cell at 9.2 m or more is a band 12 m wide down
  // the middle (z -6.0 to 6.0) from x -20.0 to 17.2; its flat roof at 10.33 m (median; 10.59 at p90).
  spine: { x: [-20.0, 17.2], z: [-6.0, 6.0], top: 10.33 },
  // The north-west end, as high as the top storey across the building's whole depth (x 17.2 to 19.5):
  // its roof at 10.72 m (median; a few returns to 13.7 m, plant on it).
  end: { x: [17.2, 19.5], z: [-11.6, 11.6], top: 10.72 },
  // The storeys: the ground floor to 3.6 m, the first floor above it (estimated: MH15's photograph shows
  // two rows of windows under the roof at 7.75 m).
  floor: 3.6,
};
