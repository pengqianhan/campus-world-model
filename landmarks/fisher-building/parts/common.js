// Shared sizes, measured in the LINZ 2024 LiDAR (data/fisher-building_pts.npy, building 804's points)
// in the view frame of config/fisher-building.json: x is -axis (west), y up from the frame's ground
// (29.1 m NZVD2016), z is toStreet (north); the frame's centre, the mean of the tower's points above
// 20 m, at x = z = 0. The plans are the LiDAR's own: each 0.5 m cell's highest building return, the
// cells at or above a height closed, filled and traced, the trace simplified to 0.6 m. Building 804's
// floor outline in campus.json holds 95% of the tower's cells. Owned by the lead: read, do not edit.
// Measured 2026-10-27 (baseline, round 0).

// The ground round the tower falls from +3.3 m on the south-west (toward Waterloo Quadrant and the
// ramp) to -3.1 m on the north-east and east (toward the gully); walls go down to FOOT.
export const FOOT = -3.2;

export const MEASURED = {
  // The tower: every cell at 30 m or more (413 m2), its roof at 32.6 m (median of its returns).
  tower: {
    plan: [[9.2, -12.0], [3.8, -9.0], [1.8, -10.0], [-3.2, -10.0], [-9.5, -5.8], [-9.0, -5.2], [-12.5, 2.2],
      [-5.8, 12.0], [-4.8, 11.0], [2.2, 11.5], [5.2, 8.0], [7.8, 7.5], [9.0, 6.2], [10.5, 2.2], [10.0, 0.8],
      [14.5, -3.2], [14.5, -5.2], [12.5, -8.8]],
    top: 32.6,
  },
  // The shaft over its south-west half: every cell at 35.5 m or more (178 m2), its roof at 36.9 m
  // (median; 37.4 at p90). Its south-west faces are the tower's own.
  shaft: {
    plan: [[9.2, -12.0], [4.2, -9.5], [1.8, -6.5], [-0.8, -6.5], [-2.0, -5.2], [-4.0, 0.2], [-0.8, 4.5],
      [5.2, 4.0], [8.2, 0.0], [9.2, 0.5], [11.8, -0.5], [14.5, -3.2], [14.5, -5.2], [12.0, -7.8], [12.5, -8.8]],
    top: 36.9,
  },
  // Storeys: white bands at every floor (the photographs), 3.3 m apart from 3.3 m (estimated: the
  // tower's 32.6 m over ten storeys above the street side's ground); not yet measured.
  floor: 3.3,
};
