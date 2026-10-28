// Shared sizes, measured in the LINZ 2024 LiDAR (data/fifteen-eden-crescent_pts.npy, building 802's points
// within 1 m of its floor outline) in the view frame of config/fifteen-eden-crescent.json: x is -axis
// (north-west, along Eden Crescent), y up from the frame's ground (17.3 m NZVD2016), z is toStreet
// (north-east, toward Eden Crescent); the frame's centre at x = z = 0. Owned by the lead: read, do not
// edit. Measured 2026-10-27 (baseline, round 0); the roofs measured again 2026-10-28 (round 3).

// The ground (the LiDAR's ground returns, round 2): -0.85 to -1.05 m on Eden Crescent's footpath at the
// street face's foot, -0.17 to +0.1 m behind the building, -0.16 at the south-east end (round 0 had the
// footpath and the back the wrong way round); walls go down to FOOT.
export const FOOT = -1.2;

export const MEASURED = {
  // The building: building 802's floor outline in campus.json, in this frame. Its walls stop under the
  // roofs' eaves (eave): the roofs below meet the street face at 7.18-7.29 m and the back at 7.29-7.49.
  body: {
    plan: [[19.1, 3.9], [18.9, 11.6], [-19.3, 12.3], [-18.7, 6.8], [-20.2, 6.6], [-18.9, -2.9], [-24.2, -2.2],
      [-24.0, -3.5], [-18.7, -4.2], [-18.6, -4.9], [-17.2, -4.9], [-16.4, -10.7], [-7.3, -10.9], [-7.1, -12.7],
      [-2.1, -12.7], [-2.1, -12.4], [0.0, -12.3], [0.0, -10.9], [19.5, -11.2]],
    eave: 7.15,
  },
  // The two storeys' roofs (round 3): not flat, a plane on each side of the top storey, rising from the
  // eaves to its walls. Least squares over the building's returns 6.9-8.4 m high at x -16 to 12: along the
  // street (z 6.6 to 11.6, 2,558 returns, 99% within 0.1 m of it) y = 9.049 - 0.1517 z, 8.14 m at z 6.0 and
  // 7.29 at the street face; at the back (z -11.8 to -6.6, 2,100 returns, 76% within 0.1 m: a few units
  // stand on it) y = 9.024 + 0.1368 z, 8.20 m at z -6.0 and 7.29-7.49 at the back wall; neither slopes
  // along x (0.003 and 0.001 m a metre). From x 14.5 to the north-west end the street side's roof is
  // flat (flat: the medians in 0.5 m cells at x 15 to 18.5 are 7.1-7.4 m), and so is the part of the
  // plan under the top storey and beyond its south-east end (7.3; 6.5-7.4 m there).
  roofs: { street: [9.049, -0.1517], back: [9.024, 0.1368], flatFrom: 14.5, flat: 7.3 },
  // The top storey down the middle (round 3): its walls at z -6.0 and 6.0 (round 0), under a curved roof.
  // The medians of its returns in 0.5 m bands across it (x -18 to 15, 260-330 returns a band) follow
  // y = 10.60 - 0.0417 (z + 0.25)^2 to within 0.05 m: 10.60 at the crown, 9.09 and 9.32 at z 5.75 and
  // -5.75, its returns ending at the eaves, z 6.3 (8.89 m) and -6.8 (8.91 m). The roof runs from x -21.0
  // (10.25 m at x -21.0, 9.2 at -21.5), beyond the walls' end at the plan's south-east edge (x -19.0), to
  // the party wall with 9 Eden Crescent (801) at x 18.6. From x 16.0 its crown is cut flat at 9.72 m (the
  // medians in 0.5 m cells at x 16.0 to 18.0, z -5 to 3.5: 9.7-9.8), its sides falling as before. Not
  // drawn: at the south-east end its back half is lower, a well at x -22 to -15.5, z -4 to -0.5, its floor
  // at 6.5 m with a unit at 8.1 m in it, and a strip at 9.1-9.2 m beyond it (z -6 to -4.5); the curve
  // runs on over them (estimated).
  top: { x: [-19.0, 18.6], roofX: [-21.0, 18.6], z: [-6.0, 6.0], eaves: [-6.8, 6.3], crown: 10.6, at: -0.25, k: 0.0417, cut: { from: 16.0, y: 9.72 } },
  // What the LiDAR shows at the north-west end (x 17.2 to 20) and leaves to 801: a strip 11.6-11.8 m high
  // along the party line (x 18.5 to 20, z -13 to 11.6; 242 of its returns above 10.9 m inside 801's outline,
  // 232 inside 802's) is 801's terrace parapet, which 801's model draws at x 18.7-18.95 in this frame (its
  // z -9.4 to -9.15) to 11.4 m (11.1 in 801's frame, whose ground is 0.3 m higher); beyond it, at x 19.5-21,
  // 801's terrace at 10.75 m; the returns to 13.0-13.7 m at x 18-20.5, z 10-11.8, are 801's raked corner
  // (12.8 m in 801's frame); two single returns at 13.3 m (x 18.9, z -8.6 and x 19.5, z 8.2) stand on that
  // parapet's line. None is drawn here: round 0's end block, 10.72 m across the whole depth, is gone.
  // The storeys: the ground floor to 3.6 m, the first floor above it (estimated: MH15's photograph shows
  // two rows of windows under the roof).
  floor: 3.6,
};

/** The top storey's roof at z: its curve, or cut flat at `cut` where the curve rises above it. */
export function topRoof(z, cut = Infinity) {
  const t = MEASURED.top;
  return Math.min(t.crown - t.k * (z - t.at) ** 2, cut);
}
