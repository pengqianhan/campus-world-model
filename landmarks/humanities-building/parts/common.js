// Shared sizes, measured in the LINZ 2024 LiDAR (data/humanities-building_pts.npy: the building returns, class 6,
// in the crop box) in the view frame of config/humanities-building.json: x is -axis (south-east, along the street
// wing), y up from the frame's ground (32.9 m NZVD2016, the median ground in the crop box, and the LiDAR's ground at
// the config's door), z is toStreet (south-west, toward the courtyard and Symonds Street); the frame's centre at
// x = z = 0. Owned by the lead: read, do not edit. Measured 2026-11-05 (baseline, round 0).
//
// How: the 90th percentile of the returns in each 0.5 m cell (the roofs' heights and where they step), and, face by
// face in 1 m strips, the outermost return above 15.5 m (the eave's front) and the 97th percentile outward of the
// returns 3-14 m up (the wall). The building is an L: the street wing along x and the north-east wing from its
// north-west end along z, each a higher middle under a roof of two low slopes (its ridge at 21.3 m, its eaves at
// 20.35) with a lower roof round its outer sides that falls from a step at about 18.2-19.1 m to the eaves at
// 16.8-17.3 (the aisles); over the corner where the wings meet a raised roof on eight sides to 23.8 m; at the
// street wing's south-east end, where the ground is 8 m lower, a low block with a flat roof at 6.2 m.

// The ground (the LiDAR's ground returns, relative to 32.9) round the building: +0.15 to +0.3 in the courtyard before
// the street wing's south-west face and along the north-west end, -1.7 to 0 along the north-east wing's north-west
// face, -7.6 to -7.9 before the inner faces (in the angle of the L), the north-east end and round the low block
// (p5 of the crop box -8.5). The walls go down to FOOT.
export const FOOT = -8.5;

