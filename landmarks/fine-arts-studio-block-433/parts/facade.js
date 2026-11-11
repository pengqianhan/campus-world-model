// Fine Arts Studio Block 433's faces where the photograph sees them: the red ground storey on the north-west face and
// the west-south-west end; the north-west face's glazing with its mullions, floor bands and coloured panels; on the
// end the grey bay with its doors, the windows in the yellow north of it, the two balconies, the outside stair and
// the posts under them. Sizes from common.js, every one estimated through the photograph's fitted camera unless the
// LiDAR gives it.
import { BALCONY, FACE, FOOT, PANELS, STAIR, VAULT, WALL, Y, at, plan, vaultTop } from "./common.js";
import { prism, tris } from "./shapes.js";

const RED = "renderRed", YELLOW = "claddingYellow", GREY = "claddingPale", GLASS = "glassPale", STEEL = "steelBlue";
const W = WALL.w, E = WALL.west;
const COLOUR = { red: RED, yellow: YELLOW, blue: STEEL };

/** A box on the north-west face, from d0 to d1 out of it, over [u0, u1] and the elevations [z0, z1]. */
function onFace(b, d0, d1, [u0, u1], [z0, z1], material) {
  prism(b, plan([[u0, W + d0], [u1, W + d0], [u1, W + d1], [u0, W + d1]]), Y(z0), Y(z1), material);
}
/** A box on the west-south-west end, from d0 to d1 out of it, over [w0, w1] and the elevations [z0, z1]. */
function onEnd(b, d0, d1, [w0, w1], [z0, z1], material) {
  prism(b, plan([[E - d0, w0], [E - d1, w0], [E - d1, w1], [E - d0, w1]]), Y(z0), Y(z1), material);
}

/** The red ground storey, 2 to 6 cm out of the walls, on the north-west face and round the west corner on the end. */
export function base(b) {
  const top = Y(FACE.base);
  prism(b, plan([[E - 0.06, W + 0.02], [WALL.east, W + 0.02], [WALL.east, W + 0.06], [E - 0.06, W + 0.06]]), FOOT, top, RED);
  prism(b, plan([[E - 0.02, -W], [E - 0.06, -W], [E - 0.06, W + 0.02], [E - 0.02, W + 0.02]]), FOOT, top, RED);
}

/** The north-west face's glazing over the ground storey: the glass 2 to 4 cm out, mullions every 1.53 m 0 to 10 cm
 * out, a band at each floor and the coloured panels 4 to 6 cm out; the glass 1 cm short of the mullions' ends, so that
 * no face of it lies in one plane with theirs (the landmark tests' faces check). */
export function glazing(b) {
  const [u0, u1] = FACE.glazing, z0 = FACE.base, z1 = vaultTop(W) - VAULT.t - 0.02;
  onFace(b, 0.02, 0.04, [u0, u1], [z0 + 0.01, z1 - 0.01], GLASS);
  const n = Math.round((u1 - u0) / 1.53);
  for (let i = 0; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n;
    onFace(b, 0, 0.1, [u - 0.05, u + 0.05], [z0, z1], STEEL);
  }
  for (const f of FACE.floors) onFace(b, 0.04, 0.12, [u0, u1], [f - 0.35, f], STEEL);
  for (const p of PANELS) onFace(b, 0.04, 0.06, [p.u - 0.7, p.u + 0.7], p.z, COLOUR[p.colour]);
}

/** The west-south-west end: the grey bay 2 to 4 cm out, a door to each balcony in it; in the yellow north of it the
 * windows' glass 2 to 4 cm out and the small square windows. */
