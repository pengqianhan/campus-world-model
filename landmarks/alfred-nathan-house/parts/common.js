// Shared sizes, measured in the LINZ 2024 LiDAR (data/alfred-nathan-house_pts.npy, building 103's points)
// in the view frame of config/alfred-nathan-house.json: x to the right as seen from Princes Street on the
// west-north-west (toward the General Library, south-south-west), y up from the ground at the foot of the
// house's front steps (45.75 m NZVD2016), z toward the street; the centre of the block's roof points
// above 11.75 m at x = z = 0. Owned by the lead: read, do not edit. Measured 2026-10-22.
//
// How far the walls go below y = 0: the ground falls away from the house's front (0) to -1.35 m at the
// house's back corners (z 18), -2.2 at the block's west end (z 12), -3.35 at its east end (z -22) and
// -4.5 at its north-north-east corner (x -11, z -24). Each part's walls go down to their own foot.
export const FOOT = { house: -1.9, block: -4.8 };

export const MEASURED = {
  // The four-storey block behind the house: its walls (the building points 2-12.5 m up: x -6.69/-6.38/
  // -5.94 and 6.64/7.22/8.11 at p5/p50/p95, the east end at z -19.8), its eaves level all round at
  // 13.3 (15.55-15.75 m above 43.5 at the edges), and a low hipped roof of four planes of different
  // pitch, fitted to the 4,238 roof points (rms 0.21 m, 86% within 0.25 m): rising `slope` m a metre in
  // from each edge, to an apex 16.5 m up at about x 3.5, z -8 (the LiDAR's ridge there: 16.0-16.25).
  block: {
    x: [-6.45, 7.25], z: [-19.8, 17.5],
    // the roof's edges, as fitted (a little beyond the walls: the eaves' fascia)
    roofX: [-6.6, 7.6], roofZ: [-20.0, 17.5],
    eave: 13.3,
    slope: { left: 0.323, right: 0.789, east: 0.267, west: 0.125 },
    // a plant room on the roof (85 points, 18.5-18.9 m up)
    plant: { x: [1.85, 4.9], z: [-9.25, -6.45], top: 18.55 },
    // the ground at its east end, where its lowest storey stands clear (-3.35, the photographs'
    // entrance up steps from the campus path)
    eastGround: -3.35,
  },
  // The two-storey house at the west end, its front on Princes Street: walls x -6.6..8.4 behind (z 17.5
  // to 21.5) and -6.9..7.2 in front (z 21.5-26.3), a roof 10.15-10.35 m up behind a balustraded parapet
  // on the front wall (11.45). Before the front (the LiDAR: x -7.5..6.9 at z 27.5, -5.1..5.0 at 28.5,
  // -2.4..2.2 at 29.5, tops 8.75-9.15): two canted bays of two storeys, their fronts at z 28.4, and between
  // them a porch of three arches under a balcony whose columns and entablature bow out to z 29.8. Heights
  // on the front from vZGe's photographs, which put the parapet's top at 11.45 within a pixel: the porch
  // floor 1.5 (up steps from the path), the balcony floor 5.25 and its railing to 6.1, the entablature
  // over the balcony to 8.75, the bays' tops 8.9, the main cornice 10.6.
  house: {
    back: { x: [-6.6, 8.4], z: [17.5, 21.5] },
    front: { x: [-6.9, 7.2], z: [21.5, 26.3] },
    roof: 10.25, cornice: 10.6, parapet: 11.45,
    // each bay in plan: its corners at the wall and at its front, from left to right. Widths from vZGe's
    // upper view, as shares of the front between the quoins: each bay 4.3 m at the wall and 2.6 m across
    // its front, the porch and balcony 6.3 m between the bays' front corners; the openings in it
    bays: [[[-6.45, 26.3], [-5.6, 28.4], [-3.0, 28.4], [-2.15, 26.3]], [[2.45, 26.3], [3.3, 28.4], [5.9, 28.4], [6.75, 26.3]]],
    bayTop: 8.9,
    porch: { x: [-3.0, 3.3], front: 28.4, floor: 1.5, arch: 4.8, top: 5.25, openings: [[-2.65, -0.95], [-0.7, 1.3], [1.55, 2.95]] },
    // the parapet's pedestals: the corners and two between (vZGe's upper view)
    pedestals: [-6.65, -2.6, 2.05, 6.95],
    balcony: { bow: 29.8, rail: 6.1, top: 8.75 },
    windows: { ground: [2.2, 4.5], upper: [6.8, 8.2] },
  },
};
