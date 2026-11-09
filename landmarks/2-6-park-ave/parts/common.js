// Shared sizes, measured in the LINZ 2024 LiDAR (data/2-6-park-ave_pts.npy: the returns in the crop box) in the view
// frame of config/2-6-park-ave.json: x is -axis (north-north-east, along the block's long east face), y up from the
// LiDAR's ground at the config's door, z is toStreet (east-south-east, toward Park Avenue); the frame's centre at
// x = z = 0. Owned by the lead: read, do not edit.
// Measured 2026-11-10 (round 0), before the door was set: every height below is measured above 68.86 m, the median
// ground in the first crop box, and H moves it on to the door's ground, 68.87 m (on the footpath of Park Avenue
// before the opening at the block's south-east corner).
//
// The sizes are given in the building's own frame, u along the east face toward its south end (south-south-west, the
// frame's axis, so x = -u) and w toward Park Avenue (z = w); `at`, `plan` and `rect` turn them into the view frame.
//
// The block stands about 2 degrees off the frame's axis: its corners, the LiDAR's roof edges, are NW (-21.9, -12.6),
// NE (-22.8, 14.5), SE (20.6, 16.2) and SW (21.4, -11.2). Its roof is nearly flat, 12.45 m at the eave and 12.6 to
// 13.1 inside; on it plant at 14.6 m and a raised part with a flat red roof at 17.3 m and plant on it; round its west,
// south and north sides low parts of one storey.
export const at = (u, w) => [-u, w];
/** A height measured above 68.86 m (the provisional ground), as one above the door's ground, 0.01 m higher. */
export const H = (h) => h - 0.01;
export const plan = (corners) => corners.map(([u, w]) => at(u, w));
export const rect = ([u0, u1], [w0, w1]) => plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]);

// The ground: -0.4 to +0.1 along Park Avenue, falling to about -0.8 on the west. The walls go down to FOOT.
export const FOOT = H(-2.0);

export const NW = [-21.9, -12.6], NE = [-22.8, 14.5], SE = [20.6, 16.2], SW = [21.4, -11.2];
/** The point a fraction t of the way from p to q. */
export const lerp = (p, q, t) => [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])];
/** A point moved d metres toward the inside of the east face (along the face's normal, -w). */
const N_E = (() => { const dx = SE[0] - NE[0], dw = SE[1] - NE[1], l = Math.hypot(dx, dw); return [dw / l, -dx / l]; })();
export const inEast = (p, d) => [p[0] + N_E[0] * d, p[1] + N_E[1] * d];

// The roof: the eave at 12.45 m (12.4 to 12.5 on every edge), drawn as the block's top; inside it the roof rises to
// 12.6 to 13.1, drawn as a flat top of 13.0 m 2.5 m in from the eave. Plant at 14.6 m (14.4 to 14.8) over u -14 to
// -5, w -5 to 6; a raised part, its roof flat at 17.3 m (17.1 to 17.5; red on the 2023 aerial) over u 4 to 16, w -3 to
// 7, and plant on it at 18.3 m (17.9 to 18.3) over u 8 to 11, w 2 to 5.
export const EAVE = H(12.45), ROOF_IN = { top: H(13.0), inset: 2.5 };
export const PLANT = { u: [-14.0, -5.0], w: [-5.0, 6.0], top: H(14.6) };
export const RAISED = { u: [4.0, 16.0], w: [-3.0, 7.0], top: H(17.3), plant: { u: [8.0, 11.0], w: [2.0, 5.0], top: H(18.3) } };

// The east face, on Park Avenue, through the photograph's fitted camera (estimated): the wall stands 1.6 m behind the
// eave's edge (the LiDAR sees the ground up to w 14.0 under it); before it, at each upper storey, a balcony on its
// slab to the eave's line, with a rail of two bars; the storeys 3.1 m apart, the slabs from 3.4 to 3.9 m, 6.5 to 7.0
// and 9.6 to 10.1 (the camera puts the lowest slab's underside at 3.4 m and the next at 6.5); the ground storey in pale
// brick, its windows under the first slab; the eave's dark fascia from 12.0 m.
export const EAST = { back: 1.6, slabs: [[3.4, 3.9], [6.5, 7.0], [9.6, 10.1]].map(([a, b]) => [H(a), H(b)]),
  rail: [0.5, 1.05], bar: 0.06, fascia: H(12.0), windows: { y: [H(0.9), H(2.9)] } };

// The walls stand behind the eave's edge where the LiDAR sees the ground under it: 1.8 m on the north (its returns to
// 1.66 m in), 1.6 m on the east (1.48 m), 1.8 m on the south and 0.3 m on the west (none): their corners. Under the
// upper storeys at the south-east corner the ground storey is open (the LiDAR sees the ground up to 5.5 m in from the
// south end, w 8.3 to 14.8): its walls stop at u 15.5 and w 8.3 (estimated).
export const WALLS = [[-20.11, -12.24], [-20.95, 12.97], [18.85, 14.53], [19.59, -10.96]];
export const GROUND = { plan: [[-20.11, -12.24], [-20.95, 12.97], [15.5, 14.4], [15.5, 8.3], [19.03, 8.3], [19.59, -10.96]] };
// The east face's balconies and glazing run between the north and south walls (t along NE to SE); its brick and
// ground storey windows to the opening (t 0.8825, u 15.5).
export const EAST_T = [0.043, 0.96], GROUND_T = 0.8825;

// A low annex west of the block, one storey, u -11 to -7, to w -16.4, 3.5 m (3.1 to 3.5), roofed where the LiDAR
// has no ground under it. The rest round the block is open ground or a canopy narrower than a metre: not drawn.
export const ANNEX = { u: [-11.0, -7.0], w: [-16.4, -11.7], top: H(3.5) };
