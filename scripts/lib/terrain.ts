// The ground's height under the map, from the AWS Open Data "Terrain Tiles" (terrarium PNGs, no
// key, no account). Over New Zealand they hold the LINZ 8 m Digital Elevation Model (2012), which
// is built from contours: bare ground, smooth, with sharp peaks a few metres low. Zoom 14 is about
// 7.7 m a pixel here and matches it; zoom 15 adds nothing (checked 2026-10-15). fetch-terrain.ts
// takes the tiles under a school's areas and buildTerrain makes each area's ground from them, for
// every school alike (docs/schools/DESIGN.md, section 4).
import { makeUnprojector } from "../../src/shared/geo.ts";
import type { TerrainData } from "../../src/shared/types.ts";
import type { SceneArea } from "./areas.ts";
import type { MapFrame } from "./map-frame.ts";
import { decodePng, type Image } from "./png.ts";
import { hasSnapshot, readSnapshot } from "./snapshot.ts";

export const TERRAIN_ZOOM = 14;
export const TERRAIN_URL = (z: number, x: number, y: number) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
export const terrainFile = (z: number, x: number, y: number) => `terrain/${z}/${x}/${y}.png`;

/**
 * How far past an area's box the ground reaches, in metres: far enough that the edge of the
 * ground stays out of the usual view of the campus.
 */
export const TERRAIN_MARGIN = { central: 700, remote: 500 };

/** An area's box widened by a margin in metres: south, west, north, east. */
export function terrainBox(area: SceneArea): [number, number, number, number] {
  const m = area.id === "central" ? TERRAIN_MARGIN.central : TERRAIN_MARGIN.remote;
  const [s, w, n, e] = area.bbox;
  const dLat = m / 111_000;
  const dLon = m / (111_000 * Math.cos((((s + n) / 2) * Math.PI) / 180));
  return [s - dLat, w - dLon, n + dLat, e + dLon];
}

/** Web Mercator pixel of a point at a zoom, for 256-pixel tiles. */
export function globalPixel(lon: number, lat: number, z: number): [number, number] {
  const n = 256 * 2 ** z;
  const phi = (lat * Math.PI) / 180;
  return [((lon + 180) / 360) * n, ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * n];
}

/** The tiles covering a box at a zoom. */
export function tilesFor(box: [number, number, number, number], z: number): [number, number][] {
  const [s, w, n, e] = box;
  const [x0, y0] = globalPixel(w, n, z).map((v) => Math.floor(v / 256));
  const [x1, y1] = globalPixel(e, s, z).map((v) => Math.floor(v / 256));
  const out: [number, number][] = [];
  for (let x = x0!; x <= x1!; x++) for (let y = y0!; y <= y1!; y++) out.push([x, y]);
  return out;
}

/** Elevation in metres from a terrarium pixel. */
export const terrarium = (r: number, g: number, b: number) => r * 256 + g + b / 256 - 32768;

/** Grid spacing of the published ground, metres: a little coarser than the 8 m source. */
const TERRAIN_STEP = 10;
/**
 * Lowest height kept, metres. The tiles hold single-pixel pits where land meets sea (-1,421 m in
 * Hobson Bay, -451 m at the Viaduct); the sea itself is near 0.
 */
const TERRAIN_FLOOR = -2;

/** The ground under one area of the map on a square grid, from the elevation tile snapshot. */
export function buildTerrain(area: SceneArea, frame: MapFrame): { data?: TerrainData; stats: Record<string, number> } {
  const stats: Record<string, number> = {};
  const box = terrainBox(area);
  const tiles = new Map<string, Image>();
  for (const [x, y] of tilesFor(box, TERRAIN_ZOOM)) {
    const file = terrainFile(TERRAIN_ZOOM, x, y);
    if (!hasSnapshot(file)) {
      // The area is published without ground and drawn flat; say so rather than let it pass unseen.
      console.warn(`terrain: no snapshot ${file} for ${area.id}; its ground stays flat. Run \`npm run data:fetch\`.`);
      return { stats };
    }
    tiles.set(`${x}/${y}`, decodePng(readSnapshot(file)));
  }
  const pixel = (px: number, py: number): number => {
    const tx = Math.floor(px / 256);
    const ty = Math.floor(py / 256);
    const img = tiles.get(`${tx}/${ty}`);
    if (!img) return 0;
    const i = ((py - ty * 256) * img.width + (px - tx * 256)) * 3;
    return terrarium(img.rgb[i]!, img.rgb[i + 1]!, img.rgb[i + 2]!);
  };
  // Pixel values stand for pixel centres; sample between the four nearest.
  const sample = (lon: number, lat: number): number => {
    const [gx, gy] = globalPixel(lon, lat, TERRAIN_ZOOM).map((v) => v - 0.5);
    const x0 = Math.floor(gx!);
    const y0 = Math.floor(gy!);
    const fx = gx! - x0;
    const fy = gy! - y0;
    const v = (dx: number, dy: number) => Math.max(TERRAIN_FLOOR, pixel(x0 + dx, y0 + dy));
    return (v(0, 0) * (1 - fx) + v(1, 0) * fx) * (1 - fy) + (v(0, 1) * (1 - fx) + v(1, 1) * fx) * fy;
  };
  const unproject = makeUnprojector(frame.origin);
  const [sx, sy] = frame.project(box[1], box[0]);
  const [ex, ey] = frame.project(box[3], box[2]);
  const x0 = Math.floor(sx / TERRAIN_STEP) * TERRAIN_STEP;
  const y0 = Math.floor(sy / TERRAIN_STEP) * TERRAIN_STEP;
  const cols = Math.ceil((ex - x0) / TERRAIN_STEP) + 1;
  const rows = Math.ceil((ey - y0) / TERRAIN_STEP) + 1;
  const heights = new Int16Array(cols * rows);
  let lo = Infinity;
  let hi = -Infinity;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const h = sample(...unproject(x0 + c * TERRAIN_STEP, y0 + r * TERRAIN_STEP));
      heights[r * cols + c] = Math.round(h * 10);
      lo = Math.min(lo, h);
      hi = Math.max(hi, h);
    }
  }
  const prefix = area === frame.central ? "" : `${area.id}.`;
  stats[`${prefix}terrain.lowest`] = Math.round(lo);
  stats[`${prefix}terrain.highest`] = Math.round(hi);
  stats[`${prefix}terrain.points`] = cols * rows;
  return {
    data: {
      version: 1,
      area: area.id,
      x0,
      y0,
      step: TERRAIN_STEP,
      cols,
      rows,
      h: Buffer.from(heights.buffer).toString("base64"),
    },
    stats,
  };
}
