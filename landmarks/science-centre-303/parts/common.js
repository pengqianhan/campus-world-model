// Shared sizes, measured in the LINZ 2024 LiDAR (data/science-centre-303_pts.npy: the building returns, class 6, in
// the crop box) in the view frame of config/science-centre-303.json: x is -axis (south-west), y up from the frame's
// ground (41.6 m NZVD2016, the median ground in the crop box; to be the LiDAR's ground at the config's door at step
// 7), z is toStreet (north-west); the frame's centre at x = z = 0. Owned by the lead: read, do not edit. Measured
// 2026-11-06 (round 0; round 1's shape).
//
// How: the 90th percentile of the returns in each 0.5 m cell, and the returns on the face to the street. The
// building's walls all run square with its face to the street, which is turned 3.24 degrees from the frame, so the
// building has its own frame: u along that face from its north-east end toward the south-west, w out of it (the
// street side positive). In it: a range along the street, 11.2 m deep, its flat roof at 13.4 m behind a parapet at
// 14.05 m along the face; behind it a slab 15 m deep, its roof at 33.6 m, a raised part at 37.6 m and plant to
// 38.2 m and a round tank to 44.3 m on it; behind that a block toward the south-west, 13.4 m with ridges at 17 m
// and six round stacks to 42.1 m, and a wing at 18.3 m toward the north-east.

// The lowest the walls go: the ground falls 5.7 m along the face to the south-west (the LiDAR's ground 0.3-6 m out
// of it from +1.55 m at its north-east end to -4.12 m at its south-west end).
export const FOOT = -6.0;

export const MEASURED = {
  // The face to the street (step 3's fit): z = 26.144 - 0.05655 x in the view frame, the returns on it within
  // 0.08 m (p90); its north-east end at x -30.56 (the top's returns). The face runs on to u 75.3, but from u 70.3 it
  // is 303S's (the campus map's ring of 303S from u 70.1-70.4).
  frame: { corner: [-30.56, 27.872], e: [0.99840, -0.05646], n: [0.05646, 0.99840] },
  // The range along the street: from the face 11.2 m back (the slab's front, its returns' edge parallel to the
  // face: z 16.2 at x -23, 12.6 at x 41), and at its north-east end, where the slab does not reach (u below 5.1),
  // back to the slab's back line; its roof at 13.4 m (the cells 13.2-13.7, rising a little away from the face), the
  // parapet along the face at 14.05 m (the face's top, p99 14.1).
  range: { u: [0, 70.3], w: [-11.2, 0], ne: { u: [0, 5.4], w: [-26.3, -11.2] }, roof: 13.4, parapet: { top: 14.05, width: 0.4 } },
  // The slab: from u 5.1 (x -25.5) to 303S's ring, w -11.2 to -26.3, its roof at 33.6 m (p50 of its cells); a raised
  // part at 37.6 m (the returns above 35.5 m, u 15.4-25.7, w -22.9 to -15.5, p90 37.63) and plant (u 47.3-65.7,
  // w -23.5 to -16.1, p50 38.2) with a round tank on it, 4 m round, to 44.3 m (p99; its centre the returns' above
  // 39 m).
  slab: { u: [5.1, 70.3], w: [-26.3, -11.2], roof: 33.6, raised: { u: [15.4, 25.7], w: [-22.9, -15.5], top: 37.6 },
          plant: { u: [47.3, 65.7], w: [-23.5, -16.1], top: 38.2 }, tank: { at: [58.77, -19.88], r: 4.0, top: 44.3 } },
  // Behind the slab, toward the south-west, to the campus map's ring of 305 (w -36.3): a block, its roof at 13.4 m,
  // with ridges at 17 m every 6 m along u (the 2 m cells' rhythm, to be measured at 0.5 m at step 6) and a part at
  // 22.4 m (u 38-41.5); and six round stacks along the slab's back, 2.7 m round, to 42.1 m (the returns above
  // 36.5 m: their centres at w -28.95 and u 31.3, 37.6, 43.6, 49.7, 55.8 and 63.5, p90 42.0-42.1).
  rear: { u: [24.8, 67.0], w: [-36.3, -26.1], roof: 13.4,
          ridges: { u: [[29.5, 33.5], [35.5, 38.0], [41.5, 45.5], [47.5, 51.5], [53.5, 57.5], [59.5, 67.0]], w: [-36.3, -27.0], top: 17.0 },
          tower: { u: [38.0, 41.5], w: [-36.3, -29.0], top: 22.4 },
          stacks: { u: [31.3, 37.6, 43.6, 49.7, 55.8, 63.5], w: -28.95, r: 1.35, top: 42.1 } },
  // Toward the north-east: a wing from u 0 to 25, back to w -61 (301's ring from w -59.5 for u above 8), its roof at
  // 18.3 m (the cells 18.2-18.4); a strip 2.5 m wide at 16.2 m along its north-east side (the ring's edge at u -3.0),
  // and a part at 21 m against the slab (u 12-23.5, w to -31).
  // Behind w -36 its roof has two troughs across it, each falling sharply to 16.9 m at its north-east side and rising
  // to 18.2 m 2.5 m on (the 0.5 m cells at w -42, -50 and -58; the 2023 aerial's dark stripes).
  wing: { u: [0.05, 25.0], w: [-61.0, -26.0], roof: 18.3, ne: { u: [-2.5, 0.3], top: 16.2 }, raised: { u: [12.0, 23.5], w: [-31.0, -26.0], top: 21.0 },
          troughs: { u: [[9.0, 11.5], [17.25, 19.75]], w: -36.0, low: 16.9, high: 18.2 } },
};

/** The point [x, z] of the view frame at u along the face to the street and w out of it. */
export function at(u, w) {
  const F = MEASURED.frame;
  return [F.corner[0] + u * F.e[0] + w * F.n[0], F.corner[1] + u * F.e[1] + w * F.n[1]];
}

/** u and w of the point [x, z] of the view frame. */
export function uw(x, z) {
  const F = MEASURED.frame, dx = x - F.corner[0], dz = z - F.corner[1];
  return [dx * F.e[0] + dz * F.e[1], dx * F.n[0] + dz * F.n[1]];
}

/** The rectangle from u0 to u1 and w0 to w1 in the building's frame, as a plan [[x, z] x 4]. */
export function rect([u0, u1], [w0, w1]) {
  return [at(u0, w0), at(u1, w0), at(u1, w1), at(u0, w1)];
}
