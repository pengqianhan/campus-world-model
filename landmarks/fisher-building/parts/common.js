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
  // Storeys: a white band at every floor (the photographs). The building's returns within 2 m of its
  // walls peak at 8.6, 11.5, 14.5, 17.4, 20.3, 23.1, 26.0, 28.9 and 31.6 m (0.25 m bins; their
  // autocorrelation peaks at 2.75-3.0 m): 23.0 m over eight storeys, 2.875 m each, from 2.875 m.
  floor: 2.875,
  // The lower part's faces turned to the west and north-west (the tower plan's edges 10 to 13, from
  // [5.2, 8.0] to [10.0, 0.8]), with balconies and louvres in MGAo's photograph.
  wing: { edges: [10, 11, 12, 13] },
  // The window slot: on the tower plan's edge 17 (the shaft's south-west face, from [12.5, -8.8] to
  // [9.2, -12.0]), from 0.62 to 0.80 of the way along it, near its south end (the photograph).
  slot: { edge: 17, from: 0.62, to: 0.8 },
};
