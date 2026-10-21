// Textures drawn in code: no image files. Each returns { map, normalMap } sized in metres through
// `metres` (how many metres one repeat of the texture covers), for use with worldUV() in gothic.js.
import * as THREE from "three";

/** A seeded random generator, so that the same stone is drawn every time. */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Smooth value noise on a grid, 0..1. */
function noise2(rand, size, cells) {
  const g = new Float32Array((cells + 1) * (cells + 1)).map(() => rand());
  const at = (i, j) => g[(j % cells) * (cells + 1) + (i % cells)];
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cells, fy = (y / size) * cells;
      const i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
      const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
      const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1);
      out[y * size + x] = a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
    }
  }
  return out;
}

/** Layers of noise: a fractal texture, 0..1. */
function fbm(seed, size, octaves = 5, base = 4) {
  const rand = rng(seed);
  const out = new Float32Array(size * size);
  let amp = 1, total = 0;
  for (let o = 0; o < octaves; o++) {
    const n = noise2(rand, size, base << o);
    for (let k = 0; k < out.length; k++) out[k] += n[k] * amp;
    total += amp; amp *= 0.5;
  }
  for (let k = 0; k < out.length; k++) out[k] /= total;
  return out;
}

/** A normal map from a height field (tileable, wraps at the edges). */
function normalFromHeight(h, size, strength) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const l = h[y * size + ((x - 1 + size) % size)], r = h[y * size + ((x + 1) % size)];
      const u = h[((y - 1 + size) % size) * size + x], d = h[((y + 1) % size) * size + x];
      let nx = (l - r) * strength, ny = (d - u) * strength, nz = 1;
      const len = Math.hypot(nx, ny, nz); nx /= len; ny /= len; nz /= len;
      const k = (y * size + x) * 4;
      data[k] = (nx * 0.5 + 0.5) * 255; data[k + 1] = (ny * 0.5 + 0.5) * 255; data[k + 2] = (nz * 0.5 + 0.5) * 255; data[k + 3] = 255;
    }
  }
  return data;
}

function texture(data, size, srgb) {
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

/**
 * Rock-faced ashlar of a cream limestone, as on the Clock Tower: courses of about 0.42 m, blocks of
 * 0.5 to 1.4 m, each face quarried rough and raised from fine joints. One repeat covers 4 m.
 */
export function ashlar(seed = 7, size = 2048) {
  const metres = 4, px = size / metres;
  const rand = rng(seed);
  const height = new Float32Array(size * size);
  const tint = new Float32Array(size * size * 3);
  const rough = fbm(seed + 1, size, 6, 8);
  const fine = fbm(seed + 2, size, 4, 64);
  const pit = fbm(seed + 3, size, 3, 256);
  const course = 0.42 * px, joint = 0.008 * px;
  const rows = Math.round(size / course);
  for (let r = 0; r < rows; r++) {
    const y0 = Math.round((r * size) / rows), y1 = Math.round(((r + 1) * size) / rows);
    let x = rand() * size;
    const startX = x;
    while (x < startX + size) {
      const w = (0.45 + rand() * 0.95) * px;
      const shade = 0.93 + rand() * 0.1, warm = rand() * 0.03;
      const bulge = 0.5 + rand() * 0.5, tiltX = (rand() - 0.5) * 0.6, tiltY = (rand() - 0.5) * 0.6;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = Math.floor(x); xx < Math.min(x + w, startX + size); xx++) {
          const X = ((xx % size) + size) % size, k = yy * size + X;
          const dx = Math.min(xx - x, x + w - xx), dy = Math.min(yy - y0, y1 - yy);
          const edge = Math.min(dx, dy);
          if (edge < joint) { height[k] = 0; tint[k * 3] = 0.66; tint[k * 3 + 1] = 0.64; tint[k * 3 + 2] = 0.6; continue; }
          // a rough, pitched face: proud in the middle, broken by the quarry noise, chipped back to a narrow margin
          const margin = Math.min(1, (edge - joint) / (0.03 * px));
          const u = (xx - x) / w - 0.5, v = (yy - y0) / (y1 - y0) - 0.5;
          height[k] = margin * (0.5 + bulge * 0.2 + u * tiltX + v * tiltY + (rough[k] - 0.5) * 1.1 + (fine[k] - 0.5) * 0.6 + (pit[k] - 0.5) * 0.45);
          tint[k * 3] = shade + warm; tint[k * 3 + 1] = shade + warm * 0.6; tint[k * 3 + 2] = shade - warm * 0.5;
        }
      }
      x += w;
    }
  }
  const base = [0.95, 0.92, 0.85];
  const color = new Uint8Array(size * size * 4);
  for (let k = 0; k < size * size; k++) {
    const ao = 0.88 + 0.12 * Math.min(1, Math.max(0, height[k] * 1.4));
    const speck = 0.97 + (pit[k] - 0.5) * 0.14 + (fine[k] - 0.5) * 0.06;
    for (let c = 0; c < 3; c++) color[k * 4 + c] = Math.min(255, base[c] * tint[k * 3 + c] * ao * speck * 255);
    color[k * 4 + 3] = 255;
  }
  return { map: texture(color, size, true), normalMap: texture(normalFromHeight(height, size, 3.0), size, false), metres };
}

