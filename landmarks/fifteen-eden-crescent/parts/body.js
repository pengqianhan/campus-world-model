// The building's two storeys (parts/common.js MEASURED.body), as MH15's photograph shows its face to
// Eden Crescent: white panelled walls on a base of dark brown tiles with a cream band over it, its
// windows set deep in square openings, their frames red; a flat roof. The street face's white panels
// stand 0.35 m out from the windows, as piers between them and bands between the rows, so that each
// window sits deep in its opening; the windows are every 3.3 m (counted in the photograph, not
// measured). The faces no photograph shows are plain. Round 0 (the lead): the massing; round 1 (the
// lead): the street face's depth and the base's dark tiles.
import { MEASURED as M, FOOT } from "./common.js";
import { prism, roof, edgeBox } from "./shapes.js";

/** The plan's edge along Eden Crescent: from [18.9, 11.6] to [-19.3, 12.3]. */
const STREET = 1;

/** How far the street face's panels stand out from its windows. */
const DEEP = 0.35;

/** The two rows of windows on the street face, from their sills to their heads (estimated). */
const ROWS = [[1.7, 3.2], [M.floor + 0.9, M.floor + 2.4]];

/** Each window's width and the bay it stands in (estimated from the photograph). */
const WIDE = 1.4, BAY = 3.3;

export function body(b) {
  prism(b, M.body.plan, FOOT, M.body.top, "paint");
  roof(b, M.body.plan, M.body.top + 0.02, 0.3, "roofGrey");
  // the base: dark brown tiles to 1.2 m and a cream band over them, on every face; on the street face
  // they stand out with the panels
  for (let i = 0; i < M.body.plan.length; i++) {
    const out = i === STREET ? DEEP : 0.04;
    edgeBox(b, M.body.plan, i, -0.01, 1.01, 0.0, out, FOOT, 1.2, "timber");
    edgeBox(b, M.body.plan, i, -0.01, 1.01, 0.0, out + 0.01, 1.2, 1.5, "render");
  }
}

/** The street face's white panels, standing out round the windows: bands between the rows, piers between the windows. */
export function panels(b) {
  const plan = M.body.plan;
  const [x0, z0] = plan[STREET], [x1, z1] = plan[STREET + 1];
  const L = Math.hypot(x1 - x0, z1 - z0);
  // bands: below the first row, between the rows, and above the second to the roof
  const bands = [[1.5, ROWS[0][0] - 0.12], [ROWS[0][1], ROWS[1][0] - 0.12], [ROWS[1][1], M.body.top]];
  for (const [y0, y1] of bands) edgeBox(b, plan, STREET, 0, 1, 0.0, DEEP, y0, y1, "paint");
  // piers: from each window's side to the next, within each row
  const starts = [];
  for (let s = 1.6; s < L - 1.0; s += BAY) starts.push(s);
  for (const [y0, y1] of ROWS) {
    let from = 0;
    for (const s of starts) {
      edgeBox(b, plan, STREET, from / L, s / L, 0.0, DEEP, y0 - 0.12, y1, "paint");
      from = s + WIDE;
    }
    edgeBox(b, plan, STREET, from / L, 1, 0.0, DEEP, y0 - 0.12, y1, "paint");
  }
}

/** The windows of the street face: two rows, each pane on the wall's face, deep in its opening, in a red frame. */
export function windows(b) {
  const plan = M.body.plan;
  const [x0, z0] = plan[STREET], [x1, z1] = plan[STREET + 1];
  const L = Math.hypot(x1 - x0, z1 - z0);
  for (let s = 1.6; s < L - 1.0; s += BAY) {
    const a = s / L, c = (s + WIDE) / L;
    for (const [y0, y1] of ROWS) {
      edgeBox(b, plan, STREET, a, c, 0.0, 0.02, y0, y1, "glass");
      edgeBox(b, plan, STREET, a, a + 0.07 / L, -0.02, 0.08, y0, y1, "roofTile");
      edgeBox(b, plan, STREET, c - 0.07 / L, c, -0.02, 0.08, y0, y1, "roofTile");
      edgeBox(b, plan, STREET, a, c, -0.02, 0.1, y0 - 0.12, y0, "roofTile");
      edgeBox(b, plan, STREET, a, c, -0.02, 0.08, y1 - 0.07, y1, "roofTile");
    }
  }
}
