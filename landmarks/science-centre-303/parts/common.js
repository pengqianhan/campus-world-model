// Shared sizes, measured in the LINZ 2024 LiDAR (data/science-centre-303_pts.npy: the building returns, class 6, in
// the crop box) in the view frame of config/science-centre-303.json: x is -axis (south-west), y up from the frame's
// ground (41.6 m NZVD2016, the median ground in the crop box; to be the LiDAR's ground at the config's door at step
// 7), z is toStreet (north-west); the frame's centre at x = z = 0. Owned by the lead: read, do not edit. Measured
// 2026-11-06 (round 0).
//
// How: the 90th percentile of the returns in each 0.5 m cell, and the returns on the face to the street. The
// building's walls all run square with its face to the street, which is turned 3.24 degrees from the frame, so the
// building has its own frame: u along that face from its north-east end toward the south-west, w out of it (the
// street side positive). In it: a range along the street, 11.2 m deep, its flat roof at 13.4 m behind a parapet at
// 14.05 m along the face; behind it a slab 15 m deep, its roof at 33.6 m, a raised part at 37.6 m and plant to
// 38.1 m on it; behind that a block at 17 m toward the south-west and a wing at 18.3 m toward the north-east.

// The lowest the walls go: the ground falls 5.7 m along the face to the south-west (the LiDAR's ground 0.3-6 m out
// of it from +1.55 m at its north-east end to -4.12 m at its south-west end).
export const FOOT = -6.0;

export const MEASURED = {
  // The face to the street (step 3's fit): z = 26.144 - 0.05655 x in the view frame, the returns on it within
  // 0.08 m (p90); its north-east end at x -30.56 (the top's returns), its south-west end at x 44.6.
  frame: { corner: [-30.56, 27.872], e: [0.99840, -0.05646], n: [0.05646, 0.99840] },
  // The range along the street: from the face 11.2 m back (the slab's front, its returns' edge parallel to the
  // face: z 16.2 at x -23, 12.6 at x 41), and at its north-east end, where the slab does not reach (u below 5.1),
  // back to the slab's back line; its roof at 13.4 m (the cells 13.2-13.7, rising a little away from the face), the
  // parapet along the face at 14.05 m (the face's top, p99 14.1).
  range: { u: [0, 75.3], w: [-11.2, 0], ne: { u: [0, 5.4], w: [-26.3, -11.2] }, roof: 13.4, parapet: { top: 14.05, width: 0.4 } },
  // The slab: from u 5.1 (x -25.5) to 72.6 (x 42), w -11.2 to -26.3, its roof at 33.6 m (p50 of its cells); a
  // raised part at 37.6 m (the cells 37.5-37.7: x -17 to -6, z 3 to 11) and plant to 38.1 m (x 18 to 32, z 1 to 9).
  slab: { u: [5.1, 72.6], w: [-26.3, -11.2], roof: 33.6, raised: { u: [13.5, 24.6], w: [-23.8, -15.8], top: 37.6 },
          plant: { u: [48.6, 62.6], w: [-23.3, -15.3], top: 38.1 } },
  // Behind the slab, toward the south-west: a block from u 32.6 to 66.6 (x 2 to 36), back to w -38, its roof at 17 m
  // (its cells 16.9-17.0, with lower courts at 13.4 and a part at 22 m, not drawn yet).
  rear: { u: [32.6, 66.6], w: [-38.0, -26.0], roof: 17.0 },
  // Toward the north-east: a wing from u -4.45 (x -35, the ring's north-east edge) to 24.6 (x -6), back to w -63.5
  // (z -36.8), its roof at 18.3 m (the cells 18.2-18.4).
  wing: { u: [-4.45, 24.6], w: [-63.5, -26.0], roof: 18.3 },
};

/** The point [x, z] of the view frame at u along the face to the street and w out of it. */
export function at(u, w) {
  const F = MEASURED.frame;
  return [F.corner[0] + u * F.e[0] + w * F.n[0], F.corner[1] + u * F.e[1] + w * F.n[1]];
}

/** The rectangle from u0 to u1 and w0 to w1 in the building's frame, as a plan [[x, z] x 4]. */
export function rect([u0, u1], [w0, w1]) {
  return [at(u0, w0), at(u1, w0), at(u1, w1), at(u0, w1)];
}
