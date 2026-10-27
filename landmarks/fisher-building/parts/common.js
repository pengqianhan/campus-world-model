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
    // a parapet round its roof (round 2): 83 of the 84 returns above 37.6 m lie within 1 m of this
    // outline, their median 37.95 m (the roof inside it 36.99 m); 0.25 m thick, estimated
    parapet: 37.95,
  },
  // Storeys: a white band at every floor (the photographs). The building's returns within 2 m of its
  // walls peak at 8.6, 11.5, 14.5, 17.4, 20.3, 23.1, 26.0, 28.9 and 31.6 m (0.25 m bins; their
  // autocorrelation peaks at 2.75-3.0 m): 23.0 m over eight storeys, 2.875 m each, from 2.875 m.
  floor: 2.875,
  // The bands themselves: cream, nearly flush with the brick, 0.15 m high (6-7 px at half their brightness
  // in MGAo's tower view, through the fitted camera at about 23 m), their height read from the photograph.
  // On the shaft above the tower's roof the band is not at the next storey's 34.5 m but lower (round 3): the
  // shaft's returns within 1.5 m of its walls peak at 33.5-34.0 m (225 returns), and MGAo's tower view through
  // the fitted camera puts that band at 33.7-34.0 m on both faces by the slot (the bands below it at
  // 31.6-32.0, 29.1-29.2 and 26.1-26.2 m). The top storey is not taller: the band nearest the shaft's top is
  // 2.1 m over the one below it.
  band: { h: 0.15, proud: 0.04, shaft: 33.75 },
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
  // Its recess (round 3), cut into both plans' corner (the shaft plan's corner 12): the LiDAR's returns between
  // 10 and 31 m stand 0.14-0.33 m behind the face to the north-west from the corner to 0.8 m along it, and
  // 0.31-0.49 m behind the face to the south-east to 0.4 m; 51 returns stand behind both faces' lines within
  // 2 m of the corner, 0.33 and 0.41 m deep (medians): 0.33 m deep. The frames beside it stand 0.1 m proud (the
  // returns from 0.8 to 1.2 m along the north-west face, +0.11 m), from the recess's edges to the frames'
  // outer edges in the photograph.
  slot: { corner: 16, shaftCorner: 12, onB: 1.05, onC: 0.63, frameB: 0.3, frameC: 0.39,
    recess: { onB: 0.8, onC: 0.4, depth: 0.33 } },
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
  // 5.90 m (median) over x 15.0 to 18.5, z -8.5 to -3.4, over ground at 3.2 m (the car park under it). Its
  // slab's thickness (0.5 m) is estimated. Its white parapet is the ramp's (below), on the line the LiDAR
  // gives; round 2 stood it on the deck's west edge.
  deck: { x: [15.0, 18.5], z: [-8.5, -3.4], top: 5.9 },
  // The ramp's white side along the street, from the deck down to the street (round 3). Its line is the
  // LiDAR's: the west edge of the narrow strip of flat returns at 6.6-6.85 m (the plants in the planter on
  // the ramp's street side, over the ramp's own returns at 5.8-5.9 m) from (17.9, -2.2) to (25.55, -14.5); there
  // the LiDAR's ground has risen to the ramp (5.65 m, from 3.4-3.6 m under it). Its top and foot are MGAo's
  // door and upper views through the fitted camera (streetview.camera_fixes), on that line: over the car
  // park, s 2-8 m along it, the white face's top edge at 6.0-6.5 m (median 6.22, 39 columns of the two
  // views) under the plants, its lower edge at 4.65-4.70 m (4.66). From s 8 m on, the tree, the pole and
  // the "18" sign stand in front of it in both views, and the foot is the LiDAR's ground where that is
  // higher (5.24 m and 5.65 m at the last two corners). Round 2 placed its top edge at the plants'
  // 6.8 m, which put the line 1-5 m nearer the camera than the LiDAR's returns, over open ground at
  // 3.5-4.3 m, and stretched MGAo's tower view's box. Its thickness (0.3 m) is estimated.
  ramp: {
    line: [[18.0, -2.2], [20.1, -8.0], [20.65, -9.3], [22.9, -11.7], [24.5, -13.0], [25.5, -14.5]],
    top: [6.22, 6.22, 6.22, 6.22, 6.22, 6.22],
    foot: [4.66, 4.66, 4.66, 4.66, 5.24, 5.65],
  },
};
