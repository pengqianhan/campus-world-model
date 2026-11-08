// Shared sizes, measured in the LINZ 2024 LiDAR (data/okareta_pts.npy: the building returns, class 6, in the crop
// box) in the view frame of config/okareta.json: x is -axis (south-west, along the front), y up from the frame's
// ground (36.16 m NZVD2016, the median ground in the crop box), z is toStreet (north-west, toward Symonds Street);
// the frame's centre at x = z = 0. Owned by the lead: read, do not edit. Measured 2026-11-09 (round 0).
//
// The sizes are given in the building's own frame, u along the front (north-east, the frame's axis, so x = -u) and
// w toward the street (z = w); `at`, `plan` and `rect` turn them into the view frame.
//
// How: the highest return in each 0.5 m cell below 12.5 m (the street trees stand over the front up to 25 m, and
// some of their returns are classed as building) for the roofs, and, in 1 m strips, the outermost returns 1.5 to
// 7.5 m up for the walls. The house is a T: a wing on its south-west side running from back to front under a hipped
// roof, its ridge across the front (along w) at u -3.5, 10.7 m, with a bay at its front; and the north-east part
// under a hipped roof whose ridge runs along the front at w -1.75, 10.7 m, from the wing's roof to its north-east
// hip; the eaves of both at 8.7 m (8.6 to 8.9); a low roof behind the north-east part's south-west end, falling from
// 9.2 to 8.65 m.
export const at = (u, w) => [-u, w];
export const plan = (corners) => corners.map(([u, w]) => at(u, w));
export const rect = ([u0, u1], [w0, w1]) => plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]);

// The ground (the LiDAR's ground returns) round the house: about +0.2 to +0.8 on the street side (36.4 to 37.0 m),
// -3.0 behind it (33.1 m) and down to -3.6 in the passage along its south-west side. The walls go down to FOOT.
export const FOOT = -3.9;

export const HOUSE = {
  // The walls: the south-west side at u -5.85 (the innermost returns 1.5 to 7.5 m up, p2), the north-east end at
  // u 6.7 (p98); the back of the wing and of the low roof's part at w -7.0 (building returns down to the ground's
  // there), of the north-east part at w -5.0, 0.5 m in from its eave; the front of the north-east part at w 1.65,
  // 0.6 m in from its eave (the overhang at the house's ends, 0.55 and 0.9 m: estimated); the wing's north-east side
  // at u -0.75, 0.5 m in from its eave; the bay at the wing's front, its face at w 5.15 (0.6 m in from the eave over
  // it) between u -1.15 and -5.45 (where the photograph's windows and the bay's corners fall on that plane, through
  // its fitted camera: estimated), its corners canted at 45 degrees back to the wing's sides.
  walls: [[6.7, -5.0], [6.7, 1.65], [-0.75, 1.65], [-0.75, 4.75], [-1.15, 5.15], [-5.45, 5.15], [-5.85, 4.75], [-5.85, -7.0],
    [2.0, -7.0], [2.0, -5.0]],
  top: 9.0,             // the walls' tops, under the roofs' slopes 0.6 m in from the eaves
  // The eaves' line, round the roofs: the wing's from back to front, u -6.75 to -0.25 (its ridge, at u -3.5, in the
  // middle), w -7.5 to 5.75; the north-east part's, w -5.5 to 2.25, to u 7.25; the low roof's back, w -7.5, to
  // u 2.0. The cornice fills it from `cornice` up to the eaves, under the roofs.
  eaves: [[7.25, -5.5], [7.25, 2.25], [-0.25, 2.25], [-0.25, 5.75], [-6.75, 5.75], [-6.75, -7.5], [2.0, -7.5], [2.0, -5.5]],
  eave: 8.7,
  cornice: 8.25,        // estimated: the cornice's depth, 0.45 m
};

export const ROOFS = {
  // The wing's: its ridge along w at u -3.5, from 3.0 m in from its back eave to 3.25 m in from its front one (the
  // returns over 10.5 m: w -4.5 to 2.5).
  wing: { u: [-6.75, -0.25], w: [-7.5, 5.75], ridge: 10.7, at: -3.5, hips: [3.0, 3.25] },
  // The north-east part's: its ridge along u at w -1.75, from the wing's ridge to 3.75 m in from its north-east eave
  // (the returns over 10.5 m: u -3.5 to 3.5); its south-west end, inside the wing's roof, is left square.
  main: { u: [-3.5, 7.25], w: [-5.5, 2.25], ridge: 10.7, at: -1.75, hips: [3.75, 0] },
  // The low roof behind the north-east part's south-west end, from 9.2 m where it meets that part's slope (w -4.5)
  // to 8.65 at its eave, w -7.5.
  rear: { u: [-0.25, 2.0], w: [-7.5, -4.5], high: 9.2, low: 8.65 },
  // The porch behind the north-east part: a flat roof at 3.2 m (3.1 to 3.3), w -5.75 to -6.75, u 2.25 to 6.75, about
  // 6 m over the ground behind; its posts and its floor estimated.
  porch: { u: [2.25, 6.75], w: [-6.75, -5.0], top: 3.2 },
};

export const VERANDAH = {
  // Before the north-east part's front, the whole of it: its outer edge at w 4.3 (the outermost returns 1.5 to 7.5 m
  // up, u 0 to 6: w 4.0 to 4.7). Estimated from the photograph through its fitted camera, on the plane of that edge:
  // its eave at 4.5 m, its floor at 1.0 (the posts' feet), its posts at u 6.25, 3.6 and 1.1 (the two middle ones in
  // pairs) and -0.6; the roof's fall to the wall and the frieze's depth.
  u: [-0.75, 6.7], w: [1.65, 4.3], eave: 4.5, top: 5.1, floor: 1.0, frieze: 0.35, posts: [6.25, 3.75, 3.45, 1.25, 0.95, -0.6],
};

// The windows, estimated from the photograph: their edges carried through its fitted camera onto the walls' planes
// (the north-east part's front, w 1.65; the bay's face, w 5.15): [u0, u1, sill, head], their heads arched.
export const WINDOWS = {
  front: [[5.2, 4.25, 5.9, 8.05], [2.8, 1.85, 5.9, 8.05], [0.55, -0.4, 5.9, 8.05],      // over the verandah
    [5.25, 4.2, 1.45, 3.85], [2.95, 1.9, 1.45, 3.85]],                                  // under it
  door: [0.35, -0.6, 1.05, 3.85],
  bay: [[-1.8, -2.65, 5.9, 8.1], [-3.3, -4.15, 5.9, 8.1], [-1.95, -2.85, 1.5, 4.3], [-3.4, -4.35, 1.5, 4.3]],
  // the cornice on brackets round the bay between its storeys, 4.95 to 5.75 m, standing 0.25 m out
  bayCornice: [4.95, 5.75, 0.25],
};
