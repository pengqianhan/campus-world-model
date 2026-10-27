// The building's two storeys (parts/common.js MEASURED.body), as MH15's photograph shows its face to
// Eden Crescent: white panelled walls on a base of brownish-grey tiles under a band of white tiles, its
// windows set deep in square openings, their frames red; a flat roof. The street face's white panels
// stand 0.35 m out from the windows, as piers between them and bands between the rows, so that each
// window sits deep in its opening. The faces no photograph shows are plain. Round 0 (the lead): the
// massing; round 1 (the lead): the street face's depth and the base's dark tiles; round 2 (the lead):
// the windows, the base, the face's top and the canopy measured in MH15's door, upper and wide views
// through its camera (streetview.camera_fixes), whose height the footpath at the face's foot confirms
// (-0.9 to -0.96 m through it, -0.97 in the LiDAR), and the canopy's reach and height in the LiDAR.
import { MEASURED as M, FOOT } from "./common.js";
import { prism, roof, edgeBox } from "./shapes.js";

/** The plan's edge along Eden Crescent: from [18.9, 11.6] to [-19.3, 12.3]. */
const STREET = 1;

/** How far the street face's panels stand out from its windows. */
const DEEP = 0.35;

/**
 * The two rows of windows on the street face, from their sills to their heads: where the white panels
 * stop and start again down five columns of MH15's door and upper views (s 7 to 13 m), 0.1 m or so
 * either way.
 */
const ROWS = [[0.5, 2.5], [4.2, 5.75]];

/** The white panels' top (MH15's upper view: 6.3-6.5 m); above it, under the canopy, the face stands back in shade. */
const FACE_TOP = 6.45;

/**
 * The canopy over the street face: the LiDAR's roof returns reach 0.6-0.8 m past the plan's edge
 * (p97 0.58, max 0.80) at 7.29-7.42 m; its thickness is estimated.
 */
const CANOPY = { out: 0.75, y0: 7.2, y1: 7.42 };

/**
 * Each row's windows: their width, the first one's centre along the street edge from its north-west end,
 * and the spacing. The centres and widths of the windows at s 4.8 to 13.5 m are measured in MH15's
 * photographs (the red frames found by colour and carried onto the face: upper row at 4.8, 6.7, 8.8, 11.0
 * and 13.5, 0.9-1.0 m wide; ground floor at 9.0, 11.4 and 13.6, 0.7-1.1 m wide); further south-east no
 * photograph shows them closely, and the spacing is carried on (estimated).
 */
const WINDOWS = [{ wide: 1.0, first: 9.0, bay: 2.25 }, { wide: 0.95, first: 4.8, bay: 2.15 }];

/**
 * The base, in MH15's door view: brownish-grey tiles from the footpath (-1.0 m) to 0.0 (about 150, 130,
 * 125), drawn in the kit's dark timber, whose brightness is nearest under this light (its grain and
 * warmer hue are not the tiles': a tile material is still to come; the kit's mid-grey draws them at
 * about 185 against the photographs' 134); white tiles to 0.25; a terracotta sill band to 0.5, under
 * the ground floor's windows (drawn in the kit's cream render).
 */
const BASE = { tiles: 0.0, white: 0.25, sill: 0.5 };

/** The street edge's length and the centres of one row's windows along it. */
function centres(row) {
  const [x0, z0] = M.body.plan[STREET], [x1, z1] = M.body.plan[STREET + 1];
  const L = Math.hypot(x1 - x0, z1 - z0), w = WINDOWS[row];
  const out = [];
  for (let c = w.first; c + w.wide / 2 < L - 1.0; c += w.bay) out.push(c);
  return { L, out };
}

export function body(b) {
  prism(b, M.body.plan, FOOT, M.body.top, "paint");
  roof(b, M.body.plan, M.body.top + 0.02, 0.3, "roofGrey");
  // the base: brownish-grey tiles and white tiles over them on every face, a terracotta band at the
  // street face's sills; on the street face they stand out with the panels
  for (let i = 0; i < M.body.plan.length; i++) {
    const out = i === STREET ? DEEP : 0.04;
    edgeBox(b, M.body.plan, i, -0.01, 1.01, 0.0, out, FOOT, BASE.tiles, "timber");
    edgeBox(b, M.body.plan, i, -0.01, 1.01, 0.0, out + 0.01, BASE.tiles, BASE.white, "paint");
  }
  edgeBox(b, M.body.plan, STREET, -0.01, 1.01, 0.0, DEEP + 0.04, BASE.white, BASE.sill, "render");
  // the canopy: a white slab along the street face
  edgeBox(b, M.body.plan, STREET, -0.01, 1.01, 0.0, CANOPY.out, CANOPY.y0, CANOPY.y1, "paint");
}

/** The street face's white panels, standing out round the windows: bands between the rows, piers between the windows. */
export function panels(b) {
  const plan = M.body.plan;
  // bands: from the sill band to the first row, between the rows, and above the second to the panels' top
  const bands = [[BASE.sill, ROWS[0][0] - 0.08], [ROWS[0][1], ROWS[1][0] - 0.08], [ROWS[1][1], FACE_TOP]];
  for (const [y0, y1] of bands) if (y1 > y0) edgeBox(b, plan, STREET, 0, 1, 0.0, DEEP, y0, y1, "paint");
  // piers: from each window's side to the next, within each row (from under its sill frame)
  ROWS.forEach(([y0, y1], row) => {
    const { L, out } = centres(row), half = WINDOWS[row].wide / 2;
    let from = 0;
    for (const c of out) {
      edgeBox(b, plan, STREET, from / L, (c - half) / L, 0.0, DEEP, Math.max(BASE.sill, y0 - 0.08), y1, "paint");
      from = c + half;
    }
    edgeBox(b, plan, STREET, from / L, 1, 0.0, DEEP, Math.max(BASE.sill, y0 - 0.08), y1, "paint");
  });
}

/** The windows of the street face: two rows, each pane on the wall's face, deep in its opening, in a red frame. */
export function windows(b) {
  const plan = M.body.plan;
  ROWS.forEach(([y0, y1], row) => {
    const { L, out } = centres(row), half = WINDOWS[row].wide / 2;
    for (const cs of out) {
      const a = (cs - half) / L, c = (cs + half) / L;
      edgeBox(b, plan, STREET, a, c, 0.0, 0.02, y0, y1, "glass");
      edgeBox(b, plan, STREET, a, a + 0.07 / L, -0.02, 0.08, y0, y1, "roofTile");
      edgeBox(b, plan, STREET, c - 0.07 / L, c, -0.02, 0.08, y0, y1, "roofTile");
      edgeBox(b, plan, STREET, a, c, -0.02, 0.1, y0 - 0.08, y0, "roofTile");
      edgeBox(b, plan, STREET, a, c, -0.02, 0.08, y1 - 0.07, y1, "roofTile");
    }
  });
}
