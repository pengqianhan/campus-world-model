// Shared sizes, measured in the LINZ 2024 LiDAR (data/thomas-building_pts.npy, building 110's returns
// within 1.5 m of building.outline, none of its neighbours': config, outline_note) in the view frame of
// config/thomas-building.json: x is -axis (north-east, along the road), y up from the frame's ground
// (36.17 m NZVD2016, at the door), z is toStreet (south-east, toward the road); the frame's centre at
// x = z = 0. Owned by the lead: read, do not edit. Measured 2026-10-28 (baseline, round 0).

// The building's long faces do not run along x: fitted to the outer edges of their parapets' tops
// (returns 14.9-15.5 m up, the outermost per 2 m strip, least squares), the face to the road is
// z = 21.784 + 0.0188 x (26 strips, rms 0.07 m), the back z = -22.009 + 0.0176 x, and the courtyard's two
// long walls z = 7.548 + 0.0176 x and -7.877 + 0.0187 x: the four slopes' mean, 0.0182, is a turn of
// 1.04 deg. The model is drawn in the building's own axes, u along the long faces and v across them,
// and model.js turns it by SLOPE onto the frame: x = u cos t - v sin t, z = u sin t + v cos t.
export const SLOPE = 0.0182;

// The ground (the LiDAR's ground returns, relative to 36.17): along the face to the road -0.88 to +0.44
// (p50 -0.03), along the back -0.65 to +0.10, at the south-west end -0.23 to +1.06, at the north-east end
// -1.83 to -0.03 (p50 -1.66). The walls go down to FOOT.
export const FOOT = -2.0;

export const MEASURED = {
  // The plan, in (u, v): the outer faces and the courtyard's walls, where their parapets' tops end
  // (above): the face to the road v 21.78, the back v -22.01; the ends from the strips across them
  // (6 and 10 strips, noisier: rms 0.06 and 0.23), north-east u 30.95, south-west u -29.1; the
  // courtyard u -10.95 to 13.47 (6 strips each, rms 0.03), v -7.88 to 7.55. 60.1 by 43.8 m outside.
  outer: { u: [-29.1, 30.95], v: [-22.01, 21.78] },
  court: { u: [-10.95, 13.47], v: [-7.88, 7.55] },
  // Round every face, the returns gather on four ledges (peaks of a 0.25 m histogram of the returns
  // within 1.2 m of each face): 2.38, 7.12 and 11.12 m (118-199 returns each on the two long faces) and
  // the parapets' tops at 15.12. The ledges stand as far out as the parapets' tops (v 21.47-21.50
  // against 21.35 at the p50, the same at the p90).
  ledges: [2.38, 7.12, 11.12],
  // The parapets: a broad top 15.13 m high (the medians across each wing, 15.06-15.18), and behind
  // it a gutter at 14.26 (14.22-14.38), from which the roofs rise. Their widths from the sections
  // across each wing (medians in 0.25 m bins along 41-50 m of it): outside, 1.55 m to the road (v 20.23
  // to the face), 1.4 at the back, 1.5 at the south-west end, 0.9 at the north-east end; in the
  // courtyard 1.5 (south-east wing), 1.0 (north-west), 1.6 (south-west), 0.6 (north-east).
  parapet: { top: 15.13, gutter: 14.26,
    outer: { se: 1.55, nw: 1.4, sw: 1.5, ne: 0.9 }, inner: { se: 1.5, nw: 1.0, sw: 1.6, ne: 0.6 } },
  // The roofs over each wing, behind the parapets: each rises from walls that stand up from the gutter
  // (a storey set back), in planes fitted to the sections' medians.
  roofs: {
    // the back (north-west) wing, u -26.5 to 15.0 (the plan of the returns 16.5-20.5 m high): a ridge
    // at v -15.25, 19.23 m (19.27 at the median along u -18 to 4.5; 18.9 from u 5 to 14), falling
    // 0.452 a metre outward to 17.31 at v -19.5 and 0.253 inward to 18.09 at v -10.75
    nw: { u: [-26.5, 15.0], v: [-20.0, -10.4], ridge: -15.25, top: 19.23, out: 0.452, in: 0.253 },
    // the wing to the road (south-east), u -14.0 to 10.5: a sawtooth: from 16.65 at v 9.5 up 0.415 a
    // metre to 18.62 at v 14.25, down to a flat 17.35 (v 14.5 to 15.5), then from 17.67 at v 15.75 down
    // 0.25 a metre to 16.92 at v 18.75, its edge over the gutter at v 19.25
    se: { u: [-14.0, 10.5], v: [9.4, 19.25], a: [9.5, 16.65, 0.415], b: [14.4, 15.6, 17.35], c: [15.75, 17.67, -0.25] },
    // its north-east end, u 10.5 to 18.25: about flat, 17.3-17.5 (16.75 at its south-east edge)
    seEast: { u: [10.5, 18.25], v: [9.4, 18.75], top: 17.35 },
    // the south-west wing, v -16 to 18.5: from 17.31 at u -26.0 up 0.314 a metre to 18.80 at u -21.25;
    // a raised strip 20.49 m at u -21.0 to -20.75 (v -15 to 15 only); from it down 0.454 a metre to
    // 17.54 at u -14.25
    sw: { out: { u: [-26.25, -21.0], v: [-16.0, 18.5], at: -26.0, y: 17.31, k: 0.314 },
      in: { u: [-21.0, -14.25], v: [-15.0, 15.0], at: -20.75, y: 20.49, k: -0.454 } },
    // the north-east wing, v -19 to 18.5: from 17.17 at u 18.5 up 0.28 a metre to 18.15 at u 22.0; a
    // valley at 17.3 (u 22.25 to 23.5); from 18.47 at u 23.75 down 0.43 a metre to 16.63 at u 28.0
    ne: { v: [-19.0, 18.5], a: { u: [18.25, 22.25], at: 18.5, y: 17.17, k: 0.28 }, valley: { u: [22.25, 23.5], y: 17.3 },
      b: { u: [23.5, 28.1], at: 23.75, y: 18.47, k: -0.43 } },
  },
  // The plant room at the east corner: 268 returns above 20 m in u 19.2 to 24.0, v 8.3 to 14.5, their
  // median 23.46 m (p90 24.99, the building's highest 25.11).
  plant: { u: [19.2, 24.0], v: [8.3, 14.5], top: 23.46 },
  // The round stair at the south-west end, where the Overbridge (129) lands: its flat roof's 368 returns
  // (16.53-17.44 m, median 16.60) reach u -35.58 and v 5.59 to 13.64: a circle of radius 4.0 about
  // (-31.6, 9.6), half outside the end wall. Beside it a flue: 19 returns 18-27 m high in u -30.8 to
  // -29.6, v 7.9 to 9.2, to 25.77 m.
  stair: { u: -31.6, v: 9.6, r: 4.0, top: 16.6 },
  flue: { u: [-30.8, -29.6], v: [7.9, 9.2], top: 25.7 },
};

