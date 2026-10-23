// The shared model of every measured massing (landmarks/MASSING.md): one plain building as blocks and
// roofs at the heights the LiDAR measures, from its data file in buildings/<id>.json, which
// landmarks/pipeline/tools/massing.py writes. Nobody draws it: walls, storeys and windows come by the
// street look's rules. It is built with the site's own MeshBuilder, so that its walls carry what the
// blocks' walls carry (storeys, bays and the street look's facade data) and take the blocks' own
// materials on the site: the map's palette on the map, the facades drawn by rule in the walker views.
//
// build(materials, only, data, style) returns a Group of two meshes, `walls` and `roof`, in the
// building's frame: metres east of the building's centre (place.centre) along x, up along y from
// ground.zero, and south along z. `style` gives the blocks' tints, rim and bay, and the facade the
// walker views draw the building's walls with (src/scene/CampusScene.ts); without it the model has
// the same shape in plain white, which is all the top-view check reads (massing_triangles.mjs).
import { BufferAttribute, BufferGeometry, Group, Mesh, MeshBasicMaterial } from "three";
import { MeshBuilder } from "../../src/scene/geometry.ts";

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

  layers.forEach((l, k) => {
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
    if (textured > l.y0 + 0.01) mb.extrude(rings, l.y0, textured, tints.roof, tints.wall, capped && !plain, { storey: l.storey, bay, roofGroup: true, plinth });
    if (plain) mb.extrude(rings, textured, l.wall, tints.roof, tints.wall, capped, { roofGroup: true });

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
      for (const ring of l.local) wallsUp(mb, ring, planes, height, l.wall, tints.wall);
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

  const g = mb.build();
  const group = new Group();
  const roles = [materials.walls ?? new MeshBasicMaterial(), materials.roof ?? new MeshBasicMaterial()];
  g.groups.forEach((part, i) => {
    const one = new BufferGeometry();
    for (const [name, a] of Object.entries(g.attributes)) one.setAttribute(name, a);
    one.setIndex(new BufferAttribute(g.index.array.slice(part.start, part.start + part.count), 1));
    const mesh = new Mesh(one, roles[part.materialIndex ?? i]);
    mesh.name = part.materialIndex === 1 ? "roof" : "walls";
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });
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
function wallsUp(mb, ring, planes, height, from, color) {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
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
      mb.facet(
        [
          [p[0], from, p[1]],
          [q[0], from, q[1]],
          [q[0], Math.max(from, hq), q[1]],
          [p[0], Math.max(from, hp), p[1]],
        ],
        color,
      );
    }
  }
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
