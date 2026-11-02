// The shared model of every measured massing (landmarks/MASSING.md): one plain building as blocks and
// roofs at the heights the LiDAR measures, from its data file in buildings/<id>.json, which
// landmarks/pipeline/tools/massing.py writes. Nobody draws it: walls, storeys and windows come by the
// street look's rules. It is built with the site's own MeshBuilder, so that its walls carry what the
// blocks' walls carry (storeys, bays and the street look's facade data) and take the blocks' own
// materials on the site: the map's palette on the map, the facades drawn by rule in the walker views.
// A layer's walls are drawn only where no other layer of the building hides them (`cut`), so that a
// building of many layers side by side has no walls inside it for a renderer to rasterise for nothing.
// The walls as they were before the cut still cast the shadows, from a mesh that only the shadow map
// draws (`shadow`, on SHADOW_ONLY_LAYER): the shadow map is drawn from the faces turned away from the
// sun, and the walls inside the building were such faces, without which the shadow at the shaded foot
// of a wall lets light through in patches.
//
// build(materials, only, data, style) returns a Group of three meshes, `walls`, `roof` and `shadow`
// (positions only, the walls before the cut, casting the shadows the walls do not), in the
// building's frame: metres east of the building's centre (place.centre) along x, up along y from
// ground.zero, and south along z. `style` gives the blocks' tints, rim and bay, and the facade the
// walker views draw the building's walls with (src/scene/CampusScene.ts); without it the model has
// the same shape in plain white, which is all the top-view check reads (massing_triangles.mjs).
import { BufferAttribute, BufferGeometry, Group, Mesh, MeshBasicMaterial } from "three";
import { MeshBuilder } from "../../src/scene/geometry.ts";
import { SHADOW_ONLY_LAYER } from "../../src/scene/layers.ts";

const WHITE = [1, 1, 1];
const DEFAULT_STYLE = { bay: 3.2, rim: 0.9, tints: { roof: WHITE, wall: WHITE, rim: WHITE, plinth: WHITE } };
/** Metres in from a flat roof's edge, and out from it, where a higher layer means no rim there. */
const RIM_IN = 0.6;
const RIM_OUT = 0.3;
/** Metres: a layer on a roof lower than this has no storeys of its own (massing.py STOREY_MIN). */
const STOREY_MIN = 2.4;
/** Metres between the points where a rim is tested. */
const RIM_STEP = 1;

