// The chapel (parts/common.js MEASURED.chapel, .spire, .bay): hexagonal walls, a low hexagonal pyramid
// roof with a rib on each hip (the aerial shows them), the slender spire on its apex, and the bay on its
// far side. Rough: plain walls, until the references show what they are made of.
import { MEASURED as M, FOOT } from "./common.js";
import { hex, hexCorners, beam } from "./shapes.js";

export function chapel(b) {
  const C = M.chapel;
  hex(b, C.wall, C.wall, FOOT, C.eave, "smooth");
  hex(b, C.roof, 0, C.eave, C.apex, "roof");
  for (const [x, z] of hexCorners(C.roof)) beam(b, [x, C.eave + 0.04, z], [0, C.apex + 0.04, 0], 0.14, 0.1, "roof");
}

export function spire(b) {
  const S = M.spire, C = M.chapel;
  hex(b, S.base / 2, 0.04, C.apex - 0.3, S.tip, "iron");
}

export function bay(b) {
  const { x, z, top } = M.bay;
  b.box(x[0], x[1], FOOT, top, z[0], z[1], "smooth");
}
