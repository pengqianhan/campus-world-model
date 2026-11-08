// Shared sizes, measured in the LINZ 2024 LiDAR (data/architecture-west_pts.npy: the building returns, class 6, in
// the crop box) in the view frame of config/architecture-west.json: x is -axis, y up from the frame's ground (the
// LiDAR's ground at the config's door, 43.5 m NZVD2016; the heights below were measured above 36.83 m, the median
// ground in the crop box, and H moves them on to it), z is toStreet; the frame's centre at x = z = 0. Owned by the
// lead: read, do not edit.
// Measured 2026-11-08 (round 0).
//
// How: the returns' p10, p50 and p90 in 0.5 and 1 m cells, in the building's own frame: u along the axis (to the
// north-west, -x), w along toStreet (to the south-west, z). The slab runs north-west from 421E's main block, whose
// walls run 45 degrees from it; where the two meet, 421E's ridge turns into this one's. Its south-east end here is
// where #140's model of 421E ends (that model's main block, u 37.5 and w 4.5 in its frame E): the two do not overlap
// below the roofs.

// The lowest the walls go: the ground within 3 m of the plans falls to -1.98 m on the slab's south-west side (and
// rises to +6.6 m on the paved upper level to its north and north-west).
/** A height measured above 36.83 m, as one above the door's ground, 6.67 m higher (the config's `ground`). */
const H = (h) => h - 6.67;

export const FOOT = H(-2.3);

/** A plane over the building's frame, as its height at u and w: through `h` at [u, w], rising `du` a metre along u
 * and `dw` a metre along w. */
const plane = (h, [u, w], du, dw) => ({ a: H(h) - du * u - dw * w, b: du, c: dw });

export const MEASURED = {
  // The slab's plan (u, w): its north-east face at w -9.6 from u 14 to -2.5 (the returns' edge, w -9.7 to -9.2), set
  // back to w -7.0 south-east of u -2.5 (-6.9 to -7.4); then along 421E's model, its north face to its north corner
  // (u -8.7, w -0.55) and its north-west end out to the slab's south-west face at w 10.8 (10.0 to 10.9), which
  // steps in to w 7.9 north-west of u -1.5 (7.8 to 8.2); its north-west face at u 14 (13.6 to 14.0). Its walls rise
  // to 20.17 m, the eave's height (its returns' p90 20.10, max 20.24), the roof's planes above it.
  slab: {
    plan: [[14, -9.6], [-2.5, -9.6], [-2.5, -7.0], [-14.5, -7.0], [-8.7, -0.55], [-21.35, 10.8], [-1.5, 10.8], [-1.5, 7.9], [14, 7.9]],
    top: H(20.17),
  },
  // The roof: planes fitted to the returns' p50 in 1 m strips, the roof the lowest of them. Both halves share the
  // north-east slope, 0.807 a metre up from the eave (20.35 m at w -9.6; 23.66 m at w -5.5 against 23.83 and 23.37).
  // The halves meet at the tower's south-east face, u -0.6.
  //   South-east of it, a ridge near w -3 (its returns' p90 25.4, p50 25.0-25.1 from w -4 to -2) and a south-west
  //   slope, 0.84 a metre (23.46 m at w -0.5; 25.14 to 21.78 from w -2.5 to 1.5), down to a flat roof at 20.52 m
  //   (the returns' p50 from w 4 to 8) from w 2.3 on.
  //   North-west of it the roof is wider: a top at 24.7 m (24.2-25.1) from w -4.2 to 1.7, mostly under the tower;
  //   the south-west slope, 0.81 a metre (22.39 m at w 4.5; 24.00 to 20.04 from w 2.5 to 7.5), to the slab's top at
  //   w 7.2; and a hip, 0.66 a metre (21.80 m at u 10.5; 23.83 to 20.51 from u 7.5 to 12.5), to the slab's top at
  //   u 13.
  roof: {
    split: -0.6,
    ne: plane(20.35, [0, -9.6], 0, 0.807),
    se: [plane(23.46, [0, -0.5], 0, -0.84), plane(25.4, [0, 0], 0, 0)],
    nw: [plane(22.39, [0, 4.5], 0, -0.81), plane(21.80, [10.5, 0], -0.66, 0), plane(24.7, [0, 0], 0, 0)],
    flat: { from: 2.3, top: H(20.52) },
  },
  // The tower (u, w): u -0.6 to 5.25, w -2.9 to 1.0 (its returns' p1 to p99); its top a plane falling along u from
  // 31.57 m at u -0.6 to 27.97 m at u 5.25 (the cells' highest returns, 0.62 m a metre).
  tower: { u: [-0.6, 5.25], w: [-2.9, 1.0], high: H(31.57), low: H(27.97) },
  // North-west of the slab, lower: u 14 to 18.8, w -9.4 to 7.9 at 17.43 m (the returns' p50), and beyond it u 18.8 to
  // 21.9, w -9.0 to 0 at 15.9 m (p50 15.92; the ring takes in its first 3.5 m).
  low: { u: [14, 18.8], w: [-9.4, 7.9], top: H(17.43) },
  lower: { u: [18.8, 21.9], w: [-9.0, 0], top: H(15.9) },
  // The faces (round 1; the photograph as a reference for the look, no size measured from it), all estimated: floors
  // every 3.55 m, as 421E's, from the door's ground (43.5 m), the storey of the slab's north-east doors; on each
  // floor of the north-east faces above it a pale louvred parapet before a band of windows; the doors' storey glazed.
  floors: { first: 0, every: 3.55, doors: 0 },
  parapet: { height: 1.1, out: 0.08 },
  windows: { sill: 1.25, head: 2.65, out: 0.03 },
  doors: { sill: 0.1, head: 3.2 },
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
