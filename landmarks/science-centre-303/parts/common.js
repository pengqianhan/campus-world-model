// Shared sizes, measured in the LINZ 2024 LiDAR (data/science-centre-303_pts.npy: the building returns, class 6, in
// the crop box) in the view frame of config/science-centre-303.json: x is -axis (south-west), y up from the frame's
// ground (41.6 m NZVD2016, the median ground in the crop box, and the LiDAR's ground at the config's door, set at
// step 7), z is toStreet (north-west); the frame's centre at x = z = 0. Owned by the lead: read, do not edit. Measured
// 2026-11-06 (round 0; round 1's shape).
//
// How: the 90th percentile of the returns in each 0.5 m cell, and the returns on the face to the street. The
// building's walls all run square with its face to the street, which is turned 3.24 degrees from the frame, so the
// building has its own frame: u along that face from its north-east end toward the south-west, w out of it (the
// street side positive). In it: a range along the street, 11.2 m deep, its flat roof at 13.4 m behind a parapet at
// 14.05 m along the face; behind it a slab 15.6 m deep, its roof at 33.6 m, a raised part at 37.6 m, a screened
// deck, a round tank to 41.8 m and a box on it; behind that a block toward the south-west, 13.4 m with ridges at 17 m
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
  // face: z 16.2 at x -23, 12.6 at x 41), and at its north-east end, where the slab does not reach (u below 6.75),
  // back to the slab's back line; its roof at 13.4 m (the cells 13.2-13.7, rising a little away from the face), the
  // parapet along the face at 14.05 m (the face's top, p99 14.1).
  range: { u: [0, 70.3], w: [-11.2, 0], ne: { u: [0, 6.9], w: [-26.3, -11.2] }, roof: 13.4, parapet: { top: 14.05, width: 0.4 } },
  // Where the range and the slab meet 303S (2026-11-07, when 303S came onto the site): the campus map's rings leave
  // them at u 70.3, but the LiDAR has them run on to 303S's back, with no returns below them in between. The slab's
  // end bay runs on at 32.8 m to u 71.65 (its returns' u p98 71.55-71.73 from w -12 to -26); the range at its roof's
  // height (its returns there at 13.2-13.4 m, as 303S's tip beside it, which the model of 303S stands at 13.3 m) to
  // 303S's back, 5 cm into it: from u 71.87 at the face to u 71.42 at w -11.5 (303S's tip's back corner, and its back
  // line, at u 71.82 and 71.29-71.40 in this frame).
  ends: { range: { u0: 71.87, slope: 0.0391 }, slab: { u: 71.65 } },
  // The face to the street (step 5): its three bands of precast panels in one plane (the returns on the face within
  // 0.1 m of the line at every height), the gaps between them at the layers of returns on the face, 10.15 and
  // 5.85 m (each drawn 0.4 m tall, estimated), the lowest band from 3.0 m (estimated, the photograph as a reference)
  // and from u 1.06 (its returns end at x -29.5, the others' at -30.56); the canopy along the entrance, its top at
  // 2.74 m and its front 0.93 m out of the face (its returns, p50 and p95), from u 11.6 to 52.6 (x -19 to 22), 0.3 m
  // deep (estimated); under it the ground storey glazed (estimated), elsewhere plain.
  face: { gaps: [[9.95, 10.35], [5.65, 6.05]], band1: { u0: 1.06, bottom: 3.0 },
          canopy: { u: [11.6, 52.6], top: 2.74, out: 0.93, t: 0.3 } },
  // The slab: from u 6.75 (the 0.5 m cells at w -14 and -25) to 303S's ring, w -11.2 to -26.8 (its back's returns), its roof at 33.6 m (the 1 m cells 33.4-34.0,
  // a little higher along its middle), but for a bay at each end at 32.8 m (the cells 32.7-32.9: u to 11.0, from
  // 68.3); on it a raised part at 37.6 m (the cells 37.5-37.7, u 15.0-26.0, w -23.0 to -15.0); and toward its
  // south-west end, from the north-east: an enclosure of screens to 35.85 m round a deck at 34.5 m (u 42.9-53.9,
  // w -23.4 to -16.2), a round tank 8 m across to 41.8 m (its top's returns u 54.8-62.8, p50 41.73) with a flue
  // to 44.7 m at its edge (8 returns, u 54.9-55.4), and a box at 38.1 m (u 59.5-65.9, w -23.6 to -16.1).
  slab: { u: [6.75, 70.3], w: [-26.8, -11.2], roof: 33.6, bays: { u: [11.0, 68.3], roof: 32.8 },
          raised: { u: [15.0, 26.0], w: [-23.0, -15.0], top: 37.6 },
          enclosure: { u: [42.9, 53.9], w: [-23.4, -16.2], top: 35.85, deck: 34.5, wall: 0.5 },
          tank: { at: [58.8, -19.9], r: 4.0, top: 41.8, flue: { u: [54.85, 55.4], w: [-22.9, -22.3], top: 44.7 } },
          box: { u: [59.5, 65.9], w: [-23.6, -16.1], top: 38.1 } },
  // Behind the slab, toward the south-west, to the campus map's ring of 305 (w -36.3): a block, its roof at 13.4 m,
  // with flat-topped ridges at 17 m 2.75 to 3.25 m wide (the last 5.25), about 6 m apart along u, from its back to the stacks (the 0.5 m
  // cells at w -34 and along u 31.5 and 44), a part at 22.4 m (u 38.75-42.25); and six round stacks along the slab's back, 2.7 m round, to 42.1 m (the returns above
  // 36.5 m: their centres at w -28.95 and u 31.3, 37.6, 43.6, 49.7, 55.8 and 63.5, p90 42.0-42.1).
  rear: { u: [24.8, 67.0], w: [-36.3, -26.1], roof: 13.4,
          ridges: { u: [[30.0, 32.75], [36.0, 38.75], [42.25, 45.0], [48.0, 51.25], [54.5, 57.25], [61.5, 66.75]], w: [-36.3, -30.4], top: 17.0 },
          tower: { u: [38.75, 42.25], w: [-36.3, -29.0], top: 22.4 },
          stacks: { u: [31.3, 37.6, 43.6, 49.7, 55.8, 63.5], w: -28.95, r: 1.35, top: 42.1 } },
  // Toward the north-east: a wing from u 1.2 to 25 and from w -31 back to -61 (301's ring from w -59.5 for u above
  // 8), its roof at 18.3 m (the cells 18.2-18.4); along its north-east side and its front a strip at 16.2 m, 1.7 to
  // 1.75 m wide (u -0.5 to the wing's 1.2; w -31 to -29.25), a light well 2 m wide between it and the slab (no returns at w -29 to
  // -27); a part at 21 m against the slab (u 12-23.5, w -32 to the slab, 10 cm into it). Behind w -36 its roof has two troughs across
  // it, each falling sharply to 16.9 m at its north-east side and rising to 18.2 m 2.5 m on (the 0.5 m cells at
  // w -42, -50 and -58; the 2023 aerial's dark stripes).
  wing: { u: [1.2, 25.0], w: [-61.0, -31.0], roof: 18.3, strip: { u: [-0.5, 1.3], w: -29.25, top: 16.2 },
          raised: { u: [12.0, 23.5], w: [-32.0, -26.7], top: 21.0 },
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
