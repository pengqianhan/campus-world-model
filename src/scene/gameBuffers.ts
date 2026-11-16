import { DataTexture, FloatType, RGBAFormat, type BufferAttribute, type InstancedMesh, type Material } from "three";

/**
 * Where the game's instanced meshes (its pick-ups and effects) take their instances from: a small
 * float texture written in every frame and read in the vertex shader, not vertex buffers.
 *
 * Chrome on Windows draws WebGL through ANGLE on Direct3D 11. There, a vertex buffer written in every
 * frame makes the GPU process wait for the GPU, once the GPU has a frame or two of work queued: a buffer
 * marked static is bound directly and must not be written while a frame in flight reads it; one marked
 * dynamic is streamed, and ANGLE turns it static once drawn from more than about three times its size
 * between writes (a draw counts its mesh's vertices); and under a fight's load even a streamed one
 * waited. On an Intel UHD 770 the GPU process's main thread went from 2.7 to 21 ms a frame and the walk
 * from 60 to 45 fps as soon as the game was on, and a fight to 33-41 fps; a texture or a uniform array
 * written in every frame cost nothing (scratchpad shots-r7/perf, round 7). The map itself writes no
 * vertex buffer in every frame.
 *
 * Each mesh's texture has a row per instance: its matrix (four texels), its colour, and one attribute
 * of its own (a float to a vec4). The mesh's instance attributes are sent once and not again; its
 * material reads the texture where three reads them (instanceMatrix, instanceColor) and in the
 * attribute's place. The occlusion of the walker views draws a mesh with a material of its own, which
 * would read the attributes as first sent: these meshes are left out of it (userData.noAO), as the
 * see-through effects already are.
 */
interface Rows {
  tex: DataTexture;
  data: Float32Array;
  /** Texels a row. */
  k: number;
  color: boolean;
  extra?: BufferAttribute;
}

const rowsOf = new WeakMap<InstancedMesh, Rows>();
/** A material's own hooks, from before everyFrame wrapped them: a copy for another mesh starts from these. */
const ownHooks = new WeakMap<Material, Pick<Material, "onBeforeCompile" | "customProgramCacheKey">>();

/**
 * Makes an instanced mesh take its instances from a texture written in every frame: its matrices, its
 * colours when it has them, and the attribute of its geometry named `extra`, if any. Returns the mesh.
 * A material is the mesh's own: one already used so is copied, with its hooks.
 */
export function everyFrame<M extends InstancedMesh>(mesh: M, extra?: string): M {
  const count = mesh.instanceMatrix.count;
  const color = !!mesh.instanceColor;
  const attr = extra ? (mesh.geometry.getAttribute(extra) as BufferAttribute) : undefined;
  const k = 4 + (color ? 1 : 0) + (attr ? 1 : 0);
  const data = new Float32Array(k * 4 * count);
  const tex = new DataTexture(data, k, count, RGBAFormat, FloatType);
  tex.needsUpdate = true;
  rowsOf.set(mesh, { tex, data, k, color, extra: attr });

  let mat = mesh.material as Material;
  const own = ownHooks.get(mat);
  if (own) {
    const copy = mat.clone();
    copy.onBeforeCompile = own.onBeforeCompile;
    copy.customProgramCacheKey = own.customProgramCacheKey;
    mat = copy;
    mesh.material = copy;
  }
  ownHooks.set(mat, { onBeforeCompile: mat.onBeforeCompile, customProgramCacheKey: mat.customProgramCacheKey });
  const before = mat.onBeforeCompile.bind(mat);
  const key = mat.customProgramCacheKey.bind(mat);
  const swz = attr ? ["x", "xy", "xyz", "xyzw"][attr.itemSize - 1]! : "";
  mat.onBeforeCompile = (s, r) => {
    before(s, r);
    s.uniforms.sqRows = { value: tex };
    let vs = s.vertexShader;
    if (extra) vs = vs.replace(new RegExp(`attribute\\s+(float|vec2|vec3|vec4)\\s+${extra}\\s*;`), "");
    const head =
      "uniform highp sampler2D sqRows;\nmat4 sqM;\nvec3 sqC;\nvec4 sqX;\n#define instanceMatrix sqM\n" +
      (color ? "#define instanceColor sqC\n" : "") +
      (extra ? `#define ${extra} sqX.${swz}\n` : "");
    const load =
      "\n  int sqI = gl_InstanceID;\n  sqM = mat4(texelFetch(sqRows, ivec2(0, sqI), 0), texelFetch(sqRows, ivec2(1, sqI), 0), texelFetch(sqRows, ivec2(2, sqI), 0), texelFetch(sqRows, ivec2(3, sqI), 0));\n" +
      (color ? "  sqC = texelFetch(sqRows, ivec2(4, sqI), 0).rgb;\n" : "") +
      (extra ? `  sqX = texelFetch(sqRows, ivec2(${color ? 5 : 4}, sqI), 0);\n` : "");
    s.vertexShader = head + vs.replace(/void\s+main\s*\(\s*\)\s*\{/, (m) => m + load);
  };
  mat.customProgramCacheKey = () => `${key()}|sqRows${color ? 1 : 0}${attr ? attr.itemSize : 0}`;
  mesh.userData.noAO = true;
  return mesh;
}

/** Sends the first `n` instances written this frame of a mesh made by everyFrame, through its texture. */
export function sendInstances(mesh: InstancedMesh, n: number): void {
  const r = rowsOf.get(mesh);
  if (!r) return;
  const { data, k } = r;
  const m = mesh.instanceMatrix.array as Float32Array;
  const c = mesh.instanceColor?.array as Float32Array | undefined;
  const x = r.extra?.array as Float32Array | undefined;
  const size = r.extra?.itemSize ?? 0;
  for (let i = 0; i < n; i++) {
    const o = i * k * 4;
    data.set(m.subarray(i * 16, i * 16 + 16), o);
    let t = o + 16;
    if (r.color && c) {
      data[t] = c[i * 3]!;
      data[t + 1] = c[i * 3 + 1]!;
      data[t + 2] = c[i * 3 + 2]!;
      t += 4;
    }
    if (x) for (let j = 0; j < size; j++) data[t + j] = x[i * size + j]!;
  }
  r.tex.needsUpdate = true;
}

/** Lets go of a mesh's texture, with the mesh. */
export function disposeInstances(mesh: InstancedMesh): void {
  rowsOf.get(mesh)?.tex.dispose();
  rowsOf.delete(mesh);
}
