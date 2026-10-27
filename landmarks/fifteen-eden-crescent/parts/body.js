// The building's two storeys (parts/common.js MEASURED.body), as MH15's photograph shows its face to
// Eden Crescent: white panelled walls on a base of brownish-grey tiles under a band of white tiles, its
// windows set deep in square openings, their frames red; a roof sloping up from the eaves to the top
// storey. The street face's white panels stand 0.35 m out from the windows, as piers between them and
// bands between the rows, so that each window sits deep in its opening. The faces no photograph shows are
// plain. Round 0 (the lead): the massing; round 1 (the lead): the street face's depth and the base's dark
// tiles; round 2 (the lead): the windows, the base, the face's top and the canopy measured in MH15's door,
// upper and wide views through its camera (streetview.camera_fixes), whose height the footpath at the
// face's foot confirms (-0.9 to -0.96 m through it, -0.97 in the LiDAR), and the canopy's reach and height
// in the LiDAR. Round 3: the roofs' slopes (common.js), and from MH15's photographs through the same camera
// the openings' depth and widths, a door with its steps, a louvre and its hood, the north-west end's tall
// window and the band of windows under the canopy (OPEN says which openings are measured and not drawn).
// Carried through the camera: a feature on the panels' face onto the plane 0.35 m out from the plan's edge,
// a feature on the windows' plane onto the edge itself, a step's foot onto the footpath.
import { MEASURED as M, FOOT } from "./common.js";
import { prism, edgeBox, clip, slopedPrism } from "./shapes.js";

/** The plan's edge along Eden Crescent: from [18.9, 11.6] to [-19.3, 12.3]; s runs along it from its north-west end. */
const STREET = 1;

/** How far the street face's panels stand out from its windows. */
const DEEP = 0.35;

/**
 * The two rows of windows on the street face, from their sills to their heads: where the white panels
 * stop and start again down five columns of MH15's door and upper views (s 7 to 13 m), 0.1 m or so
 * either way.
 */
const ROWS = [[0.5, 2.5], [4.2, 5.75]];

/** The white panels' top (MH15's upper view: 6.3-6.5 m); above it, under the canopy, a band of windows. */
const FACE_TOP = 6.45;

/**
 * The canopy over the street face: the LiDAR's roof returns reach 0.6-0.8 m past the plan's edge
 * (p97 0.58, max 0.80) at 7.29-7.42; its thickness is estimated.
 */
const CANOPY = { out: 0.75, y0: 7.2, y1: 7.42 };

/**
 * Each row's windows: their width, the first one's centre along the street edge from its north-west end,
 * and the spacing. Round 2 measured the centres at s 4.8 to 13.5 m from the red frames (upper row at
 * 4.8, 6.7, 8.8, 11.0 and 13.5; ground floor at 9.0, 11.4 and 13.6). Round 3: the openings are square, not
 * splayed: in MH15's upper view the opening's outer edge on the panels' face and the red frame's edge on
 * the windows' plane fall at the same s (11.42 and 11.44 m) and the head at the same height (5.72 and
 * 5.68), so what looks like a splay is the jamb and the head seen from below and to one side, the head's
 * shadow across the jamb. The frame fills the opening; seen from the north-west, the far jamb hides 0.2 m
 * of it, so round 2's red, 0.9-1.0 m, was short. The openings at the face: upper row 0.91, 0.94, 1.07-1.10
 * and 1.05 m at s 4.8, 6.7, 8.8 and 10.9 (1.0 here); ground floor 1.13-1.18 at s 8.9, 11.1 and 13.4 and
 * 0.98 at 13.5 (1.1 here), their heads at 2.43-2.58 m. South-east of s 14 the spacing is carried on
 * (estimated): MH15's wide view shows a window in each bay of both rows to the face's south-east end, at
 * spacings of 2.2-2.5 m, but at that slant the camera's error grows past a metre (the ground floor's
 * heads come out 1.2 m too high at the far end), so it places none of them better than the spacing does.
 */
const WINDOWS = [{ wide: 1.1, first: 9.0, bay: 2.25 }, { wide: 1.0, first: 4.8, bay: 2.15 }];

