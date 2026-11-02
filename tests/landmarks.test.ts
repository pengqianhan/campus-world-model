import fs from "node:fs";
import { Box3, Vector3, type Mesh, type Object3D } from "three";
import { describe, expect, it } from "vitest";
import { LANDMARKS, landmarkBuildings, landmarkOf } from "../src/app/landmarks.ts";
import { Landmark, type LandmarkRequest } from "../src/scene/landmarks.ts";
import { Terrain } from "../src/scene/terrain.ts";
import { massing } from "../src/shared/massing.ts";
import type { CampusData, TerrainData } from "../src/shared/types.ts";
// @ts-expect-error plain JavaScript in the landmarks' shared kit
import { geometryMaterials, makeMaterials } from "../landmarks/kit/materials.js";
// @ts-expect-error plain JavaScript in a landmark's parts
import { OUTLINE, TOP } from "../landmarks/old-choral-hall/parts/rest.js";

const host = { loading: () => {}, prepare: async () => {}, ready: () => {} };

describe("landmarks on the map", () => {
  it("the Clock Tower draws building 105 and its south range, 105S, and no other", () => {
    const clocktower = LANDMARKS.find((l) => l.name === "clocktower");
    expect(clocktower).toBeDefined();
    expect(landmarkBuildings(clocktower!)).toEqual(["105", "105S"]);
    expect(landmarkOf("105")?.name).toBe("clocktower");
    expect(landmarkOf("105S")?.name).toBe("clocktower");
    expect(landmarkOf("119")?.name).not.toBe("clocktower");
  });

  it("the site finds every landmark whose placement says site: true, and only those, each with its model", () => {
    const folders = fs.readdirSync("landmarks", { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(`landmarks/${d.name}/placement.json`));
    const onSite = folders.filter((d) => JSON.parse(fs.readFileSync(`landmarks/${d.name}/placement.json`, "utf8")).site === true).map((d) => d.name);
    expect(onSite).toContain("clocktower");
    expect(LANDMARKS.map((l) => l.name)).toEqual(onSite.sort());
    // The worker loads landmarks/<name>/model.js by the same name.
    for (const name of onSite) expect(fs.existsSync(`landmarks/${name}/model.js`), name).toBe(true);
    // A building's block gives way to one landmark at most.
    const buildings = LANDMARKS.flatMap(landmarkBuildings);
    expect(new Set(buildings).size).toBe(buildings.length);
  });

  it("the scene puts the model's door where place.py puts it on the map, and back", () => {
    for (const entry of LANDMARKS) {
      const l = new Landmark(entry, host);
      const [mx, mz] = entry.placement.door.model as [number, number];
      const [east, north] = entry.placement.door.map as [number, number];
      // Model to map through the group's own matrix: three.js's turn about y, as the scene draws it.
      l.group.updateMatrixWorld(true);
      const at = new Vector3(mx, 0, mz).applyMatrix4(l.group.matrixWorld);
      expect(at.x).toBeCloseTo(east, 2);
      expect(-at.z).toBeCloseTo(north, 2);
      // And the map back to the model, as the worker sorts the triangles by building.
      const [x, z] = l.toModel(east, north);
      expect(x).toBeCloseTo(mx, 2);
      expect(z).toBeCloseTo(mz, 2);
      l.dispose();
    }
  });
});

describe("a landmark's forms", () => {
  it("makes the full form whether the map's light form or a walker's full form is asked for first, with stone or without", async () => {
    // A stand-in for the worker: it answers each request a moment later, in order.
    let stone = false;
    const asked: string[] = [];
    let workers = 0;
    class StandIn {
      onmessage?: (e: { data: unknown }) => void;
      onerror: unknown = null;
      constructor() {
        workers++;
      }
      postMessage(r: LandmarkRequest) {
        asked.push(r.part);
        const mesh = { material: stone ? "ashlar" : "boards", castShadow: true, receiveShadow: true, attributes: [{ name: "position", array: new Float32Array(9), itemSize: 3 }], groups: [{ start: 0, count: 3, materialIndex: 0 }], sphere: [0, 0, 0, 1] };
        const data = r.part === "geometry" ? { name: r.name, part: "geometry", meshes: [mesh], stone } : { name: r.name, part: "textures", quality: r.quality, textures: {} };
        setTimeout(() => this.onmessage?.({ data }), 5);
      }
      terminate() {}
    }
    const real = globalThis.Worker;
    globalThis.Worker = StandIn as unknown as typeof Worker;
    const settle = () => new Promise((r) => setTimeout(r, 100));
    // Until the full form is made, or 20 s: the kit's first import can be slow on a busy machine.
    const made = async (l: Landmark) => {
      for (let t = 0; t < 200 && !l.has("full"); t++) await new Promise((r) => setTimeout(r, 100));
    };
    const entry = LANDMARKS[0]!;
    const covers = () => [{ id: landmarkBuildings(entry)[0]!, rings: [] }];
    try {
      for (const s of [false, true]) {
        for (const mapFirst of [true, false]) {
          stone = s;
          asked.length = 0;
          workers = 0;
          const l = new Landmark(entry, host);
          if (mapFirst) {
            l.want("light", covers);
            await settle();
          }
          l.want("full", covers);
          await made(l);
          const how = `${s ? "stone" : "no stone"}, ${mapFirst ? "map first" : "walker first"}`;
          expect(l.has("full"), how).toBe(true);
          // The stone's textures only for a model with stone.
          expect(asked, how).toEqual(s ? ["geometry", "textures"] : ["geometry"]);
          // Asked for at once, the geometry and then the textures go to one worker.
          if (!mapFirst) expect(workers, how).toBe(1);
          l.dispose();
        }
      }
    } finally {
      globalThis.Worker = real;
    }
  }, 120_000);
});

describe("what measures a landmark", () => {
  it("is the LiDAR, and where something else measures some of it, the card's words begin with the LiDAR and About has its credit", () => {
    for (const { name, placement: p } of LANDMARKS) {
      if (p.measuredBy === undefined) {
        expect(p.credit, `${name}: a credit without measuredBy`).toBeUndefined();
        continue;
      }
      expect(p.measuredBy, name).toMatch(/^by LiDAR, /);
      expect(p.credit?.trim(), `${name}: measuredBy without a credit`).toBeTruthy();
    }
    // The Kenneth Myers Centre's west part: the LiDAR holds temporary works over it (2024), so the 2023 aerial
    // and a Street View photograph measure it.
    const kmc = LANDMARKS.find((l) => l.name === "kenneth-myers-centre")!.placement;
    expect(kmc.measuredBy).toContain("aerial photograph");
    expect(kmc.credit).toContain("CC BY 4.0");
  });
});

describe("each landmark on the site's ground", () => {
  it("stands at its door with each material's lowest points nowhere more than 0.25 m above the drawn ground", async () => {
    // The site's ground (the 8 m elevation model) can be a metre or more off the LiDAR's, which the
    // models are measured to; ordinary blocks get a footing for it (terrain.ts), a landmark its walls.
    const terrain = new Terrain([JSON.parse(fs.readFileSync("public/data/uoa/terrain/central.json", "utf8")) as TerrainData]);
    for (const entry of LANDMARKS) {
      const l = new Landmark(entry, host);
      l.stand(terrain.height(...(entry.placement.door.map as [number, number])));
      l.group.updateMatrixWorld(true);
      const { build, STANDS } = (await import(`../landmarks/${entry.name}/model.js`)) as {
        build: (m: unknown, only?: string[]) => Object3D;
        STANDS?: string[];
      };
      const log = console.log;
      console.log = () => {};
      // The whole model; and alone, together, the parts the model names as standing on ground higher than the
      // door's (STANDS: their foot is above y = 0 where the source stands them, as the Fisher Building's ramp on
      // the street).
      const models = [{ model: build(geometryMaterials()), part: "" }];
      if (STANDS?.length) models.push({ model: build(geometryMaterials(), STANDS), part: STANDS.join("+") });
      console.log = log;
      const v = new Vector3();
      for (const { model, part } of models) {
        model.updateMatrixWorld(true);
        const meshes: Mesh[] = [];
        model.traverse((o) => void ((o as Mesh).isMesh && meshes.push(o as Mesh)));
        // Each mesh that comes down to the ground at the door (y = 0) or below, at its own lowest points; the parts
        // in STANDS, at their lowest points wherever they are. The kit's Builder joins a model's parts into one
        // mesh a material, so this is a material's foot, not a part's: give every part the same foot (Old
        // Government House's take FOOT from common.js).
        let worst = -Infinity;
        let at = "";
        for (const m of meshes) {
          m.geometry.computeBoundingBox();
          const foot = new Box3().copy(m.geometry.boundingBox!).applyMatrix4(m.matrixWorld).min.y;
          if (foot > 0 && !part) continue;
          const p = m.geometry.getAttribute("position");
          for (let i = 0; i < p.count; i++) {
            v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
            if (v.y > foot + 0.01) continue;
            v.applyMatrix4(l.group.matrixWorld);
            const gap = v.y - terrain.height(v.x, -v.z);
            if (gap > worst) [worst, at] = [gap, `${m.parent?.name ?? ""}/${m.name}`];
          }
        }
        const what = part ? `${entry.name}'s ${part}` : entry.name;
        expect(at, `${what}: no mesh reaches the ground at its door`).not.toBe("");
        expect(worst, `${what} ${at}`).toBeLessThan(0.25);
      }
      l.dispose();
    }
  }, 60_000);
});

/**
 * How near two faces may lie before the depth buffer cannot tell which is in front. Both of the site's cameras keep
 * 24 bits of depth (2^24 steps from the near plane to the far one):
 * - the map's camera is orthographic, near 10 m and far 9,000 m (CampusScene's `camera`): one step is
 *   8,990 / 2^24 = 0.54 mm at every distance, and the map draws a landmark's light form;
 * - a walker's camera is perspective, near 0.2 m through the eyes and 0.3 m from behind, far 6,000 m (EYES_NEAR,
 *   FOLLOW_NEAR): one step at d metres is d^2 (f - n) / (f n 2^24), about d^2 / 3.4e6 m: 0.03 mm at 10 m, 0.27 mm at
 *   30 m, 3 mm at 100 m, 1.2 cm at 200 m, 10.7 cm at 600 m, the farthest it draws a landmark (LANDMARK_REACH).
 * Faces closer than twice the map's step (two steps, since the depth of each face is rounded) cannot be told apart on
 * the map at any zoom, nor by a walker beyond 60 m: in every view the site draws, they flicker. Those are the faces
 * this test fails on. Faces further apart are told apart wherever the camera's step is smaller than their distance:
 * the kit's relief, a pane 1 to 10 cm before its wall or a frame before its pane, flickers only in a walker's view
 * beyond 183 m (1 cm) to 580 m (10 cm), where the walker camera's depth, not the model, is short (the pull request
 * that brought this test counts those).
 */
const COINCIDE = (2 * (9000 - 10)) / 2 ** 24;
/** The least overlap counted, m²: a square 3 cm wide, a pixel's width at 30 m from a walker. */
const OVERLAP = 0.001;

/**
 * Pairs of triangles of different materials that face the same way, lie closer than `sep` apart and overlap: by
 * material pair, their overlapping area and one point of the largest overlap, in the model's frame. The triangles are
 * put into classes by the way they face (each within 1° of its class's first), and each class into a grid in its own
 * plane, so that only triangles near each other are compared. A class's triangles meet those of its own class and
 * those of every later class whose first lies within 3° of its own: every two triangles that face within 1° of each
 * other are compared, whichever classes they fell into (and some up to 5° apart), each pair once.
 */
function coinciding(model: Object3D, sep: number): Map<string, { area: number; at: number[]; big: number }> {
  model.updateMatrixWorld(true);
  const pos: number[] = [];
  const mat: number[] = [];
  const names: string[] = [];
  model.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    let k = names.indexOf(m.name);
    if (k < 0) k = names.push(m.name) - 1;
    const p = m.geometry.getAttribute("position");
    const index = m.geometry.index;
    const e = m.matrixWorld.elements;
    const count = index ? index.count : p.count;
    for (let i = 0; i < count; i++) {
      const j = index ? index.getX(i) : i;
      const [x, y, z] = [p.getX(j), p.getY(j), p.getZ(j)];
      pos.push(e[0]! * x + e[4]! * y + e[8]! * z + e[12]!, e[1]! * x + e[5]! * y + e[9]! * z + e[13]!, e[2]! * x + e[6]! * y + e[10]! * z + e[14]!);
      if (i % 3 === 2) mat.push(k);
    }
  });
  const T = mat.length;
  const nrm = new Float64Array(T * 3);
  const P = (t: number, k: number, a: number) => pos[t * 9 + k * 3 + a]!;
  const into = <K,>(m: Map<K, number[]>, k: K, x: number) => {
    const list = m.get(k);
    if (list) list.push(x);
    else m.set(k, [x]);
  };
  // Classes of the way triangles face: each joins the first class within 1° of its normal.
  const cos1 = Math.cos(Math.PI / 180);
  const classes: { n: number[]; tris: number[] }[] = [];
  const byKey = new Map<string, number[]>();
  for (let t = 0; t < T; t++) {
    const [ux, uy, uz] = [P(t, 1, 0) - P(t, 0, 0), P(t, 1, 1) - P(t, 0, 1), P(t, 1, 2) - P(t, 0, 2)];
    const [vx, vy, vz] = [P(t, 2, 0) - P(t, 0, 0), P(t, 2, 1) - P(t, 0, 1), P(t, 2, 2) - P(t, 0, 2)];
    const c = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    const l = Math.hypot(c[0]!, c[1]!, c[2]!);
    if (l < 1e-8) continue; // a triangle of no area
    const n = c.map((x) => x / l);
    nrm.set(n, t * 3);
    const q = n.map((x) => Math.round(x / 0.02));
    let found = -1;
    for (let a = -1; a <= 1 && found < 0; a++)
      for (let b = -1; b <= 1 && found < 0; b++)
        for (let d = -1; d <= 1 && found < 0; d++)
          for (const i of byKey.get(`${q[0]! + a},${q[1]! + b},${q[2]! + d}`) ?? []) {
            const r = classes[i]!.n;
            if (r[0]! * n[0]! + r[1]! * n[1]! + r[2]! * n[2]! > cos1) {
              found = i;
              break;
            }
          }
    if (found < 0) into(byKey, q.join(","), (found = classes.push({ n, tris: [] }) - 1));
    classes[found]!.tris.push(t);
  }
  const area = (poly: number[][]) => poly.reduce((s, [x0, y0], i) => s + (x0! * poly[(i + 1) % poly.length]![1]! - poly[(i + 1) % poly.length]![0]! * y0!) / 2, 0);
  // The part of the convex polygon `poly` inside the convex polygon `by`, both anticlockwise.
  const clip = (poly: number[][], by: number[][]) => {
    let out = poly;
    for (let i = 0; i < by.length && out.length; i++) {
      const [ax, ay] = by[i]!;
      const [bx, bz] = by[(i + 1) % by.length]!;
      const side = ([x, y]: number[]) => (bx! - ax!) * (y! - ay!) - (bz! - ay!) * (x! - ax!);
      const was = out;
      out = [];
      for (let j = 0; j < was.length; j++) {
        const [p, q] = [was[j]!, was[(j + 1) % was.length]!];
        const [sp, sq] = [side(p), side(q)];
        if (sp >= 0) out.push(p);
        if (sp >= 0 !== sq >= 0) out.push([p[0]! + (sp / (sp - sq)) * (q[0]! - p[0]!), p[1]! + (sp / (sp - sq)) * (q[1]! - p[1]!)]);
      }
    }
    return out;
  };
  // The later classes whose first triangles face within 3° of each class's (a bin of 0.02 is at least 1.1°).
  const cos3 = Math.cos((3 * Math.PI) / 180);
  const later = (c: number) => {
    const r = classes[c]!.n;
    const q = r.map((x) => Math.round(x / 0.02));
    const out: number[] = [];
    for (let a = -3; a <= 3; a++)
      for (let b = -3; b <= 3; b++)
        for (let d = -3; d <= 3; d++)
          for (const i of byKey.get(`${q[0]! + a},${q[1]! + b},${q[2]! + d}`) ?? []) {
            const s = classes[i]!.n;
            if (i > c && s[0]! * r[0]! + s[1]! * r[1]! + s[2]! * r[2]! > cos3) out.push(i);
          }
    return out;
  };
  const found = new Map<string, { area: number; at: number[]; big: number }>();
  const seen = new Set<number>();
  for (let c = 0; c < classes.length; c++) {
    const { n: r, tris } = classes[c]!;
    const others = later(c).flatMap((i) => classes[i]!.tris);
    const mats = new Set(tris.map((t) => mat[t]));
    if (mats.size < 2 && others.every((t) => mats.has(mat[t]))) continue;
    // Two directions in the class's plane.
    const ax = Math.abs(r[1]!) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u0 = [r[1]! * ax[2]! - r[2]! * ax[1]!, r[2]! * ax[0]! - r[0]! * ax[2]!, r[0]! * ax[1]! - r[1]! * ax[0]!];
    const ul = Math.hypot(u0[0]!, u0[1]!, u0[2]!);
    const u = u0.map((x) => x / ul);
    const v = [r[1]! * u[2]! - r[2]! * u[1]!, r[2]! * u[0]! - r[0]! * u[2]!, r[0]! * u[1]! - r[1]! * u[0]!];
    const dot = (a: number[], t: number, k: number) => a[0]! * P(t, k, 0) + a[1]! * P(t, k, 1) + a[2]! * P(t, k, 2);
    const flat = new Map<number, { poly: number[][]; w: number; box: number[] }>();
    const lay = (t: number) => {
      const poly = [0, 1, 2].map((k) => [dot(u, t, k), dot(v, t, k)]);
      if (area(poly) < 0) poly.reverse();
      const us = poly.map((p) => p[0]!);
      const vs = poly.map((p) => p[1]!);
      const box = [Math.min(...us), Math.max(...us), Math.min(...vs), Math.max(...vs)];
      flat.set(t, { poly, w: (dot(r, t, 0) + dot(r, t, 1) + dot(r, t, 2)) / 3, box });
      return box;
    };
    const cells = (box: number[], fn: (k: number) => void) => {
      for (let i = Math.floor(box[0]! / 2); i <= Math.floor(box[1]! / 2); i++)
        for (let j = Math.floor(box[2]! / 2); j <= Math.floor(box[3]! / 2); j++) fn(i * 100003 + j);
    };
    const grid = new Map<number, number[]>();
    for (const t of tris) cells(lay(t), (k) => into(grid, k, t));
    // How far along r the plane of triangle t lies from the point (a, b) of the class's plane.
    const along = (t: number, [a, b]: number[]) => {
      const n = [nrm[t * 3]!, nrm[t * 3 + 1]!, nrm[t * 3 + 2]!];
      const at = [0, 1, 2].map((k) => a! * u[k]! + b! * v[k]!);
      return (n[0]! * (P(t, 0, 0) - at[0]!) + n[1]! * (P(t, 0, 1) - at[1]!) + n[2]! * (P(t, 0, 2) - at[2]!)) / (n[0]! * r[0]! + n[1]! * r[1]! + n[2]! * r[2]!);
    };
    const pair = (i: number, j: number) => {
      if (mat[i] === mat[j]) return;
      const [A, B] = [flat.get(i)!, flat.get(j)!];
      if (A.box[1]! <= B.box[0]! || B.box[1]! <= A.box[0]! || A.box[3]! <= B.box[2]! || B.box[3]! <= A.box[2]!) return;
      // Within 5° of r the planes' offsets at the triangles' centres differ by no more than this.
      const span = Math.max(A.box[1]! - A.box[0]!, A.box[3]! - A.box[2]!, B.box[1]! - B.box[0]!, B.box[3]! - B.box[2]!);
      if (Math.abs(A.w - B.w) > sep + span * 0.09) return;
      const key = Math.min(i, j) * T + Math.max(i, j);
      if (seen.has(key)) return;
      seen.add(key);
      const poly = clip(A.poly, B.poly);
      if (poly.length < 3) return;
      const s = area(poly);
      if (s < 1e-7) return;
      // Apart by sep or more anywhere in the overlap: told apart.
      if (poly.some((p) => Math.abs(along(i, p) - along(j, p)) >= sep)) return;
      const which = [names[mat[i]!]!, names[mat[j]!]!].sort().join("/");
      const f = found.get(which) ?? { area: 0, at: [], big: 0 };
      f.area += s;
      if (s > f.big) {
        const mid = [poly.reduce((x, p) => x + p[0]!, 0) / poly.length, poly.reduce((x, p) => x + p[1]!, 0) / poly.length];
        const h = along(i, mid);
        [f.big, f.at] = [s, [0, 1, 2].map((k) => +(mid[0]! * u[k]! + mid[1]! * v[k]! + h * r[k]!).toFixed(2))];
      }
      found.set(which, f);
    };
    // the class's own pairs, then each of its triangles with each near later class's
    for (const list of grid.values()) for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) pair(list[a]!, list[b]!);
    for (const j of others) cells(lay(j), (k) => { for (const i of grid.get(k) ?? []) pair(i, j); });
  }
  return found;
}

