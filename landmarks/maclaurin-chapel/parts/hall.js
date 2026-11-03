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

/** The fascia's width round a flat roof. */
const E = 0.06;

/** A flat roof slab over [x0, x1] x [z0, z1] at height `top`: the roof, its fascia and the dark line. The fascia
 * runs round the roof's four edges ([x0, x1, z0, z1] boxes in plan), or only along the pieces `edges` gives: where
 * the next roof runs on at its height or the higher middle room rises, a full fascia there stood inside the
 * neighbour, its faces in the neighbour's (hall() closes the hollow under such an edge below the slab). `from`
 * starts the slab that much before x0, under its neighbour's edge. */
function flatRoof(b, x0, x1, z0, z1, top, edges = null, from = 0) {
  b.box(x0 - from, x1, top - 0.06, top - 0.02, z0, z1, "roofGreen");
  const f = edges ?? [[x0 - E, x1 + E, z1, z1 + E], [x0 - E, x1 + E, z0 - E, z0], [x0 - E, x0, z0, z1], [x1, x1 + E, z0, z1]];
  b.add(boxesGeometry(f.map(([a, c, p, q]) => [a, c, top - FASCIA, top - 0.02, p, q])), "paint");
  b.add(boxesGeometry(f.map(([a, c, p, q]) => [a, c, top - 0.02, top + 0.02, p, q])), "iron");
}

/** Glazing in a wall facing +z (s = 1) or -z (s = -1) at z, over [x0, x1] and [y0, y1], with white frames (the
 * sill's frame from y0 up, `onFloor`, where a floor stands at y0: below it, its face lay in the floor's). */
function glazing(b, x0, x1, y0, y1, z, s, bay = 1.2, onFloor = false) {
  b.box(x0, x1, y0, y1, z - 0.05 * s, z - 0.03 * s, "glass");
  const n = Math.max(1, Math.round((x1 - x0) / bay)), f = [], w = 0.08;
  for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n; f.push([x - w / 2, x + w / 2, y0, y1, Math.min(z, z + 0.04 * s), Math.max(z, z + 0.04 * s)]); }
  f.push([x0, x1, onFloor ? y0 : y0 - w / 2, y0 + w / 2, Math.min(z, z + 0.04 * s), Math.max(z, z + 0.04 * s)]);
  f.push([x0, x1, y1 - w / 2, y1 + w / 2, Math.min(z, z + 0.04 * s), Math.max(z, z + 0.04 * s)]);
  b.add(boxesGeometry(f), "paint");
}