/**
 * The base, in MH15's door view: brownish-grey tiles from the footpath (-1.0 m) to 0.0 (about 150, 130,
 * 125), drawn in the kit's dark timber, whose brightness is nearest under this light (its grain and
 * warmer hue are not the tiles': a tile material is still to come; the kit's mid-grey draws them at
 * about 185 against the photographs' 134); white tiles to 0.25; a terracotta sill band to 0.5, under
 * the ground floor's windows (drawn in the kit's cream render).
 */
const BASE = { tiles: 0.0, white: 0.25, sill: 0.5 };

/** The footpath at the street face's foot (the LiDAR: -0.85 to -1.05; MH15's camera: -0.9 to -0.96). */
const FOOTPATH = -0.95;

/**
 * The openings of the ground floor at the north-west end (round 3), in MH15's wide view through its camera,
 * s along the edge and y up; each opening's sides and head on the panels' face:
 * - A, a door: s 6.27-7.31, its threshold at -0.15, its head at 2.34; its leaf (greyish brown, about 132,
 *   122, 119, drawn in the kit's dark timber, as the base) to 2.25, with a glazed panel at s 6.44-6.88,
 *   y 0.74-2.07; steps down to the footpath;
 * - B: a louvre in an opening like a window's, s 4.37-5.46 (4.4-5.47 here), y 1.07 to 2.26, over a small
 *   green hood (0.76-1.07); under the hood a red-framed glazed case (a sprinkler inlet's, its words say),
 *   s 4.47-5.54, y -0.45 to 0.75: its foot half a metre above the footpath and 1.2 m tall, so not a door;
 * - C, a red fire door (about 140, 75, 68): s 2.75-3.70, its threshold at -0.3, its leaf to 1.59 and a
 *   glazed light over it to the head at 2.18; three steps down to the footpath, their foot 0.4-1.1 m out
 *   from the edge.
 * The case and door C are not drawn: the street lies 0.95 m below the frame's ground, and the site's ground
 * (the 8 m elevation model) 1.3 m below it there, so a red leaf or frame reaching below y = 0 here would
 * stand 0.6-0.9 m above that ground at its own lowest points, which tests/landmarks.test.ts checks for every
 * material that comes down to y = 0, at the material's own lowest points (the walls, the base's dark tiles,
 * whose material door A's leaf shares, and the steps reach the ground; the red and the glass here would
 * not); the panels stand there as before.
 */
const OPEN = {
  B: { s: [4.4, 5.47], louvre: [1.07, 2.26], hood: [0.76, 1.07] },
  A: { s: [6.27, 7.31], foot: -0.15, head: 2.34, leaf: 2.25, pane: { s: [6.44, 6.88], y: [0.74, 2.07] } },
};

/** The steps' foot out from the plan's edge (MH15's wide view, on the footpath: 0.4-1.1 m at door C). */
const STEPS_OUT = 0.85;

/**
 * Over door C, a window taller than the row's (MH15's wide view: s 2.65-3.55 at the face, from 3.15 to
 * 5.40 m), the north-west end's.
 */
const TALL = { s: [2.65, 3.55], y: [3.15, 5.4] };

/**
 * The band of windows under the canopy, set back over the panels' top: dark glass to 6.88 m at the
 * windows' plane (MH15's upper view), its red mullions 0.99 m apart where it shows them (s 7.29 and 8.28);
 * carried on along the face (estimated).
 */
const BAND = { y1: 6.88, first: 7.29, bay: 0.99 };

/** The street edge's length and the centres of one row's windows along it. */
function centres(row) {
  const [x0, z0] = M.body.plan[STREET], [x1, z1] = M.body.plan[STREET + 1];
  const L = Math.hypot(x1 - x0, z1 - z0), w = WINDOWS[row];
  const out = [];
  for (let c = w.first; c + w.wide / 2 < L - 1.0; c += w.bay) out.push(c);
  return { L, out };
}

const LEN = centres(0).L;

/** A box on the street face from s0 to s1 (metres along it), between o0 and o1 out from the edge and y0 to y1. */
function face(b, s0, s1, o0, o1, y0, y1, material) {
  if (s1 - s0 < 0.005 || y1 - y0 < 0.005) return;
  edgeBox(b, M.body.plan, STREET, s0 / LEN, s1 / LEN, o0, o1, y0, y1, material);
}

