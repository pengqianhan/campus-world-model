// The building's materials, by name (the parts use these names): limestone in three finishes, glass,
// timber, slate, iron, the clock dial and the dark louvres. Weathering is added in world space in the
// shaders (onBeforeCompile): grime low down and on the tops of ledges, faint drip streaks, lichen.
import * as THREE from "three";
import { ashlar, dressed, smoothAshlar, rng } from "../textures.js";

// World-space noise shared by the weathering hooks.
const NOISE = /* glsl */ `
varying vec3 vWPos; varying vec3 vWNrm;
float wh(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float wn(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(wh(i), wh(i + vec3(1, 0, 0)), f.x), mix(wh(i + vec3(0, 1, 0)), wh(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(wh(i + vec3(0, 0, 1)), wh(i + vec3(1, 0, 1)), f.x), mix(wh(i + vec3(0, 1, 1)), wh(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float wfbm(vec3 x) { return 0.5 * wn(x) + 0.25 * wn(x * 2.03 + 7.1) + 0.125 * wn(x * 4.01 + 3.7) + 0.0625 * wn(x * 8.05 + 1.3); }
`;

const VERT_DECL = "varying vec3 vWPos; varying vec3 vWNrm;\n";
const VERT_BODY = `
  vec4 wpw = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
  wpw = instanceMatrix * wpw;
  #endif
  vWPos = (modelMatrix * wpw).xyz;
  vWNrm = normalize(mat3(modelMatrix) * objectNormal);
`;

/** Adds world position and normal varyings and runs `frag` (GLSL editing diffuseColor) after the map. */
function hook(material, key, frag, extraUniforms = {}, after = "#include <map_fragment>") {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, extraUniforms);
    shader.vertexShader = VERT_DECL + shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n" + VERT_BODY);
    shader.fragmentShader = NOISE + Object.keys(extraUniforms).map((k) => `uniform ${extraUniforms[k].type ?? "float"} ${k};\n`).join("") +
      shader.fragmentShader.replace(after, after + "\n" + frag);
  };
  material.customProgramCacheKey = () => key;
  return material;
}

// Weathering of limestone: everything multiplies diffuseColor.rgb.
const WEATHER = /* glsl */ `
{
  vec3 P = vWPos, N = normalize(vWNrm);
  float y = P.y;
  float side = abs(N.x) > abs(N.z) ? P.z : P.x;           // along the face
  float large = wfbm(P * 0.35);                               // broad patches of tone
  float g = 1.0;
  // grime and splash-back near the ground, ragged at its top
  g *= mix(0.80, 1.0, smoothstep(0.15, 1.6 + 0.8 * large, y));
  // drip streaks: long vertical runs, more below ledges, faint
  float streak = wn(vec3(side * 2.3, y * 0.08, side * 0.7)) * wn(vec3(side * 7.0, y * 0.25, 1.0));
  g *= 1.0 - weatherAmt * 0.16 * smoothstep(0.25, 0.75, streak) * (1.0 - abs(N.y));
  // tops of ledges and sills hold dirt
  g *= mix(1.0, 0.78 + 0.12 * large, smoothstep(0.55, 0.95, N.y));
  // patchy weathering over the whole face
  g *= 0.9 + 0.18 * large;
  // stone-to-stone variation at the scale of the blocks
  g *= 0.93 + 0.12 * wn(floor(P * vec3(1.6, 2.4, 1.6)) + 0.5);
  // the tower and its crown are greyer and more weathered than the walls below
  g *= mix(1.0, 0.86 + 0.08 * wn(P * vec3(0.8, 0.12, 0.8)), smoothstep(17.0, 22.0, y) * towerAmt);
  // lichen and soot speckles, denser low down
  float sp = wn(P * 23.0 + 11.0);
  float dens = mix(0.86, 0.94, smoothstep(0.0, 6.0, y));
  float lich = smoothstep(dens, dens + 0.04, sp) * weatherAmt;
  diffuseColor.rgb *= g;
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.62, 0.66, 0.56), lich * 0.35);
  diffuseColor.rgb *= stoneTint;
}
`;

function stone(t, roughness, { normalScale = 1.6, weather = 1, tower = 1, tint = [1, 1, 1], key }) {
  const m = new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, roughness, color: 0xffffff });
  m.normalScale.set(normalScale, normalScale);
  m.userData.metres = t.metres;
  return hook(m, key, WEATHER, { weatherAmt: { value: weather }, towerAmt: { value: tower }, stoneTint: { value: new THREE.Vector3(...tint), type: "vec3" } });
}

