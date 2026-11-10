// How high what stands on the map reaches, for the drone a walker flies (src/scene/walkers.ts):
// the top of every building as the map draws it, by its outline, and the roofs of the models drawn
// in place of buildings on grids (src/scene/roofgrid.ts). A point answers with the highest top over
// it; a straight line, with the highest top along it. The heights are the map's: a University
// building's estimated from its floors unless a landmark or a measured massing draws it, a
// surrounding building's from OpenStreetMap. Pure, so that it can be tested without a browser.
import { bbox, pointInRing, type Pt, type Ring } from "./geo.ts";

/** One outline (outer ring and holes) and the height its top reaches, metres above sea level. */
export interface RoofShape {
  rings: Ring[];
  top: number;
}

/**
 * Heights on a grid: the top of what stands over each cell, metres above sea level, `-Infinity`
 * where nothing does. Cells are `cell` metres square from (x0, y0), metres east and north, row by
 * row from the south-west.
 */
export interface RoofGrid {
  x0: number;
  y0: number;
  cell: number;
  cols: number;
  rows: number;
  top: Float32Array;
}

interface Indexed extends RoofShape {
  box: [number, number, number, number];
}

/** Metres a side of the squares the shapes are filed under, for finding those over a point quickly. */
const BUCKET = 40;

export class RoofMap {
  private buckets = new Map<string, Indexed[]>();
  private gridBuckets = new Map<string, RoofGrid[]>();

  constructor(shapes: Iterable<RoofShape>, grids: Iterable<RoofGrid> = []) {
    for (const g of grids) {
      for (let c = Math.floor(g.x0 / BUCKET); c <= Math.floor((g.x0 + g.cols * g.cell) / BUCKET); c++) {
        for (let r = Math.floor(g.y0 / BUCKET); r <= Math.floor((g.y0 + g.rows * g.cell) / BUCKET); r++) {
          const key = `${c},${r}`;
          let list = this.gridBuckets.get(key);
          if (!list) this.gridBuckets.set(key, (list = []));
          list.push(g);
        }
      }
    }
    for (const s of shapes) {
      const outer = s.rings[0];
      if (!outer || outer.length < 3 || !Number.isFinite(s.top)) continue;
      const shape: Indexed = { ...s, box: bbox(outer) };
      const [x0, y0, x1, y1] = shape.box;
      for (let c = Math.floor(x0 / BUCKET); c <= Math.floor(x1 / BUCKET); c++) {
        for (let r = Math.floor(y0 / BUCKET); r <= Math.floor(y1 / BUCKET); r++) {
          const key = `${c},${r}`;
          let list = this.buckets.get(key);
          if (!list) this.buckets.set(key, (list = []));
          list.push(shape);
        }
      }
    }
  }

  /** The highest top over a point, metres above sea level; undefined where nothing stands. */
  at(p: Pt): number | undefined {
    const key = `${Math.floor(p[0] / BUCKET)},${Math.floor(p[1] / BUCKET)}`;
    let top: number | undefined;
    for (const g of this.gridBuckets.get(key) ?? []) {
      const c = Math.floor((p[0] - g.x0) / g.cell);
      const r = Math.floor((p[1] - g.y0) / g.cell);
      if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) continue;
      const h = g.top[r * g.cols + c]!;
      if (h > -Infinity && (top === undefined || h > top)) top = h;
    }
    const list = this.buckets.get(key);
    for (const s of list ?? []) {
      if (top !== undefined && s.top <= top) continue;
      const [x0, y0, x1, y1] = s.box;
      if (p[0] < x0 || p[0] > x1 || p[1] < y0 || p[1] > y1) continue;
      const [outer, ...holes] = s.rings;
      if (pointInRing(p, outer!) && !holes.some((h) => pointInRing(p, h))) top = s.top;
    }
    return top;
  }

  /**
   * The highest top within `reach` metres of a point: what a drone of that half-width would touch
   * there, tried at its middle and at eight points round it.
   */
  near(p: Pt, reach: number): number | undefined {
    let top = this.at(p);
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      const h = this.at([p[0] + Math.cos(a) * reach, p[1] + Math.sin(a) * reach]);
      if (h !== undefined && (top === undefined || h > top)) top = h;
    }
    return top;
  }

  /** The highest top along a straight line, tried every `step` metres; undefined where nothing stands. */
  along(a: Pt, b: Pt, step = 2): number | undefined {
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    let top: number | undefined;
    for (let k = 0; k <= n; k++) {
      const h = this.at([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
      if (h !== undefined && (top === undefined || h > top)) top = h;
    }
    return top;
  }
}
