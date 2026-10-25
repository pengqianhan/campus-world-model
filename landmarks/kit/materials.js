// The building's materials, by name (the parts use these names): limestone in three finishes, glass,
// timber, slate, iron, the clock dial and the dark louvres. Weathering is added in world space in the
// shaders (onBeforeCompile): grime low down and on the tops of ledges, faint drip streaks, lichen.
// A model moved and turned into place (the campus map) takes it in its own frame instead (`space`).
import * as THREE from "three";
import { METRES, ashlar, dressed, smoothAshlar, rng } from "./textures.js";

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
/** The varyings' frame: "world", or "object" (the model's own, before the object is moved and turned). */
const vertBody = (space) => `
  vec4 wpw = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
  wpw = instanceMatrix * wpw;
  #endif
  vWPos = ${space === "object" ? "wpw.xyz" : "(modelMatrix * wpw).xyz"};
  vWNrm = normalize(${space === "object" ? "objectNormal" : "mat3(modelMatrix) * objectNormal"});
`;

/** Adds world position and normal varyings and runs `frag` (GLSL editing diffuseColor) after the map. */
function hook(material, key, frag, extraUniforms = {}, after = "#include <map_fragment>", space = "world") {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, extraUniforms);
    shader.vertexShader = VERT_DECL + shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n" + vertBody(space));
    shader.fragmentShader = NOISE + Object.keys(extraUniforms).map((k) => `uniform ${extraUniforms[k].type ?? "float"} ${k};\n`).join("") +
      shader.fragmentShader.replace(after, after + "\n" + frag);
  };
  material.customProgramCacheKey = () => (space === "world" ? key : `${key}-${space}`);
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

function stone(t, roughness, { normalScale = 1.6, weather = 1, tower = 1, tint = [1, 1, 1], key, space }) {
  const m = new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, roughness, color: 0xffffff });
  m.normalScale.set(normalScale, normalScale);
  m.userData.metres = t.metres;
  return hook(m, key, WEATHER, { weatherAmt: { value: weather }, towerAmt: { value: tower }, stoneTint: { value: new THREE.Vector3(...tint), type: "vec3" } }, undefined, space);
}