export function build(materials, only, data, style = DEFAULT_STYLE) {
  const [cx, cy] = data.place.centre;
  const tints = style.tints ?? DEFAULT_STYLE.tints;
  const bay = style.bay ?? DEFAULT_STYLE.bay;
  const rimHeight = style.rim ?? DEFAULT_STYLE.rim;
  const local = (ring) => ring.map(([e, n]) => [e - cx, n - cy]);
  const flat = (ring) => ring.flatMap(([x, y]) => [x * 10, y * 10]);
  const layers = data.layers.map((l) => ({ ...l, local: l.rings.map(local) }));
  const mb = new MeshBuilder(true, true, true);
  // Each layer's walls are drawn only where no other layer of the building hides them (see `hidden`).
  const solids = layers.map(solid);
  // The walls' triangles as they were before the cut, for the shadows: `toShadow` adds those added since
  // the last call, `drawnOnly` passes over the ones drawn in their place.
  const uncut = [];
  let seen = 0;
  const toShadow = () => {
    for (let i = seen; i < mb.indices.length; i++) uncut.push(mb.indices[i]);
    seen = mb.indices.length;
  };
  const drawnOnly = () => (seen = mb.indices.length);

  layers.forEach((l, k) => {
    const hides = (a, b, n, from) => hidden(solids, k, a, b, n, from);
    const rings = l.local.map(flat);
    // Windows up to the top of the last storey, but not below the foot of the walls (a layer that
    // stands on a taller one can start above its own storeys); none on a layer on a roof that is lower
    // than a storey. Within 1 cm of the wall's top, the storeys go to the top.
    let textured = Math.max(l.y0, Math.min(l.wall, l.storey * l.storeys));
    if (l.y0 > 0 && l.wall - l.y0 < STOREY_MIN) textured = l.y0;
    if (l.wall - textured <= 0.01) textured = l.wall;
    if (style.facade) {
      const [ax, ay] = style.facade.anchor;
      mb.facade = { ...style.facade, storey: l.storey, ground: l.storey, top: textured, base: 0, anchor: [ax - cx, ay - cy] };
    }
    const flatRoof = l.roof === "flat";
    const capped = flatRoof && !l.overhang;
    const plain = l.wall > textured + 0.01;
    // Windows in each whole storey, a plain band above the top one; the ground storey a tone darker.
    const plinth = l.y0 < 0 ? { top: l.storey, color: tints.plinth } : undefined;
    const start = mb.indices.length;
    if (textured > l.y0 + 0.01) mb.extrude(rings, l.y0, textured, tints.roof, tints.wall, capped && !plain, { storey: l.storey, bay, roofGroup: true, plinth });
    if (plain) mb.extrude(rings, textured, l.wall, tints.roof, tints.wall, capped, { roofGroup: true });
    toShadow();
    cut(mb, start, hides);
    drawnOnly();

    const outer = l.local[0];
    // The layers whose roof is as high as this one or higher: where one meets this edge, no rim.
    const higher = layers.filter((h, j) => j !== k && (h.eave ?? h.wall) >= (l.eave ?? l.wall) - 0.3).map((h) => h.local[0]);
    if (flatRoof) {
      // A flat roof that overhangs its walls is a slab round them; the rim stands on its edge.
      const edge = l.overhang ? outset(outer, l.eaves ?? l.overhang) : outer;
      if (l.overhang) mb.extrude([flat(edge)], l.wall, l.eave, tints.roof, tints.wall, true, { roofGroup: true, bottom: true });
      // Tested from the outline in: the slab's edge stands the overhang out from it.
      for (const ring of l.overhang ? [edge] : l.local) rim(mb, ring, higher, l.eave, l.eave + rimHeight, tints.rim, RIM_IN + l.overhang);
    } else {
      // A sloping roof is the lowest of its measured planes at each point: each plane is drawn where
      // it is the lowest, over the outline and the eaves round it. The walls rise to it.
      const planes = l.planes;
      const height = (x, y) => Math.min(...planes.map(([gx, gy, z0]) => z0 + gx * x + gy * y));
      toShadow();
      for (const ring of l.local) wallsUp(mb, ring, planes, height, l.wall, tints.wall, hides, toShadow, drawnOnly);
      const edge = l.overhang ? outset(outer, l.eaves ?? l.overhang) : outer;
      planes.forEach(([gx, gy, z0], i) => {
        let region = edge;
        planes.forEach(([hx, hy, h0], j) => {
          if (j !== i) region = clip(region, gx - hx, gy - hy, z0 - h0);
        });
        if (region.length >= 3) mb.facet(region.map(([x, y]) => [x, z0 + gx * x + gy * y, y]), tints.roof);
      });
    }
  });

  toShadow();
  const g = mb.build();
  const group = new Group();
  const roles = [materials.walls ?? new MeshBasicMaterial(), materials.roof ?? new MeshBasicMaterial()];
  g.groups.forEach((part, i) => {
    const one = new BufferGeometry();
    for (const [name, a] of Object.entries(g.attributes)) one.setAttribute(name, a);
    one.setIndex(new BufferAttribute(g.index.array.slice(part.start, part.start + part.count), 1));
    const mesh = new Mesh(one, roles[part.materialIndex ?? i]);
    mesh.name = part.materialIndex === 1 ? "roof" : "walls";
    // The walls' shadows come from `shadow`, below.
    mesh.castShadow = mesh.name === "roof";
    mesh.receiveShadow = true;
    group.add(mesh);
  });
  // The walls before the cut, positions only, sharing the builder's: what the shadow map draws.
  const before = new BufferGeometry();
  before.setAttribute("position", g.attributes.position);
  before.setIndex(uncut);
  const shadow = new Mesh(before, materials.shadow ?? new MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  shadow.name = "shadow";
  shadow.castShadow = true;
  shadow.receiveShadow = false;
  shadow.layers.set(SHADOW_ONLY_LAYER);
  group.add(shadow);
  return group;
}

/** The part of a ring where a x + b y + c <= 0 (Sutherland-Hodgman against one line). */
function clip(ring, a, b, c) {
  const out = [];
  const f = ([x, y]) => a * x + b * y + c;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    const fp = f(p);
    const fq = f(q);
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
      const t = fp / (fp - fq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

/**
 * The walls of a ring from the lowest edge of a sloping roof (`from`) up to the roof: the ends of a
 * gable, and the side of a mono-pitch. Each wall is cut where another plane of the roof takes over.
 */
function wallsUp(mb, ring, planes, height, from, color, hides, toShadow, drawnOnly) {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    // Out of the ring: to the right of the direction of travel, as `extrude` faces a wall.
    const n = len > 1e-9 ? [(b[1] - a[1]) / len, -(b[0] - a[0]) / len] : [0, 0];
    const cuts = [0, 1];
    for (let p = 0; p < planes.length; p++) {
      for (let q = p + 1; q < planes.length; q++) {
        const d = ([x, y]) => planes[p][2] - planes[q][2] + (planes[p][0] - planes[q][0]) * x + (planes[p][1] - planes[q][1]) * y;
        const da = d(a);
        const db = d(b);
        if ((da < 0 && db > 0) || (da > 0 && db < 0)) cuts.push(da / (da - db));
      }
    }
    cuts.sort((x, y) => x - y);
    for (let k = 0; k + 1 < cuts.length; k++) {
      const p = [a[0] + (b[0] - a[0]) * cuts[k], a[1] + (b[1] - a[1]) * cuts[k]];
      const q = [a[0] + (b[0] - a[0]) * cuts[k + 1], a[1] + (b[1] - a[1]) * cuts[k + 1]];
      const hp = height(p[0], p[1]);
      const hq = height(q[0], q[1]);
      if (Math.max(hp, hq) <= from + 1e-3) continue;
      const wall = [
        [p[0], from, p[1]],
        [q[0], from, q[1]],
        [q[0], Math.max(from, hq), q[1]],
        [p[0], Math.max(from, hp), p[1]],
      ];
      // In the shadows as it was; drawn from the lowest height to which the layers beside it hide it,
      // all along it.
      const start = mb.indices.length;
      mb.facet(wall, color);
      toShadow();
      const h = Math.min(...hides(p, q, n, from).map(([, , up]) => up));
      if (h > from + 1e-3) {
        mb.indices.length = start;
        if (h < Math.max(hp, hq) - 1e-3) mb.facet(above(wall, h), color);
        drawnOnly();
      }
    }
  }
}

/** The part of an upright polygon of [east, height, north] points at height `h` or above. */
function above(points, h) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const q = points[(i + 1) % points.length];
    if (p[1] >= h) out.push(p);
    if ((p[1] < h && q[1] > h) || (p[1] > h && q[1] < h)) {
      const t = (h - p[1]) / (q[1] - p[1]);
      out.push([p[0] + (q[0] - p[0]) * t, h, p[2] + (q[2] - p[2]) * t]);
    }
  }
  return out;
}