export function hall(b) {
  const H = M.hall, R = H.raised, mid = H.middle;
  const near = H.nearEnd, far = H.farEnd;
  // the end rooms: walls under the flat roof
  b.box(near.x[0], near.x[1], FOOT, H.top - FASCIA, near.z[0] + 0.2, H.porch.z, "paint");
  b.box(far.x[0] + 0.1, far.x[1] - 0.2, FOOT, H.farTop - FASCIA, far.z[0] + 0.2, far.z[1] - 0.2, "paint");
  // the middle room, rising to the gable
  b.box(mid.x[0], mid.x[1], FOOT, R.eave - 0.15, mid.z[0], mid.z[1], "paint");
  b.box(R.x[0], R.x[1], R.eave - 0.3, R.eave, R.z[0], R.z[1], "paint");
  gable(b, R.x[0], R.x[1], R.z[0], R.z[1], R.eave, R.ridge, R.ridgeZ, "roofGreen");
  // the flat roofs: over the near end, the walk-ways and the far end (a little lower), the fascia along their outer
  // edges and along the walk-ways' ends over the lower far end; none where a roof runs on into the next at its
  // height or meets the middle room. Under the walk-ways' ends the near end's edge is closed below the slab,
  // white, from the fascia's foot to the slab's underside, with no dark line: one flat roof runs on over it (on
  // main the full fascias there, their faces in the slabs', made a dark band 12 cm wide across the roof, seen
  // from above). The far end's edge runs its whole length with its fascia and dark line, as before, 1 cm out from
  // its slab, which starts 1 cm under the walk-ways' edge, and it is closed below the slab to the walk-ways'
  // fascias; so no hollow under a roof shows and none of their faces lies in a slab's
  const [nx0, nx1] = [near.x[0], mid.x[0]], [nz0, nz1] = near.z, [wa, wb] = H.walks.z, [mx0, mx1] = mid.x;
  flatRoof(b, nx0, nx1, nz0, nz1, H.top, [[nx0 - E, nx1, nz1, nz1 + E], [nx0 - E, nx1 + E, nz0 - E, nz0], [nx0 - E, nx0, nz0, nz1],
    [nx1, nx1 + E, nz0, wa[0]]]);
  flatRoof(b, mx0, mx1, wa[0], wa[1], H.top, [[mx0, mx1 + E, wa[0] - E, wa[0]], [mx1, mx1 + E, wa[0], wa[1]]]);
  flatRoof(b, mx0, mx1, wb[0], wb[1], H.top, [[mx0, mx1 + E, wb[1], wb[1] + E], [mx1, mx1 + E, wb[0], wb[1]]]);
  const [fx0, fx1] = far.x, [fz0, fz1] = far.z;
  // (the far end's slab starts 1 cm under the walk-ways' edge, and its fascia 1 cm further out)
  flatRoof(b, fx0, fx1, fz0, fz1, H.farTop, [[fx0 - E - 0.01, fx1 + E, fz1, fz1 + E], [fx0 + E, fx1 + E, fz0 - E, fz0], [fx1, fx1 + E, fz0, fz1],
    [fx0 - E - 0.01, fx0 - 0.01, fz0 - E, fz1]], 0.01);
  b.add(boxesGeometry([
    [nx1, nx1 + E, H.top - FASCIA, H.top - 0.06, wa[0], wa[1]], [nx1, nx1 + E, H.top - FASCIA, H.top - 0.06, wb[0], nz1],
    [fx0 - 0.01, fx0 + E, H.farTop - FASCIA, H.farTop - 0.07, fz0 - E, wa[1]], [fx0 - 0.01, fx0 + E, H.farTop - FASCIA, H.farTop - 0.07, wb[0], wb[1] + E],
  ]), "paint");
  // the street side: the entrance in the near end, a glazed screen set back under the flat roof (the LiDAR
  // sees the ground under the roof's front metre), the roof's front fascia there dark timber, not white,
  // posts at the porch's corners, its floor and steps down to the path; glazed walls behind the walk-way
  // and posts under its roof; windows in the far end
  const P = H.porch, zf = near.z[1] - 0.1;
  glazing(b, near.x[0] + 0.3, near.x[1] - 0.2, P.floor, H.top - FASCIA - 0.05, P.z, 1, 0.9, true);
  b.box(near.x[0] - 0.06, near.x[1], H.top - FASCIA, H.top - 0.02, near.z[1] + 0.06, near.z[1] + 0.1, "timber");
  b.add(boxesGeometry([[near.x[0] + 0.1, near.x[0] + 0.22, P.floor, H.top - FASCIA, zf - 0.2, zf - 0.08],
    [near.x[1] - 0.12, near.x[1], P.floor, H.top - FASCIA, zf - 0.2, zf - 0.08]]), "paint");
  b.box(near.x[0], near.x[1], FOOT, P.floor, P.z, zf, "dressed");
  for (let i = 0; i < P.steps; i++) {
    const h = (P.floor * (P.steps - i)) / (P.steps + 1), z0 = zf + i * P.tread;
    b.box(near.x[0] + 0.5, near.x[1] - 0.3, FOOT, h, z0, z0 + P.tread, "dressed");
  }
  glazing(b, mid.x[0] + 0.4, mid.x[1] - 0.4, 0.4, H.top - 0.5, mid.z[1], 1, 1.5);
  const posts = [];
  for (let i = 0; i <= 4; i++) { const x = mid.x[0] + 0.3 + ((mid.x[1] - mid.x[0] - 0.6) * i) / 4; posts.push([x - 0.06, x + 0.06, FOOT, H.top - FASCIA, H.walks.z[1][1] - 0.25, H.walks.z[1][1] - 0.13]); }
  b.add(boxesGeometry(posts), "paint");
  glazing(b, far.x[0] + 1.0, far.x[1] - 1.0, 1.0, H.farTop - FASCIA - 0.3, far.z[1] - 0.2, 1, 1.0);
}