describe("each landmark on the site's faces", () => {
  it("has no two faces of different materials that face the same way, overlap and lie closer than the depth buffer can tell apart", async () => {
    const wrong: string[] = [];
    for (const entry of LANDMARKS) {
      const { build } = (await import(`../landmarks/${entry.name}/model.js`)) as { build: (m: unknown, only?: string[]) => Object3D };
      const log = console.log;
      console.log = () => {};
      const model = build(geometryMaterials());
      console.log = log;
      for (const [pair, f] of coinciding(model, COINCIDE))
        if (f.area > OVERLAP) wrong.push(`${entry.name}: ${pair} ${f.area.toFixed(3)} m² (one at x, y, z ${f.at.join(", ")})`);
    }
    expect(wrong, wrong.join("\n")).toEqual([]);
  }, 60_000);
});

describe("the landmark kit", () => {
  it("builds the geometry with each texture's real size, without drawing a texture", () => {
    const stand = geometryMaterials() as Record<string, { userData: { metres: number }; map: unknown }>;
    const drawn = makeMaterials("low") as Record<string, { userData: { metres: number } }>;
    expect(Object.keys(stand).sort()).toEqual(Object.keys(drawn).sort());
    for (const [name, m] of Object.entries(drawn)) expect(stand[name]!.userData.metres, name).toBe(m.userData.metres);
    expect(stand.ashlar!.map).toBeNull();
  });
});

