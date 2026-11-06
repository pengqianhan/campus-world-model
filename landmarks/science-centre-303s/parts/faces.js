// The faces the photograph shows (parts/common.js, MEASURED.facade; step 5), in the building's frame: the glass of
// the face to the street, 2 cm before its walls; the pale fins on its south-east stretch and the pier at the corner;
// the braces between the last fin and the pier; the glass of the south-east end face and its pale spandrel bands.
import { MEASURED, at, rect } from "./common.js";
import { hexahedron, prism } from "./shapes.js";

const M = MEASURED, A = M.facade, GLASS = "glassPale", PALE = "claddingPale";

/** A bar of the braces from (u0, y0) to (u1, y1), `width` across and `depth` deep, standing out of the face from w0. */
function bar(b, [u0, y0], [u1, y1], w0, width, depth) {
  const L = Math.hypot(u1 - u0, y1 - y0), nu = (-(y1 - y0) / L) * width / 2, ny = ((u1 - u0) / L) * width / 2;
  const q = [[u0 - nu, y0 - ny], [u1 - nu, y1 - ny], [u1 + nu, y1 + ny], [u0 + nu, y0 + ny]];
  const P = [...q.map(([u, y]) => { const [x, z] = at(u, w0); return [x, y, z]; }),
             ...q.map(([u, y]) => { const [x, z] = at(u, w0 + depth); return [x, y, z]; })];
  hexahedron(b, P, PALE);
}

export function faces(b) {
  const P = M.parapet, E = M.se, F = M.face, S = A.storey;
  // the glass of the face to the street: before the parapet wall to u 37.7, before the south-east part beyond it
  prism(b, rect([P.u[0] + 0.01, P.u[1] - 0.01], [P.w[1], P.w[1] + 0.02]), A.glassFrom, P.top - 0.15, GLASS);
  prism(b, rect([P.u[1] + 0.01, A.pier.u[0] - 0.01], [F, F + 0.02]), A.glassFrom, E.parapet.top - 0.2, GLASS);
  // the fins and the pier at the corner, out of the glass
  for (const u of A.fins) prism(b, rect([u - A.fin.width / 2, u + A.fin.width / 2], [F + 0.03, F + A.fin.depth]), A.glassFrom, E.parapet.top, PALE);
  prism(b, rect(A.pier.u, [F - 0.6, F + A.fin.depth]), A.glassFrom, A.pier.top, PALE);
  // the braces between the last fin and the pier: a zigzag, a node every half period on each side in turn, down from
  // the roof
  const [ua, ub] = A.braces.u, half = A.braces.period / 2;
  const nodes = [];
  for (let y = M.roof, i = 0; y > A.glassFrom; y -= half, i++) nodes.push([i % 2 ? ua : ub, y]);
  for (let i = 0; i + 1 < nodes.length; i++) bar(b, nodes[i], nodes[i + 1], F + 0.03, A.braces.width, A.braces.depth);
  // the south-east end face: its glass 2 cm before it, and a pale spandrel band at each storey before that
  const end = E.u[1], [w0, w1] = [E.w + 0.01, A.pier.u[0] < end ? F - 0.6 : F];
  prism(b, [at(end, w0), at(end + 0.02, w0), at(end + 0.02, w1), at(end, w1)], A.glassFrom, E.parapet.top - 0.2, GLASS);
  for (let k = 1; k < S.count; k++) {
    const y = S.first + k * S.height;
    prism(b, [at(end + 0.02, w0), at(end + 0.06, w0), at(end + 0.06, w1), at(end + 0.02, w1)], y - S.band, y, PALE);
  }
}
