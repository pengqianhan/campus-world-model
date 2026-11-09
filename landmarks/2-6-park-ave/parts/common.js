// Shared sizes, measured in the LINZ 2024 LiDAR (data/2-6-park-ave_pts.npy: the returns in the crop box) in the view
// frame of config/2-6-park-ave.json: x is -axis (north-north-east, along the block's long east face), y up from the
// LiDAR's ground at the config's door, z is toStreet (east-south-east, toward Park Avenue); the frame's centre at
// x = z = 0. Owned by the lead: read, do not edit.
// Measured 2026-11-10 (round 0), before the door was set: every height below is measured above 68.86 m, the median
// ground in the first crop box, and H moves it on to the door's ground, 68.87 m (on the footpath of Park Avenue
// before the east face's south end).
//
// The sizes are given in the building's own frame, u along the east face toward its south end (south-south-west, the
// frame's axis, so x = -u) and w toward Park Avenue (z = w); `at`, `plan` and `rect` turn them into the view frame.
//
// The block stands about 2 degrees off the frame's axis: its corners, the LiDAR's roof edges, are NW (-21.9, -12.6),
// NE (-22.8, 14.5), SE (20.6, 16.2) and SW (21.4, -11.2). Its roof is nearly flat, 12.45 m at the eave and 12.6 to
// 13.1 inside; on it plant at 14.6 m and a raised part with a flat red roof at 17.3 m and plant on it. Round it, inside
// the campus map's ring, a one-storey annex on its west and a low part south-west of it, both drawn; the ring's other
// low strips along its walls, up to about 1.5 m wide (canopies at 3.5 to 6.4 m, and the eave's edge), are not drawn.
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
// 12.6 to 13.1, drawn as a flat top of 13.0 m whose corners stand 2.5 * sqrt(2) m in from the eave's along their
// diagonals (so its edges are 1.9 m in from the eave's on the east and west, 3.0 m on the north and south). Plant at 14.6 m (14.4 to 14.8) over u -14 to
// -5, w -5 to 6; a raised part, its roof flat at 17.3 m (17.1 to 17.5; red on the 2023 aerial) over u 4 to 16, w -3 to
// 7, and plant on it at 18.3 m (17.9 to 18.3) over u 8 to 11, w 2 to 5.
export const EAVE = H(12.45), ROOF_IN = { top: H(13.0), inset: 2.5 };
export const PLANT = { u: [-14.0, -5.0], w: [-5.0, 6.0], top: H(14.6) };
export const RAISED = { u: [4.0, 16.0], w: [-3.0, 7.0], top: H(17.3), plant: { u: [8.0, 11.0], w: [2.0, 5.0], top: H(18.3) } };

// The balconies: on every side, under the eave from the walls to the eave's edge, the LiDAR has three slabs, their tops
// at 3.60, 6.55 and 9.50 m (p50 on each side within 0.02 m of these; the storeys 2.95 m apart), and 0.9 m over each a
// band near the edge (4.50, 7.46 and 10.41 m): the rails' tops. The slabs' fronts 0.5 m deep and the rails' two bars on
// posts are taken from the photograph of the east face (estimated), on every side.
export const BALCONY = { slabs: [3.6, 6.55, 9.5].map((t) => [H(t - 0.5), H(t)]), rail: [0.45, 0.9], bar: 0.06,
  posts: 3.0 };
// The east face, on Park Avenue, through the photograph's fitted camera (estimated): the wall stands 1.6 m behind the
// eave's edge (the LiDAR sees the ground up to w 14.0 under it); behind the balconies the glazing of each upper storey;
// the ground storey in pale brick, its windows under the first slab; the eave's dark fascia from 12.0 m.
export const EAST = { back: 1.6, slabs: BALCONY.slabs, fascia: H(12.0), windows: { y: [H(0.9), H(2.9)] } };

// The walls stand behind the eave's edge and its balconies (estimated depths): 1.8 m on the north, 1.6 m on the east
// and 1.8 m on the south, behind the ground the LiDAR sees under the eave (its returns to 1.66, 1.48 and 1.46 m in), and
// 1.8 m on the west, where the ground is hidden: on every side the balconies' slabs reach 1.2 to 1.4 m in from the
// eave's edge. Their corners; inside them the LiDAR has the roof and no ground.
export const WALLS = [[-20.16, -10.74], [-20.95, 12.97], [18.85, 14.53], [19.55, -9.46]];
// The east face's balconies, glazing, brick and ground storey windows run between the north and south walls: t along
// NE to SE where the walls' lines meet the east wall.
export const EAST_T = [0.0412, 0.9582];

// A low annex west of the block, one storey, its roof at 3.5 m (3.48 to 3.53) from u -11 to -5.9 (the ring's edge)
// and out to w -17.3 (the ring's edge; the LiDAR's roof to about -17.4), with no ground under it; its outer wall at
// w -16.85, where the LiDAR sees a wall's face (its returns at -16.85 to -17.15) and the ground beyond, and its
// north end at u -10.7, behind a ground return (estimated); its roof over them from 3.2 m. It runs into the block's
// west wall.
export const ANNEX = { walls: { u: [-10.7, -5.9], w: [-16.85, -10.0] }, roof: { u: [-11.0, -5.9], w: [-17.3, -10.0] },
  soffit: H(3.2), top: H(3.5) };
// A low part south-west of the block, inside the ring (u 9.1 to 23.0, w -23.6 to -30.4), joined to it on the campus
// map by a sliver: its flat roof at 3.44 m (3.40 to 3.49) from u 9.2 to 22.8 and w -23.7 to -27.6, where trees hide
// the rest of it; drawn to the ring (estimated). The LiDAR sees the ground under its roof's edges, up to 1.0 m in on
// the north (u 10.15) and 0.75 m on the east (w -24.4): its walls stand behind them (estimated), its roof over
// them from 3.2 m.
export const SOUTHWEST = { walls: { u: [10.3, 22.8], w: [-29.9, -24.5] }, roof: { u: [9.2, 22.8], w: [-29.9, -23.7] },
  soffit: H(3.2), top: H(3.44) };