/** Metres out from a wall where the layers beside it are looked for. */
const BEYOND = 0.001;

/**
 * A layer as a solid, for `hidden`: from its foot up to its roof (the top of its walls, the top of
 * the slab of a flat roof that overhangs them, or the lowest of its roof's planes) over its rings.
 */
function solid(l) {
  const flatTop = Math.max(l.wall, l.eave ?? l.wall);
  const planes = l.roof === "flat" ? undefined : l.planes;
  const top = planes ? (x, y) => Math.min(...planes.map(([gx, gy, z0]) => z0 + gx * x + gy * y)) : () => flatTop;
  const xs = l.local.flatMap((r) => r.map((p) => p[0]));
  const ys = l.local.flatMap((r) => r.map((p) => p[1]));
  return { foot: l.y0, rings: l.local, top, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
}

/**
 * How the other layers of the building hide a wall that stands on `from` along a to b, its outside
 * towards `n`: pieces [t0, t1, up] from a (t = 0) to b (t = 1), each hidden from `from` up to `up`,
 * the height to which the layers just outside it (BEYOND) fill the space above `from` with no gap,
 * one on another. `up` is `from` where nothing stands beside it. The pieces end where the wall
 * passes the layers' rings, and a sloping roof counts at the lower of its heights at a piece's two
 * ends. After the party walls of mrdoob's slop-newyork (MIT), where a wall against a taller
 * neighbour is drawn only for the height that shows above it.
 */
function hidden(solids, self, a, b, n, from) {
  const A = [a[0] + n[0] * BEYOND, a[1] + n[1] * BEYOND];
  const B = [b[0] + n[0] * BEYOND, b[1] + n[1] * BEYOND];
  const near = solids.filter(
    (s, j) => j !== self && s.box[0] <= Math.max(A[0], B[0]) && s.box[2] >= Math.min(A[0], B[0]) && s.box[1] <= Math.max(A[1], B[1]) && s.box[3] >= Math.min(A[1], B[1]),
  );
  if (!near.length) return [[0, 1, from]];
  const ts = [0, 1];
  for (const s of near) {
    for (const ring of s.rings) {
      for (let i = 0; i < ring.length; i++) {
        const t = crossing(A, B, ring[i], ring[(i + 1) % ring.length]);
        if (t > 0 && t < 1) ts.push(t);
      }
    }
  }
  ts.sort((x, y) => x - y);
  const at = (t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
  const pieces = [];
  for (let k = 0; k + 1 < ts.length; k++) {
    if (ts[k + 1] - ts[k] < 1e-9) continue;
    const p = at(ts[k]);
    const q = at(ts[k + 1]);
    const m = at((ts[k] + ts[k + 1]) / 2);
    const here = near.filter((s) => within(s.rings, m[0], m[1])).map((s) => [s.foot, Math.min(s.top(p[0], p[1]), s.top(q[0], q[1]))]);
    let up = from;
    for (let grew = true; grew; ) {
      grew = false;
      for (const [foot, top] of here) {
        if (foot <= up + 1e-3 && top > up + 1e-6) {
          up = top;
          grew = true;
        }
      }
    }
    const last = pieces.at(-1);
    if (last && Math.abs(last[2] - up) < 1e-6) last[1] = ts[k + 1];
    else pieces.push([ts[k], ts[k + 1], up]);
  }
  pieces[0][0] = 0;
  pieces.at(-1)[1] = 1;
  return pieces;
}

/** Where A to B crosses the segment p to q, as a share of A to B; NaN where they do not cross. */
function crossing(A, B, p, q) {
  const rx = B[0] - A[0];
  const ry = B[1] - A[1];
  const sx = q[0] - p[0];
  const sy = q[1] - p[1];
  const d = rx * sy - ry * sx;
  if (Math.abs(d) < 1e-12) return NaN;
  const u = ((p[0] - A[0]) * ry - (p[1] - A[1]) * rx) / d;
  return u >= 0 && u <= 1 ? ((p[0] - A[0]) * sy - (p[1] - A[1]) * sx) / d : NaN;
}

/** Inside the first ring and outside the others (its holes). */
function within(rings, x, y) {
  return inside(rings[0], x, y) && !rings.slice(1).some((r) => inside(r, x, y));
}

/**
 * The walls that `extrude` has added to the builder since index `start`, each drawn only where it
 * shows: a wall that `hides` hides all the way up goes; one hidden in part is drawn again as a wall
 * of its own over each piece that shows, from the height it is hidden to. Their points take every
 * value the wall's points carry (its texture's coordinates, its facade's) where they were on it, so
 * what shows is drawn as before. Each piece's sides have a point at each height where its
 * neighbours' feet are, so that no seam opens between them. An extruded wall is four points of its
 * own as two triangles (a and b at its foot, then b and a at its top); anything else is kept.
 */
function cut(mb, start, hides) {
  const I = mb.indices;
  const P = mb.positions;
  const N = mb.normals;
  const kept = [];
  for (let i = start; i < I.length; i += 6) {
    const v = I[i];
    const quad = I.slice(i, i + 6);
    const wall = quad.length === 6 && quad[1] === v + 1 && quad[2] === v + 2 && quad[3] === v && quad[4] === v + 2 && quad[5] === v + 3 && N[3 * v + 1] === 0;
    const from = P[3 * v + 1];
    const to = P[3 * (v + 3) + 1];
    if (!wall || to - from < 2e-3) {
      kept.push(...quad);
      continue;
    }
    const pieces = [];
    for (const [t0, t1, up] of hides([P[3 * v], -P[3 * v + 2]], [P[3 * (v + 1)], -P[3 * (v + 1) + 2]], [N[3 * v], -N[3 * v + 2]], from)) {
      // The foot of each piece: as it was, or where it is hidden to, or past the top: hidden.
      const foot = up <= from + 1e-3 ? from : up >= to - 1e-3 ? to : up;
      const last = pieces.at(-1);
      if (last && last[2] === foot) last[1] = t1;
      else pieces.push([t0, t1, foot]);
    }
    if (pieces.length === 1 && pieces[0][2] === from) {
      kept.push(...quad);
      continue;
    }
    pieces.forEach(([t0, t1, foot], k) => {
      if (foot >= to) return;
      // Heights up each side: the foot, a neighbour's foot above it that shows, the top.
      const side = (other) => [foot, ...(other && other[2] > foot && other[2] < to ? [other[2]] : []), to];
      const left = side(pieces[k - 1]).map((y) => wallPoint(mb, v, t0, (y - from) / (to - from), y));
      const right = side(pieces[k + 1]).map((y) => wallPoint(mb, v, t1, (y - from) / (to - from), y));
      // A strip up the two sides, wound as the wall's own triangles.
      let l = 0;
      let r = 0;
      while (l + 1 < left.length || r + 1 < right.length) {
        const ly = l + 1 < left.length ? P[3 * left[l + 1] + 1] : Infinity;
        const ry = r + 1 < right.length ? P[3 * right[r + 1] + 1] : Infinity;
        if (ry <= ly) kept.push(left[l], right[r], right[++r]);
        else kept.push(left[l], right[r], left[++l]);
      }
    });
  }
  I.length = start;
  for (const k of kept) I.push(k);
}

/**
 * A new point on the extruded wall whose points are v (a, foot), v + 1 (b, foot), v + 2 (b, top)
 * and v + 3 (a, top): t of the way from a to b and s of the way up, at height y, with every value
 * the builder keeps for a point taken between the wall's own.
 */
function wallPoint(mb, v, t, s, y) {
  const n = mb.positions.length / 3;
  for (const [values, size] of [[mb.positions, 3], [mb.normals, 3], [mb.colors, 3], [mb.uvs, 2], [mb.facadeA, 4], [mb.facadeB, 4], [mb.ribbons, 4]]) {
    if (values.length !== n * size) continue;
    for (let c = 0; c < size; c++) {
      const foot = values[v * size + c] + (values[(v + 1) * size + c] - values[v * size + c]) * t;
      const top = values[(v + 3) * size + c] + (values[(v + 2) * size + c] - values[(v + 3) * size + c]) * t;
      values.push(foot + (top - foot) * s);
    }
  }
  mb.positions[3 * n + 1] = y;
  return n;
}

/**
 * A counter-clockwise ring with each edge moved out by its own distance (`d`: one number for all, or
 * one an edge, from the edge's first point), the corners where the moved edges meet. Where two edges
 * run nearly straight on, or turn back on each other, both moved ends are kept instead of a corner
 * far away.
 */
function outset(ring, d) {
  const n = ring.length;
  const dist = (i) => (Array.isArray(d) ? (d[i] ?? 0) : d);
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = ring[(i + n - 1) % n];
    const a = ring[i];
    const q = ring[(i + 1) % n];
    const e1 = unit(a[0] - p[0], a[1] - p[1]);
    const e2 = unit(q[0] - a[0], q[1] - a[1]);
    const n1 = [e1[1], -e1[0]];
    const n2 = [e2[1], -e2[0]];
    const d1 = dist((i + n - 1) % n);
    const d2 = dist(i);
    const det = n1[0] * n2[1] - n1[1] * n2[0];
    if (Math.abs(det) > 0.3) {
      out.push([a[0] + (d1 * n2[1] - d2 * n1[1]) / det, a[1] + (n1[0] * d2 - n2[0] * d1) / det]);
    } else {
      const u = [a[0] + n1[0] * d1, a[1] + n1[1] * d1];
      const v = [a[0] + n2[0] * d2, a[1] + n2[1] * d2];
      out.push(u);
      if (Math.hypot(u[0] - v[0], u[1] - v[1]) > 0.01) out.push(v);
    }
  }
  return out;
}

function unit(x, y) {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

/**
 * A parapet along a flat roof's edge, as the blocks have one (src/shared/massing.ts roofRims), except
 * where a higher layer stands behind the edge or in front of it: there its wall rises from the edge.
 * Outer rings go counter-clockwise and holes clockwise (massing.py), so the roof is on the left.
 */
function rim(mb, ring, higher, y0, y1, color, inset = RIM_IN) {
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 1e-3) continue;
    // Left of the direction of travel is into the roof.
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    const steps = Math.max(1, Math.round(len / RIM_STEP));
    let from = -1;
    for (let k = 0; k <= steps; k++) {
      const t = (k + 0.5) / steps;
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t;
      const open = k < steps && !higher.some((h) => inside(h, x + nx * inset, y + ny * inset) || inside(h, x - nx * RIM_OUT, y - ny * RIM_OUT));
      if (open && from < 0) from = k;
      if (!open && from >= 0) {
        const p = from / steps;
        const q = k / steps;
        mb.fence(a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, y0, y1, color);
        from = -1;
      }
    }
  }
}

function inside(ring, x, y) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
