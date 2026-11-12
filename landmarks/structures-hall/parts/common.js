// Shared sizes, measured in the LINZ 2024 LiDAR (data/structures-hall_pts.npy: the returns in the crop box) in the
// view frame of config/structures-hall.json: x is -axis (east-south-east), y up from the config's ground, z is
// toStreet (south-south-west); the frame's centre at x = z = 0, the middle of the building's points.
// Owned by the lead: read, do not edit.
// Measured 2026-11-12 (round 0): every height below is the LiDAR's elevation, and Y turns it into one above the
// config's ground, 52.58 m (the LiDAR's ground at the door, before the entrance near the south face's east end).
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
export const GROUND = 52.58;
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

/** The southern block, to its roof's outer edges (the outermost roof returns on each face): p -22.4 to 32.05, from the
 * line between the blocks (q 2.7) to the south face's fascia (q 16.0); west of the northern block (p 23.05 on) from its
 * own north wall at q 2.1 (qWest: its returns from 53 to 70 m, p50 2.09). Its roof, one slope of 0.1036 a metre (5.9
 * degrees; a plane through 4,967 returns, rms 0.023 m), rises from 70.52 m at the south edge to 71.90 m at the line;
 * the fascia's top, 70.6 m (p90 of the returns along the edge), is the photograph's roof edge (FASCIA). */
export const SOUTH = { p0: -22.4, p1: 32.05, q0: 2.7, q1: 16.0, qWest: 2.1 };
export const southRoof = (q) => Y(72.182 - 0.1036 * q);

/** The northern block: p -23.95 to 23.05, from its north face's eave (q -16.13) to the line between the blocks. Its
 * roof, one slope of 0.1321 a metre (7.5 degrees; 6,294 returns, rms 0.059 m), rises from 71.61 m at the north eave
 * to 74.10 m at the line, 2.2 m over the southern block's roof there: a face 2.2 m high looks south over it. */
export const NORTH = { p0: -23.95, p1: 23.05, q0: -16.13, q1: 2.7 };
export const northRoof = (q) => Y(73.739 + 0.1321 * q);

/** The lower block against the northern one's east end: p -30.95 to -23.95, q -15.8 to 2.55, its flat roof at
 * 68.05 m (the p50 of its 1,036 returns at 67 to 69 m, 68.03; p90 68.15). */
export const LOW = { p0: -30.95, p1: -23.95, q0: -15.8, q1: 2.55, top: Y(68.05) };

/** The three stacks on the line between the blocks, 15 m apart (the LiDAR's returns over 76.8 m): each about 2.5 m
 * square, from q 1.95 to 4.6, its top falling from 77.4 m at its south edge to 76.6 m at its north (a plane through
 * about 63 returns on each, rms 0.05 m). Through the photograph's camera, on their south faces: a light band from the
 * top down to 76.43 m, dark louvres from there to 74.34 m, a light base under them. */
export const STACKS = [[17.73, 20.26], [2.73, 5.23], [-12.28, -9.75]];
export const STACK = { q0: 1.95, q1: 4.6, south: Y(77.4), north: Y(76.6), band: Y(76.43), louvre: Y(74.34) };

/** The face the northern block turns south over the southern block's roof, from 71.9 to 74.1 m, is drawn plain, as
 * the block's walls: the LiDAR has no return on it between 72.1 and 73.6 m along its whole length (36 on its edges),
 * but the north face under its eave has as few (3 between 69 and 71 m), so that says nothing of what it is, and no
 * photograph shows it. */

/** The south face, which the photograph sees (estimated through its fitted camera, on the planes the LiDAR gives).
 * Three glazed storeys stand from the box's underside at 56.62 m to the fascia, their glass at q 15.4 (the LiDAR's
 * returns on the face, 60.5 to 66.5 m, at q 15.25 to 15.5); the fascia along the roof edge, 70.2 to 70.6 m, stands
 * out to q 16.0 (the roof's returns reach it). Light bands at the box's foot, 56.62 to 57.65 m, and between the storeys
 * (60.46 to 62.37 m and 65.2 to 67.05 m), each with a joint at its middle. A dark frame 0.55 m wide at each end, from
 * just under the box to 70.8 m (the LiDAR's highest returns at the west end, 70.83 m). Between the frames 36 equal
 * bays (1.482 m) of glass, a mullion between each two and a heavier one every second bay: the photograph's mullions
 * through the camera fall 1.47 to 1.52 m apart, and 36 bays lie between the frames. */
export const FACE = 15.4, FASCIA = { q: 16.0, y0: Y(70.2), top: Y(70.6) };
export const BOX = Y(56.62);
export const BANDS = [[BOX, Y(57.65)], [Y(60.46), Y(62.37)], [Y(65.2), Y(67.05)]];
export const FRAME = { w: 0.55, top: Y(70.8) };
export const BAYS = { west: SOUTH.p1 - FRAME.w, east: SOUTH.p0 + FRAME.w, n: 36 };
/** The p of the line k bays from the west frame. */
export const bay = (k) => BAYS.west - (k * (BAYS.west - BAYS.east)) / BAYS.n;

/** The ground storey under the box, through the camera: its wall set back to q 14.3 (the LiDAR's returns at 52.5 to 55.5
 * m, q 14.25 to 14.75), from the east end (flush with the box over it) to the west end; a band of dark windows, 53.9 to
 * 55.3 m, from p 27.0 to the entrance; a dark door at the west end (p 29.64 to 31.05, to 56.3 m) and a dark glazed
 * entrance (p -17.35 to -13.3, to 56.4 m) under a thin canopy (55.65 to 55.8 m); piers 0.4 m wide under the box's face
 * on every fourth bay's line from the second (the photograph's nine piers fall within 0.3 m of them), and a V of two
 * braces from the piers' tops to the ground at the middle of the bays from line 10 to 14 and from 22 to 26. */
export const WALL_Q = 14.3, GS_EAST = SOUTH.p0;
export const WINDOWS_GS = { p0: -12.9, p1: 27.0, y0: Y(53.9), y1: Y(55.3) };
export const DOOR = { p0: 29.64, p1: 31.05, top: Y(56.3) };
export const ENTRANCE = { p0: -17.35, p1: -13.3, top: Y(56.4), canopy: [Y(55.65), Y(55.8)], out: 15.3 };
export const PIERS = { from: 2, every: 4, w: 0.4, q0: 14.8, q1: 15.2 };
export const BRACES = [[10, 14], [22, 26]];