// The face to the road (round 1), measured through S_C8's camera (config: streetview.camera_fixes),
// fixed from the photograph's own edges: the bands' upper edges against the windows read, on the face's
// plane at u 6.9, 15.10 (against the sky), 11.09, 7.22 and 2.37 m (the LiDAR's ledges 15.13, 11.12, 7.12
// and 2.38), and their lower edges 13.37, 9.41 and 5.62 (the LiDAR's lower ledges, the bands' lips:
// 13.38, 9.38 and 5.38-5.62); the ground storey's band from 1.46 (the door view) to 2.38.
export const FACADE = {
  // four concrete bands the full length of the face, flush with it (the LiDAR's ledges reach v 21.47-21.82
  // at their p50-p90 all along it), [bottom, top]
  bands: [[1.46, 2.38], [5.45, 7.12], [9.38, 11.12], [13.35, 15.13]],
  // the windows stand back from the bands' faces: the soffits under the bands run 1.33, 1.34 and 1.45 m
  // in to the windows' heads (the heads' pixels through the camera, at the bands' lower edges); the
  // gutter behind the top band starts there too (the LiDAR's returns at 14.26 m lie 1.33-2.94 m in)
  recess: 1.35,
  // the windows' rows, [sill, head], and their transoms, on the windows' plane: heads at the bands'
  // lower edges (13.37, 9.35, 5.43 through the camera); the sills hidden behind the bands' tops; the
  // ground storey's sill at 0.46 (door view); transoms at 12.38, 8.37 and 3.47 (the third storey's panes
  // dark below it)
  rows: [[0.46, 1.46], [2.38, 5.45], [7.12, 9.38], [11.12, 13.35]],
  transoms: [null, 3.47, 8.37, 12.38],
  // the red steel mullions: 20 between the two piers the camera sees square, at u 2.94 to 13.96 on the
  // windows' plane (the peaks of the frames' red along rows 2 and 3): every 0.58 m; the same spacing
  // beyond the second pier (15.90 to 21.94, 11 more); elsewhere the same spacing (estimated)
  mullion: { from: 2.94, step: 0.58, width: 0.07 },
  // piers from the ground to the top band, flush with the bands: the front faces' edges through the
  // camera at u 1.72-2.92 and 13.70-14.84, 12.0 m apart; at that spacing a pier's edges show behind the
  // tree at u -10.3, and oWaF's view has a pier left of the east corner (its place at the spacing:
  // estimated, that camera is not fixed). 1.15 m wide.
  piers: [-10.28, 1.72, 13.72, 25.72],
  pierWidth: 1.15,
  // the treatment wraps the east corner (oWaF's view: the bands run on round it, over glass) as far as
  // 110N's link (v 16.4 at u 29.5-29.9: README); the south-west end, in no photograph, closes the recess
  // with a plain end the width of a pier (estimated)
  wrapTo: 16.4,
  // the plinth under the ground storey's windows, at the face, to 0.35 (estimated: the hedge hides it)
  plinth: 0.35,
};