export function end(b) {
  const [w0, w1] = FACE.bay, topAt = (w) => vaultTop(w) - VAULT.t - 0.02;
  const ws = Array.from({ length: 9 }, (_, i) => w0 + ((w1 - w0) * i) / 8);
  // The bay's face, from the ground storey's top to the vault's underside: a fan of triangles under the curve.
  const lo = Y(FACE.base), list = [];
  for (let i = 0; i < 8; i++) {
    const a = ws[i], c = ws[i + 1], p = (w, y) => { const [xx, z] = at(E - 0.03, w); return [xx, y, z]; };
    list.push([p(a, lo), p(c, lo), p(c, Y(topAt(c)))], [p(a, lo), p(c, Y(topAt(c))), p(a, Y(topAt(a)))]);
  }
  tris(b, list, GREY, ([px, pz]) => [px + 1, pz]);
  for (const f of BALCONY.floors) onEnd(b, 0.03, 0.06, FACE.doors.w, [f, f + FACE.doors.height], RED);
  for (const [z0, z1] of FACE.windows.rows) {
    onEnd(b, 0.02, 0.04, FACE.windows.w, [z0, z1], GLASS);
    const s = FACE.squares.size;
    for (const w of FACE.squares.w) onEnd(b, 0.02, 0.04, [w - s / 2, w + s / 2], [z1 - s, z1], GLASS);
  }
}

/** The two balconies: a floor 0.3 m thick from the wall out to a front bowed to u -27.6, and a railing 0.9 m high
 * round its front. */
export function balconies(b) {
  const [w0, w1] = BALCONY.w, [edge, mid] = BALCONY.front, half = (w1 - w0) / 2, c = (w0 + w1) / 2;
  const front = (w) => mid + (edge - mid) * ((w - c) / half) ** 2;
  const ws = Array.from({ length: 9 }, (_, i) => w0 + ((w1 - w0) * i) / 8);
  const floor = [[E, w1], [E, w0], ...ws.map((w) => [front(w), w])];
  for (const f of BALCONY.floors) {
    prism(b, plan(floor), Y(f - BALCONY.t), Y(f), STEEL);
    const rail = ws.map((w) => [front(w) + 0.03, w]), inner = ws.map((w) => [front(w) + 0.08, w]);
    prism(b, plan([...rail, ...inner.reverse()]), Y(f), Y(f + BALCONY.rail), STEEL);
  }
}

/** The outside stair: each flight a sloped slab 0.2 m thick with a rail along its outer side, the landings, and the
 * posts from the ground to the upper balcony. */
export function stair(b) {
  const h = STAIR.width / 2;
  for (const { u, from, to } of STAIR.flights) {
    const q = (w, z, du, dz) => { const [x, zz] = at(u + du, w); return [x, Y(z) + dz, zz]; };
    const top = [q(from[0], from[1], -h, 0), q(from[0], from[1], h, 0), q(to[0], to[1], h, 0), q(to[0], to[1], -h, 0)];
    const bot = top.map(([x, y, z]) => [x, y - 0.2, z]);
    tris(b, [[top[0], top[1], top[2]], [top[0], top[2], top[3]]], STEEL, "up");
    tris(b, [[bot[0], bot[1], bot[2]], [bot[0], bot[2], bot[3]]], STEEL, "down");
    for (const [d, way] of [[-h, 1], [h, -1]]) {
      const rail = [q(from[0], from[1], d, 1.0), q(to[0], to[1], d, 1.0), q(to[0], to[1], d, 0), q(from[0], from[1], d, 0)];
      const list = [[rail[0], rail[1], rail[2]], [rail[0], rail[2], rail[3]]];
      tris(b, list, STEEL, ([x, z]) => [x + way, z]);
      tris(b, list, STEEL, ([x, z]) => [x - way, z]);
    }
  }
  for (const l of STAIR.landings) {
    const [u0, u1] = l.u, [w0, w1] = l.w;
    prism(b, plan([[u0, w0], [u1, w0], [u1, w1], [u0, w1]]), Y(l.z - 0.2), Y(l.z), STEEL);
    prism(b, plan([[u0, w0], [u1, w0], [u1, w0 + 0.05], [u0, w0 + 0.05]]), Y(l.z), Y(l.z + 1.0), STEEL);
  }
  for (const [u, w] of STAIR.posts) prism(b, plan([[u - 0.1, w - 0.1], [u + 0.1, w - 0.1], [u + 0.1, w + 0.1], [u - 0.1, w + 0.1]]), FOOT, Y(BALCONY.floors[1] - BALCONY.t), STEEL);
}
