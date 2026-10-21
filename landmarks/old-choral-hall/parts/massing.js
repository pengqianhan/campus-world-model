// Everything but the south-west range, at the LiDAR's sizes (parts/common.js): the gabled ranges behind the
// street front, the north-east wing, the blocks behind and the low block in the recess. Plain walls and
// roofs: no photograph shows these faces as they are since the works. The baseline of round 1.
import * as THREE from "three";
import { RANGES, NE, BACK, FRONT } from "./common.js";

const WALL = "render", ROOF = "roofPale";

/**
 * A block from x0..x1, z0..z1 with walls to `eave` and a gabled roof to `ridge`, its ridge along z at x = at
 * (along "z") or along x at z = at (along "x"). The gable ends are walls.
 */
export function gable(b, x0, x1, z0, z1, eave, ridge, along, at, base = -0.6) {
  b.box(x0, x1, base, eave, z0, z1, WALL);
  const pos = [];
  const tri = (a, c, d) => pos.push(...a, ...c, ...d);
  if (along === "z") {
    const A = [x0, eave], R = [at, ridge], B = [x1, eave];
    for (const [z, s] of [[z0, -1], [z1, 1]]) {
      const p = (q) => [q[0], q[1], z];
      if (s > 0) tri(p(A), p(B), p(R)); else tri(p(A), p(R), p(B));
    }
    const q = (pt, z) => [pt[0], pt[1], z];
    tri(q(A, z0), q(A, z1), q(R, z1)); tri(q(A, z0), q(R, z1), q(R, z0));
    tri(q(R, z0), q(R, z1), q(B, z1)); tri(q(R, z0), q(B, z1), q(B, z0));
  } else {
    const A = [z0, eave], R = [at, ridge], B = [z1, eave];
    for (const [x, s] of [[x0, -1], [x1, 1]]) {
      const p = (q) => [x, q[1], q[0]];
      if (s > 0) tri(p(A), p(R), p(B)); else tri(p(A), p(B), p(R));
    }
    const q = (pt, x) => [x, pt[1], pt[0]];
    tri(q(A, x0), q(R, x1), q(A, x1)); tri(q(A, x0), q(R, x0), q(R, x1));
    tri(q(R, x0), q(B, x1), q(R, x1)); tri(q(R, x0), q(B, x0), q(B, x1));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  b.add(g, ROOF);
}

export function massing(b) {
  const { middle: m, right: r } = RANGES;
  gable(b, m.x[0], m.x[1], m.z[0], m.z[1], m.eave, m.ridge, "z", m.ridgeX);
  gable(b, r.x[0], r.x[1], r.z[0], r.z[1], r.eave, r.ridge, "z", r.ridgeX);
  for (const g of NE.gables) gable(b, NE.x[0], NE.x[1], g.z[0], g.z[1], g.eave, g.ridge, "x", g.ridgeZ);
  for (const l of NE.links) b.box(NE.x[0], NE.x[1], -0.6, l.top, l.z[0], l.z[1], WALL);
  const { right: br, middle: bm, left: bl } = BACK;
  gable(b, br.x[0], br.x[1], br.z[0], br.z[1], br.eave, br.ridge, "x", br.ridgeZ);
  gable(b, bm.x[0], bm.x[1], bm.z[0], bm.z[1], bm.eave, bm.ridge, "z", bm.ridgeX);
  b.box(bl.x[0], bl.x[1], -0.6, bl.top, bl.z[0], bl.z[1], WALL);
  const p = FRONT.porch;
  b.box(p.x[0], p.x[1], -0.6, p.top, p.z[0], p.z[1], WALL);
}