describe("Old Choral Hall's rest, the map's estimated block (parts/rest.js)", () => {
  it("stands on the outline the map extrudes for block 104 and reaches the top the map gives that block", () => {
    const campus = JSON.parse(fs.readFileSync("public/data/uoa/campus.json", "utf8")) as CampusData;
    const terrain = new Terrain([JSON.parse(fs.readFileSync("public/data/uoa/terrain/central.json", "utf8")) as TerrainData]);
    const b = campus.buildings.find((x) => x.id === "104")!;
    const blocks = massing(b, campus.floorHeight);
    const entry = LANDMARKS.find((l) => l.name === "old-choral-hall")!;
    const l = new Landmark(entry, host);
    // The outline: the lowest block's, in the model's frame, to the 0.01 m it is written to.
    const ring = blocks[0]!.outline[0]![0]!;
    const want: [number, number][] = [];
    for (let i = 0; i + 1 < ring.length; i += 2) want.push(l.toModel(ring[i]! / 10, ring[i + 1]! / 10));
    const outline = OUTLINE as [number, number][];
    expect(outline.length).toBe(want.length);
    outline.forEach(([x, z], i) => expect(Math.hypot(x - want[i]![0], z - want[i]![1]), `corner ${i}`).toBeLessThan(0.01));
    // The top: the block's top on the map (its footing, CampusScene.baseOf, and its blocks' height) over the ground at the door.
    const top = terrain.footing(b.outline[0]!).base + blocks.at(-1)!.y1 - terrain.height(...(entry.placement.door.map as [number, number]));
    expect(Math.abs((TOP as number) - top)).toBeLessThan(0.01);
    l.dispose();
  });
});