/** Glass: dark, reflecting sky and trees, with leaded/sash bars and a dim interior behind. */
function glass(bars = false) {
  const m = new THREE.MeshPhysicalMaterial({ color: 0x1a1f22, roughness: 0.05, metalness: 0, ior: 1.52, envMapIntensity: 3.0, specularIntensity: 1 });
  m.userData.metres = 2;
  return hook(m, "glass-v3", /* glsl */ `
  {
    vec3 P = vWPos, N = normalize(vWNrm);
    float side = abs(N.x) > abs(N.z) ? P.z : P.x;
    // glimpses of the interior: dim, warm, broken into blocks (ceilings, curtains, shelves)
    float rooms = wn(vec3(side * 0.9, P.y * 1.3, 3.0));
    float ceiling = smoothstep(0.25, 0.0, fract(P.y / 3.6 + 0.1)) * 0.5;
    vec3 inside = mix(vec3(0.035, 0.035, 0.035), vec3(0.16, 0.13, 0.10), smoothstep(0.35, 0.85, rooms)) + ceiling * vec3(0.10, 0.10, 0.09);
    // optional glazing-bar grid in world space (off by default: the window kit draws bars per pane)
    float bar = 0.0;
    if (glassBars > 0.5) { vec2 e = abs(fract(vec2(side / 0.42, P.y / 0.5)) - 0.5); bar = smoothstep(0.47, 0.49, max(e.x, e.y)); }
    diffuseColor.rgb = mix(inside, vec3(0.30, 0.30, 0.28), bar * 0.6);
  }`, { glassBars: { value: bars ? 1 : 0 } });
}

/** Timber: warm brown, with a grain running up the boards. */
function timber() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62 });
  m.userData.metres = 2;
  return hook(m, "timber-v1", /* glsl */ `
  {
    vec3 P = vWPos;
    float grain = wn(vec3(P.x * 30.0 + P.z * 30.0, P.y * 1.2, 0.5)) * 0.6 + wn(vec3(P.x * 90.0, P.y * 3.0, P.z * 90.0)) * 0.4;
    diffuseColor.rgb = mix(vec3(0.17, 0.075, 0.03), vec3(0.32, 0.16, 0.07), grain);
  }`);
}

/** Slate and lead roofs: dark grey with courses of slates. */
function roof() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
  m.userData.metres = 2;
  return hook(m, "roof-v1", /* glsl */ `
  {
    vec3 P = vWPos;
    float course = smoothstep(0.0, 0.06, fract(P.y / 0.18 + P.x * 0.0));
    float slate = wh(floor(vec3(P.x / 0.3 + floor(P.y / 0.18) * 0.5, P.y / 0.18, P.z / 0.3)));
    diffuseColor.rgb = vec3(0.095, 0.10, 0.11) * (0.8 + 0.4 * slate) * (0.7 + 0.3 * course);
  }`);
}

export function makeMaterials(quality = "high") {
  const big = quality === "low" ? 1024 : 2048;
  const dr = dressed(11, 1024);
  const m = {
    ashlar: stone(ashlar(7, big), 0.9, { normalScale: 1.1, key: "ashlar-v2", tint: [0.97, 0.97, 0.97] }),
    smooth: stone(smoothAshlar(13, 1024), 0.82, { normalScale: 1.0, key: "smooth-v2", tint: [1.04, 1.04, 1.03] }),
    dressed: stone(dr, 0.78, { normalScale: 1.0, weather: 0.7, key: "dressed-v2", tint: [1.08, 1.075, 1.06] }),
    glass: glass(new URLSearchParams(globalThis.location?.search ?? "").get("glassbars") === "1"),
    timber: timber(),
    roof: roof(),
    iron: Object.assign(new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.55, metalness: 0.4 }), { userData: { metres: 2 } }),
    dial: Object.assign(new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.4, emissive: 0x2a2924 }), { userData: { metres: 2 } }),
    // the dark interiors behind openings (belfry, doorways): matte, very dark warm grey, never pure black
    void: Object.assign(new THREE.MeshStandardMaterial({ color: 0x1b1916, roughness: 0.95, metalness: 0 }), { userData: { metres: 2 } }),
    // recessed blind panels: the same dressed stone, a little darker for the shadow of the recess
    shade: stone(dr, 0.85, { normalScale: 1.0, weather: 0.8, key: "shade-v2", tint: [0.8, 0.79, 0.77] }),
  };
  return m;
}

export { hook, NOISE, rng };
