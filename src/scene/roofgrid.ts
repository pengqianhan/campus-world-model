// How high a model drawn in place of a building reaches, on a grid over the map: a landmark or a
// measured massing as it is drawn, for the drone a walker flies (walkers.ts, through the roof map in
// src/shared/roofmap.ts). Each cell holds the highest point of the model over it: of every edge
// that crosses it, and of every face over its middle. A sloping face counts at its highest corner,
// so over a pitched roof the drone keeps above the ridge.
import type { BufferAttribute, Mesh, Object3D } from "three";
import type { RoofGrid } from "../shared/roofmap.ts";

/** The roofs of a model in the scene, metres above sea level on a grid of `cell` metres; undefined when it has no faces. */
export function roofGrid(root: Object3D, cell = 1): RoofGrid | undefined {
  root.updateMatrixWorld(true);
  // Each mesh's corners in map metres: east, north and height. A mesh drawn twice (once for the
  // depth only) counts once.
  const seen = new Set<string>();
  const sets: { east: Float32Array; north: Float32Array; height: Float32Array; index: ArrayLike<number> | undefined; count: number }[] = [];
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  root.traverse((o) => {
    const m = o as Mesh;
    const pos = m.isMesh ? (m.geometry?.getAttribute("position") as BufferAttribute | undefined) : undefined;
    if (!pos?.count) return;
    const e = m.matrixWorld.elements;
    const key = `${m.geometry.id}:${e.join(",")}`;
    if (seen.has(key)) return;
    seen.add(key);
    const east = new Float32Array(pos.count);
    const north = new Float32Array(pos.count);
    const height = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      east[i] = e[0]! * x + e[4]! * y + e[8]! * z + e[12]!;
      height[i] = e[1]! * x + e[5]! * y + e[9]! * z + e[13]!;
      north[i] = -(e[2]! * x + e[6]! * y + e[10]! * z + e[14]!);
      x0 = Math.min(x0, east[i]!);
      x1 = Math.max(x1, east[i]!);
      y0 = Math.min(y0, north[i]!);
      y1 = Math.max(y1, north[i]!);
    }
    const index = m.geometry.index?.array as ArrayLike<number> | undefined;
    sets.push({ east, north, height, index, count: index ? index.length : pos.count });
  });
  if (!sets.length) return undefined;
  x0 = Math.floor(x0 / cell) * cell;
  y0 = Math.floor(y0 / cell) * cell;
  const cols = Math.floor((x1 - x0) / cell) + 1;
  const rows = Math.floor((y1 - y0) / cell) + 1;
  const top = new Float32Array(cols * rows).fill(-Infinity);
  const mark = (e: number, n: number, h: number) => {
    const c = Math.floor((e - x0) / cell);
    const r = Math.floor((n - y0) / cell);
    if (c < 0 || r < 0 || c >= cols || r >= rows) return;
    const i = r * cols + c;
    if (h > top[i]!) top[i] = h;
  };
  const step = cell / 2;
  for (const s of sets) {
    const at = (k: number) => (s.index ? s.index[k]! : k);
    for (let k = 0; k + 2 < s.count; k += 3) {
      const a = at(k);
      const b = at(k + 1);
      const c = at(k + 2);
      const ax = s.east[a]!, ay = s.north[a]!, ah = s.height[a]!;
      const bx = s.east[b]!, by = s.north[b]!, bh = s.height[b]!;
      const cx = s.east[c]!, cy = s.north[c]!, ch = s.height[c]!;
      // The edges, every half cell: a wall seen from above is only its edges.
      for (const [px, py, ph, qx, qy, qh] of [
        [ax, ay, ah, bx, by, bh],
        [bx, by, bh, cx, cy, ch],
        [cx, cy, ch, ax, ay, ah],
      ] as const) {
        const h = Math.max(ph, qh);
        const n = Math.max(1, Math.ceil(Math.hypot(qx - px, qy - py) / step));
        for (let j = 0; j <= n; j++) mark(px + ((qx - px) * j) / n, py + ((qy - py) * j) / n, h);
      }
      // The middles of the cells under the face.
      const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
      if (Math.abs(area) < 1e-6) continue;
      const h = Math.max(ah, bh, ch);
      const c0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) - x0) / cell));
      const c1 = Math.min(cols - 1, Math.floor((Math.max(ax, bx, cx) - x0) / cell));
      const r0 = Math.max(0, Math.floor((Math.min(ay, by, cy) - y0) / cell));
      const r1 = Math.min(rows - 1, Math.floor((Math.max(ay, by, cy) - y0) / cell));
      for (let r = r0; r <= r1; r++) {
        const py = y0 + (r + 0.5) * cell;
        for (let col = c0; col <= c1; col++) {
          const px = x0 + (col + 0.5) * cell;
          const w0 = ((bx - px) * (cy - py) - (cx - px) * (by - py)) / area;
          const w1 = ((cx - px) * (ay - py) - (ax - px) * (cy - py)) / area;
          if (w0 < 0 || w1 < 0 || w0 + w1 > 1) continue;
          const i = r * cols + col;
          if (h > top[i]!) top[i] = h;
        }
      }
    }
  }
  return { x0, y0, cell, cols, rows, top };
}
