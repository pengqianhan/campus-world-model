import { DynamicDrawUsage, type BufferAttribute, type BufferGeometry, type InstancedMesh, type Mesh } from "three";

/**
 * Buffers the game writes in every frame (where its foes, pick-ups and effects are, their colours,
 * and the walker's trail), and how they are kept from stalling the GPU process.
 *
 * Chrome on Windows draws WebGL through ANGLE on Direct3D 11. ANGLE streams a buffer marked dynamic
 * to the GPU afresh for each draw, and binds one marked static directly; written to while a frame in
 * flight still reads it, a static buffer makes the GPU process wait for the GPU to finish all it was
 * given. ANGLE also turns a dynamic buffer static once it has been drawn from enough between two
 * writes: about three times its size, where a draw of an instanced mesh counts the mesh's vertices,
 * not its instances (measured: 768 vertices drawn from a buffer of 200 instances stalls, of 270 does
 * not). On an Intel UHD 770 either way cost 18 ms of the GPU process's time a frame and took the walk
 * from 60 to 45 fps as soon as the game was on (scratchpad shots-r7/perf, round 7).
 *
 * So each buffer written in every frame is marked dynamic, and has room for at least ROOM instances
 * for each vertex drawn (the scene and the ambient occlusion each draw a mesh once a frame); and only
 * the instances in use are sent.
 */
export const ROOM = 0.8;

/** Vertices one draw of a geometry goes through. */
function drawn(g: BufferGeometry): number {
  return g.index ? g.index.count : g.getAttribute("position").count;
}

/** The instances a buffer of a geometry written in every frame is made for: `want`, or more. */
export function roomFor(g: BufferGeometry, want: number): number {
  return Math.max(want, Math.ceil(drawn(g) * ROOM));
}

const extras = new WeakMap<Mesh, BufferAttribute[]>();

/**
 * Marks an instanced mesh's matrices and colours (when it has them), and any of its geometry's
 * attributes named, as written in every frame. The mesh must have been made with roomFor's count.
 */
export function everyFrame<M extends InstancedMesh>(mesh: M, ...names: string[]): M {
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.instanceColor?.setUsage(DynamicDrawUsage);
  const list = names.map((n) => (mesh.geometry.getAttribute(n) as BufferAttribute).setUsage(DynamicDrawUsage));
  extras.set(mesh, list);
  return mesh;
}

/** Sends the first `n` instances written this frame of a mesh marked by everyFrame. */
export function sendInstances(mesh: InstancedMesh, n: number): void {
  send(mesh.instanceMatrix, n);
  if (mesh.instanceColor) send(mesh.instanceColor, n);
  for (const a of extras.get(mesh) ?? []) send(a, n);
}

function send(a: BufferAttribute, n: number): void {
  a.clearUpdateRanges();
  if (n < a.count) a.addUpdateRange(0, n * a.itemSize);
  a.needsUpdate = true;
}