/** Glass: dark, reflecting sky and trees, with leaded/sash bars and a dim interior behind. */
function glass(bars = false, space) {
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
  }`, { glassBars: { value: bars ? 1 : 0 } }, undefined, space);
}

/** Timber: warm brown, with a grain running up the boards. */
function timber(space) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62 });
  m.userData.metres = 2;
  return hook(m, "timber-v1", /* glsl */ `
  {
    vec3 P = vWPos;
    float grain = wn(vec3(P.x * 30.0 + P.z * 30.0, P.y * 1.2, 0.5)) * 0.6 + wn(vec3(P.x * 90.0, P.y * 3.0, P.z * 90.0)) * 0.4;
    diffuseColor.rgb = mix(vec3(0.17, 0.075, 0.03), vec3(0.32, 0.16, 0.07), grain);
  }`, {}, undefined, space);
}

/** Slate and lead roofs: dark grey with courses of slates. */
function roof(space) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
  m.userData.metres = 2;
  return hook(m, "roof-v1", /* glsl */ `
  {
    vec3 P = vWPos;
    float course = smoothstep(0.0, 0.06, fract(P.y / 0.18 + P.x * 0.0));
    float slate = wh(floor(vec3(P.x / 0.3 + floor(P.y / 0.18) * 0.5, P.y / 0.18, P.z / 0.3)));
    diffuseColor.rgb = vec3(0.095, 0.10, 0.11) * (0.8 + 0.4 * slate) * (0.7 + 0.3 * course);
  }`, {}, undefined, space);
}

// Painted timber (Old Government House): shader hooks only, no textures, so a model that does not use
// them pays nothing. Paint is barely weathered: a faint broad unevenness and a little dirt at the foot.
const PAINT_TONE = "(0.97 + 0.06 * wfbm(P * 0.45)) * mix(0.90, 1.0, smoothstep(0.0, 0.9, P.y + 0.4))";

/**
 * Painted weatherboards: horizontal boards 0.2 m high on every wall whatever way it faces, each
 * lapped over the one below, so a fine shadow runs under every board's lower edge. The lines fade to
 * their average where a board is under about two pixels, so the far walls do not shimmer.
 */
function boards(color, space) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.78 });
  m.userData.metres = 2;
  return hook(m, "boards-v1", /* glsl */ `
  {
    vec3 P = vWPos, N = normalize(vWNrm);
    float wall = 1.0 - smoothstep(0.55, 0.8, abs(N.y));               // walls only, not sills and soffits
    float t = P.y / 0.2, f = fract(t), w = fwidth(t);
    // under the board above: a soft shadow over the top few centimetres of each board
    float sh = 1.0 - smoothstep(0.0, 0.22 + w, 1.0 - f);
    // the board's own lower edge, a lip that faces down
    float lip = 1.0 - smoothstep(0.0, 0.05 + w, f);
    float g = 1.0 - 0.42 * sh - 0.12 * lip;
    g *= 0.985 + 0.03 * wh(vec3(floor(t), floor(P.x * 0.25 + P.z * 0.25), 3.0));  // board to board
    g = mix(0.95, g, 1.0 - smoothstep(0.35, 0.7, w));                // their average when too fine to draw
    diffuseColor.rgb *= mix(1.0, g, wall) * ${PAINT_TONE};
  }`, {}, undefined, space);
}

/** Smooth paint (trim, white work): the paint's faint unevenness only. One shader for both. */
function painted(color, roughness, space) {
  const m = new THREE.MeshStandardMaterial({ color, roughness });
  m.userData.metres = 2;
  return hook(m, "paint-v1", `{ vec3 P = vWPos; diffuseColor.rgb *= ${PAINT_TONE}; }`, {}, undefined, space);
}

/**
 * A pale painted roof, smooth, with the paint's faint unevenness. Its hips and ridges are not drawn
 * darker: the kit's faces are flat and share no corners, so a shader cannot find where two meet.
 */
function roofPale(color, space) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  m.userData.metres = 2;
  return hook(m, "roofPale-v1", /* glsl */ `
  {
    vec3 P = vWPos;
    diffuseColor.rgb *= 0.975 + 0.05 * wfbm(P * 0.3);
  }`, {}, undefined, space);
}

/**
 * Old sash glazing (Old Government House): the photographs show its panes grey-blue and light, full of
 * the bright hazy sky, not dark. So twice the sky is reflected that `glass` reflects, a little blurred
 * by the old glass's waviness, over rooms behind lighter than `glass`'s (measured: a window of hRE5's
 * upper view, glass and bars, about 117 luma). No bars: the sash kit draws them.
 */
function glassPale(space) {
  const m = new THREE.MeshPhysicalMaterial({ color: 0x1a1f22, roughness: 0.12, metalness: 0, ior: 1.52, envMapIntensity: 6.0, specularIntensity: 1 });
  m.userData.metres = 2;
  return hook(m, "glassPale-v1", /* glsl */ `
  {
    vec3 P = vWPos, N = normalize(vWNrm);
    float side = abs(N.x) > abs(N.z) ? P.z : P.x;
    float rooms = wn(vec3(side * 0.9, P.y * 1.3, 3.0));
    diffuseColor.rgb = mix(vec3(0.14, 0.15, 0.16), vec3(0.26, 0.24, 0.21), smoothstep(0.35, 0.85, rooms));
  }`, {}, undefined, space);
}

/**
 * Red brick (Old Choral Hall): courses 0.086 m high (a 76 mm brick and its 10 mm joint), bricks 0.23 m
 * long, each course set half a brick along from the one below, on every wall whatever way it faces.
 * Pale mortar joints, a little brick-to-brick variation, a faint broad unevenness. The joints fade to
 * their average where a course is under about two pixels, so a far wall does not shimmer. Shader hooks
 * only, no textures, so a model that does not use it pays nothing.
 */
function brick(space) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88 });
  m.userData.metres = 2;
  return hook(m, "brick-v1", /* glsl */ `
  {
    vec3 P = vWPos, N = normalize(vWNrm);
    float side = abs(N.x) > abs(N.z) ? P.z : P.x;
    float t = P.y / 0.086, row = floor(t);
    float s = side / 0.23 + 0.5 * mod(row, 2.0), col = floor(s);
    float wt = fwidth(t), ws = fwidth(s);
    // joints: 10 mm of the 86 mm course, 10 mm of the 230 mm brick
    float jy = 1.0 - smoothstep(0.0, 0.116 + wt, min(fract(t), 1.0 - fract(t)) * 2.0);
    float jx = 1.0 - smoothstep(0.0, 0.043 + ws, min(fract(s), 1.0 - fract(s)) * 2.0);
    float joint = max(jy, jx) * (1.0 - smoothstep(0.35, 0.7, max(wt, ws * 0.37)));
    float b = wh(vec3(row, col, 7.0));
    vec3 c = mix(vec3(0.235, 0.080, 0.036), vec3(0.305, 0.122, 0.056), b) * (0.94 + 0.12 * wfbm(P * 0.6));
    vec3 mortar = vec3(0.42, 0.38, 0.31);
    float wall = 1.0 - smoothstep(0.55, 0.8, abs(N.y));
    diffuseColor.rgb = mix(c, mix(c, mortar, joint * 0.6), wall);
  }`, {}, undefined, space);
}

/** The materials drawn with makeTextures()'s textures: a model with none of them needs no textures. */
export const STONE = ["ashlar", "smooth", "dressed", "shade"];

/**
 * The stone textures the materials are drawn with. They take about a second to make at "high", so
 * a page that must stay responsive makes them in a worker and gives them to makeMaterials.
 */
export function makeTextures(quality = "high") {
  return { ashlar: ashlar(7, quality === "low" ? 1024 : 2048), smooth: smoothAshlar(13, 1024), dressed: dressed(11, 1024) };
}

/**
 * The materials, by name. `textures` are makeTextures()'s, made here when not given. `space` is the
 * frame the weathering is laid in: "world" (the viewer), or "object", the model's own, for a model
 * that is moved and turned into place (the campus map).
 */
export function makeMaterials(quality = "high", textures = makeTextures(quality), { space = "world" } = {}) {
  // A set not given (a model with no stone asks for none): its stone is made without maps, never drawn.
  const set = (k) => textures[k] ?? { map: null, normalMap: null, metres: 2 };
  const dr = set("dressed");
  const m = {
    ashlar: stone(set("ashlar"), 0.9, { normalScale: 1.1, key: "ashlar-v2", tint: [0.97, 0.97, 0.97], space }),
    smooth: stone(set("smooth"), 0.82, { normalScale: 1.0, key: "smooth-v2", tint: [1.04, 1.04, 1.03], space }),
    dressed: stone(dr, 0.78, { normalScale: 1.0, weather: 0.7, key: "dressed-v2", tint: [1.08, 1.075, 1.06], space }),
    glass: glass(new URLSearchParams(globalThis.location?.search ?? "").get("glassbars") === "1", space),
    timber: timber(space),
    roof: roof(space),
    iron: Object.assign(new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.55, metalness: 0.4 }), { userData: { metres: 2 } }),
    dial: Object.assign(new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.4, emissive: 0x2a2924 }), { userData: { metres: 2 } }),
    // the dark interiors behind openings (belfry, doorways): matte, very dark warm grey, never pure black
    void: Object.assign(new THREE.MeshStandardMaterial({ color: 0x1b1916, roughness: 0.95, metalness: 0 }), { userData: { metres: 2 } }),
    // recessed blind panels: the same dressed stone, a little darker for the shadow of the recess
    shade: stone(dr, 0.85, { normalScale: 1.0, weather: 0.8, key: "shade-v2", tint: [0.8, 0.79, 0.77], space }),
    // painted timber (Old Government House): shader hooks, no textures
    boards: boards(0xece4d3, space),                    // weatherboard walls, pale cream-yellow
    trim: painted(0xe6c790, 0.6, space),                // surrounds, pilasters, bands and brackets, yellow-ochre
    paint: painted(0xf2f0ea, 0.5, space),               // white: glazing bars, balusters, chimney caps
    roofPale: roofPale(0xebe8e1, space),                // light grey roof (the photographs blow it near white)
    glassPale: glassPale(space),                        // sash glazing, light with the sky it reflects
    // brick and painted render (Old Choral Hall): shader hooks, no textures
    brick: brick(space),                                // red brick, pale joints
    render: painted(0xc8ae8a, 0.7, space),              // cream painted render: pilasters, columns, bands, cornices
    roofGrey: roofPale(0x7a8088, space),                // mid-grey metal roofs (the 2023 aerial: about 110-150 luma)
    // plain walls for a part drawn as the campus map's estimated block, not as seen (Old Choral Hall's rest):
    // no texture and no shader, so that it claims no surface; the map's wall colour for a teaching building by day
    plain: Object.assign(new THREE.MeshStandardMaterial({ color: 0xfaf1dc, roughness: 0.95, metalness: 0 }), { userData: { metres: 2 } }),
    // the General Library: shader hooks, no textures (the paint's own shader, so nothing new to make)
    grey: painted(0x8e9194, 0.75, space),               // mid-grey cladding and piers
  };
  return m;
}

/**
 * The materials without their textures: enough to build a model's geometry (worldUV reads each
 * texture's `metres`), quickly and where nothing is drawn, as in a worker. Not for drawing.
 */
export function geometryMaterials() {
  const blank = (metres) => ({ map: null, normalMap: null, metres });
  return makeMaterials("high", { ashlar: blank(METRES.ashlar), smooth: blank(METRES.smoothAshlar), dressed: blank(METRES.dressed) });
}

export { hook, NOISE, rng };