/** The panels' face in the band y0 to y1 from s = 0 to the face's end, leaving out each hole [s0, s1]. */
function panelsBetween(b, y0, y1, holes) {
  let from = -0.01 * LEN;
  for (const [h0, h1] of [...holes].sort((p, q) => p[0] - q[0])) {
    face(b, from, h0, 0.0, DEEP, y0, y1, "paint");
    from = h1;
  }
  face(b, from, 1.01 * LEN, 0.0, DEEP, y0, y1, "paint");
}

export function body(b) {
  const plan = M.body.plan, R = M.roofs;
  prism(b, plan, FOOT, M.body.eave, "paint");
  // the roofs: along the street, sloping up to the top storey, flat from x 14.5 to the north-west end; at
  // the back, sloping up to it; flat between, under it
  const street = clip(plan, 1, 6.0, "above"), back = clip(plan, 1, -6.0, "below");
  const middle = clip(clip(plan, 1, 6.0, "below") ?? [], 1, -6.0, "above");
  const y0 = M.body.eave - 0.1;
  slopedPrism(b, street && clip(street, 0, R.flatFrom, "below"), y0, (x, z) => R.street[0] + R.street[1] * z, "roofGrey");
  slopedPrism(b, street && clip(street, 0, R.flatFrom, "above"), y0, () => R.flat, "roofGrey");
  slopedPrism(b, back, y0, (x, z) => R.back[0] + R.back[1] * z, "roofGrey");
  slopedPrism(b, middle, y0, () => R.flat, "roofGrey");
  // the base: brownish-grey tiles and white tiles over them on every face but the street's
  for (let i = 0; i < plan.length; i++) {
    if (i === STREET) continue;
    edgeBox(b, plan, i, -0.01, 1.01, 0.0, 0.04, FOOT, BASE.tiles, "timber");
    edgeBox(b, plan, i, -0.01, 1.01, 0.0, 0.05, BASE.tiles, BASE.white, "paint");
  }
  // on the street face they stand out with the panels, with a terracotta band at the sills, round door A
  // (open to its steps)
  let from = -0.01 * LEN;
  for (const [h0, h1] of [OPEN.A.s]) {
    face(b, from, h0, 0.0, DEEP, FOOT, BASE.tiles, "timber");
    face(b, from, h0, 0.0, DEEP + 0.01, BASE.tiles, BASE.white, "paint");
    face(b, from, h0, 0.0, DEEP + 0.04, BASE.white, BASE.sill, "render");
    from = h1;
  }
  face(b, from, 1.01 * LEN, 0.0, DEEP, FOOT, BASE.tiles, "timber");
  face(b, from, 1.01 * LEN, 0.0, DEEP + 0.01, BASE.tiles, BASE.white, "paint");
  face(b, from, 1.01 * LEN, 0.0, DEEP + 0.04, BASE.white, BASE.sill, "render");
  // the steps up to door A, grey: a landing in the opening at the threshold, two steps out to STEPS_OUT
  for (const [d, s] of [[OPEN.A, OPEN.A.s]]) {
    const rise = (d.foot - FOOTPATH) / 3, w = 0.1;
    face(b, s[0] - w, s[1] + w, 0.0, DEEP, FOOT, d.foot, "grey");
    face(b, s[0] - w, s[1] + w, DEEP, DEEP + (STEPS_OUT - DEEP) / 2, FOOT, d.foot - rise, "grey");
    face(b, s[0] - w, s[1] + w, DEEP + (STEPS_OUT - DEEP) / 2, STEPS_OUT, FOOT, d.foot - 2 * rise, "grey");
  }
  // the canopy: a white slab along the street face
  edgeBox(b, plan, STREET, -0.01, 1.01, 0.0, CANOPY.out, CANOPY.y0, CANOPY.y1, "paint");
}

