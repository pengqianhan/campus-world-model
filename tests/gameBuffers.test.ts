import { describe, expect, it } from "vitest";
import { BoxGeometry, Color, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshBasicMaterial, ShaderMaterial, type DataTexture, type Object3D, type WebGLProgramParametersWithUniforms, type WebGLRenderer } from "three";
import { everyFrame, sendInstances } from "../src/scene/gameBuffers.ts";
import { Debris, Decals, Missiles, Puffs, Shadows, Shocks, Sparks, Telegraphs } from "../src/scene/gameFx.ts";

/** The instanced meshes under an object. */
function instanced(root: Object3D): InstancedMesh[] {
  const out: InstancedMesh[] = [];
  root.traverse((o) => {
    if ((o as InstancedMesh).isInstancedMesh) out.push(o as InstancedMesh);
  });
  return out;
}

/** What three would hand onBeforeCompile for a material, with a vertex shader to rewrite. */
function compile(m: InstancedMesh, vertexShader: string): WebGLProgramParametersWithUniforms {
  const s = { uniforms: {} as Record<string, { value: unknown }>, vertexShader, fragmentShader: "void main() {}" } as unknown as WebGLProgramParametersWithUniforms;
  (m.material as MeshBasicMaterial).onBeforeCompile(s, {} as WebGLRenderer);
  return s;
}

describe("instances written in every frame go through a texture (gameBuffers.ts)", () => {
  it("every effect's instanced mesh takes its instances from a texture, and is left out of the occlusion", () => {
    const pools: Object3D[] = [new Sparks().mesh, new Puffs().mesh, new Shocks().mesh, new Shadows().mesh, new Decals().group, new Debris().group, new Telegraphs().group, new Missiles().group];
    const meshes = pools.flatMap(instanced);
    expect(meshes.length).toBeGreaterThan(10);
    for (const m of meshes) {
      expect(m.userData.noAO, m.geometry.type).toBe(true);
      const s = compile(m, "attribute float aAlpha;\nattribute vec2 aRW;\nattribute vec4 aDecal;\nvoid main() {\n  gl_Position = vec4(0.0);\n}");
      expect(s.uniforms.sqRows, m.geometry.type).toBeDefined();
      expect(s.vertexShader).toContain("#define instanceMatrix sqM");
      expect(s.vertexShader).toMatch(/void main\(\) \{\n\s+int sqI = gl_InstanceID;/);
    }
  });

  it("takes an attribute of the mesh's own from the texture in its place", () => {
    const m = new Puffs().mesh;
    const s = compile(m, "attribute float aAlpha;\nvoid main() { vAlpha = aAlpha; }");
    expect(s.vertexShader).not.toMatch(/attribute\s+float\s+aAlpha/);
    expect(s.vertexShader).toContain("#define aAlpha sqX.x");
  });

  it("packs each instance's matrix, colour and own attribute into a row of its texture", () => {
    const g = new BoxGeometry();
    g.setAttribute("aRW", new InstancedBufferAttribute(new Float32Array(4 * 2), 2));
    const m = new InstancedMesh(g, new ShaderMaterial(), 4);
    m.setColorAt(0, new Color(1, 1, 1));
    everyFrame(m, "aRW");
    m.setMatrixAt(1, new Matrix4().makeTranslation(3, 4, 5));
    m.instanceColor!.setXYZ(1, 0.25, 0.5, 0.75);
    (g.getAttribute("aRW") as InstancedBufferAttribute).setXY(1, 7, 8);
    sendInstances(m, 2);
    const s = compile(m, "void main() {}");
    const tex = s.uniforms.sqRows!.value as DataTexture;
    const d = tex.image.data as Float32Array;
    const row = 6 * 4;
    expect([d[row + 12], d[row + 13], d[row + 14]]).toEqual([3, 4, 5]);
    expect([d[row + 16], d[row + 17], d[row + 18]]).toEqual([0.25, 0.5, 0.75]);
    expect([d[row + 20], d[row + 21]]).toEqual([7, 8]);
  });

  it("gives a material shared between two meshes a copy of its own, hooks and all", () => {
    const mat = new MeshBasicMaterial();
    mat.customProgramCacheKey = () => "shared";
    const a = everyFrame(new InstancedMesh(new BoxGeometry(), mat, 2));
    const b = everyFrame(new InstancedMesh(new BoxGeometry(), mat, 2));
    expect(a.material).not.toBe(b.material);
    expect((b.material as MeshBasicMaterial).customProgramCacheKey()).toBe("shared|sqRows00");
    // The copy injects its texture once, not the first mesh's as well.
    const s = compile(b, "void main() {}");
    expect(s.vertexShader.match(/uniform highp sampler2D sqRows;/g)).toHaveLength(1);
  });
});
