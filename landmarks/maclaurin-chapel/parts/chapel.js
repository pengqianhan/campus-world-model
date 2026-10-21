// The chapel (parts/common.js MEASURED.chapel, .window, .spire, .bay): six white rendered walls, the great
// window wrapping the street corner (a grid of deep white frames over dark glass, its columns' tops
// stepping up toward the corner), a low hexagonal pyramid roof with a rib on each hip (the aerial) and a
// dark edge (the photographs), the slender square spire with its cross, and the bay on the far side.
import * as THREE from "three";
import { boxesGeometry, hash } from "../../kit/gothic.js";
import { MEASURED as M, FOOT } from "./common.js";
import { hex, hexCorners, beam, COS30 } from "./shapes.js";

const T = 0.3; // wall thickness

/** b.matrix for face k of the hexagon of apothem a: local x along the face (to the right as seen from
 * outside), y up, z out along the face's normal (60k deg from +x toward +z), the origin at mid-side. */
function faceMatrix(k, a) {
  const t = (k * Math.PI) / 3, n = new THREE.Vector3(Math.cos(t), 0, Math.sin(t));
  const x = new THREE.Vector3(n.z, 0, -n.x);
  return new THREE.Matrix4().makeBasis(x, new THREE.Vector3(0, 1, 0), n).setPosition(n.clone().multiplyScalar(a));
}

/** The window's columns on a face whose street corner is its right end (s = +1) or its left end (s = -1):
 * [u0, u1, top] in face coordinates, u0 < u1, sorted by u; the column at the corner is the highest. */
function windowColumns(s) {
  const W = M.window, f = s > 0 ? 1 : 0, half = M.chapel.wall * Math.tan(Math.PI / 6), cw = W.width[f] / W.columns[f];
  const cols = [];
  for (let i = 0; i < W.columns[f]; i++) {
    const near = half - i * cw, far = half - (i + 1) * cw, top = W.top - i * W.step;
    cols.push(s > 0 ? [far, near, top] : [-near, -far, top]);
  }
  return cols.sort((p, q) => p[0] - q[0]);
}

export function chapel(b) {
  const C = M.chapel, W = M.window, a = C.wall, half = a * Math.tan(Math.PI / 6);
  for (let k = 0; k < 6; k++) {
    b.matrix = faceMatrix(k, a);
    // the street corner (90 deg) is the left end of face 1 (s = -1) and the right end of face 2 (s = +1)
    const s = k === 1 ? -1 : k === 2 ? 1 : 0;
    let pts;
    if (!s) pts = [[-half, FOOT], [half, FOOT], [half, C.eave], [-half, C.eave]];
    else {
      const cols = windowColumns(s);
      const head = cols.flatMap(([u0, u1, top]) => [[u0, top], [u1, top]]);
      // round the wall, into the window's stepped head and out along its sill
      const ww = W.width[s > 0 ? 1 : 0];
      pts = s > 0
        ? [[-half, FOOT], [half, FOOT], [half, W.sill], [half - ww, W.sill], ...head, [half, C.eave], [-half, C.eave]]
        : [[-half, FOOT], [half, FOOT], [half, C.eave], [-half, C.eave], ...head, [-half + ww, W.sill], [-half, W.sill]];
      // glass a little behind the face, and the white frames: verticals between the columns, and
      // transoms at heights that differ from column to column (deterministic)
      const frames = [], f = W.frame, d = W.depth;
      for (const [u0, u1, top] of cols) {
        frames.push([u0 - f / 2, u0 + f / 2, W.sill, top, -d, 0.02], [u1 - f / 2, u1 + f / 2, W.sill, top, -d, 0.02]);
        frames.push([u0, u1, W.sill - f / 2, W.sill + f / 2, -d, 0.02], [u0, u1, top - f / 2, top + f / 2, -d, 0.02]);
        let y = W.sill;
        for (let r = 0; r < 12; r++) {
          y += W.pane[0] + (W.pane[1] - W.pane[0]) * hash(k, u0, r, 7);
          if (y > top - 0.45) break;
          frames.push([u0, u1, y - f / 2, y + f / 2, -d, 0.02]);
        }
        const g = new THREE.PlaneGeometry(u1 - u0, top - W.sill);
        g.translate((u0 + u1) / 2, (W.sill + top) / 2, -d * 0.6);
        b.add(g, "glass");
      }
      b.add(boxesGeometry(frames), "paint");
    }
    b.slab(new THREE.Shape(pts.map(([u, y]) => new THREE.Vector2(u, y))), 0, 0, 0, T, "paint");
  }
  b.matrix = null;
  // the corner frame where the two glazed faces meet
  const R = a / COS30;
  b.box(-0.09, 0.09, W.sill, W.top, R - 0.2, R + 0.02, "paint");
  // the roof: a low pyramid, a dark edge round it (the thin dark line over the walls), ribs on the hips
  hex(b, C.roof, 0, C.eave, C.apex, "roofPale");
  hex(b, C.roof + 0.03, C.roof + 0.03, C.eave - 0.18, C.eave + 0.02, "iron");
  for (const [x, z] of hexCorners(C.roof)) beam(b, [x, C.eave + 0.05, z], [0, C.apex + 0.05, 0], 0.12, 0.08, "roofPale");
  // a flat ceiling under the eaves' overhang, so the walls' top is closed
  hex(b, C.roof, C.roof, C.eave - 0.2, C.eave - 0.18, "paint");
}

export function spire(b) {
  const S = M.spire, C = M.chapel;
  // a square shaft tapering a little, under a short pointed cap (four sides, square to the frame)
  const h = S.tip - S.cap - (C.apex - 0.3);
  const g = new THREE.CylinderGeometry(S.neck / Math.SQRT2, S.base / Math.SQRT2, h, 4, 1);
  g.rotateY(Math.PI / 4);
  g.translate(0, C.apex - 0.3 + h / 2, 0);
  b.add(g, "shade");
  const cap = new THREE.CylinderGeometry(0.01, S.neck / Math.SQRT2, S.cap, 4, 1);
  cap.rotateY(Math.PI / 4);
  cap.translate(0, S.tip - S.cap / 2, 0);
  b.add(cap, "shade");
  // the cross on its tip
  b.box(-0.03, 0.03, S.tip - 0.1, S.top, -0.03, 0.03, "iron");
  b.box(-S.cross / 2, S.cross / 2, S.top - 0.42, S.top - 0.36, -0.03, 0.03, "iron");
}

export function bay(b) {
  const { x, z, top, door } = M.bay;
  b.box(x[0], x[1], FOOT, top, z[0], z[1], "paint");
  b.box(x[0] - 0.05, x[1], top - 0.15, top + 0.02, z[0] - 0.05, z[1] + 0.05, "iron");
  // a dark timber door at its foot on the street side
  b.box(door[0], door[1], 0, door[2], z[1], z[1] + 0.03, "timber");
}
