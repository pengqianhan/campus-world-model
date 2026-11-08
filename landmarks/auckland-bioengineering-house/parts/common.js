// Shared sizes, measured in the LINZ 2024 LiDAR (data/auckland-bioengineering-house_pts.npy: the building returns,
// class 6, in the crop box) in the view frame of config/auckland-bioengineering-house.json: x is -axis (west), y up
// from the frame's ground (57.96 m NZVD2016, the median ground in the crop box; to be the LiDAR's ground at the
// config's door at step 7), z is toStreet (north); the frame's centre at x = z = 0. Owned by the lead: read, do not
// edit. Measured 2026-11-08 (round 0).
//
// How: the returns' p10, p50 and p90 in 1 m cells, and the hull of the tower's roof (the returns above 34 m), in the
// building's own frame: u along the axis (east, -x), w along toStreet (north, z). The campus map's ring, moved onto
// the LiDAR (the placement's offset and turn), takes in the tower and the lower building round its north and east
// sides.

// The lowest the walls go: the ground within 3 m of the plans falls to -18.11 m east of the lower building, where the
// site drops toward the east (and lies 1 to 2 m above the frame's ground on Symonds Street to the north-west).
export const FOOT = -18.5;

export const MEASURED = {
  // The tower: its plan the hull of its roof's returns, a rectangle with its four corners cut (the west face 20.5 m,
  // the north 16.7, the east 18.7, the south 15.6; the cuts 4.3 to 6.0 m); its roof at 38.73 m (the returns' p50), its
  // top edge at 39.6 m (the outer returns' p90 39.47 to 39.6), a parapet estimated 0.3 m wide.
  tower: {
    plan: [[-18.91, -13.04], [-14.41, -17.0], [1.23, -16.45], [4.71, -12.88], [4.07, 8.01], [0.29, 11.46], [-16.35, 10.58], [-19.28, 7.48]],
    roof: 38.73,
    parapet: { top: 39.6, width: 0.3 },
  },
  // On its roof a plant room: u -11.3 to -2.3, w -7.8 to 5.8 (the returns above 41 m, p1 to p99), its top at 43.52 m.
  plant: { u: [-11.3, -2.3], w: [-7.8, 5.8], top: 43.52 },
  // The lower building round the tower's north and east sides, its flat roof at 8.54 m (the returns' p50 from u 7 to
  // 18), its plan the returns' edge and the ring's on the LiDAR (its north-west side from u -8.2 at the tower to -5 at
  // w 18.6), run 2 to 3 m into the tower; on it, along the tower's east face, a strip at 11.28 m (u 4.2 to 6.8, w -12.5
  // to 15.5), and before the tower's north face a part at 11.3 m (u -7.7 to -3.9, w 11.5 to 16.6; run 0.5 m into the
  // tower, its west side kept inside the lower building's).
  low: {
    plan: [[-8.2, 10.9], [-5.0, 18.6], [-5.0, 19.8], [9.5, 19.8], [17.6, 13.0], [18.8, -7.0], [12.6, -15.0], [2.0, -15.8], [2.0, 10.9]],
    roof: 8.54,
  },
  strip: { u: [4.2, 6.8], w: [-12.5, 15.5], top: 11.28 },
  porch: { plan: [[-7.7, 11.0], [-3.9, 11.0], [-3.9, 16.6], [-5.9, 16.6]], top: 11.3 },
  // The faces (round 1; the photograph as a reference for the look): the tower clad all round in glass; on its north
  // face two stone fins standing out of it and rising above its top. The first, nearer the north-east corner: its top
  // at 40.2 m and its front 0.35 m out of the face, from u -5.0 to -3.0 (its returns above 39.9 m near the north
  // edge, max 40.24, out to w 11.55 where the face stands at 11.2). The second is not in the LiDAR: from u -12.7 to
  // -11.0 (estimated: the photograph's edges through its fitted camera, on the face's plane), as high and as deep as
  // the first (estimated).
  fins: { along: [[-5.0, -3.0], [-12.7, -11.0]], top: 40.2, out: 0.35 },
};

/** The point [x, z] of the view frame at u and w in the building's frame. */
export function at(u, w) {
  return [-u, w];
}

/** The rectangle from u0 to u1 and w0 to w1, as a plan [[x, z] x 4]. */
export function rect([u0, u1], [w0, w1]) {
  return [at(u0, w0), at(u1, w0), at(u1, w1), at(u0, w1)];
}

/** A plan from [u, w] corners. */
export function plan(corners) {
  return corners.map(([u, w]) => at(u, w));
}

/** The [u, w] corners of a convex polygon moved `d` inward along every side (each corner where its two sides' moved
 * lines meet). */
export function inset(corners, d) {
  const n = corners.length;
  let area = 0;
  for (let i = 0; i < n; i++) { const [a, b] = corners[i], [c, e] = corners[(i + 1) % n]; area += a * e - c * b; }
  const s = area > 0 ? 1 : -1;
  const line = (i) => {
    const [a, b] = corners[i], [c, e] = corners[(i + 1) % n], L = Math.hypot(c - a, e - b);
    return [[a + (d * -s * (e - b)) / L, b + (d * s * (c - a)) / L], [(c - a) / L, (e - b) / L]];
  };
  const out = [];
  for (let i = 0; i < n; i++) {
    const [[p0, p1], [d0, d1]] = line((i + n - 1) % n), [[q0, q1], [e0, e1]] = line(i);
    const t = ((q0 - p0) * e1 - (q1 - p1) * e0) / (d0 * e1 - d1 * e0);
    out.push([p0 + t * d0, p1 + t * d1]);
  }
  return out;
}
