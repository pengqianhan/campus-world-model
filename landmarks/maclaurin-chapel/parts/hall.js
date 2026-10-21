// The hall behind the chapel (parts/common.js MEASURED.hall): white walls; two end rooms and the
// walk-ways along the middle under one flat roof, edged by a deep white fascia with a thin dark line on
// top; the middle room's walls rising to a very low gable. On the street side (the photographs): the
// glazed entrance at the near end with its steps, glazed walls behind the walk-way and slender white
// posts under its roof, and a band of white-framed windows in the far end. The back and the far end's
// other faces are in no photograph: plain walls.
import { boxesGeometry } from "../../kit/gothic.js";
import { MEASURED as M, FOOT } from "./common.js";
import { gable } from "./shapes.js";

const FASCIA = 0.42; // depth of the white fascia round the flat roofs

/** A flat roof slab over [x0, x1] x [z0, z1] at height `top`: the roof, its fascia and the dark line. */
function flatRoof(b, x0, x1, z0, z1, top) {
  b.box(x0, x1, top - 0.06, top - 0.02, z0, z1, "roofPale");
  const f = [], e = 0.06;
  f.push([x0 - e, x1 + e, top - FASCIA, top - 0.02, z1, z1 + e], [x0 - e, x1 + e, top - FASCIA, top - 0.02, z0 - e, z0]);
  f.push([x0 - e, x0, top - FASCIA, top - 0.02, z0, z1], [x1, x1 + e, top - FASCIA, top - 0.02, z0, z1]);
  b.add(boxesGeometry(f), "paint");
  b.add(boxesGeometry([[x0 - e, x1 + e, top - 0.02, top + 0.02, z1, z1 + e], [x0 - e, x1 + e, top - 0.02, top + 0.02, z0 - e, z0],
    [x0 - e, x0, top - 0.02, top + 0.02, z0, z1], [x1, x1 + e, top - 0.02, top + 0.02, z0, z1]]), "iron");
}

/** Glazing in a wall facing +z (s = 1) or -z (s = -1) at z, over [x0, x1] and [y0, y1], with white frames. */
function glazing(b, x0, x1, y0, y1, z, s, bay = 1.2) {
  b.box(x0, x1, y0, y1, z - 0.05 * s, z - 0.03 * s, "glass");
  const n = Math.max(1, Math.round((x1 - x0) / bay)), f = [], w = 0.08;
  for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n; f.push([x - w / 2, x + w / 2, y0, y1, Math.min(z, z + 0.04 * s), Math.max(z, z + 0.04 * s)]); }
  f.push([x0, x1, y0 - w / 2, y0 + w / 2, Math.min(z, z + 0.04 * s), Math.max(z, z + 0.04 * s)]);
  f.push([x0, x1, y1 - w / 2, y1 + w / 2, Math.min(z, z + 0.04 * s), Math.max(z, z + 0.04 * s)]);
  b.add(boxesGeometry(f), "paint");
}

export function hall(b) {
  const H = M.hall, R = H.raised, mid = H.middle;
  const near = H.nearEnd, far = H.farEnd;
  // the end rooms: walls under the flat roof
  b.box(near.x[0], near.x[1], FOOT, H.top - FASCIA, near.z[0] + 0.2, near.z[1] - 0.2, "paint");
  b.box(far.x[0] + 0.1, far.x[1] - 0.2, FOOT, H.farTop - FASCIA, far.z[0] + 0.2, far.z[1] - 0.2, "paint");
  // the middle room, rising to the gable
  b.box(mid.x[0], mid.x[1], FOOT, R.eave - 0.15, mid.z[0], mid.z[1], "paint");
  b.box(R.x[0], R.x[1], R.eave - 0.3, R.eave, R.z[0], R.z[1], "paint");
  gable(b, R.x[0], R.x[1], R.z[0], R.z[1], R.eave, R.ridge, R.ridgeZ, "roofPale");
  // the flat roofs: over the near end, the walk-ways and the far end (a little lower)
  flatRoof(b, near.x[0], mid.x[0], near.z[0], near.z[1], H.top);
  for (const [z0, z1] of H.walks.z) flatRoof(b, mid.x[0], mid.x[1], z0, z1, H.top);
  flatRoof(b, far.x[0], far.x[1], far.z[0], far.z[1], H.farTop);
  // the street side: the glazed entrance in the near end, with a dark timber fascia over its doors and
  // steps down to the path; glazed walls behind the walk-way and posts under its roof; windows in the far end
  const zf = near.z[1] - 0.2;
  glazing(b, near.x[0] + 0.3, near.x[1] - 0.3, 0.45, H.top - FASCIA - 0.25, zf, 1, 0.9);
  b.box(near.x[0] + 0.3, near.x[1] - 0.3, H.top - FASCIA - 0.25, H.top - FASCIA, zf, zf + 0.06, "timber");
  for (let i = 0; i < 3; i++) b.box(near.x[0] + 0.6, near.x[1] - 0.6, FOOT, 0.45 - 0.15 * i, zf, zf + 0.4 + 0.35 * i, "dressed");
  glazing(b, mid.x[0] + 0.4, mid.x[1] - 0.4, 0.4, H.top - 0.5, mid.z[1], 1, 1.5);
  const posts = [];
  for (let i = 0; i <= 4; i++) { const x = mid.x[0] + 0.3 + ((mid.x[1] - mid.x[0] - 0.6) * i) / 4; posts.push([x - 0.06, x + 0.06, FOOT, H.top - FASCIA, H.walks.z[1][1] - 0.25, H.walks.z[1][1] - 0.13]); }
  b.add(boxesGeometry(posts), "paint");
  glazing(b, far.x[0] + 1.0, far.x[1] - 1.0, 1.0, H.farTop - FASCIA - 0.3, far.z[1] - 0.2, 1, 1.0);
}
