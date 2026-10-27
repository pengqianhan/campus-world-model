// Shared sizes, measured in the LINZ 2024 LiDAR (data/fisher-building_pts.npy, building 804's points)
// in the view frame of config/fisher-building.json: x is -axis (west), y up from the frame's ground
// (29.1 m NZVD2016), z is toStreet (north); the frame's centre, the mean of the tower's points above
// 20 m, at x = z = 0. The plans are the LiDAR's own: each 0.5 m cell's highest building return, the
// cells at or above a height closed, filled and traced, the trace simplified to 0.6 m. Building 804's
// floor outline in campus.json holds 95% of the tower's cells. Owned by the lead: read, do not edit.
// Measured 2026-10-27 (baseline, round 0). Round 2: the shaft's south-west corners from lines fitted to the
// LiDAR's wall returns between 12 and 31.5 m (rms 0.03-0.17 m), where the 0.6 m simplification had cut them
// short: the west corner (14.3, -4.2), where the plan had two at [14.5, -3.2] and [14.5, -5.2]; the slot's
// corner (12.49, -8.48), where it had [12.0, -7.8] and [12.5, -8.8]; the south corner (9.04, -11.64).

// The ground round the tower falls from +3.3 m on the south-west (toward Waterloo Quadrant and the
// ramp) to -3.1 m on the north-east and east (toward the gully); walls go down to FOOT.
export const FOOT = -3.2;

export const MEASURED = {
  // The tower: every cell at 30 m or more (413 m2), its roof at 32.6 m (median of its returns).
  tower: {
    plan: [[9.04, -11.64], [3.8, -9.0], [1.8, -10.0], [-3.2, -10.0], [-9.5, -5.8], [-9.0, -5.2], [-12.5, 2.2],
      [-5.8, 12.0], [-4.8, 11.0], [2.2, 11.5], [5.2, 8.0], [7.8, 7.5], [9.0, 6.2], [10.5, 2.2], [10.0, 0.8],
      [14.3, -4.2], [12.49, -8.48]],
    top: 32.6,
  },
  // The shaft over its south-west half: every cell at 35.5 m or more (178 m2), its roof at 36.9 m
  // (median; 37.4 at p90; 36.96 over its south-west part, 37.33 over its east part). Its south-west faces
  // are the tower's own.
  shaft: {
    plan: [[9.04, -11.64], [4.2, -9.5], [1.8, -6.5], [-0.8, -6.5], [-2.0, -5.2], [-4.0, 0.2], [-0.8, 4.5],
      [5.2, 4.0], [8.2, 0.0], [9.2, 0.5], [11.8, -0.5], [14.3, -4.2], [12.49, -8.48]],
    top: 36.9,
  },
  // Storeys: a white band at every floor (the photographs). The building's returns within 2 m of its
  // walls peak at 8.6, 11.5, 14.5, 17.4, 20.3, 23.1, 26.0, 28.9 and 31.6 m (0.25 m bins; their
  // autocorrelation peaks at 2.75-3.0 m): 23.0 m over eight storeys, 2.875 m each, from 2.875 m.
  floor: 2.875,
  // The bands themselves: cream, nearly flush with the brick, 0.15 m high (6-7 px at half their brightness
  // in MGAo's tower view, through the fitted camera at about 23 m), their height read from the photograph.
  band: { h: 0.15, proud: 0.04 },
  // The lower part's faces turned to the west and north-west (the tower plan's edges 10 to 13, from
  // [5.2, 8.0] to [10.0, 0.8]), with balconies and louvres in MGAo's photograph.
  // Their balconies stand inside the outline (its edge is the roof's red tile fascia, over them), 1.0 m deep
  // (estimated from the photograph); the fascia is 1.0 m high (the photograph through the fitted camera).
  wing: { edges: [10, 11, 12, 13], deep: 1.0, fascia: 1.0 },
  // The window slot: in the corner between the shaft's two south-west faces (the tower plan's corner 16,
  // (12.49, -8.48)), where the LiDAR's wall returns stop 0.33 m short of the corner on one face and 0.52 m on
  // the other (a recess). Its width is MGAo's tower view's through the fitted camera
  // (streetview.camera_fixes): its white frame starts 1.05 m from the corner on the face to its north-west
  // (column 650) and ends 0.63 m from it on the face to its south-east (column 713); the frames are 0.30 and
  // 0.39 m wide there (to columns 662 and 700).
  slot: { corner: 16, onB: 1.05, onC: 0.63, frameB: 0.3, frameC: 0.39 },
  // The entrance's red tile canopy off the west corner: the convex hull of the LiDAR's building returns
  // between 8.3 and 11.5 m there (167 returns through the trees), its roof at 8.76 m (median; 9.22 at p90).
  // Through the fitted camera, the red tiles over the ramp in MGAo's tower view (column 345, row 980, at
  // about 10.5 m) lie at about (14.6, -0.3), inside it. Its depth below the roof (0.6 m) is estimated.
  canopy: {
    plan: [[17.7, -2.2], [16.7, 0.8], [15.0, 0.4], [12.9, -0.1], [11.2, -0.6], [11.1, -2.3], [11.4, -3.2],
      [14.6, -3.4], [16.3, -2.8]],
    top: 8.76, depth: 0.6,
  },
  // The ramp's deck west of the tower, where the LiDAR sees it through the trees (139 returns): level at
  // 5.90 m (median) over x 15.0 to 18.5, z -8.5 to -3.4, its white parapet on the west edge to 6.8 m (p90
  // 6.72-6.81), over ground at 3.2 m (the car park under it). Its slab's thickness (0.5 m) and the parapet's
  // (0.25 m) are estimated. Where it runs on under the trees to its end on the street (the "18") is not
  // drawn.
  deck: { x: [15.0, 18.5], z: [-8.5, -3.4], top: 5.9, parapet: 6.8 },
};