/** The street face's white panels, standing out round the windows and doors: bands between the rows, piers between the openings. */
export function panels(b) {
  const B = OPEN.B, A = OPEN.A;
  const tall = [TALL.s];
  // the ground floor: piers from the sill band to the band between the rows, round door A's, the louvre's
  // and the windows' openings; over door A and the louvre, the panel down to their heads; under the louvre,
  // the panel down from the hood (which fills the opening from 0.76 m to the louvre's sill)
  const ground = centres(0).out.map((c) => [c - WINDOWS[0].wide / 2, c + WINDOWS[0].wide / 2]);
  panelsBetween(b, BASE.sill, ROWS[0][1], [B.s, A.s, ...ground]);
  face(b, B.s[0], B.s[1], 0.0, DEEP, BASE.sill, B.hood[0], "paint");
  face(b, B.s[0], B.s[1], 0.0, DEEP, B.louvre[1], ROWS[0][1], "paint");
  face(b, A.s[0], A.s[1], 0.0, DEEP, A.head, ROWS[0][1], "paint");
  // the band between the rows, open over the tall window from its sill up
  panelsBetween(b, ROWS[0][1], TALL.y[0], []);
  panelsBetween(b, TALL.y[0], ROWS[1][0] - 0.08, tall);
  // the upper row: piers round its windows and the tall window
  const upper = centres(1).out.map((c) => [c - WINDOWS[1].wide / 2, c + WINDOWS[1].wide / 2]);
  panelsBetween(b, ROWS[1][0] - 0.08, ROWS[1][1], [...tall, ...upper]);
  face(b, TALL.s[0], TALL.s[1], 0.0, DEEP, TALL.y[1], ROWS[1][1], "paint");
  // above the upper row to the panels' top
  panelsBetween(b, ROWS[1][1], FACE_TOP, []);
}

/** A window on the windows' plane from s0 to s1 and y0 to y1: its pane, in a red frame. */
function window(b, s0, s1, y0, y1) {
  face(b, s0, s1, 0.0, 0.02, y0, y1, "glass");
  face(b, s0, s0 + 0.07, -0.02, 0.08, y0, y1, "roofTile");
  face(b, s1 - 0.07, s1, -0.02, 0.08, y0, y1, "roofTile");
  face(b, s0, s1, -0.02, 0.1, y0 - 0.08, y0, "roofTile");
  face(b, s0, s1, -0.02, 0.08, y1 - 0.07, y1, "roofTile");
}

/** The windows and doors of the street face, deep in their openings, and the band of windows under the canopy. */
export function windows(b) {
  ROWS.forEach(([y0, y1], row) => {
    const half = WINDOWS[row].wide / 2;
    for (const c of centres(row).out) window(b, c - half, c + half, y0, y1);
  });
  window(b, TALL.s[0], TALL.s[1], TALL.y[0], TALL.y[1]);
  // B: the louvre's dark blades and the green hood under it
  const B = OPEN.B;
  face(b, B.s[0], B.s[1], -0.05, 0.0, B.louvre[0], B.louvre[1], "iron");
  for (let y = B.louvre[0] + 0.06; y < B.louvre[1] - 0.04; y += 0.12) face(b, B.s[0], B.s[1], -0.05, 0.03, y, y + 0.03, "roofGrey");
  face(b, B.s[0] - 0.03, B.s[1] + 0.03, 0.0, DEEP + 0.08, B.hood[0], B.hood[1], "roofGreen");
  // A: the leaf with its glazed panel, under a red head
  const A = OPEN.A, p = A.pane;
  face(b, A.s[0], p.s[0], -0.02, 0.04, A.foot, A.leaf, "timber");
  face(b, p.s[1], A.s[1], -0.02, 0.04, A.foot, A.leaf, "timber");
  face(b, p.s[0], p.s[1], -0.02, 0.04, A.foot, p.y[0], "timber");
  face(b, p.s[0], p.s[1], -0.02, 0.04, p.y[1], A.leaf, "timber");
  face(b, p.s[0], p.s[1], -0.04, -0.02, p.y[0], p.y[1], "glass");
  face(b, A.s[0], A.s[1], -0.02, 0.06, A.leaf, A.head, "roofTile");
  // the band of windows under the canopy: dark glass over the panels' top, red mullions
  face(b, -0.01 * LEN, 1.01 * LEN, 0.0, 0.02, FACE_TOP - 0.05, BAND.y1, "glass");
  const n = Math.floor((LEN - 0.3 - BAND.first) / BAND.bay), back = Math.floor((BAND.first - 0.3) / BAND.bay);
  for (let k = -back; k <= n; k++) {
    const s = BAND.first + k * BAND.bay;
    face(b, s - 0.04, s + 0.04, 0.0, 0.07, FACE_TOP - 0.05, BAND.y1, "roofTile");
  }
}
