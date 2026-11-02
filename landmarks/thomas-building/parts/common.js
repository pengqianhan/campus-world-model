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
  // The plant room at the east corner: 268 returns above 20 m, in the building's axes u 19.61 to 24.14 and
  // v 7.93 to 13.84 (p1-p99; min-max 19.36-24.18 and 7.86-14.07), their median 23.46 m (p90 24.99, its
  // highest 25.11; the building's highest is the flue's, 25.77). Round 0 took x 19.2-24.0, z 8.3-14.5 in
  // the view frame and drew them as u, v (fixed in round 2's review).
  plant: { u: [19.61, 24.14], v: [7.93, 13.84], top: 23.46 },
  // The round stair at the south-west end, where the Overbridge (129) lands: its flat roof's 368 returns
  // (16.53-17.44 m, median 16.60) reach u -35.58 and v 5.59 to 13.64: a circle of radius 4.0 about
  // (-31.6, 9.6), half outside the end wall. Beside it a flue: 19 returns 18-27 m high in u -30.8 to
  // -29.6, v 7.9 to 9.2, to 25.77 m.
  stair: { u: -31.6, v: 9.6, r: 4.0, top: 16.6 },
  // 110N's glazed link, as the site stands both landmarks (each on the map's ground at its own door: 31.058 m
  // at this one's, 28.866 at 110N's, 2.19 m apart where the two configs' LiDAR grounds, 36.17 and 34.6, are
  // 1.57 apart): in these axes its roof spans u 29.50-35.47, v -5.09 to 15.80, at y 14.75-14.86, below the
  // north-east parapet's top (15.13); at the LiDAR's heights it is 15.47, above it. The parapet is left out
  // where the link crosses it (body.js), so that the link's roof covers that stretch at either height.
  link: { v: [-5.1, 15.9] },
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
  // ground storey's sill at 0.46 (door view); transoms at 12.38, 8.37 and 3.47 (the panes below 3.47
  // dark: the second row's, as `dark` says)
  rows: [[0.46, 1.46], [2.38, 5.45], [7.12, 9.38], [11.12, 13.35]],
  transoms: [null, 3.47, 8.37, 12.38],
  // the second row (2.38 to 5.45) is the one with dark panes below its transom at 3.47 (the upper view: the
  // rows there are the ground storey's behind the bus shelter, this one, and the third row at the top),
  // and a second transom above it, read off the upper view between the row's sill, the transom at 3.47
  // and its head, at 4.45 (estimated to about 0.1 m); the other rows have one transom
  dark: { row: 1, top: 3.47 },
  transoms2: [null, 4.45, null, null],
  // the frames stand out from the glass (estimated: no photograph looks along the face)
  frameDepth: 0.12,
  // the frames' members, mullions, sills, heads and transoms, 0.07 m (estimated: the photographs show them
  // thin, a few pixels, at 16-23 m)
  frame: 0.07,
  // blinds and lab fittings behind most panes make them read light grey: in S_C8's upper view the panes
  // of the top row and of the third row's upper tiers read luma 123-138 at the median and 169-188 at the
  // p90, the dark panels 59, the bands 105; about two panes in three are light in the rows above the
  // ground storey, whose panes read dark behind the hedge, and fewer in the second row (drawn at 0.65 it
  // read 173 at the median against the photograph's 138). The share of light panes in each row (which
  // ones: a seeded draw, estimated)
  blinds: [0, 0.5, 0.65, 0.65],
  // the red steel mullions: 20 between the two piers the camera sees square, at u 2.94 to 13.96 on the
  // windows' plane (the peaks of the frames' red along rows 2 and 3): every 0.58 m; the same spacing
  // beyond the second pier (15.90 to 21.94, 11 more); elsewhere the same spacing (estimated)
  // `starts`: the first mullion of a bay where the camera reads it (the bay that begins at that pier's
  // right edge); in the other bays the first stands 0.07 right of the pier, as at u 2.94 (estimated)
  mullion: { from: 2.94, step: 0.58, width: 0.07, starts: { 1.72: 2.94, 13.72: 15.9 } },   // width: FACADE.frame
  // piers from the ground to the top band, flush with the bands: the front faces' edges through the
  // camera at u 1.72-2.92 and 13.70-14.84, 12.0 m apart, 1.15 m wide; at that spacing a pier's edges show
  // behind the tree at u -10.3. The pier left of the east corner (round 2), through oWaF's camera fitted
  // from its own photograph's edges (config, camera_fixes_note): its front face's edges at u 24.82-24.97
  // and 26.05-26.20 in the upper, wide and door views (rows at 3.6-12.5 m) and 24.83-26.33 at the ground
  // storey; the LiDAR's returns at the bands' face in the window rows there lie at u 25.0-26.0. Drawn at
  // u 24.9, 1.3 wide: 11.2 m from the pier before it, not at the 12.0 spacing (round 1 drew it at 25.72).
  piers: [-10.28, 1.72, 13.72, 24.9],
  pierWidth: 1.15,
  pierWidths: [1.15, 1.15, 1.15, 1.3],
  // the treatment wraps the east corner (oWaF's view: the bands run on round it, over glass, the windows
  // set back behind them). Round 2: in oWaF's wide view, through its fitted camera, the four bands end on
  // the north-east end's plane at v 18.98, 18.81, 18.64 and 18.56 (the bottom band to the top; that face
  // is seen at a slant of about 17 deg, so good to about 0.5 m): v 18.8. From there to 110N's link (v 16.4
  // at u 29.5-29.9: README) the end is plain wall, as the photograph shows it beside the link's glass. The
  // south-west end, in no photograph, closes the recess with a plain end the width of a pier (estimated)
  wrapTo: 18.8,
  // the ground storey toward the north-east end (round 2, and its review), as oWaF's door view shows it
  // from u 17.5 (its left edge) to the corner and S_C8's wide view from u 17 to 21, each through its fitted
  // camera on the face's plane. A concrete post at u 16.96-17.49 (S_C8) begins it. S_C8's camera reads the
  // ground there as the LiDAR has it: the plinth's foot at -0.65, the LiDAR's ground before it -0.61 (p50 of
  // 58 class-2 returns at u 17-23, v 21.8-24). oWaF's reads low near the ground: the white door's threshold
  // at -1.10 to -1.16 where the LiDAR's ground before it is -0.65 (14 returns, p10 -0.78, p90 -0.60), and
  // the ledge 2.38 at 2.01-2.35. So the heights are S_C8's: the band over it from 1.27 (1.26-1.28; oWaF's
  // 0.76-1.06 read 0.2-0.5 low), where further south-west it starts at 1.46 (S_C8's door view), its top the
  // LiDAR's ledge 2.38; the windows' sills at -0.27 (oWaF's -0.60 to -0.74), on a plinth down to the ground
  // (-0.61 before u 17-23, -0.71 before the louvre, -1.04 before the windows at u 27.3-30.9); the white door
  // down to the LiDAR's ground before it, -0.65. Its windows and doors stand only a little behind the
  // pier's face, not at the recess: in oWaF's upper view the pier's side shows 17 px there (the upper rows'
  // 1.35 m would show about 55), its edge at v 21.58, and the door shows whole beside the pier: `back` 0.3
  // (estimated, 0.2-0.4). On that plane (oWaF's door view): a white door from u 23.3 to the pier, a
  // white-framed louvre from the pier to 27.25, and a concrete post at 28.4-28.85 between two windows, 0.15
  // out from them (estimated); the post at 17.0-17.5 is flush with the face, as S_C8's wide view shows it
  // lit. Round the corner the same (estimated: the wide view shows the end's ground storey only behind a
  // grey door and a sign, on ground at -1.73, p50 of 61 returns at u 31-33.5)
  groundNE: { from: 17.0, band: 1.27, plinth: -0.27, back: 0.3, door: { u: [23.3, 24.9], foot: -0.65 },
    panels: [[23.3, 24.9], [26.2, 27.25]], posts: [[17.0, 17.5, 0.3], [28.4, 28.85, 0.15]] },
  // the plinth under the ground storey's windows, at the face, to 0.35 (estimated: the hedge hides it)
  plinth: 0.35,
};