export const MEASURED = {
  // The aisles' eaves: the eave's front, point by point round the outer faces, from the street wing's south-east
  // end on its north-east side, round the south-west face, the north-west end and face, to the north-east end's
  // south-east corner ([x, eave, z]). The south-west face: its eave's front at z 16.27 (the median of its strips,
  // 16.10-16.55) south-east of x -1.05, where its eave is 16.83 m (16.79-16.88), and 0.3 m forward north-west of it
  // (the step at the stair's slot, x -1.0: the 0.5 m cells either side of it at the two parts' heights, step 6; drawn
  // 0.05 m north-west of it, so that the eave's return does not lie in the plane of the windows' frames' ends),
  // z 16.6 (16.35-16.81), where its eave is 17.28 m (17.25-17.33); its corners cut at 45 degrees. The north-west end
  // (z -0.25 to 12.7) at x -17.9, its eave 17.30; the north-east wing's north-west face 0.75 m further in, x -17.15
  // (-16.97 to -17.37), its eave 16.82; the north-east end at z -30.55, its eave 16.83; its south-east corner
  // rounded back to the inner face (x -3.2 at z -24.4), drawn in two straight runs. The street wing's south-east end
  // at x 24.25 (24.09-24.44), its eave 16.83, its corners cut.
  eave: [
    [20.4, 17.0, 2.9], [24.25, 16.83, 5.2], [24.25, 16.83, 12.3], [20.3, 16.83, 16.27], [-1.05, 16.83, 16.27],
    [-1.05, 17.28, 16.6], [-14.0, 17.28, 16.6], [-17.9, 17.30, 12.7], [-17.9, 17.30, -0.25], [-17.15, 16.82, -0.25],
    [-17.15, 16.82, -26.7], [-13.3, 16.83, -30.55], [-6.6, 16.83, -30.55], [-5.0, 16.9, -26.5], [-3.2, 17.0, -24.4],
  ],
  // and their tops, at the step up to the middles, point for point: each 0.3 m inside the middles' walls (so that
  // the aisles' roofs run into them), at the height of the aisle's slope there (the slopes, from the cells' heights
  // across each aisle: the street wing's south-west side 0.245 m a metre south-east of x -1.05 and 0.26 north-west of
  // it; the north-west end 0.246; the north-east wing's north-west side 0.27; the north-east end 0.21; the south-east
  // end 0.23). A point repeated is a hip at a corner; where two points stand one over the other the aisle steps.
  aisleTop: [
    [19.3, 17.97, 3.2], [19.3, 17.97, 3.2], [19.3, 18.3, 9.8], [19.3, 18.3, 9.8], [-1.05, 18.42, 9.8],
    [-1.05, 19.05, 9.8], [-10.6, 19.07, 9.8], [-10.6, 19.07, 9.8], [-10.6, 19.10, -0.25], [-10.75, 18.55, -0.25],
    [-10.75, 18.38, -24.0], [-10.75, 18.38, -24.0], [-4.0, 18.21, -24.0], [-4.0, 18.21, -24.0], [-4.0, 18.21, -24.0],
  ],
  // The walls stand back from the eave's front by the overhang: 0.4-0.5 m on the south-west face (its walls at z
  // 15.9 and 16.1), 0.55 at the north-east end, 0.4 at the north-west end; on the north-east wing's north-west face
  // the returns 3-14 m up reach the eave's line (something proud of the wall there: round 1). 0.45 everywhere.
  overhang: 0.45,
  fascia: 0.35,
  // The street wing's middle: its roof from its inner face (the eave's front at z 2.4, 2.17-2.51) to the step
  // (z 10.3, where the cells drop from 20.4 to 18.2 m), its ridge at 21.3 m on z 6.35 (21.29-21.35 from x 2 to
  // 14), its eaves 20.35 (20.30-20.41); hipped at its south-east end, its ridge falling from x 15 to 19.75 m at x 20.
  // Its north-west end runs into the corner, under the raised roof to x -2.2, so that it covers the corner's south-
  // east cut (step 6: the returns there 20.3-20.6 m, its slope's). Its walls 0.5 m inside the inner face's eave (the
  // overhang on the north-east wing's inner face, 0.50: its eave's front at x -3.2, its wall at -3.72) and 0.2 m
  // inside the step.
  street: { x: [-2.2, 20.0], z: [2.4, 10.3], ridge: 21.3, at: 6.35, eave: 20.35, hip: [0, 5.0],
    plan: [[-2.0, 2.9], [19.6, 2.9], [19.6, 10.1], [-2.0, 10.1]] },
  // The north-east wing's middle: from the step (x -11.25) to its inner face (the eave's front at x -3.2, -3.07 to
  // -3.48), its ridge at 21.3 m on x -7.25 (21.28-21.32 from z -21 to -5), its eaves 20.35 (20.31-20.39); hipped at
  // its north-east end, the ridge falling from z -21 to 20.4 m at z -24.5, where the cells drop to the aisle round
  // the end. Its south-west end runs into the corner, to z 0.5, so that it covers the corner's north-west cut (step
  // 6: the returns there 20.3-20.8 m, its west slope's).
  northeast: { x: [-11.25, -3.2], z: [-24.5, 0.5], ridge: 21.3, at: -7.25, eave: 20.35, hip: [3.5, 0],
    plan: [[-11.05, -24.3], [-3.7, -24.3], [-3.7, 0.3], [-11.05, 0.3]] },
  // Over the corner, a raised roof on eight sides (step 6, from the returns themselves): the returns above 21.4 m
  // bound an octagon, the corners of a square cut, the north-east one most, along the diagonal from (-6.55, -1.45)
  // to (0.4, 5.5) (each side where the outermost returns stop, in 16 directions). Its roof is the lowest of one plane
  // per side, each rising 0.65 a metre inward from that side's eave, and flat at the top at 23.8 m (fitted to the 803
  // returns more than 0.3 m inside the sides: rms 0.20 m, 90% within 0.08; the highest returns' p99.9 23.86). The
  // eaves of the north and east sides are left out: no return lies on their planes (the roof's edge there is the
  // planes beside them, 22.3 and 22.25 at the highest: the returns' 22.0-22.5). Its walls at its eaves' fronts (no
  // overhang: the LiDAR cannot see one), from below the aisles' tops.
  corner: { plan: [[-10.95, 0.35], [-9.15, -1.45], [-6.55, -1.45], [0.4, 5.5], [0.4, 7.8], [-1.6, 9.8], [-9.15, 9.8], [-10.95, 8.0]],
    eaves: { 0: 21.5, 2: 21.9, 4: 21.55, 5: 21.3, 6: 21.35, 7: 21.3 }, slope: 0.65, top: 23.8, foot: 18.8,
    // Under it, the square round 0 took from the cells' steps, at the aisles' tops (the returns in its corners outside
    // the octagon 18.9-20.5 m where neither middle runs on into them); and north-east of the octagon's diagonal side,
    // in the angle of the L, a roof the returns put at 20.9-21.3 m: flat at 20.95, over the fill.
    base: { plan: [[-10.9, -1.75], [0.3, -1.75], [0.3, 10.0], [-10.9, 10.0]], top: 19.1 },
    inner: { plan: [[-7.55, -1.75], [0.3, -1.75], [0.3, 6.1]], foot: 20.0, top: 20.95 } },
  // In the angle of the L, the inner faces' corner filled: the cells at 20.5-21.0 m out to x 1.85 (z -3.5 to 1,
  // 1.65-2.03) and z -4.4 (x -4); flat at 20.7 m (round 1: the slopes), its walls 0.5 m in.
  fill: { plan: [[-3.9, -3.9], [1.35, -3.9], [1.35, 3.2], [-3.9, 3.2]], roof: [[-3.4, -4.4], [1.85, -4.4], [1.85, 3.4], [-3.4, 3.4]], top: 20.7 },
  // The low block at the street wing's south-east end: its eaves at 6.2 m (every strip's 6.12-6.27), its faces with
  // no overhang (edge and wall within 0.2 m): to the north-east at z 0.8 (0.71-0.93), the south-west at z 13.35
  // (13.06-13.57), the south-east at x 38.0 (37.83-38.16), its south-east corners cut; its north-west end in the
  // street wing, out to x 21.8 on its north-east side (its cells from x 22). Its roof rises to a ridge at 7.8 m on
  // z 7.25 (each column's highest cell 7.75-7.82 from x 24 to 32, on z 6.75-7.25), hipped from x 33.5 (the
  // ridge's cells 7.21 at x 34, 6.38 at x 37).
  low: { plan: [[21.8, 0.8], [34.6, 0.8], [38.0, 3.1], [38.0, 10.4], [35.1, 13.35], [22.6, 13.35], [21.8, 12.0]], eave: 6.2,
    ridge: [[21.8, 7.8, 7.25], [33.5, 7.8, 7.25]] },
  // The street wing's south-west face, the one the photograph shows (round 1). Its brick bands, from the LiDAR's
  // returns on the face (the bands' lower and upper edges, p3 and p97: south-east of the stair 3.00/4.68,
  // 6.48/8.19, 9.96/11.75 and 13.45; north-west of it 3.02/4.75, 6.56/8.21, 9.99/11.73 and 13.55), their face at the
  // walls' line (z 15.82 and 16.15: the returns' p90 15.84-15.88 and 16.08-16.12); the top band's upper edge, hidden
  // from the LiDAR under the eave, read off the photograph through its fitted camera (the luma step from window to
  // brick, cast onto the face's plane: 14.71-15.18 south-east of the stair, 14.8 drawn; 15.02-15.26 north-west of it,
  // 15.1 drawn); under the lowest windows a brick base to 0.9 m (the photograph: the step from window to brick at
  // 0.80-0.90, behind the planter, estimated). Between the bands, ribbons of windows set back by `recess` (estimated:
  // neither the LiDAR nor the photograph gives it), their panes `module` wide (estimated from the photograph's rhythm,
  // 1.3-1.4 m), two of every three with the film over them (estimated: the photograph's panes are filmed in no rule
  // the eye can follow). The stair's slot from the LiDAR (round 0's step: x -1.0 to 0.5); the entrance at its foot
  // from the photograph (its sides at x -2.0 and 1.3 on the face, its top at the LiDAR's returns at 3.2-3.6 m: 3.3).
  faces: {
    recess: 0.25, module: 1.4,
    right: { x: [0.5, 19.9], z: 15.82, bands: [[FOOT, 0.9], [3.00, 4.68], [6.48, 8.19], [9.96, 11.75], [13.45, 14.8]], top: 16.83 },
    // (its bands' north-west ends cut along the corner's 45 degrees, `mitre`, so that none stands out of it)
    left: { x: [-13.55, -1.0], z: 16.15, bands: [[FOOT, 0.9], [3.02, 4.75], [6.56, 8.21], [9.99, 11.73], [13.55, 15.1]], top: 17.28, mitre: true },
    slot: { x: [-1.0, 0.5] },
    entrance: { x: [-2.0, 1.3], top: 3.3 },
  },
};