/** Dressed stone: the smooth, slightly lighter limestone of mouldings, mullions, tracery and pinnacles. */
export function dressed(seed = 11, size = 1024) {
  const n = fbm(seed, size, 5, 6), f = fbm(seed + 3, size, 3, 48);
  const color = new Uint8Array(size * size * 4), h = new Float32Array(size * size);
  const base = [0.95, 0.93, 0.87];
  for (let k = 0; k < size * size; k++) {
    const v = 0.93 + (n[k] - 0.5) * 0.12 + (f[k] - 0.5) * 0.05;
    for (let c = 0; c < 3; c++) color[k * 4 + c] = Math.min(255, base[c] * v * 255);
    color[k * 4 + 3] = 255; h[k] = f[k] * 0.3;
  }
  return { map: texture(color, size, true), normalMap: texture(normalFromHeight(h, size, 1.5), size, false), metres: 2 };
}

/** A flat surface: asphalt, concrete paving or grass, from a base colour and its grain. */
export function ground(kind, seed = 3, size = 1024) {
  const spec = {
    asphalt: { base: [0.2, 0.205, 0.215], spread: 0.18, grain: 128, metres: 4 },
    paving: { base: [0.52, 0.52, 0.5], spread: 0.12, grain: 64, metres: 4, slabs: 0.6 },
    grass: { base: [0.15, 0.21, 0.095], spread: 0.35, grain: 96, metres: 4 },
    soil: { base: [0.22, 0.17, 0.13], spread: 0.3, grain: 64, metres: 3 },
  }[kind];
  const n = fbm(seed, size, 4, 8), f = fbm(seed + 9, size, 3, spec.grain);
  const color = new Uint8Array(size * size * 4), h = new Float32Array(size * size);
  const slab = spec.slabs ? (size / spec.metres) * spec.slabs : 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const k = y * size + x;
      let v = 1 + (n[k] - 0.5) * spec.spread + (f[k] - 0.5) * spec.spread;
      if (slab && (x % slab < 2 || y % slab < 2)) v *= 0.8;
      for (let c = 0; c < 3; c++) color[k * 4 + c] = Math.min(255, spec.base[c] * v * 255);
      color[k * 4 + 3] = 255; h[k] = f[k];
    }
  }
  return { map: texture(color, size, true), normalMap: texture(normalFromHeight(h, size, 2), size, false), metres: spec.metres };
}

/** Smooth ashlar: dressed limestone laid in fine-jointed courses, as on the centre and the tower. */
export function smoothAshlar(seed = 13, size = 1024) {
  const metres = 4, px = size / metres, rand = rng(seed);
  const n = fbm(seed, size, 5, 6), f = fbm(seed + 3, size, 3, 48);
  const color = new Uint8Array(size * size * 4), h = new Float32Array(size * size).fill(1);
  const base = [0.95, 0.93, 0.87], course = 0.36 * px, rows = Math.round(size / course);
  const shade = new Float32Array(size * size).fill(1);
  for (let r = 0; r < rows; r++) {
    const y0 = Math.round((r * size) / rows), y1 = Math.round(((r + 1) * size) / rows);
    let x = rand() * size; const sx = x;
    while (x < sx + size) {
      const w = (0.6 + rand() * 0.8) * px, v = 0.96 + rand() * 0.07;
      for (let yy = y0; yy < y1; yy++) for (let xx = Math.floor(x); xx < Math.min(x + w, sx + size); xx++) {
        const k = yy * size + (((xx % size) + size) % size);
        const joint = yy - y0 < 2 || xx - x < 2;
        shade[k] = joint ? 0.82 : v; h[k] = joint ? 0 : 1;
      }
      x += w;
    }
  }
  for (let k = 0; k < size * size; k++) {
    const v = shade[k] * (0.95 + (n[k] - 0.5) * 0.1 + (f[k] - 0.5) * 0.05);
    for (let c = 0; c < 3; c++) color[k * 4 + c] = Math.min(255, base[c] * v * 255);
    color[k * 4 + 3] = 255; h[k] = h[k] * 0.6 + f[k] * 0.2;
  }
  return { map: texture(color, size, true), normalMap: texture(normalFromHeight(h, size, 1.2), size, false), metres };
}
