// Shared sizes, measured in the LINZ 2024 LiDAR (data/structures-hall_pts.npy: the returns in the crop box) in the
// view frame of config/structures-hall.json: x is -axis (east-south-east), y up from the config's ground, z is
// toStreet (south-south-west); the frame's centre at x = z = 0, the middle of the building's points.
// Owned by the lead: read, do not edit.
// Measured 2026-11-12 (round 0): every height below is the LiDAR's elevation, and Y turns it into one above the
// config's ground, 52.4 m (the provisional ground: the LiDAR's ground at the outline's lowest point).
//
// The sizes are given in the building's own frame: p along its long faces toward the west-north-west and q toward
// the south-south-west, the face the photograph sees. Its faces run 2.28 degrees off the frame's axis (along p and q
// its four faces' outermost roof returns keep within 0.1 m of a line), so `at` turns p, q by that and then into the
// view frame (x = -u, z = w); `plan` does so for a list. A side at the least p faces east-south-east (the east end),
// at the greatest p west-north-west, at the least q north-north-east and at the greatest q south-south-west (the
// south face).
//
// Structures Hall (906): two long blocks side by side, each under a roof of one slope that rises to the line between
// them, the northern one's 2.2 m higher there; three square stacks stand on that line; a lower block of the same
// depth as the northern one stands against its east end.
export const GROUND = 52.4;
const T = (2.28 * Math.PI) / 180;
export const at = (p, q) => {
  const u = p * Math.cos(T) - q * Math.sin(T), w = p * Math.sin(T) + q * Math.cos(T);
  return [-u, w];
};
/** An elevation measured in the LiDAR, as a height above the config's ground. */
export const Y = (z) => z - GROUND;
export const plan = (corners) => corners.map(([p, q]) => at(p, q));
/** The view frame's point for p, q at the height y. */
export const pt = (p, q, y) => { const [x, z] = at(p, q); return [x, y, z]; };
/** The directions of p and q in the view frame, [x, y, z]. */
export const DIR = { p: [-Math.cos(T), 0, Math.sin(T)], q: [Math.sin(T), 0, Math.cos(T)] };

// The ground along the walls (the returns 0.5 to 3 m out) lies from 52.06 m (by the east end) to 53.06 m, p50
// 52.49 m; the walls go down to FOOT.
export const FOOT = Y(52.0);

/** The southern block, to its roof's outer edges (the outermost roof returns on each face): p -22.4 to 32.05, from
 * the line between the blocks (q 2.7) to the south face's fascia (q 16.0). Its roof, one slope of 0.1036 a metre
 * (5.9 degrees; a plane through 4,967 returns, rms 0.023 m), rises from 70.52 m at the south edge to 71.90 m at the
 * line; the fascia's top, 70.6 m (p90 of the returns along the edge), is the photograph's roof edge. */
export const SOUTH = { p0: -22.4, p1: 32.05, q0: 2.7, q1: 16.0 };
export const southRoof = (q) => Y(72.182 - 0.1036 * q);
export const FASCIA = Y(70.6);

/** The northern block: p -23.95 to 23.05, from its north face's eave (q -16.13) to the line between the blocks. Its
 * roof, one slope of 0.1321 a metre (7.5 degrees; 6,294 returns, rms 0.059 m), rises from 71.61 m at the north eave
 * to 74.10 m at the line, 2.2 m over the southern block's roof there: a face 2.2 m high looks south over it. */
export const NORTH = { p0: -23.95, p1: 23.05, q0: -16.13, q1: 2.7 };
export const northRoof = (q) => Y(73.739 + 0.1321 * q);

/** The lower block against the northern one's east end: p -30.95 to -23.95, q -15.8 to 2.55, its flat roof at
 * 68.31 m (1,073 returns, rms 0.31 m). */
export const LOW = { p0: -30.95, p1: -23.95, q0: -15.8, q1: 2.55, top: Y(68.31) };

/** The three stacks on the line between the blocks, 15 m apart (the LiDAR's returns over 76.8 m): each about 2.5 m
 * square, from q 1.95 to 4.6, its top falling from 77.4 m at its south edge to 76.6 m at its north (a plane through
 * about 63 returns on each, rms 0.05 m). */
export const STACKS = [[17.73, 20.26], [2.73, 5.23], [-12.28, -9.75]];
export const STACK = { q0: 1.95, q1: 4.6, south: Y(77.4), north: Y(76.6) };
