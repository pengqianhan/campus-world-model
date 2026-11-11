// Shared sizes, measured in the LINZ 2024 LiDAR (data/building-903_pts.npy: the returns in the crop box) in the view
// frame of config/building-903.json: x is -axis (east-south-east), y up from the config's ground, z is toStreet
// (south-south-west); the frame's centre at x = z = 0, the middle of the building's points.
// Owned by the lead: read, do not edit.
// Measured 2026-11-12 (round 0): every height below is the LiDAR's elevation, and Y turns it into one above the
// config's ground, 53.1 m (the median ground in the crop box; the door's ground replaces it at step 7).
//
// The sizes are given in the building's own frame: p along its long faces toward the west-north-west and q toward
// the south-south-west, the road. Its faces run 2.33 degrees off the frame's axis (the outermost roof returns of its
// four faces drift 2.27 to 2.43 degrees against the axis, and none against p and q), so `at` turns p, q by that and
// then into the view frame (x = -u, z = w); `plan` does so for a list. A side at the least p faces east-south-east
// (the east end), at the greatest p west-north-west, at the least q north-north-east and at the greatest q
// south-south-west (the south face).
//
// Building 903: a long block of four storeys, its two upper storeys clad in pale corrugated metal over two glazed
// storeys set back under them, under a low roof of two slopes whose ridge runs along it; its east end a low gable
// within a parapet. Its roof runs on to the west-north-west at the same height over the next building, and a lower
// block stands against its north face.
export const GROUND = 53.1;
const T = (2.33 * Math.PI) / 180;
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

// The ground along the walls lies from 52.2 m (the road south-east of the east end) to 52.8 m before the south
// face; the walls go down to FOOT.
export const FOOT = Y(52.0);

/** The block's plan at its roof's outer edges, from the LiDAR's outermost roof returns on each face: the east end at
 * p -38.27, the south face at q 15.84 from there to p -8.6, where it steps 2.68 m forward to q 18.52, the north face
 * at q -16.42 along the whole length. Its west-north-west end is the campus map's ring's (p 36.5): the roof runs on
 * there over the next building at the same height, with no seam in the returns. */
export const EAST = -38.27, STEP = -8.6, WEST = 36.5;
export const SOUTH = 15.84, FORWARD = 18.52, NORTH = -16.42;

/** The roof's two slopes, 0.066 a metre (3.8 degrees) down from its ridge along q 1.0 (70.3 m) to the north eave
 * (69.15 m; returns 69.11 to 69.25) and to the south parapet (69.32 m at q 15.84); a cap 2 m wide along the ridge to
 * 70.75 m (returns p50 70.73 to 70.77 at q 0 to 2). */
export const RIDGE = { q: 1.0, y: Y(70.3), fall: 0.066 };
export const roofAt = (q) => RIDGE.y - RIDGE.fall * Math.abs(q - RIDGE.q);
export const CAP = { q0: 0.0, q1: 2.0, top: Y(70.75) };

/** The parapet along the south face, its top at 70.05 m (p90 of the returns within 0.6 m of the face, 70.01 to
 * 70.07), 0.3 m thick; at the east end a gable within its parapet, its top 70.08 m at the south corner, 70.97 m over
 * the ridge and 69.85 m at the north corner (p90 of the returns on it, in 1 m strips of q). */
export const PARAPET = { top: Y(70.05), thick: 0.3 };
export const GABLE = { south: Y(70.08), ridge: Y(70.97), north: Y(69.85) };
